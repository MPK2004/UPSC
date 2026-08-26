"""
Book ingestion pipeline — the worker GitHub Actions runs on a schedule.

For one book at a time: downloads the PDF, extracts its top-level chapters,
then for each chapter runs the agentic research+generation loop (web research
-> free LLM synthesis) and writes cards/PYQs/guides back to Supabase.

Designed to be safely re-run on a schedule:
- Progress is checkpointed per-chapter in the `chapters.status` column, so a
  run that gets cut off (time budget, crash, rate limits) picks up exactly
  where it left off next time rather than restarting the book.
- A self-imposed wall-clock budget (default 12 minutes) keeps one run well
  inside the ~15 minute cron interval, so runs don't overlap.
"""

import os
import sys
import time
import tempfile
from datetime import datetime, timezone

from services.supabase_client import supabase
from services.pdf_structure import extract_top_level_chapters, extract_chapter_text
from services.web_research import research_topic, format_research_for_prompt
from llm_service import generate_chapter_content, generate_book_guide, recalibrate_importance

RUN_BUDGET_SECONDS = int(os.getenv("INGEST_RUN_BUDGET_SECONDS", "720"))
# Comfortably longer than one run budget, so a book that's genuinely still
# being worked on (possibly by an overlapping run) isn't reclaimed out from
# under it, but a run that got killed outright (crash, GH Actions hard
# timeout) doesn't block the queue forever either.
STALE_PROCESSING_SECONDS = RUN_BUDGET_SECONDS * 2
STORAGE_BUCKET = "book-uploads"

_start_time = time.monotonic()


def _time_left() -> float:
    return RUN_BUDGET_SECONDS - (time.monotonic() - _start_time)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seconds_since(iso_timestamp: str) -> float:
    ts = datetime.fromisoformat(iso_timestamp.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - ts).total_seconds()


def _claim_book() -> dict | None:
    """Prefer resuming a book already in progress over starting a new one -
    unless it's been "processing" far longer than one run could ever take,
    which means whatever run claimed it never got the chance to mark it
    failed (crashed, got killed by the job timeout). That book is reclaimed
    as if it were freshly pending rather than blocking the queue forever."""
    resuming = supabase.table("books").select("*").eq("status", "processing").order("uploaded_at").limit(1).execute()
    if resuming.data:
        book = resuming.data[0]
        claimed_at = book.get("claimed_at")
        if claimed_at and _seconds_since(claimed_at) < STALE_PROCESSING_SECONDS:
            return book
        print(f"[ingest_pipeline] Book '{book['title']}' has been stuck in 'processing' too long — reclaiming it.")
    else:
        book = None

    pending = supabase.table("books").select("*").eq("status", "pending").order("uploaded_at").limit(1).execute()
    candidate = pending.data[0] if pending.data else book
    if not candidate:
        return None

    try:
        supabase.table("books").update({"status": "processing", "claimed_at": _now_iso()}).eq("id", candidate["id"]).execute()
    except Exception as e:
        # Fallback if claimed_at column does not exist yet on books table in Supabase
        print(f"[ingest_pipeline] Note: claimed_at update failed ({e}), updating status only.")
        supabase.table("books").update({"status": "processing"}).eq("id", candidate["id"]).execute()

    candidate["status"] = "processing"
    return candidate


def _download_pdf(storage_path: str) -> str:
    data = supabase.storage.from_(STORAGE_BUCKET).download(storage_path)
    fd, local_path = tempfile.mkstemp(suffix=".pdf")
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    return local_path


def _ensure_chapters_seeded(book: dict, pdf_path: str) -> list[dict]:
    existing = supabase.table("chapters").select("*").eq("book_id", book["id"]).order("chapter_number").execute()
    if existing.data:
        return existing.data

    extracted = extract_top_level_chapters(pdf_path)
    if not extracted:
        raise RuntimeError("Could not extract any chapters from this PDF (no outline, heuristic found nothing).")

    rows = [
        {
            "book_id": book["id"],
            "chapter_number": ch["chapter_number"],
            "title": ch["title"],
            "page_start": ch["page_start"],
            "page_end": ch["page_end"],
            "status": "pending",
        }
        for ch in extracted
    ]
    inserted = supabase.table("chapters").insert(rows).execute()
    return inserted.data


def _resolve_sources(ids, findings: list[dict]) -> list[dict]:
    """Map LLM-cited finding numbers back to the real {title, url, tier} we
    actually fetched — dedupes and silently drops any number outside the
    known range (a hallucinated citation) rather than trusting the LLM."""
    by_id = {f["id"]: {"title": f["title"], "url": f["url"], "tier": f["tier"]} for f in findings}
    return [by_id[i] for i in dict.fromkeys(ids or []) if i in by_id]


def _insert_with_sources_fallback(table: str, rows: list[dict]):
    """Insert rows that include a `sources` key, falling back to inserting
    without it if the column doesn't exist yet on this Supabase project
    (schema migration not yet applied) — same pattern already used elsewhere
    in this file for claimed_at/error_message."""
    try:
        supabase.table(table).insert(rows).execute()
    except Exception as e:
        print(f"[ingest_pipeline] Note: '{table}' insert with sources failed ({e}), retrying without sources.")
        stripped = [{k: v for k, v in row.items() if k != "sources"} for row in rows]
        supabase.table(table).insert(stripped).execute()


def _process_chapter(book: dict, chapter: dict, pdf_path: str):
    supabase.table("chapters").update({"status": "processing"}).eq("id", chapter["id"]).execute()

    chapter_text = extract_chapter_text(pdf_path, chapter["page_start"], chapter["page_end"])
    if not chapter_text.strip():
        raise RuntimeError(f"No extractable text for chapter '{chapter['title']}' (pages {chapter['page_start']}-{chapter['page_end']}).")

    subject = book.get("subject") or book["title"]
    findings = research_topic(chapter["title"], subject=subject)
    research_text = format_research_for_prompt(findings)

    result = generate_chapter_content(
        chapter_title=chapter["title"],
        chapter_text=chapter_text,
        research_text=research_text,
        subject=subject,
    )
    if not result:
        raise RuntimeError("LLM generation failed for this chapter after all retries.")

    cards = result.get("cards", [])
    pyqs = result.get("pyqs", [])

    if cards:
        _insert_with_sources_fallback("cards", [
            {
                "chapter_id": chapter["id"],
                "title": c.get("title", ""),
                "concept_type": c.get("concept_type", "Fact"),
                "bullet_points": c.get("bullet_points", []),
                "mnemonic": c.get("mnemonic", ""),
                "upsc_prelims_tip": c.get("upsc_prelims_tip", ""),
                "sort_order": i,
                "sources": _resolve_sources(c.get("sources"), findings),
            }
            for i, c in enumerate(cards)
        ])

    if pyqs:
        _insert_with_sources_fallback("pyqs", [
            {
                "chapter_id": chapter["id"],
                "year": q.get("year", "Practice"),
                "question": q.get("question", ""),
                "options": q.get("options", []),
                "correct_index": q.get("correct_index", 0),
                "explanation": q.get("explanation", ""),
                "difficulty": q.get("difficulty", "Moderate"),
                "sources": _resolve_sources(q.get("sources"), findings),
            }
            for q in pyqs
        ])

    chapter_sources = _resolve_sources(
        list(result.get("importance_sources") or []) + list(result.get("approach_sources") or []),
        findings,
    )
    try:
        supabase.table("chapters").update({
            "status": "ready",
            "importance_label": result.get("importance_label"),
            "importance_note": result.get("importance_note"),
            "approach_guide": result.get("approach_guide"),
            "sources": chapter_sources,
        }).eq("id", chapter["id"]).execute()
    except Exception as e:
        # Fallback if the sources column does not exist yet on chapters table in Supabase
        print(f"[ingest_pipeline] Note: chapters update with sources failed ({e}), updating without sources.")
        supabase.table("chapters").update({
            "status": "ready",
            "importance_label": result.get("importance_label"),
            "importance_note": result.get("importance_note"),
            "approach_guide": result.get("approach_guide"),
        }).eq("id", chapter["id"]).execute()


def _recalibrate_book_importance(ready: list[dict]) -> list[dict]:
    """Runs the book-level importance recalibration pass (see
    llm_service.recalibrate_importance) and applies any adjustments back onto
    the chapters table, returning `ready` with the corrected labels/notes so
    generate_book_guide reflects them. Best-effort — on failure, leaves the
    existing per-chapter labels untouched."""
    calibration_input = [
        {
            "id": c["id"],
            "title": c["title"],
            "importance_note": c.get("importance_note"),
            "source_count": len(c.get("sources") or []),
        }
        for c in ready
    ]
    adjustments = recalibrate_importance(calibration_input)
    if not adjustments:
        return ready

    updated = []
    for c in ready:
        adjustment = adjustments.get(c["id"])
        if adjustment:
            supabase.table("chapters").update({
                "importance_label": adjustment.get("importance_label", c.get("importance_label")),
                "importance_note": adjustment.get("importance_note", c.get("importance_note")),
            }).eq("id", c["id"]).execute()
            updated.append({**c, **adjustment})
        else:
            updated.append(c)
    return updated


def _finalize_book(book: dict, chapters: list[dict]):
    fresh = supabase.table("chapters").select("*").eq("book_id", book["id"]).execute().data
    ready = [c for c in fresh if c["status"] == "ready"]
    guide = None
    if ready:
        ready = _recalibrate_book_importance(ready)
        guide = generate_book_guide(
            book_title=book["title"],
            subject=book.get("subject") or book["title"],
            chapter_summaries=ready,
        )

    supabase.table("books").update({
        "status": "ready",
        "approach_guide": guide,
        "processed_at": _now_iso(),
    }).eq("id", book["id"]).execute()


def run_once():
    book = _claim_book()
    if not book:
        print("[ingest_pipeline] No pending or in-progress books. Nothing to do.")
        return

    print(f"[ingest_pipeline] Working on book: {book['title']} ({book['id']})")
    pdf_path = None
    try:
        pdf_path = _download_pdf(book["storage_path"])
        chapters = _ensure_chapters_seeded(book, pdf_path)

        remaining = [c for c in chapters if c["status"] not in ("ready",)]
        for chapter in remaining:
            if _time_left() <= 0:
                print("[ingest_pipeline] Time budget exhausted for this run; will resume next scheduled run.")
                return

            print(f"[ingest_pipeline]   Chapter {chapter['chapter_number']}: {chapter['title']}")
            try:
                _process_chapter(book, chapter, pdf_path)
            except Exception as e:
                print(f"[ingest_pipeline]   FAILED chapter '{chapter['title']}': {e}")
                try:
                    supabase.table("chapters").update({"status": "failed", "error_message": str(e)}).eq("id", chapter["id"]).execute()
                except Exception:
                    # Fallback if error_message column does not exist yet on chapters table in Supabase
                    supabase.table("chapters").update({"status": "failed"}).eq("id", chapter["id"]).execute()

        still_pending = supabase.table("chapters").select("id").eq("book_id", book["id"]).in_("status", ["pending", "processing"]).execute()
        if still_pending.data:
            print("[ingest_pipeline] Chapters still outstanding; will resume next scheduled run.")
            return

        fresh = supabase.table("chapters").select("*").eq("book_id", book["id"]).execute().data
        if not any(c["status"] == "ready" for c in fresh):
            supabase.table("books").update({
                "status": "failed",
                "error_message": "All chapters failed to process; see chapters.error_message for details.",
            }).eq("id", book["id"]).execute()
            print(f"[ingest_pipeline] Book '{book['title']}' had no successful chapters; marked failed.")
            return

        _finalize_book(book, fresh)
        print(f"[ingest_pipeline] Book '{book['title']}' marked ready.")

    except Exception as e:
        print(f"[ingest_pipeline] FAILED book '{book['title']}': {e}")
        supabase.table("books").update({"status": "failed", "error_message": str(e)}).eq("id", book["id"]).execute()
    finally:
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)


if __name__ == "__main__":
    run_once()
    sys.exit(0)

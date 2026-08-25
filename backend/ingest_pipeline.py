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

from services.supabase_client import supabase
from services.pdf_structure import extract_top_level_chapters, extract_chapter_text
from services.web_research import research_topic
from llm_service import generate_chapter_content, generate_book_guide, generate_json, CHAPTER_SYSTEM_PROMPT

RUN_BUDGET_SECONDS = int(os.getenv("INGEST_RUN_BUDGET_SECONDS", "720"))
STORAGE_BUCKET = "book-uploads"

_start_time = time.monotonic()


def _time_left() -> float:
    return RUN_BUDGET_SECONDS - (time.monotonic() - _start_time)


def _claim_book() -> dict | None:
    """Prefer resuming a book already in progress over starting a new one."""
    resuming = supabase.table("books").select("*").eq("status", "processing").order("uploaded_at").limit(1).execute()
    if resuming.data:
        return resuming.data[0]

    pending = supabase.table("books").select("*").eq("status", "pending").order("uploaded_at").limit(1).execute()
    if not pending.data:
        return None

    book = pending.data[0]
    supabase.table("books").update({"status": "processing"}).eq("id", book["id"]).execute()
    book["status"] = "processing"
    return book


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


def _process_chapter(book: dict, chapter: dict, pdf_path: str):
    supabase.table("chapters").update({"status": "processing"}).eq("id", chapter["id"]).execute()

    chapter_text = extract_chapter_text(pdf_path, chapter["page_start"], chapter["page_end"])
    if not chapter_text.strip():
        raise RuntimeError(f"No extractable text for chapter '{chapter['title']}' (pages {chapter['page_start']}-{chapter['page_end']}).")

    research_context = research_topic(chapter["title"])

    result = generate_chapter_content(
        chapter_title=chapter["title"],
        chapter_text=chapter_text,
        research_context=research_context,
        subject=book.get("subject") or book["title"],
    )
    if not result:
        raise RuntimeError("LLM generation failed for this chapter after all retries.")

    cards = result.get("cards", [])
    pyqs = result.get("pyqs", [])

    if cards:
        supabase.table("cards").insert([
            {
                "chapter_id": chapter["id"],
                "title": c.get("title", ""),
                "concept_type": c.get("concept_type", "Fact"),
                "bullet_points": c.get("bullet_points", []),
                "mnemonic": c.get("mnemonic", ""),
                "upsc_prelims_tip": c.get("upsc_prelims_tip", ""),
                "sort_order": i,
            }
            for i, c in enumerate(cards)
        ]).execute()

    if pyqs:
        supabase.table("pyqs").insert([
            {
                "chapter_id": chapter["id"],
                "year": q.get("year", "Practice"),
                "question": q.get("question", ""),
                "options": q.get("options", []),
                "correct_index": q.get("correct_index", 0),
                "explanation": q.get("explanation", ""),
                "difficulty": q.get("difficulty", "Moderate"),
            }
            for q in pyqs
        ]).execute()

    supabase.table("chapters").update({
        "status": "ready",
        "importance_label": result.get("importance_label"),
        "importance_note": result.get("importance_note"),
        "approach_guide": result.get("approach_guide"),
    }).eq("id", chapter["id"]).execute()


def _finalize_book(book: dict, chapters: list[dict]):
    fresh = supabase.table("chapters").select("*").eq("book_id", book["id"]).execute().data
    ready = [c for c in fresh if c["status"] == "ready"]
    guide = None
    if ready:
        guide = generate_book_guide(
            book_title=book["title"],
            subject=book.get("subject") or book["title"],
            chapter_summaries=ready,
        )

    supabase.table("books").update({
        "status": "ready",
        "approach_guide": guide,
        "processed_at": "now()",
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
                supabase.table("chapters").update({"status": "failed"}).eq("id", chapter["id"]).execute()

        still_pending = supabase.table("chapters").select("id").eq("book_id", book["id"]).in_("status", ["pending", "processing"]).execute()
        if still_pending.data:
            print("[ingest_pipeline] Chapters still outstanding; will resume next scheduled run.")
            return

        _finalize_book(book, chapters)
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

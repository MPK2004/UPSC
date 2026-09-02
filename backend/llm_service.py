"""
Free LLM service backing the ingestion pipeline's per-chapter agentic
generation step. Free-tier models are rate-limited and occasionally return
malformed output, which is fine here — the pipeline runs unattended on a
schedule, so generate_json() retries across providers/models with backoff
rather than needing to succeed on the first try.
"""

import os
import json
import time
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

from services.web_research import department_menu_for_prompt

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

FREE_MODELS = [
    "nvidia/nemotron-3.5-lightning:free",
    "poolside/laguna-s-2.1:free",
    "dots-studio/dots-3-note-preview:free",
]
# "thinkingmachines/inkling:free" was tried and dropped: it 403s unconditionally
# for this account (a permissions/moderation block per OpenRouter, unrelated to
# the shared 50-req/day free-tier rate limit), so it never succeeds and only
# wastes retry attempts.

# NVIDIA NIM (integrate.api.nvidia.com) — OpenAI-compatible free API, a
# separate account/quota from OpenRouter's shared 50-req/day free-tier cap.
# Tried first in generate_json(); OpenRouter is the fallback once this is
# exhausted or unset.
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODELS = [
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
]
# "deepseek-ai/deepseek-v4-flash-0731" was tried and dropped: it 404s with
# "Function not found for account" for this NVIDIA account even though it's
# listed in /v1/models — that catalog is global, not account-scoped, so
# listing there doesn't mean it's actually provisioned. gpt-oss-20b/120b were
# confirmed working live against this account.


def _provider_configs() -> List[Dict[str, Any]]:
    """Providers tried in order by generate_json(). NVIDIA NIM first (its own
    account/quota, separate from OpenRouter's shared free-tier pool), then
    OpenRouter's free models as fallback. A provider is skipped entirely if
    its API key isn't set."""
    configs = []
    if NVIDIA_API_KEY:
        configs.append({
            "name": "NVIDIA NIM",
            "url": NVIDIA_URL,
            "headers": {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"},
            "models": NVIDIA_MODELS,
            "max_tokens": 8192,
            "extra": {},
            "timeout": 120,
        })
    if OPENROUTER_API_KEY:
        configs.append({
            "name": "OpenRouter",
            "url": OPENROUTER_URL,
            "headers": {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://upscreelcastle.local",
                "X-Title": "UPSC ReelCastle",
            },
            "models": FREE_MODELS,
            "max_tokens": 3000,
            "extra": {},
            "timeout": 60,
        })
    return configs


def generate_json(
    prompt: str,
    system_prompt: str,
    max_attempts_per_model: int = 2,
    backoff_seconds: float = 5.0,
    timeout_override: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    """
    Tries every configured provider's models in order, retrying each with
    backoff, until one returns parseable JSON. Free-tier flakiness (rate
    limits, truncated output, prose wrapped around the JSON) is expected —
    this is built to be patient, not fast, since the pipeline runs
    unattended on a schedule.

    `timeout_override`, when given, caps the per-request timeout below each
    provider's normal default (120s NVIDIA / 60s OpenRouter). Those defaults
    are sized for the large chapter-generation call; a small, fast call like
    plan_chapter_research shouldn't be able to eat minutes of the pipeline's
    ~12-minute run budget waiting on one slow provider before falling
    through to the next — better to fail fast and let the caller's own
    fallback (research_topic's coarse subject-level mapping) take over.
    """
    providers = _provider_configs()
    if not providers:
        print("[llm_service] Warning: no LLM provider API key set (NVIDIA_API_KEY / OPENROUTER_API_KEY).")
        return None

    for provider in providers:
        for model in provider["models"]:
            for attempt in range(1, max_attempts_per_model + 1):
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                    "max_tokens": provider["max_tokens"],
                    **provider["extra"],
                }
                request_timeout = min(provider["timeout"], timeout_override) if timeout_override else provider["timeout"]
                try:
                    res = requests.post(provider["url"], headers=provider["headers"], json=payload, timeout=request_timeout)
                    if res.status_code == 429:
                        print(f"[{provider['name']}] {model} rate-limited, backing off.")
                        time.sleep(backoff_seconds * attempt)
                        continue
                    res.raise_for_status()
                    content = res.json()["choices"][0]["message"]["content"]
                    parsed = _extract_json(content)
                    if parsed is not None:
                        return parsed
                    print(f"[{provider['name']}] {model} attempt {attempt}: could not parse JSON from response.")
                except Exception as e:
                    print(f"[{provider['name']} API Error] {model} attempt {attempt}: {e}")

                time.sleep(backoff_seconds)

    return None


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    text = text.strip()
    # Strip reasoning tags if present
    if "<think>" in text and "</think>" in text:
        text = text.split("</think>")[-1].strip()

    # Strip common markdown code-fence wrapping.
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end <= start:
        return None
    try:
        return json.loads(text[start:end])
    except Exception:
        return None


CHAPTER_SYSTEM_PROMPT = (
    "You are a senior UPSC Civil Services Prelims faculty member. You write "
    "exam-accurate, high-yield study material — never invent facts, and "
    "flag uncertainty rather than guessing. You always respond with a single "
    "JSON object and nothing else."
)


def plan_chapter_research(chapter_title: str, chapter_text_excerpt: str, subject: str) -> Optional[Dict[str, Any]]:
    """
    Runs before web_research.research_topic() for a chapter, deciding how
    that research should be targeted instead of leaning on a fixed
    subject->domain mapping:
      - whether this specific topic actually has data that changes over time
        (population figures, economic indicators, current policy) — official
        government sources are only useful for that; a chapter on how
        evaporation/condensation works, or a historical event, has nothing
        for e.g. NITI Aayog to say, and querying it there just wastes a DDG
        call for a near-guaranteed empty result.
      - which specific departments/ministries, named in plain language (e.g.
        "NITI Aayog", "Ministry of Health and Family Welfare"), actually
        cover that data — a Geography book's "Population" chapter needs
        Census/NITI Aayog, not ISRO/Survey of India, even though most of
        that same book's chapters genuinely are ISRO territory. The LLM
        names the department, not its domain — web_research.research_topic
        turns that into an unrestricted keyword search (no site: operator)
        and accepts a result into the official tier only if the URL DDG
        actually returns is a genuine .gov.in/.nic.in/.res.in page
        (web_research._is_official_domain). That's a structural check on the
        real result, not trust in whatever the LLM names — so this can cover
        a department that was never hardcoded anywhere, without opening the
        door to an invented or look-alike domain.
      - a disambiguated, India-scoped search query, since a bare chapter
        title like "Population Growth" risks pulling US/China/global results
        even inside a site-restricted search if the phrasing itself is generic.

    Best-effort: returns None on any LLM failure, in which case the caller
    (web_research.research_topic) falls back to the coarse, static
    subject-level department mapping rather than doing zero official-tier
    research for the chapter.
    """
    prompt = f"""
Book subject: {subject}
Chapter: {chapter_title}

--- CHAPTER TEXT EXCERPT ---
{chapter_text_excerpt[:1500]}

--- EXAMPLES OF INDIAN GOVERNMENT DEPARTMENTS/AGENCIES (not exhaustive — name whichever real department actually covers this topic, even if it's not one of these) ---
{department_menu_for_prompt()}

Decide how to research this specific chapter topic for a UPSC aspirant:

1. needs_current_data: true if this topic involves facts that change over time
   and where an up-to-date government figure/policy would actually matter
   (population statistics, economic indicators, environmental data, current
   policy/schemes, recent government reports). false if the topic is a
   static mechanism, definition, historical event, or process that doesn't
   change (e.g. how evaporation/condensation works, a historical dynasty,
   the definition of a landform) — official government sites have nothing
   useful to add for these, so don't waste a query on them.

2. departments: ONLY if needs_current_data is true, up to 3 real Indian
   government department/ministry/agency names (plain language, e.g. "NITI
   Aayog", "Ministry of Health and Family Welfare", "Census of India") that
   actually cover THIS specific topic — not just any government body related
   to the book's general subject. E.g. a population topic needs "Census of
   India" and "NITI Aayog", not "ISRO", even in a Geography book. You are not
   limited to the examples above — name whichever real department actually
   fits, but only ones you're confident genuinely exist and genuinely cover
   this topic; never guess or pad the list. Empty array if needs_current_data
   is false, or if nothing genuinely fits this specific topic.

3. search_query: a short, specific, India-scoped search phrase for this
   topic — explicitly include "India" and the specific subject matter so the
   search can't drift toward another country's data or an unrelated angle
   (e.g. "population growth trends and distribution in India", not just
   "population growth").

Respond with a single JSON object:
{{"needs_current_data": true | false, "departments": [<up to 3 real department names, or empty array>], "search_query": "..."}}
Respond with only the JSON object.
"""
    # Bounded to 20s per request (see generate_json's timeout_override) — a
    # small JSON task like this shouldn't be able to consume minutes of the
    # per-chapter run budget waiting on one slow provider before falling
    # through, worst case ~5 models x 20s = 100s instead of up to ~7 minutes.
    return generate_json(prompt, CHAPTER_SYSTEM_PROMPT, max_attempts_per_model=1, timeout_override=20)


def generate_chapter_content(
    chapter_title: str,
    chapter_text: str,
    research_text: str,
    subject: str,
) -> Optional[Dict[str, Any]]:
    """
    The core agentic step: given a chapter's own text plus a numbered,
    tier-labeled block of web research findings (see
    services/web_research.py's format_research_for_prompt), produces
    ByteReel cards, practice questions, an importance rating, and a
    chapter-level approach guide — all grounded in real source material
    rather than the model's own recall, with every claim traceable to a
    specific numbered finding rather than an invented citation.
    """
    prompt = f"""
Book subject: {subject}
Chapter: {chapter_title}

--- CHAPTER TEXT (source material, ground your cards in this) ---
{chapter_text[:6000]}

--- NUMBERED RESEARCH FINDINGS (cite ONLY by these bracketed numbers — never invent a URL of your own) ---
{research_text[:3000] if research_text else "(no web research available — base your judgment on the chapter text alone, say so in importance_note, and leave every sources array empty)"}

You may only cite research by its bracketed number above. (official source) findings
are your strongest evidence for factual/policy claims; (UPSC analysis) findings are
evidence for exam weightage and strategy, not raw fact; (Wikipedia) findings are
general-purpose background only — use them for basic definitions/terminology, never
as evidence for an importance/weightage judgment. If a card, PYQ, or judgment is
grounded purely in the chapter's own text rather than the research above, leave its
"sources" array empty rather than forcing a citation.

Importance must be evidence-based, not a default — pick whichever of the three
actually fits, don't settle on one label as the safe default when unsure:
- High: clear, repeated PYQ history for this specific topic, or major
  current-affairs linkage found in the research above.
- Medium: some genuine exam relevance (occasional PYQ appearances, meaningful
  conceptual weight for Mains) but not the repeated/current-affairs pattern High
  requires.
- Low: foundational, definitional, or background content — rarely tested on its
  own, mostly there to support later chapters.
A real UPSC textbook has a genuine three-way spread; don't let uncertainty push
everything into the middle label any more than into "High". If this chapter's
importance differs by angle (e.g. high for factual Prelims recall but low for
conceptual/Mains depth), say so explicitly in importance_note rather than
flattening it into one framing.

Produce a single JSON object with this exact shape:
{{
  "importance_label": "High" | "Medium" | "Low",
  "importance_note": "one or two sentences citing the actual evidence for this rating",
  "importance_sources": [<research finding numbers used above, or empty array>],
  "approach_guide": "2-4 sentences: how an aspirant should actually study this specific chapter — what to prioritize, what to skip, common traps",
  "approach_sources": [<research finding numbers used above, or empty array>],
  "cards": [
    {{
      "title": "concise heading",
      "concept_type": "Fact" | "Mnemonic" | "Visual Diagram" | "Prelims Alert",
      "bullet_points": ["3 crisp, exam-accurate bullet points"],
      "mnemonic": "memory trick, or empty string if not applicable",
      "upsc_prelims_tip": "a specific prelims-relevant tip, or empty string",
      "sources": [<research finding numbers this card draws on, or empty array>]
    }}
    // 5-8 cards total, covering the chapter's key sub-topics
  ],
  "pyqs": [
    {{
      "year": "e.g. 2023, or 'Practice' if not from an actual past paper",
      "question": "question text",
      "options": ["four options"],
      "correct_index": 0,
      "explanation": "why the correct answer is correct and others aren't",
      "difficulty": "Easy" | "Moderate" | "Hard",
      "sources": [<research finding numbers, or empty array if this is a genuine past-year question you recall independently>]
    }}
    // 2-4 questions
  ]
}}

Do not invent specific past-year questions you're not confident are real — for
practice questions you write yourself, set "year" to "Practice" rather than
fabricating a year. Respond with only the JSON object.
"""
    return generate_json(prompt, CHAPTER_SYSTEM_PROMPT)


def recalibrate_importance(chapters: List[Dict[str, Any]], research_text: str = "") -> Optional[Dict[str, Dict[str, str]]]:
    """
    Book-level pass: each chapter is generated independently with no
    visibility into how the other chapters in the same book were rated, so
    per-chapter generation structurally cannot self-calibrate a realistic
    spread of importance across the book. This runs once, after every
    chapter is ready, with full-book visibility, and is explicitly told to
    enforce genuine relative differentiation rather than letting everything
    default to High.

    `research_text` (see web_research.research_book_strategy, run once per
    book) is subject-wide UPSC-analysis content — overall weightage trends,
    which chapters toppers prioritize — that no single chapter's own research
    covers, since each chapter's research is scoped to that chapter's topic.
    It's context only here (real evidence for a *relative* judgment across
    chapters), not a citable source — recalibration adjusts existing
    per-chapter labels/notes rather than writing new sourced claims, so
    there's nowhere to attach a fresh citation the way a chapter's own
    importance_note can.

    `chapters` is a list of {"id", "title", "importance_note", "source_count"}.
    Returns {chapter_id: {"importance_label": ..., "importance_note": ...}}
    for chapters whose rating should change, or None on failure (caller
    should leave existing labels untouched in that case).
    """
    if not chapters:
        return None

    listing = "\n".join(
        f"- id={c['id']} | \"{c['title']}\" | current note: {c.get('importance_note') or '(none)'} "
        f"| evidence sources found: {c.get('source_count', 0)}"
        for c in chapters
    )
    prompt = f"""
Below is every chapter of one UPSC textbook, each already given an independent,
isolated importance judgment (it could not see the other chapters when rated).

{listing}

--- SUBJECT-WIDE UPSC STRATEGY RESEARCH (real findings from UPSC-analysis sites, for context on how toppers/analysts weight this subject as a whole) ---
{research_text[:2500] if research_text else "(none available — judge from the chapter listing above alone)"}

Re-judge importance RELATIVE to this specific book. A real UPSC textbook has a
genuine mix — do not mark most chapters High. Aim for roughly a third Low, a
third Medium, and a third High, weighted by each chapter's actual evidence
(PYQ frequency, current-affairs linkage, number of sources found) rather than
giving every chapter the same rating. Use the subject-wide research above only
as general context on how this subject is weighted overall — it's background,
not a citable source for any individual chapter's note. Only include a chapter
in your response if its label or note should change from the current one.

Respond with a single JSON object:
{{
  "<chapter id>": {{"importance_label": "High" | "Medium" | "Low", "importance_note": "one or two sentences, relative to this book"}}
  // only chapters that need to change
}}
"""
    return generate_json(prompt, CHAPTER_SYSTEM_PROMPT, max_attempts_per_model=1)


def generate_book_guide(
    book_title: str, subject: str, chapter_summaries: List[Dict[str, str]], research_text: str = ""
) -> Optional[Dict[str, Any]]:
    """
    Synthesizes a book-level "how to approach this subject" guide from the
    already-generated chapter guides + importance labels, grounded in real
    subject-wide strategy research (see web_research.research_book_strategy)
    where available — booklists, overall weightage trends, priority order
    across the whole subject, the kind of content topper/analysis sites
    actually publish but no single chapter's own research would surface.

    Returns {"approach_guide": "...", "sources": [<finding numbers cited>]}
    or None on failure. Citation-by-number only, same discipline as
    chapter-level generation — the caller resolves numbers back to real
    {title, url, tier} via ingest_pipeline._resolve_sources, so a
    hallucinated citation can't persist.
    """
    summary_block = "\n".join(
        f"- {c['title']} [{c.get('importance_label', '?')}]: {c.get('approach_guide', '')}"
        for c in chapter_summaries
    )
    prompt = f"""
Book: {book_title} (Subject: {subject})

Chapter-level guides already generated:
{summary_block}

--- NUMBERED SUBJECT-WIDE RESEARCH FINDINGS (cite ONLY by these bracketed numbers — never invent a URL) ---
{research_text[:2500] if research_text else "(none available — base the guide on the chapter summaries alone, and leave sources empty)"}

Write a single JSON object: {{"approach_guide": "...", "sources": [<finding numbers used above, or empty array>]}}
The approach_guide should be a short strategy briefing (4-6 sentences) for an
aspirant starting this subject: overall priority order across chapters based
on their importance labels, how much time to budget relative to other
subjects, and any cross-chapter traps or overlaps worth knowing up front. Cite
the numbered research above where it actually informed a specific claim (a
booklist recommendation, a weightage trend); leave sources empty if the guide
is built purely from the chapter summaries.
Respond with only the JSON object.
"""
    return generate_json(prompt, CHAPTER_SYSTEM_PROMPT, max_attempts_per_model=1)

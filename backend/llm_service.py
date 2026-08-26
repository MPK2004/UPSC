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
) -> Optional[Dict[str, Any]]:
    """
    Tries every configured provider's models in order, retrying each with
    backoff, until one returns parseable JSON. Free-tier flakiness (rate
    limits, truncated output, prose wrapped around the JSON) is expected —
    this is built to be patient, not fast, since the pipeline runs
    unattended on a schedule.
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
                try:
                    res = requests.post(provider["url"], headers=provider["headers"], json=payload, timeout=provider["timeout"])
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

Importance must be evidence-based, not a default. Cite actual PYQ frequency or
current-affairs linkage found in the research above when possible. Do NOT default
to "High" — most chapters in a real UPSC textbook are Medium or Low; reserve High
for chapters with clear, repeated PYQ history or major current-affairs linkage. If
this chapter's importance differs by angle (e.g. high for factual Prelims recall
but low for conceptual/Mains depth), say so explicitly in importance_note rather
than flattening it into one framing.

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


def recalibrate_importance(chapters: List[Dict[str, Any]]) -> Optional[Dict[str, Dict[str, str]]]:
    """
    Book-level pass: each chapter is generated independently with no
    visibility into how the other chapters in the same book were rated, so
    per-chapter generation structurally cannot self-calibrate a realistic
    spread of importance across the book. This runs once, after every
    chapter is ready, with full-book visibility, and is explicitly told to
    enforce genuine relative differentiation rather than letting everything
    default to High.

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

Re-judge importance RELATIVE to this specific book. A real UPSC textbook has a
genuine mix — do not mark most chapters High. Aim for roughly a third Low, a
third Medium, and a third High, weighted by each chapter's actual evidence
(PYQ frequency, current-affairs linkage, number of sources found) rather than
giving every chapter the same rating. Only include a chapter in your response
if its label or note should change from the current one.

Respond with a single JSON object:
{{
  "<chapter id>": {{"importance_label": "High" | "Medium" | "Low", "importance_note": "one or two sentences, relative to this book"}}
  // only chapters that need to change
}}
"""
    return generate_json(prompt, CHAPTER_SYSTEM_PROMPT, max_attempts_per_model=1)


def generate_book_guide(book_title: str, subject: str, chapter_summaries: List[Dict[str, str]]) -> Optional[str]:
    """
    Synthesizes a book-level "how to approach this subject" guide from the
    already-generated chapter guides + importance labels.
    """
    summary_block = "\n".join(
        f"- {c['title']} [{c.get('importance_label', '?')}]: {c.get('approach_guide', '')}"
        for c in chapter_summaries
    )
    prompt = f"""
Book: {book_title} (Subject: {subject})

Chapter-level guides already generated:
{summary_block}

Write a single JSON object: {{"approach_guide": "..."}}
The approach_guide should be a short strategy briefing (4-6 sentences) for an
aspirant starting this subject: overall priority order across chapters based
on their importance labels, how much time to budget relative to other
subjects, and any cross-chapter traps or overlaps worth knowing up front.
Respond with only the JSON object.
"""
    result = generate_json(prompt, CHAPTER_SYSTEM_PROMPT, max_attempts_per_model=1)
    return result.get("approach_guide") if result else None

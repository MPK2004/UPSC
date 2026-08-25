"""
OpenRouter Free LLM Service

Used both by the live API (app.py, legacy) and by the ingestion pipeline's
per-chapter agentic generation step. Free-tier models are rate-limited and
occasionally return malformed output, which is fine here — the pipeline runs
unattended overnight, so generate_json() retries across models with backoff
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
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-7b-instruct:free"
]

def generate_with_openrouter(prompt: str, system_prompt: str = "You are a top UPSC Civil Services Prelims faculty expert specializing in Geography and Environment.") -> str:
    if not OPENROUTER_API_KEY:
        print("[OpenRouter] Warning: OPENROUTER_API_KEY not set in environment.")
        return ""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://upscreelcastle.local",
        "X-Title": "UPSC ReelCastle"
    }

    for model in FREE_MODELS:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 800
        }
        try:
            res = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=12)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                return content
        except Exception as e:
            print(f"[OpenRouter API Error] {model}: {e}")
            continue

    return ""


def generate_byte_reel_cards(chapter_title: str, text_content: str) -> List[Dict[str, Any]]:
    prompt = f"""
Convert the following UPSC study material into 4 byte-sized reel cards.
Chapter: {chapter_title}
Material: {text_content[:1500]}

Format as a valid JSON array with objects containing:
- title: concise heading
- concept_type: "Fact" | "Mnemonic" | "Visual Diagram" | "Prelims Alert"
- bullet_points: 3 crisp bullet points for high-speed scrolling
- mnemonic: catchy memory trick if applicable
"""
    result = generate_with_openrouter(prompt)
    if result:
        try:
            start = result.find("[")
            end = result.rfind("]") + 1
            if start != -1 and end != -1:
                return json.loads(result[start:end])
        except Exception:
            pass

    return []


def generate_json(
    prompt: str,
    system_prompt: str,
    max_attempts_per_model: int = 2,
    backoff_seconds: float = 5.0,
) -> Optional[Dict[str, Any]]:
    """
    Tries every free model, retrying each with backoff, until one returns
    parseable JSON. Free-tier flakiness (rate limits, truncated output,
    prose wrapped around the JSON) is expected — this is built to be patient,
    not fast, since the pipeline runs unattended overnight.
    """
    if not OPENROUTER_API_KEY:
        print("[OpenRouter] Warning: OPENROUTER_API_KEY not set in environment.")
        return None

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://upscreelcastle.local",
        "X-Title": "UPSC ReelCastle",
    }

    for model in FREE_MODELS:
        for attempt in range(1, max_attempts_per_model + 1):
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 3000,
            }
            try:
                res = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
                if res.status_code == 429:
                    print(f"[OpenRouter] {model} rate-limited, backing off.")
                    time.sleep(backoff_seconds * attempt)
                    continue
                res.raise_for_status()
                content = res.json()["choices"][0]["message"]["content"]
                parsed = _extract_json(content)
                if parsed is not None:
                    return parsed
                print(f"[OpenRouter] {model} attempt {attempt}: could not parse JSON from response.")
            except Exception as e:
                print(f"[OpenRouter API Error] {model} attempt {attempt}: {e}")

            time.sleep(backoff_seconds)

    return None


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    text = text.strip()
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
    research_context: str,
    subject: str,
) -> Optional[Dict[str, Any]]:
    """
    The core agentic step: given a chapter's own text plus web research
    context gathered separately (see services/web_research.py), produces
    ByteReel cards, practice questions, an importance rating, and a
    chapter-level approach guide — all grounded in real source material
    rather than the model's own recall.
    """
    prompt = f"""
Book subject: {subject}
Chapter: {chapter_title}

--- CHAPTER TEXT (source material, ground your cards in this) ---
{chapter_text[:6000]}

--- WEB RESEARCH CONTEXT (use this to judge real UPSC relevance/importance, not just the model's opinion) ---
{research_context[:3000] if research_context else "(no web context available — base importance judgment on the chapter text alone and say so in importance_note)"}

Produce a single JSON object with this exact shape:
{{
  "importance_label": "High" | "Medium" | "Low",
  "importance_note": "one sentence citing what makes this high/medium/low yield for UPSC Prelims",
  "approach_guide": "2-4 sentences: how an aspirant should actually study this specific chapter — what to prioritize, what to skip, common traps",
  "cards": [
    {{
      "title": "concise heading",
      "concept_type": "Fact" | "Mnemonic" | "Visual Diagram" | "Prelims Alert",
      "bullet_points": ["3 crisp, exam-accurate bullet points"],
      "mnemonic": "memory trick, or empty string if not applicable",
      "upsc_prelims_tip": "a specific prelims-relevant tip, or empty string"
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
      "difficulty": "Easy" | "Moderate" | "Hard"
    }}
    // 2-4 questions
  ]
}}

Do not invent specific past-year questions you're not confident are real — for
practice questions you write yourself, set "year" to "Practice" rather than
fabricating a year. Respond with only the JSON object.
"""
    return generate_json(prompt, CHAPTER_SYSTEM_PROMPT)


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

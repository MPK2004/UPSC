"""
OpenRouter Free LLM Service
"""

import os
import requests
import json
from typing import Dict, Any, List
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

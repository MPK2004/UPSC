"""
Free, keyless web research helpers for the ingestion pipeline.

Two sources, both free and requiring no API key:
- Wikipedia's REST summary API: reliable, structured, good factual grounding.
- DuckDuckGo's keyless search (via the `duckduckgo-search` package): broader
  web results, used for UPSC-specific signals like past-year-question and
  weightage discussion that Wikipedia won't have.

Both are best-effort. If either breaks (DDG's HTML search in particular is
scraping-based and can change shape), we degrade to whatever context we do
have rather than failing the whole chapter.
"""

import time
import requests

WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php"

# Wikipedia's API rejects requests with no descriptive User-Agent (403) —
# see https://meta.wikimedia.org/wiki/User-Agent_policy.
_WIKI_HEADERS = {
    "User-Agent": "UPSCReelCastleBot/1.0 (ingestion pipeline; contact via repo issues)"
}


def wikipedia_summary(topic: str) -> str:
    """Best-effort Wikipedia summary for a topic. Empty string on failure."""
    try:
        # Resolve the best-matching title first, since the summary endpoint
        # needs an exact page title.
        resp = requests.get(
            WIKIPEDIA_SEARCH_URL,
            params={
                "action": "query", "list": "search", "srsearch": topic,
                "format": "json", "srlimit": 1,
            },
            headers=_WIKI_HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        hits = resp.json().get("query", {}).get("search", [])
        if not hits:
            return ""
        title = hits[0]["title"]

        summary_resp = requests.get(
            WIKIPEDIA_SUMMARY_URL.format(title=requests.utils.quote(title)),
            headers=_WIKI_HEADERS,
            timeout=10,
        )
        summary_resp.raise_for_status()
        return summary_resp.json().get("extract", "")
    except Exception as e:
        print(f"[web_research] Wikipedia lookup failed for '{topic}': {e}")
        return ""


def duckduckgo_snippets(query: str, max_results: int = 4) -> list[str]:
    """Best-effort list of DuckDuckGo result snippets. Empty list on failure."""
    try:
        from ddgs import DDGS

        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        return [r.get("body", "") for r in results if r.get("body")]
    except Exception as e:
        print(f"[web_research] DuckDuckGo search failed for '{query}': {e}")
        return []


def research_topic(topic: str, upsc_query_suffix: str = "UPSC prelims weightage previous year questions") -> str:
    """
    Gathers grounding context for one topic: a Wikipedia summary plus a
    couple of DuckDuckGo snippets aimed at UPSC relevance specifically.
    Returns a single text blob ready to drop into an LLM prompt; empty
    string if every source failed (caller should treat that as "no extra
    context available" rather than an error).
    """
    parts = []

    summary = wikipedia_summary(topic)
    if summary:
        parts.append(f"Wikipedia summary of '{topic}':\n{summary}")

    time.sleep(1)  # be polite between the two free lookups

    snippets = duckduckgo_snippets(f"{topic} {upsc_query_suffix}")
    if snippets:
        parts.append(
            f"Web search snippets for '{topic} {upsc_query_suffix}':\n"
            + "\n".join(f"- {s}" for s in snippets)
        )

    return "\n\n".join(parts)

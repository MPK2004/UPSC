"""
Free, keyless web research helpers for the ingestion pipeline.

Sources, all free and requiring no API key:
- Wikipedia's REST summary API: reliable, structured, good factual grounding.
- DuckDuckGo's keyless search (via the `ddgs` package): restricted to a
  curated allowlist of reputed sources — never the open web — split into two
  tiers:
    - "official": primary/government sources, chosen by the book's subject
      (e.g. ISRO/Survey of India for Geography, RBI/Finance Ministry for
      Economy). Mirrors the "official/primary sources outrank generic
      analysis" principle of a real UPSC source hierarchy.
    - "upsc_analysis": well-known UPSC exam-analysis / topper-strategy sites,
      used for weightage and topper-opinion angles regardless of subject.

Every finding keeps its real title/url so the LLM can cite it by number and
the pipeline can persist real, resolvable citations — never a source the LLM
invented itself.

Both are best-effort. If either breaks (DDG's HTML search in particular is
scraping-based and can change shape), we degrade to whatever context we do
have rather than failing the whole chapter. A restricted query that returns
nothing is NOT loosened to the open web — that would silently reintroduce
random-website citations, which is the whole point of the allowlist.
"""

import time
from urllib.parse import urlparse

import requests

WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php"

# Wikipedia's API rejects requests with no descriptive User-Agent (403) —
# see https://meta.wikimedia.org/wiki/User-Agent_policy.
_WIKI_HEADERS = {
    "User-Agent": "UPSCReelCastleBot/1.0 (ingestion pipeline; contact via repo issues)"
}

WIKIPEDIA_DOMAIN = "en.wikipedia.org"
MAX_FINDINGS = 10

# Tier 1 — official/primary sources, chosen by the book's subject. No entry
# for a subject means no tier-1 query for it — never guess a mapping.
OFFICIAL_SOURCES_BY_SUBJECT = {
    "geography": ["isro.gov.in", "surveyofindia.gov.in", "mausam.imd.gov.in", "bhuvan.nrsc.gov.in"],
    "environment": ["moef.gov.in", "cpcb.nic.in", "nbaindia.org"],
    "ecology": ["moef.gov.in", "cpcb.nic.in", "nbaindia.org"],
    "polity": ["indiacode.nic.in", "sci.gov.in", "prsindia.org", "loksabha.nic.in", "darpg.gov.in"],
    "governance": ["darpg.gov.in", "prsindia.org", "sci.gov.in"],
    "economy": ["rbi.org.in", "indiabudget.gov.in", "mospi.gov.in", "finmin.gov.in"],
    "economics": ["rbi.org.in", "indiabudget.gov.in", "mospi.gov.in", "finmin.gov.in"],
    "history": ["indiaculture.gov.in", "asi.nic.in", "ccrtindia.gov.in"],
    "science": ["dst.gov.in", "dbtindia.gov.in", "icmr.gov.in", "isro.gov.in"],
    "society": ["censusindia.gov.in", "niti.gov.in", "mospi.gov.in"],
    "international relations": ["mea.gov.in"],
    "agriculture": ["agriwelfare.gov.in", "icar.gov.in"],
    "security": ["mha.gov.in"],
}

# Tier 2 — general UPSC-analysis / topper-strategy sites, used regardless of subject.
REPUTED_UPSC_SITES = [
    "insightsonindia.com", "drishtiias.com", "forumias.com",
    "visionias.in", "iasbaba.com", "clearias.com",
]


def _official_domains_for(subject: str) -> list[str]:
    subject = (subject or "").lower()
    for key, domains in OFFICIAL_SOURCES_BY_SUBJECT.items():
        if key in subject:
            return domains
    return []


def _domain_of(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ""


def _domain_allowed(url: str, allowlist: list[str]) -> bool:
    """True if url's domain is in allowlist or a subdomain of one of it."""
    domain = _domain_of(url)
    return any(domain == d or domain.endswith("." + d) for d in allowlist)


def wikipedia_summary(topic: str) -> dict | None:
    """Best-effort Wikipedia summary for a topic. None on failure."""
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
            return None
        title = hits[0]["title"]

        summary_resp = requests.get(
            WIKIPEDIA_SUMMARY_URL.format(title=requests.utils.quote(title)),
            headers=_WIKI_HEADERS,
            timeout=10,
        )
        summary_resp.raise_for_status()
        data = summary_resp.json()
        extract = data.get("extract", "")
        url = data.get("content_urls", {}).get("desktop", {}).get("page", "")
        if not extract or not url or not _domain_allowed(url, [WIKIPEDIA_DOMAIN]):
            return None
        return {"title": data.get("title", title), "url": url, "snippet": extract, "tier": "wikipedia"}
    except Exception as e:
        print(f"[web_research] Wikipedia lookup failed for '{topic}': {e}")
        return None


def _duckduckgo_search(query: str, allowlist: list[str], tier: str, max_results: int = 3) -> list[dict]:
    """
    Best-effort list of findings for `query`, restricted to `allowlist` via
    the site: operator. Empty list on failure, on an empty allowlist, or if
    nothing in the response actually matches the allowlist (defense in
    depth — never loosened to the open web).
    """
    if not allowlist:
        return []

    site_filter = " OR ".join(f"site:{d}" for d in allowlist)
    full_query = f"{query} ({site_filter})"
    try:
        from ddgs import DDGS

        with DDGS() as ddgs:
            results = list(ddgs.text(full_query, max_results=max_results))
    except Exception as e:
        print(f"[web_research] DuckDuckGo search failed for '{full_query}': {e}")
        return []

    findings = []
    for r in results:
        url = r.get("href") or r.get("url") or ""
        title = r.get("title") or ""
        body = r.get("body") or ""
        if not url or not body:
            continue
        if not _domain_allowed(url, allowlist):
            continue  # DDG's site: operator isn't guaranteed to be honored
        findings.append({"title": title, "url": url, "snippet": body, "tier": tier})
    return findings


def research_topic(topic: str, subject: str = "") -> list[dict]:
    """
    Gathers grounding context for one chapter topic, restricted to reputed
    sources only:
      - Wikipedia (factual grounding, un-restricted since it's inherently
        reputable).
      - Tier 1 "official": primary/government sources chosen by `subject`
        (skipped entirely if the subject doesn't map to a known domain set —
        never guess a mapping).
      - Tier 2 "upsc_analysis": well-known UPSC exam-analysis/topper-strategy
        sites, for the weightage and topper-opinion angles.

    Returns a deduplicated (by URL), capped, sequentially-numbered list:
        [{"id": 1, "title": ..., "url": ..., "snippet": ..., "tier": ...}, ...]
    Empty list if every source failed or nothing survived the allowlists —
    callers should treat that as "no extra context available", not an error.
    """
    findings = []

    wiki = wikipedia_summary(topic)
    if wiki:
        findings.append(wiki)

    time.sleep(1)  # be polite between free lookups

    official_domains = _official_domains_for(subject)
    if official_domains:
        findings += _duckduckgo_search(topic, official_domains, "official")
        time.sleep(1)

    findings += _duckduckgo_search(
        f"{topic} UPSC prelims weightage previous year questions",
        REPUTED_UPSC_SITES, "upsc_analysis",
    )
    time.sleep(1)

    findings += _duckduckgo_search(
        f"{topic} UPSC topper strategy AIR rank preparation notes",
        REPUTED_UPSC_SITES, "upsc_analysis",
    )

    # Dedupe by URL (first occurrence wins), cap, assign sequential ids.
    seen = set()
    deduped = []
    for f in findings:
        if f["url"] in seen:
            continue
        seen.add(f["url"])
        deduped.append(f)
        if len(deduped) >= MAX_FINDINGS:
            break

    for i, f in enumerate(deduped, start=1):
        f["id"] = i

    return deduped


def format_research_for_prompt(findings: list[dict]) -> str:
    """Numbered, tier-labeled text block ready to drop into an LLM prompt."""
    if not findings:
        return ""
    tier_labels = {"official": "official source", "upsc_analysis": "UPSC analysis", "wikipedia": "Wikipedia"}
    parts = []
    for f in findings:
        label = tier_labels.get(f["tier"], f["tier"])
        parts.append(f"[{f['id']}] ({label}) {f['title']} ({f['url']})\n{f['snippet']}")
    return "\n\n".join(parts)

"""
Free, keyless web research helpers for the ingestion pipeline.

Sources, all free and requiring no API key:
- Wikipedia's REST summary API: reliable, structured, good factual grounding.
- DuckDuckGo's keyless search (via the `ddgs` package): never the open web,
  split into two tiers with two different kinds of guarantee:
    - "official": primary/government sources for the specific chapter topic
      (decided per-chapter by an LLM planning step, see
      llm_service.plan_chapter_research — not a fixed subject->domain
      mapping). The search itself is unrestricted (no site: operator); a
      result only counts if _is_official_domain() confirms the URL is a
      genuine .gov.in/.nic.in/.res.in page — a structural guarantee on the
      real result, not a requirement that the domain was already known.
    - "upsc_analysis": well-known UPSC exam-analysis / topper-strategy /
      exam-prep sites, queried together (weightage + topper-opinion angle in
      one query) regardless of subject or topic. There's no TLD-style
      guarantee for commercial sites, so this tier stays restricted to a
      fixed, code-verified allowlist (a core set plus a few rotated in per
      chapter — see UPSC_ANALYSIS_CORE_SITES/UPSC_ANALYSIS_EXTRA_SITES).

Every finding keeps its real title/url so the LLM can cite it by number and
the pipeline can persist real, resolvable citations — never a source the LLM
invented itself.

Both are best-effort. If either breaks (DDG's HTML search in particular is
scraping-based and can change shape), we degrade to whatever context we do
have rather than failing the whole chapter. A restricted query that returns
nothing is NOT loosened to the open web — that would silently reintroduce
random-website citations, which is the whole point of the allowlist.
"""

import os
import random
import time
from urllib.parse import urlparse

import requests

# DuckDuckGo's scraping-based search (via `ddgs`) silently rate-limits/blocks
# shared CI datacenter IPs (GitHub Actions runners included) rather than
# raising an error — it just returns zero results, indistinguishable from a
# genuine "nothing found". Confirmed by re-running the exact same query
# strings that came back empty in CI from a non-CI IP and getting real
# results instantly. There's no fix for that on our side, but the pipeline
# runs unattended on a schedule with no urgency — so DDG calls are spaced out
# generously rather than fired in a quick burst, trading run throughput for a
# better chance of not looking like a bot. Leftover chapters just pick up on
# the next scheduled run.
DDG_REQUEST_DELAY_SECONDS = float(os.getenv("DDG_REQUEST_DELAY_SECONDS", "20"))

WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php"

# Wikipedia's API rejects requests with no descriptive User-Agent (403) —
# see https://meta.wikimedia.org/wiki/User-Agent_policy.
_WIKI_HEADERS = {
    "User-Agent": "UPSCReelCastleBot/1.0 (ingestion pipeline; contact via repo issues)"
}

WIKIPEDIA_DOMAIN = "en.wikipedia.org"
MAX_FINDINGS = 10

# Tier 1 — official/primary government sources. Keyed by a short department
# id (not by book subject) because the *right* department depends on the
# specific chapter topic, not the book's subject as a whole — a Geography
# book's "Population" chapter needs Census/NITI Aayog, not ISRO, even though
# most of that same book's chapters genuinely are ISRO/Survey-of-India
# territory. `plan_chapter_research()` (llm_service.py) picks department ids
# from this menu per chapter; this dict is also the allowlist those ids are
# validated against (an id the LLM invents that isn't a key here is dropped —
# same defense-in-depth pattern as citation resolution).
OFFICIAL_DOMAINS = {
    "isro": ("isro.gov.in", "ISRO — remote sensing, satellite programs, space missions"),
    "bhuvan": ("bhuvan.nrsc.gov.in", "ISRO's Bhuvan geoportal — land use, terrain, geospatial data"),
    "surveyofindia": ("surveyofindia.gov.in", "Survey of India — maps, geodesy, boundaries"),
    "imd": ("mausam.imd.gov.in", "India Meteorological Department — weather, monsoon, climate data"),
    "censusindia": ("censusindia.gov.in", "Census of India — population counts, demographics"),
    "niti_aayog": ("niti.gov.in", "NITI Aayog — policy indicators, SDG tracking, development data"),
    "mha": ("mha.gov.in", "Ministry of Home Affairs — internal security, Census administration"),
    "mospi": ("mospi.gov.in", "Ministry of Statistics & Programme Implementation — official statistics, surveys"),
    "rbi": ("rbi.org.in", "Reserve Bank of India — monetary policy, banking, economic data"),
    "indiabudget": ("indiabudget.gov.in", "Union Budget documents"),
    "finmin": ("finmin.gov.in", "Ministry of Finance"),
    "moef": ("moef.gov.in", "Ministry of Environment, Forest & Climate Change"),
    "cpcb": ("cpcb.nic.in", "Central Pollution Control Board — pollution data/standards"),
    "nbaindia": ("nbaindia.org", "National Biodiversity Authority"),
    "indiacode": ("indiacode.nic.in", "Statutes and Acts of India"),
    "sci": ("sci.gov.in", "Supreme Court of India — judgments"),
    "prsindia": ("prsindia.org", "PRS Legislative Research — bill and policy analysis"),
    "loksabha": ("loksabha.nic.in", "Lok Sabha Secretariat"),
    "darpg": ("darpg.gov.in", "Dept. of Administrative Reforms & Public Grievances — governance reforms"),
    "eci": ("eci.gov.in", "Election Commission of India"),
    "indiaculture": ("indiaculture.gov.in", "Ministry of Culture"),
    "ccrt": ("ccrtindia.gov.in", "Centre for Cultural Resources and Training"),
    "asi": ("asi.nic.in", "Archaeological Survey of India — monuments, heritage sites"),
    "dst": ("dst.gov.in", "Dept. of Science & Technology"),
    "dbtindia": ("dbtindia.gov.in", "Dept. of Biotechnology"),
    "icmr": ("icmr.gov.in", "Indian Council of Medical Research"),
    "mohfw": ("mohfw.gov.in", "Ministry of Health & Family Welfare — health data"),
    "agriwelfare": ("agriwelfare.gov.in", "Ministry of Agriculture & Farmers Welfare"),
    "icar": ("icar.gov.in", "Indian Council of Agricultural Research"),
    "mea": ("mea.gov.in", "Ministry of External Affairs — foreign policy, bilateral relations"),
}

# Fallback only, used when the per-chapter LLM planning step (see
# ingest_pipeline._process_chapter) isn't available or fails — a coarse,
# subject-level default so the pipeline degrades gracefully rather than
# doing zero official-tier research for the chapter.
SUBJECT_DEFAULT_DEPARTMENTS = {
    "geography": ["isro", "surveyofindia", "imd", "bhuvan"],
    "environment": ["moef", "cpcb", "nbaindia"],
    "ecology": ["moef", "cpcb", "nbaindia"],
    "polity": ["indiacode", "sci", "prsindia", "loksabha", "darpg"],
    "governance": ["darpg", "prsindia", "sci"],
    "economy": ["rbi", "indiabudget", "mospi", "finmin"],
    "economics": ["rbi", "indiabudget", "mospi", "finmin"],
    "history": ["indiaculture", "ccrt", "asi"],
    "science": ["dst", "dbtindia", "icmr", "isro"],
    "society": ["censusindia", "niti_aayog", "mospi"],
    "international relations": ["mea"],
    "agriculture": ["agriwelfare", "icar"],
    "security": ["mha"],
}

# Tier 2 — general UPSC-analysis / topper-strategy / exam-prep sites, used
# regardless of subject (unlike tier 1, all of these cover every UPSC
# subject, so there's no topic->site mismatch to resolve per chapter the way
# tier 1 needs). Each domain here was checked live (real HTTP response, not
# just "sounds legitimate") before being added — same discipline as the
# official government domains above; a hardcoded identifier that turns out
# not to exist is exactly how this project's first bug happened (see
# HANDOFF.md's fabricated-OpenRouter-model-slugs entry).
#
# Split into "core" (always queried) and "extra" (a few rotated in per
# chapter, chosen at random) rather than all queried together every time —
# DDG's search silently returns "No results found" once a query gets long
# enough (empirically somewhere around 310-335 characters total, confirmed
# by testing: adding search-query text or more site: clauses both push it
# over), and since search_query length varies per chapter, no fixed site
# count is safe in the worst case. _bounded_allowlist() below enforces the
# actual safety margin regardless of how long a given chapter's query is;
# core/extra is just about which sites get dropped first when trimming.
UPSC_ANALYSIS_CORE_SITES = [
    "insightsonindia.com", "drishtiias.com", "forumias.com",
    "visionias.in", "iasbaba.com", "clearias.com",
]
UPSC_ANALYSIS_EXTRA_SITES = [
    "unacademy.com", "vedantu.com", "testbook.com", "byjusexamprep.com",
    "oliveboard.in", "studyiq.com", "nextias.com", "adda247.com",
    "examrace.com", "gktoday.in", "jagranjosh.com",
]
UPSC_ANALYSIS_EXTRA_SITES_PER_QUERY = 3
MAX_SAFE_QUERY_LEN = 300  # comfortably under the ~310-335 char point where DDG starts returning nothing


def _bounded_allowlist(query_text: str, sites: list[str], max_len: int = MAX_SAFE_QUERY_LEN) -> list[str]:
    """Trims `sites` (from the end) until the full query _duckduckgo_search
    would actually build (`query_text (site:a OR site:b OR ...)`) fits under
    `max_len`. Put lower-priority sites at the end of `sites` so they're the
    ones dropped first."""
    selected = list(sites)
    while selected:
        full = query_text + " (" + " OR ".join(f"site:{d}" for d in selected) + ")"
        if len(full) <= max_len:
            return selected
        selected.pop()
    return selected


def _upsc_analysis_search(query_text: str, max_results: int = 5) -> list[dict]:
    """Shared tier-2 lookup: core sites always included, a bounded random
    sample of extras rotated in, trimmed to a safe query length. Used both
    per-chapter (research_topic) and once per book (research_book_strategy)."""
    rotated_extras = random.sample(
        UPSC_ANALYSIS_EXTRA_SITES, k=min(UPSC_ANALYSIS_EXTRA_SITES_PER_QUERY, len(UPSC_ANALYSIS_EXTRA_SITES))
    )
    sites = _bounded_allowlist(query_text, UPSC_ANALYSIS_CORE_SITES + rotated_extras)
    return _duckduckgo_search(query_text, "upsc_analysis", max_results=max_results, allowlist=sites)


def research_book_strategy(subject: str) -> list[dict]:
    """
    Book-level counterpart to research_topic(): run once per book (at
    finalization, see ingest_pipeline._finalize_book), not once per chapter.
    Grounds the book-level approach guide and importance recalibration in
    real subject-wide strategy content — which chapters to prioritize, booklists,
    overall weightage trends — that genuinely exists on UPSC-analysis sites
    but isn't captured by any single chapter's own research (a chapter's
    research is scoped to that chapter's topic, not "how to approach this
    entire subject"). No official-government tier here — study strategy isn't
    something a government source publishes an opinion on, so this is
    UPSC-analysis-tier only, same allowlist and rotation as tier 2 above.

    Returns the same shape as research_topic(): a deduplicated, capped,
    sequentially-numbered list of {"id", "title", "url", "snippet", "tier"}.
    """
    query_text = f"{subject} UPSC prelims mains subject weightage priority strategy topper booklist"
    findings = _upsc_analysis_search(query_text, max_results=8)

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


def department_menu_for_prompt() -> str:
    """Human-readable {id}: {domain} — {description} listing of well-known
    departments, dropped into plan_chapter_research()'s prompt purely as
    examples/inspiration — the LLM isn't limited to these, it names whatever
    real department actually fits (see plan_chapter_research's docstring)."""
    return "\n".join(f"- {key}: {domain} — {desc}" for key, (domain, desc) in OFFICIAL_DOMAINS.items())


def _domains_for_department_ids(ids: list[str]) -> list[str]:
    """Resolve LLM-picked department ids to real domains, silently dropping
    any id that isn't in OFFICIAL_DOMAINS (an invented department) — same
    trust-nothing pattern as ingest_pipeline._resolve_sources."""
    domains = []
    for i in ids or []:
        entry = OFFICIAL_DOMAINS.get(i)
        if entry:
            domains.append(entry[0])
    return domains


def _official_domains_for(subject: str) -> list[str]:
    """Coarse subject-level fallback (see SUBJECT_DEFAULT_DEPARTMENTS above)."""
    subject = (subject or "").lower()
    for key, dept_ids in SUBJECT_DEFAULT_DEPARTMENTS.items():
        if key in subject:
            return _domains_for_department_ids(dept_ids)
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


GOV_TLDS = ("gov.in", "nic.in", "res.in")
# A handful of genuinely official/statutory Indian bodies that don't happen
# to sit on a .gov.in/.nic.in/.res.in domain (registered as .org/.org.in
# instead) — an explicit, code-verified short list, not a loophole for
# arbitrary domains. Anything else has to earn "official" tier the honest
# way: an actual government TLD.
OFFICIAL_NON_GOV_TLD_DOMAINS = ("rbi.org.in", "prsindia.org", "nbaindia.org")


def _is_official_domain(url: str) -> bool:
    """
    True if `url`'s domain is verifiably a genuine Indian government site —
    checked structurally (TLD), not against a pre-typed list of domains we
    happened to think of in advance. .gov.in/.nic.in/.res.in registration is
    controlled by India's National Informatics Centre and isn't obtainable
    by an ordinary site, so this can't be gamed the way a hallucinated or
    merely-plausible-looking domain string could be. This is what lets the
    official tier's search be keyword-based (see research_topic) instead of
    requiring every possible department's exact domain to already be known.
    """
    domain = _domain_of(url)
    if domain in OFFICIAL_NON_GOV_TLD_DOMAINS or any(domain.endswith("." + d) for d in OFFICIAL_NON_GOV_TLD_DOMAINS):
        return True
    return any(domain == tld or domain.endswith("." + tld) for tld in GOV_TLDS)


def _duckduckgo_search(
    query: str,
    tier: str,
    max_results: int = 3,
    allowlist: list[str] | None = None,
    domain_validator=None,
) -> list[dict]:
    """
    Best-effort list of findings for `query`. Every result is checked after
    the fact against exactly one of:
      - `allowlist`: exact pre-known domains (site: operator in the query
        too, though DDG doesn't always honor it — the allowlist re-check is
        the real guarantee). Used for the upsc_analysis tier, where there's
        no structural way to verify "this is a reputed exam-prep site" other
        than a human having actually checked the domain in advance.
      - `domain_validator`: a callable checking some verifiable property of
        the domain itself (see _is_official_domain) rather than exact
        pre-knowledge of it. Used for the official tier, where a real
        government TLD is itself the guarantee — no site: operator is added
        to the query, so this can surface any genuine .gov.in/.nic.in/.res.in
        page relevant to the query, not only ones already in a list.
    Exactly one of the two must be given. Empty list on failure, or if
    nothing in the response survives the check (never loosened beyond it).
    """
    if not allowlist and not domain_validator:
        return []

    if allowlist:
        site_filter = " OR ".join(f"site:{d}" for d in allowlist)
        full_query = f"{query} ({site_filter})"
    else:
        full_query = query

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
        if allowlist and not _domain_allowed(url, allowlist):
            continue  # DDG's site: operator isn't guaranteed to be honored
        if domain_validator and not domain_validator(url):
            continue
        findings.append({"title": title, "url": url, "snippet": body, "tier": tier})
    return findings


def research_topic(topic: str, subject: str = "", plan: dict | None = None) -> list[dict]:
    """
    Gathers grounding context for one chapter topic, restricted to reputed
    sources only:
      - Wikipedia (factual grounding, un-restricted since it's inherently
        reputable).
      - Tier 1 "official": primary/government sources for this specific
        topic. Which departments to search for, and whether to query this
        tier at all, is decided per-chapter by `plan` (see
        llm_service.plan_chapter_research) rather than by a fixed
        subject->domain mapping — a book's subject being "Geography" doesn't
        mean every chapter is ISRO/Survey-of-India territory (a Population
        chapter needs Census/NITI Aayog instead), and a chapter with nothing
        that actually changes over time (a mechanism, a historical event)
        has no reason to query government sites at all. The plan names
        departments in plain language ("NITI Aayog", "Ministry of Health and
        Family Welfare") rather than picking from a pre-typed domain list —
        the search itself is unrestricted (no site: operator), and whatever
        URL DDG actually returns is accepted into this tier only if
        _is_official_domain() confirms it's a genuine .gov.in/.nic.in/.res.in
        page. That's a structural guarantee instead of a coverage list: it
        can surface any real government page relevant to the topic, not only
        departments someone thought to hardcode in advance, while still
        being impossible to spoof with an invented or look-alike domain.
        Falls back to the coarse subject-level domain mapping if `plan` is
        absent or the plan step failed, so this still degrades gracefully.
      - Tier 2 "upsc_analysis": well-known UPSC exam-analysis/topper-strategy
        sites, for the weightage and topper-opinion angles. Always queried,
        regardless of topic or the plan's needs_current_data judgment — exam
        weightage/strategy content exists for every chapter, not just
        time-sensitive ones, and there's no structural TLD-style guarantee
        for commercial sites the way there is for government ones, so this
        tier stays restricted to a code-verified allowlist (a fixed core set
        plus a few extras rotated in per chapter, see UPSC_ANALYSIS_CORE_SITES
        / UPSC_ANALYSIS_EXTRA_SITES) rather than an open keyword search.

    `topic` is used as-is when `plan` doesn't supply a more specific
    `search_query` — the plan step is expected to disambiguate a generic
    chapter title (e.g. "Population Growth" -> "population growth trends and
    distribution in India") so tier-1/tier-2 queries don't drift toward
    other countries' data.

    Returns a deduplicated (by URL), capped, sequentially-numbered list:
        [{"id": 1, "title": ..., "url": ..., "snippet": ..., "tier": ...}, ...]
    Empty list if every source failed or nothing survived the allowlists —
    callers should treat that as "no extra context available", not an error.
    """
    findings = []
    plan = plan or {}
    search_query = plan.get("search_query") or topic

    wiki = wikipedia_summary(topic)
    if wiki:
        findings.append(wiki)

    # DDG calls are the ones that get silently throttled on CI — space them
    # out generously (see DDG_REQUEST_DELAY_SECONDS above), and keep to at
    # most 2 of them per chapter (one official-tier call covering every
    # named department at once via OR, one combined tier-2 call) to minimize
    # how much traffic this run adds.
    if "needs_current_data" in plan:
        if plan["needs_current_data"]:
            # Up to 3 department names, capped so the combined OR query
            # doesn't approach the length where DDG silently stops returning
            # results (empirically well past 6 short domains, comfortably
            # covering a handful of full department names).
            departments = [d for d in (plan.get("departments") or []) if isinstance(d, str) and d.strip()][:3]
            if departments:
                time.sleep(DDG_REQUEST_DELAY_SECONDS)
                official_query = f"{search_query} (" + " OR ".join(f'"{d}"' for d in departments) + ")"
                findings += _duckduckgo_search(official_query, "official", domain_validator=_is_official_domain)
    else:
        # Plan step failed entirely — fall back to the coarse, pre-typed
        # subject-level domain list (old behavior) rather than doing zero
        # official-tier research for the chapter.
        official_domains = _official_domains_for(subject)
        if official_domains:
            time.sleep(DDG_REQUEST_DELAY_SECONDS)
            findings += _duckduckgo_search(search_query, "official", allowlist=official_domains)

    time.sleep(DDG_REQUEST_DELAY_SECONDS)
    findings += _upsc_analysis_search(f"{search_query} UPSC prelims weightage topper strategy previous year questions")

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

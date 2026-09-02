"""
Extracts top-level chapter structure and chapter text from a textbook PDF.

Real-world finding this is built around: the two NCERT PDFs this project
ships with have their body-text font's character encoding scrambled (a
common anti-copy-paste measure) — the page *renders* correctly but
PyMuPDF's text-layer extraction returns nonsense glyphs, not real
characters. Page numbers extract fine; body text doesn't. So every text
extraction here first checks whether the text layer is actually usable, and
falls back to OCR (rendering the page as an image and reading it visually)
when it isn't. OCR is slow — that's fine, this pipeline runs unattended and
is explicitly allowed to take time.

Chapter structure: PDFs with a real embedded outline (fitz's get_toc()) use
that directly — those page numbers are already real PDF page indices, no
correction needed. Otherwise we OCR the book's own Contents page(s) near the
start and parse chapter entries out of it, trying two different real-world
layouts (one dot-leader line per entry, or a chapter number/title/page number
spread across several lines with "UNIT" section headers interspersed). That
page already *is* the book's authoritative top-level structure, which is a
better source than trying to detect headings throughout the whole document.

Critically, a Contents page lists the book's own *printed* page numbers, not
PDF page positions — a book with any front matter (cover, edition notice,
preface, foreword...) has those diverge by a constant offset. Using the
printed number unadjusted silently pulls the wrong pages for every chapter,
so the offset is detected separately (via the book's own running page-number
header/footer) and applied before any chapter's page range is finalized.
"""

import re
import pymupdf as fitz
from PIL import Image
import pytesseract

_FRONT_BACK_MATTER = {
    "cover", "contents", "content", "preface", "foreword", "acknowledgement",
    "acknowledgment", "index", "appendix", "glossary", "bibliography",
    "about the book", "about this book", "answers",
}

_TEXT_LAYER_GOOD_RATIO = 0.7
# How many pages from the start to OCR-scan looking for a Contents page.
# 15 was too tight for at least one real NCERT part whose front matter (title
# page, foreword, preface, acknowledgements) pushed the actual Contents page
# further in than that.
_TOC_SCAN_PAGES = 30
_OCR_DPI = 200

# Matches contents-page lines like "3. The Interior of the Earth ..... 25"
_TOC_LINE_RE = re.compile(r"^\s*(\d{1,2})[\.\)]?\s+(.{3,80}?)[\.\s\-–]{2,}(\d{1,4})\s*$")

# Some NCERT books lay each Contents entry out across several lines instead
# of one dot-leader line: a bare "1." starts an entry, then 1-2 title/
# subtitle lines, then the page number alone on its own line — with "UNIT"
# section headers and their own page ranges ("7-21") interspersed to skip.
_TOC_CHAPTER_START_RE = re.compile(r"^(\d{1,2})\.\s*$")
_TOC_PAGE_ONLY_RE = re.compile(r"^(\d{1,4})\s*$")
_TOC_PAGE_RANGE_RE = re.compile(r"^\d{1,4}\s*[-–]\s*\d{1,4}\s*$")
_TOC_UNIT_HEADER_RE = re.compile(r"^unit[\s\-]", re.IGNORECASE)
_TOC_MULTILINE_MAX_TITLE_LINES = 3

# A Contents page lists a book's own *printed* page numbers, which are offset
# from the PDF's actual 1-indexed page position by however many un-numbered
# or differently-numbered front-matter pages (cover, edition notice, NCF
# preface, foreword...) precede the numbered content. Detected by finding the
# book's own running page-number header/footer (a line that's just digits)
# on a sample of real content pages and taking the most common
# (pdf_page_index - printed_page_number) delta.
_PAGE_NUMBER_LINE_RE = re.compile(r"^(\d{1,4})$")
_OFFSET_DETECTION_SCAN_PAGES = 80


def _is_text_layer_garbled(text: str) -> bool:
    """True only when there's substantial text that reads as nonsense (the
    scrambled-font case) — NOT when a page simply has little text (a cover
    page, a full-page image). A sparse page isn't "unusable", it just has
    nothing on it; OCR wouldn't recover anything useful there either, so
    only substantial-but-garbled text is worth the OCR fallback."""
    stripped = text.strip()
    if len(stripped) < 200:
        return False
    good = sum(1 for c in text if c.isascii() and (c.isalnum() or c.isspace()))
    return (good / len(text)) <= _TEXT_LAYER_GOOD_RATIO


def _ocr_page(doc: fitz.Document, page_index: int) -> str:
    pix = doc[page_index].get_pixmap(dpi=_OCR_DPI)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    return pytesseract.image_to_string(img)


def _page_text(doc: fitz.Document, page_index: int, ocr_cache: dict) -> str:
    """Text-layer extraction, falling back to OCR only when the text layer
    has substantial garbled content. Caches OCR results within one run since
    the same page can be read more than once (once while hunting for the
    contents page, again when pulling a chapter's text)."""
    layer_text = doc[page_index].get_text("text")
    if not _is_text_layer_garbled(layer_text):
        return layer_text

    if page_index not in ocr_cache:
        ocr_cache[page_index] = _ocr_page(doc, page_index)
    return ocr_cache[page_index]


def _dedupe_toc_candidates(raw: list[tuple[int, str, int]]) -> list[dict]:
    """Shared cleanup for (chapter_number, title, printed_page) candidates
    from either Contents-page parsing strategy: drops front/back-matter
    labels, sorts by chapter number, dedupes repeated numbers (first
    occurrence wins), and drops entries whose page number goes backwards
    (parsing/OCR noise — page numbers should only increase)."""
    raw = [r for r in raw if r[1].lower() not in _FRONT_BACK_MATTER and len(r[1]) >= 3]
    raw.sort(key=lambda r: r[0])
    entries = []
    last_page = 0
    seen_numbers = set()
    for number, title, target_page in raw:
        if number in seen_numbers:
            continue
        if target_page < last_page:
            continue
        seen_numbers.add(number)
        entries.append({"chapter_number": number, "title": title, "page_start": target_page})
        last_page = target_page

    return entries if len(entries) >= 3 else []


def _parse_toc_entries(pages_text: dict[int, str]) -> list[dict]:
    """pages_text: {1-indexed page number: page text}. Handles a single
    dot-leader line per entry, e.g. "3. The Interior of the Earth ..... 25"."""
    raw = []
    for page_num, text in pages_text.items():
        for line in text.splitlines():
            m = _TOC_LINE_RE.match(line.strip())
            if not m:
                continue
            raw.append((int(m.group(1)), m.group(2).strip(), int(m.group(3))))

    if len(raw) < 3:
        # Diagnostic trail for when this tier fails — without this, a failure
        # is only visible as "no chapters found" with no way to tell whether
        # the Contents page just wasn't in the scanned range, used a
        # different layout, or was scanned but OCR'd/matched badly, short of
        # re-downloading the PDF by hand.
        print(f"[pdf_structure] Single-line Contents scan: only {len(raw)} candidate TOC line(s) matched across {len(pages_text)} scanned pages (need >=3).")
        return []

    return _dedupe_toc_candidates(raw)


def _parse_toc_entries_multiline(pages_text: dict[int, str]) -> list[dict]:
    """Handles a different real-world Contents-page layout than
    _parse_toc_entries: each entry spread across several lines instead of
    one dot-leader line — a bare "1." starts an entry, then 1-2 title/
    subtitle lines, then the page number alone on its own line — with "UNIT"
    section headers and their page ranges ("7-21") skipped."""
    raw = []
    for page_num, text in pages_text.items():
        current_number = None
        title_parts: list[str] = []
        for line in (l.strip() for l in text.splitlines()):
            if not line:
                continue
            if _TOC_UNIT_HEADER_RE.match(line) or _TOC_PAGE_RANGE_RE.match(line):
                continue  # a "UNIT" section header or its own page range, not a chapter

            start_m = _TOC_CHAPTER_START_RE.match(line)
            if start_m:
                current_number = int(start_m.group(1))
                title_parts = []
                continue

            if current_number is None:
                continue

            page_m = _TOC_PAGE_ONLY_RE.match(line)
            if page_m and title_parts:
                raw.append((current_number, " ".join(title_parts), int(page_m.group(1))))
                current_number = None
                title_parts = []
            elif not page_m and len(title_parts) < _TOC_MULTILINE_MAX_TITLE_LINES:
                title_parts.append(line)

    if len(raw) < 3:
        print(f"[pdf_structure] Multi-line Contents scan: only {len(raw)} candidate entries found across {len(pages_text)} scanned pages (need >=3).")
        return []

    return _dedupe_toc_candidates(raw)


def _detect_printed_page_offset(doc: fitz.Document, total_pages: int, ocr_cache: dict, search_pages: int) -> int | None:
    """Finds the constant offset between a book's own printed page numbers
    (its running header/footer — typically the first or last non-empty line
    of a page) and the PDF's actual 1-indexed page position. A Contents page
    always lists printed page numbers, and those are only the correct PDF
    page index when the book has zero front matter — never a safe
    assumption. Returns the most common offset found across a sample of
    pages, or None if no reliable signal was found (caller should treat that
    as "assume zero offset", not fail outright — better to guess the
    original, most-common behavior than to refuse to process the book)."""
    offsets: dict[int, int] = {}
    for p in range(0, min(search_pages, total_pages)):
        text = _page_text(doc, p, ocr_cache)
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if not lines:
            continue
        for candidate in (lines[0], lines[-1]):
            m = _PAGE_NUMBER_LINE_RE.match(candidate)
            if not m:
                continue
            printed = int(m.group(1))
            if 0 < printed <= total_pages:
                offset = (p + 1) - printed
                offsets[offset] = offsets.get(offset, 0) + 1
            break

    if not offsets:
        return None
    return max(offsets, key=offsets.get)


def extract_top_level_chapters(pdf_path: str) -> list[dict]:
    """Returns [{chapter_number, title, page_start, page_end}, ...], 1-indexed pages."""
    doc = fitz.open(pdf_path)
    try:
        total_pages = len(doc)
        print(f"[pdf_structure] {total_pages} total pages.")

        toc = doc.get_toc(simple=True)  # [[level, title, page], ...]
        chapters = _from_outline(toc, total_pages)
        if chapters:
            print(f"[pdf_structure] Found {len(chapters)} chapters from embedded outline.")
            return chapters
        print("[pdf_structure] No usable embedded outline — scanning for a Contents page.")

        ocr_cache: dict = {}
        scan_pages = min(_TOC_SCAN_PAGES, total_pages)
        scan_range = range(0, scan_pages)
        pages_text = {p + 1: _page_text(doc, p, ocr_cache) for p in scan_range}
        entries = _parse_toc_entries(pages_text)
        if not entries:
            entries = _parse_toc_entries_multiline(pages_text)
        if entries:
            # The Contents page lists the book's own *printed* page numbers,
            # not PDF page positions — using them unadjusted silently pulls
            # the wrong pages for every chapter on any book with non-trivial
            # front matter (cover, edition notice, preface, foreword...).
            offset = _detect_printed_page_offset(doc, total_pages, ocr_cache, _OFFSET_DETECTION_SCAN_PAGES)
            if offset is None:
                offset = 0
                print("[pdf_structure] Could not detect a printed-page-number offset — assuming Contents-page numbers already match PDF page indices.")
            else:
                print(f"[pdf_structure] Detected printed-page-number offset: {offset} (PDF page = printed page + {offset}).")

            chapters = []
            for i, entry in enumerate(entries):
                page_end = entries[i + 1]["page_start"] - 1 + offset if i + 1 < len(entries) else total_pages
                page_start = max(entry["page_start"] + offset, 1)
                chapters.append({
                    "chapter_number": entry["chapter_number"],
                    "title": entry["title"],
                    "page_start": page_start,
                    "page_end": max(min(page_end, total_pages), page_start),
                })
            print(f"[pdf_structure] Found {len(chapters)} chapters from Contents-page scan (pages 1-{scan_pages}).")
            return chapters

        print(f"[pdf_structure] No parseable Contents page in the first {scan_pages} pages — scanning for in-body chapter markers.")
        chapters = _from_chapter_marker_scan(doc, total_pages)
        if chapters:
            print(f"[pdf_structure] Found {len(chapters)} chapters from in-body marker scan.")
        else:
            print("[pdf_structure] No structure found by any method for this PDF.")
        return chapters
    finally:
        doc.close()


# Matches a stylized "CHAPTER" label with letters spaced out, a common
# textbook convention printed next to the chapter title on its opening page
# (e.g. "C H A P T E R"). Used as a last-resort structure signal when a book
# has neither an embedded outline nor a separate Contents page to parse.
_CHAPTER_MARKER_RE = re.compile(r"^C\s*H\s*A\s*P\s*T\s*E\s*R$", re.IGNORECASE)
_RUNNING_FOOTER_RE = re.compile(r"^reprint\s+\d{4}(-\d{2})?$", re.IGNORECASE)
_MARKER_LOOKBACK_LINES = 6
_MARKER_TITLE_LINES = 3


def _from_chapter_marker_scan(doc, total_pages: int) -> list[dict]:
    found = []  # [{page_start, title}]

    for page_index in range(total_pages):
        lines = [l.strip() for l in doc[page_index].get_text("text").splitlines()]
        for i, line in enumerate(lines):
            if not _CHAPTER_MARKER_RE.match(line):
                continue

            title_parts = []
            for j in range(i - 1, max(i - 1 - _MARKER_LOOKBACK_LINES, -1), -1):
                candidate = lines[j]
                if not candidate or _RUNNING_FOOTER_RE.match(candidate):
                    continue
                title_parts.insert(0, candidate)
                if len(title_parts) >= _MARKER_TITLE_LINES:
                    break

            if title_parts:
                found.append({"page_start": page_index + 1, "title": " ".join(title_parts)})
            break  # one marker is enough signal per page

    if not found:
        print("[pdf_structure] No in-body chapter markers found either — giving up on structure for this PDF.")
        return []

    chapters = []
    for i, entry in enumerate(found):
        page_end = found[i + 1]["page_start"] - 1 if i + 1 < len(found) else total_pages
        chapters.append({
            "chapter_number": i + 1,
            "title": entry["title"],
            "page_start": entry["page_start"],
            "page_end": max(page_end, entry["page_start"]),
        })

    _refine_titles_from_running_headers(doc, chapters, total_pages)
    return chapters


def _refine_titles_from_running_headers(doc, chapters: list[dict], total_pages: int) -> None:
    """The marker-scan title (whatever text happened to precede the "CHAPTER"
    label) is unreliable when a chapter's opening page uses decorative,
    letter-spaced heading typography that PyMuPDF fragments into single-
    character spans. Running headers are plain, single-line, and repeat
    predictably — books conventionally alternate the book title (verso
    pages) with the chapter title (recto pages). The book title is
    identified as whichever first-line text is most frequent across the
    whole document; each chapter's title is then the most frequent
    first-line within its own page range, excluding that book title."""
    book_title_counts: dict[str, int] = {}
    first_lines: dict[int, str] = {}
    for p in range(total_pages):
        lines = [l.strip() for l in doc[p].get_text("text").splitlines() if l.strip()]
        if lines and not lines[0].isdigit():
            first_lines[p] = lines[0]
            book_title_counts[lines[0]] = book_title_counts.get(lines[0], 0) + 1

    if not book_title_counts:
        return
    book_title_line = max(book_title_counts, key=book_title_counts.get)

    for ch in chapters:
        local_counts: dict[str, int] = {}
        for p in range(ch["page_start"] - 1, min(ch["page_end"], total_pages)):
            header = first_lines.get(p)
            if header and header != book_title_line:
                local_counts[header] = local_counts.get(header, 0) + 1
        if local_counts:
            ch["title"] = max(local_counts, key=local_counts.get)


def _from_outline(toc: list, total_pages: int) -> list[dict]:
    if not toc:
        return []

    top_level = min(level for level, _title, _page in toc)
    entries = [
        (title.strip(), page)
        for level, title, page in toc
        if level == top_level and title.strip().lower() not in _FRONT_BACK_MATTER
    ]
    if not entries:
        return []

    chapters = []
    for i, (title, page_start) in enumerate(entries):
        page_end = entries[i + 1][1] - 1 if i + 1 < len(entries) else total_pages
        chapters.append({
            "chapter_number": i + 1,
            "title": title,
            "page_start": max(page_start, 1),
            "page_end": max(page_end, page_start),
        })
    return chapters


def extract_chapter_text(pdf_path: str, page_start: int, page_end: int) -> str:
    doc = fitz.open(pdf_path)
    try:
        ocr_cache: dict = {}
        pages = range(max(page_start - 1, 0), min(page_end, len(doc)))
        return "\n".join(_page_text(doc, p, ocr_cache) for p in pages)
    finally:
        doc.close()

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
that directly. Otherwise — which is the case for both PDFs currently in this
project, since they have no outline either — we OCR the book's own Contents
page(s) near the start and parse "<number>  <title> ... <page>" entries out
of it. That page already *is* the book's authoritative top-level structure,
which is a better source than trying to detect headings throughout the whole
document.
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
_TOC_SCAN_PAGES = 15
_OCR_DPI = 200

# Matches contents-page lines like "3. The Interior of the Earth ..... 25"
_TOC_LINE_RE = re.compile(r"^\s*(\d{1,2})[\.\)]?\s+(.{3,80}?)[\.\s\-–]{2,}(\d{1,4})\s*$")


def _is_text_layer_usable(text: str) -> bool:
    if not text or len(text.strip()) < 20:
        return False
    good = sum(1 for c in text if c.isascii() and (c.isalnum() or c.isspace()))
    return (good / len(text)) > _TEXT_LAYER_GOOD_RATIO


def _ocr_page(doc: fitz.Document, page_index: int) -> str:
    pix = doc[page_index].get_pixmap(dpi=_OCR_DPI)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    return pytesseract.image_to_string(img)


def _page_text(doc: fitz.Document, page_index: int, ocr_cache: dict) -> str:
    """Text-layer extraction if it's usable, OCR otherwise. Caches OCR results
    within one run since the same page can be read more than once (once while
    hunting for the contents page, again when pulling a chapter's text)."""
    layer_text = doc[page_index].get_text("text")
    if _is_text_layer_usable(layer_text):
        return layer_text

    if page_index not in ocr_cache:
        ocr_cache[page_index] = _ocr_page(doc, page_index)
    return ocr_cache[page_index]


def _parse_toc_entries(pages_text: dict[int, str]) -> list[dict]:
    """pages_text: {1-indexed page number: page text}. Returns chapters sorted
    by chapter_number, deduped, with clearly-out-of-order noise dropped."""
    raw = []
    for page_num, text in pages_text.items():
        for line in text.splitlines():
            m = _TOC_LINE_RE.match(line.strip())
            if not m:
                continue
            number, title, target_page = int(m.group(1)), m.group(2).strip(), int(m.group(3))
            if title.lower() in _FRONT_BACK_MATTER or len(title) < 3:
                continue
            raw.append((number, title, target_page))

    if len(raw) < 3:
        return []

    raw.sort(key=lambda r: r[0])
    entries = []
    last_page = 0
    seen_numbers = set()
    for number, title, target_page in raw:
        if number in seen_numbers:
            continue
        if target_page < last_page:
            continue  # OCR noise — page numbers should only increase
        seen_numbers.add(number)
        entries.append({"chapter_number": number, "title": title, "page_start": target_page})
        last_page = target_page

    return entries if len(entries) >= 3 else []


def extract_top_level_chapters(pdf_path: str) -> list[dict]:
    """Returns [{chapter_number, title, page_start, page_end}, ...], 1-indexed pages."""
    doc = fitz.open(pdf_path)
    try:
        total_pages = len(doc)

        toc = doc.get_toc(simple=True)  # [[level, title, page], ...]
        chapters = _from_outline(toc, total_pages)
        if chapters:
            return chapters

        ocr_cache: dict = {}
        scan_range = range(0, min(_TOC_SCAN_PAGES, total_pages))
        pages_text = {p + 1: _page_text(doc, p, ocr_cache) for p in scan_range}
        entries = _parse_toc_entries(pages_text)
        if not entries:
            print("[pdf_structure] No embedded outline and no parseable Contents page found.")
            return []

        chapters = []
        for i, entry in enumerate(entries):
            page_end = entries[i + 1]["page_start"] - 1 if i + 1 < len(entries) else total_pages
            chapters.append({
                "chapter_number": entry["chapter_number"],
                "title": entry["title"],
                "page_start": max(entry["page_start"], 1),
                "page_end": max(page_end, entry["page_start"]),
            })
        return chapters
    finally:
        doc.close()


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

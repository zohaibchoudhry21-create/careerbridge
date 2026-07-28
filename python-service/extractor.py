import io
import os
import gc
import logging
import re
import subprocess
import tempfile
from typing import Any

import fitz
import pdfplumber
import pytesseract
from pdf2image import convert_from_bytes

from cleaner import _normalize_for_compare, clean_text
from platform_config import POPPLER_BIN, configure_platform_tools

configure_platform_tools()

logger = logging.getLogger(__name__)

# =========================
# CONFIG
# =========================
MIN_PAGE_TEXT = 50
MIN_DIGITAL_TEXT_FOR_SKIP_TABLES = 180
MAX_PDF_SIZE_MB = 50
MAX_PAGES = 500
OCR_DPI = 250
OCR_LANG = "eng"
OCR_TIMEOUT = 30

# Matches bullet markers: -, •, *, ‣, ▪, ◦, or numbered/lettered lists (1. / 1) / a.)
BULLET_RE = re.compile(r"^(?:[-•*‣▪◦]|\d+[.)]|[a-zA-Z][.)])\s+")
INLINE_SECTION_HEADING_RE = re.compile(
    r"^(?P<heading>PROFESSIONAL SUMMARY|WORK EXPERIENCE|SUMMARY|EXPERIENCE|"
    r"EDUCATION|SKILLS|CORE COMPETENCIES|CERTIFICATIONS|PROJECTS|LANGUAGES)"
    r"\s+(?P<body>.+)$",
    re.IGNORECASE,
)


# =========================
# PDF FONT CHECK
# =========================
def _run_pdffonts(pdf_bytes: bytes) -> bool | None:
    """
    Detect if PDF contains fonts.
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False
        ) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
        result = subprocess.run(
            [
                "pdffonts",
                tmp_path
            ],
            capture_output=True,
            text=True,
            timeout=30,
            check=False
        )
        if result.returncode != 0:
            return None
        lines = [
            x.strip()
            for x in result.stdout.splitlines()
            if x.strip()
        ]
        if len(lines) <= 2:
            return False
        return True
    except (
        FileNotFoundError,
        subprocess.SubprocessError
    ):
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# =========================
# REAL TEXT DETECTION
# =========================
def _has_real_text(doc: fitz.Document) -> bool:
    chars = 0
    try:
        for page in doc:
            chars += len(
                page.get_text().strip()
            )
            if chars > MIN_PAGE_TEXT:
                return True
    except Exception as e:
        logger.warning(
            "Text detection failed",
            exc_info=e
        )
    return False


# =========================
# OCR
# =========================
def _ocr_page(
    pdf_bytes: bytes,
    page_index: int
) -> str:
    images = []
    try:
        kwargs = {
            "dpi": OCR_DPI,
            "first_page": page_index + 1,
            "last_page": page_index + 1
        }
        if POPPLER_BIN:
            kwargs["poppler_path"] = POPPLER_BIN
        images = convert_from_bytes(
            pdf_bytes,
            **kwargs
        )
        if not images:
            return ""
        text = pytesseract.image_to_string(
            images[0],
            lang=OCR_LANG,
            timeout=OCR_TIMEOUT
        )
        return text or ""
    except RuntimeError as e:
        logger.warning(
            "OCR timeout page=%s",
            page_index + 1
        )
        return ""
    except Exception as e:
        logger.error(
            "OCR failed",
            exc_info=e
        )
        return ""
    finally:
        for img in images:
            try:
                img.close()
            except Exception:
                pass
        gc.collect()


# =========================
# TABLE EXTRACTION
# =========================
def _extract_tables_for_page(
    pdf_bytes: bytes,
    page_index: int
) -> str:
    blocks = []
    try:
        with pdfplumber.open(
            io.BytesIO(pdf_bytes)
        ) as pdf:
            if page_index >= len(pdf.pages):
                return ""
            page = pdf.pages[page_index]
            tables = page.extract_tables() or []
            for table in tables:
                for row in table:
                    cells = [
                        str(cell).strip()
                        for cell in row
                        if cell
                        and str(cell).strip()
                    ]
                    if cells:
                        blocks.append(
                            " | ".join(cells)
                        )
    except Exception as e:
        logger.warning(
            "Table extraction failed",
            exc_info=e
        )
    return "\n".join(blocks)


# =========================
# WRAPPED-LINE MERGING (NEW)
# =========================
def _split_inline_section_headings(line: str) -> list[str]:
    """Split 'WORK EXPERIENCE Senior Engineer...' back into heading + body lines."""
    match = INLINE_SECTION_HEADING_RE.match(line.strip())
    if not match:
        return [line]

    heading = match.group("heading").strip().upper()
    body = match.group("body").strip()
    if not body:
        return [heading]
    return [heading, body]


def _merge_wrapped_lines_in_paragraph(text: str) -> str:
    """Collapse visual wrap-only newlines inside a single paragraph block."""
    raw_lines = [line.strip() for line in text.split("\n")]
    merged: list[str] = []

    for line in raw_lines:
        if not line:
            continue

        is_bullet = bool(BULLET_RE.match(line))
        if merged and not is_bullet and not BULLET_RE.match(merged[-1]):
            merged[-1] = f"{merged[-1]} {line}"
        else:
            merged.append(line)

    return "\n".join(merged)


def _merge_wrapped_lines(text: str) -> str:
    """
    PyMuPDF preserves visual line wraps as literal newlines inside a text block.
    Merge wrap-only breaks within each paragraph (split on blank lines), while
    keeping real paragraph boundaries and bullet items separate.
    """
    paragraphs = re.split(r"\n\s*\n", text)
    merged_paragraphs: list[str] = []

    for paragraph in paragraphs:
        merged = _merge_wrapped_lines_in_paragraph(paragraph)
        if not merged.strip():
            continue

        split_lines: list[str] = []
        for line in merged.split("\n"):
            split_lines.extend(_split_inline_section_headings(line))

        merged_paragraphs.append("\n".join(split_lines))

    return "\n\n".join(merged_paragraphs)


# =========================
# FITZ TEXT + LAYOUT
# =========================
def _extract_page_with_fitz(
    doc: fitz.Document,
    page_index: int
) -> str:
    page = doc.load_page(page_index)
    try:
        blocks = page.get_text(
            "blocks",
            sort=True
        )
        parts = []
        for block in blocks:
            if len(block) < 5:
                continue
            if len(block) >= 7 and block[6] != 0:
                continue
            text = str(
                block[4]
            ).strip()
            if text:
                parts.append(_merge_wrapped_lines(text))
        if parts:
            return "\n\n".join(parts)
    except Exception as e:
        logger.warning(
            "Fitz extraction failed",
            exc_info=e
        )
    return page.get_text("text")


# =========================
# MERGE
# =========================
def _merge_page_text(
    primary: str,
    tables: str
) -> str:
    primary = primary.strip()
    tables = tables.strip()
    if not tables:
        return primary
    if len(primary) >= MIN_DIGITAL_TEXT_FOR_SKIP_TABLES:
        return primary
    primary_norm = _normalize_for_compare(
        primary
    )
    extra = []
    for line in tables.split("\n"):
        norm = _normalize_for_compare(
            line
        )
        if norm and norm not in primary_norm:
            extra.append(line)
    if not extra:
        return primary
    return (
        primary
        + "\n"
        + "\n".join(extra)
    )


# =========================
# MAIN EXTRACTION
# =========================
def extract_pdf(
    pdf_bytes: bytes
) -> dict[str, Any]:
    # Security checks
    size_mb = len(pdf_bytes) / (
        1024 * 1024
    )
    if size_mb > MAX_PDF_SIZE_MB:
        raise ValueError(
            "PDF too large"
        )
    try:
        doc = fitz.open(
            stream=pdf_bytes,
            filetype="pdf"
        )
    except Exception as e:
        raise ValueError(
            "Invalid PDF"
        ) from e
    page_count = doc.page_count
    if page_count > MAX_PAGES:
        doc.close()
        raise ValueError(
            "Too many pages"
        )
    has_fonts = _run_pdffonts(
        pdf_bytes
    )
    real_text = _has_real_text(
        doc
    )
    scanned_document = not real_text
    page_texts = []
    for index in range(page_count):
        source = "digital"
        if scanned_document:
            text = _ocr_page(
                pdf_bytes,
                index
            )
            source = "ocr"
        else:
            fitz_text = _extract_page_with_fitz(
                doc,
                index
            )
            tables = _extract_tables_for_page(
                pdf_bytes,
                index
            )
            text = _merge_page_text(
                fitz_text,
                tables
            )
            if len(text.strip()) < MIN_PAGE_TEXT:
                ocr = _ocr_page(
                    pdf_bytes,
                    index
                )
                if len(ocr.strip()) > len(text.strip()):
                    text = ocr
                    source = "ocr"
        page_texts.append(
            {
                "page": index + 1,
                "text": clean_text(text),
                "source": source
            }
        )
    doc.close()
    full_text = clean_text(
        "\n\n".join(
            x["text"]
            for x in page_texts
            if x["text"]
        )
    )
    metadata = {
        "title": "",
        "author": "",
        "pages": page_count,
        "has_text_layer": has_fonts,
        "extraction_mode":
            (
                "scanned"
                if scanned_document
                else
                "mixed"
                if any(
                    x["source"] == "ocr"
                    for x in page_texts
                )
                else
                "digital"
            )
    }
    try:
        meta_doc = fitz.open(
            stream=pdf_bytes,
            filetype="pdf"
        )
        meta = meta_doc.metadata or {}
        metadata["title"] = (
            meta.get("title")
            or ""
        )
        metadata["author"] = (
            meta.get("author")
            or ""
        )
        meta_doc.close()
    except Exception as e:
        logger.warning(
            "Metadata failed",
            exc_info=e
        )
    return {
        "pages": page_count,
        "page_texts": page_texts,
        "full_text": full_text,
        "metadata": metadata
    }

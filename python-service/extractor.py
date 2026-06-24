import io
import os
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

MIN_PAGE_TEXT = 50
MIN_DIGITAL_TEXT_FOR_SKIP_TABLES = 180


def _run_pdffonts(pdf_bytes: bytes) -> bool | None:
    """Return True if PDF has fonts (text layer), False if not, None if pdffonts unavailable."""
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        result = subprocess.run(
            ["pdffonts", tmp_path],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )

        if result.returncode != 0:
            return None

        lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
        if len(lines) <= 2:
            return False

        data_rows = lines[2:]
        return any(row and not row.lower().startswith("name") for row in data_rows)
    except (FileNotFoundError, subprocess.SubprocessError):
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def _ocr_page(pdf_bytes: bytes, page_index: int) -> str:
    convert_kwargs = {
        "dpi": 300,
        "first_page": page_index + 1,
        "last_page": page_index + 1,
    }
    if POPPLER_BIN:
        convert_kwargs["poppler_path"] = POPPLER_BIN

    images = convert_from_bytes(pdf_bytes, **convert_kwargs)
    if not images:
        return ""
    return pytesseract.image_to_string(images[0]) or ""


def _extract_tables_for_page(pdf_bytes: bytes, page_index: int) -> str:
    blocks: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            if page_index >= len(pdf.pages):
                return ""
            page = pdf.pages[page_index]
            tables = page.extract_tables() or []
            for table in tables:
                for row in table:
                    cells = [str(cell).strip() for cell in row if cell is not None and str(cell).strip()]
                    if cells:
                        blocks.append(" | ".join(cells))
    except Exception:
        return ""

    return "\n".join(blocks)


def _extract_page_with_fitz(doc: fitz.Document, page_index: int) -> str:
    page = doc.load_page(page_index)

    try:
        blocks = page.get_text("blocks", sort=True) or []
        parts: list[str] = []
        for block in blocks:
            if len(block) < 5:
                continue
            if len(block) >= 7 and block[6] != 0:
                continue
            text = str(block[4]).strip()
            if text:
                parts.append(text)
        if parts:
            return "\n\n".join(parts)
    except Exception:
        pass

    try:
        return page.get_text("text", sort=True) or ""
    except TypeError:
        return page.get_text("text") or ""


def _merge_page_text(primary: str, tables: str) -> str:
    primary = primary.strip()
    tables = tables.strip()

    if not tables:
        return primary

    # On resume PDFs, pdfplumber tables often duplicate the full page body text.
    if len(primary) >= MIN_DIGITAL_TEXT_FOR_SKIP_TABLES:
        return primary

    primary_norm = _normalize_for_compare(primary)
    extra_lines: list[str] = []

    for line in tables.split("\n"):
        line = line.strip()
        if not line:
            continue
        line_norm = _normalize_for_compare(line)
        if line_norm and line_norm not in primary_norm:
            extra_lines.append(line)

    if not extra_lines:
        return primary

    return f"{primary}\n" + "\n".join(extra_lines)


def extract_pdf(pdf_bytes: bytes) -> dict[str, Any]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = doc.page_count

    has_fonts = _run_pdffonts(pdf_bytes)
    page_texts: list[dict[str, Any]] = []

    fitz_lengths = []
    for page_index in range(page_count):
        fitz_text = _extract_page_with_fitz(doc, page_index)
        fitz_lengths.append(len(fitz_text.strip()))

    total_fitz_chars = sum(fitz_lengths)
    scanned_document = has_fonts is False or (
        has_fonts is None and total_fitz_chars < MIN_PAGE_TEXT * max(page_count, 1)
    )

    for page_index in range(page_count):
        page_num = page_index + 1
        source = "digital"

        if scanned_document:
            text = _ocr_page(pdf_bytes, page_index)
            source = "ocr"
        else:
            fitz_text = _extract_page_with_fitz(doc, page_index)
            tables = _extract_tables_for_page(pdf_bytes, page_index)
            text = _merge_page_text(fitz_text, tables)

            # Only use OCR when the digital layer is effectively empty.
            if len(text.strip()) < MIN_PAGE_TEXT:
                ocr_text = _ocr_page(pdf_bytes, page_index)
                if len(ocr_text.strip()) > len(text.strip()):
                    text = ocr_text
                    source = "ocr"

        page_texts.append(
            {
                "text": clean_text(text),
                "page": page_num,
                "source": source,
            }
        )

    doc.close()

    full_text = clean_text("\n\n".join(item["text"] for item in page_texts if item["text"]))

    metadata = {
        "title": "",
        "author": "",
        "pages": page_count,
        "has_text_layer": has_fonts,
        "extraction_mode": (
            "scanned"
            if scanned_document
            else "mixed"
            if any(item["source"] == "ocr" for item in page_texts)
            else "digital"
        ),
    }

    try:
        meta_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        meta = meta_doc.metadata or {}
        metadata["title"] = meta.get("title") or ""
        metadata["author"] = meta.get("author") or ""
        meta_doc.close()
    except Exception:
        pass

    return {
        "pages": page_count,
        "page_texts": page_texts,
        "full_text": full_text,
        "metadata": metadata,
    }

"""
Rule-based ATS normalizer.
Rebuilds resume text in a canonical single-column ATS order from structured
sections produced by resume_extractor.parse_structured_sections.
"""
from __future__ import annotations

import re
from typing import Any

from resume_extractor import parse_structured_sections

CANONICAL_SECTIONS: list[tuple[str, str]] = [
    ("summary", "PROFESSIONAL SUMMARY"),
    ("experience", "WORK EXPERIENCE"),
    ("education", "EDUCATION"),
    ("skills", "SKILLS"),
]

ADDITIONAL_SECTION_HEADINGS: dict[str, str] = {
    "certifications": "CERTIFICATIONS",
    "projects": "PROJECTS",
    "languages": "LANGUAGES",
    "awards": "AWARDS",
    "volunteer": "VOLUNTEER EXPERIENCE",
    "interests": "INTERESTS",
    "references": "REFERENCES",
}

TABLE_PIPE_RE = re.compile(r"\s*\|\s*")
DATE_RANGE_RE = re.compile(
    r"\b(19|20)\d{2}\b.*\b(present|current|(?:19|20)\d{2})\b",
    re.IGNORECASE,
)
DEGREE_RE = re.compile(
    r"\b(bachelor|master|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|ph\.?d|diploma|degree|university|college)\b",
    re.IGNORECASE,
)

# FIX: `*` instead of `+` so a single standalone label line (e.g. just
# "Address:") matches too — not only combined lines like
# "Address: Phone: Email:". Trailing `:` is mandatory (no longer optional)
# so a bare word without a colon isn't accidentally treated as a label line.
LABEL_ONLY_LINE_RE = re.compile(
    r"^(?:address|phone|email|linkedin|github|tel|mobile)"
    r"(?:\s*:\s*(?:address|phone|email|linkedin|github|tel|mobile))*\s*:\s*$",
    re.IGNORECASE,
)
CONTACT_FIELD_RE = re.compile(r"\b(phone|email|tel|mobile|linkedin|github)\s*:", re.IGNORECASE)


def preprocess_extraction_artifacts(text: str) -> str:
    """Remove PDF/DOCX junk labels and expand inline contact rows."""
    cleaned_lines: list[str] = []
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped:
            cleaned_lines.append("")
            continue
        if LABEL_ONLY_LINE_RE.match(stripped):
            continue
        if "|" in stripped and (CONTACT_FIELD_RE.search(stripped) or "@" in stripped):
            cells = [cell.strip() for cell in TABLE_PIPE_RE.split(stripped) if cell.strip()]
            if len(cells) >= 2:
                cleaned_lines.extend(cells)
                continue
        cleaned_lines.append(stripped)
    return "\n".join(cleaned_lines)


def _format_experience_lines(lines: list[str]) -> list[str]:
    """Split long run-on experience paragraphs into readable bullet lines."""
    formatted: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(("-", "•", "*")):
            formatted.append(stripped)
            continue
        if DATE_RANGE_RE.search(stripped) or "|" in stripped:
            formatted.append(stripped)
            continue
        if len(stripped) > 160 and ". " in stripped:
            parts = re.split(r"(?<=\.)\s+(?=[A-Z])", stripped)
            formatted.extend(part.strip() for part in parts if part.strip())
            continue
        formatted.append(stripped)
    return formatted


def expand_table_rows(text: str) -> str:
    """Convert inline table rows (pipe-separated cells) into one value per line."""
    expanded: list[str] = []
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped:
            expanded.append("")
            continue
        if "|" in stripped:
            cells = [cell.strip() for cell in TABLE_PIPE_RE.split(stripped) if cell.strip()]
            if len(cells) >= 2:
                expanded.extend(cells)
                continue
        expanded.append(stripped)
    return "\n".join(expanded)


def _dedupe_preserve_order(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for line in lines:
        key = line.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(line.strip())
    return result


def _section_body_lines(section_payload: dict[str, Any] | None) -> list[str]:
    if not section_payload:
        return []
    paragraphs = section_payload.get("paragraphs") or []
    if paragraphs:
        lines: list[str] = []
        for paragraph in paragraphs:
            lines.extend(line.strip() for line in str(paragraph).split("\n") if line.strip())
        return lines
    text = str(section_payload.get("text") or "").strip()
    if not text:
        return []
    return [line.strip() for line in text.split("\n") if line.strip()]


def _render_contact_block(contact: dict[str, Any] | None) -> list[str]:
    contact = contact or {}
    lines: list[str] = []
    name = str(contact.get("name") or "").strip()
    headline = str(contact.get("headline") or "").strip()
    contact_lines = [str(line).strip() for line in contact.get("lines") or [] if str(line).strip()]
    if name:
        lines.append(name)
    if headline and headline.lower() != name.lower():
        lines.append(headline)
    for line in contact_lines:
        if line.lower() not in {item.lower() for item in lines}:
            lines.append(line)
    return lines


def _render_skills_lines(section_payload: dict[str, Any] | None) -> list[str]:
    if not section_payload:
        return []
    items = [str(item).strip() for item in section_payload.get("items") or [] if str(item).strip()]
    if items:
        return [", ".join(items)]
    return _section_body_lines(section_payload)


def _split_unassigned_blocks(unassigned_text: str) -> dict[str, list[str]]:
    """Heuristically bucket orphan text when headings were parsed out of order."""
    blocks: dict[str, list[str]] = {
        "summary": [],
        "experience": [],
        "education": [],
        "skills": [],
        "other": [],
    }
    current = "summary"
    for line in unassigned_text.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        lowered = stripped.lower()
        if DEGREE_RE.search(stripped):
            current = "education"
        elif DATE_RANGE_RE.search(stripped) or re.search(r"\b(present|current)\b", lowered):
            current = "experience"
        elif stripped.startswith(("-", "•", "*")):
            current = "experience"
        elif (
            "," in stripped
            and len(stripped) < 180
            and not DATE_RANGE_RE.search(stripped)
            and not DEGREE_RE.search(stripped)
            and stripped.count(",") >= 2
            and not re.search(r"\b(university|college|institute|school)\b", lowered)
        ):
            current = "skills"
        elif (
            len(stripped) < 100
            and re.search(
                r"\b(specialist|manager|engineer|developer|analyst|coordinator|inspector)\b",
                lowered,
            )
            and ("|" in stripped or DATE_RANGE_RE.search(stripped))
        ):
            current = "experience"
        blocks[current].append(stripped)
    return blocks


def _redistribute_misplaced_content(section_bodies: dict[str, list[str]]) -> dict[str, list[str]]:
    """
    When headings were extracted out of order, content often lands entirely in summary.
    Split mixed summary blocks into canonical sections when dedicated sections are empty.
    """
    summary_lines = section_bodies.get("summary", [])
    if len(summary_lines) < 3:
        return section_bodies
    has_dedicated_content = any(section_bodies.get(key) for key in ("experience", "education", "skills"))
    if has_dedicated_content:
        return section_bodies
    buckets = _split_unassigned_blocks("\n".join(summary_lines))
    section_bodies["summary"] = buckets["summary"]
    section_bodies["experience"] = _merge_section_lines(section_bodies["experience"], buckets["experience"])
    section_bodies["education"] = _merge_section_lines(section_bodies["education"], buckets["education"])
    section_bodies["skills"] = _merge_section_lines(section_bodies["skills"], buckets["skills"])
    section_bodies["experience"] = _merge_section_lines(section_bodies["experience"], buckets["other"])
    return section_bodies


def _merge_section_lines(existing: list[str], extra: list[str]) -> list[str]:
    if not extra:
        return existing
    if not existing:
        return extra
    return _dedupe_preserve_order([*existing, *extra])


def normalize_to_ats(structured_sections: dict[str, Any] | None) -> str:
    sections = structured_sections or {}
    output_lines: list[str] = []

    contact_lines = _render_contact_block(sections.get("contact"))
    if contact_lines:
        output_lines.extend(contact_lines)
        output_lines.append("")

    section_bodies: dict[str, list[str]] = {
        key: _section_body_lines(sections.get(key)) for key, _ in CANONICAL_SECTIONS
    }
    section_bodies["skills"] = _render_skills_lines(sections.get("skills"))

    unassigned_text = str(sections.get("unassigned", {}).get("text") or "").strip()
    if unassigned_text:
        buckets = _split_unassigned_blocks(unassigned_text)
        section_bodies["summary"] = _merge_section_lines(section_bodies["summary"], buckets["summary"])
        section_bodies["experience"] = _merge_section_lines(section_bodies["experience"], buckets["experience"])
        section_bodies["education"] = _merge_section_lines(section_bodies["education"], buckets["education"])
        section_bodies["skills"] = _merge_section_lines(section_bodies["skills"], buckets["skills"])
        if buckets["other"]:
            section_bodies["experience"] = _merge_section_lines(section_bodies["experience"], buckets["other"])

    section_bodies = _redistribute_misplaced_content(section_bodies)

    if section_bodies.get("experience"):
        section_bodies["experience"] = _format_experience_lines(section_bodies["experience"])

    for section_key, default_heading in CANONICAL_SECTIONS:
        body_lines = [line for line in section_bodies.get(section_key, []) if line.strip()]
        if not body_lines:
            continue
        output_lines.append(default_heading)
        output_lines.extend(body_lines)
        output_lines.append("")

    for extra in sections.get("additional_sections") or []:
        body_lines = _section_body_lines(extra)
        if not body_lines:
            continue
        section_type = str(extra.get("type") or "").strip().lower()
        heading = str(extra.get("heading") or "").strip().upper()
        if not heading:
            heading = ADDITIONAL_SECTION_HEADINGS.get(section_type, section_type.upper() or "ADDITIONAL")
        output_lines.append(heading)
        output_lines.extend(body_lines)
        output_lines.append("")

    while output_lines and not output_lines[-1].strip():
        output_lines.pop()

    return "\n".join(output_lines)


def normalize_resume_extraction(
    raw_text: str,
    structured_sections: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Normalize extracted resume content to ATS-friendly linear text.
    Returns normalized text, structured sections, and line map derived from the
    normalized output (single source of truth for downstream rendering).
    """
    preprocessed = preprocess_extraction_artifacts(expand_table_rows(raw_text or ""))
    parsed = parse_structured_sections(preprocessed)
    sections = structured_sections or parsed["structured_sections"]
    normalized_text = normalize_to_ats(sections)
    if not normalized_text.strip():
        normalized_text = preprocessed.strip()
    normalized_parsed = parse_structured_sections(normalized_text)
    changed = normalized_text.strip() != preprocessed.strip()
    return {
        "raw_text": preprocessed,
        "normalized_text": normalized_text,
        "structured_sections": normalized_parsed["structured_sections"],
        "lines": normalized_parsed["lines"],
        "normalization": {
            "method": "rule-based",
            "applied": True,
            "changed": changed,
        },
    }
    
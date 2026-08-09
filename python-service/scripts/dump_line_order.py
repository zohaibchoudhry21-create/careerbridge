#!/usr/bin/env python3
"""Print ordered lines from resume extraction for debugging reading order."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import fitz  # noqa: E402

from resume_extractor import extract_resume_bytes, parse_structured_sections  # noqa: E402

CONTROL_TEXT = """Jane Jobscan
Senior Content Marketing Manager
fakeemail@mail.com | linkedin.com/in/jane-jobscan | 123-456-7890

PROFESSIONAL SUMMARY
Results-oriented content marketing manager with 8 years of digital media experience.

WORK EXPERIENCE
Senior Content Marketing Manager, ACME
June 2022 - Present
- Led B2C content marketing strategy across blogs and social media.

EDUCATION
Bachelor of Arts in Marketing, State University
2014 - 2018

SKILLS
Content Strategy, SEO, Google Analytics"""


def dump_lines(label: str, lines: list[dict], limit: int = 20) -> None:
    print(f"\n=== {label} (first {limit} lines) ===")
    for line in lines[:limit]:
        number = line.get("line_number", "?")
        text = line.get("text", "")
        section = line.get("section_type") or "-"
        print(f"{number:>3} [{section}] {text[:90]}")


def build_control_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), CONTROL_TEXT)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def main() -> int:
    parser = argparse.ArgumentParser(description="Dump extraction line order.")
    parser.add_argument("file", nargs="?", type=Path, help="Optional PDF/DOCX to inspect")
    parser.add_argument("--limit", type=int, default=20)
    args = parser.parse_args()

    parsed = parse_structured_sections(CONTROL_TEXT)
    dump_lines("CONTROL plain text", parsed["lines"], args.limit)

    control_pdf = extract_resume_bytes(build_control_pdf(), "control-single-column.pdf")
    dump_lines("CONTROL generated PDF", control_pdf["lines"], args.limit)

    fixture = ROOT / "tests" / "fixtures" / "sample-resume.pdf"
    if fixture.exists():
        fixture_result = extract_resume_bytes(fixture.read_bytes(), fixture.name)
        dump_lines("FIXTURE sample-resume.pdf", fixture_result["lines"], args.limit)

    if args.file:
        if not args.file.exists():
            print(f"File not found: {args.file}", file=sys.stderr)
            return 1
        custom = extract_resume_bytes(args.file.read_bytes(), args.file.name)
        dump_lines(f"CUSTOM {args.file.name}", custom["lines"], args.limit)
        print("\nfull_text preview:")
        print(custom["full_text"][:500])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Generate a multi-section resume PDF for scanner extraction testing."""

from __future__ import annotations

import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from resume_extractor import extract_resume_bytes  # noqa: E402

COMPLEX_RESUME = """Alex Rivera
Safety Inspector
alex.rivera@example.com | (555) 201-8899 | Chicago, IL

PROFESSIONAL SUMMARY
Certified safety inspector with 8+ years monitoring OSHA compliance across manufacturing sites.

CORE COMPETENCIES
OSHA 30, Hazard Analysis, Incident Reporting, PPE Audits, Root Cause Analysis

WORK EXPERIENCE
Lead Safety Inspector, Northline Manufacturing
Jan 2020 - Present
- Conducted weekly site inspections and reduced recordable incidents by 32%.
- Led lockout/tagout training for 120 operators.

Safety Coordinator, Metro Logistics
Jun 2016 - Dec 2019
- Implemented forklift safety program and standardized incident logs.

EDUCATION
B.S. Occupational Safety, Midwest Technical College
2012 - 2016
"""


def main() -> int:
    out_dir = ROOT / "tests" / "fixtures"
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = out_dir / "complex-resume.pdf"

    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), COMPLEX_RESUME)
    pdf_path.write_bytes(doc.tobytes())
    doc.close()

    result = extract_resume_bytes(pdf_path.read_bytes(), pdf_path.name)
    print(f"Wrote {pdf_path}")
    print(f"line_count={len(result['lines'])}")
    for line in result["lines"][:20]:
        print(f"{line['line_number']:>3} [{line.get('section_type') or '-'}] {line['text'][:90]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

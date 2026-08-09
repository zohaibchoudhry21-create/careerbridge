#!/usr/bin/env python3
"""Verify resume extraction against a local PDF or DOCX file.

Usage:
  python scripts/verify_extract_resume.py path/to/resume.pdf
  python scripts/verify_extract_resume.py path/to/resume.docx
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from resume_extractor import extract_resume_bytes  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify CareerBridge resume extraction.")
    parser.add_argument("file", type=Path, help="Path to a PDF or DOCX resume file")
    parser.add_argument(
        "--preview-chars",
        type=int,
        default=400,
        help="Number of characters to preview from full_text",
    )
    args = parser.parse_args()

    if not args.file.exists():
        print(f"File not found: {args.file}", file=sys.stderr)
        return 1

    file_bytes = args.file.read_bytes()
    result = extract_resume_bytes(file_bytes, args.file.name)

    summary = {
        "success": result["success"],
        "filename": result["filename"],
        "file_type": result["file_type"],
        "pages": result["pages"],
        "full_text_length": len(result["full_text"]),
        "line_count": len(result["lines"]),
        "sections_detected": {
            key: bool((value or {}).get("text") if isinstance(value, dict) else value)
            for key, value in result["structured_sections"].items()
            if key != "additional_sections"
        },
        "skills_count": len(result["structured_sections"].get("skills", {}).get("items", [])),
        "metadata": result.get("metadata", {}),
        "full_text_preview": result["full_text"][: args.preview_chars],
        "normalization": result.get("normalization", {}),
        "raw_text_preview": (result.get("raw_text") or "")[: args.preview_chars],
    }

    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

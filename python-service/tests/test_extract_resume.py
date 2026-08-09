import io
import sys
import unittest
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from resume_extractor import extract_resume_bytes, parse_structured_sections  # noqa: E402
from extractor import _merge_wrapped_lines  # noqa: E402


SAMPLE_RESUME_TEXT = """Jane Jobscan
Senior Content Marketing Manager
fakeemail@mail.com | linkedin.com/in/jane-jobscan | 123-456-7890

PROFESSIONAL SUMMARY
Results-oriented content marketing manager with 8 years of digital media experience.

WORK EXPERIENCE
Senior Content Marketing Manager, ACME
June 2022 - Present
- Led B2C content marketing strategy across blogs and social media.
- Increased revenue by 20% through data-backed insights.

EDUCATION
Bachelor of Arts in Marketing, State University
2014 - 2018

SKILLS
Content Strategy, SEO, Google Analytics, Agile, Project Management
"""


class ResumeExtractorTests(unittest.TestCase):
    def test_parse_structured_sections_detects_core_sections(self):
        parsed = parse_structured_sections(SAMPLE_RESUME_TEXT)
        sections = parsed["structured_sections"]

        self.assertIn("fakeemail@mail.com", sections["contact"]["text"])
        self.assertIn("content marketing manager", sections["summary"]["text"].lower())
        self.assertIn("ACME", sections["experience"]["text"])
        self.assertIn("State University", sections["education"]["text"])
        self.assertIn("Content Strategy", sections["skills"]["items"][0])

    def test_line_map_preserves_offsets_for_span_mapping(self):
        parsed = parse_structured_sections(SAMPLE_RESUME_TEXT)
        lines = parsed["lines"]

        self.assertGreater(len(lines), 10)
        self.assertEqual(lines[0]["line_number"], 1)
        self.assertEqual(lines[0]["text"], "Jane Jobscan")
        self.assertEqual(lines[0]["char_start"], 0)

        experience_lines = [line for line in lines if line.get("section_type") == "experience"]
        self.assertTrue(any("ACME" in line["text"] for line in experience_lines))

    def test_merge_wrapped_lines_collapses_mid_sentence_wraps(self):
        wrapped = (
            "SEO Specialist with 6+ months of experience, focused on\n"
            "off-page SEO techniques like backlink building.\n"
            "- Executing full-spectrum off-page SEO strategies.\n"
            "- Conducting keyword research using Ahrefs."
        )
        merged = _merge_wrapped_lines(wrapped)

        self.assertIn("experience, focused on off-page SEO", merged)
        self.assertIn("- Executing full-spectrum", merged)
        self.assertIn("- Conducting keyword research", merged)

    def test_merge_wrapped_lines_preserves_section_headings(self):
        wrapped = (
            "PROFESSIONAL SUMMARY\n"
            "Results-oriented SEO specialist with experience.\n"
            "WORK EXPERIENCE\n"
            "Senior SEO Specialist, ACME\n"
            "EDUCATION\n"
            "B.S. Marketing, State University\n"
            "SKILLS\n"
            "SEO, Google Analytics"
        )
        merged = _merge_wrapped_lines(wrapped)
        lines = [line for line in merged.split("\n") if line.strip()]

        self.assertIn("PROFESSIONAL SUMMARY", lines)
        self.assertIn("WORK EXPERIENCE", lines)
        self.assertIn("EDUCATION", lines)
        self.assertIn("SKILLS", lines)
        self.assertTrue(lines.index("PROFESSIONAL SUMMARY") < lines.index("WORK EXPERIENCE"))
        self.assertNotIn("PROFESSIONAL SUMMARY Results-oriented", merged)
        self.assertNotIn("WORK EXPERIENCE Senior SEO", merged)

    def test_extract_resume_bytes_from_generated_pdf(self):
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((72, 72), SAMPLE_RESUME_TEXT)
        pdf_bytes = doc.tobytes()
        doc.close()

        result = extract_resume_bytes(pdf_bytes, "sample-resume.pdf")

        self.assertTrue(result["success"])
        self.assertEqual(result["file_type"], "pdf")
        self.assertIn("Jane Jobscan", result["full_text"])
        self.assertIn("ACME", result["full_text"])
        self.assertIn("experience", result["structured_sections"])
        self.assertGreater(result["pages"], 0)
        self.assertTrue(result["lines"])

    def test_extract_resume_bytes_from_generated_docx(self):
        try:
            import docx
        except ImportError:
            self.skipTest("python-docx is not installed")

        document = docx.Document()
        for line in SAMPLE_RESUME_TEXT.split("\n"):
            document.add_paragraph(line)

        buffer = io.BytesIO()
        document.save(buffer)
        docx_bytes = buffer.getvalue()

        result = extract_resume_bytes(docx_bytes, "sample-resume.docx")

        self.assertTrue(result["success"])
        self.assertEqual(result["file_type"], "docx")
        self.assertIn("Jane Jobscan", result["full_text"])
        self.assertIn("skills", result["structured_sections"])
        self.assertGreaterEqual(len(result["structured_sections"]["skills"]["items"]), 3)


if __name__ == "__main__":
    unittest.main()

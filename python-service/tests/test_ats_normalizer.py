import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ats_normalizer import expand_table_rows, normalize_resume_extraction, normalize_to_ats  # noqa: E402
from resume_extractor import parse_structured_sections  # noqa: E402

SCRAMBLED_RESUME = """ZOHAIB CHOUDHARY
Digital Marketing Specialist
zohaib@example.com | Lahore, Pakistan | 0300-1234567
CORE COMPETENCIES
EDUCATION
WORK EXPERIENCE
SUMMARY
Results-driven SEO specialist with 6+ months of off-page SEO experience.
SEO Specialist | ABC Agency | 2023 - Present
- Executing full-spectrum off-page SEO strategies.
B.S. Marketing | Punjab University | 2018 - 2022
SEO, Google Analytics, Link Building, Content Marketing
"""

TABLE_RESUME = """Alex Rivera
alex@example.com
WORK EXPERIENCE
Lead Inspector | Northline | 2020 - Present | Chicago, IL
- Reduced incidents by 32%.
"""


class AtsNormalizerTests(unittest.TestCase):
    def test_expand_table_rows_splits_pipe_cells(self):
        expanded = expand_table_rows("Role | Company | 2020 - Present | City")
        self.assertIn("Role", expanded)
        self.assertIn("Company", expanded)
        self.assertIn("2020 - Present", expanded)
        self.assertIn("City", expanded)

    def test_normalize_to_ats_orders_sections_canonically(self):
        parsed = parse_structured_sections(SCRAMBLED_RESUME)
        normalized = normalize_to_ats(parsed["structured_sections"])
        lines = [line for line in normalized.split("\n") if line.strip()]
        self.assertEqual(lines[0], "ZOHAIB CHOUDHARY")
        summary_index = lines.index("PROFESSIONAL SUMMARY")
        experience_index = lines.index("WORK EXPERIENCE")
        education_index = lines.index("EDUCATION")
        skills_index = lines.index("SKILLS")
        self.assertLess(summary_index, experience_index)
        self.assertLess(experience_index, education_index)
        self.assertLess(education_index, skills_index)
        self.assertIn("off-page SEO", normalized)

    def test_normalize_resume_extraction_rebuilds_line_map(self):
        result = normalize_resume_extraction(SCRAMBLED_RESUME)
        lines = result["lines"]
        self.assertTrue(result["normalization"]["applied"])
        self.assertGreater(len(lines), 10)
        self.assertEqual(lines[0]["text"], "ZOHAIB CHOUDHARY")
        self.assertEqual(lines[0]["line_number"], 1)
        section_types = [line.get("section_type") for line in lines if line.get("section_type")]
        self.assertIn("summary", section_types)
        self.assertIn("experience", section_types)

    def test_table_rows_become_linear_before_normalization(self):
        result = normalize_resume_extraction(TABLE_RESUME)
        normalized = result["normalized_text"]
        self.assertIn("Lead Inspector", normalized)
        self.assertIn("Northline", normalized)
        self.assertNotIn("|", normalized)

    def test_preprocess_removes_orphan_contact_labels(self):
        raw = """ZOHAIB CHOUDHARY
Address: Phone: Email:
Phone: 03247134928 | Email: zohaib@example.com
SUMMARY
SEO Specialist"""
        result = normalize_resume_extraction(raw)
        normalized = result["normalized_text"]
        self.assertNotIn("Address: Phone: Email:", normalized)
        self.assertIn("03247134928", normalized)
        self.assertIn("zohaib@example.com", normalized)

    def test_preprocess_removes_standalone_orphan_labels(self):
        raw = """ZOHAIB CHOUDHARY
Green Acres Housing Society Lahore
03247134928
zohaibchoudhary21@gmail.com
Address:
Phone:
Email:
SUMMARY
SEO Specialist"""
        result = normalize_resume_extraction(raw)
        normalized = result["normalized_text"]
        self.assertNotIn("Address:", normalized)
        self.assertNotIn("Phone:", normalized)
        self.assertNotIn("Email:", normalized)
        self.assertIn("03247134928", normalized)
        self.assertIn("zohaibchoudhary21@gmail.com", normalized)


if __name__ == "__main__":
    unittest.main()
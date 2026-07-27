export const RESUME_SCANNER_SYSTEM_PROMPT = `You are an expert ATS resume analyst. Compare a resume against a job description and return structured JSON only.

Rules:
- Extract concrete skills from the job description and classify each as required, hard, or soft.
- Use semantic matching for resume coverage (synonyms, acronyms, variants like "GA4" vs "Google Analytics 4").
- Score using this rubric (weights must sum to 100 across components):
  - keywordCoverage (40%): % of required + hard skills evidenced in the resume
  - sectionCompleteness (20%): presence/quality of summary, experience, education, skills sections
  - searchability (20%): ATS-friendly formatting signals (standard headings, contact info, no fluff)
  - quantifiedAchievements (20%): metrics, numbers, measurable outcomes in experience bullets
- For each scoreBreakdown component include score (0-100), weight, weighted (score * weight / 100), and short notes.
- suggestions must reference exact substrings that appear in the resume text for reword/remove types.
- missing_keyword suggestions should use a short original anchor phrase from the resume where the keyword should be added, and suggested should include the keyword naturally.
- impact is 1-5 indicating estimated ATS score lift if accepted.
- Do not invent experience not supported by the resume.
- Return at most 20 suggestions, ordered by impact descending.
- skill ids must be stable strings like skill-react-1.`;

export const buildResumeScannerPrompt = ({ resumeText, jobDescriptionText }) => `
Job description:
"""
${jobDescriptionText}
"""

Resume text:
"""
${resumeText}
"""

Return JSON only in exactly this shape:
{
  "jobTitle": "string",
  "company": "string",
  "skills": [
    {
      "id": "skill-example-1",
      "name": "Skill name",
      "type": "required|hard|soft",
      "synonyms": ["optional alias"],
      "matched": true,
      "matchEvidence": "short quote or phrase from resume if matched, else empty"
    }
  ],
  "score": 0,
  "scoreBreakdown": {
    "keywordCoverage": { "score": 0, "weight": 40, "weighted": 0, "notes": "" },
    "sectionCompleteness": { "score": 0, "weight": 20, "weighted": 0, "notes": "" },
    "searchability": { "score": 0, "weight": 20, "weighted": 0, "notes": "" },
    "quantifiedAchievements": { "score": 0, "weight": 20, "weighted": 0, "notes": "" }
  },
  "suggestions": [
    {
      "id": "suggestion-1",
      "type": "missing_keyword|reword|remove",
      "original": "exact resume substring",
      "suggested": "replacement text or empty for remove",
      "reason": "why this helps ATS",
      "impact": 1,
      "targetSkillId": "skill-example-1"
    }
  ],
  "searchabilityIssues": ["issue"],
  "recruiterTips": ["tip"]
}`;

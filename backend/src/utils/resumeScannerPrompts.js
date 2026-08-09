export const RESUME_SCANNER_SYSTEM_PROMPT = `You are an expert ATS Resume Analyzer, Recruiter, and Career Intelligence AI.

Compare a candidate resume against a job description and return structured JSON only.
You are NOT a keyword counter. Understand synonyms, context, experience evidence, seniority, impact of achievements, and skill relevance.

Core rules:
1. Never mark a skill as unmatched if the resume contains a synonym, acronym, or equivalent phrasing.
   Examples: "Search Engine Optimization" matches "SEO"; "Amazon Web Services" matches "AWS"; "GA4" matches "Google Analytics 4".
2. Only report skills as missing when they are genuinely absent from the resume (after synonym and context checks).
3. Never invent candidate experience, companies, projects, or achievements.
4. Every suggestion must reference a real issue in the resume text. Do not suggest changes for content that does not exist.
5. Evaluate achievements by numbers, measurable impact, and business outcomes. Flag weak vague bullets (e.g. "worked on APIs") and prefer stronger rewrites only when anchored to real resume text.
6. Assess experience level and seniority fit against the job title and description.
7. Extract concrete skills from the job description and classify each as required, hard, or soft.
8. Score using this rubric (weights must sum to 100 across components):
   - keywordCoverage (40%): % of required + hard skills evidenced in the resume (semantic matching allowed)
   - sectionCompleteness (20%): presence/quality of summary, experience, education, skills sections
   - searchability (20%): ATS-friendly formatting signals (standard headings, contact info, no fluff)
   - quantifiedAchievements (20%): metrics, numbers, measurable outcomes in experience bullets
9. For each scoreBreakdown component include score (0-100), weight, weighted (score * weight / 100), and short notes.
   Use notes to capture experience-match reasoning and ATS structure/readability observations.
10. suggestions must reference exact substrings that appear in the resume text for reword/remove types.
11. For reword/remove/missing_keyword suggestions, quote original text WITHOUT bullet markers (no bullet dashes, asterisks, or numbering prefixes) — structured storage omits list markers even when the resume text shown to you includes them.
12. missing_keyword suggestions should use a short original anchor phrase from the resume where the keyword should be added, and suggested should include the keyword naturally. When the resume and job are weakly related or from different fields, still emit missing_keyword suggestions for important unmatched JD skills — place them via fieldPath on "summary" or "skills.0" (or the best existing skills entry). Do not invent jobs, employers, or achievements; only add concise skill/keyword phrasing the candidate could truthfully claim or that belongs in a skills list.
13. impact is 1-5 indicating estimated ATS/job-match lift if accepted.
14. Return at most 20 suggestions, ordered by impact descending.
15. skill ids must be stable strings like skill-react-1.
16. Every suggestion MUST include fieldPath pointing at the structured field to edit, using dot paths such as:
    "summary", "workExperience.0.bullets.1", "education.0.degree", "skills.2", "languages.0".
17. Map deeper analysis into existing fields:
    - resume strengths → recruiterTips entries prefixed with "Strength: "
    - resume weaknesses → recruiterTips entries prefixed with "Weakness: "
    - experience-match insight → scoreBreakdown.keywordCoverage.notes and/or recruiterTips
    - final hiring recommendation → last recruiterTips entry prefixed with "Recommendation: "
    - ATS structure/readability issues → searchabilityIssues
18. Return JSON only. No markdown. No text outside JSON.`;

export const buildResumeScannerPrompt = ({
  resumeText,
  jobDescriptionText,
  jobTitle = '',
}) => {
  const titleBlock = jobTitle.trim()
    ? `Job title:\n"""\n${jobTitle.trim()}\n"""\n\n`
    : '';

  return `${titleBlock}Job description:
"""
${jobDescriptionText}
"""

Resume:
"""
${resumeText}
"""

Analyze the resume against the job title (if provided) and job description.
Return JSON only in exactly this shape:
{
  "jobTitle": "string — inferred or confirmed role title from the job description",
  "company": "string — inferred company name if present in JD, else empty",
  "skills": [
    {
      "id": "skill-example-1",
      "name": "Skill name from JD",
      "type": "required|hard|soft",
      "synonyms": ["resume-side alias if matched via synonym"],
      "matched": true,
      "matchEvidence": "short exact quote or phrase from resume if matched, else empty"
    }
  ],
  "score": 0,
  "scoreBreakdown": {
    "keywordCoverage": { "score": 0, "weight": 40, "weighted": 0, "notes": "skill + experience relevance" },
    "sectionCompleteness": { "score": 0, "weight": 20, "weighted": 0, "notes": "" },
    "searchability": { "score": 0, "weight": 20, "weighted": 0, "notes": "structure + readability" },
    "quantifiedAchievements": { "score": 0, "weight": 20, "weighted": 0, "notes": "impact evidence" }
  },
  "suggestions": [
    {
      "id": "suggestion-1",
      "type": "missing_keyword|reword|remove",
      "original": "exact resume substring without bullet markers",
      "suggested": "replacement text or empty for remove",
      "reason": "specific problem and why this improves ATS/job match",
      "impact": 1,
      "targetSkillId": "skill-example-1",
      "fieldPath": "summary | workExperience.0.bullets.1 | education.0.degree | skills.0"
    }
  ],
  "searchabilityIssues": ["ATS formatting or readability issue"],
  "recruiterTips": ["Strength: ...", "Weakness: ...", "Recommendation: ..."]
}`;
};

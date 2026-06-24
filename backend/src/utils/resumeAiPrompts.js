export const RESUME_PARSE_SYSTEM_PROMPT = `You are a resume parsing assistant. Extract all structured data from the resume text the user provides.

Extract all data from the resume text. Return ONLY raw JSON, no markdown fences, no explanation. If a field is not found, use empty string. Do not include example placeholder entries — only include entries that actually exist in the resume.

Rules:
- Parse the ENTIRE resume. Every distinct section in the source text must appear in the output.
- If a section exists in the resume (Experience, Education, Skills, Projects, Certifications, etc.) you MUST create that section.
- Use the closest matching type: aboutMe, experience, education, expertise, languages, projects, certificates, courses, awards, interests, organisations, publications, references, or custom for anything else.
- Put ONLY a short professional summary (2-5 sentences) in the about/summary section.
- NEVER dump skills, education, work history, or contact details into the summary.
- Create separate entries for each job, degree, skill, project, or certificate found in the resume.
- Ignore footer content that clearly belongs to a different person (duplicate names/emails).

JSON schema:
{
  "personalDetails": {
    "fullName": "string",
    "professionalTitle": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string",
    "linkedin": "string"
  },
  "sections": [
    {
      "type": "string",
      "heading": "string",
      "entries": [
        {
          "data": { }
        }
      ]
    }
  ]
}

Entry data fields by section type:
- aboutMe / about: { "content": "string" }
- experience: { "jobTitle", "employer", "startDate", "endDate", "location", "description" }
- education: { "degree", "school", "startDate", "endDate", "location", "description" }
- expertise / skills: { "skill": "string" }
- languages: { "language", "level", "additionalInfo" }
- projects: { "title", "description", "link", "startDate", "endDate" }
- certificates: { "title", "issuer", "date", "link", "description" }
- courses: { "courseTitle", "institution", "startDate", "endDate", "location", "description" }
- custom (or other types): { "content": "string" }`;

export const PARSE_RESUME_PROMPT = (extractedText) => `
You are parsing a resume/CV into structured data. The source text may come from a PDF with poor formatting.

CRITICAL: PDF Extraction Artifacts — How to Handle

Broken sentence fragments:
- If a line ends with only one or two words plus a period (e.g. "products.", "intent.", "negotiations.", "outcomes."), it is NOT its own section or heading.
- These are continuations of the sentence above that was cut by a narrow PDF text box.
- Merge such fragments into the description of the entry directly above them.

Two-column skill artifacts:
- Skills sections in PDFs often use two columns. After extraction, left-column skill fragments may appear mixed into the summary or experience text.
- If summary text contains phrases that clearly belong in skills (e.g. "SEO optimization", "to drive innovative strategies", "record of successful campaign management"), move them to the expertise/skills section — not the summary.

Section boundaries:
- Section content ends where the next section heading begins.
- Headings are usually ALL CAPS or short bold phrases such as SUMMARY, PROFESSIONAL EXPERIENCE, EDUCATION, SKILLS, LANGUAGES, COURSES.

Incomplete bullet points:
- If a bullet ends mid-sentence on a conjunction or preposition (e.g. "and", "for", "to", "with"), it was likely cut by text box width.
- Keep the bullet as-is; do not fabricate missing text, but treat it as truncated.

Date-only lines:
- If one line is only a date fragment (e.g. "Feb" or "Oct 2023") and the next line has a job title or employer, both belong to the same experience entry.
- Do not create separate entries for the date line and the title line.

Rules:
- Parse the ENTIRE resume. Every distinct section in the source text must appear in the output.
- If a section exists in the resume (Experience, Education, Skills, Projects, Certifications, etc.) you MUST create that section even if it is not in the example below.
- Use the closest matching type: experience, education, expertise, languages, projects, certificates, courses, awards, interests, organisations, publications, references, or custom for anything else.
- Put ONLY a short professional summary (2-5 sentences) in the about/summary section.
- NEVER dump skills, education, work history, or contact details into the summary.
- Create separate entries for each job, degree, skill, project, or certificate.
- Ignore footer content that clearly belongs to a different person (duplicate names/emails).
- Return ONLY valid JSON, no markdown fences.

Resume text:
${extractedText}
`;

export const AI_ACTION_PROMPTS = {
  improve: (content) =>
    `Rewrite the following resume text to sound more professional and impactful. Return only the improved text, no explanations:\n\n${content}`,
  grammar: (content) =>
    `Fix all grammar and spelling errors in the following resume text. Return only the corrected text, no explanations:\n\n${content}`,
  shorter: (content) =>
    `Make the following resume text more concise while keeping all key information. Return only the shorter version, no explanations:\n\n${content}`,
  suggest: (content, context) =>
    `Suggest 5 strong bullet points for a resume entry with this context: ${context || content}. Return as a simple bullet list, no explanations.`,
};

export const extractJsonFromText = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in AI response.');
  }

  return JSON.parse(trimmed.slice(start, end + 1));
};

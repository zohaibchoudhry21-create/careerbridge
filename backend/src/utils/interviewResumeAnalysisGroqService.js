import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import { extractJsonFromText } from './resumeAiPrompts.js';
import { withGroqRetry } from './withGroqRetry.js';

const MAX_SKILLS = 14;
const MAX_PROJECTS = 6;

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  return new Groq({ apiKey });
};

const cleanList = (value, max) =>
  (Array.isArray(value) ? value : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, max);

/**
 * Extracts a lightweight structured summary (skills + projects) from raw resume
 * text so the interview setup can show a "Resume Analysis Result" and personalize
 * questions. Additive — does not affect the live interview flow.
 */
export const analyzeResumeForInterview = async (rawText) => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  const text = String(rawText || '').trim().slice(0, 12000);

  if (!text) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.RESUME_TEXT_EMPTY, 400);
  }

  const { model } = getGroqConfig();
  const client = getClient();

  let completion;
  try {
    completion = await withGroqRetry(
      () =>
        client.chat.completions.create({
          model,
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: `You are an expert technical recruiter. Analyze the following resume text and extract a concise structured summary for interview preparation.

Resume text:
"""
${text}
"""

Return JSON only in exactly this shape:
{
  "skills": ["short skill or technology name", ...],
  "projects": ["project name — one short line about it", ...],
  "summary": "one or two sentence professional summary"
}

Rules:
- skills: at most ${MAX_SKILLS} concrete skills/technologies, deduplicated, short labels.
- projects: at most ${MAX_PROJECTS} notable projects; keep each to one short line.
- If something is missing, return an empty array for it.
- Do not invent information that is not supported by the resume text.`,
            },
          ],
        }),
      { label: 'interview-resume-analysis' }
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.AI_SERVICE_UNAVAILABLE, 503);
  }

  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.EMPTY_RESUME_ANALYSIS, 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = extractJsonFromText(content);
  }

  return {
    skills: cleanList(parsed?.skills, MAX_SKILLS),
    projects: cleanList(parsed?.projects, MAX_PROJECTS),
    summary: String(parsed?.summary || '').trim().slice(0, 600),
  };
};

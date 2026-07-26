import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import { extractJsonFromText } from './resumeAiPrompts.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  return new Groq({ apiKey });
};

const callGroqJson = async (prompt) => {
  const { model } = getGroqConfig();
  const client = getClient();

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.EMPTY_INTERVIEW_QUESTION, 502);
  }

  try {
    return JSON.parse(content);
  } catch {
    return extractJsonFromText(content);
  }
};

const buildCandidateContext = ({
  experience,
  resumeSkills,
  resumeProjects,
  targetCompany,
  focusAreas,
} = {}) => {
  const lines = [];

  const exp = String(experience || '').trim();
  if (exp) lines.push(`Candidate experience: ${exp}`);

  const company = String(targetCompany || '').trim();
  if (company) lines.push(`Target company: ${company}`);

  const focus = (Array.isArray(focusAreas) ? focusAreas : [])
    .map((f) => String(f || '').trim())
    .filter(Boolean)
    .slice(0, 6);
  if (focus.length) lines.push(`Interview focus areas: ${focus.join(', ')}`);

  const skills = (Array.isArray(resumeSkills) ? resumeSkills : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 14);
  if (skills.length) lines.push(`Candidate skills: ${skills.join(', ')}`);

  const projects = (Array.isArray(resumeProjects) ? resumeProjects : [])
    .map((p) => String(p || '').trim())
    .filter(Boolean)
    .slice(0, 6);
  if (projects.length) lines.push(`Candidate projects: ${projects.join('; ')}`);

  return lines.join('\n');
};

export const generateOpeningQuestion = async ({
  roleLabel,
  difficulty,
  experience,
  resumeSkills,
  resumeProjects,
  targetCompany,
  focusAreas,
} = {}) => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  const candidateContext = buildCandidateContext({
    experience,
    resumeSkills,
    resumeProjects,
    targetCompany,
    focusAreas,
  });

  const parsed = await callGroqJson(`
You are a professional interviewer conducting a ${difficulty} difficulty interview for a ${roleLabel} role.
${candidateContext ? `\nCandidate background (use it to make the opener relevant, but keep it a natural opening question):\n${candidateContext}\n` : ''}
Generate ONE opening interview question (warm-up / tell-me-about-yourself style or role-specific opener).

Return JSON only:
{ "question": "string" }
`);

  const text = String(parsed.question || '').trim();

  if (!text) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.OPENING_QUESTION_FAILED, 502);
  }

  return text;
};


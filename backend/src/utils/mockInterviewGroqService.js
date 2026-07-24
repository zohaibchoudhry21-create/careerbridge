import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { AppError } from './sendResponse.js';
import { extractJsonFromText } from './resumeAiPrompts.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
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
    throw new AppError('Groq returned an empty interview question.', 502);
  }

  try {
    return JSON.parse(content);
  } catch {
    return extractJsonFromText(content);
  }
};

export const generateOpeningQuestion = async ({ roleLabel, difficulty }) => {
  if (!isGroqConfigured()) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
  }

  const parsed = await callGroqJson(`
You are a professional interviewer conducting a ${difficulty} difficulty interview for a ${roleLabel} role.

Generate ONE opening interview question (warm-up / tell-me-about-yourself style or role-specific opener).

Return JSON only:
{ "question": "string" }
`);

  const text = String(parsed.question || '').trim();

  if (!text) {
    throw new AppError('Failed to generate opening question.', 502);
  }

  return text;
};

export const generateFollowUpQuestion = async ({
  roleLabel,
  difficulty,
  questionNumber,
  totalQuestions,
  priorQa,
}) => {
  if (!isGroqConfigured()) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
  }

  const historyText = priorQa
    .map(
      (item, index) =>
        `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer || '(no answer)'}`
    )
    .join('\n\n');

  const parsed = await callGroqJson(`
You are a professional interviewer for a ${difficulty} ${roleLabel} interview.
This is question ${questionNumber} of ${totalQuestions} (adaptive follow-up).

Prior conversation:
${historyText}

Ask ONE new follow-up question that builds on the candidate's last answer. Be specific, realistic, and appropriate for ${difficulty} level.

Return JSON only:
{ "question": "string" }
`);

  const text = String(parsed.question || '').trim();

  if (!text) {
    throw new AppError('Failed to generate follow-up question.', 502);
  }

  return text;
};

export const generateVoiceCallQuestionSet = async ({
  roleLabel,
  difficulty,
  targetQuestionCount,
}) => {
  if (!isGroqConfigured()) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
  }

  const count = Math.min(8, Math.max(5, Number(targetQuestionCount) || 6));

  const parsed = await callGroqJson(`
You are a professional interviewer preparing a ${difficulty} difficulty interview for a ${roleLabel} role.

Generate exactly ${count} distinct interview questions for a live voice interview.
- Question 1: warm opening / tell-me-about-yourself or role opener.
- Questions 2-${count}: mix behavioral and role-specific topics; do not repeat themes.

Return JSON only:
{ "questions": ["question 1 text", "question 2 text", ...] }
`);

  const list = Array.isArray(parsed.questions)
    ? parsed.questions.map((q) => String(q || '').trim()).filter(Boolean)
    : [];

  if (list.length < count) {
    throw new AppError('Failed to generate enough interview questions.', 502);
  }

  return list.slice(0, count);
};

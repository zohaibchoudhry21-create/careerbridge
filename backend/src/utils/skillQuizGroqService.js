import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import { extractJsonFromText } from './resumeAiPrompts.js';
import { withGroqRetry } from './withGroqRetry.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  return new Groq({ apiKey });
};

const buildQuizPrompt = ({ topicLabel, difficulty, questionCount }) => `
You are an expert technical interviewer. Generate exactly ${questionCount} multiple-choice questions for a skill assessment.

Topic: ${topicLabel}
Difficulty: ${difficulty}

Return ONLY valid JSON (no markdown) in this shape:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "options": ["A text", "B text", "C text", "D text"],
      "correctIndex": 0,
      "explanation": "why the correct answer is right",
      "subtopic": "short subtopic tag"
    }
  ]
}

Rules:
- exactly ${questionCount} questions
- each question has exactly 4 options
- correctIndex is 0-3
- vary subtopics within the topic
- no trick questions; suitable for ${difficulty} level
- ids must be q1 through q${questionCount}
`;

const normalizeQuestions = (rawQuestions, expectedCount) => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length < expectedCount) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.AI_INVALID_QUIZ, 502);
  }

  const questions = rawQuestions.slice(0, expectedCount).map((q, index) => {
    const options = Array.isArray(q.options) ? q.options.map(String) : [];

    if (options.length !== 4) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.AI_INVALID_OPTIONS, 502);
    }

    const correctIndex = Number(q.correctIndex);

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.AI_INVALID_CORRECT_INDEX, 502);
    }

    const questionText = String(q.question || '').trim();

    if (!questionText) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.AI_MISSING_QUESTION, 502);
    }

    return {
      questionId: String(q.id || `q${index + 1}`),
      question: questionText,
      options,
      correctIndex,
      explanation: String(q.explanation || '').trim(),
      subtopic: String(q.subtopic || 'general').trim() || 'general',
    };
  });

  return questions;
};

export const generateSkillQuizWithGroq = async ({ topicLabel, difficulty, questionCount }) => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  const { model } = getGroqConfig();
  const client = getClient();

  let completion;
  try {
    completion = await withGroqRetry(
      () =>
        client.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: buildQuizPrompt({ topicLabel, difficulty, questionCount }),
            },
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      { label: 'skill-quiz' }
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.AI_SERVICE_UNAVAILABLE, 503);
  }

  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.EMPTY_QUIZ_RESPONSE, 502);
  }

  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = extractJsonFromText(content);
  }

  return normalizeQuestions(parsed.questions, questionCount);
};

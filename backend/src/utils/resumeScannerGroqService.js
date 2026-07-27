import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { extractJsonFromText } from './resumeAiPrompts.js';
import { buildResumeScannerPrompt, RESUME_SCANNER_SYSTEM_PROMPT } from './resumeScannerPrompts.js';
import { parseResumeScannerAnalysis } from './resumeScannerSchemas.js';
import { AppError } from './sendResponse.js';

const MAX_RETRIES = 2;

const getClient = () => {
  const { apiKey } = getGroqConfig();
  if (!apiKey) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }
  return new Groq({ apiKey });
};

const parseModelJson = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    return extractJsonFromText(content);
  }
};

export const analyzeResumeWithGroq = async ({ resumeText, jobDescriptionText }, attempt = 0) => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const { model } = getGroqConfig();
  const client = getClient();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: RESUME_SCANNER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildResumeScannerPrompt({ resumeText, jobDescriptionText }),
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_EMPTY_RESPONSE, 502);
  }

  try {
    const parsed = parseModelJson(content);
    return parseResumeScannerAnalysis(parsed);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(`[resume-scanner] Groq JSON validation failed (attempt ${attempt + 1}):`, error.message);
      return analyzeResumeWithGroq({ resumeText, jobDescriptionText }, attempt + 1);
    }
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);
  }
};

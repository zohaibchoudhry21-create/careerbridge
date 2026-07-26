import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import {
  AI_ACTION_PROMPTS,
  PARSE_RESUME_PROMPT,
  extractJsonFromText,
} from './resumeAiPrompts.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.AI_NOT_CONFIGURED, 503);
  }

  return new Groq({ apiKey });
};

const callGroq = async (prompt, { maxTokens = 4096, temperature = 0.1 } = {}) => {
  const { model } = getGroqConfig();
  const client = getClient();

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
  });

  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.AI_EMPTY_RESPONSE, 502);
  }

  return content;
};

export const parseResumeWithGroq = async (extractedText) => {
  if (!isGroqConfigured()) {
    return null;
  }

  const responseText = await callGroq(PARSE_RESUME_PROMPT(extractedText), {
    maxTokens: 8192,
    temperature: 0.1,
  });

  return extractJsonFromText(responseText);
};

export const runResumeAiActionWithGroq = async (action, content, context = '') => {
  const promptBuilder = AI_ACTION_PROMPTS[action];

  if (!promptBuilder) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.INVALID_AI_ACTION, 400);
  }

  if (!content?.trim() && action !== 'suggest') {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.CONTENT_REQUIRED, 400);
  }

  return callGroq(promptBuilder(content, context), { maxTokens: 2048, temperature: 0.3 });
};

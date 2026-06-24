import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { AppError } from './sendResponse.js';
import {
  AI_ACTION_PROMPTS,
  PARSE_RESUME_PROMPT,
  extractJsonFromText,
} from './resumeAiPrompts.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
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
    throw new AppError('Groq returned an empty response.', 502);
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
    throw new AppError('Invalid AI action.', 400);
  }

  if (!content?.trim() && action !== 'suggest') {
    throw new AppError('Content is required for this AI action.', 400);
  }

  return callGroq(promptBuilder(content, context), { maxTokens: 2048, temperature: 0.3 });
};

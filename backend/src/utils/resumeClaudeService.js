import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicConfig, isAnthropicConfigured } from '../config/anthropicConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import {
  AI_ACTION_PROMPTS,
  RESUME_PARSE_SYSTEM_PROMPT,
  extractJsonFromText,
} from './resumeAiPrompts.js';

const getClient = () => {
  const { apiKey } = getAnthropicConfig();

  if (!apiKey) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.AI_NOT_CONFIGURED, 503);
  }

  return new Anthropic({ apiKey });
};

const callClaude = async (prompt, { maxTokens = 4096 } = {}) => {
  const { model } = getAnthropicConfig();
  const client = getClient();

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');

  if (!textBlock?.text) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.AI_EMPTY_RESPONSE, 502);
  }

  return textBlock.text.trim();
};

const callClaudeForParse = async (extractedText) => {
  const { model } = getAnthropicConfig();
  const client = getClient();

  const message = await client.messages.create({
    model,
    max_tokens: 8192,
    temperature: 0,
    system: RESUME_PARSE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Parse this resume:\n\n${extractedText}` }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');

  if (!textBlock?.text) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.AI_EMPTY_RESPONSE, 502);
  }

  return textBlock.text.trim();
};

export const parseResumeWithClaude = async (extractedText) => {
  if (!isAnthropicConfigured()) {
    return null;
  }

  const responseText = await callClaudeForParse(extractedText);
  return extractJsonFromText(responseText);
};

export const runResumeAiAction = async (action, content, context = '') => {
  const promptBuilder = AI_ACTION_PROMPTS[action];

  if (!promptBuilder) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.INVALID_AI_ACTION, 400);
  }

  if (!content?.trim() && action !== 'suggest') {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.CONTENT_REQUIRED, 400);
  }

  return callClaude(promptBuilder(content, context), { maxTokens: 2048 });
};

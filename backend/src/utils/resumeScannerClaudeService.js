import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicConfig, isAnthropicConfigured } from '../config/anthropicConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { parseModelJson } from './resumeScannerJson.js';
import { RESUME_SCANNER_LLM_TIMEOUT_MS } from './resumeScannerLlmTimeouts.js';
import { buildResumeScannerPrompt, RESUME_SCANNER_SYSTEM_PROMPT } from './resumeScannerPrompts.js';
import { parseResumeScannerAnalysis } from './resumeScannerSchemas.js';
import { AppError } from './sendResponse.js';

const MAX_RETRIES = 2;

const getClient = () => {
  const { apiKey } = getAnthropicConfig();
  if (!apiKey) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }
  return new Anthropic({ apiKey, timeout: RESUME_SCANNER_LLM_TIMEOUT_MS });
};

export const analyzeResumeWithClaude = async ({ resumeText, jobDescriptionText, jobTitle = '' }, attempt = 0) => {
  if (!isAnthropicConfigured()) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const { model } = getAnthropicConfig();
  const client = getClient();

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0.2,
    system: RESUME_SCANNER_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildResumeScannerPrompt({ resumeText, jobDescriptionText, jobTitle }),
      },
    ],
  });

  const content = response.content
    ?.map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  if (!content) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_EMPTY_RESPONSE, 502);
  }

  try {
    const parsed = parseModelJson(content);
    return parseResumeScannerAnalysis(parsed);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(`[resume-scanner] Claude JSON validation failed (attempt ${attempt + 1}):`, error.message);
      return analyzeResumeWithClaude({ resumeText, jobDescriptionText, jobTitle }, attempt + 1);
    }
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);
  }
};

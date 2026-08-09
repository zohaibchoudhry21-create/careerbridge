import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { getAnthropicConfig, isAnthropicConfigured } from '../../config/anthropicConfig.js';
import { getGroqConfig, isGroqConfigured } from '../../config/groqConfig.js';
import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import { parseModelJson } from '../resumeScannerJson.js';
import { RESUME_SCANNER_LLM_TIMEOUT_MS } from '../resumeScannerLlmTimeouts.js';
import { AppError } from '../sendResponse.js';

export { parseModelJson };

/**
 * Shared Groq → Claude JSON completion helper for rewrite pipeline passes.
 */
export const invokeJsonCompletion = async ({
  systemPrompt,
  userPrompt,
  temperature = 0.25,
  maxTokens = 8192,
}) => {
  if (isGroqConfigured()) {
    try {
      const { apiKey, model } = getGroqConfig();
      const client = new Groq({ apiKey, timeout: RESUME_SCANNER_LLM_TIMEOUT_MS });
      const completion = await client.chat.completions.create({
        model,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      const content = completion.choices?.[0]?.message?.content?.trim() || '';
      if (content) return { content, provider: 'groq' };
    } catch (error) {
      console.warn('[resume-scanner-pipeline] Groq call failed:', error.message);
      if (!isAnthropicConfigured()) throw error;
    }
  }

  if (isAnthropicConfigured()) {
    const { apiKey, model } = getAnthropicConfig();
    const client = new Anthropic({ apiKey, timeout: RESUME_SCANNER_LLM_TIMEOUT_MS });
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const content = response.content
      ?.map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();
    if (content) return { content, provider: 'claude' };
  }

  throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
};

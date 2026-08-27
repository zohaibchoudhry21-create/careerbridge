import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAnthropicConfig, isAnthropicConfigured } from '../../config/anthropicConfig.js';
import { getGeminiConfig, isGeminiConfigured } from '../../config/geminiConfig.js';
import { getGroqConfig, isGroqConfigured } from '../../config/groqConfig.js';
import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import { parseModelJson } from '../resumeScannerJson.js';
import { RESUME_SCANNER_LLM_TIMEOUT_MS } from '../resumeScannerLlmTimeouts.js';
import { AppError } from '../sendResponse.js';
import { withGroqApiKeys } from '../withGroqApiKeys.js';

export { parseModelJson };

/**
 * Shared Groq → Gemini → Claude JSON completion helper for rewrite pipeline passes.
 */
export const invokeJsonCompletion = async ({
  systemPrompt,
  userPrompt,
  temperature = 0.25,
  maxTokens = 8192,
}) => {
  if (isGroqConfigured()) {
    try {
      const { model } = getGroqConfig();
      const completion = await withGroqApiKeys(
        (client) =>
          client.chat.completions.create({
            model,
            temperature,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        { label: 'resume-scanner-pipeline', timeout: RESUME_SCANNER_LLM_TIMEOUT_MS, retries: 1 }
      );
      const content = completion.choices?.[0]?.message?.content?.trim() || '';
      if (content) return { content, provider: 'groq' };
    } catch (error) {
      console.warn('[resume-scanner-pipeline] Groq call failed:', error.message);
    }
  }

  if (isGeminiConfigured()) {
    try {
      const { apiKey, model } = getGeminiConfig();
      const genAI = new GoogleGenerativeAI(apiKey);
      const gemini = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      });
      const result = await gemini.generateContent(
        { contents: [{ role: 'user', parts: [{ text: userPrompt }] }] },
        { timeout: RESUME_SCANNER_LLM_TIMEOUT_MS }
      );
      const content = result?.response?.text?.()?.trim?.() || '';
      if (content) {
        console.info('[resume-scanner-pipeline] Completed via Gemini fallback');
        return { content, provider: 'gemini' };
      }
    } catch (error) {
      console.warn('[resume-scanner-pipeline] Gemini call failed:', error.message);
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

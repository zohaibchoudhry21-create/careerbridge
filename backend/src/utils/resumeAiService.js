import { isAnthropicConfigured } from '../config/anthropicConfig.js';
import { isGroqConfigured } from '../config/groqConfig.js';
import { AppError } from './sendResponse.js';
import { parseResumeWithClaude, runResumeAiAction } from './resumeClaudeService.js';
import { parseResumeWithGroq, runResumeAiActionWithGroq } from './resumeGroqService.js';

export const getResumeAiProvider = () => {
  if (isGroqConfigured()) return 'groq';
  if (isAnthropicConfigured()) return 'claude';
  return 'none';
};

export const parseResumeWithAi = async (extractedText) => {
  let aiFailed = false;

  if (isGroqConfigured()) {
    try {
      const parsed = await parseResumeWithGroq(extractedText);
      if (parsed) {
        return { parsed, provider: 'groq', aiFailed: false };
      }
    } catch (error) {
      console.warn('[resume-import] Groq parse failed:', error.message);
      aiFailed = true;
    }
  }

  if (isAnthropicConfigured()) {
    try {
      const parsed = await parseResumeWithClaude(extractedText);
      if (parsed) {
        return { parsed, provider: 'claude', aiFailed: false };
      }
    } catch (error) {
      console.warn('[resume-import] Claude parse failed:', error.message);
      aiFailed = true;
    }
  }

  return { parsed: null, provider: 'heuristic', aiFailed };
};

export const runResumeAiActionWithProvider = async (action, content, context = '') => {
  if (isGroqConfigured()) {
    try {
      const result = await runResumeAiActionWithGroq(action, content, context);
      return { result, provider: 'groq' };
    } catch (error) {
      console.warn('[resume-ai] Groq action failed:', error.message);
      if (!isAnthropicConfigured()) {
        throw error;
      }
    }
  }

  if (isAnthropicConfigured()) {
    const result = await runResumeAiAction(action, content, context);
    return { result, provider: 'claude' };
  }

  throw new AppError(
    'AI service is not configured. Set GROQ_API_KEY or ANTHROPIC_API_KEY in environment.',
    503
  );
};

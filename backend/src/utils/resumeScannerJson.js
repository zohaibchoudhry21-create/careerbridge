/**
 * Shared JSON parsing for Resume Scanner LLM responses.
 * Keeps analyze clients independent of the rewrite pipeline package.
 */

import { extractJsonFromText } from './resumeAiPrompts.js';

export const parseModelJson = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    return extractJsonFromText(content);
  }
};

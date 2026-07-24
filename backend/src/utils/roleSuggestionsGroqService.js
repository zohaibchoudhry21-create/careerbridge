import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { extractJsonFromText } from './resumeAiPrompts.js';

const ROLE_SUGGESTIONS_CACHE = new Map();
const MAX_CACHE_ENTRIES = 200;
const MAX_SUGGESTIONS = 6;

const getClient = () => {
  const { apiKey } = getGroqConfig();
  if (!apiKey) return null;
  return new Groq({ apiKey });
};

const normalizeSuggestions = (raw) => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.suggestions)
      ? raw.suggestions
      : [];

  return list
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, MAX_SUGGESTIONS);
};

const parseSuggestionsContent = (content) => {
  if (!content) return [];

  const trimmed = content.trim();

  try {
    const parsed = JSON.parse(trimmed);
    return normalizeSuggestions(parsed);
  } catch {
    // continue
  }

  try {
    const extracted = extractJsonFromText(trimmed);
    return normalizeSuggestions(extracted);
  } catch {
    return [];
  }
};

const callGroqForRoleSuggestions = async (query) => {
  const client = getClient();
  if (!client) return [];

  const { fastModel } = getGroqConfig();

  const completion = await client.chat.completions.create({
    model: fastModel,
    messages: [
      {
        role: 'user',
        content: `Suggest 5 real job or profession titles that start with, contain, or closely relate to: '${query}'. Return ONLY a valid JSON array of strings, no explanation, no markdown formatting.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  const content = completion.choices?.[0]?.message?.content?.trim();
  return parseSuggestionsContent(content);
};

const trimCache = () => {
  if (ROLE_SUGGESTIONS_CACHE.size <= MAX_CACHE_ENTRIES) return;
  const oldestKey = ROLE_SUGGESTIONS_CACHE.keys().next().value;
  if (oldestKey) ROLE_SUGGESTIONS_CACHE.delete(oldestKey);
};

/**
 * Returns up to 6 role title suggestions for autocomplete. Never throws.
 * @param {string} query
 * @returns {Promise<string[]>}
 */
export const fetchRoleSuggestionsWithGroq = async (query) => {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return [];

  const cacheKey = normalizedQuery.toLowerCase();
  if (ROLE_SUGGESTIONS_CACHE.has(cacheKey)) {
    return ROLE_SUGGESTIONS_CACHE.get(cacheKey);
  }

  if (!isGroqConfigured()) {
    return [];
  }

  try {
    const suggestions = await callGroqForRoleSuggestions(normalizedQuery);
    ROLE_SUGGESTIONS_CACHE.set(cacheKey, suggestions);
    trimCache();
    return suggestions;
  } catch {
    return [];
  }
};

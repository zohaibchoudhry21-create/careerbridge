/**
 * Optional Groq numeric linguistics only (grammar / vocabulary / emotion).
 * Never invent — returns null fields on any failure.
 */

import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../../config/groqConfig.js';
import {
  SPEECH_LINGUISTICS_GROQ_ENABLED,
  SPEECH_LINGUISTICS_TRANSCRIPT_MAX_CHARS,
} from '../../config/speechMonitoringConfig.js';
import { extractJsonFromText } from '../../utils/resumeAiPrompts.js';
import { withGroqRetry } from '../../utils/withGroqRetry.js';

const clamp100OrNull = (value) => {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
};

/**
 * @param {{ transcript: string }} params
 * @returns {Promise<{ grammarQuality: number|null, vocabularyQuality: number|null, emotionLabel: string|null, emotionScore: number|null }>}
 */
export const scoreSpeechLinguisticsWithGroq = async ({ transcript }) => {
  const empty = {
    grammarQuality: null,
    vocabularyQuality: null,
    emotionLabel: null,
    emotionScore: null,
  };

  if (!SPEECH_LINGUISTICS_GROQ_ENABLED || !isGroqConfigured()) {
    return empty;
  }

  const text = String(transcript || '').trim();
  if (!text) return empty;

  const clipped = text.slice(0, SPEECH_LINGUISTICS_TRANSCRIPT_MAX_CHARS);
  const { model, apiKey } = getGroqConfig();
  const client = new Groq({ apiKey });

  const prompt = `You score interview speech linguistics from a transcript only (not coaching feedback).

Transcript:
"""
${clipped}
"""

Return JSON only:
{
  "grammarQuality": 0-100,
  "vocabularyQuality": 0-100,
  "emotionLabel": "one of: calm, confident, nervous, enthusiastic, neutral, uncertain",
  "emotionScore": 0-100
}

Rules:
- Score only from evidence in the transcript.
- If evidence is weak because the answer is short, off-topic, or irrelevant to the question, score low (0-20), not mid-range. Only use mid-range scores when the answer is genuinely on-topic but ambiguous in quality. Never default to 40-60 as a safe fallback for irrelevant content.
- emotionScore is intensity of the labeled emotion (not positivity).`;

  try {
    const completion = await withGroqRetry(
      () =>
        client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      { label: 'speech-linguistics' }
    );

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) return empty;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = extractJsonFromText(content) || {};
    }

    const emotionLabel = parsed.emotionLabel
      ? String(parsed.emotionLabel).trim().toLowerCase().slice(0, 40)
      : null;

    return {
      grammarQuality: clamp100OrNull(parsed.grammarQuality),
      vocabularyQuality: clamp100OrNull(parsed.vocabularyQuality),
      emotionLabel: emotionLabel || null,
      emotionScore: clamp100OrNull(parsed.emotionScore),
    };
  } catch {
    return empty;
  }
};

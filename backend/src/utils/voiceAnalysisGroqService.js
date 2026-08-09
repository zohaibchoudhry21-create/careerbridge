import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import { extractJsonFromText } from './resumeAiPrompts.js';
import { withGroqRetry } from './withGroqRetry.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  return new Groq({ apiKey });
};

export const scoreVoiceWithGroq = async ({ transcript, wpm, fillerWords, pauseRatio }) => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  const { model } = getGroqConfig();
  const client = getClient();

  const prompt = `
You are an interview coach evaluating spoken answer delivery (not factual correctness).

Transcript:
"""
${transcript}
"""

Measured metrics:
- words per minute: ${wpm}
- filler word count: ${fillerWords}
- pause ratio (0-1, higher = more silence): ${pauseRatio}

Score confidence/clarity/tone for interview delivery. Return JSON only:
{
  "confidenceScore": 0-100,
  "toneLabel": "short label e.g. Calm and clear",
  "feedbackText": "2-3 sentences of actionable feedback"
}
`;

  let completion;
  try {
    completion = await withGroqRetry(
      () =>
        client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      { label: 'voice-analysis' }
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.AI_SERVICE_UNAVAILABLE, 503);
  }

  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.EMPTY_VOICE_ANALYSIS, 502);
  }

  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = extractJsonFromText(content);
  }

  const confidenceScore = Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 0));

  return {
    confidenceScore,
    toneLabel: String(parsed.toneLabel || 'Neutral').trim(),
    feedbackText: String(parsed.feedbackText || '').trim(),
  };
};

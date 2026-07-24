import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { AppError } from './sendResponse.js';
import { extractJsonFromText } from './resumeAiPrompts.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
  }

  return new Groq({ apiKey });
};

export const scoreVoiceWithGroq = async ({ transcript, wpm, fillerWords, pauseRatio }) => {
  if (!isGroqConfigured()) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
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

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError('Groq returned an empty voice analysis.', 502);
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

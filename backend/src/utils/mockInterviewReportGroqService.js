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

export const generateMockInterviewReportWithGroq = async (snapshot) => {
  if (!isGroqConfigured()) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
  }

  const { model } = getGroqConfig();
  const client = getClient();

  const prompt = `
You are an expert interview coach. Analyze this mock interview and return JSON only.

Role: ${snapshot.role}
Difficulty: ${snapshot.difficulty}
Interview style: ${
    snapshot.mode === 'voiceCall' || snapshot.mode === 'live'
      ? snapshot.mode === 'live'
        ? 'live interview (real-time voice call with camera/mic metrics)'
        : 'live voice call (full conversation transcript)'
      : 'turn-based recorded answers'
  }
Measured summary: ${JSON.stringify(snapshot.summary)}
${
  snapshot.mode === 'voiceCall' || snapshot.mode === 'live'
    ? `Score using these categories where relevant: Communication Skills, Technical Knowledge, Problem Solving, Cultural Fit, Confidence and Clarity.
Full transcript turns: ${JSON.stringify(snapshot.fullTranscript || [])}`
    : ''
}

Q&A with metrics:
${JSON.stringify(snapshot.qa, null, 2)}

Return JSON exactly in this shape:
{
  "overallScore": 0-100,
  "sections": {
    "contentQuality": { "score": 0-100, "feedback": "string" },
    "voiceAnalysis": {
      "wpm": number,
      "confidenceScore": number,
      "fillerWords": number,
      "feedback": "string"
    },
    "videoAnalysis": {
      "eyeContactPercent": number,
      "engagementScore": number,
      "feedback": "string"
    }
  },
  "strengths": ["string"],
  "improvementAreas": ["string"],
  "recommendedNextSteps": ["string"]
}

Use the measured metrics for numeric fields where applicable. Judge answer substance for contentQuality.
`;

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.35,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError('Groq returned an empty interview report.', 502);
  }

  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = extractJsonFromText(content);
  }

  const overallScore = Math.min(100, Math.max(0, Number(parsed.overallScore) || 0));

  return {
    overallScore,
    sections: parsed.sections || {},
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    improvementAreas: Array.isArray(parsed.improvementAreas)
      ? parsed.improvementAreas.map(String)
      : [],
    recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps)
      ? parsed.recommendedNextSteps.map(String)
      : [],
  };
};

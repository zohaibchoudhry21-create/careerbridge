/**
 * Server-side score / list sanitizers for AI report payloads.
 */

export const clampScore = (value, fallback = 0) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
};

const MAX_LIST_ITEMS = 10;
const MAX_ITEM_CHARS = 300;

export const sanitizeStringList = (value, { maxItems = MAX_LIST_ITEMS, maxChars = MAX_ITEM_CHARS } = {}) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .map((item) => item.slice(0, maxChars))
    .slice(0, maxItems);
};

/** Common prompt-injection markers in candidate transcript text. */
const INJECTION_MARKER_RE =
  /\b(ignore\s+(all\s+)?previous|disregard\s+(the\s+)?above|you\s+are\s+now|system\s+prompt|forget\s+(your\s+)?instructions|act\s+as\s+(if\s+)?you|override\s+(your\s+)?instructions)\b/i;

export const detectTranscriptInjectionMarkers = (transcriptTurns = []) => {
  const texts = Array.isArray(transcriptTurns)
    ? transcriptTurns.map((t) => String(t?.content ?? t?.text ?? t ?? ''))
    : [String(transcriptTurns || '')];

  for (const text of texts) {
    if (INJECTION_MARKER_RE.test(text)) {
      return true;
    }
  }
  return false;
};

export const sanitizeAiReportPayload = (aiReport = {}) => {
  const sectionsIn = aiReport.sections && typeof aiReport.sections === 'object' ? aiReport.sections : {};
  const contentQuality = sectionsIn.contentQuality || {};
  const voiceAnalysis = sectionsIn.voiceAnalysis || {};
  const videoAnalysis = sectionsIn.videoAnalysis || {};

  return {
    overallScore: clampScore(aiReport.overallScore, 0),
    sections: {
      contentQuality: {
        score: clampScore(contentQuality.score, 0),
        feedback: String(contentQuality.feedback || '').slice(0, 2000),
      },
      voiceAnalysis: {
        wpm: Number.isFinite(Number(voiceAnalysis.wpm)) ? Math.max(0, Number(voiceAnalysis.wpm)) : undefined,
        confidenceScore: clampScore(voiceAnalysis.confidenceScore, 0),
        fillerWords: Number.isFinite(Number(voiceAnalysis.fillerWords))
          ? Math.max(0, Math.round(Number(voiceAnalysis.fillerWords)))
          : undefined,
        feedback: String(voiceAnalysis.feedback || '').slice(0, 2000),
      },
      videoAnalysis: {
        eyeContactPercent: clampScore(videoAnalysis.eyeContactPercent, 0),
        engagementScore: clampScore(videoAnalysis.engagementScore, 0),
        feedback: String(videoAnalysis.feedback || '').slice(0, 2000),
      },
    },
    strengths: sanitizeStringList(aiReport.strengths),
    improvementAreas: sanitizeStringList(aiReport.improvementAreas),
    recommendedNextSteps: sanitizeStringList(aiReport.recommendedNextSteps),
  };
};

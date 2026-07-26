import { computeLocalVoiceMetrics } from './voiceAnalysisMetrics.js';
import { scoreVoiceWithGroq } from './voiceAnalysisGroqService.js';

/**
 * Run local metrics + Groq qualitative scoring from an existing transcription.
 */
export const analyzeVoiceFromTranscription = async ({
  transcript,
  duration,
  segments,
  durationMs,
}) => {
  const local = computeLocalVoiceMetrics({
    transcript,
    duration,
    segments,
    durationMs,
  });

  const ai = await scoreVoiceWithGroq({
    transcript,
    wpm: local.wpm,
    fillerWords: local.fillerWords,
    pauseRatio: local.pauseRatio,
  });

  return {
    wpm: local.wpm,
    fillerWords: local.fillerWords,
    pauseRatio: local.pauseRatio,
    confidenceScore: ai.confidenceScore,
    toneLabel: ai.toneLabel,
    feedbackText: ai.feedbackText,
  };
};

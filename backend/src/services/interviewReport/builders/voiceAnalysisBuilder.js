import { clamp100, dimSection, pickScore } from './scoreHelpers.js';

/**
 * Delivery-only section: speaking pace, fillers, fluency, etc.
 * Does not measure answer substance / correctness.
 */
export const buildVoiceAnalysisSection = (snapshot = {}) => {
  const speech = snapshot.callSpeechMetrics || {};
  const legacy = snapshot.summary || {};
  const score = pickScore(
    speech.communicationScore,
    speech.fluency,
    speech.speakingConfidence,
    legacy.averageConfidenceScore
  );

  const metrics = {
    speechSpeed: speech.speechSpeed ?? legacy.averageWpm ?? null,
    fluency: speech.fluency ?? null,
    speakingConfidence: speech.speakingConfidence ?? legacy.averageConfidenceScore ?? null,
    fillerWords: speech.fillerWords ?? legacy.totalFillerWords ?? null,
    fillersPer100Words: speech.fillersPer100Words ?? null,
    volumeStability: speech.volumeStability ?? null,
    pitchStability: speech.pitchStability ?? null,
    stressScore: speech.stressScore ?? null,
    energy: speech.energy ?? null,
    pauseRatio: legacy.averagePauseRatio ?? speech.silenceRatio ?? null,
  };

  const evidence = [];
  if (metrics.speechSpeed != null) evidence.push(`Speaking pace: ${metrics.speechSpeed} WPM`);
  if (metrics.fillerWords != null) evidence.push(`Filler words: ${metrics.fillerWords}`);
  if (metrics.fluency != null) evidence.push(`Fluency score: ${metrics.fluency}`);

  return {
    ...dimSection('Voice Analysis', score, '', evidence),
    metrics,
    score: clamp100(score, null),
    deliveryOnly: true,
  };
};

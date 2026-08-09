/**
 * Compose fluency, confidence, stress, consistency, and communication scores
 * from measured components + config weights. Never random.
 */

import {
  COMMUNICATION_SCORE_WEIGHTS,
  FILLER_PER_100_WORDS_HARD,
  FILLER_PER_100_WORDS_SOFT,
  FLUENCY_SCORE_WEIGHTS,
  LONG_PAUSE_RATIO_HARD,
  LONG_PAUSE_RATIO_SOFT,
  SPEAKING_CONFIDENCE_WEIGHTS,
  STRESS_SCORE_WEIGHTS,
  ENERGY_CV_STRESS_HARD,
  ENERGY_CV_STRESS_SOFT,
  PITCH_CV_STRESS_HARD,
  PITCH_CV_STRESS_SOFT,
  WPM_TOO_FAST,
} from '../../config/speechMonitoringConfig.js';

const clamp100 = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));

const weightedAverage = (parts) => {
  const usable = parts.filter((p) => p.value != null && Number.isFinite(Number(p.value)) && p.weight > 0);
  if (!usable.length) return null;
  const weightSum = usable.reduce((s, p) => s + p.weight, 0);
  if (weightSum <= 0) return null;
  const score = usable.reduce((s, p) => s + Number(p.value) * (p.weight / weightSum), 0);
  return clamp100(score);
};

/** Map filler density to 0–100 health (higher = fewer fillers). */
export const fillerHealthScore = (fillersPer100Words) => {
  const rate = Number(fillersPer100Words);
  if (!Number.isFinite(rate)) return null;
  if (rate <= FILLER_PER_100_WORDS_SOFT) return 100;
  if (rate >= FILLER_PER_100_WORDS_HARD) return 0;
  const t = (rate - FILLER_PER_100_WORDS_SOFT) / (FILLER_PER_100_WORDS_HARD - FILLER_PER_100_WORDS_SOFT);
  return clamp100(100 * (1 - t));
};

/** Map long-pause share of session to pause health 0–100. */
export const pauseHealthScore = (longPauseDurationMs, durationMs) => {
  const total = Number(durationMs);
  const longMs = Number(longPauseDurationMs) || 0;
  if (!Number.isFinite(total) || total <= 0) return null;
  const ratio = longMs / total;
  if (ratio <= LONG_PAUSE_RATIO_SOFT) return 100;
  if (ratio >= LONG_PAUSE_RATIO_HARD) return 0;
  const t = (ratio - LONG_PAUSE_RATIO_SOFT) / (LONG_PAUSE_RATIO_HARD - LONG_PAUSE_RATIO_SOFT);
  return clamp100(100 * (1 - t));
};

const cvToStressComponent = (cv, soft, hard) => {
  if (cv == null || !Number.isFinite(Number(cv))) return null;
  const v = Number(cv);
  if (v <= soft) return 0;
  if (v >= hard) return 100;
  return clamp100(((v - soft) / (hard - soft)) * 100);
};

/**
 * Rolling consistency from energy CV inverted (stable energy → consistent speaking).
 * When acoustic samples present, use volumeStability; else null.
 */
export const computeSpeakingConsistency = ({ volumeStability, pitchStability, speedInBandScore }) =>
  weightedAverage([
    { value: volumeStability, weight: 0.45 },
    { value: pitchStability, weight: 0.25 },
    { value: speedInBandScore, weight: 0.3 },
  ]);

export const composeSpeechScores = ({
  speedInBandScore,
  fillersPer100Words,
  longPauseDurationMs,
  durationMs,
  volumeStability,
  pitchStability,
  energyCv,
  pitchCv,
  speechSpeedWpm,
  vocabularyQuality,
  grammarQuality,
} = {}) => {
  const fillerHealth = fillerHealthScore(fillersPer100Words);
  const pauseHealth = pauseHealthScore(longPauseDurationMs, durationMs);

  const fluency = weightedAverage([
    { value: speedInBandScore, weight: FLUENCY_SCORE_WEIGHTS.speedInBand },
    { value: pauseHealth, weight: FLUENCY_SCORE_WEIGHTS.pauseHealth },
    { value: fillerHealth, weight: FLUENCY_SCORE_WEIGHTS.fillerHealth },
  ]);

  const speakingConfidence = weightedAverage([
    { value: volumeStability, weight: SPEAKING_CONFIDENCE_WEIGHTS.volumeStability },
    { value: fluency, weight: SPEAKING_CONFIDENCE_WEIGHTS.fluency },
    { value: fillerHealth, weight: SPEAKING_CONFIDENCE_WEIGHTS.fillerHealth },
  ]);

  const rushedPace =
    Number(speechSpeedWpm) >= WPM_TOO_FAST
      ? clamp100(((Number(speechSpeedWpm) - WPM_TOO_FAST) / 40) * 100)
      : Number(speechSpeedWpm) > 0
        ? 0
        : null;

  const stressScore = weightedAverage([
    {
      value: cvToStressComponent(energyCv, ENERGY_CV_STRESS_SOFT, ENERGY_CV_STRESS_HARD),
      weight: STRESS_SCORE_WEIGHTS.energyVariance,
    },
    {
      value: cvToStressComponent(pitchCv, PITCH_CV_STRESS_SOFT, PITCH_CV_STRESS_HARD),
      weight: STRESS_SCORE_WEIGHTS.pitchVariance,
    },
    { value: rushedPace, weight: STRESS_SCORE_WEIGHTS.rushedPace },
  ]);

  const speakingConsistency = computeSpeakingConsistency({
    volumeStability,
    pitchStability,
    speedInBandScore,
  });

  const communicationScore = weightedAverage([
    { value: fluency, weight: COMMUNICATION_SCORE_WEIGHTS.fluency },
    { value: speakingConfidence, weight: COMMUNICATION_SCORE_WEIGHTS.speakingConfidence },
    { value: vocabularyQuality, weight: COMMUNICATION_SCORE_WEIGHTS.vocabulary },
    { value: grammarQuality, weight: COMMUNICATION_SCORE_WEIGHTS.grammar },
    { value: pauseHealth, weight: COMMUNICATION_SCORE_WEIGHTS.pauseHealth },
  ]);

  return {
    fluency,
    speakingConfidence,
    stressScore,
    speakingConsistency,
    communicationScore,
    fillerHealth,
    pauseHealth,
  };
};

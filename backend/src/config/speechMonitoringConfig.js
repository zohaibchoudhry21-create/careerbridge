/**
 * Thresholds and weights for professional speech monitoring.
 * Keep in sync with frontend/src/features/interviewPrep/config/speechMonitoringConfig.js
 *
 * Acoustic metrics come from Web Audio samples; linguistic from transcript / Whisper.
 * Never invent scores — omit or null when signals are insufficient.
 */

/** RMS / amplitude below this counts as silence (0–1 normalized). */
export const SILENCE_THRESHOLD = 0.04;

/** Pause classification (ms of continuous silence). */
export const SHORT_PAUSE_MIN_MS = 300;
export const SHORT_PAUSE_MAX_MS = 1199;
export const LONG_PAUSE_MIN_MS = 1200;

/** Thinking-time: silence after assistant turn before candidate speech (ms). */
export const THINKING_TIME_MIN_MS = 400;
export const THINKING_TIME_MAX_TRACK_MS = 30000;

/** Pitch detection bounds (Hz) — typical adult speech. */
export const PITCH_MIN_HZ = 70;
export const PITCH_MAX_HZ = 400;
/** Min pitched frames before pitchStability is computed. */
export const PITCH_MIN_VALID_FRAMES = 8;

/** Ideal interview speaking rate band (words per minute). */
export const WPM_IDEAL_MIN = 110;
export const WPM_IDEAL_MAX = 160;
export const WPM_TOO_FAST = 190;
export const WPM_TOO_SLOW = 90;

/** Cap acoustic samples stored / submitted (keeps payload bounded). */
export const ACOUSTIC_SAMPLES_MAX = 2400;
/** Cap pause events stored on the client snapshot. */
export const PAUSE_EVENTS_MAX = 200;

/** Default sample interval when deltas missing (matches LIVE_AUDIO_SAMPLE_INTERVAL_MS). */
export const DEFAULT_AUDIO_SAMPLE_INTERVAL_MS = 250;

/** Timeline event throttling. */
export const SPEECH_TIMELINE_EVENT_THROTTLE_MS = 4000;
export const SPEECH_TIMELINE_EVENT_MIN_HOLD_MS = 1000;
export const SPEECH_TIMELINE_EVENTS_MAX = 80;

/** Fluency composition weights (must sum to 1). */
export const FLUENCY_SCORE_WEIGHTS = {
  speedInBand: 0.35,
  pauseHealth: 0.35,
  fillerHealth: 0.3,
};

/** Speaking confidence composition (must sum to 1). */
export const SPEAKING_CONFIDENCE_WEIGHTS = {
  volumeStability: 0.35,
  fluency: 0.4,
  fillerHealth: 0.25,
};

/** Stress proxy composition (higher = more stressed; must sum to 1). */
export const STRESS_SCORE_WEIGHTS = {
  energyVariance: 0.35,
  pitchVariance: 0.3,
  rushedPace: 0.35,
};

/** Communication score weights (re-normalized if grammar missing). */
export const COMMUNICATION_SCORE_WEIGHTS = {
  fluency: 0.3,
  speakingConfidence: 0.25,
  vocabulary: 0.2,
  grammar: 0.15,
  pauseHealth: 0.1,
};

/** Filler density: fillers per 100 words above this hurts fluency. */
export const FILLER_PER_100_WORDS_SOFT = 3;
export const FILLER_PER_100_WORDS_HARD = 8;

/** Long-pause share of duration above this hurts pause health. */
export const LONG_PAUSE_RATIO_SOFT = 0.12;
export const LONG_PAUSE_RATIO_HARD = 0.28;

/** Energy CV above this contributes to stress. */
export const ENERGY_CV_STRESS_SOFT = 0.35;
export const ENERGY_CV_STRESS_HARD = 0.7;

/** Pitch CV above this contributes to stress. */
export const PITCH_CV_STRESS_SOFT = 0.2;
export const PITCH_CV_STRESS_HARD = 0.45;

/** Whisper avg_logprob mapping for pronunciation (only when segments present). */
export const WHISPER_LOGPROB_PRONUNCIATION_FLOOR = -1.2;
export const WHISPER_LOGPROB_PRONUNCIATION_CEIL = -0.2;

/** Deterministic vocab: type-token ratio soft/hard bands. */
export const VOCAB_TTR_SOFT = 0.35;
export const VOCAB_TTR_HARD = 0.55;

/** Optional Groq linguistics — timeout-friendly transcript cap (chars). */
export const SPEECH_LINGUISTICS_TRANSCRIPT_MAX_CHARS = 6000;

/** Whether optional Groq linguistics are attempted (env can disable). */
export const SPEECH_LINGUISTICS_GROQ_ENABLED =
  String(process.env.SPEECH_LINGUISTICS_GROQ_ENABLED || 'true').toLowerCase() !== 'false';

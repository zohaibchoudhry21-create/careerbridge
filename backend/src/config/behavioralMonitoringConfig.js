/**
 * Thresholds and weights for live interview behavioral video monitoring.
 * Keep in sync with frontend/src/features/interviewPrep/config/behavioralMonitoringConfig.js
 *
 * All scores are derived from measurable face-api signals — never random.
 */

/** Eye-contact sample counts as "maintaining" when at or above this %. */
export const EYE_CONTACT_MAINTAIN_THRESHOLD = 55;

/** Sample eye-contact below this % contributes to looking-away duration. */
export const EYE_CONTACT_AWAY_THRESHOLD = 45;

/**
 * Head-pose yaw (nose vs eye midpoint / interocular).
 * Positive yaw ≈ turned toward viewer's left (candidate looking right).
 */
export const HEAD_YAW_LOOK_THRESHOLD = 0.28;

/** Head-pose pitch (nose–eye / eye–chin). Higher ≈ looking down. */
export const HEAD_PITCH_DOWN_THRESHOLD = 0.62;

/** Happy expression probability to count as a smile sample. */
export const SMILE_EXPRESSION_THRESHOLD = 0.55;

/** Detection score below this weakens camera-focus heuristic. */
export const CAMERA_FOCUS_MIN_DETECTION_SCORE = 0.45;

/**
 * Ideal face area ratio (bounding box / frame). Below → too far / soft focus heuristic.
 * Assumption: webcam framing with face ~8–18% of frame is typical interview framing.
 */
export const CAMERA_FOCUS_IDEAL_FACE_AREA_RATIO = 0.12;
export const CAMERA_FOCUS_MIN_FACE_AREA_RATIO = 0.035;
export const CAMERA_FOCUS_MAX_FACE_AREA_RATIO = 0.35;

/** Weights for camera-focus heuristic (must sum to 1). */
export const CAMERA_FOCUS_WEIGHTS = {
  detectionScore: 0.55,
  faceSize: 0.45,
};

/**
 * Attention score composition (must sum to 1).
 * Uses averages / presence ratios measured across samples.
 */
export const ATTENTION_SCORE_WEIGHTS = {
  eyeContact: 0.4,
  notLookingAway: 0.25,
  cameraFocus: 0.15,
  facePresence: 0.1,
  forwardPose: 0.1,
};

/**
 * Engagement score (legacy report-compatible blend).
 * Keep weights stable so existing report scores stay comparable.
 */
export const ENGAGEMENT_SCORE_WEIGHTS = {
  eyeContact: 0.55,
  expressionComponent: 0.45,
  positiveHappy: 0.7,
  positiveNeutral: 0.3,
  expressionPositiveShare: 0.7,
  expressionNegativeShare: 0.3,
};

/**
 * Distraction score composition (must sum to 1).
 * Higher = more distracted.
 */
export const DISTRACTION_SCORE_WEIGHTS = {
  lookingAway: 0.35,
  lookingOffCenter: 0.2,
  multipleFaces: 0.2,
  faceMissing: 0.15,
  stranger: 0.1,
};

/** Distraction flagged when distractionScore >= this. */
export const DISTRACTION_FLAG_THRESHOLD = 35;

/**
 * Sustained no-face duration before "face missing" / "left camera" timeline events.
 * Measured in ms using sample timestamps (or sampleIntervalMs fallback).
 */
export const FACE_MISSING_EVENT_MS = 2500;
export const CANDIDATE_LEFT_CAMERA_MS = 5000;

/** Multiple faces: faceCount >= this triggers multi-face state. */
export const MULTIPLE_FACE_MIN_COUNT = 2;

/**
 * Stranger detection via face-api FaceRecognitionNet descriptors.
 * Euclidean distance above threshold vs candidate reference ⇒ stranger (heuristic identity).
 * face-api typically uses ~0.6 for FaceMatcher; we keep a slightly stricter default.
 */
export const STRANGER_DESCRIPTOR_DISTANCE_THRESHOLD = 0.55;
/** Stable single-face samples collected before locking the candidate reference. */
export const STRANGER_REFERENCE_SAMPLE_COUNT = 5;
/** Min detection score for a sample to contribute to the candidate reference. */
export const STRANGER_REFERENCE_MIN_SCORE = 0.6;
/** Min eye-contact % while collecting the candidate reference. */
export const STRANGER_REFERENCE_MIN_EYE_CONTACT = 40;

/** Min ms between identical timeline event types (throttle). */
export const TIMELINE_EVENT_THROTTLE_MS = 4000;

/** Min ms a state must persist before emitting a timeline event. */
export const TIMELINE_EVENT_MIN_HOLD_MS = 1200;

/** Cap stored timeline events per session. */
export const TIMELINE_EVENTS_MAX = 80;

/** Cap expression timeline points (dominant-expression changes). */
export const EXPRESSION_TIMELINE_MAX = 60;

/** Min confidence delta / hold to record an expression timeline point. */
export const EXPRESSION_TIMELINE_MIN_HOLD_MS = 1500;

/** Default assumed sample interval when samples omit tMs deltas. */
export const DEFAULT_SAMPLE_INTERVAL_MS = 400;

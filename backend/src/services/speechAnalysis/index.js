/**
 * Public surface for professional speech monitoring (no report generation).
 */

export { analyzeSpeechMonitoring } from './speechAnalysisService.js';
export { computeAcousticMetrics, derivePauseEventsFromSamples } from './acousticMetrics.js';
export { computeLinguisticMetrics, computePronunciationScore } from './linguisticMetrics.js';
export { buildSpeechTimelineEvents, computeThinkingTimeMetrics } from './pauseTimeline.js';
export { composeSpeechScores, fillerHealthScore, pauseHealthScore } from './scoreComposer.js';

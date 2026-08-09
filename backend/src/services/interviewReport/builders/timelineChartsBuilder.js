import {
  MAX_DELIVERY_INFLUENCE_ON_OVERALL,
  TIMELINE_EVENTS_MAX,
} from '../../../config/interviewReportConfig.js';
import { CONTENT_DIMENSIONS } from './dimensionScoresBuilder.js';
import { clamp100 } from './scoreHelpers.js';

const normalizeEvent = (event, source) => ({
  tMs: Number(event.tMs) || 0,
  offsetLabel: event.offsetLabel || '00:00',
  type: event.type || 'event',
  message: event.message || event.type || 'Event',
  severity: event.severity || 'info',
  source,
});

/**
 * Phase 4 — delivery bars must not look "healthy" next to weak content.
 * Cap chart display at contentBase + MAX_DELIVERY_INFLUENCE_ON_OVERALL (same Phase 3 budget).
 */
export const capDeliveryScoreForChart = (
  score,
  contentBase,
  maxInfluence = MAX_DELIVERY_INFLUENCE_ON_OVERALL
) => {
  if (score == null) return null;
  const raw = clamp100(score, null);
  if (raw == null) return null;
  if (contentBase == null || !Number.isFinite(Number(contentBase))) {
    return raw;
  }
  const cap = Number(contentBase) + maxInfluence;
  return clamp100(Math.min(raw, cap), null);
};

/**
 * Build timeline + charts.
 * - Timeline events: snapshot.speechTimelineEvents + snapshot.behavioralTimelineEvents
 *   (same arrays persisted on the session at submit — not recomputed here).
 * - Chart scores: SAME final capped `dimensions` / delivery sections used elsewhere.
 */
export const buildTimelineAndCharts = ({
  dimensions = {},
  voiceSection,
  eyeContactSection,
  bodyLanguageSection,
  speechTimelineEvents = [],
  behavioralTimelineEvents = [],
  overallScore,
  contentAvg = null,
  contentCore = null,
} = {}) => {
  const timeline = [
    ...(Array.isArray(speechTimelineEvents) ? speechTimelineEvents : []).map((e) =>
      normalizeEvent(e, 'speech')
    ),
    ...(Array.isArray(behavioralTimelineEvents) ? behavioralTimelineEvents : []).map((e) =>
      normalizeEvent(e, 'behavioral')
    ),
  ]
    .sort((a, b) => a.tMs - b.tMs)
    .slice(0, TIMELINE_EVENTS_MAX);

  // Radar = final capped content dimensions (+ confidence from same object).
  const contentBase =
    contentCore != null && Number.isFinite(Number(contentCore))
      ? Number(contentCore)
      : contentAvg != null && Number.isFinite(Number(contentAvg))
        ? Number(contentAvg)
        : null;

  const dimensionRadar = [
    ...CONTENT_DIMENSIONS.map((key) => {
      const d = dimensions[key];
      if (d?.score == null) return null;
      return {
        key,
        label: d.label || key,
        score: d.score,
        group: 'content',
      };
    }),
    dimensions.confidence?.score != null
      ? {
          key: 'confidence',
          label: dimensions.confidence.label || 'Confidence',
          score: dimensions.confidence.score,
          group: 'deliveryInfluenced',
        }
      : null,
  ].filter(Boolean);

  const contentBars = CONTENT_DIMENSIONS.map((key) => {
    const d = dimensions[key];
    if (d?.score == null) return null;
    return {
      key,
      label: d.label || key,
      score: d.score,
      group: 'content',
      deliveryOnly: false,
    };
  }).filter(Boolean);

  const voiceChart = capDeliveryScoreForChart(voiceSection?.score, contentBase);
  const eyeChart = capDeliveryScoreForChart(eyeContactSection?.score, contentBase);
  const bodyChart = capDeliveryScoreForChart(bodyLanguageSection?.score, contentBase);

  const deliveryBars = [
    voiceChart != null
      ? {
          key: 'voice',
          label: 'Voice (delivery)',
          score: voiceChart,
          rawScore: voiceSection?.score ?? null,
          group: 'delivery',
          deliveryOnly: true,
        }
      : null,
    eyeChart != null
      ? {
          key: 'eyeContact',
          label: 'Eye Contact (delivery)',
          score: eyeChart,
          rawScore: eyeContactSection?.score ?? eyeContactSection?.percent ?? null,
          group: 'delivery',
          deliveryOnly: true,
        }
      : null,
    bodyChart != null
      ? {
          key: 'bodyLanguage',
          label: 'Body Language (delivery)',
          score: bodyChart,
          rawScore: bodyLanguageSection?.score ?? null,
          group: 'delivery',
          deliveryOnly: true,
        }
      : null,
  ].filter(Boolean);

  const scoreBreakdown = [
    ...contentBars,
    ...deliveryBars,
    overallScore != null
      ? { key: 'overall', label: 'Overall', score: overallScore, group: 'overall' }
      : null,
  ].filter(Boolean);

  const contentGated = contentBase != null && Number(contentBase) <= 5;

  const voiceMetricsBars = Object.entries(voiceSection?.metrics || {})
    .filter(([, v]) => v != null && typeof v === 'number')
    .map(([key, value]) => ({ key, value }));

  return {
    timeline,
    charts: {
      dimensionRadar,
      scoreBreakdown,
      scoreBreakdownContent: contentBars,
      scoreBreakdownDelivery: deliveryBars,
      speechTimeline: timeline.filter((e) => e.source === 'speech'),
      behavioralTimeline: timeline.filter((e) => e.source === 'behavioral'),
      voiceMetricsBars,
      contentGated,
      contentBase,
    },
  };
};

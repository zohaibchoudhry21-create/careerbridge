import { clamp100, dimSection, pickScore } from './scoreHelpers.js';

/**
 * Delivery-only section: camera presence / engagement signals.
 * Does not measure answer substance / correctness.
 */
export const buildBodyLanguageSection = (snapshot = {}) => {
  const behavioral = snapshot.behavioralMetrics || {};
  const engagement = clamp100(snapshot.summary?.averageEngagementScore, null);
  const attention = clamp100(
    behavioral.attentionScore ?? snapshot.summary?.averageAttentionScore,
    null
  );
  const distraction = clamp100(behavioral.distractionScore, null);
  const smileFrequency = behavioral.smileFrequency ?? behavioral.smileRate ?? null;

  const invertedDistraction = distraction != null ? 100 - distraction : null;
  const score = pickScore(attention, engagement, invertedDistraction);

  const metrics = {
    engagementScore: engagement,
    attentionScore: attention,
    distractionScore: distraction,
    cameraFocusScore: clamp100(behavioral.cameraFocusScore, null),
    smileFrequency: smileFrequency != null ? Number(smileFrequency) : null,
    lookingAwayDurationMs: Number(behavioral.lookingAwayDurationMs) || 0,
    multipleFaceEvents: Number(behavioral.multipleFaceCount || behavioral.multipleFaceEvents) || 0,
  };

  const evidence = [];
  if (attention != null) evidence.push(`Attention score: ${attention}`);
  if (distraction != null) evidence.push(`Distraction score: ${distraction}`);
  if (metrics.cameraFocusScore != null) evidence.push(`Camera focus: ${metrics.cameraFocusScore}`);

  return {
    ...dimSection('Body Language', score, '', evidence),
    metrics,
    deliveryOnly: true,
  };
};

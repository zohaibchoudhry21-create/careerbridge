import { clamp100, dimSection } from './scoreHelpers.js';

/**
 * Delivery-only section: eye-contact / looking-away metrics.
 * Does not measure answer substance / correctness.
 */
export const buildEyeContactSection = (snapshot = {}) => {
  const percent = clamp100(
    snapshot.summary?.averageEyeContactPercent ?? snapshot.callVideoMetrics?.eyeContactPercent,
    null
  );
  const behavioral = snapshot.behavioralMetrics || {};
  const lookingAwayMs = Number(behavioral.lookingAwayDurationMs) || 0;
  const evidence = [];
  if (percent != null) evidence.push(`Eye contact average: ${percent}%`);
  if (lookingAwayMs > 0) evidence.push(`Looking away duration: ${Math.round(lookingAwayMs / 1000)}s`);

  return {
    ...dimSection('Eye Contact', percent, '', evidence),
    percent,
    deliveryOnly: true,
  };
};

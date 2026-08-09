/**
 * Sanity-check client-supplied live interview metrics.
 * Flags anomalies for review — does not reject or alter scores.
 */

const clampReason = (reason) => String(reason || '').slice(0, 160);

const asNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const isPercentOutOfRange = (value) => {
  const n = asNumber(value);
  if (n == null) return false;
  return n < 0 || n > 100;
};

const collectPercentFields = (video = {}, audio = {}) => {
  const fields = [];
  if (video.eyeContactPercent != null) {
    fields.push(['eyeContactPercent', video.eyeContactPercent]);
  }
  if (video.engagementScore != null) {
    fields.push(['engagementScore', video.engagementScore]);
  }
  if (video.attentionScore != null) {
    fields.push(['attentionScore', video.attentionScore]);
  }
  if (audio.averageVolume != null) {
    // averageVolume is 0–1 scale
    const v = asNumber(audio.averageVolume);
    if (v != null && (v < 0 || v > 1)) {
      fields.push(['averageVolume', audio.averageVolume * 100]); // mark via separate check
    }
  }
  if (audio.silenceRatio != null) {
    const v = asNumber(audio.silenceRatio);
    if (v != null && (v < 0 || v > 1)) {
      fields.push(['silenceRatio', v * 100]);
    }
  }
  return fields;
};

const hasZeroVarianceTimeline = (timeline) => {
  if (!Array.isArray(timeline) || timeline.length < 4) return false;

  const eye = [];
  const eng = [];
  for (const sample of timeline) {
    if (!sample || typeof sample !== 'object') continue;
    if (sample.eyeContactPercent != null) eye.push(Number(sample.eyeContactPercent));
    if (sample.engagementScore != null) eng.push(Number(sample.engagementScore));
  }

  const zeroVar = (arr) => {
    const nums = arr.filter((n) => Number.isFinite(n));
    if (nums.length < 4) return false;
    const first = nums[0];
    return nums.every((n) => Math.abs(n - first) < 0.01);
  };

  return zeroVar(eye) || zeroVar(eng);
};

/**
 * @param {object} params
 * @param {number} [params.durationMs]
 * @param {number} [params.questionCount]
 * @param {object} [params.liveAudioHints]
 * @param {object} [params.liveVideoMetrics] - pre or post aggregation
 * @param {object} [params.callVideoMetrics] - report-ready aggregates
 * @returns {string[]} reason codes
 */
export const evaluateClientMetricsAnomalies = ({
  durationMs,
  questionCount = 0,
  liveAudioHints,
  liveVideoMetrics,
  callVideoMetrics,
} = {}) => {
  const reasons = [];
  const video = callVideoMetrics || liveVideoMetrics || {};
  const audio = liveAudioHints || {};
  const qCount = Math.max(1, Number(questionCount) || 1);
  const duration = asNumber(durationMs);

  for (const [field, value] of collectPercentFields(video, {})) {
    if (isPercentOutOfRange(value)) {
      reasons.push(clampReason(`metrics_anomaly: ${field} out of range (${value})`));
    }
  }

  const avgVolume = asNumber(audio.averageVolume);
  if (avgVolume != null && (avgVolume < 0 || avgVolume > 1)) {
    reasons.push(clampReason(`metrics_anomaly: averageVolume out of range (${avgVolume})`));
  }
  const silenceRatio = asNumber(audio.silenceRatio);
  if (silenceRatio != null && (silenceRatio < 0 || silenceRatio > 1)) {
    reasons.push(clampReason(`metrics_anomaly: silenceRatio out of range (${silenceRatio})`));
  }

  const eye = asNumber(video.eyeContactPercent);
  const engagement = asNumber(video.engagementScore);
  const highPresence = (eye != null && eye >= 90) || (engagement != null && engagement >= 90);

  if (duration != null && duration > 0 && highPresence) {
    const avgMsPerQuestion = duration / qCount;
    if (avgMsPerQuestion < 10_000) {
      reasons.push(
        clampReason(
          'metrics_anomaly: short duration with high engagement'
        )
      );
    }
  }

  const timeline = liveVideoMetrics?.timeline || video.timeline;
  if (hasZeroVarianceTimeline(timeline)) {
    reasons.push(clampReason('metrics_anomaly: zero variance video timeline'));
  }

  // High sample count with identical engagement/eye in aggregates and behavioral block
  const sampleCount = asNumber(liveVideoMetrics?.sampleCount ?? video.sampleCount);
  if (
    sampleCount != null &&
    sampleCount >= 8 &&
    eye != null &&
    engagement != null &&
    Math.abs(eye - engagement) < 0.01 &&
    eye >= 95
  ) {
    // suspicious flat perfect scores with many samples — soft signal only if no timeline variance already flagged
    if (!reasons.some((r) => r.includes('zero variance'))) {
      reasons.push(clampReason('metrics_anomaly: static high video scores'));
    }
  }

  return [...new Set(reasons)].slice(0, 8);
};

export default evaluateClientMetricsAnomalies;

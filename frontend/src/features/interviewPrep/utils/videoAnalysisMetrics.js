/**
 * Keep in sync with backend/src/utils/videoAnalysisMetrics.js
 */

export const computeEngagementScore = (eyeContactPercent, expressionBreakdown = {}) => {
  const eye = Math.min(100, Math.max(0, Number(eyeContactPercent) || 0));

  const happy = Number(expressionBreakdown.happy) || 0;
  const neutral = Number(expressionBreakdown.neutral) || 0;
  const sad = Number(expressionBreakdown.sad) || 0;
  const fearful = Number(expressionBreakdown.fearful) || 0;

  const positiveBalance = Math.min(1, happy * 0.7 + neutral * 0.3);
  const negativeBalance = Math.min(1, sad + fearful);

  const expressionComponent = Math.round(
    positiveBalance * 100 * 0.7 + (1 - negativeBalance) * 100 * 0.3
  );
  const score = Math.round(eye * 0.55 + expressionComponent * 0.45);

  return Math.min(100, Math.max(0, score));
};

export const aggregateVideoFrameSamples = (samples = []) => {
  if (!samples.length) {
    return {
      sampleCount: 0,
      eyeContactPercent: 0,
      expressionBreakdown: {},
      engagementScore: 0,
      timeline: [],
    };
  }

  let eyeSum = 0;
  const expressionTotals = {};

  for (const sample of samples) {
    eyeSum += Number(sample.eyeContactPercent) || 0;

    const expressions = sample.expressions || {};
    for (const [key, value] of Object.entries(expressions)) {
      expressionTotals[key] = (expressionTotals[key] || 0) + Number(value);
    }
  }

  const count = samples.length;
  const eyeContactPercent = Math.round(eyeSum / count);

  const expressionBreakdown = Object.fromEntries(
    Object.entries(expressionTotals).map(([key, total]) => [
      key,
      Number((total / count).toFixed(3)),
    ])
  );

  const engagementScore = computeEngagementScore(eyeContactPercent, expressionBreakdown);

  const timeline = samples.slice(-12).map((sample, index) => ({
    t: index,
    eyeContactPercent: sample.eyeContactPercent ?? 0,
    dominantExpression: getDominantExpression(sample.expressions),
  }));

  return {
    sampleCount: count,
    eyeContactPercent,
    expressionBreakdown,
    engagementScore,
    timeline,
  };
};

export const getDominantExpression = (expressions = {}) => {
  const entries = Object.entries(expressions);
  if (!entries.length) return 'neutral';

  return entries.sort((a, b) => b[1] - a[1])[0][0];
};

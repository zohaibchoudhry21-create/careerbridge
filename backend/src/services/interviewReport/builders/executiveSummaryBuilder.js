export const buildExecutiveSummary = (narrative = {}, overallScore, hiring) => {
  const headline =
    String(narrative.headline || '').trim() ||
    (overallScore >= 80
      ? 'Strong interview performance'
      : overallScore >= 60
        ? 'Solid interview with clear growth areas'
        : 'Interview shows foundational potential with gaps');

  const summary =
    String(narrative.summary || '').trim() ||
    `Overall score ${overallScore}/100 with a ${hiring?.hiringRecommendation?.decision || 'hold'} recommendation signal.`;

  const keyTakeaways = (Array.isArray(narrative.keyTakeaways) ? narrative.keyTakeaways : [])
    .map((t) => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!keyTakeaways.length && hiring?.hiringProbability?.factors?.length) {
    keyTakeaways.push(...hiring.hiringProbability.factors.slice(0, 3));
  }

  return { headline, summary, keyTakeaways };
};

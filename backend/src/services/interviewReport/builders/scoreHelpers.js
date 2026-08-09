export const clamp100 = (n, fallback = null) => {
  if (n == null || n === '') return fallback;
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(100, Math.max(0, Math.round(v)));
};

export const avgDefined = (values) => {
  const nums = values.map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

export const dimSection = (label, score, feedback = '', evidence = []) => ({
  label,
  score: clamp100(score, null),
  feedback: String(feedback || '').trim(),
  evidence: (Array.isArray(evidence) ? evidence : []).filter(Boolean).slice(0, 6),
});

export const pickScore = (...candidates) => {
  for (const c of candidates) {
    const v = clamp100(c, null);
    if (v != null) return v;
  }
  return null;
};

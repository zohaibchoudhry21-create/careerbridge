/**
 * Shared text metrics for Diff / Quality validators.
 */

export const tokenize = (text = '') =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);

export const jaccardSimilarity = (aText, bText) => {
  const a = new Set(tokenize(aText));
  const b = new Set(tokenize(bText));
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const token of a) {
    if (b.has(token)) inter += 1;
  }
  return inter / (new Set([...a, ...b]).size || 1);
};

export const changedTokenRatio = (originalText, rewrittenText) => {
  const a = new Set(tokenize(originalText));
  const b = new Set(tokenize(rewrittenText));
  if (!a.size) return 1;
  let novel = 0;
  for (const token of b) {
    if (!a.has(token)) novel += 1;
  }
  return novel / (b.size || 1);
};

export const normalizeToken = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const containsNormalized = (haystack = '', needle = '') => {
  const h = normalizeToken(haystack);
  const n = normalizeToken(needle);
  if (!n) return true;
  return h.includes(n);
};

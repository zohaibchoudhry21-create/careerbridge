export const sanitizeResumeScannerText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\u0000/g, '')
    .trim();

export const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeSkillToken = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const createSkillId = (name, index = 0) => {
  const slug = normalizeSkillToken(name)
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return `skill-${slug || 'item'}-${index + 1}`;
};

export const createSuggestionId = (index = 0) => `suggestion-${Date.now()}-${index + 1}`;

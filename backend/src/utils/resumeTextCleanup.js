const normalizeForCompare = (text = '') => text.replace(/\s+/g, ' ').trim().toLowerCase();

const EMPTY_LABEL_PATTERN = /^(address|phone|email|e-mail|location|city|country):?$/i;
const PAGE_MARKER_PATTERN = /^--\s*\d+\s+of\s+\d+\s*--$/i;
const WATERMARK_PATTERN = /activate windows|go to settings to activate/i;

const isNoiseLine = (line = '') => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (EMPTY_LABEL_PATTERN.test(trimmed)) return true;
  if (PAGE_MARKER_PATTERN.test(trimmed)) return true;
  if (WATERMARK_PATTERN.test(trimmed)) return true;
  return false;
};

const isPageNumberOnly = (line = '') => /^\d{1,4}$/.test(line.trim());

const dedupeParagraphs = (text = '') => {
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const seen = new Set();
  const kept = [];

  for (const paragraph of paragraphs) {
    const norm = normalizeForCompare(paragraph);
    if (norm.length < 24) {
      kept.push(paragraph);
      continue;
    }
    if (seen.has(norm)) continue;
    if ([...seen].some((prev) => prev.length > norm.length + 20 && prev.includes(norm))) continue;
    seen.add(norm);
    kept.push(paragraph);
  }

  return kept.join('\n\n');
};

const removeSubstringLines = (text = '') => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return text;

  const normalized = lines.map(normalizeForCompare);

  return lines
    .filter((line, index) => {
      const norm = normalized[index];
      if (norm.length < 80) return true;
      return !normalized.some(
        (other, otherIndex) => index !== otherIndex && norm === other
      );
    })
    .join('\n');
};

export const cleanExtractedText = (text = '') => {
  let cleaned = text
    .replace(/\r/g, '\n')
    .replace(/activate windows[\s\S]*?settings[^\n]*/gi, '')
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '');

  cleaned = cleaned.replace(/(\w)-\n(\w)/g, '$1$2');

  const lines = [];
  let prevNorm = null;

  for (const rawLine of cleaned.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      lines.push('');
      prevNorm = null;
      continue;
    }

    if (isNoiseLine(line)) continue;
    if (isPageNumberOnly(line)) continue;

    const norm = normalizeForCompare(line);
    if (norm === prevNorm) continue;

    lines.push(line);
    prevNorm = norm;
  }

  cleaned = lines.join('\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = removeSubstringLines(cleaned);
  cleaned = dedupeParagraphs(cleaned);

  return cleaned.trim();
};

export const duplicatePenalty = (text = '') => {
  const paragraphs = text.split(/\n\s*\n/).map((part) => normalizeForCompare(part)).filter(Boolean);
  if (paragraphs.length === 0) return 0;
  const unique = new Set(paragraphs);
  return (paragraphs.length - unique.size) * 8;
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const SUGGESTION_CLASS = {
  missing_keyword: 'bg-amber-100 text-amber-900 border-b-2 border-amber-500',
  reword: 'bg-sky-100 text-sky-900 border-b-2 border-secondary',
  remove: 'bg-error-container text-error border-b-2 border-error',
};

export const getSkillDisplayName = (skill = {}) =>
  skill.name || skill.skillName || skill.label || skill.skill || skill.id || '';

const SECTION_HEADING_RE =
  /^(PROFESSIONAL SUMMARY|WORK EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|LANGUAGES|AWARDS|VOLUNTEER EXPERIENCE|INTERESTS|REFERENCES|SUMMARY|EXPERIENCE|CORE COMPETENCIES)$/i;

const isSectionHeadingLine = (line = '') => {
  const trimmed = String(line || '').trim();
  return Boolean(trimmed) && SECTION_HEADING_RE.test(trimmed);
};

const renderTextSegment = (segment, suggestions, segmentStart) => {
  const segmentEnd = segmentStart + segment.length;
  const active = suggestions.filter(
    (item) => item.charStart < segmentEnd && item.charEnd > segmentStart
  );

  if (!active.length) {
    return escapeHtml(segment);
  }

  let cursor = 0;
  const parts = [];

  for (const suggestion of active) {
    const start = Math.max(0, suggestion.charStart - segmentStart);
    const end = Math.min(segment.length, suggestion.charEnd - segmentStart);
    if (end <= start) continue;

    if (start > cursor) {
      parts.push(escapeHtml(segment.slice(cursor, start)));
    }

    const highlighted = segment.slice(start, end);
    const className = SUGGESTION_CLASS[suggestion.type] || SUGGESTION_CLASS.reword;
    parts.push(
      `<span contenteditable="false" class="ats-suggestion cursor-pointer rounded-sm px-0.5 ${className}" data-suggestion-id="${escapeHtml(suggestion.id)}" role="button" tabindex="0">${escapeHtml(highlighted || suggestion.original)}</span>`
    );
    cursor = end;
  }

  if (cursor < segment.length) {
    parts.push(escapeHtml(segment.slice(cursor)));
  }

  return parts.join('');
};

export const buildResumeTextFromLineMap = (lineMap = []) => {
  if (!Array.isArray(lineMap) || lineMap.length === 0) {
    return '';
  }

  return [...lineMap]
    .sort((left, right) => (left.line_number ?? 0) - (right.line_number ?? 0))
    .map((line) => (line?.text == null ? '' : String(line.text)))
    .join('\n')
    .trimEnd();
};

export const resolveResumeDisplayText = ({ resumeText = '', lineMap = [] } = {}) => {
  const fromLineMap = buildResumeTextFromLineMap(lineMap);
  if (fromLineMap) {
    return fromLineMap;
  }

  return String(resumeText || '').trimEnd();
};

export const getScoreTone = (score = 0) => {
  if (score >= 80) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
};

export const getScoreColor = (score = 0) => {
  const tone = getScoreTone(score);
  if (tone === 'good') return '#16a34a';
  if (tone === 'fair') return '#d97706';
  return '#ba1a1a';
};

export const partitionSuggestions = (suggestions = []) => {
  const pending = suggestions.filter((item) => item.status === 'pending');
  const anchored = pending.filter((item) => item.charStart >= 0 && item.charEnd > item.charStart);
  const unanchored = pending.filter((item) => item.charStart < 0 || item.charEnd <= item.charStart);

  return { pending, anchored, unanchored };
};

export const buildAnnotatedHtml = (resumeText = '', suggestions = [], lineMap = []) => {
  const text = String(resumeText || '');
  const { anchored } = partitionSuggestions(suggestions);
  const sorted = [...anchored].sort((left, right) => left.charStart - right.charStart);
  const headingLines = new Set(
    (lineMap || [])
      .filter((line) => line.section_type && line.section_type !== 'contact')
      .map((line) => String(line.text || '').trim().toLowerCase())
      .filter((line) => SECTION_HEADING_RE.test(line))
  );

  const lines = text.split('\n');
  let offset = 0;
  const parts = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineHtml = renderTextSegment(line, sorted, offset);
    const normalized = line.trim().toLowerCase();
    const isHeading = isSectionHeadingLine(line) || headingLines.has(normalized);

    if (isHeading) {
      parts.push(
        `<div class="ats-section-heading font-label-md uppercase tracking-wide text-secondary mt-3 mb-1">${lineHtml}</div>`
      );
    } else if (line.length) {
      parts.push(`<div class="ats-section-line">${lineHtml}</div>`);
    } else {
      parts.push('<div class="h-2" aria-hidden="true"></div>');
    }

    offset += line.length + 1;
  }

  if (!parts.length) {
    return renderTextSegment(text, sorted, 0).replace(/\n/g, '<br />');
  }

  return parts.join('');
};

export const extractPlainText = (element) => {
  if (!element) return '';

  const clone = element.cloneNode(true);
  clone.querySelectorAll('[data-ats-chrome="true"], .ats-suggestion-chip').forEach((node) => {
    node.remove();
  });

  return clone.innerText.replace(/\u00a0/g, ' ').trimEnd();
};

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

export const buildAnnotatedHtml = (resumeText = '', suggestions = []) => {
  const text = String(resumeText || '');
  const { anchored } = partitionSuggestions(suggestions);
  const sorted = [...anchored].sort((left, right) => left.charStart - right.charStart);

  let cursor = 0;
  const parts = [];

  for (const suggestion of sorted) {
    if (suggestion.charStart < cursor) {
      continue;
    }

    if (suggestion.charStart > cursor) {
      parts.push(escapeHtml(text.slice(cursor, suggestion.charStart)));
    }

    const highlighted = text.slice(suggestion.charStart, suggestion.charEnd);
    const className = SUGGESTION_CLASS[suggestion.type] || SUGGESTION_CLASS.reword;
    parts.push(
      `<span contenteditable="false" class="ats-suggestion cursor-pointer rounded-sm px-0.5 ${className}" data-suggestion-id="${escapeHtml(suggestion.id)}" role="button" tabindex="0">${escapeHtml(highlighted || suggestion.original)}</span>`
    );
    cursor = suggestion.charEnd;
  }

  if (cursor < text.length) {
    parts.push(escapeHtml(text.slice(cursor)));
  }

  return parts.join('').replace(/\n/g, '<br />');
};

export const extractPlainText = (element) => {
  if (!element) return '';

  const clone = element.cloneNode(true);
  clone.querySelectorAll('[data-ats-chrome="true"], .ats-suggestion-chip').forEach((node) => {
    node.remove();
  });

  return clone.innerText.replace(/\u00a0/g, ' ').trimEnd();
};

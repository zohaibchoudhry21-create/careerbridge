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

export const buildAnnotatedHtml = (resumeText = '', suggestions = []) => {
  const text = String(resumeText || '');
  const pending = suggestions.filter((item) => item.status === 'pending');

  const anchored = pending
    .filter((item) => item.charStart >= 0 && item.charEnd > item.charStart)
    .sort((a, b) => a.charStart - b.charStart);

  let cursor = 0;
  const parts = [];

  for (const suggestion of anchored) {
    if (suggestion.charStart < cursor) {
      continue;
    }

    if (suggestion.charStart > cursor) {
      parts.push(escapeHtml(text.slice(cursor, suggestion.charStart)));
    }

    const highlighted = text.slice(suggestion.charStart, suggestion.charEnd);
    const className = SUGGESTION_CLASS[suggestion.type] || SUGGESTION_CLASS.reword;
    parts.push(
      `<span class="ats-suggestion cursor-pointer rounded-sm px-0.5 ${className}" data-suggestion-id="${escapeHtml(suggestion.id)}" role="button" tabindex="0">${escapeHtml(highlighted || suggestion.original || suggestion.suggested)}</span>`
    );
    cursor = suggestion.charEnd;
  }

  if (cursor < text.length) {
    parts.push(escapeHtml(text.slice(cursor)));
  }

  const unanchored = pending.filter(
    (item) => item.charStart < 0 || item.charEnd <= item.charStart
  );

  for (const suggestion of unanchored) {
    const className = SUGGESTION_CLASS[suggestion.type] || SUGGESTION_CLASS.missing_keyword;
    const label = suggestion.suggested || suggestion.original || suggestion.reason;
    parts.push(
      `<p class="mt-2"><span class="ats-suggestion cursor-pointer rounded-sm px-1 ${className}" data-suggestion-id="${escapeHtml(suggestion.id)}" role="button" tabindex="0">${escapeHtml(label)}</span></p>`
    );
  }

  return parts.join('').replace(/\n/g, '<br />');
};

export const extractPlainText = (element) => {
  if (!element) return '';
  return element.innerText.replace(/\u00a0/g, ' ').trimEnd();
};

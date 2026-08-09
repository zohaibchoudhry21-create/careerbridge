export const getSkillDisplayName = (skill = {}) =>
  skill.name || skill.skillName || skill.label || skill.skill || skill.id || '';

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
  const anchored = pending.filter(
    (item) =>
      (item.fieldPath && item.charStart >= 0 && item.charEnd > item.charStart) ||
      (item.charStart >= 0 && item.charEnd > item.charStart)
  );
  const unanchored = pending.filter((item) => !anchored.includes(item));

  return { pending, anchored, unanchored };
};

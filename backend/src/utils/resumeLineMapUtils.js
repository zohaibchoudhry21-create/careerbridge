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

export const resolveCanonicalResumeText = ({ resumeText = '', lineMap = [] } = {}) => {
  const fromLineMap = buildResumeTextFromLineMap(lineMap);
  if (fromLineMap) {
    return fromLineMap;
  }

  return String(resumeText || '').trimEnd();
};

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
  // Prefer ATS-normalized resumeText (has intentional section newlines).
  // lineMap is only a fallback when resumeText is missing.
  const fromResume = String(resumeText || '').trimEnd();
  if (fromResume) {
    return fromResume;
  }

  return buildResumeTextFromLineMap(lineMap);
};

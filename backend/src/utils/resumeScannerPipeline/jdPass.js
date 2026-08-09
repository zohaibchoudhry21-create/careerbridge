/**
 * Pass 3 — Job Description Understanding
 * Builds a JD understanding artifact from analyze output + content signals.
 */

const TECH_TOKEN_RE =
  /\b(?:react|node\.?js|python|java|aws|azure|gcp|sql|nosql|docker|kubernetes|typescript|javascript|figma|seo|ga4|excel|sap|salesforce)\b/gi;

const splitSentences = (text = '') =>
  String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

/**
 * @param {{ jobDescriptionText: string, jobTitle?: string, skills?: array, analyzeResult?: object }}
 */
export const runJdPass = ({
  jobDescriptionText = '',
  jobTitle = '',
  skills = [],
  analyzeResult = null,
} = {}) => {
  const text = String(jobDescriptionText || '');
  const lower = text.toLowerCase();
  const sentences = splitSentences(text);

  const required = skills.filter((s) => s.type === 'required').map((s) => s.name);
  const hard = skills.filter((s) => s.type === 'hard').map((s) => s.name);
  const soft = skills.filter((s) => s.type === 'soft').map((s) => s.name);

  const responsibilityHints = sentences.filter((s) =>
    /\b(responsible|you will|duties|requirements?|must|should|experience with)\b/i.test(s)
  );

  const technologies = Array.from(
    new Set([...(text.match(TECH_TOKEN_RE) || []).map((t) => t.toLowerCase()), ...hard.map((h) => h.toLowerCase())])
  );

  let domain = 'general';
  if (/\b(nurse|patient|clinical|hospital)\b/i.test(text)) domain = 'healthcare';
  else if (/\b(chef|kitchen|culinary|restaurant)\b/i.test(text)) domain = 'hospitality';
  else if (/\b(react|software|engineer|developer|frontend|backend)\b/i.test(text)) domain = 'software';
  else if (/\b(marketing|seo|content|campaign)\b/i.test(text)) domain = 'marketing';
  else if (/\b(sales|quota|crm|account)\b/i.test(text)) domain = 'sales';

  const seniority = /\b(senior|lead|principal|staff)\b/i.test(text)
    ? 'senior'
    : /\b(junior|entry|intern)\b/i.test(text)
      ? 'junior'
      : 'mid';

  return {
    jobTitle: jobTitle || analyzeResult?.jobTitle || '',
    company: analyzeResult?.company || '',
    domain,
    seniority,
    requiredSkills: required,
    hardSkills: hard,
    softSkills: soft,
    technologies,
    atsKeywords: Array.from(new Set([...required, ...hard, ...technologies])),
    responsibilityHints: responsibilityHints.slice(0, 12),
    writingStyle: /\b(we are looking|join our|passionate)\b/i.test(lower)
      ? 'employer_branding'
      : 'direct_requirements',
    rawLength: text.length,
  };
};

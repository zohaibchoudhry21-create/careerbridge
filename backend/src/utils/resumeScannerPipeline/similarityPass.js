/**
 * Pass 4 — Resume ↔ JD Similarity Analysis
 */

import { clampScore, normalizeSkillToken } from '../resumeScannerTextUtils.js';
import { jaccardSimilarity, tokenize } from './validation/textMetrics.js';

/**
 * @param {{ understanding, facts, jd, analyzeResult }}
 */
export const runSimilarityPass = ({
  understanding = {},
  facts = {},
  jd = {},
  analyzeResult = null,
} = {}) => {
  const resumeText = String(understanding.resumeText || '');
  const jdText = [jd.jobTitle, ...(jd.atsKeywords || []), ...(jd.responsibilityHints || [])].join(
    ' '
  );

  const keywordCoverage = clampScore(analyzeResult?.jobMatchBreakdown?.keywordCoverage ?? 0);
  const aiRelevance = clampScore(
    analyzeResult?.jobMatchBreakdown?.aiAssessedRelevance ?? analyzeResult?.score ?? 0
  );
  const lexicalOverlap = clampScore(jaccardSimilarity(resumeText, jdText) * 100);
  const resumeTokens = tokenize(resumeText);

  const owned = new Set((facts.ownedTerms || []).map((t) => normalizeSkillToken(t)));
  const jdSkills = [...(jd.requiredSkills || []), ...(jd.hardSkills || [])];
  const transferable = jdSkills.filter((skill) => {
    const token = normalizeSkillToken(skill);
    if (!token) return false;
    if (owned.has(token)) return true;
    return resumeTokens.some((t) => t.includes(token) || token.includes(t));
  });

  const transferableRatio = jdSkills.length
    ? transferable.length / jdSkills.length
    : lexicalOverlap / 100;

  // Domain mismatch heuristic: JD domain keyword absent from resume
  const domain = jd.domain || 'general';
  const domainPresent =
    domain === 'general' ||
    resumeText.toLowerCase().includes(domain) ||
    (domain === 'software' && /\b(react|code|software|developer|engineer)\b/i.test(resumeText)) ||
    (domain === 'healthcare' && /\b(nurse|patient|clinical)\b/i.test(resumeText)) ||
    (domain === 'hospitality' && /\b(chef|kitchen|culinary)\b/i.test(resumeText));

  const blended = clampScore(
    keywordCoverage * 0.55 + aiRelevance * 0.25 + lexicalOverlap * 0.1 + transferableRatio * 100 * 0.1
  );

  return {
    keywordCoverage,
    aiRelevance,
    lexicalOverlap,
    transferableSkills: transferable,
    transferableRatio: clampScore(transferableRatio * 100),
    domain,
    domainAligned: domainPresent,
    overallSimilarity: blended,
    rewriteRecommended:
      blended < 40 || keywordCoverage < 25 || aiRelevance < 30 || !domainPresent,
  };
};

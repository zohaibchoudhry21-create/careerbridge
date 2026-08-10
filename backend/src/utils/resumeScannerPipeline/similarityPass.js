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

  // Dedicated field/experience fit from Analyze LLM (ignores formatting quality).
  const jobRelevanceScore = clampScore(
    analyzeResult?.jobMatchBreakdown?.jobRelevanceScore ??
      analyzeResult?.jobRelevanceScore ??
      0
  );

  // Composite quality score (structure/searchability/etc.) — kept for diagnostics only;
  // rewrite decisions must use jobRelevanceScore, not this value.
  const aiRelevance = clampScore(
    analyzeResult?.jobMatchBreakdown?.aiAssessedRelevance ?? analyzeResult?.score ?? 0
  );

  // Already-computed UI Job Match gauge from analyzeResumeAgainstJob / computeJobMatchScore.
  const jobMatchScore = clampScore(
    analyzeResult?.jobMatchScore ??
      (analyzeResult?.jobMatchUnavailable ? 0 : analyzeResult?.score) ??
      0
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
    keywordCoverage * 0.55 +
      jobRelevanceScore * 0.25 +
      lexicalOverlap * 0.1 +
      transferableRatio * 100 * 0.1
  );

  return {
    keywordCoverage,
    jobRelevanceScore,
    jobMatchScore,
    /** @deprecated Composite quality — prefer jobRelevanceScore for decisions. */
    aiRelevance,
    lexicalOverlap,
    transferableSkills: transferable,
    transferableRatio: clampScore(transferableRatio * 100),
    domain,
    domainAligned: domainPresent,
    overallSimilarity: blended,
    rewriteRecommended:
      blended < 50 ||
      keywordCoverage < 35 ||
      jobRelevanceScore < 40 ||
      jobMatchScore < 45 ||
      !domainPresent,
  };
};

import {
  hasExtractableJobSkills,
  isFieldMismatchCoverage,
} from './resumeScannerScoring.js';
import { clampScore } from './resumeScannerTextUtils.js';

/** Keyword coverage below this triggers full rewrite mode. */
export const REWRITE_KEYWORD_THRESHOLD = 25;

/** AI-assessed relevance below this triggers full rewrite mode. */
export const REWRITE_AI_RELEVANCE_THRESHOLD = 30;

/**
 * Decide whether the resume/JD pair should use full AI rewrite instead of incremental optimization.
 */
export const shouldTriggerRewriteMode = ({
  keywordCoverage = 0,
  aiAssessedRelevance = 0,
  skills = [],
}) => {
  if (!hasExtractableJobSkills(skills)) {
    return false;
  }

  const coverage = clampScore(keywordCoverage);
  const relevance = clampScore(aiAssessedRelevance);

  if (isFieldMismatchCoverage(coverage, skills)) {
    return true;
  }

  if (coverage < REWRITE_KEYWORD_THRESHOLD) {
    return true;
  }

  if (relevance < REWRITE_AI_RELEVANCE_THRESHOLD) {
    return true;
  }

  return false;
};

export const getRewriteTriggerReason = ({
  keywordCoverage = 0,
  aiAssessedRelevance = 0,
  skills = [],
}) => {
  if (!shouldTriggerRewriteMode({ keywordCoverage, aiAssessedRelevance, skills })) {
    return null;
  }

  const coverage = clampScore(keywordCoverage);
  const relevance = clampScore(aiAssessedRelevance);

  if (isFieldMismatchCoverage(coverage, skills)) {
    return 'field_mismatch';
  }

  if (coverage < REWRITE_KEYWORD_THRESHOLD) {
    return 'low_keyword_coverage';
  }

  if (relevance < REWRITE_AI_RELEVANCE_THRESHOLD) {
    return 'low_semantic_relevance';
  }

  return 'low_match';
};

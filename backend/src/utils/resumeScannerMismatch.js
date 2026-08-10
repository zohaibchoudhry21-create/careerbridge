import {
  hasExtractableJobSkills,
  isFieldMismatchCoverage,
} from './resumeScannerScoring.js';
import { clampScore } from './resumeScannerTextUtils.js';

/** Keyword coverage below this triggers full rewrite mode. */
export const REWRITE_KEYWORD_THRESHOLD = 35;

/**
 * Dedicated LLM job-field relevance below this triggers full rewrite mode.
 * Do not confuse with aiAssessedRelevance (composite quality score).
 */
export const REWRITE_JOB_RELEVANCE_THRESHOLD = 40;

/** UI Job Match gauge below this triggers full rewrite mode. */
export const REWRITE_JOB_MATCH_THRESHOLD = 45;

/** @deprecated Use REWRITE_JOB_RELEVANCE_THRESHOLD — kept for older imports/tests. */
export const REWRITE_AI_RELEVANCE_THRESHOLD = REWRITE_JOB_RELEVANCE_THRESHOLD;

/**
 * Decide whether the resume/JD pair should use full AI rewrite instead of incremental optimization.
 */
export const shouldTriggerRewriteMode = ({
  keywordCoverage = 0,
  jobRelevanceScore = 0,
  jobMatchScore = null,
  skills = [],
  /** @deprecated Ignored for job-fit — use jobRelevanceScore. */
  aiAssessedRelevance: _legacyComposite = undefined,
} = {}) => {
  if (!hasExtractableJobSkills(skills)) {
    return false;
  }

  const coverage = clampScore(keywordCoverage);
  const relevance = clampScore(jobRelevanceScore);

  if (isFieldMismatchCoverage(coverage, skills)) {
    return true;
  }

  if (coverage < REWRITE_KEYWORD_THRESHOLD) {
    return true;
  }

  if (relevance < REWRITE_JOB_RELEVANCE_THRESHOLD) {
    return true;
  }

  if (jobMatchScore != null && clampScore(jobMatchScore) < REWRITE_JOB_MATCH_THRESHOLD) {
    return true;
  }

  return false;
};

export const getRewriteTriggerReason = ({
  keywordCoverage = 0,
  jobRelevanceScore = 0,
  jobMatchScore = null,
  skills = [],
  aiAssessedRelevance: _legacyComposite = undefined,
} = {}) => {
  if (
    !shouldTriggerRewriteMode({
      keywordCoverage,
      jobRelevanceScore,
      jobMatchScore,
      skills,
    })
  ) {
    return null;
  }

  const coverage = clampScore(keywordCoverage);
  const relevance = clampScore(jobRelevanceScore);

  if (isFieldMismatchCoverage(coverage, skills)) {
    return 'field_mismatch';
  }

  if (coverage < REWRITE_KEYWORD_THRESHOLD) {
    return 'low_keyword_coverage';
  }

  if (relevance < REWRITE_JOB_RELEVANCE_THRESHOLD) {
    return 'low_job_relevance';
  }

  if (jobMatchScore != null && clampScore(jobMatchScore) < REWRITE_JOB_MATCH_THRESHOLD) {
    return 'low_job_match';
  }

  return 'low_match';
};

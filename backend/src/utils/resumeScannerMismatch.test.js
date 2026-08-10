import { describe, expect, it } from 'vitest';
import {
  getRewriteTriggerReason,
  REWRITE_JOB_MATCH_THRESHOLD,
  REWRITE_JOB_RELEVANCE_THRESHOLD,
  REWRITE_KEYWORD_THRESHOLD,
  shouldTriggerRewriteMode,
} from './resumeScannerMismatch.js';

const JD_SKILLS = [
  { id: 's-1', name: 'React', type: 'required' },
  { id: 's-2', name: 'TypeScript', type: 'hard' },
];

describe('resumeScannerMismatch', () => {
  it('triggers rewrite when keyword coverage is very low (field mismatch)', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 4,
        jobRelevanceScore: 80,
        jobMatchScore: 80,
        skills: JD_SKILLS,
      })
    ).toBe(true);
    expect(
      getRewriteTriggerReason({
        keywordCoverage: 4,
        jobRelevanceScore: 80,
        jobMatchScore: 80,
        skills: JD_SKILLS,
      })
    ).toBe('field_mismatch');
  });

  it('triggers rewrite when keyword coverage is below threshold', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: REWRITE_KEYWORD_THRESHOLD - 1,
        jobRelevanceScore: 60,
        jobMatchScore: 60,
        skills: JD_SKILLS,
      })
    ).toBe(true);
    expect(
      getRewriteTriggerReason({
        keywordCoverage: REWRITE_KEYWORD_THRESHOLD - 1,
        jobRelevanceScore: 60,
        jobMatchScore: 60,
        skills: JD_SKILLS,
      })
    ).toBe('low_keyword_coverage');
  });

  it('triggers rewrite when jobRelevanceScore is below threshold', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 40,
        jobRelevanceScore: REWRITE_JOB_RELEVANCE_THRESHOLD - 1,
        jobMatchScore: 60,
        skills: JD_SKILLS,
      })
    ).toBe(true);
    expect(
      getRewriteTriggerReason({
        keywordCoverage: 40,
        jobRelevanceScore: REWRITE_JOB_RELEVANCE_THRESHOLD - 1,
        jobMatchScore: 60,
        skills: JD_SKILLS,
      })
    ).toBe('low_job_relevance');
  });

  it('triggers rewrite when jobMatchScore is below threshold', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 50,
        jobRelevanceScore: 55,
        jobMatchScore: REWRITE_JOB_MATCH_THRESHOLD - 1,
        skills: JD_SKILLS,
      })
    ).toBe(true);
    expect(
      getRewriteTriggerReason({
        keywordCoverage: 50,
        jobRelevanceScore: 55,
        jobMatchScore: REWRITE_JOB_MATCH_THRESHOLD - 1,
        skills: JD_SKILLS,
      })
    ).toBe('low_job_match');
  });

  it('keeps optimization mode for strong matches', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 70,
        jobRelevanceScore: 75,
        jobMatchScore: 72,
        skills: JD_SKILLS,
      })
    ).toBe(false);
  });

  it('does not trigger rewrite when JD skills are unavailable', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 0,
        jobRelevanceScore: 0,
        jobMatchScore: 0,
        skills: [],
      })
    ).toBe(false);
  });

  it('ignores legacy aiAssessedRelevance composite for job-fit decisions', () => {
    // High composite quality must not prevent rewrite when jobRelevanceScore is low.
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 40,
        jobRelevanceScore: 18,
        jobMatchScore: 50,
        aiAssessedRelevance: 85,
        skills: JD_SKILLS,
      })
    ).toBe(true);
  });
});

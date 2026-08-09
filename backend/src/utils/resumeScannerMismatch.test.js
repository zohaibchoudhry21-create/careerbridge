import { describe, expect, it } from 'vitest';
import {
  getRewriteTriggerReason,
  REWRITE_AI_RELEVANCE_THRESHOLD,
  REWRITE_KEYWORD_THRESHOLD,
  shouldTriggerRewriteMode,
} from './resumeScannerMismatch.js';

const JD_SKILLS = [
  { id: 's-1', name: 'React', type: 'required' },
  { id: 's-2', name: 'TypeScript', type: 'hard' },
];

describe('resumeScannerMismatch', () => {
  it('triggers rewrite when keyword coverage is very low', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 4,
        aiAssessedRelevance: 80,
        skills: JD_SKILLS,
      })
    ).toBe(true);
    expect(getRewriteTriggerReason({ keywordCoverage: 4, aiAssessedRelevance: 80, skills: JD_SKILLS })).toBe(
      'field_mismatch'
    );
  });

  it('triggers rewrite when keyword coverage is below threshold', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: REWRITE_KEYWORD_THRESHOLD - 1,
        aiAssessedRelevance: 60,
        skills: JD_SKILLS,
      })
    ).toBe(true);
    expect(
      getRewriteTriggerReason({
        keywordCoverage: REWRITE_KEYWORD_THRESHOLD - 1,
        aiAssessedRelevance: 60,
        skills: JD_SKILLS,
      })
    ).toBe('low_keyword_coverage');
  });

  it('triggers rewrite when AI relevance is very low', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 40,
        aiAssessedRelevance: REWRITE_AI_RELEVANCE_THRESHOLD - 1,
        skills: JD_SKILLS,
      })
    ).toBe(true);
    expect(
      getRewriteTriggerReason({
        keywordCoverage: 40,
        aiAssessedRelevance: REWRITE_AI_RELEVANCE_THRESHOLD - 1,
        skills: JD_SKILLS,
      })
    ).toBe('low_semantic_relevance');
  });

  it('keeps optimization mode for strong matches', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 70,
        aiAssessedRelevance: 75,
        skills: JD_SKILLS,
      })
    ).toBe(false);
  });

  it('does not trigger rewrite when JD skills are unavailable', () => {
    expect(
      shouldTriggerRewriteMode({
        keywordCoverage: 0,
        aiAssessedRelevance: 0,
        skills: [],
      })
    ).toBe(false);
  });
});

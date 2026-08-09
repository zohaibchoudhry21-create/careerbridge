import { describe, expect, it } from 'vitest';
import { recomputeAnalysisState } from './resumeScannerAiService.js';
import {
  applySuggestionToStructured,
  generateAtsText,
  parseAtsTextToStructured,
} from './structuredResume.js';

const FIXTURE_RESUME = `Jane Doe
jane@example.com | 555-123-4567 | Austin, TX

PROFESSIONAL SUMMARY
Results-oriented SEO specialist with content marketing experience.

WORK EXPERIENCE
SEO Specialist, Acme Corp
Jan 2022 - Present
• Built dashboards
• Improved organic rankings by 40%

EDUCATION
B.S. Marketing, State University
2018 - 2022

SKILLS
SEO, React, Analytics

LANGUAGES
English, Spanish
`;

const JD_SKILLS = [
  { id: 'skill-ga4-1', name: 'GA4', type: 'required', synonyms: ['google analytics 4'] },
  { id: 'skill-seo-1', name: 'SEO', type: 'required', synonyms: ['search engine optimization'] },
  { id: 'skill-react-1', name: 'React', type: 'hard', synonyms: [] },
];

const baseState = (structured, suggestions = []) => {
  const resumeText = generateAtsText(structured);
  return recomputeAnalysisState({
    resumeText,
    structuredResume: structured,
    skills: JD_SKILLS,
    searchabilityIssues: [],
    suggestions,
    aiAssessedRelevance: 72,
  });
};

describe('resumeScanner accept cycle', () => {
  it('accepting missing_keyword never decreases atsScore or jobMatchScore', () => {
    const structured = parseAtsTextToStructured(FIXTURE_RESUME);
    const before = baseState(structured);

    const suggestion = {
      id: 's-missing-ga4',
      type: 'missing_keyword',
      fieldPath: 'workExperience.0.bullets.0',
      original: 'Built dashboards',
      suggested: 'using GA4',
      status: 'pending',
    };

    const { structured: updated, applied } = applySuggestionToStructured(structured, suggestion);
    expect(applied).toBe(true);

    const after = baseState(updated, [{ ...suggestion, status: 'accepted' }]);

    expect(after.jobMatchScore).toBeGreaterThanOrEqual(before.jobMatchScore);
    expect(after.atsScore).toBeGreaterThanOrEqual(before.atsScore);
    expect(after.matchedSkillIds).toContain('skill-ga4-1');
  });

  it('reword with bullet-marker original preserves field content and does not drop scores', () => {
    const structured = parseAtsTextToStructured(FIXTURE_RESUME);
    const before = baseState(structured);

    const suggestion = {
      id: 's-reword',
      type: 'reword',
      fieldPath: 'workExperience.0.bullets.0',
      original: '• Built dashboards',
      suggested: 'Built GA4 dashboards tracking 50K monthly sessions',
      status: 'pending',
    };

    const { structured: updated, applied } = applySuggestionToStructured(structured, suggestion);
    expect(applied).toBe(true);
    expect(updated.workExperience[0].bullets[0]).toContain('GA4');
    expect(updated.workExperience[0].bullets[0]).not.toBe('');

    const after = baseState(updated, [{ ...suggestion, status: 'accepted' }]);
    expect(after.jobMatchScore).toBeGreaterThanOrEqual(before.jobMatchScore);
    expect(after.atsScore).toBeGreaterThanOrEqual(before.atsScore);
  });

  it('mismatched remove marks unappliable without blanking structured field', () => {
    const structured = parseAtsTextToStructured(FIXTURE_RESUME);
    const originalBullet = structured.workExperience[0].bullets[0];

    const { structured: updated, applied, reason } = applySuggestionToStructured(structured, {
      type: 'remove',
      fieldPath: 'workExperience.0.bullets.0',
      original: '• Text that user already edited away',
    });

    expect(applied).toBe(false);
    expect(reason).toBe('original_not_found_in_field');
    expect(updated.workExperience[0].bullets[0]).toBe(originalBullet);
  });

  it('matchedSkillIds only shrink when keyword is genuinely removed by user edit', () => {
    const structured = parseAtsTextToStructured(FIXTURE_RESUME);
    const withGa4 = applySuggestionToStructured(structured, {
      type: 'missing_keyword',
      fieldPath: 'workExperience.0.bullets.0',
      original: 'Built dashboards',
      suggested: 'GA4',
    }).structured;

    const withKeyword = baseState(withGa4);
    expect(withKeyword.matchedSkillIds).toContain('skill-ga4-1');

    const edited = parseAtsTextToStructured(
      generateAtsText(withGa4).replace(/GA4/gi, 'reporting tools')
    );
    const afterEdit = baseState(edited);
    expect(afterEdit.matchedSkillIds).not.toContain('skill-ga4-1');
  });
});

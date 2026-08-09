import { describe, expect, it } from 'vitest';
import {
  buildValidationFailureFeedback,
  MAX_REWRITE_VALIDATION_ATTEMPTS,
  shouldRetryValidation,
} from './retryStrategy.js';
import { validateAts } from './atsValidation.js';
import { validateDiff } from './diffValidation.js';
import { validateQuality } from './qualityValidation.js';
import { runValidationPipeline } from './validationService.js';

describe('validation retry strategy', () => {
  it('retries while attempts remain', () => {
    const failed = { valid: false, hardFailures: ['diff'] };
    expect(shouldRetryValidation(failed, 0)).toBe(true);
    expect(shouldRetryValidation(failed, MAX_REWRITE_VALIDATION_ATTEMPTS - 1)).toBe(false);
    expect(shouldRetryValidation({ valid: true }, 0)).toBe(false);
  });

  it('builds actionable failure feedback for regen prompts', () => {
    const feedback = buildValidationFailureFeedback({
      valid: false,
      hardFailures: ['facts', 'diff'],
      details: {
        facts: { violations: [{ field: 'company', value: 'Grand Hotel' }] },
        diff: { issues: ['rewrite_too_similar'], similarity: 95, novelty: 5 },
        ats: { issues: [] },
        quality: { issues: [] },
        structure: { missing: [] },
      },
    });

    expect(feedback).toBeTruthy();
    expect(feedback.attemptHint).toMatch(/Grand Hotel/);
    expect(feedback.attemptHint).toMatch(/rewrite_too_similar/);
    expect(feedback.hardFailures).toContain('facts');
  });
});

describe('single-responsibility validators', () => {
  it('ATS fails without core content', () => {
    const result = validateAts(
      {
        name: 'X',
        contact: {},
        summary: '',
        workExperience: [],
        education: [],
        skills: [],
      },
      'X'
    );
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('missing_core_content');
  });

  it('diff fails on superficial edits; quality fails on tiny text', () => {
    const original =
      'Directed marketing programs across SEO content analytics and campaign operations with measurable growth outcomes.';
    expect(
      validateDiff(original, `${original} tools`).valid
    ).toBe(false);
    expect(validateQuality(original, 'hi there').valid).toBe(false);
  });

  it('pipeline returns structured gate details', () => {
    const result = runValidationPipeline({
      understanding: {
        resumeText: 'Jane Doe jane@x.com SUMMARY Leader EXPERIENCE Acme 2020 Engineer SKILLS React',
        nodes: [{ id: '1', type: 'summary', heading: 'SUMMARY', editable: true }],
        structured: {
          name: 'Jane Doe',
          contact: { email: 'jane@x.com', phone: '', address: '' },
          summary: 'Leader',
          workExperience: [
            { title: 'Engineer', company: 'Acme', duration: '2020', bullets: ['Built'] },
          ],
          education: [],
          skills: ['React'],
          projects: [],
          certifications: [],
          achievements: [],
          languages: [],
          additionalSections: [],
          sectionOrder: [{ type: 'summary', heading: 'SUMMARY' }],
        },
      },
      facts: {
        identity: { name: 'Jane Doe', email: 'jane@x.com' },
        entities: ['Acme'],
        dates: ['2020'],
      },
      originalStructured: {
        name: 'Jane Doe',
        contact: { email: 'jane@x.com', phone: '', address: '' },
        summary: 'Leader',
        workExperience: [
          { title: 'Engineer', company: 'Acme', duration: '2020', bullets: ['Built'] },
        ],
        education: [],
        skills: ['React'],
        projects: [],
        certifications: [],
        achievements: [],
        languages: [],
        additionalSections: [],
        sectionOrder: [{ type: 'summary', heading: 'SUMMARY' }],
      },
      rewriteRaw: {
        name: 'Jane Doe',
        contact: { email: 'jane@x.com', phone: '', address: '' },
        sections: [
          { type: 'summary', heading: 'SUMMARY', text: 'Leader' },
          {
            type: 'experience',
            heading: 'EXPERIENCE',
            entries: [
              { title: 'Engineer', company: 'Acme', duration: '2020', bullets: ['Built'] },
            ],
          },
          { type: 'skills', heading: 'SKILLS', items: ['React'] },
        ],
      },
    });

    expect(result.details.facts).toBeDefined();
    expect(result.details.structure).toBeDefined();
    expect(result.details.ats).toBeDefined();
    expect(result.details.quality).toBeDefined();
    expect(result.details.diff).toBeDefined();
    // Near-copy / shallow rewrite must fail at least one content gate
    expect(result.valid).toBe(false);
    expect(
      result.hardFailures.some((f) => f === 'diff' || f === 'quality')
    ).toBe(true);
  });
});

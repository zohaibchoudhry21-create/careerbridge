import { describe, expect, it } from 'vitest';
import { parseResumeRewriteOutput } from './resumeScannerRewriteSchemas.js';
import {
  ensureAllDetectedSectionsRewritten,
  extractFactualAnchors,
  normalizeRewrittenResume,
  validateRewritePreservesFacts,
} from './resumeScannerRewriteValidation.js';
import {
  buildStructuredResumeFromDetected,
  detectResumeSections,
} from './resumeScannerSectionDetect.js';

const structured = {
  name: 'Jane Chef',
  contact: { email: 'jane@example.com', phone: '555-0100', address: '' },
  summary: 'Executive chef with 10 years of culinary leadership.',
  workExperience: [
    {
      title: 'Executive Chef',
      company: 'Grand Hotel',
      duration: '2018 - Present',
      bullets: ['Managed kitchen staff of 15', 'Reduced food waste by 20%'],
    },
  ],
  education: [
    {
      degree: 'Culinary Arts Diploma',
      institution: 'City College',
      duration: '2014 - 2016',
    },
  ],
  skills: ['Menu planning', 'Team leadership'],
  projects: [],
  certifications: ['ServSafe'],
  achievements: ['Reduced waste 20%'],
  languages: ['English'],
  additionalSections: [
    {
      type: 'publications',
      heading: 'PUBLICATIONS',
      paragraphs: ['Kitchen Efficiency Study, Food Journal 2020'],
    },
  ],
  sectionOrder: [
    { type: 'summary', heading: 'PROFESSIONAL SUMMARY' },
    { type: 'experience', heading: 'WORK EXPERIENCE' },
    { type: 'education', heading: 'EDUCATION' },
    { type: 'skills', heading: 'SKILLS' },
    { type: 'certifications', heading: 'CERTIFICATIONS' },
    { type: 'achievements', heading: 'ACHIEVEMENTS' },
    { type: 'languages', heading: 'LANGUAGES' },
    { type: 'publications', heading: 'PUBLICATIONS' },
  ],
};

describe('resumeScannerRewriteValidation', () => {
  it('extracts factual anchors from structured resume', () => {
    const anchors = extractFactualAnchors(structured);

    expect(anchors.companies).toContain('Grand Hotel');
    expect(anchors.titles).toContain('Executive Chef');
    expect(anchors.institutions).toContain('City College');
    expect(anchors.contactEmail).toBe('jane@example.com');
    expect(anchors.additionalHeadings).toContain('PUBLICATIONS');
  });

  it('validates rewrite preserves companies and titles', () => {
    const rewritten = {
      ...structured,
      summary: 'Operations leader with culinary expertise transferable to cross-functional teams.',
      workExperience: [
        {
          title: 'Executive Chef',
          company: 'Grand Hotel',
          duration: '2018 - Present',
          bullets: [
            'Led cross-functional kitchen team of 15, applying agile coordination and quality systems.',
          ],
        },
      ],
    };

    const result = validateRewritePreservesFacts(structured, null, rewritten);
    expect(result.valid).toBe(true);
  });

  it('flags rewrite that drops original employers', () => {
    const rewritten = {
      ...structured,
      workExperience: [
        {
          title: 'Software Engineer',
          company: 'Tech Corp',
          duration: '2018 - Present',
          bullets: ['Built React dashboards'],
        },
      ],
    };

    const result = validateRewritePreservesFacts(structured, null, rewritten);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.field === 'company')).toBe(true);
  });

  it('parses dynamic sections rewrite schema', () => {
    const parsed = parseResumeRewriteOutput({
      name: 'Jane Chef',
      contact: { email: 'jane@example.com', phone: '', address: '' },
      sections: [
        {
          id: 'sec-1',
          type: 'summary',
          heading: 'PROFESSIONAL SUMMARY',
          text: 'Rewritten summary',
        },
        {
          id: 'sec-2',
          type: 'skills',
          heading: 'SKILLS',
          items: ['Leadership'],
        },
        {
          id: 'sec-3',
          type: 'publications',
          heading: 'PUBLICATIONS',
          paragraphs: ['Kitchen Efficiency Study, Food Journal 2020'],
        },
      ],
      rewriteNotes: ['Rewrote all detected sections'],
    });

    expect(parsed.sections).toHaveLength(3);
    expect(parsed.sections[2].type).toBe('publications');
  });

  it('normalizes dynamic sections into structuredResume', () => {
    const normalized = normalizeRewrittenResume({
      name: 'Jane Chef',
      contact: { email: 'jane@example.com', phone: '', address: '' },
      sections: [
        { type: 'summary', heading: 'PROFESSIONAL SUMMARY', text: 'New summary' },
        {
          type: 'experience',
          heading: 'WORK EXPERIENCE',
          entries: [
            {
              title: 'Executive Chef',
              company: 'Grand Hotel',
              duration: '2018 - Present',
              bullets: ['Rewritten bullet'],
            },
          ],
        },
        {
          type: 'publications',
          heading: 'PUBLICATIONS',
          paragraphs: ['Kitchen Efficiency Study, Food Journal 2020'],
        },
      ],
    });

    expect(normalized.summary).toBe('New summary');
    expect(normalized.workExperience[0].company).toBe('Grand Hotel');
    expect(normalized.additionalSections[0].type).toBe('publications');
  });

  it('restores skipped detected sections from original', () => {
    const rich = buildStructuredResumeFromDetected(
      detectResumeSections(`Name
n@e.com

SUMMARY
Hello

SKILLS
Cooking

PUBLICATIONS
Paper One
`)
    );

    const incomplete = {
      ...rich,
      additionalSections: [],
      sectionOrder: [
        { type: 'summary', heading: 'SUMMARY' },
        { type: 'skills', heading: 'SKILLS' },
      ],
    };

    const ensured = ensureAllDetectedSectionsRewritten(rich, incomplete);
    expect(ensured.additionalSections.some((s) => s.type === 'publications')).toBe(true);
  });
});

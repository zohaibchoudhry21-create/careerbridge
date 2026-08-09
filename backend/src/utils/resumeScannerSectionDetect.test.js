import { describe, expect, it } from 'vitest';
import {
  buildStructuredResumeFromDetected,
  buildStructuredResumeFromRewrittenSections,
  detectResumeSections,
  matchKnownSectionHeading,
  structuredResumeToRewriteSections,
} from './resumeScannerSectionDetect.js';

const RICH_RESUME = `Alex Candidate
alex@example.com | 555-0100

PROFESSIONAL SUMMARY
Experienced chef seeking new challenges.

WORK EXPERIENCE
Executive Chef, Grand Hotel
2018 - Present
• Led kitchen team of 15

EDUCATION
Culinary Diploma, City College
2014 - 2016

SKILLS
Menu planning, Leadership

PROJECTS
Seasonal Menu Revamp
Redesigned tasting menu for hotel restaurant

CERTIFICATIONS
ServSafe Manager

ACHIEVEMENTS
• Reduced food waste by 20%

LANGUAGES
English, French

PUBLICATIONS
Kitchen Efficiency Study, Food Journal 2020

VOLUNTEER EXPERIENCE
Soup Kitchen Lead, Community Pantry
2019 - 2021
`;

describe('resumeScannerSectionDetect', () => {
  it('matches known section headings', () => {
    expect(matchKnownSectionHeading('PROFESSIONAL SUMMARY')?.type).toBe('summary');
    expect(matchKnownSectionHeading('Work Experience')?.type).toBe('experience');
    expect(matchKnownSectionHeading('PUBLICATIONS')?.type).toBe('publications');
    expect(matchKnownSectionHeading('Volunteer Experience')?.type).toBe('volunteer');
  });

  it('detects every section present in resume text', () => {
    const detected = detectResumeSections(RICH_RESUME);
    const types = detected.sections.map((s) => s.type);

    expect(types).toEqual(
      expect.arrayContaining([
        'summary',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'achievements',
        'languages',
        'publications',
        'volunteer',
      ])
    );
    expect(detected.sections.length).toBeGreaterThanOrEqual(10);
    expect(detected.name).toContain('Alex');
    expect(detected.contact.email).toBe('alex@example.com');
  });

  it('maps detected sections into structuredResume including additionalSections', () => {
    const detected = detectResumeSections(RICH_RESUME);
    const structured = buildStructuredResumeFromDetected(detected);

    expect(structured.summary).toMatch(/chef/i);
    expect(structured.workExperience[0].company).toBe('Grand Hotel');
    expect(structured.projects[0].name).toMatch(/Seasonal Menu/i);
    expect(structured.certifications).toContain('ServSafe Manager');
    expect(structured.achievements.some((a) => /waste/i.test(a))).toBe(true);
    expect(structured.additionalSections.some((s) => s.type === 'publications')).toBe(true);
    expect(structured.additionalSections.some((s) => s.type === 'volunteer')).toBe(true);
    expect(structured.sectionOrder.length).toBe(detected.sections.length);
  });

  it('builds rewrite section list only for sections that exist', () => {
    const detected = detectResumeSections(RICH_RESUME);
    const structured = buildStructuredResumeFromDetected(detected);
    const payload = structuredResumeToRewriteSections(structured);

    expect(payload.sections.every((s) => s.type && s.heading)).toBe(true);
    expect(payload.sections.find((s) => s.type === 'experience')?.entries?.length).toBe(1);
    expect(payload.sections.find((s) => s.type === 'publications')).toBeTruthy();
  });

  it('round-trips rewritten sections without inventing new ones', () => {
    const original = buildStructuredResumeFromDetected(detectResumeSections(RICH_RESUME));
    const payload = structuredResumeToRewriteSections(original);
    const rewritten = buildStructuredResumeFromRewrittenSections({
      name: payload.name,
      contact: payload.contact,
      sections: payload.sections.map((section) => {
        if (section.type === 'summary') {
          return { ...section, text: 'Rewritten summary aligned to target role.' };
        }
        if (section.type === 'skills') {
          return { ...section, items: ['Leadership', 'Menu planning', 'Cross-functional coordination'] };
        }
        return section;
      }),
    });

    expect(rewritten.summary).toMatch(/Rewritten summary/);
    expect(rewritten.workExperience[0].company).toBe('Grand Hotel');
    expect(rewritten.additionalSections.length).toBe(original.additionalSections.length);
    expect(rewritten.sectionOrder.map((s) => s.type).sort()).toEqual(
      original.sectionOrder.map((s) => s.type).sort()
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  applySuggestionToStructured,
  generateAtsText,
  getFieldByPath,
  parseAtsTextToStructured,
  setFieldByPath,
  structuredResumeToSections,
} from './structuredResume.js';

const SAMPLE = `Jane Doe
jane@example.com | 555-123-4567 | Austin, TX

PROFESSIONAL SUMMARY
Results-oriented SEO specialist.

WORK EXPERIENCE
SEO Specialist, Acme Corp
Jan 2022 - Present
• Built dashboards
• Improved rankings

EDUCATION
B.S. Marketing, State University
2018 - 2022

SKILLS
SEO, React, Analytics

LANGUAGES
English, Spanish
`;

describe('structuredResume', () => {
  it('parses ATS text into structured fields', () => {
    const structured = parseAtsTextToStructured(SAMPLE);

    expect(structured.name).toBe('Jane Doe');
    expect(structured.contact.email).toBe('jane@example.com');
    expect(structured.summary).toContain('SEO specialist');
    expect(structured.workExperience[0].title).toContain('SEO Specialist');
    expect(structured.workExperience[0].bullets.length).toBeGreaterThanOrEqual(2);
    expect(structured.education[0].degree).toContain('Marketing');
    expect(structured.skills).toEqual(expect.arrayContaining(['SEO', 'React', 'Analytics']));
    expect(structured.languages).toEqual(expect.arrayContaining(['English', 'Spanish']));
  });

  it('round-trips through generateAtsText', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const text = generateAtsText(structured);

    expect(text).toContain('PROFESSIONAL SUMMARY');
    expect(text).toContain('WORK EXPERIENCE');
    expect(text).toContain('EDUCATION');
    expect(text).toContain('SKILLS');
    expect(text).toContain('Jane Doe');
  });

  it('updates a nested field path immutably', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const next = setFieldByPath(structured, 'workExperience.0.bullets.0', 'Rebuilt analytics dashboards');

    expect(getFieldByPath(next, 'workExperience.0.bullets.0')).toBe('Rebuilt analytics dashboards');
    expect(getFieldByPath(structured, 'workExperience.0.bullets.0')).not.toBe(
      'Rebuilt analytics dashboards'
    );
  });

  it('applies suggestion via fieldPath', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const { structured: updated, applied } = applySuggestionToStructured(structured, {
      type: 'reword',
      fieldPath: 'workExperience.0.bullets.0',
      original: 'Built dashboards',
      suggested: 'Built SEO dashboards in GA4',
    });

    expect(applied).toBe(true);
    expect(updated.workExperience[0].bullets[0]).toContain('GA4');
  });

  it('applies reword when AI original includes bullet marker but structured field omits it', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const { structured: updated, applied } = applySuggestionToStructured(structured, {
      type: 'reword',
      fieldPath: 'workExperience.0.bullets.0',
      original: '• Built dashboards',
      suggested: 'Built SEO dashboards in GA4',
    });

    expect(applied).toBe(true);
    expect(updated.workExperience[0].bullets[0]).toContain('GA4');
    expect(updated.workExperience[0].bullets[0]).not.toContain('Built dashboards');
  });

  it('mismatched remove leaves structured resume unchanged (byte-stable fields)', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const beforeJson = JSON.stringify(structured);

    const { structured: updated, applied } = applySuggestionToStructured(structured, {
      type: 'remove',
      fieldPath: 'workExperience.0.bullets.0',
      original: '• Completely unrelated text',
    });

    expect(applied).toBe(false);
    expect(JSON.stringify(updated)).toBe(beforeJson);
  });

  it('rejects forbidden path keys', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const { applied, reason } = applySuggestionToStructured(structured, {
      type: 'reword',
      fieldPath: '__proto__.polluted',
      original: 'test',
      suggested: 'hack',
    });

    expect(applied).toBe(false);
    expect(reason).toBe('forbidden_field_path');
  });

  it('appends missing_keyword to summary when path is missing', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const { structured: updated, applied } = applySuggestionToStructured(structured, {
      type: 'missing_keyword',
      fieldPath: '',
      suggested: 'Pipefitting',
    });

    expect(applied).toBe(true);
    expect(updated.summary).toContain('Pipefitting');
  });

  it('does not duplicate missing_keyword on second apply', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const first = applySuggestionToStructured(structured, {
      type: 'missing_keyword',
      fieldPath: 'summary',
      suggested: 'Pipefitting',
    });
    const second = applySuggestionToStructured(first.structured, {
      type: 'missing_keyword',
      fieldPath: 'summary',
      suggested: 'Pipefitting',
    });

    expect(second.applied).toBe(true);
    expect(second.structured.summary.match(/Pipefitting/g)?.length).toBe(1);
  });

  it('rejects out-of-bounds array fieldPath without creating sparse slots', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    expect(setFieldByPath(structured, 'skills.99', 'Welding')).toBeNull();

    const { applied, reason, structured: updated } = applySuggestionToStructured(structured, {
      type: 'reword',
      fieldPath: 'skills.99',
      original: 'SEO',
      suggested: 'Welding',
    });

    expect(applied).toBe(false);
    expect(reason).toBe('field_path_out_of_bounds');
    expect(updated.skills.length).toBe(structured.skills.length);
    expect(updated.skills.includes(undefined)).toBe(false);
  });

  it('falls back missing_keyword to summary when fieldPath is out of bounds', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const { structured: updated, applied } = applySuggestionToStructured(structured, {
      type: 'missing_keyword',
      fieldPath: 'skills.99',
      suggested: 'Soldering',
    });

    expect(applied).toBe(true);
    expect(updated.summary).toContain('Soldering');
    expect(updated.skills.length).toBe(structured.skills.length);
  });

  it('maps structured resume to preview sections', () => {
    const structured = parseAtsTextToStructured(SAMPLE);
    const sections = structuredResumeToSections(structured);

    expect(sections.contact.name).toBe('Jane Doe');
    expect(sections.summary.text).toContain('SEO');
    expect(sections.skills.items).toEqual(expect.arrayContaining(['SEO']));
  });
});

import { describe, expect, it } from 'vitest';
import {
  generateAtsText,
  structuredResumeToSections,
  updateField,
} from './structuredResumeUtils.js';

describe('structuredResumeUtils (frontend)', () => {
  it('updateField changes only the targeted path', () => {
    const base = {
      name: 'Ada',
      contact: { address: '', phone: '', email: 'a@b.com' },
      summary: 'Original',
      workExperience: [{ title: 'Eng', company: 'X', duration: '', bullets: ['Did things'] }],
      education: [],
      skills: ['React'],
      languages: [],
    };

    const next = updateField(base, 'workExperience.0.bullets.0', 'Shipped features');
    expect(next.workExperience[0].bullets[0]).toBe('Shipped features');
    expect(next.summary).toBe('Original');
    expect(base.workExperience[0].bullets[0]).toBe('Did things');
  });

  it('generateAtsText includes canonical headings', () => {
    const text = generateAtsText({
      name: 'Ada',
      contact: { email: 'a@b.com', phone: '', address: '' },
      summary: 'Builder',
      workExperience: [],
      education: [],
      skills: ['JS'],
      languages: [],
    });
    expect(text).toContain('PROFESSIONAL SUMMARY');
    expect(text).toContain('SKILLS');
  });

  it('structuredResumeToSections feeds preview shape', () => {
    const sections = structuredResumeToSections({
      name: 'Ada',
      contact: { email: 'a@b.com', phone: '', address: '' },
      summary: 'Builder',
      workExperience: [],
      education: [],
      skills: ['JS'],
      languages: [],
    });
    expect(sections.contact.name).toBe('Ada');
    expect(sections.skills.items).toContain('JS');
  });
});

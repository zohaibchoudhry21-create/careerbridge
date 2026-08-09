import { describe, expect, it } from 'vitest';
import {
  buildPdfFilename,
  generatePdfFromStructuredResume,
} from './pdfService.js';
import { canDownloadPdf } from './finalizeService.js';

const SAMPLE = {
  name: 'Jane Doe',
  contact: { email: 'jane@example.com', phone: '555-0100', address: 'Austin, TX' },
  summary: 'Results-oriented marketer with SEO experience.',
  workExperience: [
    {
      title: 'SEO Specialist',
      company: 'Acme Corp',
      duration: '2022 - Present',
      bullets: ['Improved organic traffic by 40%'],
    },
  ],
  education: [
    { degree: 'B.S. Marketing', institution: 'State University', duration: '2018 - 2022' },
  ],
  skills: ['SEO', 'Analytics'],
  projects: [],
  certifications: [],
  achievements: [],
  languages: ['English'],
  additionalSections: [],
  sectionOrder: [
    { type: 'summary', heading: 'SUMMARY' },
    { type: 'experience', heading: 'EXPERIENCE' },
    { type: 'education', heading: 'EDUCATION' },
    { type: 'skills', heading: 'SKILLS' },
  ],
};

describe('pdfService', () => {
  it('generates a PDF buffer from structured resume only', async () => {
    const buffer = await generatePdfFromStructuredResume(SAMPLE);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('builds a safe filename', () => {
    expect(buildPdfFilename(SAMPLE, 'abcdef123456')).toMatch(/Jane-Doe-.*\.pdf$/i);
  });
});

describe('canDownloadPdf gate', () => {
  it('allows download only when finalized snapshot exists', () => {
    expect(
      canDownloadPdf({
        status: 'completed',
        rewriteStatus: 'none',
        finalizedAt: new Date(),
        finalizedStructuredResume: SAMPLE,
      })
    ).toBe(true);

    expect(
      canDownloadPdf({
        status: 'completed',
        rewriteStatus: 'none',
        finalizedAt: null,
        finalizedStructuredResume: SAMPLE,
      })
    ).toBe(false);

    expect(
      canDownloadPdf({
        status: 'completed',
        rewriteStatus: 'pending_review',
        finalizedAt: new Date(),
        finalizedStructuredResume: SAMPLE,
      })
    ).toBe(false);
  });
});

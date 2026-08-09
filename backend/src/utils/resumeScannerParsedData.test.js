import { describe, expect, it } from 'vitest';
import {
  normalizeParsedData,
  parsedDataToStructuredResume,
  structuredResumeToParsedData,
} from './resumeScannerParsedData.js';

describe('resumeScannerParsedData', () => {
  it('maps structured resume to Resume Builder parsedData shape', () => {
    const structured = {
      name: 'Jane Doe',
      contact: { email: 'jane@example.com', phone: '555', address: 'TX' },
      summary: 'SEO specialist',
      workExperience: [
        {
          title: 'SEO Specialist',
          company: 'Acme',
          duration: 'Jan 2022 - Present',
          bullets: ['Built dashboards', 'Improved rankings'],
        },
      ],
      education: [{ degree: 'B.S. Marketing', institution: 'State U', duration: '2018 - 2022' }],
      skills: ['SEO', 'React'],
      languages: ['English'],
    };

    const parsed = structuredResumeToParsedData(structured);

    expect(parsed.fullName).toBe('Jane Doe');
    expect(parsed.email).toBe('jane@example.com');
    expect(parsed.experience[0]).toMatchObject({
      position: 'SEO Specialist',
      company: 'Acme',
      startDate: 'Jan 2022',
      endDate: 'Present',
      description: 'Built dashboards\nImproved rankings',
      isCurrent: true,
    });
    expect(parsed.education[0]).toMatchObject({
      degree: 'B.S. Marketing',
      institution: 'State U',
      fieldOfStudy: '',
      gpa: '',
    });
    expect(parsed.projects).toEqual([]);
    expect(parsed.certifications).toEqual([]);
    expect(parsed.linkedinLink).toBe('');
  });

  it('preserves builder-only fields across structured sync', () => {
    const structured = {
      name: 'Jane',
      contact: { email: 'a@b.com', phone: '', address: '' },
      summary: '',
      workExperience: [],
      education: [{ degree: 'BS', institution: 'U', duration: '2020 - 2024' }],
      skills: [],
      languages: [],
    };
    const previous = normalizeParsedData({
      linkedinLink: 'https://linkedin.com/in/jane',
      githubLink: 'https://github.com/jane',
      projects: [{ name: 'App', description: 'Demo', technologies: ['React'] }],
      certifications: ['AWS'],
      education: [{ fieldOfStudy: 'CS', gpa: '3.8' }],
    });

    const parsed = structuredResumeToParsedData(structured, previous);
    expect(parsed.linkedinLink).toContain('linkedin');
    expect(parsed.githubLink).toContain('github');
    expect(parsed.projects[0].name).toBe('App');
    expect(parsed.certifications).toContain('AWS');
    expect(parsed.education[0].fieldOfStudy).toBe('CS');
    expect(parsed.education[0].gpa).toBe('3.8');
  });

  it('round-trips parsedData into structuredResume for ATS scoring', () => {
    const parsed = normalizeParsedData({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      experience: [
        {
          position: 'Engineer',
          company: 'Acme',
          startDate: '2020',
          endDate: '2022',
          description: 'Built APIs\nShipped features',
        },
      ],
      skills: ['React'],
      projects: [{ name: 'Side', description: 'Fun' }],
    });

    const structured = parsedDataToStructuredResume(parsed);
    expect(structured.name).toBe('Jane Doe');
    expect(structured.workExperience[0].title).toBe('Engineer');
    expect(structured.workExperience[0].bullets).toEqual(['Built APIs', 'Shipped features']);
    expect(structured.skills).toContain('React');
  });
});

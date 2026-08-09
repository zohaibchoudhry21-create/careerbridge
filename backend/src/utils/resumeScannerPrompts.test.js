import { describe, expect, it } from 'vitest';
import { buildResumeScannerPrompt, RESUME_SCANNER_SYSTEM_PROMPT } from './resumeScannerPrompts.js';

describe('resumeScannerPrompts', () => {
  it('includes semantic matching and anti-hallucination rules in system prompt', () => {
    expect(RESUME_SCANNER_SYSTEM_PROMPT).toMatch(/synonym/i);
    expect(RESUME_SCANNER_SYSTEM_PROMPT).toMatch(/Never invent/i);
    expect(RESUME_SCANNER_SYSTEM_PROMPT).toMatch(/Recommendation:/);
  });

  it('builds user prompt with resume, job description, and optional job title', () => {
    const prompt = buildResumeScannerPrompt({
      resumeText: 'Jane Doe\nReact developer',
      jobDescriptionText: 'Need React and TypeScript',
      jobTitle: 'Frontend Engineer',
    });

    expect(prompt).toContain('Frontend Engineer');
    expect(prompt).toContain('Jane Doe');
    expect(prompt).toContain('Need React and TypeScript');
    expect(prompt).toContain('"recruiterTips"');
  });

  it('includes bullet-marker guidance for suggestion originals', () => {
    expect(RESUME_SCANNER_SYSTEM_PROMPT).toMatch(/WITHOUT bullet markers/i);
  });

  it('omits job title block when title is empty', () => {
    const prompt = buildResumeScannerPrompt({
      resumeText: 'Resume body',
      jobDescriptionText: 'JD body',
      jobTitle: '',
    });

    expect(prompt).not.toContain('Job title:');
    expect(prompt).toContain('Job description:');
  });
});

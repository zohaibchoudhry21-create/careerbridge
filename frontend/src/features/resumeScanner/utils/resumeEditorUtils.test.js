import { describe, expect, it } from 'vitest';
import {
  buildAnnotatedHtml,
  buildResumeTextFromLineMap,
  getSkillDisplayName,
  partitionSuggestions,
  resolveResumeDisplayText,
} from './resumeEditorUtils.js';

describe('resumeEditorUtils', () => {
  const lineMap = [
    { line_number: 1, text: 'Jane Doe', char_start: 0, char_end: 8 },
    { line_number: 2, text: 'jane@example.com', char_start: 9, char_end: 25 },
    { line_number: 3, text: 'SUMMARY', char_start: 26, char_end: 33 },
    { line_number: 4, text: 'Marketing specialist', char_start: 34, char_end: 54 },
    { line_number: 5, text: 'EXPERIENCE', char_start: 55, char_end: 65 },
    { line_number: 6, text: 'Led SEO campaigns', char_start: 66, char_end: 83 },
  ];

  it('builds resume text from ordered line map', () => {
    const shuffled = [...lineMap].reverse();
    expect(buildResumeTextFromLineMap(shuffled)).toBe(
      'Jane Doe\njane@example.com\nSUMMARY\nMarketing specialist\nEXPERIENCE\nLed SEO campaigns'
    );
  });

  it('prefers line map over resume text for display', () => {
    const scrambledText = 'SUMMARY\nEXPERIENCE\nJane Doe';
    expect(
      resolveResumeDisplayText({
        resumeText: scrambledText,
        lineMap,
      })
    ).toBe(buildResumeTextFromLineMap(lineMap));
  });

  it('does not inject suggested rewrites into annotated html', () => {
    const resumeText = 'Led SEO campaigns';
    const html = buildAnnotatedHtml(resumeText, [
      {
        id: 'suggestion-1',
        type: 'reword',
        status: 'pending',
        original: 'Led SEO campaigns',
        suggested: 'SEO Specialist with 6+ months of experience focused on off-page SEO',
        charStart: -1,
        charEnd: -1,
      },
    ]);

    expect(html).not.toContain('6+ months');
    expect(html).toContain('Led SEO campaigns');
  });

  it('styles section headings when line map marks them', () => {
    const resumeText = buildResumeTextFromLineMap(lineMap);
    const html = buildAnnotatedHtml(resumeText, [], lineMap);

    expect(html).toContain('ats-section-heading');
    expect(html).toContain('SUMMARY');
    expect(html).toContain('EXPERIENCE');
  });

  it('highlights anchored suggestions without suggested text leakage', () => {
    const resumeText = 'Led SEO campaigns';
    const html = buildAnnotatedHtml(resumeText, [
      {
        id: 'suggestion-2',
        type: 'reword',
        status: 'pending',
        original: 'SEO campaigns',
        suggested: 'B2B SEO campaigns',
        charStart: 4,
        charEnd: 17,
      },
    ]);

    expect(html).toContain('SEO campaigns');
    expect(html).not.toContain('B2B');
  });

  it('partitions unanchored suggestions for popover-only review', () => {
    const { anchored, unanchored } = partitionSuggestions([
      {
        id: 'a',
        status: 'pending',
        charStart: 1,
        charEnd: 4,
      },
      {
        id: 'b',
        status: 'pending',
        charStart: -1,
        charEnd: -1,
      },
    ]);

    expect(anchored).toHaveLength(1);
    expect(unanchored).toHaveLength(1);
  });

  it('resolves skill display names from common field aliases', () => {
    expect(getSkillDisplayName({ skillName: 'React' })).toBe('React');
    expect(getSkillDisplayName({ label: 'GA4' })).toBe('GA4');
    expect(getSkillDisplayName({ id: 'skill-fallback' })).toBe('skill-fallback');
  });
});

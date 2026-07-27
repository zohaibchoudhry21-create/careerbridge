import { describe, expect, it } from 'vitest';
import { buildResumeTextFromLineMap, resolveCanonicalResumeText } from './resumeLineMapUtils.js';

describe('resumeLineMapUtils', () => {
  const lineMap = [
    { line_number: 2, text: 'jane@example.com' },
    { line_number: 1, text: 'Jane Doe' },
    { line_number: 3, text: 'SUMMARY' },
  ];

  it('orders lines by line_number', () => {
    expect(buildResumeTextFromLineMap(lineMap)).toBe('Jane Doe\njane@example.com\nSUMMARY');
  });

  it('prefers line map text over resume text', () => {
    expect(
      resolveCanonicalResumeText({
        resumeText: 'SUMMARY\nJane Doe',
        lineMap,
      })
    ).toBe('Jane Doe\njane@example.com\nSUMMARY');
  });
});

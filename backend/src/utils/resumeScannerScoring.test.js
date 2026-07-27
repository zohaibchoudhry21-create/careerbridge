import { describe, expect, it } from 'vitest';
import {
  applySuggestionToText,
  computeSkillMatches,
  findTextOffset,
  skillMatchesResume,
} from './resumeScannerScoring.js';

const skills = [
  {
    id: 'skill-react-1',
    name: 'React',
    type: 'hard',
    synonyms: ['React.js'],
  },
  {
    id: 'skill-ga4-1',
    name: 'Google Analytics 4',
    type: 'required',
    synonyms: ['GA4'],
  },
  {
    id: 'skill-python-1',
    name: 'Python',
    type: 'hard',
    synonyms: [],
  },
];

describe('resumeScannerScoring', () => {
  it('matches skills with synonyms and acronyms', () => {
    const resumeText = 'Built dashboards with React.js and tracked traffic in GA4.';

    expect(skillMatchesResume(resumeText, skills[0]).matched).toBe(true);
    expect(skillMatchesResume(resumeText, skills[1]).matched).toBe(true);
    expect(skillMatchesResume(resumeText, skills[2]).matched).toBe(false);
  });

  it('computes matched and missing skill ids', () => {
    const resumeText = 'Experienced with React.js and GA4 analytics.';
    const result = computeSkillMatches(resumeText, skills);

    expect(result.matchedSkillIds).toEqual(['skill-react-1', 'skill-ga4-1']);
    expect(result.missingSkillIds).toEqual(['skill-python-1']);
  });

  it('finds substring offsets case-insensitively', () => {
    const resumeText = 'Led content marketing strategy.';
    const offset = findTextOffset(resumeText, 'content marketing');

    expect(offset.charStart).toBe(4);
    expect(offset.charEnd).toBe(21);
  });

  it('applies reword suggestions using anchored offsets', () => {
    const resumeText = 'Led content marketing strategy.';
    const updated = applySuggestionToText(resumeText, {
      type: 'reword',
      original: 'content marketing',
      suggested: 'B2B content marketing',
      charStart: 4,
      charEnd: 21,
    });

    expect(updated).toBe('Led B2B content marketing strategy.');
  });

  it('applies remove suggestions', () => {
    const resumeText = 'Experienced with remote work flexibility.';
    const updated = applySuggestionToText(resumeText, {
      type: 'remove',
      original: 'remote work flexibility',
      suggested: '',
      charStart: 17,
      charEnd: 40,
    });

    expect(updated).toBe('Experienced with .');
  });
});

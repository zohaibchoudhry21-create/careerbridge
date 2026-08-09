import { describe, expect, it } from 'vitest';
import {
  getScoreColor,
  getScoreTone,
  getSkillDisplayName,
  partitionSuggestions,
} from './resumeEditorUtils.js';

describe('resumeEditorUtils', () => {
  it('resolves skill display names with fallbacks', () => {
    expect(getSkillDisplayName({ name: 'React' })).toBe('React');
    expect(getSkillDisplayName({ skillName: 'TypeScript' })).toBe('TypeScript');
    expect(getSkillDisplayName({ id: 'skill-1' })).toBe('skill-1');
  });

  it('maps score tones and colors', () => {
    expect(getScoreTone(90)).toBe('good');
    expect(getScoreTone(60)).toBe('fair');
    expect(getScoreTone(20)).toBe('poor');
    expect(getScoreColor(90)).toBe('#16a34a');
  });

  it('partitions pending suggestions into anchored and unanchored', () => {
    const { pending, anchored, unanchored } = partitionSuggestions([
      {
        id: 'a',
        status: 'pending',
        fieldPath: 'summary',
        charStart: 0,
        charEnd: 4,
      },
      {
        id: 'b',
        status: 'pending',
        fieldPath: '',
        charStart: -1,
        charEnd: -1,
      },
      {
        id: 'c',
        status: 'accepted',
        fieldPath: 'summary',
        charStart: 0,
        charEnd: 2,
      },
    ]);

    expect(pending).toHaveLength(2);
    expect(anchored.map((s) => s.id)).toEqual(['a']);
    expect(unanchored.map((s) => s.id)).toEqual(['b']);
  });
});

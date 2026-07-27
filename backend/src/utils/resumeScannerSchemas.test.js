import { describe, expect, it } from 'vitest';
import { parseResumeScannerAnalysis } from './resumeScannerSchemas.js';

const validPayload = {
  jobTitle: 'Senior Engineer',
  company: 'Acme',
  skills: [
    {
      id: 'skill-react-1',
      name: 'React',
      type: 'hard',
      synonyms: ['React.js'],
      matched: true,
      matchEvidence: 'React.js',
    },
  ],
  score: 72,
  scoreBreakdown: {
    keywordCoverage: { score: 70, weight: 40, weighted: 28, notes: 'Good coverage' },
    sectionCompleteness: { score: 80, weight: 20, weighted: 16, notes: '' },
    searchability: { score: 75, weight: 20, weighted: 15, notes: '' },
    quantifiedAchievements: { score: 65, weight: 20, weighted: 13, notes: '' },
  },
  suggestions: [
    {
      id: 'suggestion-1',
      type: 'reword',
      original: 'worked on',
      suggested: 'led',
      reason: 'Stronger action verb',
      impact: 2,
      targetSkillId: 'skill-react-1',
    },
  ],
  searchabilityIssues: ['Missing phone number'],
  recruiterTips: ['Add metrics to bullets'],
};

describe('resumeScannerSchemas', () => {
  it('parses a valid AI analysis payload', () => {
    const parsed = parseResumeScannerAnalysis(validPayload);
    expect(parsed.score).toBe(72);
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.suggestions[0].type).toBe('reword');
  });

  it('rejects malformed payloads', () => {
    expect(() =>
      parseResumeScannerAnalysis({
        ...validPayload,
        skills: [],
      })
    ).toThrow();
  });
});

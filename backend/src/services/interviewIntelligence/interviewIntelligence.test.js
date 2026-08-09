import { describe, expect, it } from 'vitest';
import { buildInterviewContextBrief } from './contextBriefBuilder.js';
import {
  buildFallbackQuestionGuide,
  normalizeQuestionGuide,
} from './questionGuideGroqService.js';
import { buildInterviewIntelligencePoliciesPrompt } from './interviewIntelligenceService.js';
import { buildInterviewerSystemPrompt } from '../../utils/interviewerPromptBuilder.js';

describe('buildInterviewContextBrief', () => {
  it('prefers structured skills/projects and truncates long resume', () => {
    const brief = buildInterviewContextBrief({
      roleLabel: 'Backend Developer',
      difficulty: 'hard',
      resumeSkills: ['Node.js', 'MongoDB', 'Redis'],
      resumeProjects: ['Realtime chat API'],
      resumeText: 'A'.repeat(5000),
      jobDescriptionText: 'B'.repeat(5000),
      focusAreas: ['Coding', 'System design'],
      targetCompany: 'Acme',
    });

    expect(brief.skills).toEqual(['Node.js', 'MongoDB', 'Redis']);
    expect(brief.projects[0]).toContain('Realtime chat');
    expect(brief.resumeExcerpt.length).toBeLessThanOrEqual(400);
    expect(brief.jobDescriptionExcerpt.length).toBeLessThanOrEqual(800);
    expect(brief.promptText).toContain('Backend Developer');
    expect(brief.promptText).toContain('Acme');
    expect(brief.promptText).toContain('Node.js');
  });

  it('includes longer resume excerpt when structured data is missing', () => {
    const brief = buildInterviewContextBrief({
      roleLabel: 'Data Analyst',
      resumeText: 'C'.repeat(2000),
    });
    expect(brief.resumeExcerpt.length).toBeGreaterThan(400);
    expect(brief.resumeExcerpt.length).toBeLessThanOrEqual(1200);
  });
});

describe('question guide fallbacks', () => {
  it('builds a duration-sized fallback guide without a fixed question bank', () => {
    const guide = buildFallbackQuestionGuide({
      roleLabel: 'Frontend Developer',
      difficulty: 'medium',
      durationMinutes: 15,
      focusAreas: ['Coding', 'Behavioral'],
    });
    expect(guide).toHaveLength(6);
    expect(guide[0].focusTag).toBe('opening');
    expect(guide.some((q) => q.focusTag === 'coding' || q.focusTag === 'behavioral')).toBe(true);
  });

  it('normalizes Groq payloads and pads to expected count', () => {
    const normalized = normalizeQuestionGuide(
      [{ question: 'Tell me about yourself.', focusTag: 'opening', depthHint: 'warmup' }],
      5,
      {
        roleLabel: 'Product Manager',
        difficulty: 'easy',
        durationMinutes: 10,
        focusAreas: ['Leadership'],
      }
    );
    expect(normalized).toHaveLength(5);
    expect(normalized[0].questionId).toBe('q1');
    expect(normalized[0].text).toContain('yourself');
    expect(normalized[0].focusTag).toBe('opening');
  });
});

describe('interview intelligence policies', () => {
  it('includes memory, adaptive difficulty, and domain playbooks', () => {
    const policies = buildInterviewIntelligencePoliciesPrompt();
    expect(policies).toMatch(/Conversation memory/i);
    expect(policies).toMatch(/Weak answer/i);
    expect(policies).toMatch(/Excellent answer/i);
    expect(policies).toMatch(/System design/i);
    expect(policies).toMatch(/Contradiction/i);
    expect(policies).toMatch(/Skill depth/i);
  });
});

describe('buildInterviewerSystemPrompt intelligence', () => {
  it('embeds context brief and intelligence policies', () => {
    const prompt = buildInterviewerSystemPrompt({
      roleLabel: 'Full Stack Developer',
      difficulty: 'medium',
      durationMinutes: 15,
      focusAreas: ['Coding'],
      resumeSkills: ['React', 'Node.js'],
      jobDescriptionText: 'Need React and Node experience.',
      interviewContextBrief: {
        promptText: 'Role: Full Stack Developer\nClaimed skills: React, Node.js',
      },
      questions: [
        {
          questionId: 'q1',
          text: 'Walk me through a recent full-stack feature.',
          focusTag: 'opening',
          depthHint: 'warmup',
        },
        {
          questionId: 'q2',
          text: 'How do you approach API design?',
          focusTag: 'coding',
          depthHint: 'standard',
        },
      ],
    });

    expect(prompt).toContain('Claimed skills: React, Node.js');
    expect(prompt).toContain('Walk me through a recent full-stack feature.');
    expect(prompt).toContain('[opening]');
    expect(prompt).toMatch(/Adaptive difficulty/i);
    expect(prompt).toMatch(/Resume-aware/i);
    expect(prompt).toMatch(/Domain follow-up playbooks/i);
    expect(prompt).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
  });
});

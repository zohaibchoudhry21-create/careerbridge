import { describe, expect, it } from 'vitest';
import { buildInterviewerSystemPrompt } from './vapiAssistantService.js';

describe('buildInterviewerSystemPrompt', () => {
  it('embeds trusted session fields into the system prompt', () => {
    const prompt = buildInterviewerSystemPrompt({
      roleLabel: 'Frontend Developer',
      difficulty: 'hard',
      durationMinutes: 20,
      focusAreas: ['Coding', 'System design'],
      interviewerPersona: 'strict',
      questions: [{ text: 'Tell me about a recent React project.' }],
    });

    expect(prompt).toContain('Frontend Developer');
    expect(prompt).toContain('hard');
    expect(prompt).toContain('Coding, System design');
    expect(prompt).toContain('Tell me about a recent React project.');
    expect(prompt).toContain('formal and demanding');
  });

  it('does not leave template placeholders', () => {
    const prompt = buildInterviewerSystemPrompt({
      role: 'Backend Developer',
      questions: [],
    });
    expect(prompt).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
  });
});

import { describe, expect, it } from 'vitest';
import { buildInterviewerSystemPrompt, buildVapiAssistantPayload } from './vapiAssistantService.js';
import { buildDynamicGreeting, listGreetingTemplatesForPersona } from './interviewerGreeting.js';
import { getInterviewerPersonaPrompt, getInterviewerPersonaProfile } from './interviewerPersona.js';

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
    expect(prompt).toMatch(/strict|formal/i);
    expect(prompt).toContain('Never interrupt the candidate');
    expect(prompt).toContain('Thinking delay');
    expect(prompt).toContain('Adaptive speaking speed');
  });

  it('does not leave template placeholders', () => {
    const prompt = buildInterviewerSystemPrompt({
      role: 'Backend Developer',
      questions: [],
    });
    expect(prompt).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
    expect(prompt).not.toMatch(/\{role\}/);
  });

  it('includes human conversation and closing guidance', () => {
    const prompt = buildInterviewerSystemPrompt({
      interviewerPersona: 'friendly',
      roleLabel: 'Product Manager',
    });
    expect(prompt).toMatch(/human/i);
    expect(prompt).toMatch(/closing/i);
    expect(prompt).toMatch(/warm/i);
  });

  it('includes interview intelligence sections when resume/JD present', () => {
    const prompt = buildInterviewerSystemPrompt({
      roleLabel: 'Backend Developer',
      resumeSkills: ['Go', 'Postgres'],
      jobDescriptionText: 'Build APIs at scale.',
      questions: [{ text: 'Describe an API you owned.', focusTag: 'opening' }],
    });
    expect(prompt).toMatch(/Conversation memory/i);
    expect(prompt).toMatch(/Weak answer/i);
    expect(prompt).toContain('Go');
    expect(prompt).toContain('Build APIs at scale');
  });
});

describe('interviewer personas', () => {
  it('returns rich profiles for all known personas', () => {
    for (const id of ['friendly', 'neutral', 'strict', 'panel']) {
      const profile = getInterviewerPersonaProfile(id);
      expect(profile.id).toBe(id);
      expect(profile.prompt.length).toBeGreaterThan(80);
      expect(getInterviewerPersonaPrompt(id)).toBe(profile.prompt);
    }
  });

  it('falls back to neutral for unknown personas', () => {
    expect(getInterviewerPersonaProfile('unknown').id).toBe('neutral');
  });
});

describe('buildDynamicGreeting', () => {
  it('interpolates the role into a persona greeting', () => {
    const greeting = buildDynamicGreeting({
      interviewerPersona: 'neutral',
      roleLabel: 'Data Analyst',
    });
    expect(greeting).toContain('Data Analyst');
    expect(greeting).not.toMatch(/\{role\}/);
  });

  it('has multiple templates per persona', () => {
    for (const id of ['friendly', 'neutral', 'strict', 'panel']) {
      expect(listGreetingTemplatesForPersona(id).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('buildVapiAssistantPayload', () => {
  it('includes speaking plans and dynamic first message', () => {
    const payload = buildVapiAssistantPayload({
      _id: 'abc123456789',
      roleLabel: 'Backend Developer',
      difficulty: 'medium',
      durationMinutes: 15,
      interviewerPersona: 'friendly',
      questions: [{ text: 'Describe a scaling challenge.' }],
    });

    expect(payload.firstMessage).toContain('Backend Developer');
    expect(payload.firstMessageMode).toBe('assistant-speaks-first');
    expect(payload.firstMessageInterruptionsEnabled).toBe(false);
    expect(payload.startSpeakingPlan.waitSeconds).toBeGreaterThanOrEqual(0.5);
    expect(payload.startSpeakingPlan.smartEndpointingPlan.provider).toBe('livekit');
    expect(payload.startSpeakingPlan.customEndpointingRules.length).toBeGreaterThan(0);
    expect(payload.stopSpeakingPlan.numWords).toBeGreaterThanOrEqual(1);
    expect(payload.model.messages[0].content).toContain('Never interrupt the candidate');
    expect(payload.maxDurationSeconds).toBeGreaterThan(15 * 60);
    expect(payload.voice.provider).toBe('vapi');
    expect(payload.voice.voiceId).toBeTruthy();
  });

  it('maps strict persona to a distinct default voice when using vapi provider', () => {
    const friendly = buildVapiAssistantPayload({ interviewerPersona: 'friendly' });
    const strict = buildVapiAssistantPayload({ interviewerPersona: 'strict' });
    expect(friendly.voice.voiceId).toBe('Savannah');
    expect(strict.voice.voiceId).toBe('Rohan');
    expect(friendly.voice.version).toBe(2);
    expect(strict.voice.version).toBeUndefined();
  });

  it('keeps Elliot as the neutral default voice', () => {
    const payload = buildVapiAssistantPayload({ interviewerPersona: 'neutral' });
    expect(payload.voice.voiceId).toBe('Elliot');
    expect(payload.voice.version).toBe(2);
  });
});

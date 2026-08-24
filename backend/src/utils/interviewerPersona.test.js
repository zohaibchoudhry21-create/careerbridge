import { describe, expect, it } from 'vitest';
import {
  buildPanelPrompt,
  formatPanelSeatIntroList,
  getInterviewerPersonaProfile,
  resolvePanelSeats,
} from './interviewerPersona.js';
import { buildDynamicGreeting, listGreetingTemplatesForPersona } from './interviewerGreeting.js';
import { buildPanelSeatQuestionHints } from './panelPromptHelpers.js';

describe('resolvePanelSeats', () => {
  it('uses creative seats for art roles', () => {
    const seats = resolvePanelSeats('Graphic Artist');
    expect(seats[0].title).toMatch(/creative/i);
    expect(seats.map((s) => s.title).join(' ')).not.toMatch(/technical lead/i);
  });

  it('uses technical seats for engineering roles', () => {
    const seats = resolvePanelSeats('Frontend Developer');
    expect(seats[0].title).toMatch(/technical/i);
  });

  it('falls back to domain + hiring manager + people for unknown roles', () => {
    const seats = resolvePanelSeats('Chief Happiness Officer');
    expect(seats).toHaveLength(3);
    expect(seats[0].title).toMatch(/domain/i);
    expect(seats[1].title).toMatch(/hiring manager/i);
  });

  it('includes a stable displayName on every seat', () => {
    const seats = resolvePanelSeats('Graphic Designer');
    expect(seats).toHaveLength(3);
    for (const seat of seats) {
      expect(String(seat.displayName || '').trim().length).toBeGreaterThan(0);
    }
    expect(seats.map((s) => s.displayName)).toEqual(['Maya', 'Jordan', 'Sam']);
  });

  it('returns the same names for the same role every time', () => {
    expect(resolvePanelSeats('Frontend Developer')).toEqual(
      resolvePanelSeats('Frontend Developer')
    );
  });
});

describe('formatPanelSeatIntroList', () => {
  it('formats three named seats for spoken intro', () => {
    const list = formatPanelSeatIntroList(resolvePanelSeats('Frontend Developer'));
    expect(list).toMatch(/Alex \(Technical lead\)/);
    expect(list).toMatch(/and Sam/);
  });
});

describe('buildPanelPrompt', () => {
  it('includes structured seat tags and cue hand-off rules', () => {
    const prompt = buildPanelPrompt({ roleLabel: 'Software Engineer' });
    expect(prompt).toMatch(/Machine-readable speaker tag/i);
    expect(prompt).toMatch(/Hand-off style \(after the \[SEAT:N\] tag\)/i);
    expect(prompt).toMatch(/Tag \(MUST prefix every turn from this seat\): \[SEAT:0\]/i);
    expect(prompt).toMatch(/From the tech side/i);
  });

  it('includes focusAreas in theme block when provided', () => {
    const prompt = buildPanelPrompt({
      roleLabel: 'Software Engineer',
      focusAreas: ['Coding', 'Behavioral'],
    });
    expect(prompt).toMatch(/Panel themes/i);
    expect(prompt).toMatch(/Coding/);
    expect(prompt).toMatch(/Behavioral/);
  });

  it('requires machine-readable [SEAT:N] tags for speaker detection', () => {
    const prompt = buildPanelPrompt({ roleLabel: 'Software Engineer' });
    expect(prompt).toMatch(/\[SEAT:N\]/);
    expect(prompt).toMatch(/\[SEAT:0\]/);
    expect(prompt).toMatch(/Machine-readable speaker tag/i);
  });

  it('maps easy pressure to supportive tone', () => {
    const prompt = buildPanelPrompt({ roleLabel: 'Software Engineer', difficulty: 'easy' });
    expect(prompt).toMatch(/Panel pressure: Supportive/i);
    expect(prompt).toMatch(/Take your time/i);
  });

  it('maps hard pressure to demanding tone', () => {
    const prompt = buildPanelPrompt({ roleLabel: 'Software Engineer', difficulty: 'hard' });
    expect(prompt).toMatch(/Panel pressure: Demanding/i);
    expect(prompt).toMatch(/Can you be more specific/i);
  });

  it('embeds sample question hints for engineering seats', () => {
    const seats = resolvePanelSeats('Software Engineer');
    const prompt = buildPanelPrompt({
      roleLabel: 'Software Engineer',
      panelSeats: seats,
      focusAreas: ['Coding'],
    });
    expect(prompt).toMatch(/Sample angles/i);
    expect(prompt).toMatch(/hands-on coding/i);
  });
});

describe('buildPanelSeatQuestionHints', () => {
  it('adds coding hint when Coding theme is selected for seat 0', () => {
    const seats = resolvePanelSeats('Software Engineer');
    const hints = buildPanelSeatQuestionHints(seats[0], 0, 'Software Engineer', ['Coding']);
    expect(hints.some((h) => /coding|implementation/i.test(h))).toBe(true);
  });
});

describe('getInterviewerPersonaProfile panel', () => {
  it('bakes role-specific seats into the panel prompt', () => {
    const profile = getInterviewerPersonaProfile('panel', {
      roleLabel: 'Illustrator',
    });
    expect(profile.prompt).toMatch(/Creative lead/i);
    expect(profile.prompt).toMatch(/Maya/);
    expect(profile.prompt).not.toMatch(/Technical lead — depth/i);
    expect(profile.prompt).toMatch(/Illustrator/);
  });

  it('passes difficulty and focusAreas through context', () => {
    const profile = getInterviewerPersonaProfile('panel', {
      roleLabel: 'Software Engineer',
      difficulty: 'hard',
      focusAreas: ['System design'],
    });
    expect(profile.prompt).toMatch(/Panel pressure: Demanding/i);
    expect(profile.prompt).toMatch(/System design/);
  });
});

describe('buildDynamicGreeting panel', () => {
  it('names the panel seats in the spoken greeting', () => {
    const greeting = buildDynamicGreeting({
      interviewerPersona: 'panel',
      roleLabel: 'Frontend Developer',
    });
    expect(greeting).toMatch(/Alex/);
    expect(greeting).toMatch(/Jordan/);
    expect(greeting).toMatch(/Sam/);
    expect(greeting).toMatch(/Frontend Developer/);
    expect(greeting).toMatch(/introduce yourself to the group/i);
  });

  it('panel templates include {panel} placeholder', () => {
    const templates = listGreetingTemplatesForPersona('panel');
    expect(templates.every((t) => t.includes('{panel}'))).toBe(true);
  });
});

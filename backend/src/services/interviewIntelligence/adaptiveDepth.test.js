import { describe, expect, it } from 'vitest';
import {
  applyAdaptiveDepthToQuestions,
  bumpDepthHint,
  classifyAnswerStrength,
  stepDownDepthHint,
  suggestNextDepthAdjustment,
} from './adaptiveDepth.js';
import {
  getAbandonedThresholdMs,
  isSessionPastAbandonedThreshold,
} from './abandonedSessionCleanup.js';

describe('adaptive depth helpers', () => {
  it('bumps and steps depth hints within warmup|standard|deep', () => {
    expect(bumpDepthHint('warmup')).toBe('standard');
    expect(bumpDepthHint('standard')).toBe('deep');
    expect(bumpDepthHint('deep')).toBe('deep');
    expect(stepDownDepthHint('deep')).toBe('standard');
    expect(stepDownDepthHint('standard')).toBe('warmup');
    expect(stepDownDepthHint('warmup')).toBe('warmup');
  });

  it('requires two strong answers and a standard next hint to bump', () => {
    expect(
      suggestNextDepthAdjustment({
        lastStrengths: ['strong', 'strong'],
        nextDepthHint: 'standard',
        enabled: true,
      })
    ).toEqual({ from: 'standard', to: 'deep', direction: 'up' });

    expect(
      suggestNextDepthAdjustment({
        lastStrengths: ['strong', 'strong'],
        nextDepthHint: 'deep',
        enabled: true,
      })
    ).toBeNull();

    expect(
      suggestNextDepthAdjustment({
        lastStrengths: ['strong'],
        nextDepthHint: 'standard',
        enabled: true,
      })
    ).toBeNull();
  });

  it('steps down after two weak answers', () => {
    expect(
      suggestNextDepthAdjustment({
        lastStrengths: ['weak', 'weak'],
        nextDepthHint: 'standard',
        enabled: true,
      })
    ).toEqual({ from: 'standard', to: 'warmup', direction: 'down' });
  });

  it('no-ops when disabled or on final question', () => {
    expect(
      suggestNextDepthAdjustment({
        lastStrengths: ['strong', 'strong'],
        nextDepthHint: 'standard',
        enabled: false,
      })
    ).toBeNull();
    expect(
      suggestNextDepthAdjustment({
        lastStrengths: ['strong', 'strong'],
        nextDepthHint: 'standard',
        isFinalQuestion: true,
        enabled: true,
      })
    ).toBeNull();
  });

  it('applies bump onto the next guide item only', () => {
    const questions = [
      { questionId: 'q1', text: 'Q1', depthHint: 'warmup' },
      { questionId: 'q2', text: 'Q2', depthHint: 'standard' },
      { questionId: 'q3', text: 'Q3', depthHint: 'standard' },
    ];
    const { questions: next, adjustment } = applyAdaptiveDepthToQuestions(questions, {
      answeredCount: 1,
      lastStrengths: ['strong', 'strong'],
      enabled: true,
    });
    expect(adjustment?.to).toBe('deep');
    expect(next[1].depthHint).toBe('deep');
    expect(next[0].depthHint).toBe('warmup');
    expect(next[2].depthHint).toBe('standard');
  });

  it('classifies short on_topic as neutral, long as strong', () => {
    expect(classifyAnswerStrength('on_topic', 'short answer')).toBe('neutral');
    expect(
      classifyAnswerStrength(
        'on_topic',
        'x'.repeat(120)
      )
    ).toBe('strong');
    expect(classifyAnswerStrength('gibberish', 'x'.repeat(200))).toBe('weak');
  });
});

describe('abandoned session threshold', () => {
  it('uses 2x durationMinutes', () => {
    expect(getAbandonedThresholdMs({ durationMinutes: 15 })).toBe(15 * 2 * 60 * 1000);
  });

  it('flags stale active sessions only', () => {
    const createdAt = new Date(Date.now() - 40 * 60 * 1000); // 40 min ago
    expect(
      isSessionPastAbandonedThreshold({
        status: 'active',
        durationMinutes: 15,
        createdAt,
      })
    ).toBe(true);
    expect(
      isSessionPastAbandonedThreshold({
        status: 'completed',
        durationMinutes: 15,
        createdAt,
      })
    ).toBe(false);
    expect(
      isSessionPastAbandonedThreshold({
        status: 'active',
        durationMinutes: 15,
        createdAt: new Date(),
      })
    ).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  extractTranscriptQaPairs,
  looksLikeInterviewQuestion,
  isNonQuestionAssistantChatter,
} from './extractTranscriptQaPairs.js';
import { buildQuestionReviews } from './questionReviewBuilder.js';
import { buildMockInterviewSnapshot } from '../snapshotBuilder.js';

describe('looksLikeInterviewQuestion', () => {
  it('detects ? and common interview stems', () => {
    expect(looksLikeInterviewQuestion('How do you approach keyword research?')).toBe(true);
    expect(looksLikeInterviewQuestion('Tell me about a recent SEO campaign.')).toBe(true);
    expect(looksLikeInterviewQuestion('Walk me through your content optimization process')).toBe(
      true
    );
  });

  it('rejects short / empty', () => {
    expect(looksLikeInterviewQuestion('')).toBe(false);
    expect(looksLikeInterviewQuestion('Ok')).toBe(false);
  });
});

describe('isNonQuestionAssistantChatter', () => {
  it('flags greetings and acks without questions', () => {
    expect(isNonQuestionAssistantChatter('Hello, welcome to the interview.')).toBe(true);
    expect(isNonQuestionAssistantChatter('Got it.')).toBe(true);
    expect(isNonQuestionAssistantChatter('That makes sense.')).toBe(true);
  });

  it('does not flag real questions', () => {
    expect(
      isNonQuestionAssistantChatter('Got it. Can you walk me through keyword research?')
    ).toBe(false);
  });
});

describe('extractTranscriptQaPairs', () => {
  const guide = [
    {
      questionId: 'q1',
      text: 'Can you start by telling me about yourself for the SEO Specialist role?',
      focusTag: 'warmup',
      depthHint: 'warmup',
    },
    {
      questionId: 'q2',
      text: 'How do you stay up-to-date with SEO trends?',
      focusTag: 'domain',
      depthHint: 'standard',
    },
  ];

  it('pairs spoken assistant questions with following user answers', () => {
    const pairs = extractTranscriptQaPairs(
      [
        { role: 'assistant', content: 'Hi, thanks for joining today.' },
        {
          role: 'assistant',
          content: 'Can you tell me about your SEO background and what drew you to this role?',
        },
        {
          role: 'user',
          content:
            'I have five years in SEO, mostly technical audits and content strategy for ecommerce brands.',
        },
        { role: 'assistant', content: 'Got it, that makes sense.' },
        {
          role: 'assistant',
          content: 'How do you stay current with algorithm updates and SEO trends?',
        },
        {
          role: 'user',
          content: 'I follow Search Engine Journal, test changes on staging sites, and track GSC.',
        },
        { role: 'assistant', content: 'Thanks for your time today, that wraps up our interview.' },
      ],
      { guideQuestions: guide }
    );

    expect(pairs).toHaveLength(2);
    expect(pairs[0].source).toBe('transcript');
    expect(pairs[0].question).toMatch(/SEO background/i);
    expect(pairs[0].answer).toMatch(/five years/i);
    expect(pairs[0].question).not.toMatch(/Can you start by telling me about yourself for the SEO/i);

    expect(pairs[1].question).toMatch(/algorithm updates/i);
    expect(pairs[1].answer).toMatch(/Search Engine Journal/i);
  });

  it('merges continued user speech after an acknowledgment', () => {
    const pairs = extractTranscriptQaPairs([
      { role: 'assistant', content: 'Describe your keyword research process.' },
      { role: 'user', content: 'I start with seed terms from the product catalog.' },
      { role: 'assistant', content: 'Okay.' },
      { role: 'user', content: 'Then I cluster by intent and map to landing pages.' },
    ]);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].answer).toMatch(/seed terms/i);
    expect(pairs[0].answer).toMatch(/cluster by intent/i);
  });

  it('falls back to guide when transcript has no detectable questions', () => {
    const pairs = extractTranscriptQaPairs(
      [
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'I work in SEO full time doing audits and link building.' },
      ],
      { guideQuestions: guide }
    );

    expect(pairs).toHaveLength(2);
    expect(pairs[0].source).toBe('guide_fallback');
    expect(pairs[0].question).toMatch(/SEO Specialist/i);
    expect(pairs[0].answer).toMatch(/audits/i);
  });
});

describe('snapshot + reviews use spoken Q&A', () => {
  it('buildMockInterviewSnapshot prefers live spoken questions over guide text', () => {
    const snapshot = buildMockInterviewSnapshot({
      mode: 'live',
      roleLabel: 'SEO Specialist',
      difficulty: 'medium',
      durationMinutes: 15,
      targetQuestionCount: 6,
      questions: [
        {
          questionId: 'q1',
          text: 'FIXED GUIDE: Can you start by telling me a little about yourself?',
        },
      ],
      answers: [],
      voiceCallTranscript: [
        { role: 'assistant', content: 'Welcome to the call.' },
        {
          role: 'assistant',
          content: 'What motivated you to apply for this SEO Specialist position?',
        },
        {
          role: 'user',
          content:
            'I enjoy improving organic traffic and recently grew a site from 10k to 80k sessions.',
        },
      ],
    });

    expect(snapshot.qa).toHaveLength(1);
    expect(snapshot.qa[0].question).toMatch(/What motivated you/i);
    expect(snapshot.qa[0].question).not.toMatch(/FIXED GUIDE/i);
    expect(snapshot.qa[0].answer).toMatch(/organic traffic/i);
    expect(snapshot.summary.qaSource).toBe('transcript');
  });

  it('buildQuestionReviews scores using paired answer on the QA row', () => {
    const reviews = buildQuestionReviews({
      qa: [
        {
          questionId: 'live-q1',
          question: 'How do you measure SEO campaign success?',
          answer:
            'I measure SEO campaign success with organic sessions, keyword rankings, conversions, and attributed revenue in analytics.',
          transcript:
            'I measure SEO campaign success with organic sessions, keyword rankings, conversions, and attributed revenue in analytics.',
        },
      ],
      fullTranscript: [],
    });

    expect(reviews[0].relevance).toBe('on_topic');
    expect(reviews[0].answerExcerpt).toMatch(/organic sessions/i);
    expect(reviews[0].needsAiScore).toBe(true);
    expect(reviews[0].feedback).not.toBe('No answer provided.');
  });
});

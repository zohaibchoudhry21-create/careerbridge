import { describe, expect, it } from 'vitest';
import { buildHiringSections, resolveHiringBand } from './builders/hiringBuilder.js';
import { buildVoiceAnalysisSection } from './builders/voiceAnalysisBuilder.js';
import { buildEyeContactSection } from './builders/eyeContactBuilder.js';
import { buildTimelineAndCharts } from './builders/timelineChartsBuilder.js';
import { buildDimensionScores } from './builders/dimensionScoresBuilder.js';
import { assembleInterviewReport } from './reportAssembler.js';
import { serializeEnterpriseReport } from './serializers/enterpriseReportSerializer.js';
import { serializeInterviewReport } from '../../utils/interviewReportSerializer.js';
import { buildMockInterviewSnapshot } from './snapshotBuilder.js';

describe('hiringBuilder', () => {
  it('maps overall scores to hiring bands', () => {
    expect(resolveHiringBand(90).decision).toBe('hire');
    expect(resolveHiringBand(75).decision).toBe('lean_hire');
    expect(resolveHiringBand(60).decision).toBe('hold');
    expect(resolveHiringBand(40).decision).toBe('no_hire');
  });

  it('builds probability factors from dimensions', () => {
    const hiring = buildHiringSections(80, {
      communication: { label: 'Communication', score: 88 },
      technicalSkills: { label: 'Technical Skills', score: 70 },
    });
    expect(hiring.hiringProbability.percent).toBeGreaterThan(50);
    expect(hiring.hiringProbability.factors.length).toBeGreaterThan(0);
  });
});

describe('metric section builders', () => {
  it('builds voice section from speech metrics', () => {
    const section = buildVoiceAnalysisSection({
      callSpeechMetrics: {
        communicationScore: 82,
        fluency: 80,
        speechSpeed: 140,
        fillerWords: 3,
      },
      summary: { averageWpm: 140, totalFillerWords: 3 },
    });
    expect(section.score).toBe(82);
    expect(section.metrics.speechSpeed).toBe(140);
  });

  it('builds eye contact from summary percent', () => {
    const section = buildEyeContactSection({
      summary: { averageEyeContactPercent: 67 },
      behavioralMetrics: { lookingAwayDurationMs: 2000 },
    });
    expect(section.percent).toBe(67);
    expect(section.evidence.length).toBeGreaterThan(0);
  });
});

describe('timelineChartsBuilder', () => {
  it('merges speech and behavioral timelines into charts-ready data', () => {
    const result = buildTimelineAndCharts({
      dimensions: {
        communication: { label: 'Communication', score: 70 },
        technicalSkills: { label: 'Technical Skills', score: 68 },
        behavior: { label: 'Behavior', score: 65 },
      },
      voiceSection: { score: 75, metrics: { fluency: 80 } },
      speechTimelineEvents: [{ tMs: 1000, offsetLabel: '00:01', type: 'long_pause', message: 'Pause' }],
      behavioralTimelineEvents: [
        { tMs: 2000, offsetLabel: '00:02', type: 'looking_away', message: 'Looking away' },
      ],
      overallScore: 72,
      contentCore: 70,
    });
    expect(result.timeline).toHaveLength(2);
    expect(result.charts.dimensionRadar.find((d) => d.key === 'communication').score).toBe(70);
    expect(result.charts.speechTimeline).toHaveLength(1);
  });

  it('caps delivery bars using Phase 3 influence budget when content is weak', () => {
    const result = buildTimelineAndCharts({
      dimensions: {
        communication: { label: 'Communication', score: 3 },
        technicalSkills: { label: 'Technical Skills', score: 3 },
        behavior: { label: 'Behavior', score: 3 },
        leadership: { label: 'Leadership', score: 3 },
        problemSolving: { label: 'Problem Solving', score: 3 },
        criticalThinking: { label: 'Critical Thinking', score: 3 },
      },
      voiceSection: { score: 90 },
      eyeContactSection: { score: 88 },
      bodyLanguageSection: { score: 85 },
      overallScore: 2,
      contentAvg: 1,
      contentCore: 3,
    });

    for (const bar of result.charts.scoreBreakdownDelivery) {
      expect(bar.score).toBeLessThanOrEqual(13); // contentCore 3 + max influence 10
      expect(bar.deliveryOnly).toBe(true);
    }
    expect(result.charts.contentGated).toBe(true);
  });
});

describe('assembleInterviewReport', () => {
  it('returns legacy fields and enterpriseReport version 1', () => {
    const snapshot = buildMockInterviewSnapshot({
      mode: 'live',
      roleLabel: 'Backend Developer',
      difficulty: 'medium',
      durationMinutes: 15,
      targetQuestionCount: 6,
      questions: [{ questionId: 'q1', text: 'Tell me about yourself.', order: 0 }],
      answers: [],
      voiceCallTranscript: [
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'I am a backend engineer with Node experience.' },
      ],
      callVoiceMetrics: {
        wpm: 130,
        fillerWords: 2,
        pauseRatio: 0.1,
        confidenceScore: 70,
      },
      callVideoMetrics: {
        eyeContactPercent: 60,
        engagementScore: 65,
        attentionScore: 68,
        behavioralMetrics: { attentionScore: 68, distractionScore: 20 },
        timelineEvents: [{ tMs: 0, offsetLabel: '00:00', type: 'eye_contact', message: 'Maintaining eye contact' }],
      },
      callSpeechMetrics: {
        speechSpeed: 130,
        fluency: 72,
        communicationScore: 74,
        speakingConfidence: 71,
        fillerWords: 2,
      },
      speechTimelineEvents: [],
    });

    expect(snapshot.fullTranscript).toHaveLength(2);
    expect(snapshot.qa[0].transcript).toBe('');

    const assembled = assembleInterviewReport(snapshot, {
      legacyAiReport: {
        overallScore: 70,
        sections: {
          contentQuality: { score: 68, feedback: 'Solid substance' },
          voiceAnalysis: { wpm: 130, confidenceScore: 70, fillerWords: 2, feedback: 'Clear' },
          videoAnalysis: { eyeContactPercent: 60, engagementScore: 65, feedback: 'Present' },
        },
        strengths: ['Clear communication'],
        improvementAreas: ['Add more metrics'],
        recommendedNextSteps: ['Practice STAR answers'],
      },
      dimensions: {
        communication: 75,
        technicalSkills: 70,
        contentQualityScore: 68,
      },
      executiveSummary: {
        headline: 'Promising backend candidate',
        summary: 'Good delivery with room to deepen technical examples.',
        keyTakeaways: ['Clear speech'],
      },
      hiring: { decision: 'lean_hire', rationale: 'Strong baseline', confidence: 70 },
    });

    expect(assembled.sections.voiceAnalysis.wpm).toBe(130);
    expect(assembled.enterpriseReport.version).toBe(1);
    expect(assembled.enterpriseReport.dimensions.communication.score).toBeGreaterThan(0);
    expect(assembled.enterpriseReport.hiringRecommendation.decision).toBeTruthy();
    expect(assembled.enterpriseReport.charts.dimensionRadar.length).toBeGreaterThan(0);
    expect(assembled.strengths.length).toBeGreaterThan(0);
  });

  it('handles voice-only sessions without video metrics', () => {
    const dims = buildDimensionScores(
      {
        callSpeechMetrics: { communicationScore: 80, speakingConfidence: 78, fluency: 76 },
        summary: { averageConfidenceScore: 78 },
      },
      { technicalSkills: 60, problemSolving: 62, confidence: 75 }
    );
    // No questions → content dims fall back to narrative; confidence uses delivery blend.
    expect(dims.technicalSkills.score).toBe(60);
    expect(dims.problemSolving.score).toBe(62);
    expect(dims.confidence.score).toBeGreaterThan(70);
    expect(dims.behavior.score == null || dims.behavior.score >= 0).toBe(true);
  });
});

describe('serializers', () => {
  it('includes enterpriseReport on API payload', () => {
    const enterprise = serializeEnterpriseReport({
      version: 1,
      overallScore: 77,
      dimensions: { communication: { label: 'Communication', score: 80 } },
      strengths: ['A'],
    });
    const payload = serializeInterviewReport(
      {
        sourceType: 'mock_interview',
        sourceId: 'abc',
        overallScore: 77,
        sections: {},
        strengths: ['A'],
        improvementAreas: [],
        recommendedNextSteps: [],
        enterpriseReport: enterprise,
        createdAt: new Date(),
      },
      'session1'
    );
    expect(payload.sessionId).toBe('session1');
    expect(payload.enterpriseReport.version).toBe(1);
    expect(payload.enterpriseReport.overallScore).toBe(77);
  });

  it('omits enterpriseReport when absent', () => {
    const payload = serializeInterviewReport(
      {
        sourceType: 'mock_interview',
        sourceId: 'abc',
        overallScore: 50,
        sections: {},
        strengths: [],
        improvementAreas: [],
        recommendedNextSteps: [],
      },
      's2'
    );
    expect(payload.enterpriseReport).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import {
  WORKFLOW_PHASES,
  canShowDownloadPdf,
  getPhaseActions,
  isRewriteGatePending,
  resolveInitialAnalysisPhase,
} from './workflowPhases';

describe('workflowPhases', () => {
  it('opens rewrite gate when pending review', () => {
    expect(
      resolveInitialAnalysisPhase({
        analysisMode: 'rewrite',
        rewriteStatus: 'pending_review',
      })
    ).toBe(WORKFLOW_PHASES.REWRITE_GATE);
    expect(
      isRewriteGatePending({
        analysisMode: 'rewrite',
        rewriteStatus: 'pending_review',
      })
    ).toBe(true);
  });

  it('defaults to improve for optimize analyses', () => {
    expect(
      resolveInitialAnalysisPhase({
        analysisMode: 'optimize',
        rewriteStatus: 'none',
      })
    ).toBe(WORKFLOW_PHASES.IMPROVE);
  });

  it('restores done when already finalized', () => {
    expect(
      resolveInitialAnalysisPhase({
        analysisMode: 'optimize',
        rewriteStatus: 'none',
        finalizedAt: '2026-01-01T00:00:00.000Z',
      })
    ).toBe(WORKFLOW_PHASES.DONE);
  });

  it('shows Download PDF only on Finalize/Done when canDownloadPdf', () => {
    const ready = { canDownloadPdf: true };
    expect(canShowDownloadPdf(WORKFLOW_PHASES.IMPROVE, ready)).toBe(false);
    expect(canShowDownloadPdf(WORKFLOW_PHASES.REWRITE_GATE, ready)).toBe(false);
    expect(canShowDownloadPdf(WORKFLOW_PHASES.FINALIZE, ready)).toBe(true);
    expect(canShowDownloadPdf(WORKFLOW_PHASES.DONE, ready)).toBe(true);
    expect(canShowDownloadPdf(WORKFLOW_PHASES.DONE, { canDownloadPdf: false })).toBe(false);

    expect(getPhaseActions(WORKFLOW_PHASES.IMPROVE).showDownloadPdf).toBe(false);
    expect(getPhaseActions(WORKFLOW_PHASES.FINALIZE).showFinish).toBe(true);
  });
});

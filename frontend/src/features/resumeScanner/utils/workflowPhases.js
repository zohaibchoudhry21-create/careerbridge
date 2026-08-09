/**
 * Approved Resume Scanner workflow phases (FE).
 *
 * Setup / Processing live on the upload page.
 * Analysis page owns: rewrite_gate → improve → finalize → done
 */

export const WORKFLOW_PHASES = {
  SETUP: 'setup',
  PROCESSING: 'processing',
  REWRITE_GATE: 'rewrite_gate',
  IMPROVE: 'improve',
  FINALIZE: 'finalize',
  DONE: 'done',
};

export const ANALYSIS_PHASE_ORDER = [
  WORKFLOW_PHASES.REWRITE_GATE,
  WORKFLOW_PHASES.IMPROVE,
  WORKFLOW_PHASES.FINALIZE,
  WORKFLOW_PHASES.DONE,
];

/** Phases shown in the analysis-page rail (rewrite gate only when active). */
export const getVisibleAnalysisPhases = (includeRewriteGate) => {
  const base = [
    WORKFLOW_PHASES.IMPROVE,
    WORKFLOW_PHASES.FINALIZE,
    WORKFLOW_PHASES.DONE,
  ];
  return includeRewriteGate ? [WORKFLOW_PHASES.REWRITE_GATE, ...base] : base;
};

export const isRewriteGatePending = (analysis) =>
  analysis?.analysisMode === 'rewrite' && analysis?.rewriteStatus === 'pending_review';

/**
 * Resolve the initial analysis-page phase from server state.
 */
export const resolveInitialAnalysisPhase = (analysis) => {
  if (!analysis) return WORKFLOW_PHASES.IMPROVE;
  if (isRewriteGatePending(analysis)) return WORKFLOW_PHASES.REWRITE_GATE;
  if (analysis.finalizedAt) return WORKFLOW_PHASES.DONE;
  return WORKFLOW_PHASES.IMPROVE;
};

/**
 * Download PDF only when server says a finalized snapshot exists,
 * and only on Finalize / Done (never Setup / Processing / Improve / Gate).
 */
export const canShowDownloadPdf = (phase, analysis) => {
  if (!analysis?.canDownloadPdf) return false;
  return phase === WORKFLOW_PHASES.FINALIZE || phase === WORKFLOW_PHASES.DONE;
};

/** Actions allowed per phase. */
export const PHASE_ACTIONS = {
  [WORKFLOW_PHASES.REWRITE_GATE]: {
    showAcceptRewrite: true,
    showRejectRewrite: true,
    showAcceptAll: false,
    showUndoRedo: false,
    showContinue: false,
    showFinish: false,
    showNewAnalysis: true,
    showWorkspaceTabs: false,
    showDownloadPdf: false,
  },
  [WORKFLOW_PHASES.IMPROVE]: {
    showAcceptRewrite: false,
    showRejectRewrite: false,
    showAcceptAll: true,
    showUndoRedo: true,
    showContinue: true,
    showFinish: false,
    showNewAnalysis: true,
    showWorkspaceTabs: true,
    showDownloadPdf: false,
  },
  [WORKFLOW_PHASES.FINALIZE]: {
    showAcceptRewrite: false,
    showRejectRewrite: false,
    showAcceptAll: false,
    showUndoRedo: true,
    showContinue: false,
    showFinish: true,
    showNewAnalysis: true,
    showWorkspaceTabs: true,
    showDownloadPdf: true, // gated further by canShowDownloadPdf()
  },
  [WORKFLOW_PHASES.DONE]: {
    showAcceptRewrite: false,
    showRejectRewrite: false,
    showAcceptAll: false,
    showUndoRedo: false,
    showContinue: false,
    showFinish: false,
    showNewAnalysis: true,
    showWorkspaceTabs: false,
    showDownloadPdf: true, // gated further by canShowDownloadPdf()
  },
};

export const getPhaseActions = (phase) =>
  PHASE_ACTIONS[phase] || PHASE_ACTIONS[WORKFLOW_PHASES.IMPROVE];

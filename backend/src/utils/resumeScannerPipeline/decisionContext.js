/**
 * DecisionContext — immutable result of a single Decision Engine run.
 * Downstream stages (plan / rewrite / validate) must reuse this object;
 * they must never re-run understanding or decide.
 */

/**
 * Build a full in-memory DecisionContext from pipeline pass outputs.
 */
export const createDecisionContext = ({
  understanding,
  facts,
  jd,
  similarity,
  decision,
  analyzeResult = null,
} = {}) => {
  const mode = decision?.mode === 'rewrite' ? 'rewrite' : 'optimize';

  return Object.freeze({
    mode,
    reason: decision?.reason || null,
    confidence: Number(decision?.confidence) || 0,
    signals: Object.freeze({ ...(decision?.signals || {}) }),
    understanding,
    facts,
    jd,
    similarity,
    decision: Object.freeze({
      mode,
      reason: decision?.reason || null,
      confidence: Number(decision?.confidence) || 0,
      signals: { ...(decision?.signals || {}) },
    }),
    analyzeResultRef: analyzeResult,
    nodeCount: Number(understanding?.nodeCount) || 0,
    decidedAt: new Date().toISOString(),
  });
};

/**
 * Compact snapshot safe to persist on AtsAnalysis (no large node/fact payloads).
 */
export const serializeDecisionContext = (decisionContext) => {
  if (!decisionContext) return null;

  return {
    mode: decisionContext.mode,
    reason: decisionContext.reason || '',
    confidence: Number(decisionContext.confidence) || 0,
    signals: { ...(decisionContext.signals || {}) },
    similarity: {
      overallSimilarity: Number(decisionContext.similarity?.overallSimilarity) || 0,
      keywordCoverage: Number(decisionContext.similarity?.keywordCoverage) || 0,
      aiRelevance: Number(decisionContext.similarity?.aiRelevance) || 0,
      domainAligned: Boolean(decisionContext.similarity?.domainAligned),
      rewriteRecommended: Boolean(decisionContext.similarity?.rewriteRecommended),
    },
    nodeCount: Number(decisionContext.nodeCount) || 0,
    decidedAt: decisionContext.decidedAt || new Date().toISOString(),
  };
};

export const isRewriteDecision = (decisionContext) =>
  decisionContext?.mode === 'rewrite' || decisionContext?.decision?.mode === 'rewrite';

/**
 * Decision Engine — runs exactly once per analysis job.
 *
 * Stages (deterministic, 0 LLM):
 *   Resume Understanding → Facts → JD Understanding → Similarity → Decide
 *
 * Returns a frozen DecisionContext for all downstream services.
 */

import { createDecisionContext } from './decisionContext.js';
import { runDecidePass } from './decidePass.js';
import { runFactsPass } from './factsPass.js';
import { runJdPass } from './jdPass.js';
import { runSimilarityPass } from './similarityPass.js';
import { runUnderstandPass } from './understandPass.js';

/**
 * @returns {Readonly<object>} DecisionContext
 */
export const runDecisionEngine = ({
  resumeText,
  structuredResume,
  parsedData = null,
  jobDescriptionText,
  jobTitle = '',
  analyzeResult = null,
} = {}) => {
  // 1. Resume Understanding — dynamic node inspection (no hardcoded section list)
  const understanding = runUnderstandPass({
    resumeText,
    structuredResume,
    parsedData,
  });

  // 2. Fact ledger (content-aware)
  const facts = runFactsPass(understanding);

  // 3. Job Description Understanding (reuses Analysis skills/signals — no extra LLM)
  const jd = runJdPass({
    jobDescriptionText,
    jobTitle,
    skills: analyzeResult?.skills || [],
    analyzeResult,
  });

  // 4. Similarity
  const similarity = runSimilarityPass({
    understanding,
    facts,
    jd,
    analyzeResult,
  });

  // 5. Decide once
  const decision = runDecidePass({
    similarity,
    skills: analyzeResult?.skills || [],
  });

  return createDecisionContext({
    understanding,
    facts,
    jd,
    similarity,
    decision,
    analyzeResult,
  });
};

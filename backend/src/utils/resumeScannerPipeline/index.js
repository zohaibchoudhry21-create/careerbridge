/**
 * Resume Scanner AI Pipeline
 *
 * Separation of concerns:
 *   Analysis     → external (analyzeResumeAgainstJob) — 1 LLM
 *   Decision     → runDecisionEngine — once, 0 LLM → DecisionContext
 *   Planning     → runPlanPass — 0–1 LLM
 *   Rewrite      → runRewritePass — 1 LLM (+ regen)
 *   Validation   → runValidationPipeline (centralized) — 0 LLM
 *
 * DecisionContext is shared; Decision Engine must not re-run inside rewrite.
 */

import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import {
  normalizeParsedData,
  structuredResumeToParsedData,
} from '../resumeScannerParsedData.js';
import { AppError } from '../sendResponse.js';
import { isRewriteDecision } from './decisionContext.js';
import { runPlanPass } from './planPass.js';
import { runRewritePass } from './rewritePass.js';
import {
  MAX_REWRITE_VALIDATION_ATTEMPTS,
  buildValidationFailureFeedback,
  runValidationPipeline,
  shouldRetryValidation,
} from './validation/index.js';

/**
 * Planning + Rewrite + Validation only.
 * Requires a DecisionContext from a prior single Decision Engine run.
 */
export const runRewriteFromDecisionContext = async ({
  decisionContext,
  parsedData = null,
  jobDescriptionText,
  onProgress = null,
  enrichPlanWithLlm = true,
} = {}) => {
  if (!decisionContext) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);
  }

  const notify = async (progress, statusMessage) => {
    if (typeof onProgress === 'function') {
      await onProgress({ progress, statusMessage });
    }
  };

  if (!isRewriteDecision(decisionContext)) {
    return {
      mode: 'optimize',
      decisionContext,
      ...decisionContext,
      rewrittenResume: null,
    };
  }

  const { understanding, facts, jd, similarity, decision } = decisionContext;

  await notify(58, 'Extracting candidate facts & JD signals...');
  await notify(62, 'Planning full ATS rewrite...');

  // Planning (shared DecisionContext — no re-understand / re-decide)
  const { plan } = await runPlanPass({
    understanding,
    facts,
    jd,
    similarity,
    enrichWithLlm: enrichPlanWithLlm,
  });

  let lastValidation = null;
  let rewriteRaw = null;
  let provider = 'none';
  let validationFeedback = null;

  for (let attempt = 0; attempt < MAX_REWRITE_VALIDATION_ATTEMPTS; attempt += 1) {
    await notify(
      68 + attempt * 4,
      attempt === 0
        ? 'Rewriting every discovered resume section...'
        : `Regenerating rewrite (attempt ${attempt + 1})...`
    );

    // Dynamic rewrite — iterates discovered nodes; retries include validation feedback
    const rewriteResult = await runRewritePass({
      understanding,
      facts,
      jd,
      plan,
      jobDescriptionText,
      validationFeedback,
    });
    rewriteRaw = rewriteResult.raw;
    provider = rewriteResult.provider;

    await notify(80, 'Validating rewrite (facts, structure, ATS, quality, diff)...');
    lastValidation = runValidationPipeline({
      understanding,
      facts,
      originalStructured: understanding.structured,
      originalParsed: parsedData,
      rewriteRaw,
    });

    if (lastValidation.valid) break;

    console.warn(
      '[resume-scanner-pipeline] validation failed, retrying:',
      lastValidation.hardFailures,
      lastValidation.details?.diff?.issues,
      lastValidation.details?.quality?.issues
    );

    if (!shouldRetryValidation(lastValidation, attempt)) break;
    validationFeedback = buildValidationFailureFeedback(lastValidation);
  }

  if (!lastValidation?.valid || !lastValidation.rewrittenStructured) {
    if (!lastValidation?.rewrittenStructured) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);
    }
    console.warn(
      '[resume-scanner-pipeline] accepting rewrite with validation warnings:',
      lastValidation.hardFailures
    );
  }

  const rewrittenStructured = lastValidation.rewrittenStructured;
  const rewrittenText = lastValidation.rewrittenText;
  const parsed = normalizeParsedData(
    parsedData || structuredResumeToParsedData(understanding.structured, parsedData)
  );

  const rewrittenParsedData = structuredResumeToParsedData(rewrittenStructured, {
    ...parsed,
    projects: (rewrittenStructured.projects || []).map((p) => ({
      name: p.name,
      description: p.description,
      technologies: p.technologies,
      startDate: '',
      endDate: p.duration,
      link: '',
    })),
    certifications: rewrittenStructured.certifications?.length
      ? rewrittenStructured.certifications
      : parsed.certifications,
  });

  await notify(88, 'Rewrite validated and ready for review...');

  const validationNotes = !lastValidation.valid
    ? [
      `Validation warnings after retries: ${(lastValidation.hardFailures || []).join(', ') || 'unknown'}`,
    ]
    : [];

  return {
    mode: 'rewrite',
    provider,
    decisionContext,
    understanding,
    facts,
    jd,
    similarity,
    decision,
    plan,
    validation: lastValidation,
    rewrittenResume: rewrittenStructured,
    rewrittenParsedData,
    rewrittenText,
    rewriteNotes: [
      ...(rewriteRaw?.rewriteNotes || []),
      `Rewrote ${understanding.nodeCount} discovered sections dynamically`,
      `Decision: ${decision.reason || 'rewrite'} (confidence ${Math.round(
        (decision.confidence || 0) * 100
      )}%)`,
      ...validationNotes,
    ].slice(0, 12),
  };
};

/**
 * Full rewrite entry: uses provided DecisionContext, or builds one once if missing.
 * Never runs the Decision Engine twice.
 */
export const runFullRewritePipeline = async ({
  resumeText,
  structuredResume,
  parsedData = null,
  jobDescriptionText,
  jobTitle = '',
  analyzeResult = null,
  decisionContext = null,
  onProgress = null,
  enrichPlanWithLlm = true,
} = {}) => {
  const notify = async (progress, statusMessage) => {
    if (typeof onProgress === 'function') {
      await onProgress({ progress, statusMessage });
    }
  };

  let context = decisionContext;

  if (!context) {
    await notify(52, 'Understanding resume structure...');
    context = runDecisionEngine({
      resumeText,
      structuredResume,
      parsedData,
      jobDescriptionText,
      jobTitle,
      analyzeResult,
    });
  }

  return runRewriteFromDecisionContext({
    decisionContext: context,
    parsedData,
    jobDescriptionText,
    onProgress,
    enrichPlanWithLlm,
  });
};

export { createDecisionContext, serializeDecisionContext, isRewriteDecision } from './decisionContext.js';
export { runDecisionEngine } from './decisionEngine.js';
export { runDecidePass } from './decidePass.js';
export { runFactsPass } from './factsPass.js';
export { runJdPass } from './jdPass.js';
export { runPlanPass } from './planPass.js';
export { runRewritePass } from './rewritePass.js';
export { runSimilarityPass } from './similarityPass.js';
export { runUnderstandPass } from './understandPass.js';
export { runValidatePass } from './validatePass.js';
export {
  runValidationPipeline,
  validateFacts,
  validateStructure,
  validateAts,
  validateQuality,
  validateDiff,
  validateRewriteQuality,
  MAX_REWRITE_VALIDATION_ATTEMPTS,
} from './validation/index.js';

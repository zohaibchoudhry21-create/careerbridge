/**
 * Public façade for Full Rewrite Mode.
 * Delegates to plan → rewrite → validate using a shared DecisionContext.
 */

import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { sanitizeResumeScannerText } from './resumeScannerTextUtils.js';
import { AppError } from './sendResponse.js';
import { runFullRewritePipeline } from './resumeScannerPipeline/index.js';

/**
 * Generate a complete ATS-optimized rewrite of the resume aligned to the JD.
 * Prefer passing `decisionContext` from a prior single Decision Engine run.
 */
export const rewriteResumeFromJD = async ({
  resumeText,
  structuredResume,
  parsedData = null,
  jobDescriptionText,
  jobTitle = '',
  targetSkills = [],
  analyzeResult = null,
  decisionContext = null,
  onProgress = null,
  enrichPlanWithLlm = true,
} = {}) => {
  const cleanResume = sanitizeResumeScannerText(resumeText);
  const cleanJobDescription = sanitizeResumeScannerText(jobDescriptionText);

  if (!cleanResume) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
  }

  if (!cleanJobDescription) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED, 400);
  }

  const analyze =
    analyzeResult ||
    (targetSkills?.length
      ? {
          skills: targetSkills,
          jobTitle,
          jobMatchBreakdown: {},
        }
      : null);

  const result = await runFullRewritePipeline({
    resumeText: cleanResume,
    structuredResume,
    parsedData,
    jobDescriptionText: cleanJobDescription,
    jobTitle: jobTitle.trim(),
    analyzeResult: analyze,
    decisionContext,
    onProgress,
    enrichPlanWithLlm,
  });

  if (result.mode !== 'rewrite' || !result.rewrittenResume) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);
  }

  return {
    provider: result.provider,
    rewrittenResume: result.rewrittenResume,
    rewrittenParsedData: result.rewrittenParsedData,
    rewrittenText: result.rewrittenText,
    rewriteNotes: result.rewriteNotes || [],
    factValidation: result.validation?.details?.facts ||
      result.validation?.details?.factLegacy || { valid: true, violations: [] },
    decisionContext: result.decisionContext,
    pipeline: {
      decision: result.decision,
      similarity: result.similarity,
      nodeCount: result.understanding?.nodeCount,
      validation: {
        valid: result.validation?.valid,
        hardFailures: result.validation?.hardFailures || [],
        quality: result.validation?.details?.quality || null,
      },
    },
  };
};

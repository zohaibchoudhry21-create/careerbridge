/**
 * Public surface for the centralized Resume Scanner Validation pipeline.
 */

import { validateDiff } from './diffValidation.js';
import { validateQuality } from './qualityValidation.js';

export {
  MAX_REWRITE_VALIDATION_ATTEMPTS,
  buildValidationFailureFeedback,
  shouldRetryValidation,
} from './retryStrategy.js';
export { runValidationPipeline } from './validationService.js';
export {
  validateFacts,
  extractFactualAnchors,
  validateRewritePreservesFacts,
} from './factValidation.js';
export { validateStructure, validateStructuralCoverage } from './structuralValidation.js';
export { validateAts, validateAtsQuality } from './atsValidation.js';
export { validateQuality } from './qualityValidation.js';
export { validateDiff } from './diffValidation.js';
export {
  normalizeRewrittenResume,
  ensureAllDetectedSectionsRewritten,
} from './normalizeRewrite.js';

/** Compatibility: quality + diff combined (legacy pipeline tests). */
export const validateRewriteQuality = (originalText, rewrittenText) => {
  const quality = validateQuality(originalText, rewrittenText);
  const diff = validateDiff(originalText, rewrittenText);
  return {
    valid: quality.valid && diff.valid,
    issues: [...(quality.issues || []), ...(diff.issues || [])],
    similarity: diff.similarity,
    novelty: diff.novelty,
  };
};

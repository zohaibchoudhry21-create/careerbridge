/**
 * Compatibility shim — Validation lives in ./validation/
 * Prefer: import { runValidationPipeline } from './validation/index.js'
 */

export {
  runValidationPipeline as runValidatePass,
  validateAtsQuality,
  validateRewriteQuality,
  validateStructuralCoverage,
  validateFacts as validateFactLedger,
  validateStructure,
  validateAts,
  validateDiff,
  validateQuality,
} from './validation/index.js';

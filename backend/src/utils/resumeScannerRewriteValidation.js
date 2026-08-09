/**
 * Compatibility façade — rewrite normalization + fact anchors.
 * Canonical implementation: resumeScannerPipeline/validation/
 */

export {
  extractFactualAnchors,
  validateRewritePreservesFacts,
  normalizeRewrittenResume,
  ensureAllDetectedSectionsRewritten,
} from './resumeScannerPipeline/validation/index.js';

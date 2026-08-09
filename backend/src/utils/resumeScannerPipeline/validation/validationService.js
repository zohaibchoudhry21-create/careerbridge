/**
 * Centralized Validation Service
 *
 * Ordered hard gates (single responsibility each):
 *   1. Fact Validation
 *   2. Structural Validation
 *   3. ATS Validation
 *   4. Quality Validation
 *   5. Diff Validation
 *
 * Callers must not scatter ad-hoc validators outside this service.
 */

import { generateAtsText } from '../../structuredResume.js';
import { validateAts } from './atsValidation.js';
import { validateDiff } from './diffValidation.js';
import { validateFacts } from './factValidation.js';
import {
  ensureAllDetectedSectionsRewritten,
  normalizeRewrittenResume,
} from './normalizeRewrite.js';
import { validateQuality } from './qualityValidation.js';
import { validateStructure } from './structuralValidation.js';

/**
 * Run the full validation pipeline against a rewrite model payload.
 */
export const runValidationPipeline = ({
  understanding,
  facts,
  originalStructured,
  originalParsed,
  rewriteRaw,
} = {}) => {
  let rewrittenStructured = normalizeRewrittenResume(rewriteRaw, originalStructured);
  rewrittenStructured = ensureAllDetectedSectionsRewritten(
    originalStructured,
    rewrittenStructured
  );
  const rewrittenText = generateAtsText(rewrittenStructured);
  const originalText = understanding?.resumeText || generateAtsText(originalStructured);

  const factsResult = validateFacts({
    facts,
    originalStructured,
    originalParsed,
    rewrittenStructured,
    rewrittenText,
  });
  const structure = validateStructure(understanding, rewrittenStructured);
  const ats = validateAts(rewrittenStructured, rewrittenText);
  const quality = validateQuality(originalText, rewrittenText);
  const diff = validateDiff(originalText, rewrittenText);

  const hardFailures = [
    ...(!factsResult.valid ? ['facts'] : []),
    ...(!structure.valid ? ['structure'] : []),
    ...(!ats.valid ? ['ats'] : []),
    ...(!quality.valid ? ['quality'] : []),
    ...(!diff.valid ? ['diff'] : []),
  ];

  return {
    valid: hardFailures.length === 0,
    hardFailures,
    rewrittenStructured,
    rewrittenText,
    details: {
      facts: factsResult,
      structure,
      ats,
      quality,
      diff,
      // Backward-compatible aliases used by older callers/tests
      factLedger: factsResult,
      factLegacy: factsResult,
      qualityCombined: {
        valid: quality.valid && diff.valid,
        issues: [...(quality.issues || []), ...(diff.issues || [])],
        similarity: diff.similarity,
        novelty: diff.novelty,
      },
    },
  };
};

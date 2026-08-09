/**
 * Validation retry strategy for rewrite regeneration.
 */

export const MAX_REWRITE_VALIDATION_ATTEMPTS = 3;

/**
 * Build structured feedback injected into the next rewrite prompt.
 */
export const buildValidationFailureFeedback = (validation) => {
  if (!validation || validation.valid) return null;

  const details = validation.details || {};
  const lines = [
    'Previous rewrite FAILED validation. Regenerate a complete rewrite that fixes ALL issues below.',
    `Hard failures: ${(validation.hardFailures || []).join(', ') || 'unknown'}`,
  ];

  if (details.facts?.violations?.length) {
    lines.push(
      'Missing facts (must preserve): ' +
        details.facts.violations
          .slice(0, 12)
          .map((v) => `${v.field}=${v.value}`)
          .join('; ')
    );
  }

  if (details.structure?.missing?.length) {
    lines.push(
      'Missing sections/nodes: ' +
        details.structure.missing
          .slice(0, 8)
          .map((m) => m.heading || m.type)
          .join(', ')
    );
  }

  if (details.ats?.issues?.length) {
    lines.push(`ATS issues: ${details.ats.issues.join(', ')}`);
  }

  if (details.quality?.issues?.length) {
    lines.push(`Quality issues: ${details.quality.issues.join(', ')}`);
  }

  if (details.diff?.issues?.length) {
    lines.push(
      `Diff issues: ${details.diff.issues.join(', ')} (rewrite substantially — avoid superficial edits; similarity=${details.diff.similarity}, novelty=${details.diff.novelty})`
    );
  }

  lines.push(
    'Rules reminder: preserve all candidate facts; rewrite descriptive content deeply; keep ATS-friendly structure with clear bullets.'
  );

  return {
    hardFailures: [...(validation.hardFailures || [])],
    attemptHint: lines.join('\n'),
  };
};

export const shouldRetryValidation = (validation, attemptIndex) => {
  if (!validation) return true;
  if (validation.valid) return false;
  return attemptIndex + 1 < MAX_REWRITE_VALIDATION_ATTEMPTS;
};

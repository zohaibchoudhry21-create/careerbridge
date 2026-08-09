/**
 * Structural Validation — every discovered editable node must remain present.
 * Node-driven (not hardcoded section-name lists as the sole truth).
 */

export const validateStructure = (understanding, rewrittenStructured) => {
  const expected = (understanding?.nodes || []).filter((n) => n.editable);
  const order = rewrittenStructured?.sectionOrder || [];
  const additional = rewrittenStructured?.additionalSections || [];

  const presentTypes = new Set([
    ...(rewrittenStructured?.summary ? ['summary'] : []),
    ...(rewrittenStructured?.workExperience?.length ? ['experience'] : []),
    ...(rewrittenStructured?.education?.length ? ['education'] : []),
    ...(rewrittenStructured?.skills?.length ? ['skills'] : []),
    ...(rewrittenStructured?.projects?.length ? ['projects'] : []),
    ...(rewrittenStructured?.certifications?.length ? ['certifications'] : []),
    ...(rewrittenStructured?.achievements?.length ? ['achievements'] : []),
    ...(rewrittenStructured?.languages?.length ? ['languages'] : []),
    ...additional.map((s) => s.type),
    ...order.map((s) => s.type),
  ]);

  const missing = expected.filter((node) => {
    if (presentTypes.has(node.type)) return false;
    return !additional.some(
      (s) =>
        String(s.heading || '').toLowerCase() === String(node.heading || '').toLowerCase()
    );
  });

  return {
    id: 'structure',
    valid: missing.length === 0,
    missing: missing.map((m) => ({ id: m.id, heading: m.heading, type: m.type })),
  };
};

/** @deprecated Prefer validateStructure */
export const validateStructuralCoverage = validateStructure;

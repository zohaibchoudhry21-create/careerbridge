/**
 * Rewrite output normalization (not a validator).
 * Converts model JSON → structuredResume and restores dropped nodes.
 */

import {
  buildStructuredResumeFromRewrittenSections,
  structuredResumeToRewriteSections,
} from '../../resumeScannerSectionDetect.js';
import { cloneStructuredResume } from '../../structuredResume.js';
import { normalizeToken } from './textMetrics.js';

export const normalizeRewrittenResume = (rewritten = {}, fallbackOriginal = null) => {
  if (Array.isArray(rewritten.sections) && rewritten.sections.length) {
    return cloneStructuredResume(
      buildStructuredResumeFromRewrittenSections({
        name: rewritten.name,
        contact: rewritten.contact,
        sections: rewritten.sections,
      })
    );
  }

  return cloneStructuredResume({
    name: rewritten.name,
    contact: rewritten.contact,
    summary: rewritten.summary,
    workExperience: rewritten.workExperience,
    education: rewritten.education,
    skills: rewritten.skills,
    languages: rewritten.languages,
    projects: rewritten.projects,
    certifications: rewritten.certifications,
    achievements: rewritten.achievements,
    additionalSections: fallbackOriginal?.additionalSections || [],
    sectionOrder: fallbackOriginal?.sectionOrder || [],
  });
};

/**
 * If the model dropped a discovered section, restore original content for that node.
 */
export const ensureAllDetectedSectionsRewritten = (originalStructured, rewrittenStructured) => {
  const original = cloneStructuredResume(originalStructured);
  const rewritten = cloneStructuredResume(rewrittenStructured);
  const originalSections = structuredResumeToRewriteSections(original).sections;
  const rewrittenSections = structuredResumeToRewriteSections(rewritten).sections;

  if (!originalSections.length) return rewritten;

  const rewrittenByKey = new Map(
    rewrittenSections.map((s) => [`${s.type}::${normalizeToken(s.heading)}`, s])
  );

  const merged = [];
  for (const originalSection of originalSections) {
    const key = `${originalSection.type}::${normalizeToken(originalSection.heading)}`;
    const match =
      rewrittenByKey.get(key) ||
      rewrittenSections.find((s) => s.type === originalSection.type && s.type !== 'custom');

    if (match) {
      merged.push({
        ...match,
        id: originalSection.id,
        heading: originalSection.heading || match.heading,
        type: originalSection.type,
      });
      rewrittenByKey.delete(`${match.type}::${normalizeToken(match.heading)}`);
    } else {
      merged.push(originalSection);
    }
  }

  return cloneStructuredResume(
    buildStructuredResumeFromRewrittenSections({
      name: rewritten.name || original.name,
      contact: {
        email: rewritten.contact?.email || original.contact?.email,
        phone: rewritten.contact?.phone || original.contact?.phone,
        address: rewritten.contact?.address || original.contact?.address,
      },
      sections: merged,
    })
  );
};

/**
 * ATS Validation — searchable, non-empty, contact + core content present.
 */

import { hasStructuredResumeData } from '../../structuredResume.js';
import { clampScore } from '../../resumeScannerTextUtils.js';

export const validateAts = (rewrittenStructured, rewrittenText) => {
  const issues = [];

  if (!hasStructuredResumeData(rewrittenStructured)) {
    issues.push('empty_structured_resume');
  }
  if (!String(rewrittenText || '').trim()) {
    issues.push('empty_resume_text');
  }
  if (!rewrittenStructured?.contact?.email && !/@/.test(rewrittenText || '')) {
    issues.push('missing_email');
  }

  const hasCore =
    Boolean(rewrittenStructured?.summary) ||
    (rewrittenStructured?.workExperience || []).length > 0 ||
    (rewrittenStructured?.skills || []).length > 0;
  if (!hasCore) {
    issues.push('missing_core_content');
  }

  // Prefer bullet-style experience for ATS parsers when experience exists
  const jobs = rewrittenStructured?.workExperience || [];
  if (jobs.length > 0) {
    const withBullets = jobs.filter((j) => (j.bullets || []).some((b) => String(b).trim()));
    if (withBullets.length === 0) {
      issues.push('experience_missing_bullets');
    }
  }

  return {
    id: 'ats',
    valid: issues.length === 0,
    issues,
    score: clampScore(100 - issues.length * 20),
  };
};

/** @deprecated Prefer validateAts */
export const validateAtsQuality = validateAts;

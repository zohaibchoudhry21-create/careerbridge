/**
 * Fact Validation — single responsibility: preserve candidate-owned facts.
 * Content-aware (fact ledger) + structured anchors (companies, schools, etc.).
 */

import { normalizeParsedData } from '../../resumeScannerParsedData.js';
import {
  structuredResumeToRewriteSections,
} from '../../resumeScannerSectionDetect.js';
import { cloneStructuredResume, generateAtsText } from '../../structuredResume.js';
import { containsNormalized, normalizeToken } from './textMetrics.js';

const collectUnique = (values = []) => {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const trimmed = String(value || '').trim();
    if (!trimmed) continue;
    const key = normalizeToken(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
};

export const extractFactualAnchors = (structuredResume = {}, parsedData = null) => {
  const structured = cloneStructuredResume(structuredResume);
  const parsed = normalizeParsedData(parsedData || {});

  return {
    companies: collectUnique([
      ...structured.workExperience.map((j) => j.company),
      ...parsed.experience.map((e) => e.company),
    ]),
    titles: collectUnique([
      ...structured.workExperience.map((j) => j.title),
      ...parsed.experience.map((e) => e.position),
    ]),
    durations: collectUnique([
      ...structured.workExperience.map((j) => j.duration),
      ...structured.education.map((e) => e.duration),
      ...parsed.experience.map((e) => `${e.startDate} ${e.endDate}`.trim()),
      ...parsed.education.map((e) => `${e.startDate} ${e.endDate}`.trim()),
    ]),
    institutions: collectUnique([
      ...structured.education.map((e) => e.institution),
      ...parsed.education.map((e) => e.institution),
    ]),
    degrees: collectUnique([
      ...structured.education.map((e) => e.degree),
      ...parsed.education.map((e) => e.degree),
    ]),
    projectNames: collectUnique([
      ...structured.projects.map((p) => p.name),
      ...parsed.projects.map((p) => p.name),
    ]),
    certifications: collectUnique([
      ...(structured.certifications || []),
      ...parsed.certifications,
    ]),
    additionalHeadings: collectUnique(
      (structured.additionalSections || []).map((s) => s.heading)
    ),
    contactEmail: structured.contact.email || parsed.email,
    contactPhone: structured.contact.phone || parsed.phone,
    name: structured.name || parsed.fullName,
    sectionCount: structuredResumeToRewriteSections(structured).sections.length,
  };
};

const findMissingAnchors = (rewrittenText, anchors = [], label = '') => {
  const missing = anchors.filter((anchor) => !containsNormalized(rewrittenText, anchor));
  return missing.map((value) => ({ field: label, value, source: 'anchor' }));
};

const tokenPresent = (text, needle) => {
  const n = String(needle || '').trim();
  if (!n) return true;
  const lower = text.toLowerCase();
  if (lower.includes(n.toLowerCase())) return true;
  const parts = n.split(/\s+/).filter((p) => p.length >= 4);
  return parts.length ? parts.every((p) => lower.includes(p.toLowerCase())) : false;
};

/**
 * Unified fact gate: ledger tokens + structured anchors + role counts.
 */
export const validateFacts = ({
  facts = null,
  originalStructured = null,
  originalParsed = null,
  rewrittenStructured = null,
  rewrittenText = '',
} = {}) => {
  const text = String(rewrittenText || generateAtsText(rewrittenStructured || {}) || '');
  const violations = [];

  // Content-aware ledger
  const mustKeep = [
    facts?.identity?.name,
    facts?.identity?.email,
    ...(facts?.entities || []).slice(0, 30),
  ].filter(Boolean);

  for (const token of mustKeep) {
    if (!tokenPresent(text, token)) {
      violations.push({ field: 'fact', value: String(token), source: 'ledger' });
    }
  }

  for (const year of (facts?.dates || []).flatMap(
    (d) => String(d).match(/\b(?:19|20)\d{2}\b/g) || []
  )) {
    if (!text.includes(year)) {
      violations.push({ field: 'date', value: year, source: 'ledger' });
    }
  }

  // Structured anchors (companies, schools, identity)
  if (originalStructured) {
    const anchors = extractFactualAnchors(originalStructured, originalParsed);
    violations.push(...findMissingAnchors(text, anchors.companies, 'company'));
    violations.push(...findMissingAnchors(text, anchors.titles, 'title'));
    violations.push(...findMissingAnchors(text, anchors.institutions, 'institution'));
    violations.push(...findMissingAnchors(text, anchors.degrees, 'degree'));
    violations.push(...findMissingAnchors(text, anchors.projectNames, 'project'));
    violations.push(...findMissingAnchors(text, anchors.certifications, 'certification'));

    if (anchors.contactEmail && !containsNormalized(text, anchors.contactEmail)) {
      violations.push({ field: 'email', value: anchors.contactEmail, source: 'anchor' });
    }
    if (anchors.name && !containsNormalized(text, anchors.name)) {
      violations.push({ field: 'name', value: anchors.name, source: 'anchor' });
    }

    for (const duration of anchors.durations) {
      const yearMatch = duration.match(/\b(19|20)\d{2}\b/g);
      if (yearMatch?.length) {
        const hasYear = yearMatch.some((year) => text.includes(year));
        if (!hasYear) {
          violations.push({ field: 'duration', value: duration, source: 'anchor' });
        }
      }
    }

    const rewritten = rewrittenStructured || {};
    const origJobs = anchors.companies.length;
    const rewriteJobs = (rewritten.workExperience || []).filter((j) => j.company?.trim()).length;
    if (origJobs > 0 && rewriteJobs < origJobs) {
      violations.push({
        field: 'workExperience',
        value: `Expected ${origJobs} roles, got ${rewriteJobs}`,
        source: 'anchor',
      });
    }

    const origEd = anchors.institutions.length;
    const rewriteEd = (rewritten.education || []).filter((e) => e.institution?.trim()).length;
    if (origEd > 0 && rewriteEd < origEd) {
      violations.push({
        field: 'education',
        value: `Expected ${origEd} entries, got ${rewriteEd}`,
        source: 'anchor',
      });
    }

    for (const heading of anchors.additionalHeadings) {
      const rewrittenHeadings = (rewritten.additionalSections || []).map((s) => s.heading);
      const hasHeading = rewrittenHeadings.some((h) => containsNormalized(h, heading));
      if (!hasHeading && !containsNormalized(text, heading)) {
        violations.push({ field: 'additionalSection', value: heading, source: 'anchor' });
      }
    }
  }

  // Dedupe identical violations
  const seen = new Set();
  const uniqueViolations = [];
  for (const v of violations) {
    const key = `${v.field}::${normalizeToken(v.value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueViolations.push(v);
  }

  return {
    id: 'facts',
    valid: uniqueViolations.length === 0,
    violations: uniqueViolations,
  };
};

/** @deprecated Use validateFacts — kept for existing tests */
export const validateRewritePreservesFacts = (
  originalStructured,
  originalParsed,
  rewritten
) => {
  const result = validateFacts({
    originalStructured,
    originalParsed,
    rewrittenStructured: rewritten,
    rewrittenText: generateAtsText(rewritten || {}),
  });
  return {
    valid: result.valid,
    violations: result.violations,
  };
};

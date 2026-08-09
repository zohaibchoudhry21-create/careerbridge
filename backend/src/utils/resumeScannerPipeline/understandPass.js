/**
 * Pass 1 — Resume Understanding
 * Dynamically discover resume structure from content (not hardcoded labels).
 */

import {
  detectResumeSections,
  structuredResumeToRewriteSections,
} from '../resumeScannerSectionDetect.js';
import {
  cloneStructuredResume,
  generateAtsText,
  hasStructuredResumeData,
  parseAtsTextToStructured,
} from '../structuredResume.js';

const classifyNodeRole = (section = {}) => {
  const type = String(section.type || 'custom');
  const text = String(
    section.text ||
      (section.items || []).join(' ') ||
      (section.paragraphs || []).join(' ') ||
      JSON.stringify(section.entries || [])
  ).trim();

  const hasDates = /\b(19|20)\d{2}\b/.test(text);
  const hasOrgLike =
    /\b(inc|llc|ltd|corp|university|college|school|hospital|hotel|gmbh)\b/i.test(text) ||
    (Array.isArray(section.entries) &&
      section.entries.some((e) => e.company || e.institution || e.name));

  if (['experience', 'education', 'projects', 'certifications'].includes(type) || hasOrgLike) {
    return {
      role: 'hybrid',
      editable: true,
      immutableHints: hasDates || hasOrgLike ? ['entities', 'dates'] : [],
    };
  }

  if (['skills', 'languages', 'summary', 'achievements'].includes(type)) {
    return {
      role: type === 'summary' || type === 'achievements' ? 'descriptive' : 'list',
      editable: true,
      immutableHints: type === 'skills' || type === 'languages' ? ['owned_terms'] : [],
    };
  }

  return {
    role: 'custom',
    editable: Boolean(text),
    immutableHints: hasDates || hasOrgLike ? ['entities', 'dates'] : [],
  };
};

/**
 * @returns {object} understanding artifact
 */
export const runUnderstandPass = ({
  resumeText = '',
  structuredResume = null,
  parsedData = null,
} = {}) => {
  const structured = hasStructuredResumeData(structuredResume)
    ? cloneStructuredResume(structuredResume)
    : parseAtsTextToStructured(resumeText);

  const derivedText = generateAtsText(structured) || String(resumeText || '');
  const detected = detectResumeSections(derivedText);
  const rewriteSections = structuredResumeToRewriteSections(structured);

  // Prefer structured-backed sections (richer payloads); fall back to raw detection.
  const nodes = (rewriteSections.sections.length
    ? rewriteSections.sections
    : detected.sections.map((s) => ({
        id: s.id,
        type: s.type,
        heading: s.heading,
        text: s.text,
        paragraphs: s.text ? [s.text] : [],
      }))
  ).map((section, index) => {
    const classification = classifyNodeRole(section);
    return {
      id: section.id || `node-${index + 1}`,
      type: section.type || 'custom',
      heading: section.heading || section.type || `Section ${index + 1}`,
      order: index,
      payload: section,
      ...classification,
    };
  });

  return {
    structured,
    resumeText: derivedText,
    identity: {
      name: rewriteSections.name || structured.name || detected.name || '',
      contact: rewriteSections.contact || structured.contact || detected.contact || {},
    },
    nodes,
    nodeCount: nodes.length,
    editableNodeIds: nodes.filter((n) => n.editable).map((n) => n.id),
    customNodeIds: nodes.filter((n) => n.role === 'custom' || n.type === 'custom').map((n) => n.id),
    parsedData,
  };
};

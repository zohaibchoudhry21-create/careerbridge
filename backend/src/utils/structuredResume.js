import {
  buildStructuredResumeFromDetected,
  detectResumeSections,
} from './resumeScannerSectionDetect.js';
import { escapeRegExp } from './resumeScannerTextUtils.js';

const BULLET_RE = /^(?:[-•*‣▪◦]|\d+[.)]|[a-zA-Z][.)])\s+/;
const FORBIDDEN_PATH_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isForbiddenPathKey = (key) => FORBIDDEN_PATH_KEYS.has(String(key));

/** Strip leading list markers and collapse whitespace for tolerant substring matching. */
export const normalizeTextForMatch = (text = '') =>
  String(text)
    .replace(/^\s*(?:[-•*‣▪◦]|\d+[.)]|[a-zA-Z][.)])\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

const stripBulletPrefix = (text = '') => String(text).replace(BULLET_RE, '').trim();

/**
 * Find `original` inside `text`, tolerating bullet markers and whitespace drift.
 * Returns { start, end } indices in `text`, or null.
 */
export const findOriginalInText = (text = '', original = '') => {
  const haystack = String(text ?? '');
  const needle = String(original || '').trim();
  if (!needle) return null;

  const directIndex = haystack.indexOf(needle);
  if (directIndex >= 0) {
    return { start: directIndex, end: directIndex + needle.length };
  }

  const strippedNeedle = stripBulletPrefix(needle);
  if (strippedNeedle && strippedNeedle !== needle) {
    const idx = haystack.indexOf(strippedNeedle);
    if (idx >= 0) {
      return { start: idx, end: idx + strippedNeedle.length };
    }
  }

  if (strippedNeedle) {
    const pattern = new RegExp(escapeRegExp(strippedNeedle).replace(/\s+/g, '\\s+'), 'i');
    const match = pattern.exec(haystack);
    if (match) {
      return { start: match.index, end: match.index + match[0].length };
    }
  }

  const normalizedHay = normalizeTextForMatch(haystack);
  const normalizedNeedle = normalizeTextForMatch(needle);
  if (normalizedNeedle && normalizedHay.includes(normalizedNeedle)) {
    const pattern = new RegExp(
      escapeRegExp(normalizedNeedle).replace(/\s+/g, '\\s+'),
      'i'
    );
    const match = pattern.exec(haystack);
    if (match) {
      return { start: match.index, end: match.index + match[0].length };
    }
  }

  return null;
};

const projectEntryShape = (project = {}) => ({
  name: String(project?.name || ''),
  description: String(project?.description || ''),
  technologies: Array.isArray(project?.technologies)
    ? project.technologies.map((t) => String(t || '')).filter(Boolean)
    : [],
  duration: String(project?.duration || ''),
});

const additionalSectionShape = (section = {}) => ({
  type: String(section?.type || 'custom'),
  heading: String(section?.heading || 'ADDITIONAL'),
  paragraphs: Array.isArray(section?.paragraphs)
    ? section.paragraphs.map((p) => String(p || '').trim()).filter(Boolean)
    : [],
});

export const emptyStructuredResume = () => ({
  name: '',
  contact: { address: '', phone: '', email: '' },
  summary: '',
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  achievements: [],
  languages: [],
  additionalSections: [],
  sectionOrder: [],
});

export const cloneStructuredResume = (value) => {
  const src = value && typeof value === 'object' ? value : {};
  return {
    name: String(src.name || ''),
    contact: {
      address: String(src.contact?.address || ''),
      phone: String(src.contact?.phone || ''),
      email: String(src.contact?.email || ''),
    },
    summary: String(src.summary || ''),
    workExperience: Array.isArray(src.workExperience)
      ? src.workExperience.map((job) => ({
          title: String(job?.title || ''),
          company: String(job?.company || ''),
          duration: String(job?.duration || ''),
          bullets: Array.isArray(job?.bullets)
            ? job.bullets.map((b) => String(b || '')).filter(Boolean)
            : [],
        }))
      : [],
    education: Array.isArray(src.education)
      ? src.education.map((ed) => ({
          degree: String(ed?.degree || ''),
          institution: String(ed?.institution || ''),
          duration: String(ed?.duration || ''),
        }))
      : [],
    skills: Array.isArray(src.skills) ? src.skills.map((s) => String(s || '')).filter(Boolean) : [],
    projects: Array.isArray(src.projects)
      ? src.projects.map((p) => projectEntryShape(p))
      : [],
    certifications: Array.isArray(src.certifications)
      ? src.certifications.map((c) => String(c || '')).filter(Boolean)
      : [],
    achievements: Array.isArray(src.achievements)
      ? src.achievements.map((a) => String(a || '')).filter(Boolean)
      : [],
    languages: Array.isArray(src.languages)
      ? src.languages.map((s) => String(s || '')).filter(Boolean)
      : [],
    additionalSections: Array.isArray(src.additionalSections)
      ? src.additionalSections.map((s) => additionalSectionShape(s))
      : [],
    sectionOrder: Array.isArray(src.sectionOrder)
      ? src.sectionOrder.map((item) => ({
          type: String(item?.type || 'custom'),
          heading: String(item?.heading || ''),
        }))
      : [],
  };
};

/**
 * Best-effort parse of flat ATS text into structuredResume.
 * Dynamically detects every known and custom section heading present in the text.
 */
export const parseAtsTextToStructured = (fullText = '') => {
  const text = String(fullText || '').replace(/\r\n/g, '\n').trim();
  if (!text) return emptyStructuredResume();

  const detected = detectResumeSections(text);
  const result = cloneStructuredResume(buildStructuredResumeFromDetected(detected));

  if (
    !result.summary &&
    !result.workExperience.length &&
    !result.education.length &&
    !result.skills.length &&
    !result.projects.length &&
    !result.certifications.length &&
    !result.achievements.length &&
    !result.additionalSections.length &&
    text
  ) {
    result.summary = text;
    result.sectionOrder = [{ type: 'summary', heading: 'PROFESSIONAL SUMMARY' }];
  }

  return result;
};

const emitSectionLines = (lines, heading, bodyLines = []) => {
  if (!bodyLines.length) return;
  lines.push(heading);
  lines.push(...bodyLines);
  lines.push('');
};

const bodyLinesForTypedSection = (data, type) => {
  if (type === 'summary' && data.summary.trim()) {
    return [data.summary.trim()];
  }
  if (type === 'experience' && data.workExperience.length) {
    const out = [];
    for (const job of data.workExperience) {
      const header = [job.title, job.company].filter(Boolean).join(', ');
      if (header) out.push(header);
      if (job.duration) out.push(job.duration);
      for (const bullet of job.bullets) {
        const cleaned = String(bullet || '').trim();
        if (cleaned) {
          out.push(cleaned.startsWith('-') || cleaned.startsWith('•') ? cleaned : `• ${cleaned}`);
        }
      }
      out.push('');
    }
    if (out.length && !out[out.length - 1].trim()) out.pop();
    return out;
  }
  if (type === 'education' && data.education.length) {
    const out = [];
    for (const ed of data.education) {
      const header = [ed.degree, ed.institution].filter(Boolean).join(', ');
      if (header) out.push(header);
      if (ed.duration) out.push(ed.duration);
      out.push('');
    }
    if (out.length && !out[out.length - 1].trim()) out.pop();
    return out;
  }
  if (type === 'skills' && data.skills.length) {
    return [data.skills.join(', ')];
  }
  if (type === 'projects' && data.projects.length) {
    const out = [];
    for (const project of data.projects) {
      if (project.name) out.push(project.name);
      if (project.duration) out.push(project.duration);
      if (project.description) out.push(project.description);
      if (project.technologies?.length) {
        out.push(`Technologies: ${project.technologies.join(', ')}`);
      }
      out.push('');
    }
    if (out.length && !out[out.length - 1].trim()) out.pop();
    return out;
  }
  if (type === 'certifications' && data.certifications.length) {
    return data.certifications.map((cert) => `• ${cert}`);
  }
  if (type === 'achievements' && data.achievements.length) {
    return data.achievements.map((a) => {
      const cleaned = String(a || '').trim();
      return cleaned.startsWith('-') || cleaned.startsWith('•') ? cleaned : `• ${cleaned}`;
    });
  }
  if (type === 'languages' && data.languages.length) {
    return [data.languages.join(', ')];
  }
  return [];
};

/**
 * ONLY place that produces flat ATS plain text from structured resume.
 * Emits every section that exists, including custom additionalSections, in detected order.
 */
export const generateAtsText = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  const lines = [];

  if (data.name) lines.push(data.name);

  const contactBits = [data.contact.email, data.contact.phone, data.contact.address].filter(Boolean);
  if (contactBits.length) lines.push(contactBits.join(' | '));

  if (data.name || contactBits.length) lines.push('');

  const emittedTyped = new Set();
  const emittedAdditional = new Set();
  const order = data.sectionOrder?.length
    ? data.sectionOrder
    : [
        { type: 'summary', heading: 'PROFESSIONAL SUMMARY' },
        { type: 'experience', heading: 'WORK EXPERIENCE' },
        { type: 'education', heading: 'EDUCATION' },
        { type: 'skills', heading: 'SKILLS' },
        { type: 'projects', heading: 'PROJECTS' },
        { type: 'certifications', heading: 'CERTIFICATIONS' },
        { type: 'achievements', heading: 'ACHIEVEMENTS' },
        { type: 'languages', heading: 'LANGUAGES' },
        ...data.additionalSections.map((s) => ({ type: s.type, heading: s.heading })),
      ];

  for (const item of order) {
    const type = item.type;
    const heading = String(item.heading || type).toUpperCase();

    if (
      ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'languages'].includes(
        type
      )
    ) {
      if (emittedTyped.has(type)) continue;
      const body = bodyLinesForTypedSection(data, type);
      if (body.length) {
        emitSectionLines(lines, heading, body);
        emittedTyped.add(type);
      }
      continue;
    }

    const idx = data.additionalSections.findIndex(
      (s, i) => !emittedAdditional.has(i) && (s.heading === item.heading || s.type === type)
    );
    if (idx >= 0) {
      const extra = data.additionalSections[idx];
      const body = (extra.paragraphs || []).flatMap((p) => String(p).split('\n')).filter(Boolean);
      if (body.length) {
        emitSectionLines(lines, String(extra.heading || heading).toUpperCase(), body);
        emittedAdditional.add(idx);
      }
    }
  }

  // Emit any remaining typed sections not in sectionOrder
  for (const type of [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'achievements',
    'languages',
  ]) {
    if (emittedTyped.has(type)) continue;
    const body = bodyLinesForTypedSection(data, type);
    if (body.length) {
      const heading =
        {
          summary: 'PROFESSIONAL SUMMARY',
          experience: 'WORK EXPERIENCE',
          education: 'EDUCATION',
          skills: 'SKILLS',
          projects: 'PROJECTS',
          certifications: 'CERTIFICATIONS',
          achievements: 'ACHIEVEMENTS',
          languages: 'LANGUAGES',
        }[type] || type.toUpperCase();
      emitSectionLines(lines, heading, body);
    }
  }

  data.additionalSections.forEach((extra, idx) => {
    if (emittedAdditional.has(idx)) return;
    const body = (extra.paragraphs || []).flatMap((p) => String(p).split('\n')).filter(Boolean);
    if (body.length) {
      emitSectionLines(lines, String(extra.heading || 'ADDITIONAL').toUpperCase(), body);
    }
  });

  while (lines.length && !String(lines[lines.length - 1]).trim()) {
    lines.pop();
  }

  return lines.join('\n');
};

export const getFieldByPath = (obj, path = '') => {
  if (!path) return undefined;
  const parts = String(path).split('.');
  let current = obj;
  for (const part of parts) {
    if (isForbiddenPathKey(part)) return undefined;
    if (current == null) return undefined;
    const key = /^\d+$/.test(part) ? Number(part) : part;
    if (Array.isArray(current) && typeof key === 'number' && key >= current.length) {
      return undefined;
    }
    current = current[key];
  }
  return current;
};

/** True when every array index in path is within [0, length] (length allowed for append). */
export const isFieldPathInBounds = (obj, path = '') => {
  if (!path) return false;
  const parts = String(path).split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (isForbiddenPathKey(part)) return false;
    if (current == null) return false;
    const key = /^\d+$/.test(part) ? Number(part) : part;
    const isLast = i === parts.length - 1;

    if (Array.isArray(current) && typeof key === 'number') {
      if (key > current.length) return false;
      if (key === current.length && !isLast) return false;
    }

    if (isLast) return true;
    current = current[key];
  }
  return true;
};

/**
 * Set a value at a dotted path. Returns the updated clone, or null if the path
 * would create a sparse array (index beyond array.length).
 */
export const setFieldByPath = (obj, path = '', value) => {
  const clone = cloneStructuredResume(obj);
  const parts = String(path).split('.');
  if (!parts.length || !parts[0]) return clone;

  for (const part of parts) {
    if (isForbiddenPathKey(part)) return clone;
  }

  let current = clone;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const key = /^\d+$/.test(part) ? Number(part) : part;
    const nextPart = parts[i + 1];
    const nextIsIndex = /^\d+$/.test(nextPart);

    if (Array.isArray(current) && typeof key === 'number' && key > current.length) {
      return null;
    }

    if (current[key] == null) {
      current[key] = nextIsIndex ? [] : {};
    }
    current = current[key];
  }

  const last = parts[parts.length - 1];
  const lastKey = /^\d+$/.test(last) ? Number(last) : last;

  if (Array.isArray(current) && typeof lastKey === 'number' && lastKey > current.length) {
    return null;
  }

  current[lastKey] = value;
  return clone;
};

export const findPathForOriginal = (structured, original = '') => {
  const needle = String(original || '').trim();
  if (!needle) return '';

  const data = cloneStructuredResume(structured);
  if (data.summary.includes(needle)) return 'summary';

  for (let i = 0; i < data.workExperience.length; i += 1) {
    const job = data.workExperience[i];
    if (job.title.includes(needle)) return `workExperience.${i}.title`;
    if (job.company.includes(needle)) return `workExperience.${i}.company`;
    if (job.duration.includes(needle)) return `workExperience.${i}.duration`;
    for (let j = 0; j < job.bullets.length; j += 1) {
      if (job.bullets[j].includes(needle)) return `workExperience.${i}.bullets.${j}`;
    }
  }

  for (let i = 0; i < data.education.length; i += 1) {
    const ed = data.education[i];
    if (ed.degree.includes(needle)) return `education.${i}.degree`;
    if (ed.institution.includes(needle)) return `education.${i}.institution`;
    if (ed.duration.includes(needle)) return `education.${i}.duration`;
  }

  for (let i = 0; i < data.skills.length; i += 1) {
    if (data.skills[i].includes(needle)) return `skills.${i}`;
  }

  for (let i = 0; i < data.languages.length; i += 1) {
    if (data.languages[i].includes(needle)) return `languages.${i}`;
  }

  return '';
};

const APPLY_FAILURE = {
  ORIGINAL_NOT_FOUND: 'original_not_found_in_field',
  NO_PATH: 'no_field_path',
  FORBIDDEN_PATH: 'forbidden_field_path',
  PATH_OUT_OF_BOUNDS: 'field_path_out_of_bounds',
};

const textAlreadyContains = (haystack = '', needle = '') => {
  const text = String(haystack ?? '');
  const value = String(needle || '').trim();
  if (!value) return false;
  return (
    text.includes(value) ||
    normalizeTextForMatch(text).includes(normalizeTextForMatch(value))
  );
};

const appendMissingKeywordToSummary = (data, addition) => {
  if (textAlreadyContains(data.summary, addition)) {
    return { structured: data, applied: true };
  }
  data.summary = `${data.summary}\n${addition}`.trim();
  return { structured: data, applied: true };
};

const commitFieldUpdate = (data, path, nextValue, suggestion) => {
  const updated = setFieldByPath(data, path, nextValue);
  if (updated) {
    return { structured: updated, applied: true };
  }
  // Out-of-bounds path: missing_keyword can still land in summary.
  if (suggestion.type === 'missing_keyword' && suggestion.suggested) {
    return appendMissingKeywordToSummary(data, suggestion.suggested);
  }
  return { structured: data, applied: false, reason: APPLY_FAILURE.PATH_OUT_OF_BOUNDS };
};

/**
 * Apply a suggestion to structured resume.
 * @returns {{ structured: object, applied: boolean, reason?: string }}
 */
export const applySuggestionToStructured = (structured, suggestion = {}) => {
  const data = cloneStructuredResume(structured);
  let path = String(suggestion.fieldPath || '').trim();

  if (path && path.split('.').some(isForbiddenPathKey)) {
    if (suggestion.type === 'missing_keyword' && suggestion.suggested) {
      return appendMissingKeywordToSummary(data, suggestion.suggested);
    }
    return { structured: data, applied: false, reason: APPLY_FAILURE.FORBIDDEN_PATH };
  }

  if (!path) {
    path = findPathForOriginal(data, stripBulletPrefix(suggestion.original));
    if (!path) {
      path = findPathForOriginal(data, suggestion.original);
    }
  }

  if (!path) {
    if (suggestion.type === 'missing_keyword' && suggestion.suggested) {
      return appendMissingKeywordToSummary(data, suggestion.suggested);
    }
    return { structured: data, applied: false, reason: APPLY_FAILURE.NO_PATH };
  }

  if (!isFieldPathInBounds(data, path)) {
    if (suggestion.type === 'missing_keyword' && suggestion.suggested) {
      return appendMissingKeywordToSummary(data, suggestion.suggested);
    }
    return { structured: data, applied: false, reason: APPLY_FAILURE.PATH_OUT_OF_BOUNDS };
  }

  const current = getFieldByPath(data, path);
  const currentText = current == null ? '' : String(current);

  if (suggestion.type === 'remove') {
    if (!suggestion.original) {
      return { structured: data, applied: false, reason: APPLY_FAILURE.ORIGINAL_NOT_FOUND };
    }
    const match = findOriginalInText(currentText, suggestion.original);
    if (!match) {
      // Idempotent: already removed (or never present with empty remnant).
      // Only treat as success when the field no longer contains the original.
      return { structured: data, applied: false, reason: APPLY_FAILURE.ORIGINAL_NOT_FOUND };
    }
    const next = `${currentText.slice(0, match.start)}${currentText.slice(match.end)}`
      .replace(/\s{2,}/g, ' ')
      .trim();
    // Duplicate-guard: if removal yields no change, skip write.
    if (next === currentText) {
      return { structured: data, applied: true };
    }
    return commitFieldUpdate(data, path, next, suggestion);
  }

  if (suggestion.type === 'missing_keyword') {
    const addition = suggestion.suggested || '';
    if (!addition) {
      return { structured: data, applied: false, reason: APPLY_FAILURE.ORIGINAL_NOT_FOUND };
    }
    if (textAlreadyContains(currentText, addition) || textAlreadyContains(data.summary, addition)) {
      return { structured: data, applied: true };
    }
    const next = currentText
      ? `${currentText}${currentText.endsWith('.') ? '' : ''} ${addition}`.trim()
      : addition;
    return commitFieldUpdate(data, path, next, suggestion);
  }

  // reword
  const suggestedText = suggestion.suggested || '';
  if (suggestion.original) {
    const match = findOriginalInText(currentText, suggestion.original);
    if (!match) {
      // Idempotent double-accept: original already replaced
      if (suggestedText && textAlreadyContains(currentText, suggestedText)) {
        return { structured: data, applied: true };
      }
      return { structured: data, applied: false, reason: APPLY_FAILURE.ORIGINAL_NOT_FOUND };
    }

    const next = `${currentText.slice(0, match.start)}${suggestedText}${currentText.slice(match.end)}`;
    if (next === currentText) {
      return { structured: data, applied: true };
    }
    return commitFieldUpdate(data, path, next, suggestion);
  }

  if (suggestedText) {
    if (currentText.trim() === suggestedText.trim()) {
      return { structured: data, applied: true };
    }
    return commitFieldUpdate(data, path, suggestedText, suggestion);
  }

  return { structured: data, applied: false, reason: APPLY_FAILURE.ORIGINAL_NOT_FOUND };
};

/**
 * Map structuredResume → StructuredResumeView / scoring structuredSections shape.
 */
export const structuredResumeToSections = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  const contactLines = [data.contact.email, data.contact.phone, data.contact.address].filter(Boolean);

  const experienceParagraphs = data.workExperience.map((job) => {
    const parts = [];
    const header = [job.title, job.company].filter(Boolean).join(', ');
    if (header) parts.push(header);
    if (job.duration) parts.push(job.duration);
    for (const bullet of job.bullets) {
      const cleaned = String(bullet || '').trim();
      if (cleaned) parts.push(cleaned.startsWith('•') || cleaned.startsWith('-') ? cleaned : `• ${cleaned}`);
    }
    return parts.join('\n');
  });

  const educationParagraphs = data.education.map((ed) => {
    const parts = [];
    const header = [ed.degree, ed.institution].filter(Boolean).join(', ');
    if (header) parts.push(header);
    if (ed.duration) parts.push(ed.duration);
    return parts.join('\n');
  });

  return {
    contact: {
      name: data.name,
      headline: '',
      lines: contactLines,
      text: contactLines.join('\n'),
    },
    summary: {
      text: data.summary,
      paragraphs: data.summary ? [data.summary] : [],
    },
    experience: {
      text: experienceParagraphs.join('\n\n'),
      paragraphs: experienceParagraphs,
    },
    education: {
      text: educationParagraphs.join('\n\n'),
      paragraphs: educationParagraphs,
    },
    skills: {
      text: data.skills.join(', '),
      items: data.skills,
      paragraphs: data.skills.length ? [data.skills.join(', ')] : [],
    },
    additional_sections: [
      ...(data.projects.length
        ? [
            {
              type: 'projects',
              heading: 'PROJECTS',
              text: data.projects
                .map((p) =>
                  [p.name, p.duration, p.description, p.technologies?.length ? `Technologies: ${p.technologies.join(', ')}` : '']
                    .filter(Boolean)
                    .join('\n')
                )
                .join('\n\n'),
              paragraphs: data.projects.map((p) =>
                [p.name, p.duration, p.description, p.technologies?.length ? `Technologies: ${p.technologies.join(', ')}` : '']
                  .filter(Boolean)
                  .join('\n')
              ),
            },
          ]
        : []),
      ...(data.certifications.length
        ? [
            {
              type: 'certifications',
              heading: 'CERTIFICATIONS',
              text: data.certifications.map((c) => `• ${c}`).join('\n'),
              paragraphs: data.certifications.map((c) => `• ${c}`),
            },
          ]
        : []),
      ...(data.achievements.length
        ? [
            {
              type: 'achievements',
              heading: 'ACHIEVEMENTS',
              text: data.achievements.map((a) => `• ${a}`).join('\n'),
              paragraphs: data.achievements.map((a) => `• ${a}`),
            },
          ]
        : []),
      ...(data.languages.length
        ? [
            {
              type: 'languages',
              heading: 'LANGUAGES',
              text: data.languages.join(', '),
              paragraphs: [data.languages.join(', ')],
            },
          ]
        : []),
      ...data.additionalSections.map((extra) => ({
        type: extra.type || 'custom',
        heading: extra.heading || 'ADDITIONAL',
        text: (extra.paragraphs || []).join('\n\n'),
        paragraphs: extra.paragraphs || [],
      })),
    ],
    unassigned: { text: '' },
  };
};

export const hasStructuredResumeData = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  return Boolean(
    data.name ||
      data.contact.email ||
      data.contact.phone ||
      data.summary ||
      data.workExperience.length ||
      data.education.length ||
      data.skills.length ||
      data.projects.length ||
      data.certifications.length ||
      data.achievements.length ||
      data.languages.length ||
      data.additionalSections.length
  );
};

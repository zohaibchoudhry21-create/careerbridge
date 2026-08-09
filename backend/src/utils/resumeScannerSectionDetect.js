/**
 * Dynamic resume section detection for Full Rewrite Mode.
 * Detects every section present in resume text (known + custom headings)
 * and maps them into structuredResume + additionalSections.
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}(?:\s*(?:ext\.?|x)\s*\d+)?/i;
const BULLET_RE = /^(?:[-•*‣▪◦]|\d+[.)]|[a-zA-Z][.)])\s+/;
const DATE_RANGE_RE =
  /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\b.*\b(?:present|current|now|(?:19|20)\d{2})\b/i;

/** Known section synonyms → canonical type. Order matters for longest-match. */
export const SECTION_SPECS = [
  {
    type: 'summary',
    defaultHeading: 'PROFESSIONAL SUMMARY',
    keys: [
      'professional summary',
      'career summary',
      'executive summary',
      'about me',
      'summary',
      'profile',
      'objective',
    ],
  },
  {
    type: 'experience',
    defaultHeading: 'WORK EXPERIENCE',
    keys: [
      'professional experience',
      'work experience',
      'employment history',
      'career history',
      'work history',
      'internship experience',
      'technical experience',
      'relevant experience',
      'internships',
      'employment',
      'experience',
    ],
  },
  {
    type: 'education',
    defaultHeading: 'EDUCATION',
    keys: [
      'academic background',
      'academic qualifications',
      'education',
      'academic',
      'qualifications',
    ],
  },
  {
    type: 'skills',
    defaultHeading: 'SKILLS',
    keys: [
      'areas of expertise',
      'core competencies',
      'technical skills',
      'key skills',
      'skills',
      'expertise',
      'competencies',
    ],
  },
  {
    type: 'projects',
    defaultHeading: 'PROJECTS',
    keys: [
      'personal projects',
      'technical projects',
      'academic projects',
      'key projects',
      'projects',
    ],
  },
  {
    type: 'certifications',
    defaultHeading: 'CERTIFICATIONS',
    keys: [
      'certifications and courses',
      'licenses and certifications',
      'certifications',
      'certificates',
      'licenses',
      'training',
      'courses',
    ],
  },
  {
    type: 'achievements',
    defaultHeading: 'ACHIEVEMENTS',
    keys: ['key achievements', 'achievements', 'honors', 'honours', 'awards'],
  },
  {
    type: 'languages',
    defaultHeading: 'LANGUAGES',
    keys: ['language proficiency', 'languages', 'language'],
  },
  {
    type: 'volunteer',
    defaultHeading: 'VOLUNTEER EXPERIENCE',
    keys: [
      'volunteer experience',
      'volunteering',
      'community service',
      'memberships',
      'organisations',
      'organizations',
    ],
  },
  {
    type: 'publications',
    defaultHeading: 'PUBLICATIONS',
    keys: ['publications', 'research publications', 'papers', 'research'],
  },
  {
    type: 'interests',
    defaultHeading: 'INTERESTS',
    keys: ['interests', 'hobbies', 'personal interests'],
  },
  {
    type: 'references',
    defaultHeading: 'REFERENCES',
    keys: ['references', 'referees'],
  },
];

const EXACT_ONLY = new Set([
  'summary',
  'profile',
  'objective',
  'experience',
  'employment',
  'education',
  'skills',
  'expertise',
  'competencies',
  'languages',
  'language',
  'qualifications',
  'academic',
  'projects',
  'training',
  'courses',
  'certificates',
  'certifications',
  'licenses',
  'awards',
  'honors',
  'honours',
  'achievements',
  'interests',
  'hobbies',
  'references',
  'publications',
  'papers',
  'research',
  'internships',
]);

/** Types stored in typed structuredResume fields (not additionalSections). */
const TYPED_SECTION_TYPES = new Set([
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'languages',
]);

const normalizeHeading = (line = '') =>
  String(line)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

const stripBullet = (line = '') => String(line).replace(BULLET_RE, '').trim();
const isBulletLine = (line = '') => BULLET_RE.test(String(line).trim());
const looksLikeDuration = (line = '') =>
  DATE_RANGE_RE.test(line) || /\b(?:19|20)\d{2}\b/.test(line);

const splitListItems = (text = '') =>
  String(text || '')
    .split(/[,|\n•]+/)
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * Match a line against known section headings.
 * @returns {{ type: string, heading: string } | null}
 */
export const matchKnownSectionHeading = (line = '') => {
  const raw = String(line || '').trim();
  const normalized = normalizeHeading(raw);
  if (!normalized || normalized.length > 60) return null;

  for (const spec of SECTION_SPECS) {
    const keys = [...spec.keys].sort((a, b) => b.length - a.length);
    for (const key of keys) {
      const matched =
        EXACT_ONLY.has(key)
          ? normalized === key
          : normalized === key || normalized.startsWith(`${key} `);
      if (matched) {
        return { type: spec.type, heading: raw || spec.defaultHeading };
      }
    }
  }
  return null;
};

/**
 * Heuristic: short title-like line that looks like a section heading (custom sections).
 * Avoids treating job titles / bullet lines as headings.
 */
export const looksLikeCustomSectionHeading = (line = '') => {
  const raw = String(line || '').trim();
  if (!raw || raw.length > 48) return false;
  if (BULLET_RE.test(raw)) return false;
  if (EMAIL_RE.test(raw) || PHONE_RE.test(raw)) return false;
  if (/https?:\/\/|www\.|linkedin\.com|github\.com/i.test(raw)) return false;
  if (looksLikeDuration(raw)) return false;
  if (/[,;]/.test(raw) && raw.split(/[,;]/).length > 2) return false;

  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 6) return false;

  const letters = raw.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 3) return false;

  const isAllCaps = letters === letters.toUpperCase() && /[A-Z]/.test(letters);
  const endsWithColon = /:$/.test(raw);

  // Prefer ALL-CAPS or trailing-colon headings. Avoid Title Case — that matches
  // job titles and project names ("Seasonal Menu Revamp") and splits sections incorrectly.
  if (!isAllCaps && !endsWithColon) return false;

  // Don't re-detect known types as custom
  if (matchKnownSectionHeading(raw)) return false;

  return true;
};

/**
 * Detect every section in resume text, preserving original order and headings.
 * @returns {{
 *   name: string,
 *   contact: { address: string, phone: string, email: string },
 *   sections: Array<{ id: string, type: string, heading: string, lines: string[], text: string }>
 * }}
 */
export const detectResumeSections = (fullText = '') => {
  const text = String(fullText || '').replace(/\r\n/g, '\n').trim();
  const empty = {
    name: '',
    contact: { address: '', phone: '', email: '' },
    sections: [],
  };
  if (!text) return empty;

  const rawLines = text.split('\n');
  const sections = [];
  let current = null;
  const headerLines = [];

  for (const line of rawLines) {
    const known = matchKnownSectionHeading(line);
    const custom =
      !known && current !== null && looksLikeCustomSectionHeading(line)
        ? { type: 'custom', heading: String(line).trim().replace(/:$/, '') }
        : null;
    const matched = known || custom;

    if (matched) {
      if (current) sections.push(current);
      current = {
        id: `sec-${sections.length + 1}`,
        type: matched.type,
        heading: matched.heading,
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else if (line.trim()) {
      headerLines.push(line.trim());
    }
  }
  if (current) sections.push(current);

  const contact = { address: '', phone: '', email: '' };
  const nameCandidates = [];
  for (const line of headerLines) {
    if (EMAIL_RE.test(line)) {
      const match = line.match(EMAIL_RE);
      if (match) contact.email = match[0];
    } else if (PHONE_RE.test(line) && (line.match(/\d/g) || []).length >= 7) {
      const match = line.match(PHONE_RE);
      if (match) contact.phone = match[0].trim();
    } else if (/linkedin|github|http|www\./i.test(line)) {
      // keep for contact context only
    } else if (!contact.address && /,/.test(line) && line.length < 80) {
      contact.address = line;
    } else {
      nameCandidates.push(line);
    }
  }

  return {
    name: nameCandidates[0] || '',
    contact,
    sections: sections.map((section) => ({
      ...section,
      text: section.lines.map((l) => l.trimEnd()).join('\n').trim(),
    })),
  };
};

const parseExperienceBlock = (lines = []) => {
  const jobs = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.title || current.company || current.duration || current.bullets.length) {
      jobs.push(current);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      pushCurrent();
      continue;
    }
    if (isBulletLine(line)) {
      if (!current) current = { title: '', company: '', duration: '', bullets: [] };
      current.bullets.push(stripBullet(line));
      continue;
    }
    if (looksLikeDuration(line) && current && !current.duration) {
      current.duration = line;
      continue;
    }
    pushCurrent();
    current = { title: '', company: '', duration: '', bullets: [] };
    if (looksLikeDuration(line)) {
      current.duration = line;
      continue;
    }
    const parts = line.split(/\s*[—–\-|]\s*|,\s+/);
    if (parts.length >= 2) {
      current.title = parts[0].trim();
      current.company = parts.slice(1).join(' — ').trim();
    } else {
      current.title = line;
    }
  }
  pushCurrent();
  return jobs;
};

const parseEducationBlock = (lines = []) => {
  const entries = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.degree || current.institution || current.duration) {
      entries.push(current);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      pushCurrent();
      continue;
    }
    if (looksLikeDuration(line) && current && !current.duration) {
      current.duration = line;
      continue;
    }
    pushCurrent();
    current = { degree: '', institution: '', duration: '' };
    if (looksLikeDuration(line)) {
      current.duration = line;
      continue;
    }
    const parts = line.split(/\s*[—–\-|]\s*|,\s+/);
    if (parts.length >= 2) {
      current.degree = parts[0].trim();
      current.institution = parts.slice(1).join(' — ').trim();
    } else {
      current.degree = line;
    }
  }
  pushCurrent();
  return entries;
};

const parseProjectBlock = (lines = []) => {
  const projects = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.name || current.description || current.technologies.length) {
      projects.push(current);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      pushCurrent();
      continue;
    }
    if (/^technologies?\s*:/i.test(line)) {
      if (!current) current = { name: '', description: '', technologies: [], duration: '' };
      current.technologies = splitListItems(line.replace(/^technologies?\s*:/i, ''));
      continue;
    }
    if (isBulletLine(line)) {
      if (!current) current = { name: '', description: '', technologies: [], duration: '' };
      const bullet = stripBullet(line);
      current.description = current.description ? `${current.description}\n${bullet}` : bullet;
      continue;
    }
    if (looksLikeDuration(line) && current && !current.duration) {
      current.duration = line;
      continue;
    }
    if (!current || current.name) {
      pushCurrent();
      current = { name: line, description: '', technologies: [], duration: '' };
    } else {
      current.description = current.description ? `${current.description}\n${line}` : line;
    }
  }
  pushCurrent();
  return projects;
};

const paragraphsFromLines = (lines = []) =>
  String(lines.join('\n'))
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const bulletsOrLines = (text = '') => {
  const lines = String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  if (lines.every((l) => BULLET_RE.test(l) || l.startsWith('•'))) {
    return lines.map(stripBullet);
  }
  return lines;
};

/**
 * Convert detected sections into structuredResume (typed fields + additionalSections).
 */
export const buildStructuredResumeFromDetected = (detected = {}) => {
  const result = {
    name: String(detected.name || ''),
    contact: {
      address: String(detected.contact?.address || ''),
      phone: String(detected.contact?.phone || ''),
      email: String(detected.contact?.email || ''),
    },
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
  };

  for (const section of detected.sections || []) {
    const type = section.type;
    const heading = section.heading || type;
    const bodyLines = section.lines || String(section.text || '').split('\n');
    const bodyText = String(section.text || bodyLines.join('\n')).trim();

    result.sectionOrder.push({ type, heading });

    if (type === 'summary') {
      result.summary = bodyText;
    } else if (type === 'experience') {
      result.workExperience = parseExperienceBlock(bodyLines);
    } else if (type === 'education') {
      result.education = parseEducationBlock(bodyLines);
    } else if (type === 'skills') {
      result.skills = splitListItems(bodyText);
    } else if (type === 'projects') {
      result.projects = parseProjectBlock(bodyLines);
    } else if (type === 'certifications') {
      result.certifications = bulletsOrLines(bodyText);
    } else if (type === 'achievements') {
      result.achievements = bulletsOrLines(bodyText);
    } else if (type === 'languages') {
      result.languages = splitListItems(bodyText);
    } else {
      // volunteer, publications, interests, references, custom
      result.additionalSections.push({
        type: type === 'custom' ? 'custom' : type,
        heading,
        paragraphs: paragraphsFromLines(bodyLines).length
          ? paragraphsFromLines(bodyLines)
          : bodyText
            ? [bodyText]
            : [],
      });
    }
  }

  if (
    !result.summary &&
    !result.workExperience.length &&
    !result.education.length &&
    !result.skills.length &&
    !result.additionalSections.length &&
    detected.sections?.length === 0 &&
    String(detected.name || '')
  ) {
    // no-op: name-only
  }

  return result;
};

/**
 * Build ordered section list for the rewrite AI from a structured resume.
 * Only includes sections that exist (have content).
 */
export const structuredResumeToRewriteSections = (structured = {}) => {
  const data = structured && typeof structured === 'object' ? structured : {};
  const sections = [];
  const order = Array.isArray(data.sectionOrder) ? data.sectionOrder : null;

  const pushTyped = (type, heading, payload) => {
    sections.push({
      id: `sec-${sections.length + 1}`,
      type,
      heading: heading || SECTION_SPECS.find((s) => s.type === type)?.defaultHeading || type,
      ...payload,
    });
  };

  const typedBuilders = {
    summary: () => {
      if (String(data.summary || '').trim()) {
        pushTyped('summary', 'PROFESSIONAL SUMMARY', { text: String(data.summary).trim() });
      }
    },
    experience: () => {
      if (Array.isArray(data.workExperience) && data.workExperience.length) {
        pushTyped('experience', 'WORK EXPERIENCE', {
          entries: data.workExperience.map((j) => ({
            title: j.title || '',
            company: j.company || '',
            duration: j.duration || '',
            bullets: Array.isArray(j.bullets) ? j.bullets : [],
          })),
        });
      }
    },
    education: () => {
      if (Array.isArray(data.education) && data.education.length) {
        pushTyped('education', 'EDUCATION', {
          entries: data.education.map((e) => ({
            degree: e.degree || '',
            institution: e.institution || '',
            duration: e.duration || '',
          })),
        });
      }
    },
    skills: () => {
      if (Array.isArray(data.skills) && data.skills.length) {
        pushTyped('skills', 'SKILLS', { items: data.skills });
      }
    },
    projects: () => {
      if (Array.isArray(data.projects) && data.projects.length) {
        pushTyped('projects', 'PROJECTS', {
          entries: data.projects.map((p) => ({
            name: p.name || '',
            description: p.description || '',
            technologies: p.technologies || [],
            duration: p.duration || '',
          })),
        });
      }
    },
    certifications: () => {
      if (Array.isArray(data.certifications) && data.certifications.length) {
        pushTyped('certifications', 'CERTIFICATIONS', { items: data.certifications });
      }
    },
    achievements: () => {
      if (Array.isArray(data.achievements) && data.achievements.length) {
        pushTyped('achievements', 'ACHIEVEMENTS', { items: data.achievements });
      }
    },
    languages: () => {
      if (Array.isArray(data.languages) && data.languages.length) {
        pushTyped('languages', 'LANGUAGES', { items: data.languages });
      }
    },
  };

  if (order?.length) {
    const usedAdditional = new Set();
    for (const item of order) {
      const type = item.type;
      if (TYPED_SECTION_TYPES.has(type) && typedBuilders[type]) {
        typedBuilders[type]();
        delete typedBuilders[type];
      } else {
        const extras = Array.isArray(data.additionalSections) ? data.additionalSections : [];
        const idx = extras.findIndex(
          (s, i) =>
            !usedAdditional.has(i) &&
            (s.heading === item.heading || s.type === type)
        );
        if (idx >= 0) {
          usedAdditional.add(idx);
          const extra = extras[idx];
          sections.push({
            id: `sec-${sections.length + 1}`,
            type: extra.type || 'custom',
            heading: extra.heading || item.heading || 'ADDITIONAL',
            paragraphs: Array.isArray(extra.paragraphs) ? extra.paragraphs : [],
            text: (extra.paragraphs || []).join('\n\n'),
          });
        }
      }
    }
    // Any typed builders not yet emitted
    for (const key of Object.keys(typedBuilders)) {
      typedBuilders[key]();
    }
    // Remaining additional sections
    const extras = Array.isArray(data.additionalSections) ? data.additionalSections : [];
    extras.forEach((extra, i) => {
      if (usedAdditional.has(i)) return;
      sections.push({
        id: `sec-${sections.length + 1}`,
        type: extra.type || 'custom',
        heading: extra.heading || 'ADDITIONAL',
        paragraphs: Array.isArray(extra.paragraphs) ? extra.paragraphs : [],
        text: (extra.paragraphs || []).join('\n\n'),
      });
    });
  } else {
    for (const key of [
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'achievements',
      'languages',
    ]) {
      typedBuilders[key]?.();
    }
    for (const extra of data.additionalSections || []) {
      sections.push({
        id: `sec-${sections.length + 1}`,
        type: extra.type || 'custom',
        heading: extra.heading || 'ADDITIONAL',
        paragraphs: Array.isArray(extra.paragraphs) ? extra.paragraphs : [],
        text: (extra.paragraphs || []).join('\n\n'),
      });
    }
  }

  return {
    name: String(data.name || ''),
    contact: {
      address: String(data.contact?.address || ''),
      phone: String(data.contact?.phone || ''),
      email: String(data.contact?.email || ''),
    },
    sections,
  };
};

/**
 * Merge AI-rewritten sections back into structuredResume.
 * Only processes sections that were detected/returned — does not invent missing ones.
 */
export const buildStructuredResumeFromRewrittenSections = ({
  name = '',
  contact = {},
  sections = [],
} = {}) => {
  const result = {
    name: String(name || ''),
    contact: {
      address: String(contact?.address || ''),
      phone: String(contact?.phone || ''),
      email: String(contact?.email || ''),
    },
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
  };

  for (const section of sections || []) {
    const type = String(section.type || 'custom');
    const heading = String(section.heading || type).trim() || type;
    result.sectionOrder.push({ type, heading });

    if (type === 'summary') {
      result.summary = String(section.text || '').trim();
    } else if (type === 'experience') {
      result.workExperience = Array.isArray(section.entries)
        ? section.entries.map((j) => ({
            title: String(j?.title || ''),
            company: String(j?.company || ''),
            duration: String(j?.duration || ''),
            bullets: Array.isArray(j?.bullets)
              ? j.bullets.map((b) => String(b || '')).filter(Boolean)
              : [],
          }))
        : parseExperienceBlock(String(section.text || '').split('\n'));
    } else if (type === 'education') {
      result.education = Array.isArray(section.entries)
        ? section.entries.map((e) => ({
            degree: String(e?.degree || ''),
            institution: String(e?.institution || ''),
            duration: String(e?.duration || ''),
          }))
        : parseEducationBlock(String(section.text || '').split('\n'));
    } else if (type === 'skills') {
      result.skills = Array.isArray(section.items)
        ? section.items.map((s) => String(s || '')).filter(Boolean)
        : splitListItems(section.text || '');
    } else if (type === 'projects') {
      result.projects = Array.isArray(section.entries)
        ? section.entries.map((p) => ({
            name: String(p?.name || ''),
            description: String(p?.description || ''),
            technologies: Array.isArray(p?.technologies)
              ? p.technologies.map((t) => String(t || '')).filter(Boolean)
              : [],
            duration: String(p?.duration || ''),
          }))
        : parseProjectBlock(String(section.text || '').split('\n'));
    } else if (type === 'certifications') {
      result.certifications = Array.isArray(section.items)
        ? section.items.map((s) => String(s || '')).filter(Boolean)
        : bulletsOrLines(section.text || '');
    } else if (type === 'achievements') {
      result.achievements = Array.isArray(section.items)
        ? section.items.map((s) => String(s || '')).filter(Boolean)
        : bulletsOrLines(section.text || '');
    } else if (type === 'languages') {
      result.languages = Array.isArray(section.items)
        ? section.items.map((s) => String(s || '')).filter(Boolean)
        : splitListItems(section.text || '');
    } else {
      const paragraphs = Array.isArray(section.paragraphs)
        ? section.paragraphs.map((p) => String(p || '').trim()).filter(Boolean)
        : bulletsOrLines(section.text || '');
      result.additionalSections.push({
        type: TYPED_SECTION_TYPES.has(type) ? 'custom' : type,
        heading,
        paragraphs,
      });
    }
  }

  return result;
};

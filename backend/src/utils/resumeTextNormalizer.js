import { cleanExtractedText } from './resumeTextCleanup.js';

const SECTION_HEADER_SPECS = [
  { type: 'about', keys: ['professional summary', 'career summary', 'executive summary', 'about me', 'summary', 'profile', 'objective'] },
  {
    type: 'experience',
    keys: [
      'professional experience',
      'work experience',
      'employment history',
      'career history',
      'work history',
      'employment',
      'internships',
      'internship experience',
      'technical experience',
      'relevant experience',
      'experience',
    ],
  },
  {
    type: 'education',
    keys: ['academic background', 'academic qualifications', 'education', 'academic', 'qualifications'],
  },
  {
    type: 'expertise',
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
  { type: 'languages', keys: ['language proficiency', 'languages', 'language'] },
  { type: 'courses', keys: ['certifications and courses', 'courses', 'training'] },
  { type: 'certificates', keys: ['certifications', 'certificates', 'licenses'] },
  { type: 'projects', keys: ['personal projects', 'technical projects', 'academic projects', 'key projects', 'projects'] },
  { type: 'awards', keys: ['achievements', 'honors', 'honours', 'awards'] },
  { type: 'organisations', keys: ['volunteer experience', 'volunteering', 'memberships', 'organisations', 'organizations'] },
  { type: 'interests', keys: ['interests', 'hobbies'] },
  { type: 'references', keys: ['references'] },
];

// Single-word keys that also appear inside normal sentences — only match whole lines.
const EXACT_ONLY_HEADER_KEYS = new Set([
  'profile',
  'experience',
  'competencies',
  'expertise',
  'skills',
  'education',
  'employment',
  'objective',
  'training',
  'courses',
  'projects',
  'languages',
  'language',
  'interests',
  'references',
  'awards',
  'academic',
  'qualifications',
  'internships',
  'certificates',
  'certifications',
  'licenses',
  'hobbies',
  'summary',
  'employment',
]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MULTI_WORD_HEADER_KEYS = SECTION_HEADER_SPECS.flatMap((spec) => spec.keys)
  .filter((key) => key.includes(' '))
  .sort((a, b) => b.length - a.length);

const ALL_HEADER_KEYS = SECTION_HEADER_SPECS.flatMap((spec) => spec.keys).sort(
  (a, b) => b.length - a.length
);

const ALL_HEADER_PATTERN = new RegExp(
  `\\b(${ALL_HEADER_KEYS.map(escapeRegex).join('|')})\\b`,
  'i'
);

const MONTH_NAME_PATTERN =
  /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?$/i;

const DATE_RANGE_PATTERN =
  /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?\d{4}\s*[-–—]\s*(?:\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|present|current|now)/i;

export const getSectionHeaderSpecs = () => SECTION_HEADER_SPECS;

const normalizeHeading = (line) => line.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const stripTrailingHeaderPunctuation = (line = '') =>
  line.trim().replace(/[:\\-–—]+\s*$/u, '').trim();

export const detectSectionType = (line) => {
  const normalized = normalizeHeading(stripTrailingHeaderPunctuation(line));

  if (!normalized) return null;

  for (const spec of SECTION_HEADER_SPECS) {
    for (const key of spec.keys) {
      if (EXACT_ONLY_HEADER_KEYS.has(key)) {
        if (normalized === key) return spec.type;
        continue;
      }

      if (normalized === key || normalized.startsWith(`${key} `)) {
        return spec.type;
      }
    }
  }

  return null;
};

export const detectGenericSectionHeader = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60 || trimmed.length < 3) return null;
  if (detectSectionType(trimmed)) return null;
  if (/@|https?:\/\/|www\./i.test(trimmed)) return null;
  if (DATE_RANGE_PATTERN.test(trimmed)) return null;
  if (/^[+()0-9\s.-]{7,}$/.test(trimmed)) return null;

  if (/^[A-Z][A-Z0-9\s&/.'()-]{1,47}$/.test(trimmed) && /[A-Z]{2,}/.test(trimmed)) {
    return { type: 'custom', heading: trimmed };
  }

  if (/^.{2,50}:$/.test(trimmed)) {
    const heading = trimmed.replace(/:$/, '').trim();
    if (heading.split(/\s+/).length <= 6 && !/@/.test(heading)) {
      return { type: 'custom', heading };
    }
  }

  return null;
};

const isStandaloneSectionHeaderLine = (line = '') => {
  const trimmed = stripTrailingHeaderPunctuation(line);
  if (!trimmed) return false;

  if (detectSectionType(trimmed)) return true;

  const normalized = normalizeHeading(trimmed);
  if (
    /^[A-Z][A-Z0-9\s&/.'()-]{2,60}$/.test(trimmed) &&
    MULTI_WORD_HEADER_KEYS.some((key) => normalized === key)
  ) {
    return true;
  }

  return false;
};

const splitLineOnEmbeddedHeaders = (line = '') => {
  let remainder = line.trim();
  const segments = [];

  while (remainder) {
    let matched = false;

    for (const key of MULTI_WORD_HEADER_KEYS) {
      const pattern = new RegExp(
        `^(.*?)\\s+(${escapeRegex(key)})\\s*[:\\-–—]?\\s*(.*)$`,
        'i'
      );
      const match = remainder.match(pattern);

      if (!match) continue;

      const [, before, header, after] = match;
      const beforeText = before?.trim();
      const headerText = header?.trim();
      const afterText = after?.trim();

      if (beforeText && /[.!?]$/.test(beforeText)) {
        segments.push(beforeText);
        segments.push(headerText);
        remainder = afterText;
        matched = true;
        break;
      }
    }

    if (!matched) {
      segments.push(remainder);
      break;
    }
  }

  return segments.filter(Boolean);
};

const normalizeDateSpacing = (line = '') =>
  line
    .replace(
      /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)\s*(\d{4})\s*[-–—]\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*)?(\d{4}|present|current|now)/gi,
      (_match, startMonth, startYear, endMonth, endYear) => {
        const endPart = endMonth
          ? `${endMonth.charAt(0).toUpperCase()}${endMonth.slice(1).toLowerCase()} ${endYear}`
          : endYear;
        return `${startMonth} ${startYear} - ${endPart}`;
      }
    )
    .replace(/(\d{4})\s*[-–—]\s*(\d{4})/g, '$1 - $2');

const joinSplitDateLines = (lines = []) => {
  const joined = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (MONTH_NAME_PATTERN.test(trimmed) && index + 1 < lines.length) {
      const next = lines[index + 1].trim();
      if (DATE_RANGE_PATTERN.test(next) || /^\d{4}\s*[-–—]/.test(next)) {
        joined.push(normalizeDateSpacing(`${trimmed} ${next}`));
        index += 1;
        continue;
      }
    }

    joined.push(normalizeDateSpacing(line));
  }

  return joined;
};

const preprocessRawText = (rawText = '') =>
  rawText
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[•●▪◦]/g, '\n• ')
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
    .replace(/activate windows[\s\S]*?settings[^\n]*/gi, '');

const expandLines = (lines = []) => {
  const expanded = [];

  for (const line of lines) {
    if (!line.trim()) {
      expanded.push('');
      continue;
    }

    if (line.includes('\t')) {
      expanded.push(
        ...line
          .split('\t')
          .map((part) => part.trim())
          .filter(Boolean)
      );
      continue;
    }

    expanded.push(...splitLineOnEmbeddedHeaders(line));
  }

  return expanded;
};

export const normalizeResumeText = (rawText = '') => {
  const preprocessed = preprocessRawText(rawText);
  const expanded = expandLines(preprocessed.split('\n'));
  const mergedDates = joinSplitDateLines(expanded);

  const output = [];

  for (const line of mergedDates) {
    const trimmed = line.replace(/ {2,}/g, ' ').trim();

    if (!trimmed) {
      if (output.length && output[output.length - 1] !== '') {
        output.push('');
      }
      continue;
    }

    if (isStandaloneSectionHeaderLine(trimmed)) {
      if (output.length && output[output.length - 1] !== '') {
        output.push('');
      }
      output.push(trimmed);
      if (output.length && output[output.length - 1] !== '') {
        output.push('');
      }
      continue;
    }

    output.push(trimmed);
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

/** Minimal pass — preserve PDF line structure; only fix dates and noise. */
const lightNormalizeResumeText = (text = '') => {
  const preprocessed = preprocessRawText(text);
  const lines = preprocessed.split('\n').map((line) => {
    const trimmed = line.replace(/ {2,}/g, ' ').trim();
    return trimmed;
  });

  return joinSplitDateLines(lines).join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const hasRecognizableResumeSections = (text = '') =>
  /\b(summary|experience|education|skills|competencies|projects|certifications|languages)\b/i.test(
    text
  );

/** Single import entry-point: clean once, then normalize (light or full). */
export const prepareResumeTextForImport = (rawText = '', { alreadyCleaned = false } = {}) => {
  const cleaned = alreadyCleaned ? (rawText || '').trim() : cleanExtractedText(rawText);
  if (!cleaned.trim()) return '';

  const qualityScore = scoreResumeTextQuality(cleaned);
  const useLightNormalize =
    qualityScore >= 35 || (cleaned.length > 400 && hasRecognizableResumeSections(cleaned));

  if (useLightNormalize) {
    return lightNormalizeResumeText(cleaned);
  }

  return normalizeResumeText(cleaned);
};

export const scoreResumeTextQuality = (text = '') => {
  // Used with text.length < 80 in resumeFileExtractor — both must be true to reject a PDF.
  if (!text.trim()) return 0;

  let score = 0;
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) score += 4;
  if (/\d{4}\s*[-–—]/.test(text)) score += 3;
  if (/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/.test(text)) score += 2;
  score += Math.min(lines.length, 30);

  const longLines = lines.filter((line) => line.length > 180).length;
  score -= longLines * 3;

  const headerHits = lines.filter((line) => isStandaloneSectionHeaderLine(line)).length;
  score += headerHits * 4;

  const brokenWordLines = lines.filter((line) => /^\s{1,3}\S+/.test(line)).length;
  score -= brokenWordLines * 2;

  if (lines.length <= 2 && text.length > 400) score -= 8;

  return score;
};

export const extractPersonalDetailsFromText = (text, existing = {}) => {
  const headerBlock = text.split(/\n\n/)[0] || text.slice(0, 800);
  const lines = headerBlock
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const email =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || existing.email || '';
  const phone =
    text.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/)?.[0] ||
    existing.phone ||
    '';

  const nonContactLines = lines.filter((line) => {
    const lower = line.toLowerCase();
    return (
      !line.includes('@') &&
      line !== email &&
      line !== phone &&
      !/^https?:\/\//i.test(line) &&
      !/^linkedin\b/i.test(lower) &&
      !/^(address|phone|email|e-mail|location):?$/i.test(lower) &&
      !detectSectionType(line)
    );
  });

  const fullName = nonContactLines[0] || existing.fullName || '';
  const professionalTitle = nonContactLines[1] || existing.professionalTitle || '';

  const locationLine =
    nonContactLines.find((line) => /,/.test(line) && line.length < 80 && !line.includes('@')) ||
    existing.location ||
    '';

  return {
    ...existing,
    fullName: fullName || existing.fullName,
    professionalTitle: professionalTitle || existing.professionalTitle,
    email,
    phone: phone.trim(),
    location: locationLine || existing.location,
  };
};

export const splitResumeIntoSections = (text, { prepared = false } = {}) => {
  const normalized = prepared ? text.trim() : prepareResumeTextForImport(text);
  const matches = [];

  const lines = normalized.split('\n');
  let offset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && isStandaloneSectionHeaderLine(trimmed)) {
      const type = detectSectionType(trimmed) || 'custom';
      matches.push({
        index: offset + line.indexOf(trimmed),
        matchLength: trimmed.length,
        type,
        heading: stripTrailingHeaderPunctuation(trimmed),
        keyLength: trimmed.length,
      });
    }
    offset += line.length + 1;
  }

  if (matches.length === 0) {
    return { normalized, headerText: normalized, sections: [] };
  }

  matches.sort((a, b) => a.index - b.index || b.keyLength - a.keyLength);

  const deduped = [];
  for (const match of matches) {
    const last = deduped[deduped.length - 1];
    if (last && Math.abs(match.index - last.index) < 4) {
      if (match.keyLength > last.keyLength) {
        deduped[deduped.length - 1] = match;
      }
      continue;
    }
    deduped.push(match);
  }

  const firstBreak = deduped[0].index;
  const headerText = normalized.slice(0, firstBreak).trim();

  const sections = deduped.map((match, index) => {
    const start = match.index + match.matchLength;
    const end = index + 1 < deduped.length ? deduped[index + 1].index : normalized.length;
    const content = normalized.slice(start, end).trim();

    return {
      type: match.type,
      heading: match.heading.replace(/^[\n\s]+/, '').trim(),
      content,
    };
  });

  return { normalized, headerText, sections };
};

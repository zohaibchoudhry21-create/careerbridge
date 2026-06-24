import {
  applyImportSectionPresentation,
  buildImportResumeBase,
  createId,
} from './resumeBuilderDefaults.js';
import {
  detectSectionType,
  extractPersonalDetailsFromText,
  splitResumeIntoSections,
} from './resumeTextNormalizer.js';

const splitLinesToBullets = (text) =>
  text
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

const parseSkillsBlock = (text) => {
  let items = text
    .split(/[,|\n•]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (items.length === 1) {
    items = text
      .split(/\s{2,}|\s+and\s+|(?<=[a-z])\s+(?=[A-Z])/)
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 1 && skill.length < 120);
  }

  if (items.length === 0) return [];

  return items.map((name) => ({
    id: createId(),
    visible: true,
    fields: { name, description: '' },
  }));
};

const parseLanguagesBlock = (text) => {
  const lines = splitLinesToBullets(text);

  if (lines.length === 1 && !/[-–—:|]/.test(lines[0])) {
    const tokens = lines[0]
      .split(/\s{2,}|,|\s+and\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length > 1) {
      return tokens.map((language) => ({
        id: createId(),
        visible: true,
        fields: { language, level: '', additionalInfo: '' },
      }));
    }
  }

  return lines.map((line) => {
    const [language, ...rest] = line.split(/[-–—:|]/);
    return {
      id: createId(),
      visible: true,
      fields: {
        language: (language || line).trim(),
        level: rest.join(' ').trim(),
        additionalInfo: '',
      },
    };
  });
};

const parseDateRange = (line) => {
  const match = line.match(
    /(\d{4}\s*[-–—]\s*(?:\d{4}|present|current|now))|(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:[a-z]+\s+\d{4}|present|current|now))/i
  );

  if (!match) {
    return { startDate: '', endDate: '', remainder: line };
  }

  const range = match[0];
  const [startDate, endDate = ''] = range.split(/\s*[-–—]\s*/);
  const remainder = line.replace(range, '').trim();

  return {
    startDate: startDate?.trim() || '',
    endDate: endDate?.trim() || '',
    remainder,
  };
};

const BULLET_LINE = /^[-•*]\s*/;
const MONTH_DATE_LINE =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*[-–—]\s*(?:[a-z]+\s+\d{4}|present|current|now)/i;
const YEAR_DATE_LINE = /\b\d{4}\s*[-–—]\s*(?:\d{4}|present|current|now)/i;

const isBulletLine = (line) => BULLET_LINE.test(line);
const isDateLine = (line) => MONTH_DATE_LINE.test(line) || YEAR_DATE_LINE.test(line);

const parseExperienceJobLines = (lines) => {
  const bullets = lines.filter(isBulletLine).map((line) => line.replace(BULLET_LINE, '').trim());
  const nonBullets = lines.filter((line) => !isBulletLine(line));
  const dateIndex = nonBullets.findIndex(isDateLine);

  let startDate = '';
  let endDate = '';
  if (dateIndex >= 0) {
    ({ startDate, endDate } = parseDateRange(nonBullets[dateIndex]));
  }

  const headers = dateIndex >= 0 ? nonBullets.slice(0, dateIndex) : nonBullets;
  const jobTitle = headers[0] || '';
  const employer = headers[1] || '';
  const location = headers[2] || '';

  const trailingDescription = nonBullets
    .slice(dateIndex >= 0 ? dateIndex + 1 : headers.length)
    .join('\n');

  return {
    id: createId(),
    visible: true,
    fields: {
      jobTitle,
      employer,
      employerLink: '',
      startDate,
      endDate,
      location,
      description: bullets.length ? bullets.join('\n') : trailingDescription,
    },
  };
};

const splitExperienceIntoJobs = (text) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const jobs = [];
  let current = [];

  const flush = () => {
    if (!current.length) return;
    jobs.push(parseExperienceJobLines(current));
    current = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    current.push(line);

    if (!isDateLine(line)) continue;

    while (index + 1 < lines.length && isBulletLine(lines[index + 1])) {
      index += 1;
      current.push(lines[index]);
    }

    let nextIndex = index + 1;
    while (nextIndex < lines.length && !lines[nextIndex]) nextIndex += 1;

    if (
      nextIndex < lines.length &&
      !isBulletLine(lines[nextIndex]) &&
      !isDateLine(lines[nextIndex])
    ) {
      flush();
    }
  }

  flush();
  return jobs;
};

const parseExperienceChunk = (chunk) => parseExperienceJobLines(
  chunk.split('\n').map((line) => line.trim()).filter(Boolean)
);

const parseExperienceBlock = (text) => {
  const paragraphBlocks = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  if (paragraphBlocks.length > 1) {
    return paragraphBlocks.flatMap((block) => splitExperienceIntoJobs(block));
  }

  return splitExperienceIntoJobs(text);
};

const parseEducationJobLines = (lines) => {
  const bullets = lines.filter(isBulletLine).map((line) => line.replace(BULLET_LINE, '').trim());
  const nonBullets = lines.filter((line) => !isBulletLine(line));
  const dateIndex = nonBullets.findIndex(isDateLine);

  let startDate = '';
  let endDate = '';
  if (dateIndex >= 0) {
    ({ startDate, endDate } = parseDateRange(nonBullets[dateIndex]));
  }

  const headers = dateIndex >= 0 ? nonBullets.slice(0, dateIndex) : nonBullets;
  const degree = headers[0] || '';
  const school = headers[1] || '';
  const location = headers[2] || '';

  const trailingDescription = nonBullets
    .slice(dateIndex >= 0 ? dateIndex + 1 : headers.length)
    .join('\n');

  return {
    id: createId(),
    visible: true,
    fields: {
      degree,
      school,
      schoolLink: '',
      startDate,
      endDate,
      location,
      description: bullets.length ? bullets.join('\n') : trailingDescription,
    },
  };
};

const splitEducationIntoEntries = (text) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const entries = [];
  let current = [];

  const flush = () => {
    if (!current.length) return;
    entries.push(parseEducationJobLines(current));
    current = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    current.push(line);

    if (!isDateLine(line)) continue;

    let nextIndex = index + 1;
    while (nextIndex < lines.length && !lines[nextIndex]) nextIndex += 1;

    if (
      nextIndex < lines.length &&
      !isBulletLine(lines[nextIndex]) &&
      !isDateLine(lines[nextIndex])
    ) {
      flush();
    }
  }

  flush();
  return entries;
};

const parseEducationChunk = (chunk) => parseEducationJobLines(
  chunk.split('\n').map((line) => line.trim()).filter(Boolean)
);

const parseEducationBlock = (text) => {
  const paragraphBlocks = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  if (paragraphBlocks.length > 1) {
    return paragraphBlocks.flatMap((block) => splitEducationIntoEntries(block));
  }

  return splitEducationIntoEntries(text);
};

const parseCoursesBlock = (text) =>
  splitLinesToBullets(text).map((line) => {
    const [title, institution] = line.split(',').map((part) => part.trim());
    return {
      id: createId(),
      visible: true,
      fields: {
        courseTitle: title || line,
        institution: institution || '',
        link: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
      },
    };
  });

const parseGenericTitleBlocks = (text, fieldMap) =>
  text.split(/\n{2,}/).filter(Boolean).map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    const secondLine = lines[1] || '';
    const rest = lines.slice(2).join('\n');

    return {
      id: createId(),
      visible: true,
      fields: fieldMap(firstLine, secondLine, rest, lines),
    };
  });

const buildSectionFromType = (type, content, heading) => {
  const base = {
    id: createId(),
    type,
    heading: heading || type,
    visible: true,
    collapsed: true,
    entries: [],
  };

  const trimmed = content.trim();
  if (!trimmed) return base;

  switch (type) {
    case 'about':
      base.entries = [
        {
          id: createId(),
          visible: true,
          fields: { heading: 'Professional Summary', content: trimmed },
        },
      ];
      break;
    case 'experience':
      base.entries = parseExperienceBlock(trimmed);
      break;
    case 'education':
      base.entries = parseEducationBlock(trimmed);
      break;
    case 'expertise':
      base.entries = parseSkillsBlock(trimmed);
      break;
    case 'languages':
      base.entries = parseLanguagesBlock(trimmed);
      break;
    case 'courses':
      base.entries = parseCoursesBlock(trimmed);
      break;
    case 'certificates':
      base.entries = parseGenericTitleBlocks(trimmed, (title, issuer, description) => ({
        title,
        issuer,
        date: '',
        link: '',
        description,
      }));
      break;
    case 'projects':
      base.entries = parseGenericTitleBlocks(trimmed, (title, _subtitle, description) => ({
        title,
        link: '',
        startDate: '',
        endDate: '',
        description,
      }));
      break;
    case 'awards':
      base.entries = parseGenericTitleBlocks(trimmed, (title, issuer, description) => ({
        title,
        issuer,
        date: '',
        description,
      }));
      break;
    case 'organisations':
      base.entries = parseGenericTitleBlocks(trimmed, (name, role, description) => ({
        name,
        role,
        startDate: '',
        endDate: '',
        description,
      }));
      break;
    case 'custom':
    case 'interests':
    case 'publications':
    case 'references':
      base.entries = parseGenericTitleBlocks(trimmed, (title, subtitle, description) => ({
        title: title || heading || type,
        content: [subtitle, description].filter(Boolean).join('\n'),
      }));
      break;
    default:
      base.entries = [
        {
          id: createId(),
          visible: true,
          fields: { title: heading || type, content: trimmed },
        },
      ];
  }

  return base;
};

const parseByLines = (text) => {
  const lines = text.split('\n');
  const sections = [];
  let currentHeading = null;
  let currentType = null;
  let buffer = [];

  const flush = () => {
    if (!currentType) return;
    sections.push(buildSectionFromType(currentType, buffer.join('\n'), currentHeading));
    buffer = [];
  };

  for (const line of lines) {
    const sectionType = detectSectionType(line);

    if (sectionType) {
      flush();
      currentType = sectionType;
      currentHeading = line.trim();
      continue;
    }

    if (currentType) {
      buffer.push(line);
    }
  }

  flush();
  return sections;
};

const looksLikeEducationEntry = (chunk) =>
  /\b(b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|ph\.?d\.?|bachelor|master|intermediate|matric|diploma|degree|university|college|school|ics|bba|bsc|msc)\b/i.test(
    chunk
  );

const looksLikeExperienceEntry = (chunk) =>
  /\b(intern|developer|engineer|manager|executive|analyst|designer|consultant|specialist|lead|seo|marketing|freelance|company|firm|mern|full[\s-]?stack|react|node\.?js|express|mongodb)\b/i.test(
    chunk
  ) || /responsibilit|managed|developed|built|led|created|implemented|designed/i.test(chunk);

const inferSectionsFromDateBlocks = (text) => {
  const chunks = text
    .split(/(?=\d{4}\s*[-–—]\s*(?:\d{4}|present|current|now))/i)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length < 2) return [];

  const experienceEntries = [];
  const educationEntries = [];

  for (const chunk of chunks) {
    if (looksLikeEducationEntry(chunk) && !looksLikeExperienceEntry(chunk)) {
      educationEntries.push(...parseEducationBlock(chunk));
      continue;
    }

    if (looksLikeExperienceEntry(chunk)) {
      experienceEntries.push(...parseExperienceBlock(chunk));
      continue;
    }

    if (looksLikeEducationEntry(chunk)) {
      educationEntries.push(...parseEducationBlock(chunk));
    } else {
      experienceEntries.push(...parseExperienceBlock(chunk));
    }
  }

  const sections = [];

  if (experienceEntries.length) {
    sections.push(buildSectionFromType('experience', '', 'Experience'));
    sections[sections.length - 1].entries = experienceEntries;
  }

  if (educationEntries.length) {
    sections.push(buildSectionFromType('education', '', 'Education'));
    sections[sections.length - 1].entries = educationEntries;
  }

  return sections;
};

export const extractSectionsFromText = (rawText, { prepared = false } = {}) => {
  const { headerText, sections: splitSections, normalized } = splitResumeIntoSections(rawText, {
    prepared,
  });

  let parsedSections = splitSections
    .map((section) => buildSectionFromType(section.type, section.content, section.heading))
    .filter((section) => section.entries.length > 0);

  if (parsedSections.length === 0) {
    parsedSections = parseByLines(headerText || rawText).filter((section) => section.entries.length > 0);
  }

  if (parsedSections.length < 2) {
    const inferred = inferSectionsFromDateBlocks(normalized || rawText).filter(
      (section) => section.entries.length > 0
    );

    if (inferred.length > parsedSections.length) {
      parsedSections = inferred;
    }
  }

  return { parsedSections, headerText, normalized };
};

export const parsePastedResumeText = (rawText, user, templateId) => {
  const base = buildImportResumeBase(user, templateId);
  const { parsedSections, headerText } = extractSectionsFromText(rawText, { prepared: true });

  base.personalDetails = extractPersonalDetailsFromText(
    headerText || rawText,
    base.personalDetails
  );

  if (parsedSections.length === 0) {
    const summary = (headerText || rawText).trim();
    base.sections = applyImportSectionPresentation([
      {
        id: createId(),
        type: 'about',
        heading: 'Summary',
        visible: true,
        collapsed: true,
        entries: [
          {
            id: createId(),
            visible: true,
            fields: { heading: 'Professional Summary', content: summary.slice(0, 1200) },
          },
        ],
      },
    ]);
    return base;
  }

  base.sections = applyImportSectionPresentation(parsedSections);
  return base;
};

import { createId } from './resumeBuilderDefaults.js';
import { extractSectionsFromText } from './resumeImportParser.js';
import { sectionHasContent } from './resumeImportFinalize.js';

const SECTION_ORDER = [
  'about',
  'experience',
  'education',
  'expertise',
  'languages',
  'projects',
  'courses',
  'certificates',
  'awards',
  'interests',
  'organisations',
  'publications',
  'references',
  'declaration',
  'custom',
];

const collectEntryText = (entry) => {
  const fields = entry?.fields || entry?.data || {};
  return Object.values(fields)
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim().toLowerCase());
};

const mergeSectionEntries = (target, source) => {
  if (!sectionHasContent(target)) {
    target.entries = source.entries.map((entry) => ({
      ...entry,
      id: entry.id || createId(),
    }));
    return;
  }

  const existingText = new Set(target.entries.flatMap((entry) => collectEntryText(entry)));

  for (const entry of source.entries) {
    const entryText = collectEntryText(entry);
    const isDuplicate = entryText.length > 0 && entryText.every((text) => existingText.has(text));
    if (isDuplicate) continue;

    target.entries.push({
      ...entry,
      id: createId(),
    });
    entryText.forEach((text) => existingText.add(text));
  }
};

const sortSections = (sections) => {
  sections.sort((a, b) => {
    const aIndex = SECTION_ORDER.indexOf(a.type);
    const bIndex = SECTION_ORDER.indexOf(b.type);
    const aOrder = aIndex === -1 ? SECTION_ORDER.length + (a.order ?? 0) : aIndex;
    const bOrder = bIndex === -1 ? SECTION_ORDER.length + (b.order ?? 0) : bIndex;
    return aOrder - bOrder;
  });

  sections.forEach((section, index) => {
    section.order = index;
  });
};

const findMatchingSection = (sections, inferred) => {
  if (inferred.type !== 'custom') {
    return sections.find((section) => section.type === inferred.type);
  }

  const inferredHeading = inferred.heading?.trim().toLowerCase();
  if (!inferredHeading) {
    return sections.find((section) => section.type === 'custom');
  }

  return sections.find(
    (section) =>
      section.type === 'custom' && section.heading?.trim().toLowerCase() === inferredHeading
  );
};

export const enrichResumePayloadFromText = (normalizedText, payload, { fillGapsOnly = false } = {}) => {
  if (!normalizedText?.trim() || !payload?.sections) return payload;

  const { parsedSections } = extractSectionsFromText(normalizedText, { prepared: true });
  if (!parsedSections.length) return payload;

  for (const inferred of parsedSections) {
    const existing = findMatchingSection(payload.sections, inferred);

    if (existing) {
      if (fillGapsOnly && sectionHasContent(existing)) {
        continue;
      }

      mergeSectionEntries(existing, inferred);
      if (inferred.heading && inferred.heading !== existing.heading) {
        const isGenericHeading = /^(about me|experience|education|expertise|languages|courses|custom)$/i.test(
          existing.heading
        );
        if (isGenericHeading) {
          existing.heading = inferred.heading;
        }
      }
      continue;
    }

    payload.sections.push({
      id: createId(),
      type: inferred.type,
      heading: inferred.heading || inferred.type,
      visible: true,
      collapsed: false,
      order: payload.sections.length,
      entries: inferred.entries.map((entry) => ({
        ...entry,
        id: entry.id || createId(),
      })),
    });
  }

  sortSections(payload.sections);
  return payload;
};

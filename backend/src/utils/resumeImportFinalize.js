const entryHasContent = (entry) => {
  const fields = entry?.fields || entry?.data || {};
  return Object.values(fields).some((value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return Boolean(value);
  });
};

export const sectionHasContent = (section) =>
  Array.isArray(section?.entries) && section.entries.some(entryHasContent);

import { applyImportSectionPresentation } from './resumeBuilderDefaults.js';

export const finalizeImportPayload = (payload) => {
  if (!payload?.sections) return payload;

  payload.sections = applyImportSectionPresentation(
    payload.sections.map((section) => ({
      ...section,
      visible: sectionHasContent(section),
      entries: (section.entries || []).filter(entryHasContent),
    }))
  ).filter((section) => section.entries.length > 0);

  return payload;
};

import { stripHtml } from './resumeEditorUtils';

const getVisibleEntries = (section) =>
  (section?.entries || []).filter((entry) => entry.visible !== false);

const findSection = (sections, type) =>
  (sections || []).filter((section) => section.visible !== false).find((section) => section.type === type);

const htmlToLines = (html = '') => {
  if (!html) return [];

  const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  if (liMatches.length) {
    return liMatches.map((match) => stripHtml(match[1])).filter(Boolean);
  }

  const plain = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return plain
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
};

export const mapProjectsSection = (sections = []) => {
  const section = findSection(sections, 'projects');
  if (!section) return [];

  return getVisibleEntries(section).map((entry) => ({
    id: entry.id,
    title: entry.fields?.title || entry.fields?.name || '',
    link: entry.fields?.link || '',
    dateRange: [entry.fields?.startDate, entry.fields?.endDate].filter(Boolean).join(' – '),
    bullets: htmlToLines(entry.fields?.description || entry.fields?.content || ''),
  }));
};

export const mapCoursesSection = (sections = []) => {
  const section = findSection(sections, 'courses');
  if (!section) return [];

  return getVisibleEntries(section).map((entry) => ({
    id: entry.id,
    title: entry.fields?.courseTitle || entry.fields?.title || '',
    institution: entry.fields?.institution || entry.fields?.school || '',
    dateRange: [entry.fields?.startDate, entry.fields?.endDate].filter(Boolean).join(' – '),
    description: stripHtml(entry.fields?.description || entry.fields?.content || ''),
  }));
};

export const mapAdditionalSections = (sections = [], excludeTypes = []) => {
  const excluded = new Set([
    'about',
    'experience',
    'education',
    'expertise',
    'languages',
    'certificates',
    'awards',
    'projects',
    'courses',
    ...excludeTypes,
  ]);

  return (sections || [])
    .filter((section) => section.visible !== false && !excluded.has(section.type))
    .map((section) => ({
      id: section.id,
      heading: section.heading || section.type,
      entries: getVisibleEntries(section).map((entry) => ({
        id: entry.id,
        title:
          entry.fields?.title ||
          entry.fields?.name ||
          entry.fields?.courseTitle ||
          entry.fields?.jobTitle ||
          entry.fields?.degree ||
          'Entry',
        description: stripHtml(entry.fields?.description || entry.fields?.content || ''),
      })),
    }))
    .filter((section) => section.entries.length > 0);
};

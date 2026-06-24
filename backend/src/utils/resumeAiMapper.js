import crypto from 'crypto';
import {
  buildBlankResumePayload,
  buildImportResumeBase,
  IMPORT_SECTION_HEADINGS,
} from './resumeBuilderDefaults.js';

const createId = () => crypto.randomBytes(8).toString('hex');

const SECTION_TYPE_MAP = {
  aboutme: 'about',
  about: 'about',
  experience: 'experience',
  education: 'education',
  expertise: 'expertise',
  skills: 'expertise',
  languages: 'languages',
  courses: 'courses',
  certificates: 'certificates',
  interests: 'interests',
  projects: 'projects',
  awards: 'awards',
  organisations: 'organisations',
  organization: 'organisations',
  organizations: 'organisations',
  volunteering: 'organisations',
  publications: 'publications',
  references: 'references',
  declaration: 'declaration',
  custom: 'custom',
};

const normalizeSectionType = (type = '') => {
  const key = type.replace(/\s+/g, '').toLowerCase();
  return SECTION_TYPE_MAP[key] || 'custom';
};

const mapEntryFields = (sectionType, data = {}) => {
  switch (sectionType) {
    case 'about':
      return {
        heading: data.heading || 'Professional Summary',
        content: data.content || '',
      };
    case 'experience':
      return {
        jobTitle: data.jobTitle || '',
        employer: data.employer || '',
        employerLink: data.employerLink || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        location: data.location || '',
        description: data.description || '',
      };
    case 'education':
      return {
        degree: data.degree || '',
        school: data.school || '',
        schoolLink: data.schoolLink || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        location: data.location || '',
        description: data.description || '',
      };
    case 'expertise':
      return {
        name: data.skill || data.name || '',
        description: data.description || '',
      };
    case 'languages':
      return {
        language: data.language || '',
        level: data.level || '',
        additionalInfo: data.additionalInfo || '',
      };
    case 'courses':
      return {
        courseTitle: data.courseTitle || data.title || '',
        institution: data.institution || data.school || '',
        link: data.link || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        location: data.location || '',
        description: data.description || data.content || '',
      };
    case 'certificates':
      return {
        title: data.title || data.name || data.certificate || '',
        issuer: data.issuer || data.organization || data.institution || '',
        date: data.date || data.endDate || data.startDate || '',
        link: data.link || '',
        description: data.description || data.content || '',
      };
    case 'projects':
      return {
        title: data.title || data.name || data.projectTitle || '',
        link: data.link || data.url || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        description: data.description || data.content || '',
      };
    case 'awards':
      return {
        title: data.title || data.name || data.award || '',
        issuer: data.issuer || data.organization || data.institution || '',
        date: data.date || data.endDate || data.startDate || '',
        description: data.description || data.content || '',
      };
    case 'organisations':
      return {
        name: data.name || data.organization || data.organisation || '',
        role: data.role || data.title || data.position || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        description: data.description || data.content || '',
      };
    case 'publications':
      return {
        title: data.title || data.name || '',
        publisher: data.publisher || data.issuer || data.journal || '',
        date: data.date || data.endDate || '',
        link: data.link || data.url || '',
        description: data.description || data.content || '',
      };
    case 'references':
      return {
        name: data.name || '',
        title: data.title || data.role || '',
        company: data.company || data.organization || '',
        email: data.email || '',
        phone: data.phone || '',
      };
    case 'interests':
      return {
        name: data.name || data.interest || data.title || '',
        description: data.description || data.content || '',
      };
    case 'custom':
      return {
        title: data.title || data.heading || '',
        content: data.content || data.description || '',
      };
    default:
      return { ...data };
  }
};

const mapImportedPersonalDetails = (parsed = {}) => ({
  fullName: parsed.fullName || '',
  professionalTitle: parsed.professionalTitle || '',
  email: parsed.email || '',
  phone: parsed.phone || '',
  location: parsed.location || '',
  website: parsed.website || '',
  linkedin: parsed.linkedin || '',
  photoUrl: parsed.photo || parsed.photoUrl || '',
  photo: parsed.photo || parsed.photoUrl || '',
  extraFields: parsed.additionalFields || parsed.extraFields || [],
});

const mapPersonalDetails = (parsed = {}) => ({
  fullName: parsed.fullName || '',
  professionalTitle: parsed.professionalTitle || '',
  email: parsed.email || '',
  phone: parsed.phone || '',
  location: parsed.location || '',
  website: parsed.website || '',
  linkedin: parsed.linkedin || '',
  photoUrl: parsed.photo || parsed.photoUrl || '',
  photo: parsed.photo || parsed.photoUrl || '',
  extraFields: parsed.additionalFields || parsed.extraFields || [],
});

const getEntryData = (entry = {}) => entry?.data || entry?.fields || {};

const entryHasMappedContent = (entry) => {
  const data = getEntryData(entry);
  return Object.values(data).some((value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return Boolean(value);
  });
};

export const mapClaudeResumeToPayload = (parsed, user, templateId, { isImport = false } = {}) => {
  const base = isImport
    ? buildImportResumeBase(user, templateId)
    : buildBlankResumePayload(user, templateId);

  if (!parsed?.sections?.length) {
    if (parsed?.personalDetails) {
      base.personalDetails = isImport
        ? mapImportedPersonalDetails(parsed.personalDetails)
        : mapPersonalDetails(parsed.personalDetails);
    }
    return base;
  }

  base.personalDetails = isImport
    ? mapImportedPersonalDetails(parsed.personalDetails)
    : mapPersonalDetails(parsed.personalDetails);

  base.sections = parsed.sections
    .map((section, sectionIndex) => {
      const type = normalizeSectionType(section.type);
      const entries = (section.entries || [])
        .filter(entryHasMappedContent)
        .map((entry, entryIndex) => ({
          id: createId(),
          visible: true,
          order: entry.order ?? entryIndex,
          fields: mapEntryFields(type, getEntryData(entry)),
        }));

      return {
        id: createId(),
        type,
        heading: isImport
          ? IMPORT_SECTION_HEADINGS[type] || section.heading || type
          : section.heading || type,
        visible: section.visible !== false,
        collapsed: isImport ? true : false,
        order: section.order ?? sectionIndex,
        entries,
      };
    })
    .filter((section) => section.entries.length > 0);

  if (!isImport) {
    const mergedTypes = new Set(base.sections.map((section) => section.type));
    const remaining = buildBlankResumePayload(user, templateId).sections.filter(
      (section) => !mergedTypes.has(section.type)
    );
    base.sections = [...base.sections, ...remaining];
  }

  return base;
};

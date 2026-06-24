import crypto from 'crypto';

const createId = () => crypto.randomBytes(8).toString('hex');

export const buildEmptyPersonalDetails = () => ({
  fullName: '',
  professionalTitle: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  photo: '',
  photoUrl: '',
  extraFields: [],
});

/** @deprecated Use buildEmptyPersonalDetails — resume contact is not seeded from account. */
export const buildPersonalDetailsFromUser = () => buildEmptyPersonalDetails();

export const buildDefaultSections = () => [
  {
    id: createId(),
    type: 'about',
    heading: 'About Me',
    visible: true,
    collapsed: false,
    entries: [
      {
        id: createId(),
        visible: true,
        fields: { heading: 'Professional Summary', content: '' },
      },
    ],
  },
  {
    id: createId(),
    type: 'experience',
    heading: 'Experience',
    visible: true,
    collapsed: false,
    entries: [],
  },
  {
    id: createId(),
    type: 'education',
    heading: 'Education',
    visible: true,
    collapsed: false,
    entries: [],
  },
  {
    id: createId(),
    type: 'expertise',
    heading: 'Expertise',
    visible: true,
    collapsed: false,
    entries: [],
  },
  {
    id: createId(),
    type: 'languages',
    heading: 'Languages',
    visible: true,
    collapsed: false,
    entries: [],
  },
  {
    id: createId(),
    type: 'courses',
    heading: 'Courses',
    visible: true,
    collapsed: false,
    entries: [],
  },
];

export const buildBlankResumePayload = (_user, templateId, name = 'Resume 1') => ({
  name,
  templateId,
  personalDetails: buildEmptyPersonalDetails(),
  sections: buildDefaultSections(),
  customize: {},
});

export const IMPORT_SECTION_HEADINGS = {
  about: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  expertise: 'Core Competencies',
  languages: 'Language',
  courses: 'Courses',
  certificates: 'Certificates',
  interests: 'Interests',
  projects: 'Projects',
  awards: 'Awards',
  organisations: 'Organisations',
  publications: 'Publications',
  references: 'References',
  declaration: 'Declaration',
  custom: 'Custom Section',
};

export const applyImportSectionPresentation = (sections = []) =>
  sections.map((section) => ({
    ...section,
    heading: IMPORT_SECTION_HEADINGS[section.type] || section.heading || section.type,
    collapsed: true,
  }));

export const buildImportResumeBase = (_user, templateId, name = 'Resume 1') => ({
  name,
  templateId,
  personalDetails: buildEmptyPersonalDetails(),
  sections: [],
  customize: {},
});

export { createId };

export const createLocalId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const createEmptyEntry = (type) => {
  switch (type) {
    case 'about':
      return { heading: 'Professional Summary', content: '' };
    case 'experience':
      return {
        jobTitle: '',
        employer: '',
        employerLink: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
      };
    case 'education':
      return {
        degree: '',
        school: '',
        schoolLink: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
      };
    case 'expertise':
      return { name: '', description: '' };
    case 'languages':
      return { language: '', level: '', additionalInfo: '' };
    case 'courses':
      return {
        courseTitle: '',
        institution: '',
        link: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
      };
    case 'certificates':
      return { title: '', issuer: '', date: '', link: '', description: '' };
    case 'projects':
      return { title: '', link: '', startDate: '', endDate: '', description: '' };
    case 'awards':
      return { title: '', issuer: '', date: '', description: '' };
    case 'organisations':
      return { name: '', role: '', startDate: '', endDate: '', description: '' };
    case 'publications':
      return { title: '', publisher: '', date: '', link: '', description: '' };
    case 'references':
      return { name: '', title: '', company: '', email: '', phone: '' };
    case 'declaration':
      return { content: '', signature: '' };
    case 'interests':
      return { name: '', description: '' };
    case 'custom':
    default:
      return { title: '', content: '' };
  }
};

export const createSection = (type, heading) => ({
  id: createLocalId(),
  type,
  heading: heading || type,
  visible: true,
  collapsed: false,
  entries: [],
});

export const createEntry = (type) => ({
  id: createLocalId(),
  visible: true,
  fields: createEmptyEntry(type),
});

export const getEntryPreview = (section, entry) => {
  const { type } = section;
  const fields = entry.fields || {};

  switch (type) {
    case 'about':
      return fields.content?.replace(/<[^>]+>/g, '').slice(0, 80) || 'Professional Summary';
    case 'experience':
      return [fields.jobTitle, fields.employer].filter(Boolean).join(', ') || 'New experience';
    case 'education':
      return [fields.degree, fields.school].filter(Boolean).join(', ') || 'New education';
    case 'expertise':
      return fields.name || 'New skill';
    case 'languages':
      return fields.language || 'New language';
    case 'courses':
      return [fields.courseTitle, fields.institution].filter(Boolean).join(', ') || 'New course';
    case 'certificates':
      return [fields.title, fields.issuer].filter(Boolean).join(', ') || 'New certificate';
    case 'projects':
      return fields.title || 'New project';
    case 'awards':
      return fields.title || 'New award';
    case 'organisations':
      return [fields.name, fields.role].filter(Boolean).join(', ') || 'New organisation';
    case 'publications':
      return fields.title || 'New publication';
    case 'references':
      return fields.name || 'New reference';
    case 'interests':
      return fields.name || 'New interest';
    case 'declaration':
      return 'Declaration';
    case 'custom':
    default:
      return fields.title || fields.content?.slice(0, 60) || 'New entry';
  }
};

export const stripHtml = (html = '') => html.replace(/<[^>]+>/g, '').trim();

export const runAiTextAction = (text, action) => {
  const plain = stripHtml(text);

  if (!plain) return text;

  switch (action) {
    case 'grammar':
      return plain.charAt(0).toUpperCase() + plain.slice(1).replace(/\s+/g, ' ');
    case 'shorter': {
      const words = plain.split(/\s+/);
      return words.slice(0, Math.max(8, Math.ceil(words.length * 0.6))).join(' ');
    }
    case 'improve':
      return `${plain.replace(/\.$/, '')}. Delivered measurable results with strong ownership and collaboration.`;
    case 'suggest':
      return `• Led key initiatives with measurable impact\n• Collaborated across teams to improve outcomes\n• Applied domain expertise to solve complex challenges`;
    default:
      return plain;
  }
};

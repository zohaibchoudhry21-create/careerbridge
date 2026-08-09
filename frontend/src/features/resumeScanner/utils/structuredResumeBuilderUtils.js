/**
 * Resume Builder–compatible parsedData helpers (frontend).
 * Shape matches ParsedResume.parsedData / ResumeEditorPage EMPTY_PARSED.
 */

export const emptyParsedData = () => ({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  linkedinLink: '',
  githubLink: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  languages: [],
  certifications: [],
});

const asStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const splitDuration = (duration = '') => {
  const parts = String(duration).split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    return { startDate: parts[0].trim(), endDate: parts.slice(1).join(' - ').trim() };
  }
  return { startDate: '', endDate: String(duration || '').trim() };
};

export const normalizeParsedData = (value = {}) => {
  const src = value && typeof value === 'object' ? value : {};
  return {
    fullName: String(src.fullName || ''),
    email: String(src.email || ''),
    phone: String(src.phone || ''),
    address: String(src.address || ''),
    linkedinLink: String(src.linkedinLink || ''),
    githubLink: String(src.githubLink || ''),
    summary: String(src.summary || ''),
    skills: asStringArray(src.skills),
    experience: Array.isArray(src.experience)
      ? src.experience.map((exp) => ({
          company: String(exp?.company || ''),
          position: String(exp?.position || exp?.jobTitle || ''),
          startDate: String(exp?.startDate || ''),
          endDate: String(exp?.endDate || ''),
          description: String(exp?.description || ''),
          isCurrent: Boolean(exp?.isCurrent),
        }))
      : [],
    education: Array.isArray(src.education)
      ? src.education.map((ed) => ({
          institution: String(ed?.institution || ed?.school || ''),
          degree: String(ed?.degree || ''),
          fieldOfStudy: String(ed?.fieldOfStudy || ''),
          startDate: String(ed?.startDate || ''),
          endDate: String(ed?.endDate || ''),
          gpa: String(ed?.gpa || ''),
          description: String(ed?.description || ''),
        }))
      : [],
    projects: Array.isArray(src.projects)
      ? src.projects.map((project) => ({
          name: String(project?.name || ''),
          description: String(project?.description || ''),
          technologies: asStringArray(project?.technologies),
          startDate: String(project?.startDate || ''),
          endDate: String(project?.endDate || ''),
          link: String(project?.link || ''),
        }))
      : [],
    languages: asStringArray(src.languages),
    certifications: asStringArray(src.certifications),
  };
};

export const hasParsedData = (parsed = {}) => {
  const data = normalizeParsedData(parsed);
  return Boolean(
    data.fullName ||
      data.email ||
      data.phone ||
      data.summary ||
      data.skills.length ||
      data.experience.length ||
      data.education.length ||
      data.projects.length ||
      data.languages.length ||
      data.certifications.length
  );
};

export const structuredResumeToParsedData = (structured = {}, previousParsed = null) => {
  const data = structured && typeof structured === 'object' ? structured : {};
  const contact = data.contact || {};
  const prev = previousParsed ? normalizeParsedData(previousParsed) : emptyParsedData();

  return normalizeParsedData({
    fullName: data.name || prev.fullName,
    email: contact.email || prev.email,
    phone: contact.phone || prev.phone,
    address: contact.address || prev.address,
    linkedinLink: prev.linkedinLink,
    githubLink: prev.githubLink,
    summary: data.summary || prev.summary,
    skills: Array.isArray(data.skills) && data.skills.length ? data.skills : prev.skills,
    languages: Array.isArray(data.languages) && data.languages.length ? data.languages : prev.languages,
    experience: (data.workExperience || []).map((job) => {
      const { startDate, endDate } = splitDuration(job.duration);
      return {
        company: job.company || '',
        position: job.title || '',
        startDate,
        endDate,
        description: (job.bullets || []).join('\n'),
        isCurrent: /present|current/i.test(job.duration || ''),
      };
    }),
    education: (data.education || []).map((ed, index) => {
      const { startDate, endDate } = splitDuration(ed.duration);
      const prevEd = prev.education[index] || {};
      return {
        institution: ed.institution || '',
        degree: ed.degree || '',
        fieldOfStudy: prevEd.fieldOfStudy || '',
        startDate: startDate || prevEd.startDate || '',
        endDate: endDate || prevEd.endDate || '',
        gpa: prevEd.gpa || '',
        description: prevEd.description || '',
      };
    }),
    projects: prev.projects,
    certifications: prev.certifications,
  });
};

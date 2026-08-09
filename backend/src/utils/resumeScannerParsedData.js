/**
 * Resume Builder–compatible parsedData helpers for Resume Scanner.
 * Shape matches ParsedResume.parsedData / ResumeEditorPage EMPTY_PARSED.
 */

import {
  cloneStructuredResume,
  hasStructuredResumeData,
} from './structuredResume.js';

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

const joinDuration = (startDate = '', endDate = '') => {
  const start = String(startDate || '').trim();
  const end = String(endDate || '').trim();
  if (start && end) return `${start} - ${end}`;
  return start || end;
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

/**
 * Map structuredResume → Resume Builder parsedData.
 * Preserves extras (links, projects, certs, education details) from previousParsed when provided.
 */
export const structuredResumeToParsedData = (structured = {}, previousParsed = null) => {
  const data = cloneStructuredResume(structured);
  const prev = previousParsed ? normalizeParsedData(previousParsed) : emptyParsedData();

  return normalizeParsedData({
    fullName: data.name || prev.fullName,
    email: data.contact.email || prev.email,
    phone: data.contact.phone || prev.phone,
    address: data.contact.address || prev.address,
    linkedinLink: prev.linkedinLink,
    githubLink: prev.githubLink,
    summary: data.summary || prev.summary,
    skills: data.skills.length ? data.skills : prev.skills,
    languages: data.languages.length ? data.languages : prev.languages,
    experience: data.workExperience.map((job) => {
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
    education: data.education.map((ed, index) => {
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
    projects: data.projects.length
      ? data.projects.map((p) => ({
          name: p.name,
          description: p.description,
          technologies: p.technologies,
          startDate: '',
          endDate: p.duration,
          link: '',
        }))
      : prev.projects,
    certifications: data.certifications.length ? data.certifications : prev.certifications,
  });
};

/** Map Resume Builder parsedData → structuredResume (ATS scoring / step-1 editor). */
export const parsedDataToStructuredResume = (parsed = {}) => {
  const data = normalizeParsedData(parsed);
  return {
    name: data.fullName,
    contact: {
      email: data.email,
      phone: data.phone,
      address: data.address,
    },
    summary: data.summary,
    workExperience: data.experience.map((exp) => ({
      title: exp.position,
      company: exp.company,
      duration: joinDuration(exp.startDate, exp.endDate),
      bullets: String(exp.description || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    })),
    education: data.education.map((ed) => ({
      degree: ed.degree,
      institution: ed.institution,
      duration: joinDuration(ed.startDate, ed.endDate),
    })),
    skills: data.skills,
    languages: data.languages,
    projects: data.projects.map((p) => ({
      name: p.name,
      description: p.description,
      technologies: p.technologies,
      duration: joinDuration(p.startDate, p.endDate),
    })),
    certifications: data.certifications,
    achievements: [],
  };
};

export const ensureAnalysisParsedData = (analysis) => {
  if (hasParsedData(analysis.parsedData)) {
    analysis.parsedData = normalizeParsedData(analysis.parsedData);
    analysis.markModified?.('parsedData');
    return analysis.parsedData;
  }

  if (hasStructuredResumeData(analysis.structuredResume)) {
    analysis.parsedData = structuredResumeToParsedData(analysis.structuredResume, analysis.parsedData);
    analysis.markModified?.('parsedData');
    return analysis.parsedData;
  }

  analysis.parsedData = emptyParsedData();
  analysis.markModified?.('parsedData');
  return analysis.parsedData;
};

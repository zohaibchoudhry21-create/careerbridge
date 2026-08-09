export const normalizeResumeData = (data = {}) => ({
  fullName: data.fullName || '',
  email: data.email || '',
  phone: data.phone || '',
  address: data.address || '',
  linkedinLink: data.linkedinLink || '',
  githubLink: data.githubLink || '',
  summary: data.summary || '',
  skills: data.skills || [],
  experience: data.experience || [],
  education: data.education || [],
  projects: data.projects || [],
  languages: data.languages || [],
  certifications: data.certifications || [],
});

export const getContactParts = (data) =>
  [data.email, data.phone, data.address].filter(Boolean);

export const getLinkParts = (data) =>
  [data.linkedinLink, data.githubLink].filter(Boolean);

export const splitSkills = (skills = []) =>
  skills.length
    ? [skills.slice(0, Math.ceil(skills.length / 2)), skills.slice(Math.ceil(skills.length / 2))]
    : [[], []];

export const toBullets = (text) =>
  (text || '').split('\n').filter(Boolean).map((line) => line.replace(/^[•\-]\s*/, ''));

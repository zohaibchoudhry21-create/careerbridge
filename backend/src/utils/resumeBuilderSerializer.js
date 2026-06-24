export const serializeBuiltResume = (resume) => ({
  id: resume._id,
  name: resume.name,
  templateId: resume.templateId,
  personalDetails: resume.personalDetails || {},
  sections: resume.sections || [],
  customize: resume.customize || {},
  createdAt: resume.createdAt,
  updatedAt: resume.updatedAt,
});

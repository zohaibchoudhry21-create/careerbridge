const joinParts = (parts) => parts.filter(Boolean).join(' | ');

const serializeEntry = (sectionType, fields = {}) => {
  switch (sectionType) {
    case 'about':
    case 'aboutMe':
      return fields.content || fields.heading || '';
    case 'experience':
      return [
        joinParts([fields.jobTitle, fields.employer, fields.location]),
        joinParts([fields.startDate, fields.endDate]),
        fields.description || '',
      ]
        .filter(Boolean)
        .join('\n');
    case 'education':
      return [
        joinParts([fields.degree, fields.school, fields.location]),
        joinParts([fields.startDate, fields.endDate]),
        fields.description || '',
      ]
        .filter(Boolean)
        .join('\n');
    case 'expertise':
      return fields.name || fields.skill || fields.description || '';
    case 'languages':
      return joinParts([fields.language, fields.level, fields.additionalInfo]);
    case 'projects':
      return [
        joinParts([fields.title, fields.link]),
        joinParts([fields.startDate, fields.endDate]),
        fields.description || '',
      ]
        .filter(Boolean)
        .join('\n');
    case 'certificates':
      return joinParts([fields.title, fields.issuer, fields.date, fields.description]);
    case 'courses':
      return [
        joinParts([fields.courseTitle, fields.institution, fields.location]),
        joinParts([fields.startDate, fields.endDate]),
        fields.description || '',
      ]
        .filter(Boolean)
        .join('\n');
    default:
      return (
        fields.content ||
        fields.description ||
        fields.heading ||
        Object.values(fields)
          .filter((value) => typeof value === 'string' && value.trim())
          .join(' ')
      );
  }
};

export const serializeBuiltResumeToText = (resume) => {
  const personal = resume.personalDetails || {};
  const header = [
    personal.fullName,
    personal.professionalTitle,
    joinParts([personal.email, personal.phone, personal.location, personal.website, personal.linkedin]),
  ]
    .filter(Boolean)
    .join('\n');

  const sections = (resume.sections || [])
    .filter((section) => section.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((section) => {
      const heading = section.heading?.trim();
      const entries = (section.entries || [])
        .filter((entry) => entry.visible !== false)
        .map((entry) => serializeEntry(section.type, entry.fields || {}))
        .filter(Boolean);

      if (!heading && entries.length === 0) {
        return '';
      }

      return [heading, ...entries].filter(Boolean).join('\n');
    })
    .filter(Boolean);

  return [header, ...sections].filter(Boolean).join('\n\n').trim();
};

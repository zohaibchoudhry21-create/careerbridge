export const cloneStructuredResume = (value) => {
  const src = value && typeof value === 'object' ? value : {};
  return {
    name: String(src.name || ''),
    contact: {
      address: String(src.contact?.address || ''),
      phone: String(src.contact?.phone || ''),
      email: String(src.contact?.email || ''),
    },
    summary: String(src.summary || ''),
    workExperience: Array.isArray(src.workExperience)
      ? src.workExperience.map((job) => ({
          title: String(job?.title || ''),
          company: String(job?.company || ''),
          duration: String(job?.duration || ''),
          bullets: Array.isArray(job?.bullets)
            ? job.bullets.map((b) => String(b || '')).filter(Boolean)
            : [],
        }))
      : [],
    education: Array.isArray(src.education)
      ? src.education.map((ed) => ({
          degree: String(ed?.degree || ''),
          institution: String(ed?.institution || ''),
          duration: String(ed?.duration || ''),
        }))
      : [],
    skills: Array.isArray(src.skills) ? src.skills.map((s) => String(s || '')).filter(Boolean) : [],
    projects: Array.isArray(src.projects)
      ? src.projects.map((p) => ({
          name: String(p?.name || ''),
          description: String(p?.description || ''),
          technologies: Array.isArray(p?.technologies)
            ? p.technologies.map((t) => String(t || '')).filter(Boolean)
            : [],
          duration: String(p?.duration || ''),
        }))
      : [],
    certifications: Array.isArray(src.certifications)
      ? src.certifications.map((c) => String(c || '')).filter(Boolean)
      : [],
    achievements: Array.isArray(src.achievements)
      ? src.achievements.map((a) => String(a || '')).filter(Boolean)
      : [],
    languages: Array.isArray(src.languages)
      ? src.languages.map((s) => String(s || '')).filter(Boolean)
      : [],
    additionalSections: Array.isArray(src.additionalSections)
      ? src.additionalSections.map((s) => ({
          type: String(s?.type || 'custom'),
          heading: String(s?.heading || 'ADDITIONAL'),
          paragraphs: Array.isArray(s?.paragraphs)
            ? s.paragraphs.map((p) => String(p || '').trim()).filter(Boolean)
            : [],
        }))
      : [],
    sectionOrder: Array.isArray(src.sectionOrder)
      ? src.sectionOrder.map((item) => ({
          type: String(item?.type || 'custom'),
          heading: String(item?.heading || ''),
        }))
      : [],
  };
};

export const hasStructuredResumeData = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  return Boolean(
    data.name ||
      data.contact.email ||
      data.contact.phone ||
      data.summary ||
      data.workExperience.length ||
      data.education.length ||
      data.skills.length ||
      data.projects.length ||
      data.certifications.length ||
      data.achievements.length ||
      data.languages.length ||
      data.additionalSections.length
  );
};

export const updateField = (obj, path = '', value) => {
  const clone = cloneStructuredResume(obj);
  const parts = String(path).split('.');
  if (!parts.length || !parts[0]) return clone;

  let current = clone;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const key = /^\d+$/.test(part) ? Number(part) : part;
    const nextPart = parts[i + 1];
    const nextIsIndex = /^\d+$/.test(nextPart);

    if (current[key] == null) {
      current[key] = nextIsIndex ? [] : {};
    }
    current = current[key];
  }

  const last = parts[parts.length - 1];
  const lastKey = /^\d+$/.test(last) ? Number(last) : last;
  current[lastKey] = value;
  return clone;
};

export const generateAtsText = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  const lines = [];

  if (data.name) lines.push(data.name);

  const contactBits = [data.contact.email, data.contact.phone, data.contact.address].filter(Boolean);
  if (contactBits.length) lines.push(contactBits.join(' | '));

  if (data.name || contactBits.length) lines.push('');

  if (data.summary.trim()) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(data.summary.trim());
    lines.push('');
  }

  if (data.workExperience.length) {
    lines.push('WORK EXPERIENCE');
    for (const job of data.workExperience) {
      const header = [job.title, job.company].filter(Boolean).join(', ');
      if (header) lines.push(header);
      if (job.duration) lines.push(job.duration);
      for (const bullet of job.bullets) {
        const cleaned = String(bullet || '').trim();
        if (cleaned) {
          lines.push(cleaned.startsWith('-') || cleaned.startsWith('•') ? cleaned : `• ${cleaned}`);
        }
      }
      lines.push('');
    }
  }

  if (data.education.length) {
    lines.push('EDUCATION');
    for (const ed of data.education) {
      const header = [ed.degree, ed.institution].filter(Boolean).join(', ');
      if (header) lines.push(header);
      if (ed.duration) lines.push(ed.duration);
      lines.push('');
    }
  }

  if (data.skills.length) {
    lines.push('SKILLS');
    lines.push(data.skills.join(', '));
    lines.push('');
  }

  if (data.projects?.length) {
    lines.push('PROJECTS');
    for (const project of data.projects) {
      if (project.name) lines.push(project.name);
      if (project.duration) lines.push(project.duration);
      if (project.description) lines.push(project.description);
      if (project.technologies?.length) {
        lines.push(`Technologies: ${project.technologies.join(', ')}`);
      }
      lines.push('');
    }
  }

  if (data.certifications?.length) {
    lines.push('CERTIFICATIONS');
    for (const cert of data.certifications) {
      if (cert) lines.push(`• ${cert}`);
    }
    lines.push('');
  }

  if (data.achievements?.length) {
    lines.push('ACHIEVEMENTS');
    for (const achievement of data.achievements) {
      const cleaned = String(achievement || '').trim();
      if (cleaned) {
        lines.push(cleaned.startsWith('-') || cleaned.startsWith('•') ? cleaned : `• ${cleaned}`);
      }
    }
    lines.push('');
  }

  if (data.languages.length) {
    lines.push('LANGUAGES');
    lines.push(data.languages.join(', '));
    lines.push('');
  }

  for (const extra of data.additionalSections || []) {
    const body = (extra.paragraphs || []).flatMap((p) => String(p).split('\n')).filter(Boolean);
    if (!body.length) continue;
    lines.push(String(extra.heading || 'ADDITIONAL').toUpperCase());
    lines.push(...body);
    lines.push('');
  }

  while (lines.length && !String(lines[lines.length - 1]).trim()) {
    lines.pop();
  }

  return lines.join('\n');
};

/** Map structuredResume → StructuredResumeView props (data only). */
export const structuredResumeToSections = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  const contactLines = [data.contact.email, data.contact.phone, data.contact.address].filter(Boolean);

  const experienceParagraphs = data.workExperience.map((job) => {
    const parts = [];
    const header = [job.title, job.company].filter(Boolean).join(', ');
    if (header) parts.push(header);
    if (job.duration) parts.push(job.duration);
    for (const bullet of job.bullets) {
      const cleaned = String(bullet || '').trim();
      if (cleaned) {
        parts.push(cleaned.startsWith('•') || cleaned.startsWith('-') ? cleaned : `• ${cleaned}`);
      }
    }
    return parts.join('\n');
  });

  const educationParagraphs = data.education.map((ed) => {
    const parts = [];
    const header = [ed.degree, ed.institution].filter(Boolean).join(', ');
    if (header) parts.push(header);
    if (ed.duration) parts.push(ed.duration);
    return parts.join('\n');
  });

  return {
    contact: {
      name: data.name,
      headline: '',
      lines: contactLines,
      text: contactLines.join('\n'),
    },
    summary: {
      text: data.summary,
      paragraphs: data.summary ? [data.summary] : [],
    },
    experience: {
      text: experienceParagraphs.join('\n\n'),
      paragraphs: experienceParagraphs,
    },
    education: {
      text: educationParagraphs.join('\n\n'),
      paragraphs: educationParagraphs,
    },
    skills: {
      text: data.skills.join(', '),
      items: data.skills,
      paragraphs: data.skills.length ? [data.skills.join(', ')] : [],
    },
    additional_sections: [
      ...(data.projects.length
        ? [
            {
              type: 'projects',
              heading: 'PROJECTS',
              text: data.projects
                .map((p) =>
                  [p.name, p.duration, p.description, p.technologies?.length ? `Technologies: ${p.technologies.join(', ')}` : '']
                    .filter(Boolean)
                    .join('\n')
                )
                .join('\n\n'),
              paragraphs: data.projects.map((p) =>
                [p.name, p.duration, p.description, p.technologies?.length ? `Technologies: ${p.technologies.join(', ')}` : '']
                  .filter(Boolean)
                  .join('\n')
              ),
            },
          ]
        : []),
      ...(data.certifications.length
        ? [
            {
              type: 'certifications',
              heading: 'CERTIFICATIONS',
              text: data.certifications.map((c) => `• ${c}`).join('\n'),
              paragraphs: data.certifications.map((c) => `• ${c}`),
            },
          ]
        : []),
      ...(data.achievements.length
        ? [
            {
              type: 'achievements',
              heading: 'ACHIEVEMENTS',
              text: data.achievements.map((a) => `• ${a}`).join('\n'),
              paragraphs: data.achievements.map((a) => `• ${a}`),
            },
          ]
        : []),
      ...(data.languages.length
        ? [
            {
              type: 'languages',
              heading: 'LANGUAGES',
              text: data.languages.join(', '),
              paragraphs: [data.languages.join(', ')],
            },
          ]
        : []),
      ...(data.additionalSections || []).map((extra) => ({
        type: extra.type || 'custom',
        heading: extra.heading || 'ADDITIONAL',
        text: (extra.paragraphs || []).join('\n\n'),
        paragraphs: extra.paragraphs || [],
      })),
    ],
    unassigned: { text: '' },
  };
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const HIGHLIGHT = {
  red: 'line-through text-[#991b1b] bg-[#fee2e2] px-0.5 rounded-sm',
  green: 'text-[#166534] bg-[#dcfce7] px-0.5 rounded-sm font-medium',
  missing: 'text-[#ef4444] border-b-2 border-[#ef4444]',
};

/** Annotate a single field value with suggestions targeting that fieldPath. */
export const annotateFieldHtml = (text = '', fieldPath = '', suggestions = [], suggestionsEnabled = true) => {
  const value = String(text || '');
  if (!suggestionsEnabled || !value) return escapeHtml(value);

  const relevant = suggestions.filter(
    (s) =>
      s.status === 'pending' &&
      s.fieldPath === fieldPath &&
      s.charStart >= 0 &&
      s.charEnd > s.charStart
  );

  if (!relevant.length) return escapeHtml(value);

  const sorted = [...relevant].sort((a, b) => a.charStart - b.charStart);
  let cursor = 0;
  const parts = [];

  for (const suggestion of sorted) {
    const start = Math.max(0, suggestion.charStart);
    const end = Math.min(value.length, suggestion.charEnd);
    if (end <= start || start < cursor) continue;

    if (start > cursor) parts.push(escapeHtml(value.slice(cursor, start)));

    const originalText = value.slice(start, end) || suggestion.original || '';
    const suggestedText = suggestion.suggested || '';
    let inner = '';

    if (suggestion.type === 'remove' || !suggestedText) {
      inner = `<span class="ats-suggestion-original ${HIGHLIGHT.red}">${escapeHtml(originalText)}</span>`;
    } else if (suggestion.type === 'missing_keyword') {
      if (originalText) {
        inner += `<span class="ats-suggestion-original ${HIGHLIGHT.missing}">${escapeHtml(originalText)}</span>`;
      }
      if (suggestedText) {
        inner += `<span class="ats-suggestion-replacement ${HIGHLIGHT.green}">${originalText ? ' ' : ''}${escapeHtml(suggestedText)}</span>`;
      }
    } else {
      inner = `<span class="ats-suggestion-original ${HIGHLIGHT.red}">${escapeHtml(originalText)}</span> <span class="ats-suggestion-replacement ${HIGHLIGHT.green}">${escapeHtml(suggestedText)}</span>`;
    }

    parts.push(
      `<span contenteditable="false" class="ats-suggestion cursor-pointer suggestion-trigger" data-suggestion-id="${escapeHtml(suggestion.id)}" role="button" tabindex="0">${inner}</span>`
    );
    cursor = end;
  }

  if (cursor < value.length) parts.push(escapeHtml(value.slice(cursor)));
  return parts.join('');
};

import {
  normalizeResumeData,
  getContactParts,
  getLinkParts,
  splitSkills,
  toBullets,
} from '../utils/resumeUtils';

const ClassicSectionTitle = ({ children }) => (
  <h3 className="text-xs font-bold tracking-widest text-on-surface uppercase border-b border-outline-variant pb-1 mb-3">
    {children}
  </h3>
);

export const ClassicTemplate = ({ data }) => {
  const d = normalizeResumeData(data);
  const contact = getContactParts(d);
  const links = getLinkParts(d);
  const skillCols = splitSkills(d.skills);

  return (
    <div className="bg-white shadow-lg min-h-[842px] p-10 text-on-surface text-sm leading-relaxed font-serif">
      <div className="text-center border-b border-outline-variant pb-4 mb-5">
        <h1 className="text-2xl font-bold tracking-wide uppercase mb-2">{d.fullName || 'Your Name'}</h1>
        {contact.length > 0 && <p className="text-xs text-on-surface-variant">{contact.join(' | ')}</p>}
        {links.length > 0 && <p className="text-xs text-on-surface-variant mt-1">{links.join(' | ')}</p>}
      </div>
      {d.summary && (
        <div className="mb-5">
          <ClassicSectionTitle>Summary</ClassicSectionTitle>
          <p className="text-xs text-on-surface whitespace-pre-wrap">{d.summary}</p>
        </div>
      )}
      {d.experience.length > 0 && (
        <div className="mb-5">
          <ClassicSectionTitle>Work Experience</ClassicSectionTitle>
          <div className="space-y-4">
            {d.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-xs">
                    {exp.position || 'Position'}
                    {exp.company && <span className="font-normal text-on-surface-variant"> — {exp.company}</span>}
                  </p>
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">
                    {exp.startDate}
                    {exp.endDate ? ` – ${exp.endDate}` : ''}
                  </span>
                </div>
                {exp.description && (
                  <ul className="mt-1 list-disc list-inside text-xs text-on-surface">
                    {toBullets(exp.description).map((line, j) => (
                      <li key={j}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {d.education.length > 0 && (
        <div className="mb-5">
          <ClassicSectionTitle>Education</ClassicSectionTitle>
          {d.education.map((edu, i) => (
            <div key={i} className="flex justify-between mb-2">
              <div>
                <p className="font-semibold text-xs">
                  {edu.degree}
                  {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                </p>
                <p className="text-xs text-on-surface-variant">{edu.institution}</p>
              </div>
              <span className="text-xs text-on-surface-variant">
                {edu.startDate}
                {edu.endDate ? ` – ${edu.endDate}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      {d.skills.length > 0 && (
        <div className="mb-5">
          <ClassicSectionTitle>Core Competencies</ClassicSectionTitle>
          <div className="grid grid-cols-2 gap-x-6 text-xs text-on-surface">
            {skillCols[0].map((s, i) => (
              <p key={i}>• {s}</p>
            ))}
            {skillCols[1].map((s, i) => (
              <p key={`b${i}`}>• {s}</p>
            ))}
          </div>
        </div>
      )}
      {d.languages.length > 0 && (
        <div className="mb-5">
          <ClassicSectionTitle>Language</ClassicSectionTitle>
          <p className="text-xs">{d.languages.join(', ')}</p>
        </div>
      )}
    </div>
  );
};

export const ModernTemplate = ({ data }) => {
  const d = normalizeResumeData(data);
  const contact = getContactParts(d);
  const links = getLinkParts(d);

  return (
    <div className="bg-white shadow-lg min-h-[842px] flex text-sm font-sans">
      <aside className="w-[32%] bg-primary-container text-on-primary p-6 shrink-0">
        <h1 className="text-lg font-bold uppercase leading-tight mb-4">{d.fullName || 'Your Name'}</h1>
        <div className="space-y-3 text-xs text-on-primary-fixed">
          {contact.map((c, i) => (
            <p key={i}>{c}</p>
          ))}
          {links.map((l, i) => (
            <p key={`l${i}`} className="break-all">
              {l}
            </p>
          ))}
        </div>
        {d.skills.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-outline-variant pb-1 mb-3">
              Skills
            </h3>
            <ul className="text-xs space-y-1 text-on-primary-fixed">
              {d.skills.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {d.languages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-outline-variant pb-1 mb-3">
              Languages
            </h3>
            <p className="text-xs text-on-primary-fixed">{d.languages.join(', ')}</p>
          </div>
        )}
      </aside>
      <main className="flex-1 p-8 text-on-surface">
        {d.summary && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase text-on-surface border-b-2 border-secondary pb-1 mb-2">
              Profile
            </h3>
            <p className="text-xs leading-relaxed">{d.summary}</p>
          </div>
        )}
        {d.experience.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase text-on-surface border-b-2 border-secondary pb-1 mb-3">
              Experience
            </h3>
            {d.experience.map((exp, i) => (
              <div key={i} className="mb-4">
                <p className="font-bold text-xs">{exp.position}</p>
                <p className="text-xs text-on-surface-variant">
                  {exp.company} | {exp.startDate} – {exp.endDate}
                </p>
                {exp.description && (
                  <ul className="mt-1 text-xs list-disc list-inside text-on-surface">
                    {toBullets(exp.description).map((line, j) => (
                      <li key={j}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        {d.education.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase text-on-surface border-b-2 border-secondary pb-1 mb-3">
              Education
            </h3>
            {d.education.map((edu, i) => (
              <div key={i} className="mb-2">
                <p className="font-bold text-xs">{edu.degree}</p>
                <p className="text-xs text-on-surface-variant">
                  {edu.institution} — {edu.startDate} – {edu.endDate}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export const MinimalTemplate = ({ data }) => {
  const d = normalizeResumeData(data);
  const contact = getContactParts(d);

  return (
    <div className="bg-white shadow-lg min-h-[842px] p-12 font-sans text-on-surface">
      <h1 className="text-3xl font-light tracking-tight mb-1">{d.fullName || 'Your Name'}</h1>
      {contact.length > 0 && <p className="text-xs text-on-surface-variant mb-8">{contact.join('  ·  ')}</p>}
      {d.summary && (
        <div className="mb-8">
          <p className="text-sm text-on-surface leading-relaxed max-w-prose">{d.summary}</p>
        </div>
      )}
      {d.experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant mb-4">
            Experience
          </h2>
          {d.experience.map((exp, i) => (
            <div key={i} className="mb-5 pb-5 border-b border-surface-container last:border-0">
              <div className="flex justify-between items-baseline">
                <p className="text-sm font-medium">{exp.position}</p>
                <span className="text-xs text-on-surface-variant">
                  {exp.startDate} – {exp.endDate}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-2">{exp.company}</p>
              {exp.description && <p className="text-xs text-on-surface leading-relaxed">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}
      {d.education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant mb-4">
            Education
          </h2>
          {d.education.map((edu, i) => (
            <p key={i} className="text-xs text-on-surface mb-2">
              <span className="font-medium">{edu.degree}</span> — {edu.institution}
            </p>
          ))}
        </div>
      )}
      {d.skills.length > 0 && (
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
            Skills
          </h2>
          <p className="text-xs text-on-surface-variant">{d.skills.join('  ·  ')}</p>
        </div>
      )}
    </div>
  );
};

export const ProfessionalTemplate = ({ data }) => {
  const d = normalizeResumeData(data);
  const contact = getContactParts(d);
  const skillCols = splitSkills(d.skills);

  return (
    <div className="bg-white shadow-lg min-h-[842px] font-sans text-sm">
      <header className="bg-secondary text-on-secondary px-10 py-8">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{d.fullName || 'Your Name'}</h1>
        {contact.length > 0 && <p className="text-xs text-on-secondary mt-2">{contact.join(' | ')}</p>}
      </header>
      <div className="p-10 text-on-surface">
        {d.summary && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase text-secondary mb-2">Professional Summary</h3>
            <p className="text-xs leading-relaxed">{d.summary}</p>
          </div>
        )}
        {d.experience.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase text-secondary border-b border-surface-container pb-1 mb-3">
              Work Experience
            </h3>
            {d.experience.map((exp, i) => (
              <div key={i} className="mb-4 pl-3 border-l-2 border-secondary-container">
                <div className="flex justify-between">
                  <p className="font-semibold text-xs">
                    {exp.position} — {exp.company}
                  </p>
                  <span className="text-xs text-on-surface-variant">
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                {exp.description && (
                  <ul className="mt-1 text-xs list-disc list-inside text-on-surface">
                    {toBullets(exp.description).map((line, j) => (
                      <li key={j}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        {d.education.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase text-secondary border-b border-surface-container pb-1 mb-3">
              Education
            </h3>
            {d.education.map((edu, i) => (
              <p key={i} className="text-xs mb-1">
                <span className="font-semibold">{edu.degree}</span>, {edu.institution} ({edu.startDate} –{' '}
                {edu.endDate})
              </p>
            ))}
          </div>
        )}
        {d.skills.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase text-secondary border-b border-surface-container pb-1 mb-3">
              Core Competencies
            </h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {skillCols[0].map((s, i) => (
                <p key={i}>• {s}</p>
              ))}
              {skillCols[1].map((s, i) => (
                <p key={`b${i}`}>• {s}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ElegantTemplate = ({ data }) => {
  const d = normalizeResumeData(data);
  const contact = getContactParts(d);

  return (
    <div className="bg-white shadow-lg min-h-[842px] p-10 font-serif border-t-4 border-amber-600">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-on-surface tracking-wide">{d.fullName || 'Your Name'}</h1>
        <div className="w-16 h-0.5 bg-amber-500 mx-auto my-3" />
        {contact.length > 0 && (
          <p className="text-xs text-on-surface-variant italic">{contact.join('  |  ')}</p>
        )}
      </div>
      {d.summary && (
        <div className="mb-6 px-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2 text-center">Summary</h3>
          <p className="text-xs text-on-surface text-center leading-relaxed italic">{d.summary}</p>
        </div>
      )}
      {d.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 border-b border-amber-200 pb-1 mb-3">
            Experience
          </h3>
          {d.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <p className="font-semibold text-xs text-on-surface">
                {exp.position}{' '}
                <span className="font-normal text-on-surface-variant">at {exp.company}</span>
              </p>
              <p className="text-xs text-amber-700 mb-1">
                {exp.startDate} – {exp.endDate}
              </p>
              {exp.description && <p className="text-xs text-on-surface">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}
      {d.education.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 border-b border-amber-200 pb-1 mb-3">
            Education
          </h3>
          {d.education.map((edu, i) => (
            <p key={i} className="text-xs text-on-surface mb-1">
              {edu.degree}, {edu.institution}
            </p>
          ))}
        </div>
      )}
      {d.skills.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 border-b border-amber-200 pb-1 mb-3">
            Skills
          </h3>
          <p className="text-xs text-on-surface">{d.skills.join(' · ')}</p>
        </div>
      )}
    </div>
  );
};

export const TEMPLATE_COMPONENTS = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  elegant: ElegantTemplate,
};

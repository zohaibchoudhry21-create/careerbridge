import { cn } from '../../../lib/utils';

const renderParagraphLines = (paragraph = '') =>
  paragraph.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    const isBullet = /^[-•*]\s+/.test(trimmed);
    return (
      <p
        key={idx}
        className={cn(
          'text-[13px] leading-relaxed text-slate-700',
          isBullet && 'pl-4 relative before:content-["•"] before:absolute before:left-0 before:text-slate-400'
        )}
      >
        {isBullet ? trimmed.replace(/^[-•*]\s+/, '') : trimmed}
      </p>
    );
  });

const Section = ({ title, section }) => {
  const paragraphs = section?.paragraphs?.length ? section.paragraphs : (section?.text ? [section.text] : []);
  if (!paragraphs.length) return null;

  return (
    <section className="mb-6">
      <h3 className="text-[12px] font-bold tracking-wide uppercase text-blue-700 border-b border-slate-200 pb-1 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {paragraphs.map((para, idx) => (
          <div key={idx}>{renderParagraphLines(para)}</div>
        ))}
      </div>
    </section>
  );
};

export const hasStructuredPreviewData = (structuredSections = {}) => {
  const {
    contact,
    summary,
    experience,
    education,
    skills,
    additional_sections: additionalSections = [],
    unassigned,
  } = structuredSections;

  return Boolean(
    contact?.name ||
      contact?.lines?.length ||
      summary?.text ||
      experience?.text ||
      education?.text ||
      skills?.text ||
      skills?.items?.length ||
      unassigned?.text ||
      additionalSections.some((section) => section?.text || section?.paragraphs?.length)
  );
};

const PlainTextFallback = ({ text = '' }) => (
  <div className="resume-paper w-full bg-white p-8 lg:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
    {text}
  </div>
);

export default function StructuredResumeView({ structuredSections = {}, fallbackText = '' }) {
  const { contact, summary, experience, education, skills, additional_sections: additionalSections = [] } =
    structuredSections;

  if (!hasStructuredPreviewData(structuredSections)) {
    if (fallbackText?.trim()) {
      return <PlainTextFallback text={fallbackText} />;
    }
    return null;
  }

  return (
    <div className="resume-paper w-full bg-white p-8 lg:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      {contact?.name || contact?.lines?.length ? (
        <header className="mb-6 text-center">
          {contact?.name ? <h1 className="text-xl font-bold text-slate-900">{contact.name}</h1> : null}
          {contact.headline ? (
            <p className="text-sm text-slate-500 mt-1">{contact.headline}</p>
          ) : null}
          {contact.lines?.length ? (
            <p className="text-xs text-slate-500 mt-2">{contact.lines.join('  |  ')}</p>
          ) : null}
        </header>
      ) : null}

      <Section title="Professional Summary" section={summary} />
      <Section title="Work Experience" section={experience} />
      <Section title="Education" section={education} />

      {skills?.items?.length ? (
        <section className="mb-6">
          <h3 className="text-[12px] font-bold tracking-wide uppercase text-blue-700 border-b border-slate-200 pb-1 mb-2">
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.items.map((item, idx) => (
              <span
                key={idx}
                className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      ) : (
        <Section title="Skills" section={skills} />
      )}

      {additionalSections.map((extra, idx) => (
        <Section key={idx} title={extra.heading || extra.type} section={extra} />
      ))}

      {structuredSections?.unassigned?.text ? (
        <Section
          title="Additional"
          section={{ text: structuredSections.unassigned.text, paragraphs: [structuredSections.unassigned.text] }}
        />
      ) : null}
    </div>
  );
}

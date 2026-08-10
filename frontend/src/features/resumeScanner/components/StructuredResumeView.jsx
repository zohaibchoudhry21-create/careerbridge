import { cn } from '../../../lib/utils';

const renderParagraphLines = (paragraph = '') =>
  paragraph.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    const isBullet = /^[-•*]\s+/.test(trimmed);
    return (
      <p
        key={idx}
        className={cn(
          'resume-body-text text-on-surface',
          isBullet && 'pl-5 relative before:content-["•"] before:absolute before:left-0 before:text-outline'
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
    <section className="resume-section">
      <h3 className="resume-section-heading">{title}</h3>
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
  } = structuredSections ?? {};

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

/** Page chrome (white sheet, padding, shadow) — skipped when the parent already supplies it. */
const PAPER_CHROME = 'bg-white p-8 lg:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.05)]';

const PlainTextFallback = ({ text = '', bare = false }) => (
  <div
    className={cn(
      'resume-paper resume-document w-full whitespace-pre-wrap',
      !bare && PAPER_CHROME
    )}
  >
    {text}
  </div>
);

export default function StructuredResumeView({
  structuredSections = {},
  fallbackText = '',
  bare = false,
}) {
  // Default params only cover undefined — callers may pass null (e.g. rewrite comparison).
  const sections = structuredSections ?? {};
  const { contact, summary, experience, education, skills, additional_sections: additionalSections = [] } =
    sections;

  if (!hasStructuredPreviewData(sections)) {
    if (fallbackText?.trim()) {
      return <PlainTextFallback text={fallbackText} bare={bare} />;
    }
    return null;
  }

  return (
    <div className={cn('resume-paper resume-document w-full', !bare && PAPER_CHROME)}>
      {contact?.name || contact?.lines?.length ? (
        <header className="mb-7 text-center">
          {contact?.name ? <h1 className="resume-document-name">{contact.name}</h1> : null}
          {contact.headline ? (
            <p className="resume-document-contact mt-1">{contact.headline}</p>
          ) : null}
          {contact.lines?.length ? (
            <p className="resume-document-contact mt-2">{contact.lines.join('  |  ')}</p>
          ) : null}
        </header>
      ) : null}

      <Section title="Professional Summary" section={summary} />
      <Section title="Work Experience" section={experience} />
      <Section title="Education" section={education} />

      {skills?.items?.length ? (
        <section className="resume-section">
          <h3 className="resume-section-heading">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.items.map((item, idx) => (
              <span
                key={idx}
                className="text-sm bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full"
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

      {sections?.unassigned?.text ? (
        <Section
          title="Additional"
          section={{ text: sections.unassigned.text, paragraphs: [sections.unassigned.text] }}
        />
      ) : null}
    </div>
  );
}

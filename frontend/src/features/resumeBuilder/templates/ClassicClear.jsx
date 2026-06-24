import { sectionStyle, resolveTemplateTheme } from '../utils/templateCustomizeStyles';
import { stripHtml } from '../utils/resumeEditorUtils';
import TemplatePageNumberFooter from '../components/TemplatePageNumberFooter';
import {
  mapAdditionalSections,
  mapCoursesSection,
  mapProjectsSection,
} from '../utils/templateExtraSections';

export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

const HEADING_COLOR = '#0b1c30';
const BODY_COLOR = '#4b5563';
const MUTED_COLOR = '#6b7280';
const RULE_COLOR = '#d1d5db';

const htmlToBullets = (html = '') => {
  if (!html) return [];

  const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  if (liMatches.length) {
    return liMatches.map((match) => stripHtml(match[1])).filter(Boolean);
  }

  const plain = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return plain
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
};

const formatDateRange = (start, end) => [start, end].filter(Boolean).join(' – ');

const getVisibleEntries = (section) =>
  (section?.entries || []).filter((entry) => entry.visible !== false);

export const mapResumeToClassicClearData = ({ personalDetails = {}, sections = [] } = {}) => {
  const visibleSections = (sections || []).filter((section) => section.visible !== false);

  const findSection = (...types) =>
    visibleSections.find((section) => types.includes(section.type));

  const aboutSection = findSection('about');
  const summaryEntry = aboutSection ? getVisibleEntries(aboutSection)[0] : null;
  const summary =
    summaryEntry?.fields?.content ||
    summaryEntry?.fields?.description ||
    '';

  const experienceSection = findSection('experience');
  const experience = experienceSection
    ? getVisibleEntries(experienceSection).map((entry) => ({
        id: entry.id,
        jobTitle: entry.fields?.jobTitle || '',
        company: entry.fields?.employer || '',
        startDate: entry.fields?.startDate || '',
        endDate: entry.fields?.endDate || '',
        location: entry.fields?.location || '',
        bullets: htmlToBullets(entry.fields?.description || ''),
      }))
    : [];

  const educationSection = findSection('education');
  const education = educationSection
    ? getVisibleEntries(educationSection).map((entry) => ({
        id: entry.id,
        degree: entry.fields?.degree || '',
        school: entry.fields?.school || '',
        startDate: entry.fields?.startDate || '',
        endDate: entry.fields?.endDate || '',
      }))
    : [];

  const skillsSection = findSection('expertise');
  const skills = skillsSection
    ? getVisibleEntries(skillsSection)
        .map((entry) => entry.fields?.name || entry.fields?.skill || '')
        .filter(Boolean)
    : [];

  const certificatesSection = findSection('certificates');
  const certificates = certificatesSection
    ? getVisibleEntries(certificatesSection).map((entry) => {
        const title = entry.fields?.title || entry.fields?.name || '';
        const issuer = entry.fields?.issuer || '';
        return issuer ? `${title}, ${issuer}` : title;
      }).filter(Boolean)
    : [];

  const languagesSection = findSection('languages');
  const languages = languagesSection
    ? getVisibleEntries(languagesSection).map((entry) => ({
        id: entry.id,
        language: entry.fields?.language || '',
        level: entry.fields?.level || stripHtml(entry.fields?.additionalInfo || ''),
      }))
    : [];

  return {
    personalDetails: {
      fullName: personalDetails.fullName || '',
      professionalTitle: personalDetails.professionalTitle || '',
      email: personalDetails.email || '',
      phone: personalDetails.phone || '',
      location: personalDetails.location || '',
      linkedin: personalDetails.linkedin || '',
      website: personalDetails.website || '',
    },
    summary,
    experience,
    education,
    skills,
    certificates,
    languages,
    projects: mapProjectsSection(sections),
    courses: mapCoursesSection(sections),
    additionalSections: mapAdditionalSections(sections),
  };
};

export const CLASSIC_CLEAR_SAMPLE_DATA = {
  personalDetails: {
    fullName: 'Alex Morgan',
    professionalTitle: 'Senior Product Designer',
    email: 'alex.morgan@email.com',
    phone: '+1 (555) 012-3456',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexmorgan',
  },
  summary:
    'Product designer with 8+ years of experience crafting user-centered digital experiences for SaaS and e-commerce platforms. Proven track record of leading cross-functional teams and delivering measurable business outcomes.',
  experience: [
    {
      id: 'sample-1',
      jobTitle: 'Senior Product Designer',
      company: 'Northwind Labs',
      startDate: 'Jan 2021',
      endDate: 'Present',
      location: 'San Francisco, CA',
      bullets: [
        'Led redesign of core dashboard used by 120K+ monthly active users, improving task completion by 28%.',
        'Partnered with engineering and product to ship 14 major features across web and mobile.',
        'Established design system components adopted across 4 product squads.',
      ],
    },
    {
      id: 'sample-2',
      jobTitle: 'Product Designer',
      company: 'Brightline Studio',
      startDate: 'Jun 2017',
      endDate: 'Dec 2020',
      location: 'Oakland, CA',
      bullets: [
        'Owned end-to-end UX for checkout flow, reducing cart abandonment by 15%.',
        'Conducted usability testing and translated insights into actionable design iterations.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.A. Graphic Design',
      school: 'California College of the Arts',
      startDate: '2013',
      endDate: '2017',
    },
  ],
  skills: [
    'User Research',
    'Wireframing',
    'Prototyping',
    'Figma',
    'Design Systems',
    'Usability Testing',
    'HTML/CSS',
    'Interaction Design',
  ],
  certificates: [
    'Google UX Design Professional Certificate',
    'Nielsen Norman Group UX Certification',
  ],
  languages: [
    { id: 'lang-1', language: 'English', level: 'Native' },
    { id: 'lang-2', language: 'Spanish', level: 'Professional' },
  ],
};

function ContactItem({ icon, value }) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-[5px]">
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 13, color: MUTED_COLOR, lineHeight: 1 }}
        aria-hidden
      >
        {icon}
      </span>
      <span>{value}</span>
    </span>
  );
}

function SectionHeading({ children, theme }) {
  return (
    <div style={{ marginBottom: Math.max(theme?.sectionSpacing ?? 14, 6) }}>
      <h2
        style={{
          color: theme?.accentColor ?? HEADING_COLOR,
          fontSize: theme?.headingFontSize ?? 11,
          letterSpacing: theme?.headingStyle?.textTransform === 'uppercase' ? '0.16em' : '0.12em',
          lineHeight: theme?.lineHeight ?? 1.2,
          marginBottom: 6,
          ...theme?.headingStyle,
        }}
      >
        {children}
      </h2>
      <div style={{ height: 1, backgroundColor: RULE_COLOR, width: '100%' }} />
    </div>
  );
}

function BulletList({ items, theme }) {
  if (!items?.length) return null;

  return (
    <ul
      className="list-disc pl-[18px] space-y-[6px]"
      style={{
        color: BODY_COLOR,
        fontSize: theme?.bodyFontSize ?? 11,
        lineHeight: theme?.lineHeight ?? 1.55,
      }}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function TwoColumnList({ items, renderItem, theme }) {
  if (!items?.length) return null;

  const midpoint = Math.ceil(items.length / 2);
  const left = items.slice(0, midpoint);
  const right = items.slice(midpoint);
  const listStyle = {
    color: BODY_COLOR,
    fontSize: theme?.bodyFontSize ?? 11,
    lineHeight: theme?.lineHeight ?? 1.5,
  };

  return (
    <div className="grid grid-cols-2 gap-x-[32px] gap-y-[6px]">
      <ul className="list-disc pl-[18px] space-y-[6px]" style={listStyle}>
        {left.map((item, index) => (
          <li key={`left-${index}`}>{renderItem(item)}</li>
        ))}
      </ul>
      <ul className="list-disc pl-[18px] space-y-[6px]" style={listStyle}>
        {right.map((item, index) => (
          <li key={`right-${index}`}>{renderItem(item)}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ClassicClear({ resumeData, className = '', customize }) {
  const theme = resolveTemplateTheme(customize);
  const {
    personalDetails = {},
    summary = '',
    experience = [],
    education = [],
    skills = [],
    certificates = [],
    languages = [],
    projects = [],
    courses = [],
    additionalSections = [],
  } = resumeData || {};

  const contactItems = [
    personalDetails.location ? (
      <ContactItem key="location" icon="location_on" value={personalDetails.location} />
    ) : null,
    personalDetails.email ? (
      <ContactItem key="email" icon="mail" value={personalDetails.email} />
    ) : null,
    personalDetails.phone ? (
      <ContactItem key="phone" icon="call" value={personalDetails.phone} />
    ) : null,
    personalDetails.linkedin ? (
      <ContactItem key="linkedin" icon="link" value={personalDetails.linkedin} />
    ) : null,
  ].filter(Boolean);

  return (
    <article
      className={className}
      style={{
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        backgroundColor: '#ffffff',
        color: BODY_COLOR,
        boxSizing: 'border-box',
        ...theme.wrapperStyle,
      }}
    >
      <header className="px-[56px] pt-[48px] pb-[24px] text-center">
        <h1
          style={{
            fontFamily: 'Georgia, "Times New Roman", Times, serif',
            fontSize: 34,
            fontWeight: 700,
            color: theme.accentColor,
            lineHeight: 1.15,
            marginBottom: 8,
          }}
        >
          {personalDetails.fullName || 'Your Name'}
        </h1>

        {personalDetails.professionalTitle ? (
          <p
            style={{
              fontSize: 14,
              color: MUTED_COLOR,
              lineHeight: 1.4,
              marginBottom: 14,
            }}
          >
            {personalDetails.professionalTitle}
          </p>
        ) : null}

        {contactItems.length > 0 ? (
          <div
            className="flex flex-wrap items-center justify-center gap-y-[6px]"
            style={{ fontSize: 10.5, color: MUTED_COLOR, lineHeight: 1.4 }}
          >
            {contactItems.map((item, index) => (
              <span key={index} className="inline-flex items-center">
                {index > 0 ? <span className="px-[10px] text-[#c4c4c4]">|</span> : null}
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <div
          style={{
            height: 1,
            backgroundColor: RULE_COLOR,
            width: '100%',
            marginTop: 22,
          }}
        />
      </header>

      <div className="px-[56px] pb-[48px]">
        {summary ? (
          <section style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>Summary</SectionHeading>
            <div
              style={{ fontSize: theme.bodyFontSize, lineHeight: theme.lineHeight, color: BODY_COLOR }}
              dangerouslySetInnerHTML={{ __html: summary }}
            />
          </section>
        ) : null}

        {experience.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>Professional Experience</SectionHeading>
            <div className="space-y-[18px]">
              {experience.map((job) => (
                <div key={job.id}>
                  <div className="flex items-start justify-between gap-[16px]">
                    <p
                      style={{
                        fontSize: theme.titleFontSize,
                        lineHeight: theme.lineHeight,
                        color: theme.accentColor,
                      }}
                    >
                      <span className="font-semibold">{job.jobTitle}</span>
                      {job.company ? (
                        <span style={{ fontWeight: 400, color: BODY_COLOR }}> {job.company}</span>
                      ) : null}
                    </p>
                    {theme.showDates && (job.startDate || job.endDate) ? (
                      <p
                        className="shrink-0"
                        style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR, lineHeight: theme.lineHeight }}
                      >
                        {formatDateRange(job.startDate, job.endDate)}
                      </p>
                    ) : null}
                  </div>
                  {theme.showLocation && job.location ? (
                    <p style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR, marginTop: 2, marginBottom: 8 }}>
                      {job.location}
                    </p>
                  ) : (
                    <div style={{ marginBottom: 8 }} />
                  )}
                  <BulletList theme={theme} items={job.bullets} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {education.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>Education</SectionHeading>
            <div className="space-y-[12px]">
              {education.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-[16px]">
                  <p
                    style={{
                      fontSize: theme.titleFontSize,
                      lineHeight: theme.lineHeight,
                      color: theme.accentColor,
                    }}
                  >
                    <span className="font-semibold">{item.degree}</span>
                    {item.school ? (
                      <span style={{ fontWeight: 400, color: BODY_COLOR }}> {item.school}</span>
                    ) : null}
                  </p>
                  {theme.showDates && (item.startDate || item.endDate) ? (
                    <p
                      className="shrink-0"
                      style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR, lineHeight: theme.lineHeight }}
                    >
                      {formatDateRange(item.startDate, item.endDate)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {skills.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>Skills</SectionHeading>
            <TwoColumnList theme={theme} items={skills} renderItem={(skill) => skill} />
          </section>
        ) : null}

        {certificates.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>Certificates</SectionHeading>
            <BulletList theme={theme} items={certificates} />
          </section>
        ) : null}

        {languages.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>Languages</SectionHeading>
            <TwoColumnList
              theme={theme}
              items={languages}
              renderItem={(item) =>
                item.level ? `${item.language} — ${item.level}` : item.language
              }
            />
          </section>
        ) : null}

        {projects.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>Projects</SectionHeading>
            <div className="space-y-[14px]">
              {projects.map((project) => (
                <div key={project.id}>
                  <div className="flex items-start justify-between gap-[16px]">
                    <p
                      style={{
                        fontSize: theme.titleFontSize,
                        lineHeight: theme.lineHeight,
                        color: theme.accentColor,
                        fontWeight: 600,
                      }}
                    >
                      {project.title}
                    </p>
                    {theme.showDates && project.dateRange ? (
                      <p className="shrink-0" style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR }}>
                        {project.dateRange}
                      </p>
                    ) : null}
                  </div>
                  <BulletList theme={theme} items={project.bullets} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {courses.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>Courses</SectionHeading>
            <div className="space-y-[12px]">
              {courses.map((course) => (
                <div key={course.id}>
                  <p
                    style={{
                      fontSize: theme.titleFontSize,
                      lineHeight: theme.lineHeight,
                      color: theme.accentColor,
                      fontWeight: 600,
                    }}
                  >
                    {course.title}
                    {course.institution ? (
                      <span style={{ fontWeight: 400, color: BODY_COLOR }}> — {course.institution}</span>
                    ) : null}
                  </p>
                  {theme.showDates && course.dateRange ? (
                    <p style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR }}>{course.dateRange}</p>
                  ) : null}
                  {course.description ? (
                    <p style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR, marginTop: 4 }}>
                      {course.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {additionalSections.map((section) => (
          <section key={section.id} style={sectionStyle(theme)}>
            <SectionHeading theme={theme}>{section.heading}</SectionHeading>
            <div className="space-y-[10px]">
              {section.entries.map((entry) => (
                <div key={entry.id}>
                  <p style={{ fontSize: theme.titleFontSize, fontWeight: 600, color: theme.accentColor }}>
                    {entry.title}
                  </p>
                  {entry.description ? (
                    <p
                      style={{
                        fontSize: theme.bodyFontSize,
                        color: BODY_COLOR,
                        marginTop: 4,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {entry.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}

        <TemplatePageNumberFooter theme={theme} />
      </div>
    </article>
  );
}

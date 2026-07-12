import AppIcon from '../../../components/icons/AppIcon';
import { stripHtml } from '../utils/resumeEditorUtils';
import {
  mapAdditionalSections,
  mapCoursesSection,
  mapProjectsSection,
} from '../utils/templateExtraSections';
import TemplateExtraSectionsBlocks from '../components/TemplateExtraSectionsBlocks';
import TemplatePhoto from '../components/TemplatePhoto';
import TemplatePageNumberFooter from '../components/TemplatePageNumberFooter';
import {
  getPersonalPhoto,
  TEMPLATE_PREVIEW_STEADY_PHOTO,
} from '../utils/personalDetailsPhoto';
import { resolveTemplateTheme, sectionStyle } from '../utils/templateCustomizeStyles';

export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

const BODY_COLOR = '#374151';
const MUTED_COLOR = '#6b7280';
const SECTION_BAR_BG = '#eef2f6';

const LEFT_COL_WIDTH = '26%';

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

const getExtraField = (personalDetails = {}, label) =>
  personalDetails.extraFields?.find((field) => field.label === label)?.value || '';

export const mapResumeToSteadyFormData = ({ personalDetails = {}, sections = [] } = {}) => {
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
        location: entry.fields?.location || '',
      }))
    : [];

  const skillsSection = findSection('expertise');
  const skills = skillsSection
    ? getVisibleEntries(skillsSection)
        .map((entry) => entry.fields?.name || entry.fields?.skill || '')
        .filter(Boolean)
    : [];

  const languagesSection = findSection('languages');
  const languages = languagesSection
    ? getVisibleEntries(languagesSection)
        .map((entry) => entry.fields?.language || '')
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

  return {
    personalDetails: {
      fullName: personalDetails.fullName || '',
      professionalTitle: personalDetails.professionalTitle || '',
      email: personalDetails.email || '',
      phone: personalDetails.phone || '',
      location: personalDetails.location || '',
      linkedin: personalDetails.linkedin || '',
      website: personalDetails.website || '',
      nationality: getExtraField(personalDetails, 'Nationality'),
      dateOfBirth: getExtraField(personalDetails, 'Date of Birth'),
      photo: getPersonalPhoto(personalDetails),
    },
    summary,
    experience,
    education,
    skills,
    languages,
    certificates,
    projects: mapProjectsSection(sections),
    courses: mapCoursesSection(sections),
    additionalSections: mapAdditionalSections(sections),
  };
};

export const STEADY_FORM_SAMPLE_DATA = {
  personalDetails: {
    fullName: 'Rohan K. Patel',
    professionalTitle: 'Project Engineer',
    email: 'rohan.patel@email.com',
    phone: '+91 98765 43210',
    location: 'Ahmedabad, India',
    linkedin: 'linkedin.com/in/rohan-patel',
    nationality: 'Indian',
    dateOfBirth: '15/03/1995',
    photo: TEMPLATE_PREVIEW_STEADY_PHOTO,
  },
  summary:
    'Dedicated project engineer with 5+ years of experience in infrastructure development, site supervision, and cross-functional team coordination. Proven ability to deliver projects on schedule while maintaining quality and safety standards across large-scale construction environments.',
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Project Engineer',
      company: 'Adani Infrastructure',
      startDate: '01/2022',
      endDate: 'Present',
      location: 'Ahmedabad, India',
      bullets: [
        'Supervise daily site operations for a $45M highway expansion project with a team of 25 engineers.',
        'Coordinate with contractors, vendors, and government agencies to ensure compliance with safety regulations.',
        'Prepare progress reports and manage project timelines using Primavera P6 and MS Project.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Junior Project Engineer',
      company: 'L&T Construction',
      startDate: '06/2018',
      endDate: '12/2021',
      location: 'Mumbai, India',
      bullets: [
        'Assisted in planning and execution of commercial building projects valued at $12M+.',
        'Conducted quality inspections and prepared technical documentation for client submissions.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.Tech Civil Engineering',
      school: 'Nirma University',
      startDate: '2014',
      endDate: '2018',
      location: 'Ahmedabad, India',
    },
  ],
  skills: [
    'Project Coordination',
    'Site Supervision',
    'AutoCAD',
    'MS Project',
    'Quality Control',
    'Safety Compliance',
    'Primavera P6',
    'Team Leadership',
    'Budget Management',
  ],
  languages: ['English', 'Hindi', 'Gujarati'],
  certificates: [
    'AutoCAD Professional Certificate',
    'PMP Foundation Course',
    'Construction Safety Certification',
  ],
};

function ContactItem({ icon, value }) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-[6px]" style={{ fontSize: 10.5, color: MUTED_COLOR, lineHeight: 1.4 }}>
      <AppIcon
        name={icon}
        size="h-[13px] w-[13px]"
        className="shrink-0"
        style={{ color: MUTED_COLOR }}
      />
      <span>{value}</span>
    </span>
  );
}

function SectionBar({ children, theme }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        backgroundColor: SECTION_BAR_BG,
        padding: '7px 16px',
        marginBottom: Math.max(theme?.sectionSpacing ?? 14, 8),
      }}
    >
      <h2
        className="text-center"
        style={{
          color: theme?.accentColor ?? '#1a2b4a',
          fontSize: theme?.headingFontSize ?? 12,
          lineHeight: theme?.lineHeight ?? 1.3,
          margin: 0,
          ...theme?.headingStyle,
        }}
      >
        {children}
      </h2>
    </div>
  );
}

function BulletList({ items, theme }) {
  if (!items?.length) return null;

  return (
    <ul
      className="space-y-[5px]"
      style={{
        color: BODY_COLOR,
        fontSize: theme?.bodyFontSize ?? 11,
        lineHeight: theme?.lineHeight ?? 1.55,
        paddingLeft: 0,
        margin: 0,
        listStyle: 'none',
      }}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-[8px]">
          <span style={{ color: BODY_COLOR, lineHeight: 1.55 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ThreeColumnGrid({ items, theme }) {
  if (!items?.length) return null;

  return (
    <ul
      className="grid grid-cols-3 gap-x-[12px] gap-y-[8px]"
      style={{ margin: 0, padding: 0, listStyle: 'none' }}
    >
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex items-start gap-[6px]"
          style={{ fontSize: theme?.bodyFontSize ?? 11, color: BODY_COLOR, lineHeight: theme?.lineHeight ?? 1.45 }}
        >
          <span>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TimelineEntry({ left, right, className = '' }) {
  return (
    <div className={`flex gap-[16px] ${className}`} style={{ marginBottom: 18 }}>
      <div className="shrink-0" style={{ width: LEFT_COL_WIDTH }}>
        {left}
      </div>
      <div className="flex-1 min-w-0">{right}</div>
    </div>
  );
}

function MetaColumn({ startDate, endDate, location, theme }) {
  const dateRange = formatDateRange(startDate, endDate);
  const showDates = !theme || theme.showDates;
  const showLocation = !theme || theme.showLocation;

  return (
    <div style={{ fontSize: theme?.smallFontSize ?? 10, color: MUTED_COLOR, lineHeight: theme?.lineHeight ?? 1.5 }}>
      {showDates && dateRange ? <p style={{ margin: 0 }}>{dateRange}</p> : null}
      {showLocation && location ? <p style={{ margin: '4px 0 0' }}>{location}</p> : null}
    </div>
  );
}

export default function SteadyForm({ resumeData, className = '', customize }) {
  const theme = resolveTemplateTheme(customize);
  const {
    personalDetails = {},
    summary = '',
    experience = [],
    education = [],
    skills = [],
    languages = [],
    certificates = [],
    projects = [],
    courses = [],
    additionalSections = [],
  } = resumeData || {};

  const photoSrc = getPersonalPhoto(personalDetails);

  const contactLeft = [
    { icon: 'mail', value: personalDetails.email },
    { icon: 'link', value: personalDetails.linkedin },
    { icon: 'flag', value: personalDetails.nationality },
  ].filter((item) => item.value);

  const contactRight = [
    { icon: 'call', value: personalDetails.phone },
    ...(theme.showLocation ? [{ icon: 'location_on', value: personalDetails.location }] : []),
    { icon: 'calendar_today', value: personalDetails.dateOfBirth },
  ].filter((item) => item.value);

  return (
    <article
      className={className}
      style={{
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        ...theme.wrapperStyle,
      }}
    >
      <header style={{ padding: '32px 40px 20px' }}>
        <div className="flex items-start justify-between gap-[20px]">
          <div className="flex-1 min-w-0 pt-[4px]">
            <div className="flex flex-wrap items-baseline gap-x-[12px] gap-y-[4px]">
              <h1
                className="font-bold"
                style={{
                  fontSize: 26,
                  lineHeight: theme.lineHeight,
                  color: theme.accentColor,
                  margin: 0,
                }}
              >
                {personalDetails.fullName || 'Your Name'}
              </h1>
              {personalDetails.professionalTitle ? (
                <span
                  className="italic"
                  style={{ fontSize: theme.bodyFontSize, color: MUTED_COLOR, lineHeight: theme.lineHeight }}
                >
                  {personalDetails.professionalTitle}
                </span>
              ) : null}
            </div>

            {(contactLeft.length > 0 || contactRight.length > 0) ? (
              <div
                className="grid grid-cols-2 gap-x-[28px] gap-y-[6px]"
                style={{ marginTop: 16, maxWidth: 520 }}
              >
                <div className="space-y-[6px]">
                  {contactLeft.map((item) => (
                    <ContactItem key={item.icon} icon={item.icon} value={item.value} />
                  ))}
                </div>
                <div className="space-y-[6px]">
                  {contactRight.map((item) => (
                    <ContactItem key={item.icon} icon={item.icon} value={item.value} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0">
            <TemplatePhoto
              photoSrc={photoSrc}
              theme={theme}
              className=""
              placeholderIconSize={44}
            />
          </div>
        </div>
      </header>

      <div style={{ padding: '0 40px 36px' }}>
        {summary ? (
          <section style={sectionStyle(theme)}>
            <SectionBar theme={theme}>Summary</SectionBar>
            <div
              style={{ fontSize: theme.bodyFontSize, lineHeight: theme.lineHeight, color: BODY_COLOR, margin: 0 }}
              dangerouslySetInnerHTML={{ __html: summary }}
            />
          </section>
        ) : null}

        {experience.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionBar theme={theme}>Professional Experience</SectionBar>
            {experience.map((item, index) => (
              <TimelineEntry
                key={item.id}
                className={index === experience.length - 1 ? '!mb-0' : ''}
                left={
                  <MetaColumn
                    startDate={item.startDate}
                    endDate={item.endDate}
                    location={item.location}
                    theme={theme}
                  />
                }
                right={
                  <div>
                    <p style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR, lineHeight: theme.lineHeight, margin: '0 0 8px' }}>
                      {item.company ? (
                        <span className="font-bold" style={{ color: theme.accentColor }}>
                          {item.company}
                        </span>
                      ) : null}
                      {item.company && item.jobTitle ? (
                        <span style={{ color: MUTED_COLOR }}>, </span>
                      ) : null}
                      {item.jobTitle ? (
                        <span className="italic" style={{ color: MUTED_COLOR }}>
                          {item.jobTitle}
                        </span>
                      ) : null}
                    </p>
                    <BulletList theme={theme} items={item.bullets} />
                  </div>
                }
              />
            ))}
          </section>
        ) : null}

        {education.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionBar theme={theme}>Education</SectionBar>
            {education.map((item, index) => (
              <TimelineEntry
                key={item.id}
                className={index === education.length - 1 ? '!mb-0' : ''}
                left={
                  <MetaColumn
                    startDate={item.startDate}
                    endDate={item.endDate}
                    location={item.location}
                    theme={theme}
                  />
                }
                right={
                  <p style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR, lineHeight: theme.lineHeight, margin: 0 }}>
                    {item.degree ? (
                      <span className="font-bold" style={{ color: theme.accentColor }}>
                        {item.degree}
                      </span>
                    ) : null}
                    {item.degree && item.school ? (
                      <span style={{ color: MUTED_COLOR }}>, </span>
                    ) : null}
                    {item.school ? (
                      <span className="italic" style={{ color: MUTED_COLOR }}>
                        {item.school}
                      </span>
                    ) : null}
                  </p>
                }
              />
            ))}
          </section>
        ) : null}

        {skills.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionBar theme={theme}>Skills</SectionBar>
            <ThreeColumnGrid theme={theme} items={skills} />
          </section>
        ) : null}

        {languages.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionBar theme={theme}>Languages</SectionBar>
            <ThreeColumnGrid theme={theme} items={languages} />
          </section>
        ) : null}

        {certificates.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionBar theme={theme}>Certificates</SectionBar>
            <ThreeColumnGrid theme={theme} items={certificates} />
          </section>
        ) : null}

        <TemplateExtraSectionsBlocks
          projects={projects}
          courses={courses}
          additionalSections={additionalSections}
          SectionHeading={SectionBar}
          BulletList={BulletList}
          headingColor={theme.accentColor}
          bodyColor={BODY_COLOR}
          mutedColor={MUTED_COLOR}
          theme={theme}
        />

        <TemplatePageNumberFooter theme={theme} />
      </div>
    </article>
  );
}

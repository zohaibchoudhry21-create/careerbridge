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
import { getPersonalPhoto, TEMPLATE_PREVIEW_MERCURY_PHOTO } from '../utils/personalDetailsPhoto';
import { resolveTemplateTheme, sectionStyle } from '../utils/templateCustomizeStyles';
import { levelToRating } from './AtlanticBlue';

export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

const TITLE_COLOR = '#6b7280';
const BODY_COLOR = '#374151';
const MUTED_COLOR = '#6b7280';
const RULE_COLOR = '#d1d5db';
const HEADER_BG = '#ebeae6';
const SECTION_BAR_BG = '#ebeae6';

const LEFT_COL_WIDTH = '28%';
const RIGHT_COL_WIDTH = '72%';

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

const formatDateRange = (start, end) => [start, end].filter(Boolean).join(' — ');

const getVisibleEntries = (section) =>
  (section?.entries || []).filter((entry) => entry.visible !== false);

export const mapResumeToMercuryFlowData = ({ personalDetails = {}, sections = [] } = {}) => {
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
    ? getVisibleEntries(languagesSection).map((entry) => ({
        id: entry.id,
        language: entry.fields?.language || '',
        rating: levelToRating(
          entry.fields?.level || stripHtml(entry.fields?.additionalInfo || ''),
        ),
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
      photo: getPersonalPhoto(personalDetails),
    },
    summary,
    experience,
    education,
    skills,
    languages,
    projects: mapProjectsSection(sections),
    courses: mapCoursesSection(sections),
    additionalSections: mapAdditionalSections(sections),
  };
};

export const MERCURY_FLOW_SAMPLE_DATA = {
  personalDetails: {
    fullName: 'Camila Rivera',
    professionalTitle: 'Sales Manager',
    email: 'camila.rivera@email.com',
    phone: '+1 305 555 0184',
    location: 'Miami, United States',
    linkedin: 'linkedin.com/in/camila-rivera',
    photo: TEMPLATE_PREVIEW_MERCURY_PHOTO,
  },
  summary:
    'Results-driven sales manager with 8+ years of experience leading high-performing teams, exceeding revenue targets, and building long-term client relationships. Skilled in consultative selling, pipeline management, and cross-functional collaboration across finance and technology sectors.',
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Sales Manager',
      company: 'BrightPath Business Solutions',
      startDate: '01/2023',
      endDate: 'Present',
      location: 'Miami, United States',
      bullets: [
        'Lead a team of 10 account executives and consistently exceed quarterly sales targets by 18%.',
        'Developed territory strategy that increased new business revenue by 26% year over year.',
        'Partner with marketing to launch campaigns that improved lead conversion by 14%.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Senior Sales Executive',
      company: 'Sunset Financial Group',
      startDate: '08/2019',
      endDate: '12/2022',
      location: 'Miami, United States',
      bullets: [
        'Managed a portfolio of 45 enterprise accounts with $3.2M in annual recurring revenue.',
        'Negotiated multi-year contracts that improved retention and expanded average deal size.',
        'Recognized as top performer for three consecutive fiscal years.',
      ],
    },
    {
      id: 'exp-3',
      jobTitle: 'Business Development Representative',
      company: 'Atlantic Commerce Partners',
      startDate: '05/2016',
      endDate: '07/2019',
      location: 'Miami, United States',
      bullets: [
        'Generated qualified pipeline through outbound prospecting and referral partnerships.',
        'Collaborated with account executives to shorten sales cycle and improve win rate.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Business Administration',
      school: 'Florida International University',
      startDate: '09/2012',
      endDate: '05/2016',
      location: 'Miami, United States',
    },
  ],
  skills: [
    'Account Management',
    'CRM Management',
    'Sales Forecasting',
    'Territory Planning',
    'Contract Negotiation',
    'Team Leadership',
    'Pipeline Development',
    'Client Relationship Management',
  ],
  languages: [
    { id: 'lang-1', language: 'English', rating: 5 },
    { id: 'lang-2', language: 'Spanish', rating: 4 },
  ],
};

function ContactItem({ icon, value }) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-[6px]" style={{ fontSize: 11, color: MUTED_COLOR, lineHeight: 1.4 }}>
      <AppIcon
        name={icon}
        size="h-3.5 w-3.5"
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
          color: theme?.accentColor ?? '#1f2937',
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

function DotRating({ rating, theme }) {
  const filled = Math.max(0, Math.min(5, rating || 0));
  const filledColor = theme?.accentColor ?? '#374151';
  const emptyColor = '#d1d5db';

  return (
    <span className="inline-flex gap-[3px]" style={{ fontSize: 10, lineHeight: 1 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} style={{ color: index < filled ? filledColor : emptyColor }}>
          {index < filled ? '●' : '○'}
        </span>
      ))}
    </span>
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

function TimelineEntry({ left, right, className = '' }) {
  return (
    <div className={`flex gap-[16px] ${className}`} style={{ marginBottom: 18 }}>
      <div className="shrink-0" style={{ width: LEFT_COL_WIDTH }}>
        {left}
      </div>
      <div className="flex-1" style={{ width: RIGHT_COL_WIDTH }}>
        {right}
      </div>
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

export default function MercuryFlow({ resumeData, className = '', customize }) {
  const theme = resolveTemplateTheme(customize);
  const {
    personalDetails = {},
    summary = '',
    experience = [],
    education = [],
    skills = [],
    languages = [],
    projects = [],
    courses = [],
    additionalSections = [],
  } = resumeData || {};

  const photoSrc = getPersonalPhoto(personalDetails);

  const contactItems = [
    { icon: 'mail', value: personalDetails.email },
    { icon: 'call', value: personalDetails.phone },
    { icon: 'link', value: personalDetails.linkedin },
    ...(theme.showLocation ? [{ icon: 'location_on', value: personalDetails.location }] : []),
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
      {/* HEADER */}
      <header
        style={{
          backgroundColor: HEADER_BG,
          padding: '28px 40px 24px',
        }}
      >
        <div className="flex items-start gap-[20px]">
          <div className="shrink-0">
            <TemplatePhoto
              photoSrc={photoSrc}
              theme={theme}
              className=""
              placeholderIconSize={44}
            />
          </div>

          <div className="flex-1 min-w-0 pt-[2px]">
            <h1
              className="font-bold"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 28,
                lineHeight: theme.lineHeight,
                color: theme.accentColor,
                margin: 0,
              }}
            >
              {personalDetails.fullName || 'Your Name'}
            </h1>

            {personalDetails.professionalTitle ? (
              <p
                style={{
                  fontSize: theme.bodyFontSize,
                  color: TITLE_COLOR,
                  lineHeight: theme.lineHeight,
                  margin: '6px 0 0',
                }}
              >
                {personalDetails.professionalTitle}
              </p>
            ) : null}

            {contactItems.length > 0 ? (
              <div
                className="grid grid-cols-2 gap-x-[24px] gap-y-[6px]"
                style={{ marginTop: 14 }}
              >
                {contactItems.map((item) => (
                  <ContactItem key={item.icon} icon={item.icon} value={item.value} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div style={{ height: 1, backgroundColor: RULE_COLOR, width: '100%' }} />

      {/* BODY */}
      <div style={{ padding: '22px 40px 36px' }}>
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
                    {item.company ? (
                      <p
                        className="font-bold"
                        style={{
                          fontSize: theme.bodyFontSize,
                          color: theme.accentColor,
                          lineHeight: theme.lineHeight,
                          margin: 0,
                        }}
                      >
                        {item.company}
                      </p>
                    ) : null}
                    {item.jobTitle ? (
                      <p style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR, lineHeight: theme.lineHeight, margin: '2px 0 8px' }}>
                        {item.jobTitle}
                      </p>
                    ) : null}
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
                  <div>
                    {item.degree ? (
                      <p
                        className="font-bold"
                        style={{
                          fontSize: theme.bodyFontSize,
                          color: theme.accentColor,
                          lineHeight: theme.lineHeight,
                          margin: 0,
                        }}
                      >
                        {item.degree}
                      </p>
                    ) : null}
                    {item.school ? (
                      <p style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR, lineHeight: theme.lineHeight, margin: '2px 0 0' }}>
                        {item.school}
                      </p>
                    ) : null}
                  </div>
                }
              />
            ))}
          </section>
        ) : null}

        {skills.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionBar theme={theme}>Skills</SectionBar>
            <ul
              className="grid grid-cols-3 gap-x-[12px] gap-y-[8px]"
              style={{ margin: 0, padding: 0, listStyle: 'none' }}
            >
              {skills.map((skill, index) => (
                <li
                  key={`${skill}-${index}`}
                  className="flex items-start gap-[6px]"
                  style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR, lineHeight: theme.lineHeight }}
                >
                  <span>•</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {languages.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <SectionBar theme={theme}>Languages</SectionBar>
            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[10px]">
              {languages.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-[12px]"
                  style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR }}
                >
                  <span>{item.language}</span>
                  <DotRating rating={item.rating} theme={theme} />
                </div>
              ))}
            </div>
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

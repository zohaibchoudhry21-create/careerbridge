import { stripHtml } from '../utils/resumeEditorUtils';
import { getPersonalPhoto, TEMPLATE_PREVIEW_ATLANTIC_PHOTO } from '../utils/personalDetailsPhoto';
import {
  mapAdditionalSections,
  mapCoursesSection,
  mapProjectsSection,
} from '../utils/templateExtraSections';
import TemplateExtraSectionsBlocks from '../components/TemplateExtraSectionsBlocks';
import TemplatePhoto from '../components/TemplatePhoto';
import TemplatePageNumberFooter from '../components/TemplatePageNumberFooter';
import { resolveTemplateTheme, sectionStyle } from '../utils/templateCustomizeStyles';

export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

const SIDEBAR_TITLE = '#a8c0e0';
const SIDEBAR_MUTED = 'rgba(255,255,255,0.65)';
const SIDEBAR_RULE = 'rgba(255,255,255,0.22)';

const HEADING_COLOR = '#1a2b4a';
const BODY_COLOR = '#4b5563';
const MUTED_COLOR = '#6b7280';
const RULE_COLOR = '#d1d5db';

const SIDEBAR_EDUCATION_LIMIT = 2;

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

export const levelToRating = (level = '') => {
  const normalized = level.toLowerCase();

  if (['native', 'c2', 'fluent'].some((key) => normalized.includes(key))) return 5;
  if (normalized.includes('c1')) return 4;
  if (['conversational', 'b2', 'professional'].some((key) => normalized.includes(key))) return 4;
  if (normalized.includes('b1')) return 3;
  if (['basic', 'a2'].some((key) => normalized.includes(key))) return 2;
  if (normalized.includes('a1')) return 1;

  return 3;
};

export const mapResumeToAtlanticBlueData = ({ personalDetails = {}, sections = [] } = {}) => {
  const visibleSections = (sections || []).filter((section) => section.visible !== false);

  const findSection = (...types) =>
    visibleSections.find((section) => types.includes(section.type));

  const aboutSection = findSection('about');
  const profileEntry = aboutSection ? getVisibleEntries(aboutSection)[0] : null;
  const profile =
    profileEntry?.fields?.content ||
    profileEntry?.fields?.description ||
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

  const languagesSection = findSection('languages');
  const languages = languagesSection
    ? getVisibleEntries(languagesSection).map((entry) => ({
        id: entry.id,
        language: entry.fields?.language || '',
        level: entry.fields?.level || stripHtml(entry.fields?.additionalInfo || ''),
        rating: levelToRating(
          entry.fields?.level || stripHtml(entry.fields?.additionalInfo || '')
        ),
      }))
    : [];

  const awardsSection = findSection('awards');
  const awards = awardsSection
    ? getVisibleEntries(awardsSection).map((entry) => ({
        id: entry.id,
        title: entry.fields?.title || entry.fields?.name || '',
        organization: entry.fields?.issuer || entry.fields?.organization || '',
        year: entry.fields?.date || entry.fields?.endDate || entry.fields?.startDate || '',
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
    profile,
    experience,
    education,
    sidebarEducation: education.slice(0, SIDEBAR_EDUCATION_LIMIT),
    overflowEducation: education.slice(SIDEBAR_EDUCATION_LIMIT),
    skills,
    languages,
    awards,
    projects: mapProjectsSection(sections),
    courses: mapCoursesSection(sections),
    additionalSections: mapAdditionalSections(sections, ['awards']),
  };
};

export const ATLANTIC_BLUE_SAMPLE_DATA = {
  personalDetails: {
    fullName: 'Jordan Ellis',
    professionalTitle: 'Marketing Manager',
    email: 'jordan.ellis@email.com',
    phone: '+1 (415) 555-0198',
    location: 'Boston, MA',
    linkedin: 'linkedin.com/in/jordanellis',
    website: 'jordanellis.com',
    photo: TEMPLATE_PREVIEW_ATLANTIC_PHOTO,
  },
  profile:
    'Results-driven marketing manager with 7+ years of experience building brand awareness, leading cross-channel campaigns, and growing revenue through data-informed strategy. Strong collaborator with expertise in B2B SaaS and consumer brands.',
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Marketing Manager',
      company: 'Harborline Software',
      startDate: 'Mar 2020',
      endDate: 'Present',
      location: 'Boston, MA',
      bullets: [
        'Managed annual marketing budget of $1.2M across paid, content, and event channels.',
        'Increased qualified pipeline by 34% through account-based marketing and nurture programs.',
        'Led rebranding initiative that improved aided awareness by 22% within 12 months.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Senior Marketing Specialist',
      company: 'Brightfield Agency',
      startDate: 'Jun 2016',
      endDate: 'Feb 2020',
      location: 'Cambridge, MA',
      bullets: [
        'Developed SEO and content strategy that grew organic traffic by 180%.',
        'Coordinated product launches for 6 clients with integrated digital campaigns.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'M.B.A., Marketing',
      school: 'Boston University',
      startDate: '2014',
      endDate: '2016',
    },
    {
      id: 'edu-2',
      degree: 'B.A., Communications',
      school: 'Northeastern University',
      startDate: '2010',
      endDate: '2014',
    },
  ],
  sidebarEducation: [
    {
      id: 'edu-1',
      degree: 'M.B.A., Marketing',
      school: 'Boston University',
      startDate: '2014',
      endDate: '2016',
    },
    {
      id: 'edu-2',
      degree: 'B.A., Communications',
      school: 'Northeastern University',
      startDate: '2010',
      endDate: '2014',
    },
  ],
  overflowEducation: [],
  skills: [
    'Brand Strategy',
    'Content Marketing',
    'SEO / SEM',
    'Marketing Automation',
    'Campaign Management',
    'Google Analytics',
    'HubSpot',
    'Team Leadership',
  ],
  languages: [
    { id: 'lang-1', language: 'English', level: 'Native', rating: 5 },
    { id: 'lang-2', language: 'Spanish', level: 'Professional', rating: 4 },
  ],
  awards: [
    {
      id: 'award-1',
      title: 'Marketing Excellence Award',
      organization: 'American Marketing Association',
      year: '2023',
    },
    {
      id: 'award-2',
      title: 'Top Campaign Performance',
      organization: 'Harborline Software',
      year: '2022',
    },
  ],
};

function SidebarHeading({ children, theme }) {
  return (
    <h3
      style={{
        color: '#ffffff',
        fontSize: theme?.headingFontSize ?? 10,
        letterSpacing: theme?.headingStyle?.textTransform === 'uppercase' ? '0.16em' : '0.12em',
        lineHeight: theme?.lineHeight ?? 1.2,
        marginBottom: 10,
        ...theme?.headingStyle,
      }}
    >
      {children}
    </h3>
  );
}

function RightHeading({ children, theme }) {
  return (
    <div style={{ marginBottom: Math.max(theme?.sectionSpacing ?? 12, 8) }}>
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

function SidebarContactRow({ icon, value }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-[8px]" style={{ fontSize: 10, color: SIDEBAR_MUTED, lineHeight: 1.5 }}>
      <span
        className="material-symbols-outlined shrink-0"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="break-all">{value}</span>
    </div>
  );
}

function DotRating({ rating, variant = 'sidebar', theme }) {
  const filled = Math.max(0, Math.min(5, rating || 0));
  const filledColor = variant === 'sidebar' ? '#ffffff' : (theme?.accentColor ?? HEADING_COLOR);
  const emptyColor = variant === 'sidebar' ? 'rgba(255,255,255,0.28)' : '#cbd5e1';

  return (
    <span className="inline-flex gap-[2px]" style={{ fontSize: 9, lineHeight: 1 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} style={{ color: index < filled ? filledColor : emptyColor }}>
          ●
        </span>
      ))}
    </span>
  );
}

function BulletList({ items, theme }) {
  if (!items?.length) return null;

  return (
    <ul
      className="list-disc pl-[18px] space-y-[6px] break-words"
      style={{
        color: BODY_COLOR,
        fontSize: theme?.bodyFontSize ?? 11,
        lineHeight: theme?.lineHeight ?? 1.55,
        overflowWrap: 'anywhere',
      }}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function AtlanticBlue({ resumeData, className = '', customize }) {
  const theme = resolveTemplateTheme(customize);
  const {
    personalDetails = {},
    profile = '',
    experience = [],
    sidebarEducation = [],
    overflowEducation = [],
    skills = [],
    languages = [],
    awards = [],
    projects = [],
    courses = [],
    additionalSections = [],
  } = resumeData || {};

  const photoSrc = getPersonalPhoto(resumeData?.personalDetails);

  return (
    <article
      className={`flex min-w-0 ${className}`}
      style={{
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        ...theme.wrapperStyle,
      }}
    >
      {/* LEFT SIDEBAR — 35% */}
      <aside
        className="shrink-0 px-[24px] py-[36px]"
        style={{
          width: '35%',
          backgroundColor: theme.accentColor,
          color: '#ffffff',
        }}
      >
        <div className="text-center mb-[18px]">
          <TemplatePhoto photoSrc={photoSrc} theme={theme} />

          <h1
            className="font-bold"
            style={{
              fontSize: 22,
              lineHeight: theme.lineHeight,
              color: '#ffffff',
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            {personalDetails.fullName || 'Your Name'}
          </h1>

          {personalDetails.professionalTitle ? (
            <p style={{ fontSize: theme.bodyFontSize, color: SIDEBAR_TITLE, lineHeight: theme.lineHeight }}>
              {personalDetails.professionalTitle}
            </p>
          ) : null}

          <div
            style={{
              height: 1,
              backgroundColor: SIDEBAR_RULE,
              width: '100%',
              marginTop: 16,
            }}
          />
        </div>

        <div>
          <section style={sectionStyle(theme)}>
            <SidebarHeading theme={theme}>Contact</SidebarHeading>
            <div className="space-y-[8px]">
              <SidebarContactRow icon="call" value={personalDetails.phone} />
              <SidebarContactRow icon="mail" value={personalDetails.email} />
              {theme.showLocation ? (
                <SidebarContactRow icon="location_on" value={personalDetails.location} />
              ) : null}
              <SidebarContactRow icon="link" value={personalDetails.linkedin} />
              <SidebarContactRow icon="language" value={personalDetails.website} />
            </div>
          </section>

          {skills.length > 0 ? (
            <section style={sectionStyle(theme)}>
              <SidebarHeading theme={theme}>Skills</SidebarHeading>
              <ul className="space-y-[6px]">
                {skills.map((skill, index) => (
                  <li
                    key={`${skill}-${index}`}
                    className="flex items-start gap-[8px]"
                    style={{ fontSize: theme.smallFontSize, color: SIDEBAR_MUTED, lineHeight: theme.lineHeight }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.75)' }}>–</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {languages.length > 0 ? (
            <section style={sectionStyle(theme)}>
              <SidebarHeading theme={theme}>Languages</SidebarHeading>
              <div className="space-y-[8px]">
                {languages.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-[8px]"
                    style={{ fontSize: theme.smallFontSize, color: SIDEBAR_MUTED }}
                  >
                    <span>{item.language}</span>
                    <DotRating rating={item.rating} variant="sidebar" theme={theme} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {sidebarEducation.length > 0 ? (
            <section style={sectionStyle(theme)}>
              <SidebarHeading theme={theme}>Education</SidebarHeading>
              <div className="space-y-[12px]">
                {sidebarEducation.map((item) => (
                  <div key={item.id}>
                    <p className="font-semibold" style={{ fontSize: theme.bodyFontSize, color: '#ffffff', lineHeight: theme.lineHeight }}>
                      {item.degree}
                    </p>
                    <p style={{ fontSize: theme.smallFontSize, color: SIDEBAR_TITLE, lineHeight: theme.lineHeight, marginTop: 2 }}>
                      {item.school}
                    </p>
                    {theme.showDates && (item.startDate || item.endDate) ? (
                      <p style={{ fontSize: theme.smallFontSize, color: SIDEBAR_MUTED, marginTop: 2 }}>
                        {formatDateRange(item.startDate, item.endDate)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </aside>

      {/* RIGHT CONTENT — 65% */}
      <main
        className="shrink-0 min-w-0 px-[40px] py-[40px]"
        style={{ width: '65%', backgroundColor: '#ffffff' }}
      >
        {experience.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <RightHeading theme={theme}>Work Experience</RightHeading>
            <div className="space-y-[18px]">
              {experience.map((job) => (
                <div key={job.id}>
                  <div className="flex items-start justify-between gap-[12px]">
                    <p
                      className="font-bold min-w-0 break-words"
                      style={{
                        fontSize: theme.titleFontSize,
                        color: theme.accentColor,
                        lineHeight: theme.lineHeight,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {job.company || job.jobTitle}
                    </p>
                    {theme.showDates && (job.startDate || job.endDate) ? (
                      <p className="shrink-0" style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR, lineHeight: theme.lineHeight }}>
                        {formatDateRange(job.startDate, job.endDate)}
                      </p>
                    ) : null}
                  </div>
                  {job.jobTitle ? (
                    <p
                      className="break-words"
                      style={{
                        fontSize: theme.bodyFontSize,
                        color: theme.accentColor,
                        lineHeight: theme.lineHeight,
                        marginTop: 2,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {job.jobTitle}
                    </p>
                  ) : null}
                  {theme.showLocation && job.location ? (
                    <p className="italic" style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR, marginTop: 2, marginBottom: 8 }}>
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

        {profile ? (
          <section style={sectionStyle(theme)}>
            <RightHeading theme={theme}>Profile</RightHeading>
            <div
              style={{ fontSize: theme.bodyFontSize, lineHeight: theme.lineHeight, color: BODY_COLOR }}
              dangerouslySetInnerHTML={{ __html: profile }}
            />
          </section>
        ) : null}

        {overflowEducation.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <RightHeading theme={theme}>Education</RightHeading>
            <div className="space-y-[14px]">
              {overflowEducation.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-[12px]">
                  <div>
                    <p className="font-bold" style={{ fontSize: theme.titleFontSize, color: theme.accentColor, lineHeight: theme.lineHeight }}>
                      {item.degree}
                    </p>
                    <p style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR, marginTop: 2 }}>{item.school}</p>
                  </div>
                  {theme.showDates && (item.startDate || item.endDate) ? (
                    <p className="shrink-0" style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR }}>
                      {formatDateRange(item.startDate, item.endDate)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {languages.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <RightHeading theme={theme}>Languages</RightHeading>
            <div className="space-y-[8px]">
              {languages.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-[12px]"
                  style={{ fontSize: theme.bodyFontSize, color: BODY_COLOR }}
                >
                  <span className="font-medium" style={{ color: theme.accentColor }}>
                    {item.language}
                  </span>
                  <DotRating rating={item.rating} variant="content" theme={theme} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {awards.length > 0 ? (
          <section style={sectionStyle(theme)}>
            <RightHeading theme={theme}>Awards</RightHeading>
            <div className="space-y-[12px]">
              {awards.map((award) => (
                <div key={award.id}>
                  <p className="font-bold" style={{ fontSize: theme.titleFontSize, color: theme.accentColor, lineHeight: theme.lineHeight }}>
                    {award.title}
                  </p>
                  <p style={{ fontSize: theme.smallFontSize, color: MUTED_COLOR, marginTop: 2 }}>
                    {[award.organization, award.year].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <TemplateExtraSectionsBlocks
          projects={projects}
          courses={courses}
          additionalSections={additionalSections}
          SectionHeading={RightHeading}
          BulletList={BulletList}
          headingColor={theme.accentColor}
          bodyColor={BODY_COLOR}
          mutedColor={MUTED_COLOR}
          theme={theme}
        />

        <TemplatePageNumberFooter theme={theme} />
      </main>
    </article>
  );
}

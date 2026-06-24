import { sectionStyle } from '../utils/templateCustomizeStyles';

export default function TemplateExtraSectionsBlocks({
  projects = [],
  courses = [],
  additionalSections = [],
  SectionHeading,
  BulletList,
  headingColor,
  bodyColor,
  mutedColor,
  theme,
}) {
  const accent = theme?.accentColor ?? headingColor;
  const body = bodyColor;
  const muted = mutedColor;
  const titleSize = theme?.titleFontSize ?? 11.5;
  const smallSize = theme?.smallFontSize ?? 10.5;
  const bodySize = theme?.bodyFontSize ?? 11;
  const sectionBlockStyle = theme ? sectionStyle(theme) : undefined;

  return (
    <>
      {projects.length > 0 ? (
        <section style={sectionBlockStyle}>
          <SectionHeading theme={theme}>Projects</SectionHeading>
          <div className="space-y-[14px]">
            {projects.map((project) => (
              <div key={project.id}>
                <div className="flex items-start justify-between gap-[16px]">
                  <p
                    style={{
                      fontSize: titleSize,
                      lineHeight: theme?.lineHeight ?? 1.45,
                      color: accent,
                      fontWeight: 600,
                    }}
                  >
                    {project.title}
                  </p>
                  {(!theme || theme.showDates) && project.dateRange ? (
                    <p className="shrink-0" style={{ fontSize: smallSize, color: muted }}>
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
        <section style={sectionBlockStyle}>
          <SectionHeading theme={theme}>Courses</SectionHeading>
          <div className="space-y-[12px]">
            {courses.map((course) => (
              <div key={course.id}>
                <p
                  style={{
                    fontSize: titleSize,
                    lineHeight: theme?.lineHeight ?? 1.45,
                    color: accent,
                    fontWeight: 600,
                  }}
                >
                  {course.title}
                  {course.institution ? (
                    <span style={{ fontWeight: 400, color: body }}> — {course.institution}</span>
                  ) : null}
                </p>
                {(!theme || theme.showDates) && course.dateRange ? (
                  <p style={{ fontSize: smallSize, color: muted }}>{course.dateRange}</p>
                ) : null}
                {course.description ? (
                  <p style={{ fontSize: bodySize, color: body, marginTop: 4 }}>{course.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {additionalSections.map((section) => (
        <section key={section.id} style={sectionBlockStyle}>
          <SectionHeading theme={theme}>{section.heading}</SectionHeading>
          <div className="space-y-[10px]">
            {section.entries.map((entry) => (
              <div key={entry.id}>
                <p style={{ fontSize: titleSize, fontWeight: 600, color: accent }}>{entry.title}</p>
                {entry.description ? (
                  <p style={{ fontSize: bodySize, color: body, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                    {entry.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

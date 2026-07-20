import AppIcon from '../../../components/icons/AppIcon';
import { getTemplateById } from '../data/resumeTemplates';
import { mergeCustomize } from '../data/resumeCustomizeDefaults';
import { stripHtml } from '../utils/resumeEditorUtils';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import ClassicClear, { mapResumeToClassicClearData } from '../templates/ClassicClear';
import AtlanticBlue, { mapResumeToAtlanticBlueData } from '../templates/AtlanticBlue';
import MercuryFlow, { mapResumeToMercuryFlowData } from '../templates/MercuryFlow';
import SteadyForm, { mapResumeToSteadyFormData } from '../templates/SteadyForm';
import { resolvePreviewLayout } from './TemplatePreviewLayouts';
import EditorPreviewScaler from './EditorPreviewScaler';

function PreviewFrame({ children }) {
  return (
    <div className="mx-auto w-full max-w-[794px]">
      <div className="rounded-xl border border-outline-variant/40 bg-white shadow-sm overflow-hidden">
        <EditorPreviewScaler>{children}</EditorPreviewScaler>
      </div>
    </div>
  );
}

function ContactLine({ icon, value }) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
      <AppIcon name={icon} size="h-3.5 w-3.5" className="text-on-surface-variant" />
      <span>{value}</span>
    </div>
  );
}

function SectionBlock({ heading, children, colors }) {
  return (
    <section className="mb-4">
      <h3
        className="text-[12px] font-semibold uppercase tracking-wide mb-2"
        style={{ color: colors.primary }}
      >
        {heading}
      </h3>
      {children}
    </section>
  );
}

function renderSectionContent(section) {
  const visibleEntries = section.entries.filter((entry) => entry.visible);

  switch (section.type) {
    case 'about':
      return visibleEntries.map((entry) => (
        <div
          key={entry.id}
          className="text-[11px] leading-relaxed text-on-surface whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.fields.content || '') }}
        />
      ));
    case 'experience':
    case 'education':
    case 'courses':
      return visibleEntries.map((entry) => (
        <div key={entry.id} className="mb-3">
          <div className="flex justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold text-on-surface">
                {entry.fields.jobTitle || entry.fields.degree || entry.fields.courseTitle}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                {entry.fields.employer || entry.fields.school || entry.fields.institution}
              </p>
            </div>
            <p className="text-[10px] text-on-surface-variant shrink-0">
              {[entry.fields.startDate, entry.fields.endDate].filter(Boolean).join(' - ')}
            </p>
          </div>
          {entry.fields.location && (
            <p className="text-[10px] text-on-surface-variant">{entry.fields.location}</p>
          )}
          {entry.fields.description && (
            <div
              className="mt-1 text-[11px] text-on-surface whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.fields.description) }}
            />
          )}
        </div>
      ));
    case 'expertise':
      return (
        <ul className="grid grid-cols-2 gap-1">
          {visibleEntries.map((entry) => (
            <li key={entry.id} className="text-[11px] text-on-surface list-disc ml-4">
              {entry.fields.name}
            </li>
          ))}
        </ul>
      );
    case 'languages':
      return visibleEntries.map((entry) => (
        <p key={entry.id} className="text-[11px] text-on-surface mb-1">
          <span className="font-medium">{entry.fields.language}</span>
          {entry.fields.level ? ` — ${entry.fields.level}` : ''}
          {entry.fields.additionalInfo ? ` (${stripHtml(entry.fields.additionalInfo)})` : ''}
        </p>
      ));
    default:
      return visibleEntries.map((entry) => (
        <div key={entry.id} className="mb-2 text-[11px] text-on-surface">
          <p className="font-medium">
            {entry.fields.title || entry.fields.name || entry.fields.courseTitle || 'Entry'}
          </p>
          {(entry.fields.description || entry.fields.content) && (
            <div
              className="text-on-surface-variant whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(entry.fields.description || entry.fields.content || ''),
              }}
            />
          )}
        </div>
      ));
  }
}

export default function ResumePreview({ templateId, personalDetails, sections, customize }) {
  const template = getTemplateById(templateId);
  const previewLayout = resolvePreviewLayout(template);
  const resolvedCustomize = mergeCustomize(customize, templateId);

  if (previewLayout === 'classic-clear') {
    return (
      <PreviewFrame>
        <div id="resume-preview-document">
          <ClassicClear
            resumeData={mapResumeToClassicClearData({ personalDetails, sections })}
            customize={resolvedCustomize}
          />
        </div>
      </PreviewFrame>
    );
  }

  if (previewLayout === 'atlantic-sidebar') {
    return (
      <PreviewFrame>
        <div id="resume-preview-document">
          <AtlanticBlue
            resumeData={mapResumeToAtlanticBlueData({ personalDetails, sections })}
            customize={resolvedCustomize}
          />
        </div>
      </PreviewFrame>
    );
  }

  if (previewLayout === 'mercury-flow') {
    return (
      <PreviewFrame>
        <div id="resume-preview-document">
          <MercuryFlow
            resumeData={mapResumeToMercuryFlowData({ personalDetails, sections })}
            customize={resolvedCustomize}
          />
        </div>
      </PreviewFrame>
    );
  }

  if (previewLayout === 'steady-form') {
    return (
      <PreviewFrame>
        <div id="resume-preview-document">
          <SteadyForm
            resumeData={mapResumeToSteadyFormData({ personalDetails, sections })}
            customize={resolvedCustomize}
          />
        </div>
      </PreviewFrame>
    );
  }

  const { colors, layout } = template;
  const visibleSections = sections.filter((section) => section.visible);

  const header = (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        {personalDetails.photoUrl ? (
          <img
            src={personalDetails.photoUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover border border-outline-variant/40"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-surface-container flex items-center justify-center">
            <AppIcon name="person" size="dashboard" className="text-on-surface-variant" />
          </div>
        )}
        <div>
          <h1 className="text-[22px] font-bold leading-tight" style={{ color: colors.primary }}>
            {personalDetails.fullName || 'Your Name'}
          </h1>
          <p className="text-[12px] text-on-surface-variant">{personalDetails.professionalTitle}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1">
        <ContactLine icon="mail" value={personalDetails.email} />
        <ContactLine icon="call" value={personalDetails.phone} />
        <ContactLine icon="location_on" value={personalDetails.location} />
        <ContactLine icon="language" value={personalDetails.website} />
        <ContactLine icon="link" value={personalDetails.linkedin} />
      </div>
    </div>
  );

  const body = visibleSections.map((section) => (
    <SectionBlock key={section.id} heading={section.heading} colors={colors}>
      {renderSectionContent(section)}
    </SectionBlock>
  ));

  return (
    <PreviewFrame>
      <div
        id="resume-preview-document"
        className="min-h-[297mm]"
        style={{ background: colors.background }}
      >
      {layout === 'header-band' && <div className="h-3" style={{ background: colors.primary }} />}
      <div className={`p-6 ${layout === 'sidebar' ? 'flex gap-5' : ''}`}>
        {layout === 'sidebar' ? (
          <>
            <aside className="w-[30%] shrink-0 rounded-lg p-3" style={{ background: colors.sidebar }}>
              {header}
            </aside>
            <main className="flex-1">{body}</main>
          </>
        ) : (
          <>
            {header}
            {body}
          </>
        )}
      </div>
      </div>
    </PreviewFrame>
  );
}

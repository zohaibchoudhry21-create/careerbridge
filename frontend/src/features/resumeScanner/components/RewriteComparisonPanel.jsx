import { useTranslation } from 'react-i18next';
import StructuredResumeView from './StructuredResumeView';
import { cn } from '../../../lib/utils';
import {
  generateAtsText,
  hasStructuredResumeData,
  structuredResumeToSections,
} from '../utils/structuredResumeUtils';

function ResumeColumn({ title, badge, structuredResume, fallbackText, badgeClassName }) {
  const sections = hasStructuredResumeData(structuredResume)
    ? structuredResumeToSections(structuredResume)
    : null;
  const text = structuredResume ? generateAtsText(structuredResume) : fallbackText;

  return (
    <div className="flex flex-col min-h-0 min-w-0 flex-1">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {badge ? (
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
              badgeClassName
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 lg:p-6 shadow-sm min-h-0">
        <StructuredResumeView structuredSections={sections} fallbackText={text} />
      </div>
    </div>
  );
}

export default function RewriteComparisonPanel({
  analysis,
  onAcceptRewrite,
  onRejectRewrite,
  isAccepting = false,
  isRejecting = false,
}) {
  const { t } = useTranslation('resumeScanner');

  const originalResume = analysis?.structuredResume;
  const rewrittenResume = analysis?.rewrittenResume;
  const rewriteNotes = analysis?.rewriteNotes || [];
  const rewrittenSections =
    rewrittenResume?.sectionOrder?.length
      ? rewrittenResume.sectionOrder
      : [
          rewrittenResume?.summary ? { type: 'summary', heading: 'Professional Summary' } : null,
          rewrittenResume?.workExperience?.length
            ? { type: 'experience', heading: 'Work Experience' }
            : null,
          rewrittenResume?.education?.length ? { type: 'education', heading: 'Education' } : null,
          rewrittenResume?.skills?.length ? { type: 'skills', heading: 'Skills' } : null,
          rewrittenResume?.projects?.length ? { type: 'projects', heading: 'Projects' } : null,
          rewrittenResume?.certifications?.length
            ? { type: 'certifications', heading: 'Certifications' }
            : null,
          rewrittenResume?.achievements?.length
            ? { type: 'achievements', heading: 'Achievements' }
            : null,
          rewrittenResume?.languages?.length ? { type: 'languages', heading: 'Languages' } : null,
          ...(rewrittenResume?.additionalSections || []).map((s) => ({
            type: s.type,
            heading: s.heading,
          })),
        ].filter(Boolean);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="px-6 lg:px-8 py-4 bg-amber-50 border-b border-amber-200 shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 mb-1">
          {t('analysis.phases.rewriteGate')}
        </p>
        <p className="text-sm font-semibold text-amber-900">
          {t('analysis.rewrite.bannerTitle')}
        </p>
        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
          {t('analysis.rewrite.bannerDescription')}
        </p>
        <p className="text-xs text-amber-900/80 mt-2 font-medium">
          {t('analysis.rewrite.gateRequired')}
        </p>
        {rewrittenSections.length ? (
          <p className="mt-2 text-[11px] text-amber-800">
            {t('analysis.rewrite.sectionsRewritten', { count: rewrittenSections.length })}{' '}
            <span className="text-amber-700">
              {rewrittenSections.map((s) => s.heading || s.type).join(' · ')}
            </span>
          </p>
        ) : null}
        {rewriteNotes.length ? (
          <ul className="mt-2 text-[11px] text-amber-800 list-disc pl-4 space-y-0.5">
            {rewriteNotes.slice(0, 4).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex-1 overflow-hidden p-4 lg:p-6 bg-slate-50 min-h-0">
        <div className="h-full flex flex-col lg:flex-row gap-4 min-h-0">
          <ResumeColumn
            title={t('analysis.rewrite.originalLabel')}
            badge={t('analysis.rewrite.originalBadge')}
            structuredResume={originalResume}
            fallbackText={analysis?.originalResumeText || analysis?.resumeText}
            badgeClassName="bg-slate-100 text-slate-600"
          />
          <ResumeColumn
            title={t('analysis.rewrite.rewrittenLabel')}
            badge={t('analysis.rewrite.rewrittenBadge')}
            structuredResume={rewrittenResume}
            fallbackText={analysis?.rewrittenText}
            badgeClassName="bg-blue-100 text-blue-700"
          />
        </div>
      </div>

      <div className="px-6 lg:px-8 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onRejectRewrite}
          disabled={isAccepting || isRejecting}
          className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {isRejecting ? t('analysis.rewrite.rejecting') : t('analysis.rewrite.keepOriginal')}
        </button>
        <button
          type="button"
          onClick={onAcceptRewrite}
          disabled={isAccepting || isRejecting}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isAccepting ? t('analysis.rewrite.applying') : t('analysis.rewrite.useRewritten')}
        </button>
      </div>
    </div>
  );
}

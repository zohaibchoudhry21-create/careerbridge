import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScanSearch, ArrowRight } from 'lucide-react';

function ResumeScannerSection({ profileStrength, resumeIntelligence }) {
  const { t } = useTranslation('dashboard');

  const hasData = profileStrength || resumeIntelligence;

  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <ScanSearch className="h-5 w-5 text-blue-600" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">{t('resumeScanner.empty.title')}</h3>
              <p className="mt-1 text-sm text-slate-500">{t('resumeScanner.empty.description')}</p>
            </div>
          </div>
          <Link
            to="/resume-scanner"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('resumeScanner.empty.cta')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const { score, atsScore, skillsMatched, skillsTotal, missingSkills } = profileStrength || {};
  const gaps = (missingSkills || []).slice(0, 4);
  const insight = resumeIntelligence?.aiInsight?.improvementPotential;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">
            <p className="text-2xl font-semibold text-blue-700">{score ?? '—'}%</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-blue-600/80">
              {t('profileStrength.title')}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-xl font-semibold text-slate-900">{atsScore != null ? `${atsScore}%` : '—'}</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {t('profileStrength.atsScore')}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-xl font-semibold text-slate-900">
              {skillsMatched != null ? `${skillsMatched}/${skillsTotal ?? 0}` : '—'}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {t('profileStrength.skillsMatched')}
            </p>
          </div>
        </div>

        <Link
          to="/resume-scanner"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-slate-50"
        >
          {t('resumeScanner.openScanner')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {gaps.length ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t('profileStrength.missingSkills')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {gaps.map((skill) => (
              <span
                key={skill.label}
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  skill.priority
                    ? 'bg-red-100 font-medium text-red-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {skill.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {insight ? (
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{t('resumeIntelligence.aiInsight')}: </span>
          {t('resumeScanner.compactInsight', { potential: insight })}
        </p>
      ) : null}
    </div>
  );
}

export default memo(ResumeScannerSection);

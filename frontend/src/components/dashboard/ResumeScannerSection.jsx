import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { ScanSearch, ArrowRight, Sparkles } from 'lucide-react';

function ScoreRing({ value, max = 100, label }) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80" aria-hidden>
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="#2563eb"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none text-slate-900">{value}</span>
          <span className="text-[10px] text-slate-400">/{max}</span>
        </div>
      </div>
      <p className="text-center text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function ResumeScannerSection({ profileStrength, resumeIntelligence }) {
  const { t } = useTranslation('dashboard');

  const hasData = profileStrength || resumeIntelligence;

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 sm:p-8">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-start sm:justify-between sm:gap-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-4">
            <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 sm:mb-0">
              <ScanSearch className="h-6 w-6 text-blue-600" aria-hidden />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {t('resumeScanner.empty.title')}
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {t('resumeScanner.empty.description')}
              </p>
            </div>
          </div>
          <Link
            to="/resume-scanner"
            className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:mt-0"
          >
            {t('resumeScanner.empty.cta')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const { score, maxScore, atsScore, skillsMatched, skillsTotal, missingSkills } =
    profileStrength || {};
  const { atsOptimizationStatus, keywordGaps, aiInsight } = resumeIntelligence || {};

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {profileStrength ? (
        <div className="border-b border-slate-100 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <ScoreRing
              value={score}
              max={maxScore}
              label={t('profileStrength.title')}
            />
            <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-xs">
              <StatTile label={t('profileStrength.atsScore')} value={`${atsScore}%`} />
              <StatTile
                label={t('profileStrength.skillsMatched')}
                value={`${skillsMatched}/${skillsTotal}`}
              />
            </div>
            {missingSkills?.length ? (
              <div className="min-w-0 flex-1 sm:border-s sm:border-slate-100 sm:ps-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {t('profileStrength.missingSkills')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.map((skill) => (
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
          </div>
        </div>
      ) : null}

      {resumeIntelligence ? (
        <div className="grid gap-0 border-b border-slate-100 sm:grid-cols-2">
          <div className="border-b border-slate-100 p-5 sm:border-b-0 sm:border-e sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('resumeIntelligence.title')}
            </p>
            <div className="mb-4 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  atsOptimizationStatus === 'Active'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {atsOptimizationStatus}
              </span>
              <span className="text-sm text-slate-500">{t('resumeIntelligence.atsStatusLabel')}</span>
            </div>
            {keywordGaps?.length ? (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">
                  {t('resumeIntelligence.keywordGaps')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keywordGaps.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {aiInsight ? (
            <div className="flex flex-col justify-center bg-slate-50/50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <Sparkles className="h-4 w-4 text-blue-600" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700">{t('resumeIntelligence.aiInsight')}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    <Trans
                      i18nKey="resumeIntelligence.improvementPotential"
                      ns="dashboard"
                      values={{ potential: aiInsight?.improvementPotential }}
                      components={{ strong: <strong className="font-semibold text-slate-900" /> }}
                    />
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/40 px-5 py-3 sm:px-6">
        <Link
          to="/resume-scanner"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {t('resumeScanner.openScanner')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export default memo(ResumeScannerSection);

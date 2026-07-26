import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { buttonPrimaryClass, buttonSecondaryClass } from '../ui/buttonTokens';

function JobMatchCard({ job }) {
  const { t } = useTranslation('dashboard');

  if (!job) return null;

  const isPrimary = job.featured;

  return (
    <div className="group p-sm dashboard-inner-surface rounded-2xl border border-transparent hover:border-secondary dark:hover:border-[#60a5fa] transition-all cursor-pointer dashboard-card-hover">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-sm">
        <div className="flex gap-sm min-w-0 flex-1">
          <div className="w-10 h-10 bg-white dark:bg-[#2d3a4f] rounded-xl shadow-sm flex items-center justify-center p-xs shrink-0">
            <img
              alt={t('jobMatches.companyLogo', { company: job.company })}
              className="w-full h-full object-contain"
              src={job.logoUrl}
              loading="lazy"
            />
          </div>
          <div className="min-w-0">
            <h5 className="font-bold text-base break-words text-on-surface dark:text-[#eaf1ff]">{job.title}</h5>
            <p className="dashboard-muted text-[14px] break-words">
              {job.company} • {job.location} • {job.salary}
            </p>
            <div className="mt-xs flex flex-wrap items-center gap-sm">
              <span className="flex items-center gap-1 text-[12px] text-secondary dark:text-[#93c5fd] font-bold">
                {t('jobMatches.skillMatch', { percent: job.matchPercentage })}
              </span>
              {job.recommendedByAi ? (
                <span className="text-[12px] dashboard-muted">{t('jobMatches.recommendedByAi')}</span>
              ) : null}
            </div>
          </div>
        </div>
        <a
          href={job.applyUrl}
          className={cn(
            'min-h-[44px] shrink-0 rounded-full px-4 py-2 text-center text-[14px] font-bold',
            isPrimary ? buttonPrimaryClass : buttonSecondaryClass
          )}
        >
          {t('jobMatches.quickApply')}
        </a>
      </div>
    </div>
  );
}

export default memo(JobMatchCard);

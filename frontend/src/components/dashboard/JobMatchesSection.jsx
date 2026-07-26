import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import JobMatchCard from './JobMatchCard';
import AppIcon from '../icons/AppIcon';
import SectionIcon from '../ui/SectionIcon';

function JobMatchesSection({ matches = [] }) {
  const { t } = useTranslation('dashboard');

  return (
    <div className="col-span-1 min-w-0 overflow-hidden rounded-2xl dashboard-glass-card dashboard-card-padding lg:col-span-8">
      <div className="mb-sm flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SectionIcon color="skills" icon="work" />
          <h4 className="dashboard-section-title">{t('jobMatches.title')}</h4>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 text-[14px] font-bold text-secondary"
        >
          {t('jobMatches.viewAll')} <AppIcon name="chevron_right" size="button" />
        </button>
      </div>
      <div className="space-y-sm">
        {matches.map((job) => (
          <JobMatchCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

export default memo(JobMatchesSection);

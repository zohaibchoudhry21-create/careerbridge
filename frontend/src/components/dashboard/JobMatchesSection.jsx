import { memo } from 'react';
import JobMatchCard from './JobMatchCard';
import AppIcon from '../icons/AppIcon';

function JobMatchesSection({ matches = [] }) {
  return (
    <div className="col-span-1 lg:col-span-8 dashboard-glass-card dashboard-card-padding rounded-2xl overflow-hidden min-w-0">
      <div className="flex justify-between items-center mb-sm gap-2">
        <h4 className="font-headline-section text-headline-section">Today&apos;s Top AI Matches</h4>
        <button
          type="button"
          className="text-secondary font-bold text-[14px] flex items-center gap-1 shrink-0"
        >
          View All <AppIcon name="chevron_right" size="button" />
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

import { memo } from 'react';

function JobMatchCard({ job }) {
  if (!job) return null;

  const isPrimary = job.featured;

  return (
    <div className="group p-sm bg-surface-container-low rounded-2xl border border-transparent hover:border-secondary transition-all cursor-pointer dashboard-card-hover">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-sm">
        <div className="flex gap-sm min-w-0 flex-1">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center p-xs shrink-0">
            <img
              alt={`${job.company} logo`}
              className="w-full h-full object-contain"
              src={job.logoUrl}
              loading="lazy"
            />
          </div>
          <div className="min-w-0">
            <h5 className="font-bold text-base break-words">{job.title}</h5>
            <p className="text-on-surface-variant text-[14px] break-words">
              {job.company} • {job.location} • {job.salary}
            </p>
            <div className="mt-xs flex flex-wrap items-center gap-sm">
              <span className="flex items-center gap-1 text-[12px] text-secondary font-bold">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                {job.matchPercentage}% Skill Match
              </span>
              {job.recommendedByAi ? (
                <span className="text-[12px] text-on-surface-variant">Recommended by AI Agent</span>
              ) : null}
            </div>
          </div>
        </div>
        <a
          href={job.applyUrl}
          className={`px-4 py-2 rounded-full font-bold text-[14px] text-center shrink-0 min-h-[44px] flex items-center justify-center transition-all ${
            isPrimary
              ? 'bg-secondary text-white'
              : 'bg-secondary/10 text-secondary hover:bg-secondary hover:text-white'
          }`}
        >
          Quick Apply
        </a>
      </div>
    </div>
  );
}

export default memo(JobMatchCard);

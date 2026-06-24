import { memo } from 'react';

function ProfileStrengthCard({ profileStrength }) {
  if (!profileStrength) return null;

  const { score, maxScore, atsScore, skillsMatched, skillsTotal, missingSkills } = profileStrength;
  const widthPercent = Math.min(100, Math.round((score / maxScore) * 100));

  return (
    <div className="col-span-1 lg:col-span-4 dashboard-glass-card dashboard-card-padding rounded-2xl min-w-0">
      <h4 className="font-headline-section text-headline-section mb-xs flex justify-between gap-2">
        Profile Strength <span className="text-secondary shrink-0">{score}/{maxScore}</span>
      </h4>
      <div className="w-full bg-surface-container-high h-2 rounded-full mb-sm">
        <div className="bg-secondary h-2 rounded-full transition-all" style={{ width: `${widthPercent}%` }} />
      </div>
      <div className="space-y-sm">
        <div className="flex justify-between items-center p-sm bg-surface-container-low rounded-xl">
          <span className="font-label-md">ATS Score</span>
          <span className="font-label-md text-secondary">{atsScore}%</span>
        </div>
        <div className="flex justify-between items-center p-sm bg-surface-container-low rounded-xl">
          <span className="font-label-md">Skills Matched</span>
          <span className="font-label-md text-secondary">{skillsMatched}/{skillsTotal}</span>
        </div>
      </div>
      <div className="mt-sm">
        <p className="font-label-md text-on-surface-variant mb-xs">Missing Skills (Priority):</p>
        <div className="flex flex-wrap gap-xs">
          {missingSkills?.map((skill) => (
            <span
              key={skill.label}
              className={`px-3 py-1 rounded-full text-[12px] ${
                skill.priority
                  ? 'bg-error-container text-on-error-container font-bold'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {skill.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileStrengthCard);

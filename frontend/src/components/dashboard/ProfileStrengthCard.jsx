import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import SectionIcon from '../ui/SectionIcon';

function ProfileStrengthCard({ profileStrength }) {
  const { t } = useTranslation('dashboard');

  if (!profileStrength) return null;

  const { score, maxScore, atsScore, skillsMatched, skillsTotal, missingSkills } = profileStrength;
  const widthPercent = Math.min(100, Math.round((score / maxScore) * 100));

  return (
    <div className="col-span-1 min-w-0 rounded-2xl dashboard-glass-card dashboard-card-padding lg:col-span-4">
      <div className="mb-xs flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SectionIcon color="role" icon="trending_up" />
          <h4 className="font-headline-section text-headline-section">{t('profileStrength.title')}</h4>
        </div>
        <span className="shrink-0 font-bold text-secondary">
          {score}/{maxScore}
        </span>
      </div>
      <div className="mb-sm h-2 w-full rounded-full bg-surface-container-high">
        <div className="h-2 rounded-full bg-secondary transition-all" style={{ width: `${widthPercent}%` }} />
      </div>
      <div className="space-y-sm">
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-sm">
          <span className="font-label-md">{t('profileStrength.atsScore')}</span>
          <span className="font-label-md text-secondary">{atsScore}%</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-sm">
          <span className="font-label-md">{t('profileStrength.skillsMatched')}</span>
          <span className="font-label-md text-secondary">
            {skillsMatched}/{skillsTotal}
          </span>
        </div>
      </div>
      <div className="mt-sm">
        <p className="mb-xs font-label-md text-on-surface-variant">{t('profileStrength.missingSkills')}</p>
        <div className="flex flex-wrap gap-xs">
          {missingSkills?.map((skill) => (
            <span
              key={skill.label}
              className={`rounded-full px-3 py-1 text-[12px] ${
                skill.priority
                  ? 'bg-error-container font-bold text-on-error-container'
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

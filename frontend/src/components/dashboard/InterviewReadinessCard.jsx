import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import SectionIcon from '../ui/SectionIcon';
import { selectedOptionClass, unselectedOptionClass } from '../ui/colorAccentTokens';
import { cn } from '../../lib/utils';

function InterviewReadinessCard({ interviewReadiness }) {
  const { t } = useTranslation('dashboard');

  if (!interviewReadiness) return null;

  const { score, weakAreas, strongArea } = interviewReadiness;

  return (
    <div className="min-w-0 rounded-2xl dashboard-glass-card dashboard-card-padding">
      <div className="mb-xs flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SectionIcon color="mode" icon="mic_external_on" />
          <h4 className="dashboard-section-title">{t('interviewReadiness.title')}</h4>
        </div>
        <span className="font-bold text-secondary dark:text-[#93c5fd]">{score}%</span>
      </div>
      <div className="mb-sm grid grid-cols-1 gap-xs sm:grid-cols-2">
        <div className="rounded-xl dashboard-inner-surface p-sm">
          <p className="text-[10px] uppercase dashboard-muted">{t('interviewReadiness.weakAreas')}</p>
          <p className="text-[12px] font-medium text-error dark:text-red-400">{weakAreas?.join(', ')}</p>
        </div>
        <div className="rounded-xl dashboard-inner-surface p-sm">
          <p className="text-[10px] uppercase dashboard-muted">{t('interviewReadiness.strongArea')}</p>
          <p className="text-[12px] font-medium text-green-700 dark:text-green-400">{strongArea}</p>
        </div>
      </div>
      <div className="flex flex-col gap-xs sm:flex-row">
        <button
          type="button"
          className={cn(
            'min-h-[44px] flex-1 rounded-xl border-2 py-2 text-[12px] font-bold',
            selectedOptionClass
          )}
        >
          {t('interviewReadiness.videoMode')}
        </button>
        <button
          type="button"
          className={cn(
            'min-h-[44px] flex-1 rounded-xl border-2 py-2 text-[12px] font-bold',
            unselectedOptionClass
          )}
        >
          {t('interviewReadiness.voiceAnalysis')}
        </button>
      </div>
    </div>
  );
}

export default memo(InterviewReadinessCard);

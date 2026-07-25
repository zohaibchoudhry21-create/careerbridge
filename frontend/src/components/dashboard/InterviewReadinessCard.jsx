import { memo } from 'react';
import SectionIcon from '../ui/SectionIcon';
import { selectedOptionClass, unselectedOptionClass } from '../ui/colorAccentTokens';
import { cn } from '../../lib/utils';

function InterviewReadinessCard({ interviewReadiness }) {
  if (!interviewReadiness) return null;

  const { score, weakAreas, strongArea } = interviewReadiness;

  return (
    <div className="min-w-0 rounded-2xl dashboard-glass-card dashboard-card-padding">
      <div className="mb-xs flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SectionIcon color="mode" icon="mic_external_on" />
          <h4 className="font-headline-section text-headline-section">Interview Readiness</h4>
        </div>
        <span className="font-bold text-secondary">{score}%</span>
      </div>
      <div className="mb-sm grid grid-cols-1 gap-xs sm:grid-cols-2">
        <div className="rounded-xl bg-surface-container p-sm">
          <p className="text-[10px] uppercase text-on-surface-variant">Weak Areas</p>
          <p className="text-[12px] font-medium text-error">{weakAreas?.join(', ')}</p>
        </div>
        <div className="rounded-xl bg-surface-container p-sm">
          <p className="text-[10px] uppercase text-on-surface-variant">Strong Area</p>
          <p className="text-[12px] font-medium text-green-700">{strongArea}</p>
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
          Video Mode
        </button>
        <button
          type="button"
          className={cn(
            'min-h-[44px] flex-1 rounded-xl border-2 py-2 text-[12px] font-bold',
            unselectedOptionClass
          )}
        >
          Voice Analysis
        </button>
      </div>
    </div>
  );
}

export default memo(InterviewReadinessCard);

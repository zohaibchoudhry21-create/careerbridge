import { memo } from 'react';

function InterviewReadinessCard({ interviewReadiness }) {
  if (!interviewReadiness) return null;

  const { score, weakAreas, strongArea } = interviewReadiness;

  return (
    <div className="dashboard-glass-card dashboard-ai-glow dashboard-card-padding rounded-2xl min-w-0">
      <div className="flex justify-between mb-xs gap-2">
        <h4 className="font-headline-section text-headline-section">Interview Readiness</h4>
        <span className="text-secondary font-bold">{score}%</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs mb-sm">
        <div className="p-sm bg-surface-container rounded-xl">
          <p className="text-[10px] uppercase text-on-surface-variant">Weak Areas</p>
          <p className="text-[12px] font-medium text-error">{weakAreas?.join(', ')}</p>
        </div>
        <div className="p-sm bg-surface-container rounded-xl">
          <p className="text-[10px] uppercase text-on-surface-variant">Strong Area</p>
          <p className="text-[12px] font-medium text-green-700">{strongArea}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-xs">
        <button
          type="button"
          className="flex-1 py-2 bg-secondary text-white rounded-xl text-[12px] font-bold min-h-[44px]"
        >
          Video Mode
        </button>
        <button
          type="button"
          className="flex-1 py-2 border border-secondary text-secondary rounded-xl text-[12px] font-bold min-h-[44px]"
        >
          Voice Analysis
        </button>
      </div>
    </div>
  );
}

export default memo(InterviewReadinessCard);

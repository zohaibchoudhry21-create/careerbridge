import { memo } from 'react';

const riskStyles = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-error-container text-on-error-container',
  HIGH: 'bg-error-container text-on-error-container',
};

function CareerRiskCard({ careerRisk }) {
  if (!careerRisk) return null;

  const badgeClass = riskStyles[careerRisk.level] || riskStyles.MEDIUM;

  return (
    <div className="dashboard-glass-card dashboard-card-padding rounded-2xl border-l-8 border-error/50 min-w-0">
      <div className="flex justify-between items-center mb-xs gap-2 flex-wrap">
        <h4 className="font-headline-section text-headline-section">Career Risk Level</h4>
        <span className={`px-2 py-1 text-[10px] font-bold rounded ${badgeClass}`}>
          {careerRisk.level}
        </span>
      </div>
      <div className="space-y-sm">
        <p className="text-[14px] leading-relaxed">{careerRisk.summary}</p>
        <div className="p-sm bg-surface-container rounded-xl">
          <p className="text-[12px] font-bold text-secondary mb-1">AI Recommendation</p>
          <p className="text-[13px] text-on-surface-variant">{careerRisk.recommendation}</p>
        </div>
        <button
          type="button"
          className="text-secondary font-bold text-[12px] flex items-center gap-1 mt-sm min-h-[44px]"
        >
          Browse AI Career Tracks{' '}
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </button>
      </div>
    </div>
  );
}

export default memo(CareerRiskCard);

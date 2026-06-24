import { memo } from 'react';

function ResumeIntelligenceCard({ resumeIntelligence }) {
  if (!resumeIntelligence) return null;

  const { atsOptimizationStatus, keywordGaps, aiInsight } = resumeIntelligence;

  return (
    <div className="col-span-1 lg:col-span-4 dashboard-glass-card dashboard-card-padding rounded-2xl flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-xs">
        <span className="material-symbols-outlined text-secondary text-[20px]">analytics</span>
        <h4 className="font-headline-section text-headline-section">Resume Intelligence</h4>
      </div>
      <p className="font-label-md mb-sm">
        ATS Optimization Status:{' '}
        <span className="text-green-600 font-bold">{atsOptimizationStatus}</span>
      </p>
      <div className="flex-1 space-y-sm">
        <div>
          <p className="text-[12px] text-on-surface-variant uppercase tracking-wider mb-xs">
            Keyword Gaps Identified
          </p>
          <div className="flex flex-wrap gap-xs">
            {keywordGaps?.map((keyword) => (
              <span
                key={keyword}
                className="text-[12px] font-medium border border-outline-variant px-2 py-1 rounded-lg"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-surface-container-high p-sm rounded-xl border-l-4 border-secondary">
          <p className="text-[12px] font-bold text-secondary">AI Insight</p>
          <p className="text-[14px]">
            Improvement potential:{' '}
            <span className="font-bold">{aiInsight?.improvementPotential}</span> if project
            descriptions are quantified.
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(ResumeIntelligenceCard);

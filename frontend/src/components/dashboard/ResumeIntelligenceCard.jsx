import { memo } from 'react';
import SectionIcon from '../ui/SectionIcon';

function ResumeIntelligenceCard({ resumeIntelligence }) {
  if (!resumeIntelligence) return null;

  const { atsOptimizationStatus, keywordGaps, aiInsight } = resumeIntelligence;

  return (
    <div className="col-span-1 flex min-w-0 flex-col rounded-2xl dashboard-glass-card dashboard-card-padding lg:col-span-4">
      <div className="mb-xs flex items-center gap-2.5">
        <SectionIcon color="resume" icon="analytics" />
        <h4 className="font-headline-section text-headline-section">Resume Intelligence</h4>
      </div>
      <p className="mb-sm font-label-md">
        ATS Optimization Status:{' '}
        <span className="font-bold text-green-600">{atsOptimizationStatus}</span>
      </p>
      <div className="flex-1 space-y-sm">
        <div>
          <p className="mb-xs text-[12px] uppercase tracking-wider text-on-surface-variant">
            Keyword Gaps Identified
          </p>
          <div className="flex flex-wrap gap-xs">
            {keywordGaps?.map((keyword) => (
              <span
                key={keyword}
                className="rounded-lg border border-outline-variant px-2 py-1 text-[12px] font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border-l-4 border-secondary bg-surface-container-high p-sm">
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

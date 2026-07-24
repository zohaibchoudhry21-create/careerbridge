function ScoreRing({ score = 0, size = 160 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, Number(score) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-surface-container-high"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-secondary transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline-dashboard text-headline-dashboard text-on-surface">{clamped}</span>
        <span className="font-label-sm text-on-surface-variant">Overall</span>
      </div>
    </div>
  );
}

function SectionCard({ title, score, children }) {
  return (
    <section className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-headline-section text-headline-section text-on-surface">{title}</h3>
        {score != null ? (
          <span className="font-label-md text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
            {score}/100
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function BulletList({ title, items = [] }) {
  if (!items.length) return null;

  return (
    <section className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-2">
      <h3 className="font-headline-section text-headline-section text-on-surface">{title}</h3>
      <ul className="list-disc pl-5 space-y-1 font-body-md text-on-surface-variant">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function InterviewReportCard({ report }) {
  if (!report) return null;

  const { overallScore, sections = {}, strengths, improvementAreas, recommendedNextSteps } = report;

  return (
    <div className="space-y-md min-w-0">
      <header className="dashboard-glass-card dashboard-card-padding rounded-2xl flex flex-col items-center text-center gap-sm">
        <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
          Interview report
        </h1>
        <p className="font-body-md text-on-surface-variant max-w-lg">
          AI summary based on your answers, voice delivery, and on-camera presence.
        </p>
        <ScoreRing score={overallScore} />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
        <SectionCard title="Content quality" score={sections.contentQuality?.score}>
          <p className="font-body-md text-on-surface-variant text-sm">
            {sections.contentQuality?.feedback || 'No feedback available.'}
          </p>
        </SectionCard>

        <SectionCard title="Voice analysis" score={sections.voiceAnalysis?.confidenceScore}>
          <div className="flex flex-wrap gap-2 font-label-sm text-on-surface-variant">
            <span className="bg-surface-container-high px-2 py-1 rounded-lg">
              WPM: {sections.voiceAnalysis?.wpm ?? '—'}
            </span>
            <span className="bg-surface-container-high px-2 py-1 rounded-lg">
              Fillers: {sections.voiceAnalysis?.fillerWords ?? '—'}
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant text-sm mt-2">
            {sections.voiceAnalysis?.feedback || 'No voice feedback available.'}
          </p>
        </SectionCard>

        <SectionCard title="Video presence" score={sections.videoAnalysis?.engagementScore}>
          <div className="flex flex-wrap gap-2 font-label-sm text-on-surface-variant">
            <span className="bg-surface-container-high px-2 py-1 rounded-lg">
              Eye contact: {sections.videoAnalysis?.eyeContactPercent ?? '—'}%
            </span>
            <span className="bg-surface-container-high px-2 py-1 rounded-lg">
              Engagement: {sections.videoAnalysis?.engagementScore ?? '—'}%
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant text-sm mt-2">
            {sections.videoAnalysis?.feedback || 'No video feedback available.'}
          </p>
        </SectionCard>
      </div>

      <BulletList title="Strengths" items={strengths} />
      <BulletList title="Areas to improve" items={improvementAreas} />
      <BulletList title="Recommended next steps" items={recommendedNextSteps} />
    </div>
  );
}

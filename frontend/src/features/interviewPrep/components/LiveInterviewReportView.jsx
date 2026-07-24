import { useQuery } from '@tanstack/react-query';
import InterviewProgressChart from './InterviewProgressChart';
import { fetchInterviewReportHistory } from '../services/mockInterviewService';

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

function MetricTile({ label, value, suffix = '' }) {
  return (
    <div className="dashboard-glass-card dashboard-card-padding rounded-2xl text-center min-w-0">
      <p className="font-label-sm text-on-surface-variant">{label}</p>
      <p className="font-headline-section text-headline-section text-on-surface mt-1">
        {value != null && value !== '' ? `${value}${suffix}` : '—'}
      </p>
    </div>
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

export default function LiveInterviewReportView({ report, sessionId }) {
  const { data: historyData } = useQuery({
    queryKey: ['interview-report-history'],
    queryFn: fetchInterviewReportHistory,
    enabled: Boolean(report),
    staleTime: 60_000,
  });

  if (!report) return null;

  const { overallScore, sections = {}, strengths, improvementAreas, recommendedNextSteps } = report;
  const history = historyData?.history || [];

  const eyeContact = sections.videoAnalysis?.eyeContactPercent;
  const wpm = sections.voiceAnalysis?.wpm;
  const fillerWords = sections.voiceAnalysis?.fillerWords;

  return (
    <div className="space-y-md min-w-0">
      <header className="dashboard-glass-card dashboard-card-padding rounded-2xl flex flex-col items-center text-center gap-sm">
        <h2 className="font-headline-dashboard text-headline-dashboard text-on-surface">
          Interview report
        </h2>
        <p className="font-body-md text-on-surface-variant max-w-lg">
          AI summary based on your answers, voice delivery, and on-camera presence.
        </p>
        <ScoreRing score={overallScore} />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        <MetricTile label="Eye contact" value={eyeContact} suffix="%" />
        <MetricTile label="Speaking pace" value={wpm} suffix=" WPM" />
        <MetricTile label="Filler words" value={fillerWords} />
        <MetricTile
          label="Engagement"
          value={sections.videoAnalysis?.engagementScore}
          suffix="%"
        />
      </div>

      <InterviewProgressChart history={history} currentSessionId={sessionId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
        <BulletList title="Strengths" items={strengths} />
        <BulletList title="Areas to improve" items={improvementAreas} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
        <SectionCard title="Content quality" score={sections.contentQuality?.score}>
          <p className="font-body-md text-on-surface-variant text-sm">
            {sections.contentQuality?.feedback || 'No feedback available.'}
          </p>
        </SectionCard>

        <SectionCard title="Voice analysis" score={sections.voiceAnalysis?.confidenceScore}>
          <p className="font-body-md text-on-surface-variant text-sm">
            {sections.voiceAnalysis?.feedback || 'No voice feedback available.'}
          </p>
        </SectionCard>

        <SectionCard title="Video presence" score={sections.videoAnalysis?.engagementScore}>
          <p className="font-body-md text-on-surface-variant text-sm">
            {sections.videoAnalysis?.feedback || 'No video feedback available.'}
          </p>
        </SectionCard>
      </div>

      <BulletList title="Recommended next steps" items={recommendedNextSteps} />
    </div>
  );
}

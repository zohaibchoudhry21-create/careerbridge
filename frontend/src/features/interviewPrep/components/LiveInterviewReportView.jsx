import { useQuery } from '@tanstack/react-query';
import InterviewProgressChart from './InterviewProgressChart';
import { fetchInterviewReportHistory } from '../services/mockInterviewService';
import SectionHeading from '../../../components/ui/SectionHeading';
import { accentCardClass } from '../../../components/ui/colorAccentTokens';

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
    <div className="min-w-0 rounded-2xl text-center dashboard-glass-card dashboard-card-padding">
      <p className="font-label-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline-section text-headline-section text-on-surface">
        {value != null && value !== '' ? `${value}${suffix}` : '—'}
      </p>
    </div>
  );
}

function BulletList({ title, items = [], color = 'settings', icon = 'checklist' }) {
  if (!items.length) return null;

  return (
    <section className={accentCardClass}>
      <SectionHeading color={color} icon={icon} title={title} alignDescription={false} />
      <ul className="list-disc space-y-1 pl-5 font-body-md text-on-surface-variant">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function ReportSectionCard({ title, score, color, icon, children }) {
  return (
    <section className={`${accentCardClass} min-w-0`}>
      <div className="flex items-start justify-between gap-2">
        <SectionHeading color={color} icon={icon} title={title} alignDescription={false} />
        {score != null ? (
          <span className="shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 font-label-md text-secondary">
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
    <div className="min-w-0 space-y-md">
      <header className="flex flex-col items-center gap-sm rounded-2xl text-center dashboard-glass-card dashboard-card-padding">
        <h2 className="font-headline-dashboard text-headline-dashboard text-on-surface">
          Interview report
        </h2>
        <p className="max-w-lg font-body-md text-on-surface-variant">
          AI summary based on your answers, voice delivery, and on-camera presence.
        </p>
        <ScoreRing score={overallScore} />
      </header>

      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        <BulletList title="Strengths" items={strengths} color="success" icon="thumb_up" />
        <BulletList title="Areas to improve" items={improvementAreas} color="warning" icon="trending_up" />
      </div>

      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        <ReportSectionCard
          title="Content quality"
          score={sections.contentQuality?.score}
          color="skills"
          icon="article"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {sections.contentQuality?.feedback || 'No feedback available.'}
          </p>
        </ReportSectionCard>

        <ReportSectionCard
          title="Voice analysis"
          score={sections.voiceAnalysis?.confidenceScore}
          color="mode"
          icon="mic"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {sections.voiceAnalysis?.feedback || 'No voice feedback available.'}
          </p>
        </ReportSectionCard>

        <ReportSectionCard
          title="Video presence"
          score={sections.videoAnalysis?.engagementScore}
          color="interview"
          icon="videocam"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {sections.videoAnalysis?.feedback || 'No video feedback available.'}
          </p>
        </ReportSectionCard>
      </div>

      <BulletList
        title="Recommended next steps"
        items={recommendedNextSteps}
        color="focus"
        icon="checklist"
      />
    </div>
  );
}

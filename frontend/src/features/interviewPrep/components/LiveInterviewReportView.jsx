import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import InterviewProgressChart from './InterviewProgressChart';
import { fetchInterviewReportHistory } from '../services/mockInterviewService';
import Skeleton from '../../../components/Skeleton';
import ScoreRing from './report/ScoreRing';
import { BulletList, MetricTile, ReportSectionCard } from './report/ReportShared';
import ExecutiveSummaryCard from './report/ExecutiveSummaryCard';
import HiringCard from './report/HiringCard';
import DimensionGrid from './report/DimensionGrid';
import QuestionReviewList from './report/QuestionReviewList';
import RoadmapCard from './report/RoadmapCard';
import TimelineList from './report/TimelineList';
import EnterpriseCharts from './report/EnterpriseCharts';

function LegacyReportBody({ report, t }) {
  const { sections = {}, strengths, improvementAreas, recommendedNextSteps, overallScore } = report;
  // Align legacy section tiles with capped overall so high delivery scores aren't shown as success.
  const dampLegacyScore = (value) => {
    if (value == null || !Number.isFinite(Number(value))) return value;
    if (overallScore == null || Number(overallScore) >= 15) return value;
    return Math.min(Number(value), Math.max(Number(overallScore), 5));
  };
  const eyeContact = dampLegacyScore(sections.videoAnalysis?.eyeContactPercent);
  const wpm = sections.voiceAnalysis?.wpm;
  const fillerWords = sections.voiceAnalysis?.fillerWords;
  const contentScore = dampLegacyScore(sections.contentQuality?.score);
  const voiceScore = dampLegacyScore(sections.voiceAnalysis?.confidenceScore);
  const engagementScore = dampLegacyScore(sections.videoAnalysis?.engagementScore);
  const showStrengths = !(overallScore != null && Number(overallScore) < 15);

  return (
    <>
      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <MetricTile label={t('report.eyeContact')} value={eyeContact} suffix="%" />
        <MetricTile label={t('report.speakingPace')} value={wpm} suffix={t('report.wpmSuffix')} />
        <MetricTile label={t('report.fillerWords')} value={fillerWords} />
        <MetricTile
          label={t('report.engagement')}
          value={engagementScore}
          suffix="%"
        />
      </div>

      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        {showStrengths ? (
          <BulletList title={t('report.strengths')} items={strengths} color="success" icon="thumb_up" />
        ) : null}
        <BulletList
          title={t('report.areasToImprove')}
          items={improvementAreas}
          color="warning"
          icon="trending_up"
        />
      </div>

      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        <ReportSectionCard
          title={t('report.contentQuality')}
          score={contentScore}
          color="skills"
          icon="article"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {sections.contentQuality?.feedback || t('report.noFeedback')}
          </p>
        </ReportSectionCard>

        <ReportSectionCard
          title={t('report.voiceAnalysis')}
          score={voiceScore}
          color="mode"
          icon="mic"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {sections.voiceAnalysis?.feedback || t('report.noVoiceFeedback')}
          </p>
        </ReportSectionCard>

        <ReportSectionCard
          title={t('report.videoPresence')}
          score={engagementScore}
          color="interview"
          icon="videocam"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {sections.videoAnalysis?.feedback || t('report.noVideoFeedback')}
          </p>
        </ReportSectionCard>
      </div>

      <BulletList
        title={t('report.recommendedNextSteps')}
        items={recommendedNextSteps}
        color="focus"
        icon="checklist"
      />
    </>
  );
}

function EnterpriseReportBody({ enterprise, t }) {
  // Phase 3: prefer nested delivery.*; fall back to top-level aliases.
  const delivery = enterprise.delivery || {};
  const voice = delivery.voiceAnalysis || enterprise.voiceAnalysis || {};
  const eye = delivery.eyeContact || enterprise.eyeContact || {};
  const body = delivery.bodyLanguage || enterprise.bodyLanguage || {};
  const dimensions = enterprise.content?.dimensions || enterprise.dimensions;

  return (
    <>
      <ExecutiveSummaryCard executiveSummary={enterprise.executiveSummary} />
      <HiringCard
        hiringRecommendation={enterprise.hiringRecommendation}
        hiringProbability={enterprise.hiringProbability}
      />

      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <MetricTile label={t('report.eyeContact')} value={eye.percent ?? eye.score} suffix="%" />
        <MetricTile
          label={t('report.speakingPace')}
          value={voice.metrics?.speechSpeed}
          suffix={t('report.wpmSuffix')}
        />
        <MetricTile label={t('report.fillerWords')} value={voice.metrics?.fillerWords} />
        <MetricTile
          label={t('report.engagement')}
          value={body.metrics?.engagementScore}
          suffix="%"
        />
      </div>

      <EnterpriseCharts charts={enterprise.charts} />
      <DimensionGrid dimensions={dimensions} />

      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        <ReportSectionCard
          title={t('report.voiceAnalysis')}
          score={voice.score}
          color="mode"
          icon="mic"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {voice.feedback || voice.evidence?.join('. ') || t('report.noVoiceFeedback')}
          </p>
          {voice.deliveryOnly ? (
            <p className="mt-1 font-label-sm app-muted">Delivery only — not answer content</p>
          ) : null}
        </ReportSectionCard>
        <ReportSectionCard
          title={t('report.enterprise.bodyLanguage')}
          score={body.score}
          color="interview"
          icon="accessibility"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {body.feedback || body.evidence?.join('. ') || t('report.noVideoFeedback')}
          </p>
          {body.deliveryOnly ? (
            <p className="mt-1 font-label-sm app-muted">Delivery only — not answer content</p>
          ) : null}
        </ReportSectionCard>
      </div>

      <QuestionReviewList questionReviews={enterprise.questionReviews} />

      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        <BulletList
          title={t('report.strengths')}
          items={enterprise.strengths}
          color="success"
          icon="thumb_up"
        />
        <BulletList
          title={t('report.enterprise.weaknesses')}
          items={enterprise.weaknesses?.length ? enterprise.weaknesses : enterprise.improvementAreas}
          color="warning"
          icon="trending_up"
        />
      </div>

      <RoadmapCard
        learningRoadmap={enterprise.learningRoadmap}
        careerSuggestions={enterprise.careerSuggestions}
      />
      <TimelineList timeline={enterprise.timeline} />
    </>
  );
}

export default function LiveInterviewReportView({ report, sessionId }) {
  const { t } = useTranslation('interviewPrep');
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['interview-report-history'],
    queryFn: fetchInterviewReportHistory,
    enabled: Boolean(report),
    staleTime: 60_000,
  });

  if (!report) return null;

  const enterprise = report.enterpriseReport;
  const history = historyData?.history || [];
  const overallScore = enterprise?.overallScore ?? report.overallScore;

  return (
    <div className="min-w-0 space-y-md">
      <header className="flex flex-col items-center gap-sm rounded-2xl text-center dashboard-glass-card dashboard-card-padding">
        <h2 className="font-headline-dashboard text-headline-dashboard app-heading">
          {t('report.title')}
        </h2>
        <p className="max-w-lg font-body-md app-muted">{t('report.description')}</p>
        <ScoreRing score={overallScore} overallLabel={t('report.overall')} />
      </header>

      {historyLoading ? (
        <Skeleton type="card" count={1} withMedia lines={2} label="Loading interview history chart" />
      ) : (
        <InterviewProgressChart history={history} currentSessionId={sessionId} />
      )}

      {enterprise ? (
        <EnterpriseReportBody enterprise={enterprise} t={t} />
      ) : (
        <LegacyReportBody report={report} t={t} />
      )}
    </div>
  );
}

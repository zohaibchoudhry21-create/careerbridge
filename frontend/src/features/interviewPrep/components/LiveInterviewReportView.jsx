import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import InterviewProgressChart from './InterviewProgressChart';
import { fetchInterviewReportHistory } from '../services/mockInterviewService';
import { useGenerateMockInterviewReport } from '../hooks/useMockInterview';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import Skeleton from '../../../components/Skeleton';
import AppIcon from '../../../components/icons/AppIcon';
import { buttonPrimaryClass } from '../../../components/ui/buttonTokens';
import { cn } from '../../../lib/utils';
import ScoreRing from './report/ScoreRing';
import { BulletList, MetricTile, ReportSectionCard } from './report/ReportShared';
import NextStepsCard from './report/NextStepsCard';
import {
  findPreviousHistoryEntry,
  getDelta,
  getFillerTone,
  getPaceTone,
  getPercentTone,
  getScoreBand,
} from '../utils/reportInsights';
import ExecutiveSummaryCard from './report/ExecutiveSummaryCard';
import HiringCard from './report/HiringCard';
import DimensionGrid from './report/DimensionGrid';
import QuestionReviewList from './report/QuestionReviewList';
import RoadmapCard from './report/RoadmapCard';
import TimelineList from './report/TimelineList';
import EnterpriseCharts from './report/EnterpriseCharts';
function LegacyReportBody({ report, t, previous }) {
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
        <MetricTile
          label={t('report.eyeContact')}
          value={eyeContact}
          suffix="%"
          hint={t('report.metricHints.eyeContact')}
          tone={getPercentTone(eyeContact)}
          delta={getDelta(eyeContact, previous?.eyeContactPercent)}
          deltaLabel={t('report.vsPrevious')}
        />
        <MetricTile
          label={t('report.speakingPace')}
          value={wpm}
          suffix={t('report.wpmSuffix')}
          hint={t('report.metricHints.pace')}
          tone={getPaceTone(wpm)}
          delta={getDelta(wpm, previous?.wpm)}
          deltaLabel={t('report.vsPrevious')}
        />
        <MetricTile label={t('report.fillerWords')} value={fillerWords} />
        <MetricTile
          label={t('report.engagement')}
          value={engagementScore}
          suffix="%"
          hint={t('report.metricHints.engagement')}
          tone={getPercentTone(engagementScore)}
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

function EnterpriseReportBody({ enterprise, t, aiName, userName, previous }) {
  // Phase 3: prefer nested delivery.*; fall back to top-level aliases.
  const delivery = enterprise.delivery || {};
  const voice = delivery.voiceAnalysis || enterprise.voiceAnalysis || {};
  const eye = delivery.eyeContact || enterprise.eyeContact || {};
  const body = delivery.bodyLanguage || enterprise.bodyLanguage || {};
  const dimensions = enterprise.content?.dimensions || enterprise.dimensions;
  const eyePercent = eye.percent ?? eye.score;
  const pace = voice.metrics?.speechSpeed;
  const fillerRate = voice.metrics?.fillersPer100Words;
  const engagement = body.metrics?.engagementScore;

  return (
    <>
      <ExecutiveSummaryCard executiveSummary={enterprise.executiveSummary} />
      <HiringCard
        hiringRecommendation={enterprise.hiringRecommendation}
        hiringProbability={enterprise.hiringProbability}
      />
      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <MetricTile
          label={t('report.eyeContact')}
          value={eyePercent}
          suffix="%"
          hint={t('report.metricHints.eyeContact')}
          tone={getPercentTone(eyePercent)}
          delta={getDelta(eyePercent, previous?.eyeContactPercent)}
          deltaLabel={t('report.vsPrevious')}
        />
        <MetricTile
          label={t('report.speakingPace')}
          value={pace}
          suffix={t('report.wpmSuffix')}
          hint={t('report.metricHints.pace')}
          tone={getPaceTone(pace)}
          delta={getDelta(pace, previous?.wpm)}
          deltaLabel={t('report.vsPrevious')}
        />
        {/* Raw filler count scales with interview length — no cross-attempt delta. */}
        <MetricTile
          label={t('report.fillerWords')}
          value={voice.metrics?.fillerWords}
          hint={fillerRate != null ? t('report.metricHints.fillers') : undefined}
          tone={getFillerTone(fillerRate)}
        />
        <MetricTile
          label={t('report.engagement')}
          value={engagement}
          suffix="%"
          hint={t('report.metricHints.engagement')}
          tone={getPercentTone(engagement)}
        />
      </div>

      <EnterpriseCharts charts={enterprise.charts} />
      <DimensionGrid dimensions={dimensions} previousDimensions={previous?.dimensions} />

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
            <p className="mt-1 font-label-sm app-muted">{t('report.deliveryOnly')}</p>
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
            <p className="mt-1 font-label-sm app-muted">{t('report.deliveryOnly')}</p>
          ) : null}
        </ReportSectionCard>
      </div>

      <QuestionReviewList
        questionReviews={enterprise.questionReviews}
        aiName={aiName}
        userName={userName}
      />

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
      <NextStepsCard dimensions={dimensions} />
    </>
  );
}

export default function LiveInterviewReportView({
  report,
  sessionId,
  userName,
  aiName,
  reportStatus,
  onReportRegenerated,
}) {
  const { t } = useTranslation('interviewPrep');
  const regenerateReport = useGenerateMockInterviewReport();
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
  const narrativeGenerated =
    report.narrativeGenerated !== false && enterprise?.narrativeGenerated !== false;
  const showRetry =
    reportStatus === 'failed' ||
    reportStatus === 'pending' ||
    !narrativeGenerated;

  const handleRetryReport = () => {
    if (!sessionId || regenerateReport.isPending) return;

    regenerateReport.mutate(sessionId, {
      onSuccess: (data) => {
        if (data?.report) {
          onReportRegenerated?.(data.report);
        }
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, t('report.retryFailed')));
      },
    });
  };

  const previous = findPreviousHistoryEntry(history, sessionId);
  const overallBand = getScoreBand(overallScore);

  return (
    <div className="min-w-0 space-y-md">
      <header className="flex flex-col items-center gap-sm rounded-2xl text-center dashboard-glass-card dashboard-card-padding">
        <h2 className="font-headline-dashboard text-headline-dashboard app-heading">
          {t('report.title')}
        </h2>
        <p className="max-w-lg font-body-md app-muted">{t('report.description')}</p>
        <ScoreRing
          score={overallScore}
          overallLabel={t('report.overall')}
          bandLabel={overallBand ? t(`report.scoreBand.${overallBand.key}`) : undefined}
          delta={getDelta(overallScore, previous?.overallScore)}
          deltaLabel={t('report.vsPrevious')}
        />
      </header>

      {!narrativeGenerated && (
        <div
          role="status"
          className="rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-start"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {t('report.narrativeUnavailable')}
          </p>
          {showRetry ? (
            <button
              type="button"
              onClick={handleRetryReport}
              disabled={regenerateReport.isPending}
              className={cn(buttonPrimaryClass, 'mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm')}
            >
              {regenerateReport.isPending ? (
                <>
                  <AppIcon name="progress_activity" size="sm" spin />
                  {t('report.retrying')}
                </>
              ) : (
                t('report.retryGenerate')
              )}
            </button>
          ) : null}
        </div>
      )}

      {historyLoading ? (
        <Skeleton type="card" count={1} withMedia lines={2} label="Loading interview history chart" />
      ) : (
        <InterviewProgressChart history={history} currentSessionId={sessionId} />
      )}

      {enterprise ? (
        <EnterpriseReportBody
          enterprise={enterprise}
          t={t}
          aiName={aiName}
          userName={userName}
          previous={previous}
        />
      ) : (
        <LegacyReportBody report={report} t={t} previous={previous} />
      )}
    </div>
  );
}

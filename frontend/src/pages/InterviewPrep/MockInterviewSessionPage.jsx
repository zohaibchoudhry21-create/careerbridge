import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { buttonGradientCtaClass, buttonPrimaryClass } from '../../components/ui/buttonTokens';
import { cn } from '../../lib/utils';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import Skeleton from '../../components/Skeleton';
import LiveInterviewReportView from '../../features/interviewPrep/components/LiveInterviewReportView';
import { preloadInterviewFaceModels } from '../../features/interviewPrep/hooks/useFaceVideoAnalysis';
import { useInterviewMedia } from '../../features/interviewPrep/context/InterviewMediaContext';
import {
  useMockInterviewSession,
  useSavedInterviewReport,
  useSubmitLiveInterview,
} from '../../features/interviewPrep/hooks/useMockInterview';
import {
  DEFAULT_INTERVIEWER_PERSONA,
  DEFAULT_INTERVIEW_SETUP_MODE,
} from '../../features/interviewPrep/constants/interviewPrepConstants';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';
import {
  getMediaPermissionIssue,
  getPermissionIssueMessage,
} from '../../features/interviewPrep/utils/mediaPermissionUtils';

const LiveInterviewAgent = lazy(
  () => import('../../features/interviewPrep/components/LiveInterviewAgent')
);

function SessionExitLink({ fromHistory }) {
  const { t } = useTranslation('interviewPrep');
  if (fromHistory) {
    return <BackLink to="/interview-prep/mock/history">{t('history.navLabel')}</BackLink>;
  }
  return <BackLink to="/interview-prep/mock">{t('backLinks.exit')}</BackLink>;
}

export default function MockInterviewSessionPage() {
  const { t } = useTranslation('interviewPrep');
  const { sessionId } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { status, stream, requestAccess } = useInterviewMedia();
  const submitLiveInterview = useSubmitLiveInterview();
  const submittedRef = useRef(false);
  const requestAccessRef = useRef(requestAccess);
  requestAccessRef.current = requestAccess;

  const fromHistory = Boolean(location.state?.fromHistory);
  const [interviewReport, setInterviewReport] = useState(location.state?.interviewReport || null);
  const [submitError, setSubmitError] = useState(null);

  const { data: sessionFromApi, isLoading: sessionLoading } = useMockInterviewSession(
    sessionId,
    !interviewReport
  );

  const sessionStatus = sessionFromApi?.status;
  const isAbandoned = sessionStatus === 'abandoned';
  const isIncomplete = sessionStatus === 'setup' || sessionStatus === 'processing';
  const isCompleted = Boolean(interviewReport) || sessionStatus === 'completed';

  const {
    data: savedReport,
    isLoading: savedReportLoading,
    isFetched: savedReportFetched,
  } = useSavedInterviewReport(sessionId, isCompleted && !interviewReport);

  const displayReport = interviewReport || savedReport;
  const reportUnavailable = isCompleted && !displayReport && savedReportFetched && !savedReportLoading;

  // Prefer API id — after Vapi key rotation the navigation-state id can be stale.
  const assistantId = useMemo(() => {
    if (sessionFromApi?.assistantId) return String(sessionFromApi.assistantId);
    if (location.state?.assistantId) return String(location.state.assistantId);
    return '';
  }, [location.state?.assistantId, sessionFromApi?.assistantId]);

  const adaptiveDepthEnabled = Boolean(
    location.state?.adaptiveDepthEnabled ?? sessionFromApi?.adaptiveDepthEnabled
  );

  const canStartSession =
    Boolean(assistantId) &&
    !sessionLoading &&
    sessionFromApi != null &&
    sessionFromApi.status === 'active';

  const interviewMeta = useMemo(
    () => ({
      roleLabel:
        location.state?.roleLabel ||
        sessionFromApi?.roleLabel ||
        sessionFromApi?.role ||
        t('session.defaultRole'),
      difficulty: location.state?.difficulty || sessionFromApi?.difficulty || 'medium',
      durationMinutes:
        location.state?.durationMinutes || sessionFromApi?.durationMinutes || 15,
      interviewerPersona:
        location.state?.interviewerPersona ||
        location.state?.customization?.interviewerPersona ||
        sessionFromApi?.interviewerPersona ||
        DEFAULT_INTERVIEWER_PERSONA,
      interviewMode:
        location.state?.customization?.interviewMode ||
        sessionFromApi?.interviewMode ||
        DEFAULT_INTERVIEW_SETUP_MODE,
      focusAreas:
        location.state?.customization?.focusAreas || sessionFromApi?.focusAreas || [],
    }),
    [location.state, sessionFromApi, t]
  );

  const userName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    t('session.defaultCandidate');

  useEffect(() => {
    preloadInterviewFaceModels().catch(() => { });
  }, []);

  useEffect(() => {
    const hasLiveStream = stream?.getTracks?.().some((track) => track.readyState === 'live');
    if (hasLiveStream || isCompleted || isAbandoned || isIncomplete) return;
    if (sessionLoading) return;
    if (sessionFromApi && sessionFromApi.status !== 'active') return;
    if (status === 'requesting' || status === 'granted' || status === 'denied') return;
    if (!canStartSession) return;
    requestAccessRef.current().catch((err) => {
      const issue = getMediaPermissionIssue(err) || 'unknown';
      toast.error(getPermissionIssueMessage(issue));
    });
  }, [
    stream,
    status,
    isCompleted,
    isAbandoned,
    isIncomplete,
    sessionLoading,
    sessionFromApi,
    canStartSession,
  ]);

  const handleFinished = useCallback(
    (payload) => {
      if (submittedRef.current || !sessionId) {
        return;
      }

      submittedRef.current = true;
      setSubmitError(null);

      submitLiveInterview.mutate(
        {
          sessionId,
          transcript: payload.transcript,
          liveAudioHints: payload.liveAudioHints,
          liveVideoMetrics: payload.liveVideoMetrics,
          durationMs: payload.durationMs,
        },
        {
          onSuccess: (data) => {
            const report = data?.report;
            if (!report) {
              setSubmitError(t('session.submitMissingReport'));
              submittedRef.current = false;
              return;
            }
            setInterviewReport(report);
          },
          onError: (err) => {
            submittedRef.current = false;
            setSubmitError(getApiErrorMessage(err, t('session.submitFailed')));
          },
        }
      );
    },
    [sessionId, submitLiveInterview, t]
  );

  if (authLoading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer width="standard">
          <Skeleton type="card" count={1} withMedia lines={3} label="Loading interview session" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!sessionId) {
    return (
      <DashboardLayout user={user}>
        <PageContainer width="standard">
          <p className="font-body-md text-on-surface-variant">{t('session.notFound')}</p>
          <Link
            to="/interview-prep/mock"
            className={cn(buttonPrimaryClass, 'px-6 py-2.5')}
          >
            {t('backLinks.backToSetup')}
          </Link>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer width="standard">
        {isAbandoned || isIncomplete ? (
          <div className="mx-auto max-w-lg space-y-md text-center">
            <SessionExitLink fromHistory={fromHistory} />
            <PageHeader
              align="center"
              title={
                isAbandoned ? t('session.abandonedTitle') : t('session.incompleteTitle')
              }
              description={
                isAbandoned
                  ? t('session.abandonedDescription')
                  : t('session.incompleteDescription')
              }
            />
            <Link
              to="/interview-prep/mock"
              className={cn(buttonPrimaryClass, 'inline-flex px-6 py-2.5')}
            >
              {t('session.startNewInterview')}
            </Link>
          </div>
        ) : isCompleted ? (
          <>
            <SessionExitLink fromHistory={fromHistory} />
            <PageHeader
              align="center"
              title={
                displayReport ? t('session.completeTitle') : t('session.reportUnavailableTitle')
              }
              description={
                displayReport
                  ? t('session.completeDescription')
                  : t('session.reportUnavailableDescription')
              }
            />

            {!displayReport && savedReportLoading ? (
              <div className="space-y-4 py-md">
                <Skeleton type="card" count={1} withMedia={false} lines={2} label={t('session.loadingReport')} />
                <Skeleton type="card" count={4} withMedia={false} lines={2} columnsGrid={4} />
                <Skeleton type="text" lines={4} />
              </div>
            ) : null}

            {displayReport ? (
              <LiveInterviewReportView
                report={displayReport}
                sessionId={sessionId}
                userName={userName}
              />
            ) : null}

            {reportUnavailable ? (
              <p className="font-body-md app-muted text-center">{t('history.scoreUnavailable')}</p>
            ) : null}

            <Link
              to={fromHistory ? '/interview-prep/mock/history' : '/interview-prep'}
              className={buttonGradientCtaClass}
            >
              <AppIcon name={fromHistory ? 'history' : 'arrow_back'} size="sm" className="text-white" />
              {fromHistory ? t('history.navLabel') : t('backLinks.backToInterviewPrep')}
            </Link>
          </>
        ) : (
          <>
            {sessionLoading && !canStartSession ? (
              <div className="space-y-4 py-2">
                <Skeleton type="card" count={1} withMedia lines={3} label="Loading interview session" />
                <Skeleton type="list" count={3} />
              </div>
            ) : null}

            {!sessionLoading && !canStartSession ? (
              <div className="text-center space-y-md">
                <SessionExitLink fromHistory={fromHistory} />
                <p className="font-body-md text-on-surface-variant">
                  {t('session.loadFailed')}
                </p>
                <Link
                  to="/interview-prep/mock"
                  className={cn(buttonPrimaryClass, 'px-6 py-2.5')}
                >
                  {t('backLinks.backToSetup')}
                </Link>
              </div>
            ) : null}

            {canStartSession ? (
              <>
                <SessionExitLink fromHistory={fromHistory} />
                <Suspense
                  fallback={
                    <div className="flex justify-center py-xl">
                      <AppIcon
                        name="progress_activity"
                        size="dashboard"
                        spin
                        className="text-secondary"
                      />
                    </div>
                  }
                >
                  <LiveInterviewAgent
                    userName={userName}
                    sessionId={sessionId}
                    assistantId={assistantId || undefined}
                    roleLabel={interviewMeta.roleLabel}
                    difficulty={interviewMeta.difficulty}
                    durationMinutes={interviewMeta.durationMinutes}
                    interviewMode={interviewMeta.interviewMode}
                    adaptiveDepthEnabled={adaptiveDepthEnabled}
                    stream={stream}
                    onFinished={handleFinished}
                    submitError={submitError}
                    isSubmitting={submitLiveInterview.isPending}
                  />
                </Suspense>
              </>
            ) : null}

            {submitLiveInterview.isPending ? (
              <div className="flex items-center justify-center gap-2 py-md">
                <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
                <span className="font-body-md text-on-surface-variant">{t('session.generatingReport')}</span>
              </div>
            ) : null}
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

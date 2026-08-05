import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { buttonPrimaryClass } from '../../components/ui/buttonTokens';
import { cn } from '../../lib/utils';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import Skeleton from '../../components/Skeleton';
import LiveInterviewReportView from '../../features/interviewPrep/components/LiveInterviewReportView';
import { preloadInterviewFaceModels } from '../../features/interviewPrep/hooks/useFaceVideoAnalysis';
import { useInterviewMedia } from '../../features/interviewPrep/context/InterviewMediaContext';
import {
  useGenerateMockInterviewReport,
  useMockInterviewSession,
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

function SessionExitLink() {
  const { t } = useTranslation('interviewPrep');
  return <BackLink to="/interview-prep/mock">{t('backLinks.exit')}</BackLink>;
}

export default function MockInterviewSessionPage() {
  const { t } = useTranslation('interviewPrep');
  const { sessionId } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { status, stream, requestAccess } = useInterviewMedia();
  const submitLiveInterview = useSubmitLiveInterview();
  const generateReport = useGenerateMockInterviewReport();
  const submittedRef = useRef(false);
  const requestAccessRef = useRef(requestAccess);
  requestAccessRef.current = requestAccess;

  const [interviewReport, setInterviewReport] = useState(location.state?.interviewReport || null);
  const [submitError, setSubmitError] = useState(null);

  const { data: sessionFromApi, isLoading: sessionLoading } = useMockInterviewSession(
    sessionId,
    !interviewReport
  );

  const assistantId = useMemo(() => {
    if (location.state?.assistantId) return String(location.state.assistantId);
    if (sessionFromApi?.assistantId) return String(sessionFromApi.assistantId);
    return '';
  }, [location.state?.assistantId, sessionFromApi?.assistantId]);

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

  const isCompletePhase =
    Boolean(interviewReport) || sessionFromApi?.status === 'completed';

  useEffect(() => {
    if (interviewReport || !sessionFromApi || sessionFromApi.status !== 'completed') {
      return;
    }

    let cancelled = false;

    generateReport
      .mutateAsync(sessionId)
      .then((data) => {
        if (!cancelled && data?.report) {
          setInterviewReport(data.report);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [generateReport, interviewReport, sessionFromApi, sessionId]);

  useEffect(() => {
    preloadInterviewFaceModels().catch(() => {});
  }, []);

  useEffect(() => {
    const hasLiveStream = stream?.getTracks?.().some((track) => track.readyState === 'live');
    if (hasLiveStream || isCompletePhase) return;
    if (status === 'requesting') return;
    requestAccessRef.current().catch((err) => {
      const issue = getMediaPermissionIssue(err) || 'unknown';
      toast.error(getPermissionIssueMessage(issue));
    });
  }, [stream, status, isCompletePhase]);

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
        {isCompletePhase ? (
          <>
            <SessionExitLink />
            <PageHeader
              align="center"
              title={t('session.completeTitle')}
              description={t('session.completeDescription')}
            />

            {!interviewReport && generateReport.isPending ? (
              <div className="space-y-4 py-md">
                <Skeleton type="card" count={1} withMedia={false} lines={2} label={t('session.loadingReport')} />
                <Skeleton type="card" count={4} withMedia={false} lines={2} columnsGrid={4} />
                <Skeleton type="text" lines={4} />
              </div>
            ) : null}

            {interviewReport ? (
              <LiveInterviewReportView report={interviewReport} sessionId={sessionId} />
            ) : null}

            <Link
              to="/interview-prep"
              className={cn(buttonPrimaryClass, 'px-6 py-2.5')}
            >
              {t('backLinks.backToInterviewPrep')}
            </Link>
          </>
        ) : (
          <>
            {sessionLoading && !assistantId ? (
              <div className="space-y-4 py-2">
                <Skeleton type="card" count={1} withMedia lines={3} label="Loading interview session" />
                <Skeleton type="list" count={3} />
              </div>
            ) : null}

            {!sessionLoading && !assistantId ? (
              <div className="text-center space-y-md">
                <SessionExitLink />
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

            {assistantId ? (
              <>
                <SessionExitLink />
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
                    assistantId={assistantId}
                    interviewMode={interviewMeta.interviewMode}
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

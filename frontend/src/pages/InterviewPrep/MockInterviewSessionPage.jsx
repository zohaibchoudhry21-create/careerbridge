import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import InterviewReportCard from '../../features/interviewPrep/components/InterviewReportCard';
import LiveInterviewAgent from '../../features/interviewPrep/components/LiveInterviewAgent';
import PermissionGate from '../../features/interviewPrep/components/PermissionGate';
import { preloadInterviewFaceModels } from '../../features/interviewPrep/hooks/useFaceVideoAnalysis';
import { useInterviewMedia } from '../../features/interviewPrep/context/InterviewMediaContext';
import {
  useGenerateMockInterviewReport,
  useMockInterviewSession,
  useSubmitLiveInterview,
} from '../../features/interviewPrep/hooks/useMockInterview';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';

export default function MockInterviewSessionPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { status, error, permissionIssue, stream, requestAccess } = useInterviewMedia();
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

  const questions = useMemo(() => {
    if (Array.isArray(location.state?.questions) && location.state.questions.length) {
      return location.state.questions;
    }
    if (Array.isArray(sessionFromApi?.questionTexts) && sessionFromApi.questionTexts.length) {
      return sessionFromApi.questionTexts;
    }
    if (Array.isArray(sessionFromApi?.questions) && sessionFromApi.questions.length) {
      return sessionFromApi.questions.map((q) => q.text);
    }
    return [];
  }, [location.state?.questions, sessionFromApi]);

  const userName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Candidate';

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
    requestAccessRef.current().catch(() => {});
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
              setSubmitError('Interview submitted but report was missing.');
              submittedRef.current = false;
              return;
            }
            setInterviewReport(report);
          },
          onError: (err) => {
            submittedRef.current = false;
            setSubmitError(getApiErrorMessage(err, 'Could not submit live interview.'));
          },
        }
      );
    },
    [sessionId, submitLiveInterview]
  );

  if (authLoading || !user) {
    return (
      <DashboardLayout user={user}>
        <div className="flex justify-center py-2xl">
          <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!sessionId) {
    return (
      <DashboardLayout user={user}>
        <div className="max-w-lg mx-auto space-y-md pt-12">
          <p className="font-body-md text-on-surface-variant">Session not found.</p>
          <Link
            to="/interview-prep/mock"
            className="inline-flex px-6 py-2.5 rounded-xl bg-secondary text-white font-label-md"
          >
            Back to setup
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="min-w-0 space-y-md pt-8 md:pt-10 lg:pt-12">
        <Link
          to="/interview-prep/mock"
          className="inline-flex items-center gap-1 font-label-md text-secondary hover:underline"
        >
          <AppIcon name="arrow_back" size="sm" />
          Exit
        </Link>

        {isCompletePhase ? (
          <div className="space-y-md max-w-4xl mx-auto">
            <header className="text-center">
              <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
                Interview complete
              </h1>
              <p className="font-body-md text-on-surface-variant mt-base">
                Your combined content, voice, and video feedback is ready.
              </p>
            </header>

            {!interviewReport && generateReport.isPending ? (
              <div className="flex items-center justify-center gap-2 py-md">
                <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
                <span className="font-body-md text-on-surface-variant">Loading your report…</span>
              </div>
            ) : null}

            {interviewReport ? <InterviewReportCard report={interviewReport} /> : null}

            <Link
              to="/interview-prep"
              className="inline-flex px-6 py-2.5 rounded-xl bg-secondary text-white font-label-md"
            >
              Back to Interview Prep
            </Link>
          </div>
        ) : (
          <>
            <header className="text-center max-w-2xl mx-auto">
              <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
                Live interview
              </h1>
              <p className="font-body-md text-on-surface-variant mt-base">
                Speak with the AI interviewer in real time. Camera and mic stay on for feedback.
              </p>
            </header>

            {sessionLoading && !questions.length ? (
              <div className="flex justify-center py-2xl">
                <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
              </div>
            ) : null}

            {!sessionLoading && !questions.length ? (
              <div className="max-w-lg mx-auto text-center space-y-md">
                <p className="font-body-md text-on-surface-variant">
                  Could not load this interview session. Start a new one from setup.
                </p>
                <Link
                  to="/interview-prep/mock"
                  className="inline-flex px-6 py-2.5 rounded-xl bg-secondary text-white font-label-md"
                >
                  Back to setup
                </Link>
              </div>
            ) : null}

            {questions.length > 0 && status !== 'granted' && !stream ? (
              <PermissionGate
                status={status}
                error={error}
                permissionIssue={permissionIssue}
                onRequest={requestAccess}
              />
            ) : null}

            {questions.length > 0 ? (
              <LiveInterviewAgent
                userName={userName}
                sessionId={sessionId}
                questions={questions}
                stream={stream}
                onFinished={handleFinished}
                submitError={submitError}
                isSubmitting={submitLiveInterview.isPending}
              />
            ) : null}

            {submitLiveInterview.isPending ? (
              <div className="flex items-center justify-center gap-2 py-md">
                <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
                <span className="font-body-md text-on-surface-variant">Generating your report…</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

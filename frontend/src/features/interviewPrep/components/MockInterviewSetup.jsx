import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import RadioGroup from '../../../components/settings/RadioGroup';
import PermissionGate from './PermissionGate';
import InterviewPrivacyNotice from './InterviewPrivacyNotice';
import RetryErrorPanel from './RetryErrorPanel';
import {
  DEFAULT_MOCK_QUESTION_COUNT,
  MOCK_INTERVIEW_DIFFICULTIES,
  MOCK_INTERVIEW_ROLES,
} from '../constants/interviewPrepConstants';
import { useInterviewMedia } from '../context/InterviewMediaContext';
import { useStartLiveInterview } from '../hooks/useMockInterview';
import { isVapiConfigured } from '../lib/vapi.sdk';
import {
  getMediaPermissionIssue,
  PERMISSION_ISSUE_COPY,
} from '../utils/mediaPermissionUtils';
import { getApiErrorMessage } from '../utils/apiErrorUtils';

const DIFFICULTY_OPTIONS = MOCK_INTERVIEW_DIFFICULTIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

const LENGTH_OPTIONS = [
  { value: '5', label: '5 questions' },
  { value: String(DEFAULT_MOCK_QUESTION_COUNT), label: '6 questions' },
  { value: '8', label: '8 questions' },
];

export default function MockInterviewSetup() {
  const navigate = useNavigate();
  const { status, error, permissionIssue, stream, requestAccess } = useInterviewMedia();
  const startLiveInterview = useStartLiveInterview();

  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [targetQuestionCount, setTargetQuestionCount] = useState(String(DEFAULT_MOCK_QUESTION_COUNT));
  const [startError, setStartError] = useState(null);

  const roleOptions = MOCK_INTERVIEW_ROLES.map((r) => ({ value: r.id, label: r.label }));

  const hasLiveMediaStream = (mediaStream) =>
    Boolean(mediaStream?.getTracks?.().some((track) => track.readyState === 'live'));

  const handleStart = async () => {
    if (!role) {
      toast.error('Please select a role.');
      return;
    }

    if (!isVapiConfigured()) {
      toast.error('Live interview is not configured. Add VITE_VAPI_WEB_TOKEN to frontend .env');
      return;
    }

    setStartError(null);

    let activeStream = stream;

    if (!hasLiveMediaStream(activeStream)) {
      try {
        activeStream = await requestAccess();
      } catch (mediaErr) {
        const issue = getMediaPermissionIssue(mediaErr) || 'unknown';
        toast.error(PERMISSION_ISSUE_COPY[issue]);
        return;
      }
    }

    const payload = {
      role,
      difficulty,
      targetQuestionCount: Number(targetQuestionCount),
    };

    try {
      const result = await startLiveInterview.mutateAsync(payload);

      if (result?.success === false) {
        const message = result?.message || 'Could not start live interview.';
        setStartError(message);
        toast.error(message);
        return;
      }

      const sessionId = result?.sessionId != null ? String(result.sessionId) : '';
      const questions = Array.isArray(result?.questions) ? result.questions : [];

      if (!sessionId || !questions.length) {
        const message = result?.message || 'Could not start live interview.';
        setStartError(message);
        toast.error(message);
        return;
      }

      navigate(`/interview-prep/mock/${sessionId}`, {
        state: { questions },
      });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not start live interview.');
      setStartError(message);
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl min-w-0 space-y-md">
      <header className="min-w-0">
        <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
          Customize your interview
        </h1>
        <p className="font-body-md text-on-surface-variant mt-base">
          Set your role and difficulty, then join a live AI interview with real-time voice, camera,
          and feedback.
        </p>
      </header>

      <InterviewPrivacyNotice />

      <p className="font-body-md text-on-surface-variant text-sm rounded-xl bg-surface-container-low border border-outline-variant/30 p-sm">
        Live interviews use <strong>Vapi</strong> for real-time conversation. Your camera and
        microphone stay active during the call so we can measure presence and delivery. The
        transcript and metrics are saved when you end the interview to generate your report.
      </p>

      {status !== 'granted' ? (
        <PermissionGate
          status={status}
          error={error}
          permissionIssue={permissionIssue}
          onRequest={requestAccess}
          showPrivacyNotice={false}
        />
      ) : null}

      <section className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-sm">
        <h2 className="font-headline-section text-headline-section">Role</h2>
        <RadioGroup name="mock-role" value={role} onChange={setRole} options={roleOptions} />
      </section>

      <section className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-sm">
        <h2 className="font-headline-section text-headline-section">Difficulty</h2>
        <RadioGroup
          name="mock-difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={DIFFICULTY_OPTIONS}
        />
      </section>

      <section className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-sm">
        <h2 className="font-headline-section text-headline-section">Length</h2>
        <RadioGroup
          name="mock-length"
          value={targetQuestionCount}
          onChange={setTargetQuestionCount}
          options={LENGTH_OPTIONS}
        />
      </section>

      <RetryErrorPanel
        title="Could not start interview"
        message={startError}
        retryLabel="Try again"
        onRetry={startError ? handleStart : undefined}
      />

      <button
        type="button"
        onClick={handleStart}
        disabled={startLiveInterview.isPending}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary text-white font-label-md min-h-[44px] disabled:opacity-60"
      >
        {startLiveInterview.isPending ? 'Starting…' : 'Start live interview'}
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppIcon from '../../../components/icons/AppIcon';
import RetryErrorPanel from './RetryErrorPanel';
import RoleResumeCard from './RoleResumeCard';
import {
  CARD_CLASS,
  FocusAreasSection,
  ICON_TINTS,
  InterviewModeSection,
  SectionHeader,
  SELECTED_OPTION_CLASS,
  UNSELECTED_OPTION_CLASS,
} from './InterviewSetupAdvanced';
import {
  DEFAULT_INTERVIEWER_PERSONA,
  DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES,
  DEFAULT_INTERVIEW_SETUP_MODE,
  MOCK_INTERVIEW_DURATION_OPTIONS,
} from '../constants/interviewPrepConstants';
import { useInterviewMedia } from '../context/InterviewMediaContext';
import { useStartLiveInterview } from '../hooks/useMockInterview';
import { isVapiConfigured } from '../lib/vapi.sdk';
import {
  getMediaPermissionIssue,
  PERMISSION_ISSUE_COPY,
} from '../utils/mediaPermissionUtils';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { preloadInterviewFaceModels } from '../hooks/useFaceVideoAnalysis';
import { cn } from '../../../lib/utils';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Entry level' },
  { value: 'medium', label: 'Mid level' },
  { value: 'hard', label: 'Senior / leadership' },
];

const TIME_OPTIONS = MOCK_INTERVIEW_DURATION_OPTIONS.map((minutes) => ({
  value: String(minutes),
  label: `${minutes} minutes`,
}));

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border-2 px-4 py-2.5 text-left font-label-md transition-all duration-150',
        selected ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
      )}
    >
      {children}
    </button>
  );
}

export default function MockInterviewSetup() {
  const navigate = useNavigate();
  const { stream, requestAccess } = useInterviewMedia();
  const startLiveInterview = useStartLiveInterview();

  const [role, setRole] = useState('');
  const [roleTouched, setRoleTouched] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [durationMinutes, setDurationMinutes] = useState(
    String(DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES)
  );
  const [resumeText, setResumeText] = useState('');
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeProjects, setResumeProjects] = useState([]);
  const [experience, setExperience] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [focusAreas, setFocusAreas] = useState([]);
  const [interviewMode, setInterviewMode] = useState(DEFAULT_INTERVIEW_SETUP_MODE);
  const [startError, setStartError] = useState(null);

  const handleAnalysisComplete = ({ text, skills, projects }) => {
    setResumeText(text || '');
    setResumeSkills(Array.isArray(skills) ? skills : []);
    setResumeProjects(Array.isArray(projects) ? projects : []);
  };

  const handleAnalysisClear = () => {
    setResumeText('');
    setResumeSkills([]);
    setResumeProjects([]);
  };

  const roleTrimmed = role.trim();
  const showRoleError = roleTouched && !roleTrimmed;
  const canStart = Boolean(roleTrimmed) && !startLiveInterview.isPending;

  const selectionSummary = useMemo(() => {
    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    const timeLabel = `${durationMinutes} min`;
    const parts = [];

    if (roleTrimmed) parts.push(roleTrimmed);
    parts.push(difficultyLabel, timeLabel);

    return parts.join(' · ');
  }, [roleTrimmed, difficulty, durationMinutes]);

  useEffect(() => {
    preloadInterviewFaceModels().catch(() => {});
  }, []);

  const hasLiveMediaStream = (mediaStream) =>
    Boolean(mediaStream?.getTracks?.().some((track) => track.readyState === 'live'));

  const handleStart = async () => {
    setRoleTouched(true);

    if (!roleTrimmed) {
      toast.error('Please enter a role.');
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
      role: roleTrimmed,
      difficulty,
      durationMinutes: Number(durationMinutes),
      ...(resumeText.trim() && { resumeText: resumeText.trim() }),
      ...(resumeSkills.length > 0 && { resumeSkills }),
      ...(resumeProjects.length > 0 && { resumeProjects }),
      ...(experience.trim() && { experience: experience.trim() }),
      ...(targetCompany.trim() && { targetCompany: targetCompany.trim() }),
      ...(focusAreas.length > 0 && { focusAreas }),
      ...(interviewMode !== DEFAULT_INTERVIEW_SETUP_MODE && { interviewMode }),
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
      const questions = Array.isArray(result?.questions) ? result?.questions : [];

      if (!sessionId || !questions.length) {
        const message = result?.message || 'Could not start live interview.';
        setStartError(message);
        toast.error(message);
        return;
      }

      navigate(`/interview-prep/mock/${sessionId}`, {
        state: {
          questions,
          roleLabel: roleTrimmed,
          difficulty,
          durationMinutes: Number(durationMinutes),
          interviewerPersona: DEFAULT_INTERVIEWER_PERSONA,
          customization: {
            resumeText: resumeText.trim() || undefined,
            resumeSkills: resumeSkills.length ? resumeSkills : undefined,
            resumeProjects: resumeProjects.length ? resumeProjects : undefined,
            experience: experience.trim() || undefined,
            targetCompany: targetCompany.trim() || undefined,
            focusAreas: focusAreas.length ? focusAreas : undefined,
            interviewMode,
            interviewerPersona: DEFAULT_INTERVIEWER_PERSONA,
          },
        },
      });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not start live interview.');
      setStartError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-w-0 space-y-md">
      <header className="min-w-0">
        <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
          Customize your interview
        </h1>
        <p className="font-body-md text-on-surface-variant mt-base">
          The more context you give, the more targeted your questions will be.
        </p>
      </header>

      <RoleResumeCard
        role={role}
        onRoleChange={setRole}
        onRoleBlur={() => setRoleTouched(true)}
        showRoleError={showRoleError}
        experience={experience}
        onExperienceChange={setExperience}
        targetCompany={targetCompany}
        onTargetCompanyChange={setTargetCompany}
        resumeSkills={resumeSkills}
        resumeProjects={resumeProjects}
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisClear={handleAnalysisClear}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <section className={CARD_CLASS}>
          <SectionHeader
            icon="tune"
            iconClassName={ICON_TINTS.difficulty}
            title="Difficulty"
            description="Match your experience level."
          />
          <div className="space-y-2">
            {DIFFICULTY_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={difficulty === option.value}
                onClick={() => setDifficulty(option.value)}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </section>

        <section className={CARD_CLASS}>
          <SectionHeader
            icon="hourglass_top"
            iconClassName={ICON_TINTS.time}
            title="Time"
            description="How long the session runs."
          />
          <div className="space-y-2">
            {TIME_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={durationMinutes === option.value}
                onClick={() => setDurationMinutes(option.value)}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </section>
      </div>

      <FocusAreasSection focusAreas={focusAreas} onFocusAreasChange={setFocusAreas} />

      <InterviewModeSection interviewMode={interviewMode} onInterviewModeChange={setInterviewMode} />

      <RetryErrorPanel
        title="Could not start interview"
        message={startError}
        retryLabel="Try again"
        onRetry={startError ? handleStart : undefined}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4 pt-2">
        <p className="font-body-md text-on-surface-variant text-sm text-center sm:text-right">
          {selectionSummary}
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-on-surface text-surface font-label-md min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 hover:opacity-90 shrink-0"
        >
          {startLiveInterview.isPending ? 'Starting…' : 'Start live interview'}
          {!startLiveInterview.isPending ? (
            <AppIcon name="chevron_right" size="sm" className="text-surface" />
          ) : null}
        </button>
      </div>
    </div>
  );
}

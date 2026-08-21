import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AppIcon from '../../../components/icons/AppIcon';
import RetryErrorPanel from './RetryErrorPanel';
import RoleResumeCard from './RoleResumeCard';
import {
  CARD_CLASS,
  DurationSection,
  FocusAreasSection,
  InterviewModeSection,
  SELECTED_OPTION_CLASS,
  UNSELECTED_OPTION_CLASS,
} from './InterviewSetupAdvanced';
import SectionHeading from '../../../components/ui/SectionHeading';
import Button from '../../../components/ui/Button';
import {
  DEFAULT_INTERVIEWER_PERSONA,
  DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES,
  DEFAULT_INTERVIEW_SETUP_MODE,
  clampDurationMinutes,
} from '../constants/interviewPrepConstants';
import { useInterviewMedia } from '../context/InterviewMediaContext';
import { useStartLiveInterview } from '../hooks/useMockInterview';
import { isVapiConfigured } from '../lib/vapi.sdk';
import { getMediaPermissionIssue, getPermissionIssueMessage } from '../utils/mediaPermissionUtils';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { preloadInterviewFaceModels } from '../hooks/useFaceVideoAnalysis';
import { cn } from '../../../lib/utils';

const DIFFICULTY_VALUES = ['easy', 'medium', 'hard'];

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
  const { t } = useTranslation('interviewPrep');
  const navigate = useNavigate();
  const { stream, requestAccess } = useInterviewMedia();
  const startLiveInterview = useStartLiveInterview();

  const [role, setRole] = useState('');
  const [roleTouched, setRoleTouched] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [durationMinutes, setDurationMinutes] = useState(
    DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES
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
    const difficultyLabel = t(`difficulty.${difficulty}`);
    const timeLabel = t('live.minutesShort', { count: durationMinutes });
    const parts = [];

    if (roleTrimmed) parts.push(roleTrimmed);
    parts.push(difficultyLabel, timeLabel);

    return parts.join(' · ');
  }, [roleTrimmed, difficulty, durationMinutes, t]);

  useEffect(() => {
    preloadInterviewFaceModels().catch(() => { });
  }, []);

  const hasLiveMediaStream = (mediaStream) =>
    Boolean(mediaStream?.getTracks?.().some((track) => track.readyState === 'live'));

  const handleStart = async () => {
    setRoleTouched(true);

    if (!roleTrimmed) {
      toast.error(t('mockSetup.enterRole'));
      return;
    }

    if (!isVapiConfigured()) {
      toast.error(t('mockSetup.vapiNotConfigured'));
      return;
    }

    setStartError(null);

    let activeStream = stream;

    if (!hasLiveMediaStream(activeStream)) {
      try {
        activeStream = await requestAccess();
      } catch (mediaErr) {
        const issue = getMediaPermissionIssue(mediaErr) || 'unknown';
        toast.error(getPermissionIssueMessage(issue));
        return;
      }
    }

    const payload = {
      role: roleTrimmed,
      difficulty,
      durationMinutes: clampDurationMinutes(durationMinutes),
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
        const message = result?.message || t('mockSetup.startFailed');
        setStartError(message);
        toast.error(message);
        return;
      }

      const sessionId = result?.sessionId != null ? String(result.sessionId) : '';
      const assistantId = result?.assistantId != null ? String(result.assistantId) : '';

      if (!sessionId || !assistantId) {
        const message = result?.message || t('mockSetup.startFailed');
        setStartError(message);
        toast.error(message);
        return;
      }

      navigate(`/interview-prep/mock/${sessionId}`, {
        state: {
          assistantId,
          roleLabel: roleTrimmed,
          difficulty,
          durationMinutes: clampDurationMinutes(durationMinutes),
          interviewerPersona: DEFAULT_INTERVIEWER_PERSONA,
          adaptiveDepthEnabled: Boolean(result?.adaptiveDepthEnabled),
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
      const message = getApiErrorMessage(err, t('mockSetup.startFailed'));
      setStartError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-w-0 space-y-md">
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
        <section className={cn(CARD_CLASS, 'h-full')}>
          <SectionHeading
            color="difficulty"
            icon="tune"
            title={t('mockSetup.difficulty.title')}
            description={t('mockSetup.difficulty.description')}
          />
          <div className="space-y-2">
            {DIFFICULTY_VALUES.map((value) => (
              <OptionButton
                key={value}
                selected={difficulty === value}
                onClick={() => setDifficulty(value)}
              >
                {t(`mockSetup.difficulty.${value}`)}
              </OptionButton>
            ))}
          </div>
        </section>

        <DurationSection
          durationMinutes={durationMinutes}
          onDurationMinutesChange={setDurationMinutes}
        />
      </div>

      <FocusAreasSection focusAreas={focusAreas} onFocusAreasChange={setFocusAreas} />

      <InterviewModeSection interviewMode={interviewMode} onInterviewModeChange={setInterviewMode} />

      <RetryErrorPanel
        title={t('mockSetup.startErrorTitle')}
        message={startError}
        retryLabel={t('retry.tryAgain')}
        onRetry={startError ? handleStart : undefined}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4 pt-2">
        <p className="font-body-md app-muted text-sm text-center sm:text-right">
          {selectionSummary}
        </p>
        <Button
          type="button"
          variant="gradient"
          onClick={handleStart}
          disabled={!canStart}
          className="w-full shrink-0 sm:w-auto"
        >
          {startLiveInterview.isPending ? (
            <>
              <AppIcon name="progress_activity" size="sm" spin className="text-white" />
              {t('mockSetup.starting')}
            </>
          ) : (
            <>
              <AppIcon name="sparkles" size="sm" className="text-white" />
              {t('mockSetup.startLive')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

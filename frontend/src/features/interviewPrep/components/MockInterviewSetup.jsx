import { useEffect, useRef, useState } from 'react';
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
  InterviewerPersonaSection,
  SELECTED_OPTION_CLASS,
  UNSELECTED_OPTION_CLASS,
} from './InterviewSetupAdvanced';
import SectionHeading from '../../../components/ui/SectionHeading';
import Button from '../../../components/ui/Button';
import {
  DEFAULT_INTERVIEWER_PERSONA,
  DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES,
  DEFAULT_INTERVIEW_SETUP_MODE,
  FOCUS_AREA_I18N_KEYS,
  INTERVIEW_FORMATS,
  INTERVIEWER_PERSONA_OPTIONS,
  clampDurationMinutes,
  durationMinutesToQuestionCount,
} from '../constants/interviewPrepConstants';
import { useInterviewMedia } from '../context/InterviewMediaContext';
import { useStartLiveInterview } from '../hooks/useMockInterview';
import { isVapiConfigured } from '../lib/vapi.sdk';
import { getMediaPermissionIssue, getPermissionIssueMessage } from '../utils/mediaPermissionUtils';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { preloadInterviewFaceModels } from '../hooks/useFaceVideoAnalysis';
import { suggestFocusAreasForRole } from '../utils/suggestFocusAreasForRole';
import {
  loadInterviewSetupPrefs,
  saveInterviewSetupPrefs,
} from '../utils/interviewSetupPrefs';
import { normalizeInterviewerPersona } from '../utils/interviewerPersona';
import { cn } from '../../../lib/utils';

const DIFFICULTY_VALUES = ['easy', 'medium', 'hard'];

const QUICK_PRESETS = [
  {
    id: 'quick',
    difficulty: 'easy',
    durationMinutes: 10,
    interviewMode: 'voice_only',
    interviewerPersona: 'friendly',
  },
  {
    id: 'standard',
    difficulty: 'medium',
    durationMinutes: 15,
    interviewMode: 'video_voice',
    interviewerPersona: 'neutral',
  },
  {
    id: 'senior',
    difficulty: 'hard',
    durationMinutes: 30,
    interviewMode: 'video_voice',
    interviewerPersona: 'strict',
  },
];

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

function hasLiveMediaStream(mediaStream) {
  return Boolean(mediaStream?.getTracks?.().some((track) => track.readyState === 'live'));
}

function SetupSummaryCard({
  roleTrimmed,
  difficulty,
  durationMinutes,
  interviewMode,
  interviewerPersona,
  focusAreas,
  devicesReady,
  devicesChecking,
  onCheckDevices,
  canStart,
  isStarting,
  showRoleHint,
  onStart,
}) {
  const { t } = useTranslation('interviewPrep');
  const questionCount = durationMinutesToQuestionCount(durationMinutes);
  const personaLabel = t(`mockSetup.persona.${interviewerPersona}.label`, {
    defaultValue:
      INTERVIEWER_PERSONA_OPTIONS.find((p) => p.value === interviewerPersona)?.label ||
      interviewerPersona,
  });
  const modeLabel =
    interviewMode === 'voice_only'
      ? t('mockSetup.mode.voiceOnly')
      : t('mockSetup.mode.videoVoice');

  return (
    <aside
      className={cn(
        'app-surface-card dashboard-card-hover flex h-fit w-full flex-col gap-2 p-3',
        'transition-all duration-200 hover:border-secondary/30'
      )}
    >
      <div>
        <p className="font-label-sm text-secondary leading-tight">{t('mockSetup.summary.eyebrow')}</p>
        <h2 className="mt-0.5 font-headline-section text-base font-semibold leading-tight app-heading">
          {t('mockSetup.summary.title')}
        </h2>
      </div>

      <dl className="space-y-1.5 rounded-xl bg-surface-container-low/80 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">{t('mockSetup.summary.role')}</dt>
          <dd className="max-w-[60%] text-end font-label-md text-on-surface truncate leading-snug">
            {roleTrimmed || t('mockSetup.summary.roleMissing')}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">{t('mockSetup.summary.difficulty')}</dt>
          <dd className="font-label-md text-on-surface leading-snug">{t(`difficulty.${difficulty}`)}</dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">{t('mockSetup.summary.duration')}</dt>
          <dd className="font-label-md text-on-surface leading-snug">
            {t('live.minutesShort', { count: durationMinutes })}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">{t('mockSetup.summary.questions')}</dt>
          <dd className="font-label-md text-on-surface leading-snug">
            {t('mockSetup.summary.questionCount', { count: questionCount })}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">{t('mockSetup.summary.mode')}</dt>
          <dd className="font-label-md text-on-surface leading-snug">{modeLabel}</dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">{t('mockSetup.summary.persona')}</dt>
          <dd className="font-label-md text-on-surface leading-snug">{personaLabel}</dd>
        </div>
        {focusAreas.length > 0 ? (
          <div className="pt-0.5">
            <dt className="font-label-sm app-muted mb-1 leading-snug">{t('mockSetup.summary.focus')}</dt>
            <dd className="flex flex-wrap gap-1">
              {focusAreas.map((area) => {
                const key = FOCUS_AREA_I18N_KEYS[area];
                return (
                  <span
                    key={area}
                    className="rounded-full bg-secondary/10 px-2 py-px font-label-sm text-secondary leading-snug"
                  >
                    {key ? t(`focusAreas.${key}`) : area}
                  </span>
                );
              })}
            </dd>
          </div>
        ) : null}
      </dl>

      <div
        className={cn(
          'flex items-center justify-between gap-2 rounded-xl border px-3 py-2',
          devicesReady
            ? 'border-emerald-200 bg-emerald-50/80'
            : 'border-outline-variant bg-white'
        )}
      >
        <p className="inline-flex min-w-0 items-center gap-1.5 font-label-md text-on-surface">
          <AppIcon
            name={devicesReady ? 'check_circle' : 'devices'}
            size="sm"
            className={devicesReady ? 'text-emerald-600' : 'text-on-surface-variant'}
          />
          <span className="truncate">
            {devicesReady
              ? t('mockSetup.devices.ready')
              : t('mockSetup.devices.notReady')}
          </span>
        </p>
        {!devicesReady ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCheckDevices}
            disabled={devicesChecking}
            className="shrink-0 px-3 py-1 text-sm"
          >
            {devicesChecking ? t('mockSetup.devices.checking') : t('mockSetup.devices.check')}
          </Button>
        ) : null}
      </div>

      {showRoleHint ? (
        <p className="font-label-sm text-error">{t('mockSetup.enterRole')}</p>
      ) : null}

      <Button
        type="button"
        variant="gradient"
        onClick={onStart}
        disabled={!canStart}
        className="w-full gap-1.5 !rounded-xl !py-2"
      >
        {isStarting ? (
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
    </aside>
  );
}

export default function MockInterviewSetup() {
  const { t } = useTranslation('interviewPrep');
  const navigate = useNavigate();
  const { stream, requestAccess } = useInterviewMedia();
  const startLiveInterview = useStartLiveInterview();
  const focusTouchedRef = useRef(false);
  const prefsHydratedRef = useRef(false);

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
  const [interviewerPersona, setInterviewerPersona] = useState(DEFAULT_INTERVIEWER_PERSONA);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [startError, setStartError] = useState(null);
  const [devicesChecking, setDevicesChecking] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  const roleTrimmed = role.trim();
  const showRoleError = roleTouched && !roleTrimmed;
  const canStart = Boolean(roleTrimmed) && !startLiveInterview.isPending;
  const devicesReady = hasLiveMediaStream(stream);

  useEffect(() => {
    preloadInterviewFaceModels().catch(() => { });
  }, []);

  useEffect(() => {
    if (prefsHydratedRef.current) return;
    prefsHydratedRef.current = true;
    const prefs = loadInterviewSetupPrefs();
    if (!prefs) return;

    if (prefs.difficulty) setDifficulty(prefs.difficulty);
    if (prefs.durationMinutes != null) {
      setDurationMinutes(clampDurationMinutes(prefs.durationMinutes));
    }
    if (prefs.interviewMode) setInterviewMode(prefs.interviewMode);
    if (prefs.interviewerPersona) {
      setInterviewerPersona(normalizeInterviewerPersona(prefs.interviewerPersona));
    }
    if (Array.isArray(prefs.focusAreas) && prefs.focusAreas.length) {
      focusTouchedRef.current = true;
      setFocusAreas(prefs.focusAreas);
    }
    if (prefs.experience) setExperience(String(prefs.experience));
    if (prefs.targetCompany) setTargetCompany(String(prefs.targetCompany));
  }, []);

  useEffect(() => {
    if (focusTouchedRef.current) return;
    if (!roleTrimmed) {
      setFocusAreas([]);
      return;
    }
    setFocusAreas(suggestFocusAreasForRole(roleTrimmed));
  }, [roleTrimmed]);

  const handleAnalysisComplete = ({ text, skills, projects }) => {
    setResumeText(text || '');
    setResumeSkills(Array.isArray(skills) ? skills : []);
    setResumeProjects(Array.isArray(projects) ? projects : []);
    setResumeOpen(true);
  };

  const handleAnalysisClear = () => {
    setResumeText('');
    setResumeSkills([]);
    setResumeProjects([]);
  };

  const handleFocusAreasChange = (next) => {
    focusTouchedRef.current = true;
    setFocusAreas(next);
    setActivePreset(null);
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setDifficulty(preset.difficulty);
    setDurationMinutes(preset.durationMinutes);
    setInterviewMode(preset.interviewMode);
    setInterviewerPersona(preset.interviewerPersona);
  };

  const handleCheckDevices = async () => {
    setDevicesChecking(true);
    try {
      await requestAccess();
      toast.success(t('mockSetup.devices.readyToast'));
    } catch (mediaErr) {
      const issue = getMediaPermissionIssue(mediaErr) || 'unknown';
      toast.error(getPermissionIssueMessage(issue));
    } finally {
      setDevicesChecking(false);
    }
  };

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

    const clampedDuration = clampDurationMinutes(durationMinutes);

    saveInterviewSetupPrefs({
      difficulty,
      durationMinutes: clampedDuration,
      interviewMode,
      interviewerPersona,
      focusAreas,
      experience: experience.trim() || undefined,
      targetCompany: targetCompany.trim() || undefined,
    });

    const payload = {
      role: roleTrimmed,
      difficulty,
      durationMinutes: clampedDuration,
      interviewFormat: INTERVIEW_FORMATS.STANDARD,
      interviewerPersona,
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
          durationMinutes: clampedDuration,
          interviewerPersona,
          interviewFormat: INTERVIEW_FORMATS.STANDARD,
          adaptiveDepthEnabled: Boolean(result?.adaptiveDepthEnabled),
          customization: {
            resumeText: resumeText.trim() || undefined,
            resumeSkills: resumeSkills.length ? resumeSkills : undefined,
            resumeProjects: resumeProjects.length ? resumeProjects : undefined,
            experience: experience.trim() || undefined,
            targetCompany: targetCompany.trim() || undefined,
            focusAreas: focusAreas.length ? focusAreas : undefined,
            interviewMode,
            interviewerPersona,
            interviewFormat: INTERVIEW_FORMATS.STANDARD,
          },
        },
      });
    } catch (err) {
      const message = getApiErrorMessage(err, t('mockSetup.startFailed'));
      setStartError(message);
      toast.error(message);
    }
  };

  const summaryProps = {
    roleTrimmed,
    difficulty,
    durationMinutes,
    interviewMode,
    interviewerPersona,
    focusAreas,
    devicesReady,
    devicesChecking,
    onCheckDevices: handleCheckDevices,
    canStart,
    isStarting: startLiveInterview.isPending,
    showRoleHint: showRoleError,
    onStart: handleStart,
  };

  return (
    <div className="min-w-0 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(220px,25%)] lg:items-start lg:gap-5 lg:overflow-hidden">
      {/* Only this column scrolls — circled form content */}
      <div className="hide-scrollbar min-w-0 space-y-md pb-28 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:pb-4">
        <section className={cn(CARD_CLASS, 'space-y-3')}>
          <SectionHeading
            color="settings"
            icon="sparkles"
            title={t('mockSetup.presets.title')}
            description={t('mockSetup.presets.description')}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  'rounded-xl border-2 px-3 py-3 text-left transition-all duration-150',
                  activePreset === preset.id ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
                )}
              >
                <span className="block font-label-md">
                  {t(`mockSetup.presets.${preset.id}.label`)}
                </span>
                <span className="mt-0.5 block font-body-md text-sm app-muted">
                  {t(`mockSetup.presets.${preset.id}.hint`)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <RoleResumeCard
          role={role}
          onRoleChange={(value) => {
            setRole(value);
            setActivePreset(null);
          }}
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
          resumeOpen={resumeOpen}
          onResumeOpenChange={setResumeOpen}
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
                  onClick={() => {
                    setDifficulty(value);
                    setActivePreset(null);
                  }}
                >
                  {t(`mockSetup.difficulty.${value}`)}
                </OptionButton>
              ))}
            </div>
          </section>

          <DurationSection
            durationMinutes={durationMinutes}
            onDurationMinutesChange={(value) => {
              setDurationMinutes(value);
              setActivePreset(null);
            }}
          />
        </div>

        <InterviewerPersonaSection
          persona={interviewerPersona}
          onPersonaChange={(value) => {
            setInterviewerPersona(value);
            setActivePreset(null);
          }}
        />

        <FocusAreasSection focusAreas={focusAreas} onFocusAreasChange={handleFocusAreasChange} />

        <InterviewModeSection
          interviewMode={interviewMode}
          onInterviewModeChange={(value) => {
            setInterviewMode(value);
            setActivePreset(null);
          }}
        />

        <RetryErrorPanel
          title={t('mockSetup.startErrorTitle')}
          message={startError}
          retryLabel={t('retry.tryAgain')}
          onRetry={startError ? handleStart : undefined}
        />
      </div>

      {/* Fixed in place — does not scroll with left content */}
      <div className="hidden w-full lg:block lg:h-fit lg:self-start">
        <SetupSummaryCard {...summaryProps} />
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/60 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-label-md text-on-surface">
              {roleTrimmed || t('mockSetup.summary.roleMissing')}
            </p>
            <p className="truncate font-body-md text-sm app-muted">
              {[
                t(`difficulty.${difficulty}`),
                t('live.minutesShort', { count: durationMinutes }),
                interviewMode === 'voice_only'
                  ? t('mockSetup.mode.voiceOnly')
                  : t('mockSetup.mode.videoVoice'),
              ].join(' · ')}
            </p>
          </div>
          <Button
            type="button"
            variant="gradient"
            onClick={handleStart}
            disabled={!canStart}
            className="shrink-0 px-4 py-2.5"
          >
            {startLiveInterview.isPending ? (
              <AppIcon name="progress_activity" size="sm" spin className="text-white" />
            ) : (
              t('mockSetup.startLiveShort')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

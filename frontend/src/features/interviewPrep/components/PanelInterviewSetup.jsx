import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AppIcon from '../../../components/icons/AppIcon';
import Button from '../../../components/ui/Button';
import SectionHeading from '../../../components/ui/SectionHeading';
import RetryErrorPanel from './RetryErrorPanel';
import RoleResumeCard from './RoleResumeCard';
import PanelRosterSection from './PanelRosterSection';
import {
  CARD_CLASS,
  SELECTED_OPTION_CLASS,
  UNSELECTED_OPTION_CLASS,
} from './InterviewSetupAdvanced';
import {
  DEFAULT_INTERVIEW_SETUP_MODE,
  DEFAULT_PANEL_LENGTH_MINUTES,
  INTERVIEW_FORMATS,
  INTERVIEW_SETUP_MODE_OPTIONS,
  MAX_MOCK_INTERVIEW_DURATION_MINUTES,
  MIN_MOCK_INTERVIEW_DURATION_MINUTES,
  PANEL_LENGTH_OPTIONS,
  PANEL_PRESETS,
  PANEL_PRESSURE_OPTIONS,
  PANEL_THEME_OPTIONS,
  clampDurationMinutes,
  durationMinutesToQuestionCount,
} from '../constants/interviewPrepConstants';
import { useInterviewMedia } from '../context/InterviewMediaContext';
import { usePreviewPanelSeats, useStartLiveInterview } from '../hooks/useMockInterview';
import { isVapiConfigured } from '../lib/vapi.sdk';
import { getMediaPermissionIssue, getPermissionIssueMessage } from '../utils/mediaPermissionUtils';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { preloadInterviewFaceModels } from '../hooks/useFaceVideoAnalysis';
import { loadInterviewSetupPrefs, saveInterviewSetupPrefs } from '../utils/interviewSetupPrefs';
import { cn } from '../../../lib/utils';

const PREFS_SCOPE = 'panel';
const MODE_ICONS = { video_voice: 'videocam', voice_only: 'mic' };

function hasLiveMediaStream(mediaStream) {
  return Boolean(mediaStream?.getTracks?.().some((track) => track.readyState === 'live'));
}

function PillOption({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 px-4 py-2 font-label-sm transition-all duration-150',
        selected ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
      )}
    >
      {children}
    </button>
  );
}

function JoinPanelAside({
  roleTrimmed,
  seats,
  difficulty,
  durationMinutes,
  interviewMode,
  themes,
  devicesReady,
  devicesChecking,
  onCheckDevices,
  canStart,
  isStarting,
  showRoleHint,
  onStart,
}) {
  const { t } = useTranslation('interviewPrep');
  const pressureKey =
    PANEL_PRESSURE_OPTIONS.find((option) => option.value === difficulty)?.i18nKey || 'standard';
  const modeLabel =
    interviewMode === 'voice_only'
      ? t('panelSetup.join.voiceOnly')
      : t('panelSetup.join.videoVoice');

  return (
    <aside className="app-surface-card flex h-fit w-full flex-col gap-3 p-3">
      <div>
        <p className="font-label-sm text-secondary leading-tight">
          {t('panelSetup.aside.eyebrow')}
        </p>
        <h2 className="mt-0.5 font-headline-section text-base font-semibold leading-tight app-heading">
          {t('panelSetup.aside.title')}
        </h2>
      </div>

      <div className="rounded-xl bg-surface-container-low/80 p-2.5">
        <p className="font-label-sm app-muted">{t('panelSetup.aside.meeting')}</p>
        <p className="mt-0.5 truncate font-label-md text-on-surface">
          {roleTrimmed || t('panelSetup.aside.roleMissing')}
        </p>

        <ol className="mt-2.5 space-y-1.5">
          {(seats.length ? seats.slice(0, 3) : [{}, {}, {}]).map((seat, index) => (
            <li
              key={seat.displayName ? `${seat.displayName}-${index}` : `aside-seat-${index}`}
              className="flex items-start gap-2"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 font-label-sm text-secondary">
                {index + 1}
              </span>
              <span className="min-w-0 font-body-md text-sm text-on-surface">
                {seat.displayName
                  ? `${seat.displayName} · ${seat.title || t('panelSetup.aside.seatPending')}`
                  : seat.title || t('panelSetup.aside.seatPending')}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <dl className="space-y-1.5 rounded-xl bg-surface-container-low/80 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <dt className="font-label-sm app-muted">{t('panelSetup.aside.pressure')}</dt>
          <dd className="font-label-md text-on-surface">
            {t(`panelSetup.pressure.${pressureKey}.label`)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="font-label-sm app-muted">{t('panelSetup.aside.length')}</dt>
          <dd className="font-label-md text-on-surface">
            {t('live.minutesShort', { count: durationMinutes })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="font-label-sm app-muted">{t('panelSetup.aside.rounds')}</dt>
          <dd className="font-label-md text-on-surface">
            {t('panelSetup.aside.roundsValue', {
              count: durationMinutesToQuestionCount(durationMinutes),
            })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="font-label-sm app-muted">{t('panelSetup.aside.joining')}</dt>
          <dd className="font-label-md text-on-surface">{modeLabel}</dd>
        </div>
        {themes.length ? (
          <div className="pt-0.5">
            <dt className="mb-1 font-label-sm app-muted">{t('panelSetup.aside.themes')}</dt>
            <dd className="flex flex-wrap gap-1">
              {themes.map((theme) => {
                const key = PANEL_THEME_OPTIONS.find((item) => item.value === theme)?.i18nKey;
                return (
                  <span
                    key={theme}
                    className="rounded-full bg-secondary/10 px-2 py-px font-label-sm text-secondary"
                  >
                    {key ? t(`panelSetup.themes.${key}`) : theme}
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
          devicesReady ? 'border-emerald-200 bg-emerald-50/80' : 'border-outline-variant bg-white'
        )}
      >
        <p className="inline-flex min-w-0 items-center gap-1.5 font-label-md text-on-surface">
          <AppIcon
            name={devicesReady ? 'check_circle' : 'devices'}
            size="sm"
            className={devicesReady ? 'text-emerald-600' : 'text-on-surface-variant'}
          />
          <span className="truncate">
            {devicesReady ? t('panelSetup.devices.ready') : t('panelSetup.devices.notReady')}
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
        <p className="font-label-sm text-error">{t('panelSetup.enterRole')}</p>
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
            {t('panelSetup.joining')}
          </>
        ) : (
          <>
            <AppIcon name="groups" size="sm" className="text-white" />
            {t('panelSetup.joinPanel')}
          </>
        )}
      </Button>
    </aside>
  );
}

export default function PanelInterviewSetup() {
  const { t } = useTranslation('interviewPrep');
  const navigate = useNavigate();
  const { stream, requestAccess } = useInterviewMedia();
  const startLiveInterview = useStartLiveInterview();
  const prefsHydratedRef = useRef(false);
  const customLengthRef = useRef(null);

  const [role, setRole] = useState('');
  const [roleTouched, setRoleTouched] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_PANEL_LENGTH_MINUTES);
  const [customLength, setCustomLength] = useState('');
  const [themes, setThemes] = useState([]);
  const [interviewMode, setInterviewMode] = useState(DEFAULT_INTERVIEW_SETUP_MODE);
  const [resumeText, setResumeText] = useState('');
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeProjects, setResumeProjects] = useState([]);
  const [experience, setExperience] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [resumeOpen, setResumeOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [devicesChecking, setDevicesChecking] = useState(false);
  const [startError, setStartError] = useState(null);

  const roleTrimmed = role.trim();
  const showRoleError = roleTouched && !roleTrimmed;
  const canStart = Boolean(roleTrimmed) && !startLiveInterview.isPending;
  const devicesReady = hasLiveMediaStream(stream);
  const isCustomLength = !PANEL_LENGTH_OPTIONS.includes(durationMinutes);

  const { data: seats = [], isFetching: seatsLoading } = usePreviewPanelSeats(
    roleTrimmed,
    Boolean(roleTrimmed)
  );

  useEffect(() => {
    preloadInterviewFaceModels().catch(() => { });
  }, []);

  useEffect(() => {
    if (prefsHydratedRef.current) return;
    prefsHydratedRef.current = true;
    const prefs = loadInterviewSetupPrefs(PREFS_SCOPE);
    if (!prefs) return;

    if (prefs.difficulty) setDifficulty(prefs.difficulty);
    if (prefs.durationMinutes != null) {
      const minutes = clampDurationMinutes(prefs.durationMinutes);
      setDurationMinutes(minutes);
      if (!PANEL_LENGTH_OPTIONS.includes(minutes)) setCustomLength(String(minutes));
    }
    if (prefs.interviewMode) setInterviewMode(prefs.interviewMode);
    if (Array.isArray(prefs.themes)) setThemes(prefs.themes);
    if (prefs.experience) setExperience(String(prefs.experience));
    if (prefs.targetCompany) setTargetCompany(String(prefs.targetCompany));
  }, []);

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setDifficulty(preset.difficulty);
    setDurationMinutes(preset.durationMinutes);
    setCustomLength('');
    setInterviewMode(preset.interviewMode);
  };

  const toggleTheme = (value) => {
    setActivePreset(null);
    setThemes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const applyCustomLength = (raw) => {
    setCustomLength(raw);
    setActivePreset(null);
    const parsed = Number.parseInt(String(raw).trim(), 10);
    if (
      Number.isInteger(parsed) &&
      parsed >= MIN_MOCK_INTERVIEW_DURATION_MINUTES &&
      parsed <= MAX_MOCK_INTERVIEW_DURATION_MINUTES
    ) {
      setDurationMinutes(parsed);
    }
  };

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

  const handleCheckDevices = async () => {
    setDevicesChecking(true);
    try {
      await requestAccess();
      toast.success(t('panelSetup.devices.readyToast'));
    } catch (mediaErr) {
      const issue = getMediaPermissionIssue(mediaErr) || 'unknown';
      toast.error(getPermissionIssueMessage(issue));
    } finally {
      setDevicesChecking(false);
    }
  };

  const handleJoin = async () => {
    setRoleTouched(true);

    if (!roleTrimmed) {
      toast.error(t('panelSetup.enterRole'));
      return;
    }

    if (!isVapiConfigured()) {
      toast.error(t('mockSetup.vapiNotConfigured'));
      return;
    }

    setStartError(null);

    if (!hasLiveMediaStream(stream)) {
      try {
        await requestAccess();
      } catch (mediaErr) {
        const issue = getMediaPermissionIssue(mediaErr) || 'unknown';
        toast.error(getPermissionIssueMessage(issue));
        return;
      }
    }

    const clampedDuration = clampDurationMinutes(durationMinutes);

    saveInterviewSetupPrefs(
      {
        difficulty,
        durationMinutes: clampedDuration,
        interviewMode,
        themes,
        experience: experience.trim() || undefined,
        targetCompany: targetCompany.trim() || undefined,
      },
      PREFS_SCOPE
    );

    const payload = {
      role: roleTrimmed,
      difficulty,
      durationMinutes: clampedDuration,
      interviewFormat: INTERVIEW_FORMATS.PANEL,
      ...(resumeText.trim() && { resumeText: resumeText.trim() }),
      ...(resumeSkills.length > 0 && { resumeSkills }),
      ...(resumeProjects.length > 0 && { resumeProjects }),
      ...(experience.trim() && { experience: experience.trim() }),
      ...(targetCompany.trim() && { targetCompany: targetCompany.trim() }),
      ...(themes.length > 0 && { focusAreas: themes }),
      ...(interviewMode !== DEFAULT_INTERVIEW_SETUP_MODE && { interviewMode }),
    };

    try {
      const result = await startLiveInterview.mutateAsync(payload);
      const sessionId = result?.sessionId != null ? String(result.sessionId) : '';
      const assistantId = result?.assistantId != null ? String(result.assistantId) : '';

      if (result?.success === false || !sessionId || !assistantId) {
        const message = result?.message || t('panelSetup.joinFailed');
        setStartError(message);
        toast.error(message);
        return;
      }

      navigate(`/interview-prep/panel/${sessionId}`, {
        state: {
          assistantId,
          roleLabel: roleTrimmed,
          difficulty,
          durationMinutes: clampedDuration,
          interviewerPersona: 'panel',
          interviewFormat: INTERVIEW_FORMATS.PANEL,
          panelSeats: result?.panelSeats?.length ? result.panelSeats : seats,
          adaptiveDepthEnabled: Boolean(result?.adaptiveDepthEnabled),
          customization: {
            resumeText: resumeText.trim() || undefined,
            resumeSkills: resumeSkills.length ? resumeSkills : undefined,
            resumeProjects: resumeProjects.length ? resumeProjects : undefined,
            experience: experience.trim() || undefined,
            targetCompany: targetCompany.trim() || undefined,
            focusAreas: themes.length ? themes : undefined,
            interviewMode,
            interviewFormat: INTERVIEW_FORMATS.PANEL,
          },
        },
      });
    } catch (err) {
      const message = getApiErrorMessage(err, t('panelSetup.joinFailed'));
      setStartError(message);
      toast.error(message);
    }
  };

  const asideProps = {
    roleTrimmed,
    seats,
    difficulty,
    durationMinutes,
    interviewMode,
    themes,
    devicesReady,
    devicesChecking,
    onCheckDevices: handleCheckDevices,
    canStart,
    isStarting: startLiveInterview.isPending,
    showRoleHint: showRoleError,
    onStart: handleJoin,
  };

  return (
    <div className="min-w-0 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(240px,27%)] lg:items-start lg:gap-5 lg:overflow-hidden">
      <div className="hide-scrollbar min-w-0 space-y-md pb-28 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:pb-4">
        <section className={cn(CARD_CLASS, 'space-y-3')}>
          <SectionHeading
            color="interview"
            icon="groups"
            title={t('panelSetup.presets.title')}
            description={t('panelSetup.presets.description')}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            {PANEL_PRESETS.map((preset) => (
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
                  {t(`panelSetup.presets.${preset.id}.label`)}
                </span>
                <span className="mt-0.5 block font-body-md text-sm app-muted">
                  {t(`panelSetup.presets.${preset.id}.hint`)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <RoleResumeCard
          title={t('panelSetup.role.title')}
          description={t('panelSetup.role.description')}
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

        <PanelRosterSection seats={seats} isLoading={seatsLoading} roleLabel={roleTrimmed} />

        <div className="grid gap-4 sm:grid-cols-2">
          <section className={cn(CARD_CLASS, 'h-full space-y-3')}>
            <SectionHeading
              color="difficulty"
              icon="tune"
              title={t('panelSetup.pressure.title')}
              description={t('panelSetup.pressure.description')}
            />
            <div className="space-y-2">
              {PANEL_PRESSURE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDifficulty(option.value);
                    setActivePreset(null);
                  }}
                  className={cn(
                    'w-full rounded-xl border-2 px-4 py-2.5 text-left transition-all duration-150',
                    difficulty === option.value ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
                  )}
                >
                  <span className="block font-label-md">
                    {t(`panelSetup.pressure.${option.i18nKey}.label`)}
                  </span>
                  <span className="mt-0.5 block font-body-md text-sm app-muted">
                    {t(`panelSetup.pressure.${option.i18nKey}.hint`)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className={cn(CARD_CLASS, 'h-full space-y-3')}>
            <SectionHeading
              color="time"
              icon="hourglass_top"
              title={t('panelSetup.length.title')}
              description={t('panelSetup.length.description')}
            />
            <div className="flex flex-wrap gap-2">
              {PANEL_LENGTH_OPTIONS.map((minutes) => (
                <PillOption
                  key={minutes}
                  selected={!isCustomLength && durationMinutes === minutes}
                  onClick={() => {
                    setDurationMinutes(minutes);
                    setCustomLength('');
                    setActivePreset(null);
                  }}
                >
                  {t('live.minutesShort', { count: minutes })}
                </PillOption>
              ))}
            </div>
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl border-2 px-4 py-2 transition-all duration-150',
                isCustomLength ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
              )}
            >
              <button
                type="button"
                onClick={() => customLengthRef.current?.focus()}
                className={cn(
                  'shrink-0 font-label-md',
                  isCustomLength ? 'text-secondary' : 'text-on-surface-variant'
                )}
              >
                {t('panelSetup.length.custom')}
              </button>
              <input
                ref={customLengthRef}
                type="number"
                inputMode="numeric"
                min={MIN_MOCK_INTERVIEW_DURATION_MINUTES}
                max={MAX_MOCK_INTERVIEW_DURATION_MINUTES}
                value={customLength}
                placeholder={t('panelSetup.length.placeholder')}
                aria-label={t('panelSetup.length.customAria')}
                onChange={(event) => applyCustomLength(event.target.value)}
                className={cn(
                  'min-w-0 flex-1 rounded-lg border border-[#E2E7EE] bg-white px-3 py-1',
                  'font-label-md tabular-nums text-on-surface outline-none',
                  'placeholder:text-on-surface-variant/50',
                  'focus:border-secondary focus:ring-2 focus:ring-secondary/15',
                  '[appearance:textfield]',
                  '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                )}
              />
              <span className="shrink-0 font-label-sm text-on-surface-variant">
                {t('mockSetup.time.minutesUnit')}
              </span>
            </div>
            <p className="font-body-md text-sm app-muted">
              {t('panelSetup.length.roundsPreview', {
                count: durationMinutesToQuestionCount(durationMinutes),
              })}
            </p>
          </section>
        </div>

        <section className={cn(CARD_CLASS, 'space-y-3')}>
          <SectionHeading
            color="focus"
            icon="target"
            title={t('panelSetup.themes.title')}
            description={t('panelSetup.themes.description')}
            optional
          />
          <div className="flex flex-wrap gap-2">
            {PANEL_THEME_OPTIONS.map((option) => (
              <PillOption
                key={option.value}
                selected={themes.includes(option.value)}
                onClick={() => toggleTheme(option.value)}
              >
                {t(`panelSetup.themes.${option.i18nKey}`)}
              </PillOption>
            ))}
          </div>
        </section>

        <section className={cn(CARD_CLASS, 'space-y-3')}>
          <SectionHeading
            color="mode"
            icon="mic"
            title={t('panelSetup.join.title')}
            description={t('panelSetup.join.description')}
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {INTERVIEW_SETUP_MODE_OPTIONS.map((option) => {
              const selected = interviewMode === option.value;
              const isVideo = option.value === 'video_voice';
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setInterviewMode(option.value);
                    setActivePreset(null);
                  }}
                  className={cn(
                    'flex flex-col gap-1 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150',
                    selected ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
                  )}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <AppIcon
                      name={MODE_ICONS[option.value] || 'mic'}
                      size="sm"
                      className={cn(
                        'shrink-0',
                        selected ? 'text-secondary' : 'text-on-surface-variant'
                      )}
                    />
                    <span
                      className={cn('font-label-md', selected ? 'text-secondary' : 'text-on-surface')}
                    >
                      {isVideo ? t('panelSetup.join.videoVoice') : t('panelSetup.join.voiceOnly')}
                    </span>
                  </span>
                  <span className="pl-7 font-body-md text-sm app-muted">
                    {isVideo
                      ? t('panelSetup.join.videoVoiceHint')
                      : t('panelSetup.join.voiceOnlyHint')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <RetryErrorPanel
          title={t('panelSetup.joinErrorTitle')}
          message={startError}
          retryLabel={t('retry.tryAgain')}
          onRetry={startError ? handleJoin : undefined}
        />
      </div>

      <div className="hidden w-full lg:block lg:h-fit lg:self-start">
        <JoinPanelAside {...asideProps} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/60 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-label-md text-on-surface">
              {roleTrimmed || t('panelSetup.aside.roleMissing')}
            </p>
            <p className="truncate font-body-md text-sm app-muted">
              {[
                t('panelSetup.aside.seatCount', { count: seats.length || 3 }),
                t('live.minutesShort', { count: durationMinutes }),
                interviewMode === 'voice_only'
                  ? t('panelSetup.join.voiceOnly')
                  : t('panelSetup.join.videoVoice'),
              ].join(' · ')}
            </p>
          </div>
          <Button
            type="button"
            variant="gradient"
            onClick={handleJoin}
            disabled={!canStart}
            className="shrink-0 px-4 py-2.5"
          >
            {startLiveInterview.isPending ? (
              <AppIcon name="progress_activity" size="sm" spin className="text-white" />
            ) : (
              t('panelSetup.joinPanelShort')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

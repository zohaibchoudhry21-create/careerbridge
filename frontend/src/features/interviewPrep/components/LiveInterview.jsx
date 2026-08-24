import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';
import Button from '../../../components/ui/Button';
import SettingsConfirmDialog from '../../../components/settings/SettingsConfirmDialog';
import { toDisplayErrorMessage } from '../lib/vapi.sdk';
import { DEFAULT_INTERVIEW_SETUP_MODE } from '../constants/interviewPrepConstants';
import InterviewCountdownBadge from './InterviewCountdownBadge';
import { matchActivePanelSeatIndex, shortSeatTag, stripPanelSeatTag } from '../utils/panelSeatMatch';
import { getInterviewerPersonaLabel } from '../utils/interviewerPersona';

const AI_ORB_DOTS = [0, 1, 2];
const WAVE_BARS = [0, 1, 2, 3, 4, 5];

function MetricPill({ active, labelOn }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-container px-2.5 py-0.5 font-label-sm text-on-tertiary-container">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
      {labelOn}
    </span>
  );
}

function SpeakerBadge({ name, active }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm font-semibold transition-colors duration-200',
        active ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
      )}
    >
      {active ? (
        <span className="flex gap-0.5" aria-hidden>
          {AI_ORB_DOTS.map((dot) => (
            <span
              key={dot}
              className="h-1 w-1 rounded-full bg-current animate-pulse"
              style={{ animationDelay: `${dot * 150}ms` }}
            />
          ))}
        </span>
      ) : null}
      {name}
    </span>
  );
}

function VoiceWaveform({ active }) {
  return (
    <div className="flex h-12 items-end justify-center gap-1.5" aria-hidden>
      {WAVE_BARS.map((bar) => (
        <span
          key={bar}
          className={cn(
            'w-1.5 rounded-full bg-secondary transition-all duration-200',
            active ? 'animate-bounce bg-secondary-container' : 'h-2 bg-secondary/35'
          )}
          style={{
            height: active ? `${14 + (bar % 3) * 10}px` : '8px',
            animationDelay: `${bar * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Premium live-interview shell. Vapi/Groq wiring stays in LiveInterviewAgent.
 * Video grid (AI + camera tiles) stays LTR and unchanged in structure/size.
 */
export default function LiveInterview({
  userName,
  aiName,
  status = 'idle',
  activeSpeaker = null,
  transcript = [],
  livePreview = null,
  interviewMode = DEFAULT_INTERVIEW_SETUP_MODE,
  interviewFormat = 'standard',
  interviewerPersona = 'neutral',
  panelSeats = [],
  roleLabel = '',
  difficulty = '',
  durationMinutes = null,
  countdownDisplay = null,
  countdownUrgency = 'idle',
  videoMetricsOn = false,
  voiceMetricsOn = false,
  cameraOn = true,
  micOn = true,
  hasStream = false,
  notice = null,
  errorMessage = null,
  startDisabled = false,
  startLabel,
  onStart,
  onEnd,
  onToggleMic,
  onToggleCamera,
  videoRef,
  videoOverlay = null,
  isSubmitting = false,
}) {
  const { t } = useTranslation('interviewPrep');
  const transcriptEndRef = useRef(null);
  const transcriptScrollRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const isVoiceOnly = interviewMode === 'voice_only';
  const isVideoVoice = !isVoiceOnly;
  const isPanel =
    interviewFormat === 'panel' && Array.isArray(panelSeats) && panelSeats.length > 0;
  const personaKey = String(interviewerPersona || 'neutral').toLowerCase();
  const personaLabel = t(`mockSetup.persona.${personaKey}.label`, {
    defaultValue: getInterviewerPersonaLabel(personaKey),
  });
  const resolvedAiName = isPanel
    ? t('live.panelName')
    : personaLabel || aiName || t('live.aiName');

  const isActive = status === 'active';
  const isConnecting = status === 'connecting';
  const isLiveSession = isActive || isConnecting;
  const aiSpeaking = activeSpeaker === 'ai';
  const userSpeaking = activeSpeaker === 'user' && isActive;
  const micReady = Boolean(hasStream);
  const cameraReady = isVoiceOnly ? true : Boolean(hasStream && cameraOn);
  const lastTurnId = transcript.length ? transcript[transcript.length - 1].id : null;
  const lastSpeaker = transcript.length ? transcript[transcript.length - 1].speaker : null;
  const previewNeedsOwnBubble =
    Boolean(livePreview?.text) && livePreview.speaker !== lastSpeaker;
  const displayError = errorMessage
    ? toDisplayErrorMessage(errorMessage, t('live.genericError'))
    : null;
  const hasTranscriptContent = transcript.length > 0 || Boolean(livePreview?.text);

  const lastAssistantText = useMemo(() => {
    if (livePreview?.speaker === 'ai' && livePreview?.text) return livePreview.text;
    for (let i = transcript.length - 1; i >= 0; i -= 1) {
      if (transcript[i]?.speaker === 'ai') return transcript[i].text || '';
    }
    return '';
  }, [transcript, livePreview]);

  const activeSeatIndex = useMemo(
    () =>
      isPanel
        ? Math.max(0, matchActivePanelSeatIndex(panelSeats, lastAssistantText))
        : 0,
    [isPanel, panelSeats, lastAssistantText]
  );
  const activeSeat = isPanel ? panelSeats[activeSeatIndex] : null;

  let aiStatusLabel = t('live.statusReady');
  if (isConnecting) aiStatusLabel = t('live.statusConnecting');
  else if (isActive) aiStatusLabel = aiSpeaking ? t('live.statusSpeaking') : t('live.statusListening');
  else if (status === 'ended') aiStatusLabel = t('live.statusEnded');

  const difficultyLabel = difficulty
    ? t(`difficulty.${difficulty}`, { defaultValue: difficulty })
    : null;

  const resolvedStartLabel = startLabel ?? (isPanel ? t('live.startPanel') : t('live.startInterview'));

  const idleMetaParts = [
    roleLabel,
    difficultyLabel,
    durationMinutes != null ? t('live.minutesShort', { count: durationMinutes }) : null,
  ].filter(Boolean);

  const liveMetaParts = [
    roleLabel,
    difficultyLabel,
    !countdownDisplay && durationMinutes != null
      ? t('live.minutesShort', { count: durationMinutes })
      : null,
  ].filter(Boolean);

  const scrollTranscriptToEnd = useCallback((behavior = 'smooth') => {
    transcriptEndRef.current?.scrollIntoView({ behavior, block: 'nearest' });
    stickToBottomRef.current = true;
    setShowJumpLatest(false);
  }, []);

  const handleTranscriptScroll = useCallback(() => {
    const el = transcriptScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 72;
    stickToBottomRef.current = nearBottom;
    setShowJumpLatest(!nearBottom && hasTranscriptContent);
  }, [hasTranscriptContent]);

  useEffect(() => {
    if (!stickToBottomRef.current) {
      setShowJumpLatest(hasTranscriptContent);
      return;
    }
    scrollTranscriptToEnd('smooth');
  }, [transcript.length, livePreview?.text, hasTranscriptContent, scrollTranscriptToEnd]);

  // Desktop: when live, lock outer main scroll so only the transcript pane scrolls.
  useEffect(() => {
    if (!isLiveSession) return undefined;
    const main = document.querySelector('.dashboard-main');
    if (!main || !(main instanceof HTMLElement)) return undefined;

    const previousOverflowY = main.style.overflowY;
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => {
      main.style.overflowY = mq.matches ? 'hidden' : previousOverflowY || '';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      main.style.overflowY = previousOverflowY;
    };
  }, [isLiveSession]);

  const handleConfirmEnd = () => {
    setConfirmEndOpen(false);
    onEnd?.();
  };

  const panelStage = (
    <div className="relative overflow-hidden rounded-3xl border border-secondary/15 bg-white p-3 shadow-[0_8px_30px_rgba(0,88,190,0.08)] sm:p-4">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/[0.07] via-transparent to-secondary-container/[0.12]"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-2 pb-2.5">
        <p className="inline-flex min-w-0 items-center gap-1.5 font-label-sm font-semibold text-secondary">
          <AppIcon name="groups" size="sm" className="text-secondary" />
          <span className="truncate">{t('live.panelBadge')}</span>
        </p>
        <p className="shrink-0 font-label-sm text-on-surface-variant">{aiStatusLabel}</p>
      </div>

      <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
        {panelSeats.map((seat, index) => {
          const active = index === activeSeatIndex;
          const speakingHere = active && aiSpeaking;
          return (
            <div
              key={seat.title || index}
              className={cn(
                'flex flex-col items-center rounded-2xl border px-2 py-3 text-center transition-all duration-200 sm:py-4',
                active
                  ? 'border-secondary bg-secondary/10 shadow-[0_0_0_3px_rgba(0,88,190,0.12)]'
                  : 'border-outline-variant/40 bg-surface-container-low/50'
              )}
            >
              <div
                className={cn(
                  'relative flex h-12 w-12 items-center justify-center rounded-full sm:h-16 sm:w-16',
                  speakingHere
                    ? 'bg-gradient-to-br from-secondary to-secondary-container'
                    : 'bg-surface-container-high'
                )}
              >
                {speakingHere ? (
                  <span
                    className="absolute inset-0 animate-ping rounded-full bg-secondary/25"
                    aria-hidden
                  />
                ) : null}
                <AppIcon
                  name="person"
                  size="button"
                  className={speakingHere ? 'relative text-white' : 'text-secondary'}
                />
              </div>
              <p className="mt-2 line-clamp-2 font-label-md font-semibold text-on-surface">
                {seat.title}
              </p>
              <p className="mt-0.5 hidden line-clamp-2 font-label-sm text-on-surface-variant sm:block">
                {seat.focus}
              </p>
              <span
                className={cn(
                  'mt-1.5 rounded-full px-2 py-px font-label-sm',
                  speakingHere
                    ? 'bg-secondary text-on-secondary'
                    : active
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-surface-container-high text-on-surface-variant'
                )}
              >
                {speakingHere
                  ? t('live.statusSpeaking')
                  : active
                    ? aiStatusLabel
                    : t('live.panelQuiet')}
              </span>
            </div>
          );
        })}
      </div>

      {activeSeat ? (
        <p className="relative mt-3 text-center font-body-md text-sm text-on-surface-variant">
          {t('live.nowAsking', {
            title: activeSeat.title,
            focus: activeSeat.focus || '',
          })}
        </p>
      ) : null}
    </div>
  );

  const aiOrbTile = (
    <div className="relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-3xl border border-secondary/15 bg-white p-6 shadow-[0_8px_30px_rgba(0,88,190,0.08)]">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/[0.07] via-transparent to-secondary-container/[0.12]"
        aria-hidden
      />

      <div className="relative flex h-24 w-24 items-center justify-center">
        {aiSpeaking ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-secondary/20" aria-hidden />
        ) : null}
        <div
          className={cn(
            'relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300',
            aiSpeaking
              ? 'bg-gradient-to-br from-secondary to-secondary-container shadow-[0_0_0_10px_rgba(0,88,190,0.14)]'
              : 'bg-gradient-to-br from-surface-container-high to-surface-container-highest'
          )}
        >
          <div className="flex gap-1.5">
            {AI_ORB_DOTS.map((dot) => (
              <span
                key={dot}
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-colors duration-200',
                  aiSpeaking ? 'animate-bounce bg-white' : 'bg-secondary/45'
                )}
                style={{ animationDelay: `${dot * 120}ms` }}
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>

      <p className="relative mt-5 text-base font-semibold text-on-surface">{resolvedAiName}</p>
      {!isPanel && !isLiveSession ? (
        <p className="relative mt-0.5 font-label-sm text-secondary">{t('live.personaStyle')}</p>
      ) : (
        <p className="relative mt-0.5 font-label-sm text-on-surface-variant">{aiStatusLabel}</p>
      )}
    </div>
  );

  const candidateTile = (
    <div className="relative aspect-video overflow-hidden rounded-3xl border border-outline-variant/40 bg-on-surface shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      {isVideoVoice ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn(
              'h-full w-full object-cover [transform:scaleX(-1)] transition-opacity duration-200',
              !cameraOn && 'opacity-0'
            )}
          />

          {(!hasStream || !cameraOn) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-inverse-surface to-on-surface">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary-container text-lg font-bold text-on-secondary shadow-lg">
                {(userName || 'C').charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-inverse-surface via-on-surface to-inverse-surface px-6">
          <div
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary-container text-2xl font-bold text-on-secondary shadow-lg transition-transform duration-300',
              userSpeaking && 'scale-105 shadow-[0_0_0_8px_rgba(0,88,190,0.2)]'
            )}
          >
            {(userName || 'C').charAt(0).toUpperCase()}
          </div>
          <VoiceWaveform active={userSpeaking && micOn} />
          <p className="font-label-sm text-white/70">{t('live.voiceOnlyMode')}</p>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        aria-hidden
      />

      {userSpeaking ? (
        <span className="absolute right-3 top-3 flex h-3 w-3" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary" />
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
          <p className="font-label-sm text-white/75">
            {isVoiceOnly
              ? t('live.micOn')
              : cameraOn
                ? t('live.cameraOn')
                : t('live.cameraOff')}
          </p>
          {isVideoVoice && videoOverlay ? (
            <div className="mt-1 pointer-events-none">{videoOverlay}</div>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onToggleMic}
            aria-label={micOn ? t('live.muteMic') : t('live.unmuteMic')}
            className={cn(
              'flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full backdrop-blur transition-colors',
              micOn
                ? 'bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25'
                : 'bg-error text-on-error'
            )}
          >
            <AppIcon name={micOn ? 'mic' : 'mic_off'} size="button" />
          </button>
          {isVideoVoice ? (
            <button
              type="button"
              onClick={onToggleCamera}
              aria-label={cameraOn ? t('live.turnOffCamera') : t('live.turnOnCamera')}
              className={cn(
                'flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full backdrop-blur transition-colors',
                cameraOn
                  ? 'bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25'
                  : 'bg-error text-on-error'
              )}
            >
              <AppIcon name={cameraOn ? 'videocam' : 'videocam_off'} size="button" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  const stageTiles = isPanel ? (
    <div dir="ltr" className="space-y-3">
      {panelStage}
      <div className="mx-auto w-full max-w-[20rem] sm:max-w-[24rem]">{candidateTile}</div>
    </div>
  ) : (
    <div dir="ltr" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {aiOrbTile}
      {candidateTile}
    </div>
  );

  const transcriptBody = (
    <>
      {!hasTranscriptContent ? (
        <p className="py-8 text-center font-body-md text-sm text-on-surface-variant">
          {isConnecting
            ? t('live.transcriptConnecting')
            : t('live.transcriptEmptyHint')}
        </p>
      ) : null}

      {transcript.map((turn, index) => {
        const isAi = turn.speaker === 'ai';
        const isLast = index === transcript.length - 1;
        const isLiveTurn = isActive && activeSpeaker === turn.speaker && turn.id === lastTurnId;
        const previewInside =
          isLast &&
          livePreview?.speaker === turn.speaker &&
          livePreview?.text &&
          livePreview.text !== turn.text;
        const seatIdx =
          isAi && isPanel ? Math.max(0, matchActivePanelSeatIndex(panelSeats, turn.text)) : -1;
        const seatTag =
          seatIdx >= 0 ? shortSeatTag(panelSeats[seatIdx]?.title) : null;
        const badgeName = isAi
          ? seatTag
            ? t('live.seatTag', { tag: seatTag })
            : resolvedAiName
          : userName;

        return (
          <div key={turn.id} className={cn('flex flex-col', isAi ? 'items-start' : 'items-end')}>
            <SpeakerBadge name={badgeName} active={isLiveTurn} />
            <p
              className={cn(
                'mt-1.5 max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-shadow duration-200',
                isAi
                  ? 'rounded-tl-sm bg-gradient-to-br from-secondary/[0.08] to-secondary-container/[0.06] text-on-surface'
                  : 'rounded-tr-sm bg-surface-container-low text-on-surface',
                isLiveTurn && 'ring-1 ring-secondary/30'
              )}
            >
              {stripPanelSeatTag(turn.text)}
              {previewInside ? (
                <span className="italic text-on-surface-variant/80">
                  {turn.text ? ' ' : ''}
                  {stripPanelSeatTag(livePreview.text)}
                </span>
              ) : null}
            </p>
          </div>
        );
      })}

      {previewNeedsOwnBubble ? (
        <div
          className={cn(
            'flex flex-col',
            livePreview.speaker === 'ai' ? 'items-start' : 'items-end'
          )}
        >
          <SpeakerBadge
            name={livePreview.speaker === 'ai' ? resolvedAiName : userName}
            active
          />
          <p
            className={cn(
              'mt-1.5 max-w-[85%] rounded-2xl px-4 py-2.5 text-sm italic leading-relaxed text-on-surface-variant/80 shadow-sm',
              livePreview.speaker === 'ai'
                ? 'rounded-tl-sm bg-gradient-to-br from-secondary/[0.08] to-secondary-container/[0.06]'
                : 'rounded-tr-sm bg-surface-container-low'
            )}
          >
            {livePreview.speaker === 'ai'
              ? stripPanelSeatTag(livePreview.text)
              : livePreview.text}
          </p>
        </div>
      ) : null}

      <div ref={transcriptEndRef} />
    </>
  );

  return (
    <div
      className={cn(
        'w-full',
        isLiveSession
          ? 'relative flex min-h-0 flex-1 flex-col gap-3 lg:h-full lg:max-h-[calc(100dvh-10rem)] lg:overflow-hidden'
          : 'flex flex-col gap-4 pb-8'
      )}
    >
      {isSubmitting ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
          <h2 className="font-headline-section text-xl font-semibold text-on-surface">
            {t('live.wrappingUpTitle')}
          </h2>
          <p className="max-w-sm font-body-md text-sm text-on-surface-variant">
            {t('live.wrappingUpDescription')}
          </p>
        </div>
      ) : (
        <>
      {isConnecting ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/85 px-4 backdrop-blur-sm">
          <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
          <p className="font-label-md font-semibold text-on-surface">{t('live.connectingTitle')}</p>
          <p className="font-body-md text-sm text-on-surface-variant">
            {t('live.connectingDescription')}
          </p>
        </div>
      ) : null}

      {isLiveSession ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/50 bg-white px-3 py-2.5 sm:px-4">
          <p className="min-w-0 truncate font-label-md text-on-surface">
            {liveMetaParts.join(' · ') || t('live.title')}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {countdownDisplay ? (
              <InterviewCountdownBadge
                display={countdownDisplay}
                urgency={countdownUrgency}
                label={t('live.timeLeft')}
              />
            ) : null}
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-label-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t('live.liveBadge')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 font-label-sm font-semibold text-on-surface-variant">
                {t('live.statusConnecting')}
              </span>
            )}
            {isActive ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmEndOpen(true)}
                className="hidden gap-1.5 rounded-full px-4 py-2 text-sm lg:inline-flex"
              >
                {t('live.endInterview')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <header className="space-y-1 text-center">
          <p className="font-label-md font-semibold text-on-surface">
            {idleMetaParts.join(' · ') || t('live.title')}
          </p>
          <p className="mx-auto max-w-md font-body-md text-sm text-on-surface-variant">
            {isVoiceOnly ? t('live.idleSubtitleVoice') : t('live.idleSubtitleVideo')}
          </p>
          <p className="mx-auto max-w-md font-label-sm text-on-surface-variant/80">
            {t('live.trustLine')}
          </p>
        </header>
      )}

      {isActive && (videoMetricsOn || voiceMetricsOn) ? (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          {isVideoVoice ? (
            <MetricPill active={videoMetricsOn} labelOn={t('live.videoMetricsOn')} />
          ) : null}
          <MetricPill active={voiceMetricsOn} labelOn={t('live.voiceMetricsOn')} />
        </div>
      ) : null}

      {displayError ? (
        <div
          role="alert"
          className="shrink-0 rounded-xl border border-error/30 bg-error-container/80 px-4 py-3 text-center font-body-md text-sm text-on-error-container"
        >
          {displayError}
        </div>
      ) : null}

      {notice ? <div className="shrink-0">{notice}</div> : null}

      {/* Keep stageTiles in one tree slot so <video> does not remount idle→live. */}
      <div
        className={cn(
          'grid min-h-0 grid-cols-1 gap-4',
          isLiveSession
            ? 'flex-1 overflow-y-auto lg:grid-cols-12 lg:overflow-hidden'
            : 'shrink-0'
        )}
      >
        <div
          className={cn(
            'flex min-h-0 flex-col gap-3',
            isLiveSession
              ? 'lg:col-span-8 lg:overflow-hidden'
              : 'mx-auto w-full max-w-5xl [&_[class*="aspect-video"]]:max-h-[min(280px,36vh)]'
          )}
        >
          <div className="shrink-0">{stageTiles}</div>

          {isLiveSession && isActive ? (
            <div className="flex justify-center pt-1 lg:hidden">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmEndOpen(true)}
                className="gap-2 rounded-full px-7 py-3.5"
              >
                {t('live.endInterview')}
              </Button>
            </div>
          ) : null}
        </div>

        {isLiveSession ? (
          <aside className="relative flex min-h-[16rem] flex-col overflow-hidden rounded-3xl border border-outline-variant/40 bg-white/80 shadow-sm backdrop-blur lg:col-span-4 lg:min-h-0">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-outline-variant/40 px-5 py-3">
              <p className="font-label-sm text-on-surface-variant">{t('live.transcriptTitle')}</p>
              {transcript.length > 0 ? (
                <p className="font-label-sm text-on-surface-variant">
                  {transcript.length}{' '}
                  {transcript.length === 1 ? t('live.message') : t('live.messages')}
                </p>
              ) : null}
            </div>

            <div
              ref={transcriptScrollRef}
              onScroll={handleTranscriptScroll}
              className="hide-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4"
              aria-live="polite"
              aria-relevant="additions"
              aria-label={t('live.transcriptTitle')}
            >
              {transcriptBody}
            </div>

            {showJumpLatest ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => scrollTranscriptToEnd('smooth')}
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 font-label-sm font-semibold text-on-secondary shadow-md"
                >
                  <AppIcon name="arrow_downward" size="sm" className="text-on-secondary" />
                  {t('live.jumpToLatest')}
                </button>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>

      {!isLiveSession ? (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm',
                micReady
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-surface-container-high text-on-surface-variant'
              )}
            >
              <AppIcon name={micReady ? 'check_circle' : 'mic'} size="sm" />
              {micReady ? t('live.deviceMicReady') : t('live.deviceMicWaiting')}
            </span>
            {!isVoiceOnly ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm',
                  cameraReady
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-surface-container-high text-on-surface-variant'
                )}
              >
                <AppIcon name={cameraReady ? 'check_circle' : 'videocam'} size="sm" />
                {cameraReady ? t('live.deviceCameraReady') : t('live.deviceCameraWaiting')}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-3 px-2 pb-2">
            <Button
              type="button"
              variant="primary"
              onClick={onStart}
              disabled={startDisabled}
              className="group gap-2 rounded-full px-8 py-3.5 shadow-md disabled:shadow-none"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
              {resolvedStartLabel}
            </Button>

            <div className="w-full max-w-md">
              <button
                type="button"
                onClick={() => setTipsOpen((open) => !open)}
                aria-expanded={tipsOpen}
                className="mx-auto flex items-center gap-1.5 font-label-sm text-on-surface-variant hover:text-secondary"
              >
                <AppIcon name="lightbulb" size="sm" />
                {tipsOpen ? t('live.tips.hide') : t('live.tips.showIdle')}
              </button>
              {tipsOpen ? (
                <ul className="mt-2 list-disc space-y-1 rounded-xl border border-outline-variant/50 bg-white px-5 py-3 ps-8 font-body-md text-sm text-on-surface-variant">
                  <li>{t('live.tips.mic')}</li>
                  {isVideoVoice ? <li>{t('live.tips.camera')}</li> : null}
                  <li>{t('live.tips.quiet')}</li>
                  <li>{t('live.tips.speak')}</li>
                </ul>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <SettingsConfirmDialog
        open={confirmEndOpen}
        title={t('live.endConfirmTitle')}
        description={t('live.endConfirmDescription')}
        confirmLabel={t('live.endInterview')}
        cancelLabel={t('live.endConfirmCancel')}
        variant="destructive"
        onConfirm={handleConfirmEnd}
        onCancel={() => setConfirmEndOpen(false)}
      />
        </>
      )}
    </div>
  );
}

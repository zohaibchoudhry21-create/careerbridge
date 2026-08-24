import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../../components/icons/AppIcon';
import Button from '../../../../components/ui/Button';
import SettingsConfirmDialog from '../../../../components/settings/SettingsConfirmDialog';
import { cn } from '../../../../lib/utils';
import { toDisplayErrorMessage } from '../../lib/vapi.sdk';
import InterviewCountdownBadge from '../InterviewCountdownBadge';
import PanelLobby from './PanelLobby';
import PanelEnterTransition from './PanelEnterTransition';
import PanelBoardroomStage from './PanelBoardroomStage';
import PanelLeaveInterstitial from './PanelLeaveInterstitial';
import { matchActivePanelSeatIndex, matchActivePanelSeatIndexSticky, predictNextPanelSeatIndex, stripPanelSeatTag } from '../../utils/panelSeatMatch';
import {
  formatSeatLabel,
  seatDisplayName,
  seatTitle,
} from '../../utils/panelSeatDisplay';
import { loadInterviewSetupPrefs, saveInterviewSetupPrefs } from '../../utils/interviewSetupPrefs';

const WAVE_BARS = [0, 1, 2, 3, 4, 5];
const LEAVE_HOLD_MS = 1400;

const SEAT_NAME_COLORS = ['text-secondary', 'text-emerald-700', 'text-amber-700'];

function VoiceWaveform({ active }) {
  return (
    <div className="flex h-12 items-end justify-center gap-1.5" aria-hidden>
      {WAVE_BARS.map((bar) => (
        <span
          key={bar}
          className={cn(
            'w-1.5 rounded-full transition-all duration-200',
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
 * Full panel conference-room flow: lobby → enter → boardroom → leave.
 * Live layout mirrors a Zoom-style room (3 panelists + candidate + transcript sidebar)
 * using the product light color scheme — not the dark mock palette.
 */
export default function PanelRoomSession({
  userName,
  status = 'idle',
  activeSpeaker = null,
  transcript = [],
  livePreview = null,
  interviewMode = 'video_voice',
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
  const leaveTimerRef = useRef(null);

  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const lastActiveSeatRef = useRef(0);
  const [roomSoundEnabled, setRoomSoundEnabled] = useState(() => {
    const prefs = loadInterviewSetupPrefs('panel');
    return Boolean(prefs?.panelRoomSound);
  });

  const isVoiceOnly = interviewMode === 'voice_only';
  const isVideoVoice = !isVoiceOnly;
  const isActive = status === 'active';
  const isConnecting = status === 'connecting';
  const isEnded = status === 'ended';
  const isLiveSession = isActive || isConnecting;
  const aiSpeaking = activeSpeaker === 'ai';
  const userSpeaking = activeSpeaker === 'user' && isActive;

  const displayError = errorMessage
    ? toDisplayErrorMessage(errorMessage, t('live.genericError'))
    : null;

  const lastTurnId = transcript.length ? transcript[transcript.length - 1].id : null;
  const lastSpeaker = transcript.length ? transcript[transcript.length - 1].speaker : null;
  const previewNeedsOwnBubble =
    Boolean(livePreview?.text) && livePreview.speaker !== lastSpeaker;
  const hasTranscriptContent = transcript.length > 0 || Boolean(livePreview?.text);

  const lastAssistantText = useMemo(() => {
    if (livePreview?.speaker === 'ai' && livePreview?.text) return livePreview.text;
    for (let i = transcript.length - 1; i >= 0; i -= 1) {
      if (transcript[i]?.speaker === 'ai') return transcript[i].text || '';
    }
    return '';
  }, [transcript, livePreview]);

  const matchedSeatIndex = useMemo(
    () => matchActivePanelSeatIndex(panelSeats, lastAssistantText),
    [panelSeats, lastAssistantText]
  );

  const activeSeatIndex = useMemo(() => {
    if (matchedSeatIndex >= 0) return matchedSeatIndex;
    const fallback = lastActiveSeatRef.current;
    return fallback >= 0 && fallback < panelSeats.length ? fallback : 0;
  }, [matchedSeatIndex, panelSeats.length]);

  useEffect(() => {
    if (matchedSeatIndex >= 0) {
      lastActiveSeatRef.current = matchedSeatIndex;
    }
  }, [matchedSeatIndex]);

  const nextSeatIndex = useMemo(
    () => predictNextPanelSeatIndex(panelSeats, activeSeatIndex),
    [panelSeats, activeSeatIndex]
  );

  const aiTurnActive = aiSpeaking || livePreview?.speaker === 'ai';
  const showUpNext =
    isActive && !aiTurnActive && userSpeaking && panelSeats.length > 0;

  const formatSeatLabelForBanner = (seat) => {
    if (!seat) return null;
    const name = seatDisplayName(seat);
    const title = seatTitle(seat);
    if (name && title) return { name, title };
    if (name) return { name, title: '' };
    return null;
  };

  const handleRoomSoundChange = (next) => {
    setRoomSoundEnabled(next);
    const prefs = loadInterviewSetupPrefs('panel') || {};
    saveInterviewSetupPrefs({ ...prefs, panelRoomSound: next }, 'panel');
  };

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

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleConfirmLeave = () => {
    setConfirmEndOpen(false);
    setLeaving(true);
    leaveTimerRef.current = setTimeout(() => {
      onEnd?.();
    }, LEAVE_HOLD_MS);
  };

  if (leaving || isEnded || isSubmitting) {
    return <PanelLeaveInterstitial />;
  }

  if (status === 'idle') {
    return (
      <PanelLobby
        panelSeats={panelSeats}
        roleLabel={roleLabel}
        durationMinutes={durationMinutes}
        interviewMode={interviewMode}
        userName={userName}
        videoRef={videoRef}
        cameraOn={cameraOn}
        micOn={micOn}
        hasStream={hasStream}
        isVoiceOnly={isVoiceOnly}
        roomSoundEnabled={roomSoundEnabled}
        onRoomSoundChange={handleRoomSoundChange}
        startDisabled={startDisabled}
        startLabel={startLabel}
        onEnter={onStart}
        errorMessage={displayError}
      />
    );
  }

  const resolveAiLabel = (text) => {
    const idx = matchActivePanelSeatIndexSticky(panelSeats, text, lastActiveSeatRef.current);
    const seat = panelSeats[idx];
    if (!seat) return t('live.panelName');
    const name = seatDisplayName(seat);
    const title = seatTitle(seat);
    return name && title ? `${name} (${title})` : formatSeatLabel(seat);
  };

  const transcriptBody = (
    <>
      {!hasTranscriptContent ? (
        <p className="py-8 text-center font-body-md text-sm text-on-surface-variant">
          {isConnecting ? t('live.transcriptConnecting') : t('live.transcriptEmpty')}
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
        const seatIdx = isAi
          ? matchActivePanelSeatIndexSticky(panelSeats, turn.text, lastActiveSeatRef.current)
          : -1;
        const nameColor =
          isAi && seatIdx >= 0
            ? SEAT_NAME_COLORS[seatIdx % SEAT_NAME_COLORS.length]
            : isAi
              ? 'text-secondary'
              : 'text-emerald-700';
        const label = isAi ? resolveAiLabel(turn.text) : `${userName} (${t('panelRoom.live.you')})`;

        return (
          <div
            key={turn.id}
            className={cn(
              'rounded-xl border border-outline-variant/40 bg-surface-container-low/80 p-3',
              isLiveTurn && 'ring-1 ring-secondary/30'
            )}
          >
            <span className={cn('mb-1 block font-label-sm font-bold', nameColor)}>{label}</span>
            <p className="font-body-md text-sm leading-relaxed text-on-surface">
              {isAi ? stripPanelSeatTag(turn.text) : turn.text}
              {previewInside ? (
                <span className="italic text-on-surface-variant/80">
                  {turn.text ? ' ' : ''}
                  {livePreview.speaker === 'ai'
                    ? stripPanelSeatTag(livePreview.text)
                    : livePreview.text}
                </span>
              ) : null}
            </p>
          </div>
        );
      })}

      {previewNeedsOwnBubble ? (
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/80 p-3">
          <span
            className={cn(
              'mb-1 block font-label-sm font-bold',
              livePreview.speaker === 'ai' ? 'text-secondary' : 'text-emerald-700'
            )}
          >
            {livePreview.speaker === 'ai'
              ? resolveAiLabel(livePreview.text)
              : `${userName} (${t('panelRoom.live.you')})`}
          </span>
          <p className="font-body-md text-sm italic text-on-surface-variant/80">
            {livePreview.speaker === 'ai'
              ? stripPanelSeatTag(livePreview.text)
              : livePreview.text}
          </p>
        </div>
      ) : null}
      <div ref={transcriptEndRef} />
    </>
  );

  const roomTitle = roleLabel
    ? t('panelRoom.live.roomTitleWithRole', { role: roleLabel })
    : t('panelRoom.live.conferenceRoom');

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-low lg:h-full lg:max-h-[calc(100dvh-10rem)]">
      <PanelEnterTransition
        panelSeats={panelSeats}
        roomSoundEnabled={roomSoundEnabled}
        visible={isConnecting}
      />

      {/* Top bar — ConferenceRoom header, brand colors */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-outline-variant/60 bg-white px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-label-sm font-semibold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              {t('panelRoom.live.inSession')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm font-semibold text-on-surface-variant">
              {t('panelRoom.enter.openingDoor')}
            </span>
          )}
          <h1 className="truncate font-label-md font-medium text-on-surface">{roomTitle}</h1>
          {difficulty ? (
            <span className="hidden font-label-sm text-on-surface-variant sm:inline">
              · {t(`difficulty.${difficulty}`, { defaultValue: difficulty })}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {countdownDisplay ? (
            <InterviewCountdownBadge
              display={countdownDisplay}
              urgency={countdownUrgency}
              label={t('live.timeLeft')}
            />
          ) : durationMinutes != null ? (
            <span className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-1 font-mono text-sm text-on-surface-variant">
              {t('live.minutesShort', { count: durationMinutes })}
            </span>
          ) : null}
          {isActive ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmEndOpen(true)}
              className="gap-1.5 rounded-lg px-3 py-1.5 text-sm"
            >
              <AppIcon name="call_end" size="sm" className="text-inherit" />
              {t('panelRoom.leave.cta')}
            </Button>
          ) : null}
        </div>
      </header>

      {displayError ? (
        <div
          role="alert"
          className="shrink-0 border-b border-error/20 bg-error-container/80 px-4 py-2 text-center font-body-md text-sm text-on-error-container"
        >
          {displayError}
        </div>
      ) : null}
      {notice ? <div className="shrink-0 px-4 pt-2">{notice}</div> : null}

      {/* Main grid: stage + transcript */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-12 lg:overflow-hidden lg:p-5">
        <div className="flex min-h-0 flex-col items-stretch gap-4 lg:col-span-8 lg:overflow-y-auto lg:overscroll-contain">
          <PanelBoardroomStage
            panelSeats={panelSeats}
            activeSeatIndex={activeSeatIndex}
            nextSeatIndex={nextSeatIndex}
            aiSpeaking={aiTurnActive}
            showNextHint={showUpNext}
            className="h-40 shrink-0 sm:h-48"
          />

          {aiTurnActive ? (
            (() => {
              const seat = panelSeats[activeSeatIndex];
              const labels = formatSeatLabelForBanner(seat);
              if (!labels?.name) return null;
              const colorClass = SEAT_NAME_COLORS[activeSeatIndex % SEAT_NAME_COLORS.length];
              return (
                <div
                  className="rounded-xl border border-secondary/25 bg-secondary/5 px-4 py-3 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <p className={cn('font-headline-section text-base font-semibold sm:text-lg', colorClass)}>
                    {labels.title
                      ? t('panelRoom.live.speakerAsking', {
                        name: labels.name,
                        title: labels.title,
                      })
                      : labels.name}
                  </p>
                </div>
              );
            })()
          ) : null}

          {showUpNext ? (
            (() => {
              const seat = panelSeats[nextSeatIndex];
              const labels = formatSeatLabelForBanner(seat);
              if (!labels?.name) return null;
              return (
                <p className="text-center font-label-sm text-on-surface-variant" role="status">
                  {labels.title
                    ? t('panelRoom.live.upNext', { name: labels.name, title: labels.title })
                    : labels.name}
                </p>
              );
            })()
          ) : null}

          {/* Candidate feed — fixed aspect ratio; don't stretch with flex-1 */}
          <div className="mx-auto w-full max-w-[18rem] shrink-0 sm:max-w-[22rem] lg:max-w-[24rem]">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-outline-variant/50 bg-on-surface shadow-sm">
              <div
                className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90"
                aria-hidden
              />

              {isVideoVoice ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)]',
                      !cameraOn && 'opacity-0'
                    )}
                  />
                  {(!hasStream || !cameraOn) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-inverse-surface to-on-surface">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-high text-2xl font-bold text-on-surface-variant sm:h-24 sm:w-24 sm:text-3xl">
                        {(userName || 'C').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-inverse-surface via-on-surface to-inverse-surface">
                  <div
                    className={cn(
                      'flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary-container text-2xl font-bold text-on-secondary transition-transform sm:h-24 sm:w-24',
                      userSpeaking && 'scale-105'
                    )}
                  >
                    {(userName || 'C').charAt(0).toUpperCase()}
                  </div>
                  <VoiceWaveform active={userSpeaking && micOn} />
                  <p className="font-label-sm text-white/70">{t('live.voiceOnlyMode')}</p>
                </div>
              )}

              <div className="absolute bottom-2 left-2 z-20 flex max-w-[65%] items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 backdrop-blur-md sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    userSpeaking ? 'bg-emerald-400' : 'bg-emerald-500/70'
                  )}
                />
                <span className="truncate text-xs font-medium text-white sm:text-sm">
                  {t('panelRoom.live.candidateLabel', { name: userName || t('panelRoom.live.you') })}
                </span>
              </div>

              <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/70 p-1.5 backdrop-blur-md sm:bottom-3 sm:right-3 sm:gap-2 sm:p-2">
                <button
                  type="button"
                  onClick={onToggleMic}
                  aria-label={micOn ? t('live.muteMic') : t('live.unmuteMic')}
                  className={cn(
                    'rounded-lg p-2 transition sm:p-2.5',
                    micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-error text-on-error'
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
                      'rounded-lg p-2 transition sm:p-2.5',
                      cameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-error text-on-error'
                    )}
                  >
                    <AppIcon name={cameraOn ? 'videocam' : 'videocam_off'} size="button" />
                  </button>
                ) : null}
              </div>

              {isVideoVoice && videoOverlay ? (
                <div className="pointer-events-none absolute left-2 top-2 z-20 max-w-[55%] sm:left-3 sm:top-3 sm:max-w-none">
                  {videoOverlay}
                </div>
              ) : null}

              {isActive && (videoMetricsOn || voiceMetricsOn) ? (
                <div className="absolute right-2 top-2 z-20 flex max-w-[45%] flex-wrap justify-end gap-1 sm:right-3 sm:top-3 sm:max-w-none">
                  {isVideoVoice && videoMetricsOn ? (
                    <span className="rounded-full bg-white/90 px-1.5 py-0.5 font-label-sm text-[10px] text-on-surface sm:px-2 sm:text-xs">
                      {t('live.videoMetricsOn')}
                    </span>
                  ) : null}
                  {voiceMetricsOn ? (
                    <span className="rounded-full bg-white/90 px-1.5 py-0.5 font-label-sm text-[10px] text-on-surface sm:px-2 sm:text-xs">
                      {t('live.voiceMetricsOn')}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Transcript sidebar */}
        <aside className="flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-outline-variant/50 bg-white lg:col-span-4 lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/50 px-4 py-3">
            <div className="inline-flex items-center gap-2 font-label-md font-semibold text-on-surface">
              <AppIcon name="sms" size="sm" className="text-secondary" />
              {t('panelRoom.live.transcriptNotes')}
            </div>
            <AppIcon name="sparkles" size="sm" className="text-amber-500" />
          </div>

          <div
            ref={transcriptScrollRef}
            onScroll={handleTranscriptScroll}
            className="hide-scrollbar relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
            aria-live="polite"
            aria-label={t('live.transcriptTitle')}
          >
            {transcriptBody}
            {showJumpLatest ? (
              <div className="sticky bottom-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => scrollTranscriptToEnd('smooth')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-label-sm font-semibold text-on-secondary shadow-md"
                >
                  <AppIcon name="arrow_downward" size="sm" className="text-on-secondary" />
                  {t('live.jumpToLatest')}
                </button>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-outline-variant/50 bg-surface-container-low px-3 py-2.5 text-center font-label-sm text-on-surface-variant">
            {t('panelRoom.live.transcriptFooter')}
          </div>
        </aside>
      </main>

      {isActive ? (
        <div className="flex justify-center border-t border-outline-variant/40 bg-white p-3 lg:hidden">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmEndOpen(true)}
            className="gap-2 rounded-lg px-6 py-2.5"
          >
            <AppIcon name="call_end" size="sm" className="text-inherit" />
            {t('panelRoom.leave.cta')}
          </Button>
        </div>
      ) : null}

      <SettingsConfirmDialog
        open={confirmEndOpen}
        title={t('panelRoom.leave.confirmTitle')}
        description={t('panelRoom.leave.confirmDescription')}
        confirmLabel={t('panelRoom.leave.cta')}
        cancelLabel={t('live.endConfirmCancel')}
        variant="destructive"
        onConfirm={handleConfirmLeave}
        onCancel={() => setConfirmEndOpen(false)}
      />
    </div>
  );
}

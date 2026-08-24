import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import AppIcon from '../../../../components/icons/AppIcon';
import Button from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import {
  formatSeatLabel,
  seatDisplayName,
  seatInitial,
  seatTitle,
} from '../../utils/panelSeatDisplay';
import { prefersReducedMotion } from '../../utils/panelRoomSound';
import {
  loadPanelSharedVoiceHintDismissed,
  savePanelSharedVoiceHintDismissed,
} from '../../utils/interviewSetupPrefs';

const SEAT_READY_DELAYS_MS = [400, 900, 1400];

function LobbySeatCard({ seat, index, ready }) {
  const { t } = useTranslation('interviewPrep');
  const reduced = prefersReducedMotion();
  const name = seatDisplayName(seat);
  const title = seatTitle(seat);
  const focus = seat?.focus ? String(seat.focus).trim() : '';

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0.45, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduced ? 0 : index * 0.12, duration: 0.35 }}
      className={cn(
        'flex flex-col items-center rounded-2xl border px-3 py-4 text-center transition-all duration-300',
        ready
          ? 'border-secondary/40 bg-white shadow-[0_8px_24px_rgba(0,88,190,0.08)]'
          : 'border-outline-variant/40 bg-white/60'
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full font-label-md font-semibold sm:h-16 sm:w-16',
          ready
            ? 'bg-gradient-to-br from-secondary to-secondary-container text-on-secondary'
            : 'bg-surface-container-high text-on-surface-variant'
        )}
      >
        {seatInitial(seat)}
      </div>
      <p className="mt-2.5 font-label-md font-semibold text-on-surface">
        {name || t('panelRoom.lobby.seatPending')}
      </p>
      <p className="mt-0.5 line-clamp-2 font-label-sm text-on-surface-variant">
        {title}
      </p>
      {focus && name ? (
        <p className="mt-1.5 line-clamp-2 font-body-md text-xs leading-snug text-on-surface-variant/90">
          {t('panelRoom.lobby.seatPreview', { name, focus })}
        </p>
      ) : null}
      <span
        className={cn(
          'mt-2 rounded-full px-2.5 py-0.5 font-label-sm',
          ready
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            : 'bg-surface-container-high text-on-surface-variant'
        )}
      >
        {ready ? t('panelRoom.lobby.seatReady') : t('panelRoom.lobby.seatJoining')}
      </span>
    </motion.div>
  );
}

/**
 * Pre-call conference lobby for panel interviews.
 */
export default function PanelLobby({
  panelSeats = [],
  roleLabel = '',
  durationMinutes = null,
  interviewMode = 'video_voice',
  userName = '',
  videoRef,
  cameraOn = true,
  micOn = true,
  hasStream = false,
  isVoiceOnly = false,
  roomSoundEnabled = false,
  onRoomSoundChange,
  startDisabled = false,
  startLabel,
  onEnter,
  errorMessage = null,
}) {
  const { t } = useTranslation('interviewPrep');
  const seats = Array.isArray(panelSeats) && panelSeats.length ? panelSeats : [{}, {}, {}];
  const [readyFlags, setReadyFlags] = useState(() => seats.map(() => false));
  const [showVoiceHint, setShowVoiceHint] = useState(
    () => !loadPanelSharedVoiceHintDismissed()
  );

  useEffect(() => {
    if (prefersReducedMotion()) {
      setReadyFlags(seats.map(() => true));
      return undefined;
    }
    setReadyFlags(seats.map(() => false));
    const timers = SEAT_READY_DELAYS_MS.map((delay, index) =>
      setTimeout(() => {
        setReadyFlags((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [seats.length, roleLabel]);

  const dismissVoiceHint = () => {
    setShowVoiceHint(false);
    savePanelSharedVoiceHintDismissed(true);
  };

  const allReady = readyFlags.every(Boolean);
  const meta = [
    t('panelRoom.lobby.conferenceRoom'),
    roleLabel || null,
    durationMinutes != null ? t('live.minutesShort', { count: durationMinutes }) : null,
  ].filter(Boolean);

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-visible rounded-3xl border border-outline-variant/40 bg-gradient-to-br from-[#F4F7FB] via-white to-[#E8F0FA] p-4 pb-8 shadow-sm sm:p-6 sm:pb-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0,88,190,0.12) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden
      />

      <div className="relative space-y-5">
        <header className="space-y-1.5 text-center">
          <p className="font-label-sm font-semibold uppercase tracking-wide text-secondary">
            {t('panelRoom.lobby.eyebrow')}
          </p>
          <h1 className="font-headline-section text-xl font-semibold text-on-surface sm:text-2xl">
            {t('panelRoom.lobby.title')}
          </h1>
          <p className="mx-auto max-w-lg font-body-md text-sm text-on-surface-variant">
            {t('panelRoom.lobby.description')}
          </p>
          <p className="font-label-md text-on-surface-variant">{meta.join(' · ')}</p>
        </header>

        {showVoiceHint ? (
          <div
            role="note"
            className="mx-auto flex max-w-2xl flex-col gap-2 rounded-2xl border border-secondary/25 bg-secondary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-body-md text-sm text-on-surface">{t('panelRoom.lobby.sharedVoiceHint')}</p>
            <button
              type="button"
              onClick={dismissVoiceHint}
              className="shrink-0 font-label-md text-secondary hover:underline"
            >
              {t('panelRoom.lobby.sharedVoiceHintDismiss')}
            </button>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-center font-label-sm text-on-surface-variant">
            {allReady
              ? t('panelRoom.lobby.panelReady')
              : t('panelRoom.lobby.panelAssembling')}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {seats.map((seat, index) => (
              <LobbySeatCard
                key={formatSeatLabel(seat) || index}
                seat={seat}
                index={index}
                ready={Boolean(readyFlags[index])}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-outline-variant/50 bg-on-surface shadow-sm">
            {!isVoiceOnly ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    'h-full w-full object-cover [transform:scaleX(-1)]',
                    (!hasStream || !cameraOn) && 'opacity-0'
                  )}
                />
                {(!hasStream || !cameraOn) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-inverse-surface to-on-surface">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-on-secondary">
                      {(userName || 'C').charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-inverse-surface to-on-surface">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-on-secondary">
                  {(userName || 'C').charAt(0).toUpperCase()}
                </div>
                <p className="font-label-sm text-white/70">{t('live.voiceOnlyMode')}</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-white">
                {t('panelRoom.lobby.yourSeat', { name: userName || t('panelRoom.lobby.you') })}
              </p>
              <p className="font-label-sm text-white/75">
                {micOn ? t('live.micOn') : t('live.muteMic')}
                {!isVoiceOnly
                  ? ` · ${cameraOn ? t('live.cameraOn') : t('live.cameraOff')}`
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 rounded-2xl border border-outline-variant/40 bg-white/80 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block font-label-md text-on-surface">
                  {t('panelRoom.lobby.soundLabel')}
                </span>
                <span className="block font-body-md text-sm app-muted">
                  {t('panelRoom.lobby.soundHint')}
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={roomSoundEnabled}
                onClick={() => onRoomSoundChange?.(!roomSoundEnabled)}
                className={cn(
                  'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                  roomSoundEnabled ? 'bg-secondary' : 'bg-outline-variant'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                    roomSoundEnabled && 'translate-x-5'
                  )}
                />
              </button>
            </label>

            <div className="flex items-center gap-2 font-label-sm text-on-surface-variant">
              <AppIcon
                name={hasStream ? 'check_circle' : 'devices'}
                size="sm"
                className={hasStream ? 'text-emerald-600' : 'text-on-surface-variant'}
              />
              {hasStream
                ? t('panelRoom.lobby.devicesReady')
                : t('panelRoom.lobby.devicesWaiting')}
            </div>

            {errorMessage ? (
              <p role="alert" className="font-label-sm text-error">
                {errorMessage}
              </p>
            ) : null}

            <Button
              type="button"
              variant="gradient"
              onClick={onEnter}
              disabled={startDisabled}
              className="relative z-10 w-full gap-2 !rounded-xl !py-2.5 shadow-md"
            >
              <AppIcon name="groups" size="sm" className="text-white" />
              {startLabel || t('panelRoom.lobby.enter')}
            </Button>

            <Link
              to="/interview-prep/panel"
              className="text-center font-label-sm text-secondary hover:underline"
            >
              {t('panelRoom.lobby.backToSetup')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

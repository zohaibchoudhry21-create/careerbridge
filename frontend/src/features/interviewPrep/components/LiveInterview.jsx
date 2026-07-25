import { useEffect, useRef } from 'react';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';
import Button from '../../../components/ui/Button';
import { toDisplayErrorMessage } from '../lib/vapi.sdk';
import { DEFAULT_INTERVIEW_SETUP_MODE } from '../constants/interviewPrepConstants';

const AI_ORB_DOTS = [0, 1, 2];
const WAVE_BARS = [0, 1, 2, 3, 4, 5];

function MetricPill({ active, labelOn, labelPaused }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm transition-all duration-200',
        active
          ? 'bg-tertiary-container text-on-tertiary-container'
          : 'bg-error-container text-on-error-container'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          active ? 'bg-secondary' : 'border border-dashed border-on-error-container bg-transparent'
        )}
        aria-hidden
      />
      {active ? labelOn : labelPaused}
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

function SessionMetaChip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-outline-variant/60 bg-white/80 px-3 py-1 font-label-sm text-on-surface-variant backdrop-blur-sm">
      {children}
    </span>
  );
}

/**
 * Premium live-interview shell. Vapi/Groq wiring stays in LiveInterviewAgent.
 */
export default function LiveInterview({
  userName,
  aiName = 'AI Interviewer',
  status = 'idle',
  activeSpeaker = null,
  transcript = [],
  interviewMode = DEFAULT_INTERVIEW_SETUP_MODE,
  roleLabel = '',
  difficulty = '',
  durationMinutes = null,
  videoMetricsOn = false,
  voiceMetricsOn = false,
  cameraOn = true,
  micOn = true,
  hasStream = false,
  notice = null,
  errorMessage = null,
  startDisabled = false,
  startLabel = 'Start interview',
  onStart,
  onEnd,
  onToggleMic,
  onToggleCamera,
  videoRef,
  videoOverlay = null,
}) {
  const transcriptEndRef = useRef(null);
  const isVoiceOnly = interviewMode === 'voice_only';
  const isVideoVoice = !isVoiceOnly;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [transcript.length]);

  const isActive = status === 'active';
  const aiSpeaking = activeSpeaker === 'ai';
  const userSpeaking = activeSpeaker === 'user' && isActive;
  const lastTurnId = transcript.length ? transcript[transcript.length - 1].id : null;
  const displayError = errorMessage
    ? toDisplayErrorMessage(errorMessage, 'Something went wrong.')
    : null;

  let aiStatusLabel = 'Ready';
  if (status === 'connecting') aiStatusLabel = 'Connecting…';
  else if (isActive) aiStatusLabel = aiSpeaking ? 'Speaking' : 'Listening';
  else if (status === 'ended') aiStatusLabel = 'Call ended';

  const difficultyLabel = difficulty
    ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    : null;

  const subtitle = isVoiceOnly
    ? `Speak with ${aiName.toLowerCase()} in real time. Microphone stays on for feedback.`
    : `Speak with ${aiName.toLowerCase()} in real time. Camera and mic stay on for feedback.`;

  return (
    <div className="w-full space-y-md">
      {isActive ? (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-label-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
      ) : null}

      <header className="space-y-2 text-center">
        <h1 className="bg-gradient-to-r from-on-surface to-secondary bg-clip-text font-headline-dashboard text-headline-dashboard text-transparent">
          Live interview
        </h1>
        <p className="mx-auto max-w-md font-body-md text-sm text-on-surface-variant">{subtitle}</p>
      </header>

      {(roleLabel || difficultyLabel || durationMinutes) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {roleLabel ? <SessionMetaChip>{roleLabel}</SessionMetaChip> : null}
          {difficultyLabel ? <SessionMetaChip>{difficultyLabel}</SessionMetaChip> : null}
          {durationMinutes ? <SessionMetaChip>{durationMinutes} min</SessionMetaChip> : null}
          <SessionMetaChip>{isVoiceOnly ? 'Voice only' : 'Video and voice'}</SessionMetaChip>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {isVideoVoice ? (
          <MetricPill
            active={videoMetricsOn}
            labelOn="Video metrics on"
            labelPaused="Video metrics paused"
          />
        ) : null}
        <MetricPill
          active={voiceMetricsOn}
          labelOn="Voice metrics on"
          labelPaused="Voice metrics paused"
        />
      </div>

      {notice}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* AI interviewer — left */}
        <div className="relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-3xl border border-secondary/15 bg-white p-6 shadow-[0_8px_30px_rgba(0,88,190,0.08)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/[0.07] via-transparent to-secondary-container/[0.12]"
            aria-hidden
          />

          <div className="relative flex h-24 w-24 items-center justify-center">
            {aiSpeaking ? (
              <span
                className="absolute inset-0 animate-ping rounded-full bg-secondary/20"
                aria-hidden
              />
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

          <p className="relative mt-5 text-base font-semibold text-on-surface">{aiName}</p>
          <p className="relative mt-0.5 font-label-sm text-on-surface-variant">{aiStatusLabel}</p>
        </div>

        {/* Candidate — right */}
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
              <p className="font-label-sm text-white/70">Voice only mode</p>
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
                {isVoiceOnly ? 'Microphone on' : cameraOn ? 'Camera on' : 'Camera off'}
              </p>
              {isVideoVoice && videoOverlay ? (
                <div className="mt-1 pointer-events-none">{videoOverlay}</div>
              ) : null}
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={onToggleMic}
                aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                className={cn(
                  'flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full backdrop-blur transition-colors',
                  micOn ? 'bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25' : 'bg-error text-on-error'
                )}
              >
                <AppIcon name={micOn ? 'mic' : 'mic_off'} size="button" />
              </button>
              {isVideoVoice ? (
                <button
                  type="button"
                  onClick={onToggleCamera}
                  aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
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
      </div>

      {transcript.length > 0 ? (
        <div className="max-h-72 space-y-4 overflow-y-auto rounded-3xl border border-outline-variant/40 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="font-label-sm text-on-surface-variant">Live transcript</p>
            <p className="font-label-sm text-on-surface-variant">
              {transcript.length} {transcript.length === 1 ? 'turn' : 'turns'}
            </p>
          </div>

          {transcript.map((turn) => {
            const isAi = turn.speaker === 'ai';
            const isLiveTurn = isActive && activeSpeaker === turn.speaker && turn.id === lastTurnId;

            return (
              <div key={turn.id} className={cn('flex flex-col', isAi ? 'items-start' : 'items-end')}>
                <SpeakerBadge name={isAi ? aiName : userName} active={isLiveTurn} />
                <p
                  className={cn(
                    'mt-1.5 max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-shadow duration-200',
                    isAi
                      ? 'rounded-tl-sm bg-gradient-to-br from-secondary/[0.08] to-secondary-container/[0.06] text-on-surface'
                      : 'rounded-tr-sm bg-surface-container-low text-on-surface',
                    isLiveTurn && 'ring-1 ring-secondary/30'
                  )}
                >
                  {turn.text}
                </p>
              </div>
            );
          })}
          <div ref={transcriptEndRef} />
        </div>
      ) : null}

      {displayError ? (
        <p className="text-center font-body-md text-error max-w-xl mx-auto">{displayError}</p>
      ) : null}

      <div className="flex justify-center pt-2">
        {isActive ? (
          <Button
            type="button"
            variant="destructive"
            onClick={onEnd}
            className="gap-2 rounded-full px-7 py-3.5"
          >
            End interview
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={onStart}
            disabled={startDisabled}
            className="group gap-2 rounded-full px-7 py-3.5 disabled:shadow-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            {startLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { cn } from '../../../lib/utils';
import interviewerAura from '../lottie/interviewer-aura.json';

const STATE_LABELS = {
  idle: 'Ready',
  speaking: 'Speaking',
  listening: 'Listening',
  thinking: 'Thinking',
};

const STATE_SPEED = {
  idle: 0.85,
  speaking: 1.65,
  listening: 0.55,
  thinking: 1.35,
};

function RobotFace({ state, mouthPulse, presenceLevel = 0.5, hideLabel = false, tile = false }) {
  const listening = state === 'listening';
  const speaking = state === 'speaking';
  const thinking = state === 'thinking';

  const listenMotion =
    listening &&
    (presenceLevel >= 0.65
      ? 'animate-[avatar-listen_2s_ease-in-out_infinite]'
      : 'animate-[avatar-listen_2.8s_ease-in-out_infinite]');

  return (
    <div
      className={cn(
        'relative z-10 flex flex-col items-center justify-center',
        listenMotion,
        thinking && 'animate-pulse'
      )}
    >
      <div
        className={cn(
          'relative rounded-3xl border-2 shadow-lg flex flex-col items-center justify-center transition-transform duration-500',
          tile
            ? 'w-full h-full rounded-full bg-transparent border-0 shadow-none gap-1'
            : 'bg-primary-container w-28 h-28 sm:w-32 sm:h-32 gap-3',
          !tile && listening && presenceLevel >= 0.5
            ? 'border-secondary/60'
            : !tile && 'border-secondary/40'
        )}
        style={
          listening ? { transform: `scale(${1 + presenceLevel * 0.04})` } : undefined
        }
      >
        <div className={cn('flex gap-4', tile && 'gap-1.5 scale-75')}>
          <span
            className={cn(
              'w-3 h-3 rounded-full bg-secondary transition-opacity duration-300',
              listening && 'animate-[avatar-blink_3.5s_ease-in-out_infinite]',
              listening && presenceLevel < 0.35 && 'opacity-60'
            )}
          />
          <span
            className={cn(
              'w-3 h-3 rounded-full bg-secondary transition-opacity duration-300',
              listening && 'animate-[avatar-blink_3.5s_ease-in-out_infinite] [animation-delay:120ms]',
              listening && presenceLevel < 0.35 && 'opacity-60'
            )}
          />
        </div>

        <div className={cn('flex items-end justify-center gap-1', tile ? 'h-4' : 'h-8')}>
          {[0, 1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className={cn(
                'w-1.5 rounded-full bg-secondary/80 transition-all duration-150',
                speaking ? 'animate-[avatar-mouth_0.45s_ease-in-out_infinite]' : 'h-1.5',
                listening && !speaking && presenceLevel >= 0.45 && 'animate-[avatar-mouth_0.9s_ease-in-out_infinite]'
              )}
              style={
                speaking
                  ? {
                      animationDelay: `${bar * 70}ms`,
                      height: mouthPulse ? `${10 + (bar % 3) * 6}px` : '6px',
                    }
                  : listening
                    ? {
                        animationDelay: `${bar * 90}ms`,
                        height: `${5 + presenceLevel * 10 + (bar % 2) * 2}px`,
                      }
                    : { height: '6px' }
              }
            />
          ))}
        </div>
      </div>
      {!hideLabel ? (
        <p className="mt-3 font-label-sm text-on-surface-variant">{STATE_LABELS[state] || 'Ready'}</p>
      ) : null}
    </div>
  );
}

/** Legacy 2D avatar — used as fallback in step 4; still available via use3DAvatar={false}. */
export default function InterviewerAvatar2DFallback({
  state = 'idle',
  presenceLevel = 0.5,
  compact = false,
  hideStatusLabel = false,
  tile = false,
}) {
  const [mouthPulse, setMouthPulse] = useState(false);

  const clampedPresence = Math.min(1, Math.max(0, Number(presenceLevel) || 0));
  const auraSpeed =
    state === 'listening'
      ? STATE_SPEED.listening + clampedPresence * 0.35
      : STATE_SPEED[state] ?? STATE_SPEED.idle;

  useEffect(() => {
    if (state !== 'speaking') {
      setMouthPulse(false);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setMouthPulse((v) => !v);
    }, 180);

    return () => window.clearInterval(interval);
  }, [state]);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center mx-auto',
        tile
          ? 'w-[72px] h-[72px]'
          : compact
            ? 'w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]'
            : 'w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]'
      )}
    >
      {!tile ? (
        <Lottie
          animationData={interviewerAura}
          loop
          speed={auraSpeed}
          className="absolute inset-0 w-full h-full pointer-events-none"
          rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
        />
      ) : null}
      <RobotFace
        state={state}
        mouthPulse={mouthPulse}
        presenceLevel={clampedPresence}
        hideLabel={hideStatusLabel}
        tile={tile}
      />
    </div>
  );
}

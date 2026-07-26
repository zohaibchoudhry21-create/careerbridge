import React, { lazy, Suspense, useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';
import AppIcon from '../../../components/icons/AppIcon';
import InterviewerAvatar2DFallback from './InterviewerAvatar2DFallback';
import { isWebGLAvailable, shouldPrefer2DAvatar } from '../utils/webglSupport';

const InterviewerAvatar3DScene = lazy(() => import('./InterviewerAvatar3DScene'));

const STATE_LABELS = {
  idle: 'Ready',
  speaking: 'Speaking',
  listening: 'Listening',
  thinking: 'Thinking',
};

function CanvasFallback({ compact }) {
  return (
    <div
      className={cn(
        'w-full flex items-center justify-center rounded-xl bg-surface-container-low',
        compact ? 'h-[240px]' : 'h-[280px]'
      )}
    >
      <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
    </div>
  );
}

class Avatar3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function AIInterviewerAvatar({
  state = 'idle',
  presenceLevel = 0.5,
  mouthOpenLevel = 0,
  compact = false,
  use3DAvatar = true,
  prefer3D,
  embedded = false,
  hideStatusLabel = false,
  tile = false,
}) {
  const clampedPresence = Math.min(1, Math.max(0, Number(presenceLevel) || 0));
  const [webglOk, setWebglOk] = useState(null);

  useEffect(() => {
    setWebglOk(isWebGLAvailable());
  }, []);

  const want3D =
    use3DAvatar &&
    !tile &&
    (prefer3D === true || (prefer3D !== false && webglOk && !shouldPrefer2DAvatar()));

  const twoDFallback = (
    <InterviewerAvatar2DFallback
      state={state}
      presenceLevel={clampedPresence}
      compact={compact}
      hideStatusLabel={hideStatusLabel}
      tile={tile}
    />
  );

  const avatarBody = (
    <>
      <div className={cn(tile ? 'w-[72px] h-[72px] flex items-center justify-center' : 'w-full max-w-sm')}>
        {want3D && !tile ? (
          <Avatar3DErrorBoundary fallback={twoDFallback}>
            <Suspense fallback={<CanvasFallback compact={compact} />}>
              <InterviewerAvatar3DScene
                height={compact ? 240 : 280}
                state={state}
                mouthOpenLevel={mouthOpenLevel}
                presenceLevel={clampedPresence}
              />
            </Suspense>
          </Avatar3DErrorBoundary>
        ) : want3D && tile ? (
          twoDFallback
        ) : webglOk === null && use3DAvatar && prefer3D !== false && !tile ? (
          <CanvasFallback compact={compact} />
        ) : (
          twoDFallback
        )}
      </div>

      {!embedded && !hideStatusLabel ? (
        <>
          <p className="font-label-sm text-on-surface-variant mt-3">{STATE_LABELS[state] || 'Ready'}</p>
          <p className="font-label-sm text-on-surface-variant mt-2 text-center max-w-md">
            {state === 'thinking'
              ? 'Preparing your next question…'
              : state === 'speaking'
                ? 'Listen to the question — captions appear below.'
                : state === 'listening'
                  ? clampedPresence >= 0.55
                    ? 'Listening — keep going.'
                    : 'Listening — speak clearly toward the mic and camera.'
                  : 'Start recording when you are ready to answer.'}
          </p>
        </>
      ) : embedded && !hideStatusLabel ? (
        <p className="font-label-sm text-on-surface-variant mt-2">{STATE_LABELS[state] || 'Ready'}</p>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center"
        aria-live="polite"
        aria-label={`AI interviewer is ${STATE_LABELS[state] || 'ready'}`}
      >
        {avatarBody}
      </div>
    );
  }

  return (
    <section
      className={cn(
        'dashboard-glass-card dashboard-card-padding rounded-2xl flex flex-col items-center justify-center w-full',
        compact ? 'min-h-[240px] lg:min-h-[320px]' : 'min-h-[280px] sm:min-h-[320px]'
      )}
      aria-live="polite"
      aria-label={`AI interviewer is ${STATE_LABELS[state] || 'ready'}`}
    >
      {avatarBody}
    </section>
  );
}

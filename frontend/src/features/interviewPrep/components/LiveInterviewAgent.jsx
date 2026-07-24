import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getVapiClient, formatVapiError, getInterviewStartTarget } from '../lib/vapi.sdk';
import { interviewerAssistant } from '../constants/voiceCallAssistant';
import { useLiveAudioMonitor } from '../hooks/useLiveAudioMonitor';
import { useFaceVideoAnalysis } from '../hooks/useFaceVideoAnalysis';
import AIInterviewerAvatar from './AIInterviewerAvatar';
import AppIcon from '../../../components/icons/AppIcon';
import LiveVideoIndicator from './LiveVideoIndicator';
import { cn } from '../../../lib/utils';
import { releaseStreamAudioTracks } from '../utils/mediaPermissionUtils';
import { getInterviewerPersonaPrompt } from '../utils/interviewerPersona';

const CallStatus = {
  INACTIVE: 'INACTIVE',
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
};

function MetricBadge({ active, labelOn, labelPaused }) {
  const isOn = active;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm transition-all duration-200',
        isOn
          ? 'bg-tertiary-container text-on-tertiary-container'
          : 'bg-error-container text-on-error-container'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          isOn ? 'bg-secondary' : 'border border-dashed border-on-error-container bg-transparent'
        )}
        aria-hidden
      />
      {isOn ? labelOn : labelPaused}
    </span>
  );
}

export default function LiveInterviewAgent({
  userName,
  sessionId,
  questions,
  roleLabel,
  difficulty,
  durationMinutes,
  interviewerPersona = 'neutral',
  stream,
  onFinished,
  submitError,
  isSubmitting,
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState([]);
  const [callError, setCallError] = useState(null);
  const [mouthPulse, setMouthPulse] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [videoReady, setVideoReady] = useState(false);

  const messagesRef = useRef([]);
  const finishedNotifiedRef = useRef(false);
  const callStartedAtRef = useRef(null);
  const candidateVideoRef = useRef(null);
  const finalMetricsRef = useRef(null);
  const getAudioSnapshotRef = useRef(() => ({}));
  const getVideoMetricsRef = useRef(() => null);

  const metricsActive = callStatus === CallStatus.ACTIVE;
  const faceSamplingEnabled = metricsActive && isCameraOn && videoReady;

  const { getSnapshot: getAudioSnapshot } = useLiveAudioMonitor(
    stream,
    metricsActive && isMicOn
  );

  const {
    modelsReady: faceModelsReady,
    modelsError: faceModelsError,
    liveAggregated,
    resetSamples: resetFaceSamples,
    getAggregatedMetrics: getVideoMetrics,
  } = useFaceVideoAnalysis(candidateVideoRef, faceSamplingEnabled, {
    showLiveIndicators: true,
  });

  getAudioSnapshotRef.current = getAudioSnapshot;
  getVideoMetricsRef.current = getVideoMetrics;

  const avatarState = useMemo(() => {
    if (isSubmitting) return 'thinking';
    if (callStatus === CallStatus.CONNECTING) return 'thinking';
    if (isSpeaking) return 'speaking';
    if (callStatus === CallStatus.ACTIVE) return 'listening';
    return 'idle';
  }, [callStatus, isSpeaking, isSubmitting]);

  const captureFinalMetrics = useCallback(() => {
    const audioHints = getAudioSnapshotRef.current?.() || {};
    const { inLongPause: _inLongPause, ...liveAudioHints } = audioHints;
    finalMetricsRef.current = {
      liveAudioHints,
      liveVideoMetrics: getVideoMetricsRef.current?.() || null,
    };
  }, []);

  useEffect(() => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks?.()[0];
    const videoTrack = stream.getVideoTracks?.()[0];
    if (audioTrack) setIsMicOn(audioTrack.enabled);
    if (videoTrack) setIsCameraOn(videoTrack.enabled);
  }, [stream]);

  useEffect(() => {
    const video = candidateVideoRef.current;
    if (!video || !stream) return undefined;

    video.srcObject = stream;

    const markReady = () => {
      if (video.readyState >= 2) {
        setVideoReady(true);
      }
    };

    markReady();
    video.addEventListener('loadedmetadata', markReady);
    video.addEventListener('canplay', markReady);

    return () => {
      video.removeEventListener('loadedmetadata', markReady);
      video.removeEventListener('canplay', markReady);
    };
  }, [stream]);

  useEffect(() => {
    if (!isSpeaking) {
      setMouthPulse(0);
      return undefined;
    }

    let raf = 0;
    const tick = () => {
      setMouthPulse(0.35 + 0.45 * Math.abs(Math.sin(performance.now() / 120)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isSpeaking]);

  useEffect(() => {
    let vapi;

    try {
      vapi = getVapiClient();
    } catch (error) {
      setCallError(error.message);
      return undefined;
    }

    const onCallStart = () => {
      resetFaceSamples();
      callStartedAtRef.current = Date.now();
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      captureFinalMetrics();
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        setMessages((prev) => {
          const next = [...prev, { role: message.role, content: message.transcript }];
          messagesRef.current = next;
          return next;
        });
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error) => {
      console.error('Vapi error:', error);
      setCallError(formatVapiError(error));
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('error', onError);

    return () => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('error', onError);
    };
  }, [captureFinalMetrics, resetFaceSamples]);

  useEffect(() => {
    if (callStatus !== CallStatus.FINISHED || isSubmitting || finishedNotifiedRef.current) {
      return;
    }

    finishedNotifiedRef.current = true;

    if (!finalMetricsRef.current) {
      captureFinalMetrics();
    }

    const { liveAudioHints, liveVideoMetrics } = finalMetricsRef.current || {};
    const durationMs = callStartedAtRef.current
      ? Math.max(0, Date.now() - callStartedAtRef.current)
      : undefined;

    onFinished?.(
      {
        transcript: messagesRef.current,
        liveAudioHints: liveAudioHints || {},
        liveVideoMetrics: liveVideoMetrics || null,
        durationMs,
      },
      sessionId
    );
  }, [
    callStatus,
    captureFinalMetrics,
    isSubmitting,
    onFinished,
    sessionId,
  ]);

  const toggleMic = () => {
    const nextMicOn = !isMicOn;

    try {
      if (callStatus === CallStatus.ACTIVE) {
        getVapiClient().setMuted(!nextMicOn);
        setIsMicOn(nextMicOn);
        return;
      }
    } catch {
      // Vapi may not be ready before call starts
    }

    const audioTrack = stream?.getAudioTracks?.()[0];
    if (audioTrack) {
      audioTrack.enabled = nextMicOn;
    }

    setIsMicOn(nextMicOn);
  };

  const toggleCamera = () => {
    const videoTrack = stream?.getVideoTracks?.()[0];
    if (!videoTrack) return;

    const nextCameraOn = !videoTrack.enabled;
    videoTrack.enabled = nextCameraOn;
    setIsCameraOn(nextCameraOn);
  };

  const canStartCall = Boolean(stream) && videoReady;

  const handleCall = async () => {
    if (!canStartCall) return;

    setCallError(null);
    finishedNotifiedRef.current = false;
    finalMetricsRef.current = null;
    callStartedAtRef.current = null;
    resetFaceSamples();
    setCallStatus(CallStatus.CONNECTING);

    try {
      const vapi = getVapiClient();
      const formattedQuestions = (questions || []).map((q) => `- ${q}`).join('\n');
      const variableValues = {
        questions: formattedQuestions,
        username: userName,
        roleLabel: roleLabel || 'this role',
        difficulty: difficulty || 'medium',
        durationMinutes: String(durationMinutes || 15),
        interviewerPersona: getInterviewerPersonaPrompt(interviewerPersona),
      };

      // Release our mic capture so Vapi can open its own WebRTC audio stream.
      releaseStreamAudioTracks(stream);

      const assistantId = getInterviewStartTarget();
      if (assistantId) {
        await vapi.start(assistantId, { variableValues });
      } else {
        await vapi.start(interviewerAssistant, { variableValues });
      }

      if (!isMicOn) {
        vapi.setMuted(true);
      }
    } catch (error) {
      setCallError(formatVapiError(error));
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    captureFinalMetrics();
    try {
      getVapiClient().stop();
    } catch {
      // ignore
    }
    setCallStatus(CallStatus.FINISHED);
  };

  const latestMessage = messages[messages.length - 1]?.content;
  const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  const videoMetricsOn = isCameraOn && metricsActive && faceModelsReady;
  const voiceMetricsOn = isMicOn && metricsActive;

  return (
    <div className="flex flex-col items-center gap-lg p-base md:p-lg w-full max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <MetricBadge
          active={videoMetricsOn}
          labelOn="Video metrics on"
          labelPaused="Video metrics paused"
        />
        <MetricBadge
          active={voiceMetricsOn}
          labelOn="Voice metrics on"
          labelPaused="Voice metrics paused"
        />
      </div>

      {!faceModelsReady && !faceModelsError ? (
        <p className="font-label-sm text-on-surface-variant text-center">
          Loading face analysis models…
        </p>
      ) : null}

      {faceModelsError ? (
        <p className="font-label-sm text-error text-center">
          Face analysis models could not load. Eye-contact metrics may be unavailable.
        </p>
      ) : null}

      <div className="w-full flex flex-col md:flex-row gap-sm md:gap-md">
        <div className="dashboard-glass-card shadow-level-1 flex-1 min-w-0 rounded-2xl aspect-video bg-surface-container-low flex flex-col items-center justify-center gap-2 p-6">
          <div className="relative shrink-0 mb-1">
            <div className="w-[72px] h-[72px] rounded-full bg-surface flex items-center justify-center ring-[3px] ring-secondary/40 overflow-hidden">
              <AIInterviewerAvatar
                embedded
                tile
                hideStatusLabel
                state={avatarState}
                mouthOpenLevel={isSpeaking ? mouthPulse : 0}
                compact
              />
            </div>
            <span
              className={cn(
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface',
                callStatus === CallStatus.ACTIVE ? 'bg-emerald-500' : 'bg-outline'
              )}
              aria-hidden
            />
          </div>
          <h3 className="text-sm font-bold text-on-surface">AI Interviewer</h3>
          <p className="text-xs text-on-surface-variant">
            {callStatus === CallStatus.INACTIVE
              ? 'Ready'
              : isSpeaking
                ? 'Speaking'
                : 'Listening'}
          </p>
        </div>

        <div className="dashboard-glass-card shadow-level-1 flex-1 relative overflow-hidden rounded-2xl aspect-video transition-all duration-200 min-w-0 bg-on-surface">
          <video
            ref={candidateVideoRef}
            autoPlay
            muted
            playsInline
            className={cn(
              'w-full h-full object-cover rounded-2xl [transform:scaleX(-1)] transition-all duration-200',
              !isCameraOn && 'opacity-30 grayscale'
            )}
          />

          {!stream ? (
            <div className="absolute inset-0 flex items-center justify-center bg-on-surface rounded-2xl">
              <AppIcon name="person" size="dashboard" className="text-secondary" />
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl pointer-events-none" />

          <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-1 z-10">
            <h3 className="text-sm font-semibold text-white">{userName}</h3>
            <p className="text-[11px] text-white/80">{isCameraOn ? 'Camera on' : 'Camera off'}</p>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={toggleMic}
                aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 min-h-[36px] min-w-[36px]',
                  isMicOn ? 'bg-white/20 text-white' : 'bg-error text-on-error'
                )}
              >
                <AppIcon name={isMicOn ? 'mic' : 'mic_off'} size="sm" />
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 min-h-[36px] min-w-[36px]',
                  isCameraOn ? 'bg-white/20 text-white' : 'bg-error text-on-error'
                )}
              >
                <AppIcon name={isCameraOn ? 'videocam' : 'videocam_off'} size="sm" />
              </button>
            </div>

            {metricsActive && isCameraOn && liveAggregated ? (
              <div className="w-full max-w-[200px] px-2 mt-1 pointer-events-none">
                <LiveVideoIndicator
                  isRecording={faceSamplingEnabled}
                  modelsReady={faceModelsReady}
                  metrics={{
                    eyeContactPercent: liveAggregated?.eyeContactPercent ?? 0,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {messages.length > 0 ? (
        <div className="w-full dashboard-glass-card dashboard-card-padding rounded-2xl shadow-level-1 transition-all duration-200">
          <p className="font-label-sm text-on-surface-variant mb-1">Live transcript</p>
          <p className="font-body-md text-on-surface transition-opacity duration-500">{latestMessage}</p>
        </div>
      ) : null}

      {(callError || submitError) && (
        <p className="font-body-md text-error max-w-xl text-center">{callError || submitError}</p>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button
            type="button"
            onClick={handleCall}
            disabled={
              callStatus === CallStatus.CONNECTING ||
              isSubmitting ||
              !canStartCall
            }
            className="bg-secondary text-on-secondary rounded-xl px-8 py-3 font-label-md min-h-[44px] disabled:opacity-60 dashboard-btn-glow transition-all duration-200"
          >
            {callStatus === CallStatus.CONNECTING
              ? 'Connecting…'
              : !videoReady || !stream
                ? 'Waiting for camera…'
                : isCallInactiveOrFinished
                  ? 'Start interview'
                  : '…'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDisconnect}
            className="bg-error text-on-error rounded-xl px-8 py-3 font-label-md min-h-[44px] transition-all duration-200"
          >
            End interview
          </button>
        )}
      </div>
    </div>
  );
}

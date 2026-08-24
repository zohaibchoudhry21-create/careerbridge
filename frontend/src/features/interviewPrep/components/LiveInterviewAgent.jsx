import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getVapiClient,
  stopVapiCall,
  formatVapiError,
  isNonFatalVapiError,
  isDailyEjectError,
  getCallEndedReason,
  logVapiDiagnostic,
} from '../lib/vapi.sdk';
import { LIVE_INTERVIEWER_DISPLAY_NAME } from '../constants/voiceCallAssistant';
import { useLiveAudioMonitor } from '../hooks/useLiveAudioMonitor';
import { useFaceVideoAnalysis } from '../hooks/useFaceVideoAnalysis';
import { useLiveInterview } from '../hooks/useLiveInterview';
import LiveInterview from './LiveInterview';
import PanelRoomSession from './panelRoom/PanelRoomSession';
import LiveVideoIndicator from './LiveVideoIndicator';
import { DEFAULT_INTERVIEW_SETUP_MODE } from '../constants/interviewPrepConstants';
import { prepareLiveAudioHintsForSubmit } from '../utils/prepareLiveAudioHintsForSubmit';
import { applyLiveAdaptiveDepth } from '../services/mockInterviewService';
import { useInterviewCountdown } from '../hooks/useInterviewCountdown';
import { useInterviewMedia } from '../context/InterviewMediaContext';
import { agentDbgLog } from '../utils/agentDbgLog';

const CallStatus = {
  INACTIVE: 'INACTIVE',
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
};

/** System nudge when planned duration elapses — mirrors interviewerPromptBuilder closing rules. */
const TIME_UP_WIND_DOWN_NUDGE = `Time for this interview is up. Deliver your natural closing now: thank the candidate briefly and wrap up within the next 30–60 seconds. Do not ask new substantive questions. Do not mention a timer or countdown — close professionally as a human interviewer would when time is over.`;

const getLiveAudioTrack = (mediaStream) =>
  mediaStream?.getAudioTracks?.().find((track) => track.readyState === 'live') || null;

const UI_STATUS_BY_CALL_STATUS = {
  [CallStatus.INACTIVE]: 'idle',
  [CallStatus.CONNECTING]: 'connecting',
  [CallStatus.ACTIVE]: 'active',
  [CallStatus.FINISHED]: 'ended',
};

export default function LiveInterviewAgent({
  userName,
  aiName = LIVE_INTERVIEWER_DISPLAY_NAME,
  sessionId,
  assistantId,
  roleLabel,
  difficulty,
  durationMinutes,
  interviewMode = DEFAULT_INTERVIEW_SETUP_MODE,
  interviewFormat = 'standard',
  interviewerPersona = 'neutral',
  panelSeats = [],
  adaptiveDepthEnabled = false,
  stream,
  onFinished,
  submitError,
  isSubmitting,
}) {
  const { t } = useTranslation('interviewPrep');
  const { requestAccess, stopStream } = useInterviewMedia();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [callError, setCallError] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoEpoch, setVideoEpoch] = useState(0);
  /** Wall-clock ms when Vapi `call-start` fired — source of truth for the countdown. */
  const [connectedAtMs, setConnectedAtMs] = useState(null);

  const finishedNotifiedRef = useRef(false);
  const callStartedAtRef = useRef(null);
  const candidateVideoRef = useRef(null);
  const streamRef = useRef(stream);
  const isVoiceOnly = interviewMode === 'voice_only';
  const isVoiceOnlyRef = useRef(isVoiceOnly);
  streamRef.current = stream;
  isVoiceOnlyRef.current = isVoiceOnly;
  const finalMetricsRef = useRef(null);
  const getAudioSnapshotRef = useRef(() => ({}));
  const getVideoMetricsRef = useRef(() => null);
  const startInFlightRef = useRef(false);
  const endedReasonRef = useRef(null);
  const adaptiveStrengthsRef = useRef([]);
  const adaptiveInFlightRef = useRef(false);
  const lastAiQuestionRef = useRef('');
  const adaptiveDepthEnabledRef = useRef(adaptiveDepthEnabled);
  adaptiveDepthEnabledRef.current = adaptiveDepthEnabled;
  const windDownSentRef = useRef(false);
  const hardStopTriggeredRef = useRef(false);
  const callStatusRef = useRef(CallStatus.INACTIVE);

  const { transcript, livePreview, ingestVapiMessage, resetTranscript, clearLivePreview, getSubmitTranscript } =
    useLiveInterview();

  callStatusRef.current = callStatus;

  const formatCallError = useCallback(
    (error) => (isDailyEjectError(error) ? t('live.micJoinFailed') : formatVapiError(error)),
    [t]
  );

  const recoverMicIfNeeded = useCallback(() => {
    if (getLiveAudioTrack(stream)) return;
    requestAccess().catch(() => { });
  }, [requestAccess, stream]);

  const releaseMedia = useCallback(() => {
    stopStream();
    setIsCameraOn(false);
    setIsMicOn(false);
    setVideoReady(false);
    if (candidateVideoRef.current) {
      candidateVideoRef.current.srcObject = null;
    }
  }, [stopStream]);

  const countdown = useInterviewCountdown({
    connectedAtMs,
    durationMinutes,
    active: callStatus === CallStatus.ACTIVE,
  });

  const metricsActive = callStatus === CallStatus.ACTIVE;
  const faceSamplingEnabled =
    !isVoiceOnly && metricsActive && isCameraOn && (videoReady || Boolean(stream));

  /** Bind preview stream whenever the <video> (re)mounts — idle→live remounts the node. */
  const attachPreviewStream = useCallback((video) => {
    if (!video || isVoiceOnlyRef.current) return;
    const media = streamRef.current;
    if (!media) {
      video.srcObject = null;
      return;
    }
    // Only rebind when needed — reassigning the same stream resets readyState and breaks face-api.
    if (video.srcObject !== media) {
      video.srcObject = media;
    }
    const playPromise = video.play?.();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => { });
    }
  }, []);

  const recoverCameraPreview = useCallback(async () => {
    if (isVoiceOnlyRef.current) return;
    const current = streamRef.current;
    if (!current) return;

    const el = candidateVideoRef.current;
    if (el) {
      el.muted = true;
      el.playsInline = true;
      el.autoplay = true;
    }
    attachPreviewStream(el);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 250);
    });

    const existing = current.getVideoTracks?.()[0];
    const liveEl = candidateVideoRef.current;
    if (
      liveEl &&
      liveEl.videoWidth > 0 &&
      liveEl.readyState >= 2 &&
      existing &&
      existing.readyState === 'live' &&
      !existing.muted
    ) {
      setVideoReady(true);
      return;
    }

    const needsRecover =
      !existing ||
      existing.readyState === 'ended' ||
      existing.muted === true ||
      !liveEl ||
      liveEl.videoWidth === 0;

    if (!needsRecover) return;

    try {
      const fresh = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const nextTrack = fresh.getVideoTracks?.()[0];
      if (!nextTrack) {
        fresh.getTracks().forEach((track) => track.stop());
        return;
      }
      if (existing) {
        current.removeTrack(existing);
        existing.stop();
      }
      current.addTrack(nextTrack);
      setIsCameraOn(nextTrack.enabled !== false);
      attachPreviewStream(candidateVideoRef.current);
      setVideoReady(true);
      setVideoEpoch((epoch) => epoch + 1);
    } catch {
      // Keep existing UI; user can retry via camera toggle / restart.
    }
  }, [attachPreviewStream]);

  const setCandidateVideoNode = useCallback(
    (node) => {
      candidateVideoRef.current = node;
      if (!node) return;
      node.muted = true;
      node.playsInline = true;
      node.autoplay = true;
      attachPreviewStream(node);
      if (node.readyState >= 2 && node.videoWidth > 0) {
        setVideoReady(true);
      }
      setVideoEpoch((epoch) => epoch + 1);
    },
    [attachPreviewStream]
  );

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
    videoEpoch,
  });

  getAudioSnapshotRef.current = getAudioSnapshot;
  getVideoMetricsRef.current = getVideoMetrics;

  const captureFinalMetrics = useCallback(() => {
    const audioHints = getAudioSnapshotRef.current?.() || {};
    finalMetricsRef.current = {
      liveAudioHints: prepareLiveAudioHintsForSubmit(audioHints),
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
    if (!video || isVoiceOnly) return undefined;

    attachPreviewStream(video);

    const markReady = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
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
  }, [stream, isVoiceOnly, attachPreviewStream]);

  // After Vapi connects, Windows sometimes leaves the camera track muted/black — recover only if broken.
  useEffect(() => {
    if (isVoiceOnly) return undefined;
    if (callStatus !== CallStatus.CONNECTING && callStatus !== CallStatus.ACTIVE) {
      return undefined;
    }

    const el = candidateVideoRef.current;
    if (el && (!el.srcObject || el.videoWidth === 0)) {
      attachPreviewStream(el);
    }

    if (callStatus === CallStatus.ACTIVE) {
      setVideoEpoch((epoch) => epoch + 1);
    }

    const videoTrack = stream?.getVideoTracks?.()[0];
    const onMute = () => {
      recoverCameraPreview();
    };
    const onUnmute = () => {
      attachPreviewStream(candidateVideoRef.current);
    };
    const onEnded = () => {
      recoverCameraPreview();
    };

    videoTrack?.addEventListener?.('mute', onMute);
    videoTrack?.addEventListener?.('unmute', onUnmute);
    videoTrack?.addEventListener?.('ended', onEnded);

    const timer = window.setTimeout(() => {
      const node = candidateVideoRef.current;
      const track = streamRef.current?.getVideoTracks?.()[0];
      if (!node) return;
      if (node.videoWidth === 0 || track?.muted || track?.readyState === 'ended') {
        recoverCameraPreview();
      }
    }, 800);

    return () => {
      window.clearTimeout(timer);
      videoTrack?.removeEventListener?.('mute', onMute);
      videoTrack?.removeEventListener?.('unmute', onUnmute);
      videoTrack?.removeEventListener?.('ended', onEnded);
    };
  }, [callStatus, isVoiceOnly, stream, attachPreviewStream, recoverCameraPreview]);

  useEffect(() => {
    if (isVoiceOnly && stream?.getAudioTracks?.().length) {
      setVideoReady(true);
    }
  }, [isVoiceOnly, stream]);

  useEffect(() => {
    const audioTrack = getLiveAudioTrack(stream);
    if (!audioTrack) return undefined;

    let vapi;

    try {
      vapi = getVapiClient(audioTrack);
    } catch (error) {
      setCallError(formatVapiError(error));
      return undefined;
    }

    const onCallStart = () => {
      logVapiDiagnostic('call-start', null);
      startInFlightRef.current = false;
      resetFaceSamples();
      resetTranscript();
      const startedAt = Date.now();
      callStartedAtRef.current = startedAt;
      setConnectedAtMs(startedAt);
      windDownSentRef.current = false;
      hardStopTriggeredRef.current = false;
      setCallStatus(CallStatus.ACTIVE);
      // #region agent log
      agentDbgLog({
        hypothesisId: 'A',
        location: 'LiveInterviewAgent.jsx:onCallStart',
        message: 'call started',
        data: { startedAt, durationMinutes: Number(durationMinutes) || null },
      });
      // #endregion
    };

    const onCallEnd = (payload) => {
      logVapiDiagnostic('call-end', payload);
      endedReasonRef.current = getCallEndedReason(payload);
      const endedAt = Date.now();
      const startedAt = callStartedAtRef.current;
      const elapsedSec = startedAt ? Math.round((endedAt - startedAt) / 1000) : null;
      const plannedSec = Math.round((Number(durationMinutes) || 15) * 60);
      // #region agent log
      agentDbgLog({
        hypothesisId: 'A',
        location: 'LiveInterviewAgent.jsx:onCallEnd',
        message: 'vapi call-end',
        data: {
          reason: endedReasonRef.current,
          elapsedSec,
          plannedSec,
          remainingSec: plannedSec && elapsedSec != null ? plannedSec - elapsedSec : null,
          payloadType: typeof payload,
          payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 12) : null,
        },
      });
      // #endregion
      startInFlightRef.current = false;
      captureFinalMetrics();
      // Drop any in-flight partial preview — submit uses committed finals only.
      clearLivePreview();
      setConnectedAtMs(null);
      releaseMedia();
      setCallStatus(CallStatus.FINISHED);
    };

    const onCallStartProgress = (payload) => logVapiDiagnostic('call-start-progress', payload);
    const onCallStartFailed = (payload) => logVapiDiagnostic('call-start-failed', payload);

    const onMessage = (message) => {
      const type = String(message?.type || '');
      if (type !== 'transcript' && !type.startsWith('transcript')) return;

      const transcriptType =
        String(message.transcriptType || '').toLowerCase() === 'partial'
          ? 'partial'
          : 'final';
      const role = message.role === 'user' || message.role === 'customer' ? 'user' : 'assistant';
      const segmentText = String(message.transcript || '').trim();

      ingestVapiMessage(message);

      if (transcriptType === 'partial' || !segmentText) return;

      if (role === 'assistant') {
        const turns = getSubmitTranscript();
        const lastAssistant = [...turns].reverse().find((t) => t.role === 'assistant');
        lastAiQuestionRef.current = lastAssistant?.content || segmentText;
        return;
      }

      // User final — optional adaptive depth nudge (committed segments only).
      if (
        adaptiveDepthEnabledRef.current &&
        sessionId &&
        !adaptiveInFlightRef.current
      ) {
        const submitTurns = getSubmitTranscript();
        const answeredCount = submitTurns.filter((m) => m.role === 'user').length;
        const priorStrengths = adaptiveStrengthsRef.current.slice(-2);
        adaptiveInFlightRef.current = true;
        applyLiveAdaptiveDepth({
          sessionId,
          answerText: segmentText,
          questionText: lastAiQuestionRef.current || '',
          answeredCount,
          priorStrengths,
        })
          .then((data) => {
            if (data?.strength) {
              adaptiveStrengthsRef.current = [
                ...adaptiveStrengthsRef.current,
                data.strength,
              ].slice(-4);
            }
            if (data?.systemNudge) {
              try {
                getVapiClient(getLiveAudioTrack(stream)).send({
                  type: 'add-message',
                  message: {
                    role: 'system',
                    content: data.systemNudge,
                  },
                });
              } catch {
                // Mid-call nudge is best-effort; never break the interview.
              }
            }
          })
          .catch(() => {
            // Default to no change on any failure.
          })
          .finally(() => {
            adaptiveInFlightRef.current = false;
          });
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error) => {
      logVapiDiagnostic('error', error);
      // #region agent log
      agentDbgLog({
        hypothesisId: 'D',
        location: 'LiveInterviewAgent.jsx:onError',
        message: 'vapi error',
        data: {
          nonFatal: isNonFatalVapiError(error),
          errorType: error?.type || null,
          errorMsg:
            typeof error === 'string' ? error : error?.message || error?.msg || null,
          callStatus: callStatusRef.current,
        },
      });
      // #endregion

      if (isNonFatalVapiError(error)) {
        console.warn('Vapi non-fatal audio processor error (ignored):', error);
        return;
      }

      console.error('Vapi error:', error);
      startInFlightRef.current = false;
      clearLivePreview();
      setConnectedAtMs(null);
      setCallError(formatCallError(error));
      setCallStatus(CallStatus.INACTIVE);
      recoverMicIfNeeded();
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('error', onError);
    vapi.on('call-start-progress', onCallStartProgress);
    vapi.on('call-start-failed', onCallStartFailed);

    return () => {
      // #region agent log
      agentDbgLog({
        hypothesisId: 'C',
        location: 'LiveInterviewAgent.jsx:vapiEffectCleanup',
        message: 'vapi listeners cleanup (stream/deps change)',
        data: { callStatus: callStatusRef.current, hasStream: Boolean(stream) },
      });
      // #endregion
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('error', onError);
      vapi.off('call-start-progress', onCallStartProgress);
      vapi.off('call-start-failed', onCallStartFailed);
    };
  }, [clearLivePreview, formatCallError, getSubmitTranscript, ingestVapiMessage, captureFinalMetrics, recoverMicIfNeeded, releaseMedia, resetFaceSamples, resetTranscript, sessionId, stream, durationMinutes]);

  // Planned duration hit → ask interviewer to close naturally (do not hard-cut).
  useEffect(() => {
    if (callStatus !== CallStatus.ACTIVE || !countdown.isExpired || windDownSentRef.current) {
      return;
    }
    windDownSentRef.current = true;
    try {
      getVapiClient(getLiveAudioTrack(stream)).send({
        type: 'add-message',
        message: {
          role: 'system',
          content: TIME_UP_WIND_DOWN_NUDGE,
        },
      });
    } catch {
      // Best-effort; user still sees the wrap-up notice + hard limit below.
    }
  }, [callStatus, countdown.isExpired, stream]);

  // Outer hard limit: durationMinutes + 2 minutes — end if still connected.
  useEffect(() => {
    if (
      callStatus !== CallStatus.ACTIVE ||
      !countdown.isPastHardLimit ||
      hardStopTriggeredRef.current
    ) {
      return;
    }
    // #region agent log
    agentDbgLog({
      hypothesisId: 'B',
      location: 'LiveInterviewAgent.jsx:hardStop',
      message: 'client hard-stop triggered',
      data: {
        elapsedMs: countdown.elapsedMs,
        durationMs: countdown.durationMs,
        hardLimitMs: countdown.hardLimitMs,
        remainingMs: countdown.remainingMs,
        durationMinutes: Number(durationMinutes) || null,
      },
    });
    // #endregion
    hardStopTriggeredRef.current = true;
    captureFinalMetrics();
    stopVapiCall();
    clearLivePreview();
    setConnectedAtMs(null);
    releaseMedia();
    setCallStatus(CallStatus.FINISHED);
  }, [callStatus, countdown.isPastHardLimit, countdown.elapsedMs, countdown.durationMs, countdown.hardLimitMs, countdown.remainingMs, captureFinalMetrics, clearLivePreview, releaseMedia, durationMinutes]);

  // A call left running after unmount keeps billing and holds the mic.
  useEffect(
    () => () => {
      if (
        callStatusRef.current === CallStatus.ACTIVE ||
        callStatusRef.current === CallStatus.CONNECTING
      ) {
        // #region agent log
        agentDbgLog({
          hypothesisId: 'E',
          location: 'LiveInterviewAgent.jsx:unmountCleanup',
          message: 'unmount stopVapiCall while live',
          data: { callStatus: callStatusRef.current },
        });
        // #endregion
        stopVapiCall();
      }
    },
    []
  );

  useEffect(() => {
    if (callStatus !== CallStatus.FINISHED || isSubmitting || finishedNotifiedRef.current) {
      return;
    }

    finishedNotifiedRef.current = true;

    if (!finalMetricsRef.current) {
      captureFinalMetrics();
    }

    // An ejected/failed call produces no turns; submitting would just 400.
    const submitTranscript = getSubmitTranscript();
    if (import.meta.env.DEV) {
      console.info('[live-transcript] submit payload', submitTranscript);
    }
    if (!submitTranscript.length) {
      const reason = endedReasonRef.current;
      const eject = isDailyEjectError(reason);
      setCallError(
        eject
          ? t('live.micJoinFailed')
          : reason
            ? t('live.endedNoConversationWithReason', { reason })
            : t('live.endedNoConversation')
      );
      setCallStatus(CallStatus.INACTIVE);
      finishedNotifiedRef.current = false;
      recoverMicIfNeeded();
      return;
    }

    const { liveAudioHints, liveVideoMetrics } = finalMetricsRef.current || {};
    const durationMs = callStartedAtRef.current
      ? Math.max(0, Date.now() - callStartedAtRef.current)
      : undefined;

    onFinished?.(
      {
        transcript: submitTranscript,
        liveAudioHints: liveAudioHints || {},
        liveVideoMetrics: liveVideoMetrics || null,
        durationMs,
      },
      sessionId
    );
  }, [
    callStatus,
    captureFinalMetrics,
    getSubmitTranscript,
    isSubmitting,
    onFinished,
    sessionId,
    recoverMicIfNeeded,
    t,
  ]);

  const toggleMic = () => {
    const nextMicOn = !isMicOn;

    try {
      if (callStatus === CallStatus.ACTIVE) {
        getVapiClient(getLiveAudioTrack(stream)).setMuted(!nextMicOn);
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

  const hasAudioStream = Boolean(getLiveAudioTrack(stream));
  const canStartCall = hasAudioStream && (isVoiceOnly || videoReady);

  const handleCall = async () => {
    if (!canStartCall || startInFlightRef.current) return;

    startInFlightRef.current = true;
    setCallError(null);
    finishedNotifiedRef.current = false;
    finalMetricsRef.current = null;
    callStartedAtRef.current = null;
    setConnectedAtMs(null);
    windDownSentRef.current = false;
    hardStopTriggeredRef.current = false;
    endedReasonRef.current = null;
    resetFaceSamples();
    setCallStatus(CallStatus.CONNECTING);

    try {
      if (!assistantId) {
        throw new Error(t('live.missingAssistant'));
      }

      const audioTrack = getLiveAudioTrack(stream);
      if (!audioTrack) {
        throw new Error(t('live.waitingMic'));
      }

      const vapi = getVapiClient(audioTrack);

      // Reuse the preview mic track (passed as Daily audioSource).
      // A second getUserMedia on Windows steals the device and Daily ejects
      // ("Meeting has ended"), so user speech never reaches the transcript.
      await vapi.start(assistantId);

      if (!isMicOn) {
        vapi.setMuted(true);
      }
    } catch (error) {
      logVapiDiagnostic('start-threw', error);
      startInFlightRef.current = false;
      setCallError(formatCallError(error));
      setCallStatus(CallStatus.INACTIVE);
      recoverMicIfNeeded();
    }
  };

  const handleDisconnect = () => {
    // #region agent log
    agentDbgLog({
      hypothesisId: 'E',
      location: 'LiveInterviewAgent.jsx:handleDisconnect',
      message: 'user/UI end interview',
      data: {
        elapsedMs: countdown.elapsedMs,
        remainingMs: countdown.remainingMs,
        durationMinutes: Number(durationMinutes) || null,
      },
    });
    // #endregion
    captureFinalMetrics();
    stopVapiCall();
    clearLivePreview();
    setConnectedAtMs(null);
    releaseMedia();
    setCallStatus(CallStatus.FINISHED);
  };

  const videoMetricsOn = !isVoiceOnly && isCameraOn && metricsActive && faceModelsReady;
  const voiceMetricsOn = isMicOn && metricsActive;

  // While Vapi reports assistant speech the AI is talking; otherwise an active
  // call means we are waiting on the candidate.
  let activeSpeaker = null;
  if (isSpeaking) activeSpeaker = 'ai';
  else if (callStatus === CallStatus.ACTIVE) activeSpeaker = 'user';

  let startLabel = interviewFormat === 'panel' ? t('panelRoom.lobby.enter') : t('live.startInterview');
  if (callStatus === CallStatus.CONNECTING) {
    startLabel =
      interviewFormat === 'panel' ? t('panelRoom.enter.openingDoor') : t('live.statusConnecting');
  } else if (!hasAudioStream) startLabel = isVoiceOnly ? t('live.waitingMic') : t('live.waitingCamera');
  else if (!isVoiceOnly && !videoReady) startLabel = t('live.waitingCamera');

  const notice =
    countdown.isExpired && callStatus === CallStatus.ACTIVE ? (
      <p className="font-label-sm text-center text-on-surface-variant" role="status">
        {t('live.timeUpWrapping')}
      </p>
    ) : !isVoiceOnly && !faceModelsReady && !faceModelsError ? (
      <p className="font-label-sm text-on-surface-variant text-center">
        {t('live.loadingFaceModels')}
      </p>
    ) : !isVoiceOnly && faceModelsError ? (
      <p
        role="alert"
        className="rounded-xl border border-error/30 bg-error-container/80 px-4 py-2.5 text-center font-label-sm text-on-error-container"
      >
        {t('live.faceModelsFailed')}
      </p>
    ) : null;

  const videoOverlay =
    !isVoiceOnly && metricsActive && isCameraOn ? (
      <LiveVideoIndicator
        isRecording={faceSamplingEnabled}
        modelsReady={faceModelsReady}
        hasSample={Boolean(liveAggregated)}
        metrics={{ eyeContactPercent: liveAggregated?.eyeContactPercent ?? 0 }}
        compact
      />
    ) : null;

  const sharedLiveProps = {
    userName,
    status: UI_STATUS_BY_CALL_STATUS[callStatus] || 'idle',
    activeSpeaker,
    transcript,
    livePreview,
    interviewMode,
    interviewerPersona,
    panelSeats,
    roleLabel,
    difficulty,
    durationMinutes,
    countdownDisplay: callStatus === CallStatus.ACTIVE ? countdown.display : null,
    countdownUrgency: callStatus === CallStatus.ACTIVE ? countdown.urgency : 'idle',
    videoMetricsOn,
    voiceMetricsOn,
    cameraOn: isCameraOn,
    micOn: isMicOn,
    hasStream: Boolean(stream),
    notice,
    errorMessage: callError || submitError,
    startDisabled: callStatus === CallStatus.CONNECTING || isSubmitting || !canStartCall,
    startLabel,
    onStart: handleCall,
    onEnd: handleDisconnect,
    onToggleMic: toggleMic,
    onToggleCamera: toggleCamera,
    videoRef: setCandidateVideoNode,
    videoOverlay,
    isSubmitting: Boolean(isSubmitting),
  };

  if (interviewFormat === 'panel') {
    return <PanelRoomSession {...sharedLiveProps} />;
  }

  return (
    <LiveInterview
      {...sharedLiveProps}
      aiName={aiName || t('live.aiName')}
      interviewFormat={interviewFormat}
    />
  );
}

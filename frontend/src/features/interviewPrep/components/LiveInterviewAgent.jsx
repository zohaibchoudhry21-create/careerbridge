import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getVapiClient,
  formatVapiError,
  getInterviewStartTarget,
  isNonFatalVapiError,
  getCallEndedReason,
  logVapiDiagnostic,
} from '../lib/vapi.sdk';
import { interviewerAssistant } from '../constants/voiceCallAssistant';
import { useLiveAudioMonitor } from '../hooks/useLiveAudioMonitor';
import { useFaceVideoAnalysis } from '../hooks/useFaceVideoAnalysis';
import { useLiveInterview } from '../hooks/useLiveInterview';
import LiveInterview from './LiveInterview';
import LiveVideoIndicator from './LiveVideoIndicator';
import { getInterviewerPersonaPrompt } from '../utils/interviewerPersona';
import { DEFAULT_INTERVIEW_SETUP_MODE } from '../constants/interviewPrepConstants';

const CallStatus = {
  INACTIVE: 'INACTIVE',
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
};

const UI_STATUS_BY_CALL_STATUS = {
  [CallStatus.INACTIVE]: 'idle',
  [CallStatus.CONNECTING]: 'connecting',
  [CallStatus.ACTIVE]: 'active',
  [CallStatus.FINISHED]: 'ended',
};

export default function LiveInterviewAgent({
  userName,
  aiName = 'AI Interviewer',
  sessionId,
  questions,
  roleLabel,
  difficulty,
  durationMinutes,
  interviewerPersona = 'neutral',
  interviewMode = DEFAULT_INTERVIEW_SETUP_MODE,
  focusAreas,
  stream,
  onFinished,
  submitError,
  isSubmitting,
}) {
  const { t } = useTranslation('interviewPrep');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [callError, setCallError] = useState(null);
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
  const startInFlightRef = useRef(false);
  const endedReasonRef = useRef(null);

  const { transcript, addTurn } = useLiveInterview();

  const isVoiceOnly = interviewMode === 'voice_only';
  const metricsActive = callStatus === CallStatus.ACTIVE;
  const faceSamplingEnabled =
    !isVoiceOnly && metricsActive && isCameraOn && videoReady;

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
    if (!video || !stream || isVoiceOnly) return undefined;

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
  }, [stream, isVoiceOnly]);

  useEffect(() => {
    if (isVoiceOnly && stream?.getAudioTracks?.().length) {
      setVideoReady(true);
    }
  }, [isVoiceOnly, stream]);

  useEffect(() => {
    let vapi;

    try {
      vapi = getVapiClient();
    } catch (error) {
      setCallError(formatVapiError(error));
      return undefined;
    }

    const onCallStart = () => {
      logVapiDiagnostic('call-start', null);
      startInFlightRef.current = false;
      resetFaceSamples();
      callStartedAtRef.current = Date.now();
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = (payload) => {
      logVapiDiagnostic('call-end', payload);
      endedReasonRef.current = getCallEndedReason(payload);
      startInFlightRef.current = false;
      captureFinalMetrics();
      setCallStatus(CallStatus.FINISHED);
    };

    const onCallStartProgress = (payload) => logVapiDiagnostic('call-start-progress', payload);
    const onCallStartFailed = (payload) => logVapiDiagnostic('call-start-failed', payload);

    const onMessage = (message) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        messagesRef.current = [
          ...messagesRef.current,
          { role: message.role, content: message.transcript },
        ];
        addTurn(message.role === 'user' ? 'user' : 'ai', message.transcript);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error) => {
      logVapiDiagnostic('error', error);

      if (isNonFatalVapiError(error)) {
        console.warn('Vapi non-fatal audio processor error (ignored):', error);
        return;
      }

      console.error('Vapi error:', error);
      startInFlightRef.current = false;
      setCallError(formatVapiError(error));
      setCallStatus(CallStatus.INACTIVE);
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
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('error', onError);
      vapi.off('call-start-progress', onCallStartProgress);
      vapi.off('call-start-failed', onCallStartFailed);
    };
  }, [addTurn, captureFinalMetrics, resetFaceSamples]);

  // A call left running after unmount keeps billing and holds the mic.
  useEffect(
    () => () => {
      try {
        getVapiClient().stop();
      } catch {
        // client was never created / already stopped
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
    if (!messagesRef.current.length) {
      const reason = endedReasonRef.current;
      setCallError(
        reason
          ? t('live.endedNoConversationWithReason', { reason })
          : t('live.endedNoConversation')
      );
      setCallStatus(CallStatus.INACTIVE);
      finishedNotifiedRef.current = false;
      return;
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

  const hasAudioStream = Boolean(stream?.getAudioTracks?.().length);
  const canStartCall = hasAudioStream && (isVoiceOnly || videoReady);

  const handleCall = async () => {
    if (!canStartCall || startInFlightRef.current) return;

    startInFlightRef.current = true;
    setCallError(null);
    finishedNotifiedRef.current = false;
    finalMetricsRef.current = null;
    callStartedAtRef.current = null;
    endedReasonRef.current = null;
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
        focusAreas: (Array.isArray(focusAreas) ? focusAreas : []).join(', ') || 'General',
      };

      // Do NOT stop our mic track here. Vapi/Daily opens its own capture of the
      // same device; killing the track leaves the call with no customer audio,
      // which Vapi then ejects as "Meeting has ended".
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
      logVapiDiagnostic('start-threw', error);
      startInFlightRef.current = false;
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

  const videoMetricsOn = !isVoiceOnly && isCameraOn && metricsActive && faceModelsReady;
  const voiceMetricsOn = isMicOn && metricsActive;

  // While Vapi reports assistant speech the AI is talking; otherwise an active
  // call means we are waiting on the candidate.
  let activeSpeaker = null;
  if (isSpeaking) activeSpeaker = 'ai';
  else if (callStatus === CallStatus.ACTIVE) activeSpeaker = 'user';

  let startLabel = t('live.startInterview');
  if (callStatus === CallStatus.CONNECTING) startLabel = t('live.statusConnecting');
  else if (!hasAudioStream) startLabel = isVoiceOnly ? t('live.waitingMic') : t('live.waitingCamera');
  else if (!isVoiceOnly && !videoReady) startLabel = t('live.waitingCamera');

  const notice =
    !isVoiceOnly && !faceModelsReady && !faceModelsError ? (
      <p className="font-label-sm text-on-surface-variant text-center">
        {t('live.loadingFaceModels')}
      </p>
    ) : !isVoiceOnly && faceModelsError ? (
      <p className="font-label-sm text-error text-center">{t('live.faceModelsFailed')}</p>
    ) : null;

  const videoOverlay =
    !isVoiceOnly && metricsActive && isCameraOn && liveAggregated ? (
      <LiveVideoIndicator
        isRecording={faceSamplingEnabled}
        modelsReady={faceModelsReady}
        metrics={{ eyeContactPercent: liveAggregated?.eyeContactPercent ?? 0 }}
        compact
      />
    ) : null;

  return (
    <LiveInterview
      userName={userName}
      aiName={aiName || t('live.aiName')}
      status={UI_STATUS_BY_CALL_STATUS[callStatus] || 'idle'}
      activeSpeaker={activeSpeaker}
      transcript={transcript}
      interviewMode={interviewMode}
      roleLabel={roleLabel}
      difficulty={difficulty}
      durationMinutes={durationMinutes}
      videoMetricsOn={videoMetricsOn}
      voiceMetricsOn={voiceMetricsOn}
      cameraOn={isCameraOn}
      micOn={isMicOn}
      hasStream={Boolean(stream)}
      notice={notice}
      errorMessage={callError || submitError}
      startDisabled={callStatus === CallStatus.CONNECTING || isSubmitting || !canStartCall}
      startLabel={startLabel}
      onStart={handleCall}
      onEnd={handleDisconnect}
      onToggleMic={toggleMic}
      onToggleCamera={toggleCamera}
      videoRef={candidateVideoRef}
      videoOverlay={videoOverlay}
    />
  );
}

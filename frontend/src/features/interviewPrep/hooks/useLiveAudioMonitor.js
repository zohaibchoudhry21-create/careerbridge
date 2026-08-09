import { useCallback, useEffect, useRef, useState } from 'react';
import { LIVE_AUDIO_SAMPLE_INTERVAL_MS } from '../constants/interviewPrepConstants';
import {
  ACOUSTIC_SAMPLES_MAX,
  LONG_PAUSE_MIN_MS,
  PAUSE_EVENTS_MAX,
  SHORT_PAUSE_MIN_MS,
  SILENCE_THRESHOLD,
} from '../config/speechMonitoringConfig.js';
import { estimatePitchHz } from '../utils/pitchDetectUtils.js';

/**
 * Web Audio volume / silence / pitch heuristics while recording (not transcription).
 * Legacy snapshot fields preserved for backward compatibility.
 */
export function useLiveAudioMonitor(stream, isRecording) {
  const [snapshot, setSnapshot] = useState(null);

  const snapshotRef = useRef({
    averageVolume: 0,
    silenceRatio: 0,
    longPauseCount: 0,
    inLongPause: false,
    acousticSamples: [],
    pauseEvents: [],
    sampleIntervalMs: LIVE_AUDIO_SAMPLE_INTERVAL_MS,
  });

  const contextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const intervalRef = useRef(null);
  const samplesRef = useRef([]);
  const acousticSamplesRef = useRef([]);
  const pauseEventsRef = useRef([]);
  const silentSamplesRef = useRef(0);
  const lastLoudAtRef = useRef(0);
  const recordingStartedAtRef = useRef(0);
  const silenceStartedAtRef = useRef(null);
  const inLongPauseRef = useRef(false);

  const publishSnapshot = useCallback(() => {
    const next = {
      ...snapshotRef.current,
      acousticSamples: acousticSamplesRef.current,
      pauseEvents: pauseEventsRef.current,
    };
    setSnapshot(next);
    return next;
  }, []);

  useEffect(() => {
    if (!stream) return undefined;

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return undefined;

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    contextRef.current = context;
    analyserRef.current = analyser;
    sourceRef.current = source;

    return () => {
      source.disconnect();
      context.close();
      contextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    };
  }, [stream]);

  useEffect(() => {
    if (!isRecording || !analyserRef.current) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSnapshot(null);
      return undefined;
    }

    if (contextRef.current?.state === 'suspended') {
      contextRef.current.resume().catch(() => {});
    }

    samplesRef.current = [];
    acousticSamplesRef.current = [];
    pauseEventsRef.current = [];
    silentSamplesRef.current = 0;
    lastLoudAtRef.current = Date.now();
    recordingStartedAtRef.current = Date.now();
    silenceStartedAtRef.current = null;
    inLongPauseRef.current = false;
    snapshotRef.current = {
      averageVolume: 0,
      silenceRatio: 0,
      longPauseCount: 0,
      inLongPause: false,
      acousticSamples: [],
      pauseEvents: [],
      sampleIntervalMs: LIVE_AUDIO_SAMPLE_INTERVAL_MS,
    };
    publishSnapshot();

    const data = new Uint8Array(analyserRef.current.fftSize);

    const flushSilencePause = (endMs) => {
      const start = silenceStartedAtRef.current;
      if (start == null) return;
      const durationMs = Math.max(0, endMs - start);
      silenceStartedAtRef.current = null;
      if (durationMs < SHORT_PAUSE_MIN_MS) return;

      const type = durationMs >= LONG_PAUSE_MIN_MS ? 'long' : 'short';
      const relativeStart = Math.max(0, start - recordingStartedAtRef.current);
      pauseEventsRef.current = [
        ...pauseEventsRef.current,
        { tMs: relativeStart, durationMs, type },
      ].slice(-PAUSE_EVENTS_MAX);
    };

    intervalRef.current = window.setInterval(() => {
      analyserRef.current.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const normalized = (data[i] - 128) / 128;
        sum += Math.abs(normalized);
      }

      const average = sum / data.length;
      samplesRef.current.push(average);

      const now = Date.now();
      const tMs = Math.max(0, now - recordingStartedAtRef.current);
      let inLongPause = inLongPauseRef.current;

      const sampleRate = contextRef.current?.sampleRate || 48000;
      const pitchHz =
        average >= SILENCE_THRESHOLD ? estimatePitchHz(data, sampleRate) : null;

      const acousticPoint = { tMs, rms: Number(average.toFixed(4)) };
      if (pitchHz != null) acousticPoint.pitchHz = pitchHz;

      acousticSamplesRef.current = [...acousticSamplesRef.current, acousticPoint].slice(
        -ACOUSTIC_SAMPLES_MAX
      );

      if (average < SILENCE_THRESHOLD) {
        silentSamplesRef.current += 1;
        if (silenceStartedAtRef.current == null) {
          silenceStartedAtRef.current = now;
        }
        if (!inLongPauseRef.current && now - lastLoudAtRef.current >= LONG_PAUSE_MIN_MS) {
          snapshotRef.current.longPauseCount += 1;
          inLongPauseRef.current = true;
          inLongPause = true;
        }
      } else {
        flushSilencePause(now);
        lastLoudAtRef.current = now;
        inLongPauseRef.current = false;
        inLongPause = false;
      }

      const total = samplesRef.current.length || 1;
      const avgVolume =
        samplesRef.current.reduce((acc, value) => acc + value, 0) / samplesRef.current.length;

      snapshotRef.current = {
        averageVolume: Number(avgVolume.toFixed(3)),
        silenceRatio: Number((silentSamplesRef.current / total).toFixed(3)),
        longPauseCount: snapshotRef.current.longPauseCount,
        inLongPause,
        acousticSamples: acousticSamplesRef.current,
        pauseEvents: pauseEventsRef.current,
        sampleIntervalMs: LIVE_AUDIO_SAMPLE_INTERVAL_MS,
      };

      publishSnapshot();
    }, LIVE_AUDIO_SAMPLE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Flush trailing silence when monitoring stops.
      if (silenceStartedAtRef.current != null) {
        const now = Date.now();
        const start = silenceStartedAtRef.current;
        const durationMs = Math.max(0, now - start);
        if (durationMs >= SHORT_PAUSE_MIN_MS) {
          pauseEventsRef.current = [
            ...pauseEventsRef.current,
            {
              tMs: Math.max(0, start - recordingStartedAtRef.current),
              durationMs,
              type: durationMs >= LONG_PAUSE_MIN_MS ? 'long' : 'short',
            },
          ].slice(-PAUSE_EVENTS_MAX);
        }
        silenceStartedAtRef.current = null;
      }
    };
  }, [isRecording, stream, publishSnapshot]);

  const getSnapshot = useCallback(
    () => ({
      ...snapshotRef.current,
      acousticSamples: acousticSamplesRef.current,
      pauseEvents: pauseEventsRef.current,
    }),
    []
  );

  return { snapshot, getSnapshot };
}

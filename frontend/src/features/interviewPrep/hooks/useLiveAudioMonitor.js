import { useCallback, useEffect, useRef, useState } from 'react';
import { LIVE_AUDIO_SAMPLE_INTERVAL_MS } from '../constants/interviewPrepConstants';

const SILENCE_THRESHOLD = 0.04;
const LONG_PAUSE_MS = 1200;

/**
 * Lightweight Web Audio volume / silence heuristics while recording (not transcription).
 */
export function useLiveAudioMonitor(stream, isRecording) {
  const [snapshot, setSnapshot] = useState(null);

  const snapshotRef = useRef({
    averageVolume: 0,
    silenceRatio: 0,
    longPauseCount: 0,
    inLongPause: false,
  });

  const contextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const intervalRef = useRef(null);
  const samplesRef = useRef([]);
  const silentSamplesRef = useRef(0);
  const lastLoudAtRef = useRef(0);
  const inLongPauseRef = useRef(false);

  const publishSnapshot = useCallback(() => {
    const next = { ...snapshotRef.current };
    setSnapshot(next);
    return next;
  }, []);

  useEffect(() => {
    if (!stream) return undefined;

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return undefined;

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
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
    silentSamplesRef.current = 0;
    lastLoudAtRef.current = Date.now();
    inLongPauseRef.current = false;
    snapshotRef.current = {
      averageVolume: 0,
      silenceRatio: 0,
      longPauseCount: 0,
      inLongPause: false,
    };
    publishSnapshot();

    const data = new Uint8Array(analyserRef.current.fftSize);

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
      let inLongPause = inLongPauseRef.current;

      if (average < SILENCE_THRESHOLD) {
        silentSamplesRef.current += 1;
        if (!inLongPauseRef.current && now - lastLoudAtRef.current >= LONG_PAUSE_MS) {
          snapshotRef.current.longPauseCount += 1;
          inLongPauseRef.current = true;
          inLongPause = true;
        }
      } else {
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
      };

      publishSnapshot();
    }, LIVE_AUDIO_SAMPLE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRecording, stream, publishSnapshot]);

  const getSnapshot = useCallback(() => ({ ...snapshotRef.current }), []);

  return { snapshot, getSnapshot };
}

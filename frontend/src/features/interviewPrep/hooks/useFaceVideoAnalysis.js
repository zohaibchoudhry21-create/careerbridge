import { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import {
  LIVE_VIDEO_SAMPLE_INTERVAL_MS,
  LIVE_VIDEO_SAMPLE_INTERVAL_SLOW_MS,
} from '../constants/interviewPrepConstants';
import { aggregateVideoFrameSamples } from '../utils/videoAnalysisMetrics.js';

const MODEL_URL = '/models';

let modelsLoadPromise = null;

const loadModels = () => {
  if (!modelsLoadPromise) {
    modelsLoadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
  }
  return modelsLoadPromise;
};

export function preloadInterviewFaceModels() {
  return loadModels();
}

const computeEyeContactPercent = (detection, videoWidth, videoHeight) => {
  const box = detection.detection.box;
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;

  const dx = Math.abs(faceCenterX - videoWidth / 2) / (videoWidth / 2 || 1);
  const dy = Math.abs(faceCenterY - videoHeight / 2) / (videoHeight / 2 || 1);
  const centerScore = 1 - Math.min(1, dx * 0.65 + dy * 0.35);

  const faceAreaRatio = (box.width * box.height) / (videoWidth * videoHeight || 1);
  const sizeScore = Math.min(1, faceAreaRatio / 0.12);

  const landmarks = detection.landmarks;
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();

  const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
  const noseOffset = Math.abs(nose[3].x - eyeMidX) / (box.width || 1);
  const forwardScore = 1 - Math.min(1, noseOffset * 4);

  const combined = centerScore * 0.45 + sizeScore * 0.25 + forwardScore * 0.3;
  return Math.round(Math.min(100, Math.max(0, combined * 100)));
};

/**
 * Samples face-api.js on the live <video> element while `enabled` (typically during recording).
 * Aggregates incrementally via aggregateVideoFrameSamples so submit can reuse the same metrics.
 */
export function useFaceVideoAnalysis(videoRef, enabled, options = {}) {
  const { showLiveIndicators = true, sampleIntervalMs } = options;

  const intervalMs =
    sampleIntervalMs ??
    (showLiveIndicators ? LIVE_VIDEO_SAMPLE_INTERVAL_MS : LIVE_VIDEO_SAMPLE_INTERVAL_SLOW_MS);

  const [modelsReady, setModelsReady] = useState(false);
  const [modelsError, setModelsError] = useState(null);
  const [latestSample, setLatestSample] = useState(null);
  const [liveAggregated, setLiveAggregated] = useState(null);

  const samplesRef = useRef([]);
  const intervalRef = useRef(null);
  const detectingRef = useRef(false);

  const pushSample = useCallback((sample) => {
    samplesRef.current.push(sample);
    setLatestSample(sample);
    setLiveAggregated(aggregateVideoFrameSamples(samplesRef.current));
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadModels()
      .then(() => {
        if (!cancelled) setModelsReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setModelsError(error);
          setModelsReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const resetSamples = useCallback(() => {
    samplesRef.current = [];
    setLatestSample(null);
    setLiveAggregated(null);
  }, []);

  const getAggregatedMetrics = useCallback(
    () => aggregateVideoFrameSamples(samplesRef.current),
    []
  );

  useEffect(() => {
    if (!enabled || !modelsReady || !videoRef?.current) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    const video = videoRef.current;
    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5,
    });

    intervalRef.current = window.setInterval(async () => {
      if (detectingRef.current || video.readyState < 2) return;

      detectingRef.current = true;

      try {
        const detection = await faceapi
          .detectSingleFace(video, detectorOptions)
          .withFaceLandmarks()
          .withFaceExpressions();

        if (!detection) {
          pushSample({ eyeContactPercent: 0, expressions: { neutral: 1 } });
        } else {
          const eyeContactPercent = computeEyeContactPercent(
            detection,
            video.videoWidth,
            video.videoHeight
          );
          pushSample({ eyeContactPercent, expressions: { ...detection.expressions } });
        }
      } catch {
        // ignore intermittent detection errors
      } finally {
        detectingRef.current = false;
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, modelsReady, videoRef, intervalMs, pushSample]);

  return {
    modelsReady,
    modelsError,
    latestSample,
    liveAggregated,
    resetSamples,
    getAggregatedMetrics,
  };
}

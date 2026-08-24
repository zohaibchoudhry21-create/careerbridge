import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LIVE_VIDEO_SAMPLE_INTERVAL_MS,
  LIVE_VIDEO_SAMPLE_INTERVAL_SLOW_MS,
} from '../constants/interviewPrepConstants';
import {
  STRANGER_DESCRIPTOR_DISTANCE_THRESHOLD,
  STRANGER_REFERENCE_MIN_EYE_CONTACT,
  STRANGER_REFERENCE_MIN_SCORE,
  STRANGER_REFERENCE_SAMPLE_COUNT,
} from '../config/behavioralMonitoringConfig.js';
import { aggregateVideoFrameSamples } from '../utils/videoAnalysisMetrics.js';
import {
  classifyLookingDirection,
  computeCameraFocusHeuristic,
  computeEyeContactPercent,
  estimateHeadPoseFromLandmarks,
} from '../utils/headPoseUtils.js';
import {
  getDominantExpression,
  isSmileSample,
} from '../utils/behavioralAnalysisUtils.js';

const MODEL_URL = '/models';

let modelsLoadPromise = null;
let faceApiModule = null;
/** @type {boolean | null} */
let recognitionNetAvailable = null;

const loadModels = async () => {
  if (!modelsLoadPromise) {
    modelsLoadPromise = (async () => {
      faceApiModule = await import('face-api.js');
      await Promise.all([
        faceApiModule.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceApiModule.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceApiModule.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      // Optional: FaceRecognitionNet for stranger / primary-face matching.
      // Gracefully disable if weights are missing — other metrics still work.
      try {
        await faceApiModule.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        recognitionNetAvailable = true;
      } catch {
        recognitionNetAvailable = false;
        console.info(
          '[interview-monitoring] FaceRecognitionNet unavailable; stranger detection disabled.'
        );
      }

      return faceApiModule;
    })();
  }
  return modelsLoadPromise;
};

export function preloadInterviewFaceModels() {
  return loadModels();
}

const euclideanDistance = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};

const averageDescriptor = (descriptors) => {
  if (!descriptors.length) return null;
  const len = descriptors[0].length;
  const avg = new Float32Array(len);
  for (const desc of descriptors) {
    for (let i = 0; i < len; i += 1) avg[i] += desc[i];
  }
  for (let i = 0; i < len; i += 1) avg[i] /= descriptors.length;
  return avg;
};

const pickPrimaryDetection = (detections) => {
  if (!detections?.length) return null;
  return detections.reduce((best, current) => {
    const bestScore = best?.detection?.score ?? 0;
    const currentScore = current?.detection?.score ?? 0;
    return currentScore > bestScore ? current : best;
  }, detections[0]);
};

/**
 * Samples face-api.js on the live <video> element while `enabled`.
 * Aggregates incrementally via aggregateVideoFrameSamples so submit can reuse metrics.
 */
export function useFaceVideoAnalysis(videoRef, enabled, options = {}) {
  const { showLiveIndicators = true, sampleIntervalMs, videoEpoch = 0 } = options;

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
  const faceApiRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const referenceDescriptorsRef = useRef([]);
  const lockedReferenceRef = useRef(null);

  const pushSample = useCallback(
    (sample) => {
      samplesRef.current.push(sample);
      setLatestSample(sample);
      setLiveAggregated(
        aggregateVideoFrameSamples(samplesRef.current, { sampleIntervalMs: intervalMs })
      );
    },
    [intervalMs]
  );

  useEffect(() => {
    let cancelled = false;

    loadModels()
      .then((faceapi) => {
        if (!cancelled) {
          faceApiRef.current = faceapi;
          setModelsReady(true);
        }
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
    sessionStartedAtRef.current = null;
    referenceDescriptorsRef.current = [];
    lockedReferenceRef.current = null;
    setLatestSample(null);
    setLiveAggregated(null);
  }, []);

  const getAggregatedMetrics = useCallback(
    () => aggregateVideoFrameSamples(samplesRef.current, { sampleIntervalMs: intervalMs }),
    [intervalMs]
  );

  useEffect(() => {
    if (!enabled || !modelsReady) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    const faceapi = faceApiRef.current;
    if (!faceapi) return undefined;

    if (!sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5,
    });

    const useRecognition = recognitionNetAvailable === true;
    const DETECT_TIMEOUT_MS = Math.max(1500, intervalMs * 3);

    intervalRef.current = window.setInterval(async () => {
      // Always read the live node — remounts leave a stale element if we close over it.
      const video = videoRef?.current;
      if (detectingRef.current || !video || video.readyState < 2 || video.videoWidth <= 0) {
        return;
      }

      detectingRef.current = true;

      try {
        const tMs = Math.max(0, Date.now() - (sessionStartedAtRef.current || Date.now()));
        const videoWidth = video.videoWidth || 1;
        const videoHeight = video.videoHeight || 1;

        const detectPromise = useRecognition
          ? faceapi
              .detectAllFaces(video, detectorOptions)
              .withFaceLandmarks()
              .withFaceExpressions()
              .withFaceDescriptors()
          : faceapi
              .detectAllFaces(video, detectorOptions)
              .withFaceLandmarks()
              .withFaceExpressions();

        const detections = await Promise.race([
          detectPromise,
          new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('face-detect-timeout')), DETECT_TIMEOUT_MS);
          }),
        ]);

        const faceCount = detections?.length || 0;

        if (!faceCount) {
          pushSample({
            tMs,
            eyeContactPercent: 0,
            expressions: { neutral: 1 },
            faceCount: 0,
            detectionScore: null,
            faceAreaRatio: null,
            headPose: null,
            lookingDirection: 'none',
            isLookingAway: true,
            isSmiling: false,
            dominantExpression: 'neutral',
            isPrimaryMatch: null,
            strangerDetectionEnabled: useRecognition,
            cameraFocusScore: null,
          });
          return;
        }

        const primary = pickPrimaryDetection(detections);
        const box = primary.detection.box;
        const detectionScore = Number(primary.detection.score) || 0;
        const faceAreaRatio = (box.width * box.height) / (videoWidth * videoHeight || 1);
        const eyeContactPercent = computeEyeContactPercent(primary, videoWidth, videoHeight);
        const headPose = estimateHeadPoseFromLandmarks(primary.landmarks);
        const lookingDirection = classifyLookingDirection(headPose, {
          eyeContactPercent,
          faceCount,
        });
        const isLookingAway =
          lookingDirection === 'away' ||
          lookingDirection === 'left' ||
          lookingDirection === 'right' ||
          lookingDirection === 'down' ||
          lookingDirection === 'none';
        const expressions = { ...(primary.expressions || {}) };
        const dominantExpression = getDominantExpression(expressions);
        const isSmiling = isSmileSample(expressions);
        const cameraFocusScore = computeCameraFocusHeuristic({
          detectionScore,
          faceAreaRatio,
          faceCount,
        });

        let isPrimaryMatch = null;
        if (useRecognition && primary.descriptor) {
          if (!lockedReferenceRef.current) {
            if (
              faceCount === 1 &&
              detectionScore >= STRANGER_REFERENCE_MIN_SCORE &&
              eyeContactPercent >= STRANGER_REFERENCE_MIN_EYE_CONTACT
            ) {
              referenceDescriptorsRef.current.push(primary.descriptor);
              if (referenceDescriptorsRef.current.length >= STRANGER_REFERENCE_SAMPLE_COUNT) {
                lockedReferenceRef.current = averageDescriptor(
                  referenceDescriptorsRef.current
                );
              }
            }
          } else {
            // Stranger if any detected face is far from the locked candidate reference.
            const anyMismatch = detections.some((det) => {
              if (!det.descriptor) return false;
              return (
                euclideanDistance(lockedReferenceRef.current, det.descriptor) >
                STRANGER_DESCRIPTOR_DISTANCE_THRESHOLD
              );
            });
            isPrimaryMatch = !anyMismatch;
          }
        }

        pushSample({
          tMs,
          eyeContactPercent,
          expressions,
          faceCount,
          detectionScore: Number(detectionScore.toFixed(3)),
          faceAreaRatio: Number(faceAreaRatio.toFixed(4)),
          headPose,
          lookingDirection,
          isLookingAway,
          isSmiling,
          dominantExpression,
          isPrimaryMatch,
          strangerDetectionEnabled: useRecognition,
          cameraFocusScore,
        });
      } catch {
        // ignore intermittent detection errors / timeouts
      } finally {
        detectingRef.current = false;
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      detectingRef.current = false;
    };
  }, [enabled, modelsReady, videoRef, intervalMs, pushSample, videoEpoch]);

  return {
    modelsReady,
    modelsError,
    latestSample,
    liveAggregated,
    resetSamples,
    getAggregatedMetrics,
  };
}

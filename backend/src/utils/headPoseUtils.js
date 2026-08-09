/**
 * Head-pose / looking-direction helpers from face-api 68-point landmarks.
 * Keep in sync with frontend/src/features/interviewPrep/utils/headPoseUtils.js
 */

import {
  CAMERA_FOCUS_IDEAL_FACE_AREA_RATIO,
  CAMERA_FOCUS_MAX_FACE_AREA_RATIO,
  CAMERA_FOCUS_MIN_DETECTION_SCORE,
  CAMERA_FOCUS_MIN_FACE_AREA_RATIO,
  CAMERA_FOCUS_WEIGHTS,
  EYE_CONTACT_AWAY_THRESHOLD,
  HEAD_PITCH_DOWN_THRESHOLD,
  HEAD_YAW_LOOK_THRESHOLD,
} from '../config/behavioralMonitoringConfig.js';

const meanPoint = (points = []) => {
  if (!points.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += Number(p.x) || 0;
    sy += Number(p.y) || 0;
  }
  return { x: sx / points.length, y: sy / points.length };
};

const dist = (a, b) => {
  const dx = (a?.x || 0) - (b?.x || 0);
  const dy = (a?.y || 0) - (b?.y || 0);
  return Math.hypot(dx, dy);
};

/**
 * Estimate yaw/pitch from landmark geometry (no 3D pose model).
 * yaw: negative = candidate looking left (nose toward viewer's right)
 * pitch: higher = looking down
 *
 * @param {object} landmarks face-api FaceLandmarks68 (or plain { getLeftEye, ... })
 * @returns {{ yaw: number, pitch: number } | null}
 */
export const estimateHeadPoseFromLandmarks = (landmarks) => {
  if (!landmarks || typeof landmarks.getLeftEye !== 'function') return null;

  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const jaw = landmarks.getJawOutline();

  if (!leftEye?.length || !rightEye?.length || !nose?.length || !jaw?.length) {
    return null;
  }

  const leftCenter = meanPoint(leftEye);
  const rightCenter = meanPoint(rightEye);
  const eyeMid = {
    x: (leftCenter.x + rightCenter.x) / 2,
    y: (leftCenter.y + rightCenter.y) / 2,
  };
  const interocular = dist(leftCenter, rightCenter) || 1;

  // face-api nose tip is typically index 3 on the nose chain
  const noseTip = nose[3] || nose[nose.length - 1];
  const yaw = (noseTip.x - eyeMid.x) / interocular;

  const chin = jaw[Math.floor(jaw.length / 2)] || jaw[jaw.length - 1];
  const eyeToChin = Math.max(1, (chin?.y || 0) - eyeMid.y);
  const noseToEye = (noseTip.y || 0) - eyeMid.y;
  const pitch = noseToEye / eyeToChin;

  return {
    yaw: Number(yaw.toFixed(4)),
    pitch: Number(pitch.toFixed(4)),
  };
};

/**
 * @param {{ yaw?: number, pitch?: number } | null} headPose
 * @param {{ eyeContactPercent?: number, faceCount?: number }} [context]
 * @returns {'none'|'center'|'left'|'right'|'down'|'away'}
 */
export const classifyLookingDirection = (headPose, context = {}) => {
  if (context.faceCount === 0) return 'none';
  if (!headPose) {
    const eye = Number(context.eyeContactPercent);
    if (Number.isFinite(eye) && eye < EYE_CONTACT_AWAY_THRESHOLD) return 'away';
    return 'center';
  }

  const { yaw = 0, pitch = 0 } = headPose;

  if (pitch >= HEAD_PITCH_DOWN_THRESHOLD) return 'down';
  if (yaw <= -HEAD_YAW_LOOK_THRESHOLD) return 'left';
  if (yaw >= HEAD_YAW_LOOK_THRESHOLD) return 'right';

  const eye = Number(context.eyeContactPercent);
  if (Number.isFinite(eye) && eye < EYE_CONTACT_AWAY_THRESHOLD) return 'away';

  return 'center';
};

/**
 * Camera-focus heuristic from detection confidence + face framing size.
 * Not optical blur measurement — documented size/confidence proxy only.
 *
 * @returns {number | null} 0–100 or null when unmeasurable
 */
export const computeCameraFocusHeuristic = ({
  detectionScore,
  faceAreaRatio,
  faceCount = 1,
} = {}) => {
  if (!faceCount || faceCount < 1) return null;

  const score = Number(detectionScore);
  const area = Number(faceAreaRatio);
  if (!Number.isFinite(score) && !Number.isFinite(area)) return null;

  let detectionComponent = 0;
  if (Number.isFinite(score)) {
    const clamped = Math.min(1, Math.max(0, score));
    // Soft floor: scores below min still contribute but are penalized
    detectionComponent =
      clamped < CAMERA_FOCUS_MIN_DETECTION_SCORE
        ? (clamped / CAMERA_FOCUS_MIN_DETECTION_SCORE) * 0.65
        : 0.65 + ((clamped - CAMERA_FOCUS_MIN_DETECTION_SCORE) / (1 - CAMERA_FOCUS_MIN_DETECTION_SCORE)) * 0.35;
  }

  let sizeComponent = 0;
  if (Number.isFinite(area)) {
    if (area < CAMERA_FOCUS_MIN_FACE_AREA_RATIO || area > CAMERA_FOCUS_MAX_FACE_AREA_RATIO) {
      sizeComponent = 0.15;
    } else {
      const ideal = CAMERA_FOCUS_IDEAL_FACE_AREA_RATIO;
      const deviation = Math.abs(area - ideal) / ideal;
      sizeComponent = Math.max(0, 1 - Math.min(1, deviation));
    }
  } else if (Number.isFinite(score)) {
    // Size unknown — rely more on detection by renormalizing weights
    return Math.round(Math.min(100, Math.max(0, detectionComponent * 100)));
  }

  const combined =
    detectionComponent * CAMERA_FOCUS_WEIGHTS.detectionScore +
    sizeComponent * CAMERA_FOCUS_WEIGHTS.faceSize;

  return Math.round(Math.min(100, Math.max(0, combined * 100)));
};

/**
 * Eye-contact % from face box centering + size + forward nose alignment.
 * Same heuristic family as the original useFaceVideoAnalysis implementation.
 */
export const computeEyeContactPercent = (detection, videoWidth, videoHeight) => {
  if (!detection?.detection?.box) return 0;

  const box = detection.detection.box;
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;

  const dx = Math.abs(faceCenterX - videoWidth / 2) / (videoWidth / 2 || 1);
  const dy = Math.abs(faceCenterY - videoHeight / 2) / (videoHeight / 2 || 1);
  const centerScore = 1 - Math.min(1, dx * 0.65 + dy * 0.35);

  const faceAreaRatio = (box.width * box.height) / (videoWidth * videoHeight || 1);
  const sizeScore = Math.min(1, faceAreaRatio / CAMERA_FOCUS_IDEAL_FACE_AREA_RATIO);

  let forwardScore = 0.5;
  const landmarks = detection.landmarks;
  if (landmarks && typeof landmarks.getLeftEye === 'function') {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    if (leftEye?.length && rightEye?.length && nose?.length) {
      const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
      const noseTip = nose[3] || nose[nose.length - 1];
      const noseOffset = Math.abs(noseTip.x - eyeMidX) / (box.width || 1);
      forwardScore = 1 - Math.min(1, noseOffset * 4);
    }
  }

  const combined = centerScore * 0.45 + sizeScore * 0.25 + forwardScore * 0.3;
  return Math.round(Math.min(100, Math.max(0, combined * 100)));
};

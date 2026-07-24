/**
 * Avaturn interviewer avatar (GLB with T2 / face animations — Oculus visemes).
 *
 * Setup:
 * 1. https://avaturn.me → create avatar → export **Avatar (T-Pose)** with face blend shapes.
 * 2. Save as `frontend/public/models/interviewer/interviewer-avatar.glb`
 *    OR set `VITE_INTERVIEWER_AVATAR_URL` to the export httpURL.
 *
 * Animations: `npm run download:interviewer-avatar`
 */
export const INTERVIEWER_MODEL_URL =
  import.meta.env.VITE_INTERVIEWER_AVATAR_URL || '/models/interviewer/interviewer-avatar.glb';

export const INTERVIEWER_ANIMATION_URLS = {
  idle: '/models/interviewer/animations/idle.glb',
  thinking: '/models/interviewer/animations/thinking.glb',
  listening: '/models/interviewer/animations/listening.glb',
  speaking: '/models/interviewer/animations/speaking.glb',
};

export const INTERVIEWER_STATE_CLIP_KEY = {
  idle: 'idle',
  thinking: 'thinking',
  listening: 'listening',
  speaking: 'speaking',
};

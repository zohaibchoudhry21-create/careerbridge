/**
 * Combines live video/audio heuristics into 0–1 presence for subtle avatar reactivity.
 */
export function computeLivePresenceLevel({
  eyeContactPercent = 0,
  engagementScore = 0,
  averageVolume = 0,
  silenceRatio = 0,
}) {
  const eye = Math.min(100, Math.max(0, Number(eyeContactPercent) || 0));
  const engagement = Math.min(100, Math.max(0, Number(engagementScore) || 0));
  const volume = Math.min(1, Math.max(0, Number(averageVolume) || 0));
  const silence = Math.min(1, Math.max(0, Number(silenceRatio) || 0));

  const videoSignal = (eye / 100) * 0.55 + (engagement / 100) * 0.45;
  const audioSignal = volume > 0.04 ? Math.min(1, volume * 4) * (1 - silence * 0.5) : 0.15;

  return Number(Math.min(1, Math.max(0, videoSignal * 0.55 + audioSignal * 0.45)).toFixed(2));
}

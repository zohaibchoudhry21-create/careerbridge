/**
 * Lightweight WebGL capability check for avatar fallback.
 */
export function isWebGLAvailable() {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: true });

    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Prefer 2D avatar on coarse pointers / reduced motion unless user forces 3D.
 */
export function shouldPrefer2DAvatar() {
  if (typeof window === 'undefined') return true;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
  const lowMemory = typeof navigator !== 'undefined' && Number(navigator.deviceMemory) > 0 && navigator.deviceMemory < 4;

  return Boolean(reduceMotion || coarsePointer || lowMemory);
}

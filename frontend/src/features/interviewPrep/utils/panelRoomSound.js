/**
 * Soft room-enter chime via Web Audio (no external asset / npm package).
 * Callers must already respect user toggle + prefers-reduced-motion.
 */

let sharedCtx = null;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AC();
  }
  return sharedCtx;
};

/**
 * Play a short two-tone soft chime (~350ms).
 * @returns {Promise<void>}
 */
export const playRoomEnterChime = async () => {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    master.connect(ctx.destination);

    const tone = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.6, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    };

    tone(523.25, now, 0.18);
    tone(659.25, now + 0.12, 0.22);
  } catch {
    // Autoplay / AudioContext failures are non-fatal
  }
};

export const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

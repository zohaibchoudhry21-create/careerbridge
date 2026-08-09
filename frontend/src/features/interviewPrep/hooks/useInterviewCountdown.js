import { useEffect, useState } from 'react';

/** Soft heads-up threshold. */
export const COUNTDOWN_WARN_MS = 2 * 60 * 1000;
/** Stronger heads-up threshold. */
export const COUNTDOWN_CRITICAL_MS = 30 * 1000;
/**
 * After the planned duration, allow this much grace for a natural wrap-up
 * before the hard outer limit (duration + HARD_BUFFER_MS) force-ends the call.
 */
export const COUNTDOWN_HARD_BUFFER_MS = 2 * 60 * 1000;

/**
 * Format remaining (or zero) milliseconds as MM:SS.
 * @param {number} ms
 */
export const formatCountdownMmSs = (ms) => {
  const totalSec = Math.max(0, Math.floor(Number(ms) / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Timestamp-based interview countdown.
 * Elapsed = Date.now() - connectedAtMs (not a decrementing counter), so tab
 * blur / sleep / interval drift cannot skew the remaining time.
 *
 * @param {{ connectedAtMs: number|null, durationMinutes: number|null|undefined, active: boolean }} opts
 */
export function useInterviewCountdown({
  connectedAtMs = null,
  durationMinutes = 15,
  active = false,
} = {}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !connectedAtMs) return undefined;

    const syncNow = () => setNowMs(Date.now());
    syncNow();

    const intervalId = setInterval(syncNow, 250);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncNow();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', syncNow);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', syncNow);
    };
  }, [active, connectedAtMs]);

  const durationMs = Math.max(1, Number(durationMinutes) || 15) * 60 * 1000;
  const running = Boolean(active && connectedAtMs);
  const elapsedMs = running ? Math.max(0, nowMs - connectedAtMs) : 0;
  const remainingMs = running ? Math.max(0, durationMs - elapsedMs) : durationMs;
  const isExpired = running && elapsedMs >= durationMs;
  const hardLimitMs = durationMs + COUNTDOWN_HARD_BUFFER_MS;
  const isPastHardLimit = running && elapsedMs >= hardLimitMs;

  let urgency = 'idle';
  if (running) {
    if (isExpired) urgency = 'expired';
    else if (remainingMs <= COUNTDOWN_CRITICAL_MS) urgency = 'critical';
    else if (remainingMs <= COUNTDOWN_WARN_MS) urgency = 'warn';
    else urgency = 'normal';
  }

  return {
    durationMs,
    elapsedMs,
    remainingMs,
    display: formatCountdownMmSs(remainingMs),
    urgency,
    isExpired,
    isPastHardLimit,
    hardLimitMs,
  };
}

export default useInterviewCountdown;

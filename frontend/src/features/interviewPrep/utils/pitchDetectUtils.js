/**
 * Lightweight autocorrelation pitch estimate for Web Audio time-domain buffers.
 * Returns null when clarity is too low — never invents Hz.
 */

import { PITCH_CLARITY_MIN, PITCH_MAX_HZ, PITCH_MIN_HZ } from '../config/speechMonitoringConfig.js';

/**
 * @param {Uint8Array|Float32Array} timeDomain — byte (0–255) or float (-1–1)
 * @param {number} sampleRate
 * @returns {number|null} pitchHz
 */
export function estimatePitchHz(timeDomain, sampleRate) {
  const rate = Number(sampleRate);
  if (!timeDomain?.length || !Number.isFinite(rate) || rate <= 0) return null;

  const size = timeDomain.length;
  const samples = new Float32Array(size);
  let isByte = false;

  for (let i = 0; i < size; i += 1) {
    const v = timeDomain[i];
    if (v > 1 || v < -1) {
      isByte = true;
      break;
    }
  }

  let rms = 0;
  for (let i = 0; i < size; i += 1) {
    const n = isByte || timeDomain[i] > 1 ? (timeDomain[i] - 128) / 128 : timeDomain[i];
    samples[i] = n;
    rms += n * n;
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return null;

  const minLag = Math.floor(rate / PITCH_MAX_HZ);
  const maxLag = Math.min(size - 1, Math.floor(rate / PITCH_MIN_HZ));
  if (maxLag <= minLag) return null;

  let bestLag = -1;
  let bestCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let corr = 0;
    let normA = 0;
    let normB = 0;
    const n = size - lag;
    for (let i = 0; i < n; i += 1) {
      const a = samples[i];
      const b = samples[i + lag];
      corr += a * b;
      normA += a * a;
      normB += b * b;
    }
    const denom = Math.sqrt(normA * normB) || 1e-9;
    const clarity = corr / denom;
    if (clarity > bestCorr) {
      bestCorr = clarity;
      bestLag = lag;
    }
  }

  if (bestLag < 0 || bestCorr < PITCH_CLARITY_MIN) return null;

  const hz = rate / bestLag;
  if (hz < PITCH_MIN_HZ || hz > PITCH_MAX_HZ) return null;
  return Number(hz.toFixed(1));
}

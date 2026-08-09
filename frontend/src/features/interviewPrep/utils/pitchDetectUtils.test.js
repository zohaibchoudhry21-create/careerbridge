import { describe, expect, it } from 'vitest';
import { estimatePitchHz } from './pitchDetectUtils.js';

function synthesizeSineByteBuffer(hz, sampleRate, length) {
  const data = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * hz * t);
    data[i] = Math.round(128 + sample * 60);
  }
  return data;
}

describe('estimatePitchHz', () => {
  it('estimates pitch near a synthetic 150Hz tone', () => {
    const sampleRate = 48000;
    const buffer = synthesizeSineByteBuffer(150, sampleRate, 2048);
    const hz = estimatePitchHz(buffer, sampleRate);
    expect(hz).not.toBeNull();
    expect(hz).toBeGreaterThan(130);
    expect(hz).toBeLessThan(170);
  });

  it('returns null for near-silence', () => {
    const data = new Uint8Array(2048).fill(128);
    expect(estimatePitchHz(data, 48000)).toBeNull();
  });
});

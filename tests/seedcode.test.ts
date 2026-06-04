import { describe, it, expect } from 'vitest';
import { encodeRunCode, decodeRunCode, dailySeedFor } from '../src/game/seedcode';

describe('encodeRunCode / decodeRunCode', () => {
  it('round-trips a (character, seed) pair', () => {
    const code = encodeRunCode('pilot', 1234567);
    const decoded = decodeRunCode(code);
    expect(decoded).toEqual({ characterId: 'pilot', seed: 1234567 });
  });

  it('round-trips across the full uint32 range', () => {
    for (const seed of [0, 1, 255, 65535, 0x7fffffff, 0xffffffff]) {
      const decoded = decodeRunCode(encodeRunCode('saboteur', seed));
      expect(decoded?.seed).toBe(seed >>> 0);
      expect(decoded?.characterId).toBe('saboteur');
    }
  });

  it('is case-insensitive and tolerates surrounding whitespace', () => {
    const code = encodeRunCode('engineer', 42);
    const decoded = decodeRunCode(`  ${code.toUpperCase()}  `);
    expect(decoded).toEqual({ characterId: 'engineer', seed: 42 });
  });

  it('rejects malformed codes', () => {
    expect(decodeRunCode('')).toBeNull();
    expect(decodeRunCode('nodelimiter')).toBeNull();
    expect(decodeRunCode('-3kf09a')).toBeNull(); // empty character segment
    expect(decodeRunCode('pilot-')).toBeNull(); // empty seed segment
    expect(decodeRunCode('pilot-zzz!!')).toBeNull(); // non-base36 seed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(decodeRunCode(undefined as unknown as string)).toBeNull();
  });

  it('keeps the last dash as the separator (character ids never contain one, but be safe)', () => {
    // If a future id had a dash, lastIndexOf keeps the seed intact.
    const decoded = decodeRunCode('two-part-1a');
    expect(decoded).toEqual({ characterId: 'two-part', seed: parseInt('1a', 36) });
  });
});

describe('dailySeedFor', () => {
  it('is deterministic per date', () => {
    expect(dailySeedFor('2026-06-04')).toBe(dailySeedFor('2026-06-04'));
  });

  it('differs across dates', () => {
    expect(dailySeedFor('2026-06-04')).not.toBe(dailySeedFor('2026-06-05'));
  });

  it('returns a 32-bit unsigned integer', () => {
    const s = dailySeedFor('2026-06-04');
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(0xffffffff);
  });
});

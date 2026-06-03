import { describe, it, expect, beforeEach } from 'vitest';
import { nextFromState, makeCursor, randomSeed, seedFromString } from '../src/game/rng';
import { startRun, clearSavedRun } from '../src/game/run';
import { clearMeta } from '../src/game/meta';
import type { MapNode } from '../src/game/map';

// ===== Pure step =====

describe('nextFromState', () => {
  it('is pure — the same input state always yields the same output', () => {
    const a = nextFromState(12345);
    const b = nextFromState(12345);
    expect(a).toEqual(b);
  });

  it('returns a float in [0, 1)', () => {
    let state = 1;
    for (let i = 0; i < 1000; i++) {
      const step = nextFromState(state);
      expect(step.value).toBeGreaterThanOrEqual(0);
      expect(step.value).toBeLessThan(1);
      state = step.state;
    }
  });

  it('advances the state (does not get stuck)', () => {
    const first = nextFromState(0);
    const second = nextFromState(first.state);
    expect(second.state).not.toBe(first.state);
    expect(second.value).not.toBe(first.value);
  });
});

// ===== Cursor =====

describe('makeCursor', () => {
  it('produces an identical sequence for the same seed', () => {
    const a = makeCursor(777);
    const b = makeCursor(777);
    const seqA = Array.from({ length: 20 }, () => a.draw());
    const seqB = Array.from({ length: 20 }, () => b.draw());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = makeCursor(1);
    const b = makeCursor(2);
    const seqA = Array.from({ length: 20 }, () => a.draw());
    const seqB = Array.from({ length: 20 }, () => b.draw());
    expect(seqA).not.toEqual(seqB);
  });

  it('resumes exactly from a snapshotted state (the save/load contract)', () => {
    // Draw 5 from one continuous cursor — the reference sequence.
    const ref = makeCursor(42);
    const full = Array.from({ length: 5 }, () => ref.draw());

    // Now simulate a save mid-sequence: draw 3, snapshot the cursor state,
    // then build a FRESH cursor from that state and draw the remaining 2.
    const before = makeCursor(42);
    const head = [before.draw(), before.draw(), before.draw()];
    const resumed = makeCursor(before.state);
    const tail = [resumed.draw(), resumed.draw()];

    expect([...head, ...tail]).toEqual(full);
  });
});

// ===== Seed helpers =====

describe('seed helpers', () => {
  it('randomSeed returns a 32-bit unsigned integer', () => {
    for (let i = 0; i < 50; i++) {
      const s = randomSeed();
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('seedFromString is deterministic and order-sensitive', () => {
    expect(seedFromString('2026-06-03')).toBe(seedFromString('2026-06-03'));
    expect(seedFromString('2026-06-03')).not.toBe(seedFromString('2026-06-04'));
    expect(seedFromString('ab')).not.toBe(seedFromString('ba'));
  });
});

// ===== Integration: seeded runs are reproducible =====

describe('seeded run reproducibility', () => {
  beforeEach(() => {
    clearMeta();
    clearSavedRun();
  });

  // Serialize a map to a comparable shape: every node's kind + its outgoing
  // edges, ordered by node id. Two structurally identical maps produce the
  // same string.
  function mapFingerprint(nodes: Map<string, MapNode>): string {
    return Array.from(nodes.values())
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((n) => `${n.id}:${n.kind}:${n.next.slice().sort().join(',')}`)
      .join('|');
  }

  it('the same seed generates the same starting map', () => {
    const a = startRun('pilot', 1234567);
    const fpA = mapFingerprint(a.map.nodes);
    clearSavedRun();
    clearMeta();
    const b = startRun('pilot', 1234567);
    const fpB = mapFingerprint(b.map.nodes);
    expect(fpB).toBe(fpA);
    expect(b.seed).toBe(1234567);
  });

  it('different seeds generate different maps', () => {
    const a = startRun('pilot', 111);
    const fpA = mapFingerprint(a.map.nodes);
    clearSavedRun();
    clearMeta();
    const b = startRun('pilot', 999999);
    const fpB = mapFingerprint(b.map.nodes);
    expect(fpB).not.toBe(fpA);
  });

  it('records the seed and advances rngState off the raw seed during map gen', () => {
    const run = startRun('pilot', 5550123);
    expect(run.seed).toBe(5550123);
    // Map generation consumes draws, so the live cursor must have moved on
    // from the bare seed — otherwise nothing was actually seeded.
    expect(run.rngState).not.toBe(5550123);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadMeta,
  clearMeta,
  recordRunStart,
  recordRunWin,
  recordActReached,
  recordBossDefeated,
  isCharacterUnlocked,
  unlockCharacter,
  unlockCharactersForAct,
  unlockRequirementFor
} from '../src/game/meta';

// Vitest runs Node without a `window`/`localStorage` global. The meta
// module's load/save helpers catch missing-storage and fall back to an
// in-memory cache — exactly what we want for tests. Each test starts
// from a clean cache via clearMeta() so prior tests don't leak state.

beforeEach(() => {
  clearMeta();
});

describe('RunHistory — fresh meta', () => {
  it('emptyMeta has a zeroed history block', () => {
    const m = loadMeta();
    expect(m.history).toBeDefined();
    expect(m.history?.runsStarted).toBe(0);
    expect(m.history?.runsWon).toBe(0);
    expect(m.history?.bestAct).toBe(0);
    expect(m.history?.bossesDefeated).toBe(0);
    expect(m.history?.bestAscensionCleared).toBe(0);
    expect(m.history?.perCharacter).toEqual({});
  });
});

describe('recordRunStart', () => {
  it('increments runsStarted and per-character runs', () => {
    recordRunStart('pilot');
    recordRunStart('pilot');
    recordRunStart('conductor');
    const m = loadMeta();
    expect(m.history?.runsStarted).toBe(3);
    expect(m.history?.perCharacter.pilot?.runs).toBe(2);
    expect(m.history?.perCharacter.conductor?.runs).toBe(1);
    expect(m.history?.perCharacter.pilot?.wins).toBe(0);
  });
});

describe('recordRunWin', () => {
  it('increments runsWon and per-character wins', () => {
    recordRunStart('pilot');
    recordRunWin('pilot', 0);
    const m = loadMeta();
    expect(m.history?.runsWon).toBe(1);
    expect(m.history?.perCharacter.pilot?.wins).toBe(1);
  });

  it('updates bestAscensionCleared when a higher ascension is cleared', () => {
    recordRunWin('pilot', 0);
    expect(loadMeta().history?.bestAscensionCleared).toBe(0);
    recordRunWin('pilot', 3);
    expect(loadMeta().history?.bestAscensionCleared).toBe(3);
    recordRunWin('pilot', 1); // lower ascension shouldn't lower the record
    expect(loadMeta().history?.bestAscensionCleared).toBe(3);
  });
});

describe('recordActReached', () => {
  it('updates bestAct only when the new value is higher', () => {
    recordActReached(2);
    expect(loadMeta().history?.bestAct).toBe(2);
    recordActReached(5);
    expect(loadMeta().history?.bestAct).toBe(5);
    recordActReached(1); // shouldn't roll back
    expect(loadMeta().history?.bestAct).toBe(5);
  });
});

describe('recordBossDefeated', () => {
  it('increments bossesDefeated for every call', () => {
    recordBossDefeated();
    recordBossDefeated();
    recordBossDefeated();
    expect(loadMeta().history?.bossesDefeated).toBe(3);
  });
});

describe('history schema migration', () => {
  // Migration tests write a raw JSON blob directly to localStorage so
  // we can simulate "old saves" without going through saveMeta (which
  // would re-encode using the current shape). beforeEach already calls
  // clearMeta() so the in-memory cache is reset before each test.
  const META_KEY = 'rust-and-rivets/meta/v1';

  it('hydrates a save that predates the history field', () => {
    // Simulate a Slice 51-era save: valid schema, no history block.
    const legacy = {
      version: 1,
      points: 7,
      levels: { reinforcedHull: 2 },
      currentAscension: 1,
      highestAscension: 3
    };
    localStorage.setItem(META_KEY, JSON.stringify(legacy));

    const loaded = loadMeta();
    expect(loaded.history).toBeDefined();
    expect(loaded.history?.runsStarted).toBe(0);
    expect(loaded.history?.perCharacter).toEqual({});
    // Old fields preserved
    expect(loaded.points).toBe(7);
    expect(loaded.levels.reinforcedHull).toBe(2);
    expect(loaded.currentAscension).toBe(1);
    expect(loaded.highestAscension).toBe(3);
  });

  it('hydrates a partial history block, defaulting missing fields', () => {
    const legacy = {
      version: 1,
      points: 0,
      levels: {},
      currentAscension: 0,
      highestAscension: 0,
      history: { runsStarted: 4, runsWon: 1 }
    };
    localStorage.setItem(META_KEY, JSON.stringify(legacy));

    const loaded = loadMeta();
    expect(loaded.history?.runsStarted).toBe(4);
    expect(loaded.history?.runsWon).toBe(1);
    expect(loaded.history?.bestAct).toBe(0); // defaulted
    expect(loaded.history?.bossesDefeated).toBe(0); // defaulted
    expect(loaded.history?.perCharacter).toEqual({}); // defaulted
  });
});

describe('character unlocks', () => {
  it('only the base Pilot is unlocked in a fresh save', () => {
    expect(isCharacterUnlocked('pilot')).toBe(true);
    expect(isCharacterUnlocked('engineer')).toBe(false);
    expect(isCharacterUnlocked('saboteur')).toBe(false);
    expect(isCharacterUnlocked('stoker')).toBe(false);
    expect(isCharacterUnlocked('conductor')).toBe(false);
  });

  it('unlockCharacter is idempotent', () => {
    expect(unlockCharacter('engineer')).toBe(true);
    expect(unlockCharacter('engineer')).toBe(false); // already unlocked
    expect(isCharacterUnlocked('engineer')).toBe(true);
  });

  it('the unlock ladder grants pilots at the right acts', () => {
    // Beat Act 1 → Engineer
    expect(unlockCharactersForAct(1)).toEqual(['engineer']);
    expect(isCharacterUnlocked('engineer')).toBe(true);
    expect(isCharacterUnlocked('saboteur')).toBe(false);
    // Beat Act 2 → Saboteur (Engineer already unlocked, not re-listed)
    expect(unlockCharactersForAct(2)).toEqual(['saboteur']);
    // Beat Act 3 → Stoker
    expect(unlockCharactersForAct(3)).toEqual(['stoker']);
    // Beat Act 4 → nothing new (Conductor needs Act 5)
    expect(unlockCharactersForAct(4)).toEqual([]);
    // Beat Act 5 (full run win) → Conductor
    expect(unlockCharactersForAct(5)).toEqual(['conductor']);
  });

  it('a high-act run unlocks everything below it in one shot', () => {
    // Brand new save, skipped straight to clearing Act 5 (impossible in
    // game but the helper should be additive — every rung at or below
    // the clear unlocks).
    const granted = unlockCharactersForAct(5);
    expect(granted.sort()).toEqual(['conductor', 'engineer', 'saboteur', 'stoker']);
  });

  it('unlockRequirementFor returns the ladder label for locked pilots', () => {
    expect(unlockRequirementFor('engineer')).toBe('Beat Act 1');
    expect(unlockRequirementFor('saboteur')).toBe('Beat Act 2');
    expect(unlockRequirementFor('stoker')).toBe('Beat Act 3');
    expect(unlockRequirementFor('conductor')).toBe('Win a full run');
    expect(unlockRequirementFor('pilot')).toBeNull();
  });
});

describe('v1 → v2 migration', () => {
  const META_KEY = 'rust-and-rivets/meta/v1';

  it('strips an old v1 save back to only the Pilot unlocked', () => {
    // Player had a Slice-51 save with workshop progress and ascension
    // unlocks but no unlock list at all.
    const legacyV1 = {
      version: 1,
      points: 12,
      levels: { reinforcedHull: 3, foundryStipend: 1 },
      currentAscension: 2,
      highestAscension: 4,
      history: {
        runsStarted: 7,
        runsWon: 2,
        bestAct: 5,
        bossesDefeated: 9,
        bestAscensionCleared: 2,
        perCharacter: { pilot: { runs: 4, wins: 1 }, stoker: { runs: 3, wins: 1 } }
      }
    };
    localStorage.setItem(META_KEY, JSON.stringify(legacyV1));

    const loaded = loadMeta();
    expect(loaded.version).toBe(2);
    expect(loaded.unlockedCharacters).toEqual(['pilot']);
    // History counters MUST survive — they're the proof of past play.
    expect(loaded.history?.runsStarted).toBe(7);
    expect(loaded.history?.bestAct).toBe(5);
    expect(loaded.history?.perCharacter.stoker).toEqual({ runs: 3, wins: 1 });
    // Workshop progress also preserved
    expect(loaded.points).toBe(12);
    expect(loaded.levels.reinforcedHull).toBe(3);
  });

  it('preserves an explicit v2 unlock list on subsequent loads', () => {
    const v2Save = {
      version: 2,
      points: 0,
      levels: {},
      currentAscension: 0,
      highestAscension: 0,
      history: {
        runsStarted: 1,
        runsWon: 0,
        bestAct: 2,
        bossesDefeated: 1,
        bestAscensionCleared: 0,
        perCharacter: { pilot: { runs: 1, wins: 0 } }
      },
      unlockedCharacters: ['pilot', 'engineer']
    };
    localStorage.setItem(META_KEY, JSON.stringify(v2Save));

    const loaded = loadMeta();
    expect(loaded.unlockedCharacters).toEqual(['pilot', 'engineer']);
  });

  it('falls back to emptyMeta when the version is higher than we can read', () => {
    const future = {
      version: 99,
      points: 1000,
      levels: {},
      currentAscension: 0,
      highestAscension: 0
    };
    localStorage.setItem(META_KEY, JSON.stringify(future));

    const loaded = loadMeta();
    // Future-version saves drop to a fresh empty meta instead of being
    // silently downgraded into a broken intermediate state.
    expect(loaded.version).toBe(2);
    expect(loaded.points).toBe(0);
    expect(loaded.unlockedCharacters).toEqual(['pilot']);
  });
});

describe('full-run scenario', () => {
  it('a winning act-5 run produces a coherent ledger', () => {
    recordRunStart('conductor');
    recordBossDefeated();
    recordActReached(2);
    recordBossDefeated();
    recordActReached(3);
    recordBossDefeated();
    recordActReached(4);
    recordBossDefeated();
    recordActReached(5);
    recordBossDefeated();
    recordActReached(5); // final boss kill, isFinalAct keeps it at 5
    recordRunWin('conductor', 2);

    const h = loadMeta().history!;
    expect(h.runsStarted).toBe(1);
    expect(h.runsWon).toBe(1);
    expect(h.bestAct).toBe(5);
    expect(h.bossesDefeated).toBe(5);
    expect(h.bestAscensionCleared).toBe(2);
    expect(h.perCharacter.conductor).toEqual({ runs: 1, wins: 1 });
  });
});

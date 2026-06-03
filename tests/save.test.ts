import { describe, it, expect, beforeEach } from 'vitest';
import { SAVE_KEY, readSave, hasSave, clearSave, writeSave } from '../src/game/save';
import type { RunState } from '../src/game/run';
import { POTION_SLOT_COUNT } from '../src/game/potions';

// These tests pin down the save hydrate/migration contract — the scariest
// class of bug in this game is a schema change that silently corrupts a
// real player's in-progress run. We write raw JSON straight to localStorage
// (simulating "what's on disk") and assert that readSave() either hydrates
// it into a coherent RunState or rejects it cleanly.
//
// readSave() gates strictly on `version === SCHEMA_VERSION`, so every blob
// that should hydrate carries the CURRENT version. The migration surface
// being tested is the *additive* one: optional fields introduced across
// slices that older v-current saves may be missing, which hydrate() fills
// with `?? defaults`.

const SCHEMA_VERSION = 4; // mirror of save.ts SCHEMA_VERSION

// Minimal one-floor map so hydrate has something map-shaped to chew on.
function rawMap() {
  return {
    floors: 1,
    width: 5,
    nodes: [{ id: '0-2', floor: 0, col: 2, kind: 'combat', next: [] }],
    entryNodeIds: ['0-2'],
    bossNodeId: '14-2'
  };
}

// A fully-populated current-version save blob. Individual tests clone this
// and delete/override fields to simulate older or partial saves.
function fullBlob() {
  return {
    version: SCHEMA_VERSION,
    act: 2,
    map: rawMap(),
    currentNodeId: '0-2',
    visitedNodeIds: ['0-1'],
    player: {
      hull: 40,
      maxHull: 60,
      deck: ['strike', 'strike', 'guard'],
      characterId: 'engineer',
      maxSteam: 3,
      startingPlating: 0
    },
    scrap: 75,
    relics: ['salvageLoop'],
    potions: ['healSalve', null, null],
    result: 'inProgress',
    pendingEnemyIds: null,
    pendingShop: null,
    pendingReward: null,
    awaitingInterAct: false,
    pendingEventId: null,
    pendingEventResult: null,
    stats: { biggestHit: 12, totalTurns: 8, potionsUsed: 1, combatsWon: 3, elitesDefeated: 1 },
    bossBonus: 0,
    ascension: 1
  };
}

function putRaw(blob: unknown) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
}

beforeEach(() => {
  clearSave();
});

describe('readSave — rejection paths', () => {
  it('returns null when there is no save', () => {
    expect(readSave()).toBeNull();
    expect(hasSave()).toBe(false);
  });

  it('rejects and wipes a save whose version does not match', () => {
    putRaw({ ...fullBlob(), version: SCHEMA_VERSION - 1 });
    expect(readSave()).toBeNull();
    // The stale blob must be removed, not left to confuse a later read.
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
  });

  it('rejects and wipes a future-version save', () => {
    putRaw({ ...fullBlob(), version: SCHEMA_VERSION + 99 });
    expect(readSave()).toBeNull();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
  });

  it('rejects and wipes a corrupt (non-JSON) blob', () => {
    localStorage.setItem(SAVE_KEY, '{not valid json');
    expect(readSave()).toBeNull();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
  });
});

describe('hasSave', () => {
  it('is true only for a current-version blob', () => {
    expect(hasSave()).toBe(false);
    putRaw(fullBlob());
    expect(hasSave()).toBe(true);
    putRaw({ ...fullBlob(), version: 1 });
    expect(hasSave()).toBe(false);
  });
});

describe('hydrate — full current-version blob', () => {
  it('round-trips every field, converting collections to their runtime shapes', () => {
    putRaw(fullBlob());
    const s = readSave() as RunState;
    expect(s).not.toBeNull();
    expect(s.act).toBe(2);
    expect(s.scrap).toBe(75);
    expect(s.relics).toEqual(['salvageLoop']);
    expect(s.ascension).toBe(1);
    // visitedNodeIds is serialized as an array, hydrated back to a Set.
    expect(s.visitedNodeIds).toBeInstanceOf(Set);
    expect(s.visitedNodeIds.has('0-1')).toBe(true);
    // map.nodes is serialized as an array, hydrated back to a Map keyed by id.
    expect(s.map.nodes).toBeInstanceOf(Map);
    expect(s.map.nodes.get('0-2')?.kind).toBe('combat');
    expect(s.player.characterId).toBe('engineer');
    expect(s.player.deck).toEqual(['strike', 'strike', 'guard']);
  });
});

describe('hydrate — additive-field defaults (older current-version saves)', () => {
  it("defaults a missing characterId to 'pilot'", () => {
    const blob = fullBlob();
    delete (blob.player as { characterId?: string }).characterId;
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.player.characterId).toBe('pilot');
  });

  it('zero-fills a missing stats block', () => {
    const blob = fullBlob();
    delete (blob as { stats?: unknown }).stats;
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.stats).toEqual({
      biggestHit: 0,
      totalTurns: 0,
      potionsUsed: 0,
      combatsWon: 0,
      elitesDefeated: 0
    });
  });

  it('fills only the missing keys of a partial stats block', () => {
    const blob = fullBlob();
    (blob as { stats: unknown }).stats = { biggestHit: 9, totalTurns: 4 };
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.stats?.biggestHit).toBe(9);
    expect(s.stats?.totalTurns).toBe(4);
    expect(s.stats?.potionsUsed).toBe(0); // defaulted
    expect(s.stats?.combatsWon).toBe(0); // defaulted
    expect(s.stats?.elitesDefeated).toBe(0); // defaulted
  });

  it('defaults assorted scalar/array fields when absent', () => {
    const blob = fullBlob() as Record<string, unknown>;
    delete blob.act;
    delete blob.relics;
    delete blob.awaitingInterAct;
    delete blob.pendingEventId;
    delete blob.pendingEventResult;
    delete blob.bossBonus;
    delete blob.ascension;
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.act).toBe(1);
    expect(s.relics).toEqual([]);
    expect(s.awaitingInterAct).toBe(false);
    expect(s.pendingEventId).toBeNull();
    expect(s.pendingEventResult).toBeNull();
    expect(s.bossBonus).toBe(0);
    expect(s.ascension).toBe(0);
  });
});

describe('hydrate — potion belt normalization', () => {
  it('pads a missing potions field to POTION_SLOT_COUNT empty slots', () => {
    const blob = fullBlob() as Record<string, unknown>;
    delete blob.potions;
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.potions).toHaveLength(POTION_SLOT_COUNT);
    expect(s.potions.every((p) => p === null)).toBe(true);
  });

  it('preserves a belt longer than the base count (Potion Belt relic)', () => {
    const blob = fullBlob();
    blob.potions = ['healSalve', null, 'fireBomb', null, 'steamShot'];
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.potions).toHaveLength(5);
    expect(s.potions[0]).toBe('healSalve');
    expect(s.potions[2]).toBe('fireBomb');
    expect(s.potions[4]).toBe('steamShot');
    expect(s.potions[1]).toBeNull();
  });

  it('coerces non-string slot values to null', () => {
    const blob = fullBlob();
    (blob as { potions: unknown }).potions = ['healSalve', 42, { junk: true }];
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.potions[0]).toBe('healSalve');
    expect(s.potions[1]).toBeNull();
    expect(s.potions[2]).toBeNull();
  });
});

describe('hydrate — pending enemy resolution', () => {
  it('resolves saved enemy ids back to their defs', () => {
    const blob = fullBlob();
    blob.pendingEnemyIds = ['scrapRaider'];
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.pendingEnemies).not.toBeNull();
    expect(s.pendingEnemies?.[0].id).toBe('scrapRaider');
  });

  it('drops unknown enemy ids and collapses an all-unknown list to null', () => {
    const blob = fullBlob();
    blob.pendingEnemyIds = ['totallyNotAnEnemy'];
    putRaw(blob);
    const s = readSave() as RunState;
    // A combat that can't be reconstructed must hydrate to "no pending
    // combat" rather than an empty enemy array the combat scene would choke on.
    expect(s.pendingEnemies).toBeNull();
  });
});

describe('hydrate — shop / reward normalization', () => {
  it('back-fills potionOffer on a pre-potion shop', () => {
    const blob = fullBlob();
    (blob as { pendingShop: unknown }).pendingShop = {
      offers: [{ cardId: 'strike', price: 30, sold: false }],
      removalPrice: 55,
      removalUsed: false
      // no potionOffer — predates the potion shop slot
    };
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.pendingShop).not.toBeNull();
    expect(s.pendingShop?.potionOffer).toBeNull();
    expect(s.pendingShop?.offers[0].cardId).toBe('strike');
  });

  it('back-fills potionId on a pre-potion staged reward', () => {
    const blob = fullBlob();
    (blob as { pendingReward: unknown }).pendingReward = {
      cards: ['strike', 'guard'],
      relicId: null,
      scrap: 15,
      fromElite: false
      // no potionId — predates potion drops
    };
    putRaw(blob);
    const s = readSave() as RunState;
    expect(s.pendingReward).not.toBeNull();
    expect(s.pendingReward?.potionId).toBeNull();
    expect(s.pendingReward?.cards).toEqual(['strike', 'guard']);
  });
});

describe('writeSave → readSave round-trip', () => {
  it('persists a hand-built run state and reads it back equivalently', () => {
    const state: RunState = {
      map: {
        floors: 1,
        width: 5,
        nodes: new Map([['0-2', { id: '0-2', floor: 0, col: 2, kind: 'combat', next: [] }]]),
        entryNodeIds: ['0-2'],
        bossNodeId: '14-2'
      },
      act: 3,
      currentNodeId: '0-2',
      visitedNodeIds: new Set(['0-1', '0-2']),
      player: {
        hull: 30,
        maxHull: 50,
        deck: ['strike', 'guard'],
        characterId: 'saboteur',
        maxSteam: 3,
        startingPlating: 0
      },
      scrap: 120,
      relics: ['salvageLoop', 'salvageWreath'],
      potions: ['healSalve', null, null],
      result: 'inProgress',
      bossBonus: 5,
      stats: { biggestHit: 20, totalTurns: 14, potionsUsed: 2, combatsWon: 6, elitesDefeated: 2 },
      pendingEnemies: null,
      pendingShop: null,
      pendingReward: null,
      awaitingInterAct: false,
      pendingEventId: null,
      pendingEventResult: null,
      ascension: 2
    };
    writeSave(state);
    const s = readSave() as RunState;
    expect(s.act).toBe(3);
    expect(s.scrap).toBe(120);
    expect(s.relics).toEqual(['salvageLoop', 'salvageWreath']);
    expect(s.player.characterId).toBe('saboteur');
    expect(s.bossBonus).toBe(5);
    expect(s.ascension).toBe(2);
    expect(Array.from(s.visitedNodeIds).sort()).toEqual(['0-1', '0-2']);
    expect(s.map.nodes.get('0-2')?.col).toBe(2);
    expect(s.stats?.combatsWon).toBe(6);
  });
});

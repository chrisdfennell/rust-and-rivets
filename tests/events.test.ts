import { describe, it, expect } from 'vitest';
import { EVENTS_BY_ID, ALL_EVENTS, pickEventId } from '../src/game/events';
import type { RunState } from '../src/game/run';
import { generateMap } from '../src/game/map';

// Build a minimal RunState directly. We bypass startRun() so localStorage
// stays out of the test fixture — events only read/mutate the fields
// referenced in their resolve() functions.
function makeFakeRun(overrides: Partial<RunState> = {}): RunState {
  const base: RunState = {
    map: generateMap(),
    act: 1,
    currentNodeId: null,
    visitedNodeIds: new Set(),
    player: {
      hull: 50,
      maxHull: 60,
      deck: ['autocannon', 'autocannon', 'brace'],
      characterId: 'pilot',
      maxSteam: 3,
      startingPlating: 0
    },
    scrap: 100,
    relics: [],
    potions: [null, null, null],
    result: 'inProgress',
    pendingEnemies: null,
    pendingShop: null,
    pendingReward: null,
    awaitingInterAct: false,
    pendingEventId: null,
    pendingEventResult: null
  };
  return { ...base, ...overrides };
}

// Deterministic RNG that always returns the supplied value. Useful for
// gambling-style events where the resolution depends on the roll.
function fixedRng(value: number) {
  return () => value;
}

// ===== Event pool integrity =====

describe('event pool', () => {
  it('every event in ALL_EVENTS appears in EVENTS_BY_ID and vice versa', () => {
    for (const ev of ALL_EVENTS) {
      expect(EVENTS_BY_ID[ev.id]).toBe(ev);
    }
    expect(Object.keys(EVENTS_BY_ID).length).toBe(ALL_EVENTS.length);
  });

  it('every event has at least one choice', () => {
    for (const ev of ALL_EVENTS) {
      expect(ev.choices.length).toBeGreaterThan(0);
    }
  });

  it('pickEventId returns an untagged event on act 1', () => {
    // Force the rng to land on a specific event. Try all 30+ events; an
    // act-1 roll should never return an event tagged with acts: [4] or [5].
    for (let i = 0; i < 100; i++) {
      const id = pickEventId(() => i / 100, 1);
      const ev = EVENTS_BY_ID[id];
      expect(ev.acts === undefined || ev.acts.includes(1)).toBe(true);
    }
  });

  it('pickEventId on act 4 surfaces act-4-tagged events', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(pickEventId(() => i / 200, 4));
    }
    // At least one Act-4 themed event should appear in 200 rolls.
    const act4Events = ALL_EVENTS.filter((e) => e.acts?.includes(4));
    expect(act4Events.length).toBeGreaterThan(0);
    expect(act4Events.some((e) => seen.has(e.id))).toBe(true);
  });
});

// ===== Specific event resolutions =====

describe('SALVAGED_MECH', () => {
  it('SALVAGE adds a card to the deck', () => {
    const run = makeFakeRun();
    const ev = EVENTS_BY_ID.salvagedMech;
    const salvage = ev.choices.find((c) => c.label === 'SALVAGE')!;
    const before = run.player.deck.length;
    salvage.resolve(run, fixedRng(0.5));
    expect(run.player.deck.length).toBe(before + 1);
  });

  it('SCAVENGE adds 30 scrap', () => {
    const run = makeFakeRun({ scrap: 50 });
    const ev = EVENTS_BY_ID.salvagedMech;
    const scavenge = ev.choices.find((c) => c.label === 'SCAVENGE')!;
    scavenge.resolve(run, fixedRng(0.5));
    expect(run.scrap).toBe(80);
  });

  it('LEAVE returns a string and mutates nothing', () => {
    const run = makeFakeRun({ scrap: 50 });
    const ev = EVENTS_BY_ID.salvagedMech;
    const leave = ev.choices.find((c) => c.label === 'LEAVE')!;
    const msg = leave.resolve(run, fixedRng(0.5));
    expect(typeof msg).toBe('string');
    expect(run.scrap).toBe(50);
    expect(run.player.deck.length).toBe(3);
  });
});

describe('STEAM_VENT', () => {
  it('REPAIR heals 12 (clamped to max)', () => {
    const run = makeFakeRun({
      player: {
        hull: 40, maxHull: 60, deck: [], characterId: 'pilot',
        maxSteam: 3, startingPlating: 0
      }
    });
    const ev = EVENTS_BY_ID.steamVent;
    const repair = ev.choices.find((c) => c.label === 'REPAIR')!;
    repair.resolve(run, fixedRng(0.5));
    expect(run.player.hull).toBe(52);
  });

  it('REPAIR with full Hull is a no-op heal', () => {
    const run = makeFakeRun({
      player: {
        hull: 60, maxHull: 60, deck: [], characterId: 'pilot',
        maxSteam: 3, startingPlating: 0
      }
    });
    const ev = EVENTS_BY_ID.steamVent;
    const repair = ev.choices.find((c) => c.label === 'REPAIR')!;
    repair.resolve(run, fixedRng(0.5));
    expect(run.player.hull).toBe(60);
  });

  it('TAP THE LINE costs 5 Hull and grants 25 Scrap', () => {
    const run = makeFakeRun({ scrap: 100 });
    run.player.hull = 50;
    const ev = EVENTS_BY_ID.steamVent;
    const tap = ev.choices.find((c) => c.label === 'TAP THE LINE')!;
    tap.resolve(run, fixedRng(0.5));
    expect(run.player.hull).toBe(45);
    expect(run.scrap).toBe(125);
  });
});

describe('JUNKERS_BET', () => {
  it('BET 30 SCRAP wins on rng < 0.5 → +30 net', () => {
    const run = makeFakeRun({ scrap: 100 });
    const ev = EVENTS_BY_ID.junkersBet;
    const bet = ev.choices.find((c) => c.label === 'BET 30 SCRAP')!;
    bet.resolve(run, fixedRng(0.1));
    expect(run.scrap).toBe(130);
  });

  it('BET 30 SCRAP loses on rng >= 0.5 → -30', () => {
    const run = makeFakeRun({ scrap: 100 });
    const ev = EVENTS_BY_ID.junkersBet;
    const bet = ev.choices.find((c) => c.label === 'BET 30 SCRAP')!;
    bet.resolve(run, fixedRng(0.9));
    expect(run.scrap).toBe(70);
  });

  it('BET 30 SCRAP is disabled below 30 scrap', () => {
    const run = makeFakeRun({ scrap: 20 });
    const ev = EVENTS_BY_ID.junkersBet;
    const bet = ev.choices.find((c) => c.label === 'BET 30 SCRAP')!;
    expect(bet.enabled?.(run)).toBe(false);
  });
});

describe('CONFESSIONAL (Act 4)', () => {
  it('is tagged for act 4 only', () => {
    expect(EVENTS_BY_ID.confessional.acts).toEqual([4]);
  });

  it('CONFESS removes a status card from the deck for 20 scrap', () => {
    const run = makeFakeRun({
      scrap: 50,
      player: {
        hull: 60, maxHull: 60,
        deck: ['autocannon', 'slagGlob', 'brace'],
        characterId: 'pilot',
        maxSteam: 3,
        startingPlating: 0
      }
    });
    const ev = EVENTS_BY_ID.confessional;
    const confess = ev.choices.find((c) => c.label.startsWith('CONFESS'))!;
    confess.resolve(run, fixedRng(0.5));
    expect(run.scrap).toBe(30);
    expect(run.player.deck).not.toContain('slagGlob');
    expect(run.player.deck.length).toBe(2);
  });

  it('CONFESS is disabled if there are no status cards in the deck', () => {
    const run = makeFakeRun({ scrap: 50 });
    const ev = EVENTS_BY_ID.confessional;
    const confess = ev.choices.find((c) => c.label.startsWith('CONFESS'))!;
    expect(confess.enabled?.(run)).toBe(false);
  });
});

describe('EMBER_PROPHET (Act 5)', () => {
  it('is tagged for act 5 only', () => {
    expect(EVENTS_BY_ID.emberProphet.acts).toEqual([5]);
  });

  it('INSCRIBE A POWER adds a Power card to the deck', () => {
    const run = makeFakeRun();
    const ev = EVENTS_BY_ID.emberProphet;
    const inscribe = ev.choices.find((c) => c.label.startsWith('INSCRIBE A POWER'))!;
    const before = run.player.deck.length;
    inscribe.resolve(run, fixedRng(0.1));
    expect(run.player.deck.length).toBe(before + 1);
  });

  it('INSCRIBE A LEGENDARY costs 10 Hull', () => {
    const run = makeFakeRun();
    const ev = EVENTS_BY_ID.emberProphet;
    const inscribe = ev.choices.find((c) => c.label.startsWith('INSCRIBE A LEGENDARY'))!;
    inscribe.resolve(run, fixedRng(0.1));
    expect(run.player.hull).toBe(40); // 50 - 10
  });
});

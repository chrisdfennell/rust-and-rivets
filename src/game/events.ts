import type { RunState } from './run';
import { CARDS, pickRewardCards, upgradeCardId } from './cards';
import { RELICS, pickRelicFor } from './relics';

export interface EventChoice {
  label: string;
  description: string;
  enabled?: (run: RunState) => boolean;
  resolve: (run: RunState, rng: () => number) => string;
}

export interface EventDef {
  id: string;
  title: string;
  body: string;
  choices: EventChoice[];
}

function losePlayerHull(run: RunState, amount: number) {
  run.player.hull = Math.max(0, run.player.hull - amount);
  if (run.player.hull <= 0) run.result = 'defeat';
}

function gainPlayerHull(run: RunState, amount: number): number {
  const before = run.player.hull;
  run.player.hull = Math.min(run.player.maxHull, run.player.hull + amount);
  return run.player.hull - before;
}

function cardName(id: string): string {
  return CARDS[id]?.name ?? id;
}

function grantRelic(run: RunState): string | null {
  const id = pickRelicFor(new Set(run.relics));
  if (!id) return null;
  run.relics.push(id);
  RELICS[id]?.onPickup?.(run);
  return id;
}

const SALVAGED_MECH: EventDef = {
  id: 'salvagedMech',
  title: 'WRECK OF AN OLD MECH',
  body:
    'A crumpled rig leans against a dune. The cabin is empty. The wiring still hums faintly. ' +
    'Something inside is worth taking.',
  choices: [
    {
      label: 'SALVAGE',
      description: 'Pull a rare component card from the wreck.',
      resolve: (run) => {
        const id = pickRewardCards(1, true)[0];
        if (!id) return 'You comb the wreck. Nothing worth lifting.';
        run.player.deck.push(id);
        return `Salvaged: ${cardName(id)}.`;
      }
    },
    {
      label: 'SCAVENGE',
      description: 'Strip the rig for scrap.',
      resolve: (run) => {
        run.scrap += 30;
        return '+30 Scrap.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Move on.',
      resolve: () => 'You leave the wreck untouched.'
    }
  ]
};

const WANDERING_TRADER: EventDef = {
  id: 'wanderingTrader',
  title: 'WANDERING TRADER',
  body:
    'A hooded figure flips open a crate of mechanical oddities. Their prices are blunt.',
  choices: [
    {
      label: 'BUY RELIC — 75 Scrap',
      description: 'A random Relic, bolted in on the spot.',
      enabled: (run) => run.scrap >= 75 && pickRelicFor(new Set(run.relics)) !== null,
      resolve: (run) => {
        if (run.scrap < 75) return 'You count again. Not enough.';
        const id = grantRelic(run);
        if (!id) return 'The trader shakes their head. You already carry every part they sell.';
        run.scrap -= 75;
        const def = RELICS[id];
        return `-75 Scrap. Acquired: ${def?.name ?? id}.`;
      }
    },
    {
      label: 'BUY CARD — 40 Scrap',
      description: 'A random uncommon card, your pick of fate.',
      enabled: (run) => run.scrap >= 40,
      resolve: (run) => {
        if (run.scrap < 40) return 'Not enough scrap to deal.';
        const id = pickRewardCards(1, true)[0];
        if (!id) return 'The trader has nothing for you.';
        run.scrap -= 40;
        run.player.deck.push(id);
        return `-40 Scrap. Acquired: ${cardName(id)}.`;
      }
    },
    {
      label: 'LEAVE',
      description: 'Walk on.',
      resolve: () => 'You wave them off and keep moving.'
    }
  ]
};

const OLD_VETERAN: EventDef = {
  id: 'oldVeteran',
  title: 'OLD VETERAN',
  body:
    'A scarred pilot in a rusted mech challenges you to a quick spar. ' +
    'They claim it sharpens both rigs.',
  choices: [
    {
      label: 'SPAR',
      description: 'Take 8 Hull damage. Gain a stronger card.',
      resolve: (run) => {
        losePlayerHull(run, 8);
        const id = pickRewardCards(1, true)[0];
        if (id) run.player.deck.push(id);
        return `-8 Hull. ${id ? `Learned: ${cardName(id)}.` : 'No new technique stuck.'}`;
      }
    },
    {
      label: 'DECLINE',
      description: 'Walk past. Pocket 15 Scrap they offered.',
      resolve: (run) => {
        run.scrap += 15;
        return '+15 Scrap. The veteran tips a hat.';
      }
    }
  ]
};

const GLOWING_POOL: EventDef = {
  id: 'glowingPool',
  title: 'GLOWING POOL',
  body:
    'Strange green liquid bubbles in a crater. It smells of solder and rust. ' +
    'Could be coolant. Could be something worse.',
  choices: [
    {
      label: 'DRINK',
      description: 'Heal 25 Hull — or take 10. Coin flip.',
      resolve: (run, rng) => {
        if (rng() < 0.5) {
          const healed = gainPlayerHull(run, 25);
          return healed > 0 ? `Cool relief. +${healed} Hull.` : 'You feel fine. Nothing changed.';
        }
        losePlayerHull(run, 10);
        return 'It burns going down. -10 Hull.';
      }
    },
    {
      label: 'BOTTLE IT',
      description: 'Sample carefully. Gain a common card.',
      resolve: (run) => {
        const id = pickRewardCards(1, false)[0];
        if (!id) return 'The liquid evaporates before you can use it.';
        run.player.deck.push(id);
        return `Stabilized into: ${cardName(id)}.`;
      }
    },
    {
      label: 'LEAVE',
      description: 'Skirt the crater.',
      resolve: () => 'You walk a wide arc around the pool.'
    }
  ]
};

const HOT_FORGE: EventDef = {
  id: 'hotForge',
  title: 'HOT FORGE',
  body:
    'An abandoned forge still glows. One coal is enough to temper raw stock. ' +
    'You could harden a fresh part here.',
  choices: [
    {
      label: 'TEMPER',
      description: 'Lose 5 Hull from the heat. Gain an upgraded card.',
      resolve: (run) => {
        losePlayerHull(run, 5);
        const baseId = pickRewardCards(1, true)[0];
        if (!baseId) return '-5 Hull. The coal dies before you finish.';
        const id = upgradeCardId(baseId);
        run.player.deck.push(id);
        return `-5 Hull. Forged: ${cardName(id)}.`;
      }
    },
    {
      label: 'WALK BY',
      description: 'No heat, no risk.',
      resolve: () => 'You leave the embers be.'
    }
  ]
};

const STEAM_VENT: EventDef = {
  id: 'steamVent',
  title: 'STEAM VENT',
  body:
    'Hot steam jets from a cracked pipe. The line below the dust runs to who-knows-where, ' +
    'but it could power a quick repair — or scald your hands raw.',
  choices: [
    {
      label: 'REPAIR',
      description: 'Heal 12 Hull from the warmth.',
      resolve: (run) => {
        const healed = gainPlayerHull(run, 12);
        return healed > 0 ? `+${healed} Hull.` : 'You are already at full Hull.';
      }
    },
    {
      label: 'TAP THE LINE',
      description: 'Lose 5 Hull. Find 25 Scrap in the conduit.',
      resolve: (run) => {
        losePlayerHull(run, 5);
        run.scrap += 25;
        return '-5 Hull. +25 Scrap.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Let the pipe vent.',
      resolve: () => 'You step around the hissing pipe.'
    }
  ]
};

export const ALL_EVENTS: EventDef[] = [
  SALVAGED_MECH,
  WANDERING_TRADER,
  OLD_VETERAN,
  GLOWING_POOL,
  HOT_FORGE,
  STEAM_VENT
];

export const EVENTS_BY_ID: Record<string, EventDef> = Object.fromEntries(
  ALL_EVENTS.map((e) => [e.id, e])
);

export function pickEventId(rng: () => number): string {
  return ALL_EVENTS[Math.floor(rng() * ALL_EVENTS.length)].id;
}

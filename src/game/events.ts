import type { RunState } from './run';
import { CARDS, pickRewardCards, upgradeCardId } from './cards';
import { RELICS, pickRelicFor } from './relics';
import { POTIONS, pickRandomPotionId } from './potions';

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

// Try to put a potion into the first empty belt slot. Returns the id if
// placed, null if every slot was already full.
function tryAddPotion(run: RunState, potionId: string): string | null {
  const idx = run.potions.findIndex((p) => p === null);
  if (idx < 0) return null;
  run.potions[idx] = potionId;
  return potionId;
}

function potionName(id: string): string {
  return POTIONS[id]?.name ?? id;
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

// ----- Newer events (potions, deck removal, light gambling) -----

const BREWERS_CART: EventDef = {
  id: 'brewersCart',
  title: 'BREWER\'S CART',
  body:
    'A tinker has set up a kettle on a wagon, copper coils hissing. Bottles ' +
    'rattle in a rack behind her, each glowing a different color.',
  choices: [
    {
      label: 'BUY POTION — 35 Scrap',
      description: 'A random potion, brewed fresh.',
      enabled: (run) => run.scrap >= 35 && run.potions.some((p) => p === null),
      resolve: (run, rng) => {
        if (run.scrap < 35) return 'Not enough scrap on hand.';
        if (!run.potions.some((p) => p === null)) return 'Your belt is full. Nowhere to put another bottle.';
        const id = pickRandomPotionId(rng);
        tryAddPotion(run, id);
        run.scrap -= 35;
        return `-35 Scrap. Bottled: ${potionName(id)}.`;
      }
    },
    {
      label: 'GAMBLE A BREW',
      description: '50% chance: a random potion for free. 50%: nothing.',
      enabled: (run) => run.potions.some((p) => p === null),
      resolve: (run, rng) => {
        if (!run.potions.some((p) => p === null)) return 'No belt space for a freebie.';
        if (rng() < 0.5) {
          const id = pickRandomPotionId(rng);
          tryAddPotion(run, id);
          return `She winks. Free bottle: ${potionName(id)}.`;
        }
        return 'She shakes her head. "Maybe next caravan."';
      }
    },
    {
      label: 'LEAVE',
      description: 'Walk on.',
      resolve: () => 'You walk past the steam-smell.'
    }
  ]
};

const FORGOTTEN_CACHE: EventDef = {
  id: 'forgottenCache',
  title: 'FORGOTTEN CACHE',
  body:
    'A weather-beaten strongbox sits half-buried in the dust. The latch ' +
    'is iron-rusted; the lock looks pickable but old.',
  choices: [
    {
      label: 'FORCE IT OPEN',
      description: '-4 Hull from the strain. Random: scrap, a potion, or a card.',
      resolve: (run, rng) => {
        losePlayerHull(run, 4);
        const roll = rng();
        if (roll < 0.33) {
          run.scrap += 35;
          return '-4 Hull. The hinges scream. Inside: +35 Scrap.';
        }
        if (roll < 0.66) {
          const pid = pickRandomPotionId(rng);
          const placed = tryAddPotion(run, pid);
          return placed
            ? `-4 Hull. The lid pops. +1 potion: ${potionName(pid)}.`
            : '-4 Hull. The lid pops to reveal a brew you have no room for.';
        }
        const cid = pickRewardCards(1, true)[0];
        if (cid) run.player.deck.push(cid);
        return `-4 Hull. Folded inside: ${cardName(cid)}.`;
      }
    },
    {
      label: 'PICK THE LOCK',
      description: '70% chance to open cleanly for a rare card. 30%: -3 Hull, nothing.',
      resolve: (run, rng) => {
        if (rng() < 0.7) {
          const cid = pickRewardCards(1, true)[0];
          if (cid) run.player.deck.push(cid);
          return `The tumblers click. Inside: ${cardName(cid)}.`;
        }
        losePlayerHull(run, 3);
        return 'The pick snaps. -3 Hull. The lock holds.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Bury it deeper.',
      resolve: () => 'You kick sand back over the strongbox.'
    }
  ]
};

const JUNKERS_BET: EventDef = {
  id: 'junkersBet',
  title: 'JUNKER\'S BET',
  body:
    'A grinning junker flips a worn coin on her thumbnail. "Twice your stake, ' +
    'or nothing. Pilot\'s choice."',
  choices: [
    {
      label: 'BET 30 SCRAP',
      description: 'Coin flip. Win: +60 Scrap. Lose: -30 Scrap.',
      enabled: (run) => run.scrap >= 30,
      resolve: (run, rng) => {
        if (run.scrap < 30) return 'Not enough scrap to bet.';
        if (rng() < 0.5) {
          run.scrap += 30; // net +30 (lose 30 bet, gain 60)
          return 'Heads. +30 Scrap net.';
        }
        run.scrap -= 30;
        return 'Tails. -30 Scrap. She tucks the coin away.';
      }
    },
    {
      label: 'BET 60 SCRAP',
      description: 'Same coin. Bigger stake.',
      enabled: (run) => run.scrap >= 60,
      resolve: (run, rng) => {
        if (run.scrap < 60) return 'Not enough scrap to bet that big.';
        if (rng() < 0.5) {
          run.scrap += 60;
          return 'Heads. +60 Scrap net.';
        }
        run.scrap -= 60;
        return 'Tails. -60 Scrap. The junker laughs softly.';
      }
    },
    {
      label: 'DECLINE',
      description: 'Walk past.',
      resolve: () => 'You wave her off.'
    }
  ]
};

const PILGRIMS_SHRINE: EventDef = {
  id: 'pilgrimsShrine',
  title: 'PILGRIM\'S SHRINE',
  body:
    'A stack of dented mech parts forms a roadside shrine. Burnt offerings ' +
    'crackle in a small brass bowl. Pilgrims leave a piece of themselves here.',
  choices: [
    {
      label: 'OFFER A PART',
      description: 'Remove a card from your deck. Gain a relic.',
      enabled: (run) => run.player.deck.length > 1 && pickRelicFor(new Set(run.relics)) !== null,
      resolve: (run, rng) => {
        if (run.player.deck.length <= 1) return 'You only have one part left. The shrine refuses.';
        // Remove a random non-starter-ish card. Just any random card except the last one.
        const idx = Math.floor(rng() * run.player.deck.length);
        const removed = run.player.deck.splice(idx, 1)[0];
        const id = grantRelic(run);
        if (!id) {
          // Refund the card
          run.player.deck.push(removed);
          return 'Every part you offered, the shrine already has.';
        }
        return `${cardName(removed)} burns away. The shrine answers: ${RELICS[id]?.name ?? id}.`;
      }
    },
    {
      label: 'PRAY',
      description: '+8 Hull and +3 max Hull.',
      resolve: (run) => {
        run.player.maxHull += 3;
        const healed = gainPlayerHull(run, 8 + 3);
        return `+3 max Hull. +${healed} Hull restored.`;
      }
    },
    {
      label: 'WALK BY',
      description: 'The road keeps going.',
      resolve: () => 'You leave the shrine to the wind.'
    }
  ]
};

const SCAVENGED_BREW_KIT: EventDef = {
  id: 'scavengedBrewKit',
  title: 'SCAVENGED BREW KIT',
  body:
    'A burst brewing kit lies in the wreckage of a caravan. The kettle is ' +
    'cracked but the vials are intact — three of them, sealed and warm.',
  choices: [
    {
      label: 'TAKE THE VIALS',
      description: 'Fill every empty potion slot you have (up to 3).',
      enabled: (run) => run.potions.some((p) => p === null),
      resolve: (run, rng) => {
        const placed: string[] = [];
        for (let i = 0; i < 3; i++) {
          const id = pickRandomPotionId(rng);
          const ok = tryAddPotion(run, id);
          if (!ok) break;
          placed.push(potionName(id));
        }
        if (placed.length === 0) return 'Your belt is already full.';
        return `Stowed ${placed.length}: ${placed.join(', ')}.`;
      }
    },
    {
      label: 'SCRAP THE KIT',
      description: 'Strip it for materials. +25 Scrap.',
      resolve: (run) => {
        run.scrap += 25;
        return '+25 Scrap. The brass was the only thing worth keeping.';
      }
    }
  ]
};

const ECHOING_VAULT: EventDef = {
  id: 'echoingVault',
  title: 'ECHOING VAULT',
  body:
    'A cracked steel door yawns open in the cliff face. Cold air. Echoes ' +
    'that come back wrong. Pilgrims rumor a tempered blade waits inside.',
  choices: [
    {
      label: 'STEP IN',
      description: '-10 Hull from the chill. Gain an upgraded random card.',
      resolve: (run) => {
        losePlayerHull(run, 10);
        const baseId = pickRewardCards(1, true)[0];
        if (!baseId) return '-10 Hull. The vault is empty.';
        const id = upgradeCardId(baseId);
        run.player.deck.push(id);
        return `-10 Hull. Whispered to you: ${cardName(id)}.`;
      }
    },
    {
      label: 'CHANT BACK',
      description: '50%: gain a random relic. 50%: -6 Hull, gain a common card.',
      resolve: (run, rng) => {
        if (rng() < 0.5) {
          const id = grantRelic(run);
          if (!id) return 'The vault has nothing left to give you.';
          return `The vault hums. Bolted on: ${RELICS[id]?.name ?? id}.`;
        }
        losePlayerHull(run, 6);
        const cid = pickRewardCards(1, false)[0];
        if (cid) run.player.deck.push(cid);
        return `The echo cuts back. -6 Hull. Picked up: ${cardName(cid)}.`;
      }
    },
    {
      label: 'TURN AROUND',
      description: 'Some doors are doors for a reason.',
      resolve: () => 'You back away from the cold.'
    }
  ]
};

export const ALL_EVENTS: EventDef[] = [
  SALVAGED_MECH,
  WANDERING_TRADER,
  OLD_VETERAN,
  GLOWING_POOL,
  HOT_FORGE,
  STEAM_VENT,
  BREWERS_CART,
  FORGOTTEN_CACHE,
  JUNKERS_BET,
  PILGRIMS_SHRINE,
  SCAVENGED_BREW_KIT,
  ECHOING_VAULT
];

export const EVENTS_BY_ID: Record<string, EventDef> = Object.fromEntries(
  ALL_EVENTS.map((e) => [e.id, e])
);

export function pickEventId(rng: () => number): string {
  return ALL_EVENTS[Math.floor(rng() * ALL_EVENTS.length)].id;
}

import type { RunState } from './run';
import { CARDS, pickRewardCards, upgradeCardId, isUpgradable, SHOP_POOL } from './cards';
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
  // Optional act restriction. When set, this event only appears on
  // event-node rolls during the listed acts. Omitted = act-agnostic
  // (the original behavior for the first 30 events).
  acts?: number[];
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

const CURSED_IDOL: EventDef = {
  id: 'cursedIdol',
  title: 'CURSED IDOL',
  body:
    'A small brass effigy of a long-dead pilot leers from a wayside shrine. ' +
    'A sealed crate is wired to it. The crate hums. Pilgrims have left ' +
    'rust-flowers around the idol — and a hand-scrawled warning.',
  choices: [
    {
      label: 'TAKE THE PRIZE',
      description: 'Gain a random Relic. Add a Heat Damage curse to your deck.',
      enabled: (run) => pickRelicFor(new Set(run.relics)) !== null,
      resolve: (run) => {
        const id = grantRelic(run);
        if (!id) return 'The shrine has nothing the road hasn\'t already given you.';
        run.player.deck.push('heatDamage');
        return `Bolted on: ${RELICS[id]?.name ?? id}. A Heat Damage card slots into your gear, warm to the touch.`;
      }
    },
    {
      label: 'PRY FOR PARTS',
      description: '-5 Hull. Gain 30 Scrap. The shrine is left intact.',
      resolve: (run) => {
        losePlayerHull(run, 5);
        run.scrap += 30;
        return '-5 Hull. The brass casing peels free. +30 Scrap.';
      }
    },
    {
      label: 'WALK PAST',
      description: 'Some warnings deserve respect.',
      resolve: () => 'You leave the idol to its watch.'
    }
  ]
};

// ===== Slice 43: pool expansion 13 -> 30 events =====
// New entries cover ground the previous set didn't really exercise:
// archetype-specific card drops (Power / AoE), paid removal, big-cache
// risk/reward, max-hull-trade vendors, and a couple of straight-up
// gambling boxes. Many take advantage of helpers already defined above
// (tryAddPotion, grantRelic, losePlayerHull, cardName, etc.).

const JUNKYARD_TINKER: EventDef = {
  id: 'junkyardTinker',
  title: 'JUNKYARD TINKER',
  body:
    'An oil-stained tinker squints at your rig and offers to bolt on an ' +
    'upgrade — for a price.',
  choices: [
    {
      label: 'UPGRADE — 30 Scrap',
      description: 'Upgrade a random card in your deck.',
      enabled: (run) => run.scrap >= 30 && run.player.deck.some(isUpgradable),
      resolve: (run, rng) => {
        if (run.scrap < 30) return 'You count again. Not enough.';
        const upgradable = run.player.deck
          .map((id, i) => (isUpgradable(id) ? i : -1))
          .filter((i) => i >= 0);
        if (upgradable.length === 0) return 'Every card is already upgraded.';
        const pick = upgradable[Math.floor(rng() * upgradable.length)];
        const oldId = run.player.deck[pick];
        const newId = upgradeCardId(oldId);
        run.player.deck[pick] = newId;
        run.scrap -= 30;
        return `-30 Scrap. ${cardName(oldId)} → ${cardName(newId)}.`;
      }
    },
    {
      label: 'LEAVE',
      description: 'Move on.',
      resolve: () => 'You wave the tinker off.'
    }
  ]
};

const BLACK_MARKET: EventDef = {
  id: 'blackMarket',
  title: 'BLACK MARKET',
  body:
    'A shadowed stall slides open. The dealer doesn\'t make eye contact. ' +
    'Cash or kind, no questions.',
  choices: [
    {
      label: 'SCRAP A CARD — 50 Scrap',
      description: 'Remove a random card from your deck.',
      enabled: (run) => run.scrap >= 50 && run.player.deck.length > 1,
      resolve: (run, rng) => {
        if (run.scrap < 50) return 'Not enough scrap.';
        if (run.player.deck.length <= 1) return 'You won\'t scrap your last card.';
        const idx = Math.floor(rng() * run.player.deck.length);
        const removed = run.player.deck.splice(idx, 1)[0];
        run.scrap -= 50;
        return `-50 Scrap. ${cardName(removed)} hits the recycler.`;
      }
    },
    {
      label: 'BUY RARE — 70 Scrap',
      description: 'Acquire an elite-tier random card.',
      enabled: (run) => run.scrap >= 70,
      resolve: (run) => {
        if (run.scrap < 70) return 'Not enough scrap.';
        const id = pickRewardCards(1, true)[0];
        if (!id) return 'The stall has nothing for you.';
        run.scrap -= 70;
        run.player.deck.push(id);
        return `-70 Scrap. Acquired: ${cardName(id)}.`;
      }
    },
    {
      label: 'LEAVE',
      description: 'No questions, no business.',
      resolve: () => 'You walk away clean.'
    }
  ]
};

const CONDUIT_TRANCE: EventDef = {
  id: 'conduitTrance',
  title: 'CONDUIT TRANCE',
  body:
    'A pulsing antenna sends your mech\'s wiring into a low hum. Specific ' +
    'patterns emerge — old combat doctrines.',
  choices: [
    {
      label: 'INDUCE A POWER',
      description: 'Gain a random Power card.',
      resolve: (run, rng) => {
        const ids = SHOP_POOL.filter((id) => CARDS[id].type === 'power');
        if (ids.length === 0) return 'The trance fizzles.';
        const id = ids[Math.floor(rng() * ids.length)];
        run.player.deck.push(id);
        return `Inscribed: ${cardName(id)}.`;
      }
    },
    {
      label: 'INDUCE A SWEEP',
      description: 'Gain a random AoE card.',
      resolve: (run, rng) => {
        const ids = SHOP_POOL.filter((id) => CARDS[id].target === 'allEnemies');
        if (ids.length === 0) return 'The trance fizzles.';
        const id = ids[Math.floor(rng() * ids.length)];
        run.player.deck.push(id);
        return `Inscribed: ${cardName(id)}.`;
      }
    },
    {
      label: 'BREAK FREE',
      description: 'Disconnect before something settles in.',
      resolve: () => 'The hum fades. Your wiring stays your own.'
    }
  ]
};

const WHIRLWIND_SURVIVOR: EventDef = {
  id: 'whirlwindSurvivor',
  title: 'WHIRLWIND SURVIVOR',
  body:
    'A scorched mech limps over a ridge, pilot half-conscious in the ' +
    'cockpit. They wave for help. Their salvage is also right there.',
  choices: [
    {
      label: 'HELP THEM',
      description: '-12 Hull from a bad transfusion. Gain a rare card.',
      resolve: (run) => {
        losePlayerHull(run, 12);
        const id = pickRewardCards(1, true)[0];
        if (id) run.player.deck.push(id);
        return `-12 Hull. They press a chip into your hand: ${cardName(id)}.`;
      }
    },
    {
      label: 'LOOT THE WRECK',
      description: '+60 Scrap. -3 max Hull (regret).',
      resolve: (run) => {
        run.player.maxHull = Math.max(1, run.player.maxHull - 3);
        run.player.hull = Math.min(run.player.hull, run.player.maxHull);
        run.scrap += 60;
        return '-3 max Hull. +60 Scrap. You don\'t look back.';
      }
    },
    {
      label: 'WALK PAST',
      description: 'Not your problem.',
      resolve: () => 'You take the long way around.'
    }
  ]
};

const FROZEN_ENGINE: EventDef = {
  id: 'frozenEngine',
  title: 'FROZEN ENGINE',
  body:
    'A long-stranded mech is fused to the road, its core long cold. ' +
    'Parts still run if you crack the casing — or you could try a jump-start.',
  choices: [
    {
      label: 'CANNIBALIZE',
      description: '-8 Hull from the heat. Gain 2 random potions.',
      enabled: (run) => run.potions.some((p) => p === null),
      resolve: (run, rng) => {
        losePlayerHull(run, 8);
        const placed: string[] = [];
        for (let i = 0; i < 2; i++) {
          const id = pickRandomPotionId(rng);
          if (!tryAddPotion(run, id)) break;
          placed.push(potionName(id));
        }
        if (placed.length === 0) return '-8 Hull. Belt full; nothing salvaged.';
        return `-8 Hull. Salvaged: ${placed.join(', ')}.`;
      }
    },
    {
      label: 'JUMP-START',
      description: '50%: gain a random relic. Else: -10 Hull, nothing.',
      resolve: (run, rng) => {
        if (rng() < 0.5) {
          const id = grantRelic(run);
          if (!id) return 'The engine sputters and dies. Nothing left to give.';
          return `The engine kicks. Bolted on: ${RELICS[id]?.name ?? id}.`;
        }
        losePlayerHull(run, 10);
        return '-10 Hull. The core blows back. Nothing salvageable.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Some things stay frozen for a reason.',
      resolve: () => 'You leave the wreck where it lies.'
    }
  ]
};

const CIPHER_WHEEL: EventDef = {
  id: 'cipherWheel',
  title: 'CIPHER WHEEL',
  body:
    'A brass dial half-buried in dust. Tumblers click when you brush it. ' +
    'A storage box waits underneath.',
  choices: [
    {
      label: 'SOLVE THE PUZZLE',
      description: '+15 Scrap and 1 random potion if a slot is open.',
      resolve: (run, rng) => {
        run.scrap += 15;
        if (!run.potions.some((p) => p === null)) {
          return '+15 Scrap. Belt full — no bottle.';
        }
        const id = pickRandomPotionId(rng);
        tryAddPotion(run, id);
        return `+15 Scrap. Stowed: ${potionName(id)}.`;
      }
    },
    {
      label: 'SMASH IT OPEN',
      description: '+40 Scrap. -1 max Hull from the strain.',
      resolve: (run) => {
        run.player.maxHull = Math.max(1, run.player.maxHull - 1);
        run.player.hull = Math.min(run.player.hull, run.player.maxHull);
        run.scrap += 40;
        return '-1 max Hull. +40 Scrap.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Walk past the brass.',
      resolve: () => 'You leave the dial humming.'
    }
  ]
};

const CRASHED_DRONE: EventDef = {
  id: 'crashedDrone',
  title: 'CRASHED DRONE',
  body:
    'A small surveyor drone lies in a smoking crater. Parts and chips ' +
    'are still warm.',
  choices: [
    {
      label: 'STRIP IT',
      description: '+25 Scrap. -2 Hull from a hot capacitor.',
      resolve: (run) => {
        losePlayerHull(run, 2);
        run.scrap += 25;
        return '-2 Hull. +25 Scrap.';
      }
    },
    {
      label: 'SALVAGE A CHIP',
      description: 'Gain a random common card.',
      resolve: (run, rng) => {
        const commons = SHOP_POOL.filter((id) => CARDS[id].rarity === 'common');
        if (commons.length === 0) return 'The chip is fried.';
        const id = commons[Math.floor(rng() * commons.length)];
        run.player.deck.push(id);
        return `Loaded: ${cardName(id)}.`;
      }
    },
    {
      label: 'LEAVE',
      description: 'Let the next caravan pick at it.',
      resolve: () => 'You walk past the drone.'
    }
  ]
};

const TOLL_BRIDGE: EventDef = {
  id: 'tollBridge',
  title: 'TOLL BRIDGE',
  body:
    'A makeshift checkpoint blocks the road. Three options, none of them ' +
    'free.',
  choices: [
    {
      label: 'PAY — 30 Scrap',
      description: 'Hand over the toll and pass clean.',
      enabled: (run) => run.scrap >= 30,
      resolve: (run) => {
        if (run.scrap < 30) return 'Not enough scrap.';
        run.scrap -= 30;
        return '-30 Scrap. The barrier lifts.';
      }
    },
    {
      label: 'BLEED — 8 Hull',
      description: 'They take a piece of you instead.',
      resolve: (run) => {
        losePlayerHull(run, 8);
        return '-8 Hull. The barrier lifts.';
      }
    },
    {
      label: 'SNEAK',
      description: '50%: pass free. 50%: caught, -12 Hull.',
      resolve: (run, rng) => {
        if (rng() < 0.5) return 'You slip past in the smoke.';
        losePlayerHull(run, 12);
        return 'They spot you. -12 Hull, but you make it through.';
      }
    }
  ]
};

const MIRRORED_POOL: EventDef = {
  id: 'mirroredPool',
  title: 'MIRRORED POOL',
  body:
    'A still pool reflects a sky that is not the one above you. Something ' +
    'pulses underneath.',
  choices: [
    {
      label: 'LOOK DEEPER',
      description: '50%: gain a random relic. 50%: -8 Hull from what looks back.',
      resolve: (run, rng) => {
        if (rng() < 0.5) {
          const id = grantRelic(run);
          if (!id) return 'The pool offers nothing you don\'t already carry.';
          return `Lifted from the surface: ${RELICS[id]?.name ?? id}.`;
        }
        losePlayerHull(run, 8);
        return '-8 Hull. The reflection bites.';
      }
    },
    {
      label: 'SMASH IT',
      description: '+30 Scrap from the brass frame.',
      resolve: (run) => {
        run.scrap += 30;
        return '+30 Scrap. The pool drains into the sand.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Look away first.',
      resolve: () => 'You move on, hands sweating.'
    }
  ]
};

const SEALED_AUCTION: EventDef = {
  id: 'sealedAuction',
  title: 'SEALED CRATE AUCTION',
  body:
    'A black-canvas crate sits on a stump with a hand-scrawled price. ' +
    'Sealed. No previews.',
  choices: [
    {
      label: 'BID 35 SCRAP',
      description: 'Random: a card, a potion, or +60 Scrap refund.',
      enabled: (run) => run.scrap >= 35,
      resolve: (run, rng) => {
        if (run.scrap < 35) return 'Not enough scrap.';
        run.scrap -= 35;
        const roll = rng();
        if (roll < 0.34) {
          const id = pickRewardCards(1, false)[0];
          if (id) run.player.deck.push(id);
          return `-35 Scrap. Inside: ${cardName(id)}.`;
        }
        if (roll < 0.67) {
          const pid = pickRandomPotionId(rng);
          const placed = tryAddPotion(run, pid);
          return placed
            ? `-35 Scrap. Inside: ${potionName(pid)}.`
            : '-35 Scrap. A potion you have no room for.';
        }
        run.scrap += 60;
        return '-35 Scrap, +60 Scrap. Net +25.';
      }
    },
    {
      label: 'WALK',
      description: 'Sealed boxes are for fools.',
      resolve: () => 'You keep your scrap.'
    }
  ]
};

const PILGRIM_HEALER: EventDef = {
  id: 'pilgrimHealer',
  title: 'PILGRIM HEALER',
  body:
    'A robed mechanic-priest waves a censer of solder smoke. Their hands ' +
    'are very steady.',
  choices: [
    {
      label: 'CONFESS — 40 Scrap',
      description: 'Heal to full Hull.',
      enabled: (run) => run.scrap >= 40 && run.player.hull < run.player.maxHull,
      resolve: (run) => {
        if (run.scrap < 40) return 'Not enough scrap for the rite.';
        const healed = gainPlayerHull(run, run.player.maxHull);
        run.scrap -= 40;
        return `-40 Scrap. +${healed} Hull (full).`;
      }
    },
    {
      label: 'PRAY',
      description: 'A free small mercy. Heal 8 Hull.',
      resolve: (run) => {
        const healed = gainPlayerHull(run, 8);
        return healed > 0 ? `+${healed} Hull.` : 'You\'re already at full.';
      }
    },
    {
      label: 'WALK BY',
      description: 'You don\'t kneel.',
      resolve: () => 'You nod and keep moving.'
    }
  ]
};

const STEEL_HERMIT: EventDef = {
  id: 'steelHermit',
  title: 'STEEL HERMIT',
  body:
    'An old pilot in a half-buried mech beckons you to sit. They have ' +
    'lessons to share, but lessons cost something.',
  choices: [
    {
      label: 'LISTEN',
      description: '-1 max Hull. Gain an uncommon card AND +20 Scrap.',
      resolve: (run, rng) => {
        run.player.maxHull = Math.max(1, run.player.maxHull - 1);
        run.player.hull = Math.min(run.player.hull, run.player.maxHull);
        const uncommons = SHOP_POOL.filter((id) => CARDS[id].rarity === 'uncommon');
        const id = uncommons[Math.floor(rng() * uncommons.length)];
        if (id) run.player.deck.push(id);
        run.scrap += 20;
        return `-1 max Hull. +20 Scrap. Learned: ${cardName(id)}.`;
      }
    },
    {
      label: 'DECLINE',
      description: 'Lessons are luxuries.',
      resolve: () => 'You bow and walk away.'
    }
  ]
};

const SNAKE_OIL_SALESMAN: EventDef = {
  id: 'snakeOilSalesman',
  title: 'SNAKE-OIL SALESMAN',
  body:
    'A grinning hustler shakes a corked bottle that hisses. He calls it ' +
    'a miracle. Possibly.',
  choices: [
    {
      label: 'BUY TONIC — 30 Scrap',
      description: '70%: gain a random potion. 30%: he sold you a curse.',
      enabled: (run) => run.scrap >= 30,
      resolve: (run, rng) => {
        if (run.scrap < 30) return 'Not enough scrap.';
        run.scrap -= 30;
        if (rng() < 0.7) {
          const pid = pickRandomPotionId(rng);
          const placed = tryAddPotion(run, pid);
          return placed
            ? `-30 Scrap. Bottled: ${potionName(pid)}.`
            : '-30 Scrap. Belt is full; the bottle leaks out.';
        }
        run.player.deck.push('heatDamage');
        return '-30 Scrap. The bottle is warm. A Heat Damage curse slots into your gear.';
      }
    },
    {
      label: 'REFUSE',
      description: 'Walk past the smile.',
      resolve: () => 'He shrugs and packs up.'
    }
  ]
};

const BOILER_SPIRIT: EventDef = {
  id: 'boilerSpirit',
  title: 'BOILER SPIRIT',
  body:
    'Steam billows from an abandoned engine. A face forms in it, then ' +
    'speaks. Pilgrims say spirits like this haunt the old foundries.',
  choices: [
    {
      label: 'LISTEN',
      description: 'Heal 5 Hull. The spirit slips a Slag Glob into your gear.',
      resolve: (run) => {
        const healed = gainPlayerHull(run, 5);
        run.player.deck.push('slagGlob');
        return `+${healed} Hull. A Slag Glob bolts onto your gear.`;
      }
    },
    {
      label: 'BANISH',
      description: '-5 Hull from the backlash. Gain a rare card.',
      resolve: (run) => {
        losePlayerHull(run, 5);
        const id = pickRewardCards(1, true)[0];
        if (id) run.player.deck.push(id);
        return `-5 Hull. The spirit cracks apart. Gained: ${cardName(id)}.`;
      }
    },
    {
      label: 'RUN',
      description: 'Don\'t bargain with the smoke.',
      resolve: () => 'You back away until the face fades.'
    }
  ]
};

const OLD_SOLDIERS_CACHE: EventDef = {
  id: 'oldSoldiersCache',
  title: 'OLD SOLDIER\'S CACHE',
  body:
    'A buried munitions case from a war nobody remembers. The latch is ' +
    'sealed with rust.',
  choices: [
    {
      label: 'FORCE IT',
      description: '-8 Hull. Gain 2 random cards.',
      resolve: (run) => {
        losePlayerHull(run, 8);
        const ids = pickRewardCards(2, false);
        for (const id of ids) run.player.deck.push(id);
        return `-8 Hull. Loaded: ${ids.map(cardName).join(', ')}.`;
      }
    },
    {
      label: 'PICK THE LOCK',
      description: '50%: 2 cards clean. 50%: -3 Hull, nothing.',
      resolve: (run, rng) => {
        if (rng() < 0.5) {
          const ids = pickRewardCards(2, false);
          for (const id of ids) run.player.deck.push(id);
          return `Cracked it. Loaded: ${ids.map(cardName).join(', ')}.`;
        }
        losePlayerHull(run, 3);
        return '-3 Hull. The pick snaps. The case stays sealed.';
      }
    },
    {
      label: 'LEAVE',
      description: 'War boxes aren\'t worth waking up.',
      resolve: () => 'You bury it back under the dust.'
    }
  ]
};

const DRONE_SWARM: EventDef = {
  id: 'droneSwarm',
  title: 'DRONE SWARM',
  body:
    'A small swarm of dust-bots tails you, chittering. Some carry sealed ' +
    'phials. Their batteries are nearly empty.',
  choices: [
    {
      label: 'CAPTURE ONE',
      description: '-3 Hull from sparks. Gain a random potion and +15 Scrap.',
      enabled: (run) => run.potions.some((p) => p === null),
      resolve: (run, rng) => {
        losePlayerHull(run, 3);
        const pid = pickRandomPotionId(rng);
        const placed = tryAddPotion(run, pid);
        run.scrap += 15;
        return placed
          ? `-3 Hull. +15 Scrap. Captured phial: ${potionName(pid)}.`
          : '-3 Hull. +15 Scrap. The phial breaks in your grip.';
      }
    },
    {
      label: 'SHOOT THEM DOWN',
      description: '+25 Scrap from the wreckage.',
      resolve: (run) => {
        run.scrap += 25;
        return '+25 Scrap. The swarm goes quiet.';
      }
    },
    {
      label: 'IGNORE',
      description: 'Let them chitter past.',
      resolve: () => 'The swarm follows for a while, then drifts off.'
    }
  ]
};

const CRACKED_ENGINEER: EventDef = {
  id: 'crackedEngineer',
  title: 'CRACKED ENGINEER',
  body:
    'A wild-eyed engineer flags you down. She\'ll pay handsomely if you ' +
    'help test her "field stress prototypes". Most pilots refuse.',
  choices: [
    {
      label: 'TEST — +60 Scrap',
      description: 'Add 2 Slag Globs to your deck. Pure clutter, but the money is good.',
      resolve: (run) => {
        run.player.deck.push('slagGlob');
        run.player.deck.push('slagGlob');
        run.scrap += 60;
        return '+60 Scrap. Two Slag Globs jam into your gear.';
      }
    },
    {
      label: 'DECLINE',
      description: 'Most pilots are smart for a reason.',
      resolve: () => 'You back away. She mutters and walks on.'
    }
  ]
};

// ===== Slice 53 — Act-themed events =====
// 12 new events split between Act 4 (Brass Cathedral, clockwork cult)
// and Act 5 (World-Forge, molten depths). Each is tagged via the
// `acts` field so pickEventId only surfaces them in the right act.

// ----- Act 4: Brass Cathedral -----

// Removes a status/curse card from the deck. Returns the removed name
// or null if nothing matched. Used by Confessional / similar.
const STATUS_CARD_IDS = new Set(['slagGlob', 'shrapnel', 'heatDamage', 'oldRust']);
function removeOneStatusCard(run: RunState): string | null {
  const idx = run.player.deck.findIndex((id) => STATUS_CARD_IDS.has(id));
  if (idx < 0) return null;
  const removed = run.player.deck.splice(idx, 1)[0];
  return cardName(removed);
}

const CONFESSIONAL: EventDef = {
  id: 'confessional',
  title: 'BRASS CONFESSIONAL',
  body:
    'A clockwork priest opens its cabinet. Gears grind softly inside. ' +
    'A hand-painted sign reads: ONE SIN, ONE COIN.',
  acts: [4],
  choices: [
    {
      label: 'CONFESS — 20 Scrap',
      description: 'Remove a status / curse card from your deck.',
      enabled: (run) => run.scrap >= 20 && run.player.deck.some((id) => STATUS_CARD_IDS.has(id)),
      resolve: (run) => {
        if (run.scrap < 20) return 'Not enough scrap for the tithe.';
        const name = removeOneStatusCard(run);
        if (!name) return 'The priest finds no fault in your gear.';
        run.scrap -= 20;
        return `-20 Scrap. ${name} burns out of the cabinet.`;
      }
    },
    {
      label: 'TITHE — 30 Scrap',
      description: 'Heal 12 Hull from the priest\'s ministrations.',
      enabled: (run) => run.scrap >= 30,
      resolve: (run) => {
        if (run.scrap < 30) return 'The priest waves you off — coin first.';
        const healed = gainPlayerHull(run, 12);
        run.scrap -= 30;
        return `-30 Scrap. +${healed} Hull.`;
      }
    },
    {
      label: 'WALK PAST',
      description: 'Pilgrims confess. You don\'t.',
      resolve: () => 'You leave the cabinet humming.'
    }
  ]
};

const OFFERING_BRAZIER: EventDef = {
  id: 'offeringBrazier',
  title: 'OFFERING BRAZIER',
  body:
    'A wide brass bowl of green flame stands at a crossroads. Pilgrims ' +
    'feed it old cards — and pluck other things back out.',
  acts: [4],
  choices: [
    {
      label: 'OFFER A CARD',
      description: 'Remove a random card. Gain a random Power card.',
      enabled: (run) => run.player.deck.length > 1,
      resolve: (run, rng) => {
        if (run.player.deck.length <= 1) return 'The flame won\'t accept your last card.';
        const idx = Math.floor(rng() * run.player.deck.length);
        const burned = run.player.deck.splice(idx, 1)[0];
        const powers = SHOP_POOL.filter((id) => CARDS[id].type === 'power');
        if (powers.length === 0) {
          // Refund and bail
          run.player.deck.push(burned);
          return 'The flame sputters out. Your card falls back.';
        }
        const id = powers[Math.floor(rng() * powers.length)];
        run.player.deck.push(id);
        return `${cardName(burned)} burns to brass. The flame answers: ${cardName(id)}.`;
      }
    },
    {
      label: 'PLUCK A COIN',
      description: '-6 Hull from the green flame. +35 Scrap.',
      resolve: (run) => {
        losePlayerHull(run, 6);
        run.scrap += 35;
        return '-6 Hull. +35 Scrap from the brazier floor.';
      }
    },
    {
      label: 'WALK BY',
      description: 'You owe no offering.',
      resolve: () => 'You step around the green light.'
    }
  ]
};

const TEMPERED_HYMN: EventDef = {
  id: 'temperedHymn',
  title: 'TEMPERED HYMN',
  body:
    'A choir of brass crawlers hums in the eaves of a roofless chapel. ' +
    'The harmony makes your wiring sing.',
  acts: [4],
  choices: [
    {
      label: 'LISTEN',
      description: 'Upgrade a random card in your deck.',
      enabled: (run) => run.player.deck.some(isUpgradable),
      resolve: (run, rng) => {
        const upgradable = run.player.deck
          .map((id, i) => (isUpgradable(id) ? i : -1))
          .filter((i) => i >= 0);
        if (upgradable.length === 0) return 'The hymn finds nothing in your gear to sharpen.';
        const pick = upgradable[Math.floor(rng() * upgradable.length)];
        const oldId = run.player.deck[pick];
        const newId = upgradeCardId(oldId);
        run.player.deck[pick] = newId;
        return `${cardName(oldId)} → ${cardName(newId)}.`;
      }
    },
    {
      label: 'CHANT BACK',
      description: '+10 Hull. +5 max Hull.',
      resolve: (run) => {
        run.player.maxHull += 5;
        const healed = gainPlayerHull(run, 10 + 5);
        return `+5 max Hull. +${healed} Hull restored.`;
      }
    },
    {
      label: 'PLUG YOUR EARS',
      description: 'Some hymns get under the hull.',
      resolve: () => 'You hum a different tune and walk past.'
    }
  ]
};

const VESTIGIAL_BELL: EventDef = {
  id: 'vestigialBell',
  title: 'VESTIGIAL BELL',
  body:
    'A bronze bell the size of your mech\'s cabin hangs from a brass ' +
    'frame. The rope is frayed. The bell is older than the road.',
  acts: [4],
  choices: [
    {
      label: 'RING IT',
      description: '-8 Hull from the shockwave. Gain a rare card.',
      resolve: (run) => {
        losePlayerHull(run, 8);
        const id = pickRewardCards(1, true)[0];
        if (id) run.player.deck.push(id);
        return `-8 Hull. The bell echoes through your wiring: ${cardName(id)}.`;
      }
    },
    {
      label: 'EXAMINE',
      description: '+1 max Steam. (Rare boost.)',
      resolve: (run) => {
        run.player.maxSteam = (run.player.maxSteam ?? 3) + 1;
        return '+1 max Steam. The bell\'s tone rings in your boiler.';
      }
    },
    {
      label: 'LEAVE THE ROPE',
      description: 'Old bells stay old for a reason.',
      resolve: () => 'You leave the rope swinging.'
    }
  ]
};

const PILGRIMS_MARCH: EventDef = {
  id: 'pilgrimsMarch',
  title: 'PILGRIMS\' MARCH',
  body:
    'A long procession of clockwork pilgrims winds toward the Cathedral. ' +
    'They wave you in. The path is harder; the company is generous.',
  acts: [4],
  choices: [
    {
      label: 'JOIN THEM',
      description: '-8 Hull on the march. Gain 2 random cards.',
      resolve: (run) => {
        losePlayerHull(run, 8);
        const ids = pickRewardCards(2, true);
        for (const id of ids) run.player.deck.push(id);
        return `-8 Hull. Pilgrim gifts: ${ids.map(cardName).join(', ')}.`;
      }
    },
    {
      label: 'TRADE WITH THEM',
      description: '+50 Scrap from the procession\'s wares.',
      resolve: (run) => {
        run.scrap += 50;
        return '+50 Scrap. The procession passes singing.';
      }
    },
    {
      label: 'WALK ALONE',
      description: 'Pilgrims have their road. You have yours.',
      resolve: () => 'You watch them pass and continue alone.'
    }
  ]
};

const CLOCKWORK_ACOLYTE: EventDef = {
  id: 'clockworkAcolyte',
  title: 'CLOCKWORK ACOLYTE',
  body:
    'A small brass priest tilts its head at you. Inside its cabinet are ' +
    'a stack of inscribed tomes. Brass tongue, brass voice.',
  acts: [4],
  choices: [
    {
      label: 'BUY A TOME — 55 Scrap',
      description: 'Acquire a random Power card.',
      enabled: (run) => run.scrap >= 55,
      resolve: (run, rng) => {
        if (run.scrap < 55) return 'Not enough scrap.';
        const powers = SHOP_POOL.filter((id) => CARDS[id].type === 'power');
        if (powers.length === 0) return 'The cabinet is empty.';
        run.scrap -= 55;
        const id = powers[Math.floor(rng() * powers.length)];
        run.player.deck.push(id);
        return `-55 Scrap. Inscribed: ${cardName(id)}.`;
      }
    },
    {
      label: 'RECEIVE A BLESSING',
      description: 'Free. Gain a common card.',
      resolve: (run) => {
        const id = pickRewardCards(1, false)[0];
        if (id) run.player.deck.push(id);
        return `The acolyte taps your hull. Gift: ${cardName(id)}.`;
      }
    },
    {
      label: 'WALK PAST',
      description: 'Brass tongues are not for you.',
      resolve: () => 'You bow and pass on.'
    }
  ]
};

// ----- Act 5: World-Forge -----

const MOLTEN_VEIN: EventDef = {
  id: 'moltenVein',
  title: 'MOLTEN VEIN',
  body:
    'A glowing red river runs across the path. Heat shimmers above it. ' +
    'A pilgrim\'s anvil rests at the edge.',
  acts: [5],
  choices: [
    {
      label: 'FORGE A CARD',
      description: '-8 Hull from the heat. Upgrade a random card in your deck.',
      enabled: (run) => run.player.deck.some(isUpgradable),
      resolve: (run, rng) => {
        const upgradable = run.player.deck
          .map((id, i) => (isUpgradable(id) ? i : -1))
          .filter((i) => i >= 0);
        if (upgradable.length === 0) return 'Your deck has nothing left to temper.';
        losePlayerHull(run, 8);
        const pick = upgradable[Math.floor(rng() * upgradable.length)];
        const oldId = run.player.deck[pick];
        const newId = upgradeCardId(oldId);
        run.player.deck[pick] = newId;
        return `-8 Hull. ${cardName(oldId)} → ${cardName(newId)}.`;
      }
    },
    {
      label: 'WADE FOR ORE',
      description: '-12 Hull. +60 Scrap from the vein bed.',
      resolve: (run) => {
        losePlayerHull(run, 12);
        run.scrap += 60;
        return '-12 Hull. +60 Scrap. Your plating sizzles for an hour.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Some rivers don\'t want crossing.',
      resolve: () => 'You walk the long way around.'
    }
  ]
};

const ANCIENT_ANVIL: EventDef = {
  id: 'ancientAnvil',
  title: 'ANCIENT ANVIL',
  body:
    'A black iron anvil sits in the middle of the road, untouched by ' +
    'rust. The brass plaque is unreadable. The hammer rests beside it.',
  acts: [5],
  choices: [
    {
      label: 'HAMMER A CARD',
      description: 'Free. Upgrade a random card in your deck.',
      enabled: (run) => run.player.deck.some(isUpgradable),
      resolve: (run, rng) => {
        const upgradable = run.player.deck
          .map((id, i) => (isUpgradable(id) ? i : -1))
          .filter((i) => i >= 0);
        if (upgradable.length === 0) return 'The anvil rings on nothing — no card to sharpen.';
        const pick = upgradable[Math.floor(rng() * upgradable.length)];
        const oldId = run.player.deck[pick];
        const newId = upgradeCardId(oldId);
        run.player.deck[pick] = newId;
        return `The hammer rings. ${cardName(oldId)} → ${cardName(newId)}.`;
      }
    },
    {
      label: 'BREAK THE ANVIL',
      description: '+80 Scrap. -3 max Hull from the recoil.',
      resolve: (run) => {
        run.player.maxHull = Math.max(1, run.player.maxHull - 3);
        run.player.hull = Math.min(run.player.hull, run.player.maxHull);
        run.scrap += 80;
        return '-3 max Hull. +80 Scrap. The anvil splits clean.';
      }
    },
    {
      label: 'WALK PAST',
      description: 'Anvils on the road are warnings.',
      resolve: () => 'You step around the iron.'
    }
  ]
};

const CRUCIBLE_TEST: EventDef = {
  id: 'crucibleTest',
  title: 'CRUCIBLE TEST',
  body:
    'A circle of stones rings a low pit of fire. A scorched plaque names ' +
    'this the Crucible of Pilots. Step in, step out.',
  acts: [5],
  choices: [
    {
      label: 'STAND IN THE FIRE',
      description: '-15 Hull. Gain a random Relic.',
      enabled: (run) => pickRelicFor(new Set(run.relics)) !== null,
      resolve: (run) => {
        losePlayerHull(run, 15);
        const id = grantRelic(run);
        if (!id) return '-15 Hull. The crucible has nothing left to give you.';
        return `-15 Hull. Bolted to your frame: ${RELICS[id]?.name ?? id}.`;
      }
    },
    {
      label: 'WALK THE RIM',
      description: '+1 random potion.',
      enabled: (run) => run.potions.some((p) => p === null),
      resolve: (run, rng) => {
        const pid = pickRandomPotionId(rng);
        const placed = tryAddPotion(run, pid);
        return placed
          ? `Bottled from the heat: ${potionName(pid)}.`
          : 'Belt full — the heat slides off you.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Pilots don\'t have to prove anything.',
      resolve: () => 'You walk the long way around.'
    }
  ]
};

const EMBER_PROPHET: EventDef = {
  id: 'emberProphet',
  title: 'EMBER PROPHET',
  body:
    'A figure of glowing coals sits crosslegged in your path, eyes blank. ' +
    '"Choose your inscription, pilot. I will see it done."',
  acts: [5],
  choices: [
    {
      label: 'INSCRIBE A POWER',
      description: 'Gain a random Power card.',
      resolve: (run, rng) => {
        const ids = SHOP_POOL.filter((id) => CARDS[id].type === 'power');
        if (ids.length === 0) return 'The prophet shakes their head.';
        const id = ids[Math.floor(rng() * ids.length)];
        run.player.deck.push(id);
        return `Inscribed: ${cardName(id)}.`;
      }
    },
    {
      label: 'INSCRIBE AN AOE',
      description: 'Gain a random AoE card.',
      resolve: (run, rng) => {
        const ids = SHOP_POOL.filter((id) => CARDS[id].target === 'allEnemies');
        if (ids.length === 0) return 'The prophet shakes their head.';
        const id = ids[Math.floor(rng() * ids.length)];
        run.player.deck.push(id);
        return `Inscribed: ${cardName(id)}.`;
      }
    },
    {
      label: 'INSCRIBE A LEGENDARY',
      description: 'Gain a random legendary card. -10 Hull from the cost.',
      resolve: (run, rng) => {
        const ids = SHOP_POOL.filter((id) => CARDS[id].rarity === 'legendary');
        if (ids.length === 0) return 'The prophet shakes their head.';
        losePlayerHull(run, 10);
        const id = ids[Math.floor(rng() * ids.length)];
        run.player.deck.push(id);
        return `-10 Hull. Inscribed: ${cardName(id)}.`;
      }
    },
    {
      label: 'REFUSE',
      description: 'You write your own gear.',
      resolve: () => 'The prophet nods slowly and dims.'
    }
  ]
};

const FORGE_ENGINE: EventDef = {
  id: 'forgeEngine',
  title: 'FORGE ENGINE',
  body:
    'A massive idle engine looms in a smokehouse. The boiler is cold. ' +
    'You could light it — or strip it for parts.',
  acts: [5],
  choices: [
    {
      label: 'STOKE IT',
      description: '-8 Hull. Gain the Power Cell relic if you don\'t have it.',
      enabled: (run) => !run.relics.includes('powerCell'),
      resolve: (run) => {
        losePlayerHull(run, 8);
        if (run.relics.includes('powerCell')) return '-8 Hull. The engine is already yours, in a way.';
        run.relics.push('powerCell');
        RELICS['powerCell']?.onPickup?.(run);
        return '-8 Hull. The engine roars. Bolted on: Power Cell.';
      }
    },
    {
      label: 'STRIP IT',
      description: '+60 Scrap from the boiler plates.',
      resolve: (run) => {
        run.scrap += 60;
        return '+60 Scrap. The engine sighs and goes cold.';
      }
    },
    {
      label: 'LEAVE',
      description: 'Don\'t wake what\'s sleeping.',
      resolve: () => 'You leave the smokehouse to its dust.'
    }
  ]
};

const WORLD_SHARD: EventDef = {
  id: 'worldShard',
  title: 'WORLD-SHARD',
  body:
    'A fragment of glowing iron, the size of a fist, sits unblinking on ' +
    'a stone. The road bends around it. Pilgrims rumor it is a piece of ' +
    'the World-Forge itself.',
  acts: [5],
  choices: [
    {
      label: 'TOUCH IT',
      description: '50%: heal to full Hull. 50%: -20 Hull from the heat.',
      resolve: (run, rng) => {
        if (rng() < 0.5) {
          const healed = gainPlayerHull(run, run.player.maxHull);
          return `The shard pulses. +${healed} Hull (full).`;
        }
        losePlayerHull(run, 20);
        return '-20 Hull. The shard answers no.';
      }
    },
    {
      label: 'EMBED IT',
      description: 'Gain a random Legendary card. -5 max Hull permanently.',
      resolve: (run, rng) => {
        const ids = SHOP_POOL.filter((id) => CARDS[id].rarity === 'legendary');
        if (ids.length === 0) return 'The shard has no inscription for you.';
        run.player.maxHull = Math.max(1, run.player.maxHull - 5);
        run.player.hull = Math.min(run.player.hull, run.player.maxHull);
        const id = ids[Math.floor(rng() * ids.length)];
        run.player.deck.push(id);
        return `-5 max Hull. The shard sinks in. Inscribed: ${cardName(id)}.`;
      }
    },
    {
      label: 'WALK PAST',
      description: 'Shards like that aren\'t for pilots.',
      resolve: () => 'You give it a wide berth.'
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
  ECHOING_VAULT,
  CURSED_IDOL,
  // Slice 43 batch — pool expands 13 -> 30
  JUNKYARD_TINKER,
  BLACK_MARKET,
  CONDUIT_TRANCE,
  WHIRLWIND_SURVIVOR,
  FROZEN_ENGINE,
  CIPHER_WHEEL,
  CRASHED_DRONE,
  TOLL_BRIDGE,
  MIRRORED_POOL,
  SEALED_AUCTION,
  PILGRIM_HEALER,
  STEEL_HERMIT,
  SNAKE_OIL_SALESMAN,
  BOILER_SPIRIT,
  OLD_SOLDIERS_CACHE,
  DRONE_SWARM,
  CRACKED_ENGINEER,
  // Slice 53 — Act 4 themed (Brass Cathedral)
  CONFESSIONAL,
  OFFERING_BRAZIER,
  TEMPERED_HYMN,
  VESTIGIAL_BELL,
  PILGRIMS_MARCH,
  CLOCKWORK_ACOLYTE,
  // Slice 53 — Act 5 themed (World-Forge)
  MOLTEN_VEIN,
  ANCIENT_ANVIL,
  CRUCIBLE_TEST,
  EMBER_PROPHET,
  FORGE_ENGINE,
  WORLD_SHARD
];

export const EVENTS_BY_ID: Record<string, EventDef> = Object.fromEntries(
  ALL_EVENTS.map((e) => [e.id, e])
);

// Picks an event appropriate for the current act. Events without an
// `acts` field can show up in any act; act-tagged events only appear
// when `act` is in their list. Falls back to the unrestricted pool if
// somehow no events match (e.g. future act value above any tag).
export function pickEventId(rng: () => number, act: number = 1): string {
  const matches = ALL_EVENTS.filter((e) => !e.acts || e.acts.includes(act));
  const pool = matches.length > 0 ? matches : ALL_EVENTS;
  return pool[Math.floor(rng() * pool.length)].id;
}

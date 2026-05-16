export interface CharacterDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  startingHull: number;
  startingDeck: string[];
  startingRelics: string[];
}

const PILOT: CharacterDef = {
  id: 'pilot',
  name: 'THE PILOT',
  tagline: 'Balanced operator. The standard rig.',
  description:
    'Reliable rust-and-rivets brawler. No surprises, no flaws. The starting choice.',
  startingHull: 65,
  startingDeck: [
    'autocannon', 'autocannon', 'autocannon', 'autocannon', 'autocannon',
    'brace', 'brace', 'brace', 'brace',
    'ventSteam'
  ],
  startingRelics: []
};

const ENGINEER: CharacterDef = {
  id: 'engineer',
  name: 'THE ENGINEER',
  tagline: 'Layered armor, careful hands.',
  description:
    'Trades raw hull for plating. Begins every fight with reinforced armor and a wrench-tight toolkit.',
  startingHull: 60,
  startingDeck: [
    'autocannon', 'autocannon', 'autocannon',
    'brace', 'brace', 'brace', 'brace', 'brace',
    'smokeScreen',
    'repairDrone'
  ],
  startingRelics: ['ironPlating']
};

const SABOTEUR: CharacterDef = {
  id: 'saboteur',
  name: 'THE SABOTEUR',
  tagline: 'Toxic. Fragile. Sharp.',
  description:
    'Lean frame, less hull. Every fight begins with the enemy already compromised. Press the advantage fast.',
  startingHull: 55,
  startingDeck: [
    'autocannon', 'autocannon', 'autocannon', 'autocannon',
    'brace', 'brace',
    'ventSteam', 'ventSteam',
    'hammerStrike',
    'hydraulicPunch'
  ],
  startingRelics: ['calibrationSpike']
};

// Slice 44 — burn-stacker snowball. Lower hull baseline, deck stacked with
// Burn-applying cards. Furnace Heart turns Burning enemies into a per-turn
// Strength ramp, so the longer a fight goes the harder the Stoker hits.
const STOKER: CharacterDef = {
  id: 'stoker',
  name: 'THE STOKER',
  tagline: 'Set them alight. Reap the smoke.',
  description:
    'Feeds a furnace heart with the smoke of burning foes. Every enemy left smoldering at end of turn cranks the Stoker\'s damage higher.',
  startingHull: 55,
  startingDeck: [
    'autocannon', 'autocannon', 'autocannon',
    'brace', 'brace', 'brace',
    'ventSteam',
    'pyroCharge', 'pyroCharge',
    'acidMist'
  ],
  startingRelics: ['furnaceHeart']
};

export const CHARACTERS: CharacterDef[] = [PILOT, ENGINEER, SABOTEUR, STOKER];

export const CHARACTER_BY_ID: Record<string, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c])
);

export function getCharacter(id: string): CharacterDef {
  return CHARACTER_BY_ID[id] ?? PILOT;
}

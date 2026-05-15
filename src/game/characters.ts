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

export const CHARACTERS: CharacterDef[] = [PILOT, ENGINEER, SABOTEUR];

export const CHARACTER_BY_ID: Record<string, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c])
);

export function getCharacter(id: string): CharacterDef {
  return CHARACTER_BY_ID[id] ?? PILOT;
}

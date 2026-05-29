import type { CardDef, CardRarity, CardType } from './types';

const card = (
  id: string,
  name: string,
  cost: number,
  target: CardDef['target'],
  description: string,
  effects: CardDef['effects'],
  exhaust?: boolean,
  rarity?: CardRarity,
  flags?: {
    retain?: boolean;
    ethereal?: boolean;
    innate?: boolean;
    type?: CardType;
    xCost?: boolean;
    unplayable?: boolean;
    endOfTurnDamageInHand?: number;
  }
): CardDef => ({ id, name, cost, target, description, effects, exhaust, rarity, ...flags });

export const CARDS: Record<string, CardDef> = {
  // ===== Starter =====
  autocannon: card('autocannon', 'Auto-Cannon', 1, 'enemy', 'Deal 6 damage.',
    [{ kind: 'damage', amount: 6 }]),
  'autocannon+': card('autocannon+', 'Auto-Cannon+', 1, 'enemy', 'Deal 9 damage.',
    [{ kind: 'damage', amount: 9 }]),

  brace: card('brace', 'Brace', 1, 'self', 'Gain 5 Plating.',
    [{ kind: 'plating', amount: 5 }]),
  'brace+': card('brace+', 'Brace+', 1, 'self', 'Gain 8 Plating.',
    [{ kind: 'plating', amount: 8 }]),

  ventSteam: card('ventSteam', 'Vent Steam', 0, 'enemy', 'Deal 3 damage. Apply 2 Vulnerable.',
    [{ kind: 'damage', amount: 3 }, { kind: 'applyVulnerable', amount: 2 }]),
  'ventSteam+': card('ventSteam+', 'Vent Steam+', 0, 'enemy', 'Deal 4 damage. Apply 3 Vulnerable.',
    [{ kind: 'damage', amount: 4 }, { kind: 'applyVulnerable', amount: 3 }]),

  // ===== Buyable =====
  ironHail: card('ironHail', 'Iron Hail', 1, 'enemy', 'Deal 8 damage.',
    [{ kind: 'damage', amount: 8 }], false, 'common'),
  'ironHail+': card('ironHail+', 'Iron Hail+', 1, 'enemy', 'Deal 11 damage.',
    [{ kind: 'damage', amount: 11 }], false, 'common'),

  bulwark: card('bulwark', 'Bulwark', 2, 'self', 'Gain 12 Plating.',
    [{ kind: 'plating', amount: 12 }], false, 'uncommon'),
  'bulwark+': card('bulwark+', 'Bulwark+', 2, 'self', 'Gain 16 Plating.',
    [{ kind: 'plating', amount: 16 }], false, 'uncommon'),

  recalibrate: card('recalibrate', 'Recalibrate', 1, 'none', 'Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }], false, 'uncommon'),
  'recalibrate+': card('recalibrate+', 'Recalibrate+', 0, 'none', 'Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }], false, 'uncommon'),

  overdrive: card('overdrive', 'Overdrive', 0, 'none', 'Gain 2 Steam. Exhaust.',
    [{ kind: 'gainSteam', amount: 2 }], true, 'uncommon'),
  'overdrive+': card('overdrive+', 'Overdrive+', 0, 'none', 'Gain 3 Steam. Exhaust.',
    [{ kind: 'gainSteam', amount: 3 }], true, 'uncommon'),

  hydraulicPunch: card('hydraulicPunch', 'Hydraulic Punch', 1, 'enemy', 'Deal 10 damage. Apply 1 Weak.',
    [{ kind: 'damage', amount: 10 }, { kind: 'applyWeak', amount: 1 }], false, 'uncommon'),
  'hydraulicPunch+': card('hydraulicPunch+', 'Hydraulic Punch+', 1, 'enemy', 'Deal 14 damage. Apply 2 Weak.',
    [{ kind: 'damage', amount: 14 }, { kind: 'applyWeak', amount: 2 }], false, 'uncommon'),

  steamLance: card('steamLance', 'Steam Lance', 2, 'enemy', 'Deal 14 damage.',
    [{ kind: 'damage', amount: 14 }], false, 'rare'),
  'steamLance+': card('steamLance+', 'Steam Lance+', 2, 'enemy', 'Deal 18 damage.',
    [{ kind: 'damage', amount: 18 }], false, 'rare'),

  repairDrone: card('repairDrone', 'Repair Drone', 1, 'self', 'Heal 5 Hull. Exhaust.',
    [{ kind: 'heal', amount: 5 }], true, 'uncommon'),
  'repairDrone+': card('repairDrone+', 'Repair Drone+', 1, 'self', 'Heal 8 Hull. Exhaust.',
    [{ kind: 'heal', amount: 8 }], true, 'uncommon'),

  smokeScreen: card('smokeScreen', 'Smoke Screen', 1, 'self', 'Gain 6 Plating. Apply 1 Weak.',
    [{ kind: 'plating', amount: 6 }, { kind: 'applyWeak', amount: 1 }], false, 'common'),
  'smokeScreen+': card('smokeScreen+', 'Smoke Screen+', 1, 'self', 'Gain 9 Plating. Apply 2 Weak.',
    [{ kind: 'plating', amount: 9 }, { kind: 'applyWeak', amount: 2 }], false, 'common'),

  counterStrike: card('counterStrike', 'Counter-Strike', 1, 'enemy', 'Deal 4 damage. Gain 4 Plating.',
    [{ kind: 'damage', amount: 4 }, { kind: 'plating', amount: 4 }], false, 'common'),
  'counterStrike+': card('counterStrike+', 'Counter-Strike+', 1, 'enemy', 'Deal 6 damage. Gain 6 Plating.',
    [{ kind: 'damage', amount: 6 }, { kind: 'plating', amount: 6 }], false, 'common'),

  hammerStrike: card('hammerStrike', 'Hammer Strike', 1, 'enemy', 'Deal 5 damage. Apply 1 Vulnerable.',
    [{ kind: 'damage', amount: 5 }, { kind: 'applyVulnerable', amount: 1 }], false, 'common'),
  'hammerStrike+': card('hammerStrike+', 'Hammer Strike+', 1, 'enemy', 'Deal 7 damage. Apply 2 Vulnerable.',
    [{ kind: 'damage', amount: 7 }, { kind: 'applyVulnerable', amount: 2 }], false, 'common'),

  drillBit: card('drillBit', 'Drill Bit', 1, 'enemy', 'Deal 6 damage. Deal 6 more if enemy has Plating.',
    [{ kind: 'damageIfEnemyPlated', amount: 6 }, { kind: 'damage', amount: 6 }], false, 'uncommon'),
  'drillBit+': card('drillBit+', 'Drill Bit+', 1, 'enemy', 'Deal 8 damage. Deal 8 more if enemy has Plating.',
    [{ kind: 'damageIfEnemyPlated', amount: 8 }, { kind: 'damage', amount: 8 }], false, 'uncommon'),

  sledgehammer: card('sledgehammer', 'Sledgehammer', 2, 'enemy', 'Deal 16 damage. Lose 3 Hull.',
    [{ kind: 'damage', amount: 16 }, { kind: 'loseHull', amount: 3 }], false, 'uncommon'),
  'sledgehammer+': card('sledgehammer+', 'Sledgehammer+', 2, 'enemy', 'Deal 22 damage. Lose 3 Hull.',
    [{ kind: 'damage', amount: 22 }, { kind: 'loseHull', amount: 3 }], false, 'uncommon'),

  steamSurge: card('steamSurge', 'Steam Surge', 1, 'enemy', 'Deal 4 damage. Gain 1 Steam.',
    [{ kind: 'damage', amount: 4 }, { kind: 'gainSteam', amount: 1 }], false, 'uncommon'),
  'steamSurge+': card('steamSurge+', 'Steam Surge+', 1, 'enemy', 'Deal 5 damage. Gain 2 Steam.',
    [{ kind: 'damage', amount: 5 }, { kind: 'gainSteam', amount: 2 }], false, 'uncommon'),

  pressureBurst: card('pressureBurst', 'Pressure Burst', 2, 'enemy', 'Deal damage equal to your Plating. Lose all Plating.',
    [{ kind: 'damageEqualToPlating', bonus: 0 }, { kind: 'losePlating' }], false, 'rare'),
  'pressureBurst+': card('pressureBurst+', 'Pressure Burst+', 2, 'enemy', 'Deal damage equal to your Plating + 4. Lose all Plating.',
    [{ kind: 'damageEqualToPlating', bonus: 4 }, { kind: 'losePlating' }], false, 'rare'),

  // ===== Slice 20: status-effect cards =====
  battleForge: card('battleForge', 'Battle Forge', 1, 'self', 'Gain 2 Strength. Exhaust.',
    [{ kind: 'gainStrength', amount: 2 }], true, 'uncommon'),
  'battleForge+': card('battleForge+', 'Battle Forge+', 1, 'self', 'Gain 3 Strength. Exhaust.',
    [{ kind: 'gainStrength', amount: 3 }], true, 'uncommon'),

  bufferPlate: card('bufferPlate', 'Buffer Plate', 1, 'self', 'Gain 2 Dexterity. Exhaust.',
    [{ kind: 'gainDexterity', amount: 2 }], true, 'uncommon'),
  'bufferPlate+': card('bufferPlate+', 'Buffer Plate+', 1, 'self', 'Gain 3 Dexterity. Exhaust.',
    [{ kind: 'gainDexterity', amount: 3 }], true, 'uncommon'),

  pyroCharge: card('pyroCharge', 'Pyro Charge', 1, 'enemy', 'Deal 4 damage. Apply 4 Burn.',
    [{ kind: 'damage', amount: 4 }, { kind: 'applyBurn', amount: 4 }], false, 'uncommon'),
  'pyroCharge+': card('pyroCharge+', 'Pyro Charge+', 1, 'enemy', 'Deal 5 damage. Apply 6 Burn.',
    [{ kind: 'damage', amount: 5 }, { kind: 'applyBurn', amount: 6 }], false, 'uncommon'),

  cinderRound: card('cinderRound', 'Cinder Round', 2, 'enemy', 'Deal 8 damage. Apply 8 Burn. Exhaust.',
    [{ kind: 'damage', amount: 8 }, { kind: 'applyBurn', amount: 8 }], true, 'rare'),
  'cinderRound+': card('cinderRound+', 'Cinder Round+', 2, 'enemy', 'Deal 10 damage. Apply 11 Burn. Exhaust.',
    [{ kind: 'damage', amount: 10 }, { kind: 'applyBurn', amount: 11 }], true, 'rare'),

  spikePlating: card('spikePlating', 'Spike Plating', 1, 'self', 'Gain 4 Plating. Gain 3 Thorns.',
    [{ kind: 'plating', amount: 4 }, { kind: 'gainThorns', amount: 3 }], false, 'common'),
  'spikePlating+': card('spikePlating+', 'Spike Plating+', 1, 'self', 'Gain 6 Plating. Gain 4 Thorns.',
    [{ kind: 'plating', amount: 6 }, { kind: 'gainThorns', amount: 4 }], false, 'common'),

  ironWill: card('ironWill', 'Iron Will', 2, 'self', 'Gain 2 Strength. Gain 2 Dexterity. Exhaust.',
    [{ kind: 'gainStrength', amount: 2 }, { kind: 'gainDexterity', amount: 2 }], true, 'epic'),
  'ironWill+': card('ironWill+', 'Iron Will+', 2, 'self', 'Gain 3 Strength. Gain 3 Dexterity. Exhaust.',
    [{ kind: 'gainStrength', amount: 3 }, { kind: 'gainDexterity', amount: 3 }], true, 'epic'),

  // ===== Slice 22: AoE cards (target: 'allEnemies') =====
  shrapnelBurst: card('shrapnelBurst', 'Shrapnel Burst', 1, 'allEnemies', 'Deal 6 damage to ALL enemies.',
    [{ kind: 'damageAll', amount: 6 }], false, 'uncommon'),
  'shrapnelBurst+': card('shrapnelBurst+', 'Shrapnel Burst+', 1, 'allEnemies', 'Deal 9 damage to ALL enemies.',
    [{ kind: 'damageAll', amount: 9 }], false, 'uncommon'),

  forgeWave: card('forgeWave', 'Forge Wave', 2, 'allEnemies', 'Deal 10 damage to ALL enemies. Apply 1 Vulnerable to all.',
    [{ kind: 'damageAll', amount: 10 }, { kind: 'applyVulnerableAll', amount: 1 }], false, 'rare'),
  'forgeWave+': card('forgeWave+', 'Forge Wave+', 2, 'allEnemies', 'Deal 13 damage to ALL enemies. Apply 2 Vulnerable to all.',
    [{ kind: 'damageAll', amount: 13 }, { kind: 'applyVulnerableAll', amount: 2 }], false, 'rare'),

  acidMist: card('acidMist', 'Acid Mist', 1, 'allEnemies', 'Apply 4 Burn to ALL enemies.',
    [{ kind: 'applyBurnAll', amount: 4 }], false, 'uncommon'),
  'acidMist+': card('acidMist+', 'Acid Mist+', 1, 'allEnemies', 'Apply 6 Burn to ALL enemies.',
    [{ kind: 'applyBurnAll', amount: 6 }], false, 'uncommon'),

  concussion: card('concussion', 'Concussion', 1, 'allEnemies', 'Deal 4 damage to ALL enemies. Apply 1 Weak to all.',
    [{ kind: 'damageAll', amount: 4 }, { kind: 'applyWeakAll', amount: 1 }], false, 'common'),
  'concussion+': card('concussion+', 'Concussion+', 1, 'allEnemies', 'Deal 6 damage to ALL enemies. Apply 2 Weak to all.',
    [{ kind: 'damageAll', amount: 6 }, { kind: 'applyWeakAll', amount: 2 }], false, 'common'),

  // ===== Keyword demo: Innate / Retain / Ethereal =====
  pressureReading: card('pressureReading', 'Pressure Reading', 0, 'none', 'Innate. Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }], false, 'uncommon', { innate: true }),
  'pressureReading+': card('pressureReading+', 'Pressure Reading+', 0, 'none', 'Innate. Draw 3 cards.',
    [{ kind: 'draw', amount: 3 }], false, 'uncommon', { innate: true }),

  holdPosition: card('holdPosition', 'Hold Position', 1, 'self', 'Gain 7 Plating. Retain.',
    [{ kind: 'plating', amount: 7 }], false, 'uncommon', { retain: true }),
  'holdPosition+': card('holdPosition+', 'Hold Position+', 1, 'self', 'Gain 10 Plating. Retain.',
    [{ kind: 'plating', amount: 10 }], false, 'uncommon', { retain: true }),

  glassRound: card('glassRound', 'Glass Round', 0, 'enemy', 'Deal 12 damage. Ethereal. Exhaust.',
    [{ kind: 'damage', amount: 12 }], true, 'rare', { ethereal: true }),
  'glassRound+': card('glassRound+', 'Glass Round+', 0, 'enemy', 'Deal 16 damage. Ethereal. Exhaust.',
    [{ kind: 'damage', amount: 16 }], true, 'rare', { ethereal: true }),

  // ===== Powers — persistent in-combat buffs that exhaust on play =====
  demonForm: card('demonForm', 'Demon Form', 3, 'self', 'Power. At the start of each turn, gain 2 Strength.',
    [{ kind: 'addDemonForm', amount: 2 }], true, 'epic', { type: 'power' }),
  'demonForm+': card('demonForm+', 'Demon Form+', 3, 'self', 'Power. At the start of each turn, gain 3 Strength.',
    [{ kind: 'addDemonForm', amount: 3 }], true, 'epic', { type: 'power' }),

  barricade: card('barricade', 'Barricade', 3, 'self', 'Power. Plating no longer wears off at the start of your turn.',
    [{ kind: 'setBarricade' }], true, 'epic', { type: 'power' }),
  'barricade+': card('barricade+', 'Barricade+', 2, 'self', 'Power. Plating no longer wears off at the start of your turn.',
    [{ kind: 'setBarricade' }], true, 'epic', { type: 'power' }),

  metallicize: card('metallicize', 'Metallicize', 1, 'self', 'Power. At the end of each turn, gain 3 Plating.',
    [{ kind: 'addMetallicize', amount: 3 }], true, 'uncommon', { type: 'power' }),
  'metallicize+': card('metallicize+', 'Metallicize+', 1, 'self', 'Power. At the end of each turn, gain 4 Plating.',
    [{ kind: 'addMetallicize', amount: 4 }], true, 'uncommon', { type: 'power' }),

  combust: card('combust', 'Combust', 1, 'allEnemies', 'Power. At the end of each turn, lose 1 hull and deal 5 damage to ALL enemies.',
    [{ kind: 'addCombust', amount: 5 }], true, 'uncommon', { type: 'power' }),
  'combust+': card('combust+', 'Combust+', 1, 'allEnemies', 'Power. At the end of each turn, lose 1 hull and deal 7 damage to ALL enemies.',
    [{ kind: 'addCombust', amount: 7 }], true, 'uncommon', { type: 'power' }),

  // ===== X-cost cards. Consume ALL remaining Steam at play time and
  // scale effects by the amount consumed. Cost badge shows "X".
  whirlwind: card('whirlwind', 'Whirlwind', 0, 'allEnemies', 'Deal 5 damage to ALL enemies X times.',
    [{ kind: 'xDamageAll', amount: 5 }], false, 'common', { xCost: true }),
  'whirlwind+': card('whirlwind+', 'Whirlwind+', 0, 'allEnemies', 'Deal 7 damage to ALL enemies X times.',
    [{ kind: 'xDamageAll', amount: 7 }], false, 'common', { xCost: true }),

  skewer: card('skewer', 'Skewer', 0, 'enemy', 'Deal 7 damage X times.',
    [{ kind: 'xDamage', amount: 7 }], false, 'uncommon', { xCost: true }),
  'skewer+': card('skewer+', 'Skewer+', 0, 'enemy', 'Deal 10 damage X times.',
    [{ kind: 'xDamage', amount: 10 }], false, 'uncommon', { xCost: true }),

  forgeCycle: card('forgeCycle', 'Forge Cycle', 0, 'self', 'Gain 4 Plating X times.',
    [{ kind: 'xPlating', amount: 4 }], false, 'uncommon', { xCost: true }),
  'forgeCycle+': card('forgeCycle+', 'Forge Cycle+', 0, 'self', 'Gain 6 Plating X times.',
    [{ kind: 'xPlating', amount: 6 }], false, 'uncommon', { xCost: true }),

  // ===== Status / curse cards. Not in SHOP_POOL or REWARD_POOL — only
  // enter the player's deck via enemy actions (status) or events (curse).
  slagGlob: card('slagGlob', 'Slag Glob', 1, 'none',
    'Useless slag. Exhaust on play.',
    [], true),
  shrapnel: card('shrapnel', 'Shrapnel', 0, 'none',
    'Unplayable. Ethereal — exhausts if held at end of turn.',
    [], false, undefined, { unplayable: true, ethereal: true }),
  heatDamage: card('heatDamage', 'Heat Damage', 0, 'none',
    'Unplayable. Lose 2 Hull at the end of every turn it is in your hand.',
    [], false, undefined, { unplayable: true, endOfTurnDamageInHand: 2 }),
  oldRust: card('oldRust', 'Old Rust', 0, 'none',
    'Unplayable. Dead weight in your deck.',
    [], false, undefined, { unplayable: true }),

  // ===== Slice 49 — Burn pack (Stoker depth) =====
  // The Stoker landed in Slice 44 but the Burn card pool stayed
  // thin (Pyro Charge, Acid Mist, Cinder Round, Ember Round). These
  // five cards build out the archetype across all rarities, with
  // Ignite's damageScaledByBurn payoff turning every prior Burn
  // application into a damage premultiplier.

  cinderWave: card('cinderWave', 'Cinder Wave', 1, 'allEnemies',
    'Apply 2 Burn to ALL enemies.',
    [{ kind: 'applyBurnAll', amount: 2 }], false, 'common'),
  'cinderWave+': card('cinderWave+', 'Cinder Wave+', 1, 'allEnemies',
    'Apply 3 Burn to ALL enemies.',
    [{ kind: 'applyBurnAll', amount: 3 }], false, 'common'),

  emberToss: card('emberToss', 'Ember Toss', 0, 'enemy',
    'Apply 3 Burn. Exhaust.',
    [{ kind: 'applyBurn', amount: 3 }], true, 'common'),
  'emberToss+': card('emberToss+', 'Ember Toss+', 0, 'enemy',
    'Apply 4 Burn. Exhaust.',
    [{ kind: 'applyBurn', amount: 4 }], true, 'common'),

  ignite: card('ignite', 'Ignite', 1, 'enemy',
    'Deal 4 damage. Deal 2 more damage per Burn on the target.',
    [{ kind: 'damageScaledByBurn', base: 4, perBurn: 2 }], false, 'uncommon'),
  'ignite+': card('ignite+', 'Ignite+', 1, 'enemy',
    'Deal 6 damage. Deal 2 more damage per Burn on the target.',
    [{ kind: 'damageScaledByBurn', base: 6, perBurn: 2 }], false, 'uncommon'),

  sear: card('sear', 'Sear', 2, 'enemy',
    'Deal 12 damage. Apply 6 Burn. Exhaust.',
    [{ kind: 'damage', amount: 12 }, { kind: 'applyBurn', amount: 6 }], true, 'rare'),
  'sear+': card('sear+', 'Sear+', 2, 'enemy',
    'Deal 16 damage. Apply 8 Burn. Exhaust.',
    [{ kind: 'damage', amount: 16 }, { kind: 'applyBurn', amount: 8 }], true, 'rare'),

  brimstone: card('brimstone', 'Brimstone', 2, 'allEnemies',
    'Deal 6 damage to ALL enemies. Apply 4 Burn to ALL enemies. Exhaust.',
    [{ kind: 'damageAll', amount: 6 }, { kind: 'applyBurnAll', amount: 4 }], true, 'epic'),
  'brimstone+': card('brimstone+', 'Brimstone+', 2, 'allEnemies',
    'Deal 8 damage to ALL enemies. Apply 5 Burn to ALL enemies. Exhaust.',
    [{ kind: 'damageAll', amount: 8 }, { kind: 'applyBurnAll', amount: 5 }], true, 'epic'),

  // ===== Status-effect entry points at common rarity =====
  // Each fills a status archetype that previously only had uncommon/rare
  // cards (Burn / Strength / Dexterity), making those decks accessible
  // from early shop / reward picks.
  emberRound: card('emberRound', 'Ember Round', 1, 'enemy',
    'Deal 5 damage. Apply 2 Burn.',
    [{ kind: 'damage', amount: 5 }, { kind: 'applyBurn', amount: 2 }], false, 'common'),
  'emberRound+': card('emberRound+', 'Ember Round+', 1, 'enemy',
    'Deal 7 damage. Apply 3 Burn.',
    [{ kind: 'damage', amount: 7 }, { kind: 'applyBurn', amount: 3 }], false, 'common'),

  steelResolve: card('steelResolve', 'Steel Resolve', 1, 'self',
    'Gain 1 Strength. Exhaust.',
    [{ kind: 'gainStrength', amount: 1 }], true, 'common'),
  'steelResolve+': card('steelResolve+', 'Steel Resolve+', 1, 'self',
    'Gain 2 Strength. Exhaust.',
    [{ kind: 'gainStrength', amount: 2 }], true, 'common'),

  plateAdjust: card('plateAdjust', 'Plate Adjust', 1, 'self',
    'Gain 1 Dexterity. Exhaust.',
    [{ kind: 'gainDexterity', amount: 1 }], true, 'common'),
  'plateAdjust+': card('plateAdjust+', 'Plate Adjust+', 1, 'self',
    'Gain 2 Dexterity. Exhaust.',
    [{ kind: 'gainDexterity', amount: 2 }], true, 'common'),

  // ===== New rare cards =====
  furnaceStrike: card('furnaceStrike', 'Furnace Strike', 2, 'enemy',
    'Deal 18 damage. Apply 5 Burn.',
    [{ kind: 'damage', amount: 18 }, { kind: 'applyBurn', amount: 5 }], false, 'epic'),
  'furnaceStrike+': card('furnaceStrike+', 'Furnace Strike+', 2, 'enemy',
    'Deal 22 damage. Apply 7 Burn.',
    [{ kind: 'damage', amount: 22 }, { kind: 'applyBurn', amount: 7 }], false, 'epic'),

  reactorSurge: card('reactorSurge', 'Reactor Surge', 2, 'enemy',
    'Deal 14 damage. Apply 3 Vulnerable.',
    [{ kind: 'damage', amount: 14 }, { kind: 'applyVulnerable', amount: 3 }], false, 'rare'),
  'reactorSurge+': card('reactorSurge+', 'Reactor Surge+', 2, 'enemy',
    'Deal 18 damage. Apply 4 Vulnerable.',
    [{ kind: 'damage', amount: 18 }, { kind: 'applyVulnerable', amount: 4 }], false, 'rare'),

  // ===== Legendary cards. Show up rarely (2% combat / 10% elite weight)
  // and are designed to be deck-defining single-pick payoffs.
  overdriveCore: card('overdriveCore', 'Overdrive Core', 2, 'self',
    'Gain 2 Strength, 2 Dexterity, and 2 Thorns. Exhaust.',
    [
      { kind: 'gainStrength', amount: 2 },
      { kind: 'gainDexterity', amount: 2 },
      { kind: 'gainThorns', amount: 2 }
    ], true, 'legendary'),
  'overdriveCore+': card('overdriveCore+', 'Overdrive Core+', 2, 'self',
    'Gain 3 Strength, 3 Dexterity, and 3 Thorns. Exhaust.',
    [
      { kind: 'gainStrength', amount: 3 },
      { kind: 'gainDexterity', amount: 3 },
      { kind: 'gainThorns', amount: 3 }
    ], true, 'legendary'),

  finalLance: card('finalLance', 'Final Lance', 0, 'enemy',
    'Deal 12 damage X times. Exhaust.',
    [{ kind: 'xDamage', amount: 12 }], true, 'legendary', { xCost: true }),
  'finalLance+': card('finalLance+', 'Final Lance+', 0, 'enemy',
    'Deal 15 damage X times. Exhaust.',
    [{ kind: 'xDamage', amount: 15 }], true, 'legendary', { xCost: true }),

  // ===== Slice 50 — Conductor momentum pack =====
  // Cards that reward playing many cards in a turn. Pair with Steam
  // Whistle (every 3rd card → +1 Str) for a snowballing combo deck.

  pressureDrum: card('pressureDrum', 'Pressure Drum', 0, 'enemy',
    'Deal 4 damage. Exhaust.',
    [{ kind: 'damage', amount: 4 }], true, 'common'),
  'pressureDrum+': card('pressureDrum+', 'Pressure Drum+', 0, 'enemy',
    'Deal 6 damage. Exhaust.',
    [{ kind: 'damage', amount: 6 }], true, 'common'),

  tempoShift: card('tempoShift', 'Tempo Shift', 1, 'none',
    'Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }], false, 'common'),
  'tempoShift+': card('tempoShift+', 'Tempo Shift+', 0, 'none',
    'Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }], false, 'common'),

  crescendo: card('crescendo', 'Crescendo', 1, 'enemy',
    'Deal 5 damage. Deal 8 more if you have already played 2 cards this turn.',
    [
      { kind: 'damage', amount: 5 },
      { kind: 'bonusDamageIfCardsAtLeast', amount: 8, threshold: 2 }
    ], false, 'uncommon'),
  'crescendo+': card('crescendo+', 'Crescendo+', 1, 'enemy',
    'Deal 7 damage. Deal 11 more if you have already played 2 cards this turn.',
    [
      { kind: 'damage', amount: 7 },
      { kind: 'bonusDamageIfCardsAtLeast', amount: 11, threshold: 2 }
    ], false, 'uncommon'),

  // Counterpoint — high-burst payoff. Rewards stacking momentum into a
  // single big swing late in the turn. Threshold 3 = 4th card or later.
  counterpoint: card('counterpoint', 'Counterpoint', 2, 'enemy',
    'Deal 12 damage. Deal 16 more if you have already played 3 cards this turn.',
    [
      { kind: 'damage', amount: 12 },
      { kind: 'bonusDamageIfCardsAtLeast', amount: 16, threshold: 3 }
    ], false, 'rare'),
  'counterpoint+': card('counterpoint+', 'Counterpoint+', 2, 'enemy',
    'Deal 16 damage. Deal 20 more if you have already played 3 cards this turn.',
    [
      { kind: 'damage', amount: 16 },
      { kind: 'bonusDamageIfCardsAtLeast', amount: 20, threshold: 3 }
    ], false, 'rare')
};

export const STARTER_DECK: string[] = [
  'autocannon', 'autocannon', 'autocannon', 'autocannon', 'autocannon',
  'brace', 'brace', 'brace', 'brace',
  'ventSteam'
];

export const SHOP_POOL: string[] = [
  'ironHail', 'bulwark', 'recalibrate', 'overdrive',
  'hydraulicPunch', 'steamLance', 'repairDrone', 'smokeScreen',
  'counterStrike', 'hammerStrike', 'drillBit', 'sledgehammer',
  'steamSurge', 'pressureBurst',
  'battleForge', 'bufferPlate', 'pyroCharge', 'cinderRound',
  'spikePlating', 'ironWill',
  'shrapnelBurst', 'forgeWave', 'acidMist', 'concussion',
  'pressureReading', 'holdPosition', 'glassRound',
  'demonForm', 'barricade', 'metallicize', 'combust',
  'whirlwind', 'skewer', 'forgeCycle',
  // Slice 39 — common entry points, new rares, legendaries
  'emberRound', 'steelResolve', 'plateAdjust',
  'furnaceStrike', 'reactorSurge',
  'overdriveCore', 'finalLance',
  // Slice 49 — Burn pack
  'cinderWave', 'emberToss', 'ignite', 'sear', 'brimstone',
  // Slice 50 — Conductor momentum pack
  'pressureDrum', 'tempoShift', 'crescendo', 'counterpoint'
];

export function isUpgradable(cardId: string): boolean {
  return !cardId.endsWith('+') && (cardId + '+') in CARDS;
}

export function upgradeCardId(cardId: string): string {
  return isUpgradable(cardId) ? cardId + '+' : cardId;
}

export const REWARD_POOL: string[] = SHOP_POOL.slice();

// Reward-pool rarity weights. Five tiers as of Slice 39:
// common / uncommon / rare / epic / legendary. Epic sits between rare and
// legendary (~4% combat / 13% elite). Legendary is the rarest tier and
// should feel deck-defining when it shows up.
const RARITY_WEIGHTS_COMBAT: Record<CardRarity, number> = {
  common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1
};
const RARITY_WEIGHTS_ELITE: Record<CardRarity, number> = {
  common: 18, uncommon: 40, rare: 22, epic: 13, legendary: 7
};

export function pickRewardCards(count: number, isElite: boolean, rng: () => number = Math.random): string[] {
  const weights = isElite ? RARITY_WEIGHTS_ELITE : RARITY_WEIGHTS_COMBAT;
  const pool = REWARD_POOL.slice();
  const picked: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const choices = pool.map((id) => ({ id, w: weights[CARDS[id].rarity ?? 'common'] }));
    const total = choices.reduce((a, b) => a + b.w, 0);
    let roll = rng() * total;
    let chosen = choices[choices.length - 1].id;
    for (const c of choices) {
      roll -= c.w;
      if (roll <= 0) { chosen = c.id; break; }
    }
    picked.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return picked;
}

// Allow runtime imports of CardRarity for tooling that needs it
export type { CardRarity };

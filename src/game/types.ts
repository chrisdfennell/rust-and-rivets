export type CardId = string;

export type Target = 'enemy' | 'self' | 'none' | 'allEnemies';

export type CardEffect =
  | { kind: 'damage'; amount: number }
  | { kind: 'plating'; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'gainSteam'; amount: number }
  | { kind: 'applyVulnerable'; amount: number }
  | { kind: 'applyWeak'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'loseHull'; amount: number }
  | { kind: 'damageIfEnemyPlated'; amount: number }
  | { kind: 'damageEqualToPlating'; bonus: number }
  | { kind: 'losePlating' }
  | { kind: 'gainStrength'; amount: number }
  | { kind: 'gainDexterity'; amount: number }
  | { kind: 'gainThorns'; amount: number }
  | { kind: 'applyBurn'; amount: number }
  | { kind: 'damageAll'; amount: number }
  | { kind: 'applyVulnerableAll'; amount: number }
  | { kind: 'applyWeakAll'; amount: number }
  | { kind: 'applyBurnAll'; amount: number }
  // ----- Power-card activations. These mutate persistent in-combat
  // state on PlayerState which the combat loop reads each turn.
  | { kind: 'addDemonForm'; amount: number }
  | { kind: 'setBarricade' }
  | { kind: 'addMetallicize'; amount: number }
  | { kind: 'addCombust'; amount: number };

export type CardRarity = 'common' | 'uncommon' | 'rare';

export type PotionEffect = CardEffect;

export interface PotionDef {
  id: string;
  name: string;
  target: Target;
  description: string;
  effects: PotionEffect[];
  rarity?: CardRarity;
}

export type CardType = 'attack' | 'skill' | 'power';

export interface CardDef {
  id: CardId;
  name: string;
  cost: number;
  target: Target;
  description: string;
  effects: CardEffect[];
  exhaust?: boolean;
  rarity?: CardRarity;
  // Stays in hand at end of turn instead of being discarded.
  retain?: boolean;
  // If still in hand at end of turn, goes to the exhaust pile (not discard).
  ethereal?: boolean;
  // Pulled into the opening hand on turn 1 regardless of draw order.
  innate?: boolean;
  // Power cards apply persistent in-combat buffs that fire on turn-start
  // or turn-end. They exhaust on play. Currently only used for UI labeling;
  // exhaust behavior comes from the existing `exhaust` flag.
  type?: CardType;
}

export interface CardInstance {
  uid: number;
  def: CardDef;
}

export type IntentKind = 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown';

export interface Intent {
  kind: IntentKind;
  damage?: number;
  hits?: number;
  plating?: number;
  label: string;
}

export interface EnemyAction {
  intent: Intent;
  resolve: (ctx: ResolveCtx) => void;
}

export interface PickCtx {
  turn: number;
  rng: () => number;
  memory: Record<string, unknown>;
  lastIntent?: Intent;
}

export interface EnemyDef {
  id: string;
  name: string;
  maxHull: number;
  pickAction: (ctx: PickCtx) => EnemyAction;
}

export interface Combatant {
  hull: number;
  maxHull: number;
  plating: number;
  vulnerable: number;
  weak: number;
  strength: number;
  dexterity: number;
  burn: number;
  thorns: number;
}

export interface EnemyState extends Combatant {
  def: EnemyDef;
  nextAction: EnemyAction;
  memory: Record<string, unknown>;
  lastIntent?: Intent;
}

export interface PlayerState extends Combatant {
  steam: number;
  maxSteam: number;
  draw: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  exhaust: CardInstance[];
  firstAttackBonus: number;
  firstCardFree: boolean;
  cardsPlayedThisTurn: number;
  // Power-card persistent buffs. Default 0 / false. Reset every combat.
  demonForm: number; // Strength gained at the start of each turn.
  barricade: boolean; // Plating no longer resets at turn start.
  metallicize: number; // Plating gained at the end of each turn.
  combust: number; // Hull paid + damage dealt to all enemies at end of each turn.
}

export interface PersistentPlayer {
  hull: number;
  maxHull: number;
  deck: string[];
  characterId: string;
  // Run-level meta bonuses. Default to 3 and 0 respectively when absent
  // (back-compat for saves predating workshop additions).
  maxSteam?: number;
  startingPlating?: number;
}

export type CombatPhase = 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat';

export interface CombatState {
  phase: CombatPhase;
  turn: number;
  player: PlayerState;
  enemies: EnemyState[];
  // Set by playCard before effects resolve so per-target helpers know which
  // enemy to hit. Falls back to the first alive enemy when undefined (e.g.
  // for relic-triggered damage like Pneumatic Strike).
  activeTargetIndex?: number;
  // Set while an enemy's nextAction is resolving so dealDamageToPlayer can
  // attribute damage to the right attacker (matters for player Thorns).
  activeAttackerIndex?: number;
  log: string[];
  relicIds: string[];
}

export interface ResolveCtx {
  state: CombatState;
  log: (msg: string) => void;
}

export type CardId = string;

export type Target = 'enemy' | 'self' | 'none';

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
  | { kind: 'applyBurn'; amount: number };

export type CardRarity = 'common' | 'uncommon' | 'rare';

export interface CardDef {
  id: CardId;
  name: string;
  cost: number;
  target: Target;
  description: string;
  effects: CardEffect[];
  exhaust?: boolean;
  rarity?: CardRarity;
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
}

export interface PersistentPlayer {
  hull: number;
  maxHull: number;
  deck: string[];
  characterId: string;
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

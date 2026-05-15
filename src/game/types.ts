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
  | { kind: 'losePlating' };

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
  enemy: EnemyState;
  log: string[];
  relicIds: string[];
}

export interface ResolveCtx {
  state: CombatState;
  log: (msg: string) => void;
}

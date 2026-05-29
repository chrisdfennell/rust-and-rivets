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
  // Damage that scales with the target's existing Burn stacks. Reads
  // base + (perBurn × target.burn) so cards like Ignite reward setting
  // the enemy on fire before unloading. Applies on a single target.
  | { kind: 'damageScaledByBurn'; base: number; perBurn: number }
  // Bonus damage to the active target if the player has already played at
  // least `threshold` cards this turn. cardsPlayedThisTurn is incremented
  // AFTER effects resolve, so threshold=2 reads as "this is the 3rd card
  // or later." Used by the Conductor's momentum-payoff cards.
  | { kind: 'bonusDamageIfCardsAtLeast'; amount: number; threshold: number }
  // Bonus damage to the active target if the target currently has Weak.
  // Resolves AFTER the card's base damage hit so killing-blow attacks
  // still trigger cleanly. Same shape as `damageIfEnemyPlated`.
  | { kind: 'bonusDamageIfEnemyWeak'; amount: number }
  | { kind: 'damageAll'; amount: number }
  | { kind: 'applyVulnerableAll'; amount: number }
  | { kind: 'applyWeakAll'; amount: number }
  | { kind: 'applyBurnAll'; amount: number }
  // ----- Power-card activations. These mutate persistent in-combat
  // state on PlayerState which the combat loop reads each turn.
  | { kind: 'addDemonForm'; amount: number }
  | { kind: 'setBarricade' }
  | { kind: 'addMetallicize'; amount: number }
  | { kind: 'addCombust'; amount: number }
  // ----- X-cost scaling. The card consumes all remaining Steam at play
  // time; each `amount` applies X times. Per-hit so Strength / Vuln /
  // Brass Knuckles / Dexterity all stack correctly on every iteration.
  | { kind: 'xDamageAll'; amount: number }
  | { kind: 'xDamage'; amount: number }
  | { kind: 'xPlating'; amount: number };

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

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
  // X-cost cards consume ALL remaining Steam when played and pass that
  // amount into x-effect kinds. `cost` is treated as 0 for canPlay
  // (always playable); the cost badge renders "X" instead of a number.
  xCost?: boolean;
  // Cannot be played from hand — `canPlay` returns false. Used for
  // status / curse cards that exist purely as deck clutter (Wound,
  // Dazed, Heat Damage). Cost badge renders "—" for clarity.
  unplayable?: boolean;
  // If still in hand at end of turn, the player takes this much hull
  // damage (bypasses plating). Used for curses like Heat Damage. Fires
  // BEFORE the regular hand-routing step so even ethereal curses sting
  // before they auto-exhaust.
  endOfTurnDamageInHand?: number;
  // Volatile keyword (Slice 53). If the card is still in hand at end of
  // turn, deal this much damage to a random alive enemy and exhaust the
  // card (instead of discarding it). Pre-Strength/Vuln since it routes
  // through `dealDamageToEnemy`, same pipeline as regular attacks.
  volatileDamage?: number;
  // Echo keyword (Slice 53). When played, the effects list resolves a
  // second time before the card moves to discard/exhaust. Only one card
  // gets played for counters like cardsPlayedThisTurn.
  echo?: boolean;
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
  // Heavy Mantle workshop seeds every combat with a few Thorns. Mirrors
  // startingPlating: read after relic onCombatStart hooks fire so the
  // numbers stack additively.
  startingThorns?: number;
}

export type CombatPhase = 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat';

// Recorded during endTurn so CombatScene can replay the enemy beat as a
// timed sequence (one damage number per hit, per-enemy lunge, etc.) instead
// of showing all damage in a single visual tick. Helpers like
// dealDamageToPlayer push into state.turnEvents; the scene reads it after
// endTurn returns.
export type TurnEvent =
  | { kind: 'enemyAct'; enemyIdx: number; intentLabel: string }
  | { kind: 'playerDamaged'; from: number; through: number; absorbed: number }
  | { kind: 'enemyDamaged'; enemyIdx: number; through: number; absorbed: number }
  | { kind: 'enemyDied'; enemyIdx: number }
  | { kind: 'enemyPlating'; enemyIdx: number; amount: number }
  | { kind: 'playerStatus'; status: 'vulnerable' | 'weak' | 'burn'; amount: number }
  | { kind: 'playerBurnTick'; amount: number }
  | { kind: 'playerHealed'; amount: number }
  // A relic's combat hook fired. CombatScene listens for these and
  // plays a soft brass-bell SFX so the player hears their gear ticking
  // over without having to read the log. `id` is the relic id for any
  // future per-relic flourishes.
  | { kind: 'relicTriggered'; id: string }
  | { kind: 'log'; text: string };

export interface CombatState {
  phase: CombatPhase;
  turn: number;
  player: PlayerState;
  enemies: EnemyState[];
  // Set by playCard before effects resolve so per-target helpers know which
  // enemy to hit. Falls back to the first alive enemy when undefined (e.g.
  // for relic-triggered damage like Pneumatic Strike).
  activeTargetIndex?: number;
  // Set by playCard when an X-cost card is played, equal to the Steam
  // consumed (matches the card's "X" value). Read by xDamage / xDamageAll
  // / xPlating effect handlers. Cleared after the card finishes resolving.
  activeCardX?: number;
  // Set while an enemy's nextAction is resolving so dealDamageToPlayer can
  // attribute damage to the right attacker (matters for player Thorns).
  activeAttackerIndex?: number;
  log: string[];
  relicIds: string[];
  // Largest single hull-damage hit the player has landed in this combat,
  // bubbled to run.stats.biggestHit on victory/defeat.
  biggestPlayerHit: number;
  // Ascension damage multiplier applied to enemy outgoing damage in
  // dealDamageToPlayer. 1.0 = no scaling. Set once at combat init based
  // on combatKind + ascension tier; never mutated mid-combat.
  enemyDamageMult: number;
  // Per-turn event log used by CombatScene to play back the enemy turn
  // as a timed sequence. Cleared at the start of endTurn; populated by
  // damage / plating / status helpers as they fire.
  turnEvents: TurnEvent[];
}

export interface ResolveCtx {
  state: CombatState;
  log: (msg: string) => void;
}

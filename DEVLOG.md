# Rust & Rivets — Devlog

A dieselpunk roguelike deckbuilder built with Phaser 3 + TypeScript + Vite.
Game URL: https://chrisdfennell.github.io/rust-and-rivets/

This file tracks what's built and what's planned. Update it whenever a
slice ships so future sessions can pick up cold.

**Format:** the **Done** section lists slices newest-first. Add new
slices at the top of that list, mark the latest one `*(current)*`,
and strip the tag from the previous one.

---

## Current state (snapshot)

Quick orientation for someone coming in cold. Numbers as of Slice 30.

- **Run length:** 3 acts, ~20 nodes each. Each act picks one of 2
  bosses at boss-node entry (Foundry Tyrant / Salvage Colossus,
  Iron Sovereign / Pyroclast Engine, Stormheart / The Wraith). Win =
  defeat the act-3 boss. InterActScene between each act lets the
  player pick a boon (Repair / Refit / Salvage).
- **Characters:** 3 pilots (Pilot / Engineer / Saboteur) with unique
  starter decks, hull pools, and signature relics.
- **Cards:** ~50 base + `+` upgraded variants. Types: attack / skill /
  power. Keywords: exhaust, retain, ethereal, innate, AoE
  (`target: 'allEnemies'`). Rarities: common / uncommon / rare.
- **Powers** (persistent in-combat buffs): Demon Form, Barricade,
  Metallicize, Combust.
- **Relics:** 18 total, with hooks `onCombatStart` / `onCombatEnd` /
  `onPickup` / `onTurnStart` / `onCardPlayed`. Three potion-specific
  (Potion Belt, Sacred Bark, Toy Ornithopter).
- **Potions:** 8 in the pool. 3-slot belt (expandable via Potion Belt
  relic). Right-click to discard. 40% drop chance after regular
  combats, guaranteed after elites, never overflows.
- **Statuses:** Vulnerable, Weak, Strength, Dexterity, Burn, Thorns,
  Plating. Player & enemies both. Intent display shows the actual
  damage you'll take (post-Str/Vuln/Weak), not the raw base number.
- **Combat:** Up to 3 simultaneous enemies, drag-to-target for
  single-enemy cards, dedicated aim mode for enemy-target potions.
- **Map node kinds:** combat / elite / shop / rest / event / boss.
  **12 events** with multi-choice outcomes (including potion-flavored
  ones).
- **Meta:** Workshop with 8 upgrades (max spend 18 pts). Points
  earned per-act-boss-kill (act N = N pts). Persists across runs.
- **Save/load:** Auto-save to localStorage after every mutation.
  Export/Import via base64 bundle (run + meta).
- **Audio:** Looping ambient mp3 + procedural Web Audio SFX. Persisted
  mute toggles on title screen + pause menu.

---

## Done

### Slice 30 — Run-end summary screen *(current)*
The post-victory and post-defeat experience used to dump you back on
the Map with a one-line overlay. Now the run ends on a dedicated
**RunSummary** scene with a stats grid, your final deck, and the
relics you collected.

**Stats tracked** (new `RunStats` block on `RunState`)
- `biggestHit` — largest single hull-damage hit dealt to an enemy.
  Recorded in `dealDamageToEnemy` via a new
  `CombatState.biggestPlayerHit` field, then bubbled up at combat end.
- `totalTurns` — sum of player turns across every combat.
- `potionsUsed` — counted in `CombatScene.consumePotion`.
- `combatsWon` — non-boss combat victories. Auto-incremented in
  `completeCombat` based on the visited node's kind.
- `elitesDefeated` — subset of combatsWon, same path.

Boss nodes don't count toward `combatsWon` (they have their own
flow: meta points + the act-clear / run-end branch). Old saves
hydrate cleanly via `normalizeStats` which zeros every field.

**Combat → run plumbing**
- `completeCombat(survivingHull, combatStats?)` and
  `failCombat(survivingHull, combatStats?)` now accept an optional
  `CombatStatsPayload = { turns, biggestHit, potionsUsed }`.
- `mergeCombatStats` adds `turns` and `potionsUsed`, takes the max
  for `biggestHit`. `ensureStats` lazily creates the stats block on
  pre-stats saves so call sites can ignore the undefined case.
- `CombatScene.collectCombatStats()` builds the payload from
  `state.turn`, `state.biggestPlayerHit`, and a new
  `potionsUsedThisCombat` counter (reset per combat).

**RunSummaryScene** ([src/scenes/RunSummaryScene.ts](src/scenes/RunSummaryScene.ts))
- VICTORY / DEFEAT title with a one-line flavor blurb.
- Two-column stats grid (left half): result, act reached, floors
  reached, combats won, elites defeated, biggest hit, turns played,
  potions used, hull, scrap, deck size, cards drafted.
- Final-deck panel (right half): cards grouped by id with `× count`
  suffix, sorted alphabetically. Two-column flow.
- Relics strip (bottom): names in a row centered on the screen.
- `RETURN TO TITLE` button (or SPACE / ENTER) calls
  `clearSavedRun()` then routes to Title, so the player can't
  Continue back into an already-finished run.

**Routing**
- CombatScene's victory branch now sends final-act wins to
  `RunSummary` instead of `Map`. Mid-act boss wins still route to
  `InterAct`. Defeat goes to `RunSummary` directly.
- TitleScene's `routeForCurrentRun` is unchanged — by the time the
  player leaves the summary, the save is cleared, so the
  `result !== 'inProgress'` branch never fires anyway.

**Save schema** (still v4)
- Additive — `stats?: RunStats` and `bossBonus?: number` join the
  saved shape. `normalizeStats` and the existing `?? defaults` keep
  pre-stats v4 saves working.

### Slice 29 — Intent damage display fix + 6 new events
Two unrelated wins bundled because they ship together.

**Intent damage display** ([src/ui/IntentView.ts](src/ui/IntentView.ts))
- `IntentView.update` now takes optional `attackerStr / attackerWeak
  / playerVuln` args and recomputes the displayed damage to match
  `dealDamageToPlayer`'s math (`(base + str) * 1.5^vuln * 0.75^weak`).
- The recomputed value is substituted into the existing label
  string ("Crushing Punch: 12" → "Crushing Punch: 16" once Salvage
  Colossus has stacked +4 Strength via Bolt-On).
- Substitution uses a digit-boundary lookaround
  `(?<!\\d)N(?!\\d)` instead of `\\b…\\b` because word boundaries
  fail to match `5` inside `5x3` (the `x` is a word char).
- CombatScene.refresh passes `e.strength, e.weak, s.player.vulnerable`
  per-enemy on every refresh.

**Six new events** ([src/game/events.ts](src/game/events.ts), pool 6 → 12)
- **Brewer's Cart** — buy a potion (35 scrap) or 50/50 gamble for a
  free one. First event that exercises the new potion-belt
  inventory inserter.
- **Forgotten Cache** — force open (-4 hull, random loot: scrap /
  potion / card) or pick the lock (70% rare card, 30% -3 hull).
- **Junker's Bet** — coin flip at 30 or 60 scrap stakes. Pure
  gambling, no other reward path.
- **Pilgrim's Shrine** — sacrifice a random deck card for a relic,
  or pray for +3 max hull and a heal. First event that
  combines deck-removal with relic-grant.
- **Scavenged Brew Kit** — take 3 random potions (fills the belt)
  or scrap it for 25 scrap. Bulk-fills the belt for free.
- **Echoing Vault** — -10 hull for a guaranteed upgraded card, or
  chant back for a 50/50 relic-vs-common-card outcome.

Two new helpers in events.ts: `tryAddPotion(run, id)` places into
the first empty slot and returns the id on success;
`potionName(id)` for log messages.

### Slice 28 — Boss variety (alternate per act)
Each act now rolls one of two bosses at boss-node entry instead of
the previously-fixed single boss. Replaces the "by run 3 you've
memorized them all" failure mode.

**New bosses** (in [src/game/enemies.ts](src/game/enemies.ts))
- **Salvage Colossus** (Act 1, 95 HP) — stacks Strength via
  repeated `Bolt-On` casts. Mutates `e.strength` directly from
  the resolve closure (reads `state.activeAttackerIndex`).
  Foundry Tyrant is consistent pressure; this one snowballs if
  not burst-killed or Weak-spammed.
- **Pyroclast Engine** (Act 2, 130 HP) — Burn stacker. Cycles
  Ignition / Ember Burst / Vent Heat to layer Burn ticks on the
  player while still dealing direct damage. Iron Sovereign is
  one big telegraphed nuke; this one is a slow grind.
- **The Wraith** (Act 3, 150 HP) — Drain heal (8 dmg → +12 hull
  for the boss) + Shroud (Weak 2 + Vuln 2) + `Phasing... →
  Spectral Strike: 30` telegraph. Stormheart is raw firepower;
  this one is sustain + debuff stacking.

**Wiring**
- `ACT{1,2,3}_BOSS_POOL` arrays. `getActBoss(act, rng?)` and
  `getBossEncounter(act, rng?)` pick from the pool. The chosen
  boss is persisted via `run.pendingEnemyIds` so refreshing
  mid-fight resumes the same boss; a fresh run rolls again.
- All three bosses registered in `ENEMY_DEFS` so the save
  hydrate path can rebuild them from their string ids.

**Sprites** (in [src/ui/MechSprite.ts](src/ui/MechSprite.ts))
- `drawSalvageColossus` — lopsided junk-giant with asymmetric
  legs, a clamp arm, a massive spiked hammer arm, single
  shoulder smokestack. Subtle sway tween.
- `drawPyroclastEngine` — tracked furnace tank with magma-core
  chest, vent grilles, three short smokestacks. Pulse-scale
  tween for the magma glow.
- `drawTheWraith` — tall narrow specter knight in indigo cape
  (no legs), hooded helm with cyan glowing eyes, twin curved
  blades, floating-wisp particles. Slow vertical float tween.
- All three registered in `ENEMY_SPRITES`.

**Known UX gap** (fixed in Slice 29) — when Salvage Colossus
stacked Strength, its intent labels still showed base damage.
Slice 29 fixes this for all enemies, not just the Colossus.

### Slice 27 — Power cards
Persistent in-combat buff cards that exhaust on play and apply
permanent state for the rest of the fight. Closes the "Power" gap on
the original Slay-the-Spire feature comparison.

**Engine**
- `CardDef` gained a `type?: CardType` field (`'attack' | 'skill' |
  'power'`). Currently used only for UI labeling — the existing
  `exhaust: true` flag handles the "consumed on play" half, and the
  buffs persist on `PlayerState`.
- `PlayerState` gained four power-buff fields, all reset per combat:
  `demonForm: number` / `barricade: boolean` / `metallicize: number`
  / `combust: number`.
- Four new `CardEffect` kinds drive them: `addDemonForm`,
  `setBarricade`, `addMetallicize`, `addCombust`. Stacking is
  additive for the numeric ones.
- `startPlayerTurn`:
  - Plating reset gated by `!p.barricade` — Barricade lets plating
    accumulate across turns.
  - `demonForm` Strength applied at the top of every turn (which
    means the turn after the card is played, since playing it
    happens after that turn's `startPlayerTurn` already ran).
- `endTurn` (after debuff decay, before phase flip):
  - Metallicize adds `p.metallicize` plating.
  - Combust pays 1 hull (bypasses plating), then hits every alive
    enemy for `p.combust` damage. Honors player Strength /
    Vulnerable / Weak via `dealDamageToEnemy`. Bails on Thorns
    retaliation that drops the player. Routes to victory cleanly
    if it kills the last enemy.

**Cards** (4 new + upgrades, all in `SHOP_POOL`)
- **Demon Form** (3c rare, power) — +2 Strength every turn start
  (3+ → +3 Strength). Stacks on itself if you somehow play it twice.
- **Barricade** (3c→2c+ rare, power) — Plating no longer wears off
  at the start of your turn. Upgrade lowers the cost rather than
  changing the effect.
- **Metallicize** (1c uncommon, power) — +3 plating at end of turn
  (4+ → +4). Pairs hard with Barricade.
- **Combust** (1c uncommon, power) — Lose 1 hull, deal 5 to all
  enemies at end of turn (7+).

**UI**
- `CardView` keyword badge now includes a `POWER` label rendered in
  steam-cyan (vs the rust orange used for INNATE/RETAIN/ETHEREAL/
  EXHAUST). The `EXHAUST` label is suppressed on power cards since
  every power exhausts — keeps the badge line short.

Build interactions to watch for:
- **Barricade + Metallicize** = the classic StS turtle. Plating
  ratchets every turn instead of resetting.
- **Demon Form + Spike Plating** = damage scaling that also
  retaliates harder each turn.
- **Combust + Barricade + Metallicize** = a passive engine that
  needs no card plays once online.

No save schema changes — all power state lives inside
`CombatState`, which never persists.

### Slice 26 — Workshop expansion
Four new meta-progression upgrades and a tighter Workshop layout to
fit them. Max meta spend doubles from 9 → 18 pts; a full 3-act
clear still nets 6 pts, so the meta ladder now caps out in ~3 wins
instead of 2.

**New upgrades** (in [src/game/meta.ts](src/game/meta.ts))
- **Tempered Frame** (1 pt × 3 lvls) — +2 starting plating each
  combat per level. Stacks on top of Iron Plating-style relics.
- **Reserve Tank** (2 pt × 1) — +1 max Steam every combat. Premium
  cost, no scaling.
- **Pre-Brew** (1 pt × 3) — Start each run with N random potions in
  open belt slots. Plays nicely with the Potion Belt relic that
  grows belt capacity.
- **Boss Bounty** (1 pt × 1) — +10 scrap from each boss kill.
  Stacks across all three acts.

**Wiring**
- `PersistentPlayer` gained two optional fields read by combat at
  combat start: `maxSteam?: number` (Reserve Tank) and
  `startingPlating?: number` (Tempered Frame). Both fall back to
  defaults (`?? 3` / `?? 0`) so old saves load cleanly without a
  schema bump.
- `RunState` gained `bossBonus?: number` (Boss Bounty), applied in
  `completeCombat` on boss kills. The function returns the bonus
  so the victory line surfaces it: `+10 scrap. Press SPACE to ...`.
- `createCombatState` applies `startingPlating` AFTER relic
  `onCombatStart` hooks so it stacks on top.

**WorkshopScene layout**
- Row spacing 96 → 56, panel height 80 → 50, fonts shrunk to keep
  text readable. 8 rows fit comfortably at 720p between the
  POINTS header (~140 px) and the BACK button (660 px).

### Slice 25 — Potion polish + UI fixes
Quality-of-life work on the potion belt and a long-standing input
bug on cards.

**Right-click discard**
- Right-click any filled potion slot in combat discards the potion
  (with a 120 ms red flash before the slot clears). Context menu
  is disabled on the combat-scene canvas via
  `this.input.mouse?.disableContextMenu()` so the right-click
  reaches us.
- Tooltip now reads `(right-click to discard)` under the
  description so the binding is discoverable.
- Discard cancels potion aim mode if the discarded slot was being
  aimed.

**Three potion relics** ([src/game/relics.ts](src/game/relics.ts))
- **Potion Belt** — `onPickup` pushes a `null` onto `run.potions`
  to grow the belt; `firstEmptyPotionSlot` and the UI already
  iterate `potions.length`, so the extra slot lights up
  automatically. `save.ts::normalizePotions` updated to preserve
  array lengths greater than 3 instead of truncating.
- **Sacred Bark** — `combat.usePotion` runs the effect loop twice
  if the relic is owned. Vulnerable Potion → 6 to all. Fire
  Potion → 40 damage (Strength applies on both hits; Brass
  Knuckles consumes only on the first).
- **Toy Ornithopter** — +4 hull heal after every potion use,
  capped at maxHull. Logged.

**Card hit-area fix** ([src/ui/CardView.ts](src/ui/CardView.ts))
- Phaser's `pointWithinHitArea` adds `displayOriginX/Y` to the
  pointer BEFORE checking the hit-area Rectangle (see
  `node_modules/phaser/src/input/InputManager.js` ~line 963).
  For a GameObject with origin (0.5, 0.5) and size (140, 170),
  this means the Rectangle's `(0, 0)` corresponds to the
  top-left of the bounds, NOT the center.
- The previous code passed `Rectangle(-CARD_W/2, -CARD_H/2, ...)`
  on the theory that the rect was center-anchored, which put the
  real hit area in the up-and-left quadrant of each card — exactly
  matching the green debug overlay being offset from the visible
  cards.
- Fixed by passing `Rectangle(0, 0, CARD_W, CARD_H)` instead, and
  dropping the LIFT-extension `applySlot` machinery entirely.
  Hover-lift remains a visual-only flourish on the inner container.

**UI placement nits**
- Potion belt moved from `(180, height − 130)` to
  `(80, height − 240)` so the slots no longer sit behind the
  leftmost cards (the hand layer is added after the belt, so it
  renders on top).
- Title screen audio toggles moved 12 px up
  (`audioY = secondaryY + 44` from `+56`) and the auto-save
  footer text 16 px down (`height − 8` from `height − 24`) to
  give the two rows a clean 10 px gap at 720p.

### Slice 24 — Potions
A 3-slot potion belt with drops, shop sales, and a dedicated in-combat
aim mode. Brings the system Slay the Spire calls "always there if you
need it" online.

**Engine**
- New module [src/game/potions.ts](src/game/potions.ts) with 8 starter
  potions and a rarity-weighted picker (65/30/5 common/uncommon/rare).
- `PotionDef` reuses the existing `CardEffect` set as `PotionEffect`,
  so every effect already supported by cards (damage, plating, draw,
  steam, vuln/weak/burn, gainStrength/Dex, AoE variants, heal) works
  in potions for free.
- `usePotion(state, def, targetIndex?)` in `combat.ts` reuses the
  private `applyEffect` machinery. Bypasses cost / hand / discard
  entirely. Only usable during player turn (`canUsePotion`).
- Potions stay outside the deck and aren't shuffled — pure inventory.

**Potion library**
- **Block Potion** (common, self) — Gain 12 Plating
- **Fire Potion** (common, enemy) — Deal 20 damage
- **Swift Potion** (common, none) — Draw 3
- **Energy Potion** (common, none) — Gain 2 Steam
- **Weak Potion** (uncommon, allEnemies) — 3 Weak to all
- **Vulnerable Potion** (uncommon, allEnemies) — 3 Vuln to all
- **Strength Potion** (uncommon, self) — Gain 2 Strength
- **Repair Potion** (uncommon, self) — Heal 8 hull

**Run state**
- `RunState.potions: (string | null)[]` — fixed-length 3-slot belt.
- `completeCombat` rolls a drop: elite fights guarantee, regular
  fights roll 40%. Drop auto-claims into the first empty slot; if
  all slots are full, no drop fires (no overflow UI to design).
- `buyPotionOffer`, `clearPotionSlot`, `discardPotion`,
  `hasOpenPotionSlot` helpers cover every mutation path.
- Save back-compat via `normalizePotions / normalizeReward /
  normalizeShop`: pre-potion saves load with an empty belt and no
  schema bump.

**Shop**
- Each `pendingShop` now carries a single `potionOffer` alongside
  the 3 card offers — `35–45` scrap with ±5 jitter. Panel renders
  below the card row in `ShopScene` showing name + description +
  price. Falls back to "BELT FULL" when the player has no open slot.

**Combat UI**
- Row of 3 slots right of the Steam gauge in `CombatScene`. Hover
  tooltip shows the full potion name + description above the belt.
- Click filled slot:
  - `enemy` target with 1 alive enemy → auto-targets it
  - `enemy` target with 2+ alive → enters **AIM MODE**: cyan glow
    on every alive enemy, banner reading
    `CHOOSE A TARGET — CLICK ELSEWHERE TO CANCEL`. Next enemy click
    consumes; clicking elsewhere cancels; clicking the same slot
    again also cancels.
  - `self` / `none` / `allEnemies` → uses immediately.
- A `suppressNextAimUp` flag swallows the pointerup that ends the
  slot-click which entered aim mode — without it the click-to-aim
  click would also confirm the aim immediately.
- While aiming, card pointerdown handlers ignore input so the
  player can't start a half-finished card drag through aim mode.

**Reward**
- `PendingReward.potionId: string | null` carries the dropped
  potion to `RewardScene`, which renders a `+1 potion: <name>`
  line under the scrap total. Display only — the potion was
  already added to the belt by `completeCombat`.

### Slice 23 — Retain / Ethereal / Innate keywords
Three Slay-the-Spire-staple keyword behaviors land. Card definitions
can now flag any combination of `retain`, `ethereal`, and `innate`;
the combat loop handles the three end-of-turn / start-of-turn
routings.

**Engine**
- `CardDef` gained `retain?`, `ethereal?`, `innate?` boolean flags.
- `endTurn` routes each hand card by keyword: retain → stay in hand,
  ethereal → exhaust pile, otherwise → discard. Retain wins over
  ethereal if a card somehow has both (player-friendly resolution).
- `startPlayerTurn` on turn 1 pulls every innate card from the draw
  pile into the opening hand BEFORE the normal draw. Innate held
  into later turns via retain does NOT re-trigger.
- Hand size still tops out at 5; retained cards fill slots so the
  follow-up draw is reduced accordingly.

**Cards** (3 new + upgrades, all in `SHOP_POOL`)
- **Pressure Reading** (0c uncommon, innate) — Draw 2 (3+ innate)
- **Hold Position** (1c uncommon, retain) — Gain 7 Plating
  (10+ retain)
- **Glass Round** (0c rare, ethereal + exhaust) — Deal 12 (16+)

**UI**
- `CardView` keyword badge now collapses INNATE / RETAIN / ETHEREAL
  / EXHAUST into a single bullet-separated line at the bottom of
  the card. Previously only EXHAUST was rendered.

No save schema bump — keyword routing lives entirely inside
`CombatState`.

### Slice 22 — AoE cards
Multi-enemy fights now have a counterplay: cards that hit every enemy
at once. Four new cards, four new effect kinds, and a `target:
'allEnemies'` shape that bypasses the drag-to-target flow.

**Engine**
- New `Target` shape: `'allEnemies'`. Joins `enemy / self / none`.
- New `CardEffect` kinds: `damageAll`, `applyVulnerableAll`,
  `applyWeakAll`, `applyBurnAll`. Each iterates `state.enemies` and
  skips already-dead targets.
- `damageAll` calls the existing `dealDamageToEnemy(c, raw, i)` per
  enemy, so Strength, per-target Vulnerable multipliers, Brass
  Knuckles (consumes once on the first hit), and player Thorns
  retaliation all flow through correctly. The handler bails early
  if the player goes down to retaliation mid-sweep.
- Status-applying AoE effects (`applyVulnerableAll` etc.) increment
  each enemy's counter directly — they're cheap and don't trigger
  any retaliation logic.

**Cards** (4 new + upgrades, all enter `SHOP_POOL`)
- **Shrapnel Burst** (1c uncommon) — Deal 6 damage to ALL (9+)
- **Forge Wave** (2c rare) — Deal 10 damage to ALL. Apply 1 Vuln
  to all (13/2+)
- **Acid Mist** (1c uncommon) — Apply 4 Burn to ALL (6+)
- **Concussion** (1c common) — Deal 4 damage to ALL. Apply 1 Weak
  to all (6/2+)

**UI**
- AoE cards play on click (no specific target needed). The drag
  pipeline still accepts them — release anywhere triggers the play.
- While dragging an AoE card, every alive enemy's drop-zone glows
  red (vs. just the hovered one for single-target cards). Visual
  confirmation that the card is going to land on all of them.
- `applyCardPlay` shakes every-enemy-that-was-alive sprite when the
  card resolves. Dying enemies still shake on the killing blow
  because the shake reads from the pre-snapshot.
- Floating damage numbers and hit rings on each enemy come for
  free — `emitDeltas` already diffs the full enemies array per
  card play.

### Slice 21 — Multi-enemy combat + click-drag targeting
Combat is no longer 1v1. Regular and elite rooms can now spawn 2-enemy
encounters, and enemy-target cards are played by dragging them onto the
specific enemy you want to hit.

**Engine — CombatState reshape**
- `CombatState.enemy` removed. `enemies: EnemyState[]` takes its place.
  All single-enemy fights are arrays of length 1.
- New `CombatState.activeTargetIndex?` set by `playCard` before effects
  resolve so per-target effect handlers know who to hit. Cleared after
  the relic `onCardPlayed` hooks fire.
- New `CombatState.activeAttackerIndex?` set by `endTurn` while resolving
  each enemy's action so `dealDamageToPlayer` can attribute damage to
  the right enemy (matters for player Thorns retaliation).
- `dealDamageToEnemy(c, raw, targetIndex?)` resolves target by:
  explicit arg → `activeTargetIndex` → first alive enemy.
- `gainEnemyPlating(c, n, targetIndex?)` likewise — enemies' own brace
  actions naturally target themselves via the active-attacker index.
- Victory only flips when *every* enemy is at 0 hull. A killed enemy
  in mid-card mid-effect lets later effects fall through to a different
  target via `firstAliveIndex`.
- `endTurn` now iterates the alive-at-start-of-turn list. Mid-turn
  deaths (e.g. player Thorns killing an attacker) skip cleanly.
- Burn ticks fire on every enemy with `burn > 0` after all enemy
  actions resolve.

**Encounters**
- New `pickRegularEncounter / pickEliteEncounter / getBossEncounter`
  returning `EnemyDef[]`. Replaces the old `pickRegularEnemy` etc.
  callsites in `run.ts`.
- `~22%` of regular fights and `~18%` of elite fights now roll a 2-enemy
  group, with act-appropriate combinations: Junk Hound pair, Scrap Raider
  + Rust Sprayer, Cinder Hound pair, Slag Drone + Forge Reaver, Lightning
  Sprite pair, Sky Pirate + Lightning Sprite, etc. Elites can spawn a
  big-with-mook pairing like Iron Reclaimer + Scrap Raider.
- Bosses stay solo — their patterns are tuned for 1v1.

**Relics**
- **Calibration Spike** now Vulnerables *every* enemy at combat start
  (was a single-target hook back when there was only one target).
- **Pneumatic Strike**'s every-3rd-card hit just rides the card's chosen
  target via `activeTargetIndex` (which the new playCard keeps set
  through onCardPlayed hooks).

**Save schema v3 → v4**
- `pendingEnemyId: string | null` → `pendingEnemyIds: string[] | null`.
- Old v3 saves discarded on load — they reference a single enemy and
  can't hydrate cleanly into the array shape. Players will start a fresh
  run; meta progress (Workshop points / upgrades) is in a separate
  key and survives.

**UI**
- CombatScene lays out 1, 2, or 3+ enemies horizontally across the right
  side of the screen. Each enemy gets its own sprite, hull bar, name
  label, intent box, and drop zone. Bars shrink (280 → 220 → 170 px)
  and sprites scale (1.0 → 0.85 → 0.72) as the lineup grows.
- Dead enemies dim to alpha 0.25 with a `DOWN` placeholder in their
  intent box and stop being valid drop targets.
- Victory line collapses N enemy names to "The lot of them" when the
  fight had multiple foes.

**Drag-to-target**
- `CardView` no longer fires `onClick` on pointerdown. It calls
  `onPointerDown(card, view, pointer)` and lets the scene decide
  click vs drag based on pointer-move distance (>6px = drag).
- `CardView.beginDrag()` / `setDragPos(x, y)` / `endDrag(animate)`
  let the scene float a card to the pointer and snap it back to its
  fan position when the drop misses.
- Each enemy has a hidden drop zone (~200x200 around its sprite). While
  dragging an enemy-target card, the hovered enemy's drop zone glows
  red. Releasing over a valid target plays the card with that index;
  releasing anywhere else returns the card to hand.
- **Click behavior** still works as a shortcut when it's unambiguous:
  - Self / none cards → click plays as before.
  - Enemy cards with exactly 1 alive enemy → click auto-targets it.
  - Enemy cards with 2+ alive enemies → click flashes a "Drag to a
    target" hint above the hand; the player must drag.

### Slice 20 — Status effects: Strength / Dexterity / Burn / Thorns
Four new keyword statuses, plus the cards and relics that exercise them.

**Engine**
- `Combatant` gained `strength`, `dexterity`, `burn`, `thorns` fields.
- New `CardEffect` kinds: `gainStrength`, `gainDexterity`, `gainThorns`,
  `applyBurn`.
- **Strength** — adds flat damage to every player attack (inside
  `dealDamageToEnemy`, before Vuln/Weak multipliers). Permanent within
  combat.
- **Dexterity** — adds flat plating to every player plating gain (inside
  the `plating` effect handler). Permanent within combat.
- **Burn** — at end of owner's turn, owner takes `burn` hull damage
  (bypasses plating), then `burn--`. Lives on both sides.
- **Thorns** — when bearer takes attack damage, attacker takes `thorns`
  hull damage (bypasses plating). Permanent within combat. Retaliation
  fires per damage instance, so multi-hit cards trigger thorns multiple
  times.
- Bug fix: enemy `Weak` was previously ignored in `dealDamageToPlayer`.
  Player-applied Weak now correctly reduces the enemy's outgoing damage
  by 25%, matching the Vuln-on-enemy symmetry.

**Cards** (6 new + upgrades, all enter SHOP_POOL)
- **Battle Forge** (1c uncommon, exhaust) — Gain 2 Strength (3+)
- **Buffer Plate** (1c uncommon, exhaust) — Gain 2 Dexterity (3+)
- **Pyro Charge** (1c uncommon) — Deal 4. Apply 4 Burn (5/6+)
- **Cinder Round** (2c rare, exhaust) — Deal 8. Apply 8 Burn (10/11+)
- **Spike Plating** (1c common) — Gain 4 Plating. Gain 3 Thorns (6/4+)
- **Iron Will** (2c rare, exhaust) — Gain 2 Strength. Gain 2 Dexterity (3/3+)

**Relics** (3 new — pool now 15)
- **Power Cell** — start each combat with 1 Strength
- **Buffer Coil** — start each combat with 1 Dexterity
- **Spike Mantle** — start each combat with 3 Thorns

**Enemy** — Lightning Sprite's Surge branch split: it now has an
`Ignite: 5 + Burn 2` debuff variant so player Burn is exercised in real
combat, not just hypothetical against itself.

**UI** — `StatBar.update()` extended with strength/dex/burn/thorns
parameters; status row below each side's hull bar can now read
`Vuln 2  Weak 1  Burn 3  Str +2  Dex +1  Thorns 3`. Display order:
debuffs first, then buffs.

No save schema bump — none of the new fields persist outside a single
`CombatState` instance.

### Slice 19 — Act 3: Above the Cloudline
The run loop now extends through a third and final act. Defeating
the Iron Sovereign no longer ends the run — it transitions into
**Above the Cloudline**, an airborne tier with sky-blue accents
and lighter, sleeker silhouettes. Reaching and defeating
**Stormheart** is the run's true win condition.

**Act 3 regulars:**
- **Stratus Drone** (45 HP) — bigger Sentinel/Slag drone variant
  with delta wings and a 22-damage telegraphed Plasma Lance
- **Sky Pirate** (52 HP) — caped boarder with cutlass + pistol;
  Smoke Bomb buff (+12 plating + Vuln 1)
- **Lightning Sprite** (38 HP) — fast electric harasser; opens
  with Spark (7 dmg + Vuln 2), uses Surge (5x3) and Strike (12)

**Act 3 elites:**
- **Cloud Reaver** (78 HP) — heavy aerial bruiser; opens with
  Heat Up (+14 plating + Weak 1); rotates Air Slam (22) /
  Tempest (6x3) / Brace (+14)
- **Sky Marshal** (85 HP) — fortress with sword + tower shield;
  Riposte (14 + Weak), Iron Stance (+18), Hammer Down (20),
  Stagger Volley (9 + Vuln 2)

**Stormheart** (160 HP) — final boss:
- Turn 1 Storm Cycle (+18 plating + Weak 2)
- Telegraphed **Lightning Strike: 32** every few turns (Charging
  Lightning... → next turn lands)
- Static Pulse (6x3), Iron Sphere (+22 plating), Crackle
  (10 + Vuln 2), Heavy Slam (18) as filler

**Engine wiring** (mostly free thanks to the act-aware design):
- `pickRegularEnemy(act)` / `pickEliteEnemy(act)` / `getActBoss(act)`
  / `getActName(act)` extended to act 3
- New `isFinalAct(act)` helper; `completeCombat` uses it to decide
  "end the run" vs "trigger inter-act transition" — replaces the
  hard-coded `r.act >= 2` check
- Meta points still scale linearly: clearing all 3 acts banks 6
  workshop points (1 + 2 + 3)
- 6 new vector sprites for the act-3 enemies + boss, all in the
  airborne aesthetic (sky-blue accents, hover halos, wing shapes,
  storm-core glows on the boss)

### Slice 18 — Procedural SFX + mute toggles
Web-Audio-synthesized sound effects for every meaningful action,
plus persisted mute prefs for music and SFX.

New `src/audio/sfx.ts` — single shared AudioContext, lazily created
on first use. Each sound is a short composition of OscillatorNodes
and/or filtered noise bursts shaped with gain envelopes. Sounds:
- **click** (button press)
- **cardPlay** (whoosh + low tone)
- **hit** (low thump + lowpass noise)
- **platingAbsorb** (high metallic clink)
- **heal** (C-E-G rising arpeggio)
- **endTurn** (3-pop mechanical ratchet)
- **victory** (rising major triad on square wave)
- **defeat** (descending sawtooth)
- **enemyAttack** + **steamSpend** (ready for use, unwired)

Wiring:
- Every `Button` plays `sfx.click` on pointerdown (universal feedback)
- CombatScene plays `cardPlay` on `onPlayCard`, `endTurn` on
  confirmed end-turn, `hit`/`platingAbsorb`/`heal` from inside
  `emitDeltas` based on what changed, and `victory`/`defeat` on
  the matching overlay
- All SFX are short (40-700ms) and volume-balanced under the music

Persisted mute prefs:
- New `src/audio/settings.ts` stores `{ musicMuted, sfxMuted }` in
  `localStorage["rust-and-rivets/audio/v1"]`. Survives page reload.
- `music.ts` honors `musicMuted` at start and via `setMusicMuted()`
  (drops volume to 0 / restores to 0.32).
- `sfx.ts` honors `sfxMuted` at module init and via `setSfxMuted()`
  (skips synthesis entirely while muted).

UI:
- **MUTE MUSIC** and **MUTE SFX** toggle buttons on the title
  screen below EXPORT/IMPORT.
- Same toggles in the pause overlay below QUIT TO TITLE.
- Both label-toggle (MUTE → UNMUTE) and update each other's state
  via the shared settings module.

### Slice 17 — Ambient music
- `assets/industrial_ambiance.mp3` plays as a looping background track
  from the title screen onward. Single instance owned by Phaser's
  global SoundManager, so the loop survives scene transitions (title
  → character select → combat → map → ...) without resetting.
- New `src/audio/music.ts` exposes `preloadMusic(scene)` and
  `startMusic(scene)`. TitleScene's new `preload()` queues the mp3
  via Vite's asset-URL import; `create()` calls `startMusic(this)`
  which is a one-shot — subsequent calls are no-ops.
- Volume defaults to 0.32. `setMusicVolume(v)` and `isMusicMuted()`
  helpers are in place for a future mute toggle / settings panel.
- Browser autoplay policy: Phaser queues the play call until the
  first user gesture (clicking any title button unlocks it). No
  explicit handling needed.
- New `src/types/assets.d.ts` declares `*.mp3`, `*.ogg`, `*.wav`
  modules so TypeScript accepts the Vite asset imports.
- File is ~13 MB. Works fine but adds noticeable first-load latency
  on Pages; consider re-encoding to ~3-4 MB ogg if needed later.

### Slice 16 — Event nodes (?)
The map now has a fifth node kind: **event** (yellow `?` icon).
Floor 1 gets ~12% events; mid floors get ~14%. Total combat density
went down a touch to make room.

Six events in [src/game/events.ts](src/game/events.ts), each with
2–3 choice buttons that mutate the run state directly:
- **Wreck of an Old Mech** — Salvage (rare card) / Scavenge (+30 scrap) / Leave
- **Wandering Trader** — Buy Relic (-75 scrap, random un-owned relic) /
  Buy Card (-40 scrap, uncommon card) / Leave. Buttons disable when
  you can't afford or have everything.
- **Old Veteran** — Spar (-8 Hull, gain uncommon) / Decline (+15 scrap)
- **Glowing Pool** — Drink (coin-flip +25 Hull or -10 Hull) /
  Bottle It (gain a common card) / Leave
- **Hot Forge** — Temper (-5 Hull, gain an upgraded card) / Walk By
- **Steam Vent** — Repair (+12 Hull) / Tap the Line (-5 Hull, +25 scrap) / Leave

New **EventScene** with two phases:
1. *Choices* — title, narrative body, 2–3 choice buttons with brief
   descriptions. Disabled buttons (insufficient scrap, etc.) render
   dimmed.
2. *Result* — chosen outcome's message centered on screen + CONTINUE
   button. Player must press CONTINUE to leave; double-applying a
   choice is impossible because `pendingEventResult` is set on pick
   and the scene routes straight to *Result* on entry if that field
   is non-null (so refresh resumes the result, not the choices).

Engine wiring:
- `RunState` gained `pendingEventId` and `pendingEventResult` fields
- `enterNode` picks a random event id when entering an event node
- `resolveEvent(message)` stores the result text + persists
- `completeNode` clears both fields
- Save schema additive — old saves hydrate with `null` for the new
  fields; no schema version bump needed
- Status strip at the bottom of EventScene shows Hull/Scrap/Deck/Relics
  so the player can judge cost choices at a glance

### Slice 15 — Pause menu + CharacterSelect fix
- New **PauseScene** that launches as a transparent overlay on top
  of any in-run scene via `scene.pause()` + `scene.launch('Pause')`.
- ESC opens the pause menu; RESUME or ESC again closes it; QUIT TO
  TITLE stops the underlying scene and returns to the title screen
  (the run is already auto-saved, so it can be resumed from there).
- `setupPause(scene)` helper in [src/ui/setupPause.ts](src/ui/setupPause.ts)
  wires the ESC binding. Called from Combat, Map, Shop, Rest,
  Reward, and InterAct scenes' `create()`. Title / Workshop /
  CharacterSelect deliberately skip — they're already menus.

Bug fix in CharacterSelectScene: the SELECT button was overlapping
the SIGNATURE block because the panel was too short and the button
was positioned mid-content. Card panel height bumped 480 → 560 and
all the field positions re-staked top-to-bottom so the button now
sits at the bottom edge with clear space above. Sprite scale 0.7
→ 0.6 also tightens the visual footprint slightly.

### Slice 14 — Characters
Three pilots, each with a distinct starter deck, hull pool, and a
signature relic baked in for run start.

- **THE PILOT** — Hull 65, classic deck (5 Auto-Cannon / 4 Brace /
  1 Vent Steam), no signature relic. The baseline.
- **THE ENGINEER** — Hull 60, defensive deck (3 Auto-Cannon / 5 Brace
  / 1 Smoke Screen / 1 Repair Drone), starts each fight with
  **Iron Plating** baked in (+4 Plating per combat).
- **THE SABOTEUR** — Hull 55, aggressive deck (4 Auto-Cannon / 2 Brace
  / 2 Vent Steam / 1 Hammer Strike / 1 Hydraulic Punch), starts each
  fight with **Calibration Spike** (enemy spawns Vulnerable 1).

Engine:
- `CharacterDef` in [src/game/characters.ts](src/game/characters.ts)
  carries name, tagline, description, starting hull, starting deck,
  and starting relic ids.
- `startRun(characterId?)` reads the character def, applies hull /
  deck / relics, then layers meta upgrades on top. Defaults to
  `'pilot'` so existing saves keep working.
- `PersistentPlayer` gained a `characterId` field. Old `v3` saves
  without it are hydrated with `characterId: 'pilot'` so resumed
  runs render the right sprite.

UI:
- New **CharacterSelectScene** with three side-by-side cards. Each
  card renders the actual mech sprite scaled down, plus name,
  tagline, description, hull, deck size, and signature relic
  description.
- Title-screen NEW RUN now routes to CharacterSelect (not directly
  to Map). Same for the run-end NEW RUN button on MapScene.
- BACK button on CharacterSelect returns to title.
- CombatScene reads `run.player.characterId` and picks the right
  mech sprite from `CHARACTER_SPRITES` (default to pilot).

Sprites:
- `drawEngineerMech` — bulkier silhouette, riveted chest plate,
  box-helmet, tower shield on the left arm, wrench-hammer on the
  right.
- `drawSaboteurMech` — slim tapered torso, single-optic visor head,
  toxic green canisters on the back, spray-nozzle arms with
  acid-drip detail.
- `drawMech` is unchanged and serves as the Pilot.

### Slice 13 — Visual polish
Every action now has weight — floating numbers, hit rings, particle
bursts, screen shake on big hits, and a play-card flourish.

New helpers in CombatScene:
- `floatNumber(x, y, text, color)` — stroked text that floats up and
  fades. Red for damage, green for heal, shield-blue for plating.
- `burst(x, y, color, count)` — small rect particles spraying outward.
- `hitRing(x, y, color)` — expanding/fading shockwave circle.
- `flashSteam()` — quick scale pulse on the steam readout when a
  card is played.

State-delta driven:
- `snapshot()` captures player + enemy hull/plating.
- `emitDeltas(prev)` compares to current state and emits visuals
  appropriate to what changed — hull drop → red number + ring + burst,
  plating absorb → blue number + small burst, heal → green number,
  plating gain → blue +N, enemy death → bigger burst + camera shake.
- Player hull losses ≥ 10 trigger a screen shake (180 ms, 0.6%).

Card-play flourish:
- Clicking a card now plays a 170 ms lift + fade + scale-up tween
  before the state change. The card disables interactivity during the
  tween to prevent double-clicks.
- Once the tween completes, `applyCardPlay()` runs: snapshot →
  `playCard()` → `emitDeltas()` → `refresh()`. The deltas now show
  the *exact* card-driven changes (not conflated with end-of-turn
  plating reset).

Engine change to support the above:
- `endTurn(state, hooks?)` accepts an optional `afterEnemyResolve`
  callback that fires after the enemy's action resolves but BEFORE
  the next player turn starts (and plating resets). This lets the
  scene snapshot/emit deltas without losing the absorbed-vs-decayed
  plating distinction.

No new content; existing combat just feels meatier.

### Slice 12 — Difficulty rebalance
Playtest feedback: both acts could be cleared without effort. Plating
(8 block from 2x Brace) covered most enemy attacks (5–10 dmg), so the
player rarely took net damage.

Tightened across the board:

**Player baseline:**
- Starting / max Hull: 70 → **65**

**Act 1 regulars** (~20% HP, ~25% damage):
- Scrap Raider: HP 38 → 46; Cleaver 7 → 9; Quick Slash 3x2 → 4x2; Scrap Wall 6 → 8
- Junk Hound: HP 22 → 28; Bite 5 → 7; Frenzy 4x2 → 5x2; Rabid Lunge 8 → 11
- Sentinel Drone: HP 32 → 38; Tracer 4 → 5; Plasma Lance 14 → 18; Repair 5 → 7
- Rust Sprayer: HP 28 → 34; Spray 4 → 5; Acid Burst 3x2 → 4x2; Plating Mist 4 → 5
- Pylon Crawler: HP 30 → 36; Anchor 8 → 10; Pylon Slam 9 → 11; Reinforce 12 → 14; Bash 7 → 9
- Tinker Hawk: HP 24 → 30; Dive 3x2 → 4x2; Talons 2x4 → 3x4; Strike 8 → 10; Flutter 4 → 5

**Act 1 elites:**
- Slag Walker: HP 52 → 62; Heating Up 8 → 10; Heavy Slam 12 → 16; Sweep 4x3 → 5x3
- Iron Reclaimer: HP 45 → 54; Bash 8 → 10; Reinforce 10 → 12; Stagger 5 → 6; Hammer Down 11 → 14

**Foundry Tyrant** (act 1 boss):
- HP: 70 → **90**
- Forge Heat opener: +10 → **+12** plating
- Piston Rain: 4x3 → 5x3
- Slag Pour: 5 → 7
- Furnace Slam: 14 → **18**

**Act 2 regulars** (~25–30% HP, ~30% damage):
- Cinder Hound: HP 32 → 42; Bite 7 → 9; Frenzy 5x2 → 6x2; Maul 10 → 14
- Slag Drone: HP 40 → 50; Tracer 6 → 8; Plasma Lance 18 → 24; Repair 8 → 10
- Forge Reaver: HP 45 → 58; Cleaver 9 → 12; Quick Slash 4x2 → 5x2; Smash 14 → 18; Brace 8 → 10

**Act 2 elites:**
- Magma Sentinel: HP 65 → 80; Heat Sink 12 → 14; Magma Slam 15 → 20; Ember Spray 5x3 → 6x3
- Reclaimer Mk II: HP 60 → 75; Bash 9 → 12; Reinforce 14 → 16; Iron Stagger 6 → 8; Hammer Down 13 → 17

**Iron Sovereign** (act 2 boss, hardest hit):
- HP: 95 → **130**
- Plasma Cleave: 10/12 → 14/16
- Cannon Volley (telegraphed): 20 → **28**
- Static Burst: 4x3 → 5x3
- Heat Sink: 15 → 18

No card or relic changes. The mods focus on enemy throughput so each
fight forces a real tradeoff between blocking and pushing damage,
and so the bosses can no longer be brute-forced in 4-5 turns.

### Slice 11 — Meta-progression + save export/import
- **Workshop points** earned per-act-boss-kill, scaled to the act number:
  act 1 boss = 1 pt, act 2 boss = 2 pts, ... act N boss = N pts. Persistent
  across runs, stored in `localStorage["rust-and-rivets/meta/v1"]`.
- **4 meta upgrades** applied to every fresh run after `startRun()`:
  - **Reinforced Hull** — +5 max Hull / level (cost 1 each, max 5 levels)
  - **Foundry Stipend** — start with 30 extra Scrap (cost 1, max 1)
  - **Custom Loadout** — start with an Iron Hail in your deck (cost 1, max 1)
  - **Salvager's Eye** — start each run with a random Relic (cost 2, max 1)
  - Total max spend = 9 pts. Earned by clearing both acts = 3 pts per win.
  - (Slice 26 doubled the menu to 8 upgrades / max 18 pts.)
- **WorkshopScene** spends points on upgrades. Title-screen entry button.
- **Export / Import saves** via base64-encoded `{run, meta}` bundle:
  - `exportSaveString()` writes to clipboard (or falls back to a `prompt()`
    dialog the user can copy from)
  - `importSaveString(s)` validates + writes both run and meta; TitleScene
    restarts itself to pick up the new state
  - One bundle carries both the in-progress run and accumulated meta
- **TitleScene** layout updated: 3-button primary row (CONTINUE / NEW RUN /
  WORKSHOP), 2-button secondary row (EXPORT / IMPORT), points indicator
  above the buttons. Toast helper for transient confirmations.

### Slice 10 — Multi-act progression
- **Two-act run loop**: defeat the Foundry Tyrant (act 1 boss) to advance
  into **Act 2 — The Foundry Depths**. Iron Sovereign (95 HP, telegraphed
  Cannon Volley) is the run-ending boss. (Slice 19 extended to act 3.)
- **Act 2 regular enemies** in `ACT2_POOL`:
  - **Cinder Hound** (32 HP) — heavier Junk Hound variant with glowing maw
  - **Slag Drone** (40 HP) — bigger Sentinel Drone, charged Plasma Lance
  - **Forge Reaver** (45 HP) — heavy attacker with cleaver + smash
- **Act 2 elite pool** in `ACT2_ELITE_POOL`:
  - **Magma Sentinel** (65 HP) — heavy attacker with pulsing magma core
  - **Reclaimer Mk II** (60 HP) — tower-shield turtle with retaliating Weak
- **Iron Sovereign** boss sprite: fortress-tank with crown of smokestacks,
  oversized cannon barrel, pulsing eye
- **InterActScene** between acts with a single-boon choice:
  - **REPAIR** — heal to full Hull
  - **REFIT** — +15 max Hull (and heal as well)
  - **SALVAGE** — receive a rare card (rolled from the elite reward pool)
- Hull, deck, scrap, and relics all carry forward. Map regenerates fresh
  for act 2. Visited nodes and pending shop/reward state cleared on advance.
- **API refactor**: `pickAct1Enemy` and `pickEliteEnemy(rng)` replaced with
  `pickRegularEnemy(act, rng)` / `pickEliteEnemy(act, rng)` /
  `getActBoss(act)` / `getActName(act)`. Run state drives enemy choice.
- **Save schema v3**: adds `act` and `awaitingInterAct`. Old v2 saves
  auto-discard. TitleScene route now sends refreshes during the inter-act
  beat back to the InterActScene; saved-run summary shows act number.
- New `advanceAct(boon)` in [src/game/run.ts](src/game/run.ts) applies the
  chosen boon then regenerates the map and increments `act`.

### Slice 9 — Content depth
- **6 new cards** (with upgrades), bringing the buyable pool to 14:
  - **Counter-Strike** (1c common) — Deal 4. Gain 4 Plating.
  - **Hammer Strike** (1c common) — Deal 5. Apply 1 Vulnerable.
  - **Drill Bit** (1c uncommon) — Deal 6. Deal 6 more if enemy is plated.
  - **Sledgehammer** (2c uncommon) — Deal 16. Lose 3 Hull.
  - **Steam Surge** (1c uncommon) — Deal 4. Gain 1 Steam.
  - **Pressure Burst** (2c rare) — Deal damage = your Plating. Lose all Plating.
- **3 new act-1 enemies** added to ACT1_POOL (now 6 total):
  - **Rust Sprayer** (28 HP) — debuff specialist (Vuln/Weak spam)
  - **Pylon Crawler** (30 HP) — turtle with Anchor/Reinforce
  - **Tinker Hawk** (24 HP) — fast, multi-hit Talons + Dive
- **6 new relics** (now 12 total) using new in-combat hooks:
  - **Brass Knuckles** — First attack each turn deals +3 damage (`onTurnStart`)
  - **Boiler Vent** — First card each turn costs 0 (`onTurnStart`)
  - **Quickdraw Spring** — Draw 1 extra card at turn start (`onTurnStart`)
  - **Iron Resolve** — Heal 3 Hull at turn start (`onTurnStart`)
  - **Pneumatic Strike** — Every 3rd card played deals 5 damage (`onCardPlayed`)
  - **Slag Wrench** — +2 max Hull after each non-boss combat (`onCombatEnd`)
- New `CardEffect` kinds: `loseHull`, `damageIfEnemyPlated`,
  `damageEqualToPlating`, `losePlating`
- New `PlayerState` fields: `firstAttackBonus`, `firstCardFree`,
  `cardsPlayedThisTurn` — all reset in `startPlayerTurn`
- `CombatState.relicIds` carried into combat so per-turn / per-card-play
  hooks can fire without combat needing to import the run singleton
- `Relic` interface gained `onTurnStart` and `onCardPlayed(state, card,
  indexInTurn)` hooks. `drawCards` and `dealDamageToEnemy` are now
  exported from `combat.ts` so relics can call them
- Known limitation: cards still show their base steam cost on the badge
  when `firstCardFree` is active. The card becomes playable correctly
  (canPlay respects the discount), but the visible "1" doesn't drop to
  "0". Cosmetic. Punt for now

### Slice 8 — Rewards + relics + elites
- **Card rewards** after every non-boss combat: pick 1 of 3 cards or skip
  - Cards rolled from the buyable pool, weighted by rarity
  - **Card rarity tiers**: common / uncommon / rare (classified on
    non-starter cards)
  - Regular fights: 70/25/5 weights. Elite fights: 30/50/20 (rare-skewed)
- **Relics** — passive run buffs with event hooks:
  - **Pressure Gauge** — +1 max Steam each combat
  - **Iron Plating** — start each combat with +4 Plating
  - **Engine Oil** — heal 4 Hull after each non-boss combat
  - **Heavy Frame** — +10 max Hull on pickup (one-time)
  - **Salvage Loop** — +5 Scrap from each combat win
  - **Calibration Spike** — start each combat with enemy at Vulnerable 1
  - Hooks: `onCombatStart(state)`, `onCombatEnd(run)`, `onPickup(run)`
- **Elite combat nodes** (red `*` icon, slightly larger circle on the map)
  - Spawn on floors 2–4 with ~16% weight
  - 25–35 scrap reward (vs 12–19 for regular)
  - Auto-grant a random un-owned relic
- 2 new elite enemies in [src/game/enemies.ts](src/game/enemies.ts):
  - **Slag Walker** (52 HP) — heavy attacker with Heavy Slam / Sweep / +plating
  - **Iron Reclaimer** (45 HP) — defensive turtle, Reinforce / Stagger+Weak
- New **RewardScene** renders 3 cards + optional relic banner + skip button
- Map HUD now shows a row of owned relic icons (hover for tooltip)
- Title scene routes to Reward if a `pendingReward` is staged on refresh

### Slice 7 — GitHub + auto-deploy
- Repo: https://github.com/chrisdfennell/rust-and-rivets (public)
- GitHub Actions workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
  builds on every push to `main` and deploys `dist/` to GitHub Pages
- `vite.config.ts` uses `base: './'` so the build is portable across paths
- Pages source = GitHub Actions; first deploy auto-enabled on workflow run

### Slice 6 — Save/load + title screen
- Run state auto-saves to `localStorage["rust-and-rivets/save/v2"]` after
  every mutation (entering nodes, buying, healing, upgrading, finishing
  combat, etc.)
- **TitleScene** shows on every page load with a run summary if a save
  exists; Continue / New Run buttons
- Smart routing: refreshing mid-combat returns to that combat (with entry
  hull), mid-shop returns to the same shop with the same offers, etc.
- Combat tactical state (hand / discard / log / turn / intent) is NOT
  persisted — combat reboots from pre-combat hull. Deliberate: avoids
  save-scumming and dodges the complexity of serializing closures
- Schema version `v2` (bumped from v1 when relic/reward fields were added —
  old saves auto-discard). Later bumped to v3 (acts), then v4 (multi-enemy).

### Slice 5 — Economy (shop / rest / upgrades / scrap)
- **Scrap** currency, 12–19 per regular combat win (boss doesn't pay)
- **Shop nodes**: 3 random cards for sale (28–52 scrap each), one-shot card
  removal service (55 scrap)
- **Rest nodes**: heal 30% of max hull, OR upgrade one deck card
- **Card upgrades**: every card has a `+` variant; `cardId+` in deck
- 4 new buyable cards (Hydraulic Punch, Steam Lance, Repair Drone, Smoke
  Screen) plus the 4 already-existing non-starter cards
- New `heal` card effect, used by Repair Drone
- Pre-boss floor always rests so players can prep
- Bug fix: `endHandled` and other class-field initializers don't re-run on
  Phaser scene restart — Phaser keeps a single instance per scene class. Now
  reset stateful fields at top of `create()` in CombatScene/MapScene/ShopScene

### Slice 4 — Branching map + boss
- Procedural 7-floor map generated by walking 6 random paths bottom-to-top
  that all converge on a single boss
- Run state ([src/game/run.ts](src/game/run.ts)) owns map, persistent player
  (hull/maxHull/deck), current node, visited set, result
- **Foundry Tyrant** boss (70 HP) with 4-action pattern, won't repeat the
  same action twice, opens with a telegraphed Forge Heat
- Hull persists between combats; combat reboots with entry hull on refresh
- Scene transitions: Map → Combat → Map; victory/defeat overlays surface on
  the map after combat ends

### Slice 3 — More enemies + act 1 pool
- Added **Junk Hound** (22 HP, fast multi-hit + Weak debuff) and **Sentinel
  Drone** (32 HP, telegraphed Plasma Lance with charge-up)
- Extended `EnemyDef.pickAction` API with `PickCtx { turn, rng, memory,
  lastIntent }` so enemies can hold state between turns (Drone uses `memory`
  for its charge state)
- Bug fix: debuffs were decaying at start of player turn, making
  enemy-applied Vuln/Weak vanish before they could matter. Now decay at end
  of owner's own turn (Slay the Spire convention)

### Slice 2 — Hover fix
- Cards now use a static outer container for hit testing and animate only the
  inner visual container. Eliminates pointer-oscillation jitter caused by the
  hit area moving/rotating with the card during hover tweens.

### Slice 1 — Vertical slice (combat loop)
- Vite + TypeScript + Phaser 3 project scaffolded with relative-path build
  (works under any GitHub Pages subpath)
- Pure-TypeScript combat engine, no Phaser dependency in `src/game/`
- Resources: **Hull** (HP), **Plating** (block), **Steam** (energy, 3/turn)
- Status effects: **Vulnerable** (1.5× damage taken), **Weak** (0.75× damage dealt)
- Card effects: damage, plating, draw, gain steam, apply vulnerable, apply weak
- Starter deck of 10 cards (5x Auto-Cannon, 4x Brace, 1x Vent Steam)
- One enemy (Scrap Raider) with telegraphed intents
- Fanned card hand with hover-lift animation
- Combat HUD: hull bars, steam gauge, intent panel, combat log, turn counter

---

## Backlog (rough priority)

### Tier 1 — feature gaps still on the StS comparison
- **X-cost / status / curse cards** — scaling-with-energy cards
  (Whirlwind-style) and shuffled-in junk cards (Slime, Dazed, Wound,
  Curse of the Bell). The keyword infra (Slice 23) supports the
  card shape; the missing pieces are (a) a way to insert curses
  into a deck/draw mid-combat from events, and (b) the X-cost
  resolver that reads remaining Steam at play time.
- **Power-card extensions** — beyond the four core powers
  (Demon Form, Barricade, Metallicize, Combust), StS has 15+ more
  with bespoke hooks: Echo Form (first card each turn plays twice),
  Mayhem (top card auto-plays at turn start), Brutality (lose hull
  for free draw + steam), Sadistic Nature (debuffs deal HP damage).
  Each needs a new turn-start / card-play / debuff-apply hook on
  the engine.
- **Potion use outside combat** — events that mention "drink"
  can't tap into the belt. Would need a non-combat code path that
  resolves potion effects against a fake `CombatState` or a
  minimal run-state mutator.

### Tier 2 — content depth
- **More events** — 12 events shipped; StS has ~30. Still room to
  grow, especially events that exercise powers, the new bosses, or
  status effects.
- **Even more bosses** — each act has 2 bosses (Slice 28). A pool
  of 3 per act would push past "I've seen them all" after a few
  more wins.
- **More relics with bespoke hooks** — 18 is solid but several
  niches are missing (cards-cost-modifiers, deck-search, retain-
  trigger relics).
- **Daily seed / shareable runs** — same seed for everyone on a
  given date; share button copies a permalink that imports the
  exact run state. Would require seeded RNG threaded through map
  gen, encounter pick, card pool, etc. (currently uses
  `Math.random` directly throughout).
- **Run history** — past runs (win/loss, final deck, deaths)
  stored locally for retrospection.

### Tier 3 — polish
- **Card draw/discard animations** — cards fly in from a deck pile
  on draw and out to a discard pile on play. Currently they pop
  in instantly.
- **Animated enemy idle** — small bob / occasional twitch so
  static silhouettes feel alive.
- **Sprite consistency pass** — enemies are hand-coded geometry
  with inconsistent silhouette weight and detail density. A
  second pass with a unified style guide would help cohesion.
- **Ambient effects on Map/Combat scenes** — smokestack puffs,
  spark-pop on damage, blowing dust on the wasteland horizon.

### Tier 4 — long-term structural
- **Ascension levels** — escalating difficulty modifiers unlocked
  by clearing the run. StS uses a 20-tier ladder; we'd start with
  ~5 tiers (smaller starting hull, tougher enemies, fewer rewards).
- **More pilots** with distinct signature mechanics. Three is fine
  but each one only differs in starter relic + deck. A "stance-
  shifter" or "summoner" character would push the engine in
  interesting directions.
- **Act-themed environmental modifiers** — e.g. act 2 "Heat: all
  enemies start with +2 Strength", act 3 "Thin Air: −1 max Steam".

### Known issues / TODO chores
- Save state retains the `pendingShop` even after leaving — fine
  because `completeNode` clears it, but if someone exploits scene
  routing they could enter a different node with a stale shop.
  Audit if it ever becomes a player bug.
- `firstCardFree` (Boiler Vent relic) still shows the card's base
  steam cost on the badge — gameplay is correct, only the badge
  is stale. Cosmetic.
- Hand layout can get cramped at 8+ cards. Acceptable for now but
  would need tightening or scrolling to push past ~10 cards.

---

## Conventions

- `src/game/` — pure TypeScript engine, no Phaser imports. Testable in
  isolation if we ever add tests.
- `src/ui/` — view components (CardView, StatBar, Button, MechSprite, theme).
- `src/scenes/` — Phaser scene orchestration; reads/writes run state via
  `getRun()` from `src/game/run.ts`.
- Run state singleton lives in `run.ts`. Mutations call `persist()` at
  the end to auto-save to localStorage.
- Each scene with stateful class fields must reset them at top of
  `create()` because Phaser reuses scene instances across
  `scene.start()` calls.
- **Slices** are numbered monotonically. When shipping a new slice,
  use the next integer, place it at the top of the Done section,
  mark it `*(current)*`, and strip the tag from the previous one.
- Save schema bumps go on `KEY = 'rust-and-rivets/save/v{N}'` in
  `src/game/save.ts`. Bump only when an old save can't hydrate
  cleanly into the new shape; for additive fields, prefer optional
  fields + `?? defaults` in hydrate.

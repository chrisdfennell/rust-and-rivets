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

Quick orientation for someone coming in cold. Numbers as of Slice 47.

- **Run length:** 3 acts, ~20 nodes each. Each act picks one of 3
  bosses at boss-node entry (Foundry Tyrant / Salvage Colossus /
  Reclaimer Prime, Iron Sovereign / Pyroclast Engine / Vault Warden,
  Stormheart / The Wraith / Cyclone King). Win = defeat the act-3
  boss. InterActScene between each act lets the player pick a boon
  (Repair / Refit / Salvage).
- **Characters:** 4 pilots (Pilot / Engineer / Saboteur / Stoker) with
  unique starter decks, hull pools, and signature relics. The Stoker
  ramps Strength every turn an enemy is Burning (Furnace Heart relic).
- **Cards:** ~61 base + `+` upgraded variants. Types: attack / skill /
  power. Keywords: exhaust, retain, ethereal, innate, AoE
  (`target: 'allEnemies'`), X-cost, unplayable. Rarities: common /
  uncommon / rare / epic / legendary, each border-tinted on `CardView`
  (brass / green / blue / purple / orange). Star indicator
  (★ / ★★ / ★★★) for rare / epic / legendary; upgrade indicator (▲)
  for `+` variants. Status / curse cards (Slag Glob, Shrapnel, Heat
  Damage, Old Rust) inject via enemy actions and events.
- **Powers** (persistent in-combat buffs): Demon Form, Barricade,
  Metallicize, Combust.
- **Relics:** 24 total, with hooks `onCombatStart` / `onCombatEnd` /
  `onPickup` / `onTurnStart` / `onTurnEnd` / `onCardPlayed`. Three
  potion-specific (Potion Belt, Sacred Bark, Toy Ornithopter); two
  end-of-turn passives (Auto-Mortar, Bristle Plate).
- **Potions:** 8 in the pool. 3-slot belt (expandable via Potion Belt
  relic). Right-click to discard. 40% drop chance after regular
  combats, guaranteed after elites, never overflows.
- **Statuses:** Vulnerable, Weak, Strength, Dexterity, Burn, Thorns,
  Plating. Player & enemies both. Intent display shows the actual
  damage you'll take (post-Str/Vuln/Weak), not the raw base number.
- **Combat:** Up to 3 simultaneous enemies, drag-to-target for
  single-enemy cards, dedicated aim mode for enemy-target potions.
- **Map node kinds:** combat / elite / shop / rest / event / boss.
  **30 events** with multi-choice outcomes — original 13 plus a
  Slice-43 batch covering paid card removal, archetype-specific
  drops (random Power / random AoE), max-hull-trade vendors, sealed
  loot boxes, and a snake-oil salesman who might sell you a curse.
- **Meta:** Workshop with 8 upgrades (max spend 18 pts). Points
  earned per-act-boss-kill (act N = N pts). Persists across runs.
- **Save/load:** Auto-save to localStorage after every mutation.
  Export/Import via base64 bundle (run + meta).
- **Audio:** Procedural Web Audio ambient (drone + pad + steam hiss +
  random clangs/thumps) and procedural Web Audio SFX, no asset files.
  Persisted mute toggles on title screen + pause menu.

---

## Done

### Slice 47 — Export/Import as .json file + drag-and-drop *(current)*
Replaced the clipboard-and-paste save flow with proper file
operations. Two issues to fix and one feature to add.

**Bug fix.** `meta.ts` had `RUN_KEY = 'rust-and-rivets/save/v3'`
hardcoded, but `save.ts` is on `v4`. So the old export was reading
an empty key and round-tripping nothing. Replaced the duplicate key
with `export const SAVE_KEY` from `save.ts` so the two modules can't
drift again.

**Export now downloads a .json file.** Builds a Blob, creates a
hidden `<a download>` link, triggers it, then revokes the object
URL. Filename includes an ISO timestamp so multiple exports are
distinguishable. JSON is pretty-printed so players can peek inside
the file or hand-edit if they really want to.

**Import now opens a file picker.** A hidden `<input type="file"
accept=".json">` is created on click, listens for `change`, reads
the file via `File.text()`, then runs the same validation pipeline
as before. The old base64 path is kept as a fallback inside
`importSaveJson` — if the text isn't valid JSON, it tries `atob()`
first before failing. Old clipboard exports still work.

**Drag-and-drop on the IMPORT button.** Window-level `dragenter` /
`dragover` / `dragleave` / `drop` listeners. When a file is dragged
over the page the IMPORT button switches its label to "DROP TO
IMPORT" so the player knows where the drop logically lands; drop
anywhere on the page triggers the import. dragenter/leave use a
counter to handle child-element bubbling cleanly. Listeners are
torn down on scene `shutdown` so they don't leak across transitions.

Added an italic "*or drop a save file anywhere*" hint under the
IMPORT button so the drop-target affordance is discoverable.

### Slice 46 — Act 2 / Act 3 regular-enemy pool expansion
Act 2 and Act 3 each had only 3 regular mooks (vs. Act 1's 6) so
late-run combats felt repetitive. Added 2 mooks per act, each
introducing a mechanic that act's existing trio didn't already cover.

**Act 2 additions** (foundry depths)
- **Ember Spitter** (44 HP) — opens with `Spit: 5 + Burn 2` and
  rotates through `Ember Salvo 3x3`, `Magma Spew 11`, `Vent Heat +7`.
  Pulls Burn pressure into regular Act 2 fights (previously only
  Pyroclast Engine and the Stoker brought Burn to the table). Also
  makes Furnace Heart relics genuinely useful pre-boss.
- **Pig Iron Brute** (62 HP) — opens with `Anneal: +1 Strength` and
  rerolls into more Anneals / `Iron Punch 9` / `Heavy Slam 13` /
  `Brace +9`. Snowball-Strength mechanic at mook tier — a lighter
  cousin of Salvage Colossus. If you let it cook, later hits sting.

**Act 3 additions** (above the cloudline)
- **Mist Specter** (42 HP) — opens with `Shroud: +6 + 4 Thorns`,
  with `Vanish` later refreshing thorns to 4. Pattern rotates Drain
  (5 dmg → heal 4), `Wisp Strike 9`, `Phase +6 + Vuln`. Innate
  thorns punish button-mashing; the heal makes "burst or starve"
  the central decision.
- **Cloud Corsair** (50 HP) — sky-pirate variant with a Vault
  Warden-style pollute clock. Every 3rd turn: `Plunder: 6 + Shrapnel`
  (jams an unplayable 0-cost Shrapnel into discard). Off-cycle:
  `Cutlass 12`, `Pistol Shot 9`, `Boarding 4x2`, `Smoke Bomb +8 + Vuln`.

**Sprites** ([src/ui/MechSprite.ts](src/ui/MechSprite.ts))
- `drawEmberSpitter` — squat cauldron-mech with a molten orange
  crucible chest, smoke wisps, and a stubby barrel arm.
- `drawPigIronBrute` — boxy iron golem with bolted plate pauldrons
  and one massive iron fist.
- `drawMistSpecter` — legless trailing-mist ghost with cyan eye
  pinpricks and wisp blobs for arms.
- `drawCloudCorsair` — tricorne-hatted pirate with hook arm, gold
  sash, and a fuse-lit powder-bag grenade arm.

**Wiring** ([src/game/enemies.ts](src/game/enemies.ts:1352))
- `ACT2_POOL` grows 3 → 5; `ACT3_POOL` grows 3 → 5. `pickRegularEnemy`
  already weights uniformly across the pool so the new mooks slot
  in naturally at 20% each.
- All four registered in `ENEMY_DEFS` for save/load round-trip.

### Slice 45 — Third boss per act
Each act now picks from three bosses instead of two. The new bosses
each introduce a mechanic the existing pair doesn't cover, so picking
"the third boss" is meaningfully different from rolling Foundry
Tyrant vs. Salvage Colossus.

**Reclaimer Prime** (Act 1, 100 HP) — Thorns retaliator. Opens with
`Activate Defense: +10 Plating + 6 Thorns`, and `Reinforce` refreshes
thorns (`max(current, 6) + 4`) so multi-hit / AoE players bleed each
turn the Prime is on defense. Punishes Cleaver / Whirlwind chains
that walked over Foundry Tyrant.

**Vault Warden** (Act 2, 130 HP) — Slag Glob polluter. Every third
turn (3/6/9/...) it deterministically uses `Pollute: 10 + Slag Glob`,
jamming an unplayable curse card into the player's discard. Off-cycle
turns rotate Slam / Vault Volley / Reinforce / Iron Stagger. The
predictable pollute clock means players can plan exhausts around it
but can't ignore the deck-pollution pressure.

**Cyclone King** (Act 3, 145 HP) — alternating stance. Tracks
`memory.stance` and flips it each turn. Tempest stance hits hard
(`Tempest Strike: 24` or `Cyclone Sweep: 6x4` or `Gale: 10 + Vuln 2`)
but never gains plating. Iron stance gains huge plating (18–26) and
debuffs (Weak 2 / Vuln 2) but deals no damage. Player reads the
rhythm and plans two-turn windows: burst during Iron, scrub debuffs
during Tempest setup.

**Sprites** ([src/ui/MechSprite.ts](src/ui/MechSprite.ts))
- `drawReclaimerPrime` — wide-stance bipedal with spike-pauldrons
  (radial bone spikes on each shoulder), a front row of three
  forward-facing thorns down the torso, spike-knuckle gauntlets,
  red eye-slit visor. Reads as "do not touch."
- `drawVaultWarden` — squat tracked vault on stubby wheels with a
  glowing toxic-green central hatch (the Slag dispenser). Hatch
  has a brass wheel/spoke pattern, drips green from the bottom,
  pulses via a scale tween. Massive corner bolt-rivets sell the
  blast-door silhouette.
- `drawCycloneKing` — tall crowned figure vertically halved between
  shield-blue tempest (left) and steelDark iron (right). Left arm
  holds a wind-fan blade, right arm a heavy spiked mace. Helm has
  a tall central crown spike flanked by side points, eye slits in
  matching half-colors (steam left, danger right), and a blue
  wisp halo arc above the crown.

**Wiring** ([src/game/enemies.ts](src/game/enemies.ts:1327))
- `ACT1_BOSS_POOL` / `ACT2_BOSS_POOL` / `ACT3_BOSS_POOL` each gain
  the new boss. `getActBoss` still rolls uniformly across the pool,
  so each act has a 1/3 chance per run for each boss.
- All three registered in `ENEMY_DEFS` so save/load resumes them
  correctly via `run.pendingEnemyIds`.
- Sprite map ([src/ui/MechSprite.ts:ENEMY_SPRITES](src/ui/MechSprite.ts))
  gains the three new draws.

### Slice 44 — The Stoker (new pilot) + scrollable character select
A fourth pilot joins the roster with a snowball mechanic that's
different in shape from anything the existing three do.

**THE STOKER**
- Hull 55 (matches Saboteur baseline — high-risk specialist).
- Starter deck (10): 3 Auto-Cannon, 3 Brace, 1 Vent Steam, 2 Pyro
  Charge, 1 Acid Mist. Heavy on Burn-application from turn 1.
- Signature relic: **Furnace Heart** — `onTurnEnd` counts alive
  enemies with `burn > 0` and grants +1 Strength each (capped at 3
  per turn). One Pyro Charge → up to ~4 Strength stacks over the
  burn's lifetime. Snake-Oil Salesman events become genuinely
  dangerous since Heat Damage curses would hand free Strength to
  the player… wait, Heat Damage burns the player, not the enemy.
  Furnace Heart only counts enemy Burn, so the curses still hurt.

**Sprite** ([src/ui/MechSprite.ts](src/ui/MechSprite.ts))
- `drawStokerMech` adds a heat-themed industrial frame: planted
  legs, riveted brass torso, central furnace grate (orange/amber
  rect with vertical slats and inner-glow circle), three asymmetric
  smokestacks venting bone-dim smoke puffs, slit visor with amber
  glow. One arm is a stoking shovel, the other a fire poker tipped
  with a danger-orange ember. Subtle scale-pulse tween (1.012, 0.7s
  yoyo) sells the breathing furnace.
- Registered in `CHARACTER_SPRITES.stoker`.

**Scrollable character select**
- 4 cards × 380 wide doesn't fit in the 1280 viewport. Rather than
  shrinking cards, the scene now puts them in a `cardsLayer`
  container and drag-scrolls horizontally when the row overflows.
- `setupDragScroll(layer, minX, maxX)` adds scene-level
  pointerdown/move/up listeners with an 8 px drag threshold (so a
  short tap on the SELECT button doesn't kick off a scroll).
  Container x is clamped to `[minX, maxX]` so the row can't drift
  off-screen.
- `drawCharacterCard` refactored to return a Container holding all
  card elements at local coordinates (panel, sprite, name, tagline,
  description, stats, signature, SELECT button) so the whole card
  translates as one unit during scroll.
- A "DRAG TO SCROLL" hint renders at the bottom of the scene when
  overflow > 0. Hidden for 3-or-fewer pilots since the row fits
  natively.

### Slice 43 — Event pool 13 → 30
Seventeen new events bring the pool to 30, matching the StS-style
density. The previous 13 were heavy on small risk/reward and potion
acquisition; this batch fills gaps the older set didn't cover —
paid removal, archetype-specific card drops, max-hull-trade vendors,
sealed loot boxes, and a few outright gambling boxes.

**New events**
- **Junkyard Tinker** — pay 30 scrap to upgrade a random deck card.
  Alternative to Rest sites since rest+upgrade requires giving up the
  heal.
- **Black Market** — choose: scrap a random card for 50, buy a rare
  card for 70, or leave. Paid deck-removal alternative to the shop's
  one-time service.
- **Conduit Trance** — pick "induce a Power" or "induce a Sweep" to
  gain a random card filtered to that archetype. Builds-around get
  a deterministic step.
- **Whirlwind Survivor** — moral choice: help the dying pilot
  (-12 Hull, gain a rare card) or loot the wreck (+60 Scrap, -3
  max Hull).
- **Frozen Engine** — cannibalize a wreck for 2 random potions at
  -8 Hull, or 50/50 jump-start for a relic vs -10 Hull.
- **Cipher Wheel** — solve a puzzle (+15 Scrap + a potion if slot
  open) or smash it (+40 Scrap, -1 max Hull).
- **Crashed Drone** — strip for 25 scrap (-2 Hull) or salvage a
  random common card.
- **Toll Bridge** — pay 30 scrap, take 8 Hull, or sneak (50/50:
  free vs -12 Hull). Three distinct cost shapes for the same outcome.
- **Mirrored Pool** — look deeper for a 50/50 relic vs -8 Hull, or
  smash for +30 Scrap.
- **Sealed Crate Auction** — bid 35 scrap on a one-third chance each
  of card / potion / +60 scrap refund.
- **Pilgrim Healer** — pay 40 scrap to heal to full, or pray for a
  free +8 Hull.
- **Steel Hermit** — sit and listen (-1 max Hull, gain an uncommon
  card AND +20 Scrap). Permanent max-hull cost for compounding gain.
- **Snake-Oil Salesman** — 30 scrap for a 70/30 random potion vs
  Heat Damage curse. The first event that can stick a permanent
  curse on a careless choice.
- **Boiler Spirit** — listen (+5 Hull, gain a Slag Glob curse) or
  banish (-5 Hull, gain a rare card).
- **Old Soldier's Cache** — force open for -8 Hull + 2 random cards,
  or pick the lock for 50/50 (2 cards vs -3 Hull and nothing).
- **Drone Swarm** — capture one (-3 Hull, +1 potion + 15 scrap) or
  shoot the swarm down (+25 Scrap).
- **Cracked Engineer** — accept the field test: +60 Scrap but two
  Slag Globs jam into your deck. Pure curse-for-cash.

**Wiring**
- `events.ts` now also imports `isUpgradable` and `SHOP_POOL` from
  cards so the upgrade and archetype-filter events can do their thing.
- Each new event lives next to the existing helpers
  (`losePlayerHull`, `gainPlayerHull`, `tryAddPotion`, `grantRelic`,
  `pickRandomPotionId`, `pickRewardCards`, `cardName`, `potionName`).
  No new helpers needed.

Practical impact: an average run hits ~7 event nodes, so 30 events
means a single playthrough sees ~25% of them. Repeat exposure now
needs ~4 runs instead of ~2.

### Slice 42 — Animated enemy idles
Every enemy in the lineup (24 total: regulars, elites, bosses, and the
slice-28 boss alts) now has an infinite idle tween so the field reads
as alive between actions. Bosses already had per-character tweens from
their introduction slices; this pass filled in the 9 regulars and
elites that were sitting stiff:

- **Scrap Raider** — slow left-right shuffle (`x ± 2`, 1.2 s yoyo).
- **Junk Hound** — quick panting bob (`y -= 2`, 0.7 s yoyo).
- **Rust Sprayer** — acid-pressure pulse (`scale 1.02`, 0.9 s yoyo).
- **Pylon Crawler** — low tremble (`x ± 1.5`, 1.5 s yoyo).
- **Iron Reclaimer** — heavy turtle heave (`y -= 1.5`, 1.4 s yoyo).
- **Cinder Hound** — fiery panting (bob + small scale pulse, 0.6 s).
- **Forge Reaver** — heavier cleaver sway (`x ± 2.5`, 1.3 s yoyo).
- **Reclaimer Mk II** — slower heave than its Act 1 cousin (1.6 s).
- **Sky Pirate** — dramatic hover bob (`y -= 6`, 1.8 s yoyo) since
  the unit is airborne with no legs to ground it.

All tweens use `Sine.InOut` easing and `repeat: -1` for continuous
playback. Amplitudes are kept small (1.5–2.5 px x, 1.5–6 px y) so
they read as subtle life rather than competing with hit-shake and
the new slice-35 turn-event playback animations.

The player mechs (Pilot / Engineer / Saboteur) intentionally stay
static — they should only move when the player acts.

Pre-existing interaction to watch: hit-shake also tweens `x` on the
outer container, so during a shake the idle tween briefly fights for
the same property. In practice the shake is 40 ms × 2 yoyos so the
visual flicker is invisible.

### Slice 41 — Procedural ambient music
Replaced the 13 MB `industrial_ambiance.mp3` with a Web-Audio-synthesized
ambient track. Same dieselpunk vibe (low drone, steam hiss, distant
clangs and thumps) plus an actual cycling chord progression and a
melodic line so it reads as music, not a stationary horn.

**Initial attempt** was a static sawtooth-pad triad with a slow filter
LFO — sounded like a horn drone. Replaced with the layout below.

**Current layers** (all running continuously once `startMusic()` fires)
- **Sub-bass drone** — 55 Hz sine with a 0.07 Hz detune LFO at ±4
  cents so it breathes instead of sitting dead-flat. Volume 0.20.
- **Chord progression** — cycles **Am → F → G → E** every 6 s with
  2 s crossfades. Each chord is three sine voices (pad register: A2 /
  C3 / E3 style), volume 0.055 per voice. Sine waves keep the pad
  clean; the chord changes give it musical motion.
- **Sparse melody** — single triangle-wave notes from the **A-minor
  pentatonic** (A and E weighted toward the root/fifth). Fires every
  6–14 s with a fast attack / 2.4 s exponential decay. Each note
  passes through a **feedback delay** (0.42 s, 0.42 feedback) routed
  into master, so notes echo into the chord pad and add depth.
- **Steam hiss** — looped noise buffer through a bandpass with a slow
  center-frequency sweep (0.06 Hz LFO over ±600 Hz). Volume 0.03.
- **Random clangs** — every 12–20 s, a 0.45 s burst of bandpass-
  filtered noise (Q=14, random center 0.9–2.1 kHz) with exponential
  gain decay.
- **Random thumps** — every 6–10 s, a sub-bass 80 Hz sine bump with
  fast attack / exponential decay over ~0.5 s.

**Bundle impact**
- Removed `import ambientUrl from '../../assets/industrial_ambiance.mp3'`,
  so Vite no longer bundles the 13 MB file. Dist drops from
  ~5 MB (3.3 MB mp3 + 1.6 MB JS) to ~1.7 MB JS-only.
- The mp3 file is left on disk in `assets/` for now in case we want
  to revert; it just isn't referenced anywhere.

**API parity**
- The public exports from `src/audio/music.ts` (`preloadMusic`,
  `startMusic`, `setMusicVolume`, `setMusicMuted`, `isMusicMuted`,
  `AMBIENT_KEY`) stay the same shape so TitleScene and PauseScene
  don't change. `preloadMusic` and the `_scene` params are now
  unused but preserved.

**Autoplay**
- New AudioContexts are suspended by browsers until a user gesture.
  Both `pointerdown` and `keydown` listeners call `ctx.resume()`,
  which kicks the music in as soon as the player clicks anything on
  the title screen.

### Slice 40 — Map-pacing: no shops or rests in the first three floors
Playtest observation: early shops were dead weight — you have no scrap
to spend — and early rest sites wasted a slot because you hadn't taken
damage yet. Tightened map generation in
[src/game/map.ts](src/game/map.ts) so shops and rests can only appear on
floors 3 and 4 (the four mid-floors out of the 7-floor map):

- **Floor 0** entry: combat (unchanged).
- **Floor 1**: combat or event (~25% event). No elite / shop / rest.
- **Floor 2**: combat, event, or elite (~14% elite, ~20% event). No
  shop / rest yet.
- **Floors 3–4**: full mix (elite / shop / rest / event / combat) at
  the same weights as before.
- **Floor 5** (`FLOORS-2`): forced rest (unchanged).
- **Floor 6**: boss (unchanged).

Trade-off: the window for shops/rests is narrower (2 floors instead of
4), but the probability distribution stays the same, so a path through
the mid-floors still encounters ~1 of each on average. The previous map
could randomly land your only rest site on floor 1 where it heals
nothing useful — that failure mode is gone.

### Slice 39 — Rarity expansion + 7 new cards + visual rarity
Three things bundled because they're all about how rarity reads:

**Rarity tiers expanded to five**
- `CardRarity` gains `'epic'` between `'rare'` and `'legendary'`.
- New reward-pool weights:
  - Combat: 60 / 25 / 10 / 4 / 1
  - Elite:  18 / 40 / 22 / 13 / 7
- Practical odds of seeing at least one legendary in a 3-card reward
  pick: ~3% in regular combats, ~20% in elite rooms.
- 4 strong existing rares promoted to epic (Iron Will, Demon Form,
  Barricade, Furnace Strike — the scaling-power deck-defining ones).
- Potions still span only common/uncommon/rare; their weight map
  carries `epic: 0` and `legendary: 0` for type-checking.

**Visual rarity** (in [src/ui/theme.ts](src/ui/theme.ts) and
[src/ui/CardView.ts](src/ui/CardView.ts))
- New `RARITY_COLORS` palette: common brass / uncommon green / rare
  shield-blue / epic purple / legendary amber-orange.
- `CardView` stores a `rarityColor` field; the card border uses it
  when playable, falls back to `cardBorderDim` when unplayable so the
  playable signal still wins.
- Top-right star indicator now covers three tiers:
  ★ rare / ★★ epic / ★★★ legendary, tinted to match the border.
- New top-left **upgrade indicator (▲)** in brass for any card whose
  id ends in `+`. Sits next to the cost badge so it's visible without
  reading the name.

**Seven new cards**
- Common entry points (so every status archetype has a turn-1
  acquisition path):
  - **Ember Round** (1c, 5 dmg + 2 Burn; 7/3+) — fills the Burn
    archetype that previously only existed at uncommon+.
  - **Steel Resolve** (1c, +1 Strength, exhaust; +2 upgraded) —
    common Strength.
  - **Plate Adjust** (1c, +1 Dexterity, exhaust; +2 upgraded) —
    common Dexterity.
- New rare:
  - **Reactor Surge** (2c, 14 dmg + 3 Vulnerable; 18/4+) — a single-
    target Vulnerable nuke, fills the gap between Hammer Strike
    (common, 1 Vuln) and Forge Wave (rare AoE, 1 Vuln).
- New legendaries:
  - **Overdrive Core** (2c, +2 Str / +2 Dex / +2 Thorns, exhaust;
    3/3/3 upgraded) — three-status mega-buff in one card.
  - **Final Lance** (X, exhaust, 12 dmg X times; 15 upgraded) —
    legendary version of Skewer. With max Steam + Strength, hits
    well into the 60+ range.

### Slice 38 — Six new relics
The relic pool jumps from 18 → 24, with one tiny engine addition
(`Relic.onTurnEnd`) to support the two passive-effect entries.
Niches the previous set didn't really exercise — exhaust synergy,
retain synergy, risk/reward, full-hull rewards, end-of-turn passives —
all get one entry each.

**Engine — onTurnEnd**
- `Relic` interface gains an optional
  `onTurnEnd?(state: CombatState): void` hook.
- `endTurn` fires it AFTER Metallicize / Combust and BEFORE the phase
  flip to `'enemyTurn'`. Checks `phase` afterward so a victory or
  defeat triggered by the hook (Auto-Mortar killing the last enemy,
  hypothetically a self-damage relic killing the player) cleanly
  bails out the rest of the function.

**Relics**
- **Backup Capacitor** — Exhaust synergy. `onCardPlayed` checks
  `card.exhaust`; if true, refunds +1 Steam. Power cards and the
  exhaust-on-play status cards (Slag Glob etc.) both trigger it.
- **Retained Bracer** — Retain-keyword synergy. `onTurnStart` counts
  hand cards with `card.def.retain` and grants +2 Plating each.
  Hold Position + this relic is a small turtle engine.
- **Coal Coil** — Risk/reward boss-relic style. `onPickup` cuts -3
  max Hull permanently; `onCombatStart` grants +2 Strength. Stacks
  with Power Cell for +3 Str / combat baseline.
- **Battle Cap** — Clean-combat reward. `onCombatEnd` checks
  `hull >= maxHull`; if so, +8 Scrap. Pairs with Barricade /
  Metallicize turtle builds and Thorns retaliators.
- **Auto-Mortar** — Passive end-of-turn damage. `onTurnEnd` rolls a
  random alive enemy and routes 5 damage through `dealDamageToEnemy`
  so Strength / Vuln / Brass Knuckles all flow through correctly
  (the random target eats the first-attack-bonus on its first turn).
- **Bristle Plate** — Plating top-off. `onTurnEnd` checks
  `plating < 5`; if so, +3 plating. Compensates for skipping a
  defense card on light-hit turns.

No save schema change — relics are just string ids on the run state.

### Slice 37 — Ascension damage scaling
Slice 36 shipped HP-only ascension modifiers. Long fights, not harder
fights. This slice layers outgoing-damage multipliers onto A1 / A3 /
A4 so each tier actually hurts.

**Multipliers**
- A1 Tough Mooks: +15% regular-enemy damage (on top of +25% HP).
- A3 Hard Elites: +20% elite damage (on top of +30% HP).
- A4 Resilient Bosses: +20% boss damage (on top of +30% HP).
- A2 and A5 unchanged (rest-heal and starting-hull respectively).

**Wiring**
- `CombatState` gains `enemyDamageMult: number`, set once at combat
  init via the new `ascensionDamageMult(kind, ascension)` helper.
  Default 1.0 means no scaling.
- `dealDamageToPlayer` applies the multiplier AFTER Strength but
  BEFORE Vulnerable / Weak — scales the base hit, not the post-
  status final number. Each modifier still goes through
  `Math.floor` per StS convention.
- `IntentView.update` takes a 5th optional `enemyDamageMult` arg.
  Its display-label recompute applies it in the same order as
  the engine so the telegraphed damage number matches what
  actually lands.
- CombatScene passes `s.enemyDamageMult` to `ui.intent.update`
  alongside the existing Strength / Weak / Vuln args.

**Tier descriptions**
`ASCENSION_TIERS` text updated to mention the damage bumps so the
title-screen selector reads accurately.

No save schema impact — `enemyDamageMult` lives inside
`CombatState`, which doesn't persist.

### Slice 36 — Ascension ladder
Five-tier escalating difficulty ladder unlocked by clearing the run
at the previous tier. Each tier adds a stacking modifier so A5 is
"all five modifiers active simultaneously". Real replay system.

**Tiers** (in `ASCENSION_TIERS`, defined in `src/game/meta.ts`)
- **A1 — Tough Mooks**: Regular enemies have +25% Hull.
- **A2 — Reduced Recovery**: Rest sites heal 20% of max Hull (was 30%).
- **A3 — Hard Elites**: Elite enemies have +30% Hull.
- **A4 — Resilient Bosses**: Bosses have +30% Hull.
- **A5 — Cracked Frame**: Start each run with -5 max Hull.

**Meta state**
- `MetaState` gains `currentAscension` (the tier the player picked for
  their next NEW RUN) and `highestAscension` (the cap, unlocked by
  clearing). Back-compat: missing fields hydrate to 0 / 0.
- `setCurrentAscension(level)` clamps to highest and persists.
- `unlockNextAscensionIfApplicable(cleared)` bumps `highestAscension`
  if the player cleared at the current cap.
- `MAX_ASCENSION` derived from `ASCENSION_TIERS.length`.

**Run state**
- `RunState` gains `ascension?: number`, snapshotted from
  `meta.currentAscension` at `startRun`. Combat init, rest heal, and
  startRun's own -5 maxHull mod all read this rather than re-reading
  meta — mid-run meta changes can't apply retroactively.
- A5 reduces `startingHull` by 5 at run start (min 1).
- A2 swaps the rest-heal fraction 0.30 → 0.20 via a small
  `restHealFraction(r)` helper used by both `restHeal` and
  `restHealAmount`.

**Combat**
- `createCombatState(enemyDefs, persistent, relicIds, combatKind?,
  ascension?)` — two new params. `combatKind` is one of
  `'regular' | 'elite' | 'boss'`; `ascension` defaults to 0.
- `ascensionHullMult(kind, ascension)` returns the HP multiplier
  layered on top of the existing multi-enemy `groupScale`. A1 +25%
  regular, A3 +30% elite, A4 +30% boss.
- CombatScene reads `run.currentNodeId` to look up `node.kind` and
  passes it (plus `run.ascension`) into `createCombatState`.

**UI**
- TitleScene gains an ascension selector under the WORKSHOP POINTS
  banner, but only renders if `highestAscension > 0` so first-run
  players never see it. `< / >` buttons cycle through
  `0..highestAscension`; current label + tier description rendered
  in danger-red.
- Selecting a tier calls `setCurrentAscension` then
  `this.scene.restart()` to repaint with the new value.
- RunSummaryScene picks up the run's ascension and shows
  `CLEARED ASCENSION N` (danger-red) on any cleared tier, or
  `CLEARED ASCENSION N — UNLOCKED ASCENSION N+1: <name>`
  (steam-cyan) when the clear pushed the cap up.

**Save**
- `RunState.ascension` round-trips through save/load with a default
  of 0. Schema stays v4.
- Meta save is unchanged structurally — `saveMeta` writes the full
  object so the new fields persist automatically.

Known follow-up: damage scaling isn't part of A1/A3 yet — only HP.
HP-only is the simpler MVP; if the ladder feels lopsided we can add
a `state.enemyDamageMult` field and thread it through
`dealDamageToPlayer`. Same shape as the StS damage-up modifiers.

### Slice 35 — Animated enemy turn playback
The enemy turn used to resolve in a single tick: one aggregate
`emitDeltas` showing a consolidated damage number per enemy/player.
Now each hit, brace, status apply, and death animates as its own beat
so the player can read what's happening.

**Engine — event log**
- New `TurnEvent` union in `types.ts` with variants: `enemyAct`,
  `playerDamaged`, `enemyDamaged`, `enemyDied`, `enemyPlating`,
  `playerStatus`, `playerBurnTick`, `playerHealed`, `log`.
- `CombatState` gains `turnEvents: TurnEvent[]`. Cleared at the top
  of `endTurn`, populated as actions resolve.
- `dealDamageToPlayer` / `dealDamageToEnemy` / `gainEnemyPlating` /
  `applyVulnerableToPlayer` / `applyWeakToPlayer` /
  `applyBurnToPlayer` all push events. The damage helpers also push
  `enemyDied` when the hit drops the target's hull to 0.
- `endTurn` pushes an `enemyAct` marker before each enemy resolves
  so the scene can lunge / glow / highlight the actor before its
  damage events fire.
- Player-card-play also writes events (same helpers), but the scene
  only replays them after `endTurn`. The `applyCardPlay` path
  continues to use `emitDeltas` against a pre-snapshot.

**Scene — playback**
- `CombatScene.playTurnEvents(pre, events)` walks the log with
  `await`-able delays between events.
- `renderTurnEvent` switches on `event.kind` and runs the matching
  tween: lunge for `enemyAct` (yoyo 110 ms), float-number + ring +
  burst for damage hits (220–280 ms), bigger burst + camera shake
  for `enemyDied`, status badges for `playerStatus`, etc.
- A `playingTurnEvents` flag gates `onCardPointerDown`, `onEndTurn`,
  and `onPotionSlotClick` so the player can't act mid-replay.

**Bars-during-playback**
- The state's already-final values would make the StatBars jump to
  end-of-turn values at the very first event, so playback uses a
  `DisplayedStats` snapshot that starts at pre-endTurn values and
  decrements per event.
- `refreshBarsFromDisplay` paints from that snapshot; status
  counters (vuln/weak/burn/str/dex/thorns) still come from state
  since they change at most once per turn.
- After the playback Promise resolves, the regular `refresh()`
  lays out the newly-drawn hand, snaps bars to final state, and
  routes to victory/defeat if the enemy turn ended there.

Pacing tuned for "readable but not slow": `enemyAct` 180 ms,
significant hits 260 ms, plating 180 ms, deaths 280 ms. A
multi-hit attack like Sweep 5×3 plays as three distinct beats with
their own damage numbers.

### Slice 34 — Status / curse cards
Closes the last big StS mechanic gap. Enemies and events can now
inject "junk" cards into the player's deck that clutter the hand and
optionally hurt the player while held.

**New card flags** (on `CardDef`)
- `unplayable: boolean` — `canPlay` returns false. Cost badge renders
  "—". The card stays in the hand until end of turn or until a
  mechanic forces it elsewhere.
- `endOfTurnDamageInHand: number` — if still in hand at end of turn,
  the player takes this much hull damage (bypasses plating). Fires
  BEFORE hand routing so ethereal curses (e.g. Shrapnel) sting even
  though they auto-exhaust seconds later.

**Card insertion helpers** (exported from `combat.ts`)
- `addCardToDiscard(c, cardId)` — pushes a fresh instance onto the
  player's discard pile. Used by enemy resolve closures.
- `addCardToDraw(c, cardId)` — inserts at a random index in the draw
  pile so the player can't game when it surfaces.
- `addCardToHand(c, cardId)` — pushes to hand directly; overflows
  (>= 10 cards) cascade to discard.

**Cards** (4 new, NOT in `SHOP_POOL` / `REWARD_POOL`)
- **Slag Glob** (status, 1c, none, exhaust) — Plays for nothing. The
  classic "wastes a steam" filler.
- **Shrapnel** (status, unplayable, ethereal) — Stays in hand one
  turn, then auto-exhausts. Pure draw-clutter.
- **Heat Damage** (curse, unplayable, 2 hull per turn in hand) — Real
  threat: every turn it's drawn, you take 2 hull.
- **Old Rust** (curse, unplayable) — Permanent deck weight. Dilutes
  draws until you spend a shop removal.

**Enemy hook**
- **Rust Sprayer** gains a "Slag Lob" action: 4 damage + adds a Slag
  Glob to discard. Replaces some of the existing Corrode probability
  weight; the existing Plating Mist fallback remains.
- Slag Lob's intent label exercises the Slice-29 intent damage
  display fix automatically (`intent.damage = 4`).

**Event**
- **Cursed Idol** — three-choice event. Take the prize (random
  relic + Heat Damage curse), pry for parts (-5 hull + 30 scrap), or
  walk past.

**UI**
- `CardView` keyword badge prepends `UNPLAYABLE` in the danger-red
  color (vs the rust orange used for INNATE/RETAIN/ETHEREAL/EXHAUST
  and steam-cyan for POWER).
- Cost badge label cascade: unplayable → "—", xCost → "X", else the
  literal cost number.

Event pool 12 → 13. Card pool grows by 4 (non-shop) to 54 base + `+`
upgrades.

### Slice 33 — X-cost cards
The last major mechanic gap from the original Slay-the-Spire feature
comparison. Cards with cost "X" consume ALL remaining Steam at play
time and scale their effects by the amount consumed.

**Engine**
- `CardDef` gained an `xCost?: boolean` flag. The `cost` field stays
  at 0 (so it sorts cleanly with other zero-cost cards), but a new
  helper, `effectiveCost(state, def)`, treats `xCost` cards as
  costing `p.steam` (all of it). `canPlay` reads through this, so
  X-cost cards are always playable on the player's turn.
- `CombatState` gained `activeCardX?: number`, set by `playCard` to
  the Steam actually consumed (matches the card's literal X).
  Cleared after the effect loop, alongside `activeTargetIndex`.
- Three new `CardEffect` kinds:
  - `xDamageAll` (amount per hit) — loops X iterations × every alive
    enemy, each call going through `dealDamageToEnemy` so Strength,
    Vulnerable, Weak, and Brass Knuckles apply per hit (with the
    first-hit-only bonuses consuming on the first iteration).
  - `xDamage` (amount per hit) — same but single-target.
  - `xPlating` (amount per tick) — applies the regular `plating`
    effect X times so Dexterity stacks each tick.
- Each loop bails on victory/defeat mid-sweep (Thorns retaliation,
  Combust death, etc.) so we don't double-fire after a hard stop.
- firstCardFree (Boiler Vent) reads as X=0 for X-cost cards: cost
  is forced to 0, no Steam consumed, so X is 0 and the effects no-op.
  Predictable but worth a future "use original Steam pool when free"
  tweak if play feels bad.

**Cards** (3 new + upgrades, all in `SHOP_POOL`)
- **Whirlwind** (X common, allEnemies) — Deal 5 damage to all enemies
  X times (7 upgraded).
- **Skewer** (X uncommon, enemy) — Deal 7 damage X times (10 upgraded).
- **Forge Cycle** (X uncommon, self) — Gain 4 Plating X times (6
  upgraded). Pairs hard with Dexterity stacking.

**UI**
- `CardView` cost badge renders `"X"` when `xCost` is set instead of
  the literal `0`. No other UI changes needed — the badge fades to
  the dim brass color when unplayable (same as any other card).

### Slice 32 — Hand-shuffle tween + End Turn lock
Two short follow-ups from the animation work in Slice 31.

**Hand-shuffle tween**
- Previously, when a card left the hand, the remaining cards
  snapped to their new positions inside `setHome`. Now they tween.
- `CardView.setHome` gained a `snap = true` parameter. Passing
  `false` updates the home (x, y, rot) values without moving the
  container, so the caller can animate the container itself.
- New `CombatScene.tweenHandTo(view, x, y)` runs a 180 ms
  `Cubic.Out` x/y tween. It bails if the move is sub-pixel, if the
  view is being dragged (`view.isDragging()`), and `killTweensOf`s
  any prior layout tween so back-to-back refreshes don't stack
  motion.
- `layoutHand` now branches per view: newly-created views still
  snap-to-home then `animateDrawIn` from the draw pile; existing
  views set their home without snapping and call `tweenHandTo`.

**End Turn lock during play flourish**
- Pre-existing race documented in Slice 31's notes: pressing End
  Turn during a card's play flourish let `endTurn()` discard the
  still-pending card before its `applyCardPlay` ran, swallowing
  the play.
- Fixed with `if (this.playingViews.size > 0) return;` at the top
  of `onEndTurn`. The button stays visually live (no graying), but
  the 340 ms flourish window is short enough that the no-op is
  not noticeable.

### Slice 31 — Card draw / discard / play animations
Cards used to pop in and out of the hand instantly. Now they fly
from a draw-pile anchor into the hand on draw, sweep to a discard-
pile anchor on play / end-of-turn discard, and the play "flourish"
chains a brief lift into a tween toward the discard pile.

**Pile anchors** (in [src/scenes/CombatScene.ts](src/scenes/CombatScene.ts))
- `drawPile = { x: 70, y: height - 80 }` — bottom-left, above the
  DRAW counter.
- `discardPile = { x: width - 100, y: height - 80 }` — bottom-right,
  above the DISCARD/EXHAUST counter.
- `drawPileStack` renders three slightly-offset 28×38 rectangles
  at each anchor so the destinations read as a "stack of cards"
  at a glance.

**Draw-in**
- `layoutHand` tracks a `newlyCreated` set per call. After it calls
  `setHome(x, y, 0)` for each card (which snaps the view to its
  hand slot), it calls `animateDrawIn` for newly-created views.
  That overrides the view's position to the draw pile (alpha 0,
  scale 0.35) and tweens it back to the hand slot (alpha 1,
  scale 1) over 220 ms with a 50 ms stagger between cards.
- Used for both opening-hand draw and turn-start draw.

**Discard-out**
- For each stale view (in `cardViews` but no longer in
  `state.player.hand`), `animateDiscardOut` tweens the view to the
  discard pile (alpha 0, scale 0.35, 220 ms, 40 ms stagger) and
  destroys it on complete.
- Triggered automatically by the existing diff in `layoutHand` —
  no caller-side bookkeeping needed.

**Play flourish (rewritten)**
- Stage 1 (140 ms): lift y by 40 + scale up to 1.18 — the
  satisfying "card played" beat.
- Stage 2 (200 ms): tween toward `discardPile` with alpha → 0
  and scale → 0.35. Destroys the view on complete.
- The state mutation (`applyCardPlay`) fires via a 140 ms
  `delayedCall` so the rest of the hand re-flows while the played
  card sweeps to the pile (rather than waiting for the full
  340 ms exit).

**Chained-play coordination**
- A `playingViews: Set<CardView>` field tracks views currently in
  their play flourish.
- `layoutHand` filters stale views by this set so a card mid-play
  doesn't get a second exit tween stacked on top of its flourish.
- Crucially the view is **not** removed from `cardViews` at flourish
  start — it stays there until the next `refresh()` after
  `applyCardPlay` mutates state. This means a chained second play
  that triggers a refresh during the first card's flourish still
  finds the first view in `existing` and doesn't try to re-spawn
  it from the draw pile.

Pre-existing limitation, not introduced here: the player can press
End Turn during a play flourish, in which case the still-pending
card gets discarded by `endTurn` before its `applyCardPlay` runs.
Worth fixing later by gating End Turn while `playingViews.size > 0`.

### Slice 30 — Run-end summary screen
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
- **Even more events** — Slice 43 brought the pool to 30 (matching
  StS density). Future entries could go deeper on boss-specific
  flavor (events that hint at the boss waiting at the top of the
  act) or character-flavored ones (Pilot / Engineer / Saboteur
  unique choices).
- **Even more bosses** — each act has 2 bosses (Slice 28). A pool
  of 3 per act would push past "I've seen them all" after a few
  more wins.
- **More relics with bespoke hooks** — Slice 38 brought the pool to
  24 and added the `onTurnEnd` hook. Niches still empty: deck-search
  ("at start of combat, draw a specific card type"), cost-modifier
  ("Attacks cost 1 less"), conditional-damage ("first hit vs a full-
  hull enemy deals double").
- **Daily seed / shareable runs** — same seed for everyone on a
  given date; share button copies a permalink that imports the
  exact run state. Would require seeded RNG threaded through map
  gen, encounter pick, card pool, etc. (currently uses
  `Math.random` directly throughout).
- **Run history** — past runs (win/loss, final deck, deaths)
  stored locally for retrospection.

### Tier 3 — polish
- **Animated enemy idle** — small bob / occasional twitch so
  static silhouettes feel alive.
- **Sprite consistency pass** — enemies are hand-coded geometry
  with inconsistent silhouette weight and detail density. A
  second pass with a unified style guide would help cohesion.
- **Ambient effects on Map/Combat scenes** — smokestack puffs,
  spark-pop on damage, blowing dust on the wasteland horizon.

### Tier 4 — long-term structural
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

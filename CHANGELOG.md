# Changelog

All notable changes to **Rust & Rivets**. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## Unreleased

### Mobile-friendly first pass

Foundational support for small screens and touch. The game now renders
at any viewport size from a 320×240 minimum to 4K, auto-scales on
window resize and device rotation, prevents browser zoom-and-pan
hijacks on mobile, and converts the relic hover tooltip to a
tap-to-pin pattern so touch users can read what their gear does.

**Engine + viewport**
([src/main.ts](src/main.ts) + [index.html](index.html)):

- Phaser scale config gained `expandParent: false`, `min` (320×240),
  `max` (3840×2160), and `input.activePointers: 4` so multi-touch
  gestures don't drop the primary drag pointer.
- HTML viewport meta now includes `maximum-scale=1.0`,
  `user-scalable=no`, and `viewport-fit=cover` to block pinch-zoom
  and honor iPhone notches.
- CSS adds `touch-action: none`, `overscroll-behavior: none`,
  `-webkit-user-select: none`, and `safe-area-inset-*` padding so the
  canvas claims the full viewport without hijacking pull-to-refresh
  or showing iOS callout menus on long-press.
- `orientationchange` listener calls `game.scale.refresh()` after a
  200 ms delay so iOS Safari (which fires the event BEFORE the new
  viewport dims are available) gets a clean post-rotation re-layout.

**Tap-to-pin tooltips** ([src/scenes/MapScene.ts](src/scenes/MapScene.ts)):

The relic icons on the map used to open their tooltip on `pointerover`
and close on `pointerout` — works for mouse, breaks on touch (the
tooltip flashes for an instant). Replaced with a hybrid pattern:

- Mouse hover still opens / closes as before (flagged `hoverOnly`
  on the container so a hover tooltip auto-dismisses on
  `pointerout`).
- Touch tap pins the tooltip; a second tap on the same relic
  toggles it off; tapping anywhere else on the scene also dismisses.
- The relic's own `pointerdown` calls `stopPropagation` so its tap
  doesn't reach the scene-level dismisser. Scrolling the map (which
  routes through the same scene pointerdown) cleanly closes any
  pinned tip.

**Touch tap targets bumped to ≥ 44 px**
([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/buttons)
and Material both recommend this as the minimum hit area):

- Title `<` `>` ascension cycle buttons: 40×32 → 56×44
- Title MUSIC / SFX mute toggles: 200×36 → 200×44
- Library `CARDS` / `RELICS` tabs: 160×36 → 160×44

**Portrait-orientation hint** ([src/scenes/TitleScene.ts](src/scenes/TitleScene.ts)):

A semi-transparent panel renders at the title's center reading
`↺ ROTATE FOR BEST EXPERIENCE / Rust & Rivets is laid out for
landscape. Turn your phone sideways and you're set.` Detection reads
`window.innerWidth / innerHeight` directly (so the actual device
orientation drives it, not the 1280×720 design canvas), gates on
both `isPortrait` and `min(w, h) < 700` so desktop browsers
narrowed for testing don't get the hint, and the panel rebuilds on
every `scale.on('resize')` event so rotating the phone in the
middle of looking at the title clears it.

**Touch-friendly drag thresholds**: LibraryScene's pointer-move
drag threshold went 6 → 8 px to match MapScene / CharacterSelectScene.
6 px was triggering scroll on finger jitter.

### Title screen polish + potion icons

Three fixes off the responsive pass:

**Records popover.** The always-visible RECORDS panel in the
top-right corner was overlapping the title in portrait. Replaced
with a small `RECORDS` button in the same corner that toggles a
popup overlay with the stats. Tapping the dim outside the panel or
the button itself dismisses; the panel anchors to the button when
there's room and centers on the viewport otherwise. Clean for both
phone portrait and desktop landscape.

**Compact-layout threshold raised** from `height < 580` to
`height < 700`. The audio mute toggles in the landscape layout sit
at `0.75 × height + 150` from the top, so anything below 700 px
clipped them off-screen. The vertical stack layout now kicks in
for any window narrower than 900 wide OR shorter than 700 tall,
which catches resized desktop browsers and most tablets.

**Potion icons.** `PotionDef` gained an optional `icon: string`
field (single-glyph emoji) — rendered on the combat potion belt
(22 px above the abbreviated label), the shop's potion offer (26 px
on the left of the name), and the reward-scene drop line:

| Potion | Icon |
|---|:---:|
| Block | 🛡️ |
| Fire | 🔥 |
| Swift (draw) | 🃏 |
| Energy (steam) | 💨 |
| Weak | ☠️ |
| Vulnerable | 🎯 |
| Strength | 💪 |
| Repair | 🔧 |
| Cinder (burn) | 🌋 |
| Spike (thorns) | 🌵 |
| Bracer (dex) | 🤸 |
| Surge (rare) | ⚡ |

### Responsive scenes (portrait + landscape)

**Engine config switched from FIT to RESIZE mode.** RESIZE hands
scenes the *actual* viewport width/height via `this.scale.width / height`
instead of the fixed 1280×720 design canvas. Scenes that already
compute positions off those values adapt naturally to any viewport
including portrait. Scenes that want to redraw on rotation hook
`this.scale.on('resize')`.

**Regression fix from the first responsive pass:** the CSS
`safe-area-inset` padding on `body` combined with `100% / 100%` on
`#game` was shrinking the canvas off-center on desktop. Restored
`100vw / 100vh` on `#game` and moved the safe-area padding onto the
canvas element itself, so the canvas sits flush in the viewport but
still inset from iPhone notches.

**TitleScene now fully responsive.** Single create() detects
`portrait = height > width` and branches:

- Title font scales with viewport (`Math.min(72, Math.max(36, width/18))`)
- Portrait stacks every button vertically with 64 px row pitch
- EXPORT / IMPORT side-by-side at half-width when there's room;
  full-width and stacked when there isn't
- MUSIC / SFX toggles split similarly
- Footer wraps via `wordWrap` so the long status line never clips

Triggered on browser-level resize / orientation change:
`window.addEventListener('resize', ...)` and `orientationchange` in
`main.ts` call `game.scale.refresh()` (with a 50–200 ms debounce);
TitleScene's own `scale.on('resize')` handler debounces 120 ms and
restarts the scene so layout re-flows for the new dimensions.

**Rotate-to-landscape hint removed.** With actual responsive
layouts there's no need to nag the player about device orientation;
portrait is now first-class on TitleScene.

**Known follow-up.** The map, combat, character-select, library,
event, shop, rest, and workshop scenes still assume landscape
proportions in their absolute layouts. They render and function in
portrait via the resize-on-rotation hook, but their UI elements
crowd into the available space. A focused portrait pass on each is
the next slice.

### Installable as a PWA

The game is now a full Progressive Web App. On Android / Chrome /
Edge the browser surfaces an install prompt; on iOS it can be
added to the home screen via Safari's share menu.

- **`public/manifest.webmanifest`** declares the app metadata —
  fullscreen display, landscape orientation, dark theme color
  (`#14110f`), and the games category. `display_override` falls
  through fullscreen → standalone → minimal-ui so the platform
  picks the best fit.
- **`public/icon.svg`** — vector app icon. Brass `R&R` monogram
  framed by a riveted ring, with a maskable-safe central zone so
  Android's circular crop doesn't lose anything important.
- **`public/sw.js`** — minimal service worker. Cache-first for the
  app shell (`./`, `index.html`, `manifest.webmanifest`, `icon.svg`)
  plus runtime caching of the hashed JS bundle on first fetch. New
  SW activation wipes prior caches so deploys roll out cleanly.
  Registered from [src/main.ts](src/main.ts) only in production
  (Vite serves assets directly in dev).
- **HTML head** updated with `<link rel="manifest">`,
  `<link rel="apple-touch-icon">`, `apple-mobile-web-app-title`,
  and `theme-color` so iOS Safari and Android Chrome both get a
  clean install card.

Once deployed under HTTPS (GitHub Pages already gives you this),
the install prompt appears automatically on Chrome/Edge after the
first interaction. iOS users get "Add to Home Screen" from the
share sheet.

### Pilot unlocks + save migration

**The non-base pilots are now gated behind boss kills.** All five
pilots used to be available from the title; now players start with
just the Pilot and earn the rest through play:

| Pilot | Unlock |
|---|---|
| Pilot | Start |
| Engineer | Beat Act 1 |
| Saboteur | Beat Act 2 |
| Stoker | Beat Act 3 |
| Conductor | Win a full run |

Locked pilots still render on the character-select screen with a
dimmed silhouette and a red "Beat Act N" hint above a disabled
LOCKED button, so players can see what's possible while they grind.

**Save schema bumped 1 → 2 with proper migration.**
`migrateMeta(data)` is the new central upgrade entry point in
[src/game/meta.ts](src/game/meta.ts). It accepts any version
between `MIN_READABLE_SCHEMA` (1) and `META_SCHEMA` (2), forwards
it to the current shape, and writes the migrated blob back to
localStorage so subsequent loads skip the upgrade path. Future
schema versions (`> META_SCHEMA`) fall back to `emptyMeta()`
instead of being silently downgraded into a broken intermediate
state.

**Migration is strict — existing saves don't get pilots
grandfathered in.** v1 saves migrating to v2 reset
`unlockedCharacters` to `['pilot']` regardless of past usage.
History counters (`runsStarted`, `runsWon`, `bestAct`,
`perCharacter`) survive intact, so the title-screen records panel
still reflects past play — but the pilot ladder must be re-earned.

**Unlock helpers** ([src/game/meta.ts](src/game/meta.ts)):

- `isCharacterUnlocked(id)` / `unlockRequirementFor(id)` —
  CharacterSelectScene reads both to decide whether to render the
  locked overlay.
- `unlockCharacter(id)` — idempotent unlock.
- `unlockCharactersForAct(actCleared)` — iterates the ladder and
  grants every rung at or below `actCleared`. Called from
  `completeCombat` after every boss kill alongside the existing
  `recordBossDefeated` / `recordActReached` history bumps.

### UX fixes

- **`firstCardFree` cost badge** ([src/game/combat.ts](src/game/combat.ts)
  + [src/ui/CardView.ts](src/ui/CardView.ts)). When Boiler Vent makes
  the first card of a turn free, every card in hand now visibly shows
  `0` on its cost badge tinted green (the discount color). Reactor
  Lens's `-1 Steam on Powers` also reflects on the badge. Implemented
  via new `costLabel(state, def)` helper that returns both the label
  string and a `discounted` flag; `CardView.setCostLabel(label, discounted)`
  applies it on every hand-layout refresh.
- **Hand layout at 8+ cards** ([src/scenes/CombatScene.ts](src/scenes/CombatScene.ts)).
  `maxSpread` widened from `width − 360` → `width − 240` (more lateral
  room), and a `minSpacing = CARD_W × 0.6` floor prevents extreme
  crowding at 12+ cards. Hands up to ~10 cards lay out without
  crushing each other; beyond that the rightmost cards still draw
  last so pointer focus favors the freshly-drawn card.
- **ShopScene defensive bailout.** If somehow `pendingShop` is null
  when ShopScene's `create()` runs, the scene now bounces to the map
  immediately. Previously the LEAVE button was inside the early-return
  path so the player would have been stranded with no exit.

### Run history & Library

A title-screen overhaul: lifetime stat tracking + a browsable
encyclopedia. The title used to be a gate to "press NEW RUN" — now
it's the hub that shows the player what they've accomplished and
what's possible.

**Persistent run history** ([src/game/meta.ts](src/game/meta.ts)).
New `RunHistory` block on `MetaState` tracks:

- `runsStarted` / `runsWon` lifetime counters
- `bestAct` (highest act ever reached)
- `bossesDefeated` (cumulative)
- `bestAscensionCleared` (highest cleared, distinct from
  `highestAscension` which is the next tier unlocked)
- `perCharacter` map of `{ runs, wins }` per pilot

Four recorder helpers wire into the run lifecycle:

- `recordRunStart(characterId)` — called from `startRun()` before
  meta upgrades apply.
- `recordActReached(act)` / `recordBossDefeated()` — called from
  `completeCombat()` after every boss kill.
- `recordRunWin(characterId, ascension)` — called from
  `RunSummaryScene` on victory.

Schema migration: old saves without `history` hydrate via
`hydrateHistory()` — purely additive, no data loss, no version bump
needed.

**Title screen RECORDS panel.** Compact 5-row card in the top-right
corner showing Runs / Wins / Best Act / Bosses / Win rate. Only
renders if `meta.history` exists (always true post-Slice-55).

**LibraryScene**
([src/scenes/LibraryScene.ts](src/scenes/LibraryScene.ts)). New
scene reachable from the title via a LIBRARY button in the
secondary row. Two tabs:

- **CARDS** — 5-column grid of every base card (no `+` variants),
  sorted by rarity then name. Each cell shows cost badge,
  name, full description, and a rarity label. Border tinted by
  rarity (`RARITY_COLORS`).
- **RELICS** — 2-column grid of every relic, sorted alphabetically.
  Each cell shows star icon, name, description, and a `BOSS DROP`
  tag on `signature: true` relics so players know which ones are
  gated behind specific kills.

Both grids use the same wheel + drag scroll pattern as the map
scene (6-pixel drag threshold). Switching tabs restarts the scene
so the scroll state resets cleanly.

### Tests

- **Vitest** added as a dev dependency. `npm test` runs the suite once;
  `npm run test:watch` runs in watch mode.
- **65 tests** across three suites:
  - **`tests/combat.test.ts`** (24 tests) — damage pipeline (plating
    absorption, Vuln/Weak/Strength/Dex), status applications (Burn,
    Vuln, AoE), end-of-turn pipeline (burn ticks, debuff decay, plating
    wipe), power cards (Metallicize, Demon Form), the Echo and Volatile
    keywords, conditional damage (combo + Weak payoffs), and ascension
    HP scaling stacks.
  - **`tests/relics.test.ts`** (22 tests) — onCombatStart hooks (Iron
    Plating, Calibration Spike, Pressure Gauge, Power Cell, Twin
    Boiler, Spike Mantle), onCardPlayed hooks (Steam Whistle,
    Pneumatic Strike, Backup Capacitor, Reactor Lens), onTurnStart
    hooks (Brass Knuckles, Boiler Vent), inline-resolved relics (Hot
    Coil single + AoE, Slag Filter routing), onTurnEnd hooks (Bristle
    Plate, Iron Heart full-Hull gating, Forge Bell turn-divisible
    trigger), and onCombatEnd hooks (Engine Oil, Battle Cap).
  - **`tests/events.test.ts`** (19 tests) — event pool integrity
    (`EVENTS_BY_ID` mirrors `ALL_EVENTS`, every event has choices,
    `pickEventId` respects the `acts` filter), and end-to-end choice
    resolutions for SALVAGED_MECH (salvage / scavenge / leave),
    STEAM_VENT (heal clamp, hull-for-scrap trade), JUNKERS_BET
    (gambling with seeded rng), CONFESSIONAL (Act 4 — status removal
    gated on scrap and deck contents), EMBER_PROPHET (Act 5 — Power /
    AoE / Legendary inscription with Hull cost).
  - **`tests/meta.test.ts`** (9 tests) — RunHistory zero-state, the
    four recorder helpers (`recordRunStart`, `recordRunWin`,
    `recordActReached`, `recordBossDefeated`), monotonic-only
    behavior for `bestAct` and `bestAscensionCleared`, schema
    migration from pre-Slice-55 saves, and a full Act-5 win scenario
    that produces a coherent ledger.
- **Vitest setup file** (`tests/setup.ts`) provides a tiny
  in-memory `localStorage` polyfill so the meta module's save/load
  round-trip works without a full DOM env. Wired via
  `vitest.config.ts`.

- **`tests/meta.test.ts`** grew by 8 — character-unlock ladder,
  fresh-save default of `['pilot']` only, `unlockCharacter`
  idempotence, a high-act run unlocking everything below it,
  `unlockRequirementFor` labels, v1 → v2 migration preserving
  history while stripping unlocks back to base, v2 round-trip
  preservation, and future-version saves falling back cleanly.

**Total test count: 82.**

### Visuals

- **22 new sprite functions** for content shipped without art:
  - 1 pilot (Conductor).
  - 3 early-act regulars (Grit Jackal, Slag Viper, Storm Husk).
  - 5 Act 4 regulars + 2 elites + 2 bosses (Brass Cathedral).
  - 5 Act 5 regulars + 2 elites + 2 bosses (World-Forge).
  - Each sprite is pure `Phaser.Graphics` primitives in the existing
    palette, with a slow idle tween. Fallbacks (`scrapRaider` / `pilot`)
    no longer kick in — every enemy now has its own silhouette.
- **Punchier damage numbers.** `floatNumber` reads the numeric value out
  of the text and scales font + stroke + travel distance for big hits
  (≥15 dmg → 42px, ≥30 dmg → 52px) and adds a brief back-out pop on
  arrival.
- **Screen shake on big enemy hits** (≥20 dmg through Hull). Matches
  the existing shake on big player hits and on enemy deaths.
- **Mech impact pop.** The player mech briefly scales up when a card
  resolves; intensity scales with card cost. Reads as recoil.

### Audio

- **Per-card flavor SFX layer.** New `playCardLayer(info)` dispatches a
  context-appropriate sound on top of the base `cardPlay` click:
  - Powers → mystical rising arpeggio.
  - AoE → wide bandpass whoosh.
  - Self-target skills → brass-shield clank.
  - Enemy attacks → light or heavy thump based on raw damage.
  - Burn-applying cards layer a sizzling cinder hiss.
  - Echo cards add a rapid double-tap echo.
- **Per-relic SFX triggers.** New `relicTriggered` TurnEvent variant
  bridges the pure `combat.ts` relic hooks to the audio layer. Relic
  hooks that meaningfully fire (Steam Whistle, Furnace Heart, Forge
  Bell, Iron Heart, Bristle Plate, Mechanic's Loop, Auto-Mortar,
  Pneumatic Strike, Backup Capacitor, Hot Coil's two combat-side
  patches) push the event; CombatScene's `playTurnEvents` consumes it
  and rings a soft brass-bell tick (`sfx.relicTrigger`).
- New atomic SFX: `attackLight`, `attackHeavy`, `defendCard`,
  `burnApply`, `aoe`, `powerCast`, `echoTrigger`, `volatileFuse`,
  `relicTrigger`, `drawCards`.

### Balance

A holistic pass tuning the whole game to the longer run length.
Runs grew from ~12 combats across 3 acts to ~37 combats across 5
acts, so the survival economy needed adjustment and the late-act
bosses needed bigger HP pools to match the player's accumulated
relics / cards.

#### Survival economy (player buffs)

- **Rest sites** heal **35%** of max Hull (was 30%). Ascension 2
  override stays at 20%.
- **Map** generates rests on ~**17%** of mid floors (was 14%).
- **Engine Oil** relic heals **5** per non-boss combat (was 4).
- **Field Medic** workshop heals **5** per non-boss combat (was 4).
- **Battle Cap** relic pays **+12 Scrap** on full-Hull wins (was +8)
  — full Hull is harder to maintain over a 37-combat run.
- **Salvager's Eye** workshop now costs **1 pt** (was 2). Random-
  relic floor should be reachable on a first run.
- **Hot Coil** relic chips for **2 damage** per Burn applied (was
  1). Burn-builds need to scale with longer fights.

#### Pilot parity

- **THE STOKER** starting Hull bumped to **58** (was 55) — matches
  the Conductor and gives the Burn archetype the buffer it needs
  for the longer climb.

#### Card adjustments

- **Coal Scoop** loses **1 Hull** per cast (was 2). The hull cost
  was too punishing to repeat-cycle across many combats.

#### Late-act boss HP (enemy buffs)

By Act 4-5 the player carries roughly twice the relics they used
to. Boss pools bumped to match:

- **The Choirmaster**: 155 → **165**
- **Iron Saint**: 150 → **160**
- **World-Forge Heart**: 180 → **195**
- **The First Engine**: 195 → **210**

### Added

#### Acts & enemies
- **Two new acts** extend the run from 3 to 5 acts. Win condition moves
  to the act-5 boss kill.
  - **Act 4 — The Brass Cathedral** (clockwork cult): 5 regular enemies
    (Brass Acolyte, Censer Sentry, Hymn Chorister, Litany Crawler, Brass
    Inquisitor), 2 elites (Cathedral Verger, Iron Hymn), 2 bosses
    (The Choirmaster, Iron Saint).
  - **Act 5 — The World-Forge** (molten finale): 5 regular enemies
    (Slag Wraith, Anvil Striker, Hammer Spirit, Forge Imp, Magma
    Lurker), 2 elites (Furnace Maw, Crucible Knight), 2 bosses
    (World-Forge Heart, The First Engine).
- **3 new regular enemies for the early acts** so the longer 15-floor
  maps don't recycle the same fights: Grit Jackal (Act 1, strips Plating),
  Slag Viper (Act 2, 3-hit Lash pressure), Storm Husk (Act 3, thorns +
  AoE wind sweep).

#### Pilots
- **THE CONDUCTOR** — fifth playable pilot. 58 Hull, starter deck
  stacked with cheap cycle cards. Signature relic **Steam Whistle**
  grants +1 Strength every 3rd card played each turn — the longer the
  fight runs, the harder the swing.

#### Cards
- **16 new buyable cards**, all with `+` upgrades, all in the shop /
  reward pool:
  - **Conductor momentum pack**: Pressure Drum, Tempo Shift, Crescendo,
    Counterpoint.
  - **General expansion pack**: Field Repair, Steel Will, Quickfire,
    Hardpoint, Suppressor, Pneumatic Slam, Coal Scoop, Iron Fist, Twin
    Hammers, Tempest, Iron Maelstrom, Final Hammer.
- **4 new keyword cards** seeding the new keywords:
  - Smoldering Round (Volatile 6).
  - Thermite Charge (Volatile 8 + Burn).
  - Echo Strike (Echo).
  - Resonant Shield (Echo).
- **3 new effect kinds** in the combat resolver:
  - `bonusDamageIfCardsAtLeast` — extra damage when you've already
    played N cards this turn (powers Crescendo / Counterpoint).
  - `bonusDamageIfEnemyWeak` — extra damage when the target is Weak
    (powers Pneumatic Slam).
  - Volatile and Echo handling baked into the play / end-of-turn
    pipelines directly.

#### Keywords
- **Echo** — When a card is played, its effects list resolves twice.
  Counts as ONE card played, so Echo Strike doesn't double-trigger
  cardsPlayedThisTurn counters like Steam Whistle / Mechanic's Loop.
- **Volatile X** — If the card is still in hand at end of turn, it
  deals X damage to a random alive enemy (through the regular damage
  pipeline, so Strength / Vuln / Weak / Thorns all apply) and exhausts.

#### Relics
- **22 new relics**, bringing the total from 25 to 47:
  - **Conductor signature**: Steam Whistle.
  - **Act 4 boss signatures**: Resonance Coil (Choirmaster), Saint's
    Halo (Iron Saint).
  - **Act 5 boss signatures**: Forge Core (World-Forge Heart), Engine
    Shard (First Engine).
  - **General expansion**: Hot Coil (Burn-apply chip damage), Reactor
    Lens (Powers cost 1 less Steam), Salvage Wreath (+3 Scrap per
    non-boss win), Mechanic's Loop (heal 1 every 3rd card per turn),
    Forge Bell (every 4th turn → +1 Strength), Slag Filter (enemy-added
    status cards exhaust instead of pollute discard), Twin Boiler (+1
    Steam at combat start), Iron Heart (full-Hull turn end → +5 Plating).

#### Potions
- **4 new potions**: Cinder Potion (AoE Burn 8), Spike Potion (5
  Thorns), Bracer Potion (2 Dexterity), Surge Potion (3 Steam + draw 2
  — first rare-tier potion).

#### Events
- **12 new act-themed events** for the late game:
  - **Act 4 (Brass Cathedral)**: Brass Confessional (scrap → remove a
    curse), Offering Brazier (burn a card → random Power), Tempered
    Hymn (upgrade random card or +5 max Hull), Vestigial Bell (-Hull
    → rare card or +1 max Steam), Pilgrims' March (-Hull → 2 cards or
    +50 scrap), Clockwork Acolyte (sells Powers).
  - **Act 5 (World-Forge)**: Molten Vein (-Hull → upgrade card),
    Ancient Anvil (free card upgrade or +80 scrap), Crucible Test
    (-Hull → random Relic), Ember Prophet (random Power / AoE /
    Legendary), Forge Engine (-Hull → Power Cell relic guaranteed),
    World-Shard (full heal coin flip or legendary inscription).
- `EventDef` gained optional `acts?: number[]` field so events can
  target specific acts; untagged events stay act-agnostic.

#### Workshop (meta progression)
- **6 new upgrades**, total 14:
  - Field Medic (heal 4 Hull after every non-boss win).
  - Quartermaster (15% shop discount).
  - Sharpened Edge (start with one Auto-Cannon already upgraded).
  - Heavy Toolkit (Hydraulic Punch in starter deck).
  - Heavy Mantle (start each combat with 3 Thorns).
  - Brass Grip (start each run with Brass Knuckles installed).
- Max meta-point spend climbs from 18 → 28.

#### Ascension ladder
- **Two new tiers** (now 7 total):
  - A6 *Compounded Wear* — additional -5 max Hull at run start (-10
    total with A5).
  - A7 *Persistent Foes* — universal +10% Hull / +10% damage on every
    enemy, stacked on top of the existing kind-specific multipliers.

### Changed

- **Map size**: 7 floors → 15. Path count 6 → 7. Each run now walks
  through roughly 40 nodes per act instead of 20.
- **MapScene**: nodes / edges live inside a translatable container so
  the map can be taller than the viewport. Mouse-wheel and drag both
  pan vertically. Auto-centers on the player's current floor on entry.
  Node clicks fire on `pointerup` with a 6-pixel drag threshold so a
  real click still navigates but a drag scrolls instead.
- **Workshop UI** flipped to a 2-column layout to fit 14 upgrades.
  Panel width 880 → 560, descriptions wrap at 340 px.
- **InterAct flavor text** is now act-aware (1→2 through 4→5) instead
  of the hardcoded "Foundry yawns open" line.
- **MapScene victory message** moved from "The Sovereign is undone" to
  "The First Engine falls silent. The World-Forge cools."
- **Boss-signature relic registry** extended to cover the four new
  bosses through the same `BOSS_SIGNATURE_RELICS` map.

### Fixed

- **Relic tooltip on the map** no longer spills out the bottom border.
  Panel height is now measured from the wrapped text instead of being
  fixed at 50 px.

---

## Project totals (after this changeset)

| Category | Count |
|---|---:|
| Acts | 5 |
| Pilots | 5 |
| Bosses | 13 (3 / 3 / 3 / 2 / 2 per act) |
| Regular enemies | 24 |
| Elite enemies | 10 |
| Cards (base) | ~77 |
| Card keywords | 9 (exhaust, retain, ethereal, innate, AoE, X-cost, unplayable, echo, volatile) |
| Events | 42 (30 act-agnostic + 12 act-themed) |
| Relics | 47 (33 normal + 13 boss-signature + 1 character-signature) |
| Potions | 12 |
| Workshop upgrades | 14 (28-point cap) |
| Ascension tiers | 7 |
| Map nodes per act | ~40 |

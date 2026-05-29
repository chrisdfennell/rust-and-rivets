# Changelog

All notable changes to **Rust & Rivets**. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## Unreleased

### Tests

- **Vitest** added as a dev dependency. `npm test` runs the suite once;
  `npm run test:watch` runs in watch mode.
- **24 combat tests** in `tests/combat.test.ts` covering the damage
  pipeline (plating absorption, Vuln/Weak/Strength/Dex), status
  applications (Burn, Vuln, AoE), end-of-turn pipeline (burn ticks,
  debuff decay, plating wipe), power cards (Metallicize, Demon Form),
  the Echo and Volatile keywords, conditional damage (combo + Weak
  payoffs), and ascension HP scaling stacks.

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

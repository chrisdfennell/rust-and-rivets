# Changelog

All notable changes to **Rust & Rivets**. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## Unreleased

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

<div align="center">

<br>

# RUST &nbsp;&amp;&nbsp; RIVETS

### *A dieselpunk roguelike deckbuilder*

**Pilot a salvaged mech through five acts of rusting wasteland.**
**Forge a deck. Stoke the furnace. Walk into the World-Forge.**

<br>

[![PLAY IN BROWSER](https://img.shields.io/badge/▶%20%20PLAY%20IN%20BROWSER%20%20◀-c44a2a?style=for-the-badge&labelColor=14110f)](https://chrisdfennell.github.io/rust-and-rivets/)

<br>

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=14110f)
![Phaser 3](https://img.shields.io/badge/Phaser-3.80-b88a3e?style=for-the-badge&logo=phaser&logoColor=white&labelColor=14110f)
![Vite](https://img.shields.io/badge/Vite-5.2-6b9b4f?style=for-the-badge&logo=vite&logoColor=white&labelColor=14110f)

<br>

![Version](https://img.shields.io/badge/version-v0.1.0_·_slice_53-b88a3e?style=flat-square&labelColor=14110f)
&nbsp;
![Bosses](https://img.shields.io/badge/bosses-13_across_5_acts-c44a2a?style=flat-square&labelColor=14110f)
&nbsp;
![Pilots](https://img.shields.io/badge/pilots-5-4f7a9b?style=flat-square&labelColor=14110f)
&nbsp;
![Cards](https://img.shields.io/badge/cards-~77_+_upgrades-6b9b4f?style=flat-square&labelColor=14110f)
&nbsp;
![Events](https://img.shields.io/badge/events-42-d9ae4a?style=flat-square&labelColor=14110f)

<br>

</div>

---

## The Pitch

**Rust &amp; Rivets** is a single-player roguelike deckbuilder in the
lineage of *Slay the Spire* — reimagined with grease, soot, and brass.
Pick a pilot, board a battered war-mech, and chart your own route
through a procedurally-stitched map of combats, shops, rests, events,
and bosses. Beat the act-5 boss to win the run; die anywhere along
the way and the wasteland keeps your scrap.

There are **no asset files** for art or audio — every sprite is drawn
in code with `Phaser.Graphics`, and the soundtrack is generated live
by the Web Audio API. The whole thing fits in a folder and runs in
any modern browser.

> [!TIP]
> **Try it now →** [**chrisdfennell.github.io/rust-and-rivets**](https://chrisdfennell.github.io/rust-and-rivets/)
> &nbsp;·&nbsp; No install, no signup, save persists in `localStorage`.

---

## Features at a Glance

<table>
<tr>
<td valign="top" width="50%">

### Run Structure

- **5 acts** &nbsp;·&nbsp; **~40 nodes** each (scroll the map)
- **13 bosses** total — 3 / 3 / 3 / 2 / 2 per act
- **10 elites** &nbsp;·&nbsp; **24 regulars** across all acts
- **42 narrative events**, 12 act-themed for the late game
- **InterAct boons** between acts:

  ![Repair](https://img.shields.io/badge/REPAIR-8a3b1f?style=flat-square)
  ![Refit](https://img.shields.io/badge/REFIT-4a4640?style=flat-square)
  ![Salvage](https://img.shields.io/badge/SALVAGE-b88a3e?style=flat-square)

- **7 Ascension tiers** for replay difficulty

</td>
<td valign="top" width="50%">

### Deck &amp; Cards

- **~77 base** cards, each with a `+` upgrade
- **5 rarities**, border-tinted on every card:

  ![Common](https://img.shields.io/badge/COMMON-b88a3e?style=flat-square)
  ![Uncommon](https://img.shields.io/badge/UNCOMMON-6b9b4f?style=flat-square)
  ![Rare](https://img.shields.io/badge/RARE-4f7a9b?style=flat-square)
  ![Epic](https://img.shields.io/badge/EPIC-9b4fa6?style=flat-square)
  ![Legendary](https://img.shields.io/badge/LEGENDARY-d97a2a?style=flat-square)

- Keywords: *exhaust · retain · ethereal · innate · AoE · X-cost · **echo** · **volatile***
- **Status / curse cards** injected by enemies and events
- **4 powers**: Demon Form, Barricade, Metallicize, Combust

</td>
</tr>
<tr>
<td valign="top" width="50%">

### Mechs &amp; Meta

- **47 relics** with rich lifecycle hooks
  <br><sub>`onCombatStart` · `onTurnEnd` · `onCardPlayed` ...</sub>
  <br><sub>13 are boss-signature drops — beat that boss, own the trophy.</sub>
- **12 potions** in a 3-slot belt (expandable)
- **Workshop meta-progression** — 14 upgrades, 28-point cap
- **Pilot ladder** — unlock Engineer / Saboteur / Stoker by beating
  acts 1–3; clear a full run for the Conductor
- **Run history** &amp; **Library** — lifetime stats panel on the title,
  plus a browsable encyclopedia of every card &amp; relic
- **Save / load** to `localStorage` after every mutation
- **Export / Import** as `.json` file (drag-and-drop)

</td>
<td valign="top" width="50%">

### Pure-Code Aesthetics

- **All sprites drawn in code** — no PNGs, no atlas
- **Procedural Web Audio** ambient + SFX, per-card &amp; per-relic
  flavor layers — no asset files
- **Drag-to-target** combat &nbsp;·&nbsp; **aim mode** for potions
- **Animated idle tweens** on every enemy
- Stack: **Phaser 3** &nbsp;·&nbsp; **TypeScript 5** &nbsp;·&nbsp; **Vite**
  &nbsp;·&nbsp; **Vitest** (82 tests)

</td>
</tr>
<tr>
<td valign="top" width="50%">

### Plays Anywhere

- **Responsive scenes** — portrait &amp; landscape, phone to 4K
- **Installable as a PWA** — Add to Home Screen on iOS, install
  card on Chrome / Edge
- **Touch-first inputs** — 44 px tap targets, tap-to-pin tooltips,
  pinch / pull-to-refresh suppressed inside the game
- **Offline-capable** — service worker caches the app shell after
  first load

</td>
<td valign="top" width="50%">

### Built to Stay Honest

- **82 Vitest unit tests** across combat, relics, events, meta —
  every PR runs them
- **Schema-migrated saves** — old `localStorage` blobs upgrade
  forward; bad / future versions fall back to a clean slate
- **CHANGELOG.md** records the unreleased polish between sliced
  releases; **DEVLOG.md** walks the slice-by-slice history
- **Pure procedural art** keeps the cost of a new enemy at one
  `MechSprite` function and one `enemies.ts` entry

</td>
</tr>
</table>

---

## Status Keywords

The same palette the game uses (`src/ui/theme.ts`) carries straight
into the cards, intents, and effect chips. **If you see a color, it
means something.**

| Status | What it does |
|---|---|
| ![Vulnerable](https://img.shields.io/badge/VULNERABLE-c44a2a?style=for-the-badge&labelColor=14110f) | Takes **+50%** damage while stacked |
| ![Weak](https://img.shields.io/badge/WEAK-6b9b4f?style=for-the-badge&labelColor=14110f) | Deals **−25%** damage while stacked |
| ![Burn](https://img.shields.io/badge/BURN-ff6b1f?style=for-the-badge&labelColor=14110f) | End-of-turn hull tick |
| ![Thorns](https://img.shields.io/badge/THORNS-d9c9a3?style=for-the-badge&labelColor=14110f) | Retaliates on every hit taken |
| ![Plating](https://img.shields.io/badge/PLATING-4f7a9b?style=for-the-badge&labelColor=14110f) | Shield, wipes at end of turn |
| ![Strength](https://img.shields.io/badge/STRENGTH-8a3b1f?style=for-the-badge&labelColor=14110f) | **+1 damage** per stack |
| ![Dexterity](https://img.shields.io/badge/DEXTERITY-d9ae4a?style=for-the-badge&labelColor=14110f) | **+1 plating** per skill played |

---

## The Pilots

Only the Pilot is available on a fresh save. The rest are earned
through play — beat an act and the next rung opens up.

| Pilot | Hull | Signature Relic | Unlock | Identity |
|---|---|---|---|---|
| **THE PILOT** | ![65](https://img.shields.io/badge/65_HP-c44a2a?style=flat-square&labelColor=14110f) | *none — clean slate* | ![Start](https://img.shields.io/badge/start-6b9b4f?style=flat-square&labelColor=14110f) | Balanced operator. The standard rig — no surprises, no flaws. |
| **THE ENGINEER** | ![60](https://img.shields.io/badge/60_HP-c44a2a?style=flat-square&labelColor=14110f) | ![Iron Plating](https://img.shields.io/badge/Iron_Plating-4f7a9b?style=flat-square&labelColor=14110f) | ![Act 1](https://img.shields.io/badge/beat_act_1-8a3b1f?style=flat-square&labelColor=14110f) | Layered armor, careful hands. Trades raw hull for plating. |
| **THE SABOTEUR** | ![55](https://img.shields.io/badge/55_HP-c44a2a?style=flat-square&labelColor=14110f) | ![Calibration Spike](https://img.shields.io/badge/Calibration_Spike-6b9b4f?style=flat-square&labelColor=14110f) | ![Act 2](https://img.shields.io/badge/beat_act_2-c44a2a?style=flat-square&labelColor=14110f) | Toxic. Fragile. Sharp. Begin every fight with the enemy already compromised. |
| **THE STOKER** | ![55](https://img.shields.io/badge/55_HP-c44a2a?style=flat-square&labelColor=14110f) | ![Furnace Heart](https://img.shields.io/badge/Furnace_Heart-ff6b1f?style=flat-square&labelColor=14110f) | ![Act 3](https://img.shields.io/badge/beat_act_3-4f7a9b?style=flat-square&labelColor=14110f) | Set them alight. Reap the smoke. Burning enemies ramp Strength every turn. |
| **THE CONDUCTOR** | ![58](https://img.shields.io/badge/58_HP-c44a2a?style=flat-square&labelColor=14110f) | ![Steam Whistle](https://img.shields.io/badge/Steam_Whistle-d9ae4a?style=flat-square&labelColor=14110f) | ![Win](https://img.shields.io/badge/win_a_run-d97a2a?style=flat-square&labelColor=14110f) | Keep the beat. Every 3rd card played each turn pays a Strength dividend. |

---

## The Run

Each act ends with a boss chosen from a pool of three — you don't
know which until you arrive. Decks that auto-pilot through one boss
get punished by another.

```mermaid
%%{init: {'theme':'base','themeVariables':{
  'primaryColor':'#1f1a16',
  'primaryTextColor':'#d9c9a3',
  'primaryBorderColor':'#b88a3e',
  'lineColor':'#8a7d5e',
  'tertiaryColor':'#14110f',
  'background':'#14110f',
  'fontFamily':'ui-monospace, Courier New, monospace'
}}}%%
flowchart LR
    Start([START<br/>pick a pilot]):::start --> A1
    A1[ACT 1<br/><b>Road to the Foundry</b><br/>7 mooks · 2 elites]:::act1 --> A1B{Boss}:::pick
    A1B -.-> B1A[Foundry Tyrant<br/><i>steady pressure</i>]:::boss1
    A1B -.-> B1B[Salvage Colossus<br/><i>Strength snowball</i>]:::boss1
    A1B -.-> B1C[Reclaimer Prime<br/><i>Thorns retaliator</i>]:::boss1
    B1A --> A2
    B1B --> A2
    B1C --> A2
    A2[ACT 2<br/><b>The Foundry Depths</b><br/>6 mooks · 2 elites]:::act2 --> A2B{Boss}:::pick
    A2B -.-> B2A[Iron Sovereign<br/><i>charged volley</i>]:::boss2
    A2B -.-> B2B[Pyroclast Engine<br/><i>Burn pressure</i>]:::boss2
    A2B -.-> B2C[Vault Warden<br/><i>Slag pollution</i>]:::boss2
    B2A --> A3
    B2B --> A3
    B2C --> A3
    A3[ACT 3<br/><b>Above the Cloudline</b><br/>6 mooks · 2 elites]:::act3 --> A3B{Boss}:::pick
    A3B -.-> B3A[Stormheart<br/><i>lightning fortress</i>]:::boss3
    A3B -.-> B3B[The Wraith<br/><i>debuff + drain</i>]:::boss3
    A3B -.-> B3C[Cyclone King<br/><i>alternating stance</i>]:::boss3
    B3A --> A4
    B3B --> A4
    B3C --> A4
    A4[ACT 4<br/><b>The Brass Cathedral</b><br/>5 mooks · 2 elites]:::act4 --> A4B{Boss}:::pick
    A4B -.-> B4A[The Choirmaster<br/><i>resonance crescendo</i>]:::boss4
    A4B -.-> B4B[Iron Saint<br/><i>Strength ramp</i>]:::boss4
    B4A --> A5
    B4B --> A5
    A5[ACT 5<br/><b>The World-Forge</b><br/>5 mooks · 2 elites]:::act5 --> A5B{Boss}:::pick
    A5B -.-> B5A[World-Forge Heart<br/><i>Plating + Burn climb</i>]:::boss5
    A5B -.-> B5B[The First Engine<br/><i>charge → vent → smash</i>]:::boss5
    B5A --> Win
    B5B --> Win([VICTORY]):::win

    classDef start fill:#1f1a16,stroke:#b88a3e,stroke-width:2px,color:#d9c9a3
    classDef act1  fill:#8a3b1f,stroke:#b88a3e,stroke-width:2px,color:#fff
    classDef act2  fill:#c44a2a,stroke:#b88a3e,stroke-width:2px,color:#fff
    classDef act3  fill:#4f7a9b,stroke:#b88a3e,stroke-width:2px,color:#fff
    classDef act4  fill:#9b4fa6,stroke:#b88a3e,stroke-width:2px,color:#fff
    classDef act5  fill:#d97a2a,stroke:#b88a3e,stroke-width:2px,color:#fff
    classDef pick  fill:#2a2724,stroke:#d9ae4a,stroke-width:2px,color:#d9ae4a
    classDef boss1 fill:#2a2724,stroke:#8a3b1f,color:#d9c9a3
    classDef boss2 fill:#2a2724,stroke:#c44a2a,color:#d9c9a3
    classDef boss3 fill:#2a2724,stroke:#4f7a9b,color:#d9c9a3
    classDef boss4 fill:#2a2724,stroke:#9b4fa6,color:#d9c9a3
    classDef boss5 fill:#2a2724,stroke:#d97a2a,color:#d9c9a3
    classDef win   fill:#6b9b4f,stroke:#d9c9a3,stroke-width:2px,color:#14110f
```

---

## Getting Started

> [!NOTE]
> Requires **Node 18+**. No native deps, no headless browser.
> `npm run build` is the gate; `npm test` runs the 82-test Vitest
> suite that locks down the combat / relic / event / meta logic.

```bash
# Clone
git clone https://github.com/chrisdfennell/rust-and-rivets.git
cd rust-and-rivets

# Install (Phaser 3, TypeScript, Vite, Vitest — that's it)
npm install

# Dev server — hot reload at http://localhost:5173
npm run dev

# Production build (type-checks first, then bundles to dist/)
npm run build

# Unit tests (runs once; use test:watch for re-run on save)
npm test

# Preview the prod build locally
npm run preview
```

---

## Project Layout

```text
src/
├── audio/         Procedural Web Audio — ambient music, per-card / per-relic
│                  SFX layers, mute persistence
├── game/          Pure game logic, no Phaser imports
│   ├── cards.ts        ~73 base cards + `+` variants (~142 total)
│   ├── characters.ts   5 pilots, signature relics, starter decks
│   ├── enemies.ts      24 regulars + 10 elites + 13 bosses + encounter pickers
│   ├── relics.ts       47 relics with lifecycle hooks (incl. 13 boss-signatures)
│   ├── potions.ts      12 potions
│   ├── events.ts       42 narrative events (12 act-themed)
│   ├── combat.ts       Turn loop, damage pipeline, statuses, keywords
│   ├── map.ts          Procedural node graph — 15 floors, ~20 nodes per act
│   ├── meta.ts         Workshop, Ascension (7 tiers), pilot unlocks, run history
│   ├── save.ts         localStorage + JSON file export + drag-drop import
│   ├── run.ts          RunState lifecycle (startRun, completeCombat, advanceAct)
│   └── types.ts        EnemyDef, CardDef, ResolveCtx, ...
├── scenes/        Phaser Scenes — Title, CharacterSelect, Map, Combat,
│                  Event, Shop, Rest, Reward, Workshop, Library, InterAct,
│                  RunSummary
├── ui/            CardView, IntentBubble, MechSprite, PotionIcon, sceneFit
│                  (all sprites + procedural potion vector icons live here)
├── types/         Vite env shim
└── main.ts        Phaser bootstrap + service-worker registration

tests/             Vitest suite — 82 tests across combat / relics / events / meta
public/            PWA manifest, service worker, app icon
```

The split between `src/game/` (pure logic) and `src/scenes/` + `src/ui/`
(Phaser presentation) is the project's central discipline. The game
logic is testable in isolation — and now actually is, via Vitest —
while the rendering layer stays throwaway.

---

## Design Philosophy

> [!IMPORTANT]
> *"Every enemy intent should be readable in under a second. Every card
> decision should feel like it has a wrong answer."*

A few load-bearing rules:

- ![Readability](https://img.shields.io/badge/READABILITY-b88a3e?style=flat-square&labelColor=14110f)
  &nbsp; **Intents show real damage.** The number under an enemy's
  icon is the damage you'll actually take this turn — post-Strength,
  post-Vulnerable, post-Weak. No mental math, no surprises.

- ![Variety](https://img.shields.io/badge/VARIETY-4f7a9b?style=flat-square&labelColor=14110f)
  &nbsp; **Bosses pick from a pool.** Each act has 3 bosses; you don't
  know which until you arrive. Decks that auto-pilot through one boss
  get punished by another.

- ![Craftsmanship](https://img.shields.io/badge/CRAFTSMANSHIP-8a3b1f?style=flat-square&labelColor=14110f)
  &nbsp; **Pure procedural art.** No PNGs, no audio files. The cost of
  a new enemy is one function in `MechSprite.ts` and one entry in
  `enemies.ts`.

- ![Reliability](https://img.shields.io/badge/RELIABILITY-6b9b4f?style=flat-square&labelColor=14110f)
  &nbsp; **Save constantly.** Every game-state mutation persists to
  `localStorage`. Refresh mid-fight, resume mid-fight. A bug should
  never cost a run. Schema migrations upgrade old saves forward;
  unreadable / future versions fall back cleanly.

- ![Accessibility](https://img.shields.io/badge/ACCESSIBILITY-d9ae4a?style=flat-square&labelColor=14110f)
  &nbsp; **Plays on a phone.** Responsive layouts, 44 px tap
  targets, tap-to-pin tooltips, drag-to-target combat tuned for
  fingertips. Installable as a PWA so the home-screen icon launches
  fullscreen with no browser chrome.

The full slice-by-slice development history lives in
**[DEVLOG.md](DEVLOG.md)**; the unreleased polish between slices is
recorded in **[CHANGELOG.md](CHANGELOG.md)**.

---

## Status

![Version](https://img.shields.io/badge/version-v0.1.0-b88a3e?style=for-the-badge&labelColor=14110f)
![Slice](https://img.shields.io/badge/latest_slice-53-c44a2a?style=for-the-badge&labelColor=14110f)
![Tests](https://img.shields.io/badge/tests-82_passing-6b9b4f?style=for-the-badge&labelColor=14110f)
![Status](https://img.shields.io/badge/status-playable_end--to--end-6b9b4f?style=for-the-badge&labelColor=14110f)

Five pilots. Thirteen bosses. Forty-two events. Forty-seven relics.
Seven ascension tiers. Plays on a phone or a 4K monitor. Balance is
tuned in public; the [DEVLOG](DEVLOG.md) records each sliced
release and the [CHANGELOG](CHANGELOG.md) captures the polish
between them.

This is a solo personal project. Issues and PRs welcome but aren't
the development driver — the project ships on its own cadence.

---

<div align="center">

[![Play](https://img.shields.io/badge/▶_Play_in_Browser-c44a2a?style=for-the-badge&labelColor=14110f)](https://chrisdfennell.github.io/rust-and-rivets/)
&nbsp;
[![Devlog](https://img.shields.io/badge/📓_Devlog-b88a3e?style=for-the-badge&labelColor=14110f)](DEVLOG.md)
&nbsp;
[![Source](https://img.shields.io/badge/⌨_Source-1f1a16?style=for-the-badge&labelColor=14110f)](https://github.com/chrisdfennell/rust-and-rivets)

<br>

<sub><i>Built with grease, soot, and brass.</i></sub>

</div>

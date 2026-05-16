<div align="center">

# RUST & RIVETS

### *A dieselpunk roguelike deckbuilder*

> Pilot a salvaged mech through three acts of rusting wasteland.
> Forge a deck. Survive the foundry. Reach the cloudline.

[![Play in Browser](https://img.shields.io/badge/PLAY-in_browser-c44a2a?style=for-the-badge&labelColor=14110f)](https://chrisdfennell.github.io/rust-and-rivets/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=14110f)](https://www.typescriptlang.org/)
[![Phaser 3](https://img.shields.io/badge/Phaser-3.80-b88a3e?style=for-the-badge&logo=phaser&logoColor=white&labelColor=14110f)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-5.2-6b9b4f?style=for-the-badge&logo=vite&logoColor=white&labelColor=14110f)](https://vitejs.dev/)

</div>

---

## The Pitch

**Rust & Rivets** is a hand-drafted, single-player roguelike deckbuilder
in the lineage of *Slay the Spire* — reimagined with grease, soot,
and brass. Every run, you pick a pilot, board a battered war-mech,
and chart your own route through a procedurally-stitched map of
combats, shops, rests, events, and bosses. Beat the act-3 boss to
win the run; die anywhere along the way and the wasteland keeps
your scrap.

There are no asset files for art or audio — every sprite is drawn in
code with `Phaser.Graphics`, and the soundtrack is generated live by
the Web Audio API. The whole thing fits in a folder and runs in any
modern browser.

---

## Features at a Glance

<table>
<tr>
<td valign="top" width="50%">

### Run Structure
- **3 acts**, ~20 nodes each
- **9 bosses** total — each act picks 1 of 3
- **6 elite enemies**, **10 regular enemies** across all acts
- **30 narrative events** with multi-choice outcomes
- **InterAct boons** between acts (Repair / Refit / Salvage)

</td>
<td valign="top" width="50%">

### Deck & Cards
- **~61 base cards**, each with an upgraded `+` variant
- **5 rarities** (common → legendary), border-tinted
- Keywords: exhaust, retain, ethereal, innate, AoE, X-cost
- **Status / curse cards** injected by enemies and events
- **4 persistent powers** (Demon Form, Barricade, Metallicize, Combust)

</td>
</tr>
<tr>
<td valign="top" width="50%">

### Mechs & Meta
- **24 relics** with rich hook surface
  (`onCombatStart` / `onTurnEnd` / `onCardPlayed` / ...)
- **8 potions** in a 3-slot belt (expandable)
- **Workshop meta-progression** — 8 upgrades, 18-point cap,
  points earned per act-boss kill
- **Save / load** to `localStorage` after every mutation;
  export / import via base64 bundle

</td>
<td valign="top" width="50%">

### Pure-Code Aesthetics
- **All sprites drawn in code** — no PNGs, no atlas
- **Procedural Web Audio** ambient + SFX,
  no asset files
- **Phaser 3** + **TypeScript** + **Vite**, ~zero runtime deps
- **Drag-to-target** combat, **dedicated aim mode** for potions
- Animated idle tweens on every enemy

</td>
</tr>
</table>

---

## The Pilots

| Pilot      | Hull | Signature Relic   | Identity                                                       |
|------------|:----:|-------------------|----------------------------------------------------------------|
| **Pilot**     | 70 | Brass Cog         | Steady all-rounder. Built for learning the game.            |
| **Engineer**  | 60 | Resonant Coil     | Plating-stacker. Survive long enough to outlast the boss.   |
| **Saboteur**  | 55 | Quickwire         | Glass-cannon. Cycle the deck and burst windows.             |
| **Stoker**    | 55 | Furnace Heart     | Burn-snowball. Strength ramps every turn enemies are alight.|

---

## The Run

```
  ACT 1 — ROAD TO THE FOUNDRY        ACT 2 — THE FOUNDRY DEPTHS         ACT 3 — ABOVE THE CLOUDLINE
  ─────────────────────────────      ──────────────────────────         ──────────────────────────────
  6 regulars  / 2 elites      ->     5 regulars / 2 elites       ->     5 regulars / 2 elites
  1 of 3 bosses:                     1 of 3 bosses:                     1 of 3 bosses:
    Foundry Tyrant                     Iron Sovereign                     Stormheart
    Salvage Colossus                   Pyroclast Engine                   The Wraith
    Reclaimer Prime                    Vault Warden                       Cyclone King
```

Each act's three bosses are mechanically distinct — players who pre-plan
for a `Strength`-stacker get blindsided by a `Thorns`-retaliator or a
deck-polluter. The act feels different every run.

---

## Getting Started

```bash
# Clone
git clone https://github.com/chrisdfennell/rust-and-rivets.git
cd rust-and-rivets

# Install (Phaser 3, TypeScript, Vite — that's it)
npm install

# Dev server — hot reload at http://localhost:5173
npm run dev

# Production build (type-checks first, then bundles to dist/)
npm run build

# Preview the prod build locally
npm run preview
```

Requires **Node 18+**. No native deps, no headless browser, no
test framework — `npm run build` is the gate. The dev server
is the only "test harness" the project needs.

---

## Project Layout

```
src/
├── audio/         Procedural Web Audio — ambient music, SFX, mute persistence
├── game/          Pure game logic, no Phaser imports
│   ├── cards.ts        ~61 cards + `+` variants
│   ├── enemies.ts      19 enemies + 9 bosses + encounter pickers
│   ├── relics.ts       24 relics with lifecycle hooks
│   ├── potions.ts      8 potions
│   ├── powers.ts       Demon Form, Barricade, Metallicize, Combust
│   ├── events.ts       30 narrative events
│   ├── combat.ts       Turn loop, damage pipeline, statuses
│   ├── map.ts          Procedural node graph
│   ├── meta.ts         Workshop / persistent upgrades
│   ├── save.ts         localStorage + base64 export
│   └── types.ts        EnemyDef, CardDef, ResolveCtx, ...
├── scenes/        Phaser Scenes — Title, CharacterSelect, Map, Combat, Event, Shop, ...
├── ui/            CardView, IntentBubble, MechSprite (all sprites drawn here)
└── main.ts        Phaser bootstrap
```

The split between `src/game/` (pure logic) and `src/scenes/` + `src/ui/`
(Phaser presentation) is the project's central discipline. The game
logic is testable in isolation; the rendering layer is throwaway.

---

## Design Philosophy

> *"Every enemy intent should be readable in under a second. Every
> card decision should feel like it has a wrong answer."*

A few load-bearing rules the project tries to keep:

- **Intents show real damage.** The number under an enemy's icon is
  the damage you'll actually take this turn — post-Strength,
  post-Vulnerable, post-Weak. No mental math, no surprises.
- **Bosses pick from a pool.** Each act has 3 bosses; you don't know
  which until you arrive. Decks that auto-pilot through one boss
  get punished by another.
- **Pure procedural art.** No PNGs, no audio files. The cost of a new
  enemy is one function in `MechSprite.ts` and one entry in
  `enemies.ts`. Onboarding a new artist is `git pull`.
- **Save constantly.** Every game-state mutation persists to
  `localStorage`. Refresh mid-fight, resume mid-fight. A bug should
  never cost a run.

The full development history — slice by slice, why each decision was
made — lives in [DEVLOG.md](DEVLOG.md).

---

## Status

**v0.1.0 — Slice 46.** Playable end-to-end. Four pilots, nine bosses,
thirty events, twenty-four relics. Balance is still being tuned in
public; the [DEVLOG](DEVLOG.md) is the running record.

This is a solo personal project. Issues and PRs welcome but aren't
the development driver — the project ships on its own cadence.

---

<div align="center">

**[Play in Browser](https://chrisdfennell.github.io/rust-and-rivets/)** &nbsp;·&nbsp;
**[Devlog](DEVLOG.md)** &nbsp;·&nbsp;
**[Source on GitHub](https://github.com/chrisdfennell/rust-and-rivets)**

*Built with grease, soot, and brass.*

</div>

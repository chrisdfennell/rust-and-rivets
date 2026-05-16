<!--
  GitHub strips <style> blocks on render, so the CSS below only kicks
  in inside renderers that respect it (VS Code preview, IntelliJ, most
  static-site generators). On GitHub the colored badges + Mermaid
  diagram still carry the visual punch.
-->
<style>
  /* ─── Palette pulled straight from src/ui/theme.ts ─────────────── */
  :root {
    --rr-bg:        #14110f;
    --rr-panel:     #1f1a16;
    --rr-rust:      #8a3b1f;
    --rr-brass:     #b88a3e;
    --rr-brass-dim: #6b4f23;
    --rr-steel:     #4a4640;
    --rr-steel-dk:  #2a2724;
    --rr-bone:      #d9c9a3;
    --rr-bone-dim:  #8a7d5e;
    --rr-hull:      #c44a2a;
    --rr-plating:   #4f7a9b;
    --rr-steam:     #d9ae4a;
    --rr-danger:    #c44a2a;
    --rr-shield:    #4f7a9b;
    --rr-buff:      #6b9b4f;
    --rr-burn:      #ff6b1f;
  }

  .rr-hero {
    background: linear-gradient(135deg, var(--rr-bg) 0%, var(--rr-panel) 50%, var(--rr-steel-dk) 100%);
    border: 2px solid var(--rr-brass);
    border-radius: 10px;
    padding: 36px 24px;
    margin: 16px 0 24px;
    text-align: center;
    box-shadow: 0 0 24px rgba(184, 138, 62, 0.25), inset 0 0 32px rgba(0, 0, 0, 0.6);
  }
  .rr-hero h1 {
    color: var(--rr-brass);
    letter-spacing: 0.18em;
    font-size: 3em;
    margin: 0 0 8px;
    text-shadow: 0 0 14px rgba(184, 138, 62, 0.5), 2px 2px 0 var(--rr-rust);
    border: none;
  }
  .rr-hero .rr-sub {
    color: var(--rr-bone);
    font-style: italic;
    font-size: 1.15em;
    margin: 8px 0 18px;
  }

  .rr-pitch {
    border-left: 4px solid var(--rr-brass);
    background: rgba(184, 138, 62, 0.07);
    padding: 14px 20px;
    border-radius: 0 6px 6px 0;
    margin: 16px 0;
  }

  .rr-section-rule {
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--rr-brass) 50%, transparent 100%);
    border: 0;
    margin: 36px 0 24px;
  }

  .rr-chip {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.78em;
    font-weight: 700;
    font-family: ui-monospace, "Courier New", monospace;
    margin: 2px;
    letter-spacing: 0.05em;
    border: 1px solid rgba(0, 0, 0, 0.4);
  }
  .rr-rust   { background: var(--rr-rust);    color: #fff; }
  .rr-brass  { background: var(--rr-brass);   color: var(--rr-bg); }
  .rr-steel  { background: var(--rr-steel);   color: var(--rr-bone); }
  .rr-shield { background: var(--rr-shield);  color: #fff; }
  .rr-fire   { background: var(--rr-danger);  color: #fff; }
  .rr-burn   { background: var(--rr-burn);    color: #fff; }
  .rr-buff   { background: var(--rr-buff);    color: #fff; }
  .rr-bone   { background: var(--rr-bone);    color: var(--rr-bg); }
  .rr-steam  { background: var(--rr-steam);   color: var(--rr-bg); }
  .rr-dim    { background: var(--rr-brass-dim); color: var(--rr-bone); }

  table.rr-features {
    width: 100%;
    border-collapse: separate;
    border-spacing: 8px;
    margin: 12px 0;
  }
  table.rr-features td {
    border: 1px solid var(--rr-brass-dim);
    border-radius: 6px;
    padding: 18px;
    background: linear-gradient(180deg, rgba(31, 26, 22, 0.5) 0%, rgba(20, 17, 15, 0.5) 100%);
    vertical-align: top;
    width: 50%;
  }
  table.rr-features h3 {
    color: var(--rr-brass);
    margin: 0 0 10px;
    border-bottom: 1px solid var(--rr-brass-dim);
    padding-bottom: 6px;
    letter-spacing: 0.06em;
  }

  table.rr-pilots {
    width: 100%;
    border-collapse: collapse;
  }
  table.rr-pilots th {
    background: var(--rr-steel-dk);
    color: var(--rr-brass);
    padding: 10px 14px;
    text-align: left;
    border-bottom: 2px solid var(--rr-brass);
    letter-spacing: 0.08em;
  }
  table.rr-pilots td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--rr-brass-dim);
    vertical-align: top;
  }
  table.rr-pilots tr:hover td {
    background: rgba(184, 138, 62, 0.05);
  }
  table.rr-pilots .pilot-name {
    color: var(--rr-brass);
    font-weight: 700;
    letter-spacing: 0.04em;
  }
</style>

<div class="rr-hero" align="center">

# RUST &amp; RIVETS

<p class="rr-sub"><i>A dieselpunk roguelike deckbuilder — pilot a salvaged mech through the wasteland</i></p>

[![Play in Browser](https://img.shields.io/badge/▶_PLAY-in_browser-c44a2a?style=for-the-badge&labelColor=14110f)](https://chrisdfennell.github.io/rust-and-rivets/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=14110f)](https://www.typescriptlang.org/)
[![Phaser 3](https://img.shields.io/badge/Phaser-3.80-b88a3e?style=for-the-badge&logo=phaser&logoColor=white&labelColor=14110f)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-5.2-6b9b4f?style=for-the-badge&logo=vite&logoColor=white&labelColor=14110f)](https://vitejs.dev/)

<br>

![Slice 46](https://img.shields.io/badge/version-v0.1.0_·_slice_46-b88a3e?style=flat-square&labelColor=14110f)
![Bosses](https://img.shields.io/badge/bosses-9_across_3_acts-c44a2a?style=flat-square&labelColor=14110f)
![Pilots](https://img.shields.io/badge/pilots-4-4f7a9b?style=flat-square&labelColor=14110f)
![Cards](https://img.shields.io/badge/cards-~61_+_upgrades-6b9b4f?style=flat-square&labelColor=14110f)
![Events](https://img.shields.io/badge/events-30-d9ae4a?style=flat-square&labelColor=14110f)

</div>

<hr class="rr-section-rule">

## The Pitch

<div class="rr-pitch">

**Rust &amp; Rivets** is a single-player roguelike deckbuilder in the
lineage of *Slay the Spire* — reimagined with grease, soot, and brass.
Pick a pilot, board a battered war-mech, and chart your own route
through a procedurally-stitched map of combats, shops, rests, events,
and bosses. Beat the act-3 boss to win the run; die anywhere along
the way and the wasteland keeps your scrap.

There are **no asset files** for art or audio — every sprite is drawn
in code with `Phaser.Graphics`, and the soundtrack is generated live
by the Web Audio API. The whole thing fits in a folder and runs in
any modern browser.

</div>

> [!TIP]
> **Try it now:** [**chrisdfennell.github.io/rust-and-rivets**](https://chrisdfennell.github.io/rust-and-rivets/) &nbsp;·&nbsp;
> No install, no signup, save persists in `localStorage`.

<hr class="rr-section-rule">

## Features at a Glance

<table class="rr-features">
<tr>
<td>

### Run Structure
- **3 acts** · **~20 nodes** each
- **9 bosses** total — each act picks 1 of 3
- **6 elite** · **10 regular** enemies across all acts
- **30 narrative events** with multi-choice outcomes
- **InterAct boons** between acts
  <span class="rr-chip rr-rust">Repair</span>
  <span class="rr-chip rr-steel">Refit</span>
  <span class="rr-chip rr-brass">Salvage</span>

</td>
<td>

### Deck &amp; Cards
- **~61 base** cards, each with a `+` upgrade
- **5 rarities**, border-tinted on every card:
  <span class="rr-chip rr-dim">common</span>
  <span class="rr-chip rr-buff">uncommon</span>
  <span class="rr-chip rr-shield">rare</span>
  <span class="rr-chip" style="background:#9b4fa6;color:#fff">epic</span>
  <span class="rr-chip" style="background:#d97a2a;color:#fff">legendary</span>
- Keywords: exhaust · retain · ethereal · innate · AoE · X-cost
- **Status / curse cards** injected by enemies and events
- **4 powers**: Demon Form, Barricade, Metallicize, Combust

</td>
</tr>
<tr>
<td>

### Mechs &amp; Meta
- **24 relics** with rich lifecycle hooks
  <small>(`onCombatStart` · `onTurnEnd` · `onCardPlayed` ...)</small>
- **8 potions** in a 3-slot belt (expandable)
- **Workshop meta-progression** — 8 upgrades, 18-point cap
- **Save / load** to `localStorage` after every mutation
- **Export / Import** via base64 bundle (run + meta)

</td>
<td>

### Pure-Code Aesthetics
- **All sprites drawn in code** — no PNGs, no atlas
- **Procedural Web Audio** ambient + SFX — no asset files
- **Drag-to-target** combat; **aim mode** for potions
- **Animated idle tweens** on every enemy
- Stack: **Phaser 3** · **TypeScript 5** · **Vite**

</td>
</tr>
</table>

<hr class="rr-section-rule">

## Status Keywords

The same palette the game uses (`src/ui/theme.ts`) carries straight
into the cards, intents, and chips. If you see a color, it means
something.

<p>
<span class="rr-chip rr-fire">VULNERABLE</span> takes +50% damage
<span class="rr-chip rr-buff">WEAK</span> deals −25% damage
<span class="rr-chip rr-burn">BURN</span> end-of-turn hull tick
<span class="rr-chip rr-bone">THORNS</span> retaliates on hit
<span class="rr-chip rr-shield">PLATING</span> shield, wipes turn-end
<span class="rr-chip rr-rust">STRENGTH</span> +1 damage per stack
<span class="rr-chip rr-steam">DEXTERITY</span> +1 plating per skill
</p>

<hr class="rr-section-rule">

## The Pilots

<table class="rr-pilots">
<thead>
<tr>
  <th>Pilot</th>
  <th>Hull</th>
  <th>Signature Relic</th>
  <th>Identity</th>
</tr>
</thead>
<tbody>
<tr>
  <td class="pilot-name">THE PILOT</td>
  <td><span class="rr-chip rr-fire">65 HP</span></td>
  <td><em>none — clean slate</em></td>
  <td>Balanced operator. The standard rig — no surprises, no flaws.</td>
</tr>
<tr>
  <td class="pilot-name">THE ENGINEER</td>
  <td><span class="rr-chip rr-fire">60 HP</span></td>
  <td><span class="rr-chip rr-shield">Iron Plating</span></td>
  <td>Layered armor, careful hands. Trades raw hull for plating.</td>
</tr>
<tr>
  <td class="pilot-name">THE SABOTEUR</td>
  <td><span class="rr-chip rr-fire">55 HP</span></td>
  <td><span class="rr-chip rr-buff">Calibration Spike</span></td>
  <td>Toxic. Fragile. Sharp. Begin every fight with the enemy already compromised.</td>
</tr>
<tr>
  <td class="pilot-name">THE STOKER</td>
  <td><span class="rr-chip rr-fire">55 HP</span></td>
  <td><span class="rr-chip rr-burn">Furnace Heart</span></td>
  <td>Set them alight. Reap the smoke. Burning enemies ramp Strength every turn.</td>
</tr>
</tbody>
</table>

<hr class="rr-section-rule">

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
    A1[ACT 1<br/><b>Road to the Foundry</b><br/>6 mooks · 2 elites]:::act1 --> A1B{Boss}:::pick
    A1B -.-> B1A[Foundry Tyrant<br/><i>steady pressure</i>]:::boss1
    A1B -.-> B1B[Salvage Colossus<br/><i>Strength snowball</i>]:::boss1
    A1B -.-> B1C[Reclaimer Prime<br/><i>Thorns retaliator</i>]:::boss1
    B1A --> A2
    B1B --> A2
    B1C --> A2
    A2[ACT 2<br/><b>The Foundry Depths</b><br/>5 mooks · 2 elites]:::act2 --> A2B{Boss}:::pick
    A2B -.-> B2A[Iron Sovereign<br/><i>charged volley</i>]:::boss2
    A2B -.-> B2B[Pyroclast Engine<br/><i>Burn pressure</i>]:::boss2
    A2B -.-> B2C[Vault Warden<br/><i>Slag pollution</i>]:::boss2
    B2A --> A3
    B2B --> A3
    B2C --> A3
    A3[ACT 3<br/><b>Above the Cloudline</b><br/>5 mooks · 2 elites]:::act3 --> A3B{Boss}:::pick
    A3B -.-> B3A[Stormheart<br/><i>lightning fortress</i>]:::boss3
    A3B -.-> B3B[The Wraith<br/><i>debuff + drain</i>]:::boss3
    A3B -.-> B3C[Cyclone King<br/><i>alternating stance</i>]:::boss3
    B3A --> Win
    B3B --> Win
    B3C --> Win([VICTORY]):::win

    classDef start fill:#1f1a16,stroke:#b88a3e,stroke-width:2px,color:#d9c9a3
    classDef act1  fill:#8a3b1f,stroke:#b88a3e,stroke-width:2px,color:#fff
    classDef act2  fill:#c44a2a,stroke:#b88a3e,stroke-width:2px,color:#fff
    classDef act3  fill:#4f7a9b,stroke:#b88a3e,stroke-width:2px,color:#fff
    classDef pick  fill:#2a2724,stroke:#d9ae4a,stroke-width:2px,color:#d9ae4a
    classDef boss1 fill:#2a2724,stroke:#8a3b1f,color:#d9c9a3
    classDef boss2 fill:#2a2724,stroke:#c44a2a,color:#d9c9a3
    classDef boss3 fill:#2a2724,stroke:#4f7a9b,color:#d9c9a3
    classDef win   fill:#6b9b4f,stroke:#d9c9a3,stroke-width:2px,color:#14110f
```

<hr class="rr-section-rule">

## Getting Started

> [!NOTE]
> Requires **Node 18+**. No native deps, no headless browser, no
> test framework — `npm run build` is the gate.

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

<hr class="rr-section-rule">

## Project Layout

```text
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
├── scenes/        Phaser Scenes — Title, CharacterSelect, Map, Combat, ...
├── ui/            CardView, IntentBubble, MechSprite (all sprites here)
└── main.ts        Phaser bootstrap
```

The split between `src/game/` (pure logic) and `src/scenes/` + `src/ui/`
(Phaser presentation) is the project's central discipline. The game
logic is testable in isolation; the rendering layer is throwaway.

<hr class="rr-section-rule">

## Design Philosophy

> [!IMPORTANT]
> *"Every enemy intent should be readable in under a second. Every
> card decision should feel like it has a wrong answer."*

A few load-bearing rules:

- <span class="rr-chip rr-brass">READABILITY</span>
  **Intents show real damage.** The number under an enemy's icon is
  the damage you'll actually take this turn — post-Strength,
  post-Vulnerable, post-Weak. No mental math, no surprises.

- <span class="rr-chip rr-shield">VARIETY</span>
  **Bosses pick from a pool.** Each act has 3 bosses; you don't know
  which until you arrive. Decks that auto-pilot through one boss
  get punished by another.

- <span class="rr-chip rr-rust">CRAFTMANSHIP</span>
  **Pure procedural art.** No PNGs, no audio files. The cost of a
  new enemy is one function in `MechSprite.ts` and one entry in
  `enemies.ts`.

- <span class="rr-chip rr-buff">RELIABILITY</span>
  **Save constantly.** Every game-state mutation persists to
  `localStorage`. Refresh mid-fight, resume mid-fight. A bug should
  never cost a run.

The full development history — slice by slice, why each decision was
made — lives in **[DEVLOG.md](DEVLOG.md)**.

<hr class="rr-section-rule">

## Status

![Version](https://img.shields.io/badge/version-v0.1.0-b88a3e?style=flat-square&labelColor=14110f)
![Slice](https://img.shields.io/badge/latest_slice-46-c44a2a?style=flat-square&labelColor=14110f)
![Status](https://img.shields.io/badge/status-playable_end--to--end-6b9b4f?style=flat-square&labelColor=14110f)
![License](https://img.shields.io/badge/license-none_yet-8a7d5e?style=flat-square&labelColor=14110f)

Four pilots. Nine bosses. Thirty events. Twenty-four relics. Balance
is being tuned in public; the [DEVLOG](DEVLOG.md) is the running record.

This is a solo personal project. Issues and PRs welcome but aren't
the development driver — the project ships on its own cadence.

<hr class="rr-section-rule">

<div align="center">

[**▶ Play in Browser**](https://chrisdfennell.github.io/rust-and-rivets/) &nbsp;·&nbsp;
[**Devlog**](DEVLOG.md) &nbsp;·&nbsp;
[**Source on GitHub**](https://github.com/chrisdfennell/rust-and-rivets)

<br>

<sub><i>Built with grease, soot, and brass.</i></sub>

</div>

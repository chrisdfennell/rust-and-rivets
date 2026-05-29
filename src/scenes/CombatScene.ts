import Phaser from 'phaser';
import { createCombatState, endTurn, playCard, canPlay, usePotion, canUsePotion, costLabel } from '../game/combat';
import { getRun, completeCombat, failCombat, clearPotionSlot, discardPotion } from '../game/run';
import { POTIONS } from '../game/potions';
import type { CombatState, CardInstance, EnemyState, TurnEvent } from '../game/types';
import { CardView, CARD_W, CARD_H } from '../ui/CardView';
import { CHARACTER_SPRITES, ENEMY_SPRITES } from '../ui/MechSprite';
import { drawPotionIcon } from '../ui/PotionIcon';
import { setupPause } from '../ui/setupPause';
import { sfx, playCardLayer } from '../audio/sfx';
import { StatBar } from '../ui/StatBar';
import { IntentView } from '../ui/IntentView';
import { DESIGN_W, DESIGN_H, applyDesignFit, bindDesignFitResize } from '../ui/sceneFit';
import { COLORS, FONTS, hex } from '../ui/theme';

interface EnemyUI {
  sprite: Phaser.GameObjects.Container;
  bar: StatBar;
  intent: IntentView;
  nameLabel: Phaser.GameObjects.Text;
  dropZone: Phaser.GameObjects.Rectangle;
  highlight: Phaser.GameObjects.Rectangle;
  baseX: number;
  baseY: number;
}

interface DragState {
  view: CardView;
  card: CardInstance;
  pointerStartX: number;
  pointerStartY: number;
  active: boolean;
  hoveredIndex: number;
}

interface PotionSlotUI {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  // Slice 58 — vector potion icon. iconSlot is a persistent Container
  // we rebuild on every refresh: removeAll(true) wipes the previous
  // potion drawing and we add the new one via drawPotionIcon().
  iconSlot: Phaser.GameObjects.Container;
}

// Pre-endTurn snapshot of bar-relevant stats. Reuses the same shape the
// existing emitDeltas path uses (this.snapshot() returns it).
interface PrePlaybackSnapshot {
  playerHull: number;
  playerPlating: number;
  enemies: { hull: number; plating: number }[];
}

// Live "what the bars currently show" stats during playback. Starts at the
// pre-snapshot values, decrements per event so the bars match the animation.
interface DisplayedStats {
  playerHull: number;
  playerPlating: number;
  enemyHulls: number[];
  enemyPlatings: number[];
}

const DRAG_THRESHOLD = 12; // pixels of pointer movement before we treat it as a drag

export class CombatScene extends Phaser.Scene {
  private state!: CombatState;

  private mech!: Phaser.GameObjects.Container;
  private enemyUIs: EnemyUI[] = [];
  private playerBar!: StatBar;
  private steamText!: Phaser.GameObjects.Text;
  private steamLabel!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private deckText!: Phaser.GameObjects.Text;
  private discardText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private handLayer!: Phaser.GameObjects.Container;
  private cardViews: CardView[] = [];
  private overlay!: Phaser.GameObjects.Container;
  private endHandled = false;
  private endTurnBg!: Phaser.GameObjects.Rectangle;
  private endTurnTxt!: Phaser.GameObjects.Text;
  private endTurnPending = false;
  private endTurnTimer: Phaser.Time.TimerEvent | null = null;
  private drag: DragState | null = null;
  private inputBound = false;
  private debugHitAreas = false;
  private potionSlots: PotionSlotUI[] = [];
  private potionTooltip!: Phaser.GameObjects.Text;
  // Combat-local stats. Bubbled to run.stats via completeCombat/failCombat.
  private potionsUsedThisCombat = 0;
  // When set, the player has clicked an enemy-target potion and is choosing
  // which enemy to use it on. Next click on an enemy consumes it; clicking
  // anywhere else cancels.
  private aimingPotionSlot: number | null = null;
  // The pointerup that ends the slot-click that entered aim mode fires AFTER
  // our pointerdown handler. We swallow that first one so the player still
  // needs to click again to either confirm or cancel.
  private suppressNextAimUp = false;
  private potionAimBanner!: Phaser.GameObjects.Text;
  // Visual draw / discard pile anchors. Cards animate from drawPile when
  // entering the hand, and toward discardPile when leaving (either played
  // or discarded at end of turn). Same anchor is used for exhausted cards.
  private drawPile = { x: 0, y: 0 };
  private discardPile = { x: 0, y: 0 };
  // CardViews currently in their play-flourish (post-click, pre-destroy).
  // layoutHand skips these when computing the stale set so we don't double
  // up exit tweens, and they stay in cardViews so subsequent refresh calls
  // don't re-spawn them from the draw pile if the player chained two plays.
  private playingViews = new Set<CardView>();
  // True while the enemy turn is being replayed as a sequence of events.
  // Card pointerdown, End Turn, and potion clicks are all gated on this.
  private playingTurnEvents = false;

  constructor() {
    super('Combat');
  }

  create() {
    // Phaser keeps a single instance of each scene across scene.start() calls,
    // so class-field initializers don't re-run. Reset per-combat state here.
    this.endHandled = false;
    this.cardViews = [];
    this.endTurnPending = false;
    this.endTurnTimer = null;
    this.enemyUIs = [];
    this.drag = null;
    this.potionSlots = [];
    this.aimingPotionSlot = null;
    this.potionsUsedThisCombat = 0;
    this.playingViews = new Set();
    this.playingTurnEvents = false;

    setupPause(this);
    // Right-click on potion slots discards the potion; we don't want the
    // browser's context menu intercepting that click anywhere on the canvas.
    this.input.mouse?.disableContextMenu();

    const width = DESIGN_W;
    const height = DESIGN_H;
    applyDesignFit(this);
    bindDesignFitResize(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Wasteland horizon
    const horizon = this.add.graphics();
    horizon.fillStyle(0x1a1612);
    horizon.fillRect(0, 0, width, height * 0.55);
    horizon.fillStyle(0x2a2018);
    horizon.fillRect(0, height * 0.4, width, height * 0.2);
    horizon.fillStyle(COLORS.steelDark);
    horizon.fillRect(0, height * 0.55, width, height * 0.05);

    // Distant smokestacks
    horizon.fillStyle(0x2a2724);
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 180;
      const h = 40 + (i % 3) * 20;
      horizon.fillRect(x, height * 0.4 - h, 18, h);
    }

    const run = getRun();
    if (!run.pendingEnemies || run.pendingEnemies.length === 0) {
      // Safety net — if someone navigated straight to Combat without picking a node.
      this.scene.start('Map');
      return;
    }
    // Look up the current node's kind so combat init can apply ascension
    // HP scaling per category (regular / elite / boss). Default to regular
    // if the node lookup fails (shouldn't, but harmless fallback).
    const currentNode = run.currentNodeId ? run.map.nodes.get(run.currentNodeId) : undefined;
    const combatKind = currentNode?.kind === 'elite' ? 'elite' as const
      : currentNode?.kind === 'boss' ? 'boss' as const
      : 'regular' as const;
    this.state = createCombatState(
      run.pendingEnemies,
      run.player,
      run.relics,
      combatKind,
      run.ascension ?? 0
    );

    // Top HUD strip: name + HP bar for the player; enemies arrange across the right.
    const hudY = 78;

    this.playerBar = new StatBar(this, width * 0.24, hudY, 280);
    this.add.existing(this.playerBar);

    this.add
      .text(24, hudY, 'PILOT', {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    // Player sprite
    const characterId = run.player.characterId ?? 'pilot';
    const drawCharacter = CHARACTER_SPRITES[characterId] ?? CHARACTER_SPRITES.pilot;
    this.mech = drawCharacter(this, width * 0.22, height * 0.48);

    // Enemy lineup
    this.layoutEnemies();

    // Steam gauge
    this.add
      .rectangle(80, height - 130, 100, 100, COLORS.bgPanel)
      .setStrokeStyle(3, COLORS.brass)
      .setOrigin(0.5);
    this.add
      .text(80, height - 175, 'STEAM', {
        fontFamily: FONTS.display,
        fontSize: '12px',
        color: hex(COLORS.brass)
      })
      .setOrigin(0.5);
    this.steamText = this.add
      .text(80, height - 130, '3/3', {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.steamLabel = this.steamText;

    // Scrap badge (run currency)
    this.add
      .text(20, 24, `SCRAP  ${getRun().scrap}`, {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    // Turn indicator
    this.turnText = this.add.text(width / 2, 20, '', {
      fontFamily: FONTS.display,
      fontSize: '14px',
      color: hex(COLORS.boneDim)
    }).setOrigin(0.5, 0);

    // Deck/discard pile anchors. Cards animate from drawPile on draw and
    // toward discardPile on play / end-of-turn discard. Tucked into the
    // narrow band between the steam panel / end-turn button (which end at
    // height-80 / height-98) and the counter text at height-40, so they
    // never overlap the HUD above them.
    this.drawPile = { x: 70, y: height - 62 };
    this.discardPile = { x: width - 100, y: height - 62 };
    this.drawPileStack(this.drawPile.x, this.drawPile.y);
    this.drawPileStack(this.discardPile.x, this.discardPile.y);

    // Deck/discard counters
    this.deckText = this.add
      .text(40, height - 40, '', {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0.5);
    this.discardText = this.add
      .text(width - 40, height - 40, '', {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(1, 0.5);

    // Combat log
    this.logText = this.add.text(width - 20, 20, '', {
      fontFamily: FONTS.body,
      fontSize: '11px',
      color: hex(COLORS.boneDim),
      align: 'right'
    }).setOrigin(1, 0);

    // Potion belt — row of slots above the hand. Card tops sit at
    // ~height - 186; placing the belt at height - 240 leaves a ~30 px
    // gap below it so cards never overlap the slots.
    this.makePotionBelt(80, height - 240);

    // End turn button
    this.makeEndTurnButton(width - 130, height - 130);

    // Hand layer
    this.handLayer = this.add.container(0, 0);

    this.overlay = this.add.container(0, 0).setDepth(1000).setVisible(false);

    // Global pointer listeners for drag tracking (bind once per scene-create).
    if (!this.inputBound) {
      this.input.on('pointermove', this.onPointerMove, this);
      this.input.on('pointerup', this.onPointerUp, this);
      this.input.on('pointerupoutside', this.onPointerUp, this);
      this.inputBound = true;
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.off('pointermove', this.onPointerMove, this);
        this.input.off('pointerup', this.onPointerUp, this);
        this.input.off('pointerupoutside', this.onPointerUp, this);
        this.inputBound = false;
      });
    }

    // Press D to toggle the green hit-area overlay on every card (debug aid).
    this.input.keyboard?.on('keydown-D', () => this.toggleHitAreaDebug());

    this.refresh();
  }

  // ===== Enemy layout =====

  private enemyPositionFor(i: number, count: number): { x: number; y: number; scale: number } {
    const width = DESIGN_W;
    const height = DESIGN_H;
    const baseY = height * 0.5;
    if (count <= 1) return { x: width * 0.72, y: baseY, scale: 1 };
    if (count === 2) {
      const xs = [width * 0.6, width * 0.86];
      return { x: xs[i], y: baseY, scale: 0.85 };
    }
    // 3+ — squeeze across the right two-thirds
    const span = width * 0.42;
    const startX = width * 0.55;
    return { x: startX + (i * span) / (count - 1), y: baseY, scale: 0.72 };
  }

  private barWidthFor(count: number): number {
    if (count <= 1) return 280;
    if (count === 2) return 220;
    return 170;
  }

  private layoutEnemies() {
    const enemies = this.state.enemies;
    const count = enemies.length;
    const barW = this.barWidthFor(count);
    const hudY = 78;

    for (let i = 0; i < count; i++) {
      const e = enemies[i];
      const pos = this.enemyPositionFor(i, count);

      // Drop zone — a generous box around the sprite so cards can land easily.
      const zoneW = Math.max(180, 220 * pos.scale);
      const zoneH = 220 * pos.scale;
      const highlight = this.add
        .rectangle(pos.x, pos.y, zoneW, zoneH, COLORS.danger, 0.0)
        .setStrokeStyle(3, COLORS.danger, 0)
        .setOrigin(0.5);
      const dropZone = this.add.rectangle(pos.x, pos.y, zoneW, zoneH, 0xffffff, 0).setOrigin(0.5);

      const drawEnemy = ENEMY_SPRITES[e.def.id] ?? ENEMY_SPRITES.scrapRaider;
      const sprite = drawEnemy(this, pos.x, pos.y);
      sprite.setScale(pos.scale);

      // Per-enemy HUD: bar above-right, intent below bar, name above bar.
      // For multi-enemy fights, put each bar above its own sprite so the
      // association is obvious.
      const barY = count <= 1 ? hudY : pos.y - 130 * pos.scale;
      const bar = new StatBar(this, pos.x, barY, barW);
      this.add.existing(bar);

      const nameLabel = this.add
        .text(pos.x, barY - 18, e.def.name.toUpperCase(), {
          fontFamily: FONTS.display,
          fontSize: count <= 1 ? '14px' : '11px',
          color: hex(COLORS.bone),
          fontStyle: 'bold'
        })
        .setOrigin(0.5, 1);

      const intent = new IntentView(this, pos.x, barY + 36);
      this.add.existing(intent);

      this.enemyUIs.push({
        sprite,
        bar,
        intent,
        nameLabel,
        dropZone,
        highlight,
        baseX: pos.x,
        baseY: pos.y
      });
    }
  }

  // Renders a small stack-of-cards icon at (x, y) so the draw/discard
  // pile destinations are visible to the player. Three slightly offset
  // rectangles read as a stack at a glance without taking real estate.
  private drawPileStack(x: number, y: number) {
    const w = 20;
    const h = 26;
    // Two slightly-offset rects so the anchor reads as a small stack
    // without being a chunky 38px tower (which clipped the steam panel
    // border at the old y=height-80).
    for (let i = 0; i < 2; i++) {
      const ox = i * 2 - 1;
      const oy = -(i * 2 - 1);
      this.add
        .rectangle(x + ox, y + oy, w, h, COLORS.bgPanel)
        .setStrokeStyle(1, COLORS.brassDim);
    }
  }

  // ===== End-turn UI =====

  private makeEndTurnButton(x: number, y: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    this.endTurnBg = this.add.rectangle(0, 0, 170, 64, COLORS.rust).setStrokeStyle(3, COLORS.brass);
    this.endTurnTxt = this.add
      .text(0, 0, 'END TURN', {
        fontFamily: FONTS.display,
        fontSize: '17px',
        color: hex(COLORS.bone),
        fontStyle: 'bold',
        align: 'center'
      })
      .setOrigin(0.5);
    c.add([this.endTurnBg, this.endTurnTxt]);
    this.endTurnBg.setInteractive({ useHandCursor: true });
    this.endTurnBg.on('pointerover', () => {
      if (!this.endTurnPending) this.endTurnBg.setFillStyle(COLORS.danger);
    });
    this.endTurnBg.on('pointerout', () => {
      if (!this.endTurnPending) this.endTurnBg.setFillStyle(COLORS.rust);
    });
    this.endTurnBg.on('pointerdown', () => this.onEndTurn());
    return c;
  }

  // ===== Potion belt =====

  private makePotionBelt(originX: number, originY: number) {
    const slotSize = 44;
    const gap = 8;
    const potions = getRun().potions;
    for (let i = 0; i < potions.length; i++) {
      const x = originX + i * (slotSize + gap);
      const container = this.add.container(x, originY);
      const glow = this.add
        .rectangle(0, 0, slotSize + 8, slotSize + 8, COLORS.steam, 0)
        .setStrokeStyle(2, COLORS.steam, 0);
      const bg = this.add
        .rectangle(0, 0, slotSize, slotSize, COLORS.bgPanel)
        .setStrokeStyle(2, COLORS.brassDim);
      // Slice 58 — vector icon on top (drawPotionIcon paints into the
      // iconSlot container), abbreviated label below. Icon does the
      // heavy lifting; label is the textual confirmation.
      const iconSlot = this.add.container(0, -6);
      const label = this.add
        .text(0, 16, '', {
          fontFamily: FONTS.display,
          fontSize: '9px',
          color: hex(COLORS.bone),
          align: 'center',
          fontStyle: 'bold',
          wordWrap: { width: slotSize - 4 }
        })
        .setOrigin(0.5);
      container.add([glow, bg, iconSlot, label]);
      bg.setInteractive({ useHandCursor: true });
      const idx = i;
      bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) this.onPotionSlotDiscard(idx);
        else this.onPotionSlotClick(idx, pointer);
      });
      bg.on('pointerover', () => this.onPotionHover(idx, true));
      bg.on('pointerout', () => this.onPotionHover(idx, false));
      this.potionSlots.push({ container, bg, glow, label, iconSlot });
    }
    // Hover tooltip — anchored above the belt, hidden when nothing hovered.
    this.potionTooltip = this.add
      .text(originX + ((potions.length - 1) * (slotSize + gap)) / 2, originY - slotSize / 2 - 12, '', {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.bone),
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 },
        align: 'center'
      })
      .setOrigin(0.5, 1)
      .setVisible(false)
      .setDepth(900);
    // Aim banner — only visible while choosing a potion target.
    const width = DESIGN_W;
    this.potionAimBanner = this.add
      .text(width / 2, 56, 'CHOOSE A TARGET — CLICK ELSEWHERE TO CANCEL', {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.steam),
        fontStyle: 'bold',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 4 }
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(900);
    this.refreshPotionBelt();
  }

  private refreshPotionBelt() {
    const potions = getRun().potions;
    for (let i = 0; i < this.potionSlots.length; i++) {
      const ui = this.potionSlots[i];
      const id = potions[i];
      const def = id ? POTIONS[id] : null;
      // Wipe any prior icon drawing — we paint the new one fresh each
      // refresh so animations / glow tweens on the icon container don't
      // accumulate across potion swaps.
      ui.iconSlot.removeAll(true);
      if (def && id) {
        const icon = drawPotionIcon(this, id, 0, 0, 1.05);
        if (icon) ui.iconSlot.add(icon);
        const firstWord = def.name.split(' ')[0];
        ui.label.setText(firstWord.toUpperCase());
        ui.bg.setFillStyle(COLORS.steelDark);
        ui.bg.setStrokeStyle(2, COLORS.steam);
      } else {
        ui.label.setText('');
        ui.bg.setFillStyle(COLORS.bgPanel);
        ui.bg.setStrokeStyle(2, COLORS.brassDim);
      }
      // Aim glow lights up the slot being aimed.
      const aiming = this.aimingPotionSlot === i;
      ui.glow.setStrokeStyle(2, COLORS.steam, aiming ? 1 : 0);
    }
  }

  private onPotionHover(slot: number, hovered: boolean) {
    const id = getRun().potions[slot];
    if (!hovered || !id) {
      this.potionTooltip.setVisible(false);
      return;
    }
    const def = POTIONS[id];
    if (!def) return;
    this.potionTooltip.setText(`${def.name}\n${def.description}\n(right-click to discard)`);
    this.potionTooltip.setVisible(true);
  }

  private onPotionSlotDiscard(slot: number) {
    if (!getRun().potions[slot]) return;
    // If we were aiming this slot, cancel the aim first.
    if (this.aimingPotionSlot === slot) this.exitPotionAim();
    this.cancelEndTurnConfirm();
    // Flash the slot red briefly so the player sees the discard register.
    const ui = this.potionSlots[slot];
    if (ui) {
      ui.bg.setFillStyle(COLORS.danger);
      this.time.delayedCall(120, () => this.refreshPotionBelt());
    }
    discardPotion(slot);
    this.potionTooltip.setVisible(false);
  }

  private onPotionSlotClick(slot: number, _pointer: Phaser.Input.Pointer) {
    if (this.playingTurnEvents) return;
    if (!canUsePotion(this.state)) return;
    const id = getRun().potions[slot];
    if (!id) return;
    const def = POTIONS[id];
    if (!def) return;
    // Cancel any in-flight end-turn confirm when interacting with belt.
    this.cancelEndTurnConfirm();
    // If the same slot is being clicked twice, cancel aim.
    if (this.aimingPotionSlot === slot) {
      this.exitPotionAim();
      return;
    }
    if (def.target === 'enemy') {
      // Enter aim mode unless there's exactly one alive target.
      const alive = this.state.enemies
        .map((e, i) => ({ alive: e.hull > 0, i }))
        .filter((x) => x.alive);
      if (alive.length === 1) {
        this.consumePotion(slot, alive[0].i);
        return;
      }
      this.enterPotionAim(slot);
      return;
    }
    this.consumePotion(slot, undefined);
  }

  private enterPotionAim(slot: number) {
    this.aimingPotionSlot = slot;
    this.suppressNextAimUp = true;
    this.potionAimBanner.setVisible(true);
    // Highlight all alive enemies so the player sees valid drop targets.
    for (let i = 0; i < this.enemyUIs.length; i++) {
      const alive = this.state.enemies[i].hull > 0;
      const ui = this.enemyUIs[i];
      ui.highlight.setStrokeStyle(3, COLORS.steam, alive ? 1 : 0);
      ui.highlight.setFillStyle(COLORS.steam, alive ? 0.12 : 0);
    }
    this.refreshPotionBelt();
  }

  private exitPotionAim() {
    this.aimingPotionSlot = null;
    this.potionAimBanner.setVisible(false);
    for (const ui of this.enemyUIs) {
      ui.highlight.setStrokeStyle(3, COLORS.danger, 0);
      ui.highlight.setFillStyle(COLORS.danger, 0);
    }
    this.refreshPotionBelt();
  }

  private consumePotion(slot: number, targetIndex: number | undefined) {
    const id = getRun().potions[slot];
    if (!id) return;
    const def = POTIONS[id];
    if (!def) return;
    const pre = this.snapshot();
    sfx.cardPlay();
    const ok = usePotion(this.state, def, targetIndex);
    if (!ok) return;
    this.potionsUsedThisCombat += 1;
    clearPotionSlot(slot);
    this.exitPotionAim();
    this.emitDeltas(pre);
    if (def.target === 'enemy' && targetIndex !== undefined && this.enemyUIs[targetIndex]) {
      this.shake(this.enemyUIs[targetIndex].sprite, 6);
    } else if (def.target === 'allEnemies') {
      for (let i = 0; i < this.state.enemies.length; i++) {
        if (pre.enemies[i] && pre.enemies[i].hull > 0 && this.enemyUIs[i]) {
          this.shake(this.enemyUIs[i].sprite, 5);
        }
      }
    }
    this.refresh();
  }

  // ===== End-turn UI =====

  private startEndTurnConfirm() {
    this.endTurnPending = true;
    const steam = this.state.player.steam;
    this.endTurnTxt.setText(`CONFIRM?\n${steam} Steam unspent`);
    this.endTurnTxt.setColor(hex(COLORS.steelDark));
    this.endTurnBg.setFillStyle(COLORS.steam);
    if (this.endTurnTimer) this.endTurnTimer.remove();
    this.endTurnTimer = this.time.delayedCall(2000, () => this.cancelEndTurnConfirm());
  }

  private cancelEndTurnConfirm() {
    if (!this.endTurnPending) return;
    this.endTurnPending = false;
    this.endTurnTxt.setText('END TURN');
    this.endTurnTxt.setColor(hex(COLORS.bone));
    this.endTurnBg.setFillStyle(COLORS.rust);
    if (this.endTurnTimer) {
      this.endTurnTimer.remove();
      this.endTurnTimer = null;
    }
  }

  private onEndTurn() {
    if (this.state.phase !== 'playerTurn') return;
    if (this.drag) return; // ignore while dragging
    // Don't let End Turn fire while a card is mid-play flourish. Without
    // this, endTurn() can discard the still-pending card before its
    // applyCardPlay runs, swallowing the play.
    if (this.playingViews.size > 0) return;
    // Block re-entrancy: if the previous enemy turn is still being
    // animated, ignore the click.
    if (this.playingTurnEvents) return;
    const canPlayAnything = this.state.player.hand.some((c) => canPlay(this.state, c.uid));
    if (this.state.player.steam > 0 && canPlayAnything && !this.endTurnPending) {
      this.startEndTurnConfirm();
      return;
    }
    this.cancelEndTurnConfirm();
    sfx.endTurn();
    // Snapshot bar-relevant stats BEFORE endTurn so playback can drop the
    // bars per event instead of jumping to final values up front.
    const pre = this.snapshot();
    // Resolve the enemy turn synchronously into state, capturing the
    // event log. Skip the immediate refresh — that waits for the event
    // playback to finish so the enemy beat reads cleanly before the new
    // hand arrives.
    endTurn(this.state);
    const events = this.state.turnEvents.slice();
    // Sync the top-of-screen counters + log line immediately so the player
    // sees they're back on their turn (turn number / steam) even while the
    // animated playback shows what just happened.
    this.steamLabel.setText(`${this.state.player.steam}/${this.state.player.maxSteam}`);
    this.turnText.setText(`TURN ${this.state.turn}`);
    this.logText.setText(this.state.log.slice(-4).join('\n'));
    void this.playTurnEvents(pre, events).then(() => {
      // After the playback completes, refresh fully — this lays out the
      // newly-drawn hand and routes to victory/defeat if state ended there.
      if (this.state.player.hull > 0 && this.state.phase === 'playerTurn') {
        this.shake(this.mech, 4);
      }
      this.refresh();
    });
  }

  // ===== Drag + click for cards =====

  private onCardPointerDown(card: CardInstance, view: CardView, pointer: Phaser.Input.Pointer) {
    if (this.playingTurnEvents) return; // enemy turn replay in progress
    if (!canPlay(this.state, card.uid)) return;
    if (this.drag) return;
    // While aiming a potion, the global pointerup intercepts everything;
    // ignore card clicks so we don't leave a half-finished drag.
    if (this.aimingPotionSlot !== null) return;
    this.cancelEndTurnConfirm();
    this.drag = {
      view,
      card,
      pointerStartX: pointer.x,
      pointerStartY: pointer.y,
      active: false,
      hoveredIndex: -1
    };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    const d = this.drag;
    if (!d) return;
    if (!d.active) {
      const dx = pointer.x - d.pointerStartX;
      const dy = pointer.y - d.pointerStartY;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      // Threshold crossed — promote to active drag.
      d.active = true;
      d.view.beginDrag();
    }
    d.view.setDragPos(pointer.x, pointer.y);
    // Highlight drop zones based on card target:
    //   'enemy'      → only the hovered enemy glows
    //   'allEnemies' → every alive enemy glows (visual confirmation it's AoE)
    //   'self'/'none'→ no glow
    const idx = this.enemyIndexAt(pointer.x, pointer.y);
    const isEnemyCard = d.card.def.target === 'enemy';
    const isAoeCard = d.card.def.target === 'allEnemies';
    for (let i = 0; i < this.enemyUIs.length; i++) {
      const ui = this.enemyUIs[i];
      const alive = this.state.enemies[i].hull > 0;
      const on = (isEnemyCard && alive && i === idx) || (isAoeCard && alive);
      ui.highlight.setStrokeStyle(3, COLORS.danger, on ? 1 : 0);
      ui.highlight.setFillStyle(COLORS.danger, on ? 0.12 : 0);
    }
    d.hoveredIndex = idx;
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    // Potion aim mode steals all clicks until it resolves or cancels.
    if (this.aimingPotionSlot !== null) {
      if (this.suppressNextAimUp) {
        // This is the pointerup that ends the slot-click that entered aim
        // mode; let it pass through but consume the suppress flag.
        this.suppressNextAimUp = false;
        return;
      }
      const slot = this.aimingPotionSlot;
      const idx = this.enemyIndexAt(pointer.x, pointer.y);
      if (this.aliveAt(idx)) {
        this.consumePotion(slot, idx);
      } else {
        this.exitPotionAim();
      }
      return;
    }
    const d = this.drag;
    if (!d) return;
    // Clear highlights
    for (const ui of this.enemyUIs) {
      ui.highlight.setStrokeStyle(3, COLORS.danger, 0);
      ui.highlight.setFillStyle(COLORS.danger, 0);
    }

    if (!d.active) {
      // Treated as a click. For enemy-target cards we auto-target if exactly
      // one enemy is alive; otherwise the player must drag.
      this.drag = null;
      this.handleClickPlay(d.card, d.view);
      return;
    }

    // Resolve drag → play
    const card = d.card;
    const view = d.view;
    const hovered = d.hoveredIndex;
    this.drag = null;

    if (card.def.target === 'enemy') {
      const aliveIdx = this.aliveAt(hovered) ? hovered : -1;
      if (aliveIdx < 0) {
        // Dropped on no valid target — return to hand.
        void view.endDrag(true);
        this.refresh();
        return;
      }
      this.playCardWithFlourish(card, view, aliveIdx);
    } else {
      // self / none — drop anywhere plays it.
      this.playCardWithFlourish(card, view, undefined);
    }
  }

  private handleClickPlay(card: CardInstance, view: CardView) {
    if (!canPlay(this.state, card.uid)) return;
    if (card.def.target === 'enemy') {
      // Auto-target the first alive enemy. Drag is still available for
      // explicit target selection in multi-enemy fights.
      const aliveIdx = this.state.enemies.findIndex((e) => e.hull > 0);
      if (aliveIdx < 0) return;
      this.playCardWithFlourish(card, view, aliveIdx);
      return;
    }
    // self / none / allEnemies — click plays.
    this.playCardWithFlourish(card, view, undefined);
  }

  private aliveAt(idx: number): boolean {
    if (idx < 0 || idx >= this.state.enemies.length) return false;
    return this.state.enemies[idx].hull > 0;
  }

  private enemyIndexAt(x: number, y: number): number {
    for (let i = 0; i < this.enemyUIs.length; i++) {
      const ui = this.enemyUIs[i];
      const r = ui.dropZone;
      const left = r.x - r.width / 2;
      const right = r.x + r.width / 2;
      const top = r.y - r.height / 2;
      const bottom = r.y + r.height / 2;
      if (x >= left && x <= right && y >= top && y <= bottom) return i;
    }
    return -1;
  }

  // ===== Card play flourish =====

  private playCardWithFlourish(card: CardInstance, view: CardView, targetIndex: number | undefined) {
    if (!canPlay(this.state, card.uid)) {
      void view.endDrag(true);
      return;
    }
    view.setPlayable(false);
    view.disableInteractive();
    // Mark this view as mid-flourish. layoutHand uses this to skip the
    // automatic discard-out tween on the upcoming refresh, AND to avoid
    // re-spawning the card from the draw pile if a chained second play
    // refreshes the hand before this card's state mutation lands.
    this.playingViews.add(view);
    // Two-stage flourish: a brief lift+scale (satisfying "play" beat),
    // then a sweep toward the discard pile while fading out.
    this.tweens.add({
      targets: view,
      y: view.y - 40,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 140,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.tweens.add({
          targets: view,
          x: this.discardPile.x,
          y: this.discardPile.y,
          alpha: 0,
          scaleX: 0.35,
          scaleY: 0.35,
          duration: 200,
          ease: 'Cubic.In',
          onComplete: () => {
            this.playingViews.delete(view);
            view.destroy();
          }
        });
      }
    });
    // Apply the play state mutation as the first beat completes, so the rest
    // of the hand re-flows while the played card sweeps to the pile.
    this.time.delayedCall(140, () => this.applyCardPlay(card, targetIndex));
  }

  private applyCardPlay(card: CardInstance, targetIndex: number | undefined) {
    const pre = this.snapshot();
    sfx.cardPlay();
    // Slice 54 — flavor SFX layer keyed off the card's type / target /
    // effects so power cards sound mystical, AoE whooshes, Burn cards
    // sizzle, etc. Composed BEFORE playCard so the SFX queues up with
    // the base cardPlay click rather than after the effects resolve.
    const rawDamage = card.def.effects.reduce((sum, e) => {
      if (e.kind === 'damage' || e.kind === 'damageAll') return sum + e.amount;
      if (e.kind === 'damageScaledByBurn') return sum + e.base;
      return sum;
    }, 0);
    const appliesBurn = card.def.effects.some(
      (e) => e.kind === 'applyBurn' || e.kind === 'applyBurnAll'
    );
    playCardLayer({
      type: card.def.type,
      target: card.def.target,
      echo: card.def.echo,
      appliesBurn,
      rawDamage
    });
    const ok = playCard(this.state, card.uid, targetIndex);
    if (!ok) {
      this.refresh();
      return;
    }
    // Slice 54 — brief mech pop on card play. Reads as "the rig braced
    // and fired." Tiny scale punch, faster on cheap cards.
    this.mechImpact(card.def.cost);
    this.emitDeltas(pre);
    if (card.def.target === 'enemy' && targetIndex !== undefined && this.enemyUIs[targetIndex]) {
      this.shake(this.enemyUIs[targetIndex].sprite, 6);
    } else if (card.def.target === 'allEnemies') {
      for (let i = 0; i < this.state.enemies.length; i++) {
        // Use prev snapshot so we still shake an enemy that just died this play.
        if (pre.enemies[i] && pre.enemies[i].hull > 0 && this.enemyUIs[i]) {
          this.shake(this.enemyUIs[i].sprite, 5);
        }
      }
    }
    this.flashSteam();
    this.refresh();
  }

  // ===== Visual effect helpers =====

  private snapshot() {
    return {
      playerHull: this.state.player.hull,
      playerPlating: this.state.player.plating,
      enemies: this.state.enemies.map((e) => ({ hull: e.hull, plating: e.plating }))
    };
  }

  private emitDeltas(prev: ReturnType<typeof this.snapshot>) {
    const cur = this.snapshot();
    const playerPos = { x: this.mech.x, y: this.mech.y };

    // Per-enemy deltas
    for (let i = 0; i < this.state.enemies.length; i++) {
      const ui = this.enemyUIs[i];
      if (!ui) continue;
      const prevE = prev.enemies[i];
      const curE = cur.enemies[i];
      if (!prevE || !curE) continue;
      const enemyPos = { x: ui.baseX, y: ui.baseY };
      const hullLoss = prevE.hull - curE.hull;
      const platingLoss = prevE.plating - curE.plating;
      const platingGain = curE.plating - prevE.plating;
      if (hullLoss > 0) {
        this.floatNumber(enemyPos.x, enemyPos.y - 60, `-${hullLoss}`, COLORS.danger);
        this.hitRing(enemyPos.x, enemyPos.y, COLORS.danger);
        this.burst(enemyPos.x, enemyPos.y, COLORS.rust, 10);
        sfx.hit();
      }
      if (platingLoss > 0 && hullLoss <= 0) {
        this.floatNumber(enemyPos.x - 30, enemyPos.y - 40, `-${platingLoss}`, COLORS.shield);
        this.burst(enemyPos.x, enemyPos.y, COLORS.shield, 6);
        sfx.platingAbsorb();
      }
      if (platingGain > 0) {
        this.floatNumber(enemyPos.x + 30, enemyPos.y - 40, `+${platingGain}`, COLORS.shield);
      }
      if (curE.hull <= 0 && prevE.hull > 0) {
        this.burst(enemyPos.x, enemyPos.y, COLORS.rust, 24);
        this.hitRing(enemyPos.x, enemyPos.y, COLORS.danger);
        this.cameras.main.shake(220, 0.008);
      }
    }

    // Player side
    const pHullLoss = prev.playerHull - cur.playerHull;
    const pHullGain = cur.playerHull - prev.playerHull;
    const pPlatingLoss = prev.playerPlating - cur.playerPlating;
    const pPlatingGain = cur.playerPlating - prev.playerPlating;
    if (pHullLoss > 0) {
      this.floatNumber(playerPos.x, playerPos.y - 60, `-${pHullLoss}`, COLORS.danger);
      this.hitRing(playerPos.x, playerPos.y, COLORS.danger);
      this.burst(playerPos.x, playerPos.y, COLORS.rust, 10);
      if (pHullLoss >= 10) this.cameras.main.shake(180, 0.006);
      sfx.hit();
    }
    if (pHullGain > 0) {
      this.floatNumber(playerPos.x, playerPos.y - 60, `+${pHullGain}`, COLORS.ok);
      sfx.heal();
    }
    if (pPlatingLoss > 0 && pHullLoss <= 0) {
      this.floatNumber(playerPos.x - 30, playerPos.y - 40, `-${pPlatingLoss}`, COLORS.shield);
      this.burst(playerPos.x, playerPos.y, COLORS.shield, 6);
      sfx.platingAbsorb();
    }
    if (pPlatingGain > 0) {
      this.floatNumber(playerPos.x + 30, playerPos.y - 40, `+${pPlatingGain}`, COLORS.shield);
    }
  }

  private floatNumber(x: number, y: number, text: string, color: number) {
    // Slice 54 — scale font + pop-tween for big damage numbers so heavy
    // hits feel weightier than chip damage. Reads the numeric value out
    // of the leading "-" / "+" so all callers stay unchanged.
    const m = text.match(/-?\d+/);
    const n = m ? Math.abs(parseInt(m[0], 10)) : 0;
    const big = n >= 15;
    const huge = n >= 30;
    const fontSize = huge ? '52px' : big ? '42px' : '30px';
    const strokeW = huge ? 6 : big ? 5 : 4;
    const t = this.add.text(x, y, text, {
      fontFamily: FONTS.display,
      fontSize,
      color: hex(color),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: strokeW
    }).setOrigin(0.5).setDepth(900);
    if (big) {
      // Brief pop-in: scale 0.5 → 1.0 over 80 ms, then drift up + fade.
      t.setScale(0.5);
      this.tweens.add({
        targets: t,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
        ease: 'Back.Out'
      });
    }
    this.tweens.add({
      targets: t,
      y: y - (big ? 90 : 70),
      alpha: 0,
      duration: big ? 1000 : 850,
      ease: 'Cubic.Out',
      onComplete: () => t.destroy()
    });
  }

  private burst(x: number, y: number, color: number, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const speed = 70 + Math.random() * 80;
      const size = 3 + Math.random() * 3;
      const p = this.add.rectangle(x, y, size, size, color).setDepth(800);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 450 + Math.random() * 250,
        ease: 'Cubic.Out',
        onComplete: () => p.destroy()
      });
    }
  }

  private hitRing(x: number, y: number, color: number) {
    const ring = this.add.circle(x, y, 36, color, 0.18).setStrokeStyle(3, color).setDepth(800);
    this.tweens.add({
      targets: ring,
      scaleX: 2.4,
      scaleY: 2.4,
      alpha: 0,
      duration: 380,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy()
    });
  }

  // Slice 54 — brief scale pop on the player mech when a card resolves.
  // Reads as recoil. Heavier cards (cost >= 2) pop harder.
  private mechImpact(cost: number) {
    if (!this.mech) return;
    const intensity = cost >= 2 ? 1.05 : 1.025;
    this.tweens.killTweensOf(this.mech);
    this.mech.setScale(1);
    this.tweens.add({
      targets: this.mech,
      scaleX: intensity,
      scaleY: intensity,
      duration: 70,
      yoyo: true,
      ease: 'Sine.InOut'
    });
  }

  private flashSteam() {
    if (!this.steamText) return;
    const orig = this.steamText.scale;
    this.tweens.add({
      targets: this.steamText,
      scaleX: orig * 1.18,
      scaleY: orig * 1.18,
      duration: 90,
      yoyo: true,
      ease: 'Sine.Out'
    });
  }

  private shake(target: Phaser.GameObjects.Container, mag: number) {
    const ox = target.x;
    this.tweens.add({
      targets: target,
      x: ox + mag,
      duration: 40,
      yoyo: true,
      repeat: 2,
      onComplete: () => (target.x = ox)
    });
  }

  // ===== Turn-event playback =====
  //
  // After endTurn() returns, state.turnEvents holds an ordered log of
  // everything that happened during the enemy beat (enemyAct markers,
  // damage hits on the player, thorns counterhits, plating gains, status
  // applies, burn ticks, deaths). We replay them as a timed sequence so
  // the player sees each hit land instead of all damage applying in
  // one tick.
  //
  // Bars use a separate "displayed" snapshot that lags state by exactly
  // the events not yet animated. Starts at pre-endTurn values; each event
  // applies its delta and refreshes the bars. After playback completes
  // the full refresh() lands them on final state — they should already
  // match.

  private async playTurnEvents(pre: PrePlaybackSnapshot, events: TurnEvent[]): Promise<void> {
    this.playingTurnEvents = true;
    const display: DisplayedStats = {
      playerHull: pre.playerHull,
      playerPlating: pre.playerPlating,
      enemyHulls: pre.enemies.map((e) => e.hull),
      enemyPlatings: pre.enemies.map((e) => e.plating)
    };
    this.refreshBarsFromDisplay(display);
    for (const event of events) {
      // Bail if the scene shut down mid-playback (combat ended, user nav'd).
      if (!this.scene || !this.scene.systems || !this.scene.systems.isActive()) break;
      await this.renderTurnEvent(event, display);
    }
    this.playingTurnEvents = false;
  }

  private renderTurnEvent(event: TurnEvent, display: DisplayedStats): Promise<void> {
    switch (event.kind) {
      case 'enemyAct': {
        const ui = this.enemyUIs[event.enemyIdx];
        if (ui && this.state.enemies[event.enemyIdx]?.hull > 0) {
          // Brief lunge toward the player (left) and back so the player
          // sees which enemy is acting before its damage events resolve.
          this.tweens.add({
            targets: ui.sprite,
            x: ui.baseX - 18,
            duration: 110,
            yoyo: true,
            ease: 'Sine.InOut'
          });
        }
        return this.wait(180);
      }
      case 'playerDamaged': {
        const playerPos = { x: this.mech.x, y: this.mech.y };
        display.playerPlating = Math.max(0, display.playerPlating - event.absorbed);
        display.playerHull = Math.max(0, display.playerHull - event.through);
        if (event.through > 0) {
          this.floatNumber(playerPos.x, playerPos.y - 60, `-${event.through}`, COLORS.danger);
          this.hitRing(playerPos.x, playerPos.y, COLORS.danger);
          this.burst(playerPos.x, playerPos.y, COLORS.rust, 10);
          if (event.through >= 10) this.cameras.main.shake(180, 0.006);
          sfx.hit();
        } else if (event.absorbed > 0) {
          this.floatNumber(playerPos.x - 30, playerPos.y - 40, `-${event.absorbed}`, COLORS.shield);
          this.burst(playerPos.x, playerPos.y, COLORS.shield, 6);
          sfx.platingAbsorb();
        }
        this.refreshBarsFromDisplay(display);
        return this.wait(event.through > 0 ? 260 : 200);
      }
      case 'enemyDamaged': {
        const ui = this.enemyUIs[event.enemyIdx];
        display.enemyPlatings[event.enemyIdx] = Math.max(0, (display.enemyPlatings[event.enemyIdx] ?? 0) - event.absorbed);
        display.enemyHulls[event.enemyIdx] = Math.max(0, (display.enemyHulls[event.enemyIdx] ?? 0) - event.through);
        if (ui) {
          if (event.through > 0) {
            this.floatNumber(ui.baseX, ui.baseY - 60, `-${event.through}`, COLORS.danger);
            this.hitRing(ui.baseX, ui.baseY, COLORS.danger);
            this.burst(ui.baseX, ui.baseY, COLORS.rust, event.through >= 20 ? 16 : 8);
            // Slice 54 — heavy single hits shake the camera so the player
            // sees the impact. Player damage already shook at >=10; the
            // enemy threshold is 20 because player damage spikes higher.
            if (event.through >= 20) this.cameras.main.shake(160, 0.005);
            sfx.hit();
          } else if (event.absorbed > 0) {
            this.floatNumber(ui.baseX - 30, ui.baseY - 40, `-${event.absorbed}`, COLORS.shield);
            this.burst(ui.baseX, ui.baseY, COLORS.shield, 6);
            sfx.platingAbsorb();
          }
        }
        this.refreshBarsFromDisplay(display);
        return this.wait(200);
      }
      case 'enemyDied': {
        const ui = this.enemyUIs[event.enemyIdx];
        if (ui) {
          this.burst(ui.baseX, ui.baseY, COLORS.rust, 24);
          this.hitRing(ui.baseX, ui.baseY, COLORS.danger);
          this.cameras.main.shake(220, 0.008);
        }
        return this.wait(280);
      }
      case 'enemyPlating': {
        const ui = this.enemyUIs[event.enemyIdx];
        display.enemyPlatings[event.enemyIdx] = (display.enemyPlatings[event.enemyIdx] ?? 0) + event.amount;
        if (ui) {
          this.floatNumber(ui.baseX + 30, ui.baseY - 40, `+${event.amount}`, COLORS.shield);
        }
        this.refreshBarsFromDisplay(display);
        return this.wait(180);
      }
      case 'playerStatus': {
        const playerPos = { x: this.mech.x, y: this.mech.y };
        const label =
          event.status === 'vulnerable' ? `VULN +${event.amount}`
          : event.status === 'weak' ? `WEAK +${event.amount}`
          : `BURN +${event.amount}`;
        this.floatNumber(playerPos.x, playerPos.y - 80, label, COLORS.rust);
        // Status counters come from state directly (we don't bother
        // tracking them in display since they change at most once per turn).
        this.refreshBarsFromDisplay(display);
        return this.wait(180);
      }
      case 'playerBurnTick': {
        const playerPos = { x: this.mech.x, y: this.mech.y };
        display.playerHull = Math.max(0, display.playerHull - event.amount);
        this.floatNumber(playerPos.x, playerPos.y - 60, `-${event.amount}`, COLORS.danger);
        this.burst(playerPos.x, playerPos.y, COLORS.rust, 6);
        sfx.hit();
        this.refreshBarsFromDisplay(display);
        return this.wait(220);
      }
      case 'playerHealed': {
        const playerPos = { x: this.mech.x, y: this.mech.y };
        display.playerHull = Math.min(this.state.player.maxHull, display.playerHull + event.amount);
        this.floatNumber(playerPos.x, playerPos.y - 60, `+${event.amount}`, COLORS.ok);
        sfx.heal();
        this.refreshBarsFromDisplay(display);
        return this.wait(200);
      }
      case 'relicTriggered': {
        // Soft brass-bell tick layered on whatever else is happening.
        // We don't wait — the relic event flows past the existing
        // damage / status beats without blocking them.
        sfx.relicTrigger();
        return Promise.resolve();
      }
      case 'log':
        return Promise.resolve();
    }
  }

  // Promise wrapper around Phaser's delayedCall so playTurnEvents can `await`.
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // Paints the StatBars using the "displayed" snapshot — the values that
  // lag actual state by the events not yet animated. Status counters
  // (vuln/weak/burn/str/dex/thorns) come from state directly since they
  // change at most once per turn and don't drive the per-hit pacing.
  private refreshBarsFromDisplay(display: DisplayedStats) {
    const s = this.state;
    this.playerBar.update(
      display.playerHull, s.player.maxHull, display.playerPlating,
      s.player.vulnerable, s.player.weak,
      s.player.strength, s.player.dexterity, s.player.burn, s.player.thorns
    );
    for (let i = 0; i < s.enemies.length; i++) {
      const e = s.enemies[i];
      const ui = this.enemyUIs[i];
      if (!ui) continue;
      ui.bar.update(
        Math.max(0, display.enemyHulls[i] ?? 0), e.maxHull, display.enemyPlatings[i] ?? 0,
        e.vulnerable, e.weak,
        e.strength, e.dexterity, e.burn, e.thorns
      );
    }
  }

  // ===== Refresh =====

  private refresh() {
    const s = this.state;
    this.playerBar.update(
      s.player.hull, s.player.maxHull, s.player.plating,
      s.player.vulnerable, s.player.weak,
      s.player.strength, s.player.dexterity, s.player.burn, s.player.thorns
    );
    for (let i = 0; i < s.enemies.length; i++) {
      const e = s.enemies[i];
      const ui = this.enemyUIs[i];
      if (!ui) continue;
      ui.bar.update(
        Math.max(0, e.hull), e.maxHull, e.plating,
        e.vulnerable, e.weak,
        e.strength, e.dexterity, e.burn, e.thorns
      );
      ui.intent.update(e.nextAction.intent, e.strength, e.weak, s.player.vulnerable, s.enemyDamageMult);
      const dead = e.hull <= 0;
      ui.sprite.setAlpha(dead ? 0.25 : 1);
      ui.intent.setAlpha(dead ? 0.2 : 1);
      ui.bar.setAlpha(dead ? 0.4 : 1);
      ui.nameLabel.setAlpha(dead ? 0.4 : 1);
      if (dead) ui.intent.update({ kind: 'unknown', label: 'DOWN' } as EnemyState['nextAction']['intent']);
    }
    this.steamLabel.setText(`${s.player.steam}/${s.player.maxSteam}`);
    this.turnText.setText(`TURN ${s.turn}`);
    this.deckText.setText(`DRAW: ${s.player.draw.length}`);
    this.discardText.setText(`DISCARD: ${s.player.discard.length}    EXHAUST: ${s.player.exhaust.length}`);
    this.logText.setText(s.log.slice(-4).join('\n'));

    this.layoutHand();
    this.refreshPotionBelt();

    if (s.phase === 'victory' && !this.endHandled) {
      this.endHandled = true;
      const stats = this.collectCombatStats();
      const reward = completeCombat(s.player.hull, stats);
      const run = getRun();
      let nextScene: string;
      let continueLine: string;
      if (run.result === 'victory') {
        // Final-act boss down — show the run-summary screen instead of routing back to the map.
        nextScene = 'RunSummary';
        continueLine = 'Press SPACE for the run summary.';
      } else if (run.awaitingInterAct) {
        nextScene = 'InterAct';
        continueLine = 'Press SPACE to march on.';
      } else {
        nextScene = 'Reward';
        continueLine = 'Press SPACE to claim rewards.';
      }
      const rewardLine = reward > 0 ? ` +${reward} scrap.` : '';
      const titleEnemyName =
        s.enemies.length === 1 ? s.enemies[0].def.name : 'The lot of them';
      this.showOverlay('VICTORY', `${titleEnemyName} falls.${rewardLine} ${continueLine}`, COLORS.ok);
      sfx.victory();
      this.bindContinue(nextScene);
    } else if (s.phase === 'defeat' && !this.endHandled) {
      this.endHandled = true;
      failCombat(s.player.hull, this.collectCombatStats());
      this.showOverlay('DEFEAT', 'Your mech is scrap. Press SPACE for the run summary.', COLORS.danger);
      sfx.defeat();
      this.bindContinue('RunSummary');
    }
  }

  private collectCombatStats(): { turns: number; biggestHit: number; potionsUsed: number } {
    return {
      // state.turn is 1-indexed; victory/defeat can happen mid-turn so the
      // current turn counts as a played turn.
      turns: this.state.turn,
      biggestHit: this.state.biggestPlayerHit,
      potionsUsed: this.potionsUsedThisCombat
    };
  }

  private bindContinue(nextScene: string) {
    if (!this.input.keyboard) return;
    this.input.keyboard.removeAllListeners('keydown-SPACE');
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start(nextScene));
  }

  private layoutHand() {
    // Diff cards: keep existing views for cards still in hand, build for new
    const hand = this.state.player.hand;
    const existing = new Map(this.cardViews.map((v) => [v.card.uid, v]));
    const next: CardView[] = [];
    const newlyCreated = new Set<CardView>();

    for (const card of hand) {
      let view = existing.get(card.uid);
      if (!view) {
        view = new CardView(
          this,
          card,
          (c, v, p) => this.onCardPointerDown(c, v, p),
          (hov, v) => this.onCardHoverChange(hov, v)
        );
        this.handLayer.add(view);
        if (this.debugHitAreas) this.applyHitAreaDebug(view);
        newlyCreated.add(view);
      } else {
        existing.delete(card.uid);
      }
      next.push(view);
    }
    // Cards still in cardViews but not in current hand have left the hand
    // (typically end-of-turn discards / exhausts). Float them to the
    // discard pile then destroy — but skip views that are mid-play-flourish
    // (their exit is handled in playCardWithFlourish).
    const staleViews = Array.from(existing.values()).filter((v) => !this.playingViews.has(v));
    staleViews.forEach((stale, i) => this.animateDiscardOut(stale, i));
    this.cardViews = next;

    const width = DESIGN_W;
    const height = DESIGN_H;
    const baseY = height - CARD_H * 0.5 - 16;
    const n = next.length;
    if (n === 0) return;

    // Simple horizontal row: cards evenly spaced. At small hand sizes
    // they don't overlap; at large hand sizes (8+) they pack together
    // with the rightmost card drawn last so hover/click favors the most
    // recently drawn card (which is usually what the player wants).
    //
    // Slice 56 — widened maxSpread (360 → 240 margin) so hands up to ~10
    // cards lay out without crushing each other, and bumped the minimum
    // spacing to 60% of CARD_W so even at 12+ cards each card's tappable
    // area remains a clear vertical strip.
    const maxSpread = width - 240;
    const idealSpacing = CARD_W + 10; // 10px gap between cards
    const minSpacing = CARD_W * 0.6;  // ~84 px — hardest crowding allowed
    const rawSpacing = n > 1 ? maxSpread / (n - 1) : 0;
    const spacing = n > 1 ? Math.max(minSpacing, Math.min(idealSpacing, rawSpacing)) : 0;
    const startX = width / 2 - (spacing * (n - 1)) / 2;

    // Stagger draw-in animations by the order new cards appear in the row.
    let drawStagger = 0;
    for (let i = 0; i < n; i++) {
      const x = startX + i * spacing;
      const view = next[i];
      view.setPlayable(canPlay(this.state, view.card.uid));
      // Slice 56 — keep the cost badge in sync with runtime modifiers
      // (firstCardFree / Reactor Lens). Cheap to call per layout since
      // costLabel is a pure read off PlayerState + relicIds.
      const { label, discounted } = costLabel(this.state, view.card.def);
      view.setCostLabel(label, discounted);
      if (newlyCreated.has(view)) {
        // New card: snap to home, then animateDrawIn moves it to the draw
        // pile and tweens back. The "snap" half is wasted work but keeps
        // home values authoritative if animateDrawIn ever short-circuits.
        view.setHome(x, baseY, 0);
        this.animateDrawIn(view, x, baseY, drawStagger);
        drawStagger += 1;
      } else {
        // Existing card: update home values without snapping, then tween
        // the container to the new x/y so hand reflow looks like a slide
        // instead of a teleport.
        view.setHome(x, baseY, 0, false);
        this.tweenHandTo(view, x, baseY);
      }
    }

    this.restoreHandOrder();
  }

  // Snaps a freshly-created card view to the draw pile and tweens it into
  // its hand slot. The setHome call before this already positioned the view
  // at (homeX, homeY); we override that to start at the pile, then tween.
  private animateDrawIn(view: CardView, homeX: number, homeY: number, stagger: number) {
    view.x = this.drawPile.x;
    view.y = this.drawPile.y;
    view.alpha = 0;
    view.setScale(0.35);
    this.tweens.add({
      targets: view,
      x: homeX,
      y: homeY,
      alpha: 1,
      scale: 1,
      duration: 220,
      delay: stagger * 50,
      ease: 'Cubic.Out'
    });
  }

  // Slides an already-in-hand card from its current position to a new
  // home slot. Used when a card leaves the hand and the remaining cards
  // need to reflow. Skips no-op moves so a refresh that doesn't change
  // anything doesn't trigger a pointless tween.
  private tweenHandTo(view: CardView, x: number, y: number) {
    // If the player is actively dragging this card, the pointer drives its
    // position — don't fight it with a layout tween.
    if (view.isDragging()) return;
    if (Math.abs(view.x - x) < 1 && Math.abs(view.y - y) < 1) return;
    // Kill any prior layout tween on this view so a fast-firing refresh
    // doesn't stack motion on top of motion.
    this.tweens.killTweensOf(view);
    this.tweens.add({
      targets: view,
      x,
      y,
      duration: 180,
      ease: 'Cubic.Out'
    });
  }

  // Tweens a card out of the hand toward the discard pile and destroys it
  // on completion. Used for end-of-turn discards / exhausts. Played cards
  // don't go through this — playCardWithFlourish runs its own exit tween.
  private animateDiscardOut(view: CardView, stagger: number) {
    this.tweens.add({
      targets: view,
      x: this.discardPile.x,
      y: this.discardPile.y,
      alpha: 0,
      scale: 0.35,
      duration: 220,
      delay: stagger * 40,
      ease: 'Cubic.In',
      onComplete: () => view.destroy()
    });
  }

  // Re-establish the fan's z-order: left-to-right with rightmost on top.
  // Phaser's setDepth is a no-op for objects inside a Container, so we
  // walk the cardViews in layout order and bringToTop each one. After the
  // loop, cardViews[0] is at the bottom of handLayer.list and
  // cardViews[N-1] is at the top. Pointer events route to the topmost
  // interactive child whose hit area contains the pointer — i.e. the
  // visually-frontmost card.
  private restoreHandOrder() {
    for (const v of this.cardViews) this.handLayer.bringToTop(v);
  }

  private onCardHoverChange(hovered: boolean, _view: CardView) {
    // CardView itself brings the hovered card to the top of handLayer.
    // On un-hover we restore the natural fan order so the just-hovered
    // card doesn't stay stuck at the top stealing pointer events.
    if (!hovered) this.restoreHandOrder();
  }

  private toggleHitAreaDebug() {
    this.debugHitAreas = !this.debugHitAreas;
    for (const v of this.cardViews) this.applyHitAreaDebug(v);
  }

  private applyHitAreaDebug(v: CardView) {
    if (this.debugHitAreas) {
      // Phaser's debug (green outline) — known to have offset issues for
      // Container children in some versions.
      this.input.enableDebug(v, 0x00ff00);
      // Our own debug (magenta outline) — lives inside the card's outer
      // container so it always matches where the hit area logically is.
      // If the green and magenta outlines disagree, Phaser is lying. If they
      // agree but neither matches the card visual, the math is wrong.
      v.setDebugHitAreaVisible(true);
    } else {
      this.input.removeDebug(v);
      v.setDebugHitAreaVisible(false);
    }
  }

  private showOverlay(title: string, sub: string, color: number) {
    this.overlay.removeAll(true);
    const width = DESIGN_W;
    const height = DESIGN_H;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    const t = this.add.text(width / 2, height / 2 - 20, title, {
      fontFamily: FONTS.display,
      fontSize: '64px',
      color: hex(color),
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const s = this.add.text(width / 2, height / 2 + 40, sub, {
      fontFamily: FONTS.body,
      fontSize: '16px',
      color: hex(COLORS.bone)
    }).setOrigin(0.5);
    this.overlay.add([dim, t, s]);
    this.overlay.setVisible(true);
  }
}

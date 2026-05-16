import Phaser from 'phaser';
import { createCombatState, endTurn, playCard, canPlay, usePotion, canUsePotion } from '../game/combat';
import { getRun, completeCombat, failCombat, clearPotionSlot } from '../game/run';
import { POTIONS } from '../game/potions';
import type { CombatState, CardInstance, EnemyState } from '../game/types';
import { CardView, CARD_W, CARD_H } from '../ui/CardView';
import { CHARACTER_SPRITES, ENEMY_SPRITES } from '../ui/MechSprite';
import { setupPause } from '../ui/setupPause';
import { sfx } from '../audio/sfx';
import { StatBar } from '../ui/StatBar';
import { IntentView } from '../ui/IntentView';
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
  // When set, the player has clicked an enemy-target potion and is choosing
  // which enemy to use it on. Next click on an enemy consumes it; clicking
  // anywhere else cancels.
  private aimingPotionSlot: number | null = null;
  // The pointerup that ends the slot-click that entered aim mode fires AFTER
  // our pointerdown handler. We swallow that first one so the player still
  // needs to click again to either confirm or cancel.
  private suppressNextAimUp = false;
  private potionAimBanner!: Phaser.GameObjects.Text;

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

    setupPause(this);

    const { width, height } = this.scale;
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
    this.state = createCombatState(run.pendingEnemies, run.player, run.relics);

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

    // Potion belt — row of slots to the right of the steam gauge.
    this.makePotionBelt(180, height - 130);

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
    const { width, height } = this.scale;
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
      const label = this.add
        .text(0, 0, '', {
          fontFamily: FONTS.display,
          fontSize: '11px',
          color: hex(COLORS.bone),
          align: 'center',
          fontStyle: 'bold',
          wordWrap: { width: slotSize - 4 }
        })
        .setOrigin(0.5);
      container.add([glow, bg, label]);
      bg.setInteractive({ useHandCursor: true });
      const idx = i;
      bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onPotionSlotClick(idx, pointer));
      bg.on('pointerover', () => this.onPotionHover(idx, true));
      bg.on('pointerout', () => this.onPotionHover(idx, false));
      this.potionSlots.push({ container, bg, glow, label });
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
    const { width } = this.scale;
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
      if (def) {
        // Compact label: first 4 chars of each word, capped at 10 chars.
        const short = def.name.split(' ').map((w) => w.slice(0, 4)).join(' ').slice(0, 12);
        ui.label.setText(short);
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
    this.potionTooltip.setText(`${def.name}\n${def.description}`);
    this.potionTooltip.setVisible(true);
  }

  private onPotionSlotClick(slot: number, _pointer: Phaser.Input.Pointer) {
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
    const canPlayAnything = this.state.player.hand.some((c) => canPlay(this.state, c.uid));
    if (this.state.player.steam > 0 && canPlayAnything && !this.endTurnPending) {
      this.startEndTurnConfirm();
      return;
    }
    this.cancelEndTurnConfirm();
    sfx.endTurn();
    const pre = this.snapshot();
    endTurn(this.state, {
      afterEnemyResolve: () => this.emitDeltas(pre)
    });
    if (this.state.player.hull > 0 && this.state.phase === 'playerTurn') {
      this.shake(this.mech, 4);
    }
    this.refresh();
  }

  // ===== Drag + click for cards =====

  private onCardPointerDown(card: CardInstance, view: CardView, pointer: Phaser.Input.Pointer) {
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
    this.tweens.add({
      targets: view,
      y: view.y - 50,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 170,
      ease: 'Cubic.Out',
      onComplete: () => this.applyCardPlay(card, targetIndex)
    });
  }

  private applyCardPlay(card: CardInstance, targetIndex: number | undefined) {
    const pre = this.snapshot();
    sfx.cardPlay();
    const ok = playCard(this.state, card.uid, targetIndex);
    if (!ok) {
      this.refresh();
      return;
    }
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
    const t = this.add.text(x, y, text, {
      fontFamily: FONTS.display,
      fontSize: '30px',
      color: hex(color),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(900);
    this.tweens.add({
      targets: t,
      y: y - 70,
      alpha: 0,
      duration: 850,
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
      ui.intent.update(e.nextAction.intent);
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
      const reward = completeCombat(s.player.hull);
      const run = getRun();
      let nextScene: string;
      let continueLine: string;
      if (run.result === 'victory') {
        nextScene = 'Map';
        continueLine = 'Press SPACE to return.';
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
      failCombat(s.player.hull);
      this.showOverlay('DEFEAT', 'Your mech is scrap. Press SPACE to view the map.', COLORS.danger);
      sfx.defeat();
      this.bindContinue('Map');
    }
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
      } else {
        existing.delete(card.uid);
      }
      next.push(view);
    }
    for (const stale of existing.values()) stale.destroy();
    this.cardViews = next;

    const { width, height } = this.scale;
    const baseY = height - CARD_H * 0.5 - 16;
    const n = next.length;
    if (n === 0) return;

    // Simple horizontal row: cards evenly spaced, no overlap, no rotation,
    // no arc. Each card's hit area is the full CARD_W centered on the card.
    // This is the most reliable layout — Phaser routes pointer events
    // cleanly because hit areas don't overlap and each card's visual
    // matches its hit area exactly.
    const maxSpread = width - 360;
    const idealSpacing = CARD_W + 10; // 10px gap between cards
    const spacing = n > 1 ? Math.min(idealSpacing, maxSpread / (n - 1)) : 0;
    const startX = width / 2 - (spacing * (n - 1)) / 2;

    for (let i = 0; i < n; i++) {
      const x = startX + i * spacing;
      const view = next[i];
      view.setHome(x, baseY, 0);
      // Full-width centered slot for every card. With no overlap, there's
      // no need for the asymmetric left-aligned slot.
      view.setSlot(CARD_W / 2, CARD_W / 2);
      view.setPlayable(canPlay(this.state, view.card.uid));
    }

    this.restoreHandOrder();
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
    const { width, height } = this.scale;
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

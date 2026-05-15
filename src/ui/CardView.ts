import Phaser from 'phaser';
import type { CardInstance } from '../game/types';
import { COLORS, FONTS, hex } from './theme';

export const CARD_W = 140;
export const CARD_H = 170;
const LIFT = 40;

export class CardView extends Phaser.GameObjects.Container {
  private visual: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private costBadge: Phaser.GameObjects.Arc;
  private costText: Phaser.GameObjects.Text;
  private descText: Phaser.GameObjects.Text;
  private exhaustText: Phaser.GameObjects.Text | null = null;
  private playable = true;
  private hovered = false;
  private homeX = 0;
  private homeY = 0;
  private homeRot = 0;
  private currentTween: Phaser.Tweens.Tween | null = null;
  private dragging = false;
  private onHoverChange?: (hovered: boolean, view: CardView) => void;
  private hitDebug!: Phaser.GameObjects.Rectangle;

  setDebugHitAreaVisible(visible: boolean) {
    if (this.hitDebug) this.hitDebug.setVisible(visible);
  }

  // Set the hit area to a slot that extends `leftExtent` px to the left of
  // the card's center and `rightExtent` px to the right. The scene gives
  // each card a slot that matches its visible portion exactly, so adjacent
  // hit areas never overlap and click routing is unambiguous.
  setSlot(leftExtent: number, rightExtent: number) {
    this.applySlot(leftExtent, rightExtent);
  }

  private applySlot(leftExtent: number, rightExtent: number) {
    const width = leftExtent + rightExtent;
    const hitH = CARD_H + LIFT;
    const hitTop = -CARD_H / 2 - LIFT;
    const hitLeft = -leftExtent;
    this.setSize(width, hitH);
    this.setInteractive(
      new Phaser.Geom.Rectangle(hitLeft, hitTop, width, hitH),
      Phaser.Geom.Rectangle.Contains
    );
    if (this.hitDebug) {
      this.hitDebug.setPosition(hitLeft + width / 2, hitTop + hitH / 2);
      this.hitDebug.setSize(width, hitH);
    }
  }

  constructor(
    scene: Phaser.Scene,
    public readonly card: CardInstance,
    onPointerDown: (c: CardInstance, view: CardView, pointer: Phaser.Input.Pointer) => void,
    onHoverChange?: (hovered: boolean, view: CardView) => void
  ) {
    super(scene, 0, 0);
    this.onHoverChange = onHoverChange;

    // Inner container holds the visual — this is what we animate for hover.
    this.visual = scene.add.container(0, 0);

    this.bg = scene.add.rectangle(0, 0, CARD_W, CARD_H, COLORS.cardBg).setStrokeStyle(0);
    this.border = scene.add
      .rectangle(0, 0, CARD_W, CARD_H)
      .setStrokeStyle(2, COLORS.cardBorder)
      .setFillStyle();

    this.nameText = scene.add
      .text(0, -CARD_H / 2 + 18, card.def.name, {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.bone),
        align: 'center',
        wordWrap: { width: CARD_W - 16 }
      })
      .setOrigin(0.5, 0.5);

    this.costBadge = scene.add.circle(-CARD_W / 2 + 16, -CARD_H / 2 + 16, 14, COLORS.steam);
    this.costText = scene.add
      .text(-CARD_W / 2 + 16, -CARD_H / 2 + 16, String(card.def.cost), {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(COLORS.steelDark),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0.5);

    this.descText = scene.add
      .text(0, 18, card.def.description, {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.bone),
        align: 'center',
        wordWrap: { width: CARD_W - 18 }
      })
      .setOrigin(0.5, 0.5);

    this.visual.add([this.bg, this.border, this.nameText, this.costBadge, this.costText, this.descText]);

    if (card.def.exhaust) {
      this.exhaustText = scene.add
        .text(0, CARD_H / 2 - 14, 'EXHAUST', {
          fontFamily: FONTS.body,
          fontSize: '10px',
          color: hex(COLORS.rust)
        })
        .setOrigin(0.5, 0.5);
      this.visual.add(this.exhaustText);
    }

    this.add(this.visual);

    // Hit area lives on the outer container, which never moves or scales.
    // Default to a full CARD_W slot; the scene calls setSlot() per card to
    // narrow the slot to exactly the card's visible portion (so adjacent
    // hit areas never overlap and routing is unambiguous).
    this.applySlot(CARD_W / 2, CARD_W / 2);

    // Manual hit-area visualization. Lives in the outer container so it
    // moves and renders with the card itself (unlike scene.input.enableDebug,
    // which has known offset issues for nested Container children). Hidden
    // by default; CombatScene's D-key toggles visibility on every card.
    // Initial dimensions match the default full-CARD_W slot; applySlot
    // resizes the debug rect whenever the hit area changes.
    const initialHitH = CARD_H + LIFT;
    const initialHitTop = -CARD_H / 2 - LIFT;
    this.hitDebug = scene.add
      .rectangle(0, initialHitTop + initialHitH / 2, CARD_W, initialHitH)
      .setStrokeStyle(2, 0xff00ff)
      .setFillStyle()
      .setVisible(false);
    this.add(this.hitDebug);

    this.on('pointerover', () => {
      if (this.dragging) return;
      if (this.hovered) return;
      this.hovered = true;
      this.applyTransform();
      this.onHoverChange?.(true, this);
    });
    this.on('pointerout', () => {
      if (this.dragging) return;
      if (!this.hovered) return;
      this.hovered = false;
      this.applyTransform();
      this.onHoverChange?.(false, this);
    });
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.playable) onPointerDown(card, this, pointer);
    });
  }

  setHome(x: number, y: number, rot: number, _slotWidth?: number) {
    this.homeX = x;
    this.homeY = y;
    if (!this.dragging) {
      this.x = x;
      this.y = y;
    }
    this.homeRot = rot;
    // Outer container never rotates — only the visual does, so the hit area stays axis-aligned.
    this.rotation = 0;
    // Hit area stays at full CARD_W regardless of fan spacing. Adjacent
    // cards' hit areas overlap in their visual-overlap regions; pointer
    // events route to the visually-frontmost card via parent-container
    // bringToTop ordering (Phaser's setDepth is a no-op inside Containers).
    if (!this.hovered && !this.dragging) {
      this.visual.rotation = rot;
      this.visual.y = 0;
      this.visual.scaleX = 1;
      this.visual.scaleY = 1;
    }
  }

  getHome(): { x: number; y: number; rot: number } {
    return { x: this.homeX, y: this.homeY, rot: this.homeRot };
  }

  setPlayable(p: boolean) {
    if (this.playable === p) return;
    this.playable = p;
    this.bg.setFillStyle(p ? COLORS.cardBgPlayable : COLORS.cardBgUnplayable);
    this.border.setStrokeStyle(2, p ? COLORS.cardBorder : COLORS.cardBorderDim);
    this.nameText.setColor(p ? hex(COLORS.bone) : hex(COLORS.boneDim));
    this.descText.setColor(p ? hex(COLORS.bone) : hex(COLORS.boneDim));
    this.costBadge.setFillStyle(p ? COLORS.steam : COLORS.brassDim);
  }

  isPlayable(): boolean {
    return this.playable;
  }

  beginDrag() {
    if (this.dragging) return;
    this.dragging = true;
    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;
    }
    // Detach from hover state; the scene now drives position.
    this.hovered = false;
    this.visual.rotation = 0;
    this.visual.y = 0;
    this.visual.scaleX = 1.08;
    this.visual.scaleY = 1.08;
    this.parentContainer?.bringToTop(this);
  }

  setDragPos(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  endDrag(animate = true): Promise<void> {
    if (!this.dragging) return Promise.resolve();
    this.dragging = false;
    if (!animate) {
      this.x = this.homeX;
      this.y = this.homeY;
      this.visual.rotation = this.homeRot;
      this.visual.scaleX = 1;
      this.visual.scaleY = 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        x: this.homeX,
        y: this.homeY,
        duration: 130,
        ease: 'Cubic.Out'
      });
      this.scene.tweens.add({
        targets: this.visual,
        rotation: this.homeRot,
        scaleX: 1,
        scaleY: 1,
        duration: 130,
        ease: 'Cubic.Out',
        onComplete: () => resolve()
      });
    });
  }

  isDragging(): boolean {
    return this.dragging;
  }

  private applyTransform() {
    if (this.dragging) return;
    if (this.currentTween) this.currentTween.stop();
    const targetY = this.hovered ? -LIFT : 0;
    const targetRot = this.hovered ? 0 : this.homeRot;
    const targetScale = this.hovered ? 1.08 : 1;
    this.currentTween = this.scene.tweens.add({
      targets: this.visual,
      y: targetY,
      rotation: targetRot,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 120,
      ease: 'Sine.Out'
    });
    // Bringing the hovered card to the top of the parent container makes
    // its lifted visual sit on top of neighbors AND routes pointer events
    // to it (Phaser hit-tests container children in display order). The
    // scene's onHoverChange restores left-to-right fan order on pointerout
    // so a just-hovered card doesn't stay stuck at the top of the stack.
    if (this.hovered) this.parentContainer?.bringToTop(this);
  }
}

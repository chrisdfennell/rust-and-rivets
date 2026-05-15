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
  private layoutDepth = 0;
  private dragging = false;

  constructor(
    scene: Phaser.Scene,
    public readonly card: CardInstance,
    onPointerDown: (c: CardInstance, view: CardView, pointer: Phaser.Input.Pointer) => void
  ) {
    super(scene, 0, 0);

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
    // Make it tall enough to cover both the resting card AND the lifted-up card,
    // so the pointer never leaves it mid-tween.
    const hitH = CARD_H + LIFT;
    const hitTop = -CARD_H / 2 - LIFT;
    this.setSize(CARD_W, hitH);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_W / 2, hitTop, CARD_W, hitH),
      Phaser.Geom.Rectangle.Contains
    );

    this.on('pointerover', () => {
      if (this.dragging) return;
      if (this.hovered) return;
      this.hovered = true;
      this.applyTransform();
    });
    this.on('pointerout', () => {
      if (this.dragging) return;
      if (!this.hovered) return;
      this.hovered = false;
      this.applyTransform();
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
    // cards' hit areas overlap in their visual-overlap regions; Phaser
    // routes pointer events to the visually-frontmost card via depth.
    if (!this.hovered && !this.dragging) {
      this.visual.rotation = rot;
      this.visual.y = 0;
      this.visual.scaleX = 1;
      this.visual.scaleY = 1;
    }
  }

  setLayoutDepth(d: number) {
    this.layoutDepth = d;
    if (!this.hovered && !this.dragging) {
      this.setDepth(d);
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
    this.setDepth(1100);
  }

  setDragPos(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  endDrag(animate = true): Promise<void> {
    if (!this.dragging) return Promise.resolve();
    this.dragging = false;
    this.setDepth(this.layoutDepth);
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
    // Hovered card jumps to the front of the z-stack so its lifted visual
    // sits on top of neighbors. On pointerout we restore the card's natural
    // layout depth — otherwise the just-hovered card stays stuck on top and
    // steals pointer events from the visually-frontmost card.
    this.setDepth(this.hovered ? 1000 : this.layoutDepth);
  }
}

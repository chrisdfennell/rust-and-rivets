import Phaser from 'phaser';
import type { CardInstance } from '../game/types';
import { COLORS, FONTS, hex } from './theme';

export const CARD_W = 140;
export const CARD_H = 190;
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
  private homeRot = 0;
  private currentTween: Phaser.Tweens.Tween | null = null;
  private slotWidth = CARD_W;

  constructor(
    scene: Phaser.Scene,
    public readonly card: CardInstance,
    onClick: (c: CardInstance) => void
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
      if (this.hovered) return;
      this.hovered = true;
      this.applyTransform();
    });
    this.on('pointerout', () => {
      if (!this.hovered) return;
      this.hovered = false;
      this.applyTransform();
    });
    this.on('pointerdown', () => {
      if (this.playable) onClick(card);
    });
  }

  setHome(x: number, y: number, rot: number, slotWidth?: number) {
    this.x = x;
    this.y = y;
    this.homeRot = rot;
    // Outer container never rotates — only the visual does, so the hit area stays axis-aligned.
    this.rotation = 0;
    // Resize the hit area so adjacent fanned cards don't fight over pointer events
    // in their visual overlap. Each card "owns" a slot of width = card spacing.
    if (slotWidth !== undefined && slotWidth !== this.slotWidth) {
      this.slotWidth = slotWidth;
      const hitH = CARD_H + LIFT;
      const hitTop = -CARD_H / 2 - LIFT;
      this.setSize(slotWidth, hitH);
      this.setInteractive(
        new Phaser.Geom.Rectangle(-slotWidth / 2, hitTop, slotWidth, hitH),
        Phaser.Geom.Rectangle.Contains
      );
    }
    if (!this.hovered) {
      this.visual.rotation = rot;
      this.visual.y = 0;
      this.visual.scaleX = 1;
      this.visual.scaleY = 1;
    }
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

  private applyTransform() {
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
    if (this.hovered) this.parentContainer?.bringToTop(this);
  }
}

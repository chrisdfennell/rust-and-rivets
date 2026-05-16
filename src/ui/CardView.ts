import Phaser from 'phaser';
import type { CardInstance } from '../game/types';
import { COLORS, FONTS, hex } from './theme';

export const CARD_W = 140;
export const CARD_H = 170;
// Visual-only hover lift. The hit area does NOT extend up by LIFT — that
// extension previously caused a noticeable mismatch between where cards
// were drawn and where they had to be clicked.
const LIFT = 40;

export class CardView extends Phaser.GameObjects.Container {
  private visual: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private costBadge: Phaser.GameObjects.Arc;
  private costText: Phaser.GameObjects.Text;
  private descText: Phaser.GameObjects.Text;
  private keywordText: Phaser.GameObjects.Text | null = null;
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

    const keywords: string[] = [];
    if (card.def.innate) keywords.push('INNATE');
    if (card.def.retain) keywords.push('RETAIN');
    if (card.def.ethereal) keywords.push('ETHEREAL');
    if (card.def.exhaust) keywords.push('EXHAUST');
    if (keywords.length > 0) {
      this.keywordText = scene.add
        .text(0, CARD_H / 2 - 14, keywords.join(' • '), {
          fontFamily: FONTS.body,
          fontSize: '10px',
          color: hex(COLORS.rust)
        })
        .setOrigin(0.5, 0.5);
      this.visual.add(this.keywordText);
    }

    this.add(this.visual);

    // Hit area lives on the outer container and matches the card's visible
    // rectangle EXACTLY (CARD_W × CARD_H, centered on origin). Hover-lift
    // moves only the inner visual, so the hit area stays put — the cursor
    // remains over the card for the lower ~130 px even while it's lifted.
    this.setSize(CARD_W, CARD_H);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H),
      Phaser.Geom.Rectangle.Contains
    );

    // Debug visualization, toggled by CombatScene's D-key. Same geometry
    // as the hit area so green (Phaser's enableDebug) and magenta should
    // agree. Hidden by default.
    this.hitDebug = scene.add
      .rectangle(0, 0, CARD_W, CARD_H)
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

  setHome(x: number, y: number, rot: number) {
    this.homeX = x;
    this.homeY = y;
    if (!this.dragging) {
      this.x = x;
      this.y = y;
    }
    this.homeRot = rot;
    // Outer container never rotates — only the visual does, so the hit area stays axis-aligned.
    this.rotation = 0;
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

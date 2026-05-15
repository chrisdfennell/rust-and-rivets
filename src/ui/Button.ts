import Phaser from 'phaser';
import { COLORS, FONTS, hex } from './theme';

export interface ButtonOpts {
  width?: number;
  height?: number;
  fill?: number;
  hoverFill?: number;
  disabledFill?: number;
  textColor?: number;
  fontSize?: number;
}

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private txt: Phaser.GameObjects.Text;
  private enabled = true;
  private opts: Required<ButtonOpts>;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    opts: ButtonOpts = {}
  ) {
    super(scene, x, y);
    this.opts = {
      width: opts.width ?? 180,
      height: opts.height ?? 50,
      fill: opts.fill ?? COLORS.rust,
      hoverFill: opts.hoverFill ?? COLORS.danger,
      disabledFill: opts.disabledFill ?? COLORS.steelDark,
      textColor: opts.textColor ?? COLORS.bone,
      fontSize: opts.fontSize ?? 16
    };

    this.bg = scene.add
      .rectangle(0, 0, this.opts.width, this.opts.height, this.opts.fill)
      .setStrokeStyle(2, COLORS.brass);
    this.txt = scene.add
      .text(0, 0, label, {
        fontFamily: FONTS.display,
        fontSize: `${this.opts.fontSize}px`,
        color: hex(this.opts.textColor),
        fontStyle: 'bold',
        align: 'center'
      })
      .setOrigin(0.5);
    this.add([this.bg, this.txt]);

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerover', () => {
      if (this.enabled) this.bg.setFillStyle(this.opts.hoverFill);
    });
    this.bg.on('pointerout', () => {
      if (this.enabled) this.bg.setFillStyle(this.opts.fill);
    });
    this.bg.on('pointerdown', () => {
      if (this.enabled) onClick();
    });
  }

  setLabel(label: string): this {
    this.txt.setText(label);
    return this;
  }

  setEnabled(enabled: boolean): this {
    if (this.enabled === enabled) return this;
    this.enabled = enabled;
    this.bg.setFillStyle(enabled ? this.opts.fill : this.opts.disabledFill);
    this.bg.setStrokeStyle(2, enabled ? COLORS.brass : COLORS.brassDim);
    this.txt.setColor(hex(enabled ? this.opts.textColor : COLORS.boneDim));
    return this;
  }
}

import Phaser from 'phaser';
import type { Intent } from '../game/types';
import { COLORS, FONTS, hex } from './theme';

export class IntentView extends Phaser.GameObjects.Container {
  private icon: Phaser.GameObjects.Text;
  private label: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.bg = scene.add.rectangle(0, 0, 130, 36, COLORS.bgPanel).setStrokeStyle(2, COLORS.brassDim);
    this.icon = scene.add
      .text(-50, 0, '', {
        fontFamily: FONTS.display,
        fontSize: '20px',
        color: hex(COLORS.danger),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0.5);
    this.label = scene.add
      .text(8, 0, '', {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.bone)
      })
      .setOrigin(0.5, 0.5);
    this.add([this.bg, this.icon, this.label]);
  }

  update(intent: Intent) {
    let glyph = '?';
    let color = COLORS.bone;
    switch (intent.kind) {
      case 'attack':
        glyph = intent.hits && intent.hits > 1 ? `>>` : '>';
        color = COLORS.danger;
        break;
      case 'defend':
        glyph = '#';
        color = COLORS.shield;
        break;
      case 'buff':
        glyph = '^';
        color = COLORS.buff;
        break;
      case 'debuff':
        glyph = 'v';
        color = COLORS.rust;
        break;
    }
    this.icon.setText(glyph).setColor(hex(color));
    this.label.setText(intent.label);
  }
}

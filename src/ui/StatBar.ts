import Phaser from 'phaser';
import { COLORS, FONTS, hex } from './theme';

export class StatBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private platingBadge: Phaser.GameObjects.Container;
  private platingBg: Phaser.GameObjects.Arc;
  private platingText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, private barWidth: number) {
    super(scene, x, y);
    const h = 22;
    const w = barWidth;
    this.bg = scene.add.rectangle(0, 0, w, h, COLORS.steelDark).setStrokeStyle(2, COLORS.brassDim);
    this.fill = scene.add.rectangle(-w / 2 + 2, 0, w - 4, h - 4, COLORS.hull).setOrigin(0, 0.5);
    this.label = scene.add
      .text(0, 0, '', {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0.5);

    this.platingBadge = scene.add.container(-w / 2 - 18, 0);
    this.platingBg = scene.add.circle(0, 0, 16, COLORS.plating).setStrokeStyle(2, COLORS.bone);
    this.platingText = scene.add
      .text(0, 0, '0', {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0.5);
    this.platingBadge.add([this.platingBg, this.platingText]);
    this.platingBadge.setVisible(false);

    this.statusText = scene.add
      .text(0, 18, '', {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.danger),
        align: 'center'
      })
      .setOrigin(0.5, 0);

    this.add([this.bg, this.fill, this.label, this.platingBadge, this.statusText]);
  }

  update(hull: number, max: number, plating: number, vulnerable: number, weak: number) {
    const ratio = Math.max(0, hull / max);
    this.fill.width = (this.barWidth - 4) * ratio;
    this.label.setText(`${hull} / ${max}`);
    if (plating > 0) {
      this.platingBadge.setVisible(true);
      this.platingText.setText(String(plating));
    } else {
      this.platingBadge.setVisible(false);
    }
    const stat: string[] = [];
    if (vulnerable > 0) stat.push(`Vuln ${vulnerable}`);
    if (weak > 0) stat.push(`Weak ${weak}`);
    this.statusText.setText(stat.join('  '));
  }
}

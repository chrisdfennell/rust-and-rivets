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

  // Optional stat-modifier args let us display the actual hit number
  // (post-Strength + Vulnerable + Weak) instead of the raw base damage
  // baked into the label. Without these the call works as before.
  update(intent: Intent, attackerStr = 0, attackerWeak = 0, playerVuln = 0) {
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
    this.label.setText(this.computeDisplayLabel(intent, attackerStr, attackerWeak, playerVuln));
  }

  // Re-derive the label so the displayed damage number reflects the actual
  // hit the player will take (matches dealDamageToPlayer's math). Labels
  // bake the base damage in like "Crushing Punch: 12" or "Salvage Storm: 5x3";
  // we replace just the first occurrence of that base number.
  private computeDisplayLabel(intent: Intent, str: number, weak: number, vuln: number): string {
    const base = intent.damage;
    if (base === undefined) return intent.label;
    let mod = base + str;
    if (vuln > 0) mod = Math.floor(mod * 1.5);
    if (weak > 0) mod = Math.floor(mod * 0.75);
    if (mod === base) return intent.label;
    // Match the base number bounded by non-digits on both sides. `\b` won't
    // work for labels like "Salvage Storm: 5x3" because `x` is a word char,
    // so `\b5\b` fails to find the 5. Digit-boundary lookarounds do.
    const regex = new RegExp(`(?<!\\d)${base}(?!\\d)`);
    return intent.label.replace(regex, String(mod));
  }
}

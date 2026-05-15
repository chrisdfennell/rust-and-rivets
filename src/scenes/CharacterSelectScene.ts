import Phaser from 'phaser';
import { startRun, clearSavedRun } from '../game/run';
import { CHARACTERS, type CharacterDef } from '../game/characters';
import { RELICS } from '../game/relics';
import { CHARACTER_SPRITES } from '../ui/MechSprite';
import { Button } from '../ui/Button';
import { COLORS, FONTS, hex } from '../ui/theme';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelect');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop: hangar bay
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.78, width, height * 0.22);
    bg.fillStyle(COLORS.brass, 0.05);
    bg.fillCircle(width / 2, height * 0.42, 320);

    // Title
    this.add
      .text(width / 2, 50, 'CHOOSE YOUR PILOT', {
        fontFamily: FONTS.display,
        fontSize: '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 92, 'Each rig wears the wasteland differently.', {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    const cardW = 380;
    const gap = 30;
    const totalW = CHARACTERS.length * cardW + (CHARACTERS.length - 1) * gap;
    const startX = (width - totalW) / 2 + cardW / 2;

    CHARACTERS.forEach((c, i) => {
      this.drawCharacterCard(c, startX + i * (cardW + gap), 390, cardW);
    });

    // Back button (top-left)
    const back = new Button(
      this,
      120,
      height - 50,
      'BACK',
      () => this.scene.start('Title'),
      { width: 180, height: 44, fontSize: 14, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(back);
  }

  private drawCharacterCard(c: CharacterDef, x: number, y: number, w: number) {
    const h = 560;
    const leftX = x - w / 2 + 24;
    // Panel
    this.add
      .rectangle(x, y, w, h, COLORS.bgPanel)
      .setStrokeStyle(2, COLORS.brassDim);

    // Sprite (scaled down so it fits in the card)
    const drawFn = CHARACTER_SPRITES[c.id] ?? CHARACTER_SPRITES.pilot;
    const sprite = drawFn(this, x, y - 180);
    sprite.setScale(0.6);

    // Name
    this.add
      .text(x, y - 50, c.name, {
        fontFamily: FONTS.display,
        fontSize: '22px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Tagline
    this.add
      .text(x, y - 24, c.tagline, {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.steam)
      })
      .setOrigin(0.5);

    // Description (top-aligned, wraps)
    this.add
      .text(x, y - 4, c.description, {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.bone),
        align: 'center',
        wordWrap: { width: w - 40 },
        lineSpacing: 3
      })
      .setOrigin(0.5, 0);

    // Stats block
    this.add
      .text(leftX, y + 70, `Hull   ${c.startingHull}`, {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);
    this.add
      .text(leftX, y + 90, `Deck   ${c.startingDeck.length} cards`, {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    // Signature relic block
    this.add
      .text(leftX, y + 118, 'SIGNATURE', {
        fontFamily: FONTS.display,
        fontSize: '11px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);

    if (c.startingRelics.length === 0) {
      this.add
        .text(leftX, y + 136, 'none — pure baseline', {
          fontFamily: FONTS.body,
          fontSize: '12px',
          color: hex(COLORS.boneDim),
          fontStyle: 'italic'
        })
        .setOrigin(0, 0);
    } else {
      const def = RELICS[c.startingRelics[0]];
      if (def) {
        this.add
          .text(leftX, y + 136, `★ ${def.name}`, {
            fontFamily: FONTS.display,
            fontSize: '13px',
            color: hex(COLORS.steam),
            fontStyle: 'bold'
          })
          .setOrigin(0, 0);
        this.add
          .text(leftX, y + 156, def.description, {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.bone),
            wordWrap: { width: w - 48 },
            lineSpacing: 3
          })
          .setOrigin(0, 0);
      }
    }

    // SELECT button anchored at the bottom of the panel
    const btn = new Button(
      this,
      x,
      y + h / 2 - 38,
      'SELECT',
      () => this.pick(c.id),
      { width: w - 40, height: 50, fontSize: 17 }
    );
    this.add.existing(btn);
  }

  private pick(characterId: string) {
    clearSavedRun();
    startRun(characterId);
    this.cameras.main.fadeOut(220, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}

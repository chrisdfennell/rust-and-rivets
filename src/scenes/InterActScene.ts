import Phaser from 'phaser';
import { getRun, advanceAct, type InterActBoon } from '../game/run';
import { Button } from '../ui/Button';
import { COLORS, FONTS, hex } from '../ui/theme';

interface BoonOption {
  id: InterActBoon;
  title: string;
  detail: string;
  fill: number;
  hoverFill: number;
}

export class InterActScene extends Phaser.Scene {
  constructor() {
    super('InterAct');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — quiet, post-victory glow
    const bg = this.add.graphics();
    bg.fillStyle(0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x1f1a16);
    bg.fillRect(0, height * 0.6, width, height * 0.4);
    bg.fillStyle(COLORS.rust, 0.12);
    bg.fillCircle(width / 2, height * 0.55, 360);

    const run = getRun();

    this.add
      .text(width / 2, 60, 'ACT ' + run.act + ' COMPLETE', {
        fontFamily: FONTS.display,
        fontSize: '40px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 110, 'The Foundry yawns open. Take a moment, pilot.', {
        fontFamily: FONTS.body,
        fontSize: '14px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 160, 'CHOOSE ONE BOON', {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Status panel
    this.add
      .text(width / 2, height - 40,
        `HULL  ${run.player.hull}/${run.player.maxHull}    SCRAP  ${run.scrap}    DECK  ${run.player.deck.length}    RELICS  ${run.relics.length}`,
        {
          fontFamily: FONTS.body,
          fontSize: '12px',
          color: hex(COLORS.boneDim)
        })
      .setOrigin(0.5, 1);

    const options: BoonOption[] = [
      {
        id: 'repair',
        title: 'REPAIR',
        detail: 'Heal to full Hull',
        fill: COLORS.shield,
        hoverFill: 0x6f9dbf
      },
      {
        id: 'refit',
        title: 'REFIT',
        detail: '+15 max Hull (heal as well)',
        fill: COLORS.brass,
        hoverFill: COLORS.steam
      },
      {
        id: 'salvage',
        title: 'SALVAGE',
        detail: 'Receive a rare card',
        fill: COLORS.rust,
        hoverFill: COLORS.danger
      }
    ];

    const spacing = 320;
    const startX = width / 2 - spacing;

    options.forEach((opt, i) => {
      const cx = startX + i * spacing;
      const cy = height / 2 + 20;
      const btn = new Button(
        this,
        cx,
        cy,
        opt.title,
        () => this.choose(opt.id),
        { width: 260, height: 80, fontSize: 22, fill: opt.fill, hoverFill: opt.hoverFill }
      );
      this.add.existing(btn);

      this.add
        .text(cx, cy + 65, opt.detail, {
          fontFamily: FONTS.body,
          fontSize: '13px',
          color: hex(COLORS.bone),
          align: 'center',
          wordWrap: { width: 240 }
        })
        .setOrigin(0.5, 0);
    });
  }

  private choose(boon: InterActBoon) {
    advanceAct(boon);
    this.cameras.main.fadeOut(280, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}

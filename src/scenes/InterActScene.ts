import Phaser from 'phaser';
import { getRun, advanceAct, type InterActBoon } from '../game/run';
import { RELICS } from '../game/relics';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { DESIGN_W, DESIGN_H, applyDesignFit, bindDesignFitResize } from '../ui/sceneFit';
import { COLORS, FONTS, hex } from '../ui/theme';

// `run.act` is the act just CLEARED — the boon then advances to act+1.
// Text frames the doorway you're about to walk through.
function interActFlavor(clearedAct: number): string {
  if (clearedAct === 1) return 'The Foundry yawns open. Take stock, pilot.';
  if (clearedAct === 2) return 'The Cloudline is above. Bolt down for the climb.';
  if (clearedAct === 3) return 'A brass spire pierces the sky. The Cathedral waits.';
  if (clearedAct === 4) return 'The earth shudders. The World-Forge lies below.';
  return 'Catch your breath, pilot.';
}

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
    setupPause(this);
    const width = DESIGN_W;
    const height = DESIGN_H;
    applyDesignFit(this);
    bindDesignFitResize(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — quiet, post-victory glow
    const bg = this.add.graphics();
    bg.fillStyle(0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x1f1a16);
    bg.fillRect(0, height * 0.6, width, height * 0.4);
    bg.fillStyle(COLORS.rust, 0.08);
    bg.fillCircle(width / 2, height * 0.55, 380);

    const run = getRun();

    // Title
    this.add
      .text(width / 2, 44, `ACT ${run.act} COMPLETE`, {
        fontFamily: FONTS.display,
        fontSize: '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 86, interActFlavor(run.act), {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    this.drawStatusPanel(120, 120);

    // Boon header
    this.add
      .text(width / 2, 380, 'CHOOSE ONE BOON', {
        fontFamily: FONTS.display,
        fontSize: '18px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const heal = run.player.maxHull - run.player.hull;
    const refitBonus = 15;
    const refitNewMax = run.player.maxHull + refitBonus;
    const refitNewHull = run.player.hull + refitBonus;

    const options: BoonOption[] = [
      {
        id: 'repair',
        title: 'REPAIR',
        detail:
          heal > 0
            ? `Heal +${heal} → ${run.player.maxHull}/${run.player.maxHull} Hull`
            : `Already at full Hull (${run.player.maxHull}/${run.player.maxHull})`,
        fill: COLORS.shield,
        hoverFill: 0x6f9dbf
      },
      {
        id: 'refit',
        title: 'REFIT',
        detail:
          `+${refitBonus} max Hull (${run.player.maxHull} → ${refitNewMax})\n` +
          `Heal +${refitBonus} → ${refitNewHull}/${refitNewMax}`,
        fill: COLORS.brass,
        hoverFill: COLORS.steam
      },
      {
        id: 'salvage',
        title: 'SALVAGE',
        detail: `Add 1 random rare card\nto your ${run.player.deck.length}-card deck`,
        fill: COLORS.rust,
        hoverFill: COLORS.danger
      }
    ];

    const spacing = 340;
    const startX = width / 2 - spacing;

    options.forEach((opt, i) => {
      const cx = startX + i * spacing;
      const cy = 460;
      const btn = new Button(
        this,
        cx,
        cy,
        opt.title,
        () => this.choose(opt.id),
        { width: 280, height: 76, fontSize: 22, fill: opt.fill, hoverFill: opt.hoverFill }
      );
      this.add.existing(btn);

      this.add
        .text(cx, cy + 64, opt.detail, {
          fontFamily: FONTS.body,
          fontSize: '13px',
          color: hex(COLORS.bone),
          align: 'center',
          lineSpacing: 4,
          wordWrap: { width: 260 }
        })
        .setOrigin(0.5, 0);
    });
  }

  /** Renders the character status panel: hull bar, scrap, deck, relics. */
  private drawStatusPanel(x: number, y: number) {
    const width = DESIGN_W;
    const panelW = width - x * 2;
    const panelH = 220;

    // Panel background
    this.add
      .rectangle(width / 2, y + panelH / 2, panelW, panelH, COLORS.bgPanel)
      .setStrokeStyle(2, COLORS.brassDim);

    this.add
      .text(width / 2, y + 14, 'STATUS REPORT', {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const run = getRun();

    // Hull row — bar + numbers (left column)
    const leftX = x + 24;
    const colTop = y + 50;
    this.add
      .text(leftX, colTop, 'HULL', {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);

    this.drawHullBar(leftX, colTop + 24, 380, run.player.hull, run.player.maxHull);

    this.add
      .text(leftX + 396, colTop + 32, `${run.player.hull} / ${run.player.maxHull}`, {
        fontFamily: FONTS.display,
        fontSize: '15px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    // Scrap + deck (right column)
    const rightX = x + panelW - 220;
    this.add
      .text(rightX, colTop, 'SCRAP', {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);
    this.add
      .text(rightX + 80, colTop, `${run.scrap}`, {
        fontFamily: FONTS.display,
        fontSize: '17px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    this.add
      .text(rightX, colTop + 28, 'DECK', {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);
    this.add
      .text(rightX + 80, colTop + 28, `${run.player.deck.length} cards`, {
        fontFamily: FONTS.display,
        fontSize: '17px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    // Relics list (below hull bar)
    const relicsY = colTop + 76;
    this.add
      .text(leftX, relicsY, 'RELICS', {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);

    if (run.relics.length === 0) {
      this.add
        .text(leftX + 70, relicsY, 'none', {
          fontFamily: FONTS.body,
          fontSize: '13px',
          color: hex(COLORS.boneDim),
          fontStyle: 'italic'
        })
        .setOrigin(0, 0);
    } else {
      run.relics.forEach((id, i) => {
        const def = RELICS[id];
        if (!def) return;
        const rx = leftX + (i % 3) * 320;
        const ry = relicsY + 22 + Math.floor(i / 3) * 26;
        this.add
          .text(rx, ry, '★', {
            fontFamily: FONTS.display,
            fontSize: '14px',
            color: hex(COLORS.steam),
            fontStyle: 'bold'
          })
          .setOrigin(0, 0);
        this.add
          .text(rx + 22, ry, def.name, {
            fontFamily: FONTS.body,
            fontSize: '13px',
            color: hex(COLORS.bone)
          })
          .setOrigin(0, 0);
      });
    }
  }

  private drawHullBar(x: number, y: number, w: number, hull: number, maxHull: number) {
    const h = 18;
    const ratio = Math.max(0, Math.min(1, hull / maxHull));
    this.add
      .rectangle(x, y, w, h, COLORS.steelDark)
      .setStrokeStyle(2, COLORS.brassDim)
      .setOrigin(0, 0.5);
    if (ratio > 0) {
      const fillColor = ratio < 0.34 ? COLORS.danger : COLORS.hull;
      this.add
        .rectangle(x + 2, y, (w - 4) * ratio, h - 4, fillColor)
        .setOrigin(0, 0.5);
    }
  }

  private choose(boon: InterActBoon) {
    advanceAct(boon);
    this.cameras.main.fadeOut(280, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}

import Phaser from 'phaser';
import { getRun, advanceAct, type InterActBoon } from '../game/run';
import { RELICS } from '../game/relics';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { runTutorial } from '../ui/TutorialOverlay';
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
  private portrait = false;
  private viewW = 0;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super('InterAct');
  }

  create() {
    setupPause(this);
    const { width, height } = this.scale;
    this.viewW = width;
    this.portrait = height > width;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — quiet, post-victory glow
    const bg = this.add.graphics();
    bg.fillStyle(0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x1f1a16);
    bg.fillRect(0, height * 0.6, width, height * 0.4);
    bg.fillStyle(COLORS.rust, 0.08);
    bg.fillCircle(width / 2, height * 0.55, Math.min(380, width * 0.6));

    const run = getRun();

    // Title — shrinks on portrait so the header band doesn't eat the
    // status panel + boon column on a phone.
    const titleY = this.portrait ? 28 : 44;
    const titleSize = this.portrait ? 24 : 36;
    this.add
      .text(width / 2, titleY, `ACT ${run.act} COMPLETE`, {
        fontFamily: FONTS.display,
        fontSize: `${titleSize}px`,
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, titleY + titleSize + 8, interActFlavor(run.act), {
        fontFamily: FONTS.body,
        fontSize: this.portrait ? '11px' : '13px',
        color: hex(COLORS.boneDim),
        align: 'center',
        wordWrap: { width: Math.min(width - 32, 600) }
      })
      .setOrigin(0.5);

    const statusTop = this.portrait ? 80 : 120;
    const statusH = this.drawStatusPanel(statusTop);

    // Boon section. Portrait stacks the three boons vertically with
    // each detail block right below its button; landscape keeps the
    // historical three-column row.
    const boonHeaderY = statusTop + statusH + (this.portrait ? 18 : 40);
    this.add
      .text(width / 2, boonHeaderY, 'CHOOSE ONE BOON', {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '14px' : '18px',
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

    if (this.portrait) {
      const btnW = Math.min(width - 40, 320);
      const btnH = 56;
      const detailGap = 6;
      // Detail blocks vary in height (1 or 2 lines). Reserve enough
      // vertical room per option for the tallest case.
      const detailH = 32;
      const rowH = btnH + detailGap + detailH + 12;
      const top = boonHeaderY + 28;
      options.forEach((opt, i) => {
        const cy = top + btnH / 2 + i * rowH;
        const btn = new Button(
          this,
          width / 2,
          cy,
          opt.title,
          () => this.choose(opt.id),
          { width: btnW, height: btnH, fontSize: 18, fill: opt.fill, hoverFill: opt.hoverFill }
        );
        this.add.existing(btn);
        this.add
          .text(width / 2, cy + btnH / 2 + detailGap, opt.detail, {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.bone),
            align: 'center',
            lineSpacing: 3,
            wordWrap: { width: btnW - 8 }
          })
          .setOrigin(0.5, 0);
      });
    } else {
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

    runTutorial(this, 'interAct', [
      {
        title: 'BETWEEN ACTS',
        text:
          'You cleared an act — the wasteland deepens from here. Claim a boon to carry into ' +
          'the next act, then press on. Your Hull and deck come with you, so the choice ' +
          'compounds.'
      }
    ]);

    // Re-layout on rotation. Debounced because iOS Safari fires resize
    // twice on a single flip.
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
    });
  }

  private handleResize = () => {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      this.scene.restart();
    }, 120);
  };

  /** Renders the character status panel and returns the panel's pixel
   * height so callers can stack the next section below it. Landscape
   * keeps the two-column hull/scrap layout; portrait stacks everything
   * in a narrower single-column band. */
  private drawStatusPanel(y: number): number {
    const { viewW: width, portrait } = this;
    const run = getRun();

    if (portrait) {
      const margin = 16;
      const panelW = width - margin * 2;
      const padX = 14;
      const hullBarW = panelW - padX * 2 - 90; // leave room for `99/99` readout
      const relicsRowH = 22;
      const relicLines = Math.max(1, Math.ceil(run.relics.length / 2));
      const panelH = 16 + 16 + 26 + 26 + 26 + relicLines * relicsRowH + 14;
      const panelX = width / 2;
      const panelY = y + panelH / 2;

      this.add
        .rectangle(panelX, panelY, panelW, panelH, COLORS.bgPanel)
        .setStrokeStyle(2, COLORS.brassDim);

      this.add
        .text(panelX, y + 12, 'STATUS REPORT', {
          fontFamily: FONTS.display,
          fontSize: '12px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      const leftX = panelX - panelW / 2 + padX;
      let cursorY = y + 30;

      // Hull row — label + bar + value all on the same row.
      this.add
        .text(leftX, cursorY + 11, 'HULL', {
          fontFamily: FONTS.display,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0, 0.5);
      this.drawHullBar(leftX + 44, cursorY + 11, hullBarW - 44, run.player.hull, run.player.maxHull);
      this.add
        .text(panelX + panelW / 2 - padX, cursorY + 11, `${run.player.hull} / ${run.player.maxHull}`, {
          fontFamily: FONTS.display,
          fontSize: '12px',
          color: hex(COLORS.bone),
          fontStyle: 'bold'
        })
        .setOrigin(1, 0.5);
      cursorY += 26;

      // Scrap + deck on a single row, split left/right.
      this.add
        .text(leftX, cursorY + 8, 'SCRAP', {
          fontFamily: FONTS.display,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0, 0.5);
      this.add
        .text(leftX + 50, cursorY + 8, `${run.scrap}`, {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(COLORS.steam),
          fontStyle: 'bold'
        })
        .setOrigin(0, 0.5);
      this.add
        .text(panelX + 10, cursorY + 8, 'DECK', {
          fontFamily: FONTS.display,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0, 0.5);
      this.add
        .text(panelX + 50, cursorY + 8, `${run.player.deck.length} cards`, {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(COLORS.bone),
          fontStyle: 'bold'
        })
        .setOrigin(0, 0.5);
      cursorY += 26;

      // Relics
      this.add
        .text(leftX, cursorY + 8, 'RELICS', {
          fontFamily: FONTS.display,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0, 0.5);
      const relicsStartY = cursorY + 26;
      if (run.relics.length === 0) {
        this.add
          .text(leftX + 52, cursorY + 8, 'none', {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.boneDim),
            fontStyle: 'italic'
          })
          .setOrigin(0, 0.5);
      } else {
        const colW = panelW / 2 - padX;
        run.relics.forEach((id, i) => {
          const def = RELICS[id];
          if (!def) return;
          const rx = leftX + (i % 2) * colW;
          const ry = relicsStartY + Math.floor(i / 2) * relicsRowH;
          this.add
            .text(rx, ry, '★', {
              fontFamily: FONTS.display,
              fontSize: '11px',
              color: hex(COLORS.steam),
              fontStyle: 'bold'
            })
            .setOrigin(0, 0);
          this.add
            .text(rx + 14, ry, def.name, {
              fontFamily: FONTS.body,
              fontSize: '11px',
              color: hex(COLORS.bone)
            })
            .setOrigin(0, 0);
        });
      }
      return panelH;
    }

    // Landscape: original two-column layout.
    const x = 120;
    const panelW = width - x * 2;
    const panelH = 220;

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

    const run2 = run;
    const leftX = x + 24;
    const colTop = y + 50;
    this.add
      .text(leftX, colTop, 'HULL', {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);

    this.drawHullBar(leftX, colTop + 24, 380, run2.player.hull, run2.player.maxHull);

    this.add
      .text(leftX + 396, colTop + 32, `${run2.player.hull} / ${run2.player.maxHull}`, {
        fontFamily: FONTS.display,
        fontSize: '15px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    const rightX = x + panelW - 220;
    this.add
      .text(rightX, colTop, 'SCRAP', {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);
    this.add
      .text(rightX + 80, colTop, `${run2.scrap}`, {
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
      .text(rightX + 80, colTop + 28, `${run2.player.deck.length} cards`, {
        fontFamily: FONTS.display,
        fontSize: '17px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    const relicsY = colTop + 76;
    this.add
      .text(leftX, relicsY, 'RELICS', {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);

    if (run2.relics.length === 0) {
      this.add
        .text(leftX + 70, relicsY, 'none', {
          fontFamily: FONTS.body,
          fontSize: '13px',
          color: hex(COLORS.boneDim),
          fontStyle: 'italic'
        })
        .setOrigin(0, 0);
    } else {
      run2.relics.forEach((id, i) => {
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
    return panelH;
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

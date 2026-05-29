import Phaser from 'phaser';
import { loadMeta, buyUpgrade, META_UPGRADES, type UpgradeDef } from '../game/meta';
import { Button } from '../ui/Button';
import { DESIGN_W, DESIGN_H, applyDesignFit, bindDesignFitResize } from '../ui/sceneFit';
import { COLORS, FONTS, hex } from '../ui/theme';

interface RowRefs {
  level: Phaser.GameObjects.Text;
  cost: Phaser.GameObjects.Text;
  buy: Button;
}

export class WorkshopScene extends Phaser.Scene {
  private pointsText!: Phaser.GameObjects.Text;
  private rows = new Map<string, RowRefs>();

  constructor() {
    super('Workshop');
  }

  create() {
    this.rows = new Map();
    const width = DESIGN_W;
    const height = DESIGN_H;
    applyDesignFit(this);
    bindDesignFitResize(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — workshop bench feel
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.85, width, height * 0.15);
    bg.fillStyle(COLORS.brass, 0.06);
    bg.fillCircle(width / 2, 110, 280);

    this.add
      .text(width / 2, 50, 'WORKSHOP', {
        fontFamily: FONTS.display,
        fontSize: '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 92, 'Spend points to harden your mech before the next run.', {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    this.pointsText = this.add
      .text(width / 2, 124, '', {
        fontFamily: FONTS.display,
        fontSize: '20px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Slice 51 — 14 upgrades doesn't fit single-column at 720 px tall, so
    // split into two columns of 7 each. Column centers sit at ~width/4
    // and ~3*width/4 with a narrower row panel.
    const rowSpacing = 56;
    const startY = 165;
    const colXLeft = width / 4 + 30;
    const colXRight = (width * 3) / 4 - 30;
    const perColumn = Math.ceil(META_UPGRADES.length / 2);
    META_UPGRADES.forEach((def, i) => {
      const col = i < perColumn ? 0 : 1;
      const rowInCol = i % perColumn;
      const cx = col === 0 ? colXLeft : colXRight;
      this.buildRow(def, cx, startY + rowInCol * rowSpacing);
    });

    const back = new Button(
      this,
      width / 2,
      height - 60,
      'BACK',
      () => {
        this.cameras.main.fadeOut(180, 20, 17, 15);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
      },
      { width: 200, fontSize: 16, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(back);

    this.refresh();
  }

  private buildRow(def: UpgradeDef, x: number, y: number) {
    // Two-column layout: panels are narrower than the single-column
    // version. Description wraps if it pushes past the level/cost block.
    const panelW = 560;
    const panel = this.add
      .rectangle(x, y, panelW, 50, COLORS.bgPanel)
      .setStrokeStyle(2, COLORS.brassDim);
    void panel;

    const leftEdge = -panelW / 2 + 14;

    this.add
      .text(x + leftEdge, y - 10, def.name, {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + leftEdge, y + 10, def.description, {
        fontFamily: FONTS.body,
        fontSize: '10px',
        color: hex(COLORS.boneDim),
        wordWrap: { width: 340 }
      })
      .setOrigin(0, 0.5);

    const level = this.add
      .text(x + panelW / 2 - 110, y - 9, '', {
        fontFamily: FONTS.display,
        fontSize: '11px',
        color: hex(COLORS.bone)
      })
      .setOrigin(1, 0.5);

    const cost = this.add
      .text(x + panelW / 2 - 110, y + 9, '', {
        fontFamily: FONTS.display,
        fontSize: '11px',
        color: hex(COLORS.steam)
      })
      .setOrigin(1, 0.5);

    const buy = new Button(
      this,
      x + panelW / 2 - 48,
      y,
      'BUY',
      () => {
        if (buyUpgrade(def.id)) this.refresh();
      },
      { width: 80, height: 32, fontSize: 11 }
    );
    this.add.existing(buy);

    this.rows.set(def.id, { level, cost, buy });
  }

  private refresh() {
    const meta = loadMeta();
    this.pointsText.setText(`POINTS  ${meta.points}`);

    for (const def of META_UPGRADES) {
      const refs = this.rows.get(def.id);
      if (!refs) continue;
      const current = meta.levels[def.id] ?? 0;
      refs.level.setText(`LV ${current} / ${def.maxLevel}`);

      const maxed = current >= def.maxLevel;
      const affordable = meta.points >= def.costPerLevel;

      if (maxed) {
        refs.cost.setText('MAXED');
        refs.cost.setColor(hex(COLORS.boneDim));
      } else {
        refs.cost.setText(`Cost  ${def.costPerLevel}`);
        refs.cost.setColor(hex(affordable ? COLORS.steam : COLORS.danger));
      }

      refs.buy.setEnabled(!maxed && affordable);
      refs.buy.setLabel(maxed ? 'MAXED' : 'BUY');
    }
  }
}

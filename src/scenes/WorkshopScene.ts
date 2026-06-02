import Phaser from 'phaser';
import { loadMeta, buyUpgrade, META_UPGRADES, type UpgradeDef } from '../game/meta';
import { Button } from '../ui/Button';
import { runTutorial } from '../ui/TutorialOverlay';
import { COLORS, FONTS, hex } from '../ui/theme';

interface RowRefs {
  level: Phaser.GameObjects.Text;
  cost: Phaser.GameObjects.Text;
  buy: Button;
}

export class WorkshopScene extends Phaser.Scene {
  private pointsText!: Phaser.GameObjects.Text;
  private rows = new Map<string, RowRefs>();
  private portrait = false;
  private viewW = 0;

  // Portrait scroll layer — 14 upgrade rows don't fit a phone viewport
  // even single-column, so we wrap them in a translatable container
  // with wheel / drag scroll like MapScene + LibraryScene.
  private rowLayer: Phaser.GameObjects.Container | null = null;
  private scrollY = 0;
  private scrollMin = 0;
  private scrollMax = 0;
  private dragStart: { pointerY: number; scrollY: number } | null = null;
  private dragging = false;
  private viewportTop = 0;
  private viewportBottom = 0;
  private chevronUp: Phaser.GameObjects.Text | null = null;
  private chevronDown: Phaser.GameObjects.Text | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super('Workshop');
  }

  create() {
    this.rows = new Map();
    this.rowLayer = null;
    this.scrollY = 0;
    this.scrollMin = 0;
    this.scrollMax = 0;
    this.dragStart = null;
    this.dragging = false;
    this.chevronUp = null;
    this.chevronDown = null;

    const { width, height } = this.scale;
    this.viewW = width;
    this.portrait = height > width;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — workshop bench feel
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.85, width, height * 0.15);
    bg.fillStyle(COLORS.brass, 0.06);
    bg.fillCircle(width / 2, 110, Math.min(280, width * 0.5));

    this.add
      .text(width / 2, this.portrait ? 32 : 50, 'WORKSHOP', {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '26px' : '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, this.portrait ? 64 : 92, 'Spend points to harden your mech before the next run.', {
        fontFamily: FONTS.body,
        fontSize: this.portrait ? '11px' : '13px',
        color: hex(COLORS.boneDim),
        align: 'center',
        wordWrap: { width: Math.min(width - 32, 700) }
      })
      .setOrigin(0.5);

    this.pointsText = this.add
      .text(width / 2, this.portrait ? 88 : 124, '', {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '16px' : '20px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    if (this.portrait) {
      // Single-column scrollable list. Rows live in a translatable
      // layer between viewportTop and viewportBottom; chevrons signal
      // overflow in either direction.
      const headerH = 110;
      const footerH = 80;
      this.viewportTop = headerH;
      this.viewportBottom = height - footerH;
      this.rowLayer = this.add.container(0, 0);
      const rowSpacing = 78;
      const rowX = width / 2;
      META_UPGRADES.forEach((def, i) => {
        this.buildRow(def, rowX, headerH + 36 + i * rowSpacing);
      });

      // Scroll bounds: layer can pan up until the bottom of the last
      // row sits at viewportBottom; can pan down only as far as the
      // top of the first row at viewportTop (no positive scroll).
      const contentBottomY = headerH + 36 + (META_UPGRADES.length - 1) * rowSpacing + 36;
      this.scrollMax = 0;
      this.scrollMin = Math.min(0, this.viewportBottom - contentBottomY);

      this.drawScrollChevrons();
      this.attachScrollInput();
    } else {
      // Two-column layout: 14 upgrades don't fit single-column at
      // 720 px tall, so split into two columns of 7 each.
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
    }

    const back = new Button(
      this,
      width / 2,
      height - (this.portrait ? 36 : 60),
      'BACK',
      () => {
        this.cameras.main.fadeOut(180, 20, 17, 15);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
      },
      { width: 200, fontSize: 16, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(back);

    this.refresh();

    runTutorial(this, 'workshop', [
      {
        title: 'THE WORKSHOP',
        text:
          'Workshop Points are earned across your runs and never expire. Spend them here on ' +
          'permanent upgrades — bigger Hull, starting relics, sharper cards — so every future ' +
          'run begins a little stronger than the last.'
      }
    ]);

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

  private buildRow(def: UpgradeDef, x: number, y: number) {
    // Panel size adapts to viewport: portrait uses ~viewport width with
    // the BUY button stacked on the right, landscape keeps the 560 px
    // panel that the two-column layout was tuned for.
    const panelW = this.portrait ? Math.min(this.viewW - 24, 380) : 560;
    const panelH = this.portrait ? 70 : 50;
    const panel = this.add
      .rectangle(x, y, panelW, panelH, COLORS.bgPanel)
      .setStrokeStyle(2, COLORS.brassDim);

    const leftEdge = -panelW / 2 + (this.portrait ? 12 : 14);
    const nameSize = this.portrait ? '13px' : '14px';
    const descSize = this.portrait ? '10px' : '10px';
    const descWrap = this.portrait ? panelW - 130 : 340;

    const name = this.add
      .text(x + leftEdge, y - (this.portrait ? 18 : 10), def.name, {
        fontFamily: FONTS.display,
        fontSize: nameSize,
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    const desc = this.add
      .text(x + leftEdge, y + (this.portrait ? 4 : 10), def.description, {
        fontFamily: FONTS.body,
        fontSize: descSize,
        color: hex(COLORS.boneDim),
        wordWrap: { width: descWrap },
        lineSpacing: 2
      })
      .setOrigin(0, 0.5);

    const rightCol = x + panelW / 2 - (this.portrait ? 16 : 110);
    const level = this.add
      .text(rightCol, y - (this.portrait ? 22 : 9), '', {
        fontFamily: FONTS.display,
        fontSize: '11px',
        color: hex(COLORS.bone)
      })
      .setOrigin(1, 0.5);

    const cost = this.add
      .text(rightCol, y - (this.portrait ? 8 : -9), '', {
        fontFamily: FONTS.display,
        fontSize: '11px',
        color: hex(COLORS.steam)
      })
      .setOrigin(1, 0.5);

    const buyX = this.portrait
      ? x + panelW / 2 - 42
      : x + panelW / 2 - 48;
    const buyY = this.portrait ? y + 14 : y;
    const buy = new Button(
      this,
      buyX,
      buyY,
      'BUY',
      () => {
        if (buyUpgrade(def.id)) this.refresh();
      },
      { width: 72, height: this.portrait ? 28 : 32, fontSize: 11 }
    );

    if (this.portrait && this.rowLayer) {
      // Put everything in the scroll layer so it pans together.
      this.rowLayer.add([panel, name, desc, level, cost, buy]);
    } else {
      this.add.existing(buy);
    }
    void panel;

    this.rows.set(def.id, { level, cost, buy });
  }

  private drawScrollChevrons() {
    if (!this.portrait) return;
    const cx = this.viewW / 2;
    this.chevronUp = this.add
      .text(cx, this.viewportTop + 8, '▲', {
        fontFamily: FONTS.display,
        fontSize: '18px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);
    this.chevronDown = this.add
      .text(cx, this.viewportBottom - 8, '▼', {
        fontFamily: FONTS.display,
        fontSize: '18px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);
    this.tweens.add({
      targets: [this.chevronUp, this.chevronDown],
      alpha: { from: 0.4, to: 1 },
      y: { from: '-=3', to: '+=3' },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  private refreshChevrons() {
    if (this.chevronUp) this.chevronUp.setVisible(this.scrollY < this.scrollMax - 1);
    if (this.chevronDown) this.chevronDown.setVisible(this.scrollY > this.scrollMin + 1);
  }

  private setScroll(y: number) {
    this.scrollY = Math.max(this.scrollMin, Math.min(this.scrollMax, y));
    if (this.rowLayer) this.rowLayer.y = this.scrollY;
    this.refreshChevrons();
  }

  private attachScrollInput() {
    if (!this.portrait) return;
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
      this.setScroll(this.scrollY - dy);
    });
    const THRESHOLD = 8;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragStart = { pointerY: p.y, scrollY: this.scrollY };
      this.dragging = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragStart) return;
      const dy = p.y - this.dragStart.pointerY;
      if (!this.dragging && Math.abs(dy) >= THRESHOLD) this.dragging = true;
      if (this.dragging) this.setScroll(this.dragStart.scrollY + dy);
    });
    const end = () => {
      this.dragStart = null;
      this.time.delayedCall(0, () => { this.dragging = false; });
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
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
    this.refreshChevrons();
  }
}

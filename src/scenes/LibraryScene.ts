import Phaser from 'phaser';
import { CARDS } from '../game/cards';
import { RELICS } from '../game/relics';
import type { CardDef, CardRarity } from '../game/types';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { COLORS, FONTS, hex, RARITY_COLORS } from '../ui/theme';

type Tab = 'cards' | 'relics';

// Landscape cell geometry — historic desktop layout. Portrait derives
// its own narrower sizing from the live viewport (see rebuild()).
const CARD_CELL_W_L = 220;
const CARD_CELL_H_L = 130;
const CARD_COLS_L = 5;
const CARD_GAP_X_L = 12;
const CARD_GAP_Y_L = 14;

const RELIC_CELL_W_L = 460;
const RELIC_CELL_H_L = 70;
const RELIC_COLS_L = 2;
const RELIC_GAP_X_L = 20;
const RELIC_GAP_Y_L = 12;

// Rarity sort order so the card grid reads common-to-legendary.
const RARITY_ORDER: Record<CardRarity, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4
};

export class LibraryScene extends Phaser.Scene {
  private tab: Tab = 'cards';
  private content!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private scrollMin = 0;
  private scrollMax = 0;
  private dragStart: { pointerY: number; scrollY: number } | null = null;
  private dragging = false;
  private portrait = false;
  private viewW = 0;
  private viewH = 0;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private chevronUp: Phaser.GameObjects.Text | null = null;
  private chevronDown: Phaser.GameObjects.Text | null = null;
  private viewportTop = 0;
  private viewportBottom = 0;

  constructor() {
    super('Library');
  }

  create() {
    setupPause(this);
    const { width, height } = this.scale;
    this.viewW = width;
    this.viewH = height;
    this.portrait = height > width;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — quiet, ledger feel
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.84, width, height * 0.16);
    bg.fillStyle(COLORS.brass, 0.04);
    bg.fillCircle(width / 2, 110, Math.min(240, width * 0.4));

    // Title
    this.add
      .text(width / 2, this.portrait ? 28 : 36, 'LIBRARY', {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '26px' : '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, this.portrait ? 60 : 78, 'Every card and relic the wasteland can hand you.', {
        fontFamily: FONTS.body,
        fontSize: this.portrait ? '11px' : '12px',
        color: hex(COLORS.boneDim),
        align: 'center',
        wordWrap: { width: Math.min(width - 32, 700) }
      })
      .setOrigin(0.5);

    // Tab toggles — narrower in portrait so they fit side-by-side.
    const tabW = this.portrait ? Math.min((width - 48) / 2, 140) : 160;
    const tabY = this.portrait ? 90 : 116;
    const tabSpacing = tabW / 2 + 14;
    this.buildTab(width / 2 - tabSpacing, tabY, tabW, 'CARDS', 'cards');
    this.buildTab(width / 2 + tabSpacing, tabY, tabW, 'RELICS', 'relics');

    // Scroll layer — contents added by buildCards / buildRelics
    this.content = this.add.container(0, 0);
    this.rebuild();

    // BACK button. Portrait pins it bottom-center; landscape keeps the
    // bottom-left placement that the original layout used.
    const back = new Button(
      this,
      this.portrait ? width / 2 : 120,
      height - (this.portrait ? 36 : 50),
      'BACK',
      () => {
        this.cameras.main.fadeOut(180, 20, 17, 15);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
      },
      { width: 180, height: 44, fontSize: 14, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(back);

    // Scroll hint (landscape only — portrait has the chevrons + an
    // obvious touch-drag affordance).
    if (!this.portrait) {
      this.add
        .text(width / 2, height - 28, 'Scroll the list with the mouse wheel or drag.', {
          fontFamily: FONTS.body,
          fontSize: '10px',
          color: hex(COLORS.boneDim),
          fontStyle: 'italic'
        })
        .setOrigin(0.5);
    }

    this.drawScrollChevrons();
    this.attachScrollInput();

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

  private buildTab(x: number, y: number, w: number, label: string, tab: Tab) {
    const active = this.tab === tab;
    const btn = new Button(
      this,
      x,
      y,
      label,
      () => {
        if (this.tab === tab) return;
        this.tab = tab;
        this.scene.restart();
      },
      {
        // Slice 57 — tap-accessible 44 px height.
        width: w,
        height: 44,
        fontSize: 13,
        fill: active ? COLORS.brass : COLORS.steelDark,
        hoverFill: active ? COLORS.steam : COLORS.steel
      }
    );
    this.add.existing(btn);
  }

  private rebuild() {
    const { viewH: height, portrait } = this;
    this.content.removeAll(true);

    if (this.tab === 'cards') this.buildCards();
    else this.buildRelics();

    // Scroll bounds: viewport is between the tabs (y ~150 / portrait
    // ~124) and the BACK button (y ~height - 80 / portrait ~height -
    // 60).
    const top = portrait ? 124 : 150;
    const bottom = portrait ? height - 60 : height - 80;
    this.viewportTop = top;
    this.viewportBottom = bottom;
    const contentH = (this.content as Phaser.GameObjects.Container).getBounds().height + 40;
    this.scrollMax = top;
    this.scrollMin = bottom - contentH;
    if (this.scrollMin > this.scrollMax) this.scrollMin = this.scrollMax;
    this.setScroll(top); // start at the top
  }

  private buildCards() {
    // Base cards only (skip "+" variants — they show on hover, not as
    // their own grid entry). Sorted by rarity, then by name.
    const ids = Object.keys(CARDS)
      .filter((id) => !id.endsWith('+'))
      .filter((id) => CARDS[id].rarity !== undefined)
      .sort((a, b) => {
        const ra = RARITY_ORDER[CARDS[a].rarity ?? 'common'];
        const rb = RARITY_ORDER[CARDS[b].rarity ?? 'common'];
        if (ra !== rb) return ra - rb;
        return CARDS[a].name.localeCompare(CARDS[b].name);
      });

    const { viewW: width, portrait } = this;
    const cols = portrait ? 2 : CARD_COLS_L;
    const cellH = portrait ? 120 : CARD_CELL_H_L;
    const gapX = portrait ? 10 : CARD_GAP_X_L;
    const gapY = portrait ? 12 : CARD_GAP_Y_L;
    const margin = portrait ? 16 : 0;
    const cellW = portrait
      ? Math.floor((width - margin * 2 - (cols - 1) * gapX) / cols)
      : CARD_CELL_W_L;
    const gridW = cols * cellW + (cols - 1) * gapX;
    const startX = (width - gridW) / 2 + cellW / 2;
    const startY = cellH / 2;
    ids.forEach((id, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cellW + gapX);
      const cy = startY + row * (cellH + gapY);
      this.content.add(this.drawCardCell(CARDS[id], cx, cy, cellW, cellH));
    });
  }

  private buildRelics() {
    const ids = Object.keys(RELICS).sort((a, b) =>
      RELICS[a].name.localeCompare(RELICS[b].name)
    );
    const { viewW: width, portrait } = this;
    const cols = portrait ? 1 : RELIC_COLS_L;
    const cellH = portrait ? 84 : RELIC_CELL_H_L;
    const gapX = portrait ? 0 : RELIC_GAP_X_L;
    const gapY = portrait ? 10 : RELIC_GAP_Y_L;
    const margin = portrait ? 16 : 0;
    const cellW = portrait
      ? width - margin * 2
      : RELIC_CELL_W_L;
    const gridW = cols * cellW + (cols - 1) * gapX;
    const startX = (width - gridW) / 2 + cellW / 2;
    const startY = cellH / 2;
    ids.forEach((id, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cellW + gapX);
      const cy = startY + row * (cellH + gapY);
      this.content.add(this.drawRelicCell(RELICS[id], cx, cy, cellW, cellH));
    });
  }

  private drawCardCell(def: CardDef, cx: number, cy: number, cellW: number, cellH: number): Phaser.GameObjects.Container {
    const cell = this.add.container(cx, cy);
    const rarity = def.rarity ?? 'common';
    const borderColor = RARITY_COLORS[rarity];

    const bg = this.add.rectangle(0, 0, cellW, cellH, COLORS.bgPanel)
      .setStrokeStyle(2, borderColor);
    cell.add(bg);

    // Cost badge (top-left corner)
    const costColor = def.xCost ? COLORS.steam
      : def.unplayable ? COLORS.danger
      : COLORS.brass;
    const costStr = def.xCost ? 'X' : def.unplayable ? '—' : `${def.cost}`;
    const costBadge = this.add.circle(-cellW / 2 + 18, -cellH / 2 + 18, 13, COLORS.bgPanel)
      .setStrokeStyle(2, costColor);
    cell.add(costBadge);
    cell.add(this.add.text(-cellW / 2 + 18, -cellH / 2 + 18, costStr, {
      fontFamily: FONTS.display,
      fontSize: '13px',
      color: hex(costColor),
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Name (top center)
    cell.add(this.add.text(0, -cellH / 2 + 14, def.name, {
      fontFamily: FONTS.display,
      fontSize: '12px',
      color: hex(COLORS.bone),
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: cellW - 50 }
    }).setOrigin(0.5, 0));

    // Description (middle / bottom)
    cell.add(this.add.text(0, -10, def.description, {
      fontFamily: FONTS.body,
      fontSize: '10px',
      color: hex(COLORS.boneDim),
      align: 'center',
      lineSpacing: 2,
      wordWrap: { width: cellW - 16 }
    }).setOrigin(0.5, 0));

    // Rarity label (bottom)
    cell.add(this.add.text(0, cellH / 2 - 12, rarity.toUpperCase(), {
      fontFamily: FONTS.display,
      fontSize: '9px',
      color: hex(borderColor),
      fontStyle: 'bold'
    }).setOrigin(0.5));

    return cell;
  }

  private drawRelicCell(def: { name: string; description: string; signature?: boolean }, cx: number, cy: number, cellW: number, cellH: number): Phaser.GameObjects.Container {
    const cell = this.add.container(cx, cy);
    const accent = def.signature ? COLORS.danger : COLORS.brass;

    const bg = this.add.rectangle(0, 0, cellW, cellH, COLORS.bgPanel)
      .setStrokeStyle(2, accent);
    cell.add(bg);

    // Star icon (left)
    const iconX = -cellW / 2 + 26;
    cell.add(this.add.circle(iconX, 0, 18, COLORS.bgPanel).setStrokeStyle(2, accent));
    cell.add(this.add.text(iconX, 0, '★', {
      fontFamily: FONTS.display,
      fontSize: '18px',
      color: hex(accent),
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Name (top)
    const textX = -cellW / 2 + 56;
    cell.add(this.add.text(textX, -cellH / 2 + 8, def.name, {
      fontFamily: FONTS.display,
      fontSize: '13px',
      color: hex(COLORS.bone),
      fontStyle: 'bold'
    }).setOrigin(0, 0));

    // Description (wraps)
    cell.add(this.add.text(textX, -cellH / 2 + 28, def.description, {
      fontFamily: FONTS.body,
      fontSize: '11px',
      color: hex(COLORS.boneDim),
      wordWrap: { width: cellW - 80 },
      lineSpacing: 2
    }).setOrigin(0, 0));

    // Signature tag (bottom-right)
    if (def.signature) {
      cell.add(this.add.text(cellW / 2 - 8, cellH / 2 - 4, 'BOSS DROP', {
        fontFamily: FONTS.display,
        fontSize: '9px',
        color: hex(COLORS.danger),
        fontStyle: 'bold'
      }).setOrigin(1, 1));
    }

    return cell;
  }

  private drawScrollChevrons() {
    if (!this.portrait) return;
    const cx = this.viewW / 2;
    this.chevronUp = this.add
      .text(cx, this.viewportTop + 4, '▲', {
        fontFamily: FONTS.display,
        fontSize: '18px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);
    this.chevronDown = this.add
      .text(cx, this.viewportBottom - 4, '▼', {
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
    this.refreshChevrons();
  }

  private refreshChevrons() {
    // scrollY < scrollMax → we've scrolled past the initial top, content
    // is above the viewport → show UP arrow.
    // scrollY > scrollMin → there's still room to scroll further down →
    // show DOWN arrow.
    if (this.chevronUp) this.chevronUp.setVisible(this.scrollY < this.scrollMax - 1);
    if (this.chevronDown) this.chevronDown.setVisible(this.scrollY > this.scrollMin + 1);
  }

  private setScroll(y: number) {
    this.scrollY = Math.max(this.scrollMin, Math.min(this.scrollMax, y));
    this.content.y = this.scrollY;
    this.refreshChevrons();
  }

  private attachScrollInput() {
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
      this.setScroll(this.scrollY - dy);
    });
    // Slice 57 — bumped 6 → 8 for touch-friendly drag detection.
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
}

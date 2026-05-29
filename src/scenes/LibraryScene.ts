import Phaser from 'phaser';
import { CARDS } from '../game/cards';
import { RELICS } from '../game/relics';
import type { CardDef, CardRarity } from '../game/types';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { COLORS, FONTS, hex, RARITY_COLORS } from '../ui/theme';

type Tab = 'cards' | 'relics';

// Cell geometry shared across both tabs. Cells are sized to read at a
// glance — name + cost on top row, description wrapped underneath.
const CARD_CELL_W = 220;
const CARD_CELL_H = 130;
const CARD_COLS = 5;
const CARD_GAP_X = 12;
const CARD_GAP_Y = 14;

const RELIC_CELL_W = 460;
const RELIC_CELL_H = 70;
const RELIC_COLS = 2;
const RELIC_GAP_X = 20;
const RELIC_GAP_Y = 12;

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

  constructor() {
    super('Library');
  }

  create() {
    setupPause(this);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — quiet, ledger feel
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.84, width, height * 0.16);
    bg.fillStyle(COLORS.brass, 0.04);
    bg.fillCircle(width / 2, 110, 240);

    // Title
    this.add
      .text(width / 2, 36, 'LIBRARY', {
        fontFamily: FONTS.display,
        fontSize: '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 78, 'Every card and relic the wasteland can hand you.', {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    // Tab toggles
    this.buildTab(width / 2 - 110, 116, 'CARDS', 'cards');
    this.buildTab(width / 2 + 110, 116, 'RELICS', 'relics');

    // Scroll layer — contents added by buildCards / buildRelics
    this.content = this.add.container(0, 0);
    this.rebuild();

    // BACK button
    const back = new Button(
      this,
      120,
      height - 50,
      'BACK',
      () => {
        this.cameras.main.fadeOut(180, 20, 17, 15);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
      },
      { width: 180, height: 44, fontSize: 14, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(back);

    // Scroll hint
    this.add
      .text(width / 2, height - 28, 'Scroll the list with the mouse wheel or drag.', {
        fontFamily: FONTS.body,
        fontSize: '10px',
        color: hex(COLORS.boneDim),
        fontStyle: 'italic'
      })
      .setOrigin(0.5);

    this.attachScrollInput();
  }

  private buildTab(x: number, y: number, label: string, tab: Tab) {
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
        width: 160,
        height: 36,
        fontSize: 13,
        fill: active ? COLORS.brass : COLORS.steelDark,
        hoverFill: active ? COLORS.steam : COLORS.steel
      }
    );
    this.add.existing(btn);
  }

  private rebuild() {
    const { width, height } = this.scale;
    this.content.removeAll(true);

    if (this.tab === 'cards') this.buildCards();
    else this.buildRelics();

    // Scroll bounds: viewport is between the tabs (y ~150) and the BACK
    // button (y ~height - 80). Below = scrollMax (showing the top of
    // content), above = scrollMin (showing the bottom).
    const top = 150;
    const bottom = height - 80;
    const viewportH = bottom - top;
    const contentH = (this.content as Phaser.GameObjects.Container).getBounds().height + 40;
    this.scrollMax = top;
    this.scrollMin = bottom - contentH;
    if (this.scrollMin > this.scrollMax) this.scrollMin = this.scrollMax;
    this.setScroll(top); // start at the top
    void width; void viewportH;
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

    const { width } = this.scale;
    const gridW = CARD_COLS * CARD_CELL_W + (CARD_COLS - 1) * CARD_GAP_X;
    const startX = (width - gridW) / 2 + CARD_CELL_W / 2;
    const startY = CARD_CELL_H / 2;
    ids.forEach((id, i) => {
      const col = i % CARD_COLS;
      const row = Math.floor(i / CARD_COLS);
      const cx = startX + col * (CARD_CELL_W + CARD_GAP_X);
      const cy = startY + row * (CARD_CELL_H + CARD_GAP_Y);
      this.content.add(this.drawCardCell(CARDS[id], cx, cy));
    });
  }

  private buildRelics() {
    const ids = Object.keys(RELICS).sort((a, b) =>
      RELICS[a].name.localeCompare(RELICS[b].name)
    );
    const { width } = this.scale;
    const gridW = RELIC_COLS * RELIC_CELL_W + (RELIC_COLS - 1) * RELIC_GAP_X;
    const startX = (width - gridW) / 2 + RELIC_CELL_W / 2;
    const startY = RELIC_CELL_H / 2;
    ids.forEach((id, i) => {
      const col = i % RELIC_COLS;
      const row = Math.floor(i / RELIC_COLS);
      const cx = startX + col * (RELIC_CELL_W + RELIC_GAP_X);
      const cy = startY + row * (RELIC_CELL_H + RELIC_GAP_Y);
      this.content.add(this.drawRelicCell(RELICS[id], cx, cy));
    });
  }

  private drawCardCell(def: CardDef, cx: number, cy: number): Phaser.GameObjects.Container {
    const cell = this.add.container(cx, cy);
    const rarity = def.rarity ?? 'common';
    const borderColor = RARITY_COLORS[rarity];

    const bg = this.add.rectangle(0, 0, CARD_CELL_W, CARD_CELL_H, COLORS.bgPanel)
      .setStrokeStyle(2, borderColor);
    cell.add(bg);

    // Cost badge (top-left corner)
    const costColor = def.xCost ? COLORS.steam
      : def.unplayable ? COLORS.danger
      : COLORS.brass;
    const costStr = def.xCost ? 'X' : def.unplayable ? '—' : `${def.cost}`;
    const costBadge = this.add.circle(-CARD_CELL_W / 2 + 18, -CARD_CELL_H / 2 + 18, 13, COLORS.bgPanel)
      .setStrokeStyle(2, costColor);
    cell.add(costBadge);
    cell.add(this.add.text(-CARD_CELL_W / 2 + 18, -CARD_CELL_H / 2 + 18, costStr, {
      fontFamily: FONTS.display,
      fontSize: '14px',
      color: hex(costColor),
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Name (top center)
    cell.add(this.add.text(0, -CARD_CELL_H / 2 + 14, def.name, {
      fontFamily: FONTS.display,
      fontSize: '13px',
      color: hex(COLORS.bone),
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: CARD_CELL_W - 50 }
    }).setOrigin(0.5, 0));

    // Description (middle / bottom)
    cell.add(this.add.text(0, -10, def.description, {
      fontFamily: FONTS.body,
      fontSize: '10px',
      color: hex(COLORS.boneDim),
      align: 'center',
      lineSpacing: 2,
      wordWrap: { width: CARD_CELL_W - 16 }
    }).setOrigin(0.5, 0));

    // Rarity label (bottom)
    cell.add(this.add.text(0, CARD_CELL_H / 2 - 14, rarity.toUpperCase(), {
      fontFamily: FONTS.display,
      fontSize: '9px',
      color: hex(borderColor),
      fontStyle: 'bold'
    }).setOrigin(0.5));

    return cell;
  }

  private drawRelicCell(def: { name: string; description: string; signature?: boolean }, cx: number, cy: number): Phaser.GameObjects.Container {
    const cell = this.add.container(cx, cy);
    const accent = def.signature ? COLORS.danger : COLORS.brass;

    const bg = this.add.rectangle(0, 0, RELIC_CELL_W, RELIC_CELL_H, COLORS.bgPanel)
      .setStrokeStyle(2, accent);
    cell.add(bg);

    // Star icon (left)
    const iconX = -RELIC_CELL_W / 2 + 26;
    cell.add(this.add.circle(iconX, 0, 18, COLORS.bgPanel).setStrokeStyle(2, accent));
    cell.add(this.add.text(iconX, 0, '★', {
      fontFamily: FONTS.display,
      fontSize: '18px',
      color: hex(accent),
      fontStyle: 'bold'
    }).setOrigin(0.5));

    // Name (top)
    const textX = -RELIC_CELL_W / 2 + 56;
    cell.add(this.add.text(textX, -RELIC_CELL_H / 2 + 8, def.name, {
      fontFamily: FONTS.display,
      fontSize: '13px',
      color: hex(COLORS.bone),
      fontStyle: 'bold'
    }).setOrigin(0, 0));

    // Description (wraps)
    cell.add(this.add.text(textX, -RELIC_CELL_H / 2 + 28, def.description, {
      fontFamily: FONTS.body,
      fontSize: '11px',
      color: hex(COLORS.boneDim),
      wordWrap: { width: RELIC_CELL_W - 80 },
      lineSpacing: 2
    }).setOrigin(0, 0));

    // Signature tag (bottom-right)
    if (def.signature) {
      cell.add(this.add.text(RELIC_CELL_W / 2 - 8, RELIC_CELL_H / 2 - 4, 'BOSS DROP', {
        fontFamily: FONTS.display,
        fontSize: '9px',
        color: hex(COLORS.danger),
        fontStyle: 'bold'
      }).setOrigin(1, 1));
    }

    return cell;
  }

  private setScroll(y: number) {
    this.scrollY = Math.max(this.scrollMin, Math.min(this.scrollMax, y));
    this.content.y = this.scrollY;
  }

  private attachScrollInput() {
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
      this.setScroll(this.scrollY - dy);
    });
    const THRESHOLD = 6;
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

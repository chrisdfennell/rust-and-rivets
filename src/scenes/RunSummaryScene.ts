import Phaser from 'phaser';
import { getRun, clearSavedRun } from '../game/run';
import { encodeRunCode } from '../game/seedcode';
import { CARDS } from '../game/cards';
import { RELICS } from '../game/relics';
import {
  unlockNextAscensionIfApplicable,
  ASCENSION_TIERS,
  MAX_ASCENSION,
  recordRunWin
} from '../game/meta';
import { Button } from '../ui/Button';
import { runTutorial } from '../ui/TutorialOverlay';
import { COLORS, FONTS, hex } from '../ui/theme';

export class RunSummaryScene extends Phaser.Scene {
  private portrait = false;
  private viewW = 0;
  private content!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private scrollMin = 0;
  private scrollMax = 0;
  private dragStart: { pointerY: number; scrollY: number } | null = null;
  private dragging = false;
  private chevronUp: Phaser.GameObjects.Text | null = null;
  private chevronDown: Phaser.GameObjects.Text | null = null;
  private viewportTop = 0;
  private viewportBottom = 0;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super('RunSummary');
  }

  create() {
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

    const run = getRun();
    const won = run.result === 'victory';
    const clearedAscension = run.ascension ?? 0;
    const newHighest = won
      ? unlockNextAscensionIfApplicable(clearedAscension)
      : null;
    const newlyUnlocked = won && newHighest !== null && newHighest > clearedAscension;
    if (won) recordRunWin(run.player.characterId, clearedAscension);

    // Quiet backdrop. Slightly warmer for victory, dimmer for defeat.
    const bg = this.add.graphics();
    bg.fillStyle(won ? 0x1f1a16 : 0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f, 0.6);
    bg.fillRect(0, height * 0.7, width, height * 0.3);

    // Title
    this.add
      .text(width / 2, this.portrait ? 36 : 60, won ? 'RUN COMPLETE' : 'RUN LOST', {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '30px' : '44px',
        color: hex(won ? COLORS.ok : COLORS.danger),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, this.portrait ? 70 : 100,
        won
          ? 'Stormheart\'s wreck cools behind you. The horizon opens.'
          : 'Your mech goes dark in the dust. The road keeps going for someone.', {
            fontFamily: FONTS.body,
            fontSize: this.portrait ? '11px' : '14px',
            color: hex(COLORS.boneDim),
            align: 'center',
            wordWrap: { width: Math.min(width - 32, 800) }
          })
      .setOrigin(0.5);

    // Ascension banner.
    let ascensionH = 0;
    if (clearedAscension > 0 || newlyUnlocked) {
      const lineText = newlyUnlocked && newHighest !== null && newHighest <= MAX_ASCENSION
        ? `CLEARED ASCENSION ${clearedAscension} — UNLOCKED ASCENSION ${newHighest}: ${ASCENSION_TIERS[newHighest - 1]?.name ?? '?'}`
        : `CLEARED ASCENSION ${clearedAscension}`;
      this.add
        .text(width / 2, this.portrait ? 100 : 130, lineText, {
          fontFamily: FONTS.display,
          fontSize: this.portrait ? '11px' : '13px',
          color: hex(newlyUnlocked ? COLORS.steam : COLORS.danger),
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: Math.min(width - 32, 900) }
        })
        .setOrigin(0.5);
      ascensionH = this.portrait ? 24 : 30;
    }

    // Derived stats
    const stats = run.stats ?? {
      biggestHit: 0, totalTurns: 0, potionsUsed: 0,
      combatsWon: 0, elitesDefeated: 0
    };
    const floors = deepestFloor(run);
    const startingDeckSize = 10;
    const cardsDrafted = Math.max(0, run.player.deck.length - startingDeckSize);

    // Shareable code for this exact run (pilot + seed). Surfaced as a stat
    // row and copied by the COPY RUN CODE button — paste it on the pilot
    // screen to replay the identical map / encounters / rewards.
    const runCode = encodeRunCode(run.player.characterId, run.seed);

    const rows: Array<[string, string]> = [
      ['RESULT', won ? 'Victory' : 'Defeat'],
      ['ACT REACHED', String(run.act)],
      ['FLOORS REACHED', String(floors)],
      ['COMBATS WON', String(stats.combatsWon)],
      ['ELITES DEFEATED', String(stats.elitesDefeated)],
      ['BIGGEST HIT', String(stats.biggestHit)],
      ['TURNS PLAYED', String(stats.totalTurns)],
      ['POTIONS USED', String(stats.potionsUsed)],
      ['HULL', `${Math.max(0, run.player.hull)} / ${run.player.maxHull}`],
      ['SCRAP', String(run.scrap)],
      ['DECK SIZE', String(run.player.deck.length)],
      ['CARDS DRAFTED', String(cardsDrafted)],
      ['RUN CODE', runCode]
    ];

    const deckCounts = countDeck(run.player.deck);
    const sortedDeck = [...deckCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    if (this.portrait) {
      // Portrait stacks STATS → DECK → RELICS inside a single scrollable
      // column. The content is taller than the viewport once the deck +
      // relic strip pad it out, so a scroll layer + chevrons match the
      // pattern used elsewhere.
      const headerH = 100 + ascensionH;
      const footerH = 114; // COPY RUN CODE + RETURN TO TITLE
      this.viewportTop = headerH;
      this.viewportBottom = height - footerH;
      this.content = this.add.container(0, 0);

      let cy = headerH + 12;
      const colW = Math.min(width - 32, 360);
      const colX = width / 2 - colW / 2;

      // Stats two-column inside a panel band
      const statRowH = 22;
      this.content.add(
        this.add.text(width / 2, cy, 'STATS', {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        }).setOrigin(0.5)
      );
      cy += 22;
      rows.forEach(([label, value]) => {
        this.content.add(
          this.add.text(colX + 12, cy, label, {
            fontFamily: FONTS.display,
            fontSize: '11px',
            color: hex(COLORS.boneDim)
          }).setOrigin(0, 0.5)
        );
        this.content.add(
          this.add.text(colX + colW - 12, cy, value, {
            fontFamily: FONTS.display,
            fontSize: '12px',
            color: hex(COLORS.bone),
            fontStyle: 'bold'
          }).setOrigin(1, 0.5)
        );
        cy += statRowH;
      });
      cy += 6;

      // Final deck
      this.content.add(
        this.add.text(width / 2, cy, 'FINAL DECK', {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        }).setOrigin(0.5)
      );
      cy += 20;
      const deckCols = 2;
      const deckColW = colW / deckCols;
      const deckRowH = 18;
      sortedDeck.forEach(([cardId, count], i) => {
        const def = CARDS[cardId];
        const name = def?.name ?? cardId;
        const display = count > 1 ? `${name} ×${count}` : name;
        const col = i % deckCols;
        const row = Math.floor(i / deckCols);
        const x = colX + col * deckColW + 8;
        const y = cy + row * deckRowH;
        this.content.add(
          this.add.text(x, y, display, {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.bone),
            wordWrap: { width: deckColW - 12 }
          }).setOrigin(0, 0.5)
        );
      });
      cy += Math.ceil(sortedDeck.length / deckCols) * deckRowH + 12;

      // Relic strip — single column in portrait so names stay legible.
      this.content.add(
        this.add.text(width / 2, cy, `RELICS COLLECTED — ${run.relics.length}`, {
          fontFamily: FONTS.display,
          fontSize: '12px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        }).setOrigin(0.5)
      );
      cy += 18;
      run.relics.forEach((id) => {
        const def = RELICS[id];
        this.content.add(
          this.add.text(width / 2, cy, def?.name ?? id, {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.boneDim)
          }).setOrigin(0.5)
        );
        cy += 16;
      });
      const contentBottomY = cy + 12;
      this.scrollMax = 0;
      this.scrollMin = Math.min(0, this.viewportBottom - contentBottomY);
      this.drawScrollChevrons();
      this.attachScrollInput();

      // Copy + return buttons pinned to the actual bottom.
      const btnW = Math.min(width - 60, 280);
      const copy = new Button(
        this,
        width / 2,
        height - 74,
        'COPY RUN CODE',
        () => this.copyRunCode(runCode),
        { width: btnW, fontSize: 14, fill: COLORS.steelDark, hoverFill: COLORS.steel }
      );
      this.add.existing(copy);
      const back = new Button(
        this,
        width / 2,
        height - 36,
        'RETURN TO TITLE',
        () => this.returnToTitle(),
        { width: btnW, fontSize: 15 }
      );
      this.add.existing(back);
    } else {
      // Landscape — original two-column layout.
      const statsX = width * 0.25;
      const statsTop = 160;
      const rowH = 26;
      rows.forEach(([label, value], i) => {
        const y = statsTop + i * rowH;
        this.add
          .text(statsX - 140, y, label, {
            fontFamily: FONTS.display,
            fontSize: '13px',
            color: hex(COLORS.boneDim)
          })
          .setOrigin(0, 0.5);
        this.add
          .text(statsX + 140, y, value, {
            fontFamily: FONTS.display,
            fontSize: '14px',
            color: hex(COLORS.bone),
            fontStyle: 'bold'
          })
          .setOrigin(1, 0.5);
      });

      const deckX = width * 0.7;
      this.add
        .text(deckX, statsTop - 26, 'FINAL DECK', {
          fontFamily: FONTS.display,
          fontSize: '14px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      const cols = 2;
      const rowHDeck = 18;
      const colW = 200;
      sortedDeck.forEach(([cardId, count], i) => {
        const def = CARDS[cardId];
        const name = def?.name ?? cardId;
        const display = count > 1 ? `${name} ×${count}` : name;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = deckX - colW / 2 + col * colW;
        const y = statsTop + row * rowHDeck;
        this.add
          .text(x, y, display, {
            fontFamily: FONTS.body,
            fontSize: '12px',
            color: hex(COLORS.bone)
          })
          .setOrigin(0, 0.5);
      });

      const relicY = height - 130;
      this.add
        .text(width / 2, relicY - 24, `RELICS COLLECTED — ${run.relics.length}`, {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      const relicSpacing = Math.min(120, (width - 200) / Math.max(1, run.relics.length));
      const relicStartX = width / 2 - ((run.relics.length - 1) * relicSpacing) / 2;
      run.relics.forEach((id, i) => {
        const def = RELICS[id];
        const x = relicStartX + i * relicSpacing;
        this.add
          .text(x, relicY, def?.name ?? id, {
            fontFamily: FONTS.body,
            fontSize: '10px',
            color: hex(COLORS.boneDim),
            align: 'center',
            wordWrap: { width: relicSpacing - 8 }
          })
          .setOrigin(0.5);
      });

      const copy = new Button(
        this,
        width / 2 - 150,
        height - 50,
        'COPY RUN CODE',
        () => this.copyRunCode(runCode),
        { width: 220, fontSize: 14, fill: COLORS.steelDark, hoverFill: COLORS.steel }
      );
      this.add.existing(copy);
      const back = new Button(
        this,
        width / 2 + 150,
        height - 50,
        'RETURN TO TITLE',
        () => this.returnToTitle(),
        { width: 220, fontSize: 16 }
      );
      this.add.existing(back);
    }

    // Keyboard shortcut: SPACE or ENTER also returns.
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-SPACE', () => this.returnToTitle());
      this.input.keyboard.once('keydown-ENTER', () => this.returnToTitle());
    }

    runTutorial(this, 'runSummary', [
      {
        title: 'RUN SUMMARY',
        text:
          'However the run ended, this is the tally. Win or lose, you keep the Workshop Points ' +
          'you earned — take them back to the Workshop and come back stronger.'
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

  private drawScrollChevrons() {
    if (!this.portrait) return;
    const cx = this.viewW / 2;
    this.chevronUp = this.add
      .text(cx, this.viewportTop + 4, '▲', {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);
    this.chevronDown = this.add
      .text(cx, this.viewportBottom - 4, '▼', {
        fontFamily: FONTS.display,
        fontSize: '16px',
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
    if (this.chevronUp) this.chevronUp.setVisible(this.scrollY < this.scrollMax - 1);
    if (this.chevronDown) this.chevronDown.setVisible(this.scrollY > this.scrollMin + 1);
  }

  private setScroll(y: number) {
    this.scrollY = Math.max(this.scrollMin, Math.min(this.scrollMax, y));
    if (this.content) this.content.y = this.scrollY;
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

  // Copy the run code to the clipboard and flash a confirmation. Falls back
  // to showing the code (so the player can copy by hand) if the Clipboard API
  // is unavailable — e.g. an insecure context or an old browser.
  private copyRunCode(code: string) {
    const clip = (navigator as Navigator | undefined)?.clipboard;
    if (clip?.writeText) {
      clip.writeText(code).then(
        () => this.flashToast('RUN CODE COPIED'),
        () => this.flashToast(code)
      );
    } else {
      this.flashToast(code);
    }
  }

  private flashToast(message: string) {
    const toast = this.add
      .text(this.viewW / 2, this.scale.height * 0.5, message, {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(COLORS.bg),
        backgroundColor: hex(COLORS.brass),
        padding: { x: 14, y: 8 },
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: { from: 0, to: 1 },
      duration: 140,
      yoyo: true,
      hold: 900,
      onComplete: () => toast.destroy()
    });
  }

  private returnToTitle() {
    // Wipe the finished run so Title shows the "no saved run" state.
    clearSavedRun();
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
  }
}

function deepestFloor(run: ReturnType<typeof getRun>): number {
  let max = 0;
  for (const id of run.visitedNodeIds) {
    const node = run.map.nodes.get(id);
    if (node && node.floor > max) max = node.floor;
  }
  return max;
}

function countDeck(deck: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const id of deck) out.set(id, (out.get(id) ?? 0) + 1);
  return out;
}

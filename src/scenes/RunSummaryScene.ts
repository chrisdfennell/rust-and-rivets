import Phaser from 'phaser';
import { getRun, clearSavedRun } from '../game/run';
import { CARDS } from '../game/cards';
import { RELICS } from '../game/relics';
import {
  unlockNextAscensionIfApplicable,
  ASCENSION_TIERS,
  MAX_ASCENSION,
  recordRunWin
} from '../game/meta';
import { Button } from '../ui/Button';
import { COLORS, FONTS, hex } from '../ui/theme';

export class RunSummaryScene extends Phaser.Scene {
  constructor() {
    super('RunSummary');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    const run = getRun();
    const won = run.result === 'victory';
    const clearedAscension = run.ascension ?? 0;
    // On victory, bump the unlocked-ascension cap if applicable. Captured
    // BEFORE clearSavedRun() is called by the button (we want to know if
    // this clear was a new top-tier unlock so we can show the banner).
    const newHighest = won
      ? unlockNextAscensionIfApplicable(clearedAscension)
      : null;
    const newlyUnlocked = won && newHighest !== null && newHighest > clearedAscension;
    // Slice 55 — record the win in the persistent history ledger. Idempotent
    // for the same RunSummary mount because runsWon counts on victory entry,
    // not on Continue-press. Scene only mounts once per finished run.
    if (won) recordRunWin(run.player.characterId, clearedAscension);

    // Quiet backdrop. Slightly warmer for victory, dimmer for defeat.
    const bg = this.add.graphics();
    bg.fillStyle(won ? 0x1f1a16 : 0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f, 0.6);
    bg.fillRect(0, height * 0.7, width, height * 0.3);

    // Title
    this.add
      .text(width / 2, 60, won ? 'RUN COMPLETE' : 'RUN LOST', {
        fontFamily: FONTS.display,
        fontSize: '44px',
        color: hex(won ? COLORS.ok : COLORS.danger),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 100,
        won
          ? 'Stormheart\'s wreck cools behind you. The horizon opens.'
          : 'Your mech goes dark in the dust. The road keeps going for someone.', {
            fontFamily: FONTS.body,
            fontSize: '14px',
            color: hex(COLORS.boneDim)
          })
      .setOrigin(0.5);

    // Ascension banner — only shown if the player was running a tier or
    // just unlocked the next one. Renders between the flavor line and the
    // stats grid.
    if (clearedAscension > 0 || newlyUnlocked) {
      const lineText = newlyUnlocked && newHighest !== null && newHighest <= MAX_ASCENSION
        ? `CLEARED ASCENSION ${clearedAscension} — UNLOCKED ASCENSION ${newHighest}: ${ASCENSION_TIERS[newHighest - 1]?.name ?? '?'}`
        : `CLEARED ASCENSION ${clearedAscension}`;
      this.add
        .text(width / 2, 130, lineText, {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(newlyUnlocked ? COLORS.steam : COLORS.danger),
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
    }

    // Derived stats
    const stats = run.stats ?? {
      biggestHit: 0, totalTurns: 0, potionsUsed: 0,
      combatsWon: 0, elitesDefeated: 0
    };
    const floors = deepestFloor(run);
    const startingDeckSize = 10; // close enough for the "cards drafted" derivation
    const cardsDrafted = Math.max(0, run.player.deck.length - startingDeckSize);

    // ----- Stats grid (two columns, left half of screen) -----
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
      ['CARDS DRAFTED', String(cardsDrafted)]
    ];

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

    // ----- Deck panel (right half) -----
    const deckX = width * 0.7;
    this.add
      .text(deckX, statsTop - 26, 'FINAL DECK', {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const deckCounts = countDeck(run.player.deck);
    const sortedDeck = [...deckCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
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

    // ----- Relics strip (across the bottom) -----
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

    // ----- Return to Title -----
    const back = new Button(
      this,
      width / 2,
      height - 50,
      'RETURN TO TITLE',
      () => this.returnToTitle(),
      { width: 260, fontSize: 16 }
    );
    this.add.existing(back);

    // Keyboard shortcut: SPACE or ENTER also returns.
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-SPACE', () => this.returnToTitle());
      this.input.keyboard.once('keydown-ENTER', () => this.returnToTitle());
    }
  }

  private returnToTitle() {
    // Wipe the finished run so Title shows the "no saved run" state instead
    // of letting the player Continue back into a victory/defeat overlay.
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

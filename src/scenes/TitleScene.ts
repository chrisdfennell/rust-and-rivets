import Phaser from 'phaser';
import {
  getRun,
  startRun,
  hasSavedRun,
  loadSavedRun,
  clearSavedRun
} from '../game/run';
import { Button } from '../ui/Button';
import { COLORS, FONTS, hex } from '../ui/theme';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop: smokestacks silhouette
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.6, width, height * 0.4);

    // Distant smokestacks with rising smoke
    bg.fillStyle(0x2a2018);
    for (let i = 0; i < 9; i++) {
      const x = 60 + i * 140;
      const h = 60 + ((i * 37) % 90);
      bg.fillRect(x, height * 0.6 - h, 18, h);
      bg.fillRect(x - 4, height * 0.6 - h - 6, 26, 6);
    }
    // Faint smoke puffs
    bg.fillStyle(COLORS.boneDim, 0.08);
    for (let i = 0; i < 9; i++) {
      const x = 60 + i * 140 + 8;
      const baseY = height * 0.6 - (60 + ((i * 37) % 90)) - 30;
      bg.fillCircle(x, baseY, 18);
      bg.fillCircle(x + 12, baseY - 20, 14);
      bg.fillCircle(x - 8, baseY - 36, 10);
    }

    // Title
    this.add
      .text(width / 2, height * 0.28, 'RUST & RIVETS', {
        fontFamily: FONTS.display,
        fontSize: '72px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.28 + 60, 'a dieselpunk deckbuilder', {
        fontFamily: FONTS.body,
        fontSize: '16px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    // Run summary if save exists
    const haveSave = hasSavedRun();
    if (haveSave) {
      // We need a peek without committing to load. Easiest: load it now and
      // overwrite if the user picks NEW RUN.
      const peeked = loadSavedRun();
      if (peeked) {
        const visited = peeked.visitedNodeIds.size;
        const resultLine =
          peeked.result === 'victory' ? 'Run completed.' :
          peeked.result === 'defeat' ? 'Run lost.' :
          `Floor ${this.deepestVisitedFloor(peeked.visitedNodeIds, peeked.map)} of ${peeked.map.floors - 1}`;
        this.add
          .text(width / 2, height * 0.52,
            `SAVED RUN\nHull ${peeked.player.hull}/${peeked.player.maxHull}   ` +
            `Scrap ${peeked.scrap}   Deck ${peeked.player.deck.length}   Cleared ${visited}\n` +
            resultLine,
            {
              fontFamily: FONTS.body,
              fontSize: '14px',
              color: hex(COLORS.bone),
              align: 'center',
              lineSpacing: 8
            })
          .setOrigin(0.5);
      }
    }

    // Buttons
    const continueBtn = new Button(
      this,
      width / 2 - 130,
      height * 0.75,
      'CONTINUE',
      () => this.continueRun(),
      { width: 220, height: 56, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf }
    );
    continueBtn.setEnabled(haveSave);
    this.add.existing(continueBtn);

    const newRunBtn = new Button(
      this,
      width / 2 + 130,
      height * 0.75,
      'NEW RUN',
      () => this.newRun(),
      { width: 220, height: 56, fontSize: 18 }
    );
    this.add.existing(newRunBtn);

    if (!haveSave) {
      this.add
        .text(width / 2, height * 0.75 + 50, 'No saved run found.', {
          fontFamily: FONTS.body,
          fontSize: '12px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height - 24, 'Your run auto-saves between rooms.', {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5, 1);
  }

  private deepestVisitedFloor(visited: Set<string>, map: { nodes: Map<string, { floor: number }> }): number {
    let max = 0;
    for (const id of visited) {
      const node = map.nodes.get(id);
      if (node && node.floor > max) max = node.floor;
    }
    return max;
  }

  private continueRun() {
    // loadSavedRun was already called for the preview, so getRun() now returns it.
    const r = getRun();
    const sceneKey = this.routeForCurrentRun(r);
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
  }

  private newRun() {
    clearSavedRun();
    startRun();
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }

  private routeForCurrentRun(r: ReturnType<typeof getRun>): string {
    if (r.result !== 'inProgress') return 'Map';
    if (r.pendingReward) return 'Reward';
    if (r.currentNodeId) {
      const node = r.map.nodes.get(r.currentNodeId);
      const inProgressNode = node && !r.visitedNodeIds.has(node.id);
      if (inProgressNode) {
        if (node.kind === 'shop') return 'Shop';
        if (node.kind === 'rest') return 'Rest';
        return 'Combat'; // combat, elite, or boss
      }
    }
    return 'Map';
  }
}

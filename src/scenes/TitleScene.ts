import Phaser from 'phaser';
import {
  getRun,
  hasSavedRun,
  loadSavedRun
} from '../game/run';
import {
  loadMeta,
  exportSaveJson,
  importSaveJson,
  setCurrentAscension,
  ASCENSION_TIERS,
  MAX_ASCENSION
} from '../game/meta';
import { Button } from '../ui/Button';
import { preloadMusic, startMusic, setMusicMuted, isMusicMuted } from '../audio/music';
import { setSfxMuted, isSfxMuted } from '../audio/sfx';
import { COLORS, FONTS, hex } from '../ui/theme';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  preload() {
    preloadMusic(this);
  }

  create() {
    startMusic(this);
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

    // Slice 55 — records panel in the top-right corner. Tiny, info-dense,
    // shows the player's lifetime stats so the title screen reads as a
    // hub instead of a blank gate.
    this.buildRecordsPanel(width - 30, 30);

    // Slice 57 — portrait-orientation hint. The game's design canvas is
    // 16:9 landscape; on a portrait phone Phaser's FIT mode shrinks it
    // dramatically and adds wide letterbox bars. Surface a soft rotate
    // hint so first-time mobile players know to flip the phone. Driven
    // by the BROWSER viewport (not the design canvas) so it tracks the
    // actual device orientation.
    this.refreshOrientationHint();
    this.scale.on('resize', this.refreshOrientationHint, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.refreshOrientationHint, this);
    });

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
          peeked.awaitingInterAct ? `Act ${peeked.act} cleared — choose a boon.` :
          `Act ${peeked.act}, Floor ${this.deepestVisitedFloor(peeked.visitedNodeIds, peeked.map)} of ${peeked.map.floors - 1}`;
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

    // Meta-progression banner (workshop points)
    const meta = loadMeta();
    this.add
      .text(width / 2, height * 0.62, `WORKSHOP POINTS  ${meta.points}`, {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(meta.points > 0 ? COLORS.steam : COLORS.boneDim),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Ascension selector — only shown once the player has at least one
    // tier unlocked. Tap < / > to cycle through 0..highestAscension.
    if (meta.highestAscension > 0) {
      this.buildAscensionSelector(width / 2, height * 0.69, meta);
    }

    // Primary buttons: CONTINUE / NEW RUN / WORKSHOP
    const primaryY = height * 0.75;
    const continueBtn = new Button(
      this,
      width / 2 - 240,
      primaryY,
      'CONTINUE',
      () => this.continueRun(),
      { width: 210, height: 56, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf }
    );
    continueBtn.setEnabled(haveSave);
    this.add.existing(continueBtn);

    const newRunBtn = new Button(
      this,
      width / 2,
      primaryY,
      'NEW RUN',
      () => this.newRun(),
      { width: 210, height: 56, fontSize: 18 }
    );
    this.add.existing(newRunBtn);

    const workshopBtn = new Button(
      this,
      width / 2 + 240,
      primaryY,
      'WORKSHOP',
      () => this.openWorkshop(),
      { width: 210, height: 56, fontSize: 18, fill: COLORS.brass, hoverFill: COLORS.steam }
    );
    this.add.existing(workshopBtn);

    if (!haveSave) {
      this.add
        .text(width / 2 - 240, primaryY + 36, 'No saved run found.', {
          fontFamily: FONTS.body,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0.5);
    }

    // Secondary buttons: EXPORT / LIBRARY / IMPORT
    const secondaryY = primaryY + 90;
    const exportBtn = new Button(
      this,
      width / 2 - 220,
      secondaryY,
      'EXPORT SAVE',
      () => this.doExport(),
      { width: 180, height: 40, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(exportBtn);

    // Slice 55 — LIBRARY: browses every card and relic in the game.
    const libraryBtn = new Button(
      this,
      width / 2,
      secondaryY,
      'LIBRARY',
      () => {
        this.cameras.main.fadeOut(180, 20, 17, 15);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Library'));
      },
      { width: 180, height: 40, fontSize: 13, fill: COLORS.brass, hoverFill: COLORS.steam }
    );
    this.add.existing(libraryBtn);

    const importBtn = new Button(
      this,
      width / 2 + 220,
      secondaryY,
      'IMPORT SAVE',
      () => this.doImport(),
      { width: 180, height: 40, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(importBtn);

    // Wire up window-level drag-and-drop. While a file is being dragged
    // over the page, the IMPORT button switches to "DROP TO IMPORT" so
    // the player knows where to release it.
    this.setupFileDrop(importBtn);

    // Audio mute toggles
    const audioY = secondaryY + 44;
    this.makeMuteToggle(
      width / 2 - 120,
      audioY,
      'MUSIC',
      isMusicMuted,
      (m) => setMusicMuted(m)
    );
    this.makeMuteToggle(
      width / 2 + 120,
      audioY,
      'SFX',
      isSfxMuted,
      (m) => setSfxMuted(m)
    );

    this.add
      .text(width / 2, height - 8, 'Your run auto-saves between rooms.  ·  Drop a save file anywhere to import.', {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5, 1);
  }

  // Slice 57 — portrait orientation hint.
  // Stored on the scene so we can replace it on resize. Removed when
  // landscape is restored. Reads window.innerWidth/Height directly so it
  // reflects the actual device orientation rather than the design canvas.
  private orientationHint: Phaser.GameObjects.Container | null = null;

  private refreshOrientationHint = () => {
    // Tear down the previous hint so we don't stack overlays on
    // repeated resize events.
    this.orientationHint?.destroy();
    this.orientationHint = null;
    // Only show on actually narrow viewports — bigger displays always
    // get the landscape layout regardless of window aspect.
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    const isPortrait = h > w;
    const isSmallEnough = Math.min(w, h) < 700;
    if (!isPortrait || !isSmallEnough) return;

    const { width, height } = this.scale;
    const hint = this.add.container(width / 2, height / 2);
    const panel = this.add.rectangle(0, 0, 460, 120, COLORS.bgPanel, 0.9)
      .setStrokeStyle(2, COLORS.brass);
    hint.add(panel);
    hint.add(this.add.text(0, -22, '↺  ROTATE FOR BEST EXPERIENCE', {
      fontFamily: FONTS.display,
      fontSize: '16px',
      color: hex(COLORS.brass),
      fontStyle: 'bold'
    }).setOrigin(0.5));
    hint.add(this.add.text(0, 14, 'Rust & Rivets is laid out for landscape.\nTurn your phone sideways and you\'re set.', {
      fontFamily: FONTS.body,
      fontSize: '11px',
      color: hex(COLORS.bone),
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5));
    hint.setDepth(2000);
    this.orientationHint = hint;
  };

  // Slice 55 — small RECORDS card in the top-right. Origin is top-right
  // so the panel anchors to (x, y) regardless of label width.
  private buildRecordsPanel(rightX: number, topY: number) {
    const meta = loadMeta();
    const h = meta.history;
    if (!h) return;
    const panelW = 200;
    const panelH = 132;
    const panel = this.add
      .rectangle(rightX, topY, panelW, panelH, COLORS.bgPanel, 0.85)
      .setStrokeStyle(2, COLORS.brassDim)
      .setOrigin(1, 0);
    void panel;
    const titleY = topY + 12;
    this.add
      .text(rightX - panelW / 2, titleY, 'RECORDS', {
        fontFamily: FONTS.display,
        fontSize: '13px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    // Stats grid. Two-column rows: label left-aligned at the panel's
    // left edge, value right-aligned at the panel's right edge.
    const leftX = rightX - panelW + 14;
    const valueX = rightX - 14;
    const winRate = h.runsStarted > 0
      ? Math.round((h.runsWon / h.runsStarted) * 100)
      : 0;
    const rows: [string, string][] = [
      ['Runs', `${h.runsStarted}`],
      ['Wins', `${h.runsWon}`],
      ['Best Act', h.bestAct > 0 ? `${h.bestAct}` : '—'],
      ['Bosses', `${h.bossesDefeated}`],
      ['Win rate', `${winRate}%`]
    ];
    rows.forEach(([label, value], i) => {
      const ry = topY + 38 + i * 17;
      this.add
        .text(leftX, ry, label, {
          fontFamily: FONTS.body,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0, 0);
      this.add
        .text(valueX, ry, value, {
          fontFamily: FONTS.display,
          fontSize: '12px',
          color: hex(COLORS.bone),
          fontStyle: 'bold'
        })
        .setOrigin(1, 0);
    });
  }

  // Renders the ASCENSION X selector at (x, y). Re-renders on click by
  // restarting the scene — keeps the state plumbing local to TitleScene.
  private buildAscensionSelector(x: number, y: number, meta: ReturnType<typeof loadMeta>) {
    const level = meta.currentAscension;
    const tier = level > 0 ? ASCENSION_TIERS[level - 1] : null;
    const label = level === 0 ? 'ASCENSION  0  (base)' : `ASCENSION  ${level}  —  ${tier?.name}`;
    this.add
      .text(x, y - 8, label, {
        fontFamily: FONTS.display,
        fontSize: '15px',
        color: hex(level > 0 ? COLORS.danger : COLORS.boneDim),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    if (tier) {
      this.add
        .text(x, y + 12, tier.description, {
          fontFamily: FONTS.body,
          fontSize: '11px',
          color: hex(COLORS.boneDim),
          align: 'center'
        })
        .setOrigin(0.5);
    }
    // < / > cycle buttons
    // Slice 57 — bumped from 40×32 to 56×44 for touch friendliness.
    // Apple's HIG and Google's Material both recommend ≥44 pt as the
    // minimum hit area. Visual character (<, >) is unchanged.
    const dec = new Button(
      this,
      x - 220,
      y + 2,
      '<',
      () => this.cycleAscension(-1),
      { width: 56, height: 44, fontSize: 18, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(dec);
    dec.setEnabled(level > 0);

    const inc = new Button(
      this,
      x + 220,
      y + 2,
      '>',
      () => this.cycleAscension(1),
      { width: 56, height: 44, fontSize: 18, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(inc);
    inc.setEnabled(level < meta.highestAscension && level < MAX_ASCENSION);
  }

  private cycleAscension(delta: number) {
    const m = loadMeta();
    const next = Math.max(0, Math.min(m.highestAscension, m.currentAscension + delta));
    if (next === m.currentAscension) return;
    setCurrentAscension(next);
    this.scene.restart();
  }

  private makeMuteToggle(
    x: number,
    y: number,
    name: string,
    getter: () => boolean,
    setter: (m: boolean) => void
  ): Button {
    const labelFor = (m: boolean) => (m ? `UNMUTE ${name}` : `MUTE ${name}`);
    let btn: Button;
    btn = new Button(
      this,
      x,
      y,
      labelFor(getter()),
      () => {
        const next = !getter();
        setter(next);
        btn.setLabel(labelFor(next));
      },
      // Slice 57 — bumped 36 → 44 for tap-target accessibility.
      { width: 200, height: 44, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(btn);
    return btn;
  }

  private openWorkshop() {
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Workshop'));
  }

  private doExport() {
    const json = exportSaveJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Timestamp in the filename makes multiple exports easy to tell apart
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `rust-and-rivets-save-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast('Save downloaded.');
  }

  private doImport() {
    // Hidden file picker — browsers won't allow programmatic .click()
    // unless triggered from a user gesture, which this is (button click).
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (file) void this.importFromFile(file);
    });
    document.body.appendChild(input);
    input.click();
  }

  private async importFromFile(file: File) {
    try {
      const text = await file.text();
      const result = importSaveJson(text);
      this.toast(result.message);
      if (result.ok) {
        this.time.delayedCall(900, () => this.scene.restart());
      }
    } catch {
      this.toast('Could not read file.');
    }
  }

  // Drag-and-drop import. We listen on the window so the player can drop
  // anywhere on the page — the IMPORT button just visually highlights to
  // signal where the drop "logically" lands. Listeners are torn down on
  // scene shutdown so they don't leak across scene transitions.
  private setupFileDrop(importBtn: Button) {
    const originalLabel = 'IMPORT SAVE';
    const dropLabel = 'DROP TO IMPORT';
    let highlighted = false;

    // dragenter/dragleave fire for child elements too, so we count entries
    // rather than toggling on each event.
    let dragDepth = 0;

    const isFileDrag = (e: DragEvent) =>
      !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');

    const highlight = (on: boolean) => {
      if (on === highlighted) return;
      highlighted = on;
      importBtn.setLabel(on ? dropLabel : originalLabel);
    };

    const onDragEnter = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragDepth++;
      highlight(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) highlight(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragDepth = 0;
      highlight(false);
      const file = e.dataTransfer?.files[0];
      if (file) void this.importFromFile(file);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    this.events.once('shutdown', () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    });
  }

  private toast(message: string) {
    const { width, height } = this.scale;
    const y = height - 70;
    const txt = this.add
      .text(width / 2, y, message, {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.bone),
        backgroundColor: '#1f1a16',
        padding: { x: 14, y: 8 },
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(2000)
      .setAlpha(0);
    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 150,
      yoyo: true,
      hold: 1400,
      onComplete: () => txt.destroy()
    });
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
    // Route to pilot selection first; character pick triggers startRun()
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CharacterSelect'));
  }

  private routeForCurrentRun(r: ReturnType<typeof getRun>): string {
    if (r.result !== 'inProgress') return 'Map';
    if (r.awaitingInterAct) return 'InterAct';
    if (r.pendingReward) return 'Reward';
    if (r.currentNodeId) {
      const node = r.map.nodes.get(r.currentNodeId);
      const inProgressNode = node && !r.visitedNodeIds.has(node.id);
      if (inProgressNode) {
        if (node.kind === 'shop') return 'Shop';
        if (node.kind === 'rest') return 'Rest';
        if (node.kind === 'event') return 'Event';
        return 'Combat'; // combat, elite, or boss
      }
    }
    return 'Map';
  }
}

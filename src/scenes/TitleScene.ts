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

  // Slice 57 — debounce timer for resize-triggered scene restart.
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  create() {
    startMusic(this);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    // Slice 57 — portrait flag drives the responsive layout below.
    // Phaser's RESIZE mode hands us the actual viewport, so flipping a
    // phone from landscape to portrait makes width < height here.
    const portrait = height > width;

    // Backdrop: smokestacks silhouette
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.6, width, height * 0.4);

    // Distant smokestacks with rising smoke. Spacing adapts so portrait
    // / narrow viewports get fewer, evenly-spread stacks instead of a
    // few cutting through the visible area.
    bg.fillStyle(0x2a2018);
    const stackCount = Math.max(5, Math.floor(width / 140));
    const stackSpacing = width / stackCount;
    const stackHeights: number[] = [];
    for (let i = 0; i < stackCount; i++) {
      const x = stackSpacing / 2 + i * stackSpacing;
      const h = 60 + ((i * 37) % 90);
      stackHeights.push(h);
      bg.fillRect(x - 9, height * 0.6 - h, 18, h);
      bg.fillRect(x - 13, height * 0.6 - h - 6, 26, 6);
    }
    bg.fillStyle(COLORS.boneDim, 0.08);
    for (let i = 0; i < stackCount; i++) {
      const x = stackSpacing / 2 + i * stackSpacing + 4;
      const baseY = height * 0.6 - stackHeights[i] - 30;
      bg.fillCircle(x, baseY, 18);
      bg.fillCircle(x + 12, baseY - 20, 14);
      bg.fillCircle(x - 8, baseY - 36, 10);
    }

    // Records panel in the top-right corner.
    this.buildRecordsPanel(width - 30, 30);

    // Title — scales with viewport so a narrow phone screen doesn't
    // get a title that clips off the side. Caps at the original 72px
    // on a desktop window.
    const titleSize = Math.min(72, Math.max(36, Math.floor(width / 18)));
    const subtitleSize = Math.min(16, Math.max(11, Math.floor(width / 70)));
    this.add
      .text(width / 2, height * (portrait ? 0.14 : 0.28), 'RUST & RIVETS', {
        fontFamily: FONTS.display,
        fontSize: `${titleSize}px`,
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * (portrait ? 0.14 : 0.28) + titleSize * 0.85, 'a dieselpunk deckbuilder', {
        fontFamily: FONTS.body,
        fontSize: `${subtitleSize}px`,
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    // Saved-run summary. Positioned higher in portrait so the button
    // stack below has room.
    const haveSave = hasSavedRun();
    const summaryY = height * (portrait ? 0.26 : 0.52);
    if (haveSave) {
      const peeked = loadSavedRun();
      if (peeked) {
        const visited = peeked.visitedNodeIds.size;
        const resultLine =
          peeked.result === 'victory' ? 'Run completed.' :
          peeked.result === 'defeat' ? 'Run lost.' :
          peeked.awaitingInterAct ? `Act ${peeked.act} cleared — choose a boon.` :
          `Act ${peeked.act}, Floor ${this.deepestVisitedFloor(peeked.visitedNodeIds, peeked.map)} of ${peeked.map.floors - 1}`;
        this.add
          .text(width / 2, summaryY,
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

    // Workshop points banner.
    const meta = loadMeta();
    this.add
      .text(width / 2, height * (portrait ? 0.34 : 0.62), `WORKSHOP POINTS  ${meta.points}`, {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(meta.points > 0 ? COLORS.steam : COLORS.boneDim),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Ascension selector.
    if (meta.highestAscension > 0) {
      this.buildAscensionSelector(width / 2, height * (portrait ? 0.39 : 0.69), meta);
    }

    // ===== Buttons. Landscape uses the original 3-across rows; portrait
    // stacks them vertically so each button stays touch-friendly. =====
    const cx = width / 2;
    const btnW = portrait ? Math.min(width - 40, 320) : 210;
    const btnH = 56;
    if (portrait) {
      // Vertical stack: CONTINUE / NEW RUN / WORKSHOP / LIBRARY / EXPORT /
      // IMPORT / MUSIC / SFX. Each row 64 px tall (button + 8 gap).
      let y = height * 0.46;
      const continueBtn = new Button(this, cx, y, 'CONTINUE', () => this.continueRun(),
        { width: btnW, height: btnH, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf });
      continueBtn.setEnabled(haveSave);
      this.add.existing(continueBtn);
      y += 64;
      this.add.existing(new Button(this, cx, y, 'NEW RUN', () => this.newRun(),
        { width: btnW, height: btnH, fontSize: 18 }));
      y += 64;
      this.add.existing(new Button(this, cx, y, 'WORKSHOP', () => this.openWorkshop(),
        { width: btnW, height: btnH, fontSize: 18, fill: COLORS.brass, hoverFill: COLORS.steam }));
      y += 64;
      this.add.existing(new Button(this, cx, y, 'LIBRARY',
        () => {
          this.cameras.main.fadeOut(180, 20, 17, 15);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Library'));
        },
        { width: btnW, height: 44, fontSize: 14, fill: COLORS.brass, hoverFill: COLORS.steam }));
      y += 52;
      // EXPORT and IMPORT side-by-side, half-width each (or full-width
      // when the viewport is too narrow even for that).
      const halfW = btnW > 200 ? (btnW - 12) / 2 : btnW;
      if (halfW < 140) {
        // Two rows
        this.add.existing(new Button(this, cx, y, 'EXPORT SAVE', () => this.doExport(),
          { width: btnW, height: 44, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
        y += 52;
        const importBtn = new Button(this, cx, y, 'IMPORT SAVE', () => this.doImport(),
          { width: btnW, height: 44, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel });
        this.add.existing(importBtn);
        this.setupFileDrop(importBtn);
        y += 52;
      } else {
        this.add.existing(new Button(this, cx - halfW / 2 - 6, y, 'EXPORT', () => this.doExport(),
          { width: halfW, height: 44, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
        const importBtn = new Button(this, cx + halfW / 2 + 6, y, 'IMPORT', () => this.doImport(),
          { width: halfW, height: 44, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel });
        this.add.existing(importBtn);
        this.setupFileDrop(importBtn);
        y += 52;
      }
      const halfMute = btnW > 200 ? (btnW - 12) / 2 : btnW;
      this.makeMuteToggle(cx - halfMute / 2 - 6, y, 'MUSIC', isMusicMuted, (m) => setMusicMuted(m), halfMute);
      this.makeMuteToggle(cx + halfMute / 2 + 6, y, 'SFX', isSfxMuted, (m) => setSfxMuted(m), halfMute);
    } else {
      // ===== Landscape (original layout, slightly de-magicked) =====
      const primaryY = height * 0.75;
      const continueBtn = new Button(this, cx - 240, primaryY, 'CONTINUE', () => this.continueRun(),
        { width: 210, height: 56, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf });
      continueBtn.setEnabled(haveSave);
      this.add.existing(continueBtn);
      this.add.existing(new Button(this, cx, primaryY, 'NEW RUN', () => this.newRun(),
        { width: 210, height: 56, fontSize: 18 }));
      this.add.existing(new Button(this, cx + 240, primaryY, 'WORKSHOP', () => this.openWorkshop(),
        { width: 210, height: 56, fontSize: 18, fill: COLORS.brass, hoverFill: COLORS.steam }));
      if (!haveSave) {
        this.add
          .text(cx - 240, primaryY + 36, 'No saved run found.', {
            fontFamily: FONTS.body, fontSize: '11px', color: hex(COLORS.boneDim)
          })
          .setOrigin(0.5);
      }
      const secondaryY = primaryY + 90;
      this.add.existing(new Button(this, cx - 220, secondaryY, 'EXPORT SAVE', () => this.doExport(),
        { width: 180, height: 40, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
      this.add.existing(new Button(this, cx, secondaryY, 'LIBRARY',
        () => {
          this.cameras.main.fadeOut(180, 20, 17, 15);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Library'));
        },
        { width: 180, height: 40, fontSize: 13, fill: COLORS.brass, hoverFill: COLORS.steam }));
      const importBtn = new Button(this, cx + 220, secondaryY, 'IMPORT SAVE', () => this.doImport(),
        { width: 180, height: 40, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel });
      this.add.existing(importBtn);
      this.setupFileDrop(importBtn);
      const audioY = secondaryY + 60;
      this.makeMuteToggle(cx - 120, audioY, 'MUSIC', isMusicMuted, (m) => setMusicMuted(m));
      this.makeMuteToggle(cx + 120, audioY, 'SFX', isSfxMuted, (m) => setSfxMuted(m));
    }

    // Footer status line
    this.add
      .text(width / 2, height - 8, 'Your run auto-saves between rooms.  ·  Drop a save file anywhere to import.', {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.boneDim),
        align: 'center',
        wordWrap: { width: width - 20 }
      })
      .setOrigin(0.5, 1);

    // Slice 57 — re-layout on viewport changes. Debounced so a window
    // drag-resize doesn't restart the scene 60×/second.
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = null;
      }
    });
  }

  // Slice 57 — restart the scene after a short debounce so the layout
  // re-flows for the new viewport / orientation.
  private handleResize = () => {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      this.scene.restart();
    }, 120);
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
    setter: (m: boolean) => void,
    customWidth?: number
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
      // Slice 57 — 200×44 default for tap-target accessibility; portrait
      // layout passes a narrower customWidth so two toggles fit side-by-side.
      { width: customWidth ?? 200, height: 44, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel }
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

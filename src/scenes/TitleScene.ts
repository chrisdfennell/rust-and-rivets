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
    // Slice 59 — RESIZE mode gives us the real viewport here, so the
    // responsive layout reads from `this.scale.*` directly.
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const portrait = height > width;
    const compact = portrait || width < 900 || height < 700;

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

    // Slice 58 — records is now a tap-to-open popover (was an always-on
    // panel that collided with the title in portrait). The button sits
    // in the top-right corner; tapping it pops the stats overlay.
    this.buildRecordsButton(width - 12, 12);

    // Title size scales with viewport so a narrow phone screen doesn't
    // get a title that clips off the side. Caps at the original 72px
    // on a desktop window.
    const titleSize = Math.min(72, Math.max(36, Math.floor(width / 18)));
    const subtitleSize = Math.min(16, Math.max(11, Math.floor(width / 70)));
    const haveSave = hasSavedRun();
    const meta = loadMeta();
    const cx = width / 2;

    // Slice 58 — landscape uses the original % positions. Compact uses
    // SEQUENTIAL top-down flow with absolute gaps so smaller viewports
    // (~680 tall and below) don't compress headers into each other.
    let topCursor = compact ? 24 : height * 0.28;
    // Title (origin top-center)
    this.add
      .text(cx, topCursor, 'RUST & RIVETS', {
        fontFamily: FONTS.display,
        fontSize: `${titleSize}px`,
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, compact ? 0 : 0.5);
    topCursor += compact ? titleSize + 4 : titleSize * 0.85;

    this.add
      .text(cx, topCursor, 'a dieselpunk deckbuilder', {
        fontFamily: FONTS.body,
        fontSize: `${subtitleSize}px`,
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5, compact ? 0 : 0.5);
    topCursor += compact ? subtitleSize + 18 : 0;

    // Saved-run summary (3 lines).
    if (haveSave) {
      const peeked = loadSavedRun();
      if (peeked) {
        const visited = peeked.visitedNodeIds.size;
        const resultLine =
          peeked.result === 'victory' ? 'Run completed.' :
          peeked.result === 'defeat' ? 'Run lost.' :
          peeked.awaitingInterAct ? `Act ${peeked.act} cleared — choose a boon.` :
          `Act ${peeked.act}, Floor ${this.deepestVisitedFloor(peeked.visitedNodeIds, peeked.map)} of ${peeked.map.floors - 1}`;
        const summaryY = compact ? topCursor : height * 0.52;
        this.add
          .text(cx, summaryY,
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
          .setOrigin(0.5, compact ? 0 : 0.5);
        if (compact) topCursor += 60;
      }
    }

    // Workshop points banner.
    const workshopY = compact ? topCursor : height * 0.62;
    this.add
      .text(cx, workshopY, `WORKSHOP POINTS  ${meta.points}`, {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(meta.points > 0 ? COLORS.steam : COLORS.boneDim),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, compact ? 0 : 0.5);
    if (compact) topCursor += 26;

    // Ascension selector.
    if (meta.highestAscension > 0) {
      const ascY = compact ? topCursor + 10 : height * 0.69;
      this.buildAscensionSelector(cx, ascY, meta);
      if (compact) topCursor += 42;
    }

    // ===== Buttons. Three layouts:
    // - PORTRAIT: vertical stack (one button per row)
    // - COMPACT LANDSCAPE: two horizontal rows of 4 (per user feedback,
    //   slightly smaller buttons that all fit at heights 500-700)
    // - FULL LANDSCAPE: original 3-across primary + 3-across secondary =====
    const portraitStack = portrait;
    if (portraitStack) {
      // Slice 58 — true portrait. Stack one button per row.
      const btnWp = Math.min(width - 40, 320);
      const footerH = 24;
      const remaining = height - topCursor - footerH - 12;
      const rowCount = 7;
      const rowPitch = Math.max(48, Math.min(60, Math.floor(remaining / rowCount)));
      const mainH = Math.min(50, rowPitch - 6);
      let y = topCursor + 12 + mainH / 2;
      const continueBtn = new Button(this, cx, y, 'CONTINUE', () => this.continueRun(),
        { width: btnWp, height: mainH, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf });
      continueBtn.setEnabled(haveSave);
      this.add.existing(continueBtn);
      y += rowPitch;
      this.add.existing(new Button(this, cx, y, 'NEW RUN', () => this.newRun(),
        { width: btnWp, height: mainH, fontSize: 18 }));
      y += rowPitch;
      this.add.existing(new Button(this, cx, y, 'WORKSHOP', () => this.openWorkshop(),
        { width: btnWp, height: mainH, fontSize: 18, fill: COLORS.brass, hoverFill: COLORS.steam }));
      y += rowPitch;
      this.add.existing(new Button(this, cx, y, 'LIBRARY',
        () => {
          this.cameras.main.fadeOut(180, 20, 17, 15);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Library'));
        },
        { width: btnWp, height: mainH, fontSize: 14, fill: COLORS.brass, hoverFill: COLORS.steam }));
      y += rowPitch;
      this.add.existing(new Button(this, cx, y, 'HOW TO PLAY', () => this.openHowToPlay(),
        { width: btnWp, height: mainH, fontSize: 14, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
      y += rowPitch;
      const halfW = btnWp > 200 ? (btnWp - 12) / 2 : btnWp;
      const smallH = Math.min(44, mainH);
      if (halfW < 140) {
        this.add.existing(new Button(this, cx, y, 'EXPORT SAVE', () => this.doExport(),
          { width: btnWp, height: smallH, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
        y += rowPitch;
        const importBtn = new Button(this, cx, y, 'IMPORT SAVE', () => this.doImport(),
          { width: btnWp, height: smallH, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel });
        this.add.existing(importBtn);
        this.setupFileDrop(importBtn);
        y += rowPitch;
      } else {
        this.add.existing(new Button(this, cx - halfW / 2 - 6, y, 'EXPORT', () => this.doExport(),
          { width: halfW, height: smallH, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
        const importBtn = new Button(this, cx + halfW / 2 + 6, y, 'IMPORT', () => this.doImport(),
          { width: halfW, height: smallH, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel });
        this.add.existing(importBtn);
        this.setupFileDrop(importBtn);
        y += rowPitch;
      }
      const halfMute = btnWp > 200 ? (btnWp - 12) / 2 : btnWp;
      this.makeMuteToggle(cx - halfMute / 2 - 6, y, 'MUSIC', isMusicMuted, (m) => setMusicMuted(m), halfMute);
      this.makeMuteToggle(cx + halfMute / 2 + 6, y, 'SFX', isSfxMuted, (m) => setSfxMuted(m), halfMute);
    } else if (compact) {
      // Slice 58 — compact landscape (wide but short). Two horizontal
      // rows: primary (4 across) + secondary (4 across). Buttons sized
      // off available width so everything fits at heights 500-700.
      const margin = 40;
      const colCount = 4;
      const colGap = 10;
      const cellW = Math.floor((width - margin * 2 - colGap * (colCount - 1)) / colCount);
      const btnWc = Math.min(cellW, 220);
      const row1H = 48;
      const row2H = 40;
      const rowGap = 14;
      const row1Y = topCursor + 16 + row1H / 2;
      const row2Y = row1Y + row1H / 2 + rowGap + row2H / 2;
      // Compute column x positions (centered group)
      const groupW = colCount * btnWc + (colCount - 1) * colGap;
      const startX = cx - groupW / 2 + btnWc / 2;
      const colX = (i: number) => startX + i * (btnWc + colGap);

      // Row 1: CONTINUE | NEW RUN | WORKSHOP | LIBRARY
      const continueBtn = new Button(this, colX(0), row1Y, 'CONTINUE', () => this.continueRun(),
        { width: btnWc, height: row1H, fontSize: 16, fill: COLORS.shield, hoverFill: 0x6f9dbf });
      continueBtn.setEnabled(haveSave);
      this.add.existing(continueBtn);
      this.add.existing(new Button(this, colX(1), row1Y, 'NEW RUN', () => this.newRun(),
        { width: btnWc, height: row1H, fontSize: 16 }));
      this.add.existing(new Button(this, colX(2), row1Y, 'WORKSHOP', () => this.openWorkshop(),
        { width: btnWc, height: row1H, fontSize: 16, fill: COLORS.brass, hoverFill: COLORS.steam }));
      this.add.existing(new Button(this, colX(3), row1Y, 'LIBRARY',
        () => {
          this.cameras.main.fadeOut(180, 20, 17, 15);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Library'));
        },
        { width: btnWc, height: row1H, fontSize: 14, fill: COLORS.brass, hoverFill: COLORS.steam }));

      // Row 2: EXPORT | IMPORT | MUSIC | SFX
      this.add.existing(new Button(this, colX(0), row2Y, 'EXPORT', () => this.doExport(),
        { width: btnWc, height: row2H, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
      const importBtn = new Button(this, colX(1), row2Y, 'IMPORT', () => this.doImport(),
        { width: btnWc, height: row2H, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel });
      this.add.existing(importBtn);
      this.setupFileDrop(importBtn);
      this.makeMuteToggle(colX(2), row2Y, 'MUSIC', isMusicMuted, (m) => setMusicMuted(m), btnWc);
      this.makeMuteToggle(colX(3), row2Y, 'SFX', isSfxMuted, (m) => setSfxMuted(m), btnWc);

      // Row 3: HOW TO PLAY, centered under the grid.
      const row3Y = row2Y + row2H / 2 + rowGap + 18;
      this.add.existing(new Button(this, cx, row3Y, 'HOW TO PLAY', () => this.openHowToPlay(),
        { width: btnWc, height: 36, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
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
      // Secondary row — four across so HOW TO PLAY fits without spilling
      // below the 720px-tall viewport (the audio row already sits near the
      // bottom edge).
      const secondaryY = primaryY + 90;
      this.add.existing(new Button(this, cx - 330, secondaryY, 'EXPORT SAVE', () => this.doExport(),
        { width: 200, height: 40, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
      this.add.existing(new Button(this, cx - 110, secondaryY, 'LIBRARY',
        () => {
          this.cameras.main.fadeOut(180, 20, 17, 15);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Library'));
        },
        { width: 200, height: 40, fontSize: 13, fill: COLORS.brass, hoverFill: COLORS.steam }));
      this.add.existing(new Button(this, cx + 110, secondaryY, 'HOW TO PLAY', () => this.openHowToPlay(),
        { width: 200, height: 40, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }));
      const importBtn = new Button(this, cx + 330, secondaryY, 'IMPORT SAVE', () => this.doImport(),
        { width: 200, height: 40, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel });
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

  // Slice 58 — RECORDS popover. The corner button stays always visible;
  // tapping it overlays the stats panel and tapping anywhere else (or
  // the button again) dismisses. Replaces the always-on panel which
  // collided with the title in portrait.
  private recordsOverlay: Phaser.GameObjects.Container | null = null;

  private buildRecordsButton(rightX: number, topY: number) {
    const meta = loadMeta();
    if (!meta.history) return;
    const w = 96;
    const h = 36;
    const btn = new Button(
      this,
      rightX - w / 2,
      topY + h / 2,
      'RECORDS',
      () => this.toggleRecordsOverlay(rightX, topY + h + 6),
      {
        width: w,
        height: h,
        fontSize: 11,
        fill: COLORS.bgPanel,
        hoverFill: COLORS.steelDark
      }
    );
    this.add.existing(btn);
  }

  private toggleRecordsOverlay(rightX: number, topY: number) {
    if (this.recordsOverlay) {
      this.dismissRecordsOverlay();
      return;
    }
    const meta = loadMeta();
    const h = meta.history;
    if (!h) return;
    const { width: vw, height: vh } = this.scale;
    const panelW = 240;
    const panelH = 160;
    // Anchor the panel to the button when there's room; otherwise
    // center on the viewport (compact / portrait phone case).
    const anchorX = Math.min(vw - 10, rightX);
    const anchorY = Math.min(vh - panelH - 10, topY);
    // Full-viewport tap-catcher so a tap anywhere outside the panel
    // dismisses it. setInteractive lets it receive pointerdown without
    // visual presence (alpha 0.01 — just enough to register).
    const overlay = this.add.container(0, 0);
    const dim = this.add.rectangle(vw / 2, vh / 2, vw, vh, 0x000000, 0.35)
      .setInteractive();
    dim.on('pointerdown', () => this.dismissRecordsOverlay());
    overlay.add(dim);

    const panel = this.add
      .rectangle(anchorX, anchorY, panelW, panelH, COLORS.bgPanel, 0.96)
      .setStrokeStyle(2, COLORS.brass)
      .setOrigin(1, 0)
      .setInteractive();
    // Tapping the panel itself shouldn't dismiss — eat the event.
    panel.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev?: Phaser.Types.Input.EventData) => {
      ev?.stopPropagation?.();
    });
    overlay.add(panel);

    overlay.add(this.add
      .text(anchorX - panelW / 2, anchorY + 12, 'RECORDS', {
        fontFamily: FONTS.display,
        fontSize: '15px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0));

    const leftX = anchorX - panelW + 16;
    const valueX = anchorX - 16;
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
      const ry = anchorY + 42 + i * 20;
      overlay.add(this.add
        .text(leftX, ry, label, {
          fontFamily: FONTS.body,
          fontSize: '12px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0, 0));
      overlay.add(this.add
        .text(valueX, ry, value, {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(COLORS.bone),
          fontStyle: 'bold'
        })
        .setOrigin(1, 0));
    });
    overlay.setDepth(2000);
    this.recordsOverlay = overlay;
  }

  private dismissRecordsOverlay() {
    if (this.recordsOverlay) {
      this.recordsOverlay.destroy();
      this.recordsOverlay = null;
    }
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

  private openHowToPlay() {
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HowToPlay'));
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

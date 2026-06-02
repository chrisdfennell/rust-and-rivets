import Phaser from 'phaser';
import { getRun, enterNode, isReachable } from '../game/run';
import type { MapNode } from '../game/map';
import { RELICS } from '../game/relics';
import { getActName } from '../game/enemies';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { runTutorial } from '../ui/TutorialOverlay';
import { COLORS, FONTS, hex } from '../ui/theme';

// Node radii — landscape uses the historical desktop sizes; portrait
// bumps them up so each node clears the 44 px touch-target threshold
// even on cramped phone screens.
const NODE_R_LANDSCAPE = 22;
const NODE_R_PORTRAIT = 26;
const BOSS_R_LANDSCAPE = 32;
const BOSS_R_PORTRAIT = 36;
// Slice 50 — maps grew from 7 floors to 15. Floors are spaced with a
// FIXED pixel gap so the natural map height is taller than the viewport;
// MapScene wraps the map in a scroll layer and listens for wheel / drag
// input to pan vertically. Floor 0 lives at the bottom of the content,
// the boss at the top.
const FLOOR_H_LANDSCAPE = 92;
const FLOOR_H_PORTRAIT = 84;
const MARGIN_BOTTOM = 80;

export class MapScene extends Phaser.Scene {
  private nodeViews = new Map<string, Phaser.GameObjects.Container>();
  private mapLayer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private scrollMin = 0;
  private scrollMax = 0;
  private dragStart: { pointerY: number; scrollY: number } | null = null;
  private dragging = false;
  // Slice 57 — active relic tooltip + which relic id is showing it.
  // Tap-to-pin pattern: tapping a relic opens, tapping the same one
  // again or any other relic closes the previous one, tapping anywhere
  // else also closes. Works for both mouse and touch.
  private activeRelicTip: Phaser.GameObjects.Container | null = null;
  private activeRelicTipId: string | null = null;

  // Cached viewport + portrait-derived sizing. Children that need the
  // scene dims (nodeXY, drawMap, showRunEnd, the scroll-direction
  // chevrons) read these instead of stale design constants.
  private viewW = 0;
  private viewH = 0;
  private portrait = false;
  private floorH = FLOOR_H_LANDSCAPE;
  private nodeR = NODE_R_LANDSCAPE;
  private bossR = BOSS_R_LANDSCAPE;

  // Scroll-affordance chevrons. The map is always taller than the
  // viewport on a phone, but until you tried to drag there was no
  // signal that more content existed. These two arrows pulse at the
  // top / bottom edge of the visible map band and hide automatically
  // when you've scrolled to the limit in that direction.
  private chevronUp: Phaser.GameObjects.Text | null = null;
  private chevronDown: Phaser.GameObjects.Text | null = null;
  // Y bounds the chevrons pin to. Recomputed in create().
  private mapAreaTop = 0;
  private mapAreaBottom = 0;

  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super('Map');
  }

  create() {
    this.nodeViews = new Map();
    this.scrollY = 0;
    this.scrollMin = 0;
    this.scrollMax = 0;
    this.dragStart = null;
    this.dragging = false;
    setupPause(this);

    // Pull live viewport dims. Earlier revisions called applyDesignFit,
    // which letterboxed the 1280×720 design into the actual canvas —
    // on a phone that meant the map shrank to a postage-stamp band.
    // Now we lay out against the real width / height, with portrait
    // getting bigger nodes and tighter floor spacing.
    const { width, height } = this.scale;
    this.viewW = width;
    this.viewH = height;
    this.portrait = height > width;
    this.floorH = this.portrait ? FLOOR_H_PORTRAIT : FLOOR_H_LANDSCAPE;
    this.nodeR = this.portrait ? NODE_R_PORTRAIT : NODE_R_LANDSCAPE;
    this.bossR = this.portrait ? BOSS_R_PORTRAIT : BOSS_R_LANDSCAPE;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Wasteland horizon (same vibe as combat). Drawn in screen space, not
    // inside the scroll layer, so the backdrop stays put as the map pans.
    const horizon = this.add.graphics();
    horizon.fillStyle(0x1a1612);
    horizon.fillRect(0, 0, width, height);
    horizon.fillStyle(0x2a2018, 0.4);
    horizon.fillRect(0, height * 0.55, width, height * 0.45);

    // Distant smokestacks. In portrait we draw fewer / smaller stacks
    // since the canvas is narrower and the band reads as clutter.
    horizon.fillStyle(0x14110f);
    const stackCount = this.portrait ? 5 : 8;
    const stackStep = width / stackCount;
    for (let i = 0; i < stackCount; i++) {
      const x = 30 + i * stackStep;
      const h = 30 + (i % 4) * 16;
      horizon.fillRect(x, height * 0.5 - h, 14, h);
    }

    const run = getRun();

    // Map content lives inside a translatable container so we can pan it
    // vertically when there are more floors than fit on-screen.
    this.mapLayer = this.add.container(0, 0);
    this.mapLayer.setDepth(0);

    // Header / HUD. Portrait centers everything against the smaller
    // width and shrinks copy by ~3 px so it still fits.
    const titleSize = this.portrait ? 16 : 22;
    const hullSize = this.portrait ? 13 : 16;
    const scrapSize = this.portrait ? 12 : 14;
    const headerY = this.portrait ? 12 : 28;
    this.add
      .text(width / 2, headerY, `ACT ${run.act} — ${getActName(run.act)}`, {
        fontFamily: FONTS.display,
        fontSize: `${titleSize}px`,
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    // HP + scrap indicator top-right
    const hudRightX = width - (this.portrait ? 12 : 24);
    const hudTopY = this.portrait ? 36 : 24;
    this.add
      .text(hudRightX, hudTopY, `HULL  ${run.player.hull} / ${run.player.maxHull}`, {
        fontFamily: FONTS.display,
        fontSize: `${hullSize}px`,
        color: hex(run.player.hull < run.player.maxHull * 0.33 ? COLORS.danger : COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(1, 0);
    this.add
      .text(hudRightX, hudTopY + hullSize + 4, `SCRAP  ${run.scrap}`, {
        fontFamily: FONTS.display,
        fontSize: `${scrapSize}px`,
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(1, 0);
    const hudLeftX = this.portrait ? 12 : 24;
    this.add
      .text(hudLeftX, hudTopY, `DECK  ${run.player.deck.length}`, {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);

    this.drawRelics(hudLeftX, hudTopY + 24);

    this.drawMap();

    // Hint text bottom
    const hint = run.currentNodeId === null ? 'Pick a starting road.' : 'Choose your next stop.';
    const hintY = height - (this.portrait ? 14 : 24);
    this.add
      .text(width / 2, hintY, hint, {
        fontFamily: FONTS.body,
        fontSize: this.portrait ? '12px' : '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5, 1);

    // Scroll bounds — the layer's y translates to pan the map. Travel
    // range covers from "boss visible near header" to "floor 0 visible
    // well above the canvas bottom." Auto-center on the player's
    // current node (or floor 0 if they haven't picked a starting road
    // yet).
    //
    // Mobile-browser fix: the URL bar on Chrome / Safari / Edge overlays
    // the bottom of the canvas without resizing it. If floor 0 was only
    // allowed to reach mapAreaBottom (the canvas edge), the starting
    // nodes ended up under the browser chrome and the player couldn't
    // tap them. In portrait we reserve ~25 % of the viewport at the
    // bottom as scroll overshoot so floor 0 can always be pulled up
    // into clearly tappable space.
    const hudTop = this.portrait ? 70 : 80;
    const hudBottom = this.portrait ? 40 : 50;
    this.mapAreaTop = hudTop;
    this.mapAreaBottom = height - hudBottom;
    const bottomScrollClearance = this.portrait ? Math.round(height * 0.25) : 0;
    const naturalY = (floor: number) => height - MARGIN_BOTTOM - floor * this.floorH;
    const topFloor = run.map.floors - 1;
    this.scrollMax = hudTop - naturalY(topFloor);
    this.scrollMin = (this.mapAreaBottom - bottomScrollClearance) - naturalY(0);
    if (this.scrollMax < this.scrollMin) this.scrollMax = this.scrollMin;
    const focusNode = run.currentNodeId ? run.map.nodes.get(run.currentNodeId) : null;
    const focusFloor = focusNode ? focusNode.floor : 0;
    const midScreen = (hudTop + this.mapAreaBottom) / 2;
    this.drawScrollChevrons();
    this.setScroll(midScreen - naturalY(focusFloor));
    this.attachScrollInput();

    // Game-end overlays
    if (run.result === 'victory') this.showRunEnd('RUN COMPLETE', 'The First Engine falls silent. The World-Forge cools.', COLORS.ok);
    else if (run.result === 'defeat') this.showRunEnd('RUN OVER', 'The wasteland claims your mech.', COLORS.danger);

    if (this.input.keyboard) {
      this.input.keyboard.removeAllListeners('keydown-R');
      this.input.keyboard.on('keydown-R', () => {
        // Only the R hotkey works mid-run (no run-end overlay). After a run
        // ends, the buttons in showRunEnd handle restart so character pick
        // happens.
        if (getRun().result === 'inProgress') return;
        this.scene.start('CharacterSelect');
      });
    }

    // First-visit map tour — only while the run is live (skip it on the
    // win/lose overlay where the map is just a backdrop).
    if (run.result === 'inProgress') {
      runTutorial(this, 'map', [
        {
          title: 'THE MAP',
          text:
            'This is the act map, and you are climbing it. Tap a connected room above your ' +
            'current position to travel there — you can only move forward along the paths.'
        },
        {
          title: 'KNOW THE ROOMS',
          text:
            'Icons tell you what waits: regular combat, tougher elites (better rewards), ' +
            'shops, rest sites, and mystery events. The boss sits at the top of the act. ' +
            'Pick the route that fits your Hull and your plan.'
        }
      ]);
    }

    // Re-layout on rotation. Debounced so iOS Safari doesn't restart us
    // twice on the same flip.
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

  private drawRelics(x: number, y: number) {
    const run = getRun();
    if (run.relics.length === 0) return;
    this.add
      .text(x, y, 'RELICS', {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);

    const slotSize = this.portrait ? 24 : 28;
    const gap = 6;
    run.relics.forEach((id, i) => {
      const def = RELICS[id];
      const cx = x + slotSize / 2 + i * (slotSize + gap);
      const cy = y + 22 + slotSize / 2;
      const bg = this.add.circle(cx, cy, slotSize / 2, COLORS.bgPanel).setStrokeStyle(2, COLORS.brass);
      const glyph = this.add
        .text(cx, cy, '★', {
          fontFamily: FONTS.display,
          fontSize: this.portrait ? '14px' : '16px',
          color: hex(COLORS.steam),
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
      // Slice 57 — tap-to-pin tooltip. Works on mouse hover (pointerover
      // also pins) and touch (pointerdown pins). Tapping anywhere else
      // closes via the scene-level pointerdown listener wired up below.
      bg.setInteractive({ useHandCursor: true });
      const openTip = () => {
        // Toggle off if this relic's tip is already pinned.
        if (this.activeRelicTipId === id) {
          this.dismissActiveRelicTip();
          return;
        }
        this.dismissActiveRelicTip();
        // In portrait the relic row hugs the left edge, so a tooltip
        // anchored to the right of the relic would clip on most phones.
        // Anchor the tip BELOW the relic in portrait, beside it in
        // landscape — same content, just different placement.
        const tipW = Math.min(300, this.viewW - 24);
        const tip = this.add.container(0, 0);
        const padX = 8;
        const padY = 8;
        const gapNameDesc = 4;
        const name = this.add
          .text(padX, 0, def?.name ?? id, {
            fontFamily: FONTS.display,
            fontSize: '13px',
            color: hex(COLORS.bone),
            fontStyle: 'bold'
          });
        const desc = this.add
          .text(padX, 0, def?.description ?? '', {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.boneDim),
            wordWrap: { width: tipW - padX * 2 }
          });
        const nameH = name.height;
        const descH = desc.height;
        const tipH = padY * 2 + nameH + gapNameDesc + descH;
        name.y = -tipH / 2 + padY;
        desc.y = name.y + nameH + gapNameDesc;
        const tipBg = this.add
          .rectangle(tipW / 2, 0, tipW, tipH, COLORS.bgPanel)
          .setStrokeStyle(2, COLORS.brassDim);
        tip.add([tipBg, name, desc]);
        if (this.portrait) {
          // Anchor below the relic, clamped to the left edge.
          const tipX = Math.max(12, cx - tipW / 2);
          tip.setPosition(tipX, cy + slotSize / 2 + 12 + tipH / 2);
        } else {
          tip.setPosition(cx + slotSize, cy);
        }
        tip.setDepth(500);
        this.activeRelicTip = tip;
        this.activeRelicTipId = id;
      };
      // Open on tap (touch + mouse click) and on hover (mouse only — does
      // nothing extra on touch since pointerover doesn't fire there).
      bg.on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, ev?: Phaser.Types.Input.EventData) => {
        openTip();
        // Stop the event from propagating to the scene-level dismisser.
        ev?.stopPropagation?.();
        void p;
      });
      bg.on('pointerover', () => {
        // Hover-open keeps the old mouse UX. Auto-dismiss on pointerout
        // ONLY if the tooltip was opened by hover (not pinned by a tap).
        // We use a flag stored on the container.
        if (this.activeRelicTipId === id) return;
        openTip();
        const hoverTip = this.activeRelicTip;
        (hoverTip as Phaser.GameObjects.Container & { hoverOnly?: boolean }).hoverOnly = true;
      });
      bg.on('pointerout', () => {
        const t = this.activeRelicTip as (Phaser.GameObjects.Container & { hoverOnly?: boolean }) | null;
        if (t?.hoverOnly) this.dismissActiveRelicTip();
      });
      void glyph;
    });
  }

  // Slice 57 — closes the pinned relic tooltip if one is showing.
  private dismissActiveRelicTip() {
    if (this.activeRelicTip) {
      this.activeRelicTip.destroy();
      this.activeRelicTip = null;
      this.activeRelicTipId = null;
    }
  }

  // Returns the natural (unscrolled) screen position of a node. Floor 0
  // sits at the bottom of the natural-content area; the boss is at the
  // top. Vertical scrolling translates the whole mapLayer by `scrollY`,
  // so children stay at these coords in layer-local space.
  private nodeXY(node: MapNode): { x: number; y: number } {
    const y = this.viewH - MARGIN_BOTTOM - node.floor * this.floorH;
    const run = getRun();
    const colW = this.viewW / (run.map.width + 1);
    const x = colW * (node.col + 1);
    return { x, y };
  }

  private drawMap() {
    const run = getRun();

    // Edges first, so nodes draw on top. Both edges and node containers
    // are added to mapLayer so a single y-translate scrolls everything
    // together.
    const edges = this.add.graphics();
    this.mapLayer.add(edges);
    for (const node of run.map.nodes.values()) {
      const from = this.nodeXY(node);
      for (const nextId of node.next) {
        const nextNode = run.map.nodes.get(nextId);
        if (!nextNode) continue;
        const to = this.nodeXY(nextNode);

        let color = COLORS.steelDark;
        let alpha = 0.6;
        let thickness = 2;
        const fromVisited = run.visitedNodeIds.has(node.id);
        const toVisited = run.visitedNodeIds.has(nextId);
        if (fromVisited && toVisited) {
          color = COLORS.brass;
          alpha = 1;
          thickness = 4;
        } else if (run.currentNodeId === node.id && run.result === 'inProgress') {
          color = COLORS.steam;
          alpha = 0.9;
          thickness = 3;
        }
        edges.lineStyle(thickness, color, alpha);
        edges.beginPath();
        edges.moveTo(from.x, from.y);
        edges.lineTo(to.x, to.y);
        edges.strokePath();
      }
    }

    // Nodes
    for (const node of run.map.nodes.values()) {
      const { x, y } = this.nodeXY(node);
      const view = this.drawNode(node, x, y);
      this.mapLayer.add(view);
      this.nodeViews.set(node.id, view);
    }
  }

  private drawNode(node: MapNode, x: number, y: number): Phaser.GameObjects.Container {
    const run = getRun();
    const container = this.add.container(x, y);
    const isBoss = node.kind === 'boss';
    const isElite = node.kind === 'elite';
    const r = isBoss ? this.bossR : isElite ? this.nodeR + 6 : this.nodeR;
    const visited = run.visitedNodeIds.has(node.id);
    const isCurrent = run.currentNodeId === node.id;
    const reachable = isReachable(node.id);

    // Kind-specific base colors
    const kindBase: Record<string, { fill: number; glyph: string }> = {
      combat: { fill: COLORS.rust, glyph: 'X' },
      elite: { fill: COLORS.danger, glyph: '*' },
      shop: { fill: COLORS.brass, glyph: '$' },
      rest: { fill: COLORS.buff, glyph: '+' },
      event: { fill: COLORS.steam, glyph: '?' },
      boss: { fill: COLORS.danger, glyph: '!' }
    };
    const base = kindBase[node.kind];

    let fill: number;
    let stroke: number;
    let strokeW = 3;
    let alpha = 1;

    if (visited) {
      fill = COLORS.brassDim;
      stroke = COLORS.bone;
    } else if (reachable) {
      fill = base.fill;
      stroke = COLORS.steam;
      strokeW = 4;
    } else {
      fill = COLORS.steelDark;
      stroke = COLORS.brassDim;
      alpha = 0.55;
    }

    const circle = this.add.circle(0, 0, r, fill).setStrokeStyle(strokeW, stroke);
    container.add(circle);

    if (isBoss) {
      // Spikes around the boss
      const spikes = this.add.graphics();
      spikes.fillStyle(reachable || visited ? COLORS.danger : COLORS.steelDark, alpha);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const x1 = Math.cos(ang) * (r + 2);
        const y1 = Math.sin(ang) * (r + 2);
        const x2 = Math.cos(ang) * (r + 12);
        const y2 = Math.sin(ang) * (r + 12);
        const perp = ang + Math.PI / 2;
        const bw = 5;
        spikes.fillTriangle(
          x1 + Math.cos(perp) * bw, y1 + Math.sin(perp) * bw,
          x1 - Math.cos(perp) * bw, y1 - Math.sin(perp) * bw,
          x2, y2
        );
      }
      container.addAt(spikes, 0);
    }

    const glyphColor = visited ? COLORS.steelDark : COLORS.bone;
    container.add(
      this.add
        .text(0, 0, base.glyph, {
          fontFamily: FONTS.display,
          fontSize: isBoss ? '24px' : '20px',
          color: hex(glyphColor),
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
    );

    if (isCurrent && run.result === 'inProgress') {
      const ring = this.add.circle(0, 0, r + 6).setStrokeStyle(2, COLORS.steam);
      container.addAt(ring, 0);
      this.tweens.add({
        targets: ring,
        scale: 1.15,
        alpha: 0.4,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }

    container.setAlpha(alpha);

    if (reachable) {
      const hit = this.add.circle(0, 0, r + 8, 0xffffff, 0).setInteractive({ useHandCursor: true });
      container.add(hit);
      hit.on('pointerover', () => {
        circle.setStrokeStyle(strokeW + 2, COLORS.bone);
        this.tweens.add({ targets: container, scale: 1.12, duration: 120 });
      });
      hit.on('pointerout', () => {
        circle.setStrokeStyle(strokeW, stroke);
        this.tweens.add({ targets: container, scale: 1, duration: 120 });
      });
      // Fire on pointerup, not pointerdown, so a drag that started on the
      // node scrolls the map instead of navigating. The dragging guard
      // is set by the scene-level pointermove handler.
      hit.on('pointerup', () => {
        if (this.dragging) return;
        this.goToNode(node);
      });
    }

    return container;
  }

  // Pulsing up / down arrows that sit at the visible map band's top
  // and bottom edges. Visibility tracks the scroll position so the
  // arrow only shows when there's actually more map in that direction.
  private drawScrollChevrons() {
    const cx = this.viewW / 2;
    const chevronSize = this.portrait ? '20px' : '24px';
    this.chevronUp = this.add
      .text(cx, this.mapAreaTop + 12, '▲', {
        fontFamily: FONTS.display,
        fontSize: chevronSize,
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);
    this.chevronDown = this.add
      .text(cx, this.mapAreaBottom - 12, '▼', {
        fontFamily: FONTS.display,
        fontSize: chevronSize,
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);
    // Gentle pulse so the arrow reads as "more there" without
    // demanding attention.
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
    // scrollY > scrollMin → we've panned the map upward, more content
    // off the bottom edge → show DOWN arrow.
    // scrollY < scrollMax → we can still pan up → more content above →
    // show UP arrow.
    if (this.chevronUp) this.chevronUp.setVisible(this.scrollY < this.scrollMax - 1);
    if (this.chevronDown) this.chevronDown.setVisible(this.scrollY > this.scrollMin + 1);
  }

  private setScroll(y: number) {
    this.scrollY = Math.max(this.scrollMin, Math.min(this.scrollMax, y));
    this.mapLayer.y = this.scrollY;
    this.refreshChevrons();
  }

  private attachScrollInput() {
    // Wheel scroll: works regardless of overflow (no-ops when bounds equal).
    this.input.on(
      'wheel',
      (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
        this.setScroll(this.scrollY - dy);
      }
    );

    // Drag scroll. pointerdown records start; pointermove past threshold
    // flips `dragging` on and pans. Node click handlers gate on this flag.
    // Touch-friendly threshold: 8 px. The relic-bg interactive handlers
    // call stopPropagation so taps on relics don't dismiss their own tip.
    const THRESHOLD = 8;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragStart = { pointerY: p.y, scrollY: this.scrollY };
      this.dragging = false;
      // Slice 57 — pin-dismiss: tapping anywhere on the scene closes a
      // pinned relic tooltip. The relic bg's own pointerdown handler
      // stops propagation so it doesn't reach here when the player is
      // actually tapping the relic (which would toggle it off via the
      // separate logic inside openTip).
      this.dismissActiveRelicTip();
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragStart) return;
      const dy = p.y - this.dragStart.pointerY;
      if (!this.dragging && Math.abs(dy) >= THRESHOLD) this.dragging = true;
      if (this.dragging) this.setScroll(this.dragStart.scrollY + dy);
    });
    const end = () => {
      this.dragStart = null;
      // Reset `dragging` on the next tick so the node's pointerup handler
      // (which fires BEFORE this event in Phaser) still sees `true` and
      // suppresses navigation. Without the delay, fast taps after a drag
      // would slip through.
      this.time.delayedCall(0, () => { this.dragging = false; });
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
  }

  private goToNode(node: MapNode) {
    enterNode(node.id);
    const sceneKey =
      node.kind === 'shop' ? 'Shop' :
      node.kind === 'rest' ? 'Rest' :
      node.kind === 'event' ? 'Event' :
      'Combat';
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
  }

  private showRunEnd(title: string, sub: string, color: number) {
    const width = this.viewW;
    const height = this.viewH;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(1000);
    this.add
      .text(width / 2, height / 2 - 70, title, {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '36px' : '56px',
        color: hex(color),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(1001);
    this.add
      .text(width / 2, height / 2 - (this.portrait ? 30 : 10), sub, {
        fontFamily: FONTS.body,
        fontSize: this.portrait ? '13px' : '16px',
        color: hex(COLORS.bone),
        align: 'center',
        wordWrap: { width: Math.min(width - 40, 600) }
      })
      .setOrigin(0.5)
      .setDepth(1001);

    // Two-button choice: start fresh now, or step back to the title to
    // spend Workshop points (the points are already saved). Portrait
    // stacks the buttons; landscape keeps the side-by-side row.
    const btnW = this.portrait ? Math.min(width - 32, 280) : 260;
    const btnH = 56;
    const newRunBtn = new Button(
      this,
      width / 2 + (this.portrait ? 0 : -150),
      height / 2 + (this.portrait ? 40 : 60),
      'NEW RUN',
      () => this.scene.start('CharacterSelect'),
      { width: btnW, height: btnH, fontSize: 18 }
    );
    this.add.existing(newRunBtn);
    newRunBtn.setDepth(1001);

    const titleBtn = new Button(
      this,
      width / 2 + (this.portrait ? 0 : 150),
      height / 2 + (this.portrait ? 40 + btnH + 12 : 60),
      'BACK TO TITLE',
      () => this.scene.start('Title'),
      { width: btnW, height: btnH, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf }
    );
    this.add.existing(titleBtn);
    titleBtn.setDepth(1001);

    const footerY = this.portrait
      ? height / 2 + 40 + (btnH + 12) * 2
      : height / 2 + 110;
    this.add
      .text(width / 2, footerY, 'R = New Run', {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5)
      .setDepth(1001);
  }
}

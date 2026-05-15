import Phaser from 'phaser';
import { getRun, startRun, enterNode, isReachable } from '../game/run';
import type { MapNode } from '../game/map';
import { RELICS } from '../game/relics';
import { COLORS, FONTS, hex } from '../ui/theme';

const NODE_R = 22;
const BOSS_R = 32;

export class MapScene extends Phaser.Scene {
  private nodeViews = new Map<string, Phaser.GameObjects.Container>();

  constructor() {
    super('Map');
  }

  create() {
    this.nodeViews = new Map();

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Wasteland horizon (same vibe as combat)
    const horizon = this.add.graphics();
    horizon.fillStyle(0x1a1612);
    horizon.fillRect(0, 0, width, height);
    horizon.fillStyle(0x2a2018, 0.4);
    horizon.fillRect(0, height * 0.55, width, height * 0.45);

    // Distant smokestacks
    horizon.fillStyle(0x14110f);
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 160;
      const h = 30 + (i % 4) * 16;
      horizon.fillRect(x, height * 0.5 - h, 14, h);
    }

    const run = getRun();

    this.add
      .text(width / 2, 28, 'ROAD TO THE FOUNDRY', {
        fontFamily: FONTS.display,
        fontSize: '22px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    // HP + scrap indicator top-right
    this.add
      .text(width - 24, 24, `HULL  ${run.player.hull} / ${run.player.maxHull}`, {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(run.player.hull < run.player.maxHull * 0.33 ? COLORS.danger : COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(1, 0);
    this.add
      .text(width - 24, 48, `SCRAP  ${run.scrap}`, {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(1, 0);
    this.add
      .text(24, 24, `DECK  ${run.player.deck.length}`, {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0);

    this.drawRelics(24, 50);

    this.drawMap();

    // Hint text bottom
    const hint = run.currentNodeId === null ? 'Pick a starting road.' : 'Choose your next stop.';
    this.add
      .text(width / 2, height - 24, hint, {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5, 1);

    // Game-end overlays
    if (run.result === 'victory') this.showRunEnd('RUN COMPLETE', 'The Foundry burns. Press R to start a new run.', COLORS.ok);
    else if (run.result === 'defeat') this.showRunEnd('RUN OVER', 'The wasteland claims your mech. Press R to try again.', COLORS.danger);

    if (this.input.keyboard) {
      this.input.keyboard.removeAllListeners('keydown-R');
      this.input.keyboard.on('keydown-R', () => {
        startRun();
        this.scene.restart();
      });
    }
  }

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

    const slotSize = 28;
    const gap = 6;
    run.relics.forEach((id, i) => {
      const def = RELICS[id];
      const cx = x + slotSize / 2 + i * (slotSize + gap);
      const cy = y + 22 + slotSize / 2;
      const bg = this.add.circle(cx, cy, slotSize / 2, COLORS.bgPanel).setStrokeStyle(2, COLORS.brass);
      const glyph = this.add
        .text(cx, cy, '★', {
          fontFamily: FONTS.display,
          fontSize: '16px',
          color: hex(COLORS.steam),
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
      // Hover tooltip
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        const tip = this.add.container(cx + slotSize, cy);
        const tipBg = this.add.rectangle(150, 0, 300, 50, COLORS.bgPanel).setStrokeStyle(2, COLORS.brassDim);
        const name = this.add
          .text(8, -12, def?.name ?? id, {
            fontFamily: FONTS.display,
            fontSize: '13px',
            color: hex(COLORS.bone),
            fontStyle: 'bold'
          });
        const desc = this.add
          .text(8, 6, def?.description ?? '', {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.boneDim),
            wordWrap: { width: 280 }
          });
        tip.add([tipBg, name, desc]);
        tip.setDepth(500);
        bg.once('pointerout', () => tip.destroy());
      });
      void glyph;
    });
  }

  private nodeXY(node: MapNode): { x: number; y: number } {
    const { width, height } = this.scale;
    const run = getRun();
    const marginTop = 80;
    const marginBottom = 70;
    const usableH = height - marginTop - marginBottom;
    const floorH = usableH / (run.map.floors - 1);
    // Floor 0 at bottom, top floor at top
    const y = height - marginBottom - node.floor * floorH;

    const colW = width / (run.map.width + 1);
    const x = colW * (node.col + 1);
    return { x, y };
  }

  private drawMap() {
    const run = getRun();

    // Edges first, so nodes draw on top
    const edges = this.add.graphics();
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
      this.nodeViews.set(node.id, view);
    }
  }

  private drawNode(node: MapNode, x: number, y: number): Phaser.GameObjects.Container {
    const run = getRun();
    const container = this.add.container(x, y);
    const isBoss = node.kind === 'boss';
    const isElite = node.kind === 'elite';
    const r = isBoss ? BOSS_R : isElite ? NODE_R + 6 : NODE_R;
    const visited = run.visitedNodeIds.has(node.id);
    const isCurrent = run.currentNodeId === node.id;
    const reachable = isReachable(node.id);

    // Kind-specific base colors
    const kindBase: Record<string, { fill: number; glyph: string }> = {
      combat: { fill: COLORS.rust, glyph: 'X' },
      elite: { fill: COLORS.danger, glyph: '*' },
      shop: { fill: COLORS.brass, glyph: '$' },
      rest: { fill: COLORS.buff, glyph: '+' },
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
      hit.on('pointerdown', () => this.goToNode(node));
    }

    return container;
  }

  private goToNode(node: MapNode) {
    enterNode(node.id);
    const sceneKey =
      node.kind === 'shop' ? 'Shop' :
      node.kind === 'rest' ? 'Rest' :
      'Combat';
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
  }

  private showRunEnd(title: string, sub: string, color: number) {
    const { width, height } = this.scale;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(1000);
    const t = this.add
      .text(width / 2, height / 2 - 30, title, {
        fontFamily: FONTS.display,
        fontSize: '56px',
        color: hex(color),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(1001);
    const s = this.add
      .text(width / 2, height / 2 + 30, sub, {
        fontFamily: FONTS.body,
        fontSize: '16px',
        color: hex(COLORS.bone)
      })
      .setOrigin(0.5)
      .setDepth(1001);
    // Keep references alive
    void dim; void t; void s;
  }
}

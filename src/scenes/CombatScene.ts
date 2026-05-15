import Phaser from 'phaser';
import { createCombatState, endTurn, playCard, canPlay } from '../game/combat';
import { getRun, completeCombat, failCombat } from '../game/run';
import type { CombatState, CardInstance } from '../game/types';
import { CardView, CARD_W } from '../ui/CardView';
import { drawMech, ENEMY_SPRITES } from '../ui/MechSprite';
import { StatBar } from '../ui/StatBar';
import { IntentView } from '../ui/IntentView';
import { COLORS, FONTS, hex } from '../ui/theme';

export class CombatScene extends Phaser.Scene {
  private state!: CombatState;

  private mech!: Phaser.GameObjects.Container;
  private enemySprite!: Phaser.GameObjects.Container;
  private playerBar!: StatBar;
  private enemyBar!: StatBar;
  private intent!: IntentView;
  private steamText!: Phaser.GameObjects.Text;
  private steamLabel!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private deckText!: Phaser.GameObjects.Text;
  private discardText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private handLayer!: Phaser.GameObjects.Container;
  private cardViews: CardView[] = [];
  private overlay!: Phaser.GameObjects.Container;
  private endHandled = false;

  constructor() {
    super('Combat');
  }

  create() {
    // Phaser keeps a single instance of each scene across scene.start() calls,
    // so class-field initializers don't re-run. Reset per-combat state here.
    this.endHandled = false;
    this.cardViews = [];

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Wasteland horizon
    const horizon = this.add.graphics();
    horizon.fillStyle(0x1a1612);
    horizon.fillRect(0, 0, width, height * 0.55);
    horizon.fillStyle(0x2a2018);
    horizon.fillRect(0, height * 0.4, width, height * 0.2);
    horizon.fillStyle(COLORS.steelDark);
    horizon.fillRect(0, height * 0.55, width, height * 0.05);

    // Distant smokestacks
    horizon.fillStyle(0x2a2724);
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 180;
      const h = 40 + (i % 3) * 20;
      horizon.fillRect(x, height * 0.4 - h, 18, h);
    }

    const run = getRun();
    if (!run.pendingEnemy) {
      // Safety net — if someone navigated straight to Combat without picking a node.
      this.scene.start('Map');
      return;
    }
    this.state = createCombatState(run.pendingEnemy, run.player, run.relics);

    this.mech = drawMech(this, width * 0.28, height * 0.5);
    const drawEnemy = ENEMY_SPRITES[this.state.enemy.def.id] ?? ENEMY_SPRITES.scrapRaider;
    this.enemySprite = drawEnemy(this, width * 0.72, height * 0.55);

    this.playerBar = new StatBar(this, width * 0.28, height * 0.78, 200);
    this.enemyBar = new StatBar(this, width * 0.72, height * 0.83, 200);
    this.add.existing(this.playerBar);
    this.add.existing(this.enemyBar);

    this.add
      .text(width * 0.28, height * 0.78 - 22, 'PILOT', {
        fontFamily: FONTS.display,
        fontSize: '12px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5, 1);

    this.add
      .text(width * 0.72, height * 0.83 - 22, this.state.enemy.def.name.toUpperCase(), {
        fontFamily: FONTS.display,
        fontSize: '12px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5, 1);

    this.intent = new IntentView(this, width * 0.72, height * 0.32);
    this.add.existing(this.intent);

    // Steam gauge
    const steamPanel = this.add
      .rectangle(80, height - 130, 100, 100, COLORS.bgPanel)
      .setStrokeStyle(3, COLORS.brass);
    steamPanel.setOrigin(0.5);
    this.add
      .text(80, height - 175, 'STEAM', {
        fontFamily: FONTS.display,
        fontSize: '12px',
        color: hex(COLORS.brass)
      })
      .setOrigin(0.5);
    this.steamText = this.add
      .text(80, height - 130, '3/3', {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.steamLabel = this.steamText;

    // Scrap badge (run currency)
    this.add
      .text(20, 24, `SCRAP  ${getRun().scrap}`, {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    // Turn indicator
    this.turnText = this.add.text(width / 2, 20, '', {
      fontFamily: FONTS.display,
      fontSize: '14px',
      color: hex(COLORS.boneDim)
    }).setOrigin(0.5, 0);

    // Deck/discard counters
    this.deckText = this.add
      .text(40, height - 40, '', {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0.5);
    this.discardText = this.add
      .text(width - 40, height - 40, '', {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(1, 0.5);

    // Combat log
    this.logText = this.add.text(width - 20, 20, '', {
      fontFamily: FONTS.body,
      fontSize: '11px',
      color: hex(COLORS.boneDim),
      align: 'right'
    }).setOrigin(1, 0);

    // End turn button
    this.makeEndTurnButton(width - 130, height - 130);

    // Hand layer
    this.handLayer = this.add.container(0, 0);

    this.overlay = this.add.container(0, 0).setDepth(1000).setVisible(false);

    this.refresh();
  }

  private makeEndTurnButton(x: number, y: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 160, 60, COLORS.rust).setStrokeStyle(3, COLORS.brass);
    const txt = this.add
      .text(0, 0, 'END TURN', {
        fontFamily: FONTS.display,
        fontSize: '18px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    c.add([bg, txt]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(COLORS.danger));
    bg.on('pointerout', () => bg.setFillStyle(COLORS.rust));
    bg.on('pointerdown', () => this.onEndTurn());
    return c;
  }

  private onEndTurn() {
    if (this.state.phase !== 'playerTurn') return;
    endTurn(this.state);
    this.shake(this.enemySprite, 4);
    this.refresh();
    if (this.state.phase === 'playerTurn') {
      // Brief enemy-acted flash
      this.tweens.add({
        targets: this.mech,
        x: this.mech.x - 6,
        duration: 60,
        yoyo: true,
        repeat: 1
      });
    }
  }

  private onPlayCard(card: CardInstance) {
    if (!canPlay(this.state, card.uid)) return;
    const ok = playCard(this.state, card.uid);
    if (!ok) return;
    if (card.def.target === 'enemy') this.shake(this.enemySprite, 6);
    else if (card.def.target === 'self') this.flash(this.mech, COLORS.shield);
    this.refresh();
  }

  private shake(target: Phaser.GameObjects.Container, mag: number) {
    const ox = target.x;
    this.tweens.add({
      targets: target,
      x: ox + mag,
      duration: 40,
      yoyo: true,
      repeat: 2,
      onComplete: () => (target.x = ox)
    });
  }

  private flash(target: Phaser.GameObjects.Container, _color: number) {
    this.tweens.add({
      targets: target,
      alpha: 0.5,
      duration: 80,
      yoyo: true
    });
  }

  private refresh() {
    const s = this.state;
    this.playerBar.update(s.player.hull, s.player.maxHull, s.player.plating, s.player.vulnerable, s.player.weak);
    this.enemyBar.update(s.enemy.hull, s.enemy.maxHull, s.enemy.plating, s.enemy.vulnerable, s.enemy.weak);
    this.intent.update(s.enemy.nextAction.intent);
    this.steamLabel.setText(`${s.player.steam}/${s.player.maxSteam}`);
    this.turnText.setText(`TURN ${s.turn}`);
    this.deckText.setText(`DRAW: ${s.player.draw.length}`);
    this.discardText.setText(`DISCARD: ${s.player.discard.length}    EXHAUST: ${s.player.exhaust.length}`);
    this.logText.setText(s.log.slice(-6).join('\n'));

    this.layoutHand();

    if (s.phase === 'victory' && !this.endHandled) {
      this.endHandled = true;
      const reward = completeCombat(s.player.hull);
      const run = getRun();
      let nextScene: string;
      let continueLine: string;
      if (run.result === 'victory') {
        nextScene = 'Map';
        continueLine = 'Press SPACE to return.';
      } else if (run.awaitingInterAct) {
        nextScene = 'InterAct';
        continueLine = 'Press SPACE to march on.';
      } else {
        nextScene = 'Reward';
        continueLine = 'Press SPACE to claim rewards.';
      }
      const rewardLine = reward > 0 ? ` +${reward} scrap.` : '';
      this.showOverlay('VICTORY', `${s.enemy.def.name} falls.${rewardLine} ${continueLine}`, COLORS.ok);
      this.bindContinue(nextScene);
    } else if (s.phase === 'defeat' && !this.endHandled) {
      this.endHandled = true;
      failCombat(s.player.hull);
      this.showOverlay('DEFEAT', 'Your mech is scrap. Press SPACE to view the map.', COLORS.danger);
      this.bindContinue('Map');
    }
  }

  private bindContinue(nextScene: string) {
    if (!this.input.keyboard) return;
    this.input.keyboard.removeAllListeners('keydown-SPACE');
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start(nextScene));
  }

  private layoutHand() {
    // Diff cards: keep existing views for cards still in hand, build for new
    const hand = this.state.player.hand;
    const existing = new Map(this.cardViews.map((v) => [v.card.uid, v]));
    const next: CardView[] = [];

    for (const card of hand) {
      let view = existing.get(card.uid);
      if (!view) {
        view = new CardView(this, card, (c) => this.onPlayCard(c));
        this.handLayer.add(view);
      } else {
        existing.delete(card.uid);
      }
      next.push(view);
    }
    for (const stale of existing.values()) stale.destroy();
    this.cardViews = next;

    const { width, height } = this.scale;
    const baseY = height - CARD_W * 0.6;
    const n = next.length;
    if (n === 0) return;

    const spread = Math.min(width - 360, n * (CARD_W * 0.78));
    const startX = width / 2 - spread / 2 + (CARD_W * 0.78) / 2;
    const arc = 16;
    const rotMax = 0.08;

    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const x = startX + i * (CARD_W * 0.78);
      const y = baseY + Math.abs(t) * arc * 2;
      const rot = t * rotMax * 2;
      const view = next[i];
      view.setHome(x, y, rot);
      view.setPlayable(canPlay(this.state, view.card.uid));
    }
  }

  private showOverlay(title: string, sub: string, color: number) {
    this.overlay.removeAll(true);
    const { width, height } = this.scale;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    const t = this.add.text(width / 2, height / 2 - 20, title, {
      fontFamily: FONTS.display,
      fontSize: '64px',
      color: hex(color),
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const s = this.add.text(width / 2, height / 2 + 40, sub, {
      fontFamily: FONTS.body,
      fontSize: '16px',
      color: hex(COLORS.bone)
    }).setOrigin(0.5);
    this.overlay.add([dim, t, s]);
    this.overlay.setVisible(true);
  }
}

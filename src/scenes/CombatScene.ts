import Phaser from 'phaser';
import { createCombatState, endTurn, playCard, canPlay } from '../game/combat';
import { getRun, completeCombat, failCombat } from '../game/run';
import type { CombatState, CardInstance } from '../game/types';
import { CardView, CARD_W, CARD_H } from '../ui/CardView';
import { CHARACTER_SPRITES, ENEMY_SPRITES } from '../ui/MechSprite';
import { setupPause } from '../ui/setupPause';
import { sfx } from '../audio/sfx';
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
  private endTurnBg!: Phaser.GameObjects.Rectangle;
  private endTurnTxt!: Phaser.GameObjects.Text;
  private endTurnPending = false;
  private endTurnTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('Combat');
  }

  create() {
    // Phaser keeps a single instance of each scene across scene.start() calls,
    // so class-field initializers don't re-run. Reset per-combat state here.
    this.endHandled = false;
    this.cardViews = [];
    this.endTurnPending = false;
    this.endTurnTimer = null;

    setupPause(this);

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

    // Top HUD strip: name + HP bar for each side; intent under enemy bar.
    // Keeping all status UI above the sprites avoids collisions with the card hand.
    const hudY = 78;

    this.playerBar = new StatBar(this, width * 0.24, hudY, 280);
    this.enemyBar = new StatBar(this, width * 0.76, hudY, 280);
    this.add.existing(this.playerBar);
    this.add.existing(this.enemyBar);

    this.add
      .text(24, hudY, 'PILOT', {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    this.add
      .text(width - 24, hudY, this.state.enemy.def.name.toUpperCase(), {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      })
      .setOrigin(1, 0.5);

    this.intent = new IntentView(this, width * 0.76, hudY + 46);
    this.add.existing(this.intent);

    // Sprites — pushed slightly lower than midline so the HUD has clear sky above.
    const characterId = run.player.characterId ?? 'pilot';
    const drawCharacter = CHARACTER_SPRITES[characterId] ?? CHARACTER_SPRITES.pilot;
    this.mech = drawCharacter(this, width * 0.28, height * 0.48);
    const drawEnemy = ENEMY_SPRITES[this.state.enemy.def.id] ?? ENEMY_SPRITES.scrapRaider;
    this.enemySprite = drawEnemy(this, width * 0.72, height * 0.5);

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
    this.endTurnBg = this.add.rectangle(0, 0, 170, 64, COLORS.rust).setStrokeStyle(3, COLORS.brass);
    this.endTurnTxt = this.add
      .text(0, 0, 'END TURN', {
        fontFamily: FONTS.display,
        fontSize: '17px',
        color: hex(COLORS.bone),
        fontStyle: 'bold',
        align: 'center'
      })
      .setOrigin(0.5);
    c.add([this.endTurnBg, this.endTurnTxt]);
    this.endTurnBg.setInteractive({ useHandCursor: true });
    this.endTurnBg.on('pointerover', () => {
      if (!this.endTurnPending) this.endTurnBg.setFillStyle(COLORS.danger);
    });
    this.endTurnBg.on('pointerout', () => {
      if (!this.endTurnPending) this.endTurnBg.setFillStyle(COLORS.rust);
    });
    this.endTurnBg.on('pointerdown', () => this.onEndTurn());
    return c;
  }

  private startEndTurnConfirm() {
    this.endTurnPending = true;
    const steam = this.state.player.steam;
    this.endTurnTxt.setText(`CONFIRM?\n${steam} Steam unspent`);
    this.endTurnTxt.setColor(hex(COLORS.steelDark));
    this.endTurnBg.setFillStyle(COLORS.steam);
    if (this.endTurnTimer) this.endTurnTimer.remove();
    this.endTurnTimer = this.time.delayedCall(2000, () => this.cancelEndTurnConfirm());
  }

  private cancelEndTurnConfirm() {
    if (!this.endTurnPending) return;
    this.endTurnPending = false;
    this.endTurnTxt.setText('END TURN');
    this.endTurnTxt.setColor(hex(COLORS.bone));
    this.endTurnBg.setFillStyle(COLORS.rust);
    if (this.endTurnTimer) {
      this.endTurnTimer.remove();
      this.endTurnTimer = null;
    }
  }

  private onEndTurn() {
    if (this.state.phase !== 'playerTurn') return;
    // Require a second click to confirm only if the player has Steam left
    // AND at least one card in hand is actually playable. If nothing can be
    // played, the Steam is wasted no matter what — no point asking.
    const canPlayAnything = this.state.player.hand.some((c) => canPlay(this.state, c.uid));
    if (this.state.player.steam > 0 && canPlayAnything && !this.endTurnPending) {
      this.startEndTurnConfirm();
      return;
    }
    this.cancelEndTurnConfirm();
    sfx.endTurn();
    const pre = this.snapshot();
    endTurn(this.state, {
      afterEnemyResolve: () => this.emitDeltas(pre)
    });
    if (this.state.player.hull > 0 && this.state.phase === 'playerTurn') {
      // Brief enemy-acted shake
      this.shake(this.mech, 4);
    }
    this.refresh();
  }

  private onPlayCard(card: CardInstance) {
    if (!canPlay(this.state, card.uid)) return;
    this.cancelEndTurnConfirm();
    sfx.cardPlay();
    const view = this.cardViews.find((v) => v.card.uid === card.uid);
    if (view) {
      // Disable further hit testing on this card so a rapid second click
      // doesn't double-fire while the flourish runs.
      view.setPlayable(false);
      view.disableInteractive();
      this.tweens.add({
        targets: view,
        y: view.y - 50,
        alpha: 0,
        scaleX: 1.18,
        scaleY: 1.18,
        duration: 170,
        ease: 'Cubic.Out',
        onComplete: () => this.applyCardPlay(card)
      });
    } else {
      this.applyCardPlay(card);
    }
  }

  private applyCardPlay(card: CardInstance) {
    const pre = this.snapshot();
    const ok = playCard(this.state, card.uid);
    if (!ok) {
      this.refresh();
      return;
    }
    this.emitDeltas(pre);
    if (card.def.target === 'enemy') this.shake(this.enemySprite, 6);
    this.flashSteam();
    this.refresh();
  }

  // ===== Visual effect helpers =====

  private snapshot() {
    return {
      playerHull: this.state.player.hull,
      playerPlating: this.state.player.plating,
      enemyHull: this.state.enemy.hull,
      enemyPlating: this.state.enemy.plating
    };
  }

  private emitDeltas(prev: ReturnType<typeof this.snapshot>) {
    const cur = this.snapshot();
    const enemyPos = { x: this.enemySprite.x, y: this.enemySprite.y };
    const playerPos = { x: this.mech.x, y: this.mech.y };

    // Enemy side
    const eHullLoss = prev.enemyHull - cur.enemyHull;
    const ePlatingLoss = prev.enemyPlating - cur.enemyPlating;
    const ePlatingGain = cur.enemyPlating - prev.enemyPlating;
    if (eHullLoss > 0) {
      this.floatNumber(enemyPos.x, enemyPos.y - 60, `-${eHullLoss}`, COLORS.danger);
      this.hitRing(enemyPos.x, enemyPos.y, COLORS.danger);
      this.burst(enemyPos.x, enemyPos.y, COLORS.rust, 10);
      sfx.hit();
    }
    if (ePlatingLoss > 0 && eHullLoss <= 0) {
      this.floatNumber(enemyPos.x - 30, enemyPos.y - 40, `-${ePlatingLoss}`, COLORS.shield);
      this.burst(enemyPos.x, enemyPos.y, COLORS.shield, 6);
      sfx.platingAbsorb();
    }
    if (ePlatingGain > 0) {
      this.floatNumber(enemyPos.x + 30, enemyPos.y - 40, `+${ePlatingGain}`, COLORS.shield);
    }
    if (cur.enemyHull <= 0 && prev.enemyHull > 0) {
      this.burst(enemyPos.x, enemyPos.y, COLORS.rust, 24);
      this.hitRing(enemyPos.x, enemyPos.y, COLORS.danger);
      this.cameras.main.shake(220, 0.008);
    }

    // Player side
    const pHullLoss = prev.playerHull - cur.playerHull;
    const pHullGain = cur.playerHull - prev.playerHull;
    const pPlatingLoss = prev.playerPlating - cur.playerPlating;
    const pPlatingGain = cur.playerPlating - prev.playerPlating;
    if (pHullLoss > 0) {
      this.floatNumber(playerPos.x, playerPos.y - 60, `-${pHullLoss}`, COLORS.danger);
      this.hitRing(playerPos.x, playerPos.y, COLORS.danger);
      this.burst(playerPos.x, playerPos.y, COLORS.rust, 10);
      if (pHullLoss >= 10) this.cameras.main.shake(180, 0.006);
      sfx.hit();
    }
    if (pHullGain > 0) {
      this.floatNumber(playerPos.x, playerPos.y - 60, `+${pHullGain}`, COLORS.ok);
      sfx.heal();
    }
    if (pPlatingLoss > 0 && pHullLoss <= 0) {
      this.floatNumber(playerPos.x - 30, playerPos.y - 40, `-${pPlatingLoss}`, COLORS.shield);
      this.burst(playerPos.x, playerPos.y, COLORS.shield, 6);
      sfx.platingAbsorb();
    }
    if (pPlatingGain > 0) {
      this.floatNumber(playerPos.x + 30, playerPos.y - 40, `+${pPlatingGain}`, COLORS.shield);
    }
  }

  private floatNumber(x: number, y: number, text: string, color: number) {
    const t = this.add.text(x, y, text, {
      fontFamily: FONTS.display,
      fontSize: '30px',
      color: hex(color),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(900);
    this.tweens.add({
      targets: t,
      y: y - 70,
      alpha: 0,
      duration: 850,
      ease: 'Cubic.Out',
      onComplete: () => t.destroy()
    });
  }

  private burst(x: number, y: number, color: number, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const speed = 70 + Math.random() * 80;
      const size = 3 + Math.random() * 3;
      const p = this.add.rectangle(x, y, size, size, color).setDepth(800);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 450 + Math.random() * 250,
        ease: 'Cubic.Out',
        onComplete: () => p.destroy()
      });
    }
  }

  private hitRing(x: number, y: number, color: number) {
    const ring = this.add.circle(x, y, 36, color, 0.18).setStrokeStyle(3, color).setDepth(800);
    this.tweens.add({
      targets: ring,
      scaleX: 2.4,
      scaleY: 2.4,
      alpha: 0,
      duration: 380,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy()
    });
  }

  private flashSteam() {
    if (!this.steamText) return;
    const orig = this.steamText.scale;
    this.tweens.add({
      targets: this.steamText,
      scaleX: orig * 1.18,
      scaleY: orig * 1.18,
      duration: 90,
      yoyo: true,
      ease: 'Sine.Out'
    });
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

  private refresh() {
    const s = this.state;
    this.playerBar.update(s.player.hull, s.player.maxHull, s.player.plating, s.player.vulnerable, s.player.weak);
    this.enemyBar.update(s.enemy.hull, s.enemy.maxHull, s.enemy.plating, s.enemy.vulnerable, s.enemy.weak);
    this.intent.update(s.enemy.nextAction.intent);
    this.steamLabel.setText(`${s.player.steam}/${s.player.maxSteam}`);
    this.turnText.setText(`TURN ${s.turn}`);
    this.deckText.setText(`DRAW: ${s.player.draw.length}`);
    this.discardText.setText(`DISCARD: ${s.player.discard.length}    EXHAUST: ${s.player.exhaust.length}`);
    this.logText.setText(s.log.slice(-4).join('\n'));

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
      sfx.victory();
      this.bindContinue(nextScene);
    } else if (s.phase === 'defeat' && !this.endHandled) {
      this.endHandled = true;
      failCombat(s.player.hull);
      this.showOverlay('DEFEAT', 'Your mech is scrap. Press SPACE to view the map.', COLORS.danger);
      sfx.defeat();
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
    // Card center y so the card's bottom edge stays inside the viewport
    // (arc offset adds up to ~16px more for edge cards — included in the margin).
    const baseY = height - CARD_H * 0.5 - 16;
    const n = next.length;
    if (n === 0) return;

    const maxSpread = width - 360;
    const idealSpacing = CARD_W * 0.78;
    const spacing = n > 1 ? Math.min(idealSpacing, maxSpread / (n - 1)) : 0;
    const startX = width / 2 - (spacing * (n - 1)) / 2;
    const arc = 16;
    const rotMax = 0.08;
    // Each card "owns" a slot equal to its spacing — keeps adjacent hit areas
    // from overlapping so pointer events route to the visually-frontmost card.
    const slotWidth = Math.min(CARD_W, n > 1 ? spacing : CARD_W);

    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const x = startX + i * spacing;
      const y = baseY + Math.abs(t) * arc * 2;
      const rot = t * rotMax * 2;
      const view = next[i];
      view.setHome(x, y, rot, slotWidth);
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

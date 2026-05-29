import Phaser from 'phaser';
import {
  getRun,
  restHeal,
  restHealAmount,
  upgradeDeckCard,
  completeNode
} from '../game/run';
import { CARDS, isUpgradable } from '../game/cards';
import type { CardInstance } from '../game/types';
import { CardView, CARD_W, CARD_H } from '../ui/CardView';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { DESIGN_W, DESIGN_H, applyDesignFit, bindDesignFitResize } from '../ui/sceneFit';
import { COLORS, FONTS, hex } from '../ui/theme';

export class RestScene extends Phaser.Scene {
  private mainView!: Phaser.GameObjects.Container;
  private upgradeView!: Phaser.GameObjects.Container;
  private hullText!: Phaser.GameObjects.Text;

  constructor() {
    super('Rest');
  }

  create() {
    setupPause(this);
    const width = DESIGN_W;
    const height = DESIGN_H;
    applyDesignFit(this);
    bindDesignFitResize(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Quiet camp backdrop with a glowing fire
    const bg = this.add.graphics();
    bg.fillStyle(0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x1f1a16);
    bg.fillRect(0, height * 0.6, width, height * 0.4);

    // Campfire glow
    const fireGlow = this.add.graphics();
    fireGlow.fillStyle(COLORS.danger, 0.18);
    fireGlow.fillCircle(width / 2, height * 0.62, 220);
    fireGlow.fillStyle(COLORS.rust, 0.3);
    fireGlow.fillCircle(width / 2, height * 0.62, 120);

    // Fire shape
    const fire = this.add.graphics();
    fire.fillStyle(COLORS.steam);
    fire.fillTriangle(width / 2 - 28, height * 0.7, width / 2 + 28, height * 0.7, width / 2, height * 0.62);
    fire.fillStyle(COLORS.danger);
    fire.fillTriangle(width / 2 - 18, height * 0.7, width / 2 + 18, height * 0.7, width / 2, height * 0.66);
    this.tweens.add({ targets: fire, scaleY: 1.1, duration: 600, yoyo: true, repeat: -1 });

    this.mainView = this.add.container(0, 0);
    this.upgradeView = this.add.container(0, 0).setVisible(false);

    this.buildMainView();
    this.buildUpgradeView();
    this.refresh();
  }

  private buildMainView() {
    const width = DESIGN_W;
    const height = DESIGN_H;

    this.mainView.add(
      this.add.text(width / 2, 70, 'WAYSIDE CAMP', {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    this.mainView.add(
      this.add.text(width / 2, 110, 'A moment of quiet. Choose one.', {
        fontFamily: FONTS.body,
        fontSize: '14px',
        color: hex(COLORS.boneDim)
      }).setOrigin(0.5)
    );

    this.hullText = this.add.text(width - 24, 24, '', {
      fontFamily: FONTS.display,
      fontSize: '16px',
      color: hex(COLORS.bone),
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.mainView.add(this.hullText);

    // Two big choice panels
    const healAmt = restHealAmount();
    const r = getRun();

    const healBtn = new Button(
      this,
      width / 2 - 180,
      height - 130,
      `REPAIR  +${healAmt} HULL`,
      () => this.doHeal(),
      { width: 280, height: 70, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf }
    );
    this.mainView.add(healBtn);

    const anyUpgradable = r.player.deck.some(isUpgradable);
    const upgradeBtn = new Button(
      this,
      width / 2 + 180,
      height - 130,
      'UPGRADE A CARD',
      () => this.enterUpgradeMode(),
      { width: 280, height: 70, fontSize: 18, fill: COLORS.rust, hoverFill: COLORS.danger }
    );
    upgradeBtn.setEnabled(anyUpgradable);
    this.mainView.add(upgradeBtn);

    if (!anyUpgradable) {
      this.mainView.add(
        this.add.text(width / 2 + 180, height - 80, 'No upgradable cards.', {
          fontFamily: FONTS.body,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        }).setOrigin(0.5)
      );
    }
  }

  private buildUpgradeView() {
    const width = DESIGN_W;
    const height = DESIGN_H;

    this.upgradeView.add(
      this.add.text(width / 2, 50, 'CHOOSE A CARD TO UPGRADE', {
        fontFamily: FONTS.display,
        fontSize: '26px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    const cancel = new Button(
      this,
      width / 2,
      height - 50,
      'CANCEL',
      () => this.exitUpgradeMode(),
      { width: 160, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.upgradeView.add(cancel);
  }

  private layoutDeckForUpgrade() {
    const keep = this.upgradeView.list.slice(0, 2);
    this.upgradeView.removeAll(false);
    for (const c of keep) this.upgradeView.add(c);

    const width = DESIGN_W;
    const r = getRun();
    const deck = r.player.deck;

    const cols = Math.min(6, deck.length);
    const spacing = CARD_W * 0.85;
    const startX = width / 2 - ((cols - 1) * spacing) / 2;
    const rowH = CARD_H + 30;
    const startY = 130 + CARD_H / 2;

    deck.forEach((cardId, i) => {
      const def = CARDS[cardId];
      if (!def) return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacing;
      const y = startY + row * rowH;
      const fake: CardInstance = { uid: -3000 - i, def };
      const upgradable = isUpgradable(cardId);
      const view = new CardView(this, fake, () => {
        if (upgradable) this.confirmUpgrade(i);
      });
      view.setHome(x, y, 0);
      view.setPlayable(upgradable);
      this.upgradeView.add(view);
    });
  }

  private enterUpgradeMode() {
    this.mainView.setVisible(false);
    this.upgradeView.setVisible(true);
    this.layoutDeckForUpgrade();
  }

  private exitUpgradeMode() {
    this.upgradeView.setVisible(false);
    this.mainView.setVisible(true);
  }

  private confirmUpgrade(deckIndex: number) {
    if (!upgradeDeckCard(deckIndex)) return;
    this.finish();
  }

  private doHeal() {
    restHeal();
    this.finish();
  }

  private finish() {
    completeNode();
    this.cameras.main.fadeOut(220, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }

  private refresh() {
    const r = getRun();
    this.hullText.setText(`HULL  ${r.player.hull} / ${r.player.maxHull}`);
  }
}

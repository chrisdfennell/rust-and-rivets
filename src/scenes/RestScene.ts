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
import { runTutorial } from '../ui/TutorialOverlay';
import { COLORS, FONTS, hex } from '../ui/theme';

export class RestScene extends Phaser.Scene {
  private mainView!: Phaser.GameObjects.Container;
  private upgradeView!: Phaser.GameObjects.Container;
  private hullText!: Phaser.GameObjects.Text;
  private portrait = false;
  private viewW = 0;
  private viewH = 0;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super('Rest');
  }

  create() {
    setupPause(this);
    // Pull live viewport. Earlier the scene let applyDesignFit
    // letterbox a 1280×720 design into the actual canvas — phones
    // ended up with a tiny ribbon of UI and the deck-grid clipped
    // out. Now we lay out against real dims and branch portrait.
    const { width, height } = this.scale;
    this.viewW = width;
    this.viewH = height;
    this.portrait = height > width;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Quiet camp backdrop with a glowing fire
    const bg = this.add.graphics();
    bg.fillStyle(0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x1f1a16);
    bg.fillRect(0, height * 0.6, width, height * 0.4);

    // Campfire glow — radius scales with viewport width so the glow
    // doesn't dwarf a narrow portrait canvas.
    const glowR = Math.min(220, width * 0.35);
    const fireGlow = this.add.graphics();
    fireGlow.fillStyle(COLORS.danger, 0.18);
    fireGlow.fillCircle(width / 2, height * 0.62, glowR);
    fireGlow.fillStyle(COLORS.rust, 0.3);
    fireGlow.fillCircle(width / 2, height * 0.62, glowR * 0.55);

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

    runTutorial(this, 'rest', [
      {
        title: 'REST SITE',
        text:
          'A moment of quiet between fights. Choose ONE: repair some Hull, or upgrade a card ' +
          'to its stronger version. You can\'t do both — weigh staying alive against hitting ' +
          'harder down the road.'
      }
    ]);

    // Re-layout on rotation. Debounced because iOS Safari fires
    // resize twice on a single flip.
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

  private buildMainView() {
    const { viewW: width, viewH: height, portrait } = this;

    this.mainView.add(
      this.add.text(width / 2, portrait ? 50 : 70, 'WAYSIDE CAMP', {
        fontFamily: FONTS.display,
        fontSize: portrait ? '24px' : '32px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    this.mainView.add(
      this.add.text(width / 2, portrait ? 82 : 110, 'A moment of quiet. Choose one.', {
        fontFamily: FONTS.body,
        fontSize: portrait ? '12px' : '14px',
        color: hex(COLORS.boneDim),
        align: 'center',
        wordWrap: { width: Math.min(width - 32, 600) }
      }).setOrigin(0.5)
    );

    this.hullText = this.add.text(
      width - (portrait ? 12 : 24),
      portrait ? 12 : 24,
      '',
      {
        fontFamily: FONTS.display,
        fontSize: portrait ? '13px' : '16px',
        color: hex(COLORS.bone),
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0);
    this.mainView.add(this.hullText);

    // Two big choice panels. Landscape places them side-by-side along
    // the bottom; portrait stacks them vertically with the REPAIR
    // option above UPGRADE so heals are the easier-reach primary
    // action on a phone.
    const healAmt = restHealAmount();
    const r = getRun();
    const anyUpgradable = r.player.deck.some(isUpgradable);

    if (portrait) {
      const btnW = Math.min(width - 40, 320);
      const stackTop = Math.round(height * 0.5);
      const stackGap = 88;
      const healBtn = new Button(
        this,
        width / 2,
        stackTop,
        `REPAIR  +${healAmt} HULL`,
        () => this.doHeal(),
        { width: btnW, height: 72, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf }
      );
      this.mainView.add(healBtn);
      const upgradeBtn = new Button(
        this,
        width / 2,
        stackTop + stackGap,
        'UPGRADE A CARD',
        () => this.enterUpgradeMode(),
        { width: btnW, height: 72, fontSize: 18, fill: COLORS.rust, hoverFill: COLORS.danger }
      );
      upgradeBtn.setEnabled(anyUpgradable);
      this.mainView.add(upgradeBtn);

      if (!anyUpgradable) {
        this.mainView.add(
          this.add.text(width / 2, stackTop + stackGap + 48, 'No upgradable cards.', {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.boneDim)
          }).setOrigin(0.5)
        );
      }
    } else {
      const healBtn = new Button(
        this,
        width / 2 - 180,
        height - 130,
        `REPAIR  +${healAmt} HULL`,
        () => this.doHeal(),
        { width: 280, height: 70, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf }
      );
      this.mainView.add(healBtn);

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
  }

  private buildUpgradeView() {
    const { viewW: width, viewH: height, portrait } = this;

    this.upgradeView.add(
      this.add.text(width / 2, portrait ? 36 : 50, 'CHOOSE A CARD TO UPGRADE', {
        fontFamily: FONTS.display,
        fontSize: portrait ? '18px' : '26px',
        color: hex(COLORS.brass),
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: Math.min(width - 32, 800) }
      }).setOrigin(0.5)
    );

    const cancel = new Button(
      this,
      width / 2,
      height - (portrait ? 40 : 50),
      'CANCEL',
      () => this.exitUpgradeMode(),
      { width: 160, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.upgradeView.add(cancel);
  }

  private layoutDeckForUpgrade() {
    // Preserve the header + CANCEL button (added first in buildUpgradeView);
    // strip and re-add only the deck cards on every layout pass.
    const keep = this.upgradeView.list.slice(0, 2);
    this.upgradeView.removeAll(false);
    for (const c of keep) this.upgradeView.add(c);

    const { viewW: width, viewH: height, portrait } = this;
    const r = getRun();
    const deck = r.player.deck;

    // Grid + scale. Portrait uses 3 columns and shrinks the cards
    // uniformly so the WHOLE deck fits between the header and CANCEL
    // — even a long deck (12–15 cards) without scrolling. Landscape
    // keeps the historical 6-col layout at natural size.
    const headerH = portrait ? 64 : 130;
    const footerH = portrait ? 70 : 80;
    const margin = portrait ? 16 : 80;

    const cols = portrait ? 3 : Math.min(6, deck.length);
    const rows = Math.max(1, Math.ceil(deck.length / cols));
    const naturalCardSpacingX = portrait ? CARD_W + 12 : CARD_W * 0.85;
    const horizontalScale = portrait
      ? (width - margin * 2 + 12) / (cols * (CARD_W + 12))
      : 1;
    const availH = height - headerH - footerH;
    const verticalScale = portrait
      ? (availH + 12) / (rows * (CARD_H + 12))
      : 1;
    const cardScale = Math.min(1, horizontalScale, verticalScale);
    const effSpacingX = portrait ? (CARD_W + 12) * cardScale : naturalCardSpacingX;
    const effRowH = portrait
      ? (CARD_H + 12) * cardScale
      : CARD_H + 30;
    const startX = width / 2 - ((cols - 1) * effSpacingX) / 2;
    const startY = portrait
      ? headerH + (CARD_H * cardScale) / 2 + 4
      : 130 + CARD_H / 2;

    deck.forEach((cardId, i) => {
      const def = CARDS[cardId];
      if (!def) return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * effSpacingX;
      const y = startY + row * effRowH;
      const fake: CardInstance = { uid: -3000 - i, def };
      const upgradable = isUpgradable(cardId);
      const view = new CardView(this, fake, () => {
        if (upgradable) this.confirmUpgrade(i);
      });
      view.setHome(x, y, 0);
      view.setScale(cardScale);
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

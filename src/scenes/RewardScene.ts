import Phaser from 'phaser';
import { getRun, takeRewardCard, skipRewardCards } from '../game/run';
import { CARDS } from '../game/cards';
import { RELICS } from '../game/relics';
import { POTIONS } from '../game/potions';
import type { CardInstance } from '../game/types';
import { CardView, CARD_W, CARD_H } from '../ui/CardView';
import { drawPotionIcon } from '../ui/PotionIcon';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { DESIGN_W, DESIGN_H, applyDesignFit, bindDesignFitResize } from '../ui/sceneFit';
import { COLORS, FONTS, hex } from '../ui/theme';

export class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  create() {
    setupPause(this);
    const width = DESIGN_W;
    const height = DESIGN_H;
    applyDesignFit(this);
    bindDesignFitResize(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — quiet aftermath
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x2a2018, 0.4);
    bg.fillRect(0, height * 0.55, width, height * 0.45);

    const run = getRun();
    const reward = run.pendingReward;
    if (!reward) {
      // Nothing staged — go back to map
      this.scene.start('Map');
      return;
    }

    // Title
    const title = reward.fromElite ? 'ELITE SALVAGE' : 'SALVAGE';
    this.add
      .text(width / 2, 60, title, {
        fontFamily: FONTS.display,
        fontSize: '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 100, `+${reward.scrap} scrap collected`, {
        fontFamily: FONTS.display,
        fontSize: '16px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Potion drop line. Slice 58 — vector icon to the left of the text
    // line. Both are centered together so the row reads as a single unit.
    if (reward.potionId) {
      const def = POTIONS[reward.potionId];
      const label = `+1 potion: ${def?.name ?? reward.potionId}`;
      const text = this.add
        .text(0, 0, label, {
          fontFamily: FONTS.display,
          fontSize: '14px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        })
        .setOrigin(0, 0.5);
      const iconSize = 22;
      const gap = 8;
      const totalW = iconSize + gap + text.width;
      const startX = width / 2 - totalW / 2;
      const icon = drawPotionIcon(this, reward.potionId, startX + iconSize / 2, 124, 1.1);
      void icon;
      text.setPosition(startX + iconSize + gap, 124);
    }

    // Relic banner (elite only)
    let cardsTop = 160;
    if (reward.relicId) {
      const def = RELICS[reward.relicId];
      const panelY = 150;
      const panel = this.add.rectangle(width / 2, panelY, 700, 60, COLORS.bgPanel)
        .setStrokeStyle(2, COLORS.danger);
      const icon = this.add
        .text(width / 2 - 320, panelY, '★', {
          fontFamily: FONTS.display,
          fontSize: '28px',
          color: hex(COLORS.danger),
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
      const name = this.add
        .text(width / 2 - 290, panelY - 10, def?.name ?? reward.relicId, {
          fontFamily: FONTS.display,
          fontSize: '16px',
          color: hex(COLORS.bone),
          fontStyle: 'bold'
        })
        .setOrigin(0, 0.5);
      const desc = this.add
        .text(width / 2 - 290, panelY + 10, def?.description ?? '', {
          fontFamily: FONTS.body,
          fontSize: '12px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0, 0.5);
      void panel; void icon; void name; void desc;
      cardsTop = 230;
    }

    // Card-pick prompt
    this.add
      .text(width / 2, cardsTop + 10, 'PICK ONE — OR SKIP', {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    // The three cards
    const cards = reward.cards;
    const spacing = CARD_W + 60;
    const startX = width / 2 - ((cards.length - 1) * spacing) / 2;
    const cardY = cardsTop + 80 + CARD_H / 2;

    cards.forEach((cardId, i) => {
      const def = CARDS[cardId];
      if (!def) return;
      const fake: CardInstance = { uid: -5000 - i, def };
      const view = new CardView(this, fake, () => this.pick(cardId));
      view.setHome(startX + i * spacing, cardY, 0);
      this.add.existing(view);
    });

    // Skip button
    const skipBtn = new Button(
      this,
      width / 2,
      height - 70,
      'SKIP',
      () => this.skip(),
      { width: 200, fontSize: 16, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(skipBtn);
  }

  private pick(cardId: string) {
    takeRewardCard(cardId);
    this.exit();
  }

  private skip() {
    skipRewardCards();
    this.exit();
  }

  private exit() {
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}

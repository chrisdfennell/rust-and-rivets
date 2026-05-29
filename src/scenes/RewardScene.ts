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
import { COLORS, FONTS, hex } from '../ui/theme';

export class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  create() {
    setupPause(this);
    // Read the live viewport. RESIZE mode hands us actual canvas dims,
    // so we lay out responsively instead of letterboxing a 1280×720
    // design into a portrait phone (which used to render unreadably
    // small).
    const { width, height } = this.scale;
    const portrait = height > width;
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
    const titleY = portrait ? 40 : 60;
    const titleSize = portrait ? 28 : 36;
    this.add
      .text(width / 2, titleY, title, {
        fontFamily: FONTS.display,
        fontSize: `${titleSize}px`,
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const scrapY = portrait ? 76 : 100;
    this.add
      .text(width / 2, scrapY, `+${reward.scrap} scrap collected`, {
        fontFamily: FONTS.display,
        fontSize: portrait ? '14px' : '16px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Potion drop line. Vector icon to the left of the text line; both
    // centered together so the row reads as a single unit.
    let cursorY = scrapY + (portrait ? 22 : 24);
    if (reward.potionId) {
      const def = POTIONS[reward.potionId];
      const label = `+1 potion: ${def?.name ?? reward.potionId}`;
      const text = this.add
        .text(0, 0, label, {
          fontFamily: FONTS.display,
          fontSize: portrait ? '13px' : '14px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        })
        .setOrigin(0, 0.5);
      const iconSize = 22;
      const gap = 8;
      const totalW = iconSize + gap + text.width;
      const startX = width / 2 - totalW / 2;
      drawPotionIcon(this, reward.potionId, startX + iconSize / 2, cursorY, 1.1);
      text.setPosition(startX + iconSize + gap, cursorY);
      cursorY += 30;
    }

    // Relic banner (elite only). In portrait the panel hugs the viewport
    // width and stacks icon + name on one row, description below.
    if (reward.relicId) {
      const def = RELICS[reward.relicId];
      if (portrait) {
        const panelW = Math.min(width - 32, 460);
        const panelH = 64;
        const panelY = cursorY + panelH / 2;
        this.add.rectangle(width / 2, panelY, panelW, panelH, COLORS.bgPanel)
          .setStrokeStyle(2, COLORS.danger);
        // Star + name on the top row, centered as a group.
        const name = def?.name ?? reward.relicId;
        const nameText = this.add
          .text(0, 0, name, {
            fontFamily: FONTS.display,
            fontSize: '14px',
            color: hex(COLORS.bone),
            fontStyle: 'bold'
          })
          .setOrigin(0, 0.5);
        const star = this.add
          .text(0, 0, '★', {
            fontFamily: FONTS.display,
            fontSize: '20px',
            color: hex(COLORS.danger),
            fontStyle: 'bold'
          })
          .setOrigin(0, 0.5);
        const rowW = 22 + nameText.width;
        const rowX = width / 2 - rowW / 2;
        star.setPosition(rowX, panelY - 12);
        nameText.setPosition(rowX + 22, panelY - 12);
        this.add
          .text(width / 2, panelY + 12, def?.description ?? '', {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(COLORS.boneDim),
            align: 'center',
            wordWrap: { width: panelW - 24 }
          })
          .setOrigin(0.5);
        cursorY = panelY + panelH / 2 + 12;
      } else {
        const panelY = 150;
        this.add.rectangle(width / 2, panelY, 700, 60, COLORS.bgPanel)
          .setStrokeStyle(2, COLORS.danger);
        this.add
          .text(width / 2 - 320, panelY, '★', {
            fontFamily: FONTS.display,
            fontSize: '28px',
            color: hex(COLORS.danger),
            fontStyle: 'bold'
          })
          .setOrigin(0.5);
        this.add
          .text(width / 2 - 290, panelY - 10, def?.name ?? reward.relicId, {
            fontFamily: FONTS.display,
            fontSize: '16px',
            color: hex(COLORS.bone),
            fontStyle: 'bold'
          })
          .setOrigin(0, 0.5);
        this.add
          .text(width / 2 - 290, panelY + 10, def?.description ?? '', {
            fontFamily: FONTS.body,
            fontSize: '12px',
            color: hex(COLORS.boneDim)
          })
          .setOrigin(0, 0.5);
        cursorY = 230;
      }
    } else if (!portrait) {
      cursorY = 160;
    }

    // Card-pick prompt
    const promptY = cursorY + 12;
    this.add
      .text(width / 2, promptY, 'PICK ONE — OR SKIP', {
        fontFamily: FONTS.display,
        fontSize: portrait ? '13px' : '14px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    // The three cards. Portrait scales the cards so 3 always fit within
    // the viewport width with consistent margins; landscape keeps the
    // original natural size + roomy spacing.
    const cards = reward.cards;
    const skipBtnY = height - (portrait ? 56 : 70);
    const skipBtnH = 56;
    const cardsAvailH = skipBtnY - skipBtnH - promptY - 24;
    let cardScale = 1;
    let cardSpacing = CARD_W + 60;
    if (portrait) {
      const margin = 24;
      const gap = 18;
      const naturalRowW = cards.length * CARD_W + (cards.length - 1) * gap;
      const widthScale = (width - margin * 2) / naturalRowW;
      // Also fit vertically — cards can't be taller than the band between
      // the prompt and the SKIP button.
      const heightScale = cardsAvailH / CARD_H;
      cardScale = Math.min(1, widthScale, heightScale);
      cardSpacing = CARD_W * cardScale + gap;
    }
    const startX = width / 2 - ((cards.length - 1) * cardSpacing) / 2;
    const cardY = portrait
      ? promptY + 24 + (CARD_H * cardScale) / 2
      : promptY + 80 + CARD_H / 2;

    cards.forEach((cardId, i) => {
      const def = CARDS[cardId];
      if (!def) return;
      const fake: CardInstance = { uid: -5000 - i, def };
      const view = new CardView(this, fake, () => this.pick(cardId));
      view.setHome(startX + i * cardSpacing, cardY, 0);
      view.setScale(cardScale);
      this.add.existing(view);
    });

    // Skip button
    const skipBtn = new Button(
      this,
      width / 2,
      skipBtnY,
      'SKIP',
      () => this.skip(),
      { width: 200, fontSize: 16, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(skipBtn);

    // Re-layout on rotation so the scene survives the user flipping
    // their phone mid-pick.
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private handleResize = () => {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      this.scene.restart();
    }, 120);
  };

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

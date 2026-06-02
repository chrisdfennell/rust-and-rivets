import Phaser from 'phaser';
import { getRun, buyOffer, buyPotionOffer, removeCardFromDeck, completeNode, hasOpenPotionSlot, type ShopOffer, type PotionShopOffer } from '../game/run';
import { CARDS } from '../game/cards';
import { POTIONS } from '../game/potions';
import type { CardInstance } from '../game/types';
import { CardView, CARD_W, CARD_H } from '../ui/CardView';
import { drawPotionIcon } from '../ui/PotionIcon';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { runTutorial } from '../ui/TutorialOverlay';
import { COLORS, FONTS, hex } from '../ui/theme';

export class ShopScene extends Phaser.Scene {
  private mainView!: Phaser.GameObjects.Container;
  private removalView!: Phaser.GameObjects.Container;
  private scrapText!: Phaser.GameObjects.Text;
  private offerSlots: Phaser.GameObjects.Container[] = [];
  private potionSlot: Phaser.GameObjects.Container | null = null;
  private removeBtn!: Button;
  private mode: 'main' | 'removing' = 'main';
  private portrait = false;
  private viewW = 0;
  private viewH = 0;
  private offerCardScale = 1;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super('Shop');
  }

  create() {
    this.offerSlots = [];
    this.potionSlot = null;
    this.mode = 'main';
    setupPause(this);

    // Slice 56 — defensive bailout. enterNode() + completeNode() both
    // sanitize pendingShop, but if scene routing ever lands here without
    // one (broken save, exploit, future bug), the LEAVE button below
    // wouldn't render and the player would be stuck. Bounce to the map
    // before rendering anything.
    if (!getRun().pendingShop) {
      this.scene.start('Map');
      return;
    }

    const { width, height } = this.scale;
    this.viewW = width;
    this.viewH = height;
    this.portrait = height > width;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Cluttered backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x1f1a16);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.7, width, height * 0.3);

    this.mainView = this.add.container(0, 0);
    this.removalView = this.add.container(0, 0).setVisible(false);

    this.buildMainView();
    this.buildRemovalView();
    this.refresh();

    runTutorial(this, 'shop', [
      {
        title: 'THE SHOP',
        text:
          'Scrap is your in-run currency. Spend it here on cards, relics, and potions, or ' +
          'pay for the one-time card-removal service to thin your deck. Buy what sharpens ' +
          'your build, then leave whenever you like — you keep any Scrap you don\'t spend.'
      }
    ]);

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
      this.add.text(width / 2, portrait ? 36 : 50, 'SCRAP YARD', {
        fontFamily: FONTS.display,
        fontSize: portrait ? '24px' : '32px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    this.mainView.add(
      this.add.text(width / 2, portrait ? 66 : 90, 'Trade your scrap for parts. Don\'t haggle.', {
        fontFamily: FONTS.body,
        fontSize: portrait ? '11px' : '13px',
        color: hex(COLORS.boneDim),
        align: 'center',
        wordWrap: { width: Math.min(width - 32, 600) }
      }).setOrigin(0.5)
    );

    // Scrap badge top-right
    this.scrapText = this.add.text(
      width - (portrait ? 12 : 24),
      portrait ? 12 : 24,
      '',
      {
        fontFamily: FONTS.display,
        fontSize: portrait ? '14px' : '18px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0);
    this.mainView.add(this.scrapText);

    // Offer slots. Portrait packs the typically-5 card offers into a
    // 2 / 3 grid with scaled cards so they all fit between the header
    // and the action buttons. Landscape keeps the historical row.
    const shop = getRun().pendingShop;
    if (!shop) return;
    const n = shop.offers.length;

    if (portrait) {
      const margin = 16;
      const headerH = 90;
      const potionH = shop.potionOffer ? 76 : 0;
      const footerH = 150; // remove + leave + breathing room above
      const availH = height - headerH - potionH - footerH;
      const cols = Math.min(3, n);
      const rows = Math.max(1, Math.ceil(n / cols));
      const gapX = 8;
      const gapY = 36; // extra to fit the price text under each card
      // Solve for cardScale that fits both axes.
      const hScale = (width - margin * 2 + gapX) / (cols * (CARD_W + gapX));
      const vScale = (availH + gapY) / (rows * (CARD_H + gapY));
      this.offerCardScale = Math.min(1, hScale, vScale);
      const effW = CARD_W * this.offerCardScale;
      const effH = CARD_H * this.offerCardScale;
      const spacingX = effW + gapX;
      const spacingY = effH + gapY;
      const startX = width / 2 - ((cols - 1) * spacingX) / 2;
      const startY = headerH + effH / 2;
      shop.offers.forEach((offer, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const slot = this.add.container(startX + col * spacingX, startY + row * spacingY);
        this.mainView.add(slot);
        this.offerSlots.push(slot);
        this.renderOffer(slot, offer, i);
      });

      if (shop.potionOffer) {
        const potionY = headerH + rows * spacingY + 24;
        const panel = this.add.container(width / 2, potionY);
        this.mainView.add(panel);
        this.potionSlot = panel;
        this.renderPotionOffer(panel, shop.potionOffer);
      }
    } else {
      this.offerCardScale = 1;
      const spacing = CARD_W + 80;
      const startX = width / 2 - ((n - 1) * spacing) / 2;
      const offerY = height / 2 - 30;
      shop.offers.forEach((offer, i) => {
        const slot = this.add.container(startX + i * spacing, offerY);
        this.mainView.add(slot);
        this.offerSlots.push(slot);
        this.renderOffer(slot, offer, i);
      });
      if (shop.potionOffer) {
        const panel = this.add.container(width / 2, offerY + CARD_H / 2 + 80);
        this.mainView.add(panel);
        this.potionSlot = panel;
        this.renderPotionOffer(panel, shop.potionOffer);
      }
    }

    // Action buttons. Portrait stacks REMOVE + LEAVE vertically against
    // the bottom edge for thumb reach.
    const r = getRun();
    if (portrait) {
      const btnW = Math.min(width - 40, 280);
      const removeY = height - 110;
      this.removeBtn = new Button(
        this,
        width / 2,
        removeY,
        `REMOVE A CARD — ${r.pendingShop?.removalPrice ?? 0}`,
        () => this.enterRemovalMode(),
        { width: btnW, height: 48, fontSize: 14, fill: COLORS.steelDark, hoverFill: COLORS.steel }
      );
      this.mainView.add(this.removeBtn);
      const leave = new Button(
        this,
        width / 2,
        removeY + 56,
        'LEAVE',
        () => this.leave(),
        { width: btnW, height: 48, fontSize: 15 }
      );
      this.mainView.add(leave);
    } else {
      this.removeBtn = new Button(
        this,
        width / 2 - 100,
        height - 90,
        `REMOVE A CARD — ${r.pendingShop?.removalPrice ?? 0}`,
        () => this.enterRemovalMode(),
        { width: 240, fill: COLORS.steelDark, hoverFill: COLORS.steel }
      );
      this.mainView.add(this.removeBtn);
      const leave = new Button(
        this,
        width / 2 + 100,
        height - 90,
        'LEAVE',
        () => this.leave(),
        { width: 160 }
      );
      this.mainView.add(leave);
    }
  }

  private renderOffer(slot: Phaser.GameObjects.Container, offer: ShopOffer, index: number) {
    slot.removeAll(true);
    const def = CARDS[offer.cardId];
    if (!def) return;

    const r = getRun();
    const canAfford = r.scrap >= offer.price && !offer.sold;
    const cardScale = this.offerCardScale;
    const effH = CARD_H * cardScale;

    if (offer.sold) {
      // Just a "SOLD" tombstone, sized to match the card scale
      const placeholder = this.add
        .rectangle(0, 0, CARD_W * cardScale, effH, COLORS.steelDark)
        .setStrokeStyle(2, COLORS.brassDim);
      const soldText = this.add.text(0, 0, 'SOLD', {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '14px' : '20px',
        color: hex(COLORS.brassDim),
        fontStyle: 'bold'
      }).setOrigin(0.5);
      slot.add([placeholder, soldText]);
      return;
    }

    const fake: CardInstance = { uid: -1000 - index, def };
    const cardView = new CardView(this, fake, () => {
      if (canAfford) this.tryBuy(index);
    });
    cardView.setHome(0, 0, 0);
    cardView.setScale(cardScale);
    cardView.setPlayable(canAfford);
    slot.add(cardView);

    const priceColor = canAfford ? COLORS.steam : COLORS.danger;
    const priceText = this.add
      .text(0, effH / 2 + (this.portrait ? 12 : 24), `${offer.price} SCRAP`, {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '12px' : '18px',
        color: hex(priceColor),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    slot.add(priceText);
  }

  private tryBuy(index: number) {
    if (!buyOffer(index)) return;
    this.refresh();
  }

  private renderPotionOffer(slot: Phaser.GameObjects.Container, offer: PotionShopOffer) {
    slot.removeAll(true);
    const def = POTIONS[offer.potionId];
    if (!def) return;

    const r = getRun();
    const room = hasOpenPotionSlot();
    const canAfford = !offer.sold && room && r.scrap >= offer.price;

    const w = this.portrait ? Math.min(this.viewW - 32, 320) : 320;
    const h = this.portrait ? 56 : 64;
    const fill = offer.sold ? COLORS.steelDark : COLORS.bgPanel;
    const stroke = canAfford ? COLORS.brass : COLORS.brassDim;
    const bg = this.add.rectangle(0, 0, w, h, fill).setStrokeStyle(2, stroke);

    let priceLabel: string;
    let priceColor: number;
    if (offer.sold) {
      priceLabel = 'SOLD';
      priceColor = COLORS.brassDim;
    } else if (!room) {
      priceLabel = 'BELT FULL';
      priceColor = COLORS.danger;
    } else {
      priceLabel = `${offer.price} SCRAP`;
      priceColor = canAfford ? COLORS.steam : COLORS.danger;
    }

    // Procedural vector icon on the left of the offer.
    const iconHolder = this.add.container(-w / 2 + 22, 0);
    const icon = drawPotionIcon(this, offer.potionId, 0, 0, 1.3);
    if (icon) iconHolder.add(icon);
    const nameX = -w / 2 + 46;
    const name = this.add
      .text(nameX, -10, def.name, {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '13px' : '15px',
        color: hex(canAfford ? COLORS.bone : COLORS.boneDim),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);
    const desc = this.add
      .text(nameX, 12, def.description, {
        fontFamily: FONTS.body,
        fontSize: this.portrait ? '10px' : '11px',
        color: hex(COLORS.boneDim),
        wordWrap: { width: w - 100 }
      })
      .setOrigin(0, 0.5);
    const price = this.add
      .text(w / 2 - 14, 0, priceLabel, {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '12px' : '14px',
        color: hex(priceColor),
        fontStyle: 'bold'
      })
      .setOrigin(1, 0.5);
    slot.add([bg, iconHolder, name, desc, price]);

    if (canAfford) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.tryBuyPotion());
    }
  }

  private tryBuyPotion() {
    if (!buyPotionOffer()) return;
    this.refresh();
  }

  private buildRemovalView() {
    const { viewW: width, viewH: height, portrait } = this;

    this.removalView.add(
      this.add.text(width / 2, portrait ? 36 : 50, 'CHOOSE A CARD TO SCRAP', {
        fontFamily: FONTS.display,
        fontSize: portrait ? '18px' : '26px',
        color: hex(COLORS.brass),
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: Math.min(width - 32, 800) }
      }).setOrigin(0.5)
    );

    // CANCEL button
    const cancel = new Button(
      this,
      width / 2,
      height - (portrait ? 40 : 50),
      'CANCEL',
      () => this.exitRemovalMode(),
      { width: 160, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.removalView.add(cancel);
  }

  private layoutDeckForRemoval() {
    // Preserve the header + CANCEL (added first in buildRemovalView);
    // strip and re-add only the deck cards each layout pass.
    const keep = this.removalView.list.slice(0, 2);
    this.removalView.removeAll(false);
    for (const c of keep) this.removalView.add(c);

    const { viewW: width, viewH: height, portrait } = this;
    const r = getRun();
    const deck = r.player.deck;

    // Portrait: 3-col auto-fit grid that scales so the entire deck
    // fits between header and CANCEL (matches RestScene's upgrade
    // view). Landscape: original 6-col layout at natural scale.
    const headerH = portrait ? 64 : 130;
    const footerH = portrait ? 70 : 80;
    const margin = portrait ? 16 : 80;
    const cols = portrait ? 3 : Math.min(6, deck.length);
    const rows = Math.max(1, Math.ceil(deck.length / cols));
    const availH = height - headerH - footerH;
    const horizontalScale = portrait
      ? (width - margin * 2 + 12) / (cols * (CARD_W + 12))
      : 1;
    const verticalScale = portrait
      ? (availH + 12) / (rows * (CARD_H + 12))
      : 1;
    const cardScale = Math.min(1, horizontalScale, verticalScale);
    const effSpacingX = portrait ? (CARD_W + 12) * cardScale : CARD_W * 0.85;
    const effRowH = portrait ? (CARD_H + 12) * cardScale : CARD_H + 30;
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
      const fake: CardInstance = { uid: -2000 - i, def };
      const view = new CardView(this, fake, () => this.confirmRemove(i));
      view.setHome(x, y, 0);
      view.setScale(cardScale);
      this.removalView.add(view);
    });
  }

  private enterRemovalMode() {
    this.mode = 'removing';
    this.mainView.setVisible(false);
    this.removalView.setVisible(true);
    this.layoutDeckForRemoval();
  }

  private exitRemovalMode() {
    this.mode = 'main';
    this.removalView.setVisible(false);
    this.mainView.setVisible(true);
    this.refresh();
  }

  private confirmRemove(deckIndex: number) {
    if (!removeCardFromDeck(deckIndex)) return;
    this.exitRemovalMode();
  }

  private leave() {
    completeNode();
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }

  private refresh() {
    const r = getRun();
    this.scrapText.setText(`SCRAP  ${r.scrap}`);

    const shop = r.pendingShop;
    if (shop) {
      shop.offers.forEach((offer, i) => {
        const slot = this.offerSlots[i];
        if (slot) this.renderOffer(slot, offer, i);
      });
      if (shop.potionOffer && this.potionSlot) {
        this.renderPotionOffer(this.potionSlot, shop.potionOffer);
      }
      const canRemove =
        !shop.removalUsed &&
        r.scrap >= shop.removalPrice &&
        r.player.deck.length > 1;
      this.removeBtn.setEnabled(canRemove);
      if (shop.removalUsed) this.removeBtn.setLabel('REMOVAL USED');
    }

    if (this.mode === 'removing') this.layoutDeckForRemoval();
  }
}

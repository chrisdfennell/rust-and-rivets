import Phaser from 'phaser';
import { getRun, buyOffer, buyPotionOffer, removeCardFromDeck, completeNode, hasOpenPotionSlot, type ShopOffer, type PotionShopOffer } from '../game/run';
import { CARDS } from '../game/cards';
import { POTIONS } from '../game/potions';
import type { CardInstance } from '../game/types';
import { CardView, CARD_W, CARD_H } from '../ui/CardView';
import { drawPotionIcon } from '../ui/PotionIcon';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { DESIGN_W, DESIGN_H, applyDesignFit, bindDesignFitResize } from '../ui/sceneFit';
import { COLORS, FONTS, hex } from '../ui/theme';

export class ShopScene extends Phaser.Scene {
  private mainView!: Phaser.GameObjects.Container;
  private removalView!: Phaser.GameObjects.Container;
  private scrapText!: Phaser.GameObjects.Text;
  private offerSlots: Phaser.GameObjects.Container[] = [];
  private potionSlot: Phaser.GameObjects.Container | null = null;
  private removeBtn!: Button;
  private mode: 'main' | 'removing' = 'main';

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

    const width = DESIGN_W;
    const height = DESIGN_H;
    applyDesignFit(this);
    bindDesignFitResize(this);
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
  }

  private buildMainView() {
    const width = DESIGN_W;
    const height = DESIGN_H;

    this.mainView.add(
      this.add.text(width / 2, 50, 'SCRAP YARD', {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    this.mainView.add(
      this.add.text(width / 2, 90, 'Trade your scrap for parts. Don\'t haggle.', {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      }).setOrigin(0.5)
    );

    // Scrap badge top-right
    this.scrapText = this.add.text(width - 24, 24, '', {
      fontFamily: FONTS.display,
      fontSize: '18px',
      color: hex(COLORS.steam),
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.mainView.add(this.scrapText);

    // Offer slots
    const shop = getRun().pendingShop;
    if (!shop) return;
    const n = shop.offers.length;
    const spacing = CARD_W + 80;
    const startX = width / 2 - ((n - 1) * spacing) / 2;
    const offerY = height / 2 - 30;

    shop.offers.forEach((offer, i) => {
      const slot = this.add.container(startX + i * spacing, offerY);
      this.mainView.add(slot);
      this.offerSlots.push(slot);
      this.renderOffer(slot, offer, i);
    });

    // Potion offer — small panel below the card row.
    if (shop.potionOffer) {
      const panel = this.add.container(width / 2, offerY + CARD_H / 2 + 80);
      this.mainView.add(panel);
      this.potionSlot = panel;
      this.renderPotionOffer(panel, shop.potionOffer);
    }

    // Remove a card button
    const r = getRun();
    this.removeBtn = new Button(
      this,
      width / 2 - 100,
      height - 90,
      `REMOVE A CARD — ${r.pendingShop?.removalPrice ?? 0}`,
      () => this.enterRemovalMode(),
      { width: 240, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.mainView.add(this.removeBtn);

    // Leave
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

  private renderOffer(slot: Phaser.GameObjects.Container, offer: ShopOffer, index: number) {
    slot.removeAll(true);
    const def = CARDS[offer.cardId];
    if (!def) return;

    const r = getRun();
    const canAfford = r.scrap >= offer.price && !offer.sold;

    if (offer.sold) {
      // Just a "SOLD" tombstone
      const placeholder = this.add.rectangle(0, 0, CARD_W, CARD_H, COLORS.steelDark).setStrokeStyle(2, COLORS.brassDim);
      const soldText = this.add.text(0, 0, 'SOLD', {
        fontFamily: FONTS.display,
        fontSize: '20px',
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
    cardView.setPlayable(canAfford);
    slot.add(cardView);

    const priceColor = canAfford ? COLORS.steam : COLORS.danger;
    const priceText = this.add.text(0, CARD_H / 2 + 24, `${offer.price} SCRAP`, {
      fontFamily: FONTS.display,
      fontSize: '18px',
      color: hex(priceColor),
      fontStyle: 'bold'
    }).setOrigin(0.5);
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

    const w = 320;
    const h = 64;
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

    // Slice 58 — procedural vector icon on the left of the offer. Falls
    // back to nothing if the potion id doesn't have a registered drawer
    // (shouldn't happen — POTION_ICONS mirrors the potions registry).
    const iconHolder = this.add.container(-w / 2 + 22, 0);
    const icon = drawPotionIcon(this, offer.potionId, 0, 0, 1.3);
    if (icon) iconHolder.add(icon);
    const nameX = -w / 2 + 46;
    const name = this.add
      .text(nameX, -10, def.name, {
        fontFamily: FONTS.display,
        fontSize: '15px',
        color: hex(canAfford ? COLORS.bone : COLORS.boneDim),
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);
    const desc = this.add
      .text(nameX, 12, def.description, {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0, 0.5);
    const price = this.add
      .text(w / 2 - 14, 0, priceLabel, {
        fontFamily: FONTS.display,
        fontSize: '14px',
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
    const width = DESIGN_W;
    const height = DESIGN_H;

    this.removalView.add(
      this.add.text(width / 2, 50, 'CHOOSE A CARD TO SCRAP', {
        fontFamily: FONTS.display,
        fontSize: '26px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    // CANCEL button
    const cancel = new Button(
      this,
      width / 2,
      height - 50,
      'CANCEL',
      () => this.exitRemovalMode(),
      { width: 160, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.removalView.add(cancel);
  }

  private layoutDeckForRemoval() {
    // Clear deck cards (but keep title and cancel button)
    const keep = this.removalView.list.slice(0, 2);
    this.removalView.removeAll(false);
    for (const c of keep) this.removalView.add(c);

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
      const fake: CardInstance = { uid: -2000 - i, def };
      const view = new CardView(this, fake, () => this.confirmRemove(i));
      view.setHome(x, y, 0);
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

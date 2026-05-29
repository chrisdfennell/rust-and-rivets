import Phaser from 'phaser';
import { startRun, clearSavedRun } from '../game/run';
import { CHARACTERS, type CharacterDef } from '../game/characters';
import { RELICS } from '../game/relics';
import { isCharacterUnlocked, unlockRequirementFor } from '../game/meta';
import { CHARACTER_SPRITES } from '../ui/MechSprite';
import { Button } from '../ui/Button';
import { COLORS, FONTS, hex } from '../ui/theme';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelect');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop: hangar bay
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x14110f);
    bg.fillRect(0, height * 0.78, width, height * 0.22);
    bg.fillStyle(COLORS.brass, 0.05);
    bg.fillCircle(width / 2, height * 0.42, 320);

    // Title
    this.add
      .text(width / 2, 50, 'CHOOSE YOUR PILOT', {
        fontFamily: FONTS.display,
        fontSize: '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 92, 'Each rig wears the wasteland differently.', {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5);

    // Cards stay at a fixed width; if the row doesn't fit the viewport we
    // let the player drag horizontally to scroll. drawCharacterCard now
    // returns a Container so the whole row lives inside cardsLayer.
    const cardW = 380;
    const gap = 30;
    const cardCount = CHARACTERS.length;
    const totalContentW = cardCount * cardW + (cardCount - 1) * gap;
    const cardsLayer = this.add.container(width / 2, 390);

    CHARACTERS.forEach((c, i) => {
      const localX = -totalContentW / 2 + cardW / 2 + i * (cardW + gap);
      cardsLayer.add(this.drawCharacterCard(c, localX, 0, cardW));
    });

    // Drag-scroll bounds — only scroll if the row is wider than the
    // visible margin-trimmed viewport. minX/maxX are the allowed
    // container-x positions (clamped during drag).
    const viewable = width - 80; // 40 px margin each side
    const overflow = Math.max(0, totalContentW - viewable);
    const minX = width / 2 - overflow / 2;
    const maxX = width / 2 + overflow / 2;

    if (overflow > 0) {
      this.setupDragScroll(cardsLayer, minX, maxX);
      // Small hint at the bottom so the player knows the row scrolls.
      this.add
        .text(width / 2, height - 100, 'DRAG TO SCROLL', {
          fontFamily: FONTS.display,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0.5);
    }

    // Back button (top-left)
    const back = new Button(
      this,
      120,
      height - 50,
      'BACK',
      () => this.scene.start('Title'),
      { width: 180, height: 44, fontSize: 14, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(back);
  }

  // Adds scene-level pointer handlers that drag `layer` horizontally.
  // Uses a small distance threshold so accidental moves during a SELECT
  // button click don't trigger scroll.
  private setupDragScroll(layer: Phaser.GameObjects.Container, minX: number, maxX: number) {
    let start: { pointerX: number; layerX: number } | null = null;
    let dragging = false;
    const THRESHOLD = 8;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      start = { pointerX: p.x, layerX: layer.x };
      dragging = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!start) return;
      const dx = p.x - start.pointerX;
      if (!dragging && Math.abs(dx) >= THRESHOLD) dragging = true;
      if (dragging) {
        layer.x = Math.max(minX, Math.min(maxX, start.layerX + dx));
      }
    });
    const end = () => { start = null; };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
  }

  // Returns a Container holding the whole card (panel + sprite + texts +
  // SELECT button). Positions are local to the container so the caller
  // can place it anywhere in a scrollable layer.
  private drawCharacterCard(c: CharacterDef, localX: number, localY: number, w: number): Phaser.GameObjects.Container {
    const card = this.add.container(localX, localY);
    const h = 560;
    const leftX = -w / 2 + 24;
    // Slice 56 — character lock state. Locked pilots still render so
    // players can see what's possible, but their sprite + text dim and
    // the SELECT button swaps to a LOCKED indicator with the requirement.
    const unlocked = isCharacterUnlocked(c.id);
    const lockHint = unlocked ? null : unlockRequirementFor(c.id);

    // Panel
    const panel = this.add
      .rectangle(0, 0, w, h, COLORS.bgPanel)
      .setStrokeStyle(2, unlocked ? COLORS.brassDim : COLORS.steelDark);
    card.add(panel);

    // Sprite (scaled down so it fits in the card). Locked pilots silhouette
    // out to a uniform steelDark tint via the container's alpha; the lock
    // glyph below tells the player why they can't pick them yet.
    const drawFn = CHARACTER_SPRITES[c.id] ?? CHARACTER_SPRITES.pilot;
    const sprite = drawFn(this, 0, -180);
    sprite.setScale(0.6);
    if (!unlocked) sprite.setAlpha(0.25);
    card.add(sprite);

    // Name
    card.add(
      this.add
        .text(0, -50, c.name, {
          fontFamily: FONTS.display,
          fontSize: '22px',
          color: hex(COLORS.brass),
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
    );

    // Tagline
    card.add(
      this.add
        .text(0, -24, c.tagline, {
          fontFamily: FONTS.body,
          fontSize: '12px',
          color: hex(COLORS.steam)
        })
        .setOrigin(0.5)
    );

    // Description (top-aligned, wraps)
    card.add(
      this.add
        .text(0, -4, c.description, {
          fontFamily: FONTS.body,
          fontSize: '12px',
          color: hex(COLORS.bone),
          align: 'center',
          wordWrap: { width: w - 40 },
          lineSpacing: 3
        })
        .setOrigin(0.5, 0)
    );

    // Stats block
    card.add(
      this.add
        .text(leftX, 70, `Hull   ${c.startingHull}`, {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(COLORS.bone),
          fontStyle: 'bold'
        })
        .setOrigin(0, 0)
    );
    card.add(
      this.add
        .text(leftX, 90, `Deck   ${c.startingDeck.length} cards`, {
          fontFamily: FONTS.display,
          fontSize: '13px',
          color: hex(COLORS.bone),
          fontStyle: 'bold'
        })
        .setOrigin(0, 0)
    );

    // Signature relic block
    card.add(
      this.add
        .text(leftX, 118, 'SIGNATURE', {
          fontFamily: FONTS.display,
          fontSize: '11px',
          color: hex(COLORS.boneDim)
        })
        .setOrigin(0, 0)
    );

    if (c.startingRelics.length === 0) {
      card.add(
        this.add
          .text(leftX, 136, 'none — pure baseline', {
            fontFamily: FONTS.body,
            fontSize: '12px',
            color: hex(COLORS.boneDim),
            fontStyle: 'italic'
          })
          .setOrigin(0, 0)
      );
    } else {
      const def = RELICS[c.startingRelics[0]];
      if (def) {
        card.add(
          this.add
            .text(leftX, 136, `★ ${def.name}`, {
              fontFamily: FONTS.display,
              fontSize: '13px',
              color: hex(COLORS.steam),
              fontStyle: 'bold'
            })
            .setOrigin(0, 0)
        );
        card.add(
          this.add
            .text(leftX, 156, def.description, {
              fontFamily: FONTS.body,
              fontSize: '11px',
              color: hex(COLORS.bone),
              wordWrap: { width: w - 48 },
              lineSpacing: 3
            })
            .setOrigin(0, 0)
        );
      }
    }

    // Dim overlay for locked cards — sits ABOVE the panel/sprite/text
    // we already added, but BELOW the LOCKED button + unlock hint added
    // after it. That makes the lock UI the bright focal point against
    // a faded backdrop of "what you're missing."
    if (!unlocked) {
      const dim = this.add.rectangle(0, 0, w - 4, h - 4, 0x000000, 0.45);
      card.add(dim);
    }

    // SELECT button anchored at the bottom of the panel. Locked pilots
    // show a disabled LOCKED button with the unlock requirement above.
    if (unlocked) {
      const btn = new Button(
        this,
        0,
        h / 2 - 38,
        'SELECT',
        () => this.pick(c.id),
        { width: w - 40, height: 50, fontSize: 17 }
      );
      card.add(btn);
    } else {
      // Lock hint sits above the disabled button.
      card.add(
        this.add
          .text(0, h / 2 - 84, lockHint ?? 'Keep playing to unlock.', {
            fontFamily: FONTS.display,
            fontSize: '13px',
            color: hex(COLORS.danger),
            fontStyle: 'bold',
            align: 'center'
          })
          .setOrigin(0.5)
      );
      const btn = new Button(
        this,
        0,
        h / 2 - 38,
        'LOCKED',
        () => { /* no-op — disabled below */ },
        { width: w - 40, height: 50, fontSize: 17, fill: COLORS.steelDark, hoverFill: COLORS.steelDark }
      );
      btn.setEnabled(false);
      card.add(btn);
    }

    return card;
  }

  private pick(characterId: string) {
    clearSavedRun();
    startRun(characterId);
    this.cameras.main.fadeOut(220, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}

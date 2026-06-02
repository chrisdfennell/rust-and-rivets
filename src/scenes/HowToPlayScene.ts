import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { COLORS, FONTS, hex } from '../ui/theme';
import {
  tutorialsEnabled,
  setTutorialsEnabled,
  resetTutorials
} from '../game/tutorial';

interface Section {
  heading: string;
  body: string;
}

// Static reference copy. Plain data so the layout code stays simple — each
// section renders as a brass heading + a wrapped body paragraph.
const SECTIONS: Section[] = [
  {
    heading: 'THE GOAL',
    body:
      'Pilot a salvaged mech through the wasteland, one act at a time. Each act is a ' +
      'branching map of rooms ending in a boss. Survive the boss to advance; clear the ' +
      'final act to win the run. Your Hull (health) carries between rooms, so every fight ' +
      'and every choice compounds.'
  },
  {
    heading: 'COMBAT — STEAM & CARDS',
    body:
      'Each turn you draw a hand of cards and refill Steam (your energy). Cards cost Steam ' +
      'to play — spend it on attacks, defense, and tricks until you run dry or choose to ' +
      'end the turn. Drag an attack card onto an enemy to strike it. When you end your ' +
      'turn, the enemies act, then a new turn begins.'
  },
  {
    heading: 'HULL vs PLATING',
    body:
      'Hull is your real health — lose it all and the run ends. Plating is temporary armor ' +
      'that absorbs incoming damage and then resets at the start of your next turn. Stack ' +
      'Plating on turns you expect to be hit hard; it is the cheapest health you will ever ' +
      'get, but it does not carry over.'
  },
  {
    heading: 'READING ENEMY INTENT',
    body:
      'The icon above each enemy shows what it intends to do next turn — attack (with the ' +
      'damage number), defend, buff, or debuff. Plan your Plating and burst around it. ' +
      'Killing an enemy before it acts cancels its intent entirely.'
  },
  {
    heading: 'THE MAP',
    body:
      'Between fights you choose your path up the map. Node icons tell you what waits: ' +
      'regular combat, tougher elites (better rewards), shops, rest sites, mystery events, ' +
      'and the act boss at the top. You can only move forward along connected paths, so ' +
      'pick the route that fits your Hull and your build.'
  },
  {
    heading: 'SHOPS, REST & EVENTS',
    body:
      'Scrap is your in-run currency, earned from fights. Shops sell cards, relics, and ' +
      'potions, and offer a one-time card-removal service to tighten your deck. Rest sites ' +
      'let you heal or upgrade a card — not both. Events are story choices with rewards and ' +
      'risks; read them carefully before committing.'
  },
  {
    heading: 'RELICS & POTIONS',
    body:
      'Relics are permanent passive bonuses that last the whole run — grab every one you ' +
      'can. Potions are one-shot consumables you trigger in combat for a burst of value; ' +
      'your belt holds a limited number, so use them rather than hoarding them.'
  },
  {
    heading: 'WORKSHOP & ASCENSION',
    body:
      'Winning fights earns Workshop Points that persist between runs. Spend them in the ' +
      'Workshop on permanent upgrades that make future runs stronger. Once you clear the ' +
      'run, the Ascension ladder unlocks harder difficulty tiers for bigger bragging ' +
      'rights. New pilots unlock as you beat each act.'
  },
  {
    heading: 'SAVING',
    body:
      'Your run auto-saves between rooms — close the tab and pick up later with CONTINUE. ' +
      'You can also export your save to a file from the title screen and import it on ' +
      'another device.'
  }
];

export class HowToPlayScene extends Phaser.Scene {
  private content!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private scrollMin = 0;
  private scrollMax = 0;
  private dragStart: { pointerY: number; scrollY: number } | null = null;
  private dragging = false;
  private portrait = false;
  private viewportTop = 0;
  private viewportBottom = 0;
  private chevronUp: Phaser.GameObjects.Text | null = null;
  private chevronDown: Phaser.GameObjects.Text | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  // Where BACK returns to. Default 'Title' (opened from the title screen).
  // When opened as an overlay from the Pause menu, this is 'Pause' and BACK
  // resumes that scene instead of navigating away — so a run in progress
  // (including an unsaved mid-combat turn) is never lost.
  private returnTo = 'Title';

  constructor() {
    super('HowToPlay');
  }

  init(data: { returnTo?: string }) {
    this.returnTo = data?.returnTo ?? 'Title';
  }

  create() {
    const { width, height } = this.scale;
    this.portrait = height > width;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1612);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(COLORS.brass, 0.04);
    bg.fillCircle(width / 2, 110, Math.min(240, width * 0.4));

    this.add
      .text(width / 2, this.portrait ? 26 : 34, 'HOW TO PLAY', {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '26px' : '36px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.content = this.add.container(0, 0);
    this.buildSections();

    // Footer controls.
    this.buildFooter(width, height);

    this.drawScrollChevrons();
    this.attachScrollInput();

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

  private buildSections() {
    const { width, height: vh } = this.scale;
    this.content.removeAll(true);

    const margin = this.portrait ? 18 : Math.max(40, (width - 720) / 2);
    const innerW = width - margin * 2;
    let y = 0;
    for (const sec of SECTIONS) {
      const heading = this.add.text(margin, y, sec.heading, {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '16px' : '18px',
        color: hex(COLORS.brass),
        fontStyle: 'bold',
        wordWrap: { width: innerW }
      });
      this.content.add(heading);
      y += heading.height + 6;

      const body = this.add.text(margin, y, sec.body, {
        fontFamily: FONTS.body,
        fontSize: this.portrait ? '13px' : '14px',
        color: hex(COLORS.bone),
        wordWrap: { width: innerW },
        lineSpacing: 5
      });
      this.content.add(body);
      y += body.height + 22;
    }

    const top = this.portrait ? 60 : 72;
    const bottom = this.portrait ? vh - 132 : vh - 92;
    this.viewportTop = top;
    this.viewportBottom = bottom;
    const contentH = y;
    this.scrollMax = top;
    this.scrollMin = bottom - contentH;
    if (this.scrollMin > this.scrollMax) this.scrollMin = this.scrollMax;
    this.setScroll(top);
  }

  private buildFooter(width: number, vh: number) {
    // Tutorials on/off toggle + Replay tutorials + BACK. Stacked in portrait,
    // a single row in landscape.
    const makeToggle = (x: number, y: number, w: number) => {
      const labelFor = (on: boolean) => `TUTORIALS: ${on ? 'ON' : 'OFF'}`;
      let btn: Button;
      btn = new Button(
        this,
        x,
        y,
        labelFor(tutorialsEnabled()),
        () => {
          const next = !tutorialsEnabled();
          setTutorialsEnabled(next);
          btn.setLabel(labelFor(next));
        },
        {
          width: w,
          height: 40,
          fontSize: 12,
          fill: COLORS.brass,
          hoverFill: COLORS.steam
        }
      );
      this.add.existing(btn);
      return btn;
    };

    const makeReplay = (x: number, y: number, w: number) =>
      this.add.existing(
        new Button(
          this,
          x,
          y,
          'REPLAY TUTORIALS',
          () => {
            // Re-arm every tour and make sure the master switch is on, then
            // confirm with a toast.
            resetTutorials();
            setTutorialsEnabled(true);
            this.flashToast('Tutorials reset — they will replay as you go.');
          },
          { width: w, height: 40, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel }
        )
      );

    const makeBack = (x: number, y: number, w: number) =>
      this.add.existing(
        new Button(
          this,
          x,
          y,
          'BACK',
          () => this.goBack(),
          { width: w, height: 40, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }
        )
      );

    if (this.portrait) {
      const w = Math.min(width - 36, 320);
      const cx = width / 2;
      makeToggle(cx, vh - 116, w);
      makeReplay(cx, vh - 70, w);
      makeBack(cx, vh - 28, w);
    } else {
      const cx = width / 2;
      makeToggle(cx - 240, vh - 44, 200);
      makeReplay(cx, vh - 44, 220);
      makeBack(cx + 240, vh - 44, 200);
    }
  }

  private goBack() {
    if (this.returnTo === 'Title') {
      this.cameras.main.fadeOut(180, 20, 17, 15);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
      return;
    }
    // Overlay mode — hand control back to the scene that launched us.
    this.scene.resume(this.returnTo);
    this.scene.stop();
  }

  private flashToast(message: string) {
    const { width, height: vh } = this.scale;
    const txt = this.add
      .text(width / 2, vh / 2, message, {
        fontFamily: FONTS.display,
        fontSize: '14px',
        color: hex(COLORS.bone),
        backgroundColor: '#1f1a16',
        padding: { x: 14, y: 8 },
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: width - 60 }
      })
      .setOrigin(0.5)
      .setDepth(2000)
      .setAlpha(0);
    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 150,
      yoyo: true,
      hold: 1400,
      onComplete: () => txt.destroy()
    });
  }

  private drawScrollChevrons() {
    const { width } = this.scale;
    const cx = width / 2;
    this.chevronUp = this.add
      .text(cx, this.viewportTop + 2, '▲', {
        fontFamily: FONTS.display,
        fontSize: '18px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.chevronDown = this.add
      .text(cx, this.viewportBottom - 4, '▼', {
        fontFamily: FONTS.display,
        fontSize: '18px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({
      targets: [this.chevronUp, this.chevronDown],
      alpha: { from: 0.4, to: 1 },
      y: { from: '-=3', to: '+=3' },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
    this.refreshChevrons();
  }

  private refreshChevrons() {
    if (this.chevronUp) this.chevronUp.setVisible(this.scrollY < this.scrollMax - 1);
    if (this.chevronDown) this.chevronDown.setVisible(this.scrollY > this.scrollMin + 1);
  }

  private setScroll(y: number) {
    this.scrollY = Math.max(this.scrollMin, Math.min(this.scrollMax, y));
    this.content.y = this.scrollY;
    this.refreshChevrons();
  }

  private attachScrollInput() {
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
      this.setScroll(this.scrollY - dy);
    });
    const THRESHOLD = 8;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragStart = { pointerY: p.y, scrollY: this.scrollY };
      this.dragging = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragStart) return;
      const dy = p.y - this.dragStart.pointerY;
      if (!this.dragging && Math.abs(dy) >= THRESHOLD) this.dragging = true;
      if (this.dragging) this.setScroll(this.dragStart.scrollY + dy);
    });
    const end = () => {
      this.dragStart = null;
      this.time.delayedCall(0, () => { this.dragging = false; });
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
  }
}

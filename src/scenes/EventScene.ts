import Phaser from 'phaser';
import { getRun, completeNode, resolveEvent } from '../game/run';
import { EVENTS_BY_ID, type EventChoice, type EventDef } from '../game/events';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { COLORS, FONTS, hex } from '../ui/theme';

export class EventScene extends Phaser.Scene {
  private choicesView!: Phaser.GameObjects.Container;
  private resultView!: Phaser.GameObjects.Container;
  private portrait = false;
  private viewW = 0;
  private viewH = 0;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super('Event');
  }

  create() {
    setupPause(this);
    const { width, height } = this.scale;
    this.viewW = width;
    this.viewH = height;
    this.portrait = height > width;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — dim corridor / road feel. Disc radius scales with the
    // smaller axis so the glow doesn't dwarf a portrait canvas.
    const bg = this.add.graphics();
    bg.fillStyle(0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x1f1a16);
    bg.fillRect(0, height * 0.6, width, height * 0.4);
    bg.fillStyle(COLORS.steam, 0.04);
    bg.fillCircle(width / 2, height * 0.48, Math.min(360, width * 0.6));

    const run = getRun();
    const event = run.pendingEventId ? EVENTS_BY_ID[run.pendingEventId] : null;
    if (!event) {
      // No event staged (shouldn't happen) — bail back to map
      completeNode();
      this.scene.start('Map');
      return;
    }

    // Title
    this.add
      .text(width / 2, this.portrait ? 40 : 70, event.title, {
        fontFamily: FONTS.display,
        fontSize: this.portrait ? '22px' : '32px',
        color: hex(COLORS.steam),
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: Math.min(width - 32, 900) }
      })
      .setOrigin(0.5);

    // Body
    this.add
      .text(width / 2, this.portrait ? 80 : 130, event.body, {
        fontFamily: FONTS.body,
        fontSize: this.portrait ? '13px' : '15px',
        color: hex(COLORS.bone),
        align: 'center',
        wordWrap: { width: this.portrait ? width - 32 : 820 },
        lineSpacing: this.portrait ? 4 : 6
      })
      .setOrigin(0.5, 0);

    // Brief status strip so the player can judge cost choices
    this.add
      .text(width / 2, height - (this.portrait ? 12 : 32),
        `Hull  ${run.player.hull}/${run.player.maxHull}    Scrap  ${run.scrap}    Deck  ${run.player.deck.length}    Relics  ${run.relics.length}`,
        {
          fontFamily: FONTS.body,
          fontSize: this.portrait ? '10px' : '12px',
          color: hex(COLORS.boneDim),
          align: 'center',
          wordWrap: { width: width - 16 }
        })
      .setOrigin(0.5, 1);

    this.choicesView = this.add.container(0, 0);
    this.resultView = this.add.container(0, 0).setVisible(false);

    this.buildChoices(event);
    this.buildResult();

    // If a choice was already made (player refreshed between pick and continue),
    // jump straight to the result phase.
    if (run.pendingEventResult) this.showResult(run.pendingEventResult);

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

  private buildChoices(event: EventDef) {
    const { viewW: width, viewH: height, portrait } = this;
    const n = event.choices.length;

    if (portrait) {
      // Stack vertically with detail below each button.
      const btnW = Math.min(width - 32, 320);
      const btnH = 54;
      const detailH = 36;
      const rowH = btnH + 8 + detailH + 16;
      const statusH = 24;
      // Center the stack between body and the status strip.
      const available = height - 180 - statusH;
      const totalH = rowH * n - 16;
      const top = 180 + Math.max(0, (available - totalH) / 2) + btnH / 2;
      event.choices.forEach((choice, i) => {
        const run = getRun();
        const enabled = choice.enabled ? choice.enabled(run) : true;
        const cy = top + i * rowH;
        const btn = new Button(
          this,
          width / 2,
          cy,
          choice.label,
          () => this.pick(choice),
          { width: btnW, height: btnH, fontSize: 15, fill: COLORS.rust, hoverFill: COLORS.danger }
        );
        btn.setEnabled(enabled);
        this.choicesView.add(btn);
        const desc = this.add
          .text(width / 2, cy + btnH / 2 + 6, choice.description, {
            fontFamily: FONTS.body,
            fontSize: '11px',
            color: hex(enabled ? COLORS.bone : COLORS.boneDim),
            align: 'center',
            wordWrap: { width: btnW - 8 },
            lineSpacing: 2
          })
          .setOrigin(0.5, 0);
        this.choicesView.add(desc);
      });
    } else {
      const spacing = 320;
      const startX = width / 2 - (spacing * (n - 1)) / 2;
      const cy = 430;
      event.choices.forEach((choice, i) => {
        const cx = startX + i * spacing;
        const run = getRun();
        const enabled = choice.enabled ? choice.enabled(run) : true;
        const btn = new Button(
          this,
          cx,
          cy,
          choice.label,
          () => this.pick(choice),
          { width: 280, height: 70, fontSize: 17, fill: COLORS.rust, hoverFill: COLORS.danger }
        );
        btn.setEnabled(enabled);
        this.choicesView.add(btn);
        const desc = this.add
          .text(cx, cy + 58, choice.description, {
            fontFamily: FONTS.body,
            fontSize: '12px',
            color: hex(enabled ? COLORS.bone : COLORS.boneDim),
            align: 'center',
            wordWrap: { width: 260 },
            lineSpacing: 3
          })
          .setOrigin(0.5, 0);
        this.choicesView.add(desc);
      });
    }
  }

  private buildResult() {
    const { viewW: width, viewH: height, portrait } = this;
    const messageText = this.add
      .text(width / 2, portrait ? 200 : 410, '', {
        fontFamily: FONTS.display,
        fontSize: portrait ? '15px' : '20px',
        color: hex(COLORS.bone),
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: portrait ? width - 32 : 800 },
        lineSpacing: portrait ? 4 : 6
      })
      .setOrigin(0.5, 0)
      .setName('resultMessage');
    this.resultView.add(messageText);

    const continueBtn = new Button(
      this,
      width / 2,
      height - (portrait ? 60 : 110),
      'CONTINUE',
      () => this.exit(),
      {
        width: portrait ? Math.min(width - 60, 240) : 240,
        height: portrait ? 52 : 56,
        fontSize: portrait ? 15 : 17,
        fill: COLORS.shield,
        hoverFill: 0x6f9dbf
      }
    );
    this.resultView.add(continueBtn);
  }

  private pick(choice: EventChoice) {
    const run = getRun();
    if (choice.enabled && !choice.enabled(run)) return;
    const message = choice.resolve(run, Math.random);
    resolveEvent(message);
    this.showResult(message);
  }

  private showResult(message: string) {
    this.choicesView.setVisible(false);
    this.resultView.setVisible(true);
    const msg = this.resultView.getByName('resultMessage') as Phaser.GameObjects.Text | null;
    if (msg) msg.setText(message);
  }

  private exit() {
    completeNode();
    this.cameras.main.fadeOut(180, 20, 17, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}

import Phaser from 'phaser';
import { getRun, completeNode, resolveEvent } from '../game/run';
import { EVENTS_BY_ID, type EventChoice, type EventDef } from '../game/events';
import { Button } from '../ui/Button';
import { setupPause } from '../ui/setupPause';
import { COLORS, FONTS, hex } from '../ui/theme';

export class EventScene extends Phaser.Scene {
  private choicesView!: Phaser.GameObjects.Container;
  private resultView!: Phaser.GameObjects.Container;

  constructor() {
    super('Event');
  }

  create() {
    setupPause(this);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Backdrop — dim corridor / road feel
    const bg = this.add.graphics();
    bg.fillStyle(0x14110f);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x1f1a16);
    bg.fillRect(0, height * 0.6, width, height * 0.4);
    bg.fillStyle(COLORS.steam, 0.04);
    bg.fillCircle(width / 2, height * 0.48, 360);

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
      .text(width / 2, 70, event.title, {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color: hex(COLORS.steam),
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Body
    this.add
      .text(width / 2, 130, event.body, {
        fontFamily: FONTS.body,
        fontSize: '15px',
        color: hex(COLORS.bone),
        align: 'center',
        wordWrap: { width: 820 },
        lineSpacing: 6
      })
      .setOrigin(0.5, 0);

    // Brief status strip so the player can judge cost choices
    this.add
      .text(width / 2, height - 32,
        `Hull  ${run.player.hull}/${run.player.maxHull}    Scrap  ${run.scrap}    Deck  ${run.player.deck.length}    Relics  ${run.relics.length}`,
        {
          fontFamily: FONTS.body,
          fontSize: '12px',
          color: hex(COLORS.boneDim)
        })
      .setOrigin(0.5, 1);

    this.choicesView = this.add.container(0, 0);
    this.resultView = this.add.container(0, 0).setVisible(false);

    this.buildChoices(event);
    this.buildResult();

    // If a choice was already made (player refreshed between pick and continue),
    // jump straight to the result phase.
    if (run.pendingEventResult) this.showResult(run.pendingEventResult);
  }

  private buildChoices(event: EventDef) {
    const { width } = this.scale;
    const n = event.choices.length;
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
      this.add.existing(btn);

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

  private buildResult() {
    const { width, height } = this.scale;
    const messageText = this.add
      .text(width / 2, 410, '', {
        fontFamily: FONTS.display,
        fontSize: '20px',
        color: hex(COLORS.bone),
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 800 },
        lineSpacing: 6
      })
      .setOrigin(0.5, 0)
      .setName('resultMessage');
    this.resultView.add(messageText);

    const continueBtn = new Button(
      this,
      width / 2,
      height - 110,
      'CONTINUE',
      () => this.exit(),
      { width: 240, height: 56, fontSize: 17, fill: COLORS.shield, hoverFill: 0x6f9dbf }
    );
    this.resultView.add(continueBtn);
    this.add.existing(continueBtn);
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

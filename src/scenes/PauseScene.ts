import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { COLORS, FONTS, hex } from '../ui/theme';

export class PauseScene extends Phaser.Scene {
  private fromScene = 'Map';

  constructor() {
    super('Pause');
  }

  init(data: { fromScene?: string }) {
    this.fromScene = data?.fromScene ?? 'Map';
  }

  create() {
    const { width, height } = this.scale;

    // Dim overlay — the paused scene is still drawn underneath
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72).setDepth(0);

    this.add
      .text(width / 2, height / 2 - 130, 'PAUSED', {
        fontFamily: FONTS.display,
        fontSize: '56px',
        color: hex(COLORS.brass),
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.add
      .text(width / 2, height / 2 - 80, 'Your run auto-saves between rooms.', {
        fontFamily: FONTS.body,
        fontSize: '13px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5)
      .setDepth(1);

    const resume = new Button(
      this,
      width / 2,
      height / 2 - 10,
      'RESUME',
      () => this.doResume(),
      { width: 280, height: 56, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf }
    );
    this.add.existing(resume);
    resume.setDepth(1);

    const quit = new Button(
      this,
      width / 2,
      height / 2 + 60,
      'QUIT TO TITLE',
      () => this.doQuit(),
      { width: 280, height: 56, fontSize: 18, fill: COLORS.rust, hoverFill: COLORS.danger }
    );
    this.add.existing(quit);
    quit.setDepth(1);

    this.add
      .text(width / 2, height / 2 + 120, 'ESC to resume', {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5)
      .setDepth(1);

    // ESC also closes the pause menu
    this.input.keyboard?.on('keydown-ESC', () => this.doResume());
  }

  private doResume() {
    this.scene.resume(this.fromScene);
    this.scene.stop();
  }

  private doQuit() {
    // Stop the paused scene first so its shutdown runs, then transition.
    this.scene.stop(this.fromScene);
    this.scene.start('Title');
  }
}

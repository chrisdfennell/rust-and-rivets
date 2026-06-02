import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { setMusicMuted, isMusicMuted } from '../audio/music';
import { setSfxMuted, isSfxMuted } from '../audio/sfx';
import { tutorialsEnabled, setTutorialsEnabled } from '../game/tutorial';
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
      height / 2 - 30,
      'RESUME',
      () => this.doResume(),
      { width: 280, height: 52, fontSize: 18, fill: COLORS.shield, hoverFill: 0x6f9dbf }
    );
    this.add.existing(resume);
    resume.setDepth(1);

    const howTo = new Button(
      this,
      width / 2,
      height / 2 + 28,
      'HOW TO PLAY',
      () => this.openHowToPlay(),
      { width: 280, height: 46, fontSize: 15, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(howTo);
    howTo.setDepth(1);

    const quit = new Button(
      this,
      width / 2,
      height / 2 + 84,
      'QUIT TO TITLE',
      () => this.doQuit(),
      { width: 280, height: 52, fontSize: 18, fill: COLORS.rust, hoverFill: COLORS.danger }
    );
    this.add.existing(quit);
    quit.setDepth(1);

    // Audio toggles
    this.makeMuteToggle(width / 2 - 110, height / 2 + 146, 'MUSIC', isMusicMuted, (m) => setMusicMuted(m));
    this.makeMuteToggle(width / 2 + 110, height / 2 + 146, 'SFX', isSfxMuted, (m) => setSfxMuted(m));

    // Tutorials on/off — mirrors the toggle in HowToPlay so it's reachable
    // mid-run without leaving the pause menu.
    this.makeTutorialToggle(width / 2, height / 2 + 192);

    this.add
      .text(width / 2, height / 2 + 230, 'ESC to resume', {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.boneDim)
      })
      .setOrigin(0.5)
      .setDepth(1);

    // ESC also closes the pause menu
    this.input.keyboard?.on('keydown-ESC', () => this.doResume());
  }

  private makeMuteToggle(
    x: number,
    y: number,
    name: string,
    getter: () => boolean,
    setter: (m: boolean) => void
  ): Button {
    const labelFor = (m: boolean) => (m ? `UNMUTE ${name}` : `MUTE ${name}`);
    let btn: Button;
    btn = new Button(
      this,
      x,
      y,
      labelFor(getter()),
      () => {
        const next = !getter();
        setter(next);
        btn.setLabel(labelFor(next));
      },
      { width: 190, height: 36, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.add.existing(btn);
    btn.setDepth(1);
    return btn;
  }

  private makeTutorialToggle(x: number, y: number): Button {
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
      { width: 240, height: 36, fontSize: 12, fill: COLORS.brass, hoverFill: COLORS.steam }
    );
    this.add.existing(btn);
    btn.setDepth(1);
    return btn;
  }

  // Open the reference as an overlay so the paused run (and any unsaved
  // mid-combat turn underneath) survives. Pausing this scene stops its
  // buttons from receiving input while HowToPlay is on top; HowToPlay's
  // BACK resumes us.
  private openHowToPlay() {
    this.scene.pause();
    this.scene.launch('HowToPlay', { returnTo: 'Pause' });
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

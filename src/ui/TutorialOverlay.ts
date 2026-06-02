import Phaser from 'phaser';
import { Button } from './Button';
import { COLORS, FONTS, hex } from './theme';
import { tutorialsEnabled, hasSeenTutorial, markTutorialSeen } from '../game/tutorial';

export interface TutorialStep {
  // Optional heading shown bold above the body text.
  title?: string;
  // The explanatory copy for this step.
  text: string;
  // Returns the screen-space region to spotlight, recomputed each render so
  // it survives resizes. Return null (or omit `target`) for a centered modal
  // step that explains a concept rather than pointing at an element.
  target?: () => Phaser.Geom.Rectangle | null;
}

const OVERLAY_DEPTH = 5000;
const DIM_ALPHA = 0.74;
const SPOTLIGHT_PAD = 8;

// Runs a one-time guided tour over the calling scene. No-ops immediately if
// tutorials are disabled or this tour's id has already been seen, so callers
// can invoke it unconditionally at the end of create().
//
// The overlay lives inside the calling scene at a high depth: a full-screen
// transparent blocker eats all pointer input, four dim rectangles darken
// everything except the spotlight region, a pulsing border frames the
// highlighted element, and a bubble carries the copy plus Back / Next / Skip.
export function runTutorial(scene: Phaser.Scene, id: string, steps: TutorialStep[]): void {
  if (steps.length === 0) return;
  if (!tutorialsEnabled() || hasSeenTutorial(id)) return;
  new TutorialRunner(scene, id, steps);
}

class TutorialRunner {
  private readonly scene: Phaser.Scene;
  private readonly id: string;
  private readonly steps: TutorialStep[];
  private readonly layer: Phaser.GameObjects.Container;
  private step = 0;
  private pulse: Phaser.Tweens.Tween | null = null;
  private done = false;

  constructor(scene: Phaser.Scene, id: string, steps: TutorialStep[]) {
    this.scene = scene;
    this.id = id;
    this.steps = steps;
    this.layer = scene.add.container(0, 0).setDepth(OVERLAY_DEPTH);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    scene.scale.on('resize', this.onResize, this);

    this.render();
  }

  private onResize = () => {
    if (this.done) return;
    // Re-render the current step against the new viewport. target() recomputes
    // its rect, so spotlight + bubble snap to the right place.
    this.render();
  };

  private render() {
    this.layer.removeAll(true);
    if (this.pulse) {
      this.pulse.remove();
      this.pulse = null;
    }

    // Work in the camera's visible WORLD rect, not raw canvas pixels. Scenes
    // that use applyDesignFit() run their camera zoomed + recentered on the
    // 1280×720 design world, so element getBounds() (and our overlay) live in
    // those world coords — deriving the extent from the camera keeps the dim
    // and spotlight aligned in both responsive and design-fit scenes.
    const cam = this.scene.cameras.main;
    const ox = cam.scrollX;
    const oy = cam.scrollY;
    const W = cam.width / cam.zoom;
    const H = cam.height / cam.zoom;
    const right = ox + W;
    const bottom = oy + H;

    const stepDef = this.steps[this.step];
    const target = stepDef.target?.() ?? null;

    // Full-screen input blocker (invisible) — eats every pointer event so the
    // underlying scene can't be touched mid-tour. Buttons added later sit on
    // top and capture their own hit areas.
    const blocker = this.scene.add
      .rectangle(ox, oy, W, H, 0x000000, 0.001)
      .setOrigin(0, 0)
      .setInteractive();
    this.layer.add(blocker);

    if (target) {
      const sx = Math.max(ox, target.x - SPOTLIGHT_PAD);
      const sy = Math.max(oy, target.y - SPOTLIGHT_PAD);
      const sw = Math.min(right - sx, target.width + SPOTLIGHT_PAD * 2);
      const sh = Math.min(bottom - sy, target.height + SPOTLIGHT_PAD * 2);
      this.addDim(ox, oy, W, sy - oy); // top
      this.addDim(ox, sy + sh, W, bottom - (sy + sh)); // bottom
      this.addDim(ox, sy, sx - ox, sh); // left
      this.addDim(sx + sw, sy, right - (sx + sw), sh); // right

      const border = this.scene.add
        .rectangle(sx, sy, sw, sh)
        .setOrigin(0, 0)
        .setStrokeStyle(3, COLORS.brass);
      this.layer.add(border);
      this.pulse = this.scene.tweens.add({
        targets: border,
        alpha: { from: 1, to: 0.35 },
        duration: 700,
        yoyo: true,
        repeat: -1
      });
      this.addBubble(stepDef, new Phaser.Geom.Rectangle(sx, sy, sw, sh), ox, oy, W, H);
    } else {
      this.addDim(ox, oy, W, H);
      this.addBubble(stepDef, null, ox, oy, W, H);
    }
  }

  private addDim(x: number, y: number, w: number, h: number) {
    if (w <= 0 || h <= 0) return;
    const r = this.scene.add
      .rectangle(x, y, w, h, 0x000000, DIM_ALPHA)
      .setOrigin(0, 0);
    this.layer.add(r);
  }

  private addBubble(
    stepDef: TutorialStep,
    spotlight: Phaser.Geom.Rectangle | null,
    ox: number,
    oy: number,
    W: number,
    H: number
  ) {
    const margin = 16;
    const bubbleW = Math.min(380, W - margin * 2);
    const padX = 16;
    const padY = 14;
    const last = this.step === this.steps.length - 1;

    // Build the text objects first so we can size the panel to fit them.
    const innerW = bubbleW - padX * 2;
    let cursorY = padY;
    const texts: Phaser.GameObjects.Text[] = [];

    const counter = this.scene.add.text(padX, cursorY, `${this.step + 1} / ${this.steps.length}`, {
      fontFamily: FONTS.body,
      fontSize: '11px',
      color: hex(COLORS.boneDim)
    });
    texts.push(counter);
    cursorY += 18;

    if (stepDef.title) {
      const title = this.scene.add.text(padX, cursorY, stepDef.title, {
        fontFamily: FONTS.display,
        fontSize: '17px',
        color: hex(COLORS.brass),
        fontStyle: 'bold',
        wordWrap: { width: innerW }
      });
      texts.push(title);
      cursorY += title.height + 8;
    }

    const body = this.scene.add.text(padX, cursorY, stepDef.text, {
      fontFamily: FONTS.body,
      fontSize: '13px',
      color: hex(COLORS.bone),
      wordWrap: { width: innerW },
      lineSpacing: 4
    });
    texts.push(body);
    cursorY += body.height + 16;

    const buttonRowY = cursorY;
    const bubbleH = buttonRowY + 40 + padY;

    // Position the bubble: below the spotlight if it fits, else above, else
    // vertically centered. Horizontally centered on the spotlight, clamped
    // to the viewport. Centered both ways when there's no spotlight.
    let bx: number;
    let by: number;
    if (spotlight) {
      bx = Phaser.Math.Clamp(
        spotlight.centerX - bubbleW / 2,
        ox + margin,
        ox + W - bubbleW - margin
      );
      if (spotlight.bottom + 12 + bubbleH <= oy + H - margin) {
        by = spotlight.bottom + 12;
      } else if (spotlight.y - 12 - bubbleH >= oy + margin) {
        by = spotlight.y - 12 - bubbleH;
      } else {
        by = Phaser.Math.Clamp(oy + (H - bubbleH) / 2, oy + margin, oy + H - bubbleH - margin);
      }
    } else {
      bx = ox + (W - bubbleW) / 2;
      by = oy + (H - bubbleH) / 2;
    }

    const panel = this.scene.add
      .rectangle(bx, by, bubbleW, bubbleH, COLORS.bgPanel, 0.98)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLORS.brass)
      .setInteractive(); // eat taps so they don't fall through to the blocker
    this.layer.add(panel);

    // Re-parent the pre-built texts relative to the panel origin.
    for (const t of texts) {
      t.setPosition(bx + t.x, by + t.y);
      this.layer.add(t);
    }

    // Buttons row, right-aligned: [Skip]   [Back] [Next/Done]
    const btnH = 34;
    const btnY = by + buttonRowY + btnH / 2;
    const nextW = 96;
    const backW = 76;
    const gap = 8;
    const nextX = bx + bubbleW - padX - nextW / 2;
    const next = new Button(
      this.scene,
      nextX,
      btnY,
      last ? 'DONE' : 'NEXT ›',
      () => this.advance(1),
      { width: nextW, height: btnH, fontSize: 13, fill: COLORS.shield, hoverFill: 0x6f9dbf }
    );
    this.layer.add(next);

    if (this.step > 0) {
      const backX = nextX - nextW / 2 - gap - backW / 2;
      const back = new Button(
        this.scene,
        backX,
        btnY,
        '‹ BACK',
        () => this.advance(-1),
        { width: backW, height: btnH, fontSize: 13, fill: COLORS.steelDark, hoverFill: COLORS.steel }
      );
      this.layer.add(back);
    }

    const skip = new Button(
      this.scene,
      bx + padX + 42,
      btnY,
      'SKIP',
      () => this.finish(),
      { width: 84, height: btnH, fontSize: 12, fill: COLORS.steelDark, hoverFill: COLORS.steel }
    );
    this.layer.add(skip);
  }

  private advance(delta: number) {
    const next = this.step + delta;
    if (next < 0) return;
    if (next >= this.steps.length) {
      this.finish();
      return;
    }
    this.step = next;
    this.render();
  }

  private finish() {
    if (this.done) return;
    markTutorialSeen(this.id);
    this.cleanup();
  }

  private cleanup() {
    if (this.done) return;
    this.done = true;
    if (this.pulse) {
      this.pulse.remove();
      this.pulse = null;
    }
    this.scene.scale.off('resize', this.onResize, this);
    this.layer.destroy();
  }
}

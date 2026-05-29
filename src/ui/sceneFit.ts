import Phaser from 'phaser';

// Slice 59 — design-size camera fit for scenes that haven't been
// refactored for responsive layouts yet.
//
// The game runs in Phaser.Scale.RESIZE mode so responsive scenes
// (CombatScene, TitleScene, CharSelect) can read `this.scale.width /
// height` and lay out portrait vs landscape based on the actual
// viewport. Other scenes still position their UI against the original
// 1280×720 design — they need a way to render that fixed area into
// whatever viewport the user has without the layout falling apart.
//
// `applyDesignFit(scene)` accomplishes this by ONLY adjusting the
// camera's zoom + center. No `setViewport` — that was the bug in the
// previous attempt. The camera continues to render to the full canvas;
// the zoom factor scales the design world uniformly to fit, and
// `centerOn(640, 360)` puts the design world's center at the canvas's
// center, which automatically gives equal letterbox bars on whichever
// axis has extra room.
//
// Math sketch (for canvas W × H, design 1280 × 720, zoom z):
//   zoom z = min(W / 1280, H / 720)            // fits without crop
//   centerOn(640, 360) → world (640, 360) lands at canvas center
//   ∴ world (0, 0) lands at (W/2 - 640z, H/2 - 360z) — the
//     letterboxed area's top-left, which is what we want

export const DESIGN_W = 1280;
export const DESIGN_H = 720;

/**
 * Fits the (0, 0)-(DESIGN_W, DESIGN_H) world area centered in the
 * actual canvas via camera zoom + center. Idempotent — call from
 * create() and also from a resize handler.
 */
export function applyDesignFit(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const zoom = Math.min(width / DESIGN_W, height / DESIGN_H);
  const cam = scene.cameras.main;
  cam.setZoom(zoom);
  cam.centerOn(DESIGN_W / 2, DESIGN_H / 2);
}

/**
 * Wires `applyDesignFit` to the scene's resize event with shutdown
 * cleanup. Call once in create() alongside the initial applyDesignFit
 * call.
 */
export function bindDesignFitResize(scene: Phaser.Scene): void {
  const fit = () => applyDesignFit(scene);
  scene.scale.on('resize', fit);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off('resize', fit);
  });
}

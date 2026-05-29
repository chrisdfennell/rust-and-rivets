import Phaser from 'phaser';

// Slice 58 — design-size camera fit for scenes that aren't responsive.
//
// Phaser is running in RESIZE scale mode (see main.ts), which hands each
// scene the actual viewport via this.scale.width / height. Scenes that
// were built against the original 1280×720 design assume those exact
// dimensions for every position calc; running them at a different
// viewport crowds / clips their UI (see the combat fight screens).
//
// The fix here:
//   1. Tell each non-responsive scene to use DESIGN_W × DESIGN_H for
//      ALL positioning (read these constants instead of this.scale.*).
//   2. Call `applyDesignFit(scene)` in create() and on every resize.
//      It zooms the camera and positions its viewport so the design
//      area lands centered on the actual viewport with letterboxing.
//
// This mimics what Phaser.Scale.FIT did when the game was at a fixed
// canvas, but PER SCENE, so the responsive scenes (Title, CharSelect)
// keep using the real viewport for their adaptive layouts.

export const DESIGN_W = 1280;
export const DESIGN_H = 720;

/**
 * Configures the scene's main camera so its (0, 0)-(DESIGN_W, DESIGN_H)
 * world area renders centered in the actual viewport, scaled uniformly
 * to fit with letterbox bars on whichever axis has extra room.
 *
 * Idempotent — safe to call repeatedly (e.g. from a resize handler).
 */
export function applyDesignFit(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const zoom = Math.min(width / DESIGN_W, height / DESIGN_H);
  const renderedW = DESIGN_W * zoom;
  const renderedH = DESIGN_H * zoom;
  const offsetX = (width - renderedW) / 2;
  const offsetY = (height - renderedH) / 2;
  const cam = scene.cameras.main;
  cam.setViewport(offsetX, offsetY, renderedW, renderedH);
  cam.setZoom(zoom);
  // Scroll is in design-space units. Setting both to 0 means design
  // (0, 0) lands at the top-left of the rendered viewport.
  cam.setScroll(0, 0);
}

/**
 * Convenience: wires `applyDesignFit` to fire on the scene's `resize`
 * event and clean up on shutdown. Call once in a scene's create().
 */
export function bindDesignFitResize(scene: Phaser.Scene): void {
  const fit = () => applyDesignFit(scene);
  scene.scale.on('resize', fit);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off('resize', fit);
  });
}

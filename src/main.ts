import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { MapScene } from './scenes/MapScene';
import { CombatScene } from './scenes/CombatScene';
import { RewardScene } from './scenes/RewardScene';
import { ShopScene } from './scenes/ShopScene';
import { RestScene } from './scenes/RestScene';
import { InterActScene } from './scenes/InterActScene';
import { WorkshopScene } from './scenes/WorkshopScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { PauseScene } from './scenes/PauseScene';
import { EventScene } from './scenes/EventScene';
import { RunSummaryScene } from './scenes/RunSummaryScene';
import { LibraryScene } from './scenes/LibraryScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';

// Slice 59 — Phaser.Scale.RESIZE hands the actual viewport dimensions
// to each scene. Responsive scenes (CombatScene, TitleScene, CharSelect)
// use those dims directly to lay out portrait vs landscape. Scenes that
// haven't been refactored yet keep using the 1280×720 design coords and
// call `applyDesignFit()` from src/ui/sceneFit.ts, which sets the camera
// zoom + center so their world (0,0)-(1280,720) area appears letterboxed
// in the actual viewport. As more scenes get portrait layouts they drop
// the `applyDesignFit` call and switch to viewport-relative positioning.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#14110f',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: 1280,
    height: 720
  },
  // Input: enable multi-touch (Phaser default is 2 active pointers; bump
  // so multi-finger gestures and accidental palm contact don't drop the
  // primary pointer mid-drag).
  input: { activePointers: 4 },
  // DOM container overlays the canvas so scenes can mount real HTML inputs
  // (the seed/run-code modal). A native <input> brings up the mobile soft
  // keyboard, which an on-canvas text field can't.
  dom: { createContainer: true },
  scene: [TitleScene, MapScene, CombatScene, RewardScene, ShopScene, RestScene, InterActScene, WorkshopScene, CharacterSelectScene, PauseScene, EventScene, RunSummaryScene, LibraryScene, HowToPlayScene],
  render: { pixelArt: false, antialias: true }
};

const game = new Phaser.Game(config);

// Slice 57 — explicit refresh on browser-level layout events. Phaser's
// FIT mode already listens for `window.resize`, but iOS Safari fires
// `orientationchange` BEFORE the new viewport dimensions are available
// and some desktop browsers fire `resize` without giving the layout
// engine time to settle. The delayed refreshes catch both cases. Also
// runs on `visibilitychange` so a tab unpaused after the window was
// resized in the background lands at the right size.
const refreshScale = () => game.scale.refresh();
window.addEventListener('orientationchange', () => setTimeout(refreshScale, 200));
window.addEventListener('resize', () => setTimeout(refreshScale, 50));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshScale();
});

// Slice 57 — register the service worker so the game can be installed
// as a PWA (Add to Home Screen on iOS, install prompt on Chrome/Edge).
// The SW also caches the app shell so repeat visits load instantly and
// work offline. Skipped in dev — Vite handles assets directly there.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      // Non-fatal — the game runs without the SW. Log it so future
      // mobile-install debugging has a breadcrumb in the console.
      // eslint-disable-next-line no-console
      console.warn('Service worker registration failed:', err);
    });
  });
}

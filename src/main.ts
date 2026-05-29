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

// Slice 57 — Phaser's FIT mode auto-scales the canvas to whatever the
// `#game` div is sized to. Every scene continues to use the 1280×720
// design coords; the canvas itself stretches / shrinks via CSS so the
// game fills the available viewport on phones, tablets, and 4K monitors
// alike. `expandParent: false` lets our CSS rules in index.html drive
// the parent div size (100vw × 100vh), so flipping a phone from portrait
// to landscape just rescales the canvas — no scene reload required.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#14110f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
    expandParent: false,
    min: { width: 320, height: 240 },
    max: { width: 3840, height: 2160 }
  },
  // Input: enable multi-touch (Phaser default is 2 active pointers; bump
  // so multi-finger gestures and accidental palm contact don't drop the
  // primary pointer mid-drag).
  input: { activePointers: 4 },
  scene: [TitleScene, MapScene, CombatScene, RewardScene, ShopScene, RestScene, InterActScene, WorkshopScene, CharacterSelectScene, PauseScene, EventScene, RunSummaryScene, LibraryScene],
  render: { pixelArt: false, antialias: true }
};

const game = new Phaser.Game(config);

// Slice 57 — explicit window-resize handler. Phaser's FIT mode listens
// for the window resize event by default, but on iOS Safari rotations
// fire `orientationchange` BEFORE the new viewport dimensions are
// available. The delayed nudge below catches the post-rotation layout.
window.addEventListener('orientationchange', () => {
  setTimeout(() => game.scale.refresh(), 200);
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

import Phaser from 'phaser';

/**
 * Wires ESC on the calling scene to open the PauseScene as a transparent
 * overlay. The calling scene is paused while Pause is on top; Pause handles
 * resuming or quitting back to the title.
 */
export function setupPause(scene: Phaser.Scene): void {
  if (!scene.input.keyboard) return;
  scene.input.keyboard.removeAllListeners('keydown-ESC');
  scene.input.keyboard.on('keydown-ESC', () => {
    // Don't double-open if Pause is already up
    if (scene.scene.isPaused()) return;
    scene.scene.pause();
    scene.scene.launch('Pause', { fromScene: scene.scene.key });
  });
}

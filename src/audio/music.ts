import Phaser from 'phaser';
import ambientUrl from '../../assets/industrial_ambiance.mp3';
import { getAudioSettings, setMusicMutedPref } from './settings';

export const AMBIENT_KEY = 'industrialAmbiance';
const DEFAULT_VOLUME = 0.32;

let started = false;
let activeSound: Phaser.Sound.BaseSound | null = null;

/**
 * Queues the ambient loop into Phaser's loader. Safe to call from any scene's
 * preload(); subsequent calls are no-ops once it's in the audio cache.
 */
export function preloadMusic(scene: Phaser.Scene): void {
  if (scene.cache.audio.exists(AMBIENT_KEY)) return;
  scene.load.audio(AMBIENT_KEY, ambientUrl);
}

/**
 * Starts the ambient loop the first time it's called, then is a no-op for the
 * rest of the page session. The loop survives scene transitions because the
 * Phaser SoundManager is global, not per-scene.
 *
 * Browsers block audio until the user gestures; Phaser queues the play call
 * and unlocks it on the first input event, so the music kicks in once the
 * player clicks anything on the title screen.
 */
export function startMusic(scene: Phaser.Scene): void {
  if (started) return;
  if (!scene.cache.audio.exists(AMBIENT_KEY)) return;
  const prefs = getAudioSettings();
  const startingVolume = prefs.musicMuted ? 0 : DEFAULT_VOLUME;
  activeSound = scene.sound.add(AMBIENT_KEY, { loop: true, volume: startingVolume });
  activeSound.play();
  started = true;
}

export function setMusicVolume(volume: number): void {
  if (!activeSound) return;
  const clamped = Math.max(0, Math.min(1, volume));
  (activeSound as Phaser.Sound.BaseSound & { volume: number }).volume = clamped;
}

export function setMusicMuted(muted: boolean): void {
  setMusicMutedPref(muted);
  if (!activeSound) return;
  (activeSound as Phaser.Sound.BaseSound & { volume: number }).volume = muted ? 0 : DEFAULT_VOLUME;
}

export function isMusicMuted(): boolean {
  return getAudioSettings().musicMuted;
}

import Phaser from 'phaser';
import { COLORS } from './theme';

export function drawMech(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-50, 60, 30, 70);
  g.fillRect(20, 60, 30, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(-55, 120, 40, 18);
  g.fillRect(15, 120, 40, 18);

  // Hip
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-40, 50, 80, 18);

  // Torso
  g.fillStyle(COLORS.rust);
  g.fillRect(-60, -30, 120, 90);
  g.fillStyle(COLORS.steel);
  g.fillRect(-50, -20, 100, 30);

  // Cockpit
  g.fillStyle(COLORS.brass);
  g.fillCircle(0, -50, 22);
  g.fillStyle(COLORS.steam);
  g.fillCircle(0, -50, 12);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-12, -52, 24, 4);

  // Smokestacks
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-60, -80, 12, 30);
  g.fillRect(48, -80, 12, 30);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-62, -84, 16, 6);
  g.fillRect(46, -84, 16, 6);

  // Arms with auto-cannon
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-92, -20, 22, 70);
  g.fillRect(70, -20, 22, 70);
  g.fillStyle(COLORS.brass);
  g.fillRect(-95, 50, 30, 14);
  g.fillStyle(COLORS.steel);
  g.fillRect(72, 18, 60, 16);
  g.fillStyle(COLORS.rust);
  g.fillRect(128, 22, 14, 8);

  // Rivets
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-50, -22], [40, -22], [-50, 50], [40, 50], [-5, 55]
  ]) g.fillCircle(rx, ry, 2.5);

  c.add(g);
  return c;
}

export type EnemyDraw = (scene: Phaser.Scene, x: number, y: number) => Phaser.GameObjects.Container;

export function drawRaider(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-30, 50, 18, 60);
  g.fillRect(12, 50, 18, 60);
  g.fillStyle(COLORS.steel);
  g.fillRect(-34, 100, 24, 14);
  g.fillRect(10, 100, 24, 14);

  // Body — junky, asymmetric
  g.fillStyle(COLORS.rust);
  g.fillRect(-40, -20, 80, 70);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-32, -10, 30, 22);
  g.fillRect(8, 8, 26, 18);

  // Head — angled, menacing
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-22, -50, 22, -50, 0, -10);
  g.fillStyle(COLORS.danger);
  g.fillCircle(-8, -32, 4);
  g.fillCircle(8, -32, 4);

  // Cleaver arm
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-65, -18, 18, 60);
  g.fillStyle(COLORS.bone);
  g.fillTriangle(-80, 30, -45, 30, -60, 70);
  g.fillStyle(COLORS.boneDim);
  g.fillTriangle(-78, 32, -47, 32, -62, 62);

  // Spikes on shoulder
  g.fillStyle(COLORS.brassDim);
  for (let i = 0; i < 4; i++) {
    const sx = 30 - i * 14;
    g.fillTriangle(sx - 4, -22, sx + 4, -22, sx, -34);
  }

  // Exhaust
  g.fillStyle(COLORS.steelDark);
  g.fillRect(34, -30, 8, 18);

  c.add(g);
  return c;
}

export function drawJunkHound(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Four legs — front and back pairs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-55, 30, 12, 50);
  g.fillRect(-30, 30, 12, 50);
  g.fillRect(20, 30, 12, 50);
  g.fillRect(45, 30, 12, 50);
  g.fillStyle(COLORS.steel);
  g.fillRect(-58, 76, 18, 8);
  g.fillRect(-33, 76, 18, 8);
  g.fillRect(17, 76, 18, 8);
  g.fillRect(42, 76, 18, 8);

  // Body — long lean rust slab
  g.fillStyle(COLORS.rust);
  g.fillRect(-60, -10, 110, 50);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-50, 0, 30, 12);
  g.fillRect(10, 4, 32, 14);

  // Spine spikes
  g.fillStyle(COLORS.brassDim);
  for (let i = 0; i < 5; i++) {
    const sx = -40 + i * 22;
    g.fillTriangle(sx - 5, -10, sx + 5, -10, sx, -24);
  }

  // Head — angular forward, snapping
  g.fillStyle(COLORS.steel);
  g.fillRect(-92, -8, 36, 30);
  g.fillTriangle(-100, 4, -92, -8, -92, 22);

  // Jaw / fangs
  g.fillStyle(COLORS.bone);
  g.fillTriangle(-92, 22, -86, 22, -89, 30);
  g.fillTriangle(-82, 22, -76, 22, -79, 30);
  g.fillTriangle(-72, 22, -66, 22, -69, 30);

  // Eyes — glowing red
  g.fillStyle(COLORS.danger);
  g.fillCircle(-78, 0, 3);
  g.fillCircle(-66, 0, 3);

  // Tail stub
  g.fillStyle(COLORS.steelDark);
  g.fillRect(50, 4, 14, 8);

  // Exhaust puff from back
  g.fillStyle(COLORS.boneDim);
  g.fillCircle(60, -4, 5);
  g.fillCircle(70, -10, 4);
  g.fillCircle(78, -16, 3);

  c.add(g);
  return c;
}

export function drawSentinelDrone(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 30);
  const g = scene.add.graphics();

  // Hover glow ring beneath
  g.fillStyle(COLORS.steam, 0.18);
  g.fillEllipse(0, 80, 110, 22);
  g.fillStyle(COLORS.steam, 0.35);
  g.fillEllipse(0, 80, 70, 12);

  // Inverted-triangle body
  g.fillStyle(COLORS.steelDark);
  g.fillTriangle(-55, -20, 55, -20, 0, 60);
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-46, -12, 46, -12, 0, 50);

  // Top plate
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-58, -28, 116, 12);
  g.fillStyle(COLORS.brass);
  g.fillRect(-50, -26, 100, 6);

  // Antenna
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-2, -56, 4, 28);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, -58, 4);

  // Central red lens / eye
  g.fillStyle(COLORS.steelDark);
  g.fillCircle(0, 0, 18);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, 0, 13);
  g.fillStyle(COLORS.bone);
  g.fillCircle(-3, -3, 4);

  // Side thrusters
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-72, -10, 18, 14);
  g.fillRect(54, -10, 18, 14);
  g.fillStyle(COLORS.steam);
  g.fillRect(-70, 4, 14, 4);
  g.fillRect(56, 4, 14, 4);

  // Rivets along the rim
  g.fillStyle(COLORS.brass);
  for (let i = 0; i < 5; i++) {
    const px = -40 + i * 20;
    g.fillCircle(px, -22, 2);
  }

  c.add(g);

  // Subtle bobbing
  scene.tweens.add({
    targets: c,
    y: c.y + 6,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

export function drawRustSprayer(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y + 4);
  const g = scene.add.graphics();

  // Tracks (no legs — moves on treads)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-58, 60, 116, 28);
  g.fillStyle(COLORS.steel);
  for (let i = 0; i < 8; i++) g.fillRect(-54 + i * 14, 64, 8, 20);

  // Squat oxidized body
  g.fillStyle(COLORS.rust);
  g.fillRect(-50, -10, 100, 70);
  g.fillStyle(COLORS.brassDim);
  for (let i = 0; i < 4; i++) g.fillCircle(-40 + i * 26, 0, 2.5);
  for (let i = 0; i < 4; i++) g.fillCircle(-40 + i * 26, 50, 2.5);

  // Sickly green oxide patches
  g.fillStyle(COLORS.buff, 0.5);
  g.fillCircle(-20, 20, 12);
  g.fillCircle(18, 6, 8);
  g.fillCircle(30, 40, 10);

  // Twin nozzle pods on top
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-44, -40, 30, 36);
  g.fillRect(14, -40, 30, 36);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-50, -10, 16, 10);
  g.fillRect(34, -10, 16, 10);

  // Spray nozzles
  g.fillStyle(COLORS.danger);
  g.fillCircle(-60, -4, 4);
  g.fillCircle(60, -4, 4);

  // Drips of acid
  g.fillStyle(COLORS.buff, 0.7);
  g.fillCircle(-60, 8, 3);
  g.fillCircle(60, 12, 3);
  g.fillCircle(-58, 18, 2);

  // Tiny optic on top
  g.fillStyle(COLORS.steelDark);
  g.fillCircle(0, -36, 8);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, -36, 4);

  c.add(g);
  return c;
}

export function drawPylonCrawler(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Six low legs
  g.fillStyle(COLORS.steelDark);
  for (let i = 0; i < 3; i++) {
    g.fillRect(-50 + i * 20, 36, 8, 50);
    g.fillRect(22 + i * 14, 36, 8, 50);
  }
  g.fillStyle(COLORS.steel);
  for (let i = 0; i < 3; i++) {
    g.fillRect(-52 + i * 20, 80, 12, 8);
    g.fillRect(20 + i * 14, 80, 12, 8);
  }

  // Wide low body
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-58, -10, 116, 50);
  g.fillStyle(COLORS.brass);
  g.fillRect(-58, -10, 116, 6);

  // Heavy plate edges
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-60, 32, 120, 10);

  // Central antenna spire
  g.fillStyle(COLORS.steel);
  g.fillRect(-4, -64, 8, 56);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, -68, 5);
  // Crossbar
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-20, -52, 40, 4);

  // Twin lateral guns
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-90, 8, 30, 10);
  g.fillRect(60, 8, 30, 10);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-94, 6, 6, 14);
  g.fillRect(88, 6, 6, 14);

  c.add(g);
  return c;
}

export function drawTinkerHawk(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 20);
  const g = scene.add.graphics();

  // Hover glow
  g.fillStyle(COLORS.steam, 0.18);
  g.fillEllipse(0, 80, 90, 16);

  // Wings spread wide
  g.fillStyle(COLORS.brassDim);
  g.fillTriangle(-90, 0, -20, -10, -20, 20);
  g.fillTriangle(90, 0, 20, -10, 20, 20);
  g.fillStyle(COLORS.brass);
  g.fillTriangle(-82, 0, -28, -4, -28, 14);
  g.fillTriangle(82, 0, 28, -4, 28, 14);

  // Streamlined body
  g.fillStyle(COLORS.rust);
  g.fillRect(-22, -16, 44, 50);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-18, -12, 36, 14);
  g.fillStyle(COLORS.steam);
  g.fillRect(-12, -8, 24, 4);

  // Beak/nose
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-14, 34, 14, 34, 0, 54);
  g.fillStyle(COLORS.danger);
  g.fillTriangle(-8, 38, 8, 38, 0, 48);

  // Talons
  g.fillStyle(COLORS.boneDim);
  g.fillTriangle(-16, 50, -10, 50, -13, 62);
  g.fillTriangle(10, 50, 16, 50, 13, 62);

  c.add(g);

  // Idle hover bob
  scene.tweens.add({
    targets: c,
    y: c.y + 5,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

export function drawSlagWalker(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Thick legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-44, 56, 26, 76);
  g.fillRect(18, 56, 26, 76);
  g.fillStyle(COLORS.steel);
  g.fillRect(-50, 126, 38, 18);
  g.fillRect(12, 126, 38, 18);

  // Torso — wider, hunched
  g.fillStyle(COLORS.rust);
  g.fillRect(-70, -30, 140, 90);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-60, -20, 120, 18);

  // Glowing slag vents (chest)
  g.fillStyle(COLORS.danger);
  g.fillRect(-30, 8, 16, 28);
  g.fillRect(14, 8, 16, 28);
  g.fillStyle(COLORS.steam);
  g.fillRect(-26, 12, 8, 20);
  g.fillRect(18, 12, 8, 20);

  // Shoulder pauldrons with spikes
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-86, -36, 32, 22);
  g.fillRect(54, -36, 32, 22);
  g.fillStyle(COLORS.brassDim);
  for (let i = 0; i < 3; i++) {
    g.fillTriangle(-82 + i * 10, -36, -76 + i * 10, -36, -79 + i * 10, -48);
    g.fillTriangle(58 + i * 10, -36, 64 + i * 10, -36, 61 + i * 10, -48);
  }

  // Head — angled visor
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-22, -56, 44, 26);
  g.fillStyle(COLORS.danger);
  g.fillRect(-16, -48, 32, 6);

  // Heavy arms with mauls
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-100, -18, 24, 60);
  g.fillRect(76, -18, 24, 60);
  g.fillStyle(COLORS.steel);
  g.fillRect(-110, 38, 44, 26);
  g.fillRect(66, 38, 44, 26);

  // Smokestack
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-6, -78, 12, 28);
  g.fillStyle(COLORS.boneDim, 0.45);
  g.fillCircle(0, -90, 9);

  c.add(g);

  // Subtle furnace flicker via alpha
  const flicker = scene.add.rectangle(-22, 22, 8, 22, COLORS.steam, 0.6);
  flicker.setAlpha(0.5);
  c.add(flicker);
  scene.tweens.add({ targets: flicker, alpha: 1, duration: 320, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

  return c;
}

export function drawIronReclaimer(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Squat thick legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-36, 50, 24, 60);
  g.fillRect(12, 50, 24, 60);
  g.fillStyle(COLORS.steel);
  g.fillRect(-40, 104, 32, 22);
  g.fillRect(8, 104, 32, 22);

  // Squat torso — armored slab
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-60, -20, 120, 78);
  g.fillStyle(COLORS.brass);
  g.fillRect(-56, -16, 112, 6);
  g.fillRect(-56, 50, 112, 6);

  // Rivets all over the armor
  g.fillStyle(COLORS.brass);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      g.fillCircle(-46 + col * 19, -8 + row * 20, 2.5);
    }
  }

  // Helmet
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-22, -46, 44, 28);
  g.fillStyle(COLORS.steam);
  g.fillRect(-14, -36, 28, 4);

  // Big shield arm (left)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-86, -22, 22, 60);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-110, 14, 30, 50);
  g.fillStyle(COLORS.brass);
  g.fillRect(-108, 18, 26, 4);
  g.fillRect(-108, 38, 26, 4);
  g.fillRect(-108, 58, 26, 4);

  // Hammer arm (right)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(64, -22, 22, 60);
  g.fillStyle(COLORS.steel);
  g.fillRect(70, 40, 30, 32);
  g.fillStyle(COLORS.brass);
  g.fillRect(74, 42, 22, 6);

  c.add(g);
  return c;
}

export function drawFoundryTyrant(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 10);
  const g = scene.add.graphics();

  // Wide planted legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-70, 70, 36, 80);
  g.fillRect(34, 70, 36, 80);
  g.fillStyle(COLORS.steel);
  g.fillRect(-76, 142, 46, 22);
  g.fillRect(30, 142, 46, 22);
  // Hip plating
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-58, 56, 116, 20);
  g.fillStyle(COLORS.brass);
  for (let i = 0; i < 4; i++) g.fillCircle(-44 + i * 26, 66, 3);

  // Massive torso
  g.fillStyle(COLORS.rust);
  g.fillRect(-86, -40, 172, 110);
  g.fillStyle(COLORS.steel);
  g.fillRect(-74, -30, 148, 12);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-74, 50, 148, 12);

  // Glowing furnace door — chest
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-32, -12, 64, 50);
  g.fillStyle(COLORS.rust);
  g.fillRect(-28, -8, 56, 42);
  g.fillStyle(COLORS.steam);
  g.fillRect(-24, -4, 48, 34);
  g.fillStyle(COLORS.danger);
  g.fillTriangle(-24, 30, 24, 30, 0, -4);
  // Furnace bars
  g.fillStyle(COLORS.steelDark);
  for (let i = 0; i < 3; i++) g.fillRect(-22 + i * 16, -4, 4, 34);

  // Shoulder armor
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-104, -44, 36, 30);
  g.fillRect(68, -44, 36, 30);
  g.fillStyle(COLORS.brass);
  g.fillRect(-104, -48, 36, 6);
  g.fillRect(68, -48, 36, 6);

  // Smokestacks — four of them
  g.fillStyle(COLORS.steelDark);
  for (const sx of [-94, -62, 58, 90]) {
    g.fillRect(sx, -90, 14, 46);
  }
  g.fillStyle(COLORS.brassDim);
  for (const sx of [-94, -62, 58, 90]) {
    g.fillRect(sx - 2, -94, 18, 6);
  }
  // Smoke puffs
  g.fillStyle(COLORS.boneDim, 0.5);
  for (const [sx, sy] of [
    [-87, -110], [-55, -118], [65, -114], [97, -106]
  ]) g.fillCircle(sx, sy, 8);

  // Helmet/head
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-26, -68, 52, 28);
  g.fillStyle(COLORS.danger);
  g.fillRect(-18, -58, 12, 6);
  g.fillRect(6, -58, 12, 6);

  // Hammer arm (right)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(94, -20, 26, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(86, 50, 42, 30);
  g.fillStyle(COLORS.brass);
  g.fillRect(82, 78, 50, 8);

  // Left fist
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-120, -20, 26, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(-128, 50, 42, 30);

  // Rivets along the torso
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-78, -32], [70, -32], [-78, 56], [70, 56], [-78, 12], [70, 12]
  ]) g.fillCircle(rx, ry, 3);

  c.add(g);

  // Furnace flicker
  scene.tweens.add({
    targets: c,
    scaleX: 1.012,
    scaleY: 1.012,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

export const ENEMY_SPRITES: Record<string, EnemyDraw> = {
  scrapRaider: drawRaider,
  junkHound: drawJunkHound,
  sentinelDrone: drawSentinelDrone,
  rustSprayer: drawRustSprayer,
  pylonCrawler: drawPylonCrawler,
  tinkerHawk: drawTinkerHawk,
  slagWalker: drawSlagWalker,
  ironReclaimer: drawIronReclaimer,
  foundryTyrant: drawFoundryTyrant
};

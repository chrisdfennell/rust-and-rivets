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

export function drawEngineerMech(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Wider, sturdier legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-58, 56, 36, 78);
  g.fillRect(22, 56, 36, 78);
  g.fillStyle(COLORS.steel);
  g.fillRect(-62, 126, 44, 18);
  g.fillRect(18, 126, 44, 18);

  // Reinforced hip
  g.fillStyle(COLORS.brass);
  g.fillRect(-46, 46, 92, 22);
  g.fillStyle(COLORS.brassDim);
  for (let i = 0; i < 5; i++) g.fillCircle(-36 + i * 18, 57, 3);

  // Boxy armored torso
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-68, -38, 136, 96);
  g.fillStyle(COLORS.brass);
  g.fillRect(-60, -32, 120, 8);
  g.fillRect(-60, 48, 120, 8);

  // Bolted chest plate
  g.fillStyle(COLORS.steel);
  g.fillRect(-30, -16, 60, 56);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-26, -12, 52, 48);
  g.fillStyle(COLORS.steam);
  g.fillRect(-10, 4, 20, 20);
  // Rivets on plate
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-26, -10], [22, -10], [-26, 32], [22, 32]
  ]) g.fillCircle(rx, ry, 3);

  // Box-helmet head
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-22, -64, 44, 26);
  g.fillStyle(COLORS.steam);
  g.fillRect(-14, -55, 28, 5);

  // Tower shield (left arm)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-98, -22, 22, 60);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-128, 4, 32, 76);
  g.fillStyle(COLORS.brass);
  g.fillRect(-126, 8, 28, 4);
  g.fillRect(-126, 28, 28, 4);
  g.fillRect(-126, 50, 28, 4);
  g.fillRect(-126, 70, 28, 4);
  // Shield boss
  g.fillStyle(COLORS.steam);
  g.fillCircle(-112, 42, 8);

  // Wrench-arm (right)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(74, -22, 22, 64);
  g.fillStyle(COLORS.brass);
  g.fillRect(78, 38, 28, 14);
  g.fillStyle(COLORS.steel);
  g.fillRect(98, 32, 14, 26);

  // No smokestacks — workshop-styled vents instead
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-44, -60, 10, 22);
  g.fillRect(34, -60, 10, 22);
  g.fillStyle(COLORS.brass);
  g.fillRect(-46, -62, 14, 4);
  g.fillRect(32, -62, 14, 4);

  c.add(g);
  return c;
}

export function drawSaboteurMech(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Lean legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-44, 58, 22, 74);
  g.fillRect(22, 58, 22, 74);
  g.fillStyle(COLORS.steel);
  g.fillRect(-48, 124, 30, 14);
  g.fillRect(18, 124, 30, 14);
  // Hydraulic pistons
  g.fillStyle(COLORS.brass);
  g.fillRect(-32, 62, 4, 60);
  g.fillRect(28, 62, 4, 60);

  // Slim hip
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-32, 48, 64, 14);

  // Tapered torso — lean, sleek
  g.fillStyle(COLORS.rust);
  g.fillTriangle(-44, -34, 44, -34, 56, 50);
  g.fillTriangle(-44, -34, 44, -34, -56, 50);
  g.fillRect(-44, -34, 88, 84);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-36, -22, 72, 16);

  // Single-optic visor head
  g.fillStyle(COLORS.steelDark);
  g.fillTriangle(-20, -64, 20, -64, 0, -34);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, -50, 6);
  g.fillStyle(COLORS.steam);
  g.fillCircle(0, -50, 3);

  // Toxic canisters on the back (peek out)
  g.fillStyle(COLORS.buff);
  g.fillRect(-58, -20, 14, 50);
  g.fillRect(44, -20, 14, 50);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-58, -22, 14, 4);
  g.fillRect(44, -22, 14, 4);
  g.fillStyle(COLORS.danger);
  g.fillRect(-56, -16, 10, 4);
  g.fillRect(46, -16, 10, 4);

  // Spray-nozzle arms
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-80, -10, 18, 56);
  g.fillRect(62, -10, 18, 56);
  // Nozzles
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-92, 42, 14, 10);
  g.fillRect(78, 42, 14, 10);
  g.fillStyle(COLORS.buff, 0.6);
  g.fillCircle(-86, 56, 4);
  g.fillCircle(86, 56, 4);

  // Acid drip glow
  g.fillStyle(COLORS.buff, 0.4);
  g.fillCircle(-86, 68, 3);
  g.fillCircle(86, 70, 3);

  c.add(g);
  return c;
}

export const CHARACTER_SPRITES: Record<string, (scene: Phaser.Scene, x: number, y: number) => Phaser.GameObjects.Container> = {
  pilot: drawMech,
  engineer: drawEngineerMech,
  saboteur: drawSaboteurMech
};

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

export function drawCinderHound(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Slightly bigger than Junk Hound — broader stance, glowing core
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-58, 30, 14, 56);
  g.fillRect(-30, 30, 14, 56);
  g.fillRect(22, 30, 14, 56);
  g.fillRect(50, 30, 14, 56);
  g.fillStyle(COLORS.steel);
  g.fillRect(-62, 82, 22, 10);
  g.fillRect(-34, 82, 22, 10);
  g.fillRect(18, 82, 22, 10);
  g.fillRect(46, 82, 22, 10);

  // Body — heavier, blackened steel with magma seams
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-66, -12, 124, 50);
  g.fillStyle(COLORS.danger);
  g.fillRect(-50, 12, 100, 6);
  g.fillRect(-40, 24, 80, 4);
  g.fillStyle(COLORS.steam, 0.5);
  g.fillRect(-46, 14, 92, 2);

  // Spine — taller spikes
  g.fillStyle(COLORS.brassDim);
  for (let i = 0; i < 6; i++) {
    const sx = -45 + i * 19;
    g.fillTriangle(sx - 6, -12, sx + 6, -12, sx, -28);
  }

  // Head — armored
  g.fillStyle(COLORS.steel);
  g.fillRect(-100, -10, 38, 32);
  g.fillTriangle(-108, 4, -100, -10, -100, 22);
  g.fillStyle(COLORS.danger);
  g.fillCircle(-86, -2, 4);
  g.fillCircle(-72, -2, 4);
  // Glowing maw
  g.fillStyle(COLORS.steam);
  g.fillRect(-100, 14, 30, 6);
  g.fillStyle(COLORS.danger);
  g.fillTriangle(-98, 22, -92, 22, -95, 30);
  g.fillTriangle(-88, 22, -82, 22, -85, 30);
  g.fillTriangle(-78, 22, -72, 22, -75, 30);

  // Heat plumes from back
  g.fillStyle(COLORS.danger, 0.55);
  g.fillCircle(62, -8, 6);
  g.fillCircle(72, -16, 5);

  c.add(g);
  return c;
}

export function drawSlagDrone(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 36);
  const g = scene.add.graphics();

  // Hover glow
  g.fillStyle(COLORS.steam, 0.18);
  g.fillEllipse(0, 96, 140, 26);
  g.fillStyle(COLORS.steam, 0.35);
  g.fillEllipse(0, 96, 92, 16);

  // Hex-shaped body — bigger than Sentinel Drone
  g.fillStyle(COLORS.steelDark);
  g.fillTriangle(-70, -10, 0, -52, 70, -10);
  g.fillTriangle(-70, 30, 0, 72, 70, 30);
  g.fillRect(-70, -10, 140, 40);
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-58, -2, 0, -40, 58, -2);
  g.fillTriangle(-58, 22, 0, 60, 58, 22);
  g.fillRect(-58, -2, 116, 24);

  // Heavy plate edges
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-72, -10, 144, 6);
  g.fillRect(-72, 24, 144, 6);

  // Triple eye core
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-32, 4, 64, 14);
  g.fillStyle(COLORS.danger);
  g.fillCircle(-18, 11, 5);
  g.fillCircle(0, 11, 5);
  g.fillCircle(18, 11, 5);

  // Antenna
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-2, -68, 4, 18);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, -70, 4);

  // Side thrusters
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-88, 4, 18, 16);
  g.fillRect(70, 4, 18, 16);
  g.fillStyle(COLORS.steam);
  g.fillRect(-86, 18, 14, 4);
  g.fillRect(72, 18, 14, 4);

  c.add(g);

  scene.tweens.add({
    targets: c,
    y: c.y + 6,
    duration: 1300,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

export function drawForgeReaver(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Bigger Scrap Raider silhouette — taller, broader
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-36, 60, 22, 70);
  g.fillRect(14, 60, 22, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(-40, 122, 30, 16);
  g.fillRect(10, 122, 30, 16);

  // Body — heavy, with rust runs
  g.fillStyle(COLORS.rust);
  g.fillRect(-52, -28, 104, 92);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-44, -18, 30, 26);
  g.fillRect(14, -6, 30, 22);
  g.fillRect(-30, 30, 60, 18);

  // Head — sharper, twin red optics
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-30, -58, 30, -58, 0, -16);
  g.fillStyle(COLORS.danger);
  g.fillCircle(-10, -40, 5);
  g.fillCircle(10, -40, 5);
  // Crown of small spikes
  g.fillStyle(COLORS.brassDim);
  for (let i = 0; i < 5; i++) {
    const sx = -24 + i * 12;
    g.fillTriangle(sx - 4, -58, sx + 4, -58, sx, -68);
  }

  // Massive cleaver arm (left)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-78, -22, 22, 70);
  g.fillStyle(COLORS.bone);
  g.fillTriangle(-100, 36, -52, 36, -76, 88);
  g.fillStyle(COLORS.boneDim);
  g.fillTriangle(-96, 40, -56, 40, -76, 80);

  // Right hammer arm
  g.fillStyle(COLORS.steelDark);
  g.fillRect(56, -22, 22, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(52, 48, 36, 30);
  g.fillStyle(COLORS.brass);
  g.fillRect(56, 78, 28, 6);

  // Heat vent
  g.fillStyle(COLORS.danger);
  g.fillRect(-4, 8, 8, 12);

  c.add(g);
  return c;
}

export function drawMagmaSentinel(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 4);
  const g = scene.add.graphics();

  // Even bulkier than Slag Walker — taller, broader, more cracks/glow
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-50, 62, 28, 80);
  g.fillRect(22, 62, 28, 80);
  g.fillStyle(COLORS.steel);
  g.fillRect(-56, 134, 40, 20);
  g.fillRect(16, 134, 40, 20);

  // Body with magma cracks
  g.fillStyle(COLORS.rust);
  g.fillRect(-78, -36, 156, 98);
  g.fillStyle(COLORS.danger);
  g.fillRect(-70, -20, 8, 76);
  g.fillRect(62, -20, 8, 76);
  g.fillRect(-30, 36, 60, 6);
  g.fillStyle(COLORS.steam);
  g.fillRect(-68, -16, 4, 68);
  g.fillRect(64, -16, 4, 68);

  // Big chest core (glowing)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-32, -10, 64, 50);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, 14, 22);
  g.fillStyle(COLORS.steam);
  g.fillCircle(0, 14, 14);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, 14, 6);

  // Pauldrons
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-94, -42, 32, 24);
  g.fillRect(62, -42, 32, 24);
  // Spikes
  g.fillStyle(COLORS.brass);
  for (let i = 0; i < 4; i++) {
    g.fillTriangle(-90 + i * 9, -42, -86 + i * 9, -42, -88 + i * 9, -54);
    g.fillTriangle(64 + i * 9, -42, 68 + i * 9, -42, 66 + i * 9, -54);
  }

  // Head
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-28, -70, 56, 30);
  g.fillStyle(COLORS.danger);
  g.fillRect(-20, -60, 16, 7);
  g.fillRect(4, -60, 16, 7);

  // Heavy mauls
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-110, -18, 24, 64);
  g.fillRect(86, -18, 24, 64);
  g.fillStyle(COLORS.steel);
  g.fillRect(-120, 46, 44, 30);
  g.fillRect(76, 46, 44, 30);
  g.fillStyle(COLORS.danger);
  g.fillRect(-114, 76, 32, 4);
  g.fillRect(82, 76, 32, 4);

  // Smoke stacks
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-46, -90, 12, 32);
  g.fillRect(34, -90, 12, 32);
  g.fillStyle(COLORS.danger, 0.6);
  g.fillCircle(-40, -106, 7);
  g.fillCircle(40, -106, 7);

  c.add(g);

  // Pulsing core
  const corePulse = scene.add.circle(0, 14, 24, COLORS.danger, 0.2);
  c.add(corePulse);
  scene.tweens.add({ targets: corePulse, scale: 1.4, alpha: 0, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.Out' });

  return c;
}

export function drawReclaimerMk2(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Bigger version of Iron Reclaimer with more rivets, taller shield
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-44, 56, 28, 70);
  g.fillRect(16, 56, 28, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(-50, 118, 40, 24);
  g.fillRect(10, 118, 40, 24);

  // Body
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-72, -26, 144, 96);
  g.fillStyle(COLORS.brass);
  g.fillRect(-68, -22, 136, 8);
  g.fillRect(-68, 64, 136, 8);

  // Rivets
  g.fillStyle(COLORS.brass);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      g.fillCircle(-58 + col * 18, -12 + row * 22, 2.8);
    }
  }

  // Helmet — bigger, with a slit visor
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-30, -60, 60, 34);
  g.fillStyle(COLORS.steam);
  g.fillRect(-22, -48, 44, 5);

  // Tower shield (left)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-94, -22, 24, 76);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-126, 0, 36, 80);
  g.fillStyle(COLORS.brass);
  g.fillRect(-124, 4, 32, 4);
  g.fillRect(-124, 22, 32, 4);
  g.fillRect(-124, 40, 32, 4);
  g.fillRect(-124, 58, 32, 4);
  g.fillRect(-124, 72, 32, 4);
  // Shield emblem
  g.fillStyle(COLORS.danger);
  g.fillTriangle(-114, 30, -100, 30, -107, 50);

  // Hammer arm (right)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(70, -22, 24, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(74, 48, 38, 38);
  g.fillStyle(COLORS.brass);
  g.fillRect(78, 86, 30, 8);

  c.add(g);
  return c;
}

export function drawIronSovereign(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 14);
  const g = scene.add.graphics();

  // Wide base — fortress tracks
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-100, 92, 200, 38);
  g.fillStyle(COLORS.steel);
  for (let i = 0; i < 11; i++) g.fillRect(-96 + i * 18, 98, 12, 26);

  // Lower armored skirt
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-90, 72, 180, 24);
  g.fillStyle(COLORS.brass);
  for (let i = 0; i < 8; i++) g.fillCircle(-80 + i * 22, 84, 3);

  // Main fortress torso
  g.fillStyle(COLORS.rust);
  g.fillRect(-100, -44, 200, 120);
  g.fillStyle(COLORS.steel);
  g.fillRect(-90, -34, 180, 14);
  g.fillRect(-90, 58, 180, 14);

  // Central cannon mount (the BIG gun)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-44, -84, 88, 60);
  g.fillStyle(COLORS.steel);
  g.fillRect(-38, -78, 76, 48);

  // The cannon barrel itself, jutting out
  g.fillStyle(COLORS.steelDark);
  g.fillRect(80, -64, 80, 22);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(140, -68, 22, 30);
  g.fillStyle(COLORS.danger);
  g.fillCircle(162, -53, 6);

  // Furnace eye in the cannon housing
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, -54, 14);
  g.fillStyle(COLORS.steam);
  g.fillCircle(0, -54, 8);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, -54, 3);

  // Crown of smokestacks
  g.fillStyle(COLORS.steelDark);
  for (const sx of [-78, -54, 50, 74]) {
    g.fillRect(sx, -110, 14, 32);
  }
  g.fillStyle(COLORS.brassDim);
  for (const sx of [-78, -54, 50, 74]) {
    g.fillRect(sx - 2, -116, 18, 6);
  }
  g.fillStyle(COLORS.boneDim, 0.55);
  for (const [sx, sy] of [[-71, -134], [-47, -142], [57, -138], [81, -130]]) {
    g.fillCircle(sx, sy, 9);
  }

  // Side cannons
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-130, 0, 30, 22);
  g.fillStyle(COLORS.brass);
  g.fillRect(-134, 4, 8, 14);
  g.fillStyle(COLORS.danger);
  g.fillCircle(-126, 11, 3);

  g.fillStyle(COLORS.steelDark);
  g.fillRect(100, 32, 30, 22);
  g.fillStyle(COLORS.brass);
  g.fillRect(126, 36, 8, 14);
  g.fillStyle(COLORS.danger);
  g.fillCircle(118, 43, 3);

  // Brass rivets along main body
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-90, -28], [86, -28], [-90, 52], [86, 52], [-90, 12], [86, 12], [0, 12]
  ]) g.fillCircle(rx, ry, 3.5);

  // Throne emblem
  g.fillStyle(COLORS.brass);
  g.fillTriangle(-12, -10, 12, -10, 0, -30);

  c.add(g);

  // Cannon eye pulse
  const eyePulse = scene.add.circle(0, -54, 16, COLORS.danger, 0.25);
  c.add(eyePulse);
  scene.tweens.add({ targets: eyePulse, scale: 1.5, alpha: 0, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.Out' });

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
  foundryTyrant: drawFoundryTyrant,
  cinderHound: drawCinderHound,
  slagDrone: drawSlagDrone,
  forgeReaver: drawForgeReaver,
  magmaSentinel: drawMagmaSentinel,
  reclaimerMk2: drawReclaimerMk2,
  ironSovereign: drawIronSovereign
};

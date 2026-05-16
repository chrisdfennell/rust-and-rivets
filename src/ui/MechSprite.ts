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

// THE STOKER — heat-themed industrial frame. Heavy planted legs, riveted
// brass-orange torso, central furnace core (pulses on a slow tween), three
// asymmetric smokestacks, orange visor. One arm carries a glowing fire-
// poker, the other a stoking shovel — heat tools, not weapons.
export function drawStokerMech(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Wide planted legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-54, 60, 32, 72);
  g.fillRect(22, 60, 32, 72);
  g.fillStyle(COLORS.steel);
  g.fillRect(-58, 124, 40, 18);
  g.fillRect(18, 124, 40, 18);
  // Hip
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-44, 50, 88, 18);
  g.fillStyle(COLORS.brass);
  for (let i = 0; i < 5; i++) g.fillCircle(-34 + i * 17, 59, 2.5);

  // Boxy torso — riveted brass slab
  g.fillStyle(COLORS.rust);
  g.fillRect(-64, -34, 128, 92);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-58, -28, 116, 10);
  g.fillRect(-58, 44, 116, 10);
  // Rivet rows
  g.fillStyle(COLORS.brass);
  for (let col = 0; col < 6; col++) {
    g.fillCircle(-48 + col * 19, -24, 2.5);
    g.fillCircle(-48 + col * 19, 48, 2.5);
  }

  // Furnace core (chest) — orange grate that pulses via the tween below.
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-26, -10, 52, 42);
  g.fillStyle(COLORS.danger);
  g.fillRect(-22, -6, 44, 34);
  g.fillStyle(0xffa030); // amber
  g.fillRect(-18, -2, 36, 26);
  // Furnace grate bars (dark vertical slats)
  g.fillStyle(COLORS.steelDark);
  for (let i = 0; i < 4; i++) g.fillRect(-16 + i * 10, -2, 3, 26);
  // Inner glow
  g.fillStyle(0xfff060, 0.8);
  g.fillCircle(0, 12, 6);

  // Three smokestacks — asymmetric, the middle one taller (heat exhaust).
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-50, -72, 12, 38);
  g.fillRect( -6, -82, 12, 48);
  g.fillRect( 38, -68, 12, 34);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-52, -76, 16, 6);
  g.fillRect( -8, -86, 16, 6);
  g.fillRect( 36, -72, 16, 6);
  // Smoke puffs
  g.fillStyle(COLORS.boneDim, 0.5);
  g.fillCircle(-44, -86, 6);
  g.fillCircle(  0, -98, 7);
  g.fillCircle( 44, -82, 6);

  // Helm — slit visor with amber glow
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-22, -30, 44, 18);
  g.fillStyle(0xffa030);
  g.fillRect(-16, -24, 32, 4);

  // Stoking shovel arm (left) — long pole with a flat metal scoop
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-100, -16, 22, 64);
  g.fillStyle(COLORS.steel);
  g.fillRect(-118, 46, 38, 14); // scoop blade
  g.fillStyle(COLORS.brass);
  g.fillRect(-122, 44, 6, 18); // scoop tip

  // Fire-poker arm (right) — pole tipped with glowing ember
  g.fillStyle(COLORS.steelDark);
  g.fillRect( 78, -16, 22, 64);
  g.fillStyle(COLORS.steel);
  g.fillRect( 80, 48, 18, 26); // pole bottom
  g.fillStyle(COLORS.danger);
  g.fillCircle( 89, 80, 7);    // ember
  g.fillStyle(0xffa030);
  g.fillCircle( 89, 80, 4);

  c.add(g);
  // Slow furnace flicker — gives the central core a breathing pulse.
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

export const CHARACTER_SPRITES: Record<string, (scene: Phaser.Scene, x: number, y: number) => Phaser.GameObjects.Container> = {
  pilot: drawMech,
  engineer: drawEngineerMech,
  saboteur: drawSaboteurMech,
  stoker: drawStokerMech
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
  // Heavy weight-shift idle — slow left-right shuffle.
  scene.tweens.add({
    targets: c,
    x: c.x + 2,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
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
  // Panting bob — short fast vertical breathing.
  scene.tweens.add({
    targets: c,
    y: c.y - 2,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
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
  // Acid pulse — body throbs slightly as pressure cycles through the nozzles.
  scene.tweens.add({
    targets: c,
    scaleX: 1.02,
    scaleY: 1.02,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
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
  // Low tremble — slow side-to-side, as if servos can barely hold the weight.
  scene.tweens.add({
    targets: c,
    x: c.x + 1.5,
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
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
  // Heavy turtle heave — slow vertical bob, as if breathing under all that plating.
  scene.tweens.add({
    targets: c,
    y: c.y - 1.5,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
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
  // Fiery panting — quick vertical bob with a small scale pulse to
  // suggest the heat plumes flaring.
  scene.tweens.add({
    targets: c,
    y: c.y - 2,
    scaleX: 1.015,
    scaleY: 1.015,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
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
  // Heavy cleaver sway — slightly larger amplitude than the Raider.
  scene.tweens.add({
    targets: c,
    x: c.x + 2.5,
    duration: 1300,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
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
  // Slower heave than Iron Reclaimer — bigger frame, heavier breath.
  scene.tweens.add({
    targets: c,
    y: c.y - 2,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
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

// ===== Act 3 — Above the Cloudline =====

export function drawStratusDrone(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 30);
  const g = scene.add.graphics();

  // Hover halo
  g.fillStyle(COLORS.shield, 0.15);
  g.fillEllipse(0, 92, 130, 22);
  g.fillStyle(COLORS.shield, 0.32);
  g.fillEllipse(0, 92, 86, 12);

  // Sleek delta wings
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-90, 8, -16, 0, -16, 30);
  g.fillTriangle(90, 8, 16, 0, 16, 30);
  g.fillStyle(COLORS.shield);
  g.fillTriangle(-78, 8, -22, 4, -22, 22);
  g.fillTriangle(78, 8, 22, 4, 22, 22);

  // Inverted-triangle body (smaller than Sentinel/Slag drone)
  g.fillStyle(COLORS.steelDark);
  g.fillTriangle(-44, -8, 44, -8, 0, 50);
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-36, -2, 36, -2, 0, 42);

  // Top plate
  g.fillStyle(COLORS.brass);
  g.fillRect(-46, -16, 92, 10);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-50, -22, 100, 8);

  // Antenna with glowing blue tip
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-2, -50, 4, 28);
  g.fillStyle(COLORS.shield);
  g.fillCircle(0, -52, 4);

  // Twin-eye sensor
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-22, 4, 44, 12);
  g.fillStyle(COLORS.shield);
  g.fillCircle(-12, 10, 4);
  g.fillCircle(12, 10, 4);

  // Side thrusters with sky-blue exhaust
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-72, 2, 16, 14);
  g.fillRect(56, 2, 16, 14);
  g.fillStyle(COLORS.shield);
  g.fillRect(-70, 14, 12, 4);
  g.fillRect(58, 14, 12, 4);

  c.add(g);

  scene.tweens.add({
    targets: c,
    y: c.y + 6,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

export function drawSkyPirate(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Legs (stocky, less hunched than Raider)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-32, 60, 22, 70);
  g.fillRect(10, 60, 22, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(-36, 122, 30, 14);
  g.fillRect(6, 122, 30, 14);

  // Cape billowing behind
  g.fillStyle(COLORS.brass, 0.7);
  g.fillTriangle(-58, -10, 58, -10, 0, 90);
  g.fillStyle(COLORS.brassDim, 0.8);
  g.fillTriangle(-44, 0, 44, 0, 0, 80);

  // Body (lean, longer than Raider)
  g.fillStyle(COLORS.shield);
  g.fillRect(-46, -28, 92, 84);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-38, -18, 76, 18);

  // Sash across the body
  g.fillStyle(COLORS.brass);
  g.fillTriangle(-46, 8, 46, -8, 46, 0);
  g.fillTriangle(-46, 8, -46, 16, 46, 0);

  // Broad-brim helmet head
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-26, -56, 52, 22);
  g.fillRect(-34, -42, 68, 6);  // brim
  g.fillStyle(COLORS.shield);
  g.fillRect(-16, -50, 32, 6);  // visor slit

  // Cutlass arm (left, raised)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-72, -16, 18, 50);
  g.fillStyle(COLORS.brass);
  g.fillRect(-78, -42, 10, 26);
  g.fillStyle(COLORS.bone);
  g.fillRect(-76, -78, 6, 36);  // blade
  g.fillStyle(COLORS.boneDim);
  g.fillTriangle(-79, -84, -67, -84, -73, -78);  // tip

  // Pistol arm (right)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(54, -10, 18, 50);
  g.fillRect(72, 8, 22, 12);  // pistol body
  g.fillStyle(COLORS.brass);
  g.fillRect(94, 12, 10, 4);  // barrel
  g.fillStyle(COLORS.danger);
  g.fillCircle(106, 14, 3);  // muzzle glow

  c.add(g);
  // Hover bob — more dramatic vertical motion since the Sky Pirate is
  // an airborne unit, no legs grounding it.
  scene.tweens.add({
    targets: c,
    y: c.y - 6,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
  return c;
}

export function drawLightningSprite(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 14);
  const g = scene.add.graphics();

  // Hover field
  g.fillStyle(COLORS.steam, 0.18);
  g.fillEllipse(0, 80, 80, 14);

  // Compact diamond body
  g.fillStyle(COLORS.steelDark);
  g.fillTriangle(-30, 0, 30, 0, 0, -40);
  g.fillTriangle(-30, 0, 30, 0, 0, 50);
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-22, 0, 22, 0, 0, -32);
  g.fillTriangle(-22, 0, 22, 0, 0, 42);

  // Glowing electric core
  g.fillStyle(COLORS.steam);
  g.fillCircle(0, 4, 12);
  g.fillStyle(COLORS.bone);
  g.fillCircle(0, 4, 6);

  // Lightning arc nodes (4 corners)
  g.fillStyle(COLORS.steam);
  for (const [px, py] of [[-30, -10], [30, -10], [-30, 10], [30, 10]]) {
    g.fillCircle(px, py, 4);
  }

  // Crackling arcs (procedurally-drawn small lines)
  g.lineStyle(2, COLORS.steam, 0.85);
  g.beginPath();
  g.moveTo(-30, -10); g.lineTo(-22, -2); g.lineTo(-26, 4); g.lineTo(-18, 10);
  g.strokePath();
  g.beginPath();
  g.moveTo(30, -10); g.lineTo(22, -2); g.lineTo(26, 4); g.lineTo(18, 10);
  g.strokePath();

  c.add(g);

  // Twitchy bobbing
  scene.tweens.add({
    targets: c,
    y: c.y + 4,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });
  // Core pulse
  const corePulse = scene.add.circle(0, 4, 14, COLORS.steam, 0.3);
  c.add(corePulse);
  scene.tweens.add({ targets: corePulse, scale: 1.5, alpha: 0, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.Out' });

  return c;
}

export function drawCloudReaver(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 24);
  const g = scene.add.graphics();

  // Hover thrust glow
  g.fillStyle(COLORS.steam, 0.18);
  g.fillEllipse(0, 130, 200, 36);
  g.fillStyle(COLORS.steam, 0.32);
  g.fillEllipse(0, 130, 130, 22);

  // Massive wings
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-130, 0, -30, -22, -30, 50);
  g.fillTriangle(130, 0, 30, -22, 30, 50);
  g.fillStyle(COLORS.shield);
  g.fillTriangle(-118, 4, -36, -16, -36, 40);
  g.fillTriangle(118, 4, 36, -16, 36, 40);
  // Wing struts
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-118, 0, 86, 4);
  g.fillRect(32, 0, 86, 4);

  // Heavy body
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-58, -38, 116, 96);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-50, -32, 100, 12);
  g.fillRect(-50, 46, 100, 12);

  // Glowing chest core
  g.fillStyle(COLORS.shield);
  g.fillCircle(0, 8, 22);
  g.fillStyle(COLORS.steam);
  g.fillCircle(0, 8, 12);

  // Pauldrons + spikes
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-78, -42, 26, 22);
  g.fillRect(52, -42, 26, 22);
  g.fillStyle(COLORS.brass);
  for (let i = 0; i < 3; i++) {
    g.fillTriangle(-74 + i * 9, -42, -68 + i * 9, -42, -71 + i * 9, -54);
    g.fillTriangle(54 + i * 9, -42, 60 + i * 9, -42, 57 + i * 9, -54);
  }

  // Helmet
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-22, -64, 44, 26);
  g.fillStyle(COLORS.shield);
  g.fillRect(-14, -56, 28, 5);

  // Underwing thrusters
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-90, 38, 20, 18);
  g.fillRect(70, 38, 20, 18);
  g.fillStyle(COLORS.steam);
  g.fillRect(-86, 56, 12, 8);
  g.fillRect(74, 56, 12, 8);

  c.add(g);

  scene.tweens.add({
    targets: c,
    y: c.y + 5,
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

export function drawSkyMarshal(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 14);
  const g = scene.add.graphics();

  // Hover field
  g.fillStyle(COLORS.shield, 0.18);
  g.fillEllipse(0, 130, 180, 28);
  g.fillStyle(COLORS.shield, 0.32);
  g.fillEllipse(0, 130, 120, 18);

  // Squat fortress body
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-72, -28, 144, 100);
  g.fillStyle(COLORS.brass);
  g.fillRect(-68, -22, 136, 8);
  g.fillRect(-68, 64, 136, 8);
  // Rivet grid
  g.fillStyle(COLORS.brass);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      g.fillCircle(-58 + col * 18, -12 + row * 22, 2.8);
    }
  }

  // Crown of points
  g.fillStyle(COLORS.steelDark);
  for (let i = 0; i < 5; i++) {
    const cx = -36 + i * 18;
    g.fillTriangle(cx - 6, -28, cx + 6, -28, cx, -50);
  }
  // Centered crown jewel
  g.fillStyle(COLORS.shield);
  g.fillCircle(0, -32, 5);

  // Visor head
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-30, -22, 60, 26);
  g.fillStyle(COLORS.shield);
  g.fillRect(-22, -10, 44, 5);

  // Tower shield (left)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-94, -16, 24, 80);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-128, 0, 36, 84);
  g.fillStyle(COLORS.brass);
  for (let i = 0; i < 4; i++) g.fillRect(-126, 6 + i * 20, 32, 4);
  // Shield emblem (winged)
  g.fillStyle(COLORS.shield);
  g.fillTriangle(-116, 38, -100, 38, -108, 58);
  g.fillRect(-118, 30, 4, 12);
  g.fillRect(-104, 30, 4, 12);

  // Sword arm (right)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(70, -20, 24, 70);
  g.fillStyle(COLORS.brass);
  g.fillRect(76, 50, 14, 10);
  g.fillStyle(COLORS.bone);
  g.fillRect(78, -50, 10, 100);  // long blade
  g.fillStyle(COLORS.boneDim);
  g.fillTriangle(76, -56, 90, -56, 83, -68);

  c.add(g);

  scene.tweens.add({
    targets: c,
    y: c.y + 4,
    duration: 1300,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

export function drawStormheart(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 30);
  const g = scene.add.graphics();

  // Storm clouds underneath (hover)
  g.fillStyle(COLORS.shield, 0.2);
  g.fillEllipse(0, 150, 280, 50);
  g.fillStyle(COLORS.shield, 0.32);
  g.fillEllipse(-40, 140, 110, 36);
  g.fillEllipse(40, 144, 130, 40);
  g.fillStyle(COLORS.steelDark, 0.8);
  g.fillEllipse(0, 150, 240, 28);

  // Massive central body — fortress in the sky
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-110, -60, 220, 130);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-100, -50, 200, 16);
  g.fillRect(-100, 56, 200, 16);

  // Wings — angular and broad
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-180, 10, -110, -30, -110, 50);
  g.fillTriangle(180, 10, 110, -30, 110, 50);
  g.fillStyle(COLORS.shield);
  g.fillTriangle(-168, 14, -116, -22, -116, 42);
  g.fillTriangle(168, 14, 116, -22, 116, 42);

  // Storm core (huge glowing center)
  g.fillStyle(COLORS.shield);
  g.fillCircle(0, 8, 38);
  g.fillStyle(COLORS.steam);
  g.fillCircle(0, 8, 24);
  g.fillStyle(COLORS.bone);
  g.fillCircle(-4, 4, 8);
  // Lightning bolts inside
  g.lineStyle(2, COLORS.bone, 0.9);
  g.beginPath();
  g.moveTo(-12, -8); g.lineTo(-4, 4); g.lineTo(-8, 8); g.lineTo(0, 18);
  g.strokePath();
  g.beginPath();
  g.moveTo(12, -8); g.lineTo(4, 4); g.lineTo(8, 8); g.lineTo(0, 18);
  g.strokePath();

  // Crown of antenna rods around the body top
  g.fillStyle(COLORS.steelDark);
  for (const sx of [-86, -52, -18, 18, 52, 86]) {
    g.fillRect(sx, -106, 8, 46);
  }
  g.fillStyle(COLORS.shield);
  for (const sx of [-86, -52, -18, 18, 52, 86]) {
    g.fillCircle(sx + 4, -110, 5);
  }

  // Side weapon batteries
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-138, 14, 30, 24);
  g.fillRect(108, 38, 30, 24);
  g.fillStyle(COLORS.brass);
  g.fillRect(-148, 22, 12, 8);
  g.fillRect(136, 46, 12, 8);
  g.fillStyle(COLORS.danger);
  g.fillCircle(-140, 26, 3);
  g.fillCircle(142, 50, 3);

  // Brass rivets along the main body
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-100, -44], [98, -44], [-100, 60], [98, 60], [-100, 12], [98, 12]
  ]) g.fillCircle(rx, ry, 4);

  c.add(g);

  // Storm core pulse
  const corePulse = scene.add.circle(0, 8, 40, COLORS.shield, 0.3);
  c.add(corePulse);
  scene.tweens.add({ targets: corePulse, scale: 1.5, alpha: 0, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.Out' });

  // Slow heavy hover bob
  scene.tweens.add({
    targets: c,
    y: c.y + 8,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// Salvage Colossus — Act 1 alt boss. Lopsided junk-giant; one arm hammer-
// fist with extra welded plates, the other a clamp. Smokestack on the
// shoulder. Reads as "patchwork tank" vs Foundry Tyrant's "furnace mech".
export function drawSalvageColossus(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 10);
  const g = scene.add.graphics();

  // Asymmetric legs — left wider than right
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-72, 70, 40, 80);
  g.fillRect(38, 70, 30, 80);
  g.fillStyle(COLORS.steel);
  g.fillRect(-78, 142, 52, 22);
  g.fillRect(34, 142, 40, 22);

  // Torso — boxy, with extra welded scrap plates
  g.fillStyle(COLORS.rust);
  g.fillRect(-80, -36, 162, 104);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-72, -24, 60, 34); // welded patch left
  g.fillRect(20, 8, 50, 28);    // welded patch right
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-50, 36, 100, 14);

  // Rivets all over the patches
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-66, -16], [-30, -16], [-66, 4], [-30, 4],
    [28, 16], [60, 16], [28, 32], [60, 32]
  ]) g.fillCircle(rx, ry, 3);

  // Head — small, off-center cockpit
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-18, -64, 44, 28);
  g.fillStyle(COLORS.steam);
  g.fillRect(-12, -56, 16, 10); // visor
  g.fillStyle(COLORS.danger);
  g.fillRect(8, -56, 12, 6);    // red eye

  // Massive hammer-arm (right)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(86, -28, 30, 76);
  g.fillStyle(COLORS.steel);
  g.fillRect(76, 48, 50, 36); // hammer head
  g.fillStyle(COLORS.brass);
  g.fillRect(72, 80, 58, 6);
  // Spikes on hammer
  g.fillStyle(COLORS.steelDark);
  for (const sx of [80, 96, 112]) g.fillRect(sx, 38, 6, 12);

  // Clamp arm (left)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-116, -20, 26, 60);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-128, 36, 16, 28); // upper jaw
  g.fillRect(-108, 36, 16, 28); // lower jaw

  // Single off-center smokestack (shoulder)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(48, -84, 14, 50);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(46, -88, 18, 6);
  g.fillStyle(COLORS.boneDim, 0.5);
  g.fillCircle(55, -102, 8);
  g.fillCircle(64, -114, 6);

  c.add(g);

  // Subtle hulking sway
  scene.tweens.add({
    targets: c,
    x: x + 2,
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// Pyroclast Engine — Act 2 alt boss. Tracked furnace-tank, low-slung and
// wide, with vent grilles glowing orange and a magma core in the center.
// Reads as "rolling forge" vs Iron Sovereign's "fortress tank".
export function drawPyroclastEngine(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 4);
  const g = scene.add.graphics();

  // Wide tracked base (no legs)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-110, 60, 220, 50);
  g.fillStyle(COLORS.steel);
  // tread plates
  for (let i = 0; i < 11; i++) {
    g.fillRect(-104 + i * 20, 92, 14, 12);
  }
  // wheel hubs
  g.fillStyle(COLORS.brassDim);
  for (const wx of [-86, -42, 0, 42, 86]) {
    g.fillCircle(wx, 88, 8);
    g.fillStyle(COLORS.brass);
    g.fillCircle(wx, 88, 4);
    g.fillStyle(COLORS.brassDim);
  }

  // Wide torso/turret
  g.fillStyle(COLORS.rust);
  g.fillRect(-86, -34, 172, 92);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-78, -26, 156, 10);
  g.fillRect(-78, 42, 156, 10);

  // Magma core (chest) — pulsing orange
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-30, -10, 60, 50);
  g.fillStyle(COLORS.danger);
  g.fillRect(-26, -6, 52, 42);
  g.fillStyle(0xffa030);
  g.fillRect(-22, -2, 44, 34);
  g.fillStyle(0xfff060);
  g.fillCircle(0, 16, 10);

  // Vent grilles flanking the core
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-72, -8, 28, 44);
  g.fillRect(44, -8, 28, 44);
  g.fillStyle(0xffa030);
  for (let i = 0; i < 4; i++) {
    g.fillRect(-70, -6 + i * 11, 24, 4);
    g.fillRect(46, -6 + i * 11, 24, 4);
  }

  // Smokestacks — three short stubby ones (no head, the smokestacks ARE the silhouette top)
  g.fillStyle(COLORS.steelDark);
  for (const sx of [-50, 0, 50]) g.fillRect(sx - 8, -64, 16, 30);
  g.fillStyle(COLORS.brassDim);
  for (const sx of [-50, 0, 50]) g.fillRect(sx - 10, -68, 20, 6);
  g.fillStyle(0xffa030);
  for (const sx of [-50, 0, 50]) g.fillCircle(sx, -56, 4);
  // smoke
  g.fillStyle(COLORS.boneDim, 0.45);
  g.fillCircle(-45, -82, 6);
  g.fillCircle(5, -88, 7);
  g.fillCircle(55, -80, 6);

  // Small sensor strip on top of core
  g.fillStyle(COLORS.danger);
  g.fillRect(-20, -32, 40, 4);

  c.add(g);

  // Pulsing magma glow via scale
  scene.tweens.add({
    targets: c,
    scaleX: 1.014,
    scaleY: 1.014,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// The Wraith — Act 3 alt boss. Tall, narrow specter knight with a flowing
// cape (no legs visible), faceplate showing two glowing eyes, twin curved
// blades. Reads as "ghost duelist" vs Stormheart's "lightning fortress".
export function drawTheWraith(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 20);
  const g = scene.add.graphics();

  // Cape skirt (no legs)
  g.fillStyle(0x1a1e3a); // dark indigo
  g.fillTriangle(-60, 30, 60, 30, 0, 160);
  g.fillStyle(0x2a3060);
  g.fillTriangle(-46, 50, 46, 50, 0, 150);
  // Cape edge — wispy bottom
  g.fillStyle(0x1a1e3a);
  for (let i = 0; i < 6; i++) {
    const cx = -50 + i * 20;
    g.fillTriangle(cx, 150, cx + 14, 150, cx + 7, 168);
  }

  // Narrow torso
  g.fillStyle(0x3a3050);
  g.fillRect(-32, -38, 64, 78);
  g.fillStyle(0x5048a0);
  g.fillRect(-26, -32, 52, 8);
  g.fillStyle(0x2a3060);
  g.fillRect(-26, 30, 52, 8);

  // Sash / belt
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-32, 22, 64, 8);

  // Hood / helm
  g.fillStyle(0x2a2748);
  g.fillTriangle(-30, -56, 30, -56, 0, -90);
  g.fillRect(-30, -56, 60, 24);
  g.fillStyle(0x1a1830);
  g.fillRect(-22, -50, 44, 16); // face shadow
  // Eyes — cyan glow
  g.fillStyle(COLORS.steam);
  g.fillCircle(-10, -42, 4);
  g.fillCircle(10, -42, 4);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(-10, -42, 2);
  g.fillCircle(10, -42, 2);

  // Shoulder pauldrons
  g.fillStyle(0x2a2748);
  g.fillRect(-50, -36, 18, 28);
  g.fillRect(32, -36, 18, 28);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-50, -40, 18, 4);
  g.fillRect(32, -40, 18, 4);

  // Twin curved blades — right arm
  g.fillStyle(0x3a3050);
  g.fillRect(46, -10, 14, 50);
  g.fillStyle(COLORS.steel);
  // blade curve approximated by triangles
  g.fillTriangle(58, 40, 86, 30, 76, 70);
  g.fillStyle(COLORS.steam);
  g.fillTriangle(60, 42, 80, 38, 74, 64);
  // Left blade
  g.fillStyle(0x3a3050);
  g.fillRect(-60, -10, 14, 50);
  g.fillStyle(COLORS.steel);
  g.fillTriangle(-58, 40, -86, 30, -76, 70);
  g.fillStyle(COLORS.steam);
  g.fillTriangle(-60, 42, -80, 38, -74, 64);

  // Floating wisps around the figure
  g.fillStyle(COLORS.steam, 0.35);
  g.fillCircle(-70, -10, 5);
  g.fillCircle(72, 20, 4);
  g.fillCircle(40, -70, 3);
  g.fillCircle(-30, -78, 4);

  c.add(g);

  // Slow ethereal float
  scene.tweens.add({
    targets: c,
    y: c.y - 5,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// Ember Spitter — Act 2 mook. Small squat cauldron-mech: stubby legs,
// open-top crucible chest glowing molten orange, one stubby barrel
// arm. Reads as "the kettle that throws fire."
export function drawEmberSpitter(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Stubby legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-38, 40, 18, 44);
  g.fillRect(20, 40, 18, 44);
  g.fillStyle(COLORS.steel);
  g.fillRect(-42, 80, 26, 12);
  g.fillRect(16, 80, 26, 12);

  // Cauldron body — wider at bottom
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-56, -12, 112, 56);
  g.fillStyle(COLORS.rust);
  g.fillRect(-50, -6, 100, 44);
  // Crucible rim
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-58, -14, 116, 8);

  // Molten core opening
  g.fillStyle(COLORS.danger);
  g.fillRect(-32, -6, 64, 22);
  g.fillStyle(0xffa030);
  g.fillRect(-26, -4, 52, 16);
  g.fillStyle(0xfff060);
  g.fillEllipse(0, 6, 40, 8);

  // Smoke wisps coming off the top
  g.fillStyle(COLORS.boneDim, 0.5);
  g.fillCircle(-20, -28, 5);
  g.fillCircle(8, -34, 6);
  g.fillCircle(24, -26, 4);

  // Barrel-arm on the right (the spitter)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(54, 4, 36, 18);
  g.fillStyle(COLORS.brass);
  g.fillRect(86, 4, 8, 18);
  g.fillStyle(COLORS.danger);
  g.fillCircle(92, 13, 4);

  // Small handle-arm on left
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-72, 6, 16, 26);
  g.fillStyle(COLORS.brassDim);
  g.fillCircle(-64, 36, 6);

  // Rivets along the body
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-44, 22], [44, 22], [-44, 36], [44, 36]
  ]) g.fillCircle(rx, ry, 2.5);

  c.add(g);

  // Heat pulse via tiny scale tween
  scene.tweens.add({
    targets: c,
    scaleX: 1.018,
    scaleY: 1.018,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// Pig Iron Brute — Act 2 mook. Boxy iron golem with bolted-on plate
// pauldrons that grow thicker each Anneal (visually static — we don't
// rebuild the sprite per turn). One massive iron fist as the right
// arm. Reads as "slow but hits like a forge press."
export function drawPigIronBrute(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 4);
  const g = scene.add.graphics();

  // Thick legs
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-46, 50, 26, 56);
  g.fillRect(20, 50, 26, 56);
  g.fillStyle(COLORS.steel);
  g.fillRect(-52, 102, 34, 14);
  g.fillRect(18, 102, 34, 14);

  // Squat boxy torso
  g.fillStyle(COLORS.rust);
  g.fillRect(-62, -28, 124, 82);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-54, -20, 108, 12);  // chest band
  g.fillRect(-54, 38, 108, 12);   // belt band

  // Bolted-on plate pauldrons
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-78, -20, 22, 36);
  g.fillRect(56, -20, 22, 36);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-78, -22, 22, 4);
  g.fillRect(56, -22, 22, 4);

  // Tiny head — barely a head, all torso
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-16, -46, 32, 20);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, -36, 3);

  // Massive iron fist (right arm)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(70, -8, 22, 50);
  g.fillStyle(COLORS.steel);
  g.fillRect(60, 38, 44, 32);
  // Knuckle plates
  g.fillStyle(COLORS.brassDim);
  for (const sx of [64, 78, 92]) g.fillRect(sx, 44, 8, 6);

  // Smaller left arm
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-92, -8, 22, 50);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-96, 42, 30, 14);

  // Rivets
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-40, -10], [40, -10], [-40, 28], [40, 28], [0, 8]
  ]) g.fillCircle(rx, ry, 3);

  c.add(g);

  // Slow heavy sway
  scene.tweens.add({
    targets: c,
    x: x + 2,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// Mist Specter — Act 3 mook. Tall slender ghost with no legs (lower
// body trails into mist), pale visor with two cyan eyes, wispy
// trailing tendrils. Reads as "ghost — touch at your own risk."
export function drawMistSpecter(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 10);
  const g = scene.add.graphics();

  // Trailing mist body (no legs)
  g.fillStyle(0x4a4a6a, 0.45);
  g.fillTriangle(-30, 10, 30, 10, 0, 100);
  g.fillStyle(0x6a6a8a, 0.6);
  g.fillTriangle(-22, 24, 22, 24, 0, 90);
  // Wispy tendrils at the bottom
  g.fillStyle(0x4a4a6a, 0.35);
  for (let i = 0; i < 5; i++) {
    const tx = -24 + i * 12;
    g.fillTriangle(tx, 86, tx + 8, 86, tx + 4, 110);
  }

  // Narrow torso
  g.fillStyle(0x3a3a5a);
  g.fillRect(-22, -28, 44, 50);
  g.fillStyle(0x5a5a7a);
  g.fillRect(-18, -22, 36, 6);
  g.fillRect(-18, 14, 36, 4);

  // Head/hood
  g.fillStyle(0x2a2a4a);
  g.fillTriangle(-22, -44, 22, -44, 0, -68);
  g.fillRect(-22, -44, 44, 18);

  // Glowing eyes — cyan
  g.fillStyle(COLORS.steam);
  g.fillCircle(-8, -36, 3);
  g.fillCircle(8, -36, 3);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(-8, -36, 1.5);
  g.fillCircle(8, -36, 1.5);

  // Floating wisp-arms (just blobs, no solid arms)
  g.fillStyle(0x6a6a8a, 0.55);
  g.fillCircle(-34, -10, 8);
  g.fillCircle(34, -10, 8);
  g.fillStyle(0x4a4a6a, 0.4);
  g.fillCircle(-42, 6, 5);
  g.fillCircle(42, 6, 5);

  // Floating wisps around the head
  g.fillStyle(COLORS.steam, 0.3);
  g.fillCircle(-26, -56, 3);
  g.fillCircle(28, -50, 3);
  g.fillCircle(-12, -72, 2);

  c.add(g);

  // Slow ethereal float (vertical bob)
  scene.tweens.add({
    targets: c,
    y: c.y - 4,
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// Cloud Corsair — Act 3 mook. Sky-pirate variant: smaller and meaner
// than Sky Pirate, with a hook arm and a powder-bag for tossing
// curses. Tricorne hat sells the pirate read; gold sash + lit fuse
// say "this one carries explosives."
export function drawCloudCorsair(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Legs — booted
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-32, 36, 18, 50);
  g.fillRect(14, 36, 18, 50);
  g.fillStyle(0x3a2718);
  g.fillRect(-36, 82, 26, 12);
  g.fillRect(10, 82, 26, 12);

  // Coat-torso — long with brass buttons
  g.fillStyle(0x5a3018);
  g.fillRect(-38, -22, 76, 64);
  g.fillStyle(0x7a4028);
  g.fillRect(-32, -16, 64, 8);
  // Brass buttons
  g.fillStyle(COLORS.brass);
  for (const by of [-4, 8, 20]) g.fillCircle(0, by, 2.5);

  // Gold sash
  g.fillStyle(COLORS.brass);
  g.fillRect(-38, 26, 76, 6);

  // Head
  g.fillStyle(COLORS.bone);
  g.fillRect(-16, -42, 32, 20);
  // Eye band
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-16, -34, 32, 4);
  g.fillStyle(COLORS.danger);
  g.fillCircle(-8, -32, 1.5);
  g.fillCircle(8, -32, 1.5);
  // Mouth
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-6, -26, 12, 2);

  // Tricorne hat
  g.fillStyle(0x1a1410);
  g.fillTriangle(-30, -42, 30, -42, 0, -64);
  g.fillRect(-32, -44, 64, 6);
  // Hat band
  g.fillStyle(COLORS.brass);
  g.fillRect(-30, -42, 60, 2);

  // Hook arm (left) — silver hook
  g.fillStyle(0x5a3018);
  g.fillRect(-54, -10, 16, 40);
  g.fillStyle(COLORS.bone);
  // Hook curve approximated
  g.fillRect(-52, 30, 12, 4);
  g.fillTriangle(-52, 34, -40, 34, -46, 46);
  g.fillTriangle(-52, 34, -64, 40, -54, 50);

  // Powder-bag arm (right) — grenade with lit fuse
  g.fillStyle(0x5a3018);
  g.fillRect(38, -10, 16, 36);
  g.fillStyle(COLORS.steelDark);
  g.fillCircle(56, 32, 9);
  // Fuse + ember
  g.lineStyle(2, COLORS.boneDim, 0.9);
  g.beginPath();
  g.moveTo(56, 24); g.lineTo(60, 18); g.lineTo(58, 12);
  g.strokePath();
  g.fillStyle(COLORS.danger);
  g.fillCircle(58, 10, 3);
  g.fillStyle(0xffa030);
  g.fillCircle(58, 10, 1.5);

  c.add(g);

  // Light shifty hover
  scene.tweens.add({
    targets: c,
    y: c.y - 3,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// Reclaimer Prime — Act 1 #3. Spike-clad bipedal: silhouette reads
// "do not touch." Bulkier than Iron Reclaimer with prominent spike
// pauldrons and a row of front-facing thorns down the torso.
export function drawReclaimerPrime(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 8);
  const g = scene.add.graphics();

  // Legs — wide stance
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-58, 64, 36, 80);
  g.fillRect(22, 64, 36, 80);
  g.fillStyle(COLORS.steel);
  g.fillRect(-64, 138, 48, 22);
  g.fillRect(16, 138, 48, 22);

  // Knee spikes
  g.fillStyle(COLORS.bone);
  g.fillTriangle(-40, 100, -32, 100, -36, 86);
  g.fillTriangle(40, 100, 48, 100, 44, 86);

  // Torso — wide and angled
  g.fillStyle(COLORS.rust);
  g.fillRect(-78, -38, 156, 108);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-70, -30, 140, 14);
  g.fillRect(-70, 54, 140, 12);

  // Front thorn row — three big forward-facing spikes down the torso
  g.fillStyle(COLORS.boneDim);
  g.fillTriangle(-28, 4, -12, 4, -20, -16);
  g.fillTriangle(-8, 22, 8, 22, 0, 2);
  g.fillTriangle(12, 4, 28, 4, 20, -16);
  g.fillStyle(COLORS.bone);
  g.fillTriangle(-26, 2, -14, 2, -20, -12);
  g.fillTriangle(-6, 20, 6, 20, 0, 4);
  g.fillTriangle(14, 2, 26, 2, 20, -12);

  // Spike-pauldrons — radial spikes on each shoulder
  g.fillStyle(COLORS.steelDark);
  g.fillCircle(-72, -22, 20);
  g.fillCircle(72, -22, 20);
  g.fillStyle(COLORS.boneDim);
  // Left pauldron spikes
  g.fillTriangle(-92, -22, -84, -10, -84, -34);
  g.fillTriangle(-72, -46, -64, -36, -80, -36);
  g.fillTriangle(-52, -22, -60, -10, -60, -34);
  // Right pauldron spikes
  g.fillTriangle(92, -22, 84, -10, 84, -34);
  g.fillTriangle(72, -46, 64, -36, 80, -36);
  g.fillTriangle(52, -22, 60, -10, 60, -34);

  // Head — small, slit visor, red eye
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-22, -68, 44, 28);
  g.fillStyle(COLORS.danger);
  g.fillRect(-14, -58, 28, 4);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-22, -72, 44, 4);

  // Arms — chunky with spike-knuckle gauntlets
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-104, -10, 22, 70);
  g.fillRect(82, -10, 22, 70);
  g.fillStyle(COLORS.steel);
  g.fillRect(-110, 56, 34, 24); // left fist
  g.fillRect(76, 56, 34, 24);   // right fist
  // Knuckle spikes
  g.fillStyle(COLORS.bone);
  for (const sx of [-104, -94, -84]) g.fillTriangle(sx, 56, sx + 6, 56, sx + 3, 46);
  for (const sx of [82, 92, 102]) g.fillTriangle(sx, 56, sx + 6, 56, sx + 3, 46);

  // Rivets
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-60, -22], [60, -22], [-60, 50], [60, 50]
  ]) g.fillCircle(rx, ry, 3);

  c.add(g);

  // Slow menacing breath
  scene.tweens.add({
    targets: c,
    y: c.y + 4,
    duration: 1300,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut'
  });

  return c;
}

// Vault Warden — Act 2 #3. Squat armored vault on stubby legs: a sealed
// blast-door chest with a glowing toxic-green hatch in the center.
// Reads as "the safe is the boss," and the hatch is where Slag erupts.
export function drawVaultWarden(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 4);
  const g = scene.add.graphics();

  // Stubby tracked base
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-96, 80, 192, 44);
  g.fillStyle(COLORS.steel);
  for (let i = 0; i < 10; i++) {
    g.fillRect(-92 + i * 20, 108, 14, 12);
  }
  g.fillStyle(COLORS.brassDim);
  for (const wx of [-70, -28, 14, 56]) {
    g.fillCircle(wx, 102, 7);
  }

  // Vault-door torso — wide armored block
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-100, -54, 200, 138);
  g.fillStyle(COLORS.steel);
  g.fillRect(-92, -46, 184, 124);
  // Border bevels
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-92, -46, 184, 8);
  g.fillRect(-92, 70, 184, 8);
  g.fillRect(-92, -46, 8, 124);
  g.fillRect(84, -46, 8, 124);

  // Massive bolt rivets on the corners (like a vault door)
  g.fillStyle(COLORS.brass);
  for (const [rx, ry] of [
    [-74, -28], [74, -28], [-74, 56], [74, 56]
  ]) {
    g.fillCircle(rx, ry, 8);
    g.fillStyle(COLORS.brassDim);
    g.fillCircle(rx, ry, 4);
    g.fillStyle(COLORS.brass);
  }

  // Central round hatch — glowing toxic green (the Slag dispenser)
  g.fillStyle(COLORS.steelDark);
  g.fillCircle(0, 14, 44);
  g.fillStyle(0x3a5a2a);
  g.fillCircle(0, 14, 36);
  g.fillStyle(0x6b9b4f); // toxic green
  g.fillCircle(0, 14, 28);
  g.fillStyle(0xb5d97a);
  g.fillCircle(-4, 10, 12);
  // Slag drip from the bottom of the hatch
  g.fillStyle(0x6b9b4f, 0.7);
  g.fillTriangle(-8, 42, 8, 42, 0, 58);
  g.fillCircle(0, 56, 4);

  // Hatch wheel — radial spokes
  g.lineStyle(4, COLORS.brass, 0.9);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.beginPath();
    g.moveTo(0, 14);
    g.lineTo(Math.cos(a) * 38, 14 + Math.sin(a) * 38);
    g.strokePath();
  }
  g.fillStyle(COLORS.brass);
  g.fillCircle(0, 14, 6);

  // Top sensor strip with twin red lenses
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-50, -70, 100, 18);
  g.fillStyle(COLORS.danger);
  g.fillCircle(-26, -61, 5);
  g.fillCircle(26, -61, 5);

  // Side smokestacks (short and stout)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-94, -86, 14, 38);
  g.fillRect(80, -86, 14, 38);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-96, -90, 18, 6);
  g.fillRect(78, -90, 18, 6);
  g.fillStyle(COLORS.boneDim, 0.45);
  g.fillCircle(-86, -104, 6);
  g.fillCircle(86, -104, 6);

  c.add(g);

  // Pulsing toxic hatch glow
  const glow = scene.add.circle(0, 14, 30, 0x6b9b4f, 0.4);
  c.add(glow);
  scene.tweens.add({
    targets: glow,
    scale: 1.4,
    alpha: 0,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.Out'
  });

  return c;
}

// Cyclone King — Act 3 #3. Tall crowned figure split visually between
// the two stances: dark iron right half, lighter storm-blue left half
// with a swirling halo above. Twin great weapons — a heavy mace (iron)
// and a bladed wind-fan (tempest). The vertical split sells the
// alternating-stance mechanic at a glance.
export function drawCycloneKing(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y - 16);
  const g = scene.add.graphics();

  // Long royal skirt (no visible legs) — split colors
  g.fillStyle(COLORS.shield);
  g.fillTriangle(-70, 30, 0, 30, -10, 170);
  g.fillStyle(COLORS.steelDark);
  g.fillTriangle(0, 30, 70, 30, 10, 170);
  // Brass hem along bottom
  g.fillStyle(COLORS.brass);
  g.fillRect(-22, 158, 44, 8);

  // Torso — vertically halved
  g.fillStyle(COLORS.shield);
  g.fillRect(-50, -40, 50, 80);  // tempest half
  g.fillStyle(COLORS.steelDark);
  g.fillRect(0, -40, 50, 80);    // iron half
  // Center divider strip
  g.fillStyle(COLORS.brass);
  g.fillRect(-3, -40, 6, 80);
  // Chest emblem — half steam, half danger
  g.fillStyle(COLORS.steam);
  g.fillTriangle(-22, -10, 0, -22, 0, 10);
  g.fillStyle(COLORS.danger);
  g.fillTriangle(22, -10, 0, -22, 0, 10);

  // Pauldrons — wide, asymmetric (storm side feathered, iron side spiked)
  g.fillStyle(COLORS.shield);
  g.fillRect(-78, -46, 30, 24);
  g.fillStyle(COLORS.steam, 0.7);
  // Feather strips on tempest pauldron
  for (const sy of [-44, -38, -32]) g.fillRect(-92, sy, 18, 4);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(48, -46, 30, 24);
  // Spikes on iron pauldron
  g.fillStyle(COLORS.boneDim);
  for (const sx of [54, 64, 74]) g.fillTriangle(sx, -46, sx + 6, -46, sx + 3, -58);

  // Helm — crown with central tall spike
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-26, -78, 52, 32);
  g.fillStyle(COLORS.steel);
  g.fillRect(-22, -70, 44, 8); // visor band
  // Glowing eye slits — split colors matching halves
  g.fillStyle(COLORS.steam);
  g.fillRect(-16, -68, 10, 4);
  g.fillStyle(COLORS.danger);
  g.fillRect(6, -68, 10, 4);
  // Crown spikes
  g.fillStyle(COLORS.brass);
  g.fillTriangle(-22, -78, -14, -78, -18, -94); // left point
  g.fillTriangle(-6, -78, 6, -78, 0, -110);     // center tall
  g.fillTriangle(14, -78, 22, -78, 18, -94);    // right point

  // Storm halo — arc of small blue wisps above the crown
  g.fillStyle(COLORS.shield, 0.55);
  for (const [hx, hy, hr] of [
    [-34, -118, 6], [-12, -126, 5], [10, -124, 5], [32, -116, 6]
  ] as [number, number, number][]) {
    g.fillCircle(hx, hy, hr);
  }

  // Left arm — wind-fan blade (tempest weapon)
  g.fillStyle(COLORS.shield);
  g.fillRect(-86, -18, 18, 60);
  g.fillStyle(COLORS.steel);
  // Fan blades fan out from the wrist
  g.fillTriangle(-78, 42, -120, 26, -110, 70);
  g.fillTriangle(-78, 42, -130, 50, -106, 84);
  g.fillStyle(COLORS.steam, 0.5);
  g.fillTriangle(-78, 44, -118, 32, -108, 66);

  // Right arm — heavy mace (iron weapon)
  g.fillStyle(COLORS.steelDark);
  g.fillRect(68, -18, 18, 60);
  // Mace shaft + head
  g.fillStyle(COLORS.brassDim);
  g.fillRect(72, 42, 12, 40);
  g.fillStyle(COLORS.steel);
  g.fillRect(58, 70, 40, 28);
  // Mace spikes
  g.fillStyle(COLORS.boneDim);
  for (const sx of [60, 74, 88]) g.fillTriangle(sx, 70, sx + 6, 70, sx + 3, 60);
  for (const sx of [60, 74, 88]) g.fillTriangle(sx, 98, sx + 6, 98, sx + 3, 108);

  // Sash/belt
  g.fillStyle(COLORS.brass);
  g.fillRect(-50, 26, 100, 8);

  // Rivets
  g.fillStyle(COLORS.brassDim);
  for (const [rx, ry] of [
    [-40, -32], [40, -32], [-40, 28], [40, 28]
  ]) g.fillCircle(rx, ry, 3);

  c.add(g);

  // Halo wisps spin via container rotation? Use a small bob instead so
  // weapons stay readable.
  scene.tweens.add({
    targets: c,
    y: c.y - 6,
    duration: 1500,
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
  foundryTyrant: drawFoundryTyrant,
  cinderHound: drawCinderHound,
  slagDrone: drawSlagDrone,
  forgeReaver: drawForgeReaver,
  magmaSentinel: drawMagmaSentinel,
  reclaimerMk2: drawReclaimerMk2,
  ironSovereign: drawIronSovereign,
  stratusDrone: drawStratusDrone,
  skyPirate: drawSkyPirate,
  lightningSprite: drawLightningSprite,
  cloudReaver: drawCloudReaver,
  skyMarshal: drawSkyMarshal,
  stormheart: drawStormheart,
  salvageColossus: drawSalvageColossus,
  pyroclastEngine: drawPyroclastEngine,
  theWraith: drawTheWraith,
  reclaimerPrime: drawReclaimerPrime,
  vaultWarden: drawVaultWarden,
  cycloneKing: drawCycloneKing,
  emberSpitter: drawEmberSpitter,
  pigIronBrute: drawPigIronBrute,
  mistSpecter: drawMistSpecter,
  cloudCorsair: drawCloudCorsair
};

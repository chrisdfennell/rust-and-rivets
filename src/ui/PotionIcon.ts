import Phaser from 'phaser';
import { COLORS } from './theme';

// Slice 58 — procedural vector potion icons.
//
// Each `drawX` function returns a Container holding pure Phaser.Graphics
// primitives, matching the game's existing "no asset files" aesthetic
// (mirrors the MechSprite pattern). All icons are designed at a natural
// size of roughly 22 × 28 px, centered on (0, 0). Callers set the
// container's scale to fit larger / smaller slots.
//
// Each potion shares the same flask silhouette (brass cap, glass body,
// brass base) so the family reads as a group; the CONTENTS layer is
// where each potion's identity lives. The flask color is fixed across
// the family; the contents color encodes the effect type.

export type PotionIconDraw = (
  scene: Phaser.Scene,
  x: number,
  y: number
) => Phaser.GameObjects.Container;

// Common flask silhouette. Draws the cap / glass body / base into the
// passed Graphics; the caller follows with content-specific shapes.
// Body interior is ~14×16 centered at (0, 4) — that's the canvas the
// contents-drawers paint into.
function drawFlask(g: Phaser.GameObjects.Graphics) {
  // Cap (top of vial)
  g.fillStyle(COLORS.brass);
  g.fillRect(-5, -16, 10, 4);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-6, -12, 12, 2);

  // Glass body interior (slightly darker than panel, sits behind contents)
  g.fillStyle(0x1a1410);
  g.fillRect(-7, -10, 14, 22);

  // Brass base / band
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-8, 10, 16, 3);
  g.fillStyle(COLORS.brass);
  g.fillRect(-7, 11, 14, 1);
}

// Final highlight pass — vertical glass shine on the left side. Drawn
// AFTER contents so it sits visually on top of the liquid color.
function drawFlaskHighlight(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0xffffff, 0.18);
  g.fillRect(-6, -8, 1.5, 16);
}

// ===== Per-potion content drawers =====

// Block Potion — blue shield emblem on plating-blue liquid.
function drawBlockIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  // Plating-blue liquid fill
  g.fillStyle(COLORS.shield);
  g.fillRect(-6, 0, 12, 10);
  // Shield emblem
  g.fillStyle(COLORS.bone);
  g.fillRect(-4, -2, 8, 4);
  g.fillTriangle(-4, 2, 4, 2, 0, 8);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Fire Potion — flickering flame on dark amber liquid.
function drawFireIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  // Dark red liquid base
  g.fillStyle(COLORS.danger);
  g.fillRect(-6, 2, 12, 8);
  // Layered flame
  g.fillStyle(0xffa030);
  g.fillTriangle(-5, 6, 5, 6, 0, -6);
  g.fillStyle(0xfff060);
  g.fillTriangle(-3, 6, 3, 6, 0, -2);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Swift Potion — three card silhouettes on a brass-dim base.
function drawSwiftIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-6, -4, 12, 14);
  // 3 overlapping mini-cards
  g.fillStyle(COLORS.bone);
  g.fillRect(-5, -3, 4, 8);
  g.fillStyle(COLORS.brass);
  g.fillRect(-2, -4, 4, 9);
  g.fillStyle(COLORS.bone);
  g.fillRect(1, -3, 4, 8);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Energy Potion — steam wisps on translucent teal liquid.
function drawEnergyIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(COLORS.steam, 0.6);
  g.fillRect(-6, 2, 12, 8);
  // 3 steam puffs rising
  g.fillStyle(COLORS.bone, 0.8);
  g.fillCircle(-3, 0, 2.5);
  g.fillCircle(2, -3, 3);
  g.fillCircle(-1, -7, 2);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Weak Potion — sickly green liquid with a skull suggestion.
function drawWeakIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(COLORS.buff); // muted green — poison
  g.fillRect(-6, 0, 12, 10);
  // Skull-ish: rounded head + two eye sockets + jaw notch
  g.fillStyle(COLORS.bone);
  g.fillCircle(0, 2, 4.5);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-2.5, 0, 1.5, 1.5);
  g.fillRect(1, 0, 1.5, 1.5);
  g.fillRect(-1, 4, 2, 2);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Vulnerable Potion — concentric target rings on rust-red liquid.
function drawVulnerableIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(COLORS.rust);
  g.fillRect(-6, 0, 12, 10);
  // Concentric target rings
  g.fillStyle(COLORS.bone);
  g.fillCircle(0, 4, 5);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, 4, 3.5);
  g.fillStyle(COLORS.bone);
  g.fillCircle(0, 4, 2);
  g.fillStyle(COLORS.danger);
  g.fillCircle(0, 4, 0.8);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Strength Potion — brass arm/dumbbell silhouette on rust liquid.
function drawStrengthIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(COLORS.rust);
  g.fillRect(-6, 0, 12, 10);
  // Dumbbell: two blocks + bar
  g.fillStyle(COLORS.brass);
  g.fillRect(-5, 2, 2.5, 6);
  g.fillRect(2.5, 2, 2.5, 6);
  g.fillRect(-3, 4, 6, 2);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Repair Potion — wrench on healing-green liquid.
function drawRepairIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(COLORS.ok);
  g.fillRect(-6, 0, 12, 10);
  // Wrench: handle + open jaw
  g.fillStyle(COLORS.bone);
  g.fillRect(-1, -2, 2, 10);  // handle
  g.fillRect(-3, 6, 6, 3);    // crossbar
  g.fillRect(-3, -2, 1.5, 3); // jaw left
  g.fillRect(1.5, -2, 1.5, 3); // jaw right
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Cinder Potion — glowing coals on dark liquid.
function drawCinderIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(0x2a1410);
  g.fillRect(-6, 0, 12, 10);
  // Glowing embers
  g.fillStyle(COLORS.danger);
  g.fillCircle(-3, 6, 1.5);
  g.fillCircle(3, 4, 2);
  g.fillCircle(0, 8, 1.5);
  g.fillStyle(0xffa030);
  g.fillCircle(-3, 6, 0.8);
  g.fillCircle(3, 4, 1);
  g.fillCircle(0, 8, 0.8);
  g.fillStyle(0xfff060, 0.6);
  g.fillCircle(3, 4, 0.5);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Spike Potion — radiating thorns on bone-colored liquid.
function drawSpikeIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(COLORS.boneDim);
  g.fillRect(-6, 0, 12, 10);
  // 4 spikes radiating from center
  g.fillStyle(COLORS.bone);
  g.fillTriangle(-1, 5, 1, 5, 0, -1); // up
  g.fillTriangle(-1, 5, 1, 5, 0, 11); // down
  g.fillTriangle(-3, 4, -3, 6, -7, 5); // left  (drawn behind glass; clips at flask edge)
  g.fillTriangle(3, 4, 3, 6, 7, 5);    // right
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Bracer Potion — riveted bracer band on dark brass liquid.
function drawBracerIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(COLORS.brassDim);
  g.fillRect(-6, 0, 12, 10);
  // Bracer band — horizontal strip with rivet line
  g.fillStyle(COLORS.brass);
  g.fillRect(-5, 2, 10, 5);
  g.fillStyle(COLORS.steelDark);
  g.fillRect(-5, 4, 10, 1);
  g.fillStyle(COLORS.bone);
  g.fillCircle(-3, 4.5, 0.7);
  g.fillCircle(0, 4.5, 0.7);
  g.fillCircle(3, 4.5, 0.7);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Surge Potion — lightning bolt on bright yellow liquid (rare tier).
function drawSurgeIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFlask(g);
  g.fillStyle(0xfff060);
  g.fillRect(-6, 0, 12, 10);
  // Lightning bolt — angular zig-zag
  g.fillStyle(COLORS.brass);
  g.fillTriangle(1, -2, 3, -2, -1, 4);
  g.fillTriangle(-1, 4, 2, 4, -3, 10);
  g.fillStyle(COLORS.danger);
  g.fillTriangle(2, 0, 2.5, 0, 0, 4);
  drawFlaskHighlight(g);
  c.add(g);
  return c;
}

// Registry mirrors potion ids in src/game/potions.ts. Callers that
// need a fallback can default to `drawBlockIcon` (it's the most
// recognizable shape) or just skip drawing if the id isn't found.
export const POTION_ICONS: Record<string, PotionIconDraw> = {
  blockPotion:       drawBlockIcon,
  firePotion:        drawFireIcon,
  swiftPotion:       drawSwiftIcon,
  energyPotion:      drawEnergyIcon,
  weakPotion:        drawWeakIcon,
  vulnerablePotion:  drawVulnerableIcon,
  strengthPotion:    drawStrengthIcon,
  regenPotion:       drawRepairIcon,
  cinderPotion:      drawCinderIcon,
  spikePotion:       drawSpikeIcon,
  bracerPotion:      drawBracerIcon,
  surgePotion:       drawSurgeIcon
};

// Convenience: draw an icon by potion id at (x, y) with an optional
// scale factor. Returns null if the id isn't registered.
export function drawPotionIcon(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  scale = 1
): Phaser.GameObjects.Container | null {
  const fn = POTION_ICONS[id];
  if (!fn) return null;
  const c = fn(scene, x, y);
  if (scale !== 1) c.setScale(scale);
  return c;
}

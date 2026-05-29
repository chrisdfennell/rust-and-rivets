export type NodeKind = 'combat' | 'elite' | 'shop' | 'rest' | 'event' | 'boss';

export interface MapNode {
  id: string;
  floor: number;
  col: number;
  kind: NodeKind;
  next: string[];
}

export interface MapData {
  floors: number;
  width: number;
  nodes: Map<string, MapNode>;
  entryNodeIds: string[];
  bossNodeId: string;
}

// 15-floor StS-style act layout. Floor 0 is the entry combat, floors 1..-3
// are the varied "interior," FLOORS-2 is the always-rest pre-boss room,
// and FLOORS-1 is the boss. Total walked nodes per run lands around 40
// once paths overlap. MapScene renders the map taller than the viewport
// and exposes scroll input so the player can pan to upcoming floors.
const FLOORS = 15;
const WIDTH = 5;
const PATHS = 7;

export function generateMap(rng: () => number = Math.random): MapData {
  const nodes = new Map<string, MapNode>();

  const ensure = (floor: number, col: number, kind: NodeKind): MapNode => {
    const id = `${floor}-${col}`;
    let n = nodes.get(id);
    if (!n) {
      n = { id, floor, col, kind, next: [] };
      nodes.set(id, n);
    }
    return n;
  };

  const connect = (a: MapNode, b: MapNode) => {
    if (!a.next.includes(b.id)) a.next.push(b.id);
  };

  const bossCol = Math.floor(WIDTH / 2);
  const boss = ensure(FLOORS - 1, bossCol, 'boss');

  // Walk paths bottom -> top
  for (let p = 0; p < PATHS; p++) {
    let col = Math.floor(rng() * WIDTH);
    let prev = ensure(0, col, 'combat');
    for (let f = 1; f < FLOORS - 1; f++) {
      const candidates = [col - 1, col, col + 1].filter((c) => c >= 0 && c < WIDTH);
      col = candidates[Math.floor(rng() * candidates.length)];
      const next = ensure(f, col, 'combat');
      connect(prev, next);
      prev = next;
    }
    connect(prev, boss);
  }

  // Assign room kinds. The first three rows (floors 0–2) deliberately
  // have NO shops or rests — players have no scrap to spend and no
  // damage to heal that early, so those nodes would just be wasted real
  // estate. Pre-boss floor (FLOORS-2) is always rest. Boss floor is boss.
  //
  // Floor 0:       entry combat (no roll).
  // Floor 1:       combat / event only — smooth opener.
  // Floor 2:       elite allowed, no shop/rest yet.
  // Floors 3..-3: full mix (elite / shop / rest / event / combat).
  for (const node of nodes.values()) {
    if (node.kind === 'boss') continue;
    if (node.floor === 0) continue;
    if (node.floor === FLOORS - 2) {
      node.kind = 'rest';
      continue;
    }
    const roll = rng();
    if (node.floor === 1) {
      if (roll < 0.25) node.kind = 'event';
      else node.kind = 'combat';
    } else if (node.floor === 2) {
      if (roll < 0.14) node.kind = 'elite';
      else if (roll < 0.34) node.kind = 'event';
      else node.kind = 'combat';
    } else {
      // Mid-floor weights: 14% elite / 14% shop / 17% rest / 14% event /
      // 41% combat. Rest got a small bump (14% → 17%) when the map grew
      // to 15 floors so players see slightly more healing opportunities
      // across the longer climb.
      if (roll < 0.14) node.kind = 'elite';
      else if (roll < 0.28) node.kind = 'shop';
      else if (roll < 0.45) node.kind = 'rest';
      else if (roll < 0.59) node.kind = 'event';
      else node.kind = 'combat';
    }
  }

  const entryNodeIds = Array.from(nodes.values())
    .filter((n) => n.floor === 0)
    .map((n) => n.id)
    .sort();

  return {
    floors: FLOORS,
    width: WIDTH,
    nodes,
    entryNodeIds,
    bossNodeId: boss.id
  };
}

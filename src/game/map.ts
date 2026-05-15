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

const FLOORS = 7;
const WIDTH = 5;
const PATHS = 6;

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

  // Assign room kinds. Floor 0 = combat (entries). Pre-boss floor = rest.
  // Floor 1 = combat-heavy. Floors 2..FLOORS-3 = full mix with elites.
  for (const node of nodes.values()) {
    if (node.kind === 'boss') continue;
    if (node.floor === 0) continue;
    if (node.floor === FLOORS - 2) {
      node.kind = 'rest';
      continue;
    }
    const roll = rng();
    if (node.floor === 1) {
      // Smoother opening: no elites here
      if (roll < 0.12) node.kind = 'shop';
      else if (roll < 0.24) node.kind = 'rest';
      else if (roll < 0.36) node.kind = 'event';
      else node.kind = 'combat';
    } else {
      if (roll < 0.14) node.kind = 'elite';
      else if (roll < 0.28) node.kind = 'shop';
      else if (roll < 0.42) node.kind = 'rest';
      else if (roll < 0.56) node.kind = 'event';
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

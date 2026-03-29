import { buildSolidRects } from './levelLoader.js';

function decorate(items, extra = {}) {
  return items.map((item, index) => ({ ...item, collected: false, removed: false, baseY: item.y, phase: index * 0.9, ...extra }));
}

export function buildWorldRuntime(level) {
  const baseSolidRects = buildSolidRects(level.solids);
  const doors = level.doors.map((door) => ({
    ...door,
    removed: false,
    solidRects: buildSolidRects(door.solids),
  }));

  return {
    baseSolidRects,
    activeSolidRects: [...baseSolidRects, ...doors.flatMap((door) => door.solidRects)],
    stars: decorate(level.stars),
    keys: decorate(level.keys),
    hearts: decorate(level.hearts),
    jumpBoots: decorate(level.jumpBoots),
    lava: level.lava.map((lava) => ({ ...lava })),
    doors,
  };
}

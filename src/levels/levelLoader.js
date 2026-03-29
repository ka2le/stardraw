import { gameConfig, semanticColorRoles } from '../config/gameConfig.js';

const toHex = (r, g, b) =>
  `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

function indexFor(width, x, y) {
  return y * width + x;
}

function toWorldPosition(height, region, tileSize) {
  return {
    x: (region.centerX + 0.5) * tileSize,
    y: (height - region.centerY - 0.5) * tileSize,
  };
}

function toWorldBounds(region, height, tileSize) {
  return {
    minX: region.minX * tileSize,
    minY: (height - region.maxY - 1) * tileSize,
    maxX: (region.maxX + 1) * tileSize,
    maxY: (height - region.minY) * tileSize,
  };
}

function floodRegion(grid, width, height, startX, startY, targetHex, visited) {
  const queue = [[startX, startY]];
  visited.add(indexFor(width, startX, startY));
  const pixels = [];
  let sumX = 0;
  let sumY = 0;
  let minX = startX;
  let minY = startY;
  let maxX = startX;
  let maxY = startY;

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    pixels.push({ x, y });
    sumX += x;
    sumY += y;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;

    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const idx = indexFor(width, nx, ny);
      if (visited.has(idx) || grid[idx] !== targetHex) continue;
      visited.add(idx);
      queue.push([nx, ny]);
    }
  }

  return { color: targetHex, pixels, minX, minY, maxX, maxY, size: pixels.length, centerX: sumX / pixels.length, centerY: sumY / pixels.length };
}

function collectRegions(grid, width, height, targetHex) {
  const visited = new Set();
  const regions = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexFor(width, x, y);
      if (visited.has(idx) || grid[idx] !== targetHex) continue;
      regions.push(floodRegion(grid, width, height, x, y, targetHex, visited));
    }
  }
  return regions;
}

function buildColorGrid(imageData) {
  const { width, height, data } = imageData;
  const grid = new Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4;
      const alpha = data[pixelIndex + 3];
      grid[indexFor(width, x, y)] = alpha === 0 ? semanticColorRoles.empty : toHex(data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]);
    }
  }
  return grid;
}

function whitenRegions(grid, width, regions, emptyColor) {
  for (const region of regions) {
    for (const pixel of region.pixels) {
      grid[indexFor(width, pixel.x, pixel.y)] = emptyColor;
    }
  }
}

function regionToEntity(prefix, region, index, height, config, extra = {}) {
  return {
    id: `${prefix}-${index}`,
    ...toWorldPosition(height, region, config.tileSize),
    bounds: toWorldBounds(region, height, config.tileSize),
    ...extra,
  };
}

export function parseImageDataToLevel(imageData, config = gameConfig) {
  const { width, height } = imageData;
  const grid = buildColorGrid(imageData);

  const playerRegions = collectRegions(grid, width, height, config.player.startColor);
  const goalRegions = collectRegions(grid, width, height, config.goal.color);
  const starRegions = collectRegions(grid, width, height, config.star.color);
  const keyRegions = collectRegions(grid, width, height, config.key.color);
  const lavaRegions = collectRegions(grid, width, height, config.lava.color);
  const doorRegions = collectRegions(grid, width, height, config.door.color);
  const heartRegions = collectRegions(grid, width, height, config.heart.color);
  const jumpBootsRegions = collectRegions(grid, width, height, config.jumpBoots.color);

  if (playerRegions.length !== 1) throw new Error(`Level must contain exactly one connected player start area. Found ${playerRegions.length}.`);
  if (goalRegions.length !== 1) throw new Error(`Level must contain exactly one connected goal area. Found ${goalRegions.length}.`);

  for (const regions of [playerRegions, goalRegions, starRegions, keyRegions, lavaRegions, doorRegions, heartRegions, jumpBootsRegions]) {
    whitenRegions(grid, width, regions, config.world.emptyColor);
  }

  const solids = [];
  const unknownColors = new Map();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const hex = grid[indexFor(width, x, y)];
      const worldY = (height - y - 1) * config.tileSize;
      const worldX = x * config.tileSize;
      if (hex === config.world.emptyColor) continue;
      if (hex === config.tiles.solidColor) solids.push({ x: worldX, y: worldY, size: config.tileSize });
      else unknownColors.set(hex, (unknownColors.get(hex) || 0) + 1);
    }
  }

  const start = toWorldPosition(height, playerRegions[0], config.tileSize);
  const goal = toWorldPosition(height, goalRegions[0], config.tileSize);
  const stars = starRegions.map((region, index) => regionToEntity('star', region, index, height, config));
  const keys = keyRegions.map((region, index) => regionToEntity('key', region, index, height, config));
  const lava = lavaRegions.map((region, index) => regionToEntity('lava', region, index, height, config));
  const hearts = heartRegions.map((region, index) => regionToEntity('heart', region, index, height, config));
  const jumpBoots = jumpBootsRegions.map((region, index) => regionToEntity('jump-boots', region, index, height, config));
  const doors = doorRegions.map((region, index) => ({
    ...regionToEntity('door', region, index, height, config),
    solids: region.pixels.map((pixel) => ({ x: pixel.x * config.tileSize, y: (height - pixel.y - 1) * config.tileSize, size: config.tileSize })),
  }));

  return {
    width,
    height,
    solids,
    stars,
    keys,
    lava,
    doors,
    hearts,
    jumpBoots,
    start,
    goal,
    regions: { player: playerRegions, goal: goalRegions, stars: starRegions, keys: keyRegions, lava: lavaRegions, doors: doorRegions, hearts: heartRegions, jumpBoots: jumpBootsRegions },
    bounds: { minX: 0, minY: 0, maxX: width * config.tileSize, maxY: height * config.tileSize, width: width * config.tileSize, height: height * config.tileSize },
    unknownColors: [...unknownColors.entries()].map(([hex, count]) => ({ hex, count })),
  };
}

export function buildSolidRects(solids, tileSize = gameConfig.tileSize) {
  const byRow = new Map();
  for (const tile of solids) {
    const rowKey = tile.y.toFixed(6);
    const row = byRow.get(rowKey) || { y: tile.y, xs: [] };
    row.xs.push(tile.x);
    byRow.set(rowKey, row);
  }
  const horizontalRuns = [];
  for (const { y, xs } of byRow.values()) {
    xs.sort((a, b) => a - b);
    let startX = xs[0];
    let prevX = xs[0];
    for (let index = 1; index <= xs.length; index += 1) {
      const current = xs[index];
      if (current !== undefined && Math.abs(current - (prevX + tileSize)) < tileSize * 0.1) {
        prevX = current;
        continue;
      }
      horizontalRuns.push({ x: startX, y, width: prevX - startX + tileSize, height: tileSize });
      startX = current;
      prevX = current;
    }
  }
  horizontalRuns.sort((a, b) => a.x - b.x || a.width - b.width || a.y - b.y);
  const merged = [];
  for (const run of horizontalRuns) {
    const previous = merged[merged.length - 1];
    if (previous && Math.abs(previous.x - run.x) < tileSize * 0.1 && Math.abs(previous.width - run.width) < tileSize * 0.1 && Math.abs(previous.y + previous.height - run.y) < tileSize * 0.1) previous.height += run.height;
    else merged.push({ ...run });
  }
  return merged;
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not decode selected image file.'));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsDataURL(file);
  });
}

export function getImageDataFromImage(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
}

export async function loadLevelFromImageUrl(url, cacheBust = true) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  const finalUrl = cacheBust ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error(`Could not load image level from ${url}`));
    image.src = finalUrl;
  });
  return parseImageDataToLevel(getImageDataFromImage(image));
}

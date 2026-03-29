import { gameConfig } from './game_config.js';

const toHex = (r, g, b) =>
  `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

export const colorRoles = {
  empty: gameConfig.world.emptyColor,
  solid: gameConfig.tiles.solidColor,
  playerStart: gameConfig.player.startColor,
  goal: gameConfig.goal.color,
  star: gameConfig.star.color,
};

export function parseImageDataToLevel(imageData, config = gameConfig) {
  const { width, height, data } = imageData;
  const solids = [];
  const stars = [];
  let start = null;
  let goal = null;
  const unknownColors = new Map();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4;
      const alpha = data[pixelIndex + 3];
      if (alpha === 0) continue;

      const hex = toHex(data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]);
      const worldY = height - y - 1;
      const worldX = x;

      switch (hex) {
        case config.world.emptyColor:
          break;
        case config.tiles.solidColor:
          solids.push({ x: worldX, y: worldY });
          break;
        case config.player.startColor:
          if (start) {
            throw new Error(`Level has multiple player start points. Found another at (${x}, ${y}).`);
          }
          start = { x: worldX + 0.5, y: worldY + 0.5 };
          break;
        case config.goal.color:
          if (goal) {
            throw new Error(`Level has multiple goals. Found another at (${x}, ${y}).`);
          }
          goal = { x: worldX + 0.5, y: worldY + 0.5 };
          break;
        case config.star.color:
          stars.push({ id: `star-${x}-${y}`, x: worldX + 0.5, y: worldY + 0.5 });
          break;
        default:
          unknownColors.set(hex, (unknownColors.get(hex) || 0) + 1);
          break;
      }
    }
  }

  if (!start) throw new Error('Level is missing a player start pixel.');
  if (!goal) throw new Error('Level is missing a goal pixel.');

  const bounds = {
    minX: 0,
    minY: 0,
    maxX: width,
    maxY: height,
    width,
    height,
  };

  return {
    width,
    height,
    solids,
    stars,
    start,
    goal,
    bounds,
    unknownColors: [...unknownColors.entries()].map(([hex, count]) => ({ hex, count })),
  };
}

export function buildSolidRects(solids) {
  const byRow = new Map();
  for (const tile of solids) {
    const row = byRow.get(tile.y) || [];
    row.push(tile.x);
    byRow.set(tile.y, row);
  }

  const horizontalRuns = [];
  for (const [y, xs] of byRow.entries()) {
    xs.sort((a, b) => a - b);
    let startX = xs[0];
    let prevX = xs[0];

    for (let index = 1; index <= xs.length; index += 1) {
      const current = xs[index];
      if (current === prevX + 1) {
        prevX = current;
        continue;
      }

      horizontalRuns.push({ x: startX, y, width: prevX - startX + 1, height: 1 });
      startX = current;
      prevX = current;
    }
  }

  horizontalRuns.sort((a, b) => a.x - b.x || a.width - b.width || a.y - b.y);

  const merged = [];
  for (const run of horizontalRuns) {
    const previous = merged[merged.length - 1];
    if (
      previous &&
      previous.x === run.x &&
      previous.width === run.width &&
      previous.y === run.y - previous.height
    ) {
      previous.height += 1;
    } else {
      merged.push({ ...run });
    }
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

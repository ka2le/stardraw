import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSolidRects, parseImageDataToLevel } from '../src/levelLoader.js';
import { gameConfig } from '../src/game_config.js';

function makeImageData(width, height, pixels) {
  const data = new Uint8ClampedArray(width * height * 4);

  const colors = {
    white: [255, 255, 255, 255],
    black: [0, 0, 0, 255],
    blue: [63, 72, 204, 255],
    green: [34, 177, 76, 255],
    yellow: [255, 242, 0, 255],
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = pixels[y]?.[x] ?? 'white';
      const rgba = colors[key];
      const index = (y * width + x) * 4;
      data.set(rgba, index);
    }
  }

  return { width, height, data };
}

test('parseImageDataToLevel finds start, goal, stars, and solids', () => {
  const imageData = makeImageData(4, 3, [
    ['white', 'white', 'green', 'white'],
    ['white', 'yellow', 'white', 'white'],
    ['black', 'blue', 'black', 'black'],
  ]);

  const level = parseImageDataToLevel(imageData, gameConfig);

  assert.deepEqual(level.start, { x: 1.5, y: 0.5 });
  assert.deepEqual(level.goal, { x: 2.5, y: 2.5 });
  assert.equal(level.stars.length, 1);
  assert.equal(level.solids.length, 3);
});

test('parseImageDataToLevel rejects missing player start', () => {
  const imageData = makeImageData(2, 2, [
    ['white', 'green'],
    ['black', 'white'],
  ]);

  assert.throws(() => parseImageDataToLevel(imageData, gameConfig), /missing a player start/i);
});

test('parseImageDataToLevel rejects missing goal', () => {
  const imageData = makeImageData(2, 2, [
    ['white', 'blue'],
    ['black', 'white'],
  ]);

  assert.throws(() => parseImageDataToLevel(imageData, gameConfig), /missing a goal/i);
});

test('parseImageDataToLevel reports unknown colors without failing', () => {
  const data = makeImageData(2, 2, [
    ['blue', 'green'],
    ['white', 'white'],
  ]);
  data.data.set([255, 0, 255, 255], 8);

  const level = parseImageDataToLevel(data, gameConfig);
  assert.deepEqual(level.unknownColors, [{ hex: '#FF00FF', count: 1 }]);
});

test('buildSolidRects merges runs into larger rectangles', () => {
  const rects = buildSolidRects([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 3, y: 1 },
  ]);

  assert.deepEqual(rects, [
    { x: 0, y: 0, width: 2, height: 2 },
    { x: 3, y: 1, width: 1, height: 1 },
  ]);
});

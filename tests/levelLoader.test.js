import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSolidRects, parseImageDataToLevel } from '../src/levels/levelLoader.js';
import { gameConfig } from '../src/config/gameConfig.js';

function makeImageData(width, height, pixels) {
  const data = new Uint8ClampedArray(width * height * 4);
  const colors = {
    white: [255, 255, 255, 255], black: [0, 0, 0, 255], blue: [63, 72, 204, 255], green: [34, 177, 76, 255], yellow: [255, 242, 0, 255],
    gray: [128, 128, 128, 255], lava: [136, 0, 21, 255], brown: [185, 122, 87, 255], red: [255, 0, 0, 255], boots: [153, 217, 234, 255], magenta: [255, 0, 255, 255],
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

test('parseImageDataToLevel finds connected spawn, goal, star regions and solids', () => {
  const imageData = makeImageData(5, 4, [ ['white','green','green','white','white'], ['white','yellow','yellow','white','white'], ['white','blue','blue','white','white'], ['black','black','black','black','black'] ]);
  const level = parseImageDataToLevel(imageData, gameConfig);
  assert.equal(level.stars.length, 1); assert.equal(level.solids.length, 5);
  assert.deepEqual(level.start, { x: (1.5 + 0.5) * gameConfig.tileSize, y: 1.5 * gameConfig.tileSize });
  assert.deepEqual(level.goal, { x: (1.5 + 0.5) * gameConfig.tileSize, y: 3.5 * gameConfig.tileSize });
});

test('parseImageDataToLevel extracts new semantic region types', () => {
  const imageData = makeImageData(8, 5, [ ['green','green','gray','white','lava','brown','brown','red'], ['white','white','gray','white','lava','brown','white','red'], ['blue','blue','white','yellow','white','white','white','boots'], ['white','white','white','yellow','white','black','black','black'], ['black','black','black','black','black','black','black','black'] ]);
  const level = parseImageDataToLevel(imageData, gameConfig);
  assert.equal(level.keys.length, 1); assert.equal(level.lava.length, 1); assert.equal(level.doors.length, 1); assert.equal(level.hearts.length, 1); assert.equal(level.jumpBoots.length, 1);
  assert.equal(level.unknownColors.length, 0);
});

test('parseImageDataToLevel splits disconnected door regions', () => {
  const imageData = makeImageData(6, 4, [ ['green','green','brown','white','brown','white'], ['white','white','brown','white','brown','white'], ['blue','blue','white','white','white','white'], ['black','black','black','black','black','black'] ]);
  const level = parseImageDataToLevel(imageData, gameConfig);
  assert.equal(level.doors.length, 2);
});

test('parseImageDataToLevel rejects multiple disconnected player start regions', () => {
  const imageData = makeImageData(4, 3, [ ['green','white','blue','white'], ['white','white','white','white'], ['blue','black','black','black'] ]);
  assert.throws(() => parseImageDataToLevel(imageData, gameConfig), /exactly one connected player start area/i);
});

test('parseImageDataToLevel rejects missing goal region', () => {
  const imageData = makeImageData(3, 3, [ ['white','white','white'], ['white','blue','blue'], ['black','black','black'] ]);
  assert.throws(() => parseImageDataToLevel(imageData, gameConfig), /exactly one connected goal area/i);
});

test('parseImageDataToLevel reports unknown colors', () => {
  const imageData = makeImageData(3, 3, [ ['green','green','white'], ['blue','blue','magenta'], ['black','black','black'] ]);
  const level = parseImageDataToLevel(imageData, gameConfig);
  assert.deepEqual(level.unknownColors, [{ hex: '#FF00FF', count: 1 }]);
});

test('buildSolidRects merges runs into larger rectangles', () => {
  const s = gameConfig.tileSize;
  const rects = buildSolidRects([{ x: 0 * s, y: 0 * s }, { x: 1 * s, y: 0 * s }, { x: 0 * s, y: 1 * s }, { x: 1 * s, y: 1 * s }, { x: 3 * s, y: 1 * s }], s);
  assert.deepEqual(rects, [{ x: 0, y: 0, width: 2 * s, height: 2 * s }, { x: 3 * s, y: 1 * s, width: s, height: s }]);
});

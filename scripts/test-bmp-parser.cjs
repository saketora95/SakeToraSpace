const assert = require('node:assert/strict');
const { encodeBmp } = require('../assets/js/tools/ragnarok/bmp-parser.js');

function pixel(buffer, x, y) {
  const view = new DataView(buffer);
  const width = view.getInt32(18, true);
  const height = view.getInt32(22, true);
  const offset = 54 + (height - 1 - y) * Math.ceil(width * 3 / 4) * 4 + x * 3;
  return [view.getUint8(offset + 2), view.getUint8(offset + 1), view.getUint8(offset)];
}

// Compare every output pixel with an independent square-neighborhood oracle.
for (const [width, height] of [[13, 15], [1, 9], [9, 1]]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data.set([30, 60, 90, [0, 127, 128, 255][(i * 17 + Math.floor(i / width)) % 4]], i * 4);
  }
  const source = { width, height, data };
  const before = data.slice();
  for (const threshold of [0, 128, 255]) {
    for (let radius = 0; radius <= 5; radius++) {
      const { buffer } = encodeBmp(source, threshold, radius ? { width: radius, color: '#12aBcD' } : null);
      assert.equal(new DataView(buffer).getInt32(18, true), width);
      assert.equal(new DataView(buffer).getInt32(22, true), height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let expected = [255, 0, 255];
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height && data[((y + dy) * width + x + dx) * 4 + 3] >= threshold) expected = [18, 171, 205];
            }
          }
          if (data[(y * width + x) * 4 + 3] >= threshold) expected = [30, 60, 90];
          assert.deepEqual(pixel(buffer, x, y), expected);
        }
      }
    }
  }
  assert.deepEqual(data, before);
}

const empty = { width: 13, height: 13, data: new Uint8ClampedArray(13 * 13 * 4) };
assert.deepEqual(pixel(encodeBmp(empty, 128, { width: 5, color: '#000000' }).buffer, 6, 6), [255, 0, 255]);
empty.data.set([10, 20, 30, 255], (6 * 13 + 6) * 4);
for (let radius = 1; radius <= 5; radius++) {
  const { buffer } = encodeBmp(empty, 128, { width: radius, color: '#000000' });
  assert.deepEqual(pixel(buffer, 6 + radius, 6 + radius), [0, 0, 0]);
  assert.deepEqual(pixel(buffer, 7 + radius, 6), [255, 0, 255]);
  assert.deepEqual(pixel(buffer, 6, 6), [10, 20, 30]);
}
for (const color of ['#FF00FF', '#ff00ff', '#fF00Ff', '#xyzxyz']) {
  assert.throws(() => encodeBmp(empty, 128, { width: 1, color }));
}
for (const width of [0, 6, 1.5, NaN]) {
  assert.throws(() => encodeBmp(empty, 128, { width, color: '#000000' }));
}
console.log('BMP outline tests passed.');

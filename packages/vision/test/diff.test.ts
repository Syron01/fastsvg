import { test } from "node:test";
import assert from "node:assert/strict";
import { diffImages, compareSilhouettes, DiffError } from "../src/index.js";

function solid(size: number, rgb: [number, number, number], alpha = 255): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = alpha;
  }
  return data;
}

test("aynı görüntüler diff'sizdir", () => {
  const a = solid(4, [100, 100, 100]);
  const report = diffImages(a, a.slice(), 4, 4);
  assert.equal(report.changedPixels, 0);
  assert.equal(report.meanAbsError, 0);
  assert.equal(report.changedRegion, null);
});

test("küçük fark tolerans altında değişiklik sayılmaz", () => {
  const a = solid(4, [100, 100, 100]);
  const b = solid(4, [101, 100, 100]);
  const report = diffImages(a, b, 4, 4);
  assert.equal(report.changedPixels, 0);
  const reportStrict = diffImages(a, b, 4, 4, { channelTolerance: 0 });
  assert.equal(reportStrict.changedPixels, 16);
});

test("bölgesel değişim doğru bbox üretir", () => {
  const size = 10;
  const a = solid(size, [0, 0, 0]);
  const b = solid(size, [0, 0, 0]);
  // (3,4)'deki pikseli beyaza boya.
  b[(4 * size + 3) * 4] = 255;
  b[(4 * size + 3) * 4 + 1] = 255;
  b[(4 * size + 3) * 4 + 2] = 255;
  const report = diffImages(a, b, size, size);
  assert.equal(report.changedPixels, 1);
  assert.deepEqual(report.changedRegion, { minX: 3, minY: 4, maxX: 3, maxY: 4 });
});

test("boyut uyuşmazlığı DiffError verir", () => {
  assert.throws(() => diffImages(new Uint8Array(4), new Uint8Array(8), 1, 1), DiffError);
});

test("silüet IoU tam örtüşmede 1, hiç örtüşmede 0", () => {
  const size = 8;
  const full = solid(size, [0, 0, 0]);
  const empty = new Uint8Array(size * size * 4); // alpha 0
  const same = compareSilhouettes(full, full.slice(), size, size);
  assert.equal(same.iou, 1);
  const none = compareSilhouettes(full, empty, size, size);
  assert.equal(none.iou, 0);
  assert.equal(none.mismatchPixels, size * size);
  // İki yarım daire ~%50 örtüşür: 0 < IoU < 1.
  const halfA = new Uint8Array(size * size * 4);
  const halfB = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (x < 5) halfA[(y * size + x) * 4 + 3] = 255;
      if (x >= 3) halfB[(y * size + x) * 4 + 3] = 255;
    }
  }
  const partial = compareSilhouettes(halfA, halfB, size, size);
  assert.ok(partial.iou > 0 && partial.iou < 1, `IoU: ${partial.iou}`);
});

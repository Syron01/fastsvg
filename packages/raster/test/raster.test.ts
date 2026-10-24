import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createFramebuffer, blendPixel, fillRect, fillCircle, fillPolygon,
  fillPath, strokePolyline, flattenArc, FrameBufferError, MAX_DIMENSION,
} from "../src/index.js";

const RED: [number, number, number, number] = [255, 0, 0, 255];

test("framebuffer geçersiz boyutları reddeder", () => {
  assert.throws(() => createFramebuffer(0, 10), FrameBufferError);
  assert.throws(() => createFramebuffer(-1, 10), FrameBufferError);
  assert.throws(() => createFramebuffer(MAX_DIMENSION + 1, 1), FrameBufferError);
});

test("background ile oluşturma tüm pikselleri doldurur", () => {
  const fb = createFramebuffer(4, 4, [10, 20, 30, 255]);
  assert.equal(fb.data.length, 64);
  assert.equal(fb.data[0], 10);
  assert.equal(fb.data[63], 255);
});

test("blendPixel source-over alpha doğru hesaplar", () => {
  const fb = createFramebuffer(1, 1, [0, 0, 0, 255]);
  blendPixel(fb, 0, 0, [255, 255, 255, 128]);
  // %50 beyaz üstüne siyah: ~128 gri.
  assert.ok(Math.abs(fb.data[0]! - 128) <= 1, `gri: ${fb.data[0]}`);
  assert.equal(fb.data[3], 255);
});

test("fillRect sınırları içinde pikselleri doldurur", () => {
  const fb = createFramebuffer(10, 10);
  fillRect(fb, 2, 2, 4, 4, { color: RED });
  const at = (x: number, y: number): number => fb.data[(y * 10 + x) * 4]!;
  assert.equal(at(3, 3), 255);
  assert.equal(at(5, 5), 255);
  assert.equal(at(6, 6), 0); // dış
  assert.equal(at(1, 1), 0);
});

test("fillCircle alanı yaklaşık doğru kaplar", () => {
  const fb = createFramebuffer(32, 32);
  fillCircle(fb, 16, 16, 10, { color: RED });
  let count = 0;
  for (let i = 0; i < 32 * 32; i += 1) {
    if (fb.data[i * 4]! > 200) count += 1;
  }
  // π·10² ≈ 314; AA ile ±%15 tolerans.
  assert.ok(count > 260 && count < 370, `kaplanan piksel: ${count}`);
});

test("fillPolygon even-odd kuralı delik üretir", () => {
  const fb = createFramebuffer(10, 10);
  // Dış kare + ters yönlü iç kare: even-odd ile merkez delik.
  const square = (x: number, y: number, s: number) => [
    { x, y }, { x: x + s, y }, { x: x + s, y: y + s }, { x, y: y + s },
  ];
  const ring = [...square(1, 1, 8), ...square(3, 3, 4)];
  fillPolygon(fb, ring, { color: RED });
  const red = (x: number, y: number): boolean => fb.data[(y * 10 + x) * 4]! > 200;
  assert.ok(red(2, 2)); // çerçeve
  assert.ok(!red(5, 5)); // delik
  assert.ok(red(8, 8)); // karşı çerçeve
});

test("fillPath bezier dolgu çalışır", () => {
  const fb = createFramebuffer(20, 20);
  const result = fillPath(fb, "M2 2 C8 -2 12 -2 18 2 L18 16 L2 16 Z", { color: RED });
  assert.equal(result.errors.length, 0);
  assert.equal(result.subpaths, 1);
  // Alt bölge dolu olmalı.
  assert.equal(fb.data[(14 * 20 + 10) * 4]!, 255);
});

test("fillPath geçersiz path'te hata döner", () => {
  const fb = createFramebuffer(10, 10);
  const result = fillPath(fb, "M0 0 X5", { color: RED });
  assert.ok(result.errors.length > 0);
});

test("strokePolyline uçları yuvarlar ve kalınlık uygular", () => {
  const fb = createFramebuffer(30, 10);
  strokePolyline(fb, [{ x: 5, y: 5 }, { x: 25, y: 5 }], 4, { color: RED });
  assert.equal(fb.data[(5 * 30 + 15) * 4]!, 255); // orta
  // Kalınlık 4 → ±2: y=3 ve y=7 kenarları AA'lı dolu olmalı.
  assert.ok(fb.data[(4 * 30 + 15) * 4]! > 0);
});

test("flattenArc yarıçap aşımında ölçeklenir ve bitiş noktasına ulaşır", () => {
  // Yarıçaplar mesafeden küçükse SVG spec gereği ölçeklenir.
  const pts = flattenArc(0, 0, { cmd: "A", rx: 1, ry: 1, rotation: 0, largeArc: 0, sweep: 1, x: 10, y: 0 });
  assert.ok(pts.length > 0);
  const last = pts[pts.length - 1]!;
  assert.ok(Math.abs(last.x - 10) < 0.5 && Math.abs(last.y) < 0.5, `bitiş: ${JSON.stringify(last)}`);
});

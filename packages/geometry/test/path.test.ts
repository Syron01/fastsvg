import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePath, serializePath, pathBounds } from "../src/index.js";

test("mutlak path parse edilir", () => {
  const parsed = parsePath("M0 0 L10 0 L10 10 Z");
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.segments.length, 4);
  assert.deepEqual(parsed.segments[0], { cmd: "M", x: 0, y: 0 });
});

test("relative path mutlak konumlara çevrilir", () => {
  const parsed = parsePath("M10 10 l5 5 h5 v5");
  assert.equal(parsed.errors.length, 0);
  assert.deepEqual(parsed.segments[1], { cmd: "L", x: 15, y: 15 });
  assert.deepEqual(parsed.segments[2], { cmd: "H", x: 20 });
  assert.deepEqual(parsed.segments[3], { cmd: "V", y: 20 });
});

test("round-trip parse→serialize kararlıdır", () => {
  const d = "M0 0C1 1 2 2 3 3S5 5 6 6Q7 7 8 8T10 10Z";
  const parsed = parsePath(d);
  assert.equal(parsed.errors.length, 0);
  assert.equal(serializePath(parsed.segments), d);
});

test("bounds eğrilerde gerçek ekstremumu kullanır", () => {
  const parsed = parsePath("M0 0 C10 -20 20 -20 30 0");
  const bounds = pathBounds(parsed.segments)!;
  assert.equal(bounds.minX, 0);
  assert.equal(bounds.maxX, 30);
  // Simetrik kübikte gerçek minimum t=0.5'te: y = -15 (kontrol noktası -20 değil).
  assert.ok(Math.abs(bounds.minY - (-15)) < 1e-9, `minY: ${bounds.minY}`);
});

test("geçersiz komut hata üretir", () => {
  const parsed = parsePath("M0 0 X5 5");
  assert.ok(parsed.errors.length > 0);
});

test("m sonrası implicit L normalizasyonu", () => {
  const parsed = parsePath("M0 0 10 10");
  assert.equal(parsed.errors.length, 0);
  assert.deepEqual(parsed.segments[1], { cmd: "L", x: 10, y: 10 });
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePath } from "../src/index.js";
import {
  evalCubic, cubicSegmentBounds, cubicSegmentLength,
  measurePath, pointAtLength, reversePath, transformPath,
} from "../src/index.js";

test("evalCubic uç noktalarında doğru değer verir", () => {
  const p0 = { x: 0, y: 0 };
  const p3 = { x: 10, y: 10 };
  assert.deepEqual(evalCubic(p0, { x: 1, y: 1 }, { x: 2, y: 2 }, p3, 0), p0);
  assert.deepEqual(evalCubic(p0, { x: 1, y: 1 }, { x: 2, y: 2 }, p3, 1), p3);
});

test("cubicSegmentBounds gerçek ekstremumu bulur (kontrol noktası dışına taşan eğri)", () => {
  // Kontrol noktaları y=-20'de ama eğri y≈-15'e iner; bounds eğrinin gerçek minimumu olmalı.
  const b = cubicSegmentBounds({ x: 0, y: 0 }, { x: 10, y: -20 }, { x: 20, y: -20 }, { x: 30, y: 0 });
  assert.ok(b.minY > -20 && b.minY < -10, `minY beklenen aralıkta değil: ${b.minY}`);
  assert.equal(b.minX, 0);
  assert.equal(b.maxX, 30);
});

test("cubicSegmentLength bilinen uzunluğa yakın", () => {
  // (0,0)→(100,0) hafif eğri: chord 100, uzunluk 100'den büyük ama 110'dan küçük olmalı.
  const len = cubicSegmentLength({ x: 0, y: 0 }, { x: 33, y: 10 }, { x: 66, y: 10 }, { x: 100, y: 0 });
  assert.ok(len > 100 && len < 110, `uzunluk makul aralıkta değil: ${len}`);
});

test("measurePath line ve cubic kümülatif uzunluk tutarlı", () => {
  const parsed = parsePath("M0 0 L100 0 C150 20 50 40 100 60");
  const m = measurePath(parsed.segments);
  assert.ok(m.length > 160 && m.length < 200, `toplam uzunluk makul değil: ${m.length}`);
  assert.equal(m.cumulative.length, parsed.segments.length + 1);
});

test("pointAtLength orta nokta doğru", () => {
  const parsed = parsePath("M0 0 L100 0");
  const p = pointAtLength(parsed.segments, 50)!;
  assert.ok(Math.abs(p.x - 50) < 1e-9);
  assert.equal(p.y, 0);
});

test("pointAtLength mesafe dışı değerler clamp edilir", () => {
  const parsed = parsePath("M0 0 L10 0");
  const before = pointAtLength(parsed.segments, -5)!;
  const after = pointAtLength(parsed.segments, 99)!;
  assert.equal(before.x, 0);
  assert.equal(after.x, 10);
});

test("reversePath açık path'te birebir round-trip yapar", () => {
  const parsed = parsePath("M0 0 C10 -20 20 -20 30 0 L40 10");
  const twice = reversePath(reversePath(parsed.segments));
  assert.equal(twice.length, parsed.segments.length);
  assert.deepEqual(twice[0], { cmd: "M", x: 0, y: 0 });
  const c = twice[1]!;
  assert.equal(c.cmd, "C");
  assert.deepEqual({ x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2, x: c.x, y: c.y }, { x1: 10, y1: -20, x2: 20, y2: -20, x: 30, y: 0 });
  assert.deepEqual(twice[2], { cmd: "L", x: 40, y: 10 });
});

test("reversePath kapalı path'te aynı uzunluğu korur", () => {
  const parsed = parsePath("M0 0 C10 -20 20 -20 30 0 L40 10 Z");
  const twice = reversePath(reversePath(parsed.segments));
  assert.deepEqual(measurePath(twice).length, measurePath(parsed.segments).length);
});

test("transformPath translation ve scale uygular", () => {
  const parsed = parsePath("M10 10 L20 10");
  const moved = transformPath(parsed.segments, [2, 0, 0, 2, 5, 5]);
  assert.deepEqual({ x: moved[0]!.x, y: moved[0]!.y }, { x: 25, y: 25 });
  assert.deepEqual({ x: moved[1]!.x, y: moved[1]!.y }, { x: 45, y: 25 });
});

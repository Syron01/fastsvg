import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateEasing, cubicBezierEasing, springEasing, easingVelocity, easingAcceleration, EASING_PRESETS,
  validateTimeline, sampleTimeline, frameTimestamps, detectLoopSeam,
} from "../src/index.js";
import type { Timeline } from "../src/index.js";

test("linear easing kimliktir", () => {
  assert.equal(evaluateEasing({ type: "linear" }, 0.25), 0.25);
  assert.equal(evaluateEasing({ type: "linear" }, 1), 1);
});

test("cubic-bezier ease-in-out uçlar ve monotonluk", () => {
  assert.equal(cubicBezierEasing(0.42, 0, 0.58, 1, 0), 0);
  assert.equal(cubicBezierEasing(0.42, 0, 0.58, 1, 1), 1);
  let prev = -1;
  for (let i = 0; i <= 20; i += 1) {
    const v = cubicBezierEasing(0.42, 0, 0.58, 1, i / 20);
    assert.ok(v >= prev - 1e-9, `monoton değil t=${i / 20}`);
    prev = v;
  }
});

test("cubic-bezier orta değer CSS referansıyla uyumlu (ease, t=0.5 ≈ 0.8024)", () => {
  // CSS "ease" = cubic-bezier(0.25, 0.1, 0.25, 1); bilinen orta değer.
  const v = cubicBezierEasing(0.25, 0.1, 0.25, 1, 0.5);
  assert.ok(Math.abs(v - 0.8024) < 0.001, `ease(0.5): ${v}`);
});

test("steps easing kesikli değerler üretir", () => {
  const end = evaluateEasing({ type: "steps", count: 4, position: "end" }, 0.5);
  assert.equal(end, 0.5);
  const start = evaluateEasing({ type: "steps", count: 4, position: "start" }, 0.1);
  assert.equal(start, 0.25);
});

test("spring underdamped overshoot yapar ve 1'e oturur", () => {
  // zeta = damping/(2*sqrt(k*m)) = 0.5 → underdamped.
  const overshoot = springEasing(100, 10, 1, 0, 0.25);
  assert.ok(overshoot > 1, `overshoot bekleniyordu: ${overshoot}`);
  const settle = springEasing(100, 10, 1, 0, 1);
  assert.ok(Math.abs(settle - 1) < 0.01, `son değer: ${settle}`);
  // zeta>=1 aşırı sönümlü: 1'i aşmadan yükselir.
  for (let i = 1; i <= 10; i += 1) {
    const v = springEasing(100, 60, 1, 0, i / 10);
    assert.ok(v <= 1 && v > 0, `aşırı sönümlü t=${i / 10}: ${v}`);
  }
  // Kritik sönüm de overshoot yapmaz.
  const critical = springEasing(100, 20, 1, 0, 0.5);
  assert.ok(critical <= 1 && critical > 0);
});

test("spring deterministiktir: aynı parametre aynı sonucu verir", () => {
  const a = springEasing(80, 12, 1.5, 0, 0.3);
  const b = springEasing(80, 12, 1.5, 0, 0.3);
  assert.equal(a, b);
});

test("easing velocity/acceleration sayısal olarak makul", () => {
  const v = easingVelocity(EASING_PRESETS["ease-in-out"], 0.5);
  assert.ok(v > 0 && v < 5, `velocity: ${v}`);
  const acc = easingAcceleration({ type: "linear" }, 0.5);
  assert.ok(Math.abs(acc) < 1e-6, `linear ivme sıfır olmalı: ${acc}`);
});

const timeline: Timeline = {
  id: "t1",
  name: "test",
  durationMs: 1000,
  frameRate: 30,
  tracks: [
    {
      id: "tr1",
      targetNodeId: "node1",
      property: "translateX",
      keyframes: [
        { id: "k1", timeMs: 0, value: 0 },
        { id: "k2", timeMs: 500, value: 100, easing: { type: "cubic-bezier", x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
        { id: "k3", timeMs: 1000, value: 100 },
      ],
    },
  ],
};

test("timeline doğrulama: sıra dışı keyframe yakalanır", () => {
  assert.deepEqual(validateTimeline(timeline), []);
  const bad: Timeline = {
    ...timeline,
    durationMs: -5,
    tracks: [{
      id: "tr", targetNodeId: "n", property: "opacity",
      keyframes: [{ id: "k2", timeMs: 100, value: 1 }, { id: "k1", timeMs: 50, value: 0 }],
    }],
  };
  const errors = validateTimeline(bad);
  assert.ok(errors.some((e) => e.code === "DURATION_INVALID"));
  assert.ok(errors.some((e) => e.code === "NON_MONOTONIC"));
});

test("sampleTimeline keyframe aralarında easing uygular", () => {
  const t0 = sampleTimeline(timeline, 0)[0]!;
  const tHalf = sampleTimeline(timeline, 250)[0]!;
  void tHalf;
  const tEnd = sampleTimeline(timeline, 1000)[0]!;
  assert.equal(t0.value, 0);
  assert.equal(tEnd.value, 100);
  // ease-in-out ile 100ms'de (local=0.2) yavaş ilerler; linear'ın 20'sinden küçük.
  const tEarly = sampleTimeline(timeline, 100)[0]!;
  assert.ok(typeof tEarly.value === "number" && tEarly.value < 15, `erken fazda: ${tEarly.value}`);
});

test("frameTimestamps fps ve süreyle uyumlu", () => {
  const stamps = frameTimestamps(timeline);
  assert.equal(stamps.length, 30);
  assert.equal(stamps[1], 1000 / 30);
  assert.ok(stamps.every((s, i) => i === 0 || s > stamps[i - 1]!));
});

test("loop dikişi: kapanmayan döngü fark raporlar", () => {
  const open: Timeline = {
    ...timeline,
    tracks: [{
      id: "tr", targetNodeId: "n", property: "translateX",
      keyframes: [{ id: "a", timeMs: 0, value: 0 }, { id: "b", timeMs: 1000, value: 50 }],
    }],
  };
  const report = detectLoopSeam(open);
  assert.equal(report.seamless, false);
  assert.ok(report.seamDeltaByTrack["tr"]! > 0);
  const closed: Timeline = {
    ...timeline,
    tracks: [{
      id: "tr", targetNodeId: "n", property: "translateX",
      keyframes: [{ id: "a", timeMs: 0, value: 0 }, { id: "b", timeMs: 500, value: 50 }, { id: "c", timeMs: 1000, value: 0 }],
    }],
  };
  assert.equal(detectLoopSeam(closed).seamless, true);
});

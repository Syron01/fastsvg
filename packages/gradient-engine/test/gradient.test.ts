import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateGradientStops, generateStops, createLinearGradient, createRadialGradient,
  normalizeOffsets, sampleGradient, analyzeBanding, serializeGradient,
} from "../src/index.js";

test("stop doğrulama: geçersiz offset ve renk yakalanır", () => {
  const errors = validateGradientStops([
    { offset: 0, color: "#ff0000" },
    { offset: 1.5, color: "red" },
  ]);
  assert.equal(errors.length, 2);
});

test("generateStops n adım üretir ve uçlar kaynak renklerdir", () => {
  const stops = generateStops("#000000", "#ffffff", 5)!;
  assert.equal(stops.length, 5);
  assert.equal(stops[0]!.color, "#000000");
  assert.equal(stops[4]!.color, "#ffffff");
});

test("generateStops geçersiz renkte null döner", () => {
  assert.equal(generateStops("kirmizi", "#ffffff", 5), null);
});

test("normalizeOffsets sıralar ve 0..1'e ölçekler", () => {
  const out = normalizeOffsets([
    { offset: 0.75, color: "#00ff00" },
    { offset: 0.25, color: "#ff0000" },
  ]);
  assert.equal(out[0]!.offset, 0);
  assert.equal(out[1]!.offset, 1);
});

test("sampleGradient orta noktada orta rengi verir", () => {
  const { gradient } = createLinearGradient({
    id: "g", x1: 0, y1: 0, x2: 1, y2: 0, units: "objectBoundingBox",
    stops: [
      { offset: 0, color: "#000000" },
      { offset: 1, color: "#ffffff" },
    ],
  });
  const mid = sampleGradient(gradient, 0.5);
  assert.notEqual(mid, "#000000");
  assert.notEqual(mid, "#ffffff");
  assert.match(mid, /^#[0-9a-f]{6}$/);
  assert.equal(sampleGradient(gradient, -1), "#000000");
  assert.equal(sampleGradient(gradient, 2), "#ffffff");
});

test("radial gradient doğrulama: r <= 0 uyarı verir", () => {
  const { warnings } = createRadialGradient({
    id: "r", cx: 0.5, cy: 0.5, r: -1, units: "objectBoundingBox",
    stops: [{ offset: 0, color: "#ffffff" }, { offset: 1, color: "#000000" }],
  });
  assert.ok(warnings.some((w) => w.includes("r")));
});

test("analyzeBanding düz gradientte low risk verir", () => {
  const { gradient } = createLinearGradient({
    id: "g", x1: 0, y1: 0, x2: 1, y2: 0, units: "objectBoundingBox",
    stops: generateStops("#1e3a8a", "#93c5fd", 6)!,
  });
  const report = analyzeBanding(gradient)!;
  assert.ok(report.maxStepDeltaE >= 0);
  assert.ok(["low", "medium", "high"].includes(report.bandingRisk));
});

test("serializeGradient linear markup üretir", () => {
  const { gradient } = createLinearGradient({
    id: "grad1", x1: 0, y1: 0, x2: 1, y2: 0, units: "objectBoundingBox",
    stops: [{ offset: 0, color: "#ff0000" }, { offset: 1, color: "#00ff00", opacity: 0.5 }],
  });
  const svg = serializeGradient(gradient);
  assert.ok(svg.startsWith('<linearGradient id="grad1"'));
  assert.ok(svg.includes('stop-color="#ff0000"'));
  assert.ok(svg.includes('stop-opacity="0.5"'));
  assert.ok(svg.endsWith("</linearGradient>"));
});

test("serializeGradient radial markup focal point içerir", () => {
  const { gradient } = createRadialGradient({
    id: "rg", cx: 0.5, cy: 0.5, r: 0.5, fx: 0.4, fy: 0.4, units: "objectBoundingBox",
    stops: [{ offset: 0, color: "#ffffff" }, { offset: 1, color: "#000000" }],
  });
  const svg = serializeGradient(gradient);
  assert.ok(svg.startsWith('<radialGradient id="rg"'));
  assert.ok(svg.includes('fx="0.4"') && svg.includes('fy="0.4"'));
});

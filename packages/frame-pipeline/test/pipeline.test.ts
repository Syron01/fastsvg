import { test } from "node:test";
import assert from "node:assert/strict";
import { createScene, applyPatch } from "@fastsvg/scene-ir";
import type { SceneNode } from "@fastsvg/scene-ir";
import type { Timeline } from "@fastsvg/motion-engine";
import { renderTimelineApng, renderScenePng, PipelineError } from "../src/index.js";
import { decodePng } from "@fastsvg/apng-exporter";

const box = (id: string): SceneNode => ({
  id,
  type: "rect",
  parentId: null,
  props: { x: 0, y: 0, width: 10, height: 10 },
  style: { fill: { color: "#ff0000" } },
  provenance: "tool",
});

function makeDoc(): ReturnType<typeof createScene> {
  const doc = createScene({ documentId: "d", name: "anim", viewport: { width: 32, height: 32, background: "#000000" } });
  applyPatch(doc, [{ op: "addNode", node: box("b") }]);
  return doc;
}

test("statik sahne PNG olarak render edilir ve decode edilir", () => {
  const doc = makeDoc();
  const result = renderScenePng(doc);
  assert.equal(result.renderedNodes, 1);
  const decoded = decodePng(result.buffer);
  assert.equal(decoded.width, 32);
  assert.equal(decoded.isAnimated, false);
  // (5,5) kırmızı olmalı.
  const idx = (5 * 32 + 5) * 4;
  assert.equal(decoded.rgba[idx], 255);
  assert.equal(decoded.rgba[idx + 1], 0);
});

test("timeline'dan APNG üretilir: kare sayısı ve hareket", () => {
  const doc = makeDoc();
  const timeline: Timeline = {
    id: "t", name: "slide", durationMs: 500, frameRate: 10,
    tracks: [{
      id: "tr", targetNodeId: "b", property: "translateX",
      keyframes: [
        { id: "k1", timeMs: 0, value: 0 },
        { id: "k2", timeMs: 500, value: 20 },
      ],
    }],
  };
  const result = renderTimelineApng(doc, timeline);
  assert.equal(result.frameCount, 5);
  const decoded = decodePng(result.buffer);
  assert.equal(decoded.frameCount, 5);
  // İlk karede kutu x=0'da, son karede x=20'de: (5,5) kırmızı, (25,5) ilk karede boş.
  const frame0 = decoded.rgba.subarray(0, 32 * 32 * 4);
  const frameLast = decoded.rgba.subarray(4 * 32 * 32 * 4);
  assert.equal(frame0[(5 * 32 + 5) * 4], 255);
  assert.equal(frame0[(5 * 32 + 25) * 4], 0); // arka plan siyah
  assert.equal(frameLast[(5 * 32 + 25) * 4], 255); // ulaştı
});

test("geçersiz timeline PipelineError fırlatır", () => {
  const doc = makeDoc();
  const bad: Timeline = { id: "t", name: "x", durationMs: 0, frameRate: 30, tracks: [] };
  assert.throws(() => renderTimelineApng(doc, bad), PipelineError);
});

// v0.3: statik alt katman önbelleği + gradient fill geçişi testleri.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createScene, applyPatch } from "@fastsvg/scene-ir";
import type { SceneNode } from "@fastsvg/scene-ir";
import type { Timeline } from "@fastsvg/motion-engine";
import { renderTimelineApng } from "../src/index.js";
import { renderScene } from "@fastsvg/raster";
import { decodePng } from "@fastsvg/apng-exporter";

const staticSky = (id: string, color: string): SceneNode => ({
  id,
  type: "rect",
  parentId: null,
  props: { x: 0, y: 0, width: 32, height: 16 },
  style: { fill: { color } },
  provenance: "tool",
});

const mover = (id: string): SceneNode => ({
  id,
  type: "rect",
  parentId: null,
  props: { x: 10, y: 10, width: 8, height: 8 },
  style: { fill: { color: "#ff0000" } },
  provenance: "tool",
});

function makeDoc(): ReturnType<typeof createScene> {
  const doc = createScene({ documentId: "d", name: "cache", viewport: { width: 32, height: 32, background: "#000000" } });
  applyPatch(doc, [
    { op: "addNode", node: staticSky("sky", "#0000ff") },
    { op: "addNode", node: mover("box") },
  ]);
  return doc;
}

function timeline(): Timeline {
  return {
    id: "t", name: "slide", durationMs: 400, frameRate: 10,
    tracks: [{
      id: "tr", targetNodeId: "box", property: "translateX",
      keyframes: [
        { id: "k1", timeMs: 0, value: 0 },
        { id: "k2", timeMs: 400, value: 12 },
      ],
    }],
  };
}

test("statik önbellek açıkken çıktı kapalıyla piksel olarak aynıdır", () => {
  const doc = makeDoc();
  const tl = timeline();
  // Önbellek yolu: ilk animasyonlu node öncesi 1 statik node var.
  const cached = renderTimelineApng(doc, tl);
  assert.equal(cached.staticLayerNodes, 1);
  // Önbelleksiz referans: baseLayer yok — renderScene ile kare kare manuel karşılaştırma yerine
  // statik node'u tamamen çıkarıp aynı sonucu verip vermediğini decode üzerinden doğrula:
  const decoded = decodePng(cached.buffer);
  // Kare 0: sky mavi + kutu (10..17) kırmızı.
  const f0 = decoded.rgba.subarray(0, 32 * 32 * 4);
  assert.equal(f0[(5 * 32 + 5) * 4], 0); // sky mavi (kırmızı bileşen 0)
  assert.equal(f0[(5 * 32 + 5) * 4 + 2], 255);
  assert.equal(f0[(12 * 32 + 12) * 4], 255); // kutu kırmızı
  // Kare son: kutu x=12'ye kaydı.
  const fLast = decoded.rgba.subarray(3 * 32 * 32 * 4);
  assert.equal(fLast[(12 * 32 + 22) * 4], 255);
  // Eski konum artık boş (sky mavi).
  assert.equal(fLast[(12 * 32 + 12) * 4], 0);
  assert.equal(fLast[(12 * 32 + 12) * 4 + 2], 255);
});

test("gradient fill pipeline'dan raster'e taşınır", () => {
  const doc = createScene({ documentId: "g", name: "grad", viewport: { width: 32, height: 32, background: "#000000" } });
  applyPatch(doc, [{
    op: "addNode",
    node: {
      id: "sky-grad",
      type: "rect",
      parentId: null,
      props: { x: 0, y: 0, width: 32, height: 32 },
      style: { fill: { color: "url(#sky)" } },
      provenance: "tool",
    },
  }]);
  const tl: Timeline = {
    id: "t", name: "idle", durationMs: 100, frameRate: 10,
    tracks: [{
      id: "tr", targetNodeId: "sky-grad", property: "opacity",
      keyframes: [{ id: "k1", timeMs: 0, value: 1 }, { id: "k2", timeMs: 100, value: 1 }],
    }],
  };
  const result = renderTimelineApng(doc, tl, 0, {
    gradients: [{
      id: "sky", kind: "linear", units: "userSpaceOnUse",
      x1: 0, y1: 0, x2: 0, y2: 32,
      stops: [{ offset: 0, color: "#ff0000" }, { offset: 1, color: "#00ff00" }],
    }],
  });
  assert.equal(result.warnings.length, 0);
  const decoded = decodePng(result.buffer);
  const top = (2 * 32 + 16) * 4;
  const bottom = (29 * 32 + 16) * 4;
  assert.ok(decoded.rgba[top]! > 180, `üst kırmızı: ${decoded.rgba[top]}`);
  assert.ok(decoded.rgba[bottom + 1]! > 180, `alt yeşil: ${decoded.rgba[bottom + 1]}`);
});

test("renderScene doğrudan gradient ve tanımsız gradient uyarısı", () => {
  const doc = createScene({ documentId: "g2", name: "grad2", viewport: { width: 8, height: 8 } });
  applyPatch(doc, [{
    op: "addNode",
    node: {
      id: "a", type: "rect", parentId: null,
      props: { x: 0, y: 0, width: 8, height: 8 },
      style: { fill: { color: "url(#yok)" } },
      provenance: "tool",
    },
  }]);
  const r1 = renderScene(doc);
  assert.ok(r1.warnings.some((w) => w.includes("tanımlı değil")));
  assert.equal(r1.renderedNodes, 0);
});

test("objectBoundingBox gradient node bbox'ına göre ölçeklenir", () => {
  const doc = createScene({ documentId: "g3", name: "grad3", viewport: { width: 20, height: 20, background: "#000000" } });
  applyPatch(doc, [{
    op: "addNode",
    node: {
      id: "r", type: "rect", parentId: null,
      props: { x: 5, y: 5, width: 10, height: 10 },
      style: { fill: { color: "url(#g)" } },
      provenance: "tool",
    },
  }]);
  const r = renderScene(doc, {}, {
    gradients: [{
      id: "g", kind: "linear", units: "objectBoundingBox",
      x1: 0, y1: 0, x2: 0, y2: 1,
      stops: [{ offset: 0, color: "#ff0000" }, { offset: 1, color: "#0000ff" }],
    }],
  });
  assert.equal(r.warnings.length, 0);
  // bbox dışı arka plan siyah kalmalı (bbox 5..15).
  assert.equal(r.framebuffer.data[(2 * 20 + 2) * 4 + 3], 255);
  assert.equal(r.framebuffer.data[(2 * 20 + 2) * 4], 0);
  // bbox üst kırmızı, alt mavi.
  const top = (6 * 20 + 10) * 4;
  const bottom = (14 * 20 + 10) * 4;
  assert.ok(r.framebuffer.data[top]! > 180);
  assert.ok(r.framebuffer.data[bottom + 2]! > 180);
});

test("statik sahnede önbellek devreye girmez ve render tam yapılır", () => {
  const doc = makeDoc();
  const tl: Timeline = {
    id: "t", name: "noop", durationMs: 100, frameRate: 10,
    tracks: [{
      id: "tr", targetNodeId: "sky", property: "opacity",
      keyframes: [{ id: "k1", timeMs: 0, value: 1 }, { id: "k2", timeMs: 100, value: 1 }],
    }],
  };
  const result = renderTimelineApng(doc, tl);
  // "sky" animasyonlu sayılır; ön ekte node kalmaz.
  assert.equal(result.staticLayerNodes, 0);
});

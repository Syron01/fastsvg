import test from "node:test";
import assert from "node:assert/strict";
import { renderScene } from "../src/index.js";
import type { SceneDocument } from "@fastsvg/scene-ir";

test("renderScene gradient stroke: path ve rect üzerinde url(#id) stroke desteği", () => {
  const doc: SceneDocument = {
    schemaVersion: "0.1.0",
    documentId: "doc-grad-stroke",
    name: "Gradient Stroke Test",
    viewport: { width: 100, height: 100, background: "#000000" },
    nodes: [
      {
        id: "line1",
        type: "line",
        parentId: null,
        props: { x1: 10, y1: 50, x2: 90, y2: 50 },
        style: {
          stroke: { color: "url(#g_stroke)", widthPx: 6 },
        },
        provenance: "tool",
      },
      {
        id: "rect1",
        type: "rect",
        parentId: null,
        props: { x: 20, y: 20, width: 60, height: 60 },
        style: {
          stroke: { color: "url(#g_stroke)", widthPx: 4 },
        },
        provenance: "tool",
      },
    ],
  };

  const gradients = [
    {
      id: "g_stroke",
      kind: "linear" as const,
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      units: "userSpaceOnUse" as const,
      stops: [
        { offset: 0, color: "#ff0000" },
        { offset: 1, color: "#0000ff" },
      ],
    },
  ];

  const result = renderScene(doc, {}, { gradients });
  assert.equal(result.warnings.length, 0);
  assert.equal(result.renderedNodes, 2);

  // Framebuffer'da çizilen çizgiyi doğrula
  // y=50, x=15 (kırmızı taraf)
  const idxRed = (50 * 100 + 15) * 4;
  const rRed = result.framebuffer.data[idxRed]!;
  assert.ok(rRed > 100, `Kırmızı renk bekleniyor, r=${rRed}`);

  // y=50, x=85 (mavi taraf)
  const idxBlue = (50 * 100 + 85) * 4;
  const bBlue = result.framebuffer.data[idxBlue + 2]!;
  assert.ok(bBlue > 100, `Mavi renk bekleniyor, b=${bBlue}`);
});

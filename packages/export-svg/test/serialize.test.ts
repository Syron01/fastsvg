import { test } from "node:test";
import assert from "node:assert/strict";
import { createScene } from "@fastsvg/scene-ir";
import type { SceneNode } from "@fastsvg/scene-ir";
import { exportSvgEditable } from "../src/index.js";

const rect: SceneNode = {
  id: "r1", type: "rect", parentId: null, role: "logo-mark",
  props: { x: 10, y: 20, width: 30, height: 40 },
  style: { fill: { color: "#ff0000" }, stroke: { color: "#000", widthPx: 2, linecap: "round" } },
  provenance: "tool",
};

test("rect sahnesi SVG'ye çevrilir", () => {
  const doc = createScene({ documentId: "d1", name: "Logo", viewport: { width: 100, height: 100, background: "#fff" }, nodes: [rect] });
  const result = exportSvgEditable(doc);
  assert.equal(result.nodeCount, 1);
  assert.ok(result.svg.includes('<rect id="r1" x="10" y="20" width="30" height="40"'));
  assert.ok(result.svg.includes('fill="#ff0000"'));
  assert.ok(result.svg.includes('stroke-width="2"'));
  assert.ok(result.svg.includes('data-role="logo-mark"'));
  assert.ok(result.svg.includes('<title>Logo</title>'));
  assert.ok(result.svg.includes('viewBox="0 0 100 100"'));
});

test("grup iç içe render edilir", () => {
  const group: SceneNode = { id: "g", type: "group", parentId: null, provenance: "tool" };
  const child: SceneNode = { id: "c", type: "circle", parentId: "g", props: { cx: 5, cy: 5, r: 3 }, provenance: "tool" };
  const doc = createScene({ documentId: "d1", name: "t", viewport: { width: 10, height: 10 }, nodes: [group, child] });
  const result = exportSvgEditable(doc);
  assert.ok(result.svg.includes('<g id="g">') && result.svg.includes('<circle id="c" cx="5" cy="5" r="3"/>'));
});

test("hidden node çıktıya girmez, bilinmeyen tip uyarı üretir", () => {
  const hidden: SceneNode = { ...rect, id: "h", hidden: true };
  const doc = createScene({ documentId: "d1", name: "t", viewport: { width: 10, height: 10 }, nodes: [hidden] });
  const result = exportSvgEditable(doc);
  assert.ok(!result.svg.includes('id="h"'));
});

test("metin değerleri escape edilir", () => {
  const doc = createScene({ documentId: 'd"x', name: "<b>", viewport: { width: 10, height: 10 } });
  const result = exportSvgEditable(doc);
  assert.ok(result.svg.includes("&lt;b&gt;"));
  assert.ok(result.svg.includes("d&quot;x"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { createScene, applyPatch } from "../src/index.js";
import type { SceneNode } from "../src/index.js";

const rect = (id: string, parentId: string | null): SceneNode => ({
  id, type: "rect", parentId, props: { x: 0, y: 0, width: 10, height: 10 }, provenance: "tool",
});

test("createScene boş sahne üretir", () => {
  const doc = createScene({ documentId: "d1", name: "test", viewport: { width: 100, height: 50 } });
  assert.equal(doc.schemaVersion, "0.1");
  assert.equal(doc.nodes.length, 0);
});

test("addNode + updateNode patch'i çalışır", () => {
  const doc = createScene({ documentId: "d1", name: "test", viewport: { width: 100, height: 50 } });
  const r1 = applyPatch(doc, [{ op: "addNode", node: rect("a", null) }]);
  assert.ok(r1.ok);
  const r2 = applyPatch(doc, [{ op: "updateNode", nodeId: "a", fields: { role: "logo-mark" } }]);
  assert.ok(r2.ok);
  assert.equal(doc.nodes[0]!.role, "logo-mark");
});

test("duplicate id reddedilir ve sahne değişmez", () => {
  const doc = createScene({ documentId: "d1", name: "test", viewport: { width: 100, height: 50 } });
  applyPatch(doc, [{ op: "addNode", node: rect("a", null) }]);
  const before = JSON.stringify(doc);
  const result = applyPatch(doc, [{ op: "addNode", node: rect("a", null) }]);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(doc), before);
});

test("removeNode alt düğümleriyle siler", () => {
  const doc = createScene({ documentId: "d1", name: "test", viewport: { width: 100, height: 50 } });
  applyPatch(doc, [
    { op: "addNode", node: { id: "g", type: "group", parentId: null, provenance: "tool" } },
    { op: "addNode", node: rect("a", "g") },
  ]);
  const result = applyPatch(doc, [{ op: "removeNode", nodeId: "g" }]);
  assert.ok(result.ok);
  assert.equal(doc.nodes.length, 0);
});

test("moveNode kendi alt ağacına taşınamaz (CYCLE)", () => {
  const doc = createScene({ documentId: "d1", name: "test", viewport: { width: 100, height: 50 } });
  applyPatch(doc, [
    { op: "addNode", node: { id: "g", type: "group", parentId: null, provenance: "tool" } },
    { op: "addNode", node: rect("a", "g") },
  ]);
  const result = applyPatch(doc, [{ op: "moveNode", nodeId: "g", parentId: "a" }]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "CYCLE");
});

test("NaN ve negatif boyutlar reddedilir", () => {
  const doc = createScene({ documentId: "d1", name: "test", viewport: { width: 100, height: 50 } });
  const bad: SceneNode = { id: "b", type: "rect", parentId: null, props: { x: 0, y: 0, width: NaN, height: 5 }, provenance: "tool" };
  const result = applyPatch(doc, [{ op: "addNode", node: bad }]);
  assert.equal(result.ok, false);
});

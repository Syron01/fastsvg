// Örnek: scene + timeline → APNG. Çalıştır: npx tsx examples/animation/run.ts
import { createScene, applyPatch } from "@fastsvg/scene-ir";
import type { SceneNode } from "@fastsvg/scene-ir";
import type { Timeline } from "@fastsvg/motion-engine";
import { renderTimelineApng } from "@fastsvg/frame-pipeline";
import { decodePng } from "@fastsvg/apng-exporter";
import { writeFileSync } from "node:fs";

const box: SceneNode = {
  id: "box",
  type: "rect",
  parentId: null,
  props: { x: 0, y: 11, width: 10, height: 10 },
  style: { fill: { color: "#ff0000" } },
  provenance: "tool",
};

const doc = createScene({ documentId: "example", name: "kutu", viewport: { width: 32, height: 32, background: "#101010" } });
applyPatch(doc, [{ op: "addNode", node: box }]);

const timeline: Timeline = {
  id: "t",
  name: "slide-right",
  durationMs: 500,
  frameRate: 10,
  tracks: [{
    id: "tr",
    targetNodeId: "box",
    property: "translateX",
    keyframes: [
      { id: "k1", timeMs: 0, value: 0 },
      { id: "k2", timeMs: 500, value: 20, easing: { type: "cubic-bezier", x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
    ],
  }],
};

const result = renderTimelineApng(doc, timeline);
writeFileSync(new URL("./box.apng", import.meta.url), result.buffer);
const decoded = decodePng(result.buffer);
console.log(`box.apng: ${decoded.frameCount} kare, ${decoded.width}×${decoded.height}, encode ${Math.round(result.encodeMs)}ms`);

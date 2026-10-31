import test from "node:test";
import assert from "node:assert/strict";
import {
  create3DBox,
  create3DCylinder,
  render3DFaces,
  projectPoint,
  rotateVec3,
  vec3,
} from "../src/index.js";

test("3D vektör rotasyonu ve projeksiyonu", () => {
  const p = vec3(100, 0, 0);
  // Y ekseninde 90 derece rotasyon: (100,0,0) -> (0,0,-100)
  const rotated = rotateVec3(p, { yaw: 90 });
  assert.ok(Math.abs(rotated.x) < 1e-4);
  assert.ok(Math.abs(rotated.z - (-100)) < 1e-4);

  // İzometrik projeksiyon
  const pt2D = projectPoint(p, { projection: "isometric", center: { x: 500, y: 300 } });
  assert.ok(pt2D.x > 500);
});

test("create3DBox: 6 yüzey ve izometrik render", () => {
  const box = create3DBox({
    width: 60,
    height: 80,
    depth: 40,
    color: "#3b82f6",
  });
  assert.equal(box.length, 6);

  const { svgMarkup, projectedFaces } = render3DFaces(box, {
    projection: "isometric",
    rotation: { pitch: 20, yaw: 45 },
    center: { x: 300, y: 300 },
  });

  // Kameraya bakan 3 yüzey render edilmeli (Backface culling)
  assert.ok(projectedFaces.length >= 3);
  assert.ok(svgMarkup.includes("<path"));
  assert.ok(svgMarkup.includes('fill="#'));
});

test("create3DCylinder: Yan yüzeyler ve kapaklar", () => {
  const cyl = create3DCylinder({
    radius: 40,
    height: 60,
    segments: 16,
    color: "#10b981",
  });
  // 16 yan duvar + 2 kapak = 18 yüzey
  assert.equal(cyl.length, 18);

  const { svgMarkup, projectedFaces } = render3DFaces(cyl, {
    projection: "perspective",
    center: { x: 400, y: 300 },
  });
  assert.ok(projectedFaces.length > 0);
  assert.ok(svgMarkup.includes("<path"));
});

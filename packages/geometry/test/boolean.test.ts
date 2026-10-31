import test from "node:test";
import assert from "node:assert/strict";
import {
  pointInPolygon,
  polygonArea,
  ensureCCW,
  pathBoolean,
  type Point,
} from "../src/index.js";

test("polygonArea ve ensureCCW", () => {
  const ccwPoly: Point[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
  const area = polygonArea(ccwPoly);
  assert.equal(area, 100);

  const cwPoly: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 }];
  assert.equal(polygonArea(cwPoly), -100);

  const rectified = ensureCCW(cwPoly);
  assert.equal(polygonArea(rectified), 100);
});

test("pointInPolygon iç/dış tespiti", () => {
  const poly: Point[] = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }, { x: 0, y: 20 }];
  assert.equal(pointInPolygon({ x: 10, y: 10 }, poly), true);
  assert.equal(pointInPolygon({ x: -5, y: 10 }, poly), false);
  assert.equal(pointInPolygon({ x: 30, y: 30 }, poly), false);
});

test("pathBoolean: İki ayrık dikdörtgenin union işlemi", () => {
  const pathA = "M 0 0 L 10 0 L 10 10 L 0 10 Z";
  const pathB = "M 20 20 L 30 20 L 30 30 L 20 30 Z";
  const result = pathBoolean(pathA, pathB, "union");
  assert.equal(result.errors.length, 0);
  assert.equal(result.polygons.length, 2);
});

test("pathBoolean: Kesişen iki dikdörtgenin intersection işlemi", () => {
  // A: (0,0)-(20,20), alan 400
  // B: (10,5)-(30,25), alan 400
  // Kesişim: [10..20] x [5..20] = 10 x 15 = 150 alan
  const pathA = "M 0 0 L 20 0 L 20 20 L 0 20 Z";
  const pathB = "M 10 5 L 30 5 L 30 25 L 10 25 Z";
  const result = pathBoolean(pathA, pathB, "intersection");
  assert.equal(result.errors.length, 0);
  assert.ok(result.polygons.length >= 1);
  const totalArea = result.polygons.reduce((acc, p) => acc + Math.abs(polygonArea(p)), 0);
  assert.ok(Math.abs(totalArea - 150) < 1.0, `Beklenen kesişim alanı 150, alınan ${totalArea}`);
});

test("pathBoolean: Kesişen iki dikdörtgenin difference işlemi", () => {
  // A: (0,0)-(20,20) - B: (10,5)-(30,25) -> Fark alanı: 400 - 150 = 250
  const pathA = "M 0 0 L 20 0 L 20 20 L 0 20 Z";
  const pathB = "M 10 5 L 30 5 L 30 25 L 10 25 Z";
  const result = pathBoolean(pathA, pathB, "difference");
  assert.equal(result.errors.length, 0);
  const totalArea = result.polygons.reduce((acc, p) => acc + Math.abs(polygonArea(p)), 0);
  assert.ok(Math.abs(totalArea - 250) < 1.0, `Beklenen fark alanı 250, alınan ${totalArea}`);
});

test("pathBoolean: İki dikdörtgenin union işlemi tek birleşik alan üretir", () => {
  // A: (0,0)-(20,20) U B: (10,5)-(30,25) -> Union alanı: 400 + 400 - 150 = 650
  const pathA = "M 0 0 L 20 0 L 20 20 L 0 20 Z";
  const pathB = "M 10 5 L 30 5 L 30 25 L 10 25 Z";
  const result = pathBoolean(pathA, pathB, "union");
  assert.equal(result.errors.length, 0);
  const totalArea = result.polygons.reduce((acc, p) => acc + Math.abs(polygonArea(p)), 0);
  assert.ok(Math.abs(totalArea - 650) < 1.0, `Beklenen union alanı 650, alınan ${totalArea}`);
});

test("pathBoolean: XOR işlemi kesişmeyen alanları birleştirir", () => {
  // XOR: (A-B) + (B-A) = 250 + 250 = 500
  const pathA = "M 0 0 L 20 0 L 20 20 L 0 20 Z";
  const pathB = "M 10 5 L 30 5 L 30 25 L 10 25 Z";
  const result = pathBoolean(pathA, pathB, "xor");
  assert.equal(result.errors.length, 0);
  const totalArea = result.polygons.reduce((acc, p) => acc + Math.abs(polygonArea(p)), 0);
  assert.ok(Math.abs(totalArea - 500) < 2.0, `Beklenen XOR alanı 500, alınan ${totalArea}`);
});

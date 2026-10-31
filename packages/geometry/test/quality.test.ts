import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeCurveContinuity,
  analyzeOpticalBalance,
  evaluateVisualQuality,
} from "../src/index.js";

test("analyzeCurveContinuity: Pürüzsüz teğet geçişi (G1)", () => {
  // Düz çizgi: (0,0) -> (50,0) -> (100,0)
  const straightPath = "M 0 0 L 50 0 L 100 0";
  const rep = analyzeCurveContinuity(straightPath);
  assert.equal(rep.isG1Continuous, true);
  assert.equal(rep.g1AngleJumps.length, 0);
  assert.equal(rep.smoothnessScore, 100);
});

test("analyzeCurveContinuity: 90 derece keskin köşe tespiti", () => {
  // L şekli: (0,0) -> (50,0) -> (50,50) (90 derece açı kırılması)
  const cornerPath = "M 0 0 L 50 0 L 50 50";
  const rep = analyzeCurveContinuity(cornerPath);
  assert.equal(rep.isG1Continuous, false);
  assert.equal(rep.g1AngleJumps.length, 1);
  assert.ok(Math.abs(rep.g1AngleJumps[0]!.angleJumpDeg - 90) < 1);
  assert.ok(rep.smoothnessScore < 100);
});

test("analyzeOpticalBalance: Simetrik kare geometrik ve optik olarak merkezdedir", () => {
  const square = "M 0 0 L 100 0 L 100 100 L 0 100 Z";
  const rep = analyzeOpticalBalance(square);
  assert.equal(rep.geometricCenter.x, 50);
  assert.equal(rep.geometricCenter.y, 50);
  assert.ok(Math.abs(rep.opticalCenter.x - 50) < 0.1);
  assert.ok(Math.abs(rep.opticalCenter.y - 50) < 0.1);
  assert.equal(rep.balanceScore, 100);
  assert.ok(Math.abs(rep.suggestedOffset.dx) < 0.1);
});

test("analyzeOpticalBalance: Asimetrik üçgende görsel kütle merkezi kaymasını ölçer", () => {
  // Sağ tarafa yığılmış dik üçgen: (0,0) -> (100,0) -> (100,100) -> Z
  // Geometrik kutu: [0, 100], merkezi (50, 50)
  // Centroid (kütle merkezi): x = (0 + 100 + 100) / 3 = 66.67, y = (0 + 0 + 100) / 3 = 33.33
  const triangle = "M 0 0 L 100 0 L 100 100 Z";
  const rep = analyzeOpticalBalance(triangle);
  assert.equal(rep.geometricCenter.x, 50);
  assert.equal(rep.geometricCenter.y, 50);
  assert.ok(rep.opticalCenter.x > 60); // Sağa kaymış kütle
  assert.ok(rep.suggestedOffset.dx < 0); // Sola çekme önerisi
});

test("evaluateVisualQuality: Bütüncül skor ve öneriler", () => {
  const path = "M 0 0 L 100 0 L 100 100 L 0 100 Z";
  const report = evaluateVisualQuality(path);
  assert.ok(report.overallScore > 70);
  assert.ok(Array.isArray(report.recommendations));
  assert.ok(report.grade === "A+" || report.grade === "A" || report.grade === "B");
});

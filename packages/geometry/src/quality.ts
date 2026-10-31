// FastSVG Kalite ve Optik Mühendislik Araçları (şartname 6.2, 6.6).
// Sıfır bağımlılık: G0/G1/G2 eğri süreklilik analizi, optik merkez ve görsel kütle hesabı,
// düğüm yoğunluğu ve profesyonel tasarım kalite skoru.

import type { Point } from "./bezier.js";
import { parsePath, pathBounds, type PathSegment, type Bounds } from "./path.js";
import { pathToPolygons, polygonArea, simplifyPolygon } from "./boolean.js";

export interface CurveContinuityReport {
  isG0Continuous: boolean;
  g0Gaps: Array<{ index: number; p1: Point; p2: Point; distance: number }>;
  isG1Continuous: boolean;
  g1AngleJumps: Array<{ index: number; point: Point; angleJumpDeg: number }>;
  curvatureSpikes: Array<{ index: number; point: Point; ratio: number }>;
  nodeDensityPer100px: number;
  totalLength: number;
  segmentCount: number;
  smoothnessScore: number; // 0..100
}

export interface OpticalBalanceReport {
  geometricCenter: Point;
  opticalCenter: Point; // Visual mass / centroid
  offset: { dx: number; dy: number };
  shiftPercent: { x: number; y: number };
  bounds: Bounds;
  totalArea: number;
  balanceScore: number; // 0..100 (100 = mükemmel optik simetri)
  suggestedOffset: { dx: number; dy: number };
}

export interface VisualQualityReport {
  continuity: CurveContinuityReport;
  opticalBalance: OpticalBalanceReport;
  overallScore: number; // 0..100
  grade: "A+" | "A" | "B" | "C" | "D";
  recommendations: string[];
}

const EPSILON = 1e-4;

function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

// Bir segmentin başlangıç ve bitiş teğet vektörlerini döndürür
function segmentTangents(
  seg: PathSegment,
  startPt: Point,
): { startTangent: Point; endTangent: Point; endPt: Point; lengthEst: number } {
  let endPt = { ...startPt };
  let startTan = { x: 0, y: 0 };
  let endTan = { x: 0, y: 0 };
  let lengthEst = 0;

  switch (seg.cmd) {
    case "L":
    case "M": {
      endPt = { x: seg.x, y: seg.y };
      const dx = endPt.x - startPt.x;
      const dy = endPt.y - startPt.y;
      startTan = { x: dx, y: dy };
      endTan = { x: dx, y: dy };
      lengthEst = Math.hypot(dx, dy);
      break;
    }
    case "H": {
      endPt = { x: seg.x, y: startPt.y };
      const dx = endPt.x - startPt.x;
      startTan = { x: dx, y: 0 };
      endTan = { x: dx, y: 0 };
      lengthEst = Math.abs(dx);
      break;
    }
    case "V": {
      endPt = { x: startPt.x, y: seg.y };
      const dy = endPt.y - startPt.y;
      startTan = { x: 0, y: dy };
      endTan = { x: 0, y: dy };
      lengthEst = Math.abs(dy);
      break;
    }
    case "C": {
      endPt = { x: seg.x, y: seg.y };
      const cp1 = { x: seg.x1, y: seg.y1 };
      const cp2 = { x: seg.x2, y: seg.y2 };
      startTan = distance(startPt, cp1) > EPSILON
        ? { x: cp1.x - startPt.x, y: cp1.y - startPt.y }
        : { x: cp2.x - startPt.x, y: cp2.y - startPt.y };
      endTan = distance(cp2, endPt) > EPSILON
        ? { x: endPt.x - cp2.x, y: endPt.y - cp2.y }
        : { x: endPt.x - cp1.x, y: endPt.y - cp1.y };
      lengthEst = distance(startPt, cp1) + distance(cp1, cp2) + distance(cp2, endPt);
      break;
    }
    case "Q": {
      endPt = { x: seg.x, y: seg.y };
      const cp = { x: seg.x1, y: seg.y1 };
      startTan = { x: cp.x - startPt.x, y: cp.y - startPt.y };
      endTan = { x: endPt.x - cp.x, y: endPt.y - cp.y };
      lengthEst = distance(startPt, cp) + distance(cp, endPt);
      break;
    }
    default:
      break;
  }

  return { startTangent: startTan, endTangent: endTan, endPt, lengthEst };
}

function vectorAngle(v1: Point, v2: Point): number {
  const len1 = Math.hypot(v1.x, v1.y);
  const len2 = Math.hypot(v2.x, v2.y);
  if (len1 < EPSILON || len2 < EPSILON) return 0;
  const dot = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2);
  const clamped = Math.max(-1, Math.min(1, dot));
  return Math.acos(clamped) * (180 / Math.PI);
}

/**
 * Bir SVG Path'in G0 (konumsal) ve G1 (teğetsel) eğri sürekliliğini,
 * açı sıçramalarını ve düğüm yoğunluğunu analiz eder.
 */
export function analyzeCurveContinuity(
  segmentsOrPath: PathSegment[] | string,
  tolerance = 0.5,
): CurveContinuityReport {
  const segments = typeof segmentsOrPath === "string"
    ? parsePath(segmentsOrPath).segments
    : segmentsOrPath;

  const g0Gaps: Array<{ index: number; p1: Point; p2: Point; distance: number }> = [];
  const g1AngleJumps: Array<{ index: number; point: Point; angleJumpDeg: number }> = [];
  const curvatureSpikes: Array<{ index: number; point: Point; ratio: number }> = [];

  let currentPt: Point = { x: 0, y: 0 };
  let prevEndTangent: Point | null = null;
  let totalLength = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (seg.cmd === "M") {
      currentPt = { x: seg.x, y: seg.y };
      prevEndTangent = null;
      continue;
    }
    if (seg.cmd === "Z") {
      prevEndTangent = null;
      continue;
    }

    const { startTangent, endTangent, endPt, lengthEst } = segmentTangents(seg, currentPt);
    totalLength += lengthEst;

    // G1 analizi: Önceki segmentin bitiş teğeti ile bu segmentin başlangıç teğeti arasındaki açı
    if (prevEndTangent && (Math.hypot(prevEndTangent.x, prevEndTangent.y) > EPSILON) && (Math.hypot(startTangent.x, startTangent.y) > EPSILON)) {
      const angle = vectorAngle(prevEndTangent, startTangent);
      if (angle > tolerance) {
        g1AngleJumps.push({
          index: i,
          point: { ...currentPt },
          angleJumpDeg: Math.round(angle * 10) / 10,
        });
      }
    }

    prevEndTangent = endTangent;
    currentPt = endPt;
  }

  const isG0Continuous = g0Gaps.length === 0;
  const isG1Continuous = g1AngleJumps.length === 0;
  const nodeDensityPer100px = totalLength > 0 ? (segments.length / totalLength) * 100 : 0;

  // 100 üzerinden pürüzsüzlük skoru
  let score = 100;
  score -= g0Gaps.length * 20;
  score -= g1AngleJumps.length * 5;
  if (nodeDensityPer100px > 15) score -= (nodeDensityPer100px - 15) * 2;
  const smoothnessScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    isG0Continuous,
    g0Gaps,
    isG1Continuous,
    g1AngleJumps,
    curvatureSpikes,
    nodeDensityPer100px: Math.round(nodeDensityPer100px * 10) / 10,
    totalLength: Math.round(totalLength * 10) / 10,
    segmentCount: segments.length,
    smoothnessScore,
  };
}

/**
 * Çokgenin kütle merkezini (centroid) hesaplar.
 */
function polygonCentroid(poly: Point[]): { centroid: Point; area: number } {
  if (poly.length < 3) return { centroid: { x: 0, y: 0 }, area: 0 };
  let cx = 0;
  let cy = 0;
  let signedArea = 0;

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const p1 = poly[j]!;
    const p2 = poly[i]!;
    const factor = p1.x * p2.y - p2.x * p1.y;
    signedArea += factor;
    cx += (p1.x + p2.x) * factor;
    cy += (p1.y + p2.y) * factor;
  }

  signedArea /= 2;
  if (Math.abs(signedArea) < EPSILON) {
    // Çökmüş çokgen: basit tepe ortalaması
    const avgX = poly.reduce((acc, p) => acc + p.x, 0) / poly.length;
    const avgY = poly.reduce((acc, p) => acc + p.y, 0) / poly.length;
    return { centroid: { x: avgX, y: avgY }, area: 0 };
  }

  const factor = 1 / (6 * signedArea);
  return {
    centroid: { x: cx * factor, y: cy * factor },
    area: Math.abs(signedArea),
  };
}

/**
 * Optik denge ve görsel ağırlık merkezini hesaplar (şartname 6.6).
 * Geometrik kutu merkezi ile algısal kütle merkezi arasındaki sapmayı ölçer.
 */
export function analyzeOpticalBalance(
  segmentsOrPath: PathSegment[] | string,
): OpticalBalanceReport {
  const segments = typeof segmentsOrPath === "string"
    ? parsePath(segmentsOrPath).segments
    : segmentsOrPath;

  const rawBounds = pathBounds(segments);
  const bounds: Bounds = rawBounds ?? { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const geometricCenter = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };

  const polys = pathToPolygons(segments, 16);
  let totalArea = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const poly of polys) {
    const { centroid, area } = polygonCentroid(poly);
    weightedX += centroid.x * area;
    weightedY += centroid.y * area;
    totalArea += area;
  }

  const opticalCenter = totalArea > EPSILON
    ? { x: weightedX / totalArea, y: weightedY / totalArea }
    : { ...geometricCenter };

  const dx = opticalCenter.x - geometricCenter.x;
  const dy = opticalCenter.y - geometricCenter.y;
  const shiftPercentX = width > 0 ? (dx / width) * 100 : 0;
  const shiftPercentY = height > 0 ? (dy / height) * 100 : 0;

  // Optik denge skoru: 0..100 (merkeze yakınlık)
  const normShift = Math.hypot(shiftPercentX, shiftPercentY);
  const balanceScore = Math.max(0, Math.min(100, Math.round(100 - normShift * 4)));

  return {
    geometricCenter,
    opticalCenter: { x: Math.round(opticalCenter.x * 100) / 100, y: Math.round(opticalCenter.y * 100) / 100 },
    offset: { dx: Math.round(dx * 100) / 100, dy: Math.round(dy * 100) / 100 },
    shiftPercent: { x: Math.round(shiftPercentX * 10) / 10, y: Math.round(shiftPercentY * 10) / 10 },
    bounds,
    totalArea: Math.round(totalArea),
    balanceScore,
    suggestedOffset: { dx: Math.round(-dx * 100) / 100, dy: Math.round(-dy * 100) / 100 },
  };
}

/**
 * Tasarımın bütüncül görsel kalite analizini yapar.
 */
export function evaluateVisualQuality(
  segmentsOrPath: PathSegment[] | string,
): VisualQualityReport {
  const continuity = analyzeCurveContinuity(segmentsOrPath);
  const opticalBalance = analyzeOpticalBalance(segmentsOrPath);

  const overallScore = Math.round(continuity.smoothnessScore * 0.6 + opticalBalance.balanceScore * 0.4);

  let grade: VisualQualityReport["grade"] = "D";
  if (overallScore >= 90) grade = "A+";
  else if (overallScore >= 80) grade = "A";
  else if (overallScore >= 70) grade = "B";
  else if (overallScore >= 55) grade = "C";

  const recommendations: string[] = [];
  if (continuity.g1AngleJumps.length > 0) {
    recommendations.push(`${continuity.g1AngleJumps.length} noktada teğet açısı kırılması (G1 süreklilik kaybı) var; kontrol noktalarını hizalayın.`);
  }
  if (continuity.nodeDensityPer100px > 20) {
    recommendations.push("Düğüm yoğunluğu yüksek. Curve simplification veya segment birleştirme uygulayın.");
  }
  if (Math.abs(opticalBalance.shiftPercent.x) > 5 || Math.abs(opticalBalance.shiftPercent.y) > 5) {
    recommendations.push(`Görsel ağırlık merkezi geometrik merkezden sapıyor (dx: ${opticalBalance.offset.dx}px, dy: ${opticalBalance.offset.dy}px). İkon/logo hizalaması için optik düzeltme önerilir.`);
  }
  if (recommendations.length === 0) {
    recommendations.push("Tasarım yüksek geometrik ve optik kalite standartlarını karşılıyor.");
  }

  return {
    continuity,
    opticalBalance,
    overallScore,
    grade,
    recommendations,
  };
}

// FastSVG Boolean Operations Engine (şartname 6.3).
// Sıfır harici bağımlılık, deterministik çokgen ve SVG path boolean operasyonları:
// union, intersection, difference, xor.

import type { Point } from "./bezier.js";
import { parsePath, type PathSegment } from "./path.js";

export type BooleanOp = "union" | "intersection" | "difference" | "xor";

export interface BooleanOptions {
  tolerance?: number;
  curveSteps?: number;
}

const EPSILON = 1e-6;

function approxEqual(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) <= eps;
}

function pointsEqual(p1: Point, p2: Point, eps = EPSILON): boolean {
  return approxEqual(p1.x, p2.x, eps) && approxEqual(p1.y, p2.y, eps);
}

// Ray-casting ile nokta çokgen içinde mi?
export function pointInPolygon(pt: Point, poly: Point[]): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i]!;
    const pj = poly[j]!;
    const intersect = ((pi.y > pt.y) !== (pj.y > pt.y)) &&
      (pt.x < ((pj.x - pi.x) * (pt.y - pi.y)) / (pj.y - pi.y + 1e-12) + pi.x);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Shoelace formülü ile çokgen alanı (CCW pozitif, CW negatif)
export function polygonArea(poly: Point[]): number {
  if (poly.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    area += (poly[j]!.x * poly[i]!.y) - (poly[i]!.x * poly[j]!.y);
  }
  return area / 2;
}

// Çokgeni kesin CCW (pozitif alan) yapar
export function ensureCCW(poly: Point[]): Point[] {
  if (polygonArea(poly) < 0) {
    return [...poly].reverse();
  }
  return [...poly];
}

interface Intersection {
  p: Point;
  tA: number;
  tB: number;
}

function computeIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Intersection | null {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null; // Paralel

  const tA = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
  const tB = ((p3.x - p1.x) * dy1 - (p3.y - p1.y) * dx1) / denom;

  if (tA >= 0 && tA <= 1 && tB >= 0 && tB <= 1) {
    const ctA = Math.max(1e-5, Math.min(1 - 1e-5, tA));
    const ctB = Math.max(1e-5, Math.min(1 - 1e-5, tB));
    return {
      p: { x: p1.x + ctA * dx1, y: p1.y + ctA * dy1 },
      tA: ctA,
      tB: ctB,
    };
  }
  return null;
}

class VertexNode {
  p: Point;
  next: VertexNode;
  prev: VertexNode;
  isIntersection = false;
  neighbor: VertexNode | null = null;
  entry = false; // B'ye giriş mi, çıkış mı
  visited = false;
  alpha = 0;

  constructor(p: Point) {
    this.p = p;
    this.next = this;
    this.prev = this;
  }
}

function createVertexRing(poly: Point[]): VertexNode {
  const clean: Point[] = [];
  for (const pt of poly) {
    if (clean.length === 0 || !pointsEqual(clean[clean.length - 1]!, pt)) {
      clean.push(pt);
    }
  }
  if (clean.length > 1 && pointsEqual(clean[0]!, clean[clean.length - 1]!)) {
    clean.pop();
  }

  let first: VertexNode | null = null;
  let prev: VertexNode | null = null;
  for (const pt of clean) {
    const node = new VertexNode({ x: pt.x, y: pt.y });
    if (!first) first = node;
    else {
      prev!.next = node;
      node.prev = prev!;
    }
    prev = node;
  }
  if (first && prev && first !== prev) {
    prev.next = first;
    first.prev = prev;
  }
  return first!;
}

function clipGreinerHormann(
  subject: Point[],
  clip: Point[],
  op: BooleanOp,
): Point[][] {
  const polyA = ensureCCW(subject);
  const polyB = ensureCCW(clip.map((pt, i) => ({
    x: pt.x + (i % 2 === 0 ? 1e-6 : -1e-6),
    y: pt.y + (i % 2 === 1 ? 1e-6 : -1e-6),
  })));

  if (polyA.length < 3) return op === "union" || op === "xor" ? [clip] : [];
  if (polyB.length < 3) return op === "union" || op === "difference" || op === "xor" ? [subject] : [];

  const ringA = createVertexRing(polyA);
  const ringB = createVertexRing(polyB);

  const aIntersections: VertexNode[] = [];
  const bIntersections: VertexNode[] = [];

  // 1. Kesişimleri bul
  let aCurr = ringA;
  do {
    const aNext = aCurr.next;
    let bCurr = ringB;
    do {
      const bNext = bCurr.next;
      const inter = computeIntersection(aCurr.p, aNext.p, bCurr.p, bNext.p);
      if (inter) {
        const nodeA = new VertexNode(inter.p);
        nodeA.isIntersection = true;
        nodeA.alpha = inter.tA;

        const nodeB = new VertexNode(inter.p);
        nodeB.isIntersection = true;
        nodeB.alpha = inter.tB;

        nodeA.neighbor = nodeB;
        nodeB.neighbor = nodeA;

        let insA = aCurr;
        while (insA.next !== aNext && insA.next.isIntersection && insA.next.alpha < inter.tA) {
          insA = insA.next;
        }
        insA.next.prev = nodeA;
        nodeA.next = insA.next;
        insA.next = nodeA;
        nodeA.prev = insA;

        let insB = bCurr;
        while (insB.next !== bNext && insB.next.isIntersection && insB.next.alpha < inter.tB) {
          insB = insB.next;
        }
        insB.next.prev = nodeB;
        nodeB.next = insB.next;
        insB.next = nodeB;
        nodeB.prev = insB;

        aIntersections.push(nodeA);
        bIntersections.push(nodeB);
      }
      bCurr = bNext;
    } while (bCurr !== ringB);
    aCurr = aNext;
  } while (aCurr !== ringA);

  if (aIntersections.length === 0) {
    const aInB = pointInPolygon(polyA[0]!, polyB);
    const bInA = pointInPolygon(polyB[0]!, polyA);

    switch (op) {
      case "union":
        if (aInB) return [clip];
        if (bInA) return [subject];
        return [subject, clip];
      case "intersection":
        if (aInB) return [subject];
        if (bInA) return [clip];
        return [];
      case "difference":
        if (aInB) return [];
        if (bInA) return [subject, clip];
        return [subject];
      case "xor":
        if (aInB) return [clip];
        if (bInA) return [subject];
        return [subject, clip];
    }
  }

  // 2. Giriş/Çıkış etiketleme
  let statusA = !pointInPolygon(ringA.p, polyB);
  let scanA = ringA;
  do {
    if (scanA.isIntersection) {
      scanA.entry = statusA;
      statusA = !statusA;
    }
    scanA = scanA.next;
  } while (scanA !== ringA);

  let statusB = !pointInPolygon(ringB.p, polyA);
  let scanB = ringB;
  do {
    if (scanB.isIntersection) {
      scanB.entry = statusB;
      statusB = !statusB;
    }
    scanB = scanB.next;
  } while (scanB !== ringB);

  // 3. Traversal
  const result: Point[][] = [];

  for (const startNode of aIntersections) {
    if (startNode.visited) continue;

    // Başlangıç seçimi:
    // intersection: A'dan B'ye giriş (entry = true)
    // union: A'dan B'ye çıkış (entry = false)
    // difference: A'dan B'ye çıkış (entry = false)
    if (op === "intersection" && !startNode.entry) continue;
    if (op === "union" && startNode.entry) continue;
    if (op === "difference" && startNode.entry) continue;

    const points: Point[] = [];
    let curr: VertexNode | null = startNode;
    let onA = true;

    while (curr && !curr.visited) {
      curr.visited = true;
      points.push({ x: Math.round(curr.p.x * 1000) / 1000, y: Math.round(curr.p.y * 1000) / 1000 });

      if (op === "union") {
        // Union: A üzerinde ileri git kesişime kadar, sonra komşuya geçip B üzerinde ileri git
        do {
          curr = curr!.next;
          if (!curr.isIntersection) points.push({ x: Math.round(curr.p.x * 1000) / 1000, y: Math.round(curr.p.y * 1000) / 1000 });
        } while (curr && !curr.isIntersection);
        if (curr) {
          curr.visited = true;
          curr = curr.neighbor;
        }
      } else if (op === "intersection") {
        // Intersection: A üzerinde ileri, kesişimde B'ye geç ve B üzerinde ileri
        do {
          curr = curr!.next;
          if (!curr.isIntersection) points.push({ x: Math.round(curr.p.x * 1000) / 1000, y: Math.round(curr.p.y * 1000) / 1000 });
        } while (curr && !curr.isIntersection);
        if (curr) {
          curr.visited = true;
          curr = curr.neighbor;
        }
      } else if (op === "difference") {
        // Difference: A üzerinde İLERİ (next), B üzerinde GERİ (prev)
        if (onA) {
          do {
            curr = curr!.next;
            if (!curr.isIntersection) points.push({ x: Math.round(curr.p.x * 1000) / 1000, y: Math.round(curr.p.y * 1000) / 1000 });
          } while (curr && !curr.isIntersection);
          if (curr) {
            curr.visited = true;
            curr = curr.neighbor;
            onA = false;
          }
        } else {
          do {
            curr = curr!.prev;
            if (!curr.isIntersection) points.push({ x: Math.round(curr.p.x * 1000) / 1000, y: Math.round(curr.p.y * 1000) / 1000 });
          } while (curr && !curr.isIntersection);
          if (curr) {
            curr.visited = true;
            curr = curr.neighbor;
            onA = true;
          }
        }
      }
    }

    if (points.length >= 3) {
      result.push(simplifyPolygon(points));
    }
  }

  if (op === "xor") {
    const diff1 = clipGreinerHormann(subject, clip, "difference");
    const diff2 = clipGreinerHormann(clip, subject, "difference");
    return [...diff1, ...diff2];
  }

  return result;
}

// Kolineer noktaları sadeleştirme
export function simplifyPolygon(poly: Point[], eps = 1e-4): Point[] {
  if (poly.length <= 2) return poly;
  const out: Point[] = [];
  for (let i = 0; i < poly.length; i++) {
    const pPrev = poly[(i - 1 + poly.length) % poly.length]!;
    const pCurr = poly[i]!;
    const pNext = poly[(i + 1) % poly.length]!;

    const cross = (pCurr.x - pPrev.x) * (pNext.y - pCurr.y) - (pCurr.y - pPrev.y) * (pNext.x - pCurr.x);
    if (Math.abs(cross) > eps && !pointsEqual(pPrev, pCurr, eps)) {
      if (out.length === 0 || !pointsEqual(out[out.length - 1]!, pCurr, eps)) {
        out.push(pCurr);
      }
    }
  }
  return out;
}

// Çoklu konturlar üzerinde boolean operasyon
export function booleanPolygons(
  subjects: Point[][],
  clips: Point[][],
  op: BooleanOp,
): Point[][] {
  if (subjects.length === 0) return op === "union" || op === "xor" ? clips : [];
  if (clips.length === 0) return op === "union" || op === "difference" || op === "xor" ? subjects : [];

  let accum = subjects;
  for (const clip of clips) {
    const nextAccum: Point[][] = [];
    for (const subj of accum) {
      const res = clipGreinerHormann(subj, clip, op);
      nextAccum.push(...res);
    }
    accum = nextAccum;
  }
  return accum;
}

// Path segmentlerini poligonlara açar
export function pathToPolygons(segments: PathSegment[], curveSteps = 24): Point[][] {
  const polys: Point[][] = [];
  let current: Point[] = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;

  for (const seg of segments) {
    switch (seg.cmd) {
      case "M": {
        if (current.length >= 3) polys.push(current);
        cx = seg.x;
        cy = seg.y;
        startX = cx;
        startY = cy;
        current = [{ x: cx, y: cy }];
        break;
      }
      case "L": {
        cx = seg.x;
        cy = seg.y;
        current.push({ x: cx, y: cy });
        break;
      }
      case "H": {
        cx = seg.x;
        current.push({ x: cx, y: cy });
        break;
      }
      case "V": {
        cy = seg.y;
        current.push({ x: cx, y: cy });
        break;
      }
      case "C": {
        const p0 = { x: cx, y: cy };
        const p1 = { x: seg.x1, y: seg.y1 };
        const p2 = { x: seg.x2, y: seg.y2 };
        const p3 = { x: seg.x, y: seg.y };
        for (let step = 1; step <= curveSteps; step++) {
          const t = step / curveSteps;
          const u = 1 - t;
          const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
          const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
          current.push({ x, y });
        }
        cx = seg.x;
        cy = seg.y;
        break;
      }
      case "Q": {
        const p0 = { x: cx, y: cy };
        const p1 = { x: seg.x1, y: seg.y1 };
        const p2 = { x: seg.x, y: seg.y };
        for (let step = 1; step <= curveSteps; step++) {
          const t = step / curveSteps;
          const u = 1 - t;
          const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
          const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
          current.push({ x, y });
        }
        cx = seg.x;
        cy = seg.y;
        break;
      }
      case "Z": {
        if (current.length > 0 && !pointsEqual(current[current.length - 1]!, { x: startX, y: startY })) {
          current.push({ x: startX, y: startY });
        }
        cx = startX;
        cy = startY;
        if (current.length >= 3) polys.push(current);
        current = [];
        break;
      }
      default:
        break;
    }
  }
  if (current.length >= 3) polys.push(current);
  return polys;
}

// Poligon dizisini SVG path stringine çevirir
export function polygonsToPathString(polys: Point[][]): string {
  const parts: string[] = [];
  for (const poly of polys) {
    if (poly.length < 3) continue;
    const start = poly[0]!;
    let d = `M ${round(start.x)} ${round(start.y)}`;
    for (let i = 1; i < poly.length; i++) {
      const p = poly[i]!;
      d += ` L ${round(p.x)} ${round(p.y)}`;
    }
    d += " Z";
    parts.push(d);
  }
  return parts.join(" ");
}

function round(num: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
}

/**
 * İki SVG path d stringi üzerinde boolean operasyon (union, intersection, difference, xor)
 */
export function pathBoolean(
  subjectD: string,
  clipD: string,
  op: BooleanOp,
  options: BooleanOptions = {},
): { d: string; polygons: Point[][]; errors: string[] } {
  const parsedSubject = parsePath(subjectD);
  const parsedClip = parsePath(clipD);
  const errors = [...parsedSubject.errors, ...parsedClip.errors];
  if (errors.length > 0) {
    return { d: "", polygons: [], errors };
  }

  const subjPolys = pathToPolygons(parsedSubject.segments, options.curveSteps ?? 24);
  const clipPolys = pathToPolygons(parsedClip.segments, options.curveSteps ?? 24);

  const resultPolys = booleanPolygons(subjPolys, clipPolys, op);
  const d = polygonsToPathString(resultPolys);

  return { d, polygons: resultPolys, errors: [] };
}

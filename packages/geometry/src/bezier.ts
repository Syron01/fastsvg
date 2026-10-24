import type { PathSegment } from "./path.js";

// Bézier değerlendirme, gerçek ekstremum tabanlı bounds, arc length ve nokta hesabı.
// Arc length adaptive değil, Gauss-Legendre kadratürü (n=8): deterministik ve hızlı.

export interface Point {
  x: number;
  y: number;
}

export function evalQuadratic(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function evalCubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

// Bézier'in bir eksen boyunca türev kökleri: B'(t) = a·t² + b·t + c.
// Katsayılar B(t)=c0+3c1t+3c2t²+c3t³ açılımından: a=3c3, b=2c2, c=c1 (c1=3(a1-a0) vb.).
function extrema1d(a0: number, a1: number, a2: number, a3: number): number[] {
  const a = 3 * a3 - 9 * a2 + 9 * a1 - 3 * a0;
  const b = 6 * a0 - 12 * a1 + 6 * a2;
  const c = 3 * (a1 - a0);
  const roots: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) {
      roots.push(-c / b);
    }
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      roots.push((-b + sq) / (2 * a), (-b - sq) / (2 * a));
    }
  }
  return roots.filter((t) => t > 1e-9 && t < 1 - 1e-9);
}

export function cubicSegmentBounds(p0: Point, p1: Point, p2: Point, p3: Point): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Math.min(p0.x, p3.x);
  let maxX = Math.max(p0.x, p3.x);
  let minY = Math.min(p0.y, p3.y);
  let maxY = Math.max(p0.y, p3.y);
  const consider = (t: number): void => {
    const p = evalCubic(p0, p1, p2, p3, t);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  };
  for (const t of extrema1d(p0.x, p1.x, p2.x, p3.x)) consider(t);
  for (const t of extrema1d(p0.y, p1.y, p2.y, p3.y)) consider(t);
  return { minX, minY, maxX, maxY };
}

export function quadraticSegmentBounds(p0: Point, p1: Point, p2: Point): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Math.min(p0.x, p2.x);
  let maxX = Math.max(p0.x, p2.x);
  let minY = Math.min(p0.y, p2.y);
  let maxY = Math.max(p0.y, p2.y);
  for (const axis of ["x", "y"] as const) {
    const a = p0[axis];
    const b = p1[axis];
    const c = p2[axis];
    const denom = 2 * (a - 2 * b + c);
    if (Math.abs(denom) > 1e-12) {
      const t = (a - b) / denom;
      if (t > 1e-9 && t < 1 - 1e-9) {
        const v = evalQuadratic(p0, p1, p2, t)[axis];
        if (axis === "x") {
          minX = Math.min(minX, v);
          maxX = Math.max(maxX, v);
        } else {
          minY = Math.min(minY, v);
          maxY = Math.max(maxY, v);
        }
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

// 8 noktalı Gauss-Legendre kadratür katsayıları ([-1,1] üzerinde).
const GL_NODES = [0.1834346424956298, 0.5254644090883573, 0.7966664774136267, 0.9602898564975362];
const GL_WEIGHTS = [0.362683783378362, 0.31370664587788727, 0.22238103445337448, 0.10122853629037626];

function cubicSpeed(p0: Point, p1: Point, p2: Point, p3: Point, t: number): number {
  const u = 1 - t;
  const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return Math.hypot(dx, dy);
}

export function cubicSegmentLength(p0: Point, p1: Point, p2: Point, p3: Point): number {
  let total = 0;
  for (let i = 0; i < 4; i += 1) {
    const w = GL_WEIGHTS[i]!;
    for (const sign of [-1, 1]) {
      const t = 0.5 + 0.5 * sign * GL_NODES[i]!;
      total += w * cubicSpeed(p0, p1, p2, p3, t);
    }
  }
  return total * 0.5;
}

export function quadraticSegmentLength(p0: Point, p1: Point, p2: Point): number {
  // Kuadratik, kübik açıma çevrilerek aynı kadratürle ölçülür.
  const c1: Point = { x: p0.x + (2 / 3) * (p1.x - p0.x), y: p0.y + (2 / 3) * (p1.y - p0.y) };
  const c2: Point = { x: p2.x + (2 / 3) * (p1.x - p2.x), y: p2.y + (2 / 3) * (p1.y - p2.y) };
  return cubicSegmentLength(p0, c1, c2, p2);
}

export interface PathMeasurement {
  length: number;
  // Her segment için kümülatif uzunluk (segments.length + 1 eleman, [0] = 0).
  cumulative: number[];
}

export function measurePath(segments: PathSegment[]): PathMeasurement {
  const cumulative: number[] = [0];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  for (const s of segments) {
    let added = 0;
    switch (s.cmd) {
      case "M": sx = s.x; sy = s.y; cx = s.x; cy = s.y; break;
      case "L": added = Math.hypot(s.x - cx, s.y - cy); cx = s.x; cy = s.y; break;
      case "H": added = Math.abs(s.x - cx); cx = s.x; break;
      case "V": added = Math.abs(s.y - cy); cy = s.y; break;
      case "C": added = cubicSegmentLength({ x: cx, y: cy }, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }, { x: s.x, y: s.y }); cx = s.x; cy = s.y; break;
      case "S": {
        // Ayrıştırıcı S'yi bağımsız tuttuğu için önceki kontrol yoksa start noktası
        // ikinci kontrol olarak kullanılır (S komutunun SVG yansıtma kuralı ayrı işlenir).
        added = cubicSegmentLength({ x: cx, y: cy }, { x: cx, y: cy }, { x: s.x2, y: s.y2 }, { x: s.x, y: s.y });
        cx = s.x;
        cy = s.y;
        break;
      }
      case "Q": added = quadraticSegmentLength({ x: cx, y: cy }, { x: s.x1, y: s.y1 }, { x: s.x, y: s.y }); cx = s.x; cy = s.y; break;
      case "T": added = Math.hypot(s.x - cx, s.y - cy); cx = s.x; cy = s.y; break;
      case "A": added = Math.hypot(s.x - cx, s.y - cy); cx = s.x; cy = s.y; break;
      case "Z": added = Math.hypot(sx - cx, sy - cy); cx = sx; cy = sy; break;
    }
    cumulative.push(cumulative[cumulative.length - 1]! + added);
  }
  return { length: cumulative[cumulative.length - 1]!, cumulative };
}

// t ∈ [0,1] parametresinde segment üzerindeki nokta (start noktası verilir).
export function pointOnSegment(s: PathSegment, start: Point, t: number): Point {
  switch (s.cmd) {
    case "C": return evalCubic(start, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }, { x: s.x, y: s.y }, t);
    case "Q": return evalQuadratic(start, { x: s.x1, y: s.y1 }, { x: s.x, y: s.y }, t);
    case "L": case "T": return { x: start.x + (s.x - start.x) * t, y: start.y + (s.y - start.y) * t };
    case "H": return { x: start.x + (s.x - start.x) * t, y: start.y };
    case "V": return { x: start.x, y: start.y + (s.y - start.y) * t };
    case "S": return evalCubic(start, { x: start.x, y: start.y }, { x: s.x2, y: s.y2 }, { x: s.x, y: s.y }, t);
    case "A": return { x: start.x + (s.x - start.x) * t, y: start.y + (s.y - start.y) * t };
    case "M": case "Z": return start;
  }
}

// Verilen yol mesafesindeki nokta (sabit parametre değil, arc length ölçülü).
export function pointAtLength(segments: PathSegment[], distance: number): Point | null {
  const m = measurePath(segments);
  if (m.length <= 0) return null;
  const target = Math.max(0, Math.min(distance, m.length));
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const segEndOf = (s: PathSegment): Point => {
    switch (s.cmd) {
      case "H": return { x: s.x, y: cy };
      case "V": return { x: cx, y: s.y };
      case "Z": return { x: sx, y: sy };
      case "M": case "L": case "T": case "C": case "S": case "Q": case "A": return { x: s.x, y: s.y };
    }
  };
  for (let i = 0; i < segments.length; i += 1) {
    const s = segments[i]!;
    const segStart = { x: cx, y: cy };
    const segEnd = segEndOf(s);
    const segLen = m.cumulative[i + 1]! - m.cumulative[i]!;
    if (target <= m.cumulative[i + 1]! || i === segments.length - 1) {
      const t = segLen > 0 ? (target - m.cumulative[i]!) / segLen : 0;
      return pointOnSegment(s, segStart, Math.max(0, Math.min(1, t)));
    }
    if (s.cmd === "M") { sx = s.x; sy = s.y; }
    cx = segEnd.x;
    cy = segEnd.y;
  }
  return null;
}

// Path'i tersine çevirir: subpath'ler ayrı ayrı, komutlar ve kontrol noktaları ters döner.
// Not: S/T gibi yansıtmalı komutlar ters çevrimde kendi kontrol noktalarıyla C/Q'ya indirgenmez;
// S ve T bitiş noktaları korunur, yansıtma ters sırada yeniden hesaplanır (serialize edilen d değeri bu haliyle geçerli değildir).
export function reversePath(segments: PathSegment[]): PathSegment[] {
  type Entry = { start: Point; segs: PathSegment[]; closed: boolean };
  const subpaths: Entry[] = [];
  let current: Entry = { start: { x: 0, y: 0 }, segs: [], closed: false };
  let cx = 0;
  let cy = 0;
  const endOf = (s: PathSegment, px: number, py: number): Point => {
    switch (s.cmd) {
      case "H": return { x: s.x, y: py };
      case "V": return { x: px, y: s.y };
      case "Z": return { x: px, y: py };
      default: return { x: (s as { x: number }).x, y: (s as { y: number }).y };
    }
  };
  for (const s of segments) {
    if (s.cmd === "M") {
      current = { start: { x: s.x, y: s.y }, segs: [], closed: false };
      subpaths.push(current);
      cx = s.x;
      cy = s.y;
    } else {
      current.segs.push(s);
      const e = endOf(s, cx, cy);
      cx = e.x;
      cy = e.y;
      if (s.cmd === "Z") {
        current.closed = true;
        current = { start: { x: cx, y: cy }, segs: [], closed: false };
      }
    }
  }

  const out: PathSegment[] = [];
  for (const sp of subpaths) {
    if (sp.segs.length === 0) continue;
    // Kapalı subpath'te implicit kapanış kenarı, ters çevrilebilsin diye açık L segmentine dönüştürülür.
    const closed = sp.segs[sp.segs.length - 1]!.cmd === "Z";
    const segs = closed ? sp.segs.slice(0, -1) : sp.segs.slice();
    if (closed && segs.length > 0) {
      segs.push({ cmd: "L", x: sp.start.x, y: sp.start.y });
    }
    const last = segs[segs.length - 1]!;
    const subEnd = endOf(last, sp.start.x, sp.start.y);
    out.push({ cmd: "M", x: subEnd.x, y: subEnd.y });
    const startOf = (i: number): Point => {
      if (i === 0) return sp.start;
      const prev = segs[i - 1]!;
      return endOf(prev, sp.start.x, sp.start.y);
    };
    for (let i = segs.length - 1; i >= 0; i -= 1) {
      const s = segs[i]!;
      const segStart = startOf(i);
      switch (s.cmd) {
        case "L": out.push({ cmd: "L", x: segStart.x, y: segStart.y }); break;
        case "H": out.push({ cmd: "H", x: segStart.x }); break;
        case "V": out.push({ cmd: "V", y: segStart.y }); break;
        case "C": out.push({ cmd: "C", x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1, x: segStart.x, y: segStart.y }); break;
        case "S": out.push({ cmd: "S", x2: s.x2, y2: s.y2, x: segStart.x, y: segStart.y }); break;
        case "Q": out.push({ cmd: "Q", x1: s.x1, y1: s.y1, x: segStart.x, y: segStart.y }); break;
        case "T": out.push({ cmd: "T", x: segStart.x, y: segStart.y }); break;
        case "A": out.push({ cmd: "A", rx: s.rx, ry: s.ry, rotation: s.rotation, largeArc: s.largeArc, sweep: s.sweep === 1 ? 0 : 1, x: segStart.x, y: segStart.y }); break;
        case "M": break;
      }
    }
    if (sp.closed) out.push({ cmd: "Z" });
  }
  return out;
}

// Path'e 2D matris uygular ([a b c d e f], SVG konvansiyonu).
export function transformPath(segments: PathSegment[], m: readonly [number, number, number, number, number, number]): PathSegment[] {
  const apply = (x: number, y: number): Point => ({
    x: m[0]! * x + m[2]! * y + m[4]!,
    y: m[1]! * x + m[3]! * y + m[5]!,
  });
  return segments.map((s) => {
    switch (s.cmd) {
      case "M": case "L": case "T": { const p = apply(s.x, s.y); return { ...s, x: p.x, y: p.y }; }
      case "H": return { ...s, x: m[0]! * s.x + m[4]! };
      case "V": return { ...s, y: m[3]! * s.y + m[5]! };
      case "C": {
        const c1 = apply(s.x1, s.y1);
        const c2 = apply(s.x2, s.y2);
        const p = apply(s.x, s.y);
        return { ...s, x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y, x: p.x, y: p.y };
      }
      case "S": { const c2 = apply(s.x2, s.y2); const p = apply(s.x, s.y); return { ...s, x2: c2.x, y2: c2.y, x: p.x, y: p.y }; }
      case "Q": { const c1 = apply(s.x1, s.y1); const p = apply(s.x, s.y); return { ...s, x1: c1.x, y1: c1.y, x: p.x, y: p.y }; }
      case "A": return s; // Elips transformu ayrı konu; v0.2 bilinen sınırlama.
      case "Z": return s;
    }
  });
}

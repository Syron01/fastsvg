// RGBA framebuffer ve temel rasterizasyon.
// AA yöntemi: piksel başına 2×2 supersampling. Bellek: w*h*4 byte; sınırlar validate'de.

import { parsePath, evalCubic, evalQuadratic, type PathSegment } from "@fastsvg/geometry";

export interface Framebuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA, satır sıralı
}

export class FrameBufferError extends Error {}

export const MAX_DIMENSION = 8192;
export const MAX_PIXELS = 33_554_432; // 8192×4096 üstü reddedilir (bellek bütçesi)

export function createFramebuffer(width: number, height: number, background?: [number, number, number, number]): Framebuffer {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new FrameBufferError(`Geçersiz boyut: ${width}×${height}`);
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS) {
    throw new FrameBufferError(`Boyut sınırı aşıldı: ${width}×${height} (max ${MAX_DIMENSION}, ${MAX_PIXELS} piksel)`);
  }
  const data = new Uint8ClampedArray(width * height * 4);
  const fb: Framebuffer = { width, height, data };
  if (background) {
    for (let i = 0; i < width * height; i += 1) {
      data[i * 4] = background[0]!;
      data[i * 4 + 1] = background[1]!;
      data[i * 4 + 2] = background[2]!;
      data[i * 4 + 3] = background[3]!;
    }
  }
  return fb;
}

// Tek piksel üzerine source-over alpha blend.
export function blendPixel(fb: Framebuffer, x: number, y: number, rgba: [number, number, number, number], coverage = 1): void {
  if (x < 0 || y < 0 || x >= fb.width || y >= fb.height) return;
  const idx = (y * fb.width + x) * 4;
  const sa = (rgba[3]! / 255) * coverage;
  if (sa <= 0) return;
  const da = fb.data[idx + 3]! / 255;
  const outA = sa + da * (1 - sa);
  if (outA <= 0) {
    fb.data[idx] = 0;
    fb.data[idx + 1] = 0;
    fb.data[idx + 2] = 0;
    fb.data[idx + 3] = 0;
    return;
  }
  for (let c = 0; c < 3; c += 1) {
    const sc = rgba[c]! * sa;
    const dc = fb.data[idx + c]! * da * (1 - sa);
    fb.data[idx + c] = Math.round((sc + dc) / outA);
  }
  fb.data[idx + 3] = Math.round(outA * 255);
}

export interface FillStyle {
  color: [number, number, number, number];
}

// Even-odd kuralıyla çokgen doldurma (2×2 supersampling ile AA).
export function fillPolygon(fb: Framebuffer, points: { x: number; y: number }[], style: FillStyle): void {
  if (points.length < 3) return;
  const SS = 2;
  const sub = SS * SS;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const yStart = Math.max(0, Math.floor(minY));
  const yEnd = Math.min(fb.height - 1, Math.ceil(maxY));
  for (let y = yStart; y <= yEnd; y += 1) {
    for (let x = 0; x < fb.width; x += 1) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (pointInPolygonEvenOdd(px, py, points)) hits += 1;
        }
      }
      if (hits > 0) blendPixel(fb, x, y, style.color, hits / sub);
    }
  }
}

export function pointInPolygonEvenOdd(px: number, py: number, points: { x: number; y: number }[]): boolean {
  let inside = false;
  let j = points.length - 1;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[j]!;
    const intersects = a.y > py !== b.y > py && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
    j = i;
  }
  return inside;
}

export function fillRect(fb: Framebuffer, x: number, y: number, w: number, h: number, style: FillStyle): void {
  fillPolygon(fb, [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ], style);
}

export function fillCircle(fb: Framebuffer, cx: number, cy: number, r: number, style: FillStyle): void {
  if (r <= 0) return;
  const SS = 2;
  const sub = SS * SS;
  const yStart = Math.max(0, Math.floor(cy - r));
  const yEnd = Math.min(fb.height - 1, Math.ceil(cy + r));
  const xStart = Math.max(0, Math.floor(cx - r));
  const xEnd = Math.min(fb.width - 1, Math.ceil(cx + r));
  for (let y = yStart; y <= yEnd; y += 1) {
    for (let x = xStart; x <= xEnd; x += 1) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if ((px - cx) ** 2 + (py - cy) ** 2 <= r * r) hits += 1;
        }
      }
      if (hits > 0) blendPixel(fb, x, y, style.color, hits / sub);
    }
  }
}

// Kalın çizgi: segment başına dikdörtgen + uçlarda dolu daire (round join/cap yaklaşımı).
export function strokePolyline(fb: Framebuffer, points: { x: number; y: number }[], widthPx: number, style: FillStyle): void {
  if (points.length < 2 || widthPx <= 0) return;
  const half = widthPx / 2;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1e-9) continue;
    const nx = (-(b.y - a.y) / len) * half;
    const ny = ((b.x - a.x) / len) * half;
    fillPolygon(fb, [
      { x: a.x + nx, y: a.y + ny },
      { x: b.x + nx, y: b.y + ny },
      { x: b.x - nx, y: b.y - ny },
      { x: a.x - nx, y: a.y - ny },
    ], style);
    fillCircle(fb, a.x, a.y, half, style);
    fillCircle(fb, b.x, b.y, half, style);
  }
}

// Path segmentlerini polyline'lara düzleştirir (subpath başına bir dizi).
export function flattenPath(segments: PathSegment[], curveSteps = 24): { x: number; y: number }[][] {
  const subpaths: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const push = (): void => {
    if (current.length >= 3) subpaths.push(current);
    current = [];
  };
  for (const s of segments) {
    switch (s.cmd) {
      case "M":
        push();
        sx = s.x;
        sy = s.y;
        current.push({ x: s.x, y: s.y });
        cx = s.x;
        cy = s.y;
        break;
      case "L": current.push({ x: s.x, y: s.y }); cx = s.x; cy = s.y; break;
      case "H": current.push({ x: s.x, y: cy }); cx = s.x; break;
      case "V": current.push({ x: cx, y: s.y }); cy = s.y; break;
      case "C": {
        for (let i = 1; i <= curveSteps; i += 1) {
          const p = evalCubic({ x: cx, y: cy }, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }, { x: s.x, y: s.y }, i / curveSteps);
          current.push(p);
        }
        cx = s.x;
        cy = s.y;
        break;
      }
      case "S": {
        for (let i = 1; i <= curveSteps; i += 1) {
          const p = evalCubic({ x: cx, y: cy }, { x: cx, y: cy }, { x: s.x2, y: s.y2 }, { x: s.x, y: s.y }, i / curveSteps);
          current.push(p);
        }
        cx = s.x;
        cy = s.y;
        break;
      }
      case "Q": {
        for (let i = 1; i <= curveSteps; i += 1) {
          const p = evalQuadratic({ x: cx, y: cy }, { x: s.x1, y: s.y1 }, { x: s.x, y: s.y }, i / curveSteps);
          current.push(p);
        }
        cx = s.x;
        cy = s.y;
        break;
      }
      case "T": current.push({ x: s.x, y: s.y }); cx = s.x; cy = s.y; break;
      case "A": {
        // Elips yayı düzleştirme: merkez parametrizasyonuna çevirme.
        const arc = flattenArc(cx, cy, s);
        current.push(...arc);
        cx = s.x;
        cy = s.y;
        break;
      }
      case "Z":
        if (current.length > 0) current.push({ x: sx, y: sy });
        push();
        cx = sx;
        cy = sy;
        break;
    }
  }
  push();
  return subpaths;
}

export function flattenArc(x0: number, y0: number, s: Extract<PathSegment, { cmd: "A" }>, steps = 24): { x: number; y: number }[] {
  // SVG arc → merkez parametrizasyonu (W3C F.6.5 algoritması).
  const x1 = s.x;
  const y1 = s.y;
  const rx = Math.abs(s.rx);
  const ry = Math.abs(s.ry);
  if (rx === 0 || ry === 0) return [{ x: x1, y: y1 }];
  const phi = (s.rotation * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const dx2 = (x0 - x1) / 2;
  const dy2 = (y0 - y1) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;
  const lambda = (x1p / rx) ** 2 + (y1p / ry) ** 2;
  let rxAdj = rx;
  let ryAdj = ry;
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rxAdj = rx * scale;
    ryAdj = ry * scale;
  }
  const sign = s.largeArc !== s.sweep ? 1 : -1;
  const numerator = rxAdj ** 2 * ryAdj ** 2 - rxAdj ** 2 * y1p ** 2 - ryAdj ** 2 * x1p ** 2;
  const denom = rxAdj ** 2 * y1p ** 2 + ryAdj ** 2 * x1p ** 2;
  const co = Math.sqrt(Math.max(0, numerator / (denom || 1)));
  const cxp = sign * co * (rxAdj * y1p) / ryAdj;
  const cyp = sign * -co * (ryAdj * x1p) / rxAdj;
  const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x1) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y1) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rxAdj, (y1p - cyp) / ryAdj);
  let deltaTheta = angle((x1p - cxp) / rxAdj, (y1p - cyp) / ryAdj, (-x1p - cxp) / rxAdj, (-y1p - cyp) / ryAdj);
  if (!s.sweep && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
  if (s.sweep && deltaTheta < 0) deltaTheta += 2 * Math.PI;
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = theta1 + (deltaTheta * i) / steps;
    const ex = rxAdj * Math.cos(t);
    const ey = ryAdj * Math.sin(t);
    out.push({ x: cosPhi * ex - sinPhi * ey + cx, y: sinPhi * ex + cosPhi * ey + cy });
  }
  return out;
}

export function fillPath(fb: Framebuffer, d: string, style: FillStyle): { subpaths: number; errors: string[] } {
  const parsed = parsePath(d);
  if (parsed.errors.length > 0) return { subpaths: 0, errors: parsed.errors };
  const subpaths = flattenPath(parsed.segments);
  for (const sp of subpaths) fillPolygon(fb, sp, style);
  return { subpaths: subpaths.length, errors: [] };
}

export function strokePath(fb: Framebuffer, d: string, widthPx: number, style: FillStyle): { subpaths: number; errors: string[] } {
  const parsed = parsePath(d);
  if (parsed.errors.length > 0) return { subpaths: 0, errors: parsed.errors };
  const subpaths = flattenPath(parsed.segments);
  for (const sp of subpaths) strokePolyline(fb, sp, widthPx, style);
  return { subpaths: subpaths.length, errors: [] };
}

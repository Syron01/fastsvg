// SceneDocument → framebuffer render.
// v0.3: url(#id) gradient fill (linear/radial, LUT), statik alt katman önbelleği.

import type { SceneDocument, SceneNode, ShapeStyle, Transform2d } from "@fastsvg/scene-ir";
import { parseHexColor } from "@fastsvg/color-engine";
import { parsePath } from "@fastsvg/geometry";
import {
  createFramebuffer, fillRect, fillCircle, fillPolygon, fillPath, strokePolyline, flattenPath,
  buildGradientLut, type Framebuffer, type FillStyle, type GradientPaint, type GradientStopRgba,
} from "./raster.js";

export interface SceneRenderResult {
  framebuffer: Framebuffer;
  warnings: string[];
  renderedNodes: number;
}

export interface RenderOverrides {
  // Track örneklemesi sonucu node bazlı düzeltmeler.
  translateX?: Record<string, number>;
  translateY?: Record<string, number>;
  opacity?: Record<string, number>;
}

/** Raster tarafa yapısal (gradyan motorundan bağımsız) gradient tanımı. */
export interface SceneGradient {
  id: string;
  kind: "linear" | "radial";
  stops: { offset: number; color: string; opacity?: number }[];
  // linear koordinatları
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // radial koordinatları
  cx?: number;
  cy?: number;
  r?: number;
  units?: "objectBoundingBox" | "userSpaceOnUse";
}

export interface SceneRenderOptions {
  gradients?: SceneGradient[];
  // Statik alt katman: frame başına kopyalanır, yeniden rasterlenmez.
  baseLayer?: Framebuffer;
  // Bu frame'de çizilmeyecek node'lar (baseLayer'a giren statik ön ek).
  skipNodeIds?: ReadonlySet<string>;
}

function applyTransform(p: { x: number; y: number }, t: Transform2d | undefined, dx: number, dy: number): { x: number; y: number } {
  const m = t?.matrix;
  const x = m ? m[0]! * p.x + m[2]! * p.y + m[4]! : p.x;
  const y = m ? m[1]! * p.x + m[3]! * p.y + m[5]! : p.y;
  return { x: x + dx, y: y + dy };
}

const URL_FILL = /^url\(#([\w-]+)\)$/;

// Gerçek bbox: tüm şekil tipleri için nokta listesi üzerinden.
function shapePoints(node: SceneNode): { x: number; y: number }[] {
  const p = node.props ?? {};
  switch (node.type) {
    case "rect": {
      const x = p.x ?? 0;
      const y = p.y ?? 0;
      return [{ x, y }, { x: x + (p.width ?? 0), y }, { x: x + (p.width ?? 0), y: y + (p.height ?? 0) }, { x, y: y + (p.height ?? 0) }];
    }
    case "circle": return [{ x: (p.cx ?? 0) - (p.r ?? 0), y: p.cy ?? 0 }, { x: (p.cx ?? 0) + (p.r ?? 0), y: p.cy ?? 0 }, { x: p.cx ?? 0, y: (p.cy ?? 0) - (p.r ?? 0) }, { x: p.cx ?? 0, y: (p.cy ?? 0) + (p.r ?? 0) }];
    case "ellipse": return [{ x: (p.cx ?? 0) - (p.rx ?? 0), y: p.cy ?? 0 }, { x: (p.cx ?? 0) + (p.rx ?? 0), y: p.cy ?? 0 }, { x: p.cx ?? 0, y: (p.cy ?? 0) - (p.ry ?? 0) }, { x: p.cx ?? 0, y: (p.cy ?? 0) + (p.ry ?? 0) }];
    case "polygon": case "polyline": {
      const out: { x: number; y: number }[] = [];
      for (let i = 0; i + 1 < (p.points ?? []).length; i += 2) out.push({ x: p.points![i]!, y: p.points![i + 1]! });
      return out;
    }
    case "line": return [{ x: p.x ?? 0, y: p.y ?? 0 }, { x: p.x ?? 0, y: p.y ?? 0 }];
    case "path": {
      if (!p.d) return [];
      return flattenPath(parsePath(p.d).segments).flat();
    }
    default: return [];
  }
}

function resolveGradientPaint(grad: SceneGradient, node: SceneNode, warnings: string[], nodeId: string, lutCache: Map<string, GradientPaint>): GradientPaint | null {
  const cached = lutCache.get(grad.id);
  if (cached) return cached;
  const stops: GradientStopRgba[] = [];
  for (const s of grad.stops) {
    const rgb = parseHexColor(s.color);
    if (!rgb) {
      warnings.push(`Node ${nodeId}: gradient ${grad.id} stop rengi geçersiz (${s.color})`);
      return null;
    }
    stops.push({ offset: s.offset, color: [Math.round(rgb.r * 255), Math.round(rgb.g * 255), Math.round(rgb.b * 255), Math.round((s.opacity ?? 1) * 255)] });
  }
  if (stops.length < 2) {
    warnings.push(`Node ${nodeId}: gradient ${grad.id} için en az 2 stop gerekli`);
    return null;
  }
  const lut = buildGradientLut(stops);
  let paint: GradientPaint;
  if (grad.units !== "objectBoundingBox") {
    if (grad.kind === "linear") {
      paint = { kind: "linear", x1: grad.x1 ?? 0, y1: grad.y1 ?? 0, x2: grad.x2 ?? 0, y2: grad.y2 ?? 0, lut };
    } else {
      paint = { kind: "radial", cx: grad.cx ?? 0, cy: grad.cy ?? 0, r: grad.r ?? 1, lut };
    }
  } else {
    const pts = shapePoints(node);
    if (pts.length === 0) {
      warnings.push(`Node ${nodeId}: objectBoundingBox gradient için bbox çıkarılamadı`);
      return null;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pt of pts) {
      minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y);
    }
    const w = maxX - minX;
    const h = maxY - minY;
    if (grad.kind === "linear") {
      paint = { kind: "linear", x1: minX + (grad.x1 ?? 0) * w, y1: minY + (grad.y1 ?? 0) * h, x2: minX + (grad.x2 ?? 0) * w, y2: minY + (grad.y2 ?? 0) * h, lut };
    } else {
      // SVG bbox birim çemberi bbox'a gerer; pratik yaklaşımla r büyük ekseni ölçekler.
      paint = { kind: "radial", cx: minX + (grad.cx ?? 0.5) * w, cy: minY + (grad.cy ?? 0.5) * h, r: (grad.r ?? 0.5) * Math.max(w, h), lut };
    }
  }
  lutCache.set(grad.id, paint);
  return paint;
}

function toFillStyle(style: ShapeStyle | undefined, node: SceneNode, opacity: number | undefined, warnings: string[], gradients: SceneGradient[] | undefined, lutCache: Map<string, GradientPaint>): FillStyle | null {
  if (!style?.fill) return null;
  const urlMatch = URL_FILL.exec(style.fill.color);
  if (urlMatch) {
    const gradId = urlMatch[1]!;
    const grad = gradients?.find((g) => g.id === gradId);
    if (!grad) {
      warnings.push(`Node ${node.id}: fill gradient ${gradId} tanımlı değil, node atlandı`);
      return null;
    }
    const paint = resolveGradientPaint(grad, node, warnings, node.id, lutCache);
    if (!paint) return null;
    const alpha = Math.round((style.fill.opacity ?? 1) * (opacity ?? 1) * 255);
    return { color: [255, 255, 255, alpha], gradient: paint };
  }
  const color = parseHexColor(style.fill.color);
  if (!color) {
    warnings.push(`Node ${node.id}: geçersiz fill rengi ${style.fill.color}, node atlandı`);
    return null;
  }
  const alpha = Math.round((style.fill.opacity ?? 1) * (opacity ?? 1) * 255);
  return { color: [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), alpha] };
}

function toStrokeStyle(style: ShapeStyle | undefined, opacity: number | undefined, warnings: string[], nodeId: string): { style: FillStyle; width: number } | null {
  if (!style?.stroke) return null;
  const color = parseHexColor(style.stroke.color);
  if (!color) {
    warnings.push(`Node ${nodeId}: geçersiz stroke rengi, node atlandı`);
    return null;
  }
  const alpha = Math.round((style.stroke.opacity ?? 1) * (opacity ?? 1) * 255);
  return {
    style: { color: [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), alpha] },
    width: style.stroke.widthPx,
  };
}

export function renderScene(doc: SceneDocument, overrides: RenderOverrides = {}, options: SceneRenderOptions = {}): SceneRenderResult {
  const warnings: string[] = [];
  const lutCache = new Map<string, GradientPaint>();
  let fb: Framebuffer;
  if (options.baseLayer) {
    if (options.baseLayer.width !== doc.viewport.width || options.baseLayer.height !== doc.viewport.height) {
      throw new Error("baseLayer boyutu viewport ile uyuşmuyor");
    }
    // Statik alt katman kopyalanır; üzerinde bu frame'in node'ları çizilir.
    fb = createFramebuffer(doc.viewport.width, doc.viewport.height);
    fb.data.set(options.baseLayer.data);
  } else {
    const bg = doc.viewport.background ? parseHexColor(doc.viewport.background) : { r: 0, g: 0, b: 0 };
    fb = createFramebuffer(doc.viewport.width, doc.viewport.height, bg ? [Math.round(bg.r * 255), Math.round(bg.g * 255), Math.round(bg.b * 255), 255] : [0, 0, 0, 255]);
  }
  let renderedNodes = 0;

  for (const node of doc.nodes) {
    if (node.hidden || node.type === "group") continue;
    if (options.skipNodeIds?.has(node.id)) continue;
    const dx = overrides.translateX?.[node.id] ?? 0;
    const dy = overrides.translateY?.[node.id] ?? 0;
    const opacity = overrides.opacity?.[node.id];
    const fill = toFillStyle(node.style, node, opacity, warnings, options.gradients, lutCache);
    const stroke = toStrokeStyle(node.style, opacity, warnings, node.id);
    const p = node.props ?? {};

    switch (node.type) {
      case "rect": {
        if (fill) {
          fillRect(fb, (p.x ?? 0) + dx, (p.y ?? 0) + dy, p.width ?? 0, p.height ?? 0, fill);
          renderedNodes += 1;
        }
        if (stroke) outlineRect(fb, p.x ?? 0, p.y ?? 0, p.width ?? 0, p.height ?? 0, dx, dy, stroke);
        break;
      }
      case "circle": {
        if (fill) {
          fillCircle(fb, (p.cx ?? 0) + dx, (p.cy ?? 0) + dy, p.r ?? 0, fill);
          renderedNodes += 1;
        }
        break;
      }
      case "ellipse": {
        if (fill) {
          fillEllipse(fb, (p.cx ?? 0) + dx, (p.cy ?? 0) + dy, p.rx ?? 0, p.ry ?? 0, fill);
          renderedNodes += 1;
        }
        break;
      }
      case "polygon": case "polyline": {
        const points = (p.points ?? []).reduce<{ x: number; y: number }[]>((acc, v, i) => {
          if (i % 2 === 0) acc.push({ x: v, y: 0 });
          else acc[acc.length - 1]!.y = v;
          return acc;
        }, []).map((pt) => applyTransform(pt, node.transform, dx, dy));
        if (points.length >= 3 && fill) {
          fillPolygon(fb, points, fill);
          renderedNodes += 1;
        }
        if (stroke && points.length >= 2) strokePolyline(fb, points, stroke.width, stroke.style);
        break;
      }
      case "line": {
        if (stroke) {
          strokePolyline(fb, [
            applyTransform({ x: p.x ?? 0, y: p.y ?? 0 }, node.transform, dx, dy),
            applyTransform({ x: p.x ?? 0, y: p.y ?? 0 }, node.transform, dx, dy),
          ], stroke.width, stroke.style);
        }
        break;
      }
      case "path": {
        if (!p.d) break;
        if (fill) {
          const parsed = parsePath(p.d);
          for (const sp of flattenPath(parsed.segments)) {
            fillPolygon(fb, sp.map((pt) => applyTransform(pt, node.transform, dx, dy)), fill);
          }
          renderedNodes += 1;
        }
        if (stroke) {
          const parsed = parsePath(p.d);
          for (const sp of flattenPath(parsed.segments)) {
            strokePolyline(fb, sp.map((pt) => applyTransform(pt, node.transform, dx, dy)), stroke.width, stroke.style);
          }
        }
        break;
      }
      default:
        warnings.push(`Node ${node.id}: tip ${node.type} rasterlenemedi`);
    }
  }

  return { framebuffer: fb, warnings, renderedNodes };
}

function outlineRect(fb: Framebuffer, x: number, y: number, w: number, h: number, dx: number, dy: number, stroke: { style: FillStyle; width: number }): void {
  const pts = [
    { x: x + dx, y: y + dy },
    { x: x + w + dx, y: y + dy },
    { x: x + w + dx, y: y + h + dy },
    { x: x + dx, y: y + h + dy },
    { x: x + dx, y: y + dy },
  ];
  // strokePolyline local import döngüsü olmadan kullanılır (aynı modülde).
  strokePolyline(fb, pts, stroke.width, stroke.style);
}

function fillEllipse(fb: Framebuffer, cx: number, cy: number, rx: number, ry: number, style: FillStyle): void {
  if (rx <= 0 || ry <= 0) return;
  const points: { x: number; y: number }[] = [];
  const steps = 48;
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI;
    points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
  }
  fillPolygon(fb, points, style);
}

// SceneDocument → framebuffer render (v0.2: düz dolgu/stroke, gradient fill URL olarak
// henüz rasterlenmez ve uyarı üretir).

import type { SceneDocument, SceneNode, ShapeStyle, Transform2d } from "@fastsvg/scene-ir";
import { parseHexColor } from "@fastsvg/color-engine";
import { parsePath } from "@fastsvg/geometry";
import {
  createFramebuffer, fillRect, fillCircle, fillPolygon, fillPath, strokePolyline, flattenPath,
  type Framebuffer, type FillStyle,
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

function applyTransform(p: { x: number; y: number }, t: Transform2d | undefined, dx: number, dy: number): { x: number; y: number } {
  const m = t?.matrix;
  const x = m ? m[0]! * p.x + m[2]! * p.y + m[4]! : p.x;
  const y = m ? m[1]! * p.x + m[3]! * p.y + m[5]! : p.y;
  return { x: x + dx, y: y + dy };
}

function toFillStyle(style: ShapeStyle | undefined, opacity: number | undefined, warnings: string[], nodeId: string): FillStyle | null {
  if (!style?.fill) return null;
  if (style.fill.color.startsWith("url(")) {
    warnings.push(`Node ${nodeId}: gradient fill rasterlenebilir sürümde henüz desteklenmiyor, node atlandı`);
    return null;
  }
  const color = parseHexColor(style.fill.color);
  if (!color) {
    warnings.push(`Node ${nodeId}: geçersiz fill rengi ${style.fill.color}, node atlandı`);
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

export function renderScene(doc: SceneDocument, overrides: RenderOverrides = {}): SceneRenderResult {
  const warnings: string[] = [];
  const bg = doc.viewport.background ? parseHexColor(doc.viewport.background) : { r: 0, g: 0, b: 0 };
  const fb = createFramebuffer(doc.viewport.width, doc.viewport.height, bg ? [Math.round(bg.r * 255), Math.round(bg.g * 255), Math.round(bg.b * 255), 255] : [0, 0, 0, 255]);
  let renderedNodes = 0;

  for (const node of doc.nodes) {
    if (node.hidden || node.type === "group") continue;
    const dx = overrides.translateX?.[node.id] ?? 0;
    const dy = overrides.translateY?.[node.id] ?? 0;
    const opacity = overrides.opacity?.[node.id];
    const fill = toFillStyle(node.style, opacity, warnings, node.id);
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

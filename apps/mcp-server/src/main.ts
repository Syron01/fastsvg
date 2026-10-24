#!/usr/bin/env node
// FastSVG MCP Server v0.1 — stdio transport.
// İlk public tool set (şartname 16.2'nin küçültülmüş v0.1 sürümü).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createScene, applyPatch, SCHEMA_VERSION } from "@fastsvg/scene-ir";
import type { PatchOp, SceneDocument, SceneNode, Viewport } from "@fastsvg/scene-ir";
import { parsePath, serializePath, pathBounds } from "@fastsvg/geometry";
import { exportSvgEditable } from "@fastsvg/export-svg";
import {
  createLinearGradient, createRadialGradient, generateStops, analyzeBanding,
  serializeGradient, type Gradient,
} from "@fastsvg/gradient-engine";
import type { Timeline } from "@fastsvg/motion-engine";
import { renderTimelineApng, renderScenePng, PipelineError } from "@fastsvg/frame-pipeline";
import { writeFileSync } from "node:fs";
import { diffImages } from "@fastsvg/vision";
import { decodePng, PngError } from "@fastsvg/apng-exporter";
import { readFileSync } from "node:fs";

const store = new Map<string, SceneDocument>();
const gradients = new Map<string, Gradient>();

const server = new McpServer(
  { name: "fastsvg", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

function ok(summary: string, data: unknown, nextActions: string[] = []) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, summary, data, nextActions }, null, 2) }] };
}

function fail(code: string, message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code, message, retryable: false } }, null, 2) }], isError: true };
}

const NodeSchema = z.object({
  id: z.string(),
  type: z.enum(["group", "rect", "ellipse", "circle", "path", "polygon", "polyline", "line"]),
  parentId: z.string().nullable(),
  role: z.string().optional(),
  transform: z.object({ matrix: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]) }).optional(),
  style: z.record(z.unknown()).optional(),
  props: z.record(z.unknown()).optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  provenance: z.enum(["user", "tool", "imported"]),
}) as unknown as z.ZodType<SceneNode>;

server.tool(
  "fastsvg_create_scene",
  "Yeni bir FastSVG sahnesi (Scene IR) oluşturur ve sahne id'sini döndürür.",
  {
    documentId: z.string().describe("Benzersiz sahne id"),
    name: z.string().describe("Sahne adı"),
    width: z.number().positive().describe("Viewport genişliği (px)"),
    height: z.number().positive().describe("Viewport yüksekliği (px)"),
    background: z.string().optional().describe("Arka plan rengi, örn. #ffffff"),
  },
  ({ documentId, name, width, height, background }) => {
    if (store.has(documentId)) return fail("NODE_EXISTS", `Scene already exists: ${documentId}`);
    const viewport: Viewport = { width, height, ...(background ? { background } : {}) };
    store.set(documentId, createScene({ documentId, name, viewport }));
    return ok(`Sahne oluşturuldu: ${documentId}`, { documentId, schemaVersion: SCHEMA_VERSION });
  },
);

server.tool(
  "fastsvg_apply_patch",
  "Bir sahneye atomik patch uygular: addNode, updateNode, removeNode, moveNode, setViewport.",
  {
    documentId: z.string(),
    ops: z.array(z.object({
      op: z.enum(["addNode", "updateNode", "removeNode", "moveNode", "setViewport"]),
      nodeId: z.string().optional(),
      parentId: z.string().nullable().optional(),
      node: NodeSchema.optional(),
      fields: z.record(z.unknown()).optional(),
      viewport: z.object({ width: z.number(), height: z.number(), background: z.string().optional() }).optional(),
    })).describe("Sırayla uygulanan patch operasyonları"),
  },
  ({ documentId, ops }) => {
    const doc = store.get(documentId);
    if (!doc) return fail("NODE_NOT_FOUND", `Scene not found: ${documentId}`);
    const result = applyPatch(doc, ops as PatchOp[]);
    if (!result.ok) return fail(result.code, result.message);
    return ok(`Patch uygulandı (${result.affectedNodeIds.length} node)`, result);
  },
);

server.tool(
  "fastsvg_get_scene_summary",
  "Sahnenin node envanteri ve viewport özetini döndürür.",
  { documentId: z.string() },
  ({ documentId }) => {
    const doc = store.get(documentId);
    if (!doc) return fail("NODE_NOT_FOUND", `Scene not found: ${documentId}`);
    const byType: Record<string, number> = {};
    for (const n of doc.nodes) byType[n.type] = (byType[n.type] ?? 0) + 1;
    return ok("Sahne özeti", { documentId, name: doc.name, viewport: doc.viewport, nodeCount: doc.nodes.length, byType });
  },
);

server.tool(
  "fastsvg_build_path",
  "SVG path stringini ayrıştırır, normal hale getirir ve bounds hesaplar.",
  { d: z.string().describe("SVG path data"), toAbsolute: z.boolean().optional().describe("Segmentleri mutlak komutlara çevir") },
  ({ d }) => {
    const parsed = parsePath(d);
    if (parsed.errors.length > 0) return fail("INVALID_OP", parsed.errors.join("; "));
    const bounds = pathBounds(parsed.segments);
    return ok("Path ayrıştırıldı", { segmentCount: parsed.segments.length, bounds, absolute: serializePath(parsed.segments) });
  },
);

server.tool(
  "fastsvg_validate_svg",
  "SVG path datasını doğrular: komut sözdizimi, segment sayısı, bounds.",
  { d: z.string() },
  ({ d }) => {
    const parsed = parsePath(d);
    const valid = parsed.errors.length === 0 && parsed.segments.length > 0;
    return ok(valid ? "Path geçerli" : "Path geçersiz", { valid, errors: parsed.errors, segmentCount: parsed.segments.length });
  },
);

const StopSchema = z.object({ offset: z.number(), color: z.string(), opacity: z.number().optional() });

server.tool(
  "fastsvg_create_gradient",
  "Linear veya radial gradient oluşturur; OKLab algısal stop dağıtımı ve banding analizi döner.",
  {
    id: z.string(),
    type: z.enum(["linear", "radial"]),
    from: z.string().describe("Başlangıç rengi, hex"),
    to: z.string().describe("Bitiş rengi, hex"),
    steps: z.number().int().min(2).max(64).optional().describe("Stop sayısı (varsayılan 6)"),
    // linear için:
    x1: z.number().optional(), y1: z.number().optional(), x2: z.number().optional(), y2: z.number().optional(),
    // radial için:
    cx: z.number().optional(), cy: z.number().optional(), r: z.number().optional(),
  },
  (input) => {
    const stops = generateStops(input.from, input.to, input.steps ?? 6);
    if (!stops) return fail("INVALID_OP", "Geçersiz renk girdisi");
    let result;
    if (input.type === "linear") {
      result = createLinearGradient({ id: input.id, x1: input.x1 ?? 0, y1: input.y1 ?? 0, x2: input.x2 ?? 1, y2: input.y2 ?? 0, units: "objectBoundingBox", stops });
    } else {
      if (!input.r || input.r <= 0) return fail("INVALID_OP", "Radial gradient için pozitif r gerekli");
      result = createRadialGradient({ id: input.id, cx: input.cx ?? 0.5, cy: input.cy ?? 0.5, r: input.r, units: "objectBoundingBox", stops });
    }
    if (result.warnings.length > 0) return fail("INVALID_OP", result.warnings.join("; "));
    gradients.set(input.id, result.gradient);
    const banding = analyzeBanding(result.gradient);
    return ok(`Gradient oluşturuldu: ${input.id}`, {
      gradient: result.gradient,
      svgDef: serializeGradient(result.gradient),
      banding,
    });
  },
);

server.tool(
  "fastsvg_export_asset",
  "Sahneyi svg-editable profiliyle SVG stringine dışa aktarır; kayıtlı gradient'ler defs'e eklenir.",
  { documentId: z.string() },
  ({ documentId }) => {
    const doc = store.get(documentId);
    if (!doc) return fail("NODE_NOT_FOUND", `Scene not found: ${documentId}`);
    const result = exportSvgEditable(doc, { gradients: [...gradients.values()] });
    return ok("SVG üretildi", result);
  },
);

server.tool(
  "fastsvg_render_png",
  "Sahneyi raster olarak PNG'ye render eder ve verilen yola yazar.",
  { documentId: z.string(), outPath: z.string().describe("Çıktı .png dosya yolu") },
  ({ documentId, outPath }) => {
    const doc = store.get(documentId);
    if (!doc) return fail("NODE_NOT_FOUND", `Scene not found: ${documentId}`);
    try {
      const result = renderScenePng(doc);
      writeFileSync(outPath, result.buffer);
      return ok(`PNG yazıldı: ${outPath}`, { renderedNodes: result.renderedNodes, warnings: result.warnings });
    } catch (error) {
      return fail("EXPORT_ERROR", error instanceof Error ? error.message : String(error));
    }
  },
);

const TimelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMs: z.number().positive().max(600000),
  frameRate: z.number().min(1).max(240),
  tracks: z.array(z.object({
    id: z.string(),
    targetNodeId: z.string(),
    property: z.enum(["position", "scale", "rotationDeg", "opacity", "translateX", "translateY"]),
    keyframes: z.array(z.object({
      id: z.string(),
      timeMs: z.number().min(0),
      value: z.union([z.number(), z.object({ x: z.number(), y: z.number() }), z.string()]),
      hold: z.boolean().optional(),
      easing: z.union([
        z.object({ type: z.literal("linear") }),
        z.object({ type: z.literal("cubic-bezier"), x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() }),
        z.object({ type: z.literal("steps"), count: z.number(), position: z.enum(["start", "end"]).optional() }),
        z.object({ type: z.literal("spring"), stiffness: z.number(), damping: z.number(), mass: z.number().optional(), initialVelocity: z.number().optional() }),
      ]).optional(),
    })),
    loop: z.object({ mode: z.enum(["none", "repeat", "pingPong"]), count: z.number() }).optional(),
  })),
}) as unknown as z.ZodType<Timeline>;

server.tool(
  "fastsvg_export_apng",
  "Sahne + timeline'dan kare kare APNG üretir ve dosyaya yazar. Animasyonlu PNG: alpha korunur, frame süreleri timeline fps'inden gelir.",
  { documentId: z.string(), timeline: TimelineSchema, outPath: z.string(), loopCount: z.number().int().min(0).optional() },
  ({ documentId, timeline, outPath, loopCount }) => {
    const doc = store.get(documentId);
    if (!doc) return fail("NODE_NOT_FOUND", `Scene not found: ${documentId}`);
    try {
      const result = renderTimelineApng(doc, timeline, loopCount ?? 0);
      writeFileSync(outPath, result.buffer);
      return ok(`APNG yazıldı: ${outPath}`, {
        frameCount: result.frameCount,
        width: result.width,
        height: result.height,
        encodeMs: Math.round(result.encodeMs),
        warnings: result.warnings,
      });
    } catch (error) {
      if (error instanceof PipelineError) return fail("INVALID_OP", error.message);
      return fail("EXPORT_ERROR", error instanceof Error ? error.message : String(error));
    }
  },
);

server.tool(
  "fastsvg_compare_images",
  "İki PNG'yi piksel bazında karşılaştırır: değişen piksel oranı, ortalama hata, değişim bölgesi.",
  { imageAPath: z.string(), imageBPath: z.string(), channelTolerance: z.number().min(0).max(255).optional() },
  ({ imageAPath, imageBPath, channelTolerance }) => {
    try {
      const a = decodePng(readFileSync(imageAPath));
      const b = decodePng(readFileSync(imageBPath));
      if (a.width !== b.width || a.height !== b.height) {
        return fail("INVALID_OP", `Boyutlar farklı: ${a.width}×${a.height} vs ${b.width}×${b.height}`);
      }
      if (a.frameCount !== b.frameCount) {
        return fail("INVALID_OP", `Frame sayısı farklı: ${a.frameCount} vs ${b.frameCount}`);
      }
      // Animasyonlu dosyalarda ilk kare karşılaştırılır; frame bazlı diff ayrı araçtır (v0.3).
      const frameBytes = a.width * a.height * 4;
      const report = diffImages(
        a.rgba.subarray(0, frameBytes),
        b.rgba.subarray(0, frameBytes),
        a.width,
        a.height,
        { channelTolerance: channelTolerance ?? 2 },
      );
      return ok("Karşılaştırma tamamlandı", { ...report, frameCountCompared: 1, totalFrames: a.frameCount });
    } catch (error) {
      if (error instanceof PngError) return fail("INVALID_INPUT", error.message);
      return fail("IO_ERROR", error instanceof Error ? error.message : String(error));
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

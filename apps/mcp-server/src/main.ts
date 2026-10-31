#!/usr/bin/env node
// FastSVG MCP Server v0.4+ — stdio transport.
// Yüksek Hızlı Turbo Araç Seti: Scene IR, 3D Geometri & Işıklandırma, Slayt/Web Kompozisyonları,
// Veri Görselleştirme (Charts), Boolean İşlemleri, Kalite Değerlendirmesi, APNG Delta.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createScene, applyPatch, SCHEMA_VERSION } from "@fastsvg/scene-ir";
import type { PatchOp, SceneDocument, SceneNode, Viewport } from "@fastsvg/scene-ir";
import {
  parsePath, serializePath, pathBounds, pathBoolean, evaluateVisualQuality,
  create3DBox, create3DCylinder, create3DPlane, render3DFaces,
  composeSlideSvg, composeWebHeroSvg,
  generateDonutChartSvg, generateSmoothAreaChartSvg, generateBarChartSvg, generateGaugeMeterSvg,
} from "@fastsvg/geometry";
import { exportSvgEditable } from "@fastsvg/export-svg";
import {
  createLinearGradient, createRadialGradient, generateStops, analyzeBanding,
  serializeGradient, type Gradient,
} from "@fastsvg/gradient-engine";
import type { Timeline } from "@fastsvg/motion-engine";
import { renderTimelineApng, renderScenePng, PipelineError } from "@fastsvg/frame-pipeline";
import { writeFileSync, readFileSync } from "node:fs";
import { diffImages, diffAnimationFrames } from "@fastsvg/vision";
import { decodePng, PngError, encodeApng } from "@fastsvg/apng-exporter";

const store = new Map<string, SceneDocument>();
const gradients = new Map<string, Gradient>();

const server = new McpServer(
  { name: "fastsvg", version: "0.4.0" },
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

server.tool(
  "fastsvg_boolean_paths",
  "İki SVG path verisi üzerinde boolean geometrisi (union, intersection, difference, xor) uygular.",
  {
    subjectD: z.string().describe("Birinci (ana) SVG path stringi"),
    clipD: z.string().describe("İkinci (kırpıcı) SVG path stringi"),
    operation: z.enum(["union", "intersection", "difference", "xor"]).describe("Boolean operasyonu"),
    curveSteps: z.number().int().min(4).max(64).optional().describe("Eğri örnekleme adım sayısı (varsayılan 24)"),
  },
  ({ subjectD, clipD, operation, curveSteps }) => {
    const res = pathBoolean(subjectD, clipD, operation, { curveSteps });
    if (res.errors.length > 0) return fail("INVALID_OP", res.errors.join("; "));
    return ok(`Boolean operasyonu (${operation}) tamamlandı`, {
      d: res.d,
      polygonCount: res.polygons.length,
      operation,
    });
  },
);

server.tool(
  "fastsvg_analyze_quality",
  "Bir SVG path datasının işçilik kalitesini değerlendirir: G0/G1 teğetsel süreklilik, optik denge, görsel ağırlık ve puanlama.",
  { d: z.string().describe("SVG path data") },
  ({ d }) => {
    const parsed = parsePath(d);
    if (parsed.errors.length > 0) return fail("INVALID_OP", parsed.errors.join("; "));
    const report = evaluateVisualQuality(parsed.segments);
    return ok(`Görsel kalite analizi (Puan: ${report.overallScore}/100 - Not: ${report.grade})`, report);
  },
);

// ---- 3D TURBO ARAÇLARI ----

server.tool(
  "fastsvg_render_3d",
  "3D nesneleri (kutu, silindir, yüzen kart mockup) açı, projeksiyon, ışıklandırma ve derinlik sıralamasıyla tek komutta SVG olarak üretir.",
  {
    shape: z.enum(["box", "cylinder", "plane"]).describe("3D Şekil türü"),
    dimensions: z.object({
      width: z.number(),
      height: z.number(),
      depth: z.number().optional(),
      radius: z.number().optional(),
    }).describe("Boyutlar"),
    color: z.string().describe("Ana renk (#hex)"),
    projection: z.enum(["isometric", "perspective", "dimetric", "orthographic"]).optional().describe("Projeksiyon türü (varsayılan: isometric)"),
    rotation: z.object({
      pitch: z.number().optional(),
      yaw: z.number().optional(),
      roll: z.number().optional(),
    }).optional().describe("Rotasyon açıları (derece)"),
    scale: z.number().optional().describe("Ölçek faktörü"),
    center: z.object({ x: z.number(), y: z.number() }).optional().describe("2D Tuval merkezi"),
  },
  ({ shape, dimensions, color, projection, rotation, scale, center }) => {
    let faces;
    if (shape === "box") {
      faces = create3DBox({
        width: dimensions.width,
        height: dimensions.height,
        depth: dimensions.depth ?? dimensions.width,
        color,
      });
    } else if (shape === "cylinder") {
      faces = create3DCylinder({
        radius: dimensions.radius ?? dimensions.width / 2,
        height: dimensions.height,
        color,
      });
    } else {
      faces = [create3DPlane({
        width: dimensions.width,
        height: dimensions.height,
        color,
      })];
    }

    const res = render3DFaces(faces, {
      projection: projection ?? "isometric",
      rotation: rotation ?? { pitch: 20, yaw: 40 },
      scale: scale ?? 1,
      center: center ?? { x: 200, y: 200 },
    });

    return ok(`3D ${shape} render edildi (${res.projectedFaces.length} görünür yüzey)`, {
      svgMarkup: res.svgMarkup,
      faceCount: res.projectedFaces.length,
      faces: res.projectedFaces.map((f) => ({ id: f.id, litColor: f.litColor, pathD: f.pathD })),
    });
  },
);

// ---- TASARIM & SLAYT & WEB TURBO ARAÇLARI ----

server.tool(
  "fastsvg_compose_slide",
  "Profesyonel 16:9 Apple Keynote / Pitch Deck kalitesinde slayt kompozisyonu üretir.",
  {
    title: z.string().describe("Slayt başlığı"),
    subtitle: z.string().optional().describe("Alt açıklama"),
    badge: z.string().optional().describe("Üst hap rozet metni (örn: ARCHITECTURE V2)"),
    theme: z.enum(["dark", "light"]).optional().describe("Renk teması"),
    primaryColor: z.string().optional().describe("Vurgu rengi (#hex)"),
    with3DGraphic: z.boolean().optional().describe("Sağ tarafa 3D izometrik prizma grafiği ekle"),
    cards: z.array(z.object({
      title: z.string(),
      description: z.string(),
      value: z.string().optional(),
      tag: z.string().optional(),
    })).optional().describe("Alt metrik / özellik kartları"),
    width: z.number().optional().describe("Tuval genişliği (varsayılan: 960)"),
    height: z.number().optional().describe("Tuval yüksekliği (varsayılan: 540)"),
  },
  (input) => {
    const svg = composeSlideSvg(input);
    return ok(`Slayt kompozisyonu üretildi: ${input.title}`, { svg, width: input.width ?? 960, height: input.height ?? 540 });
  },
);

server.tool(
  "fastsvg_compose_web",
  "Modern Landing Page Hero Section ve UI Mockup penceresi üretir.",
  {
    brandName: z.string().describe("Marka / Ürün adı"),
    headline: z.string().describe("Ana vuruş başlığı"),
    subheadline: z.string().describe("Açıklama cümlesi"),
    primaryCtaText: z.string().optional().describe("Birincil CTA butonu metni"),
    secondaryCtaText: z.string().optional().describe("İkincil buton metni"),
    theme: z.enum(["dark", "light"]).optional().describe("Tema"),
    primaryColor: z.string().optional().describe("Vurgu rengi (#hex)"),
    width: z.number().optional().describe("Tuval genişliği (varsayılan: 1200)"),
    height: z.number().optional().describe("Tuval yüksekliği (varsayılan: 675)"),
  },
  (input) => {
    const svg = composeWebHeroSvg(input);
    return ok(`Web Hero üretildi: ${input.brandName}`, { svg, width: input.width ?? 1200, height: input.height ?? 675 });
  },
);

server.tool(
  "fastsvg_render_chart",
  "Modern veri infografiği üretir: Donut chart, Smooth area/wave chart, Bar chart veya Gauge meter.",
  {
    type: z.enum(["donut", "area", "bar", "gauge"]).describe("Grafik tipi"),
    cx: z.number().optional().describe("Merkez X"),
    cy: z.number().optional().describe("Merkez Y"),
    radius: z.number().optional().describe("Yarıçap"),
    width: z.number().optional().describe("Genişlik"),
    height: z.number().optional().describe("Yükseklik"),
    data: z.array(z.object({
      label: z.string(),
      value: z.number(),
      color: z.string().optional(),
    })).optional().describe("Veri listesi (donut ve bar için)"),
    values: z.array(z.number()).optional().describe("Sayı dizisi (area chart için)"),
    gaugeValue: z.number().min(0).max(100).optional().describe("Gauge değeri (0..100)"),
    label: z.string().optional().describe("Etiket / başlık"),
    color: z.string().optional().describe("Ana renk (#hex)"),
  },
  (input) => {
    let svgMarkup = "";
    if (input.type === "donut") {
      svgMarkup = generateDonutChartSvg({
        cx: input.cx ?? 120,
        cy: input.cy ?? 120,
        outerRadius: input.radius ?? 100,
        innerRadius: (input.radius ?? 100) * 0.65,
        data: input.data ?? [{ label: "A", value: 40 }, { label: "B", value: 60 }],
        centerText: input.label ? { title: input.label } : undefined,
      });
    } else if (input.type === "area") {
      svgMarkup = generateSmoothAreaChartSvg({
        x: input.cx ?? 0,
        y: input.cy ?? 0,
        width: input.width ?? 300,
        height: input.height ?? 120,
        values: input.values ?? [20, 50, 35, 80, 65, 95],
        lineColor: input.color ?? "#38bdf8",
        dots: true,
      });
    } else if (input.type === "bar") {
      svgMarkup = generateBarChartSvg({
        x: input.cx ?? 0,
        y: input.cy ?? 0,
        width: input.width ?? 300,
        height: input.height ?? 140,
        data: input.data ?? [{ label: "1", value: 30 }, { label: "2", value: 70 }, { label: "3", value: 50 }],
        accentColor: input.color ?? "#3b82f6",
      });
    } else {
      svgMarkup = generateGaugeMeterSvg({
        cx: input.cx ?? 120,
        cy: input.cy ?? 120,
        radius: input.radius ?? 90,
        thickness: 18,
        value: input.gaugeValue ?? 75,
        label: input.label ?? "Performans",
        color: input.color ?? "#38bdf8",
      });
    }

    return ok(`Grafik (${input.type}) üretildi`, { svgMarkup, type: input.type });
  },
);

server.tool(
  "fastsvg_create_gradient",
  "Linear veya radial gradient oluşturur; OKLab algısal stop dağıtımı ve banding analizi döner.",
  {
    id: z.string(),
    type: z.enum(["linear", "radial"]),
    from: z.string().describe("Başlangıç rengi, hex"),
    to: z.string().describe("Bitiş rengi, hex"),
    steps: z.number().int().min(2).max(64).optional().describe("Stop sayısı (varsayılan 6)"),
    x1: z.number().optional(), y1: z.number().optional(), x2: z.number().optional(), y2: z.number().optional(),
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
  "Sahne + timeline'dan delta-frame optimizasyonuyla kare kare APNG üretir ve dosyaya yazar.",
  {
    documentId: z.string(),
    timeline: TimelineSchema,
    outPath: z.string(),
    loopCount: z.number().int().min(0).optional(),
    deltaOptimize: z.boolean().optional().describe("Delta-frame dirty rect optimizasyonu (varsayılan: true)"),
  },
  ({ documentId, timeline, outPath, loopCount, deltaOptimize }) => {
    const doc = store.get(documentId);
    if (!doc) return fail("NODE_NOT_FOUND", `Scene not found: ${documentId}`);
    try {
      const result = renderTimelineApng(doc, timeline, loopCount ?? 0);
      let finalBuffer = result.buffer;
      if (deltaOptimize === false) {
        const decoded = decodePng(result.buffer);
        const frameSize = decoded.width * decoded.height * 4;
        const frames = [];
        for (let i = 0; i < decoded.frameCount; i++) {
          frames.push({
            rgba: decoded.rgba.slice(i * frameSize, (i + 1) * frameSize),
            delayMs: decoded.delaysMs[i] ?? 100,
          });
        }
        finalBuffer = encodeApng({
          width: decoded.width,
          height: decoded.height,
          frames,
          loopCount: decoded.loopCount,
          deltaOptimization: false,
        });
      }

      writeFileSync(outPath, finalBuffer);
      return ok(`APNG yazıldı: ${outPath}`, {
        frameCount: result.frameCount,
        width: result.width,
        height: result.height,
        bytes: finalBuffer.length,
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
  "İki PNG/APNG'yi piksel ve kare bazında karşılaştırır: frame diff, değişen piksel oranı, ortalama hata, değişim bölgesi.",
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

      if (a.frameCount > 1) {
        const animReport = diffAnimationFrames(
          a.rgba,
          b.rgba,
          a.width,
          a.height,
          a.frameCount,
          { channelTolerance: channelTolerance ?? 2 },
        );
        return ok("Animasyon karşılaştırması tamamlandı", animReport);
      }

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

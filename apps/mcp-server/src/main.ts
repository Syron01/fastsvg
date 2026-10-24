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

const store = new Map<string, SceneDocument>();

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
  "fastsvg_export_asset",
  "Sahneyi svg-editable profiliyle SVG stringine dışa aktarır.",
  { documentId: z.string() },
  ({ documentId }) => {
    const doc = store.get(documentId);
    if (!doc) return fail("NODE_NOT_FOUND", `Scene not found: ${documentId}`);
    const result = exportSvgEditable(doc);
    return ok("SVG üretildi", result);
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

const transport = new StdioServerTransport();
await server.connect(transport);

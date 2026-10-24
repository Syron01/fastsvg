import type { SceneDocument, SceneNode } from "@fastsvg/scene-ir";
import { serializeGradient, type Gradient } from "@fastsvg/gradient-engine";

// svg-editable profili: semantik node'lar korunur (şartname 11.3).
export interface ExportResult {
  svg: string;
  nodeCount: number;
  warnings: string[];
}

export interface ExportOptions {
  gradients?: Gradient[];
}

export function exportSvgEditable(doc: SceneDocument, options: ExportOptions = {}): ExportResult {
  const warnings: string[] = [];
  const children = new Map<string | null, SceneNode[]>();
  for (const node of doc.nodes) {
    const list = children.get(node.parentId) ?? [];
    list.push(node);
    children.set(node.parentId, list);
  }
  if (children.get(null) === undefined && doc.nodes.length > 0) {
    warnings.push("No root nodes (parentId=null) found");
  }

  const defs =
    options.gradients && options.gradients.length > 0
      ? `<defs>${options.gradients.map(serializeGradient).join("")}</defs>\n`
      : "";

  const body = renderChildren(children, null, warnings, 1);
  const bg = doc.viewport.background
    ? `\n  <rect width="${doc.viewport.width}" height="${doc.viewport.height}" fill="${escapeAttr(doc.viewport.background)}"/>`
    : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${doc.viewport.width} ${doc.viewport.height}"` +
    ` width="${doc.viewport.width}" height="${doc.viewport.height}" data-fastsvg-document="${escapeAttr(doc.documentId)}">` +
    `<title>${escapeText(doc.name)}</title>${bg}\n${defs}${body}</svg>\n`;

  return { svg, nodeCount: doc.nodes.length, warnings };
}

const SHAPE_TAGS = new Set(["rect", "ellipse", "circle", "path", "polygon", "polyline", "line"]);

function renderChildren(
  children: Map<string | null, SceneNode[]>,
  parentId: string | null,
  warnings: string[],
  depth: number,
): string {
  const indent = "  ".repeat(depth);
  const nodes = children.get(parentId) ?? [];
  return nodes
    .map((node) => {
      if (node.hidden) return "";
      if (node.type === "group") {
        const inner = renderChildren(children, node.id, warnings, depth + 1);
        return `${indent}<g id="${escapeAttr(node.id)}"${commonAttrs(node)}>${inner ? "\n" + inner + indent : ""}</g>\n`;
      }
      if (!SHAPE_TAGS.has(node.type)) {
        warnings.push(`Unsupported node type skipped: ${node.type} (${node.id})`);
        return "";
      }
      const tag = node.type;
      const attrs = shapeAttrs(node);
      return `${indent}<${tag} id="${escapeAttr(node.id)}"${attrs}${commonAttrs(node)}/>\n`;
    })
    .join("");
}

function shapeAttrs(node: SceneNode): string {
  const p = node.props ?? {};
  const out: string[] = [];
  if (p.d !== undefined) out.push(`d="${escapeAttr(p.d)}"`);
  if (p.x !== undefined) out.push(`x="${p.x}"`);
  if (p.y !== undefined) out.push(`y="${p.y}"`);
  if (p.width !== undefined) out.push(`width="${p.width}"`);
  if (p.height !== undefined) out.push(`height="${p.height}"`);
  if (p.cx !== undefined) out.push(`cx="${p.cx}"`);
  if (p.cy !== undefined) out.push(`cy="${p.cy}"`);
  if (p.rx !== undefined) out.push(`rx="${p.rx}"`);
  if (p.ry !== undefined) out.push(`ry="${p.ry}"`);
  if (p.r !== undefined) out.push(`r="${p.r}"`);
  if (p.points !== undefined && p.points.length > 0) out.push(`points="${p.points.join(",")}"`);
  if (node.transform) {
    const [a, b, c, d, e, f] = node.transform.matrix;
    out.push(`transform="matrix(${a} ${b} ${c} ${d} ${e} ${f})"`);
  }
  const style = node.style;
  if (style?.fill !== undefined) out.push(`fill="${escapeAttr(style.fill.color)}"`);
  else if (style) out.push(`fill="none"`);
  if (style?.fill?.opacity !== undefined) out.push(`fill-opacity="${style.fill.opacity}"`);
  if (style?.stroke !== undefined) {
    out.push(`stroke="${escapeAttr(style.stroke.color)}"`);
    out.push(`stroke-width="${style.stroke.widthPx}"`);
    if (style.stroke.linecap) out.push(`stroke-linecap="${style.stroke.linecap}"`);
    if (style.stroke.linejoin) out.push(`stroke-linejoin="${style.stroke.linejoin}"`);
    if (style.stroke.dash?.length) out.push(`stroke-dasharray="${style.stroke.dash.join(" ")}"`);
    if (style.stroke.opacity !== undefined) out.push(`stroke-opacity="${style.stroke.opacity}"`);
  }
  return out.map((a) => ` ${a}`).join("");
}

function commonAttrs(node: SceneNode): string {
  const out: string[] = [];
  if (node.role) out.push(`data-role="${escapeAttr(node.role)}"`);
  if (node.locked) out.push(`data-locked="true"`);
  return out.map((a) => ` ${a}`).join("");
}

export function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

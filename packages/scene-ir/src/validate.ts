import type { PatchResult, SceneNode } from "./types.js";

// NaN/Infinity ve negatif boyutlar validation aşamasında ele alınır (şartname 5.4).
export function validateNode(node: SceneNode): PatchResult {
  if (!node.id || typeof node.id !== "string") {
    return { ok: false, code: "INVALID_OP", message: "Node id must be a non-empty string" };
  }
  const numbers: [string, number | undefined][] = [
    ["x", node.props?.x],
    ["y", node.props?.y],
    ["width", node.props?.width],
    ["height", node.props?.height],
    ["cx", node.props?.cx],
    ["cy", node.props?.cy],
    ["rx", node.props?.rx],
    ["ry", node.props?.ry],
    ["r", node.props?.r],
  ];
  for (const [name, value] of numbers) {
    if (value !== undefined && !Number.isFinite(value)) {
      return { ok: false, code: "INVALID_OP", message: `Node ${node.id}: ${name} must be a finite number` };
    }
  }
  if ((node.props?.width ?? 0) < 0 || (node.props?.height ?? 0) < 0) {
    return { ok: false, code: "INVALID_OP", message: `Node ${node.id}: width/height must be non-negative` };
  }
  if (node.props?.d !== undefined && node.props.d.trim().length === 0) {
    return { ok: false, code: "INVALID_OP", message: `Node ${node.id}: path d must be non-empty` };
  }
  if (node.transform) {
    if (node.transform.matrix.some((v) => !Number.isFinite(v))) {
      return { ok: false, code: "INVALID_OP", message: `Node ${node.id}: transform matrix must be finite` };
    }
  }
  return { ok: true, affectedNodeIds: [node.id] };
}

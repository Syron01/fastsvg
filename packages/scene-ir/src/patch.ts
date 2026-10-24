import type { PatchErrorCode, PatchOp, PatchResult, SceneDocument, SceneNode } from "./types.js";
import { validateNode } from "./validate.js";

// Patch işlemleri atomik uygulanır: hata durumunda sahne yarı bozulmuş bırakılmaz.
export function applyPatch(doc: SceneDocument, ops: PatchOp[]): PatchResult {
  const draft: SceneDocument = structuredClone(doc);
  const affected: string[] = [];

  for (const op of ops) {
    const result = applyOne(draft, op);
    if (!result.ok) return { ok: false, code: result.code, message: result.message };
    affected.push(...result.affectedNodeIds);
  }

  doc.nodes = draft.nodes;
  doc.viewport = draft.viewport;
  return { ok: true, affectedNodeIds: affected };
}

function applyOne(
  doc: SceneDocument,
  op: PatchOp,
): PatchResult {
  switch (op.op) {
    case "addNode":
      return addNode(doc, op);
    case "updateNode":
      return updateNode(doc, op);
    case "removeNode":
      return removeNode(doc, op);
    case "moveNode":
      return moveNode(doc, op);
    case "setViewport":
      if (!op.viewport) return fail("INVALID_OP", "setViewport requires viewport");
      doc.viewport = structuredClone(op.viewport);
      return { ok: true, affectedNodeIds: [] };
    default:
      return fail("INVALID_OP", `Unknown op: ${(op as PatchOp).op}`);
  }
}

function addNode(doc: SceneDocument, op: PatchOp): PatchResult {
  const node = op.node;
  if (!node) return fail("INVALID_OP", "addNode requires node");
  const validation = validateNode(node);
  if (!validation.ok) return validation;

  if (doc.nodes.some((n) => n.id === node.id)) {
    return fail("NODE_EXISTS", `Node already exists: ${node.id}`);
  }
  const parentId = op.parentId ?? node.parentId;
  if (parentId !== null && !doc.nodes.some((n) => n.id === parentId)) {
    return fail("PARENT_NOT_FOUND", `Parent not found: ${parentId}`);
  }
  const stored = structuredClone(node);
  stored.parentId = parentId;
  doc.nodes.push(stored);
  return { ok: true, affectedNodeIds: [node.id] };
}

function updateNode(doc: SceneDocument, op: PatchOp): PatchResult {
  if (!op.nodeId || !op.fields) return fail("INVALID_OP", "updateNode requires nodeId and fields");
  const node = find(doc, op.nodeId);
  if (!node) return fail("NODE_NOT_FOUND", `Node not found: ${op.nodeId}`);
  if (node.locked && op.fields.locked === undefined) {
    return fail("LOCKED", `Node is locked: ${node.id}`);
  }
  const merged: SceneNode = { ...node, ...op.fields, id: node.id, type: node.type, provenance: node.provenance };
  const validation = validateNode(merged);
  if (!validation.ok) return validation;
  Object.assign(node, op.fields, { id: node.id, type: node.type, provenance: node.provenance });
  return { ok: true, affectedNodeIds: [node.id] };
}

function removeNode(doc: SceneDocument, op: PatchOp): PatchResult {
  if (!op.nodeId) return fail("INVALID_OP", "removeNode requires nodeId");
  const subtree = collectSubtree(doc, op.nodeId);
  if (subtree.length === 0) return fail("NODE_NOT_FOUND", `Node not found: ${op.nodeId}`);
  const target = find(doc, op.nodeId)!;
  if (target.locked) return fail("LOCKED", `Node is locked: ${target.id}`);
  doc.nodes = doc.nodes.filter((n) => !subtree.includes(n.id));
  return { ok: true, affectedNodeIds: subtree };
}

function moveNode(doc: SceneDocument, op: PatchOp): PatchResult {
  if (!op.nodeId) return fail("INVALID_OP", "moveNode requires nodeId");
  if (op.parentId === undefined) return fail("INVALID_OP", "moveNode requires parentId");
  const node = find(doc, op.nodeId);
  if (!node) return fail("NODE_NOT_FOUND", `Node not found: ${op.nodeId}`);
  if (op.parentId !== null) {
    if (!find(doc, op.parentId)) return fail("PARENT_NOT_FOUND", `Parent not found: ${op.parentId}`);
    if (collectSubtree(doc, op.nodeId).includes(op.parentId)) {
      return fail("CYCLE", `Cannot move node under its own subtree: ${op.parentId}`);
    }
  }
  node.parentId = op.parentId;
  return { ok: true, affectedNodeIds: [node.id] };
}

export function find(doc: SceneDocument, id: string): SceneNode | undefined {
  return doc.nodes.find((n) => n.id === id);
}

function collectSubtree(doc: SceneDocument, rootId: string): string[] {
  const out: string[] = [rootId];
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of doc.nodes) {
      if (n.parentId && out.includes(n.parentId) && !out.includes(n.id)) {
        out.push(n.id);
        grew = true;
      }
    }
  }
  return out;
}

function fail(code: PatchErrorCode, message: string): PatchResult {
  return { ok: false, code, message };
}

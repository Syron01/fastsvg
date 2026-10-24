import { applyPatch } from "./patch.js";
import { validateNode } from "./validate.js";
import { SCHEMA_VERSION, type PatchOp, type PatchResult, type SceneDocument, type SceneNode, type Viewport } from "./types.js";

export function createScene(input: {
  documentId: string;
  name: string;
  viewport: Viewport;
  nodes?: SceneNode[];
}): SceneDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    documentId: input.documentId,
    name: input.name,
    viewport: structuredClone(input.viewport),
    nodes: structuredClone(input.nodes ?? []),
  };
}

export { applyPatch, validateNode };
export * from "./types.js";

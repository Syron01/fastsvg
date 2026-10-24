// Scene IR: biçimden bağımsız ana veri modeli (şartname bölüm 5).
// SVG string kaynak değil, çıktı formatlarından biridir.

export const SCHEMA_VERSION = "0.1";

export interface Viewport {
  width: number;
  height: number;
  background?: string;
}

export interface FillStyle {
  color: string;
  opacity?: number;
}

export interface StrokeStyle {
  color: string;
  widthPx: number;
  linecap?: "butt" | "round" | "square";
  linejoin?: "miter" | "round" | "bevel";
  dash?: number[];
  opacity?: number;
}

export interface ShapeStyle {
  fill?: FillStyle;
  stroke?: StrokeStyle;
}

export interface Transform2d {
  // [a b c d e f] — SVG matris konvansiyonu, çarpım sırası: child sonra parent.
  matrix: readonly [number, number, number, number, number, number];
}

export type ShapeProps = {
  d?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  r?: number;
  points?: number[];
};

export type SceneNode = {
  id: string;
  type: "group" | "rect" | "ellipse" | "circle" | "path" | "polygon" | "polyline" | "line";
  parentId: string | null;
  role?: string;
  transform?: Transform2d;
  style?: ShapeStyle;
  props?: ShapeProps;
  locked?: boolean;
  hidden?: boolean;
  provenance: "user" | "tool" | "imported";
};

export interface SceneDocument {
  schemaVersion: string;
  documentId: string;
  name: string;
  viewport: Viewport;
  nodes: SceneNode[];
}

export interface PatchOp {
  op:
    | "addNode"
    | "updateNode"
    | "removeNode"
    | "moveNode"
    | "setViewport";
  nodeId?: string;
  node?: SceneNode;
  parentId?: string | null;
  fields?: Partial<SceneNode>;
  viewport?: Viewport;
}

export type PatchResult =
  | { ok: true; affectedNodeIds: string[] }
  | { ok: false; code: PatchErrorCode; message: string };

export type PatchErrorCode =
  | "NODE_NOT_FOUND"
  | "NODE_EXISTS"
  | "PARENT_NOT_FOUND"
  | "CYCLE"
  | "INVALID_OP"
  | "LOCKED";

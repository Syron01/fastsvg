// SVG path string parse/serialize ve bounds hesabı (şartname 6.1).
// v0.1 kapsamı: M, L, H, V, C, S, Q, T, A, Z — absolute ve relative.

export type PathSegment =
  | { cmd: "M" | "L" | "T"; x: number; y: number }
  | { cmd: "H"; x: number }
  | { cmd: "V"; y: number }
  | { cmd: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { cmd: "S"; x2: number; y2: number; x: number; y: number }
  | { cmd: "Q"; x1: number; y1: number; x: number; y: number }
  | { cmd: "A"; rx: number; ry: number; rotation: number; largeArc: 0 | 1; sweep: 0 | 1; x: number; y: number }
  | { cmd: "Z" };

export interface ParsedPath {
  segments: PathSegment[];
  errors: string[];
}

const ARG_COUNTS: Record<string, number> = {
  M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
};

export function parsePath(d: string): ParsedPath {
  const errors: string[] = [];
  const tokens = tokenize(d);
  const segments: PathSegment[] = [];
  let i = 0;
  let cmd = "";
  let absolute = true;
  let cx = 0;
  let cy = 0;
  let subpathStart = { x: 0, y: 0 };

  while (i < tokens.length) {
    const token = tokens[i];
    if (token === undefined) break;
    if (typeof token === "string") {
      cmd = token;
      absolute = cmd === cmd.toUpperCase();
      i += 1;
      if (cmd.toUpperCase() === "Z") {
        segments.push({ cmd: "Z" });
        cx = subpathStart.x;
        cy = subpathStart.y;
        continue;
      }
    }
    const key = cmd.toUpperCase();
    const count = ARG_COUNTS[key];
    if (count === undefined) {
      errors.push(`Unknown command: ${cmd}`);
      break;
    }
    if (cmd === "") {
      errors.push("Path must start with a command");
      break;
    }
    const args: number[] = [];
    for (let a = 0; a < count; a += 1) {
      const value = tokens[i];
      if (typeof value !== "number") {
        errors.push(`Command ${cmd}: expected ${count} numbers, got ${a}`);
        return { segments, errors };
      }
      args.push(value);
      i += 1;
    }
    const pos = toAbsolute(cmd, absolute, cx, cy, args);
    const advance = { x: pos.x, y: pos.y };
    pushSegment(segments, cmd, args, pos, absolute);
    if (cmd.toUpperCase() === "M") subpathStart = advance;
    cx = advance.x;
    cy = advance.y;
    // Implicit repeat: M sonrası L, diğerlerinde aynı komut devam eder.
    if (cmd.toUpperCase() === "M") cmd = absolute ? "L" : "l";
  }

  return { segments, errors };
}

function pushSegment(
  segments: PathSegment[],
  cmd: string,
  args: number[],
  pos: { x: number; y: number },
  absolute: boolean,
): void {
  const upper = cmd.toUpperCase();
  if (upper === "M") segments.push({ cmd: "M", x: pos.x, y: pos.y });
  else if (upper === "L") segments.push({ cmd: absolute ? "L" : "L", x: pos.x, y: pos.y });
  else if (upper === "H") segments.push({ cmd: "H", x: pos.x });
  else if (upper === "V") segments.push({ cmd: "V", y: pos.y });
  else if (upper === "C") segments.push({ cmd: "C", x1: args[0]!, y1: args[1]!, x2: args[2]!, y2: args[3]!, x: pos.x, y: pos.y });
  else if (upper === "S") segments.push({ cmd: "S", x2: args[0]!, y2: args[1]!, x: pos.x, y: pos.y });
  else if (upper === "Q") segments.push({ cmd: "Q", x1: args[0]!, y1: args[1]!, x: pos.x, y: pos.y });
  else if (upper === "T") segments.push({ cmd: "T", x: pos.x, y: pos.y });
  else if (upper === "A") {
    segments.push({
      cmd: "A",
      rx: args[0]!, ry: args[1]!, rotation: args[2]!,
      largeArc: args[3]! ? 1 : 0, sweep: args[4]! ? 1 : 0,
      x: pos.x, y: pos.y,
    });
  }
}

function toAbsolute(
  cmd: string,
  absolute: boolean,
  cx: number,
  cy: number,
  args: number[],
): { x: number; y: number } {
  const upper = cmd.toUpperCase();
  if (absolute) {
    if (upper === "H") return { x: args[0]!, y: cy };
    if (upper === "V") return { x: cx, y: args[0]! };
    if (upper === "Z") return { x: cx, y: cy };
    return { x: args[args.length - 2]!, y: args[args.length - 1]! };
  }
  if (upper === "H") return { x: cx + args[0]!, y: cy };
  if (upper === "V") return { x: cx, y: cy + args[0]! };
  return { x: cx + args[args.length - 2]!, y: cy + args[args.length - 1]! };
}

function tokenize(d: string): (string | number)[] {
  const out: (string | number)[] = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)|([^\s])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d)) !== null) {
    if (match[1]) out.push(match[1]);
    else if (match[2]) out.push(Number(match[2]));
    else if (match[3]) out.push(match[3]);
  }
  return out;
}

const PRECISION = 4;

function num(value: number): string {
  const rounded = Number(value.toFixed(PRECISION));
  return String(rounded);
}

export function serializePath(segments: PathSegment[]): string {
  return segments
    .map((s) => {
      switch (s.cmd) {
        case "M": return `M${num(s.x)} ${num(s.y)}`;
        case "L": return `L${num(s.x)} ${num(s.y)}`;
        case "H": return `H${num(s.x)}`;
        case "V": return `V${num(s.y)}`;
        case "C": return `C${num(s.x1)} ${num(s.y1)} ${num(s.x2)} ${num(s.y2)} ${num(s.x)} ${num(s.y)}`;
        case "S": return `S${num(s.x2)} ${num(s.y2)} ${num(s.x)} ${num(s.y)}`;
        case "Q": return `Q${num(s.x1)} ${num(s.y1)} ${num(s.x)} ${num(s.y)}`;
        case "T": return `T${num(s.x)} ${num(s.y)}`;
        case "A": return `A${num(s.rx)} ${num(s.ry)} ${num(s.rotation)} ${s.largeArc} ${s.sweep} ${num(s.x)} ${num(s.y)}`;
        case "Z": return "Z";
      }
    })
    .join("");
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Bézier segmentlerinde gerçek ekstremumlar kullanılır (kübik/kuadratik türev kökleri).
// S ve T yansıtma komutları bağımsız ele alınır (önceki kontrol noktası bilgisi ayrıştırıcıda tutulmaz).
import { cubicSegmentBounds, quadraticSegmentBounds } from "./bezier.js";

export function pathBounds(segments: PathSegment[]): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let cx = 0;
  let cy = 0;
  const include = (x: number, y: number): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const s of segments) {
    switch (s.cmd) {
      case "H": include(s.x, cy); cx = s.x; break;
      case "V": include(cx, s.y); cy = s.y; break;
      case "C": {
        const b = cubicSegmentBounds({ x: cx, y: cy }, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }, { x: s.x, y: s.y });
        include(b.minX, b.minY); include(b.maxX, b.maxY);
        cx = s.x; cy = s.y;
        break;
      }
      case "S": {
        const b = cubicSegmentBounds({ x: cx, y: cy }, { x: cx, y: cy }, { x: s.x2, y: s.y2 }, { x: s.x, y: s.y });
        include(b.minX, b.minY); include(b.maxX, b.maxY);
        cx = s.x; cy = s.y;
        break;
      }
      case "Q": {
        const b = quadraticSegmentBounds({ x: cx, y: cy }, { x: s.x1, y: s.y1 }, { x: s.x, y: s.y });
        include(b.minX, b.minY); include(b.maxX, b.maxY);
        cx = s.x; cy = s.y;
        break;
      }
      case "A": include(s.x, s.y); cx = s.x; cy = s.y; break;
      case "M": case "L": case "T": include(s.x, s.y); cx = s.x; cy = s.y; break;
      case "Z": break;
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

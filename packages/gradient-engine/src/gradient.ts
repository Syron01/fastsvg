// Gradient Studio v0.2: linear/radial gradient üretimi, algısal stop dağıtımı,
// SVG defs serialization ve banding analizi.

import { interpolate, parseHexColor, formatHexColor, srgbToOkLab, type InterpolationMode } from "@fastsvg/color-engine";

export interface GradientStop {
  offset: number; // 0..1
  color: string; // hex
  opacity?: number; // 0..1
}

export interface LinearGradient {
  type: "linear";
  id: string;
  stops: GradientStop[];
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  units: "objectBoundingBox" | "userSpaceOnUse";
  interpolation?: InterpolationMode;
}

export interface RadialGradient {
  type: "radial";
  id: string;
  stops: GradientStop[];
  cx: number;
  cy: number;
  r: number;
  fx?: number;
  fy?: number;
  units: "objectBoundingBox" | "userSpaceOnUse";
  interpolation?: InterpolationMode;
}

export type Gradient = LinearGradient | RadialGradient;

export interface GradientResult {
  gradient: Gradient;
  warnings: string[];
}

const MIN_STOPS = 2;
const MAX_STOPS = 64;

export function validateGradientStops(stops: GradientStop[]): string[] {
  const errors: string[] = [];
  if (stops.length < MIN_STOPS) errors.push(`En az ${MIN_STOPS} stop gerekli`);
  if (stops.length > MAX_STOPS) errors.push(`En fazla ${MAX_STOPS} stop desteklenir`);
  for (const [i, s] of stops.entries()) {
    if (!Number.isFinite(s.offset) || s.offset < 0 || s.offset > 1) {
      errors.push(`Stop ${i}: offset 0..1 aralığında olmalı`);
    }
    if (!parseHexColor(s.color)) errors.push(`Stop ${i}: geçersiz renk ${s.color}`);
    if (s.opacity !== undefined && (s.opacity < 0 || s.opacity > 1)) {
      errors.push(`Stop ${i}: opacity 0..1 aralığında olmalı`);
    }
  }
  return errors;
}

// n adımda iki renk arasında algısal (varsayılan OKLab) dağıtılmış stop listesi üretir.
export function generateStops(from: string, to: string, steps: number, mode: InterpolationMode = "oklab"): GradientStop[] | null {
  const a = parseHexColor(from);
  const b = parseHexColor(to);
  if (!a || !b) return null;
  const n = Math.max(2, Math.min(MAX_STOPS, Math.round(steps)));
  const stops: GradientStop[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    stops.push({ offset: t, color: formatHexColor(interpolate(a, b, t, mode)) });
  }
  return stops;
}

export function createLinearGradient(input: Omit<LinearGradient, "type">): GradientResult {
  const warnings = validateGradientStops(input.stops);
  const gradient: Gradient = { type: "linear", ...input, stops: normalizeOffsets(input.stops) };
  return { gradient, warnings };
}

export function createRadialGradient(input: Omit<RadialGradient, "type">): GradientResult {
  const warnings = validateGradientStops(input.stops);
  if (input.r <= 0 || !Number.isFinite(input.r)) warnings.push("r pozitif olmalı");
  const gradient: Gradient = { type: "radial", ...input, stops: normalizeOffsets(input.stops) };
  return { gradient, warnings };
}

// Offset'leri artan sırada ve 0..1'e normalize eder; sıralama kararlıdır.
export function normalizeOffsets(stops: GradientStop[]): GradientStop[] {
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  if (sorted.length === 0) return sorted;
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const min = first.offset;
  const span = last.offset - min || 1;
  return sorted.map((s) => ({ ...s, offset: (s.offset - min) / span }));
}

// Verilen t'deki (0..1) gradient rengini komşu stoplar arasında interpolasyonla bulur.
export function sampleGradient(g: Gradient, t: number): string {
  const u = Math.max(0, Math.min(1, t));
  const stops = g.stops;
  if (stops.length === 0) return "#000000";
  if (u <= stops[0]!.offset) return stops[0]!.color;
  const lastStop = stops[stops.length - 1]!;
  if (u >= lastStop.offset) return lastStop.color;
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (u >= a.offset && u <= b.offset) {
      const local = b.offset - a.offset === 0 ? 0 : (u - a.offset) / (b.offset - a.offset);
      const mode = g.interpolation ?? "oklab";
      return formatHexColor(interpolate(parseHexColor(a.color)!, parseHexColor(b.color)!, local, mode));
    }
  }
  return lastStop.color;
}

// Banding analizi: komşu örnekler arasındaki OKLab ΔE sürekliliğini ölçer.
// Delta E OKLab'da L,a,b farklarının Öklid mesafesidir (0..~1 tipik aralık).
export interface BandingReport {
  maxStepDeltaE: number;
  meanStepDeltaE: number;
  bandingRisk: "low" | "medium" | "high";
}

export function analyzeBanding(g: Gradient, samples = 64): BandingReport | null {
  const deltas: number[] = [];
  for (let i = 1; i <= samples; i += 1) {
    const t0 = (i - 1) / samples;
    const t1 = i / samples;
    const c0 = parseHexColor(sampleGradient(g, t0))!;
    const c1 = parseHexColor(sampleGradient(g, t1))!;
    const l0 = okLabOf(formatHexColor(c0));
    const l1 = okLabOf(formatHexColor(c1));
    deltas.push(Math.hypot(l1.L - l0.L, l1.a - l0.a, l1.b - l0.b));
  }
  if (deltas.length === 0) return null;
  const max = Math.max(...deltas);
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  // Eşikler pragmatiktir: OKLab'da komşu adım ΔE > 0.08 belirgin banding hissi verir.
  const ratio = mean > 0 ? max / mean : 0;
  return {
    maxStepDeltaE: max,
    meanStepDeltaE: mean,
    bandingRisk: ratio > 2.5 || max > 0.12 ? "high" : max > 0.08 ? "medium" : "low",
  };
}

function okLabOf(hex: string): { L: number; a: number; b: number } {
  return srgbToOkLab(parseHexColor(hex)!);
}

const PRECISION = 6;
const num = (v: number): string => String(Number(v.toFixed(PRECISION)));

// SVG <defs> içine konacak markup üretir. stop-color ve stop-opacity ayrı yazılır.
export function serializeGradient(g: Gradient): string {
  const stops = g.stops
    .map((s) => {
      const opacity = s.opacity !== undefined ? ` stop-opacity="${num(s.opacity)}"` : "";
      return `<stop offset="${num(s.offset)}" stop-color="${s.color}"${opacity}/>`;
    })
    .join("");
  if (g.type === "linear") {
    return `<linearGradient id="${g.id}" x1="${num(g.x1)}" y1="${num(g.y1)}" x2="${num(g.x2)}" y2="${num(g.y2)}" gradientUnits="${g.units}">${stops}</linearGradient>`;
  }
  const fx = g.fx !== undefined ? ` fx="${num(g.fx)}"` : "";
  const fy = g.fy !== undefined ? ` fy="${num(g.fy)}"` : "";
  return `<radialGradient id="${g.id}" cx="${num(g.cx)}" cy="${num(g.cy)}" r="${num(g.r)}"${fx}${fy} gradientUnits="${g.units}">${stops}</radialGradient>`;
}

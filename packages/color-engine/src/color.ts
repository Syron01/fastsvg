// Renk uzayları: sRGB ↔ linear RGB ↔ OKLab (Björn Ottosson'un referans matrisleri).
// Sınırlamalar: ICC profil desteği yok; hex girdi sRGB varsayar.

export interface Rgb {
  r: number; // 0..1, sRGB (gamma kodlu)
  g: number;
  b: number;
}

export interface LinearRgb {
  r: number;
  g: number;
  b: number;
}

export interface OkLab {
  L: number;
  a: number;
  b: number;
}

export interface OkLch {
  L: number;
  c: number;
  h: number; // derece, 0..360
}

const SRGB_THRESHOLD = 0.04045;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_POWER = 2.4;
const SRGB_SLOPE = 1.055;
const SRGB_OFFSET = 0.055;

export function srgbToLinearChannel(v: number): number {
  return v <= SRGB_THRESHOLD ? v / SRGB_LINEAR_DIVISOR : Math.pow((v + SRGB_OFFSET) / SRGB_SLOPE, SRGB_POWER);
}

export function linearToSrgbChannel(v: number): number {
  return v <= 0.0031308 ? v * SRGB_LINEAR_DIVISOR : SRGB_SLOPE * Math.pow(v, 1 / SRGB_POWER) - SRGB_OFFSET;
}

export function srgbToLinear(rgb: Rgb): LinearRgb {
  return { r: srgbToLinearChannel(rgb.r), g: srgbToLinearChannel(rgb.g), b: srgbToLinearChannel(rgb.b) };
}

export function linearToSrgb(l: LinearRgb): Rgb {
  return { r: linearToSrgbChannel(l.r), g: linearToSrgbChannel(l.g), b: linearToSrgbChannel(l.b) };
}

// OKLab dönüşüm matrisleri (Ottosson 2020, kamu malı matematik).
export function linearRgbToOkLab(l: LinearRgb): OkLab {
  const l_ = Math.cbrt(0.4122214708 * l.r + 0.5363325363 * l.g + 0.0514459929 * l.b);
  const m_ = Math.cbrt(0.2119034982 * l.r + 0.6806995451 * l.g + 0.1073969566 * l.b);
  const s_ = Math.cbrt(0.0883024619 * l.r + 0.2817188376 * l.g + 0.6299787005 * l.b);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function okLabToLinearRgb(lab: OkLab): LinearRgb {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

export function srgbToOkLab(rgb: Rgb): OkLab {
  return linearRgbToOkLab(srgbToLinear(rgb));
}

export function okLabToSrgb(lab: OkLab): Rgb {
  return linearToSrgb(okLabToLinearRgb(lab));
}

export function okLabToOkLch(lab: OkLab): OkLch {
  const c = Math.hypot(lab.a, lab.b);
  let h = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return { L: lab.L, c, h };
}

export function okLchToOkLchLab(lch: OkLch): OkLab {
  const rad = (lch.h * Math.PI) / 180;
  return { L: lch.L, a: lch.c * Math.cos(rad), b: lch.c * Math.sin(rad) };
}

export type InterpolationMode = "srgb" | "linear-rgb" | "oklab";

// İki sRGB renk arasında verilen uzayda interpolasyon.
export function interpolate(a: Rgb, b: Rgb, t: number, mode: InterpolationMode = "oklab"): Rgb {
  const u = Math.max(0, Math.min(1, t));
  if (mode === "srgb") {
    return { r: a.r + (b.r - a.r) * u, g: a.g + (b.g - a.g) * u, b: a.b + (b.b - a.b) * u };
  }
  if (mode === "linear-rgb") {
    const la = srgbToLinear(a);
    const lb = srgbToLinear(b);
    return linearToSrgb({
      r: la.r + (lb.r - la.r) * u,
      g: la.g + (lb.g - la.g) * u,
      b: la.b + (lb.b - la.b) * u,
    });
  }
  const la = srgbToOkLab(a);
  const lb = srgbToOkLab(b);
  return okLabToSrgb({
    L: la.L + (lb.L - la.L) * u,
    a: la.a + (lb.a - la.a) * u,
    b: la.b + (lb.b - la.b) * u,
  });
}

// WCAG 2.1 göreli parlaklık ve kontrast oranı.
export function relativeLuminance(rgb: Rgb): number {
  return 0.2126 * srgbToLinearChannel(rgb.r) + 0.7152 * srgbToLinearChannel(rgb.g) + 0.0722 * srgbToLinearChannel(rgb.b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// "#rgb" | "#rrggbb" → Rgb. Geçersiz girdi null döner.
export function parseHexColor(value: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return null;
  const hex = m[1]!;
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0]! + hex[0]!, 16) / 255,
      g: parseInt(hex[1]! + hex[1]!, 16) / 255,
      b: parseInt(hex[2]! + hex[2]!, 16) / 255,
    };
  }
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}

export function formatHexColor(rgb: Rgb): string {
  const to2 = (v: number): string => {
    const clamped = Math.max(0, Math.min(1, v));
    const n = Math.round(clamped * 255);
    return n.toString(16).padStart(2, "0");
  };
  return `#${to2(rgb.r)}${to2(rgb.g)}${to2(rgb.b)}`;
}

export interface PaletteScale {
  base: string;
  steps: string[]; // açık→koyu, 5 adım
  contrastAgainstWhite: number;
  contrastAgainstBlack: number;
}

// OKLCH L ekseni üzerinde sabit hue/croma ile 5 adımlı ton skalası üretir.
export function buildToneScale(baseHex: string): PaletteScale | null {
  const base = parseHexColor(baseHex);
  if (!base) return null;
  const lch = okLabToOkLch(srgbToOkLab(base));
  const lMin = Math.max(0.15, lch.L - 0.24);
  const lMax = Math.min(0.97, lch.L + 0.24);
  const steps: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const L = lMax + ((lMin - lMax) * i) / 4;
    steps.push(formatHexColor(okLabToSrgb(okLchToOkLchLab({ L, c: lch.c, h: lch.h }))));
  }
  return {
    base: baseHex,
    steps,
    contrastAgainstWhite: contrastRatio(base, { r: 1, g: 1, b: 1 }),
    contrastAgainstBlack: contrastRatio(base, { r: 0, g: 0, b: 0 }),
  };
}

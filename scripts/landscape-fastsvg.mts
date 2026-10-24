// Gün batımı manzarası — FastSVG motoruyla animasyonlu APNG.
// Çalıştır: npx tsx scripts/landscape-fastsvg.mts
// Çıktı: C:\Users\theay\OneDrive\Desktop\TestingSvg\fastsvg.apng
import { createScene, applyPatch, type SceneNode } from "@fastsvg/scene-ir";
import { interpolate, parseHexColor, formatHexColor, type Rgb } from "@fastsvg/color-engine";
import type { SceneGradient } from "@fastsvg/raster";
import { detectLoopSeam, frameTimestamps, validateTimeline, type AnimationTrack, type EasingDefinition, type Timeline } from "@fastsvg/motion-engine";
import { renderTimelineApng } from "@fastsvg/frame-pipeline";
import { decodePng } from "@fastsvg/apng-exporter";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Sabitler
// ---------------------------------------------------------------------------
const VIEWPORT_W = 480;
const VIEWPORT_H = 270;
const LAKE_TOP = 200;          // göl üst kenarı (göl ~70px)
const LAKE_H = VIEWPORT_H - LAKE_TOP;

// Gökyüzü gradient stopları: koyu mor-lacivert → fuşya → turuncu (OKLab akan üç durak).
const SKY_TOP_HEX = "#1e1b4b";   // koyu mor-lacivert
const SKY_MID_HEX = "#b0447c";   // gün batımı fuşyası
const SKY_BOTTOM_HEX = "#fbbf24"; // turuncu
const SUN_HEX = "#fde68a";
const GLOW_HEX = "#fb923c";
const MOUNTAIN_BACK_HEX = "#7c5ea8";  // açık ton (interpolasyon çapası)
const MOUNTAIN_FRONT_HEX = "#2e1065"; // koyu ton (interpolasyon çapası)
const LAKE_HEX = "#312e81";
const CLOUD_HEX = "#c4b5fd";
const BIRD_HEX = "#000000";
const STAR_HEX = "#e0e7ff";

const DURATION_MS = 3000;
const FRAME_RATE = 12; // -> 36 kare
const QUARTER_MS = DURATION_MS / 4; // 750ms grid'i (salınım keyframe'leri)

const SUN_CY = 148;
const SUN_CX = 330;
const SUN_R = 20;
const GLOW_R = 64; // güneş glow yarıçapı

const EASE_IN_OUT: EasingDefinition = { type: "cubic-bezier", x1: 0.42, y1: 0, x2: 0.58, y2: 1 };

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------
function oklabMix(aHex: string, bHex: string, t: number): string {
  const a = parseHexColor(aHex) as Rgb;
  const b = parseHexColor(bHex) as Rgb;
  return formatHexColor(interpolate(a, b, t, "oklab"));
}

function node(partial: Omit<SceneNode, "parentId" | "provenance">): SceneNode {
  return { ...partial, parentId: null, provenance: "tool" };
}

function rect(id: string, x: number, y: number, w: number, h: number, color: string, opacity?: number): SceneNode {
  return node({
    id,
    type: "rect",
    props: { x, y, width: w, height: h },
    style: { fill: { color, ...(opacity !== undefined ? { opacity } : {}) } },
  });
}

function ellipse(id: string, cx: number, cy: number, rx: number, ry: number, color: string, opacity?: number): SceneNode {
  return node({
    id,
    type: "ellipse",
    props: { cx, cy, rx, ry },
    style: { fill: { color, ...(opacity !== undefined ? { opacity } : {}) } },
  });
}

function polygon(id: string, points: number[], color: string): SceneNode {
  return node({
    id,
    type: "polygon",
    props: { points },
    style: { fill: { color } },
  });
}

function circle(id: string, cx: number, cy: number, r: number, color: string, opacity?: number): SceneNode {
  return node({
    id,
    type: "circle",
    props: { cx, cy, r },
    style: { fill: { color, ...(opacity !== undefined ? { opacity } : {}) } },
  });
}

/** 5 noktalı salınım: değerler [0, Ç, 2Ç, 3Ç, D] zamanlarında; son değer ilke eşit. */
function fivePointTrack(id: string, target: string, property: "translateX" | "translateY" | "opacity", values: readonly [number, number, number, number, number]): AnimationTrack {
  const times = [0, QUARTER_MS, 2 * QUARTER_MS, 3 * QUARTER_MS, DURATION_MS];
  return {
    id,
    targetNodeId: target,
    property,
    keyframes: values.map((value, i) => ({
      id: `${id}-kf${i}`,
      timeMs: times[i] as number,
      value,
      easing: EASE_IN_OUT,
    })),
  };
}

/** Ping-pong track'i: baş -> uç -> baş (yarı sürede dönüş, ease-in-out). */
function pingPongTrack(id: string, target: string, property: "translateX" | "translateY" | "opacity", from: number, to: number): AnimationTrack {
  return {
    id,
    targetNodeId: target,
    property,
    keyframes: [
      { id: `${id}-kf0`, timeMs: 0, value: from },
      { id: `${id}-kf1`, timeMs: DURATION_MS / 2, value: to, easing: EASE_IN_OUT },
      { id: `${id}-kf2`, timeMs: DURATION_MS, value: from, easing: EASE_IN_OUT },
    ],
  };
}

// ---------------------------------------------------------------------------
// Renkler — @fastsvg/color-engine (OKLab)
// ---------------------------------------------------------------------------

// Dağ tonları: açık çapa ile koyu çapa arası OKLab adımları (t=0, 0.5, 1).
const MOUNTAIN_MID_TONE = oklabMix(MOUNTAIN_BACK_HEX, MOUNTAIN_FRONT_HEX, 0.5);
const mountainTones = [
  oklabMix(MOUNTAIN_BACK_HEX, MOUNTAIN_FRONT_HEX, 0),
  MOUNTAIN_MID_TONE,
  oklabMix(MOUNTAIN_BACK_HEX, MOUNTAIN_FRONT_HEX, 1),
];

// Gradient tanımları (userSpaceOnUse) — raster motor artık url(#id) fill destekliyor.
const gradients: SceneGradient[] = [
  {
    id: "sky",
    kind: "linear",
    units: "userSpaceOnUse",
    x1: 0,
    y1: 0,
    x2: 0,
    y2: LAKE_TOP,
    stops: [
      { offset: 0, color: SKY_TOP_HEX },
      { offset: 0.45, color: SKY_MID_HEX },
      { offset: 1, color: SKY_BOTTOM_HEX },
    ],
  },
  {
    // Güneş glow'u: turuncu merkezden şeffafa düşen radial boya.
    id: "glow",
    kind: "radial",
    units: "userSpaceOnUse",
    cx: SUN_CX,
    cy: SUN_CY,
    r: GLOW_R,
    stops: [
      { offset: 0, color: GLOW_HEX, opacity: 0.55 },
      { offset: 1, color: GLOW_HEX, opacity: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sahne (z-sırası = ekleme sırası)
// ---------------------------------------------------------------------------
const nodes: SceneNode[] = [];

// 1) Gradient gökyüzü — tek rect, url(#sky) dolgusu (statik ön ek: önbelleğe girer).
nodes.push(rect("sky", 0, 0, VIEWPORT_W, LAKE_TOP, "url(#sky)"));

// 2) Yıldızlar — üst gökte statik noktalar (twinkle hissi gradient gökle birlikte).
const stars = [
  { x: 40, y: 24, r: 1.4 }, { x: 96, y: 58, r: 1.1 }, { x: 150, y: 18, r: 1.6 },
  { x: 205, y: 44, r: 1.0 }, { x: 262, y: 15, r: 1.3 }, { x: 300, y: 62, r: 1.1 },
  { x: 356, y: 30, r: 1.5 }, { x: 410, y: 52, r: 1.0 }, { x: 448, y: 20, r: 1.4 },
  { x: 130, y: 90, r: 0.9 }, { x: 380, y: 84, r: 1.0 }, { x: 470, y: 70, r: 1.2 },
] as const;
for (const [i, s] of stars.entries()) {
  nodes.push(circle(`star-${i}`, s.x, s.y, s.r, STAR_HEX, 0.9));
}

// 3) Güneş glow'u + güneş — dağların arkasında batıyor (dağlar sonra çizilir).
nodes.push(circle("sun-glow", SUN_CX, SUN_CY, GLOW_R, "url(#glow)"));
nodes.push(circle("sun", SUN_CX, SUN_CY, SUN_R, SUN_HEX));

// 4) Dağ silüetleri — arka (açık) -> ön (koyu).
nodes.push(polygon("mountain-back", [
  0, LAKE_TOP + 5, 55, 112, 120, 158, 200, 98, 275, 150, 355, 132, 420, 165, VIEWPORT_W, LAKE_TOP + 5,
], mountainTones[0] as string));
nodes.push(polygon("mountain-mid", [
  0, LAKE_TOP + 8, 70, 150, 150, 185, 230, 135, 310, 175, 390, 140, VIEWPORT_W, LAKE_TOP + 8,
], mountainTones[1] as string));
nodes.push(polygon("mountain-front", [
  0, LAKE_TOP + 12, 60, 190, 140, 205, 240, 175, 330, 200, 420, 182, VIEWPORT_W, LAKE_TOP + 12,
], mountainTones[2] as string));

// 5) Göl + güneş yansıması shimmer çubukları (opacity animasyonlu).
nodes.push(rect("lake", 0, LAKE_TOP, VIEWPORT_W, LAKE_H, LAKE_HEX));
const shimmerBars = [
  { id: "shimmer-1", x: 318, y: 204, w: 5, h: 18 },
  { id: "shimmer-2", x: 326, y: 204, w: 9, h: 30 },
  { id: "shimmer-3", x: 338, y: 204, w: 4, h: 22 },
  { id: "shimmer-4", x: 331, y: 240, w: 6, h: 14 },
] as const;
for (const b of shimmerBars) {
  nodes.push(rect(b.id, b.x, b.y, b.w, b.h, SUN_HEX));
}

// 6) Bulutlar — 2 ellipse kümesi, #c4b5fd alpha 0.8.
const cloudShape = (cx: number, cy: number, idOf: (part: string) => string): SceneNode[] => [
  ellipse(idOf("base"), cx, cy, 32, 11, CLOUD_HEX, 0.8),
  ellipse(idOf("bump-left"), cx - 16, cy - 5, 15, 9, CLOUD_HEX, 0.8),
  ellipse(idOf("bump-right"), cx + 14, cy - 4, 13, 8, CLOUD_HEX, 0.8),
];
const cloudAEllipses = cloudShape(120, 64, (p) => `cloud-a-${p}`);
const cloudBEllipses = cloudShape(258, 42, (p) => `cloud-b-${p}`);
nodes.push(...cloudAEllipses, ...cloudBEllipses);

// 7) Kuşlar — küçük siyah dolgu path'leri (m biçimli kanat çifti).
nodes.push(node({
  id: "bird-1",
  type: "path",
  props: { d: "M150 120 Q153.5 114.5 157 120 Q160.5 114.5 164 120 Q157 122 150 120 Z" },
  style: { fill: { color: BIRD_HEX } },
}));
nodes.push(node({
  id: "bird-2",
  type: "path",
  props: { d: "M196 104 Q199 99 202 104 Q205 99 208 104 Q202 105.5 196 104 Z" },
  style: { fill: { color: BIRD_HEX } },
}));

const doc = createScene({
  documentId: "sunset-landscape",
  name: "gun-batimi-daglar-gol",
  viewport: { width: VIEWPORT_W, height: VIEWPORT_H, background: SKY_TOP_HEX },
});
const addResult = applyPatch(doc, nodes.map((n) => ({ op: "addNode" as const, node: n })));
if (!addResult.ok) throw new Error(`Sahne eklenemedi: ${addResult.message}`);

// ---------------------------------------------------------------------------
// Timeline — 3000ms, 12fps = 36 kare; her track'te timeMs=0 ve timeMs=3000 eşit.
// ---------------------------------------------------------------------------
const tracks: AnimationTrack[] = [];

// Güneş: çok yavaş sinüs benzeri alçalıp yükselme (tam periyot: +çukur, -tepe, baş=son).
tracks.push(fivePointTrack("sun-bob", "sun", "translateY", [0, 5.5, 0, -6, 0]));
// Glow güneşle birlikte salınır.
tracks.push(fivePointTrack("glow-bob", "sun-glow", "translateY", [0, 5.5, 0, -6, 0]));

// Shimmer: opacity 0.3 <-> 0.7 bandında, faz kaydırmalı (hepsi baş=son).
tracks.push(fivePointTrack("shimmer-1-op", "shimmer-1", "opacity", [0.3, 0.7, 0.3, 0.7, 0.3]));
tracks.push(fivePointTrack("shimmer-2-op", "shimmer-2", "opacity", [0.7, 0.3, 0.7, 0.3, 0.7]));
tracks.push(fivePointTrack("shimmer-3-op", "shimmer-3", "opacity", [0.35, 0.6, 0.35, 0.6, 0.35]));
tracks.push(fivePointTrack("shimmer-4-op", "shimmer-4", "opacity", [0.7, 0.4, 0.7, 0.4, 0.7]));

// Bulutlar: translateX ping-pong (gidip gelme, cubic-bezier ease-in-out).
for (const e of cloudAEllipses) {
  tracks.push(pingPongTrack(`cloud-a-dx-${e.id}`, e.id, "translateX", 0, 36));
}
for (const e of cloudBEllipses) {
  tracks.push(pingPongTrack(`cloud-b-dx-${e.id}`, e.id, "translateX", 0, 24));
}

// Kuşlar: hafif translateY salınımı.
tracks.push(fivePointTrack("bird-1-bob", "bird-1", "translateY", [0, 3, 0, 3, 0]));
tracks.push(fivePointTrack("bird-2-bob", "bird-2", "translateY", [0, -2, 0, -2, 0]));

const timeline: Timeline = {
  id: "sunset-loop",
  name: "gun-batimi-dongusu",
  durationMs: DURATION_MS,
  frameRate: FRAME_RATE,
  tracks,
};

// ---------------------------------------------------------------------------
// Doğrulama + render + APNG çıktısı
// ---------------------------------------------------------------------------
const validationErrors = validateTimeline(timeline);
if (validationErrors.length > 0) {
  throw new Error(`Timeline geçersiz: ${validationErrors.map((e) => e.message).join("; ")}`);
}
const seam = detectLoopSeam(timeline);
console.log(`detectLoopSeam: seamless=${seam.seamless}`);
for (const [trackId, delta] of Object.entries(seam.seamDeltaByTrack)) {
  console.log(`  dikiş delta ${trackId}: ${delta}`);
}
if (!seam.seamless) throw new Error("Döngü dikişi kusursuz değil (seamless=false)");
console.log(`frameTimestamps: ${frameTimestamps(timeline).length} kare (0ms .. ${frameTimestamps(timeline).at(-1)}ms)`);

const result = renderTimelineApng(doc, timeline, 0, { gradients });
console.log(`renderTimelineApng: ${result.frameCount} kare, ${result.width}x${result.height}, encode ${Math.round(result.encodeMs)}ms, statik katman: ${result.staticLayerNodes} node (önbellek)`);
console.log(`raster uyarıları: ${result.warnings.length === 0 ? "(yok)" : result.warnings.join("; ")}`);

const OUT_PATH = "C:\\Users\\theay\\OneDrive\\Desktop\\TestingSvg\\fastsvg.apng";
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, result.buffer);

// ---------------------------------------------------------------------------
// Geri okuma kanıtı
// ---------------------------------------------------------------------------
const decoded = decodePng(result.buffer);
const sizeBytes = statSync(OUT_PATH).size;
console.log("--- APNG doğrulama (decodePng) ---");
console.log(`dosya: ${OUT_PATH}`);
console.log(`boyut: ${sizeBytes} byte (${(sizeBytes / 1024).toFixed(1)} KB)`);
console.log(`frameCount: ${decoded.frameCount}`);
console.log(`boyutlar: ${decoded.width}x${decoded.height}`);
console.log(`delaysMs[0]: ${decoded.delaysMs[0]}`);
console.log(`loopCount: ${decoded.loopCount} (0 = sonsuz)`);
console.log(`isAnimated: ${decoded.isAnimated}`);
console.log("--- motor renkleri (OKLab) ---");
console.log(`dağ tonları (arka/ön çapa arası): ${mountainTones.join(" ")}`);

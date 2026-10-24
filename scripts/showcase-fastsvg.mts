// "Made with FastSVG" vitrini — üç SVG artwork tamamen motor paketleriyle üretilir.
// Çalıştır: npx tsx scripts/showcase-fastsvg.mts
// Çıktı: assets/showcase-*.svg (README + docs/gallery.html referans verir)
import { createScene, applyPatch, type SceneNode } from "@fastsvg/scene-ir";
import { interpolate, parseHexColor, formatHexColor, okLabToSrgb, type Rgb } from "@fastsvg/color-engine";
import { createLinearGradient, createRadialGradient, generateStops, serializeGradient, type Gradient } from "@fastsvg/gradient-engine";
import { exportSvgEditable } from "@fastsvg/export-svg";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------
const ASSETS_DIR = "assets";

function node(partial: Omit<SceneNode, "parentId" | "provenance">): SceneNode {
  return { ...partial, parentId: null, provenance: "tool" };
}

function rect(id: string, x: number, y: number, w: number, h: number, color: string, opacity?: number): SceneNode {
  return node({
    id, type: "rect",
    props: { x, y, width: w, height: h },
    style: { fill: { color, ...(opacity !== undefined ? { opacity } : {}) } },
  });
}

function circle(id: string, cx: number, cy: number, r: number, color: string, opacity?: number): SceneNode {
  return node({
    id, type: "circle",
    props: { cx, cy, r },
    style: { fill: { color, ...(opacity !== undefined ? { opacity } : {}) } },
  });
}

function polygon(id: string, points: number[], color: string, opacity?: number): SceneNode {
  return node({
    id, type: "polygon",
    props: { points },
    style: { fill: { color, ...(opacity !== undefined ? { opacity } : {}) } },
  });
}

function oklabMix(aHex: string, bHex: string, t: number): string {
  const a = parseHexColor(aHex) as Rgb;
  const b = parseHexColor(bHex) as Rgb;
  return formatHexColor(interpolate(a, b, t, "oklab"));
}

function buildAndExport(documentId: string, name: string, width: number, height: number, background: string, nodes: SceneNode[], gradients: Gradient[], outFile: string): ReturnType<typeof createScene> {
  const doc = createScene({ documentId, name, viewport: { width, height, background } });
  const result = applyPatch(doc, nodes.map((n) => ({ op: "addNode" as const, node: n })));
  if (!result.ok) throw new Error(`${documentId}: ${result.message}`);
  const exported = exportSvgEditable(doc, { gradients });
  if (exported.warnings.length > 0) throw new Error(`${documentId}: ${exported.warnings.join("; ")}`);
  const path = `${ASSETS_DIR}/${outFile}`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, exported.svg);
  console.log(`${path}: ${exported.nodeCount} node, ${Math.round(exported.svg.length / 1024)} KB`);
  return doc;
}

// ---------------------------------------------------------------------------
// 1) AURORA — katmanlı sinüs silüetleri, OKLab akan palet, gradient gökyüzü
// ---------------------------------------------------------------------------
const W1 = 640;
const H1 = 360;
const auroraNodes: SceneNode[] = [];

auroraNodes.push(rect("sky", 0, 0, W1, H1, "url(#aurora-sky)"));

// 5 silüet bandı: yatayda 9 noktalı sinüs + kapanış; her bant paletten bir adım.
const AURORA_COLORS = ["#0f2e5c", "#1c5d8f", "#2f9e8f", "#7fd069", "#e8f59a"];
for (let band = 0; band < 5; band += 1) {
  const baseY = 120 + band * 52;
  const amp = 46 - band * 7;
  const phase = band * 0.9;
  const pts: number[] = [];
  for (let i = 0; i <= 9; i += 1) {
    const x = (i / 9) * W1;
    const y = baseY + amp * Math.sin((i / 9) * Math.PI * 2 + phase);
    pts.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }
  pts.push(W1, H1, 0, H1);
  auroraNodes.push(polygon(`band-${band}`, pts, AURORA_COLORS[band] as string, 0.92));
}

// Ay: radial gradient hale + çekirdek (silüet tepelerinin üstünde kalır).
auroraNodes.push(circle("moon-halo", 512, 58, 38, "url(#aurora-halo)"));
auroraNodes.push(circle("moon", 512, 58, 14, "#f4f7ee"));

// Işık sütunu: ince dikey dikdörtgenler, alçalan opacity.
for (let i = 0; i < 7; i += 1) {
  const x = 60 + i * 12;
  auroraNodes.push(rect(`beam-${i}`, x, 0, 3, 150, "#9be8c8", 0.28 - i * 0.035));
}

const auroraGradients: Gradient[] = [
  createLinearGradient({
    id: "aurora-sky", units: "userSpaceOnUse", x1: 0, y1: 0, x2: 0, y2: H1,
    stops: generateStops("#0b1026", "#123a5e", 5)!.map((s, i) => (i === 4 ? { ...s, color: "#1c5d6e" } : s)),
  }).gradient,
  createRadialGradient({
    id: "aurora-halo", units: "userSpaceOnUse", cx: 512, cy: 58, r: 38,
    stops: [
      { offset: 0, color: "#f4f7ee", opacity: 0.5 },
      { offset: 1, color: "#f4f7ee", opacity: 0 },
    ],
  }).gradient,
];

// ---------------------------------------------------------------------------
// 2) ORBITS — saf geometri: kesişen daire halkaları, altın oranı yerleşimi
// ---------------------------------------------------------------------------
const W2 = 640;
const H2 = 360;
const orbitsNodes: SceneNode[] = [];
const INK = "#101014";
const PAPER = "#f5f2ea";
const ACCENT = "#e0532f";

// Altın oran yatayı: ana merkez x = φ bölümü.
const PHI = (1 + Math.sqrt(5)) / 2;
const cx1 = W2 / PHI;
const cx2 = W2 - cx1;
const cy = H2 / 2;

// Zemin ızgarası: 12 kolonik ince çizgi (stroke rect yerine 1px rect'ler).
for (let i = 1; i < 12; i += 1) {
  orbitsNodes.push(rect(`grid-${i}`, Math.round((i / 12) * W2), 40, 1, H2 - 80, INK, 0.06));
}

// Halkalar: paylaşılan merkezler, oktan yarıçap dizisi (r = 24·2^(k/3) yok — rasyonel adım).
const RADII = [22, 44, 66, 88, 110, 132];
for (const [i, r] of RADII.entries()) {
  orbitsNodes.push(circle(`ring-a-${i}`, cx1, cy, r, INK, 0.08 + i * 0.02));
  orbitsNodes.push(circle(`ring-b-${i}`, cx2, cy, r, INK, 0.05 + i * 0.012));
}
// Vurgu: sağ kümenin çekirdeği tek turuncu disk.
orbitsNodes.push(circle("core-accent", cx2, cy, 30, ACCENT));
// Kesim noktaları: iki merkez çemberinin kesişiminde dolu nokta (r=88 çifti).
const dx = Math.abs(cx2 - cx1) / 2;
const h = Math.sqrt(Math.max(0, 88 * 88 - dx * dx));
const mx = (cx1 + cx2) / 2;
if (h > 0) {
  orbitsNodes.push(circle("node-top", mx, cy - h, 5, ACCENT));
  orbitsNodes.push(circle("node-bottom", mx, cy + h, 5, ACCENT));
}
// Eksen yatayı ve merkez işaretleri.
orbitsNodes.push(rect("axis", 40, cy, W2 - 80, 1, INK, 0.35));
orbitsNodes.push(rect("axis-mark-a", cx1 - 8, cy, 17, 1, INK, 0.9));
orbitsNodes.push(rect("axis-mark-b", cx2 - 8, cy, 17, 1, INK, 0.9));

// ---------------------------------------------------------------------------
// 3) SPECTRUM — OKLab renk çalışması: hue çarkı dikdörtgenleri + ton skalası
// ---------------------------------------------------------------------------
const W3 = 640;
const H3 = 360;
const spectrumNodes: SceneNode[] = [];

// OKLab hue çarkı: L=0.72 sabit, hue 0..360, C=0.14 → 36 çubuk.
for (let i = 0; i < 36; i += 1) {
  const hue = (i / 36) * 360;
  const rad = (hue * Math.PI) / 180;
  const rgb = okLabToSrgb({ L: 0.72, a: 0.14 * Math.cos(rad), b: 0.14 * Math.sin(rad) });
  const hex = formatHexColor(rgb);
  spectrumNodes.push(rect(`hue-${i}`, (i / 36) * W3, 36, W3 / 36 + 1, 110, hex));
}

// Dikey ton skalası: koyu → açık, OKLab adımları (görsel olarak eşit parlaklık adımı).
const scaleSteps = 10;
for (let row = 0; row < 2; row += 1) {
  const anchorA = row === 0 ? "#172554" : "#4a044e";
  const anchorB = row === 0 ? "#dbeafe" : "#fae8ff";
  for (let i = 0; i < scaleSteps; i += 1) {
    const t = i / (scaleSteps - 1);
    const x = (i / scaleSteps) * W3;
    const w = W3 / scaleSteps;
    spectrumNodes.push(rect(`scale-${row}-${i}`, x, 196 + row * 68, w + 1, 52, oklabMix(anchorA, anchorB, t)));
  }
}

// Ayraç çizgiler + monospace etiket hissi veren ince bloklar (SVG text yerine rect işaretleri).
spectrumNodes.push(rect("divider", 0, 180, W3, 1, "#000000", 0.4));
spectrumNodes.push(rect("tick-hue", 0, 26, 42, 2, "#000000", 0.7));
spectrumNodes.push(rect("tick-scale", 0, 188, 42, 2, "#000000", 0.7));

const spectrumGradients: Gradient[] = [];

// ---------------------------------------------------------------------------
// Dışa aktarma
// ---------------------------------------------------------------------------
const auroraDoc = buildAndExport("aurora", "aurora-siluetleri", W1, H1, "#0b1026", auroraNodes, auroraGradients, "showcase-aurora.svg");
const orbitsDoc = buildAndExport("orbits", "altin-oran-geometrisi", W2, H2, PAPER, orbitsNodes, [], "showcase-orbits.svg");
const spectrumDoc = buildAndExport("spectrum", "oklab-renk-calismasi", W3, H3, "#ffffff", spectrumNodes, spectrumGradients, "showcase-spectrum.svg");
console.log("vitrin tamam.");

// SHOWCASE_PNG=1 ile raster önizlemeleri de yazılır (görsel doğrulama için).
if (process.env.SHOWCASE_PNG === "1") {
  const { renderScene } = await import("@fastsvg/raster");
  const { encodeApng } = await import("@fastsvg/apng-exporter");
  const previews: [string, ReturnType<typeof createScene>, Gradient[]][] = [
    ["aurora", auroraDoc, auroraGradients],
    ["orbits", orbitsDoc, []],
    ["spectrum", spectrumDoc, []],
  ];
  for (const [id, doc, grads] of previews) {
    const rendered = renderScene(doc, {}, { gradients: grads });
    const png = encodeApng({ width: doc.viewport.width, height: doc.viewport.height, frames: [{ rgba: new Uint8Array(rendered.framebuffer.data), delayMs: 100 }], loopCount: 0 });
    writeFileSync(`tmp/showcase-${id}.png`, png);
    console.log(`tmp/showcase-${id}.png (raster önizleme, uyarı: ${rendered.warnings.length === 0 ? "yok" : rendered.warnings.join("; ")})`);
  }
}

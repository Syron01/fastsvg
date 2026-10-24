// v0.3 yeni algoritmalar: scanline span dolgu + gradient LUT rasterizasyonu.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createFramebuffer, fillRect, fillPolygon, fillCircle,
  buildGradientLut, GRADIENT_LUT_SIZE,
} from "../src/index.js";

const BLUE: [number, number, number, number] = [0, 0, 255, 255];

test("buildGradientLut uçları stop renkleriyle eşleşir", () => {
  const lut = buildGradientLut([
    { offset: 0, color: [0, 0, 0, 255] },
    { offset: 1, color: [255, 255, 255, 128] },
  ]);
  assert.equal(lut.length, GRADIENT_LUT_SIZE * 4);
  assert.deepEqual([...lut.subarray(0, 4)], [0, 0, 0, 255]);
  assert.deepEqual([...lut.subarray((GRADIENT_LUT_SIZE - 1) * 4, GRADIENT_LUT_SIZE * 4)], [255, 255, 255, 128]);
  // Orta nokta iki rengin ortalamasına yakın olmalı (LUT adım kuantizasyonu ±2).
  const mid = Math.floor(GRADIENT_LUT_SIZE / 2) * 4;
  assert.ok(Math.abs(lut[mid]! - 128) <= 2, `orta r: ${lut[mid]}`);
  assert.ok(Math.abs(lut[mid + 3]! - 192) <= 2, `orta alpha: ${lut[mid + 3]}`);
});

test("buildGradientLut stopları offset sırasına göre dizler", () => {
  const lut = buildGradientLut([
    { offset: 1, color: [0, 255, 0, 255] },
    { offset: 0, color: [255, 0, 0, 255] },
  ]);
  assert.deepEqual([...lut.subarray(0, 4)], [255, 0, 0, 255]);
  assert.deepEqual([...lut.subarray((GRADIENT_LUT_SIZE - 1) * 4, GRADIENT_LUT_SIZE * 4)], [0, 255, 0, 255]);
});

test("dikey linear gradient rect üst/alt renkleri doğru örnekler", () => {
  const fb = createFramebuffer(16, 32, [0, 0, 0, 255]);
  fillRect(fb, 0, 0, 16, 32, {
    color: BLUE,
    gradient: { kind: "linear", x1: 0, y1: 0, x2: 0, y2: 32, lut: buildGradientLut([{ offset: 0, color: [255, 0, 0, 255] }, { offset: 1, color: [0, 0, 255, 255] }]) },
  });
  const top = (2 * 16 + 8) * 4;
  const bottom = (29 * 16 + 8) * 4;
  assert.ok(fb.data[top]! > 200, `üst kırmızı ağırlıklı olmalı: ${fb.data[top]}`);
  assert.ok(fb.data[top + 2]! < 60, `üst mavi az olmalı: ${fb.data[top + 2]}`);
  assert.ok(fb.data[bottom]! < 60, `alt kırmızı az olmalı: ${fb.data[bottom]}`);
  assert.ok(fb.data[bottom + 2]! > 200, `alt mavi ağırlıklı olmalı: ${fb.data[bottom + 2]}`);
});

test("radial gradient merkezde iç renk, kenarda dış renk verir", () => {
  const fb = createFramebuffer(32, 32, [0, 0, 0, 0]); // saydam zemin
  fillCircle(fb, 16, 16, 12, {
    color: BLUE,
    gradient: { kind: "radial", cx: 16, cy: 16, r: 12, lut: buildGradientLut([{ offset: 0, color: [255, 255, 0, 255] }, { offset: 1, color: [255, 0, 0, 0] }]) },
  });
  const center = (16 * 32 + 16) * 4;
  assert.ok(fb.data[center]! > 200, `merkez sarı olmalı: ${fb.data[center]}`);
  assert.ok(fb.data[center + 1]! > 200, `merkez yeşil bileşen: ${fb.data[center + 1]}`);
  // Kenar (r≈11.5) alpha düşmüş olmalı (saydam zeminde alpha = kapsama×gradient alpha).
  const edge = (16 * 32 + 27) * 4;
  assert.ok(fb.data[edge + 3]! < 100, `kenar alpha düşük olmalı: ${fb.data[edge + 3]}`);
});

test("scanline fillPolygon alan kapsaması doğruluğu korunur", () => {
  // 10×10 kare, 100 pikselin hepsi tam kapsanmalı (saydam zeminde alpha ile sayılır).
  const fb = createFramebuffer(20, 20, [0, 0, 0, 0]);
  fillPolygon(fb, [
    { x: 5, y: 5 }, { x: 15, y: 5 }, { x: 15, y: 15 }, { x: 5, y: 15 },
  ], { color: [255, 255, 255, 255] });
  let count = 0;
  for (let i = 0; i < 20 * 20; i += 1) {
    if (fb.data[i * 4 + 3]! > 0) count += 1;
  }
  assert.equal(count, 100);
});

test("scanline fillPolygon even-odd kuralıyla delik üretir (halka)", () => {
  // Dış kare + iç kare tek nokta listesinde: even-odd merkezdeki 6×6 bölgeyi boş bırakır.
  const fb = createFramebuffer(20, 20, [0, 0, 0, 0]);
  fillPolygon(fb, [
    { x: 2, y: 2 }, { x: 18, y: 2 }, { x: 18, y: 18 }, { x: 2, y: 18 },
    { x: 8, y: 8 }, { x: 14, y: 8 }, { x: 14, y: 14 }, { x: 8, y: 14 },
  ], { color: [255, 255, 255, 255] });
  // Delik merkezi (11,11) boş, halka üst kısmı (5,5) dolu.
  assert.equal(fb.data[(11 * 20 + 11) * 4 + 3], 0);
  assert.ok(fb.data[(5 * 20 + 5) * 4 + 3]! > 200);
});

test("scanline fillPolygon basit yıldız çokgeninde merkez dolu kalır", () => {
  const fb = createFramebuffer(40, 40, [0, 0, 0, 0]);
  const cx = 20;
  const cy = 20;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? 18 : 7;
    const a = (i / 8) * 2 * Math.PI;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  fillPolygon(fb, pts, { color: [255, 255, 255, 255] });
  // Çevre sıralı basit çokgen: merkez içeride, uçlar dolu.
  assert.ok(fb.data[(cy * 40 + cx) * 4 + 3]! > 200);
  const tip = (cy * 40 + (cx + 14)) * 4;
  assert.ok(fb.data[tip + 3]! > 200);
});

test("fillRect kısmi piksel kenarlarında AA uygular", () => {
  const fb = createFramebuffer(10, 10, [0, 0, 0, 0]);
  fillRect(fb, 0.5, 0.5, 4, 4, { color: [255, 255, 255, 255] });
  // (0,0) köşe: x'te 0.5, y'de 0.5 kapsama → 2× dikey örneklemede ~%25 alpha.
  assert.ok(fb.data[3]! > 40 && fb.data[3]! < 100, `kenar alpha: ${fb.data[3]}`);
  // Kenar ortası (2,0): y'de yarı, x'te tam → ~%50 alpha.
  assert.ok(fb.data[(0 * 10 + 2) * 4 + 3]! > 90 && fb.data[(0 * 10 + 2) * 4 + 3]! < 160, `üst kenar alpha: ${fb.data[(0 * 10 + 2) * 4 + 3]}`);
  // Tam iç piksel (2,2) tam kaplı.
  assert.equal(fb.data[(2 * 10 + 2) * 4 + 3], 255);
});

test("gradient fill fillPolygon ile çalışır (üçgen)", () => {
  const fb = createFramebuffer(32, 32, [0, 0, 0, 0]);
  fillPolygon(fb, [
    { x: 0, y: 0 }, { x: 32, y: 0 }, { x: 16, y: 32 },
  ], {
    color: BLUE,
    gradient: { kind: "linear", x1: 0, y1: 0, x2: 0, y2: 32, lut: buildGradientLut([{ offset: 0, color: [255, 0, 0, 255] }, { offset: 1, color: [0, 255, 0, 255] }]) },
  });
  const top = (1 * 32 + 16) * 4;
  const bottom = (30 * 32 + 16) * 4;
  assert.ok(fb.data[top]! > 180 && fb.data[top + 1]! < 80, `üst: ${fb.data[top]},${fb.data[top + 1]}`);
  assert.ok(fb.data[bottom + 1]! > 180 && fb.data[bottom]! < 80, `alt: ${fb.data[bottom]},${fb.data[bottom + 1]}`);
});

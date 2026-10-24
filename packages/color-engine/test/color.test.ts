import { test } from "node:test";
import assert from "node:assert/strict";
import {
  srgbToLinearChannel, linearToSrgbChannel,
  srgbToOkLab, okLabToSrgb, interpolate,
  contrastRatio, parseHexColor, formatHexColor,
  buildToneScale, okLabToOkLch, okLchToOkLchLab,
} from "../src/index.js";

test("sRGB gamma round-trip", () => {
  for (let i = 0; i <= 10; i += 1) {
    const v = i / 10;
    assert.ok(Math.abs(linearToSrgbChannel(srgbToLinearChannel(v)) - v) < 1e-9);
  }
});

test("beyaz ve siyah OKLab referans değerleri", () => {
  const white = srgbToOkLab({ r: 1, g: 1, b: 1 });
  assert.ok(Math.abs(white.L - 1) < 1e-6, `beyaz L: ${white.L}`);
  assert.ok(Math.abs(white.a) < 1e-6 && Math.abs(white.b) < 1e-6);
  const black = srgbToOkLab({ r: 0, g: 0, b: 0 });
  assert.ok(Math.abs(black.L) < 1e-6);
});

test("OKLab round-trip hatası görsel eşik altında", () => {
  const colors = ["#ff0000", "#22cc88", "#3366ff", "#ffaa00", "#804060"].map(parseHexColor) as { r: number; g: number; b: number }[];
  for (const c of colors) {
    const back = okLabToSrgb(srgbToOkLab(c));
    assert.ok(Math.abs(back.r - c.r) < 1e-6 && Math.abs(back.g - c.g) < 1e-6 && Math.abs(back.b - c.b) < 1e-6);
  }
});

test("OKLCH round-trip", () => {
  const lch = okLabToOkLch({ L: 0.6, a: 0.1, b: -0.15 });
  const back = okLchToOkLchLab(lch);
  assert.ok(Math.abs(back.L - 0.6) < 1e-9 && Math.abs(back.a - 0.1) < 1e-9 && Math.abs(back.b + 0.15) < 1e-9);
  assert.ok(lch.h >= 0 && lch.h < 360);
});

test("OKLab interpolasyonu sRGB'den daha algısal düz geçiş üretir", () => {
  const a = parseHexColor("#ff0000")!;
  const b = parseHexColor("#0000ff")!;
  const midOklab = interpolate(a, b, 0.5, "oklab");
  const midSrgb = interpolate(a, b, 0.5, "srgb");
  // sRGB orta noktası mora çalar (r≈b), OKLab daha dengeli L üretir; sadece farklılığını kanıtla.
  const ok = srgbToOkLab(midOklab);
  const sr = srgbToOkLab(midSrgb);
  assert.ok(Math.abs(ok.a - sr.a) > 1e-3 || Math.abs(ok.b - sr.b) > 1e-3);
  assert.ok(midOklab.r >= 0 && midOklab.r <= 1 && midOklab.b >= 0 && midOklab.b <= 1);
});

test("kontrast oranı WCAG referanslarıyla uyumlu", () => {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 1, g: 1, b: 1 };
  assert.ok(Math.abs(contrastRatio(black, white) - 21) < 0.1);
  // #767676 gri, beyazla ~4.54:1 (bilinen WCAG eşiği örneği).
  const gray = parseHexColor("#767676")!;
  assert.ok(contrastRatio(gray, white) > 4.5 && contrastRatio(gray, white) < 4.6);
});

test("hex parse ve format round-trip", () => {
  assert.deepEqual(parseHexColor("#f00"), { r: 1, g: 0, b: 0 });
  assert.deepEqual(parseHexColor("#00ff00"), { r: 0, g: 1, b: 0 });
  assert.equal(parseHexColor("kirmizi"), null);
  assert.equal(parseHexColor("#12345"), null);
  assert.equal(formatHexColor({ r: 1, g: 0.5, b: 0 }), "#ff8000");
});

test("ton skalası 5 adım üretir ve hue korur", () => {
  const scale = buildToneScale("#2563eb")!;
  assert.equal(scale.steps.length, 5);
  const baseLch = okLabToOkLch(srgbToOkLab(parseHexColor("#2563eb")!));
  const midLch = okLabToOkLch(srgbToOkLab(parseHexColor(scale.steps[2]!)!));
  // Hue ±2° içinde korunmalı (yuvarlama payı).
  const diff = Math.abs(baseLch.h - midLch.h);
  assert.ok(diff < 2, `hue kayması: ${diff}°`);
});

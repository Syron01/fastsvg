import test from "node:test";
import assert from "node:assert/strict";
import { encodeApng, decodePng, findDirtyRect } from "../src/index.js";

test("findDirtyRect: Değişen dikdörtgen bölgesini doğru tespit eder", () => {
  const width = 100;
  const height = 100;
  const frameA = new Uint8Array(width * height * 4);
  const frameB = new Uint8Array(width * height * 4);

  // Sadece (20,30) ile (40,50) arasındaki bölgeyi değiştir
  for (let y = 30; y <= 50; y++) {
    for (let x = 20; x <= 40; x++) {
      const idx = (y * width + x) * 4;
      frameB[idx] = 255;
      frameB[idx + 1] = 128;
      frameB[idx + 2] = 64;
      frameB[idx + 3] = 255;
    }
  }

  const dirty = findDirtyRect(frameA, frameB, width, height);
  assert.equal(dirty.identical, false);
  assert.equal(dirty.x, 20);
  assert.equal(dirty.y, 30);
  assert.equal(dirty.w, 21); // 40 - 20 + 1
  assert.equal(dirty.h, 21); // 50 - 30 + 1
});

test("findDirtyRect: Tamamen aynı iki kare identical döner", () => {
  const frame = new Uint8Array(50 * 50 * 4);
  frame.fill(120);
  const dirty = findDirtyRect(frame, frame, 50, 50);
  assert.equal(dirty.identical, true);
});

test("APNG delta frame round-trip ve dosya boyutu tasarrufu", () => {
  const width = 120;
  const height = 120;
  const frame1 = new Uint8Array(width * height * 4);
  // Arka plan beyaz
  for (let i = 0; i < frame1.length; i += 4) {
    frame1[i] = 255; frame1[i + 1] = 255; frame1[i + 2] = 255; frame1[i + 3] = 255;
  }

  // Frame 2: Sadece (10,10)-(20,20) arasında 10x10 kırmızı kare
  const frame2 = new Uint8Array(frame1);
  for (let y = 10; y < 20; y++) {
    for (let x = 10; x < 20; x++) {
      const idx = (y * width + x) * 4;
      frame2[idx] = 255; frame2[idx + 1] = 0; frame2[idx + 2] = 0; frame2[idx + 3] = 255;
    }
  }

  // Frame 3: Kırmızı kare (30,30)-(40,40)'a taşınır, eski yeri beyaza döner
  const frame3 = new Uint8Array(frame1);
  for (let y = 30; y < 40; y++) {
    for (let x = 30; x < 40; x++) {
      const idx = (y * width + x) * 4;
      frame3[idx] = 255; frame3[idx + 1] = 0; frame3[idx + 2] = 0; frame3[idx + 3] = 255;
    }
  }

  const frames = [
    { rgba: frame1, delayMs: 50 },
    { rgba: frame2, delayMs: 50 },
    { rgba: frame3, delayMs: 50 },
  ];

  // Delta kapalı (full frame)
  const fullBuf = encodeApng({ width, height, frames, loopCount: 0, deltaOptimization: false });

  // Delta açık (delta frame)
  const deltaBuf = encodeApng({ width, height, frames, loopCount: 0, deltaOptimization: true });

  // Delta sıkıştırması daha küçük olmalı
  assert.ok(deltaBuf.length < fullBuf.length, `Delta (${deltaBuf.length}b) tam boyuttan (${fullBuf.length}b) küçük olmalı`);

  // Decode testi: Delta ile kodlanan dosya kayıpsız olarak tüm pikselleriyle çözülmeli
  const decoded = decodePng(deltaBuf);
  assert.equal(decoded.frameCount, 3);
  assert.equal(decoded.width, width);
  assert.equal(decoded.height, height);

  const frameSize = width * height * 4;
  // Frame 1 pikselleri
  assert.deepEqual(decoded.rgba.subarray(0, frameSize), frame1);
  // Frame 2 pikselleri
  assert.deepEqual(decoded.rgba.subarray(frameSize, frameSize * 2), frame2);
  // Frame 3 pikselleri
  assert.deepEqual(decoded.rgba.subarray(frameSize * 2, frameSize * 3), frame3);
});

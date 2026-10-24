import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeApng, encodePng, decodePng, PngError } from "../src/index.js";

function solidFrame(size: number, r: number, g: number, b: number, a = 255): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return data;
}

test("PNG round-trip: encode → decode pikselleri korur", () => {
  const size = 8;
  const original = solidFrame(size, 200, 30, 90);
  const encoded = encodePng(size, size, original);
  assert.ok(encoded.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));
  const decoded = decodePng(encoded);
  assert.equal(decoded.width, size);
  assert.equal(decoded.height, size);
  assert.equal(decoded.isAnimated, false);
  assert.deepEqual(Array.from(decoded.rgba), Array.from(original));
});

test("APNG round-trip: frame sayısı, süreler ve pikseller", () => {
  const size = 6;
  const frames = [
    { rgba: solidFrame(size, 255, 0, 0), delayMs: 100 },
    { rgba: solidFrame(size, 0, 255, 0), delayMs: 50 },
    { rgba: solidFrame(size, 0, 0, 255), delayMs: 250 },
  ];
  const encoded = encodeApng({ width: size, height: size, frames, loopCount: 0 });
  const decoded = decodePng(encoded);
  assert.equal(decoded.isAnimated, true);
  assert.equal(decoded.frameCount, 3);
  assert.equal(decoded.loopCount, 0);
  assert.deepEqual(decoded.delaysMs.map((d) => Math.round(d)), [100, 50, 250]);
  // Her frame'in kendi rengi korunmalı.
  assert.equal(decoded.rgba[0], 255); // frame 0 kırmızı
  assert.equal(decoded.rgba[size * size * 4 + 1], 255); // frame 1 yeşil (g kanalı)
  assert.equal(decoded.rgba[size * size * 8 + 2], 255); // frame 2 mavi (b kanalı)
});

test("APNG alpha kanalı korunur", () => {
  const size = 4;
  const frames = [{ rgba: solidFrame(size, 10, 20, 30, 128), delayMs: 100 }];
  // Tek frame animasyon sayılmaz; decode isAnimated=false döner ama alpha korunur.
  const decoded = decodePng(encodeApng({ width: size, height: size, frames, loopCount: 0 }));
  assert.equal(decoded.rgba[3], 128);
});

test("geçersiz girdiler kontrollü hata verir", () => {
  assert.throws(() => encodeApng({ width: -1, height: 4, frames: [], loopCount: 0 }), PngError);
  assert.throws(() => encodeApng({ width: 4, height: 4, frames: [], loopCount: 0 }), PngError);
  assert.throws(() => encodeApng({ width: 4, height: 4, frames: [{ rgba: new Uint8Array(3), delayMs: 100 }], loopCount: 0 }), PngError);
  assert.throws(() => encodeApng({ width: 4, height: 4, frames: [{ rgba: new Uint8Array(64), delayMs: -1 }], loopCount: 0 }), PngError);
});

test("bozuk dosya: CRC hatası yakalanır", () => {
  const encoded = encodePng(4, 4, solidFrame(4, 1, 2, 3));
  // CRC bölgesini boz: son 8 byte (IEND crc sonrası) değil, ilk IDAT crc'sini hedefle.
  const corrupted = Buffer.from(encoded);
  corrupted[40] ^= 0xff; // IDAT veri bölgesi
  assert.throws(() => decodePng(corrupted), PngError);
});

test("imzasız dosya reddedilir", () => {
  assert.throws(() => decodePng(Buffer.from("bu bir png değil")), PngError);
});

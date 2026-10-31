// PNG/APNG encoder + decoder (RGBA 8-bit, renk tipi 6).
// v0.3+: Delta-frame optimizasyonu (dirty rect, fcTL x/y offset, dispose/blend ops) ve tam decoder desteği.

import { deflateSync, inflateSync } from "node:zlib";

export class PngError extends Error {}

// ---- CRC32 ----
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table.push(c >>> 0);
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function writeChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function u32(value: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(value >>> 0, 0);
  return b;
}

function u16(value: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(value & 0xffff, 0);
  return b;
}

export interface ApngFrame {
  rgba: Uint8Array; // width*height*4
  delayMs: number;
}

export interface ApngEncodeOptions {
  width: number;
  height: number;
  frames: ApngFrame[];
  loopCount: number; // 0 = sonsuz
  deltaOptimization?: boolean; // Varsayılan: true
}

const MAX_FRAME_DIM = 8192;

interface DirtyRect {
  x: number;
  y: number;
  w: number;
  h: number;
  identical: boolean;
}

// İki ardışık kare arasındaki değişen piksellerin sınırlayıcı kutusunu (dirty rect) bulur
export function findDirtyRect(
  prevRgba: Uint8Array,
  currRgba: Uint8Array,
  width: number,
  height: number,
): DirtyRect {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const idx = rowOffset + x * 4;
      if (
        currRgba[idx] !== prevRgba[idx] ||
        currRgba[idx + 1] !== prevRgba[idx + 1] ||
        currRgba[idx + 2] !== prevRgba[idx + 2] ||
        currRgba[idx + 3] !== prevRgba[idx + 3]
      ) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1) {
    return { x: 0, y: 0, w: 1, h: 1, identical: true };
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    identical: false,
  };
}

// Belli bir dikdörtgen bölgeyi uncompressed PNG raw scanline formatına çevirir
function rawForRegion(
  rgba: Uint8Array,
  fullWidth: number,
  x: number,
  y: number,
  w: number,
  h: number,
): Buffer {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let row = 0; row < h; row += 1) {
    raw[row * (stride + 1)] = 0; // Filter 0 (None)
    const srcOffset = ((y + row) * fullWidth + x) * 4;
    Buffer.from(rgba.buffer, rgba.byteOffset + srcOffset, stride).copy(
      raw,
      row * (stride + 1) + 1,
    );
  }
  return raw;
}

export function encodeApng(options: ApngEncodeOptions): Buffer {
  const { width, height, frames, loopCount, deltaOptimization = true } = options;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width > MAX_FRAME_DIM || height > MAX_FRAME_DIM) {
    throw new PngError(`Geçersiz boyut: ${width}×${height}`);
  }
  if (frames.length === 0) throw new PngError("En az bir frame gerekli");
  const expected = width * height * 4;
  for (const f of frames) {
    if (f.rgba.length !== expected) {
      throw new PngError(`Frame boyutu uyuşmuyor: ${f.rgba.length} ≠ ${expected}`);
    }
    if (!Number.isFinite(f.delayMs) || f.delayMs <= 0) {
      throw new PngError(`Geçersiz frame süresi: ${f.delayMs}ms`);
    }
  }

  const isAnimated = frames.length > 1;
  const parts: Buffer[] = [PNG_SIGNATURE];

  // IHDR: RGBA 8-bit
  const ihdr = Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])]);
  parts.push(writeChunk("IHDR", ihdr));

  let sequence = 0;
  if (isAnimated) {
    const actl = Buffer.concat([u32(frames.length), u32(loopCount)]);
    parts.push(writeChunk("acTL", actl));
  }

  const delayFor = (ms: number): { num: number; den: number } => {
    return { num: Math.round(ms), den: 1000 };
  };

  // Frame 0 her zaman tam boyutlu olarak kodlanır
  const first = frames[0]!;
  if (isAnimated) {
    const d = delayFor(first.delayMs);
    parts.push(
      writeChunk(
        "fcTL",
        Buffer.concat([
          u32(sequence++),
          u32(width),
          u32(height),
          u32(0),
          u32(0),
          u16(d.num),
          u16(d.den),
          Buffer.from([0, 0]), // dispose_op: 0 (NONE), blend_op: 0 (SOURCE)
        ]),
      ),
    );
  }
  const firstRaw = rawForRegion(first.rgba, width, 0, 0, width, height);
  parts.push(writeChunk("IDAT", deflateSync(firstRaw, { level: 6 })));

  // Frame 1..N: Delta optimizasyonu ile sadece değişen bölgeyi kodla
  for (let i = 1; i < frames.length; i += 1) {
    const frame = frames[i]!;
    const d = delayFor(frame.delayMs);

    let frameX = 0;
    let frameY = 0;
    let frameW = width;
    let frameH = height;

    if (deltaOptimization) {
      const dirty = findDirtyRect(frames[i - 1]!.rgba, frame.rgba, width, height);
      if (dirty.identical) {
        // Karede hiç piksel değişmemişse: 1x1 piksel
        frameX = 0;
        frameY = 0;
        frameW = 1;
        frameH = 1;
      } else {
        frameX = dirty.x;
        frameY = dirty.y;
        frameW = dirty.w;
        frameH = dirty.h;
      }
    }

    // fcTL: sequence, width, height, x_offset, y_offset, delay_num, delay_den, dispose_op, blend_op
    // dispose_op = 0 (APNG_DISPOSE_OP_NONE - bir önceki karenin üstüne çiz), blend_op = 0 (SOURCE)
    parts.push(
      writeChunk(
        "fcTL",
        Buffer.concat([
          u32(sequence++),
          u32(frameW),
          u32(frameH),
          u32(frameX),
          u32(frameY),
          u16(d.num),
          u16(d.den),
          Buffer.from([0, 0]),
        ]),
      ),
    );

    const raw = rawForRegion(frame.rgba, width, frameX, frameY, frameW, frameH);
    const compressed = deflateSync(raw, { level: 6 });
    parts.push(writeChunk("fdAT", Buffer.concat([u32(sequence++), compressed])));
  }

  parts.push(writeChunk("IEND", Buffer.alloc(0)));
  return Buffer.concat(parts);
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  return encodeApng({ width, height, frames: [{ rgba, delayMs: 100 }], loopCount: 0, deltaOptimization: false });
}

// ---- Decoder ----

export interface DecodedPng {
  width: number;
  height: number;
  rgba: Uint8Array;
  frameCount: number;
  loopCount: number;
  delaysMs: number[];
  isAnimated: boolean;
}

interface RawChunk {
  type: string;
  data: Buffer;
}

function parseChunks(buffer: Buffer): RawChunk[] {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new PngError("PNG imzası geçersiz");
  }
  const chunks: RawChunk[] = [];
  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    if (dataStart + length + 4 > buffer.length) throw new PngError(`Chunk taşması: ${type}`);
    const data = buffer.subarray(dataStart, dataStart + length);
    const expectedCrc = buffer.readUInt32BE(dataStart + length);
    const actualCrc = crc32(buffer.subarray(offset + 4, dataStart + length));
    if (expectedCrc !== actualCrc) throw new PngError(`CRC hatası: ${type}`);
    chunks.push({ type, data });
    offset = dataStart + length + 4;
    if (type === "IEND") break;
  }
  return chunks;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(raw: Buffer, width: number, height: number, bpp: number): Uint8Array {
  const stride = width * bpp;
  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)]!;
    const rowStart = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x += 1) {
      const rawByte = raw[rowStart + x]!;
      const left = x >= bpp ? out[y * stride + x - bpp]! : 0;
      const up = y > 0 ? out[(y - 1) * stride + x]! : 0;
      const upLeft = y > 0 && x >= bpp ? out[(y - 1) * stride + x - bpp]! : 0;
      let value: number;
      switch (filter) {
        case 0: value = rawByte; break;
        case 1: value = rawByte + left; break;
        case 2: value = rawByte + up; break;
        case 3: value = rawByte + ((left + up) >> 1); break;
        case 4: value = rawByte + paeth(left, up, upLeft); break;
        default: throw new PngError(`Bilinmeyen filtre: ${filter}`);
      }
      out[y * stride + x] = value & 0xff;
    }
  }
  return out;
}

export function decodePng(buffer: Buffer): DecodedPng {
  const chunks = parseChunks(buffer);
  const ihdr = chunks.find((c) => c.type === "IHDR");
  if (!ihdr || ihdr.data.length < 13) throw new PngError("IHDR eksik");
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8]!;
  const colorType = ihdr.data[9]!;
  if (bitDepth !== 8 || colorType !== 6) {
    throw new PngError(`Desteklenmeyen format: bitDepth=${bitDepth}, colorType=${colorType} (yalnızca RGBA8)`);
  }
  const actl = chunks.find((c) => c.type === "acTL");
  const isAnimated = actl !== undefined;
  const frameCount = isAnimated ? actl!.data.readUInt32BE(0) : 1;
  const loopCount = isAnimated ? actl!.data.readUInt32BE(4) : 0;

  const bpp = 4;
  const frameSize = width * height * 4;
  const rgba = new Uint8Array(frameSize * frameCount);
  const delaysMs: number[] = [];

  let pendingDelay = 100;
  let pendingW = width;
  let pendingH = height;
  let pendingX = 0;
  let pendingY = 0;
  let pendingDispose = 0;
  let pendingBlend = 0;

  let frameIndex = 0;
  let lastSeq = -1;

  // Unfilter edilen bölge verisini frame buffer'ına yerleştirme (delta frame desteği)
  const applyRegionToFrame = (
    targetFrameRgba: Uint8Array,
    unfiltered: Uint8Array,
    fw: number,
    fh: number,
    fx: number,
    fy: number,
    blendOp: number,
  ): void => {
    for (let r = 0; r < fh; r += 1) {
      const srcRowStart = r * fw * 4;
      const dstRowStart = ((fy + r) * width + fx) * 4;
      if (blendOp === 0) {
        // APNG_BLEND_OP_SOURCE: Üzerine yaz
        targetFrameRgba.set(
          unfiltered.subarray(srcRowStart, srcRowStart + fw * 4),
          dstRowStart,
        );
      } else {
        // APNG_BLEND_OP_OVER: Alpha blend
        for (let c = 0; c < fw; c += 1) {
          const sIdx = srcRowStart + c * 4;
          const dIdx = dstRowStart + c * 4;
          const sa = unfiltered[sIdx + 3]! / 255;
          const da = targetFrameRgba[dIdx + 3]! / 255;
          const outA = sa + da * (1 - sa);
          if (outA > 0) {
            targetFrameRgba[dIdx] = Math.round(
              (unfiltered[sIdx]! * sa + targetFrameRgba[dIdx]! * da * (1 - sa)) / outA,
            );
            targetFrameRgba[dIdx + 1] = Math.round(
              (unfiltered[sIdx + 1]! * sa + targetFrameRgba[dIdx + 1]! * da * (1 - sa)) / outA,
            );
            targetFrameRgba[dIdx + 2] = Math.round(
              (unfiltered[sIdx + 2]! * sa + targetFrameRgba[dIdx + 2]! * da * (1 - sa)) / outA,
            );
            targetFrameRgba[dIdx + 3] = Math.round(outA * 255);
          }
        }
      }
    }
  };

  for (const chunk of chunks) {
    if (chunk.type === "fcTL") {
      const seq = chunk.data.readUInt32BE(0);
      if (seq !== lastSeq + 1) throw new PngError(`fcTL sıra numarası atlandı: ${seq} (beklenen ${lastSeq + 1})`);
      lastSeq = seq;
      pendingW = chunk.data.readUInt32BE(4);
      pendingH = chunk.data.readUInt32BE(8);
      pendingX = chunk.data.readUInt32BE(12);
      pendingY = chunk.data.readUInt32BE(16);
      const num = chunk.data.readUInt16BE(20);
      const den = chunk.data.readUInt16BE(22) || 100;
      pendingDelay = (num / den) * 1000;
      pendingDispose = chunk.data[24] ?? 0;
      pendingBlend = chunk.data[25] ?? 0;
    } else if (chunk.type === "IDAT") {
      if (isAnimated && frameIndex !== 0) throw new PngError("Animasyonda IDAT yalnızca ilk frame olmalı");
      const unfiltered = unfilter(inflateSync(chunk.data), pendingW, pendingH, bpp);
      const frameTarget = rgba.subarray(0, frameSize);
      applyRegionToFrame(frameTarget, unfiltered, pendingW, pendingH, pendingX, pendingY, pendingBlend);
      delaysMs.push(pendingDelay);
      frameIndex += 1;
    } else if (chunk.type === "fdAT") {
      const seq = chunk.data.readUInt32BE(0);
      if (seq !== lastSeq + 1) throw new PngError(`fdAT sıra numarası atlandı: ${seq} (beklenen ${lastSeq + 1})`);
      lastSeq = seq;
      const payload = chunk.data.subarray(4);
      const unfiltered = unfilter(inflateSync(Buffer.from(payload)), pendingW, pendingH, bpp);

      const base = frameIndex * frameSize;
      const prevBase = (frameIndex - 1) * frameSize;
      const frameTarget = rgba.subarray(base, base + frameSize);

      // Delta APNG: Önceki karenin içeriğini kopyalayarak başla (APNG_DISPOSE_OP_NONE)
      frameTarget.set(rgba.subarray(prevBase, prevBase + frameSize));

      applyRegionToFrame(frameTarget, unfiltered, pendingW, pendingH, pendingX, pendingY, pendingBlend);
      delaysMs.push(pendingDelay);
      frameIndex += 1;
    }
  }

  if (frameIndex !== frameCount) {
    throw new PngError(`Frame sayısı uyuşmuyor: ${frameIndex} ≠ ${frameCount}`);
  }

  return { width, height, rgba, frameCount, loopCount, delaysMs, isAnimated };
}

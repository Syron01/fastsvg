// PNG/APNG encoder + decoder (RGBA 8-bit, renk tipi 6).
// Encoder: filter 0 satırlar + zlib deflate. Decoder: 0-4 tüm filtreleri çözer.
// APNG: acTL/fcTL/fdAT chunk'ları, sequence numaraları doğrulanır.

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
}

const MAX_FRAME_DIM = 8192;

export function encodeApng(options: ApngEncodeOptions): Buffer {
  const { width, height, frames, loopCount } = options;
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

  // IHDR: bit depth 8, color type 6 (RGBA), compression 0, filter 0, interlace 0.
  const ihdr = Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])]);
  parts.push(writeChunk("IHDR", ihdr));

  let sequence = 0;
  if (isAnimated) {
    const actl = Buffer.concat([u32(frames.length), u32(loopCount)]);
    parts.push(writeChunk("acTL", actl));
  }

  const rawFor = (rgba: Uint8Array): Buffer => {
    const stride = width * 4;
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y += 1) {
      raw[y * (stride + 1)] = 0; // filter type 0 (None)
      Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
    }
    return raw;
  };

  const delayFor = (ms: number): { num: number; den: number } => {
    // APNG delay: num/den saniye. Milisaniye doğruluğu için den=1000.
    return { num: Math.round(ms), den: 1000 };
  };

  const first = frames[0]!;
  if (isAnimated) {
    const d = delayFor(first.delayMs);
    parts.push(writeChunk("fcTL", Buffer.concat([u32(sequence++), u32(width), u32(height), u32(0), u32(0), u16(d.num), u16(d.den), Buffer.from([0, 0])])));
  }
  parts.push(writeChunk(isAnimated ? "IDAT" : "IDAT", deflateSync(rawFor(first.rgba), { level: 6 })));

  for (let i = 1; i < frames.length; i += 1) {
    const frame = frames[i]!;
    const d = delayFor(frame.delayMs);
    parts.push(writeChunk("fcTL", Buffer.concat([u32(sequence++), u32(width), u32(height), u32(0), u32(0), u16(d.num), u16(d.den), Buffer.from([0, 0])])));
    const raw = rawFor(frame.rgba);
    const compressed = deflateSync(raw, { level: 6 });
    // fdAT: sequence number + compressed data
    parts.push(writeChunk("fdAT", Buffer.concat([u32(sequence++), compressed])));
  }

  parts.push(writeChunk("IEND", Buffer.alloc(0)));
  return Buffer.concat(parts);
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  return encodeApng({ width, height, frames: [{ rgba, delayMs: 100 }], loopCount: 0 });
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
    const prevStart = (y - 1) * (stride + 1) + 1;
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
  // fcTL her frame'den önce gelir ve o frame'in süresini taşır.
  const delaysMs: number[] = [];
  let pendingDelay = 100;
  let frameIndex = 0;
  let lastSeq = -1;

  const writeFrameRegion = (target: Uint8Array, base: number, raw: Buffer): void => {
    const unfiltered = unfilter(raw, width, height, bpp);
    target.set(unfiltered, base);
  };

  for (const chunk of chunks) {
    if (chunk.type === "fcTL") {
      const seq = chunk.data.readUInt32BE(0);
      if (seq !== lastSeq + 1) throw new PngError(`fcTL sıra numarası atlandı: ${seq} (beklenen ${lastSeq + 1})`);
      lastSeq = seq;
      const num = chunk.data.readUInt16BE(20);
      const den = chunk.data.readUInt16BE(22) || 100;
      pendingDelay = (num / den) * 1000;
    } else if (chunk.type === "IDAT") {
      if (isAnimated && frameIndex !== 0) throw new PngError("Animasyonda IDAT yalnızca ilk frame olmalı");
      writeFrameRegion(rgba, 0, inflateSync(chunk.data));
      delaysMs.push(pendingDelay);
      frameIndex += 1;
    } else if (chunk.type === "fdAT") {
      const seq = chunk.data.readUInt32BE(0);
      if (seq !== lastSeq + 1) throw new PngError(`fdAT sıra numarası atlandı: ${seq} (beklenen ${lastSeq + 1})`);
      lastSeq = seq;
      const payload = chunk.data.subarray(4);
      const base = frameIndex * frameSize;
      writeFrameRegion(rgba.subarray(base, base + frameSize), 0, inflateSync(Buffer.from(payload)));
      delaysMs.push(pendingDelay);
      frameIndex += 1;
    }
  }

  if (frameIndex !== frameCount) {
    throw new PngError(`Frame sayısı uyuşmuyor: ${frameIndex} ≠ ${frameCount}`);
  }

  return { width, height, rgba, frameCount, loopCount, delaysMs, isAnimated };
}

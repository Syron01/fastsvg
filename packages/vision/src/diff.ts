// Görsel karşılaştırma: piksel diff, değişim bbox, kanal hataları.
// Bu modül algısal SSIM içermez; sayısal piksel farkları ölçer. Tek skor estetik gerçek değildir.

export interface DiffOptions {
  // Antialiasing toleransı: kanal farkı bu değerin altındaki pikseller "aynı" sayılır.
  channelTolerance: number; // 0..255
}

export const DEFAULT_DIFF_OPTIONS: DiffOptions = { channelTolerance: 2 };

export interface DiffRegion {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ImageDiffReport {
  width: number;
  height: number;
  changedPixels: number;
  changedRatio: number;
  meanAbsError: number; // RGB kanallarında ortalama |fark|
  maxAbsError: number;
  changedRegion: DiffRegion | null;
}

export class DiffError extends Error {}

export function diffImages(a: Uint8Array, b: Uint8Array, width: number, height: number, options: DiffOptions = DEFAULT_DIFF_OPTIONS): ImageDiffReport {
  const expected = width * height * 4;
  if (a.length !== expected || b.length !== expected) {
    throw new DiffError(`Boyut uyuşmuyor: ${a.length}, ${b.length} ≠ ${expected}`);
  }
  let changedPixels = 0;
  let errorSum = 0;
  let maxError = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let i = 0; i < width * height; i += 1) {
    const base = i * 4;
    let maxChannelDiff = 0;
    let pixelError = 0;
    for (let c = 0; c < 3; c += 1) {
      const d = Math.abs(a[base + c]! - b[base + c]!);
      pixelError += d;
      maxChannelDiff = Math.max(maxChannelDiff, d);
    }
    if (maxChannelDiff > options.channelTolerance) {
      changedPixels += 1;
      const x = i % width;
      const y = Math.floor(i / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    errorSum += pixelError / 3;
    maxError = Math.max(maxError, maxChannelDiff);
  }
  const pixels = width * height;
  return {
    width,
    height,
    changedPixels,
    changedRatio: changedPixels / pixels,
    meanAbsError: errorSum / pixels,
    maxAbsError: maxError,
    changedRegion: changedPixels > 0 ? { minX, minY, maxX, maxY } : null,
  };
}

export interface SilhouetteComparison {
  aCoverage: number;
  bCoverage: number;
  iou: number; // Jaccard benzerliği 0..1
  mismatchPixels: number;
}

// Silüet karşılaştırma: alpha > threshold pikselleri "içinde" sayılır.
export function compareSilhouettes(a: Uint8Array, b: Uint8Array, width: number, height: number, alphaThreshold = 128): SilhouetteComparison {
  const expected = width * height * 4;
  if (a.length !== expected || b.length !== expected) {
    throw new DiffError(`Boyut uyuşmuyor: ${a.length}, ${b.length} ≠ ${expected}`);
  }
  let aCount = 0;
  let bCount = 0;
  let intersection = 0;
  let union = 0;
  let mismatch = 0;
  for (let i = 0; i < width * height; i += 1) {
    const inA = a[i * 4 + 3]! > alphaThreshold;
    const inB = b[i * 4 + 3]! > alphaThreshold;
    if (inA) aCount += 1;
    if (inB) bCount += 1;
    if (inA && inB) intersection += 1;
    if (inA || inB) union += 1;
    if (inA !== inB) mismatch += 1;
  }
  return {
    aCoverage: aCount / (width * height),
    bCoverage: bCount / (width * height),
    iou: union === 0 ? 1 : intersection / union,
    mismatchPixels: mismatch,
  };
}

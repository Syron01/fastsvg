// Görsel karşılaştırma: piksel diff, değişim bbox, silüet IoU ve frame diff.
// v0.3+: Çoklu kare animasyon karşılaştırması (frame diff) ve temporal stabilite analizi.

export interface DiffOptions {
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
  meanAbsError: number;
  maxAbsError: number;
  changedRegion: DiffRegion | null;
}

export interface AnimationDiffReport {
  frameCount: number;
  width: number;
  height: number;
  frameReports: ImageDiffReport[];
  worstFrameIndex: number;
  maxChangedRatio: number;
  averageChangedRatio: number;
  identicalFrames: number;
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
  const pixels = width * height;
  return {
    aCoverage: aCount / pixels,
    bCoverage: bCount / pixels,
    iou: union === 0 ? 1 : intersection / union,
    mismatchPixels: mismatch,
  };
}

/**
 * İki animasyonun (veya iki APNG frame serisinin) tüm karelerini karşılaştırır.
 */
export function diffAnimationFrames(
  aFramesRgba: Uint8Array,
  bFramesRgba: Uint8Array,
  width: number,
  height: number,
  frameCount: number,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): AnimationDiffReport {
  const frameBytes = width * height * 4;
  const expectedTotal = frameBytes * frameCount;
  if (aFramesRgba.length !== expectedTotal || bFramesRgba.length !== expectedTotal) {
    throw new DiffError(`Toplam kare veri boyutu uyuşmuyor: ${aFramesRgba.length}, ${bFramesRgba.length} ≠ ${expectedTotal}`);
  }

  const frameReports: ImageDiffReport[] = [];
  let worstFrameIndex = 0;
  let maxChangedRatio = -1;
  let sumChangedRatio = 0;
  let identicalFrames = 0;

  for (let f = 0; f < frameCount; f += 1) {
    const offset = f * frameBytes;
    const aSlice = aFramesRgba.subarray(offset, offset + frameBytes);
    const bSlice = bFramesRgba.subarray(offset, offset + frameBytes);

    const report = diffImages(aSlice, bSlice, width, height, options);
    frameReports.push(report);

    if (report.changedPixels === 0) {
      identicalFrames += 1;
    }

    if (report.changedRatio > maxChangedRatio) {
      maxChangedRatio = report.changedRatio;
      worstFrameIndex = f;
    }

    sumChangedRatio += report.changedRatio;
  }

  return {
    frameCount,
    width,
    height,
    frameReports,
    worstFrameIndex,
    maxChangedRatio,
    averageChangedRatio: sumChangedRatio / frameCount,
    identicalFrames,
  };
}

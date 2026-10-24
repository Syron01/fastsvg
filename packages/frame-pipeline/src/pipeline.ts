// Scene IR + Timeline → APNG pipeline: kare kare deterministik render ve encode.
// v0.3: statik alt katman önbelleği (ilk animasyonlu node'a kadar bir kez rasterlenir)
// ve gradient fill geçişi.

import type { SceneDocument } from "@fastsvg/scene-ir";
import { frameTimestamps, sampleTimeline, validateTimeline, type Timeline } from "@fastsvg/motion-engine";
import { renderScene, type Framebuffer, type SceneGradient } from "@fastsvg/raster";
import { encodeApng, type ApngFrame } from "@fastsvg/apng-exporter";

export const MAX_FRAMES = 600;
export const MAX_FRAME_PIXELS = 4_194_304; // 2048×2048

export interface TimelineApngOptions {
  gradients?: SceneGradient[];
}

export interface TimelineApngResult {
  buffer: Buffer;
  frameCount: number;
  width: number;
  height: number;
  warnings: string[];
  encodeMs: number;
  staticLayerNodes: number;
}

export class PipelineError extends Error {}

export function renderTimelineApng(doc: SceneDocument, timeline: Timeline, loopCount = 0, options: TimelineApngOptions = {}): TimelineApngResult {
  const validationErrors = validateTimeline(timeline);
  if (validationErrors.length > 0) {
    throw new PipelineError(`Timeline geçersiz: ${validationErrors.map((e) => e.message).join("; ")}`);
  }
  const pixels = doc.viewport.width * doc.viewport.height;
  if (pixels > MAX_FRAME_PIXELS) {
    throw new PipelineError(`Frame boyutu sınırı aşıldı: ${pixels} piksel (max ${MAX_FRAME_PIXELS})`);
  }
  const stamps = frameTimestamps(timeline);
  if (stamps.length > MAX_FRAMES) {
    throw new PipelineError(`Frame sayısı sınırı aşıldı: ${stamps.length} (max ${MAX_FRAMES})`);
  }
  // İlk animasyonlu node'a kadar olan ön ek hiçbir frame'de değişmez: bir kez rasterlenir.
  const animatedIds = new Set(timeline.tracks.map((t) => t.targetNodeId));
  const firstAnimatedIdx = doc.nodes.findIndex((n) => animatedIds.has(n.id));
  const staticPrefixIds = new Set<string>();
  const dynamicIds = new Set<string>();
  if (firstAnimatedIdx === -1) {
    for (const n of doc.nodes) staticPrefixIds.add(n.id);
  } else {
    for (let i = 0; i < doc.nodes.length; i += 1) {
      (i < firstAnimatedIdx ? staticPrefixIds : dynamicIds).add(doc.nodes[i]!.id);
    }
  }
  const warnings: string[] = [];
  const started = performance.now();
  let baseLayer: Framebuffer | undefined;
  if (staticPrefixIds.size > 0 && firstAnimatedIdx !== -1) {
    const base = renderScene(doc, {}, { gradients: options.gradients ?? [], skipNodeIds: dynamicIds });
    baseLayer = base.framebuffer;
    warnings.push(...base.warnings);
  }
  const frames: ApngFrame[] = [];
  for (const timeMs of stamps) {
    const samples = sampleTimeline(timeline, timeMs);
    const overrides: Parameters<typeof renderScene>[1] = {};
    for (const s of samples) {
      if (typeof s.value !== "number") continue;
      if (s.property === "translateX") (overrides.translateX ??= {})[s.targetNodeId] = s.value;
      else if (s.property === "translateY") (overrides.translateY ??= {})[s.targetNodeId] = s.value;
      else if (s.property === "opacity") (overrides.opacity ??= {})[s.targetNodeId] = s.value;
    }
    const rendered = renderScene(doc, overrides, baseLayer
      ? { gradients: options.gradients ?? [], baseLayer, skipNodeIds: staticPrefixIds }
      : { gradients: options.gradients ?? [], skipNodeIds: staticPrefixIds });
    warnings.push(...rendered.warnings);
    frames.push({ rgba: new Uint8Array(rendered.framebuffer.data), delayMs: 1000 / timeline.frameRate });
  }
  const buffer = encodeApng({ width: doc.viewport.width, height: doc.viewport.height, frames, loopCount });
  return {
    buffer,
    frameCount: frames.length,
    width: doc.viewport.width,
    height: doc.viewport.height,
    warnings: [...new Set(warnings)],
    encodeMs: performance.now() - started,
    staticLayerNodes: staticPrefixIds.size,
  };
}

export function renderScenePng(doc: SceneDocument): { buffer: Buffer; warnings: string[]; renderedNodes: number } {
  const rendered = renderScene(doc);
  // Tek karede isAnimated=false olması için delay 100ms sabit; decodePng PNG olarak çözer.
  const buffer = encodeApng({
    width: doc.viewport.width,
    height: doc.viewport.height,
    frames: [{ rgba: new Uint8Array(rendered.framebuffer.data), delayMs: 100 }],
    loopCount: 0,
  });
  return { buffer, warnings: rendered.warnings, renderedNodes: rendered.renderedNodes };
}

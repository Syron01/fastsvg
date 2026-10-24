// Timeline, track ve keyframe modeli + deterministik örnekleme.

import { evaluateEasing, type EasingDefinition } from "./easing.js";

export type AnimatableValue = number | { x: number; y: number } | string;

export interface Keyframe {
  id: string;
  timeMs: number;
  value: AnimatableValue;
  easing?: EasingDefinition;
  hold?: boolean;
}

export type AnimatedProperty =
  | "position"
  | "scale"
  | "rotationDeg"
  | "opacity"
  | "translateX"
  | "translateY";

export interface AnimationTrack {
  id: string;
  targetNodeId: string;
  property: AnimatedProperty;
  keyframes: Keyframe[];
  loop?: LoopConfig;
}

export interface LoopConfig {
  mode: "none" | "repeat" | "pingPong";
  count: number; // Infinity sonsuz için kullanılmaz; timeline render range'i belirler
}

export interface Timeline {
  id: string;
  name: string;
  durationMs: number;
  frameRate: number;
  tracks: AnimationTrack[];
}

export interface TimelineValidationError {
  code: "EMPTY_TRACK" | "KEYFRAME_OUT_OF_RANGE" | "DURATION_INVALID" | "FRAME_RATE_INVALID" | "NON_MONOTONIC";
  message: string;
}

export function validateTimeline(t: Timeline): TimelineValidationError[] {
  const errors: TimelineValidationError[] = [];
  if (!Number.isFinite(t.durationMs) || t.durationMs <= 0 || t.durationMs > 600_000) {
    errors.push({ code: "DURATION_INVALID", message: `durationMs 0..600000 aralığında olmalı: ${t.durationMs}` });
  }
  if (!Number.isFinite(t.frameRate) || t.frameRate < 1 || t.frameRate > 240) {
    errors.push({ code: "FRAME_RATE_INVALID", message: `frameRate 1..240 aralığında olmalı: ${t.frameRate}` });
  }
  for (const track of t.tracks) {
    if (track.keyframes.length === 0) {
      errors.push({ code: "EMPTY_TRACK", message: `Track boş: ${track.id}` });
    }
    for (const [i, kf] of track.keyframes.entries()) {
      if (kf.timeMs < 0 || kf.timeMs > t.durationMs) {
        errors.push({ code: "KEYFRAME_OUT_OF_RANGE", message: `Keyframe ${kf.id} timeline dışında: ${kf.timeMs}ms` });
      }
      const prev = i > 0 ? track.keyframes[i - 1]! : undefined;
      if (prev && kf.timeMs < prev.timeMs) {
        errors.push({ code: "NON_MONOTONIC", message: `Track ${track.id}: keyframe zamanları artan sırada olmalı` });
      }
    }
  }
  return errors;
}

function interpolateNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateValue(a: AnimatableValue, b: AnimatableValue, t: number, easing: EasingDefinition | undefined): AnimatableValue {
  const e = easing ? evaluateEasing(easing, t) : t;
  if (typeof a === "number" && typeof b === "number") return interpolateNumber(a, b, e);
  if (typeof a === "object" && typeof b === "object") {
    return { x: interpolateNumber(a.x, b.x, e), y: interpolateNumber(a.y, b.y, e) };
  }
  // Renk/string değerleri keyframe arası yumuşak geçişi desteklemez: kesme (cut) davranışı.
  return t < 1 ? a : b;
}

export interface TrackSample {
  trackId: string;
  targetNodeId: string;
  property: AnimatedProperty;
  value: AnimatableValue;
}

// Sabit zaman noktasında timeline'ın tüm track'lerini örnekler. Deterministiktir.
export function sampleTimeline(t: Timeline, timeMs: number): TrackSample[] {
  const time = Math.max(0, Math.min(t.durationMs, timeMs));
  const samples: TrackSample[] = [];
  for (const track of t.tracks) {
    const kfs = track.keyframes;
    if (kfs.length === 0) continue;
    let value: AnimatableValue = kfs[0]!.value;
    if (time >= kfs[kfs.length - 1]!.timeMs) {
      value = kfs[kfs.length - 1]!.value;
    } else {
      for (let i = 0; i < kfs.length - 1; i += 1) {
        const a = kfs[i]!;
        const b = kfs[i + 1]!;
        if (time >= a.timeMs && time <= b.timeMs) {
          const span = b.timeMs - a.timeMs;
          const local = span === 0 ? 1 : (time - a.timeMs) / span;
          value = b.hold ? a.value : interpolateValue(a.value, b.value, local, b.easing);
          break;
        }
      }
    }
    samples.push({ trackId: track.id, targetNodeId: track.targetNodeId, property: track.property, value });
  }
  return samples;
}

// Timeline'ı frame zamanlarına böler; süre ve fps'ten frame sayısı hesaplanır.
export function frameTimestamps(t: Timeline): number[] {
  const frameCount = Math.max(1, Math.round((t.durationMs / 1000) * t.frameRate));
  const stamps: number[] = [];
  for (let i = 0; i < frameCount; i += 1) {
    stamps.push((i / t.frameRate) * 1000);
  }
  return stamps;
}

// Loop dikişi: son ve ilk kare değer farkını ölçer (0 = kusursuz döngü).
export interface LoopSeamReport {
  seamDeltaByTrack: Record<string, number>;
  seamless: boolean;
}

export function detectLoopSeam(t: Timeline): LoopSeamReport {
  const first = sampleTimeline(t, 0);
  const last = sampleTimeline(t, t.durationMs);
  const byTrack: Record<string, number> = {};
  let seamless = true;
  for (const f of first) {
    const l = last.find((s) => s.trackId === f.trackId);
    if (!l) continue;
    let delta = 0;
    if (typeof f.value === "number" && typeof l.value === "number") delta = Math.abs(f.value - l.value);
    else if (typeof f.value === "object" && typeof l.value === "object") {
      delta = Math.hypot(f.value.x - l.value.x, f.value.y - l.value.y);
    } else delta = f.value === l.value ? 0 : 1;
    byTrack[f.trackId] = delta;
    if (delta > 1e-9) seamless = false;
  }
  return { seamDeltaByTrack: byTrack, seamless };
}

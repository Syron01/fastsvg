// Easing motoru: linear, cubic-bezier, steps, spring (damped).
// Fiziksel iddia: spring gerçek rigid-body simülasyonu değildir; analitik damped
// sönümlü salınım çözümüdür — parametreler stilistik hareket karakteri verir.

export type EasingDefinition =
  | { type: "linear" }
  | { type: "cubic-bezier"; x1: number; y1: number; x2: number; y2: number }
  | { type: "steps"; count: number; position?: "start" | "end" }
  | { type: "spring"; stiffness: number; damping: number; mass?: number; initialVelocity?: number };

export function evaluateEasing(e: EasingDefinition, t: number): number {
  const u = Math.max(0, Math.min(1, t));
  switch (e.type) {
    case "linear": return u;
    case "cubic-bezier": return cubicBezierEasing(e.x1, e.y1, e.x2, e.y2, u);
    case "steps": {
      const position = e.position ?? "end";
      const count = Math.max(1, Math.round(e.count));
      if (u >= 1) return 1;
      return position === "start" ? Math.min(1, Math.floor(u * count + 1) / count) : Math.floor(u * count) / count;
    }
    case "spring": return springEasing(e.stiffness, e.damping, e.mass ?? 1, e.initialVelocity ?? 0, u);
  }
}

// CSS cubic-bezier çözümü: x parametresi Newton-Raphson + bisection fallback ile bulunur.
export function cubicBezierEasing(x1: number, y1: number, x2: number, y2: number, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const solveX = (targetX: number): number => {
    let guess = targetX;
    for (let i = 0; i < 8; i += 1) {
      const x = bezierComponent(guess, x1, x2);
      const dx = bezierComponentDerivative(guess, x1, x2);
      if (Math.abs(dx) < 1e-9) break;
      const error = x - targetX;
      if (Math.abs(error) < 1e-7) return guess;
      guess -= error / dx;
    }
    // Bisection fallback
    let lo = 0;
    let hi = 1;
    guess = targetX;
    for (let i = 0; i < 32; i += 1) {
      const x = bezierComponent(guess, x1, x2);
      if (Math.abs(x - targetX) < 1e-7) return guess;
      if (x < targetX) lo = guess;
      else hi = guess;
      guess = (lo + hi) / 2;
    }
    return guess;
  };
  return bezierComponent(solveX(t), y1, y2);
}

function bezierComponent(t: number, c1: number, c2: number): number {
  const u = 1 - t;
  return 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t;
}

function bezierComponentDerivative(t: number, c1: number, c2: number): number {
  const u = 1 - t;
  return 3 * u * u * c1 + 6 * u * t * (c2 - c1) + 3 * t * t * (1 - c2);
}

// Analitik damped spring: y(t) = 1 - e^(-ζωt)·(cos + faz terimi).
// ω = sqrt(k/m), ζ = c/(2·sqrt(k·m)); ζ<1 underdamped, ζ>=1 kritik/aşırı sönümlü.
export function springEasing(stiffness: number, damping: number, mass: number, initialVelocity: number, t: number): number {
  if (stiffness <= 0 || mass <= 0 || damping < 0) return t >= 1 ? 1 : 0;
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const time = t * 1; // normalize edilmiş süre; gerçek süre timeline'da ölçeklenir
  if (zeta < 1) {
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega * time);
    const a = 1;
    const b = (zeta * omega + initialVelocity) / omegaD;
    return 1 - envelope * (a * Math.cos(omegaD * time) + b * Math.sin(omegaD * time));
  }
  // Kritik ve aşırı sönümlü: kapalı form yaklaşımı.
  const c = zeta >= 1 ? 2 * Math.sqrt(stiffness * mass) * zeta : 0;
  const r = -c / (2 * mass);
  const s = r * r - stiffness / mass;
  if (Math.abs(s) < 1e-12) {
    return 1 - (1 - r * time) * Math.exp(r * time);
  }
  const root = Math.sqrt(Math.abs(s));
  if (s < 0) {
    // Underdamped sınır durumu (yaklaşık): salınımlı kapalı form.
    return 1 - Math.exp(r * time) * (Math.cos(root * time) + ((-r) / root) * Math.sin(root * time) + (initialVelocity / root) * Math.sin(root * time));
  }
  // Aşırı sönümlü: y(0)=0 ve y'(0)=v0 başlangıç koşullarıyla sabitler çözülür.
  const r1 = r + root;
  const r2 = r - root;
  const denom = r1 - r2 || 1;
  const c1 = (initialVelocity + r2) / denom;
  const c2 = -1 - c1;
  return 1 + c1 * Math.exp(r1 * time) + c2 * Math.exp(r2 * time);
}

// Velocity ve acceleration örneklemesi (merkezi fark).
export function easingVelocity(e: EasingDefinition, t: number, h = 1e-4): number {
  const t1 = Math.max(0, t - h);
  const t2 = Math.min(1, t + h);
  const span = t2 - t1 || h;
  return (evaluateEasing(e, t2) - evaluateEasing(e, t1)) / span;
}

export function easingAcceleration(e: EasingDefinition, t: number, h = 1e-4): number {
  const t1 = Math.max(0, t - h);
  const t2 = Math.min(1, t + h);
  const span = t2 - t1 || h;
  return (easingVelocity(e, t2) - easingVelocity(e, t1)) / span;
}

export const EASING_PRESETS: Record<string, EasingDefinition> = {
  linear: { type: "linear" },
  "ease-in": { type: "cubic-bezier", x1: 0.42, y1: 0, x2: 1, y2: 1 },
  "ease-out": { type: "cubic-bezier", x1: 0, y1: 0, x2: 0.58, y2: 1 },
  "ease-in-out": { type: "cubic-bezier", x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  back: { type: "cubic-bezier", x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 },
};

// FastSVG 3D Geometri, Projeksiyon, Işıklandırma ve Shading Motoru.
// Sıfır harici bağımlılık, deterministik 3D vektör matematiği,
// İzometrik/Perspektif projeksiyonlar, Lambertian shading, backface culling ve Painter's algorithm.

import type { Point } from "./bezier.js";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface EulerAngles {
  pitch?: number; // X ekseni etrafında derece
  yaw?: number;   // Y ekseni etrafında derece
  roll?: number;  // Z ekseni etrafında derece
}

export type ProjectionType = "isometric" | "perspective" | "dimetric" | "orthographic";

export interface CameraOptions {
  projection?: ProjectionType;
  distance?: number; // Perspektif için kamera mesafesi (varsayılan: 800)
  scale?: number;    // Genel sahne ölçeği (varsayılan: 1)
  center?: Point;    // 2D ekranda merkez noktası (varsayılan: { x: 400, y: 300 })
  rotation?: EulerAngles; // Sahne/kamera rotasyonu
}

export interface LightSource {
  position?: Vector3; // Işık yönü / konumu
  ambient?: number;   // Ortam ışığı 0..1 (varsayılan: 0.3)
  diffuse?: number;   // Difüz yoğunluk 0..1 (varsayılan: 0.7)
  specular?: number;  // Speküler parlaklık (varsayılan: 0.2)
}

export interface Face3D {
  id?: string;
  vertices: Vector3[];
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface ProjectedFace {
  id?: string;
  points2D: Point[];
  pathD: string;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  depth: number; // Z-order (Painter's algorithm için)
  normal: Vector3;
  litColor: string; // Işık uygulanmış final hex renk
  isCulled: boolean;
}

// Vektör işlemleri
export function vec3(x: number, y: number, z: number): Vector3 {
  return { x, y, z };
}

export function addVec3(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subVec3(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function dotVec3(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function crossVec3(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normalizeVec3(v: Vector3): Vector3 {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len < 1e-9) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

// 3D Rotasyon Matrisi
export function rotateVec3(v: Vector3, angles: EulerAngles): Vector3 {
  const radX = ((angles.pitch ?? 0) * Math.PI) / 180;
  const radY = ((angles.yaw ?? 0) * Math.PI) / 180;
  const radZ = ((angles.roll ?? 0) * Math.PI) / 180;

  let { x, y, z } = v;

  // X rotasyonu (Pitch)
  if (radX !== 0) {
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    y = y1;
    z = z1;
  }

  // Y rotasyonu (Yaw)
  if (radY !== 0) {
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    x = x1;
    z = z1;
  }

  // Z rotasyonu (Roll)
  if (radZ !== 0) {
    const cosZ = Math.cos(radZ);
    const sinZ = Math.sin(radZ);
    const x1 = x * cosZ - y * sinZ;
    const y1 = x * sinZ + y * cosZ;
    x = x1;
    y = y1;
  }

  return { x, y, z };
}

// 3D -> 2D Projeksiyon
export function projectPoint(p: Vector3, options: CameraOptions = {}): Point {
  const scale = options.scale ?? 1;
  const center = options.center ?? { x: 0, y: 0 };
  const proj = options.projection ?? "isometric";

  // Sahne rotasyonu uygula
  const v = options.rotation ? rotateVec3(p, options.rotation) : p;

  switch (proj) {
    case "isometric": {
      // Standart İzometrik (30 derece açılı)
      // x' = (x - z) * cos(30°), y' = y + (x + z) * sin(30°)
      const cos30 = 0.8660254; // Math.cos(Math.PI / 6)
      const sin30 = 0.5;      // Math.sin(Math.PI / 6)
      const px = (v.x - v.z) * cos30 * scale;
      const py = (-v.y + (v.x + v.z) * sin30) * scale;
      return {
        x: center.x + px,
        y: center.y + py,
      };
    }
    case "dimetric": {
      // Dimetrik (genellikle 1:2 oranında eğim)
      const px = (v.x - v.z * 0.5) * scale;
      const py = (-v.y + (v.x + v.z) * 0.25) * scale;
      return {
        x: center.x + px,
        y: center.y + py,
      };
    }
    case "perspective": {
      const d = options.distance ?? 800;
      const depth = Math.max(10, d + v.z);
      const factor = (d / depth) * scale;
      return {
        x: center.x + v.x * factor,
        y: center.y - v.y * factor, // Y ekseni SVG'de aşağı doğru artar
      };
    }
    case "orthographic":
    default: {
      return {
        x: center.x + v.x * scale,
        y: center.y - v.y * scale,
      };
    }
  }
}

// Hex rengi basitçe aydınlat / karart
function shadeHexColor(hex: string, intensity: number): string {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((ch) => ch + ch).join("");
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;

  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const nr = clamp(r * intensity);
  const ng = clamp(g * intensity);
  const nb = clamp(b * intensity);

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

// 3D Yüzeyi projeksiyonla 2D SVG yüzüne dönüştürme ve ışıklandırma
export function projectFace(
  face: Face3D,
  camera: CameraOptions = {},
  light: LightSource = {},
): ProjectedFace {
  const rotatedVerts = face.vertices.map((v) =>
    camera.rotation ? rotateVec3(v, camera.rotation) : v,
  );

  // Yüzey normali hesabı (ilk 3 tepe noktasından)
  const v0 = rotatedVerts[0]!;
  const v1 = rotatedVerts[1]!;
  const v2 = rotatedVerts[2]!;
  const edge1 = subVec3(v1, v0);
  const edge2 = subVec3(v2, v0);
  const normal = normalizeVec3(crossVec3(edge1, edge2));

  // Backface culling: Eğer kamera bakış yönüne (Z) arkası dönükse
  // (Ortografik / izometrikte normal.z <= 0 arkaya bakar)
  const isCulled = normal.z < -1e-4;

  // 2D projeksiyon
  const points2D = rotatedVerts.map((v) => {
    // Zaten rotate edildiğinden rotation: undefined ile çağır
    return projectPoint(v, { ...camera, rotation: undefined });
  });

  // SVG path d stringi
  let pathD = `M ${round(points2D[0]!.x)} ${round(points2D[0]!.y)}`;
  for (let i = 1; i < points2D.length; i++) {
    pathD += ` L ${round(points2D[i]!.x)} ${round(points2D[i]!.y)}`;
  }
  pathD += " Z";

  // Işık ve Shading (Lambertian + Ambient)
  const lightDir = normalizeVec3(light.position ?? { x: 0.5, y: 1, z: 0.8 });
  const ambient = light.ambient ?? 0.35;
  const diffuseWeight = light.diffuse ?? 0.65;

  const cosTheta = Math.max(0, dotVec3(normal, lightDir));
  const totalLight = Math.min(1.5, ambient + diffuseWeight * cosTheta);
  const litColor = shadeHexColor(face.color, totalLight);

  // Ortalama Z derinliği (Painter's algorithm için)
  const avgZ = rotatedVerts.reduce((sum, v) => sum + v.z, 0) / rotatedVerts.length;

  return {
    id: face.id,
    points2D,
    pathD,
    color: face.color,
    strokeColor: face.strokeColor,
    strokeWidth: face.strokeWidth,
    depth: avgZ,
    normal,
    litColor,
    isCulled,
  };
}

// 3D Sahnede Painter's Algoritması ile yüzeyleri arkadan öne sıralayıp SVG üretme
export function render3DFaces(
  faces: Face3D[],
  camera: CameraOptions = {},
  light: LightSource = {},
): { svgMarkup: string; projectedFaces: ProjectedFace[] } {
  const projected = faces.map((f) => projectFace(f, camera, light));

  // Sadece kameraya bakan yüzeyleri al (veya culling kapalıysa tümünü)
  const visible = projected.filter((f) => !f.isCulled);

  // Z derinliğine göre sırala: En küçük Z (en uzaktaki) ilk önce çizilir
  visible.sort((a, b) => a.depth - b.depth);

  const parts: string[] = [];
  for (const f of visible) {
    const strokeAttr = f.strokeColor ? ` stroke="${f.strokeColor}" stroke-width="${f.strokeWidth ?? 1}" stroke-linejoin="round"` : "";
    parts.push(`<path d="${f.pathD}" fill="${f.litColor}"${strokeAttr}/>`);
  }

  return {
    svgMarkup: parts.join("\n"),
    projectedFaces: visible,
  };
}

function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

// ---- Parametrik 3D Şekil Üreticileri ----

export interface BoxOptions {
  width: number;
  height: number;
  depth: number;
  center?: Vector3;
  color?: string; // Ana renk veya yüzey renkleri
  topColor?: string;
  frontColor?: string;
  sideColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * 3D Kutu / Prizma üretir (6 yüzey).
 */
export function create3DBox(options: BoxOptions): Face3D[] {
  const w = options.width / 2;
  const h = options.height / 2;
  const d = options.depth / 2;
  const c = options.center ?? { x: 0, y: 0, z: 0 };

  const baseCol = options.color ?? "#3b82f6";
  const topCol = options.topColor ?? baseCol;
  const frontCol = options.frontColor ?? baseCol;
  const sideCol = options.sideColor ?? baseCol;

  // 8 köşe
  const p000 = { x: c.x - w, y: c.y - h, z: c.z - d };
  const p100 = { x: c.x + w, y: c.y - h, z: c.z - d };
  const p110 = { x: c.x + w, y: c.y + h, z: c.z - d };
  const p010 = { x: c.x - w, y: c.y + h, z: c.z - d };

  const p001 = { x: c.x - w, y: c.y - h, z: c.z + d };
  const p101 = { x: c.x + w, y: c.y - h, z: c.z + d };
  const p111 = { x: c.x + w, y: c.y + h, z: c.z + d };
  const p011 = { x: c.x - w, y: c.y + h, z: c.z + d };

  const stroke = options.strokeColor;
  const strokeW = options.strokeWidth;

  return [
    // Ön yüz (Front: +Z)
    { id: "front", vertices: [p001, p101, p111, p011], color: frontCol, strokeColor: stroke, strokeWidth: strokeW },
    // Arka yüz (Back: -Z)
    { id: "back", vertices: [p100, p000, p010, p110], color: frontCol, strokeColor: stroke, strokeWidth: strokeW },
    // Üst yüz (Top: +Y)
    { id: "top", vertices: [p011, p111, p110, p010], color: topCol, strokeColor: stroke, strokeWidth: strokeW },
    // Alt yüz (Bottom: -Y)
    { id: "bottom", vertices: [p000, p100, p101, p001], color: baseCol, strokeColor: stroke, strokeWidth: strokeW },
    // Sağ yüz (Right: +X)
    { id: "right", vertices: [p101, p100, p110, p111], color: sideCol, strokeColor: stroke, strokeWidth: strokeW },
    // Sol yüz (Left: -X)
    { id: "left", vertices: [p000, p001, p011, p010], color: sideCol, strokeColor: stroke, strokeWidth: strokeW },
  ];
}

export interface CylinderOptions {
  radius: number;
  height: number;
  segments?: number;
  center?: Vector3;
  color?: string;
  topColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * 3D Silindir / Halka üretir.
 */
export function create3DCylinder(options: CylinderOptions): Face3D[] {
  const r = options.radius;
  const h2 = options.height / 2;
  const segs = Math.max(8, options.segments ?? 24);
  const c = options.center ?? { x: 0, y: 0, z: 0 };
  const baseCol = options.color ?? "#10b981";
  const topCol = options.topColor ?? baseCol;

  const topCircle: Vector3[] = [];
  const bottomCircle: Vector3[] = [];

  for (let i = 0; i < segs; i++) {
    const angle = (i / segs) * 2 * Math.PI;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    topCircle.push({ x: c.x + x, y: c.y + h2, z: c.z + z });
    bottomCircle.push({ x: c.x + x, y: c.y - h2, z: c.z + z });
  }

  const faces: Face3D[] = [];

  // Yan duvar yüzeyleri
  for (let i = 0; i < segs; i++) {
    const next = (i + 1) % segs;
    faces.push({
      id: `wall_${i}`,
      vertices: [
        bottomCircle[i]!,
        bottomCircle[next]!,
        topCircle[next]!,
        topCircle[i]!,
      ],
      color: baseCol,
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth,
    });
  }

  // Üst kapak
  faces.push({
    id: "top_cap",
    vertices: [...topCircle].reverse(), // CCW normal +Y
    color: topCol,
    strokeColor: options.strokeColor,
    strokeWidth: options.strokeWidth,
  });

  // Alt kapak
  faces.push({
    id: "bottom_cap",
    vertices: [...bottomCircle],
    color: baseCol,
    strokeColor: options.strokeColor,
    strokeWidth: options.strokeWidth,
  });

  return faces;
}

export interface Plane3DOptions {
  width: number;
  height: number;
  center?: Vector3;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * 3D Yüzen Kart / Düzlem üretir (UI kartları, slaytlar, dashboard panelleri).
 */
export function create3DPlane(options: Plane3DOptions): Face3D {
  const w = options.width / 2;
  const h = options.height / 2;
  const c = options.center ?? { x: 0, y: 0, z: 0 };

  return {
    id: "plane",
    vertices: [
      { x: c.x - w, y: c.y - h, z: c.z },
      { x: c.x + w, y: c.y - h, z: c.z },
      { x: c.x + w, y: c.y + h, z: c.z },
      { x: c.x - w, y: c.y + h, z: c.z },
    ],
    color: options.color ?? "#ffffff",
    strokeColor: options.strokeColor ?? "#e2e8f0",
    strokeWidth: options.strokeWidth ?? 1,
  };
}

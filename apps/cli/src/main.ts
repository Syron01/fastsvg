#!/usr/bin/env node
// FastSVG CLI v0.1
// fastsvg validate <svg-path-file>  → path data doğrulama
// fastsvg export <scene.json> --out <out.svg>

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parsePath, pathBounds } from "@fastsvg/geometry";
import { exportSvgEditable } from "@fastsvg/export-svg";
import type { SceneDocument } from "@fastsvg/scene-ir";

const EXIT = { OK: 0, INTERNAL: 1, USAGE: 2, INVALID_INPUT: 3, UNSUPPORTED: 4, IO: 6 } as const;

function usage(): never {
  console.error(`Kullanım:
  fastsvg validate <path-data.dosya>
  fastsvg export <scene.json> --out <cikti.svg>`);
  process.exit(EXIT.USAGE);
}

const [command, ...rest] = process.argv.slice(2);
if (!command) usage();

try {
  if (command === "validate") {
    const file = rest[0];
    if (!file) usage();
    const d = readFileSync(file!, "utf8").trim();
    const parsed = parsePath(d);
    const bounds = pathBounds(parsed.segments);
    if (parsed.errors.length > 0 || !bounds) {
      console.error("Geçersiz path:", parsed.errors.join("; ") || "segment yok");
      process.exit(EXIT.INVALID_INPUT);
    }
    console.log(`Geçerli path — ${parsed.segments.length} segment, bounds: ${JSON.stringify(bounds)}`);
    process.exit(EXIT.OK);
  }

  if (command === "export") {
    const outIndex = rest.indexOf("--out");
    const out = outIndex >= 0 ? rest[outIndex + 1] : undefined;
    const sceneFile = rest[0];
    if (!sceneFile || !out) usage();
    const scene = JSON.parse(readFileSync(sceneFile!, "utf8")) as SceneDocument;
    if (scene.schemaVersion === undefined || !Array.isArray(scene.nodes)) {
      console.error("Geçersiz sahne dosyası: schemaVersion ve nodes gerekli");
      process.exit(EXIT.INVALID_INPUT);
    }
    const result = exportSvgEditable(scene);
    mkdirSync(dirname(out!), { recursive: true });
    writeFileSync(out!, result.svg, "utf8");
    console.log(`SVG yazıldı: ${out} (${result.nodeCount} node)`);
    for (const warning of result.warnings) console.warn(`Uyarı: ${warning}`);
    process.exit(EXIT.OK);
  }

  console.error(`Bilinmeyen komut: ${command}`);
  usage();
} catch (error) {
  console.error("Hata:", error instanceof Error ? error.message : String(error));
  process.exit(EXIT.INTERNAL);
}

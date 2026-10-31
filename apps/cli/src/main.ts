#!/usr/bin/env node
// FastSVG CLI v0.3+
// Komutlar: validate, export, render, compare, boolean, quality

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parsePath, pathBounds, pathBoolean, evaluateVisualQuality, type BooleanOp } from "@fastsvg/geometry";
import { exportSvgEditable } from "@fastsvg/export-svg";
import type { SceneDocument } from "@fastsvg/scene-ir";
import { renderScenePng } from "@fastsvg/frame-pipeline";
import { decodePng, PngError } from "@fastsvg/apng-exporter";
import { diffImages, diffAnimationFrames } from "@fastsvg/vision";

const EXIT = { OK: 0, INTERNAL: 1, USAGE: 2, INVALID_INPUT: 3, UNSUPPORTED: 4, IO: 6 } as const;

function usage(): never {
  console.error(`Kullanım:
  fastsvg validate <path-data.dosya>
  fastsvg export <scene.json> --out <cikti.svg>
  fastsvg render <scene.json> --out <cikti.png>
  fastsvg compare <a.png> <b.png> [--tolerance N]
  fastsvg boolean <a-path.dosya> <b-path.dosya> --op <union|intersection|difference|xor> [--out <cikti.path>]
  fastsvg quality <path-data.dosya>`);
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

  if (command === "quality") {
    const file = rest[0];
    if (!file) usage();
    const d = readFileSync(file!, "utf8").trim();
    const parsed = parsePath(d);
    if (parsed.errors.length > 0) {
      console.error("Geçersiz path:", parsed.errors.join("; "));
      process.exit(EXIT.INVALID_INPUT);
    }
    const rep = evaluateVisualQuality(parsed.segments);
    console.log(JSON.stringify(rep, null, 2));
    process.exit(EXIT.OK);
  }

  if (command === "boolean") {
    const opIndex = rest.indexOf("--op");
    const op = (opIndex >= 0 ? rest[opIndex + 1] : "union") as BooleanOp;
    const outIndex = rest.indexOf("--out");
    const out = outIndex >= 0 ? rest[outIndex + 1] : undefined;
    const positional = rest.filter((arg, i) => !arg.startsWith("--") && !(opIndex >= 0 && i === opIndex + 1) && !(outIndex >= 0 && i === outIndex + 1));
    const [fileA, fileB] = positional;
    if (!fileA || !fileB) usage();

    const pathA = readFileSync(fileA!, "utf8").trim();
    const pathB = readFileSync(fileB!, "utf8").trim();
    const res = pathBoolean(pathA, pathB, op);

    if (res.errors.length > 0) {
      console.error("Boolean işlemi hatası:", res.errors.join("; "));
      process.exit(EXIT.INVALID_INPUT);
    }

    if (out) {
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, res.d, "utf8");
      console.log(`Boolean çıktısı (${op}) yazıldı: ${out}`);
    } else {
      console.log(res.d);
    }
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

  if (command === "render") {
    const outIndex = rest.indexOf("--out");
    const out = outIndex >= 0 ? rest[outIndex + 1] : undefined;
    const sceneFile = rest[0];
    if (!sceneFile || !out) usage();
    const scene = JSON.parse(readFileSync(sceneFile!, "utf8")) as SceneDocument;
    const result = renderScenePng(scene);
    mkdirSync(dirname(out!), { recursive: true });
    writeFileSync(out!, result.buffer);
    console.log(`PNG yazıldı: ${out} (${result.renderedNodes} node render edildi)`);
    for (const warning of result.warnings) console.warn(`Uyarı: ${warning}`);
    process.exit(EXIT.OK);
  }

  if (command === "compare") {
    const tolIndex = rest.indexOf("--tolerance");
    const tolerance = tolIndex >= 0 ? Number(rest[tolIndex + 1]) : 2;
    const positional = rest.filter((arg, i) => !arg.startsWith("--") && !(tolIndex >= 0 && i === tolIndex + 1));
    const [aPath, bPath] = positional;
    if (!aPath || !bPath) usage();
    const a = decodePng(readFileSync(aPath!, undefined));
    const b = decodePng(readFileSync(bPath!, undefined));
    if (a.width !== b.width || a.height !== b.height) {
      console.error(`Boyutlar farklı: ${a.width}×${a.height} vs ${b.width}×${b.height}`);
      process.exit(EXIT.INVALID_INPUT);
    }
    if (a.frameCount !== b.frameCount) {
      console.error(`Frame sayısı farklı: ${a.frameCount} vs ${b.frameCount}`);
      process.exit(EXIT.INVALID_INPUT);
    }

    if (a.frameCount > 1) {
      const animReport = diffAnimationFrames(a.rgba, b.rgba, a.width, a.height, a.frameCount, { channelTolerance: tolerance });
      console.log(JSON.stringify(animReport, null, 2));
      process.exit(EXIT.OK);
    }

    const frameBytes = a.width * a.height * 4;
    const report = diffImages(a.rgba.subarray(0, frameBytes), b.rgba.subarray(0, frameBytes), a.width, a.height, { channelTolerance: tolerance });
    console.log(JSON.stringify(report, null, 2));
    process.exit(EXIT.OK);
  }

  console.error(`Bilinmeyen komut: ${command}`);
  usage();
} catch (error) {
  if (error instanceof PngError) {
    console.error("PNG hatası:", error.message);
    process.exit(EXIT.INVALID_INPUT);
  }
  console.error("Hata:", error instanceof Error ? error.message : String(error));
  process.exit(EXIT.INTERNAL);
}

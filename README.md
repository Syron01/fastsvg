<div align="center">

<img src="assets/banner.svg" alt="FastSVG — deterministic vector engine for AI" width="100%"/>

# &nbsp;

**Stop guessing pixels. Start computing them.**

FastSVG is a typed, modular visual engineering layer that gives AI models the tools a
professional designer reaches for — measured geometry, perceptual color, timed motion,
a real render pipeline and a real APNG codec — exposed over **MCP**, **CLI** and **SDK**.

[![tests](https://img.shields.io/badge/tests-77%2F77-brightgreen?style=flat-square&labelColor=000000)]()
[![coverage of core](https://img.shields.io/badge/deps-zero%20runtime-blue?style=flat-square&labelColor=000000)]()
[![node](https://img.shields.io/badge/node-%E2%89%A520-339933?style=flat-square&labelColor=000000)]()
[![license](https://img.shields.io/badge/license-MIT-grey?style=flat-square&labelColor=000000)]()
[![MCP](https://img.shields.io/badge/MCP-10%20tools-8A2BE2?style=flat-square&labelColor=000000)]()

&nbsp;

| 001 · morph + trim | 002 · OKLab + spring | 003 · seeded particles |
|:---:|:---:|:---:|
| <img src="assets/demo-morph.svg" width="100%"/> | <img src="assets/demo-gradient.svg" width="100%"/> | <img src="assets/demo-particles.svg" width="100%"/> |

<sub>everything above is SVG rendered by the same principles the engine enforces: computed curves, perceptual color, deterministic timing</sub>

[**Why**](#-why) · [**Quick start**](#-quick-start) · [**MCP**](#-plug-it-into-your-model) · [**Packages**](#-the-engine-room) · [**Limits**](#-honest-limits) · [**Roadmap**](#-roadmap)

</div>

<br/>

## ◆ Why

Most AI drawing today is **prediction** — the model hallucinates coordinates one token at a time,
then hopes. FastSVG replaces hope with infrastructure:

> *The model decides the intent. FastSVG computes the geometry, mixes the color, times the motion,
> renders the frames, measures the result — deterministically.*

| Without FastSVG | With FastSVG |
|---|---|
| Path bounds = eyeballing control points | Extrema solved from Bézier derivatives, exact to `1e-9` |
| Gradient stops = plausible-looking hex values | OKLab-interpolated stops, **ΔE-continuous**, banding measured in numbers |
| "The animation loops, trust me" | `detect_loop_seam` returns the exact end→start delta per track |
| APNG = hope the encoder exists | A codec written from scratch: CRC-verified chunks, fcTL/fdAT sequencing, round-trip tested |
| Edits = regenerate the whole file | **Atomic scene patches** — `addNode`, `updateNode`, `moveNode` — with cycle & lock protection |
| Quality = one vibes score | Pixel diff, changed-region bbox, silhouette IoU, per-track seam deltas |

**The point is not more tools. It's tools that are true.**

<br/>

## ◆ Quick start

```bash
git clone https://github.com/Syron01/fastsvg && cd fastsvg
npm install
npm test          # 77/77
npm run build     # tsc -b, strict mode
```

**Measure a path like an engineer:**

```bash
$ npx tsx apps/cli/src/main.ts validate path.d
Geçerli path — 4 segment, bounds: {"minX":10,"minY":10,"maxX":50,"maxY":40}
```

**Scene → SVG → PNG → animated APNG → pixel-diff — the full loop:**

```bash
npx tsx apps/cli/src/main.ts export scene.json --out out.svg
npx tsx apps/cli/src/main.ts render scene.json --out out.png
npx tsx apps/cli/src/main.ts compare out.png out.png     # changedPixels: 0
```

**Programmatic — the whole engine in 20 lines:**

```ts
import { createScene, applyPatch } from "@fastsvg/scene-ir";
import { renderTimelineApng } from "@fastsvg/frame-pipeline";
import type { Timeline } from "@fastsvg/motion-engine";
import { writeFileSync } from "node:fs";

const scene = createScene({ documentId: "d", name: "box", viewport: { width: 32, height: 32, background: "#000" } });
applyPatch(scene, [{ op: "addNode", node: {
  id: "box", type: "rect", parentId: null,
  props: { x: 0, y: 11, width: 10, height: 10 },
  style: { fill: { color: "#ff0000" } }, provenance: "tool" } }]);

const timeline: Timeline = {
  id: "t", name: "slide", durationMs: 500, frameRate: 10,
  tracks: [{ id: "tr", targetNodeId: "box", property: "translateX",
    keyframes: [
      { id: "k1", timeMs: 0, value: 0 },
      { id: "k2", timeMs: 500, value: 20, easing: { type: "cubic-bezier", x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
    ] }],
};

const { buffer, frameCount } = renderTimelineApng(scene, timeline);
writeFileSync("box.apng", buffer);   // 5 deterministic frames, alpha preserved
```

<br/>

## ◆ Plug it into your model

```json
{
  "mcpServers": {
    "fastsvg": { "command": "npx", "args": ["fastsvg-mcp"] }
  }
}
```

Then just talk:

> *"Create a 32×32 scene, animate the box 20px right with ease-in-out at 10 fps,
> export an APNG, and tell me the loop seam delta."*

| Tool | What it really does |
|---|---|
| `fastsvg_create_scene` | Typed Scene IR document — the single source of truth |
| `fastsvg_apply_patch` | Atomic, validated, cycle-safe node patches |
| `fastsvg_build_path` | Parse → normalize → exact bounds → arc length |
| `fastsvg_create_gradient` | OKLab stop distribution + banding ΔE report |
| `fastsvg_render_png` | Deterministic raster with 2×2 supersampled AA |
| `fastsvg_export_apng` | Timeline → frames → real APNG (fps-derived delays) |
| `fastsvg_compare_images` | Pixel diff, changed bbox, tolerance-aware |
| `fastsvg_validate_svg` | Path syntax + segment + bounds audit |
| `fastsvg_get_scene_summary` | Node inventory by type |
| `fastsvg_export_asset` | `svg-editable` profile with gradient `<defs>` |

<br/>

## ◆ The engine room

```
intent ──▶ Scene IR ──▶ geometry ──▶ raster ──▶ APNG
               │            │           │
            patches     OKLab color  deterministic
            (atomic)    gradients    frame render
               │            │           │
               ▼            ▼           ▼
           undo/redo    banding ΔE   pixel diff · IoU
```

| Package | Ships |
|---|---|
| [`@fastsvg/scene-ir`](packages/scene-ir) | Scene document, 8 node types, atomic patch ops, validation |
| [`@fastsvg/geometry`](packages/geometry) | Path parse/serialize (M·L·H·V·C·S·Q·T·A·Z, relative→absolute), Bézier eval, exact extrema bounds, Gauss–Legendre arc length, `pointAtLength`, reverse, transform |
| [`@fastsvg/color-engine`](packages/color-engine) | sRGB ↔ linear ↔ OKLab/OKLCH, WCAG 2.1 contrast, hue-locked tone scales |
| [`@fastsvg/gradient-engine`](packages/gradient-engine) | Linear/radial gradients, perceptual stop generation, ΔE banding analysis, `<defs>` serialization |
| [`@fastsvg/motion-engine`](packages/motion-engine) | Timelines, keyframes, cubic-bezier (Newton–Raphson), steps, analytic damped springs, loop-seam detection |
| [`@fastsvg/raster`](packages/raster) | RGBA framebuffer, source-over blending, 2×2 supersampled fills/strokes, even-odd polygons, arc flattening, scene renderer |
| [`@fastsvg/apng-exporter`](packages/apng-exporter) | From-scratch PNG/APNG encoder **and** decoder — CRC32, acTL/fcTL/fdAT, sequence validation, all 5 PNG filters on decode |
| [`@fastsvg/frame-pipeline`](packages/frame-pipeline) | Scene + timeline → deterministic frames → APNG, with budget guards |
| [`@fastsvg/vision`](packages/vision) | Pixel diff, changed-region bbox, silhouette IoU |
| [`@fastsvg/export-svg`](packages/export-svg) | `svg-editable` profile, gradient defs, escape-safe output |
| [`@fastsvg/mcp-server`](apps/mcp-server) | 10 tools over stdio, structured `{ok, summary, data}` envelopes |
| [`@fastsvg/cli`](apps/cli) | `validate` · `export` · `render` · `compare` |

**Run it yourself right now:**

```bash
npx tsx examples/animation/run.ts   # → box.apng: 5 frames, 32×32, 4ms encode
```

<br/>

## ◆ Honest limits

We don't ship capabilities as vaporware. Not implemented (yet), stated plainly:

- **Boolean ops & path offset** — planned v0.3, separate algorithmic package
- **Gradient fills in raster output** — skipped with an explicit warning (SVG export: full support)
- **APNG dispose/blend variants** — full-frame frames only; delta-frame optimization pending
- **`A` commands under transforms** — arcs stay put when a matrix is applied
- **SSIM / perceptual diff** — numeric pixel metrics only
- **MCP long jobs** — no async job/cancellation layer yet

<br/>

## ◆ Roadmap

- **v0.3** — boolean geometry · gradient raster fills · delta-frame APNG · per-frame diff · job/cancellation
- **v0.4** — Rust geometry core (`crates/`) · web design adapter · Lottie/video adapters

<br/>

## ◆ Security & determinism

- Every budget is a named constant: `MAX_PIXELS`, `MAX_FRAMES`, `MAX_DIMENSION`, `MAX_FRAME_PIXELS`
- The PNG decoder verifies signatures, chunk bounds and CRCs — corrupt input dies loudly, never silently
- Timeline validation rejects out-of-range keyframes, non-monotonic tracks, absurd fps/duration
- Zero network calls. Zero telemetry. Same input + same options = same output bytes.

<br/>

<div align="center">
<sub>built for the models that draw · MIT · <a href="docs/demo.html">live demo page</a> · <a href="docs/product-requirements.md">full spec (TR)</a></sub>
</div>

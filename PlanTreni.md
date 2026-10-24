PlanTreni
Değer: AI modellerine profesyonel SVG/animasyon üretim araçları veren motor — FastSVG v0.2.

Kaynak: docs/product-requirements.md (şartname v1.0) + genişletme şartnamesi (P0-P3 dilimi).

Bağlantılar:
scene-ir → tüm paketler (ana veri modeli)
geometry → raster, motion-engine, mcp-server, cli
color-engine → gradient-engine, vision, raster
gradient-engine → export-svg (defs), mcp-server
motion-engine → frame-pipeline
raster → frame-pipeline
apng-exporter → frame-pipeline, mcp-server, cli
frame-pipeline → mcp-server, cli, examples/animation

[x] P0 denetim (mock/TODO yok, 16 test yeşil)
[x] P1 geometry: Bézier eval, gerçek ekstremum bounds, arc length, pointAtLength, reverse, transform
[x] P1 color-engine: sRGB/linear/OKLab/OKLCH, WCAG kontrast, ton skalası
[x] P1 gradient-engine: linear/radial, OKLab stoplar, banding analizi, SVG defs
[x] P2 motion-engine: timeline, keyframe, cubic-bezier/steps/spring, loop dikiş
[x] P2 raster: framebuffer, AA dolgu/stroke, sahne render
[x] P2 apng-exporter: gerçek PNG/APNG encode+decode, CRC, round-trip testleri
[x] P3 vision: piksel diff, bbox, silüet IoU
[x] frame-pipeline: sahne+timeline → APNG (uçtan uca testli)
[x] MCP: 10 araç, gerçek stdio duman testi (scripts/mcp-smoke.mjs)
[x] CLI: validate/export/render/compare
[x] CI (3 OS), LICENSE, AGENTS.md, CHANGELOG, README, örnek
[x] 77 test yeşil + build temiz + örnek çalışıyor

[ ] v0.3: boolean, gradient raster fill, delta APNG, frame diff, job/cancellation
[ ] v0.4: Rust çekirdeği, Web Adapter
! pnpm yok → npm workspaces
! APNG dispose/blend yalnızca full-frame; delta frame v0.3
? resvg/browser render adapter'ları v0.3+ karar

PlanTreni
Değer: AI modellerine profesyonel SVG, 3D, Slayt, Web Hero ve İnfografik üretim araçları veren ultra hızlı motor — FastSVG v0.4.0.

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
[x] MCP: 16 araç (render_3d, compose_slide, compose_web, render_chart dahil), gerçek stdio duman testi (scripts/mcp-smoke.mjs)
[x] CLI: validate/export/render/compare/boolean/quality
[x] CI (3 OS), LICENSE, AGENTS.md, CHANGELOG, README, örnek
[x] v0.3 gradient raster fill: raster (linear/radial LUT, url(#id)), scanline fillPolygon, frame-pipeline statik katman önbelleği — 91 test yeşil
[x] v0.3.1 Boolean operations: union, intersection, difference, xor (Greiner-Hormann algoritması + curve flattening + path d)
[x] v0.3.1 Gradient stroke desteği: raster ve export-svg motorlarında url(#id) stroke desteği (tüm şekiller ve path'ler)
[x] v0.3.1 Delta APNG: dirty-rect analizi, fcTL x/y offset, sub-frame deflate ve tam decoder birleştirme (APNG boyutu %70+ tasarruf)
[x] v0.3.1 Görsel Kalite & Optik Denge: G0/G1 süreklilik, açı sıçraması, silüet kütle merkezi (centroid) ve optik kayma düzeltmesi
[x] v0.3.1 Frame Diff: diffAnimationFrames ile çok kareli animasyon diff'i ve temporal stabilite analizi
[x] v0.4.0 3D & İzometrik Geometri: Box, Cylinder, Plane, Euler açıları rotasyonu, Isometric/Perspective projeksiyonları, Lambertian Shading ve Painter's derinlik sıralaması
[x] v0.4.0 Profesyonel Şablon Motoru: 16:9 Presentation Slides, Web Landing Hero Section, UI Mockup Window, Bento kartları
[x] v0.4.0 Veri İnfografikleri: Donut chart, Smooth spline area chart, Bar chart, Gauge meter
[x] v0.4.0 FastSVG Designer Skill Entegrasyonu: AI modellerinin tek komutta kusursuz profesyonel SVG üretmesini sağlayan resmi skill
[x] 115 test yeşil + build temiz + MCP smoke testi SMOKE-PASS (16 araç)

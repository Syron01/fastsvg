# Changelog

## 0.3.0 — 2026-10-24

### Yeni
- `@fastsvg/raster`: gradient fill rasterizasyonu — `url(#id)` dolguları artık rasterlenir (linear/radial, 256 adımlı LUT, userSpaceOnUse + objectBoundingBox); önceki sürümde bu node'lar atlanırdı
- `@fastsvg/raster`: `fillPolygon` scanline span algoritmasına geçti (dikey 2× supersampling + yatay subpixel kapsama); piksel başına çokgen testi kalktı, büyük dolgular belirgin hızlandı
- `@fastsvg/frame-pipeline`: statik alt katman önbelleği — ilk animasyonlu node'a kadar olan ön ek bir kez rasterlenip her kareye kopyalanır; `renderTimelineApng` artık `gradients` seçeneği alır, `staticLayerNodes` raporlar

### Sınırlamalar
- APNG delta frame hâlâ v0.4'te; gradient stroke henüz desteklenmiyor

## 0.2.0 — 2026-10-24

### Yeni
- `@fastsvg/geometry`: Bézier değerlendirme, gerçek ekstremum tabanlı bounds, Gauss-Legendre arc length, `pointAtLength`, `reversePath`, `transformPath`
- `@fastsvg/color-engine`: sRGB ↔ linear ↔ OKLab/OKLCH, WCAG kontrast, ton skalası
- `@fastsvg/gradient-engine`: linear/radial gradient, OKLab stop dağıtımı, banding analizi, SVG defs serialization
- `@fastsvg/motion-engine`: timeline/keyframe modeli, cubic-bezier (Newton+bisection), steps, analitik damped spring, loop dikiş analizi
- `@fastsvg/raster`: RGBA framebuffer (alpha blend, 2×2 supersampling AA), rect/circle/ellipse/polygon/path dolgu, kalın stroke, SVG arc düzleştirme, sahne render
- `@fastsvg/apng-exporter`: sıfırdan PNG/APNG encoder + decoder (CRC doğrulamalı, fcTL/fdAT sıra denetimli)
- `@fastsvg/frame-pipeline`: sahne + timeline → APNG (deterministik kare render)
- `@fastsvg/vision`: piksel diff, değişim bbox, silüet IoU
- MCP: 4 yeni araç (`fastsvg_create_gradient`, `fastsvg_render_png`, `fastsvg_export_apng`, `fastsvg_compare_images`); `fastsvg_export_asset` gradient defs destekler
- CLI: `render` ve `compare` komutları
- CI: 3 platformda build+test+MCP duman testi

### Düzeltme
- `pathBounds` artık kontrol noktası değil gerçek Bézier ekstremumlarını kullanır
- Kapalı path `reversePath` round-trip'te kapanış kenarı uzunluğunu korur

## 0.1.0 — 2026-10-24
- İlk tohum: scene-ir, geometry (path parse), export-svg, MCP server (6 araç), CLI (validate/export)

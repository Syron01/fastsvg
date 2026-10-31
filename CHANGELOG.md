# Changelog

## 0.3.1 — 2026-10-31

### Yeni
- `@fastsvg/geometry`:
  - **Boolean Geometrisi:** İki çokgen veya SVG path d stringi üzerinde Union, Intersection, Difference ve XOR operasyonları (`pathBoolean`, `booleanPolygons`). Greiner-Hormann algoritması, curve flattening ve kolineer nokta sadeleştirme.
  - **Eğri Sürekliliği (G0/G1/G2):** Segmentler arası açı sıçramaları, teğetsel süreklilik kopmaları ve düğüm yoğunluğu analizi (`analyzeCurveContinuity`).
  - **Optik Merkez & Denge Analizi:** Geometrik bounding box merkezi ile görsel kütle merkezi (polygon centroid) arasındaki sapmanın tespiti, optik merkez kayma yüzdesi ve logo/ikonlar için optik düzeltme önerisi (`analyzeOpticalBalance`).
  - **Bütüncül Görsel Kalite Skoru:** 100 üzerinden işçilik ve optik kalite notu (A+, A, B, C, D) ve eyleme dönüştürülebilir öneriler (`evaluateVisualQuality`).
- `@fastsvg/raster`:
  - **Gradient Stroke:** `url(#id)` stroke tanımları artık tüm şekillerde (rect, circle, ellipse, line, polyline, polygon, path) hem SVG hem de raster seviyesinde eksiksiz desteklenir.
- `@fastsvg/apng-exporter`:
  - **Delta-Frame APNG:** Ardışık kareler arasındaki dirty-rect (değişim bölgesi) analizi, fcTL x/y offset kodlama ve sub-frame sıkıştırma. Animasyonlu dosya boyutlarında %70+'ye varan tasarruf.
  - **Delta Decoder:** fcTL `x_offset`, `y_offset`, `blend_op` kurallarıyla delta kareleri kayıpsız birleştirme.
- `@fastsvg/vision`:
  - **Frame Diff:** Çok kareli animasyonlar için `diffAnimationFrames`; her karenin piksel diff'i, en çok değişen kare (worst frame) ve zamansal stabilite raporu.
- **MCP Server & CLI:**
  - `fastsvg_boolean_paths`: AI modellerine doğrudan vektörel boolean kesme/birleştirme aracı sunar.
  - `fastsvg_analyze_quality`: AI modellerinin ürettiği çizimlerin profesyonel işçilik kalitesini teknik olarak doğrular.
  - CLI: `boolean` ve `quality` komutları eklendi; `compare` komutuna çok kareli animasyon desteği getirildi.
  - Test kapsamı: 91'den 108 teste yükseltildi (%100 yeşil).

## 0.3.0 — 2026-10-24

### Yeni
- `@fastsvg/raster`: gradient fill rasterizasyonu — `url(#id)` dolguları artık rasterlenir (linear/radial, 256 adımlı LUT, userSpaceOnUse + objectBoundingBox); önceki sürümde bu node'lar atlanırdı
- `@fastsvg/raster`: `fillPolygon` scanline span algoritmasına geçti (dikey 2× supersampling + yatay subpixel kapsama); piksel başına çokgen testi kalktı, büyük dolgular belirgin hızlandı
- `@fastsvg/frame-pipeline`: statik alt katman önbelleği — ilk animasyonlu node'a kadar olan ön ek bir kez rasterlenip her kareye kopyalanır; `renderTimelineApng` artık `gradients` seçeneği alır, `staticLayerNodes` raporlar

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

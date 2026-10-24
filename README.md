# FastSVG

AI modelleri için profesyonel SVG üretim, ince işçilik ve animasyon altyapısı.
Model niyeti belirler; FastSVG geometriyi hesaplar, sahneyi render eder, kaliteyi ölçer.

Şartname v1.0'ın **v0.2 dilimi** uygulandı: Scene IR + path motoru + renk/gradient bilimi +
timeline/animasyon + gerçek APNG encoder + görsel diff + MCP (10 araç) + CLI.

## Paketler

| Paket | İş |
|---|---|
| `@fastsvg/scene-ir` | Ana veri modeli: sahne dokümanı, node tipleri, atomik patch |
| `@fastsvg/geometry` | Path parse/serialize, Bézier değerlendirme, gerçek ekstremum bounds, arc length, reverse, transform |
| `@fastsvg/color-engine` | sRGB ↔ linear ↔ OKLab/OKLCH, WCAG kontrast, ton skalası |
| `@fastsvg/gradient-engine` | Linear/radial gradient, OKLab stop dağıtımı, banding analizi, SVG defs |
| `@fastsvg/motion-engine` | Timeline, keyframe, cubic-bezier/steps/spring easing, loop dikiş analizi |
| `@fastsvg/raster` | RGBA framebuffer, 2×2 AA dolgu/stroke rasterizasyon, sahne render |
| `@fastsvg/apng-exporter` | Sıfırdan PNG/APNG encoder + decoder (CRC, fcTL/fdAT denetimli) |
| `@fastsvg/frame-pipeline` | Sahne + timeline → deterministik kare render → APNG |
| `@fastsvg/vision` | Piksel diff, değişim bbox, silüet IoU |
| `@fastsvg/export-svg` | Scene → SVG (`svg-editable`, gradient defs destekli) |
| `@fastsvg/mcp-server` | MCP stdio sunucusu (10 araç) |
| `@fastsvg/cli` | `validate`, `export`, `render`, `compare` |

## Kurulum ve geliştirme

```bash
npm install
npm test                        # node:test + tsx (77 test)
npm run build                   # tsc -b
node scripts/mcp-smoke.mjs      # MCP stdio uçtan uca duman testi
npx tsx examples/animation/run.ts  # scene+timeline → APNG örneği
```

## CLI

```bash
npx fastsvg validate path.d
npx fastsvg export scene.json --out out.svg
npx fastsvg render scene.json --out out.png
npx fastsvg compare a.png b.png [--tolerance 2]
```

## MCP

```bash
npx fastsvg-mcp   # stdio transport
```

Araçlar: `fastsvg_create_scene`, `fastsvg_apply_patch`, `fastsvg_get_scene_summary`,
`fastsvg_build_path`, `fastsvg_validate_svg`, `fastsvg_create_gradient`,
`fastsvg_export_asset`, `fastsvg_render_png`, `fastsvg_export_apng`,
`fastsvg_compare_images`.

MCP istemci yapılandırması (Claude Desktop örneği):

```json
{
  "mcpServers": {
    "fastsvg": { "command": "npx", "args": ["fastsvg-mcp"] }
  }
}
```

## Desteklenen özellikler / bilinen sınırlamalar

Desteklenen: path parse (M,L,H,V,C,S,Q,T,A,Z, relative), gerçek Bézier bounds, arc length,
OKLab renk bilimi, linear/radial gradient + banding ölçümü, timeline + 4 easing ailesi,
deterministik kare render, gerçek APNG encode/decode, piksel diff + silüet IoU.

Bilinen sınırlamalar (v0.3 hedefleriyle):
- Boolean operasyonlar, path offset/simplify: uygulanmadı
- Gradient fill raster render'da atlanır (uyarı üretir); SVG export'ta tam destekli
- A komutunun transform altında dönmesi: desteklenmez (segments düz kalır)
- APNG dispose/blend: yalnızca full-frame APNG (0,0 offset); delta frame optimizasyonu yok
- SSIM ve algısal diff: yok; yalnızca sayısal piksel metrikleri
- MCP uzun işler için job/cancellation mekanizması: yok

## Güvenlik yaklaşımı

- Tüm boyut/frame/piksel bütçeleri isimli sabitlerle sınırlı (`MAX_PIXELS`, `MAX_FRAMES`, `MAX_DIMENSION`)
- PNG decoder CRC ve chunk sınırı doğrular; bozuk dosya kontrollü hata verir
- Timeline süresi/fps/aralık limitleri validation katmanında
- Ağ erişimi yok; yerel işlem

## Yol haritası

- **v0.3:** Boolean operasyonlar, gradient raster fill, delta-frame APNG, frame bazlı diff, job/cancellation
- **v0.4:** Rust geometri çekirdeği, Web Adapter, Lottie/video export adapter'ları

Tam şartname: `docs/product-requirements.md`. İlerleme kaydı: `PlanTreni.md`. Ajan kuralları: `AGENTS.md`.

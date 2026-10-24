# FastSVG

AI modelleri için profesyonel SVG üretim, ince işçilik ve animasyon altyapısı.
Model niyeti belirler; FastSVG geometriyi hesaplar, sahneyi render eder, kaliteyi ölçer.

> Bu depo şartname v1.0'ın **v0.1 tohum dilimidir**: Scene IR (ana veri modeli), path motoru,
> svg-editable export, MCP server ve CLI. Gradyan/mask/animasyon/renk motoru v0.2+ dilimlerindedir.

## Paketler

| Paket | İş |
|---|---|
| `@fastsvg/scene-ir` | Scene IR: sahne dokümanı, node tipleri, atomik patch sistemi |
| `@fastsvg/geometry` | SVG path parse/serialize, bounds, mutlak komut normalizasyonu |
| `@fastsvg/export-svg` | Scene → SVG (`svg-editable` profili) |
| `@fastsvg/mcp-server` | MCP stdio sunucusu: sahne oluştur/patch/export/validate |
| `@fastsvg/cli` | `fastsvg validate`, `fastsvg export` |

## Kurulum ve geliştirme

```bash
npm install
npm test        # node:test + tsx
npm run build   # tsc -b
```

## CLI

```bash
npx fastsvg validate path.d
npx fastsvg export scene.json --out out.svg
```

## MCP

```bash
npx fastsvg-mcp        # stdio transport
```

Araçlar: `fastsvg_create_scene`, `fastsvg_apply_patch`, `fastsvg_get_scene_summary`,
`fastsvg_build_path`, `fastsvg_export_asset`, `fastsvg_validate_svg`.

## Yol haritası

- **v0.2:** gradient/mask node'ları, boolean operasyonlar, resvg render adapter, capability matrix
- **v0.3:** Motion Engine (timeline, easing, morph), APNG exporter, quality-engine alt skorları
- **v0.4:** Rust geometri çekirdeği (`crates/`), Web Adapter, tam tool seti

Ayrıntılı ürün şartnamesi: `docs/product-requirements.md`. İlerleme kaydı: `PlanTreni.md`.

PlanTreni
Değer: AI modellerine profesyonel SVG/animasyon üretim araçları veren motor — FastSVG v0.1 tohumu.

Kaynak: Downloads/FastSVG_Teknik_Sartname.md (bölüm 4, 5, 6.1, 11.3, 16, 18)
Şartnameden bu dilime alınanlar: Scene IR ana veri modeli, path builder, svg-optimized export, ilk MCP tool seti küçültülmüş sürüm.

Bağlantılar:
package.json → packages/*, apps/*
packages/scene-ir → tipler + patch (kaynak doğrusu)
packages/geometry → path parse/serialize/bounds
packages/export-svg → scene-ir → SVG string
apps/mcp-server → scene-ir, export-svg, geometry
apps/cli → export-svg, geometry

Kod hijyeni: kebab-case dosya, camelCase TS, strict TS, hata yönetimi Result yerine düz exception + validation fonksiyonları (v0.1), test node:test + tsx.

[x] PlanTreni
[x] repo iskeleti (npm workspaces, tsconfig, gitignore)
[x] packages/scene-ir
[x] packages/geometry
[x] packages/export-svg
[x] apps/mcp-server (stdio, 6 tool)
[x] apps/cli (export, validate)
[x] testler + yeşil
[x] git init + GitHub repo (theayzek01/fastsvg) + push

[ ] v0.2: gradient/mask node'ları, boolean, render preview (resvg adapter)
[ ] v0.3: Motion Engine timeline, APNG exporter
! Windows'ta pnpm yok; npm workspaces kullanılıyor
? şartnamedeki Rust çekirdeği (crates/) v0.2 kararına bırakıldı

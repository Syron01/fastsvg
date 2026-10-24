# AGENTS.md — ajanlar için mimari ve çalışma kuralları

## Değer cümlesi
FastSVG, AI modellerine profesyonel SVG/geometri/renk/animasyon/APNG üretim araçları veren mühendislik altyapısıdır. Her karar bu değere göre ölçülür.

## Mimari kurallar
- Scene IR (`@fastsvg/scene-ir`) ana veri modelidir; SVG string kaynak değildir.
- Bağımlılık yönü: `scene-ir` ← `geometry` ← (`raster`, `motion-engine`) ← `frame-pipeline`; `color-engine` ← `gradient-engine`, `vision`. Döngü yasak.
- `scene-ir` ve `geometry` hiçbir I/O, MCP veya dosya sistemine bağımlı olamaz.
- MCP handler'ları iş mantığı içermez; paket API'lerini çağırır.
- Her package kendi `package.json` + `tsconfig.json` + testlerine sahiptir; root `tsconfig.json` references listesine yeni paket eklenmelidir.

## Kod stili
- TypeScript strict, `noUncheckedIndexedAccess`, NodeNext ESM.
- Dosya adları kebab-case; idare: tipler → sabitler → public API → helpers.
- `any` ve kontrolsüz cast yasak; sınırlı adapter istisnası gerekçeli olmalı.
- Magic number yerine isimli sabit (ör. `MAX_FRAMES`, `MAX_DIMENSION`).

## Test
```bash
npm test            # tüm paketler, node:test + tsx
npm run build       # tsc -b (root references)
node scripts/mcp-smoke.mjs   # MCP stdio uçtan uca duman testi
```
- Yeni algoritma = yeni test dosyası. Mock/stub gerçek implementasyon yerine geçmez.
- Sayısal iddialar (bounds, uzunluk, renk dönüşümü) testle kanıtlanır.

## Güvenlik ilkeleri
- Girdi limitleri: framebuffer piksel bütçesi, frame sayısı, timeline süresi — hepsi isimli sabit.
- Kullanıcı path'leri güvenilmezdir; CLI/MCP yazma hedefi açık parametredir.
- Loglara gizli veri yazılmaz.

## Teslim standardı
- Değişiklik sonrası: build + tüm testler yeşil + (MCP/CLI dokunulduysa) duman testi.
- `PlanTreni.md` güncellenir: hangi dosya neye bağlanır, [x]/[~]/[ ] durumları.
- Bilinen sınırlamalar raporda açıkça yazılır; "çalışıyor" yalnızca testle söylenir.

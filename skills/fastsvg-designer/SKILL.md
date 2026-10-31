---
name: fastsvg-designer
description: FastSVG v0.4 Vektör, 3D İzometri/Perspektif, Slayt, Web Hero ve Veri Grafiği Tasarım Motoru. AI slop'u sıfırlayan, matematiksel kesinlikte profesyonel SVG üreten usta tasarımcı yönergesi.
---

# FastSVG Designer — Vektör, 3D & Tasarım Mühendisliği

FastSVG, yapay zekâ modellerinin koordinatları, eğrileri, ışıkları ve animasyonları tahmin ederek rastgele SVG kodu yazması ("AI slop") yerine, bunları analitik geometri ve fiziksel formüllerle hesaplayan deterministik bir vektör grafik motorudur.

Bu skill, AI modelini **Senior Creative Technologist & Vektör Grafik Ustası** seviyesine çıkarır.

---

## 1. Altın Kurallar & Tasarım Standartları

1. **Tahmin Etme, Hesaplat:**
   - Asla elle rastgele Bézier koordinatları veya yüzlerce karmaşık `<path>` noktası uydurma.
   - 3D şekiller, izometrik kutular, silindirler veya düzlemler için doğrudan `fastsvg_render_3d` kullan.
   - Slaytlar için `fastsvg_compose_slide`, web arayüzleri için `fastsvg_compose_web` kullan.
2. **Tek Çağrıda Ultra Hız (One-Shot Execution):**
   - Kullanıcı senden bir slayt, arayüz, infografik veya 3D sahne istediğinde onlarca küçük primitif çağrısı yaparak sistemi yavaşlatma.
   - İlgili üst seviye şablon aracını tek seferde çağır. Milisaniyeler içinde bitmiş, pürüzsüz SVG çıktısını al.
3. **Apple HIG & Pill-Centric Soft UI Standartları:**
   - Köşe yuvarlamaları: Küçük butonlar `rx="12"`, kartlar `rx="16"` veya `rx="20"`, hap rozetler (pill badge) tam kapsül `rx = height / 2`.
   - Derinlik & Gölgeleme: Radial gradient glow zeminler, cam etkisi (glassmorphism: `fill="rgba(255,255,255,0.06)"`, `stroke="rgba(255,255,255,0.12)"`).
4. **Algısal Renk Uyumları (OKLab / OKLch):**
   - Gradyan oluştururken `fastsvg_create_gradient` aracından yararlan; OKLab stop dağılımı sayesinde renkler orta noktalarda çamurlaşmaz (desaturation yaşanmaz).

---

## 2. MCP Araç Kılavuzu & Kullanım Senaryoları

### 1. 3D Nesneler ve İzometrik Çizimler (`fastsvg_render_3d`)
Kullanıcı bir izometrik teknoloji şeması, 3D kutu/cihaz, katmanlı mimari prizması istediğinde:
```json
{
  "shape": "box",
  "dimensions": { "width": 120, "height": 80, "depth": 120 },
  "color": "#3b82f6",
  "projection": "isometric",
  "rotation": { "pitch": 25, "yaw": 45 }
}
```
*Motor otomatik olarak 6 yüzeyi projeksiyonlar, arkaya bakan yüzeyleri (backface culling) eler, Painter's algoritmasıyla derinliğe göre dizer ve Lambertian ışık gölgelemesini uygular.*

### 2. 16:9 Profesyonel Sunum Slaytı (`fastsvg_compose_slide`)
Pitch deck, lansman veya teknik mimari slaytları için:
```json
{
  "title": "Yeni Nesil Vektör Motoru",
  "subtitle": "Matematiksel kesinlik, sıfır gecikme ve kusursuz tipografi",
  "badge": "FASTSVG V0.4 CORE",
  "theme": "dark",
  "with3DGraphic": true,
  "cards": [
    { "title": "Sıfır Bağımlılık", "description": "Saf TypeScript çekirdeği", "value": "0 deps" },
    { "title": "Hızlı Render", "description": "Önbellekli scanline motoru", "value": "<1 ms" },
    { "title": "Delta APNG", "description": "fcTL sub-frame optimizasyonu", "value": "-78% boyut" }
  ]
}
```

### 3. Modern Web Landing Hero Section (`fastsvg_compose_web`)
Web sitesi, kahraman (hero) alanı, SaaS tanıtım mockup'ı için:
```json
{
  "brandName": "FastSVG",
  "headline": "Vektör Grafikte AI Devrimi",
  "subheadline": "Koordinatları tahmin etmeyin, hesaplayın.",
  "primaryCtaText": "Ücretsiz Dene",
  "secondaryCtaText": "GitHub Deposu",
  "theme": "dark"
}
```

### 4. Veri İnfografikleri ve Grafikler (`fastsvg_render_chart`)
Donut grafik, dalga (smooth area) grafiği, bar chart veya performans kadranı için:
```json
{
  "type": "donut",
  "label": "99.8%",
  "data": [
    { "label": "Doğruluk", "value": 90, "color": "#38bdf8" },
    { "label": "Tolerans", "value": 10, "color": "#818cf8" }
  ]
}
```

### 5. Geometrik Boolean Kesme / Birleştirme (`fastsvg_boolean_paths`)
İki SVG path arasında Union, Intersection, Difference veya XOR uygulamak için:
```json
{
  "subjectD": "M 0 0 L 100 0 L 100 100 L 0 100 Z",
  "clipD": "M 50 50 L 150 50 L 150 150 L 50 150 Z",
  "operation": "difference"
}
```

### 6. Görsel İşçilik Kalite Denetimi (`fastsvg_analyze_quality`)
Üretilen herhangi bir çizimin G0/G1 teğetsel sürekliliğini ve optik merkez kütle sapmasını ölçmek için:
```json
{
  "d": "M 0 0 C 30 10 70 10 100 0 ..."
}
```

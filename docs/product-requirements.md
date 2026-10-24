# FastSVG

## Profesyonel Vektör Çizim, Görsel İnce İşçilik, Hareket Tasarımı ve AI Kalite Mühendisliği Platformu

**Belge türü:** Ürün vizyonu, teknik şartname ve uygulama planı  
**Sürüm:** 1.0  
**Durum:** İlk uygulama için ana gereksinim belgesi  
**Hedef kullanıcılar:** AI kodlama ajanları, tasarım araçları, web geliştiricileri, illüstratörler, motion designer'lar ve ürün ekipleri  
**Birincil entegrasyon:** Model Context Protocol (MCP)  
**Belgenin amacı:** FastSVG'nin modüllerini, teknik mimarisini, API sözleşmelerini, kod düzenini, kalite ölçütlerini, güvenlik modelini ve aşamalı geliştirme sırasını bir kodlama ajanının belirsizliği minimum tutarak uygulayabileceği açıklıkta tanımlamak.

---

## 0. Yönetici Özeti

FastSVG, yapay zekâ modellerinin SVG, logo, ikon, illüstrasyon, teknik çizim, hareketli grafik ve HTML/CSS arayüzleri üretirken başvuracağı profesyonel bir **görsel üretim ve ince işçilik altyapısıdır**.

Bugün birçok üretim akışında model, çizimi doğrudan koordinat ve kod tahmin ederek oluşturmaya çalışır. Bu yaklaşım hızlı prototipler için yararlı olsa da karmaşık eğriler, anatomi, kontur sürekliliği, ışık, malzeme, gradient geçişleri, katman ilişkileri, zamanlama ve çıktı optimizasyonu gibi ayrıntılarda kırılgan sonuçlar verebilir.

FastSVG'nin temel yaklaşımı farklıdır:

> **Eskiden modelden çizimi tahmin ederek yazması bekleniyordu. FastSVG ile model, profesyonel bir tasarımcının kullandığı geometri araçlarına, malzemelere, ölçüm araçlarına, render tezgâhına, animasyon zaman çizelgesine ve kalite kontrol ekipmanına erişir.**

Model; görsel niyeti, kompozisyonu ve tercihleri belirler. FastSVG ise bu niyeti yapılandırılmış sahneye dönüştürür, geometriyi hesaplar, renk ve ışık işlemlerini yürütür, animasyon karelerini üretir, çıktıyı gerçek bir render motorunda inceler ve mümkün olan hataları deterministik yöntemlerle düzeltir.

FastSVG bir prompt koleksiyonu değildir. Bir SVG şablon deposu değildir. Yalnızca XML yazan bir MCP sunucusu değildir. Tek başına yeni bir görsel üretim modeli olduğu da varsayılmamalıdır. **FastSVG, mevcut modellerin çizim ve tasarım iş akışlarını güçlendiren, ölçülebilir kaliteye odaklanan, modüler bir görsel üretim motorudur.**

Ürün beş temel ilke üzerinde kurulmalıdır:

1. **Tahmin yerine hesaplama:** Matematiksel olarak belirlenebilen işler mümkün olduğunca deterministik algoritmalarla yapılır.
2. **Kod yerine görsel sonuç:** Kaynak kod, ara temsildir; asıl çıktı render edilmiş, test edilmiş ve hedefe göre değerlendirilmiş görseldir.
3. **Tek format yerine uygun format:** SVG, HTML/CSS, APNG ve diğer çıktı türleri gerektiği yerde birlikte veya ayrı kullanılır.
4. **Tek seferlik üretim yerine kontrollü iyileştirme:** Hatalar tespit edilir, etkilenen bölge düzeltilir, regresyon kontrolü yapılır.
5. **Genel estetik yerine bağlam:** FastSVG her tasarımı aynı stile zorlamaz; kullanıcının referansını, markasını, amacını ve tercihlerini korur.

## 1. Vizyon, Amaç ve Ürün Tanımı

### 1.1 Vizyon

FastSVG'yi AI sistemleri için SVG ve hareket tasarımı alanında devrim yaratacak, profesyonel işçilik seviyesinde kontrol sağlayan bir araç ve motor ekosistemine dönüştürmek.

### 1.2 Ana amaç

AI'nin vektör çizim ve ilişkili tasarım görevlerinde rastgele koordinat, renk, geçiş, kontur veya animasyon tahminlerine bağımlılığını azaltmak; modelin niyetini uzmanlaşmış araçlarla çalışan, render edilebilen ve ölçülebilen bir üretim sürecine dönüştürmek.

### 1.3 Ürün tanımı

FastSVG aşağıdaki parçaların birlikte çalıştığı bir sistem olmalıdır:

- **FastSVG MCP Server:** Uyumlu AI istemcilerine araçlar, kaynaklar ve görev şablonları sağlar.
- **FastSVG Core:** Sahne modeli, geometri, renk, kompozisyon ve animasyon verilerini yönetir.
- **FastSVG Vector Engine:** Path, Bézier, Boolean, stroke, mask, clipping, gradient ve SVG yapım araçlarını sağlar.
- **FastSVG Motion Engine:** Zaman çizelgesi, keyframe, easing, rig, path animation ve kare üretim akışını yönetir.
- **FastSVG Render & Export:** Çıktıları görselleştirir, farklı formatlara dışa aktarır ve render uygunluğunu denetler.
- **FastSVG Quality Lab:** Teknik kontroller, görsel karşılaştırmalar, kalite puanları ve regresyon testlerini yürütür.
- **FastSVG Web Design Adapter:** Gerektiğinde HTML/CSS arayüzlerini analiz eder, tasarım tokenları ve SVG varlıklarıyla uyumlu değişiklikler yapar.
- **FastSVG CLI & SDK:** MCP dışında doğrudan komut satırı ve programatik kullanım sağlar.
- **FastSVG Installer & Doctor:** Kurulum, istemci bağlantısı, bağımlılık kontrolü ve sorun giderme işlerini kolaylaştırır.

### 1.4 Temel kullanım senaryoları

- Özgün ve profesyonel logolar üretmek; geometrik hizalama, negatif alan, optik düzeltme ve farklı boyutlarda okunabilirliği kontrol etmek.
- İkon aileleri oluşturmak; ortak grid, stroke kalınlığı, köşe dili ve optik ağırlık tutarlılığını korumak.
- Maskot ve karakter illüstrasyonları oluşturmak; yüz, poz, kıyafet, saç, kontur, gölge ve katman ilişkilerini yönetmek.
- Fotogerçekçi görünüme yaklaşan vektör ve hibrit illüstrasyonlar hazırlamak; ışık, yumuşak ton geçişleri, malzeme, yüzey, doku ve yansımaları kontrollü üretmek.
- SVG tabanlı infografik, diyagram, harita, teknik çizim ve veri görselleştirmesi üretmek.
- SVG animasyonları, logotype hareketleri, mask reveal, path morph, ikon animasyonu ve döngülü görsel içerik hazırlamak.
- Şeffaf arka planlı, çok kareli ve tam renkli APNG çıktıları oluşturmak.
- SVG veya animasyon kaynaklarını HTML/CSS tabanlı web projelerine entegre etmek.
- Var olan bir SVG'yi analiz etmek, bozuk path'leri düzeltmek, gereksiz düğümleri azaltmak, gradientleri iyileştirmek ve dosyayı optimize etmek.
- Bir referans görseli analiz edip izlenebilir, düzenlenebilir bir vektör veya hibrit sahne oluşturmak.

### 1.5 Ürün ilkeleri

1. **Önce doğruluk, sonra süsleme.** Yapısal ve geometrik hatalar çözülmeden efekt eklenmez.
2. **Kaynağı koru.** Kullanıcı mevcut bir tasarım veya proje verdiyse istenmeyen yeniden tasarım yapılmaz.
3. **En küçük güvenli değişiklik.** Bir detay bozuksa bütün sahne baştan üretilmez.
4. **Ölçülebilir kalite.** Kalite, tek bir öznel puana değil, farklı test ve ölçümlere dayanır.
5. **Tekrarlanabilirlik.** Aynı girdi, ayarlar, motor sürümü ve seed ile mümkün olduğunca aynı sonuç elde edilir.
6. **Açık sınırlamalar.** Vektör motorunun fotoğraf gerçekçiliğinde hangi noktada yetersiz kaldığı saklanmaz; gerektiğinde raster veya hibrit yol seçilir.
7. **Taşınabilirlik.** MCP, CLI ve SDK aynı çekirdek işlevleri paylaşır.
8. **Güvenli varsayılanlar.** Dosya sistemi, dış bağlantı ve render kaynakları izin ve limitlerle kontrol edilir.
9. **Format sadakati.** Kaynak sahne ile dışa aktarılan SVG/HTML/APNG arasındaki kayıplar raporlanır.
10. **Tasarım çeşitliliği.** FastSVG tek bir moda, palette veya hazır web tasarım kalıbına zorlamaz.

### 1.6 Kapsam dışı veya yanlış yorumlanmaması gereken konular

- FastSVG tek başına bir metinden-görüntüye temel model değildir; mevcut modelleri güçlendiren araç katmanıdır.
- Her modeli veya her istemciyi kullanıcı izni olmadan otomatik etkinleştireceği garanti edilemez. İstemci bağlantısı ve araç kullanımı istemci politikalarına bağlıdır.
- Her görseli tamamen vektörel biçimde ve fotoğraf kalitesinde üretmek zorunlu hedef değildir. Fotogerçekçilik gerektiren görevlerde vektör, gömülü raster katman ve render edilmiş kareler birlikte kullanılabilir.
- İlk sürümde tüm standartların tüm özellikleri aynı anda tamamlanmayacaktır. Mimari, modüler genişlemeye göre kurulacaktır.
- “AI slop'u sıfırlar” gibi doğrulanamayan bir iddia ürün garantisi olarak kullanılmayacaktır. Hedef, tekrarlayan düşük kaliteli örüntüleri ölçmek ve azaltmaktır.

## 2. Başarı Tanımı ve Ürün Sözleşmesi

### 2.1 Ürünün sağlayacağı somut sonuç

Kullanıcı bir AI'ye “referanstaki görseli temiz bir SVG'ye dönüştür”, “bu logoyu daha profesyonel hale getir”, “bu logoya kusursuz döngülü animasyon yap” veya “bu web sayfasını mevcut tasarımını bozmadan düzelt” dediğinde model yalnızca çizim kodu tahmin etmek yerine FastSVG araçlarını çağırabilir. FastSVG sahneyi oluşturur veya mevcut projeyi okur, render alır, teknik ve görsel kontrolleri çalıştırır, uygun düzeltmeleri uygular ve teslim edilebilir dosyalar üretir.

### 2.2 Başarı metrikleri

Her metrik test edilebilir, sürümlenebilir ve kategori bazında raporlanabilir olmalıdır.

- **Geometri geçerliliği:** Geçersiz path, bozuk transform, açık kalması gereken konturun kapanması, yanlış bounds ve çakışan constraint sayısı.
- **Render başarı oranı:** Desteklenen SVG alt kümesindeki örneklerin sorunsuz render edilme yüzdesi.
- **Referans benzerliği:** Silüet, kenar, kompozisyon, renk, bölgesel yerleşim ve algısal benzerlik ölçümleri.
- **İşçilik kalitesi:** Eğri sürekliliği, düğüm yoğunluğu, stroke tutarlılığı, görünür birleşim hataları ve optik denge.
- **Animasyon kalitesi:** Frame pacing, kare süreleri, path morph topolojisi, döngü dikişi, temporal flicker ve kareler arası renk değişimi.
- **Dosya verimliliği:** SVG boyutu, gereksiz düğüm sayısı, yinelenen tanımlar, APNG boyutu ve bellek kullanımı.
- **Performans:** İlk render gecikmesi, P50/P95 işlem süresi, kare başına render süresi, cache hit oranı ve kaynak tüketimi.
- **Düzeltme verimliliği:** İlk çıktıya kıyasla hata sayısındaki azalma ve düzeltme başına kalite kazanımı.
- **Uyumluluk:** Hedeflenen tarayıcılar ve istemcilerde kurulum, araç keşfi, render ve dışa aktarma başarısı.
- **Kullanıcı kabulü:** Kör karşılaştırmada profesyonel kullanıcıların seçimleri ve kabul/red gerekçeleri.

Başlangıç performans hedefleri yalnızca test ortamı tanımlandıktan sonra onaylanmalıdır. İlk hedef örnekleri: basit geometri işlemlerinin tipik masaüstünde milisaniye ölçeğinde tamamlanması; küçük statik SVG önizlemesinin 100 ms civarında bir P95 hedefine yaklaşması; animasyon hedef fps değerinin her kare için render bütçesi olarak ele alınması. Bunlar doğrulanmış sonuç değil, benchmark ile sınanacak mühendislik hedefleridir.

## 3. Sistem Mimarisi

### 3.1 Katmanlar

1. **Client Integration Layer:** Claude ve diğer MCP istemcileri, CLI, editör uzantıları ve SDK kullanıcıları.
2. **MCP Transport Layer:** Yerel `stdio` ve gerektiğinde yetkilendirilmiş Streamable HTTP taşıması.
3. **Tool Orchestration Layer:** Araç şemaları, görev yönlendirme, işlem planı, timeout, iptal, idempotency ve çağrı bütçesi.
4. **Intent & Planning Layer:** İstek analizi, hedef çıktı biçimi, kalite hedefleri, referans kısıtları ve üretim planı.
5. **Scene IR Layer:** Görsel, geometri, stil, animasyon ve ilişki verilerinin biçimden bağımsız ara temsili.
6. **Deterministic Engine Layer:** Geometri, renk, gradient, kısıt çözücü, path optimizasyonu ve zaman hesaplamaları.
7. **Rendering Layer:** SVG render, browser render, frame rendering, bölgesel render ve ekran görüntüsü.
8. **Quality Layer:** Teknik doğrulama, görsel analiz, animasyon kontrolü, erişilebilirlik ve regresyon.
9. **Export Layer:** SVG, APNG, PNG, HTML/CSS, JSON scene, gerektiğinde WebP/AVIF/GIF/Lottie gibi formatlara adaptörler.
10. **Storage & Cache Layer:** Proje dosyaları, kısa süreli job state, içerik adresli cache ve benchmark kayıtları.
11. **Security & Observability Layer:** İzinler, kaynak limitleri, audit log, hata raporu ve telemetry tercihleri.

### 3.2 Veri akışı

```text
Kullanıcı isteği / referans
        |
        v
İstek analizi ve hedef belirleme
        |
        v
Scene Plan + Tasarım Kısıtları
        |
        v
Scene IR / mevcut projede minimum patch
        |
        +---------------------------+
        |                           |
        v                           v
Geometri / Stil Motoru       Animasyon Zaman Çizelgesi
        |                           |
        +-------------+-------------+
                      |
                      v
                Render Motoru
                      |
                      v
       Teknik + Görsel + Temporal QA
                      |
             +--------+--------+
             |                 |
             v                 v
        Başarılı mı?       Düzeltme Planı
             |                 |
             v                 v
       Optimize / Export <- Küçük Patch
                      |
                      v
      Dosyalar + Önizleme + QA Raporu
```

### 3.3 Kaynak doğrusu

**Scene IR (Intermediate Representation) ana kaynak doğrusu olmalıdır.** SVG string'i tek başına ana veri modeli olarak kullanılmamalıdır.

Nedenleri:

- Nesneler `id` ile referanslanabilir.
- İlişkiler, kısıtlar ve animasyon track'leri kod string'i ayrıştırmadan düzenlenebilir.
- Aynı sahne SVG, APNG, HTML preview ve JSON formatlarına dönüştürülebilir.
- Bir nesne değiştiğinde bağımlılık grafiği yalnızca ilgili düğümleri yeniden hesaplayabilir.
- Görsel düzeltme, kaynak kodun metinsel araması yerine sahne düzeyinde hedeflenebilir.
- History, undo/redo ve patch tabanlı çalışma kolaylaşır.

SVG string'i dışa aktarma ve kullanıcıya teslim edilen kaynak formatlarından biridir. Harici SVG içeri alındığında parser üzerinden Scene IR'ye çevrilmeli; çevrilemeyen özellikler açık uyumluluk notuyla korunmalı veya raw node olarak izole edilmelidir.

### 3.4 Hibrit vektör/raster politikası

FastSVG iki ayrı çıktı yolunu birinci sınıf vatandaş olarak desteklemelidir:

- **Vector-first:** Logo, ikon, diyagram, geometri ve ölçeklenebilir varlıklar için düzenlenebilir vektör.
- **Hybrid/render-first:** Fotogerçekçi doku, yoğun ışık, karmaşık blur, parçacık, hızlı motion blur veya belirli efektlerin vektörde verimsiz olduğu işler için vektör + raster katman veya tam raster animasyon.

Planlayıcı, kullanıcının “saf SVG”, “her şey düzenlenebilir vektör”, “dosya boyutu minimum”, “en gerçekçi sonuç” gibi hedefleri arasındaki ödünleşimi açıkça ele almalıdır. Saf vektör zorunluluğu varsa bunu ihlal eden gizli raster katman eklenmemelidir.

## 4. Teknoloji Kararları

Teknoloji seçimleri tek bir kütüphaneye kilitlenmemeli; her altyapı bileşeni adapter/trait arayüzünün arkasında tutulmalıdır.

### 4.1 Önerilen başlangıç yığını

- **MCP Server:** TypeScript ve resmi MCP TypeScript SDK'sı.
- **Genel API ve CLI:** TypeScript; şemalı giriş/çıkışlar ve ortak çekirdek istemcisi.
- **Geometri çekirdeği:** Rust; eğriler, transformlar, bounds, hit test, path simplify ve güvenli bellek yönetimi.
- **Rust geometri araştırması:** Kurbo benzeri eğri/vektör kütüphaneleri değerlendirilebilir; tüm ihtiyaçlar tek bağımlılığa yüklenmemelidir.
- **Statik SVG render:** usvg/resvg gibi statik SVG renderer'ları değerlendirilebilir; dinamik SVG animasyonu destekledikleri varsayılmamalıdır.
- **Web/HTML render:** Kontrollü Chromium otomasyonu; sayfa viewport'u, cihaz ölçeği, fontlar ve zamanlama sabitlenerek test edilir.
- **Animasyon:** Format bağımsız timeline; renderer adapter'ları üzerinden SVG SMIL, CSS/WAAPI ve frame-based output üretimi.
- **APNG encoding:** Olgun ve test edilmiş bir PNG/APNG kodlayıcı veya güvenilir düşük seviyeli encoder adapter'ı.
- **Şema doğrulama:** TypeScript'te ortak şema tanımı (ör. Zod/JSON Schema entegrasyonu); Rust tarafına açık ve testli serileştirme sözleşmesi.
- **Test:** Unit, property-based, fuzz, integration, browser, golden image ve benchmark testleri.
- **Paketleme:** Node.js LTS uyumluluğu, yerel native binary indirme veya opsiyonel WASM/CLI fallback.

### 4.2 Teknoloji seçim ilkeleri

1. Her bağımlılık için lisans, bakım etkinliği, güvenlik geçmişi, platform uyumluluğu ve benchmark incelenir.
2. Bir kütüphanenin “SVG renderer” olarak adlandırılması animasyon, script veya tüm SVG 2 özelliklerini desteklediği anlamına gelmez.
3. Browser rendering ve statik rendering ayrı adapter'lar olarak tutulur.
4. Native hız gerektiğinde Rust kullanılır; fakat kullanıcıya ait karmaşık iş akışları okunabilir TypeScript katmanında kalabilir.
5. WASM çıktısı opsiyoneldir; native ve WASM davranış farkları benchmark ve testle ölçülür.
6. Her bir renderer'ın desteklemediği özellikleri açıkça bildiren bir capability matrix bulunur.

### 4.3 Renderer Capability Matrix

Her renderer, her release ile sürümlenen özellik matrisi yayınlamalıdır:

- SVG element ve attribute desteği.
- Gradient, pattern, filter, mask ve clip desteği.
- External image/font politikası.
- Text shaping ve font fallback davranışı.
- Animasyon desteği: SMIL, CSS, WAAPI, JavaScript.
- Color profile ve color interpolation davranışı.
- APNG frame üretim desteği.
- Platform/sürüm farkları.
- Bilinen görsel farklılıklar.

Desteklenmeyen bir özelliğin sessizce yok sayılması kabul edilmez. Sistem uyarı, fallback veya kontrollü hata üretmelidir.

## 5. Scene IR — Ana Veri Modeli

### 5.1 Tasarım hedefleri

Scene IR deterministik, sürümlenebilir, JSON ile taşınabilir, patch uygulanabilir, tipli, format bağımsız ve küçük projelerde insan tarafından incelenebilir olmalıdır.

Önerilen çekirdek alanlar:

```ts
export interface SceneDocument {
  schemaVersion: string;
  documentId: string;
  metadata: SceneMetadata;
  viewport: Viewport;
  designTokens: DesignTokenSet;
  assets: AssetReference[];
  nodes: SceneNode[];
  constraints: Constraint[];
  timelines: Timeline[];
  exportProfiles: ExportProfile[];
  extensions?: Record<string, unknown>;
}
```

Bu yalnızca başlangıç arayüzüdür. Nihai tipler tek bir `types.ts` dosyasında toplanmamalı; domain alanlarına göre ayrılmalıdır.

### 5.2 Scene node türleri

En az şu node türleri desteklenmelidir:

- `GroupNode`
- `PathNode`
- `RectNode`
- `EllipseNode`
- `PolygonNode`
- `PolylineNode`
- `LineNode`
- `TextNode`
- `ImageNode`
- `GradientNode`
- `PatternNode`
- `MaskNode`
- `ClipNode`
- `FilterNode`
- `SymbolNode`
- `UseNode`
- `MeshGradientNode` (arka uç destekliyorsa veya fallback tanımıyla)
- `CameraNode` (2D/2.5D kompozisyon için)
- `RigNode` / `BoneNode` (iskelet animasyonu için)
- `ParticleEmitterNode` (öncelikle frame-based renderer'da)
- `RawSvgNode` (uyumluluk ve kayıplı dönüşüm riskini izlemek için)

### 5.3 Her node için ortak alanlar

- Stabil ve benzersiz `id`.
- `type` discriminator.
- İsteğe bağlı semantik rol: `logo-mark`, `eye-left`, `background`, `shadow`, `wordmark` vb.
- Parent/child ilişkisi ve sıralama.
- Local transform ve hesaplanmış world transform.
- Local bounds ve dünya koordinatlarındaki bounds.
- Style referansı veya inline style model nesnesi.
- Constraint referansları.
- Animasyon track referansları.
- Kaynak/provenance bilgisi: kullanıcı tarafından sağlandı, araç tarafından üretildi veya içeri alındı.
- Lock, visibility, export ve editability flags.

### 5.4 Transform ve koordinat sistemi

- İç hesaplamalar yüksek hassasiyetli sayısal türlerle yapılmalı; SVG dışa aktarmasında kontrollü ondalık hassasiyeti uygulanmalıdır.
- Transform matrisi için tek bir konvansiyon tanımlanmalı; çarpım sırası belgelenmelidir.
- Local ve world coordinates karıştırılmamalıdır.
- `viewBox`, canvas pixel size, CSS size ve device pixel ratio ayrı kavramlardır.
- Ölçek küçültme/büyütme, yansıma, dönüş ve skew için invertibility kontrol edilmelidir.
- NaN, Infinity, aşırı büyük koordinatlar ve sıfır determinantlı matrisler validation aşamasında ele alınmalıdır.

### 5.5 Scene patch sistemi

Bütün sahneyi tekrar yazmak yerine aşağıdaki patch işlemleri desteklenmelidir:

- `addNode`
- `updateNode`
- `removeNode`
- `moveNode`
- `reparentNode`
- `setStyle`
- `setConstraint`
- `addKeyframe`
- `updateTimeline`
- `replaceAsset`
- `setViewport`

Her patch:

- Girdi ve hedef node sürümünü kontrol etmelidir.
- Başarısız olduğunda sahneyi kısmen bozmayacak biçimde atomik uygulanmalıdır.
- Undo/redo için ters işlem veya öncesi snapshot üretmelidir.
- Etkilenen bağımlılık düğümlerini işaretlemelidir.
- Gereksiz tam render tetiklememelidir.

### 5.6 Schema migration

Scene IR sürümleri açıkça numaralandırılmalıdır. Eski belge yeni sürümle açıldığında migration işlemi:

- Mümkünse deterministik olmalı.
- Kaybolacak veya anlamı değişecek özellikleri raporlamalı.
- Orijinal dosyanın yedeğini kullanıcı izniyle korumalı.
- Birden fazla migration ardışık çalıştığında test edilmelidir.
- Gelecek sürümün tanımadığı extension alanlarını varsayılan olarak silmemelidir.

## 6. Vector Engine: Geometri ve Path İşçiliği

### 6.1 Path Builder

Aşağıdaki operasyonlar tam testli API ile sunulmalıdır:

- Move, line, horizontal/vertical line, quadratic/cubic curve, smooth curve, elliptical arc ve close path.
- Çoklu subpath.
- Relative/absolute command dönüşümü.
- SVG path string parse etme ve serialize etme.
- Path segment listesi, eğri uzunluğu tahmini ve bounds hesabı.
- Path üzerinde `t` parametresinde nokta/tangent/normal hesabı.
- Eşit uzunlukta örnekleme ve path boyunca dağıtılmış öğeler.
- En yakın nokta ve mesafe hesabı.
- Path reverse, split, join ve subpath extraction.
- Degenerate segment tespiti.
- Hassasiyet toleransı ile flattening ve curve fitting.

### 6.2 Bézier kalite araçları

- Kontrol noktası düzenleme ve curve fitting.
- G0 (konumsal), G1 (teğetsel) ve uygun koşullarda G2 (eğrilik) süreklilik analizi.
- İki segment arasındaki açı sıçraması ve curvature spike tespiti.
- Kontrollü düğüm azaltma.
- Görsel sapma toleransını koruyarak daha az segment üretme.
- Düğüm yerleşimini eğriliğin fazla değiştiği bölgelere yoğunlaştırma.
- Simetrik, organik veya teknik eğriler için profil tabanlı fitting.
- Elle çizilmiş ve vektörleştirilmiş path'ler için smoothing; orijinal silüeti bozma sınırı.

### 6.3 Boolean ve topoloji

- Union, intersection, difference, XOR.
- Compound path ve hole/fill-rule yönetimi.
- Self-intersection tespiti.
- Segment intersection ve tangency analizleri.
- Açık/kapalı kontur kontrolü.
- Kontur yönleri ve winding kuralları.
- Numerik tolerans ve epsilon politikası.
- Degenerate polygon, neredeyse sıfır alan ve üst üste aynı segment tespiti.
- Offset sonucu kendiyle kesişen path'ler için repair stratejileri.
- İşlem başarısızlığında bozuk sonuç yerine tanımlı hata veya alternatif algoritma.

### 6.4 Offset ve stroke expansion

- İç/dış offset.
- Miter limit, bevel, round join.
- Butt, square, round cap.
- Kesik stroke, dash phase ve özel dash pattern.
- Genişlik profili değişen konturlar.
- Variable-width stroke'un fill path'e dönüştürülmesi.
- Ölçeğe duyarlı veya non-scaling stroke çıktısı.
- Offset sonrası geometrik hata toleransı ve self-intersection onarımı.
- Küçük boyutlarda görsel ağırlık koruma.

### 6.5 Geometrik kısıt çözücü

Kısıtlar node ilişkileri olarak tanımlanmalı ve mümkün olduğunca tekrarlanabilir çözülmelidir:

- Align left/right/top/bottom/center.
- Equal width/height/spacing.
- Fixed distance / fixed angle.
- Symmetry across axis or point.
- Tangency / parallelism / perpendicularity.
- Aspect ratio.
- Anchor-to-anchor attachment.
- Baseline, optical center ve safe area.
- Parent/child constraint.
- Responsive proportional constraint.
- Soft constraint ve hard constraint ayrımı.

Çözücü, çatışan constraint'ler varsa sessizce rastgele karar vermemeli; çözüm bulunamadığını, hangi kısıtların çatıştığını ve hangi soft constraint'in gevşetilebileceğini raporlamalıdır.

### 6.6 Optik düzeltme

Geometrik merkez ile optik merkez aynı olmak zorunda değildir. FastSVG opsiyonel optik düzeltme araçları sunmalıdır:

- Görsel kütle/alan dağılımı.
- Silüet centroid tahmini.
- Dikey/yatay optik merkez önerisi.
- Harf ve logo işaretlerinde optik overshoot.
- Farklı alan oranına sahip ikonlarda görsel ağırlık eşitleme.
- Pixel grid ve düşük çözünürlük hizalaması.

Bütün optik düzeltmeler varsayılan olarak öneri veya soft constraint olmalı; kullanıcı tasarımının matematiksel simetrisini habersiz bozmaz.

## 7. Renk, Gradient, Ton ve Malzeme Motoru

### 7.1 Renk modeli

Renk işlemleri için tek bir RGB interpolasyonu yeterli kabul edilmemelidir. En az sRGB, linear RGB ve OKLab/OKLCH gibi algısal yaklaşımlar için kontrollü destek tasarlanmalıdır. Dışa aktarımda hedef renderer'ın color-space davranışı belgelenmelidir.

### 7.2 Palette Engine

- Marka renklerini içeri alma ve tokenlaştırma.
- Ana/yardımcı/nötr/durum renk skalaları üretme.
- Ton ve parlaklık basamakları.
- Kontrast oranı hesaplama.
- Renk körlüğü simülasyonu için test çıktıları.
- Palet çeşitleri ve alternatif öneriler.
- Renk sıcaklığı dengesi.
- Renk dağılımı analizi.
- Mevcut marka renklerini koruma modu.
- Gradient içinde beklenmedik hue dönüşümü tespiti.

### 7.3 Gradient Studio

Desteklenecek işlevler:

- Linear ve radial gradient üretimi.
- Gradient transform ve coordinate mode yönetimi.
- Çoklu color stop yerleşimi.
- Stop aralığı ve geçiş eğrisi kontrolü.
- Algısal lineer interpolasyon.
- Alpha ramp ve transparency stop'ları.
- Çoklu radial highlight ve shadow katmanları.
- Gradient'i şekil, path, mask veya clipping ile sınırlandırma.
- Stop sayısını kalite hedefiyle dengeleme.
- Gradient stop simplification.
- Renk banding analizi.
- Tekrarlanabilir gradient preset'leri.
- Sahnede ışık yönüyle uyum kontrolü.
- Vektör standardının yetersiz kaldığı durumlar için mesh/raster fallback teklifi.

**Önemli:** SVG standardında desteklenmeyen veya hedef renderer'larda tutarsız çalışan bir efekt, saf SVG olarak varmış gibi sunulmamalıdır. FastSVG çıktıyı üretmeden önce hedef profilin yeteneklerini kontrol etmelidir.

### 7.4 Tone Mapping ve smoothness

- Highlights, midtones, shadows bölgelerini bağımsız değerlendirme.
- Gamma ve contrast dönüşümleri.
- Yumuşak ton eğrileri.
- Hızlı değişen luminance bölgelerini bulma.
- Banding ve ani renk geçişi tespiti.
- Gradient geçişlerinin komşu yüzeylerde tutarlı olması.
- Zorunlu olduğunda çok hafif dithering; gereksiz doku eklememe.
- Görseldeki renkleri kırpmadan önce gamut uyarısı.
- Renkli gölge ve çevresel yansıma araçları.
- İstenen stil “flat”, “mat”, “glossy”, “photoreal”, “editorial” gibi olduğunda doğru işlem profilini seçme.

### 7.5 Lighting Engine

Işık modelinin görsel yaklaşım düzeyleri ayrı olmalıdır:

1. **2D art direction:** Manuel highlight/shadow şekilleri ve kontrollü gradientler.
2. **2.5D:** Basit yüzey derinliği, ışık kaynağı ve normal tahmini.
3. **Hybrid raster:** Vektör şekillerinden maskeler oluşturup render sonrası blur, glow, ambient occlusion benzeri işlemler.
4. **Photoreal assist:** Dışarıdaki raster/vision modeliyle üretilen veya kullanıcıdan gelen dokunun, vector scene'e kontrollü bağlanması.

Desteklenecek araçlar:

- Işık kaynağı konumu ve türü.
- Ana ışık, dolgu ışığı ve rim light.
- Gölge yönü, yumuşaklığı, yayılımı ve opacity.
- Yansıma/highlight bölgeleri.
- Malzeme profilleri: mat, metal, cam, seramik, kumaş, plastik, taş, deri ve benzeri.
- Yüzey normali ve derinlik haritası kullanımı.
- Işık yönü tutarlılık denetimi.
- Gölge temas noktası ve nesnenin zemine oturması.
- Gölge örtüşme ve clipping kontrolü.
- Raster fallback durumunda kaynak çözünürlüğü ve büyütme uyarısı.

### 7.6 Malzeme ve doku

- Kontrollü noise, grain ve dither.
- Pattern tabanlı kumaş, çizgi, tarama veya yüzey dokusu.
- Yüzey roughness algısı için highlight spread.
- Metalik/seramik görünüm için kontrollü highlight gradientleri.
- Cam için şeffaflık, refraction benzeri yaklaşım ve kenar highlight'i.
- Gerçekçilik gerektiren dokular için opsiyonel bitmap katmanı.
- Kullanıcı özellikle istemedikçe yüzeye rastgele noise eklenmemesi.
- Doku tile seam testleri.
- Doku frekansının export boyutuna göre ayarlanması.

### 7.7 Photorealistic görünüm ve hibrit yaklaşım

FastSVG, yüksek gerçekçilik hedefini desteklemeli; ancak her fotogerçekçi görüntünün saf vektörle daha iyi üretileceğini varsaymamalıdır. Şu seçenekleri planlamalıdır:

- Vector-only: Maksimum düzenlenebilirlik ve ölçeklenebilirlik.
- Vector + embedded raster: Doku, fotoğraf ve karmaşık ışık bölgeleri için.
- Vector scene to frame render: Animasyon veya final görsel için kare tabanlı.
- Editable source + baked output: Kullanıcıya hem düzenlenebilir sahne hem optimize final çıktı sunulur.

Araç, kullanıcıya format kararını gerekçeli açıklamalı; saf vektör isteğinde raster içeriği gizlice gömmemelidir.

## 8. Logo ve Marka Varlığı Laboratuvarı

### 8.1 Logo üretim iş akışı

1. Marka adı, kullanım alanı ve referansları analiz et.
2. Wordmark, sembol, monogram veya kombinasyon türünü belirle.
3. Taslak geometrileri ve farklı kompozisyonları üret.
4. Grid, oran, negatif alan ve hizalamayı optimize et.
5. Optik düzeltme ve silüet okunabilirliğini kontrol et.
6. Palet ve tek renkli varyantları üret.
7. Küçük/büyük boyutlarda rasterize ederek test et.
8. Light/dark background ve tek renkli kullanımda kontrol et.
9. Animasyon gerekiyorsa statik master'a referansla timeline oluştur.
10. SVG kaynak, PNG preview, favicon/sprite ve varsa APNG çıktılarını üret.

### 8.2 Logo test matrisi

- 16, 24, 32, 48, 64, 128, 256 ve büyük sunum boyutu.
- Açık, koyu, tek renk, ters renk ve şeffaf arka plan.
- Blur/low-resolution thumbnail testi.
- Silüet-only testi.
- Negatif alanın kapanması veya birleşmesi.
- Font lisansı ve font'un outline'a çevrilip çevrilmediği.
- Minimum boşluk/safe-area doğrulaması.
- Optik ağırlık ve wordmark kerning analizi.
- Statik master ile animasyonun son/ilk kare tutarlılığı.

### 8.3 Marka sistemi

FastSVG yalnızca tek bir logo değil, ilgili varlık ailesini üretebilmelidir:

- Birincil logo.
- İkincil ve yatay/dikey varyantlar.
- Monogram ve app icon.
- Favicon ve küçük boyut optimize sürüm.
- Tek renkli sürümler.
- Açık/koyu zemin varyantları.
- Kullanım boşluğu ve minimum boyut metadatası.
- Logo motion yönergeleri.
- Renk tokenları ve font bilgileri.

Bu varyantlar bağımsız kopyalar yerine aynı kaynak sahne veya tanımlı varyant sistemiyle ilişkili olmalıdır.

## 9. Görsel İnce İşçilik Modülleri

### 9.1 Contour Lab

- Kontur pürüzlülüğü ölçümü.
- Kısa segment ve fazla anchor tespiti.
- Eğrilik sıçraması tespiti.
- Smooth/join operasyonları.
- Stroke ve fill birleşimleri.
- İnce konturun küçük boyutta kaybolma analizi.
- Kontur/arka plan kontrastı.
- Path simplification sonrası görsel fark raporu.

### 9.2 Composition Lab

- Ana odak noktası ve görsel ağırlık tahmini.
- Negatif alan ve boşluk dengesi.
- Katman örtüşme ilişkileri.
- Safe-area ve crop riski.
- Görsel denge ve eksen analizi.
- Çoklu boyutlarda kompozisyon tutarlılığı.
- Bir nesnenin ötekini istemeden örtmesi.
- Referansla göreli konum ve oranlar.

### 9.3 Shape Language Lab

- Köşe dili ve yarıçap tutarlılığı.
- Geometrik/organik kontur aileleri.
- Aile içi stroke tutarlılığı.
- Yuvarlaklık, keskinlik ve kontrast profili.
- İkon ailelerinde optik kütle.
- Karakter parçalarında stil uyumu.
- Rastgele şekil eklenmesini engelleyen semantik kurallar.

### 9.4 Raster-to-Vector

- Görüntü içeri alma ve normalize etme.
- Kenar ve bölge çıkarımı.
- Renk azaltma/quantization.
- Kontur takibi.
- Bézier fitting.
- Gürültü filtreleme.
- Katman tahmini.
- Birbirine giren alanlar ve delikler.
- Orijinal ile vektörleştirilmiş sonuç arasında silhouette/color/error ölçümü.
- Elle düzeltilebilir path ağı üretimi.
- Küçük ikon ve logo için agresif sadeleştirme; fotoğraflarda uygun olmayan sonuç uyarısı.

### 9.5 Referans Analizi

Görsel analiz modülü, kaynak görüntüyü doğrudan “kopyalanacak kod” olarak görmez. Şu özellikleri çıkarmaya çalışır:

- Görsel alan ve crop.
- Ana nesne ve alt bölgeler.
- Silüet ve sınırlar.
- Renk paleti ve luminance dağılımı.
- Katman/örtüşme ipuçları.
- Gradient yönleri ve highlight bölgeleri.
- Tipografi blokları.
- Simetri ve oranlar.
- Stil işaretleri.
- Belirsizlik ve düşük güvenli tahminler.

Analiz sonucunda `ReferenceAnalysis` oluşturulur. Bu sonuç kesin gerçek olarak değil, güven seviyeli öneriler olarak kullanılmalıdır. Kullanıcı referans sadakati istiyorsa benzerlik ölçümü daha ağır basar; özgün tasarım istiyorsa sadece yüksek seviyeli stil sinyalleri alınır.

## 10. Tipografi ve Harf Çizimi

- Font metadata ve lisans verisini inceleme.
- Font fallback ve eksik glif tespiti.
- Text shaping davranışını desteklenen renderer'a bırakma.
- Kerning, line height, letter spacing ve baseline hesapları.
- Font ağırlığı ve optik boyut varyasyonları.
- Text-on-path.
- Metin ölçme ve fit-to-box.
- Taşma, kesilme ve harf üst üste binmesi analizi.
- İstenirse metni outline/path'e dönüştürme.
- Outline çıktısında orijinal font metadata'sını koruma veya açıklama.
- Çok dilli yazılar ve sağdan sola metin için bidi davranışını test etme.
- Logotype harflerini node-level düzenleme.
- Metnin path'e çevrilmesi nedeniyle erişilebilirlik kaybı hakkında export uyarısı.

## 11. SVG Standardı, Import/Export ve Uyumluluk

### 11.1 SVG kapsamı

- `svg`, `g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`.
- `text`, `tspan`, text layout ve gerektiğinde outline export.
- `defs`, `symbol`, `use` ve sprite.
- Transformlar ve nested coordinate systems.
- Fill, stroke, opacity, currentColor ve CSS style.
- Linear/radial gradient, pattern.
- Clip path, mask ve filtreler.
- External/embedded image politikası.
- `viewBox`, preserveAspectRatio ve aspect ratio.
- Title/desc, role, `aria-*` metadata.
- SMIL/declared animation yalnızca hedef renderer desteklediği ölçüde.
- CSS/WAAPI ile dinamik web animasyonu için ayrı export profili.

### 11.2 Import davranışı

- XML parser güvenli ve limitli çalışmalıdır.
- DTD ve harici entity yükleme varsayılan olarak kapalı olmalıdır.
- Script, event handler, bilinmeyen `foreignObject` içeriği, external URL ve font yükleme için açık policy uygulanmalıdır.
- Import işlemi node sayısı, nesting depth, file size, filter area ve render budget sınırlarına tabi olmalıdır.
- Kullanılmayan `defs`, boş grup ve duplicate ID'ler tespit edilmelidir.
- Unknown element/attribute sessizce silinmemeli; preserve, warn veya reject politikası belgelenmelidir.
- Import sonrası capability raporu verilmelidir.

### 11.3 Export profilleri

- `svg-editable`: Semantik node'ları mümkün olduğunca koruyan SVG.
- `svg-optimized`: Tekrarlar azaltılmış, path ve attribute'lar sadeleştirilmiş SVG.
- `svg-compatible`: Belirlenen renderer/browser alt kümesine uygun SVG.
- `svg-static-fallback`: Animasyonlu içeriğin belirli bir zamandaki statik kareye indirilmiş sürümü.
- `svg-animated`: Hedef ortam destekliyorsa deklaratif SVG animasyonu.
- `web-animated`: HTML/CSS/WAAPI ile bağlı web animasyonu.
- `png-preview`: Tek kare raster çıktı.
- `apng`: Kare tabanlı animasyonlu PNG.
- `scene-json`: FastSVG sahne kaynağı.

Export raporu format kayıplarını, rasterize edilen alanları, font dönüşümünü ve desteklenmeyen özellikleri göstermelidir.

## 12. Motion Engine: Profesyonel Animasyon Sistemi

Animasyon, FastSVG'de yan özellik değil, bağımsız birinci sınıf motor olmalıdır. Amaç yalnızca elementlerin X/Y konumunu değiştirmek değil; tasarım dilini koruyan, zamanlaması kontrollü, akıcı, döngüleri pürüzsüz ve dışa aktarımı test edilmiş hareket üretmektir.

### 12.1 Ana animasyon kavramları

- Timeline ve nested timeline.
- Tracks ve property binding.
- Keyframes.
- Easing curves.
- Duration, delay, offset ve stagger.
- Loop, ping-pong, repeat count ve direction.
- Fill mode ve interpolation mode.
- Markers ve event triggers.
- Frame rate ve frame scheduling.
- Animation state machine.
- Motion path ve orientation.
- Scene/node transform animation.
- Morph animation.
- SVG attribute/CSS property animation.
- Frame-based render animation.

### 12.2 Timeline veri modeli

```ts
export interface Timeline {
  id: string;
  name: string;
  durationMs: number;
  timebase: number;
  loop: LoopConfig;
  tracks: AnimationTrack[];
  markers: TimelineMarker[];
  exportTargets: AnimationExportTarget[];
}

export interface AnimationTrack {
  id: string;
  targetNodeId: string;
  property: AnimatedProperty;
  interpolation: InterpolationMode;
  keyframes: Keyframe[];
}

export interface Keyframe {
  id: string;
  timeMs: number;
  value: AnimatableValue;
  easing?: EasingDefinition;
  hold?: boolean;
}
```

Bu örnek sözleşme mimari niyeti gösterir. Uygulamada her animatable property tipi tarafından doğrulanan discriminated union kullanılmalıdır; gelişigüzel `unknown` veya `any` kullanımı kabul edilmez.

### 12.3 Easing sistemi

- Linear.
- Cubic Bézier.
- Ease-in, ease-out, ease-in-out preset'leri.
- Steps / discrete transitions.
- Spring: mass, stiffness, damping, initial velocity.
- Damped oscillation.
- Overshoot/anticipation.
- Back, elastic ve bounce ailesi; uygun bağlamlarda kontrollü kullanım.
- Custom easing curve.
- Velocity continuity ve acceleration continuity analizleri.
- Easing grafik önizlemesi.
- Fiziksel easing'in farklı frame rate değerlerinde tutarlı örneklenmesi.
- Easing değerleri için clamp/extrapolation politikası.

Hazır easing preset'leri, sonuç üzerinde düşünülmeden her yere uygulanmamalıdır. Marka animasyonu, ürün UI hareketi, maskot animasyonu ve sinematik intro profilleri farklı hareket karakteri kullanabilmelidir.

### 12.4 Path animation

- Bir node'u path boyunca hareket ettirme.
- Path progress'in zamana göre kontrolü.
- Hareket yönüne göre tangent alignment.
- Rotate offset.
- Sabit hız / sabit parametre seçenekleri.
- Path boyunca spacing ile birden fazla node yerleştirme.
- Motion path'i zaman içinde değiştirme.
- Loop continuity.
- Path dışına çıkma ve self-intersection durumları için uyarı.

### 12.5 Path morphing

Path morph, animasyon sisteminin zor ve hataya açık alanlarından biridir. Aşağıdaki mekanizmalar olmalıdır:

- Başlangıç ve hedef path topolojisini analiz etme.
- Segment türlerini ortak temsile dönüştürme.
- Gerekli segmentleri kontrollü subdivide etme.
- Kapalı/açık path uyumluluğu kontrolü.
- Subpath yönü ve start point hizalama.
- Correspondence (eşleşen noktalar) üretimi.
- Birden fazla alternatif eşleme arasından düşük deformasyonlu olanı seçme.
- Morph sırasında alan çökmesi, ters dönme ve self-intersection tespiti.
- Sadece güvenli olduğu durumda otomatik morph; aksi halde crossfade, mask reveal veya shape replacement önerisi.
- Her ara karede geçerlilik/temporal quality testleri.

### 12.6 Stroke ve trim path animasyonları

- Çizginin uçtan uca çizilmesi.
- Dash offset ile stroke reveal.
- Path segment boyunca ilerleyen nokta.
- Kontur vurgulama.
- Logo outline reveal.
- Birden fazla path'in kontrollü sıralamayla çizilmesi.
- Başlangıç ve bitişte kusursuz reset.
- Çizim sırasını semantik önceliğe göre planlama.

### 12.7 Rig ve karakter animasyonu

- Bone/skeleton tanımı.
- Parent/child joint.
- IK/FK için ilk genişletilebilirlik.
- Anchor point ve pivot tanımları.
- Rig-to-vector shape binding.
- Skinning/deformation stratejisi.
- Göz kırpma, baş eğme, gövde hareketi ve basit mimik preset'leri.
- Parçalar arasındaki örtüşme ve z-order koruması.
- Rig deformasyonu sonrasında sınır/shape self-intersection kontrolü.
- Pozlar arasında tutarlılık testleri.

İlk sürümde tam 2D animasyon yazılımının her özelliğini kopyalamak zorunlu değildir; ama veri modeli bone, keyframe ve deformasyon özelliklerinin ileride eklenebilmesine uygun tasarlanmalıdır.

### 12.8 Motion graphics efektleri

- Reveal/wipe.
- Mask animation.
- Opacity/scale/rotation/position.
- Parallax ve katmanlı derinlik.
- Gradient stop animation.
- Color/tone animation.
- Glow, shadow ve blur animasyonu (renderer yeteneklerine göre).
- Repeater, stagger ve offset.
- Particle emitter: spawn rate, lifetime, velocity, acceleration, size, opacity, color.
- Procedural oscillation ve noise tabanlı hareket.
- Camera pan/zoom ve 2.5D parallax.
- Logo intro/outro ve seamless loop.
- SVG path morph ve shape transition.
- Frame-based motion blur/afterimage gibi raster ağırlıklı efektler.

### 12.9 Timing ve akıcılık

- Bütün süreler iç veri modelinde açık bir timebase ile temsil edilmelidir.
- Render örneklemesi sabit frame rate veya zaman damgası tabanlı çalışabilmelidir.
- Kare düşürme, subframe timing ve frame duration sapmaları raporlanmalıdır.
- Loop başlangıç ve bitişinde position, color, opacity ve ilgili property değerleri kontrol edilmelidir.
- Temporal flicker; komşu karelerde anlamsız renk, konum veya şekil sıçramalarını tespit etmeye çalışmalıdır.
- Motion blur gerektiğinde, render pipeline'ın desteklediği supersampling/temporal örnekleme kullanılmalıdır.
- Kullanıcı seçmeden 30/60 fps arasında kendiliğinden export profili değiştirilmemelidir.
- Reduced Motion tercihini web export'unda dikkate alan fallback üretilmelidir.
- Sürekli oynayan animasyonlarda pil/CPU ve render maliyeti göz önünde bulundurulmalıdır.

### 12.10 Animasyon preview ve editör araçları

CLI/MCP tabanlı ürünün bile animasyonu denetleyebilmesi için aşağıdaki araçlar bulunmalıdır:

- `preview_timeline`: düşük çözünürlüklü preview strip üretme.
- `render_frame`: belirli timestamp'teki kareyi üretme.
- `render_range`: aralıkta kare veya video render etme.
- `inspect_timing`: süre, overlap, easing ve marker raporu.
- `detect_loop_seam`: loop dikişi hatalarını tespit etme.
- `compare_frames`: iki veya daha fazla kareyi karşılaştırma.
- `analyze_temporal_stability`: flicker/jitter/tutarlılık analizi.
- `optimize_motion`: yalnızca güvenli ve ölçülebilir iyileştirme önerileri.
- `bake_animation`: animasyonu frame tabanlı export için hazırlama.
- `export_animation`: hedef format profiline göre dışa aktarma.

### 12.11 Animasyon export formatları

- **Animated SVG / SMIL:** Uyumlu SVG viewer/browser profilleri için.
- **HTML/CSS/WAAPI:** Web sayfalarında etkileşim ve kontrol gerektiren animasyonlar için.
- **APNG:** Şeffaflık ve kayıpsız kare tabanlı animasyon gereken durumlarda.
- **WebP / AVIF:** Kullanıcı ve hedef ortam seçtiğinde, encoder desteği mevcutsa.
- **GIF:** Eski sistem uyumluluğu istenirse; renk ve alpha sınırlamaları raporlanır.
- **PNG frame sequence:** Harici video/motion pipeline için.
- **MP4/WebM:** İsteğe bağlı video encoder adapter'ı varsa; bu, vektör formatından ayrı bir export katmanıdır.
- **Lottie JSON:** Yalnızca uyumlu property/feature subset'i için; unsupported özelliklerde uyarı ve capability raporu.

Bir formatın adı destekleniyor diye her efektin korunacağı varsayılmamalıdır. Export öncesi capability check zorunludur.

## 13. APNG Studio

APNG, FastSVG'nin animasyon teslim formatlarından biri olarak gerçek bir pipeline içinde desteklenmelidir.

### 13.1 İşlevler

- Timeline'dan kare üretme.
- Şeffaf arka planı koruma.
- Kare sürelerini tanımlama.
- Döngü sayısı ve sonsuz loop ayarı.
- Frame blend/disposal davranışlarını encoder abstraction'ı içinde yönetme.
- Delta frame optimizasyonu.
- Renk derinliği ve alpha korunumu.
- Poster/static fallback kare stratejisi.
- Dosya boyutu hedefi ve kalite profili.
- Hızlı preview ve final quality render ayrımı.
- Frame sequence ve APNG round-trip testleri.
- Çıktı metadata/animation kontrolü.

### 13.2 APNG üretim hattı

1. Scene IR ve timeline doğrulanır.
2. Frame rate, süre, canvas, scale ve background politikası belirlenir.
3. Kareler kontrollü render worker'larında üretilir.
4. Frame count ve timestamp listesi doğrulanır.
5. Gerekirse transparent/unchanged region analysis yapılır.
6. Encoder adapter'ı frame data'yı APNG'ye dönüştürür.
7. Çıktı decode edilir ve frame sayısı/süreleri tekrar kontrol edilir.
8. Başlangıç, orta ve bitiş karelerinin görsel testi yapılır.
9. Loop kullanılıyorsa son-ilk kare geçişi analiz edilir.
10. QA raporu ve kaynak timeline ile ilişkili çıktı teslim edilir.

### 13.3 APNG performans ve kalite

- Frame render işleri gerektiğinde paralel çalıştırılabilir; sıralı encoder'a teslim sırasında zaman sırası korunmalıdır.
- Büyük kareler için bellek bütçesi ve disk tabanlı ara frame saklama stratejisi bulunmalıdır.
- `width * height * frameCount` gibi kaba maliyet tahmini, encoder'ın gerçek bellek davranışını da düşünerek yapılmalıdır.
- Şeffaflık, alpha premultiplication ve renk uzayı hataları için test örnekleri olmalıdır.
- Frame delay rounding farkları raporlanmalıdır.
- APNG'ye çevrilmiş animasyonun vector kaynak kadar düzenlenebilir olmadığı, kaynak Scene IR'nin saklanmasıyla çözümlenmelidir.
- Normal PNG olarak açılan sistemlerde statik fallback davranışı hedef testlerle doğrulanmalıdır.

### 13.4 Animasyon formatı seçim yardımcısı

FastSVG `recommend_animation_export` aracıyla kullanım amacına göre format önerir:

- Düzenlenebilir ölçeklenebilir web animasyonu: animated SVG veya CSS/WAAPI.
- Şeffaf, kayıpsız, kare tabanlı animasyon: APNG.
- Küçük boyut/iyi renk verimliliği: uygun encoder varsa WebP/AVIF karşılaştırması.
- Eski uyumluluk: GIF, görsel kayıpları açıklanarak.
- Video timeline veya ses senkronu: video formatı adapter'ı.

## 14. Web Design Adapter: HTML/CSS ve SVG Birlikte

FastSVG öncelikle vektör ve animasyon motorudur; fakat AI'nin tasarım sırasında SVG ve web arayüzü arasında geçiş yapması için web adapter'ı sunmalıdır.

### 14.1 Yetenekler

- Var olan projede framework, stylesheet yöntemi, routing ve build tool tespiti.
- CSS/SCSS/Tailwind gibi sistemlerin analiz edilebilir adapter'ları.
- Design token çıkarma.
- SVG asset ve icon kullanımının analizi.
- Component tree ve DOM yapısı denetimi.
- Grid/Flex responsive düzen kontrolleri.
- Viewport ve breakpoint testi.
- Görsel taşma/overflow analizi.
- Tipografi ölçümleri.
- Contrast/accessibility testleri.
- Hover/focus/active/error/loading states denetimi.
- Motion/animation performance ve reduced motion değerlendirmesi.
- Ekran görüntüsü karşılaştırması.
- Patch tabanlı düzenleme ve diff üretimi.

### 14.2 Projeyi koruma ilkeleri

- Kullanıcı açıkça istemedikçe framework değiştirilmez.
- Proje dışındaki dosyalara erişilmez.
- Önce read-only inspection yapılır.
- Değişikliklerden önce snapshot/diff hazırlanır.
- Kullanıcı tarafından belirlenen tasarım tokenları önceliklidir.
- Kullanıcı referansına aykırı yeni renk veya stil eklenmez.
- Değişiklikler küçük patch'lerle uygulanır.
- Build ve test başarısızsa “tamamlandı” denmez.
- Dosya silme veya yeniden isimlendirme gibi yıkıcı işlemler onay gerektirir.

### 14.3 Anti-template web kalite denetimi

Web adapter aşağıdaki örüntüleri bağlama göre işaretleyebilir:

- Her sayfada aynı hero + üç kart + istatistik şeridi düzeni.
- Gereksiz gradient ve glow kullanımı.
- Hiyerarşisiz büyük başlık yığını.
- Aşırı kart/çerçeve ve yüzey katmanı.
- Birbiriyle uyuşmayan köşe yarıçapları.
- Sahte veya işlevsiz CTA.
- İçeriğe hizmet etmeyen ikon ve dekoratif grafikler.
- Mobilde gereksiz boşluk veya sıkışıklık.
- İkon fontu/emoji kullanımının marka diline uymaması.

Bunlar kesin hatalar değil, uyarı sinyalleridir. FastSVG değerlendirmeyi marka, kullanıcı isteği ve bağlamla birleştirmelidir.

## 15. Anti-AI-Slop Quality Engine

### 15.1 Ürün yaklaşımı

“AI slop” estetik ve bağlama bağlı bir kavramdır. FastSVG bu terimi otomatik, tek ölçütlü bir hakikat olarak kullanmamalı; gözlemlenebilir tasarım problemlerini ayrı kalite sinyallerine çevirmelidir.

### 15.2 Denetim alanları

- **Repetition:** Tekrarlayan layout, aynı ikon metaforu, aynı gradient ve aynı kart bileşeni.
- **Inconsistency:** Uyumsuz radius, stroke, shadow, typographic scale ve spacing.
- **Decoration noise:** İşlevsiz blur, glow, texture, floating shapes, excess borders.
- **Weak hierarchy:** Başlık, gövde, CTA ve görsel odak arasındaki dengesizlik.
- **Geometry defects:** Eğri birleşimi, taşma, yanlış hizalama, küçük parçaların birleşmesi.
- **Color defects:** Yetersiz kontrast, hue drift, ani gradient banding, aşırı doygunluk.
- **Temporal defects:** Jitter, flicker, yanlış easing, kötü loop seam, easing overshoot hataları.
- **Context mismatch:** Görsel stilin marka, kullanım alanı, içerik veya hedef kitleyle çelişmesi.
- **Unnecessary complexity:** Gereksiz DOM/SVG node, filter chain, fazla path segmenti ve ağır animasyon.
- **Accessibility defects:** Kontrast, text label, keyboard focus ve reduced motion eksikleri.

### 15.3 Kalite puanlaması

Tek bir genel skorun arkasında farklı alt skorlar tutulmalıdır:

- Technical validity.
- Geometry quality.
- Visual hierarchy.
- Color/tonal quality.
- Reference fidelity.
- Motion quality.
- Performance.
- Accessibility.
- Export compatibility.

Toplam skor yalnızca kullanıcı isterse verilmeli; alt skorlar ve gerekçeler her zaman erişilebilir olmalıdır. Kalite eşiği proje tipine göre yapılandırılır. Logo üretiminde geometri ve küçük boyut testi ağır basar; fotogerçekçi sahnede ton geçişleri ve referans benzerliği daha önemli olur; animasyonda temporal kalite ön plana çıkar.

### 15.4 Görsel kalite önerileri

Her uyarı şu alanları içermelidir:

- `ruleId`
- `severity`
- `confidence`
- `targetNodeIds`
- `region` (varsa)
- `evidence`
- `recommendedFix`
- `expectedImpact`
- `canAutoFix`
- `regressionRisk`

Otomatik düzeltme yalnızca güvenli, geri alınabilir ve test edilebilir işlemlerde yapılmalıdır. Düşük güvenli estetik kararlar öneri olarak kalmalıdır.

### 15.5 İnsan değerlendirmesi

Benchmark için profesyonel tasarımcıların kör karşılaştırmaları kullanılabilir. Değerlendirme formu şunları ayırmalıdır:

- Teknik doğruluk.
- Görsel okunabilirlik.
- Estetik tercih.
- Marka uyumu.
- Orijinallik.
- Referansa sadakat.
- Düzenlenebilirlik.

İnsan tercihi ile otomatik metrik arasındaki uyum ölçülmeli; otomatik skorlar insan yargısının mutlak yerine geçmemelidir.

## 16. MCP Tasarımı ve Araç Sözleşmesi

### 16.1 MCP stratejisi

FastSVG MCP, modelin her düşük seviyeli fonksiyonu ayrı ayrı çağırmasını gerektirmemelidir. Geniş ve karmaşık görevler için yüksek seviyeli pipeline araçları; dar düzenlemeler için uzmanlaşmış araçlar sunulmalıdır.

Üç kullanım seviyesi:

1. **High-level:** `fastsvg_design`, `fastsvg_animate`, `fastsvg_repair`, `fastsvg_export`.
2. **Domain-level:** `fastsvg_geometry_*`, `fastsvg_gradient_*`, `fastsvg_motion_*`, `fastsvg_quality_*`.
3. **Advanced/inspect:** Sahne node'ları, constraints, render range, capability matrix ve düşük seviyeli patch işlemleri.

İlk sürümde yüzlerce MCP tool'unu aynı anda yayınlamak yerine, açık isimlendirmeli, görev odaklı ve iyi dokümante edilmiş araç grupları tercih edilir. İç kütüphane işlevleri çok kapsamlı olabilir; public MCP yüzeyi ergonomik kalmalıdır.

### 16.2 İlk public MCP tool set'i

#### Temel proje ve sahne

- `fastsvg_get_capabilities`
- `fastsvg_doctor`
- `fastsvg_inspect_project`
- `fastsvg_create_scene`
- `fastsvg_import_asset`
- `fastsvg_get_scene_summary`
- `fastsvg_apply_patch`
- `fastsvg_undo`
- `fastsvg_redo`

#### Planlama ve tasarım

- `fastsvg_plan_design`
- `fastsvg_design`
- `fastsvg_generate_variants`
- `fastsvg_analyze_reference`
- `fastsvg_preserve_style`
- `fastsvg_compare_reference`

#### Geometri ve path

- `fastsvg_build_path`
- `fastsvg_fit_curve`
- `fastsvg_boolean_geometry`
- `fastsvg_offset_path`
- `fastsvg_simplify_path`
- `fastsvg_repair_path`
- `fastsvg_solve_constraints`
- `fastsvg_optical_align`

#### Renk ve malzeme

- `fastsvg_build_palette`
- `fastsvg_create_gradient`
- `fastsvg_analyze_gradient`
- `fastsvg_smooth_tones`
- `fastsvg_build_lighting`
- `fastsvg_apply_material`
- `fastsvg_audit_colors`

#### Tipografi ve logo

- `fastsvg_measure_text`
- `fastsvg_fit_text`
- `fastsvg_outline_text`
- `fastsvg_design_logo`
- `fastsvg_build_icon_family`
- `fastsvg_test_logo_sizes`

#### Render ve kalite

- `fastsvg_render_preview`
- `fastsvg_render_region`
- `fastsvg_validate_svg`
- `fastsvg_audit_visual_quality`
- `fastsvg_compare_render`
- `fastsvg_optimize_scene`
- `fastsvg_export_asset`

#### Animasyon

- `fastsvg_create_timeline`
- `fastsvg_add_keyframes`
- `fastsvg_build_easing`
- `fastsvg_animate_path`
- `fastsvg_morph_paths`
- `fastsvg_create_rig`
- `fastsvg_preview_animation`
- `fastsvg_render_animation_frames`
- `fastsvg_analyze_loop`
- `fastsvg_audit_temporal_quality`
- `fastsvg_export_animation`
- `fastsvg_export_apng`

#### Web adapter

- `fastsvg_inspect_web_project`
- `fastsvg_extract_design_tokens`
- `fastsvg_audit_responsive_layout`
- `fastsvg_audit_accessibility`
- `fastsvg_compare_web_screenshots`
- `fastsvg_apply_web_patch`

#### İş akışı

- `fastsvg_run_pipeline`
- `fastsvg_get_job_status`
- `fastsvg_cancel_job`
- `fastsvg_get_quality_report`

Bu isimler taslak API'dir. MCP tool description'ları kısa ama kesin olmalı; parametrelerin birimi, varsayılan değerleri, çıktı boyutu, side-effect ve gerekli izinler açıkça yazılmalıdır.

### 16.3 Tool tasarım kuralları

- Her tool tek bir iş veya açıkça tanımlanmış pipeline yapmalıdır.
- Parametre isimleri domain genelinde tutarlı olmalıdır.
- `width`, `height`, `durationMs`, `frameRate`, `tolerance`, `seed` gibi alanların birimleri açıkça tanımlanmalıdır.
- Belirsiz `options: object` mümkün olduğunca kaçınılmalıdır.
- Enum değerleri kapalı ve dokümante edilmiş olmalıdır.
- `dryRun` desteklenmesi uygun olan yıkıcı veya büyük işlemlerde eklenmelidir.
- Uzun işlerde job id, progress ve cancellation sağlamalıdır.
- Her output; başarılı sonuç, uyarılar, artifact references ve ölçümleri açıkça içermelidir.
- Büyük binary dosyaları gereksiz yere tool JSON çıktısına gömmek yerine güvenli artifact path/reference kullanılmalıdır.
- Tool çağrısı context'i aşırı büyütmemeli; uzun raporlar gerektiğinde ayrı resource/artifact olarak tutulmalıdır.
- Idempotent olmayan işlemler bu durumunu açıklamalıdır.
- Araçlar çağrı bütçesi ve maksimum render kaynaklarıyla sınırlandırılmalıdır.

### 16.4 MCP Resources ve Prompts

Resources:

- `fastsvg://capabilities`
- `fastsvg://docs/quickstart`
- `fastsvg://docs/scene-ir`
- `fastsvg://docs/animation`
- `fastsvg://docs/export-profiles`
- `fastsvg://design-rules/{profile}`
- `fastsvg://jobs/{jobId}/report`
- `fastsvg://projects/{projectId}/summary`

Prompt templates:

- `design_from_reference`
- `create_logo_system`
- `refine_svg_without_redesign`
- `create_seamless_animation`
- `create_apng_from_scene`
- `audit_anti_slop`
- `repair_svg_with_minimal_changes`
- `prepare_web_assets`

Prompt template kullanımı, modelin FastSVG araçlarını ne zaman kullanacağına dair yardım sağlar; garanti edilmiş model davranışı olarak kabul edilmez.

### 16.5 MCP cevap şablonu

Başarılı tool cevabı mümkün olduğunca şu yapıyı izlemelidir:

```json
{
  "ok": true,
  "operationId": "op_...",
  "summary": "Gradient geçişleri analiz edildi.",
  "artifacts": [],
  "warnings": [],
  "metrics": {},
  "nextActions": []
}
```

Hata cevapları `error.code`, `error.message`, `error.retryable`, `error.details` ve `operationId` alanlarını içermelidir. Secret, mutlak kullanıcı yolu veya kontrol edilmemiş SVG içeriği hata raporuna dökülmemelidir.

## 17. CLI ve SDK

### 17.1 CLI komutları

Önerilen komutlar:

```text
fastsvg doctor
fastsvg capabilities
fastsvg init [project-path]
fastsvg import <input-file>
fastsvg inspect <input-file>
fastsvg render <input-file> --out <output-file>
fastsvg validate <input-file>
fastsvg optimize <input-file> --out <output-file>
fastsvg animate <scene-file> --timeline <timeline-file>
fastsvg export apng <scene-file> --out <output.apng>
fastsvg test <project-path>
fastsvg benchmark [suite]
fastsvg mcp --transport stdio
```

CLI taslağıdır; gerçek argüman parser, exit code ve help text standardı ayrıca test edilmelidir.

### 17.2 Exit code sözleşmesi

- `0`: Başarı.
- `1`: Beklenmeyen iç hata.
- `2`: Parametre/şema hatası.
- `3`: Input veya format geçersiz.
- `4`: Özellik/renderer tarafından desteklenmiyor.
- `5`: İşlem zaman aşımı veya kaynak sınırı.
- `6`: İzin/erişim reddi.
- `7`: Export/encoder hatası.
- `8`: QA gate başarısız.

### 17.3 SDK ilkeleri

- `FastSvgClient` public API'si kararlı ve tipli olmalıdır.
- Her async işlem için AbortSignal/cancellation desteği.
- Timeout ve kaynak bütçesi seçenekleri.
- Structured errors.
- Streaming veya job polling gibi uzun iş mekanizmaları.
- Scene IR serialization ve schema validation.
- Renderer adapter injection.
- Testlerde gerçek diske bağımlılığı azaltan memory/temp adapter'ları.
- Breaking change için semver ve migration guide.

## 18. Kod Deposu ve Dosya Düzeni

Repo yapısı modüler, test edilebilir ve domain boundaries net olacak şekilde kurulmalıdır. Bir dosyaya bütün tipleri veya araçları yığmak yasaktır.

Önerilen monorepo:

```text
fastsvg/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── SUPPORT.md
├── CHANGELOG.md
├── ROADMAP.md
├── ARCHITECTURE.md
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── eslint.config.js
├── prettier.config.mjs
├── vitest.workspace.ts
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .npmrc
├── .changeset/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── release.yml
│   │   ├── security.yml
│   │   └── benchmark.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── apps/
│   ├── mcp-server/
│   ├── cli/
│   ├── docs-site/
│   └── playground/                 # Opsiyonel, çekirdekten bağımsız
├── packages/
│   ├── core/
│   ├── scene-ir/
│   ├── geometry-api/
│   ├── color-engine/
│   ├── gradient-engine/
│   ├── lighting-engine/
│   ├── vector-engine/
│   ├── motion-engine/
│   ├── render-api/
│   ├── renderer-resvg/
│   ├── renderer-browser/
│   ├── apng-exporter/
│   ├── export-svg/
│   ├── export-web/
│   ├── quality-engine/
│   ├── vision-adapter/
│   ├── web-adapter/
│   ├── mcp-contracts/
│   ├── sdk/
│   ├── asset-store/
│   ├── telemetry/
│   └── test-utils/
├── crates/
│   ├── fastsvg-geometry/
│   ├── fastsvg-path/
│   ├── fastsvg-color/
│   ├── fastsvg-render-adapter/
│   ├── fastsvg-apng-adapter/
│   └── fastsvg-wasm/               # Opsiyonel
├── schemas/
│   ├── scene-ir.schema.json
│   ├── tool-inputs.schema.json
│   ├── tool-outputs.schema.json
│   ├── timeline.schema.json
│   └── export-profile.schema.json
├── examples/
│   ├── icon-family/
│   ├── logo-motion/
│   ├── character-illustration/
│   ├── gradient-materials/
│   ├── seamless-apng/
│   └── responsive-web/
├── fixtures/
│   ├── svg-valid/
│   ├── svg-invalid/
│   ├── gradients/
│   ├── animation/
│   ├── apng/
│   └── reference-images/
├── benchmarks/
│   ├── geometry/
│   ├── rendering/
│   ├── animation/
│   ├── export/
│   └── visual-quality/
├── docs/
│   ├── product-requirements.md
│   ├── architecture/
│   ├── decisions/
│   ├── api/
│   ├── guides/
│   ├── security/
│   └── release/
└── scripts/
    ├── bootstrap.ts
    ├── verify-env.ts
    ├── generate-schemas.ts
    ├── check-dependency-boundaries.ts
    └── release-check.ts
```

### 18.1 Monorepo kuralları

- Her package kendi `package.json`, public entry point, testleri ve README'sine sahip olmalıdır.
- Importlar package public exports üzerinden yapılmalıdır; `src/internal` path'lerine dışarıdan doğrudan erişilmemelidir.
- Circular dependency yasaktır.
- `core` paketinin belirli bir renderer veya MCP SDK'sına bağımlı olması yasaktır.
- Renderer implementasyonları sadece `render-api` sözleşmesini uygular.
- MCP server doğrudan geometry algoritması uygulamaz; domain API'lerini çağırır.
- TypeScript ile Rust sınırı tek bir adapter katmanında tanımlanmalıdır.
- Generated files açıkça işaretlenir; el ile düzenlenmemelidir.
- Lockfile commit edilmelidir.
- Her package semver/changeset akışına dahil edilmelidir.

## 19. Kod Düzeni ve Kalite Standartları

### 19.1 Genel prensipler

- Okunabilirlik, tutarlılık ve güvenli değişiklik hızı mikro optimizasyondan önce gelir.
- Her modülün tek bir ana sorumluluğu olmalıdır.
- Pure computation ile I/O ayrılmalıdır.
- Hata durumları control-flow içinde açıkça ele alınmalıdır.
- `any`, gelişigüzel type assertion ve yutulan exception'lar yasaktır.
- Magic number'lar isimlendirilmiş sabit veya konfigürasyon olmalıdır.
- Public API'ler dokümante edilir.
- Fonksiyonlar mümkün olduğunca tek bir işi yapar; karmaşık pipeline'lar küçük, isimlendirilmiş adımlara bölünür.
- Her işlev için “neden bu algoritma?” sorusu cevaplanabilir olmalıdır.
- Yorumlar kodu tekrar etmemeli, tasarım kararının gerekçesini açıklamalıdır.
- Kullanıcı verisi doğrudan shell command veya HTML string'ine enjekte edilmemelidir.

### 19.2 TypeScript standartları

- `strict: true` zorunlu.
- `noUncheckedIndexedAccess: true` önerilir.
- `exactOptionalPropertyTypes: true` mümkün olduğu ölçüde etkin olmalıdır.
- ESM modül sistemi; CommonJS yalnızca zorunlu tooling adapter'larında.
- Public API'de açık input/output type'ları.
- `unknown` değerleri sınırda validate edilir ve sonra domain type'a dönüştürülür.
- `any` yalnızca gerekçeli adapter içinde, minimum alanda ve issue notuyla kullanılabilir.
- Promise rejection'ları kontrollü yakalanmalı; fire-and-forget işler yasaktır veya açıkly tracked olmalıdır.
- AbortSignal, timeout ve cancellation semantiği tutarlı olmalıdır.
- `console.log` production library kodunda kullanılmaz; logger adapter kullanılır.
- Saat, random, filesystem ve ağ bağımlılıkları test edilebilir adapter'larla soyutlanır.
- Domain modülleri HTTP, process env veya MCP'yi doğrudan okumaz.

### 19.3 İsimlendirme

- TypeScript değişken/fonksiyon: `camelCase`.
- Type/interface/enum: `PascalCase`.
- Sabitler: bağlama göre `camelCase` veya gerçek global sabitlerde `UPPER_SNAKE_CASE`; proje içinde tek standart seçilmelidir.
- Rust modül/fonksiyon: `snake_case`.
- Rust type/trait: `PascalCase`.
- Dosya adları: `kebab-case.ts` veya `snake_case.rs`, ekosistemin standartlarına göre.
- Tool isimleri: `fastsvg_<domain>_<verb>` veya MCP adı için onaylanan tek sözleşme; sürüm boyunca kararlı olmalı.
- Birim belirtilmeyen alan adları kullanılmamalıdır: `durationMs`, `frameRate`, `tolerancePx`, `angleDeg` gibi.

### 19.4 Dosya içi düzen

Bir TypeScript modülünün önerilen sırası:

1. Lisans veya gerekli header.
2. Dış bağımlılıklar.
3. İç bağımlılıklar.
4. Tipler.
5. Sabitler.
6. Public API.
7. Private helpers.
8. Error mapping veya adapter logic.

Dosya hem tool registration hem business logic hem serializer hem de I/O içeriyorsa ayrılmalıdır.

### 19.5 Fonksiyon boyutu ve modülerlik

Katı satır sınırı mutlak kurala dönüştürülmemeli; ancak çok iş yapan, çok fazla branch içeren ve test edilmesi güç fonksiyonlar ayrılmalıdır. Karmaşık algoritmalar:

- Girdi doğrulama.
- Ana hesaplama.
- Sonuç normalizasyonu.
- Post-condition doğrulama.
- Metrik/diagnostic üretimi.

şeklinde ayrılabilir.

### 19.6 TypeScript örnek stil

```ts
export interface RenderRequest {
  readonly scene: SceneDocument;
  readonly profileId: string;
  readonly outputScale: number;
  readonly signal?: AbortSignal;
}

export interface RenderResult {
  readonly artifactId: string;
  readonly width: number;
  readonly height: number;
  readonly durationMs: number;
  readonly warnings: readonly RenderWarning[];
}

export async function renderScene(
  request: RenderRequest,
  dependencies: RenderDependencies,
): Promise<Result<RenderResult, RenderError>> {
  const validation = validateRenderRequest(request);
  if (!validation.ok) {
    return err(validation.error);
  }

  const profile = dependencies.profiles.get(request.profileId);
  if (!profile) {
    return err({
      code: "RENDER_PROFILE_NOT_FOUND",
      message: `Unknown render profile: ${request.profileId}`,
      retryable: false,
    });
  }

  return dependencies.renderer.render({
    scene: request.scene,
    profile,
    outputScale: request.outputScale,
    signal: request.signal,
  });
}
```

Bu örnek, hata dönüşümünün açık, bağımlılıkların enjekte edilebilir ve input validasyonunun iş mantığından ayrı olması gerektiğini gösterir. Projenin ortak Result tipi tek bir yerde tanımlanmalıdır.

### 19.7 Rust standartları

- `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings` CI içinde çalışmalıdır.
- Public API'de gerekçesiz `unwrap()` veya `expect()` kullanılmamalıdır.
- FFI/N-API sınırında her input validate edilmelidir.
- Panic, kullanıcı verisi yüzünden process'i düşürmemelidir.
- Unsafe Rust yalnızca kaçınılmaz olduğunda; küçük, belgeli ve testli bloklarda kullanılmalıdır.
- Hata tipi domain bazlı enum olmalıdır.
- Bellek allocation ve büyük buffer yaşam döngüsü açık yönetilmelidir.
- Floating-point toleransları rastgele tek bir epsilon ile değil, algoritma ve birim ölçeğine göre tanımlanmalıdır.
- `f64`/`f32` seçimi benchmark, doğruluk ve target backend ile gerekçelendirilmelidir.
- Property-based test ve fuzzing özellikle parser, path ve Boolean operasyonlarında uygulanmalıdır.
- FFI panikleri kontrollü biçimde hata sonucuna çevrilmelidir.

### 19.8 Formatter, lint ve commit

- TypeScript için Prettier veya eşdeğer tek formatter.
- ESLint veya eşdeğer statik analiz.
- Rust için rustfmt/clippy.
- Markdown lint.
- Commit mesajları Conventional Commits veya benzer belgeli format.
- Pre-commit hook'ları hızlı kontrolleri yapabilir; tam CI'ın yerine geçmez.
- Formatter tarafından çözülebilen stil sorunları manuel tartışma konusu yapılmamalıdır.

### 19.9 Kod yorumları ve dokümantasyon

Yorum şu sorulardan en az birine cevap vermelidir:

- Bu algoritma neden seçildi?
- Bu edge case neden özel işleniyor?
- Bu fallback neden gerekli?
- Bu standard/renderer uyumsuzluğu neden var?
- Bu performans optimizasyonunun doğruluk ödünleşimi nedir?

Açık olan satırları tekrar eden yorumlar eklenmemelidir. Public API için örneklerle kullanım dokümantasyonu zorunludur.

## 20. Error Handling, Logging ve Observability

### 20.1 Hata modeli

Önerilen temel hata kategorileri:

- `INVALID_INPUT`
- `SCHEMA_VALIDATION_FAILED`
- `UNSUPPORTED_FEATURE`
- `GEOMETRY_OPERATION_FAILED`
- `CONSTRAINT_CONFLICT`
- `RENDER_FAILED`
- `ANIMATION_INVALID`
- `EXPORT_FAILED`
- `RESOURCE_LIMIT_EXCEEDED`
- `PERMISSION_DENIED`
- `DEPENDENCY_UNAVAILABLE`
- `TIMEOUT`
- `CANCELLED`
- `INTERNAL_ERROR`

Hata kodları sürümlenebilir olmalı; kullanıcı dostu mesaj ve makine okunabilir detay ayrı alanlarda tutulmalıdır.

### 20.2 Logging

- JSON structured log.
- Operation/job ID.
- Module, operation, duration ve result code.
- Varsayılan olarak hassas dosya içeriklerini loglamama.
- Verbosity seviyeleri.
- Local mode'da log rotasyonu veya boyut sınırı.
- Debug dump kullanıcı izni olmadan hassas render/input dosyalarını dışarı göndermemelidir.

### 20.3 Telemetry

- Telemetry varsayılanı gizlilik odaklı olmalıdır.
- Yerel temel kullanım için ağ bağlantısı zorunlu olmamalıdır.
- İsteğe bağlı telemetri açıkça anlatılmalı ve kapatılabilmelidir.
- İçerik, SVG path'leri, kullanıcı dosyaları veya prompt metni telemetriye dahil edilmemelidir.
- Hata raporu kullanıcı onayı ile paylaşılabilir.

## 21. Güvenlik ve Kaynak Yönetimi

### 21.1 Güven sınırı

FastSVG; kullanıcı tarafından yüklenen SVG, font, raster görsel, HTML/CSS ve harici asset'leri güvenilmeyen veri olarak kabul etmelidir.

### 21.2 SVG/XML güvenliği

- DTD ve external entity kapalı.
- Script ve inline event handler'lar güvenli modda reddedilir veya pasif olarak korunur ama çalıştırılmaz.
- External URL/image/font çağrıları default deny.
- `data:` URI boyut limitleri.
- Recursive reference ve `use` cycle kontrolü.
- Filter region, blur radius, node count ve nesting depth limitleri.
- Parser CPU ve memory budget.
- Gerektiğinde sandbox/proses izolasyonu.

### 21.3 HTML/browser güvenliği

- Render browser'ı kullanıcı profile/cookie'lerini kullanmamalıdır.
- Varsayılan olarak ağ erişimi kapalı veya allowlist tabanlı olmalıdır.
- File URL erişimi workspace ile sınırlandırılmalıdır.
- JavaScript çalıştırma policy'si render senaryosuna göre açıkça belirlenmelidir.
- İndirilen dosya ve dış asset'ler boyut/host/time limitlerine tabi olmalıdır.
- Screenshot ve browser artifact'leri kontrollü temp directory'de tutulup policy'ye göre temizlenmelidir.

### 21.4 Dosya sistemi ve workspace

- Varsayılan çalışma kökü kullanıcı tarafından seçilen workspace olmalıdır.
- Path traversal engellenmelidir.
- Symbolic link policy açık olmalıdır.
- Üzerine yazma öncesi var olan dosya ve izinler kontrol edilmelidir.
- Silme işlemi varsayılan olarak kapalı veya onaylı olmalıdır.
- Atomic write kullanılmalıdır.
- Temp dosyalar güvenli oluşturulmalı ve başarısız işlerde temizlenmelidir.
- Büyük çıktılar için disk kotası uygulanmalıdır.

### 21.5 Kaynak limitleri

- Maksimum input file size.
- Maksimum node count.
- Maksimum path segment count.
- Maksimum nesting depth.
- Maksimum filter region/pixel area.
- Maksimum animation duration ve frame count.
- Maksimum concurrent render jobs.
- Job timeout ve cancellation.
- Maksimum output file size.
- Bellek aşımında kontrollü iptal ve diagnostic raporu.

Limitler config üzerinden ayarlanabilir olmalı; fakat güvenli üst sınırlar kaldırıldığında uyarı verilmelidir.

## 22. Cache, Incremental Compute ve Performans

### 22.1 Cache türleri

- Parsed SVG tree cache.
- Scene normalization cache.
- Path bounds/length cache.
- Geometry operation cache.
- Font measurement cache.
- Gradient/palette cache.
- Render node/tile cache.
- Preview image cache.
- Animation frame cache.
- Asset decode cache.

### 22.2 Cache anahtarları

Anahtar yalnızca dosya adı veya node ID olmamalıdır. İçeriğin hash'i, ilgili parametreler, renderer sürümü, color profile, font state ve export profile hesaba katılmalıdır. Aynı node ID'ye sahip ama içeriği farklı olan sonuçlar yanlışlıkla paylaşılmamalıdır.

### 22.3 Invalidation

- Patch, etkilenen node ve dependency graph'ı belirlemeli.
- Parent transform değişikliği child world bounds ve render cache'lerini invalid etmeli.
- Palette token değişikliği ilgili style/render sonuçlarını invalid etmeli.
- Font değişikliği ölçüm ve text render cache'ini invalid etmeli.
- Timeline değişikliği yalnızca etkilenen frame range'ini invalid etmeye çalışmalı.
- Renderer sürümü değiştiğinde uygun cache namespace yenilenmelidir.

### 22.4 Paralellik

- Bağımsız geometri işleri paralel olabilir.
- Bağımlı scene patch'leri sıralı ve atomik olmalıdır.
- Frame rendering paralel olabilir; encoding sıralı tüketim gerektirebilir.
- Worker queue concurrency sınırlandırılmalıdır.
- Her job cancellation signal almalıdır.
- Aşırı paralellik nedeniyle bellek baskısı yaratılmamalıdır.

### 22.5 Performans raporu

Her benchmark en az şu verileri toplar:

- Hardware/OS/Runtime/renderer sürümü.
- Input scene boyutu ve karmaşıklığı.
- Cold/warm cache durumu.
- P50/P95/P99 süreleri.
- Peak memory.
- CPU time.
- Output size.
- Rendered pixel dimensions.
- Kalite farkı.
- Başarısız/timeout sayısı.

## 23. Test Stratejisi

### 23.1 Unit test

Pure algoritmalar için küçük, deterministik testler:

- Transform composition ve inversion.
- Path parse/serialize round trip.
- Bounds ve path length.
- Bézier split/merge.
- Gradient interpolation.
- Color conversions.
- Constraint solver.
- Easing functions.
- Timeline sampling.
- APNG timing calculation.
- Export profile normalization.

### 23.2 Property-based test

- Serialize → parse işlemlerinin round-trip davranışı.
- Transform inverse × transform ≈ identity.
- Boolean çıktılarının geçerliliği.
- Path simplification'ın tolerans sınırını koruması.
- Color conversion'ın tanımlı toleransta round-trip olması.
- Animation sample sonuçlarının sonlu ve aralıkta olması.
- APNG encoder/decoder frame count ve timing doğruluğu.

### 23.3 Fuzz test

Özellikle:

- SVG/XML parser.
- Path data parser.
- Gradient stop listeleri.
- Filter graph.
- Scene IR import.
- Animation keyframe verisi.
- APNG frame metadata.
- CLI argüman parser.

Fuzz testleri panic, sonsuz döngü, aşırı bellek, timeout ve güvenlik sorunlarını bulmalıdır.

### 23.4 Golden image test

- Sabit fixture + renderer sürümü + font seti + viewport ile render alınır.
- Pixel diff yanında perceptual diff ve edge diff uygulanabilir.
- Anti-aliasing farklılıkları için tolerance tanımlanır.
- Her baseline değişikliği inceleme gerektirir.
- Baseline görseller lisans ve kaynağı belli olacak şekilde tutulur.
- Her platformun pixel çıktısı farklıysa platform başına baseline veya normalize edilmiş metrik kullanılır.

### 23.5 Animation golden tests

- Başlangıç, orta, bitiş ve kritik event kareleri.
- Loop seam kare çifti.
- Path morph ara kareleri.
- Easing velocity grafikleri.
- Frame duration doğruluğu.
- Temporal flicker ölçümü.
- Alpha/premultiplication edge'leri.
- APNG decode sonrası frame karşılaştırması.

### 23.6 Integration test

- MCP client ile initialize/tools/list/tools/call akışı.
- İptal ve timeout.
- Renderer unavailable durumları.
- Native binary yokken fallback davranışı.
- Import → patch → render → export pipeline'ı.
- Project workspace izinleri.
- CLI exit code.
- APNG round-trip.
- Web adapter browser testleri.

### 23.7 Acceptance test

İlk ürün kabul senaryoları:

1. Basit geometrik logoyu üret ve geçerli SVG olarak dışa aktar.
2. Mevcut SVG'deki tek bir bozuk eğriyi diğer node'ları değiştirmeden düzelt.
3. Gradient banding riskini tespit et ve alternatif öner.
4. Aynı tasarım dilinde 12 ikon üret; grid ve stroke tutarlılığını raporla.
5. Bir logoya path reveal animasyonu uygula ve loop olmadan APNG üret.
6. Döngülü maskot animasyonunda seam kontrolünü çalıştır.
7. Bir web projesinde mevcut tema tokenlarını çıkar, overflow'u bul ve yalnızca gerekli dosyalara patch uygula.
8. Desteklenmeyen SVG özelliği için açık warning ver.
9. Güvenli olmayan harici bağlantı içeren SVG'yi varsayılan güvenli modda çalıştırma.
10. Büyük job'u iptal edince kaynakları serbest bırak ve tutarlı hata döndür.

## 24. Benchmark ve Değerlendirme Veri Kümesi

### 24.1 Kategori seti

- Temel geometri.
- İleri Bézier/path.
- Logo ve wordmark.
- İkon ailesi.
- Karakter ve maskot.
- Gradient/ton geçişi.
- Işık ve malzeme.
- SVG filtre ve maskeler.
- Rastgele ama geçerli SVG corpus'u.
- Bilerek bozuk SVG corpus'u.
- Kısa ve uzun animasyon.
- Path morph.
- APNG export.
- Responsive web page.
- Referans görselden vektörleştirme.
- Performans ve büyük dosya örnekleri.

### 24.2 Karşılaştırma yaklaşımları

- FastSVG kapalı temel model çıktısı.
- FastSVG açık araç akışı.
- Deterministik algoritmanın tek başına çıktısı.
- Gerekli olduğunda uzman insan üretimi veya onaylanmış referans.

### 24.3 Değerlendirme kuralları

- Benchmark örnekleri gizli tutulması gerekmiyorsa açık lisanslı veya izinli kaynaklardan gelmelidir.
- Görsel benzerlik tek başına özgün tasarım kalitesini ölçmez.
- Üretilen dosyanın düzenlenebilirliği ayrıca ölçülmelidir.
- İnsan değerlendirmesi kör ve mümkünse birden fazla değerlendiriciyle yapılmalıdır.
- Sonuçlar kategori, zorluk düzeyi ve renderer bazında raporlanmalıdır.
- Yalnızca en iyi örneklerin sergilenmesi yerine tüm test seti sonuçları raporlanmalıdır.

## 25. Kurulum, Paketleme ve Claude Entegrasyonu

### 25.1 Kurulum hedefi

Kullanıcı FastSVG'yi tek bir kontrollü kurulum akışıyla yüklemeli, `fastsvg doctor` ile test etmeli ve uygun MCP istemcisine bağlayabilmelidir.

Önerilen dağıtım seçenekleri:

- npm package ve yerel MCP server.
- Platforma özel standalone CLI binary.
- Opsiyonel remote MCP server, kimlik doğrulama ile.
- VS Code/IDE ve diğer MCP istemcileri için setup guide.
- Windows, macOS ve Linux kurulum testleri.

### 25.2 Kurulum akışı

1. OS, CPU architecture, Node runtime ve varsa native binary uyumluluğunu kontrol et.
2. Paket ve bağımlılık doğrulaması yap.
3. Renderer backend'lerinin erişilebilirliğini test et.
4. Kullanıcının seçtiği workspace/path izinlerini açıkla.
5. İstemci seçimi yap veya uygun yapılandırma dosyasını göster.
6. Yapılandırmayı yedekle.
7. MCP server tanımını ekle; sadece istenen bölümü değiştir.
8. Smoke test ile server başlat, capability endpoint/tool listesine eriş.
9. Örnek SVG render et.
10. Başarı/başarısızlık ve geri alma yönergesini göster.

### 25.3 Claude için önemli gerçeklik

Claude'un FastSVG'yi kullanabilmesi için uyumlu Claude ortamında MCP bağlantısının kurulması gerekir. Yerel Claude Code/Claude Desktop akışları ile Claude.ai'daki remote connector akışları aynı yapılandırma yöntemi olmak zorunda değildir. FastSVG, desteklenen ortamlar için ayrı kurulum rehberleri ve doğrulama testleri sağlamalıdır. MCP sunucusunun kurulmuş olması, modelin her prompt'ta her aracı otomatik çağıracağı anlamına gelmez; tool descriptions, prompt resources ve örnek akışlar araçların doğru zamanda çağrılmasını kolaylaştırır.

### 25.4 İstemci adapter matrisi

Her istemci için şu alanlar belgelenmelidir:

- Yerel `stdio` desteği.
- Remote HTTP/authorization desteği.
- Config formatı ve konumu.
- Tool discoverability limitleri.
- Dosya/artifact erişim modeli.
- Uzun işler ve cancellation davranışı.
- Kullanıcı tarafından onaylanması gereken izinler.
- Kurulum ve uninstall yönergeleri.

Bu matris gerçek istemci sürümleriyle test edilmelidir; tek bir genel “her yerde çalışır” iddiası kullanılmamalıdır.

## 26. API ve Yapılandırma

### 26.1 fastsvg.config.json

Önerilen yapılandırma:

```json
{
  "$schema": "./schemas/fastsvg.config.schema.json",
  "schemaVersion": 1,
  "runtime": {
    "mode": "local",
    "logLevel": "info",
    "maxConcurrentJobs": 2,
    "defaultTimeoutMs": 30000
  },
  "workspace": {
    "root": "./",
    "allowExternalPaths": false,
    "overwritePolicy": "confirm"
  },
  "render": {
    "defaultProfile": "balanced",
    "maxWidth": 4096,
    "maxHeight": 4096,
    "maxPixels": 16777216
  },
  "animation": {
    "defaultFrameRate": 60,
    "maxFrameCount": 1800,
    "maxDurationMs": 60000
  },
  "security": {
    "allowNetworkAssets": false,
    "allowSvgScripts": false,
    "maxInputBytes": 25000000,
    "maxSceneNodes": 100000
  },
  "telemetry": {
    "enabled": false
  }
}
```

Şema adresi örnekte workspace içindeki göreli dosyayı işaret eder. Gerçekte desteklenmeyen config alanları sessizce kabul edilmemeli; schema validation ile reddedilmelidir.

### 26.2 Config resolution

Öncelik sırası belgelenmelidir:

1. CLI parametreleri.
2. Workspace config.
3. User config.
4. Güvenli varsayılanlar.

Gizli değerler config dosyasına açık metinle yazılmamalıdır. İlk sürümde bulut modeli API key'i gerektirmeyen yerel temel işlevler desteklenmelidir.

### 26.3 Tool result artifact sistemi

Büyük çıktılar standartlaştırılmış artifact reference ile sunulmalıdır:

```ts
export interface ArtifactReference {
  readonly id: string;
  readonly kind: "svg" | "png" | "apng" | "json" | "html" | "report" | "frame-sequence";
  readonly name: string;
  readonly mediaType: string;
  readonly byteLength: number;
  readonly checksum: string;
  readonly workspaceRelativePath?: string;
  readonly previewArtifactId?: string;
}
```

Absolute path'ler tool çıktısında varsayılan olarak verilmemeli; workspace-relative path veya opaque artifact ID kullanılmalıdır.

## 27. Release ve Sürümleme Politikası

- SemVer veya açık bir release versioning politikası uygulanmalıdır.
- MCP tool adlarında breaking change dikkatle yönetilmelidir.
- Scene IR schema version, package version'dan bağımsız olarak yönetilebilir.
- Release candidate önce benchmark ve compatibility matrix'i çalıştırmalıdır.
- Native binaries platform başına build ve signature/checksum doğrulamasından geçmelidir.
- Changelog kullanıcıya dönük değişiklikleri anlatmalıdır.
- Security fix release'leri net işaretlenmelidir.
- Eski scene schema'ları için migration guide ve test fixtures saklanmalıdır.
- Geriye dönük uyumluluk kaldırılırsa bunun nedeni, migration ve etki sürüm notlarında açıklanmalıdır.

## 28. Dokümantasyon Gereksinimleri

Asgari dokümanlar:

- `README.md`: Ürün nedir, temel örnek, kurulum ve sınırlamalar.
- `AGENTS.md`: Kodlama ajanı için kesin çalışma talimatları ve tamamlanma kriterleri.
- `ARCHITECTURE.md`: Katmanlar, bağımlılık yönleri, veri akışı.
- `CONTRIBUTING.md`: Geliştirme ortamı, test, PR ve kod standardı.
- `SECURITY.md`: Güvenlik açığı bildirim süreci.
- `ROADMAP.md`: Sürüm bazlı gelişim.
- `docs/api/mcp-tools.md`: Bütün MCP tools ve schema referansları.
- `docs/api/scene-ir.md`: Scene IR alanları ve migration.
- `docs/guides/gradients.md`: Ton geçişleri ve renderer uyumluluğu.
- `docs/guides/motion.md`: Timeline ve easing.
- `docs/guides/apng.md`: Frame export ve APNG.
- `docs/guides/hybrid-rendering.md`: Vektör/raster kararları.
- `docs/guides/client-installation.md`: İstemci bazlı kurulum.
- `docs/testing/visual-regression.md`: Golden test üretimi ve onayı.
- `docs/decisions/`: Architecture Decision Records.

## 29. Architecture Decision Records (ADR)

Aşağıdaki kararlar uygulama başlamadan kısa ADR belgelerine dönüştürülmelidir:

1. Neden Scene IR, SVG string'inden daha üst düzey kaynak doğrusu seçildi?
2. Neden TypeScript MCP + Rust çekirdek ayrımı kullanılıyor?
3. Hangi renderer hangi SVG subset'ini destekliyor?
4. Native binary, N-API ve WASM arasında seçim nasıl yapılacak?
5. Renk interpolasyonu için hangi standart ve varsayılan profil kullanılacak?
6. Animasyon timeline'ının canonical timebase'i nedir?
7. APNG encoder adapter sözleşmesi nasıl olacak?
8. Hangi output formatları ilk sürümde garantili desteklenecek?
9. Telemetry ve local artifact storage politikası nedir?
10. Quality scores nasıl raporlanacak ve hangi metrikler kesin/öznel olarak ayrılacak?

Karar kayıtları tarih, bağlam, seçenekler, seçim, gerekçeler, sonuçlar ve yeniden değerlendirme koşullarını içermelidir.

## 30. Aşamalı Uygulama Planı

Bu yol haritası tüm vizyonu tek seferde uygulamak yerine, her aşamada test edilebilir ürün değeri sağlar.

### Faz 0 — Repo ve mühendislik zemini

Teslimatlar:

- Monorepo.
- Package boundaries.
- TypeScript/Rust toolchain.
- Lint, formatter, test ve CI.
- `AGENTS.md`, `ARCHITECTURE.md`, ADR template.
- Versioned schema setup.
- Security policy ve test fixtures.

Kabul şartları:

- Temiz checkout'tan bootstrap başarılı.
- CI format, lint, typecheck ve unit testleri çalıştırır.
- Circular dependency kontrolü vardır.
- Basit example package build edilir.

### Faz 1 — MCP ve statik SVG minimum çekirdeği

Teslimatlar:

- MCP server.
- `doctor`, `capabilities`, `create_scene`, `render_preview`, `validate_svg`, `export_svg`.
- Scene IR v1.
- Temel primitive ve path modeli.
- En az bir statik SVG renderer adapter'ı.
- CLI smoke test.

Kabul şartları:

- MCP initialize/tools list/tools call entegrasyon testi geçer.
- Basit sahne import/render/export round-trip testinden geçer.
- Desteklenmeyen SVG özellikleri raporlanır.
- Güvenli SVG parser limitleri uygulanır.

### Faz 2 — Geometri ve ince işçilik

Teslimatlar:

- Bézier API.
- Path parser/serializer.
- Bounds, transforms, hit testing.
- Curve fit/simplify.
- Boolean ve offset için adapter/algoritma.
- Constraint solver v1.
- Contour Quality Inspector.

Kabul şartları:

- Property tests ve fuzz tests.
- Geometri fixture corpus'u.
- Görsel regression örnekleri.
- Sadeleştirme sonrası tolerans testleri.

### Faz 3 — Renk, gradient ve malzeme

Teslimatlar:

- Color space utilities.
- Palette engine.
- Gradient Studio.
- Tone/banding analyzer.
- Basit lighting/material profiles.
- Export capability warnings.

Kabul şartları:

- Renk dönüşüm testleri.
- Gradient golden images.
- Target renderer farklılık raporu.
- Kullanıcı kontrolü olmadan stilin bozulmaması.

### Faz 4 — Logo, ikon ve referans iş akışları

Teslimatlar:

- Logo design pipeline.
- Icon family generator.
- Optical alignment helpers.
- Raster-to-vector v1.
- Reference analysis contract.
- Logo size matrix exporter.

Kabul şartları:

- Aynı ikon ailesinde tutarlılık ölçümü.
- Birden fazla boyutta okunabilirlik kontrolü.
- Orijinal kaynak ve varyantlar arasında ilişki korunur.

### Faz 5 — Motion Engine

Teslimatlar:

- Timeline/track/keyframe modeli.
- Easing library.
- Path animation.
- Opacity/transform/color animation.
- Preview strip ve `render_frame`.
- Loop seam analysis.

Kabul şartları:

- Timeline sampling deterministik.
- Frame rate ve keyframe timing testleri.
- Seamless loop test seti.
- Reduced motion ve web export notları.

### Faz 6 — APNG ve gelişmiş export

Teslimatlar:

- Frame render queue.
- APNG encoder adapter.
- Alpha/transparent output.
- Frame duration ve looping.
- Frame decode/round-trip testleri.
- Dosya boyutu ve performance report.

Kabul şartları:

- Çıktı gerçek APNG decoder ile okunur.
- Frame count ve timing doğrulanır.
- Alpha edge testleri geçer.
- Kaynak timeline saklanır ve export metadata'sı raporlanır.

### Faz 7 — Visual QA ve Anti-AI-Slop

Teslimatlar:

- Quality rule engine.
- Render diff ve local defect reports.
- Reference matching.
- Minimal repair planning.
- QA report format.
- Human benchmark harness.

Kabul şartları:

- Her rapor bulgusu evidence/target node içerir.
- Otomatik repair undo edilebilir.
- Uyarı ve gerçek hata ayrımı vardır.
- Benchmark sonuçları release ile kaydedilir.

### Faz 8 — Web adapter ve Claude onboarding

Teslimatlar:

- Proje inspection.
- Design token extraction.
- Browser screenshot pipeline.
- Responsive/overflow/accessibility audit.
- MCP client guides.
- Install/doctor flow.

Kabul şartları:

- Test fixture web projelerinde değişiklik diff'i üretilir.
- Framework istem dışı değiştirilmez.
- Test başarısızsa false success dönmez.
- İstemci bağlantı rehberleri gerçek sürümlerle doğrulanır.

### Faz 9 — Karakter rig, gelişmiş görsel ve plugin API

Teslimatlar:

- Rig/skeleton v1.
- Character layer constraints.
- Material/lighting gelişmiş profilleri.
- Particle/motion graphics altyapısı.
- Plugin API ve renderer adapter template'i.
- WASM veya platform fallback değerlendirmesi.

Kabul şartları:

- Her plug-in için capability declaration ve security review.
- Rig ve animation regression seti.
- Performans sınırları ve graceful degradation.

## 31. İlk Sürümde Kesinlikle Çalışması Gerekenler

Tüm vizyon uzun vadeli kapsamdır; ancak ilk kodlama oturumunda ürünün çalışan bir omurgası kurulmalıdır. MVP aşağıdakileri kapsamalıdır:

1. TypeScript tabanlı MCP server.
2. Temiz Scene IR v1.
3. Temel shape/path oluşturma.
4. SVG parser/serializer ve güvenli validation.
5. Bir statik render backend'i.
6. PNG preview ve SVG export.
7. Basit geometry/contour audit.
8. CLI `doctor`, `validate`, `render`, `export`.
9. Kapsamlı unit/integration testleri.
10. `AGENTS.md`, `README.md`, mimari ve kod standardı belgeleri.
11. Config, limitler ve hata sözleşmesi.
12. CI ve package build.

Bunlar stabil olmadan yüzlerce tool, gelişmiş AI vision entegrasyonu veya karmaşık karakter rig sistemi aynı anda uygulanmamalıdır.

## 32. Kodlama Ajanı İçin Kesin Uygulama Talimatı

Bu bölüm repo kökünde `AGENTS.md` içine uyarlanmalıdır.

### 32.1 Çalışma yöntemi

- İlk önce mevcut repo ve `package.json`/workspace yapılandırmasını incele.
- Var olan bir projede çalışıyorsan mevcut mimariyi ve testleri bozma; doğrudan tüm projeyi yeniden yazma.
- Bu belgede tarif edilen modülleri dependency boundaries ile kur.
- Önce çalışan ince bir dikey dilim oluştur: `create scene → render → validate → export`.
- Her fazı testleriyle bitir; sonraki faza başarısız testler bırakma.
- Kullanıcı tarafından istenmeyen bağımlılıkları veya cloud servislerini ekleme.
- Büyük bir özellik eklemeden önce ADR yaz.
- Algoritmayı placeholder fonksiyonla tamamlandı gibi gösterme.
- TODO bırakılabilir, ancak issue/roadmap referansı ve sınırlaması belirtilmelidir.
- Desteklenmeyen özellikler sahte şekilde başarı raporlamamalıdır.

### 32.2 Kod kalitesi

- `strict` TypeScript.
- `any` kullanımını önle.
- Tüm public API'ler tipli ve belgeli olsun.
- Fonksiyonların hata davranışı tanımlansın.
- I/O ile saf algoritmalar ayrı tutulsun.
- Testler yalnızca happy path'i değil, invalid input, edge case, cancellation ve limitleri de kapsasın.
- Her geometry veya color algoritmasında toleranslar açık olsun.
- `console.log` yerine structured logger.
- Dosyaya yazarken atomic write kullan.
- Kendi güvenlik parser'ını sıfırdan yazmak yerine sağlam ve bakımı sürdürülen parser'ları değerlendir.
- Dependency sürümleri sabitlenmeli ve lisansları kontrol edilmeli.

### 32.3 Tamamlanma tanımı (Definition of Done)

Bir özellik ancak şu koşullar karşılandığında tamamlanmış sayılır:

- İşlev gerçek bir implementation'a sahip.
- Public API ve schema güncel.
- Unit ve ilgili integration testleri mevcut.
- Geçersiz input ve sınır koşulları ele alınıyor.
- Hata mesajları anlaşılır ve makine tarafından işlenebilir.
- Performans/memory etkisi gerekiyorsa benchmark edilmiş.
- Güvenlik etkisi gözden geçirilmiş.
- Dokümantasyon ve örnekler güncel.
- CI geçiyor.
- Bilinen sınırlamalar açıkça yazılmış.
- Özellik unsupported path'lerde sessizce başarılı görünmüyor.

## 33. Ürün Kalitesi için Tasarım Kuralları

- Kaynak SVG olabildiğince düzenlenebilir ve semantik node'lar içeren yapıda kalır.
- Sadece dosyayı kısaltmak için tüm sahneyi anlamsız tek path'e dönüştürme; bu işlem ayrı bir export optimizasyon profili olabilir.
- Görsel doğruluğu bozmadan mümkün olan en az düğüm hedeflenir.
- Gradient, shadow, glow ve blur yalnızca tasarım hedefine katkıda bulunuyorsa kullanılır.
- Her nesnenin hangi amaçla var olduğu semantik metadata ile ifade edilebilir.
- Vektör ve raster katmanlar sahnede açıkça ayırt edilir.
- Animasyonun statik fallback'i anlamlı olmalı; yalnızca boş veya bozuk bir kare olmamalıdır.
- Hız optimizasyonu görünür kaliteyi bozuyorsa kullanıcıya profile göre seçenek sunulur.
- Büyük dosyalarda preview ve final render profilleri ayrılır.
- Çıktı dosyaları yanında gerekiyorsa kaynak Scene IR ve QA raporu da üretilir.

## 34. Örnek İş Akışları

### 34.1 Profesyonel logo

```text
fastsvg_plan_design
  -> brand constraints + output profile
fastsvg_design_logo
  -> symbol/wordmark/negative-space geometry
fastsvg_solve_constraints
  -> alignment and proportions
fastsvg_optical_align
  -> optical corrections
fastsvg_build_palette
  -> color variants
fastsvg_test_logo_sizes
  -> small-size and contrast matrix
fastsvg_audit_visual_quality
  -> defects and warnings
fastsvg_export_asset
  -> editable SVG + previews + report
```

### 34.2 Smooth gradient ve materyal

```text
fastsvg_analyze_reference
  -> palette, regions, highlights, shadows
fastsvg_create_gradient
  -> color-space and stop plan
fastsvg_build_lighting
  -> light direction and soft shadows
fastsvg_apply_material
  -> surface response
fastsvg_analyze_gradient
  -> banding and tonal continuity
fastsvg_render_preview
  -> actual output
fastsvg_audit_visual_quality
  -> fix evidence
fastsvg_export_asset
  -> SVG or hybrid profile
```

### 34.3 Kusursuz döngüye yakın logo animasyonu

```text
fastsvg_create_timeline
  -> duration, timebase, loop
fastsvg_add_keyframes
  -> transform, opacity, path progress
fastsvg_build_easing
  -> controlled velocity curve
fastsvg_preview_animation
  -> sample frames
fastsvg_analyze_loop
  -> first/last continuity
fastsvg_audit_temporal_quality
  -> jitter/flicker checks
fastsvg_render_animation_frames
  -> final frame sequence
fastsvg_export_apng
  -> APNG + QA report
```

### 34.4 Mevcut SVG'yi minimum değişiklikle düzeltme

```text
fastsvg_import_asset
  -> parse and preserve provenance
fastsvg_validate_svg
  -> syntax/capability warnings
fastsvg_render_preview
  -> baseline screenshot
fastsvg_audit_visual_quality
  -> localized findings
fastsvg_repair_path
  -> targeted patch
fastsvg_compare_render
  -> before/after diff
fastsvg_export_asset
  -> patched SVG + diff + report
```

## 35. Riskler ve Azaltma Planları

| Risk | Etki | Azaltma |
|---|---|---|
| Fazla kapsam nedeniyle projenin tamamlanamaması | Yüksek | Fazlara ayır, dikey çalışan dilim ve açık DoD uygula. |
| Renderer'lar arasında görsel fark | Yüksek | Capability matrix, ayrı golden baselines ve explicit fallback. |
| Animasyonlarda path morph artefaktları | Yüksek | Topoloji analizi, ara kare testi, güvenli fallback. |
| APNG bellek kullanımı | Orta/Yüksek | Frame budget, streaming/spooling, concurrency limitleri. |
| AI'nin araçları yanlış seçmesi | Orta/Yüksek | Kısa ve kesin tool descriptions, yüksek seviye pipeline, örnekler ve client testleri. |
| Anti-slop ölçümlerinin öznel kalması | Yüksek | Alt metrikler, açıklanabilir bulgular ve insan değerlendirmesi. |
| Saf vektör hedefiyle gerçekçilik hedefinin çatışması | Yüksek | Açık vector/hybrid profilleri ve format trade-off raporu. |
| Güvensiz SVG ve HTML input | Yüksek | Sandboxing, parser limitleri, external resource deny-by-default. |
| Çok fazla tool yüzeyi ve context tüketimi | Orta | High-level orchestration ve public API gruplaması. |
| Cache'in yanlış sonuç döndürmesi | Yüksek | Content-addressed keys, renderer/version metadata, invalidation tests. |
| Native binary kurulum sorunları | Orta | Platform matrix, checksums, health check ve fallback. |
| Aşırı otomatik düzeltme ile tasarımın bozulması | Yüksek | Minimal patch, confidence threshold, diff ve undo. |

## 36. Nihai Ürün Standardı

FastSVG aşağıdaki koşullar sağlanmadan “profesyonel üretim altyapısı” olarak kabul edilmemelidir:

- Modelin yalnızca kod yazmasına dayanmayan araç temelli iş akışı.
- Geometri ve Scene IR üzerinde deterministik düzenleme.
- SVG'nin gerçek renderer'da preview ve validation süreci.
- Gradient, renk, ton ve path işçiliği için özel araçlar.
- Animasyon için tam timeline/keyframe/easing modeli.
- APNG ve frame export için round-trip testleri.
- Görsel kalite ve temporal kalite raporu.
- HTML/CSS için ayrı, kontrollü adapter.
- Güvenli import, workspace izinleri, resource limits ve cancellation.
- Kod standardı, mimari dokümantasyon, CI ve Definition of Done.
- Gerçek benchmark verisi ve sürüm bazında raporlama.

## 37. Sonuç

FastSVG'nin temel vaadi, AI'ye yalnızca daha iyi çizim talimatları vermek değildir. Amaç, AI'nin profesyonel çizim yaparken ihtiyaç duyduğu **malzemeleri, ölçüm aletlerini, geometri ekipmanını, renk ve ışık araçlarını, animasyon stüdyosunu, render motorunu ve kalite kontrol laboratuvarını** tek bir düzenli altyapıda sağlamaktır.

Vektör çizimde tahmini azaltmak; path'leri matematikle kurmak, renk ve gradientleri uygun renk uzayında hesaplamak, ışık ve malzemeyi kontrollü temsil etmek, animasyonu zaman çizelgesinde yönetmek, frame'leri gerçek renderer ile üretmek ve sonucu test etmek anlamına gelir.

Gerçekçilik, düzenlenebilirlik, dosya boyutu, hız ve uyumluluk her zaman aynı anda maksimum olamayabilir. FastSVG bu ödünleşimleri gizlememeli; seçenekleri açıkça sunmalı ve çıktıyı ölçmelidir.

**Nihai yön:** Önce sağlam bir Scene IR + geometri + renderer + MCP çekirdeği; ardından gradient ve malzeme işçiliği; sonra tam zaman çizelgeli animasyon ve APNG; sonrasında görsel kalite/anti-slop denetimi ve web tasarımı adaptörü. Bu sırayla geliştirildiğinde FastSVG, yalnızca SVG kodu üreten bir tool değil, AI destekli profesyonel görsel üretimin temel ekipman katmanı olabilir.

---

## 38. Teknik Referanslar ve Standartlar

Aşağıdaki kaynaklar teknik doğrulama ve uygulama sırasında kontrol edilmelidir. Bu belge, standartların kapsamını özetler; kullanılan kütüphanelerin gerçek özellikleri sürüm ve renderer testleriyle doğrulanmalıdır.

1. W3C, **Scalable Vector Graphics (SVG) 2**: https://www.w3.org/TR/SVG2/  
2. W3C, **PNG Specification** (APNG'nin PNG ailesindeki çerçeveleme ve metadata bağlamı): https://www.w3.org/TR/png/  
3. Model Context Protocol, **Server Tools**: https://modelcontextprotocol.io/specification/2026-07-28/server/tools  
4. Model Context Protocol, **Transports**: https://modelcontextprotocol.io/specification/2026-07-28/basic/transports  
5. Anthropic, **Model Context Protocol documentation**: https://docs.anthropic.com/en/docs/mcp  
6. Anthropic Help Center, **Remote MCP server integrations**: https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers  
7. MDN, **Web Animations API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API  
8. MDN, **Image file type and format guide (APNG, SVG and animation formats)**: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types  
9. Rust `resvg` documentation: https://docs.rs/resvg/latest/resvg/  
10. Rust `kurbo` geometry documentation: https://docs.rs/kurbo/latest/kurbo/  

### Kaynak kullanım notu

- SVG, APNG, SMIL/CSS/WAAPI ve render motorlarının destek alanları birbirinden farklıdır; her export hedefi için capability tests zorunludur.
- MCP spesifikasyonu ve istemci davranışları zaman içinde değişebilir; release anında güncel resmi belgeler tekrar kontrol edilmelidir.
- Kütüphane seçimi yalnızca isim veya popülerlik üzerinden yapılmamalı; lisans, bakım, render kalitesi, performans ve test sonuçları değerlendirilmelidir.

---

**Belge sonu — FastSVG teknik şartnamesi ve uygulama planı.**

## 39. Bağımlılık Yönleri ve Mimari Sınırlar

Bağımlılıklar dıştan içe doğru akmalıdır. Domain çekirdeği, kullanıcı arayüzü ve transport detaylarını bilmemelidir.

```text
apps/mcp-server ─────┐
apps/cli ────────────┼──> packages/sdk / use-cases
apps/playground ────┘              |
                                   v
                           packages/core
                                   |
                   +---------------+----------------+
                   |               |                |
                   v               v                v
              scene-ir       geometry-api       motion-engine
                   |               |                |
                   +---------------+----------------+
                                   |
                         adapter contracts
                     +-------------+-------------+
                     |             |             |
                     v             v             v
                renderer-resvg renderer-browser apng-exporter
```

Kurallar:

1. `packages/core` MCP SDK'sını import edemez.
2. `packages/scene-ir` renderer implementasyonlarını import edemez.
3. Renderer adapter'ları yalnızca Scene IR ve renderer contract'larını kullanabilir; MCP request objelerini tanımamalıdır.
4. Domain paketleri `process.env`, `process.cwd()`, filesystem ve network'i doğrudan okumamalıdır. Bu özellikler adapter/port olarak enjekte edilmelidir.
5. `apps/*` composition root görevi görür: bağımlılıkları kurar, config'i okur, dış dünya ile konuşur.
6. `packages/*` reusable domain/library code taşır.
7. `crates/*` deterministik, benchmark edilen ve FFI sınırı açık olan çekirdek algoritmaları taşır.
8. Bir package başka bir package'ın private dosyasını import etmeye çalışırsa CI bunu reddetmelidir.
9. Yeni dependency eklenmeden önce lisans, güvenlik, bakım ve bundle/native etkisi değerlendirilmelidir.
10. Plugin'ler core'a özel-case eklemek yerine tanımlı interface uygular.

## 40. MCP Tool Şeması İçin Örnek Sözleşmeler

### 40.1 Tasarım isteği

```ts
export interface FastSvgDesignInput {
  readonly brief: string;
  readonly outputKind:
    | "logo"
    | "icon"
    | "illustration"
    | "diagram"
    | "animation"
    | "web-asset";
  readonly targetFormat: "svg" | "apng" | "png" | "html" | "scene-json";
  readonly fidelity: "concept" | "production" | "reference-match";
  readonly styleProfile?: string;
  readonly referenceArtifactIds?: readonly string[];
  readonly constraints?: readonly DesignConstraintInput[];
  readonly qualityProfile?: "fast" | "balanced" | "high";
  readonly seed?: number;
  readonly dryRun?: boolean;
}
```

Tool tanımı `brief` alanının tek başına sınırsız davranış yetkisi olmadığını açıkça belirtmelidir. `referenceArtifactIds` yalnızca mevcut oturum/workspace içinde izinli artifact'lere referans verebilir. `dryRun` true ise dosya yazımı yapılmadan plan ve tahmini maliyet döndürülmelidir.

### 40.2 Gradient oluşturma

```ts
export interface CreateGradientInput {
  readonly kind: "linear" | "radial";
  readonly coordinateSpace: "objectBoundingBox" | "userSpaceOnUse";
  readonly colorSpace: "srgb" | "linear-srgb" | "oklab" | "oklch";
  readonly stops: readonly GradientStopInput[];
  readonly transform?: Matrix2D;
  readonly opacity?: number;
  readonly targetNodeId?: string;
  readonly outputCapabilityProfile?: string;
}

export interface GradientStopInput {
  readonly offset: number;
  readonly color: ColorValue;
  readonly opacity?: number;
}
```

Validasyon kuralları: `offset` finite olmalı, [0, 1] aralığında bulunmalı veya açıkça normalize edilmelidir; stop sırası deterministikleştirilmelidir; alpha ve color parsing hataları kullanıcıya raporlanmalıdır. `oklab`/`oklch` interpolasyonu SVG export'unda doğrudan desteklenemiyorsa FastSVG seçilen profile göre ara stop sampling veya renderer-specific fallback uygulayabilir ve olası farkı raporlamalıdır.

### 40.3 Animasyon export

```ts
export interface ExportAnimationInput {
  readonly sceneId: string;
  readonly timelineId: string;
  readonly format: "svg-smil" | "web-waapi" | "apng" | "webp" | "avif" | "gif" | "png-sequence";
  readonly frameRate?: number;
  readonly startMs?: number;
  readonly endMs?: number;
  readonly loopCount?: number;
  readonly canvas?: {
    readonly width: number;
    readonly height: number;
    readonly scale: number;
    readonly background: "transparent" | "solid" | "scene";
    readonly backgroundColor?: ColorValue;
  };
  readonly qualityProfile?: "preview" | "balanced" | "final";
  readonly outputName?: string;
}
```

Export başlatılmadan önce kaynak timeline, format capability, render çözünürlüğü ve tahmini frame count kontrol edilmelidir. `endMs <= startMs`, negatif frame rate veya limit üstü frame count doğrulama hatası üretmelidir. Büyük işler job tabanlı yürütülebilir ve `fastsvg_get_job_status` ile takip edilebilir.

## 41. AGENTS.md İçin Tamamlayıcı Talimat Taslağı

Repo kökündeki `AGENTS.md`, bu ana planın kısa operasyonel özeti olarak tutulmalıdır. Ayrıntıların tamamı bu belgede ve `docs/` içinde kalır; ajan bu dosyaları okumadan mimariyi değiştirmemelidir.

Önerilen içerik:

```md
# FastSVG Agent Instructions

## Mission
Build FastSVG as a deterministic visual production toolkit for AI clients. It is not a prompt collection. Prefer typed geometry, Scene IR, real rendering, quality checks and small reversible patches over guessed SVG strings.

## Before changing code
1. Read README.md, ARCHITECTURE.md and the relevant docs/ pages.
2. Inspect package boundaries and existing tests.
3. Identify the smallest end-to-end slice for the requested feature.
4. Check supported renderer capabilities before promising a feature.

## Architecture rules
- Scene IR is the canonical editable source model.
- Domain packages must not depend on MCP, CLI, filesystem or browser APIs.
- All external I/O must pass through explicit adapters.
- Renderer capabilities and fallbacks must be explicit.
- Never silently discard unsupported SVG or animation features.
- Prefer local deterministic algorithms whenever a problem is mathematically computable.
- Keep vector and raster/hybrid output modes explicit.

## Code quality
- TypeScript strict mode is mandatory.
- Avoid `any`, unsafe casts, swallowed exceptions and magic numbers.
- Rust code must pass rustfmt and clippy with warnings denied.
- Add unit, edge-case and integration tests for new behavior.
- Use property tests/fuzzing for parsers, geometry and serialization boundaries.
- Do not commit secrets, user assets or generated build output.

## Rendering and visual changes
- Add or update golden images where visual output changes intentionally.
- Report renderer limitations and output differences.
- Keep existing source style unless the user explicitly requests a redesign.
- Use the smallest patch that addresses the defect.
- Provide before/after comparison or a quality report for visual repair.

## Security
- Treat SVG, XML, HTML, CSS, fonts and images as untrusted input.
- Do not enable scripts, external entities, external network assets or arbitrary file access by default.
- Enforce file-size, node-count, frame-count, timeout and memory limits.
- Use atomic writes and preserve existing files unless overwrite was requested.

## Completion criteria
A feature is done only when implementation, schema, tests, docs, error behavior and capability reporting are complete. Never claim a test, renderer or export format works unless it was actually verified.
```

## 42. Release Öncesi Go/No-Go Kontrol Listesi

Bir release adayı aşağıdaki kontrolleri geçmeden kararlı sürüm olarak yayınlanmamalıdır.

### Kod ve paketleme

- [ ] Temiz checkout'tan bootstrap/build çalışıyor.
- [ ] Typecheck, lint, formatter ve unit testler başarılı.
- [ ] Rust crates varsa fmt/clippy/test başarılı.
- [ ] Dependency boundary testleri başarılı.
- [ ] Package exports ve semver değişiklikleri kontrol edildi.
- [ ] Lockfile ve lisans raporu güncel.

### Görsel çıktı

- [ ] Statik SVG import/render/export smoke testleri başarılı.
- [ ] Golden-image regresyonları incelendi.
- [ ] Gradient, mask, filter ve text capability raporları güncel.
- [ ] Unsupported özellikler sessizce kaybolmuyor.
- [ ] Path optimizer görsel tolerans sınırını koruyor.

### Animasyon

- [ ] Timeline sampling testleri başarılı.
- [ ] Easing, keyframe ve path animation regression testleri başarılı.
- [ ] Loop seam analizi çalışıyor.
- [ ] Frame duration ve frame count doğrulanıyor.
- [ ] APNG encoder/decoder round-trip testi başarılı.
- [ ] Alpha, transparency ve büyük frame budget testleri başarılı.

### MCP ve kurulum

- [ ] MCP initialize ve tool discovery testleri başarılı.
- [ ] Her public tool için geçerli/invalid input testleri var.
- [ ] Cancellation ve timeout testleri başarılı.
- [ ] `fastsvg doctor` sonuçları anlaşılır.
- [ ] İstemci kurulumu ve uninstall yönergeleri denenmiş.
- [ ] Tool açıklamaları güncel ve parametreler açık.

### Güvenlik ve gizlilik

- [ ] Parser fuzz/safety testleri çalıştırıldı.
- [ ] Harici kaynak erişimi varsayılan policy ile doğrulandı.
- [ ] Path traversal ve overwrite testleri başarılı.
- [ ] Gizli veri loglanmıyor.
- [ ] Telemetry tercihi belgeli ve varsayılanı kapalı.
- [ ] Resource limits ve graceful cancellation doğrulandı.

### Dokümantasyon ve operasyon

- [ ] Changelog ve release note hazır.
- [ ] Bilinen sınırlamalar açıkça yazılmış.
- [ ] Benchmark sonuçları kaydedilmiş.
- [ ] Migration guide gerekiyorsa güncel.
- [ ] Örnek projeler release paketiyle uyumlu.

---

## 43. Kapanış Notu: Kapsamın Yönetimi

FastSVG'nin “her şeyi olan” bir araç olma hedefi, tek bir dev dosya ve birbirine bağlı binlerce fonksiyon yazılması anlamına gelmemelidir. Kapsamın genişliği, modüllerin ayrılığı, ortak Scene IR, açık capability sistemi, kararlı tool API'leri ve katı test standardı sayesinde yönetilebilir hale gelmelidir.

Kodlama ajanının önceliği görünüşte çok fazla özellik üretmek değil; her modülün gerçek, testli, ölçülebilir ve bir sonraki modüle güvenilir temel sağlayan bir uygulamasını teslim etmek olmalıdır. İlk sürümün başarısı, bütün vizyonun küçük ama gerçek bir dikey dilimde kanıtlanmasıyla başlar.

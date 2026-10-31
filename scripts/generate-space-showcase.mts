// FastSVG Uzay Temalı Dark OLED İnteraktif Slayt & Web Sitesi Üreticisi.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  create3DBox, create3DCylinder, render3DFaces,
  generateDonutChartSvg, generateSmoothAreaChartSvg, generateBarChartSvg, generateGaugeMeterSvg,
} from "@fastsvg/geometry";

// 1. 3D Uzay İstasyonu / Uydu Modülü (Isometric 3D)
const stationCore = create3DBox({
  width: 140,
  height: 60,
  depth: 140,
  center: { x: 0, y: 0, z: 0 },
  color: "#1e293b",
  topColor: "#38bdf8",
  frontColor: "#0284c7",
  sideColor: "#0369a1",
  strokeColor: "#0ea5e9",
  strokeWidth: 1.5,
});

const solarPanelLeft = create3DBox({
  width: 220,
  height: 6,
  depth: 60,
  center: { x: -190, y: 0, z: 0 },
  color: "#0f172a",
  topColor: "#3b82f6",
  frontColor: "#1d4ed8",
  sideColor: "#1e40af",
  strokeColor: "#60a5fa",
  strokeWidth: 1.2,
});

const solarPanelRight = create3DBox({
  width: 220,
  height: 6,
  depth: 60,
  center: { x: 190, y: 0, z: 0 },
  color: "#0f172a",
  topColor: "#3b82f6",
  frontColor: "#1d4ed8",
  sideColor: "#1e40af",
  strokeColor: "#60a5fa",
  strokeWidth: 1.2,
});

const communicationDome = create3DCylinder({
  radius: 35,
  height: 45,
  segments: 20,
  center: { x: 0, y: 45, z: 0 },
  color: "#0284c7",
  topColor: "#38bdf8",
  strokeColor: "#bae6fd",
  strokeWidth: 1.2,
});

const station3DSvg = render3DFaces(
  [...stationCore, ...solarPanelLeft, ...solarPanelRight, ...communicationDome],
  {
    projection: "isometric",
    scale: 0.9,
    center: { x: 300, y: 220 },
    rotation: { pitch: 25, yaw: 45, roll: 0 },
  },
  {
    position: { x: 0.6, y: 1, z: 0.8 },
    ambient: 0.4,
    diffuse: 0.8,
  },
).svgMarkup;

// 2. 3D Warp Reaktör Çekirdeği
const reactorRings = [
  ...create3DCylinder({ radius: 90, height: 20, segments: 24, center: { x: 0, y: -60, z: 0 }, color: "#4338ca", topColor: "#818cf8", strokeColor: "#c7d2fe" }),
  ...create3DCylinder({ radius: 75, height: 25, segments: 24, center: { x: 0, y: -10, z: 0 }, color: "#6366f1", topColor: "#a5b4fc", strokeColor: "#e0e7ff" }),
  ...create3DCylinder({ radius: 60, height: 30, segments: 24, center: { x: 0, y: 45, z: 0 }, color: "#7c3aed", topColor: "#c084fc", strokeColor: "#f3e8ff" }),
];

const reactor3DSvg = render3DFaces(
  reactorRings,
  {
    projection: "isometric",
    scale: 1,
    center: { x: 260, y: 200 },
    rotation: { pitch: 20, yaw: 35 },
  },
  { position: { x: 0.5, y: 1.2, z: 0.9 }, ambient: 0.45, diffuse: 0.85 },
).svgMarkup;

// 3. Veri Grafikleri
const telemetryDonut = generateDonutChartSvg({
  cx: 140,
  cy: 140,
  outerRadius: 110,
  innerRadius: 75,
  data: [
    { label: "Dark Matter Flux", value: 42, color: "#38bdf8" },
    { label: "Shield Buffer", value: 28, color: "#818cf8" },
    { label: "Quantum Thermal", value: 18, color: "#c084fc" },
    { label: "Antimatter Reserve", value: 12, color: "#f472b6" },
  ],
  centerText: { title: "99.4%", subtitle: "STABILITY" },
});

const gravitationalWave = generateSmoothAreaChartSvg({
  x: 20,
  y: 20,
  width: 500,
  height: 140,
  values: [30, 45, 25, 80, 50, 95, 60, 110, 85, 120, 90, 140],
  lineColor: "#38bdf8",
  fillColor: "rgba(56, 189, 248, 0.15)",
  dots: true,
});

const powerDistributionBars = generateBarChartSvg({
  x: 20,
  y: 20,
  width: 480,
  height: 140,
  data: [
    { label: "ION", value: 88, color: "#38bdf8" },
    { label: "WARP", value: 95, color: "#818cf8" },
    { label: "LIFE", value: 100, color: "#34d399" },
    { label: "SHIELD", value: 76, color: "#fbbf24" },
    { label: "COMMS", value: 92, color: "#a855f7" },
  ],
});

const warpGauge = generateGaugeMeterSvg({
  cx: 140,
  cy: 130,
  radius: 95,
  thickness: 18,
  value: 94.6,
  label: "WARP FACTOR 9.4",
  color: "#38bdf8",
});

// HTML Şablonunu İnşa Et
const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FASTSVG // ORBITAL DEEP SPACE MISSION</title>
  <style>
    :root {
      --bg-oled: #000000;
      --bg-card: rgba(13, 17, 23, 0.75);
      --border-card: rgba(56, 189, 248, 0.2);
      --border-pill: rgba(255, 255, 255, 0.15);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --cyan: #38bdf8;
      --indigo: #818cf8;
      --purple: #c084fc;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-oled);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    /* Yıldız Tozu & Uzay Efekti Arka Planı */
    .space-bg {
      position: fixed;
      inset: 0;
      background: 
        radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 20% 80%, rgba(192, 132, 252, 0.06) 0%, transparent 50%),
        #000000;
      z-index: 0;
      pointer-events: none;
    }
    .space-grid {
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      z-index: 1;
      pointer-events: none;
    }

    /* Üst Navigasyon Çubuğu (Cupertino Glass Pill) */
    header {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 48px;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-pill);
      padding: 8px 18px;
      border-radius: 9999px;
      backdrop-filter: blur(20px);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 12px #22c55e;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    .brand-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #ffffff;
    }

    /* Slayt Konteyneri */
    .deck-container {
      position: relative;
      z-index: 5;
      flex: 1;
      display: flex;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      width: 400vw;
      height: calc(100vh - 160px);
    }
    .slide {
      width: 100vw;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 60px;
    }
    .slide-content {
      width: 100%;
      max-width: 1380px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    /* Tipografi & Kartlar */
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--cyan);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.2px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 58px;
      font-weight: 900;
      line-height: 1.08;
      letter-spacing: -1.5px;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #ffffff 40%, var(--cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.lead {
      font-size: 18px;
      line-height: 1.6;
      color: var(--text-muted);
      margin-bottom: 32px;
      max-width: 520px;
    }
    .stat-row {
      display: flex;
      gap: 20px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-pill);
      padding: 18px 24px;
      border-radius: 18px;
      backdrop-filter: blur(30px);
      flex: 1;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .stat-val {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .stat-lbl {
      font-size: 11px;
      color: var(--cyan);
      letter-spacing: 1px;
      font-weight: 700;
    }

    /* Sağ Taraf SVG Sahnesi */
    .visual-panel {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, rgba(56, 189, 248, 0.05) 0%, transparent 70%);
      border-radius: 32px;
      padding: 24px;
    }
    .visual-panel svg {
      width: 100%;
      height: auto;
      max-height: 480px;
      filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.8));
    }

    /* Alt Gezinme Barı (Pill Controller) */
    footer {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 48px;
    }
    .nav-pills {
      display: flex;
      gap: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-pill);
      padding: 6px 16px;
      border-radius: 9999px;
      backdrop-filter: blur(20px);
    }
    .nav-dot {
      width: 32px;
      height: 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .nav-dot.active {
      background: var(--cyan);
      width: 56px;
      box-shadow: 0 0 14px rgba(56, 189, 248, 0.6);
    }
    .btn-controls {
      display: flex;
      gap: 12px;
    }
    .btn-pill {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-pill);
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(20px);
    }
    .btn-pill:hover {
      background: var(--cyan);
      color: #000000;
      border-color: var(--cyan);
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
    }
  </style>
</head>
<body>
  <div class="space-bg"></div>
  <div class="space-grid"></div>

  <!-- Header -->
  <header>
    <div class="brand-pill">
      <div class="status-dot"></div>
      <span class="brand-title">FASTSVG // ORBITAL STATION V0.4</span>
    </div>
    <div class="brand-pill">
      <span style="color: var(--cyan); font-size: 11px; font-weight: 700;">MISSION TIME: T+04:18:22</span>
    </div>
  </header>

  <!-- Slaytlar -->
  <div class="deck-container" id="deck">

    <!-- SLIDE 1: 3D Isometric Space Station -->
    <div class="slide">
      <div class="slide-content">
        <div>
          <div class="badge-pill">DEEP SPACE TELEMETRY</div>
          <h1>Orbital Space Station Alpha</h1>
          <p class="lead">FastSVG 3D izometrik ve Lambertian gölgeleme motoru tarafından gerçek zamanlı analitik yüzey normalleriyle çizilen 3D uzay üssü modülü.</p>
          <div class="stat-row">
            <div class="stat-card">
              <div class="stat-val">420 km</div>
              <div class="stat-lbl">YÖRÜNGE İRTİFASI</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">7.66 km/s</div>
              <div class="stat-lbl">YÖRÜNGE HIZI</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">100%</div>
              <div class="stat-lbl">GÜÇ DENGESİ</div>
            </div>
          </div>
        </div>
        <div class="visual-panel">
          <svg viewBox="0 0 600 450" width="100%">
            <!-- Radial Glow -->
            <circle cx="300" cy="220" r="180" fill="rgba(56, 189, 248, 0.12)" filter="blur(50px)"/>
            <!-- Orbital Rings -->
            <ellipse cx="300" cy="220" rx="270" ry="85" fill="none" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1.2" stroke-dasharray="6 6"/>
            <!-- 3D Station -->
            ${station3DSvg}
          </svg>
        </div>
      </div>
    </div>

    <!-- SLIDE 2: Warp Reactor Core (3D Cylinder Stacks) & Gauge -->
    <div class="slide">
      <div class="slide-content">
        <div>
          <div class="badge-pill">PROPULSION DYNAMICS</div>
          <h1>Warp Core & Reaction Chamber</h1>
          <p class="lead">FastSVG 3D parametrik silindir motoru ve Painter derinlik sıralaması ile oluşturulmuş kuantum reaktör çekirdeği.</p>
          <div class="stat-row">
            <div class="stat-card">
              <div class="stat-val">9.46 WF</div>
              <div class="stat-lbl">WARP FAKTÖRÜ</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">1.21 GW</div>
              <div class="stat-lbl">ÇIKIŞ GÜCÜ</div>
            </div>
          </div>
        </div>
        <div class="visual-panel">
          <svg viewBox="0 0 600 420" width="100%">
            <circle cx="300" cy="210" r="160" fill="rgba(129, 140, 248, 0.15)" filter="blur(45px)"/>
            ${reactor3DSvg}
            <g transform="translate(320, 190) scale(0.9)">
              ${warpGauge}
            </g>
          </svg>
        </div>
      </div>
    </div>

    <!-- SLIDE 3: Quantum Telemetry & Donut Chart -->
    <div class="slide">
      <div class="slide-content">
        <div>
          <div class="badge-pill">ANALYTICS ENGINE</div>
          <h1>Quantum Telemetry & Shielding</h1>
          <p class="lead">FastSVG infografik motorunun ürettiği pürüzsüz çok katmanlı Donut Chart ve kalkan kararlılık dağılımı.</p>
          <div class="stat-row">
            <div class="stat-card">
              <div class="stat-val">0.42 ms</div>
              <div class="stat-lbl">TELEMETRİ GECİKMESİ</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">Zero Loss</div>
              <div class="stat-lbl">PAKET DOĞRULUĞU</div>
            </div>
          </div>
        </div>
        <div class="visual-panel">
          <svg viewBox="0 0 540 380" width="100%">
            <circle cx="270" cy="190" r="140" fill="rgba(192, 132, 252, 0.12)" filter="blur(40px)"/>
            <g transform="translate(130, 50)">
              ${telemetryDonut}
            </g>
          </svg>
        </div>
      </div>
    </div>

    <!-- SLIDE 4: Gravitational Wave Sensors & Power Bars -->
    <div class="slide">
      <div class="slide-content">
        <div>
          <div class="badge-pill">SENSOR ARRAY</div>
          <h1>Gravitational Waves & Subsystems</h1>
          <p class="lead">Catmull-Rom'dan Cubic Bézier'e dönüştürülen dalga eğrisi ve yuvarlatılmış pill bar grafikleriyle canlı alt sistem izleme.</p>
          <div class="stat-row">
            <div class="stat-card">
              <div class="stat-val">140 Hz</div>
              <div class="stat-lbl">PULSAR REZONANSI</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">98.4%</div>
              <div class="stat-lbl">ORTALAMA GÜÇ</div>
            </div>
          </div>
        </div>
        <div class="visual-panel" style="flex-direction: column; gap: 20px;">
          <svg viewBox="0 0 540 180" width="100%">
            ${gravitationalWave}
          </svg>
          <svg viewBox="0 0 540 180" width="100%">
            ${powerDistributionBars}
          </svg>
        </div>
      </div>
    </div>

  </div>

  <!-- Footer Navigasyon -->
  <footer>
    <div class="nav-pills">
      <div class="nav-dot active" onclick="gotoSlide(0)"></div>
      <div class="nav-dot" onclick="gotoSlide(1)"></div>
      <div class="nav-dot" onclick="gotoSlide(2)"></div>
      <div class="nav-dot" onclick="gotoSlide(3)"></div>
    </div>
    <div class="btn-controls">
      <button class="btn-pill" onclick="prevSlide()">← ÖNCEKİ</button>
      <button class="btn-pill" onclick="nextSlide()">SONRAKİ →</button>
    </div>
  </footer>

  <script>
    let currentSlide = 0;
    const totalSlides = 4;
    const deck = document.getElementById("deck");
    const dots = document.querySelectorAll(".nav-dot");

    function updateDeck() {
      deck.style.transform = \`translateX(-\${currentSlide * 100}vw)\`;
      dots.forEach((d, i) => {
        d.classList.toggle("active", i === currentSlide);
      });
    }

    function gotoSlide(n) {
      currentSlide = Math.max(0, Math.min(totalSlides - 1, n));
      updateDeck();
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateDeck();
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      updateDeck();
    }

    // Klavye Kısayolları (Sol / Sağ / Space)
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    });
  </script>
</body>
</html>
`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/orbital-space.html", html, "utf8");
console.log("Orbital Space Showcase başarıyla oluşturuldu: docs/orbital-space.html");

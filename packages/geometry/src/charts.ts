// FastSVG Veri Görselleştirme & İnfografik Motoru.
// Sıfır bağımlılık: Donut/Pie chart, Smooth Area/Wave grafiği, Bar chart, Gauge meter ve Radar chart.

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartOptions {
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  data: ChartDatum[];
  strokeColor?: string;
  strokeWidth?: number;
  centerText?: { title: string; subtitle?: string; color?: string };
}

export interface SmoothAreaOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  values: number[]; // 0..100 veya normalize değerler
  lineColor?: string;
  fillColor?: string;
  fillGradientId?: string;
  strokeWidth?: number;
  dots?: boolean;
}

export interface BarChartOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  data: ChartDatum[];
  barRadius?: number;
  accentColor?: string;
  textColor?: string;
}

export interface GaugeOptions {
  cx: number;
  cy: number;
  radius: number;
  thickness: number;
  value: number; // 0..100
  label?: string;
  color?: string;
  trackColor?: string;
}

const DEFAULT_PALETTE = [
  "#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#fb7185",
  "#34d399", "#fbbf24", "#60a5fa", "#a78bfa", "#4ade80",
];

function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/**
 * Donut / Halka Grafik SVG Markup'ı üretir.
 */
export function generateDonutChartSvg(options: DonutChartOptions): string {
  const { cx, cy, outerRadius: rOut, innerRadius: rIn, data } = options;
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  if (total <= 0) return "";

  const parts: string[] = [];
  let currentAngle = -Math.PI / 2; // Saat 12 yönünden başla

  data.forEach((item, i) => {
    if (item.value <= 0) return;
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;

    const x1Out = cx + rOut * Math.cos(currentAngle);
    const y1Out = cy + rOut * Math.sin(currentAngle);
    const x2Out = cx + rOut * Math.cos(endAngle);
    const y2Out = cy + rOut * Math.sin(endAngle);

    const x1In = cx + rIn * Math.cos(currentAngle);
    const y1In = cy + rIn * Math.sin(currentAngle);
    const x2In = cx + rIn * Math.cos(endAngle);
    const y2In = cy + rIn * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const col = item.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];

    const d = `M ${round(x1Out)} ${round(y1Out)} A ${rOut} ${rOut} 0 ${largeArc} 1 ${round(x2Out)} ${round(y2Out)} L ${round(x2In)} ${round(y2In)} A ${rIn} ${rIn} 0 ${largeArc} 0 ${round(x1In)} ${round(y1In)} Z`;

    const strokeAttr = options.strokeColor ? ` stroke="${options.strokeColor}" stroke-width="${options.strokeWidth ?? 1}"` : "";
    parts.push(`  <path d="${d}" fill="${col}"${strokeAttr}><title>${escapeXml(item.label)}: ${item.value}</title></path>`);

    currentAngle = endAngle;
  });

  if (options.centerText) {
    const titleCol = options.centerText.color ?? "#ffffff";
    parts.push(`  <text x="${cx}" y="${options.centerText.subtitle ? cy - 4 : cy + 6}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="${titleCol}">${escapeXml(options.centerText.title)}</text>`);
    if (options.centerText.subtitle) {
      parts.push(`  <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94a3b8">${escapeXml(options.centerText.subtitle)}</text>`);
    }
  }

  return `<g class="donut-chart">\n${parts.join("\n")}\n</g>`;
}

/**
 * Pürüzsüz Alan / Dalga Grafiği (Smooth Spline Area Chart) üretir.
 */
export function generateSmoothAreaChartSvg(options: SmoothAreaOptions): string {
  const { x, y, width: w, height: h, values } = options;
  if (values.length < 2) return "";

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const pts: { x: number; y: number }[] = values.map((val, i) => {
    const px = x + (i / (values.length - 1)) * w;
    const py = y + h - ((val - minVal) / range) * (h * 0.85); // Üstten %15 pay bırak
    return { x: px, y: py };
  });

  // Bezier eğrisi hesaplama (Catmull-Rom to Cubic Bézier)
  let lineD = `M ${round(pts[0]!.x)} ${round(pts[0]!.y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1]! : pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = i < pts.length - 2 ? pts[i + 2]! : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    lineD += ` C ${round(cp1x)} ${round(cp1y)}, ${round(cp2x)} ${round(cp2y)}, ${round(p2.x)} ${round(p2.y)}`;
  }

  // Kapalı alan (Area fill)
  const areaD = `${lineD} L ${round(x + w)} ${round(y + h)} L ${round(x)} ${round(y + h)} Z`;
  const lineCol = options.lineColor ?? "#38bdf8";
  const fillCol = options.fillGradientId ? `url(#${options.fillGradientId})` : (options.fillColor ?? "rgba(56, 189, 248, 0.15)");

  const parts = [
    `  <path d="${areaD}" fill="${fillCol}"/>`,
    `  <path d="${lineD}" fill="none" stroke="${lineCol}" stroke-width="${options.strokeWidth ?? 3}" stroke-linecap="round"/>`,
  ];

  if (options.dots) {
    pts.forEach((p) => {
      parts.push(`  <circle cx="${round(p.x)}" cy="${round(p.y)}" r="4" fill="${lineCol}" stroke="#ffffff" stroke-width="1.5"/>`);
    });
  }

  return `<g class="smooth-area-chart">\n${parts.join("\n")}\n</g>`;
}

/**
 * Modern Yuvarlak Köşeli Çubuk Grafiği (Bar Chart) üretir.
 */
export function generateBarChartSvg(options: BarChartOptions): string {
  const { x, y, width: w, height: h, data } = options;
  if (data.length === 0) return "";

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const gap = 12;
  const barW = (w - (data.length - 1) * gap) / data.length;
  const r = options.barRadius ?? 6;
  const col = options.accentColor ?? "#3b82f6";
  const txtCol = options.textColor ?? "#94a3b8";

  const parts: string[] = [];

  data.forEach((item, i) => {
    const barH = Math.max(4, (item.value / maxVal) * (h - 28));
    const bx = x + i * (barW + gap);
    const by = y + h - 28 - barH;
    const barCol = item.color ?? col;

    // Arka plan rayı (Track)
    parts.push(`  <rect x="${round(bx)}" y="${round(y)}" width="${round(barW)}" height="${round(h - 28)}" rx="${r}" fill="rgba(255,255,255,0.05)"/>`);
    // Dolu çubuk
    parts.push(`  <rect x="${round(bx)}" y="${round(by)}" width="${round(barW)}" height="${round(barH)}" rx="${r}" fill="${barCol}"/>`);
    // Etiket
    parts.push(`  <text x="${round(bx + barW / 2)}" y="${round(y + h - 8)}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="${txtCol}">${escapeXml(item.label)}</text>`);
  });

  return `<g class="bar-chart">\n${parts.join("\n")}\n</g>`;
}

/**
 * Gösterge / Hız Kadranı (Gauge Meter) üretir.
 */
export function generateGaugeMeterSvg(options: GaugeOptions): string {
  const { cx, cy, radius: r, thickness: t, value } = options;
  const clampedVal = Math.max(0, Math.min(100, value));

  // 180 derecelik yarım daire arkı (sol yataydan sağ yataya)
  const startAngle = Math.PI;
  const endAngle = 0;
  const valAngle = startAngle - (clampedVal / 100) * Math.PI;

  const trackCol = options.trackColor ?? "rgba(255,255,255,0.1)";
  const col = options.color ?? "#38bdf8";

  // Dış ve iç arklar
  const rIn = r - t;
  const trackD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx + rIn} ${cy} A ${rIn} ${rIn} 0 0 0 ${cx - rIn} ${cy} Z`;

  const valXOut = cx + r * Math.cos(valAngle);
  const valYOut = cy - r * Math.sin(valAngle);
  const valXIn = cx + rIn * Math.cos(valAngle);
  const valYIn = cy - rIn * Math.sin(valAngle);

  const fillD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${round(valXOut)} ${round(valYOut)} L ${round(valXIn)} ${round(valYIn)} A ${rIn} ${rIn} 0 0 0 ${cx - rIn} ${cy} Z`;

  return `<g class="gauge-meter">
  <path d="${trackD}" fill="${trackCol}"/>
  <path d="${fillD}" fill="${col}"/>
  <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#ffffff">${Math.round(clampedVal)}%</text>
  ${options.label ? `<text x="${cx}" y="${cy + 16}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94a3b8">${escapeXml(options.label)}</text>` : ""}
</g>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

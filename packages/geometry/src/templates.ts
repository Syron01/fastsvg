// FastSVG Profesyonel Tasarım, Slayt, Web Hero ve Dashboard Kompozisyon Motoru.
// AI Vibe / Slop'u yok eden, Apple HIG / Pill-Centric Soft UI ve modern estetik standartlarında
// tek çağrıda tam SVG kompozisyonları (slaytlar, web hero, dashboard kartları, 3D izometrik şemalar).

import { create3DBox, render3DFaces } from "./threed.js";

export interface SlideOptions {
  width?: number;       // Varsayılan: 960
  height?: number;      // Varsayılan: 540 (16:9)
  title: string;
  subtitle?: string;
  badge?: string;       // Örn: "AI VECTOR ENGINE", "V0.3.1 ARCHITECTURE"
  theme?: "dark" | "light" | "glass" | "cyber";
  primaryColor?: string; // Ana vurgu rengi (örn: #3b82f6)
  cards?: Array<{
    title: string;
    description: string;
    value?: string;
    tag?: string;
  }>;
  with3DGraphic?: boolean; // Sağ tarafa 3D izometrik prizma grafiği ekler
}

export interface WebHeroOptions {
  width?: number;       // Varsayılan: 1200
  height?: number;      // Varsayılan: 675
  brandName: string;
  navLinks?: string[];
  headline: string;
  subheadline: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  theme?: "dark" | "light";
  primaryColor?: string;
}

export interface MetricCardOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  value: string;
  change?: string;     // Örn: "+24.8%"
  isPositive?: boolean;
  accentColor?: string;
  sparklineData?: number[];
}

/**
 * 16:9 Profesyonel Sunum / Slayt Kompozisyonu üretir.
 */
export function composeSlideSvg(options: SlideOptions): string {
  const w = options.width ?? 960;
  const h = options.height ?? 540;
  const isDark = options.theme !== "light";
  const primary = options.primaryColor ?? (isDark ? "#38bdf8" : "#0284c7");
  const bg = isDark ? "#090d16" : "#f8fafc";
  const textPrimary = isDark ? "#f8fafc" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.85)";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(226, 232, 240, 0.8)";

  // Gradient ID'leri
  const gradId = `slide_grad_${Math.floor(Math.random() * 10000)}`;

  let contentWidth = w - 120;
  if (options.with3DGraphic) {
    contentWidth = w * 0.55;
  }

  // 3D Grafik bloğu
  let graphicSvg = "";
  if (options.with3DGraphic) {
    const box1 = create3DBox({
      width: 140,
      height: 30,
      depth: 140,
      center: { x: 0, y: -60, z: 0 },
      color: primary,
      topColor: isDark ? "#60a5fa" : "#38bdf8",
      strokeColor: isDark ? "#93c5fd" : "#0284c7",
      strokeWidth: 1.5,
    });
    const box2 = create3DBox({
      width: 100,
      height: 30,
      depth: 100,
      center: { x: 0, y: 0, z: 0 },
      color: isDark ? "#818cf8" : "#6366f1",
      topColor: isDark ? "#a5b4fc" : "#818cf8",
      strokeColor: isDark ? "#c7d2fe" : "#4f46e5",
      strokeWidth: 1.5,
    });
    const box3 = create3DBox({
      width: 60,
      height: 30,
      depth: 60,
      center: { x: 0, y: 60, z: 0 },
      color: isDark ? "#c084fc" : "#a855f7",
      topColor: isDark ? "#e9d5ff" : "#c084fc",
      strokeColor: isDark ? "#f3e8ff" : "#9333ea",
      strokeWidth: 1.5,
    });

    const rendered = render3DFaces([...box1, ...box2, ...box3], {
      projection: "isometric",
      scale: 1,
      center: { x: w * 0.78, y: h * 0.52 },
      rotation: { pitch: 15, yaw: 35, roll: 0 },
    });
    graphicSvg = `
    <!-- 3D Isometric Architecture Visual -->
    <g id="visual_3d">
      <circle cx="${w * 0.78}" cy="${h * 0.52}" r="160" fill="url(#${gradId}_glow)" opacity="0.25" filter="blur(40px)"/>
      ${rendered.svgMarkup}
    </g>`;
  }

  // Kartlar
  let cardsSvg = "";
  const cards = options.cards ?? [];
  if (cards.length > 0) {
    const cardGap = 20;
    const cardW = (contentWidth - (cards.length - 1) * cardGap) / cards.length;
    const cardY = h - 170;
    const cardH = 110;

    cardsSvg = cards
      .map((c, i) => {
        const cx = 60 + i * (cardW + cardGap);
        return `
      <g id="card_${i}" transform="translate(${cx}, ${cardY})">
        <rect width="${cardW}" height="${cardH}" rx="14" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.2"/>
        ${c.tag ? `<rect x="16" y="14" width="${c.tag.length * 8 + 12}" height="20" rx="10" fill="${primary}" opacity="0.15"/>
        <text x="${22}" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="${primary}">${escapeXml(c.tag)}</text>` : ""}
        ${c.value ? `<text x="${cardW - 16}" y="32" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="${primary}">${escapeXml(c.value)}</text>` : ""}
        <text x="16" y="${c.tag || c.value ? 58 : 38}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="${textPrimary}">${escapeXml(c.title)}</text>
        <text x="16" y="${c.tag || c.value ? 80 : 64}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="${textSecondary}">${escapeXml(c.description)}</text>
      </g>`;
      })
      .join("");
  }

  const badgeSvg = options.badge
    ? `
    <!-- Top Pill Badge -->
    <rect x="60" y="50" width="${options.badge.length * 7.5 + 24}" height="26" rx="13" fill="${primary}" opacity="0.12"/>
    <rect x="60" y="50" width="${options.badge.length * 7.5 + 24}" height="26" rx="13" fill="none" stroke="${primary}" stroke-width="1" opacity="0.4"/>
    <circle cx="72" cy="63" r="3.5" fill="${primary}"/>
    <text x="82" y="67" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1" fill="${primary}">${escapeXml(options.badge)}</text>
    `
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="${gradId}_bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${isDark ? "#0f172a" : "#e2e8f0"}"/>
    </linearGradient>
    <radialGradient id="${gradId}_glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#${gradId}_bg)"/>
  
  <!-- Subtle Background Grid -->
  <g opacity="${isDark ? 0.08 : 0.04}" stroke="${isDark ? "#ffffff" : "#000000"}" stroke-width="1">
    <line x1="0" y1="${h * 0.25}" x2="${w}" y2="${h * 0.25}"/>
    <line x1="0" y1="${h * 0.5}" x2="${w}" y2="${h * 0.5}"/>
    <line x1="0" y1="${h * 0.75}" x2="${w}" y2="${h * 0.75}"/>
    <line x1="${w * 0.33}" y1="0" x2="${w * 0.33}" y2="${h}"/>
    <line x1="${w * 0.66}" y1="0" x2="${w * 0.66}" y2="${h}"/>
  </g>

  ${badgeSvg}

  <!-- Main Headline -->
  <text x="60" y="${options.badge ? 135 : 110}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" letter-spacing="-0.5" fill="${textPrimary}">
    ${escapeXml(options.title)}
  </text>

  <!-- Subtitle -->
  ${
    options.subtitle
      ? `<text x="60" y="${options.badge ? 180 : 155}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="${textSecondary}" width="${contentWidth}">
    ${escapeXml(options.subtitle)}
  </text>`
      : ""
  }

  ${graphicSvg}
  ${cardsSvg}
</svg>
`;
}

/**
 * Modern Web Landing Page Hero Section SVG'si üretir.
 */
export function composeWebHeroSvg(options: WebHeroOptions): string {
  const w = options.width ?? 1200;
  const h = options.height ?? 675;
  const isDark = options.theme !== "light";
  const primary = options.primaryColor ?? "#3b82f6";
  const bg = isDark ? "#0b0f19" : "#ffffff";
  const textPrimary = isDark ? "#ffffff" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#475569";
  const navLinks = options.navLinks ?? ["Features", "Architecture", "Benchmarks", "Docs"];

  const gradId = `hero_grad_${Math.floor(Math.random() * 10000)}`;

  // Navbar Links
  const navLinksSvg = navLinks
    .map((link, i) => {
      const x = w * 0.45 + i * 100;
      return `<text x="${x}" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="${textSecondary}">${escapeXml(link)}</text>`;
    })
    .join("");

  // 3D Card / App UI Window Mockup
  const cardW = 460;
  const cardH = 320;
  const cardX = w - cardW - 80;
  const cardY = 170;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="${gradId}_accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="${gradId}_surface" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${isDark ? "#1e293b" : "#f8fafc"}"/>
      <stop offset="100%" stop-color="${isDark ? "#0f172a" : "#f1f5f9"}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="${bg}"/>

  <!-- Ambient Glow -->
  <circle cx="${cardX + cardW / 2}" cy="${cardY + cardH / 2}" r="220" fill="url(#${gradId}_accent)" opacity="${isDark ? 0.2 : 0.12}" filter="blur(60px)"/>

  <!-- Navigation Bar -->
  <g id="navbar">
    <!-- Brand Logo & Name -->
    <rect x="80" y="36" width="28" height="28" rx="8" fill="url(#${gradId}_accent)"/>
    <text x="120" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="${textPrimary}">${escapeXml(options.brandName)}</text>
    
    <!-- Nav Links -->
    ${navLinksSvg}
    
    <!-- Right CTA Pill -->
    <rect x="${w - 190}" y="36" width="110" height="34" rx="17" fill="url(#${gradId}_accent)"/>
    <text x="${w - 135}" y="58" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Get Started</text>
  </g>

  <!-- Hero Content Left -->
  <g id="hero_left">
    <!-- Release Pill Badge -->
    <rect x="80" y="180" width="180" height="28" rx="14" fill="${primary}" opacity="0.12"/>
    <text x="170" y="198" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="${primary}">FASTSVG V0.3.1 READY</text>

    <!-- Main Headline -->
    <text x="80" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="-1.5" fill="${textPrimary}">
      ${escapeXml(options.headline)}
    </text>

    <!-- Subheadline -->
    <text x="80" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="${textSecondary}">
      ${escapeXml(options.subheadline)}
    </text>

    <!-- Action Buttons -->
    <g id="buttons" transform="translate(80, 400)">
      <!-- Primary Pill Button -->
      <rect x="0" y="0" width="160" height="48" rx="24" fill="url(#${gradId}_accent)"/>
      <text x="80" y="29" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#ffffff">${escapeXml(options.primaryCtaText ?? "Deploy Now")}</text>

      <!-- Secondary Glass Button -->
      <rect x="180" y="0" width="160" height="48" rx="24" fill="${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}" stroke="${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}" stroke-width="1.2"/>
      <text x="260" y="29" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="${textPrimary}">${escapeXml(options.secondaryCtaText ?? "Documentation")}</text>
    </g>
  </g>

  <!-- UI Mockup Window Right -->
  <g id="ui_mockup" transform="translate(${cardX}, ${cardY})">
    <!-- Window Shadow & Frame -->
    <rect width="${cardW}" height="${cardH}" rx="20" fill="url(#${gradId}_surface)" stroke="${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}" stroke-width="1.5"/>
    
    <!-- Window Controls -->
    <circle cx="28" cy="24" r="5" fill="#ef4444"/>
    <circle cx="44" cy="24" r="5" fill="#eab308"/>
    <circle cx="60" cy="24" r="5" fill="#22c55e"/>

    <!-- Mini Dashboard Panels inside Window -->
    <rect x="24" y="56" width="${cardW - 48}" height="70" rx="12" fill="${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"}" stroke="${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}"/>
    <text x="44" y="86" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="${textSecondary}">VECTOR ENGINE LATENCY</text>
    <text x="44" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="${primary}">0.42 ms <tspan font-size="13" font-weight="600" fill="#22c55e">(-84%)</tspan></text>

    <!-- Sparkline inside Mockup -->
    <path d="M 280 110 Q 320 70 360 95 T 410 75" fill="none" stroke="${primary}" stroke-width="2.5" stroke-linecap="round"/>

    <!-- Secondary Mini List -->
    <rect x="24" y="142" width="${(cardW - 60) / 2}" height="140" rx="12" fill="${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"}"/>
    <text x="40" y="172" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="${textPrimary}">3D Isometric</text>
    <text x="40" y="196" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="${textSecondary}">Full Z-Depth Sort</text>

    <rect x="${24 + (cardW - 60) / 2 + 12}" y="142" width="${(cardW - 60) / 2}" height="140" rx="12" fill="${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"}"/>
    <text x="${40 + (cardW - 60) / 2 + 12}" y="172" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="${textPrimary}">Delta APNG</text>
    <text x="${40 + (cardW - 60) / 2 + 12}" y="196" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="${textSecondary}">fcTL Sub-frame</text>
  </g>
</svg>
`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

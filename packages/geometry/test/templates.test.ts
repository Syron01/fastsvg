import test from "node:test";
import assert from "node:assert/strict";
import { composeSlideSvg, composeWebHeroSvg } from "../src/index.js";

test("composeSlideSvg: Profesyonel slayt şablonu oluşturma", () => {
  const svg = composeSlideSvg({
    title: "Vektörel AI Mimarisi",
    subtitle: "AI modellerinin doğrudan matematiksel koordinatlarla çizim yapması",
    badge: "FASTSVG V0.3.1",
    theme: "dark",
    with3DGraphic: true,
    cards: [
      { title: "Sıfır Bağımlılık", description: "Tamamen saf TypeScript", value: "0 deps" },
      { title: "Yüksek Hız", description: "Milisaniseler mertebesinde render", value: "<1ms" },
    ],
  });

  assert.ok(svg.includes("<svg"));
  assert.ok(svg.includes("Vektörel AI Mimarisi"));
  assert.ok(svg.includes("FASTSVG V0.3.1"));
  assert.ok(svg.includes('id="visual_3d"'));
  assert.ok(svg.includes('id="card_0"'));
  assert.ok(svg.includes("</svg>"));
});

test("composeWebHeroSvg: Landing page hero section oluşturma", () => {
  const svg = composeWebHeroSvg({
    brandName: "FastSVG",
    headline: "AI Vektör Motoru",
    subheadline: "Piksel ve eğrileri tahmin etme, hesapla.",
    primaryCtaText: "Şimdi Başla",
    theme: "dark",
  });

  assert.ok(svg.includes("<svg"));
  assert.ok(svg.includes("FastSVG"));
  assert.ok(svg.includes("AI Vektör Motoru"));
  assert.ok(svg.includes('id="navbar"'));
  assert.ok(svg.includes('id="ui_mockup"'));
});

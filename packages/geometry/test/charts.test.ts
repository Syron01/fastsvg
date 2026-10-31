import test from "node:test";
import assert from "node:assert/strict";
import {
  generateDonutChartSvg,
  generateSmoothAreaChartSvg,
  generateBarChartSvg,
  generateGaugeMeterSvg,
} from "../src/index.js";

test("generateDonutChartSvg: Dilimler ve merkez metin üretir", () => {
  const svg = generateDonutChartSvg({
    cx: 100,
    cy: 100,
    outerRadius: 80,
    innerRadius: 50,
    data: [
      { label: "Vector", value: 45 },
      { label: "3D", value: 30 },
      { label: "Motion", value: 25 },
    ],
    centerText: { title: "100%", subtitle: "Coverage" },
  });

  assert.ok(svg.includes("donut-chart"));
  assert.ok(svg.includes("<path"));
  assert.ok(svg.includes("100%"));
  assert.ok(svg.includes("Coverage"));
});

test("generateSmoothAreaChartSvg: Spline eğrisi ve dolgu üretir", () => {
  const svg = generateSmoothAreaChartSvg({
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    values: [10, 40, 25, 60, 45, 90],
    dots: true,
  });

  assert.ok(svg.includes("smooth-area-chart"));
  assert.ok(svg.includes("<path"));
  assert.ok(svg.includes("<circle"));
});

test("generateBarChartSvg: Çubuklar ve etiketler üretir", () => {
  const svg = generateBarChartSvg({
    x: 10,
    y: 10,
    width: 200,
    height: 80,
    data: [
      { label: "Q1", value: 20 },
      { label: "Q2", value: 50 },
      { label: "Q3", value: 80 },
    ],
  });

  assert.ok(svg.includes("bar-chart"));
  assert.ok(svg.includes("<rect"));
  assert.ok(svg.includes("Q1"));
  assert.ok(svg.includes("Q3"));
});

test("generateGaugeMeterSvg: Kadran arkı ve yüzde üretir", () => {
  const svg = generateGaugeMeterSvg({
    cx: 100,
    cy: 100,
    radius: 70,
    thickness: 15,
    value: 84,
    label: "Performans",
  });

  assert.ok(svg.includes("gauge-meter"));
  assert.ok(svg.includes("84%"));
  assert.ok(svg.includes("Performans"));
});

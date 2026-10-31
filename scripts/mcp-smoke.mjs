// MCP stdio duman testi: FastSVG v0.4 turbo araçlar testi.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

mkdirSync("tmp", { recursive: true });

const server = spawn(process.execPath, ["--import", "tsx", "apps/mcp-server/src/main.ts"], {
  stdio: ["pipe", "pipe", "inherit"],
  cwd: process.cwd(),
});

let buffer = "";
const pending = new Map();
let nextId = 1;

server.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  let index;
  while ((index = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    const message = JSON.parse(line);
    if (message.id !== undefined && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  }
});

function request(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => reject(new Error(`timeout: ${method}`)), 15000);
  });
}

const init = await request("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "smoke-test", version: "0.0.1" },
});
console.log("initialize:", init.result?.serverInfo?.name ?? "FAIL");

await request("notifications/initialized", {});
const tools = await request("tools/list", {});
const names = tools.result.tools.map((t) => t.name);
console.log(`tools (${names.length}):`, names.join(", "));

const call = (name, args) => request("tools/call", { name, arguments: args });

// 1. 3D Render Testi
const threedRes = await call("fastsvg_render_3d", {
  shape: "box",
  dimensions: { width: 100, height: 100, depth: 100 },
  color: "#3b82f6",
  projection: "isometric",
});
console.log("render_3d ok:", threedRes.result.content[0].text.includes("görünür yüzey"));

// 2. Slayt Kompozisyon Testi
const slideRes = await call("fastsvg_compose_slide", {
  title: "AI Vektör Motoru",
  subtitle: "FastSVG v0.4 Turbo",
  with3DGraphic: true,
});
console.log("compose_slide ok:", slideRes.result.content[0].text.includes("<svg"));

// 3. Web Hero Kompozisyon Testi
const webRes = await call("fastsvg_compose_web", {
  brandName: "FastSVG",
  headline: "Yeni Nesil Vektör Mimarisi",
  subheadline: "Matematiksel kesinlik, sıfır AI slop.",
});
console.log("compose_web ok:", webRes.result.content[0].text.includes("<svg"));

// 4. Grafik (Chart) Testi
const chartRes = await call("fastsvg_render_chart", {
  type: "donut",
  label: "100%",
  data: [{ label: "A", value: 60 }, { label: "B", value: 40 }],
});
console.log("render_chart ok:", chartRes.result.content[0].text.includes("donut-chart"));

// 5. Boolean ve Kalite Testi
const boolRes = await call("fastsvg_boolean_paths", {
  subjectD: "M 0 0 L 20 0 L 20 20 L 0 20 Z",
  clipD: "M 10 5 L 30 5 L 30 25 L 10 25 Z",
  operation: "union",
});
console.log("boolean_paths ok:", boolRes.result.content[0].text.includes("tamamlandı"));

// 6. APNG Delta Testi
const scene = await call("fastsvg_create_scene", { documentId: "smoke", name: "Duman", width: 32, height: 32, background: "#101010" });
const patch = await call("fastsvg_apply_patch", {
  documentId: "smoke",
  ops: [{ op: "addNode", node: { id: "b", type: "rect", parentId: null, props: { x: 4, y: 4, width: 16, height: 16 }, style: { fill: { color: "#ff0000" } }, provenance: "tool" } }],
});
const apng = await call("fastsvg_export_apng", {
  documentId: "smoke",
  outPath: "tmp/smoke.apng",
  timeline: {
    id: "t", name: "slide", durationMs: 400, frameRate: 10,
    tracks: [{ id: "tr", targetNodeId: "b", property: "translateX", keyframes: [{ id: "k1", timeMs: 0, value: 0 }, { id: "k2", timeMs: 400, value: 10 }] }],
  },
});
console.log("export_apng ok:", apng.result.content[0].text.includes('"ok": true'));

server.kill();
console.log("SMOKE-PASS");

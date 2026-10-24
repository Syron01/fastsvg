// MCP stdio duman testi: gerçek istemci davranışı simüle edilir.
import { spawn } from "node:child_process";

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
console.log("tools:", names.join(", "));
if (!names.includes("fastsvg_export_apng") || !names.includes("fastsvg_create_gradient")) {
  throw new Error("Beklenen araçlar eksik");
}

// Uçtan uca: sahne oluştur → gradient → patch (gradient kullanan node) → export → APNG.
const call = (name, args) => request("tools/call", { name, arguments: args });

const scene = await call("fastsvg_create_scene", { documentId: "smoke", name: "Duman", width: 32, height: 32, background: "#101010" });
console.log("create_scene ok:", scene.result.content[0].text.includes('"ok": true'));

const grad = await call("fastsvg_create_gradient", { id: "sky", type: "linear", from: "#1e3a8a", to: "#93c5fd", steps: 5 });
console.log("create_gradient ok:", grad.result.content[0].text.includes("banding"));

const patch = await call("fastsvg_apply_patch", {
  documentId: "smoke",
  ops: [{ op: "addNode", node: { id: "b", type: "rect", parentId: null, props: { x: 4, y: 4, width: 16, height: 16 }, style: { fill: { color: "#ff0000" } }, provenance: "tool" } }],
});
console.log("apply_patch ok:", patch.result.content[0].text.includes("affectedNodeIds"));

const exportResult = await call("fastsvg_export_asset", { documentId: "smoke" });
const exportPayload = JSON.parse(exportResult.result.content[0].text);
const svgOk = exportPayload.data.svg.includes("<linearGradient id=\"sky\"");
console.log("export defs içeriyor:", svgOk);

const apng = await call("fastsvg_export_apng", {
  documentId: "smoke",
  outPath: "tmp/smoke.apng",
  timeline: {
    id: "t", name: "slide", durationMs: 400, frameRate: 10,
    tracks: [{ id: "tr", targetNodeId: "b", property: "translateX", keyframes: [{ id: "k1", timeMs: 0, value: 0 }, { id: "k2", timeMs: 400, value: 10 }] }],
  },
});
const apngData = JSON.parse(apng.result.content[0].text);
console.log("export_apng:", apngData.ok === true ? `ok (${apngData.data.frameCount} kare)` : apngData.error);

const compare = await call("fastsvg_compare_images", { imageAPath: "tmp/smoke.apng", imageBPath: "tmp/smoke.apng" });
const cmp = JSON.parse(compare.result.content[0].text);
console.log("compare kendisiyle:", cmp.ok === true && cmp.data.changedPixels === 0 ? "ok" : cmp);

server.kill();
console.log("SMOKE-PASS");

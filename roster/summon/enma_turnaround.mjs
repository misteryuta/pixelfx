// Turnaround of Enma's rig (rows: poses; columns: side, front, back) and the prison wall's two layers.
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { Canvas, drawMonkey, drawCage, ENMA } = await import("file:///" + ROOT + "src/fx/summon/_monkey.js?" + Date.now());
const out = ROOT + "records/summon/enma_turnaround.png";
const rows = [["idle", (cv) => drawMonkey(cv, ENMA, {})], ["hop", (cv) => drawMonkey(cv, ENMA, { lift: 14, reach: 1, crouch: 0 })], ["crouch", (cv) => drawMonkey(cv, ENMA, { crouch: 1 })]];
const CW = 160, CH = 140, Z = +(process.env.Z ?? 2), views = ["side", "front", "back"];
const W = (views.length * CW + 30 + 2 * 140) * Z, H = rows.length * CH * Z;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { img[i * 4] = 150; img[i * 4 + 1] = 132; img[i * 4 + 2] = 98; img[i * 4 + 3] = 255; }
const blit = (px, w, h, X, Y) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!px[o + 3]) continue; for (let a = 0; a < Z; a++) for (let b = 0; b < Z; b++) { const d = (((Y + y) * Z + a) * W + (X + x) * Z + b) * 4; img[d] = px[o]; img[d + 1] = px[o + 1]; img[d + 2] = px[o + 2]; } } };
rows.forEach(([n, f], r) => {
  const bar = new Uint8ClampedArray(30 * CH * 4);
  for (let y = CH - 20 - 72; y < CH - 20; y++) for (let x = 12; x < 18; x++) { const o = (y * 30 + x) * 4; bar[o] = 40; bar[o + 1] = 40; bar[o + 2] = 60; bar[o + 3] = 255; }
  blit(bar, 30, CH, 0, r * CH);
  views.forEach((v, vi) => { const cv = new Canvas(CW, CH, CW / 2, CH - 20, v, 0.36); f(cv); blit(cv.pixels(), CW, CH, 30 + vi * CW, r * CH); });
});
["back", "front"].forEach((layer, i) => { const cv = new Canvas(140, 140, 70, 110, "side", 0.36); drawCage(cv, ENMA, { layer, u: 1 }); blit(cv.pixels(), 140, 140, 30 + 3 * CW + i * 140, 0); });
writeFileSync(out, encodePNG(W, H, img));
console.log(out);

// Turnaround of the Gedo Statue's rig: poses (rows) x side / front / back, a 72 px bar for scale.
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { Canvas, drawStatue, STATUE } = await import("file:///" + ROOT + "src/fx/summon/_statue.js?" + Date.now());
const rows = [["idle", {}], ["roar", { mouth: 1, lean: 1 }]];
const CW = 560, CH = 420, Z = 1, views = ["side", "front", "back"];
const W = (views.length * CW + 30) * Z, H = rows.length * CH * Z;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { img[i * 4] = 150; img[i * 4 + 1] = 132; img[i * 4 + 2] = 98; img[i * 4 + 3] = 255; }
const blit = (px, w, h, X, Y) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!px[o + 3]) continue; const d = ((Y + y) * W + X + x) * 4; img[d] = px[o]; img[d + 1] = px[o + 1]; img[d + 2] = px[o + 2]; } };
rows.forEach(([n, pose], r) => {
  const bar = new Uint8ClampedArray(30 * CH * 4);
  for (let y = CH - 30 - 72; y < CH - 30; y++) for (let x = 12; x < 18; x++) { const o = (y * 30 + x) * 4; bar[o] = 40; bar[o + 1] = 40; bar[o + 2] = 60; bar[o + 3] = 255; }
  blit(bar, 30, CH, 0, r * CH);
  views.forEach((v, vi) => { const cv = new Canvas(CW, CH, CW / 2, CH - 30, v, 0.36); drawStatue(cv, STATUE, pose); blit(cv.pixels(), CW, CH, 30 + vi * CW, r * CH); });
});
writeFileSync(ROOT + "records/summon/statue_turnaround.png", encodePNG(W, H, img));

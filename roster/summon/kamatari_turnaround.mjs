// Turnaround of Kamatari's rig: poses (rows) x side / front / back, a 72 px bar for scale.
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { Canvas, drawWeasel, KAMATARI } = await import("file:///" + ROOT + "src/fx/summon/_weasel.js?" + Date.now());
const rows = [["idle", { swing: -0.3 }], ["windup", { crouch: 1, swing: -1.2 }], ["dash0", { stretch: 1, lift: 10, swing: 1.6 }], ["dash1", { stretch: 1, lift: 10, swing: 3.2 }]];
const CW = 200, CH = 170, Z = 2, views = ["side", "front", "back"];
const W = (views.length * CW + 30) * Z, H = rows.length * CH * Z;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { img[i * 4] = 150; img[i * 4 + 1] = 132; img[i * 4 + 2] = 98; img[i * 4 + 3] = 255; }
const blit = (px, w, h, X, Y) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!px[o + 3]) continue; for (let a = 0; a < Z; a++) for (let b = 0; b < Z; b++) { const d = (((Y + y) * Z + a) * W + (X + x) * Z + b) * 4; img[d] = px[o]; img[d + 1] = px[o + 1]; img[d + 2] = px[o + 2]; } } };
rows.forEach(([n, pose], r) => {
  const bar = new Uint8ClampedArray(30 * CH * 4);
  for (let y = CH - 30 - 72; y < CH - 30; y++) for (let x = 12; x < 18; x++) { const o = (y * 30 + x) * 4; bar[o] = 40; bar[o + 1] = 40; bar[o + 2] = 60; bar[o + 3] = 255; }
  blit(bar, 30, CH, 0, r * CH);
  views.forEach((v, vi) => { const cv = new Canvas(CW, CH, CW / 2, CH - 30, v, 0.36); drawWeasel(cv, KAMATARI, pose); blit(cv.pixels(), CW, CH, 30 + vi * CW, r * CH); });
});
writeFileSync(ROOT + "records/summon/kamatari_turnaround.png", encodePNG(W, H, img));

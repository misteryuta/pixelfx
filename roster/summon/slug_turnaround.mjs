// Turnaround of Katsuyu's rig: poses (rows) x views, a 72 px bar for scale. node roster/summon/slug_turnaround.mjs
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { Canvas, drawSlug, KATSUYU, MINI } = await import("file:///" + ROOT + "src/fx/summon/_slug.js?" + Date.now());
const out = process.argv[2] ?? ROOT + "records/summon/katsuyu_turnaround.png";
const P = {
  idle: [KATSUYU, {}], crawl: [KATSUYU, { rear: 0.1, phase: 0.3 }], divide: [KATSUYU, { divide: 1, phase: 0.2 }],
  rear: [KATSUYU, { rear: 1, nod: -0.5 }], spit: [KATSUYU, { rear: 0.95, nod: 0.5, mouth: 1 }],
  mini: [MINI, { rear: 0.15, phase: 0.2 }], miniHeal: [MINI, { rear: 0, flat: 0.8, glow: 1 }],
};
const POSES = (process.env.POSES ?? Object.keys(P).join(",")).split(",");
const CW = 380, CH = 300, Z = +(process.env.Z ?? 1), views = ["side", "front", "back"];
const W = (views.length * CW + 30) * Z, H = POSES.length * CH * Z;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { img[i * 4] = 150; img[i * 4 + 1] = 132; img[i * 4 + 2] = 98; img[i * 4 + 3] = 255; }
const blit = (px, w, h, X, Y) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!px[o + 3]) continue; for (let a = 0; a < Z; a++) for (let b = 0; b < Z; b++) { const d = (((Y + y) * Z + a) * W + (X + x) * Z + b) * 4; img[d] = px[o]; img[d + 1] = px[o + 1]; img[d + 2] = px[o + 2]; } } };
POSES.forEach((name, r) => {
  const bar = new Uint8ClampedArray(30 * CH * 4);
  for (let y = CH - 40 - 72; y < CH - 40; y++) for (let x = 12; x < 18; x++) { const o = (y * 30 + x) * 4; bar[o] = 40; bar[o + 1] = 40; bar[o + 2] = 60; bar[o + 3] = 255; }
  blit(bar, 30, CH, 0, r * CH);
  views.forEach((v, vi) => {
    const cv = new Canvas(CW, CH, CW / 2, CH - 40, v, 0.36);
    drawSlug(cv, P[name][0], P[name][1]);
    blit(cv.pixels(), CW, CH, 30 + vi * CW, r * CH);
  });
});
writeFileSync(out, encodePNG(W, H, img));
console.log(out, W + "x" + H);

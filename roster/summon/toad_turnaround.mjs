// Turnaround of Gamabunta's rig: poses (rows) x views (side, front, back), next to a 72 px fighter bar for scale.
// node roster/summon/toad_turnaround.mjs [out.png]
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { Canvas, drawToad, BUNTA } = await import("file:///" + ROOT + "src/fx/summon/_toad.js?" + Date.now());
const out = process.argv[2] ?? ROOT + "records/summon/gamabunta_turnaround.png";
const D = Math.PI / 180;
const POSES = (process.env.POSES ?? "sit,crouch,stretch,tuck,reach,land,draw,slash0,slash1,slash2").split(",");
const P = {
  sit: {}, crouch: { crouch: 1 }, stretch: { air: true, stretch: 1, bp: 0.9 }, tuck: { air: true, tuck: 1, bp: 0.35 }, reach: { air: true, reach: 1, bp: 0.2 },
  land: { squash: 1 }, draw: { sword: { mode: "draw", d: 0.5 } },
  slash0: { sword: { mode: "slash", phi: 60 * D } }, slash1: { sword: { mode: "slash", phi: 0, prev: 40 * D } }, slash2: { sword: { mode: "slash", phi: -80 * D, prev: -50 * D } },
};
const CW = 400, CH = 320, Z = +(process.env.Z ?? 1), views = ["side", "front", "back"];
const W = (views.length * CW + 30) * Z, H = POSES.length * CH * Z;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { img[i * 4] = 150; img[i * 4 + 1] = 132; img[i * 4 + 2] = 98; img[i * 4 + 3] = 255; }
const blit = (px, w, h, X, Y) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!px[o + 3]) continue; for (let a = 0; a < Z; a++) for (let b = 0; b < Z; b++) { const d = (((Y + y) * Z + a) * W + (X + x) * Z + b) * 4; img[d] = px[o]; img[d + 1] = px[o + 1]; img[d + 2] = px[o + 2]; } } };
POSES.forEach((name, r) => {
  const bar = new Uint8ClampedArray(30 * CH * 4);
  for (let y = CH - 70 - 72; y < CH - 70; y++) for (let x = 12; x < 18; x++) { const o = (y * 30 + x) * 4; bar[o] = 40; bar[o + 1] = 40; bar[o + 2] = 60; bar[o + 3] = 255; }
  blit(bar, 30, CH, 0, r * CH);
  views.forEach((v, vi) => {
    const cv = new Canvas(CW, CH, CW / 2, CH - 70, v, 0.36);
    drawToad(cv, BUNTA, P[name]);
    blit(cv.pixels(), CW, CH, 30 + vi * CW, r * CH);
  });
});
writeFileSync(out, encodePNG(W, H, img));
console.log(out, W + "x" + H);

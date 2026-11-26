// Turnaround sheet for the summon rigs: every animal in side / front / back (standing) and a few run frames per view,
// scaled up, next to a 72 px fighter silhouette for scale. node roster/summon/turnaround.mjs [out.png] [poseJSON]
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { Canvas, drawDog, NINKEN } = await import("file:///" + ROOT + "src/fx/summon/_quad.js?" + Date.now());
const out = process.argv[2] ?? ROOT + "records/summon/ninken_turnaround.png";
const extra = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const CW = 64, CH = 64, Z = +(process.env.Z ?? 3), views = ["side", "front", "back"];
const poses = [{}, { run: 1, phase: 0 }, { run: 1, phase: 0.25 }, { run: 1, phase: 0.5 }].map((p) => ({ ...p, ...extra }));
const dogs = (process.env.DOGS ? process.env.DOGS.split(",") : Object.keys(NINKEN));
const cols = views.length * poses.length + 1, W = cols * CW * Z, H = dogs.length * CH * Z;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { img[i * 4] = 92; img[i * 4 + 1] = 120; img[i * 4 + 2] = 84; img[i * 4 + 3] = 255; }
const blit = (px, w, h, X, Y) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!px[o + 3]) continue; for (let a = 0; a < Z; a++) for (let b = 0; b < Z; b++) { const d = (((Y + y) * Z + a) * W + (X + x) * Z + b) * 4; img[d] = px[o]; img[d + 1] = px[o + 1]; img[d + 2] = px[o + 2]; } } };
dogs.forEach((id, r) => {
  // a 72 px fighter silhouette, scaled to the cell (as a ruler): drawn at half height marks
  const ruler = new Uint8ClampedArray(CW * CH * 4);
  for (let y = CH - 1; y >= Math.max(0, CH - 72); y--) for (let x = 28; x < 34; x++) { const o = (y * CW + x) * 4; ruler[o] = 40; ruler[o + 1] = 40; ruler[o + 2] = 60; ruler[o + 3] = 255; }
  blit(ruler, CW, CH, 0, r * CH);
  views.forEach((v, vi) => poses.forEach((p, pi) => {
    const cv = new Canvas(CW, CH, CW / 2, CH - 4, v);
    drawDog(cv, NINKEN[id], p);
    blit(cv.pixels(), CW, CH, (1 + vi * poses.length + pi) * CW, r * CH);
  }));
});
writeFileSync(out, encodePNG(W, H, img));
console.log(out, W + "x" + H);

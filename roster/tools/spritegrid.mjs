// A sprite view at 12x with a coordinate grid (every 5 px labelled) to place rig polygons and pivots.
// node roster/tools/spritegrid.mjs itachi right
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { modelPixels } = await import("file:///" + ROOT + "src/fx/jutsu/_modeldata.js");
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const [name, view] = process.argv.slice(2), d = modelPixels(name, view), Z = 12, M = 30;
const W = d.w * Z + M * 2, H = d.h * Z + M * 2, out = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) out.set([60, 62, 80, 255], i * 4);
for (let v = 0; v < d.h; v++) for (let u = 0; u < d.w; u++) {
  const i = d.idx[v * d.w + u]; if (!i) continue; const c = d.pal[i - 1];
  for (let y = 0; y < Z; y++) for (let x = 0; x < Z; x++) out.set([c & 255, (c >> 8) & 255, (c >> 16) & 255, 255], ((M + v * Z + y) * W + M + u * Z + x) * 4);
}
for (let u = 0; u <= d.w; u++) for (let y = M; y < H - M; y++) { const k = ((y * W + M + u * Z) * 4); out.set(u % 5 ? [90, 90, 110, 255] : [255, 220, 60, 255], k); }
for (let v = 0; v <= d.h; v++) for (let x = M; x < W - M; x++) { const k = (((M + v * Z) * W + x) * 4); out.set(v % 5 ? [90, 90, 110, 255] : [255, 220, 60, 255], k); }
writeFileSync(ROOT + `records/review/grid-${name}-${view}.png`, encodePNG(W, H, out));
console.log(d.w, d.h);

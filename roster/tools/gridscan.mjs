// Find the pixel-art cell size of an upscaled sprite sheet: where colour changes along rows/columns, the best period.
import { readFileSync } from "node:fs";
const [file, W, H] = [process.argv[2], +process.argv[3], +process.argv[4]];
const px = readFileSync(file);
const diff = (a, b) => Math.abs(px[a] - px[b]) + Math.abs(px[a + 1] - px[b + 1]) + Math.abs(px[a + 2] - px[b + 2]);
const ex = [], ey = [];
for (let y = 0; y < H; y += 3) for (let x = 1; x < W; x++) if (diff((y * W + x) * 4, (y * W + x - 1) * 4) > 60) ex.push(x);
for (let x = 0; x < W; x += 3) for (let y = 1; y < H; y++) if (diff((y * W + x) * 4, ((y - 1) * W + x) * 4) > 60) ey.push(y);
function best(edges) {
  let out = [];
  for (let p = 6; p <= 24; p += 0.05) {
    // phase coherence: mean resultant length of edge positions on the circle of period p
    let c = 0, s = 0;
    for (const e of edges) { const a = (2 * Math.PI * e) / p; c += Math.cos(a); s += Math.sin(a); }
    out.push([p, Math.hypot(c, s) / edges.length, Math.atan2(s, c)]);
  }
  out.sort((a, b) => b[1] - a[1]);
  return out.slice(0, 4).map(([p, r, ph]) => `${p.toFixed(2)} r=${r.toFixed(3)} phase=${(((ph / (2 * Math.PI)) * p + p) % p).toFixed(2)}`);
}
console.log("x", ex.length, best(ex));
console.log("y", ey.length, best(ey));

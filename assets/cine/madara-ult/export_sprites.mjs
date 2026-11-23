// Export the user's Madara Susanoo sprites (from src/fx/jutsu/_modeldata.js) as PNGs for the Blender cutscene:
// the front view whole; the side view split into body / arm / katana by its rig (src/fx/jutsu/_models.js RIGS).
import { writeFileSync } from "node:fs";
const { encodePNG } = await import("../../../tools/lib/png.mjs");
const { modelPixels, RIGS } = await import("../../../src/fx/jutsu/_models.js");
const OUT = new URL("./sprites/", import.meta.url);
const inPoly = (P, x, y) => { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
function save(name, d, keep, shade = () => false) {
  const px = new Uint8Array(d.w * d.h * 4);
  for (let v = 0; v < d.h; v++) for (let u = 0; u < d.w; u++) {
    const i = d.idx[v * d.w + u]; if (!i || !keep(u, v)) continue;
    const c = d.pal[i - 1] >>> 0, o = (v * d.w + u) * 4;
    const k = shade(u, v) ? 0.45 : 1;
    px[o] = (c & 255) * k; px[o + 1] = ((c >> 8) & 255) * k; px[o + 2] = ((c >> 16) & 255) * k; px[o + 3] = 255;
  }
  writeFileSync(new URL(name, OUT), encodePNG(d.w, d.h, px));
  console.log(name, d.w, d.h);
}
for (const view of ["front", "back", "right"]) save(`susanooMadara_${view}.png`, modelPixels("susanooMadara", view), () => true);
const d = modelPixels("susanooMadara", "right"), parts = RIGS["susanooMadara/right"].parts;
const owner = (u, v) => { let o = null; for (const q of parts) if (inPoly(q.poly, u + 0.5, v + 0.5)) o = q.name; return o; };
// the body keeps the arm's place in shadow (the torso behind it), without the katana
save("susanooMadara_right_body.png", d, (u, v) => owner(u, v) !== "katana", (u, v) => owner(u, v) === "arm");
save("susanooMadara_right_arm.png", d, (u, v) => owner(u, v) === "arm");
save("susanooMadara_right_katana.png", d, (u, v) => owner(u, v) === "katana");
console.log(JSON.stringify({ arm: parts.find((q) => q.name === "arm"), katana: parts.find((q) => q.name === "katana") }));

// Character turnarounds from the user (pixel art, upscaled) -> in-game sprites: key out the background (flood fill
// from the edges), split the four views by empty columns, majority-vote downscale each view to its in-game height
// (keeps hard pixel edges, no blending), quantise to the sheet's own colours and write src/fx/jutsu/_chardata.js
// (RLE, palette-indexed) plus a 4x preview. Same method as the model sheets (_modeldata.js).
// node roster/tools/chars.mjs
import { readFileSync, writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");

// name, rgba file, w, h, in-game height (px), views left to right
// Itachi (2026-11-25): head ~23 px wide at 72 px, the same head size as Naruto's sheet
// one scale for everybody (Itachi's: 859 sheet px -> 72 game px), so heads come out the same size; th = height or 0 (auto)
const PX = 859 / 72;
// eyes: the sheets for Madara and Sasuke show the Rinnegan; the roster variants are Flashback Madara (Eternal
// Mangekyou) and Kage Summit Sasuke (Mangekyou in both eyes), so purple eye pixels in the head turn Sharingan red
const SHEETS = [
  ["itachi", "assets/chars/itachi/turnaround.rgba", 1774, 887, 72, ["front", "back", "left", "right"]],
  ["madara", "assets/chars/madara/turnaround.rgba", 1774, 887, 0, ["front", "back", "left", "right"], { eyes: "red" }],
  ["sasuke", "assets/chars/sasuke/turnaround.rgba", 1774, 887, 0, ["front", "back", "right", "left"], { eyes: "red" }],
];

function keyOut(px, w, h) {
  const tol = 70, bg = [px[0], px[1], px[2]];
  const close = (p) => Math.abs(px[p * 4] - bg[0]) + Math.abs(px[p * 4 + 1] - bg[1]) + Math.abs(px[p * 4 + 2] - bg[2]) < tol;
  const mask = new Uint8Array(w * h).fill(1), stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (!mask[p] || !close(p)) continue;
    mask[p] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1); if (y > 0) stack.push(p - w); if (y < h - 1) stack.push(p + w);
  }
  return mask;
}
function views(mask, w, h) {
  const col = new Array(w).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) col[x] += mask[y * w + x];
  const segs = [];
  let s = -1, gap = 0;
  for (let x = 0; x <= w; x++) {
    const on = x < w && col[x] > 2;
    if (on) { if (s < 0) s = x; gap = 0; } else if (s >= 0) { gap++; if (gap >= 12 || x === w) { segs.push([s, x - gap]); s = -1; gap = 0; } }
  }
  return segs.filter(([a, b]) => b - a > 40);
}
function bbox(mask, w, x0, x1, h) {
  let y0 = h, y1 = -1, a = w, b = -1;
  for (let y = 0; y < h; y++) for (let x = x0; x <= x1; x++) if (mask[y * w + x]) { if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < a) a = x; if (x > b) b = x; }
  return [a, y0, b, y1];
}
function downscale(px, mask, w, [x0, y0, x1, y1], th) {
  const sh = (y1 - y0 + 1) / th, tw = Math.max(1, Math.round((x1 - x0 + 1) / sh)), out = new Uint8ClampedArray(tw * th * 4);
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    const ax = Math.floor(x0 + tx * sh), bx = Math.floor(x0 + (tx + 1) * sh), ay = Math.floor(y0 + ty * sh), by = Math.floor(y0 + (ty + 1) * sh);
    let n = 0, on = 0;
    const votes = new Map();
    for (let y = ay; y < Math.max(by, ay + 1); y++) for (let x = ax; x < Math.max(bx, ax + 1); x++) {
      n++;
      if (!mask[y * w + x]) continue;
      on++;
      const i = (y * w + x) * 4, key = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
      const v = votes.get(key) || { c: 0, r: 0, g: 0, b: 0 };
      // small details win their cell over the skin or hair round them: in the head (top 40 %) the Sharingan red
      // and the eye whites count extra, so the eyes survive the downscale
      const head = (y - y0) < (y1 - y0) * 0.4, red = px[i] > 140 && px[i + 1] < 90 && px[i + 2] < 90, white = px[i] > 225 && px[i + 1] > 225 && px[i + 2] > 225;
      const wgt = head && red ? 5 : head && white ? 2 : 1;
      v.c += wgt; v.r += px[i] * wgt; v.g += px[i + 1] * wgt; v.b += px[i + 2] * wgt;
      votes.set(key, v);
    }
    if (on < n * 0.45) continue;
    let best = null;
    for (const v of votes.values()) if (!best || v.c > best.c) best = v;
    const o = (ty * tw + tx) * 4;
    out[o] = best.r / best.c; out[o + 1] = best.g / best.c; out[o + 2] = best.b / best.c; out[o + 3] = 255;
  }
  return { w: tw, h: th, rgba: out };
}
function quantise(img, K = 40) {
  const counts = new Map();
  for (let i = 0; i < img.rgba.length; i += 4) if (img.rgba[i + 3]) { const k = ((img.rgba[i] >> 3) << 10) | ((img.rgba[i + 1] >> 3) << 5) | (img.rgba[i + 2] >> 3); counts.set(k, (counts.get(k) || 0) + 1); }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4]);
  const pal = [];
  for (const c of sorted) { if (pal.length >= K) break; if (pal.every((p) => Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1]) + Math.abs(p[2] - c[2]) > 18)) pal.push(c); }
  const near = (r, g, b) => { let bi = 0, bd = 1e9; pal.forEach((p, i) => { const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi; };
  const idx = new Uint8Array(img.w * img.h);
  for (let i = 0; i < idx.length; i++) if (img.rgba[i * 4 + 3]) idx[i] = near(img.rgba[i * 4], img.rgba[i * 4 + 1], img.rgba[i * 4 + 2]) + 1;
  return { pal, idx };
}
const rle = (idx) => { const o = []; for (let i = 0; i < idx.length;) { let j = i; while (j < idx.length && idx[j] === idx[i] && j - i < 255) j++; o.push(j - i, idx[i]); i = j; } return Buffer.from(o).toString("base64"); };

const chars = {}, previews = [];
for (const [name, file, w, h, th0, names, opt = {}] of SHEETS) {
  const px = readFileSync(ROOT + file), mask = keyOut(px, w, h), segs = views(mask, w, h);
  if (segs.length !== names.length) throw new Error(`${name}: ${segs.length} views found`);
  chars[name] = {};
  segs.forEach(([a, b], i) => {
    const box = bbox(mask, w, a, b, h), th = th0 || Math.round((box[3] - box[1] + 1) / PX), img = downscale(px, mask, w, box, th), q = quantise(img);
    if (opt.eyes === "red") {
      // purple/lavender pixels in the top 40 % (the Rinnegan) -> Sharingan red, darker ones -> deep red
      const lav = (c) => c[2] > c[0] + 15 && c[2] > c[1] + 25 && c[0] > 80 && c[0] + c[1] + c[2] > 330;
      q.pal.forEach((c, i) => { if (!lav(c)) return; q.pal.push(c[0] + c[1] + c[2] > 520 ? [255, 70, 70] : [170, 16, 28]); const to = q.pal.length; for (let k = 0; k < q.idx.length; k++) if (q.idx[k] === i + 1 && Math.floor(k / img.w) < img.h * 0.4) q.idx[k] = to; });
    }
    chars[name][names[i]] = { w: img.w, h: img.h, pal: q.pal.map((c) => "#" + c.map((v) => Math.min(255, v).toString(16).padStart(2, "0")).join("")), data: rle(q.idx) };
    // the quantised view, for the preview
    const qi = new Uint8ClampedArray(img.w * img.h * 4);
    for (let k = 0; k < q.idx.length; k++) if (q.idx[k]) { const c = q.pal[q.idx[k] - 1]; qi.set([c[0], c[1], c[2], 255], k * 4); }
    previews.push({ w: img.w, h: img.h, rgba: qi });
    console.log(name, names[i], img.w + "x" + img.h, "colours", q.pal.length, "src box", box.join(","));
  });
}
writeFileSync(ROOT + "src/fx/jutsu/_chardata.js", `// The user's character turnarounds as palette-indexed pixel sprites (generated by roster/tools/chars.mjs, do not edit):
// Itachi (2026-11-25: front, back, left, right; 72 px tall). Read through modelPixels(name, view) in _modeldata.js.
export const CHAR_RAW = ${JSON.stringify(chars)};
`);
// preview at 4x on grey
const Z = 4, PW = previews.reduce((s, p) => s + p.w * Z + 8, 8), PH = Math.max(...previews.map((p) => p.h)) * Z + 16, out = new Uint8ClampedArray(PW * PH * 4);
for (let i = 0; i < PW * PH; i++) out.set([70, 72, 90, 255], i * 4);
let ox = 8;
for (const p of previews) {
  for (let y = 0; y < p.h * Z; y++) for (let x = 0; x < p.w * Z; x++) { const s = ((y / Z | 0) * p.w + (x / Z | 0)) * 4; if (p.rgba[s + 3]) out.set(p.rgba.subarray(s, s + 4), ((y + 8) * PW + ox + x) * 4); }
  ox += p.w * Z + 8;
}
writeFileSync(ROOT + "records/review/chars-preview.png", encodePNG(PW, PH, out));
console.log("written _chardata.js and records/review/chars-preview.png");

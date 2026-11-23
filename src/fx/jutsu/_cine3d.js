// 3D shots for the cutscenes: frames rendered in Blender (blender/cine_sasuke.py: toon-shaded, transparent film, 2x),
// pixelated to the cutscene's frame (one palette per shot, hard alpha; tools: records/roblox4/pixelate.py) and stored
// as PNGs under assets/cine/<move>/<shot>/NN.png with cine.json. An insert paints its own 2D backdrop, then the 3D
// frame over it (drawShot), then 2D effects on top (lightning, glows, speed lines). Frames load in node (the bake);
// where files can't be read (a browser) shots report null and the move falls back to its drawn version.
import { inflateSync } from "node:zlib";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../assets/cine/", import.meta.url));
export const ASSETS = fileURLToPath(new URL("../../../assets/", import.meta.url));
const cache = new Map();

/** Decode an 8-bit RGBA (or RGB) non-interlaced PNG: { w, h, data: Uint8Array RGBA }. */
export function decodePNG(buf) {
  let p = 8, w = 0, h = 0, ct = 6;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), body = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = body.readUInt32BE(0); h = body.readUInt32BE(4); ct = body[9]; if (body[8] !== 8 || body[12] !== 0) throw new Error("png: 8-bit non-interlaced only"); }
    else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0;
  if (!bpp) throw new Error("png: RGBA/RGB only");
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, px = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0, b = y ? px[dst - stride + x] : 0, c = x >= bpp && y ? px[dst - stride + x - bpp] : 0, v = raw[src + x];
      let r = v;
      if (f === 1) r = v + a;
      else if (f === 2) r = v + b;
      else if (f === 3) r = v + ((a + b) >> 1);
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      px[dst + x] = r & 255;
    }
  }
  if (bpp === 4) return { w, h, data: px };
  const out = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { out[i * 4] = px[i * 3]; out[i * 4 + 1] = px[i * 3 + 1]; out[i * 4 + 2] = px[i * 3 + 2]; out[i * 4 + 3] = 255; }
  return { w, h, data: out };
}

/** The frames of a shot: { n, w, h, frames: [{ w, h, data }], extra: [...] }, or null where they can't be loaded. */
export function shotOf(move, shot) {
  const key = move + "/" + shot;
  if (cache.has(key)) return cache.get(key);
  let s = null;
  try {
    const metaFile = ROOT + move + "/cine.json";
    if (existsSync(metaFile)) {
      const m = JSON.parse(readFileSync(metaFile, "utf8"))[shot];
      if (m) {
        const frames = [];
        for (let i = 1; i <= m.frames; i++) frames.push(decodePNG(readFileSync(ROOT + move + "/" + shot + "/" + String(i).padStart(2, "0") + ".png")));
        s = { n: m.frames, w: m.w, h: m.h, frames, extra: m.extra ?? [] };
        for (const f of frames) {
          // per frame: the topmost and bottommost opaque row of each column, the topmost below 30 % (low), the rightmost opaque column of each row
          f.top = new Int16Array(f.w).fill(-1); f.bot = new Int16Array(f.w).fill(-1); f.right = new Int16Array(f.h).fill(-1); f.low = new Int16Array(f.w).fill(-1);
          const lo = Math.floor(f.h * 0.3);
          for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.data[(y * f.w + x) * 4 + 3] > 127) { if (f.top[x] < 0) f.top[x] = y; if (y >= lo && f.low[x] < 0) f.low[x] = y; f.bot[x] = y; f.right[y] = x; }
        }
      }
    }
  } catch (e) {
    s = null;
  }
  cache.set(key, s);
  return s;
}

/** Which frame of a shot to show at u (0..1 through the insert). */
export const frameAt = (s, u) => s.frames[Math.max(0, Math.min(s.n - 1, Math.round(u * (s.n - 1))))];

/**
 * Paint a shot's frame over the box (frame pixel (0, 0) at the box's top left), shifted by (dx, dy), its colours
 * pulled toward tint by k, faded by a.
 */
export function drawShot(p, box, f, { dx = 0, dy = 0, tint = null, k = 0, a = 1 } = {}) {
  const [x0, y0, x1, y1] = box, T = tint;
  p.shade(x0, y0, x1, y1, (x, y, out) => {
    const fx = Math.floor(x - x0 - dx), fy = Math.floor(y - y0 - dy);
    if (fx < 0 || fy < 0 || fx >= f.w || fy >= f.h) return;
    const i = (fy * f.w + fx) * 4;
    if (f.data[i + 3] < 128) return;
    let r = f.data[i], g = f.data[i + 1], b = f.data[i + 2];
    if (T !== null && k > 0) { r += ((T & 255) - r) * k; g += (((T >>> 8) & 255) - g) * k; b += (((T >>> 16) & 255) - b) * k; }
    out.a = a;
    return (255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r);
  });
}

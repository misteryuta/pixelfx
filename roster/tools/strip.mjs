// node strip.mjs <out-name> <id> <cols> t1 t2 ...: frames of one move at the given times, in rows of cols
const LIB = "file:///C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/tools/lib/fxlib.mjs";
const { ROOT, loadEffect, renderAct, canvas, upscale, save } = await import(LIB);
import { join } from "node:path";
const [name, id, colsS, ...ts] = process.argv.slice(2), cols = Number(colsS);
const fx = await loadEffect("jutsu/" + id), opts = id.startsWith("naruto-") ? { options: { outfit: "naruto" } } : {};
const r = renderAct(fx, { fps: 20, seconds: (fx.meta.duration ?? 8) + 0.5, ...opts });
const pick = ts.map(Number).map((T) => r.frames.reduce((b, f) => (Math.abs(f.t - T) < Math.abs(b.t - T) ? f : b)));
// CROP=x,y,w,h,z (frame pixels) to look closer
const C = process.env.CROP ? process.env.CROP.split(",").map(Number) : null;
const crop = (buf) => { if (!C) return buf; const [x0, y0, w, h] = C, out = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) out[(y * w + x) * 4 + k] = buf[((y0 + y) * r.w + x0 + x) * 4 + k]; return out; };
const Z = C ? C[4] : 1, W = C ? C[2] * Z : r.w, H = C ? C[3] * Z : r.h, rows = Math.ceil(pick.length / cols), img = canvas(cols * (W + 4) + 4, rows * (H + 14) + 4);
// CAM=1: through the effect's camera the way the viewer shows it (zoom about the framed point, drawn toward the middle,
// a roll about the frame's centre; the cinema bars)
const camView = (f) => {
  const c = fx.mod.camera(f.t), w = r.w, h = r.h, z = c.z, px = c.x + r.pivot[0], py = c.y + r.pivot[1], k = Math.min(1, Math.max(0, (z - 1) / 1.2));
  const tx = px + (w / 2 - px) * k, ty = py + (h * 0.55 - py) * k, hx = tx - px * z, hy = ty - py * z, hcx = hx + (w * z) / 2, hcy = hy + (h * z) / 2, a = (-c.r * Math.PI) / 180;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
    const o = (Y * w + X) * 4;
    if (Y < h * 0.09 || Y >= h * 0.91) { out[o + 3] = 255; continue; }
    const dx = X - hcx, dy = Y - hcy, rx = hcx + dx * Math.cos(a) - dy * Math.sin(a), ry = hcy + dx * Math.sin(a) + dy * Math.cos(a);
    const u = Math.floor((rx - hx) / z), v = Math.floor((ry - hy) / z);
    if (u < 0 || v < 0 || u >= w || v >= h) { out[o] = 10; out[o + 1] = 10; out[o + 2] = 16; out[o + 3] = 255; continue; }
    const q = (v * w + u) * 4; out[o] = f.color[q]; out[o + 1] = f.color[q + 1]; out[o + 2] = f.color[q + 2]; out[o + 3] = 255;
  }
  return out;
};
if (process.env.CAM && fx.mod.camera) for (let i = 0; i < pick.length; i++) pick[i] = { ...pick[i], color: camView(pick[i]) };
pick.forEach((f, i) => { const x = 4 + (i % cols) * (W + 4), y = 4 + Math.floor(i / cols) * (H + 14); img.text(f.t.toFixed(2), x, y, 1); img.paste(C ? upscale(crop(f.color), C[2], C[3], Z) : upscale(f.color, W, H, 1), W, H, x, y + 10); });
const file = join(ROOT, "records", "review", "strip-" + name + ".png");
save(file, img.png());
console.log(file);

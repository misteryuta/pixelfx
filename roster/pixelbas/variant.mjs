// Roblox deduplicates identical image uploads (the same asset id comes back, owned by whoever uploaded it first). To
// upload the live atlases again for another account, each PNG gets one fully transparent pixel's colour changed:
// invisible, but a different file. node roster/pixelbas/variant.mjs <srcDir> <outDir>
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const [src, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
// a minimal PNG reader for our own RGBA 8-bit, non-interlaced files
function readPNG(buf) {
  let p = 8, w, h, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); if (data[8] !== 8 || data[9] !== 6) throw new Error("not RGBA8"); }
    if (type === "IDAT") idat.push(data);
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), px = new Uint8ClampedArray(w * h * 4), bpp = 4, stride = w * 4;
  let prev = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255;
    }
    px.set(cur, y * stride);
    prev = cur;
  }
  return { w, h, px };
}
let n = 0;
for (const f of readdirSync(src).filter((x) => x.endsWith(".png"))) {
  const { w, h, px } = readPNG(readFileSync(src + "/" + f));
  // the first fully transparent pixel gets a colour (still alpha 0)
  for (let i = 0; i < w * h; i++) if (px[i * 4 + 3] === 0) { px[i * 4] = 1; px[i * 4 + 1] = 2; px[i * 4 + 2] = 3; break; }
  writeFileSync(out + "/" + f, encodePNG(w, h, px));
  n++;
}
console.log("variants written:", n);

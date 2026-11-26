// Embed the live moves' pixels in the place (no image upload, no asset ownership): every actor frame and flipbook
// frame cropped to its visible box, RGBA, zstd-compressed and base64'd into StringValue chunks, the same way Pixel BAS
// stores Itachi's animation (PixelBASItachiAnimations). Format "LIVE": u16 count, then per frame u16 x, y, w, h and the
// w*h*4 bytes. One pack per book (actor / each fx).  node roster/pixelbas/embed.mjs <id> ...  ->  roster/pixelbas/packs/*.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { inflateSync, zstdCompressSync } from "node:zlib";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const OUT = ROOT + "roster/pixelbas/packs/";
mkdirSync(OUT, { recursive: true });
function readPNG(buf) {
  let p = 8, w, h, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); }
    if (type === "IDAT") idat.push(data);
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), px = new Uint8Array(w * h * 4), stride = w * 4;
  let prev = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? cur[x - 4] : 0, b = prev[x], c = x >= 4 ? prev[x - 4] : 0;
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
// all cells of one book, in frame order, each cropped to its visible pixels
function packBook(dir, book) {
  const frames = [];
  for (const sh of book.sheets) {
    const { w: W, px } = readPNG(readFileSync(dir + sh.file));
    for (let i = 0; i < sh.n; i++) {
      const cx = (i % book.cols) * book.cw, cy = Math.floor(i / book.cols) * book.ch;
      let x0 = book.cw, y0 = book.ch, x1 = -1, y1 = -1;
      for (let y = 0; y < book.ch; y++) for (let x = 0; x < book.cw; x++) if (px[((cy + y) * W + cx + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { x0 = 0; y0 = 0; x1 = 0; y1 = 0; }
      const w = x1 - x0 + 1, h = y1 - y0 + 1, bytes = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++) Buffer.from(px.buffer, px.byteOffset + ((cy + y0 + y) * W + cx + x0) * 4, w * 4).copy(bytes, y * w * 4);
      frames.push({ x0, y0, w, h, bytes });
    }
  }
  const parts = [Buffer.from("LIVE"), Buffer.alloc(2)];
  parts[1].writeUInt16LE(frames.length);
  for (const f of frames) { const hd = Buffer.alloc(8); hd.writeUInt16LE(f.x0, 0); hd.writeUInt16LE(f.y0, 2); hd.writeUInt16LE(f.w, 4); hd.writeUInt16LE(f.h, 6); parts.push(hd, f.bytes); }
  const raw = Buffer.concat(parts), z = zstdCompressSync(raw);
  return { raw: raw.length, b64: z.toString("base64") };
}
let total = 0;
for (const id of process.argv.slice(2)) {
  const dir = ROOT + `records/live/${id}/`, j = JSON.parse(readFileSync(dir + "live.json", "utf8"));
  const packs = { actor: packBook(dir, j.actor) };
  for (const [k, b] of Object.entries(j.fx)) packs["fx_" + k] = packBook(dir, b);
  for (const [k, p] of Object.entries(packs)) { total += p.b64.length; console.log(id, k, "raw", p.raw, "b64", p.b64.length); }
  writeFileSync(OUT + id + ".json", JSON.stringify(Object.fromEntries(Object.entries(packs).map(([k, p]) => [k, { raw: p.raw, b64: p.b64 }]))));
}
console.log("total base64 chars", total);

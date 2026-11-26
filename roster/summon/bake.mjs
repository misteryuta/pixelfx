// Bake a summon move for the game: every animal's rig animations in side / front / back (one pack per animal) and the
// ground effects (pixelfx painter), as embedded "LIVE" packs (u16 count; per frame u16 x, y, w, h in the cell + RGBA),
// zstd + base64. Plus a preview sheet. node roster/summon/bake.mjs ninken
//   -> roster/summon/packs/<move>.json  { move, books: { name: { cw, ch, pivot, index?, frames, fps?, loop?, b64 } } }
import { writeFileSync, mkdirSync } from "node:fs";
import { zstdCompressSync } from "node:zlib";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { createFrame, clearFrame, painterFor, composite } = await import("file:///" + ROOT + "src/core/index.js");
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { Canvas, drawDog } = await import("file:///" + ROOT + "src/fx/summon/_quad.js?" + Date.now());
const name = process.argv[2] ?? "ninken";
const M = await import("file:///" + ROOT + `src/fx/summon/${name}.js?` + Date.now());
mkdirSync(ROOT + "roster/summon/packs", { recursive: true });
mkdirSync(ROOT + "records/summon", { recursive: true });

// frames (full cells, RGBA) -> one LIVE pack, each frame cropped to its visible box
function pack(cells, cw, ch) {
  const parts = [Buffer.from("LIVE"), Buffer.alloc(2)];
  parts[1].writeUInt16LE(cells.length);
  for (const px of cells) {
    let x0 = cw, y0 = ch, x1 = -1, y1 = -1;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (px[(y * cw + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, hd = Buffer.alloc(8), b = Buffer.alloc(w * h * 4);
    hd.writeUInt16LE(x0, 0); hd.writeUInt16LE(y0, 2); hd.writeUInt16LE(w, 4); hd.writeUInt16LE(h, 6);
    for (let y = 0; y < h; y++) Buffer.from(px.buffer, px.byteOffset + ((y0 + y) * cw + x0) * 4, w * 4).copy(b, y * w * 4);
    parts.push(hd, b);
  }
  const raw = Buffer.concat(parts);
  return { raw: raw.length, b64: zstdCompressSync(raw).toString("base64") };
}
const books = {}, sheet = [];
// ---- the animals: a pack (ninken: DOGS) or one big rig per animal (RIGS: rendered on a large canvas, then every
// frame cut to the union of what is drawn, the pivot kept on the floor point)
for (const R of M.RIGS ?? []) {
  const BW = 760, BH = 560, bx = BW / 2, by = BH - 150, full = [], index = {};
  for (const [an, A] of Object.entries(M.ANIMS)) {
    index[an] = { fps: A.fps, loop: !!A.loop, n: A.frames };
    for (const v of M.VIEWS) {
      index[an][v] = full.length + 1;
      for (let i = 0; i < A.frames; i++) {
        const u = A.loop ? i / A.frames : A.frames > 1 ? i / (A.frames - 1) : 0;
        const cv = new Canvas(BW, BH, bx, by, v, R.pitch);
        R.draw(cv, R.S, A.pose(u, i, A.frames));
        full.push(cv.pixels());
      }
    }
  }
  let x0 = BW, y0 = BH, x1 = -1, y1 = -1;
  for (const px of full) for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (px[(y * BW + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x0 === 0 || y0 === 0 || x1 === BW - 1 || y1 === BH - 1) console.warn(R.book, "touches the bake canvas edge");
  const cw = x1 - x0 + 3, ch = y1 - y0 + 3, cells = full.map((px) => { const o = new Uint8ClampedArray(cw * ch * 4); for (let y = 0; y < ch - 2; y++) o.set(px.subarray(((y0 + y) * BW + x0) * 4, ((y0 + y) * BW + x0 + cw - 2) * 4), ((y + 1) * cw + 1) * 4); return o; });
  const p = pack(cells, cw, ch);
  books[R.book] = { cw, ch, pivot: [bx - x0 + 1, by - y0 + 1], index, frames: cells.length, ...p };
  sheet.push({ id: R.book, cw, ch, cells });
  console.log(R.book, cw + "x" + ch, cells.length, "frames, b64", p.b64.length);
}
for (const id of M.DOGS ?? []) {
  const S = M.NINKEN[id], k = S.size;
  const cw = 2 * Math.ceil((S.bodyL + S.headR * 2.2 + S.snout + S.tailL) * k * 0.75 + 6);
  const ch = Math.ceil((S.legH * 1.8 + S.bodyR * 2 + S.headR * 3.2) * k + 12);
  const ox = cw / 2, oy = ch - 5, cells = [], index = {};
  for (const [an, A] of Object.entries(M.ANIMS)) {
    index[an] = { fps: A.fps, loop: !!A.loop, n: A.frames };
    for (const v of M.VIEWS) {
      index[an][v] = cells.length + 1; // 1-based start
      for (let i = 0; i < A.frames; i++) {
        const u = A.loop ? i / A.frames : A.frames > 1 ? i / (A.frames - 1) : 0;
        const cv = new Canvas(cw, ch, ox, oy, v);
        drawDog(cv, S, A.pose(u, S));
        cells.push(cv.pixels());
      }
    }
  }
  const p = pack(cells, cw, ch);
  books["dog_" + id] = { cw, ch, pivot: [ox, oy], index, frames: cells.length, ...p };
  sheet.push({ id, cw, ch, cells });
  console.log(id, cw + "x" + ch, cells.length, "frames, b64", p.b64.length);
}
// ---- the ground effects
for (const [fx, F] of Object.entries(M.FX)) {
  const cw = F.cw ?? 96, ch = F.ch ?? 64, ox = F.ox ?? 48, oy = F.oy ?? 44, fr = createFrame(cw, ch), cells = [];
  for (let i = 0; i < F.frames; i++) {
    clearFrame(fr);
    F.draw(painterFor(fr).place(ox, oy, false), F.loop ? i / F.frames : i / Math.max(1, F.frames - 1), i);
    cells.push(composite(fr, new Uint8ClampedArray(cw * ch * 4), null));
  }
  const p = pack(cells, cw, ch);
  books[(M.PREFIX ?? "fx_") + fx] = { cw, ch, pivot: [ox, oy], frames: F.frames, fps: F.fps, loop: !!F.loop, ground: !!F.ground, ...p };
  sheet.push({ id: fx, cw, ch, cells });
  console.log("fx", fx, F.frames, "b64", p.b64.length);
}
writeFileSync(ROOT + `roster/summon/packs/${name}.json`, JSON.stringify({ move: M.MOVE, books }));
// ---- preview: every frame of every book, wrapped at ~3000 px, x1 (SHEET_Z to enlarge)
const Z = +(process.env.SHEET_Z ?? 1), MAXW = 3000;
const lay = sheet.map((s) => { const cols = Math.max(1, Math.min(s.cells.length, Math.floor(MAXW / (s.cw * Z)))); return { ...s, cols, rows: Math.ceil(s.cells.length / cols) }; });
const W = Math.max(...lay.map((s) => s.cw * s.cols)) * Z, H = lay.reduce((a, s) => a + s.ch * s.rows, 0) * Z;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { img[i * 4] = 96; img[i * 4 + 1] = 118; img[i * 4 + 2] = 80; img[i * 4 + 3] = 255; }
let Y = 0;
for (const s of lay) {
  s.cells.forEach((px, n) => { const cx = (n % s.cols) * s.cw, cy = Y + Math.floor(n / s.cols) * s.ch; for (let y = 0; y < s.ch; y++) for (let x = 0; x < s.cw; x++) { const o = (y * s.cw + x) * 4; if (!px[o + 3]) continue; for (let a = 0; a < Z; a++) for (let b = 0; b < Z; b++) { const d = (((cy + y) * Z + a) * W + (cx + x) * Z + b) * 4; img[d] = px[o]; img[d + 1] = px[o + 1]; img[d + 2] = px[o + 2]; } } });
  Y += s.ch * s.rows;
}
writeFileSync(ROOT + `records/summon/${name}_sheet.png`, encodePNG(W, H, img));
const tot = Object.values(books).reduce((a, b) => a + b.b64.length, 0);
console.log("total b64", tot, "sheet", W + "x" + H);

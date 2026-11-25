// Bake LIVE moves for the training ground: per move, the actor layer (the user + Susanoo, every frame at fps, cropped
// to one box for all frames, feet at a fixed pivot) with its anchors per frame, and every runtime flipbook, packed
// into sheets of at most 1024 px (Roblox shrinks bigger images, which breaks cell offsets).
// node roster/live/bake.mjs <id> ...  ->  records/live/<id>/{actor_N.png, fx_N.png, live.json}
import { writeFileSync, mkdirSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { createFrame, clearFrame, painterFor, composite } = await import("file:///" + ROOT + "src/core/index.js");
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const MAX = 1024, BIG = 900, PAD = 2;

// render frames into one big canvas each, then crop all to their common box
function renderSet(n, draw) {
  const fr = createFrame(BIG, BIG), OX = BIG / 2, OY = BIG * 0.75, imgs = [], anchors = [];
  let x0 = BIG, y0 = BIG, x1 = -1, y1 = -1;
  for (let i = 0; i < n; i++) {
    clearFrame(fr);
    const a = draw(painterFor(fr).place(OX, OY, false), i) ?? {};
    const px = composite(fr, new Uint8ClampedArray(BIG * BIG * 4), null);
    for (let y = 0; y < BIG; y++) for (let x = 0; x < BIG; x++) if (px[(y * BIG + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    imgs.push(px);
    anchors.push(Object.fromEntries(Object.entries(a).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, [Math.round(v[0] * 10) / 10, Math.round(v[1] * 10) / 10]])));
  }
  if (x1 < 0) { x0 = OX; y0 = OY; x1 = OX; y1 = OY; }
  x0 -= PAD; y0 -= PAD; x1 += PAD; y1 += PAD;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const cells = imgs.map((px) => { const c = new Uint8ClampedArray(cw * ch * 4); for (let y = 0; y < ch; y++) c.set(px.subarray(((y0 + y) * BIG + x0) * 4, ((y0 + y) * BIG + x0 + cw) * 4), y * cw * 4); return c; });
  // pivot: where the origin (feet / fx origin) sits inside a cell
  return { cw, ch, pivot: [OX - x0, OY - y0], cells, anchors };
}
function pack(dir, prefix, set) {
  const cols = Math.max(1, Math.floor(MAX / set.cw)), rows = Math.max(1, Math.floor(MAX / set.ch)), per = cols * rows;
  if (set.cw > MAX || set.ch > MAX) throw new Error(`${prefix}: a cell ${set.cw}x${set.ch} is over ${MAX}`);
  const sheets = [];
  for (let s = 0; s * per < set.cells.length; s++) {
    const list = set.cells.slice(s * per, (s + 1) * per), rc = Math.ceil(list.length / cols), W = Math.min(list.length, cols) * set.cw, H = rc * set.ch;
    const img = new Uint8ClampedArray(W * H * 4);
    list.forEach((c, i) => { const cx = (i % cols) * set.cw, cy = Math.floor(i / cols) * set.ch; for (let y = 0; y < set.ch; y++) img.set(c.subarray(y * set.cw * 4, (y + 1) * set.cw * 4), ((cy + y) * W + cx) * 4); });
    const file = `${prefix}_${s + 1}.png`;
    writeFileSync(dir + file, encodePNG(W, H, img));
    sheets.push({ file, n: list.length, w: W, h: H });
  }
  return { cw: set.cw, ch: set.ch, cols, pivot: set.pivot, frames: set.cells.length, sheets };
}

for (const id of process.argv.slice(2)) {
  const { live } = await import("file:///" + ROOT + `src/fx/live/${id}.js`);
  const dir = ROOT + `records/live/${id}/`;
  mkdirSync(dir, { recursive: true });
  const n = Math.round(live.len * live.fps) + 1;
  const actor = renderSet(n, (p, i) => live.actor(p, i / live.fps));
  const A = pack(dir, id + "_actor", actor);
  A.anchors = actor.anchors;
  const fx = {};
  for (const [name, f] of Object.entries(live.fx ?? {})) {
    const m = Math.max(1, Math.round(f.len * live.fps));
    const set = renderSet(m, (p, i) => f.draw(p, f.loop ? i / m : m > 1 ? i / (m - 1) : 0));
    fx[name] = { ...pack(dir, `${id}_fx_${name}`, set), len: f.len, loop: !!f.loop };
  }
  // anchors at a given time (for spawns/hits that read an anchor at a fixed moment)
  const anchorAt = (t) => actor.anchors[Math.min(actor.anchors.length - 1, Math.round(t * live.fps))];
  const resolve = (e) => (e.anchorT !== undefined ? { ...e, anchorPos: anchorAt(e.anchorT)[e.anchor] ?? null } : e);
  const out = { id, len: live.len, fps: live.fps, user: live.user, actor: A, fx, spawns: (live.spawns ?? []).map(resolve), hits: (live.hits ?? []).map(resolve), onHit: live.onHit ?? null, onBlock: live.onBlock ?? null, sfx: live.sfx ?? [] };
  writeFileSync(dir + "live.json", JSON.stringify(out));
  console.log(id, "actor", A.cw + "x" + A.ch, A.frames, "frames,", A.sheets.length, "sheets; fx", Object.entries(fx).map(([k, v]) => `${k} ${v.frames}f/${v.sheets.length}`).join(", "));
}

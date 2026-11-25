// A character's sprite atlas for the fight scene between clips (ShinobiBattleClient): the user's turnaround as a
// cut-out puppet (_models.js rig), posed frame by frame into the rows the fight scene plays: idle, walk, jab, block,
// hit, down, cast, win. Faces right; the client mirrors it for the other side.
// node roster/tools/charatlas.mjs itachi  ->  records/chars/<name>_atlas.png + <name>_atlas.json
import { writeFileSync, mkdirSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { createFrame, clearFrame, painterFor, composite } = await import("file:///" + ROOT + "src/core/index.js");
const { drawModel, modelPoint } = await import("file:///" + ROOT + "src/fx/jutsu/_models.js");
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const name = process.argv[2] ?? "itachi", VIEW = "right";
const CW = 96, CH = 84, FX = 48, FY = 80;
const S = Math.sin, PI = Math.PI;
// each row: frame count, loop, and the pose of frame i (0..n-1): { rot (whole body, about the feet), dy, sy, arm, head, tint }
const ROWS = [
  ["idle", 8, true, (i) => ({ sy: 1 - 0.012 * (0.5 - 0.5 * Math.cos((i / 8) * 2 * PI)), arm: 0.04 * S((i / 8) * 2 * PI), head: 0.02 * S((i / 8) * 2 * PI + 1) })],
  ["walk", 6, true, (i) => ({ dy: -Math.abs(S((i / 6) * 2 * PI)) * 1.5, arm: 0.28 * S((i / 6) * 2 * PI), rot: 0.03 })],
  ["jab", 5, false, (i) => ({ arm: [0.2, -0.5, -1.45, -1.35, -0.5][i], st: [1, 1, 1.15, 1.1, 1][i], rot: [0, 0.02, 0.06, 0.05, 0.02][i] })],
  ["block", 2, false, (i) => ({ arm: [-1.6, -2.1][i], st: 0.85, rot: -0.03 })],
  ["hit", 5, false, (i) => ({ rot: [-0.06, -0.14, -0.12, -0.07, -0.02][i], arm: [0.3, 0.5, 0.4, 0.2, 0.05][i], head: -0.1, tint: i === 0 ? 0xffffffff : null })],
  // 8 frames at most per row: Roblox shrinks images wider than 1024 px, which breaks the cell offsets
  ["down", 8, false, (i) => { const u = Math.min(1, i / 5); return { rot: -1.5 * (u * u * (3 - 2 * u)), arm: 0.6 * u, head: -0.2 * u, dy: i === 6 ? -1 : 0 }; }],
  ["cast", 6, false, (i) => ({ arm: [-0.6, -1.6, -2.4, -2.5, -2.5, -2.45][i], st: [1, 0.95, 0.82, 0.8, 0.8, 0.8][i], head: 0.04 })],
  ["win", 7, false, (i) => ({ arm: 0.05 * S(i), head: [0, 0, 0.05, 0.08, 0.08, 0.06, 0.05][i] })],
];
const cols = Math.max(...ROWS.map((r) => r[1])), W = cols * CW, H = ROWS.length * CH;
if (W > 1024 || H > 1024) throw new Error(`atlas ${W}x${H} is over 1024 px: Roblox would shrink it`);
const atlas = new Uint8ClampedArray(W * H * 4);
const fr = createFrame(CW, CH);
const rows = {};
ROWS.forEach(([row, n, loop, poseOf], r) => {
  rows[row] = [r, n, loop];
  for (let i = 0; i < n; i++) {
    const q = poseOf(i);
    clearFrame(fr);
    const p = painterFor(fr).place(FX, FY, false);
    const o = { rot: q.rot ?? 0, sy: q.sy ?? 1, pose: { arm: { rot: q.arm ?? 0, st: q.st ?? 1 }, head: { rot: q.head ?? 0 } } };
    if (q.tint) { o.tint = q.tint; o.tintK = 0.7; }
    drawModel(p, name, VIEW, 0, q.dy ?? 0, o);
    // the Mangekyou in the eye while he casts and wins (a lit red pixel)
    if (row === "cast" && i >= 2) { const e = modelPoint(name, VIEW, 0, q.dy ?? 0, o, "head", [18.5, 17]); p.px(Math.round(e[0]), Math.round(e[1]), 0xff2a2aff); }
    const px = composite(fr, new Uint8ClampedArray(CW * CH * 4), null);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const s = (y * CW + x) * 4, d = ((r * CH + y) * W + i * CW + x) * 4; atlas.set(px.subarray(s, s + 4), d); }
  }
});
mkdirSync(ROOT + "records/chars", { recursive: true });
writeFileSync(ROOT + `records/chars/${name}_atlas.png`, encodePNG(W, H, atlas));
writeFileSync(ROOT + `records/chars/${name}_atlas.json`, JSON.stringify({ name, cw: CW, ch: CH, fx: FX, fy: FY, rows }));
console.log(`records/chars/${name}_atlas.png`, W + "x" + H, JSON.stringify(rows));

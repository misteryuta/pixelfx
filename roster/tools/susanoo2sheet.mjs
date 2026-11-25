// Review sheet for the Susanoo rigs (_susanoo2.js): each kind in a few poses, first without aura, then with it,
// with its user standing inside. node roster/tools/susanoo2sheet.mjs
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { createFrame, clearFrame, painterFor, composite } = await import("file:///" + ROOT + "src/core/index.js");
const S2 = await import("file:///" + ROOT + "src/fx/jutsu/_susanoo2.js");
const { drawModel } = await import("file:///" + ROOT + "src/fx/jutsu/_models.js");
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const CW = 300, CH = 270, FX = 120, FY = 250;
const USER = { itachi: ["itachi", "right", false], sasuke: ["sasuke", "right", false], madara: ["madara", "left", true] };
const cases = [
  ["itachi", {}, (p, W, C, s, f) => { S2.jar(p, W, C, s, f); }, (p, W, C, s, f) => { S2.totsuka(p, W, C, s, f, -1.2, 70, 0); }],
  ["itachi", { upF: -1.5, foreF: -0.2, upN: 0.2 }, (p, W, C, s, f) => S2.yata(p, W, C, s, f, 0.6, 0x4aa0ffff), (p, W, C, s, f) => S2.jar(p, W, C, s, f)],
  ["sasuke", { upF: -1.45, foreF: -0.1, upN: -1.2, foreN: 0.4 }, null, (p, W, C, s, f) => S2.bow(p, W, C, s, f, 0, null)],
  ["madara", { upN: -0.3, foreN: -1.1, upF: -0.4, foreF: -0.6 }, (p, W, C, s, f) => S2.scabbard(p, W, C, s, f), (p, W, C, s, f) => S2.katana(p, W, C, s, f, -1.4, 0)],
  ["madara", { upN: -2.4, foreN: -0.3, chest: -0.1 }, (p, W, C, s, f) => S2.scabbard(p, W, C, s, f), (p, W, C, s, f) => S2.katana(p, W, C, s, f, -2.2, 120)],
];
const W = CW * cases.length, H = CH * 2, out = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) out.set([40, 42, 58, 255], i * 4);
const fr = createFrame(CW, CH);
for (const [row, aura] of [[0, 0], [1, 1]]) cases.forEach(([kind, pose, extra, front], i) => {
  clearFrame(fr);
  const p = painterFor(fr).place(FX, FY, false);
  S2.drawSusanoo2(p, kind, 0, 0, { pose, aura, t: 0.5, extra, front: (pp, Wd, C, s, f) => { if (front) front(pp, Wd, C, s, f); } });
  const [n, v, fl] = USER[kind];
  drawModel(p, n, v, -2, 0, { flip: fl });
  const px = composite(fr, new Uint8ClampedArray(CW * CH * 4), null);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const s = (y * CW + x) * 4; if (px[s + 3]) out.set(px.subarray(s, s + 4), ((row * CH + y) * W + i * CW + x) * 4); }
});
writeFileSync(ROOT + "records/review/susanoo2.png", encodePNG(W, H, out));
console.log("records/review/susanoo2.png");

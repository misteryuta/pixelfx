// Turnaround of Fukasaku and Shima: rows (who x pose) x side / front / back, a 72 px bar for scale.
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { Canvas, drawSage, FUKASAKU, SHIMA } = await import("file:///" + ROOT + "src/fx/summon/_sagetoad.js?" + Date.now());
const rows = [[FUKASAKU, {}], [FUKASAKU, { sing: 1, lean: 1 }], [SHIMA, {}], [SHIMA, { sing: 1, lean: 1 }]];
const CW = 50, CH = 44, Z = 4, views = ["side", "front", "back"];
const W = (views.length * CW + 12) * Z, H = rows.length * CH * Z;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { img[i * 4] = 150; img[i * 4 + 1] = 132; img[i * 4 + 2] = 98; img[i * 4 + 3] = 255; }
const blit = (px, w, h, X, Y) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!px[o + 3]) continue; for (let a = 0; a < Z; a++) for (let b = 0; b < Z; b++) { const d = (((Y + y) * Z + a) * W + (X + x) * Z + b) * 4; img[d] = px[o]; img[d + 1] = px[o + 1]; img[d + 2] = px[o + 2]; } } };
rows.forEach(([S, pose], r) => views.forEach((v, vi) => { const cv = new Canvas(CW, CH, CW / 2, CH - 6, v, 0.36); drawSage(cv, S, pose); blit(cv.pixels(), CW, CH, 12 + vi * CW, r * CH); }));
writeFileSync(ROOT + "records/summon/sage_turnaround.png", encodePNG(W, H, img));

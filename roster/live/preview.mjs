// Preview a LIVE move the way the training ground shows it: one fixed side camera, the actor layer at the caster,
// the runtime flipbooks at their anchors/contact, a target standing at distance D (hit) or out of reach (miss).
// node roster/live/preview.mjs <move> <D> t1 t2 ...  ->  records/review/live-<move>-<D>.png
import { writeFileSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const { createFrame, clearFrame, painterFor, composite } = await import("file:///" + ROOT + "src/core/index.js");
const { encodePNG } = await import("file:///" + ROOT + "tools/lib/png.mjs");
const { drawModel } = await import("file:///" + ROOT + "src/fx/jutsu/_models.js");
const [id, Ds, ...ts] = process.argv.slice(2), D = Number(Ds);
const { live } = await import("file:///" + ROOT + `src/fx/live/${id}.js`);
const CW = 520, CH = 300, OX = 140, OY = 270;
const fr = createFrame(CW, CH);
// the anchors at a time (draw into a throwaway frame)
const scratch = createFrame(CW, CH);
const anchorsAt = (t) => { clearFrame(scratch); return live.actor(painterFor(scratch).place(OX, OY, false), t); };
// contact: where the hit lands: on the target if it is inside the box, else where the named anchor is
function contactOf(h) {
  const A = anchorsAt(h.t), tip = A[h.contact ?? "tip"] ?? [0, -40];
  const inside = h.shape === "box" && D >= h.x0 && D <= h.x1;
  return { hit: inside, x: inside ? D : tip[0], y: inside ? -26 : tip[1] };
}
const cut = live.hits.find((h) => h.shape === "box" || h.shape === "projectile");
const C0 = cut ? contactOf(cut) : null;
const out = new Uint8ClampedArray(CW * ts.length * CH * 4);
ts.map(Number).forEach((t, k) => {
  clearFrame(fr);
  const p = painterFor(fr).place(OX, OY, false);
  // the floor
  p.rect(-OX, 0, CW, 2, 0xff5a5070);
  // the target (Itachi's sprite as a stand-in rival), facing left
  drawModel(p, "itachi", "right", D, 0, { flip: true, tint: C0?.hit && t > cut.t && t < cut.t + 0.15 ? 0xffffffff : undefined, tintK: 0.6 });
  live.actor(p, t);
  // runtime flipbooks
  for (const s of live.spawns ?? []) {
    const fx = live.fx[s.fx], age = t - s.t;
    if (!fx || age < 0 || (!fx.loop && age > fx.len) || (s.life && age > s.life)) continue;
    let x = 0, y = 0;
    if (s.at.startsWith("contact") && C0) { x = C0.x + (s.vx ?? 0) * age; y = s.at.endsWith(".ground") ? 0 : C0.y + 20; }
    else if (s.at.startsWith("anchor:")) { const A = anchorsAt(t)[s.at.slice(7)]; if (A) [x, y] = A; }
    else if (s.at === "anchorAt") {
      const A = anchorsAt(s.anchorT)[s.anchor]; if (!A) continue;
      x = A[0] + (s.vx ?? 0) * age; y = A[1];
      // a projectile ends at the target: its hit flipbook plays there
      if (s.projectile && x >= D - 6) { const hf = live.fx[live.onHit?.fx]; const ha = age - (D - 6 - A[0]) / s.vx; if (hf && ha < hf.len) hf.draw(painterFor(fr).place(OX + D - 6, OY + y, false), ha / hf.len); continue; }
    }
    const q = painterFor(fr).place(OX + x, OY + y, false);
    fx.draw(q, fx.loop ? (age / fx.len) % 1 : age / fx.len);
  }
  const px = composite(fr, new Uint8ClampedArray(CW * CH * 4), null);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const s = (y * CW + x) * 4, d = (y * CW * ts.length + k * CW + x) * 4; if (px[s + 3]) out.set(px.subarray(s, s + 4), d); else out.set([26, 26, 38, 255], d); }
});
const file = ROOT + `records/review/live-${id}-${D}.png`;
writeFileSync(file, encodePNG(CW * ts.length, CH, out));
console.log(file, C0 ? (C0.hit ? "HIT at " + C0.x : "MISS, contact at " + C0.x.toFixed(0)) : "");

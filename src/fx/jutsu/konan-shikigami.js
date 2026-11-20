// Shikigami no Mai (Dance of the Shikigami, Konan). Narutopedia: seal Ram; Konan turns her body into countless sheets of
// paper and shapes them at will: spears and shuriken to attack, butterflies, clones, and paper wings on her back to fly.
// Here: the paper flower in her hair, the Ram seal, her edges peeling away into sheets, a pair of great paper wings
// unfolding from her back, a storm of paper butterflies; then a flock of paper birds streams off her wings onto the
// target and settles on it until it is wrapped head to foot in paper; the sheets are explosive tags: their glyphs
// light up, and the whole cocoon goes off, burning scraps of paper flying.
// New: the sheets (little quads catching the light as they turn), the wings (layered blades of paper), the butterflies,
// the birds, the cocoon (paper laid over the target's own pixels), the tags going off. From _lib: blast().
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, blast } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["hitsuji"], 0.12, { hold: 0.4 }), PEEL = SEALS.end, WINGS = PEEL + 0.3, SPREAD = WINGS + 0.35, VOLLEY = SPREAD + 0.25;
const NB = 36, COVER0 = VOLLEY + 0.3, COVER1 = VOLLEY + 1.05, LIT = COVER1 + 0.1, BOOM = LIT + 0.45, WRAP = BOOM, END = BOOM + 2.3, TX = 160;
const FIREK = ["#1a0804", "#5a1406", "#b0300a", "#ff6a10", "#ffb030", "#ffe880", "#fffbe0"].map(hex);
// each bird: when it leaves the wings, where on the target it settles
const BIRDS = Array.from({ length: NB }, (_, i) => ({ t0: VOLLEY + (i / NB) * 0.7, ox: (rand(i, 11) - 0.5) * 22, oy: -4 - rand(i, 12) * 46, sy: (rand(i, 13) - 0.5) * 30 }));
const PAPER = [hex("#f4f6ff"), hex("#c8d0f0"), hex("#8a98c8"), hex("#4a5688")];

export const meta = {
  name: "Dance of the shikigami",
  desc: "Konan: the Ram seal, paper wings unfold from her back; a flock of paper birds streams onto the target and wraps it head to foot, the sheets are explosive tags, and the paper cocoon blows up.",
  tags: ["jutsu", "konan", "akatsuki", "paper", "projectile", "control", "one-shot"],
  size: [290, 180],
  origin: [64, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1c2236", "#4a5688", "#8a98c8", "#c8d0f0", "#f4f6ff"], seed: 70 },
};

const FLOAT = { ...READY, y: -8, crouch: 0, lean: -2, fx: 10, fy: -26, bx: -6, by: -26, ffx: 2, ffy: -4, fbx: -4, fby: -2 };
const CAST = { ...FLOAT, fx: 20, fy: -28, lean: 6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SPREAD, FLOAT, "out"],
    [VOLLEY, CAST, "snap"],
    [WRAP + 0.5, CAST],
    [END, { ...READY }],
  ],
  hits: [
    ...Array.from({ length: 5 }, (_, i) => ({ t: COVER0 + i * 0.15, stop: 0.02, flash: 0, push: 0.4, straw: 2, shiver: 0.3 })),
    { t: LIT, stop: 0.06, shake: 0.12, amp: 1, target: false },
    { t: BOOM, stop: 0.2, shake: 0.65, amp: 5, push: 5, straw: 40, skin: "char", sfx: "explosion" },
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// a sheet of paper turning in the air: a quad that shows its face or its edge
function sheet(p, x, y, s, a, k = 1) {
  const w = s * Math.abs(Math.cos(a)), h = s * 0.7;
  p.rect(x - w / 2, y - h / 2, Math.max(1, w), h, Math.cos(a) > 0 ? PAPER[0] : PAPER[1], k);
  if (w > 2) p.line(x - w / 2, y + h / 2, x + w / 2, y + h / 2, PAPER[2], k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const flies = Array.from({ length: 16 }, (_, i) => ({ a0: rand(i, 1) * TAU, r: 20 + rand(i, 2) * 30, sp: 1 + rand(i, 3) * 2, y: -20 - rand(i, 4) * 50 }));
  return {
    update(t, dt) {
      ps.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      blast(p, t - BOOM, { x: TX, y: 0, R: 30, C: FIREK, seed: 7, layer: "back" });
      // the wings: layered blades of paper fanning out from between her shoulders
      if (t > WINGS) {
        const k = ease.outBack(clamp((t - WINGS) / (SPREAD - WINGS)), 1.6) * (1 - smooth(END - 0.6, END - 0.1, t)), [cx, cy] = [b.chest[0] - 4, b.chest[1] - 2], flap = Math.sin(t * 5) * 0.08;
        for (let i = 0; i < 6; i++) {
          const a = -2.9 + i * 0.28 + flap, L = (34 - i * 3) * k;
          const x1 = cx + Math.cos(a) * L, y1 = cy + Math.sin(a) * L, x2 = cx + Math.cos(a + 0.22) * L * 0.8, y2 = cy + Math.sin(a + 0.22) * L * 0.8;
          p.tri(cx, cy, x1, y1, x2, y2, i % 2 ? PAPER[1] : PAPER[0]);
          p.line(cx, cy, x1, y1, PAPER[2]);
        }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, PAPER.slice().reverse());
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "konan", t0: 0.05, t1: SEALS.end, label: "SHIKIGAMI", head: b.head });
      // the paper flower in her hair
      p.circle(hx - 2, hy - 3, 1.6, PAPER[1]);
      p.px(hx - 2, hy - 3, PAPER[0]);
      // her edges peeling away: sheets lifting off her body and drifting up
      if (t > PEEL && t < VOLLEY + 0.4) for (let i = 0; i < 14; i++) {
        const u = ((t - PEEL) * 0.9 + rand(i, 7)) % 1, x = b.chest[0] + (rand(i, 8) - 0.5) * 16 + Math.sin(u * 6 + i) * 4, y = b.chest[1] + 10 - u * 40;
        sheet(p, x, y, 3, t * 6 + i, 1 - u);
      }
      // the butterflies: paper wings flickering as they wheel round her
      if (t > WINGS && t < VOLLEY + 0.5) for (const [i, f] of flies.entries()) {
        const a = f.a0 + (t - WINGS) * f.sp, x = 8 + Math.cos(a) * f.r + (t > VOLLEY ? (t - VOLLEY) * 60 : 0), y = f.y + Math.sin(a * 2) * 6, w = Math.abs(Math.sin(t * 18 + i)) * 3;
        p.tri(x, y, x - w, y - 3, x - w, y + 1, PAPER[0]);
        p.tri(x, y, x + w, y - 3, x + w, y + 1, PAPER[1]);
        p.px(x, y, PAPER[3]);
      }
      // the cocoon: paper laid over the target's own pixels, patch by patch as the birds settle, folds and all
      const cover = smooth(COVER0, COVER1, t) * (t < BOOM ? 1 : 0);
      if (cover > 0) {
        const lit = smooth(LIT, BOOM, t), f = Math.floor(t * 24);
        p.shade(TX - 22, -56, TX + 22, 0, (x, y) => {
          if (!(p.get(x, y) >>> 24)) return;
          const cx = Math.floor((x + 2) / 4), cy = Math.floor((y + 1) / 3);
          if (rand(cx, cy) > cover * 1.08) return;
          const fold = (Math.floor(x) + Math.floor(y) * 2) % 7 === 0, edge = ((Math.floor(y) + cx) % 3) === 0;
          // the tags' glyphs burning up through the paper before it goes
          if (lit > 0 && rand(cx * 3 + Math.floor(x) % 3, cy, f % 5) < 0.18 + 0.5 * lit) return lit > 0.6 ? FIREK[5] : FIREK[4];
          return fold ? PAPER[2] : edge ? PAPER[1] : PAPER[0];
        });
        if (lit > 0) p.glow(TX, -26, 40, FIREK[4], 0.5 * lit * (0.7 + 0.3 * Math.sin(t * 60)));
      }
      // the birds: paper wings flapping, streaming off her wings in a curve onto the target, settling
      for (const [i, q] of BIRDS.entries()) {
        const a = (t - q.t0) / 0.45;
        if (a < 0 || a > 1.05) continue;
        const u = ease.inOutSine(clamp(a)), x0 = b.chest[0] - 6, y0 = b.chest[1] - 8, x1 = TX + q.ox, y1 = q.oy;
        const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + q.sy * Math.sin(Math.PI * u) - 14 * Math.sin(Math.PI * u), w = (1 - 0.6 * smooth(0.85, 1, a)) * (2 + Math.abs(Math.sin(t * 22 + i)) * 2.5);
        p.tri(x, y, x - w, y - 3, x - 1, y + 1, PAPER[0]);
        p.tri(x, y, x + w * 0.6, y - 3, x + 1, y + 1, PAPER[1]);
        p.line(x - 2, y, x + 3, y + 0.5, PAPER[2]);
      }
      // the tags go off: the blast, and burning scraps of paper whirling out of it
      blast(p, t - BOOM, { x: TX, y: 0, R: 30, C: FIREK, seed: 7 });
      if (t > BOOM && t < BOOM + 1.6) for (let i = 0; i < 18; i++) {
        const age = t - BOOM, a = -Math.PI * (0.1 + 0.8 * rand(i, 21)), v = 60 + 120 * rand(i, 22), x = TX + Math.cos(a) * v * age, y = -26 + Math.sin(a) * v * age + 60 * age * age;
        if (y > -1) continue;
        sheet(p, x, y, 3, t * 9 + i, 1 - age / 1.6);
        if (rand(i, 23) > 0.5) p.px(x + 1, y - 1, FIREK[3 + (i % 3)]);
      }
      ps.draw(p, "front");
    },
  };
});

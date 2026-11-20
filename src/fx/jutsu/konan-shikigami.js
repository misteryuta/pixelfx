// Shikigami no Mai (Dance of the Shikigami, Konan). Narutopedia: seal Ram; Konan turns her body into countless sheets of
// paper and shapes them at will: spears and shuriken to attack, butterflies, clones, and paper wings on her back to fly.
// Here: the paper flower in her hair, the Ram seal, her edges peeling away into sheets, a pair of great paper wings
// unfolding from her back, a storm of paper butterflies, then a volley of folded paper shuriken flying at the target and
// sheets wrapping round it.
// New: the sheets (little quads catching the light as they turn), the wings (layered blades of paper), the butterflies,
// the paper shuriken, the wrapping.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["hitsuji"], 0.12, { hold: 0.4 }), PEEL = SEALS.end, WINGS = PEEL + 0.3, SPREAD = WINGS + 0.35, VOLLEY = SPREAD + 0.25, NS = 12, SG = 0.05, WRAP = VOLLEY + NS * SG + 0.25, END = WRAP + 1.3, TX = 160;
const PAPER = [hex("#f4f6ff"), hex("#c8d0f0"), hex("#8a98c8"), hex("#4a5688")];

export const meta = {
  name: "Dance of the shikigami",
  desc: "Konan: the Ram seal, her edges peeling into sheets of paper, great paper wings unfolding from her back in a storm of paper butterflies, then a volley of paper shuriken and sheets wrapping round the target.",
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
    ...Array.from({ length: 4 }, (_, i) => ({ t: VOLLEY + 0.25 + i * SG * 3, stop: 0.02, flash: 0, push: 0.8, straw: 8 })),
    { t: WRAP + 0.3, stop: 0.14, shake: 0.2, amp: 2, push: 0.5, straw: 6, flash: 0, skin: "holy", shiver: 0.6 },
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
      if (t > WINGS && t < WRAP + 0.4) for (const [i, f] of flies.entries()) {
        const a = f.a0 + (t - WINGS) * f.sp, x = 8 + Math.cos(a) * f.r + (t > VOLLEY ? (t - VOLLEY) * 60 : 0), y = f.y + Math.sin(a * 2) * 6, w = Math.abs(Math.sin(t * 18 + i)) * 3;
        p.tri(x, y, x - w, y - 3, x - w, y + 1, PAPER[0]);
        p.tri(x, y, x + w, y - 3, x + w, y + 1, PAPER[1]);
        p.px(x, y, PAPER[3]);
      }
      // the volley: folded paper shuriken spinning at the target
      for (let i = 0; i < NS; i++) {
        const a = t - VOLLEY - i * SG;
        if (a < 0 || a > 0.3) continue;
        const u = a / 0.3, x = b.handN[0] + (TX - 10 - b.handN[0]) * u, y = b.handN[1] + (-12 - (i % 5) * 9 - b.handN[1]) * u;
        for (let k = 0; k < 4; k++) {
          const aa = t * 25 + (k * TAU) / 4;
          p.tri(x, y, x + Math.cos(aa) * 4, y + Math.sin(aa) * 4, x + Math.cos(aa + 1.2) * 2, y + Math.sin(aa + 1.2) * 2, k % 2 ? PAPER[0] : PAPER[1]);
        }
      }
      // the wrapping: sheets winding round the target in bands
      if (t > WRAP) {
        const u = ease.outCubic(clamp((t - WRAP) / 0.4)), k = 1 - smooth(END - 0.6, END - 0.2, t);
        for (let i = 0; i < 6; i++) {
          const y = -46 + i * 7.5;
          p.arc(TX, y, 12, 3, t * 3 + i, t * 3 + i + 5.4 * u, i % 2 ? PAPER[0] : PAPER[1], k);
        }
      }
      ps.draw(p, "front");
    },
  };
});

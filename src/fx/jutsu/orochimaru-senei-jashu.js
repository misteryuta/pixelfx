// Sen'ei Jashu (Hidden Shadow Snake Hands, Orochimaru). Narutopedia: snakes summoned out from under the user's sleeve
// as a surprise, attacking or capturing by biting and constricting; they're long enough to strike from a good distance.
// Here: his yellow slit-pupilled eyes, an arm flung out, and snakes pour from the sleeve: four of them, writhing through
// the air in long S-curves, coil round the target and sink their fangs in, then slither back up the sleeve.
// New: the snakes (a tapering scaled body along a travelling wave, a head with eyes and a flicking tongue, coils
// wound round the target).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, FLING = OPEN + 0.15, OUT = 0.45, BITE = FLING + OUT + 0.05, HOLD = BITE + 0.9, BACK = HOLD + 0.35, END = BACK + 0.7, TX = 150;
const SN = ["#1e2a12", "#3a5a1e", "#6a8a2e", "#a8c858", "#f0d878"].map(hex);
const SNAKES = [{ y: -44, a: 0 }, { y: -32, a: 1.6 }, { y: -20, a: 3.1 }, { y: -8, a: 4.4 }];

export const meta = {
  name: "Hidden shadow snake hands",
  desc: "Orochimaru: his yellow slit eyes, an arm flung out, and snakes pour from the sleeve, writhing through the air to coil round the target and sink their fangs in, then slither back.",
  tags: ["jutsu", "orochimaru", "snake", "summoning", "control", "one-shot"],
  size: [250, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1e2a12", "#3a5a1e", "#6a8a2e", "#a8c858", "#f0d878"], seed: 65 },
};

const ARM = { ...READY, crouch: 4, lean: 6, fx: 21, fy: -26, bx: -6, by: -20, ffx: 10, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, { ...READY, crouch: 2, lean: -2 }],
    [FLING, ARM, "snap"],
    [HOLD, { ...ARM, lean: 4 }],
    [BACK, { ...ARM, fx: 14, lean: 0 }],
    [END, READY],
  ],
  hits: [
    { t: BITE, stop: 0.12, shake: 0.2, amp: 2, push: 1.5, straw: 18, skin: "poison" },
    ...[0.3, 0.6].map((d) => ({ t: BITE + d, stop: 0.02, flash: 0, push: -0.6, straw: 6, shiver: 0.6 })),
    { t: END - 0.2, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// a snake's spine: from the sleeve (sx, sy) out to the target, waving; reach 0..1 how far it has got
function spine(i, t, sx, sy, reach) {
  const s = SNAKES[i], ex = TX - 10, ey = s.y, pts = [];
  for (let k = 0; k <= 24; k++) {
    const u = (k / 24) * reach, x = sx + (ex - sx) * u, y = sy + (ey - sy) * u + Math.sin(u * 9 - t * 14 + s.a) * 6 * Math.sin(Math.PI * Math.min(1, u * 1.1));
    pts.push([x, y]);
  }
  return pts;
}

export const create = play([], (o) => {
  return {
    draw(p, t) {
      const b = bodyAt(act.poses, t), [sx, sy] = b.handN;
      drawBadge(p, t, { kind: "snake", t0: EYE, t1: OPEN, label: "SEN'EI JASHU", head: b.head });
      drawGlint(p, t, "snake", OPEN + 0.05, END - 0.2, b.head);
      if (t < FLING || t > BACK + 0.4) return;
      const reach = t < BITE ? ease.outCubic(clamp((t - FLING) / OUT)) : t < HOLD ? 1 : 1 - ease.inCubic(clamp((t - HOLD) / (BACK + 0.35 - HOLD)));
      SNAKES.forEach((s, i) => {
        const r = clamp(reach * (1.05 - i * 0.04));
        if (r <= 0) return;
        const pts = spine(i, t, sx, sy, r);
        // the body: thick at the head end's neck, tapering back into the sleeve; belly scales light, back dark
        for (let k = 1; k < pts.length; k++) {
          const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], w = 1 + 1.6 * (k / pts.length);
          p.beam(x0, y0 + 0.6, x1, y1 + 0.6, w + 0.8, SN[0]);
          p.beam(x0, y0, x1, y1, w, k % 3 === 0 ? SN[3] : SN[2]);
          p.line(x0, y0 - w * 0.4, x1, y1 - w * 0.4, SN[1]);
        }
        // coiled round the target while it bites
        if (t > BITE && t < HOLD + 0.1) for (let c = 0; c < 2; c++) p.arc(TX, s.y + 3 + c * 3, 12, 2, Math.PI * 0.6 + t, Math.PI * 1.9 + t, c ? SN[2] : SN[3]);
        // the head: a wedge with yellow eyes, the tongue flicking out
        const [hx, hy] = pts.at(-1), [px, py] = pts.at(-3), a = Math.atan2(hy - py, hx - px), c = Math.cos(a), sn = Math.sin(a);
        const T = (u, v) => [hx + c * u - sn * v, hy + sn * u + c * v];
        p.poly([T(-3, -3), T(4, -1.5), T(5, 0), T(4, 1.5), T(-3, 3)], SN[2]);
        p.line(...T(-3, -2.5), ...T(4, -1.2), SN[3]);
        p.px(...T(1, -1.6), SN[4]);
        if (Math.floor(t * 10 + i) % 3 === 0 && t < BITE) p.line(...T(5, 0), ...T(9, 0), hex("#d82a3a"));
      });
    },
  };
});

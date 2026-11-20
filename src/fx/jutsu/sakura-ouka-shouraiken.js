// Ouka Shouraiken (Cherry Blossom Impact, Sakura). Narutopedia: not just brute strength but medical-ninja chakra control:
// a dense charge of chakra gathered in the fist and let go the instant it hits, enough to crater the ground; Sakura's
// Byakugou seal, the diamond on her forehead, stores chakra for it. Here: the Byakugou diamond, her fist drawn back and
// glowing as the chakra packs into it, a leap, SHANNAROO, the fist driven into the floor; the ground cracks open in a
// line to the target and heaves up in tilted slabs under it, a ring of cherry petals blown out of the blast.
// New: the cracks racing out, the slabs heaving up and falling back, the petals. From the library: the ground slam.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import * as slam from "../impacts/ground-slam.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEAL = 0.05, CHARGE = 0.55, LEAP = CHARGE + 0.45, PUNCH = LEAP + 0.28, CRACK = 0.25, HEAVE = PUNCH + CRACK, END = PUNCH + 3.3, TX = 150, PX = 46;
const PINK = ["#6a1a3a", "#c8447a", "#f08ab4", "#ffd0e4", "#ffffff"].map(hex), ROCK = ["#2a2230", "#463a4a", "#6a5a66", "#8a7880"].map(hex);
// the slabs that heave up: centre x, width, tilt, how high
const SLABS = [[TX - 26, 22, -0.55, 30], [TX - 6, 24, 0.25, 42], [TX + 16, 22, 0.6, 32], [TX - 46, 16, -0.3, 16], [TX + 36, 16, 0.45, 18], [PX + 30, 12, -0.2, 10], [PX + 60, 14, 0.3, 14]];

export const meta = {
  name: "Cherry blossom impact",
  desc: "Sakura: the Byakugou diamond, a fist packed with chakra, a leap and SHANNAROO into the floor; cracks race to the target and the ground heaves up in tilted slabs under it, cherry petals blasting out.",
  tags: ["jutsu", "sakura", "taijutsu", "earth", "aoe", "melee", "one-shot"],
  size: [296, 172],
  origin: [74, 132],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#6a1a3a", "#c8447a", "#f08ab4", "#ffd0e4", "#ffffff"], seed: 64 },
};

const DRAWN = { ...READY, crouch: 7, lean: -4, fx: -8, fy: -24, bx: 12, by: -24, ffx: 10, fbx: -9 };
const AIR = { ...DRAWN, x: PX - 16, y: -22, crouch: 3, fx: -6, fy: -34, ffx: 6, ffy: -6 };
const DOWN = { ...READY, x: PX - 10, crouch: 15, lean: 18, fx: 14, fy: -1, bx: -8, by: -20, ffx: 10, fbx: -12 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CHARGE, DRAWN, "out"],
    [LEAP, { ...DRAWN, crouch: 10 }],
    [LEAP + 0.16, AIR, "out"],
    [PUNCH, DOWN, "in"],
    [END - 0.5, { ...DOWN, crouch: 12, lean: 12 }],
    [END, { ...READY, x: PX - 10 }],
  ],
  hits: [
    { t: PUNCH, stop: 0.16, shake: 0.6, amp: 5, target: false },
    { t: HEAVE, stop: 0.12, shake: 0.4, amp: 3, push: 5, straw: 36 },
  ],
  dust: [{ t: LEAP, x: 0, n: 8 }],
};

export const create = play([{ fx: slam, t: PUNCH, x: PX + 4, reach: 110, light: 0.5 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let p1 = false, p2 = false;
  return {
    update(t, dt) {
      if (!p1 && t >= PUNCH) {
        p1 = true;
        // petals blown out of the blast
        for (let i = 0; i < 40; i++) {
          const a = R.range(-Math.PI, 0), s = R.range(60, 200);
          ps.spawn(P.VAPOUR, PX + 4, -4, Math.cos(a) * s, Math.sin(a) * s, R.range(0.6, 1.2), PINK[R.int(2, 3)], R.range(1, 2));
        }
      }
      if (!p2 && t >= HEAVE) {
        p2 = true;
        for (let i = 0; i < 40; i++) ps.spawn(P.GRIT, TX + R.range(-40, 40), -2, R.range(-120, 120), -R.range(80, 260), R.range(0.6, 1.2), ROCK[R.int(1, 3)], R.chance(0.5) ? 2 : 1);
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      // the cracks: racing from the fist along the floor to the target, branching
      if (t > PUNCH) {
        const u = clamp((t - PUNCH) / CRACK), k = 1 - smooth(END - 0.6, END, t), x1 = PX + 4 + (TX + 40 - PX - 4) * u;
        let y = 0;
        for (let x = PX + 4; x < x1; x += 3) {
          const ny = clamp((noise2(x * 0.1, 0, 3) - 0.5) * 3, -1.5, 1.5);
          p.line(x, 0.5 + y, x + 3, 0.5 + ny, ROCK[0], k);
          y = ny;
        }
        p.ellipse(PX + 4, 0.5, 16, 2.5, ROCK[0], k);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "byakugou", t0: SEAL, t1: CHARGE, label: "BYAKUGOU", head: b.head });
      // the diamond, lit on her brow
      if (t > CHARGE) {
        p.px(hx + 1, hy - 3, PINK[1]);
        p.px(hx + 1, hy - 4, PINK[2]);
      }
      // the charged fist
      if (t > CHARGE && t < PUNCH + 0.1) {
        const k = smooth(CHARGE, CHARGE + 0.3, t), [fx, fy] = b.handN;
        p.glow(fx, fy, 14 * k, PINK[2], 0.8 * k);
        p.circle(fx, fy, 2.5 * k, PINK[3]);
        for (let i = 0; i < 3; i++) {
          const ph = ((t * 4 + i / 3) % 1);
          p.ring(fx, fy, 10 * (1 - ph), 1, PINK[2], ph);
        }
      }
      const a = t - PUNCH;
      if (a > -0.15 && a < 1.1) p.text("SHANNAROO!", PX + 10, -78, a < 0.04 && a > -0.02 ? WHITE : PINK[2], { font: "big", align: "center", outline: hex("#120c18") });
      // the slabs: tilting up out of the floor along the crack, highest under the target, then settling back
      if (t > PUNCH + 0.05) {
        for (const [i, [cx, w, tilt, h]] of SLABS.entries()) {
          const at = PUNCH + ((cx - PX) / (TX + 40 - PX)) * CRACK, up = ease.outBack(clamp((t - at) / 0.15), 2) * (1 - smooth(END - 0.9, END - 0.2, t)) * h;
          if (up <= 0.5) continue;
          const c = Math.cos(tilt), s = Math.sin(tilt), T = (u, v) => [cx + c * u - s * v, -up * 0.5 + s * u + c * v + up * 0.3];
          p.poly([T(-w / 2, -up / 2), T(w / 2, -up / 2), T(w / 2, up / 2), T(-w / 2, up / 2)], ROCK[1]);
          p.poly([T(-w / 2, -up / 2), T(w / 2, -up / 2), T(w / 2, -up / 2 + 2), T(-w / 2, -up / 2 + 2)], ROCK[3]);
          p.line(...T(-w / 2, -up / 2), ...T(-w / 2, up / 2), ROCK[0]);
        }
      }
      ps.draw(p, "front");
    },
  };
});

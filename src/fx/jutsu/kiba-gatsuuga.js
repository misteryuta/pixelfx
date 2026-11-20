// Gatsuuga (Fang Passing Fang, Kiba and Akamaru). Narutopedia: an Inuzuka and their ninken both perform the Passing
// Fang, spinning their bodies into drills and hitting the target with a series of rapid body blows; to stay in step they
// breathe as one, use the Four Legs technique and the Beast Human Clone, Akamaru turning into a copy of Kiba. Here: Kiba
// drops onto all fours with Akamaru beside him, the dog poofs into a second Kiba, both leap and spin into two grey-brown
// drills that corkscrew round each other across the floor and tear through the target one after the other.
// New: Akamaru (a little white dog), the drills (tapered cones of spinning bands with a wind sleeve), their twined paths.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as spark from "../impacts/hit-spark.js";
import { play, bodyAt, drawFigure, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const FOURS = 0.5, CLONE = FOURS + 0.25, LEAP = CLONE + 0.45, FLY = 0.4, HIT1 = LEAP + FLY, HIT2 = HIT1 + 0.12, PAST = HIT2 + 0.25, LAND = PAST + 0.2, END = LAND + 1.1, TX = 150, AX = 22, PX = TX + 40;
const DR = ["#3a3028", "#6a5a48", "#a08a6a", "#d8c8a8", "#ffffff"].map(hex), DOG = [hex("#f4f0e8"), hex("#c8c0b4"), hex("#5a3a2a")];

export const meta = {
  name: "Fang passing fang",
  desc: "Kiba: down on all fours with Akamaru, the dog poofs into a second Kiba, and both spin into drills that corkscrew round each other across the floor and tear through the target one after the other.",
  tags: ["jutsu", "kiba", "inuzuka", "taijutsu", "dash", "melee", "one-shot"],
  size: [290, 140],
  origin: [40, 112],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a3028", "#6a5a48", "#a08a6a", "#d8c8a8", "#ffffff"], seed: 62 },
};

export const actorAlpha = (t) => (t >= LEAP + 0.05 && t < LAND ? 0 : 1);

const FOURP = { ...READY, crouch: 15, lean: 22, fx: 14, fy: -2, bx: 8, by: -2, ffx: 4, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [FOURS, FOURP, "out"],
    [LEAP, { ...FOURP, crouch: 16 }],
    [LAND, { ...FOURP, x: PX, yaw: Math.PI, crouch: 13, lean: 16 }, "snap"],
    [END, { ...FOURP, x: PX, yaw: Math.PI, crouch: 12, lean: 14 }],
  ],
  hits: [
    { t: HIT1, stop: 0.08, shake: 0.25, amp: 2, push: 2.5, straw: 24 },
    { t: HIT2, stop: 0.12, shake: 0.35, amp: 3, push: 3.5, straw: 30 },
  ],
  dust: [{ t: LEAP, x: 0, n: 10, dir: -1 }, { t: LAND, x: PX, n: 8 }],
};

// the two drills: along the floor from their start to past the target, twined round a shared line
const drillAt = (i, t) => {
  const u = clamp((t - LEAP - i * 0.06) / (FLY + 0.35)), x0 = i ? AX : 4, x = x0 + (PX - x0) * ease.inOutQuad(u), ph = u * TAU * 2 + i * Math.PI;
  return { x, y: -20 + Math.sin(ph) * 9 - Math.sin(Math.PI * u) * 8, u, z: Math.cos(ph) };
};
function drill(p, x, y, t, k) {
  const L = 34, R0 = 10;
  p.shade(x - L - 2, y - R0 - 2, x + 6, y + R0 + 2, (px, py, out) => {
    // a cone, point forward, widest at the back: v is where across it the pixel is (-1 top .. 1 bottom)
    const d = x - px, w = R0 * Math.sqrt(Math.max(0, d) / L) * (d > L * 0.85 ? (L - d) / (L * 0.15) + 0.0 : 1);
    if (d < 0 || d > L || Math.abs(py - y) > w) return;
    const v = (py - y) / Math.max(0.5, w), z = Math.sqrt(Math.max(0, 1 - v * v));
    if (Math.abs(v) > 0.86) return DR[0];
    // the spiral grooves wrapping round it, turning fast; lit from above
    const band = Math.sin(d * 0.9 + Math.asin(Math.max(-1, Math.min(1, v))) * 3 - t * 70), lit = -v * 0.6 + z * 0.4 + band * 0.25;
    out.a = k;
    return lit > 0.55 ? DR[3] : lit > 0.2 ? DR[2] : lit > -0.2 ? DR[1] : DR[0];
  });
  // the sleeve of wind round it
  p.arc(x - 6, y, R0 + 3, 1, -1.2, 1.2, DR[4], 0.6 * k);
  p.arc(x - 14, y, R0 + 1, 1, -1.1, 1.1, DR[3], 0.5 * k);
}
function akamaru(p, x, y, t) {
  const bob = Math.floor(t * 6) & 1;
  p.ellipse(x, y - 6 - bob, 6, 3.6, DOG[0]);
  p.circle(x + 6, y - 9 - bob, 3.2, DOG[0]);
  p.ellipse(x + 9, y - 8 - bob, 2, 1.4, DOG[1]);
  p.px(x + 10.5, y - 8.5 - bob, DOG[2]);
  p.px(x + 7, y - 10 - bob, DOG[2]);
  p.tri(x + 4, y - 11 - bob, x + 5, y - 14 - bob, x + 6.5, y - 11 - bob, DOG[1]);
  for (const lx of [-4, -1, 3, 5]) p.rect(x + lx, y - 3, 1.4, 3, DOG[1]);
  p.line(x - 6, y - 7 - bob, x - 9, y - 10 - bob + bob * 2, DOG[0]);
}

export const create = play([{ fx: spark, t: HIT1, x: TX - 10, height: 24, seed: 3 }, { fx: spark, t: HIT2, x: TX - 10, height: 18, seed: 4 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      if (t > LEAP && t < PAST) for (let i = 0; i < 2; i++) if (R.chance(50 * dt)) {
        const q = drillAt(i, t);
        ps.spawn(P.DUST, q.x - 20, -1, -R.range(40, 100), -R.range(4, 30), R.range(0.3, 0.6), hex("#a08c7a"), R.range(2, 3), 0, 0);
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      if (t > LEAP && t < PAST + 0.1) for (let i = 0; i < 2; i++) {
        const q = drillAt(i, t);
        if (q.z < 0 && q.u < 1) drill(p, q.x, q.y, t, 1);
      }
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "inuzuka", t0: 0.05, t1: FOURS, label: "INUZUKA", head: b.head });
      // Akamaru beside him, then poofed into a second Kiba on all fours
      if (t < CLONE + 0.05) akamaru(p, AX, 0, t);
      else if (t < LEAP + 0.05) drawFigure(p, FOURP, AX, 0, { tint: hex("#f4f0e8"), k: 0.15 });
      drawPoof(p, AX, -10, t - CLONE, 1, 4);
      if (t > LEAP && t < PAST + 0.1) for (let i = 0; i < 2; i++) {
        const q = drillAt(i, t);
        if (q.z >= 0 && q.u < 1) drill(p, q.x, q.y, t, 1);
      }
      // at the end: Kiba, and Akamaru poofing back into a dog beside him
      if (t >= LAND) {
        drawPoof(p, PX + 20, -10, t - LAND, 1, 8);
        if (t > LAND + 0.1) akamaru(p, PX + 20, 0, t);
      }
      ps.draw(p, "front");
    },
  };
});

// Raiton: Raijuu Tsuiga (Lightning Release: Lightning Beast Tracking Fang, Kakashi Hatake). Narutopedia: Kakashi's own
// variation of the Lightning Blade: he shapes the Raikiri into a hound of lightning that runs ahead of him and keeps
// chasing the target, extending from his hand as long as he keeps feeding it. Here: the Sharingan; one hand grips his
// wrist, the Raikiri screeching to life in the palm; he thrusts it forward and the lightning stretches out of his hand
// into a running dog of crackling white-blue light, its legs flickering, the lightning tail still joined to his hand;
// it dodges round once (tracking) and bites into the target; the lightning crawls over it, then the hound bursts and
// the tail snaps back into his hand.
// New: the hound (a body of bolts: head with jaws, legs that cycle, a tail that is the leash of lightning).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt, drawChidori } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, CHARGE = 0.3, THRUST = 0.95, RUN = 1.0, TURN = 1.4, BITE = 1.75, BURST = 2.5, END = 3.3, TX = 190;
const LT = ["#061430", "#1a5aa0", "#5ab8ff", "#c8f0ff", "#ffffff"].map(hex);

export const meta = {
  name: "Lightning beast tracking fang",
  desc: "Kakashi: the Raikiri screeches to life in his palm; he thrusts it out and it stretches into a running hound of lightning, still leashed to his hand, that swerves after the target and bites into it before bursting.",
  tags: ["jutsu", "kakashi", "lightning", "raiton", "raikiri", "projectile", "one-shot"],
  size: [270, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#061430", "#1a5aa0", "#5ab8ff", "#c8f0ff"], seed: 183 },
};

const GRIP = { ...READY, crouch: 8, lean: 4, fx: 6, fy: -14, bx: 7, by: -16, ffx: 11, fbx: -11 };
const PUSH = { ...READY, crouch: 9, lean: 12, fx: 22, fy: -20, bx: 14, by: -22, ffx: 13, fbx: -12 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CHARGE, GRIP, "out"],
    [THRUST, PUSH, "snap"],
    [BURST, PUSH],
    [END, READY],
  ],
  hits: [
    { t: CHARGE, target: false, sfx: "thunder" },
    { t: THRUST, target: false, sfx: "whoosh" },
    { t: BITE, stop: 0.16, shake: 0.5, amp: 3, push: 4, straw: 30, skin: "shock", shiver: 1, sfx: "thunder" },
    { t: BURST, stop: 0.08, shake: 0.4, amp: 3, push: 6, straw: 20, sfx: "explosion" },
    { t: BURST + 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the hound's path: out along the floor, a swerve (tracking), then the leap onto the target
  const dogAt = (t) => {
    const u = clamp((t - RUN) / (BITE - RUN));
    const x = 30 + (TX - 16 - 30) * ease.inOutQuad(u), sw = Math.sin(clamp((t - TURN + 0.2) / 0.4) * Math.PI) * 18, y = -12 - sw * 0.5 - Math.sin(Math.max(0, u - 0.7) / 0.3 * Math.PI) * 14;
    return [x, y + (t > TURN - 0.2 && t < TURN + 0.2 ? -sw * 0.4 : 0)];
  };
  return {
    update(t, dt) {
      if (t > RUN && t < BURST && R.chance(40 * dt)) { const [x, y] = dogAt(Math.min(t, BITE)); ps.spawn(P.SPARK, x + R.range(-8, 8), y + R.range(-6, 6), R.range(-40, 40), R.range(-40, 20), R.range(0.1, 0.2), LT[R.int(2, 4)]); }
      if (t >= BITE && !this.b) { this.b = 1; lights.add(TX, -26, 100, LT[3], 0.8, 0.3); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 30);
      drawBadge(p, t, { kind: "kakashi", t0: EYE, t1: CHARGE, label: "RAIJUU TSUIGA", head: b.head });
      drawGlint(p, t, "kakashi", CHARGE, END - 0.3, b.head);
      const [hx, hy] = b.handN;
      if (t > CHARGE && t < THRUST + 0.1) drawChidori(p, hx, hy, t, LT, smooth(CHARGE, CHARGE + 0.2, t), f);
      // the hound: body, head with open jaws, flickering legs, all of crackling bolts; its tail the leash to his hand
      if (t > RUN && t < BURST) {
        const [x, y] = dogAt(Math.min(t, BITE)), k = 1 - smooth(BURST - 0.1, BURST, t), run = t * 18;
        p.glow(x, y, 24, LT[2], 0.5 * k);
        bolt(p, x - 14, y, x + 8, y - 2, f, LT, { jag: 0.3, seed: f, glow: 0.2 });
        bolt(p, x + 8, y - 2, x + 18, y - 6, f + 1, LT, { jag: 0.3, seed: f + 1, glow: 0.2 });
        p.poly([[x + 12, y - 8], [x + 22, y - 6], [x + 18, y - 3], [x + 22, y - 1], [x + 12, y]], LT[3], k);
        p.tri(x + 10, y - 8, x + 13, y - 8, x + 9, y - 14, LT[3], k);
        for (let i = 0; i < 4; i++) { const lx = x - 10 + (i % 2) * 16, ph = run + i * Math.PI * 0.5; bolt(p, lx, y + 1, lx + Math.sin(ph) * 5, y + 10, f + i + 3, LT, { jag: 0.4, seed: f + i, glow: 0 }); }
        bolt(p, hx, hy, x - 14, y, f + 7, LT, { jag: 0.25, seed: f + 7, glow: 0.3 });
      }
      if (t > BITE && t < BURST) for (let i = 0; i < 3; i++) bolt(p, TX - 8, -40 + i * 12, TX + 8, -34 + i * 12, f + i * 5, LT, { jag: 0.4, seed: f + i, glow: 0.2 });
      if (t > BURST && t < BURST + 0.3) { const v = (t - BURST) / 0.3; p.ring(TX - 10, -26, 6 + 30 * v, 2, LT[3], 1 - v); }
      void rand; void noise2; void TAU; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

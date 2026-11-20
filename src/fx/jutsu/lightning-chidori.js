// Chidori (one thousand birds). Narutopedia: seals Ox, Hare, Monkey; so much Raiton chakra is driven into one hand that
// it becomes visible, chirping like a thousand birds; the user then charges the enemy and drives the hand in. The wiki
// picture: the hand held low by the ground in a ball of white-blue arcs, the other hand gripping the wrist.
// Built from: the lightning kit (lightning/_lib: zigzag, crackle, scorch) for the ball in the hand and the arcs it
// throws, the toolkit's sparks, a furrow torn in the ground on the charge, and the library's zap hit and critical hit
// (recolored to lightning) on contact.
import { Particles, Lights, P, Rng, READY, fit, clamp, smooth, ease, rng, mix, WHITE, TAU, sparkle } from "../../core/index.js";
import * as zap from "../lightning/zap-hit.js";
import * as crit from "../impacts/crit-hit.js";
import { VOLT, PLASMA, zigzag, crackle, scorch } from "../lightning/_lib.js";
import { play, sealRun, drawSeals } from "./_lib.js";

const SEALS = sealRun(0.05, ["ushi", "u", "saru"], 0.13, { hold: 0.12, kind: "lightning" });
const GRIP = SEALS.end, DASH = GRIP + 0.75, ARRIVE = DASH + 0.3, BACK = ARRIVE + 0.85, TX = 140;
const REACH = TX - 22; // where the body stops: the hand goes in at the target
const VOLT_HIT = ["#120a33", "#2a1b78", "#4630c0", "#58a6ff", "#9ed8ff", "#e4f6ff", "#ffffff", "#ffffff"];

export const meta = {
  name: "Chidori",
  desc: "Raiton: Ox, Hare, Monkey, then a ball of shrieking lightning in the hand held low by the ground, a charge that tears a furrow in the floor, and the hand driven into the target.",
  tags: ["jutsu", "lightning", "raiton", "melee", "dash", "move", "one-shot"],
  size: [284, 120],
  origin: [40, 100],
  duration: BACK + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: VOLT, sparks: PLASMA, seed: 7 },
};

// the hand low at the side, the other hand clamped round the wrist; the charge, hand trailing low; the thrust
const LOW = { ...READY, crouch: 9, lean: 6, fx: 6, fy: -9, bx: 8, by: -12, armsFront: true, ffx: 9, fbx: -10 };
const RUN = { ...LOW, crouch: 7, lean: 10, fx: -2, fy: -10, bx: 9, by: -22, ghost: 1, ffx: 12, fbx: -12 };
const STAB = { ...READY, crouch: 5, lean: 8, fx: 17, fy: -21, bx: -6, by: -22, ffx: 13, fbx: -11, toeB: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [GRIP + 0.1, LOW],
    [DASH - 0.03, { ...LOW, crouch: 10 }],
    [DASH, { ...RUN, x: 0 }, "snap"],
    [ARRIVE - 0.04, { ...RUN, x: REACH - 4 }, "line"],
    [ARRIVE, { ...STAB, x: REACH }, "snap"],
    [ARRIVE + 0.45, { ...STAB, x: REACH, crouch: 6 }],
    [BACK, { ...READY, x: REACH - 30 }, "out"],
    [meta.duration, { ...READY, x: REACH - 30 }],
  ],
  hits: [{ t: ARRIVE, stop: 0.2, shake: 0.4, amp: 3, push: 4, straw: 34, skin: "shock", shiver: 1, y: -21 }],
  dust: [{ t: DASH, x: 0, n: 8, dir: -1 }, { t: ARRIVE, x: REACH + 4, n: 6, dir: 1 }],
};

// where the hand with the Chidori is at time t (body x plus the pose's hand)
function hand(t) {
  if (t < DASH) return [6, -9];
  if (t < ARRIVE) {
    const u = clamp((t - DASH) / (ARRIVE - DASH - 0.04));
    return [u * (REACH - 4) - 2, -10];
  }
  return [REACH + 17, -21];
}

export const create = play(
  [
    { fx: zap, t: ARRIVE - 0.02, x: TX - 6, y: -21 },
    { fx: crit, t: ARRIVE, x: TX - 6, height: 21, palette: VOLT_HIT, light: 0.8 },
  ],
  (o) => {
    const C = fit(o.palette, 8), R = new Rng(o.seed), floor = () => 0, lights = new Lights();
    const ps = new Particles({ rng: R, ground: floor, sparks: o.sparks });
    let hitDone = false;
    const live = (t) => t > GRIP && t < ARRIVE + 0.35;
    return {
      update(t, dt) {
        if (live(t)) {
          const [hx, hy] = hand(t), k = smooth(GRIP, GRIP + 0.3, t);
          // the chirping: sparks spat off the ball in every direction, more as it builds
          if (R.chance(45 * dt * k)) {
            const a = R.range(0, TAU), sp = R.range(80, 220);
            ps.spawn(P.SPARK, hx, hy, Math.cos(a) * sp, Math.sin(a) * sp - 40, R.range(0.1, 0.3));
          }
          // held low, it chews the floor; on the charge it tears a furrow along it
          if (hy > -14 && R.chance((t > DASH ? 90 : 18) * dt)) ps.spawn(P.SPARK, hx + R.range(-3, 3), -1, R.range(-120, 40), -R.range(30, 140), R.range(0.12, 0.35));
          if (R.chance(6 * dt)) lights.add(hx, hy, 30, C[5], 0.5, 0.08);
        }
        if (!hitDone && t >= ARRIVE) {
          hitDone = true;
          lights.add(TX - 6, -21, 90, C[5], 1, 0.25);
          lights.add(TX - 6, -21, 24, WHITE, 0.9, 0.06);
          for (let j = 0; j < 30; j++) {
            const a = R.range(-1.3, 1.3), sp = R.range(100, 320);
            ps.spawn(P.SPARK, TX - 4, -21, Math.cos(a) * sp, Math.sin(a) * sp - 50, R.range(0.15, 0.45));
          }
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p, t) {
        // the furrow: a burnt line the hand dragged along the floor, glowing where it was cut and cooling behind
        if (t > DASH) {
          const x1 = Math.min(hand(t)[0], REACH), cool = t - ARRIVE;
          for (let x = 0; x < x1; x += 2) {
            const age = (x1 - x) / 180 + Math.max(0, cool);
            scorch(p, x, 0, 2, clamp(1 - age * 0.9), 1 - smooth(0.8, 1.8, cool), 1.2);
          }
        }
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, C.slice(2));
        if (live(t)) {
          const [hx, hy] = hand(t), f = Math.floor(t * 30 + 1e-4), k = smooth(GRIP, GRIP + 0.3, t) * (1 - smooth(ARRIVE + 0.1, ARRIVE + 0.35, t));
          const r2 = rng(o.seed, 3, f), R0 = 4 + 1.5 * Math.sin(t * 50);
          // the ball: a white heart in a pale blue shell, arcs thrown out of it every frame, longer as it peaks
          for (let j = 0; j < 7; j++) {
            const a = r2.range(0, TAU), L = r2.range(6, 16) * (0.6 + 0.4 * k);
            crackle(p, zigzag(r2, hx, hy, hx + Math.cos(a) * L, hy + Math.sin(a) * L * 0.8, 0.45, 0.5), r2.range(0.5, 0.95) * k, C, 0.3);
          }
          p.circle(hx, hy, R0 + 1.5, C[4], 0.8 * k);
          p.circle(hx, hy, R0, C[6]);
          p.circle(hx, hy, R0 * 0.55, WHITE);
          p.glow(hx, hy, 34, C[4], 0.7 * k);
          p.glow(hx, hy, 12, C[6], 0.6 * k);
          // on the charge: arcs streaming back off the hand like a tail of lightning
          if (t > DASH && t < ARRIVE)
            for (let j = 0; j < 3; j++) crackle(p, zigzag(r2, hx, hy, hx - r2.range(18, 34), hy + r2.range(-6, 4), 0.25, 0.4), 0.7, C, 0.35);
          if (t - ARRIVE > 0 && t - ARRIVE < 0.12) sparkle(p, hx, hy, Math.round(16 * (1 - (t - ARRIVE) / 0.12)), WHITE, C[5], 0.8);
        }
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);

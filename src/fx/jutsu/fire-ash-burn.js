// Katon: Haisekishou (burning ash pile). Narutopedia: seals Snake, Rat, Tiger; Asuma breathes a cloud of hot ash out
// of his mouth that wraps the enemy, then clicks his teeth together and the cloud catches and explodes. The Katon page
// lists hot ash as its own variant of fire release.
// Built from: the toolkit's smoke particles for the ash (grey, warm-lit, with live embers in it), a spark that runs
// through the cloud like a fuse, flame bursts all through it, and the library's small explosion at the target.
import { Particles, Lights, P, PF, Rng, READY, fit, clamp, smooth, mix, hex, WHITE, TAU, sparkle } from "../../core/index.js";
import * as blast from "../explosions/small-explosion.js";
import { play, sealRun, drawSeals, MOUTH } from "./_lib.js";

const SEALS = sealRun(0.05, ["mi", "ne", "tora"], 0.13, { hold: 0.12 });
const DRAW = SEALS.end, BLOW = DRAW + 0.3, POUR = 1.0, CLICK = BLOW + POUR + 0.35, FUSE = 0.32, TX = 132;
const [MX, MY] = [MOUTH[0] + 2, MOUTH[1] + 1];
const ASH = ["#2a2428", "#3e3538", "#55494a", "#6e6060", "#8c7c78"].map(hex);
const IGNITE = CLICK + FUSE;

export const meta = {
  name: "Burning ash",
  desc: "Katon: Snake, Rat, Tiger, a cloud of hot grey ash breathed out over the target, a click of the teeth, and a spark runs through the cloud and it all goes up in flame.",
  tags: ["jutsu", "fire", "katon", "ash", "move", "one-shot"],
  size: [310, 210],
  origin: [50, 176],
  duration: IGNITE + 5.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"], seed: 6 },
};

const FILL = { ...READY, crouch: 3, lean: -5, fx: 6, fy: -26, bx: 9, by: -25, armsFront: true, ffx: 8, fbx: -8 };
const BREATHE = { ...READY, crouch: 4, lean: 6, fx: 11, fy: -24, bx: -4, by: -22, ffx: 11, fbx: -10 };
// the click: the jaw snaps shut, the head jerks, a fist closes
const SNAP = { ...BREATHE, lean: 2, crouch: 3, fx: 8, fy: -27, bx: 4, by: -26, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [DRAW + 0.08, FILL],
    [BLOW - 0.03, { ...FILL, lean: -7 }],
    [BLOW, BREATHE, "snap"],
    [BLOW + POUR, { ...BREATHE, lean: 8, crouch: 5 }],
    [CLICK - 0.05, { ...BREATHE, lean: 3 }],
    [CLICK, SNAP, "snap"],
    [IGNITE + 0.8, { ...SNAP, crouch: 4 }],
    [IGNITE + 1.4, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: IGNITE, stop: 0.18, shake: 0.45, amp: 3, push: 3.4, straw: 36, skin: "char" },
    { t: meta.duration - 0.6, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: BLOW, x: 12, n: 4, dir: 1 }],
};

export const create = play([{ fx: blast, t: IGNITE + 0.08, x: TX, size: 0.7, light: 0.8 }], (o) => {
  const F = fit(o.palette, 9), R = new Rng(o.seed + 5), floor = () => 0, lights = new Lights();
  const smoke = new Particles({ rng: R, ground: floor }), fire = new Particles({ rng: R, ground: floor });
  const embers = [];
  let lit = false;
  // the cloud's footprint, where it settles round the target
  const CX = TX - 16, CW = 40, CY = -20, CH = 22;
  return {
    update(t, dt) {
      // pouring: soft grey puffs blown out of the mouth that drift to the target and swell round it
      if (t > BLOW && t < BLOW + POUR) {
        for (let j = 0; j < Math.max(1, Math.round(70 * dt)); j++) {
          const tx = CX + R.range(-CW, CW) * 0.8, ty = CY + R.range(-CH, CH) * 0.7, T = R.range(0.5, 0.9);
          smoke.spawn(P.SMOKE, MX + 2, MY + R.range(-1, 2), (tx - MX) / T * 0.9, (ty - MY) / T * 0.6, R.range(2.6, 3.8) + (IGNITE - t), ASH[R.int(1, 4)], R.range(6, 11), 0, PF.BIG);
          if (R.chance(0.35)) embers.push({ x: MX + 2, y: MY, vx: (tx - MX) / T, vy: (ty - MY) / T * 0.6, life: R.range(1.4, 2.6) + (IGNITE - t), ph: R.range(0, TAU) });
        }
      }
      // the click: a spark at the teeth, then the fuse runs along the cloud
      if (!lit && t >= IGNITE) {
        lit = true;
        lights.add(CX, CY, 120, F[5], 0.9, 0.35);
        lights.add(CX, CY, 30, WHITE, 0.8, 0.08);
      }
      if (t > CLICK && t < IGNITE + 0.6) {
        const u = clamp((t - CLICK) / FUSE), fx = MX + (CX + CW - MX) * u;
        if (t < IGNITE && R.chance(50 * dt)) fire.spawn(P.SPARK, fx, MY + (CY - MY) * u + R.range(-4, 4), R.range(-60, 120), R.range(-80, 40), R.range(0.1, 0.3), F[R.int(6, 8)]);
        // ignition: flame bursts all through the cloud, cooling into its own black smoke
        if (t >= IGNITE)
          for (let j = 0; j < Math.max(1, Math.round(160 * dt)); j++) {
            const x = CX + R.range(-CW, CW), y = CY + R.range(-CH, CH) * 1.1;
            fire.spawn(P.FIRE, x, y, R.range(-30, 30), -R.range(20, 70), R.range(0.35, 0.8), 0, R.range(3, 6), 0, R.chance(0.5) ? PF.SMOKES | PF.BIG : 0);
          }
      }
      for (let j = embers.length - 1; j >= 0; j--) {
        const e = embers[j];
        e.vx *= 1 - 2.2 * dt;
        e.vy = e.vy * (1 - 2.2 * dt) - 3 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.life -= dt;
        if (e.life <= 0 || (lit && t > IGNITE + 0.15)) embers.splice(j, 1);
      }
      smoke.update(dt);
      fire.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      smoke.draw(p, "back");
      fire.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, F.slice(2));
      smoke.draw(p, "front");
      // embers smouldering inside the ash: the heat it carries
      for (const e of embers) {
        const k = 0.5 + 0.5 * Math.sin(t * 9 + e.ph);
        p.px(e.x, e.y, k > 0.7 ? F[6] : F[4]);
        p.glow(e.x, e.y, 4, F[4], 0.25 * k);
      }
      // the teeth click: a glint at the mouth, the spark racing along the cloud
      const c = t - CLICK;
      if (c > 0 && c < 0.12) sparkle(p, MX + 1, MY, Math.round(7 * (1 - c / 0.12)), WHITE, F[6], 0.7);
      if (c > 0 && t < IGNITE) {
        const u = clamp(c / FUSE), fx = MX + (CX + CW - MX) * u, fy = MY + (CY - MY) * u;
        p.circle(fx, fy, 1.5, F[7]);
        p.glow(fx, fy, 14, F[5], 0.7);
      }
      fire.draw(p, "front");
      lights.draw(p);
    },
  };
});

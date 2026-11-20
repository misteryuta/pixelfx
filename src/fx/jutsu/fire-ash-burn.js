// Katon: Haisekishou (burning ash pile). Narutopedia: seals Snake, Rat, Tiger; Asuma breathes a cloud of hot ash out
// of his mouth that wraps the enemy, then clicks his teeth together and the cloud catches and explodes. The Katon page
// lists hot ash as its own variant of fire release.
// Built from: the toolkit's smoke particles for the ash (grey, warm-lit, with live embers in it), a spark that runs
// through the cloud like a fuse, flame bursts all through it, and the library's small explosion at the target.
import { Particles, Lights, P, PF, Rng, READY, fit, clamp, smooth, mix, hex, WHITE, TAU, sparkle } from "../../core/index.js";
import * as blast from "../explosions/small-explosion.js";
import { play, sealRun, drawSeals, MOUTH } from "./_lib.js";

const SEALS = sealRun(0.05, ["mi", "ne", "tora"], 0.13, { hold: 0.12, kind: "fire" });
const DRAW = SEALS.end, BLOW = DRAW + 0.3, POUR = 1.0, CLICK = BLOW + POUR + 0.75, FUSE = 0.32, TX = 132;
const [MX, MY] = [MOUTH[0] + 2, MOUTH[1] + 1];
const ASH = ["#2a2428", "#3e3538", "#55494a", "#6e6060", "#8c7c78"].map(hex);
const IGNITE = CLICK + FUSE;

export const meta = {
  name: "Burning ash",
  desc: "Katon: Snake, Rat, Tiger, a cloud of hot grey ash breathed out over the target, a click of the teeth, and a spark runs through the cloud and it all goes up in flame.",
  tags: ["jutsu", "fire", "katon", "ash", "move", "one-shot"],
  size: [310, 224],
  origin: [50, 190],
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

export const create = play([{ fx: blast, t: IGNITE + 0.22, x: TX, size: 0.75, light: 0.8 }], (o) => {
  const F = fit(o.palette, 9), R = new Rng(o.seed + 5), floor = () => 0, lights = new Lights();
  const fire = new Particles({ rng: R, ground: floor });
  // the ash: puffs that fly from the mouth to the target, then swirl round it on a ring (in front of and behind it)
  // that tightens as more pour in, until the target is wholly wrapped; lit, they each go up in turn round the ring
  const puffs = [];
  const YC = -20;
  let lit = false;
  const ringR = (t) => 30 - 8 * smooth(BLOW + 0.4, CLICK, t);
  const where = (q, t) => {
    if (t < q.arrive) {
      const u = (t - q.t0) / (q.arrive - q.t0), ex = TX - ringR(t), ey = YC + q.h;
      return { x: MX + (ex - MX) * u, y: MY + (ey - MY) * u - 10 * Math.sin(Math.PI * u) + Math.sin(u * 9 + q.ph) * 2, front: true, s: 0.5 + 0.5 * u };
    }
    const th = Math.PI + (t - q.arrive) * q.w, rr = ringR(t) * q.rr;
    return { x: TX + Math.cos(th) * rr, y: YC + q.h + Math.sin(th) * 3, front: Math.sin(th) > 0, s: 1, th };
  };
  const drawPuff = (p, q, t) => {
    const w = where(q, t), r = q.size * w.s * (1 + 0.25 * smooth(q.arrive, CLICK, t));
    const burn = q.ign && t > q.ign ? clamp((t - q.ign) / 0.12) : 0;
    if (burn >= 1) return;
    p.disc(w.x, w.y, r, (d) => (burn > 0 ? (d < 0.5 ? F[6] : F[4]) : d < 0.45 ? ASH[3] : ASH[2]), (d) => (0.82 - 0.4 * burn) * (1 - d * d));
    p.disc(w.x - r * 0.2, w.y - r * 0.35, r * 0.5, ASH[4], (d) => 0.35 * (1 - d) * (1 - burn));
    // embers carried in the ash, glowing and fading
    if ((Math.floor(t * 8 + q.ph * 3) & 3) === 0) {
      p.px(w.x + Math.cos(q.ph) * r * 0.4, w.y + Math.sin(q.ph * 1.7) * r * 0.4, F[6]);
      p.glow(w.x, w.y, 5, F[4], 0.2);
    }
  };
  return {
    update(t, dt) {
      if (t > BLOW && t < BLOW + POUR)
        for (let j = 0; j < Math.max(1, Math.round(46 * dt)); j++) {
          const fly = R.range(0.4, 0.6);
          puffs.push({ t0: t, arrive: t + fly, h: R.range(-21, 13), w: R.range(3.6, 5.2), rr: R.range(0.75, 1.15), size: R.range(5, 9), ph: R.range(0, TAU), ign: 0 });
        }
      // the click: the fuse races from the teeth to the cloud, then the fire runs round the ring
      if (!lit && t >= IGNITE) {
        lit = true;
        for (const q of puffs) {
          const w = where(q, IGNITE), th = w.th ?? Math.PI;
          q.ign = IGNITE + (((th - Math.PI) % TAU) + TAU) % TAU / TAU * 0.22 + R.range(0, 0.04);
        }
        lights.add(TX, YC, 120, F[5], 0.9, 0.4);
        lights.add(TX, YC, 30, WHITE, 0.8, 0.08);
      }
      if (t > CLICK && t < IGNITE && R.chance(50 * dt)) {
        const u = clamp((t - CLICK) / FUSE), fx = MX + (TX - 26 - MX) * u;
        fire.spawn(P.SPARK, fx, MY + (YC - MY) * u + R.range(-3, 3), R.range(-60, 120), R.range(-80, 40), R.range(0.1, 0.3), F[R.int(6, 8)]);
      }
      for (const q of puffs)
        if (q.ign && t >= q.ign && !q.boom) {
          q.boom = true;
          const w = where(q, t);
          for (let j = 0; j < 3; j++) fire.spawn(P.FIRE, w.x + R.range(-3, 3), w.y + R.range(-3, 3), R.range(-40, 40), -R.range(20, 80), R.range(0.35, 0.75), 0, q.size * R.range(0.6, 1), 0, (R.chance(0.5) ? PF.SMOKES | PF.BIG : 0) | (w.front ? 0 : PF.BACK));
          if (R.chance(0.4)) fire.spawn(P.SPARK, w.x, w.y, R.range(-160, 160), -R.range(40, 200), R.range(0.2, 0.5), F[R.int(6, 8)]);
        }
      fire.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      for (const q of puffs) if (t >= q.arrive && !where(q, t).front) drawPuff(p, q, t);
      fire.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, F.slice(2));
      for (const q of puffs) if (t < q.arrive || where(q, t).front) drawPuff(p, q, t);
      const c = t - CLICK;
      if (c > 0 && c < 0.12) sparkle(p, MX + 1, MY, Math.round(7 * (1 - c / 0.12)), WHITE, F[6], 0.7);
      if (c > 0 && t < IGNITE) {
        const u = clamp(c / FUSE), fx = MX + (TX - 26 - MX) * u, fy = MY + (YC - MY) * u;
        p.circle(fx, fy, 1.5, F[7]);
        p.glow(fx, fy, 14, F[5], 0.7);
      }
      fire.draw(p, "front");
      lights.draw(p);
    },
  };
});

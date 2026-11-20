// Doton: Yomi Numa (swamp of the underworld). Narutopedia: seals Boar, Tiger; a wide stretch of ground turns into
// swamp and everything on it sinks; its size and depth depend on the chakra put in. The wiki picture: a brown,
// churning bog opened round the enemy. Earth jutsu often end with the hands on the ground: here the chakra runs from
// the palms through the soil to the target, and the floor under it goes to mud.
// Built from: a new swamp (an oval of mud churning with noise, its rim cracking open), mud swallowing the target from
// the feet up, the water kit's beads (recolored to mud) for the splashes, and the toolkit's grit and bubbles' pops.
import { Particles, Lights, P, Rng, READY, fit, clamp, smooth, ease, hex, noise2, WHITE, TAU } from "../../core/index.js";
import { bead } from "../water/_lib.js";
import { play, sealRun, drawSeals } from "./_lib.js";

const SEALS = sealRun(0.05, ["i", "tora"], 0.14, { hold: 0.2, kind: "earth" });
const SLAM = SEALS.end + 0.3, RUN = 0.4, OPEN = SLAM + RUN, SPREAD = 0.6, SINK = OPEN + 0.25, DEEP = 2.0, TX = 136;
const PALMS = 14, RX = 36, RY = 6;
const MUD = ["#1a120c", "#2c1e14", "#43301f", "#5c432b", "#7a5a3a", "#9a7650", "#c4a070"];

export const meta = {
  name: "Swamp of the underworld",
  desc: "Doton: Boar, Tiger, both palms on the ground, a seam of chakra running through the soil, and the floor under the target turns to churning mud that swallows it to the chest.",
  tags: ["jutsu", "earth", "doton", "mud", "trap", "move", "one-shot"],
  size: [260, 110],
  origin: [40, 90],
  duration: SINK + DEEP + 2.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: MUD, seed: 18 },
};

const RAISE = { ...READY, crouch: 1, lean: -3, fx: 4, fy: -38, bx: 9, by: -37, ffx: 8, fbx: -7 };
const PRESS = { ...READY, x: 5, crouch: 11, lean: 10, fx: PALMS, fy: -1, bx: PALMS + 2, by: -2, ffx: 10, fbx: -9, toeB: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SLAM - 0.12, RAISE],
    [SLAM, PRESS, "snap"],
    [SINK + DEEP, { ...PRESS, lean: 11 }],
    [SINK + DEEP + 0.7, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: SLAM, stop: 0.08, shake: 0.2, amp: 2, target: false },
    { t: OPEN, stop: 0.06, shake: 0.15, amp: 1, push: 0.6, straw: 6 },
    { t: OPEN + 0.6, stop: 0, flash: 0, push: -0.8, straw: 4 },
    { t: OPEN + 1.2, stop: 0, flash: 0, push: 0.8, straw: 4 },
  ],
  dust: [{ t: SLAM, x: PALMS, n: 8 }],
};

const spread = (t) => ease.outCubic(clamp((t - OPEN) / SPREAD)) * (1 - smooth(SINK + DEEP + 0.6, SINK + DEEP + 1.4, t));
// how deep the target has sunk: the mud's surface on its body, in px above the floor
const sink = (t) => 22 * ease.inOutSine(clamp((t - SINK) / DEEP)) * (1 - smooth(SINK + DEEP + 0.6, SINK + DEEP + 1.4, t));

export const create = play([], (o) => {
  const C = MUD.map(hex), R = new Rng(o.seed), floor = () => 0, lights = new Lights();
  const ps = new Particles({ rng: R, ground: floor }), beads = [], bubbles = [];
  const add = (x, y, vx, vy, s, life) => beads.push({ x, y, vx, vy, s, life });
  return {
    update(t, dt) {
      // the seam runs out from the palms: soil heaving along it
      if (t > SLAM && t < OPEN && R.chance(40 * dt)) {
        const x = PALMS + (TX - PALMS) * clamp((t - SLAM) / RUN);
        ps.spawn(P.GRIT, x, -1, R.range(-20, 30), -R.range(20, 80), R.range(0.4, 0.8), C[R.int(3, 5)], 1);
      }
      const s = spread(t);
      if (s > 0.05) {
        // the bog churns: bubbles rise and burst, mud slops up
        if (R.chance(14 * dt * s)) bubbles.push({ x: TX + R.range(-RX, RX) * s * 0.8, r: R.range(1.5, 3.5), age: 0, life: R.range(0.4, 0.8) });
        if (R.chance(10 * dt * s)) add(TX + R.range(-RX, RX) * s * 0.7, -1, R.range(-40, 40), -R.range(60, 140), R.chance(0.4) ? 2 : 1, R.range(0.4, 0.8));
      }
      if (t >= OPEN && t < OPEN + 0.05)
        for (let j = 0; j < 24; j++) add(TX + R.range(-10, 10), -2, R.range(-90, 90), -R.range(80, 200), R.chance(0.3) ? 3 : 2, R.range(0.5, 1));
      for (let j = bubbles.length - 1; j >= 0; j--) {
        const b = bubbles[j];
        if ((b.age += dt) > b.life) {
          for (let k = 0; k < 3; k++) add(b.x, -1, R.range(-30, 30), -R.range(30, 80), 1, R.range(0.3, 0.5));
          bubbles.splice(j, 1);
        }
      }
      for (let j = beads.length - 1; j >= 0; j--) {
        const q = beads[j];
        q.vy += 520 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.life -= dt;
        if (q.y >= 0 || q.life <= 0) beads.splice(j, 1);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the seam: a dark crack through the soil from the palms, a faint warm glow running along it
      if (t > SLAM) {
        const x1 = PALMS + (TX - RX * 0.6 - PALMS) * clamp((t - SLAM) / RUN), fade = 1 - smooth(SINK + DEEP, SINK + DEEP + 1, t);
        p.line(PALMS, 0, x1, 0, C[0], fade);
        if (t < OPEN + 0.3) p.glowLine(PALMS, -1, x1, -1, 6, C[5], 0.3);
      }
      // the bog: an oval of mud churning on the floor, darker in its depths, a lit wet sheen, a cracked rim
      const s = spread(t);
      if (s > 0.02) {
        const rx = RX * s, ry = RY * s + 0.5;
        p.shade(TX - rx - 2, -ry - 2, TX + rx + 2, ry + 2, (x, y, out) => {
          const dx = (x - TX) / rx, dy = y / ry, d = dx * dx + dy * dy;
          if (d > 1) return;
          const n = noise2(x * 0.18 + t * 0.8, y * 0.5 - t * 1.4, 4);
          const depth = 1 - d;
          out.c = d > 0.86 ? C[4] : n > 0.35 && depth > 0.3 ? C[3] : depth > 0.55 ? C[0] : depth > 0.25 ? C[1] : C[2];
          if (n > 0.6 && dy < -0.2) out.c = C[5];
        });
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C.slice(2));
      // the palms pressing chakra into the ground
      if (t > SLAM && t < OPEN + 0.4) p.glow(PALMS + 1, -1, 14, C[5], 0.35);
      // the target going under: mud standing up round it to the depth it has sunk, its top slopping
      const h = sink(t);
      if (h > 0.5)
        p.shade(TX - 20, -h - 3, TX + 20, 1, (x, y, out) => {
          // a mound of mud heaped round the body, slopping, steep near it and spreading out into the bog
          const dx = Math.abs(x - TX), top = -h * Math.max(0, 1 - Math.pow(Math.max(0, dx - 6) / 14, 1.4)) + Math.sin(x * 0.7 + t * 6) * 0.8;
          if (top > -0.5) return;
          if (y < top) return;
          out.c = y < top + 1 ? C[4] : y < top + 2.5 ? C[3] : noise2(x * 0.3, y * 0.3 + t, 2) > 0.3 ? C[2] : C[1];
        });
      for (const b of bubbles) {
        const k = b.age / b.life, r = b.r * (0.4 + 0.6 * k);
        p.ring(b.x, -r * 0.6, r, 1, C[5]);
        p.px(b.x - r * 0.4, -r, C[6]);
      }
      for (const q of beads) bead(p, q.x, q.y, q.vx, q.vy, q.s, [C[0], C[0], C[1], C[2], C[3], C[3], C[4], C[5]], clamp(q.life / 0.2));
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

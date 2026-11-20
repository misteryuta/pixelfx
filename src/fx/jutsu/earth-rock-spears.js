// Earth release: both palms slammed to the floor send a seam of chakra racing through the ground, and stone spears
// ram up along it one after another, each taller than the last, the tallest under the target. The spears are the
// library's earth spike, played six times along the seam at growing heights and staggered so each one breaks
// through the moment the seam reaches it; the seam, the shudder and the palms' glow are new.
import { Particles, Lights, P, Rng, READY, fit, clamp, smooth, ease, mix, hex, WHITE } from "../../core/index.js";
import * as spike from "../nature/earth-spike.js";
import { play, sealRun, drawSeals } from "./_lib.js";

// Doton: Doryuusou (Narutopedia): the Bird seal, then many rock spears grow out of the ground; earth jutsu often end
// with the hands slammed onto the floor.
const SEALS = sealRun(0.05, ["tori"], 0.12, { hold: 0.3, kind: "earth" });
const SLAM = SEALS.end + 0.4, STEP = 0.085, UP = 0.34, TX = 126;
const SPEARS = [
  { x: 32, h: 15 },
  { x: 50, h: 19 },
  { x: 68, h: 24 },
  { x: 86, h: 30 },
  { x: 105, h: 38 },
  { x: TX, h: 52 },
];
const start = (i) => SLAM + 0.02 + i * STEP;
const ram = (i) => start(i) + UP;
const PALMS = 14;

export const meta = {
  name: "Rock spears",
  desc: "Earth release: seals, both palms slammed to the floor, and a glowing seam races out as stone spears ram up along it, each taller than the last, the tallest under the target.",
  tags: ["jutsu", "earth", "move", "ground", "spike", "one-shot"],
  size: [366, 150],
  origin: [82, 134],
  duration: ram(5) + 3.1,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#120c0c", "#251917", "#3b2a24", "#553d31", "#715440", "#8f6e52", "#b8966e", "#e6d0a8"],
    glow: ["#4a1a0c", "#a8401a", "#ff8a2a", "#ffd27a", "#fff4d0"],
    seed: 2,
  },
};

const RAISE = { ...READY, crouch: 1, lean: -3, fx: 4, fy: -38, bx: 9, by: -37, ffx: 8, fbx: -7 };
const SLAMMED = { ...READY, x: 5, crouch: 11, lean: 9, fx: PALMS, fy: -1, bx: PALMS + 2, by: -2, ffx: 10, fbx: -9, toeB: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SEALS.end + 0.08, RAISE],
    [SLAM - 0.04, { ...RAISE, y: -1, crouch: 0 }],
    [SLAM, SLAMMED, "snap"],
    [ram(5), { ...SLAMMED, lean: 10 }],
    [ram(5) + 0.6, { ...SLAMMED, x: 3, crouch: 9, lean: 8, fy: -5, by: -5 }],
    [ram(5) + 1.3, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: SLAM, stop: 0.1, shake: 0.2, amp: 2, target: false },
    { t: ram(4), stop: 0.03, flash: 0, push: -0.8, straw: 6 },
    { t: ram(5), stop: 0.16, shake: 0.32, amp: 3, push: -3.4, straw: 34, y: -12 },
  ],
  dust: [{ t: SLAM, x: 14, n: 9 }],
};

// where the seam's front is at time t: it reaches each spear's spot just as that spear breaks through
function front(t) {
  const pts = [[SLAM, PALMS], ...SPEARS.map((s, i) => [ram(i) - 0.02, s.x])];
  if (t <= SLAM) return PALMS;
  for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (t - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0]);
  return SPEARS[5].x;
}

export const create = play(
  // six of the library spike would glow like a forge: the small ones get a dim, earthy glow ramp and less light,
  // only the last (under the target) keeps the full light of its break-through
  SPEARS.map((s, i) => ({ fx: spike, t: start(i), x: s.x, height: s.h, seed: 5 + i * 3, light: i === 5 ? 0.7 : 0.3, glow: i === 5 ? ["#3a1e10", "#8a4a20", "#d08a3a", "#f0c070", "#fff0d0"] : ["#24160e", "#4e3020", "#80552e", "#b08850", "#d8c090"] })),
  (o) => {
    const S = fit(o.palette, 8), G = fit(o.glow, 5), R = new Rng(o.seed + 11), floor = () => 0, DUST = mix(S[6], hex("#8c8494"), 0.45);
    const ps = new Particles({ rng: R, ground: floor, sparks: [G[4], G[3], G[2], G[1]] }), lights = new Lights();
    // the seam: a jagged line along the floor from the palms to the last spear, fixed once
    const seam = [];
    for (let x = PALMS; x <= TX + 6; x += 2) seam.push([x, R.range(-0.4, 1.4) + (seam.length % 3 === 0 ? 0.6 : 0)]);
    let slammed = false;
    return {
      update(t, dt) {
        // the palms charge: grit rattles on the floor before they come down
        if (!slammed && t >= SLAM) {
          slammed = true;
          lights.add(PALMS + 1, -2, 44, G[2], 0.7, 0.2);
          lights.add(PALMS + 1, -2, 12, WHITE, 0.6, 0.05);
          for (let j = 0; j < 14; j++) ps.spawn(P.GRIT, PALMS + R.range(-6, 6), -1, R.range(-60, 60), -R.range(40, 140), R.range(0.6, 1.1), R.pick([S[6], S[5], S[4]]), R.chance(0.3) ? 2 : 1);
          for (let j = 0; j < 6; j++) ps.spawn(P.DUST, PALMS + R.range(-4, 4), -1, R.sign() * R.range(30, 90), -R.range(3, 12), R.range(0.5, 0.8), DUST, R.range(2, 3.2));
        }
        // the seam's front throws grit as it runs
        if (t > SLAM && t < ram(5)) {
          const fx = front(t);
          if (R.chance(40 * dt)) ps.spawn(P.GRIT, fx, -1, R.range(-20, 30), -R.range(30, 90), R.range(0.4, 0.8), R.pick([S[6], S[5]]), 1);
          if (R.chance(10 * dt)) ps.spawn(P.SPARK, fx, -1, R.range(-30, 60), -R.range(40, 120), R.range(0.1, 0.2));
          if (R.chance(18 * dt)) ps.spawn(P.DUST, fx, -1, R.range(-10, 30), -R.range(4, 12), R.range(0.3, 0.6), DUST, R.range(1.4, 2.4));
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p, t) {
        if (t < SLAM) return;
        // the seam: glowing at its running front, cooling to a dark scar behind it, fading out at the end
        const fx = front(t), fade = 1 - smooth(ram(5) + 1.6, ram(5) + 2.6, t);
        for (let k = 1; k < seam.length; k++) {
          const [x0, y0] = seam[k - 1], [x1, y1] = seam[k];
          if (x1 > fx) break;
          const age = (fx - x1) / 60 + Math.max(0, t - ram(5)) * 1.2, hot = clamp(1 - age);
          p.line(x0, y0 + 1, x1, y1 + 1, S[0], fade);
          p.line(x0, y0, x1, y1, hot > 0.75 ? G[4] : hot > 0.45 ? G[3] : hot > 0.2 ? G[2] : hot > 0.05 ? G[1] : S[1], fade);
          if (k % 3 === 0 && hot > 0.1) p.glow(x1, y1 - 1, 8, G[2], 0.35 * hot);
        }
        if (t < ram(5) + 0.1) {
          p.glow(fx, -2, 16, G[3], 0.6);
          p.px(fx, 0, WHITE);
        }
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, G);
        // the palms on the floor: chakra pouring out of them while the seam runs
        const g = t >= SLAM ? 1 - smooth(ram(5), ram(5) + 0.5, t) : 0;
        if (g > 0) {
          const pulse = 0.75 + 0.25 * Math.sin(t * 40);
          p.glow(PALMS + 1, -2, 18, G[2], 0.55 * g * pulse);
          p.ellipse(PALMS + 1, 0, 5 * g, 1, G[3], 0.8 * g);
          p.px(PALMS + 1, -1, G[4]);
        }
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);

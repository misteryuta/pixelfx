// Ranton: Reizaa Saakasu (Storm Release: Laser Circus, Darui, the Fourth Raikage's right hand). Narutopedia: Storm
// Release (water + lightning, a kekkei genkai of Kumogakure, first the Fourth Hokage's foe, the Second Raikage's and
// Darui's): the user creates a great many beams of light (energy that behaves like a laser) from the hands, which can
// change course freely and chase the target from every angle. Here: Darui (half-lidded, unhurried) raises both hands;
// between them a bright core gathers with water and lightning chasing round it; he spreads his hands and a fan of
// thin beams shoots out, a dozen of them, flying wide, bending in sweeping curves round the field and converging on
// the target from above, behind and below, each leaving a fading trail; they hit one after another with bright
// flares; the last ones lance straight through.
// New: the homing beams (each a smooth curve with a bright head and a fading trail), the storm core.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const RAISE = 0.3, CORE = 0.5, SPREAD = 1.2, FLY = 0.6, END = 3.6, TX = 190;
const NB = 12;
const LZ = ["#0a3a6a", "#2a8ad0", "#8fe0ff", "#e8fcff", "#ffffff"].map(hex), WATER = hex("#4ac0ff");

export const meta = {
  name: "Storm release: laser circus",
  desc: "Darui: a bright storm core gathers between his raised hands, then a dozen thin beams fan out, bend in sweeping curves round the field and converge on the target from every angle, hitting one after another.",
  tags: ["jutsu", "darui", "kumo", "storm-release", "ranton", "beam", "multi-hit", "one-shot"],
  size: [320, 210],
  origin: [56, 178],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a3a6a", "#2a8ad0", "#8fe0ff", "#e8fcff"], seed: 164 },
};

const HANDS = { ...READY, crouch: 3, lean: -4, armsFront: true, fx: 11, fy: -34, bx: 11, by: -32, ffx: 9, fbx: -9 };
const SPREADP = { ...READY, crouch: 6, lean: 4, fx: 22, fy: -38, bx: 20, by: -20, ffx: 12, fbx: -10 };
// each beam: when it leaves, how long it flies, how wide it swings and where on the target it lands
const BEAMS = Array.from({ length: NB }, (_, i) => {
  const s = (i / (NB - 1)) * 2 - 1;
  return { t0: SPREAD + i * 0.035, dur: FLY + rand(i, 1) * 0.25 + Math.abs(s) * 0.2, c1: [40 + s * 30 + rand(i, 2) * 40, -20 - (s + 1) * 60 - rand(i, 3) * 20], c2: [TX + (rand(i, 4) - 0.3) * 120, -10 - (1 - s) * 50 - rand(i, 5) * 30], hy: -14 - rand(i, 6) * 30 };
});
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RAISE, HANDS, "out"],
    [SPREAD - 0.05, { ...HANDS, crouch: 4 }],
    [SPREAD, SPREADP, "snap"],
    [END - 0.5, SPREADP],
    [END, READY],
  ],
  hits: [
    { t: CORE, target: false, sfx: "cast" },
    { t: SPREAD, stop: 0.05, shake: 0.4, amp: 2, target: false, sfx: "whoosh" },
    ...BEAMS.filter((_, i) => i % 2 === 0).map((m) => ({ t: m.t0 + m.dur, stop: 0.03, shake: 0.3, amp: 2, push: 2, straw: 10, flash: 0.02, skin: "shock", sfx: "thunder" })),
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the beam's curve: a cubic from the core, out wide through its two controls, into the target
  const curve = (m, u, S) => {
    const E = [TX, m.hy], a = 1 - u;
    return [a * a * a * S[0] + 3 * a * a * u * m.c1[0] + 3 * a * u * u * m.c2[0] + u * u * u * E[0], a * a * a * S[1] + 3 * a * a * u * m.c1[1] + 3 * a * u * u * m.c2[1] + u * u * u * E[1]];
  };
  const coreAt = (t) => { const b = bodyAt(act.poses, Math.min(t, SPREAD)); return [(b.handN[0] + b.handF[0]) / 2 + 2, (b.handN[1] + b.handF[1]) / 2 - 2]; };
  return {
    update(t, dt) {
      BEAMS.forEach((m) => { if (t >= m.t0 + m.dur && !m.hit) { m.hit = 1; lights.add(TX, m.hy, 50, LZ[3], 0.5, 0.15); for (let j = 0; j < 5; j++) ps.spawn(P.SPARK, TX, m.hy, R.range(-80, 80), R.range(-80, 80), R.range(0.1, 0.25), LZ[R.int(2, 4)]); } });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "kumo", t0: 0.04, t1: RAISE, label: "RANTON", head: b.head });
      // half-lidded eyes
      p.line(hx + 1, hy - 1, hx + 3, hy - 1, hex("#1a1414"));
      // the storm core: a bright ball between the hands, water and lightning chasing round it
      if (t > CORE - 0.1 && t < SPREAD + 0.15) {
        const [cx, cy] = coreAt(t), g = smooth(CORE - 0.1, SPREAD - 0.2, t) * (1 - smooth(SPREAD, SPREAD + 0.15, t)), r = 2 + 4 * g;
        p.glow(cx, cy, 18 * g, LZ[2], 0.6 * g);
        p.circle(cx, cy, r, LZ[3]); p.circle(cx, cy, r * 0.6, WHITE);
        for (let i = 0; i < 3; i++) { const a = t * 14 + i * 2.1; p.arc(cx, cy, r + 3, 1, a, a + 1.2, WATER, g); }
        if (Math.floor(t * 30) % 2) bolt(p, cx - r - 4, cy, cx + r + 4, cy - 2, Math.floor(t * 30), LZ, { jag: 0.35, seed: Math.floor(t * 30), glow: 0.3 });
      }
      // the beams: each a smooth bending curve, a bright head and a trail fading behind it; the head lands on the target
      const S = coreAt(SPREAD);
      for (const m of BEAMS) {
        const u = (t - m.t0) / m.dur;
        if (u < 0 || u > 1.3) continue;
        const head = Math.min(1, u), tail = Math.max(0, head - 0.35), fade = 1 - smooth(1, 1.3, u);
        let prev = curve(m, tail, S);
        for (let s = 1; s <= 16; s++) {
          const v = tail + (head - tail) * (s / 16), P1 = curve(m, v, S), w = s / 16;
          p.beam(prev[0], prev[1], P1[0], P1[1], 1 + w * 1.4, w > 0.8 ? LZ[4] : w > 0.5 ? LZ[3] : LZ[2], (0.3 + 0.7 * w) * fade);
          prev = P1;
        }
        if (u < 1) { p.glow(prev[0], prev[1], 6, LZ[2], 0.6); p.circle(prev[0], prev[1], 1.6, WHITE); }
        else if (u < 1.15) { const v = (u - 1) / 0.15; p.ring(TX, m.hy, 3 + 9 * v, 1, LZ[3], 1 - v); }
      }
      void noise2; void TAU; void clamp; void ease;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

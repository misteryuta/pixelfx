// Kamui: intangibility (Obito). Narutopedia: Obito keeps the parts of his body that would be struck inside Kamui's
// dimension, so attacks pass straight through him; while he does it he can't attack either, and it only lasts so long
// before he has to come back out. Here: his Mangekyou, a twist of the air and his body goes thin and ghostly with a
// spiral turning on it; a timer ring over his head runs down while kunai, a fireball and a giant shuriken from the other
// side pass right through him, each opening a small spiral where it goes through, with no hit, no flinch; when the ring
// is empty he snaps back solid.
// New: the phased body (actorAlpha dithers him, a spiral sigil on his chest), the pass-through swirls, the timer ring,
// the thrown things (kunai, a fireball, a spinning fuuma shuriken). From _lib: warp.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, PHASE = OPEN + 0.15, ON = PHASE + 0.2, LAST = 3.0, OFF = ON + LAST, END = OFF + 0.9, TX = 150;
const SP = ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"].map(hex), STEEL = ["#2a2a34", "#5a5a6a", "#a0a0b4", "#e8e8f4"].map(hex);
const FIRE = ["#7a1a0c", "#e8461a", "#ff8a2a", "#ffc23d", "#fff3a6"].map(hex);
// what's thrown at him: when it's let go, what it is, its height, its speed
const SHOTS = [
  { t: ON + 0.2, kind: "kunai", y: -30, v: 360 },
  { t: ON + 0.32, kind: "kunai", y: -20, v: 360 },
  { t: ON + 0.44, kind: "kunai", y: -38, v: 360 },
  { t: ON + 1.1, kind: "fire", y: -26, v: 240 },
  { t: ON + 2.0, kind: "shuriken", y: -24, v: 220 },
];
const X0 = TX - 16, X1 = -150;

export const meta = {
  name: "Kamui intangibility",
  desc: "Obito: his Mangekyou, his body goes thin and ghostly with a spiral on it; a timer ring runs down while kunai, a fireball and a giant shuriken pass straight through him, each opening a little spiral, until he snaps back solid.",
  tags: ["jutsu", "obito", "kamui", "mangekyou", "space-time", "defense", "buff", "one-shot"],
  size: [312, 150],
  origin: [124, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"], seed: 61 },
};

// while he's phased he's only half there
export const actorAlpha = (t) => (t < PHASE ? 1 : t < ON ? 1 - 0.5 * smooth(PHASE, ON, t) : t < OFF ? 0.5 : t < OFF + 0.1 ? 0.5 + 0.5 * smooth(OFF, OFF + 0.1, t) : 1);

const CALM = { ...READY, crouch: 2, fx: 6, fy: -18, bx: -2, by: -18, ffx: 6, fbx: -6 };
// arms folded, weight back: he isn't attacking, just letting it all through
const FOLD = { ...READY, crouch: 1, lean: -2, fx: 4, fy: -24, bx: 5, by: -22, armsFront: true, ffx: 5, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [ON, FOLD, "out"],
    [OFF, { ...FOLD, crouch: 2 }],
    [OFF + 0.15, { ...CALM, crouch: 4 }, "snap"],
    [END, CALM],
  ],
  hits: [
    { t: PHASE, stop: 0.04, shake: 0.15, amp: 1, target: false },
    { t: OFF, stop: 0.06, shake: 0.2, amp: 1, target: false },
  ],
};

const posAt = (s, t) => X0 - (t - s.t) * s.v;

// a little spiral where something passes through him
function swirl(p, x, y, r, t, k) {
  for (let i = 0; i < 3; i++) {
    const a0 = t * 16 + (i * TAU) / 3;
    p.arc(x, y, r, 1, a0, a0 + 1.6, i ? SP[3] : SP[4], k);
    p.arc(x, y, r * 0.55, 1, a0 + 1, a0 + 2.4, SP[3], k);
  }
  p.circle(x, y, Math.max(1, r * 0.2), SP[0], k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      // the fireball sheds flame and smoke as it flies
      for (const s of SHOTS) if (s.kind === "fire" && t > s.t && posAt(s, t) > X1 && R.chance(60 * dt)) ps.spawn(P.FIRE, posAt(s, t) + 4, s.y + R.range(-4, 4), R.range(20, 60), -R.range(10, 30), R.range(0.15, 0.3), 0, R.range(1.5, 2.5));
      // phased: wisps of him drifting off and spiralling away
      if (t > ON && t < OFF && R.chance(30 * dt)) ps.spawn(P.STREAK, R.range(-8, 8), -R.range(4, 40), R.range(-20, 20), -R.range(10, 30), 0.3, SP[3]);
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "obito", t0: EYE, t1: OPEN, label: "KAMUI", head: b.head });
      drawGlint(p, t, "obito", OPEN + 0.05, END - 0.3, b.head);
      // going in: a twist of the air round him
      if (t > PHASE && t < ON + 0.1) {
        const u = smooth(PHASE, ON, t);
        warp(p, 0, -20, 24, 4 * Math.sin(u * Math.PI), 0.3 * Math.sin(u * Math.PI));
        swirl(p, 0, -20, 22 * (1 - u) + 4, t, 1 - u * 0.5);
      }
      // phased: a slow spiral turning on his chest, his edges flickering pale
      if (t > ON && t < OFF + 0.1) {
        const k = 1 - smooth(OFF, OFF + 0.1, t);
        swirl(p, b.chest[0], b.chest[1] - 2, 7, t * 0.4, 0.55 * k);
        // the timer ring over his head, running down
        const left = 1 - clamp((t - ON) / LAST), hx = b.head[0], hy = b.head[1] - 22;
        p.circle(hx, hy, 7, SP[1], 0.8 * k);
        p.arc(hx, hy, 7, 2, -Math.PI / 2, -Math.PI / 2 + TAU * left, left < 0.25 && Math.floor(t * 8) & 1 ? WHITE : SP[4], k);
        p.arc(hx, hy, 3, 1, t * 6, t * 6 + 2.4, SP[3], k);
        p.text("INTANGIBLE", hx, hy - 17, SP[4], { font: "mini", align: "center", outline: SP[0], a: k * (1 - smooth(ON + 1.2, ON + 1.5, t)) });
      }
      // coming back: a ring snapping in round him
      if (t > OFF && t < OFF + 0.25) {
        const u = (t - OFF) / 0.25;
        p.ring(0, -20, 30 * (1 - u) + 4, 1, SP[4], 1 - u);
      }
      // the thrown things, passing straight through him: each opens a small spiral as it goes
      for (const s of SHOTS) {
        if (t < s.t) continue;
        const x = posAt(s, t);
        if (x < X1) continue;
        const inside = Math.abs(x) < 10;
        if (inside) {
          warp(p, x, s.y, 9, 3, 0.2);
          swirl(p, x, s.y, 7, t, 0.9);
        }
        // what it is: drawn after the swirl so it's seen going through
        if (s.kind === "kunai") {
          p.line(x, s.y, x + 9, s.y, STEEL[2]);
          p.line(x + 1, s.y - 1, x + 3, s.y, STEEL[3]);
          p.line(x + 9, s.y, x + 14, s.y, hex("#3a2a2a"));
          p.ring(x + 16, s.y, 1.5, 1, STEEL[1]);
          p.line(x + 14, s.y, x + 26, s.y, WHITE, 0.25);
        } else if (s.kind === "fire") {
          p.glow(x, s.y, 20, FIRE[3], 0.6);
          p.circle(x + 3, s.y, 7, FIRE[1]);
          p.circle(x + 1, s.y, 5.5, FIRE[2]);
          p.circle(x, s.y - 1, 3.5, FIRE[3]);
          p.circle(x - 1, s.y - 1, 1.8, FIRE[4]);
        } else {
          // a fuuma shuriken: four blades round a hole, spinning
          const a = t * 26;
          for (let k = 0; k < 4; k++) {
            const aa = a + (k * TAU) / 4;
            p.tri(x + Math.cos(aa) * 13, s.y + Math.sin(aa) * 13, x + Math.cos(aa + 1.1) * 4, s.y + Math.sin(aa + 1.1) * 4, x + Math.cos(aa - 0.5) * 3, s.y + Math.sin(aa - 0.5) * 3, STEEL[1]);
            p.line(x + Math.cos(aa) * 13, s.y + Math.sin(aa) * 13, x + Math.cos(aa + 1.1) * 4, s.y + Math.sin(aa + 1.1) * 4, STEEL[3]);
          }
          p.circle(x, s.y, 3, STEEL[2]);
          p.circle(x, s.y, 1.2, SP[0]);
          p.arc(x, s.y, 15, 1, a, a + 1.2, WHITE, 0.4);
        }
      }
      ps.draw(p, "front");
    },
  };
});

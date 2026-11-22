// Susanoo: Yasaka Magatama (Itachi). Narutopedia: a technique a Susanoo can use from any of its hands: three magatama
// bound together by a single circular thread, formed between two of its hands or in one, and thrown like a shuriken,
// rapidly spinning toward the target, exploding on impact. Itachi's Susanoo is red (the anime): a tengu hood, magatama
// earrings. Here: his Mangekyou; the red Susanoo forms round him (ribs, bones, muscle, armour) faster than for the
// Totsuka; its hands come together and between them three comma-shaped jewels of chakra spin up on a ring of thread;
// it swings and throws: the ring flies spinning, wobbling on its axis, whining; it strikes and bursts in three blasts at
// the three jewels, then one great one; the thread's ring of light hangs for an instant.
// New: the three magatama on their thread (spinning, tilting), the throw, the triple blast. From _susanoo: the rig.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, blast } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, rigOf, keyTrack, SUSANOO } from "./_susanoo.js";

const EYE = 0.05, OPEN = 0.5, RIBS = OPEN + 0.04, BONES = RIBS + 0.22, FLESH = BONES + 0.26, ARMOUR = FLESH + 0.4, FORM = ARMOUR + 0.35;
const SPUN = FORM + 0.5, WIND = SPUN + 0.25, THROW = WIND + 0.12, HIT = THROW + 0.35, END = HIT + 2.2, TX = 200;
const RD = SUSANOO.itachi, MG = ["#3a0806", "#a01a10", "#ff4a2a", "#ffb08a", "#fff0e0"].map(hex), BOOM = ["#1a0404", "#4a0a08", "#9a1a10", "#e0441c", "#ff9a4a", "#ffe0a0", "#fff8e8"].map(hex);

const GUARD = { lean: 0, twist: 0, head: 0, near: [1.2, 0.6], nearBend: 1, far: [1.0, 0.5] };
const keys = keyTrack([
  [0, GUARD],
  [FORM, GUARD],
  // both hands together before the chest, cupping
  [FORM + 0.3, { near: [0.55, 0.72], far: [0.45, 0.75], lean: 0.05, twist: 0.1 }],
  [SPUN, { near: [0.5, 0.72], far: [0.4, 0.75] }],
  // the wind-up: the near arm back across the body, the body turned away
  [WIND, { near: [1.85, 0.8], nearBend: 1, far: [0.3, 0.6], lean: -0.12, twist: -0.35 }],
  // the throw: the arm whips round and out
  [THROW, { near: [-0.1, 0.95], nearBend: 0.6, far: [1.2, 0.5], lean: 0.25, twist: 0.6 }],
  [THROW + 0.3, { near: [0.4, 0.9], nearBend: 1, lean: 0.18, twist: 0.4 }],
  [HIT + 1.2, GUARD],
]);
const rigAt = (t) => rigOf({ ...keys(t), y: -6 + Math.sin(t * 2.4) * 0.8 });
const stageAt = (t) => ({
  ribs: smooth(RIBS, RIBS + 0.2, t) * (1 - smooth(END - 0.5, END - 0.3, t)),
  bones: smooth(BONES, BONES + 0.2, t) * (1 - smooth(END - 0.6, END - 0.4, t)),
  flesh: smooth(FLESH, FLESH + 0.3, t) * (1 - smooth(END - 0.8, END - 0.5, t)),
  armour: smooth(ARMOUR, ARMOUR + 0.3, t) * (1 - smooth(END - 1.0, END - 0.7, t)),
});

export const meta = {
  name: "Susanoo: Yasaka Magatama",
  desc: "Itachi's red Susanoo forms round him; between its hands three magatama of chakra spin up on a ring of thread; it throws them spinning like a shuriken, and they burst on the target in three blasts and one great one.",
  tags: ["jutsu", "itachi", "susanoo", "mangekyou", "projectile", "aoe", "one-shot"],
  size: [320, 230],
  origin: [80, 198],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a0806", "#8a1a10", "#d8461c", "#ff8a3a", "#ffd8a0"], seed: 144 },
};

const CALM = { ...READY, crouch: 2, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 6, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [THROW, { ...CALM, fx: 14, fy: -24, lean: 4 }, "out"],
    [END, CALM],
  ],
  hits: [
    { t: RIBS, stop: 0.05, shake: 0.2, amp: 1, target: false, sfx: "cast" },
    { t: THROW, stop: 0.04, shake: 0.2, amp: 1, target: false, sfx: "whoosh" },
    ...[0, 0.08, 0.16].map((d) => ({ t: HIT + d, stop: 0.04, shake: 0.3, amp: 2, push: 2, straw: 14, skin: "char", sfx: "explosion" })),
    { t: HIT + 0.3, stop: 0.16, shake: 0.8, amp: 6, push: 6, straw: 40, skin: "char", sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RIBS, x: 0, n: 10 }, { t: HIT + 0.3, x: TX - 30, n: 20, dir: -1 }, { t: HIT + 0.3, x: TX + 30, n: 20, dir: 1 }],
};

// one magatama: a comma of chakra, head at (x, y), tail curling round behind it as it turns by a
function magatama(p, x, y, a, s) {
  p.circle(x, y, 4 * s, MG[2]);
  p.circle(x - s, y - s, 2 * s, MG[3]);
  for (let i = 1; i <= 6; i++) { const aa = a - i * 0.35, r = 4 * s - i * 0.5 * s; p.circle(x + Math.cos(aa + Math.PI / 2) * i * 1.2 * s, y + Math.sin(aa + Math.PI / 2) * i * 1.2 * s, Math.max(0.6, r * 0.7), MG[2]); }
}
// the ring: thread and the three jewels on it, spinning about its centre (cx, cy), radius rr, tilted
function ring(p, cx, cy, rr, spin, tilt, s) {
  for (let a = 0; a < TAU; a += 0.12) { const x = Math.cos(a) * rr, y = Math.sin(a) * rr * tilt; p.px(cx + x, cy + y, MG[3]); }
  p.glow(cx, cy, rr * 1.6, MG[2], 0.4);
  for (let i = 0; i < 3; i++) { const a = spin + (i * TAU) / 3; magatama(p, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * tilt, a, s); }
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const flyAt = (t) => { const Rg = rigAt(THROW), H = [(Rg.near.H[0] + Rg.far.H[0]) / 2, (Rg.near.H[1] + Rg.far.H[1]) / 2], u = ease.inQuad(clamp((t - THROW) / (HIT - THROW))); return [H[0] + (TX - H[0]) * u, H[1] + (-28 - H[1]) * u - Math.sin(u * Math.PI) * 18]; };
  return {
    update(t, dt) {
      if (t > RIBS && t < END - 0.5 && R.chance(26 * dt)) ps.spawn(P.EMBER, R.range(-40, 40), -R.range(20, 110), R.range(-10, 10), -R.range(20, 50), R.range(0.3, 0.6), RD[R.int(2, 4)]);
      if (t >= HIT + 0.3 && !this.b) { this.b = 1; lights.add(TX, -30, 200, BOOM[5], 1, 0.5); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      drawSusanoo(p, t, rigAt(t), { kind: "itachi", st: stageAt(t) });
      [0, 0.08, 0.16].forEach((d, i) => blast(p, t - HIT - d, { x: TX - 14 + i * 14, y: 0, R: 16, C: BOOM, seed: 3 + i, layer: "back" }));
      blast(p, t - HIT - 0.3, { x: TX, y: 0, R: 40, C: BOOM, seed: 9, layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), Rg = rigAt(t);
      drawSusanoo(p, t, Rg, { kind: "itachi", st: stageAt(t), layer: "front" });
      drawBadge(p, t, { kind: "itachi", t0: EYE, t1: OPEN, label: "MANGEKYOU", head: b.head });
      drawGlint(p, t, "itachi", OPEN, END - 0.3, b.head);
      // the jewels spinning up between its hands, then held, then thrown
      if (t > FORM + 0.2 && t < THROW) {
        const H = [(Rg.near.H[0] + Rg.far.H[0]) / 2 + 4, (Rg.near.H[1] + Rg.far.H[1]) / 2], g = ease.outBack(smooth(FORM + 0.2, SPUN, t), 1.6);
        ring(p, H[0], H[1], 12 * g, t * 14, 0.45, g);
      }
      if (t >= THROW && t < HIT + 0.02) { const [x, y] = flyAt(t), wob = 0.45 + 0.25 * Math.sin(t * 20); ring(p, x, y, 12, t * 30, wob, 1); for (let i = 1; i < 5; i++) { const [px, py] = flyAt(t - i * 0.02); p.ring(px, py, 10 - i, 1, MG[2], 0.4 - i * 0.08); } }
      // the three bursts at the jewels, then the big one; the thread's ring of light hanging for an instant
      if (t > HIT && t < HIT + 0.35) { const u = (t - HIT) / 0.35; p.ellipse(TX, -28, 14 + 10 * u, 6 + 4 * u, (d) => (d > 0.85 ? MG[4] : 0), 1 - u); }
      [0, 0.08, 0.16].forEach((d, i) => blast(p, t - HIT - d, { x: TX - 14 + i * 14, y: 0, R: 16, C: BOOM, seed: 3 + i }));
      blast(p, t - HIT - 0.3, { x: TX, y: 0, R: 40, C: BOOM, seed: 9 });
      void rand; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

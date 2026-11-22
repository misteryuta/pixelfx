// Mokuton: Mokuryuu no Jutsu (Wood Release: Wood Dragon, Madara with Hashirama's cells). Narutopedia: a gigantic wooden
// dragon, serpentine like a Chinese dragon, which can bind a target and bite it, draining its chakra almost like a
// vampire. Here: his palms slap together; the ground bursts and a long wooden body pours up out of it, a head with a
// heavy brow, branch-horns and a jaw of splinters; it climbs in an S high over the battlefield, turns, dives, wraps
// the target in two coils that tighten, and bites; green chakra wisps flow out of the target into the dragon along its
// body; then it sinks back into the earth leaving splinters.
// New: the dragon as a chain of bark segments following one smooth head path (each segment where the head was a moment
// before, so it moves like a serpent), the coils and the bite, the drain.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawChunk } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const CLAP = 0.4, BURST = 0.6, TOP = 1.3, DIVE = 1.7, COIL = 2.0, BITE = 2.4, DRAIN = 2.5, SINK = 3.5, END = 4.4, TX = 180;
const WOOD = ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a"].map(hex), CHAK = ["#2a8a3a", "#6ae07a", "#c8ffc0"].map(hex);
const HOLE = [40, 0], N = 66;

export const meta = {
  name: "Wood release: wood dragon",
  desc: "Madara: the ground bursts and a long wooden dragon pours up out of it, climbs high in an S, dives, wraps the target in tightening coils and bites, chakra streaming out of it into the dragon, then sinks back into the earth.",
  tags: ["jutsu", "madara", "wood", "mokuton", "bind", "drain", "one-shot"],
  size: [320, 230],
  origin: [56, 198],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0f08", "#3a2412", "#5e3c1e", "#8a5a2e", "#b8864a"], seed: 146 },
};

const CLAPP = { ...READY, crouch: 4, armsFront: true, fx: 9, fy: -27, bx: 10, by: -27, ffx: 9, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CLAP, CLAPP, "out"],
    [SINK, CLAPP],
    [END, READY],
  ],
  hits: [
    { t: CLAP, stop: 0.06, target: false, sfx: "clash" },
    { t: BURST, shake: 1.0, amp: 3, target: false, sfx: "rumble" },
    { t: COIL, stop: 0.08, shake: 0.4, amp: 2, push: 0, straw: 10, flash: 0, sfx: "block" },
    { t: BITE, stop: 0.2, shake: 0.6, amp: 4, push: 0, straw: 30, skin: "poison", sfx: "heavy" },
    { t: SINK, shake: 0.8, amp: 2, target: false, sfx: "rumble" },
    { t: SINK + 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: BURST, x: HOLE[0], n: 20, dir: -1 }, { t: BURST, x: HOLE[0], n: 20, dir: 1 }],
};
// held still in the coils, squeezed
export const targetState = (t) => (t > COIL && t < SINK ? { s: 1 - 0.06 * smooth(COIL, BITE, t), dy: 0 } : null);

// the head's path over time: out of the hole, up in an S, over, down onto the target, then circling it (the coils)
const headAt = (t) => {
  if (t < BURST) return [HOLE[0], 10];
  if (t < TOP) { const u = ease.outQuad((t - BURST) / (TOP - BURST)); return [HOLE[0] + 60 * u + Math.sin(u * Math.PI * 2) * 22, -160 * u]; }
  if (t < DIVE) { const u = (t - TOP) / (DIVE - TOP); return [HOLE[0] + 60 + 70 * u, -160 + 20 * Math.sin(u * Math.PI) - 10 * u]; }
  if (t < COIL) { const u = ease.inQuad((t - DIVE) / (COIL - DIVE)); return [HOLE[0] + 130 + (TX - 10 - HOLE[0] - 130) * u, -170 + 140 * u]; }
  if (t < BITE) { const u = (t - COIL) / (BITE - COIL), a = Math.PI + u * TAU * 1.0; return [TX + Math.cos(a) * 20, -24 + Math.sin(a) * 8 - u * 22]; }
  if (t < SINK) return [TX + 8 + Math.sin(t * 6) * 1.5, -50];
  const u = ease.inQuad(clamp((t - SINK) / 0.8)); return [TX + 8 - 60 * u, -50 + 60 * u];
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), bits = [];
  // a body segment i steps behind the head is where the head was i * lag seconds ago (a serpent follows its head)
  const LAG = 0.045;
  const seg = (t, i) => { const tt = t - i * LAG; if (tt < BURST) return null; return headAt(tt); };
  return {
    update(t, dt) {
      if (t > BURST && t < BURST + 0.4 && R.chance(60 * dt)) ps.spawn(P.GRIT, HOLE[0] + R.range(-14, 14), -1, R.range(-80, 80), -R.range(80, 200), R.range(0.4, 0.8), WOOD[R.int(1, 3)]);
      if (t >= SINK && !this.s) { this.s = 1; for (let i = 0; i < 18; i++) bits.push({ x: TX + R.range(-30, 30), y: -R.range(10, 60), vx: R.range(-60, 60), vy: -R.range(20, 100), a: R.range(0, TAU), s: R.range(1.5, 3), age: 0 }); }
      for (const c of bits) { c.vy += 500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.age += dt; if (c.y > -1) { c.y = -1; c.vy *= -0.2; c.vx *= 0.5; } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the hole it burst out of
      if (t > BURST) p.ellipse(HOLE[0], 0.5, 16, 3, hex("#0c0810"), 1 - smooth(END - 0.5, END, t));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "wood", t0: 0.04, t1: CLAP, label: "MOKUTON", head: b.head });
      drawGlint(p, t, "rinnegan", CLAP, END - 0.3, b.head);
      // the body, tail first so the head is drawn on top; bark rings, a ridge of branch spines
      for (let i = N; i >= 1; i--) {
        const P0 = seg(t, i), P1 = seg(t, i - 1);
        if (!P0 || !P1) continue;
        if (P0[1] > 6 && P1[1] > 6) continue;
        const w = 7 + 4 * Math.sin((i / N) * Math.PI) - (i > N - 8 ? (i - (N - 8)) * 0.7 : 0);
        p.beam(P0[0], P0[1], P1[0], P1[1], w + 2, WOOD[0]);
        p.beam(P0[0], P0[1], P1[0], P1[1], w, WOOD[i % 3 === 0 ? 3 : 2]);
        if (i % 3 === 0) { const a = Math.atan2(P1[1] - P0[1], P1[0] - P0[0]) - Math.PI / 2; p.line(P0[0] + Math.cos(a) * w * 0.5, P0[1] + Math.sin(a) * w * 0.5, P0[0] + Math.cos(a) * (w * 0.5 + 4), P0[1] + Math.sin(a) * (w * 0.5 + 4), WOOD[1]); }
        // the drain: green chakra running along it back from the head
        if (t > DRAIN && t < SINK && ((i + Math.floor(t * 20)) % 6 === 0)) p.circle(P0[0], P0[1], 2, CHAK[1]);
      }
      // the head: a heavy brow, branch horns, an eye, the jaw of splinters opening for the bite
      const H = seg(t, 0), Hp = seg(t - 0.04, 0) || (H && [H[0], H[1] + 4]);
      if (H && H[1] < 8) {
        const a = Math.atan2(H[1] - Hp[1], H[0] - Hp[0] || 0.001), c = Math.cos(a), s = Math.sin(a), at = (u, v) => [H[0] + c * u - s * v, H[1] + s * u + c * v];
        const jaw = t > COIL && t < BITE + 0.2 ? Math.sin(Math.PI * clamp((t - COIL - 0.2) / 0.4)) : 0.15;
        p.poly([at(-6, -8), at(14, -6), at(18, -2), at(4, 2), at(-6, 6)], WOOD[3]);
        p.poly([at(-4, 4), at(14, 2 + jaw * 6), at(-2, 8)], WOOD[2]);
        for (let i = 0; i < 4; i++) p.px(...at(6 + i * 3, 1 + jaw * 2), WOOD[4]);
        p.line(...at(-4, -8), ...at(-16, -18), WOOD[2]); p.line(...at(0, -8), ...at(-8, -20), WOOD[2]);
        p.px(...at(6, -4), CHAK[2]);
      }
      // the drain: green wisps out of the target into the jaw
      if (t > DRAIN && t < SINK) for (let i = 0; i < 4; i++) { const ph = (t * 2 + i * 0.25) % 1; p.px(TX + (rand(i, 3) - 0.5) * 16 + (8 - (rand(i, 3) - 0.5) * 16) * ph, -26 + (rand(i, 4) - 0.5) * 30 + (-24 - (rand(i, 4) - 0.5) * 30) * ph, CHAK[2], 1 - ph); }
      for (const c of bits) drawChunk(p, c.x, c.y, c.s, c.a, WOOD.slice(1), 1 - smooth(0.8, 1.2, c.age));
      void noise2; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

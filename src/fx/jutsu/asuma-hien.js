// Hien + Katon: Haisekishou (Asuma Sarutobi). Narutopedia: Asuma channels wind chakra into his trench knives, extending
// their edges into long invisible blades that cut beyond their reach (Flying Swallow); his Burning Ash breathes a cloud
// of hot ash that he lights with a click of his teeth. Here: he slips the knives onto his fingers; wind chakra runs out
// along them into long pale-green blades, whistling; two quick cuts, an X carved into the air that flies at the target
// and slashes it; then he breathes out a rolling grey cloud of ash that drifts over the target, glowing at its edges,
// and clicks his teeth: a spark, and the whole cloud goes up in one booming burst.
// New: the knives and their wind blades, the flying X, the ash cloud and its ignition. From _lib: blast.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, blast, MOUTH } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 170, KNIVES = 0.3, EDGE = 0.55, CUT1 = 0.85, CUT2 = 1.0, XHIT = 1.25, BREATH = 1.65, CLOUDED = 2.35, CLICK = 2.6, END = 4.4;
const WIND = ["#1a3a2a", "#3a8a5a", "#8ae0b0", "#d8fff0"].map(hex), ASH = ["#1a1618", "#2e282c", "#4a4248", "#6a6068"].map(hex);
const FIRE = ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"].map(hex);

export const meta = {
  name: "Flying swallow + burning ash",
  desc: "Asuma: wind chakra runs out along his trench knives into long blades; two quick cuts send an X of wind through the target; then he breathes a rolling cloud of ash over it and clicks his teeth: the whole cloud goes up in one burst.",
  tags: ["jutsu", "asuma", "wind", "fire", "fuuton", "katon", "combo", "one-shot"],
  size: [300, 190],
  origin: [56, 160],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a3a2a", "#3a8a5a", "#8ae0b0", "#d8fff0"], seed: 19 },
};

const GUARDK = { ...READY, crouch: 6, lean: 4, fx: 14, fy: -24, bx: 10, by: -28, ffx: 10, fbx: -10 };
const CUTA = { ...GUARDK, lean: 10, fx: 22, fy: -14, bx: 4, by: -34 };
const CUTB = { ...GUARDK, lean: 10, fx: 6, fy: -34, bx: 22, by: -14 };
const BLOW = { ...READY, crouch: 4, lean: 8, fx: 4, fy: -20, bx: -4, by: -20, ffx: 10, fbx: -10, hy: 1 };
export const act = {
  target: { x: TX },
  ghost: "#8ae0b0",
  poses: [
    [-0.25, READY],
    [KNIVES, GUARDK, "out"],
    [CUT1 - 0.06, { ...GUARDK, fx: 4, fy: -36, bx: 18, by: -20 }, "out"],
    [CUT1, CUTA, "snap"],
    [CUT2, CUTB, "snap"],
    [BREATH - 0.15, { ...BLOW, lean: -4 }, "out"],
    [BREATH, BLOW, "snap"],
    [CLICK, { ...BLOW, lean: 4 }],
    [CLICK + 0.05, { ...BLOW, lean: 2, hy: -1 }, "snap"],
    [END, READY],
  ],
  hits: [
    { t: EDGE, target: false, sfx: "cast" },
    { t: CUT1, target: false, sfx: "whoosh" },
    { t: CUT2, target: false, sfx: "whoosh" },
    { t: XHIT, stop: 0.12, shake: 0.3, amp: 2, push: 3, straw: 24, flash: 0.1, sfx: "heavy" },
    { t: CLICK, stop: 0.04, target: false, sfx: "parry" },
    { t: CLICK + 0.08, stop: 0.18, shake: 0.9, amp: 6, push: 6, straw: 50, skin: "char", sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const puffs = [];
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t), m = [b.head[0] + MOUTH[0] - 2, b.head[1] + 5];
      // the ash: puffs breathed out, drifting toward the target and spreading
      if (t > BREATH && t < CLOUDED && R.chance(50 * dt)) puffs.push({ x: m[0], y: m[1], vx: R.range(70, 110), vy: R.range(-6, 10), r: R.range(4, 7), age: 0, seed: R.int(0, 99) });
      for (const q of puffs) { q.age += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - 0.9 * dt; q.r += 6 * dt; if (q.y > -6) q.vy = -Math.abs(q.vy); }
      if (t >= CLICK + 0.08 && !this.boom) { this.boom = 1; lights.add(TX - 20, -30, 260, FIRE[4], 1, 0.6); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      blast(p, t - CLICK - 0.08, { x: TX - 20, y: 0, R: 50, C: FIRE, seed: 7, layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 20);
      drawBadge(p, t, { kind: "hien", t0: 0.04, t1: KNIVES, label: "HIEN", head: b.head });
      // the knives on both hands, and the wind blades along them
      const edge = smooth(EDGE, EDGE + 0.2, t) * (1 - smooth(XHIT + 0.2, BREATH, t));
      for (const [h, a0] of [[b.handN, -0.4], [b.handF, -0.9]]) {
        if (t < KNIVES) continue;
        const a = a0 + (t > CUT1 && t < CUT2 + 0.1 ? 0.8 : 0), c = Math.cos(a), s = Math.sin(a);
        p.beam(h[0], h[1], h[0] + c * 6, h[1] + s * 6, 1.6, hex("#5a6a78"));
        p.ring(h[0] - 1, h[1] + 1, 1.5, 1, hex("#2a2a30"));
        if (edge > 0) {
          const L = 6 + 18 * edge, w = Math.sin(t * 40) * 0.5;
          p.glowLine(h[0], h[1], h[0] + c * L, h[1] + s * L, 6, WIND[2], 0.5 * edge);
          p.beam(h[0] + c * 6, h[1] + s * 6, h[0] + c * L, h[1] + s * L + w, 1.5, WIND[2], 0.7 * edge);
          p.line(h[0] + c * 6, h[1] + s * 6, h[0] + c * L, h[1] + s * L, WIND[3], edge);
        }
      }
      // the cuts and the flying X
      const arc = (at, a0, a1) => { const a = t - at; if (a < 0 || a > 0.12) return; p.arc(b.chest[0] + 6, b.chest[1], 22, 2, a0, a1, WIND[3], 1 - a / 0.12); };
      arc(CUT1, -1.2, 0.6);
      arc(CUT2, -0.6, 1.2);
      if (t > CUT2 && t < XHIT + 0.15) {
        const u = clamp((t - CUT2) / (XHIT - CUT2)), x = b.chest[0] + 20 + (TX - b.chest[0] - 20) * ease.inQuad(u), y = -28, k = 1 - smooth(XHIT, XHIT + 0.15, t), s = 10 + 4 * u;
        p.glow(x, y, 16, WIND[2], 0.5 * k);
        p.beam(x - s, y - s, x + s, y + s, 2, WIND[3], k);
        p.beam(x - s, y + s, x + s, y - s, 2, WIND[3], k);
        for (let i = 1; i < 4; i++) p.line(x - s - i * 8, y, x - i * 8, y, WIND[2], 0.4 * k);
      }
      // the ash cloud: grey puffs, glowing red at their edges once it hangs over the target; gone in the burst
      const lit = t > CLICK + 0.08;
      if (!lit) for (const q of puffs) {
        const glowK = smooth(CLOUDED - 0.3, CLICK, t);
        p.disc(q.x, q.y, q.r, (d) => (d > 0.8 && glowK > 0.2 && rand(q.seed, f) > 0.5 ? FIRE[2] : d < 0.5 ? ASH[3] : d < 0.8 ? ASH[2] : ASH[1]), (d) => (d < 0.85 ? 0.9 : 0.5));
      }
      // the click: a spark at his teeth running along the cloud to its heart
      if (t > CLICK && t < CLICK + 0.1) {
        const m = [b.head[0] + MOUTH[0], b.head[1] + 5], u = (t - CLICK) / 0.08;
        p.circle(m[0] + 2, m[1], 2, WHITE);
        p.beam(m[0] + 2, m[1], m[0] + 2 + (TX - 20 - m[0]) * u, m[1] + (-24 - m[1]) * u, 2, FIRE[4]);
      }
      blast(p, t - CLICK - 0.08, { x: TX - 20, y: 0, R: 50, C: FIRE, seed: 7 });
      void noise2; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

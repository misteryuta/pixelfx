// Yomotsu Hirasaka (Underworld Slope, Kaguya Ootsutsuki). Narutopedia: with her Byakugan's dimensional power Kaguya
// opens small portals through space; she strikes through one and the blow comes out of another anywhere she wishes,
// and her Eight Trigrams palms reach her foes from impossible angles. Here: Kaguya floats, her hair streaming; she
// thrusts her palm into a portal that opens beside her (a dark rift rimmed in violet); at the same instant a portal
// opens behind the target and her hand comes out of it striking its back; a second strike through another pair
// (above it); then she draws both hands back and a portal swallows the target and spits it out high above, dropping it.
// New: the paired portals (rift shapes), the arm passing through them; the swallow and drop.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const RISE = 0.3, S1 = 0.9, S2 = 1.5, SWALLOW = 2.1, OUTP = 2.45, LAND = 3.0, END = 3.8, TX = 170;
const RIFT = ["#020104", "#1a0a2a", "#5a2a9a", "#c8a0ff"].map(hex), HAIR = hex("#f0eef8"), SKIN = hex("#f0e4dc");

export const meta = {
  name: "Underworld slope",
  desc: "Kaguya floats and thrusts her palm into a portal beside her; it strikes out of another behind the target, then from above; finally a portal swallows the target and drops it from high above.",
  tags: ["jutsu", "kaguya", "ootsutsuki", "space-time", "byakugan", "portal", "one-shot"],
  size: [260, 200],
  origin: [56, 170],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#020104", "#1a0a2a", "#5a2a9a", "#c8a0ff"], seed: 186 },
};

const FLOAT = { ...READY, y: -20, crouch: 1, lean: -2, fx: 6, fy: -20, bx: -6, by: -20, ffx: 3, ffy: -5, fbx: -3, fby: -5, gait: false };
const PALM = { ...FLOAT, fx: 22, fy: -28, lean: 6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE + 0.3, FLOAT, "out"],
    [S1 - 0.05, FLOAT], [S1, PALM, "snap"], [S1 + 0.3, FLOAT, "out"],
    [S2 - 0.05, FLOAT], [S2, { ...PALM, fy: -36 }, "snap"], [S2 + 0.3, FLOAT, "out"],
    [SWALLOW, { ...FLOAT, fx: 16, fy: -30, bx: 14, by: -30 }, "out"],
    [END, FLOAT],
  ],
  hits: [
    { t: RISE, target: false, sfx: "cast" },
    { t: S1 + 0.02, stop: 0.1, shake: 0.4, amp: 3, push: -4, straw: 20, sfx: "punch" },
    { t: S2 + 0.02, stop: 0.1, shake: 0.4, amp: 3, push: 0, straw: 20, sfx: "punch" },
    { t: SWALLOW, target: false, sfx: "whoosh" },
    { t: LAND, stop: 0.16, shake: 0.8, amp: 5, push: 0, straw: 40, sfx: "land" },
  ],
};
export const targetState = (t) => {
  if (t > SWALLOW && t < OUTP) { const u = smooth(SWALLOW, SWALLOW + 0.25, t); return { s: 1 - u, a: u > 0.95 ? 0 : 1 }; }
  if (t >= OUTP && t < LAND) { const u = ease.inQuad(clamp((t - OUTP) / (LAND - OUTP))); return { dy: -130 * (1 - u), rot: u * 3 }; }
  return null;
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // a rift: a jagged dark tear standing open, violet rim, open amount k (0..1)
  const rift = (p, x, y, k, tall = 14) => { if (k <= 0.02) return; p.shade(x - 8, y - tall - 2, x + 8, y + tall + 2, (px, py, out) => { const v = (py - y) / tall, w = (4 + 2 * noise2(py * 0.4, x, 131)) * k * Math.sqrt(Math.max(0, 1 - v * v)); const d = Math.abs(px - x); if (d > w + 1) return; return d > w - 1 ? RIFT[3] : d > w - 2 ? RIFT[2] : RIFT[0]; }); p.glow(x, y, tall * 1.6, RIFT[2], 0.4 * k); };
  const open = (t, at, d = 0.4) => smooth(at - 0.12, at, t) * (1 - smooth(at + d - 0.1, at + d, t));
  return {
    update(t, dt) {
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      for (let i = 0; i < 10; i++) { const sx = hx - 4 + i * 0.6, wav = Math.sin(t * 2 + i * 0.5) * 3; p.beam(sx, hy - 3, sx - 10 + wav, hy + 36 + (i % 4) * 5, 1.6, i % 3 ? HAIR : hex("#c8c4d8")); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "byakugan", t0: 0.04, t1: RISE, label: "YOMOTSU HIRASAKA", head: b.head });
      drawGlint(p, t, "byakugan", RISE, END - 0.3, b.head);
      p.tri(hx - 3, hy - 4, hx - 1, hy - 4, hx - 4, hy - 9, HAIR); p.tri(hx + 1, hy - 4, hx + 3, hy - 4, hx + 4, hy - 9, HAIR);
      // the first pair: beside her hand, behind the target (her hand comes out of it into its back)
      for (const [at, exit] of [[S1, [TX + 16, -28, -1]], [S2, [TX, -62, 1.6]]]) {
        const k = open(t, at), [hx2, hy2] = b.handN;
        rift(p, hx2 + 4, hy2, k);
        rift(p, exit[0], exit[1], k);
        if (t > at - 0.02 && t < at + 0.2) {
          const ex = exit[0], ey = exit[1], d = exit[2], L = 10 * smooth(at - 0.02, at + 0.04, t), dx = d === 1.6 ? 0 : d * L, dy = d === 1.6 ? L : 0;
          p.beam(ex, ey, ex + dx, ey + dy, 3, SKIN); p.circle(ex + dx, ey + dy, 2.5, SKIN);
          if (t > at) p.ring(ex + dx, ey + dy, 3 + 30 * (t - at), 1, WHITE, 1 - (t - at) / 0.2);
        }
      }
      // the swallowing portal over the target, the drop from one high above
      rift(p, TX, -26, open(t, SWALLOW + 0.12, 0.4), 30);
      rift(p, TX, -150, open(t, OUTP, 0.35), 18);
      void rand; void TAU; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

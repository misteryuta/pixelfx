// Kage Kubishibari no Jutsu (Shadow Neck Bind, Shikamaru Nara). Narutopedia: an advanced form of the Shadow
// Imitation: the user's shadow, already holding the target, climbs up its body as a dark mass shaped like a hand and
// closes round its neck to strangle it; it takes far more chakra, so the user strains to keep it up. Here: the Rat
// seal; his shadow stretches out across the floor, thins, reaches the target's feet and joins its shadow (the Kagemane
// hold: the target is frozen); he sinks into a crouch, and slender shadow fingers climb up the target's body, spread
// over its chest and close round its neck; the neck bind tightens in pulses as he strains, sweat on him; his shadow
// snaps back to him.
// New: the shadow as a strip of ground darkness with a crawling tip, the climbing hand (fingers that branch as they
// rise), the strain.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEAL = 0.3, REACH = 0.55, CONNECT = 1.25, CLIMB = 1.45, NECK = 2.15, SQ1 = 2.4, SQ2 = 2.75, SQ3 = 3.1, BACK = 3.7, END = 4.3, TX = 160;
const SH = ["#060408", "#120e16", "#221a2a"].map(hex), SWEAT = hex("#8fd6ff");

export const meta = {
  name: "Shadow neck bind",
  desc: "Shikamaru: Rat seal, his shadow creeps over the floor and joins the target's, freezing it; slender shadow fingers climb its body and close round its neck, tightening in pulses as he strains, then snap back.",
  tags: ["jutsu", "shikamaru", "nara", "shadow", "bind", "one-shot"],
  size: [250, 170],
  origin: [50, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#060408", "#120e16", "#221a2a", "#3a2e44"], seed: 151 },
};

const RAT = { ...READY, crouch: 4, armsFront: true, fx: 8, fy: -26, bx: 9, by: -26, ffx: 9, fbx: -9 };
const STRAIN = { ...RAT, crouch: 6, lean: 6, fy: -25, by: -24 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SEAL, RAT, "out"],
    [CLIMB, RAT],
    [NECK, STRAIN, "inOut"],
    [SQ1, { ...STRAIN, crouch: 7, lean: 9 }, "in"],
    [SQ1 + 0.15, STRAIN, "out"],
    [SQ2, { ...STRAIN, crouch: 7, lean: 9 }, "in"],
    [SQ2 + 0.15, STRAIN, "out"],
    [SQ3, { ...STRAIN, crouch: 8, lean: 10 }, "in"],
    [BACK, { ...RAT, crouch: 6 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: SEAL, target: false, sfx: "cast" },
    { t: CONNECT, stop: 0.12, flash: 0, push: 0, straw: 2, shiver: 0.3, sfx: "block" },
    { t: NECK, stop: 0.06, flash: 0, push: 0, straw: 6, sfx: "block" },
    { t: SQ1, stop: 0.05, shake: 0.2, amp: 1, push: 0, straw: 8, flash: 0.02, shiver: 0.6 },
    { t: SQ2, stop: 0.05, shake: 0.2, amp: 1, push: 0, straw: 10, flash: 0.02, shiver: 0.8 },
    { t: SQ3, stop: 0.12, shake: 0.4, amp: 2, push: 0, straw: 20, flash: 0.04, shiver: 1, sfx: "heavy" },
    { t: BACK, flash: 0, push: 0, straw: 0, sfx: "whoosh" },
  ],
};
// frozen while the shadows hold it; squeezed a little with each pulse
const sq = (t) => [SQ1, SQ2, SQ3].reduce((m, s) => Math.max(m, Math.exp(-Math.pow((t - s - 0.05) / 0.07, 2))), 0);
export const targetState = (t) => (t > CONNECT && t < BACK ? { s: 1 - 0.03 * sq(t), dy: 0 } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the shadow's tip along the floor: out to the target, then back home
  const tip = (t) => (t < REACH ? 6 : t < CONNECT ? 6 + (TX - 6) * ease.inOutQuad((t - REACH) / (CONNECT - REACH)) : t < BACK ? TX : TX - (TX - 6) * ease.inQuad(clamp((t - BACK) / 0.35)));
  // the climbing fingers: five strands that rise up the target, branch, and gather into a hand round its neck
  const FING = Array.from({ length: 5 }, (_, i) => ({ x0: TX - 6 + i * 3, sway: rand(i, 7) * 6, ph: rand(i, 8) * 6 }));
  return {
    update(t, dt) {
      if (t > NECK && t < BACK && R.chance(3 * dt)) { const b = bodyAt(act.poses, t); ps.spawn(P.SPARK, b.head[0] + 2, b.head[1] - 1, R.range(5, 20), R.range(-10, 10), R.range(0.3, 0.5), SWEAT); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the shadow: a strip of darkness out of his own along the ground, wavering at the edges, its tip crawling
      const x1 = tip(t);
      if (t > REACH - 0.05 && t < BACK + 0.4) {
        p.shade(4, -4, x1 + 8, 1, (x, y, out) => {
          const v = (x - 4) / Math.max(1, x1 - 4), w = 2.4 + 0.6 * Math.sin(v * 9 - t * 6) - (v > 0.9 ? (v - 0.9) * 14 : 0) + 0.4 * noise2(x * 0.3, t * 5, 2);
          if (v > 1.04 || -y > w || y > 0.5) return;
          return -y > w - 1 ? SH[2] : SH[0];
        });
        // where it joins the target's shadow: a pool under it
        if (t > CONNECT) p.ellipse(TX, 0, 12 * smooth(CONNECT, CONNECT + 0.15, t), 2.2, SH[0], 1 - smooth(BACK, BACK + 0.3, t));
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "nara", t0: 0.04, t1: SEAL, label: "KAGE KUBISHIBARI", head: b.head });
      // the fingers climbing: each a thin dark strand from the ground up the body, wavering, branching near the top,
      // then closing over the neck as one dark hand
      if (t > CLIMB && t < BACK + 0.25) {
        const up = ease.outCubic(smooth(CLIMB, NECK, t)) * (1 - ease.inCubic(smooth(BACK, BACK + 0.25, t))), top = -6 - 30 * up;
        FING.forEach((fn, i) => {
          let px = fn.x0, py = 0;
          for (let y = -1; y >= top; y -= 1) {
            const v = -y / 36, x = fn.x0 + Math.sin(v * 7 + fn.ph + t * 3) * (1.2 + fn.sway * 0.2) * (1 - v) + (TX + 1 - fn.x0) * v * v;
            p.beam(px, py, x, y, 2.2, SH[2]);
            p.line(px, py, x, y, SH[0]);
            if (v > 0.45 && (Math.floor(-y) + i) % 5 === 0) p.line(x, y, x + (i - 2) * 1.5, y - 2, SH[0]);
            px = x; py = y;
          }
        });
        // the hand round the neck: a dark collar with finger tips over the front, pulsing tighter with each squeeze
        if (t > NECK - 0.1) {
          const k = smooth(NECK - 0.1, NECK + 0.1, t) * (1 - smooth(BACK, BACK + 0.15, t)), w = 5 - 0.8 * sq(t);
          p.ellipse(TX + 1, -36, w, 1.8, SH[0], k);
          for (let i = 0; i < 4; i++) p.line(TX - 3 + i * 2, -37, TX - 3 + i * 2 + 1, -34.5, SH[1], k);
          if (sq(t) > 0.3) p.ring(TX + 1, -36, 7 + 4 * (1 - sq(t)), 1, WHITE, 0.4 * sq(t));
        }
      }
      // the strain on him: a vein-pulse ring at his hands at each squeeze
      if (t > NECK && t < BACK) { const k = sq(t); if (k > 0.2) p.ring(b.handN[0], b.handN[1], 3 + 4 * (1 - k), 1, SH[2], k); }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

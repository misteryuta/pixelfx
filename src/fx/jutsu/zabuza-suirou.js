// Suiton: Suirou no Jutsu (Water Release: Water Prison Technique, Zabuza Momochi). Narutopedia: Zabuza traps the
// target in a sphere of heavy water that he must hold by keeping his hand inside it; the prisoner cannot move or
// breathe properly; he caught Kakashi in it at the Land of Waves while a water clone fought on. Here: the mist rolls
// in; Zabuza (bandaged mouth, the Executioner's Blade on his back) appears beside the target out of the mist and
// sweeps his hand: water wells up round the target into a sphere, wobbling, bubbles streaming from it; his hand stays
// sunk in its surface; a water clone rises out of the floor beside him and slashes the trapped target with its own
// blade; the sphere bursts.
// New: the water sphere held by his hand (wobble, refraction rim, bubbles), the water clone (a darker double with
// water dripping off it), the mist.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const MIST = 0.2, APPEAR = 0.7, PRISON = 1.0, HELD = 1.4, CLONE = 1.7, SLASH = 2.3, BURST = 2.8, END = 3.8, TX = 160;
const WAT = ["#08203a", "#0e3a66", "#1a62a0", "#4aa0e0", "#a8e0ff", "#ffffff"].map(hex), FOG = hex("#c8d4dc"), STEEL = hex("#a8acb8");

export const meta = {
  name: "Water prison",
  desc: "Zabuza: mist rolls in and he appears beside the target, sweeping water up round it into a sphere held by his hand; a water clone rises from the floor and slashes the trapped target before the sphere bursts.",
  tags: ["jutsu", "zabuza", "kiri", "water", "suiton", "bind", "clone", "one-shot"],
  size: [240, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#08203a", "#1a62a0", "#4aa0e0", "#a8e0ff"], seed: 192 },
};

const HOLDP = { ...READY, x: TX - 28, crouch: 4, lean: 4, fx: 22, fy: -32, bx: -4, by: -20, ffx: 10, fbx: -10, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [APPEAR - 0.01, READY],
    [APPEAR, { ...HOLDP, fx: 10, fy: -24 }, "snap"],
    [HELD, HOLDP, "out"],
    [BURST, HOLDP],
    [END, { ...READY, x: TX - 28, gait: false }],
  ],
  hits: [
    { t: MIST, target: false, sfx: "whoosh" },
    { t: PRISON, stop: 0.08, shake: 0.3, amp: 1, push: 0, straw: 10, flash: 0, sfx: "block" },
    { t: SLASH, stop: 0.18, shake: 0.5, amp: 3, push: 0, straw: 30, flash: 0.04, sfx: "parry" },
    { t: BURST, stop: 0.08, shake: 0.4, amp: 2, push: 6, straw: 20, skin: null, sfx: "explosion" },
  ],
};
export const actorAlpha = (t) => (t > MIST + 0.2 && t < APPEAR ? 0 : t < APPEAR + 0.2 && t >= APPEAR ? smooth(APPEAR, APPEAR + 0.2, t) : 1);
export const targetState = (t) => (t > HELD && t < BURST ? { dy: -6 * smooth(HELD, HELD + 0.3, t) + Math.sin(t * 3) * 1, rot: Math.sin(t * 2) * 0.1 } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const clone = { ...READY, crouch: 6, lean: 12, fx: 20, fy: -34, bx: 14, by: -30, ffx: 12, fbx: -10 };
  return {
    update(t, dt) {
      if (t > HELD && t < BURST && R.chance(14 * dt)) ps.spawn(P.SPARK, TX + R.range(-8, 8), -40, R.range(-5, 5), -R.range(10, 30), R.range(0.5, 1), WAT[4]);
      if (t >= BURST && !this.b) { this.b = 1; for (let i = 0; i < 30; i++) { const a = R.range(0, TAU); ps.spawn(P.SPARK, TX + Math.cos(a) * 20, -30 + Math.sin(a) * 20, Math.cos(a) * 160, Math.sin(a) * 160 - 60, R.range(0.3, 0.6), WAT[R.int(3, 5)]); } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the mist: low drifting banks across the field
      if (t > MIST) { const k = smooth(MIST, MIST + 0.4, t) * (1 - smooth(END - 0.6, END, t)); p.shade(-56, -90, 184, 1, (x, y, out) => { const n = noise2(x * 0.02 + t * 0.3, y * 0.05, 151); if (n < 0.1) return; out.a = k * 0.35 * (n - 0.1); return FOG; }); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "kiri", t0: 0.04, t1: MIST, label: "SUIROU", head: b.head });
      // the Executioner's Blade on his back, the bandaged mouth
      if (t > APPEAR) { const [cx, cy] = b.chest, [hx, hy] = b.head; p.beam(cx - 10, cy - 14, cx + 6, cy + 14, 5, STEEL); p.circle(cx - 9, cy - 13, 2, hex("#1a1a22")); p.rect(hx - 1, hy + 1, 5, 2, hex("#e8e4dc")); }
      // the prison: water welling up round the target into a sphere, held by his hand in its surface
      if (t > PRISON - 0.1 && t < BURST) {
        const g = ease.outBack(smooth(PRISON - 0.1, HELD, t), 1.4), r = 24 * g, cx = TX, cy = -30;
        p.shade(cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2, (x, y, out) => { const d = Math.hypot((x - cx) / (r * (1 + 0.04 * Math.sin(t * 6))), (y - cy) / (r * (1 - 0.04 * Math.sin(t * 6)))); if (d > 1) return; out.a = d > 0.9 ? 0.95 : 0.45; return d > 0.9 ? WAT[4] : noise2(x * 0.15, y * 0.15 - t, 152) > 0.3 ? WAT[3] : WAT[2]; });
        p.arc(cx, cy, r - 3, 1, -2.4, -1.6, WHITE, 0.7);
      }
      // the water clone: rising out of the floor, dark and dripping, its blade slashing across the sphere
      if (t > CLONE && t < BURST + 0.2) {
        const rise = smooth(CLONE, CLONE + 0.3, t), k = 1 - smooth(BURST, BURST + 0.2, t), x = TX + 26, slash = smooth(SLASH - 0.1, SLASH + 0.05, t);
        drawFigure(p, { ...clone, fx: 20 - 30 * slash, fy: -34 + 20 * slash }, x, 40 * (1 - rise), { face: -1, tint: WAT[1], k: 0.7, a: k });
        const hx = x - 20 + 30 * slash, hy = -34 + 20 * slash + 40 * (1 - rise);
        p.beam(hx, hy, hx - 14 + 10 * slash, hy - 18 + 30 * slash, 4, STEEL, k);
        for (let i = 0; i < 3; i++) p.px(x - 2 + i * 2, -((t * 40 + i * 13) % 30), WAT[4], k);
        if (t > SLASH && t < SLASH + 0.15) p.line(TX + 20, -54, TX - 20, -10, WHITE, 1 - (t - SLASH) / 0.15);
      }
      void rand; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

// Suiton: Suirou no Jutsu (Water Release: Water Prison Technique, Zabuza Momochi). Narutopedia: Zabuza traps the
// target in a sphere of heavy water that he must hold by keeping his hand inside it; the prisoner cannot move or
// breathe properly; he caught Kakashi in it at the Land of Waves while a water clone fought on. Here: the mist rolls
// in; Zabuza (bandaged mouth, the Executioner's Blade on his back) appears beside the target out of the mist and
// sweeps his hand: water wells up round the target into a sphere, wobbling, bubbles streaming from it; his hand stays
// sunk in its surface and the prisoner floats beside his arm; when he pulls his hand out the water collapses and pours
// down, and the target drops free. (Rework 2026-11-25: the water clone no longer cuts the prisoner; in the Land of Waves
// fight the clone goes for Naruto and Sasuke while Zabuza holds Kakashi.)
// New: the water sphere held by his hand (wobble, refraction rim, bubbles, the ring round his wrist), the collapse, the mist.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const MIST = 0.2, APPEAR = 0.7, PRISON = 1.0, HELD = 1.4, LET = 3.0, BURST = 3.15, END = 4.1, TX = 160;
const WAT = ["#08203a", "#0e3a66", "#1a62a0", "#4aa0e0", "#a8e0ff", "#ffffff"].map(hex), FOG = hex("#c8d4dc"), STEEL = hex("#a8acb8");

export const meta = {
  name: "Water prison",
  desc: "Zabuza: mist rolls in and he appears beside the target; water wells up and closes round it into a sphere; his hand stays sunk in its surface, the prisoner floating helpless beside his arm; when he pulls the hand out the water collapses in on itself and pours down, and the target drops free.",
  tags: ["jutsu", "zabuza", "kiri", "water", "suiton", "bind", "one-shot"],
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
    [LET - 0.12, { ...HOLDP, crouch: 5 }],
    [LET, { ...HOLDP, fx: 10, fy: -26, lean: 0 }, "out"],
    [END, { ...READY, x: TX - 28, gait: false }],
  ],
  hits: [
    { t: MIST, target: false, sfx: "whoosh" },
    { t: PRISON, stop: 0.08, shake: 0.3, amp: 1, push: 0, straw: 10, flash: 0, sfx: "block" },
    { t: (HELD + LET) / 2, target: false, sfx: "rumble" },
    { t: BURST, stop: 0.06, shake: 0.25, amp: 1, push: 2, straw: 12, skin: null, sfx: "land" },
  ],
};
export const actorAlpha = (t) => (t > MIST + 0.2 && t < APPEAR ? 0 : t < APPEAR + 0.2 && t >= APPEAR ? smooth(APPEAR, APPEAR + 0.2, t) : 1);
export const targetState = (t) => {
  if (t < HELD || t > BURST + 0.3) return null;
  const up = smooth(HELD, HELD + 0.3, t) * (1 - ease.inQuad(smooth(LET + 0.05, BURST + 0.12, t)));
  return { dy: -6 * up + Math.sin(t * 3) * up, rot: Math.sin(t * 2) * 0.1 * up, tint: [WAT[2], 0.25 * up] };
};
// the camera: wide as the mist rolls in; in as the water closes round the target; then held on his arm and the
// prisoner together, the hand in the water the middle of the shot; a little out as the water falls
export const camera = cineCam([
  [0, { z: 1.15, x: 90, y: -32 }],
  [APPEAR, { z: 1.3, x: TX - 20, y: -32 }],
  [PRISON, { z: 1.9, x: TX - 4, y: -32, r: 2 }],
  [HELD + 0.2, { z: 1.95, x: TX - 20, y: -36, r: 0 }],
  [LET, { z: 2.0, x: TX - 20, y: -34, r: 0 }],
  [BURST + 0.1, { z: 1.8, x: TX - 10, y: -26, r: -1, shake: 0.3 }],
  [END, { z: 1.4, x: TX - 20, y: -30 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const clone = { ...READY, crouch: 6, lean: 12, fx: 20, fy: -34, bx: 14, by: -30, ffx: 12, fbx: -10 };
  return {
    update(t, dt) {
      if (t > HELD && t < BURST && R.chance(14 * dt)) ps.spawn(P.MOTE, TX + R.range(-8, 8), -40, R.range(-5, 5), -R.range(10, 30), R.range(0.5, 1), WAT[4]);
      // the collapse: the water falls straight down and splashes out along the floor
      if (t >= LET && t < BURST + 0.15 && R.chance(90 * dt)) ps.spawn(P.MOTE, TX + R.range(-16, 16), -R.range(4, 40) * (1 - smooth(LET, BURST, t)), R.range(-10, 10), R.range(60, 140), R.range(0.2, 0.4), WAT[R.int(3, 5)]);
      if (t >= BURST && !this.b) { this.b = 1; for (let i = 0; i < 26; i++) { const d = R.chance(0.5) ? 1 : -1; ps.spawn(P.MOTE, TX + d * R.range(4, 14), -1, d * R.range(40, 120), -R.range(20, 60), R.range(0.25, 0.5), WAT[R.int(3, 5)]); } }
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
      if (t > PRISON - 0.1 && t < BURST + 0.1) {
        // closing round it: water climbing from the floor into a sphere; falling: the sphere sags and pours down
        const g = ease.outBack(smooth(PRISON - 0.1, HELD, t), 1.4), fall = ease.inQuad(smooth(LET, BURST + 0.1, t));
        const r = 24 * g, cx = TX, sq = 1 - 0.75 * fall, cy = -30 + 28 * fall;
        const wob = 0.04 * Math.sin(t * 6), climb = smooth(PRISON - 0.1, HELD - 0.1, t);
        p.shade(cx - r - 3, cy - r * sq - 3, cx + r * (1 + fall * 0.5) + 3, 1, (x, y, out) => {
          if (-y > (climb * 2 * r + 6)) return;
          const d = Math.hypot((x - cx) / (r * (1 + wob + 0.5 * fall)), (y - cy) / (r * sq * (1 - wob)));
          if (d > 1) return;
          out.a = d > 0.9 ? 0.95 : 0.45;
          return d > 0.9 ? WAT[4] : noise2(x * 0.15, y * 0.15 - t, 152) > 0.3 ? WAT[3] : WAT[2];
        });
        if (fall < 0.3) p.arc(cx, cy, r - 3, 1, -2.4, -1.6, WHITE, 0.7 * (1 - fall * 3));
        // the link: where his hand goes into the surface, a ring of water pulled round the wrist, trembling
        if (t > PRISON + 0.15 && t < LET + 0.05) {
          const [hx, hy] = bodyAt(act.poses, t).handN;
          const k = smooth(PRISON + 0.15, HELD, t);
          p.ellipse(hx - 1, hy, 2.5 + Math.sin(t * 9) * 0.5, 4, WAT[4], 0.8 * k);
          p.px(hx - 3, hy - 3 + ((t * 20) | 0) % 6, WAT[5], 0.7 * k);
        }
      }
      void rand; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

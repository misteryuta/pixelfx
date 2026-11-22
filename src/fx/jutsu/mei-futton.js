// Futton: Koumu no Jutsu (Boil Release: Skilled Mist Technique, Mei Terumii, the Fifth Mizukage). Narutopedia: Mei's
// second kekkei genkai (fire and water) lets her breathe out an acidic mist; she can control its acidity, from mild to
// strong enough to melt flesh and rock; it spreads silently and corrodes everything it envelops. Here: Mei takes a slow
// breath and exhales a thick pale yellow-green mist from her lips; it rolls along the floor and swells round the
// target, bubbles of vapour bursting in it; the target's outline steams and pits, hissing, its colour bleaching; the
// mist thins and drifts away, leaving the floor scarred and steaming.
// New: the acid mist (rolling, translucent, bubbling), the corroding steam off the target.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, MOUTH } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const BREATH = 0.3, EXHALE = 0.8, REACH = 1.6, ACID = 1.9, THIN = 3.1, END = 4.0, TX = 170;
const MIST = ["#4a5a2a", "#8a9a4a", "#c8d878", "#eef8c0"].map(hex), STEAM = hex("#e8ecd8");

export const meta = {
  name: "Boil release: skilled mist",
  desc: "Mei: a slow breath, then a thick pale acid mist rolls from her lips along the floor and swells round the target, bubbling; it steams and corrodes, hissing, before the mist drifts away leaving the floor scarred.",
  tags: ["jutsu", "mei", "mizukage", "boil-release", "futton", "acid", "aoe", "one-shot"],
  size: [270, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a5a2a", "#8a9a4a", "#c8d878", "#eef8c0"], seed: 188 },
};

const INHALE = { ...READY, crouch: 2, lean: -8, fx: 6, fy: -26, bx: -4, by: -24, ffx: 8, fbx: -8 };
const BLOW = { ...READY, crouch: 4, lean: 8, fx: 9, fy: -30, bx: 4, by: -22, ffx: 10, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [BREATH + 0.3, INHALE, "out"],
    [EXHALE, BLOW, "out"],
    [THIN, BLOW],
    [END, READY],
  ],
  hits: [
    { t: BREATH, target: false, sfx: "cast" },
    { t: EXHALE, target: false, sfx: "whoosh" },
    ...[0, 0.35, 0.7, 1.05].map((d) => ({ t: ACID + d, stop: 0.02, flash: 0, push: 0.5, straw: 8, skin: "poison", shiver: 0.4 })),
    { t: THIN + 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const reach = (t) => 10 + (TX + 50 - 10) * ease.outCubic(clamp((t - EXHALE) / (REACH - EXHALE)));
  return {
    update(t, dt) {
      if (t > ACID && t < THIN + 0.3 && R.chance(30 * dt)) ps.spawn(P.SMOKE, TX + R.range(-10, 10), -R.range(10, 40), R.range(-8, 8), -R.range(20, 40), R.range(0.5, 0.9), STEAM, 1.2);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the scarred, steaming floor after
      if (t > ACID + 0.5) p.ellipse(TX, 0.5, 40, 2.5, hex("#2a3018"), smooth(ACID + 0.5, THIN, t));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), mx = (b.q.x ?? 0) + MOUTH[0], my = (b.q.y ?? 0) + MOUTH[1];
      drawBadge(p, t, { kind: "kiri", t0: 0.04, t1: BREATH, label: "FUTTON", head: b.head });
      // the mist: from her lips down along the floor, swelling into a cloud round the target, bubbling
      if (t > EXHALE && t < END - 0.1) {
        const x1 = reach(t), k = (t < THIN ? 1 : 1 - smooth(THIN, END - 0.1, t)) * 0.7;
        p.shade(mx - 2, -70, x1 + 20, 1, (x, y, out) => {
          const v = (x - mx) / Math.max(1, x1 - mx);
          if (v < 0 || v > 1.15) return;
          const cy = my + (-10 - my) * Math.min(1, v * 2.5), w = 4 + 10 * v + 26 * Math.exp(-Math.pow((x - TX) / 40, 2)) * smooth(REACH - 0.3, ACID, t);
          const n = noise2(x * 0.05 - t * 1.5, y * 0.07 + t * 0.5, 141), d = Math.abs(y - (cy + (-26 * smooth(REACH - 0.3, ACID, t) - 10 - cy) * smooth(TX - 100, TX - 40, x))) / w + n * 0.35;
          if (d > 1 || y > 0) return;
          out.a = k * (1 - d * 0.6);
          return d < 0.35 ? MIST[3] : d < 0.65 ? MIST[2] : MIST[1];
        });
        // bubbles of vapour bursting in it
        for (let i = 0; i < 8; i++) { const ph = (t * 1.3 + rand(i, 1)) % 1, x = TX - 40 + rand(i, 2) * 80, y = -6 - rand(i, 3) * 40; if (x < x1) p.ring(x, y, 1 + ph * 3, 1, MIST[3], 0.7 * (1 - ph) * k * 1.4); }
      }
      // the hiss: small pits flaring white on the target's surface
      if (t > ACID && t < THIN) for (let i = 0; i < 4; i++) { const ph = (t * 3 + i * 0.25) % 1; p.px(TX - 6 + rand(i, Math.floor(t * 3)) * 12, -40 + rand(i + 4, Math.floor(t * 3)) * 36, WHITE, 1 - ph); }
      void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

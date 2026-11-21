// Shunshin no Shisui (Shisui of the Body Flicker, Shisui Uchiha). Narutopedia: he was so fast with the Body Flicker that
// one Shisui seemed to be many, and he was named for it; his Mangekyou is Kotoamatsukami. Here: his Sharingan; then he
// moves, and where he was hangs a fading after-image; he is behind the target, a cut; above it, a cut; in front, low,
// a cut; on the other side, a cut; each time a new after-image left where he struck, until the target is ringed by
// half a dozen Shisuis, all fading; the real one is back where he started, putting his blade away, and every cut opens
// at once in a starburst of white lines; crows scatter from where the after-images were.
// New: the after-image ring, the delayed starburst of cuts, the crows.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const TX = 160, EYE = 0.05, GO = 0.6, STEP = 0.11, N = 6, HOMET = GO + STEP * N + 0.05, OPEN = HOMET + 0.45, END = OPEN + 1.6;
// where each strike happens: [x, y, face, pose]
const SLASH = { ...READY, crouch: 6, lean: 12, fx: 22, fy: -24, bx: -10, by: -20, ffx: 12, fbx: -11 };
const HIGH = { ...READY, crouch: 0, lean: 14, fx: 20, fy: -14, bx: -8, by: -34, ffx: 6, ffy: -12, fbx: -8, fby: -14 };
const LOW = { ...READY, crouch: 14, lean: 16, fx: 24, fy: -8, bx: -12, by: -18, ffx: 13, fbx: -12 };
const SPOTS = [[TX + 26, 0, -1, SLASH], [TX - 14, -46, 1, HIGH], [TX - 26, 0, 1, LOW], [TX + 22, -40, -1, HIGH], [TX + 30, 0, -1, LOW], [TX - 24, 0, 1, SLASH]];
const CROW = hex("#120c18");

export const meta = {
  name: "Shisui of the body flicker",
  desc: "Shisui: his Sharingan, then he is everywhere: behind the target, above it, low in front, on the other side, an after-image left at every cut until it is ringed by fading Shisuis; back where he started, every cut opens at once.",
  tags: ["jutsu", "shisui", "uchiha", "sharingan", "speed", "melee", "one-shot"],
  size: [290, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0608", "#6a1018", "#d02a3a", "#ff8a8a"], seed: 12 },
};

export const act = {
  target: { x: TX },
  ghost: "#ff8a8a",
  poses: [
    [-0.25, READY],
    [GO - 0.08, { ...READY, crouch: 6, lean: 6, fx: 10, fy: -18, bx: -6, by: -22 }, "out"],
    [HOMET, { ...READY, crouch: 4, lean: 2, fx: 2, fy: -18, bx: -6, by: -20, gait: false }, "snap"],
    [OPEN, { ...READY, crouch: 4, fx: -2, fy: -24, bx: -4, by: -22, gait: false }, "out"],
    [END, READY],
  ],
  hits: [
    { t: EYE, target: false, sfx: "cast" },
    ...SPOTS.map((_, i) => ({ t: GO + STEP * i + 0.02, stop: 0.03, shake: 0.1, amp: 1, push: 0.6, straw: 4, flash: 0.02, sfx: "whoosh" })),
    { t: OPEN, stop: 0.2, shake: 0.6, amp: 4, push: 5, straw: 50, skin: "red", sfx: "heavy" },
    { t: OPEN + 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// while he flickers round the target, the real body isn't at home
export const actorAlpha = (t) => (t > GO - 0.02 && t < HOMET ? 0 : 1);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), crows = [];
  return {
    update(t, dt) {
      if (t >= OPEN && !crows.length) {
        lights.add(TX, -26, 140, WHITE, 0.8, 0.3);
        SPOTS.forEach(([x, y]) => { for (let j = 0; j < 3; j++) crows.push({ x, y: y - 16, vx: R.range(-90, 90), vy: -R.range(40, 120), age: 0, ph: R.range(0, TAU) }); });
      }
      for (const c of crows) { c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy -= 30 * dt; }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "sharingan", t0: EYE, t1: GO - 0.1, label: "SHUNSHIN", head: b.head });
      drawGlint(p, t, "sharingan", HOMET, END - 0.3, b.head);
      // the flicker: at each spot in turn he is there, solid for an instant, then an after-image that fades
      SPOTS.forEach(([x, y, face, q], i) => {
        const t0 = GO + STEP * i, a = t - t0;
        if (a < 0) return;
        const solid = a < STEP * 0.7, fade = solid ? 1 : 1 - smooth(0, 1.1, t - t0 - STEP * 0.7) * (t > OPEN ? 1 : 0.4);
        if (fade <= 0) return;
        drawFigure(p, { ...q, y }, x, y, { face, tint: solid ? 0 : hex("#d02a3a"), k: solid ? 0 : 0.6, a: solid ? 1 : 0.5 * fade });
        // the cut he makes there: a thin white stroke across the target, lingering faint until they all open
        const sx = TX + (rand(i, 1) - 0.5) * 10, sy = -26 + (rand(i, 2) - 0.5) * 24, ang = rand(i, 3) * Math.PI;
        const k = a < 0.08 ? 1 : t < OPEN ? 0.3 : 0;
        if (k > 0) p.line(sx - Math.cos(ang) * 16, sy - Math.sin(ang) * 16, sx + Math.cos(ang) * 16, sy + Math.sin(ang) * 16, WHITE, k);
        // the flicker streak from the last spot
        if (a < 0.05 && i > 0) p.line(SPOTS[i - 1][0], SPOTS[i - 1][1] - 20, x, y - 20, hex("#ff8a8a"), 0.7);
      });
      // all the cuts open at once: a starburst of white lines through the target
      if (t > OPEN && t < OPEN + 0.5) {
        const u = (t - OPEN) / 0.5, k = 1 - u;
        p.glow(TX, -26, 50 * (1 - u) + 10, WHITE, 0.7 * k);
        SPOTS.forEach((_, i) => {
          const ang = rand(i, 3) * Math.PI, L = 18 + 30 * ease.outCubic(u), sx = TX + (rand(i, 1) - 0.5) * 10, sy = -26 + (rand(i, 2) - 0.5) * 24;
          p.beam(sx - Math.cos(ang) * L, sy - Math.sin(ang) * L, sx + Math.cos(ang) * L, sy + Math.sin(ang) * L, 2.5 * k + 0.5, WHITE, k);
        });
      }
      // the blade put away at home: a glint at his hip
      if (t > HOMET && t < HOMET + 0.3) p.px(b.handN[0], b.handN[1], WHITE);
      // crows scattering from where the after-images were
      for (const c of crows) {
        const k = 1 - smooth(0.8, 1.4, c.age), flap = Math.floor(c.age * 14 + c.ph) % 2;
        p.rect(c.x - 1, c.y, 3, 1, CROW, k);
        p.line(c.x - 1, c.y, c.x - 3, c.y - (flap ? 2 : -1), CROW, k);
        p.line(c.x + 1, c.y, c.x + 3, c.y - (flap ? 2 : -1), CROW, k);
      }
      void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

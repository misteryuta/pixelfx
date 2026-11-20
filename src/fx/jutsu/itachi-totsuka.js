// Susanoo: Totsuka no Tsurugi (Sword of Totsuka, Itachi). Narutopedia: the sword is the sake jar it lives in; the blade is
// the liquid poured out and shaped, and whoever it pierces is drawn into the jar and sealed in a genjutsu dream forever;
// with the Yata Mirror, which turns back any attack, it makes Itachi's Susanoo all but invincible. Here: his Mangekyou,
// the red Susanoo growing round him (ribs, bones, then flesh from the chest out, the long tengu nose last), the mirror
// on its far arm; it lifts the jar overhead, the liquid blade pours up out of it, and it brings the sword down in one
// great arc that lengthens as it falls and runs the target through; the target is drawn, swirling, back up the blade
// into the jar and sealed, and returns at the end.
// New: the jar, the blade raised and swung (a smear of its arc behind it), the Yata mirror, the seal (targetState:
// drawn in, spun, gone). From _susanoo.js: the Susanoo.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, mix, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, SUSANOO } from "./_susanoo.js";

const EYE = 0.05, OPEN = 0.6, RIBS = OPEN + 0.05, BONES = RIBS + 0.3, FLESH = BONES + 0.3, JAR = FLESH + 0.55, POUR = JAR + 0.25, RAISE = POUR + 0.35, SWING = RAISE + 0.12, STAB = SWING + 0.16, SEAL = STAB + 0.3, DONE = SEAL + 1.0, TX = 170;
const RD = SUSANOO.itachi, REST = [50, -56], UP = [24, -104], STRIKE = [64, -58];
const A_UP = -1.85, A_HIT = Math.atan2(-30 - STRIKE[1] + 4, TX - 4 - STRIKE[0] - 6), L_UP = 58, L_HIT = Math.hypot(TX - 4 - STRIKE[0] - 6, -30 - STRIKE[1] + 4) + 8;
// the Susanoo's sword hand, the blade's angle and length at time t
const swordAt = (t) => {
  let h = REST;
  if (t > JAR && t < SWING) {
    const u = ease.inOutCubic(smooth(JAR, RAISE, t));
    h = [REST[0] + (UP[0] - REST[0]) * u, REST[1] + (UP[1] - REST[1]) * u];
  } else if (t >= SWING && t < DONE) {
    const u = ease.inCubic(clamp((t - SWING) / (STAB - SWING)));
    h = [UP[0] + (STRIKE[0] - UP[0]) * u, UP[1] + (STRIKE[1] - UP[1]) * u];
  } else if (t >= DONE) {
    const u = smooth(DONE, DONE + 0.5, t);
    h = [STRIKE[0] + (REST[0] - STRIKE[0]) * u, STRIKE[1] + (REST[1] - STRIKE[1]) * u];
  }
  const sw = ease.inCubic(clamp((t - SWING) / (STAB - SWING)));
  return { h, a: A_UP + (A_HIT - A_UP) * sw, L: (L_UP + (L_HIT - L_UP) * sw) * smooth(POUR, RAISE, t) * (1 - ease.inCubic(smooth(DONE - 0.2, DONE + 0.3, t))) };
};

export const meta = {
  name: "Sword of Totsuka",
  desc: "Itachi: his Mangekyou, a red Susanoo with a long tengu nose rising round him, the Yata mirror on its arm, the sake jar in its hand pouring out a wavering blade that runs the target through and draws it, swirling, back into the jar.",
  tags: ["jutsu", "itachi", "susanoo", "mangekyou", "sword", "seal", "one-shot"],
  size: [306, 244],
  origin: [64, 202],
  duration: DONE + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a0808", "#8a1418", "#d8302c", "#ff7a5a", "#ffd0c0"], seed: 39 },
};

const CALM = { ...READY, crouch: 2, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 6, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [RAISE, { ...CALM, crouch: 3, lean: -3, fx: 6, fy: -34, bx: -2, by: -20 }, "out"],
    [STAB, { ...CALM, crouch: 6, lean: 6, fx: 15, fy: -22 }, "in"],
    [DONE, CALM],
    [meta.duration, CALM],
  ],
  hits: [
    { t: RIBS, stop: 0.06, shake: 0.15, amp: 1, target: false },
    { t: STAB, stop: 0.16, shake: 0.35, amp: 3, push: 2, straw: 26, skin: "red" },
    ...[0.25, 0.5, 0.75].map((d) => ({ t: SEAL + d, stop: 0.02, flash: 0, push: 0.4, straw: 6, shiver: 0.8, skin: "shadow" })),
    { t: DONE + 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// the target, sealed: drawn up the blade toward the jar, spun and thinned to nothing; back for the end of the loop
export const targetState = (t) => {
  if (t < SEAL) return null;
  if (t < DONE) {
    const u = ease.inCubic(smooth(SEAL, DONE, t));
    return { dx: (STRIKE[0] + 30 - TX) * u * 0.5, dy: -10 * u, rot: 7 * u * u, s: 1 - 0.7 * u, a: 1 - u, tint: [RD[2], 0.6 * u] };
  }
  return { a: smooth(meta.duration - 0.9, meta.duration - 0.4, t) };
};

// the blade: a stream of liquid from the jar's mouth along angle a, L long, wavering, tapering to the point
function blade(p, t, x0, y0, a, L, k) {
  const MOUTH = [x0, y0], ux = Math.cos(a), uy = Math.sin(a), n = Math.max(L, 1);
  for (let i = 0; i < L; i++) {
    const s = i / n, w = 3.2 * (1 - s * 0.6) * (1 + 0.2 * Math.sin(i * 0.6 - t * 18)), off = Math.sin(i * 0.25 - t * 10) * 1.4 * s;
    const x = MOUTH[0] + ux * i - uy * off, y = MOUTH[1] + uy * i + ux * off;
    p.line(x + uy * w, y - ux * w, x - uy * w, y + ux * w, RD[3], k);
    p.px(x + uy * (w * 0.3), y - ux * (w * 0.3), RD[4]);
    p.px(x + uy * (w + 0.6), y - ux * (w + 0.6), WHITE);
  }
  p.glowLine(MOUTH[0], MOUTH[1], MOUTH[0] + ux * L, MOUTH[1] + uy * L, 14, RD[3], 0.6 * k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let stabbed = false;
  return {
    update(t, dt) {
      if (!stabbed && t >= STAB) {
        stabbed = true;
        lights.add(TX, -30, 70, RD[3], 0.9, 0.2);
      }
      // the target, sealed: streams of it pulled back up the blade into the jar
      if (t > SEAL && t < DONE && R.chance(70 * dt)) {
        const T = R.range(0.25, 0.4), dx = STRIKE[0] + 6 - TX, dy = STRIKE[1] - 4 + 30;
        ps.spawn(P.STREAK, TX + R.range(-8, 8), -30 + R.range(-16, 16), dx / T, dy / T, T, R.chance(0.5) ? RD[4] : RD[3]);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const stage = t < RIBS ? 0 : t < BONES ? smooth(RIBS, BONES, t) : t < FLESH ? 1 + smooth(BONES, FLESH, t) : 2 + smooth(FLESH, FLESH + 0.55, t);
      const fade = smooth(DONE, DONE + 0.6, t);
      // the Yata mirror on the far arm: a round shield with its ring of magatama, behind the body
      if (stage > 2) {
        const k = clamp(stage - 2) * (1 - fade);
        p.circle(-30, -54, 15, RD[1], k);
        p.ring(-30, -54, 15, 2, RD[4], k);
        p.ring(-30, -54, 10, 1, RD[3], k);
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6 + t * 0.5;
          p.circle(-30 + Math.cos(a) * 12.5, -54 + Math.sin(a) * 12.5, 1.4, RD[4], k);
        }
        p.circle(-30, -54, 3, RD[4], k);
      }
      drawSusanoo(p, t, { kind: "itachi", stage, arm: swordAt(t).h, fade });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "itachi", t0: EYE, t1: OPEN, label: "MANGEKYOU", head: b.head });
      drawGlint(p, t, "itachi", OPEN + 0.05, meta.duration - 0.3, b.head);
      const fade = smooth(DONE, DONE + 0.6, t);
      // the sake jar in the Susanoo's hand
      const sw = swordAt(t);
      if (t > JAR - 0.15 && fade < 1) {
        const k = smooth(JAR - 0.15, JAR, t) * (1 - fade), [jx, jy] = sw.h;
        p.circle(jx + 1, jy + 3, 5, hex("#6a2a1a"), k);
        p.circle(jx + 3, jy - 3, 3, hex("#8a3a22"), k);
        p.rect(jx + 4, jy - 7, 3, 3, hex("#3a1a10"), k);
        p.px(jx - 1, jy + 1, hex("#c8784a"));
      }
      // the blade pours out and reaches through the target, then is drawn back once the target is in the jar
      if (t > POUR && t < DONE + 0.3 && sw.L > 1) {
        const mx = sw.h[0] + 6, my = sw.h[1] - 4;
        // the smear of the swing: fading copies of the blade along the arc just behind it, and a bright crescent
        if (t > SWING && t < STAB + 0.12) {
          const back = Math.min(1.4, sw.a - A_UP), fadeS = 1 - smooth(STAB, STAB + 0.12, t);
          for (let i = 1; i <= 6; i++) {
            const a = sw.a - (back * i) / 6, ux = Math.cos(a), uy = Math.sin(a);
            p.beam(mx + ux * 14, my + uy * 14, mx + ux * sw.L, my + uy * sw.L, 2, RD[3], 0.45 * (1 - i / 7) * fadeS);
          }
          if (back > 0.05) {
            p.arc(mx, my, sw.L * 0.92, 3, sw.a - back, sw.a, RD[4], 0.7 * fadeS);
            p.arc(mx, my, sw.L * 0.92, 1, sw.a - back * 0.6, sw.a, WHITE, fadeS);
          }
        }
        blade(p, t, mx, my, sw.a, sw.L, 1);
      }
      // the seal: a spiral closing in on the target
      if (t > SEAL && t < DONE) {
        const u = clamp((t - SEAL) / (DONE - SEAL));
        for (let i = 0; i < 3; i++) {
          const a0 = -t * 9 + (i * TAU) / 3;
          p.arc(TX, -28, 24 * (1 - u) + 4, 1, a0, a0 + 2, i ? RD[3] : RD[4], 1 - u * 0.5);
        }
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

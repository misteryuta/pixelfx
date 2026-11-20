// Susanoo: Totsuka no Tsurugi (Sword of Totsuka, Itachi). Narutopedia: the sword is the sake jar it lives in; the blade is
// the liquid poured out and shaped, and whoever it pierces is drawn into the jar and sealed in a genjutsu dream forever;
// with the Yata Mirror, which turns back any attack, it makes Itachi's Susanoo all but invincible. Here: his Mangekyou,
// the red Susanoo rising round him (long tengu nose), the mirror on its far arm, the gourd in its hand pouring out a
// wavering blade that runs the target through, and the target dragged in a swirl back up the blade into the jar.
// New: the jar and its liquid blade, the Yata mirror, the sealing swirl. From _susanoo.js: the Susanoo.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, mix, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, SUSANOO } from "./_susanoo.js";

const EYE = 0.05, OPEN = 0.6, RIBS = OPEN + 0.05, BONES = RIBS + 0.3, FLESH = BONES + 0.3, JAR = FLESH + 0.25, POUR = JAR + 0.3, STAB = POUR + 0.25, SEAL = STAB + 0.3, DONE = SEAL + 1.0, TX = 170;
const RD = SUSANOO.itachi, ARM = [50, -56];

export const meta = {
  name: "Sword of Totsuka",
  desc: "Itachi: his Mangekyou, a red Susanoo with a long tengu nose rising round him, the Yata mirror on its arm, the sake jar in its hand pouring out a wavering blade that runs the target through and draws it, swirling, back into the jar.",
  tags: ["jutsu", "itachi", "susanoo", "mangekyou", "sword", "seal", "one-shot"],
  size: [300, 220],
  origin: [64, 178],
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
    [STAB, { ...CALM, crouch: 4, fx: 12, fy: -26 }, "out"],
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

// the blade: a stream of liquid from the jar's mouth to the tip, wavering along its length
const MOUTH = [ARM[0] + 6, ARM[1] - 4];
function blade(p, t, L, k) {
  const tx = TX - 4, ty = -30, dx = tx - MOUTH[0], dy = ty - MOUTH[1], n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n;
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
        const T = R.range(0.25, 0.4), dx = MOUTH[0] - TX, dy = MOUTH[1] + 30;
        ps.spawn(P.STREAK, TX + R.range(-8, 8), -30 + R.range(-16, 16), dx / T, dy / T, T, R.chance(0.5) ? RD[4] : RD[3]);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const stage = t < RIBS ? 0 : t < BONES ? smooth(RIBS, BONES, t) : t < FLESH ? 1 + smooth(BONES, FLESH, t) : 2 + smooth(FLESH, FLESH + 0.25, t);
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
      drawSusanoo(p, t, { kind: "itachi", stage, arm: ARM, fade });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "itachi", t0: EYE, t1: OPEN, label: "MANGEKYOU", head: b.head });
      drawGlint(p, t, "itachi", OPEN + 0.05, meta.duration - 0.3, b.head);
      const fade = smooth(DONE, DONE + 0.6, t);
      // the sake jar in the Susanoo's hand
      if (t > JAR && fade < 1) {
        const k = smooth(JAR, JAR + 0.15, t) * (1 - fade), [jx, jy] = ARM;
        p.circle(jx + 1, jy + 3, 5, hex("#6a2a1a"), k);
        p.circle(jx + 3, jy - 3, 3, hex("#8a3a22"), k);
        p.rect(jx + 4, jy - 7, 3, 3, hex("#3a1a10"), k);
        p.px(jx - 1, jy + 1, hex("#c8784a"));
      }
      // the blade pours out and reaches through the target, then is drawn back once the target is in the jar
      if (t > POUR && t < DONE + 0.3) {
        const full = Math.hypot(TX - 4 - MOUTH[0], -30 - MOUTH[1]) + 10;
        const L = full * ease.outCubic(clamp((t - POUR) / (STAB - POUR))) * (1 - ease.inCubic(smooth(DONE - 0.2, DONE + 0.3, t)));
        blade(p, t, L, 1);
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

// Kirigakure + Silent Killing (Zabuza Momochi, the Demon of the Hidden Mist). Narutopedia: he blankets the field in
// mist so thick his foes can't see their own hands, and kills without a sound, guided only by hearing; his blade is
// the Kubikiribouchou, the huge Executioner's Blade. Here: the seal held up, the mist rolling in until the whole floor
// is gone and the target stands alone in white; silence; his eyes glint in the mist on one side, then the other;
// the giant blade's edge slides out of the white behind the target; one horizontal sweep; the mist torn open along the
// cut, the target struck, and Zabuza already standing past it with the blade over his shoulder as the mist thins.
// New: the mist (noise-shaded layers), the glinting eyes, the cleaver and its sweep through the mist.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 150, SEAL = 0.3, MIST = 0.55, THICK = 1.35, EYES1 = 1.55, EYES2 = 1.95, EDGE = 2.3, CUT = 2.55, THIN = 3.1, END = 4.3;
const MISTC = ["#5a6a7a", "#8a9cac", "#bccad6", "#e4ecf2"].map(hex), STEEL = ["#3a4250", "#8a96a8", "#d8e0ea", "#ffffff"].map(hex);
const PAST = TX + 34;

export const meta = {
  name: "Hidden mist: silent killing",
  desc: "Zabuza: the mist rolls in until the target stands alone in white; his eyes glint on one side, then the other; the Executioner's Blade slides out of the mist and sweeps once, tearing the mist open, and he is already past.",
  tags: ["jutsu", "zabuza", "kiri", "mist", "sword", "assassination", "one-shot"],
  size: [300, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#5a6a7a", "#8a9cac", "#bccad6", "#e4ecf2"], seed: 29 },
};

const SEALP = { ...READY, crouch: 3, fx: 6, fy: -30, bx: -2, by: -18, ffx: 7, fbx: -7 };
const OVER = { ...READY, x: PAST, face: -1, crouch: 9, lean: 10, fx: 22, fy: -18, bx: -10, by: -22, ffx: 12, fbx: -11, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SEAL, SEALP, "out"],
    [THICK, SEALP],
    [CUT, OVER, "snap"],
    [THIN + 0.2, { ...OVER, crouch: 7 }],
    [END - 0.3, { ...READY, x: PAST, face: -1, fx: 6, fy: -36, bx: 4, by: -36, gait: false }, "out"],
    [END, { ...READY, x: PAST, face: -1, fx: 6, fy: -36, bx: 4, by: -36, gait: false }],
  ],
  hits: [
    { t: SEAL, target: false, sfx: "cast" },
    { t: CUT - 0.05, target: false, sfx: "whoosh" },
    { t: CUT, stop: 0.22, shake: 0.6, amp: 4, push: -6, straw: 50, skin: "red", sfx: "heavy" },
    { t: CUT + 0.7, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// gone into the mist
export const actorAlpha = (t) => (t < MIST + 0.4 ? 1 : t < CUT ? 1 - smooth(MIST + 0.4, THICK, t) : 1);

// the Executioner's Blade: a huge cleaver, a round hole near the tip, a half-moon notch in its back
function cleaver(p, x, y, a, k = 1) {
  const c = Math.cos(a), s = Math.sin(a), at = (i, j) => [x + c * i - s * j, y + s * i + c * j];
  p.beam(...at(-10, 0), ...at(0, 0), 2, hex("#2a2230"), k);
  p.poly([at(0, -3), at(46, -3), at(52, 6), at(0, 10)], STEEL[1], k);
  p.poly([at(0, -3), at(46, -3), at(46, 0), at(0, 0)], STEEL[2], k);
  p.line(...at(0, 10), ...at(52, 6), STEEL[3], k);
  p.circle(...at(42, 2), 2.5, hex("#0a0c12"), k);
  p.circle(...at(20, -3), 3, hex("#0a0c12"), k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      if (t >= CUT && !this.c) { this.c = 1; lights.add(TX, -26, 140, WHITE, 0.8, 0.3); for (let i = 0; i < 18; i++) ps.spawn(P.STREAK, TX, -26, R.range(-200, 60), R.range(-60, 60), R.range(0.1, 0.25), WHITE); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "kiri", t0: 0.04, t1: SEAL + 0.1, label: "KIRIGAKURE", head: b.head });
      // the mist: layers of fog rolling in from the edges until everything but a pocket round the target is white;
      // torn open along the cut; thinning at the end
      const thick = smooth(MIST, THICK, t) * (1 - smooth(THIN, END - 0.3, t));
      if (thick > 0) p.shade(-56, -150, 244, 30, (x, y, out) => {
        const n = noise2(x * 0.02 + t * 0.4, y * 0.04, 3) * 0.3 + noise2(x * 0.05 - t * 0.7, y * 0.08, 8) * 0.15;
        // a pocket of clear air round the target until the cut
        const pocket = t < CUT ? Math.max(0, 1 - Math.hypot((x - TX) / 26, (y + 26) / 34)) * 0.8 : 0;
        // the tear along the cut: a band of clear air that widens and then fills in again
        const tear = t > CUT ? Math.max(0, 1 - Math.abs(y + 26) / (4 + 14 * smooth(CUT, CUT + 0.4, t))) * (1 - smooth(CUT + 0.4, THIN + 0.4, t)) : 0;
        const d = thick * (0.75 + n) - pocket - tear;
        if (d < 0.25) return;
        out.a = d > 0.5 ? 1 : 0.5;
        return d > 0.8 ? MISTC[3] : d > 0.55 ? MISTC[2] : MISTC[1];
      });
      // his eyes in the mist: a glint on one side, then the other
      const glint = (x, y, at) => { const a = t - at; if (a < 0 || a > 0.3) return; const k = Math.sin((a / 0.3) * Math.PI); p.rect(x - 1, y, 3, 1, hex("#1a1420"), k); p.rect(x + 4, y, 3, 1, hex("#1a1420"), k); p.px(x, y, WHITE, k); p.px(x + 5, y, WHITE, k); p.glow(x + 3, y, 10, hex("#ff3a3a"), 0.5 * k); };
      glint(TX - 60, -40, EYES1);
      glint(TX + 52, -34, EYES2);
      // the blade's edge sliding out of the white behind the target, then the sweep
      if (t > EDGE && t < CUT) { const u = smooth(EDGE, CUT - 0.05, t); cleaver(p, TX + 70 - 18 * u, -26, Math.PI, u); }
      if (t >= CUT - 0.05 && t < CUT + 0.12) {
        const u = clamp((t - CUT + 0.05) / 0.17);
        p.glowLine(TX + 60, -26, TX - 60, -26, 10, WHITE, 0.6 * (1 - u));
        p.beam(TX + 60 - 120 * u, -27, TX + 60, -27, 3, WHITE, 1 - u);
      }
      if (t > CUT && t < END) {
        const k = 1 - smooth(THIN, END - 0.3, t);
        // the blade over his shoulder once he has passed
        cleaver(p, b.handN[0] - 2, b.handN[1] - 2, t < CUT + 0.4 ? Math.PI + 0.3 : -2.4 + (1 - smooth(CUT + 0.4, END - 0.3, t)) * 0.3, k + (1 - k));
      }
      void rand; void ease; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

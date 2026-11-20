// Asa Kujaku (Morning Peacock, Might Guy). Narutopedia: a certain-kill taijutsu that needs the Eight Gates opened up to
// the sixth; the opponent is kicked into the air, then the user, in a distinctive stance, punches so fast the friction
// sets the air alight, the countless burning blows fanning out behind the target like a peacock's tail. Here: the sixth
// gate (red skin, green chakra blazing round him, steam), a kick, his stance, and the punches: each one a streak of fire
// thrown out behind the target, more and more until they spread into a fan of flame, and a last blow that blows it apart.
// New: the peacock fan (tapering flame streaks laid out over a half circle behind the target, each lit by a punch), the
// gates (_lib drawGates). From the library: the hit spark on every punch, small.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as spark from "../impacts/hit-spark.js";
import { play, bodyAt, drawGates } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const GATE = 0.1, OPENED = GATE + 0.5, KICK = OPENED + 0.25, STANCE = KICK + 0.25, P0 = STANCE + 0.15, NP = 26, PG = 0.045, LAST = P0 + NP * PG + 0.1, END = LAST + 1.3, TX = 130;
const FAN = ["#7a1a2a", "#e0304a", "#ff7a3a", "#ffc23d", "#fff3a6"].map(hex);

export const meta = {
  name: "Morning peacock",
  desc: "Might Guy: the sixth gate opened, red skin and green chakra blazing, a kick, his stance, then punches so fast they catch fire, fanning out behind the target like a peacock's tail, and a last blow that blows it apart.",
  tags: ["jutsu", "guy", "taijutsu", "gates", "fire", "combo", "melee", "one-shot"],
  size: [260, 180],
  origin: [50, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#7a1a2a", "#e0304a", "#ff7a3a", "#ffc23d", "#fff3a6"], seed: 54 },
};

const BRACE = { ...READY, crouch: 9, lean: -2, fx: 12, fy: -16, bx: -6, by: -16, ffx: 12, fbx: -12 };
const STAN = { ...READY, x: TX - 32, crouch: 6, lean: 6, fx: 14, fy: -30, bx: -4, by: -26, ffx: 12, fbx: -10 };
const KICKP = { ...READY, x: TX - 28, crouch: 0, lean: -12, fx: -6, fy: -26, bx: 6, by: -30, ffx: 16, ffy: -30, fbx: -4 };
const punch = (i) => ({ ...STAN, lean: 10, crouch: 6, ...(i % 2 ? { fx: 21, fy: -20 - (i * 7) % 20, bx: -6, by: -22 } : { fx: 4, fy: -26, bx: 21, by: -18 - (i * 5) % 22, armsFront: true }) });
export const act = {
  target: { x: TX },
  ghost: "#5ae86a",
  poses: [
    [-0.25, READY],
    [GATE + 0.2, BRACE, "out"],
    [OPENED, { ...BRACE, crouch: 7 }],
    [KICK - 0.06, { ...STAN, crouch: 9, lean: 14, ghost: true }, "in"],
    [KICK, KICKP, "snap"],
    [STANCE, STAN, "out"],
    ...Array.from({ length: NP }, (_, i) => [P0 + i * PG, punch(i), "snap"]).filter((_, i) => i % 2 === 0),
    [LAST, { ...STAN, lean: 16, crouch: 8, fx: 23, fy: -26, bx: -10, by: -20 }, "snap"],
    [END - 0.4, STAN],
    [END, STAN],
  ],
  hits: [
    { t: OPENED, stop: 0.08, shake: 0.3, amp: 2, target: false },
    { t: KICK, stop: 0.08, shake: 0.15, amp: 2, push: 2, straw: 14 },
    ...Array.from({ length: 6 }, (_, i) => ({ t: P0 + i * PG * 4, stop: 0.02, flash: 0, push: 0.6, straw: 6, shiver: 0.3 })),
    { t: LAST, stop: 0.2, shake: 0.5, amp: 4, push: 6, straw: 40, skin: "char" },
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: OPENED, x: 0, n: 12 }, { t: KICK - 0.06, x: TX - 40, n: 6, dir: -1 }],
};

// the fan: each streak a direction behind/above the target and a length, lit in turn
const STREAKS = Array.from({ length: NP }, (_, i) => ({ a: -1.45 + (i / (NP - 1)) * 1.75 + (rand(i, 1) - 0.5) * 0.12, L: 34 + rand(i, 2) * 26, w: 2.5 + rand(i, 3) * 2 }));
const FX = TX - 6, FY = -30;

export const create = play(Array.from({ length: 5 }, (_, i) => ({ fx: spark, t: P0 + i * PG * 5, x: TX - 10, height: 22 + (i % 3) * 6, seed: 60 + i, palette: ["#7a1a2a", "#e0304a", "#ff7a3a", "#ffc23d", "#fff3a6", "#ffffff", "#ffffff"] })), (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let last = false;
  return {
    update(t, dt) {
      if (!last && t >= LAST) {
        last = true;
        for (let i = 0; i < 30; i++) {
          const a = R.range(-1.6, 0.4), s = R.range(80, 240);
          ps.spawn(P.FIRE, FX, FY, Math.cos(a) * s, Math.sin(a) * s, R.range(0.3, 0.6), 0, R.range(2, 4));
        }
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      drawGates(p, t, b.q, 6, smooth(GATE, GATE + 0.3, t) * (1 - smooth(END - 0.5, END, t)), "back");
      // the peacock's tail, behind the target: a streak of fire for each punch, spreading into a fan
      const blow = smooth(LAST, LAST + 0.5, t);
      STREAKS.forEach((s, i) => {
        const a = t - P0 - i * PG;
        if (a < 0) return;
        const grow = ease.outCubic(clamp(a / 0.12)), fade = 1 - smooth(LAST + 0.1, LAST + 0.7, t), L = s.L * grow * (1 + blow * 0.6);
        if (fade <= 0) return;
        const ca = Math.cos(s.a), sa = Math.sin(s.a);
        for (let d = 4; d < L; d += 1) {
          const w = s.w * (1 - d / L) * (0.7 + 0.3 * Math.sin(d * 0.7 - t * 30)), x = FX + ca * d, y = FY + sa * d;
          const c = d / L < 0.25 ? FAN[4] : d / L < 0.5 ? FAN[3] : d / L < 0.8 ? FAN[2] : FAN[1];
          p.line(x - sa * w, y + ca * w, x + sa * w, y - ca * w, c, fade);
        }
        // the eye of the feather at its tip
        p.circle(FX + ca * L, FY + sa * L, 2, FAN[1], fade);
        p.px(FX + ca * L, FY + sa * L, FAN[4]);
      });
      if (t > P0) p.glow(FX + 20, FY - 16, 60, FAN[2], 0.5 * (1 - smooth(LAST + 0.1, LAST + 0.8, t)));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "gate", t0: GATE, t1: OPENED, label: "6TH GATE", head: b.head });
      drawGates(p, t, b.q, 6, smooth(GATE, GATE + 0.3, t) * (1 - smooth(END - 0.5, END, t)), "front");
      const a = t - LAST;
      if (a > -0.05 && a < 1) p.text("ASA KUJAKU!", TX - 10, -112, a < 0.05 ? WHITE : FAN[3], { font: "big", align: "center", outline: hex("#120c18") });
      if (a > 0 && a < 0.06) p.circle(FX, FY, 22, WHITE);
      ps.draw(p, "front");
    },
  };
});

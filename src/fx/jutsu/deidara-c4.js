// C4 Karura (Deidara). Narutopedia: Deidara's art taken to the microscopic: he releases a giant clay figure of himself
// that bursts into a cloud of countless microscopic bombs; anyone who breathes them in is disintegrated from within when
// he sets them off: their body crumbles into dust from the inside. Here: Deidara's hand-mouths chew the clay; he spits it
// out and it swells into a giant pale effigy of himself; the effigy distorts, then bursts into a fine glittering mist
// that drifts over the field; the target breathes it in; Deidara forms the seal: "KATSU!": the target's body breaks
// up into flecks of dust from the inside, small bright pops all through it, and dissolves; the dust settles. (A
// training dummy reforms after.)
// New: the effigy, the nano mist (thousands of faint dots), the disintegration from within.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const CHEW = 0.3, SPIT = 0.8, GIANT = 1.4, BURST = 2.0, DRIFT = 2.6, SEAL = 3.0, KATSU = 3.2, DUST = 3.9, END = 4.9, TX = 180;
const CLAY = ["#8a8270", "#c8c0a8", "#f0ece0"].map(hex), MIST = hex("#d8e0f0"), POP = ["#ffd060", "#fff4c0"].map(hex);

export const meta = {
  name: "C4 Karura",
  desc: "Deidara: a giant pale effigy of himself swells from his clay and bursts into a glittering mist of microscopic bombs that drifts over the target; he forms the seal, KATSU!, and the target breaks up into dust from the inside.",
  tags: ["jutsu", "deidara", "akatsuki", "explosion-release", "clay", "aoe", "one-shot"],
  size: [280, 220],
  origin: [56, 190],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#8a8270", "#c8c0a8", "#f0ece0", "#ffd060"], seed: 195 },
};

const SEALP = { ...READY, crouch: 3, fx: 9, fy: -32, bx: -4, by: -20, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CHEW, { ...READY, crouch: 3, fx: 8, fy: -18, bx: -6, by: -18 }, "out"],
    [SPIT, { ...READY, crouch: 4, lean: 6, fx: 18, fy: -24 }, "out"],
    [SEAL, SEALP, "out"],
    [END, SEALP],
  ],
  hits: [
    { t: SPIT, target: false, sfx: "whoosh" },
    { t: GIANT, shake: 0.6, amp: 2, target: false, sfx: "rumble" },
    { t: BURST, stop: 0.08, shake: 0.4, amp: 2, target: false, sfx: "explosion" },
    { t: KATSU, stop: 0.3, shake: 0.4, amp: 2, push: 0, straw: 60, flash: 0.05, skin: "char", sfx: "explosion" },
    { t: DUST + 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// the target dissolves from within, then a dummy pops back
export const targetState = (t) => (t > KATSU && t < DUST + 0.6 ? { a: 1 - smooth(KATSU + 0.1, DUST, t) } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const EX = 90;
  return {
    update(t, dt) {
      if (t > KATSU && t < DUST && R.chance(80 * dt)) ps.spawn(P.DUST, TX + R.range(-8, 8), -R.range(4, 46), R.range(-20, 20), -R.range(4, 30), R.range(0.6, 1.2), CLAY[R.int(0, 2)]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the effigy: a giant pale copy of Deidara swelling up, distorting, bursting
      if (t > SPIT + 0.1 && t < BURST + 0.05) {
        const g = ease.outBack(smooth(SPIT + 0.1, GIANT, t), 1.2), wob = smooth(GIANT + 0.2, BURST, t), s = 3.2 * g * (1 + 0.08 * Math.sin(t * 30) * wob);
        p.shade(EX - 60, -170, EX + 60, 1, (x, y, out) => {
          const lx = (x - EX) / s, ly = y / s;
          const body = (lx / 9) ** 2 + ((ly + 22) / 18) ** 2 < 1 || (lx / 6) ** 2 + ((ly + 44) / 6) ** 2 < 1 || Math.abs(lx) < 4 && ly > -8;
          if (!body) return;
          out.a = 0.9;
          return noise2(lx * 0.5, ly * 0.4 + wob * 3, 161) > 0.4 * (1 - wob) ? CLAY[2] : CLAY[1];
        });
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "deidara", t0: 0.04, t1: CHEW, label: "C4 KARURA", head: b.head });
      // the hand-mouth chewing
      if (t > CHEW && t < SPIT) { const [x, y] = b.handN; p.line(x - 1, y, x + 1, y + (Math.floor(t * 12) % 2), hex("#6a1a1a")); }
      // the nano mist: thousands of faint glittering points drifting from the burst over the field
      if (t > BURST && t < DUST + 0.5) {
        const k = smooth(BURST, BURST + 0.1, t) * (1 - smooth(DUST, DUST + 0.5, t)), spread = ease.outCubic(smooth(BURST, DRIFT, t));
        for (let i = 0; i < 220; i++) {
          const a = rand(i, 1) * TAU, r = rand(i, 2) * 90 * spread, x = EX + Math.cos(a) * r + (TX - EX) * smooth(BURST, DRIFT + 0.3, t) * rand(i, 3) + Math.sin(t * 2 + i) * 2, y = -60 + Math.sin(a) * r * 0.6 + Math.cos(t * 1.5 + i) * 2;
          if (y > -1) continue;
          if ((i + Math.floor(t * 20)) % 7 === 0) p.px(x, y, WHITE, k); else p.px(x, y, MIST, 0.4 * k);
        }
      }
      if (t > SEAL && t < KATSU + 0.4) p.text("KATSU!", b.head[0], b.head[1] - 16, POP[0], { font: "big", align: "center", outline: hex("#1a1010"), a: 1 - smooth(KATSU + 0.2, KATSU + 0.4, t) });
      // the disintegration: bright pops all through the target as it crumbles from inside
      if (t > KATSU && t < DUST) for (let i = 0; i < 14; i++) { const ph = ((t - KATSU) * 4 + rand(i, 5)) % 1, x = TX - 8 + rand(i, 6) * 16, y = -6 - rand(i, 7) * 40; p.px(x, y, POP[ph < 0.5 ? 1 : 0], 1 - ph); if (ph < 0.3) p.ring(x, y, 1 + ph * 6, 1, POP[0], 1 - ph * 3); }
      void drawFigure; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

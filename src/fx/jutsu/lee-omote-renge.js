// Omote Renge (Front Lotus, Rock Lee). Narutopedia: a forbidden taijutsu that needs the first of the Eight Gates
// opened; an upward kick sends the opponent high, the user follows (Shadow of the Dancing Leaf), binds them with the
// bandages from their arms so they can't get away, and spins them head first into the ground, letting go just before.
// Here: the first gate opened (a green light round him), the bandages unwinding from his arms, a rising kick, a leap
// above the target, the bandages whipping round it, a spinning dive and a slam into the floor at its feet.
// New: the bandages (loose strips trailing from his arm, then a spiral binding the target), the spin dive (yaw on the
// rig), the impact crater and name. From _lib: the gates aura. From the library: the heavy landing.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import * as landing from "../impacts/heavy-landing.js";
import { play, bodyAt, drawGates } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const GATE = 0.1, UNWRAP = 0.6, DASH = UNWRAP + 0.3, KICK = DASH + 0.18, LEAP = KICK + 0.12, ABOVE = LEAP + 0.3, BIND = ABOVE + 0.05, DIVE = BIND + 0.45, SLAM = DIVE + 0.2, END = SLAM + 1.4, TX = 140;
const BAND = hex("#f0ece0"), BANDD = hex("#b8b0a0"), INK = hex("#120c18");

export const meta = {
  name: "Front lotus",
  desc: "Rock Lee: the first gate opened, bandages unwinding from his arms, a rising kick, a leap above the target, the bandages whipping round it, and a spinning dive that slams into the floor at its feet.",
  tags: ["jutsu", "lee", "taijutsu", "gates", "melee", "one-shot"],
  size: [250, 190],
  origin: [50, 156],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#123818", "#2f7a2a", "#6cb83a", "#c8f070"], seed: 53 },
};

const STANCE = { ...READY, crouch: 6, lean: 4, fx: 15, fy: -24, bx: -8, by: -20, ffx: 12, fbx: -10 };
const UPK = { ...READY, x: TX - 22, crouch: 0, lean: -12, fx: -6, fy: -26, bx: 6, by: -30, ffx: 14, ffy: -34, fbx: -4 };
const AIR = { ...READY, x: TX - 12, y: -66, crouch: 6, lean: 6, fx: 12, fy: -18, bx: 10, by: -14, ffx: 6, ffy: -6, fbx: -6, fby: -4 };
const spin = Array.from({ length: 6 }, (_, i) => [BIND + 0.05 + (i + 1) * ((DIVE - BIND - 0.05) / 6), { ...AIR, y: -66 + (i + 1) * 3, yaw: (i + 1) * Math.PI * 0.8, crouch: 10 }, "line"]);
export const act = {
  target: { x: TX },
  ghost: "#6cb83a",
  poses: [
    [-0.25, READY],
    [GATE + 0.3, STANCE, "out"],
    [DASH, { ...STANCE, crouch: 8 }],
    [KICK - 0.04, { ...STANCE, x: TX - 30, crouch: 10, lean: 14, ghost: true }, "in"],
    [KICK, UPK, "snap"],
    [ABOVE, AIR, "out"],
    [BIND, AIR],
    ...spin,
    [SLAM, { ...AIR, y: -40, yaw: Math.PI * 5, crouch: 12, lean: 18, fx: 16, fy: -10, bx: 14, by: -8 }, "in"],
    [SLAM + 0.16, { ...STANCE, x: TX - 34, crouch: 12, lean: 6 }, "out"],
    [END - 0.4, { ...STANCE, x: TX - 34 }],
    [END, { ...STANCE, x: TX - 34 }],
  ],
  hits: [
    { t: KICK, stop: 0.1, shake: 0.2, amp: 2, push: 2, straw: 18 },
    { t: BIND + 0.2, stop: 0.03, flash: 0, push: 0, straw: 4, shiver: 1 },
    { t: SLAM, stop: 0.22, shake: 0.6, amp: 5, push: 5, straw: 40 },
  ],
  dust: [{ t: KICK - 0.04, x: TX - 30, n: 6, dir: -1 }, { t: LEAP, x: TX - 22, n: 6 }],
};

export const create = play([{ fx: landing, t: SLAM, x: TX - 2 }], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  return {
    update(t, dt) {
      ps.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      drawGates(p, t, b.q, 1, smooth(GATE, GATE + 0.25, t) * (1 - smooth(END - 0.6, END, t)), "back");
      if (t > SLAM) {
        const k = 1 - smooth(SLAM + 0.4, END, t);
        p.ellipse(TX - 2, 0.5, 30, 3, INK, 0.8 * k);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "gate", t0: GATE, t1: UNWRAP, label: "1ST GATE", head: b.head });
      // the bandages: unwinding off his forearm as loose strips that wave behind him
      if (t > UNWRAP && t < BIND + 0.1) {
        const k = smooth(UNWRAP, UNWRAP + 0.2, t), [hx, hy] = b.handN;
        for (let s = 0; s < 2; s++) {
          let x = hx, y = hy;
          for (let i = 1; i < 10 * k; i++) {
            const nx = x - 2.4, ny = y + Math.sin(i * 0.9 + t * 18 + s * 2) * 1.6 + s * 0.8;
            p.line(x, y, nx, ny, i % 3 ? BAND : BANDD);
            (x = nx), (y = ny);
          }
        }
      }
      // the binding: strips whipping round the target in a tightening spiral, held until the slam
      if (t > BIND && t < SLAM + 0.3) {
        const u = ease.outCubic(clamp((t - BIND) / 0.25)), k = 1 - smooth(SLAM, SLAM + 0.3, t);
        for (let i = 0; i < 7; i++) {
          const y = -46 + i * 6, ph = t * 10 + i;
          p.arc(TX, y, 13 - Math.abs(i - 3) * 0.8, 2, ph, ph + 4.2 * u, i % 2 ? BAND : BANDD, k);
        }
      }
      // the name, as he slams it down
      const a = t - SLAM;
      if (a > -0.05 && a < 0.9) p.text("OMOTE RENGE!", TX - 10, -100, a < 0.05 ? WHITE : hex("#6cb83a"), { font: "big", align: "center", outline: INK });
      if (a > 0 && a < 0.4) {
        const u = a / 0.4;
        p.ellipse(TX - 2, 0, 10 + 44 * ease.outCubic(u), 3, hex("#a08c7a"), 1 - u);
      }
      ps.draw(p, "front");
    },
  };
});

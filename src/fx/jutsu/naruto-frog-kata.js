// Kawazu Kumite (Frog Kata, Naruto in Sage Mode). Narutopedia: a taijutsu only the sages of Mount Myouboku can use;
// natural energy surrounds the user as an aura, so a blow lands even when the fist itself misses: the energy around it
// strikes, and an opponent who dodges by a hair is still hit. Here: he stills himself into Sage Mode (orange round the
// eyes), sinks into the low toad stance with the natural energy crawling round his outline, and throws three blows that
// all stop short: a punch, a spinning kick, a double palm, each carried on by a great fist of energy that lands.
// New: the energy outline (_lib drawOutline), the fist, crescent and palm of natural energy that fly on from each blow.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, mix, WHITE, TAU } from "../../core/index.js";
import * as blunt from "../impacts/blunt-hit.js";
import { play, bodyAt, drawOutline } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const STILL = 0.05, SAGE = 0.7, HOP = SAGE + 0.2, B1 = HOP + 0.32, B2 = B1 + 0.42, B3 = B2 + 0.48, REACH = 0.07, TX = 156, SX = 72;
const NAT = ["#3a2a10", "#a8641a", "#f09a2a", "#ffd060", "#fff3c0"];

export const meta = {
  name: "Frog kata",
  desc: "Naruto in Sage Mode: natural energy crawling round his outline in the low toad stance, three blows that all stop short of the target, each carried home by a great fist, crescent or palm of natural energy.",
  tags: ["jutsu", "naruto", "sage", "taijutsu", "move", "melee", "combo", "one-shot"],
  size: [270, 150],
  origin: [50, 120],
  duration: B3 + 1.5,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: NAT, seed: 26 },
};

const MEDITATE = { ...READY, crouch: 9, lean: 2, armsFront: true, fx: 7, fy: -18, bx: 9, by: -18, ffx: 9, fbx: -8 };
const TOAD = { ...READY, x: SX, crouch: 12, lean: 10, fx: 10, fy: -12, bx: 4, by: -14, ffx: 12, fbx: -10 };
const PUNCH = { ...TOAD, crouch: 7, lean: 14, fx: 21, fy: -25, bx: -8, by: -20 };
const KICK = { ...READY, x: SX + 4, crouch: 2, lean: -12, yaw: 0, fx: -8, fy: -28, bx: 6, by: -32, ffx: 19, ffy: -26, fbx: -5 };
const PALM = { ...TOAD, x: SX + 6, crouch: 8, lean: 12, armsFront: true, fx: 21, fy: -22, bx: 20, by: -27 };
export const act = {
  target: { x: TX },
  ghost: "#ffb040",
  poses: [
    [-0.25, READY],
    [STILL, MEDITATE, "out"],
    [SAGE, { ...MEDITATE, crouch: 8 }],
    [HOP, { ...TOAD, x: SX * 0.5, y: -12, ghost: true }, "out"],
    [HOP + 0.16, TOAD, "in"],
    [B1 - 0.05, { ...TOAD, lean: 6, fx: 4, fy: -18 }],
    [B1, PUNCH, "snap"],
    [B1 + 0.2, { ...PUNCH, crouch: 9 }],
    [B2 - 0.08, { ...KICK, yaw: -2.2, ffx: 6, ffy: -12, ghost: true }, "in"],
    [B2, KICK, "snap"],
    [B2 + 0.2, { ...KICK, ffy: -20 }],
    [B3 - 0.06, { ...TOAD, x: SX + 6, crouch: 13, fx: 6, fy: -16, bx: 4, by: -18 }],
    [B3, PALM, "snap"],
    [B3 + 0.35, { ...PALM, crouch: 9 }],
    [B3 + 0.9, { ...READY, x: SX + 6 }],
    [meta.duration, { ...READY, x: SX + 6 }],
  ],
  hits: [
    { t: B1 + REACH, stop: 0.08, shake: 0.15, amp: 2, push: 2, straw: 14 },
    { t: B2 + REACH, stop: 0.08, shake: 0.15, amp: 2, push: 2.4, straw: 14 },
    { t: B3 + REACH, stop: 0.16, shake: 0.35, amp: 3, push: 4.5, straw: 30 },
  ],
  dust: [{ t: HOP + 0.16, x: SX, n: 8 }, { t: B3, x: SX + 4, n: 8, dir: -1 }],
};

export const create = play(
  [B1, B2, B3].map((b, i) => ({ fx: blunt, t: b + REACH, x: TX - 12, height: [26, 30, 24][i], palette: NAT.concat(["#ffffff", "#ffffff"]), seed: 50 + i })),
  (o) => {
    const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), fired = [0, 0, 0];
    return {
      update(t, dt) {
        if (t > STILL && t < SAGE && R.chance(55 * dt)) {
          const a = R.range(-Math.PI, 0), d = R.range(18, 34), T = R.range(0.3, 0.5), v = (d * 2) / (Math.exp(2 * T) - 1);
          ps.spawn(P.EMBER, Math.cos(a) * d, -20 + Math.sin(a) * d, -Math.cos(a) * v, -Math.sin(a) * v, T, hex(["#7aa83a", "#d8e070", "#fff3b0"][R.int(0, 2)]));
        }
        [B1, B2, B3].forEach((b, i) => {
          if (!fired[i] && t >= b) {
            fired[i] = 1;
            lights.add(TX - 10, -26, 50, hex(NAT[3]), 0.7, 0.15);
          }
        });
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p, t) {
        ps.draw(p, "back");
        if (t > SAGE) {
          const b = bodyAt(act.poses, t), q = b.q, k = smooth(SAGE, SAGE + 0.2, t) * (1 - smooth(meta.duration - 0.8, meta.duration - 0.3, t));
          drawOutline(p, q, q.x ?? 0, q.y ?? 0, hex(NAT[2]), { w: 1, a: 0.8 * k, flick: t * 14 });
          drawOutline(p, q, q.x ?? 0, q.y ?? 0, hex(NAT[1]), { w: 2, a: 0.45 * k, flick: t * 11 + 5 });
        }
      },
      draw(p, t) {
        const b = bodyAt(act.poses, t);
        drawBadge(p, t, { kind: "sage", t0: STILL + 0.2, t1: SAGE, label: "SENNIN MODO", head: b.head });
        if (t > SAGE) {
          p.px(b.head[0] + 1, b.head[1] - 1.5, hex("#e2662b"));
          p.px(b.head[0] + 3, b.head[1] - 1.5, hex("#e2662b"));
        }
        drawGlint(p, t, "sage", SAGE + 0.05, meta.duration - 0.5, b.head);
        // the blows of natural energy: each leaves the fist where it stopped and lands a body further on
        [B1, B2, B3].forEach((t0, i) => {
          const a = t - t0;
          if (a < 0 || a > REACH + 0.3) return;
          const from = i === 1 ? [SX + 24, -27] : [SX + (i ? 28 : 26), -25], to = [TX - 10, i === 1 ? -30 : -25];
          const u = ease.outCubic(clamp(a / REACH)), x = from[0] + (to[0] - from[0]) * u, y = from[1] + (to[1] - from[1]) * u, fade = 1 - smooth(REACH, REACH + 0.3, a);
          p.glowLine(from[0], from[1], x, y, 10, C[3], 0.5 * fade);
          p.beam(from[0], from[1], x, y, i === 2 ? 7 : 4, C[2], 0.6 * fade);
          if (i === 0) {
            // a fist of energy, knuckles forward
            p.circle(x, y, 5, C[3], fade);
            for (let k = -1; k <= 1; k++) p.circle(x + 3, y + k * 2.5, 1.6, C[4], fade);
          } else if (i === 1) {
            // the kick's crescent
            p.arc(x - 4, y, 9, 2, -1.1, 1.1, C[3], fade);
            p.arc(x - 3, y, 7, 1, -0.9, 0.9, C[4], fade);
          } else {
            // the double palm: two flat hands of energy and a burst ring
            p.ellipse(x, y - 4, 4, 6, C[3], fade);
            p.ellipse(x, y + 4, 4, 6, C[3], fade);
            p.ring(x, y, 8 + 22 * clamp((a - REACH) / 0.3), 1, C[4], fade);
          }
          p.glow(x, y, 20, C[3], 0.6 * fade);
        });
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);

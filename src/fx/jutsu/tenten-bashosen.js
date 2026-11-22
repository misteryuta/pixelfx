// Bashousen: Kaen (Banana Fan: Flame, Tenten with the Sage of Six Paths' treasure). Narutopedia: in the war Tenten
// wields the Bashousen, one of the Sage of the Six Paths' treasured tools: a great fan with a bulb at its tip and a
// paddle-shaped blade; it can produce any of the five natures, and Tenten used it to blast great gusts of fire. Here:
// she pulls a scroll, unrolls it in the air, and the fan appears in a puff in her hands (twice her height: the long
// shaft, the bulb, the leaf-shaped blade); she braces, swings it in a huge arc and a wave of fire rolls out of the
// blade, a wall of flame sweeping across the floor into the target; she plants the fan, panting.
// New: the scroll, the Bashousen, the fan-swept fire wall (curling flame front, embers).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SCROLL = 0.3, FAN = 0.7, WIND = 1.1, SWING = 1.35, HIT = 1.75, PLANT = 2.3, END = 3.6, TX = 170;
const FIRE = ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"].map(hex), WOODC = hex("#6a4a2a"), LEAF = hex("#c8b878"), BULB = hex("#8a5a3a");

export const meta = {
  name: "Banana fan: flame",
  desc: "Tenten: a scroll unrolls and the Sage of Six Paths' Bashousen appears in her hands; she swings the giant fan in a huge arc and a wall of fire rolls out of its blade across the floor into the target.",
  tags: ["jutsu", "tenten", "six-paths-tool", "fire", "aoe", "one-shot"],
  size: [260, 190],
  origin: [56, 160],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a0806", "#d8461c", "#ffd060", "#c8b878"], seed: 182 },
};

const HOLD = { ...READY, crouch: 4, armsFront: true, fx: 8, fy: -30, bx: 10, by: -26, ffx: 9, fbx: -9 };
const UP = { ...READY, crouch: 6, lean: -12, fx: -6, fy: -40, bx: -2, by: -38, ffx: 12, fbx: -11, armsFront: true };
const SWEEP = { ...READY, crouch: 10, lean: 16, fx: 24, fy: -18, bx: 22, by: -16, ffx: 15, fbx: -12, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SCROLL, { ...READY, crouch: 3, fx: 14, fy: -30, bx: 4, by: -24 }, "out"],
    [FAN, HOLD, "out"],
    [WIND, UP, "out"],
    [SWING, SWEEP, "in"],
    [PLANT, { ...SWEEP, crouch: 8, lean: 6 }, "out"],
    [END, HOLD],
  ],
  hits: [
    { t: FAN, target: false, sfx: "cast" },
    { t: SWING, stop: 0.05, shake: 0.5, amp: 2, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.18, shake: 0.7, amp: 4, push: 8, straw: 40, skin: "char", sfx: "explosion" },
    { t: HIT + 0.9, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the fan's angle: held up, wound back over her head, swept down and across
  const fanA = (t) => (t < WIND ? -1.3 : t < SWING ? -1.3 - 1.2 * ease.outQuad(smooth(WIND, SWING - 0.05, t)) : -2.5 + 2.6 * ease.outCubic(smooth(SWING, SWING + 0.25, t)));
  const front = (t) => 30 + (TX + 30 - 30) * ease.outCubic(clamp((t - SWING) / (HIT + 0.2 - SWING)));
  return {
    update(t, dt) {
      if (t > SWING && t < HIT + 0.6 && R.chance(60 * dt)) ps.spawn(P.SPARK, front(t) - R.range(0, 40), -R.range(4, 50), R.range(20, 80), -R.range(20, 80), R.range(0.3, 0.6), FIRE[R.int(3, 5)]);
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -20, 140, FIRE[4], 0.7, 0.4); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.handN;
      drawBadge(p, t, { kind: "scroll", t0: 0.04, t1: SCROLL, label: "BASHOUSEN", head: b.head });
      // the scroll unrolling in the air before her
      if (t > SCROLL - 0.1 && t < FAN + 0.1) { const u = smooth(SCROLL - 0.1, FAN - 0.1, t), k = 1 - smooth(FAN, FAN + 0.1, t); p.rect(hx, hy - 8, 30 * u, 7, hex("#f0e8d0"), k); p.rect(hx - 2, hy - 9, 3, 9, hex("#8a2a1a"), k); for (let i = 0; i < 4; i++) p.px(hx + 4 + i * 6 * u, hy - 5, hex("#1a1010"), k); }
      drawPoof(p, hx + 10, hy - 10, t - FAN + 0.05, 1.2, 5);
      // the Bashousen: a long shaft through her hands, the bulb at the top, the paddle blade
      if (t > FAN) {
        const a = fanA(t), c = Math.cos(a), s = Math.sin(a), at = (u, v) => [hx + c * u - s * v, hy + s * u + c * v];
        p.beam(...at(-14, 0), ...at(40, 0), 2.6, WOODC);
        p.circle(...at(-16, 0), 3.5, BULB);
        p.poly([at(36, 0), at(48, -9), at(66, -8), at(76, 0), at(66, 8), at(48, 9)], LEAF);
        p.line(...at(38, 0), ...at(74, 0), WOODC);
        for (let i = 0; i < 4; i++) p.line(...at(46 + i * 7, 0), ...at(50 + i * 7, -6), WOODC);
        if (t > SWING && t < SWING + 0.3) p.glow(...at(60, 0), 20, FIRE[4], 0.6 * (1 - (t - SWING) / 0.3));
      }
      // the fire wall: rolling out across the floor from the swing, a curling front, darker smoke above
      if (t > SWING && t < END - 0.3) {
        const fx = front(t), k = 1 - smooth(HIT + 0.6, END - 0.3, t);
        p.shade(20, -64, fx + 16, 1, (x, y, out) => {
          const v = (x - 20) / Math.max(1, fx - 20), h = (16 + 36 * Math.min(1, v * 1.4)) * (v > 1 ? Math.max(0, 1 - (x - fx) / 14) : 1), n = noise2(x * 0.09 - t * 6, y * 0.1 + t * 4, 111);
          if (-y > h + 8 * n || v < 0.05) return;
          out.a = k;
          const heat = 1 - -y / Math.max(1, h);
          return heat > 0.75 ? FIRE[5] : heat > 0.5 ? FIRE[4] : heat > 0.25 ? FIRE[3] : n > 0 ? FIRE[2] : FIRE[1];
        });
      }
      void rand; void TAU; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

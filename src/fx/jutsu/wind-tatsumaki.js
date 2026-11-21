// Fuuton: Tatsumaki (Wind Release: Tornado). The wind jutsu of the Sand's fan users and Konoha's wind specialists:
// a spinning column of air raised on the target. Here: Snake, Ram, Dog, Dragon; he sweeps his arm round in a circle and
// the air under the target starts to turn, dust and leaves spiralling up off the floor; it tightens into a tornado
// that lifts the target off its post, spinning it higher and higher inside the funnel, blades of wind slicing at it;
// the wind cuts out all at once and the target drops back down hard; the dust settles in rings.
// New: the funnel (stacked spinning bands, narrow at the foot), the lift and spin (targetState), the wind blades.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt } from "./_lib.js";

const SEALS = sealRun(0.05, ["mi", "hitsuji", "inu", "tatsu"], 0.1, { hold: 0.12, kind: "wind" });
const SWEEP = SEALS.end + 0.1, STIR = SWEEP + 0.25, FUNNEL = STIR + 0.4, LIFT = FUNNEL + 0.1, TOP = LIFT + 1.1, CUT = TOP + 0.05, DROP = CUT + 0.3, END = DROP + 1.2, TX = 170;
const WI = ["#2a3a36", "#5a7a72", "#9ac8b8", "#d8f4ea", "#ffffff"].map(hex), DUST = ["#4a3e34", "#6e5e4e", "#9a8670"].map(hex), LEAF = ["#2f7a2a", "#6cb83a", "#a8701c"].map(hex);

export const meta = {
  name: "Wind release: tornado",
  desc: "Snake, Ram, Dog, Dragon and one sweep of the arm: the air under the target turns, dust and leaves spiral up, and a tornado lifts the target off its post, spinning it high while blades of wind slice it, then drops it hard.",
  tags: ["jutsu", "wind", "fuuton", "tornado", "lift", "aoe", "one-shot"],
  size: [300, 230],
  origin: [56, 198],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a3a36", "#5a7a72", "#9ac8b8", "#d8f4ea", "#ffffff"], seed: 105 },
};

const SWEEPP = { ...READY, crouch: 6, lean: 4, fx: 20, fy: -30, bx: -8, by: -22, ffx: 10, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SWEEP - 0.1, { ...SWEEPP, fx: -6, fy: -36 }, "out"],
    [SWEEP, SWEEPP, "snap"],
    [STIR, { ...SWEEPP, fx: 22, fy: -20 }, "out"],
    [CUT, { ...SWEEPP, fx: 18, fy: -34 }],
    [CUT + 0.05, { ...SWEEPP, fx: 20, fy: -16, lean: 8 }, "snap"],
    [END, READY],
  ],
  hits: [
    { t: SWEEP, target: false, sfx: "whoosh" },
    { t: FUNNEL, shake: 1.4, amp: 1, target: false, sfx: "rumble" },
    ...[0.3, 0.5, 0.7, 0.9].map((d) => ({ t: LIFT + d, stop: 0.02, push: 0, straw: 6, flash: 0.02, sfx: "punch" })),
    { t: DROP, stop: 0.16, shake: 0.6, amp: 4, push: 3, straw: 30, skin: "red", sfx: "land" },
    { t: DROP + 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: DROP, x: TX - 20, n: 16, dir: -1 }, { t: DROP, x: TX + 20, n: 16, dir: 1 }],
};
// the target: lifted, spun round and round inside the funnel, then dropped
export const targetState = (t) => {
  if (t < LIFT) return null;
  if (t < CUT) { const u = smooth(LIFT, TOP, t); return { dy: -90 * u, dx: Math.sin(t * 9) * 6 * u, rot: (t - LIFT) * 10 * u }; }
  const u = clamp((t - CUT) / (DROP - CUT)), back = t > DROP ? 0 : 1;
  return { dy: -90 * (1 - u * u) * back, rot: ((CUT - LIFT) * 10) * (1 - u) * back, s: t > DROP ? 1 - 0.15 * Math.exp(-(t - DROP) * 6) : 1 };
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const motes = Array.from({ length: 40 }, (_, i) => ({ h: rand(i, 1), a: rand(i, 2) * TAU, c: i % 4 === 0 ? LEAF[i % 3] : DUST[i % 3], leaf: i % 4 === 0 }));
  const strength = (t) => smooth(STIR, FUNNEL + 0.2, t) * (1 - smooth(CUT, CUT + 0.1, t));
  return {
    update(t, dt) {
      if (t >= DROP && !this.d) { this.d = 1; lights.add(TX, -10, 100, WI[3], 0.5, 0.2); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const k = strength(t);
      if (k > 0) {
        // the funnel's back half: bands turning, narrow at the foot and wide at the top
        for (let i = 0; i < 14; i++) {
          const y = -i * 12 * k, w = 6 + i * 3.4, a0 = t * (14 - i * 0.3) + i;
          p.arc(TX + Math.sin(t * 3 + i * 0.4) * 3, y, w, 1.5, a0 + Math.PI, a0 + Math.PI + 2.2, WI[1], 0.6 * k);
        }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, WI);
      const b = bodyAt(act.poses, t), k = strength(t), f = Math.floor(t * 20);
      // his arm's sweep: a ring of wind off his hand
      if (t > SWEEP - 0.1 && t < SWEEP + 0.2) { const u = (t - SWEEP + 0.1) / 0.3; p.arc(b.chest[0], b.chest[1], 18 + u * 10, 1, -2 + u * 4, -1 + u * 4, WI[3], 1 - u); }
      // the stir at the target's feet before the funnel: dust rings
      if (t > STIR && t < FUNNEL + 0.3) { const u = smooth(STIR, FUNNEL, t); for (let i = 0; i < 3; i++) p.ellipse(TX, -1, 10 + i * 8 * u, 1.5, WI[2], 0.5 * (1 - smooth(FUNNEL, FUNNEL + 0.3, t))); }
      if (k > 0) {
        // the front half of the bands, the bright edges, the dust and leaves spiralling up
        for (let i = 0; i < 14; i++) {
          const y = -i * 12 * k, w = 6 + i * 3.4, a0 = t * (14 - i * 0.3) + i;
          p.arc(TX + Math.sin(t * 3 + i * 0.4) * 3, y, w, i % 3 ? 1.5 : 2, a0, a0 + 2.4, i % 2 ? WI[2] : WI[3], 0.8 * k);
        }
        for (const m of motes) {
          const h = (m.h + t * 0.6) % 1, a = m.a + t * (8 - h * 3), w = 6 + h * 14 * 3.4, x = TX + Math.cos(a) * w, y = -h * 160 * k;
          if (Math.sin(a) < -0.2) continue;
          if (m.leaf) p.rect(x, y, 2, 1, m.c, k); else p.px(x, y, m.c, k);
        }
        // the blades of wind slicing at the lifted target
        if (t > LIFT + 0.2 && t < CUT) for (let i = 0; i < 2; i++) { const ty = -26 - 90 * smooth(LIFT, TOP, t), a = rand(f, i) * TAU; p.line(TX + Math.cos(a) * 18, ty + Math.sin(a) * 18, TX - Math.cos(a) * 18, ty - Math.sin(a) * 18, WHITE, 0.8); }
      }
      // the drop: dust rings settling outward
      if (t > DROP && t < DROP + 0.8) for (let i = 0; i < 3; i++) { const u = clamp((t - DROP - i * 0.1) / 0.6); p.ellipse(TX, -1, 10 + 60 * u, 2, DUST[2], 0.6 * (1 - u)); }
      void ease; void noise2;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

// Ranshinshou (Body Pathway Derangement, Tsunade). Narutopedia: a medical ninjutsu: Tsunade's hand, charged with
// lightning-natured chakra, touches the target and scrambles the electrical signals of its nervous system, so that
// its limbs no longer obey: it tries to move its right arm and the left leg moves instead. Here: Tsunade's hand
// crackles with a soft blue-white glow (medical chakra and lightning); she slips in and taps the target's temple with
// two fingers; blue impulses race through its outline in the wrong directions, its limbs jerk at random, it staggers,
// tries to raise an arm and its leg kicks out instead, and topples over; she flicks her hair.
// New: the medical-lightning hand, the scrambled impulses running through the target, the haywire target motion.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const CHARGE = 0.3, STEP = 0.8, TAP = 1.05, SCRAMBLE = 1.15, TOPPLE = 2.6, END = 3.6, TX = 140;
const MED = ["#0a3a2a", "#2a9a6a", "#8af0c0", "#e8fff4"].map(hex), LT = ["#061430", "#1a5aa0", "#5ab8ff", "#c8f0ff", "#ffffff"].map(hex);

export const meta = {
  name: "Body pathway derangement",
  desc: "Tsunade: her hand crackles with medical lightning chakra; she slips in and taps the target's temple, blue impulses race through it the wrong way, its limbs jerk at random, an arm it tries to raise becomes a kick, and it topples over.",
  tags: ["jutsu", "tsunade", "medical", "lightning", "debuff", "melee", "one-shot"],
  size: [220, 170],
  origin: [56, 140],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a3a2a", "#2a9a6a", "#8af0c0", "#e8fff4"], seed: 191 },
};

const READYM = { ...READY, crouch: 4, fx: 14, fy: -26, bx: -4, by: -20, ffx: 9, fbx: -9 };
const TAPP = { ...READY, crouch: 5, lean: 8, fx: 24, fy: -36, bx: -6, by: -20, ffx: 12, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CHARGE, READYM, "out"],
    [TAP - 0.05, { ...READYM, x: TX - 30, crouch: 7, lean: 10 }, "out"],
    [TAP, { ...TAPP, x: TX - 26 }, "snap"],
    [TAP + 0.4, { ...READYM, x: TX - 40 }, "out"],
    [END, { ...READY, x: TX - 40, gait: false }],
  ],
  hits: [
    { t: CHARGE, target: false, sfx: "thunder" },
    { t: TAP, stop: 0.12, shake: 0.2, amp: 1, push: 0, straw: 8, flash: 0.03, sfx: "parry" },
    ...[0.2, 0.5, 0.75, 1.0, 1.2].map((d) => ({ t: SCRAMBLE + d, stop: 0.03, flash: 0, push: 0, straw: 4, skin: "shock", shiver: 0.8 })),
    { t: TOPPLE, stop: 0.1, shake: 0.4, amp: 3, push: 0, straw: 16, sfx: "land" },
    { t: TOPPLE + 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// haywire: jerks in random directions, then falls over backwards
export const targetState = (t) => {
  if (t < SCRAMBLE) return null;
  if (t < TOPPLE) { const k = Math.floor(t * 8); return { rot: (rand(k, 1) - 0.5) * 0.5, dy: -Math.abs(rand(k, 2) - 0.5) * 6 }; }
  const up = 1 - ease.inOutQuad(smooth(END - 0.6, END - 0.1, t));
  return { rot: -1.4 * ease.outQuad(smooth(TOPPLE, TOPPLE + 0.3, t)) * up, dy: 2 * smooth(TOPPLE, TOPPLE + 0.3, t) * up };
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  return {
    update(t, dt) {
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 30), [hx, hy] = b.handN;
      drawBadge(p, t, { kind: "byakugou", t0: 0.04, t1: CHARGE, label: "RANSHINSHOU", head: b.head });
      // the charged hand: a soft green-white glow with blue sparks
      if (t > CHARGE && t < TAP + 0.3) { const k = smooth(CHARGE, CHARGE + 0.2, t) * (1 - smooth(TAP, TAP + 0.3, t)); p.glow(hx, hy, 10, MED[2], 0.6 * k); p.circle(hx, hy, 2.5, MED[3], k); if (f % 2) bolt(p, hx - 3, hy - 2, hx + 4, hy + 2, f, LT, { jag: 0.5, seed: f, glow: 0 }); }
      // the impulses: little blue sparks racing along the target in the wrong directions
      if (t > SCRAMBLE && t < TOPPLE + 0.4) for (let i = 0; i < 5; i++) { const ph = (t * 3 + i * 0.2) % 1, a = rand(i, Math.floor(t * 3)) * TAU, r = 18 * ph; p.px(TX + Math.cos(a) * r * 0.5, -26 + Math.sin(a) * r, LT[3], 1 - ph); p.px(TX + Math.cos(a) * r * 0.5 + 1, -26 + Math.sin(a) * r, LT[2], 0.6 * (1 - ph)); }
      if (t > TAP && t < TAP + 0.15) p.ring(TX + 2, -36, 3 + 10 * (t - TAP) / 0.15, 1, MED[3], 1 - (t - TAP) / 0.15);
      // the confusion: question marks over the target
      if (t > SCRAMBLE + 0.4 && t < TOPPLE) p.text("?!", TX + 2, -52, MED[3], { font: "mini", align: "center", outline: MED[0] });
      void noise2; void WHITE; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

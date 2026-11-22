// Kuchiyose: Enma: Kongou Nyoi (Summoning: Enma: Adamantine Staff, Hiruzen Sarutobi). Narutopedia: the Third Hokage's
// summon is Enma, the Monkey King, who can transform himself into the Adamantine Staff, an unbreakable black staff that
// stretches to any length at Hiruzen's will; Hiruzen fought Orochimaru with it, the staff growing and lashing out.
// Here: a bitten thumb, a palm slapped down; Enma (a large grey-white monkey in a leopard-print collar and armour,
// a headband) appears in smoke, crouched, then says "Henge!" and turns into the staff in a puff; Hiruzen spins the
// black staff over his head, braces and thrusts: it shoots out to many times its length, a black line stabbing across
// the field into the target, then sweeps it aside and snaps back short.
// New: Enma, the staff (gold bands at its ends), its extension and sweep.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const BITE = 0.3, SLAP = 0.5, ENMA = 0.65, HENGE = 1.35, STAFF = 1.5, SPIN = 1.6, THRUST = 2.4, HIT = 2.55, SWEEP = 2.85, BACK = 3.2, END = 3.9, TX = 200;
const STF = ["#06060a", "#1a1a22", "#3a3a48"].map(hex), GOLD = hex("#e0a428"), FUR = ["#5a5a64", "#9a9aa4", "#d8d8e0"].map(hex), LEO = hex("#d8a040");

export const meta = {
  name: "Summoning: Enma, adamantine staff",
  desc: "Hiruzen: Enma the Monkey King appears in smoke and turns himself into the Adamantine Staff; Hiruzen spins it overhead and thrusts, the staff shooting out across the field into the target, then sweeps it aside and snaps back.",
  tags: ["jutsu", "hiruzen", "sarutobi", "summon", "enma", "staff", "melee", "one-shot"],
  size: [290, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#06060a", "#3a3a48", "#e0a428", "#d8d8e0"], seed: 185 },
};

const SLAPP = { ...READY, crouch: 13, lean: 14, fx: 15, fy: -2, bx: 6, by: -14, ffx: 10, fbx: -10 };
const SPINP = { ...READY, crouch: 6, lean: -4, fx: 2, fy: -44, bx: 8, by: -40, ffx: 10, fbx: -10, armsFront: true };
const THR = { ...READY, crouch: 10, lean: 14, fx: 24, fy: -24, bx: 16, by: -24, ffx: 15, fbx: -12, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [BITE, { ...READY, crouch: 2, fx: 6, fy: -32 }, "out"],
    [SLAP, SLAPP, "in"],
    [STAFF, { ...READY, crouch: 5, fx: 12, fy: -26, bx: 10, by: -26 }, "out"],
    [SPIN + 0.1, SPINP, "out"],
    [THRUST - 0.05, { ...SPINP, fx: 0, fy: -30, bx: 4, by: -30, lean: -8 }],
    [THRUST, THR, "snap"],
    [SWEEP, { ...THR, lean: 8, fx: 20, fy: -34, bx: 14, by: -32 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: SLAP, stop: 0.05, shake: 0.3, amp: 2, target: false, sfx: "step" },
    { t: ENMA, target: false, sfx: "cast" },
    { t: HENGE, target: false, sfx: "cast" },
    { t: THRUST, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.16, shake: 0.6, amp: 4, push: 4, straw: 30, sfx: "heavy" },
    { t: SWEEP, stop: 0.1, shake: 0.4, amp: 3, push: 10, straw: 20, sfx: "punch" },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the staff: its angle and length over time (spinning overhead, then a straight thrust, extending, sweeping up, back)
  const staff = (t, b) => {
    if (t < SPIN) return { a: -1.4, L: 30 };
    if (t < THRUST) return { a: (t - SPIN) * 18, L: 30 };
    const ext = ease.outExpo(clamp((t - THRUST) / (HIT - THRUST))) * (1 - ease.inCubic(clamp((t - SWEEP) / (BACK - SWEEP)))), a = -0.12 - 0.5 * smooth(HIT + 0.1, SWEEP, t);
    return { a, L: 30 + (TX + 8 - b.handN[0] - 30) * ext };
  };
  return {
    update(t, dt) {
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "summon", t0: 0.04, t1: BITE, label: "ENMA", head: b.head });
      if (t > BITE && t < SLAP) p.px(b.handN[0], b.handN[1], hex("#e01828"));
      drawPoof(p, 34, -16, t - ENMA + 0.05, 1.8, 3);
      // Enma: crouched, grey-white fur, the leopard collar, the headband; speaking, then the puff of the transformation
      if (t > ENMA && t < HENGE + 0.05) {
        const x = 34;
        p.ellipse(x, -10, 9, 9, FUR[1]); p.ellipse(x + 2, -22, 7, 6, FUR[2]); p.ellipse(x + 6, -21, 3, 3, hex("#e8c8b0"));
        p.rect(x - 6, -16, 13, 3, LEO); for (let i = 0; i < 4; i++) p.px(x - 5 + i * 3, -15, STF[0]);
        p.rect(x - 4, -27, 12, 2, hex("#3a3a8a"));
        p.line(x - 7, -6, x - 12, 0, FUR[0]); p.line(x + 6, -6, x + 10, 0, FUR[0]);
        if (t > HENGE - 0.35) p.text("HENGE!", x, -40, WHITE, { font: "mini", align: "center", outline: STF[0] });
      }
      drawPoof(p, 34, -16, t - HENGE, 1.4, 6);
      // the Adamantine Staff: black, gold bands at both ends; spinning, thrust, stretching across the field
      if (t > STAFF) {
        const [hx, hy] = b.handN, { a, L } = staff(t, b), back = 14, c = Math.cos(a), s = Math.sin(a);
        const x0 = hx - c * back, y0 = hy - s * back, x1 = hx + c * L, y1 = hy + s * L;
        p.beam(x0, y0, x1, y1, 3.4, STF[0]); p.line(x0, y0 - 1, x1, y1 - 1, STF[2]);
        for (const [x, y] of [[x0, y0], [x1, y1]]) p.circle(x, y, 2.6, GOLD);
        if (t > SPIN && t < THRUST) for (let i = 0; i < 3; i++) p.arc(hx, hy, L, 1, a - 0.5 - i * 0.4, a - 0.2 - i * 0.4, STF[2], 0.5 - i * 0.15);
        if (t > HIT && t < HIT + 0.2) p.ring(TX, -26, 4 + 30 * (t - HIT) / 0.2, 1, WHITE, 1 - (t - HIT) / 0.2);
      }
      void rand; void noise2; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

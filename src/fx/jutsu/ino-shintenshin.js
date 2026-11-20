// Shintenshin no Jutsu (Mind Body Switch, Ino). Narutopedia: the Yamanaka clan's signature; with its own hand seal the
// user turns their mind into spiritual energy and sends it at the target; it travels slowly in a straight line, and the
// user's body falls limp while they're gone; if it misses, it takes minutes to find its way back. Here: the Yamanaka
// seal framing the target between her fingers, a faint line of aim, then her spirit, a pale outline of her, leaves her
// body, which slumps, and drifts across to the target; it sinks in, the target's eyes light up, and it shudders, taken.
// New: the spirit (her figure in light, drifting, trailing), the aim, the target taken over (eyes lit, a glow).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["hiden"], 0.12, { hold: 0.55 }), AIM = SEALS.end - 0.35, LEAVE = SEALS.end, DRIFT = 0.9, IN = LEAVE + DRIFT, TAKEN = IN + 0.25, END = TAKEN + 1.6, TX = 140;
const SP = ["#5a2a6a", "#a85ab8", "#e88cc8", "#ffd0f0", "#ffffff"].map(hex);

export const meta = {
  name: "Mind body switch",
  desc: "Ino: the Yamanaka seal framing the target, her spirit leaving her slumping body as a pale outline that drifts across, sinks into the target, lights its eyes and takes it over.",
  tags: ["jutsu", "ino", "yamanaka", "control", "possession", "one-shot"],
  size: [240, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#5a2a6a", "#a85ab8", "#e88cc8", "#ffd0f0", "#ffffff"], seed: 60 },
};

const SLUMP = { ...READY, crouch: 14, lean: 22, fx: 10, fy: -4, bx: 4, by: -6, ffx: 6, fbx: -8 };
const SPIRIT = { ...READY, crouch: 0, lean: 6, fx: 14, fy: -26, bx: -6, by: -24, ffx: 2, ffy: -4, fbx: -6, fby: -2 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [LEAVE + 0.2, SLUMP, "in"],
    [END, SLUMP],
  ],
  hits: [
    { t: IN, stop: 0.12, shake: 0.15, amp: 1, push: 0.5, straw: 6, flash: 0, skin: "holy", shiver: 0.6 },
    { t: TAKEN + 0.6, stop: 0.03, flash: 0, push: -0.6, straw: 0, shiver: 0.4 },
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const spiritX = (t) => 2 + (TX - 12 - 2) * clamp((t - LEAVE) / DRIFT);
  return {
    update(t, dt) {
      if (t > LEAVE && t < IN && R.chance(30 * dt)) ps.spawn(P.EMBER, spiritX(t) + R.range(-6, 2), -R.range(6, 36), -R.range(10, 30), -R.range(5, 20), R.range(0.3, 0.6), SP[R.int(2, 3)]);
      ps.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, SP);
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "yamanaka", t0: 0.05, t1: SEALS.end, label: "SHINTENSHIN", head: b.head });
      // the aim: a faint line through the frame of her fingers to the target's head
      if (t > AIM && t < LEAVE + 0.1) {
        const k = smooth(AIM, AIM + 0.15, t) * (1 - smooth(LEAVE, LEAVE + 0.1, t));
        for (let x = b.handN[0] + 4; x < TX - 6; x += 4) p.px(x, b.handN[1] + ((x - b.handN[0]) / (TX - b.handN[0])) * (-44 - b.handN[1]), SP[2]);
        p.ring(TX, -44, 5, 1, SP[2], k);
      }
      // the spirit: her figure in light, leaving her body and drifting slowly across, trailing after-images
      if (t > LEAVE && t < IN + 0.15) {
        const x = spiritX(t), fade = 1 - smooth(IN, IN + 0.15, t);
        for (let i = 3; i >= 1; i--) drawFigure(p, SPIRIT, x - i * 6, -2, { solid: SP[1], a: 0.25 * fade });
        drawFigure(p, SPIRIT, x, -2, { solid: SP[3], a: 0.6 * fade });
        p.glow(x + 2, -22, 26, SP[2], 0.5 * fade);
      }
      // taken: the target's eyes lit with her, a glow over it, the outline of her flickering inside it now and then
      if (t > IN) {
        const k = smooth(IN, TAKEN, t) * (1 - smooth(END - 0.5, END - 0.2, t));
        p.px(TX - 4, -44, SP[4]);
        p.px(TX + 4, -44, SP[4]);
        p.glow(TX, -44, 12, SP[2], 0.8 * k);
        if (Math.floor(t * 6) % 3 === 0) drawFigure(p, SPIRIT, TX - 6, -2, { solid: SP[2], a: 0.25 * k });
        if (t < TAKEN + 0.3) {
          const u = clamp((t - IN) / 0.3);
          p.ring(TX, -28, 6 + 26 * ease.outCubic(u), 1, SP[3], 1 - u);
        }
      }
      ps.draw(p, "front");
    },
  };
});

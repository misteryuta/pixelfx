// LIVE move: Itachi Uchiha (Mangekyou Sharingan), slot 4 "Yata Mirror Defense".
// Narutopedia (Yata Mirror, debut ch. 392; Susanoo): an ethereal shield in the primary LEFT hand of Itachi's
// Susanoo; it changes its nature to nullify any attack. With the Totsuka (right hand) it made him near invincible.
// The moment to see: a real attack meeting the mirror's face and ending there. So nothing strikes it in the baked
// layer: the server raises the guard, and when the rival's actual attack is blocked, the client plays the reaction at
// the mirror-face anchor (a ripple; the glass takes the colour of the nature that answers the attack: water against
// fire, wind against lightning ... game colours, not a source detail).
// Here: the armoured Susanoo (hood, tengu nose, magatama earrings, the jar in the second right hand) rises round him;
// the left arm swings the mirror round in front and holds it braced, the body set behind it; the guard holds; it lowers.
import { drawSusanoo2, yata, jar, ik } from "../jutsu/_susanoo2.js";
import { drawModel } from "../jutsu/_models.js";
import { keyTrack } from "../jutsu/_susanoo.js";
import { smooth, ease } from "../../core/index.js";

const FORMED = 0.5, UP = 0.8, HOLD = 2.6, DOWN = 2.95, FADE = 3.2, LEN = 3.45;
const R0 = { chest: 0, head: 0, upN: 0, foreN: 0 };
const body = keyTrack([[0, R0], [UP, { chest: -0.06, head: 0.05, upN: 0.25, foreN: -0.5 }], [HOLD, { chest: -0.05, head: 0.05, upN: 0.25, foreN: -0.5 }], [DOWN, R0], [LEN, R0]]);
// the mirror hand: from his side round to in front at chest height, braced
const mirHand = (t) => {
  const u = ease.outBack(smooth(FORMED - 0.05, UP, t), 1.4) * (1 - ease.inOutCubic(smooth(HOLD, DOWN, t)));
  return [-6 + 54 * u, -70 + 8 * u];
};
const formAt = (t) => smooth(0, FORMED, t) * (1 - smooth(FADE - 0.1, LEN, t));

export const live = {
  id: "itachi-yata-mirror",
  user: ["itachi", "right", false],
  len: LEN,
  fps: 20,
  actor(p, t) {
    const out = {};
    let pose = body(t);
    pose = ik("itachi", 0, 0, pose, "F", mirHand(t), -1);
    drawSusanoo2(p, "itachi", -4, 0, {
      pose, form: formAt(t), t, aura: 1,
      extra: (pp, W, Cc, s, f) => { jar(pp, W, Cc, s, f); },
      front: (pp, W, Cc, s, f) => {
        const k = smooth(FORMED - 0.1, UP - 0.1, t) * (1 - smooth(DOWN, FADE, t));
        if (k > 0.05) out.mirror = yata(pp, W, Cc, s, f, 0, null, 0);
      },
    });
    drawModel(p, "itachi", "right", 0, 0, {});
    return out;
  },
  spawns: [],
  // the guard: the server holds a shield on him from UP to HOLD
  hits: [{ t: UP, shape: "self", state: "shield", until: HOLD, full: true }],
  // played at runtime on a blocked hit, at the mirror face, tinted by the answering nature
  onBlock: { fx: "ripple", at: "mirror" },
  sfx: [[FORMED, "cast"], [UP, "block"]],
  fx: {
    ripple: {
      len: 0.4,
      draw(p, u) {
        const r = 3 + 26 * ease.outCubic(u);
        p.ellipse(0, 0, r * 0.45, r, 0xffffffff, 0.8 * (1 - u));
        p.ellipse(0, 0, 8, 22, 0xffffffff, 0.5 * (1 - u));
        for (let i = 0; i < 6; i++) { const a = i * 1.05; p.px(Math.cos(a) * r * 0.5, Math.sin(a) * r, 0xffffffff); }
      },
    },
  },
};

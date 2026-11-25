// Kamui: warp (Tobi / orange mask, Obito). Narutopedia: Obito can send his whole body into Kamui's dimension through
// his right eye and come back out somewhere else; the space around him twists into a spiral centred on the eye, the
// body is wrung into it and is gone, and he comes back out of a spiral the same way. Separate from the intangibility
// (where he stays put and lets attacks through, obito-kamui-surinuke).
// The moment: his body wrung into a spiral that drains into the single eyehole of the orange mask, then the same spiral
// unwinding somewhere else and him in it. Here: the orange spiral mask, one eyehole (his right eye), the Mangekyou
// glint in it; the twist starts at the eyehole and drags his whole body in, head first, until only the turning point is
// left and it snaps shut; a beat of empty floor; behind the target a point opens and unwinds, he turns out of it already
// facing its back, and puts it down with a kick to the back before it can turn.
// New: the orange spiral mask on the rig head, the body draining into the eye (_lib warp centred on the eyehole with
// growing pull), the reverse unwinding exit.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { cineCam } from "./_cinema.js";

const EYE = 0.1, TWIST = 0.75, GONE = TWIST + 0.55, EMPTY = GONE + 0.35, OPEN = EMPTY + 0.05, OUT = OPEN + 0.5, KICK = OUT + 0.3, END = KICK + 1.1;
const TX = 140, BX = TX + 32;
const SP = ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"].map(hex);
const MASK = ["#a8501a", "#e07a24", "#f6a040", "#ffd08a"].map(hex);

export const meta = {
  name: "Kamui warp",
  desc: "Tobi in his orange spiral mask: space twists round the single eyehole and wrings his whole body into it until he is gone; a beat of empty floor; behind the target a spiral opens and unwinds, he turns out of it facing its back and kicks it down.",
  tags: ["jutsu", "obito", "tobi", "kamui", "mangekyou", "space-time", "teleport", "move", "one-shot"],
  size: [270, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"], seed: 67 },
};

// gone between draining into the eye and coming back out
export const actorAlpha = (t) => (t < GONE - 0.05 ? 1 : t < OPEN + 0.12 ? 0 : 1);

const CALM = { ...READY, crouch: 2, fx: 6, fy: -18, bx: -2, by: -18, ffx: 6, fbx: -6 };
const BEHIND = { ...READY, x: BX, yaw: Math.PI, crouch: 3, lean: 0, fx: 6, fy: -20, bx: -2, by: -18, ffx: 7, fbx: -7, gait: false };
const CHAMBER = { ...BEHIND, crouch: 5, lean: -8, ffx: 2, ffy: -10, fbx: -8 };
const KICKP = { ...BEHIND, x: BX - 2, crouch: 2, lean: -14, ffx: 20, ffy: -16, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [EYE + 0.3, CALM, "out"],
    [GONE, { ...CALM, crouch: 4 }],
    [OPEN, BEHIND, "snap"],
    [OUT, { ...BEHIND, crouch: 2 }],
    [KICK - 0.12, CHAMBER, "out"],
    [KICK, KICKP, "snap"],
    [KICK + 0.35, { ...BEHIND, crouch: 4 }, "out"],
    [END, { ...BEHIND, crouch: 2 }],
  ],
  hits: [
    { t: TWIST, target: false, sfx: "whoosh" },
    { t: GONE, stop: 0.04, shake: 0.12, amp: 1, target: false, sfx: "cast" },
    // he's there: the arrival counts as the moment the server moves him behind the target
    { t: OUT, stop: 0.02, push: 0, straw: 1, flash: 0, sfx: "whoosh" },
    { t: KICK, stop: 0.12, shake: 0.3, amp: 2, push: -6, straw: 22, sfx: "kick" },
  ],
};

// the orange mask: a spiral of ridges round the single eyehole on his right side, which faces the camera
function mask(p, hx, hy, face, k = 1) {
  p.circle(hx, hy, 3.6, MASK[1], k);
  p.arc(hx, hy, 3.2, 1, 0.3, 3.4, MASK[0], k);
  p.arc(hx, hy, 2.0, 1, 2.0, 5.6, MASK[0], k);
  p.px(hx - face, hy - 2, MASK[3], k);
  const ex = hx + face * 1.5, ey = hy - 0.5;
  p.px(ex, ey, SP[0], k);
  return [ex, ey];
}

// the camera: close on the mask as the twist starts; with him as he drains away; a cut to the empty spot behind the
// target, close, as the point opens; pulled out for the kick
export const camera = cineCam([
  [0, { z: 1.4, x: 20, y: -30 }],
  [TWIST, { z: 2.3, x: 8, y: -36, r: -3 }],
  [GONE, { z: 2.0, x: 8, y: -34, r: 0 }],
  [EMPTY, { z: 1.9, x: BX - 6, y: -30, r: 3 }, "cut"],
  [OUT, { z: 1.7, x: BX - 10, y: -30, r: 2 }],
  [KICK, { z: 1.45, x: TX + 10, y: -30, r: 0, shake: 0.5 }],
  [KICK + 0.25, { z: 1.4, x: TX + 10, y: -30 }],
  [END, { z: 1.15, x: TX - 10, y: -30 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let eye = [0, -36];
  return {
    update(t, dt) {
      // shreds of him spiralling into the point as he drains
      if (t > TWIST && t < GONE && R.chance(50 * dt)) {
        const a = R.range(0, TAU), r = R.range(8, 18);
        ps.spawn(P.MOTE, eye[0] + Math.cos(a) * r, eye[1] + Math.sin(a) * r, -Math.sin(a) * 60 - Math.cos(a) * 30, Math.cos(a) * 60 - Math.sin(a) * 30, R.range(0.15, 0.3), SP[3]);
      }
      ps.update(dt);
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      const face = t >= OPEN ? -1 : 1;
      drawBadge(p, t, { kind: "kamui", t0: EYE, t1: TWIST, label: "KAMUI", head: b.head });
      // the mask on him while he is there; the Mangekyou glinting in the eyehole as it starts
      if (actorAlpha(t) > 0) {
        eye = mask(p, b.head[0], b.head[1], face);
        drawGlint(p, t, "kamui", EYE, TWIST + 0.2, b.head);
      }
      // draining into the eye: the frame's own pixels round the eyehole twisted and pulled into it, the radius
      // growing until it takes the whole body, then shrinking to the point that snaps shut
      if (t > TWIST && t < GONE + 0.12) {
        const u = smooth(TWIST, GONE, t), shut = smooth(GONE - 0.05, GONE + 0.12, t);
        const R0 = 6 + 30 * ease.outCubic(u) * (1 - shut);
        warp(p, eye[0], eye[1] + 10 * u, R0, 9 * u * u, 0.7 * u);
        for (let i = 0; i < 3; i++) { const a0 = t * 14 + (i * TAU) / 3; p.arc(eye[0], eye[1] + 10 * u, R0 * 0.7, 1, a0, a0 + 1.4, SP[i ? 3 : 4], 0.8 * (1 - shut)); }
        if (shut > 0 && shut < 1) p.circle(eye[0], eye[1] + 10 * u, 2 * (1 - shut), WHITE);
      }
      // coming out: a point behind the target that opens, unwinds the other way and leaves him standing in it
      if (t > OPEN - 0.05 && t < OUT + 0.15) {
        const u = smooth(OPEN - 0.05, OUT, t), cx = BX, cy = -22, k = 1 - smooth(OUT, OUT + 0.15, t);
        const R0 = 4 + 26 * Math.sin(Math.min(1, u * 1.2) * Math.PI * 0.5);
        warp(p, cx, cy, R0, -9 * (1 - u) * (1 - u), 0.6 * (1 - u));
        for (let i = 0; i < 3; i++) { const a0 = -t * 14 + (i * TAU) / 3; p.arc(cx, cy, R0 * 0.7, 1, a0, a0 + 1.4, SP[i ? 3 : 4], 0.8 * k); }
      }
      ps.draw(p, "front");
    },
  };
});

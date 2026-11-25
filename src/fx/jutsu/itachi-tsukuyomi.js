// Tsukuyomi (Itachi). Narutopedia: a Mangekyou genjutsu cast through eye contact; inside it Itachi controls even time,
// so a victim can be tortured for what feels like days, seventy-two hours of being stabbed, in an instant outside. The
// world of it is inverted: a red sky, black clouds, a pale moon, everything in negative. Here: his Mangekyou turns, the
// target's eyes catch his, and the world flips: red sky, black ground, the moon; the target bound to a cross, Itachi's
// copies driving swords into it while the hours count up to 72; then it snaps back and the target sags.
// New: the inverted world (_lib veil over the whole frame), the moon and clouds, the cross, the copies with swords
// (posed bodies with the rig's sword, in black), the hour count.
// 2026-11-25: Itachi himself (the user's turnaround, _itachi.js) instead of the stock figure, and his copies are him too.
// Narutopedia (Tsukuyomi; Itachi Uchiha): cast through eye contact, with either eye; inside, his perception of time
// rules (days of torture, e.g. continual stabbing, in a moment outside); drawn as inverted grey in the manga, a red sky
// and red moon in the anime; normal genjutsu release does not work on it (the game: no Kai); it costs him a great deal of
// chakra and blurs his sight. The camera barely moves: a slow push in on his eye as the gazes lock, then the still world.
import { Rng, READY, fit, clamp, smooth, ease, hex, rand, mix, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure, drawOutline, veil } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { cineCam } from "./_cinema.js";
import { drawItachi, itachiAt } from "./_itachi.js";
import { drawModel, modelPoint } from "./_models.js";

const EYE = 0.05, OPEN = 0.65, LOCK = OPEN + 0.2, ENTER = LOCK + 0.15, STAB0 = ENTER + 0.35, STABS = 6, SG = 0.22, EXIT = STAB0 + STABS * SG + 0.4, TX = 130;
const W = 260, H = 170, OX = 56, OY = 130;
const RED = hex("#9a0c18"), RED2 = hex("#c8142a"), INK = hex("#080406"), MOON = hex("#f4e8e6");

export const meta = {
  name: "Tsukuyomi",
  desc: "Itachi: his Mangekyou turns, the target meets his eyes and the world turns red and black under a pale moon; bound to a cross, it's stabbed by his copies while the hours count to 72, then it snaps back and the target sags.",
  tags: ["jutsu", "itachi", "genjutsu", "mangekyou", "control", "one-shot"],
  size: [W, H],
  origin: [OX, OY],
  duration: EXIT + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#080406", "#3a0408", "#9a0c18", "#c8142a", "#ff5a5a"], seed: 37 },
};

const CALM = { ...READY, crouch: 1, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 5, fbx: -5 };
// the stock figure is hidden; Itachi is drawn in its place
export const actorAlpha = () => 0;
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [meta.duration, CALM],
  ],
  hits: [
    { t: ENTER, stop: 0.12, shake: 0.15, amp: 1, push: 0, straw: 0, skin: "shadow", flash: 0 },
    ...Array.from({ length: STABS }, (_, i) => ({ t: STAB0 + i * SG + 0.1, stop: 0.03, flash: 0, push: 0.5, straw: 6, shiver: 0.3 })),
    { t: EXIT, stop: 0.1, shake: 0.2, amp: 2, push: 1.5, straw: 6, skin: null, shiver: 1 },
  ],
};

// the camera: still on both; a slow push in on his eye as the gazes lock; the still world; out again
export const camera = cineCam([
  [0, { z: 1.2, x: 60, y: -40 }],
  [LOCK, { z: 1.35, x: 30, y: -48 }],
  [ENTER - 0.02, { z: 1.9, x: 10, y: -54 }],
  [ENTER, { z: 1.15, x: 70, y: -44 }, "cut"],
  [EXIT, { z: 1.15, x: 72, y: -44 }],
  [EXIT + 0.02, { z: 1.25, x: 70, y: -40 }, "cut"],
  [meta.duration, { z: 1.2, x: 66, y: -40 }],
]);

// one of his copies inside the world: him, inked black with red eyes, the sleeve swung forward and a sword from the hand
function copy(p, x, face, rot, a) {
  const o = { flip: face < 0, tint: INK, tintK: 0.82, alpha: a, pose: { arm: { rot, st: 1.05 } } };
  drawModel(p, "itachi", "right", x, 0, o);
  const sh = modelPoint("itachi", "right", x, 0, o, "arm", [10, 30]), h = modelPoint("itachi", "right", x, 0, o, "arm", [11, 48]);
  const dx = h[0] - sh[0], dy = h[1] - sh[1], L = Math.hypot(dx, dy) || 1;
  p.beam(h[0], h[1], h[0] + (dx / L) * 22, h[1] + (dy / L) * 22, 2, hex("#d8d0d8"), a);
  const e = modelPoint("itachi", "right", x, 0, o, "head", [18.5, 17]);
  p.px(Math.round(e[0]), Math.round(e[1]), RED2, a);
}

// the copies: where each stands round the target, its facing, when it stabs
const COPIES = [
  { x: TX - 30, face: 1 }, { x: TX + 30, face: -1 }, { x: TX + 12, face: -1, y: -4 },
];

export const create = play([], (o) => {
  const C = fit(o.palette, 5);
  const inWorld = (t) => t >= ENTER && t < EXIT;
  return {
    drawBack(p, t) {
      if (!inWorld(t)) return;
      const k = smooth(ENTER, ENTER + 0.08, t);
      // the inverted world: red over everything above the floor, black below, a pale moon, bars of black cloud
      veil(p, -OX, -OY, W - OX - 1, 0, RED, 0.9 * k);
      veil(p, -OX, 0, W - OX - 1, H - OY - 1, INK, 0.92 * k);
      p.circle(TX + 70, -100, 16, MOON, k);
      p.circle(TX + 66, -103, 13, mix(MOON, RED, 0.12), k);
      for (let i = 0; i < 4; i++) {
        const y = -118 + i * 14, x = -OX + ((t * 6 + i * 70) % (W + 80)) - 40;
        if (k > 0.5) p.rect(x, y, 70 - i * 8, 3, INK);
      }
      // the cross the target hangs on
      p.rect(TX - 2, -64, 5, 64, INK, k);
      p.rect(TX - 28, -46, 56, 5, INK, k);

    },
    draw(p, t) {
      // outside the world: Itachi as he is; inside: inked black, his eye still red
      const inside = inWorld(t), kin = inside ? smooth(ENTER, ENTER + 0.08, t) : 0;
      const I = drawItachi(p, t, act.poses, inside ? { tint: INK, tintK: 0.82 * kin } : {}), eye = [Math.round(I.eye[0]), Math.round(I.eye[1])];
      drawBadge(p, t, { kind: "itachi", t0: EYE, t1: OPEN, label: "TSUKUYOMI", head: [I.crown[0] + 2, I.crown[1] + 18] });
      drawGlint(p, t, "itachi", OPEN + 0.05, meta.duration - 0.3, [eye[0] - 2, eye[1] + 0.5]);
      // eye contact: a thread of red between his eyes and the target's
      if (t > LOCK && t < ENTER) {
        const u = clamp((t - LOCK) / (ENTER - LOCK));
        p.line(eye[0] + 1, eye[1], eye[0] + 1 + (TX - 4 - eye[0]) * u, eye[1] + (-46 - eye[1]) * u, RED2);
        p.px(TX - 4, -46, RED2);
        p.px(TX + 4, -46, RED2);
      }
      if (!inWorld(t)) {
        if (t >= EXIT && t < EXIT + 0.05) veil(p, -OX, -OY, W - OX - 1, H - OY - 1, WHITE, 0.8);
        return;
      }
      const k = smooth(ENTER, ENTER + 0.08, t);
      if (t < ENTER + 0.05) veil(p, -OX, -OY, W - OX - 1, H - OY - 1, WHITE, 0.8);
      p.px(eye[0], eye[1], RED2);
      // the copies, each driving a sword in, one after another
      COPIES.forEach((c, i) => {
        const appear = smooth(ENTER + 0.1 + i * 0.08, ENTER + 0.25 + i * 0.08, t);
        if (appear <= 0) return;
        // the sleeve: held forward with the sword; drawn back, then thrust on its beat
        let rot = -0.7;
        for (let s = i; s < STABS; s += COPIES.length) {
          const a = t - STAB0 - s * SG;
          if (a >= 0 && a < SG) rot = a < 0.08 ? -0.2 : -1.45;
        }
        copy(p, c.x, c.face, rot, appear);
      });
      // the hours: time inside runs at another speed, up to 72
      const hrs = Math.min(72, Math.floor(72 * ease.inQuad(clamp((t - STAB0) / (EXIT - STAB0 - 0.2)))));
      if (t > STAB0) p.text(`${hrs} HRS`, TX, -92, hrs === 72 ? WHITE : MOON, { font: "big", align: "center", outline: INK });
    },
  };
});

// LIVE move: Sasuke Uchiha (Mangekyou Sharingan, Kage Summit), slot 1 "Susanoo Arrow".
// Narutopedia (Susanoo, Sasuke): his armoured Susanoo has horns, a long chin appendage and jagged teeth round the
// hood; its primary weapon is a bow manifested on the wrist of its LEFT arm (doubling as a shield); arrows are drawn
// from an orb held by its primary RIGHT hand and fire very fast. Mangekyou (not yet Eternal) at the Summit.
// The moment to see: the arrow coming free. From the normal camera: the purple armoured Susanoo rises round him and
// leans in; the left arm brings the bow up in front; the right hand closes on the orb and an arrow forms on the string
// (nocking); the hand pulls back toward the shoulder, the string with it (drawing); a held, trembling beat (aiming);
// the string snaps forward and the arrow is gone along the bow's line: from there a separate projectile that the
// server checks against the target as it flies (a shield in its path stops it).
import { drawSusanoo2, bow, ik, SUSANOO2 } from "../jutsu/_susanoo2.js";
import { drawModel } from "../jutsu/_models.js";
import { keyTrack } from "../jutsu/_susanoo.js";
import { smooth, ease } from "../../core/index.js";

const FORMED = 0.5, RAISE = 0.85, NOCK = 1.05, DRAWN = 1.5, LOOSE = 1.68, REST = 2.2, FADE = 2.55, LEN = 2.8;
const C = SUSANOO2.sasuke, AIM_Y = -56, GRIP_X = 58;
// the body leans in toward the target as the bow comes up
const body = keyTrack([[0, { chest: 0, head: 0, pelvis: 0 }], [RAISE, { chest: 0.18, head: -0.08, pelvis: 0.05 }], [LOOSE, { chest: 0.2, head: -0.1, pelvis: 0.05 }], [LOOSE + 0.08, { chest: 0.12, head: -0.06 }], [LEN, { chest: 0.02 }]]);
// the bow hand (far: his left) and the string hand (near: his right), in px from his feet
const bowHand = (t) => {
  const u = ease.outBack(smooth(FORMED, RAISE, t), 1.2) * (1 - ease.inOutCubic(smooth(REST, FADE, t)));
  return [12 + (GRIP_X - 12) * u, -96 + (AIM_Y + 96) * u];
};
const drawFrac = (t) => (t < NOCK ? 0 : t < DRAWN ? ease.inOutCubic(smooth(NOCK, DRAWN, t)) : t < LOOSE ? 1 : 0);
const strHand = (t) => {
  const B = bowHand(t), d = drawFrac(t), shake = t > DRAWN && t < LOOSE ? Math.sin(t * 90) * 0.6 : 0;
  // out to the string (nocking), then back toward the shoulder along the aim line (drawing)
  const reach = smooth(RAISE - 0.1, NOCK, t) * (1 - smooth(LOOSE, LOOSE + 0.3, t));
  const rest = [8, -70], target = [B[0] - 14 - 46 * d, AIM_Y + shake];
  return [rest[0] + (target[0] - rest[0]) * reach, rest[1] + (target[1] - rest[1]) * reach];
};
const formAt = (t) => smooth(0, FORMED, t) * (1 - smooth(FADE - 0.1, LEN, t));

export const live = {
  id: "sasuke-susanoo-arrow-summit",
  user: ["sasuke", "right", false],
  len: LEN,
  fps: 20,
  actor(p, t) {
    const out = {};
    let pose = body(t);
    pose = ik("sasuke", 0, 0, pose, "F", bowHand(t), -1);
    pose = ik("sasuke", 0, 0, pose, "N", strHand(t), 1);
    drawSusanoo2(p, "sasuke", -4, 0, {
      pose, form: formAt(t), t, aura: 1,
      front: (pp, W, Cc, s, f) => {
        const showBow = smooth(FORMED + 0.05, RAISE, t) * (1 - smooth(REST + 0.1, FADE, t));
        if (showBow <= 0.05) return;
        const H = strHand(t), nock = t >= NOCK && t < LOOSE ? H : null;
        const B = bow(pp, W, Cc, s, f, 0, nock);
        out.nock = B.nock; out.grip = B.grip;
        // the orb in the right hand while the arrow is taken from it
        if (t > RAISE - 0.1 && t < NOCK + 0.1) { pp.circle(H[0], H[1], 4, Cc.hi); pp.circle(H[0], H[1], 2.5, 0xffffffff); }
        // the arrow on the string: from the nock forward past the grip, growing as it forms
        if (t >= NOCK && t < LOOSE) {
          const L = 22 + 40 * smooth(NOCK, NOCK + 0.2, t);
          pp.beam(H[0], H[1], H[0] + L, H[1], 2.5, Cc.ol);
          pp.line(H[0], H[1], H[0] + L, H[1], Cc.hi);
          pp.poly([[H[0] + L, H[1] - 3], [H[0] + L + 7, H[1]], [H[0] + L, H[1] + 3]], Cc.hi);
          out.head = [H[0] + L + 7, H[1]];
        }
        // the release: a flash at the nock as the string snaps straight
        if (t >= LOOSE && t < LOOSE + 0.06) pp.circle(B.nock[0], B.nock[1], 4, 0xffffffff);
      },
    });
    drawModel(p, "sasuke", "right", 0, 0, {});
    return out;
  },
  spawns: [
    // the arrow leaves from where its head was on the last frame on the string, along the bow's line
    { t: LOOSE, fx: "arrow", at: "anchorAt", anchor: "head", anchorT: LOOSE - 0.03, vx: 560, life: 0.62, projectile: "arrow" },
  ],
  hits: [{ t: LOOSE, shape: "projectile", name: "arrow", anchor: "head", anchorT: LOOSE - 0.03, vx: 560, life: 0.62, w: 10, dmg: 1.0 }],
  onHit: { fx: "arrowhit" },
  sfx: [[NOCK, "cast"], [DRAWN, "step"], [LOOSE, "whoosh"]],
  fx: {
    arrow: {
      len: 0.1, loop: true,
      draw(p, u) {
        p.beam(-34, 0, 0, 0, 3, C.ol); p.line(-34, 0, 0, 0, C.hi); p.poly([[0, -4], [9, 0], [0, 4]], 0xffffffff);
        for (let i = 0; i < 3; i++) p.line(-40 - i * 8 - u * 8, (i - 1) * 2, -34 - i * 8 - u * 8, (i - 1) * 2, C.lt);
      },
    },
    arrowhit: {
      len: 0.3,
      draw(p, u) {
        const r = 4 + 18 * ease.outCubic(u);
        p.arc(0, 0, r, 2, 0, Math.PI * 2, C.hi, 1 - u);
        for (let i = 0; i < 5; i++) { const a = i * 1.26; p.line(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, Math.cos(a) * r, Math.sin(a) * r, 0xffffffff, 1 - u); }
      },
    },
  },
};

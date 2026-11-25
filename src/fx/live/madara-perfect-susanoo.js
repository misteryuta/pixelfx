// LIVE move (no cutscene): Madara Uchiha (Uchiha Clan Leader, Flashback), slot 1 "Perfect Susanoo".
// Played on the training ground from the normal camera: Madara stands, arms folded; his blue Complete Body Susanoo
// manifests round him from the base up; its near hand goes to the hilt at the far hip while the far hand steadies the
// scabbard; a short stillness; the blade leaves the scabbard (a thin seam of light on the part that is out); a level
// side cut through the space ahead of him (the user's rule: Madara's Susanoo cuts from the side), the trail following
// the real tip; where it meets the target (or the ground at the arc's end) the impact, a wave running on along the
// floor from there, and dust that rises a beat later. The target can step out of the arc and the cut misses.
// Narutopedia (Susanoo, Madara): dark blue; Complete Body with a long tengu nose, two lines from mouth to chin, hair
// tied at the sides, wings, robes and ornate armour; katana. The sword-and-scabbard handling is our staging.
// The actor layer (Madara + Susanoo) is baked per frame with anchors; impact, wave and dust are separate flipbooks
// placed at runtime at the contact the server reports.
import { drawSusanoo2, scabbard, katana, SUSANOO2 } from "../jutsu/_susanoo2.js";
import { drawModel } from "../jutsu/_models.js";
import { keyTrack } from "../jutsu/_susanoo.js";
import { clamp, smooth, ease, hex, noise2 } from "../../core/index.js";

const FORM0 = 0, FORMED = 0.6, GRIP = 0.95, HOLD = 1.2, PULLED = 1.55, RAISE = 1.7, CONTACT = 1.86, FOLLOW = 2.05, REST = 2.65, FADE = 3.15, LEN = 3.45;
const C = SUSANOO2.madara, BL = 132;
// the Susanoo's arms over the move (bone rotations; + clockwise on screen, arms hang down at 0)
const pose = keyTrack([
  [0, { upN: -0.2, foreN: -0.4, upF: -0.2, foreF: -0.5, chest: 0, head: 0 }],
  [FORMED, { upN: -0.2, foreN: -0.4, upF: -0.2, foreF: -0.5 }],
  // the near hand down on the hilt at the scabbard's mouth; the far hand steadies the scabbard
  [GRIP, { upN: 0.12, foreN: -0.15, upF: 0.25, foreF: -0.1, chest: 0.04 }],
  [HOLD, { upN: 0.12, foreN: -0.15, upF: 0.25, foreF: -0.1, chest: 0.05 }],
  // the draw: the hand pulls forward and up along the scabbard's line until the point is out
  [PULLED, { upN: -2.0, foreN: -0.35, upF: 0.3, foreF: -0.1, chest: -0.06, head: -0.05 }],
  // up and back over the shoulder
  [RAISE, { upN: -2.9, foreN: -0.5, chest: -0.14, head: -0.06 }],
  // the cut: round and down through the space in front, at the height of a man
  [CONTACT, { upN: -0.95, foreN: -0.15, chest: 0.26, head: 0.08 }],
  [FOLLOW, { upN: -0.8, foreN: 0.05, chest: 0.24, head: 0.08 }],
  [REST, { upN: -0.8, foreN: 0.1, chest: 0.08 }],
  [LEN, { upN: -0.5, foreN: -0.2 }],
]);
// after the draw the blade's angle on screen is keyed (0 = straight ahead, + = down)
const keyAng = keyTrack([[PULLED, { a: -1.0 }], [RAISE, { a: -2.3 }], [CONTACT, { a: 0.62 }], [FOLLOW, { a: 0.72 }], [REST, { a: 0.35 }], [LEN, { a: 0.35 }]]);
const formAt = (t) => smooth(FORM0, FORMED, t) * (1 - smooth(FADE - 0.1, LEN, t));
const fade = (t) => 1 - ease.inCubic(smooth(REST + 0.2, FADE, t));
// the blade, given where the hand and the scabbard's mouth are: sheathed (only the hilt) before the hold; while drawn,
// lying along the line from the hand back to the mouth with its point at the mouth; once the point is out, swinging
function blade(t, hand, mouth) {
  if (t < HOLD) return { ang: Math.atan2(mouth[1] - hand[1], mouth[0] - hand[0]), L: 0, out: 0 };
  const dx = mouth[0] - hand[0], dy = mouth[1] - hand[1], d = Math.hypot(dx, dy), sh = Math.atan2(dy, dx);
  if (d < BL && t < RAISE) return { ang: sh, L: d, out: d / BL };
  const u = ease.inOutCubic(smooth(PULLED - 0.02, RAISE, t));
  let da = keyAng(t).a - sh; da = Math.atan2(Math.sin(da), Math.cos(da));
  return { ang: sh + da * u, L: BL * fade(t), out: 1 };
}

export const live = {
  id: "madara-perfect-susanoo",
  user: ["madara", "left", true], // his clean profile is the left-facing view, mirrored to face right
  len: LEN,
  fps: 20,
  // the actor layer at t: Madara and his Susanoo, feet at (0, 0), facing right; returns the anchors
  actor(p, t) {
    const out = {};
    drawSusanoo2(p, "madara", -6, 0, {
      pose: pose(t), form: formAt(t), t, aura: 1, wings: 0.6 + 0.4 * formAt(t),
      extra: (pp, W, Cc, s, f) => { out.mouth = scabbard(pp, W, Cc, s, f); },
      front: (pp, W, Cc, s, f) => {
        const hand = katana({ beam() {}, line() {} }, W, Cc, s, f, 0, 0).base, B = blade(t, hand, out.mouth);
        const k = katana(pp, W, Cc, s, f, B.ang, B.L);
        out.tip = k.tip; out.hilt = k.base;
        // the moment the point leaves the scabbard: a thin seam of light on the last part of the blade that came out
        if (B.out > 0.8 && B.out < 1) { const q = 1 - B.out; pp.line(out.mouth[0], out.mouth[1], out.mouth[0] - Math.cos(B.ang) * 26 * q * 5, out.mouth[1] - Math.sin(B.ang) * 26 * q * 5, 0xffffffff); pp.px(out.mouth[0], out.mouth[1], 0xffffffff); }
        if (B.out >= 1 && t < RAISE && t - PULLED < 0.08) pp.circle(out.mouth[0], out.mouth[1], 3, 0xffffffff);
        // the trail: the tip's path over the last hundredths of a second, sampled from the swing itself
        if (t > RAISE && t < FOLLOW + 0.05) {
          let prev = null;
          for (let i = 0; i <= 6; i++) {
            const tt = t - i * 0.018, P = trailTip(tt);
            if (prev) pp.beam(prev[0], prev[1], P[0], P[1], Math.max(1, 4 - i * 0.6), i < 2 ? 0xffffffff : Cc.hi, 1 - i / 7);
            prev = P;
          }
        }
      },
    });
    // Madara himself, arms folded, at the Susanoo's heart
    drawModel(p, "madara", "left", 0, 0, { flip: true });
    return out;
  },
  // timeline: things spawned at runtime (flipbooks), and what the server checks
  spawns: [
    { t: CONTACT, fx: "impact", at: "contact" },
    { t: CONTACT, fx: "wave", at: "contact.ground", vx: 230, life: 0.75 },
    { t: CONTACT + 0.16, fx: "dust", at: "contact.ground" },
  ],
  hits: [
    // the arc of the cut in front of him: from his front edge to the blade's reach, chest-high and lower
    { t: CONTACT, shape: "box", x0: 24, x1: 210, dmg: 1.0, name: "cut", contact: "tip" },
    // the wave on the floor from the contact point on
    { t: CONTACT, shape: "wave", vx: 230, life: 0.75, w: 14, dmg: 0.35, name: "wave" },
  ],
  sfx: [[GRIP, "cast"], [PULLED, "parry"], [RAISE, "whoosh"], [CONTACT, "heavy"], [CONTACT + 0.16, "rumble"]],
  // the flipbooks, drawn at their own origin (contact point on the floor = 0, 0)
  fx: {
    impact: { len: 0.35, draw(p, u) { const r = 6 + 30 * ease.outCubic(u); p.arc(0, -20, r, 2, 0, Math.PI * 2, 0xffffffff, 1 - u); p.circle(0, -20, 10 * (1 - u), C.hi, 1 - u); for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3; p.line(Math.cos(a) * r * 0.5, -20 + Math.sin(a) * r * 0.5, Math.cos(a) * r, -20 + Math.sin(a) * r, C.hi, 1 - u); } } },
    wave: { len: 0.3, loop: true, draw(p, u) { for (let i = 0; i < 5; i++) { const x = -i * 5, h = 10 - i * 1.6 + 2 * Math.sin((u + i * 0.2) * Math.PI * 2); p.beam(x, 0, x + 3, -h, 3, i ? C.lt : 0xffffffff); } p.line(-26, 0, 4, 0, C.hi); } },
    dust: { len: 0.9, draw(p, u) { for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI, r = 6 + 26 * ease.outCubic(u), x = Math.cos(a) * r * 1.3, y = -Math.sin(a) * r * 0.6 - 14 * u; p.circle(x, y, 5 * (1 - u * 0.5), hex("#8a8678"), 0.8 * (1 - u)); } } },
  },
};
// the tip's position at any time (for the trail), from the same pose (drawn nowhere)
function trailTip(t) {
  const pf = { poly() {}, beam() {}, line() {}, circle() {}, ellipse() {}, px() {}, rect() {}, arc() {}, glow() {}, dot() {}, fade: 1 };
  let tip = [0, 0];
  drawSusanoo2(pf, "madara", -6, 0, { pose: pose(t), aura: 0, extra: (pp, W, Cc, s, f) => { pf.mouth = scabbard(pf, W, Cc, s, f); }, front: (pp, W, Cc, s, f) => { const hand = katana(pf, W, Cc, s, f, 0, 0).base, B = blade(t, hand, pf.mouth); tip = katana(pp, W, Cc, s, f, B.ang, B.L).tip; } });
  return tip;
}
void clamp; void noise2;

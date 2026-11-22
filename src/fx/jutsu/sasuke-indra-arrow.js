// Indra no Ya (Indra's Arrow, Sasuke, with the Rinnegan). Narutopedia: after absorbing the chakra of all nine tailed
// beasts and using his Complete Body Susanoo as the vessel, Sasuke creates a longbow and an arrow infused with
// lightning chakra, strong enough to meet Six Paths Naruto's greatest Rasenshuriken. His Complete Body Susanoo is purple:
// a crow-billed helmet, two spikes over each eye, a slit across its mouth, three gaps on each cheek; the bow is on its
// left wrist and the arrows are drawn from an orb in its right hand; with the tailed beasts' chakra (the Indra Susanoo)
// lightning pours from its back. After the anime (the reference clip): the purple giant wreathed in cyan-white
// lightning, the frame flooded with it, then the colossal arrow, its head a wide barbed triangle, tearing down through
// the clouds trailing lightning.
// Here: his Rinnegan and Sharingan; Sasuke rises and the purple Complete Body Susanoo forms round him; the tailed beasts'
// chakra floods into it and lightning bursts off its back; the bow unfolds on its left wrist; the right hand closes on
// an orb of lightning and draws: the arrow grows out of the orb along the string, and as the draw deepens lightning
// is pulled in from every edge of the frame, the arrow swelling, its head a wide barbed blade; the release: the string
// snaps, the arrow is already there, a river of cyan lightning through the target, a pillar of lightning standing up
// out of it, two frames of ink; the ground torn along its path.
// New over the old version: the Complete Body Susanoo (from _perfect.js) drawing a real bow, the barbed arrowhead, the
// lightning pillar. Smooth: arm, draw and lean follow Hermite keys; a camera (shots).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt, impactFrame, veil } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { keyTrack } from "./_susanoo.js";
import { shots } from "./_taijutsu.js";
import { drawPerfect, PERFECT } from "./_perfect.js";

const EYE = 0.05, RISE = 0.55, FORM0 = 0.65, FORMED = 1.45, INDRA = 1.55, BOW = 1.85, GRAB = 2.25, DRAWN = 3.15, LOOSE = 3.55, FLY = 0.12, HIT = LOOSE + FLY;
const REST = HIT + 1.6, FADE = REST + 0.4, END = FADE + 0.9, TX = 292, G = 0.62;
const C = PERFECT.sasuke, LT = ["#061430", "#0c3a80", "#1a8ae0", "#6ad8ff", "#c8f6ff", "#ffffff"].map(hex);
const SX = 6;
// the bow hand out toward the target; the draw hand from the bow back to the jaw
const GRIP = [118, -196], ANCHOR = [6, -214];
const K = keyTrack([
  [0, { nx: 60, ny: -140, fx: -40, fy: -130, lean: 0, pull: 0, bow: 0 }],
  [FORMED, { nx: 60, ny: -140, fx: -40, fy: -130, lean: 0, pull: 0, bow: 0 }],
  // the left arm comes up and out onto the target, the bow unfolding on its wrist
  [BOW + 0.3, { fx: GRIP[0], fy: GRIP[1], bow: 1, lean: 0.04 }],
  // the right hand to the string at the bow
  [GRAB, { nx: GRIP[0] - 22, ny: GRIP[1] - 4, pull: 0 }],
  // the draw: back along the arrow to the jaw, the body leaning back into it
  [DRAWN, { nx: ANCHOR[0], ny: ANCHOR[1], pull: 1, lean: -0.08 }],
  [LOOSE, { nx: ANCHOR[0] - 2, ny: ANCHOR[1], pull: 1.03, lean: -0.09 }],
  // the release: the hand flies back past the jaw, the bow arm kicks
  [LOOSE + 0.1, { nx: ANCHOR[0] - 46, ny: ANCHOR[1] + 10, pull: 0, fx: GRIP[0] - 6, fy: GRIP[1] - 14, lean: -0.16 }],
  [LOOSE + 0.5, { nx: ANCHOR[0] - 30, ny: ANCHOR[1] + 14, fx: GRIP[0] - 2, fy: GRIP[1] - 6, lean: -0.06 }],
  [REST, { nx: 50, ny: -150, fx: GRIP[0] - 20, fy: GRIP[1] + 20, bow: 1, lean: 0 }],
  [FADE, { bow: 0 }],
]);
const form = (t) => smooth(FORM0, FORMED, t) * (1 - smooth(FADE, END - 0.15, t));

export const meta = {
  name: "Indra's arrow",
  desc: "Sasuke with the Rinnegan: his purple Complete Body Susanoo forms, the tailed beasts' lightning bursting off its back; the bow unfolds on its left wrist, the right hand draws an arrow of lightning out of an orb while lightning floods in from everywhere; loosed, a river of cyan lightning through the target and a pillar of lightning out of it.",
  tags: ["jutsu", "sasuke", "susanoo", "complete-body", "rinnegan", "lightning", "projectile", "aoe", "ultimate", "one-shot"],
  size: [460, 270],
  origin: [110, 244],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0e0624", "#2a1260", "#4e24a0", "#8050e0", "#c4a0ff", "#f4ecff"], seed: 135 },
};

const CALM = { ...READY, crouch: 0, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 5, fbx: -5 };
const FLOAT = { ...CALM, x: SX - 3, y: -93, fx: 10, fy: -24, bx: 6, by: -24, ffx: 4, ffy: -6, fbx: -4, fby: -6, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE, CALM, "out"],
    [FORM0 + 0.5, FLOAT, "out"],
    [DRAWN, { ...FLOAT, lean: -4, fx: 2, fy: -28, bx: 12, by: -26 }],
    [LOOSE + 0.1, { ...FLOAT, lean: -6, fx: -6, fy: -26 }, "snap"],
    [FADE, FLOAT],
    [END, { ...CALM, x: SX - 3, gait: false }, "in"],
  ],
  hits: [
    { t: RISE, stop: 0.06, shake: 0.3, amp: 2, target: false, sfx: "cast" },
    { t: INDRA, stop: 0.08, shake: 0.8, amp: 3, target: false, sfx: "thunder" },
    { t: GRAB + 0.2, shake: 1.2, amp: 1, target: false, sfx: "thunder" },
    { t: LOOSE, stop: 0.06, shake: 0.4, amp: 2, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.3, shake: 1.4, amp: 10, push: 10, straw: 90, skin: "shock", shiver: 1, sfx: "explosion" },
    { t: HIT + 0.4, shake: 0.9, amp: 4, target: false, sfx: "thunder" },
    { t: HIT + 1.0, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RISE, x: SX, n: 16, dir: -1 }, { t: RISE, x: SX, n: 16, dir: 1 }, { t: HIT, x: TX - 40, n: 24, dir: -1 }, { t: HIT, x: TX + 40, n: 24, dir: 1 }],
};

export const camera = shots([
  [0, { z: 2.4, x: SX + 6, y: -26 }],
  [FORMED, { z: 1.1, x: SX + 70, y: -106 }],
  [BOW + 0.3, { z: 1.3, x: SX + 75, y: -124, r: 1 }],
  [GRAB, { z: 1.7, x: SX + 44, y: -127, r: -1 }, "cut"],
  [DRAWN, { z: 1.9, x: SX + 31, y: -130, r: -3 }],
  [LOOSE, { z: 2.0, x: SX + 37, y: -130, r: -3 }],
  [LOOSE + 0.02, { z: 1.0, x: 180, y: -100, r: 0 }, "cut"],
  [HIT + 0.2, { z: 1.3, x: TX - 12, y: -75, r: 2 }, "cut"],
  [REST, { z: 1.1, x: 198, y: -93 }],
  [END, { z: 1.0, x: 186, y: -93 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  const S = (t) => {
    const k = K(t);
    return { kind: "sasuke", x: SX, y: 0, s: G, t, form: form(t), near: [k.nx, k.ny], far: [k.fx, k.fy], farBend: 1, nearBend: 1, lean: k.lean, wings: smooth(FORMED - 0.4, FORMED + 0.4, t), bow: k.bow * smooth(BOW, BOW + 0.3, t), pull: clamp(k.pull), lightning: smooth(INDRA, INDRA + 0.2, t) * (1 - smooth(FADE - 0.3, FADE, t)) };
  };
  // the arrow's line: from the draw hand through the bow toward the target, in effect space
  const arrowLine = (t) => { const k = K(t), H = [SX + k.nx * G, k.ny * G], Gp = [SX + GRIP[0] * G, GRIP[1] * G], a = Math.atan2(-24 - Gp[1], TX - Gp[0]); return { H, G: Gp, a }; };
  // the arrow: a shaft of white-cyan lightning, a wide barbed head; f: flicker frame
  function arrow(p, x, y, a, L, f, k = 1, sc = 1) {
    const c = Math.cos(a), s = Math.sin(a), at = (u, v) => [x + c * u * sc - s * v * sc, y + s * u * sc + c * v * sc];
    p.glowLine(...at(-L / sc, 0), ...at(10, 0), 26 * sc, LT[3], 0.7 * k);
    p.beam(...at(-L / sc, 0), ...at(0, 0), 5 * sc, LT[3], k);
    p.beam(...at(-L / sc, 0), ...at(0, 0), 2 * sc, WHITE, k);
    // the head: a wide barbed triangle, white core
    p.poly([at(30, 0), at(-4, -16), at(4, -5), at(4, 5), at(-4, 16)], LT[4], k);
    p.poly([at(24, 0), at(2, -8), at(2, 8)], WHITE, k);
    // fletching of lightning at the back
    for (let i = 0; i < 3; i++) bolt(p, ...at(-L / sc + 4, 0), ...at(-L / sc - 14 - rand(f, i) * 10, (rand(f, i + 3) - 0.5) * 30), f + i, LT, { jag: 0.4, seed: i, glow: 0 });
  }
  return {
    update(t, dt) {
      if (t > INDRA && t < FADE && R.chance(50 * dt)) ps.spawn(P.SPARK, SX + R.range(-50, 38), -R.range(38, 186), R.range(-120, 120), R.range(-80, 40), R.range(0.08, 0.2), R.chance(0.5) ? WHITE : LT[3]);
      if (t >= HIT) once("hit", () => { lights.add(TX, -38, 200, LT[4], 1, 0.6); for (let i = 0; i < 40; i++) { const a = R.range(-Math.PI, 0), s = R.range(80, 260); ps.spawn(P.STREAK, TX, -20, Math.cos(a) * s, Math.sin(a) * s, R.range(0.15, 0.4), R.chance(0.5) ? WHITE : LT[3]); } });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      if (t > RISE && t < FORMED + 0.2) {
        const k = smooth(RISE, RISE + 0.15, t) * (1 - smooth(FORMED - 0.2, FORMED + 0.2, t)), w = 15 + 37 * smooth(RISE, FORMED, t);
        p.shade(SX - w - 10, -205, SX + w + 10, 2, (x, y, out) => { const d = Math.abs(x - SX) / (w * (0.8 + 0.25 * noise2(y * 0.03 - t * 4, 1, 4))); if (d > 1) return; out.a = k; out.k = 0.3; return d > 0.8 ? C[4] : d > 0.4 ? C[3] : C[5]; });
      }
      const st = S(t), J = drawPerfect(p, { ...st, layer: "back" });
      // the string: from both tips of the bow to the drawing fingers while drawn; straight (twanging) otherwise
      if (st.bow > 0.3 && J.bowTips) {
        const H = J.near, nocked = t > GRAB && t < LOOSE, [A, B] = J.bowTips;
        if (nocked) { p.line(A[0], A[1], H[0], H[1], LT[4]); p.line(B[0], B[1], H[0], H[1], LT[4]); }
        else { const tw = t > LOOSE ? Math.sin((t - LOOSE) * 80) * 6 * Math.exp(-(t - LOOSE) * 7) : 0, mx = (A[0] + B[0]) / 2 - tw, my = (A[1] + B[1]) / 2; p.line(A[0], A[1], mx, my, LT[4]); p.line(mx, my, B[0], B[1], LT[4]); }
      }
      // the ground torn along the arrow's path
      if (t > HIT) { const k = 1 - smooth(END - 0.8, END, t); p.line(SX + 90, 0, TX + 40, 0, hex("#06020a"), k); p.line(SX + 90, -1, TX + 40, -1, LT[3], k * (1 - smooth(HIT, HIT + 1.2, t))); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 24);
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: RISE, label: "INDRA", head: b.head, dx: -12 });
      drawBadge(p, t, { kind: "sasukeEMS", t0: EYE + 0.08, t1: RISE, label: "", head: b.head, dx: 10 });
      drawGlint(p, t, "sasukeEMS", RISE, END - 0.4, b.head);
      drawPerfect(p, { ...S(t), layer: "front" });
      // the orb of lightning in the right hand, and the arrow growing out of it along the string
      if (t > GRAB - 0.2 && t < LOOSE) {
        const { H, a } = arrowLine(t), g = smooth(GRAB, DRAWN, t), L = 25 + 105 * g;
        p.glow(H[0], H[1], 18 + 20 * g, LT[3], 0.8);
        p.circle(H[0], H[1], 6 + 4 * g, LT[4]);
        p.circle(H[0], H[1], 3 + 2 * g, WHITE);
        if (t > GRAB) arrow(p, H[0] + Math.cos(a) * L, H[1] + Math.sin(a) * L, a, L, f, smooth(GRAB, GRAB + 0.15, t));
        // lightning pulled in from every edge of the frame, more as the draw deepens; the frame strobing
        const mid = [H[0] + Math.cos(a) * L * 0.6, H[1] + Math.sin(a) * L * 0.6];
        for (let i = 0; i < 2 + Math.floor(g * 7); i++) { const ang = rand(f, i) * TAU, d = 140 + rand(f, i + 9) * 80; bolt(p, mid[0] + Math.cos(ang) * d, mid[1] + Math.sin(ang) * d * 0.7, mid[0], mid[1], f + i, LT, { jag: 0.2, seed: i, glow: 0.25 * g }); }
        if (g > 0.6 && f % 3 === 0) p.glow(mid[0], mid[1], 190, LT[3], 0.35 * g);
      }
      // the flight: a few frames, the arrow tearing down the line to the target, lightning in its wake
      if (t >= LOOSE && t < HIT + 0.45) {
        const { a } = arrowLine(LOOSE - 0.001), A0 = arrowLine(LOOSE - 0.001), sx = A0.H[0] + Math.cos(a) * 130, sy = A0.H[1] + Math.sin(a) * 130, u = clamp((t - LOOSE) / FLY), k = 1 - smooth(HIT + 0.1, HIT + 0.45, t);
        const x = sx + (TX - sx) * u, y = sy + (-24 - sy) * u;
        p.glowLine(sx, sy, x, y, 40, LT[3], 0.8 * k);
        p.beam(sx, sy, x, y, 14 * k + 2, LT[2], k);
        p.beam(sx, sy, x, y, 6 * k + 1, WHITE, k);
        for (let i = 0; i < 5; i++) bolt(p, sx, sy + (rand(f, i) - 0.5) * 40, x, y + (rand(f, i + 4) - 0.5) * 50, f + i, LT, { jag: 0.18, seed: i + 20, glow: 0, core: WHITE });
        if (u < 1) arrow(p, x, y, a, 100, f, 1, 1.6);
      }
      // the pillar of lightning standing up out of the target, two frames of ink, then the flood of light fading
      if (t > HIT && t < HIT + 1.3) {
        const u = (t - HIT) / 1.3, k = 1 - smooth(0.5, 1, u), w = 19 + 25 * ease.outCubic(Math.min(1, u * 3));
        p.glow(TX, -93, 160, LT[3], 0.8 * k);
        p.shade(TX - w - 20, -260, TX + w + 20, 2, (x, y, out) => { const d = Math.abs(x - TX) / (w * (0.7 + 0.3 * noise2(y * 0.04 - t * 9, 2, 5))); if (d > 1) return; out.a = k; out.k = 0.35; return d < 0.35 ? WHITE : d < 0.7 ? LT[4] : LT[3]; });
        for (let i = 0; i < 6; i++) bolt(p, TX + (rand(f, i) - 0.5) * 38, 0, TX + (rand(f, i + 7) - 0.5) * 124, -236 + rand(f, i + 3) * 50, f + i, LT, { jag: 0.22, seed: i, glow: 0.3 * k });
      }
      if (t >= HIT && t < HIT + 0.05) impactFrame(p, -110, -244, 350, 26, TX, -26, false, 21, { style: "bolts", ink: hex("#04081a"), paper: hex("#e8faff") });
      else if (t >= HIT + 0.05 && t < HIT + 0.1) impactFrame(p, -110, -244, 350, 26, TX, -26, true, 22, { style: "bolts", ink: hex("#04081a"), paper: hex("#e8faff") });
      else if (t >= HIT + 0.1 && t < HIT + 0.5) veil(p, -110, -244, 350, 26, LT[3], 0.5 * (1 - (t - HIT - 0.1) / 0.4));
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

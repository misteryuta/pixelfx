// Complete Body Susanoo: the stroke that bisects mountains (Madara). Narutopedia: Madara's Susanoo is dark blue; in its
// Complete Body form it has a long tengu nose, two lines down from its mouth, hair tied up at the sides, wings, robes
// and ornate armour, and wields katana with sheaths held in its secondary arms; one stroke of its sword cleanly
// bisected several mountains from far away. After the anime (the reference clips): the armour a lattice of plates over a
// striped hakama, a round crest on the belt, blue chakra flames pouring off its back like wings; it draws the long
// straight katana from the sheath at its hip, lifts it high, and cuts across the whole landscape: the screen goes white
// and cyan, a ring cut runs through the valley, and the tops of the mountains slide off along the cut and blow apart.
// Here: his eyes; Madara rises and the Susanoo forms round him in one surge (a pillar of blue chakra, the giant
// shimmering into being, the flame wings unfurling); its hand crosses to the hilt at its hip and draws the katana out
// in one long pull; lifts it high over its head; winds back over its shoulder; and cuts, the blade's chakra lengthening
// as it sweeps through the target and on toward the horizon; whiteout; the cut glowing across the mountains; the
// peaks slide off and burst in white. Smooth: the arm, the blade and the lean all follow Hermite keys.
// New: the Complete Body Susanoo (from _perfect.js), the draw from the sheath, the extending stroke and its smear, the
// cut mountains. From _lib: blast; from _taijutsu: shots (the camera).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, blast, veil } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { keyTrack } from "./_susanoo.js";
import { shots } from "./_taijutsu.js";
import { drawPerfect, perfectPuppet, PERFECT } from "./_perfect.js";

const EYE = 0.05, RISE = 0.55, FORM0 = 0.7, FORMED = 1.6, REACH = 1.85, GRIP = 2.1, DRAWN = 2.6, HIGH = 3.1, WIND = 3.5, CUT = 3.68, HIT = 3.76;
const FALL = HIT + 0.8, REST = HIT + 2.2, FADE = REST + 0.5, END = FADE + 0.9, TX = 270, G = 0.62;
const C = PERFECT.madara, MTN = ["#0c0a16", "#16122a", "#221c3c", "#302852", "#463c70"].map(hex), WH = ["#dff6ff", "#9fe6ff", "#4ac8f0"].map(hex);
const SX = 6;
// the far mountains: [x, peak height, half width]; the cut runs across them at CUTY(x)
const PEAKS = [[205, 93, 50], [280, 118, 59], [354, 99, 53], [400, 74, 37]];
const BASE = -18, CUTY = (x) => -67 + (x - 205) * 0.06;

// the Susanoo's motion: its near (sword) hand, the blade's angle and length, the far hand, the lean
const K = keyTrack([
  [0, { nx: 70, ny: -150, ba: 0.6, bl: 0, fx: -70, fy: -128, lean: 0 }],
  [FORMED, { nx: 70, ny: -150, ba: 0.6, bl: 0, fx: -70, fy: -128, lean: 0 }],
  // across the body to the hilt at the left hip
  [REACH, { nx: 10, ny: -150, ba: 0.55, bl: 0, lean: 0.04 }],
  [GRIP, { nx: -40, ny: -132, ba: 0.55, bl: 0, lean: 0.06 }],
  // the long pull: the hand sweeps out and up, the blade sliding out of the sheath behind it
  [DRAWN, { nx: 60, ny: -220, ba: -0.35, bl: 230, lean: -0.02, fx: -60, fy: -150 }],
  // chambered: the hand pulled back level with the rear shoulder, the blade laid back flat behind it (ph: its heading
  // round the body, pi = straight back, 0 = straight at the target), the body turning away
  [HIGH, { nx: -20, ny: -232, ba: -2.72, bl: 240, ph: Math.PI, lean: -0.08 }],
  [WIND, { nx: -46, ny: -226, ba: -2.72, bl: 240, ph: Math.PI + 0.2, lean: -0.16, fx: -40, fy: -170 }],
  // the side cut: the arm sweeps round level in front of the body, the blade coming round toward us (short as it
  // points out of the screen), then out flat across the field, lengthening through the target and the far hills
  [CUT, { nx: 30, ny: -214, bl: 420, ph: Math.PI / 2 + 0.25, lean: 0.04 }],
  [HIT, { nx: 120, ny: -196, bl: 520, ph: 0, lean: 0.2, fx: -80, fy: -140 }],
  [HIT + 0.35, { nx: 136, ny: -190, bl: 500, ph: -0.45, lean: 0.22 }],
  [REST, { nx: 120, ny: -186, bl: 300, ph: -0.55, lean: 0.12 }],
  [FADE, { nx: 100, ny: -176, bl: 240, ph: -0.6, lean: 0.06 }],
]);
// the plane of the side cut: level round the body, dipping toward the front so that it runs through the target at
// chest height (TILT: its slope seen from the side); the blade's angle and visible length at heading ph
const TILT = 0.45;
const flatBlade = (k) => { const c = Math.cos(k.ph); return { a: Math.atan2(TILT * c, c), len: k.bl * Math.hypot(c, TILT * c) }; };
const bladeOf = (t) => { const k = K(t); if (t < HIGH) return { a: k.ba, len: k.bl }; const f = flatBlade(k), u = smooth(HIGH, HIGH + 0.25, t); return u >= 1 ? f : { a: k.ba + (f.a - k.ba) * u, len: k.bl + (f.len - k.bl) * u }; };
const form = (t) => smooth(FORM0, FORMED, t) * (1 - smooth(FADE, END - 0.15, t));

export const meta = {
  name: "Complete body Susanoo: the mountain-cutting stroke",
  desc: "Madara rises into his blue Complete Body Susanoo, its flame wings unfurling; it draws the long katana from the sheath at its hip, lifts it high, winds back and cuts across the landscape: whiteout, the cut glowing through the target and the far mountains, whose tops slide off and burst.",
  tags: ["jutsu", "madara", "susanoo", "complete-body", "mangekyou", "sword", "aoe", "ultimate", "one-shot"],
  size: [450, 270],
  origin: [110, 244],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#040c26", "#0a1f5c", "#1a44a8", "#3a74e0", "#86bcff", "#e6f2ff"], seed: 77 },
};

const CALM = { ...READY, crouch: 0, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 5, fbx: -5 };
const FLOAT = { ...CALM, x: SX - 3, y: -93, fx: 8, fy: -22, bx: -4, by: -18, ffx: 4, ffy: -6, fbx: -4, fby: -6, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE, CALM, "out"],
    [FORM0 + 0.5, FLOAT, "out"],
    [WIND, { ...FLOAT, lean: -4, fx: -2, fy: -30 }],
    [HIT, { ...FLOAT, lean: 6, fx: 14, fy: -22 }, "in"],
    [FADE, FLOAT],
    [END, { ...CALM, x: SX - 3, gait: false }, "in"],
  ],
  hits: [
    { t: RISE, stop: 0.06, shake: 0.3, amp: 2, target: false, sfx: "cast" },
    { t: FORMED - 0.1, stop: 0.05, shake: 0.6, amp: 3, target: false, sfx: "rumble" },
    { t: DRAWN, target: false, sfx: "parry" },
    { t: CUT - 0.05, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.24, shake: 1.0, amp: 7, push: 7, straw: 60, skin: "shock", shiver: 0.8, sfx: "heavy" },
    { t: FALL, shake: 1.4, amp: 4, target: false, sfx: "rumble" },
    { t: FALL + 0.5, stop: 0.05, shake: 1.0, amp: 4, target: false, sfx: "explosion" },
    { t: HIT + 0.8, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RISE, x: SX, n: 16, dir: -1 }, { t: RISE, x: SX, n: 16, dir: 1 }, { t: HIT, x: TX - 30, n: 18, dir: 1 }],
};

// the camera: close on him; out as the giant forms; on the hand at the hilt; up with the raised blade; wide for the
// cut; then out over the mountains as they fall
export const camera = shots([
  [0, { z: 2.4, x: SX + 6, y: -26 }],
  [RISE, { z: 2.1, x: SX + 6, y: -38 }],
  [FORMED, { z: 1.1, x: SX + 70, y: -106 }],
  [GRIP, { z: 1.7, x: SX - 6, y: -94, r: -2 }, "cut"],
  [DRAWN, { z: 1.45, x: SX + 25, y: -118, r: 1 }],
  [HIGH, { z: 1.05, x: SX + 75, y: -142, r: 0 }],
  [WIND, { z: 1.15, x: SX + 50, y: -142, r: -2 }],
  [CUT, { z: 1.0, x: 174, y: -106, r: 2 }, "cut"],
  [HIT + 0.3, { z: 1.0, x: 186, y: -100, r: 0 }],
  [FALL - 0.1, { z: 1.4, x: 292, y: -62 }, "cut"],
  [REST, { z: 1.2, x: 292, y: -68 }],
  [END, { z: 1.0, x: 186, y: -93 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  // the mountain tops after the cut: each slides down along the cut, turning, and bursts as it lands
  const slide = (t, i) => { const u = clamp((t - FALL - i * 0.12) / 1.0); return { u, dx: 19 * ease.inQuad(u), dy: 56 * ease.inCubic(u), rot: 0.28 * ease.inQuad(u) }; };
  const S = (t) => {
    const k = K(t);
    return { kind: "madara", x: SX, y: 0, s: G, t, form: form(t), near: [k.nx, k.ny], far: [k.fx, k.fy], farBend: -1, nearBend: 1, lean: k.lean, wings: smooth(FORMED - 0.4, FORMED + 0.4, t), sheath: true, blade: t > GRIP ? bladeOf(t) : null };
  };
  return {
    update(t, dt) {
      if (t > RISE && t < FADE && R.chance(40 * dt)) ps.spawn(P.EMBER, SX + R.range(-38, 38), -R.range(12, 160), R.range(-14, 14), -R.range(20, 60), R.range(0.4, 0.8), C[R.int(3, 5)]);
      if (t >= HIT) once("hit", () => { lights.add(TX, -26, 180, WH[0], 1, 0.5); for (let i = 0; i < 30; i++) { const a = R.range(-0.8, 0.6), s = R.range(80, 240); ps.spawn(P.STREAK, TX, -26, Math.cos(a) * s, Math.sin(a) * s, R.range(0.15, 0.35), R.chance(0.5) ? WHITE : WH[1]); } });
      PEAKS.forEach((_, i) => { if (t >= FALL + i * 0.12 + 0.85) once("land" + i, () => lights.add(PEAKS[i][0], BASE - 12, 130, WH[0], 1, 0.4)); });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the far mountains, the cut across them, the tops sliding off
      PEAKS.forEach(([px, h, w], i) => {
        const top = BASE - h, cy = CUTY(px), hc = w * clamp((cy - top) / (BASE - top));
        p.poly([[px - w, BASE], [px - hc, cy], [px + hc, cy], [px + w, BASE]], MTN[1 + (i % 2)]);
        p.poly([[px - w, BASE], [px - hc, cy], [px - hc * 0.2, cy], [px - w * 0.3, BASE]], MTN[3], 1);
        const sl = t > FALL ? slide(t, i) : { u: 0, dx: 0, dy: 0, rot: 0 }, cs = Math.cos(sl.rot), sn = Math.sin(sl.rot);
        const tri = [[px - hc, cy], [px, top], [px + hc, cy]].map(([x, y]) => [px + (x - px) * cs - (y - cy) * sn + sl.dx, cy + (x - px) * sn + (y - cy) * cs + sl.dy]);
        if (sl.u < 0.92) {
          p.poly(tri, MTN[2 + (i % 2)]);
          p.poly([tri[0], tri[1], [(tri[0][0] + tri[2][0]) / 2, tri[0][1]]], MTN[4]);
          p.tri(tri[1][0], tri[1][1], tri[1][0] - 5, tri[1][1] + 7, tri[1][0] + 5, tri[1][1] + 7, hex("#8a84a8"));
        }
        // the cut line glowing, from the stroke until the tops fall
        if (t > HIT && t < FALL + 0.6) { const k = 1 - smooth(FALL, FALL + 0.6, t); p.line(px - hc - 4, cy, px + hc + 4, cy, WH[0], k); p.glowLine(px - hc, cy, px + hc, cy, 8, WH[2], 0.6 * k); }
        // white blasts where each top lands
        blast(p, t - FALL - i * 0.12 - 0.85, { x: px + 16, y: BASE, R: 22, C: [hex("#0a1a30"), hex("#1a4a7a"), hex("#4a8ac0"), WH[2], WH[1], WH[0], WHITE], seed: 30 + i, layer: "back", smoke: [hex("#5a6a80"), hex("#8a9ab0"), hex("#c8d4e4")] });
      });
      // the pillar of chakra it forms out of
      if (t > RISE && t < FORMED + 0.2) {
        const k = smooth(RISE, RISE + 0.15, t) * (1 - smooth(FORMED - 0.2, FORMED + 0.2, t)), w = 15 + 37 * smooth(RISE, FORMED, t);
        p.shade(SX - w - 10, -205, SX + w + 10, 2, (x, y, out) => { const d = Math.abs(x - SX) / (w * (0.8 + 0.25 * noise2(y * 0.03 - t * 4, 1, 4))); if (d > 1) return; out.a = k; out.k = 0.3; return d > 0.8 ? C[4] : d > 0.4 ? C[3] : C[5]; });
      }
      drawPerfect(p, { ...S(t), layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "madara", t0: EYE, t1: RISE, label: "SUSANOO", head: b.head });
      drawGlint(p, t, "madara", RISE, END - 0.3, b.head);
      drawPerfect(p, { ...S(t), layer: "front" });
      // the stroke's smear: the band the blade swept over the last instants, white at its leading edge
      if (t > WIND + 0.05 && t < HIT + 0.3) {
        const fade = 1 - smooth(HIT + 0.05, HIT + 0.3, t), pts = [];
        for (let i = 0; i <= 14; i++) {
          const tt = t - i * 0.012, Bd = bladeOf(tt), Pp = perfectPuppet(S(tt)), H = Pp.hand, ba = Pp.angle ?? Bd.a, c = Math.cos(ba), s = Math.sin(ba), bl = Math.min(Bd.len * G, s > 0.05 ? (-2 - H[1]) / s : 1e9);
          pts.push([H[0] + c * bl, H[1] + s * bl, H[0] + c * bl * 0.35, H[1] + s * bl * 0.35]);
        }
        for (let i = 1; i < pts.length; i++) p.poly([[pts[i - 1][2], pts[i - 1][3]], [pts[i - 1][0], pts[i - 1][1]], [pts[i][0], pts[i][1]], [pts[i][2], pts[i][3]]], i < 3 ? WHITE : i < 7 ? WH[1] : C[4], (1 - i / 15) * fade);
      }
      // the cut's level ring: a flat ellipse in the plane of the side cut, round the hand, the swept part glowing
      if (t > WIND + 0.02 && t < HIT + 0.35) {
        const fade = 1 - smooth(HIT + 0.1, HIT + 0.35, t), P0 = perfectPuppet(S(t)), H = P0.hand, L = K(t).bl * G * 0.55, ca = Math.cos(Math.atan(TILT)), sa = Math.sin(Math.atan(TILT)), ph0 = K(t).ph;
        for (let q = Math.PI; q > ph0 - 0.01 && q > -0.6; q -= 0.04) {
          const ex = Math.cos(q) * L, ey = Math.sin(q) * L * 0.16, x = H[0] + ex * ca - ey * sa, y = H[1] + ex * sa + ey * ca, near = (q - ph0) < 0.5;
          p.dot(x, y, near ? WHITE : WH[1], fade * (near ? 1 : 0.55));
        }
      }
      // whiteout as the stroke lands: white, then a cyan wash, then the world back
      if (t >= HIT - 0.02 && t < HIT + 0.5) {
        const u = (t - HIT + 0.02) / 0.52;
        if (u < 0.18) p.rect(-120, -260, 600, 300, WHITE);
        else veil(p, -120, -260, 460, 30, WH[2], 0.7 * (1 - smooth(0.18, 1, u)));
      }
      // the ring cut through the valley: a flat ellipse of light racing out from the target along the ground
      if (t > HIT && t < HIT + 0.9) { const u = ease.outCubic((t - HIT) / 0.9); p.ellipse(TX, -2, 14 + 170 * u, 4 + 9 * u, (d) => (d > 0.86 ? WH[0] : d > 0.7 ? WH[2] : 0), 1 - u); }
      void rand; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

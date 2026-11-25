// Our own Susanoo pixel models (2026-11-25), drawn shape by shape on a bone rig, side view facing right (+x).
// Replaces the earlier sprites and the procedural ribs for the playable moves. Narutopedia (Susanoo):
//  - Itachi: armoured upper body, a hood, a long tengu nose, magatama earrings; the Sword of Totsuka in the primary
//    right hand, its sake jar in a second right hand growing from the right forearm; the Yata Mirror in the primary
//    left hand. Yellow in the manga; red armour and orange humanoid in the anime (we use the anime colours).
//  - Sasuke (Mangekyou, Kage Summit): armoured upper body like Itachi's but with demonic horns, a long chin
//    appendage, jagged teeth round the hood; the bow on the wrist of the left arm, arrows drawn from an orb in the
//    primary right hand. Dark blue in the manga, purple elsewhere (we use purple).
//  - Madara (Complete Body): dark blue; a helmet with a long tengu nose and two lines from the mouth to the chin,
//    hair tied up at the sides, wings, robes and ornate armour, katana and scabbard.
// Bones: root (feet / base) > pelvis > chest > neck > head; chest > shoulder > upper arm > forearm > hand, near (his
// right, toward the camera) and far; Itachi also a second near forearm and hand for the jar. Weapons hang on hands.
// pose: { [bone]: rot (radians, + = clockwise on screen), weapon params }. Without aura first (opts.aura = 0).
import { hex, mix, clamp, noise2 } from "../../core/index.js";

const H = (s) => hex(s);
export const SUSANOO2 = {
  itachi: { ol: H("#3a0806"), dk: H("#8a1a10"), base: H("#d0401a"), lt: H("#ff8a3a"), hi: H("#ffd8a0"), eye: H("#ffe060"), aura: H("#ff7a2a"), scale: 1 },
  sasuke: { ol: H("#14062a"), dk: H("#3e1670"), base: H("#6c32a8"), lt: H("#a874e0"), hi: H("#e8d0ff"), eye: H("#ffd8ff"), aura: H("#a060ff"), scale: 1 },
  madara: { ol: H("#050c22"), dk: H("#0e2a64"), base: H("#2652a8"), lt: H("#5a8ae0"), hi: H("#c0e0ff"), eye: H("#e8f4ff"), aura: H("#4aa0ff"), scale: 1 },
};

// the skeleton at rest (offsets in the parent's frame, y down), per kind
const SK = {
  armoured: {
    root: { p: null, o: [0, 0] }, pelvis: { p: "root", o: [0, -46] }, chest: { p: "pelvis", o: [2, -42] }, neck: { p: "chest", o: [6, -34] },
    head: { p: "neck", o: [2, -8] }, shN: { p: "chest", o: [8, -24] }, upN: { p: "shN", o: [0, 0] }, foreN: { p: "upN", o: [0, 34] },
    handN: { p: "foreN", o: [0, 30] }, shF: { p: "chest", o: [-6, -26] }, upF: { p: "shF", o: [0, 0] }, foreF: { p: "upF", o: [0, 34] },
    handF: { p: "foreF", o: [0, 30] }, fore2: { p: "foreN", o: [0, 12] }, hand2: { p: "fore2", o: [0, 22] },
  },
  complete: {
    root: { p: null, o: [0, 0] }, pelvis: { p: "root", o: [0, -92] }, chest: { p: "pelvis", o: [2, -52] }, neck: { p: "chest", o: [6, -40] },
    head: { p: "neck", o: [2, -10] }, shN: { p: "chest", o: [10, -30] }, upN: { p: "shN", o: [0, 0] }, foreN: { p: "upN", o: [0, 44] },
    handN: { p: "foreN", o: [0, 38] }, shF: { p: "chest", o: [-8, -32] }, upF: { p: "shF", o: [0, 0] }, foreF: { p: "upF", o: [0, 44] },
    handF: { p: "foreF", o: [0, 38] },
  },
};
const ORDER = ["root", "pelvis", "chest", "neck", "head", "shN", "upN", "foreN", "handN", "fore2", "hand2", "shF", "upF", "foreF", "handF"];

/** World transforms of every bone: { name: { x, y, a } } (a = absolute angle; local +y is "down the bone"). */
export function boneWorld(kind, x, y, pose = {}, s = 1, flip = false) {
  const sk = SK[kind === "madara" ? "complete" : "armoured"], W = {}, f = flip ? -1 : 1;
  for (const n of ORDER) {
    const b = sk[n];
    if (!b) continue;
    const P = b.p ? W[b.p] : { x, y, a: 0 };
    const c = Math.cos(P.a), sn = Math.sin(P.a), ox = b.o[0] * s * f, oy = b.o[1] * s;
    W[n] = { x: P.x + ox * c - oy * sn, y: P.y + ox * sn + oy * c, a: P.a + (pose[n] ?? 0) * f };
  }
  return W;
}
// a local point of a bone to the screen
export const at = (B, u, v, s = 1, flip = false) => { const c = Math.cos(B.a), n = Math.sin(B.a), f = flip ? -1 : 1; return [B.x + (u * s * f) * c - v * s * n, B.y + (u * s * f) * n + v * s * c]; };

// one shape: the outline colour, an inset fill, optional light along the top
function shape(p, B, pts, C, fill, s, flip, light = null, a = 1) {
  const P = pts.map(([u, v]) => at(B, u, v, s, flip));
  p.poly(P, C.ol, a);
  const cx = P.reduce((q, r) => q + r[0], 0) / P.length, cy = P.reduce((q, r) => q + r[1], 0) / P.length;
  const ins = P.map(([X, Y]) => { const dx = cx - X, dy = cy - Y, d = Math.hypot(dx, dy) || 1, k = Math.min(1.4, d * 0.5); return [X + (dx / d) * k, Y + (dy / d) * k]; });
  p.poly(ins, fill, a);
  if (light) p.poly(light.map(([u, v]) => at(B, u, v, s, flip)), C.lt, a);
}
const seg = (p, B, u0, v0, u1, v1, c, s, flip, w = 1, a = 1) => { const A = at(B, u0, v0, s, flip), Z = at(B, u1, v1, s, flip); if (w > 1) p.beam(A[0], A[1], Z[0], Z[1], w, c, a); else p.line(A[0], A[1], Z[0], Z[1], c, a); };

// ---- parts ----
function arm(p, W, side, C, s, flip, big) {
  const k = big ? 1.25 : 1;
  const up = W["up" + side], fo = W["fore" + side], ha = W["hand" + side];
  shape(p, up, [[-7 * k, -2], [7 * k, -2], [6 * k, 34 * k], [-6 * k, 34 * k]], C, C.dk, s, flip);
  // the shoulder guard: three layered plates hanging over the upper arm (sode), lacing between them
  for (let i = 2; i >= 0; i--) {
    const v = -10 * k + i * 7 * k, w = (13 + i * 1.5) * k;
    shape(p, up, [[-w, v], [w * 0.9, v - 3 * k], [w * 1.05, v + 6 * k], [-w * 1.05, v + 9 * k]], C, i === 0 ? C.base : C.dk, s, flip, i === 0 ? [[-w + 2, v + 1], [w * 0.8, v - 2 * k], [w * 0.85, v + 1 * k], [-w + 2, v + 3 * k]] : null);
  }
  shape(p, fo, [[-6 * k, 0], [6 * k, 0], [6 * k, 28 * k], [-5 * k, 30 * k]], C, C.base, s, flip);
  // the bracer band near the wrist
  seg(p, fo, -6 * k, 20 * k, 6 * k, 20 * k, C.lt, s, flip);
  shape(p, ha, [[-6 * k, -2], [6 * k, -2], [7 * k, 8 * k], [0, 11 * k], [-6 * k, 8 * k]], C, C.lt, s, flip);
}
function torsoArmoured(p, W, C, s, flip, horns) {
  const ch = W.chest, pe = W.pelvis;
  // the lower body is only chakra: a flame skirt down to the floor (drawn by the aura); here the base of the torso
  // the cape of the hood, falling from behind the head down the back
  shape(p, ch, [[-6, -46], [-30, -34], [-44, 0], [-40, 34], [-24, 44], [-18, 10], [-12, -30]], C, C.dk, s, flip);
  shape(p, pe, [[-24, -10], [18, -10], [22, 16], [0, 26], [-26, 18]], C, C.dk, s, flip);
  // the chest: wide at the shoulders, drawn in at the waist
  shape(p, ch, [[-24, -34], [6, -40], [28, -28], [30, -6], [20, 18], [14, 38], [-16, 40], [-22, 16], [-30, -10]], C, C.base, s, flip, [[-18, -32], [6, -36], [22, -28], [10, -24], [-12, -24]]);
  // the armour: a breast plate edge, bands down the belly
  seg(p, ch, 20, -20, 24, 0, C.lt, s, flip);
  for (let i = 0; i < 3; i++) seg(p, ch, -20, 4 + i * 11, 18, 2 + i * 11, C.dk, s, flip);
  void horns;
}
function headItachi(p, W, C, s, flip) {
  const h = W.head;
  shape(p, h, [[-28, 4], [-26, -24], [-12, -38], [-2, -44], [8, -36], [18, -18], [18, 4], [8, 18], [-16, 20]], C, C.base, s, flip, [[-22, -22], [-6, -38], [4, -34], [-10, -26]]);
  // the face under the hood, the long tengu nose, the eye slit, the magatama earring
  shape(p, h, [[4, -20], [16, -16], [18, 2], [8, 12], [2, 0]], C, C.lt, s, flip);
  shape(p, h, [[13, -11], [42, -6], [43, -4], [15, -2]], C, C.lt, s, flip);
  seg(p, h, 8, -14, 14, -13, C.eye, s, flip, 2);
  const m = at(h, -4, 18, s, flip); p.circle(m[0], m[1], 2.2 * s, C.hi); p.line(m[0], m[1], m[0] - 1 * s, m[1] + 3 * s, C.hi);
}
function headSasuke(p, W, C, s, flip) {
  const h = W.head;
  // horns first (behind the hood's top): two demonic horns curving forward
  for (const [u0, dv] of [[-10, 0], [-2, 3]]) shape(p, h, [[u0, -30 + dv], [u0 + 4, -48 + dv], [u0 + 16, -60 + dv], [u0 + 10, -46 + dv], [u0 + 8, -30 + dv]], C, C.dk, s, flip);
  shape(p, h, [[-24, 0], [-22, -26], [-4, -36], [12, -30], [18, -12], [16, 6], [6, 16], [-14, 16]], C, C.base, s, flip, [[-18, -24], [-4, -32], [8, -28], [-6, -22]]);
  shape(p, h, [[4, -20], [16, -16], [18, 2], [8, 12], [2, 0]], C, C.lt, s, flip);
  // the jagged teeth round the hood's opening, the grin, the long chin appendage
  for (let i = 0; i < 6; i++) { const v = -18 + i * 5.5; shape(p, h, [[3, v], [8, v + 2.5], [3, v + 5]], C, C.hi, s, flip); }
  seg(p, h, 8, 4, 16, 2, C.hi, s, flip);
  shape(p, h, [[6, 10], [10, 12], [8, 26], [4, 14]], C, C.dk, s, flip);
  seg(p, h, 9, -13, 15, -12, C.eye, s, flip, 2);
}
function headMadara(p, W, C, s, flip) {
  const h = W.head;
  // the hair tied up at the side, behind
  shape(p, h, [[-20, -10], [-38, -18], [-46, -6], [-40, 6], [-22, 4]], C, C.dk, s, flip);
  for (let i = 0; i < 3; i++) seg(p, h, -40, -10 + i * 6, -50, -14 + i * 8, C.ol, s, flip, 2);
  // the helmet, the long tengu nose, the two lines from the mouth to the chin, the eyes
  shape(p, h, [[-22, -4], [-20, -28], [0, -34], [14, -24], [18, -6], [14, 12], [-12, 14]], C, C.base, s, flip, [[-16, -26], [0, -30], [10, -24], [-6, -20]]);
  shape(p, h, [[12, -12], [46, -8], [47, -6], [14, -2]], C, C.lt, s, flip);
  seg(p, h, 8, 2, 8, 12, C.ol, s, flip); seg(p, h, 12, 2, 12, 11, C.ol, s, flip);
  seg(p, h, 7, -16, 14, -15, C.eye, s, flip, 2);
}
function bodyComplete(p, W, C, s, flip) {
  const pe = W.pelvis, ch = W.chest;
  // the robe: a long hakama to the ground in stripes
  shape(p, pe, [[-34, -6], [30, -6], [40, 88], [-44, 90]], C, C.dk, s, flip);
  for (let i = 0; i < 5; i++) seg(p, pe, -30 + i * 14, 0, -38 + i * 18, 88, C.ol, s, flip);
  // the belt with its round crest
  shape(p, pe, [[-34, -12], [30, -12], [30, 2], [-34, 2]], C, C.base, s, flip);
  const cr = at(pe, 22, -5, s, flip); p.circle(cr[0], cr[1], 5 * s, C.ol); p.circle(cr[0], cr[1], 3.5 * s, C.lt);
  // the chest: plated armour, broad
  shape(p, ch, [[-34, -38], [6, -44], [30, -30], [34, 4], [26, 40], [-30, 44], [-42, 4]], C, C.base, s, flip, [[-26, -36], [6, -40], [22, -30], [-18, -28]]);
  for (let i = 0; i < 4; i++) seg(p, ch, -32, -12 + i * 12, 28, -16 + i * 12, C.dk, s, flip);
}
function wings(p, W, C, s, flip, spread) {
  // flame-feathered wings off the back
  const ch = W.chest;
  for (let i = 0; i < 6; i++) {
    const a0 = -2.4 + i * 0.22 - spread * 0.3, L = (70 - i * 6) * (0.6 + 0.4 * spread);
    const b = at(ch, -18, -20, s, flip), e = [b[0] + Math.cos(a0) * L * s * (flip ? -1 : 1), b[1] + Math.sin(a0) * L * s];
    p.beam(b[0], b[1], e[0], e[1], 7 * s, C.ol);
    p.beam(b[0], b[1], e[0], e[1], 4.5 * s, i % 2 ? C.dk : C.base);
  }
}

// ---- weapons ----
/** Itachi's Totsuka: the liquid blade out of the hand along angle ang (world), length L. */
export function totsuka(p, W, C, s, flip, ang, L, t) {
  const h = W.handN, [x, y] = at(h, 0, 6, s, flip), dx = Math.cos(ang), dy = Math.sin(ang);
  if (L < 1) return { base: [x, y], tip: [x, y] };
  const tip = [x + dx * L * s, y + dy * L * s];
  p.beam(x, y, tip[0], tip[1], 5 * s, C.hi);
  p.beam(x, y, tip[0], tip[1], 2.4 * s, 0xffffffff);
  for (let i = 6; i < L; i += 4) { const k = i / L, ox = -dy * (3 + 2 * noise2(i, t * 9, 5)) * s; p.px(x + dx * i * s + ox, y + dy * i * s - dx * 3 * s, C.lt); }
  return { base: [x, y], tip };
}
/** The sake jar in the second near hand. */
export function jar(p, W, C, s, flip) {
  const h = W.hand2; if (!h) return null;
  const [x, y] = at(h, 0, 8, s, flip), J = ["#5a2410", "#9a4a1c", "#d8823a", "#ffc070"].map(hex);
  p.circle(x, y + 4 * s, 8 * s, J[0]); p.circle(x, y + 4 * s, 6.6 * s, J[1]); p.circle(x - 2 * s, y + 2 * s, 3 * s, J[2]);
  p.circle(x, y - 6 * s, 4.5 * s, J[0]); p.circle(x, y - 6 * s, 3.4 * s, J[1]); p.rect(x - 1.5 * s, y - 12 * s, 3 * s, 3 * s, J[0]);
  return [x, y - 12 * s];
}
/** The Yata Mirror on the far hand: an oval shield facing forward; k 0..1 a hit ripple, tint the answering nature. */
export function yata(p, W, C, s, flip, hit = 0, tint = null, push = 0) {
  const h = W.handF, [x, y] = at(h, 10 + push, 2, s, flip), rx = 9 * s, ry = 24 * s;
  p.ellipse(x, y, rx + 2 * s, ry + 2 * s, C.ol);
  p.ellipse(x, y, rx + 1 * s, ry + 1 * s, C.lt);
  p.ellipse(x, y, rx - 1 * s, ry - 1.5 * s, mix(C.base, 0xffffffff, 0.25));
  // the glass: a cool sheen, the answering nature when struck
  p.ellipse(x + 1 * s, y - 4 * s, rx * 0.5, ry * 0.55, C.hi, 0.6);
  if (tint && hit > 0) p.ellipse(x, y, rx, ry, tint, 0.7 * hit);
  if (hit > 0) p.arc(x, y, (1 - hit) * 26 * s + 4, 1, 0, Math.PI * 2, 0xffffffff, 0.8 * hit);
  return [x + rx * (flip ? -1 : 1), y];
}
/** Sasuke's bow on the far wrist, aimed along ang; draw 0..1 how far the string is pulled to the near hand. */
export function bow(p, W, C, s, flip, ang, drawN = null) {
  const h = W.handF, [x, y] = at(h, 0, 4, s, flip), nx = -Math.sin(ang), ny = Math.cos(ang), R = 40 * s;
  const ends = [-1, 1].map((k) => [x + nx * R * k - Math.cos(ang) * 14 * s, y + ny * R * k - Math.sin(ang) * 14 * s]);
  // the limb: an arc through the grip, bowed toward the target
  let prev = ends[0];
  for (let i = 1; i <= 12; i++) {
    const u = i / 12 * 2 - 1, bend = (1 - u * u) * 14 * s;
    const q = [x + nx * R * u - Math.cos(ang) * 14 * s + Math.cos(ang) * bend, y + ny * R * u - Math.sin(ang) * 14 * s + Math.sin(ang) * bend];
    p.beam(prev[0], prev[1], q[0], q[1], 4 * s, C.ol); p.beam(prev[0], prev[1], q[0], q[1], 2 * s, C.lt);
    prev = q;
  }
  const nock = drawN ?? [x - Math.cos(ang) * 14 * s, y - Math.sin(ang) * 14 * s];
  p.line(ends[0][0], ends[0][1], nock[0], nock[1], C.hi); p.line(ends[1][0], ends[1][1], nock[0], nock[1], C.hi);
  return { grip: [x, y], nock, ends };
}
/** Madara's katana in the near hand along ang, length L; and the scabbard at the far hip. */
export function katana(p, W, C, s, flip, ang, L) {
  const h = W.handN, [x, y] = at(h, 0, 6, s, flip), dx = Math.cos(ang), dy = Math.sin(ang);
  p.beam(x - dx * 10 * s, y - dy * 10 * s, x, y, 4 * s, C.ol);
  if (L <= 0) return { base: [x, y], tip: [x, y] };
  const tip = [x + dx * L * s, y + dy * L * s];
  p.beam(x, y, tip[0], tip[1], 4 * s, C.ol); p.beam(x, y, tip[0], tip[1], 2.2 * s, C.hi);
  p.line(x - dy * 3 * s, y + dx * 3 * s, x + dy * 3 * s, y - dx * 3 * s, C.lt);
  return { base: [x, y], tip };
}
export function scabbard(p, W, C, s, flip, ang = 2.7) {
  // at the far hip, pointing down and back; returns its mouth (where the blade leaves it)
  const pe = W.pelvis, [x, y] = at(pe, 18, -6, s, flip), f = flip ? -1 : 1, dx = Math.cos(ang) * f, dy = Math.sin(ang);
  const end = [x + dx * 110 * s, y + dy * 110 * s];
  p.beam(x, y, end[0], end[1], 6 * s, C.ol); p.beam(x, y, end[0], end[1], 3.5 * s, C.dk);
  p.circle(x, y, 3 * s, C.lt);
  return [x, y];
}

/**
 * Draw a Susanoo. o: { pose, s = 1, flip, form = 1 (0..1: materialising from the base up), aura = 1, t, extra(p, W)
 * called between far arm and body (things held behind), front(p, W) after everything }.
 * Returns the bone world transforms (for weapons and anchors).
 */
export function drawSusanoo2(p, kind, x, y, o = {}) {
  const C = SUSANOO2[kind], s = (o.s ?? 1) * C.scale, flip = !!o.flip, pose = o.pose ?? {}, form = o.form ?? 1, t = o.t ?? 0, aura = o.aura ?? 1;
  const W = boneWorld(kind, x, y, pose, s, flip), big = kind === "madara";
  const fa = form;
  if (fa <= 0) return W;
  // the chakra behind the outline (drawn first so it sits behind): a glow and licking tongues round the silhouette
  if (aura > 0) {
    const ch = W.chest;
    if (!big) for (let i = 0; i < 9; i++) {
      // the flame skirt that is its lower body
      const u = i / 8 - 0.5, bx = W.pelvis.x + u * 60 * s, by = y, hh = (26 + 10 * noise2(i, t * 3, 2)) * s;
      // a solid tongue of flame (no half-transparent dither): wide at the floor, licking up to a point that sways
      const sw = Math.sin(t * 5 + i * 1.7) * 4 * s;
      p.poly([[bx - 6 * s, by], [bx + 6 * s, by], [bx + sw, by - hh]], i % 2 ? C.aura : C.base);
      p.poly([[bx - 2.5 * s, by], [bx + 2.5 * s, by], [bx + sw * 0.8, by - hh * 0.6]], C.hi);
    }
  }
  // materialising: the whole model fades in (p.fade multiplies every pixel's alpha)
  const pf = p.fade ?? 1;
  p.fade = pf * clamp(fa * 1.2);
  {
    if (big) wings(p, W, C, s, flip, o.wings ?? 1);
    arm(p, W, "F", C, s, flip, big);
    if (o.extra) o.extra(p, W, C, s, flip);
    if (big) bodyComplete(p, W, C, s, flip); else torsoArmoured(p, W, C, s, flip, kind === "sasuke");
    if (kind === "itachi") headItachi(p, W, C, s, flip); else if (kind === "sasuke") headSasuke(p, W, C, s, flip); else headMadara(p, W, C, s, flip);
    if (kind === "itachi" && W.hand2) { shape(p, W.fore2, [[-4, 0], [4, 0], [4, 20], [-4, 20]], C, C.dk, s, flip); shape(p, W.hand2, [[-5, -2], [5, -2], [5, 7], [-5, 7]], C, C.lt, s, flip); }
    arm(p, W, "N", C, s, flip, big);
    if (o.front) o.front(p, W, C, s, flip);
  }
  p.fade = pf;
  return W;
}

/**
 * Two-bone IK for an arm (facing right, no flip): the rotations of the upper arm and forearm ("up"+side, "fore"+side)
 * that put the wrist (the hand bone's origin) on the screen point T, given the rest of the pose. elbow: +1 / -1 picks
 * which way the elbow bends. Returns the pose with those two set.
 */
export function ik(kind, x, y, pose, side, T, elbow = 1, s = 1) {
  const sk = SK[kind === "madara" ? "complete" : "armoured"], W = boneWorld(kind, x, y, pose, s, false);
  const S = W["sh" + side], L1 = sk["fore" + side].o[1] * s, L2 = sk["hand" + side].o[1] * s;
  const dx = T[0] - S.x, dy = T[1] - S.y, d = Math.max(4, Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01)), phi = Math.atan2(dy, dx);
  const c1 = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const th1 = phi + elbow * c1, ex = S.x + Math.cos(th1) * L1, ey = S.y + Math.sin(th1) * L1, th2 = Math.atan2(T[1] - ey, T[0] - ex);
  // a bone's local +y is its direction: world angle a with direction th means a = th - pi/2
  const up = th1 - Math.PI / 2 - S.a, fore = th2 - th1;
  return { ...pose, ["up" + side]: up, ["fore" + side]: fore };
}

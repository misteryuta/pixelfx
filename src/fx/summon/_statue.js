// The Demonic Statue of the Outer Path's rig (Gedo Mazo, 2026-11-27), ray-cast like the other summons
// (src/fx/summon/_quad.js), real side / front / back views. After Narutopedia's appearance section and the anime picture
// of its summoning (Anime Shippuden 173): a giant mummy-like humanoid, the body shaped like a robe, spike-like
// protrusions on its back, a blindfold over its (nine) eyes, shackles on wrists and ankles, a scroll bitten in its
// mouth held by two ropes from under the blindfold; summoned into battle the bit falls and the jaws gape, jagged
// teeth. Colours after the anime: a dull mauve grey.
// Coordinates: f forward, u up, r = its right; feet on u = 0; px at the 72 px fighters' scale.
import { Canvas, rotZ } from "./_quad.js";
export { Canvas };

const rgb = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const STATUE = { name: "Gedo Mazo", k: 1, skin: "#a8868e", skinD: "#7a5a64", spike: "#c4a2a8", band: "#d6d0cc", bandD: "#a8a29e", mouth: "#3a1420", teeth: "#f0ece4", iron: "#3a3a44", scroll: "#e8dcc0", rope: "#8a7050" };

function ik(a, b, l1, l2, pole) {
  const d = sub(b, a), D = Math.min(len(d), l1 + l2 - 0.01), ax = norm(d);
  const x = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const pp = norm(sub(pole, scl(ax, dot(pole, ax))));
  return add(add(a, scl(ax, x)), scl(pp, h));
}
export function statueMouth(S, P = {}) {
  const K = S.k, lean = P.lean ?? 0;
  return [(96 + 14 * lean) * K, (176 - 16 * lean) * K, 0];
}

// pose: { sink 0..1 (still under the ground: rising), mouth 0..1 (the bit fallen, the jaws open), lean 0..1 (forward,
//   loosing the dragon), breathe }
export function drawStatue(cv, S, pose = {}) {
  const P = { sink: 0, mouth: 0, lean: 0, breathe: 0, ...pose };
  const K = S.k, C = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === "string" && v[0] === "#").map(([n, v]) => [n, rgb(v)]));
  const opt = (g) => ({ clipGround: true, group: g });
  const dn = P.sink * 240 * K, lean = P.lean;
  const at = (v) => [v[0] * K, v[1] * K - dn, v[2] * K];
  // the robe-shaped lower body and the torso, leaning forward over its planted hands
  cv.ellipsoid(at([-10, 52, 0]), I3, [70 * K, 58 * K, 72 * K], (loc) => (Math.sin(loc[0] * 7 + loc[2] * 11 + loc[1] * 3) > 0.93 ? C.skinD : C.skin), opt(10));
  const chest = at([30 + 16 * lean, 128 - 8 * lean + P.breathe * 2, 0]);
  const tAx = norm(sub(chest, at([-10, 52, 0])));
  cv.ellipsoid(chest, [tAx, norm(cross([0, 0, 1], tAx)), [0, 0, 1]], [52 * K, 44 * K, 62 * K], (loc) => (Math.sin(loc[1] * 9 + loc[2] * 4) > 0.92 ? C.skinD : C.skin), opt(10));
  // the spikes: finger-like protrusions fanning out of its back and shoulders
  for (let i = 0; i < 11; i++) {
    const a = (i - 5) / 5, base = add(chest, [-28 * K, (18 + 10 * (1 - Math.abs(a))) * K, a * 48 * K]);
    const tip = add(base, [(-30 - 10 * Math.abs(a)) * K, (70 - 30 * Math.abs(a)) * K, a * 50 * K]);
    const mid = add(scl(add(base, tip), 0.5), [8 * K, 6 * K, 0]);
    cv.bone(base, mid, 11 * K, () => C.skin, opt(20 + i));
    cv.bone(mid, tip, 8 * K, (loc) => (loc[0] > 0.6 ? C.spike : C.skin), opt(20 + i));
  }
  // arms: long, down to the ground, long fingers, the shackles on the wrists (chains broken off)
  for (const s of [1, -1]) {
    const sh = add(chest, [10 * K, 20 * K, s * 56 * K]);
    const hand = at([110 + 10 * lean, 6, s * 80]);
    const el = ik(sh, hand, 74 * K, 78 * K, [-0.6, 0, s * 0.8]);
    cv.bone(sh, el, 17 * K, () => C.skin, opt(30));
    cv.bone(el, hand, 14 * K, (loc) => (loc[0] > 0.55 && loc[0] < 0.8 ? C.iron : C.skin), opt(31));
    cv.ellipsoid(hand, I3, [16 * K, 7 * K, 14 * K], () => C.skinD, opt(32));
    for (let c = -2; c <= 2; c++) cv.bone(add(hand, [10 * K, 0, c * 6 * K]), add(hand, [32 * K, -3 * K, c * 9 * K]), 3.2 * K, () => C.skin, { clipGround: false, group: 33 });
    // a broken chain link hanging from the cuff
    cv.bone(add(el, scl(sub(hand, el), 0.68)), add(add(el, scl(sub(hand, el), 0.68)), [0, -14 * K, s * 4 * K]), 2.6 * K, () => C.iron, opt(34));
  }
  // the head: forward on the torso, the blindfold round it, the jaws (open: a tall dark mouth with jagged teeth)
  const head = add(chest, [(52 + 10 * lean) * K, (40 - 6 * lean) * K, 0]);
  const hf = norm([1, -0.15 - 0.25 * lean, 0]), hu = norm(cross([0, 0, 1], hf)), hs = [0, 0, 1];
  const H = (a, b, c) => add(head, add(add(scl(hf, a * K), scl(hu, b * K)), scl(hs, c * K)));
  cv.bone(chest, head, 30 * K, () => C.skin, opt(40));
  cv.ellipsoid(head, [hf, hu, hs], [40 * K, 46 * K, 42 * K], (loc, n, hit) => {
    const r = sub(hit, head), u = dot(r, hu) / K, f = dot(r, hf) / K;
    if (u > 8 && u < 26) return (Math.floor((u + f * 0.2) / 4) % 2) ? C.band : C.bandD; // the blindfold
    return C.skin;
  }, opt(41));
  // the nine eye holes in the blindfold (closed: dark slits), three rows of three
  for (let row = 0; row < 3; row++) for (let col = -1; col <= 1; col++) {
    const e = H(Math.sqrt(Math.max(0, 1 - (col * 0.45) ** 2)) * 39, 11 + row * 6, col * 17), en = norm(add(hf, scl(hs, col * 0.45)));
    cv.decal(e, "#4a3a40", 2, en);
  }
  const mo = P.mouth;
  if (mo > 0.1) {
    cv.ellipsoid(H(36, -16 - 8 * mo, 0), [hf, hu, hs], [10 * K, (10 + 26 * mo) * K, 24 * K], () => C.mouth, opt(42));
    for (let t = -3; t <= 3; t++) {
      cv.bone(H(40, -4, t * 6.5), H(42, -12 - 4 * mo, t * 7), 2.4 * K, () => C.teeth, opt(43));
      cv.bone(H(40, -28 - 34 * mo, t * 6.5), H(42, -20 - 26 * mo, t * 7), 2.4 * K, () => C.teeth, opt(43));
    }
  } else {
    // the scroll bitten in the mouth, the ropes up to the blindfold
    cv.bone(H(40, -14, -24), H(40, -14, 24), 5.5 * K, (loc) => (Math.abs(loc[0]) > 0.85 ? C.rope : C.scroll), opt(42));
    for (const s of [1, -1]) cv.bone(H(36, -14, s * 24), H(14, 12, s * 40), 1.8 * K, () => C.rope, opt(43));
  }
  return { head, mouth: H(44, -16 - 8 * mo, 0) };
}

// Kurama's rig (the Nine-Tails, 2026-11-27), ray-cast like the other summons (src/fx/summon/_quad.js), real side /
// front / back views. After Narutopedia's appearance section: a red-orange fox with black fur round its red eyes that
// stretches up to its ears, nine long swiping tails, the upper body of a human with clawed hands (opposable thumbs).
// Under Madara's Sharingan (Valley of the End, Manga 620-626) its eyes show the Sharingan's red with tomoe.
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

export const KURAMA = { name: "Kurama", k: 1, fur: "#e0621a", furD: "#a8400e", furL: "#f08a3a", mark: "#1e1418", claw: "#1a1416", eye: "#e8241c", mouth: "#5a1410", teeth: "#f4f0e8" };

function ik(a, b, l1, l2, pole) {
  const d = sub(b, a), D = Math.min(len(d), l1 + l2 - 0.01), ax = norm(d);
  const x = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const pp = norm(sub(pole, scl(ax, dot(pole, ax))));
  return add(add(a, scl(ax, x)), scl(pp, h));
}

// where the mouth is for a pose (the Tailed Beast Ball forms in front of it)
export function foxMouth(S, P = {}) {
  const K = S.k, cr = P.crouch ?? 0;
  return [(178 + 10 * cr) * K, (150 - 34 * cr) * K, 0];
}

// pose: { crouch 0..1 (down on all fours, head forward: to fire), mouth 0..1, tails (phase of the tails' sway),
//   recoil 0..1, sharingan (eyes) }
export function drawFox(cv, S, pose = {}) {
  const P = { crouch: 0, mouth: 0, tails: 0, recoil: 0, sharingan: 1, ...pose };
  const K = S.k, C = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === "string" && v[0] === "#").map(([n, v]) => [n, rgb(v)]));
  const opt = (g) => ({ clipGround: true, group: g });
  const cr = P.crouch, rc = P.recoil;
  // hips low and behind, the chest up and forward (half upright), lower when it crouches to fire
  const hip = [-50 * K, 78 * K, 0];
  const chest = [(46 + 10 * cr - 14 * rc) * K, (150 - 44 * cr + 10 * rc) * K, 0];
  const tAx = norm(sub(chest, hip)), tUp = norm(cross([0, 0, 1], tAx));
  const furMat = (loc) => (loc[1] < -0.55 ? C.furD : C.fur);
  cv.ellipsoid(add(hip, scl(sub(chest, hip), 0.45)), [tAx, tUp, [0, 0, 1]], [len(sub(chest, hip)) / 2 + 26 * K, 46 * K, 52 * K], furMat, opt(10));
  cv.ellipsoid(chest, [tAx, tUp, [0, 0, 1]], [42 * K, 48 * K, 56 * K], furMat, opt(10));
  cv.ellipsoid(hip, I3, [46 * K, 44 * K, 50 * K], furMat, opt(10));
  // hind legs: crouched, big thighs, black claws
  for (const s of [1, -1]) {
    const h = add(hip, [6 * K, -14 * K, s * 40 * K]), foot = [-18 * K, 6 * K, s * 60 * K];
    const knee = ik(h, foot, 50 * K, 46 * K, [1, 0.2, s * 0.4]);
    cv.bone(h, knee, 22 * K, () => C.fur, opt(20));
    cv.bone(knee, foot, 15 * K, () => C.fur, opt(21));
    cv.ellipsoid(add(foot, [10 * K, 0, 0]), I3, [22 * K, 9 * K, 15 * K], () => C.furD, opt(22));
    for (let c = -1; c <= 1; c++) cv.bone(add(foot, [26 * K, 2 * K, c * 8 * K]), add(foot, [40 * K, -2 * K, c * 10 * K]), 3.4 * K, () => C.claw, { clipGround: false, group: 23 });
  }
  // arms: human-like, clawed hands planted in front (on all fours) or resting on the ground
  for (const s of [1, -1]) {
    const sh = add(chest, [4 * K, 6 * K, s * 46 * K]);
    const hand = [(96 + 30 * cr) * K, 8 * K, s * (58 + 10 * cr) * K];
    const el = ik(sh, hand, 52 * K, 52 * K, [-0.8, 0, s * 0.6]);
    cv.bone(sh, el, 24 * K, () => C.fur, opt(30));
    cv.bone(el, hand, 19 * K, () => C.fur, opt(31));
    cv.ellipsoid(hand, I3, [17 * K, 9 * K, 15 * K], () => C.furD, opt(32));
    for (let c = -1.5; c <= 1.5; c++) cv.bone(add(hand, [12 * K, 0, c * 6 * K]), add(hand, [28 * K, -4 * K, c * 7 * K]), 3 * K, () => C.claw, { clipGround: false, group: 33 });
  }
  // nine tails: thick, long, fanned out behind and up, swaying
  for (let i = 0; i < 9; i++) {
    const a = (i - 4) / 4;                      // -1 .. 1 across the fan
    const base = add(hip, [-36 * K, 10 * K, a * 14 * K]);
    // a smooth, thick tail: many short overlapping pieces in one contour group, curling up and back, fanned out
    const pts = [], rads = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14, sw = Math.sin(P.tails * Math.PI * 2 + i * 0.7 + t * 2) * 12 * t;
      pts.push(add(base, [(-46 * t - 26 * t * t) * K, (34 * t + 120 * t * t * (1 - 0.45 * Math.abs(a))) * K, (a * 110 * Math.pow(t, 1.15) + sw) * K]));
      rads.push((17 + 7 * Math.sin(t * Math.PI) - 9 * t) * K);
    }
    // each piece spans two steps, so neighbours overlap deeply and the tail reads as one smooth tube
    for (let k = 1; k < pts.length; k++) {
      const a0 = pts[Math.max(0, k - 2)], b0 = pts[Math.min(pts.length - 1, k + 1)], t = k / 14;
      cv.bone(a0, b0, rads[k] * 0.92, () => (t > 0.86 ? C.furL : C.fur), opt(40 + i));
    }
  }
  // the neck and the head: long ears, the black markings round the eyes up to the ears, a muzzle, the jaw
  const head = add(chest, [(58 + 16 * cr) * K, (34 - 8 * cr) * K, 0]);
  const hf = norm([1, -0.2 - 0.2 * cr, 0]), hu = norm(cross([0, 0, 1], hf)), hs = [0, 0, 1];
  const H = (a, b, c) => add(head, add(add(scl(hf, a * K), scl(hu, b * K)), scl(hs, c * K)));
  cv.bone(chest, head, 30 * K, () => C.fur, opt(50));
  cv.ellipsoid(head, [hf, hu, hs], [46 * K, 40 * K, 46 * K], (loc, n, hit) => {
    const r = sub(hit, head), f = dot(r, hf) / K, u = dot(r, hu) / K, s = dot(r, hs) / K;
    // the black marking: a band from each eye up toward the ear
    if (f > 0 && Math.abs(Math.abs(s) - (21 + u * 0.35)) < 8 && u > -2 && u < 32) return C.mark;
    return C.fur;
  }, opt(51));
  // the muzzle and the jaw (opens to eat the ball, to fire)
  cv.ellipsoid(H(42, -12, 0), [hf, hu, hs], [30 * K, 15 * K, 20 * K], () => C.fur, opt(52));
  cv.ellipsoid(H(70, -9, 0), [hf, hu, hs], [5 * K, 5 * K, 6 * K], () => C.mark, opt(53));
  const jawDrop = 18 * P.mouth;
  if (P.mouth > 0.05) cv.ellipsoid(H(46, -26 - jawDrop * 0.4, 0), [hf, hu, hs], [24 * K, (5 + jawDrop * 0.6) * K, 17 * K], () => C.mouth, opt(54));
  cv.ellipsoid(H(38, -30 - jawDrop, 0), [hf, hu, hs], [27 * K, 8 * K, 17 * K], () => C.furD, opt(55));
  for (const s of [1, -1]) for (const f2 of [30, 48]) cv.bone(H(f2, -22, s * 11), H(f2 + 2, -27 - jawDrop * 0.3, s * 11), 2 * K, () => C.teeth, opt(56));
  // eyes: red; under the Sharingan, three black tomoe round a black pupil
  for (const s of [1, -1]) {
    const e = H(28, 12, s * 25), en = norm(add(hf, scl(hs, s * 0.7)));
    cv.ellipsoid(e, [hf, hu, hs], [7.5 * K, 5.5 * K, 7.5 * K], (loc, n) => (dot(n, en) > 0.45 ? C.eye : C.mark), opt(57));
    cv.decal(add(e, scl(en, 6.5 * K)), "#100808", 2, en);
    if (P.sharingan) for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; cv.decal(add(add(e, scl(en, 6.6 * K)), add(scl(hu, Math.sin(a) * 4 * K), scl(norm(cross(en, hu)), Math.cos(a) * 4 * K))), "#100808", 1, en); }
  }
  // ears: long, pointed, black inside
  for (const s of [1, -1]) {
    const b = H(-10, 32, s * 25), t = H(-28, 90, s * 36);
    cv.bone(b, t, 11 * K, (loc) => (loc[0] > 0.55 ? C.mark : C.fur), opt(58));
  }
  return { head };
}

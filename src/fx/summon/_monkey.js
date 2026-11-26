// Monkey King Enma's rig (2026-11-26), ray-cast like the other summons (src/fx/summon/_quad.js), real side / front /
// back views. After Narutopedia's appearance section: white fur on body and tail, showing at the sleeves and trouser
// ends; long unkempt white hair down the back, long sideburns and a goatee; a black(-olive) suit with mesh armour
// (wrists, ankles); a sleeveless kimono-shirt with white fur trim and tiger-stripe markings, closed by a red sash;
// the Konoha forehead protector. Brown face, hands and feet.
// Also the Adamantine Prison Wall (the lattice of staff clones: black bars, golden ends), drawn as two layers (the
// half behind the prisoner and the half in front of it).
// Coordinates: f forward, u up, r = his right; feet on u = 0; px at the 72 px fighters' scale.
import { Canvas, rotZ } from "./_quad.js";
export { Canvas };

const rgb = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const ENMA = {
  name: "Enma", k: 1,
  suit: "#56603a", suitD: "#3e4628", vest: "#d4a43a", stripe: "#4a3018", fur: "#f2eeea", furD: "#cfc8c4", sash: "#b8302c",
  skin: "#9a6440", skinD: "#6e4428", mesh: "#9ca0a8", band: "#2c3450", plate: "#c9cdd8", staff: "#24222a", gold: "#d8b048",
};

function ik(a, b, l1, l2, pole) {
  const d = sub(b, a), D = Math.min(len(d), l1 + l2 - 0.01), ax = norm(d);
  const x = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const pp = norm(sub(pole, scl(ax, dot(pole, ax))));
  return add(add(a, scl(ax, x)), scl(pp, h));
}

// pose: { crouch 0..1, lift (px off the ground), reach 0..1 (arms up, for the hop into Hiruzen's hand), breathe,
//   headYaw }
export function drawMonkey(cv, S, pose = {}) {
  const P = { crouch: 0.3, lift: 0, reach: 0, breathe: 0, headYaw: 0, ...pose };
  const K = S.k, C = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === "string" && v[0] === "#").map(([n, v]) => [n, rgb(v)]));
  const opt = (g) => ({ clipGround: P.lift <= 0, group: g });
  const lift = P.lift, drop = 8 * P.crouch * K - P.breathe * K;
  const hip = [-2 * K, 36 * K - drop + lift, 0];
  const lean = 0.22 + 0.25 * P.crouch - 0.35 * P.reach;
  const T = (v) => add(hip, rotZ(scl(v, K), -lean)); // torso frame: lean forward
  // ---- legs: a monkey's bent stance, feet planted wide
  for (const s of [1, -1]) {
    const h = add(hip, [0, 0, s * 7 * K]);
    const foot = lift > 0 ? add(h, [4 * K, -30 * K, s * 3 * K]) : [3 * K, 3 * K, s * 11 * K];
    const knee = ik(h, foot, 18 * K, 18 * K, [1, 0.2, s * 0.6]);
    cv.bone(h, knee, 6 * K, () => C.suit, opt(10));
    cv.bone(knee, foot, 5 * K, (loc) => (loc[0] > 0.45 ? C.mesh : C.suit), opt(11));
    cv.ellipsoid(add(foot, [1 * K, 2 * K, s * 1 * K]), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [3 * K, 4 * K, 3 * K], () => C.fur, opt(12));
    cv.ellipsoid(add(foot, [5 * K, -0.5 * K, 0]), I3, [7 * K, 2.6 * K, 4 * K], () => C.skin, opt(12));
  }
  // ---- tail: white, curling up behind
  const tb = T([-10, 2, 0]);
  let prev = tb;
  for (let i = 1; i <= 6; i++) { const a = i / 6, p = add(tb, [-10 * K * Math.sin(a * 1.6), 16 * K * a * a + 2 * K * a, 3 * K * Math.sin(a * 3)]); cv.bone(prev, p, (2.8 - a) * K, () => C.fur, opt(13)); prev = p; }
  // ---- torso: the suit, the vest with tiger stripes and fur trim, the red sash
  const chest = T([2, 18, 0]);
  const tAx = rotZ([1, 0, 0], -lean + Math.PI / 2), tUp = norm(sub(chest, hip));
  const tSide = [0, 0, 1], tFw = norm([tUp[1], -tUp[0], 0]);
  const torsoMat = (loc, n, hit) => {
    const r = sub(hit, hip), u = dot(r, tUp) / K, f = dot(r, tFw) / K, s = r[2] / K;
    if (u > 4 && u < 8.5) return Math.abs(s) < 3 && f > 0 ? C.sash : C.sash;        // the sash round the waist
    if (u >= 8.5 && u < 30) {
      // the vest: open at the front (the suit shows), fur along the opening and the arm holes, stripes on it
      const open = 2.5 + (u - 8.5) * 0.12;
      if (f > 4 && Math.abs(s) < open) return C.suit;
      if (f > 3 && Math.abs(s) < open + 2.2) return C.fur;
      if (u > 26) return C.fur;
      const st = Math.sin((u * 0.55 + s * 0.35 + (f < 0 ? 0.8 : 0)) * 1.3);
      return st > 0.72 ? C.stripe : C.vest;
    }
    return C.suit;
  };
  cv.ellipsoid(lerp3(hip, chest, 0.55), [tUp, tFw, tSide], [17 * K, 10 * K, 11 * K * (1 + 0.02 * P.breathe)], torsoMat, opt(20));
  // the sash's hanging end in front
  cv.bone(T([8, 5, 3]), T([12, -8, 4]), 2.2 * K, () => C.sash, opt(21));
  // ---- arms: sleeves (fur at the shoulder), mesh at the wrists, brown hands
  for (const s of [1, -1]) {
    const sh = add(chest, [0, 2 * K, s * 11 * K]);
    const hand = P.reach > 0 ? lerp3(add(sh, [8 * K, -18 * K, s * 3 * K]), add(sh, [10 * K, 20 * K, s * 2 * K]), P.reach) : add(sh, [9 * K, -17 * K, s * 4 * K]);
    const el = ik(sh, hand, 12 * K, 12 * K, [-0.6, -0.2, s]);
    cv.ellipsoid(sh, I3, [5.5 * K, 5 * K, 5.5 * K], () => C.fur, opt(30));
    cv.bone(sh, el, 4.4 * K, () => C.suit, opt(31));
    cv.bone(el, hand, 3.8 * K, (loc) => (loc[0] > 0.4 ? C.mesh : C.suit), opt(32));
    cv.ellipsoid(hand, I3, [3.6 * K, 3.6 * K, 3.6 * K], () => C.skin, opt(33));
  }
  // ---- head: brown face, the white mane down the back, sideburns and goatee, the forehead protector
  const neck = add(chest, rotZ([4 * K, 10 * K, 0], -lean * 0.5));
  const hc = add(neck, [2 * K, 7 * K, 0]);
  const hf = [Math.cos(P.headYaw), 0, -Math.sin(P.headYaw)], hu = [0, 1, 0], hs = norm([Math.sin(P.headYaw), 0, Math.cos(P.headYaw)]);
  const H = (a, b, c) => add(hc, add(add(scl(hf, a * K), scl(hu, b * K)), scl(hs, c * K)));
  // the mane: big, behind and above, falling down the back
  cv.ellipsoid(H(-9, 2, 0), [hf, hu, hs], [10 * K, 9.5 * K, 10 * K], () => C.fur, opt(40));
  cv.ellipsoid(H(-15, -9, 0), [hf, hu, hs], [8 * K, 13 * K, 9 * K], () => C.fur, opt(40));
  for (const [a, b, c, r] of [[-12, 10, 4, 4], [-7, 11, -5, 4], [-17, 5, -6, 4], [-19, -3, 6, 4], [-3, 10, 7, 3]]) cv.ellipsoid(H(a, b, c), [hf, hu, hs], [r * K, r * K, r * K], () => C.furD, opt(40));
  cv.ellipsoid(hc, [hf, hu, hs], [8 * K, 8.5 * K, 7.5 * K], (loc) => (loc[0] > -0.35 && loc[1] < 0.62 ? C.skin : C.fur), opt(41));
  // muzzle, sideburns, goatee
  cv.ellipsoid(H(6, -2, 0), [hf, hu, hs], [4 * K, 3.5 * K, 4.5 * K], () => C.skin, opt(42));
  for (const s of [1, -1]) cv.ellipsoid(H(1, -4, s * 6.5), [hf, hu, hs], [3.5 * K, 6 * K, 2.6 * K], () => C.fur, opt(43));
  cv.bone(H(5, -6, 0), H(6, -14, 0), 2.6 * K, () => C.fur, opt(43));
  // the forehead protector: a dark band round the head, the plate on the brow
  cv.ellipsoid(H(0, 4, 0), [hf, hu, hs], [8.4 * K, 2 * K, 7.9 * K], () => C.band, opt(44));
  cv.ellipsoid(H(7.6, 4, 0), [hf, hu, hs], [1.2 * K, 2.4 * K, 4.4 * K], () => C.plate, opt(45));
  cv.decal(H(8.8, 4, 0), "#5a5e70", 1, hf);
  // eyes and brows
  for (const s of [1, -1]) {
    const en = norm(add(hf, scl(hs, s * 0.35)));
    cv.decal(H(7.4, 0.8, s * 2.8), "#1a1418", 1, en);
    cv.decal(H(7.6, 2, s * 3.2), S.fur, 1, en);
  }
  cv.decal(H(9.6, -2.5, 0), "#3a2418", 1, hf);
  return { hand: null };
}

// The prison wall: a box of bars round a point (half size h, height ht, px), the posts dropping in and the bars
// sliding home (u 0..1). layer "back" = the far half (behind the prisoner), "front" = the near half.
export function drawCage(cv, S, pose = {}) {
  const u = pose.u ?? 1, layer = pose.layer ?? "front";
  const h = (pose.h ?? 3.4) / (10.7 / 72), ht = (pose.ht ?? 9) / (10.7 / 72);
  const C = { staff: rgb(S.staff), gold: rgb(S.gold) };
  const drop = Math.max(0, 1 - u / 0.5) * ht * 1.2, slide = Math.min(1, Math.max(0, (u - 0.45) / 0.55));
  const keep = (p) => (layer === "front" ? p[2] > 0.01 : p[2] <= 0.01);
  const opt = { clipGround: true, group: 5 };
  const bar = (a, b, r) => {
    // a bar split at z = 0 so each half lands in its own layer; golden ends past the corners
    const pieces = [];
    if ((a[2] > 0.01) === (b[2] > 0.01) || Math.abs(a[2] - b[2]) < 0.01) pieces.push([a, b]);
    else { const t = (0 - a[2]) / (b[2] - a[2]), m = lerp3(a, b, t); pieces.push([a, m], [m, b]); }
    for (const [p, q] of pieces) {
      const mid = scl(add(p, q), 0.5);
      if (!keep(mid)) continue;
      cv.bone(p, q, r, (loc) => ((p === a && loc[0] < -0.86) || (q === b && loc[0] > 0.86) ? C.gold : C.staff), opt);
    }
  };
  const posts = [];
  for (const x of [-h, 0, h]) for (const z of [-h, 0, h]) if (x !== 0 || z !== 0) if (Math.abs(x) === h || Math.abs(z) === h) posts.push([x, z]);
  for (const [x, z] of posts) {
    const a = [x, drop, z], b = [x, drop + ht + 6, z];
    if (!keep([x, 0, z])) continue;
    cv.bone(a, b, 2.6, (loc) => (loc[0] > 0.82 || loc[0] < -0.82 ? C.gold : C.staff), opt);
  }
  if (slide > 0) {
    const ext = 7, L = (h + ext) * slide;
    for (const y of [ht * 0.28, ht * 0.62, ht * 0.96]) {
      for (const s of [1, -1]) {
        bar([-L, y, s * h], [L, y, s * h], 2.3);          // front / back faces (x bars)
        bar([s * h, y + 3, -L], [s * h, y + 3, L], 2.3);  // side faces (z bars, a little higher, as they rest on top)
      }
    }
  }
}

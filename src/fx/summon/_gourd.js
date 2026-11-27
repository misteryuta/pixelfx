// The Gourd Toad's rig (Hyotan Gama, 2026-11-27), ray-cast like the other summons (src/fx/summon/_quad.js), real side /
// front / back views. After Narutopedia (Barrier: Toad Gourd Prison, the infobox picture "Hyotan Gama", Anime
// Shippuden 133): a small toad shaped like a gourd, magenta-red; a round head-bulb on a round belly-bulb with a green
// patterned band round the waist; two pointed ears; yellow eyes; dark chevrons on its limbs and back; long thin
// fingers; the gourd's stopper (marked with the character for sake) in its mouth.
// Coordinates: f forward, u up, r = its right; feet on u = 0; px at the 72 px fighters' scale.
import { Canvas } from "./_quad.js";
export { Canvas };

const rgb = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const GOURD = {
  name: "Hyotan Gama", k: 1,
  skin: "#c03a5a", skinD: "#8a2440", chev: "#6e1830", belly: "#d4607a", band: "#7aa058", bandD: "#4a6a38",
  eye: "#f0d040", cork: "#d8b878", corkD: "#9a7a48", ink: "#2a1418", tongue: "#e87890",
};

// where the mouth is (the tongue leaves from there)
export function gourdMouth(S, P = {}) {
  const K = S.k, lean = P.lean ?? 0;
  return [(12 + 6 * lean) * K, (44 - 4 * lean) * K, 0];
}

// pose: { mouth 0..1 (stopper out, mouth open), lean 0..1 (forward, shooting the tongue), swell 0..1 (belly full),
//   wobble (belly shake), breathe }
export function drawGourd(cv, S, pose = {}) {
  const P = { mouth: 0, lean: 0, swell: 0, wobble: 0, breathe: 0, ...pose };
  const K = S.k, C = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === "string" && v[0] === "#").map(([n, v]) => [n, rgb(v)]));
  const opt = (g) => ({ clipGround: true, group: g });
  const sw = 1 + 0.35 * P.swell + 0.05 * P.wobble;
  // the belly-bulb
  const bc = [0, 16 * K, 0];
  cv.ellipsoid(bc, I3, [16 * K * sw, 16 * K * sw, 17 * K * sw], (loc) => (loc[0] > 0.35 && loc[1] < 0.5 ? C.belly : (Math.abs(((loc[1] * 4 + Math.abs(loc[2]) * 2) % 1)) < 0.18 && loc[0] < 0.2 ? C.chev : C.skin)), opt(10));
  // the waist band (green, a pattern of dark marks)
  const wc = [0.5 * K, 30 * K, 0];
  cv.ellipsoid(wc, I3, [10.5 * K, 3 * K, 11 * K], (loc, n) => (Math.sin(Math.atan2(loc[2], loc[0]) * 6) > 0.55 ? C.bandD : C.band), opt(11));
  // the head-bulb, leaning forward when it shoots
  const hc = [(2 + 6 * P.lean) * K, (40 - 3 * P.lean + P.breathe) * K, 0];
  cv.ellipsoid(hc, I3, [12 * K, 12 * K, 13 * K], (loc) => (loc[0] > 0.5 && loc[1] < -0.2 ? C.belly : C.skin), opt(12));
  // the ears: two points on top
  for (const s of [1, -1]) cv.bone(add(hc, [-1 * K, 9 * K, s * 6 * K]), add(hc, [-3 * K, 17 * K, s * 9 * K]), 2.2 * K, () => C.skin, opt(13));
  // eyes: yellow, a dark rim, a black pupil
  for (const s of [1, -1]) {
    const e = add(hc, [9 * K, 4 * K, s * 6.5 * K]), en = norm([1, 0.2, s * 0.8]);
    cv.ellipsoid(e, I3, [3 * K, 3 * K, 3 * K], (loc, n) => (dot(n, en) > 0.75 ? [24, 16, 20] : dot(n, en) > 0.35 ? C.eye : C.skinD), opt(14));
  }
  // the mouth: the stopper sits in it; open, it is out and the mouth is dark
  const m = add(hc, [11 * K, -4 * K, 0]);
  if (P.mouth < 0.5) {
    cv.bone(m, add(m, [5 * K, 0, 0]), 3.6 * K, (loc) => (loc[0] > 0.5 ? C.cork : C.corkD), opt(15));
    cv.decal(add(m, [8.8 * K, 0, 0]), S.ink, 2, [1, 0, 0]);
  } else cv.ellipsoid(m, I3, [3 * K, 3.4 * K * P.mouth, 4.4 * K], () => [70, 20, 34], opt(15));
  // arms: thin, chevrons, long fingers resting on the belly / reaching when it leans
  for (const s of [1, -1]) {
    const sh = add(hc, [0, -8 * K, s * 10 * K]), el = [6 * K, 24 * K, s * 15 * K], hand = [(14 + 6 * P.lean) * K, 14 * K, s * 11 * K];
    cv.bone(sh, el, 2.4 * K, (loc) => (Math.sin((loc[0] + 1) * 8) > 0.6 ? C.chev : C.skin), opt(16));
    cv.bone(el, hand, 2.2 * K, (loc) => (Math.sin((loc[0] + 1) * 8) > 0.6 ? C.chev : C.skin), opt(16));
    for (let f = -1; f <= 1; f++) cv.bone(hand, add(hand, [5 * K, -4 * K, (s * 0.5 + f * 1.4) * K]), 0.9 * K, () => C.skin, opt(17));
  }
  // legs: folded under the belly, long toes splayed forward
  for (const s of [1, -1]) {
    const hip = [-6 * K, 10 * K, s * 12 * K], knee = [4 * K, 9 * K, s * 19 * K], ankle = [-4 * K, 2 * K, s * 17 * K];
    cv.bone(hip, knee, 4.6 * K, (loc) => (Math.sin((loc[0] + 1) * 7) > 0.6 ? C.chev : C.skin), opt(18));
    cv.bone(knee, ankle, 3 * K, () => C.skin, opt(18));
    for (let f = -1; f <= 1; f++) cv.bone(ankle, add(ankle, [9 * K, -1 * K, (s * 1 + f * 3) * K]), 1.1 * K, () => C.skinD, opt(19));
  }
  return { mouth: m };
}

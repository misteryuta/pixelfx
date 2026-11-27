// The Baku's rig (2026-11-27), Danzo's summon, ray-cast like the other summons (src/fx/summon/_quad.js), real side /
// front / back views. After Narutopedia's appearance section (Manga 479, Five Kage Summit): a gigantic elephantine
// chimera, mostly dark orange except its trunk, legs and the markings round its eyes; striped feet like a tiger's;
// huge tusks; something like a beard; long sharp claws; bandages wrapped round its head; plated armour at the base of
// the trunk. It inhales through the open mouth and at the same time blows out through the trunk.
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
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const BAKU = {
  name: "Baku", k: 1,
  body: "#d8661c", bodyD: "#a84a14", pale: "#ecd2a8", stripe: "#b85418", claw: "#1e1a1c",
  bandage: "#f0ece4", bandD: "#c8c2b8", armour: "#4c505c", armourD: "#2a2c34", tusk: "#f6f2e8", beard: "#f2dcb8", eye: "#5aa06a",
};

function ik(a, b, l1, l2, pole) {
  const d = sub(b, a), D = Math.min(len(d), l1 + l2 - 0.01), ax = norm(d);
  const x = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const pp = norm(sub(pole, scl(ax, dot(pole, ax))));
  return add(add(a, scl(ax, x)), scl(pp, h));
}

// the head's place and the trunk's tip for a pose (the game puts the suction cone at the mouth and the blast at the
// trunk's tip)
export function bakuPoints(S, P) {
  const K = S.k, br = P.brace ?? 0, lean = P.lean ?? 0;
  const head = [(124 - 10 * lean + 6 * br) * K, (86 - 20 * br + 6 * lean) * K, 0];
  return { head, mouth: add(head, [54 * K, -32 * K, 0]) };
}

// pose: { brace 0..1 (low, front legs splayed, claws in, head down), lean 0..1 (rocks back while it inhales),
//   mouth 0..1, trunkUp 0..1 (the trunk raised over the head, blowing), breathe }
export function drawBaku(cv, S, pose = {}) {
  const P = { brace: 0, lean: 0, mouth: 0, trunkUp: 0, breathe: 0, ...pose };
  const K = S.k, C = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === "string" && v[0] === "#").map(([n, v]) => [n, rgb(v)]));
  const opt = (g) => ({ clipGround: true, group: g });
  const br = P.brace, lean = P.lean;
  // the body: heavy, the back high behind the shoulders, sloping to the head
  const T = [(-6 - 6 * lean) * K, (104 - 16 * br + 2 * P.breathe) * K, 0];
  const bp = -0.12 - 0.1 * br + 0.08 * lean;
  const tAx = rotZ([1, 0, 0], bp), tUp = rotZ([0, 1, 0], bp);
  const bodyMat = (loc) => (loc[1] < -0.55 ? C.bodyD : C.body);
  cv.ellipsoid(T, [tAx, tUp, [0, 0, 1]], [86 * K, 56 * K, 62 * K], bodyMat, opt(10));
  cv.ellipsoid(add(T, [60 * K, -10 * K, 0]), [tAx, tUp, [0, 0, 1]], [46 * K, 50 * K, 58 * K], bodyMat, opt(10));
  // legs: pale with tiger stripes, black claws; front pair splays out and digs in when it braces
  const legMat = (loc) => (Math.sin((loc[0] + 1) * 7) > 0.8 ? C.stripe : C.pale);
  for (const [front, s] of [[1, 1], [1, -1], [0, 1], [0, -1]]) {
    const top = front ? add(T, [70 * K, -30 * K, s * 52 * K]) : add(T, [-70 * K, -26 * K, s * 52 * K]);
    const paw = front ? [(82 + 16 * br) * K, 6 * K, s * (66 + 20 * br) * K] : [-72 * K, 6 * K, s * 62 * K];
    const j = ik(top, paw, 46 * K, 48 * K, front ? [-0.6, 0, s * 0.6] : [0.7, 0, s * 0.3]);
    cv.bone(top, j, 21 * K, legMat, opt(20));
    cv.bone(j, paw, 16 * K, legMat, opt(21));
    cv.ellipsoid(add(paw, [4 * K, 0, 0]), I3, [20 * K, 9 * K, 18 * K], () => C.pale, opt(22));
    for (let c = -1; c <= 1; c++) {
      const cb = add(paw, [18 * K, 2 * K, c * 9 * K]), ct = add(cb, [(14 + 6 * br) * K, (-4 - 4 * br) * K, c * 3 * K]);
      cv.bone(cb, ct, 3.4 * K, () => C.claw, { clipGround: false, group: 23 });
    }
  }
  // tail: thin, a tuft at the end
  let prev = add(T, [-96 * K, 20 * K, 0]);
  for (let i = 1; i <= 6; i++) { const a = i / 6, p = add(add(T, [-96 * K, 20 * K, 0]), [-30 * K * a, 46 * K * Math.sin(a * 1.4), 0]); cv.bone(prev, p, 4 * K, () => C.body, opt(24)); prev = p; }
  cv.ellipsoid(prev, I3, [9 * K, 12 * K, 9 * K], () => C.bodyD, opt(24));
  // ---- the head: low and forward, the bandages wound round it, pale round the eyes
  const { head } = bakuPoints(S, P);
  const hf = norm([1, -0.15 - 0.2 * br, 0]), hu = norm(cross([0, 0, 1], hf)), hs = [0, 0, 1];
  const H = (a, b, c) => add(head, add(add(scl(hf, a * K), scl(hu, b * K)), scl(hs, c * K)));
  cv.bone(add(T, [62 * K, 10 * K, 0]), head, 42 * K, () => C.body, opt(30));
  cv.ellipsoid(head, [hf, hu, hs], [54 * K, 48 * K, 50 * K], (loc, n, hit) => {
    const r = sub(hit, head), f = dot(r, hf) / K, u = dot(r, hu) / K, s = dot(r, hs) / K;
    // the bandages: wound diagonally over the crown and the brow
    const band = u + Math.abs(s) * 0.25;
    if (band > 16 && band < 44 && f > -30) return (Math.floor((band + f * 0.3) / 5) % 2) ? C.bandage : C.bandD;
    if (f > 14 && Math.abs(Math.abs(s) - 24) < 11 && u > -8 && u < 15) return C.pale; // the markings round the eyes
    return f > 24 && u < -8 ? C.pale : C.body;
  }, opt(31));
  // eyes in the pale patches
  for (const s of [1, -1]) {
    const en = norm(add(hf, scl(hs, s * 0.6)));
    cv.decal(H(44, 5, s * 25), "#1a1418", 4, en);
    cv.decal(H(44.5, 6, s * 24), S.eye, 2, en);
  }
  // ears
  for (const s of [1, -1]) cv.ellipsoid(H(-18, 40, s * 42), [hf, hu, hs], [13 * K, 18 * K, 6 * K], (loc) => (loc[2] * s > 0 ? C.pale : C.body), opt(32));
  // the mouth: opens wide to inhale
  if (P.mouth > 0.05) cv.ellipsoid(H(44, -32, 0), [hf, hu, hs], [13 * K, (8 + 18 * P.mouth) * K, 28 * K], (loc) => (loc[1] < -0.5 ? [180, 70, 70] : [40, 16, 20]), opt(33));
  // the beard: pale tufts under the jaw
  for (const [a, b, c] of [[24, -46, 0], [16, -44, 18], [16, -44, -18], [6, -39, 31], [6, -39, -31]]) cv.ellipsoid(H(a, b - 8 * P.mouth, c), [hf, hu, hs], [13 * K, 11 * K, 10 * K], () => C.beard, opt(34));
  // the tusks: from the corners of the mouth, curving forward and up
  for (const s of [1, -1]) {
    let tp = H(40, -26, s * 28);
    for (let i = 1; i <= 5; i++) {
      const a = i / 5, q = H(40 + 42 * a, -26 - 14 * Math.sin(a * 2.2) + 32 * a * a, s * (28 + 10 * a));
      cv.bone(tp, q, (9 - 6 * a) * K, () => C.tusk, opt(35));
      tp = q;
    }
  }
  // the armour at the trunk's base: plates
  const tb = H(52, -8, 0);
  cv.ellipsoid(tb, [hf, hu, hs], [18 * K, 22 * K, 28 * K], (loc) => (Math.floor((loc[1] + 1) * 3.5) % 2 ? C.armour : C.armourD), opt(36));
  // the trunk: a chain hanging down and curling forward, or raised up over the head to blow
  let pt = add(tb, scl(hf, 8 * K));
  const n = 9;
  for (let i = 1; i <= n; i++) {
    const a = i / n;
    const down = add(add(tb, scl(hf, (14 + 40 * a) * K)), scl(hu, (-104 * a + 46 * a * a * a) * K));
    const up = add(add(tb, scl(hf, (26 - 12 * a * a) * K)), scl(hu, (118 * a) * K));
    const q = lerp3(down, up, P.trunkUp);
    cv.bone(pt, q, (16 - 8 * a) * K, (loc) => (Math.floor((a * 9 + loc[0]) * 1.5) % 2 ? C.pale : [214, 188, 150]), opt(37));
    pt = q;
  }
  return { trunkTip: pt, head };
}

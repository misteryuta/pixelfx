// Kamatari's rig (2026-11-26), ray-cast like the other summons (src/fx/summon/_quad.js), real side / front / back.
// After Narutopedia's appearance section and Anime 125: a giant white-furred weasel, a dark green eye-patch over his
// LEFT eye, a black vest with red trim tied with a yellow cord on the back, a long bushy tail, and a large sickle
// almost as long as himself (white-wrapped handle, golden fittings, a wide curved blade), held in the front paws.
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
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const KAMATARI = {
  name: "Kamatari", k: 1,
  fur: "#f2f0ec", furD: "#d4d0cc", nose: "#3a2c30", patch: "#3c5a40", vest: "#22202a", trim: "#c8343a", cord: "#e8c440",
  blade: "#d8dde6", bladeD: "#8e96a4", wrap: "#ece8dc", gold: "#d8b048", handle: "#5a4a3a",
};

// pose: { crouch 0..1, stretch 0..1 (the dash: body long, legs swept back, off the ground), lift (px),
//   swing (sickle angle round him, rad: 0 = raised over the head, pi/2 = forward, pi = down in front ...),
//   headYaw }
export function drawWeasel(cv, S, pose = {}) {
  const P = { crouch: 0.2, stretch: 0, lift: 0, swing: 0, headYaw: 0, ...pose };
  const K = S.k, C = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === "string" && v[0] === "#").map(([n, v]) => [n, rgb(v)]));
  const air = P.lift > 0 || P.stretch > 0.3;
  const opt = (g) => ({ clipGround: !air, group: g });
  const st = P.stretch;
  const bodyU = (20 - 5 * P.crouch + 4 * st) * K + P.lift;
  // the body: long, low; in the dash longer and level
  const hip = [-22 * K * (1 + 0.35 * st), bodyU + 2 * K * (1 - st), 0], sh = [18 * K * (1 + 0.25 * st), bodyU + (6 - 4 * st) * K, 0];
  const tAx = norm(sub(sh, hip)), tUp = norm(cross([0, 0, 1], tAx)), tc = scl(add(hip, sh), 0.5), L = len(sub(sh, hip));
  const local = (hit) => { const r = sub(hit, tc); return [dot(r, tAx) / K, dot(r, tUp) / K, r[2] / K]; };
  const bodyMat = (loc, n, hit) => {
    const [f, u, s] = local(hit);
    // the vest: over the back and flanks of the front two thirds; red trim at its edges; the yellow cord on top
    if (f > -L / K * 0.32 && f < L / K * 0.42 && u > -4) {
      if (f < -L / K * 0.26 || f > L / K * 0.36 || u < -1.5) return C.trim;
      if (u > 9 && Math.abs(s) < 2.5 && f > -4 && f < 4) return C.cord;
      return C.vest;
    }
    return u < -7 ? C.furD : C.fur;
  };
  cv.ellipsoid(tc, [tAx, tUp, [0, 0, 1]], [L / 2 + 12 * K, 12 * K, 12.5 * K], bodyMat, opt(10));
  // legs: short; in the dash the front pair reaches forward, the hind pair kicks back
  for (const [front, s, ph] of [[1, 1, 0], [1, -1, 0.5], [0, 1, 0.6], [0, -1, 0.1]]) {
    const base = front ? add(sh, [0, -6 * K, s * 8 * K]) : add(hip, [0, -6 * K, s * 8 * K]);
    let paw = front ? [sh[0] + 4 * K, 0, s * 9 * K] : [hip[0] - 2 * K, 0, s * 9 * K];
    if (air) paw = front ? add(base, [14 * K * (0.5 + st), -8 * K, s * 2 * K]) : add(base, [-16 * K * (0.5 + st), -6 * K, s * 2 * K]);
    paw[1] += P.lift > 0 && !air ? P.lift : 0;
    if (!air) paw[1] = 1.5 * K;
    const mid = add(lerp3(base, paw, 0.5), [front ? -2 * K : 3 * K, 0, 0]);
    cv.bone(base, mid, 4.6 * K, () => C.fur, opt(11));
    cv.bone(mid, paw, 3.6 * K, () => C.fur, opt(11));
    cv.ellipsoid(paw, I3, [4.4 * K, 2.4 * K, 3.6 * K], () => C.furD, opt(12));
  }
  // the bushy tail: long, curving up behind (streaming straight back in the dash)
  let prev = add(hip, [-8 * K, 2 * K, 0]);
  for (let i = 1; i <= 7; i++) {
    const a = i / 7, p = add(add(hip, [-8 * K, 2 * K, 0]), [-34 * K * a, (1 - st) * 22 * K * Math.sin(a * 1.5) + st * 2 * K * a, (1 - st) * 4 * K * Math.sin(a * 3)]);
    cv.bone(prev, p, (6 + 4 * Math.sin(a * Math.PI)) * K, () => (i === 7 ? C.furD : C.fur), opt(13));
    prev = p;
  }
  // head: small and round, a short muzzle, round ears; the green patch over his left eye (s < 0)
  const neck = add(sh, [8 * K, (6 - 4 * st) * K, 0]);
  const hc = add(neck, [6 * K, 4 * K, 0]);
  const hf = [Math.cos(P.headYaw), 0, -Math.sin(P.headYaw)], hu = [0, 1, 0], hs = norm(cross(hf, hu));
  const H = (a, b, c) => add(hc, add(add(scl(hf, a * K), scl(hu, b * K)), scl(hs, c * K)));
  cv.bone(sh, hc, 8 * K, () => C.fur, opt(20));
  cv.ellipsoid(hc, [hf, hu, hs], [12 * K, 10.5 * K, 11 * K], (loc, n, hit) => {
    const r = sub(hit, hc), f = dot(r, hf) / K, u = dot(r, hu) / K, s = dot(r, hs) / K;
    // the eye-patch: a band round the head over the left eye, a dark green cloth
    if (Math.abs(u - (2.5 - s * 0.25)) < 2.2 && f > -6) return C.patch;
    return C.fur;
  }, opt(21));
  cv.ellipsoid(H(10, -2.5, 0), [hf, hu, hs], [5.5 * K, 4 * K, 5 * K], () => C.fur, opt(22));
  cv.ellipsoid(H(15.2, -1.6, 0), [hf, hu, hs], [1.4 * K, 1.2 * K, 1.6 * K], () => C.nose, opt(23));
  for (const s of [1, -1]) cv.ellipsoid(H(-3, 9.5, s * 7), [hf, hu, hs], [2.6 * K, 3.2 * K, 2 * K], () => C.furD, opt(24));
  // his right eye (s > 0) shows: a dark bead
  cv.decal(H(10.2, 1.8, 5), "#1a1418", 2, norm(add(hf, scl(hs, 0.55))));
  // ---- the sickle: held in the front paws in front of the chest; swung round him (swing)
  const grip = add(sh, [10 * K, 2 * K, 9 * K]);
  const sw = P.swing;
  // the handle's direction in the plane f-u (round his side), length 50
  const hd = norm([Math.sin(sw), Math.cos(sw), 0.15]);
  const hEnd = add(grip, scl(hd, 46 * K)), hStart = add(grip, scl(hd, -10 * K));
  cv.bone(hStart, hEnd, 2.4 * K, (loc) => (loc[0] > 0.86 ? C.gold : Math.floor((loc[0] + 1) * 9) % 3 === 0 ? C.handle : C.wrap), opt(30));
  cv.ellipsoid(hEnd, I3, [3.4 * K, 3.4 * K, 3.4 * K], () => C.gold, opt(31));
  // the blade: from the top of the handle, curving back (a crescent of flat ellipsoids)
  const bd = norm(cross(hd, [0, 0, 1]));
  let pb = hEnd;
  for (let i = 1; i <= 6; i++) {
    const a = i / 6, ang = a * 1.5;
    const p = add(hEnd, add(scl(bd, Math.sin(ang) * 34 * K), scl(hd, (1 - Math.cos(ang)) * -14 * K + a * 4 * K)));
    const d = norm(sub(p, pb)), side = norm(cross(d, [0, 0, 1]));
    cv.ellipsoid(scl(add(p, pb), 0.5), [d, side, [0, 0, 1]], [len(sub(p, pb)) / 2 + 1, (6.5 - 4.5 * a) * K, 1.2 * K], (loc) => (loc[1] > 0.25 ? C.bladeD : C.blade), opt(32));
    pb = p;
  }
  // the paws on the handle
  for (const s of [0, 8]) cv.ellipsoid(add(grip, add(scl(hd, s * K), [0, 0, -2 * K])), I3, [3.6 * K, 3.4 * K, 3.6 * K], () => C.furD, opt(33));
  return {};
}

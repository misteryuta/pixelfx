// Katsuyu's rig (2026-11-26): a slug as a spine chain, ray-cast like the other summons (src/fx/summon/_quad.js), in
// real side / front / back views. After Narutopedia's appearance section and Anime 96 / Shippuden 159:
//   white body, three blue-green streaks (serrated edges) down the middle and the sides from the head, tapering off at
//   the tail; a pale underside (the foot); two optical tentacles on top of the head, grey-tinted, a ball at each tip;
//   two small sensory tentacles at the sides of the mouth; the front half rears up in an S, the head leaning forward.
// The spine is integrated from a bend profile: flat on the ground at the tail, rising toward the head (rear), the head
// tipping forward again; a body wave runs from the tail to the head (sideways sway and a swelling of the girth);
// 'divide' raises lumps along the body (the pieces about to come off).
// Coordinates: f forward, u up, r = her right; foot on u = 0; px at the 72 px fighters' scale.
import { Canvas } from "./_quad.js";
export { Canvas };

const rgb = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;

export const KATSUYU = { name: "Katsuyu", k: 1, L: 220, R: 36, body: "#eef2ee", foot: "#dcece6", stripe: "#2f8c7a", stalk: "#c3cccb", ink: "#2a3436" };
export const MINI = { ...KATSUYU, name: "Katsuyu (Teil)", k: 0.2 };

// the spine for a pose: points (tail -> head), radii, the head's tangent; also where the mouth is (for the acid)
export function slugSpine(S, P) {
  const K = S.k, N = 16, L = S.L * K, R = S.R * K, ds = L / (N - 1);
  const pts = [], rad = [];
  let x = 0, y = 0;
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1);
    let r = R * (0.32 + 0.68 * smooth(0, 0.42, s)) * (s > 0.86 ? 0.94 : 1);
    r *= 1 + 0.06 * (P.wave ?? 1) * Math.sin(TAU * (2 * s - P.phase));
    if (P.divide) r *= 1 + P.divide * 0.2 * Math.max(0, Math.sin(TAU * (3.5 * s - P.phase * 0.5)));
    rad.push(r);
    const th = P.rear * 1.5 * smooth(0.26, 0.6, s) - P.rear * (1.0 + (P.nod ?? 0)) * smooth(0.76, 1, s);
    if (i > 0) { x += Math.cos(th) * ds; y += Math.sin(th) * ds; }
    const z = (P.wave ?? 1) * 9 * K * Math.sin(TAU * (1.1 * s - P.phase)) * (1 - 0.85 * smooth(0.3, 0.9, s) * P.rear);
    pts.push([x, y, z, th]);
  }
  // the foot: the part of the body on the ground; centred on the anchor
  let gx = 0, gn = 0;
  for (let i = 0; i < N; i++) if (pts[i][3] < 0.25) { gx += pts[i][0]; gn++; }
  const off = gn ? gx / gn : pts[0][0];
  const out = pts.map(([px, py, pz], i) => [px - off + (P.shift ?? 0) * K, Math.max(rad[i] * 0.62 * (P.flat ?? 1), py + rad[i] * 0.62 * (P.flat ?? 1)), pz]);
  const hp = out[N - 1], t = norm(sub(out[N - 1], out[N - 2]));
  return { pts: out, rad, N, L, head: hp, tH: t, rH: rad[N - 1] };
}

// pose: { rear 0..1 (front half up), phase (the body wave), wave (its size), divide 0..1 (lumps), nod (head forward),
//   mouth 0..1, flat (squash, for a piece lying on someone), glow (green chakra tint 0..1), shift (px along f) }
export function drawSlug(cv, S, pose = {}) {
  const P = { rear: 0.85, phase: 0, wave: 1, divide: 0, mouth: 0, glow: 0, ...pose };
  const K = S.k, sp = slugSpine(S, P);
  const tint = (c) => (P.glow ? c.map((v, i) => Math.round(v + ([96, 236, 170][i] - v) * P.glow * 0.45)) : c);
  const C = { body: tint(rgb(S.body)), foot: tint(rgb(S.foot)), stripe: tint(rgb(S.stripe)), stalk: rgb(S.stalk) };
  const side = [0, 0, 1];
  const opt = (g) => ({ clipGround: true, group: g });
  const matFor = (a, b, sa, sb) => {
    const t = norm(sub(b, a)), dors = norm(cross(side, t)), l = len(sub(b, a)) || 1;
    return (loc, n, hit) => {
      const rel = sub(hit, a), along = sa + (sb - sa) * Math.min(1, Math.max(0, dot(rel, t) / l));
      const perp = sub(rel, scl(t, dot(rel, t)));
      const phi = Math.atan2(dot(perp, side), dot(perp, dors)), ap = Math.abs(phi);
      if (ap > 2.25) return C.foot;
      const taper = smooth(0.04, 0.32, along), serr = 0.06 * Math.sin(along * sp.L * 0.85 / K);
      if (ap < 0.2 * taper + serr) return C.stripe;
      if (along < 0.93 && Math.abs(ap - 1.25) < 0.17 * taper + serr) return C.stripe;
      return C.body;
    };
  };
  for (let i = 0; i < sp.N - 1; i++) {
    const a = sp.pts[i], b = sp.pts[i + 1], s0 = i / (sp.N - 1), s1 = (i + 1) / (sp.N - 1);
    const r = (sp.rad[i] + sp.rad[i + 1]) / 2;
    const t = norm(sub(b, a)), dors = norm(cross(side, t));
    const c = scl(add(a, b), 0.5), Lh = len(sub(b, a)) / 2 + r * 0.6;
    // a little flatter top-to-bottom than wide (a slug's girth)
    cv.ellipsoid(c, [t, dors, side], [Lh, r * 0.92, r * 1.08], matFor(a, b, s0, s1), opt(10));
  }
  // the head: a round cap on the last point
  const H = sp.head, tH = sp.tH, dH = norm(cross(side, tH)), rH = sp.rH;
  cv.ellipsoid(H, [tH, dH, side], [rH * 0.95, rH * 0.92, rH * 1.05], matFor(sp.pts[sp.N - 2], H, 0.94, 1.0), opt(10));
  // the face: toward the front (the tip of the head, tipped toward her forward)
  const fN = norm(add(scl(tH, 0.55), [0.85, 0, 0]));
  const fUp = norm(sub(dH, scl(fN, dot(dH, fN))));
  const F = (a, b, c) => add(H, add(add(scl(fN, a * rH), scl(fUp, b * rH)), scl(side, c * rH)));
  const mouthC = F(0.95, -0.22, 0);
  if (P.mouth > 0.05) cv.ellipsoid(mouthC, [fN, fUp, side], [rH * 0.2, rH * 0.18 * P.mouth + 0.6, rH * 0.38], (loc) => (loc[1] < -0.2 ? [232, 200, 60] : [58, 34, 40]), opt(41));
  else for (let c = -0.34; c <= 0.34; c += 0.04) cv.decal(F(Math.sqrt(Math.max(0, 1 - c * c - 0.05)) * 0.98, -0.22 - c * c * 0.5, c), S.ink, 1, norm(add(fN, scl(side, c))));
  // the eyes: two small dark marks above the mouth
  for (const s of [1, -1]) {
    const e = F(0.9, 0.22, s * 0.34);
    cv.decal(e, S.ink, Math.max(1, Math.round(rH * 0.1)), norm(add(fN, scl(side, s * 0.4))));
    cv.decal(add(e, scl(fUp, Math.max(1, rH * 0.1))), S.ink, 1, norm(add(fN, scl(side, s * 0.4))));
  }
  // the optical tentacles on top, the sensory ones at the mouth
  for (const s of [1, -1]) {
    const base = F(0.35, 0.82, s * 0.36), tip = add(base, add(add(scl(fUp, rH * 0.95), scl(fN, rH * 0.35)), scl(side, s * rH * 0.18)));
    cv.bone(base, tip, Math.max(0.8, rH * 0.07), () => C.stalk, opt(42));
    cv.ellipsoid(tip, [fN, fUp, side], [rH * 0.14 + 0.6, rH * 0.14 + 0.6, rH * 0.14 + 0.6], (loc, n) => (dot(n, fN) > 0.55 ? [64, 72, 74] : C.stalk), opt(43));
    const mb = F(0.82, -0.32, s * 0.5);
    cv.bone(mb, add(mb, add(scl(fN, rH * 0.28), add(scl(fUp, -rH * 0.18), scl(side, s * rH * 0.12)))), Math.max(0.7, rH * 0.06), () => C.stalk, opt(44));
  }
  return { mouth: mouthC, head: H, spine: sp };
}

// A small quadruped rig for summoned animals (2026-11-26, first user: Kakashi's ninken). One 3D rig per animal, drawn
// into three real views (side = profile facing right, front = facing the camera, back = facing away; left is the
// mirrored profile), so an animal running toward the camera shows its face, chest and front paws, one running away
// shows its back, the vest's seal and its tail. Every part is an ellipsoid between two joints (a 'bone'), ray-cast per
// pixel with a depth buffer, lit from the top left and shaded in three tones; then a dark outline round the silhouette
// and a contour where a nearer part overlaps a farther one. Details (eyes, nose, the forehead plate, the seal) are
// points on a surface, drawn only where that surface faces the viewer.
// Coordinates: f forward, u up, r = the animal's right; feet on u = 0. Screen: x right, y down, feet at the pivot.
const TAU = Math.PI * 2;
const rgb = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const mul = (c, k) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const OUTLINE = rgb("#1c1520");

// view basis: screen x, screen y (down), depth (toward the viewer), for a pitch looking a little down at the animal
export function viewBasis(view, pitch = 0.32) {
  // in animal space: X = screen right, D = toward the viewer (before the pitch)
  let X, D;
  if (view === "side") { X = [1, 0, 0]; D = [0, 0, 1]; }       // facing right: its right side faces us
  else if (view === "front") { X = [0, 0, -1]; D = [1, 0, 0]; } // facing us: its right is on screen left
  else { X = [0, 0, 1]; D = [-1, 0, 0]; }                       // facing away: its right is on screen right
  const U = [0, 1, 0], c = Math.cos(pitch), s = Math.sin(pitch);
  // pitch: the eye rises above the animal; depth gets some 'up', screen-up gets some 'away'
  const Dp = [D[0] * c + U[0] * s, D[1] * c + U[1] * s, D[2] * c + U[2] * s];
  const Up = [U[0] * c - D[0] * s, U[1] * c - D[1] * s, U[2] * c - D[2] * s];
  return { X, Up, D: Dp };
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// rotations in animal space
export const rotY = (v, a) => [v[0] * Math.cos(a) - v[2] * Math.sin(a), v[1], v[0] * Math.sin(a) + v[2] * Math.cos(a)]; // yaw (+ = toward its right... see use)
export const rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]]; // pitch nose up (+)

// ---------------------------------------------------------------- the canvas
export class Canvas {
  constructor(w, h, ox, oy, view, pitch) {
    Object.assign(this, { w, h, ox, oy, B: viewBasis(view, pitch), view });
    this.col = new Array(w * h).fill(null);
    this.z = new Float32Array(w * h).fill(-1e9);
    this.part = new Int16Array(w * h).fill(-1);
    this.nparts = 0;
    this.L = norm([-0.45, 0.8, 0.4]); // light: up, from the screen left, a little from the viewer
  }
  // screen position of an animal-space point
  proj(p) { const B = this.B; return [this.ox + dot(p, B.X), this.oy - dot(p, B.Up), dot(p, B.D)]; }
  // an ellipsoid: centre c, axes a1 (long, unit), a2, a3 and radii; mat(local[3], normal) -> [r,g,b] or null (hole)
  ellipsoid(c, axes, radii, mat, opt = {}) {
    const id = this.nparts++, B = this.B, [ra, rb, rc] = radii;
    const [sx, sy, sz] = this.proj(c), R = Math.max(ra, rb, rc) + 1;
    const x0 = Math.max(0, Math.floor(sx - R)), x1 = Math.min(this.w - 1, Math.ceil(sx + R));
    const y0 = Math.max(0, Math.floor(sy - R)), y1 = Math.min(this.h - 1, Math.ceil(sy + R));
    // ray direction (toward -depth) and its components in the ellipsoid's unit space
    const dir = scl(B.D, -1);
    const dl = [dot(dir, axes[0]) / ra, dot(dir, axes[1]) / rb, dot(dir, axes[2]) / rc];
    const A = dot(dl, dl);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      // ray origin: the pixel centre on the plane through c, far toward the viewer
      const px = x + 0.5 - this.ox, py = this.oy - (y + 0.5);
      const o = add(add(scl(B.X, px), scl(B.Up, py)), scl(B.D, sz + 200));
      const oc = sub(o, c), ol = [dot(oc, axes[0]) / ra, dot(oc, axes[1]) / rb, dot(oc, axes[2]) / rc];
      const Bq = 2 * dot(ol, dl), C = dot(ol, ol) - 1, disc = Bq * Bq - 4 * A * C;
      if (disc < 0) continue;
      const tt = (-Bq - Math.sqrt(disc)) / (2 * A);
      const hit = add(o, scl(dir, tt)), depth = dot(hit, B.D);
      if (opt.clipGround && hit[1] < 0) continue; // under the ground: not drawn
      if (opt.clip && !opt.clip(hit)) continue;
      const k = y * this.w + x;
      if (depth <= this.z[k]) continue;
      const loc = [ol[0] + dl[0] * tt, ol[1] + dl[1] * tt, ol[2] + dl[2] * tt]; // unit-sphere coords
      const n = norm(add(add(scl(axes[0], loc[0] / ra), scl(axes[1], loc[1] / rb)), scl(axes[2], loc[2] / rc)));
      const base = mat(loc, n, hit);
      if (!base) continue;
      const lam = dot(n, this.L);
      const tone = lam > 0.55 ? 1.16 : lam > 0.05 ? 1 : lam > -0.35 ? 0.78 : 0.62;
      this.z[k] = depth; this.col[k] = mul(base, tone); this.part[k] = opt.group ?? id;
    }
    return id;
  }
  // a limb or bone between two points with radius r0 at a, r1 at b (an ellipsoid round the segment)
  bone(a, b, r, mat, opt) {
    const c = scl(add(a, b), 0.5), d = sub(b, a), L = len(d) / 2 + r * 0.55;
    const ax = norm(d), t = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const a2 = norm(cross(ax, t)), a3 = cross(ax, a2);
    return this.ellipsoid(c, [ax, a2, a3], [L, r, r], mat, opt);
  }
  // a detail on the surface at animal-space point p (seen only if not hidden and facing us): size px square
  decal(p, color, size = 1, normal = null) {
    if (normal && dot(normal, this.B.D) < 0.15) return;
    const [sx, sy, sz] = this.proj(p);
    for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
      const x = Math.floor(sx - size / 2 + 0.5) + dx, y = Math.floor(sy - size / 2 + 0.5) + dy;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
      const k = y * this.w + x;
      if (this.col[k] && sz >= this.z[k] - 1.6) this.col[k] = rgb(color);
    }
  }
  // finish: contour where a nearer part overlaps a farther one, then the outline; RGBA bytes. Part 990 (a smear of a
  // fast blade) gets neither.
  pixels() {
    const { w, h } = this, out = new Uint8ClampedArray(w * h * 4);
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : y * w + x);
    const col = this.col.map((c) => c && [...c]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = at(x, y);
      if (!this.col[k]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = at(x + dx, y + dy);
        if (n >= 0 && this.col[n] && this.part[n] !== this.part[k] && this.part[n] !== 990 && this.part[k] !== 990 && this.z[n] > this.z[k] + 2.2) { col[k] = mixc(this.col[k], OUTLINE, 0.55); break; }
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = at(x, y), o = k * 4;
      let c = col[k];
      if (!c) {
        let edge = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = at(x + dx, y + dy); if (n >= 0 && this.col[n] && this.part[n] !== 990) edge = true; }
        if (!edge) continue;
        c = OUTLINE;
      }
      out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
    }
    return out;
  }
}

// ---------------------------------------------------------------- a dog
// spec: sizes in px; colours; the gear of Kakashi's ninken
// pose: { phase (run cycle 0..1), run (0 stand .. 1 full stride), sink (px under the ground), pitch (body, + nose up),
//         headYaw (+ = toward its right), headPitch (+ up), jaw (0..1 open), tail (angle, + up), crouch (0..1),
//         rear (0..1 up on the hind legs), lift (px off the ground) }
export function drawDog(cv, S, pose = {}) {
  const P = { phase: 0, run: 0, sink: 0, pitch: 0, headYaw: 0, headPitch: 0, jaw: 0, tail: 0.6, crouch: 0, lift: 0, ...pose };
  const k = S.size, legH = S.legH * k * (1 - 0.28 * P.crouch), bodyL = S.bodyL * k, bodyR = S.bodyR * k;
  const fur = rgb(S.fur), dark = rgb(S.dark ?? S.fur), light = rgb(S.light ?? S.fur), mzl = rgb(S.muzzle ?? S.light ?? S.fur);
  const nose = rgb(S.nose ?? "#2a2026"), paw = rgb(S.paw ?? S.dark ?? S.fur);
  const vest = rgb("#3456a8"), vestD = rgb("#23397a"), band = rgb("#2d3f7c"), plate = rgb("#c9cdd8"), bandage = rgb("#ece4d2");
  const bob = P.run * Math.abs(Math.sin(P.phase * TAU * 2)) * 1.2 * k;
  const groundY = -P.sink + P.lift;
  const hipU = groundY + legH + bodyR * 0.3 + bob, shU = hipU + bodyL * Math.sin(P.pitch);
  const hip = [-bodyL / 2, hipU, 0], sh = [bodyL / 2 * Math.cos(P.pitch), shU + (S.chestUp ?? 0) * k, 0];
  const clipGround = true;
  const opt = (g) => ({ clipGround, group: g });
  // fur with patterns: a white belly, a stripe, a muzzle, darker ears
  const bodyMat = (loc, n) => (S.belly && loc[1] < -0.45 ? rgb(S.belly) : fur);
  // ---- legs (far side first does not matter: depth sorts)
  const legs = [
    { f: 1, side: 1, ph: 0 }, { f: 1, side: -1, ph: 0.5 }, { f: -1, side: 1, ph: 0.62 }, { f: -1, side: -1, ph: 0.12 },
  ];
  const WIDE = S.wide ?? 1.22, legW = S.legW * k, spread = bodyR * 0.7 * WIDE;
  for (const L of legs) {
    const base = L.f > 0 ? add(sh, [-bodyR * 0.25, -bodyR * 0.35, 0]) : add(hip, [bodyR * 0.3, -bodyR * 0.3, 0]);
    base[2] = L.side * spread;
    const a = (P.phase + L.ph) * TAU, stride = P.run * bodyL * 0.42;
    let pf = base[0] + Math.sin(a) * stride + (L.f > 0 ? 0.08 : -0.02) * bodyL;
    let pu = groundY + Math.max(0, Math.cos(a)) * P.run * legH * 0.45;
    if (P.rear && L.f > 0) { pf += bodyL * 0.25 * P.rear; pu += legH * 0.9 * P.rear; }
    const pawP = [pf, pu + legW * 0.5, L.side * spread];
    // the joint: front legs bend back at the wrist, hind legs show the hock behind
    const mid = scl(add(base, pawP), 0.5), span = len(sub(base, pawP)), want = legH * 1.02;
    const bend = Math.sqrt(Math.max(0, (want / 2) ** 2 - (span / 2) ** 2)) * (L.f > 0 ? -0.8 : -1.1);
    const joint = add(mid, [bend, 0, 0]);
    const isBand = S.legBand === (L.f > 0 ? (L.side > 0 ? "FR" : "FL") : (L.side > 0 ? "HR" : "HL"));
    const bandaged = (S.bandage ?? []).includes(L.f > 0 ? (L.side > 0 ? "FR" : "FL") : "x");
    const limbMat = (loc) => (bandaged && loc[0] > -0.6 ? bandage : isBand && loc[0] > -0.2 && loc[0] < 0.5 ? band : loc[0] > 0.55 ? paw : fur);
    const up = L.f > 0 ? legW * 1.15 : legW * 1.45;
    cv.bone(base, joint, up, (loc) => (L.f < 0 && S.belly && loc[0] < -0.3 ? fur : fur), opt());
    cv.bone(joint, pawP, legW, limbMat, opt());
    cv.ellipsoid(add(pawP, [legW * 0.5, -legW * 0.15, 0]), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [legW * 1.15, legW * 0.6, legW * 0.95], () => paw, opt());
    if (isBand) cv.decal(add(joint, [legW * 0.6, -legW * 0.2, L.side * legW]), "#c9cdd8", 2);
  }
  // ---- torso: chest, belly, rump
  const tAx = norm(sub(sh, hip)), side = [0, 0, 1], tUp = norm(cross(side, tAx));
  const tc = scl(add(sh, hip), 0.5);
  const torso = (loc, n, hit) => {
    // the vest: over the back and flanks between the shoulders and the loin
    if (S.vest !== false && loc[0] > -0.55 && loc[0] < 0.62 && loc[1] > -0.25) return loc[1] > 0.82 ? vestD : vest;
    return bodyMat(loc, n);
  };
  cv.ellipsoid(tc, [tAx, tUp, [0, 0, 1]], [bodyL / 2 + bodyR * 0.5, bodyR, bodyR * WIDE], torso, opt(90));
  // chest (rounder, forward) and the rump
  cv.ellipsoid(add(sh, [bodyR * 0.1, -bodyR * 0.08, 0]), [tAx, tUp, [0, 0, 1]], [bodyR * 0.95, bodyR * 1.02, bodyR * WIDE * 1.02], (loc) => (S.vest !== false && loc[1] > -0.2 && loc[0] < 0.55 ? vest : S.chestCol && loc[0] > 0.2 ? rgb(S.chestCol) : bodyMat(loc)), opt(90));
  cv.ellipsoid(add(hip, [-bodyR * 0.1, 0, 0]), [tAx, tUp, [0, 0, 1]], [bodyR * 0.9, bodyR * 0.95, bodyR * WIDE * 0.98], bodyMat, opt(90));
  // the seal on the vest: a white disc on each flank and on top (shown where it faces us)
  if (S.vest !== false) {
    for (const s of [1, -1]) {
      const c = add(tc, scl([0, 0, 1], s * bodyR * WIDE * 0.98));
      const nrm = [0, 0, s];
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, rr = bodyR * 0.42; cv.decal(add(c, [Math.cos(a) * rr, Math.sin(a) * rr + bodyR * 0.15, 0]), "#e8ecf4", 1, nrm); }
      cv.decal(add(c, [0, bodyR * 0.15, 0]), "#e8ecf4", Math.max(1, Math.round(bodyR * 0.5)), nrm);
      cv.decal(add(c, [0, bodyR * 0.15, 0]), "#3d4a70", 1, nrm);
    }
    const top = add(tc, [0, bodyR * 1.0, 0]);
    cv.decal(top, "#e8ecf4", Math.max(2, Math.round(bodyR * 0.7)), [0, 1, 0]);
    cv.decal(top, "#3d4a70", 1, [0, 1, 0]);
  }
  // ---- tail
  const tailBase = add(hip, [-bodyR * 0.9, bodyR * 0.3, 0]);
  const ta = Math.PI - 0.2 - P.tail + Math.sin(P.phase * TAU * 2) * 0.25 * (P.wag ?? P.run);
  const tailL = S.tailL * k, tailEnd = add(tailBase, [Math.cos(ta) * tailL, Math.sin(Math.PI - ta + Math.PI) * -tailL, Math.sin(P.phase * TAU * 3) * (P.wag ?? 0) * tailL * 0.5]);
  if (S.curlTail) cv.ellipsoid(add(tailBase, [-tailL * 0.3, tailL * 0.5, 0]), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [tailL * 0.45, tailL * 0.45, tailL * 0.35], () => fur, opt());
  else cv.bone(tailBase, tailEnd, S.tailW * k, (loc) => (S.tailTip && loc[0] > 0.5 ? rgb(S.tailTip) : fur), opt());
  // ---- neck and head
  const neckBase = add(sh, [bodyR * 0.35, bodyR * 0.5, 0]);
  const hp = P.headPitch + (S.headUp ?? 0);
  const headR = S.headR * k;
  const headC = add(neckBase, rotZ([S.neck * k * 0.5, S.neck * k * 0.9, 0], hp * 0.4 + P.pitch * 0.5));
  // head frame: yaw about up, pitch about its side axis
  const hf = rotY(rotZ([1, 0, 0], hp), -P.headYaw), hu = norm(rotY(rotZ([0, 1, 0], hp), -P.headYaw)), hs = norm(cross(hf, hu));
  const H = (a, b, c) => add(headC, add(add(scl(hf, a), scl(hu, b)), scl(hs, c))); // point in head space (px)
  cv.bone(neckBase, headC, headR * 0.62, (loc) => (S.collar && loc[0] > -0.1 && loc[0] < 0.25 ? rgb("#4a4048") : S.neckBand && loc[0] > 0.0 && loc[0] < 0.45 ? band : (S.bandage ?? []).includes("neck") && loc[0] > -0.4 ? bandage : S.chestCol ? rgb(S.chestCol) : fur), opt(91));
  if (S.collar) for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; cv.decal(add(scl(add(neckBase, headC), 0.5), [0, Math.cos(a) * headR * 0.66, Math.sin(a) * headR * 0.66]), "#d8dce4", 1); }
  const skull = (loc, n, hit) => {
    const hl = [dot(sub(hit, headC), hf), dot(sub(hit, headC), hu), dot(sub(hit, headC), hs)];
    if (S.stripe && Math.abs(hl[2]) < headR * 0.22 && hl[1] > -headR * 0.2) return rgb(S.stripe);
    if (S.foreBand && hl[1] > headR * 0.25 && hl[1] < headR * 0.62) return band;
    if ((S.bandage ?? []).includes("head") && hl[1] > headR * 0.1 && hl[0] < headR * 0.4) return bandage;
    if (S.mask && hl[0] > -headR * 0.1 && hl[1] > -headR * 0.15 && hl[1] < headR * 0.35 && Math.abs(hl[2]) > headR * 0.25) return rgb(S.mask);
    if (S.cheek && hl[1] < -headR * 0.2) return rgb(S.cheek);
    return fur;
  };
  cv.ellipsoid(headC, [hf, hu, hs], [headR * (S.headLong ?? 1), headR * 0.95, headR * (S.headWide ?? 1.05)], skull, opt(92));
  // muzzle and the lower jaw (opens down)
  const sn = S.snout * k, snH = S.snoutH * k;
  const mC = H(headR * 0.75 + sn * 0.45, -headR * 0.28, 0);
  cv.ellipsoid(mC, [hf, hu, hs], [sn * 0.62 + 1, snH, snH * (S.snoutWide ?? 1.05)], () => mzl, opt(93));
  if (S.jowls) for (const s of [1, -1]) cv.ellipsoid(H(headR * 0.6 + sn * 0.3, -headR * 0.55, s * snH * 0.8), [hf, hu, hs], [sn * 0.45 + 1, snH * 0.95, snH * 0.55], () => mul(mzl, 0.92), opt(93));
  const jawA = 0.15 + P.jaw * 0.75;
  const jf = rotZ([1, 0, 0], -jawA), jf3 = norm(add(add(scl(hf, jf[0]), scl(hu, jf[1])), [0, 0, 0]));
  const jawBase = H(headR * 0.45, -headR * 0.5, 0);
  const jawTip = add(jawBase, scl(jf3, sn * 0.9 + headR * 0.35));
  if (P.jaw > 0.15) {
    // the open mouth: a dark inside, a tongue, teeth along the upper jaw
    cv.ellipsoid(H(headR * 0.75 + sn * 0.35, -headR * 0.55 - P.jaw * snH * 0.5, 0), [hf, hu, hs], [sn * 0.5, snH * 0.55 * P.jaw + 0.6, snH * 0.8], () => rgb("#4a1820"), opt(94));
  }
  cv.bone(jawBase, jawTip, snH * 0.55, () => (P.jaw > 0.15 ? mul(mzl, 0.9) : mzl), opt(93));
  if (P.jaw > 0.3) { cv.decal(H(headR * 0.75 + sn * 0.7, -headR * 0.42, snH * 0.3), "#f4f4ee", 1); cv.decal(H(headR * 0.75 + sn * 0.7, -headR * 0.42, -snH * 0.3), "#f4f4ee", 1); cv.decal(add(jawTip, scl(hu, -0.5)), "#d85a6a", 1); }
  // nose at the muzzle's tip
  const noseP = H(headR * 0.75 + sn * 0.98 + 0.5, -headR * 0.12, 0);
  cv.ellipsoid(noseP, [hf, hu, hs], [Math.max(0.9, snH * 0.35), Math.max(0.9, snH * 0.32), Math.max(1.1, snH * 0.45)], () => nose, opt(95));
  // eyes (with markings), on the face's front sides
  for (const s of [1, -1]) {
    const e = H(headR * 0.72, headR * 0.2, s * headR * 0.42), en = norm(add(add(scl(hf, 0.75), scl(hu, 0.1)), scl(hs, s * 0.65)));
    if (S.eyeRing) cv.decal(e, S.eyeRing, Math.max(2, Math.round(headR * 0.42)), en);
    if (S.shades) { cv.decal(e, "#141018", Math.max(2, Math.round(headR * 0.5)), en); cv.decal(add(e, scl(hu, 0.6)), "#6a7090", 1, en); }
    else { cv.decal(e, "#16101a", Math.max(1, Math.round(headR * 0.26)), en); if (headR > 5) cv.decal(add(e, scl(hu, 0.7)), "#ffffff", 1, en); }
    if (S.brow) cv.decal(add(e, scl(hu, headR * 0.3)), S.brow, Math.max(1, Math.round(headR * 0.3)), en);
  }
  if (S.mark) cv.decal(H(headR * 0.82, headR * 0.6, 0), S.mark, 2, norm(add(hf, hu)));
  // the forehead protector: a plate on the brow (Pakkun wears it on top of the head)
  if (S.foreBand || S.topBand) {
    const pc = S.topBand ? H(headR * 0.1, headR * 0.98, 0) : H(headR * 0.82, headR * 0.45, 0);
    cv.decal(pc, "#c9cdd8", Math.max(2, Math.round(headR * 0.55)), S.topBand ? hu : hf);
    cv.decal(pc, "#4a5068", 1, S.topBand ? hu : hf);
    if (S.topBand) cv.ellipsoid(H(headR * 0.1, headR * 0.92, 0), [hf, hu, hs], [headR * 0.42, headR * 0.16, headR * 0.7], () => band, opt(96));
  }
  if (S.neckBand) cv.decal(add(scl(add(neckBase, headC), 0.5), scl(hf, headR * 0.62)), "#c9cdd8", Math.max(2, Math.round(headR * 0.45)), hf);
  // ears: flaps (droop), long hanging ears, or pricked triangles
  for (const s of [1, -1]) {
    const base = H(-headR * 0.05, headR * 0.72, s * headR * 0.62);
    const earCol = rgb(S.ear ?? S.dark ?? S.fur);
    if (S.ears === "long") cv.bone(base, add(base, add(scl(hu, -headR * 1.25), scl(hs, s * headR * 0.25))), headR * 0.32, () => earCol, opt());
    else if (S.ears === "prick") cv.bone(base, add(base, add(scl(hu, headR * 0.85), add(scl(hs, s * headR * 0.15), scl(hf, -headR * 0.15)))), headR * 0.3, () => earCol, opt());
    else cv.bone(base, add(base, add(scl(hu, -headR * 0.45), add(scl(hs, s * headR * 0.45), scl(hf, headR * 0.2)))), headR * 0.3, () => earCol, opt());
  }
  // a crest of hair along the top of the head (Shiba's mohawk, Urushi's dark tuft)
  if (S.crest) for (let i = 0; i < 4; i++) cv.ellipsoid(H(-headR * 0.5 + i * headR * 0.32, headR * (0.95 + 0.08 * Math.sin(i * 2)), 0), [hf, hu, hs], [headR * 0.26, headR * 0.32, headR * 0.18], () => rgb(S.crest), opt(97));
  return { head: headC, nose: noseP, jaw: jawTip, H };
}

// ---------------------------------------------------------------- Kakashi's ninken (Narutopedia, appearance sections)
// sizes: at the scale of the 72 px fighters (Kakashi ~ 72 px with the chibi head); Bull is the largest, Pakkun the
// smallest; Uhei is a long-legged greyhound.
export const NINKEN = {
  pakkun: { name: "Pakkun", size: 1.5, legH: 4.5, legW: 1.4, bodyL: 7, bodyR: 3.6, headR: 4.6, snout: 1.6, snoutH: 2, neck: 2.5, tailL: 2.5, tailW: 1, curlTail: true,
    fur: "#c98c4c", dark: "#5a3a24", muzzle: "#4c3226", ear: "#4c3226", paw: "#e8a8a8", ears: "droop", jowls: true, topBand: true, bandage: ["FR"], wide: 1.3, headWide: 1.12, cheek: "#b07a42" },
  bull: { name: "Bull", size: 1.5, legH: 12, legW: 3.6, bodyL: 20, bodyR: 9.5, headR: 9, snout: 3, snoutH: 4.2, neck: 4, tailL: 4, tailW: 1.6, collar: true,
    fur: "#46444f", dark: "#2a2832", muzzle: "#6a6672", ear: "#2c2a34", paw: "#34323c", ears: "droop", jowls: true, legBand: "FL", wide: 1.3, headWide: 1.12, brow: "#55525e" },
  uhei: { name: "Ūhei", size: 1.5, legH: 15, legW: 1.7, bodyL: 15, bodyR: 4.6, headR: 4.4, snout: 4.6, snoutH: 1.9, neck: 6, tailL: 8, tailW: 0.9, headLong: 1.15,
    fur: "#a85a32", dark: "#6c3620", belly: "#f0e6d8", muzzle: "#f0e6d8", ear: "#7a4026", ears: "prick", bandage: ["neck", "head", "FL"], neckBand: true, chestCol: "#f0e6d8" },
  shiba: { name: "Shiba", size: 1.5, legH: 9, legW: 2, bodyL: 12, bodyR: 5.2, headR: 5.4, snout: 3, snoutH: 2.4, neck: 3.5, tailL: 6, tailW: 1.5,
    fur: "#a4a8b4", dark: "#6e7280", belly: "#f2f2f4", muzzle: "#eeeef2", ear: "#8a8e9a", ears: "prick", crest: "#1e1c24", brow: "#2a2a34", bandage: ["FR", "FL"], neckBand: true, chestCol: "#f2f2f4" },
  bisuke: { name: "Bisuke", size: 1.5, legH: 7.5, legW: 1.8, bodyL: 10, bodyR: 4.4, headR: 5, snout: 2.6, snoutH: 2.2, neck: 3, tailL: 5, tailW: 1.3,
    fur: "#d6a464", dark: "#8a5a30", muzzle: "#e8c494", ear: "#8a5a30", ears: "long", eyeRing: "#5a3a24", mark: "#3a2a20", neckBand: true },
  akino: { name: "Akino", size: 1.5, legH: 9, legW: 2, bodyL: 12, bodyR: 5, headR: 5.2, snout: 3.2, snoutH: 2.3, neck: 3.5, tailL: 6, tailW: 1.5,
    fur: "#cf9a58", dark: "#8c5e30", muzzle: "#f4ecdc", ear: "#8c5e30", ears: "prick", stripe: "#f4ecdc", shades: true, neckBand: true },
  guruko: { name: "Guruko", size: 1.5, legH: 9, legW: 2, bodyL: 12, bodyR: 5, headR: 5.2, snout: 3, snoutH: 2.4, neck: 3.5, tailL: 6, tailW: 1.5,
    fur: "#d29c58", dark: "#6a4226", muzzle: "#f4ece0", ear: "#5a3420", ears: "long", foreBand: true },
  urushi: { name: "Urushi", size: 1.5, legH: 9.5, legW: 2.1, bodyL: 12.5, bodyR: 5.4, headR: 5.4, snout: 3.2, snoutH: 2.5, neck: 3.5, tailL: 6, tailW: 1.5,
    fur: "#8a5838", dark: "#5a3824", muzzle: "#f0e8dc", ear: "#3a3438", ears: "droop", crest: "#3e3a42", neckBand: true },
};

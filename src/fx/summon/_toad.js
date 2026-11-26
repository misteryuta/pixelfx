// Gamabunta's rig (2026-11-26): a giant toad built like the ninken (src/fx/summon/_quad.js: ellipsoids between
// joints, ray-cast per pixel, real side / front / back views), after Narutopedia's appearance section and the
// Konoha Crush (Manga 135 / Anime 78):
//   dull rusty red skin; brighter red markings round the eyes, on the lips and the chest; a scar over his LEFT eye;
//   a large blue happi vest, white trim down the front, the crest on the back; a white sash round the belly;
//   a kiseru pipe in the corner of his mouth; the dosu (a huge tantō) tucked at his left hip, drawn with the right hand.
// Limbs are two-bone chains solved toward a target (hands and feet planted on the ground when he sits, swung for the
// leap, tucked in the air, reaching down for the landing), so the same rig makes every pose of the move.
// Coordinates as in _quad.js: f forward, u up, r = his right; feet on u = 0; px at the 72 px fighters' scale.
import { Canvas, rotY, rotZ } from "./_quad.js";
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
const DEG = Math.PI / 180;

export const BUNTA = {
  name: "Gamabunta", k: 1,
  skin: "#b0503f", skinD: "#83362f", belly: "#d8806a", mark: "#e0323a", lip: "#d93a3c",
  vest: "#33406a", vestD: "#262f50", trim: "#eeede6", sash: "#ece6d4", sashD: "#c9c0aa",
  eye: "#f4c42c", pupil: "#141018", scar: "#ecc9b4",
  blade: "#e2e7f0", bladeD: "#97a1b4", hilt: "#2a2228", wrap: "#7a6a9a", sheath: "#3c2a22", guard: "#c8a040",
  pipe: "#5a3a26", bowl: "#d0a640",
  // the sword: a pivot in front of his chest the right hand swings round, its radius, the blade; the cut goes from
  // his left (+) to his right (-), blade angle 0 = straight ahead
  slash: { cf: 22, cr: 8, cu: 74, r: 62, blade: 104, from: 60 * DEG, to: -80 * DEG },
};

// two-bone chain: root a, target b, segment lengths, pole (which way the joint bends) -> joint
function ik(a, b, l1, l2, pole) {
  const d = sub(b, a), D = Math.min(len(d), l1 + l2 - 0.01), ax = norm(d);
  const x = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const pp = norm(sub(pole, scl(ax, dot(pole, ax))));
  return add(add(a, scl(ax, x)), scl(pp, h));
}
// the hand on the sword's path and the blade's direction at blade angle phi (animal space)
export function swordAt(S, phi, drop = 0) {
  const K = S.k, W = S.slash;
  const c = [W.cf * K, W.cu * K - drop, W.cr * K];
  return { hand: add(c, [Math.cos(phi) * W.r * K, 0, -Math.sin(phi) * W.r * K]), dir: norm([Math.cos(phi), -0.1, -Math.sin(phi)]) };
}

// pose: { crouch 0..1, squash 0..1 (landing), air (no ground clip), stretch / tuck / reach 0..1 (limb blends for the
//   leap), bp (body pitch, nose up), headYaw, headPitch, breathe 0..1,
//   sword: { mode: "sheath" | "grip" | "draw" | "slash", d (draw 0..1), phi, prev (phi of the last frame: a smear) } }
export function drawToad(cv, S, pose = {}) {
  const P = { crouch: 0, squash: 0, stretch: 0, tuck: 0, reach: 0, headYaw: 0, headPitch: 0, breathe: 0, sword: { mode: "sheath" }, ...pose };
  const K = S.k;
  const C = Object.fromEntries(["skin", "skinD", "belly", "mark", "lip", "vest", "vestD", "trim", "sash", "sashD", "eye", "pupil", "blade", "bladeD", "hilt", "wrap", "sheath", "guard", "pipe", "bowl"].map((n) => [n, rgb(S[n])]));
  const opt = (g) => ({ clipGround: !P.air, group: g });
  const drop = (12 * P.crouch + 16 * P.squash) * K - P.breathe * 1.5 * K;
  const bp0 = 0.42, bp = P.bp ?? bp0 - 0.12 * P.crouch - 0.12 * P.squash;
  const T = [0, 60 * K - drop, 0];
  // the torso's frame (pitched); offsets are given for the sitting pitch and turned with the body
  const fr = (v) => add(T, rotZ(scl(v, K), bp - bp0));
  const tAx = rotZ([1, 0, 0], bp), tUp = rotZ([0, 1, 0], bp);
  const local = (hit) => { const r = sub(hit, T); return [dot(r, tAx) / K, dot(r, tUp) / K, r[2] / K]; };

  // ---------------------------------------------------------------- limbs
  const shoulder = (s) => fr([34, 16, s * 44]), hipJ = (s) => fr([-32, -14, s * 46]);
  const blendT = (planted, st, tu, re) => {
    let p = planted;
    const w = P.stretch + P.tuck + P.reach;
    if (w > 0) { const a = add(add(scl(st, P.stretch), scl(tu, P.tuck)), scl(re, P.reach)); p = lerp3(p, scl(a, 1 / w), Math.min(1, w)); }
    return p;
  };
  const sw = P.sword ?? { mode: "sheath" };
  const hilt = fr([52, -8, -38]), tail = fr([-62, -2, -58]), sheathOut = norm(sub(hilt, tail));
  // the right hand on the sword (when it has it)
  let swordHand = null, bladeDir = null, bladeVis = 0;
  const W = S.slash;
  if (sw.mode === "grip") { swordHand = add(hilt, scl(sheathOut, 6 * K)); bladeDir = scl(sheathOut, -1); bladeVis = 0; }
  else if (sw.mode === "draw") {
    const a = Math.min(1, sw.d / 0.6), b = Math.max(0, (sw.d - 0.6) / 0.4);
    const out = add(hilt, scl(sheathOut, 6 * K + W.blade * K * a));
    const s0 = swordAt(S, W.from, drop);
    swordHand = lerp3(out, s0.hand, b);
    bladeDir = norm(lerp3(scl(sheathOut, -1), s0.dir, b));
    bladeVis = W.blade * K * Math.max(a, b);
  } else if (sw.mode === "slash") { const s = swordAt(S, sw.phi, drop); swordHand = s.hand; bladeDir = s.dir; bladeVis = W.blade * K; }

  const skin = () => C.skin;
  for (const s of [1, -1]) {
    // ---- the hind leg: a big folded thigh, the shin, the long webbed toes
    const hip = hipJ(s);
    const plantedA = lerp3([-24 * K, 8 * K, s * 80 * K], [-20 * K, 8 * K, s * 92 * K], P.squash);
    const ankle = blendT(plantedA, add(hip, scl([-62, -52, s * 18], K)), add(hip, scl([18, -26, s * 36], K)), add(hip, scl([10, -60, s * 44], K)));
    const knee = ik(hip, ankle, 50 * K, 46 * K, [0.6, 0.25, s]);
    cv.bone(hip, knee, 17 * K, skin, opt(10));
    cv.bone(knee, ankle, 11 * K, skin, opt(11));
    const grounded = !P.air || ankle[1] < 12 * K;
    const shin = norm(sub(ankle, knee));
    for (let i = 0; i < 4; i++) {
      const fan = (-0.5 + i * 0.36) * s;
      const dir = grounded ? norm([Math.cos(fan + s * 0.35), 0, Math.sin(fan + s * 0.35)]) : norm(add(add(shin, [-0.9, 0, 0]), [0, 0, fan * 0.8]));
      const tip = add(ankle, scl(dir, 30 * K));
      if (grounded) tip[1] = 2.5 * K;
      cv.bone(ankle, tip, 4 * K, skin, opt(12));
      cv.ellipsoid(tip, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [5 * K, 3 * K, 5 * K], () => C.skinD, opt(12));
    }
    cv.ellipsoid(add(ankle, [0, -2 * K, 0]), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [12 * K, 6 * K, 12 * K], skin, opt(12));

    // ---- the arm: the sleeve of the happi, the red forearm, the hand (planted, swung, or on the sword)
    const sh = shoulder(s);
    const plantedH = lerp3([60 * K, 2 * K, s * 58 * K], [66 * K, 2 * K, s * 72 * K], P.squash);
    let hand = blendT(plantedH, add(sh, scl([56, 24, s * 16], K)), add(sh, scl([26, -34, s * 26], K)), add(sh, scl([36, -62, s * 30], K)));
    const onSword = s > 0 && swordHand;
    if (onSword) hand = swordHand;
    const elbow = ik(sh, hand, 42 * K, 46 * K, onSword ? [-0.3, -0.6, 1] : [-0.5, 0.1, s]);
    cv.bone(sh, elbow, 15 * K, (loc) => (loc[0] > 0.72 ? C.trim : C.vest), opt(20));
    cv.bone(elbow, hand, 10 * K, skin, opt(21));
    if (onSword) {
      cv.ellipsoid(hand, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [11 * K, 10 * K, 11 * K], skin, opt(22));
    } else {
      const handGround = !P.air || hand[1] < 10 * K;
      cv.ellipsoid(add(hand, [2 * K, 1 * K, 0]), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [11 * K, 5 * K, 10 * K], skin, opt(22));
      const fore = norm(sub(hand, elbow));
      for (let i = 0; i < 4; i++) {
        const fan = (-0.55 + i * 0.4) * s;
        const dir = handGround ? norm([Math.cos(fan), 0, Math.sin(fan)]) : norm(add(fore, [0, 0, fan * 0.7]));
        const tip = add(hand, scl(dir, 22 * K));
        if (handGround) tip[1] = 2.5 * K;
        cv.bone(hand, tip, 3.5 * K, skin, opt(23));
        cv.ellipsoid(tip, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [4.5 * K, 2.8 * K, 4.5 * K], () => C.skinD, opt(23));
      }
    }
  }

  // ---------------------------------------------------------------- body: the vest, the open chest, the sash, the belly
  const bodyMat = (loc, n, hit) => {
    const [f, u, s] = local(hit), as = Math.abs(s);
    if (u < -30) return f > 10 ? C.belly : C.skin;                                   // the belly under the sash
    if (u < -12) return (Math.floor((u + 30) / 4) % 2 === 0 && as > 10) ? C.sashD : C.sash; // the wrapped sash
    // the happi: open down the front in a V, white trim along the opening
    const open = 14 + (u + 12) * 0.32;
    if (f > 18 && as < open) {
      // the chest: brighter red markings (a centre line and chevrons)
      if (as < 2.2 || Math.abs(as - (u + 4) * 0.55) < 1.6 && u > -8) return C.mark;
      return C.belly;
    }
    if (f > 14 && as < open + 6) return C.trim;
    return u > 34 ? C.vestD : C.vest;
  };
  const br = 1 + 0.02 * P.breathe;
  cv.ellipsoid(fr([4, -22, 0]), [tAx, tUp, [0, 0, 1]], [50 * K, 34 * K, 54 * K * br], bodyMat, opt(30));
  cv.ellipsoid(T, [tAx, tUp, [0, 0, 1]], [58 * K, 46 * K * br, 58 * K * br], bodyMat, opt(30));
  // the crest on the back (a red ring, the cream disc, the character in dark ink) and the small crests on the flaps
  const back = add(T, add(scl(tAx, -56 * K), scl(tUp, 14 * K))), backN = norm(add(scl(tAx, -1), scl(tUp, 0.3)));
  const bx = [0, 0, 1], by = norm(cross(backN, bx));
  for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) {
    const r = Math.hypot(x, y) / 16;
    if (r > 1) continue;
    const glyph = (Math.abs(x - 1) <= 1 && y > -9 && y < 9) || (Math.abs(y + 4) <= 1 && Math.abs(x) < 8) || (Math.abs(y - 3) <= 1 && Math.abs(x) < 6) || (Math.abs(x + 6) <= 1 && y > -2 && y < 8) || (Math.abs(y - 8) <= 1 && x > -6 && x < 7);
    const col = r > 0.8 ? "#c8343a" : glyph ? "#2a1e22" : "#f1ead8";
    cv.decal(add(back, add(scl(bx, x * K * 0.9), scl(by, y * K * 0.9))), col, 1, backN);
  }
  for (const s of [1, -1]) {
    const pc = add(T, add(add(scl(tAx, 44 * K), scl(tUp, 18 * K)), [0, 0, s * 30 * K])), pn = norm(add(add(scl(tAx, 0.8), scl(tUp, 0.2)), [0, 0, s * 0.55]));
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (Math.hypot(x, y) <= 4.2) cv.decal(add(pc, [0, y * K, x * K]), Math.hypot(x, y) > 3 || (x === 0 && y > -2) ? "#f1ead8" : "#33406a", 1, pn);
  }

  // ---------------------------------------------------------------- the dosu: sheath at the left hip, then in the hand
  cv.bone(hilt, tail, 5.4 * K, (loc) => (loc[0] < -0.88 ? C.guard : C.sheath), opt(40));
  if (sw.mode === "sheath") {
    const hEnd = add(hilt, scl(sheathOut, 24 * K));
    cv.bone(hilt, hEnd, 4.6 * K, (loc) => ((Math.floor((loc[0] + 1) * 5) % 2) ? C.wrap : C.hilt), opt(41));
    cv.ellipsoid(add(hilt, scl(sheathOut, 1 * K)), [sheathOut, [0, 1, 0], norm(cross(sheathOut, [0, 1, 0]))], [1.8 * K, 8 * K, 8 * K], () => C.guard, opt(41));
  } else {
    const hand = swordHand, d = bladeDir;
    const side = norm(cross(d, [0, 1, 0])), flat = norm(cross(side, d));
    cv.bone(add(hand, scl(d, -22 * K)), add(hand, scl(d, 3 * K)), 4.6 * K, (loc) => ((Math.floor((loc[0] + 1) * 4) % 2) ? C.wrap : C.hilt), opt(41));
    cv.ellipsoid(add(hand, scl(d, 7 * K)), [d, flat, side], [1.8 * K, 8 * K, 8 * K], () => C.guard, opt(41));
    if (bladeVis > 2) {
      const b0 = add(hand, scl(d, 8 * K)), mid = add(b0, scl(d, bladeVis / 2));
      // a flat, single-edged blade: the edge (leading, toward his right as it cuts) bright, the back darker
      cv.ellipsoid(mid, [d, side, flat], [bladeVis / 2, 8.5 * K, 2 * K], (loc) => (loc[1] < -0.2 ? C.blade : C.bladeD), opt(42));
    }
    // the smear behind the cutting blade: the swept band, pale
    if (sw.mode === "slash" && sw.prev !== undefined && Math.abs(sw.prev - sw.phi) > 0.02) {
      const steps = Math.ceil(Math.abs(sw.prev - sw.phi) / (0.4 * DEG));
      for (let i = 0; i <= steps; i++) {
        const a = sw.prev + (sw.phi - sw.prev) * (i / steps), q = swordAt(S, a, drop);
        for (let t = 0.35; t <= 1.0; t += 0.01) streak(cv, add(add(q.hand, scl(q.dir, 8 * K)), scl(q.dir, t * W.blade * K)), i / steps > 0.7 || t > 0.93 ? [255, 255, 255] : i / steps > 0.35 ? [222, 232, 255] : [178, 196, 240]);
      }
    }
  }

  // ---------------------------------------------------------------- the head: wide, flat, the eyes on top
  const hp = P.headPitch + (bp - bp0) * 0.6;
  const headC = fr([44, 62, 0]);
  const hf = rotY(rotZ([1, 0, 0], hp), -P.headYaw), hu = norm(rotY(rotZ([0, 1, 0], hp), -P.headYaw)), hs = norm(cross(hf, hu));
  const H = (a, b, c) => add(headC, add(add(scl(hf, a * K), scl(hu, b * K)), scl(hs, c * K)));
  const Rf = 44, Ru = 30, Rs = 56;
  const mouthU = (s) => -6 - (Math.abs(s) / Rs) ** 2 * 8;
  const hl = (hit) => { const r = sub(hit, headC); return [dot(r, hf) / K, dot(r, hu) / K, dot(r, hs) / K]; };
  const headMat = (loc, n, hit) => {
    const [f, u, s] = hl(hit), as = Math.abs(s), mu = mouthU(s);
            // the red stripes running from the eyes down the cheeks, and above the eyes
    if (f > 6 && Math.abs(as - 33) < 3.2 && u > mu + 3 && u < 16) return C.mark;
    if (u > 20 && Math.abs(as - 18) < 2.4 && f > -4) return C.mark;
    return C.skin;
  };
  cv.ellipsoid(H(8, -12, 0), [hf, hu, hs], [38 * K, 15 * K, 50 * K], (loc) => (loc[1] > 0.55 && loc[0] > -0.2 ? C.lip : C.belly), opt(50));
  cv.ellipsoid(headC, [hf, hu, hs], [Rf * K, Ru * K, Rs * K], headMat, opt(51));
  // the wide mouth round the front: a dark line, red lips above and below (on whatever surface is in front)
  for (let s = -Rs * 0.92; s <= Rs * 0.92; s += 0.5) {
    const mu = mouthU(s), q = 1 - (mu / Ru) ** 2 - (s / Rs) ** 2;
    if (q <= 0) continue;
    const f = Rf * Math.sqrt(q) + 1, n = norm(add(add(scl(hf, f / Rf), scl(hu, mu / Ru * 0.3)), scl(hs, s / Rs)));
    for (const [du, col] of [[3, S.lip], [2, S.lip], [-2, S.lip], [-3, S.lip], [0, "#3a1418"], [-1, "#3a1418"]]) cv.decal(H(f, mu + du, s), col, 1, n);
  }
  // nostrils, warts on top
  for (const s of [1, -1]) cv.decal(H(Rf * 0.93, 4, s * 8), "#3a1418", 1, hf);
  for (const [a, b, c] of [[-10, 26, 12], [2, 27, -8], [-20, 22, -22], [-6, 24, 30], [12, 24, 4], [-24, 20, 26], [-14, 26, -2]]) cv.decal(H(a, b, c), S.skinD, 2, hu);
  // the eyes: bumps on top, yellow with a black horizontal pupil, ringed bright red; brow ridges over them
  for (const s of [1, -1]) {
    const ec = H(16, 24, s * 33), eDir = norm(add(add(scl(hf, 0.78), scl(hs, s * 0.58)), scl(hu, 0.22)));
    const eUp = norm(sub(hu, scl(eDir, dot(hu, eDir))));
    cv.ellipsoid(ec, [hf, hu, hs], [13 * K, 11 * K, 12 * K], (loc, n) => {
      const c = dot(n, eDir);
      if (c > 0.58) return Math.abs(dot(n, eUp)) < 0.13 && c > 0.72 ? C.pupil : C.eye;
      if (c > 0.46) return C.mark;
      return C.skin;
    }, opt(52));
    cv.ellipsoid(H(12, 33, s * 31), [hf, hu, hs], [13 * K, 4.5 * K, 13 * K], (loc) => (loc[0] > 0.55 ? C.mark : C.skin), opt(53));
  }
  // the scar over his left eye (s < 0): a pale cut from the brow down across the eye
  for (let t = 0; t <= 1; t += 0.04) cv.decal(lerp3(H(21, 42, -27), H(24, 8, -39), t), S.scar, 1, norm(add(hf, scl(hs, -0.6))));
  // the kiseru in the left corner of the mouth: a thin stem, a brass bowl
  const pBase = H(Rf * 0.6, mouthU(Rs * 0.8) - 1, -Rs * 0.8), pTip = add(pBase, add(add(scl(hf, 24 * K), scl(hu, -14 * K)), scl(hs, -8 * K)));
  cv.bone(pBase, pTip, 1.5 * K, () => C.pipe, opt(54));
  cv.ellipsoid(add(pTip, scl(hu, 2 * K)), [hf, hu, hs], [4.5 * K, 4 * K, 4.5 * K], (loc) => (loc[1] > 0.6 ? [70, 50, 40] : C.bowl), opt(55));
  return { T, headC, swordHand, bladeDir };
}

// a pixel of a smear: drawn over empty pixels and over parts farther than it, as its own part (so it gets an outline)
function streak(cv, p, col) {
  const [sx, sy, sz] = cv.proj(p);
  const x = Math.floor(sx), y = Math.floor(sy);
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return;
  const k = y * cv.w + x;
  if (cv.col[k] && cv.z[k] > sz) return;
  cv.col[k] = col; cv.z[k] = sz; cv.part[k] = 990;
}

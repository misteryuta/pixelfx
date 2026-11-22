// The Complete Body Susanoo (helper, not an effect). Narutopedia: the final stage, colossal (tailed-beast size, able to
// level mountains): a tengu-nosed head, robes and ornate armour, legs, and wings (its second pair of arms becomes the
// wings); every Susanoo has two sets of arms, six fingers on each hand, at least one sword.
// Madara's is dark blue: a long tengu nose, two lines running from the mouth down the chin, hair tied up at the sides;
// a katana drawn from a sheath held at its hip; in the anime its armour is a lattice of plates over a striped hakama,
// a round crest on the belt, and blue chakra flames pour off its back like wings.
// Sasuke's is purple: a crow-billed (karasu tengu) helmet, two spikes over each eye, a slit across the mouth, three
// gaps on each cheek and one on the chin; its bow is on the left wrist, its arrows drawn from an orb in the right hand;
// with the tailed beasts' chakra (Indra Susanoo) lightning pours from its back.
//
// Here it is drawn in its own space (feet on the ground at (x, y), facing right, about 270 px tall at s = 1), part by
// part through the painter so it stays crisp at any size: the flame wings behind, the far arm, the hakama and its
// stripes, the belt and crest, the lattice armour of the chest, the pauldrons, the head; then the near arm, its six-
// fingered hand and whatever it holds. Arms are two-bone IK to where the hands should be, so effects animate it by
// moving the hands (smoothly, with keyTrack) and it follows with weight.
import { hex, clamp, smooth, rand, noise2, TAU, WHITE } from "../../core/index.js";
import { drawModel, modelPoint, reachPose, holdPose, RIGS } from "./_models.js";

export const PERFECT = {
  madara: ["#040c26", "#0a1f5c", "#1a44a8", "#3a74e0", "#86bcff", "#e6f2ff"].map(hex),
  sasuke: ["#0e0624", "#2a1260", "#4e24a0", "#8050e0", "#c4a0ff", "#f4ecff"].map(hex),
  // Kakashi's (with both of Obito's Mangekyou, in the war against Kaguya): a cold blue-cyan
  kakashi: ["#04141e", "#0c3a54", "#1a6a90", "#38a8d0", "#96e4ff", "#ecfcff"].map(hex),
};

// two-bone IK: elbow between shoulder S and hand H, bones L, bent toward side bend (+1 / -1)
function elbowOf(S, H, L, bend) {
  const dx = H[0] - S[0], dy = H[1] - S[1], d = Math.min(Math.hypot(dx, dy), 2 * L - 0.01) || 1, h = Math.sqrt(Math.max(0, L * L - (d / 2) ** 2));
  return [S[0] + dx / 2 - (dy / d) * h * bend, S[1] + dy / 2 + (dx / d) * h * bend];
}

/**
 * Draw it. o: { kind, x, y, s, t, form (0..1: how materialised; below 1 it shimmers in dithered), near: [hx, hy] the
 * primary right hand in its own unscaled space, far: [hx, hy] the primary left hand, nearBend, farBend, lean (radians,
 * + forward), wings (0..1), sheath (true: a sheath at the left hip in a secondary hand), blade: { a, len } a katana in
 * the near hand (a: angle in its space), bow: (0..1) the bow on the far wrist, pull: (0..1) how far it is drawn,
 * lightning: (0..1) lightning off its back, layer: "back" | "front" (front = the near arm and what it holds) }.
 * Returns the joints in effect space, for effects to attach things: { near, far, nearE, farE, head, chest, blade tip }.
 */
function drawPerfectProc(p, o) {
  const C = PERFECT[o.kind] ?? PERFECT.madara, s = o.s ?? 1, t = o.t ?? 0, form = clamp(o.form ?? 1), lean = o.lean ?? 0;
  const ox = o.x ?? 0, oy = o.y ?? 0, cl = Math.cos(lean), sl = Math.sin(lean);
  // its own space -> effect space: lean about the hips (y = -110), then scale and place
  const T = (x, y) => {
    const hy = y + 110, rx = y < -110 ? x * cl + hy * sl : x, ry = y < -110 ? -x * sl + hy * cl - 110 : y;
    return [ox + rx * s, oy + ry * s];
  };
  const k = form >= 1 ? 1 : form, a = k;
  const P = (pts, c, al = a) => p.poly(pts.map(([x, y]) => T(x, y)), c, al);
  const L = (x0, y0, x1, y1, c, al = a) => { const A = T(x0, y0), B = T(x1, y1); p.line(A[0], A[1], B[0], B[1], c, al); };
  const B = (x0, y0, x1, y1, w, c, al = a) => { const A = T(x0, y0), Bb = T(x1, y1); p.beam(A[0], A[1], Bb[0], Bb[1], w * s, c, al); };
  const flick = Math.floor(t * 16);
  const SN = [-34, -196], SF = [-38 + 4, -194], SR = [34, -196];
  const near = o.near ?? [70, -150], far = o.far ?? [-60, -130];
  const nearS = [40, -196], farS = [-46, -194];
  const nearE = elbowOf(nearS, near, 58, o.nearBend ?? 1), farE = elbowOf(farS, far, 58, o.farBend ?? -1);
  const out = { near: T(...near), far: T(...far), nearE: T(...nearE), farE: T(...farE), head: T(4, -246), chest: T(0, -165), T };
  void SN; void SF; void SR;

  const arm = (S, E, H, near_) => {
    const w = near_ ? 18 : 15, c0 = near_ ? C[2] : C[1], c1 = near_ ? C[3] : C[2];
    // upper arm and forearm: dark rim, chakra body, a bright seam along the top; armoured bracer on the forearm
    B(S[0], S[1], E[0], E[1], w + 3, C[0]);
    B(E[0], E[1], H[0], H[1], w + 2, C[0]);
    B(S[0], S[1], E[0], E[1], w, c0);
    B(E[0], E[1], H[0], H[1], w - 1, c0);
    L(S[0], S[1] - 4, E[0], E[1] - 4, c1);
    // segmented armour plates down the upper arm
    for (let i = 1; i < 4; i++) { const u = i / 4, x = S[0] + (E[0] - S[0]) * u, y = S[1] + (E[1] - S[1]) * u, dx = E[0] - S[0], dy = E[1] - S[1], dn = Math.hypot(dx, dy) || 1; L(x - (dy / dn) * w * 0.45, y + (dx / dn) * w * 0.45, x + (dy / dn) * w * 0.45, y - (dx / dn) * w * 0.45, C[0]); }
    const mx = E[0] + (H[0] - E[0]) * 0.55, my = E[1] + (H[1] - E[1]) * 0.55;
    B(E[0] + (H[0] - E[0]) * 0.2, E[1] + (H[1] - E[1]) * 0.2, mx, my, w + 1, c1);
    
    // the hand: a broad palm and six fingers closed round the grip
    const hp = T(H[0], H[1]);
    p.circle(hp[0], hp[1], 10 * s, C[0], a);
    p.circle(hp[0], hp[1], 8.5 * s, c1, a);
    for (let i = 0; i < 6; i++) { const ang = -1.2 + i * 0.42; const f = T(H[0] + Math.cos(ang) * 9, H[1] + Math.sin(ang) * 9); p.circle(f[0], f[1], 2.6 * s, i % 2 ? C[3] : C[4], a); }
    // the elbow guard
    const e = T(E[0], E[1]);
    p.circle(e[0], e[1], 9 * s, C[0], a);
    p.circle(e[0], e[1], 7.5 * s, c1, a);
  };

  if (o.layer !== "front") {
    // ---- the wings: blue chakra flames pouring up and back off its shoulders and back
    const wk = (o.wings ?? 1) * k;
    if (wk > 0) {
      const [wx0, wy0] = T(-30, -200), [wx1, wy1] = T(-150, -330), R = 170 * s;
      p.shade(Math.min(wx0, wx1) - 60 * s, wy1 - 60 * s, wx0 + 40 * s, oy - 60 * s, (x, y, out2) => {
        // a teardrop of flame from the back, leaning back, licked by noise; tongues at its edge
        const u = clamp(((x - wx0) * (wx1 - wx0) + (y - wy0) * (wy1 - wy0)) / ((wx1 - wx0) ** 2 + (wy1 - wy0) ** 2), -0.2, 1.2);
        const cx = wx0 + (wx1 - wx0) * u, cy = wy0 + (wy1 - wy0) * u, d = Math.hypot(x - cx, y - cy) / R;
        const width = 0.42 * Math.sin(Math.PI * clamp(u + 0.15, 0, 1)) + 0.05;
        const n = noise2(x * 0.03 / s + t * 0.6, y * 0.03 / s - t * 2.4, 7) * 0.22 + noise2(x * 0.08 / s, y * 0.08 / s - t * 5, 3) * 0.1;
        const e = width * wk + n;
        if (d > e) return;
        out2.a = wk;
        out2.k = 0.25;
        const r = d / Math.max(0.01, e);
        return r > 0.86 ? C[4] : r > 0.6 ? C[3] : n > 0.08 ? C[3] : C[2];
      });
      // the second pair of arms in the wings: long ribs of chakra fanning back
      for (let i = 0; i < 4; i++) { const ang = -2.2 - i * 0.22 + Math.sin(t * 2 + i) * 0.04; B(-28, -196, -28 + Math.cos(ang) * (120 + i * 18), -196 + Math.sin(ang) * (120 + i * 18), 5, C[3], wk >= 1 ? 1 : wk); }
    }
    // ---- lightning off its back (Indra)
    if ((o.lightning ?? 0) > 0) for (let i = 0; i < 5; i++) {
      let [x, y] = T(-20, -200), ang = -2.4 + rand(flick, i) * 1.6;
      for (let j = 0; j < 8; j++) { const nx = x + Math.cos(ang) * 14 * s, ny = y + Math.sin(ang) * 14 * s; p.line(x, y, nx, ny, j < 2 ? WHITE : C[4], o.lightning); x = nx; y = ny; ang += (rand(flick + j, i) - 0.5) * 1.2; }
    }
    // ---- the far arm, behind the body
    arm(farS, farE, far, false);
    // the bow on the far wrist (Sasuke): two great recurved limbs of chakra, the string to the near hand
    if ((o.bow ?? 0) > 0) {
      const bk = o.bow, H = far, dx = H[0] - farE[0], dy = H[1] - farE[1], dn = Math.hypot(dx, dy) || 1, ux = dx / dn, uy = dy / dn, nx = -uy, ny = ux;
      const back = 18 + 20 * (o.pull ?? 0), len = 120 * bk;
      const tip = (sd) => [H[0] + nx * sd * len - ux * back, H[1] + ny * sd * len - uy * back];
      const mid = (sd) => [H[0] + nx * sd * len * 0.5 + ux * 10, H[1] + ny * sd * len * 0.5 + uy * 10];
      for (const sd of [-1, 1]) {
        const m = mid(sd), e = tip(sd);
        let prev = H;
        for (let i = 1; i <= 12; i++) {
          const u = i / 12, v = 1 - u, x = v * v * H[0] + 2 * v * u * m[0] + u * u * e[0], y = v * v * H[1] + 2 * v * u * m[1] + u * u * e[1];
          B(prev[0], prev[1], x, y, 7 - u * 3, C[3]);
          L(prev[0], prev[1], x, y, C[5]);
          prev = [x, y];
        }
      }
      out.bowTips = [T(...tip(-1)), T(...tip(1))];
    }
    // ---- the hakama: a long skirt of vertical stripes, flaring to the ground; the hem
    P([[-34, -112], [28, -112], [58, 0], [-64, 0]], C[1]);
    for (let x = -30; x <= 24; x += 6) { const xb = x * 1.85 - 3; L(x, -110, xb, -2, C[2]); }
    for (let x = -27; x <= 24; x += 12) { const xb = x * 1.85 - 3; L(x, -110, xb, -2, C[3]); }
    L(-64, -1, 58, -1, C[4]);
    // hip armour: tassets hanging over the skirt, rows of small plates
    for (const [x0, x1] of [[-40, -10], [-6, 24]]) for (let r = 0; r < 3; r++) {
      const y = -110 + r * 9;
      P([[x0 - r * 2, y], [x1 + r * 2, y], [x1 + r * 3, y + 8], [x0 - r * 3, y + 8]], r % 2 ? C[2] : C[3]);
      L(x0 - r * 3, y + 8, x1 + r * 3, y + 8, C[0]);
    }
    // ---- the torso: broad shoulders tapering to the waist, an armoured cuirass in plate bands with a lattice
    P([[-56, -204], [50, -204], [44, -170], [28, -122], [-32, -122], [-48, -170]], C[2]);
    for (let r = 0; r < 5; r++) {
      const y = -196 + r * 15, w = 50 - r * 4.5;
      L(-w, y, w - 4, y, C[1]);
    }
    for (let i = -7; i <= 7; i++) {
      const x0 = i * 9;
      L(Math.max(-44, x0 - 14), -190, Math.max(-30, Math.min(26, x0 + 14)), -126, C[3]);
      L(Math.min(40, x0 + 14), -190, Math.max(-30, Math.min(26, x0 - 14)), -126, C[3]);
    }
    // the robe's collar crossing in a V, and the edges of the cuirass
    P([[-22, -206], [-12, -206], [0, -152], [-6, -150]], C[4]);
    P([[24, -206], [14, -206], [2, -152], [8, -150]], C[4]);
    L(-56, -204, -48, -170, C[0]); L(-48, -170, -32, -122, C[0]);
    L(50, -204, 44, -170, C[0]); L(44, -170, 28, -122, C[0]);
    // ---- the belt and its round crest
    P([[-34, -126], [30, -126], [30, -112], [-34, -112]], C[0]);
    L(-34, -125, 30, -125, C[3]);
    L(-34, -113, 30, -113, C[3]);
    const cr = T(-2, -119);
    p.circle(cr[0], cr[1], 8 * s, C[0], a);
    p.circle(cr[0], cr[1], 7 * s, C[4], a);
    p.circle(cr[0], cr[1], 4.5 * s, C[1], a);
    for (let i = 0; i < 3; i++) { const an = (i * TAU) / 3 + 0.4; p.circle(cr[0] + Math.cos(an) * 2.5 * s, cr[1] + Math.sin(an) * 2.5 * s, 1.2 * s, C[5], a); }
    // the sheath in a secondary hand at the left hip (Madara)
    if (o.sheath) { B(-40, -124, 34, -80, 8, C[0]); B(-40, -124, 34, -80, 6, C[3]); L(-40, -126, 34, -82, C[5]); B(-46, -128, -36, -122, 9, C[0]); }
    // ---- the high collar round the neck
    P([[-18, -222], [20, -222], [26, -204], [-24, -204]], C[1]);
    L(-18, -222, 20, -222, C[4]);
    // ---- the pauldrons: big layered plates (sode) hanging off both shoulders
    for (const [px, sd] of [[-50, -1], [44, 1]]) {
      for (let l = 0; l < 4; l++) {
        const y = -214 + l * 9, w = 22 + l * 2, x = px + sd * l * 2;
        P([[x - w * 0.5 - (sd < 0 ? 6 : 0), y], [x + w * 0.5 + (sd > 0 ? 6 : 0), y], [x + w * 0.55 + (sd > 0 ? 8 : 0), y + 10], [x - w * 0.55 - (sd < 0 ? 8 : 0), y + 10]], l % 2 ? C[2] : C[3]);
        L(x - w * 0.55 - (sd < 0 ? 8 : 0), y + 10, x + w * 0.55 + (sd > 0 ? 8 : 0), y + 10, C[0]);
        L(x - w * 0.5, y + 1, x + w * 0.5, y + 1, C[4]);
      }
    }
    // ---- the head: a hood/helmet (yamabushi), the face plate, per kind the nose and ornaments
    const hx = 4, hy = -246, hs = 1.35, H2 = (x, y) => [hx + x * hs, hy + y * hs];
    P([H2(-20, 22), H2(-24, -4), H2(-12, -26), H2(12, -26), H2(22, -6), H2(18, 22)], C[1]);
    P([H2(-12, 20), H2(-12, -2), H2(15, -4), H2(15, 20)], C[2]);
    L(...H2(-24, -4), ...H2(22, -6), C[3]);
    if (o.kind === "kakashi") {
      // a masked face like his own: the cloth up over the nose, a forehead plate with a scratched line, two swept fins
      P([H2(-12, 6), H2(16, 4), H2(16, 20), H2(-12, 20)], C[1]);
      L(...H2(-12, 6), ...H2(16, 4), C[4]);
      L(...H2(14, 6), ...H2(18, 12), C[3]);
      P([H2(-16, -16), H2(18, -18), H2(18, -8), H2(-16, -6)], C[3]);
      L(...H2(-14, -12), ...H2(16, -14), C[5]);
      L(...H2(-4, -16), ...H2(6, -9), C[0]);
      for (const [sx, sd] of [[-22, -1], [20, 1]]) P([H2(sx, -6), H2(sx + sd * 22, -30 + Math.sin(t * 3) * 1.5), H2(sx, 2)], C[2]);
    } else if (o.kind === "sasuke") {
      // crow beak, two spikes over each eye, the slit mouth, three gaps on the cheek, one on the chin
      P([H2(12, -3), H2(48, 12), H2(30, 10), H2(13, 9)], C[3]);
      L(...H2(12, -3), ...H2(48, 12), C[5]);
      for (const ex of [-3, 8]) { P([H2(ex - 3, -8), H2(ex, -8), H2(ex - 2, -24)], C[4]); P([H2(ex + 2, -8), H2(ex + 5, -8), H2(ex + 4, -20)], C[4]); }
      L(...H2(-10, 13), ...H2(13, 13), C[0]);
      for (let i = 0; i < 3; i++) L(...H2(-9, 4 + i * 3), ...H2(-5, 4 + i * 3), C[0]);
      L(...H2(2, 16), ...H2(2, 19), C[0]);
    } else {
      // long tengu nose, hair tied up at the sides, two lines from the mouth down the chin, a crest on the brow
      P([H2(12, -3), H2(46, 2), H2(13, 7)], C[3]);
      L(...H2(12, -3), ...H2(46, 2), C[5]);
      for (const [sx, sd] of [[-22, -1], [18, 1]]) for (let i = 0; i < 4; i++) P([H2(sx, -8 + i * 6), H2(sx + sd * (16 + i * 2), -26 + i * 5 + Math.sin(t * 3 + i) * 1.5), H2(sx, -2 + i * 6)], i % 2 ? C[2] : C[3]);
      L(...H2(2, 11), ...H2(0, 19), C[0]);
      L(...H2(9, 11), ...H2(9, 19), C[0]);
      P([H2(-5, -26), H2(5, -26), H2(0, -40)], C[3]);
    }
    const hyE = hy;
    // eyes: two hard glowing slits
    for (const ex of [hx - 4 * hs, hx + 9 * hs]) { const e = T(ex, hyE + 2 * hs); p.rect(e[0] - 2 * s, e[1], 4 * s, 1.5 * s + 1, WHITE, a); p.glow(e[0], e[1], 8 * s, C[4], 0.7 * a); }
    // the whole outline glowing
    const c0 = T(0, -150);
    p.glow(c0[0], c0[1], 170 * s, C[3], 0.18 * a);
  }

  if (o.layer === "front" || o.layer === "all") {
    // ---- the near arm and what it holds
    if (!o.onlyBlade) arm(nearS, nearE, near, true);
    if (o.blade && o.blade.len > 1) {
      const ba = o.blade.a, H = near, ux = Math.cos(ba), uy = Math.sin(ba), nx = -uy, ny = ux;
      // never into the floor: a blade pointing down stops at the ground
      const bl = uy > 0.05 ? Math.min(o.blade.len, (-3 - H[1]) / uy) : o.blade.len;
      const tip = [H[0] + ux * bl, H[1] + uy * bl];
      // the grip behind the hand, the guard, the long straight blade with a bright ridge and edge
      B(H[0] - ux * 18, H[1] - uy * 18, H[0], H[1], 6, C[0]);
      B(H[0] + nx * 10, H[1] + ny * 10, H[0] - nx * 10, H[1] - ny * 10, 4, C[4]);
      const A = T(H[0] + ux * 6, H[1] + uy * 6), Tp = T(...tip);
      p.glowLine(A[0], A[1], Tp[0], Tp[1], 22 * s, C[3], 0.55 * a);
      B(H[0] + ux * 6, H[1] + uy * 6, tip[0] - ux * 8, tip[1] - uy * 8, 9, C[3]);
      B(H[0] + ux * 6 + nx * 2, H[1] + uy * 6 + ny * 2, tip[0] - ux * 8, tip[1] - uy * 8, 4, C[5]);
      P([[tip[0] - ux * 8 + nx * 4.5, tip[1] - uy * 8 + ny * 4.5], [tip[0], tip[1]], [tip[0] - ux * 8 - nx * 4.5, tip[1] - uy * 8 - ny * 4.5]], C[4]);
      out.tip = Tp;
    }
  }
  return out;
}

// the user's models (2026-11-22) for the Complete Body Susanoo; per: model px per unit of Perfect scale s; the rig's
// sword arm, what it holds (hidden while the drawn chakra blade is out, for Madara), the far arm; rest: where the
// procedural hands rest (the model's hands rest where the sprite has them, and move by as much as these move)
export const PERFECT_MODEL = {
  madara: { name: "susanooMadara", view: "right", per: 1.62, arm: "arm", weapon: "katana", far: null, rest: { near: [70, -150], far: [-70, -128] }, swapBlade: true },
  sasuke: { name: "susanooSasuke", view: "front", per: 1.55, arm: "arm", weapon: "sword", far: "armR", rest: { near: [60, -140], far: [-40, -130] }, swapBlade: false },
};
// a painter that draws nothing (to compute joints without painting)
const NOOP = new Proxy({}, { get: (_, k) => (k === "cellX" || k === "cellY" ? () => 0 : () => {}) });
// effect space -> the giant's own space (the inverse of drawPerfectProc's T)
function invT(o, P) {
  const s = o.s ?? 1, lean = o.lean ?? 0, cl = Math.cos(lean), sl = Math.sin(lean), rx = (P[0] - (o.x ?? 0)) / s, ry = (P[1] - (o.y ?? 0)) / s;
  if (ry >= -110) return [rx, ry];
  const hy = ry + 110;
  return [rx * cl - hy * sl, rx * sl + hy * cl - 110];
}
const handOf = (M, part) => RIGS[M.name + "/" + M.view].parts.find((q) => q.name === part).hand;
/**
 * The model puppet of a Complete Body Susanoo (kinds with a model): its arms follow the procedural hands (by how far
 * they move from rest), the weapon rides the hand along the blade's angle (or rigid, with no blade); o.weaponA fades
 * the model's own weapon. Returns { M, x, y, o (for drawModel), hand, far, angle (the blade's, on screen), joints }.
 */
export function perfectPuppet(o) {
  const M = PERFECT_MODEL[o.kind];
  if (!M) return null;
  const x = o.x ?? 0, y = o.y ?? 0, J = drawPerfectProc(NOOP, { ...o, layer: "all" }), J0 = drawPerfectProc(NOOP, { ...o, near: M.rest.near, far: M.rest.far, blade: null, layer: "all" });
  const mo = { scale: (o.s ?? 1) * M.per, rot: (o.lean ?? 0) * 0.6, pose: {} };
  const go = (part, H, H0) => {
    const h = modelPoint(M.name, M.view, x, y, mo, null, handOf(M, part));
    mo.pose[part] = reachPose(M.name, M.view, x, y, mo, part, [h[0] + H[0] - H0[0], h[1] + H[1] - H0[1]], 0.6, 1.6);
  };
  go(M.arm, J.near, J0.near);
  if (M.far) go(M.far, J.far, J0.far);
  const blade = o.blade && o.blade.len > 1, angle = blade && J.tip ? Math.atan2(J.tip[1] - J.near[1], J.tip[0] - J.near[0]) : null;
  mo.pose[M.weapon] = { ...holdPose(M.name, M.view, mo, M.arm, M.weapon, angle), a: (M.swapBlade && blade ? 0 : 1) * (o.weaponA ?? 1) };
  for (const [k, v] of Object.entries(o.pose ?? {})) mo.pose[k] = { ...(mo.pose[k] ?? {}), ...v };
  const hand = modelPoint(M.name, M.view, x, y, mo, M.arm, handOf(M, M.arm));
  return { M, x, y, o: mo, hand, far: M.far ? modelPoint(M.name, M.view, x, y, mo, M.far, handOf(M, M.far)) : null, angle, joints: J };
}
/**
 * Draw the Complete Body Susanoo. Kinds with a model (madara, sasuke): the back layer paints the model puppet (see
 * perfectPuppet), materialising by form; the front layer paints only the drawn blade, if any, from the model's hand.
 * Returns the same joints as before (near = the model's hand), plus tip. Other kinds (kakashi): the procedural giant.
 */
export function drawPerfect(p, o) {
  const M = PERFECT_MODEL[o.kind];
  if (!M) return drawPerfectProc(p, o);
  const P = perfectPuppet(o), out = { ...P.joints, near: P.hand, puppet: P };
  if ((o.layer === "front" || o.layer === "all") && o.blade && o.blade.len > 1 && M.swapBlade) {
    const r = drawPerfectProc(p, { ...o, near: invT(o, P.hand), layer: "front", onlyBlade: true });
    if (r.tip) out.tip = r.tip;
  }
  if (o.layer !== "front") {
    const form = clamp(o.form ?? 1);
    if (form > 0.01) drawModel(p, M.name, M.view, P.x, P.y, { ...P.o, form: smooth(0, 1, form), glow: (PERFECT[o.kind] ?? PERFECT.madara)[3] });
  }
  return out;
}

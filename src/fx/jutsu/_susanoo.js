// Susanoo, the avatar of the Mangekyou (helper, not an effect). Narutopedia: it forms round its user in stages, each
// layered over the last: a ribcage, a skeleton with arms, musculature, then armour (a yamabushi with a tengu face).
// Early forms are only the upper half; all have two pairs of arms. Colors (anime): Itachi red skeleton and armour,
// orange humanoid; Sasuke purple; Madara blue. Itachi's: a long-nosed tengu hood, magatama earrings, the Sword of
// Totsuka in the primary right hand, its sake jar in the second right hand, the Yata Mirror in the primary left.
// Sasuke's: demonic horns, a chin appendage, a malevolent grin of jagged teeth; a bow on the left wrist, arrows drawn
// with the right hand.
//
// Here it is a rig, not a picture: a waist, a spine that leans, shoulders that turn with the torso (3/4 view facing
// right: the right arms on the near side, screen left; the left arm on the far side, toward the target), a head, and
// arms solved with two-bone IK from where the hands are. Effects pose it over time with keyTrack() (smooth Hermite
// keys, so swings carry their speed through and settle), and drawSusanoo() paints whichever stages have formed:
// ribs round the user, the bones (skull with glowing eyes and a toothy jaw), the muscle growing out from the chest
// in striated bundles, the armour last; chakra flames lick off its outline the whole time.
import { hex, clamp, smooth, rand, noise2, TAU, WHITE } from "../../core/index.js";
import { drawModel, modelPoint, reachPose, holdPose, RIGS } from "./_models.js";

export const SUSANOO = {
  itachi: ["#3a0806", "#8a1a10", "#d8461c", "#ff8a3a", "#ffd8a0"].map(hex),
  sasuke: ["#1a0a36", "#4a2490", "#8a5ae0", "#c8a8ff", "#f0e6ff"].map(hex),
  madara: ["#0a1636", "#1a3a8a", "#3a78e0", "#8ac0ff", "#e0f0ff"].map(hex),
};
const EYES = { itachi: [hex("#fff4c8"), WHITE], sasuke: [hex("#ffe040"), hex("#fff6b0")], madara: [hex("#ffe040"), hex("#fff6b0")] };

/**
 * Keys over time: [[t, { name: number, ... }], ...]; every key inherits what the one before set. Numbers are joined by
 * cubic Hermite curves whose slopes carry the motion through keys that keep going the same way and come to rest on keys
 * where it turns, so a wind-up settles, a swing keeps its speed and a follow-through eases out.
 */
export function keyTrack(keys) {
  const full = [];
  let prev = {};
  for (const [t, v] of keys) full.push([t, (prev = { ...prev, ...v })]);
  const names = Object.keys(prev);
  const slope = (j, n) => {
    if (j <= 0 || j >= full.length - 1) return 0;
    const [ta, A] = full[j - 1], [tc, Cc] = full[j], [tb, B] = full[j + 1];
    const s1 = (Cc[n] - A[n]) / (tc - ta || 1e-6), s2 = (B[n] - Cc[n]) / (tb - tc || 1e-6);
    return s1 * s2 <= 0 ? 0 : (s1 + s2) / 2;
  };
  return (t) => {
    if (t <= full[0][0]) return { ...full[0][1] };
    if (t >= full[full.length - 1][0]) return { ...full[full.length - 1][1] };
    let i = 0;
    while (t > full[i + 1][0]) i++;
    const [t0, a] = full[i], [t1, b] = full[i + 1], h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u, out = {};
    for (const n of names) {
      const p0 = a[n], p1 = b[n];
      if (typeof p0 !== "number" || typeof p1 !== "number") {
        out[n] = p1 ?? p0;
        continue;
      }
      out[n] = (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * slope(i, n) * h + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * slope(i + 1, n) * h;
    }
    return out;
  };
}

// two-bone IK: shoulder S to hand H, each bone L: the elbow, bent to one side (bend +1 / -1, anything between straightens it)
function elbow(S, H, L, bend) {
  const dx = H[0] - S[0], dy = H[1] - S[1], d = Math.min(Math.hypot(dx, dy), 2 * L - 0.01) || 1, h = Math.sqrt(Math.max(0, L * L - (d / 2) ** 2));
  return [S[0] + dx / 2 - (dy / d) * h * bend, S[1] + dy / 2 + (dx / d) * h * bend];
}
export function elbowOf(sx, sy, hx, hy, L = 26) {
  return elbow([sx, sy], [hx, hy], L, 1);
}

/**
 * The rig in a pose q: { lean (radians, + toward the target), twist (-1 turned away .. 1 turned in), head (tilt),
 * x, y (the waist), near: [angle, reach] or nearH: [x, y], nearBend, far / farH, farBend, low / lowH, lowBend }.
 * Arm angles are measured from the torso (0 straight out toward the target, + downward); reach 0..1 of the arm's length.
 */
export function rigOf(q) {
  const lean = q.lean ?? 0, tw = q.twist ?? 0, up = [Math.sin(lean), -Math.cos(lean)], rt = [Math.cos(lean), Math.sin(lean)];
  const W = [q.x ?? -4, q.y ?? -6], at = (o, a, b) => [o[0] + up[0] * a + rt[0] * b, o[1] + up[1] * a + rt[1] * b];
  const N = at(W, 60, 0), Ch = at(W, 36, 2), hl = lean + (q.head ?? 0), hup = [Math.sin(hl), -Math.cos(hl)], hrt = [Math.cos(hl), Math.sin(hl)];
  const Hd = [N[0] + hup[0] * 15 + hrt[0] * 3, N[1] + hup[1] * 15 + hrt[1] * 3];
  const arm = (S, spec, abs, L, bend, Eov) => {
    let H;
    if (abs) H = abs;
    else {
      const A = spec[0] + lean, d = clamp(spec[1], 0.12, 0.985) * 2 * L;
      H = [S[0] + Math.cos(A) * d, S[1] + Math.sin(A) * d];
    }
    const dx = H[0] - S[0], dy = H[1] - S[1], d = Math.hypot(dx, dy);
    if (d > 2 * L * 0.985) H = [S[0] + (dx / d) * 2 * L * 0.985, S[1] + (dy / d) * 2 * L * 0.985];
    return { S, E: Eov ?? elbow(S, H, L, bend), H, L };
  };
  const nearS = at(N, -5, -21 + 10 * tw), farS = at(N, -2, 18 - 6 * tw), lowS = at(Ch, -10, -15 + 7 * tw);
  return {
    q, lean, up, rt, W, N, Ch, Hd, hup, hrt,
    near: arm(nearS, q.near ?? [1.2, 0.6], q.nearH, 27, q.nearBend ?? 1, q.nearE),
    far: arm(farS, q.far ?? [1, 0.5], q.farH, 25, q.farBend ?? 1),
    low: q.low || q.lowH ? arm(lowS, q.low ?? [1.4, 0.5], q.lowH, 19, q.lowBend ?? 1) : null,
  };
}

// ---- the shapes: tapered capsules, ra at a to rb at b. sd < 0 inside; u along it, v across (-1..1, + to its right)
function cap(a, b, ra, rb) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-6, L = Math.sqrt(L2);
  return { a, dx, dy, L2, L, ra, rb, nx: -dy / L, ny: dx / L };
}
function sdCap(c, x, y, o) {
  const px = x - c.a[0], py = y - c.a[1], u = clamp((px * c.dx + py * c.dy) / c.L2), qx = px - c.dx * u, qy = py - c.dy * u, r = c.ra + (c.rb - c.ra) * u, d = Math.hypot(qx, qy);
  if (o) {
    o.u = u;
    o.v = (qx * c.nx + qy * c.ny) / r;
    o.r = r;
    o.ox = d ? qx / d : 0;
    o.oy = d ? qy / d : -1;
  }
  return d - r;
}
const inPoly = (x, y, P) => {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) if (P[i][1] > y !== P[j][1] > y && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
  return c;
};

/**
 * Paint the Susanoo of rig R (rigOf). st: { ribs, bones, flesh, armour } each 0..1, how far that stage has formed;
 * fade 0..1 takes the whole thing away. layer "back" (call from drawBack, behind its user) paints everything but the
 * front halves of the ribs; layer "front" (call from draw) paints those over the user. mid(p) is called between the
 * far side (far arm, torso, head) and the near arms, for things held between them (the Yata Mirror).
 */
function drawSusanooProc(p, t, R, { kind = "itachi", st = {}, fade = 0, layer = "back", mid = null } = {}) {
  const C = SUSANOO[kind], k = 1 - fade, f = Math.floor(t * 20);
  const ribs = clamp(st.ribs ?? 0), bones = clamp(st.bones ?? 0), flesh = clamp(st.flesh ?? 0), armour = clamp(st.armour ?? 0);
  if (k <= 0 || ribs + bones + flesh <= 0) return;
  // the ribcage: ovals round the user's chest, each growing out from the spine at its back; the halves behind him first
  const cage = (front) => {
    if (ribs <= 0) return;
    const a = k * (ribs < 0.35 ? 0.45 : 1) * (front ? 0.85 * (1 - smooth(0.2, 0.7, flesh)) : 1), col = ribs < 0.35 ? C[1] : C[3];
    for (let i = 0; i < 5; i++) {
      const s = 14 + i * 8.5, c = [R.W[0] + R.up[0] * s + R.rt[0] * 2, R.W[1] + R.up[1] * s + R.rt[1] * 2], rx = 24 - Math.abs(i - 1.6) * 2.2, ry = 5.5;
      const grow = clamp(ribs * 1.6 - i * 0.12), span = Math.PI * grow;
      if (span <= 0.05) continue;
      // from the spine (at the back, angle -90deg) round both ways; the front half (angle 0..pi) passes in front of him
      for (let th = -Math.PI / 2 - span; th <= -Math.PI / 2 + span; th += 0.05) {
        const inFront = Math.sin(th) > 0;
        if (inFront !== front) continue;
        const x = c[0] + Math.cos(th) * rx, y = c[1] + Math.sin(th) * ry;
        p.dot(x, y, col, a);
        p.dot(x, y + 1, col, a);
        p.dot(x, y + 2, C[1], a * 0.8);
      }
    }
    if (!front) p.beam(R.W[0], R.W[1], R.N[0], R.N[1], 4, C[3], k * Math.min(1, ribs * 2) * (ribs < 0.35 ? 0.45 : 1));
  };
  if (layer === "front") return cage(true);
  p.glow(R.Ch[0], R.Ch[1] - 6, 80 * Math.min(1, ribs + bones), C[2], 0.35 * k);
  cage(false);

  // the parts of the body, far side first: the far arm, then torso and head, then the near arms
  const far = [cap(R.far.S, R.far.E, 7.5, 6), cap(R.far.E, R.far.H, 6, 5), cap(R.far.H, R.far.H, 5.5, 5.5)];
  const body = [cap(R.W, R.Ch, 14, 23), cap(R.Ch, R.N, 23, 14), cap(R.N, R.near.S, 10, 9), cap(R.N, R.far.S, 9, 8), cap(R.N, R.Hd, 8, 8), cap(R.Hd, R.Hd, 12.5, 12.5)];
  const near = [cap(R.near.S, R.near.E, 9, 7.5), cap(R.near.E, R.near.H, 7.5, 6), cap(R.near.H, R.near.H, 6.5, 6.5)];
  if (R.low) near.push(cap(R.low.S, R.low.E, 6, 5), cap(R.low.E, R.low.H, 5, 4.5), cap(R.low.H, R.low.H, 5, 5));
  const o = {};
  const sdOf = (list, x, y, out) => {
    let best = 1e9;
    for (const c of list) {
      const d = sdCap(c, x, y);
      if (d < best) {
        best = d;
        if (out) sdCap(c, x, y, out);
      }
    }
    return best;
  };
  // the armour's shapes (kind-specific), in the torso's frame
  const loc = (x, y, c) => [(x - c[0]) * R.rt[0] + (y - c[1]) * R.rt[1], (x - c[0]) * R.up[0] + (y - c[1]) * R.up[1]];
  const hoodPts = (() => {
    const H = R.Hd, U = R.hup, T = R.hrt, P = (a, b) => [H[0] + U[0] * a + T[0] * b, H[1] + U[1] * a + T[1] * b];
    return kind === "itachi" ? [P(-10, -15), P(4, -16), P(18, -8), P(25, -12), P(19, 2), P(13, 12), P(0, 15), P(-12, 13)] : [P(-10, -14), P(6, -16), P(16, -10), P(14, 4), P(8, 13), P(-4, 15), P(-12, 12)];
  })();
  const nosePts = (() => {
    const H = R.Hd, U = R.hup, T = R.hrt, P = (a, b) => [H[0] + U[0] * a + T[0] * b, H[1] + U[1] * a + T[1] * b];
    return kind === "itachi" ? [P(4, 6), P(-1, 36), P(-5, 7)] : [P(-6, 4), P(-16, 8), P(-8, 0)];
  })();
  // the mantle: broad over the shoulders, drawn in at the waist, hanging a little lower at the back
  const mantleE = (lx, ly) => {
    const hw = 20 + 13 * clamp((ly + 24) / 40) - (lx < 0 ? -3 : 0), vy = (ly - 5) / (ly > 5 ? 25 : 31);
    return (lx / hw) ** 2 + vy * vy;
  };
  const mantle = (x, y) => {
    const [lx, ly] = loc(x, y, R.Ch);
    return mantleE(lx, ly) < 1;
  };
  const armourAt = (x, y) => {
    if (armour <= 0) return 0;
    if (inPoly(x, y, hoodPts)) return 1;
    if (inPoly(x, y, nosePts)) return 2;
    if (mantle(x, y)) return 3;
    return 0;
  };
  // the flesh grows out from the chest: a ragged front; the armour hardens after it, from the chest out too
  const reachF = flesh * 120, reachA = armour * 130;
  const grownF = (x, y) => Math.hypot(x - R.Ch[0], y - R.Ch[1]) + 6 * noise2(x * 0.15, y * 0.15 + t * 2, 6) < reachF;
  const grownA = (x, y) => Math.hypot(x - R.Ch[0], y - R.Ch[1]) + 6 * noise2(x * 0.12, y * 0.12 - t * 2, 9) < reachA;
  // the box everything fits in
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const P of [R.W, R.N, R.Hd, R.near.S, R.near.E, R.near.H, R.far.S, R.far.E, R.far.H, ...(R.low ? [R.low.E, R.low.H] : []), ...hoodPts, ...nosePts]) {
    x0 = Math.min(x0, P[0]); y0 = Math.min(y0, P[1]); x1 = Math.max(x1, P[0]); y1 = Math.max(y1, P[1]);
  }
  (x0 -= 44), (y0 -= 30), (x1 += 44), (y1 = Math.min(6, y1 + 16));

  // one pass for a group of parts: muscle, armour, the burning outline
  const paint = (list, withArmour) => {
    if (flesh <= 0) return;
    p.shade(x0, y0, x1, y1, (x, y, out) => {
      if (y > 2) return;
      const d = sdOf(list, x, y, o), arm = withArmour && grownA(x, y) ? armourAt(x, y) : 0;
      if (d > 0 && !arm) {
        // chakra flames licking up off the top of the outline
        const lick = 2 + 6 * noise2(x * 0.22, y * 0.12 + t * 7, 4);
        if (grownF(x, y) && sdOf(list, x, y + lick) < 0 && noise2(x * 0.4, y * 0.3 + t * 9, 8) > 0.05) {
          out.a = k * 0.9;
          out.k = 0.25;
          return noise2(x * 0.3, y * 0.5 + t * 11, 2) > 0.55 ? C[4] : C[3];
        }
        return;
      }
      if (!grownF(x, y)) return;
      out.a = k;
      // the growing front: a bright seam where new flesh is forming
      const dd = Math.hypot(x - R.Ch[0], y - R.Ch[1]);
      if (flesh < 1 && reachF - dd < 4 + 4 * noise2(x * 0.15, y * 0.15 + t * 2, 6)) {
        out.k = 0.25;
        return C[3];
      }
      if (arm) {
        if (armour < 1 && reachA - dd < 4) {
          out.k = 0.4;
          return C[4];
        }
        return armourPx(x, y, arm);
      }
      // muscle: bundles striated along each limb, lit from the upper left, a bright rim of chakra on top, dark below
      if (d > -1.6) return o.oy < 0.3 ? C[4] : C[1];
      const lit = -(o.ox * 0.55 + o.oy * 0.85) * (1 - (d + o.r) / o.r) + 0.15;
      const fiber = Math.abs(Math.sin((o.v * 2.1 + o.u * (o.r > 12 ? 2.2 : 1.3)) * Math.PI)) < 0.17;
      const base = lit > 0.45 ? 3 : lit > -0.05 ? 2 : 1;
      return C[Math.max(0, base - (fiber ? 1 : 0))];
    });
  };
  // the armour, pixel by pixel: Itachi's hood and mantle of swept cloth, Sasuke's horned helm and plates
  const armourPx = (x, y, part) => {
    const [lx, ly] = loc(x, y, R.Ch);
    if (part === 2) {
      // the tengu nose (Itachi) / the chin spike (Sasuke): lit along the top
      return inPoly(x, y - 1.5, nosePts) ? C[3] : C[4];
    }
    if (part === 1) {
      const [hx, hy] = loc(x, y, R.Hd), edge = !inPoly(x - 1.2, y, hoodPts) || !inPoly(x + 1.2, y, hoodPts) || !inPoly(x, y - 1.2, hoodPts) || !inPoly(x, y + 1.2, hoodPts);
      if (edge) return hy > 4 ? C[4] : C[1];
      // the face: dark under the brow, eyes burning in it, a mouth of teeth
      const fx = hx - 6, fy = hy + 2;
      if (fx > -9 && fx < 12 && fy > -4 && fy < 7) {
        if (Math.abs(fy - 2.5) < 1.6 && Math.abs(Math.abs(fx - 1.5) - 5) < 2.4) return EYES[kind][Math.abs(fx - 1.5) > 5 ? 0 : 1];
        if (fy > -3.5 && fy < 0.5 && fx > -6 && fx < 10) return (Math.floor(fx) & 1) || fy < -2.5 ? C[4] : C[0];
        return C[0];
      }
      // the hood's folds
      const fold = Math.abs(Math.sin((hx * 0.25 + hy * 0.45) * 1.4)) < 0.16;
      return fold ? C[1] : hy > 6 ? C[3] : C[2];
    }
    // the mantle: cloth swept round the body in long curving bands (Itachi), plates (Sasuke)
    const em = mantleE(lx, ly);
    if (em > 0.86) return ly > 4 ? C[4] : C[1];
    if (kind === "itachi") {
      const s = (lx * 0.5 - ly * 0.95) / 6 + 1.2 * Math.sin(lx * 0.07 + ly * 0.03);
      const fr = s - Math.floor(s);
      if (fr < 0.16) return C[1];
      return fr < 0.4 ? C[3] : C[2];
    }
    // Sasuke: a breastplate of overlapping plates over the chest, the rest shaded round
    if (ly > 0 && ly < 24) {
      if (((ly + 40) % 8) < 1.3) return C[1];
      return lx > 12 ? C[2] : C[3];
    }
    return lx > 10 ? C[1] : lx < -16 ? C[3] : C[2];
  };

  // the skeleton: bones until the muscle covers them, a skull with burning eyes and a jaw full of teeth
  const skeleton = () => {
    if (bones <= 0) return;
    const a = k * (bones < 0.3 ? 0.55 : 1) * (1 - smooth(0.55, 1, flesh)), g = clamp(bones * 1.4), B = C[3], D = C[1];
    const bone = (P, Q, w) => {
      const x = P[0] + (Q[0] - P[0]) * g, y = P[1] + (Q[1] - P[1]) * g;
      p.beam(P[0], P[1], x, y, w + 1.5, D, a);
      p.beam(P[0], P[1], x, y, w, B, a);
    };
    bone(R.W, R.N, 4);
    for (const A of [R.far, R.near, ...(R.low ? [R.low] : [])]) {
      bone(A.S, A.E, A === R.low ? 3 : 4);
      if (g > 0.5) {
        bone(A.E, A.H, A === R.low ? 2.5 : 3);
        p.circle(A.E[0], A.E[1], 2.6, B, a);
        // the bony hand: a knuckle and fingers
        const dx = A.H[0] - A.E[0], dy = A.H[1] - A.E[1], n = Math.hypot(dx, dy) || 1;
        for (let i = -1; i <= 1; i++) p.line(A.H[0], A.H[1], A.H[0] + (dx / n) * 6 - (dy / n) * i * 2.5, A.H[1] + (dy / n) * 6 + (dx / n) * i * 2.5, B, a);
        p.circle(A.H[0], A.H[1], 2.4, B, a);
      }
    }
    bone(R.N, R.near.S, 3);
    bone(R.N, R.far.S, 3);
    // the skull
    const H = R.Hd, U = R.hup, T = R.hrt, P = (u, v) => [H[0] + U[0] * u + T[0] * v, H[1] + U[1] * u + T[1] * v];
    const s = 0.4 + 0.6 * g;
    p.circle(...P(2, 0), 13 * s, D, a);
    p.circle(...P(2.5, -0.5), 12 * s, B, a);
    p.circle(...P(5, -3), 5 * s, C[4], a * 0.7);
    if (g > 0.6) {
      // the jaw hangs open in a grin of big teeth
      const jaw = P(-9, 2);
      p.ellipse(jaw[0], jaw[1], 10, 5, D, a);
      p.ellipse(...P(-8, 2), 8, 3, C[0], a);
      for (let i = -3; i <= 3; i++) {
        const tp = P(-6.5, 2 + i * 2.4), bp = P(-10.5, 2 + i * 2.4);
        p.rect(tp[0] - 0.8, tp[1] - 1.2, 1.6, 2.4, C[4], a);
        p.rect(bp[0] - 0.8, bp[1] - 1, 1.6, 2, C[4], a);
      }
      // sockets, and the eyes burning in them
      for (const v of [-2, 6]) {
        const e = P(1, v);
        p.circle(e[0], e[1], 3.2, C[0], a);
        p.circle(e[0], e[1], 2, EYES[kind][0], a);
        p.px(e[0], e[1], EYES[kind][1]);
        p.glow(e[0], e[1], 9, EYES[kind][0], 0.6 * a);
      }
      p.tri(...P(-3, 1.5), ...P(-5, 0.2), ...P(-5, 3), C[0], a);
    }
    // flames licking off the skull and shoulders while it's still bone
    for (let i = 0; i < 7; i++) {
      const base = i < 4 ? P(8 + rand(i, 1) * 4, -10 + i * 6) : i === 4 ? R.near.S : i === 5 ? R.far.S : R.N;
      const h = (5 + 6 * rand(i, f % 7)) * a, w = 2 + rand(i, 3) * 2;
      p.tri(base[0] - w, base[1], base[0] + w, base[1], base[0] + (rand(i, f) - 0.5) * 3, base[1] - h, C[3], a * 0.8);
    }
  };

  // the far arm, the torso and head (with the armour), what's held between, then the near arms on top
  if (flesh < 1) skeleton();
  paint(far, false);
  paint(body, true);
  mid?.(p);
  paint(near, false);
  // once fleshed out, the face: Itachi's humanoid face is framed by locks of hair; the eyes glow through
  const face = smooth(0.35, 0.6, flesh) * (1 - smooth(0.6, 1, armour)) * k;
  if (face > 0) {
    const H = R.Hd, U = R.hup, T = R.hrt, P = (u, v) => [H[0] + U[0] * u + T[0] * v, H[1] + U[1] * u + T[1] * v];
    for (const v of [-1, 7]) {
      const e = P(2, v);
      p.ellipse(e[0], e[1], 2.6, 1.6, C[0], face);
      p.ellipse(e[0], e[1], 1.8, 1, EYES[kind][0], face);
      p.glow(e[0], e[1], 7, EYES[kind][0], 0.5 * face);
    }
    p.line(...P(-6, 0), ...P(-6, 8), C[0], face);
  }
  // Itachi's magatama earring once the armour is on
  if (kind === "itachi" && armour > 0.7) {
    const H = R.Hd, U = R.hup, T = R.hrt, e = [H[0] - U[0] * 4 - T[0] * 9, H[1] - U[1] * 4 - T[1] * 9], a = smooth(0.7, 1, armour) * k;
    p.circle(e[0], e[1] + 3, 2.4, C[4], a);
    p.circle(e[0] + 0.6, e[1] + 2.4, 1.2, C[1], a);
    p.line(e[0], e[1] - 2, e[0], e[1] + 1, C[3], a);
  }
  // Sasuke's demonic horns once the armour is on
  if (kind === "sasuke" && armour > 0.5) {
    const H = R.Hd, U = R.hup, T = R.hrt, P = (u, v) => [H[0] + U[0] * u + T[0] * v, H[1] + U[1] * u + T[1] * v], a = smooth(0.5, 0.9, armour) * k;
    for (const [b, m, tip] of [[[11, -7], [26, -14], [34, -24]], [[12, 5], [28, 2], [37, -8]]]) {
      p.poly([P(...b.map((v, i) => v + (i ? -5 : 0))), P(m[0] + 2, m[1] - 2), P(...tip), P(m[0] - 2, m[1] + 2), P(...b.map((v, i) => v + (i ? 5 : 0)))], C[3], a);
      p.poly([P(...b.map((v, i) => v + (i ? 2 : 0))), P(m[0] - 2, m[1] + 2), P(...tip), P(...b.map((v, i) => v + (i ? 5 : 0)))], C[1], a);
      p.line(...P(...m), ...P(...tip), C[4], a);
    }
  }
}

// the user's models (2026-11-22): which sprite and view each kind uses, its scale, and its rig: the near (sword) arm,
// what it holds, the far arm
export const SUSANOO_MODEL = {
  itachi: { name: "susanooItachi", view: "right", scale: 1, arm: "arm", weapon: "blade", far: "mirror" },
  sasuke: { name: "susanooSasuke", view: "front", scale: 0.85, arm: "arm", weapon: "sword", far: "armR" },
  madara: { name: "susanooMadara", view: "right", scale: 1, arm: "arm", weapon: "katana", far: null },
};
const handOf = (M, part) => RIGS[M.name + "/" + M.view].parts.find((q) => q.name === part).hand;
const REST = rigOf({});
/**
 * The model puppet for rig R: where it stands, its lean, and the pose of its parts. The arms follow the rig's hands:
 * each model hand moves from where it rests by as much as the rig's hand moved from its rest (opts.rest, a rig);
 * the weapon rides the near hand, pointing along opts.nearAngle (a screen angle) or held rigid in the hand; the head
 * turns with the rig's head; opts.pose overrides any part (e.g. { blade: { st: 0.5 } }). Returns { M, x, y, o, hand,
 * far, tip }: o is for drawModel, hand/far/tip are on screen.
 */
export function susanooPuppet(t, R, kind, opts = {}) {
  const M = SUSANOO_MODEL[kind];
  if (!M) return null;
  const R0 = opts.rest ?? REST, x = (R.W?.[0] ?? 0) + 2, y = 0, flick = 1 + 0.01 * Math.sin(t * 6);
  const o = { scale: M.scale * flick, rot: (R.lean ?? 0) * 0.5, pose: {} }, gain = opts.gain ?? 1;
  const go = (part, H, H0) => {
    const h = modelPoint(M.name, M.view, x, y, o, null, handOf(M, part));
    o.pose[part] = reachPose(M.name, M.view, x, y, o, part, [h[0] + (H[0] - H0[0]) * gain, h[1] + (H[1] - H0[1]) * gain], 0.65, 1.7);
  };
  go(M.arm, R.near.H, R0.near.H);
  if (M.far) go(M.far, R.far.H, R0.far.H);
  o.pose.head = { rot: ((R.q?.head ?? 0) - (R0.q?.head ?? 0)) * 0.7 };
  o.pose[M.weapon] = holdPose(M.name, M.view, o, M.arm, M.weapon, opts.nearAngle ?? null);
  for (const [k, v] of Object.entries(opts.pose ?? {})) o.pose[k] = { ...(o.pose[k] ?? {}), ...v };
  const rig = RIGS[M.name + "/" + M.view].parts, wq = rig.find((q) => q.name === M.weapon);
  return {
    M, x, y, o,
    hand: modelPoint(M.name, M.view, x, y, o, M.arm, handOf(M, M.arm)),
    far: M.far ? modelPoint(M.name, M.view, x, y, o, M.far, handOf(M, M.far)) : null,
    tip: modelPoint(M.name, M.view, x, y, o, M.weapon, wq.tip),
  };
}
/**
 * Paint the Susanoo of rig R. Kinds with a model: the procedural ribcage and bones grow first, then the model rises
 * into being from the floor up (form from the flesh/armour stages), standing round its user, its arms, weapon and head
 * following the rig (see susanooPuppet; opts.rest, opts.nearAngle, opts.pose); mid(p) is still called (between the
 * model and the user) for things held in front of it. Other kinds: the procedural Susanoo as before.
 */
export function drawSusanoo(p, t, R, opts = {}) {
  const { kind = "itachi", st = {}, fade = 0, layer = "back", mid = null } = opts, M = SUSANOO_MODEL[kind];
  if (!M) return drawSusanooProc(p, t, R, opts);
  const k = 1 - fade, form = clamp(Math.max(st.flesh ?? 0, st.armour ?? 0) * 1.15), early = 1 - smooth(0.3, 0.9, form);
  // the skeleton stages, fading away as the model takes over
  if (early > 0.01) drawSusanooProc(p, t, R, { kind, st: { ribs: st.ribs, bones: st.bones, flesh: 0, armour: 0 }, fade: 1 - k * early, layer, mid: null });
  if (layer !== "back") return;
  if (form > 0.01 && k > 0.01) {
    const P = susanooPuppet(t, R, kind, opts);
    drawModel(p, M.name, M.view, P.x, P.y, { ...P.o, form: smooth(0, 1, form), alpha: k, glow: SUSANOO[kind][2] });
  }
  if (mid) mid(p);
}

// The user's own models (2026-11-22) drawn as cut-out puppets. Each sprite view (from _modeldata.js) can carry a rig:
// parts cut out of it by polygons (a jaw, a head, an arm, a sword, the tails), each turning about its own pivot,
// optionally chained to a parent part, bending along its length, swaying like flame or cloth, sliding and stretching.
// drawModel() paints one view with its feet (bottom centre) at (x, y) and a pose { part: { rot, dx, dy, sx, sy, bend,
// sway, swayK, swayPh, tint, tintK } }; where a part has moved away, the hole it leaves is painted with its fill (a
// mouth's dark inside, a shaded body behind an arm) or left open. modelPoint() maps a point of a part to the screen, so
// effects stay attached (a ball in the jaws, a blade's tip, a rider on a brow).
import { hex, mix, clamp } from "../../core/index.js";
import { modelPixels } from "./_modeldata.js";
export { modelPixels };

// ---- the rigs, in each view's own pixels (u right, v down, from the top left of the sprite) ----
// poly: the cut-out (later parts win over earlier ones); pivot: where it turns; parent: chained to that part;
// z: -1 paints it behind the body; fill: what shows in its place once it moves ("shade" = its own pixels darkened,
// a colour, or null = nothing); len: the length its bend and sway ramp up over.
export const RIGS = {
  // Itachi (the user's turnaround, 2026-11-25), side view facing right, 23x72: the head with hair (turns at the neck),
  // the near sleeve with the hand at its end (turns at the shoulder; the coat shows darkened where it was)
  "itachi/right": { parts: [
    { name: "head", poly: [[1, 0], [23, 0], [23, 27], [15, 27], [5, 26], [0, 18]], pivot: [12, 27], len: 22, fill: "inpaint" },
    { name: "arm", poly: [[5, 28], [14, 28], [16, 36], [15, 52], [8, 53], [5, 45]], pivot: [10, 30], hand: [11, 48], len: 22, fill: "shade" },
  ] },
  // Kurama, side view facing right: nine tails fanned up behind, head low on the chest, jaw under the snout
  "kurama/right": { parts: [
    { name: "tails", poly: [[0, 0], [93, 0], [93, 72], [84, 84], [70, 88], [62, 90], [40, 92], [22, 96], [18, 104], [20, 122], [0, 122]], pivot: [48, 96], z: -1, fill: null, len: 80 },
    { name: "foreleg", poly: [[58, 114], [72, 112], [80, 125], [93, 140], [93, 150], [66, 150], [62, 135]], pivot: [66, 116] },
    { name: "head", poly: [[62, 90], [70, 87], [80, 88], [90, 100], [93, 108], [92, 116], [78, 117], [66, 113], [61, 100]], pivot: [64, 102], len: 26 },
    { name: "jaw", parent: "head", poly: [[73, 107], [82, 106], [93, 107], [93, 116], [80, 117], [73, 112]], pivot: [74, 108], fill: "#2a0604", len: 18 },
  ] },
  // Shukaku, front: the scaled tail fanned up behind on the left, the right arm raised (screen right), the grinning
  // head on the chest, its lower jaw
  "shukaku/front": { parts: [
    { name: "tail", poly: [[0, 0], [150, 0], [150, 38], [108, 56], [100, 66], [72, 70], [60, 90], [48, 120], [42, 150], [0, 150]], pivot: [64, 120], z: -1, fill: null, len: 110 },
    { name: "arm", poly: [[106, 58], [128, 48], [160, 38], [186, 38], [186, 84], [160, 84], [140, 78], [126, 84], [116, 92], [106, 82]], pivot: [112, 86], hand: [168, 62], fill: null },
    { name: "head", poly: [[70, 70], [112, 68], [118, 96], [114, 126], [96, 130], [74, 126], [68, 100]], pivot: [93, 128], len: 50 },
    { name: "jaw", parent: "head", poly: [[78, 105], [106, 105], [108, 124], [78, 124]], pivot: [92, 106], fill: "#120c10", len: 16 },
  ] },

  // Kurama from the front (for close shots): its jaw under the muzzle
  "kurama/front": { parts: [
    { name: "jaw", poly: [[47, 120], [63, 120], [63, 127], [47, 127]], pivot: [55, 120], fill: "#2a0604", len: 8 },
  ] },
  // Kurama from behind: the nine tails fanned over its back
  "kurama/back": { parts: [
    { name: "tails", poly: [[0, 0], [119, 0], [119, 104], [0, 104]], pivot: [60, 104], fill: null, len: 100 },
  ] },
  // Itachi's Susanoo, side view facing right: the Yata Mirror on the far arm (left), the hooded head, the near arm's
  // hand low at the front, the Totsuka blade standing up out of it
  "susanooItachi/right": { parts: [
    { name: "mirror", poly: [[0, 40], [24, 34], [36, 58], [40, 92], [36, 126], [8, 128], [0, 112]], pivot: [40, 70], hand: [22, 92], fill: "shade" },
    { name: "head", poly: [[22, 0], [50, 0], [58, 22], [57, 66], [46, 76], [30, 62], [22, 30]], pivot: [44, 78], len: 40 },
    { name: "arm", poly: [[44, 92], [56, 88], [79, 94], [79, 122], [56, 124], [44, 106]], pivot: [46, 90], hand: [67, 106], fill: "shade" },
    { name: "blade", poly: [[54, 22], [66, 18], [74, 40], [77, 70], [74, 102], [62, 102], [61, 66], [56, 40]], pivot: [67, 106], tip: [61, 24], fill: "inpaint" },
  ] },
  // Sasuke's Complete Body Susanoo, front: the right fist (screen left) up by the face with the long blade rising out
  // of it, the elbow out low; the left arm (screen right) thrust out with a flaming blade; the horned head
  "susanooSasuke/front": { parts: [
    { name: "head", poly: [[80, 22], [112, 22], [114, 72], [96, 84], [80, 72]], pivot: [96, 84], len: 40 },
    { name: "armR", poly: [[100, 70], [140, 80], [186, 92], [186, 130], [160, 142], [132, 148], [118, 132], [104, 90]], pivot: [112, 96], hand: [150, 124], fill: "shade" },
    { name: "arm", poly: [[0, 84], [30, 58], [60, 56], [66, 80], [52, 94], [32, 102], [22, 126], [0, 126]], pivot: [60, 94], hand: [47, 72], fill: "shade" },
    { name: "sword", poly: [[40, 62], [96, -2], [112, 8], [56, 74], [48, 76]], pivot: [47, 72], tip: [104, 3], fill: "inpaint" },
  ] },
  // Madara's Complete Body Susanoo, side view facing right: the helmeted head, the near arm down at the side, its
  // katana held low and back
  "susanooMadara/right": { parts: [
    { name: "head", poly: [[22, 0], [60, 0], [60, 48], [40, 54], [22, 42]], pivot: [42, 54], len: 40 },
    { name: "arm", poly: [[28, 46], [52, 46], [50, 96], [42, 112], [28, 114], [24, 90]], pivot: [40, 56], hand: [34, 104], fill: "shade" },
    { name: "katana", poly: [[-5, 141], [4, 152], [44, 104], [33, 93]], pivot: [34, 104], tip: [2, 146], fill: "inpaint", reach: 3 },
  ] },
};

const rigCache = new Map();
function rigOf(name, view) {
  const k = name + "/" + view;
  if (rigCache.has(k)) return rigCache.get(k);
  const R = RIGS[k], d = modelPixels(name, view);
  if (!R) { rigCache.set(k, null); return null; }
  const parts = R.parts.map((q, i) => ({ ...q, id: i + 1, fill: q.fill === undefined ? "shade" : q.fill, len: q.len ?? 40, fillC: q.fill && q.fill !== "shade" && q.fill !== "inpaint" ? hex(q.fill) : null }));
  // the stretch axis: from the pivot toward the hand (or tip)
  for (const q of parts) { const e = q.hand ?? q.tip; if (e) { const dx = e[0] - q.pivot[0], dy = e[1] - q.pivot[1], n = Math.hypot(dx, dy) || 1; q.ax = [dx / n, dy / n]; } }
  const byName = Object.fromEntries(parts.map((q) => [q.name, q]));
  for (const q of parts) q.par = q.parent ? byName[q.parent] : null;
  // who owns each pixel
  const own = new Uint8Array(d.w * d.h);
  for (const q of parts) {
    const P = q.poly, n = P.length;
    let u0 = 1e9, v0 = 1e9, u1 = -1e9, v1 = -1e9;
    for (const [u, v] of P) { u0 = Math.min(u0, u); v0 = Math.min(v0, v); u1 = Math.max(u1, u); v1 = Math.max(v1, v); }
    q.box = [Math.max(0, Math.floor(u0)), Math.max(0, Math.floor(v0)), Math.min(d.w - 1, Math.ceil(u1)), Math.min(d.h - 1, Math.ceil(v1))];
    for (let v = q.box[1]; v <= q.box[3]; v++) for (let u = q.box[0]; u <= q.box[2]; u++) {
      if (!d.idx[v * d.w + u]) continue;
      const x = u + 0.5, y = v + 0.5;
      let ins = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = P[i], [xj, yj] = P[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
      }
      if (ins) own[v * d.w + u] = q.id;
    }
  }
  // inpainting: what each cut-out pixel is replaced by once its part moves away (the nearest pixel along the row
  // that is not the part's own; or nothing)
  const inp = new Uint8Array(d.w * d.h);
  for (let v = 0; v < d.h; v++) for (let u = 0; u < d.w; u++) {
    const o = own[v * d.w + u];
    if (!o || parts[o - 1].fill !== "inpaint") continue;
    for (let k = 1, K = parts[o - 1].reach ?? 4; k <= K; k++) {
      const L = u - k, Rr = u + k;
      if (L >= 0 && d.idx[v * d.w + L] && own[v * d.w + L] !== o) { inp[v * d.w + u] = d.idx[v * d.w + L]; break; }
      if (Rr < d.w && d.idx[v * d.w + Rr] && own[v * d.w + Rr] !== o) { inp[v * d.w + u] = d.idx[v * d.w + Rr]; break; }
    }
  }
  const r = { parts, byName, own, inp };
  rigCache.set(k, r);
  return r;
}

const ID = { rot: 0, dx: 0, dy: 0, sx: 1, sy: 1, bend: 0, sway: 0 };
const still = (ps) => !ps || ((ps.rot ?? 0) === 0 && (ps.dx ?? 0) === 0 && (ps.dy ?? 0) === 0 && (ps.sx ?? 1) === 1 && (ps.sy ?? 1) === 1 && (ps.bend ?? 0) === 0 && (ps.sway ?? 0) === 0 && (ps.st ?? 1) === 1 && (ps.a ?? 1) === 1 && ps.tint === undefined);
// a part's own move, source -> posed (in its parent's source space)
function fwdOwn(q, ps, u, v) {
  const s = ps ?? ID, [cx, cy] = q.pivot;
  let x = (u - cx) * (s.sx ?? 1), y = (v - cy) * (s.sy ?? 1);
  if ((s.st ?? 1) !== 1 && q.ax) { const k = (x * q.ax[0] + y * q.ax[1]) * (s.st - 1); x += k * q.ax[0]; y += k * q.ax[1]; }
  const a = (s.rot ?? 0) + ((s.bend ?? 0) * Math.hypot(x, y)) / q.len, c = Math.cos(a), n = Math.sin(a);
  [x, y] = [x * c - y * n, x * n + y * c];
  x += cx; y += cy;
  if (s.sway) { const h = cy - y; x += s.sway * Math.sin((s.swayK ?? 0.12) * h + (s.swayPh ?? 0)) * clamp(h / q.len); }
  return [x + (s.dx ?? 0), y + (s.dy ?? 0)];
}
function invOwn(q, ps, x, y) {
  const s = ps ?? ID, [cx, cy] = q.pivot;
  x -= s.dx ?? 0; y -= s.dy ?? 0;
  if (s.sway) { const h = cy - y; x -= s.sway * Math.sin((s.swayK ?? 0.12) * h + (s.swayPh ?? 0)) * clamp(h / q.len); }
  x -= cx; y -= cy;
  const a = (s.rot ?? 0) + ((s.bend ?? 0) * Math.hypot(x, y)) / q.len, c = Math.cos(-a), n = Math.sin(-a);
  [x, y] = [x * c - y * n, x * n + y * c];
  if ((s.st ?? 1) !== 1 && q.ax) { const k = (x * q.ax[0] + y * q.ax[1]) * (1 / s.st - 1); x += k * q.ax[0]; y += k * q.ax[1]; }
  return [x / (s.sx ?? 1) + cx, y / (s.sy ?? 1) + cy];
}
const fwdPart = (q, pose, u, v) => { let p = fwdOwn(q, pose[q.name], u, v); for (let a = q.par; a; a = a.par) p = fwdOwn(a, pose[a.name], p[0], p[1]); return p; };
function invPart(q, pose, x, y) {
  const chain = [];
  for (let a = q; a; a = a.par) chain.push(a);
  let p = [x, y];
  for (let i = chain.length - 1; i >= 0; i--) p = invOwn(chain[i], pose[chain[i].name], p[0], p[1]);
  return p;
}
const moving = (q, pose) => { for (let a = q; a; a = a.par) if (!still(pose[a.name])) return true; return false; };

// the frame of a placed model: screen <-> the view's own pixels
function frame(d, x, y, o) {
  const s = o.scale ?? 1, sy = s * (o.sy ?? 1), flip = o.flip ? -1 : 1, rot = o.rot ?? 0, c = Math.cos(rot), n = Math.sin(rot);
  // persp: seen from below, the model narrows toward its top (its width at the top is 1 - persp of that at the feet)
  const ps = o.persp ?? 0, HH = d.h * sy, kAt = (hgt) => 1 - ps * clamp(hgt / HH);
  return {
    s, sy, flip, c, n,
    // screen -> model; also the local height above the feet (for the materialising wipe)
    toModel(px, py) { const dx = px - x, dy = py - y, lx = (dx * c + dy * n) * flip, ly = -dx * n + dy * c; return [lx / (s * kAt(-ly)) + d.w / 2, ly / sy + d.h, -ly]; },
    toScreen(u, v) { const ly = (v - d.h) * sy, lx = (u - d.w / 2) * s * flip * kAt(-ly); return [x + lx * c - ly * n, y + lx * n + ly * c]; },
  };
}

/**
 * Draw a model view with its feet (bottom centre) at (x, y). o: { scale = 1, sy = 1 (squash), flip = false, rot = 0
 * (radians, about the feet), alpha = 1, tint, tintK, form = 1 (0..1: how much has materialised, from the bottom up, the
 * top edge shimmering), glow: colour of a soft outline glow, clipFloor: true to drop everything below y = 0, pose,
 * persp (0..1: seen from below, narrowing toward the top) }.
 */
export function drawModel(p, name, view, x, y, o = {}) {
  const d = modelPixels(name, view), a = o.alpha ?? 1, form = o.form ?? 1, s = o.scale ?? 1;
  if (a <= 0 || s <= 0 || form <= 0) return;
  const F = frame(d, x, y, o), rig = rigOf(name, view), pose = o.pose ?? {};
  const H = d.h * F.sy, W = d.w * s, cut = H * (1 - form);
  const tint = o.tint !== undefined ? (typeof o.tint === "number" ? o.tint : hex(o.tint)) : null, tk = o.tintK ?? 0.5;
  if (o.glow) p.glow(x, y - H * 0.5, Math.max(W, H) * 0.7, typeof o.glow === "number" ? o.glow : hex(o.glow), 0.25 * a * form);
  const act = rig ? rig.parts.filter((q) => moving(q, pose)) : [], on = new Uint8Array(256);
  for (const q of act) on[q.id] = 1;
  const paint = (px, py, col, hgt, ps) => {
    if (hgt < cut - 0.01) return;
    const pa = a * (ps?.a ?? 1);
    if (pa <= 0.02) return;
    if (ps && ps.tint !== undefined) col = mix(col, typeof ps.tint === "number" ? ps.tint : hex(ps.tint), ps.tintK ?? 0.5);
    if (tint !== null) col = mix(col, tint, tk);
    const edge = form < 1 && hgt < cut + 3;
    if (pa >= 1 && !edge) p.px(px, py, col);
    else p.dot(px, py, edge ? mix(col, 0xffffffff, 0.6) : col, edge ? pa * 0.8 : pa);
  };
  // one part (or the body, q = null) over a screen box
  const pass = (q, X0, Y0, X1, Y1) => {
    const ps = q ? pose[q.name] : null;
    for (let py = Math.floor(Y0); py <= Y1; py++) {
      if (o.clipFloor && py >= 0) break;
      for (let px = Math.floor(X0); px <= X1; px++) {
        let [U, V, hgt] = F.toModel(px + 0.5, py + 0.5);
        if (q) [U, V] = invPart(q, pose, U, V);
        const u = Math.floor(U), v = Math.floor(V);
        if (u < 0 || v < 0 || u >= d.w || v >= d.h) continue;
        const i = d.idx[v * d.w + u];
        if (!i) continue;
        const ow = rig ? rig.own[v * d.w + u] : 0;
        if (q) { if (ow !== q.id) continue; paint(px, py, d.pal[i - 1], hgt, ps); continue; }
        if (ow && on[ow]) {
          const h = rig.parts[ow - 1];
          if (!h.fill) continue;
          if (h.fill === "inpaint") { const j = rig.inp[v * d.w + u]; if (j) paint(px, py, d.pal[j - 1], hgt, null); continue; }
          paint(px, py, h.fillC ?? mix(d.pal[i - 1], 0xff000000, 0.55), hgt, null);
          continue;
        }
        paint(px, py, d.pal[i - 1], hgt, null);
      }
    }
  };
  // a part's box on screen: its source box carried through its pose, padded
  const boxOf = (q) => {
    const [u0, v0, u1, v1] = q.box;
    let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
    const st = Math.max(2, Math.min(u1 - u0, v1 - v0) / 6);
    for (let v = v0; v <= v1 + 1; v += st) for (let u = u0; u <= u1 + 1; u += st) {
      const [mu, mv] = fwdPart(q, pose, Math.min(u, u1 + 1), Math.min(v, v1 + 1)), [sx, sy] = F.toScreen(mu, mv);
      X0 = Math.min(X0, sx); Y0 = Math.min(Y0, sy); X1 = Math.max(X1, sx); Y1 = Math.max(Y1, sy);
    }
    const pad = st * s * 1.5 + 2;
    return [X0 - pad, Y0 - pad, X1 + pad, Y1 + pad];
  };
  for (const q of act) if ((q.z ?? 1) < 0 && (pose[q.name]?.a ?? 1) > 0.02) pass(q, ...boxOf(q));
  const R = Math.hypot(W / 2, H) + 2;
  pass(null, x - R, y - R, x + R, y + 2);
  for (const q of act) if ((q.z ?? 1) >= 0 && (pose[q.name]?.a ?? 1) > 0.02) pass(q, ...boxOf(q));
}

/** Where a point of a model ends up on screen: [u, v] in the view's own pixels, carried by part (or the body). */
export function modelPoint(name, view, x, y, o = {}, part = null, uv = [0, 0]) {
  const d = modelPixels(name, view), F = frame(d, x, y, o), rig = rigOf(name, view), q = part && rig ? rig.byName[part] : null;
  const [u, v] = q ? fwdPart(q, o.pose ?? {}, uv[0], uv[1]) : uv;
  return F.toScreen(u, v);
}
/** The angle a direction of a part points on screen (radians), e.g. a blade's line. */
export function modelAngle(name, view, x, y, o, part, from, to) {
  const a = modelPoint(name, view, x, y, o, part, from), b = modelPoint(name, view, x, y, o, part, to);
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}
export const modelSize = (name, view) => { const d = modelPixels(name, view); return [d.w, d.h]; };

/** A point on screen, back in the view's own pixels (the model's frame only, no part). */
export function modelUV(name, view, x, y, o, sx, sy) { const d = modelPixels(name, view), F = frame(d, x, y, o); const [u, v] = F.toModel(sx, sy); return [u, v]; }
/**
 * Reach: the turn and stretch that carry a part's hand (its rig "hand" point) onto a screen point, turning about its
 * pivot (a shoulder); the stretch is held within [lo, hi].
 */
export function reachPose(name, view, x, y, o, part, target, lo = 0.7, hi = 1.6) {
  const rig = rigOf(name, view), q = rig?.byName[part];
  if (!q || !q.hand) return { rot: 0, st: 1 };
  const [tu, tv] = modelUV(name, view, x, y, o, target[0], target[1]), [cx, cy] = q.pivot, [hu, hv] = q.hand;
  const rot = Math.atan2(tv - cy, tu - cx) - Math.atan2(hv - cy, hu - cx);
  const st = clamp(Math.hypot(tu - cx, tv - cy) / (Math.hypot(hu - cx, hv - cy) || 1), lo, hi);
  return { rot: Math.atan2(Math.sin(rot), Math.cos(rot)), st };
}
/**
 * A held thing (a weapon part, pivot at its grip) carried by an arm's hand and turned so that it points along the
 * screen angle ang (or keeps its own angle relative to the arm when ang is null). Returns its pose { dx, dy, rot }.
 */
export function holdPose(name, view, o, arm, part, ang = null) {
  const rig = rigOf(name, view), A = rig?.byName[arm], q = rig?.byName[part], pose = o.pose ?? {};
  if (!A || !q || !A.hand) return {};
  const [hx, hy] = fwdPart(A, pose, A.hand[0], A.hand[1]), [gx, gy] = q.pivot;
  const a0 = q.tip ? Math.atan2(q.tip[1] - gy, q.tip[0] - gx) : 0, flip = o.flip ? -1 : 1;
  // a screen angle back into the model frame (undo the flip and the model's own turn)
  let rot = ang === null ? (pose[arm]?.rot ?? 0) : (flip < 0 ? Math.PI - (ang - (o.rot ?? 0)) : ang - (o.rot ?? 0)) - a0;
  rot = Math.atan2(Math.sin(rot), Math.cos(rot));
  return { dx: hx - gx, dy: hy - gy, rot };
}

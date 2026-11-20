// Shared by the jutsu moves (files starting with _ are helpers, not effects): the hand-seal poses every jutsu
// starts with, the mouth and palm the elements leave from, and a cue player like core chain() that can also
// steer a cue's angle over time (a projectile that tilts along its arc) and keep custom drawing in the same frame.
import { createFx, READY, WHITE, TAU, clamp, ease, hex, mix, rand, smooth, noise2, poseAt, skeleton, posed } from "../../core/index.js";

/**
 * Where the user's body is at time t on an act's pose track: { q (the pose), head, crown, chest, handN (near hand),
 * handF (far hand), footN, footF } as [x, y] in the effect's own space (feet at 0, 0 at rest).
 */
export function bodyAt(poses, t) {
  const q = poseAt(poses, t), j = skeleton(q).joints, ox = q.x ?? 0, oy = q.y ?? 0;
  const P = (n) => [j[n][0] + ox, j[n][1] + oy];
  return { q, head: P("head"), crown: P("crown"), chest: P("chest"), handN: P("handN"), handF: P("handF"), footN: P("ankleN"), footF: P("ankleF") };
}

/**
 * Paint a whole figure in a pose (a shadow clone, a silhouette, a chakra shroud): feet at (x, y), face 1 right / -1 left.
 * tint mixes every pixel toward one color by k; a fades it (dithered); only: "ink" paints just the outline pixels.
 */
export function drawFigure(p, pose, x, y, { face = 1, tint = 0, k = 0, a = 1, solid = 0 } = {}) {
  const r = posed(pose);
  for (let i = 0; i < r.n; i++) {
    const px = face > 0 ? x + r.xs[i] : x - r.xs[i] - 1, py = y + r.ys[i];
    const c = solid || (tint ? mix(r.color[i], tint, k) : r.color[i]);
    if (a >= 1) p.px(px, py, c);
    else p.dot(px, py, c, a);
  }
}

// Where the stock character's mouth sits, in px from the feet, facing right.
export const MOUTH = [6, -31];

// ---- hand seals (in, 印): the twelve signs of the zodiac. Every sign is its own hand shape, so a run of seals reads
// as the hands really changing: where the two hands meet, how high, which one is on top, how the body sits.
// (Narutopedia: Tiger is the sign of most fire jutsu, Snake of earth and water, Hare of lightning.)
const S = { ...READY, crouch: 3, lean: 1, armsFront: true, ffx: 7, fbx: -7 };
export const SIGNS = {
  ne: { name: "NE", pose: { ...S, fx: 9, fy: -24, bx: 11, by: -22 } }, // rat: one fist wrapped round two fingers
  ushi: { name: "USHI", pose: { ...S, fx: 8, fy: -23, bx: 12, by: -23, crouch: 4 } }, // ox: hands stacked flat, crosswise
  tora: { name: "TORA", pose: { ...S, fx: 10, fy: -27, bx: 11, by: -27 } }, // tiger: fingers up, pressed together
  u: { name: "U", pose: { ...S, fx: 9, fy: -22, bx: 12, by: -25, lean: 2 } }, // hare: one hand over the other's fist
  tatsu: { name: "TATSU", pose: { ...S, fx: 11, fy: -26, bx: 9, by: -24 } }, // dragon: thumbs out, palms together
  mi: { name: "MI", pose: { ...S, fx: 10, fy: -24, bx: 10, by: -23, crouch: 4 } }, // snake: fingers laced
  uma: { name: "UMA", pose: { ...S, fx: 10, fy: -21, bx: 11, by: -22, lean: 2 } }, // horse: fingers pointing down
  hitsuji: { name: "HITSUJI", pose: { ...S, fx: 9, fy: -25, bx: 11, by: -24 } }, // ram: half tiger
  saru: { name: "SARU", pose: { ...S, fx: 8, fy: -26, bx: 12, by: -25 } }, // monkey
  tori: { name: "TORI", pose: { ...S, fx: 11, fy: -25, bx: 8, by: -26, crouch: 4 } }, // bird
  inu: { name: "INU", pose: { ...S, fx: 9, fy: -21, bx: 12, by: -21, crouch: 4 } }, // dog: one flat hand on the other fist
  i: { name: "I", pose: { ...S, fx: 10, fy: -23, bx: 11, by: -25, crouch: 5, lean: 3 } }, // boar
  // the seal of confrontation (Tairitsu no In): one hand, two fingers raised before the face; Shunshin, Kirigakure
  tairitsu: { name: "TAIRITSU", pose: { ...READY, crouch: 3, fx: 9, fy: -30, bx: -4, by: -20, ffx: 7, fbx: -7 } },
  // the clone seal: two fingers of each hand crossed into a cross before the chest (Kage Bunshin)
  juuji: { name: "JUUJI", pose: { ...S, crouch: 4, lean: 2, fx: 11, fy: -26, bx: 10, by: -25 } },
  // hands clapped flat together (Chibaku Tensei, Edo Tensei, Tenten's scrolls)
  gassho: { name: "GASSHO", pose: { ...S, crouch: 2, fx: 10, fy: -27, bx: 10, by: -27 } },
  // a seal of the user's own: whatever the clan's secret technique is shaped by (Ino's ring of fingers, Haku's one hand)
  hiden: { name: "HIDEN", pose: { ...S, crouch: 4, fx: 9, fy: -28, bx: 12, by: -27 } },
};

// ---- small things many moves share

/**
 * The Eight Gates opened on a body in pose q (feet at x, y): from the third gate the skin goes red, the chakra burns
 * round the outline green (from the seventh, blue-green, with the sweat steaming off), k how far it's come on.
 * Draw `back` in drawBack (the aura), `front` in draw (the skin over the body).
 */
export function drawGates(p, t, q, gate, k, layer) {
  if (k <= 0) return;
  const x = q.x ?? 0, y = q.y ?? 0, aura = gate >= 7 ? hex("#5ae8d0") : hex("#5ae86a"), aura2 = gate >= 7 ? hex("#1a8a9a") : hex("#1a8a3a");
  if (layer === "back") {
    drawOutline(p, q, x, y, aura, { w: 1, a: k, flick: t * 16 });
    drawOutline(p, q, x, y, aura2, { w: 2, a: 0.6 * k, flick: t * 12 + 4 });
    // steam rolling up off him
    for (let i = 0; i < 6; i++) {
      const u = (t * 1.6 + i / 6) % 1, sx = x + (rand(i, 3) - 0.5) * 16 + Math.sin(u * 6 + i) * 3, sy = y - 10 - rand(i, 4) * 26 - u * 26;
      p.disc(sx, sy, 2 + u * 4, gate >= 7 ? hex("#c8f4ff") : hex("#e8f4e8"), 0.35 * (1 - u) * k);
    }
  } else if (gate >= 3) drawFigure(p, q, x, y, { tint: hex("#e0503a"), k: 0.32 * k });
}

/** A glow traced round a body in a pose (chakra cloaks, natural energy, gates): the figure in one color, nudged out
 * by w px all round, to be drawn behind the body. flick: a number that changes over time to make the edge crawl. */
export function drawOutline(p, pose, x, y, c, { w = 1, a = 1, face = 1, flick = 0 } = {}) {
  const r = posed(pose);
  for (let i = 0; i < r.n; i++) {
    const bx = face > 0 ? x + r.xs[i] : x - r.xs[i] - 1, by = y + r.ys[i];
    for (const [dx, dy] of [[-w, 0], [w, 0], [0, -w], [0, w]]) {
      const up = dy < 0 && flick ? Math.round(rand(i + Math.floor(flick), 3) * 2) : 0;
      if (a >= 1) p.px(bx + dx, by + dy - up, c);
      else p.dot(bx + dx, by + dy - up, c, a);
    }
  }
}

// Amaterasu's black flame: inky inside, a ragged rim of deep crimson, licking upward. Used by Itachi and Sasuke.
export const BLACK_FIRE = ["#050306", "#120810", "#2a0c1a", "#6a1028", "#c02040"].map(hex);
/** A tongue of black flame standing on (x, y), w wide and h tall, k how big it's grown. */
export function drawBlackFlame(p, x, y, w, h, t, seed = 0, k = 1) {
  if (k <= 0) return;
  const W = w * k, Hh = h * k, F = BLACK_FIRE;
  // a crimson heat round it, so the black reads on any background
  p.glow(x, y - Hh * 0.45, Math.max(W * 2.2, Hh * 1.1), F[4], 0.32 * k);
  p.shade(x - W - 2, y - Hh - 2, x + W + 2, y + 1, (px, py, out) => {
    const u = (px - x) / W, v = (y - py) / Hh;
    if (v < -0.05 || v > 1.1) return;
    const n = noise2(u * 2.2 + seed, v * 3 - t * 5, seed + 7), lim = Math.pow(Math.max(0, 1 - v), 0.8) * (0.55 + 0.6 * n);
    const a = Math.abs(u + Math.sin(v * 5 + t * 7 + seed) * 0.18 * v);
    if (a > lim) return;
    const e = lim - a;
    if (e < 0.08) return F[4];
    if (e < 0.18) return F[3];
    return e < 0.3 ? F[2] : n > 0.6 ? F[1] : F[0];
  });
}

/**
 * Twist space: whatever is already drawn in a disc (cx, cy, R) is read back and redrawn swirled about its centre by up
 * to `twist` radians at the middle and pulled inward by `pull` (0..1: 1 crushes it to a point). Pixels whose source is
 * empty are cleared, so the target or body really is warped, not painted over. Draw it in the front layer: by then the
 * target and the body are in the frame. Kamui.
 */
const CLEAR = 0x00010101;
export function warp(p, cx, cy, R, twist, pull = 0) {
  if (twist === 0 && pull === 0) return;
  const x0 = Math.floor(cx - R), y0 = Math.floor(cy - R), n = Math.ceil(R * 2) + 1, snap = new Uint32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) snap[j * n + i] = p.get(x0 + i + 0.5, y0 + j + 0.5);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const x = x0 + i + 0.5, y = y0 + j + 0.5, dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
      if (r > R) continue;
      const f = 1 - r / R, a = twist * f * f, s = 1 + pull * 3 * f, c = Math.cos(a), sn = Math.sin(a);
      const sx = cx + (dx * c - dy * sn) * s, sy = cy + (dx * sn + dy * c) * s;
      const si = Math.floor(sx - x0), sj = Math.floor(sy - y0);
      const col = si >= 0 && sj >= 0 && si < n && sj < n ? snap[sj * n + si] : 0;
      p.px(x, y, col || CLEAR);
    }
}

/** A see-through wash of color over a box (a darkening sky, a red genjutsu world, a flash): blended, never dithered. */
export function veil(p, x0, y0, x1, y1, c, a, soft = 24) {
  if (a <= 0.004) return;
  // soft edges: on a transparent canvas (sprite sheets) a hard-edged wash shows up as a box
  p.shade(x0, y0, x1, y1, (x, y) => {
    const e = soft > 0 ? Math.min(1, (Math.min(x - x0, x1 - x, y - y0, y1 - y) + 1) / soft) : 1;
    p.blend(x, y, c, a * e * e * (3 - 2 * e));
  });
}

/**
 * A jagged bolt from (x0, y0) to (x1, y1): midpoint-displaced, re-rolled every frame f (pass floor(t * 24)), with a white
 * core and a colored edge; jag: how far it strays, as a share of its length. Returns the points.
 */
export function bolt(p, x0, y0, x1, y1, f, C, { jag = 0.18, seed = 0, glow = 0.5, core = WHITE } = {}) {
  let pts = [[x0, y0], [x1, y1]];
  const L = Math.hypot(x1 - x0, y1 - y0);
  for (let level = 0, amp = L * jag; level < 5 && amp > 0.8; level++, amp *= 0.55) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, n = Math.hypot(dx, dy) || 1;
      const o = (rand(f * 31 + seed, level * 97 + i) - 0.5) * 2 * amp;
      out.push([(ax + bx) / 2 - (dy / n) * o, (ay + by) / 2 + (dx / n) * o], pts[i]);
    }
    pts = out;
  }
  const n = C.length;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    p.line(ax + 1, ay, bx + 1, by, C[n - 3]);
    p.line(ax, ay + 1, bx, by + 1, C[n - 2]);
    p.line(ax, ay, bx, by, core);
  }
  if (glow) p.glowLine(x0, y0, x1, y1, 10, C[n - 2], glow);
  return pts;
}

/** Chidori in a hand: a knot of white lightning with bolts crackling off it in every direction. k: how strong. */
export function drawChidori(p, x, y, t, C, k = 1, seed = 0) {
  if (k <= 0) return;
  const f = Math.floor(t * 24), n = C.length;
  p.glow(x, y, 22 * k, C[n - 2], 0.7 * k);
  for (let i = 0; i < 5; i++) {
    const a = rand(f + seed, i) * TAU, L = (6 + 12 * rand(f + seed, i + 9)) * k;
    bolt(p, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L * 0.8, f + i, C, { jag: 0.3, seed: seed + i, glow: 0 });
  }
  p.circle(x, y, 2.5 * k + 0.5, C[n - 2]);
  p.circle(x, y, 1.5 * k, WHITE);
}

/** A shinobi's puff of smoke (a clone appearing or bursting, a summoning): age in seconds, s its size (1 is man-sized). */
export function drawPoof(p, x, y, age, s = 1, seed = 1) {
  if (age < 0 || age > 0.55) return;
  const u = age / 0.55, R = (6 + 9 * ease.outCubic(Math.min(1, u * 1.6))) * s, fade = 1 - smooth(0.25, 0.9, u);
  const LT = hex("#ffffff"), MID = hex("#dfe3ec"), SH = hex("#9aa0b4");
  if (u < 0.12) p.circle(x, y, R * 0.8, LT);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + rand(seed, i) * 0.6, d = R * (0.45 + 0.35 * rand(seed, i + 9)), r = R * (0.42 + 0.22 * rand(seed, i + 20)) * (1 - 0.3 * u);
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * 0.8 - 6 * s * u;
    if (u < 0.5) p.disc(cx + 1, cy + 1.5, r, SH, (dd) => fade * (dd < 0.85 ? 0.7 : 0.3));
    p.disc(cx, cy, r * (1 - 0.25 * u), (dd) => (dd < 0.5 ? LT : MID), (dd) => fade * (dd < 0.8 ? 1 : 0.5));
  }
  if (u < 0.3) for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + seed, d = R * (1 + u * 2);
    p.px(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, LT);
  }
}

/**
 * The Rasengan: a ball of chakra turning in every direction at once, held in a shell. A shaded sphere with bands
 * of light racing round it on three axes, a white core, a spiky rim of wind and a wide glow. k: how formed (0..1).
 * C: ramp dark to light (blue for Naruto, Minato and Jiraiya; anything for the variants).
 */
export function drawRasengan(p, x, y, R, t, C, k = 1) {
  if (k <= 0 || R < 0.5) return;
  const n = C.length, r = R * (0.35 + 0.65 * k);
  p.glow(x, y, r * 3.2, C[n - 3], 0.55 * k);
  // the shell of wind: short strokes whipping round the outside
  for (let i = 0; i < 12; i++) {
    const a = t * (i % 2 ? 19 : -23) + i * 1.7, rr = r + 1 + (i % 3);
    p.arc(x, y, rr, 1, a, a + 0.9 + 0.3 * Math.sin(t * 30 + i), i % 3 ? C[n - 2] : WHITE, 0.9 * k);
  }
  p.shade(x - r, y - r, x + r, y + r, (px, py, out) => {
    const dx = (px - x) / r, dy = (py - y) / r, d2 = dx * dx + dy * dy;
    if (d2 > 1) return;
    const z = Math.sqrt(1 - d2);
    // three spinning band systems, about three different axes
    const b1 = Math.sin(Math.atan2(dy, dx) * 3 - t * 26 + z * 4);
    const b2 = Math.sin((dx * 0.7 + z) * 7 + t * 31);
    const b3 = Math.sin((dy + z * 0.6) * 8 - t * 22);
    const lit = 0.55 * z + 0.25 * (-dx - dy) + 0.2 * Math.max(b1, b2, b3);
    out.k = 0.25;
    if (d2 < 0.12) return WHITE;
    if (Math.max(b1, b2, b3) > 0.86) return d2 < 0.5 ? WHITE : C[n - 1];
    return lit > 0.55 ? C[n - 1] : lit > 0.3 ? C[n - 2] : lit > 0.05 ? C[n - 3] : C[n - 4];
  });
}
// where the hands meet for a sign, for the chakra flash
const handsOf = (pose) => [(pose.fx + pose.bx) / 2, (pose.fy + pose.by) / 2];

/**
 * A run of seals: pose keys snapped on one after another every dt from t0, the last one held until `hold`.
 * at: overrides for where the last (held) sign sits, e.g. Tiger raised to the mouth for fire.
 * Returns { keys, list: [{ t, sign, x, y }], end } for drawSeals().
 */
export function sealRun(t0, names, dt, { hold = 0, last = {}, kind = null } = {}) {
  const keys = [], list = [];
  names.forEach((n, i) => {
    const sign = SIGNS[n], fin = i === names.length - 1, pose = fin ? { ...sign.pose, ...last } : sign.pose, t = t0 + i * dt;
    keys.push([t, pose, i ? "snap" : "out"]);
    list.push({ t, sign, xy: handsOf(pose), fin });
  });
  const end = t0 + (names.length - 1) * dt + Math.max(dt, hold);
  return { keys, list, end, dt, kind };
}

/**
 * Draw what a seal run looks like: on each new sign a pulse of chakra flashes between the hands in the element's
 * color, and the sign's name pops up over the head (the last one held and glowing). C: the element ramp, dark to bright.
 */
export function drawSeals(p, t, run, C) {
  const n = C.length, OUT = hex("#120c18");
  aura(p, t, run, C);
  for (const s of run.list) {
    const a = t - s.t, life = s.fin ? run.end - s.t + 0.15 : run.dt;
    if (a < 0 || a > life) continue;
    const [hx, hy] = s.xy;
    // the flash between the hands: hot for two frames, then a ring that opens and fades
    const k = 1 - clamp(a / Math.min(life, 0.3));
    if (a < 0.07) {
      p.circle(hx, hy, 2.2, C[n - 2]);
      p.px(hx, hy, WHITE);
    }
    if (k > 0) {
      p.ring(hx, hy, 2 + 6 * (1 - k), 1, C[n - 3], k);
      p.glow(hx, hy, 12, C[n - 3], 0.5 * k);
    }
    if (s.fin && a > 0.07) p.glow(hx, hy, 9, C[n - 2], 0.35 + 0.15 * Math.sin(t * 30));
    // the sign's name: pops up with a little overshoot, white for a frame, then in the element's light color
    const up = ease.outBack(clamp(a / 0.08), 2.5), fade = s.fin ? 1 - clamp((a - life + 0.15) / 0.15) : 1 - clamp((a - life * 0.75) / (life * 0.25));
    if (fade <= 0) continue;
    const y = -44 - 3 * up;
    p.text(s.sign.name, 6, y, a < 0.04 ? WHITE : C[n - 2], { font: "mini", align: "center", outline: OUT, a: fade });
  }
  // the count of signs so far: little dots under the name
  const done = run.list.filter((s) => t >= s.t).length;
  if (!done || t >= run.end + 0.15) return;
  if (run.list.length > 12) p.text(`${done}/${run.list.length}`, 6, -39, C[n - 3], { font: "mini", align: "center", outline: OUT });
  else run.list.forEach((s, i) => p.px(6 - (run.list.length - 1) + i * 2, -38, i < done ? C[n - 2] : mix(OUT, C[1], 0.5)));
}

/**
 * create(o) for cues like chain(): { fx, t, until, x, y, angle (numbers or functions of the move's time), flip,
 * ...that effect's options }, plus custom: { update(t, dt), drawBack(p, t), draw(p, t) } drawn in the move's own
 * frame (behind and in front of the cues).
 */
export function play(cues, custom = () => ({})) {
  return (o) => {
    const list = cues.map(({ fx, t, until, x, y, angle, flip, ...opts }, i) => ({ fx, t: t ?? 0, until: until ?? Infinity, x: x ?? 0, y: y ?? 0, angle: angle ?? 0, flip: !!flip, opts: { ...opts, seed: opts.seed ?? (o.seed ?? 1) + i }, inst: null, over: false }));
    const own = custom(o);
    let t = 0;
    const at = (v) => (typeof v === "function" ? v(t) : v);
    const each = (p, layer) => {
      const { tx, ty, fx: sign, cs, sn, fade, lightK } = p;
      for (const c of list) {
        if (!c.inst || c.over) continue;
        c.inst.options.x = tx + sign * at(c.x);
        c.inst.options.y = ty + at(c.y);
        c.inst.options.flip = sign < 0 !== c.flip;
        c.inst.options.angle = sign * at(c.angle);
        c.inst.draw(p.frame, layer);
      }
      Object.assign(p, { tx, ty, fx: sign, cs, sn, fade, lightK });
    };
    return {
      update(dt) {
        t += dt;
        for (const c of list) {
          if (c.over || t < c.t) continue;
          if (!c.inst) c.inst = createFx(c.fx, c.opts);
          else c.inst.update(dt);
          if (t >= c.until || (c.inst.done() && !c.fx.meta?.loop)) c.over = true;
        }
        own.update?.(t, dt);
      },
      drawBack(p) {
        own.drawBack?.(p, t);
        each(p, "back");
      },
      draw(p) {
        each(p, "front");
        own.draw?.(p, t);
      },
    };
  };
}

/** A thrown arc from (x0, y0) to (x1, y1) over T seconds peaking h px above the higher end: position and heading at u = 0..1. */
export function arcPath(x0, y0, x1, y1, h) {
  const top = Math.min(y0, y1) - h;
  // a parabola through both ends with its apex at top: y = a u^2 + b u + c
  const c = y0, d = y1 - y0, m = top - y0;
  // a + b = d and the apex value c - b^2 / 4a = top give b^2 - 4mb + 4dm = 0; the root that starts upward
  const b = 2 * (m - Math.sqrt(Math.max(0, m * m - m * d)));
  const a = d - b;
  return (u) => {
    const x = x0 + (x1 - x0) * u, y = a * u * u + b * u + c;
    return { x, y, ang: Math.atan2(2 * a * u + b, x1 - x0) };
  };
}

/**
 * The chakra each element stirs up while its seals are made, so every jutsu opens in its own way: embers rising
 * off the hands for fire, beads of water circling them, sparks jumping over the body for lightning, rings of wind
 * turning round it, pebbles lifting off the ground for earth. Builds with each seal, fades once the last is held.
 */
function aura(p, t, run, C) {
  if (!run.kind) return;
  const t0 = run.list[0].t, cur = [...run.list].reverse().find((s) => t >= s.t);
  if (!cur || t > run.end + 0.35) return;
  const done = run.list.indexOf(cur) + 1, k = Math.min(1, 0.35 + done / run.list.length) * (1 - smooth(run.end, run.end + 0.35, t));
  const [hx, hy] = cur.xy, n = C.length, a = t - t0;
  if (run.kind === "fire")
    for (let i = 0; i < 10; i++) {
      const per = 0.5 + 0.4 * rand(i, 1), u = (a / per + rand(i, 2)) % 1, x = hx + (rand(i, 3) - 0.5) * 14 + Math.sin(u * 6 + i) * 1.5, y = hy + 2 - u * 24;
      if (u * k > 0.9) continue;
      p.px(x, y, u < 0.3 ? C[n - 1] : u < 0.65 ? C[n - 3] : C[Math.max(0, n - 6)]);
      p.glow(x, y, 4, C[n - 3], 0.25 * k * (1 - u));
    }
  else if (run.kind === "water")
    for (let i = 0; i < 7; i++) {
      const th = a * 4.5 + (i * TAU) / 7, r = 8 + 2 * Math.sin(a * 3 + i), x = hx + Math.cos(th) * r, y = hy + Math.sin(th) * r * 0.45 - 1, near = Math.sin(th) > 0;
      p.circle(x, y, near ? 1.2 : 0.8, near ? C[n - 2] : C[n - 4], k);
      if (near) p.px(x - 0.5, y - 0.5, WHITE);
    }
  else if (run.kind === "lightning") {
    const f = Math.floor(t * 24);
    for (let i = 0; i < 3; i++) {
      if (rand(f, i + 9) > 0.35 + 0.5 * k) continue;
      let x = 2 + (rand(f, i) - 0.5) * 18, y = -6 - rand(f, i + 3) * 30;
      for (let s2 = 0; s2 < 3; s2++) {
        const nx = x + (rand(f, i * 7 + s2) - 0.5) * 7, ny = y + (rand(f, i * 5 + s2 + 1) - 0.5) * 7;
        p.line(x, y, nx, ny, s2 === 1 ? WHITE : C[n - 2]);
        (x = nx), (y = ny);
      }
      p.glow(x, y, 8, C[n - 3], 0.4 * k);
    }
  } else if (run.kind === "wind")
    for (let ring = 0; ring < 2; ring++) {
      const cy = -12 - ring * 14, rx = 13 - ring * 2, ry = 3.5, sp = 7 + ring * 2;
      for (let j = 0; j < 14; j++) {
        const th = a * sp + ring * 2 + j * 0.16, x = 2 + Math.cos(th) * rx, y = cy + Math.sin(th) * ry;
        p.px(x, y, Math.sin(th) > 0 ? C[n - 2] : C[n - 4]);
      }
    }
  else if (run.kind === "earth")
    for (let i = 0; i < 8; i++) {
      const per = 0.9 + 0.5 * rand(i, 4), u = (a / per + rand(i, 5)) % 1, x = (rand(i, 6) - 0.5) * 26, lift = Math.sin(Math.PI * u) * (6 + 8 * rand(i, 7)) * k;
      if (lift < 0.6) continue;
      p.rect(x, -lift - 1, 2, 2, C[Math.min(n - 1, 2)]);
      p.px(x, -lift - 1, C[n - 1]);
    }
}

/**
 * Anime impact frames over the whole picture painted so far: everything drawn turns to an ink silhouette on white paper,
 * burst lines rush in at (cx, cy); inv swaps ink and paper (the second beat). Covers the local box x0..x1, y0..y1.
 */
const INK = hex("#08070e"), PAPER = hex("#fffdf6");
export function impactFrame(p, x0, y0, x1, y1, cx, cy, inv = false, seed = 1, { ink = INK, paper = PAPER, lines: nl = 60 } = {}) {
  const n = Math.max(1, nl), lines = Array.from({ length: n }, (_, i) => {
    const thick = rand(i, seed + 3) < 0.2;
    return { a: ((i + 0.2 + rand(i, seed) * 0.6) / n) * TAU - Math.PI, inner: thick ? 26 + rand(i, seed + 1) * 20 : 16 + rand(i, seed + 1) * 60, w: thick ? 4 + rand(i, seed + 2) * 3 : 1 + rand(i, seed + 2) * 2.4 };
  });
  p.each(x0, y0, x1, y1, (lx, ly, sx, sy) => {
    const i = (sy - p.oy) * p.w + (sx - p.ox), c = p.C[i];
    const dx = lx - cx, dy = (ly - cy) * 1.3, rho = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const slot = Math.floor(((ang + Math.PI) / TAU) * n);
    let line = false;
    for (let k = -1; k <= 1 && !line && nl > 0; k++) {
      const l = lines[(slot + k + n) % n];
      let d = Math.abs(ang - l.a);
      if (d > Math.PI) d = TAU - d;
      line = rho > l.inner && d * rho < l.w * clamp((rho - l.inner) / 40);
    }
    const isInk = ((c >>> 24) > 70) !== line;
    p.C[i] = isInk !== inv ? ink : paper;
    p.L[i] = 0;
  });
}

/** A chunk of rock: a lumpy polygon of size s at (x, y), turned by a, lit from the upper left. C: dark..light (4). */
export function drawChunk(p, x, y, s, a, C, k = 1) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const aa = a + (i / 6) * TAU, r = s * (0.7 + 0.3 * rand(i, Math.floor(s * 7)));
    pts.push([x + Math.cos(aa) * r, y + Math.sin(aa) * r]);
  }
  p.poly(pts, C[1], k);
  p.poly(pts.map(([px, py]) => [x + (px - x) * 0.6 - s * 0.15, y + (py - y) * 0.6 - s * 0.15]), C[2], k);
  p.px(x - s * 0.35, y - s * 0.4, C[3]);
}

/**
 * A big explosion with depth, age seconds after it went off at (x, y) on the floor, R its size: a white flash, a
 * fireball that swells, boils (noise-shaded as a lit sphere, hot white-yellow core cooling to the ramp's dark) and
 * rises into a column; a shock ring racing along the ground and a pressure sphere in the air; chunks of ground thrown
 * out on arcs; smoke rolling up after. C: the ramp, dark to bright (5+). layer "back" draws the parts behind a target
 * (the far half of the ground ring, the smoke), "front" the rest.
 */
export function blast(p, age, { x = 0, y = 0, R = 40, C, seed = 1, layer = "front", rock = null, smoke = null } = {}) {
  if (age < 0 || age > 3.2) return;
  const n = C.length, SM = smoke ?? [hex("#2a2430"), hex("#4a4250"), hex("#6e6676")];
  const ROCK = rock ?? ["#2a2420", "#4a3e34", "#6e5e4e", "#9a8670"].map(hex);
  const ringR = R * 2.6 * ease.outQuad(clamp(age / 0.55)), ringA = 1 - smooth(0.25, 0.7, age);
  if (layer === "back") {
    // the far half of the ring on the ground, and the smoke that rolls up behind
    if (ringA > 0) p.arc(x, y, ringR, 3, Math.PI, TAU, C[n - 2], ringA * 0.8);
    for (let i = 0; i < 9; i++) {
      const a0 = 0.35 + rand(i, seed) * 0.3, u = clamp((age - a0) / 2.2);
      if (u <= 0 || u >= 1) continue;
      const sx = x + (rand(i, seed + 1) - 0.5) * R * 1.4, sy = y - R * 0.5 - u * R * 2.2 - rand(i, seed + 2) * R * 0.5, r = R * (0.35 + 0.4 * u) * (0.7 + 0.5 * rand(i, seed + 3));
      p.disc(sx, sy, r, (d) => (d < 0.5 ? SM[2] : d < 0.8 ? SM[1] : SM[0]), (d) => (1 - u) * 0.75 * (d < 0.85 ? 1 : 0.5));
    }
    return;
  }
  // the flash
  if (age < 0.08) {
    p.circle(x, y - R * 0.4, R * (0.7 + age * 6), WHITE);
    p.glow(x, y - R * 0.4, R * 4, C[n - 1], 1);
  }
  // the pressure sphere: a thin bright shell expanding through the air
  if (age < 0.4) p.ring(x, y - R * 0.45, R * 0.6 + R * 3.2 * ease.outQuad(age / 0.4), 2, C[n - 1], 1 - age / 0.4);
  // the near half of the ground ring, and the dust it kicks
  if (ringA > 0) {
    p.arc(x, y, ringR, 4, 0, Math.PI, C[n - 2], ringA);
    p.ellipse(x, y, ringR, ringR * 0.18, C[n - 3], ringA * 0.35);
  }
  // the fireball: swells, then lifts into a column and cools
  const sw = ease.outCubic(clamp(age / 0.3)), lift = smooth(0.3, 1.6, age), cool = clamp(age / 0.9), fade = 1 - smooth(1.1, 1.9, age);
  const r = R * (0.25 + 0.85 * sw) * (1 - 0.25 * lift), cy = y - r * 0.55 - lift * R * 1.4;
  if (fade > 0) {
    // the stem feeding it from the ground
    if (lift > 0.05) p.shade(x - r * 0.55, cy, x + r * 0.55, y, (px, py, out) => {
      const v = (py - cy) / (y - cy), w = r * (0.25 + 0.25 * v) * (0.8 + 0.4 * noise2(py * 0.15 - age * 4, 1, seed));
      if (Math.abs(px - x) > w) return;
      out.a = fade * 0.9;
      const e = Math.abs(px - x) / w;
      return C[Math.max(0, Math.min(n - 1, Math.round((n - 2) * (1 - cool) * (1 - e * 0.6) + (1 - v) * 0.5)))];
    });
    p.glow(x, cy, r * 3, C[n - 2], 0.7 * fade * (1 - cool * 0.6));
    p.shade(x - r * 1.3, cy - r * 1.3, x + r * 1.3, cy + r * 1.1, (px, py, out) => {
      const dx = (px - x) / r, dy = (py - cy) / r, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      const lump = 1 + 0.22 * noise2(Math.cos(ang) * 1.6 + seed, Math.sin(ang) * 1.6 - age * 3, seed + 4) + 0.1 * noise2(ang * 3, age * 5, seed);
      if (d > lump) return;
      const z = Math.sqrt(Math.max(0, 1 - (d / lump) ** 2)), boil = noise2(dx * 3 + seed, dy * 3 - age * 5, seed + 9);
      // lit from the upper left and from inside: hot where it's deep, dark at the rim and underneath
      const lit = z * 0.55 + (-dx * 0.3 - dy * 0.45) + boil * 0.35 + (1 - cool) * 0.55 - 0.42;
      out.a = fade;
      const i = Math.max(0, Math.min(n - 1, Math.floor(lit * (n - 1) * 0.95 + 1.2)));
      if (i >= n - 1 && cool < 0.3) out.k = 0.4;
      return C[i];
    });
  }
  // chunks of the ground thrown out on arcs
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * (0.1 + 0.8 * rand(i, seed + 5)), v = R * (2.2 + 3.2 * rand(i, seed + 6)), vx = Math.cos(a) * v, vy = Math.sin(a) * v;
    const cx = x + vx * age, cyy = y - 2 + vy * age + 0.5 * 320 * age * age;
    if (cyy > y || age > 2) continue;
    drawChunk(p, cx, cyy, 1.5 + 2.5 * rand(i, seed + 7), age * 9 * (rand(i, seed) - 0.5), ROCK);
  }
}

// Mokuton Hijutsu: Jukai Kotan (Wood Release Secret Technique: Nativity of a World of Trees, Hashirama). Narutopedia:
// seals Tiger, Snake; Hashirama, the First Hokage, makes a whole forest grow and steers it with his chakra; the trees
// split the earth as they sprout, pierce whatever is in their way and grow fast enough to catch a target before it can
// run. Here it is meant to frighten: the two seals, his palms slammed to the floor, the earth splitting in a line past
// the target; a forest of giant trees tears up out of the ground behind it, trunks thicker than a man, roots heaving,
// a canopy that darkens the sky; two great trunks lunge out of it like snakes, coil round the target and crush it,
// and drag it back, struggling, into the dark between the trees, where it is gone. Leaves fall.
// New: the forest wall (giant tapering trunks with root flares and bark, a canopy of shaded leaf masses, the dark inside),
// the grasping trunks (bodies that follow a path out of the forest into a helix round the target), the drag
// (targetState).
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, drawChunk, veil } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["tora", "mi"], 0.14, { hold: 0.25, kind: "earth" });
const PRESS = SEALS.end, SPLIT = PRESS + 0.12, FOREST = SPLIT + 0.25, GROWN = FOREST + 0.75, LUNGE = GROWN - 0.15, WRAPPED = LUNGE + 0.55;
const SQ = [WRAPPED + 0.1, WRAPPED + 0.45], DRAG = WRAPPED + 0.8, TAKEN = DRAG + 0.9, END = TAKEN + 1.4, TX = 150;
const BARK = ["#1a0f08", "#2e1c0e", "#4a2e18", "#6e4626", "#946038", "#b88250"].map(hex), LEAF = ["#060f08", "#0e2010", "#183a18", "#28581e", "#4a8a2a"].map(hex);
const DARK = hex("#060a06");
// the forest: giant trees behind the target, each its own root point, girth, lean, height, when it tears up
const TREES = [
  { x: 186, w: 22, lean: -0.08, h: 230, d: 0.0 },
  { x: 222, w: 28, lean: 0.05, h: 240, d: 0.08 },
  { x: 262, w: 20, lean: -0.04, h: 220, d: 0.16 },
  { x: 298, w: 30, lean: 0.06, h: 240, d: 0.04 },
  { x: 330, w: 22, lean: -0.05, h: 220, d: 0.12 },
  { x: 168, w: 14, lean: -0.2, h: 150, d: 0.2 },
];
// the two trunks that take it: out of the forest, a curve through the air, then coiled round the target
const GRAB = [
  { root: [236, -40], c1: [180, -120], c2: [120, -70], yc: -32, R: 15, turns: 1.4, pitch: 9, dir: 1, w: 12, d: 0 },
  { root: [280, -8], c1: [230, 20], c2: [110, 10], yc: -14, R: 13, turns: 1.2, pitch: 8, dir: -1, w: 10, d: 0.1 },
];

export const meta = {
  name: "Nativity of a world of trees",
  desc: "Hashirama: Tiger, Snake, palms to the floor; the earth splits and a forest of giant trees tears up behind the target, darkening the sky; two great trunks lunge out, coil round the target, crush it and drag it back into the dark between the trees.",
  tags: ["jutsu", "hashirama", "wood", "mokuton", "control", "aoe", "one-shot"],
  size: [400, 250],
  origin: [50, 212],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a0e", "#4a2e18", "#6e4626", "#946038", "#b88250"], seed: 72 },
};

const PALMS = { ...READY, crouch: 15, lean: 20, fx: 14, fy: 0, bx: 8, by: 0, ffx: 6, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [PRESS, PALMS, "in"],
    [END - 0.5, { ...PALMS, crouch: 12 }],
    [END, READY],
  ],
  hits: [
    { t: PRESS, stop: 0.08, shake: 0.3, amp: 2, target: false },
    { t: FOREST + 0.05, stop: 0.1, shake: 0.6, amp: 4, push: 1.5, straw: 10 },
    { t: WRAPPED, stop: 0.1, shake: 0.3, amp: 2, push: 1, straw: 16, shiver: 0.5 },
    ...SQ.map((t, i) => ({ t, stop: 0.06, shake: 0.2, amp: 2, push: 0, straw: 12 + i * 6, shiver: 0.4 })),
    { t: DRAG, stop: 0.04, shake: 0.2, amp: 1, push: -1, straw: 8 },
  ],
  dust: [{ t: PRESS, x: 14, n: 8 }, { t: FOREST + 0.05, x: 180, n: 16, dir: -1 }],
};

// where the target is dragged: back and up into the forest, shrinking into the dark; a struggle on the way
const dragOf = (t) => ease.inOutCubic(smooth(DRAG, TAKEN, t));
export const targetState = (t) => {
  if (t < DRAG) return null;
  const u = dragOf(t);
  return { dx: 120 * u + Math.sin(t * 30) * 2 * (1 - u), dy: -30 * Math.sin(Math.PI * u * 0.8), rot: 0.4 * Math.sin(t * 8) * (1 - u), s: 1 - 0.45 * u, a: 1 - smooth(0.75, 1, u), tint: [DARK, 0.75 * u] };
};
const targetPos = (t) => {
  const st = targetState(t) ?? {};
  return [TX + (st.dx ?? 0), -26 + (st.dy ?? 0), st.s ?? 1];
};

const bez = (a, b, c, d, u) => {
  const v = 1 - u;
  return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
};
// a grasping trunk's path: the curve out of the forest, then the coil round the target (back = behind it)
function grabPath(g, t) {
  const [cx, cy0, sc] = targetPos(t), squeeze = SQ.reduce((m, s) => (t > s ? Math.max(m, Math.exp(-(t - s) * 7)) : m), 0), R = g.R * sc * (1 - 0.12 * squeeze), cy = cy0 + (g.yc + 26) * sc;
  const coilY = (th) => cy + g.dir * g.pitch * sc * ((th - Math.PI) / TAU - g.turns / 2) + R * 0.32 * Math.sin(th);
  const entry = [cx - R, coilY(Math.PI)], pts = [];
  for (let i = 0; i <= 30; i++) {
    const [x, y] = bez(g.root, g.c1, [g.c2[0] + (cx - TX), g.c2[1]], entry, i / 30);
    pts.push({ x, y, back: false });
  }
  for (let th = Math.PI + 0.15; th <= Math.PI + g.turns * TAU; th += 0.15) pts.push({ x: cx + Math.cos(th) * R, y: coilY(th), back: Math.sin(th) < 0 });
  let L = 0;
  pts[0].s = 0;
  for (let i = 1; i < pts.length; i++) pts[i].s = L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return { pts, L, squeeze, sc };
}
// how far the trunk has grown along its path: it lunges out, winds on, then is drawn back as it drags
const grabLen = (g, P, t) => P.L * ease.outCubic(clamp((t - LUNGE - g.d) / (WRAPPED - LUNGE - g.d))) * (1 - 0.9 * smooth(DRAG + 0.3, TAKEN + 0.1, t));

// bark along a polyline (pts with s), from s = 0 to len, width w at the root tapering to the tip
function bark(p, pts, len, w0, w1, back, layer) {
  for (let pass = 0; pass < 2; pass++)
    for (let i = 1; i < pts.length && pts[i - 1].s < len; i++) {
      const a = pts[i - 1], b = pts[i];
      if (layer && (layer === "back") !== (a.back && b.back)) continue;
      const u = a.s / Math.max(1, len), w = w0 + (w1 - w0) * u;
      if (pass === 0) {
        p.beam(a.x, a.y, b.x, b.y, w + 2, BARK[0]);
        continue;
      }
      const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n, up = ny < 0 ? 1 : -1;
      p.beam(a.x, a.y, b.x, b.y, w, back || (a.back && b.back) ? BARK[2] : BARK[3]);
      p.beam(a.x + nx * up * w * 0.22, a.y + ny * up * w * 0.22, b.x + nx * up * w * 0.22, b.y + ny * up * w * 0.22, w * 0.3, back ? BARK[3] : BARK[5]);
      // the grain: dark cracks running along the wood
      if (Math.floor(a.s / 4) % 3 === 0) p.line(a.x - nx * w * 0.3, a.y - ny * w * 0.3, b.x - nx * w * 0.3, b.y - ny * w * 0.3, BARK[1]);
    }
}

// one giant tree: a trunk tearing up out of the earth (g grown 0..1), root flares, bark, branches into the canopy
function tree(p, q, g, t) {
  if (g <= 0) return;
  const top = q.h * g, W = q.w, sway = Math.sin(t * 1.3 + q.x) * 1.5;
  p.shade(q.x - W - 14, -top - 2, q.x + W + 14, 1, (x, y) => {
    const v = -y / q.h, cx = q.x + q.lean * -y + sway * v * v, half = W * (0.55 + 0.45 * Math.pow(1 - Math.min(1, v), 2)) + (v < 0.08 ? (0.08 - v) * 160 : 0);
    const dx = x - cx;
    if (Math.abs(dx) > half) return;
    const e = dx / half;
    if (Math.abs(e) > 0.86) return BARK[0];
    // bark: lit on its left, ridged with long cracks
    const ridge = Math.abs(Math.sin(dx * 0.55 + noise2(x * 0.1, y * 0.03, q.x) * 3)) < 0.18;
    if (ridge) return BARK[1];
    return e < -0.4 ? BARK[4] : e < 0.2 ? BARK[3] : e < 0.6 ? BARK[2] : BARK[1];
  });
}
function canopy(p, k, t) {
  if (k <= 0) return;
  // great masses of leaves over the trees, shaded dark under, lit on top, shivering
  p.shade(150, -212, 352, -120, (x, y, out) => {
    const n = noise2(x * 0.035 + t * 0.1, y * 0.05, 41) * 0.6 + noise2(x * 0.09, y * 0.12 - t * 0.2, 42) * 0.4, edge = -212 + 92 * (1 - k) + 18 * noise2(x * 0.05, 7, 43);
    const bottom = -150 + 22 * noise2(x * 0.06, 3, 44) - (1 - k) * 40;
    if (y > bottom || y < edge || x < 158 + 20 * noise2(y * 0.05, 1, 45)) return;
    const v = n + (y - bottom) / -60;
    return v > 0.8 ? LEAF[4] : v > 0.45 ? LEAF[3] : v > 0.1 ? LEAF[2] : LEAF[1];
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const torn = TREES.map(() => false);
  const grow = (q, t) => ease.outCubic(clamp((t - FOREST - q.d) / 0.6));
  return {
    update(t, dt) {
      TREES.forEach((q, i) => {
        if (!torn[i] && t >= FOREST + q.d) {
          torn[i] = true;
          for (let j = 0; j < 16; j++) ps.spawn(P.GRIT, q.x + R.range(-q.w, q.w), -1, R.range(-120, 120), -R.range(80, 240), R.range(0.6, 1.1), hex(["#3a3048", "#5a4c66", "#4a2e18"][j % 3]), R.chance(0.5) ? 2 : 1);
        }
      });
      // leaves drifting down once the canopy is out
      if (t > GROWN && R.chance(18 * dt)) ps.spawn(P.EMBER, R.range(140, 340), -R.range(120, 160), R.range(-20, 10), R.range(15, 35), R.range(1.5, 2.5), R.chance(0.5) ? LEAF[3] : LEAF[4]);
      ps.update(dt);
    },
    drawBack(p, t) {
      const fadeAll = 1 - smooth(END - 0.6, END, t), pf = p.fade;
      p.fade = pf * fadeAll;
      // the forest darkens everything behind and above it
      const fk = smooth(FOREST, GROWN, t);
      veil(p, 130, -212, 352, 0, DARK, 0.75 * fk, 40);
      TREES.forEach((q) => tree(p, q, grow(q, t), t));
      canopy(p, smooth(FOREST + 0.3, GROWN + 0.2, t), t);
      // the gloom of the forest: deeper toward its heart, so the trees loom out of the dark
      p.shade(150, -212, 352, 0, (x, y) => {
        const k = fk * clamp((x - 160) / 150) * 0.7;
        if (k > 0.02) p.blend(x, y, DARK, k);
      });
      // the dark inside the forest the target is dragged into
      if (t > DRAG - 0.2) p.glow(260, -40, 60, DARK, 0);
      // the split in the floor, racing from his palms past the target, rubble jumping out of it
      if (t > SPLIT) {
        const u = clamp((t - SPLIT) / 0.25), x1 = 14 + (TX + 70 - 14) * u;
        for (let x = 14; x < x1; x += 3) {
          const y = Math.sin(x * 0.7) * 1.2;
          p.line(x, 0.5 + y * 0.3, x + 3, 0.5 + Math.sin((x + 3) * 0.7) * 0.36, hex("#120c18"));
        }
      }
      // the far halves of the coils, behind the target: drawn into a copy of the box, then the target put back over them
      p.fade = pf;
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, BARK.slice(2).concat([LEAF[4]]));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "wood", t0: 0.05, t1: SEALS.end, label: "MOKUTON", head: b.head });
      const fadeAll = 1 - smooth(END - 0.6, END, t), pf = p.fade;
      p.fade = pf * fadeAll;
      // roots heaving up out of the split near the target
      if (t > FOREST) {
        const k = ease.outBack(clamp((t - FOREST) / 0.35), 1.6);
        for (let i = 0; i < 5; i++) {
          const x = TX - 50 + i * 22, h = (8 + 10 * rand(i, 3)) * k, dir = i % 2 ? 1 : -1;
          const pts = [];
          for (let j = 0; j <= 8; j++) {
            const u = j / 8;
            pts.push({ x: x + dir * 14 * u, y: -Math.sin(Math.PI * u) * h, back: false });
          }
          pts.forEach((q, j) => (q.s = j * 3));
          bark(p, pts, 24, 5, 2, false);
        }
        // rock chunks thrown up where it tore open
        const age = t - FOREST;
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI * (0.2 + 0.6 * rand(i, 5)), v = 80 + 120 * rand(i, 6), x = 180 + rand(i, 7) * 120 + Math.cos(a) * v * age, y = Math.sin(a) * v * age + 200 * age * age;
          if (y < 0 && age < 1.2) drawChunk(p, x, y, 2 + 3 * rand(i, 8), age * 6, ["#2a2420", "#4a3e34", "#6e5e4e", "#9a8670"].map(hex));
        }
      }
      // the two trunks that take it
      if (t > LUNGE) {
        const [cx, cy, sc] = targetPos(t), X0 = Math.floor(cx - 30), X1 = Math.ceil(cx + 30), Y0 = Math.floor(cy - 40), Y1 = Math.ceil(cy + 34), keep = [];
        const Ps = GRAB.map((g) => grabPath(g, t)), lens = GRAB.map((g, i) => grabLen(g, Ps[i], t));
        for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) keep.push(p.get(x + 0.5, y + 0.5));
        GRAB.forEach((g, i) => bark(p, Ps[i].pts, lens[i], g.w * sc, g.w * 0.55 * sc, true, "back"));
        let j = 0;
        for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++, j++) if (keep[j] >>> 24 > 0) p.px(x + 0.5, y + 0.5, keep[j]);
        GRAB.forEach((g, i) => bark(p, Ps[i].pts, lens[i], g.w * (Ps[i].pts[0].s < 1 ? 1 : 1), g.w * 0.55 * sc, false, "front"));
        // the strain of the squeeze: splinters and cracks of light off the wood
        const sq = Ps[0].squeeze;
        if (sq > 0.3) for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU, x = cx + Math.cos(a) * 22 * sc, y = cy + Math.sin(a) * 16 * sc;
          p.line(x, y, x + Math.cos(a) * 5 * sq, y + Math.sin(a) * 5 * sq, WHITE, sq);
        }
      }
      // the forest's shadow falling over everything once it stands
      veil(p, -50, -212, 352, 40, DARK, 0.18 * smooth(FOREST, GROWN, t), 60);
      p.fade = pf;
      ps.draw(p, "front");
    },
  };
});

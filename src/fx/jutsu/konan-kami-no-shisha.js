// Kami no Shisha no Jutsu (Paper Person of God Technique / Angel's sea of tags, Konan). Narutopedia: Konan's
// ultimate trap: she turned a whole lake into paper, six hundred billion explosive tags hidden under its surface;
// parting it like a sea she trapped her enemy in the trench between the walls, then set them off in a chain that
// burned for ten minutes. Here: her paper wings spread (sheets of paper unfolding into angel wings); she raises her
// hands, and to either side of the target two walls of paper rise out of the ground like a parted sea, fluttering;
// the sheets turn over: every one is an explosive tag, its seal glowing; the walls lean and fold in over the target;
// she closes her hands and the tags go off in a rippling chain from the ends inward, blast after blast, finishing in
// one big detonation; ash and burnt paper drift down.
// New: the paper wings, the walls of tags (each sheet its own flutter and flip), the folding, the chain of blasts.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE } from "../../core/index.js";
import { play, bodyAt, blast } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const WINGS = 0.25, RAISE = 0.7, WALL = 0.85, FLIP = 1.7, FOLD = 2.1, IGNITE = 2.45, BIG = 3.35, END = 5.0, TX = 180;
const PAPER = ["#8a8278", "#c8c0b0", "#f0ece0", "#ffffff"].map(hex), SEAL = hex("#c01a2a"), FIRE = ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"].map(hex);
const COLS = 7, ROWS = 12;

export const meta = {
  name: "Paper person of god",
  desc: "Konan: paper wings spread; two walls of paper rise on either side of the target like a parted sea, turn over to show they're all explosive tags, fold in over it, and go off in a rippling chain of blasts that ends in one huge detonation.",
  tags: ["jutsu", "konan", "akatsuki", "paper", "explosive-tags", "aoe", "one-shot"],
  size: [320, 220],
  origin: [56, 190],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#8a8278", "#c8c0b0", "#f0ece0", "#c01a2a"], seed: 155 },
};

const UP = { ...READY, crouch: 2, lean: -4, fx: 14, fy: -44, bx: 6, by: -42, ffx: 7, fbx: -7, y: -6, gait: false };
const CLOSEP = { ...UP, fx: 16, fy: -34, bx: 12, by: -32, lean: 4 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [WINGS + 0.3, { ...READY, y: -6, crouch: 2, fx: 8, fy: -22, bx: -6, by: -22, gait: false }, "out"],
    [RAISE + 0.2, UP, "out"],
    [FOLD, UP],
    [IGNITE, CLOSEP, "snap"],
    [END - 0.4, CLOSEP],
    [END, { ...READY, y: 0, gait: false }],
  ],
  hits: [
    { t: WALL, shake: 0.8, amp: 1, target: false, sfx: "whoosh" },
    { t: FLIP, target: false, sfx: "cast" },
    { t: FOLD + 0.25, stop: 0.05, push: 0, straw: 6, flash: 0, sfx: "block" },
    ...Array.from({ length: 6 }, (_, i) => ({ t: IGNITE + 0.12 + i * 0.13, stop: 0.03, shake: 0.4, amp: 2, push: 1, straw: 12, skin: "char", sfx: "explosion" })),
    { t: BIG, stop: 0.25, shake: 1.4, amp: 7, push: 8, straw: 60, flash: 0.1, sfx: "explosion" },
    { t: BIG + 1.0, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the sheets: two walls, left and right of the target; each sheet has its own rise delay, flutter, and blast time
  // (the chain runs in from the outer ends)
  const SH = [];
  for (const side of [-1, 1]) for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const bx = TX + side * (18 + c * 7), by = -4 - r * 7, out = c / (COLS - 1);
    SH.push({ side, c, r, bx, by, d: c * 0.04 + r * 0.025 + rand(c * 31 + r, side + 3) * 0.06, ph: rand(c, r + 9) * 6, tb: IGNITE + (1 - out) * 0.8 + rand(r, c + 5) * 0.06 });
  }
  return {
    update(t, dt) {
      for (const s of SH) if (t >= s.tb && !s.hit && (s.r % 3 === 0) && (s.c % 2 === 0)) { s.hit = 1; lights.add(s.fx ?? s.bx, s.fy ?? s.by, 40, FIRE[4], 0.35, 0.15); }
      if (t >= BIG && !this.b) { this.b = 1; lights.add(TX, -40, 140, FIRE[4], 0.5, 0.5); }
      if (t > BIG + 0.2 && t < END - 0.5 && R.chance(30 * dt)) ps.spawn(P.DUST, TX + R.range(-80, 80), -R.range(80, 140), R.range(-10, 10), R.range(10, 30), R.range(1, 1.6), R.chance(0.5) ? hex("#2a2420") : PAPER[0]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), [cx, cy] = b.chest, k = ease.outBack(smooth(WINGS, WINGS + 0.45, t), 1.3) * (1 - smooth(END - 0.5, END, t));
      // the paper wings: rows of sheets fanning out from her back like feathers, each a little card with a fold line
      if (k > 0.02) for (const [wi, off, sh] of [[0, 3, 1], [1, 0, 2]]) {
        // the wing's leading edge: an arc up and back from the shoulder blade, flapping slowly
        const flap = Math.sin(t * 2.4 + wi) * 0.08, edge = (s) => { const a = -1.75 - 0.9 * s + flap * s; return [cx - 3 + off * 0.3 + Math.cos(a) * 30 * s * k, cy - 5 - off + Math.sin(a) * 30 * s * k - 6 * s * s * k]; };
        // the feathers: paper sheets hanging back and down from the edge, longest at the wing's outer half
        for (let i = 9; i >= 0; i--) {
          const s = 0.12 + (i / 9) * 0.88, [ex, ey] = edge(s), L = (8 + 14 * Math.sin(s * Math.PI * 0.85)) * k, a = 1.9 + 0.5 * s + flap;
          const fx = ex + Math.cos(a) * L, fy = ey + Math.sin(a) * L;
          p.beam(ex, ey, fx, fy, 3.4, PAPER[0]);
          p.beam(ex, ey, fx, fy, 2.4, PAPER[sh]);
          p.px(fx, fy, PAPER[0]);
        }
        for (let s = 0.05; s <= 1; s += 0.05) { const [x, y] = edge(s); p.rect(x - 1, y - 1, 2, 2, PAPER[3]); }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "konan", t0: 0.04, t1: WINGS, label: "KAMI NO SHISHA", head: b.head });
      // the walls of sheets: rising in a ripple, fluttering; flipping over to show the tags; leaning in to fold over the
      // target; then each blowing up on its beat
      for (const s of SH) {
        const rise = ease.outBack(smooth(WALL + s.d, WALL + s.d + 0.35, t), 1.6);
        if (rise <= 0.01 || t > s.tb + 0.05) continue;
        const fold = ease.inOutQuad(smooth(FOLD + s.r * 0.01, FOLD + 0.35 + s.r * 0.01, t));
        // folding: each column rotates in about its foot toward the target's top
        const h = -s.by * rise, ang = s.side * (Math.PI / 2) * fold * (0.55 + 0.45 * (s.c / (COLS - 1)));
        const x = s.bx - Math.sin(ang) * h * 0.9 + Math.sin(t * 7 + s.ph) * 1.2 * (1 - fold), y = -Math.cos(ang) * h + Math.cos(t * 6 + s.ph) * 0.8;
        s.fx = x; s.fy = y;
        const flip = smooth(FLIP + s.c * 0.03 + s.r * 0.015, FLIP + 0.12 + s.c * 0.03 + s.r * 0.015, t), w = Math.abs(Math.cos(flip * Math.PI)) * 2.5 + 0.5;
        const face = flip > 0.5;
        p.rect(x - w, y - 3, w * 2, 6, face ? PAPER[2] : PAPER[1 + ((s.c + s.r) & 1)]);
        if (face && w > 1.2) { p.line(x, y - 2, x, y + 2, SEAL); p.px(x - 1, y - 1, SEAL); }
        // the seals' glow just before they go
        if (t > s.tb - 0.15) p.px(x, y, FIRE[4]);
      }
      // the chain of blasts: a blast for every few sheets, rippling in from the ends; then the big one
      for (const s of SH) if (s.r % 3 === 0 && s.c % 2 === 0 && t > s.tb) blast(p, t - s.tb, { x: s.fx ?? s.bx, y: s.fy ?? s.by, R: 9, C: FIRE, seed: s.c * 13 + s.r });
      if (t > BIG) {
        blast(p, t - BIG, { x: TX, y: 0, R: 60, C: FIRE, seed: 7 });
        const v = clamp((t - BIG) / 0.5);
        p.ring(TX, -30, 20 + 120 * v, 2, FIRE[5], 1 - v);
      }
      void noise2; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

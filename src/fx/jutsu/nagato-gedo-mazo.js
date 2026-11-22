// Kuchiyose: Gedo Mazo (Summoning: Demonic Statue of the Outer Path, Nagato). Narutopedia: the husk of the Ten-Tails,
// sealed in the moon until the Rinnegan called it down to earth; the Akatsuki's vessel for the tailed beasts; chained,
// bound at the wrists, its eyes sewn and blindfolded, its mouth gagged. Here: Nagato bites his thumb and slams his palm
// down; the summoning circle spreads; the earth splits and the statue heaves up out of it behind him, an enormous grey
// torso, arms bound in shackles at the wrists, nine eyes closed on its blindfold, the gag; it opens its eyes (the
// Rinnegan's ripples in each), the chains snap taut; its jaw drops and a black wind howls out of its mouth over the
// target, pulling wisps of white out of it (the soul-draining dragon), and the target sags; the statue sinks back.
// New: the statue (rising out of the split ground, shackles, blindfold eyes, gag), its roar, the drain.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const BITE = 0.3, SLAM = 0.55, RISE = 0.75, RISEN = 1.7, EYES = 1.95, ROAR = 2.35, DRAIN = 2.6, SINK = 4.0, END = 4.8, TX = 220;
const ST = ["#141218", "#2a2630", "#46404e", "#6a6474", "#9a94a4"].map(hex), PU = ["#3a2a6a", "#8a7ad0", "#d8d0ff"].map(hex);
const SX = 50;

export const meta = {
  name: "Summoning: Demonic Statue of the Outer Path",
  desc: "Nagato: a palm slammed down, the ground splits and the Gedo Statue heaves up behind him, shackled at the wrists, its nine eyes opening with the Rinnegan's ripples; its gagged jaw drops and a black wind howls out over the target, drawing white wisps out of it, then it sinks back.",
  tags: ["jutsu", "nagato", "pain", "rinnegan", "summon", "drain", "aoe", "one-shot"],
  size: [340, 260],
  origin: [56, 228],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#141218", "#2a2630", "#46404e", "#6a6474", "#9a94a4"], seed: 150 },
};

const SLAMP = { ...READY, crouch: 14, lean: 16, fx: 16, fy: -2, bx: -4, by: -18, ffx: 10, fbx: -12 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [BITE, { ...READY, crouch: 2, fx: 6, fy: -32, bx: -4, by: -20 }, "out"],
    [SLAM, SLAMP, "in"],
    [RISEN, { ...SLAMP, crouch: 10 }],
    [RISEN + 0.3, { ...READY, crouch: 3, fx: 10, fy: -24, bx: -4, by: -20 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: SLAM, stop: 0.06, shake: 0.3, amp: 2, target: false, sfx: "step" },
    { t: RISE, shake: 1.2, amp: 4, target: false, sfx: "rumble" },
    { t: EYES, stop: 0.1, target: false, sfx: "cast" },
    { t: ROAR, stop: 0.08, shake: 1.0, amp: 4, push: -3, straw: 10, target: true, sfx: "explosion" },
    ...[0.5, 0.9, 1.3].map((d) => ({ t: DRAIN + d, stop: 0.02, push: 1, straw: 6, flash: 0, skin: "shadow", shiver: 0.6 })),
    { t: SINK + 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RISE, x: SX - 30, n: 20, dir: -1 }, { t: RISE, x: SX + 30, n: 20, dir: 1 }],
};
// the target sags as its soul is drawn
export const targetState = (t) => (t > DRAIN && t < SINK + 0.3 ? { dy: 4 * smooth(DRAIN, SINK, t), s: 1 - 0.08 * smooth(DRAIN, SINK, t), rot: -0.2 * smooth(DRAIN, SINK, t) } : null);


// only what has climbed out of the ground shows: every write below the floor line is dropped
function aboveGround(p, fn) {
  const gy = p.cellY(0, 0), put = p.put, bl = p.blendPx;
  p.put = function (sx, sy, c, a) { if (sy < gy) put.call(this, sx, sy, c, a); };
  p.blendPx = function (sx, sy, c, a) { if (sy < gy) bl.call(this, sx, sy, c, a); };
  try { fn(); } finally { delete p.put; delete p.blendPx; }
}

// the statue, from the waist up: gaunt, ribbed torso on a narrow waist, broad bony shoulders with spines behind them,
// long arms raised and bound at the wrists in heavy shackles with chains, a long skull-like head with a brow ridge, the
// blindfold band with its nine eyes, and the muzzle gag over the mouth
function drawStatue(p, by, t) {
  aboveGround(p, () => {
    const hy = by - 104, open = smooth(EYES, EYES + 0.15, t), jaw = smooth(ROAR - 0.15, ROAR, t) * (1 - smooth(SINK - 0.3, SINK, t));
    // the spines over its back
    for (let i = 0; i < 7; i++) { const x = SX - 36 + i * 12, h = 26 + 14 * Math.sin((i / 6) * Math.PI); p.tri(x - 4, by - 66, x + 4, by - 66, x + (i - 3) * 3, by - 66 - h, ST[0]); }
    // torso: broad at the shoulders, narrow at the waist, darker on its far side
    p.poly([[SX - 30, by + 60], [SX + 30, by + 60], [SX + 26, by + 10], [SX + 48, by - 62], [SX - 48, by - 62], [SX - 26, by + 10]], ST[2]);
    p.poly([[SX + 8, by + 60], [SX + 30, by + 60], [SX + 26, by + 10], [SX + 48, by - 62], [SX + 22, by - 62]], ST[1]);
    // the ribs, curving round from the sternum, and the sternum itself
    for (let i = 0; i < 5; i++) { const y = by - 46 + i * 11, w = 34 - i * 3; for (const sg of [-1, 1]) { p.line(SX + sg * 3, y, SX + sg * w * 0.6, y + 3, ST[3]); p.line(SX + sg * w * 0.6, y + 3, SX + sg * w, y + 9, ST[3]); } }
    p.beam(SX, by - 54, SX, by + 4, 3, ST[3]);
    for (let i = 0; i < 4; i++) p.ellipse(SX, by + 16 + i * 10, 10 - i, 3, ST[1]);
    for (const sg of [-1, 1]) {
      const sh = [SX + sg * 46, by - 60], el = [SX + sg * 76, by - 22], wr = [SX + sg * 40, by - 118];
      // upper arm out and down to the elbow, forearm back up to the shackled wrists over its head
      p.beam(sh[0], sh[1], el[0], el[1], 15, ST[1]); p.beam(sh[0], sh[1], el[0], el[1], 11, sg < 0 ? ST[2] : ST[1]);
      p.beam(el[0], el[1], wr[0], wr[1], 12, ST[1]); p.beam(el[0], el[1], wr[0], wr[1], 8, sg < 0 ? ST[3] : ST[2]);
      p.circle(el[0], el[1], 7, ST[2]); p.circle(el[0] - sg * 2, el[1] - 2, 3, ST[3]);
      p.ellipse(sh[0], sh[1] - 2, 14, 10, ST[2]); p.ellipse(sh[0] - sg * 3, sh[1] - 5, 8, 4, ST[3]);
      // the clenched hand above the shackle
      p.ellipse(wr[0] - sg * 2, wr[1] - 8, 7, 6, ST[2]); for (let k = 0; k < 4; k++) p.px(wr[0] - sg * 2 - 4 + k * 2.5, wr[1] - 13, ST[0]);
      // the shackle: a heavy cuff, riveted
      p.rect(wr[0] - 10, wr[1] - 4, 20, 11, ST[0]); p.rect(wr[0] - 8, wr[1] - 2, 16, 7, ST[3]); p.px(wr[0] - 6, wr[1], ST[4]); p.px(wr[0] + 5, wr[1], ST[4]);
      // the chains, slack until the eyes open, then snapping taut out to the sides
      const taut = smooth(EYES, EYES + 0.2, t);
      for (let j = 1; j < 12; j++) { const x = wr[0] + sg * j * 6, y = wr[1] - j * 3.5 * taut + (1 - taut) * (Math.sin(j * 0.5) * 6 + j * 1.5); p.ring(x, y, 1.6, 1, j % 2 ? ST[4] : ST[3]); }
    }
    // neck, then the long head: dome, brow ridge, the blindfold band and nine eyes, the muzzle gag
    p.beam(SX, by - 66, SX, hy + 16, 16, ST[1]);
    p.ellipse(SX, hy - 6, 26, 24, ST[1]); p.ellipse(SX - 2, hy - 8, 24, 22, ST[3]); p.ellipse(SX - 6, hy - 16, 10, 7, ST[4], 0.35);
    p.poly([[SX - 18, hy + 6], [SX + 18, hy + 6], [SX + 12, hy + 26], [SX - 12, hy + 26]], ST[2]);
    p.rect(SX - 27, hy - 6, 54, 9, ST[0]); p.line(SX - 27, hy - 7, SX + 27, hy - 7, ST[1]);
    for (let i = 0; i < 9; i++) {
      const ex = SX - 22 + i * 5.5, ey = hy - 2;
      if (open > 0.1) { p.ellipse(ex, ey, 2.4, 2 * open, PU[0]); p.ring(ex, ey, 1.6 * open, 1, PU[1]); p.px(ex, ey, PU[2]); }
      else { p.line(ex - 2, ey, ex + 2, ey, ST[3]); p.px(ex, ey + 1, ST[3]); }
    }
    if (open > 0.1) p.glow(SX, hy - 2, 30, PU[1], 0.25 * open);
    // the jaw drops below the gag; the gag: a heavy ring muzzle with straps round to the back of the head
    p.rect(SX - 11, hy + 10, 22, 4 + jaw * 16, jaw > 0.1 ? hex("#050308") : ST[1]);
    if (jaw > 0.1) for (let i = 0; i < 5; i++) p.tri(SX - 10 + i * 5, hy + 10, SX - 7 + i * 5, hy + 10, SX - 8.5 + i * 5, hy + 14, ST[4]);
    p.line(SX - 24, hy + 8, SX + 24, hy + 8, ST[0]); p.ring(SX, hy + 9, 5, 2, ST[0]); p.ring(SX, hy + 9, 3, 1, ST[4]);
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const up = (t) => ease.outCubic(smooth(RISE, RISEN, t)) * (1 - ease.inCubic(smooth(SINK, END - 0.2, t)));
  return {
    update(t, dt) {
      if (t > RISE && t < RISEN && R.chance(50 * dt)) ps.spawn(P.GRIT, SX + R.range(-40, 40), -1, R.range(-80, 80), -R.range(60, 180), R.range(0.5, 1), ST[R.int(1, 3)]);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const u = up(t), lift = (1 - u) * 200, by = -40 + lift;
      // the summoning circle spreading from his palm
      if (t > SLAM) { const g = smooth(SLAM, SLAM + 0.3, t), k = 1 - smooth(RISEN, RISEN + 0.4, t); p.ellipse(SX, 0, 70 * g, 4 * g, (d) => (d > 0.85 ? hex("#1a1420") : 0), k); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; p.line(SX + Math.cos(a) * 20 * g, Math.sin(a) * 1.2, SX + Math.cos(a) * 70 * g, Math.sin(a) * 4, hex("#1a1420"), k); } }
      // the crack it climbs out of
      if (t > RISE) p.ellipse(SX, 1, 60, 5, hex("#06040a"), 1 - smooth(END - 0.4, END, t));
      if (u <= 0.01) { ps.draw(p, "back"); return; }
      drawStatue(p, by, t);
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "rinnegan", t0: 0.04, t1: BITE, label: "GEDO MAZO", head: b.head });
      drawGlint(p, t, "rinnegan", SLAM, END - 0.3, b.head);
      if (t > BITE && t < SLAM) p.px(b.handN[0], b.handN[1], hex("#c01a2a"));
      drawPoof(p, SX, -40, t - RISE + 0.1, 3, 8);
      // the black wind out of its mouth over the target; white wisps drawn back out of it into the mouth
      const u = up(t), hy = -40 + (1 - u) * 200 - 100;
      if (t > ROAR && t < SINK) {
        const k = smooth(ROAR, ROAR + 0.15, t) * (1 - smooth(SINK - 0.3, SINK, t)), mx = SX + 6, my = hy + 12;
        p.shade(mx, my - 30, TX + 40, 4, (x, y, out) => { const v = (x - mx) / (TX + 30 - mx), c = my + (-26 - my) * v, w = 6 + 30 * v; const d = Math.abs(y - c) / w + 0.3 * noise2(x * 0.06 - t * 8, y * 0.1, 3); if (d > 1 || v < 0 || v > 1) return; out.a = k * (d > 0.7 ? 0.7 : 0.55); return d > 0.7 ? hex("#2a2236") : hex("#100c18"); });
        if (t > DRAIN) for (let i = 0; i < 8; i++) { const ph = (t * 1.2 + i / 8) % 1, x = TX + (mx - TX) * ph, y = -26 + (my + 26) * ph + Math.sin(ph * 9 + i) * 6; p.px(x, y, WHITE, 1 - ph * 0.6); p.px(x + 1, y, PU[2], 0.6 * (1 - ph)); }
      }
      void rand; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

// Kamui, long range (Obito). Narutopedia: with his right Mangekyou Obito opens a spiralling void at a target and pulls it
// into Kamui's own dimension, a bleak world of endless block-shaped pillars; what is pulled in stays there at his
// mercy. Here: his Mangekyou, a hand raised to the eye, a spiral opening on the target; the target wrung, spun and
// swallowed into it; through the closing hole a glimpse of the dimension of pillars it falls into; and the stolen
// chakra streams back to him: a dark spiralling aura flares round him, buffed (ATK and SPD up). At the end the void
// spits the target back out, dazed.
// New: the target taken (targetState: spun, shrunk to nothing), the window into the dimension, the buff (aura, the chakra
// streaming in, the rising marks). From _lib: warp, drawOutline.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp, drawOutline } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, AIM = OPEN + 0.15, SPIRAL = AIM + 0.15, SUCK = SPIRAL + 0.3, TAKEN = SUCK + 0.75, WINDOW = TAKEN + 0.05, SHUT = WINDOW + 1.0, BUFF = TAKEN + 0.25, SPIT = SHUT + 1.3, END = SPIT + 1.0, TX = 150;
const SP = ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"].map(hex), AURA = ["#2a1840", "#5a3a8a", "#9a78d0", "#e0d0ff"].map(hex);
const VY = -28;

export const meta = {
  name: "Kamui (Obito)",
  desc: "Obito: his Mangekyou, a spiral opens on the target and wrings it into Kamui's dimension of pillars; the stolen chakra streams back into him and a dark spiral aura flares (ATK and SPD up), until the void spits the target out.",
  tags: ["jutsu", "obito", "kamui", "mangekyou", "space-time", "buff", "one-shot"],
  size: [264, 162],
  origin: [56, 126],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"], seed: 43 },
};

const CALM = { ...READY, crouch: 2, fx: 6, fy: -18, bx: -2, by: -18, ffx: 6, fbx: -6 };
const EYEH = { ...CALM, crouch: 3, lean: 2, fx: 9, fy: -33, bx: -2, by: -20 };
const POWER = { ...READY, crouch: 7, lean: -3, fx: 12, fy: -22, bx: -10, by: -22, ffx: 10, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [AIM, EYEH, "out"],
    [TAKEN, { ...EYEH, lean: 4 }],
    [BUFF + 0.15, POWER, "snap"],
    [SPIT - 0.2, { ...POWER, crouch: 5 }],
    [SPIT + 0.1, { ...EYEH, fx: 14, fy: -26 }, "out"],
    [END, CALM],
  ],
  hits: [
    { t: SUCK, stop: 0.04, flash: 0, push: 0, straw: 6, shiver: 0.8, target: true },
    { t: TAKEN, stop: 0.08, shake: 0.3, amp: 2, target: false },
    { t: BUFF + 0.15, stop: 0.08, shake: 0.3, amp: 2, target: false },
    { t: SPIT, stop: 0.12, shake: 0.35, amp: 3, push: -4, straw: 30, skin: "shadow" },
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: BUFF + 0.15, x: 0, n: 12 }],
};

// the target: wrung into the void and gone, then spat back out
export const targetState = (t) => {
  if (t < SUCK) return null;
  if (t < TAKEN) {
    const u = ease.inCubic(smooth(SUCK, TAKEN, t));
    return { rot: 14 * u * u, s: 1 - u, dy: (VY + 26) * u, tint: [SP[3], 0.5 * u] };
  }
  if (t < SPIT) return { a: 0 };
  const u = ease.outBack(clamp((t - SPIT) / 0.25), 2);
  return u >= 1 ? null : { rot: -6 * (1 - u), s: Math.max(0.05, u), dy: (VY + 26) * (1 - u) };
};

// a spiral of void: arms turning round a black eye, r its size
function vortex(p, x, y, r, t, k, eye = true) {
  if (k <= 0) return;
  if (eye) p.circle(x, y, Math.max(1, r * 0.25 * k), SP[0]);
  for (let i = 0; i < 3; i++)
    for (let s = 0; s < 3; s++) {
      const a0 = t * 14 + (i * TAU) / 3 + s * 0.6, rr = (r - s * r * 0.25) * k;
      if (rr > 1.5) p.arc(x, y, rr, 1, a0, a0 + 1.7, s ? SP[3] : SP[4], 0.7 + 0.3 * k);
    }
}

// the dimension seen through a round window: a pale void with rows of block pillars going away, the target falling in
function dimension(p, x, y, R, t, fall) {
  p.shade(x - R, y - R, x + R, y + R, (px, py) => {
    const dx = px - x, dy = py - y, d = Math.hypot(dx, dy);
    if (d > R) return;
    if (d > R - 1.5) return SP[4];
    // the pillars: three rows of blocks, the far ones smaller and paler
    for (let row = 0; row < 3; row++) {
      const s = 1 - row * 0.3, w = 7 * s, gap = 16 * s, top = -6 + row * 4 - 10 * s, off = (row * 7 + t * 4 * s) % gap;
      const lx = ((dx + off + 200) % gap) - gap / 2;
      if (Math.abs(lx) < w / 2 && dy > top) return row === 0 ? (lx < 0 ? SP[3] : SP[2]) : row === 1 ? hex("#8e8ca8") : hex("#a8a6c0");
    }
    return dy > 6 ? hex("#9896b0") : dy > -4 ? hex("#c8c6dc") : hex("#e8e6f4");
  });
  // the target, tiny, tumbling down among them
  const ty = y - R * 0.6 + fall * R * 0.9, tx = x + Math.sin(fall * 5) * 3;
  p.rect(tx - 3, ty - 4, 6, 8, hex("#b38b57"));
  p.rect(tx - 2, ty - 7, 4, 3, hex("#c9a26c"));
  p.rect(tx - 6, ty - 3, 12, 2, hex("#724c2e"));
  p.rect(tx - 1, ty + 4, 2, 4, hex("#4e331f"));
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let spat = false, buffed = false;
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      // the stolen chakra streaming back from the void into him
      if (t > TAKEN && t < BUFF + 0.2 && R.chance(120 * dt)) {
        const T = R.range(0.2, 0.3), x0 = TX + R.range(-6, 6), y0 = VY + R.range(-6, 6);
        ps.spawn(P.STREAK, x0, y0, (b.chest[0] - x0) / T, (b.chest[1] - y0) / T, T, R.chance(0.5) ? AURA[3] : AURA[2]);
      }
      // the aura: dark motes spiralling up off him while the buff lasts
      if (t > BUFF && t < SPIT + 0.6 && R.chance(40 * dt)) ps.spawn(P.EMBER, R.range(-10, 10), -R.range(0, 40), R.range(-12, 12), -R.range(20, 50), R.range(0.4, 0.8), AURA[R.int(1, 3)]);
      if (!buffed && t >= BUFF + 0.15) {
        buffed = true;
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * TAU;
          ps.spawn(P.STREAK, Math.cos(a) * 8, -20 + Math.sin(a) * 8, Math.cos(a) * 140, Math.sin(a) * 140, 0.2, i % 2 ? AURA[3] : WHITE);
        }
      }
      if (!spat && t >= SPIT) {
        spat = true;
        for (let i = 0; i < 18; i++) {
          const a = R.range(0, TAU), s = R.range(60, 180);
          ps.spawn(P.STREAK, TX, VY, Math.cos(a) * s, Math.sin(a) * s, 0.15, i % 2 ? WHITE : SP[3]);
        }
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      // the buff: a dark aura burning round his outline, a spiral turning on the floor under him
      if (t > BUFF && t < END - 0.2) {
        const k = smooth(BUFF, BUFF + 0.2, t) * (1 - smooth(SPIT + 0.3, END - 0.2, t));
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, AURA[2], { w: 1, a: k, flick: t * 16 });
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, AURA[1], { w: 3, a: 0.7 * k, flick: t * 11 + 2 });
        for (let i = 0; i < 3; i++) {
          const a0 = t * 5 + (i * TAU) / 3;
          p.arc(0, -1, 16, 1, a0, a0 + 1.5, AURA[2], 0.6 * k);
        }
        p.glow(0, -22, 40, AURA[1], 0.5 * k);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "obito", t0: EYE, t1: OPEN, label: "KAMUI", head: b.head });
      drawGlint(p, t, "obito", OPEN + 0.05, END - 0.3, b.head);
      // the spiral on the target, the target wrung into it, then the window into the dimension, then shut
      if (t > SPIRAL && t < SHUT + 0.2) {
        const open = smooth(SPIRAL, SUCK, t), shut = smooth(SHUT - 0.1, SHUT + 0.15, t);
        if (t > SUCK && t < TAKEN) {
          const u = smooth(SUCK, TAKEN, t);
          warp(p, TX, VY, 32, 7 * u * u, 0.6 * u);
        }
        if (t < WINDOW) vortex(p, TX, VY, 26, t, open);
        else {
          const w = smooth(WINDOW, WINDOW + 0.2, t) * (1 - shut);
          if (w > 0.05) dimension(p, TX, VY, 26 * w, t, smooth(WINDOW, SHUT, t));
          vortex(p, TX, VY, 28 + 4 * w, t, 1 - shut, w < 0.3);
        }
      }
      // the spit: the void opens again for a moment and throws it back
      if (t > SPIT - 0.25 && t < SPIT + 0.25) {
        const k = t < SPIT ? smooth(SPIT - 0.25, SPIT, t) : 1 - smooth(SPIT, SPIT + 0.25, t);
        vortex(p, TX, VY, 24, -t, k);
      }
      // the buff marks: rising arrows and the words, over his head
      if (t > BUFF + 0.15 && t < SPIT) {
        const a = t - BUFF - 0.15, k = smooth(0, 0.15, a) * (1 - smooth(SPIT - 0.5, SPIT, t)), y = b.head[1] - 24 - Math.min(6, a * 20);
        p.text("ATK+  SPD+", b.head[0], y - 12, AURA[3], { font: "mini", align: "center", outline: SP[0], a: k });
        for (let i = 0; i < 3; i++) {
          const ay = b.head[1] - 8 - ((a * 30 + i * 8) % 22), ax = b.head[0] - 14 + i * 14;
          p.tri(ax, ay - 3, ax - 3, ay + 1, ax + 3, ay + 1, AURA[3], k);
        }
      }
      ps.draw(p, "front");
    },
  };
});

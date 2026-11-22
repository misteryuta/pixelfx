// Yamata no Jutsu (Eight Branches Technique, Orochimaru) with the Kusanagi. Narutopedia: Orochimaru turns his body
// into a gigantic eight-headed, eight-tailed white serpent (after the Yamata no Orochi of legend), each head big
// enough to swallow a man; and he keeps the Sword of Kusanagi inside his body, drawing it out of a snake's mouth or his
// own, its blade extending at will. Here: his body melts into a writhing mass of white snakes that pours into the
// ground; eight huge white serpents' heads burst up behind it and sway, each on its own long neck, yellow slit eyes,
// purple markings round them; they strike one after another at the target in a fast rolling wave, jaws wide; the
// central head opens its mouth and Orochimaru slides out of it to the waist, opens his own mouth, and the Kusanagi
// lances out of his throat, extending, through the target; the heads sink.
// New: the serpent heads (neck chains with scales and bellies, wedge heads, jaws, eyes), the emerging body, the sword
// out of his mouth.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure, MOUTH } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const MELT = 0.35, GONE = 0.75, RISE = 0.85, RISEN = 1.55, STRIKE = 1.75, EMERGE = 2.9, SWORD = 3.25, PIERCE = 3.4, SINK = 4.1, END = 4.9, TX = 190;
const SNK = ["#2a2430", "#6a6274", "#b8b0c0", "#e8e4ee", "#ffffff"].map(hex), PURP = hex("#6a3a8a"), EYE = hex("#ffd040"), STEEL = ["#8a90a0", "#d8dce8", "#ffffff"].map(hex);
const N = 8, BASE = [40, 0];

export const meta = {
  name: "Eight branches technique",
  desc: "Orochimaru: his body melts into white snakes and eight huge serpent heads burst up, swaying, striking at the target in a rolling wave; he slides out of the central head's mouth and the Kusanagi lances out of his throat through the target.",
  tags: ["jutsu", "orochimaru", "snake", "kusanagi", "summon", "multi-hit", "one-shot"],
  size: [320, 230],
  origin: [56, 198],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2430", "#6a6274", "#b8b0c0", "#e8e4ee"], seed: 162 },
};

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [MELT, { ...READY, crouch: 8, lean: -6, fx: 4, fy: -18, bx: -4, by: -18 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: MELT, target: false, sfx: "cast" },
    { t: RISE, shake: 1.2, amp: 3, target: false, sfx: "rumble" },
    ...Array.from({ length: N - 1 }, (_, i) => ({ t: STRIKE + i * 0.12 + 0.12, stop: 0.04, shake: 0.4, amp: 3, push: 2, straw: 14, sfx: "punch" })),
    { t: EMERGE, target: false, sfx: "whoosh" },
    { t: PIERCE, stop: 0.25, shake: 0.6, amp: 4, push: 4, straw: 40, flash: 0.06, skin: "poison", sfx: "whoosh" },
    { t: PIERCE + 1.0, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RISE, x: BASE[0] - 20, n: 16, dir: -1 }, { t: RISE, x: BASE[0] + 20, n: 16, dir: 1 }],
};
export const actorAlpha = (t) => (t < MELT ? 1 : t < GONE ? 1 - smooth(MELT, GONE, t) : t > SINK + 0.3 ? smooth(SINK + 0.3, END - 0.2, t) : 0);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // each head: where its neck leaves the ground, its rest position in the fan, a sway phase, and when it strikes
  const H = Array.from({ length: N }, (_, i) => {
    const s = (i - (N - 1) / 2) / ((N - 1) / 2);
    return { root: [BASE[0] - 30 + i * 9, 2], rest: [BASE[0] + 10 + s * 50 + (i % 2) * 10, -100 - (1 - Math.abs(s)) * 40 + (i % 3) * 8], ph: rand(i, 1) * TAU, ts: STRIKE + [3, 5, 1, 7, 0, 2, 6, 4][i] * 0.12, depth: i % 2 };
  });
  const CENTER = 4;
  // the head's position at t: rising, swaying, lunging at its strike, recoiling; the centre one rising above for the emerge
  const headAt = (h, i, t) => {
    const up = ease.outBack(smooth(RISE + i * 0.04, RISEN + i * 0.04, t), 1.2) * (1 - ease.inCubic(smooth(SINK + i * 0.03, END - 0.2, t)));
    let [x, y] = [h.root[0] + (h.rest[0] - h.root[0]) * up, h.root[1] + (h.rest[1] - h.root[1]) * up];
    x += Math.sin(t * 2.2 + h.ph) * 6 * up; y += Math.cos(t * 1.7 + h.ph) * 4 * up;
    const s = t - h.ts, lunge = s < 0 ? -0.15 * smooth(-0.15, 0, s) : s < 0.12 ? -0.15 + 1.15 * ease.outCubic(s / 0.12) : 1 - ease.inOutQuad(clamp((s - 0.12) / 0.35));
    if (i !== CENTER || t < EMERGE - 0.4) { const lx = TX - 14 + (i - 3.5) * 2, ly = -30 + (i % 3) * 8; x += (lx - x) * Math.max(-0.2, lunge); y += (ly - y) * Math.max(-0.2, lunge); }
    if (i === CENTER && t > EMERGE - 0.4) { const u = ease.inOutQuad(smooth(EMERGE - 0.4, EMERGE, t)); x += (TX - 90 - x) * u; y += (-70 - y) * u; }
    return [x, y, up, s > -0.05 && s < 0.3 ? 1 : 0];
  };
  const serpent = (p, t, i) => {
    const h = H[i], [hx, hy, up, open] = headAt(h, i, t);
    if (up < 0.02) return;
    const dark = h.depth ? 0.25 : 0, C = (n) => SNK[Math.max(0, n - (dark ? 1 : 0))];
    const [rx, ry] = h.root, mx = (rx + hx) / 2 - 20, my = (ry + hy) / 2 + 10;
    let px = rx, py = ry;
    for (let j = 0; j <= 24; j++) {
      const u = j / 24, x = (1 - u) * (1 - u) * rx + 2 * (1 - u) * u * mx + u * u * hx, y = (1 - u) * (1 - u) * ry + 2 * (1 - u) * u * my + u * u * hy, w = 7 - 2.5 * u;
      if (y < 1) { p.circle(x, y, w + 1, C(1)); p.circle(x, y, w, C(3)); p.circle(x + w * 0.3, y + w * 0.2, w * 0.55, C(2)); if (j % 2) p.arc(x, y, w, 1, -2.4, -0.8, C(4), 0.5); }
      px = x; py = y;
    }
    void px; void py;
    // the head: a wedge pointing at the target, the jaw opening on the strike, purple marks round the yellow slit eye
    const a = Math.atan2(-30 - hy, TX - hx) * 0.6 + (open ? 0 : 0.15), c = Math.cos(a), s = Math.sin(a), at = (u, v) => [hx + c * u - s * v, hy + s * u + c * v];
    const jaw = i === CENTER && t > EMERGE - 0.2 && t < SINK ? 1 : open ? 0.9 : 0.1;
    p.poly([at(-8, -7), at(10, -5), at(18, -1), at(10, 2), at(-8, 5)], C(3));
    p.poly([at(-6, 3), at(16, 2 + jaw * 9), at(8, 6 + jaw * 5), at(-6, 7)], C(2));
    if (jaw > 0.3) { p.poly([at(-2, 2), at(16, 0), at(15, 2 + jaw * 8), at(-2, 5)], hex("#5a1a2a")); p.line(...at(12, 0), ...at(12, 2), WHITE); p.line(...at(14, 1 + jaw * 7), ...at(14, -1 + jaw * 7), WHITE); }
    p.line(...at(-6, -6), ...at(8, -5), PURP); p.px(...at(4, -3), EYE); p.px(...at(5, -3), hex("#1a1010"));
};
  return {
    update(t, dt) {
      if (t > MELT && t < GONE + 0.1 && R.chance(40 * dt)) ps.spawn(P.SPARK, R.range(-6, 10), -R.range(0, 30), R.range(-20, 20), R.range(10, 40), R.range(0.2, 0.4), SNK[3]);
      if (t > RISE && t < RISEN && R.chance(50 * dt)) ps.spawn(P.GRIT, BASE[0] + R.range(-40, 40), -1, R.range(-80, 80), -R.range(60, 180), R.range(0.5, 1), hex("#5a5068"));
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      if (t > RISE - 0.05) p.ellipse(BASE[0], 1, 50, 4, hex("#08060c"), 1 - smooth(END - 0.4, END, t));
      // the far heads (odd) behind the near ones
      for (let i = 0; i < N; i++) if (H[i].depth) serpent(p, t, i);
      ps.draw(p, "back");
    },
    // one serpent: the neck as a chain of scaled discs from its root to the head, then the head itself
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "snake", t0: 0.04, t1: MELT, label: "YAMATA NO JUTSU", head: b.head });
      if (t < GONE) drawGlint(p, t, "snake", 0.3, GONE, b.head);
      // the melting: white snakes writhing up out of his outline and pouring into the ground
      if (t > MELT - 0.05 && t < GONE + 0.2) { const k = smooth(MELT - 0.05, MELT + 0.15, t) * (1 - smooth(GONE, GONE + 0.2, t)); for (let i = 0; i < 10; i++) { const x0 = -6 + i * 2, ph = t * 6 + i; let px = x0, py = -2; for (let j = 1; j < 8; j++) { const y = -2 - j * 3.5 * (1 - smooth(MELT, GONE, t) * 0.8), x = x0 + Math.sin(ph + j * 0.9) * 2.5; p.line(px, py, x, y, SNK[3], k); px = x; py = y; } } }
      for (let i = 0; i < N; i++) if (!H[i].depth) serpent(p, t, i);
      // Orochimaru sliding out of the central head's mouth to the waist; the Kusanagi out of his own mouth
      if (t > EMERGE - 0.05 && t < SINK + 0.1) {
        const [hx, hy] = headAt(H[CENTER], CENTER, t), out = ease.outCubic(smooth(EMERGE - 0.05, EMERGE + 0.3, t)) * (1 - smooth(SINK - 0.2, SINK + 0.1, t));
        const q = { ...READY, lean: 14, crouch: 0, fx: 10, fy: -28, bx: -6, by: -24 }, fx = hx + 12 - 6, fy = hy + 6 + (1 - out) * 20;
        drawFigure(p, q, fx, fy, { a: out });
        const [mx, my] = [fx + MOUTH[0], fy + MOUTH[1]];
        if (t > SWORD - 0.05) {
          const L = (TX + 26 - mx) * ease.outExpo(clamp((t - SWORD) / (PIERCE - SWORD))) * (1 - smooth(SINK - 0.4, SINK - 0.1, t)), dy = (-28 - my) / (TX + 26 - mx);
          p.beam(mx, my, mx + L, my + dy * L, 1.6, STEEL[1]);
          p.line(mx, my - 1, mx + L, my + dy * L - 1, STEEL[2]);
          if (L > 4) p.tri(mx + L, my + dy * L - 1.5, mx + L + 5, my + dy * L, mx + L, my + dy * L + 1.5, STEEL[2]);
          if (t > PIERCE && t < PIERCE + 0.15) p.circle(TX, -28, 6, WHITE, 1 - (t - PIERCE) / 0.15);
        }
      }
      void noise2;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

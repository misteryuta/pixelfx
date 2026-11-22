// Garouga (Fang Wolf Fang, Kiba Inuzuka with Akamaru as the Two-Headed Wolf). Narutopedia: Jinjuu Konbi Henge:
// Soutourou: Kiba and Akamaru transform together into a giant two-headed wolf with grey-white fur; from that form they
// use Garouga, a Fang Over Fang (Gatsuuga) of immense size: the wolf spins into two colossal drilling tornadoes that
// tear through anything. Here: Kiba drops to all fours, Akamaru barks beside him; a seal, a burst of smoke, and the
// giant two-headed wolf stands in it, both heads snarling, hackles up; it crouches, leaps, curls in the air and
// becomes two huge spinning drills of fur and wind that corkscrew round each other into the target, tearing up the
// floor; they burst apart and the wolf lands behind it, then turns back into the boy and the dog in a puff.
// New: the wolf (body, two heads with jaws and ears, thick legs, a bushy tail, fur strokes), the twin drills.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const FOURS = 0.3, POOF = 0.65, WOLF = 0.8, CROUCH = 1.4, LEAP = 1.6, DRILL = 1.75, HIT = 2.05, OUT = 2.6, LAND = 2.8, BACKP = 3.6, END = 4.3, TX = 190;
const FUR = ["#2a2a30", "#5a5a64", "#9a9aa4", "#d8d8e0", "#f8f8ff"].map(hex), RED = hex("#c01a2a");
const WX = 40;

export const meta = {
  name: "Fang wolf fang",
  desc: "Kiba and Akamaru: a burst of smoke and a giant two-headed wolf stands snarling; it leaps, curls, and becomes two huge spinning drills of fur and wind that corkscrew round each other through the target, then lands and turns back.",
  tags: ["jutsu", "kiba", "inuzuka", "akamaru", "transformation", "drill", "one-shot"],
  size: [320, 210],
  origin: [56, 178],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2a30", "#5a5a64", "#9a9aa4", "#d8d8e0"], seed: 158 },
};

const BEAST = { ...READY, crouch: 14, lean: 24, fx: 12, fy: -2, bx: 6, by: -2, ffx: 8, fbx: -12 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [FOURS, BEAST, "out"],
    [BACKP, BEAST],
    [BACKP + 0.01, { ...BEAST, x: TX + 50, face: -1, gait: false }, "snap"],
    [END - 0.2, { ...READY, x: TX + 50, face: -1, crouch: 6, gait: false }, "out"],
    [END, { ...READY, x: TX + 50, face: -1, crouch: 6, gait: false }],
  ],
  hits: [
    { t: POOF, shake: 0.6, amp: 2, target: false, sfx: "cast" },
    { t: WOLF + 0.2, target: false, sfx: "heavy" },
    { t: DRILL, target: false, sfx: "whoosh" },
    ...[0, 0.08, 0.16, 0.24, 0.32, 0.4].map((d, i) => ({ t: HIT + d, stop: i === 0 ? 0.12 : 0.03, shake: 0.5, amp: i === 0 ? 5 : 2, push: 3, straw: 16, sfx: "punch" })),
    { t: LAND, shake: 0.6, amp: 3, target: false, sfx: "step" },
    { t: BACKP, target: false, sfx: "cast" },
  ],
  dust: [{ t: LEAP, x: WX, n: 14 }, { t: LAND, x: TX + 50, n: 14, dir: -1 }],
};
// Kiba himself is inside the wolf from the poof until the poof back
export const actorAlpha = (t) => (t > POOF + 0.05 && t < BACKP + 0.05 ? 0 : 1);

// the giant two-headed wolf standing at (x, 0) facing dir; crouch 0..1; jaw 0..1
function drawWolf(p, x, t, { crouch = 0, jaw = 0, k = 1, dir = 1, y0 = 0 } = {}) {
  const X = (u) => x + u * dir, by = y0 - 34 + crouch * 8, br = Math.sin(t * 5) * 0.8;
  // tail: big and bushy, curling up behind
  for (let i = 0; i < 10; i++) { const a = -0.4 - i * 0.18, r = 10 + i; p.circle(X(-34 - Math.cos(a) * i * 1.6), by - 2 - i * 2.2 + Math.sin(t * 3 + i * 0.4), 5 - i * 0.25, i % 2 ? FUR[2] : FUR[3], k); void r; }
  // far legs, body, near legs
  for (const [lx, off, c] of [[-24, 2, FUR[1]], [18, 2, FUR[1]]]) { p.beam(X(lx + off), by + 4, X(lx + off + 2), y0 - 1, 6, c, k); p.ellipse(X(lx + off + 4), y0 - 1, 4, 1.6, c, k); }
  p.ellipse(X(-4), by + br * 0.3, 34, 14 + br * 0.3, FUR[2], k);
  p.ellipse(X(-4), by - 4, 30, 9, FUR[3], k);
  // fur strokes and the raised hackles along the back
  for (let i = 0; i < 14; i++) { const u = -30 + i * 4.4; p.line(X(u), by - 11 - (i % 3), X(u + 2), by - 15 - (i % 2) * 2 - 2 * Math.sin(t * 6 + i), FUR[3], k); p.line(X(u), by - 2, X(u + 3), by + 2, FUR[1], 0.6 * k); }
  for (const [lx, c] of [[-26, FUR[2]], [16, FUR[2]]]) { p.beam(X(lx), by + 4, X(lx + 1), y0 - 1, 7, c, k); p.ellipse(X(lx + 3), y0 - 1, 4.5, 1.8, FUR[3], k); for (let j = 0; j < 3; j++) p.px(X(lx + 5 + j), y0 - 1, FUR[0]); }
  // the two heads, side by side on thick necks, both snarling: the far one higher and darker
  for (const [hx, hy, c, cl] of [[26, by - 22, FUR[1], FUR[2]], [30, by - 14, FUR[2], FUR[3]]]) {
    p.beam(X(14), by - 4, X(hx - 4), hy + 4, 12, c, k);
    p.ellipse(X(hx), hy, 9, 7, cl, k);
    // snout and jaw: the jaw drops when it snarls, fangs
    p.poly([[X(hx + 4), hy - 3], [X(hx + 17), hy], [X(hx + 16), hy + 2], [X(hx + 4), hy + 3]], cl, k);
    p.poly([[X(hx + 4), hy + 3 + jaw], [X(hx + 15), hy + 3 + jaw * 4], [X(hx + 4), hy + 6 + jaw * 2]], c, k);
    if (jaw > 0.2) { p.poly([[X(hx + 5), hy + 3], [X(hx + 15), hy + 2], [X(hx + 15), hy + 3 + jaw * 4], [X(hx + 5), hy + 4 + jaw * 2]], hex("#3a0a10"), k); p.px(X(hx + 13), hy + 3, WHITE); p.px(X(hx + 13), hy + 2 + jaw * 4, WHITE); p.px(X(hx + 8), hy + 3, WHITE); }
    p.px(X(hx + 17), hy, FUR[0]);
    // ears and a red eye
    p.tri(X(hx - 4), hy - 5, X(hx), hy - 6, X(hx - 4), hy - 14, c, k); p.tri(X(hx), hy - 6, X(hx + 3), hy - 5, X(hx + 1), hy - 13, c, k);
    p.px(X(hx + 5), hy - 3, RED); p.px(X(hx + 6), hy - 3, RED);
  }
}

// a spinning drill of fur: tip at (x, y) pointing right, radius R at its base, length len (0: a ball of radius R);
// spiral bands of light and dark fur racing round it, a darker rim, fur tufts flicking off the edge
function drill(p, x, y, R, len, t, k, ball) {
  if (k <= 0) return;
  const x0 = ball ? x - R : x - len, x1 = ball ? x + R : x + 2;
  p.shade(x0 - 2, y - R - 2, x1, y + R + 2, (X, Y, out) => {
    const v = ball ? 0 : (X - x0) / len, r = ball ? Math.sqrt(Math.max(0, R * R - (X - x) * (X - x))) : 2 + R * (1 - Math.pow(Math.max(0, v), 1.3));
    const dy = Y - y;
    if (Math.abs(dy) > r) return;
    out.a = k;
    const ang = Math.asin(Math.max(-1, Math.min(1, dy / Math.max(0.5, r)))), band = Math.sin(ang * 3 + (ball ? X * 0.4 : v * 16) - t * 40);
    const edge = Math.abs(dy) / Math.max(0.5, r);
    if (edge > 0.85) return FUR[1];
    return band > 0.5 ? FUR[4] : band > -0.1 ? FUR[3] : band > -0.6 ? FUR[2] : FUR[1];
  });
  // tufts flicking off the rim
  for (let i = 0; i < 6; i++) { const u = ((t * 9 + i / 6) % 1), X = ball ? x + Math.cos(i + t * 20) * R : x - len * u, r = ball ? R : 2 + R * (1 - Math.pow(u, 1.3)), s = i % 2 ? 1 : -1; p.line(X, y + s * r, X - 3, y + s * (r + 2), FUR[3], k); }
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the drills' axis: from the leap point arcing over into the target and out past it
  const axis = (t) => { const u = clamp((t - DRILL) / (OUT - DRILL)), x = WX + 20 + (TX + 60 - WX - 20) * u, y = -40 + 30 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) - Math.sin(u * Math.PI) * 10; return [x, y]; };
  return {
    update(t, dt) {
      if (t > DRILL && t < OUT && R.chance(60 * dt)) { const [x, y] = axis(t); ps.spawn(P.GRIT, x + R.range(-10, 10), -1, R.range(-120, 120), -R.range(60, 200), R.range(0.3, 0.7), hex("#5a5068")); ps.spawn(P.SPARK, x, y + R.range(-12, 12), -R.range(40, 120), R.range(-60, 60), R.range(0.15, 0.3), FUR[4]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the gouge the drills tear through the floor
      if (t > DRILL + 0.1) { const [x] = axis(t); p.shade(WX + 30, -2, Math.min(x, TX + 60), 2, (X, Y, out) => { if (Math.abs(Y) > 1.5 + noise2(X * 0.2, 3, 2)) return; out.a = 1 - smooth(END - 0.5, END, t); return hex("#0a0810"); }); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "inuzuka", t0: 0.04, t1: FOURS, label: "GAROUGA", head: b.head });
      // Akamaru at his side, barking, until the poof
      const akam = (ax, f) => { p.ellipse(ax, -5, 6, 4, FUR[3]); p.circle(ax + 6 * f, -9, 3, FUR[4]); p.tri(ax + 4 * f, -11, ax + 6 * f, -12, ax + 4 * f, -15, FUR[3]); p.px(ax + 8 * f, -9, FUR[0]); p.line(ax - 3, -1, ax - 3, 0, FUR[2]); p.line(ax + 3, -1, ax + 3, 0, FUR[2]); };
      if (t > BACKP + 0.05) akam(TX + 34, -1);
      if (t < POOF + 0.05) { const ax = 16; p.ellipse(ax, -5, 6, 4, FUR[3]); p.circle(ax + 6, -9, 3, FUR[4]); p.tri(ax + 4, -11, ax + 6, -12, ax + 4, -15, FUR[3]); p.px(ax + 8, -9, FUR[0]); p.line(ax - 3, -1, ax - 3, 0, FUR[2]); p.line(ax + 3, -1, ax + 3, 0, FUR[2]); if (Math.floor(t * 6) % 2 && t > 0.2) p.text("!", ax + 12, -18, WHITE, { font: "mini" }); }
      // the wolf: standing from the poof, snarling, crouching to spring
      if (t > POOF + 0.05 && t < LEAP + 0.06) {
        const crouch = smooth(CROUCH, LEAP, t), jaw = 0.5 + 0.5 * Math.sin(t * 10) * (1 - crouch);
        drawWolf(p, WX, t, { crouch, jaw, k: 1, y0: 0 });
      }
      // the leap: the wolf rising and curling into a spinning ball of fur, then splitting into the two drills
      if (t > LEAP + 0.06 && t < DRILL + 0.05) { const u = (t - LEAP - 0.06) / (DRILL + 0.05 - LEAP - 0.06), x = WX + 20 * u, y = -30 - 20 * u; drill(p, x, y, 22 - 6 * u, 0, t, 1, true); }
      // the twin drills: two solid spinning cones of fur, corkscrewing round a common axis, wind wrapped round them
      if (t > DRILL && t < OUT + 0.1) {
        const [ax, ay] = axis(t), k = 1 - smooth(OUT, OUT + 0.1, t);
        for (let d = 0; d < 2; d++) {
          const ph = t * 18 + d * Math.PI, oy = ay + Math.sin(ph) * 10, depth = Math.cos(ph);
          if (depth < 0) drill(p, ax, oy, 16, 46, t + d, k, false);
        }
        for (let d = 0; d < 2; d++) {
          const ph = t * 18 + d * Math.PI, oy = ay + Math.sin(ph) * 10, depth = Math.cos(ph);
          if (depth >= 0) drill(p, ax, oy, 16, 46, t + d, k, false);
        }
        for (let i = 0; i < 4; i++) { const ph = t * 14 + i * 1.6; p.arc(ax - 18 - i * 9, ay, 24 - i * 3, 1, ph, ph + 1.8, WHITE, 0.55 * k); }
      }
      // landing past the target, then the poof back into Kiba and Akamaru
      if (t > OUT + 0.05 && t < BACKP + 0.1) { const v = smooth(OUT, LAND, t); drawWolf(p, TX + 50, t, { crouch: 1 - v * 0.7, jaw: 0.3, dir: -1, y0: -24 * Math.sin(Math.min(1, (t - OUT) / (LAND - OUT)) * Math.PI) }); }
      drawPoof(p, WX, -20, t - POOF, 3, 4);
      drawPoof(p, TX + 50, -20, t - BACKP, 3, 9);
      void rand; void TAU; void ease;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

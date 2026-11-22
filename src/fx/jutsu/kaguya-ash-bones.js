// Kaguya: All-Killing Ash Bones (Kaguya Ootsutsuki). Narutopedia: bones grown out of her palms that, once they pierce
// a body, turn it to ash from the inside, a slow crumbling that cannot be stopped. Here: the third eye on her brow opens
// (the Rinne Sharingan's red ripples), the world drains of colour around her, she lifts one palm, almost lazily; a bone
// shoots out of it, white and knotted, and two more from her other palm and her sleeve, the first through the target,
// pinning it; a heartbeat; cracks of grey run over the target from the wound; it goes pale and falls apart into ash that
// drifts away on no wind; the bones crumble back toward her. At the end the target stands again.
// New: the bones (jointed, growing tip-first), the ash crumble (targetState + drifting flakes), the third eye.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, veil } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const TX = 160, EYE = 0.05, OPENED = 0.55, LIFT = 0.8, SHOOT = 1.0, PIERCE = 1.12, BEAT = 1.6, ASH = 1.85, GONE = 2.9, BACK = 3.6, END = 4.4;
const BONE = ["#4a4450", "#8e8698", "#d8d2dc", "#f6f2f8"].map(hex), RED = hex("#e02a3a"), ASHC = ["#2a2830", "#5a5662", "#8e8a96", "#c8c4cc"].map(hex);

export const meta = {
  name: "All-killing ash bones",
  desc: "Kaguya: her third eye opens and the world pales; from her raised palm a knotted white bone shoots through the target and two more follow; cracks of grey run over it and it falls apart into ash that drifts away.",
  tags: ["jutsu", "kaguya", "otsutsuki", "bone", "projectile", "one-shot"],
  size: [290, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2830", "#5a5662", "#8e8a96", "#c8c4cc", "#f6f2f8"], seed: 17 },
};

const CALM = { ...READY, crouch: 1, lean: -2, fx: 2, fy: -16, bx: -3, by: -16, ffx: 5, fbx: -5 };
const PALM = { ...CALM, fx: 20, fy: -28, bx: 4, by: -22, lean: 1 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPENED, CALM, "out"],
    [LIFT + 0.15, PALM, "out"],
    [SHOOT, { ...PALM, fx: 22, lean: -1, bx: 14, by: -24 }, "snap"],
    [BEAT + 0.3, { ...PALM, fx: 22 }],
    [GONE + 0.2, CALM],
    [END, CALM],
  ],
  hits: [
    { t: EYE + 0.2, target: false, sfx: "cast" },
    { t: PIERCE, stop: 0.12, shake: 0.2, amp: 2, push: 1.5, straw: 6, skin: "holy", sfx: "heavy" },
    { t: ASH, stop: 0.05, shake: 0.4, amp: 1, push: 0, straw: 0, target: false, sfx: "rumble" },
    { t: meta.duration - 0.25, flash: 0, push: 0, straw: 0, skin: null }, // RESET SKIN: the target back to its own colours
  ],
};
// the target: pinned, cracked, paling, then gone in ash; back at the end
export const targetState = (t) => {
  if (t < PIERCE) return null;
  if (t < GONE) {
    const pale = smooth(BEAT, ASH + 0.3, t), crumble = smooth(ASH + 0.2, GONE, t);
    return { tint: [ASHC[3], pale * 0.85], a: 1 - crumble, dy: crumble * 6, s: 1 - crumble * 0.15 };
  }
  return { a: smooth(BACK, BACK + 0.4, t) };
};

// a bone from A toward B, grown out to `len` of the way: knotted joints every few px, tapering to a point
function bone(p, A, B, grow, t, seed) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) * grow, ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy), nx = -uy, ny = ux;
  if (L < 1) return;
  for (let i = 0; i <= L; i += 0.8) {
    const s = i / Math.max(1, L), knot = Math.max(0, 1 - Math.abs(((i + seed * 3) % 11) - 5.5) / 1.6);
    const w = (3 + 2 * knot) * (1 - 0.45 * (i / (Math.hypot(dx, dy) + 1))) * (L - i < 8 ? (L - i) / 8 : 1);
    const wob = 0;
    for (let v = -w; v <= w; v += 0.7) {
      const x = A[0] + ux * i + nx * (v + wob), y = A[1] + uy * i + ny * (v + wob), e = Math.abs(v) / w;
      p.px(x, y, e > 0.85 ? BONE[0] : v < -w * 0.3 ? BONE[3] : e > 0.5 ? BONE[1] : BONE[2]);
    }
    void s;
  }
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 999 }), lights = new Lights(), flakes = [];
  let fired = false;
  // the three bones: from her raised palm, her other palm, her sleeve; all toward the target
  const bonesAt = (b) => [
    { A: b.handN, B: [TX + 22, -28], t0: SHOOT, d: 0.12 },
    { A: b.handF, B: [TX + 14, -14], t0: SHOOT + 0.1, d: 0.14 },
    { A: [b.chest[0] + 4, b.chest[1] + 2], B: [TX + 18, -40], t0: SHOOT + 0.18, d: 0.14 },
  ];
  return {
    update(t, dt) {
      if (!fired && t >= PIERCE) {
        fired = true;
        lights.add(TX, -28, 80, BONE[3], 1, 0.2);
        for (let i = 0; i < 14; i++) { const a = R.range(-1, 1); ps.spawn(P.STREAK, TX, -28, Math.cos(a) * R.range(80, 200), Math.sin(a) * 120, R.range(0.1, 0.2), BONE[3]); }
      }
      // ash: flakes lifting off the target as it crumbles, drifting up and away, turning over
      if (t > ASH && t < GONE + 0.2) for (let n = 0; n < 4; n++) if (R.chance(90 * dt)) flakes.push({ x: TX + R.range(-12, 12), y: -R.range(2, 50), vx: R.range(10, 40), vy: -R.range(8, 30), age: 0, life: R.range(1, 2), s: R.chance(0.3) ? 2 : 1, c: ASHC[R.int(1, 3)], ph: R.range(0, TAU) });
      for (let i = flakes.length - 1; i >= 0; i--) {
        const f = flakes[i];
        f.age += dt; f.x += (f.vx + Math.sin(f.age * 3 + f.ph) * 12) * dt; f.y += f.vy * dt;
        if (f.age > f.life) flakes.splice(i, 1);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the world drained of colour round her while the eye is open
      const k = smooth(EYE + 0.1, OPENED, t) * (1 - smooth(GONE, BACK, t));
      if (k > 0) veil(p, -60, -150, 240, 32, hex("#0a080e"), 0.35 * k);
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: OPENED, label: "RINNE SHARINGAN", head: b.head });
      drawGlint(p, t, "byakugan", OPENED, GONE, b.head);
      // the third eye on her brow, rippling red
      if (t > OPENED - 0.1 && t < GONE + 0.3) {
        const k = smooth(OPENED - 0.1, OPENED + 0.1, t) * (1 - smooth(GONE, GONE + 0.3, t));
        p.ellipse(hx + 1, hy - 4, 2.2, 1.4 * k + 0.2, RED, k);
        p.px(hx + 1, hy - 4, hex("#1a0408"), k);
        p.glow(hx + 1, hy - 4, 8, RED, 0.5 * k);
      }
      // the bones: shot out tip-first, holding while the target turns to ash, then crumbling back toward her
      const crumble = smooth(ASH + 0.4, GONE + 0.1, t);
      for (const [i, s] of bonesAt(b).entries()) {
        if (t < s.t0) continue;
        const grow = ease.outCubic(clamp((t - s.t0) / s.d)) * (1 - crumble);
        bone(p, s.A, s.B, grow, t, i * 2 + 1);
        if (crumble > 0 && crumble < 1) for (let j = 0; j < 4; j++) { const u = rand(Math.floor(t * 20), j + i * 4); p.px(s.A[0] + (s.B[0] - s.A[0]) * u * (1 - crumble), s.A[1] + (s.B[1] - s.A[1]) * u * (1 - crumble) + j, ASHC[2]); }
      }
      // the cracks: grey lines running out over the target from the wound, branching
      if (t > BEAT && t < GONE) {
        const g = smooth(BEAT, ASH + 0.2, t), k = 1 - smooth(ASH + 0.4, GONE, t);
        for (let i = 0; i < 9; i++) {
          let x = TX + 2, y = -28, a = (i / 9) * TAU + rand(i, 3);
          const n = Math.floor(14 * g);
          for (let j = 0; j < n; j++) {
            const nx = x + Math.cos(a) * 1.6, ny = y + Math.sin(a) * 1.6;
            p.line(x, y, nx, ny, ASHC[0], k);
            x = nx; y = ny; a += (rand(i, j) - 0.5) * 1.2;
          }
        }
      }
      // the ash drifting
      for (const f of flakes) {
        const k = 1 - smooth(f.life * 0.6, f.life, f.age);
        if (f.s > 1) p.rect(f.x, f.y, 2, 1 + (Math.floor(f.age * 8 + f.ph) % 2), f.c, k);
        else p.dot(f.x, f.y, f.c, k);
      }
      void noise2; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

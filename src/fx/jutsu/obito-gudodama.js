// Gudoudama (Truth-Seeking Balls, Obito as the Ten-Tails' jinchuuriki). Narutopedia: orbs of malleable black chakra
// that can change their form and nature; only the size of a fist, each hides the power to wipe out a forest; Obito and
// Madara as jinchuuriki had ten. Here: Obito floats, white-haired, a staff in hand; the ten black orbs hang in a ring
// behind him, turning; two of them flatten and stretch into a shield before him; one lengthens into a long black rod,
// he throws it like a spear and it runs the target through; three more melt into a flood of black chakra that splashes
// over the target and turns to ash at its edges (the Yin-Yang release erasing what it touches); the orbs float back into
// the ring.
// New: the orbs (black spheres with a dull sheen and a shimmering rim), morphing into a shield, a rod, a flood.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const RISE = 0.3, RING = 0.7, SHIELD = 1.2, ROD = 1.55, THROW = 1.95, PIERCE = 2.1, FLOOD = 2.6, SPLASH = 2.9, BACK = 3.6, END = 4.6, TX = 180;
const BLK = ["#020104", "#0c0a10", "#1e1a26", "#3a3448", "#8a84a0"].map(hex), ASH = hex("#c8c4cc");

export const meta = {
  name: "Truth-seeking balls",
  desc: "Obito as the Ten-Tails' jinchuuriki: ten black orbs turn in a ring behind him; two flatten into a shield, one stretches into a long rod he throws through the target, three melt into a flood of black chakra that erases what it touches at its edges.",
  tags: ["jutsu", "obito", "ten-tails", "six-paths", "projectile", "aoe", "one-shot"],
  size: [300, 200],
  origin: [56, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#020104", "#0c0a10", "#1e1a26", "#3a3448", "#8a84a0"], seed: 147 },
};

const FLOATP = { ...READY, y: -16, crouch: 2, lean: -2, fx: 8, fy: -20, bx: -6, by: -18, ffx: 4, ffy: -6, fbx: -4, fby: -6, gait: false };
const THROWP = { ...FLOATP, lean: 10, fx: 24, fy: -30, bx: -8, by: -22 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE + 0.3, FLOATP, "out"],
    [THROW - 0.12, { ...FLOATP, lean: -6, fx: -10, fy: -36 }, "out"],
    [THROW, THROWP, "snap"],
    [FLOOD, { ...FLOATP, fx: 16, fy: -26, bx: 14, by: -24 }, "out"],
    [END - 0.3, FLOATP],
    [END, FLOATP],
  ],
  hits: [
    { t: RING, target: false, sfx: "cast" },
    { t: THROW, target: false, sfx: "whoosh" },
    { t: PIERCE, stop: 0.18, shake: 0.4, amp: 3, push: 4, straw: 30, skin: "shadow", sfx: "heavy" },
    { t: SPLASH, stop: 0.12, shake: 0.6, amp: 4, push: 3, straw: 40, skin: "char", sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// one orb: black with a dull highlight and a faint shimmering rim
function orb(p, x, y, r, t) {
  p.circle(x, y, r + 1, BLK[3]);
  p.circle(x, y, r, BLK[0]);
  p.circle(x - r * 0.35, y - r * 0.35, r * 0.3, BLK[2]);
  p.arc(x, y, r + 1, 1, t * 3, t * 3 + 1.2, BLK[4], 0.6);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the ring of ten behind him; each orb's home
  const home = (b, i, t) => { const a = (i / 10) * TAU + t * 0.6; return [b.chest[0] - 9 + Math.cos(a) * 15, b.chest[1] - 9 + Math.sin(a) * 15]; };
  return {
    update(t, dt) {
      if (t >= SPLASH && !this.s) { this.s = 1; lights.add(TX, -20, 120, BLK[4], 0.5, 0.3); }
      if (t > SPLASH && t < SPLASH + 0.8 && R.chance(60 * dt)) ps.spawn(P.DUST, TX + R.range(-40, 40), -R.range(0, 30), R.range(-20, 20), -R.range(10, 40), R.range(0.6, 1.2), ASH);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 20);
      drawBadge(p, t, { kind: "rinnegan", t0: 0.04, t1: RISE, label: "JUUBI", head: b.head });
      drawGlint(p, t, "rinnegan", RISE, END - 0.3, b.head);
      // his staff (shakujo) in the far hand
      p.beam(b.handF[0], b.handF[1] + 12, b.handF[0] + 2, b.handF[1] - 22, 1.4, BLK[1]);
      p.ring(b.handF[0] + 2, b.handF[1] - 24, 2.5, 1, BLK[3]);
      const g = ease.outBack(smooth(RING - 0.3, RING, t), 1.4);
      for (let i = 0; i < 10; i++) {
        let [x, y] = home(b, i, t), r = 2.6 * g;
        // 0,1: the shield; 2: the rod; 3,4,5: the flood; the rest stay in the ring
        if (i < 2 && t > SHIELD && t < BACK) {
          const u = smooth(SHIELD, SHIELD + 0.2, t) * (1 - smooth(BACK - 0.3, BACK, t)), sx = b.chest[0] + 16, sy = b.chest[1] - 2 + (i - 0.5) * 14;
          x += (sx - x) * u; y += (sy - y) * u;
          if (u > 0.5) { p.ellipse(x, y, 3, 9 * u, BLK[0]); p.line(x + 2, y - 8 * u, x + 2, y + 8 * u, BLK[3]); continue; }
        }
        if (i === 2 && t > ROD - 0.2) {
          if (t > ROD && t < THROW + 0.02) { const L = 30 * smooth(ROD, ROD + 0.3, t); const [hx, hy] = b.handN; p.beam(hx - 8, hy, hx + L, hy - 2, 2.2, BLK[0]); p.line(hx - 8, hy - 1, hx + L, hy - 3, BLK[3]); continue; }
          if (t >= THROW && t < BACK) {
            const u = clamp((t - THROW) / (PIERCE - THROW)), sx = b.handN[0], sy = b.handN[1], ex = TX + 20, ey = -28, x0 = sx + (ex - sx) * u;
            p.beam(x0 - 34, sy + (ey - sy) * u, x0, sy + (ey - sy) * u, 2.4, BLK[0]);
            p.line(x0 - 34, sy + (ey - sy) * u - 1, x0, sy + (ey - sy) * u - 1, BLK[3]);
            if (t > PIERCE && t < PIERCE + 0.2) p.circle(TX, -28, 6, WHITE, 1 - (t - PIERCE) / 0.2);
            continue;
          }
        }
        if (i >= 3 && i <= 5 && t > FLOOD - 0.1 && t < BACK) {
          const u = ease.inQuad(clamp((t - FLOOD) / (SPLASH - FLOOD)));
          if (t < SPLASH) { x += (TX - x) * u; y += (-20 - y) * u - Math.sin(u * Math.PI) * 30; r *= 1 + u; }
          else continue;
        }
        orb(p, x, y, r, t + i);
      }
      // the flood: black chakra splashing over the target, its edges crumbling to ash
      if (t > SPLASH && t < BACK + 0.3) {
        const u = ease.outCubic(clamp((t - SPLASH) / 0.35)), k = 1 - smooth(BACK - 0.2, BACK + 0.3, t);
        p.shade(TX - 60, -70, TX + 60, 1, (x, y, out) => {
          const dx = (x - TX) / (50 * u + 1), dy = (y + 20) / (40 * u + 1), d = Math.hypot(dx, dy) + 0.25 * noise2(x * 0.15, y * 0.15 + t, 4);
          if (d > 1 || y > 0) return;
          out.a = k;
          if (d > 0.85) return rand(x | 0, (y | 0) + f) > 0.5 ? ASH : 0;
          return d > 0.6 ? BLK[2] : BLK[0];
        });
      }
      void lights;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

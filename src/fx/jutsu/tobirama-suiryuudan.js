// Suiton: Suiryuudan no Jutsu (Water Release: Water Dragon Bullet, Tobirama Senju). Narutopedia: forty-four hand seals
// (Tobirama, the master of water, needed far fewer and could make water from his own chakra with no source nearby);
// the water rises into a great dragon that crashes onto the target. Here: a quick run of seals, ending on the Tiger;
// water spouts up from the ground at his feet, swirls into a column and the dragon rears out of it: a long body of
// churning water, a horned head with whiskers and glowing eyes; it arcs high and dives onto the target with a roar,
// exploding into a wave and spray across the floor.
// New: the water dragon (a chain of water rings with a head, spray along its back), the column, the wave.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, sealRun, drawSeals } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["ushi", "saru", "u", "ne", "i", "tori", "ushi", "uma", "tora"], 0.06, { hold: 0.1 });
const SPOUT = SEALS.end, REAR = SPOUT + 0.35, ARC = REAR + 0.4, DIVE = ARC + 0.4, HIT = DIVE + 0.2, END = HIT + 1.6, TX = 190;
const WAT = ["#08203a", "#0e3a66", "#1a62a0", "#4aa0e0", "#a8e0ff", "#ffffff"].map(hex);
const N = 30;

export const meta = {
  name: "Water dragon bullet",
  desc: "Tobirama: a fast run of seals; water spouts from his feet into a column and a great dragon of churning water rears out of it, arcs high and dives onto the target, bursting into a wave across the floor.",
  tags: ["jutsu", "tobirama", "senju", "water", "suiton", "dragon", "projectile", "aoe", "one-shot"],
  size: [290, 220],
  origin: [56, 190],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#08203a", "#0e3a66", "#1a62a0", "#4aa0e0", "#a8e0ff"], seed: 184 },
};

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [END - 0.5, SEALS.keys[SEALS.keys.length - 1][1]],
    [END, READY],
  ],
  hits: [
    { t: SPOUT, shake: 0.6, amp: 2, target: false, sfx: "rumble" },
    { t: REAR, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.2, shake: 1.0, amp: 6, push: 10, straw: 50, skin: "frost", sfx: "explosion" },
    { t: HIT + 0.9, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const LAG = 0.022;
  // the head's path: up out of the column, a high arc, a dive onto the target
  const headAt = (t) => {
    if (t < REAR) return [20, -40 * smooth(SPOUT, REAR, t)];
    if (t < ARC) { const u = ease.outQuad((t - REAR) / (ARC - REAR)); return [20 + 30 * u, -40 - 110 * u]; }
    if (t < DIVE) { const u = (t - ARC) / (DIVE - ARC); return [50 + 90 * u, -150 - 20 * Math.sin(u * Math.PI)]; }
    const u = ease.inQuad(clamp((t - DIVE) / (HIT - DIVE))); return [140 + (TX - 140) * u, -150 + 130 * u];
  };
  return {
    update(t, dt) {
      if (t > SPOUT && t < HIT && R.chance(50 * dt)) { const [x, y] = headAt(t - R.range(0, N * LAG)); ps.spawn(P.SPARK, x, y, R.range(-30, 30), R.range(-40, 10), R.range(0.3, 0.5), WAT[R.int(3, 5)]); }
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -10, 140, WAT[4], 0.6, 0.4); for (let i = 0; i < 40; i++) ps.spawn(P.SPARK, TX + R.range(-20, 20), -R.range(0, 20), R.range(-200, 200), -R.range(60, 260), R.range(0.4, 0.8), WAT[R.int(3, 5)]); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the column of water at his feet
      if (t > SPOUT && t < ARC + 0.3) { const k = smooth(SPOUT, SPOUT + 0.15, t) * (1 - smooth(ARC, ARC + 0.3, t)), h = 60 * smooth(SPOUT, REAR, t); p.shade(6, -h - 4, 34, 1, (x, y, out) => { const w = 10 + 3 * Math.sin(y * 0.3 + t * 20); if (Math.abs(x - 20) > w || -y > h) return; out.a = k; return Math.abs(x - 20) > w - 2 ? WAT[4] : noise2(x * 0.3, y * 0.2 - t * 10, 121) > 0 ? WAT[3] : WAT[2]; }); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawSeals(p, t, SEALS, WAT);
      drawBadge(p, t, { kind: "hien", t0: 0.04, t1: 0.3, label: "SUIRYUUDAN", head: b.head });
      // the dragon: a chain of churning water rings from tail to head, spray along its back, the horned head
      if (t > SPOUT && t < HIT + 0.05) {
        let prev = null;
        for (let i = N; i >= 0; i--) {
          const tt = t - i * LAG;
          if (tt < SPOUT) continue;
          const [x, y] = headAt(tt), w = 4 + 7 * Math.sin(Math.PI * Math.min(1, (N - i) / N + 0.15));
          if (prev) { p.beam(prev[0], prev[1], x, y, w + 2, WAT[1]); p.beam(prev[0], prev[1], x, y, w, i % 3 ? WAT[2] : WAT[3]); p.line(prev[0], prev[1] - w * 0.4, x, y - w * 0.4, WAT[4]); }
          prev = [x, y];
        }
        const [hx, hy] = headAt(t), [px, py] = headAt(t - 0.03), a = Math.atan2(hy - py, hx - px || 0.01), c = Math.cos(a), s = Math.sin(a), at = (u, v) => [hx + c * u - s * v, hy + s * u + c * v];
        p.poly([at(-8, -9), at(14, -6), at(20, -1), at(14, 4), at(-8, 8)], WAT[3]);
        p.poly([at(-4, 4), at(18, 2), at(10, 9), at(-6, 9)], WAT[2]);
        p.line(...at(-4, -9), ...at(-14, -18), WAT[4]); p.line(...at(0, -9), ...at(-6, -20), WAT[4]);
        p.line(...at(16, 1), ...at(24, 8), WAT[4]); p.line(...at(16, -2), ...at(26, -6), WAT[4]);
        p.px(...at(6, -4), WHITE); p.px(...at(7, -4), WAT[5]);
      }
      // the wave where it lands
      if (t > HIT && t < END - 0.2) {
        const v = ease.outCubic(clamp((t - HIT) / 0.6)), k = 1 - smooth(HIT + 0.6, END - 0.2, t);
        p.shade(TX - 90 * v - 10, -40, TX + 90 * v + 10, 1, (x, y, out) => { const d = Math.abs(x - TX) / (90 * v + 1), h = 34 * (1 - d) * (1 - v * 0.5) + 6 * Math.max(0, 1 - Math.abs(d - 0.95) * 8); if (-y > h + 4 * noise2(x * 0.1, t * 5, 122) || d > 1.05) return; out.a = k; return -y > h - 2 ? WAT[5] : noise2(x * 0.2, y * 0.2 + t * 4, 123) > 0.2 ? WAT[4] : WAT[3]; });
      }
      void rand; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

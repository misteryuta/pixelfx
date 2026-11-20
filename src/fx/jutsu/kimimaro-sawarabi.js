// Sawarabi no Mai (Dance of the Seedling Fern, Kimimaro). Narutopedia: Shikotsumyaku, the Kaguya clan's bone kekkei
// genkai; from underground Kimimaro sends up as many as ten thousand blades of bone that burst out of the earth over a
// huge area and high into the air, killing indiscriminately. Here: his two red brow dots, the curse mark of earth
// crawling over his skin, palms slammed to the ground, and a forest of white bone spikes erupting outward from him in a
// wave across the whole floor, the tallest through the target, then crumbling back.
// New: the bone spikes (curved tapering blades, ivory shaded with a dark seam, staggered in a spreading wave).
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const MARK = 0.05, SPREAD = 0.6, SLAM = SPREAD + 0.25, WAVE = 0.6, HOLD = SLAM + WAVE + 0.6, FALL = HOLD + 0.5, END = FALL + 0.6, TX = 150;
const BONE = ["#5a5048", "#a89a88", "#d8cdb8", "#f4ecdc", "#ffffff"].map(hex);
const N = 46;
const SPIKES = Array.from({ length: N }, (_, i) => {
  const x = 14 + (i / (N - 1)) * 220 + (rand(i, 1) - 0.5) * 6, near = Math.abs(x - TX) < 18;
  return { x, h: (near ? 44 : 16) + rand(i, 2) * (near ? 20 : 26), w: 3 + rand(i, 3) * 3, lean: (rand(i, 4) - 0.5) * 0.7, front: rand(i, 5) > 0.45 };
});

export const meta = {
  name: "Dance of the seedling fern",
  desc: "Kimimaro: his red brow dots, the earth curse mark crawling over him, palms slammed to the ground, and a forest of bone spikes erupts outward in a wave across the floor, the tallest through the target, then crumbles.",
  tags: ["jutsu", "kimimaro", "bone", "kekkei-genkai", "aoe", "earth", "one-shot"],
  size: [290, 160],
  origin: [44, 126],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#5a5048", "#a89a88", "#d8cdb8", "#f4ecdc", "#ffffff"], seed: 67 },
};

const PALMS = { ...READY, crouch: 16, lean: 22, fx: 14, fy: 0, bx: 8, by: 0, ffx: 6, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SPREAD, { ...READY, crouch: 3, lean: -4, fx: 14, fy: -20, bx: -10, by: -20 }, "out"],
    [SLAM, PALMS, "in"],
    [FALL, { ...PALMS, crouch: 14 }],
    [END, READY],
  ],
  hits: [
    { t: SLAM, stop: 0.08, shake: 0.3, amp: 2, target: false },
    { t: SLAM + WAVE * ((TX - 14) / 220), stop: 0.16, shake: 0.4, amp: 3, push: 2, straw: 40, skin: "red" },
    { t: END - 0.2, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

function spike(p, s, h, k) {
  if (h < 1) return;
  const { x, w, lean } = s, tipx = x + lean * h;
  p.shade(x - w - Math.abs(lean) * h - 1, -h - 1, x + w + Math.abs(lean) * h + 1, 0, (px, py, out) => {
    const v = -py / h, cx = x + lean * h * v * v, half = w * (1 - v) ** 0.8;
    if (v < 0 || v > 1 || Math.abs(px - cx) > half) return;
    const u = (px - cx) / Math.max(0.5, half);
    out.a = k;
    if (Math.abs(u) > 0.75) return BONE[0];
    return u < -0.3 ? BONE[4] : u < 0.15 ? BONE[3] : u < 0.5 ? BONE[2] : BONE[1];
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const heightAt = (s, t) => {
    const at = SLAM + WAVE * ((s.x - 14) / 220), up = ease.outBack(clamp((t - at) / 0.12), 1.4), down = smooth(HOLD + ((s.x - 14) / 220) * 0.3, FALL + ((s.x - 14) / 220) * 0.3, t);
    return s.h * up * (1 - down);
  };
  const burst = SPIKES.map(() => false);
  return {
    update(t, dt) {
      SPIKES.forEach((s, i) => {
        if (!burst[i] && heightAt(s, t) > 2) {
          burst[i] = true;
          for (let j = 0; j < 3; j++) ps.spawn(P.GRIT, s.x, -1, R.range(-50, 50), -R.range(40, 120), R.range(0.4, 0.7), hex(["#3a3048", "#5a4c66"][j % 2]));
        }
      });
      ps.update(dt);
    },
    drawBack(p, t) {
      for (const s of SPIKES) if (!s.front) spike(p, s, heightAt(s, t), 1);
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "kimimaro", t0: MARK, t1: SPREAD, label: "SHIKOTSUMYAKU", head: b.head });
      // the two red dots on his brow, and the curse mark spreading over him as dark spots
      p.px(hx, hy - 3, hex("#c8202a"));
      p.px(hx + 2, hy - 3, hex("#c8202a"));
      if (t > SPREAD - 0.2) {
        const k = smooth(SPREAD - 0.2, SLAM, t);
        for (let i = 0; i < 10 * k; i++) p.px(b.chest[0] + (rand(i, 21) - 0.5) * 10, b.chest[1] + (rand(i, 22) - 0.4) * 22, hex("#1a1420"));
      }
      for (const s of SPIKES) if (s.front) spike(p, s, heightAt(s, t), 1);
      ps.draw(p, "front");
    },
  };
});

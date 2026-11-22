// Satetsu Shigure (Iron Sand: Drizzle, Sasori, with the Third Kazekage's puppet). Narutopedia: the Third Kazekage's body,
// made a puppet, still uses his Magnet Release: iron sand, shaped into countless spikes and rained on the foe. Here:
// chakra threads from Sasori's fingertips to the puppet hanging beside him, a tall figure in a dark coat; its mouth
// drops open and black sand pours out, climbing into a cloud over the target; the cloud hardens into hundreds of iron
// needles, all swinging round onto the target; they are fired like gunshots, too fast to see, pinning the target; the last of them
// branch into a thicket of black thorns round it (Iron Sand World), then crumble back to sand and drain into the mouth.
// New: the puppet on its threads, the sand cloud, the spike rain, the branching thorns.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 180, THREADS = 0.3, POUR = 0.75, CLOUD = 1.35, HARDEN = 1.6, RAIN = 1.85, WORLD = 2.5, CRUMBLE = 3.4, END = 4.3;
const IRON = ["#06060a", "#141420", "#262636", "#3e3e54", "#7a7a96"].map(hex), CHAKRA = hex("#6ad0ff");
const PX = 36, CLOUDY = -86, CX = TX - 84;

export const meta = {
  name: "Iron sand: drizzle",
  desc: "Sasori works the Third Kazekage puppet on chakra threads; black iron sand pours from its mouth into a cloud, hardens into hundreds of needles fired like gunshots into the target, the last branching into a thicket of black thorns.",
  tags: ["jutsu", "sasori", "akatsuki", "puppet", "iron-sand", "magnet", "aoe", "one-shot"],
  size: [320, 230],
  origin: [56, 198],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#06060a", "#141420", "#262636", "#3e3e54", "#7a7a96"], seed: 73 },
};

const WORK = { ...READY, crouch: 3, lean: -2, fx: 14, fy: -30, bx: 10, by: -26, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [THREADS, WORK, "out"],
    [RAIN - 0.05, { ...WORK, fy: -36, by: -32 }],
    [RAIN, { ...WORK, fx: 18, fy: -22, by: -20 }, "snap"],
    [CRUMBLE, WORK],
    [END, READY],
  ],
  hits: [
    { t: POUR, target: false, sfx: "cast" },
    { t: RAIN + 0.15, stop: 0.04, shake: 0.2, amp: 1, push: 1, straw: 8, sfx: "parry" },
    ...[0.3, 0.45, 0.6].map((d) => ({ t: RAIN + d, stop: 0.02, shake: 0.15, amp: 1, push: 0.8, straw: 6, sfx: "punch" })),
    { t: WORLD, stop: 0.16, shake: 0.6, amp: 4, push: 3, straw: 30, skin: "shadow", sfx: "heavy" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// the puppet: a tall gaunt figure in a dark coat hanging a little off the floor, head turned, its jaw hinged
function puppet(p, x, y, t, jaw) {
  const sway = Math.sin(t * 2) * 1.2;
  p.poly([[x - 9 + sway, y - 34], [x + 9 + sway, y - 34], [x + 12, y], [x - 12, y]], hex("#1a1420"));
  p.poly([[x - 7 + sway, y - 34], [x + 7 + sway, y - 34], [x + 4, y - 2], [x - 4, y - 2]], hex("#2a2230"));
  p.line(x + sway, y - 32, x, y - 2, hex("#3a2e44"));
  // the head: pale, hair falling, the jaw dropping on its hinge
  const hx = x + sway + 1, hy = y - 41;
  p.circle(hx, hy, 6, hex("#120c16"));
  p.circle(hx + 1, hy + 1, 4.5, hex("#c8b8a0"));
  p.rect(hx - 1, hy - 1, 2, 1, hex("#1a1420"));
  p.rect(hx + 3, hy - 1, 2, 1, hex("#1a1420"));
  p.rect(hx, hy + 3 + jaw * 3, 5, 1.5, hex("#c8b8a0"));
  if (jaw > 0.1) p.rect(hx + 1, hy + 3, 3, jaw * 3, hex("#0a0608"));
  // the arms hanging, jointed
  p.line(x - 8 + sway, y - 30, x - 12, y - 14, hex("#2a2230"));
  p.line(x + 8 + sway, y - 30, x + 13, y - 16, hex("#2a2230"));
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the needles (Narutopedia: a gunshot-like attack, the sand hardened into needles and driven by magnetic repulsion):
  // each hardens in the cloud, swings to point at the target, and is fired at its own instant, too fast to see
  const SPK = Array.from({ length: 70 }, (_, i) => { const x = CX - 50 + rand(i, 1) * 100, y = CLOUDY - 14 + rand(i, 2) * 28, tx = TX + (rand(i, 6) - 0.4) * 40, ty = -2 - rand(i, 7) * 50; return { x, y, tx, ty, L: 10 + rand(i, 3) * 8, t0: RAIN + rand(i, 4) * 0.6, a0: rand(i, 5) * TAU, a1: Math.atan2(ty - y, tx - x) }; });
  return {
    update(t, dt) {
      for (const s of SPK) if (t >= s.t0 + 0.06 && !s.hit) { s.hit = true; ps.spawn(P.SPARK, s.tx, s.ty, R.range(-40, 40), -R.range(20, 80), R.range(0.08, 0.16), R.chance(0.5) ? WHITE : IRON[4]); }
      if (t >= WORLD && !this.w) { this.w = 1; lights.add(TX, -30, 120, IRON[4], 0.6, 0.3); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), py = -6 + Math.sin(t * 2.5) * 1.5, jaw = smooth(POUR - 0.15, POUR, t) * (1 - smooth(CRUMBLE + 0.5, END - 0.2, t));
      drawBadge(p, t, { kind: "akatsuki", t0: 0.04, t1: THREADS, label: "SANDAIME", head: b.head });
      puppet(p, PX, py, t, jaw);
      // the chakra threads from his fingertips to the puppet's head and hands
      if (t > THREADS) {
        const k = smooth(THREADS, THREADS + 0.2, t);
        for (const [hand, to] of [[b.handN, [PX + 1, py - 46]], [b.handN, [PX - 12, py - 14]], [b.handF, [PX + 13, py - 16]], [b.handF, [PX + 2, py - 34]]]) p.line(hand[0], hand[1], to[0], to[1], CHAKRA, 0.6 * k);
      }
      const mouth = [PX + 4, py - 37];
      // the sand pouring out of its mouth and climbing to the cloud
      if (t > POUR && t < HARDEN + 0.1) for (let i = 0; i < 40; i++) {
        const u = ((t * 1.6 + i / 40) % 1), x = mouth[0] + (CX - mouth[0]) * u + Math.sin(u * 9 + i) * 6, y = mouth[1] + (CLOUDY - mouth[1]) * Math.sin(u * Math.PI / 2) - Math.sin(u * Math.PI) * 20;
        p.px(x, y, IRON[1 + (i % 3)], 1 - smooth(HARDEN - 0.1, HARDEN + 0.1, t));
      }
      // the cloud: a churning mass of black grains over the target
      const cloud = smooth(POUR + 0.2, CLOUD, t) * (1 - smooth(HARDEN, RAIN + 0.3, t));
      if (cloud > 0) p.shade(CX - 70, CLOUDY - 30, CX + 70, CLOUDY + 30, (x, y, out) => {
        const dx = (x - CX) / 60, dy = (y - CLOUDY) / 20, n = noise2(x * 0.08 + t, y * 0.12, 3);
        if (dx * dx + dy * dy > cloud * (0.9 + 0.5 * n)) return;
        out.a = 1;
        return rand(x | 0, (y | 0) + Math.floor(t * 20)) > 0.7 ? IRON[3] : n > 0.2 ? IRON[2] : IRON[1];
      });
      // the needles: harden in the cloud, swing round onto the target, fired: a streak, then stuck quivering
      if (t > HARDEN) for (const s2 of SPK) {
        const turn = smooth(HARDEN, RAIN, t), a = s2.a0 * (1 - turn) + s2.a1 * turn, fly = clamp((t - s2.t0) / 0.06);
        const x = s2.x + (s2.tx - s2.x) * fly, y = s2.y + (s2.ty - s2.y) * fly;
        const k = 1 - smooth(WORLD + 0.4, CRUMBLE + 0.3, t), c = Math.cos(a), sn = Math.sin(a), q = fly >= 1 ? Math.sin((t - s2.t0) * 70) * Math.exp(-(t - s2.t0) * 12) * 0.15 : 0;
        const cc = Math.cos(a + q), ss = Math.sin(a + q);
        p.beam(x - cc * s2.L, y - ss * s2.L, x, y, 2.2, IRON[1], k);
        p.line(x - cc * s2.L, y - ss * s2.L, x, y, IRON[3], k);
        p.px(x, y, IRON[4], k);
        // the streak of a needle in flight
        if (fly > 0 && fly < 1) p.line(s2.x, s2.y, x, y, IRON[3], 0.6);
        void c; void sn;
      }
      // the world: black thorns branching up and out round the target
      if (t > WORLD - 0.05 && t < CRUMBLE + 0.6) {
        const g = ease.outCubic(smooth(WORLD - 0.05, WORLD + 0.15, t)), k = 1 - smooth(CRUMBLE, CRUMBLE + 0.6, t);
        const branch = (x, y, a, L, d, seed) => {
          if (d > 3 || L < 3) return;
          const x1 = x + Math.cos(a) * L * g, y1 = y + Math.sin(a) * L * g;
          p.beam(x, y, x1, y1, 3.4 - d * 0.7, IRON[0], k);
          p.line(x, y, x1, y1, IRON[3], k);
          for (let j = 0; j < 2; j++) branch(x1, y1, a + (rand(seed, j + d * 3) - 0.5) * 1.6, L * 0.6, d + 1, seed * 3 + j);
        };
        for (let i = 0; i < 7; i++) branch(TX - 30 + i * 10, 0, -Math.PI / 2 + (i - 3) * 0.22, 30 + rand(i, 9) * 14, 0, i + 1);
      }
      // the crumble: everything falling back to sand and draining toward the mouth
      if (t > CRUMBLE && t < END - 0.2) for (let i = 0; i < 30; i++) {
        const u = clamp((t - CRUMBLE) / (END - 0.2 - CRUMBLE) + rand(i, 2) * 0.3 - 0.15), x = TX - 40 + rand(i, 1) * 80 + (mouth[0] - TX) * u, y = -rand(i, 3) * 30 + (mouth[1] + 10) * u - Math.sin(u * Math.PI) * 30;
        p.px(x, y, IRON[2 + (i % 2)]);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

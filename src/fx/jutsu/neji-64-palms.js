// Hakke Rokujuuyon Shou (Eight Trigrams Sixty-Four Palms, Neji). Narutopedia: a secret Hyuuga taijutsu; with the
// Byakugan the user sees themselves at the centre of an Eight Trigrams symbol and strikes the target inside it in a
// doubling series, two palms, four, eight, sixteen, thirty-two, sixty-four, each closing one of its tenketsu so its
// chakra stops flowing. Here: the Byakugan and its veins, the trigram circle spreading over the floor under them both,
// the stance, the count called out as the blows double and quicken, a point of light marking each closed tenketsu on
// the target, and a last palm that drives it away.
// New: the trigram circle (its eight signs of broken and whole bars), the count, the tenketsu, the alternating palms.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, FIELD = OPEN + 0.1, STANCE = FIELD + 0.35, TX = 64;
// the doubling series: when each set starts and how long it takes; every set twice as many blows in about the same time
const SETS = [2, 4, 8, 16, 32].map((n, i) => ({ n, t0: STANCE + 0.25 + i * 0.42, dur: 0.36 }));
const FINAL = SETS.at(-1).t0 + SETS.at(-1).dur + 0.12, END = FINAL + 1.1;
const BK = ["#1a2a5a", "#3a5aa8", "#7aa8e8", "#c8e0ff", "#ffffff"].map(hex);
// the 64 tenketsu, scattered over the target's body
const TEN = Array.from({ length: 64 }, (_, i) => [TX - 9 + rand(i, 1) * 18, -42 + rand(i, 2) * 34]);
const blowTimes = [...SETS.flatMap((s) => Array.from({ length: s.n }, (_, j) => s.t0 + (s.dur * j) / s.n)), FINAL];

export const meta = {
  name: "Sixty-four palms",
  desc: "Neji: the Byakugan, the eight trigram circle spreading under them both, then palms in a doubling series, 2, 4, 8, 16, 32, 64, each closing a tenketsu that lights on the target, and a last palm that drives it away.",
  tags: ["jutsu", "neji", "hyuuga", "byakugan", "taijutsu", "combo", "melee", "one-shot"],
  size: [220, 150],
  origin: [80, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a2a5a", "#3a5aa8", "#7aa8e8", "#c8e0ff", "#ffffff"], seed: 50 },
};

const STANCEP = { ...READY, x: 24, crouch: 10, lean: 6, fx: 18, fy: -26, bx: -10, by: -22, ffx: 14, fbx: -12 };
const PALM = (i) => (i % 2 ? { ...STANCEP, fx: 25, fy: -20 - (i * 7) % 18, bx: -6, by: -20, lean: 10 } : { ...STANCEP, fx: 6, fy: -24, bx: 25, by: -22 - (i * 5) % 16, lean: 10, armsFront: true });
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [FIELD, { ...READY, x: 10, crouch: 4 }],
    [STANCE, STANCEP, "out"],
    ...blowTimes.slice(0, -1).filter((_, i) => i % 2 === 0 || i < 30).map((t, i) => [t, PALM(i), "snap"]),
    [FINAL, { ...STANCEP, crouch: 8, lean: 14, fx: 27, fy: -26, bx: 26, by: -22, armsFront: true }, "snap"],
    [END - 0.3, STANCEP],
    [END, STANCEP],
  ],
  hits: [
    ...SETS.map((s) => ({ t: s.t0, stop: 0.03, shake: 0.05, amp: 1, push: 0.6, straw: 4, flash: 0, shiver: 0.3 })),
    { t: FINAL, stop: 0.18, shake: 0.4, amp: 3, push: 5.5, straw: 34, skin: "shock" },
    { t: END - 0.2, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// one of the eight trigrams: three bars, each whole or broken, set by the bits of k
function trigram(p, x, y, k, c) {
  for (let i = 0; i < 3; i++) {
    const yy = y + i * 2 - 2;
    if ((k >> i) & 1) p.line(x - 3, yy, x + 3, yy, c);
    else (p.line(x - 3, yy, x - 1, yy, c), p.line(x + 1, yy, x + 3, yy, c));
  }
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let n = 0;
  return {
    update(t, dt) {
      while (n < blowTimes.length && t >= blowTimes[n]) {
        const [x, y] = TEN[Math.min(63, n)];
        for (let j = 0; j < 3; j++) ps.spawn(P.SPARK, x, y, R.range(-60, 60), R.range(-60, 30), R.range(0.08, 0.18), j ? BK[3] : WHITE);
        n++;
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      // the trigram circle: drawn out from under him, eight signs round a double ring, turning slowly
      if (t > FIELD) {
        const k = ease.outCubic(clamp((t - FIELD) / 0.35)) * (1 - smooth(END - 0.5, END, t)), cx = 40, R0 = 62 * k;
        for (const rr of [1, 0.82]) for (let a = 0; a < TAU; a += 0.04) p.px(cx + Math.cos(a) * R0 * rr, Math.sin(a) * 7 * k * rr, BK[2]);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + t * 0.2, x = cx + Math.cos(a) * R0 * 0.91, y = Math.sin(a) * 7 * k * 0.91 - 1;
          if (k > 0.5) trigram(p, x, y, i, BK[3]);
        }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "byakugan", t0: EYE, t1: OPEN, label: "BYAKUGAN", head: b.head });
      drawGlint(p, t, "byakugan", OPEN + 0.05, END - 0.2, b.head);
      if (t > OPEN) for (const s of [-1, 1]) {
        p.line(hx + 2 + s * 1.5, hy - 1, hx + 2 + s * 3, hy - 2.5, hex("#b97a8e"));
        p.px(hx + 2 + s * 3.5, hy, hex("#b97a8e"));
      }
      // the closed tenketsu, lit one by one
      const done = blowTimes.filter((x) => t >= x).length, fade = 1 - smooth(FINAL + 0.4, END, t);
      for (let i = 0; i < Math.min(64, done); i++) {
        const [x, y] = TEN[i], fresh = t - blowTimes[i] < 0.08;
        p.px(x, y, fresh ? WHITE : BK[3]);
        if (fresh) p.glow(x, y, 6, BK[2], 0.8);
        else if (fade < 1) p.dot(x, y, BK[3], fade);
      }
      // the count, called out as each set starts
      const set = [...SETS].reverse().find((s) => t >= s.t0), fin = t >= FINAL;
      if (set && t < END - 0.2) {
        const txt = fin ? "64 PALMS!" : `${set.n} PALMS`, a = t - (fin ? FINAL : set.t0), pop = Math.max(1, Math.round(2 * ease.outBack(clamp(a / 0.08), 3)));
        p.text(txt, TX - 10, -82, a < 0.05 ? WHITE : BK[3], { font: "big", scale: fin ? pop : 1, align: "center", outline: hex("#0a0c1a") });
      }
      if (fin && t < FINAL + 0.3) {
        const u = (t - FINAL) / 0.3;
        p.ring(TX - 10, -26, 6 + 30 * ease.outCubic(u), 1, u < 0.3 ? WHITE : BK[3], 1 - u);
      }
      ps.draw(p, "front");
    },
  };
});

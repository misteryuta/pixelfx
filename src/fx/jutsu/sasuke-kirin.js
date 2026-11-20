// Kirin (Sasuke). Narutopedia: Sasuke doesn't make this lightning, he takes it: natural lightning drawn from storm
// clouds (made beforehand with fire), shaped by chakra into a beast and guided down onto the target in a thousandth of a
// second; it uses the clouds up, so it can only be done once. Here: the Sharingan, a hand raised to a sky darkening
// with thunderheads that flicker from within, the hand brought down, and the lightning comes down as a dragon's head on
// a body of bolts, strikes, and the sky clears.
// New: the cloud bank, the dragon (jagged bolts along a sinuous path, _lib bolt; a head of shaded jaws and horns at the
// tip). From the library: the lightning strike, its scorch and its sparks, under the dragon.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, mix, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt, drawChidori, veil } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const RAISE = 0.35, CLOUD = 0.55, READYK = CLOUD + 1.1, DROP = READYK + 0.12, FALL = 0.13, HIT = DROP + FALL, CLEAR = HIT + 0.8, TX = 160, SKY = -150;
const LT = ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff"];

export const meta = {
  name: "Kirin",
  desc: "Sasuke: the Sharingan, a hand raised to a sky that fills with thunderheads, brought down, and the storm's own lightning falls on the target in the shape of a dragon.",
  tags: ["jutsu", "sasuke", "lightning", "raiton", "sharingan", "aoe", "one-shot"],
  size: [300, 250],
  origin: [56, 214],
  duration: CLEAR + 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: LT, seed: 31 },
};

const UP = { ...READY, crouch: 2, lean: -4, fx: 5, fy: -47, bx: 8, by: -22, ffx: 8, fbx: -8 };
const DOWN = { ...READY, crouch: 7, lean: 8, fx: 20, fy: -16, bx: -6, by: -22, ffx: 10, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RAISE, UP, "out"],
    [READYK, { ...UP, crouch: 3 }],
    [DROP, DOWN, "snap"],
    [CLEAR + 0.5, { ...DOWN, crouch: 4, lean: 3 }],
    [meta.duration, READY],
  ],
  hits: [
    { t: HIT, stop: 0.22, shake: 0.7, amp: 5, push: 5, straw: 46, skin: "char" },
    { t: HIT + 0.2, stop: 0.03, flash: 0, push: 1, straw: 10, shiver: 0.6, skin: "shock" },
    { t: meta.duration - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: DROP, x: 4, n: 6 }],
};

// the dragon's spine: from a gap in the clouds, a long S down onto the target
const PATH = (u) => {
  const x = TX - 70 + 70 * u + Math.sin(u * 5.5) * 26 * (1 - u), y = SKY + 20 + (-22 - SKY - 20) * u;
  return [x, y];
};

export const create = play([], (o) => {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const DARK = [hex("#0c0a16"), hex("#171428"), hex("#24203a"), hex("#36304e")];
  let hit = false;
  // the cloud bank: puffs that roll in and thicken, flickering from within, and tear apart once it's spent
  const puffs = Array.from({ length: 22 }, (_, i) => ({ x: -34 + i * 12 + rand(i, 1) * 8, y: SKY - 10 + rand(i, 2) * 26, r: 14 + rand(i, 3) * 12, d: rand(i, 4) * 0.5 }));
  return {
    update(t, dt) {
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(TX, -30, 160, C[3], 1, 0.4);
        for (let i = 0; i < 30; i++) ps.spawn(P.GRIT, TX + R.range(-14, 14), -1, R.range(-150, 150), -R.range(80, 260), R.range(0.6, 1.2), hex(["#3a3048", "#5a4c66"][i % 2]), R.chance(0.4) ? 2 : 1);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const gather = smooth(CLOUD, READYK, t), clear = smooth(HIT + 0.2, CLEAR + 0.6, t);
      if (gather > 0 && clear < 1) {
        // the sky dims under it
        veil(p, -56, -214, 243, 0, DARK[0], 0.4 * gather * (1 - clear));
        const f = Math.floor(t * 24), lit = rand(f, 77) > 0.82 && t < HIT;
        for (const q of puffs) {
          const k = clamp((gather - q.d) / (1 - q.d)) * (1 - clamp((clear - q.d * 0.5) * 1.6)), drift = (q.x < TX - 60 ? -1 : 1) * clear * 60;
          if (k <= 0) continue;
          const x = q.x + drift, y = q.y - (1 - k) * 20, r = q.r * (0.6 + 0.4 * k);
          p.disc(x, y + 3, r, DARK[0], (d) => (d < 0.9 ? 0.85 * k : 0.4 * k));
          p.disc(x, y, r * 0.92, (d) => (d < 0.5 ? (lit && Math.abs(x - TX + 40) < 70 ? DARK[3] : DARK[2]) : DARK[1]), (d) => (d < 0.85 ? 0.9 * k : 0.45 * k));
        }
        // lightning crawling through the clouds
        if (gather > 0.6 && t < HIT && rand(f, 5) > 0.55) {
          const x0 = TX - 120 + rand(f, 6) * 200;
          bolt(p, x0, SKY + rand(f, 7) * 12, x0 + (rand(f, 8) - 0.5) * 60, SKY + 10 + rand(f, 9) * 20, f, C, { jag: 0.3, glow: 0.4 });
        }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "sharingan", t0: 0.05, t1: RAISE + 0.25, label: "SHARINGAN", head: b.head });
      drawGlint(p, t, "sharingan", RAISE + 0.3, meta.duration - 0.5, b.head);
      // the raised hand calls the storm: sparks running up off it
      if (t > RAISE && t < DROP) drawChidori(p, b.handN[0], b.handN[1], t, C, 0.5 * smooth(RAISE, RAISE + 0.3, t), 3);
      // the dragon: falls, head first, and its bolts hang a moment after it strikes
      if (t >= DROP && t < HIT + 0.45) {
        const u = ease.inQuad(clamp((t - DROP) / FALL)), fade = 1 - smooth(HIT + 0.1, HIT + 0.45, t), f = Math.floor(t * 30);
        const N = 14, end = Math.max(1, Math.round(N * u));
        if (fade > 0.05) {
          for (let i = 0; i < end; i++) {
            const [x0, y0] = PATH(i / N), [x1, y1] = PATH((i + 1) / N);
            for (const s of [-3, 0, 3]) bolt(p, x0 + s, y0, x1 + s, y1, f + i * 7 + s, C, { jag: 0.35, seed: i + s, glow: s ? 0 : 0.6 * fade });
            // whiskers of lightning trailing off the body
            if (i % 3 === 1) bolt(p, x0, y0, x0 + (rand(f, i) - 0.5) * 40, y0 + rand(f, i + 3) * 18, f + i, C, { jag: 0.4, glow: 0 });
          }
          // the head, at the tip, pointing along the path
          const [hx, hy] = PATH(Math.min(1, end / N)), [px, py] = PATH(Math.max(0, end / N - 0.08)), a = Math.atan2(hy - py, hx - px), c = Math.cos(a), s = Math.sin(a);
          const T = (u2, v2) => [hx + (c * u2 - s * v2) * 1.6, hy + (s * u2 + c * v2) * 1.6], open = 0.6 + 0.4 * Math.sin(t * 40);
          p.poly([T(-14, -7), T(6, -5), T(14, -2 - open * 2), T(2, -1), T(-6, 0)], C[3]);
          p.poly([T(-12, 6), T(4, 4), T(12, 4 + open * 4), T(0, 2), T(-6, 1)], C[3]);
          p.poly([T(-16, -6), T(-26, -14), T(-14, -3)], WHITE);
          p.poly([T(-16, 5), T(-28, 10), T(-14, 3)], WHITE);
          p.line(...T(-12, -6), ...T(10, -4), WHITE);
          p.px(...T(-6, -4), WHITE);
          p.glow(hx, hy, 40, C[3], 0.9 * fade);
        }
      }
      if (t >= HIT && t < HIT + 0.04) veil(p, -56, -214, 243, 35, WHITE, 0.85);
      else if (t >= HIT && t < HIT + 0.12) veil(p, -56, -214, 243, 35, C[4], 0.35);
      // the scorch it leaves, glowing out
      if (t > HIT) {
        const k = 1 - smooth(0.3, 1.6, t - HIT);
        p.ellipse(TX, 0.5, 22, 2.5, hex("#120c18"), 0.9 * k);
        p.ellipse(TX, 0, 14, 1.2, C[3], k * (1 - smooth(0, 0.6, t - HIT)));
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

// Senpou: Goemon (Sage Art: Goemon, Jiraiya with Fukasaku and Shima). Narutopedia: a collaboration technique in
// Sage Mode: Shima spits oil, Fukasaku blows wind, Jiraiya breathes fire; the three combine into a vast wave of
// burning, boiling oil (the name is from Ishikawa Goemon, boiled alive in oil). Here: Jiraiya in Sage Mode (the warts,
// the toad-like nose, the orange pigment round his eyes) with the two elder toads on his shoulders; all three suck in
// a breath; Shima spits a thick yellow stream of oil, Fukasaku blows a gale behind it that spreads the oil into a
// rolling sheet, and Jiraiya breathes fire into it: the whole sheet catches and becomes a boiling wave of burning
// oil that crashes over the target, bubbling, dripping, smoke rising.
// New: the two toads (Shima violet with her lips, Fukasaku grey-green with his white brows), the three streams, the
// boiling fire-oil (bubbles that pop inside the flame).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE } from "../../core/index.js";
import { play, bodyAt, MOUTH } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const SAGE = 0.05, BREATH = 0.5, OIL = 0.85, WIND = 1.05, FIRE = 1.3, CRASH = 1.75, END = 4.0, TX = 180;
const OILC = ["#6a4a08", "#b88a1a", "#e8c040", "#fff0a0"].map(hex), FLM = ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"].map(hex);
const SHIMA = ["#3a2a4a", "#6a5a8a", "#a898c0"].map(hex), FUKA = ["#2a3a2a", "#5a7050", "#a0b088"].map(hex), SMK = hex("#4a4048");

export const meta = {
  name: "Sage art: Goemon",
  desc: "Jiraiya in Sage Mode with Fukasaku and Shima on his shoulders: Shima spits oil, Fukasaku blows a gale into it, Jiraiya breathes fire, and the whole sheet becomes a boiling wave of burning oil that crashes over the target.",
  tags: ["jutsu", "jiraiya", "sage-mode", "fire", "wind", "oil", "aoe", "one-shot"],
  size: [300, 190],
  origin: [56, 158],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#6a4a08", "#b88a1a", "#d8461c", "#ffd060"], seed: 156 },
};

const INHALE = { ...READY, crouch: 3, lean: -8, fx: 6, fy: -30, bx: -4, by: -28, ffx: 9, fbx: -9 };
const BLOW = { ...READY, crouch: 6, lean: 10, armsFront: true, fx: 9, fy: -29, bx: 10, by: -28, ffx: 12, fbx: -11 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [BREATH, INHALE, "out"],
    [FIRE - 0.05, { ...INHALE, lean: -10 }],
    [FIRE, BLOW, "snap"],
    [END - 0.6, BLOW],
    [END, READY],
  ],
  hits: [
    { t: SAGE, target: false, sfx: "cast" },
    { t: OIL, target: false, sfx: "whoosh" },
    { t: FIRE, stop: 0.05, shake: 0.4, amp: 2, target: false, sfx: "explosion" },
    { t: CRASH, stop: 0.18, shake: 1.0, amp: 5, push: 8, straw: 40, flash: 0.06, skin: "char", sfx: "explosion" },
    ...[0.5, 1.0, 1.5].map((d) => ({ t: CRASH + d, stop: 0.02, push: 1, straw: 6, flash: 0, skin: "char" })),
    { t: END - 0.2, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const toads = (b) => { const [cx, cy] = b.chest; return { shima: [cx - 5, cy - 11], fuka: [cx + 4, cy - 12] }; };
  // the wave's front and how tall it stands
  const front = (t) => (t < FIRE ? 0 : ease.outCubic(clamp((t - FIRE) / (CRASH + 0.3 - FIRE))));
  return {
    update(t, dt) {
      if (t >= CRASH && !this.c) { this.c = 1; lights.add(TX, -30, 160, FLM[4], 0.8, 0.5); }
      if (t > CRASH && t < END - 0.4 && R.chance(40 * dt)) ps.spawn(P.SMOKE, TX + R.range(-50, 50), -R.range(20, 60), R.range(-10, 10), -R.range(20, 50), R.range(0.8, 1.4), SMK, 2);
      if (t > FIRE && R.chance(20 * dt)) lights.add(TX - 40 + R.range(-30, 30), -20, 60, FLM[3], 0.25, 0.15);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head, T = toads(b);
      drawBadge(p, t, { kind: "sage", t0: SAGE, t1: BREATH - 0.1, label: "SENPOU: GOEMON", head: b.head });
      drawGlint(p, t, "sage", BREATH, END - 0.3, b.head);
      // Sage Mode marks: the orange pigment round his eyes, the warts on his nose and chin
      if (t > SAGE + 0.1) { const k = smooth(SAGE + 0.1, SAGE + 0.4, t); p.px(hx + 2, hy - 1, hex("#e2662b"), k); p.px(hx + 3, hy - 1, hex("#e2662b"), k); p.px(hx + 4, hy + 1, hex("#5a3a2a"), k); p.px(hx + 2, hy + 3, hex("#5a3a2a"), k); }
      // the two elder toads on his shoulders, puffing up their cheeks on the inhale
      const puff = smooth(BREATH - 0.2, BREATH + 0.2, t) * (1 - smooth(OIL, OIL + 0.2, t));
      for (const [key, C, brows] of [["shima", SHIMA, 0], ["fuka", FUKA, 1]]) {
        const [x, y] = T[key], r = 4.5 + 1.5 * puff;
        p.ellipse(x, y, r + 1, r * 0.8 + 1, hex("#141018"));
        p.ellipse(x, y, r, r * 0.8, C[1]); p.ellipse(x - 0.5, y - 0.5, r * 0.6, r * 0.4, C[2]);
        p.px(x + 1, y - 2, hex("#ffd040")); p.px(x + 2, y - 2, hex("#ffd040"));
        if (brows) { p.px(x, y - 3, WHITE); p.px(x + 2, y - 3, WHITE); }
        else p.line(x + 1, y + 1, x + 3, y + 1, hex("#c86a8a"));
      }
      const [mx, my] = [b.q.x ?? 0, b.q.y ?? 0].map((v, i) => v + MOUTH[i]);
      // Shima's oil: a thick yellow stream arcing out
      if (t > OIL && t < FIRE + 0.15) {
        const L = 90 * smooth(OIL, OIL + 0.3, t), [sx, sy] = T.shima, k = 1 - smooth(FIRE, FIRE + 0.15, t);
        for (let i = 0; i < L; i += 1.5) { const x = sx + 3 + i, y = sy + (i * i) / 900 + Math.sin(i * 0.3 + t * 20) * 0.6; p.beam(x, y - 1.2, x, y + 1.2, 1.4, i % 6 < 3 ? OILC[2] : OILC[1], k); }
      }
      // Fukasaku's gale: streaks blowing the oil out into a spreading sheet
      if (t > WIND && t < FIRE + 0.1) {
        const [sx, sy] = T.fuka, k = smooth(WIND, WIND + 0.1, t) * (1 - smooth(FIRE, FIRE + 0.1, t));
        for (let i = 0; i < 8; i++) { const ph = (t * 3 + i / 8) % 1, x = sx + 4 + ph * 110, y = sy - 6 + (i - 4) * 3 + ph * (i - 4) * 4; p.line(x, y, x + 10, y + (i - 4) * 0.4, WHITE, 0.6 * k * (1 - ph)); }
        // the sheet of oil spreading
        const w = smooth(WIND, FIRE, t);
        p.shade(sx, sy - 30 * w, sx + 120, sy + 26 * w, (x, y, out) => { const v = (x - sx) / 120, h = 4 + 26 * v * w; if (Math.abs(y - sy - 6 * v) > h * (0.6 + 0.4 * noise2(x * 0.1 - t * 8, y * 0.1, 2))) return; out.a = 0.55 * k; return OILC[(x + y) & 1 ? 1 : 2]; });
      }
      // Jiraiya's fire catching it: a burning, boiling wave that rolls out and crashes over the target
      if (t > FIRE) {
        const u = front(t), x1 = mx + 10 + (TX + 40 - mx - 10) * u, k = 1 - smooth(END - 0.7, END - 0.1, t), H = 20 + 40 * u;
        p.shade(mx, -H * 1.6 - 10, x1 + 30, 1, (x, y, out) => {
          const v = (x - mx) / Math.max(1, x1 - mx);
          if (v < 0 || v > 1.3) return;
          // a cone out of his mouth that thickens and slumps to the floor as it goes
          const cyy = my + (-H * 0.5 - my) * Math.min(1, v * 1.4), hh = 3 + H * Math.min(1, v * 1.3) * (v > 0.92 ? Math.max(0, 1 - (v - 0.92) * 5) : 1);
          const n = noise2(x * 0.08 - t * 7, y * 0.08 + t * 3, 3), d = Math.abs(y - cyy) / hh + 0.3 * n;
          if (d > 1 && !(y > cyy && y < 1 && v > 0.55 && v < 1 - 0.1 * (n + 1))) return;
          out.a = k;
          const heat = 1 - Math.min(1, d);
          // bubbles of boiling oil inside the flame
          const bx = Math.floor(x / 5), by = Math.floor(y / 5), ph = (t * 3 + rand(bx, by)) % 1;
          if (heat > 0.3 && rand(bx, by + 7) > 0.8 && Math.hypot((x % 5) - 2.5, (y % 5) - 2.5) < 1.6 * ph) return OILC[3];
          return heat > 0.75 ? FLM[5] : heat > 0.5 ? FLM[4] : heat > 0.25 ? FLM[3] : n > 0.1 ? FLM[2] : OILC[1];
        });
        // drips of burning oil off its underside
        for (let i = 0; i < 8; i++) { const x = mx + 30 + i * 18, ph = (t * 1.5 + rand(i, 2)) % 1; if (x < x1) p.circle(x, -H * 0.4 + ph * (H * 0.4), 1.2, FLM[3], k * (1 - ph)); }
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

// ULTIMATE: Kyuubi Chakra Mode: Hiraishin Rasengan barrage (Minato Namikaze with the Yin half of Kurama). Narutopedia:
// revived in the war, Minato enters Nine-Tails Chakra Mode (the golden cloak with black markings, the seal pattern on
// his back, the Fourth's haori); the Flying Thunder God lets him flash to any of his marked kunai; he teleported a whole
// Tailed Beast Ball away and fought beside his son. Here: Minato throws three of his three-pronged kunai in a fan round
// the target; the golden cloak flares over him; then he is everywhere at once: a flash at each kunai, a Rasengan
// driven into the target from that side every time (left, above, behind), each flash leaving a golden afterimage; he
// lands back at his own spot as the three Rasengan burst together in a golden sphere; the kunai fly back to him.
// New: the three-pronged kunai with their seal tags, the flash-teleports with afterimages, the triple Rasengan burst;
// the KCM cloak via drawOutline; ULTIMATE staging; one impact frame (bolts in gold).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure, drawOutline, drawRasengan, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultSky, ultBanner, ultStreaks, frameOf } from "./_ultimate.js";

const THROW = 0.45, STUCK = 0.75, CLOAK = 1.0, F1 = 1.6, F2 = 1.95, F3 = 2.3, HOME = 2.6, BURST = 2.75, RECALL = 3.6, END = 4.6, TX = 170;
const GOLD = ["#5a2a06", "#c86a10", "#ff9a1c", "#ffc830", "#fff0a0"].map(hex), RAS = ["#0a3a7a", "#2a8ae0", "#8fd0ff", "#e8f8ff", "#ffffff"].map(hex);
// where the three kunai land: before, above and behind the target
const KUN = [[TX - 30, -2, -0.4], [TX + 6, -70, 1.6], [TX + 34, -2, -2.7]];

export const meta = {
  name: "Nine-Tails chakra mode: Flying Thunder God",
  desc: "ULTIMATE. Minato in Kurama's golden cloak throws three marked kunai round the target, then flashes to each in turn, driving a Rasengan in from every side, and lands home as all three burst together in a golden sphere.",
  tags: ["jutsu", "ultimate", "minato", "hiraishin", "kurama", "rasengan", "space-time", "multi-hit", "one-shot"],
  size: [320, 210],
  origin: [56, 180],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#5a2a06", "#c86a10", "#ff9a1c", "#ffc830", "#fff0a0"], seed: 170 },
};

const THROWP = { ...READY, crouch: 5, lean: 10, fx: 24, fy: -30, bx: -6, by: -20, ffx: 12, fbx: -10 };
const DRIVE = { ...READY, crouch: 8, lean: 16, fx: 22, fy: -24, bx: -6, by: -18, ffx: 14, fbx: -12, gait: false };
const HOLD = { ...READY, crouch: 5, fx: 12, fy: -26, bx: -4, by: -20, ffx: 9, fbx: -9 };
export const act = {
  target: { x: TX },
  ghost: "#ffc830",
  poses: [
    [-0.25, READY],
    [THROW, THROWP, "out"],
    [CLOAK, HOLD, "out"],
    [F1 - 0.02, HOLD],
    // each flash: he is there, already driving the Rasengan in
    [F1, { ...DRIVE, x: KUN[0][0] - 16 }, "snap"],
    [F2, { ...DRIVE, x: KUN[1][0] - 14, y: -50, lean: 40, ffy: -6, fby: -6 }, "snap"],
    [F3, { ...DRIVE, x: KUN[2][0] + 16, face: -1 }, "snap"],
    [HOME, { ...HOLD, x: 0, gait: false }, "snap"],
    [END, READY],
  ],
  hits: [
    { t: THROW, target: false, sfx: "whoosh" },
    { t: CLOAK, stop: 0.08, shake: 0.5, amp: 2, target: false, sfx: "cast" },
    ...[F1, F2, F3].map((h, i) => ({ t: h + 0.03, stop: 0.08, shake: 0.4, amp: 3, push: i === 2 ? -3 : 3, straw: 18, sfx: "punch" })),
    { t: BURST, stop: 0.28, shake: 1.2, amp: 7, push: 8, straw: 60, flash: 0.08, sfx: "explosion" },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  // a three-pronged kunai with its seal tag, at (x, y) pointing at angle a
  const kunai = (p, x, y, a, k = 1) => {
    const c = Math.cos(a), s = Math.sin(a), at = (u, v) => [x + c * u - s * v, y + s * u + c * v];
    p.beam(...at(-7, 0), ...at(4, 0), 1.6, hex("#5a5a68"), k);
    p.tri(...at(4, -2.5), ...at(4, 2.5), ...at(9, 0), hex("#c8ccd8"), k);
    p.line(...at(3, -2.5), ...at(5, -4.5), hex("#c8ccd8"), k); p.line(...at(3, 2.5), ...at(5, 4.5), hex("#c8ccd8"), k);
    p.ring(...at(-8, 0), 1.2, 1, hex("#5a5a68"), k);
    p.rect(at(-4, 0)[0] - 1, at(-4, 0)[1] + 1, 3, 4, hex("#f0e8d0"), k);
  };
  const flight = (i, t) => { const u = ease.outQuad(clamp((t - THROW) / (STUCK - THROW))), [x, y] = KUN[i]; return [16 + (x - 16) * u, -28 + (y + 28) * u - Math.sin(u * Math.PI) * 10]; };
  return {
    update(t, dt) {
      for (const [i, h] of [F1, F2, F3].entries()) if (t >= h) once("f" + i, () => { lights.add(TX, -26, 80, GOLD[3], 0.5, 0.2); for (let j = 0; j < 10; j++) ps.spawn(P.SPARK, TX, -26, R.range(-120, 120), R.range(-120, 60), R.range(0.15, 0.3), RAS[R.int(2, 4)]); });
      if (t >= BURST) once("b", () => lights.add(TX, -26, 200, GOLD[4], 0.9, 0.5));
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: CLOAK - 0.2, t1: END - 0.2, tone: "#0a0604", glow: "#3a2008" });
      const b = bodyAt(act.poses, t);
      if (t > CLOAK) { const k = smooth(CLOAK, CLOAK + 0.15, t); drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, GOLD[3], { w: 1, a: k, flick: t * 18 }); drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, GOLD[2], { w: 2, a: 0.6 * k, flick: t * 13 + 3 }); }
      // the afterimages left at each flash
      for (const [i, h] of [F1, F2, F3].entries()) if (t > h && t < h + 0.5) { const q = bodyAt(act.poses, h + 0.01).q; drawFigure(p, q, q.x ?? 0, q.y ?? 0, { tint: GOLD[3], k: 0.9, a: 0.6 * (1 - (t - h) / 0.5), face: q.face ?? 1 }); void i; }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      ultBanner(p, t, box, { t0: 0.05, name: "HIRAISHIN: KYUUBI MODE", hold: 1.0, color: "#ffc830" });
      drawBadge(p, t, { kind: "hiraishin", t0: 0.1, t1: THROW, label: "HIRAISHIN", head: b.head });
      drawGlint(p, t, "kurama", CLOAK, END - 0.3, b.head);
      if (t > CLOAK) { const flare = t - CLOAK < 0.08; drawFigure(p, b.q, b.q.x ?? 0, b.q.y ?? 0, { tint: flare ? WHITE : GOLD[3], k: flare ? 0.9 : 0.55, face: b.q.face ?? 1 }); }
      // the kunai: flying out, stuck, glowing at each flash, then recalled
      for (let i = 0; i < 3; i++) {
        if (t < THROW || t > RECALL + 0.3) continue;
        let [x, y] = t < STUCK ? flight(i, t) : KUN[i];
        if (t > RECALL) { const u = ease.inQuad((t - RECALL) / 0.3); x += (0 - x) * u; y += (-26 - y) * u; }
        kunai(p, x, y, KUN[i][2]);
        const h = [F1, F2, F3][i];
        if (t > h - 0.06 && t < h + 0.1) { p.glow(x, y, 20, GOLD[3], 0.8); p.text("*", x - 1, y - 8, GOLD[4], { font: "mini" }); }
      }
      // the Rasengan in his hand at each flash, left spinning in the target
      for (const [i, h] of [F1, F2, F3].entries()) {
        if (t < h - 0.02 || t > BURST + 0.05) continue;
        const k = Math.min(1, (t - h + 0.02) / 0.05), off = [[-10, 0], [0, -12], [10, 0]][i];
        drawRasengan(p, TX + off[0], -26 + off[1], 7, t, RAS, k);
      }
      if (t > F1 - 0.05 && t < HOME) ultStreaks(p, t, box, 0.6, 1, GOLD[4]);
      // the burst: the three spheres merge into one golden-white sphere that swells and breaks
      if (t > BURST && t < BURST + 0.8) { const v = clamp((t - BURST) / 0.8), r = 14 + 50 * ease.outCubic(v); p.glow(TX, -26, r * 1.8, GOLD[3], 0.6 * (1 - v)); p.disc(TX, -26, r, (d) => (d < 0.5 ? RAS[4] : d < 0.8 ? RAS[3] : GOLD[3]), 0.8 * (1 - v)); p.ring(TX, -26, r + 4, 2, GOLD[4], 1 - v); }
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= BURST && t < BURST + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -26, false, 170, { style: "bolts", ink: hex("#1a0c02"), paper: hex("#fff4d0"), lines: 30 });
      void rand; void noise2; void TAU;
    },
  };
});

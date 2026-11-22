// ULTIMATE: Kyuudou Gudoudama (Expansive Truth-Seeking Ball, Kaguya Ootsutsuki). Narutopedia: Kaguya gathers the chakra
// of the Ten-Tails into one vast Truth-Seeking Ball, black and shimmering, which, released, expands to erase
// everything in its radius; she meant it to wipe out all her enemies at once. Her look: white hair to the floor, the
// Byakugan with the Rinne Sharingan on her brow, two horns. Here: Kaguya floats, her hair streaming, the third eye
// opening; she raises a hand and a small black orb appears over her palm, swelling as dark chakra spirals into it
// from all round; it grows to an enormous sphere hanging over the field, its surface crawling with grey-violet light;
// she lets it fall: it drops onto the target and expands in silence, a black dome swallowing everything, its rim
// dissolving the floor to ash; then it shrinks away to nothing, leaving a smooth scar of erased ground.
// New: the expansive ball (crawling surface, the silence, the erasing rim), the hair; ULTIMATE staging; one impact
// frame (rings, inverted to near black).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultSky, ultBanner, frameOf } from "./_ultimate.js";

const RISE = 0.3, EYE = 0.7, ORB = 1.1, BIG = 2.6, DROP = 2.9, LAND = 3.25, EXP = 3.9, SHRINK = 4.5, END = 5.6, TX = 200;
const BLK = ["#020104", "#0a0810", "#1a1622", "#3a3448", "#7a6aa0", "#c8bce8"].map(hex), HAIR = hex("#f0eef8"), ASH = hex("#c8c4cc");

export const meta = {
  name: "Expansive truth-seeking ball",
  desc: "ULTIMATE. Kaguya floats, her third eye opening; a black orb over her palm swells into an enormous sphere of Ten-Tails chakra, drops onto the target and expands in silence into a black dome that erases everything, then shrinks to nothing.",
  tags: ["jutsu", "ultimate", "kaguya", "ootsutsuki", "truth-seeking-ball", "aoe", "one-shot"],
  size: [380, 270],
  origin: [60, 240],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#020104", "#1a1622", "#3a3448", "#7a6aa0", "#c8bce8"], seed: 177 },
};

const FLOAT = { ...READY, y: -26, crouch: 1, lean: -2, fx: 6, fy: -20, bx: -6, by: -20, ffx: 3, ffy: -5, fbx: -3, fby: -5, gait: false };
const HOLDUP = { ...FLOAT, fx: 10, fy: -46, lean: -4 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE + 0.4, FLOAT, "out"],
    [ORB, HOLDUP, "out"],
    [DROP, HOLDUP],
    [DROP + 0.25, { ...FLOAT, fx: 16, fy: -30, lean: 6 }, "out"],
    [END, FLOAT],
  ],
  hits: [
    { t: EYE, stop: 0.08, target: false, sfx: "cast" },
    { t: ORB, target: false, sfx: "cast" },
    { t: BIG, stop: 0.1, shake: 0.6, amp: 2, target: false, sfx: "rumble" },
    { t: LAND, stop: 0.4, shake: 0.2, amp: 1, push: 0, straw: 40, flash: 0, skin: "shadow" },
    { t: SHRINK, stop: 0.1, shake: 0.6, amp: 3, target: false, sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// erased: gone inside the dome, back only as the dome shrinks (a training dummy survives)
export const targetState = (t) => (t > LAND + 0.1 && t < SHRINK + 0.3 ? { a: 0 } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  const orbAt = (t) => {
    const b = bodyAt(act.poses, Math.min(t, DROP)), [hx, hy] = b.handN, r = t < ORB ? 0 : 3 + 52 * ease.inOutQuad(smooth(ORB, BIG, t));
    const home = [hx + 6, hy - r - 6];
    if (t < DROP) return [home[0], home[1], r];
    const u = ease.inQuad(clamp((t - DROP) / (LAND - DROP))); return [home[0] + (TX - home[0]) * u, home[1] + (-r - home[1]) * u, r];
  };
  const domeR = (t) => (t < LAND ? 0 : 55 + 150 * ease.outCubic(smooth(LAND, EXP, t))) * (1 - ease.inCubic(smooth(SHRINK, SHRINK + 0.5, t)));
  return {
    update(t, dt) {
      if (t > ORB && t < BIG) for (let n = 0; n < 2; n++) if (R.chance(70 * dt)) { const [x, y] = orbAt(t), a = R.range(0, TAU), d = R.range(60, 120); ps.spawn(P.STREAK, x + Math.cos(a) * d, y + Math.sin(a) * d, -Math.cos(a) * 200, -Math.sin(a) * 200, 0.3, R.chance(0.7) ? BLK[3] : BLK[5]); }
      if (t > EXP && t < SHRINK && R.chance(40 * dt)) ps.spawn(P.DUST, TX + R.range(-200, 200), -R.range(0, 10), 0, -R.range(10, 40), R.range(0.8, 1.4), ASH);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: RISE, t1: END - 0.1, tone: "#040208", glow: "#1a1428", k: 0.8 });
      // the hair: a white mane streaming down far past her feet
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      for (let i = 0; i < 12; i++) { const sx = hx - 4 + i * 0.6, wav = Math.sin(t * 2 + i * 0.5) * 3; p.beam(sx, hy - 3, sx - 10 + wav, hy + 40 + (i % 4) * 5, 1.6, i % 3 ? HAIR : hex("#c8c4d8")); }
      // the scar of erased ground the dome leaves
      if (t > SHRINK) p.ellipse(TX, 1, 150, 4, hex("#08060c"), 1 - smooth(END - 0.6, END, t));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      ultBanner(p, t, box, { t0: 0.05, name: "KYUUDOU GUDOUDAMA", hold: 1.0, color: "#c8bce8" });
      drawBadge(p, t, { kind: "byakugan", t0: 0.1, t1: RISE, label: "OOTSUTSUKI", head: b.head });
      drawGlint(p, t, "byakugan", RISE, END - 0.3, b.head);
      // the horns and the third eye on her brow, opening
      p.tri(hx - 3, hy - 4, hx - 1, hy - 4, hx - 4, hy - 9, HAIR); p.tri(hx + 1, hy - 4, hx + 3, hy - 4, hx + 4, hy - 9, HAIR);
      if (t > EYE) { const k = smooth(EYE, EYE + 0.2, t); p.ellipse(hx + 1, hy - 3.5, 1.8, 1.2 * k, hex("#c01a24")); p.px(hx + 1, hy - 3.5, BLK[0]); }
      // the orb: black, its surface crawling with grey-violet light
      if (t > ORB && t < LAND) {
        const [x, y, r] = orbAt(t);
        p.glow(x, y, r * 1.6, BLK[4], 0.35);
        p.shade(x - r - 1, y - r - 1, x + r + 1, y + r + 1, (px, py, out) => { const dx = (px - x) / r, dy = (py - y) / r, d = Math.hypot(dx, dy); if (d > 1) return; const n = noise2(dx * 3 + t, dy * 3 - t * 0.7, 101); if (d > 0.93) return BLK[4]; return n > 0.45 ? BLK[3] : n > 0.1 ? BLK[2] : BLK[0]; });
      }
      // the dome: expanding without a sound, black, its rim dissolving the floor to ash
      const Rd = domeR(t);
      if (Rd > 1) {
        p.shade(TX - Rd - 2, -Rd - 2, TX + Rd + 2, 1, (x, y, out) => {
          const d = Math.hypot(x - TX, y) / Rd;
          if (d > 1 || y > 0) return;
          const n = noise2((x - TX) * 0.05 + t, y * 0.05, 102);
          if (d > 0.96) return rand(x | 0, (y | 0) + Math.floor(t * 20)) > 0.4 ? ASH : 0;
          return n > 0.5 ? BLK[3] : d > 0.85 ? BLK[2] : BLK[0];
        });
      }
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= LAND && t < LAND + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -10, true, 177, { style: "rings", ink: hex("#020104"), paper: hex("#e8e4f0"), lines: 16 });
      void WHITE;
    },
  };
});

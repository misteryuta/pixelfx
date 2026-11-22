// ULTIMATE: Kuchiyose: Manda (Summoning: Manda, Orochimaru). Narutopedia: Manda, the boss of the snakes, a gigantic
// purple serpent with a ridge of horns down his back, cruel slit eyes and a fierce temper; he demands a hundred
// sacrifices for every summoning; Orochimaru rides on his head. Here: Orochimaru bites his thumb, the seals, the palm
// slammed down: the formula spreads and a tower of smoke bursts up; out of it rears Manda, colossal and purple, coils
// piling behind him, Orochimaru on his head, his long tongue flickering; the head draws back, hisses, and strikes:
// the jaws slam down onto the target and the ground, coils lashing round after it, the tail whipping across; Manda
// lifts his head with the target in his jaws and hurls it away, then sinks back into the smoke.
// New: Manda (scaled purple body, horn ridge, the head with slit eyes, fangs and forked tongue, the coils), the strike;
// ULTIMATE staging; one impact frame (shards in violet).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof, drawFigure, impactFrame, sealRun, drawSeals } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultSky, ultBanner, frameOf } from "./_ultimate.js";

const SEALS = sealRun(0.1, ["i", "inu", "tori", "saru", "hitsuji"], 0.08, { hold: 0.15 });
const SLAM = SEALS.end + 0.15, SMOKE = SLAM + 0.2, REAR = SMOKE + 0.15, REARED = REAR + 0.7, COCK = REARED + 0.35, STRIKE = COCK + 0.25, HIT = STRIKE + 0.12, LIFT = HIT + 0.55, TOSS = LIFT + 0.4, SINK = TOSS + 0.5, END = SINK + 0.8, TX = 220;
const PURP = ["#1a0a24", "#3a1a4a", "#5a2a6e", "#7a4a90", "#a87ac0"].map(hex), BELLY = hex("#c8b0a0"), EYE = hex("#ffd040"), MX = 30;

export const meta = {
  name: "Summoning: Manda",
  desc: "ULTIMATE. Orochimaru summons Manda, the colossal purple snake boss, riding on his head; Manda rears out of the smoke, strikes down onto the target with his jaws, lifts it and hurls it away, then sinks back into the smoke.",
  tags: ["jutsu", "ultimate", "orochimaru", "summon", "snake", "melee", "one-shot"],
  size: [380, 270],
  origin: [70, 240],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0a24", "#3a1a4a", "#5a2a6e", "#7a4a90", "#a87ac0"], seed: 175 },
};

const SLAMP = { ...READY, crouch: 14, lean: 14, fx: 15, fy: -2, bx: 6, by: -14, ffx: 10, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SLAM, SLAMP, "in"],
    [END, SLAMP],
  ],
  hits: [
    { t: SLAM, stop: 0.06, shake: 0.3, amp: 2, target: false, sfx: "step" },
    { t: SMOKE, stop: 0.1, shake: 1.0, amp: 4, target: false, sfx: "explosion" },
    { t: REARED, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.3, shake: 1.4, amp: 8, push: 0, straw: 60, flash: 0.08, sfx: "heavy" },
    { t: TOSS, stop: 0.08, shake: 0.4, amp: 3, push: 0, straw: 20, sfx: "whoosh" },
    { t: SINK, shake: 0.8, amp: 3, target: false, sfx: "rumble" },
  ],
};
// Orochimaru rides Manda's head from the smoke on; the target is seized in the jaws, lifted, hurled away
export const actorAlpha = (t) => (t > SMOKE + 0.05 && t < SINK + 0.3 ? 0 : 1);
export const targetState = (t) => {
  if (t < HIT) return null;
  if (t < LIFT) return { dy: 0, rot: -0.2 };
  if (t < TOSS) { const u = smooth(LIFT, TOSS, t); return { dy: -70 * u, rot: -0.2 - u, dx: -10 * u }; }
  const u = clamp((t - TOSS) / 0.6); return { dy: -70 + 70 * u * u, dx: -10 + 90 * u, rot: -1.2 - u * 6 };
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  // Manda's head position over time: rearing out of the smoke, cocking back, striking down onto the target, lifting
  const headAt = (t) => {
    const r = ease.outBack(smooth(REAR, REARED, t), 1.2), base = [MX + 40, -30 - 120 * r];
    if (t < COCK) return [base[0] + Math.sin(t * 3) * 4, base[1] + Math.cos(t * 2.4) * 3, -0.2];
    if (t < STRIKE) { const u = smooth(COCK, STRIKE, t); return [base[0] - 26 * u, base[1] - 16 * u, -0.5 * u - 0.2]; }
    if (t < HIT) { const u = ease.inCubic((t - STRIKE) / (HIT - STRIKE)); return [base[0] - 26 + (TX - 30 - base[0] + 26) * u, base[1] - 16 + (-24 - base[1] + 16) * u, -0.7 + 1.3 * u]; }
    if (t < LIFT) return [TX - 30, -24, 0.6];
    if (t < TOSS) { const u = smooth(LIFT, TOSS, t); return [TX - 30 - 20 * u, -24 - 80 * u, 0.6 - 1 * u]; }
    const u = ease.inCubic(smooth(SINK, END, t)); return [TX - 50 - 60 * u, -104 + 120 * u, -0.4];
  };
  return {
    update(t, dt) {
      if (t >= SMOKE && !this.s) { this.s = 1; for (let i = 0; i < 30; i++) ps.spawn(P.SMOKE, MX + R.range(-60, 60), -R.range(4, 120), R.range(-40, 40), -R.range(4, 30), R.range(0.8, 1.4), hex("#e6e8f0"), R.range(5, 10)); }
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -20, 140, PURP[4], 0.6, 0.4); for (let i = 0; i < 24; i++) ps.spawn(P.GRIT, TX + R.range(-30, 30), -1, R.range(-200, 200), -R.range(80, 240), R.range(0.5, 1), hex("#5a5068")); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: SEALS.end - 0.2, t1: END - 0.2, tone: "#08040c", glow: "#2a1240" });
      // the body: a thick chain from the coils piled behind him up to the head, scaled, the horn ridge along its back
      if (t > REAR && t < END) {
        const [hx, hy, ha] = headAt(t), k = 1 - smooth(SINK + 0.4, END, t);
        // the coils piled on the ground behind
        for (let i = 0; i < 3; i++) p.ellipse(MX - 30 + i * 10, -10 - i * 14, 70 - i * 14, 14, i % 2 ? PURP[2] : PURP[3], k);
        let px = MX - 10, py = -40;
        for (let s = 1; s <= 24; s++) {
          const u = s / 24, mx = (MX - 10 + hx) / 2 - 40, my = (-40 + hy) / 2 - 30;
          const x = (1 - u) ** 2 * (MX - 10) + 2 * (1 - u) * u * mx + u * u * hx, y = (1 - u) ** 2 * -40 + 2 * (1 - u) * u * my + u * u * hy, w = 26 - 10 * u;
          p.beam(px, py, x, y, w + 2, PURP[0], k); p.beam(px, py, x, y, w, s % 2 ? PURP[3] : PURP[2], k);
          // belly scales along the underside, horns along the top
          const a = Math.atan2(y - py, x - px), nx = -Math.sin(a), ny = Math.cos(a);
          p.line(x + nx * w * 0.4, y + ny * w * 0.4, px + nx * w * 0.4, py + ny * w * 0.4, BELLY, 0.7 * k);
          if (s % 2 === 0) p.tri(x - nx * w * 0.45 - 2, y - ny * w * 0.45, x - nx * w * 0.45 + 2, y - ny * w * 0.45, x - nx * (w * 0.45 + 7), y - ny * (w * 0.45 + 7), PURP[1], k);
          px = x; py = y;
        }
      }
      drawPoof(p, MX, -60, t - SMOKE, 4.5, 3);
      drawPoof(p, MX + 40, -20, t - SINK, 4, 8);
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      ultBanner(p, t, box, { t0: 0.05, name: "KUCHIYOSE: MANDA", hold: 0.9, color: "#a87ac0" });
      drawBadge(p, t, { kind: "snake", t0: 0.1, t1: SEALS.end, label: "KUCHIYOSE", head: b.head });
      drawSeals(p, t, SEALS, PURP);
      if (t > SEALS.end - 0.1 && t < SLAM) p.px(b.handN[0], b.handN[1], hex("#e01828"));
      // the head: a broad wedge with slit eyes and a brow horn, the jaws opening on the strike, fangs, the forked tongue
      if (t > REAR && t < END) {
        const [hx, hy, ha] = headAt(t), k = 1 - smooth(SINK + 0.4, END, t), c = Math.cos(ha), s = Math.sin(ha), at = (u, v) => [hx + (c * u - s * v) * 1.7, hy + (s * u + c * v) * 1.7];
        const jaw = t > COCK + 0.1 && t < LIFT + 0.3 ? 1 : 0.15;
        p.poly([at(-14, -10), at(18, -8), at(30, -2), at(18, 4), at(-14, 8)], PURP[3], k);
        p.poly([at(-12, 6), at(26, 4 + jaw * 14), at(14, 10 + jaw * 8), at(-12, 10)], PURP[2], k);
        if (jaw > 0.5) { p.poly([at(-4, 4), at(26, 1), at(24, 4 + jaw * 12), at(-4, 8)], hex("#3a0a18"), k); p.tri(...at(20, 1), ...at(22, 1), ...at(21, 7), WHITE, k); p.tri(...at(20, 4 + jaw * 12), ...at(22, 4 + jaw * 12), ...at(21, jaw * 8), WHITE, k); }
        p.line(...at(-10, -10), ...at(10, -7), PURP[1], k);
        p.ellipse(...at(8, -5), 3, 1.6, EYE, k); p.line(...at(8, -6.5), ...at(8, -3.5), PURP[0], k);
        p.tri(...at(-2, -10), ...at(4, -9), ...at(-8, -20), PURP[4], k);
        // the forked tongue flickering out while he rears
        if (t < COCK && Math.floor(t * 8) % 3 === 0) { const [tx, ty] = at(30, 0); p.line(tx, ty, tx + 8, ty, hex("#c01a2a"), k); p.line(tx + 8, ty, tx + 11, ty - 2, hex("#c01a2a"), k); p.line(tx + 8, ty, tx + 11, ty + 2, hex("#c01a2a"), k); }
        // Orochimaru standing on his head
        if (t < SINK + 0.3) { const [ox, oy] = at(-4, -10); drawFigure(p, { ...READY, crouch: 2, fx: 6, fy: -24, bx: -4, by: -20 }, ox, oy, { a: k }); }
      }
      if (t > HIT && t < HIT + 0.3) { const v = (t - HIT) / 0.3; p.ellipse(TX - 10, 0, 20 + 80 * v, 4 + 6 * v, (d) => (d > 0.85 ? PURP[4] : 0), 1 - v); }
      void rand; void noise2; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= HIT && t < HIT + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX - 10, -20, true, 175, { style: "shards", ink: hex("#0c0414"), paper: hex("#f0e4f8"), lines: 30 });
    },
  };
});

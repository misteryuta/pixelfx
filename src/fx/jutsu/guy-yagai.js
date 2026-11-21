// Hachimon Tonkou: Shimon, Yagai (Eight Gates: Gate of Death, Night Guy). Narutopedia: opening the eighth gate turns
// Guy's blood to a red steam that pours off him; his last technique, Night Guy, is a single kick whose path bends space
// itself into the shape of a dragon, so strong it nearly killed Madara; it burns his body to ash. Here: he stands still
// and the eighth gate opens: his heart beats once, loud; blood-red steam bursts off him in a pillar, his skin turns red,
// the floor round him cracks from the heat; he drops into his stance; then he is gone, a red trail curving up and down
// through the air in the shape of a dragon's body, space rippling along it; the kick lands on the target with the
// dragon's head: the world goes dark and still for an instant, then red; a shockwave that bends the frame; he lands
// behind, the steam pouring off him, his legs smoking.
// New: the eighth gate's red steam, the dragon-shaped path with warped space along it, the stillness before the hit.
// From _lib: drawGates' outline, the warp, the impact frame, the turned figure.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawOutline, drawFigure, drawFigureTurned, warp, impactFrame, veil } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 190, BEAT = 0.4, GATE8 = 0.6, STANCE = 1.3, GO = 1.6, HIT = 2.1, STILL = 2.14, BURST = 2.35, END = 4.2;
const RED = ["#1a0204", "#4a0608", "#9a1010", "#e02a1a", "#ff7a4a", "#ffd0b0"].map(hex);
const LANDX = TX + 46;
// the dragon's path: from his stance up in a long S through the air and down onto the target
const path = (u) => {
  const x = 10 + (TX - 10) * u, y = -24 - 70 * Math.sin(u * Math.PI) + 26 * Math.sin(u * Math.PI * 3) * (1 - u);
  return [x, y];
};

export const meta = {
  name: "Eight gates: night guy",
  desc: "Might Guy opens the eighth gate: one loud heartbeat, a pillar of blood-red steam, red skin; then a single kick whose path bends space into a dragon, landing on the target in a moment of black stillness, then red.",
  tags: ["jutsu", "guy", "eight-gates", "taijutsu", "kick", "ultimate", "one-shot"],
  size: [330, 220],
  origin: [60, 186],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0204", "#4a0608", "#9a1010", "#e02a1a", "#ff7a4a", "#ffd0b0"], seed: 8 },
};

const STAND = { ...READY, crouch: 2, fx: 8, fy: -22, bx: -6, by: -20, ffx: 7, fbx: -7 };
const LOW = { ...READY, crouch: 14, lean: 12, fx: 12, fy: -14, bx: -10, by: -20, ffx: 12, fbx: -14 };
const LANDP = { ...READY, x: LANDX, face: -1, crouch: 13, lean: 6, fx: 10, fy: -12, bx: -12, by: -22, ffx: 12, fbx: -12, gait: false };
export const act = {
  target: { x: TX },
  ghost: "#ff7a4a",
  poses: [
    [-0.25, READY],
    [BEAT, STAND, "out"],
    [STANCE, STAND],
    [GO - 0.05, LOW, "out"],
    [HIT + 0.3, { ...LANDP, crouch: 15 }, "snap"],
    [END - 0.6, LANDP],
    [END, { ...LANDP, crouch: 6 }],
  ],
  hits: [
    { t: BEAT, stop: 0.12, shake: 0.4, amp: 2, target: false, sfx: "heavy" },
    { t: GATE8, stop: 0.08, shake: 1.6, amp: 3, target: false, sfx: "rumble" },
    { t: GO, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.4, shake: 0, amp: 0, push: 0, straw: 0, flash: 0, target: false, sfx: "clash" },
    { t: BURST, stop: 0.2, shake: 1.6, amp: 10, push: 10, straw: 90, skin: "red", shiver: 1, sfx: "explosion" },
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: GATE8, x: 0, n: 20, dir: -1 }, { t: GATE8, x: 0, n: 20, dir: 1 }, { t: BURST, x: TX - 30, n: 26, dir: -1 }, { t: BURST, x: TX + 40, n: 26, dir: 1 }],
};
// in flight he is the kick on the path (drawn below), not standing anywhere
export const actorAlpha = (t) => (t > GO && t < HIT + 0.3 ? 0 : 1);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const KICK = { ...READY, crouch: 0, lean: -10, fx: -6, fy: -24, bx: -10, by: -28, ffx: 18, ffy: -22, fbx: -6, fby: -6, gait: false };
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t), on = t > GATE8 ? 1 : 0;
      // the red steam pouring up off him
      if (on && R.chance(70 * dt)) {
        const [x, y] = t > GO && t < HIT + 0.3 ? path(clamp((t - GO) / (HIT - GO))) : [b.chest[0], b.chest[1]];
        ps.spawn(P.SMOKE, x + R.range(-8, 8), y + R.range(-10, 14), R.range(-10, 10), -R.range(30, 70), R.range(0.5, 1), RED[R.int(2, 4)], R.range(1.5, 3));
      }
      if (t >= GATE8 && !this.g) { this.g = 1; lights.add(0, -30, 200, RED[3], 1, 0.6); }
      if (t >= BURST && !this.b) { this.b = 1; lights.add(TX, -30, 300, RED[4], 1, 0.7); for (let i = 0; i < 40; i++) { const a = R.range(0, TAU), s = R.range(120, 380); ps.spawn(P.STREAK, TX, -30, Math.cos(a) * s, Math.sin(a) * s * 0.6, R.range(0.15, 0.4), R.chance(0.5) ? RED[5] : RED[3]); } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), k = smooth(GATE8, GATE8 + 0.15, t) * (1 - smooth(END - 0.6, END, t));
      // the pillar of red steam bursting up at the gate's opening
      if (t > GATE8 && t < GO) {
        const u = clamp((t - GATE8) / 0.5), kk = 1 - smooth(STANCE, GO, t);
        p.shade(-30, -200, 34, 2, (x, y, out) => { const w = 10 + 8 * u + 6 * noise2(y * 0.05 - t * 6, 1, 3); if (Math.abs(x - 2) > w || y < -200 * u) return; out.a = kk > 0.5 ? 1 : 0.5; return noise2(x * 0.2, y * 0.1 + t * 10, 4) > 0.2 ? RED[3] : RED[2]; });
      }
      // the outline of red chakra and the heat cracks in the floor while he stands in it
      if (k > 0 && actorAlpha(t)) drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, RED[3], { w: 2, a: k, flick: t * 18 });
      if (t > GATE8 && t < GO + 0.3) for (let i = 0; i < 6; i++) { const a = Math.PI + (i / 5) * Math.PI; p.line(2, 0, 2 + Math.cos(a) * 30, Math.sin(a) * 2, RED[2], 1 - smooth(GO, GO + 0.3, t)); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 20);
      drawBadge(p, t, { kind: "gate", t0: 0.04, t1: BEAT, label: "SHIMON", head: b.head });
      // the heartbeat: one hard ring off his chest
      if (t > BEAT && t < BEAT + 0.3) { const u = (t - BEAT) / 0.3; p.ring(b.chest[0], b.chest[1], 4 + 40 * u, 2, RED[4], 1 - u); }
      // his skin red once the gate is open
      if (t > GATE8 && actorAlpha(t)) drawFigure(p, b.q, b.q.x ?? 0, b.q.y ?? 0, { tint: RED[3], k: 0.4 });
      // the flight: the dragon's body along his path, space rippling, the red trail; him at its head, the leg out
      if (t > GO && t < BURST + 0.6) {
        const u = clamp((t - GO) / (HIT - GO)), kk = 1 - smooth(BURST, BURST + 0.6, t);
        let prev = path(0);
        for (let i = 1; i <= 40 * u; i++) {
          const q = path(i / 40), w = 6 + 4 * Math.sin(i * 0.5 + t * 20);
          p.beam(prev[0], prev[1], q[0], q[1], w, RED[2], 0.7 * kk);
          p.beam(prev[0], prev[1], q[0], q[1], w * 0.4, RED[4], kk);
          // the scales of the dragon along the trail
          if (i % 3 === 0) p.arc(q[0], q[1], w, 1, -2.4, -0.7, RED[5], 0.6 * kk);
          prev = q;
        }
        if (t < HIT) {
          const [x, y] = path(u), [x2, y2] = path(Math.min(1, u + 0.02)), a = Math.atan2(y2 - y, x2 - x);
          warp(p, x, y, 26, 1.4, 0.2);
          drawFigureTurned(p, KICK, x - 4, y + 24, x, y, a, { tint: RED[3], k: 0.4 });
          // the dragon's head round him: horns, a jaw
          p.tri(x + 10, y - 10, x + 2, y - 4, x - 8, y - 22, RED[3], 0.7);
          p.tri(x + 12, y + 6, x + 22, y + 2, x + 6, y + 12, RED[3], 0.7);
        }
      }
      // the stillness: the world goes black and silent for an instant, only the two figures white
      if (t >= HIT && t < STILL + 0.2) impactFrame(p, -60, -186, 270, 34, TX, -30, true, 31, { style: "rings", ink: hex("#000000"), paper: hex("#ffffff"), lines: 0 });
      if (t >= STILL + 0.2 && t < BURST) veil(p, -60, -186, 270, 34, RED[2], 0.7);
      // then red: the shockwave bending the frame
      if (t > BURST && t < BURST + 0.6) {
        const u = (t - BURST) / 0.6;
        warp(p, TX, -30, 40 + 120 * u, 0.6 * (1 - u), 0.5 * (1 - u));
        p.ring(TX, -30, 20 + 160 * ease.outCubic(u), 3, RED[4], 1 - u);
        p.glow(TX, -30, 120, RED[3], 0.8 * (1 - u));
      }
      // his legs smoking when he has landed
      if (t > HIT + 0.3) for (let i = 0; i < 2; i++) p.px(b.footN[0] + (rand(f, i) - 0.5) * 4, b.footN[1] - 4 - ((t * 20 + i * 5) % 10), RED[1]);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

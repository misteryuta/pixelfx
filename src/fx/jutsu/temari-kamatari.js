// Kuchiyose: Kirikiri Mai (Summoning: Blade Dance, Temari). Narutopedia: Temari bites her thumb, smears the blood along
// her giant fan, and swings it to summon Kamatari, a one-eyed weasel carrying a large sickle; it rides the gust she
// makes and cuts everything caught in the wind to pieces, a whirlwind full of blades; then it vanishes. Here: her
// iron fan opens moon by moon (three moons on it, the third now showing); she smears blood across it, the summoning
// script; one huge two-handed swing: a poof in the wind and Kamatari appears riding the gust, a small white weasel with
// an eye patch on a giant sickle; the gust becomes a towering whirlwind round the target, the weasel streaking round
// and through it, every pass a white crescent slash; the target is lifted and cut; the wind drops and the weasel is
// gone in a puff.
// New: the fan (spread, moons), the blood stroke, the weasel and its sickle, the whirlwind of slashes.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const OPEN = 0.35, BITE = 0.7, SMEAR = 0.85, SWING = 1.3, SUMMON = 1.4, TWIST = 1.6, CUTS = 1.8, LIFT = 2.0, DROP = 3.3, END = 4.3, TX = 180;
const FAN = ["#1a1a22", "#3a3a48", "#5a5a6e", "#e8e4d8"].map(hex), MOON = hex("#7a5ab0"), BLOOD = hex("#c01a2a"), WEASEL = ["#5a4a3a", "#c8b8a0", "#f8f0e0"].map(hex), WIND = ["#6a8a90", "#a8d0d8", "#e8fbff"].map(hex);

export const meta = {
  name: "Summoning: blade dance",
  desc: "Temari: her iron fan spreads to its third moon, she smears blood across it and swings; Kamatari, the one-eyed weasel with its giant sickle, rides the gust into a towering whirlwind round the target, every pass a slash.",
  tags: ["jutsu", "temari", "wind", "summon", "slash", "aoe", "one-shot"],
  size: [300, 210],
  origin: [56, 180],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#6a8a90", "#a8d0d8", "#e8fbff", "#7a5ab0"], seed: 159 },
};

const HOLD = { ...READY, crouch: 4, lean: -2, fx: 6, fy: -26, bx: 10, by: -24, ffx: 8, fbx: -9 };
const WINDUP = { ...READY, crouch: 8, lean: -10, fx: -8, fy: -36, bx: -4, by: -36, ffx: 12, fbx: -11, twist: -3 };
const SWEEP = { ...READY, crouch: 9, lean: 14, fx: 24, fy: -20, bx: 20, by: -18, ffx: 15, fbx: -12, twist: 3 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, HOLD, "out"],
    [SMEAR, { ...HOLD, fx: 12, fy: -30 }, "out"],
    [SWING - 0.12, WINDUP, "out"],
    [SWING, SWEEP, "snap"],
    [DROP, SWEEP],
    [END, HOLD],
  ],
  hits: [
    { t: OPEN, target: false, sfx: "clash" },
    { t: SWING, stop: 0.05, shake: 0.4, amp: 2, target: false, sfx: "whoosh" },
    { t: SUMMON, target: false, sfx: "cast" },
    ...Array.from({ length: 9 }, (_, i) => ({ t: CUTS + i * 0.15, stop: 0.03, shake: 0.2, amp: 1, push: 0, straw: 10, flash: 0.02, sfx: i % 3 ? "whoosh" : "punch" })),
    { t: DROP, stop: 0.08, shake: 0.4, amp: 3, push: 4, straw: 20, sfx: "heavy" },
  ],
};
// lifted and turned in the whirlwind, dropped when it dies
export const targetState = (t) => (t > LIFT && t < DROP + 0.3 ? { dy: -18 * smooth(LIFT, LIFT + 0.4, t) * (1 - ease.inQuad(smooth(DROP, DROP + 0.3, t))) + Math.sin(t * 9) * 1.5, rot: Math.sin(t * 7) * 0.25 } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // Kamatari's path: riding the gust out to the target, then circling round and through the whirlwind
  const weasel = (t) => {
    if (t < TWIST) { const u = ease.outQuad(clamp((t - SUMMON) / (TWIST - SUMMON))); return [40 + (TX - 40) * u, -30 - 10 * Math.sin(u * Math.PI), 1]; }
    const a = (t - TWIST) * 12, h = -10 - ((t - TWIST) * 40) % 90;
    return [TX + Math.cos(a) * 26, h, Math.sin(a) > 0 ? 1 : -1, Math.cos(a)];
  };
  const wind = (p, t, side) => {
    const g = smooth(TWIST - 0.1, TWIST + 0.3, t) * (1 - smooth(DROP, DROP + 0.3, t)), H = 140 * g;
    for (let i = 0; i < 22; i++) {
      const y = -i * (H / 22), w = 10 + 1.8 * i * (H / 140) + Math.sin(t * 5 + i * 0.5) * 2, a0 = t * 9 + i * 0.7, a1 = a0 + 1.6 + rand(i, 3) * 1.2;
      // only the arc segments on this side (back: upper half of the ellipse; front: lower half)
      let pv = null;
      for (let a = a0; a < a1; a += 0.1) { const sy = Math.sin(a), pt = [TX + Math.cos(a) * w, y + sy * w * 0.2]; if (sy * side < 0) { pv = null; continue; } if (pv) p.line(pv[0], pv[1], pt[0], pt[1], i % 3 ? WIND[1] : WIND[2], 0.85); pv = pt; }
    }
};
  return {
    update(t, dt) {
      if (t > TWIST && t < DROP && R.chance(50 * dt)) ps.spawn(P.DUST, TX + R.range(-30, 30), -R.range(0, 10), R.range(-60, 60), -R.range(40, 160), R.range(0.4, 0.8), hex("#8a8494"));
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the back half of the whirlwind
      if (t > TWIST - 0.1 && t < DROP + 0.3) wind(p, t, -1);
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.handN;
      drawBadge(p, t, { kind: "temari", t0: 0.04, t1: OPEN, label: "KIRIKIRI MAI", head: b.head });
      // the fan: closed, then spreading moon by moon, held up, swung
      const spread = smooth(0.1, OPEN, t), a = Math.atan2(b.chest[1] - hy, b.chest[0] - hx) + Math.PI;
      const L = 30, A0 = a - 0.1, A1 = a - 0.1 - 1.4 * spread;
      p.poly([[hx, hy], [hx + Math.cos(A0) * L, hy + Math.sin(A0) * L], [hx + Math.cos((A0 + A1) / 2) * L * 1.04, hy + Math.sin((A0 + A1) / 2) * L * 1.04], [hx + Math.cos(A1) * L, hy + Math.sin(A1) * L]], FAN[3]);
      for (let i = 0; i <= 6; i++) { const aa = A0 + (A1 - A0) * (i / 6); p.line(hx, hy, hx + Math.cos(aa) * L, hy + Math.sin(aa) * L, FAN[2]); }
      p.arc(hx, hy, L, 1, Math.min(A0, A1), Math.max(A0, A1), FAN[0]);
      // three moons; the third shows only once the fan is fully open
      for (let m = 0; m < 3; m++) { if (spread < 0.35 + m * 0.3) continue; const aa = A0 + (A1 - A0) * (0.2 + m * 0.3); p.circle(hx + Math.cos(aa) * L * 0.72, hy + Math.sin(aa) * L * 0.72, 2.4, MOON); }
      // the blood smeared across it
      if (t > SMEAR) { const u = smooth(SMEAR, SMEAR + 0.25, t), aa = A0 + (A1 - A0) * u; p.arc(hx, hy, L * 0.5, 1, Math.min(A0, aa), Math.max(A0, aa), BLOOD); }
      if (t > BITE && t < SMEAR) p.px(b.handF[0], b.handF[1], BLOOD);
      // the gust off the swing, and Kamatari appearing in it
      if (t > SWING && t < TWIST + 0.2) { const u = clamp((t - SWING) / 0.4); for (let i = 0; i < 10; i++) { const y = -10 - i * 5, x = hx + u * (TX - hx); p.line(x - 30, y, x, y + Math.sin(i + t * 20) * 2, WIND[2], 1 - u); } }
      drawPoof(p, 50, -34, t - SUMMON + 0.05, 1, 6);
      if (t > SUMMON && t < DROP) {
        const [x, y, f] = weasel(t);
        // the sickle: a long handle and a big curved blade
        p.line(x - 8 * f, y + 6, x + 6 * f, y - 4, WEASEL[0]);
        p.arc(x + 6 * f, y - 4, 12, 2, f > 0 ? -2.6 : -0.5, f > 0 ? -0.6 : 1.5, hex("#d8dce8")); p.arc(x + 6 * f, y - 4, 13, 1, f > 0 ? -2.4 : -0.7, f > 0 ? -0.8 : 1.3, WHITE);
        // the weasel: a white body, a tail, ears, the eye patch
        p.ellipse(x - 2 * f, y, 5, 3, WEASEL[2]); p.ellipse(x - 8 * f, y + 1, 4, 1.5, WEASEL[1]); p.circle(x + 3 * f, y - 2, 2.5, WEASEL[2]);
        p.px(x + 2 * f, y - 5, WEASEL[1]); p.px(x + 4 * f, y - 3, hex("#1a1a22")); p.px(x + 5 * f, y - 2, hex("#c01a2a"));
      }
      // the front half of the whirlwind, and the slashes: a crescent on every pass through the target
      if (t > TWIST - 0.1 && t < DROP + 0.3) wind(p, t, 1);
      for (let i = 0; i < 9; i++) {
        const c0 = CUTS + i * 0.15, age = t - c0;
        if (age < 0 || age > 0.16) continue;
        const a = rand(i, 5) * TAU, cy = -30 + (rand(i, 6) - 0.5) * 30 + (t > LIFT ? -18 : 0);
        p.arc(TX, cy, 14, 2, a, a + 2.2, WHITE, 1 - age / 0.16);
        p.arc(TX, cy, 16, 1, a + 0.2, a + 2.0, WIND[1], 1 - age / 0.16);
      }
      drawPoof(p, TX, -60, t - DROP, 1, 11);
      void noise2;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

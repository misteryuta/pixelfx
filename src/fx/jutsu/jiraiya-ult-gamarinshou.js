// ULTIMATE: Senpou: Magen: Gamarinshou (Sage Art: Demonic Illusion: Toad Confrontation Chant; Jiraiya with Fukasaku
// and Shima). Narutopedia: the two elder toads on Jiraiya's shoulders sing a sonic genjutsu duet; whoever hears it is
// trapped in an illusion: they find themselves in a dark hall, bound to stone, facing four giant toad statues (two
// with swords) that tower over them, while in reality they stand frozen and helpless; Jiraiya then strikes the
// captive for real (against the Six Paths, the Toad Sword ran them through). Here: Sage Mode, the two toads on his
// shoulders draw breath and sing: rings of sound flow out over the target; the frame drops into the illusion: a dark
// hall, the target bound to a stone pillar, four colossal toad silhouettes rising round it, two raising swords; the
// swords fall; the illusion shatters back to the field: Jiraiya is already beside the frozen target with a giant
// Rasengan (Senpou: Oodama Rasengan) driving it away.
// New: the song (sound rings, notes), the illusion hall with the toad statues and their swords, the snap back;
// ULTIMATE staging; one impact frame (rings in toad green).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawRasengan, impactFrame, drawFigure } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultBanner, frameOf, ultSky } from "./_ultimate.js";

const SAGE = 0.3, SING = 0.9, IN = 1.7, BOUND = 2.0, STATUES = 2.3, SWORDS = 3.0, FALL = 3.35, OUT = 3.55, RASEN = 3.7, HIT = 3.95, END = 5.2, TX = 190;
const SHIMA = ["#3a2a4a", "#6a5a8a", "#a898c0"].map(hex), FUKA = ["#2a3a2a", "#5a7050", "#a0b088"].map(hex), NOTE = hex("#c8f0a0");
const HALL = ["#04060a", "#0c1218", "#1a242c", "#2e3a44"].map(hex), TOAD = ["#0a100c", "#1a2a1e", "#2e4434"].map(hex), RAS = ["#0a3a7a", "#2a8ae0", "#8fd0ff", "#e8f8ff", "#ffffff"].map(hex);

export const meta = {
  name: "Demonic illusion: toad confrontation chant",
  desc: "ULTIMATE. Jiraiya in Sage Mode: Fukasaku and Shima sing their genjutsu duet; the target finds itself bound in a dark hall under four colossal toad statues whose swords fall on it, and when the illusion breaks Jiraiya is already there driving a giant Rasengan into it.",
  tags: ["jutsu", "ultimate", "jiraiya", "sage-mode", "genjutsu", "toads", "rasengan", "one-shot"],
  size: [340, 250],
  origin: [56, 220],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a3a2a", "#5a7050", "#a0b088", "#c8f0a0"], seed: 174 },
};

const STAND = { ...READY, crouch: 4, lean: -2, fx: 6, fy: -22, bx: -4, by: -22, ffx: 9, fbx: -9 };
const DRIVE = { ...READY, crouch: 9, lean: 16, fx: 24, fy: -26, bx: 20, by: -24, ffx: 14, fbx: -12, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SAGE, STAND, "out"],
    [OUT, STAND],
    [RASEN, { ...DRIVE, x: TX - 30, crouch: 7, fx: 10, fy: -30, bx: 8, by: -30 }, "snap"],
    [HIT, { ...DRIVE, x: TX - 26 }, "in"],
    [END - 0.4, { ...DRIVE, x: TX - 30, lean: 6 }],
    [END, { ...STAND, x: TX - 30, gait: false }],
  ],
  hits: [
    { t: SAGE, target: false, sfx: "cast" },
    { t: SING, target: false, sfx: "cast" },
    { t: IN, stop: 0.1, push: 0, straw: 6, flash: 0, sfx: "rumble" },
    { t: FALL, stop: 0.12, shake: 0.6, amp: 4, push: 0, straw: 20, sfx: "heavy" },
    { t: OUT, stop: 0.06, target: false, sfx: "clash" },
    { t: HIT, stop: 0.3, shake: 1.0, amp: 6, push: 16, straw: 60, flash: 0.08, sfx: "explosion" },
  ],
};
// frozen by the song from the moment it lands until the Rasengan
export const targetState = (t) => (t > SING + 0.3 && t < HIT ? { dy: 0, tint: [HALL[3], t > IN && t < OUT ? 0 : 0.3] } : null);
// in the illusion we see only the target in the hall; Jiraiya is out of the picture
export const actorAlpha = (t) => (t > IN && t < OUT ? 0 : 1);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  const ill = (t) => t >= IN && t < OUT;
  // the four statues: positions round the target, two holding swords
  const ST = [[TX - 120, 1, 0], [TX - 60, 0.8, 1], [TX + 60, 0.8, 1], [TX + 120, 1, 0]];
  return {
    update(t, dt) {
      if (t > SING && t < IN && R.chance(10 * dt)) ps.spawn(P.SPARK, 20 + R.range(-6, 6), -50, R.range(40, 80), -R.range(10, 30), R.range(0.8, 1.2), NOTE);
      if (t >= HIT && !this.h) { this.h = 1; lights.add(TX, -26, 160, RAS[3], 0.8, 0.4); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      if (!ill(t)) ultSky(p, t, box, { t0: SAGE, t1: END - 0.2, tone: "#060a08", glow: "#1a2a1e", k: 0.6 });
      // the illusion: a dark hall, a stone pillar the target is bound to, four colossal toad statues rising round it
      if (ill(t)) {
        const [x0, y0, x1, y1] = box;
        p.rect(x0, y0, x1 - x0, y1 - y0, HALL[0]);
        for (let i = 0; i < 6; i++) p.rect(x0 + 20 + i * 56, y0, 18, y1 - y0, HALL[1]);
        p.rect(x0, 0, x1 - x0, y1, HALL[2]);
        const rise = ease.outCubic(smooth(STATUES, STATUES + 0.5, t));
        for (const [sx, sc, sword] of ST) {
          const h = 200 * sc * rise, w = 60 * sc, base = 0;
          // a hulking toad silhouette: a squat body and a wide head, eyes catching faint light
          p.ellipse(sx, base - h * 0.35, w * 0.6, h * 0.35, TOAD[1]);
          p.ellipse(sx, base - h * 0.75, w * 0.5, h * 0.2, TOAD[1]);
          p.line(sx - w * 0.5, base - h * 0.75, sx + w * 0.5, base - h * 0.7, TOAD[0]);
          for (const ex of [-0.25, 0.25]) p.circle(sx + ex * w, base - h * 0.88, 2.5 * sc, hex("#c8d040"), rise);
          // the swords, raised high, then falling onto the target
          if (sword) {
            const fall = ease.inCubic(smooth(SWORDS + 0.1, FALL, t)), a = (sx < TX ? -0.4 : -Math.PI + 0.4) + (sx < TX ? 1 : -1) * 1.5 * fall, hx = sx + (sx < TX ? 20 : -20), hy = base - h * 0.6;
            if (t > SWORDS) { const L = 150 * sc; p.beam(hx, hy, hx + Math.cos(a) * L, hy + Math.sin(a) * L, 5, TOAD[2]); p.line(hx, hy - 2, hx + Math.cos(a) * L, hy + Math.sin(a) * L - 2, HALL[3]); }
          }
        }
        // the pillar and the ropes binding the target
        p.rect(TX - 6, -70, 12, 70, HALL[3]);
        if (t > BOUND) for (let i = 0; i < 4; i++) p.line(TX - 9, -14 - i * 10, TX + 9, -18 - i * 10, hex("#8a6a3a"));
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [cx, cy] = b.chest;
      if (!ill(t)) {
        ultBanner(p, t, box, { t0: 0.05, name: "MAGEN: GAMARINSHOU", hold: 0.9, color: "#c8f0a0" });
        drawBadge(p, t, { kind: "sage", t0: 0.1, t1: SAGE, label: "SENJUTSU", head: b.head });
        drawGlint(p, t, "sage", SAGE, END - 0.3, b.head);
        // the two elder toads on his shoulders, singing: mouths open, cheeks puffing in turn
        for (const [k, C, dx, ph] of [[0, SHIMA, -5, 0], [1, FUKA, 4, Math.PI]]) {
          const x = cx + dx, y = cy - 11, sing = t > SING && t < IN ? 0.5 + 0.5 * Math.sin(t * 14 + ph) : 0, r = 4.5 + sing;
          p.ellipse(x, y, r + 1, r * 0.8 + 1, hex("#141018")); p.ellipse(x, y, r, r * 0.8, C[1]); p.ellipse(x - 0.5, y - 0.5, r * 0.6, r * 0.4, C[2]);
          p.px(x + 1, y - 2, hex("#ffd040")); if (sing > 0.3) p.ellipse(x + 3, y + 1, 1.5, sing * 1.5, hex("#2a0a10"));
          if (k) { p.px(x, y - 3, WHITE); p.px(x + 2, y - 3, WHITE); }
        }
        // the song: rings of sound rolling out over the field, notes riding them
        if (t > SING && t < IN) for (let i = 0; i < 4; i++) { const ph = ((t - SING) * 1.4 + i / 4) % 1, r = 10 + ph * (TX - cx); p.arc(cx, cy - 10, r, 1, -0.5, 0.4, i % 2 ? SHIMA[2] : FUKA[2], 0.7 * (1 - ph)); p.text("~", cx + r * 0.9, cy - 14 - r * 0.1, NOTE, { font: "mini", a: 0.8 * (1 - ph) }); }
      }
      // the snap back out of the illusion: a shatter of the hall
      if (t > OUT - 0.05 && t < OUT + 0.25) { const v = (t - OUT + 0.05) / 0.3; for (let i = 0; i < 16; i++) { const a = rand(i, 1) * TAU, d = 20 + v * 160; p.tri(TX + Math.cos(a) * d, -40 + Math.sin(a) * d, TX + Math.cos(a + 0.1) * (d + 12), -40 + Math.sin(a + 0.1) * (d + 12), TX + Math.cos(a - 0.08) * (d + 6), -40 + Math.sin(a - 0.08) * (d + 6), HALL[3], 1 - v); } }
      // the giant Rasengan in both hands, driven into the frozen target
      if (t > RASEN - 0.05 && t < HIT + 0.6) { const k = smooth(RASEN - 0.05, RASEN + 0.1, t) * (1 - smooth(HIT + 0.2, HIT + 0.6, t)), [x, y] = b.handN; drawRasengan(p, x + 8, y - 4, 16, t, RAS, k); }
      if (t > HIT && t < HIT + 0.5) { const v = (t - HIT) / 0.5; p.ring(TX, -26, 10 + 70 * v, 2, RAS[3], 1 - v); }
      void drawFigure; void noise2; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= FALL && t < FALL + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -30, false, 174, { style: "rings", ink: hex("#060a08"), paper: hex("#e8f4dc"), lines: 20 });
    },
  };
});

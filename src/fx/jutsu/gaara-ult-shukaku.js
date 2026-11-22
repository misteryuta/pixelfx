// ULTIMATE: Shukaku: Fuuton: Renkuudan (Gaara releases the One-Tail; Wind Release: Drilling Air Bullets). Narutopedia:
// Gaara, the One-Tail's jinchuuriki, can fall asleep (Tanuki Neiri) to let Shukaku take over: a giant sand tanuki with
// dark blue markings over its body, a thick tail, a wild grin; in its full form it fires Renkuudan, it drums its belly
// and spits huge compressed air bullets. Here: sand swirls up round Gaara and grows into the giant tanuki, the seal
// markings over it; Gaara on its forehead closes his eyes (the sleeping sign, his upper body growing out of its brow);
// Shukaku throws its head back cackling, slaps its swollen belly, and fires three air bullets one after another
// that blast the target, the last biggest; then it crumbles back into sand round Gaara.
// New: Shukaku (sand body, blue markings, eyes with the four dots, the grin, the tail), belly drum, the air bullets;
// ULTIMATE staging; one impact frame (burst, sand).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, blast, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultSky, ultBanner, frameOf } from "./_ultimate.js";

const SWIRL = 0.3, GROW = 0.6, GROWN = 1.6, SLEEP = 1.8, LAUGH = 2.1, DRUM = 2.6, SHOTS = [2.85, 3.2, 3.6], FLY = 0.25, CRUMBLE = 4.7, END = 5.6, TX = 290;
const SAND = ["#4a3418", "#7a5a2a", "#a8844a", "#d0ac6a", "#f0d8a0"].map(hex), MARK = ["#1a2a5a", "#2a4a8a"].map(hex), AIR = ["#a8c8d8", "#e8f4ff", "#ffffff"].map(hex);
const SX = 60, SC = 1.25;

export const meta = {
  name: "Shukaku: drilling air bullets",
  desc: "ULTIMATE. Gaara lets the One-Tail out: sand swirls up into the giant tanuki with its blue markings, Gaara asleep on its brow; it cackles, drums its swollen belly and spits three huge air bullets that blast the target, then crumbles back into sand.",
  tags: ["jutsu", "ultimate", "gaara", "shukaku", "bijuu", "wind", "sand", "projectile", "one-shot"],
  size: [420, 280],
  origin: [56, 250],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a3418", "#7a5a2a", "#a8844a", "#d0ac6a", "#f0d8a0"], seed: 172 },
};

export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [SWIRL, { ...READY, crouch: 3, armsFront: true, fx: 9, fy: -26, bx: 9, by: -26 }, "out"],
    [END, READY],
  ],
  hits: [
    { t: SWIRL, target: false, sfx: "rumble" },
    { t: GROWN, stop: 0.08, shake: 1.0, amp: 4, target: false, sfx: "heavy" },
    { t: DRUM, stop: 0.06, shake: 0.4, amp: 2, target: false, sfx: "punch" },
    ...SHOTS.map((s, i) => ({ t: s + FLY, stop: i === 2 ? 0.3 : 0.1, shake: 0.6 + i * 0.3, amp: 3 + i * 2, push: 4 + i * 4, straw: 30 + i * 15, flash: i === 2 ? 0.08 : 0.03, sfx: i === 2 ? "explosion" : "heavy" })),
    { t: CRUMBLE, shake: 0.6, amp: 2, target: false, sfx: "rumble" },
  ],
};
// Gaara is inside the tanuki from the growth until it crumbles (asleep on its brow)
export const actorAlpha = (t) => (t > GROW + 0.2 && t < CRUMBLE + 0.3 ? 0 : 1);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  const grow = (t) => ease.outBack(smooth(GROW, GROWN, t), 1.2) * (1 - ease.inCubic(smooth(CRUMBLE, CRUMBLE + 0.6, t)));
  const lean = (t) => -0.18 * Math.sin(Math.PI * smooth(LAUGH, DRUM, t)) + SHOTS.reduce((m, s) => m + 0.1 * Math.exp(-Math.pow((t - s) / 0.08, 2)), 0);
  // the tanuki in its own space (feet at 0, facing right): which part covers (x, y)
  const part = (x, y, t) => {
    const belly = 1 + 0.12 * smooth(DRUM - 0.2, DRUM, t) * (1 - smooth(SHOTS[2], SHOTS[2] + 0.4, t));
    if (((x - 4) / (46 * belly)) ** 2 + ((y + 60) / (52 * belly)) ** 2 < 1) return 1; // body
    if (((x - 26) / 30) ** 2 + ((y + 128) / 26) ** 2 < 1) return 2; // head
    if (((x - 8) / 10) ** 2 + ((y + 156) / 12) ** 2 < 1 || ((x + 16) / 10) ** 2 + ((y + 150) / 12) ** 2 < 1) return 2; // ears
    if (((x - 40) / 14) ** 2 + ((y + 66) / 10) ** 2 < 1 || ((x + 20) / 18) ** 2 + ((y + 8) / 10) ** 2 < 1 || ((x - 26) / 18) ** 2 + ((y + 8) / 10) ** 2 < 1) return 1; // arm, feet
    // the thick tail curling up behind
    const ta = Math.atan2(y + 70, x + 70), tr = Math.hypot(x + 70, y + 70);
    if (x < -30 && tr > 22 && tr < 40 && ta > -2.6 && ta < 0.6) return 3;
    return 0;
  };
  return {
    update(t, dt) {
      if (t > SWIRL && t < GROWN && R.chance(80 * dt)) { const a = R.range(0, TAU), d = R.range(10, 60); ps.spawn(P.DUST, SX + Math.cos(a) * d, -R.range(0, 120), -Math.sin(a) * 60, -R.range(20, 80), R.range(0.4, 0.8), SAND[R.int(2, 4)]); }
      if (t > CRUMBLE && t < CRUMBLE + 0.8 && R.chance(90 * dt)) ps.spawn(P.GRIT, SX + R.range(-60, 60), -R.range(0, 160), R.range(-40, 40), R.range(0, 60), R.range(0.5, 1), SAND[R.int(1, 3)]);
      SHOTS.forEach((s, i) => { if (t >= s + FLY && !this["s" + i]) { this["s" + i] = 1; lights.add(TX, -30, 90 + i * 30, AIR[1], 0.25 + i * 0.1, 0.3); } });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: SWIRL, t1: END - 0.2, tone: "#0c0806", glow: "#3a2a10" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), g = grow(t);
      ultBanner(p, t, box, { t0: 0.05, name: "SHUKAKU: RENKUUDAN", hold: 1.0, color: "#d0ac6a" });
      drawBadge(p, t, { kind: "gaara", t0: 0.1, t1: SWIRL, label: "ICHIBI", head: b.head });
      if (t < GROW + 0.3) drawGlint(p, t, "gaara", SWIRL, GROW + 0.3, b.head);
      if (g > 0.02) {
        const s = g * SC, ln = lean(t), c = Math.cos(ln), sn = Math.sin(ln), L = (x, y) => { const lx = (x - SX) / s, ly = y / s; return [lx * c + ly * sn, -lx * sn + ly * c]; };
        p.shade(SX - 110 * s, -200 * s, SX + 90 * s, 1, (x, y, out) => {
          const [lx, ly] = L(x, y), pt = part(lx, ly, t);
          if (!pt) return;
          const e = 1.5, edge = !part(lx - e, ly, t) || !part(lx + e, ly, t) || !part(lx, ly - e, t) || !part(lx, ly + e, t);
          if (edge) return SAND[0];
          // the markings: dark blue bands and rings over body and head
          const mk = Math.abs(Math.sin(lx * 0.12 + ly * 0.05 + Math.sin(ly * 0.08) * 1.2)) < 0.12 || Math.abs(Math.hypot(lx - 6, ly + 60) - 24) < 1.4;
          if (mk && pt !== 3) return pt === 2 ? MARK[1] : MARK[0];
          if (pt === 2) {
            // the eyes: yellow-black with the four dots, the wide grin with its teeth
            for (const ex of [16, 38]) { const d = Math.hypot(lx - ex, ly + 132); if (d < 6) return d < 1.5 ? hex("#1a1010") : (Math.abs(lx - ex) < 0.7 || Math.abs(ly + 132) < 0.7) && d > 3 ? hex("#1a1010") : hex("#f0d040"); }
            const grin = Math.abs(ly + 114 - 0.004 * (lx - 30) ** 2) < 2.2 && lx > 8 && lx < 54;
            if (grin) return Math.floor(lx) % 3 === 0 ? WHITE : hex("#3a0a10");
          }
          const tex = noise2(lx * 0.2 + t * 0.5, ly * 0.2, 81);
          return pt === 3 ? (tex > 0 ? SAND[3] : SAND[2]) : tex > 0.35 ? SAND[4] : tex > -0.25 ? SAND[3] : SAND[2];
        });
        // Gaara asleep on its brow, only his upper body, eyes shut
        const bx = SX + 14 * s, by = -158 * s;
        p.rect(bx - 2, by - 8, 5, 8, hex("#8a1a1a")); p.circle(bx, by - 11, 3, hex("#f0d0b0")); p.rect(bx - 3, by - 15, 7, 3, hex("#a8241a")); p.line(bx, by - 11, bx + 2, by - 11, hex("#1a1010"));
        if (t > SLEEP && t < CRUMBLE) p.text("Z", bx + 6, by - 20 - ((t * 10) % 6), hex("#f0d8a0"), { font: "mini", a: 0.8 });
        if (t > LAUGH && t < DRUM) p.text("HYAHAHA!", SX + 50 * s, -190 * s, hex("#f0d8a0"), { font: "mini", align: "center", outline: hex("#1a1008") });
      }
      // the air bullets: huge balls of compressed air spat from the grin, rippling, a pressure cone behind each
      SHOTS.forEach((s0, i) => {
        const age = t - s0;
        if (age < 0 || age > FLY) return;
        const u = ease.inQuad(age / FLY), mx = SX + 50 * SC, my = -116 * SC, x = mx + (TX - mx) * u, y = my + (-30 - my) * u, r = 10 + i * 5;
        p.glow(x, y, r * 2, AIR[0], 0.5);
        p.ring(x, y, r, 2, AIR[1]); p.ring(x, y, r * 0.6, 1, AIR[2], 0.8);
        for (let j = 0; j < 4; j++) p.line(x - r - 6 - j * 8, y - r * 0.5 + j * r * 0.3, x - r - 16 - j * 8, y - r * 0.5 + j * r * 0.3, AIR[1], 0.6);
      });
      SHOTS.forEach((s0, i) => blast(p, t - s0 - FLY, { x: TX, y: 0, R: 26 + i * 10, C: SAND, seed: 7 + i }));
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= SHOTS[2] + FLY && t < SHOTS[2] + FLY + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -30, true, 172, { style: "burst", ink: hex("#1a1008"), paper: hex("#fff0d0"), lines: 36 });
      void rand; void clamp;
    },
  };
});

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
import { drawModel, modelPoint } from "./_models.js";
import { cineCam, inserts, insertKeys, backdrop, eyeShot, splitShot, speedLines, cutFlash } from "./_cinema.js";

const SWIRL = 0.3, GROW = 0.6, GROWN = 1.6, SLEEP = 1.8, LAUGH = 2.1, DRUM = 2.6, SHOTS = [2.85, 3.2, 3.6], FLY = 0.25, CRUMBLE = 4.7, END = 5.6, TX = 290;
const SAND = ["#4a3418", "#7a5a2a", "#a8844a", "#d0ac6a", "#f0d8a0"].map(hex), MARK = ["#1a2a5a", "#2a4a8a"].map(hex), AIR = ["#a8c8d8", "#e8f4ff", "#ffffff"].map(hex);
const SX = 70, SC = 1.0, SLAPS = [DRUM - 0.2, DRUM];
// Shukaku (the user's model) as a puppet: the tail sways like a banner; it cackles (head thrown back, jaw shaking
// open), swings its raised arm down to slap its swollen belly twice, then for each air bullet draws its head back
// (breathing in), lunges and spits, jaw dropped wide
const bump = (t, a, b, c) => smooth(a, b, t) * (1 - smooth(b, c, t));
const shukakuPose = (t) => {
  const laugh = smooth(LAUGH, LAUGH + 0.15, t) * (1 - smooth(DRUM - 0.35, DRUM - 0.2, t)), cackle = laugh * Math.sin(t * 46);
  const slap = SLAPS.reduce((m, s) => Math.max(m, bump(t, s - 0.14, s, s + 0.16)), 0), arm = smooth(DRUM - 0.45, DRUM - 0.3, t) * (1 - smooth(DRUM + 0.15, DRUM + 0.45, t));
  const inhale = SHOTS.reduce((m, s) => Math.max(m, bump(t, s - 0.2, s - 0.03, s)), 0), spit = SHOTS.reduce((m, s, i) => Math.max(m, t >= s ? Math.exp(-(t - s) * 9) * (1 + 0.2 * i) : 0), 0);
  return {
    tail: { sway: 5 + 3 * laugh + 4 * spit, swayK: 0.05, swayPh: t * 3.2, bend: 0.04 * Math.sin(t * 2.1) },
    head: { rot: -0.24 * laugh + 0.04 * cackle - 0.1 * inhale + 0.08 * spit, dy: -3 * inhale + 5 * spit, dx: 2 * spit },
    jaw: { dy: 4 * laugh + 2 * Math.abs(cackle) - 2 * inhale + 9 * spit, sy: 1 + 0.15 * spit },
    arm: { rot: 0.5 * arm + 1.25 * slap - 0.15 * laugh, st: 1 - 0.15 * slap },
  };
};
const shukakuAt = (t, g) => ({ x: SX, o: { scale: g * SC * (1 + 0.06 * smooth(DRUM - 0.2, DRUM, t) * (1 - smooth(SHOTS[2], SHOTS[2] + 0.4, t))), rot: 0, clipFloor: true, pose: shukakuPose(t) } });
const mouthOf = (t, g) => { const K = shukakuAt(t, g); return modelPoint("shukaku", "front", K.x, 0, K.o, "jaw", [92, 112]); };

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
    { t: DRUM - 0.2, stop: 0.04, shake: 0.3, amp: 2, target: false, sfx: "punch" },
    { t: DRUM, stop: 0.06, shake: 0.4, amp: 2, target: false, sfx: "punch" },
    ...SHOTS.map((s, i) => ({ t: s + FLY, stop: i === 2 ? 0.3 : 0.1, shake: 0.6 + i * 0.3, amp: 3 + i * 2, push: 4 + i * 4, straw: 30 + i * 15, flash: i === 2 ? 0.08 : 0.03, sfx: i === 2 ? "explosion" : "heavy" })),
    { t: CRUMBLE, shake: 0.6, amp: 2, target: false, sfx: "rumble" },
  ],
};
// ---- the cutscene: Gaara's eye, ringed dark, sand streaming past; the tanuki rising seen low and wide; his eye
// closing as Shukaku's opens (the switch: he falls asleep and it wakes); its grinning head close, cackling; the
// belly drum; its mouth, from the front, huge, spitting the air bullet at us; the bullets followed to the target.
const BOX = [-56, -250, 364, 30];
// Shukaku's eye: gold, a black four-pointed star for a pupil, four dots round it
const shukakuIris = (u, v, r) => {
  if (r > 0.92) return hex("#3a2a10");
  const star = Math.abs(u) * Math.abs(v) < 0.012 && Math.hypot(u, v) < 0.55 || Math.hypot(u, v) < 0.12;
  if (star) return hex("#0c0806");
  for (const [a, b] of [[0.42, 0.42], [-0.42, 0.42], [0.42, -0.42], [-0.42, -0.42]]) if (Math.hypot(u - a, v - b) < 0.07) return hex("#0c0806");
  return r > 0.75 ? hex("#c8901a") : u < -0.2 && v < -0.2 ? hex("#fff0a0") : hex("#f0c040");
};
const INS = [
  [0.24, 0.6, (p, u, t, box) => {
    backdrop(p, box, t, { c0: "#3a2a16", c1: "#a8844a", style: "flow", seed: 9 });
    eyeShot(p, box, t, { kind: "gaara", cx: 154, cy: -112, R: 32 + 5 * u, open: smooth(0, 0.4, u), skin: "#f0d0b0", shadow: "#c8a088", brow: "#f0d0b0", rim: "#1a1214" });
  }],
  [1.74, 2.1, (p, u, t, box) => {
    splitShot(p, box, t,
      (pp, d) => { backdrop(pp, box, t, { c0: "#2a1e10", c1: "#7a5a2a", style: "plain" }); eyeShot(pp, box, t, { kind: "gaara", cx: 30 + d, cy: -112, R: 28, open: 1 - smooth(0.1, 0.6, u), skin: "#f0d0b0", shadow: "#c8a088", brow: "#f0d0b0", rim: "#1a1214" }); },
      (pp, d) => { backdrop(pp, box, t, { c0: "#4a3418", c1: "#d0ac6a", style: "rays", cx: 260, cy: -112 }); eyeShot(pp, box, t, { iris: shukakuIris, cx: 270 + d, cy: -112, R: 34, open: smooth(0.35, 0.9, u), skin: "#d8b888", shadow: "#a8844a", brow: "#1a2a5a", flip: true }); },
      { slant: 0.5, u: u * 3, seam: "#f0d8a0" });
  }],
  [2.86, 3.12, (p, u, t, box) => {
    // its mouth from the front, huge: the jaw drops and the air bullet comes straight at us
    backdrop(p, box, t, { c0: "#2a1c0c", c1: "#f0d8a0", style: "burst", cx: 154, cy: -60 });
    const o = { scale: 2.6, rot: 0, pose: { jaw: { dy: 10 * smooth(0, 0.3, u), sy: 1.2 }, head: { dy: 4 * smooth(0, 0.3, u) } } };
    drawModel(p, "shukaku", "front", 154 + Math.sin(t * 60) * 2, 150, o);
    const m = modelPoint("shukaku", "front", 154, 150, o, "jaw", [92, 112]), r = 6 + 120 * ease.inCubic(u);
    p.glow(m[0], m[1], r * 1.6, AIR[0], 0.6); p.ring(m[0], m[1], r, 3, AIR[1]); p.ring(m[0], m[1], r * 0.6, 2, AIR[2], 0.8);
    speedLines(p, box, t, m[0], m[1], 0.8 * u, AIR[1]);
  }],
];
export const camera = cineCam([
  [0, { z: 1.8, x: 34, y: -36 }],
  ...insertKeys(INS),
  [0.6, { z: 1.0, x: 80, y: -112, r: -3, shake: 0.7 }, "cut"],
  [GROWN, { z: 1.05, x: 80, y: -118, r: -1, shake: 1.0 }],
  [GROWN + 0.14, { z: 1.05, x: 80, y: -118, r: 0, shake: 0.1 }],
  [2.1, { z: 2.1, x: 70, y: -108, r: 6, shake: 0.3 }, "cut"],
  [2.32, { z: 2.3, x: 72, y: -112, r: 7, shake: 0.3 }],
  [2.34, { z: 1.6, x: 100, y: -62, r: -3 }, "cut"],
  [DRUM, { z: 1.7, x: 104, y: -60, r: -4, shake: 0.8 }],
  [2.84, { z: 1.6, x: 104, y: -60, r: -3, shake: 0 }],
  [3.12, { z: 1.1, x: 190, y: -80, r: 2, shake: 0.4 }, "cut"],
  [SHOTS[2], { z: 1.15, x: 200, y: -80, r: 0 }],
  [SHOTS[2] + FLY - 0.01, { z: 1.6, x: TX - 10, y: -40, r: -2 }, "whip"],
  [SHOTS[2] + FLY, { z: 1.0, x: 200, y: -100, r: 0, shake: 1.2 }, "cut"],
  [CRUMBLE, { z: 1.05, x: 150, y: -110, shake: 0.4 }],
  [END, { z: 1.0, x: 150, y: -110 }],
]);

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
        // Shukaku (the user's model), rising out of the sand, leaning back to cackle, swelling with each drum
        const s = g * SC, K = shukakuAt(t, g);
        K.o.rot = lean(t) * 0.5;
        drawModel(p, "shukaku", "front", K.x, 0, { ...K.o, glow: SAND[3] });
        // the belly slaps: a ring of sand dust off the belly
        SLAPS.forEach((s0) => { const a = t - s0; if (a > 0 && a < 0.3) { const B = modelPoint("shukaku", "front", K.x, 0, K.o, null, [122, 140]); p.ring(B[0], B[1], 6 + a * 70, 1, SAND[4], 1 - a / 0.3); } });
        // Gaara asleep on its brow, only his upper body, eyes shut
        const [bx, by] = modelPoint("shukaku", "front", K.x, 0, K.o, "head", [93, 74]);
        p.rect(bx - 2, by - 8, 5, 8, hex("#8a1a1a")); p.circle(bx, by - 11, 3, hex("#f0d0b0")); p.rect(bx - 3, by - 15, 7, 3, hex("#a8241a")); p.line(bx, by - 11, bx + 2, by - 11, hex("#1a1010"));
        if (t > SLEEP && t < CRUMBLE) p.text("Z", bx + 6, by - 20 - ((t * 10) % 6), hex("#f0d8a0"), { font: "mini", a: 0.8 });
        if (t > LAUGH && t < DRUM) p.text("HYAHAHA!", SX + 30 * s, -200 * s, hex("#f0d8a0"), { font: "mini", align: "center", outline: hex("#1a1008") });
      }
      // the air bullets: huge balls of compressed air spat from the grin, rippling, a pressure cone behind each
      SHOTS.forEach((s0, i) => {
        const age = t - s0;
        if (age < 0 || age > FLY) return;
        const u = ease.inQuad(age / FLY), [mx, my] = mouthOf(s0, grow(s0)), x = mx + (TX - mx) * u, y = my + (-30 - my) * u, r = 10 + i * 5;
        p.glow(x, y, r * 2, AIR[0], 0.5);
        p.ring(x, y, r, 2, AIR[1]); p.ring(x, y, r * 0.6, 1, AIR[2], 0.8);
        for (let j = 0; j < 4; j++) p.line(x - r - 6 - j * 8, y - r * 0.5 + j * r * 0.3, x - r - 16 - j * 8, y - r * 0.5 + j * r * 0.3, AIR[1], 0.6);
      });
      SHOTS.forEach((s0, i) => blast(p, t - s0 - FLY, { x: TX, y: 0, R: 26 + i * 10, C: SAND, seed: 7 + i }));
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= SHOTS[2] + FLY && t < SHOTS[2] + FLY + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -30, true, 172, { style: "burst", ink: hex("#1a1008"), paper: hex("#fff0d0"), lines: 36 });
      inserts(p, t, BOX, INS);
      cutFlash(p, BOX, t, [0.6, 2.1, 3.12], 0.04, hex("#fff0d0"));
      void rand; void clamp;
    },
  };
});

// Amaterasu (Itachi). Narutopedia: a Mangekyou Sharingan doujutsu, the highest form of Fire Release: black flames are
// born at the focal point of the user's sight, no seals and no projectile; they burn as hot as the sun and do not go
// out until the target has burned to ash (seven days and nights); using it strains the eye, which bleeds.
// Here: his Mangekyou turns; the camera goes in on his face; an insert of the eye itself, filling the frame, the
// pinwheel turning and a line of blood running from it; one red frame, the world gone to ink on blood (the fear);
// and the black fire is simply there: it blooms at the point he looked at, swallows the target in a writhing column
// with a crimson rim, creeps out over the ground and scorches it black; the target chars, sags and crumbles into a
// heap of ash; the flames burn on over the ash, then die down to smouldering patches.
// The camera: in on him; the eye insert; a cut to the target as it catches, close; pulling slowly out as it burns.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, mix, WHITE } from "../../core/index.js";
import { play, bodyAt, drawBlackFlame, BLACK_FIRE, veil } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { cineCam, inserts, insertKeys, backdrop, eyeShot } from "./_cinema.js";

const EYE = 0.05, OPEN = 0.6, LOOK = OPEN + 0.25, INS = LOOK + 0.12, IGNITE = INS + 0.5, FULL = IGNITE + 0.6, ASH = IGNITE + 2.0, END = ASH + 1.4, TX = 150;
const F = BLACK_FIRE, ASHC = ["#2a2426", "#4a4244", "#7a7072"].map(hex), BLOOD = hex("#a01020");
// the tongues creeping out over the ground, each catching a little later the further out it is
const GROUND = Array.from({ length: 16 }, (_, i) => ({ x: TX + (i % 2 ? 1 : -1) * (20 + Math.floor(i / 2) * 8 + rand(i, 6) * 4), w: 4 + rand(i, 7) * 3, h: 9 + rand(i, 8) * 12, d: 0.25 + Math.floor(i / 2) * 0.09 }));
const BOX = [-50, -136, 210, 34];

export const meta = {
  name: "Amaterasu",
  desc: "Itachi: his Mangekyou turns and he only looks; the eye bleeds, the world flashes red, and black flame blooms where his gaze settles, swallowing the target in a writhing column, creeping over the ground, until the target crumbles into ash.",
  tags: ["jutsu", "itachi", "amaterasu", "mangekyou", "fire", "dot", "one-shot"],
  size: [260, 170],
  origin: [50, 136],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#050306", "#120810", "#2a0c1a", "#6a1028", "#c02040"], seed: 36 },
};

const CALM = { ...READY, crouch: 1, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 5, fbx: -5 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [IGNITE, { ...CALM, crouch: 2 }],
    [IGNITE + 0.25, { ...CALM, crouch: 3, fx: 5, fy: -30, bx: -2, by: -17 }, "out"],
    [IGNITE + 1.0, CALM],
    [END, CALM],
  ],
  hits: [
    { t: LOOK, target: false, sfx: "cast" },
    { t: IGNITE, stop: 0.14, shake: 0.3, amp: 2, push: 0, straw: 16, skin: "char", flash: 0, sfx: "heavy" },
    ...[0.5, 1.0, 1.5].map((d) => ({ t: IGNITE + d, stop: 0.02, flash: 0, push: 0, straw: 6, shiver: 0.5 })),
    { t: ASH, target: false, sfx: "rumble" },
    { t: END - 0.2, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// the target: charring, sagging as it burns, then crumbling away into the ash heap
export const targetState = (t) => {
  if (t < IGNITE) return null;
  const sag = smooth(FULL, ASH, t), gone = smooth(ASH - 0.2, ASH + 0.4, t);
  return { s: 1 - 0.12 * sag - 0.3 * gone, dy: 4 * sag, rot: 0.05 * sag * Math.sin(t * 9), a: 1 - gone, tint: [F[1], 0.4 + 0.4 * sag] };
};

// the eye insert: the Mangekyou filling the frame, turning, blood welling from the lower lid and running
const INSL = [[INS, IGNITE - 0.02, (p, u, t, box) => {
  backdrop(p, box, t, { c0: "#12060a", c1: "#3a0a12", style: "flow", seed: 11 });
  eyeShot(p, box, t, { kind: "itachi", cx: 80, cy: -58, R: 30 + 8 * u, open: 1, rot: t * 3, skin: "#efd0b8", shadow: "#c4a08c", mark: (uu, v) => v > 0.95 && v < 2.0 && (Math.abs(uu + 0.15 - (v - 0.95) * 0.25) < 0.03 || Math.abs(uu + 0.45 - (v - 0.95) * 0.25) < 0.03) });
  // the blood: welling at the lower lid, then a line running down the cheek
  const L = 2 + 40 * ease.inQuad(smooth(0.25, 1, u));
  p.circle(86, -24, 2.6, BLOOD); p.beam(86, -24, 87, -24 + L, 3, BLOOD); p.circle(87, -24 + L, 2.2, BLOOD);
}]];
export const camera = cineCam([
  [0, { z: 1.6, x: 10, y: -32 }],
  [LOOK, { z: 2.4, x: 4, y: -34, r: -2 }],
  ...insertKeys(INSL),
  [IGNITE, { z: 2.0, x: TX, y: -34, r: 3, shake: 0.5 }, "cut"],
  [FULL, { z: 1.7, x: TX - 10, y: -38, r: 1, shake: 0.1 }],
  [ASH + 0.6, { z: 1.3, x: TX - 30, y: -40, r: 0 }],
  [END, { z: 1.05, x: 80, y: -46 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  // the column of black flame round the target: height grows, sinks once it has burned it to ash
  const colH = (t) => 74 * ease.outBack(clamp((t - IGNITE) / 0.5), 1.4) * (1 - 0.6 * smooth(ASH, END - 0.4, t));
  return {
    update(t, dt) {
      if (t > IGNITE && t < END - 0.3) {
        if (R.chance(60 * dt)) ps.spawn(P.EMBER, TX + R.range(-16, 16), -R.range(10, colH(t)), R.range(-10, 10), -R.range(25, 55), R.range(0.4, 0.9), R.chance(0.6) ? F[1] : F[4]);
        if (R.chance(30 * dt)) ps.spawn(P.SMOKE, TX + R.range(-12, 12), -colH(t) - 4, R.range(-8, 8), -R.range(15, 30), R.range(0.6, 1.2), F[1], 1.4);
      }
      // the target crumbling: ash pouring down
      if (t > ASH - 0.2 && t < ASH + 0.6 && R.chance(120 * dt)) ps.spawn(P.GRIT, TX + R.range(-10, 10), -R.range(4, 46), R.range(-20, 20), R.range(0, 30), R.range(0.4, 0.8), ASHC[R.int(0, 2)]);
      ps.update(dt);
    },
    drawBack(p, t) {
      // the ground scorched black under the fire, spreading with it
      if (t > IGNITE) { const k = smooth(IGNITE, IGNITE + 1.0, t); p.ellipse(TX, 1, 22 + 52 * k, 3, F[0], 0.85); p.ellipse(TX, 1, 12 + 30 * k, 2, F[2], 0.5); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "itachi", t0: EYE, t1: OPEN, label: "MANGEKYOU", head: b.head });
      drawGlint(p, t, "itachi", OPEN + 0.05, END, b.head);
      // his eye bleeds once the flames are called
      if (t > INS) p.line(b.head[0] + 2, b.head[1] + 0.5, b.head[0] + 2, b.head[1] + 0.5 + Math.min(5, (t - INS) * 8), BLOOD);
      // the red frame: an instant of ink on blood over everything, a red pulse dying away
      if (t >= IGNITE && t < IGNITE + 0.05) { p.rect(BOX[0], BOX[1], BOX[2] - BOX[0], BOX[3] - BOX[1], hex("#6a0610")); }
      else if (t >= IGNITE && t < IGNITE + 0.5) veil(p, BOX[0], BOX[1], BOX[2] - BOX[0], 34, hex("#8a0a18"), 0.5 * (1 - smooth(IGNITE + 0.05, IGNITE + 0.5, t)));
      if (t >= IGNITE) {
        const H = colH(t), out = 1 - smooth(END - 0.6, END, t);
        // the heat over it, the faint crimson light it gives
        p.glow(TX, -H * 0.4, 46 + H * 0.3, F[4], 0.22 * out);
        // the column: a writhing mass of black flame round the target, tongues licking up off its top, crimson rim
        if (H > 2) p.shade(TX - 30, -H - 18, TX + 30, 1, (x, y, o) => {
          const dx = (x - TX) / 22, v = -y / H, n = noise2(x * 0.09, y * 0.07 + t * 5, 61), n2 = noise2(x * 0.18 - t * 2, y * 0.12 + t * 7, 62);
          const w = (1 - Math.pow(Math.max(0, v - 0.2) / 1.05, 1.6)) * (0.85 + 0.35 * n), top = 1 + 0.25 * n2;
          if (v < 0 || v > top || Math.abs(dx) > w) return;
          o.a = out;
          const edge = Math.abs(dx) / Math.max(0.05, w), hi = v / top;
          if (edge > 0.86 || hi > 0.94) return n2 > 0.2 ? F[4] : F[3];
          if (edge > 0.7) return F[2];
          return n > 0.3 ? F[1] : F[0];
        });
        // the tongues creeping out over the ground
        for (const [i, q] of GROUND.entries()) {
          const k = ease.outBack(clamp((t - IGNITE - q.d) / 0.25), 2) * out * (1 - 0.5 * smooth(ASH, END, t));
          drawBlackFlame(p, q.x, 0, q.w, q.h, t + i * 0.7, i * 5, k);
        }
      }
      // the ash heap left where it stood
      if (t > ASH) { const k = smooth(ASH, ASH + 0.5, t); p.ellipse(TX, -1, 14 * k, 4 * k, ASHC[0]); p.ellipse(TX - 2, -2, 9 * k, 3 * k, ASHC[1]); for (let i = 0; i < 6; i++) p.px(TX - 8 + rand(i, 3) * 16, -2 - rand(i, 4) * 3, ASHC[2]); }
      ps.draw(p, "front");
      inserts(p, t, BOX, INSL);
    },
  };
});
void mix; void WHITE;

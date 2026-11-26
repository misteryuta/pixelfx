// SUMMON: Temari (Genin, Classic) slot 1 "Summoning: Quick Beheading Dance" (Kuchiyose: Kirikiri Mai, Manga 214 /
// Anime 125, against Tayuya): Temari swings her Giant Folding Fan, smeared with her blood, raising a whirlwind that
// travels hundreds of metres; Kamatari rides it and cuts through everything in its path; once he moves he cannot be
// followed with the eye (Narutopedia, To no Sho p. 211).
//   seal    the fan swing: a gust off Temari
//   appear  Kamatari in the wind in front of her, the giant sickle up, the small sickles and the lantern round him
//   windup  he crouches and draws the sickle back, turned to the target (following it); the wind's path shows on the
//           floor (the tell: the corridor he will cut)
//   dash    he shoots along the path and SPEEDS UP all the way (18 -> ~120 studs/s), the sickle whirling round him;
//           the faster he goes, the fainter he is and the longer his trail; everything within the sickle's reach of
//           his line is cut and flung aside by the wind
//   stop    at the end of the path he skids round and is gone in smoke; the cut marks stay on the ground a moment
import { KAMATARI, drawWeasel } from "./_weasel.js";
import { hex } from "../../core/index.js";

const SPP = 10.7 / 72;
const ease = (u) => 1 - (1 - u) ** 3;
export const ANIMS = {
  idle: { frames: 4, fps: 6, loop: true, pose: (u) => ({ crouch: 0.2, swing: -0.3 + 0.12 * Math.sin(u * Math.PI * 2) }) },
  windup: { frames: 3, fps: 9, pose: (u) => ({ crouch: ease(u), swing: -0.3 - 1.0 * ease(u) }) },
  dash: { frames: 8, fps: 24, loop: true, pose: (u) => ({ stretch: 1, lift: 10, swing: -1.3 + u * Math.PI * 2 }) },
  stop: { frames: 3, fps: 9, pose: (u) => ({ stretch: 1 - u, lift: 10 * (1 - u), crouch: u, swing: 0.3 }) },
};
export const VIEWS = ["side", "front", "back"];
export const RIGS = [{ book: "weasel_kamatari", S: KAMATARI, draw: drawWeasel, pitch: 0.36, anims: ANIMS }];

export const MOVE = {
  id: "temari-kamatari-dance", kind: "dash",
  variant: "classic/temari-genin", slot: 1,
  seal: 0.35, appear: 0.3, windup: 0.35, stop: 0.35,
  start: 2.5,                  // he appears this far in front of Temari
  v0: 18, acc: 180,            // the dash speeds up: s = v0 t + acc t^2 / 2
  length: 40, W: 3.2,          // the path's length and the sickle's reach either side of it
  dmg: 16, kb: 7, kbT: 0.3,
  range: 45, cone: 45,
  dodge: { phase: "dash", side: 6 },
  cooldown: 7, lock: 0.35,
};

// ---- effects
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const WIND = hex("#e8f6ee"), WIND2 = hex("#a8dcc4"), SM1 = hex("#f4f2f6"), SM2 = hex("#cfcbd8");
const Wpx = 3.2 / SPP, Lpx = 40 / SPP;
export const FX = {
  // the fan's gust: white-green wind arcs whirling out
  gust: { cw: 140, ch: 120, ox: 70, oy: 90, frames: 8, fps: 16, draw(p, u) {
    for (let k = 0; k < 5; k++) {
      const r = 10 + 40 * ease(u) * (0.6 + 0.1 * k), a0 = u * 5 + k * 1.25;
      for (let t = 0; t < 1.6; t += 0.05) { const a = a0 + t; p.blend(Math.cos(a) * r, -30 + Math.sin(a) * r * 0.55, k % 2 ? WIND2 : WIND, (1 - u) * (1 - t / 1.6)); }
    }
  } },
  // the small sickles circling him while he waits, and the paper lantern with the character for 'sickle'
  sickles: { cw: 150, ch: 110, ox: 75, oy: 90, frames: 6, fps: 10, loop: true, draw(p, u) {
    for (let k = 0; k < 4; k++) {
      const a = u * Math.PI * 2 / 4 + k * Math.PI / 2, x = Math.cos(a) * 55, y = -40 + Math.sin(a) * 18;
      p.line(x - 4, y + 6, x + 2, y - 4, hex("#5a4a3a")); p.line(x + 2, y - 4, x + 9, y - 3, hex("#d8dde6")); p.line(x + 3, y - 5, x + 9, y - 4, hex("#ffffff"));
    }
    // the lantern (behind his shoulder)
    const lx = -38, ly = -70;
    p.rect(lx - 6, ly - 10, 12, 1, hex("#2a2228")); p.rect(lx - 6, ly + 9, 12, 1, hex("#2a2228"));
    p.ellipse(lx, ly, 7, 9, hex("#f0e6d0")); p.ellipse(lx + 2, ly, 4, 8, hex("#d8ccb4"));
    p.rect(lx - 2, ly - 4, 4, 1, hex("#b8302c")); p.rect(lx - 1, ly - 4, 1, 8, hex("#b8302c")); p.rect(lx + 1, ly - 1, 2, 1, hex("#b8302c")); p.rect(lx - 3, ly + 2, 6, 1, hex("#b8302c"));
  } },
  // speed lines round him in the dash (drawn along +x; the game turns them to his heading on screen)
  streak: { cw: 160, ch: 70, ox: 80, oy: 50, frames: 3, fps: 18, loop: true, draw(p, u, i) {
    for (let k = 0; k < 9; k++) { const y = -36 + rnd(k + i * 9) * 44, x0 = -70 + rnd(k + 3 + i) * 40, L = 30 + rnd(k + 7) * 50; p.line(x0, y, x0 + L, y, k % 3 ? WIND : hex("#ffffff"), 0.8); }
  } },
  // a cut landing: a crescent flash
  cut: { cw: 100, ch: 100, ox: 50, oy: 70, frames: 6, fps: 20, draw(p, u) {
    const a = 1 - u;
    for (let t = -1.2; t <= 1.2; t += 0.03) { const r = 22 + 8 * u; p.blend(Math.cos(t) * r * 0.6 + 5, -30 + Math.sin(t) * r, hex("#ffffff"), a); p.blend(Math.cos(t) * (r - 2) * 0.6 + 5, -30 + Math.sin(t) * (r - 2), hex("#c8f0ff"), a * 0.8); }
  } },
  // debris flung by the wind: leaves, splinters, dust
  debris: { cw: 160, ch: 130, ox: 80, oy: 110, frames: 9, fps: 16, draw(p, u) {
    for (let c = 0; c < 14; c++) {
      const a = -Math.PI * (0.1 + 0.8 * rnd(c)), v = 30 + 50 * rnd(c + 4), x = Math.cos(a) * v * u + Math.sin(u * 8 + c) * 4, y = Math.sin(a) * v * u + 40 * u * u - 10;
      p.rect(x, y, 2 + (c % 2), 1 + (c % 3 === 0), c % 3 ? hex("#6a9a3a") : hex("#8a6a40"), 1 - u);
    }
    blendDisc(p, 0, -10, 8 + 20 * u, hex("#c8b8a0"), 0.35 * (1 - u));
  } },
  smoke: { cw: 120, ch: 110, ox: 60, oy: 90, frames: 8, fps: 18, draw(p, u) {
    for (let c = 0; c < 7; c++) {
      const a = (c / 7) * Math.PI * 2, r = 4 + 22 * ease(u), s = 8 + 6 * Math.sin(Math.min(1, u * 1.5) * Math.PI * 0.8);
      blendDisc(p, Math.cos(a) * r, -20 + Math.sin(a) * r * 0.6 - 10 * u, s, SM2, 1 - u * u);
      blendDisc(p, Math.cos(a) * r - 1, -21 + Math.sin(a) * r * 0.6 - 10 * u, s * 0.7, SM1, 1 - u * u);
    }
  } },
  // ---- on the floor (image x = along the path, y = across; pivot at the path's start)
  // the wind's corridor: his reach either side of his line, streaks running along it (the tell)
  path: { ground: true, cw: Math.ceil(Lpx) + 20, ch: Math.ceil(Wpx * 2) + 10, ox: 6, oy: Math.ceil(Wpx) + 5, frames: 4, fps: 12, loop: true, draw(p, u) {
    for (let x = 0; x <= Lpx; x += 1) { p.blend(x, -Wpx, WIND2, 0.7); p.blend(x, Wpx, WIND2, 0.7); }
    for (let y = -Wpx + 1; y < Wpx; y++) for (let x = 0; x <= Lpx; x += 1) p.blend(x, y, WIND, 0.12);
    for (let k = 0; k < 14; k++) {
      const y = -Wpx + 4 + rnd(k) * (Wpx * 2 - 8), x0 = ((rnd(k + 5) + u) % 1) * Lpx, L = 18 + rnd(k + 2) * 24;
      for (let x = x0; x < Math.min(Lpx, x0 + L); x++) p.blend(x, y, hex("#ffffff"), 0.6);
    }
  } },
  // the cuts left in the ground along the path
  scar: { ground: true, cw: Math.ceil(Lpx) + 20, ch: Math.ceil(Wpx * 2) + 10, ox: 6, oy: Math.ceil(Wpx) + 5, frames: 1, fps: 1, draw(p) {
    for (let k = 0; k < 22; k++) {
      const x = 8 + (k / 22) * (Lpx - 16), y = (rnd(k) - 0.5) * Wpx * 1.4, a = (rnd(k + 3) - 0.5) * 1.6 + 0.6, L = 8 + rnd(k + 6) * 10;
      p.line(x - Math.cos(a) * L, y - Math.sin(a) * L, x + Math.cos(a) * L, y + Math.sin(a) * L, hex("#3a2c20"), 0.85);
      p.line(x - Math.cos(a) * L, y - Math.sin(a) * L + 1, x + Math.cos(a) * L, y + Math.sin(a) * L + 1, hex("#a08460"), 0.6);
    }
  } },
};
export const PREFIX = "km_";
export { KAMATARI };

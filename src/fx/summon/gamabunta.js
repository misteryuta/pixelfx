// SUMMON: Naruto Uzumaki (Final Valley, Classic), slot 3 "Gamabunta". The technique is Gamabunta's own Toad Sword
// Beheading (Gamadosuzan, Manga 135 / Anime 78, Konoha Crush): using the strength of his hips and legs a toad leaps
// precisely at the target, from far away to close range in one jump, and swings the sword before the target can
// react, putting the leap's power into the cut; Gamabunta's cut took off Shukaku's arm (Narutopedia, Tō no Sho p. 206).
// Behaviour here, readable before any name appears:
//   seal    Naruto's palm on the ground; the summoning formula runs out from it
//   appear  a big cloud of smoke behind him, Gamabunta sitting in it, facing the way Naruto faces
//   crouch  he turns to the target (one of four ways: the way he will cut) and squats down on his hind legs: the tell;
//           while he crouches he follows a moving target; a target that leaves is aimed at where it was last seen
//   air     the leap over Naruto: an arc with his own height (the shadow stays on the floor), the landing ring shows
//           where he comes down; aimed so the target ends up in the middle of the sword's reach
//   land    he comes down hard (anything under him is crushed and thrown out), dust, cracks
//   draw    the right hand pulls the dosu from his left hip
//   slash   one sweep from his left to his right; the blade's sweep on the ground is the hit zone, frame by frame
//   follow  the cut held; on a miss he turns his head to look for the target, then leaves in smoke
// The toad is a 3D rig (src/fx/summon/_toad.js) baked in side / front / back.
import { BUNTA, drawToad, swordAt } from "./_toad.js";
import { hex, mix } from "../../core/index.js";

const SPP = 10.7 / 72;
const DEG = Math.PI / 180;
const ease = (u) => 1 - (1 - u) ** 3;
const W = BUNTA.slash, K = BUNTA.k;

// the toad's animations: pose(u) for drawToad; frames over 0..1
export const ANIMS = {
  sit: { frames: 4, fps: 4, loop: true, pose: (u) => ({ breathe: 0.5 + 0.5 * Math.sin(u * Math.PI * 2) }) },
  crouch: { frames: 4, fps: 8, pose: (u) => ({ crouch: ease(u), headPitch: -0.12 * u }) },
  leap: { frames: 3, fps: 10, pose: (u) => ({ air: true, stretch: 0.4 + 0.6 * u, bp: 0.42 + 0.5 * u, headPitch: 0.1 }) },
  air: { frames: 2, fps: 6, loop: true, pose: (u) => ({ air: true, tuck: 0.85 + 0.15 * u, bp: 0.36 }) },
  fall: { frames: 2, fps: 8, pose: (u) => ({ air: true, reach: 0.6 + 0.4 * u, bp: 0.26 - 0.1 * u, headPitch: -0.05 }) },
  land: { frames: 3, fps: 10, pose: (u) => ({ squash: 1 - 0.7 * u }) },
  draw: { frames: 5, fps: 14, pose: (u) => ({ crouch: 0.3, sword: u < 0.2 ? { mode: "grip" } : { mode: "draw", d: (u - 0.2) / 0.8 } }) },
  slash: { frames: 7, fps: 28, pose: (u, i, n) => {
    const at = (v) => W.from + (W.to - W.from) * v;
    return { crouch: 0.3, headYaw: -at(u) * 0.12, sword: { mode: "slash", phi: at(u), prev: i > 0 ? at((i - 1) / (n - 1)) : undefined } };
  } },
  look: { frames: 6, fps: 6, loop: true, pose: (u) => ({ crouch: 0.2, headYaw: 0.5 * Math.sin(u * Math.PI * 2), sword: { mode: "slash", phi: W.to } }) },
};
export const VIEWS = ["side", "front", "back"];
export const RIGS = [{ book: "toad_gamabunta", S: BUNTA, draw: drawToad, pitch: 0.36 }];

// ---- the move's numbers (studs, seconds): the sword's sweep comes from the rig, so the hit zone is the drawn blade
const st = (px) => Math.round(px * K * SPP * 1000) / 1000;
const sword = { cf: st(W.cf), cr: st(W.cr), r: st(W.r), bIn: st(W.r + 8), bOut: st(W.r + 8 + W.blade), from: W.from, to: W.to };
export const MOVE = {
  id: "naruto-gamabunta-dosuzan", kind: "leap",
  variant: "classic/naruto-uzumaki-final-valley", slot: 3,
  seal: 0.4, appear: 0.6, crouch: 0.5, air: 0.8, land: 0.28, draw: 0.36, slash: 0.24, follow: 0.5, look: 0.9,
  spawnBack: 15,       // he appears this far behind Naruto (and jumps over him)
  spawnSide: 16,       // casts up / down the screen: beside him instead
  range: 60, cone: 60, // the target he is pointed at
  missRange: 30,       // nothing in the cone: he jumps out this far and cuts the air
  jumpH: 10,           // the leap's height (studs)
  minHop: 5,
  crushR: 8, crushDmg: 10,
  dmg: 16, kb: 9, kbT: 0.3, hitW: 2.2,
  sword, standOff: Math.round((sword.cf + sword.bIn + (sword.bOut - sword.bIn) * 0.5) * 100) / 100,
  dodge: { phase: "air", back: 15 }, // the dodge test: the target runs back when he leaves the ground
  cooldown: 6, lock: 0.4,
};

// ---- effects. Billboards (drawn as seen by the stage camera) and floor decals (ground: true; drawn top-down, image x
// = his forward, image y = his right, 1 px = 1 SPP on the floor; the game lays them flat and turns them)
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SM1 = hex("#f4f2f6"), SM2 = hex("#cfcbd8"), SM3 = hex("#9e98ac");
const DUST = hex("#c2a47c"), DUSTD = hex("#8a7050"), CRACK = hex("#2a2018"), INK = hex("#1e1622");
// a translucent filled ellipse (real alpha, not the painter's dither): floor shadows
const blendEllipse = (p, cx, cy, rx, ry, c, a) => { for (let y = -Math.ceil(ry); y <= ry; y++) for (let x = -Math.ceil(rx); x <= rx; x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) p.blend(cx + x, cy + y, c, a); };
// a translucent disc (real alpha): smoke and dust puffs without the dither pattern
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const sw = { cf: W.cf * K, cr: W.cr * K, i: (W.r + 8) * K, o: (W.r + 8 + W.blade) * K };
export const FX = {
  // the summoning cloud: big puffs boiling out and up, then thinning (also when he leaves)
  bigsmoke: { cw: 360, ch: 300, ox: 180, oy: 250, frames: 12, fps: 18, draw(p, u) {
    const a = 1 - Math.max(0, (u - 0.55) / 0.45);
    for (let c = 0; c < 16; c++) {
      const ang = rnd(c) * Math.PI * 2, rr = (40 + 90 * rnd(c + 5)) * (0.35 + 0.65 * ease(Math.min(1, u * 1.6)));
      const x = Math.cos(ang) * rr * 1.15, y = -70 + Math.sin(ang) * rr * 0.55 - 60 * u * rnd(c + 9);
      const s = (22 + 26 * rnd(c + 2)) * (0.5 + 0.5 * Math.min(1, u * 2.2));
      if (a >= 0.99) { p.circle(x, y + 3, s + 2, SM3); p.circle(x, y, s, SM2); p.circle(x - s * 0.25, y - s * 0.25, s * 0.7, SM1); }
      else { blendDisc(p, x, y + 3, s + 2, SM3, a * 0.9); blendDisc(p, x, y, s, SM2, a); blendDisc(p, x - s * 0.25, y - s * 0.25, s * 0.7, SM1, a); }
    }
  } },
  // dust thrown out sideways (take-off, landing): low clouds rolling outward, a few stones
  dust: { cw: 400, ch: 170, ox: 200, oy: 130, frames: 10, fps: 18, draw(p, u) {
    const a = 1 - u * u;
    for (let c = 0; c < 14; c++) {
      const side = c % 2 ? 1 : -1, d = (40 + 120 * ease(u)) * (0.6 + 0.4 * rnd(c)), y = -8 - 20 * rnd(c + 3) * u;
      const s = 12 + 18 * rnd(c + 7) * (0.5 + u);
      blendDisc(p, side * d, y, s + 1, DUSTD, a * 0.7);
      blendDisc(p, side * d - 2, y - 2, s, DUST, a * 0.8);
    }
    for (let c = 0; c < 10; c++) {
      const side = c % 2 ? 1 : -1, v = 90 + 80 * rnd(c + 11), x = side * v * u * 1.3, y = -v * u + 160 * u * u;
      if (y < 2) p.rect(x, y, 3, 3, CRACK);
    }
  } },
  // the cut landing on the target: a white slash flash and sparks
  hit: { cw: 120, ch: 120, ox: 60, oy: 80, frames: 6, fps: 20, draw(p, u) {
    const a = 1 - u, L = 30 + 30 * u;
    p.line(-L, -30 + 10, L, -30 - 10, hex("#ffffff"), a);
    p.line(-L, -29 + 10, L, -29 - 10, hex("#bfe0ff"), a);
    for (let c = 0; c < 8; c++) { const t = (c / 8) * Math.PI * 2 + 0.3, r0 = 6 + 30 * u; p.line(Math.cos(t) * r0, -30 + Math.sin(t) * r0, Math.cos(t) * (r0 + 6), -30 + Math.sin(t) * (r0 + 6), hex("#ffe890"), a); }
  } },
  // ---- on the floor
  // the summoning formula: lines of script running out from the palm in five directions
  fseal: { ground: true, cw: 200, ch: 200, ox: 100, oy: 100, frames: 8, fps: 16, draw(p, u) {
    p.circle(0, 0, 7, INK, 0.9);
    for (let k = 0; k < 5; k++) {
      const t = (k / 5) * Math.PI * 2 + 0.3, reach = 18 + 70 * ease(u);
      for (let s = 10; s < reach; s += 6) p.rect(Math.cos(t) * s - 2, Math.sin(t) * s - 2, 4, 4, INK, 1 - s / 110);
    }
  } },
  // his shadow on the floor, smaller the higher he is (frame 1 = on the ground, 5 = at the top of the leap)
  shadow: { ground: true, cw: 220, ch: 240, ox: 110, oy: 120, frames: 5, fps: 1, draw(p, u) {
    const k = 1 - 0.45 * u;
    blendEllipse(p, 4, 0, 78 * k, 98 * k, hex("#16101c"), 0.42 - 0.12 * u);
  } },
  // where he will come down: a ring the size of his body (the crush), pulsing
  zone: { ground: true, cw: 140, ch: 140, ox: 70, oy: 70, frames: 6, fps: 12, loop: true, draw(p, u) {
    const R = 8 / SPP, k = 0.94 + 0.06 * Math.sin(u * Math.PI * 2);
    p.ring(0, 0, R * k, 3, hex("#3a1e1a"), 0.85);
    p.ring(0, 0, R * k - 4, 1, hex("#e8d0a0"), 0.6);
    for (let c = 0; c < 4; c++) { const t = c * Math.PI / 2 + 0.785; p.line(Math.cos(t) * R * 0.2, Math.sin(t) * R * 0.2, Math.cos(t) * R * 0.6, Math.sin(t) * R * 0.6, hex("#3a1e1a"), 0.7); }
  } },
  // the ground broken where he landed
  crack: { ground: true, cw: 240, ch: 240, ox: 120, oy: 120, frames: 1, fps: 1, draw(p) {
    blendEllipse(p, 0, 0, 70, 80, hex("#4a3828"), 0.35);
    for (let c = 0; c < 14; c++) {
      const t = (c / 14) * Math.PI * 2 + rnd(c) * 0.3, r0 = 30 + 20 * rnd(c + 1), r1 = r0 + 30 + 50 * rnd(c + 2);
      const m = (r0 + r1) / 2, bend = (rnd(c + 3) - 0.5) * 0.4;
      p.line(Math.cos(t) * r0, Math.sin(t) * r0, Math.cos(t + bend) * m, Math.sin(t + bend) * m, CRACK, 0.9);
      p.line(Math.cos(t + bend) * m, Math.sin(t + bend) * m, Math.cos(t) * r1, Math.sin(t) * r1, CRACK, 0.7);
    }
  } },
  // the sword's sweep on the floor (the hit zone): frame 1 = the reach outlined before the cut; then frame by frame
  // with the toad's slash frames: the swept band pale, the blade's line bright
  arc: { ground: true, cw: 230, ch: 360, ox: 6, oy: 160, frames: 8, fps: 1, draw(p, u, i) {
    const at = (v) => W.from + (W.to - W.from) * v;
    const cur = i === 0 ? W.from : at((i - 1) / 6);
    const pt = (a, r) => [sw.cf + Math.cos(a) * r, sw.cr - Math.sin(a) * r];
    // the outline of the whole reach (dots)
    for (let a = W.to; a <= W.from; a += 1.2 * DEG) for (const r of [sw.i, sw.o]) { const [x, y] = pt(a, r); p.rect(x - 1, y - 1, 2, 2, hex("#fff2d0")); }
    for (const a of [W.from, W.to]) for (let r = sw.i; r <= sw.o; r += 5) { const [x, y] = pt(a, r); p.rect(x - 1, y - 1, 2, 2, hex("#fff2d0")); }
    if (i === 0) return;
    for (let a = cur; a <= W.from; a += 0.5 * DEG) {
      const age = (a - cur) / (W.from - W.to);
      for (let r = sw.i; r <= sw.o; r += 1.5) { const [x, y] = pt(a, r); const c = mix(hex("#ffffff"), hex("#9cc8ff"), Math.min(1, age * 3)), al = Math.max(0.12, 0.55 - age * 0.6); for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) p.blend(x + ox, y + oy, c, al); }
    }
    for (let r = sw.i; r <= sw.o; r += 1) { const [x, y] = pt(cur, r); p.rect(x - 1, y - 1, 3, 3, hex("#ffffff"), 0.95); }
  } },
};
export const PREFIX = "gb_";
export { BUNTA, swordAt };

// SUMMON: Jiraiya (Sage Mode, Shippuden) slot 3 "Frog Song Genjutsu" = Demonic Illusion: Toad Confrontation Chant
// (Magen: Gama Rinsho, Manga 379 / Anime Shippuden 132, against Pain): a sound genjutsu only the Two Great Sage Toads,
// Fukasaku and Shima, can sing. Finding the harmony takes time, and while they do it the opponents can tell where they
// are and what they are doing; once they sing, every opponent who hears it falls under it: in the illusion four toad
// samurai seal the victim's mind and movements inside a barrier of water. Afterwards their throats are strained
// (Narutopedia, Sha no Sho pp. 302-303).
//   seal      Jiraiya's summoning;  appear  a puff, the two toads on his shoulders (as in Sage Mode)
//   prep      they look for the harmony: rising notes, the song's reach shows on the floor and pulses (the tell:
//             whoever is inside when they find it is caught; get out)
//   sing      the song: everyone inside the reach is caught at once
//   hold      each one stands in a cube of water, four toad samurai round it, swords up: held
//   release   the song ends; the toads cough (strained throats), puff
import { FUKASAKU, SHIMA, drawSage } from "./_sagetoad.js";
import { hex } from "../../core/index.js";

const SPP = 10.7 / 72;
const ANIMS = {
  idle: { frames: 2, fps: 3, loop: true, pose: (u) => ({ sway: 0.05 * Math.sin(u * Math.PI * 2) }) },
  sing: { frames: 4, fps: 6, loop: true, pose: (u) => ({ sing: 0.7 + 0.3 * Math.sin(u * Math.PI * 2), sway: 0.25 * Math.sin(u * Math.PI * 2), lean: 0.6 }) },
  cough: { frames: 3, fps: 8, pose: (u) => ({ cough: Math.sin(u * Math.PI), sing: 0.3 * Math.sin(u * Math.PI) }) },
};
export { ANIMS };
export const VIEWS = ["side", "front", "back"];
export const RIGS = [
  { book: "sage_fukasaku", S: FUKASAKU, draw: drawSage, pitch: 0.36, anims: ANIMS },
  { book: "sage_shima", S: SHIMA, draw: drawSage, pitch: 0.36, anims: ANIMS },
];

export const MOVE = {
  id: "jiraiya-frog-song", kind: "song",
  variant: "shippuden/jiraiya-sage-mode", slot: 3,
  seal: 0.35, appear: 0.5, prep: 1.6, sing: 0.4, hold: 3.5, release: 0.6,
  ahead: 10, radius: 20,        // the song's reach: a circle this big, centred this far in front of Jiraiya
  dmg: 5,
  shoulderX: 2.6, shoulderPx: 34, // where the toads sit (to his left and right, at shoulder height)
  dodge: { phase: "prep", back: 18 }, // the dodge test: the target runs away from the song
  cooldown: 10, lockAll: true,
};

// ---- effects
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const SM1 = hex("#f4f2f6"), SM2 = hex("#cfcbd8"), NOTE1 = hex("#9a5ac8"), NOTE2 = hex("#6a9a40"), INK = hex("#1e1824");
const WAT = hex("#5ab0f0"), WATL = hex("#c8ecff"), WATD = hex("#2a6ab0");
const Rpx = 20 / SPP;
// a toad samurai (the illusion's guards): brown hair in a top-knot, a toad's face, blue armour, a sword held up
function samurai(p, x, y, face) {
  p.rect(x - 6, y - 14, 12, 14, hex("#2a4a8a")); p.rect(x - 6, y - 14, 12, 2, hex("#5a7ac8")); p.rect(x - 5, y - 9, 10, 1, hex("#1a2a5a"));
  p.rect(x - 7, y - 3, 14, 3, hex("#3a3a44"));
  p.ellipse(x, y - 20, 6, 5, hex("#c8b070")); p.rect(x - 4 + face, y - 21, 2, 2, INK); p.rect(x + 2 + face, y - 21, 2, 2, INK); p.rect(x - 3, y - 17, 6, 1, INK);
  p.ellipse(x, y - 25, 7, 3, hex("#6a4022")); p.rect(x - 1, y - 31, 3, 5, hex("#6a4022"));
  p.line(x + 7 * face, y - 8, x + 9 * face, y - 34, hex("#dfe4ee")); p.line(x + 8 * face, y - 8, x + 10 * face, y - 34, hex("#9aa2b4")); p.rect(x + 6 * face, y - 9, 4, 2, hex("#c8a040"));
}
export const FX = {
  puff: { cw: 90, ch: 80, ox: 45, oy: 62, frames: 8, fps: 18, draw(p, u) {
    for (let c = 0; c < 7; c++) {
      const a = (c / 7) * Math.PI * 2, r = 3 + 14 * (1 - (1 - u) ** 3), s = 6 + 4 * Math.sin(Math.min(1, u * 1.5) * Math.PI * 0.8);
      blendDisc(p, Math.cos(a) * r, -14 + Math.sin(a) * r * 0.6 - 6 * u, s, SM2, 1 - u * u);
      blendDisc(p, Math.cos(a) * r - 1, -15 + Math.sin(a) * r * 0.6 - 6 * u, s * 0.7, SM1, 1 - u * u);
    }
  } },
  // notes rising off the two singers (loop)
  notes: { cw: 120, ch: 120, ox: 60, oy: 100, frames: 8, fps: 10, loop: true, draw(p, u) {
    for (let c = 0; c < 6; c++) {
      const ph = (u + c / 6) % 1, x = (c % 2 ? 1 : -1) * (12 + 14 * ph) + Math.sin(ph * 7 + c) * 5, y = -10 - ph * 80, col = c % 2 ? NOTE1 : NOTE2, a = 1 - ph;
      p.ellipse(x, y, 5, 3.6, INK, a); p.ellipse(x, y, 4, 2.6, col, a); p.rect(x + 3, y - 15, 2, 15, INK, a); if (c % 3 === 0) { p.rect(x + 3, y - 15, 8, 2, INK, a); p.rect(x + 9, y - 13, 2, 4, INK, a); }
    }
  } },
  // the four toad samurai round the victim: the two behind it and the two in front
  samuraiBack: { cw: 120, ch: 90, ox: 60, oy: 70, frames: 1, fps: 1, draw(p) { samurai(p, -26, -6, 1); samurai(p, 26, -6, -1); } },
  samuraiFront: { cw: 120, ch: 90, ox: 60, oy: 70, frames: 1, fps: 1, draw(p) { samurai(p, -30, 14, 1); samurai(p, 30, 14, -1); } },
  // the water barrier: a cube of water round the victim (the far half and the near half), rippling
  waterBack: { cw: 90, ch: 110, ox: 45, oy: 90, frames: 4, fps: 8, loop: true, draw(p, u) {
    for (let y = -84; y <= -2; y++) for (let x = -30; x <= 30; x++) p.blend(x, y, WAT, 0.16 + 0.04 * Math.sin((y + u * 20) * 0.4));
    for (let x = -30; x <= 30; x++) { p.blend(x, -84, WATL, 0.8); p.blend(x, -2, WATD, 0.6); }
  } },
  waterFront: { cw: 90, ch: 110, ox: 45, oy: 90, frames: 4, fps: 8, loop: true, draw(p, u) {
    for (let y = -76; y <= 6; y++) for (let x = -34; x <= 34; x++) p.blend(x, y, WAT, 0.14);
    for (let y = -76; y <= 6; y++) { p.blend(-34, y, WATL, 0.9); p.blend(34, y, WATD, 0.9); }
    for (let x = -34; x <= 34; x++) { p.blend(x, -76, WATL, 0.9); p.blend(x, 6, WATD, 0.9); }
    for (let k = 0; k < 5; k++) { const y = -70 + ((k * 16 + u * 16) % 76); p.line(-28, y, -18, y - 3, WATL, 0.7); }
  } },
  // ---- floor: the song's reach (the tell while they search the harmony): a ring at its edge, waves running out
  reach: { ground: true, cw: Math.ceil(Rpx) * 2 + 12, ch: Math.ceil(Rpx) * 2 + 12, ox: Math.ceil(Rpx) + 6, oy: Math.ceil(Rpx) + 6, frames: 6, fps: 10, loop: true, draw(p, u) {
    for (let a = 0; a < Math.PI * 2; a += 0.004) {
      const x = Math.cos(a) * Rpx, y = Math.sin(a) * Rpx;
      p.blend(x, y, INK, 1); p.blend(x * 0.992, y * 0.992, INK, 0.8);
      if ((a * 40) % 2 < 1.2) p.blend(x * 0.98, y * 0.98, hex("#e8d8ff"), 0.95);
    }
    for (let k = 0; k < 3; k++) {
      const r = ((u + k / 3) % 1) * Rpx;
      for (let a = 0; a < Math.PI * 2; a += 0.01) p.blend(Math.cos(a) * r, Math.sin(a) * r, k % 2 ? NOTE1 : hex("#c8e0a0"), 0.55 * (1 - r / Rpx));
    }
  } },
};
export const PREFIX = "sg_";
export { FUKASAKU, SHIMA };

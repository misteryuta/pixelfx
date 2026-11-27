// SUMMON: Monkey King Enma with Hiruzen Sarutobi, two moves:
// Classic Hiruzen (Third Hokage) slot 2 "Monkey King Enma: Adamantine Staff" (Transformation: Adamantine Staff,
//   Henge: Kongonyoi, Manga 120 / Anime 71): Enma turns into a staff as hard as diamond for his summoner; it can
//   extend to great lengths (in the anime it pushed the Nine-Tails out of the village) (Narutopedia, To no Sho p. 272).
//   seal    Hiruzen's summoning
//   appear  Enma beside him in smoke, in monkey form
//   henge   Enma jumps to Hiruzen's hands: a puff, and Hiruzen holds the staff (both hands at the butt end)
//   aim     Hiruzen draws it back, turned to the target (he follows it): the tell
//   extend  the staff shoots out along that line; the TIP is the hit zone: what it reaches is carried along on the
//           tip to the full length (the push), then thrown off; the side of the staff does not hit
//   retract the staff comes back; a puff and Enma is gone
// Shippuden Hiruzen (Prime) slot 1 "Monkey King Enma: Adamantine Prison Wall" (Kongo Roheki, Manga 122 / Anime 72):
//   after the transformation Enma clones himself into a lattice box round a target; opponents cannot break it, it
//   holds them until Enma lets go (Narutopedia, To no Sho p. 223).
//   ... aim as above; the staff extends to the spot; there the clones drop in as posts and the bars slide home
//   (the cage); whoever is inside when it closes is held; the staff itself goes back to Hiruzen's hands.
import { ENMA, drawMonkey, drawCage } from "./_monkey.js";
import { hex } from "../../core/index.js";

const ease = (u) => 1 - (1 - u) ** 3;
const MONKEY = {
  idle: { frames: 4, fps: 6, loop: true, pose: (u) => ({ crouch: 0.3, breathe: 0.5 + 0.5 * Math.sin(u * Math.PI * 2), headYaw: 0.15 * Math.sin(u * Math.PI * 2) }) },
  hop: { frames: 4, fps: 12, pose: (u) => ({ crouch: u < 0.34 ? 1 : 0, lift: u < 0.34 ? 0 : 20 * Math.sin(((u - 0.34) / 0.66) * Math.PI * 0.8), reach: u < 0.34 ? 0 : 1 }) },
};
const CAGE = {
  form: { frames: 6, fps: 20, pose: (u) => ({ u: ease(u) }) },
  hold: { frames: 1, fps: 1, pose: () => ({ u: 1 }) },
};
export const ANIMS = MONKEY;
export const VIEWS = ["side", "front", "back"];
const cageDraw = (layer) => (cv, S, pose) => drawCage(cv, S, { ...pose, layer });
export const RIGS = [
  { book: "monkey_enma", S: ENMA, draw: drawMonkey, pitch: 0.36, anims: MONKEY },
  { book: "cage_back", S: ENMA, draw: cageDraw("back"), pitch: 0.36, anims: CAGE, views: ["side"] },
  { book: "cage_front", S: ENMA, draw: cageDraw("front"), pitch: 0.36, anims: CAGE, views: ["side"] },
];

const common = {
  seal: 0.3, appear: 0.5, henge: 0.35, aim: 0.35,
  side: 5.5,                 // Enma appears this far to Hiruzen's side (clear of him: at 3.5 the summoner hid half of him)
  grip: 0.8,                 // the staff's butt is this far in front of Hiruzen
  L0: 4.5,                   // the staff's length in his hands
  speed: 62, retract: 85,    // studs/s out and back
  handPx: 30,                // the staff at Hiruzen's hand height (sprite px above the feet)
  range: 40, cone: 50, missRange: 30,
  release: 0.35, cooldown: 6, lockAll: true,
};
export const MOVES = [
  { ...common, id: "hiruzen-enma-staff", kind: "staff", mode: "thrust",
    variant: "classic/hiruzen-sarutobi-third-hokage", slot: 2,
    Lmax: 30, hold: 0.25, hitW: 1.8, dmg: 14, kb: 4, kbT: 0.25,
    dodge: { phase: "extend", side: 4 } },
  { ...common, id: "hiruzen-enma-prison", kind: "staff", mode: "prison",
    variant: "shippuden/hiruzen-sarutobi-prime-flashback", slot: 1,
    Lmax: 34, cageH: 3.4, cageHt: 9, form: 0.3, bind: 3.0, empty: 0.6, dmg: 4,
    dodge: { phase: "extend", side: 7 } },
];

// ---- effects (billboards). The staff is drawn as pieces along its line (each turned to the line's angle on screen):
// a grip (Hiruzen's two gloved fists at the butt end, its golden cap), shaft pieces, the golden tip.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const SM1 = hex("#f4f2f6"), SM2 = hex("#cfcbd8"), SM3 = hex("#9e98ac");
const BLK = hex("#24222a"), BLKL = hex("#4a4854"), BLKD = hex("#141218"), OUT = hex("#0c0a10");
const GLD = hex("#d8b048"), GLDL = hex("#f4d878"), GLDD = hex("#8a6a20");
const shaft = (p, x0, x1) => {
  p.rect(x0, -5, x1 - x0, 1, OUT); p.rect(x0, 4, x1 - x0, 1, OUT);
  p.rect(x0, -4, x1 - x0, 8, BLK); p.rect(x0, -3, x1 - x0, 1, BLKL); p.rect(x0, 2, x1 - x0, 2, BLKD);
};
const cap = (p, x0, w) => {
  p.rect(x0 - 1, -6, w + 2, 12, OUT);
  p.rect(x0, -5, w, 10, GLD); p.rect(x0, -4, w, 2, GLDL); p.rect(x0, 2, w, 3, GLDD);
};
export const FX = {
  smoke: { cw: 170, ch: 150, ox: 85, oy: 126, frames: 10, fps: 18, draw(p, u) {
    const a = 1 - Math.max(0, (u - 0.5) / 0.5);
    for (let c = 0; c < 10; c++) {
      const ang = rnd(c) * Math.PI * 2, rr = (16 + 40 * rnd(c + 5)) * (0.35 + 0.65 * ease(Math.min(1, u * 1.6)));
      const x = Math.cos(ang) * rr, y = -34 + Math.sin(ang) * rr * 0.6 - 30 * u * rnd(c + 9);
      const s = (12 + 12 * rnd(c + 2)) * (0.5 + 0.5 * Math.min(1, u * 2.2));
      blendDisc(p, x, y + 2, s + 2, SM3, a * 0.9); blendDisc(p, x, y, s, SM2, a); blendDisc(p, x - s * 0.25, y - s * 0.25, s * 0.7, SM1, a);
    }
  } },
  puff: { cw: 80, ch: 70, ox: 40, oy: 40, frames: 8, fps: 18, draw(p, u) {
    for (let c = 0; c < 7; c++) {
      const a = (c / 7) * Math.PI * 2, r = 3 + 14 * ease(u), s = 6 + 4 * Math.sin(Math.min(1, u * 1.5) * Math.PI * 0.8);
      blendDisc(p, Math.cos(a) * r, Math.sin(a) * r * 0.7 - 4 * u, s, SM2, 1 - u * u);
      blendDisc(p, Math.cos(a) * r - 1, Math.sin(a) * r * 0.7 - 1 - 4 * u, s * 0.7, SM1, 1 - u * u);
    }
  } },
  // the staff pieces (pivot = the piece's centre; the game turns them)
  shaft: { cw: 30, ch: 14, ox: 15, oy: 7, frames: 1, fps: 1, draw(p) { shaft(p, -15, 15); } },
  tip: { cw: 30, ch: 16, ox: 15, oy: 8, frames: 1, fps: 1, draw(p) { shaft(p, -15, 4); cap(p, 4, 9); p.rect(13, -4, 1, 8, OUT); } },
  // Hiruzen's grip: the golden butt cap, two fists in black gloves with a metal plate, on the shaft
  grip: { cw: 40, ch: 22, ox: 20, oy: 11, frames: 1, fps: 1, draw(p) {
    shaft(p, -14, 20); cap(p, -20, 7);
    for (const x of [-9, 5]) {
      p.rect(x - 1, -8, 10, 16, OUT); p.rect(x, -7, 8, 14, hex("#2c2a32")); p.rect(x, -7, 8, 3, hex("#46444e"));
      p.rect(x + 2, -5, 4, 4, hex("#9aa0ac")); p.rect(x + 2, -5, 4, 1, hex("#d0d4dc"));
      for (let y = -2; y <= 5; y += 2.5) p.rect(x, y, 8, 1, hex("#1a181e"));
    }
  } },
  // the tip striking: a white flash and sparks
  hit: { cw: 90, ch: 90, ox: 45, oy: 45, frames: 6, fps: 20, draw(p, u) {
    const a = 1 - u;
    blendDisc(p, 0, 0, 6 + 14 * u, hex("#ffffff"), 0.6 * a);
    for (let c = 0; c < 10; c++) { const t = (c / 10) * Math.PI * 2 + 0.2, r0 = 6 + 24 * u; p.line(Math.cos(t) * r0, Math.sin(t) * r0, Math.cos(t) * (r0 + 7), Math.sin(t) * (r0 + 7), c % 2 ? hex("#ffe890") : hex("#ffffff"), a); }
  } },
};
export const PREFIX = "en_";
export { ENMA };

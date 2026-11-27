// SUMMON: Danzo Shimura (Izanagi / Sharingan Arm, Shippuden) slot 3 "Summoning: Baku" (Manga 479, Five Kage Summit,
// against Sasuke): the Baku opens its mouth and inhales, a suction that pulls in everything in its path, while it
// blows out through its trunk; strong enough to pin Sasuke's Susanoo in place (Narutopedia, Baku: Abilities).
//   seal    Danzo's summoning
//   appear  smoke, the Baku behind him (beside him for a cast up or down the screen), facing the way he faces
//   brace   it turns to the target (following it) and shuffles sideways till its mouth is in line, dropping low,
//           splaying its front legs, digging its claws in; the dust already starts to stream toward its mouth
//   draw    the cone is fixed now, the dust streams in hard: the suction's direction shows early (the tell; step out!)
//   suck    mouth wide, trunk up and blowing: everyone in the cone is caught and dragged to the mouth, held there, worn
//           down; whoever is caught stays caught (being pulled across the line does not free you)
//   release it closes its mouth, lets go; smoke
import { BAKU, drawBaku, bakuPoints, Canvas } from "./_baku.js";
import { hex } from "../../core/index.js";

const SPP = 10.7 / 72;
const ease = (u) => 1 - (1 - u) ** 3;
export const ANIMS = {
  idle: { frames: 4, fps: 5, loop: true, pose: (u) => ({ breathe: 0.5 + 0.5 * Math.sin(u * Math.PI * 2) }) },
  brace: { frames: 4, fps: 8, pose: (u) => ({ brace: ease(u), mouth: 0.15 * u }) },
  suck: { frames: 4, fps: 10, loop: true, pose: (u) => ({ brace: 1, lean: 0.9 + 0.1 * Math.sin(u * Math.PI * 2), mouth: 0.9 + 0.1 * Math.sin(u * Math.PI * 4), trunkUp: 1 }) },
  release: { frames: 3, fps: 8, pose: (u) => ({ brace: 1 - u, lean: 1 - u, mouth: 1 - u, trunkUp: 1 - u }) },
};
export const VIEWS = ["side", "front", "back"];
export const RIGS = [{ book: "baku", S: BAKU, draw: drawBaku, pitch: 0.36, anims: ANIMS }];

// where the mouth and the trunk's tip are while it inhales (from the rig)
const suckPose = ANIMS.suck.pose(0);
const mouth = bakuPoints(BAKU, suckPose).mouth;
const tip = drawBaku(new Canvas(4, 4, 2, 2, "side", 0.36), BAKU, suckPose).trunkTip;
const r2 = (v) => Math.round(v * 100) / 100;
const mouthF = r2(mouth[0] * SPP);

export const MOVE = {
  id: "danzo-baku-suction", kind: "suck",
  variant: "shippuden/danzo-shimura-izanagi-sharingan-arm", slot: 3,
  seal: 0.35, appear: 0.6, brace: 0.4, draw: 0.45, suck: 2.4, release: 0.4,
  align: 40,                   // studs/s it shuffles sideways while it braces, to bring its mouth in line with the target
  mouthF, mouthH: r2(mouth[1] * SPP), tipF: r2(tip[0] * SPP), tipPx: Math.round(tip[1]),
  spawnBack: r2(mouthF - 3),   // its mouth ends up just in front of Danzo (it looms over him)
  spawnSide: 10,               // casts up / down the screen: beside him
  range: 32, cone: 20,         // the suction: from the mouth, this far, +-this many degrees
  acqRange: 45, acqCone: 50,   // which target it turns to
  pull: 11, ramp: 0.5,         // studs/s toward the mouth, reached after ramp s
  stopR: 3,                    // held this far in front of the mouth
  dot: 4, kb: 4, kbT: 0.25,
  dodge: { phase: "draw", side: 13 }, // the dodge test: the target steps out once the cone is fixed
  cooldown: 8, lock: 0.35,
};

// ---- effects
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const SM1 = hex("#f4f2f6"), SM2 = hex("#cfcbd8"), SM3 = hex("#9e98ac"), DUST = hex("#c8b48c"), DUSTD = hex("#8a7450"), CRACK = hex("#2a2018");
const Rpx = 32 / SPP, TAN = Math.tan(20 * Math.PI / 180);
export const FX = {
  bigsmoke: { cw: 400, ch: 320, ox: 200, oy: 270, frames: 12, fps: 18, draw(p, u) {
    const a = 1 - Math.max(0, (u - 0.55) / 0.45);
    for (let c = 0; c < 16; c++) {
      const ang = rnd(c) * Math.PI * 2, rr = (40 + 110 * rnd(c + 5)) * (0.35 + 0.65 * ease(Math.min(1, u * 1.6)));
      const x = Math.cos(ang) * rr * 1.2, y = -70 + Math.sin(ang) * rr * 0.5 - 60 * u * rnd(c + 9);
      const s = (24 + 28 * rnd(c + 2)) * (0.5 + 0.5 * Math.min(1, u * 2.2));
      blendDisc(p, x, y + 3, s + 2, SM3, a * 0.9); blendDisc(p, x, y, s, SM2, a); blendDisc(p, x - s * 0.25, y - s * 0.25, s * 0.7, SM1, a);
    }
  } },
  // the trunk blowing: puffs rising off its tip (loop)
  plume: { cw: 120, ch: 160, ox: 60, oy: 150, frames: 6, fps: 12, loop: true, draw(p, u) {
    for (let c = 0; c < 8; c++) {
      const ph = (u + c / 8) % 1, x = Math.sin(c * 2.3 + ph * 3) * 10 * ph, y = -6 - ph * 130, s = 6 + 18 * ph;
      blendDisc(p, x, y, s, SM2, 0.8 * (1 - ph)); blendDisc(p, x - 2, y - 2, s * 0.7, SM1, 0.8 * (1 - ph));
    }
  } },
  // grit and pebbles whirling into the mouth (loop)
  debris: { cw: 140, ch: 120, ox: 70, oy: 90, frames: 6, fps: 14, loop: true, draw(p, u) {
    for (let c = 0; c < 18; c++) {
      const ph = (u + rnd(c)) % 1, a = rnd(c + 3) * Math.PI * 2, r = 60 * (1 - ph);
      const x = Math.cos(a + ph * 2) * r, y = -30 + Math.sin(a + ph * 2) * r * 0.5;
      p.rect(x, y, 1 + (c % 2), 1 + (c % 2), c % 3 ? DUST : DUSTD, 0.9);
    }
  } },
  // ---- on the floor (image x = forward from the mouth, y = across)
  // the suction's cone: its edges, dust streaming in toward the apex (the tell while it braces; the catch zone while
  // it inhales: the same cone the server checks)
  cone: { ground: true, cw: Math.ceil(Rpx) + 16, ch: Math.ceil(Rpx * TAN) * 2 + 16, ox: 6, oy: Math.ceil(Rpx * TAN) + 8, frames: 6, fps: 12, loop: true, draw(p, u) {
    // a dark shade inside, dark edges with a pale inner line (reads on sand and on grass alike)
    for (let x = 4; x <= Rpx; x += 1) { const w = x * TAN; for (let y = -w + 2; y < w - 1; y += 1) p.blend(x, y, hex("#3a2818"), 0.14); }
    for (let x = 0; x <= Rpx; x += 1) { const w = x * TAN; for (const e of [-1, 1]) { p.blend(x, e * w, hex("#2a1c10"), 1); p.blend(x, e * w + e, hex("#2a1c10"), 0.8); if (x % 8 < 5) p.blend(x, e * w - e, hex("#fff4dc"), 0.9); } }
    // dust and grit streaming in toward the mouth: white streaks with a dark shadow under them
    for (let k = 0; k < 40; k++) {
      const ph = (rnd(k) + u) % 1, x0 = Rpx * (1 - ph), lane = (rnd(k + 9) - 0.5) * 1.8, L = 10 + 14 * rnd(k + 4);
      for (let t = 0; t < L; t++) { const x = x0 + t, w = x * TAN * lane; if (x < Rpx) { p.blend(x, w + 1, hex("#2a1c10"), 0.7 * (1 - t / L)); p.blend(x, w, t < 4 ? hex("#ffffff") : hex("#f0e0c0"), 0.95 * (1 - t / L)); } }
    }
  } },
  // the claws dug into the ground under its front paws (pivot at its centre)
  claws: { ground: true, cw: 260, ch: 280, ox: 70, oy: 140, frames: 1, fps: 1, draw(p) {
    for (const s of [1, -1]) {
      const cx = 112, cy = s * 86;
      for (let c = 0; c < 9; c++) { const a = (c / 9) * Math.PI * 2 + rnd(c) * 0.4, r1 = 10 + 18 * rnd(c + 2); p.line(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, CRACK, 0.9); }
      for (let c = -1; c <= 1; c++) p.line(cx + 4, cy + c * 9, cx + 22, cy + c * 10, CRACK, 0.9);
    }
  } },
  shadow: { ground: true, cw: 320, ch: 220, ox: 160, oy: 110, frames: 1, fps: 1, draw(p) {
    for (let y = -95; y <= 95; y++) for (let x = -140; x <= 150; x++) if ((x / 145) ** 2 + (y / 95) ** 2 <= 1) p.blend(x, y, hex("#16101c"), 0.38);
  } },
};
export const PREFIX = "bk_";
export { BAKU };

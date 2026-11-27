// SUMMON: Madara Uchiha (Uchiha Clan Leader, flashback, Shippuden) slot 3 "Nine-Tails Summoning": after leaving Konoha
// Madara found Kurama and controlled it with his Sharingan to fight Hashirama at what became the Valley of the End
// (Manga 399, 620, 621, 626); there Kurama answered Hashirama's Wood Dragon with a Tailed Beast Ball (Manga 620 p. 14)
// (Narutopedia: Kurama; Valley of the End; Wood Release: Wood Dragon Technique). Madara already has the Perfect
// Susanoo in slot 1, so Kurama comes without the Susanoo armour here (one Susanoo move per base set).
//   seal    Madara's summoning
//   appear  smoke; Kurama behind Madara (beside him for a cast up or down the screen); its eyes turn to the Sharingan:
//           a red flash with the tomoe (the control)
//   charge  it drops to all fours, opens its jaws, chakra gathers into a black ball before its mouth; it follows the
//           target with its head
//   lock    the aim is fixed: the blast's ring shows on the floor where the ball will land (the tell: get out)
//   swallow it gulps the ball;  fire  the ball shoots from its mouth to the ring
//   blast   a dome of light and a shock ring: everyone inside is hit and thrown back; a scorched crater stays
import { KURAMA, drawFox, foxMouth, Canvas } from "./_fox.js";
import { hex, mix } from "../../core/index.js";

const SPP = 10.7 / 72;
const ease = (u) => 1 - (1 - u) ** 3;
const lerp = (a, b, u) => a + (b - a) * u;
export const ANIMS = {
  idle: { frames: 4, fps: 5, loop: true, pose: (u) => ({ tails: u }) },
  charge: { frames: 4, fps: 8, loop: true, pose: (u) => ({ crouch: 1, mouth: 0.7 + 0.1 * Math.sin(u * Math.PI * 2), tails: u * 2 }) },
  swallow: { frames: 2, fps: 8, pose: (u) => ({ crouch: 1, mouth: lerp(1, 0.1, u), tails: 0.3 }) },
  fire: { frames: 3, fps: 10, pose: (u) => ({ crouch: 1, mouth: 1, recoil: 1 - u, tails: 0.6 }) },
  recover: { frames: 3, fps: 6, pose: (u) => ({ crouch: 1 - ease(u), mouth: 0.3 * (1 - u), tails: u }) },
};
export const VIEWS = ["side", "front", "back"];
export const RIGS = [{ book: "fox_kurama", S: KURAMA, draw: drawFox, pitch: 0.36, anims: ANIMS }];

const mouth = foxMouth(KURAMA, { crouch: 1 });
const head = drawFox(new Canvas(4, 4, 2, 2, "side", 0.36), KURAMA, {}).head;
const r2 = (v) => Math.round(v * 100) / 100;
const mouthF = r2(mouth[0] * SPP);
export const MOVE = {
  id: "madara-kurama-bijuudama", kind: "beast",
  variant: "shippuden/madara-uchiha-uchiha-clan-leader-flashback", slot: 3,
  seal: 0.4, appear: 0.7, charge: 0.7, lock: 0.45, swallow: 0.25, after: 0.7,
  mouthF, mouthPx: Math.round(mouth[1] * 0.94), headF: r2(head[0] * SPP), headPx: Math.round(head[1] * 0.94),
  spawnBack: r2(mouthF - 3), spawnSide: 14,
  speed: 55, blastR: 7, dmg: 28, kb: 10, kbT: 0.35,
  range: 50, cone: 50, missRange: 34,
  dodge: { phase: "lock", side: 10 },
  cooldown: 10, lockCaster: 0.4,
};

// ---- effects
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const SM1 = hex("#f4f2f6"), SM2 = hex("#cfcbd8"), SM3 = hex("#9e98ac");
const BLK = hex("#120a14"), RIM = hex("#a01a40"), PUR = hex("#6a2a8a"), WHT = hex("#ffffff"), RED = hex("#e8241c");
const Bpx = 7 / SPP;
const ball = (p, x, y, r, u) => {
  blendDisc(p, x, y, r + 5, PUR, 0.35);
  blendDisc(p, x, y, r + 2, RIM, 0.9);
  p.circle(x, y, r, BLK);
  for (let k = 0; k < 5; k++) { const a = u * 6 + k * 1.26; p.rect(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, 2, 2, hex("#3a1a4a")); }
  p.rect(x - r * 0.4, y - r * 0.5, 3, 2, hex("#5a3a6a"));
};
export const FX = {
  bigsmoke: { cw: 460, ch: 360, ox: 230, oy: 300, frames: 12, fps: 18, draw(p, u) {
    const a = 1 - Math.max(0, (u - 0.55) / 0.45);
    for (let c = 0; c < 18; c++) {
      const ang = rnd(c) * Math.PI * 2, rr = (50 + 130 * rnd(c + 5)) * (0.35 + 0.65 * ease(Math.min(1, u * 1.6)));
      const x = Math.cos(ang) * rr * 1.2, y = -80 + Math.sin(ang) * rr * 0.5 - 70 * u * rnd(c + 9);
      const s = (28 + 32 * rnd(c + 2)) * (0.5 + 0.5 * Math.min(1, u * 2.2));
      blendDisc(p, x, y + 3, s + 2, SM3, a * 0.9); blendDisc(p, x, y, s, SM2, a); blendDisc(p, x - s * 0.25, y - s * 0.25, s * 0.7, SM1, a);
    }
  } },
  // the Sharingan taking hold: a red flash with three tomoe over its eyes
  eyes: { cw: 90, ch: 90, ox: 45, oy: 45, frames: 8, fps: 14, draw(p, u) {
    const a = u < 0.5 ? u * 2 : (1 - u) * 2, r = 10 + 18 * u;
    blendDisc(p, 0, 0, r, RED, 0.5 * a);
    p.circle(0, 0, 9, RED, a); p.circle(0, 0, 3, BLK, a);
    for (let k = 0; k < 3; k++) { const ang = k * 2.094 + u * 3; p.circle(Math.cos(ang) * 6, Math.sin(ang) * 6, 2, BLK, a); }
  } },
  // chakra gathering into the ball before its mouth (loop; the ball grows on the client)
  charge: { cw: 140, ch: 140, ox: 70, oy: 70, frames: 8, fps: 14, loop: true, draw(p, u) {
    for (let c = 0; c < 16; c++) {
      const ph = (u + rnd(c)) % 1, a = rnd(c + 7) * Math.PI * 2, r = 64 * (1 - ph);
      p.rect(Math.cos(a) * r, Math.sin(a) * r, 3, 3, c % 2 ? WHT : BLK, 0.9);
    }
    ball(p, 0, 0, 16, u);
  } },
  // the ball in flight (loop)
  ball: { cw: 80, ch: 80, ox: 40, oy: 40, frames: 4, fps: 16, loop: true, draw(p, u) { ball(p, 0, 0, 18, u); } },
  // the blast: a white-violet dome, then a dark shock ring of smoke
  blast: { cw: 360, ch: 280, ox: 180, oy: 220, frames: 11, fps: 18, draw(p, u) {
    const a = 1 - Math.max(0, (u - 0.5) / 0.5);
    const R = Bpx * (0.4 + 0.8 * ease(Math.min(1, u * 1.8)));
    for (let y = -R; y <= 0; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y * 1.3) / R; if (d <= 1) p.blend(x, y - 4, mix(WHT, hex("#c8a0ff"), d), a * (0.9 - 0.5 * d)); }
    for (let c = 0; c < 18; c++) { const ang = (c / 18) * Math.PI * 2, rr = R * 1.15 + 20 * u; blendDisc(p, Math.cos(ang) * rr, Math.sin(ang) * rr * 0.35 - 4, 10 + 10 * u, hex("#4a3a44"), 0.6 * (1 - u)); }
  } },
  // ---- floor: where the ball will land (the ring the size of the blast, pulsing, a dark red cross), and the crater
  zone: { ground: true, cw: Math.ceil(Bpx) * 2 + 14, ch: Math.ceil(Bpx) * 2 + 14, ox: Math.ceil(Bpx) + 7, oy: Math.ceil(Bpx) + 7, frames: 6, fps: 12, loop: true, draw(p, u) {
    const k = 0.94 + 0.06 * Math.sin(u * Math.PI * 2);
    for (let a = 0; a < Math.PI * 2; a += 0.01) { const x = Math.cos(a) * Bpx * k, y = Math.sin(a) * Bpx * k; p.blend(x, y, hex("#2a0810"), 1); p.blend(x * 0.98, y * 0.98, RED, 0.9); p.blend(x * 0.965, y * 0.965, RED, 0.5); }
    for (let y = -Bpx; y <= Bpx; y++) for (let x = -Bpx; x <= Bpx; x++) if (x * x + y * y <= Bpx * Bpx * 0.9) p.blend(x, y, RED, 0.1);
    p.line(-10, 0, 10, 0, RED); p.line(0, -10, 0, 10, RED);
  } },
  crater: { ground: true, cw: Math.ceil(Bpx) * 2 + 40, ch: Math.ceil(Bpx) * 2 + 40, ox: Math.ceil(Bpx) + 20, oy: Math.ceil(Bpx) + 20, frames: 1, fps: 1, draw(p) {
    for (let y = -Bpx - 10; y <= Bpx + 10; y++) for (let x = -Bpx - 10; x <= Bpx + 10; x++) { const d = Math.hypot(x, y) / Bpx; if (d <= 1.15) p.blend(x, y, hex("#1a1016"), d > 0.9 ? 0.35 : 0.55); }
    for (let c = 0; c < 16; c++) { const a = (c / 16) * Math.PI * 2 + rnd(c) * 0.3, r0 = Bpx * 0.9, r1 = Bpx * (1.2 + 0.3 * rnd(c + 1)); p.line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1, hex("#1a1016"), 0.8); }
  } },
  shadow: { ground: true, cw: 360, ch: 260, ox: 180, oy: 130, frames: 1, fps: 1, draw(p) {
    for (let y = -110; y <= 110; y++) for (let x = -160; x <= 170; x++) if ((x / 165) ** 2 + (y / 110) ** 2 <= 1) p.blend(x, y, hex("#16101c"), 0.36);
  } },
};
export const PREFIX = "kr_";
export { KURAMA };

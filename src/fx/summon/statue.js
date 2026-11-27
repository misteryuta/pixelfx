// SUMMON: Pain (Six Paths of Pain, Shippuden) slot 4 "Summoning: Gedo Statue" (Kuchiyose: Gedo Mazo, Manga 447 /
// Anime Shippuden 173): only the Rinnegan can summon it (also through the Six Paths of Pain); instead of blood it drains
// its summoner's life force: black receivers come out of its abdomen into the summoner's back; its mouth then lets out
// chakra in the form of a dragon that draws the target's chakra out (Narutopedia: Summoning: Demonic Statue of the
// Outer Path, Fourth Databook p. 247; Demonic Statue of the Outer Path).
//   seal    the summoning
//   rise    the statue rises out of the ground behind Pain (beside him for a cast up or down the screen), the black
//           receivers reach into his back (its price)
//   track   it turns to the target and follows it
//   lock    the bit falls, the jaws gape: the dragon's path is fixed and shows on the floor (the tell: step off it)
//   fly     the chakra dragon snakes out of its mouth along that path; its head takes whoever it reaches
//   coil    the dragon winds round the catch and draws its chakra out (held, worn down)
//   back    the dragon goes back into the mouth;  sink  the statue sinks into the ground
import { STATUE, drawStatue, Canvas } from "./_statue.js";
import { hex } from "../../core/index.js";

const SPP = 10.7 / 72;
const ease = (u) => 1 - (1 - u) ** 3;
const lerp = (a, b, u) => a + (b - a) * u;
export const ANIMS = {
  rise: { frames: 5, fps: 6, pose: (u) => ({ sink: 1 - ease(u) }) },
  idle: { frames: 4, fps: 5, loop: true, pose: (u) => ({ breathe: 0.5 + 0.5 * Math.sin(u * Math.PI * 2) }) },
  open: { frames: 3, fps: 8, pose: (u) => ({ mouth: ease(u), lean: ease(u) }) },
  roar: { frames: 4, fps: 8, loop: true, pose: (u) => ({ mouth: 0.9 + 0.1 * Math.sin(u * Math.PI * 2), lean: 1, breathe: u }) },
  sink: { frames: 4, fps: 6, pose: (u) => ({ sink: ease(u), mouth: lerp(1, 0.3, u), lean: 1 - u }) },
};
export const VIEWS = ["side", "front", "back"];
export const RIGS = [{ book: "statue_gedo", S: STATUE, draw: drawStatue, pitch: 0.36, anims: ANIMS }];

const probe = drawStatue(new Canvas(4, 4, 2, 2, "side", 0.36), STATUE, ANIMS.roar.pose(0));
const r2 = (v) => Math.round(v * 100) / 100;
const mouthF = r2(probe.mouth[0] * SPP);
export const MOVE = {
  id: "pain-gedo-dragon", kind: "dragon",
  variant: "shippuden/pain-six-paths-of-pain", slot: 4,
  seal: 0.4, rise: 0.9, track: 0.5, lock: 0.4, coil: 2.5, sink: 0.7,
  mouthF, mouthPx: Math.round(probe.mouth[1] * 0.94), chestF: r2(30 * SPP), chestPx: 60,
  spawnBack: r2(mouthF - 2), spawnSide: 14,
  speed: 30, Lmax: 34, W: 2.4, back: 60,
  drain: 8,
  range: 40, cone: 50,
  dodge: { phase: "lock", side: 6 },
  cooldown: 10, lockCaster: 0.4,
};

// ---- effects
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const G1 = hex("#e8dcff"), G2 = hex("#a890e0"), G3 = hex("#6a50b0"), BLK = hex("#141018"), DUST = hex("#a89078"), CRACK = hex("#2a2018");
const Wpx = 2.4 / SPP, Lpx = 34 / SPP;
export const FX = {
  // the ground breaking as it rises: dust thrown up, rocks
  rise: { cw: 420, ch: 220, ox: 210, oy: 170, frames: 10, fps: 12, draw(p, u) {
    const a = 1 - u * u;
    for (let c = 0; c < 18; c++) { const side = c % 2 ? 1 : -1, d = (60 + 140 * u) * (0.5 + 0.5 * rnd(c)), y = -10 - 50 * rnd(c + 3) * u; blendDisc(p, side * d, y, 14 + 18 * rnd(c + 7), DUST, 0.6 * a); }
    for (let c = 0; c < 12; c++) { const v = 80 + 90 * rnd(c + 11), x = (rnd(c) - 0.5) * 2 * v * u, y = -v * u * 1.2 + 140 * u * u; if (y < 4) p.rect(x, y, 4, 4, CRACK, a); }
  } },
  // the black receivers (a rod piece; pivot at the centre; the game turns them)
  receiver: { cw: 26, ch: 6, ox: 13, oy: 3, frames: 1, fps: 1, draw(p) { p.rect(-13, -1, 26, 2, BLK); p.rect(-13, -1, 26, 1, hex("#4a3a5a")); } },
  // the chakra dragon: a ghostly body piece, and its head (turned to its line)
  body: { cw: 30, ch: 22, ox: 15, oy: 11, frames: 4, fps: 12, loop: true, draw(p, u) {
    for (let x = -15; x <= 15; x++) { const w = 7 + Math.sin((x / 15 + u) * Math.PI * 2) * 1.5; for (let y = -w; y <= w; y++) p.blend(x, y, Math.abs(y) > w - 2 ? G3 : Math.abs(y) < 2 ? G1 : G2, 0.75); }
  } },
  head: { cw: 50, ch: 40, ox: 22, oy: 20, frames: 4, fps: 12, loop: true, draw(p, u) {
    for (let y = -14; y <= 14; y++) for (let x = -20; x <= 20; x++) { const d = (x / 20) ** 2 + (y / 14) ** 2; if (d <= 1) p.blend(x, y, d > 0.75 ? G3 : d < 0.25 ? G1 : G2, 0.85); }
    // jaws open toward +x, two eyes, horns swept back
    for (let x = 6; x <= 26; x++) { p.blend(x, -4 - (x - 6) * 0.3, G3, 0.9); p.blend(x, 4 + (x - 6) * 0.3 * (0.6 + 0.4 * Math.sin(u * 6)), G3, 0.9); }
    p.rect(2, -8, 3, 3, hex("#ffffff")); p.rect(2, 5, 3, 3, hex("#ffffff"));
    p.line(-8, -10, -24, -18, G2); p.line(-8, 10, -24, 18, G2);
  } },
  // wound round the catch: ghostly coils, and its chakra drawn out (rising sparks) (loop)
  coil: { cw: 90, ch: 110, ox: 45, oy: 96, frames: 6, fps: 12, loop: true, draw(p, u) {
    for (let k = 0; k < 3; k++) {
      const y = -20 - k * 16;
      for (let t = 0; t < Math.PI * 2; t += 0.04) { const x = Math.cos(t + u * 6 + k) * 20, yy = y + Math.sin(t + u * 6 + k) * 6; if (Math.sin(t + u * 6 + k) > -0.3) p.blend(x, yy, k % 2 ? G2 : G1, 0.8); }
    }
    for (let c = 0; c < 8; c++) { const ph = (u + rnd(c)) % 1; p.rect((rnd(c + 2) - 0.5) * 30, -20 - ph * 70, 2, 2, hex("#8ad8ff"), 1 - ph); }
  } },
  smoke: { cw: 300, ch: 220, ox: 150, oy: 180, frames: 10, fps: 14, draw(p, u) {
    for (let c = 0; c < 14; c++) { const ang = rnd(c) * Math.PI * 2, rr = (30 + 90 * rnd(c + 5)) * (0.4 + 0.6 * ease(u)); blendDisc(p, Math.cos(ang) * rr, -40 + Math.sin(ang) * rr * 0.4 - 40 * u, 16 + 18 * rnd(c + 2), DUST, 0.7 * (1 - u)); }
  } },
  // ---- floor: the dragon's path once it is fixed (purple, ghostly), a ring at its end
  lane: { ground: true, cw: Math.ceil(Lpx) + 16, ch: Math.ceil(Wpx) * 2 + 10, ox: 4, oy: Math.ceil(Wpx) + 5, frames: 4, fps: 10, loop: true, draw(p, u) {
    for (let x = 0; x <= Lpx; x++) {
      const on = ((x / 12 + u) % 1) < 0.65;
      for (const e of [-1, 1]) { p.blend(x, e * Wpx, hex("#2a1a40"), on ? 1 : 0.4); if (on) p.blend(x, e * (Wpx - 1), G1, 0.9); }
      for (let y = -Wpx + 2; y < Wpx - 1; y++) p.blend(x, y, G2, 0.14);
    }
  } },
  cracks: { ground: true, cw: 360, ch: 320, ox: 180, oy: 160, frames: 1, fps: 1, draw(p) {
    for (let c = 0; c < 20; c++) { const a = (c / 20) * Math.PI * 2 + rnd(c) * 0.3, r0 = 70 + 20 * rnd(c + 1), r1 = r0 + 40 + 50 * rnd(c + 2); p.line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1, CRACK, 0.9); }
    for (let y = -110; y <= 110; y++) for (let x = -140; x <= 140; x++) if ((x / 140) ** 2 + (y / 110) ** 2 <= 1) p.blend(x, y, hex("#16101c"), 0.3);
  } },
};
export const PREFIX = "gd_";
export { STATUE };

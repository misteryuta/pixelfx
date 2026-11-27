// SUMMON: Jiraiya (Sage Mode, Shippuden) slot 4 "Barrier: Toad Gourd Prison" (Kekkai: Gama Hyoro, Manga 381 /
// Anime Shippuden 133): a small gourd-shaped toad from Mount Myoboku; its tongue wraps whatever it reaches and drags it
// into the toad's stomach, a sealed chamber far larger than the toad with a lake of corrosive gastric acid; only the
// caster may come and go; the toad releases what it holds on command (Narutopedia, Sha no Sho p. 253).
// This is the Shippuden replacement for Jiraiya's Classic Toad Mouth Bind (no duplicate moves between eras).
//   seal    Jiraiya's summoning
//   appear  a puff beside him: the Gourd Toad, the stopper in its mouth
//   open    it turns to the target (following it), pops the stopper, opens wide
//   aim     it leans in, the line is fixed and shows on the floor (the tell: step off it now)
//   tongue  the tongue shoots out along that line; the TIP grabs what it reaches (wraps round it)
//   pull    the tongue reels the catch in to the mouth;  swallow  gulp: the catch is gone, inside
//   inside  the belly bulges and wobbles, acid bubbles: the prisoner is held, isolated, eaten at
//   spit    on Jiraiya's command it spits the prisoner out in front of it (thrown back), puff, gone
//   miss    the tongue comes back empty, the stopper goes back in, puff
import { GOURD, drawGourd, Canvas } from "./_gourd.js";
import { hex } from "../../core/index.js";

const SPP = 10.7 / 72;
const ease = (u) => 1 - (1 - u) ** 3;
const lerp = (a, b, u) => a + (b - a) * u;
export const ANIMS = {
  idle: { frames: 4, fps: 6, loop: true, pose: (u) => ({ breathe: 0.5 + 0.5 * Math.sin(u * Math.PI * 2) }) },
  open: { frames: 3, fps: 8, pose: (u) => ({ mouth: ease(u), lean: 0.7 * ease(u) }) },
  shoot: { frames: 1, fps: 1, pose: () => ({ mouth: 1, lean: 1 }) },
  swallow: { frames: 4, fps: 12, pose: (u) => ({ mouth: lerp(1, 0.6, u), lean: 1 - u, swell: ease(u) }) },
  full: { frames: 4, fps: 8, loop: true, pose: (u) => ({ swell: 1, wobble: Math.sin(u * Math.PI * 2) }) },
  spit: { frames: 3, fps: 10, pose: (u) => ({ mouth: 1, lean: 0.8 * (1 - u), swell: 1 - ease(u) }) },
};
export const VIEWS = ["side", "front", "back"];
export const RIGS = [{ book: "gourd_toad", S: GOURD, draw: drawGourd, pitch: 0.36, anims: ANIMS }];

const m = drawGourd(new Canvas(4, 4, 2, 2, "side", 0.36), GOURD, ANIMS.shoot.pose()).mouth;
const r2 = (v) => Math.round(v * 100) / 100;
export const MOVE = {
  id: "jiraiya-gourd-prison", kind: "tongue",
  variant: "shippuden/jiraiya-sage-mode", slot: 4,
  seal: 0.3, appear: 0.4, open: 0.25, aim: 0.3, swallow: 0.3, hold: 3.0, spit: 0.3, close: 0.3,
  front: 2.2, side: 2.5,       // the toad sits a step in front of Jiraiya, a little to his side
  mouthF: r2(m[0] * SPP), mouthPx: Math.round(m[1]),
  speed: 70, Lmax: 24, W: 1.7, // the tongue: studs/s out, its reach, how far from its line the tip catches
  pull: 32, retract: 80,
  dot: 6, kb: 5, kbT: 0.25,
  range: 26, cone: 45,
  dodge: { phase: "aim", side: 5 },  // the dodge test: the target steps off the line once it is fixed
  cooldown: 7, lock: 0.3,
};

// ---- effects
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SM1 = hex("#f4f2f6"), SM2 = hex("#cfcbd8"), T1 = hex("#e87890"), T2 = hex("#f4a8b8"), TD = hex("#a83a58"), OUT = hex("#2a1018");
const Lpx = 24 / SPP, Wpx = 1.7 / SPP;
export const FX = {
  puff: { cw: 90, ch: 80, ox: 45, oy: 62, frames: 8, fps: 18, draw(p, u) {
    for (let c = 0; c < 7; c++) {
      const a = (c / 7) * Math.PI * 2, r = 3 + 16 * ease(u), s = 7 + 5 * Math.sin(Math.min(1, u * 1.5) * Math.PI * 0.8);
      blendDisc(p, Math.cos(a) * r, -14 + Math.sin(a) * r * 0.6 - 6 * u, s, SM2, 1 - u * u);
      blendDisc(p, Math.cos(a) * r - 1, -15 + Math.sin(a) * r * 0.6 - 6 * u, s * 0.7, SM1, 1 - u * u);
    }
  } },
  // the tongue: pieces along its line (pivot at the centre; the game turns them to the line on screen)
  tongue: { cw: 26, ch: 12, ox: 13, oy: 6, frames: 1, fps: 1, draw(p) {
    p.rect(-13, -4, 26, 1, OUT); p.rect(-13, 3, 26, 1, OUT);
    p.rect(-13, -3, 26, 6, T1); p.rect(-13, -3, 26, 1, T2); p.rect(-13, 2, 26, 1, TD);
  } },
  tip: { cw: 24, ch: 18, ox: 12, oy: 9, frames: 1, fps: 1, draw(p) {
    p.rect(-12, -4, 8, 1, OUT); p.rect(-12, 3, 8, 1, OUT); p.rect(-12, -3, 8, 6, T1);
    p.ellipse(1, 0, 8, 7, OUT); p.ellipse(1, 0, 7, 6, T1); p.ellipse(-1, -2, 3, 2, T2); p.rect(4, -1, 2, 2, TD);
  } },
  // the tongue wrapped round the catch (over the target)
  wrap: { cw: 70, ch: 90, ox: 35, oy: 80, frames: 4, fps: 10, loop: true, draw(p, u) {
    for (let k = 0; k < 3; k++) {
      const y = -24 - k * 12 + Math.sin(u * Math.PI * 2 + k) * 1.5;
      for (let t = 0; t < Math.PI * 2; t += 0.05) {
        const x = Math.cos(t) * 15, yy = y + Math.sin(t) * 4;
        if (Math.sin(t) > -0.2) { p.rect(x, yy - 2, 1, 5, OUT); p.rect(x, yy - 1, 1, 3, Math.sin(t) > 0.6 ? T2 : T1); }
      }
    }
  } },
  // acid bubbling up off the full toad (loop)
  bubbles: { cw: 70, ch: 90, ox: 35, oy: 70, frames: 6, fps: 10, loop: true, draw(p, u) {
    for (let c = 0; c < 12; c++) {
      const ph = (u + rnd(c)) % 1, x = (rnd(c + 3) - 0.5) * 36 + Math.sin(ph * 6 + c) * 2, y = -30 - ph * 40;
      p.ring(x, y, 2 + ph * 4, 1, hex("#3a4a18"), 1 - ph); p.ring(x, y, 1.5 + ph * 4, 1, c % 2 ? hex("#e8ff70") : hex("#c0f040"), 1 - ph);
    }
  } },
  // spat out: a splash of slime where the prisoner lands
  splash: { cw: 110, ch: 80, ox: 55, oy: 60, frames: 8, fps: 18, draw(p, u) {
    const a = 1 - u;
    for (let c = 0; c < 14; c++) { const ang = -Math.PI * rnd(c), v = 20 + 30 * rnd(c + 2), x = Math.cos(ang) * v * u, y = Math.sin(ang) * v * u * 0.7 + 30 * u * u; blendDisc(p, x, y, 2 + rnd(c + 5) * 2, c % 2 ? hex("#c8e060") : T2, a); }
  } },
  // ---- floor: the tongue's line while it takes aim (the tell): image x along the line from the mouth
  lane: { ground: true, cw: Math.ceil(Lpx) + 12, ch: Math.ceil(Wpx) * 2 + 8, ox: 4, oy: Math.ceil(Wpx) + 4, frames: 4, fps: 12, loop: true, draw(p, u) {
    for (let x = 0; x <= Lpx; x++) {
      if (((x / 10 + u) % 1) < 0.6) { p.blend(x, -Wpx, OUT, 0.9); p.blend(x, Wpx, OUT, 0.9); p.blend(x, -Wpx + 1, T2, 0.8); p.blend(x, Wpx - 1, T2, 0.8); }
      for (let y = -Wpx + 2; y < Wpx - 1; y++) p.blend(x, y, T1, 0.12);
    }
  } },
};
export const PREFIX = "gg_";
export { GOURD };

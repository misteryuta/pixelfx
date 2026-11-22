// Kuroari + Karasu: Black Secret Machine One Shot (Kankuro of the Sand). Narutopedia: Kankuro works his puppets on
// chakra threads from his fingers: Kuroari ("Black Ant") opens its body like a cage to swallow the enemy; Karasu
// ("Crow") then drives its blades into the closed cage from every side. Here: he flicks his fingers and two puppets drop
// from the scroll on his back: Kuroari, squat and many-armed, a single horn; Karasu, gaunt, three eyes, a grin of
// teeth; Kuroari scuttles over the floor and throws its chest open, the halves swinging wide, and closes round the
// target with a bang; Karasu comes apart, its head and six limbs each baring a hidden blade, and all seven ram into
// the cage through its slots; a beat; the cage opens again and the target falls out, the puppets drawn home.
// New: both puppets, the threads, the cage opening and closing, the blades.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 170, DROP = 0.35, GO = 0.8, OPEN = 1.15, SHUT = 1.35, STAB = 1.95, BLADES = [0, 1, 2, 3, 4, 5, 6].map(() => STAB), FREE = 2.9, HOME = 3.3, END = 4.0;
const PUP = ["#141018", "#2a2230", "#463a52", "#6a5a78"].map(hex), WOOD = ["#3a2412", "#5e3c1e", "#8a5a2e"].map(hex), CHK = hex("#6ad0ff");
const STEEL = ["#4a5468", "#a4afc6", "#e8edf6"].map(hex), PURP = hex("#8a2a8a");
const KX = 34, CX = -18;

export const meta = {
  name: "Black secret machine: one shot",
  desc: "Kankuro: two puppets drop from his scroll on chakra threads; Kuroari scuttles over and swallows the target in its cage of a body; Karasu comes apart into seven pieces, each with a hidden blade, and all seven ram into the cage's slots at once.",
  tags: ["jutsu", "kankuro", "suna", "puppet", "trap", "one-shot"],
  size: [300, 190],
  origin: [56, 160],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#141018", "#2a2230", "#463a52", "#6a5a78"], seed: 37 },
};

const WORK = { ...READY, crouch: 4, lean: 0, fx: 14, fy: -30, bx: 10, by: -27, ffx: 9, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [DROP, WORK, "out"],
    [OPEN - 0.05, { ...WORK, fx: 18, fy: -26 }],
    [SHUT, { ...WORK, fx: 10, fy: -34, bx: 8, by: -32 }, "snap"],
    [BLADES[0] - 0.05, { ...WORK, fx: 6, fy: -36 }],
    [BLADES[0], { ...WORK, fx: 20, fy: -24, bx: 18, by: -22 }, "snap"],
    [FREE, WORK],
    [END, READY],
  ],
  hits: [
    { t: DROP, target: false, sfx: "step" },
    { t: SHUT, stop: 0.12, shake: 0.3, amp: 2, push: 0, straw: 0, flash: 0, sfx: "clash" },
    { t: STAB, stop: 0.2, shake: 0.5, amp: 4, push: 0, straw: 0, flash: 0, target: false, sfx: "heavy" },
    { t: FREE, stop: 0.1, shake: 0.3, amp: 2, push: 3, straw: 40, skin: "poison", sfx: "land" },
    { t: FREE + 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: OPEN, x: TX - 20, n: 8 }],
};
// inside the cage, hidden
export const targetState = (t) => (t > SHUT && t < FREE ? { a: 0 } : null);

// Kuroari: a squat black body with six thin arms, one horn; when open its front halves swing apart like doors
function kuroari(p, x, open, t) {
  const y = -26, h = 24, w = 15;
  // the back half
  p.ellipse(x, y, w, h, PUP[0]);
  p.ellipse(x, y, w - 1.5, h - 1.5, PUP[1]);
  if (open > 0.05) {
    p.ellipse(x, y, w - 4, h - 4, hex("#0a080c"));
    // the doors swung wide on their hinges, left and right
    for (const s of [-1, 1]) { const ang = open * 1.4, dx = Math.sin(ang) * w * s; p.poly([[x, y - h + 2], [x + dx, y - h + 6], [x + dx, y + h - 6], [x, y + h - 2]], PUP[2]); }
  } else {
    // shut: the seam and the slots
    p.line(x, y - h + 2, x, y + h - 2, PUP[0]);
    for (let i = 0; i < 5; i++) p.rect(x - 8 + (i % 3) * 7, y - 14 + Math.floor(i / 2) * 12, 3, 1, hex("#0a080c"));
  }
  // the head and horn, the six arms
  p.circle(x + 3, y - h - 3, 5, PUP[1]);
  p.tri(x + 3, y - h - 7, x + 5, y - h - 7, x + 4, y - h - 15, PUP[3]);
  p.px(x + 6, y - h - 4, hex("#ff4a4a"));
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const ay = y - 10 + i * 10, wv = Math.sin(t * 8 + i) * 2; p.line(x + s * w, ay, x + s * (w + 7), ay + 5 + wv, PUP[2]); p.line(x + s * (w + 7), ay + 5 + wv, x + s * (w + 9), ay + 14, PUP[2]); }
}
// Karasu: gaunt, a hooded head, three eyes, a grin; its arms detachable
function karasu(p, x, y, armsOff, t) {
  const sway = Math.sin(t * 3) * 1.5;
  p.poly([[x - 6, y - 22], [x + 6, y - 22], [x + 8, y], [x - 8, y]], PUP[0]);
  p.poly([[x - 5, y - 22], [x + 5, y - 22], [x + 3, y - 2], [x - 3, y - 2]], PUP[1]);
  p.circle(x + sway, y - 28, 6, PUP[1]);
  p.circle(x + sway + 1, y - 28, 4.5, WOOD[1]);
  for (const [dx, dy] of [[-1.5, -30], [2.5, -30], [0.5, -32.5]]) p.px(x + sway + dx, y + dy + 28 - 28, hex("#ffffff"));
  p.line(x + sway - 2, y - 25, x + sway + 4, y - 25, hex("#fff6d8"));
  p.px(x + sway + 1, y - 25, PURP);
  if (!armsOff) for (const s of [-1, 1]) p.line(x + s * 6, y - 20, x + s * 11, y - 6, WOOD[0]);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const kx = (t) => KX + (TX - KX) * ease.inOutCubic(smooth(GO, OPEN, t)) * (1 - ease.inOutCubic(smooth(FREE, HOME, t)));
  const cy = -40 + Math.sin(0) * 0;
  return {
    update(t, dt) {
      BLADES.forEach((bt, i) => { if (t >= bt && !this["b" + i]) { this["b" + i] = 1; for (let j = 0; j < 6; j++) ps.spawn(P.SPARK, TX + R.range(-12, 12), -26 + R.range(-16, 16), R.range(-80, 80), -R.range(20, 100), R.range(0.08, 0.2), R.chance(0.5) ? WHITE : STEEL[2]); } });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "suna", t0: 0.04, t1: DROP, label: "KUGUTSU", head: b.head });
      const drop = ease.outBack(smooth(DROP, DROP + 0.25, t), 1.4);
      drawPoof(p, KX, -20, t - DROP, 1.4, 4);
      drawPoof(p, CX, -20, t - DROP - 0.06, 1.3, 7);
      if (drop <= 0) return;
      const open = t < SHUT ? smooth(GO + 0.2, OPEN, t) : t > FREE ? smooth(FREE, FREE + 0.15, t) * (1 - smooth(HOME - 0.1, HOME, t)) : 0;
      const kxx = kx(t), cyy = -2 - (1 - drop) * 40 + cy * 0;
      // the threads to both puppets
      for (const [hand, to] of [[b.handN, [kxx, -50]], [b.handN, [kxx + 12, -30]], [b.handF, [CX, -34]], [b.handF, [CX + 6, -20]]]) p.line(hand[0], hand[1], to[0], to[1], CHK, 0.55);
      karasu(p, CX, cyy, t > BLADES[0] - 0.1 && t < FREE + 0.2, t);
      kuroari(p, kxx, open, t);
      if (t > SHUT && t < SHUT + 0.1) p.ring(TX, -26, 16 + (t - SHUT) * 200, 1, WHITE, 1 - (t - SHUT) / 0.1);
      if (t > STAB && t < STAB + 0.25) { const u = (t - STAB) / 0.25; p.ring(TX, -26, 20 + 50 * u, 2, WHITE, 1 - u); }
      // Karasu's seven pieces: head and six limbs, each a blade, launched one after another to arrive all at once
      BLADES.forEach((bt, i) => {
        const fl = 0.22 + i * 0.05, a = t - (bt - fl);
        if (a < 0 || t > FREE) return;
        const u = clamp(a / fl), ang = -Math.PI / 2 + (i - 3) * 0.62, sx = CX + (i % 2 ? 8 : -8), sy = -16;
        const ex = TX + Math.cos(ang + Math.PI) * 12, ey = -26 + Math.sin(ang + Math.PI) * 14;
        const x = sx + (ex - sx) * ease.inQuad(u), y = sy + (ey - sy) * ease.inQuad(u) - Math.sin(u * Math.PI) * 40, dir = u < 1 ? Math.atan2(ey - y, ex - x) : Math.atan2(ey + 26, ex - TX) + Math.PI;
        const c = Math.cos(dir), s = Math.sin(dir);
        p.beam(x - c * 10, y - s * 10, x + c * 6, y + s * 6, 2, STEEL[1]);
        p.line(x - c * 10, y - s * 10, x + c * 8, y + s * 8, STEEL[2]);
        p.beam(x - c * 14, y - s * 14, x - c * 10, y - s * 10, 2.5, WOOD[0]);
        if (u >= 1 && a < fl + 0.1) p.circle(ex, ey, 4, WHITE, 1 - (a - fl) / 0.1);
      });
      // poison dripping from the cage seams after the blades went in
      if (t > STAB && t < FREE) for (let i = 0; i < 3; i++) { const ph = (t * 2 + i * 0.33) % 1; p.px(TX - 6 + i * 6, -4 + ph * 4, hex("#58c43a"), 1 - ph); }
      void rand; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

// Akahigi: Hyakki no Sousou (Red Secret Technique: Performance of a Hundred Puppets, Sasori of the Red Sand).
// Narutopedia: Sasori, the puppet master who made himself a puppet, opens the scroll on his back and releases a hundred
// puppets at once, controlling all of them with chakra threads from the ports in his chest and fingers; once he
// conquered a country with them. Here: Sasori (his puppet body, the cable-tail, the cylinder in his chest) unrolls the
// scroll across his chest; puppets burst out of it in a cloud of smoke, filling the air in tiers; blue chakra threads
// fan out from his chest to every one; they hang a beat in formation, blades out, then he flicks his fingers and they
// dive on the target in waves, blades flashing; they fall back into the scroll.
// New: the puppets (wooden bodies, jointed arms with blades, mask faces), the threads, the formation and the dive.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const OPEN = 0.4, OUT = 0.8, FORMED = 1.6, FLICK = 2.0, DIVE = 2.1, RETURN = 3.2, END = 4.1, TX = 200;
const WOOD = ["#2a1a10", "#5e3c1e", "#8a5a2e", "#c8a070"].map(hex), THREAD = hex("#5ab8ff"), STEEL = hex("#c8ccd8");
const N = 18;

export const meta = {
  name: "Performance of a hundred puppets",
  desc: "Sasori: the scroll on his back unrolls and puppets burst out in a cloud of smoke, filling the air in tiers, a blue chakra thread from his chest to each; they hang in formation, blades out, then dive on the target in waves.",
  tags: ["jutsu", "sasori", "akatsuki", "puppets", "multi-hit", "aoe", "one-shot"],
  size: [300, 220],
  origin: [56, 190],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1a10", "#5e3c1e", "#8a5a2e", "#c8a070"], seed: 196 },
};

const SPREAD = { ...READY, crouch: 3, fx: 16, fy: -34, bx: -10, by: -32, ffx: 9, fbx: -9 };
const FLICKP = { ...SPREAD, fx: 22, fy: -26, lean: 6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, { ...READY, crouch: 4, fx: 10, fy: -24, bx: -10, by: -24 }, "out"],
    [OUT + 0.3, SPREAD, "out"],
    [FLICK, FLICKP, "snap"],
    [RETURN, FLICKP],
    [END, SPREAD],
  ],
  hits: [
    { t: OPEN, target: false, sfx: "cast" },
    { t: OUT, shake: 0.4, amp: 2, target: false, sfx: "whoosh" },
    { t: FLICK, target: false, sfx: "clash" },
    ...Array.from({ length: 6 }, (_, i) => ({ t: DIVE + 0.3 + i * 0.1, stop: 0.03, shake: 0.3, amp: 2, push: 1.5, straw: 12, flash: 0.02, sfx: i % 2 ? "parry" : "punch" })),
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // each puppet: its slot in the formation (tiers in the air), its wave
  const PU = Array.from({ length: N }, (_, i) => ({ fx: 30 + (i % 6) * 26 + (rand(i, 1) - 0.5) * 8, fy: -60 - Math.floor(i / 6) * 34 - rand(i, 2) * 6, wave: i % 3, ph: rand(i, 3) * TAU }));
  const pos = (u, t, src) => {
    const out = ease.outCubic(smooth(OUT + u.wave * 0.1, FORMED, t)), dive = ease.inQuad(smooth(DIVE + u.wave * 0.1, DIVE + 0.3 + u.wave * 0.1, t)), back = ease.inCubic(smooth(RETURN, END - 0.2, t));
    let x = src[0] + (u.fx - src[0]) * out + Math.sin(t * 3 + u.ph) * 2, y = src[1] + (u.fy - src[1]) * out + Math.cos(t * 2.4 + u.ph) * 2;
    x += (TX - 10 + (u.wave - 1) * 8 - x) * dive * (1 - back); y += (-30 - y) * dive * (1 - back);
    x += (src[0] - x) * back; y += (src[1] - y) * back;
    return [x, y, dive];
  };
  return {
    update(t, dt) {
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [cx, cy] = b.chest;
      drawBadge(p, t, { kind: "akatsuki", t0: 0.04, t1: OPEN, label: "AKAHIGI", head: b.head });
      // the scroll unrolled across his chest, the port in his chest
      if (t > OPEN) { const u = smooth(OPEN, OUT, t); p.rect(cx - 2, cy - 6, 26 * u, 8, hex("#f0e8d0")); p.line(cx - 2, cy - 2, cx - 2 + 26 * u, cy - 2, hex("#8a1a1a")); p.circle(cx, cy + 2, 2, hex("#3a3a48")); }
      drawPoof(p, cx + 20, cy - 10, t - OUT + 0.05, 3, 4);
      if (t > OUT && t < END - 0.1) {
        const src = [cx + 14, cy - 4], k = 1 - smooth(END - 0.4, END - 0.1, t);
        for (const u of PU) {
          const [x, y, dive] = pos(u, t, src);
          // the thread from his chest
          p.line(cx, cy + 2, x, y, THREAD, 0.4 * k);
          // the puppet: a wooden body, a masked head, jointed arms with blades
          p.rect(x - 3, y - 6, 6, 9, WOOD[2], k); p.line(x - 3, y - 6, x - 3, y + 3, WOOD[0], k);
          p.circle(x, y - 9, 3, WOOD[3], k); p.px(x + 1, y - 10, WOOD[0], k); p.px(x - 1, y - 10, WOOD[0], k);
          const sw = dive > 0.5 ? 0.8 : Math.sin(t * 4 + u.ph) * 0.3;
          for (const s of [-1, 1]) { const ax = x + s * 4, ay = y - 4, ex = ax + s * 4, ey = ay + 3 + sw * 4; p.line(ax, ay, ex, ey, WOOD[1], k); p.line(ex, ey, ex + s * 5, ey - 3 + sw * 6, STEEL, k); }
          p.line(x - 2, y + 3, x - 3, y + 8, WOOD[1], k); p.line(x + 2, y + 3, x + 3, y + 8, WOOD[1], k);
        }
      }
      for (let i = 0; i < 6; i++) { const h = DIVE + 0.3 + i * 0.1; if (t > h && t < h + 0.12) { const a = rand(i, 9) * Math.PI, y = -12 - rand(i, 8) * 30; p.line(TX - 10 * Math.cos(a), y - 10 * Math.sin(a), TX + 10 * Math.cos(a), y + 10 * Math.sin(a), WHITE, 1 - (t - h) / 0.12); } }
      void noise2; void clamp;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

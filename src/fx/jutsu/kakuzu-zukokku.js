// Kakuzu: Katon Zukokku + Fuuton Atsugai (Kakuzu of the Akatsuki). Narutopedia: he keeps the hearts of his victims in
// masked monsters of black thread inside his body; they burst out of his back and use their own elements. The fire mask
// breathes Zukokku, a great fireball; the wind mask's Atsugai, a blast of pressure, feeds it into a firestorm. Here: his
// back splits and black threads pour out, knotting into two hulking shapes either side of him, each wearing a cracked
// white mask with its own glyph; they lean forward together; the wind mask breathes a screaming wall of pressure, the
// fire mask a great ball of flame into it; the two meet and the fire swells into a rolling firestorm that engulfs the
// target and scours the floor black; the monsters pull back into him on their threads.
// New: the thread monsters and masks, the combination: pressure wall + fireball = firestorm. From _lib: blast.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, blast } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 190, BURST = 0.4, FORMED = 1.1, BREATH = 1.35, MEET = 1.6, HIT = 1.85, BACKT = 3.3, END = 4.3;
const FIRE = ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"].map(hex), THREAD = ["#08060a", "#1a1420", "#2e2636"].map(hex);
const MASK = [hex("#e8e2d8"), hex("#a8a094"), hex("#3a3030")];
// the two monsters: where they stand relative to him, their glyph, their colour
const MON = [{ dx: -22, dy: -34, s: 1.0, el: "wind" }, { dx: 10, dy: -42, s: 1.15, el: "fire" }];

export const meta = {
  name: "Fire release: zukokku + wind release: atsugai",
  desc: "Kakuzu: black threads pour out of his back and knot into two masked monsters; the wind mask breathes a wall of pressure, the fire mask a great fireball into it, and the two swell into a rolling firestorm over the target.",
  tags: ["jutsu", "kakuzu", "akatsuki", "fire", "wind", "combo", "aoe", "one-shot"],
  size: [340, 200],
  origin: [70, 168],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"], seed: 59 },
};

const HUNCH = { ...READY, crouch: 6, lean: 12, fx: 6, fy: -14, bx: -6, by: -14, ffx: 9, fbx: -9 };
const BRACE = { ...READY, crouch: 7, lean: 5, fx: 10, fy: -20, bx: 4, by: -18, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [BURST, HUNCH, "out"],
    [FORMED, BRACE, "out"],
    [BACKT, { ...BRACE, crouch: 5 }],
    [END, READY],
  ],
  hits: [
    { t: BURST, stop: 0.06, shake: 0.2, amp: 1, target: false, sfx: "rumble" },
    { t: BREATH, target: false, sfx: "whoosh" },
    { t: MEET, stop: 0.06, shake: 0.3, amp: 2, target: false, sfx: "cast" },
    { t: HIT, stop: 0.2, shake: 0.8, amp: 5, push: 6, straw: 50, skin: "char", sfx: "explosion" },
    ...[0.4, 0.8].map((d) => ({ t: HIT + d, stop: 0.02, push: 1, straw: 8, flash: 0, skin: "char" })),
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: HIT, x: TX - 40, n: 18, dir: -1 }],
};

// a thread monster: a hunched mass of black thread, writhing at its edges, with a white mask
function monster(p, x, y, s, t, k, el, open) {
  p.shade(x - 18 * s, y - 20 * s, x + 18 * s, y + 22 * s, (px, py, out) => {
    const dx = (px - x) / (16 * s), dy = (py - y) / (18 * s), d = Math.hypot(dx, dy * (dy > 0 ? 0.8 : 1));
    const edge = 1 + 0.25 * noise2(Math.atan2(dy, dx) * 2, t * 4 + x, 5);
    if (d > edge * k) return;
    const n = noise2(px * 0.4, py * 0.4 + t * 3, 7);
    return Math.abs(n) < 0.08 ? THREAD[2] : d > edge * k - 0.12 ? THREAD[0] : THREAD[1];
  });
  if (k < 0.6) return;
  // the mask: a cracked white oval, two dark eyes, the element glyph on its brow, the mouth opening to breathe
  const mx = x + 6 * s, my = y - 6 * s;
  p.ellipse(mx, my, 6 * s, 7.5 * s, MASK[2]);
  p.ellipse(mx, my, 5.2 * s, 6.8 * s, MASK[0]);
  p.ellipse(mx - 2 * s, my - 1.5 * s, 1.4 * s, 1 * s, MASK[2]);
  p.ellipse(mx + 2 * s, my - 1.5 * s, 1.4 * s, 1 * s, MASK[2]);
  p.ellipse(mx, my + 3 * s, 2 * s, (0.6 + open * 1.8) * s, MASK[2]);
  p.line(mx + 3 * s, my - 6 * s, mx + 1 * s, my - 1 * s, MASK[1]);
  if (el === "fire") { p.tri(mx - 1.2 * s, my - 4 * s, mx + 1.2 * s, my - 4 * s, mx, my - 6.4 * s, FIRE[2]); p.glow(mx - 2 * s, my - 1.5 * s, 4, FIRE[3], 0.6); }
  else { p.arc(mx, my - 4.6 * s, 1.6 * s, 1, Math.PI, TAU, hex("#5ab0c8")); p.glow(mx - 2 * s, my - 1.5 * s, 4, hex("#9ad8e8"), 0.6); }
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let hit = false;
  const form = (t, i) => smooth(BURST + i * 0.12, FORMED - 0.1 + i * 0.1, t) * (1 - smooth(BACKT, BACKT + 0.5, t));
  return {
    update(t, dt) {
      if (!hit && t >= HIT) { hit = true; lights.add(TX, -30, 220, FIRE[4], 1, 0.6); }
      // the firestorm rolling over the target: flame puffs thrown up and along
      if (t > HIT && t < HIT + 1.3) for (let n = 0; n < 3; n++) if (R.chance(70 * dt)) ps.spawn(P.FIRE, TX + R.range(-40, 40), -R.range(0, 40), R.range(-30, 60), -R.range(30, 90), R.range(0.3, 0.6), FIRE[R.int(3, 5)], R.range(1.5, 3));
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), back = [b.chest[0] - 4, b.chest[1] - 2];
      // threads streaming out of his back to each monster
      MON.forEach((m, i) => {
        const k = form(t, i);
        if (k <= 0) return;
        const mx = back[0] + m.dx, my = back[1] + m.dy;
        for (let j = 0; j < 6; j++) {
          const a = rand(j, i) * 2 - 1, mid = [(back[0] + mx) / 2 + a * 8, (back[1] + my) / 2 + Math.sin(t * 6 + j) * 3];
          p.line(back[0], back[1], mid[0], mid[1], THREAD[2], k);
          p.line(mid[0], mid[1], mx + a * 6 * m.s, my + a * 4, THREAD[2], k);
        }
        const lean = smooth(BREATH - 0.2, BREATH, t) * (1 - smooth(HIT + 0.3, BACKT, t)) * 6;
        monster(p, mx + lean, my, m.s, t, ease.outBack(k, 1.4), m.el, smooth(BREATH - 0.1, BREATH + 0.05, t) * (1 - smooth(HIT, HIT + 0.4, t)));
      });
      // the scorched floor
      if (t > HIT) p.ellipse(TX - 10, 0, 70, 2.5, hex("#0e0808"), 1 - smooth(END - 0.6, END, t));
      blast(p, t - HIT, { x: TX, y: 0, R: 46, C: FIRE, seed: 13, layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), back = [b.chest[0] - 4, b.chest[1] - 2];
      drawBadge(p, t, { kind: "akatsuki", t0: 0.04, t1: BURST, label: "JIOGUMO", head: b.head });
      const mouth = (i) => [back[0] + MON[i].dx + 6 * MON[i].s + 6, back[1] + MON[i].dy - 6 * MON[i].s + 3 * MON[i].s];
      // the pressure wall from the wind mask: rings of air pushed out, a screaming cone
      if (t > BREATH && t < HIT + 0.2) {
        const [wx, wy] = mouth(0), u = clamp((t - BREATH) / (MEET - BREATH)), k = 1 - smooth(HIT, HIT + 0.2, t);
        for (let i = 0; i < 6; i++) { const ph = (t * 4 + i / 6) % 1, x = wx + ph * (TX - 40 - wx) * u, r = 4 + ph * 22; p.ellipse(x, wy + ph * (-22 - wy) * u, r * 0.35, r, (d) => (d > 0.8 ? hex("#c8f0f8") : 0), (1 - ph) * k); }
      }
      // the fireball from the fire mask, swelling as the wind feeds it, rolling onto the target
      if (t > BREATH + 0.05 && t < HIT + 0.05) {
        const [fx0, fy0] = mouth(1), u = ease.inQuad(clamp((t - BREATH - 0.05) / (HIT - BREATH - 0.05))), x = fx0 + (TX - fx0) * u, y = fy0 + (-24 - fy0) * u;
        const r = 6 + 10 * u + (t > MEET ? 10 * smooth(MEET, HIT, t) : 0);
        p.glow(x, y, r * 2.4, FIRE[3], 0.6);
        p.shade(x - r * 1.3, y - r * 1.3, x + r * 1.3, y + r * 1.3, (px, py, out) => {
          const dx = (px - x) / r, dy = (py - y) / r, d = Math.hypot(dx, dy), n = noise2(dx * 3 - t * 8, dy * 3, 4);
          if (d > 1 + 0.25 * n) return;
          out.k = 0.3;
          const lit = 1 - d + n * 0.4 - dx * 0.2;
          return lit > 0.6 ? FIRE[5] : lit > 0.35 ? FIRE[4] : lit > 0.1 ? FIRE[3] : FIRE[2];
        });
      }
      // the meeting: wind wraps the fire, a spiral of flame
      if (t > MEET && t < HIT) { const k = smooth(MEET, HIT, t); for (let i = 0; i < 3; i++) { const a = t * 14 + i * 2; p.arc(TX - 30 + (1 - k) * -40, -24, 18 + i * 4, 2, a, a + 1.6, FIRE[4], 0.8); } }
      blast(p, t - HIT, { x: TX, y: 0, R: 46, C: FIRE, seed: 13 });
      void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

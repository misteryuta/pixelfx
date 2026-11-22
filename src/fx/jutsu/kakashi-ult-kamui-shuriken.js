// ULTIMATE: Susanoo: Kamui Shuriken (Kakashi Hatake, with both of Obito's Mangekyou Sharingan). Narutopedia: in the
// fight against Kaguya, Obito's spirit lends Kakashi both his eyes; with them Kakashi manifests his own Complete Body
// Susanoo and forms Kamui Shuriken: large curved shuriken of Susanoo chakra imbued with Kamui, which tear whatever they
// strike out of this world into the Kamui dimension; he threw them at Kaguya and severed her arm. Here: the two
// Mangekyou (Obito's pinwheel in both eyes); Kakashi rises and the blue-cyan Complete Body Susanoo (masked face, swept
// fins) forms round him; in its right hand chakra swirls into a great four-bladed curved shuriken, lightning crawling
// over it, a black Kamui vortex at its centre; it winds back and hurls it: the shuriken spins in, everything round it
// bending; it strikes, space twists into a black spiral around the target and a slice of the world is torn away into
// it; the target reels out of the warp, the vortex closing with a snap.
// New: the Kamui shuriken (curved blades, the vortex hub), the tearing warp; Complete Body Susanoo from _perfect.js;
// ULTIMATE staging; one impact frame (rings).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp, bolt, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { keyTrack } from "./_susanoo.js";
import { drawPerfect, PERFECT } from "./_perfect.js";
import { ultSky, ultBanner, ultStreaks, frameOf } from "./_ultimate.js";

const EYE = 0.05, RISE = 0.5, FORM0 = 0.6, FORMED = 1.35, MAKE = 1.45, MADE = 2.2, WIND = 2.55, THROW = 2.78, FLY = 0.34, HIT = THROW + FLY;
const TEAR = HIT + 0.5, CLOSE = HIT + 1.1, FADE = CLOSE + 0.5, END = FADE + 0.8, TX = 290, G = 0.6, SX = 6;
const C = PERFECT.kakashi, LT = ["#04141e", "#1a6a90", "#5ad8ff", "#c8f6ff", "#ffffff"].map(hex), VOID = ["#020104", "#0c0814", "#241a34"].map(hex);
const K = keyTrack([
  [0, { nx: 60, ny: -140, fx: -40, fy: -130, lean: 0 }],
  [FORMED, { nx: 60, ny: -140, fx: -40, fy: -130, lean: 0 }],
  [MAKE, { nx: 96, ny: -196, lean: -0.02 }],
  [MADE, { nx: 100, ny: -206, lean: -0.04 }],
  // wound back behind the head
  [WIND, { nx: -30, ny: -250, lean: -0.16, fx: 40, fy: -170 }],
  // the throw: the arm whips across, the body twisting into it
  [THROW, { nx: 150, ny: -170, lean: 0.18, fx: -60, fy: -140 }],
  [THROW + 0.4, { nx: 130, ny: -160, lean: 0.12 }],
  [FADE, { nx: 70, ny: -150, lean: 0.02, fx: -40, fy: -130 }],
]);
const form = (t) => smooth(FORM0, FORMED, t) * (1 - smooth(FADE, END - 0.15, t));

export const meta = {
  name: "Kamui shuriken",
  desc: "ULTIMATE. Kakashi with both of Obito's Mangekyou: his blue Complete Body Susanoo forms a great curved shuriken with a Kamui vortex at its heart and hurls it; where it strikes, space twists into a black spiral and tears a piece of the world away.",
  tags: ["jutsu", "ultimate", "kakashi", "susanoo", "complete-body", "kamui", "mangekyou", "projectile", "one-shot"],
  size: [460, 280],
  origin: [110, 252],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#04141e", "#0c3a54", "#1a6a90", "#38a8d0", "#96e4ff"], seed: 167 },
};

const CALM = { ...READY, crouch: 0, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 5, fbx: -5 };
const FLOAT = { ...CALM, x: SX - 3, y: -90, fx: 10, fy: -24, bx: 6, by: -24, ffx: 4, ffy: -6, fbx: -4, fby: -6, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE, CALM, "out"],
    [FORM0 + 0.5, FLOAT, "out"],
    [WIND, { ...FLOAT, lean: -6, fx: -6, fy: -30 }],
    [THROW, { ...FLOAT, lean: 8, fx: 18, fy: -26 }, "snap"],
    [FADE, FLOAT],
    [END, { ...CALM, x: SX - 3, gait: false }, "in"],
  ],
  hits: [
    { t: EYE, target: false, sfx: "cast" },
    { t: RISE, stop: 0.06, shake: 0.3, amp: 2, target: false, sfx: "cast" },
    { t: MADE, stop: 0.05, shake: 0.4, amp: 1, target: false, sfx: "thunder" },
    { t: THROW, stop: 0.06, shake: 0.4, amp: 2, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.3, shake: 1.0, amp: 6, push: 0, straw: 60, flash: 0.08, shiver: 1, sfx: "explosion" },
    { t: TEAR, stop: 0.1, shake: 0.6, amp: 3, push: -4, straw: 30, sfx: "heavy" },
    { t: CLOSE, stop: 0.08, shake: 0.4, amp: 2, push: 8, straw: 20, sfx: "clash" },
  ],
  dust: [{ t: RISE, x: SX, n: 14, dir: -1 }, { t: RISE, x: SX, n: 14, dir: 1 }],
};
// dragged into the vortex: squeezed and turned, then thrown back out when it snaps shut
export const targetState = (t) => (t > HIT && t < CLOSE + 0.2 ? { s: 1 - 0.35 * smooth(HIT, TEAR, t) * (1 - smooth(CLOSE - 0.1, CLOSE, t)), rot: 0.8 * Math.sin((t - HIT) * 9) * (1 - smooth(CLOSE - 0.1, CLOSE, t)), dy: -6 * smooth(HIT, TEAR, t) * (1 - smooth(CLOSE - 0.1, CLOSE, t)) } : null);

// the Kamui shuriken: four long curved blades swept against the spin, a black vortex hub, lightning crawling on it
function drawShuriken(p, x, y, R, spin, t, k = 1) {
  if (R < 1) return;
  p.glow(x, y, R * 2, LT[2], 0.45 * k);
  for (let i = 0; i < 4; i++) {
    const a = spin + (i * Math.PI) / 2, pts = [];
    for (let j = 0; j <= 8; j++) { const u = j / 8, aa = a + u * 0.9, r = R * (0.25 + 0.85 * u); pts.push([x + Math.cos(aa) * r, y + Math.sin(aa) * r]); }
    for (let j = 8; j >= 0; j--) { const u = j / 8, aa = a + u * 0.9 - 0.32 * (1 - u), r = R * (0.25 + 0.6 * u); pts.push([x + Math.cos(aa) * r, y + Math.sin(aa) * r]); }
    p.poly(pts, C[3], k);
    p.polyline(pts.slice(0, 9), C[5], k);
    p.polyline(pts.slice(9), C[1], k);
  }
  // the hub: a black vortex with Kamui's spiral
  p.circle(x, y, R * 0.3, VOID[0], k);
  for (let i = 0; i < 3; i++) p.arc(x, y, R * (0.1 + i * 0.08), 1, -spin * 2 + i * 2, -spin * 2 + i * 2 + 3, VOID[2], k);
  p.ring(x, y, R * 0.3, 1, C[4], k);
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  const S = (t) => { const k = K(t); return { kind: "kakashi", x: SX, y: 0, s: G, t, form: form(t), near: [k.nx, k.ny], far: [k.fx, k.fy], farBend: 1, nearBend: 1, lean: k.lean, wings: smooth(FORMED - 0.4, FORMED + 0.4, t) }; };
  const hand = (t) => { const k = K(t); return [SX + k.nx * G, k.ny * G]; };
  // the shuriken's path: from the hand at the throw, spinning in along a slight arc to the target's chest
  const flyAt = (t) => { const h = hand(THROW), u = ease.inQuad(clamp((t - THROW) / FLY)); return [h[0] + (TX - h[0]) * u, h[1] + (-30 - h[1]) * u - Math.sin(u * Math.PI) * 18]; };
  const size = (t) => 46 * ease.outBack(smooth(MAKE, MADE, t), 1.4);
  return {
    update(t, dt) {
      if (t > MAKE && t < THROW && R.chance(40 * dt)) { const [x, y] = hand(t), a = R.range(0, TAU), d = R.range(30, 60); ps.spawn(P.STREAK, x + Math.cos(a) * d, y + Math.sin(a) * d, -Math.cos(a) * 160, -Math.sin(a) * 160, 0.2, LT[2]); }
      if (t >= HIT) once("hit", () => { lights.add(TX, -30, 180, LT[3], 0.8, 0.4); for (let i = 0; i < 30; i++) { const a = R.range(0, TAU), s = R.range(40, 200); ps.spawn(P.SPARK, TX + Math.cos(a) * 40, -30 + Math.sin(a) * 40, -Math.cos(a) * s, -Math.sin(a) * s, R.range(0.2, 0.4), R.chance(0.5) ? LT[3] : WHITE); } });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: RISE - 0.2, t1: END - 0.2, tone: "#020a10", glow: "#0c3a54" });
      if (t > RISE && t < FORMED + 0.2) {
        const k = smooth(RISE, RISE + 0.15, t) * (1 - smooth(FORMED - 0.2, FORMED + 0.2, t)), w = 15 + 37 * smooth(RISE, FORMED, t);
        p.shade(SX - w - 10, -205, SX + w + 10, 2, (x, y, out) => { const d = Math.abs(x - SX) / (w * (0.8 + 0.25 * noise2(y * 0.03 - t * 4, 1, 4))); if (d > 1) return; out.a = k; out.k = 0.3; return d > 0.8 ? C[4] : d > 0.5 ? C[3] : C[2]; });
      }
      drawPerfect(p, { ...S(t), layer: "back" });
      // the vortex where it struck: space twisting in a black spiral, tearing a disc of the world away
      if (t > HIT - 0.02 && t < CLOSE + 0.15) {
        const u = smooth(HIT, TEAR, t), close = ease.inCubic(smooth(CLOSE - 0.15, CLOSE, t)), Rv = (20 + 44 * u) * (1 - close);
        warp(p, TX, -30, Rv * 1.8 + 10, 1.4 * (1 - close), 0.6);
        if (Rv > 1) p.shade(TX - Rv, -30 - Rv, TX + Rv, -30 + Rv, (x, y, out) => {
          const dx = x - TX, dy = y + 30, d = Math.hypot(dx, dy) / Rv;
          if (d > 1) return;
          const sp = Math.sin(Math.atan2(dy, dx) * 3 - d * 8 + t * 14);
          out.a = 0.9;
          return d > 0.9 ? C[4] : sp > 0.4 ? VOID[2] : d < 0.35 ? VOID[0] : VOID[1];
        });
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      ultBanner(p, t, box, { t0: 0.05, name: "KAMUI SHURIKEN", hold: 1.1, color: "#96e4ff" });
      drawBadge(p, t, { kind: "kamui", t0: 0.1, t1: RISE, label: "MANGEKYOU", head: b.head });
      drawGlint(p, t, "kamui", RISE, END - 0.3, b.head);
      drawPerfect(p, { ...S(t), layer: "front" });
      // the shuriken in the hand, then in flight
      if (t > MAKE && t < HIT) {
        const [x, y] = t < THROW ? hand(t) : flyAt(t), spin = t * (t < THROW ? 8 : 30);
        drawShuriken(p, x, y, size(t), spin, t);
        if (Math.floor(t * 30) % 2 && t > MADE - 0.3) bolt(p, x - 20, y - 10, x + 22, y + 8, Math.floor(t * 30), LT, { jag: 0.4, seed: Math.floor(t * 30), glow: 0.3 });
        if (t > THROW) ultStreaks(p, t, box, 0.7, 1, LT[3]);
      }
      // the snap as the vortex closes: a ring of light
      if (t > CLOSE && t < CLOSE + 0.3) { const v = (t - CLOSE) / 0.3; p.ring(TX, -30, 6 + 50 * v, 2, LT[3], 1 - v); }
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= HIT && t < HIT + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -30, true, 167, { style: "rings", ink: hex("#020a10"), paper: hex("#e4f8ff"), lines: 24 });
      void rand; void WHITE;
    },
  };
});

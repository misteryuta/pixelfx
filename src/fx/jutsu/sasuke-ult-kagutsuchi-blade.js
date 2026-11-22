// ULTIMATE: Enton: Kagutsuchi no Tsurugi with the Complete Body Susanoo and Amenotejikara (Sasuke, Rinnegan and
// Eternal Mangekyou). Narutopedia: Blaze Release: Kagutsuchi's Sword: Sasuke shapes the black flames of Amaterasu with
// his left eye into a blade wreathed in them, carried by his Susanoo; Amenotejikara (the Rinnegan's left eye) swaps the
// position of things in an instant, which he used to appear right beside his foe; the Complete Body Susanoo is purple,
// crow-billed, with two spikes over each eye. Here: the Rinnegan and the Sharingan; Sasuke rises and the purple
// Complete Body Susanoo forms round him, wings of chakra fire; black flames burst into its right hand and stretch,
// crawling, into a long sword of Amaterasu with a crimson edge; it raises the blade; ripples of space at the Susanoo and
// beside the target: Amenotejikara, and the giant is suddenly there, already cutting: one great diagonal stroke through
// the target, a black crescent hanging in the air behind it; the target bursts into black flame; the flames shape
// themselves into spears that pin it (Kagutsuchi), and burn out.
// New: the black-flame blade, the swap (both ripples, the giant gone from one place and in the other), the pinned
// target; Complete Body Susanoo from _perfect.js; ULTIMATE staging; one impact frame (black flames).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp, impactFrame, BLACK_FIRE } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { keyTrack } from "./_susanoo.js";
import { drawPerfect, perfectPuppet, PERFECT } from "./_perfect.js";
import { ultSky, ultBanner, ultStreaks, frameOf } from "./_ultimate.js";

const EYE = 0.05, RISE = 0.55, FORM0 = 0.65, FORMED = 1.45, FLAME = 1.6, SWORD = 2.25, RAISE = 2.55, SWAP = 2.85, CUT = 2.98, HIT = 3.06;
const PIN = HIT + 0.7, REST = HIT + 1.6, FADE = REST + 0.4, END = FADE + 0.8, TX = 300, G = 0.6;
const C = PERFECT.sasuke, BF = BLACK_FIRE;
// where the Susanoo stands: home, then (after the swap) right beside the target
const HOME = 6, NEAR = TX - 116;
const K = keyTrack([
  [0, { nx: 60, ny: -140, fx: -40, fy: -130, lean: 0, ba: -0.6, bl: 0 }],
  [FORMED, { nx: 60, ny: -140, fx: -40, fy: -130, lean: 0, ba: -0.6, bl: 0 }],
  // the hand opens to the side, the black flames gather into a blade along it
  [FLAME, { nx: 90, ny: -170, ba: -0.5, bl: 20 }],
  [SWORD, { nx: 96, ny: -186, ba: -0.75, bl: 230, lean: -0.02 }],
  // raised high over the head, the point back
  [RAISE, { nx: 30, ny: -300, ba: -2.3, bl: 240, lean: -0.12, fx: -50, fy: -170 }],
  [SWAP, { nx: 20, ny: -306, ba: -2.5, bl: 240, lean: -0.16 }],
  // the cut, already underway as it appears: down and across, through the target
  [CUT, { nx: 80, ny: -230, ba: -0.7, bl: 300, lean: 0.06 }],
  [HIT, { nx: 120, ny: -120, ba: 0.55, bl: 300, lean: 0.2, fx: -70, fy: -140 }],
  [HIT + 0.35, { nx: 126, ny: -112, ba: 0.7, bl: 290, lean: 0.22 }],
  [REST, { nx: 120, ny: -170, ba: 0.6, bl: 220, lean: 0.1 }],
  [FADE, { nx: 100, ny: -170, ba: 0.5, bl: 0, lean: 0.04 }],
]);
const form = (t) => smooth(FORM0, FORMED, t) * (1 - smooth(FADE, END - 0.15, t));
const sx = (t) => (t < SWAP ? HOME : NEAR);

export const meta = {
  name: "Kagutsuchi's sword",
  desc: "ULTIMATE. Sasuke: his purple Complete Body Susanoo forms and shapes Amaterasu's black flames into a sword; Amenotejikara puts the giant right beside the target mid-swing, one great black-flame stroke cuts through it, and the flames pin it as spears.",
  tags: ["jutsu", "ultimate", "sasuke", "susanoo", "complete-body", "rinnegan", "amaterasu", "blaze-release", "melee", "one-shot"],
  size: [470, 290],
  origin: [110, 262],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0e0624", "#2a1260", "#4e24a0", "#8050e0", "#c4a0ff", "#f4ecff"], seed: 166 },
};

const CALM = { ...READY, crouch: 0, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 5, fbx: -5 };
const FLOAT = { ...CALM, y: -90, fx: 10, fy: -24, bx: 6, by: -24, ffx: 4, ffy: -6, fbx: -4, fby: -6, gait: false };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RISE, CALM, "out"],
    [FORM0 + 0.5, { ...FLOAT, x: HOME - 3 }, "out"],
    [SWAP - 0.01, { ...FLOAT, x: HOME - 3, lean: -5 }],
    [SWAP, { ...FLOAT, x: NEAR - 3, lean: -5 }, "snap"],
    [HIT, { ...FLOAT, x: NEAR - 3, lean: 6, fx: 16, fy: -20 }, "out"],
    [FADE, { ...FLOAT, x: NEAR - 3 }],
    [END, { ...CALM, x: NEAR - 3, gait: false }, "in"],
  ],
  hits: [
    { t: RISE, stop: 0.06, shake: 0.3, amp: 2, target: false, sfx: "cast" },
    { t: FLAME, stop: 0.06, shake: 0.4, amp: 2, target: false, sfx: "cast" },
    { t: SWAP, stop: 0.08, shake: 0.3, amp: 2, target: false, sfx: "whoosh" },
    { t: HIT, stop: 0.32, shake: 1.2, amp: 8, push: 6, straw: 70, skin: "char", shiver: 1, sfx: "explosion" },
    ...[0.25, 0.5].map((d) => ({ t: HIT + d, stop: 0.02, flash: 0, push: 1, straw: 8, shiver: 0.6 })),
    { t: PIN, stop: 0.12, shake: 0.6, amp: 3, push: 0, straw: 20, sfx: "heavy" },
    { t: FADE, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RISE, x: HOME, n: 14, dir: -1 }, { t: SWAP, x: NEAR, n: 18, dir: 1 }, { t: HIT, x: TX - 30, n: 20, dir: -1 }, { t: HIT, x: TX + 30, n: 20, dir: 1 }],
};
// the target pinned and burning
export const targetState = (t) => (t > HIT && t < FADE ? { tint: [BF[1], 0.4 * smooth(HIT, HIT + 0.3, t)], dy: 0 } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  const fired = new Set(), once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  // the model's own blade swings with the keys; the black flames swallow it (FLAME..SWORD) and become the sword
  const S = (t) => { const k = K(t); return { kind: "sasuke", x: sx(t), y: 0, s: G, t, form: form(t), near: [k.nx, k.ny], far: [k.fx, k.fy], farBend: 1, nearBend: 1, lean: k.lean, wings: smooth(FORMED - 0.4, FORMED + 0.4, t), blade: { a: k.ba, len: Math.max(k.bl, 40) }, weaponA: 1 - smooth(FLAME, SWORD - 0.2, t) }; };
  // the sword in effect space: from the hand along the blade angle
  // the model holds its sword up in its right hand: the black flames take that sword, then swing with the keys
  const blade = (t) => { const k = K(t), P = perfectPuppet(S(t)), H = P.hand, ba = P.angle ?? k.ba, ux = Math.cos(ba), uy = Math.sin(ba), L = uy > 0.05 ? Math.min(k.bl * G, (-2 - H[1]) / uy) : k.bl * G; return { H, ux, uy, L }; };
  // a sword of black flame: a crawling black core, crimson licks along its edges, tongues streaming back off it
  function drawBlade(p, t, k) {
    const { H, ux, uy, L } = blade(t);
    if (L < 2 || k <= 0) return;
    const nx = -uy, ny = ux, pad = 12;
    const xs = [H[0], H[0] + ux * L], ys = [H[1], H[1] + uy * L];
    p.shade(Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad, (x, y, out) => {
      const rx = x - H[0], ry = y - H[1], u = (rx * ux + ry * uy) / L, v = rx * nx + ry * ny;
      if (u < -0.02 || u > 1.04) return;
      const w = (5.5 + 2 * Math.sin(u * Math.PI)) * (u > 0.92 ? Math.max(0, 1 - (u - 0.92) * 12) : 1);
      const n = noise2(u * 18 - t * 9, v * 0.5, 61), lick = w + 5 * Math.max(0, n);
      const d = Math.abs(v);
      if (d > lick) return;
      out.a = k;
      if (d > w) return n > 0.5 ? BF[4] : BF[3];
      return d < w * 0.35 ? BF[0] : d < w * 0.7 ? BF[1] : BF[2];
    });
    // the hilt in the giant's fist
    p.circle(H[0], H[1], 3, BF[0], k);
  }
  return {
    update(t, dt) {
      if (t > FLAME && t < FADE && R.chance(40 * dt)) { const { H, ux, uy, L } = blade(t), u = R.range(0, 1); ps.spawn(P.SMOKE, H[0] + ux * L * u, H[1] + uy * L * u, R.range(-10, 10), -R.range(10, 30), R.range(0.3, 0.6), BF[1], 1.2); }
      if (t >= HIT) once("hit", () => { lights.add(TX, -30, 160, BF[4], 0.8, 0.5); for (let i = 0; i < 24; i++) ps.spawn(P.SPARK, TX, -30, R.range(-160, 160), R.range(-160, 40), R.range(0.2, 0.4), R.chance(0.5) ? BF[4] : BF[3]); });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: RISE - 0.2, t1: END - 0.2, tone: "#08040e", glow: "#2a1050" });
      // the chakra rising round him as the giant forms
      if (t > RISE && t < FORMED + 0.2) {
        const k = smooth(RISE, RISE + 0.15, t) * (1 - smooth(FORMED - 0.2, FORMED + 0.2, t)), w = 15 + 37 * smooth(RISE, FORMED, t);
        p.shade(HOME - w - 10, -205, HOME + w + 10, 2, (x, y, out) => { const d = Math.abs(x - HOME) / (w * (0.8 + 0.25 * noise2(y * 0.03 - t * 4, 1, 4))); if (d > 1) return; out.a = k; out.k = 0.3; return d > 0.8 ? C[4] : d > 0.5 ? C[3] : C[2]; });
      }
      // the swap: the giant flickers out at home, a ripple of space there and beside the target
      const sw = t - SWAP;
      if (sw > -0.12 && sw < 0.25) {
        const k = 1 - Math.abs(sw) / 0.25;
        warp(p, HOME + 30, -100, 70, 0.4 * k, 0.4 * k);
        warp(p, NEAR + 30, -100, 70, -0.4 * k, 0.4 * k);
        for (const cx of [HOME + 30, NEAR + 30]) p.ring(cx, -100, 20 + 60 * (1 - k), 1, C[4], k);
      }
      // the giant itself, faded out across the swap instant
      const flick = sw > -0.06 && sw < 0.04 ? 0.25 : 1;
      drawPerfect(p, { ...S(t), form: form(t) * flick, layer: "back" });
      // the black crescent the stroke leaves hanging in the air
      if (t > CUT && t < CUT + 0.9) {
        const k = 1 - smooth(CUT + 0.3, CUT + 0.9, t);
        for (let i = 0; i < 14; i++) {
          const tt = CUT + (HIT + 0.1 - CUT) * (i / 13), { H, ux, uy, L } = blade(tt), x = H[0] + ux * L * 0.85, y = H[1] + uy * L * 0.85, j = i + 1 < 14 ? blade(CUT + (HIT + 0.1 - CUT) * ((i + 1) / 13)) : null;
          if (j) p.beam(x, y, j.H[0] + j.ux * j.L * 0.85, j.H[1] + j.uy * j.L * 0.85, 6 * k * (0.5 + i / 26), i % 2 ? BF[1] : BF[0], k);
        }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      ultBanner(p, t, box, { t0: 0.05, name: "KAGUTSUCHI NO TSURUGI", hold: 1.1, color: "#c4a0ff" });
      drawBadge(p, t, { kind: "sasukeEMS", t0: 0.1, t1: RISE, label: "RINNEGAN", head: b.head });
      drawGlint(p, t, "rinnegan", RISE, END - 0.3, b.head);
      const sw = t - SWAP, flick = sw > -0.06 && sw < 0.04 ? 0.25 : 1;
      drawPerfect(p, { ...S(t), form: form(t) * flick, layer: "front" });
      // the black flames bursting into the hand, then the blade
      if (t > FLAME - 0.1 && t < FLAME + 0.3) { const { H } = blade(t), k = 1 - Math.abs(t - FLAME) / 0.3; p.glow(H[0], H[1], 30 * k, BF[4], 0.5 * k); p.circle(H[0], H[1], 8 * k, BF[0], k); }
      if (t > FLAME) drawBlade(p, t, flick * (1 - smooth(FADE - 0.3, FADE, t)));
      if (t > CUT - 0.05 && t < HIT + 0.15) ultStreaks(p, t, box, 0.7, 1, hex("#c4a0ff"));
      // the target burning in black flame, then pinned by spears of it (Kagutsuchi)
      if (t > HIT && t < FADE + 0.3) {
        const k = smooth(HIT, HIT + 0.15, t) * (1 - smooth(FADE, FADE + 0.3, t));
        p.shade(TX - 22, -74, TX + 22, 1, (x, y, out) => { const h = 50 + 14 * noise2(x * 0.15, t * 2, 3), d = Math.abs(x - TX) / 16 + (-y / h) ** 2; if (d > 1 || y > 0) return; const n = noise2(x * 0.2, y * 0.15 + t * 6, 62); if (n < -0.15) return; out.a = k * 0.9; return n > 0.4 ? BF[4] : n > 0.15 ? BF[3] : n > 0 ? BF[2] : BF[0]; });
        p.glow(TX, -30, 34, BF[4], 0.45 * k);
        if (t > PIN - 0.15) {
          const g = ease.outBack(smooth(PIN - 0.15, PIN, t), 2);
          for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.32, L = (40 + rand(i, 2) * 16) * g, x0 = TX + Math.cos(a) * L, y0 = -28 + Math.sin(a) * L * 0.9; p.beam(x0, y0, TX + Math.cos(a) * 4, -28 + Math.sin(a) * 4, 3.5, BF[0], k); p.line(x0, y0, TX, -28, BF[3], 0.7 * k); }
        }
      }
      ps.draw(p, "front");
      lights.draw(p);
      // the one impact frame: the instant the blade goes through
      if (t >= HIT && t < HIT + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -30, false, 166, { style: "flames", ink: hex("#08020c"), paper: hex("#f0e4ff"), lines: 30 });
      void TAU; void clamp; void WHITE;
    },
  };
});

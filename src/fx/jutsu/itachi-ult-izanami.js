// ULTIMATE: Izanami (Itachi Uchiha, against Kabuto). Narutopedia: a forbidden Uchiha technique paired with Izanagi;
// the user records a moment twice and the target is trapped in an endless loop between them, living the same moments
// again and again; it ends only when the target accepts who they are; using it costs the user that eye's light. Itachi
// used it to stop Kabuto, then sealed him... Here, to make the loop legible as an ultimate: Itachi's Mangekyou; crows
// burst from his arm; he steps in and strikes the target (a kunai, crows); the frame shudders, a crack of light runs
// across it, everything rewinds (the crows fly back, Itachi walks backwards) and the very same moment plays again;
// a second time it shudders and loops, tighter, the target reeling; on the third the loop stops: the eye goes grey
// and closes (the light it cost), and Itachi's Susanoo arm draws the Totsuka Sword and seals the target into its gourd
// in a swirl of red sake-light.
// New: the loop (time running back, a crack of light across the frame, the same beat again); crows; the red ribcage
// arm with the Totsuka gourd and sword (drawn here); ULTIMATE staging; one impact frame (shards in red).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, impactFrame, drawFigure } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { ultSky, ultBanner, frameOf } from "./_ultimate.js";
import { drawModel } from "./_models.js";
import { cineCam, inserts, insertKeys, backdrop, eyeShot, speedLines, cutFlash } from "./_cinema.js";

// one beat of the loop: step in, strike, crows burst
const BEAT = 0.9, L0 = 0.6, LOOPS = 3, SEAL = L0 + BEAT * LOOPS + 0.2, DRAW = SEAL + 0.3, STAB = SEAL + 0.75, GONE = STAB + 0.7, END = GONE + 0.9, TX = 170;
const RED = ["#2a0204", "#6a0810", "#c01a24", "#ff5050", "#ffc0b8"].map(hex), CROW = ["#06040a", "#1a1420", "#3a3040"].map(hex), SAKE = hex("#ff8a60");

// the loop clock: within each pass it runs the beat forward; at the seams (the recorded moment) it rewinds
const loopT = (t) => {
  if (t < L0) return 0;
  const k = Math.floor((t - L0) / BEAT), u = (t - L0 - k * BEAT) / BEAT;
  if (k >= LOOPS) return 1;
  // the last 20% of each pass (except the last) is the rewind back to the start
  if (k < LOOPS - 1 && u > 0.8) return 1 - (u - 0.8) / 0.2;
  return Math.min(1, u / 0.8);
};
const passOf = (t) => Math.min(LOOPS - 1, Math.floor(Math.max(0, t - L0) / BEAT));
const rewinding = (t) => { const k = Math.floor((t - L0) / BEAT), u = (t - L0 - k * BEAT) / BEAT; return t > L0 && k < LOOPS - 1 && u > 0.8; };

// ---- the cutscene: his Mangekyou opening, crows streaking past; then the same moment seen three times from three
// angles (wide; close from across; tight and tilted), the camera rewinding with the loop; his eye going grey and
// closing (the light Izanami costs); his Susanoo seen from below, the Totsuka sword in its hand; the stab, close; out.
const BOX = [-56, -200, 264, 30];
const lines = (u, v) => v > 0.95 && v < 2.0 && ((Math.abs(u + 0.15 - (v - 0.95) * 0.25) < 0.03) || (Math.abs(u + 0.45 - (v - 0.95) * 0.25) < 0.03));
const crows = (p, t, box, k = 1) => {
  for (let i = 0; i < 9; i++) {
    const ph = (t * (0.9 + rand(i, 2)) + rand(i, 3)) % 1, x = box[0] - 30 + ph * (box[2] - box[0] + 60), y = box[1] + 20 + rand(i, 4) * (box[3] - box[1] - 40), s = 4 + rand(i, 5) * 6, f = Math.sin(t * 30 + i) * s * 0.6;
    p.poly([[x - s * 1.4, y - f], [x, y], [x + s * 1.4, y - f], [x + s * 0.3, y + s * 0.3], [x - s * 0.3, y + s * 0.3]], CROW[0], k);
  }
};
const INS = [
  [0.08, 0.56, (p, u, t, box) => {
    backdrop(p, box, t, { c0: "#1a0204", c1: "#6a0810", style: "flow", seed: 5 });
    eyeShot(p, box, t, { kind: "itachi", cx: 104, cy: -88, R: 30 + 5 * u, open: ease.outCubic(smooth(0.1, 0.6, u)), rot: t * 2, skin: "#efd0b8", shadow: "#c4a08c", mark: lines });
    crows(p, t, box, smooth(0.3, 0.6, u));
  }],
  [SEAL - 0.2, SEAL + 0.14, (p, u, t, box) => {
    // the loop ends: the eye's light goes out, grey, and it closes
    backdrop(p, box, t, { c0: "#100a0c", c1: "#2a1418", style: "plain" });
    eyeShot(p, box, t, { kind: "itachi", cx: 104, cy: -88, R: 36, open: 1 - smooth(0.55, 1, u), rot: 0.4, grey: smooth(0.05, 0.5, u), skin: "#efd0b8", shadow: "#c4a08c", mark: lines });
  }],
  [DRAW - 0.04, STAB - 0.04, (p, u, t, box) => {
    // his Susanoo, from below: towering, the Totsuka sword burning in its hand, the mirror on its arm
    backdrop(p, box, t, { c0: "#1a0204", c1: "#c01a24", style: "rays", cx: 104, cy: -200 });
    drawModel(p, "susanooItachi", "front", 110, 60, { scale: 2.0 + 0.15 * u, persp: 0.3, glow: RED[3] });
    p.glowLine(30, -200, 60, 20, 26, hex("#ffd060"), 0.35 + 0.2 * Math.sin(t * 20));
    speedLines(p, box, t, 104, -80, 0.4, RED[4]);
  }],
];
const strikeAt = (k) => L0 + k * BEAT + 0.43;
export const camera = cineCam([
  [0, { z: 1.6, x: 10, y: -36 }],
  ...insertKeys(INS),
  // pass one, wide
  [0.56, { z: 1.1, x: 96, y: -60, r: 0 }, "cut"],
  [strikeAt(0), { z: 1.2, x: 120, y: -54, r: 1, shake: 0.4 }],
  [L0 + BEAT * 0.8, { z: 1.2, x: 120, y: -54, r: 1 }],
  // the rewind pulls back, then pass two: close, from across, tilted the other way
  [L0 + BEAT, { z: 1.0, x: 100, y: -70, r: -2 }],
  [L0 + BEAT + 0.01, { z: 1.9, x: TX - 24, y: -38, r: 8 }, "cut"],
  [strikeAt(1), { z: 2.0, x: TX - 20, y: -38, r: 8, shake: 0.5 }],
  [L0 + BEAT * 1.8, { z: 2.0, x: TX - 20, y: -38, r: 8 }],
  [L0 + BEAT * 2, { z: 1.4, x: TX - 40, y: -50, r: 2 }],
  // pass three: tight, tilted hard
  [L0 + BEAT * 2 + 0.01, { z: 2.6, x: TX - 18, y: -34, r: -10 }, "cut"],
  [strikeAt(2), { z: 2.8, x: TX - 16, y: -34, r: -11, shake: 0.7 }],
  [SEAL - 0.21, { z: 2.4, x: TX - 20, y: -36, r: -6 }],
  [SEAL + 0.14, { z: 1.2, x: TX - 40, y: -70, r: 0 }, "cut"],
  [DRAW - 0.05, { z: 1.25, x: TX - 40, y: -74, r: 0 }],
  [STAB - 0.04, { z: 1.8, x: TX - 4, y: -40, r: 5, shake: 0.9 }, "cut"],
  [STAB + 0.4, { z: 1.6, x: TX - 10, y: -46, r: 3, shake: 0.2 }],
  [GONE, { z: 1.1, x: 110, y: -70, r: 0 }],
  [END, { z: 1.0, x: 104, y: -85 }],
]);

export const meta = {
  name: "Izanami",
  desc: "ULTIMATE. Itachi traps the target in a loop: he steps in and strikes, the moment cracks and rewinds and plays again, and again; on the third pass the loop ends, his eye goes dark, and his Susanoo's Totsuka Sword seals the target away.",
  tags: ["jutsu", "ultimate", "itachi", "izanami", "mangekyou", "genjutsu", "susanoo", "seal", "one-shot"],
  size: [320, 230],
  origin: [56, 200],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a0204", "#6a0810", "#c01a24", "#ff5050", "#ffc0b8"], seed: 178 },
};

const STEP = { ...READY, x: TX - 40, crouch: 6, lean: 10, fx: 14, fy: -24, bx: -4, by: -20, ffx: 12, fbx: -10 };
const STRIKE = { ...READY, x: TX - 22, crouch: 7, lean: 16, fx: 26, fy: -26, bx: -6, by: -18, ffx: 14, fbx: -12, gait: false };
const CALMP = { ...READY, crouch: 2, fx: 6, fy: -22, bx: -4, by: -20 };
// the pose follows the loop clock, so it runs backwards in the rewinds
const loopPose = (u) => (u < 0.4 ? { ...CALMP, ...{ x: (TX - 40) * smooth(0, 0.4, u) } } : u < 0.6 ? STEP : STRIKE);
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [L0, CALMP, "out"],
    ...Array.from({ length: 60 }, (_, i) => { const t = L0 + (i / 60) * BEAT * LOOPS; const u = loopT(t); return [t, { ...loopPose(u), gait: false }, "line"]; }),
    [SEAL, { ...STRIKE, lean: 4, crouch: 4 }, "out"],
    [END, { ...CALMP, x: TX - 22, gait: false }],
  ],
  hits: [
    { t: 0.3, target: false, sfx: "cast" },
    ...Array.from({ length: LOOPS }, (_, k) => ({ t: L0 + BEAT * k + BEAT * 0.62, stop: 0.06, shake: 0.3, amp: 2, push: 2, straw: 12, sfx: "punch" })),
    ...Array.from({ length: LOOPS - 1 }, (_, k) => ({ t: L0 + BEAT * k + BEAT * 0.8, stop: 0.05, shake: 0.6, amp: 1, target: false, sfx: "clash" })),
    { t: DRAW, target: false, sfx: "cast" },
    { t: STAB, stop: 0.3, shake: 0.8, amp: 5, push: 0, straw: 50, flash: 0.08, skin: "red", sfx: "heavy" },
    { t: meta.duration - 0.25, flash: 0, push: 0, straw: 0, skin: null }, // RESET SKIN: the target back to its own colours
  ],
};
export const targetState = (t) => (t > STAB && t < END ? { s: 1 - 0.9 * ease.inCubic(smooth(STAB + 0.1, GONE, t)), dy: -40 * ease.inCubic(smooth(STAB + 0.1, GONE, t)), rot: 4 * smooth(STAB, GONE, t), a: t > GONE ? 0 : 1 } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), box = frameOf(meta);
  // the crows that burst on the strike: their flight is a function of the loop clock, so they fly back in the rewind
  const CR = Array.from({ length: 12 }, (_, i) => ({ a: -Math.PI / 2 + (rand(i, 1) - 0.5) * 2.4, s: 60 + rand(i, 2) * 80 }));
  const GOURD = [-20, -110];
  return {
    update(t, dt) {
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ultSky(p, t, box, { t0: 0.2, t1: END - 0.1, tone: "#0a0204", glow: "#3a0810" });
      // the Susanoo's arm for the seal: a red ribcage arm out of the ground behind him, the gourd in its hand
      if (t > DRAW - 0.2) {
        const k = smooth(DRAW - 0.2, DRAW + 0.2, t) * (1 - smooth(END - 0.4, END, t)), b = bodyAt(act.poses, t);
        const sh = [b.chest[0] - 10, b.chest[1] - 10], g = [GOURD[0] + (b.q.x ?? 0), GOURD[1]];
        p.beam(sh[0], sh[1], g[0], g[1] + 30, 8, RED[2], 0.8 * k);
        for (let i = 0; i < 4; i++) p.arc(sh[0] - 4, sh[1] + 8 + i * 6, 12, 2, -2.6, -0.4, RED[3], 0.7 * k);
        // the gourd: a red sake bottle; the Totsuka Sword pouring out of it as liquid light, reaching the target
        p.ellipse(g[0], g[1] + 10, 7, 9, RED[1], k); p.ellipse(g[0], g[1] - 2, 4, 5, RED[1], k); p.rect(g[0] - 2, g[1] - 9, 4, 3, RED[0], k);
        if (t > DRAW + 0.1) {
          const u = ease.outCubic(smooth(DRAW + 0.1, STAB, t)), ex = g[0] + (TX - g[0]) * u, ey = g[1] - 4 + (-30 - g[1] + 4) * u;
          for (let i = 0; i < 12; i++) { const v = i / 12, x = g[0] + (ex - g[0]) * v, y = g[1] - 4 + (ey - g[1] + 4) * v + Math.sin(v * 9 + t * 12) * 2; p.circle(x, y, 2.2, SAKE, k); }
          p.glowLine(g[0], g[1] - 4, ex, ey, 10, SAKE, 0.5 * k);
        }
      }
      // the swirl of sake-light pulling the target into the gourd
      if (t > STAB && t < GONE + 0.1) { const v = smooth(STAB, GONE, t); for (let i = 0; i < 3; i++) p.arc(TX, -30 - 30 * v, 20 * (1 - v) + 4, 1, t * 10 + i * 2, t * 10 + i * 2 + 2, SAKE, 1 - v); }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      ultBanner(p, t, box, { t0: 0.05, name: "IZANAMI", hold: 0.6, color: "#ff5050" });
      drawBadge(p, t, { kind: "itachi", t0: 0.1, t1: L0, label: "MANGEKYOU", head: b.head });
      // the eye: lit through the loops, grey and closed once Izanami is spent
      if (t < SEAL) drawGlint(p, t, "itachi", L0, SEAL, b.head);
      else { const [hx, hy] = b.head; p.line(hx + 1, hy - 1, hx + 3, hy - 1, hex("#5a5a64")); }
      // the strike of each pass: a kunai flash and the crows bursting from his arm, flying back in the rewinds
      const u = loopT(t);
      if (t > L0 && t < SEAL) {
        if (u > 0.55 && u < 0.7) p.line(TX - 10, -34, TX + 6, -20, WHITE);
        if (u > 0.6) { const f = (u - 0.6) / 0.4; for (const c of CR) { const x = TX - 10 + Math.cos(c.a) * c.s * f, y = -30 + Math.sin(c.a) * c.s * f, w = Math.sin(t * 30 + c.a * 5) * 3; p.poly([[x - 9, y + w * 2], [x, y - 1], [x + 9, y + w * 2], [x, y + 3]], CROW[0], 1 - f * 0.4); p.line(x - 9, y + w * 2, x, y - 1, CROW[2]); p.circle(x + 1, y - 2, 2, CROW[1]); p.px(x + 2, y - 2, RED[3]); } }
      }
      // the seams of the loop: a crack of light across the frame, everything drained toward grey, a shudder
      if (rewinding(t)) {
        const [x0, y0, x1, y1] = box, k = passOf(t) + 1;
        p.shade(x0, y0, x1, y1, (x, y, out) => { out.a = 0.25; return (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? RED[0] : 0; });
        let px = x0, py = -60 + 20 * Math.sin(t * 9);
        for (let i = 1; i <= 12; i++) { const x = x0 + (x1 - x0) * (i / 12), y = -60 + (rand(i, Math.floor(t * 20)) - 0.5) * 40 * k; p.line(px, py, x, y, WHITE); p.line(px, py + 1, x, y + 1, RED[3]); px = x; py = y; }
        p.text("<<", b.head[0], b.head[1] - 18, RED[4], { font: "big", align: "center", outline: RED[0] });
      }
      ps.draw(p, "front");
      lights.draw(p);
      if (t >= STAB && t < STAB + 0.06) impactFrame(p, box[0], box[1], box[2], box[3], TX, -30, false, 178, { style: "shards", ink: hex("#1a0204"), paper: hex("#ffe4dc"), lines: 26 });
      inserts(p, t, BOX, INS);
      cutFlash(p, BOX, t, [0.56, L0 + BEAT + 0.01, L0 + BEAT * 2 + 0.01, STAB - 0.04], 0.04, hex("#ffe4dc"));
      void drawFigure; void noise2; void clamp;
    },
  };
});

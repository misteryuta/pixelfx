// Shiki Fuujin (Dead Demon Consuming Seal / Reaper Death Seal, Hiruzen Sarutobi). Narutopedia: a forbidden sealing
// technique of the Uzumaki: the signs Snake, Boar, Ram, Hare, Dog, Rat, Bird, Horse, Snake, and the hands clapped;
// the Shinigami appears behind the user, seen only by the user and the one being sealed: a ghostly giant with long
// white hair, a horn, purple-grey skin, a tanto clenched in its teeth and a string of prayer beads on its left arm;
// its arm reaches out through the user's own body and seizes the target's soul, pulls it out and swallows it, and in
// payment takes the user's soul as well. The seal on the user's stomach. Here: the nine signs and the clap; the
// Shinigami fades in behind him, towering; its arm goes through his chest, the beads clicking; the hand comes out of
// him and stretches to the target, sinks into it; it closes and pulls: the white soul (a pale double of the target)
// is drawn out, struggling; the Shinigami takes the tanto from its teeth, cuts, and the soul is drawn back and into its
// mouth; it fades; the target sags.
// New: the Shinigami (hair, horn, face, tanto, beads), the arm through his body, the soul pulled out.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE } from "../../core/index.js";
import { play, bodyAt, sealRun, drawSeals, drawFigure } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["mi", "i", "hitsuji", "u", "inu", "ne", "tori", "uma", "mi", "gassho"], 0.09, { hold: 0.3 });
const CLAP = SEALS.end - 0.25, APPEAR = CLAP + 0.1, ARM = CLAP + 0.7, SEIZE = ARM + 0.45, PULL = SEIZE + 0.25, OUTS = PULL + 0.6, CUT = OUTS + 0.25, EAT = CUT + 0.4, FADE = EAT + 0.5, END = FADE + 0.6, TX = 170;
const GH = ["#1a1424", "#3a2e4a", "#6a5a82", "#a898c0", "#e8e0f8"].map(hex), SOUL = ["#a8c8e8", "#e8f4ff"].map(hex), BEAD = hex("#2a1a10");
const SG = [-40, -120];

export const meta = {
  name: "Reaper death seal",
  desc: "Hiruzen: nine signs and a clap; the Shinigami fades in behind him, a tanto in its teeth and beads on its arm; its arm reaches out through his body into the target, seizes its soul, pulls it out struggling, cuts, and swallows it.",
  tags: ["jutsu", "hiruzen", "sarutobi", "fuuinjutsu", "seal", "forbidden", "one-shot"],
  size: [320, 230],
  origin: [96, 196],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a1424", "#3a2e4a", "#6a5a82", "#a898c0"], seed: 161 },
};

const BRACE = { ...READY, crouch: 6, lean: 2, armsFront: true, fx: 10, fy: -27, bx: 10, by: -27, ffx: 10, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [ARM, BRACE, "out"],
    [SEIZE, { ...BRACE, lean: 8, crouch: 8 }, "out"],
    [EAT, { ...BRACE, lean: -2 }, "out"],
    [END, { ...BRACE, crouch: 9, lean: 6 }],
  ],
  hits: [
    { t: CLAP, stop: 0.1, shake: 0.4, amp: 1, target: false, sfx: "clash" },
    { t: APPEAR, target: false, sfx: "cast" },
    { t: SEIZE, stop: 0.2, shake: 0.4, amp: 2, push: 0, straw: 8, flash: 0, shiver: 1, sfx: "block" },
    { t: PULL, stop: 0.06, push: -2, straw: 10, flash: 0, shiver: 1 },
    { t: CUT, stop: 0.18, shake: 0.6, amp: 3, push: 0, straw: 30, flash: 0.06, sfx: "whoosh" },
    { t: EAT, stop: 0.08, target: false, sfx: "heavy" },
  ],
};
// soulless after the cut: it greys and slumps
export const targetState = (t) => (t > CUT ? { dy: 3 * smooth(CUT, END, t), rot: -0.15 * smooth(CUT, END, t), tint: [GH[2], 0.45 * smooth(CUT, CUT + 0.3, t)] } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const tq = { ...READY };
  // the soul: where it is (inside the target until pulled, then out toward the Shinigami's hand, then into its mouth)
  const soulAt = (t) => {
    if (t < PULL) return [TX, 0, 0];
    if (t < CUT) { const u = ease.outCubic(clamp((t - PULL) / (OUTS - PULL))); return [TX - 26 * u, -6 * u, u]; }
    const u = ease.inCubic(clamp((t - CUT) / (EAT - CUT))); return [TX - 26 + (SG[0] + 6 - TX + 26) * u, -6 + (SG[1] + 46) * u, 1 - 0.7 * u];
  };
  return {
    update(t, dt) {
      if (t > APPEAR && t < FADE && R.chance(12 * dt)) ps.spawn(P.SMOKE, SG[0] + R.range(-40, 40), SG[1] + R.range(-20, 60), R.range(-6, 6), -R.range(4, 14), R.range(0.8, 1.4), GH[3], 1.5);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const k = smooth(APPEAR, APPEAR + 0.5, t) * (1 - smooth(FADE, END - 0.1, t));
      if (k > 0.01) {
        const [x, y] = SG;
        // the robe: a ghostly white shroud hanging from broad shoulders, folds running down it, dissolving into
        // drifting wisps toward the floor (it never touches the ground)
        p.shade(x - 56, y + 4, x + 44, y + 130, (X, Y, out) => {
          const v = (Y - y - 4) / 126, half = 30 + 18 * v + 4 * Math.sin(Y * 0.08 + t * 2), wisp = noise2(X * 0.06, Y * 0.05 - t * 1.2, 3);
          const dx = (X - x + 6) / half;
          if (Math.abs(dx) > 1 + 0.25 * wisp || v > 0.75 + 0.35 * wisp) return;
          out.a = k * (0.75 - 0.6 * Math.max(0, v - 0.35));
          const fold = Math.sin(dx * 9 + v * 2) > 0.7;
          return Math.abs(dx) > 0.9 ? GH[2] : fold ? GH[3] : v < 0.15 && Math.abs(dx) < 0.35 ? GH[1] : GH[4];
        });
        // the long white hair streaming down both sides of the head and over the shoulders
        for (let i = 0; i < 18; i++) { const side = i % 2 ? 1 : -1, sx = x + side * (8 + (i >> 1) * 1.2), wav = Math.sin(t * 2 + i * 0.7) * 3; p.beam(sx, y - 18, sx + side * 14 + wav, y + 40 + (i % 5) * 8, 2, i % 3 ? GH[4] : GH[3], 0.9 * k); }
        // the head: an oni's face in grey-violet: a heavy furrowed brow, glaring eyes, a long jaw split by a wide mouth
        // full of fangs that holds the tanto crosswise; a single horn out of the forehead
        p.poly([[x - 12, y - 18], [x + 12, y - 18], [x + 15, y - 4], [x + 11, y + 12], [x, y + 16], [x - 11, y + 12], [x - 15, y - 4]], GH[2], k);
        p.poly([[x - 9, y - 16], [x + 9, y - 16], [x + 12, y - 4], [x + 8, y + 9], [x, y + 12], [x - 8, y + 9], [x - 12, y - 4]], GH[3], 0.6 * k);
        p.tri(x - 3, y - 17, x + 3, y - 17, x + 2, y - 36, GH[4], k); p.line(x + 1, y - 18, x + 2, y - 34, GH[3], k);
        p.line(x - 12, y - 9, x - 2, y - 6, GH[0], k); p.line(x + 12, y - 9, x + 2, y - 6, GH[0], k);
        for (const s of [-1, 1]) { const ex = x + s * 6; p.ellipse(ex, y - 4, 3.5, 2, hex("#ffcf40"), k); p.px(ex + s * 0.5, y - 4, GH[0]); p.line(ex - 3, y - 7, ex + 3, y - 6 + s, GH[0], k); }
        const jaw = smooth(EAT - 0.35, EAT - 0.1, t) * (1 - smooth(EAT + 0.1, EAT + 0.4, t));
        p.ellipse(x, y + 5, 10, 2.5 + 5 * jaw, GH[0], k);
        for (let i = 0; i < 6; i++) { p.tri(x - 8 + i * 3, y + 3, x - 6 + i * 3, y + 3, x - 7 + i * 3, y + 5.5, WHITE, k); p.tri(x - 8 + i * 3, y + 7 + 5 * jaw, x - 6 + i * 3, y + 7 + 5 * jaw, x - 7 + i * 3, y + 4.5 + 5 * jaw, WHITE, k); }
        // the tanto: clenched crosswise in its teeth until the cut
        if (t < CUT - 0.25) { p.beam(x - 16, y + 5, x + 22, y + 4, 1.8, hex("#d8dce8"), k); p.rect(x - 21, y + 3, 6, 3, BEAD, k); }
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "scroll", t0: 0.04, t1: 0.3, label: "SHIKI FUUJIN", head: b.head });
      drawSeals(p, t, SEALS, GH);
      const k = smooth(APPEAR, APPEAR + 0.5, t) * (1 - smooth(FADE, END - 0.1, t));
      // the seal spreading on his stomach after the clap
      if (t > CLAP) { const s = smooth(CLAP, CLAP + 0.3, t), [cx, cy] = b.chest; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + t; p.line(cx + 1, cy + 8, cx + 1 + Math.cos(a) * 4 * s, cy + 8 + Math.sin(a) * 2 * s, GH[0]); } }
      // the arm: from the Shinigami's shoulder, down and through Hiruzen's back and chest, out to the target
      if (t > ARM - 0.2 && k > 0.01) {
        const reach = ease.inOutQuad(smooth(ARM - 0.2, SEIZE, t)), pull = ease.outCubic(smooth(PULL, OUTS, t)) * (1 - smooth(CUT, CUT + 0.3, t)), [cx, cy] = b.chest;
        const sh = [SG[0] + 20, SG[1] + 22], el = [cx - 6, cy], hx = cx + (TX - cx) * reach - 26 * pull, hy = cy + (-26 - cy) * reach + 20 * pull;
        // the upper arm (behind him), the forearm (out of his chest) drawn translucent where it passes through him
        p.beam(sh[0], sh[1], el[0], el[1], 6, GH[2], 0.85 * k);
        p.beam(el[0], el[1], hx, hy, 4.5, GH[3], 0.8 * k);
        p.beam(el[0], el[1], hx, hy, 2, GH[4], 0.4 * k);
        // the beads wound round its wrist
        for (let i = 0; i < 6; i++) { const u = 0.55 + i * 0.05, bx = el[0] + (hx - el[0]) * u, by = el[1] + (hy - el[1]) * u + Math.sin(i * 1.2) * 2.5; p.circle(bx, by, 1.4, BEAD, k); }
        // the clawed hand: open while reaching, closed round the soul
        const closed = smooth(SEIZE - 0.05, SEIZE + 0.1, t);
        for (let f = 0; f < 4; f++) { const a = -0.6 + f * 0.4 + closed * (f < 2 ? 0.5 : -0.5); p.line(hx, hy, hx + Math.cos(a) * (6 - closed * 3), hy + Math.sin(a) * (6 - closed * 3), GH[4], k); }
      }
      // the soul: a pale double of the target, pulled out of it, struggling, then dragged into the Shinigami's mouth
      if (t > PULL - 0.05 && t < EAT + 0.1) {
        const [sx, sy, s] = soulAt(t), kk = smooth(PULL - 0.05, PULL + 0.1, t) * (1 - smooth(EAT - 0.05, EAT + 0.1, t));
        tq.lean = Math.sin(t * 14) * 6; tq.fx = 14 + Math.sin(t * 11) * 4; tq.fy = -30 + Math.cos(t * 9) * 4; tq.bx = -4; tq.by = -32;
        drawFigure(p, tq, sx - 6, sy, { tint: SOUL[1], k: 0.85, a: 0.7 * kk * (0.5 + 0.5 * s) });
        p.glow(sx, sy - 20, 18, SOUL[0], 0.4 * kk);
        // the thread still tying it to the body until the cut
        if (t < CUT) for (let i = 0; i < 8; i++) p.px(TX + (sx - TX) * (i / 8), -20 + (sy - 20 + 20) * (i / 8) + Math.sin(i + t * 20), SOUL[1], 0.6 * kk);
      }
      // the cut: the tanto flashes across the thread
      if (t > CUT - 0.1 && t < CUT + 0.2) { const v = clamp((t - CUT + 0.1) / 0.15); p.beam(TX - 30 + 20 * v, -40 + 30 * v, TX - 10 + 20 * v, -20 + 30 * v, 1.6, hex("#e8ecf8"), 1 - v * 0.5); if (t > CUT) p.arc(TX - 14, -18, 12, 1, -0.6, 1.6, WHITE, 1 - (t - CUT) / 0.2); }
      void rand; void noise2; void lights;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

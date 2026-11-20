// Makyou Hyoushou (Demonic Mirroring Ice Crystals, Haku). Narutopedia: Ice Release of the Yuki clan, with its own
// one-handed seal; Haku raises mirrors of ice round the target, steps into one and appears in all of them, moving
// between them almost instantly and throwing senbon from every side. Here: Haku's hunter-nin mask, the one-handed seal,
// mist turning to ice: tall mirrors rising in a ring round the target, Haku vanishing into one and his reflection
// standing in each, then needles flying from all of them, again and again, until the mirrors crack and shatter.
// New: the mirrors (shaded slabs of ice with a sheen and his figure inside), the senbon volleys, the shatter.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const SEALS = sealRun(0.05, ["hiden"], 0.12, { hold: 0.4 }), RISE = SEALS.end, UP = RISE + 0.45, ENTER = UP + 0.15, V0 = ENTER + 0.3, VOL = 4, VG = 0.28, CRACK = V0 + VOL * VG + 0.15, END = CRACK + 1.1, TX = 150;
const ICE = ["#1a3a5a", "#3a78a8", "#8ac8f0", "#d8f4ff", "#ffffff"].map(hex);
// the mirrors: around the target in an ellipse, near ones in front, far ones behind
const MIR = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * TAU + 0.2;
  return { x: TX + Math.cos(a) * 50, z: Math.sin(a), by: Math.sin(a) * 6, d: i * 0.04 };
});

export const meta = {
  name: "Demonic ice mirrors",
  desc: "Haku: the one-handed seal, mirrors of ice rising in a ring round the target, Haku stepping into one and appearing in all of them, needles flying from every mirror again and again, until they crack and shatter.",
  tags: ["jutsu", "haku", "ice", "hyouton", "aoe", "dot", "one-shot"],
  size: [280, 150],
  origin: [56, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a3a5a", "#3a78a8", "#8ac8f0", "#d8f4ff", "#ffffff"], seed: 66 },
};

export const actorAlpha = (t) => (t >= ENTER && t < CRACK + 0.1 ? 0 : 1);

const THROW = { ...READY, crouch: 4, lean: 6, fx: 16, fy: -26, bx: -8, by: -22 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [CRACK + 0.1, { ...READY, crouch: 6 }, "snap"],
    [END, READY],
  ],
  hits: [
    ...Array.from({ length: VOL }, (_, v) => ({ t: V0 + v * VG + 0.08, stop: 0.03, flash: 0, push: v % 2 ? -0.8 : 0.8, straw: 10, shiver: 0.4, skin: v === 0 ? "ice" : undefined })),
    { t: CRACK, stop: 0.14, shake: 0.35, amp: 3, push: 2, straw: 20 },
    { t: END - 0.2, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

function mirror(p, m, t, h, crack, layer) {
  if ((m.z < 0) !== (layer === "back") || h <= 0) return;
  const sc = 1 + 0.15 * m.z, W = (12 + 2 * m.z) * sc, H = 50 * h * sc, x = m.x, k = 1 - crack, by = m.by;
  p.shade(x - W / 2 - 1, by - H - 1, x + W / 2 + 1, by, (px, py, out) => {
    const u = (px - x) / (W / 2), v = (by - py) / (50 * sc);
    if (Math.abs(u) > 1 || py < by - H || py > by) return;
    if (crack > 0 && ((Math.floor(px * 0.4 + py * 0.3) * 7 + Math.floor(py * 0.25)) % 5) / 5 < crack) return;
    out.a = 1;
    if (Math.abs(u) > 0.84 || py < by - H + 1.5) return ICE[3];
    // the sheen: a diagonal band of light across the ice
    if (Math.abs(u + v * 1.6 - 0.6) < 0.18) return ICE[3];
    p.blend(px, py, m.z < 0 ? ICE[1] : ICE[2], 0.5);
  });
  // Haku's reflection in it, once he's entered the mirrors
  if (t > ENTER && crack < 0.3 && h > 0.9) drawFigure(p, THROW, x - 2, by - 6, { face: x > TX ? -1 : 1, solid: m.z < 0 ? ICE[1] : ICE[0] });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let cracked = false;
  return {
    update(t, dt) {
      if (t > RISE - 0.3 && t < UP && R.chance(40 * dt)) ps.spawn(P.VAPOUR, TX + R.range(-50, 50), -R.range(2, 30), R.range(-10, 10), -R.range(4, 12), R.range(0.5, 0.9), ICE[3], R.range(3, 5));
      if (!cracked && t >= CRACK) {
        cracked = true;
        for (const m of MIR) for (let i = 0; i < 8; i++) ps.spawn(P.GRIT, m.x + R.range(-6, 6), -R.range(4, 44), R.range(-90, 90), -R.range(20, 140), R.range(0.5, 1), ICE[R.int(2, 4)], R.chance(0.5) ? 2 : 1);
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      const h = ease.outCubic(clamp((t - RISE) / (UP - RISE))), crack = smooth(CRACK, CRACK + 0.2, t);
      for (const m of MIR) mirror(p, m, t, clamp((t - RISE - m.d) / (UP - RISE)), crack, "back");
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, ICE);
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "haku", t0: 0.05, t1: SEALS.end, label: "HYOUTON", head: b.head });
      const crack = smooth(CRACK, CRACK + 0.2, t);
      for (const m of MIR) mirror(p, m, t, clamp((t - RISE - m.d) / (UP - RISE)), crack, "front");
      // his stepping into the nearest mirror: a flash of ice-light where he stood
      if (t > ENTER - 0.05 && t < ENTER + 0.15) p.glow(0, -20, 30, ICE[3], 1 - (t - ENTER + 0.05) / 0.2);
      // the senbon: thin silver needles flying from every mirror into the target, volley after volley
      for (let v = 0; v < VOL; v++) {
        const a = t - V0 - v * VG;
        if (a < 0 || a > 0.12) continue;
        const u = a / 0.1;
        MIR.forEach((m, i) => {
          for (let n = 0; n < 2; n++) {
            const y0 = -36 + n * 14 + (i % 3) * 3, x = m.x + (TX - m.x) * Math.min(1, u), y = y0 + (-28 - y0) * Math.min(1, u) * 0.3;
            const dx = TX - m.x, dl = Math.sign(dx) * 6;
            if (u < 1) p.line(x - dl, y, x, y, ICE[4]);
          }
        });
      }
      ps.draw(p, "front");
    },
  };
});

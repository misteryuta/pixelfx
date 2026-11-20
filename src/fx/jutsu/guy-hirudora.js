// Hirudora (Daytime Tiger, Might Guy). Narutopedia: possible only with the seventh gate open; the user holds one palm up
// in front of the face and strikes it with the other fist, which builds a huge pressure of air, then forms the
// technique's own tiger seal, launching the air at the opponent in the shape of a tiger's head. Here: the seventh gate
// (red skin, the chakra blue-green, sweat steaming off him), the palm raised, the fist striking it with a crack of
// pressure rings, the tiger seal, and a vast head of compressed air, ears, eyes and fangs, roaring out and swallowing the
// target in a blast.
// New: the tiger's head (shaded, see-through air with a white rim, its features cut in), the pressure rings, the blast
// dome. From _lib: the gates aura.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawGates } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const GATE = 0.1, OPENED = GATE + 0.55, PALM = OPENED + 0.15, STRIKE = PALM + 0.3, SEAL = STRIKE + 0.25, LAUNCH = SEAL + 0.15, FLY = 0.35, HIT = LAUNCH + FLY, END = HIT + 1.6, TX = 190;
const AIR = ["#1a5a6a", "#4aa8c0", "#a4e8f4", "#e8fbff", "#ffffff"].map(hex);

export const meta = {
  name: "Daytime tiger",
  desc: "Might Guy: the seventh gate opened, sweat steaming off him, a palm raised before his face and struck by his fist, the tiger seal, and a vast tiger's head of compressed air roaring out to swallow the target in a blast.",
  tags: ["jutsu", "guy", "taijutsu", "gates", "projectile", "aoe", "one-shot"],
  size: [342, 214],
  origin: [56, 170],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a5a6a", "#4aa8c0", "#a4e8f4", "#e8fbff", "#ffffff"], seed: 55 },
};

const BRACE = { ...READY, crouch: 9, lean: -2, fx: 12, fy: -16, bx: -6, by: -16, ffx: 12, fbx: -12 };
const PALMP = { ...READY, crouch: 6, lean: 0, fx: 10, fy: -32, bx: -4, by: -22, ffx: 11, fbx: -10 };
const STRIKEP = { ...PALMP, bx: 9, by: -32, armsFront: true };
const TIGER = { ...READY, crouch: 8, lean: 8, fx: 18, fy: -28, bx: 17, by: -27, armsFront: true, ffx: 12, fbx: -11 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [GATE + 0.2, BRACE, "out"],
    [PALM, PALMP, "out"],
    [STRIKE - 0.05, { ...PALMP, bx: -8, by: -30 }],
    [STRIKE, STRIKEP, "snap"],
    [SEAL, TIGER, "snap"],
    [LAUNCH, { ...TIGER, lean: 12 }, "snap"],
    [END - 0.4, { ...TIGER, lean: 4 }],
    [END, TIGER],
  ],
  hits: [
    { t: OPENED, stop: 0.08, shake: 0.35, amp: 3, target: false },
    { t: STRIKE, stop: 0.08, shake: 0.25, amp: 2, target: false },
    { t: HIT, stop: 0.24, shake: 0.7, amp: 5, push: 7, straw: 50 },
  ],
  dust: [{ t: OPENED, x: 0, n: 12 }, { t: LAUNCH, x: 6, n: 10, dir: -1 }],
};

// the tiger's head at (x, y), seen from the front, size s: its outline, then its features cut into the air
function inTiger(dx, dy) {
  const head = (dx / 1) ** 2 + (dy / 0.85) ** 2 < 1;
  const ear = (ex) => dy < -0.5 && dy > -1.12 && Math.abs(dx - ex) < (dy + 1.15) * 0.5;
  const ruff = (dx / 1.18) ** 2 + ((dy - 0.3) / 0.62) ** 2 < 1;
  return head || ear(-0.62) || ear(0.62) || ruff;
}
function tiger(p, x, y, s, t, k) {
  p.glow(x, y, s * 2, AIR[2], 0.5 * k);
  p.shade(x - s * 1.3, y - s * 1.3, x + s * 1.3, y + s * 1.1, (px, py, out) => {
    const dx = (px - x) / s, dy = (py - y) / s;
    if (!inTiger(dx, dy)) return;
    const e = 1.6 / s, edge = !inTiger(dx - e, dy) || !inTiger(dx + e, dy) || !inTiger(dx, dy - e) || !inTiger(dx, dy + e);
    out.a = k;
    if (edge) return WHITE;
    const ax = Math.abs(dx);
    // slanted eyes with a glint, the nose, a roaring mouth with fangs, stripes on the brow and cheeks
    if (Math.abs(ax - 0.38) < 0.2 && Math.abs(dy + 0.22 + (ax - 0.38) * 0.55) < 0.075) return ax > 0.4 && ax < 0.46 ? WHITE : AIR[0];
    if (dy > 0.02 && dy < 0.18 && ax < 0.16 - (dy - 0.02) * 0.8) return AIR[0];
    if ((dx / 0.46) ** 2 + ((dy - 0.48) / 0.26) ** 2 < 1) {
      if (Math.abs(ax - 0.24) < 0.07 - (dy - 0.26) * 0.3 && dy < 0.46) return WHITE;
      if (Math.abs(ax - 0.2) < 0.06 - (0.7 - dy) * 0.3 && dy > 0.52) return WHITE;
      return dy > 0.62 ? AIR[1] : AIR[0];
    }
    if (dy < -0.42 && ax < 0.3 && Math.abs(Math.sin(dx * 15)) < 0.3) return AIR[0];
    if (ax > 0.62 && dy > -0.15 && dy < 0.55 && Math.abs(Math.sin(dy * 13 + ax * 2)) < 0.25) return AIR[0];
    p.blend(px, py, dy < -0.2 ? AIR[3] : AIR[2], 0.45 * k);
  });
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let hit = false;
  const head = (t) => {
    const u = ease.inQuad(clamp((t - LAUNCH) / FLY));
    return [22 + (TX - 30 - 22) * u, -30 + 2 * u, 12 + 26 * u];
  };
  return {
    update(t, dt) {
      if (t > LAUNCH && t < HIT && R.chance(80 * dt)) {
        const [x, y, s] = head(t);
        ps.spawn(P.STREAK, x - s, y + R.range(-s, s), -R.range(80, 160), R.range(-20, 20), 0.15, R.chance(0.5) ? AIR[3] : WHITE);
        ps.spawn(P.DUST, x, -1, -R.range(40, 120), -R.range(4, 20), R.range(0.3, 0.6), hex("#a08c7a"), R.range(2, 4), 0, 0);
      }
      if (!hit && t >= HIT) {
        hit = true;
        for (let i = 0; i < 40; i++) ps.spawn(P.DUST, TX + R.range(-20, 20), -R.range(1, 40), R.range(-200, 220), -R.range(10, 120), R.range(0.5, 1), hex("#a08c7a"), R.range(3, 5), 0, 0);
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      drawGates(p, t, b.q, 7, smooth(GATE, GATE + 0.3, t) * (1 - smooth(END - 0.5, END, t)), "back");
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "gate", t0: GATE, t1: OPENED, label: "7TH GATE", head: b.head });
      drawGates(p, t, b.q, 7, smooth(GATE, GATE + 0.3, t) * (1 - smooth(END - 0.5, END, t)), "front");
      // the fist on the palm: rings of pressure snapping out, building until the seal
      if (t > STRIKE && t < LAUNCH) {
        const [hx, hy] = b.handN;
        for (let i = 0; i < 3; i++) {
          const ph = ((t - STRIKE) * 4 + i / 3) % 1;
          p.ring(hx + 3, hy, 4 + ph * 18, 1, AIR[3], 1 - ph);
        }
        if (t - STRIKE < 0.05) p.circle(hx + 3, hy, 7, WHITE);
      }
      if (t >= LAUNCH && t < HIT) {
        const [x, y, s] = head(t);
        tiger(p, x, y, s, t, 1);
      }
      // the blast: the head bursts into a dome of air round the target
      if (t >= HIT && t < HIT + 0.7) {
        const u = clamp((t - HIT) / 0.7), r = 30 + 60 * ease.outCubic(u);
        if (u < 0.15) tiger(p, TX - 20, -28, 38 + 20 * u, t, 1 - u / 0.15);
        p.ring(TX - 10, -24, r, 2, AIR[3], 1 - u);
        p.ring(TX - 10, -24, r * 0.7, 1, WHITE, 1 - u);
        p.ellipse(TX - 10, 0, r * 1.2, 3, AIR[2], 0.6 * (1 - u));
        p.glow(TX - 10, -24, r * 1.4, AIR[2], 0.6 * (1 - u));
      }
      const a = t - HIT;
      if (a > -0.2 && a < 1) p.text("HIRUDORA!", TX - 20, -120, a < 0.04 && a > -0.02 ? WHITE : AIR[3], { font: "big", align: "center", outline: hex("#0a1a20") });
      ps.draw(p, "front");
    },
  };
});

// Tengai Shinsei (Heavenly Meteor, Madara). Narutopedia: with the Rinnegan and his Susanoo, Madara weaves the seals Ram,
// Snake and Bird at once and draws a massive meteorite down from the upper atmosphere onto a chosen spot; the impact
// devastated a whole battlefield. Here: his Rinnegan, the three seals, the sky goes dark and a shadow grows over the
// ground round the target; a vast burning rock slides down out of the sky trailing fire, slams in, and the world is a
// flash, a blast, a ring of dust and rock.
// New: the darkening (_lib veil), the meteor (a shaded rock with a molten rim and a long trail of fire and smoke), its
// growing shadow. From the library: the big explosion and the ground slam at the impact.
import { Particles, P, PF, Lights, Rng, READY, fit, clamp, smooth, ease, hex, noise2, rand, WHITE } from "../../core/index.js";
import * as boom from "../explosions/big-explosion.js";
import * as slam from "../impacts/ground-slam.js";
import { play, sealRun, drawSeals, bodyAt, veil, impactFrame } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const SEALS = sealRun(0.05, ["hitsuji", "mi", "tori"], 0.12, { hold: 0.35 });
const DARK = SEALS.end, FALL0 = DARK + 0.4, IMPACT = FALL0 + 1.4, TX = 180, W = 380, H = 260, OX = 50, OY = 210;
const ROCK = ["#120e16", "#2a2230", "#463a4a", "#6a5a66", "#8a7880"].map(hex), MOLT = ["#7a1a0c", "#f2561d", "#ffc23d", "#fff3a6"].map(hex);

export const meta = {
  name: "Heavenly meteor",
  desc: "Madara: his Rinnegan, Ram, Snake and Bird, the sky darkens and a shadow grows over the target, a vast burning rock slides out of the sky trailing fire and slams in with a flash, a blast and a ring of dust.",
  tags: ["jutsu", "madara", "rinnegan", "meteor", "aoe", "one-shot"],
  size: [W, H],
  origin: [OX, OY],
  duration: IMPACT + 7.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a0a36", "#4a2490", "#8a5ae0", "#c8a8ff", "#f0e6ff"], seed: 45 },
};

const STAND = { ...READY, crouch: 2, lean: -3, fx: 6, fy: -26, bx: 9, by: -26, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [DARK + 0.2, STAND],
    [IMPACT, { ...STAND, lean: -6, crouch: 6, fx: -4, fy: -24, bx: -2, by: -26 }],
    [IMPACT + 0.4, { ...READY, crouch: 8, lean: -8, fx: -6, fy: -28, bx: 4, by: -30 }, "out"],
    [meta.duration, READY],
  ],
  hits: [
    { t: IMPACT, stop: 0.25, shake: 0.9, amp: 6, push: 7, straw: 60, skin: "char" },
    { t: meta.duration - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: IMPACT + 0.1, x: 0, n: 10, dir: -1 }],
};

// the meteor's centre and radius: out of the top right, sliding down onto the target
const RR = 46;
const rockAt = (t) => {
  const u = ease.inQuad(clamp((t - FALL0) / (IMPACT - FALL0)));
  return [TX + 150 - 150 * u, -OY - RR - 10 + (-RR * 0.55 + OY + RR + 10) * u];
};

export const create = play(
  [
    { fx: boom, t: IMPACT, x: TX, light: 1 },
    { fx: slam, t: IMPACT, x: TX, reach: 170, light: 0.6 },
  ],
  (o) => {
    const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
    let hit = false;
    return {
      update(t, dt) {
        if (t > FALL0 && t < IMPACT) {
          const [x, y] = rockAt(t);
          for (let i = 0; i < 4; i++) if (R.chance(60 * dt)) ps.spawn(P.FIRE, x + R.range(-RR, RR) * 0.6 + RR * 0.5, y - RR * 0.4 + R.range(-RR, RR) * 0.5, R.range(40, 90), -R.range(40, 100), R.range(0.4, 0.8), 0, R.range(4, 8), 0, PF.SMOKES | PF.BIG);
        }
        if (!hit && t >= IMPACT) {
          hit = true;
          lights.add(TX, -40, 260, MOLT[2], 1, 0.5);
          for (let i = 0; i < 40; i++) ps.spawn(P.GRIT, TX + R.range(-40, 40), -2, R.range(-260, 260), -R.range(120, 380), R.range(0.9, 1.8), ROCK[R.int(1, 4)], R.chance(0.5) ? 2 : 1);
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p, t) {
        // the sky goes dark under it
        const dk = smooth(DARK, DARK + 0.5, t) * (1 - smooth(IMPACT + 0.6, IMPACT + 2, t));
        veil(p, -OX, -OY, W - OX - 1, 0, hex("#0a0610"), 0.55 * dk);
        // its shadow on the ground, growing and darkening as it comes
        if (t > FALL0 && t < IMPACT) {
          const u = clamp((t - FALL0) / (IMPACT - FALL0));
          p.ellipse(TX + 40 * (1 - u), 0.5, 20 + 50 * u, 3 + 2 * u, hex("#050308"), 0.3 + 0.6 * u);
        }
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, [hex("#1a0a36"), hex("#4a2490"), hex("#8a5ae0"), hex("#c8a8ff"), hex("#f0e6ff")]);
        const b = bodyAt(act.poses, t);
        drawBadge(p, t, { kind: "rinnegan", t0: 0.05, t1: SEALS.end, label: "RINNEGAN", head: b.head });
        drawGlint(p, t, "rinnegan", SEALS.end + 0.05, meta.duration - 0.5, b.head);
        if (t > FALL0 && t < IMPACT + 0.05) {
          const [x, y] = rockAt(t);
          // the trail of fire behind it, up and to the right
          for (let i = 6; i > 0; i--) p.disc(x + i * 16, y - i * 14, RR * (0.9 - i * 0.08), MOLT[i > 3 ? 0 : 1], (d) => (d < 0.6 ? 0.5 : 0.25) * (1 - i / 7));
          p.glow(x, y, RR * 2.4, MOLT[1], 0.6);
          // the rock: shaded from the fire below-left, cratered, molten along the leading edge
          p.shade(x - RR - 1, y - RR - 1, x + RR + 1, y + RR + 1, (px, py, out) => {
            const ang = Math.atan2(py - y, px - x), edge = 0.86 + 0.14 * noise2(Math.cos(ang) * 2.5 + 9, Math.sin(ang) * 2.5, 4);
            const dx = (px - x) / (RR * edge), dy = (py - y) / (RR * edge), d2 = dx * dx + dy * dy;
            if (d2 > 1 || py > 0) return;
            const z = Math.sqrt(1 - d2), lit = -dx * 0.6 + dy * 0.5 + z * 0.4, n = noise2(dx * 4, dy * 4, 3);
            if (d2 > 0.86 && lit > 0.2) {
              out.k = 0.4;
              return lit > 0.55 ? MOLT[3] : MOLT[2];
            }
            if (n > 0.72) return ROCK[0];
            const v = lit + (n - 0.5) * 0.4;
            return v > 0.6 ? ROCK[4] : v > 0.35 ? ROCK[3] : v > 0.1 ? ROCK[2] : v > -0.2 ? ROCK[1] : ROCK[0];
          });
        }
        if (t >= IMPACT && t < IMPACT + 0.14) impactFrame(p, -OX, -OY, W - OX - 1, H - OY - 1, TX, -20, t >= IMPACT + 0.07, 17, { style: "shards", ink: hex("#140804"), paper: hex("#ffe6c8"), dir: Math.atan2(14, -16) });
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);

// Doton: Doryuu Heki (earth flow wall). Narutopedia: seals Ram, Dog, Ox, Snake; the user spits mud from the mouth onto
// the ground and where it lands a huge stone wall rises (or the hands are laid on the ground); its strength depends on
// the chakra, which keeps circulating inside it. The wiki picture: a tall wall of fitted stone. Shown defending: the
// enemy's fireball breaks on it.
// Built from: a new masonry wall (fitted blocks lit from the top left, a ragged crest) that heaves up out of the floor,
// the toolkit's grit, dust and rocks, the library fireball (sent back the other way) and small explosion where it
// breaks on the wall, and cracks drawn into the stone where it took the hit.
import { Particles, Bits, Lights, P, PF, B, Rng, READY, fit, clamp, smooth, ease, hex, WHITE, TAU, rand } from "../../core/index.js";
import * as fireball from "../fire/fireball.js";
import * as blast from "../explosions/small-explosion.js";
import { stoneShape, drawRock } from "../nature/_lib.js";
import { play, sealRun, drawSeals, MOUTH } from "./_lib.js";

const SEALS = sealRun(0.05, ["hitsuji", "inu", "ushi", "mi"], 0.12, { hold: 0.12 });
const SPIT = SEALS.end + 0.2, MUD = 0.32, RISE = SPIT + MUD, UP = 0.32, TX = 190;
const WX = 50, WW = 26, WH = 62;
const SHOT = RISE + 0.5, IMPACT = SHOT + 0.62, SINK = IMPACT + 1.3;
const [MX, MY] = [MOUTH[0] + 2, MOUTH[1] + 1];

export const meta = {
  name: "Earth wall",
  desc: "Doton: Ram, Dog, Ox, Snake, mud spat onto the ground, and a tall wall of fitted stone heaves up out of it just in time to take the enemy's fireball, then sinks back.",
  tags: ["jutsu", "earth", "doton", "defense", "wall", "move", "one-shot"],
  size: [320, 220],
  origin: [40, 190],
  duration: SINK + 4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#120c0c", "#251917", "#3b2a24", "#553d31", "#715440", "#8f6e52", "#b8966e", "#e6d0a8"],
    seed: 16,
  },
};

const PUFF = { ...READY, crouch: 3, lean: -4, fx: 7, fy: -26, bx: 9, by: -25, armsFront: true, ffx: 8, fbx: -8 };
const SPAT = { ...READY, crouch: 6, lean: 8, fx: 12, fy: -20, bx: -4, by: -20, ffx: 11, fbx: -10 };
const BRACE = { ...READY, crouch: 6, lean: -2, fx: 12, fy: -26, bx: 13, by: -20, armsFront: true, ffx: 9, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SPIT - 0.1, PUFF],
    [SPIT, SPAT, "snap"],
    [RISE + 0.2, BRACE],
    [IMPACT, { ...BRACE, crouch: 8, lean: -4 }, "snap"],
    [SINK + 0.6, READY],
    [meta.duration, READY],
  ],
  hits: [
    { t: RISE, stop: 0.08, shake: 0.25, amp: 2, target: false },
    { t: IMPACT, stop: 0.12, shake: 0.35, amp: 2, target: false },
  ],
  dust: [{ t: RISE, x: WX - 6, n: 8, dir: -1 }],
};

const height = (t) => (t < RISE ? 0 : WH * ease.outBack(clamp((t - RISE) / UP), 1.4)) * (1 - ease.inQuad(clamp((t - SINK) / 0.8)));
// the wall's masonry: fitted blocks in courses, lit from the upper left, a darker mortar line between
function wall(p, S, h, cracks, seed) {
  const x0 = WX - WW / 2, x1 = WX + WW / 2, top = -h;
  p.shade(x0 - 1, top - 4, x1 + 1, 1, (x, y, out) => {
    if (y > 0.5) return;
    const course = Math.floor((y - top) / 7), off = course % 2 ? 4 : 0;
    // the crest: a ragged line of broken stone
    const crest = top + 2 * rand(Math.floor(x / 3), seed);
    if (y < crest) return;
    const lx = x - x0, bx = Math.floor((lx + off) / 8), inX = (lx + off) % 8, inY = (y - top) % 7;
    const mortar = inX < 1 || inY < 1;
    const shade = lx < 2 ? 2 : lx > WW - 3 ? -2 : 0;
    const tone = 4 + Math.floor(rand(bx * 13 + course * 7, seed) * 2) + shade - (inY > 5 ? 1 : 0);
    out.c = mortar ? S[2] : S[clamp(tone, 2, 7)];
    if (x <= x0 + 0.5 || x >= x1 - 0.5) out.c = S[1];
  });
  // cracks where it took the hit: dark lines with a lit edge
  for (const c of cracks) for (let i = 1; i < c.length; i++) {
    p.line(c[i - 1][0], c[i - 1][1], c[i][0], c[i][1], S[0]);
    p.px(c[i][0] - 1, c[i][1], S[6]);
  }
}

export const create = play(
  [
    { fx: fireball, t: SHOT, until: IMPACT, flip: true, radius: 5, x: (t) => TX - 14 - (t - SHOT) * ((TX - 14 - (WX + WW / 2 + 4)) / (IMPACT - SHOT)), y: -24, light: 0.7 },
    { fx: blast, t: IMPACT, x: WX + WW / 2 + 2, y: 0, size: 0.45, light: 0.7 },
  ],
  (o) => {
    const S = fit(o.palette, 8), R = new Rng(o.seed), floor = () => 0, lights = new Lights();
    const ps = new Particles({ rng: R, ground: floor }), bits = new Bits({ ground: floor }), cracks = [];
    const DUST = hex("#8a7a6a");
    let up = false, hit = false, sunk = false;
    const mud = (t) => {
      const u = (t - SPIT) / MUD;
      if (u < 0 || u > 1) return null;
      return [MX + (WX - MX) * u, MY + (0 - MY) * u - 18 * Math.sin(Math.PI * u)];
    };
    return {
      update(t, dt) {
        const m = mud(t);
        if (m && R.chance(40 * dt)) ps.spawn(P.GRIT, m[0], m[1], R.range(-20, 20), R.range(-10, 30), R.range(0.3, 0.6), S[R.int(3, 5)], 1);
        if (!up && t >= RISE) {
          up = true;
          lights.add(WX, -10, 60, S[6], 0.4, 0.2);
          for (let j = 0; j < 10; j++) bits.add({ kind: B.CHUNK, x: WX + R.range(-WW / 2, WW / 2), y: -2, vx: R.range(-120, 120), vy: -R.range(120, 260), g: 1, drag: 0.3, bounce: 0.3, life: R.range(1, 1.8), a: R.range(0, TAU), va: R.range(-10, 10), s: R.range(1.6, 3.4), pts: stoneShape(R) });
          for (let j = 0; j < 16; j++) ps.spawn(P.SMOKE, WX + R.sign() * R.range(4, 14), -R.range(1, 6), R.sign() * R.range(40, 140), -R.range(5, 25), R.range(0.8, 1.4), DUST, R.range(3, 6), 0, PF.BIG);
          for (let j = 0; j < 30; j++) ps.spawn(P.GRIT, WX + R.range(-8, 8), -1, R.range(-100, 100), -R.range(80, 240), R.range(0.8, 1.4), S[R.int(3, 6)], R.chance(0.4) ? 2 : 1);
        }
        // while it climbs, grit sheds off its face
        if (t > RISE && t < RISE + UP + 0.2 && R.chance(40 * dt)) ps.spawn(P.GRIT, WX + R.range(-WW / 2, WW / 2), -height(t) * R.range(0.2, 1), R.range(-30, 30), R.range(-20, 10), R.range(0.6, 1), S[R.int(4, 6)], 1);
        if (!hit && t >= IMPACT) {
          hit = true;
          // the fireball breaks on it: cracks run across the face, chips fly back off it
          for (let c = 0; c < 3; c++) {
            const pts = [[WX + WW / 2, -24 + R.range(-4, 4)]];
            for (let k = 0; k < 5; k++) pts.push([pts[k][0] - R.range(2, 4), pts[k][1] + R.range(-4, 4)]);
            cracks.push(pts);
          }
          for (let j = 0; j < 8; j++) bits.add({ kind: B.CHUNK, x: WX + WW / 2, y: -24 + R.range(-6, 6), vx: R.range(40, 160), vy: -R.range(40, 160), g: 1, drag: 0.3, bounce: 0.3, life: R.range(0.8, 1.4), a: R.range(0, TAU), va: R.range(-10, 10), s: R.range(1.4, 2.6), pts: stoneShape(R) });
        }
        if (!sunk && t >= SINK) {
          sunk = true;
          for (let j = 0; j < 12; j++) ps.spawn(P.SMOKE, WX + R.range(-WW, WW), -R.range(0, 4), R.sign() * R.range(20, 70), -R.range(5, 15), R.range(0.8, 1.3), DUST, R.range(3, 5), R.range(0, 0.5), PF.BIG);
        }
        bits.update(dt);
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p, t) {
        // the mud splat it rises from
        if (t > RISE - 0.02 && t < SINK + 0.8) p.ellipse(WX, 0.5, WW * 0.8, 1.8, S[2], 0.8 * (1 - smooth(SINK, SINK + 0.8, t)));
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, SEALS, S.slice(3));
        const m = mud(t);
        if (m) {
          p.circle(m[0], m[1], 2.5, S[3]);
          p.px(m[0] - 1, m[1] - 1, S[5]);
        }
        const h = height(t);
        if (h > 1) wall(p, S, h, h > WH * 0.9 ? cracks : [], o.seed);
        for (const b of bits.list) drawRock(p, b.x, b.y, b.s, b.a, b.pts, S, Math.min(1, b.life / 0.4));
        ps.draw(p, "front");
        lights.draw(p);
      },
    };
  },
);

// Doton: Doryuudan (Earth Release: Earth Dragon Bullet). Narutopedia: the user shapes the earth into a dragon's head
// that rises from the ground and fires balls of mud from its mouth; with fire it becomes a fire dragon. Here: Tiger,
// Ram, Rat, Boar, Horse, Tiger, hands slapped onto the floor; the ground heaves and a dragon's head of rock and mud
// rears up out of it in front of him, jaw grinding open; it spits mud balls, one, two, three, each a heavy lump that
// splats onto the target and around it; the last a big one; then the head crumbles back into the earth.
// New: the rising earth head (rough rock shading, a moving jaw), the mud balls and splats.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, drawChunk } from "./_lib.js";

const SEALS = sealRun(0.05, ["tora", "hitsuji", "ne", "i", "uma", "tora"], 0.08, { hold: 0.1, kind: "earth" });
const SLAP = SEALS.end + 0.1, RISE = SLAP + 0.1, RISEN = RISE + 0.45, SHOTS = [RISEN + 0.1, RISEN + 0.35, RISEN + 0.65], FLY = 0.3, CRUMBLE = SHOTS[2] + 0.6, END = CRUMBLE + 1.2, TX = 190;
const ROCK = ["#1a1410", "#3a2e24", "#5a4a3a", "#7a6650", "#a08a6a"].map(hex), MUD = ["#2a1e14", "#4a3624", "#6a5034"].map(hex);
const HX = 50;

export const meta = {
  name: "Earth release: earth dragon bullet",
  desc: "Six seals and hands slapped on the floor: a dragon's head of rock and mud rears up out of the ground, jaw grinding open, and spits heavy balls of mud onto the target, the last a big one; then it crumbles back into the earth.",
  tags: ["jutsu", "earth", "doton", "dragon", "projectile", "one-shot"],
  size: [320, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#1a1410", "#3a2e24", "#5a4a3a", "#7a6650", "#a08a6a"], seed: 104 },
};

const SLAPP = { ...READY, crouch: 14, lean: 18, fx: 14, fy: -2, bx: 12, by: -2, ffx: 10, fbx: -12 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [SLAP, SLAPP, "in"],
    [CRUMBLE, SLAPP],
    [CRUMBLE + 0.4, READY, "out"],
    [END, READY],
  ],
  hits: [
    { t: SLAP, stop: 0.05, shake: 0.2, amp: 1, target: false, sfx: "step" },
    { t: RISE, shake: 0.9, amp: 2, target: false, sfx: "rumble" },
    ...SHOTS.map((t, i) => ({ t: t + FLY, stop: i === 2 ? 0.16 : 0.06, shake: 0.3 + i * 0.2, amp: 2 + i, push: 2 + i * 2, straw: 14 + i * 12, skin: i === 2 ? "char" : undefined, sfx: i === 2 ? "explosion" : "heavy" })),
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: RISE, x: HX - 10, n: 16, dir: -1 }, { t: RISE, x: HX + 20, n: 16, dir: 1 }],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), splats = [], bits = [];
  const rise = (t) => ease.outBack(smooth(RISE, RISEN, t), 1.3) * (1 - smooth(CRUMBLE, CRUMBLE + 0.5, t));
  const mouth = (t) => [HX + 34, -50 * rise(t) * 0.62];
  return {
    update(t, dt) {
      SHOTS.forEach((st, i) => { if (t >= st + FLY && !this["s" + i]) { this["s" + i] = 1; splats.push({ x: TX + (i - 1) * 8, at: t, big: i === 2 }); for (let j = 0; j < 10 + i * 8; j++) ps.spawn(P.GRIT, TX + (i - 1) * 8, -20, R.range(-120, 120), -R.range(40, 180), R.range(0.3, 0.7), MUD[R.int(0, 2)]); } });
      if (t >= CRUMBLE && !this.c) { this.c = 1; for (let i = 0; i < 14; i++) bits.push({ x: HX + R.range(-10, 30), y: -R.range(5, 45), vx: R.range(-60, 60), vy: -R.range(0, 80), a: R.range(0, TAU), s: R.range(2, 4), age: 0 }); }
      for (const c of bits) { c.vy += 500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.age += dt; if (c.y > -1) { c.y = -1; c.vy *= -0.2; c.vx *= 0.5; } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the mud source first (Narutopedia): the floor under his palms turns to mud and spreads, and the head rises out of it
      if (t > SLAP - 0.05) { const g = ease.outCubic(smooth(SLAP - 0.05, RISE + 0.2, t)) * (1 - smooth(CRUMBLE + 0.4, END - 0.2, t)); p.ellipse(HX + 10, 0, 40 * g, 3.5 * g, MUD[1]); p.ellipse(HX + 6, -0.5, 28 * g, 2 * g, MUD[2]); for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i * 0.33) % 1; p.ring(HX - 10 + i * 14, -1, 1 + ph * 2, 1, MUD[2], g * (1 - ph)); } }
      for (const s of splats) p.ellipse(s.x, 0, s.big ? 26 : 12, 2, MUD[1], 1 - smooth(1.2, 2, t - s.at));
      ps.draw(p, "back");
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, ROCK);
      const r = rise(t), f = Math.floor(t * 12);
      // the head: a rough wedge of rock rearing from the ground, a ridge of spikes, eye sockets, a grinding jaw
      if (r > 0.01) {
        const h = 50 * r, jaw = SHOTS.reduce((m, st) => Math.max(m, Math.sin(Math.PI * clamp((t - st + 0.15) / 0.25))), 0);
        p.shade(HX - 16, -h - 10, HX + 40, 1, (x, y, out) => {
          const dx = x - HX, yy = -y / Math.max(1, h);
          if (y > 0 || yy > 1) return;
          // a neck rising out of the ground, a heavy head leaning toward the target, the snout tapering to the mouth
          let left, right;
          if (yy < 0.45) { left = -10 + yy * 6; right = 14 + yy * 6; }
          else { const rel = (yy - 0.45) / 0.55; left = -14 + 8 * rel; right = 40 - 36 * Math.pow(Math.abs(rel - 0.3) / 0.7, 1.4); }
          if (dx < left || dx > right) return;
          // the open jaw: a wedge cut from the snout
          if (dx > 18 && Math.abs(yy - (0.45 + 0.3 * 0.55)) < 0.04 + jaw * 0.08) return dx > right - 3 ? undefined : MUD[0];
          const edge = dx < left + 1.5 || dx > right - 1.5 || yy > 0.97;
          const n = noise2(x * 0.25, y * 0.25, 4);
          return edge ? ROCK[0] : n > 0.45 ? ROCK[4] : n > 0.1 ? ROCK[3] : n > -0.3 ? ROCK[2] : ROCK[1];
        });
        for (let i = 0; i < 5; i++) p.tri(HX - 10 + i * 7, -h + 2 + i * 1.2, HX - 6 + i * 7, -h + 2 + i * 1.2, HX - 9 + i * 7, -h - 6 + i, ROCK[2]);
        p.circle(HX + 20, -h * 0.82, 2, hex("#0a0806"));
        p.px(HX + 20, -h * 0.82, hex("#ffb040"));
      }
      // the mud balls: lumps flying in arcs from the jaw onto the target
      SHOTS.forEach((st, i) => {
        if (t < st || t > st + FLY) return;
        const u = (t - st) / FLY, [mx, my] = mouth(st), tx = TX + (i - 1) * 8, ty = -20, x = mx + (tx - mx) * u, y = my + (ty - my) * u - Math.sin(u * Math.PI) * 18, rr = i === 2 ? 7 : 4;
        p.circle(x, y, rr, MUD[0]);
        p.circle(x - 1, y - 1, rr * 0.7, MUD[1]);
        p.px(x - rr * 0.4, y - rr * 0.4, MUD[2]);
        for (let j = 1; j < 4; j++) p.px(x - j * 5, y + Math.sin(u * Math.PI) * j * 2, MUD[1]);
      });
      // splats on the target
      for (const s of splats) { const a = t - s.at; if (a < 0.3) for (let i = 0; i < 8; i++) { const ang = (i / 8) * TAU, d = 4 + a * (s.big ? 60 : 30); p.circle(s.x + Math.cos(ang) * d, -20 + Math.sin(ang) * d * 0.7, 2.5 * (1 - a / 0.3) + 0.5, MUD[1]); } }
      for (const c of bits) drawChunk(p, c.x, c.y, c.s, c.a, ROCK.slice(1), 1 - smooth(0.8, 1.2, c.age));
      void f; void rand; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

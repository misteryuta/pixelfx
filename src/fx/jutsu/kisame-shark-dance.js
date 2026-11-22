// Suiton: Suirou Sameodori no Jutsu (Water Release: Water Prison Shark Dance, Kisame Hoshigaki fused with Samehada).
// Narutopedia: Kisame lets Samehada fuse with him, becoming a shark-man (gills, fins, a mouth full of fangs, Samehada's
// scales on his skin); he then fills a vast dome of water round himself and the enemy; inside it he swims like a shark
// at enormous speed while the enemy can't breathe or mould chakra (Samehada drinks it), and he tears at them at will.
// Here: he plants Samehada, its scales flare, the bandages split and it melts into him: blue skin, fins, gills,
// fangs; he slams his palms together and the water erupts from under him into a huge dome that swallows the target;
// inside, the target floats, bubbles streaming; Kisame streaks round it as a shark-man, a blue blur, biting on pass
// after pass (each bite a flash and a cloud of chakra drawn out); the dome bursts, the water crashes down and he
// stands, Samehada back on his shoulder.
// New: the fusion (scales flaring, the blade melting into him), the dome (a refracting wall with a light top, wobble,
// bubbles inside), the swimming shark-man, the burst.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, drawFigure } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const PLANT = 0.3, FUSE = 0.6, FUSED = 1.15, CLAP = 1.3, DOME = 1.5, SWIM = 2.0, BURST = 3.9, END = 4.9, TX = 160;
const SAME = ["#1a2a4a", "#3a5a8a", "#6a90c0", "#a8c8e8"].map(hex), SHARK = ["#1a3a5a", "#2a6a9a", "#5aa0d0", "#c8e8ff"].map(hex);
const WATER = ["#08203a", "#0e3a66", "#1a62a0", "#4aa0e0", "#a8e0ff"].map(hex), CHAK = hex("#8fe0ff");
const CX = 92, R0 = 104;

export const meta = {
  name: "Water prison shark dance",
  desc: "Kisame: Samehada melts into him and he becomes a shark-man; a huge dome of water swallows him and the target, and he streaks round inside it biting on pass after pass while the target floats helpless, until the dome bursts.",
  tags: ["jutsu", "kisame", "akatsuki", "water", "samehada", "aoe", "multi-hit", "one-shot"],
  size: [320, 240],
  origin: [56, 208],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#08203a", "#1a62a0", "#4aa0e0", "#a8e0ff"], seed: 165 },
};

const GRIP = { ...READY, crouch: 6, lean: 4, fx: 14, fy: -16, bx: 12, by: -18, ffx: 10, fbx: -10 };
const CLAPP = { ...READY, crouch: 5, armsFront: true, fx: 10, fy: -28, bx: 10, by: -28, ffx: 10, fbx: -10 };
// the passes: when each bite lands (the swim between is drawn by the effect, Kisame himself hidden)
const BITES = [SWIM + 0.35, SWIM + 0.75, SWIM + 1.05, SWIM + 1.3, SWIM + 1.5, SWIM + 1.68];
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [PLANT, GRIP, "out"],
    [FUSED, { ...GRIP, crouch: 8, lean: -6 }, "out"],
    [CLAP, CLAPP, "snap"],
    [BURST, CLAPP],
    [BURST + 0.01, { ...READY, crouch: 6 }, "snap"],
    [END, READY],
  ],
  hits: [
    { t: PLANT, target: false, sfx: "step" },
    { t: FUSE, target: false, sfx: "cast" },
    { t: CLAP, stop: 0.06, target: false, sfx: "clash" },
    { t: DOME, shake: 1.0, amp: 3, push: 0, straw: 10, flash: 0, sfx: "rumble" },
    ...BITES.map((t, i) => ({ t, stop: i === BITES.length - 1 ? 0.18 : 0.05, shake: 0.3, amp: 2, push: 0, straw: 14, flash: 0.03, skin: "frost", sfx: i % 2 ? "heavy" : "punch" })),
    { t: BURST, stop: 0.1, shake: 1.0, amp: 4, push: 4, straw: 20, sfx: "explosion" },
    { t: BURST + 0.6, flash: 0, push: 0, straw: 0, skin: null },
  ],
};
// floating inside the dome, drifting and turning; dropped when it bursts
export const targetState = (t) => (t > DOME + 0.2 && t < BURST + 0.4 ? { dy: -24 * smooth(DOME + 0.2, SWIM, t) * (1 - ease.inQuad(smooth(BURST, BURST + 0.4, t))) + Math.sin(t * 2) * 2, rot: Math.sin(t * 1.4) * 0.2 } : null);
// Kisame swims as the effect's shark-man from the dome until the burst
export const actorAlpha = (t) => (t > SWIM - 0.1 && t < BURST ? 0 : 1);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights(), drops = [];
  const domeR = (t) => R0 * ease.outBack(smooth(DOME, DOME + 0.45, t), 1.3) * (1 - smooth(BURST, BURST + 0.05, t));
  // the shark-man's path inside the dome: wide loops round the target, darting in at each bite
  const swimAt = (t) => {
    const a = (t - SWIM) * 7.5, near = BITES.reduce((m, b) => Math.max(m, Math.exp(-Math.pow((t - b) / 0.06, 2))), 0), r = 58 - 46 * near;
    return [TX + Math.cos(a) * r, -24 - 24 + Math.sin(a) * r * 0.7, -Math.sin(a) >= 0 ? 1 : -1];
  };
  const tq = { ...READY, crouch: 0, lean: 20, fx: 24, fy: -30, bx: 22, by: -26, ffx: -6, ffy: -8, fbx: -12, fby: -4 };
  return {
    update(t, dt) {
      if (t > DOME && t < BURST && R.chance(30 * dt)) ps.spawn(P.SPARK, TX + R.range(-6, 6), -40 + R.range(-10, 10), R.range(-6, 6), -R.range(20, 50), R.range(0.6, 1.2), WATER[4]);
      if (t >= BURST && !this.b) { this.b = 1; lights.add(CX, -60, 160, WATER[4], 0.6, 0.3); for (let i = 0; i < 70; i++) { const a = R.range(Math.PI, TAU), r = R.range(0.6, 1) * R0; drops.push({ x: CX + Math.cos(a) * r, y: Math.sin(a) * r * 0.95, vx: Math.cos(a) * R.range(60, 200), vy: Math.sin(a) * R.range(40, 160), age: 0 }); } }
      for (const d of drops) { d.vy += 500 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.age += dt; if (d.y > -1) { d.y = -1; d.vy = 0; d.vx *= 0.5; } }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the dome's interior: deep water, light from above, caustic ripples
      const Rr = domeR(t);
      if (Rr > 2) p.shade(CX - Rr, -Rr, CX + Rr, 1, (x, y, out) => {
        const d = Math.hypot((x - CX) / Rr, y / (Rr * 0.95)) + 0.03 * noise2(x * 0.05 + t, y * 0.05, 2);
        if (d > 1 || y > 0) return;
        out.a = 0.75;
        const caus = noise2(x * 0.12 + t * 1.5, y * 0.12 - t, 2), depth = 1 + y / Rr;
        return caus > 0.45 ? WATER[3] : depth > 0.7 ? WATER[1] : depth > 0.35 ? WATER[2] : WATER[2];
      });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "kisame", t0: 0.04, t1: PLANT, label: "SAMEODORI", head: b.head });
      // Samehada: on his shoulder, planted, scales flaring, melting into him
      const melt = smooth(FUSE, FUSED, t);
      if (t < FUSED || t > BURST) {
        const on = t < PLANT || t > BURST, [hx, hy] = b.handN, x0 = on ? b.chest[0] - 8 : hx, y0 = on ? b.chest[1] + 6 : 0, x1 = on ? b.chest[0] + 6 : hx + 2, y1 = on ? b.chest[1] - 22 : hy - 6;
        p.beam(x0, y0, x1, y1, 5 * (1 - melt), SAME[1]);
        for (let i = 0; i < 8; i++) { const u = i / 8, sx = x0 + (x1 - x0) * u, sy = y0 + (y1 - y0) * u, flare = smooth(PLANT, FUSE, t) * (1 - melt) * 2; p.tri(sx - 2, sy, sx + 2, sy, sx + (i % 2 ? 3 : -3) * (1 + flare), sy - 2 - flare, SAME[2]); }
        if (!on && melt > 0) for (let i = 0; i < 6; i++) { const u = (t * 3 + i / 6) % 1; p.px(x0 + (b.chest[0] - x0) * u, y0 + (b.chest[1] - y0) * u, SAME[3], melt); }
      }
      // fused: his skin goes blue, fins on the back and arms, gills
      if (t > FUSE + 0.2 && t < SWIM) {
        const k = smooth(FUSE + 0.2, FUSED, t);
        drawFigure(p, b.q, b.q.x ?? 0, b.q.y ?? 0, { tint: SHARK[2], k: 0.7 * k });
        const [cx, cy] = b.chest; p.tri(cx - 6, cy - 4, cx - 2, cy - 6, cx - 10, cy - 14, SHARK[1], k);
        for (let i = 0; i < 3; i++) p.line(b.head[0] - 1, b.head[1] + 2 + i, b.head[0] + 1, b.head[1] + 2 + i, SHARK[0], k);
      }
      // the shark-man swimming: a blue body with a dorsal fin and a tail, fangs bared on the bite; motion trail
      if (t > SWIM - 0.1 && t < BURST) {
        for (let g = 4; g >= 0; g--) {
          const tt = t - g * 0.025, [x, y, f] = swimAt(tt);
          if (g) { p.ellipse(x, y, 10, 3.5, SHARK[1], 0.25 * (1 - g / 5)); continue; }
          tq.lean = 70; drawFigure(p, tq, x - 4 * f, y + 16, { face: f, tint: SHARK[2], k: 0.75 });
          p.tri(x - 2 * f, y - 4, x + 4 * f, y - 4, x - 1 * f, y - 12, SHARK[1]);
          p.tri(x - 14 * f, y + 6, x - 22 * f, y, x - 22 * f, y + 12, SHARK[1]);
          const bite = BITES.some((bt) => Math.abs(t - bt) < 0.06);
          if (bite) { p.poly([[x + 8 * f, y - 2], [x + 16 * f, y - 4], [x + 16 * f, y + 4], [x + 8 * f, y + 2]], hex("#3a0a10")); for (let i = 0; i < 3; i++) { p.px(x + (10 + i * 2) * f, y - 2, WHITE); p.px(x + (10 + i * 2) * f, y + 2, WHITE); } }
        }
      }
      // the bites: a flash and a wisp of chakra drawn out of the target
      for (const bt of BITES) if (t > bt && t < bt + 0.4) { const v = (t - bt) / 0.4; if (v < 0.25) p.circle(TX, -48, 6 * (1 - v * 3), WHITE); for (let i = 0; i < 5; i++) p.px(TX + Math.cos(i * 1.3 + v * 4) * 8 * v, -48 + Math.sin(i * 1.3) * 8 * v, CHAK, 1 - v); }
      // the dome's skin over everything: a bright rim, a wobbling refracting wall, a light patch at the top
      const Rr = domeR(t);
      if (Rr > 2) {
        for (let a = Math.PI; a <= TAU + 0.001; a += 0.02) { const w = 1 + 0.03 * Math.sin(a * 7 + t * 4), x = CX + Math.cos(a) * Rr * w, y = Math.sin(a) * Rr * 0.95 * w; p.px(x, y, WATER[4]); p.px(x, y + 1, WATER[3], 0.7); }
        p.ellipse(CX - Rr * 0.3, -Rr * 0.75, Rr * 0.2, Rr * 0.06, WATER[4], 0.5);
        for (let i = 0; i < 12; i++) { const ph = (t * 0.6 + rand(i, 1)) % 1, x = CX + (rand(i, 2) - 0.5) * Rr * 1.4; p.ring(x, -ph * Rr * 0.9, 1 + rand(i, 3), 1, WATER[4], 0.6 * (1 - ph)); }
      }
      // the burst: the water crashing down
      for (const d of drops) p.beam(d.x, d.y, d.x - d.vx * 0.02, d.y - d.vy * 0.02, 1.6, WATER[3], 1 - smooth(0.6, 1.0, d.age));
      if (t > BURST) { const v = clamp((t - BURST) / 0.6); p.ellipse(CX, 0, R0 * (1 + 0.4 * v), 4, WATER[3], 0.6 * (1 - v)); }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

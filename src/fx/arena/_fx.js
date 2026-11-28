// Effect pieces for the roster's techniques on the 2.5D stage (2026-11-27), built on the pixelfx painter and meant to
// be combined and tuned per technique (colour, size, count, timing), not used as they are. Each returns an FX book
// definition for roster/summon/bake.mjs: { cw, ch, ox, oy, frames, fps, loop, ground, views, draw(p, u, i, view) }.
// Billboards: x right, y down, the pivot at (ox, oy) (a projectile's at its centre; the game lifts it to hand height).
// Floor books (ground: true): image x = the move's forward, y = its right, 1 px = 1 SPP.
// Pictures pointing somewhere (a comet, a blade) point to +x; the game turns them along the move on screen, or a views
// book draws them seen from the side, the front (coming at the camera) and the back (going away).
import { hex, mix } from "../../core/index.js";

export const SPP = 10.7 / 72;
export const px = (studs) => studs / SPP;
const TAU = Math.PI * 2;
export const ease = (u) => 1 - (1 - u) ** 3;
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const H = (h) => (typeof h === "number" ? h : hex(h));
export const blendDisc = (p, cx, cy, r, c, a) => { const R = Math.ceil(r); for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
export const blendEllipse = (p, cx, cy, rx, ry, c, a) => { for (let y = -Math.ceil(ry); y <= ry; y++) for (let x = -Math.ceil(rx); x <= rx; x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) p.blend(cx + x, cy + y, c, a); };
// a solid disc with a darker rim and a light spot (a ball of something)
export function ball(p, x, y, r, [c1, c2, c3], a = 1) {
  blendDisc(p, x, y, r, H(c3), a); blendDisc(p, x - r * 0.12, y - r * 0.12, r * 0.78, H(c2), a); blendDisc(p, x - r * 0.3, y - r * 0.3, r * 0.4, H(c1), a);
}
const pal = (c) => (Array.isArray(c) ? c.map(H) : [H(c), H(c), H(c)]);

// ---- spheres and cores
// a spinning ball of chakra (Rasengan): rings of streaks round a bright core (loop)
export const orb = ({ r = 14, c = ["#ffffff", "#a8e0ff", "#3a8ae0"], streaks = 6, frames = 6, fps = 14, glow = true } = {}) => ({
  cw: Math.ceil(r * 3.2), ch: Math.ceil(r * 3.2), ox: Math.ceil(r * 1.6), oy: Math.ceil(r * 1.6), frames, fps, loop: true,
  draw(p, u) {
    const [c1, c2, c3] = pal(c);
    if (glow) blendDisc(p, 0, 0, r * 1.45, c3, 0.18);
    blendDisc(p, 0, 0, r, c3, 0.55);
    for (let k = 0; k < streaks; k++) {
      const a0 = (k / streaks) * TAU + u * TAU, tilt = 0.35 + 0.5 * rnd(k);
      for (let t = 0; t < 2.2; t += 0.06) { const a = a0 + t, x = Math.cos(a) * r * 0.92, y = Math.sin(a) * r * 0.92 * tilt; p.blend(x, y, t > 1.6 ? c1 : c2, 0.85); }
    }
    blendDisc(p, 0, 0, r * 0.45, c1, 0.9);
  },
});
// a fireball / flame mass (loop): a lumpy, licking ball with a hot core
export const fireball = ({ r = 16, c = ["#fff6c0", "#ffb030", "#e0401a", "#8a1a10"], frames = 6, fps = 14 } = {}) => ({
  cw: Math.ceil(r * 3.4), ch: Math.ceil(r * 3.4), ox: Math.ceil(r * 1.7), oy: Math.ceil(r * 1.7), frames, fps, loop: true,
  draw(p, u) {
    const [c1, c2, c3, c4] = c.map(H);
    for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + u * 2, rr = r * (0.75 + 0.35 * Math.sin(u * TAU * 2 + k * 1.7)); blendDisc(p, Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45 - 2, rr * 0.55, c4, 0.55); }
    blendDisc(p, 0, 0, r, c3, 0.85);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU - u * 3; blendDisc(p, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.42 - 3, r * 0.42, c2, 0.85); }
    blendDisc(p, -2, -2, r * 0.42, c1, 0.95);
  },
});
// a head-on comet / streak pointing +x: a body and a tail (a projectile in flight; rotate = true in the look)
export const comet = ({ len = 40, r = 7, c = ["#ffffff", "#ffd060", "#e05020"], tail = 0.75, frames = 4, fps = 16, kind = "fire" } = {}) => ({
  cw: Math.ceil(len + r * 3), ch: Math.ceil(r * 4), ox: Math.ceil(len * 0.7), oy: Math.ceil(r * 2), frames, fps, loop: true,
  draw(p, u) {
    const [c1, c2, c3] = pal(c);
    for (let x = -len * 0.7; x <= 0; x++) {
      const q = 1 + x / (len * 0.7), w = r * (0.25 + 0.75 * q) * (1 + 0.15 * Math.sin(x * 0.5 + u * TAU * 2));
      for (let y = -w; y <= w; y++) p.blend(x, y, Math.abs(y) < w * 0.35 ? c2 : c3, (kind === "water" ? 0.55 : 0.75) * q * tail + 0.15);
    }
    blendDisc(p, 0, 0, r, c3, 0.9); blendDisc(p, r * 0.2, -r * 0.15, r * 0.65, c2, 0.95); blendDisc(p, r * 0.35, -r * 0.3, r * 0.3, c1, 1);
  },
});
// a crackling lightning: a few jagged bolts round a point (loop); hand = true for the Chidori in a hand
export const crackle = ({ R = 18, c = ["#ffffff", "#9ad8ff", "#3a70e8"], bolts = 6, frames = 4, fps = 20, core = 6 } = {}) => ({
  cw: Math.ceil(R * 2.6), ch: Math.ceil(R * 2.6), ox: Math.ceil(R * 1.3), oy: Math.ceil(R * 1.3), frames, fps, loop: true,
  draw(p, u, i) {
    const [c1, c2, c3] = pal(c);
    blendDisc(p, 0, 0, core * 1.8, c3, 0.25);
    for (let k = 0; k < bolts; k++) {
      let x = 0, y = 0;
      const a = rnd(k * 7 + i * 13) * TAU, L = R * (0.6 + 0.4 * rnd(k + i));
      for (let s = 0; s < 5; s++) {
        const nx = Math.cos(a) * L * (s + 1) / 5 + (rnd(k * 3 + s + i * 5) - 0.5) * 7, ny = Math.sin(a) * L * (s + 1) / 5 + (rnd(k * 5 + s + i * 11) - 0.5) * 7;
        p.line(x, y, nx, ny, s < 2 ? c1 : c2); p.line(x + 1, y, nx + 1, ny, c3, 0.6);
        x = nx; y = ny;
      }
    }
    blendDisc(p, 0, 0, core, c1, 1);
  },
});

// ---- bursts, rings and smoke
// an explosion (once): a flash, a ball of fire / chakra that swells, smoke rising
export const burst = ({ R = 40, c = ["#fff8d0", "#ffb030", "#e0401a"], smoke = "#5a4a44", frames = 10, fps = 16, rays = 0 } = {}) => ({
  cw: Math.ceil(R * 2.8), ch: Math.ceil(R * 2.6), ox: Math.ceil(R * 1.4), oy: Math.ceil(R * 2.0), frames, fps,
  draw(p, u) {
    const [c1, c2, c3] = pal(c), sm = H(smoke), k = ease(Math.min(1, u * 1.6)), a = 1 - Math.max(0, (u - 0.5) / 0.5);
    for (let s = 0; s < 10; s++) { const ang = rnd(s) * TAU, d = R * 0.7 * k * (0.6 + 0.4 * rnd(s + 3)); blendDisc(p, Math.cos(ang) * d, -R * 0.5 + Math.sin(ang) * d * 0.6 - R * 0.5 * u, R * 0.35 * (0.5 + k), sm, 0.45 * a * u * 1.6); }
    blendDisc(p, 0, -R * 0.5, R * k, c3, 0.85 * a);
    blendDisc(p, 0, -R * 0.55, R * 0.72 * k, c2, 0.9 * a);
    blendDisc(p, 0, -R * 0.6, R * 0.38 * k * (1 - u), c1, 1);
    for (let s = 0; s < rays; s++) { const ang = (s / rays) * TAU + 0.3; p.line(0, -R * 0.5, Math.cos(ang) * R * 1.2 * k, -R * 0.5 + Math.sin(ang) * R * 0.9 * k, c1, a); }
  },
});
// a ring of force on the floor that runs out (once), ground book
export const shock = ({ R = 40, c = "#e8f0ff", edge = "#5a6a8a", frames = 8, fps = 16, w = 4 } = {}) => ({
  ground: true, cw: Math.ceil(R * 2 + 12), ch: Math.ceil(R * 2 + 12), ox: Math.ceil(R + 6), oy: Math.ceil(R + 6), frames, fps,
  draw(p, u) { const r = R * ease(u), a = 1 - u; for (let t = 0; t < TAU; t += 1 / Math.max(8, r)) { const x = Math.cos(t), y = Math.sin(t); for (let d = 0; d < w; d++) p.blend(x * (r - d), y * (r - d), d === 0 ? H(edge) : H(c), a); } },
});
// a smoke puff (once): someone appearing / vanishing, a summoning
export const poof = ({ R = 26, c = ["#f4f2f6", "#cfcbd8", "#9e98ac"], frames = 9, fps = 18 } = {}) => ({
  cw: Math.ceil(R * 3), ch: Math.ceil(R * 3), ox: Math.ceil(R * 1.5), oy: Math.ceil(R * 2.4), frames, fps,
  draw(p, u) {
    const [c1, c2, c3] = pal(c), a = 1 - Math.max(0, (u - 0.45) / 0.55);
    for (let k = 0; k < 9; k++) { const ang = rnd(k) * TAU, d = R * 0.6 * ease(Math.min(1, u * 1.8)) * (0.5 + 0.5 * rnd(k + 2)), s = R * (0.35 + 0.25 * rnd(k + 4)) * (0.5 + 0.5 * Math.min(1, u * 2));
      blendDisc(p, Math.cos(ang) * d, -R * 0.7 + Math.sin(ang) * d * 0.6 - R * 0.3 * u, s + 1, c3, a); blendDisc(p, Math.cos(ang) * d, -R * 0.7 + Math.sin(ang) * d * 0.6 - R * 0.3 * u, s, c2, a); blendDisc(p, Math.cos(ang) * d - s * 0.25, -R * 0.7 + Math.sin(ang) * d * 0.6 - R * 0.3 * u - s * 0.25, s * 0.6, c1, a); }
  },
});
// a hit spark (once): a star of short lines and a flash
export const spark = ({ R = 16, c = ["#ffffff", "#ffe080"], frames = 5, fps = 20 } = {}) => ({
  cw: Math.ceil(R * 2.6), ch: Math.ceil(R * 2.6), ox: Math.ceil(R * 1.3), oy: Math.ceil(R * 1.3), frames, fps,
  draw(p, u) { const [c1, c2] = pal(c), k = ease(u), a = 1 - u; blendDisc(p, 0, 0, R * 0.5 * (1 - u), c1, 1); for (let s = 0; s < 8; s++) { const ang = (s / 8) * TAU + 0.2; p.line(Math.cos(ang) * R * 0.3 * k, Math.sin(ang) * R * 0.3 * k, Math.cos(ang) * R * k, Math.sin(ang) * R * k, s % 2 ? c2 : c1, a); } },
});
// a slash: a bright arc smear (once), facing +x
export const slash = ({ R = 26, c = ["#ffffff", "#c8e0ff"], frames = 5, fps = 20, w = 5, a0 = -1.2, a1 = 1.2 } = {}) => ({
  cw: Math.ceil(R * 2.6), ch: Math.ceil(R * 2.6), ox: Math.ceil(R * 1.3), oy: Math.ceil(R * 1.3), frames, fps,
  draw(p, u) { const [c1, c2] = pal(c), sweep = a0 + (a1 - a0) * ease(Math.min(1, u * 1.5)), al = 1 - u * u; for (let t = a0; t <= sweep; t += 0.02) { const q = (t - a0) / (a1 - a0); for (let d = 0; d < w * q + 1; d++) p.blend(Math.cos(t) * (R - d), Math.sin(t) * (R - d), d < 2 ? c1 : c2, al * (0.4 + 0.6 * q)); } },
});

// ---- floor marks (the tells)
// a target ring with a cross, pulsing (loop)
export const ring = ({ R = 30, c = "#ffd040", dark = "#5a4a10", frames = 6, fps = 12 } = {}) => ({
  ground: true, cw: Math.ceil(R * 2 + 10), ch: Math.ceil(R * 2 + 10), ox: Math.ceil(R + 5), oy: Math.ceil(R + 5), frames, fps, loop: true,
  draw(p, u) { const k = 0.92 + 0.08 * Math.sin(u * TAU); p.ring(0, 0, R * k, 3, H(dark), 0.9); p.ring(0, 0, R * k - 3, 1, H(c), 0.85); p.line(-6, 0, 6, 0, H(c), 0.8); p.line(0, -6, 0, 6, H(c), 0.8); for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (x * x + y * y < (R * k - 4) ** 2) p.blend(x, y, H(c), 0.08); },
});
// a lane along the forward line (loop): where a stream / a charge will run
export const lane = ({ len = 160, w = 14, c = "#e8f0ff", dark = "#2a3040", frames = 4, fps = 10 } = {}) => ({
  ground: true, cw: Math.ceil(len + 8), ch: Math.ceil(w * 2 + 8), ox: 2, oy: Math.ceil(w + 4), frames, fps, loop: true,
  draw(p, u) { for (let x = 0; x <= len; x++) { const on = ((x / 12 - u) % 1 + 1) % 1 < 0.6; for (const e of [-1, 1]) { p.blend(x, e * w, H(dark), on ? 0.9 : 0.35); if (on) p.blend(x, e * (w - 1), H(c), 0.85); } for (let y = -w + 2; y < w - 1; y++) p.blend(x, y, H(c), 0.1); } },
});
// a cone on the floor in front (loop): a breath, a gust, a gaze
export const coneMark = ({ len = 150, half = 30, c = "#ffd040", dark = "#5a4a10", frames = 4, fps = 10 } = {}) => ({
  ground: true, cw: Math.ceil(len + 8), ch: Math.ceil(2 * len * Math.tan(half * Math.PI / 180) + 10), ox: 2, oy: Math.ceil(len * Math.tan(half * Math.PI / 180) + 5), frames, fps, loop: true,
  draw(p, u) { const t = Math.tan(half * Math.PI / 180); for (let x = 4; x <= len; x++) { const w = x * t; p.blend(x, w, H(dark), 0.8); p.blend(x, -w, H(dark), 0.8); if (((x / 14 - u) % 1 + 1) % 1 < 0.5) { p.blend(x, w - 1, H(c), 0.85); p.blend(x, -w + 1, H(c), 0.85); } for (let y = -w + 2; y < w - 1; y += 1) p.blend(x, y, H(c), 0.07); } },
});
// a stain / pool / cracks left on the floor (loop or still)
export const pool = ({ R = 40, c = ["#4a3a6a", "#2a2040"], bubbles = "#8a7aaa", frames = 6, fps = 8, a = 0.6 } = {}) => ({
  ground: true, cw: Math.ceil(R * 2 + 6), ch: Math.ceil(R * 2 + 6), ox: Math.ceil(R + 3), oy: Math.ceil(R + 3), frames, fps, loop: true,
  draw(p, u) { const [c1, c2] = pal(c); for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y) / R + 0.05 * Math.sin(Math.atan2(y, x) * 7); if (d <= 1) p.blend(x, y, d > 0.86 ? c2 : c1, d > 0.86 ? a + 0.2 : a); } for (let k = 0; k < 9; k++) { const ph = (u + rnd(k)) % 1, ang = rnd(k + 4) * TAU, r = Math.sqrt(rnd(k + 7)) * R * 0.8; if (ph < 0.7) p.ring(Math.cos(ang) * r, Math.sin(ang) * r, 1 + ph * 3, 1, H(bubbles), 0.8 * (1 - ph)); } },
});
export const cracks = ({ R = 50, c = "#2a2018", n = 16, frames = 1 } = {}) => ({
  ground: true, cw: Math.ceil(R * 2.4), ch: Math.ceil(R * 2.4), ox: Math.ceil(R * 1.2), oy: Math.ceil(R * 1.2), frames, fps: 1,
  draw(p) { for (let k = 0; k < n; k++) { const a = (k / n) * TAU + rnd(k) * 0.4, r0 = R * 0.25 * rnd(k + 1), r1 = R * (0.7 + 0.5 * rnd(k + 2)); let x = Math.cos(a) * r0, y = Math.sin(a) * r0; for (let s = 1; s <= 4; s++) { const r = r0 + (r1 - r0) * s / 4, nx = Math.cos(a + (rnd(k * 4 + s) - 0.5) * 0.3) * r, ny = Math.sin(a + (rnd(k * 4 + s) - 0.5) * 0.3) * r; p.line(x, y, nx, ny, H(c), 0.9); x = nx; y = ny; } } blendDisc(p, 0, 0, R * 0.35, H(c), 0.35); },
});

// ---- streams, links and pieces along a line (shown every few studs, turned along the line)
// a piece of a stream / beam / dragon body pointing +x (loop): a band with a bright middle
export const band = ({ len = 22, w = 8, c = ["#ffffff", "#a8d8ff", "#3a78c8"], frames = 4, fps = 12, wave = 1, a = 0.8 } = {}) => ({
  cw: Math.ceil(len + 4), ch: Math.ceil(w * 2 + 6), ox: Math.ceil(len / 2 + 2), oy: Math.ceil(w + 3), frames, fps, loop: true,
  draw(p, u) { const [c1, c2, c3] = pal(c); for (let x = -len / 2; x <= len / 2; x++) { const ww = w * (1 + 0.15 * wave * Math.sin((x / len + u) * TAU * 2)); for (let y = -ww; y <= ww; y++) p.blend(x, y, Math.abs(y) > ww - 2 ? c3 : Math.abs(y) < ww * 0.3 ? c1 : c2, a); } },
});
// a shadow strip on the floor (ground; a piece pointing +x): Nara shadow techniques
export const shadow = ({ len = 18, w = 7, c = "#120c18", frames = 4, fps = 10 } = {}) => ({
  ground: true, cw: Math.ceil(len + 6), ch: Math.ceil(w * 2 + 8), ox: Math.ceil(len / 2 + 3), oy: Math.ceil(w + 4), frames, fps, loop: true,
  draw(p, u) { for (let x = -len / 2 - 1; x <= len / 2 + 1; x++) { const ww = w * (0.85 + 0.15 * Math.sin((x / len + u) * TAU)); for (let y = -ww; y <= ww; y++) p.blend(x, y, H(c), Math.abs(y) > ww - 1.5 ? 0.6 : 0.88); } },
});
// a chain link piece (billboard, pointing +x)
export const chain = ({ len = 14, c = "#9aa2b0", dark = "#3a3a44", frames = 1 } = {}) => ({
  cw: Math.ceil(len + 4), ch: 10, ox: Math.ceil(len / 2 + 2), oy: 5, frames, fps: 1,
  draw(p) { for (let k = -1; k <= 1; k++) { p.ring(k * len / 3, 0, 3, 1, H(dark)); p.ring(k * len / 3, 0, 2, 1, H(c)); } },
});

// ---- weapons and small projectiles (pointing +x)
export const kunai = ({ c = "#9aa2b0" } = {}) => ({
  cw: 40, ch: 12, ox: 20, oy: 6, frames: 1, fps: 1,
  draw(p) { const ink = hex("#1c1a24"), steel = H(c), hi = hex("#e4e8f0"); for (let x = 2; x <= 16; x++) { const w = Math.round((16 - x) * 0.32) + 1; p.rect(x, -w, 1, 2 * w + 1, ink); if (w > 1) p.rect(x, -w + 1, 1, 2 * w - 1, steel); p.blend(x, -1, hi, 1); } p.rect(-10, -1, 12, 3, ink); p.ring(-14, 0, 3, 1, ink); p.ring(-14, 0, 2, 1, steel); },
});
export const shuriken = ({ r = 7, c = "#8a92a0", frames = 4, fps = 20 } = {}) => ({
  cw: r * 3, ch: r * 3, ox: Math.ceil(r * 1.5), oy: Math.ceil(r * 1.5), frames, fps, loop: true,
  draw(p, u) { const ink = hex("#1c1a24"); for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + u * TAU / 4; p.tri(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a + 0.6) * 2.5, Math.sin(a + 0.6) * 2.5, Math.cos(a - 0.6) * 2.5, Math.sin(a - 0.6) * 2.5, H(c)); } p.circle(0, 0, 2, ink); },
});
export const needle = ({ len = 18, c = "#e0e8f0" } = {}) => ({ cw: len + 4, ch: 6, ox: Math.ceil(len / 2 + 2), oy: 3, frames: 1, fps: 1, draw(p) { p.line(-len / 2, 0, len / 2, 0, H(c)); p.line(-len / 2, 1, len / 2 - 2, 1, hex("#5a6a7a"), 0.8); } });
// a crescent blade of wind pointing +x (loop)
export const crescent = ({ R = 22, c = ["#ffffff", "#c8f0e0", "#7ac0a8"], frames = 4, fps = 16 } = {}) => ({
  cw: Math.ceil(R * 2.4), ch: Math.ceil(R * 2.4), ox: Math.ceil(R * 1.2), oy: Math.ceil(R * 1.2), frames, fps, loop: true,
  draw(p, u) { const [c1, c2, c3] = pal(c); for (let t = -1.3; t <= 1.3; t += 0.015) { const q = 1 - Math.abs(t) / 1.3, w = 1 + 5 * q; for (let d = 0; d < w; d++) p.blend(Math.cos(t) * (R - d) - R * 0.4, Math.sin(t) * (R - d), d < 1.5 ? c1 : d < w * 0.6 ? c2 : c3, 0.85 * (0.5 + 0.5 * q) * (0.8 + 0.2 * Math.sin(u * TAU + t * 4))); } },
});

// ---- on a figure
// an aura round a standing figure (loop): flames of colour rising (a buff, a gate, a mode)
export const aura = ({ c = ["#ffffff", "#a8f0a8", "#3aa85a"], h = 80, w = 30, frames = 6, fps = 12, a = 0.55 } = {}) => ({
  cw: Math.ceil(w * 2 + 10), ch: Math.ceil(h + 16), ox: Math.ceil(w + 5), oy: Math.ceil(h + 8), frames, fps, loop: true,
  draw(p, u) { const [c1, c2, c3] = pal(c); for (let k = 0; k < 16; k++) { const ph = (u + rnd(k)) % 1, x = (rnd(k + 3) - 0.5) * w * 1.7, y = -h * (0.15 + 0.85 * ph); blendEllipse(p, x, y, 3 + 3 * (1 - ph), 6 + 6 * (1 - ph), k % 3 ? c2 : c3, a * (1 - ph)); if (k % 4 === 0) p.blend(x, y, c1, a); } blendEllipse(p, 0, -h * 0.45, w, h * 0.55, c3, a * 0.25); },
});
// rings rising round someone held / healed / sealed (loop): a wrap of sand, water, light, seal script
export const wrap = ({ c = ["#f0e0b0", "#c8a870", "#8a6a40"], h = 80, w = 22, rings = 4, frames = 6, fps = 12, a = 0.85, fill = 0 } = {}) => ({
  cw: Math.ceil(w * 2 + 12), ch: Math.ceil(h + 14), ox: Math.ceil(w + 6), oy: Math.ceil(h + 6), frames, fps, loop: true,
  draw(p, u) { const [c1, c2, c3] = pal(c); if (fill) blendEllipse(p, 0, -h / 2, w, h / 2, c3, fill); for (let k = 0; k < rings; k++) { const y = -h * (k + 0.5) / rings; for (let t = 0; t < TAU; t += 0.04) { const x = Math.cos(t + u * TAU + k) * w, yy = y + Math.sin(t + u * TAU + k) * 5; if (Math.sin(t + u * TAU + k) > -0.2) p.blend(x, yy, k % 2 ? c2 : c1, a); } } },
});
// a dome / shell (loop): a barrier, a water prison, a sand shield (front = the near half drawn see-through)
export const dome = ({ R = 34, c = ["#e8f8ff", "#7ac0ff", "#2a6ab0"], frames = 6, fps = 10, a = 0.4, h = 1 } = {}) => ({
  cw: Math.ceil(R * 2 + 8), ch: Math.ceil(R * 2 * h + 10), ox: Math.ceil(R + 4), oy: Math.ceil(R * 2 * h + 4), frames, fps, loop: true,
  draw(p, u) { const [c1, c2, c3] = pal(c); for (let y = -R * 2 * h; y <= 0; y++) for (let x = -R; x <= R; x++) { const nx = x / R, ny = (y + R * h) / (R * h); const d = nx * nx + ny * ny; if (d > 1) continue; const rim = d > 0.8; p.blend(x, y, rim ? c3 : (Math.sin((nx + ny) * 9 + u * TAU) > 0.75 ? c1 : c2), rim ? a + 0.35 : a); } },
});
// a symbol over a head (loop): a spiral (genjutsu), a seal mark, petals, feathers
export const mark = ({ kind = "spiral", c = ["#f0e0ff", "#a070e0"], frames = 6, fps = 10, R = 9 } = {}) => ({
  cw: Math.ceil(R * 3), ch: Math.ceil(R * 3), ox: Math.ceil(R * 1.5), oy: Math.ceil(R * 1.5), frames, fps, loop: true,
  draw(p, u) {
    const [c1, c2] = pal(c);
    if (kind === "spiral") for (let t = 0; t < 10; t += 0.05) { const r = t * R / 10, a = t * 1.6 + u * TAU; p.blend(Math.cos(a) * r, Math.sin(a) * r * 0.8, t > 7 ? c2 : c1, 0.9); }
    else if (kind === "seal") { p.ring(0, 0, R, 1, c2); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + u; p.line(0, 0, Math.cos(a) * R, Math.sin(a) * R, c1, 0.7); } }
    else if (kind === "petals") for (let k = 0; k < 7; k++) { const ph = (u + rnd(k)) % 1, x = (rnd(k + 2) - 0.5) * R * 2.4 + Math.sin(ph * 6 + k) * 3, y = -R + ph * R * 2.4; blendEllipse(p, x, y, 2, 1.2, k % 2 ? c1 : c2, 1 - ph); }
    else if (kind === "stars") for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + u * TAU; p.dot(Math.cos(a) * R, Math.sin(a) * R * 0.4, k % 2 ? c1 : c2); p.dot(Math.cos(a) * R + 1, Math.sin(a) * R * 0.4, c1); }
  },
});
// mist / fog puffs (loop): a zone seen as billboard clouds
export const mist = ({ R = 60, c = ["#e8eef4", "#c8d4e0"], frames = 6, fps = 6, a = 0.45, n = 14 } = {}) => ({
  cw: Math.ceil(R * 2.4), ch: Math.ceil(R * 1.4), ox: Math.ceil(R * 1.2), oy: Math.ceil(R * 1.2), frames, fps, loop: true,
  draw(p, u) { const [c1, c2] = pal(c); for (let k = 0; k < n; k++) { const ph = u + rnd(k), x = (rnd(k + 1) - 0.5) * R * 2 + Math.sin(ph * TAU) * 6, y = -R * 0.2 - rnd(k + 5) * R * 0.8, s = R * (0.18 + 0.15 * rnd(k + 9)); blendDisc(p, x, y, s, k % 2 ? c1 : c2, a); } },
});
// speed lines behind a rush (loop), pointing +x (they trail to -x)
export const speed = ({ len = 70, h = 60, c = "#f0f0f0", n = 8, frames = 4, fps = 16 } = {}) => ({
  cw: Math.ceil(len + 10), ch: Math.ceil(h + 10), ox: 6, oy: Math.ceil(h + 4), frames, fps, loop: true,
  draw(p, u) { for (let k = 0; k < n; k++) { const y = -h * rnd(k + 2), L = len * (0.4 + 0.6 * rnd(k + 5)), x0 = -((u + rnd(k)) % 1) * len * 0.5; p.line(x0, y, x0 - L, y, H(c), 0.6); } },
});
// rocks / spikes erupting from the floor (once): the pivot at their base
export const spikes = ({ R = 34, n = 7, h = 40, c = ["#b8a888", "#8a7a5a", "#5a4a34"], frames = 7, fps = 16 } = {}) => ({
  cw: Math.ceil(R * 2.6), ch: Math.ceil(h * 1.6 + 10), ox: Math.ceil(R * 1.3), oy: Math.ceil(h * 1.4), frames, fps,
  draw(p, u) { const [c1, c2, c3] = pal(c), k = ease(Math.min(1, u * 2.2)), a = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1; for (let s = 0; s < n; s++) { const x = ((s + 0.5) / n - 0.5) * R * 2, hh = h * (0.5 + 0.5 * rnd(s)) * k, w = 5 + 4 * rnd(s + 1), lean = (rnd(s + 2) - 0.5) * 8; p.poly([[x - w, 0], [x + w, 0], [x + lean, -hh]], c2, a); p.poly([[x - w * 0.3, 0], [x + w * 0.4, 0], [x + lean * 0.9, -hh * 0.92]], c1, a); p.line(x + w, 0, x + lean, -hh, c3, a); } },
});

// a dragon's head (water, fire, wood ...): seen from the side (facing +x), the front (coming at the camera), the back;
// views: true (loop)
export const dragonHead = ({ c = ["#f0faff", "#7ac8f0", "#2a6ab0"], mouth = "#103050", s = 1, frames = 4, fps = 12 } = {}) => ({
  views: true, cw: Math.ceil(64 * s), ch: Math.ceil(54 * s), ox: Math.ceil(32 * s), oy: Math.ceil(27 * s), frames, fps, loop: true,
  draw(p, u, i, view) {
    const [c1, c2, c3] = c.map(H), jaw = (3 + 3 * Math.sin(u * TAU)) * s, K = s;
    if (view === "side") {
      blendEllipse(p, -4 * K, 0, 16 * K, 11 * K, c3, 0.9); blendEllipse(p, -3 * K, -K, 13 * K, 8 * K, c2, 0.92);
      for (let x = 6 * K; x <= 22 * K; x++) { p.blend(x, -5 * K + (x - 6 * K) * 0.15, c2, 0.95); p.blend(x, -4 * K + (x - 6 * K) * 0.15, c1, 0.7); p.blend(x, 3 * K + (x - 6 * K) * 0.25 + jaw * (x - 6 * K) / (16 * K), c2, 0.95); }
      p.rect(2 * K, -6 * K, 3, 2, hex("#ffffff"));
      for (let k = 0; k < 4; k++) p.line(-10 * K - k * 3 * K, -8 * K, -20 * K - k * 4 * K, -16 * K - k * 2 * K, c1, 0.8);
    } else if (view === "front") {
      blendDisc(p, 0, 0, 15 * K, c3, 0.9); blendDisc(p, 0, -K, 12 * K, c2, 0.92);
      blendEllipse(p, 0, 4 * K, 7 * K, 3 * K + jaw * 0.7, H(mouth), 0.9);
      for (const sg of [1, -1]) { p.rect(sg * 6 * K - 1, -6 * K, 3, 2, hex("#ffffff")); p.line(sg * 8 * K, 2 * K, sg * 22 * K, 0, c1, 0.8); p.line(sg * 6 * K, -10 * K, sg * 12 * K, -20 * K, c1, 0.85); }
    } else {
      blendDisc(p, 0, 0, 14 * K, c3, 0.9); blendDisc(p, 0, K, 11 * K, c2, 0.92);
      for (const sg of [1, -1]) p.line(sg * 5 * K, -8 * K, sg * 11 * K, -20 * K, c1, 0.85);
      for (let k = 0; k < 5; k++) p.line((k - 2) * 3 * K, -12 * K, (k - 2) * 4 * K, -22 * K - (k % 2) * 3, c1, 0.7);
    }
  },
});
// the Shinigami (the Reaper Death Seal's death god) looming behind the caster: a pale translucent giant with a knife
// in its mouth, its arm reaching through (loop)
export const reaper = ({ frames = 6, fps = 8 } = {}) => ({
  cw: 120, ch: 170, ox: 60, oy: 160, frames, fps, loop: true,
  draw(p, u) {
    const a = 0.45, w = hex("#e8e4f0"), d = hex("#6a5a8a"), k = hex("#2a1a3a");
    blendEllipse(p, 0, -60, 34, 70, w, a * 0.6);
    blendEllipse(p, 0, -132, 22, 24, w, a); for (const sg of [1, -1]) { p.line(sg * 12, -150, sg * 20, -164, d, 0.8); blendDisc(p, sg * 8, -134, 3, k, 0.9); }
    p.line(-10, -118, 12, -120, hex("#c8ccd8"), 0.9); p.rect(-4, -124, 8, 3, k, 0.8);
    for (let y = -100; y < 0; y += 6) p.line(-30 + Math.sin(y * 0.1 + u * 6.28) * 4, y, 30 + Math.sin(y * 0.1 + u * 6.28 + 1) * 4, y, d, 0.15);
    for (let k2 = 0; k2 < 6; k2++) { const ph = (u + k2 / 6) % 1; blendDisc(p, (rnd(k2) - 0.5) * 70, -ph * 160, 4, w, 0.25 * (1 - ph)); }
  },
});

// a pixelfx library effect used as drawn by the library (bake.mjs renders it on transparency at its own pixel scale):
// lib("impacts/hit-spark", { options: { palette: [...] }, t: 0.6 })
export const lib = (id, o = {}) => ({ lib: id, fps: 15, ...o });
// palettes for the library effects (dark to light)
export const PALS = {
  fire: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6"],
  chakra: ["#0c1a3a", "#1a3a7a", "#2a5ab0", "#3a8ae0", "#6ab0f0", "#a8e0ff", "#d8f4ff", "#ffffff"],
  red: ["#2a0808", "#5a1010", "#8a1a14", "#c02a1a", "#e85a30", "#ff8a50", "#ffd0b0", "#ffffff"],
  dark: ["#000000", "#0c0810", "#1c1428", "#3a2a5a", "#5a3aa0", "#8a6ae0", "#c8b8ff", "#ffffff"],
  purple: ["#1a0a2a", "#3a1a5a", "#5a2a8a", "#7a3ab0", "#a070e0", "#c8a0f0", "#f0e0ff", "#ffffff"],
  water: ["#0a2040", "#123a6a", "#1a5a9a", "#2a6ab0", "#4a90d0", "#7ac8f0", "#c0e8ff", "#f0faff"],
  sand: ["#3a2a18", "#5a4428", "#8a6a40", "#a88858", "#c8a870", "#e0c890", "#f0dcb0", "#fff4dc"],
  earth: ["#2a1712", "#4a3a28", "#6a5038", "#8a7050", "#a89070", "#c8b090", "#e8d8b8", "#ffffff"],
  wind: ["#1a3a30", "#2a5a4a", "#3a7a64", "#5a9a80", "#8ac8b0", "#b8e8d8", "#e0fff4", "#ffffff"],
  steam: ["#3a3a40", "#5a5a64", "#7a7a84", "#9a9aa4", "#b8b8c0", "#d8d8e0", "#ececf0", "#ffffff"],
  green: ["#0a2a14", "#14502a", "#1a7a3a", "#2aa858", "#5ad080", "#9af0b0", "#d0ffe0", "#ffffff"],
};

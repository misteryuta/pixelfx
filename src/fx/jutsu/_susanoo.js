// Susanoo, the avatar of the Mangekyou (helper, not an effect). Narutopedia: it forms in stages round its user: first a
// ribcage, then a skeleton with arms, then muscle and armour; it is the user's chakra, in their color (Itachi red, Sasuke
// purple, Madara blue), translucent, with burning edges. Itachi's has a long tengu nose and carries the Totsuka sword and
// the Yata mirror; Sasuke's has a horned crest and a bow. Drawn round a user standing at (0, 0) facing right.
import { hex, mix, clamp, smooth, rand, noise2, TAU, WHITE } from "../../core/index.js";

const GLOW = hex("#ffe040"), GLOW2 = hex("#fff6b0");

export const SUSANOO = {
  itachi: ["#3a0808", "#8a1418", "#d8302c", "#ff7a5a", "#ffd0c0"].map(hex),
  sasuke: ["#1a0a36", "#4a2490", "#8a5ae0", "#c8a8ff", "#f0e6ff"].map(hex),
  madara: ["#0a1636", "#1a3a8a", "#3a78e0", "#8ac0ff", "#e0f0ff"].map(hex),
};

const seg = (x, y, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(x - ax - dx * u, y - ay - dy * u);
};
const inPoly = (x, y, P) => {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) if (P[i][1] > y !== P[j][1] > y && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
  return c;
};

// an arm from shoulder (sx, sy) to hand (hx, hy), upper arm and forearm L long each: where the elbow bends to (down)
export function elbowOf(sx, sy, hx, hy, L = 26) {
  const dx = hx - sx, dy = hy - sy, d = Math.min(Math.hypot(dx, dy), 2 * L - 0.01) || 1, h = Math.sqrt(Math.max(0, L * L - (d / 2) ** 2));
  let px = -dy / d, py = dx / d;
  if (py < 0) { px = -px; py = -py; }
  return [sx + dx / 2 + px * h, sy + dy / 2 + py * h];
}
const SH = [28, -66], SH2 = [-22, -66], CORE = [2, -50];

/**
 * stage: 0 nothing, 1 ribcage, 2 skeleton with arms, 3 body and armour (fractions blend in between). It builds the way
 * Narutopedia describes: ribs round the user, then the bones, then the flesh grows outward from the chest (a burning
 * front sweeping out over the skeleton until it reaches the head, the hands, the horns), and the armour plates harden
 * last. kind: itachi / sasuke / madara. arm: the front hand ([x, y]); arm2: the far hand, or none; fade 0..1 takes it away.
 */
export function drawSusanoo(p, t, { kind = "sasuke", stage = 3, arm = [44, -60], arm2 = null, fade = 0 } = {}) {
  const C = SUSANOO[kind], k = 1 - fade, f = Math.floor(t * 20);
  if (stage <= 0 || k <= 0) return;
  const ribs = clamp(stage), bones = clamp(stage - 1), flesh = clamp(stage - 2), armour = smooth(0.55, 1, flesh);
  const [hx, hy] = arm, [ex, ey] = elbowOf(SH[0], SH[1], hx, hy);
  const el2 = arm2 ? elbowOf(SH2[0], SH2[1], arm2[0], arm2[1]) : null;
  // the glow it sheds
  p.glow(4, -50, 70 * Math.min(1, stage / 2), C[2], 0.35 * k);
  if (flesh > 0) {
    const inside = (x, y) => {
      if (((x - 3) / 11) ** 2 + ((y + 86) / 13) ** 2 < 1) return true; // head
      if (((x - 2) / 23) ** 2 + ((y + 52) / 20) ** 2 < 1) return true; // chest
      if (((x - 1) / 15) ** 2 + ((y + 26) / 16) ** 2 < 1 && y < -10) return true; // belly, tapering to the waist
      if (seg(x, y, 2, -76, 2, -66) < 6) return true; // neck
      if (((x + 22) / 12) ** 2 + ((y + 64) / 7) ** 2 < 1 || ((x - 26) / 12) ** 2 + ((y + 64) / 7) ** 2 < 1) return true; // pauldrons
      if (seg(x, y, SH[0], SH[1], ex, ey) < 6 || seg(x, y, ex, ey, hx, hy) < 5) return true; // the front arm
      if (el2 && (seg(x, y, SH2[0], SH2[1], el2[0], el2[1]) < 5.5 || seg(x, y, el2[0], el2[1], arm2[0], arm2[1]) < 4.5)) return true; // the far arm
      if (kind === "itachi" && inPoly(x, y, [[10, -90], [34, -84], [10, -82]])) return true; // the tengu nose
      if (kind !== "itachi" && (inPoly(x, y, [[-4, -94], [-14, -110], [0, -97]]) || inPoly(x, y, [[7, -97], [11, -110], [11, -95]]))) return true; // horns
      return false;
    };
    // how far the flesh has grown out from the chest: a ragged front sweeping outward
    const reach = flesh * 110;
    const grown = (x, y) => Math.hypot(x - CORE[0], y - CORE[1]) + 5 * noise2(x * 0.15, y * 0.15 + t * 2, 6) < reach;
    const xr = Math.max(64, hx + 8, arm2 ? arm2[0] + 8 : 0), yt = Math.min(-126, hy - 8, arm2 ? arm2[1] - 8 : 0), xl = Math.min(-44, hx - 8, arm2 ? arm2[0] - 8 : 0);
    p.shade(xl, yt, xr, Math.max(-4, hy + 8), (x, y, out) => {
      if (!grown(x, y)) return;
      const d = Math.hypot(x - CORE[0], y - CORE[1]);
      if (!inside(x, y)) {
        // the chakra burns off its outline in licking flames (both references: a flaming edge round the whole avatar)
        const lick = 2 + 5 * noise2(x * 0.25, y * 0.15 + t * 7, 4);
        if (inside(x, y + lick) && noise2(x * 0.4, y * 0.3 + t * 9, 8) > 0.1) {
          out.a = k * flesh * 0.8;
          out.k = 0.25;
          return C[3];
        }
        return;
      }
      // the growing front: a bright burning seam where new flesh is forming
      if (flesh < 1 && reach - d < 4 + 5 * noise2(x * 0.15, y * 0.15 + t * 2, 6)) {
        out.a = k;
        out.k = 0.5;
        return C[4];
      }
      const edge = !inside(x - 1.5, y) || !inside(x + 1.5, y) || !inside(x, y - 1.5 - rand(Math.floor(x), f) * 2) || !inside(x, y + 1.5);
      if (edge) {
        out.a = k;
        out.k = 0.35;
        return C[4];
      }
      // the armour plates harden last: darker bands across the chest, a lighter face
      const band = armour > 0 && (Math.floor((y + 70) / 8) & 1) && y > -68 && y < -14 && Math.abs(x - 2) < 20;
      p.blend(x, y, band ? C[2] : y < -74 ? C[3] : C[2], k * (band ? 0.3 + 0.2 * armour : 0.3));
    });
    // the skull's face: dark sockets lit by glowing yellow eyes, a row of teeth (as in the references), once the flesh is there
    const face = smooth(0.35, 0.5, flesh) * k;
    if (face > 0) {
      for (const fx of [1, 9]) {
        p.circle(fx, -88, 3, C[0], face);
        p.circle(fx, -88, 2, GLOW, face);
        p.px(fx, -88, GLOW2);
        p.glow(fx, -88, 9, GLOW, 0.7 * face);
      }
      p.line(-1, -81, 9, -81, C[0], face);
      for (let tx = -1; tx <= 9; tx += 2) p.line(tx, -82, tx, -80, C[4], face);
    }
  }
  // the skeleton: skull, spine to the neck, the arms' bones; still seen through the flesh until the armour closes
  if (bones > 0 && armour < 1) {
    const a = k * bones * (1 - armour) * (flesh > 0 ? 0.7 : 1), grow = bones;
    const bone = (sx, sy, ax, ay, bx, by) => {
      const mx = sx + (bx - sx) * grow, my = sy + (by - sy) * grow;
      p.beam(ax, ay, Math.min(1, grow * 2) * (mx - ax) + ax, Math.min(1, grow * 2) * (my - ay) + ay, 3, C[3], a);
    };
    bone(SH[0], SH[1], SH[0], SH[1], ex, ey);
    if (grow > 0.5) p.beam(ex, ey, ex + (hx - ex) * (grow - 0.5) * 2, ey + (hy - ey) * (grow - 0.5) * 2, 2.5, C[3], a);
    p.circle(ex, ey, 2.5, C[4], a);
    if (grow > 0.95) p.circle(hx, hy, 3.5, C[3], a);
    if (el2) {
      p.beam(SH2[0], SH2[1], el2[0], el2[1], 2.5, C[3], a * grow);
      p.beam(el2[0], el2[1], arm2[0], arm2[1], 2, C[3], a * grow);
    }
    p.beam(SH2[0], SH2[1], SH[0], SH[1], 2, C[3], a); // the collarbone
    p.beam(2, -78, 2, -60, 2.5, C[3], a); // the neck
    // the skull: a cranium, dark sockets with the yellow eyes, a jaw
    p.circle(4, -88, 9 * grow, C[3], a * 0.8);
    p.circle(1, -88, 2.4, C[0], a);
    p.circle(9, -88, 2.4, C[0], a);
    p.circle(1, -88, 1.4, GLOW, a);
    p.circle(9, -88, 1.4, GLOW, a);
    p.rect(-2, -80, 12, 3, C[3], a * grow);
  }
  // the ribcage: a spine and curved ribs round him, drawn first and kept under the armour
  if (ribs > 0) {
    const a = k * (flesh > 0 ? 0.75 : 1);
    const n = Math.ceil(6 * ribs);
    p.beam(-6, -6, -6, -6 - 64 * ribs, 2.5, C[3], a);
    for (let i = 0; i < n; i++) {
      const y = -16 - i * 9;
      p.arc(-6, y + 10, 18 - Math.abs(i - 2.5) * 1.5, 2, -1.75, -0.25, C[3], a);
      p.arc(-6, y + 10, 18 - Math.abs(i - 2.5) * 1.5, 1, -1.75, -0.25, C[4], a);
      p.arc(-6, y + 10, 14 - Math.abs(i - 2.5), 1, -2.9, -1.95, C[2], a);
    }
  }
}

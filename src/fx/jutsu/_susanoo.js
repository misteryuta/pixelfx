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

/**
 * stage: 0 nothing, 1 ribcage, 2 skeleton with arms, 3 full armour (fractions blend in between). kind: itachi / sasuke /
 * madara. arm: where the front hand is ([x, y]); fade 0..1 takes it away.
 */
export function drawSusanoo(p, t, { kind = "sasuke", stage = 3, arm = [44, -60], fade = 0 } = {}) {
  const C = SUSANOO[kind], k = 1 - fade, f = Math.floor(t * 20);
  if (stage <= 0 || k <= 0) return;
  const ribs = clamp(stage), bones = clamp(stage - 1), flesh = clamp(stage - 2);
  // the glow it sheds
  p.glow(4, -50, 70 * Math.min(1, stage / 2), C[2], 0.35 * k);
  // the full body: translucent, a burning rim, the eyes lit
  if (flesh > 0) {
    const [hx, hy] = arm;
    const inside = (x, y) => {
      if (((x - 3) / 11) ** 2 + ((y + 86) / 13) ** 2 < 1) return true; // head
      if (((x - 2) / 23) ** 2 + ((y + 52) / 20) ** 2 < 1) return true; // chest
      if (((x - 1) / 15) ** 2 + ((y + 26) / 16) ** 2 < 1 && y < -10) return true; // belly, tapering to the waist
      if (seg(x, y, 2, -76, 2, -66) < 6) return true; // neck
      if (((x + 22) / 12) ** 2 + ((y + 64) / 7) ** 2 < 1 || ((x - 26) / 12) ** 2 + ((y + 64) / 7) ** 2 < 1) return true; // pauldrons
      if (seg(x, y, 28, -66, (28 + hx) / 2 + 4, (hy - 66) / 2 + 10) < 6 || seg(x, y, (28 + hx) / 2 + 4, (hy - 66) / 2 + 10, hx, hy) < 5) return true; // the front arm
      if (kind === "itachi" && inPoly(x, y, [[10, -90], [34, -84], [10, -82]])) return true; // the tengu nose
      if (kind !== "itachi" && (inPoly(x, y, [[-4, -94], [-14, -110], [0, -97]]) || inPoly(x, y, [[7, -97], [11, -110], [11, -95]]))) return true; // horns
      return false;
    };
    const rise = 1 - flesh;
    p.shade(-44, -126, 64 + Math.max(0, hx - 50), -4, (x, y, out) => {
      const yy = y + rise * 20;
      if (!inside(x, yy)) {
        // the chakra burns off its outline in licking flames (both references: a flaming edge round the whole avatar)
        const lick = 2 + 5 * noise2(x * 0.25, yy * 0.15 + t * 7, 4);
        if (inside(x, yy + lick) && noise2(x * 0.4, yy * 0.3 + t * 9, 8) > 0.45) {
          out.a = k * flesh * 0.8;
          out.k = 0.25;
          return C[3];
        }
        return;
      }
      const edge = !inside(x - 1.5, yy) || !inside(x + 1.5, yy) || !inside(x, yy - 1.5 - rand(Math.floor(x), f) * 2) || !inside(x, yy + 1.5);
      if (edge) {
        out.a = k * flesh;
        out.k = 0.35;
        return C[4];
      }
      // the armour plates: darker bands across the chest, a lighter face
      const band = (Math.floor((yy + 70) / 8) & 1) && yy > -68 && yy < -14 && Math.abs(x - 2) < 20;
      p.blend(x, y, band ? C[2] : yy < -74 ? C[3] : C[2], k * flesh * (band ? 0.45 : 0.3));
    });
    // the skull's face: dark sockets lit by glowing yellow eyes, a row of teeth (as in the references)
    const ey = -88 - rise * 20, kk = k * flesh;
    for (const ex of [1, 9]) {
      p.circle(ex, ey, 3, C[0], kk);
      p.circle(ex, ey, 2, GLOW, kk);
      p.px(ex, ey, GLOW2);
      p.glow(ex, ey, 9, GLOW, 0.7 * kk);
    }
    p.line(-1, ey + 7, 9, ey + 7, C[0], kk);
    for (let tx = -1; tx <= 9; tx += 2) p.line(tx, ey + 6, tx, ey + 8, C[4], kk);
  }
  // the skeleton's arm: upper arm and forearm bones to the hand
  if (bones > 0 && flesh < 1) {
    const [hx, hy] = arm, ex = (28 + hx) / 2 + 4, ey = (-66 + hy) / 2 + 10, a = k * bones * (1 - flesh);
    p.beam(26, -64, ex, ey, 3, C[3], a);
    p.beam(ex, ey, hx, hy, 2.5, C[3], a);
    p.circle(ex, ey, 2.5, C[4], a);
    p.circle(hx, hy, 3.5, C[3], a);
    p.circle(3, -86, 9 * bones, C[3], a * 0.5);
    p.circle(1, -88, 1.8, GLOW, a);
    p.circle(9, -88, 1.8, GLOW, a);
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

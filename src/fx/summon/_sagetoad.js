// The Two Great Sage Toads' rigs (Fukasaku and Shima, 2026-11-27), small toads ray-cast like the other summons
// (src/fx/summon/_quad.js), real side / front / back views. After Narutopedia's appearance sections and the Shima
// picture: Fukasaku a green toad with white hair in a kind of mohawk, very thick eyebrows and a small goatee; Shima
// with a pale green underside, purple markings round her mouth and on her back, the top of her head like a hair net
// over hair rollers (purple); both in a high-collared cape; the round grey ear disc; heavy-lidded yellow eyes.
// They sit on Jiraiya's shoulders in Sage Mode. Coordinates: f forward, u up, r = right; seat on u = 0.
import { Canvas } from "./_quad.js";
export { Canvas };

const rgb = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const FUKASAKU = { name: "Fukasaku", k: 1.35, who: "fukasaku", skin: "#7a9a58", face: "#b8c890", hair: "#f2f0ea", cape: "#3a3a48", capeD: "#26262f", eye: "#d8b040", mark: "#5a7a40" };
export const SHIMA = { name: "Shima", k: 1.35, who: "shima", skin: "#b8c878", face: "#e4e8b4", hair: "#9a5ac8", cape: "#46384e", capeD: "#2e2434", eye: "#d8b040", mark: "#8a4ab8" };

// pose: { sing 0..1 (mouth open, throat sac out), sway (rad), lean, cough 0..1 }
export function drawSage(cv, S, pose = {}) {
  const P = { sing: 0, sway: 0, lean: 0, cough: 0, ...pose };
  const K = S.k, C = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === "string" && v[0] === "#").map(([n, v]) => [n, rgb(v)]));
  const opt = (g) => ({ clipGround: true, group: g });
  const sx = Math.sin(P.sway) * 2 * K;
  // the cape: a cone of cloth, a high collar
  cv.ellipsoid([-1 * K, 8 * K, 0], I3, [9 * K, 9 * K, 9.5 * K], (loc) => (loc[1] > 0.4 ? C.capeD : C.cape), opt(10));
  cv.ellipsoid([0, 15 * K, sx * 0.3], I3, [8 * K, 4 * K, 8.5 * K], () => C.cape, opt(11));
  // the head: a wide toad head, leaning forward when it sings
  const hc = [(2 + 2 * P.lean - P.cough) * K, (21 + P.sing) * K, sx];
  cv.ellipsoid(hc, I3, [8 * K, 6.5 * K, 9 * K], (loc) => (loc[0] > 0.45 && loc[1] < -0.1 ? C.face : C.skin), opt(12));
  // the throat sac (puffed out while singing)
  if (P.sing > 0.2) cv.ellipsoid(add(hc, [4 * K, -6 * K, 0]), I3, [4 * K * P.sing, 3.6 * K * P.sing, 5 * K * P.sing], () => C.face, opt(13));
  // the mouth: a line, purple for Shima; open (dark) while singing
  const mN = norm([1, -0.2, 0]);
  for (let s = -6; s <= 6; s += 0.5) {
    const p = add(hc, [Math.sqrt(Math.max(0, 1 - (s / 9) ** 2)) * 7.8 * K, -1.5 * K - (s / 9) ** 2 * 1.5 * K, s * K]);
    cv.decal(p, S.who === "shima" ? S.mark : "#2a2028", P.sing > 0.4 ? 2 : 1, norm(add(mN, [0, 0, s / 9])));
  }
  // eyes: yellow, heavy lids
  for (const s of [1, -1]) {
    const e = add(hc, [5 * K, 3.5 * K, s * 4.6 * K]), en = norm([0.8, 0.3, s * 0.6]);
    cv.ellipsoid(e, I3, [2.4 * K, 2.2 * K, 2.4 * K], (loc, n) => (dot(n, en) > 0.6 ? (n[1] > 0.1 ? C.skin : C.eye) : C.skin), opt(14));
    cv.decal(add(e, [2.2 * K, -0.2 * K, s * 0.3 * K]), "#2a2028", 1, en);
    // the ear disc behind the eye
    cv.ellipsoid(add(hc, [-2 * K, 1 * K, s * 8.6 * K]), I3, [2 * K, 2 * K, 0.6 * K], () => [150, 150, 158], opt(15));
  }
  if (S.who === "fukasaku") {
    // the white mohawk, the thick brows, the small goatee
    for (let i = 0; i < 5; i++) cv.ellipsoid(add(hc, [(-5 + i * 2.4) * K, (6 + Math.sin(i) * 0.6) * K, 0]), I3, [1.8 * K, 2.6 * K, 1.4 * K], () => C.hair, opt(16));
    for (const s of [1, -1]) cv.bone(add(hc, [5 * K, 5.6 * K, s * 2.4 * K]), add(hc, [5.6 * K, 6 * K, s * 7.4 * K]), 1.5 * K, () => C.hair, opt(17));
    cv.ellipsoid(add(hc, [6 * K, -6.5 * K + P.sing * -1.5 * K, 0]), I3, [1.8 * K, 2.4 * K, 1.8 * K], () => C.hair, opt(18));
  } else {
    // the hair net over the rollers: purple bumps over the top of the head
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      cv.ellipsoid(add(hc, [Math.cos(a) * 4.2 * K - 1 * K, 5.6 * K, Math.sin(a) * 4.6 * K]), I3, [2.6 * K, 2.2 * K, 2.6 * K], () => C.hair, opt(16));
    }
    cv.ellipsoid(add(hc, [-1 * K, 6.8 * K, 0]), I3, [3 * K, 2.2 * K, 3 * K], () => C.hair, opt(16));
  }
  // little arms folded at the cape's edge
  for (const s of [1, -1]) cv.ellipsoid([5 * K, 9 * K, s * 6 * K], I3, [2.2 * K, 1.8 * K, 2 * K], () => C.skin, opt(19));
  return { head: hc };
}

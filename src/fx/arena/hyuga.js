// The Hyūga on the 2.5D stage (2026-11-27): Neji and Hinata. The Byakugan's veins at the eyes, the Gentle Fist's
// chakra at the palms.
// Neji (Genin, Classic):
//   slot 1 "Eight Trigrams Sixty-Four Palms" (Hakke Rokujūyon Shō, Manga 81 / Anime 48 against Hinata... and Naruto):
//     the trigram circle under them, 2, 4, 8, 16, 32, 64 strikes closing the tenketsu: the target cannot mould chakra
//     (here: sealed, the thrower cannot throw). rush (a long combo), the circle on the floor
//   slot 2 "Eight Trigrams Palms Revolving Heaven" (Hakkeshō Kaiten, Manga 101 / Anime 56): chakra released from every
//     tenketsu while he spins: a dome that turns every attack away and throws back whoever is close. guard (full) with
//     a push round him
// Neji (Jōnin, Shippuden):
//   slot 1 "Eight Trigrams Vacuum Palm" (Hakke Kūshō, Manga 330... anime Shippuden 13): one palm thrust, the air hit
//     from a distance. line (a fast, short push)
// Hinata (Genin, Classic):
//   slot 1 "Gentle Fist: Tenketsu Strike" (Jūken, Manga 78 / Anime 46 against Neji): palm blows into the tenketsu, the
//     chakra flow cut. rush (three blows) -> sealed
// Hinata (Twin Lion Fists, Shippuden):
//   slot 1 "Gentle Step Twin Lion Fists" (Jūho Sōshiken, anime Shippuden / The Last era (anime-exclusive in Shippuden
//     filler; game)): her chakra shaped into two lion heads round her fists. rush (two big blows)
import { lane, spark, burst, shock, dome, aura, band, orb, mark, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, impact } from "./_look.js";

const NG = "classic/neji-hyuga-genin", NJ = "shippuden/neji-hyuga-jonin", HG = "classic/hinata-hyuga-genin", HS = "shippuden/hinata-hyuga-twin-lion-fists";
const CH = ["#ffffff", "#c8e0ff", "#6a8ad0"], LION = ["#e8f0ff", "#8aa8f0", "#3a5ab0"];
const base = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.3, recover: 0.4, range: 30, cone: 45, cooldown: 7, lock: 0.3, dodge: { phase: "tell", side: 7 }, sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", line_go: "whoosh", guard_go: "rumble" }, stages, look, ...extra });
export const MOVES = [
  base(NG, 1, "neji-hakke-64", [
    { mech: "rush", aim: 0.3, tell: 0.3, speed: 44, reach: 2.4, reachMax: 32, hits: 8, combo: 1.6, hit: { dmg: 3 }, finish: { dmg: 12, kb: 12, status: "seal", statusT: 6 }, impact: 0.4, hitKind: "Hakke Rokujūyon Shō" },
  ], [
    atCaster("hy_eyes", ["seal", "aim", "tell", "rush_go", "combo"], { lift: 58 }),
    floorTell("hy_lane"),
    L("hy_trigram", "grab", ["combo"], { ground: true }),
    L("hy_palms", "grab", ["combo"], { lift: 36 }),
    impact("hy_push", { lift: 30 }),
  ], { hitPop: "TENKETSU" }),
  base(NG, 2, "neji-kaiten", [
    { mech: "guard", mode: "full", radius: 4.4, dur: 2.4, pulse: 6, pulseHit: { dmg: 10, kb: 16, kbT: 0.35 }, hitKind: "Kaiten" },
  ], [
    atCaster("hy_eyes", ["guard_go"], { lift: 58 }),
    atCaster("hy_kaiten", ["guard_go"]),
    atCaster("hy_spinring", ["guard_go"], { ground: true }),
    L("hy_deflect", "block", ["guard_go"], { play: "once", lift: 30 }),
  ], { cooldown: 8, seal: 0.15, lock: 0.15 }),
  base(NJ, 1, "neji-vacuum-palm", [
    { mech: "line", aim: 0.3, tell: 0.3, from: 1.2, len: 22, speed: 90, width: 2.2, hold: 0.15, fade: 0.25, hit: { dmg: 22, kb: 16, kbT: 0.35 }, hitKind: "Hakke Kūshō" },
  ], [
    atCaster("hy_eyes", ["seal", "aim", "tell", "line_go"], { lift: 58 }),
    hand("hy_palm", ["aim", "tell"]),
    floorTell("hy_vlane"),
    L("hy_wave", "line", ["line_go"], { rotate: true, seg: 3, lift: 30 }),
    impact("hy_push", { lift: 30 }),
  ], { range: 26 }),
  base(HG, 1, "hinata-juuken", [
    { mech: "rush", aim: 0.3, tell: 0.3, speed: 40, reach: 2.2, reachMax: 32, hits: 3, combo: 0.6, hit: { dmg: 5 }, finish: { dmg: 10, kb: 8, status: "seal", statusT: 4 }, impact: 0.35, hitKind: "Jūken" },
  ], [
    atCaster("hy_eyes", ["seal", "aim", "tell", "rush_go", "combo"], { lift: 58 }),
    hand("hy_palm", ["aim", "tell", "rush_go"]),
    floorTell("hy_lane"),
    L("hy_palms", "grab", ["combo"], { lift: 36 }),
    impact("hy_push", { lift: 30 }),
  ], { hitPop: "TENKETSU" }),
  base(HS, 1, "hinata-twin-lions", [
    { mech: "buff", dur: 3, dmgMult: 1, show: 0.6, buffName: "Zwillingslöwen", hitKind: "Jūho Sōshiken" },
    { mech: "rush", aim: 0.25, tell: 0.3, speed: 46, reach: 3, reachMax: 32, hits: 2, combo: 0.45, hit: { dmg: 12 }, finish: { dmg: 18, kb: 14 }, impact: 0.4, hitKind: "Jūho Sōshiken" },
  ], [
    atCaster("hy_eyes", ["buff_go", "aim", "tell", "rush_go", "combo"], { lift: 58 }),
    atCaster("hy_lions", ["buff_go", "aim", "tell", "rush_go", "combo"], { views: true }),
    floorTell("hy_lane"),
    impact("hy_lionburst", { lift: 30 }),
  ], { shake: 1.4 }),
];

// two lion heads of blue chakra round her fists: seen from the side (both forward), the front, the back (loop)
function lions(p, u, view) {
  const c1 = H(LION[0]), c2 = H(LION[1]), c3 = H(LION[2]);
  const heads = view === "side" ? [[22, -40], [16, -30]] : [[-18, -34], [18, -34]];
  for (const [x, y] of heads) {
    blendDisc(p, x, y, 12, c3, 0.55); blendDisc(p, x, y, 9, c2, 0.7);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28 + u * 3; blendEllipse(p, x + Math.cos(a) * 11, y + Math.sin(a) * 10, 4, 3, c2, 0.6); }
    if (view !== "back") { p.rect(x + (view === "side" ? 4 : -4), y - 3, 3, 2, c1); p.rect(x + (view === "side" ? 4 : 2), y + 3, 4, 2, H("#1a2a5a")); }
  }
}
export const FX = {
  // the Byakugan: veins standing out at the temples (a tiny mark over the head, loop)
  eyes: { cw: 30, ch: 12, ox: 15, oy: 6, frames: 2, fps: 4, loop: true, draw(p, u) { for (const s of [1, -1]) { p.line(s * 5, 0, s * 11, -3, H("#c8d0f0"), 0.9); p.line(s * 6, 1, s * 11, 3, H("#c8d0f0"), 0.7 + 0.3 * u); } } },
  lane: lane({ len: px(32), w: 8, c: "#e0e8ff", dark: "#2a3a6a" }),
  vlane: lane({ len: px(22), w: Math.round(px(2.2)), c: "#e0e8ff", dark: "#2a3a6a" }),
  // the trigram circle on the floor under the target (loop)
  trigram: { ground: true, cw: 120, ch: 120, ox: 60, oy: 60, frames: 4, fps: 8, loop: true, draw(p, u) { p.ring(0, 0, 54, 2, H("#3a4a8a"), 0.8); p.ring(0, 0, 40, 1, H("#8aa0e0"), 0.7); for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28 + u * 0.3; for (let b = 0; b < 3; b++) p.line(Math.cos(a) * (42 + b * 4) - Math.sin(a) * 5, Math.sin(a) * (42 + b * 4) + Math.cos(a) * 5, Math.cos(a) * (42 + b * 4) + Math.sin(a) * 5, Math.sin(a) * (42 + b * 4) - Math.cos(a) * 5, H("#c8d4ff"), 0.85); } blendDisc(p, 0, 0, 6, H("#8aa0e0"), 0.5); } },
  palms: { cw: 70, ch: 70, ox: 35, oy: 35, frames: 6, fps: 20, loop: true, draw(p, u, i) { for (let k = 0; k < 3; k++) { const a = rnd(k + i * 7) * 6.28, r = 10 + 10 * rnd(k + i); blendDisc(p, Math.cos(a) * r, Math.sin(a) * r, 5, H(CH[1]), 0.8); blendDisc(p, Math.cos(a) * r, Math.sin(a) * r, 2, H(CH[0]), 1); } } },
  push: burst({ R: 26, c: CH, smoke: "#8a9ac8", rays: 6, frames: 8 }),
  // Revolving Heaven: the spinning dome of chakra, the scored ring on the floor, a kunai turned away
  kaiten: { cw: 110, ch: 100, ox: 55, oy: 94, frames: 6, fps: 18, loop: true, draw(p, u) { dome({ R: 40, c: CH, a: 0.35, h: 1 }).draw(p, u); for (let k = 0; k < 4; k++) { const a0 = u * 6.28 + k * 1.57; for (let t = 0; t < 1.6; t += 0.03) { const a = a0 + t, y = -40 + Math.sin(a) * 30 * (0.4 + 0.15 * k); p.blend(Math.cos(a) * 38, y, H("#ffffff"), 0.7); } } } },
  spinring: { ground: true, cw: 80, ch: 80, ox: 40, oy: 40, frames: 4, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 3; k++) p.ring(0, 0, 30 - k * 4, 1, H(k ? "#8aa0e0" : "#3a4a8a"), 0.6); for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28 + u * 6.28; p.line(Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a + 0.4) * 32, Math.sin(a + 0.4) * 32, H("#5a6a9a"), 0.7); } } },
  deflect: { cw: 50, ch: 50, ox: 25, oy: 25, frames: 5, fps: 18, draw(p, u) { for (let s = 0; s < 6; s++) { const a = (s / 6) * 6.28; p.line(Math.cos(a) * 4, Math.sin(a) * 4, Math.cos(a) * 18 * (0.3 + u), Math.sin(a) * 18 * (0.3 + u), H("#ffffff"), 1 - u); } } },
  // Vacuum Palm: the palm drawn back (loop), the pressure wave (a piece, pointing +x)
  palm: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 12, loop: true, draw(p, u) { blendDisc(p, 0, 0, 6 + 2 * u, H(CH[1]), 0.6); blendDisc(p, 0, 0, 3, H(CH[0]), 0.9); } },
  wave: { cw: 30, ch: 50, ox: 15, oy: 25, frames: 4, fps: 16, loop: true, draw(p, u) { for (let t = -1.2; t <= 1.2; t += 0.03) for (let d = 0; d < 3; d++) p.blend(Math.cos(t) * (14 - d) - 6 + u * 6, Math.sin(t) * (20 - d), H(d ? CH[1] : CH[0]), 0.6); } },
  // Twin Lion Fists: the lions round her fists (views), their burst
  lions: { views: true, cw: 80, ch: 70, ox: 40, oy: 64, frames: 4, fps: 12, loop: true, draw(p, u, i, view) { lions(p, u, view); } },
  lionburst: burst({ R: 40, c: LION, smoke: "#6a7ab0", rays: 8 }),
};
export const PREFIX = "hy_";

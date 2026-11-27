// The taijutsu fighters on the 2.5D stage (2026-11-27): Rock Lee and Might Guy. Their moves are their bodies: the
// gates' aura, the dash, the blows; the effects only mark speed, contact and the ground giving way.
// Rock Lee (Inner Gates, Chūnin Exams):
//   slot 1 "Hidden Lotus" (Ura Renge, Manga 83 / Anime 49 against Gaara): the gates opened (the skin red, the aura),
//     a kick up, blows from every side in the air, the last one drives the target down. buff (gates) -> rush (combo)
//   slot 2 "Primary Lotus" (Omote Renge, Manga 82 / Anime 48): the kick up, the bandages wrapping the target, the spin
//     down into the ground. rush (two blows, the second the drop) -> the ground breaks
// Rock Lee (Sixth Gate, Shippuden):
//   slot 1 "Morning Peacock" (Asa Kujaku, Lee's against Kisame's water clone? (anime Shippuden 37)): blows so fast they
//     catch fire, a fan of fists like a peacock's tail. rush (many blows, burning)
//   slot 2 "Leaf Strong Whirlwind" (Konoha Gōriki Senpū, Manga 45): a spinning kick from a low stance. rush -> a ring
// Might Guy (Jōnin, Classic):
//   slot 1 "Sixth Gate: Gate of Joy" (Keimon; shown by Guy in Shippuden, the file's slot kept): the sixth gate opened,
//     the green steaming aura; his blows land harder for a while. buff (+ a burst that knocks back round him)
//   slot 2 "Dynamic Entry" (Manga 247 / Anime Shippuden 3, his greeting kick): a flying kick from far off. rush (fast)
//   slot 3 "Strong Fist Hurricane" (Konoha Gōriki Senpū, the strong-fist version): spinning kicks. rush -> ring
// Might Guy (Seventh Gate, Kisame fight, Shippuden):
//   slot 1 "Hirudora (Daytime Tiger)" (Manga 504 / Anime Shippuden 197 against Kisame): one punch from the seventh gate,
//     the air compressed into a tiger that rushes forward. shot (a huge, slow air tiger that bursts)
//   slot 2 "Morning Peacock" (Asa Kujaku, Guy's): the burning fan of blows. rush (many blows)
//   slot 3 "Dynamic Action" (Dainamikku Akushon, against Kisame's sharks): blows in every direction around him. blast
//   slot 4 "Leaf Rock-Destroying Rise" (Konoha Gōriki Senpū / the rising kick against Kisame's dome): a kick up from
//     under. rush (launch)
import { aura, lane, speed, spark, burst, shock, cracks, comet, wrap, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, impact } from "./_look.js";

const LC = "classic/rock-lee-inner-gates-chunin-exams", LS = "shippuden/rock-lee-sixth-gate", GC = "classic/might-guy-jonin", GS = "shippuden/might-guy-seventh-gate-kisame-fight";
const RED = ["#fff0e0", "#ff6a40", "#c02a1a"], GRN = ["#e8fff0", "#7af0a0", "#2aa860"], FIRE = ["#fff6c0", "#ffb030", "#e0401a"];
const rush = (o) => ({ mech: "rush", aim: 0.25, tell: 0.25, speed: 56, reach: 2.4, reachMax: 32, impact: 0.35, ...o });
const std = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.25, recover: 0.4, range: 32, cone: 45, cooldown: 7, lock: 0.3, dodge: { phase: "tell", side: 7 }, sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", buff_go: "rumble", blast_go: "burst", shot_go: "whoosh" }, stages, look, ...extra });
export const MOVES = [
  std(LC, 1, "lee-ura-renge", [
    { mech: "buff", dur: 3, dmgMult: 1.2, show: 0.6, buffName: "Fünftes Tor", hitKind: "Ura Renge" },
    rush({ speed: 70, hits: 6, combo: 1.1, hit: { dmg: 5 }, finish: { dmg: 24, kb: 14, kbT: 0.35 }, hitKind: "Ura Renge" }),
  ], [
    L("tj_redgates", "caster", ["buff_go", "aim", "tell", "rush_go", "combo"]),
    floorTell("tj_lane"),
    L("tj_trail", "caster", ["rush_go"], { rotate: true, lift: 8 }),
    L("tj_blows", "grab", ["combo"], { lift: 40 }),
    impact("tj_crater"), impact("tj_dust"),
  ], { shake: 1.8 }),
  std(LC, 2, "lee-omote-renge", [
    rush({ speed: 60, hits: 2, combo: 0.6, hit: { dmg: 6 }, finish: { dmg: 24, kb: 4, status: "stun", statusT: 1 }, hitKind: "Omote Renge" }),
  ], [
    floorTell("tj_lane"),
    L("tj_wrap", "grab", ["combo"], { play: "hold" }),
    impact("tj_crater"), impact("tj_dust"),
  ], { shake: 1.6 }),
  std(LS, 1, "lee-asa-kujaku", [
    { mech: "buff", dur: 3, dmgMult: 1.15, show: 0.5, buffName: "Sechstes Tor", hitKind: "Asa Kujaku" },
    rush({ speed: 64, hits: 8, combo: 1.2, hit: { dmg: 3, status: "burn", statusT: 1.2 }, finish: { dmg: 16, kb: 12 }, hitKind: "Asa Kujaku" }),
  ], [
    L("tj_greengates", "caster", ["buff_go", "aim", "tell", "rush_go", "combo"]),
    floorTell("tj_lane"),
    L("tj_peacock", "grab", ["combo"], { lift: 34 }),
    impact("tj_fireburst", { lift: 30 }),
  ], { shake: 1.6 }),
  std(LS, 2, "lee-senpuu", [
    rush({ speed: 50, hits: 1, hit: { dmg: 10, kb: 2 }, impact: 0.05, hitKind: "Konoha Senpū" }),
    { mech: "blast", at: "self", skipAim: true, radius: 4.2, hit: { dmg: 12, kb: 12 }, after: 0.5, hitKind: "Konoha Senpū" },
  ], [
    floorTell("tj_lane"),
    L("tj_spin", "blast", ["blast_go"], { play: "once" }),
    L("tj_ring", "blast", ["blast_go"], { play: "once" }),
  ]),
  std(GC, 1, "guy-keimon", [
    { mech: "buff", dur: 8, dmgMult: 1.5, show: 1.2, pulse: 5, pulseHit: { dmg: 6, kb: 12 }, buffName: "Sechstes Tor", hitKind: "Keimon" },
  ], [
    L("tj_greengates", "caster", ["buff_go"]),
    L("tj_steam", "caster", ["buff_go"]),
    L("tj_ring", "caster", ["buff_go"], { play: "once" }),
  ], { cooldown: 12, sfx: { buff_go: "rumble" } }),
  std(GC, 2, "guy-dynamic-entry", [
    rush({ speed: 72, hits: 1, hit: { dmg: 22, kb: 16, kbT: 0.35 }, hitKind: "Dynamic Entry" }),
  ], [
    floorTell("tj_lane"),
    L("tj_kickstreak", "caster", ["rush_go"], { rotate: true, lift: 24 }),
    impact("tj_impact", { lift: 30 }),
  ]),
  std(GC, 3, "guy-goriki-senpuu", [
    rush({ speed: 56, hits: 2, combo: 0.35, hit: { dmg: 8 }, finish: { dmg: 14, kb: 6 }, impact: 0.05, hitKind: "Konoha Gōriki Senpū" }),
    { mech: "blast", at: "self", skipAim: true, radius: 4.6, hit: { dmg: 10, kb: 14 }, after: 0.5, hitKind: "Konoha Gōriki Senpū" },
  ], [
    floorTell("tj_lane"),
    L("tj_spin", "blast", ["blast_go"], { play: "once" }),
    L("tj_ring", "blast", ["blast_go"], { play: "once" }),
  ]),
  std(GS, 1, "guy-hirudora", [
    { mech: "buff", dur: 2, dmgMult: 1, show: 0.5, buffName: "Siebtes Tor", hitKind: "Hirudora" },
    { mech: "shot", aim: 0.35, tell: 0.5, from: 3, speed: 24, radius: 4, reach: 36, burst: 7, hit: { dmg: 20, kb: 8 }, burstHit: { dmg: 22, kb: 18, kbT: 0.45 }, impact: 0.8, hitKind: "Hirudora" },
  ], [
    L("tj_greengates", "caster", ["buff_go", "aim", "tell", "shot_go"]),
    L("tj_steam", "caster", ["buff_go", "aim", "tell"]),
    floorTell("tj_tlane"),
    L("tj_tiger", "proj", null, { views: true, lift: 34 }),
    impact("tj_tigerburst"),
    impact("tj_bigring"),
  ], { shake: 2.4, cooldown: 12, dodge: { phase: "tell", side: 10 } }),
  std(GS, 2, "guy-asa-kujaku", [
    rush({ speed: 60, hits: 10, combo: 1.3, hit: { dmg: 3, status: "burn", statusT: 1.2 }, finish: { dmg: 18, kb: 14 }, hitKind: "Asa Kujaku" }),
  ], [
    L("tj_greengates", "caster", ["seal", "aim", "tell", "rush_go", "combo"]),
    floorTell("tj_lane"),
    L("tj_peacock", "grab", ["combo"], { lift: 34 }),
    impact("tj_fireburst", { lift: 30 }),
  ], { shake: 1.8 }),
  std(GS, 3, "guy-dynamic-action", [
    { mech: "blast", at: "self", noAim: true, radius: 6, waves: 4, gap: 0.22, hit: { dmg: 7, kb: 2 }, after: 0.4, hitKind: "Dynamic Action" },
  ], [
    L("tj_greengates", "caster", ["blast_go"]),
    L("tj_action", "blast", ["blast_go"], { play: "loop" }),
    L("tj_ring", "blast", ["blast_go"], { play: "once" }),
  ], { dodge: { phase: "seal", back: 10 } }),
  std(GS, 4, "guy-rock-destroying-rise", [
    rush({ speed: 60, hits: 1, hit: { dmg: 26, kb: 6, status: "stun", statusT: 0.8 }, hitKind: "Konoha Daisenpū" }),
  ], [
    L("tj_greengates", "caster", ["seal", "aim", "tell", "rush_go"]),
    floorTell("tj_lane"),
    impact("tj_rise", { lift: 0 }),
    impact("tj_crater"),
  ], { shake: 1.8 }),
];

export const FX = {
  redgates: aura({ c: RED, h: 78, w: 24, a: 0.5 }),
  greengates: aura({ c: GRN, h: 80, w: 26, a: 0.5 }),
  steam: { cw: 80, ch: 110, ox: 40, oy: 100, frames: 6, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 10; k++) { const ph = (u + rnd(k)) % 1; blendDisc(p, (rnd(k + 2) - 0.5) * 40 + Math.sin(ph * 6 + k) * 4, -30 - ph * 70, 6 + 6 * ph, H("#e8fff0"), 0.4 * (1 - ph)); } } },
  lane: lane({ len: px(32), w: 8, c: "#f0f0e0", dark: "#4a4a3a" }),
  tlane: lane({ len: px(36), w: Math.round(px(4)), c: "#e8fff0", dark: "#2a5a3a" }),
  trail: { cw: 140, ch: 70, ox: 130, oy: 60, frames: 4, fps: 20, loop: true, draw(p, u) { speed({ len: 120, h: 56, c: "#f0e8e0", n: 12 }).draw(p, u); } },
  kickstreak: { cw: 140, ch: 40, ox: 130, oy: 20, frames: 4, fps: 20, loop: true, draw(p, u) { for (let k = 0; k < 7; k++) { const y = (k - 3) * 3, L0 = 60 + 50 * rnd(k + Math.floor(u * 4)); p.line(-6, y, -6 - L0, y, H(k % 2 ? "#ffffff" : "#c8e8c0"), 0.7); } } },
  blows: { cw: 70, ch: 70, ox: 35, oy: 35, frames: 6, fps: 18, loop: true, draw(p, u, i) { for (let k = 0; k < 4; k++) { const a = rnd(k + i * 5) * 6.28; p.line(Math.cos(a) * 8, Math.sin(a) * 8, Math.cos(a) * 26, Math.sin(a) * 26, H("#ffffff"), 0.9); blendDisc(p, Math.cos(a) * 8, Math.sin(a) * 8, 3, H("#ffe0c0"), 0.9); } } },
  wrap: wrap({ c: ["#f0ece4", "#c8c0b0", "#8a8070"], h: 70, w: 16, rings: 6, a: 0.9 }),
  crater: cracks({ R: 40, c: "#2a2018" }),
  dust: burst({ R: 30, c: ["#e8dcc8", "#b8a888", "#8a7a5a"], smoke: "#8a7a5a", frames: 9 }),
  impact: { cw: 90, ch: 90, ox: 45, oy: 45, frames: 6, fps: 18, draw(p, u) { const k = 1 - u; blendDisc(p, 0, 0, 16 * k, H("#ffffff"), 1); for (let s = 0; s < 10; s++) { const a = (s / 10) * 6.28; p.line(Math.cos(a) * 10 * u, Math.sin(a) * 10 * u, Math.cos(a) * 40 * (0.3 + u), Math.sin(a) * 40 * (0.3 + u), H("#fff0a0"), k); } } },
  // Morning Peacock: the fan of burning fists round the target (loop)
  peacock: { cw: 120, ch: 100, ox: 60, oy: 60, frames: 6, fps: 16, loop: true, draw(p, u, i) { for (let k = 0; k < 14; k++) { const a = -Math.PI * (0.05 + 0.9 * (k / 13)), r = 30 + 14 * rnd(k + i); blendDisc(p, Math.cos(a) * r, Math.sin(a) * r * 0.8, 6, H(FIRE[k % 3]), 0.85); blendDisc(p, Math.cos(a) * r, Math.sin(a) * r * 0.8, 3, H("#fff6c0"), 0.9); } } },
  fireburst: burst({ R: 36, c: FIRE, smoke: "#6a4a3a", rays: 8 }),
  spin: { cw: 110, ch: 90, ox: 55, oy: 80, frames: 8, fps: 18, draw(p, u) { const a = 1 - u; for (let t = 0; t < 6.28; t += 0.03) { const r = 36 + 4 * Math.sin(t * 3 + u * 10); p.blend(Math.cos(t + u * 8) * r, -26 + Math.sin(t + u * 8) * r * 0.3, H("#ffffff"), a * 0.8); } } },
  ring: { ground: true, cw: 110, ch: 110, ox: 55, oy: 55, frames: 8, fps: 16, draw(p, u) { const r = 50 * (1 - (1 - u) ** 3), a = 1 - u; for (let t = 0; t < 6.28; t += 0.02) { p.blend(Math.cos(t) * r, Math.sin(t) * r, H("#f0ece0"), a); p.blend(Math.cos(t) * (r - 1), Math.sin(t) * (r - 1), H("#5a5040"), a * 0.6); } } },
  bigring: { ground: true, cw: 170, ch: 170, ox: 85, oy: 85, frames: 10, fps: 16, draw(p, u) { const r = 80 * (1 - (1 - u) ** 3), a = 1 - u; for (let t = 0; t < 6.28; t += 0.015) for (let d = 0; d < 3; d++) p.blend(Math.cos(t) * (r - d), Math.sin(t) * (r - d), H(d ? "#e8fff0" : "#2a5a3a"), a); } },
  // Hirudora: the air tiger (side: a tiger's head of compressed air with its mane streaming back; front: the face
  // coming; back: the round mass going away)
  tiger: { views: true, cw: 120, ch: 100, ox: 60, oy: 50, frames: 4, fps: 12, loop: true, draw(p, u, i, view) {
    const c1 = H("#ffffff"), c2 = H("#d8f8e8"), c3 = H("#7ac8a0");
    if (view === "side") {
      for (let x = -50; x <= 10; x++) { const w = 10 + (x + 50) * 0.5; for (let y = -w; y <= w; y++) if (rnd(Math.floor(x / 3) * 31 + Math.floor(y / 3) + i) > 0.3) p.blend(x, y, c3, 0.35); }
      blendEllipse(p, 18, 0, 30, 26, c2, 0.75); blendEllipse(p, 22, -2, 22, 18, c1, 0.6);
      for (let k = 0; k < 2; k++) blendEllipse(p, 8 + k * 6, -24, 6, 8, c2, 0.8);
      p.rect(28, -10, 6, 3, H("#2a5a3a")); for (let x = 30; x <= 48; x += 3) p.line(x, 8, x - 1, 14, H("#2a5a3a"), 0.8);
    } else if (view === "front") {
      blendDisc(p, 0, 0, 34, c3, 0.4); blendDisc(p, 0, 0, 28, c2, 0.75); blendDisc(p, 0, -2, 20, c1, 0.6);
      for (const s of [1, -1]) { blendEllipse(p, s * 20, -28, 7, 9, c2, 0.8); p.rect(s * 10 - 3, -8, 6, 3, H("#2a5a3a")); }
      blendEllipse(p, 0, 12, 12, 6 + 2 * Math.sin(u * 6.28), H("#2a5a3a"), 0.8);
    } else { blendDisc(p, 0, 0, 30, c3, 0.45); blendDisc(p, 0, 0, 24, c2, 0.7); for (const s of [1, -1]) blendEllipse(p, s * 18, -26, 7, 9, c2, 0.8); }
  } },
  tigerburst: burst({ R: 64, c: ["#ffffff", "#d8f8e8", "#7ac8a0"], smoke: "#a8c8b0", rays: 14, frames: 12 }),
  action: { cw: 120, ch: 100, ox: 60, oy: 80, frames: 6, fps: 18, loop: true, draw(p, u, i) { for (let k = 0; k < 8; k++) { const a = rnd(k + i * 9) * 6.28, r = 30 + 14 * rnd(k); p.line(0, -30, Math.cos(a) * r, -30 + Math.sin(a) * r * 0.6, H("#ffffff"), 0.8); blendDisc(p, Math.cos(a) * r, -30 + Math.sin(a) * r * 0.6, 4, H("#e8fff0"), 0.9); } } },
  rise: { cw: 70, ch: 140, ox: 35, oy: 130, frames: 8, fps: 16, draw(p, u) { const a = 1 - u; for (let k = 0; k < 9; k++) { const x = (rnd(k) - 0.5) * 30, h = 60 + 60 * rnd(k + 3); p.line(x, -10, x * 0.6, -10 - h * Math.min(1, u * 2), H(k % 2 ? "#ffffff" : "#c8e8c0"), a); } } },
};
export const PREFIX = "tj_";

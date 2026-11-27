// Naruto Uzumaki on the 2.5D stage (2026-11-27). (Classic slot 3 Gamabunta is a summon: src/fx/summon/gamabunta.js.)
// Classic (Final Valley):
//   slot 1 "One-Tailed Vermilion Rasengan" (Rasengan in the one-tailed cloak against Sasuke, Manga 230 / Anime 133):
//     the red chakra cloak round him, the Rasengan tinted by it; a charge and a hard push. rush
//   slot 2 "Uzumaki Barrage" (Uzumaki Naruto Rendan, Manga 85 / Anime 50 against Neji... used again at the Valley):
//     shadow clones kick the target, one after another. clones (copies of his own game sprite)
// Shippuden (Sage Mode):
//   slot 1 "Wind Style: Rasenshuriken" (Fūton: Rasenshuriken, thrown in Sage Mode against Pain, Manga 431): a
//     Rasengan with a ring of wind blades, thrown; on contact it swells into a sphere of countless wind blades. shot
//   slot 2 "Massive Rasengan Barrage" (Rasengan Rendan of Sage clones, Manga 432): shadow clones each carrying a big
//     Rasengan run at the target. clones
//   slot 3 "Frog Kumite" (Kawazu Kumite, Manga 430): with natural energy his blows reach farther than his fists.
//     rush, a combo with a longer reach
//   slot 4 "Sage Art: Two Great Ball Rasengan" (Senpō: Chōōdama Rasengan, two at once with a clone, Manga 432): two huge
//     Rasengan driven into the target together. rush -> a big burst
import { orb, burst, shock, lane, speed, spark, aura, crescent, poof, px, rnd, blendDisc, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const FV = "classic/naruto-uzumaki-final-valley", SM = "shippuden/naruto-uzumaki-sage-mode";
export const MOVES = [
  { id: "naruto-vermilion-rasengan", kind: "arena", variant: FV, slot: 1,
    seal: 0.55, recover: 0.4, range: 32, cone: 45, cooldown: 7, lock: 0.55, shake: 1.6,
    stages: [{ mech: "rush", aim: 0.3, tell: 0.3, speed: 52, reach: 2.4, reachMax: 32, hits: 1, hit: { dmg: 30, kb: 14, kbT: 0.35 }, impact: 0.45, hitKind: "Rasengan" }],
    dodge: { phase: "tell", side: 6 },
    sfx: { seal: "cast", rush_go: "whoosh", impact: "burst" },
    look: [
      atCaster("na_cloak", ["seal", "aim", "tell", "rush_go", "impact"]),
      hand("na_redball", ["seal", "aim", "tell", "rush_go"], { lift: 28 }),
      floorTell("na_lane"),
      L("na_trail", "caster", ["rush_go"], { rotate: true, lift: 8 }),
      impact("na_redburst", { lift: 30 }),
      impact("na_ring"),
    ] },
  { id: "naruto-uzumaki-rendan", kind: "arena", variant: FV, slot: 2,
    seal: 0.45, recover: 0.4, range: 30, cone: 50, cooldown: 8, lock: 0.45,
    stages: [{ mech: "clones", aim: 0.25, tell: 0.25, count: 4, fan: 110, gap: 0.12, speed: 32, reach: 2.4, range: 30, hit: { dmg: 8, kb: 3 }, hitKind: "Uzumaki Naruto Rendan" }],
    dodge: { phase: "tell", back: 16 },
    sfx: { seal: "cast", clones_go: "poof" },
    look: [
      L("na_poof", "caster", ["clones_go"], { play: "once" }),
      L("na_kick", "clone", ["clones_go"], { lift: 20 }),
      impact("na_hit", { lift: 30 }),
    ] },
  { id: "naruto-rasenshuriken", kind: "arena", variant: SM, slot: 1,
    seal: 0.7, recover: 0.4, range: 40, cone: 45, cooldown: 9, lock: 0.7, shake: 2,
    stages: [{ mech: "shot", aim: 0.35, tell: 0.35, from: 2.2, speed: 28, radius: 2.6, reach: 38, burst: 6, hit: { dmg: 20, kb: 4 }, burstHit: { dmg: 22, kb: 10, status: "slow", statusT: 2 }, impact: 0.9, hitKind: "Rasenshuriken" }],
    dodge: { phase: "tell", side: 8 },
    sfx: { seal: "cast", shot_go: "whoosh", impact: "burst" },
    look: [
      atCaster("na_sage", ["seal", "aim", "tell", "shot_go"]),
      hand("na_rsk", ["seal", "aim", "tell"], { lift: 44, handF: 0.8 }),
      floorTell("na_slane"),
      proj("na_rsk", { rotate: false, lift: 36 }),
      impact("na_sphere", { lift: 0 }),
    ] },
  { id: "naruto-rasengan-rendan", kind: "arena", variant: SM, slot: 2,
    seal: 0.5, recover: 0.4, range: 32, cone: 50, cooldown: 9, lock: 0.5, shake: 1.4,
    stages: [{ mech: "clones", aim: 0.3, tell: 0.3, count: 3, fan: 90, gap: 0.15, speed: 30, reach: 2.6, range: 30, hit: { dmg: 14, kb: 8 }, hitKind: "Rasengan Rendan" }],
    dodge: { phase: "tell", back: 16 },
    sfx: { seal: "cast", clones_go: "poof" },
    look: [
      atCaster("na_sage", ["seal", "aim", "tell", "clones_go"]),
      L("na_poof", "caster", ["clones_go"], { play: "once" }),
      L("na_bigball", "clone", ["clones_go"], { lift: 30 }),
      impact("na_blueburst", { lift: 30 }),
    ] },
  { id: "naruto-kawazu-kumite", kind: "arena", variant: SM, slot: 3,
    seal: 0.3, recover: 0.35, range: 30, cone: 45, cooldown: 6, lock: 0.3,
    stages: [{ mech: "rush", aim: 0.25, tell: 0.25, speed: 40, reach: 4.2, stand: 3.2, reachMax: 32, hits: 3, combo: 0.6, hit: { dmg: 8 }, finish: { dmg: 14, kb: 12 }, impact: 0.3, hitKind: "Kawazu Kumite" }],
    dodge: { phase: "tell", side: 6 },
    sfx: { rush_go: "whoosh", combo: "bite" },
    look: [
      atCaster("na_sage", ["seal", "aim", "tell", "rush_go", "combo"]),
      floorTell("na_klane"),
      L("na_reach", "grab", ["combo"], { lift: 32 }),
      impact("na_hit", { lift: 30 }),
    ] },
  { id: "naruto-two-great-rasengan", kind: "arena", variant: SM, slot: 4,
    seal: 0.75, recover: 0.5, range: 32, cone: 45, cooldown: 10, lock: 0.75, shake: 2.2,
    stages: [
      { mech: "rush", aim: 0.3, tell: 0.35, speed: 40, reach: 3, reachMax: 32, hits: 1, hit: { dmg: 10, kb: 0 }, impact: 0.05, hitKind: "Chōōdama Rasengan" },
      { mech: "blast", at: "self", skipAim: true, radius: 6, delay: 0.1, hit: { dmg: 28, kb: 16, kbT: 0.4 }, after: 0.6, hitKind: "Chōōdama Rasengan" },
    ],
    dodge: { phase: "tell", side: 8 },
    sfx: { seal: "cast", rush_go: "whoosh", blast_go: "burst" },
    look: [
      atCaster("na_sage", ["seal", "aim", "tell", "rush_go", "blast_go"]),
      hand("na_hugeball", ["seal", "aim", "tell", "rush_go"], { lift: 36, handF: 2.4 }),
      floorTell("na_lane"),
      L("na_hugeburst", "blast", ["blast_go"], { play: "once", lift: 0 }),
      L("na_ring", "blast", ["blast_go"], { play: "once" }),
    ] },
];

const B = ["#ffffff", "#a8e0ff", "#3a8ae0"], R = ["#fff0e0", "#ff8a50", "#c0201a"];
export const FX = {
  // Final Valley: the one-tailed cloak (red bubbling chakra, one tail), the red Rasengan, its burst
  cloak: aura({ c: ["#ffd0b0", "#e85a30", "#a8201a"], h: 76, w: 26, a: 0.5 }),
  redball: orb({ r: 12, c: R }),
  lane: lane({ len: px(28), w: 8, c: "#ffd8c0", dark: "#6a2010" }),
  trail: { cw: 120, ch: 70, ox: 112, oy: 62, frames: 4, fps: 16, loop: true, draw(p, u) { speed({ len: 100, h: 56, c: "#ffd0b8", n: 10 }).draw(p, u); } },
  redburst: burst({ R: 34, c: R, smoke: "#6a3a3a", rays: 8 }),
  ring: shock({ R: 60, c: "#e8f0ff", edge: "#4a5a7a" }),
  // the clones: a puff, a kick streak at each clone, the hit
  poof: poof({ R: 28 }),
  kick: { cw: 50, ch: 40, ox: 25, oy: 30, frames: 4, fps: 16, loop: true, draw(p, u) { for (let k = 0; k < 5; k++) { const y = -20 + k * 4; p.line(-20 + 8 * u, y, 10 + 8 * u, y - 6, H("#ffffff"), 0.5); } } },
  hit: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 5, fps: 20, draw(p, u) { const k = 1 - u; blendDisc(p, 0, 0, 10 * k, H("#ffffff"), 1); for (let s = 0; s < 8; s++) { const a = (s / 8) * 6.28; p.line(Math.cos(a) * 8 * u, Math.sin(a) * 8 * u, Math.cos(a) * 24 * (0.3 + u), Math.sin(a) * 24 * (0.3 + u), H("#ffe080"), k); } } },
  // Sage Mode: the orange pigment's glow round him (natural energy), the Rasenshuriken (a ball with a ring of four
  // wind blades, spinning), its line, the sphere of wind blades it swells into
  sage: aura({ c: ["#fff0c0", "#f0a040", "#c06020"], h: 70, w: 22, a: 0.3, frames: 6 }),
  rsk: { cw: 110, ch: 70, ox: 55, oy: 35, frames: 6, fps: 18, loop: true, draw(p, u, i) {
    for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + u * 6.28; for (let t = 0; t < 1; t += 0.02) { const r = 14 + 34 * t, w = 6 * (1 - t); for (let d = -w; d <= w; d++) p.blend(Math.cos(a + t * 0.6) * r + Math.cos(a + 1.57) * d * 0.4, (Math.sin(a + t * 0.6) * r + Math.sin(a + 1.57) * d * 0.4) * 0.45, H(t > 0.7 ? "#ffffff" : "#c8e8ff"), 0.8); } }
    orb({ r: 12, c: B }).draw(p, u);
  } },
  slane: lane({ len: px(38), w: 12, c: "#e0f0ff", dark: "#30405a" }),
  sphere: { cw: 200, ch: 180, ox: 100, oy: 150, frames: 12, fps: 14, draw(p, u) {
    const k = Math.min(1, u * 2.5), a = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1, R0 = 60 * k;
    blendDisc(p, 0, -60, R0, H("#d8ecff"), 0.4 * a);
    for (let s = 0; s < 40; s++) { const ang = rnd(s) * 6.28 + u * 3, rr = R0 * (0.3 + 0.7 * rnd(s + 2)); const x = Math.cos(ang) * rr, y = -60 + Math.sin(ang) * rr * 0.9; p.line(x, y, x + Math.cos(ang + 1.4) * 10, y + Math.sin(ang + 1.4) * 10, H("#ffffff"), a); }
    blendDisc(p, 0, -60, R0 * 0.3, H("#ffffff"), 0.6 * a);
  } },
  bigball: orb({ r: 16, c: B }),
  blueburst: burst({ R: 36, c: B, smoke: "#5a6a8a", rays: 6 }),
  klane: lane({ len: px(24), w: 8, c: "#fff0c0", dark: "#6a4010" }),
  // Frog Kumite: the natural energy reaching past the fist (a blow landing on the target from a step away)
  reach: { cw: 70, ch: 50, ox: 35, oy: 25, frames: 4, fps: 14, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; blendDisc(p, -20 + 30 * ph, (k - 3) * 3, 3, H("#f0c060"), 1 - ph); } } },
  hugeball: orb({ r: 22, c: B, streaks: 9 }),
  hugeburst: burst({ R: 60, c: B, smoke: "#5a6a8a", rays: 12, frames: 12 }),
};
export const PREFIX = "na_";

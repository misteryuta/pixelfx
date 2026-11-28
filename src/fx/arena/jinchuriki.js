// The Jinchūriki on the 2.5D stage (2026-11-27): Killer B, Fū, Yugito, Rōshi, Han, Utakata. Their tailed beasts show
// as chakra, colour and parts (wings, tails, horns), not as full beasts.
// Killer B (Eight-Tails): 1 "Tailed Beast Ball" (Bijūdama, Manga 491): the black-and-white ball gathered at the mouth
//   and fired: shot (big, bursts); 2 "Lariat" (Raiton... with A, Manga 491: the arm swung into the target): rush;
//   3 "Acrobat (Seven Swords Dance)" (Manga 414): seven swords held everywhere, a whirl of cuts: rush (combo);
//   4 "Ink Clone Sealing" (the octopus ink, Manga 416): ink sprayed over the target, it cannot move or mould: bind (ink)
// Fū (Seven-Tails): 1 "Secret Technique: Scale Powder" (Hijutsu: Rinpungakure, anime / game): glittering scales that
//   blind: zone (round her); 2 "Bug Bite" (Chōmei's mandibles): rush; 3 "Full Chōmei Transformation": the wings out,
//   a gust from them: buff -> blast (round her)
// Yugito (Two-Tails): 1 "Mouse Hairball (Blue Fire)" (Nekomata's blue fire balls, Manga 309 / anime): shot (homing
//   blue fire); 2 "Full Matatabi Transformation": the blue flame cat: buff -> blast (blue fire wave)
// Rōshi (Four-Tails): 1 "Lava Release Chakra Mode" (Yōton, Manga 545 / anime): lava chakra round him: buff (burning
//   round him); 2 "Scorching Stream Rock" (Yōton: Shakugaryūgan, Manga 545): rocks of lava spat in arcs: shot (lobbed)
// Han (Five-Tails): 1 "Boil Release: Unrivaled Strength" (Futton: Kōryoku Musō, anime): steam pressure in his body:
//   buff (damage); 2 "Erupting Propulsion Fist" (the steam vents driving a punch, anime): rush (very hard)
// Utakata (Six-Tails): 1 "Soap Bubble Explosion" (Hōmatsu no Jutsu: exploding bubbles, anime Shippuden 143): shot
//   (slow bubbles that burst); 2 "Corrosive Alkali Mist" (Saiken's alkali, anime): zone (corrodes)
import { lane, spark, burst, shock, comet, orb, fireball, band, pool, wrap, aura, mark, ring, dome, crescent, crackle, mist, poof, spikes, coneMark, cracks, slash, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const V = { b: "shippuden/killer-b-eight-tails-full-gyuki", fu: "shippuden/fu-seven-tails-chomei", yu: "shippuden/yugito-nii-two-tails-matatabi", ro: "shippuden/roshi-four-tails-son-goku", han: "shippuden/han-five-tails-kokuo", uta: "shippuden/utakata-six-tails-saiken" };
const BLUE = ["#e8f8ff", "#5ab0ff", "#1a40c0"], LAVA = ["#fff0a0", "#ff8a30", "#a02010"], STEAM = ["#ffffff", "#e8e8e8", "#b8b8c0"], INK = ["#3a3a4a", "#14141c", "#000000"], GREEN = ["#f0fff0", "#9af0a0", "#3ab060"];
const mv = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.4, recover: 0.4, range: 34, cone: 50, cooldown: 8, lock: 0.4, dodge: { phase: "tell", side: 7 },
  sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", line_go: "whoosh", shot_go: "whoosh", blast_go: "burst", bind_go: "whoosh", hold: "bite", guard_go: "rumble", buff_go: "rumble", zone_go: "rumble", state_go: "cast", blink_go: "whoosh", heal_go: "cast" }, stages, look, ...extra });
const rush = (o) => ({ mech: "rush", aim: 0.3, tell: 0.3, speed: 56, reach: 2.6, reachMax: 32, impact: 0.4, ...o });
export const MOVES = [
  mv(V.b, 1, "b-bijuudama", [{ mech: "shot", aim: 0.5, tell: 0.5, from: 2.5, speed: 30, radius: 3.4, reach: 36, burst: 7.5, hit: { dmg: 16, kb: 6 }, burstHit: { dmg: 26, kb: 18, kbT: 0.45 }, impact: 0.9, hitKind: "Bijūdama" }],
    [ atCaster("jc_gyuki", ["seal", "aim", "tell", "shot_go"]), hand("jc_ballcharge", ["seal", "aim", "tell"], { lift: 50, handF: 1.2 }), floorTell("jc_blane"), proj("jc_ball", { rotate: false, lift: 40 }), impact("jc_bigboom"), impact("jc_crater") ],
    { seal: 0.9, lock: 0.9, cooldown: 14, shake: 2.6, dodge: { phase: "tell", side: 12 } }),
  mv(V.b, 2, "b-lariat", [rush({ speed: 66, hits: 1, hit: { dmg: 28, kb: 16, kbT: 0.4 }, hitKind: "Lariat" })],
    [ atCaster("jc_raiton", ["seal", "aim", "tell", "rush_go"]), floorTell("jc_lane"), impact("cm_zap", { lift: 30 }) ], { shake: 1.8 }),
  mv(V.b, 3, "b-acrobat", [rush({ speed: 50, hits: 7, combo: 1.2, hit: { dmg: 4 }, finish: { dmg: 12, kb: 12 }, hitKind: "Acrobat" })],
    [ floorTell("jc_lane"), L("jc_swords", "grab", ["combo"], { lift: 34 }), impact("jc_slash", { lift: 34 }) ]),
  mv(V.b, 4, "b-ink-sealing", [{ mech: "bind", aim: 0.3, tell: 0.3, speed: 40, follow: false, radius: 2.6, reachMax: 30, hold: 2.2, crush: { dmg: 8, status: "seal", statusT: 6 }, back: 50, hitKind: "Sumi" }],
    [ hand("jc_inkmouth", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), floorTell("jc_ilane"), L("jc_inkjet", "link", ["bind_go"], { rotate: true, seg: 2.4, lift: 40 }), L("jc_inked", "grab", ["hold"]), L("jc_inkfloor", "grab", ["hold"], { ground: true }) ], { hitPop: "VERSIEGELT" }),
  mv(V.fu, 1, "fu-rinpungakure", [{ mech: "zone", at: "self", noAim: true, radius: 9, dur: 4, dot: 0, status: "blind", hitKind: "Rinpungakure" }],
    [ atCaster("jc_wings", ["zone_go"]), L("jc_scales", "zone", ["zone_go"]), L("jc_scalefloor", "zone", ["zone_go"], { ground: true }) ], { seal: 0.5, lock: 0.5, cooldown: 11, dodge: { phase: "seal", back: 12 } }),
  mv(V.fu, 2, "fu-bug-bite", [rush({ speed: 58, hits: 2, combo: 0.4, hit: { dmg: 8 }, finish: { dmg: 14, kb: 10 }, hitKind: "Chōmeis Biss" })],
    [ atCaster("jc_wings", ["seal", "aim", "tell", "rush_go", "combo"]), floorTell("jc_lane"), impact("jc_bite", { lift: 30 }) ]),
  mv(V.fu, 3, "fu-chomei", [
    { mech: "buff", dur: 6, dmgMult: 1.35, show: 0.9, buffName: "Chōmei", hitKind: "Chōmei" },
    { mech: "blast", at: "self", skipAim: true, radius: 8, hit: { dmg: 16, kb: 14 }, after: 0.6, hitKind: "Flügelsturm" },
  ], [ atCaster("jc_bigwings", ["buff_go", "blast_go"]), atCaster("jc_greenaura", ["buff_go", "blast_go"]), L("jc_gust", "blast", ["blast_go"], { play: "once" }) ], { seal: 0.6, lock: 0.6, cooldown: 14, dodge: { phase: "seal", back: 10 } }),
  mv(V.yu, 1, "yugito-hairball", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 2, count: 3, spread: 30, gap: 0.12, speed: 34, homing: 1.4, radius: 2, reach: 36, burst: 2.6, hit: { dmg: 8, status: "burn", statusT: 2 }, impact: 0.4, hitKind: "Neko Dama" }],
    [ atCaster("jc_bluecat", ["seal", "aim", "tell", "shot_go"]), proj("jc_bluefire", { rotate: false, lift: 34 }), impact("jc_blueburst") ], { dodge: { phase: "tell", back: 20 } }),
  mv(V.yu, 2, "yugito-matatabi", [
    { mech: "buff", dur: 6, dmgMult: 1.3, show: 0.9, buffName: "Matatabi", hitKind: "Matatabi" },
    { mech: "line", aim: 0.3, tell: 0.35, from: 2, len: 30, speed: 34, width: 4, hold: 0.4, fade: 0.4, dot: 24, hit: { status: "burn", statusT: 3, kb: 6 }, hitKind: "Blaues Feuer" },
  ], [ atCaster("jc_bluecat", ["buff_go", "aim", "tell", "line_go"]), floorTell("jc_bflane"), L("jc_bluewave", "line", ["line_go"], { rotate: true, seg: 3, lift: 20 }) ], { seal: 0.6, lock: 0.6, cooldown: 14, dodge: { phase: "tell", side: 9 } }),
  mv(V.ro, 1, "roshi-lava-mode", [{ mech: "buff", dur: 7, dmgMult: 1.3, show: 1, pulse: 5, pulseHit: { dmg: 8, status: "burn", statusT: 3, kb: 8 }, buffName: "Yōton-Chakra", hitKind: "Yōton-Chakramodus" }],
    [ atCaster("jc_lavaaura", ["buff_go"]), L("jc_lavaring", "caster", ["buff_go"], { ground: true, play: "once" }) ], { seal: 0.6, lock: 0.6, cooldown: 14 }),
  mv(V.ro, 2, "roshi-shakugaryuugan", [{ mech: "shot", aim: 0.35, tell: 0.4, from: 2, count: 6, spread: 40, gap: 0.07, speed: 24, arcH: 5, radius: 2, reach: 30, burst: 2.6, hit: { dmg: 7, status: "burn", statusT: 2 }, impact: 0.5, hitKind: "Yōton: Shakugaryūgan" }],
    [ hand("jc_lavamouth", ["seal", "aim", "tell", "shot_go"], { lift: 50, handF: 0.9 }), L("jc_rfan", "caster", ["tell"], { ground: true, rotate: true }), proj("jc_lavarock", { rotate: false, lift: 40 }), impact("jc_lavasplash") ], { dodge: { phase: "tell", side: 16 } }),
  mv(V.han, 1, "han-kouryoku-musou", [{ mech: "buff", dur: 7, dmgMult: 1.5, show: 1, buffName: "Kōryoku Musō", hitKind: "Futton: Kōryoku Musō" }],
    [ atCaster("jc_steamaura", ["buff_go"]), atCaster("jc_vents", ["buff_go"]) ], { seal: 0.5, lock: 0.5, cooldown: 14 }),
  mv(V.han, 2, "han-propulsion-fist", [rush({ speed: 72, hits: 1, hit: { dmg: 30, kb: 18, kbT: 0.45 }, hitKind: "Dampfschlag" })],
    [ atCaster("jc_vents", ["seal", "aim", "tell", "rush_go"]), floorTell("jc_lane"), L("jc_steamtrail", "caster", ["rush_go"], { rotate: true, lift: 20 }), impact("jc_steamburst") ], { shake: 2 }),
  mv(V.uta, 1, "utakata-bubbles", [{ mech: "shot", aim: 0.35, tell: 0.35, from: 1.6, count: 7, spread: 50, gap: 0.06, speed: 16, radius: 2.2, reach: 30, burst: 3, hit: { dmg: 4 }, burstHit: { dmg: 8, kb: 6 }, impact: 0.5, hitKind: "Hōmatsu" }],
    [ hand("jc_pipe", ["seal", "aim", "tell", "shot_go"], { lift: 52, handF: 1 }), proj("jc_bubble", { rotate: false, lift: 34 }), impact("jc_pop", { lift: 30 }) ], { dodge: { phase: "tell", back: 18 } }),
  mv(V.uta, 2, "utakata-alkali-mist", [{ mech: "zone", aim: 0.4, tell: 0.45, radius: 7, dur: 4, dot: 8, status: "slow", hitKind: "Laugen-Nebel" }],
    [ hand("jc_pipe", ["seal", "aim", "tell"], { lift: 52, handF: 1 }), aimRing("jc_aring", ["tell"]), L("jc_alkali", "zone", ["zone_go"]), L("jc_alkfloor", "zone", ["zone_go"], { ground: true }) ], { cooldown: 11, dodge: { phase: "tell", back: 12 } }),
];

export const FX = {
  // Killer B: Gyūki's chakra (dark with ink-purple edges) round him, the ball gathering, the line, the ball, the boom
  gyuki: aura({ c: ["#d8c8e8", "#6a4a7a", "#2a1a2a"], h: 90, w: 30, a: 0.45 }),
  ballcharge: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 6, fps: 14, loop: true, draw(p, u) { for (let k = 0; k < 10; k++) { const a = rnd(k) * 6.28, d = 26 * (1 - ((u + rnd(k + 1)) % 1)); blendDisc(p, Math.cos(a) * d, Math.sin(a) * d, 2.5, H(k % 2 ? "#ffffff" : "#1a1a2a"), 0.9); } orb({ r: 8, c: ["#ffffff", "#5a5a7a", "#0a0a14"], streaks: 3, glow: false }).draw(p, u); } },
  blane: lane({ len: px(36), w: 14, c: "#c8b8d8", dark: "#1a1028" }),
  ball: orb({ r: 20, c: ["#ffffff", "#4a4a6a", "#0a0a14"], streaks: 6 }),
  bigboom: burst({ R: Math.round(px(7.5)), c: ["#ffffff", "#c8b8e8", "#2a1a3a"], smoke: "#3a2a4a", rays: 14, frames: 12 }),
  crater: cracks({ R: Math.round(px(7.5)), c: "#1c1418", n: 22 }),
  raiton: crackle({ R: 30, bolts: 6, core: 0 }),
  lane: lane({ len: px(32), w: 8, c: "#f0f0e8", dark: "#4a4a3a" }),
  zap: crackle({ R: 30, bolts: 9, core: 8 }),
  swords: { cw: 90, ch: 90, ox: 45, oy: 45, frames: 6, fps: 18, loop: true, draw(p, u, i) { for (let k = 0; k < 7; k++) { const a = (k / 7) * 6.28 + u * 6.28; p.line(Math.cos(a) * 10, Math.sin(a) * 10, Math.cos(a) * 36, Math.sin(a) * 36, H(k % 2 ? "#e8ecf4" : "#9aa2b0")); } } },
  slash: slash({ R: 30, c: ["#ffffff", "#c8d0e0"] }),
  inkmouth: { cw: 24, ch: 20, ox: 12, oy: 10, frames: 4, fps: 12, loop: true, draw(p, u) { blendDisc(p, 0, 0, 4 + 2 * u, H("#14141c"), 0.9); } },
  ilane: lane({ len: px(30), w: 8, c: "#5a5a6a", dark: "#0a0a10" }),
  inkjet: band({ len: 20, w: 7, c: INK, a: 0.9 }),
  inked: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 4, fps: 8, loop: true, draw(p, u, i) { for (let k = 0; k < 30; k++) blendDisc(p, (rnd(k + i) - 0.5) * 30, -80 * rnd(k + i + 3), 3 + 2 * rnd(k), H(INK[k % 3]), 0.85); } },
  inkfloor: pool({ R: 24, c: ["#14141c", "#000000"], bubbles: "#3a3a4a", a: 0.7 }),
  // Fū: her wings (loop), the glittering scales (loop), their floor; the bite; the big wings, the green aura, the gust
  wings: { cw: 90, ch: 90, ox: 45, oy: 84, frames: 4, fps: 16, loop: true, draw(p, u) { for (const s of [1, -1]) { const f = Math.sin(u * 6.28) * 6; blendEllipse(p, s * 20, -56 - f, 16, 8, H("#c8f0ff"), 0.55); blendEllipse(p, s * 16, -44 + f * 0.5, 12, 6, H("#a8e0f0"), 0.5); } } },
  scales: { cw: Math.ceil(px(9) * 2.2), ch: 110, ox: Math.ceil(px(9) * 1.1), oy: 100, frames: 6, fps: 10, loop: true, draw(p, u, i) { const R = px(9); for (let k = 0; k < 120; k++) { const ph = (u + rnd(k)) % 1; p.dot((rnd(k + 1) - 0.5) * R * 2, -100 + ph * 100 + (rnd(k + 2) - 0.5) * 10, H(k % 3 ? "#fff0a0" : "#c8f0ff")); } } },
  scalefloor: pool({ R: Math.round(px(9)), c: ["#e8e0a0", "#a89a50"], bubbles: "#fff0a0", a: 0.25 }),
  bite: { cw: 50, ch: 50, ox: 25, oy: 25, frames: 5, fps: 18, draw(p, u) { for (const s of [1, -1]) for (let t = 0; t < 1; t += 0.05) p.blend(s * 16 * (1 - u) * Math.cos(t * 1.5), -14 + t * 28, H("#3a3a2a"), 1 - u); } },
  bigwings: { cw: 180, ch: 130, ox: 90, oy: 120, frames: 4, fps: 14, loop: true, draw(p, u) { for (const s of [1, -1]) { const f = Math.sin(u * 6.28) * 10; for (let k = 0; k < 3; k++) blendEllipse(p, s * (36 + k * 14), -80 - f + k * 14, 34 - k * 6, 12, H(k ? "#a8e0f0" : "#e8fbff"), 0.55); } } },
  greenaura: aura({ c: GREEN, h: 84, w: 26, a: 0.4 }),
  gust: shock({ R: Math.round(px(8)), c: "#e8fff0", edge: "#3ab060", w: 5 }),
  // Yugito: the blue flame cat round her (loop), the blue fireballs, their bursts; the blue fire wave
  bluecat: { cw: 100, ch: 110, ox: 50, oy: 100, frames: 6, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 20; k++) { const ph = (u + rnd(k)) % 1; blendEllipse(p, (rnd(k + 1) - 0.5) * 60 * (1 - ph * 0.4), -ph * 90, 5, 8, H(BLUE[k % 3]), 0.6 * (1 - ph)); } for (const s of [1, -1]) p.poly([[s * 10, -86], [s * 22, -86], [s * 18, -104]], H(BLUE[1]), 0.7); } },
  bluefire: fireball({ r: 10, c: ["#ffffff", "#8ad8ff", "#2a70e0", "#102a80"] }),
  blueburst: burst({ R: 22, c: BLUE, smoke: "#2a3a6a", frames: 8 }),
  bflane: lane({ len: px(30), w: Math.round(px(4)), c: BLUE[1], dark: BLUE[2] }),
  bluewave: band({ len: 26, w: 16, c: BLUE, a: 0.8 }),
  // Rōshi: the lava chakra round him (loop), the burning ring, lava at the mouth, the fan, a lava rock, its splash
  lavaaura: aura({ c: LAVA, h: 84, w: 28, a: 0.5 }),
  lavaring: shock({ R: Math.round(px(5)), c: "#ffb060", edge: "#a02010", w: 5 }),
  lavamouth: fireball({ r: 6, c: ["#fff0a0", "#ff8a30", "#c03010", "#6a1008"] }),
  rfan: { ground: true, cw: Math.ceil(px(30)) + 8, ch: Math.ceil(px(30) * 0.8) + 10, ox: 2, oy: Math.ceil(px(30) * 0.4) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = -3; k <= 3; k++) { const a = k * 0.116; for (let x = 6; x <= px(30); x += 3) if (((x / 12 - u) % 1 + 1) % 1 < 0.35) p.blend(Math.cos(a) * x, Math.sin(a) * x, H("#ff8a30"), 0.75); } } },
  lavarock: { cw: 24, ch: 24, ox: 12, oy: 12, frames: 4, fps: 12, loop: true, draw(p, u) { blendDisc(p, 0, 0, 7, H("#3a1a10"), 1); blendDisc(p, -1, -1, 5, H(LAVA[1]), 0.9); blendDisc(p, -2, -2, 2, H(LAVA[0]), 1); } },
  lavasplash: burst({ R: 20, c: LAVA, smoke: "#4a2a20", frames: 8 }),
  // Han: steam round him, the vents, the steam trail of the punch, its burst
  steamaura: aura({ c: STEAM, h: 90, w: 30, a: 0.4 }),
  vents: { cw: 80, ch: 90, ox: 40, oy: 84, frames: 6, fps: 14, loop: true, draw(p, u) { for (const s of [1, -1]) for (let k = 0; k < 4; k++) { const ph = (u + k / 4) % 1; blendDisc(p, s * (16 + ph * 20), -56 - ph * 14, 3 + 5 * ph, H(STEAM[1]), 0.6 * (1 - ph)); } } },
  steamtrail: { cw: 120, ch: 60, ox: 110, oy: 40, frames: 4, fps: 16, loop: true, draw(p, u) { for (let k = 0; k < 10; k++) { const ph = (u + rnd(k)) % 1; blendDisc(p, -ph * 100, (rnd(k + 2) - 0.5) * 30, 4 + 8 * ph, H(STEAM[1]), 0.5 * (1 - ph)); } } },
  steamburst: burst({ R: 40, c: STEAM, smoke: "#c8c8d0", rays: 8, frames: 10 }),
  // Utakata: the pipe's bubbles (loop), a bubble, its pop; the alkali mist and its floor
  pipe: { cw: 30, ch: 30, ox: 15, oy: 20, frames: 4, fps: 8, loop: true, draw(p, u) { for (let k = 0; k < 3; k++) { const ph = (u + k / 3) % 1; p.ring((rnd(k) - 0.5) * 8 + ph * 6, -ph * 16, 2 + ph * 2, 1, H("#c8f0ff"), 1 - ph); } } },
  bubble: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 8, loop: true, draw(p, u) { p.ring(0, 0, 9, 1, H("#e8f8ff"), 0.9); blendDisc(p, 0, 0, 8, H("#c8f0ff"), 0.2); p.dot(-3, -4, H("#ffffff")); p.blend(3, 3, H("#f0c0ff"), 0.6); } },
  pop: burst({ R: 18, c: ["#ffffff", "#e8f8ff", "#a8d8f0"], smoke: "#c8e0f0", frames: 7 }),
  aring: ring({ R: Math.round(px(7)), c: "#d0f0a0", dark: "#3a5010" }),
  alkali: mist({ R: Math.round(px(7)), c: ["#e8f8d0", "#c0e0a0"], a: 0.45, n: 18 }),
  alkfloor: pool({ R: Math.round(px(7)), c: ["#a0c060", "#5a7020"], bubbles: "#e8f8d0", a: 0.4 }),
};
export const PREFIX = "jc_";

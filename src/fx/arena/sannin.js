// The Sannin on the 2.5D stage (2026-11-27): Orochimaru, Jiraiya, Tsunade (their summons are in src/fx/summon).
// Orochimaru (Legendary, Classic):
//   slot 1 "Summoning: Impure World Reincarnation (Edo Tensei)" (Manga 118 / Anime 70, Konoha Crush): coffins rise out
//     of the ground beside him; the First and Second Hokage step out and fight for him (here: Hashirama's wood and
//     Tobirama's water come from the coffins; the figures themselves are not drawn). buff (the coffins rise) -> line
//     (wood) -> line (water)
//   slot 2 "Sword of Kusanagi" (Manga 117): the blade comes out of his mouth and extends to pierce at range. line (thin,
//     very fast)
//   slot 3 "Five Elements Seal" (Gogyō Fūin, Manga 49 / Anime 27, on Naruto's seal): five fingertips lit with purple
//     flame, struck into the target's belly. rush -> sealed
//   slot 4 "Triple Rashōmon" (Kuchiyose: Rashōmon, the gates; the triple version is Shippuden Manga 295, see the slot
//     note): demonic gates rise in front of him. guard (in front)
// Orochimaru (Eight-Headed Serpent, Shippuden):
//   slot 1 "Eight Branches Technique" (Yamata no Jutsu, Manga 391): eight serpent heads lunge. shot (a fan of 8 heads)
//   slot 2 "Kusanagi Sword: Longsword of the Sky" (the extending blade at full reach). line (longer, faster)
//   slot 3 "Many Hidden Shadow Snake Hands" (Sen'ei Tajashu, Manga 290): many snakes from his sleeves bind the target
//     and bite. bind (snakes, held, bitten)
// Jiraiya (Legendary Sannin, Classic):
//   slot 1 "Summoning: Toad Mouth Bind" (Gamaguchi Shibari, Manga 146 / Anime 82 against Itachi and Kisame): the place
//     becomes the inside of a giant toad's gullet; the walls of flesh hold whoever is in it. zone (flesh, slowed)
//   slot 2 "Rasengan" (his own, Manga 147). rush
//   slot 3 "Fire Style: Toad Oil Flame Bullet" (Gamayu Endan, with Gamabunta's oil, Manga 168 / Anime 95): oil set on
//     fire, a wide stream of flame. line (wide fire)
//   slot 4 "Hair Needle Senbon" (Hari Jizō / Kebari Senbon, Manga 375): his hair hardened and shot as needles. shot
// Jiraiya (Sage Mode, Shippuden):
//   slot 1 "Sage Art: Bath of Boiling Oil" (Senpō: Goemon, with the sages, Manga 377): fire, wind and oil combined into
//     a flood of boiling oil. blast (waves at the aimed place, burning)
//   slot 2 "Massive Rasengan" (Ōdama Rasengan, Manga 375): a Rasengan bigger than he is. rush -> burst
// Tsunade (Fifth Hokage):
//   classic slot 1 "Creation Rebirth" (Byakugō no In: Sōzō Saisei, Manga 168 / Anime 95): the seal on her forehead
//     releases its chakra, the marks spread over her body, her body heals itself. heal (self)
//   classic slot 2 "Heaven Kick of Pain" (Tsūtenkyaku, Manga 162 / Anime 94): a leap and a heel brought down, the
//     ground splitting. rush (leap) -> the landing
//   classic slot 3 "Nervous System Rupture" (Ranshinshō, Manga 166 / Anime 94 on Kabuto... used by Kabuto on her): a
//     touch that scrambles the nerves' signals: the body does the opposite. rush (a touch) -> confused
//   shippuden slot 2 "Strength of a Hundred Technique" (Byakugō no Jutsu, Manga 577 against Madara): the marks spread and
//     she regenerates while she fights. buff (regeneration)
import { lane, spark, burst, shock, cracks, comet, orb, fireball, band, needle, pool, wrap, aura, mark, ring, dome, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const OC = "classic/orochimaru-legendary", OS = "shippuden/orochimaru-eight-headed-serpent", JC = "classic/jiraiya-legendary-sannin", JS = "shippuden/jiraiya-sage-mode", TC = "classic/tsunade-fifth-hokage", TS = "shippuden/tsunade-fifth-hokage";
const SN = ["#e8e0f0", "#9a8ab0", "#4a3a5a"], FIRE = ["#fff6c0", "#ffb030", "#e0401a"], W = ["#f0faff", "#7ac8f0", "#2a6ab0"], WOOD = ["#d8b888", "#9a7048", "#5a3a20"];
const mv = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.4, recover: 0.4, range: 34, cone: 50, cooldown: 8, lock: 0.4, dodge: { phase: "tell", side: 7 },
  sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", line_go: "whoosh", shot_go: "whoosh", blast_go: "burst", bind_go: "whoosh", hold: "bite", guard_go: "rumble", buff_go: "rumble", zone_go: "rumble", heal_go: "cast" }, stages, look, ...extra });
export const MOVES = [
  mv(OC, 1, "orochimaru-edo-tensei", [
    { mech: "buff", dur: 1, dmgMult: 1, show: 1.0, buffName: "Edo Tensei", hitKind: "Edo Tensei" },
    { mech: "line", aim: 0.3, tell: 0.3, from: 3, len: 30, speed: 34, width: 2.4, hold: 0.3, fade: 0.3, hit: { dmg: 14, status: "stun", statusT: 1 }, hitKind: "Holz (Hashirama)" },
    { mech: "line", skipAim: true, from: 3, len: 30, speed: 44, width: 2.4, hold: 0.25, fade: 0.3, hit: { dmg: 14, kb: 10 }, hitKind: "Wasser (Tobirama)" },
  ], [
    atCaster("sn_coffins", ["buff_go", "aim", "tell", "line_go", "retract"]),
    floorTell("sn_wlane"),
    L("sn_wood", "line", ["line_go"], { stage: 2, rotate: true, seg: 2.4, lift: 0 }),
    L("sn_water", "line", ["line_go"], { stage: 3, rotate: true, seg: 2.6, lift: 26 }),
    impact("cm_splash", { lift: 20 }),
  ], { seal: 0.6, lock: 0.6, cooldown: 12 }),
  mv(OC, 2, "orochimaru-kusanagi", [
    { mech: "line", aim: 0.3, tell: 0.25, from: 1, len: 26, speed: 120, width: 1.2, hold: 0.25, fade: 0.2, hit: { dmg: 24, kb: 6 }, hitKind: "Kusanagi" },
  ], [ hand("sn_mouth", ["aim", "tell"], { lift: 54, handF: 0.8 }), floorTell("sn_klane"), L("sn_blade", "line", ["line_go"], { rotate: true, seg: 2, lift: 52 }), L("sn_tip", "line", ["line_go"], { head: true, rotate: true, lift: 52 }), impact("sn_cut", { lift: 40 }) ]),
  mv(OC, 3, "orochimaru-gogyo-fuuin", [
    { mech: "rush", aim: 0.3, tell: 0.3, speed: 50, reach: 2.4, reachMax: 32, hits: 1, hit: { dmg: 10, kb: 6, status: "seal", statusT: 8 }, impact: 0.45, hitKind: "Gogyō Fūin" },
  ], [ hand("sn_five", ["seal", "aim", "tell", "rush_go"]), floorTell("sn_klane"), impact("sn_sealmark", { lift: 36 }) ], { hitPop: "VERSIEGELT" }),
  mv(OC, 4, "orochimaru-rashomon", [
    { mech: "guard", mode: "block", arc: 75, radius: 6, dur: 3.5, hitKind: "Rashōmon" },
  ], [ L("sn_gates", "caster", ["guard_go"], { views: true }), L("sn_spark", "block", ["guard_go"], { play: "once", lift: 30 }) ], { seal: 0.5, lock: 0.5, cooldown: 10 }),
  mv(OS, 1, "orochimaru-yamata", [
    { mech: "shot", aim: 0.35, tell: 0.35, from: 2, count: 8, spread: 70, gap: 0.04, speed: 30, radius: 2.8, reach: 32, hit: { dmg: 9, kb: 5 }, impact: 0.4, hitKind: "Yamata no Jutsu" },
  ], [ atCaster("sn_coils", ["seal", "aim", "tell", "shot_go"]), L("sn_fan", "caster", ["tell"], { ground: true, rotate: true }), L("sn_head", "proj", null, { views: true, lift: 26 }), impact("sn_bite", { lift: 26 }) ], { dodge: { phase: "tell", back: 14 } }),
  mv(OS, 2, "orochimaru-longsword", [
    { mech: "line", aim: 0.3, tell: 0.3, from: 1, len: 36, speed: 150, width: 1.2, hold: 0.3, fade: 0.2, hit: { dmg: 26, kb: 8 }, hitKind: "Kusanagi: Chōken" },
  ], [ hand("sn_mouth", ["aim", "tell"], { lift: 54, handF: 0.8 }), floorTell("sn_llane"), L("sn_blade", "line", ["line_go"], { rotate: true, seg: 2, lift: 52 }), L("sn_tip", "line", ["line_go"], { head: true, rotate: true, lift: 52 }), impact("sn_cut", { lift: 40 }) ]),
  mv(OS, 3, "orochimaru-senei-tajashu", [
    { mech: "bind", aim: 0.3, tell: 0.3, speed: 30, steer: 3, radius: 2, reachMax: 28, hold: 2.2, dot: 6, crush: { dmg: 6, kb: 6 }, back: 36, hitKind: "Sen'ei Tajashu" },
  ], [ hand("sn_sleeve", ["aim", "tell"]), L("sn_snake", "link", ["bind_go", "hold", "retract"], { rotate: true, seg: 2.2, lift: 22 }), L("sn_snakehead", "tip", ["bind_go"], { lift: 22 }), L("sn_coil", "grab", ["hold"]) ], { dodge: { phase: "tell", back: 14 } }),
  mv(JC, 1, "jiraiya-gamaguchi", [
    { mech: "zone", radius: 8, dur: 4, dot: 4, status: "slow", aim: 0.35, tell: 0.4, hitKind: "Gamaguchi Shibari" },
  ], [ hand("sn_seal", ["seal", "aim", "tell"], { lift: 34 }), aimRing("sn_gring"), L("sn_flesh", "zone", ["zone_go"], { ground: true }), L("sn_walls", "zone", ["zone_go"]) ], { cooldown: 11, dodge: { phase: "tell", back: 12 } }),
  mv(JC, 2, "jiraiya-rasengan", [
    { mech: "rush", aim: 0.3, tell: 0.3, speed: 46, reach: 2.4, reachMax: 32, hits: 1, hit: { dmg: 26, kb: 12 }, impact: 0.4, hitKind: "Rasengan" },
  ], [ hand("sn_ball", ["seal", "aim", "tell", "rush_go"], { lift: 28 }), floorTell("sn_lane"), impact("sn_burst", { lift: 30 }), impact("sn_jring") ], { seal: 0.5, lock: 0.5, shake: 1.4 }),
  mv(JC, 3, "jiraiya-gamayu-endan", [
    { mech: "line", aim: 0.35, tell: 0.35, from: 2, len: 30, speed: 34, width: 3.4, hold: 0.4, fade: 0.35, dot: 30, hit: { status: "burn", statusT: 2.5, kb: 6 }, hitKind: "Gamayu Endan" },
  ], [ hand("sn_mouthfire", ["seal", "aim", "tell"], { lift: 40, handF: 1 }), floorTell("sn_flane"), L("sn_flame", "line", ["line_go"], { rotate: true, seg: 3, lift: 24 }), L("sn_fhead", "line", ["line_go"], { head: true, lift: 24 }) ], { seal: 0.5, lock: 0.5 }),
  mv(JC, 4, "jiraiya-kebari-senbon", [
    { mech: "shot", aim: 0.3, tell: 0.3, from: 1.5, count: 9, spread: 24, gap: 0.02, speed: 60, radius: 1.4, reach: 32, hit: { dmg: 4 }, impact: 0.3, hitKind: "Kebari Senbon" },
  ], [ hand("sn_hair", ["seal", "aim", "tell"], { lift: 56, handF: -0.6 }), L("sn_nfan", "caster", ["tell"], { ground: true, rotate: true }), proj("sn_needle", { lift: 50 }), impact("sn_nhit", { lift: 40 }) ], { dodge: { phase: "tell", side: 15 } }),
  mv(JS, 1, "jiraiya-goemon", [
    { mech: "blast", aim: 0.4, tell: 0.45, radius: 6.5, waves: 3, gap: 0.35, hit: { dmg: 9, status: "burn", statusT: 2.5, kb: 3 }, after: 0.8, hitKind: "Senpō: Goemon" },
  ], [ atCaster("sn_sage", ["seal", "aim", "tell", "blast_go"]), aimRing("sn_oring"), L("sn_oil", "blast", ["blast_go"], { ground: true, play: "loop" }), L("sn_boil", "blast", ["blast_go"]) ], { seal: 0.5, lock: 0.5, cooldown: 10, dodge: { phase: "tell", back: 12 } }),
  mv(JS, 2, "jiraiya-oodama-rasengan", [
    { mech: "rush", aim: 0.3, tell: 0.35, speed: 42, reach: 3.2, reachMax: 32, hits: 1, hit: { dmg: 32, kb: 16, kbT: 0.4 }, impact: 0.5, hitKind: "Ōdama Rasengan" },
  ], [ atCaster("sn_sage", ["seal", "aim", "tell", "rush_go"]), hand("sn_bigball", ["seal", "aim", "tell", "rush_go"], { lift: 34, handF: 2.2 }), floorTell("sn_lane"), impact("sn_bigburst"), impact("sn_jring") ], { seal: 0.6, lock: 0.6, shake: 2 }),
  mv(TC, 1, "tsunade-souzou-saisei", [
    { mech: "heal", self: true, rate: 32, dur: 2.2, hitKind: "Sōzō Saisei" },
  ], [ atCaster("sn_marks", ["heal_go"]), atCaster("sn_glow", ["heal_go"]) ], { seal: 0.5, lock: 0.5, cooldown: 14 }),
  mv(TC, 2, "tsunade-tsuutenkyaku", [
    { mech: "rush", leap: true, aim: 0.35, tell: 0.35, air: 0.65, height: 10, radius: 5, hit: { dmg: 30, kb: 10, kbT: 0.3 }, impact: 0.5, hitKind: "Tsūtenkyaku" },
  ], [ aimRing("sn_tring"), L("sn_shadow", "land", ["rush_go"], { ground: true }), impact("cm_slam"), impact("cm_landing") ], { shake: 2.4, dodge: { phase: "tell", side: 9 } }),
  mv(TC, 3, "tsunade-ranshinshou", [
    { mech: "rush", aim: 0.3, tell: 0.3, speed: 44, reach: 2.2, reachMax: 32, hits: 1, hit: { dmg: 6, kb: 4, status: "confuse", statusT: 5 }, impact: 0.4, hitKind: "Ranshinshō" },
  ], [ hand("sn_tspark", ["seal", "aim", "tell", "rush_go"]), floorTell("sn_lane"), impact("sn_nerve", { lift: 40 }) ], { hitPop: "VERWIRRT" }),
  mv(TS, 2, "tsunade-byakugou", [
    { mech: "buff", dur: 8, dmgMult: 1.25, regen: 10, show: 1.2, buffName: "Byakugō", hitKind: "Byakugō no Jutsu" },
  ], [ atCaster("sn_marks", ["buff_go"]), atCaster("sn_glow", ["buff_go"]) ], { seal: 0.5, lock: 0.5, cooldown: 14 }),
];

// a serpent's head (Yamata, the snake hands): side (mouth open toward +x), front (coming), back
function snakeHead(p, u, view, c = SN) {
  const c1 = H(c[0]), c2 = H(c[1]), c3 = H(c[2]), jaw = 2 + 2 * Math.sin(u * 6.28);
  if (view === "side") { blendEllipse(p, -2, 0, 11, 7, c3, 0.95); blendEllipse(p, -1, -1, 9, 5, c2, 0.95); for (let x = 4; x <= 14; x++) { p.blend(x, -2 - (x - 4) * 0.15, c2, 1); p.blend(x, 2 + jaw * (x - 4) / 10, c2, 1); } p.dot(3, -3, H("#d8c040")); }
  else if (view === "front") { blendDisc(p, 0, 0, 9, c3, 0.95); blendDisc(p, 0, -1, 7, c2, 0.95); blendEllipse(p, 0, 3, 5, 1 + jaw * 0.6, H("#3a1020"), 1); p.dot(-4, -3, H("#d8c040")); p.dot(4, -3, H("#d8c040")); }
  else { blendDisc(p, 0, 0, 9, c3, 0.95); blendDisc(p, 0, 1, 7, c2, 0.95); }
}
export const FX = {
  // Edo Tensei: two coffins rising out of the ground beside him, the lids falling (once, held)
  coffins: { cw: 150, ch: 110, ox: 75, oy: 100, frames: 8, fps: 10, draw(p, u) { const k = Math.min(1, u * 1.6); for (const s of [-1, 1]) { const x = s * 46, h = 80 * k; for (let y = 0; y >= -h; y--) for (let dx = -12; dx <= 12; dx++) p.blend(x + dx, y, H(Math.abs(dx) > 10 ? "#2a2018" : u > 0.7 ? "#1a1410" : "#6a5a44"), 0.95); if (u > 0.7) p.rect(x - 4, -h + 10, 8, 3, H("#d8c8a0")); } for (let k2 = 0; k2 < 8; k2++) blendDisc(p, (rnd(k2) - 0.5) * 140, -4, 8, H("#8a7a5a"), 0.5 * (1 - u)); } },
  wlane: lane({ len: px(30), w: Math.round(px(2.4)), c: "#e0d8c0", dark: "#4a3a20" }),
  wood: { cw: 30, ch: 60, ox: 15, oy: 56, frames: 4, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 3; k++) { const x = (k - 1) * 7, h = 30 + 16 * Math.sin(u * 6.28 + k); for (let y = 0; y >= -h; y--) for (let dx = -3; dx <= 3; dx++) p.blend(x + dx + y * 0.1, y, H(Math.abs(dx) > 2 ? WOOD[2] : WOOD[1]), 0.95); } } },
  water: band({ len: 26, w: 12, c: W, a: 0.82 }),
  splash: burst({ R: 28, c: W, smoke: "#c8d8e8", frames: 9 }),
  // Kusanagi: the blade coming from the mouth, its line, the blade (pieces), the tip, the cut
  mouth: { cw: 20, ch: 16, ox: 10, oy: 8, frames: 2, fps: 6, loop: true, draw(p, u) { p.rect(-3, -1, 6, 2, H("#c8ccd8")); p.dot(3 + u, 0, H("#ffffff")); } },
  klane: lane({ len: px(26), w: 4, c: "#e8e8f0", dark: "#3a3a48" }),
  llane: lane({ len: px(36), w: 4, c: "#e8e8f0", dark: "#3a3a48" }),
  blade: { cw: 20, ch: 8, ox: 10, oy: 4, frames: 1, fps: 1, draw(p) { p.rect(-10, -1, 20, 2, H("#c8ccd8")); p.rect(-10, -1, 20, 1, H("#ffffff")); } },
  tip: { cw: 16, ch: 8, ox: 4, oy: 4, frames: 1, fps: 1, draw(p) { for (let x = 0; x < 10; x++) p.rect(x, -1 + Math.floor(x / 5), 1, 2 - Math.floor(x / 5), H("#e8ecf4")); } },
  cut: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 5, fps: 20, draw(p, u) { p.line(-20 * u, -20 * u, 20 * u, 20 * u, H("#ffffff"), 1 - u); p.line(-18 * u, -16 * u, 18 * u, 22 * u, H("#c8d8e8"), 1 - u); } },
  // Five Elements Seal: five purple flames on the fingertips (loop), the seal mark burnt on (once)
  five: { cw: 34, ch: 30, ox: 17, oy: 22, frames: 4, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 5; k++) { const x = (k - 2) * 4, h = 6 + 3 * Math.sin(u * 6.28 + k); blendEllipse(p, x, -h / 2, 2, h / 2 + 1, H("#a050e0"), 0.9); p.dot(x, -1, H("#f0c0ff")); } } },
  sealmark: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 8, fps: 12, draw(p, u) { const a = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; p.ring(0, 0, 18, 1, H("#a050e0"), a); for (let k = 0; k < 5; k++) { const ang = (k / 5) * 6.28 - 1.57; p.line(0, 0, Math.cos(ang) * 18, Math.sin(ang) * 18, H("#e0b0ff"), a); } blendDisc(p, 0, 0, 6 * (1 - u), H("#ffffff"), 1); } },
  // Rashōmon: the gates (a dark demon gate with a face) rising in front of him (views), a spark where something hits
  gates: { views: true, cw: 120, ch: 130, ox: 60, oy: 122, frames: 6, fps: 10, draw(p, u, i, view) {
    const k = Math.min(1, u * 2), h = 110 * k, side = view === "side";
    const x0 = side ? 38 : 0, w = side ? 8 : 44, y0 = view === "back" ? -6 : 6;
    for (let y = 0; y >= -h; y--) for (let x = -w; x <= w; x++) { const edge = Math.abs(x) > w - 3 || y < -h + 6; p.blend(x0 + x, y + y0, H(edge ? "#2a1a1a" : (Math.abs(x) < 3 && !side) ? "#4a2a2a" : "#6a3a2a"), view === "front" ? 0.55 : 0.95); }
    if (!side && k >= 1 && view !== "front") { p.rect(-14, -80 + y0, 8, 4, H("#e0c040")); p.rect(6, -80 + y0, 8, 4, H("#e0c040")); }
  } },
  spark: { cw: 40, ch: 40, ox: 20, oy: 20, frames: 5, fps: 20, draw(p, u) { for (let s = 0; s < 6; s++) { const a = (s / 6) * 6.28; p.line(Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * 14 * (0.3 + u), Math.sin(a) * 14 * (0.3 + u), H("#ffe080"), 1 - u); } } },
  // Yamata: the coils behind him, the fan (tell), a serpent head (views), the bite
  coils: { cw: 120, ch: 100, ox: 60, oy: 94, frames: 6, fps: 8, loop: true, draw(p, u) { for (let k = 0; k < 8; k++) { const a = -Math.PI * (0.1 + 0.8 * k / 7), r = 40; for (let t = 0; t < 1; t += 0.03) { const x = Math.cos(a) * r * t + Math.sin(t * 9 + u * 6.28 + k) * 3, y = -10 + Math.sin(a) * r * 1.6 * t; blendDisc(p, x, y, 4, H(SN[k % 3]), 0.85); } } } },
  fan: { ground: true, cw: Math.ceil(px(30)) + 8, ch: Math.ceil(px(30) * 1.4) + 10, ox: 2, oy: Math.ceil(px(30) * 0.7) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = -4; k <= 4; k++) { const a = k * 0.155; for (let x = 6; x <= px(30); x += 2) if (((x / 14 - u) % 1 + 1) % 1 < 0.4) p.blend(Math.cos(a) * x, Math.sin(a) * x, H(SN[1]), 0.8); } } },
  head: { views: true, cw: 36, ch: 26, ox: 18, oy: 13, frames: 4, fps: 12, loop: true, draw(p, u, i, view) { snakeHead(p, u, view); } },
  bite: { cw: 40, ch: 40, ox: 20, oy: 20, frames: 5, fps: 18, draw(p, u) { for (const s of [1, -1]) for (let k = 0; k < 3; k++) p.line(-6 + k * 6, s * 10 * (1 - u), -4 + k * 6, s * 2, H("#ffffff"), 1 - u); } },
  // Shadow Snake Hands: the snakes from his sleeve (pieces), their head, coiled round the held one
  sleeve: { cw: 24, ch: 20, ox: 12, oy: 10, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 3; k++) blendDisc(p, (k - 1) * 4 + Math.sin(u * 6.28 + k) * 2, Math.cos(u * 6.28 + k) * 3, 2.5, H(SN[1]), 0.9); } },
  snake: { cw: 20, ch: 14, ox: 10, oy: 7, frames: 4, fps: 12, loop: true, draw(p, u) { for (let x = -10; x <= 10; x++) { const y = Math.sin(x / 3 + u * 6.28) * 2.5; blendDisc(p, x, y, 2.6, H(SN[2]), 1); p.blend(x, y - 1, H(SN[1]), 1); } } },
  snakehead: { cw: 36, ch: 26, ox: 18, oy: 13, frames: 4, fps: 12, loop: true, draw(p, u) { snakeHead(p, u, "side"); } },
  coil: wrap({ c: [SN[1], SN[2], SN[0]], h: 66, w: 16, rings: 4, a: 0.95 }),
  // Toad Mouth Bind: his seal, the ring (tell), the flesh floor (loop), the walls round it (loop)
  seal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H("#e8a0a0"), 1 - ph); } } },
  gring: ring({ R: Math.round(px(8)), c: "#e88a8a", dark: "#5a1a1a" }),
  flesh: pool({ R: Math.round(px(8)), c: ["#c86a6a", "#7a2a2a"], bubbles: "#f0a0a0", a: 0.7 }),
  walls: { cw: Math.ceil(px(8) * 2.2), ch: 110, ox: Math.ceil(px(8) * 1.1), oy: 100, frames: 6, fps: 8, loop: true, draw(p, u) { const R = px(8); for (let k = 0; k < 22; k++) { const a = (k / 22) * 6.28, x = Math.cos(a) * R, y = Math.sin(a) * R * 0.3; if (Math.sin(a) < -0.2) continue; const h = 50 + 14 * Math.sin(u * 6.28 + k); for (let yy = 0; yy >= -h; yy--) p.blend(x + Math.sin(yy * 0.1 + k) * 3, y + yy, H(yy < -h + 4 ? "#f0a0a0" : "#b04a4a"), 0.85); } } },
  // Rasengan (Jiraiya's), the line, the burst, the ring; the big one
  ball: orb({ r: 12 }),
  lane: lane({ len: px(32), w: 8, c: "#e0f0ff", dark: "#30405a" }),
  burst: burst({ R: 34, c: ["#ffffff", "#a8e0ff", "#3a8ae0"], smoke: "#5a6a8a", rays: 8 }),
  jring: shock({ R: 56, c: "#e8f0ff", edge: "#4a5a7a" }),
  bigball: orb({ r: 24, streaks: 10 }),
  bigburst: burst({ R: 60, c: ["#ffffff", "#a8e0ff", "#3a8ae0"], smoke: "#5a6a8a", rays: 12, frames: 12 }),
  // Toad Oil Flame Bullet: fire at the mouth, the line, the flame stream (pieces), its front
  mouthfire: fireball({ r: 7 }),
  flane: lane({ len: px(30), w: Math.round(px(3.4)), c: "#ffd080", dark: "#6a2a10" }),
  flame: band({ len: 26, w: 16, c: FIRE, a: 0.85 }),
  fhead: fireball({ r: 20 }),
  // Hair Needle Senbon: the hair bristling (loop), the fan (tell), a needle, a needle's hit
  hair: { cw: 40, ch: 30, ox: 20, oy: 20, frames: 3, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 9; k++) { const a = -Math.PI * (0.1 + 0.8 * k / 8); p.line(0, 0, Math.cos(a) * (10 + 3 * u), Math.sin(a) * (10 + 3 * u), H("#f0f0f0"), 0.9); } } },
  nfan: { ground: true, cw: Math.ceil(px(30)) + 8, ch: Math.ceil(px(30) * 0.8) + 10, ox: 2, oy: Math.ceil(px(30) * 0.4) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = -4; k <= 4; k++) { const a = k * 0.087; for (let x = 6; x <= px(30); x += 3) if (((x / 12 - u) % 1 + 1) % 1 < 0.35) p.blend(Math.cos(a) * x, Math.sin(a) * x, H("#e8e8f0"), 0.75); } } },
  needle: needle({ len: 16, c: "#f0f0f0" }),
  nhit: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 18, draw(p, u) { p.line(-6, 0, 6, 0, H("#ffffff"), 1 - u); p.line(0, -6, 0, 6, H("#ffffff"), 1 - u); } },
  // Sage Mode (Jiraiya): the toad markings' glow; Goemon: the ring, the oil spreading (loop), boiling over it (loop)
  sage: aura({ c: ["#fff0c0", "#f0a040", "#c06020"], h: 74, w: 24, a: 0.3 }),
  oring: ring({ R: Math.round(px(6.5)), c: "#ffb040", dark: "#5a2a10" }),
  oil: pool({ R: Math.round(px(6.5)), c: ["#e09030", "#8a4010"], bubbles: "#fff0a0", a: 0.75 }),
  boil: { cw: Math.ceil(px(6.5) * 2.2), ch: 100, ox: Math.ceil(px(6.5) * 1.1), oy: 90, frames: 6, fps: 12, loop: true, draw(p, u) { const R = px(6.5); for (let k = 0; k < 24; k++) { const ph = (u + rnd(k)) % 1, x = (rnd(k + 1) - 0.5) * R * 1.8, y = (rnd(k + 2) - 0.5) * R * 0.5 - ph * 60; blendEllipse(p, x, y, 6 * (1 - ph) + 2, 9 * (1 - ph) + 3, H(FIRE[k % 3]), 0.85 * (1 - ph)); } } },
  // Tsunade: the Byakugō marks spreading from the forehead (loop), the healing glow (loop)
  marks: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 6, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 14; k++) { const x0 = (rnd(k) - 0.5) * 26, y0 = -70 + rnd(k + 2) * 60, L0 = 4 + 6 * ((u + rnd(k + 4)) % 1); p.line(x0, y0, x0 + (rnd(k + 6) - 0.5) * L0, y0 + L0, H("#2a1a3a"), 0.9); } blendDisc(p, 0, -64, 2, H("#8a3ab0"), 1); } },
  glow: aura({ c: ["#f0fff0", "#9af0b0", "#3ab06a"], h: 76, w: 22, a: 0.35 }),
  // Heaven Kick of Pain: the landing ring (tell), her shadow under the leap, the quake, rocks thrown up
  tring: ring({ R: Math.round(px(5)), c: "#ffd040", dark: "#5a4a10" }),
  shadow: pool({ R: 16, c: ["#16101c", "#16101c"], bubbles: "#16101c", a: 0.4 }),
  quake: cracks({ R: 60, c: "#2a2018", n: 20 }),
  rocks: { cw: 160, ch: 120, ox: 80, oy: 110, frames: 10, fps: 16, draw(p, u) { for (let k = 0; k < 16; k++) { const a = -Math.PI * (0.1 + 0.8 * rnd(k)), v = 60 + 50 * rnd(k + 3), x = Math.cos(a) * v * u, y = Math.sin(a) * v * u * 1.2 + 120 * u * u; if (y < 2) p.rect(x - 3, y - 3, 6, 5, H(k % 2 ? "#8a7a5a" : "#b8a888"), 1); } blendDisc(p, 0, -10, 40 * u, H("#b8a888"), 0.4 * (1 - u)); } },
  // Nervous System Rupture: the electric touch, the nerves sparking on the target
  tspark: { cw: 24, ch: 24, ox: 12, oy: 12, frames: 4, fps: 16, loop: true, draw(p, u, i) { for (let k = 0; k < 3; k++) { const a = rnd(k + i * 4) * 6.28; p.line(0, 0, Math.cos(a) * 8, Math.sin(a) * 8, H("#c0e8ff"), 0.9); } } },
  nerve: mark({ kind: "stars", c: ["#ffffff", "#9ad8ff"], R: 12 }),
};
export const PREFIX = "sn_";

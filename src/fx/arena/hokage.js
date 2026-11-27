// The Hokage on the 2.5D stage (2026-11-27): Hiruzen (Classic, Prime), Hashirama and Tobirama (Konoha Crush, Edo
// bodies), Minato (flashback). (Hiruzen's Enma moves are summons: src/fx/summon/enma.js.)
// Hiruzen (Third Hokage, Classic):
//   slot 1 "Reaper Death Seal" (Shiki Fūjin, Manga 121 / Anime 72): the Shinigami appears behind him, its arm goes
//     through his body and pulls the target's soul out; Orochimaru's arms are sealed (here: sealed for long, hurt).
//     bind (the death god's arm reaching, the soul held) -> crush (sealed)
//   slot 3 "Fire Style: Dragon Flame Bomb" (Katon: Karyū Endan, anime Konoha Crush): a dragon of fire breathed out
//     along the line. line (a fire dragon)
//   slot 4 "Shuriken Shadow Clone" (Shuriken Kage Bunshin, Manga 118): one shuriken thrown multiplies into a storm of
//     them. shot (a wide volley)
// Hiruzen (Prime, flashback, Shippuden):
//   slot 2 "Five-Element Combo Blast" (combining natures: fire carried by wind): a fireball, then a gust that feeds it.
//     shot (fire) -> line (wind)
//   slot 3 "Earth Release: Earth-Style Wall" (Doton: Doryūheki): a wall of earth breathed up in front of him. guard
// Hashirama (First Hokage, Konoha Crush):
//   slot 1 "Wood Style: Deep Forest Emergence" (Mokuton: Jukai Kōtan, Manga 119 / Anime 71): trees burst from the
//     ground and grow over everything in their way, binding. line (wide, trees rising) -> stunned
//   slot 2 "Wood Locking Wall" (Mokujōheki, Manga 621): a dome of wooden beams round him. guard (full)
//   slot 3 "Bringer-of-Darkness Technique" (Kokuangyō, anime Konoha Crush): darkness falls over those in front of
//     him; they cannot see. state (blind)
//   slot 4 "Taijutsu Combo": blows of an Edo body that does not tire. rush (combo)
// Tobirama (Second Hokage, Konoha Crush):
//   slot 1 "Water Style: Water Dragon Jutsu" (Suiryūdan, made from nothing: he needs no water nearby). line
//   slot 2 "Water Shockwave" (Suiton: Suishōha): water pours from his mouth into a wave all round him. blast (self, waves)
//   slot 3 "Infinite Darkness" (the darkness genjutsu, anime): an inky dark closing on the target. state (blind)
//   slot 4 "Sword of the Thunder God" (Raijin no Ken, anime flashback): a blade of lightning, extended at range,
//     paralysing. line (a lightning blade)
// Minato (Fourth Hokage, flashback, Shippuden):
//   slot 1 "Flying Raijin Level 2" (Hiraishin Nidan, Manga 503): a marked kunai thrown, he appears at it and strikes.
//     shot (the kunai) -> blink (to the kunai) with a strike
//   slot 2 "Rasengan" (his own creation): rush
//   slot 3 "Flying Raijin: Guiding Thunder" (Hiraishin: Michi Shirube, Manga 641): the seal put on the target by a
//     touch; he can come to it wherever it goes. rush (the touch, the seal) -> blink (to the target, a strike)
//   slot 4 "Reaper Death Seal" (Shiki Fūjin on the Nine-Tails, Manga 503): as Hiruzen's, the death god behind him.
import { lane, spark, burst, shock, comet, orb, fireball, band, shuriken, kunai, pool, wrap, aura, mark, ring, dome, crescent, crackle, mist, poof, dragonHead, reaper, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const HC = "classic/hiruzen-sarutobi-third-hokage", HP = "shippuden/hiruzen-sarutobi-prime-flashback", HA = "classic/hashirama-senju-first-hokage-konoha-crush", TO = "classic/tobirama-senju-second-hokage-konoha-crush", MI = "shippuden/minato-namikaze-fourth-hokage-flashback";
const FIRE = ["#fff6c0", "#ffb030", "#e0401a"], W = ["#f0faff", "#7ac8f0", "#2a6ab0"], WOOD = ["#d8b888", "#9a7048", "#5a3a20"], EARTH = ["#c8b090", "#8a7050", "#4a3a28"], LT = ["#ffffff", "#9ad8ff", "#3a70e8"];
const mv = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.45, recover: 0.4, range: 34, cone: 50, cooldown: 8, lock: 0.45, dodge: { phase: "tell", side: 7 },
  sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", line_go: "whoosh", shot_go: "whoosh", blast_go: "burst", bind_go: "whoosh", hold: "bite", guard_go: "rumble", buff_go: "rumble", zone_go: "rumble", state_go: "cast", blink_go: "whoosh" }, stages, look, ...extra });
const reaperMove = (variant, slot, id) => mv(variant, slot, id, [
  { mech: "bind", aim: 0.4, tell: 0.4, from: 1.5, speed: 16, steer: 1.5, radius: 2, reachMax: 14, hold: 2, crush: { dmg: 20, status: "seal", statusT: 12 }, crushKind: "Shiki Fūjin", back: 20, hitKind: "Shiki Fūjin" },
], [ L("hk_reaper", "caster", ["seal", "aim", "tell", "bind_go", "hold", "retract"], { depth: -2 }), L("hk_ghostarm", "link", ["bind_go", "hold", "retract"], { rotate: true, seg: 2, lift: 36 }), L("hk_soul", "grab", ["hold"], { lift: 10 }), impact("hk_sealmark", { lift: 40 }) ],
  { seal: 0.8, lock: 0.8, cooldown: 14, range: 16, hitPop: "SEELE VERSIEGELT", dodge: { phase: "tell", back: 10 } });
export const MOVES = [
  reaperMove(HC, 1, "hiruzen-shiki-fuujin"),
  mv(HC, 3, "hiruzen-karyuu-endan", [
    { mech: "line", aim: 0.35, tell: 0.35, from: 2, len: 32, speed: 36, width: 2.8, hold: 0.35, fade: 0.35, hit: { dmg: 22, kb: 8, status: "burn", statusT: 3 }, hitKind: "Karyū Endan" },
  ], [ hand("hk_mouthfire", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), floorTell("hk_flane"), L("hk_fbody", "line", ["line_go"], { rotate: true, seg: 2.8, lift: 30 }), L("hk_fhead", "line", ["line_go"], { head: true, views: true, lift: 32 }), L("hk_embers", "line", ["retract"], { seg: 5, lift: 20, play: "once" }) ], { seal: 0.7, lock: 0.7 }),
  mv(HC, 4, "hiruzen-shuriken-kage-bunshin", [
    { mech: "shot", aim: 0.3, tell: 0.3, from: 1.5, count: 12, spread: 40, gap: 0.015, speed: 50, radius: 1.5, reach: 32, hit: { dmg: 4 }, impact: 0.3, hitKind: "Shuriken Kage Bunshin" },
  ], [ hand("hk_one", ["aim", "tell"]), L("hk_sfan", "caster", ["tell"], { ground: true, rotate: true }), proj("hk_star", { rotate: false, lift: 30 }), impact("hk_ting", { lift: 30 }) ], { dodge: { phase: "tell", side: 16 } }),
  mv(HP, 2, "hiruzen-five-element-combo", [
    { mech: "shot", aim: 0.35, tell: 0.35, from: 2, speed: 30, radius: 2.4, reach: 32, burst: 4, hit: { dmg: 12, status: "burn", statusT: 2 }, impact: 0.15, hitKind: "Katon" },
    { mech: "line", skipAim: true, from: 2, len: 32, speed: 60, width: 3.2, hold: 0.3, fade: 0.3, hit: { dmg: 12, kb: 12, status: "burn", statusT: 3 }, hitKind: "Fūton + Katon" },
  ], [ hand("hk_mouthfire", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), floorTell("hk_flane"), proj("hk_fireball", { rotate: false, lift: 40 }), impact("hk_fburst"), L("hk_gust", "line", ["line_go"], { stage: 2, rotate: true, seg: 3, lift: 30 }) ], { seal: 0.6, lock: 0.6, cooldown: 10 }),
  mv(HP, 3, "hiruzen-doryuuheki", [
    { mech: "guard", mode: "block", arc: 80, radius: 6, dur: 4, hitKind: "Doryūheki" },
  ], [ L("hk_earthwall", "caster", ["guard_go"], { views: true }), L("hk_chips", "block", ["guard_go"], { play: "once", lift: 30 }) ], { cooldown: 10 }),
  mv(HA, 1, "hashirama-jukai-koutan", [
    { mech: "line", aim: 0.35, tell: 0.45, from: 2, len: 30, speed: 28, width: 4.6, hold: 0.6, fade: 0.4, hit: { dmg: 16, status: "stun", statusT: 2.4 }, hitKind: "Jukai Kōtan" },
  ], [ hand("hk_wseal", ["seal", "aim", "tell"], { lift: 34 }), floorTell("hk_tlane"), L("hk_trees", "line", ["line_go", "retract"], { seg: 3.2, lift: 0 }), L("hk_roots", "line", ["line_go", "retract"], { ground: true, rotate: true, seg: 3.2 }), L("hk_bound", "target", ["line_go", "retract"], { play: "hold" }) ], { seal: 0.6, lock: 0.6, cooldown: 10, dodge: { phase: "tell", side: 9 } }),
  mv(HA, 2, "hashirama-mokujouheki", [
    { mech: "guard", mode: "full", radius: 4.4, dur: 4, hitKind: "Mokujōheki" },
  ], [ atCaster("hk_wooddome", ["guard_go"]), L("hk_chips", "block", ["guard_go"], { play: "once", lift: 30 }) ], { cooldown: 11 }),
  mv(HA, 3, "hashirama-kokuangyou", [
    { mech: "state", aim: 0.35, tell: 0.4, reach: 28, sight: 40, status: "blind", statusT: 5, dmg: 0, dur: 1, hitKind: "Kokuangyō" },
  ], [ hand("hk_seal", ["seal", "aim", "tell"], { lift: 34 }), L("hk_dcone", "caster", ["tell"], { ground: true, rotate: true }), L("hk_dark", "target", ["state_go", "recover"]) ], { hitPop: "DUNKELHEIT", dodge: { phase: "tell", back: 12 } }),
  mv(HA, 4, "hashirama-taijutsu", [
    { mech: "rush", aim: 0.25, tell: 0.25, speed: 50, reach: 2.4, reachMax: 32, hits: 4, combo: 0.8, hit: { dmg: 6 }, finish: { dmg: 14, kb: 12 }, impact: 0.35, hitKind: "Taijutsu" },
  ], [ floorTell("hk_lane"), L("hk_blows", "grab", ["combo"], { lift: 36 }), impact("hk_dust") ], { seal: 0.2, lock: 0.25 }),
  mv(TO, 1, "tobirama-suiryuudan", [
    { mech: "line", aim: 0.35, tell: 0.35, from: 2, len: 34, speed: 42, width: 3.2, hold: 0.35, fade: 0.35, hit: { dmg: 24, kb: 11 }, hitKind: "Suiryūdan" },
  ], [ hand("hk_wseal", ["seal", "aim", "tell"], { lift: 34 }), floorTell("hk_wlane"), L("kk_wpool", "caster", ["tell", "line_go"], { ground: true }), L("hk_wbody", "line", ["line_go"], { rotate: true, seg: 2.8, lift: 30 }), L("hk_whead", "line", ["line_go"], { head: true, views: true, lift: 34 }), L("kk_spray", "line", ["retract"], { seg: 5, lift: 10, play: "once" }) ], { seal: 0.7, lock: 0.7 }),
  mv(TO, 2, "tobirama-suishouha", [
    { mech: "blast", at: "self", noAim: true, radius: 9, waves: 2, gap: 0.45, delay: 0.2, hit: { dmg: 12, kb: 14, kbT: 0.35 }, after: 0.6, hitKind: "Suishōha" },
  ], [ L("hk_flood", "blast", ["blast_go"], { ground: true }), L("hk_waveup", "blast", ["blast_go"]), L("hk_wring", "blast", ["blast_go"], { play: "once" }) ], { cooldown: 9, dodge: { phase: "seal", back: 12 } }),
  mv(TO, 3, "tobirama-infinite-darkness", [
    { mech: "state", aim: 0.35, tell: 0.4, reach: 28, sight: 30, status: "blind", statusT: 5, dur: 1, hitKind: "Mugen Ankoku" },
  ], [ hand("hk_seal", ["seal", "aim", "tell"], { lift: 34 }), L("hk_dcone", "caster", ["tell"], { ground: true, rotate: true }), L("hk_ink", "target", ["state_go", "recover"]) ], { hitPop: "DUNKELHEIT", dodge: { phase: "tell", side: 12 } }),
  mv(TO, 4, "tobirama-raijin-no-ken", [
    { mech: "line", aim: 0.3, tell: 0.3, from: 1.4, len: 18, speed: 110, width: 1.5, hold: 0.25, fade: 0.2, hit: { dmg: 20, kb: 6, status: "stun", statusT: 1.5 }, hitKind: "Raijin no Ken" },
  ], [ hand("hk_hilt", ["seal", "aim", "tell"]), floorTell("hk_llane"), L("hk_lblade", "line", ["line_go"], { rotate: true, seg: 1.6, lift: 30 }), impact("hk_zap", { lift: 30 }) ], { range: 22 }),
  mv(MI, 1, "minato-hiraishin-nidan", [
    { mech: "shot", aim: 0.3, tell: 0.25, from: 1.5, speed: 60, radius: 1.4, reach: 30, hit: { dmg: 4 }, impact: 0.05, hitKind: "Hiraishin" },
    { mech: "blink", to: "marker", vanish: 0.12, strike: 3.4, hit: { dmg: 24, kb: 12 }, impact: 0.4, hitKind: "Hiraishin Nidan" },
  ], [ floorTell("hk_klane"), proj("hk_kunai", { lift: 30 }), L("hk_flash", "caster", ["blink_go"], { play: "once", lift: 30 }), impact("hk_ballhit", { lift: 30 }) ], { seal: 0.3, lock: 0.3, dodge: { phase: "tell", side: 8 } }),
  mv(MI, 2, "minato-rasengan", [
    { mech: "rush", aim: 0.25, tell: 0.25, speed: 60, reach: 2.4, reachMax: 32, hits: 1, hit: { dmg: 26, kb: 13 }, impact: 0.4, hitKind: "Rasengan" },
  ], [ hand("hk_ball", ["seal", "aim", "tell", "rush_go"], { lift: 28 }), floorTell("hk_lane"), impact("hk_ballhit", { lift: 30 }), impact("hk_ring") ], { seal: 0.35, lock: 0.35, shake: 1.4 }),
  mv(MI, 3, "minato-michi-shirube", [
    { mech: "rush", aim: 0.25, tell: 0.25, speed: 62, reach: 2.4, reachMax: 32, hits: 1, hit: { dmg: 6, kb: 10 }, impact: 0.5, hitKind: "Hiraishin-Siegel" },
    { mech: "blink", skipAim: true, to: "target", behind: 1.8, vanish: 0.12, strike: 3, hit: { dmg: 20, kb: 12 }, impact: 0.4, hitKind: "Hiraishin: Michi Shirube" },
  ], [ floorTell("hk_lane"), L("hk_mark", "target", ["impact", "blink_go"], { lift: 40 }), L("hk_flash", "caster", ["blink_go"], { play: "once", lift: 30 }), impact("hk_ballhit", { lift: 30 }) ], { seal: 0.3, lock: 0.3 }),
  reaperMove(MI, 4, "minato-shiki-fuujin"),
];

export const FX = {
  reaper: reaper(),
  ghostarm: { cw: 22, ch: 14, ox: 11, oy: 7, frames: 4, fps: 10, loop: true, draw(p, u) { for (let x = -11; x <= 11; x++) { const w = 3 + Math.sin(x / 4 + u * 6.28); for (let y = -w; y <= w; y++) p.blend(x, y, H("#e8e4f0"), 0.4); } } },
  soul: { cw: 50, ch: 70, ox: 25, oy: 64, frames: 6, fps: 10, loop: true, draw(p, u) { blendEllipse(p, 0, -34 - 6 * u, 14, 26, H("#c8f0ff"), 0.35); blendEllipse(p, 0, -50 - 6 * u, 8, 9, H("#e8ffff"), 0.5); } },
  sealmark: { cw: 70, ch: 70, ox: 35, oy: 35, frames: 8, fps: 12, draw(p, u) { const a = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; p.ring(0, 0, 24, 2, H("#2a1a3a"), a); for (let k = 0; k < 8; k++) { const ang = (k / 8) * 6.28; p.line(Math.cos(ang) * 10, Math.sin(ang) * 10, Math.cos(ang) * 22, Math.sin(ang) * 22, H("#2a1a3a"), a); } } },
  mouthfire: fireball({ r: 7 }),
  flane: lane({ len: px(32), w: Math.round(px(2.8)), c: "#ffd080", dark: "#6a2a10" }),
  fbody: band({ len: 24, w: 13, c: FIRE, a: 0.85 }),
  fhead: dragonHead({ c: FIRE, mouth: "#5a1008" }),
  embers: { cw: 50, ch: 50, ox: 25, oy: 40, frames: 7, fps: 14, draw(p, u) { for (let k = 0; k < 10; k++) { const a = -Math.PI * rnd(k), d = 20 * u * (0.5 + rnd(k + 1)); p.blend(Math.cos(a) * d, Math.sin(a) * d - 10 * u, H(FIRE[k % 3]), 1 - u); } } },
  one: shuriken({ r: 6 }),
  sfan: { ground: true, cw: Math.ceil(px(32)) + 8, ch: Math.ceil(px(32) * 0.75) + 10, ox: 2, oy: Math.ceil(px(32) * 0.37) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = -5; k <= 5; k++) { const a = k * 0.07; for (let x = 6; x <= px(32); x += 3) if (((x / 12 - u) % 1 + 1) % 1 < 0.35) p.blend(Math.cos(a) * x, Math.sin(a) * x, H("#c8ccd8"), 0.7); } } },
  star: shuriken({ r: 7 }),
  ting: spark({ R: 10, c: ["#ffffff", "#c8ccd8"] }),
  fireball: fireball({ r: 16 }),
  fburst: burst({ R: 30, c: FIRE, smoke: "#5a4a44" }),
  gust: { cw: 30, ch: 50, ox: 15, oy: 25, frames: 4, fps: 16, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const y = (k - 2.5) * 7; p.line(-14 + u * 8, y, 14 + u * 8, y + Math.sin(k + u * 6) * 3, H(k % 2 ? "#ffffff" : "#ffc080"), 0.6); } } },
  earthwall: { views: true, cw: 120, ch: 100, ox: 60, oy: 92, frames: 6, fps: 12, draw(p, u, i, view) { const k = Math.min(1, u * 2), h = 80 * k, side = view === "side"; const x0 = side ? 36 : 0, w = side ? 9 : 46; for (let y = 0; y >= -h; y--) for (let x = -w; x <= w; x++) { const c = Math.abs(x) > w - 3 || y < -h + 4 ? EARTH[2] : ((x * 5 + y * 3) % 11 === 0) ? EARTH[0] : EARTH[1]; p.blend(x0 + x, y + (view === "back" ? -8 : 8), H(c), view === "front" ? 0.55 : 0.97); } } },
  chips: { cw: 50, ch: 50, ox: 25, oy: 25, frames: 6, fps: 16, draw(p, u) { for (let k = 0; k < 8; k++) { const a = rnd(k) * 6.28, d = 18 * u; p.rect(Math.cos(a) * d - 1, Math.sin(a) * d - 1 + 12 * u * u, 3, 3, H(k % 2 ? "#8a7050" : "#c8b090")); } } },
  wseal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H("#c8e0c0"), 1 - ph); } } },
  tlane: lane({ len: px(30), w: Math.round(px(4.6)), c: WOOD[0], dark: WOOD[2] }),
  trees: { cw: 50, ch: 120, ox: 25, oy: 112, frames: 6, fps: 10, loop: true, draw(p, u, i) { for (let k = 0; k < 3; k++) { const x = (k - 1) * 14 + (rnd(k + i) - 0.5) * 4, h = 70 + 30 * rnd(k + 2); for (let y = 0; y >= -h; y--) { const w = 4 - y / h * 1.5; for (let dx = -w; dx <= w; dx++) p.blend(x + dx + Math.sin(y * 0.08 + k) * 3, y, H(Math.abs(dx) > w - 1 ? WOOD[2] : WOOD[1]), 0.97); } for (let b = 0; b < 3; b++) { const by = -h * (0.4 + b * 0.2); p.line(x, by, x + (b % 2 ? 12 : -12), by - 8, H(WOOD[1]), 0.95); } } } },
  roots: band({ len: 24, w: Math.round(px(4.6)), c: WOOD, a: 0.55 }),
  bound: wrap({ c: WOOD, h: 70, w: 16, rings: 5, a: 0.95 }),
  wooddome: { cw: 120, ch: 110, ox: 60, oy: 100, frames: 6, fps: 10, draw(p, u) { const k = Math.min(1, u * 2); for (let b = 0; b < 12; b++) { const a = (b / 12) * Math.PI; for (let t = 0; t <= 1; t += 0.02) { const x = Math.cos(a) * 44 * Math.sin(t * Math.PI) , y = -t * 90 * k * Math.sin(t * Math.PI * 0.5 + 0.3); for (let d = -2; d <= 2; d++) p.blend(x + d, y, H(Math.abs(d) > 1 ? WOOD[2] : WOOD[1]), 0.9); } } } },
  seal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H("#5a4a6a"), 1 - ph); } } },
  dcone: { ground: true, cw: Math.ceil(px(28)) + 8, ch: Math.ceil(px(28) * 1.6) + 10, ox: 2, oy: Math.ceil(px(28) * 0.8) + 5, frames: 4, fps: 8, loop: true, draw(p, u) { const t = Math.tan(0.6); for (let x = 4; x <= px(28); x++) { const w = x * t; for (let y = -w; y <= w; y += 1) p.blend(x, y, H("#0c0810"), 0.18 + 0.08 * Math.sin(x * 0.2 - u * 6.28)); } } },
  dark: { cw: 70, ch: 100, ox: 35, oy: 94, frames: 6, fps: 8, loop: true, draw(p, u) { for (let k = 0; k < 14; k++) { const a = (k / 14) * 6.28 + u * 2; blendDisc(p, Math.cos(a) * 18, -50 + Math.sin(a) * 30, 12, H("#0c0810"), 0.5); } blendEllipse(p, 0, -50, 16, 34, H("#0c0810"), 0.5); } },
  ink: { cw: 70, ch: 100, ox: 35, oy: 94, frames: 6, fps: 8, loop: true, draw(p, u) { for (let k = 0; k < 18; k++) { const ph = (u + rnd(k)) % 1, x = (rnd(k + 1) - 0.5) * 50; blendDisc(p, x * (1 - ph * 0.5), -10 - ph * 80, 8 * (1 - ph) + 4, H("#100c18"), 0.6); } } },
  lane: lane({ len: px(32), w: 8, c: "#e0f0ff", dark: "#30405a" }),
  blows: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 4, fps: 16, loop: true, draw(p, u, i) { for (let k = 0; k < 3; k++) { const a = rnd(k + i * 3) * 6.28; p.line(Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(a) * 20, Math.sin(a) * 20, H("#ffffff"), 0.9); } } },
  dust: burst({ R: 26, c: ["#e8dcc8", "#b8a888", "#8a7a5a"], smoke: "#8a7a5a", frames: 9 }),
  wlane: lane({ len: px(34), w: Math.round(px(3.2)), c: W[1], dark: W[2] }),
  wbody: band({ len: 26, w: 15, c: W, a: 0.82 }),
  whead: dragonHead({ c: W, s: 1.2 }),
  flood: pool({ R: Math.round(px(9)), c: [W[1], W[2]], bubbles: W[0], a: 0.5 }),
  waveup: { cw: Math.ceil(px(9) * 2.2), ch: 70, ox: Math.ceil(px(9) * 1.1), oy: 60, frames: 6, fps: 12, loop: true, draw(p, u) { const R = px(9); for (let k = 0; k < 30; k++) { const a = (k / 30) * 6.28, r = R * (0.5 + 0.5 * ((u + k * 0.03) % 1)); const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.3; for (let h = 0; h < 20 + 10 * Math.sin(u * 6.28 + k); h++) p.blend(x, y - h, H(h > 14 ? W[0] : W[1]), 0.7); } } },
  wring: shock({ R: Math.round(px(9)), c: W[0], edge: W[2] }),
  hilt: crackle({ R: 10, c: LT, bolts: 4, core: 3 }),
  llane: lane({ len: px(18), w: 4, c: LT[1], dark: "#203050" }),
  lblade: { cw: 16, ch: 12, ox: 8, oy: 6, frames: 3, fps: 18, loop: true, draw(p, u, i) { p.rect(-8, -1, 16, 2, H("#ffffff")); for (let k = 0; k < 2; k++) p.line(-8, (rnd(k + i) - 0.5) * 8, 8, (rnd(k + i + 3) - 0.5) * 8, H(LT[1]), 0.8); } },
  zap: crackle({ R: 24, c: LT, bolts: 8, core: 6 }),
  klane: lane({ len: px(30), w: 5, c: "#f0f0c0", dark: "#4a4a20" }),
  kunai: kunai({ c: "#b8c0cc" }),
  flash: { cw: 60, ch: 80, ox: 30, oy: 50, frames: 5, fps: 20, draw(p, u) { const a = 1 - u; blendEllipse(p, 0, 0, 8 + 20 * u, 30, H("#fff8c0"), 0.7 * a); for (let k = 0; k < 6; k++) p.line(0, 0, (rnd(k) - 0.5) * 50 * u, (rnd(k + 2) - 0.5) * 60 * u, H("#ffe060"), a); } },
  ball: orb({ r: 12 }),
  ballhit: burst({ R: 34, c: ["#ffffff", "#a8e0ff", "#3a8ae0"], smoke: "#5a6a8a", rays: 8 }),
  ring: shock({ R: 56, c: "#e8f0ff", edge: "#4a5a7a" }),
  mark: mark({ kind: "seal", c: ["#fff0a0", "#c8a020"], R: 8 }),
};
export const PREFIX = "hk_";

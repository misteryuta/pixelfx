// Shippuden fighters on the 2.5D stage (2026-11-27): Suigetsu, Jūgo, Sai, Yamato, Asuma, Chōji, Shizune, Anko,
// Sakura, Konohamaru, Ino.
// Suigetsu: 1 "Hydrification Water Gun" (Suiton: Mizudeppō, Manga 349): water shot from the fingertip: shot (two fast
//   bullets); 2 "Executioner's Blade: Great Cleave" (Kubikiribōchō, Manga 349): rush (a huge cut)
// Jūgo: 1 "Multiple Lotus Chakra Cannon" (Sage transformation: his arm a cannon, Manga 413): shot (a volley of chakra
//   bursts); 2 "Full Curse Mark Piston Punch" (Manga 413): the arm swells into a piston: rush (very hard)
// Sai: 1 "Ninja Art: Super Beast Imitating Drawing (Lions)" (Chōjū Giga, Manga 310): ink lions leap off the scroll and
//   hunt: shot (two homing lions); 2 "Sealing Technique: Tiger Vision Staring Bullet" (Fūinjutsu: Kōgan Nirami no
//   Tama? ink tiger that seals what it bites into the scroll): bind (ink) -> sealed
// Yamato: 1 "Wood Style: Four-Pillar Prison" (Mokuton: Shichūrō, Manga 289): a cage of wood rises round the target:
//   blast (a cage, held) ; 2 "Wood Locking Wall" (Mokujōheki, Manga 287): guard (full)
// Asuma: 1 "Fire Style: Burning Ash" (Katon: Haisekishō, Manga 312): ash breathed out, then set alight with a clack of
//   his teeth: zone (the ash, blinding) -> blast (it ignites)
// Chōji: 1 "Spiky Human Boulder" (Nikudan Hari Sensha, Manga 89 / Shippuden 66): rolled up, hair hardened into spikes:
//   rush (a rolling ball of spikes)
// Shizune: 1 "Ninja Art: Poison Fog" (Dokugiri, Manga 151): a poison cloud breathed out: zone
// Anko: 1 "Hidden Shadow Snake Hands" (Sen'eijashu, Manga 47): snakes from her sleeve bind and bite: bind
// Sakura: 1 "Cherry Blossom Impact" (Ōkashō, Manga 280): her chakra in her fist, the ground breaking: rush -> blast
// Konohamaru: 1 "Rasengan" (Manga 434 against Naraka Path): rush (a small Rasengan)
// Ino: 1 "Mind Transfer Jutsu" (Shintenshin, Manga 74): her mind leaves her body and takes the target's: state
//   (confused, single, she stands limp meanwhile)
import { lane, spark, burst, shock, comet, orb, fireball, band, pool, wrap, aura, mark, ring, dome, crescent, crackle, mist, poof, spikes, coneMark, cracks, slash, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const V = { sui: "shippuden/suigetsu-hozuki-hydrification", jug: "shippuden/jugo-sage-transformation", sai: "shippuden/sai-root-super-beast-imitating-drawing", yam: "shippuden/yamato-wood-style",
  asu: "shippuden/asuma-sarutobi-jonin", cho: "shippuden/choji-akimichi-chunin-pre-war", shz: "shippuden/shizune-medical-jonin", ank: "shippuden/anko-mitarashi-special-jonin",
  sak: "shippuden/sakura-haruno-chunin", kon: "shippuden/konohamaru-sarutobi-rasengan", ino: "shippuden/ino-yamanaka-chunin" };
const W = ["#f0faff", "#7ac8f0", "#2a6ab0"], INK = ["#3a3a4a", "#14141c", "#000000"], WOOD = ["#d8b888", "#9a7048", "#5a3a20"], FIRE = ["#fff6c0", "#ffb030", "#e0401a"], SN = ["#e8e0f0", "#9a8ab0", "#4a3a5a"];
const mv = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.4, recover: 0.4, range: 34, cone: 50, cooldown: 8, lock: 0.4, dodge: { phase: "tell", side: 7 },
  sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", line_go: "whoosh", shot_go: "whoosh", blast_go: "burst", bind_go: "whoosh", hold: "bite", guard_go: "rumble", buff_go: "rumble", zone_go: "rumble", state_go: "cast", blink_go: "whoosh", heal_go: "cast" }, stages, look, ...extra });
const rush = (o) => ({ mech: "rush", aim: 0.3, tell: 0.3, speed: 52, reach: 2.6, reachMax: 32, impact: 0.4, ...o });
export const MOVES = [
  mv(V.sui, 1, "suigetsu-mizudeppou", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 1.6, count: 2, spread: 6, gap: 0.15, speed: 72, radius: 1.5, reach: 34, hit: { dmg: 12, kb: 6 }, impact: 0.3, hitKind: "Suiton: Mizudeppō" }],
    [ hand("sl_finger", ["seal", "aim", "tell"]), floorTell("sl_wlane"), proj("sl_bullet", { lift: 30 }), impact("cm_splash", { lift: 30 }) ], { seal: 0.25, lock: 0.25 }),
  mv(V.sui, 2, "suigetsu-great-cleave", [rush({ speed: 50, reach: 4, stand: 3.2, hits: 1, hit: { dmg: 30, kb: 12 }, hitKind: "Kubikiribōchō" })],
    [ floorTell("sl_lane"), impact("sl_cleave", { lift: 34 }), impact("sl_cut") ], { shake: 1.6 }),
  mv(V.jug, 1, "jugo-lotus-cannon", [{ mech: "shot", aim: 0.35, tell: 0.4, from: 2.4, count: 3, spread: 10, gap: 0.18, speed: 48, radius: 2.2, reach: 34, burst: 3, hit: { dmg: 8, kb: 4 }, burstHit: { dmg: 6, kb: 6 }, impact: 0.4, hitKind: "Chakra-Kanone" }],
    [ hand("sl_cannon", ["seal", "aim", "tell", "shot_go"], { lift: 30, handF: 2 }), floorTell("sl_clane"), proj("sl_chakrashot", { lift: 30 }), impact("sl_cburst", { lift: 10 }) ], { seal: 0.6, lock: 0.6, cooldown: 10 }),
  mv(V.jug, 2, "jugo-piston", [rush({ speed: 54, hits: 1, hit: { dmg: 32, kb: 18, kbT: 0.45 }, hitKind: "Kolbenfaust" })],
    [ hand("sl_piston", ["seal", "aim", "tell", "rush_go"], { lift: 30, handF: 1.8 }), floorTell("sl_lane"), impact("cm_blunt", { lift: 30 }), impact("cm_slam") ], { seal: 0.5, lock: 0.5, shake: 2 }),
  mv(V.sai, 1, "sai-lions", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 2.2, count: 2, spread: 24, gap: 0.12, speed: 32, homing: 1.8, radius: 2.2, reach: 30, hit: { dmg: 14, kb: 8 }, impact: 0.4, hitKind: "Chōjū Giga" }],
    [ hand("sl_scroll", ["seal", "aim", "tell", "shot_go"], { lift: 28 }), L("sl_lion", "proj", null, { views: true, lift: 20 }), impact("sl_inksplat", { lift: 20 }) ], { seal: 0.5, lock: 0.5, dodge: { phase: "tell", back: 26 } }),
  mv(V.sai, 2, "sai-tiger-seal", [{ mech: "bind", aim: 0.35, tell: 0.35, speed: 28, steer: 2.5, radius: 2.4, reachMax: 30, hold: 1.4, crush: { dmg: 10, status: "seal", statusT: 8 }, crushKind: "Fūinjutsu", back: 30, hitKind: "Tuschetiger" }],
    [ hand("sl_scroll", ["seal", "aim", "tell", "bind_go", "hold"], { lift: 28 }), L("sl_inktrail", "link", ["bind_go", "hold", "retract"], { ground: true, rotate: true, seg: 2.2 }), L("sl_tiger", "tip", ["bind_go"], { views: true }), L("sl_inked", "grab", ["hold"]), impact("sl_sealmark", { lift: 40 }) ], { hitPop: "VERSIEGELT", dodge: { phase: "tell", back: 14 } }),
  mv(V.yam, 1, "yamato-shichuuro", [{ mech: "blast", aim: 0.35, tell: 0.45, radius: 4, delay: 0.25, hit: { dmg: 8, status: "stun", statusT: 3 }, after: 1.2, hitKind: "Mokuton: Shichūrō" }],
    [ hand("sl_wseal", ["seal", "aim", "tell"], { lift: 34 }), aimRing("sl_cring", ["tell"]), L("sl_cage", "blast", ["blast_go"], { play: "hold" }) ], { hitPop: "GEFANGEN", dodge: { phase: "tell", side: 8 } }),
  mv(V.yam, 2, "yamato-mokujouheki", [{ mech: "guard", mode: "full", radius: 4.4, dur: 4, hitKind: "Mokujōheki" }],
    [ atCaster("sl_wooddome", ["guard_go"]), L("sl_chips", "block", ["guard_go"], { play: "once", lift: 30 }) ], { cooldown: 11 }),
  mv(V.asu, 1, "asuma-haisekishou", [
    { mech: "zone", aim: 0.35, tell: 0.4, radius: 6.5, dur: 1.4, dot: 2, status: "blind", hitKind: "Haisekishō" },
    { mech: "blast", skipAim: true, at: "zone", radius: 6.5, hit: { dmg: 24, kb: 8, status: "burn", statusT: 3 }, after: 0.7, hitKind: "Katon: Haisekishō" },
  ], [ hand("sl_ashmouth", ["seal", "aim", "tell", "zone_go"], { lift: 50, handF: 0.9 }), aimRing("sl_aring", ["tell"]), L("sl_ash", "zone", ["zone_go"]), L("sl_ignite", "zone", ["blast_go"], { play: "once" }), L("sl_scorch", "zone", ["blast_go"], { ground: true }) ], { seal: 0.5, lock: 0.5, cooldown: 11, dodge: { phase: "tell", back: 12 } }),
  mv(V.cho, 1, "choji-spiky-boulder", [rush({ speed: 44, reach: 3.6, hits: 3, combo: 0.6, hit: { dmg: 7, kb: 2 }, finish: { dmg: 14, kb: 16 }, hitKind: "Nikudan Hari Sensha" })],
    [ L("sl_boulder", "caster", ["seal", "aim", "tell", "rush_go", "combo"], { views: true }), floorTell("sl_blane"), L("sl_rolldust", "caster", ["rush_go"], { rotate: true }), impact("cm_slam") ], { seal: 0.6, lock: 0.6, shake: 1.8 }),
  mv(V.shz, 1, "shizune-dokugiri", [{ mech: "zone", aim: 0.35, tell: 0.4, radius: 6, dur: 4, dot: 7, status: "slow", hitKind: "Dokugiri" }],
    [ hand("sl_poismouth", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), aimRing("sl_pring", ["tell"]), L("sl_poison", "zone", ["zone_go"]), L("sl_pfloor", "zone", ["zone_go"], { ground: true }) ], { cooldown: 10, dodge: { phase: "tell", back: 12 } }),
  mv(V.ank, 1, "anko-senei-jashu", [{ mech: "bind", aim: 0.3, tell: 0.3, speed: 34, steer: 3, radius: 2, reachMax: 26, hold: 1.8, dot: 6, crush: { dmg: 6, status: "slow", statusT: 2 }, back: 40, hitKind: "Sen'eijashu" }],
    [ hand("sl_sleeve", ["aim", "tell"]), L("sl_snake", "link", ["bind_go", "hold", "retract"], { rotate: true, seg: 2, lift: 26 }), L("sl_snakehead", "tip", ["bind_go"], { lift: 26 }), L("sl_coil", "grab", ["hold"]) ], { range: 28, dodge: { phase: "tell", back: 12 } }),
  mv(V.sak, 1, "sakura-oukashou", [
    rush({ speed: 46, hits: 1, hit: { dmg: 10, kb: 2 }, impact: 0.05, hitKind: "Ōkashō" }),
    { mech: "blast", at: "self", skipAim: true, radius: 6, hit: { dmg: 18, kb: 14 }, after: 0.6, hitKind: "Ōkashō" },
  ], [ hand("sl_fist", ["seal", "aim", "tell", "rush_go"], { lift: 30 }), floorTell("sl_lane"), L("sl_quake", "blast", ["blast_go"], { ground: true }), L("sl_rocks", "blast", ["blast_go"], { play: "once" }), L("sl_petals", "blast", ["blast_go"], { play: "once" }) ], { shake: 2 }),
  mv(V.kon, 1, "konohamaru-rasengan", [rush({ speed: 46, reach: 2.2, hits: 1, hit: { dmg: 20, kb: 10 }, hitKind: "Rasengan" })],
    [ hand("sl_smallball", ["seal", "aim", "tell", "rush_go"], { lift: 26 }), floorTell("sl_lane"), impact("sl_ballhit", { lift: 28 }) ], { seal: 0.5, lock: 0.5 }),
  mv(V.ino, 1, "ino-shintenshin", [{ mech: "state", aim: 0.45, tell: 0.4, reach: 26, sight: 12, single: true, status: "confuse", statusT: 6, dur: 1.4, hitKind: "Shintenshin" }],
    [ hand("sl_sign", ["seal", "aim", "tell"], { lift: 44, handF: 0.8 }), L("sl_aimline", "caster", ["tell"], { ground: true, rotate: true }), L("sl_mind", "target", ["state_go", "recover"], { lift: 76 }), atCaster("sl_limp", ["state_go"]) ], { hitPop: "GEIST ÜBERNOMMEN", dodge: { phase: "tell", side: 8 }, cooldown: 11 }),
];

// an ink lion (Sai) / ink tiger: side (leaping +x), front, back
function inkBeast(p, u, view, tiger) {
  const c1 = H(INK[0]), c2 = H(INK[1]);
  if (view === "side") { blendEllipse(p, -4, 0, 16, 8, c2, 0.95); blendDisc(p, 12, -6, 8, c2, 0.95); for (let k = 0; k < 8; k++) p.line(8, -6, 4 + (rnd(k) - 0.5) * 18, -14 + (rnd(k + 2) - 0.5) * 12, c1); for (let k = 0; k < 4; k++) p.line(-12 + k * 7, 6, -14 + k * 7 + (k % 2 ? 4 : -4) * Math.sin(u * 6.28), 14, c2); p.line(-18, -2, -28, -10 + 4 * Math.sin(u * 6.28), c2); p.dot(15, -8, H("#ffffff")); if (tiger) for (let k = 0; k < 4; k++) p.line(-12 + k * 6, -6, -10 + k * 6, 4, H("#5a5a6a")); }
  else { blendDisc(p, 0, -4, 11, c2, 0.95); for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28; p.line(Math.cos(a) * 8, -4 + Math.sin(a) * 8, Math.cos(a) * 15, -4 + Math.sin(a) * 15, c1); } if (view === "front") { p.dot(-4, -6, H("#ffffff")); p.dot(4, -6, H("#ffffff")); } }
}
export const FX = {
  finger: { cw: 24, ch: 24, ox: 12, oy: 12, frames: 4, fps: 12, loop: true, draw(p, u) { blendDisc(p, 0, 0, 3 + u, H(W[1]), 0.8); } },
  wlane: lane({ len: px(34), w: 4, c: W[1], dark: W[2] }),
  bullet: comet({ len: 26, r: 4, c: W, kind: "water" }),
  splash: burst({ R: 18, c: W, smoke: "#c8d8e8", frames: 7 }),
  lane: lane({ len: px(32), w: 8, c: "#f0f0e8", dark: "#4a4a3a" }),
  cleave: slash({ R: 40, w: 9, c: ["#ffffff", "#c8ccd8"], a0: -2.4, a1: 0.9 }),
  cut: spark({ R: 16, c: ["#ffffff", "#c8ccd8"] }),
  cannon: { cw: 40, ch: 30, ox: 6, oy: 15, frames: 4, fps: 12, loop: true, draw(p, u) { for (let x = 0; x < 22; x++) { const w = 5 + (x > 16 ? 2 : 0); for (let y = -w; y <= w; y++) p.blend(x, y, H(Math.abs(y) > w - 1 ? "#5a3a2a" : "#a87a5a"), 0.95); } blendDisc(p, 24, 0, 3 + 2 * u, H("#ffe0a0"), 0.9); } },
  clane: lane({ len: px(34), w: 6, c: "#ffe0a0", dark: "#6a4a20" }),
  chakrashot: comet({ len: 30, r: 6, c: ["#ffffff", "#ffe0a0", "#e0a040"] }),
  cburst: burst({ R: 20, c: ["#ffffff", "#ffe0a0", "#e0a040"], smoke: "#8a6a4a", frames: 8 }),
  piston: { cw: 50, ch: 40, ox: 6, oy: 20, frames: 4, fps: 12, loop: true, draw(p, u) { for (let x = 0; x < 30; x++) { const w = 7 + Math.sin(x * 0.3) * 2; for (let y = -w; y <= w; y++) p.blend(x, y, H(Math.abs(y) > w - 1 ? "#3a2a2a" : "#7a5a4a"), 0.95); } for (let k = 0; k < 3; k++) blendDisc(p, -2 - k * 4, (k - 1) * 6, 3, H("#e8e8e8"), 0.6 * (1 - u)); } },
  pburst: burst({ R: 36, c: ["#ffffff", "#ffd0a0", "#a06040"], smoke: "#6a4a3a", rays: 8, frames: 10 }),
  crater: cracks({ R: 40, c: "#2a2018" }),
  scroll: { cw: 40, ch: 20, ox: 20, oy: 10, frames: 4, fps: 10, loop: true, draw(p, u) { p.rect(-16, -4, 32, 8, H("#f0ece0")); for (let k = 0; k < 4; k++) p.line(-12 + k * 7, -2, -9 + k * 7, 2, H("#14141c")); } },
  lion: { views: true, cw: 70, ch: 50, ox: 35, oy: 30, frames: 4, fps: 12, loop: true, draw(p, u, i, view) { inkBeast(p, u, view, false); } },
  inksplat: { cw: 50, ch: 50, ox: 25, oy: 25, frames: 6, fps: 14, draw(p, u) { for (let k = 0; k < 14; k++) { const a = rnd(k) * 6.28, d = 20 * u * (0.5 + rnd(k + 1)); blendDisc(p, Math.cos(a) * d, Math.sin(a) * d, 2.5, H(INK[1]), 1 - u); } } },
  inktrail: { ground: true, cw: 22, ch: 14, ox: 11, oy: 7, frames: 1, fps: 1, draw(p) { for (let x = -10; x <= 10; x++) p.blend(x, Math.sin(x * 0.4) * 2, H(INK[1]), 0.8); } },
  tiger: { views: true, cw: 70, ch: 50, ox: 35, oy: 44, frames: 4, fps: 12, loop: true, draw(p, u, i, view) { p.place(35, 30, false); inkBeast(p, u, view, true); p.place(35, 44, false); } },
  inked: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 4, fps: 8, loop: true, draw(p, u, i) { for (let k = 0; k < 24; k++) { const y = -80 * rnd(k + i); p.line(-14, y, 14, y + (rnd(k) - 0.5) * 6, H(INK[k % 2]), 0.7); } } },
  sealmark: { cw: 70, ch: 70, ox: 35, oy: 35, frames: 8, fps: 12, draw(p, u) { const a = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; p.rect(-16, -10, 32, 20, H("#f0ece0"), a * 0.9); for (let k = 0; k < 5; k++) p.line(-12 + k * 6, -6, -10 + k * 6, 6, H(INK[1]), a); } },
  wseal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H("#c8e0c0"), 1 - ph); } } },
  cring: ring({ R: Math.round(px(4)), c: WOOD[0], dark: WOOD[2] }),
  cage: { cw: 100, ch: 120, ox: 50, oy: 110, frames: 8, fps: 12, draw(p, u) { const k = Math.min(1, u * 2), h = 100 * k; for (let b = 0; b < 8; b++) { const a = (b / 8) * 6.28, x = Math.cos(a) * 34, y = Math.sin(a) * 10; for (let yy = 0; yy >= -h; yy--) for (let d = -2; d <= 2; d++) p.blend(x + d, y + yy, H(Math.abs(d) > 1 ? WOOD[2] : WOOD[1]), Math.sin(a) > 0 ? 0.95 : 0.6); } if (k >= 1) for (let t = 0; t < 6.28; t += 0.03) p.blend(Math.cos(t) * 34, -h + Math.sin(t) * 10, H(WOOD[2]), 0.95); } },
  wooddome: { cw: 120, ch: 110, ox: 60, oy: 100, frames: 6, fps: 10, draw(p, u) { const k = Math.min(1, u * 2); for (let b = 0; b < 12; b++) { const a = (b / 12) * Math.PI; for (let t = 0; t <= 1; t += 0.02) { const x = Math.cos(a) * 44 * Math.sin(t * Math.PI), y = -t * 90 * k * Math.sin(t * Math.PI * 0.5 + 0.3); for (let d = -2; d <= 2; d++) p.blend(x + d, y, H(Math.abs(d) > 1 ? WOOD[2] : WOOD[1]), 0.9); } } } },
  chips: { cw: 50, ch: 50, ox: 25, oy: 25, frames: 6, fps: 16, draw(p, u) { for (let k = 0; k < 8; k++) { const a = rnd(k) * 6.28, d = 18 * u; p.rect(Math.cos(a) * d - 1, Math.sin(a) * d - 1 + 12 * u * u, 3, 3, H(k % 2 ? WOOD[1] : WOOD[0])); } } },
  ashmouth: { cw: 30, ch: 30, ox: 15, oy: 20, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 5; k++) { const ph = (u + k / 5) % 1; blendDisc(p, (rnd(k) - 0.5) * 10 + ph * 8, -ph * 14, 3, H("#5a5a5a"), 0.7 * (1 - ph)); } } },
  aring: ring({ R: Math.round(px(6.5)), c: "#8a8a8a", dark: "#2a2a2a" }),
  ash: mist({ R: Math.round(px(6.5)), c: ["#6a6a6a", "#4a4a4a"], a: 0.6, n: 20 }),
  ignite: burst({ R: Math.round(px(6.5)), c: FIRE, smoke: "#3a3030", rays: 10, frames: 11 }),
  scorch: pool({ R: Math.round(px(6.5)), c: ["#2a2420", "#1a1410"], bubbles: "#ffb030", a: 0.45 }),
  boulder: { views: true, cw: 80, ch: 80, ox: 40, oy: 74, frames: 4, fps: 16, loop: true, draw(p, u, i, view) { blendDisc(p, 0, -32, 28, H("#c86a3a"), 1); blendDisc(p, -6, -38, 18, H("#e08a4a"), 1); for (let k = 0; k < 20; k++) { const a = (k / 20) * 6.28 + (view === "side" ? u * 6.28 : 0); p.line(Math.cos(a) * 26, -32 + Math.sin(a) * 26, Math.cos(a) * 36, -32 + Math.sin(a) * 36, H("#5a2a1a")); } } },
  blane: lane({ len: px(32), w: Math.round(px(3)), c: "#f0d0b0", dark: "#5a2a1a" }),
  rolldust: { cw: 120, ch: 50, ox: 110, oy: 46, frames: 4, fps: 14, loop: true, draw(p, u) { for (let k = 0; k < 8; k++) { const ph = (u + rnd(k)) % 1; blendDisc(p, -ph * 100, -6 - ph * 10, 4 + 8 * ph, H("#c8b898"), 0.5 * (1 - ph)); } } },
  poismouth: { cw: 30, ch: 30, ox: 15, oy: 20, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 5; k++) { const ph = (u + k / 5) % 1; blendDisc(p, (rnd(k) - 0.5) * 10 + ph * 8, -ph * 14, 3, H("#a060c0"), 0.7 * (1 - ph)); } } },
  pring: ring({ R: Math.round(px(6)), c: "#c080e0", dark: "#3a1050" }),
  poison: mist({ R: Math.round(px(6)), c: ["#c8a0e0", "#9a6ac0"], a: 0.5, n: 18 }),
  pfloor: pool({ R: Math.round(px(6)), c: ["#7a4a9a", "#4a2a6a"], bubbles: "#c8a0e0", a: 0.35 }),
  sleeve: { cw: 24, ch: 20, ox: 12, oy: 10, frames: 4, fps: 10, loop: true, draw(p, u) { blendDisc(p, Math.sin(u * 6.28) * 2, Math.cos(u * 6.28) * 3, 2.5, H(SN[1]), 0.9); } },
  snake: { cw: 20, ch: 14, ox: 10, oy: 7, frames: 4, fps: 12, loop: true, draw(p, u) { for (let x = -10; x <= 10; x++) { const y = Math.sin(x / 3 + u * 6.28) * 2.5; blendDisc(p, x, y, 2.2, H(SN[2]), 1); p.blend(x, y - 1, H(SN[1]), 1); } } },
  snakehead: { cw: 30, ch: 22, ox: 15, oy: 11, frames: 4, fps: 12, loop: true, draw(p, u) { blendEllipse(p, -2, 0, 9, 6, H(SN[2]), 1); blendEllipse(p, -1, -1, 7, 4, H(SN[1]), 1); for (let x = 3; x <= 11; x++) { p.blend(x, -2, H(SN[1]), 1); p.blend(x, 2 + (x - 3) * 0.3 * Math.sin(u * 6.28), H(SN[1]), 1); } } },
  coil: wrap({ c: [SN[1], SN[2], SN[0]], h: 60, w: 15, rings: 3, a: 0.95 }),
  fist: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 12, loop: true, draw(p, u) { blendDisc(p, 0, 0, 5 + 2 * u, H("#80f0a0"), 0.6); blendDisc(p, 0, 0, 3, H("#e0fff0"), 0.9); } },
  quake: cracks({ R: Math.round(px(6)), c: "#2a2018", n: 22 }),
  rocks: { cw: 180, ch: 120, ox: 90, oy: 110, frames: 10, fps: 16, draw(p, u) { for (let k = 0; k < 18; k++) { const a = -Math.PI * (0.1 + 0.8 * rnd(k)), v = 70 + 50 * rnd(k + 3), x = Math.cos(a) * v * u, y = Math.sin(a) * v * u * 1.2 + 120 * u * u; if (y < 2) p.rect(x - 4, y - 3, 8, 6, H(k % 2 ? "#8a7a5a" : "#b8a888")); } } },
  petals: { cw: 120, ch: 100, ox: 60, oy: 90, frames: 9, fps: 14, draw(p, u) { for (let k = 0; k < 16; k++) { const a = -Math.PI * rnd(k), d = 50 * u * (0.5 + rnd(k + 1)); blendEllipse(p, Math.cos(a) * d, -10 + Math.sin(a) * d, 2.5, 1.5, H(k % 2 ? "#f8c0d0" : "#f090b0"), 1 - u); } } },
  smallball: orb({ r: 9 }),
  ballhit: burst({ R: 26, c: ["#ffffff", "#a8e0ff", "#3a8ae0"], smoke: "#5a6a8a", rays: 6, frames: 8 }),
  sign: { cw: 24, ch: 24, ox: 12, oy: 12, frames: 4, fps: 10, loop: true, draw(p, u) { p.rect(-5, -5, 10, 10, H("#f0c8f0"), 0.4 + 0.3 * u); } },
  aimline: lane({ len: px(26), w: 3, c: "#f0c8f0", dark: "#5a2a5a" }),
  mind: mark({ kind: "spiral", c: ["#ffffff", "#c880e0"], R: 9 }),
  limp: { cw: 40, ch: 30, ox: 20, oy: 10, frames: 4, fps: 4, loop: true, draw(p, u) { p.text?.("", 0, 0, H("#ffffff")); for (let k = 0; k < 3; k++) p.dot(-6 + k * 6, -2 - u * 4, H("#c8c8f0")); } },
};
export const PREFIX = "sl_";

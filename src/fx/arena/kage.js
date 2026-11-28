// Kage and clan leaders on the 2.5D stage (2026-11-27): Madara (flashback; his Kurama is a summon), Ōnoki, A, Mei,
// Darui, Danzō, Shisui.
// Madara: 1 "Perfect Susanoo" (Manga 560 / 620): the full Susanoo stands up round him and its sword cuts SIDEWAYS
//   across the space in front; a wave runs over the ground from where it struck. Not at ultimate strength (one cut,
//   his one Susanoo move). blast (a wide sideways arc in front) -> line (the ground wave); 2 "Majestic Destroyer Flame"
//   (Katon: Gōka Mekkyaku, Manga 560): a wall of fire as wide as a battlefield: line (very wide fire); 4 "Gunbai
//   Reflection" (Uchiwa, Manga 560): the war fan takes an attack in and sends it back: guard (reflect, in front)
// Ōnoki: 1 "Particle Style: Atomic Dismantling" (Jinton: Genkai Hakuri, Manga 471): a white box that takes apart all
//   inside it at the atom: blast (the box, a long tell); 2 "Light-Weight Rock (Flight)" (Keijūgan, Manga 471): made
//   light, he flies over and comes down: rush (leap, high, light); 3 "Added-Weight Rock" (Kajūgan, Manga 463): a touch
//   that makes the target heavy: rush (touch) -> slowed; 4 "Rock Clone" (Iwa Bunshin, Manga 463): guard (swap)
// A (Fourth Raikage, Lightning armour): 1 "Liger Bomb" (Raigā Bomu, Manga 469): caught, lifted and driven head-first
//   into the ground: rush (combo) -> crater; 2 "Guillotine Drop" (Manga 469): a leg drop from above: rush (leap);
//   3 "Lightning Straight" (Raiton: a straight punch at full speed): rush (very fast); 4 "Body Flicker Blitz" (Shunshin,
//   faster than the eye, Manga 466): blink (behind) and a blow
// Mei: 1 "Boil Release: Skilled Mist" (Futton: Kōmu, Manga 465): an acid mist that melts: zone; 2 "Lava Release:
//   Melting Apparition" (Yōton: Yōkai, Manga 465): lava spat in a stream: line; 3 "Water Dragon Pillar" (a column of
//   water bursting up under the target): blast
// Darui: 1 "Storm Release: Laser Circus" (Ranton: Reizā Sākasu, Manga 461): beams that bend toward their targets:
//   shot (homing beams); 2 "Water Style: Water Wall" (Suijinheki, Manga 466): guard (full)
// Danzō: 1 "Izanagi Reality Rewrite" (Manga 479): a Sharingan on his arm closes, what happened to him did not happen:
//   guard (phase) -> heal; 2 "Wind Style: Vacuum Great Sphere" (Fūton: Shinkū Renpa / Shinkūgyoku, Manga 478):
//   bullets of compressed air from the mouth: shot
// Shisui: 1 "Kotoamatsukami" (Manga 590): a genjutsu that changes the target's will without its knowing: state
//   (confused, single); 2 "Body Flicker Afterimage Clones" (Shunshin no Shisui, Manga 590): so fast he leaves
//   afterimages that strike: clones (afterimages); 3 "Fire Style: Great Fireball" (Gōkakyū): shot (a big fireball)
import { lane, spark, burst, shock, comet, orb, fireball, band, pool, wrap, aura, mark, ring, dome, crescent, crackle, mist, poof, spikes, coneMark, cracks, speed, slash, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const V = { mad: "shippuden/madara-uchiha-uchiha-clan-leader-flashback", oni: "shippuden/onoki-third-tsuchikage", a: "shippuden/a-fourth-raikage-lightning-mode", mei: "shippuden/mei-terumi-fifth-mizukage",
  dar: "shippuden/darui-kage-summit-bodyguard", dan: "shippuden/danzo-shimura-izanagi-sharingan-arm", shi: "shippuden/shisui-uchiha-body-flicker-flashback" };
const FIRE = ["#fff6c0", "#ffb030", "#e0401a"], W = ["#f0faff", "#7ac8f0", "#2a6ab0"], LT = ["#ffffff", "#9ad8ff", "#3a70e8"], SUS = ["#e8f0ff", "#6a8ae8", "#2a3aa0"], LAVA = ["#fff0a0", "#ff8a30", "#a02010"], ACID = ["#f0ffd0", "#c8e070", "#7a9030"];
const mv = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.4, recover: 0.4, range: 34, cone: 50, cooldown: 8, lock: 0.4, dodge: { phase: "tell", side: 7 },
  sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", line_go: "whoosh", shot_go: "whoosh", blast_go: "burst", bind_go: "whoosh", hold: "bite", guard_go: "rumble", buff_go: "rumble", zone_go: "rumble", state_go: "cast", blink_go: "whoosh", heal_go: "cast" }, stages, look, ...extra });
const rush = (o) => ({ mech: "rush", aim: 0.3, tell: 0.3, speed: 56, reach: 2.6, reachMax: 32, impact: 0.4, ...o });
export const MOVES = [
  mv(V.mad, 1, "madara-perfect-susanoo", [
    { mech: "blast", at: "self", aim: 0.5, tell: 0.55, radius: 16, coneHalf: 70, hit: { dmg: 30, kb: 14, kbT: 0.4 }, after: 0.35, hitKind: "Susanoo-Schwert" },
    { mech: "line", skipAim: true, from: 6, len: 26, speed: 46, width: 3, hold: 0.2, fade: 0.4, hit: { dmg: 10, kb: 8 }, hitKind: "Bodenwelle" },
  ], [ L("kg_susanoo", "caster", ["seal", "aim", "tell", "blast_go", "line_go", "retract"], { views: true, depth: -1 }), L("kg_arc", "caster", ["tell"], { ground: true, rotate: true }), L("kg_sidecut", "blast", ["blast_go"], { views: true, play: "once" }), L("kg_groundwave", "line", ["line_go", "retract"], { ground: true, rotate: true, seg: 3 }) ],
    { seal: 0.9, lock: 0.9, cooldown: 14, shake: 2.2, dodge: { phase: "tell", back: 26 } }),
  mv(V.mad, 2, "madara-gouka-mekkyaku", [{ mech: "line", aim: 0.4, tell: 0.5, from: 2.5, len: 32, speed: 26, width: 7, hold: 0.6, fade: 0.5, dot: 30, hit: { status: "burn", statusT: 3, kb: 6 }, hitKind: "Katon: Gōka Mekkyaku" }],
    [ hand("kg_mouthfire", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), floorTell("kg_wlane"), L("kg_wall", "line", ["line_go"], { rotate: true, seg: 3.6, lift: 0 }), L("kg_scorch", "line", ["line_go", "retract"], { ground: true, rotate: true, seg: 3.6 }) ],
    { seal: 0.6, lock: 0.6, cooldown: 12, dodge: { phase: "tell", side: 16 } }),
  mv(V.mad, 4, "madara-gunbai", [{ mech: "guard", mode: "reflect", arc: 80, radius: 4.4, dur: 3, hitKind: "Uchiwa" }],
    [ L("kg_gunbai", "caster", ["guard_go"], { views: true }), L("kg_absorb", "block", ["guard_go"], { play: "once", lift: 34 }) ], { seal: 0.25, lock: 0.25, cooldown: 10 }),
  mv(V.oni, 1, "onoki-jinton", [{ mech: "blast", aim: 0.5, tell: 0.6, radius: 3.6, delay: 0.3, hit: { dmg: 40, kb: 0 }, after: 0.8, hitKind: "Jinton: Genkai Hakuri" }],
    [ hand("kg_jincube", ["seal", "aim", "tell"], { lift: 34, handF: 1.6 }), L("kg_jinbeam", "aim", ["tell"], { lift: 34 }), aimRing("kg_jring", ["aim", "tell"]), L("kg_jinbox", "blast", ["blast_go"], { play: "once" }) ],
    { seal: 0.6, lock: 0.6, cooldown: 13, hitPop: "ZERLEGT" }),
  mv(V.oni, 2, "onoki-keijuugan", [rush({ leap: true, air: 0.9, height: 16, radius: 3.4, hit: { dmg: 8, kb: 8 }, impact: 0.3, hitKind: "Keijūgan" })],
    [ atCaster("kg_light", ["rush_go"]), aimRing("kg_lring"), L("kg_shadow", "land", ["rush_go"], { ground: true }), impact("kg_puff") ], { dodge: { phase: "tell", side: 9 } }),
  mv(V.oni, 3, "onoki-kajuugan", [rush({ speed: 40, reach: 2.2, hits: 1, hit: { dmg: 10, kb: 0, status: "slow", statusT: 6 }, hitKind: "Kajūgan" })],
    [ hand("kg_heavy", ["seal", "aim", "tell", "rush_go"]), floorTell("kg_lane"), L("kg_sink", "grab", ["combo", "impact"]), impact("kg_crack") ], { hitPop: "SCHWER" }),
  mv(V.oni, 4, "onoki-iwa-bunshin", [{ mech: "guard", mode: "swap", radius: 3, swap: 6, dur: 3.5, hitKind: "Iwa Bunshin" }],
    [ atCaster("kg_rockpuff", ["guard_go"], { play: "once" }), L("kg_rockclone", "swap", ["guard_go"], { play: "hold" }) ], { seal: 0.3, lock: 0.3, cooldown: 10 }),
  mv(V.a, 1, "a-liger-bomb", [rush({ speed: 70, hits: 2, combo: 0.7, hit: { dmg: 6 }, finish: { dmg: 30, kb: 4, status: "stun", statusT: 1.2 }, hitKind: "Liger Bomb" })],
    [ atCaster("kg_armor", ["seal", "aim", "tell", "rush_go", "combo", "impact"]), floorTell("kg_alane"), L("kg_atrail", "caster", ["rush_go"], { rotate: true, lift: 8 }), impact("cm_slam"), impact("cm_zap", { lift: 20 }) ], { shake: 2.2 }),
  mv(V.a, 2, "a-guillotine-drop", [rush({ leap: true, air: 0.6, height: 13, radius: 4, hit: { dmg: 32, kb: 6, status: "stun", statusT: 1 }, impact: 0.45, hitKind: "Guillotine Drop" })],
    [ atCaster("kg_armor", ["seal", "aim", "tell", "rush_go", "impact"]), aimRing("kg_aring"), L("kg_shadow", "land", ["rush_go"], { ground: true }), impact("cm_slam"), impact("cm_zap", { lift: 10 }) ], { shake: 2.2, dodge: { phase: "tell", side: 9 } }),
  mv(V.a, 3, "a-lightning-straight", [rush({ speed: 95, hits: 1, hit: { dmg: 26, kb: 16, kbT: 0.35 }, hitKind: "Lightning Straight" })],
    [ atCaster("kg_armor", ["seal", "aim", "tell", "rush_go"]), floorTell("kg_alane"), L("kg_atrail", "caster", ["rush_go"], { rotate: true, lift: 8 }), impact("cm_zap", { lift: 30 }) ], { seal: 0.25, lock: 0.25 }),
  mv(V.a, 4, "a-shunshin", [{ mech: "blink", aim: 0.2, tell: 0.2, to: "behind", behind: 2.4, vanish: 0.08, strike: 3.2, hit: { dmg: 18, kb: 10 }, impact: 0.4, hitKind: "Shunshin" }],
    [ atCaster("kg_armor", ["seal", "aim", "tell", "blink_go", "impact"]), L("kg_streak", "caster", ["blink_go", "impact"], { rotate: true, lift: 30, play: "once" }), impact("cm_zap", { lift: 30 }) ], { seal: 0.2, lock: 0.2 }),
  mv(V.mei, 1, "mei-koumu", [{ mech: "zone", aim: 0.4, tell: 0.45, radius: 7, dur: 4, dot: 7, status: "slow", hitKind: "Futton: Kōmu" }],
    [ hand("kg_steam", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), aimRing("kg_mring", ["tell"]), L("kg_acid", "zone", ["zone_go"]), L("kg_acidfloor", "zone", ["zone_go"], { ground: true }) ], { seal: 0.5, lock: 0.5, cooldown: 11, dodge: { phase: "tell", back: 12 } }),
  mv(V.mei, 2, "mei-youkai", [{ mech: "line", aim: 0.35, tell: 0.4, from: 2, len: 28, speed: 30, width: 3.4, hold: 0.6, fade: 0.5, dot: 30, hit: { status: "burn", statusT: 3, kb: 4 }, hitKind: "Yōton: Yōkai" }],
    [ hand("kg_lavamouth", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), floorTell("kg_llane"), L("kg_lava", "line", ["line_go"], { rotate: true, seg: 2.8, lift: 14 }), L("kg_lavafloor", "line", ["line_go", "retract"], { ground: true, rotate: true, seg: 2.8 }) ], { seal: 0.5, lock: 0.5, cooldown: 10, dodge: { phase: "tell", side: 9 } }),
  mv(V.mei, 3, "mei-water-pillar", [{ mech: "blast", aim: 0.35, tell: 0.45, radius: 4, delay: 0.2, hit: { dmg: 22, kb: 8, status: "stun", statusT: 0.8 }, after: 0.7, hitKind: "Wasserdrachensäule" }],
    [ hand("kg_wseal", ["seal", "aim", "tell"], { lift: 34 }), aimRing("kg_wring", ["tell"]), L("kg_pillar", "blast", ["blast_go"], { play: "once" }), L("kg_wfloor", "blast", ["blast_go"], { ground: true }) ], { dodge: { phase: "tell", side: 8 } }),
  mv(V.dar, 1, "darui-laser-circus", [{ mech: "shot", aim: 0.35, tell: 0.35, from: 1.6, count: 7, spread: 80, gap: 0.03, speed: 50, homing: 3.2, radius: 1.6, reach: 40, hit: { dmg: 6, kb: 2 }, impact: 0.4, hitKind: "Ranton: Reizā Sākasu" }],
    [ hand("kg_dark", ["seal", "aim", "tell"], { lift: 34 }), proj("kg_laser", { lift: 30 }), impact("kg_beamhit", { lift: 30 }) ], { seal: 0.6, lock: 0.6, cooldown: 10, dodge: { phase: "tell", back: 22 } }),
  mv(V.dar, 2, "darui-suijinheki", [{ mech: "guard", mode: "full", radius: 4.4, dur: 3.5, hitKind: "Suijinheki" }],
    [ atCaster("kg_waterwall", ["guard_go"]), L("kg_splash", "block", ["guard_go"], { play: "once", lift: 30 }) ], { seal: 0.4, lock: 0.4, cooldown: 10 }),
  mv(V.dan, 1, "danzo-izanagi", [
    { mech: "guard", mode: "phase", radius: 3, dur: 2.6, hitKind: "Izanagi" },
    { mech: "heal", self: true, rate: 40, dur: 0.6, hitKind: "Izanagi" },
  ], [ hand("kg_armeye", ["guard_go"], { lift: 34 }), atCaster("kg_rewrite", ["guard_go"]), L("kg_passthru", "block", ["guard_go"], { play: "once", lift: 30 }), atCaster("kg_closed", ["heal_go"], { play: "once", lift: 34 }) ], { seal: 0.2, lock: 0.2, cooldown: 14 }),
  mv(V.dan, 2, "danzo-shinkuu", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 1.6, count: 5, spread: 26, gap: 0.05, speed: 56, radius: 1.8, reach: 32, burst: 2.4, hit: { dmg: 7, kb: 4 }, impact: 0.3, hitKind: "Fūton: Shinkūgyoku" }],
    [ hand("kg_wmouth", ["seal", "aim", "tell", "shot_go"], { lift: 50, handF: 0.9 }), L("kg_wfan", "caster", ["tell"], { ground: true, rotate: true }), proj("kg_airball", { lift: 46 }), impact("kg_airpop", { lift: 20 }) ], { dodge: { phase: "tell", side: 14 } }),
  mv(V.shi, 1, "shisui-kotoamatsukami", [{ mech: "state", aim: 0.5, tell: 0.4, reach: 24, sight: 14, single: true, status: "confuse", statusT: 8, dur: 1.2, hitKind: "Kotoamatsukami" }],
    [ L("kg_shieye", "caster", ["aim", "tell", "state_go"], { lift: 60 }), L("kg_sgaze", "caster", ["tell"], { ground: true, rotate: true }), L("kg_will", "target", ["state_go", "recover"], { lift: 76 }) ], { hitPop: "WILLE ÜBERNOMMEN", seal: 0.2, lock: 0.3, cooldown: 14, dodge: { phase: "tell", side: 8 } }),
  mv(V.shi, 2, "shisui-afterimages", [{ mech: "clones", aim: 0.2, tell: 0.2, count: 4, fan: 140, gap: 0.05, speed: 60, reach: 2.4, range: 32, hit: { dmg: 7, kb: 3 }, hitKind: "Shunshin no Shisui" }],
    [ L("kg_blur", "clone", ["clones_go"], { lift: 0 }), impact("kg_hit", { lift: 30 }) ], { cloneTint: [190, 200, 230], cloneAlpha: 0.45, seal: 0.2, lock: 0.2, dodge: { phase: "tell", back: 16 } }),
  mv(V.shi, 3, "shisui-goukakyuu", [{ mech: "shot", aim: 0.3, tell: 0.35, from: 2, speed: 26, radius: 3, reach: 32, burst: 5, hit: { dmg: 16, status: "burn", statusT: 2 }, burstHit: { dmg: 10, kb: 8, status: "burn", statusT: 3 }, impact: 0.6, hitKind: "Katon: Gōkakyū" }],
    [ hand("kg_mouthfire", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), floorTell("kg_flane"), proj("kg_bigfire", { rotate: false, lift: 40 }), impact("cm_explo") ], { seal: 0.5, lock: 0.5, cooldown: 9, dodge: { phase: "tell", side: 10 } }),
];

// Madara's Susanoo (blue, armoured, a long sword at its side): seen from the side, the front and the back (loop)
function susanoo(p, u, view) {
  const c1 = H(SUS[0]), c2 = H(SUS[1]), c3 = H(SUS[2]);
  for (let k = 0; k < 20; k++) { const ph = (u + rnd(k)) % 1; blendDisc(p, (rnd(k + 2) - 0.5) * 110, -20 - ph * 190, 4 + 3 * (1 - ph), c2, 0.35 * (1 - ph)); }
  blendEllipse(p, 0, -100, 44, 80, c2, 0.28); blendEllipse(p, 0, -110, 34, 54, c3, 0.25);
  blendDisc(p, 0, -180, 20, c2, 0.4); for (const s of [1, -1]) p.line(s * 10, -192, s * 22, -214, c1, 0.7);
  if (view !== "back") { p.rect(-10, -182, 6, 3, H("#f0e060"), 0.9); p.rect(4, -182, 6, 3, H("#f0e060"), 0.9); }
  for (let k = 0; k < 4; k++) blendEllipse(p, 0, -140 + k * 14, 36 - k * 3, 5, c1, 0.25);
  // the sword drawn back at its side, held level for the side cut
  const sx = view === "side" ? -70 : view === "front" ? -80 : 80;
  for (let x = 0; x < 90; x++) p.blend(sx + x * (view === "side" ? 1 : 0.9), -110 + x * 0.1, c1, 0.6);
}
export const FX = {
  susanoo: { views: true, cw: 240, ch: 240, ox: 120, oy: 230, frames: 6, fps: 10, loop: true, draw(p, u, i, view) { susanoo(p, u, view); } },
  arc: { ground: true, cw: Math.ceil(px(16) * 2) + 10, ch: Math.ceil(px(16) * 2) + 10, ox: Math.ceil(px(16)) + 5, oy: Math.ceil(px(16)) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { const R = px(16); for (let t = -1.22; t <= 1.22; t += 0.01) { p.blend(Math.cos(t) * R, Math.sin(t) * R, H("#2a3aa0"), 0.85); if (((t + u) * 6 % 1 + 1) % 1 < 0.5) p.blend(Math.cos(t) * (R - 2), Math.sin(t) * (R - 2), H("#c8d8ff"), 0.85); } for (let r = 10; r < R; r += 8) for (let t = -1.22; t <= 1.22; t += 0.05) p.blend(Math.cos(t) * r, Math.sin(t) * r, H("#6a8ae8"), 0.1); } },
  // the side cut: a long level sweep across the front (views: in the side view it is a wide horizontal arc; seen
  // from the front or back it sweeps across the screen)
  sidecut: { views: true, cw: 300, ch: 150, ox: 150, oy: 120, frames: 7, fps: 18, draw(p, u, i, view) { const a = 1 - u * u, k = Math.min(1, u * 1.8); if (view === "side") { for (let t = -1.2; t <= -1.2 + 2.4 * k; t += 0.01) for (let d = 0; d < 6; d++) p.blend(Math.cos(t) * (120 - d) * 0.9, -60 + Math.sin(t) * (120 - d) * 0.25, H(d < 2 ? "#ffffff" : SUS[1]), a); } else { for (let x = -140; x <= -140 + 280 * k; x++) for (let d = 0; d < 6; d++) p.blend(x, -60 + d + Math.sin(x * 0.01) * 6, H(d < 2 ? "#ffffff" : SUS[1]), a); } } },
  groundwave: { ground: true, cw: 30, ch: 40, ox: 15, oy: 20, frames: 4, fps: 14, loop: true, draw(p, u) { for (let x = -14; x <= 14; x++) { const w = 10 + 3 * Math.sin((x / 14 + u) * 6.28); for (let y = -w; y <= w; y++) p.blend(x, y, H(Math.abs(y) > w - 2 ? "#2a2018" : "#8a7a5a"), 0.6); } } },
  mouthfire: fireball({ r: 8 }),
  wlane: lane({ len: px(32), w: Math.round(px(7)), c: "#ffd080", dark: "#6a2a10" }),
  wall: { cw: 50, ch: 120, ox: 25, oy: 110, frames: 6, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 16; k++) { const ph = (u + rnd(k)) % 1, x = (rnd(k + 1) - 0.5) * 50; blendEllipse(p, x, -ph * 100, 9 * (1 - ph) + 4, 14 * (1 - ph) + 5, H(FIRE[k % 3]), 0.85); } } },
  scorch: band({ len: 30, w: Math.round(px(7)), c: ["#3a2a20", "#2a1a14", "#1a100c"], a: 0.35 }),
  // the gunbai (round war fan) held up in front, taking the attack (views), the swirl where it absorbs
  gunbai: { views: true, cw: 90, ch: 100, ox: 45, oy: 94, frames: 4, fps: 8, loop: true, draw(p, u, i, view) { const x0 = view === "side" ? 22 : 0, rx = view === "side" ? 5 : 18; blendEllipse(p, x0, -48, rx + 2, 20, H("#5a2a1a"), view === "back" ? 0.5 : 0.95); blendEllipse(p, x0, -48, rx, 17, H("#e8dcc0"), view === "front" ? 0.6 : 0.9); p.line(x0, -28, x0, -8, H("#5a2a1a")); if (view !== "side") { blendDisc(p, x0, -54, 5, H("#c83a2a"), 0.9); blendDisc(p, x0, -44, 5, H("#f0f0f0"), 0.9); } } },
  absorb: { cw: 50, ch: 50, ox: 25, oy: 25, frames: 7, fps: 16, draw(p, u) { for (let t = 0; t < 10; t += 0.08) { const r = t * 2 * (1 - u), a = t * 1.4 + u * 8; p.blend(Math.cos(a) * r, Math.sin(a) * r, H("#e8dcc0"), 1 - u); } } },
  // Jinton: the little box between his hands, the beam to the target (tell), the ring, the white box that dismantles
  jincube: { cw: 24, ch: 24, ox: 12, oy: 12, frames: 4, fps: 10, loop: true, draw(p, u) { p.rect(-4, -4, 8, 8, H("#ffffff")); p.ring(0, 0, 7 + 2 * u, 1, H("#c8e8ff"), 0.8); } },
  jinbeam: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 4; k++) { const s = 10 + k * 6 + u * 6; p.line(-s, -s, s, -s, H("#ffffff"), 0.4); p.line(s, -s, s, s, H("#ffffff"), 0.4); p.line(s, s, -s, s, H("#ffffff"), 0.4); p.line(-s, s, -s, -s, H("#ffffff"), 0.4); } } },
  jring: ring({ R: Math.round(px(3.6)), c: "#ffffff", dark: "#3a4a6a" }),
  jinbox: { cw: 120, ch: 140, ox: 60, oy: 120, frames: 10, fps: 14, draw(p, u) { const k = Math.min(1, u * 2.5), a = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1, s = 40 * k; for (let y = -s * 2; y <= 0; y++) for (let x = -s; x <= s; x++) { const edge = Math.abs(x) > s - 2 || y < -s * 2 + 2 || y > -2; p.blend(x, y, H(edge ? "#c8e8ff" : "#ffffff"), (edge ? 1 : 0.6) * a); } } },
  light: aura({ c: ["#ffffff", "#e8e8f0", "#a8a8c0"], h: 70, w: 18, a: 0.3 }),
  lring: ring({ R: Math.round(px(3.4)), c: "#e8e8f0", dark: "#4a4a5a" }),
  shadow: pool({ R: 16, c: ["#16101c", "#16101c"], bubbles: "#16101c", a: 0.4 }),
  puff: poof({ R: 20, c: ["#f0ece4", "#c8c0b0", "#8a8070"] }),
  heavy: { cw: 24, ch: 24, ox: 12, oy: 12, frames: 2, fps: 6, loop: true, draw(p, u) { blendDisc(p, 0, 0, 5, H("#8a7a5a"), 0.9); p.ring(0, 0, 7 + u, 1, H("#5a4a3a"), 0.8); } },
  lane: lane({ len: px(32), w: 8, c: "#e8dcc8", dark: "#4a3a28" }),
  sink: { cw: 60, ch: 30, ox: 30, oy: 20, frames: 4, fps: 8, loop: true, draw(p, u) { blendEllipse(p, 0, 0, 24, 6, H("#5a4a3a"), 0.6); for (let k = 0; k < 6; k++) p.line(-20 + k * 8, -4, -22 + k * 8, 4 + 2 * u, H("#2a2018"), 0.8); } },
  crack: cracks({ R: 30, c: "#2a2018", n: 10 }),
  rockpuff: poof({ R: 22, c: ["#e8dcc8", "#b8a888", "#8a7a5a"] }),
  rockclone: { cw: 40, ch: 90, ox: 20, oy: 86, frames: 6, fps: 10, draw(p, u) { const a = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3; blendEllipse(p, 0, -40, 12, 38, H("#8a7a5a"), a); blendDisc(p, 0, -76, 9, H("#8a7a5a"), a); for (let k = 0; k < 6; k++) p.line(-8, -70 + k * 12, 8, -66 + k * 12, H("#5a4a3a"), a * 0.8); } },
  // A: the lightning armour (loop), the line, the trail, the crater, the burst
  armor: { cw: 80, ch: 110, ox: 40, oy: 100, frames: 4, fps: 20, loop: true, draw(p, u, i) { blendEllipse(p, 0, -44, 26, 46, H(LT[2]), 0.18); for (let k = 0; k < 7; k++) { let x = (rnd(k + i) - 0.5) * 40, y = -10 - rnd(k + i + 2) * 70; for (let s = 0; s < 3; s++) { const nx = x + (rnd(k * 3 + s + i) - 0.5) * 12, ny = y - 8; p.line(x, y, nx, ny, H(s ? LT[1] : LT[0])); x = nx; y = ny; } } } },
  alane: lane({ len: px(32), w: 9, c: LT[1], dark: "#203050" }),
  atrail: { cw: 150, ch: 70, ox: 140, oy: 60, frames: 4, fps: 20, loop: true, draw(p, u, i) { speed({ len: 130, h: 56, c: "#c8e8ff", n: 12 }).draw(p, u); } },
  bigcrater: cracks({ R: 56, c: "#2a2018", n: 20 }),
  zapburst: { cw: 110, ch: 110, ox: 55, oy: 80, frames: 8, fps: 18, draw(p, u, i) { crackle({ R: 42, c: LT, bolts: 10, core: 10 * (1 - u) }).draw(p, u, i); } },
  aring: ring({ R: Math.round(px(4)), c: LT[1], dark: "#203050" }),
  streak: { cw: 160, ch: 40, ox: 150, oy: 20, frames: 5, fps: 20, draw(p, u) { for (let k = 0; k < 5; k++) p.line(-4, (k - 2) * 4, -4 - 140 * (1 - u), (k - 2) * 4, H(k % 2 ? LT[0] : LT[1]), 1 - u); } },
  // Mei: steam / lava at the mouth, the ring, the acid mist (loop), its floor, the lava stream and its pool, the pillar
  steam: { cw: 30, ch: 30, ox: 15, oy: 20, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 5; k++) { const ph = (u + k / 5) % 1; blendDisc(p, (rnd(k) - 0.5) * 10 + ph * 8, -ph * 14, 3, H(ACID[1]), 0.6 * (1 - ph)); } } },
  mring: ring({ R: Math.round(px(7)), c: ACID[1], dark: "#3a4a10" }),
  acid: mist({ R: Math.round(px(7)), c: ACID, a: 0.45, n: 18 }),
  acidfloor: pool({ R: Math.round(px(7)), c: [ACID[1], ACID[2]], bubbles: ACID[0], a: 0.45 }),
  lavamouth: fireball({ r: 6, c: ["#fff0a0", "#ff8a30", "#c03010", "#6a1008"] }),
  llane: lane({ len: px(28), w: Math.round(px(3.4)), c: "#ffb060", dark: "#5a1008" }),
  lava: band({ len: 22, w: 12, c: LAVA, a: 0.9 }),
  lavafloor: band({ len: 22, w: Math.round(px(3.4)), c: ["#ff8a30", "#a02010", "#3a1008"], a: 0.55 }),
  wseal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H(W[1]), 1 - ph); } } },
  wring: ring({ R: Math.round(px(4)), c: W[1], dark: W[2] }),
  pillar: { cw: 90, ch: 200, ox: 45, oy: 190, frames: 9, fps: 14, draw(p, u) { const k = Math.min(1, u * 2.4), a = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1, h = 170 * k; for (let y = 0; y >= -h; y--) { const w = 22 + 4 * Math.sin(y * 0.1 + u * 10); for (let x = -w; x <= w; x++) p.blend(x, y, H(Math.abs(x) > w - 3 ? W[2] : Math.abs(x) < 6 ? W[0] : W[1]), 0.8 * a); } for (let s = 0; s < 10; s++) blendDisc(p, (rnd(s) - 0.5) * 70, -h + rnd(s + 2) * 20, 4, H(W[0]), a); } },
  wfloor: pool({ R: Math.round(px(4)), c: [W[1], W[2]], bubbles: W[0], a: 0.45 }),
  // Darui: black lightning between his hands, a beam, its hit; the water wall (loop), a splash
  dark: crackle({ R: 12, c: ["#ffffff", "#c8d8ff", "#1c1c2a"], bolts: 5, core: 3 }),
  laser: comet({ len: 44, r: 3, c: ["#ffffff", "#e8f0ff", "#8ab0f0"], tail: 1 }),
  beamhit: spark({ R: 14, c: ["#ffffff", "#c8d8ff"] }),
  waterwall: { cw: 120, ch: 110, ox: 60, oy: 100, frames: 6, fps: 12, loop: true, draw(p, u) { for (let t = 0; t < 6.28; t += 0.03) { const x = Math.cos(t) * 44, z = Math.sin(t); const h = 80 + 10 * Math.sin(t * 5 + u * 6.28); for (let y = 0; y >= -h; y -= 2) p.blend(x, y + z * 10, H(y < -h + 6 ? W[0] : W[1]), z > 0 ? 0.35 : 0.6); } } },
  splash: spark({ R: 12, c: ["#ffffff", "#7ac8f0"] }),
  // Danzō: the eye on his arm, reality rewritten (a pale flicker over him), a kunai passing, the eye closing
  armeye: mark({ kind: "seal", c: ["#ff4040", "#2a0a0a"], R: 4 }),
  rewrite: { cw: 70, ch: 100, ox: 35, oy: 94, frames: 4, fps: 12, loop: true, draw(p, u, i) { for (let k = 0; k < 10; k++) { const y = -90 * rnd(k + i); p.line(-24, y, 24, y, H("#e8e8f0"), 0.25); } } },
  passthru: { cw: 60, ch: 30, ox: 30, oy: 15, frames: 6, fps: 16, draw(p, u) { for (let x = -24; x <= 24; x += 2) p.blend(x, 0, H("#c8c8d8"), 0.4 * (1 - Math.abs(x - (u * 48 - 24)) / 24)); } },
  closed: { cw: 30, ch: 20, ox: 15, oy: 10, frames: 6, fps: 10, draw(p, u) { p.line(-8, 0, 8, 0, H("#2a1a1a")); p.line(-8, -2 * (1 - u), 8, -2 * (1 - u), H("#ff4040"), 1 - u); } },
  wmouth: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 12, loop: true, draw(p, u) { p.ring(0, 0, 4 + 4 * u, 1, H("#e8f8f0"), 0.8); } },
  wfan: { ground: true, cw: Math.ceil(px(32)) + 8, ch: Math.ceil(px(32) * 0.6) + 10, ox: 2, oy: Math.ceil(px(32) * 0.3) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = -2; k <= 2; k++) { const a = k * 0.11; for (let x = 6; x <= px(32); x += 3) if (((x / 12 - u) % 1 + 1) % 1 < 0.35) p.blend(Math.cos(a) * x, Math.sin(a) * x, H("#e8f8f0"), 0.75); } } },
  airball: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 14, loop: true, draw(p, u) { p.ring(0, 0, 7, 1, H("#ffffff"), 0.9); p.ring(0, 0, 5, 1, H("#c8f0e0"), 0.6); blendDisc(p, 0, 0, 4, H("#e8fff8"), 0.3); } },
  airpop: burst({ R: 16, c: ["#ffffff", "#e8fff8", "#a8d8c8"], smoke: "#c8d8d0", frames: 7 }),
  // Shisui: his Mangekyō (the shuriken pattern) at the eye, the gaze, the changed will over the target, afterimage
  // blur at each clone, a hit; the great fireball
  shieye: mark({ kind: "seal", c: ["#ff4040", "#1a0a0a"], R: 6 }),
  sgaze: coneMark({ len: px(24), half: 14, c: "#c02020", dark: "#2a0808" }),
  will: mark({ kind: "spiral", c: ["#ffffff", "#c02020"], R: 9 }),
  blur: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 4, fps: 16, loop: true, draw(p, u, i) { for (let k = 0; k < 6; k++) p.line(-20 + rnd(k + i) * 10, -80 * rnd(k + i + 1), 20, -80 * rnd(k + i + 1), H("#e8e8f0"), 0.4); } },
  hit: spark({ R: 14, c: ["#ffffff", "#ffe080"] }),
  flane: lane({ len: px(32), w: Math.round(px(3)), c: "#ffd080", dark: "#6a2a10" }),
  bigfire: fireball({ r: 24 }),
  fireburst: burst({ R: 46, c: FIRE, smoke: "#5a4a44", rays: 8, frames: 10 }),
};
export const PREFIX = "kg_";

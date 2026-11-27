// The Akatsuki on the 2.5D stage (2026-11-27). (Pain's Gedo Statue is a summon: src/fx/summon/statue.js.)
// Pain (Six Paths): 1 "Shinra Tensei" (Manga 420): a repulsive force pushing everything away from him: guard (full,
//   the kunai thrown back off) with a push; 2 "Chibaku Tensei" (Manga 440): a black sphere thrown up draws everything
//   round it in: zone (pull, crushed); 3 "Banshō Ten'in" (Manga 420): the target pulled to him: bind (pull) -> a blow
// Itachi (Mangekyō): 1 "Tsukuyomi" (Manga 142): one look into his eye, three days of torture in an instant: state
//   (stun, hurt, single); 2 "Amaterasu" (Manga 143): black flames where he looks: blast (burn); 3 "Susanoo: Totsuka
//   Blade" (Manga 392): the sword of the Susanoo arm pierces and seals into the sake jar: line (sealed); his one
//   Susanoo move; 4 "Yata Mirror Defense" (Manga 392): the mirror alone, held up in front (the Susanoo body is in
//   slot 3): guard (in front)
// Obito (Tobi): 1 "Kamui Intangibility" (Manga 400): attacks pass through the part of him that is in the other
//   dimension: guard (phase); 2 "Kamui Warp" (Manga 400): he is sucked into the vortex of his own eye and comes out
//   elsewhere: blink (behind, a strike); 3 "Wood Style: Cutting Sprigs" (Sashiki no Jutsu, Manga 600): wooden spikes
//   shot from the arm: shot (a spread); 4 "Fire Style: Bomb Blast Dance" (Katon: a sweeping fire storm): line (fire)
// Kisame (Samehada fusion): 1 "Water Prison Shark Dance" (Suirō Sameodori, Manga 506): a dome of water with sharks:
//   zone (round him, slowed, bitten); 2 "Super Shark Bomb" (Daikōdan, Manga 506): a huge shark of water: shot (bursts);
//   3 "Five Feeding Sharks" (Goshokuzame, Manga 147): five sharks that hunt: shot (homing, five)
// Konan: 1 "Sacred Paper Emissary (600 Billion Bombs)" (Manga 456): a sea of explosive tags: zone (the paper) ->
//   blast (it goes off in waves); 2 "Shikigami Dance" (Manga 455): paper wrapping the target: bind; 3 "Paper Chakram"
//   (paper shuriken, Manga 368): shot (spinning)
// Deidara: 1 "C4 Karura" (Manga 362): microscopic bombs breathed in, the body falls apart: zone (inside: damage);
//   2 "C3" (Manga 278): a huge clay figure dropped: blast (big, slow); 3 "C2 Dragon" (Manga 260): the dragon's
//   missiles: shot (homing)
// Sasori: 1 "Red Secret Technique: Performance of a Hundred Puppets" (Manga 272): a hundred puppets on strings:
//   shot (a wide wave of puppets); 2 "Third Kazekage: Iron Sand World Method" (Manga 271): iron sand spread into
//   spikes: blast (waves); 3 "Flamethrower Jet" (a puppet's arm, Manga 267): line (fire)
// Kakuzu: 1 "Earth Style: Earth Spear" (Doton: Domu, Manga 330): the skin hardened: guard (full); 2 "Fire/Wind Combo:
//   Searing Migraine" (Katon: Zukokku + Fūton: Atsugai, Manga 331): line (wide fire and wind); 3 "Lightning Style:
//   False Darkness" (Raiton: Gian, Manga 332): a spear of lightning: line (fast, stuns)
// Hidan: 1 "Curse Technique: Death Controlling Possessed Blood" (Manga 323): a nick of the scythe for the blood, the
//   ritual circle; what he does to himself happens to the target: rush (the nick) -> state (the curse, if it bled);
//   2 "Triple-Bladed Scythe Throw" (Manga 319): shot
import { lane, spark, burst, shock, comet, orb, fireball, band, needle, pool, wrap, aura, mark, ring, dome, crescent, crackle, mist, poof, spikes, shuriken, coneMark, chain, cracks, dragonHead, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const V = { pain: "shippuden/pain-six-paths-of-pain", ita: "shippuden/itachi-uchiha-mangekyo-sharingan", obi: "shippuden/obito-uchiha-tobi-orange-mask", kis: "shippuden/kisame-hoshigaki-samehada-fusion",
  kon: "shippuden/konan-paper-person-of-god", dei: "shippuden/deidara-c4-karura", sas: "shippuden/sasori-hundred-puppets", kak: "shippuden/kakuzu-earth-grudge-fear", hid: "shippuden/hidan-jashin-ritual" };
const FIRE = ["#fff6c0", "#ffb030", "#e0401a"], W = ["#f0faff", "#7ac8f0", "#2a6ab0"], RED = ["#ffd8d0", "#e04a3a", "#7a1010"], PAPER = ["#ffffff", "#e8e4f0", "#9a90b0"], CLAY = ["#fffaf0", "#e8dcc8", "#a89a80"], LT = ["#ffffff", "#9ad8ff", "#3a70e8"];
const mv = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.4, recover: 0.4, range: 34, cone: 50, cooldown: 8, lock: 0.4, dodge: { phase: "tell", side: 7 },
  sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", line_go: "whoosh", shot_go: "whoosh", blast_go: "burst", bind_go: "whoosh", hold: "bite", guard_go: "rumble", buff_go: "rumble", zone_go: "rumble", state_go: "cast", blink_go: "whoosh", heal_go: "cast" }, stages, look, ...extra });
export const MOVES = [
  mv(V.pain, 1, "pain-shinra-tensei", [{ mech: "guard", mode: "reflect", radius: 4.6, dur: 1.4, pulse: 11, pulseHit: { dmg: 16, kb: 22, kbT: 0.45 }, hitKind: "Shinra Tensei" }],
    [ atCaster("ak_push", ["guard_go"], { play: "once" }), atCaster("ak_pushring", ["guard_go"], { ground: true, play: "once" }), L("ak_flick", "block", ["guard_go"], { play: "once", lift: 30 }) ], { seal: 0.3, lock: 0.3, cooldown: 10, shake: 2, dodge: { phase: "seal", back: 12 } }),
  mv(V.pain, 2, "pain-chibaku-tensei", [{ mech: "zone", aim: 0.45, tell: 0.5, radius: 6, dur: 3, dot: 9, status: "stun", pull: 12, hitKind: "Chibaku Tensei" }],
    [ hand("ak_core", ["seal", "aim", "tell"], { lift: 60, handF: 0.4 }), aimRing("ak_cring", ["tell"]), L("ak_rocks", "zone", ["zone_go"], { lift: 40 }), L("ak_dark", "zone", ["zone_go"], { lift: 70 }), L("ak_crater", "zone", ["zone_go"], { ground: true }) ], { seal: 0.6, lock: 0.6, cooldown: 13, dodge: { phase: "tell", back: 16 } }),
  mv(V.pain, 3, "pain-bansho-tenin", [{ mech: "bind", aim: 0.3, tell: 0.3, speed: 80, follow: false, radius: 2.4, reachMax: 30, hold: 0.9, pull: 40, pullTo: 2.4, crush: { dmg: 18, kb: 12 }, crushKind: "Banshō Ten'in", back: 80, hitKind: "Banshō Ten'in" }],
    [ hand("ak_palm", ["aim", "tell", "bind_go", "hold"]), L("ak_pull", "link", ["bind_go", "hold"], { rotate: true, seg: 3, lift: 30 }), impact("ak_strike", { lift: 30 }) ], { dodge: { phase: "tell", side: 8 } }),
  mv(V.ita, 1, "itachi-tsukuyomi", [{ mech: "state", aim: 0.4, tell: 0.35, reach: 24, sight: 18, single: true, status: "stun", statusT: 4, dmg: 14, dur: 1.2, hitKind: "Tsukuyomi" }],
    [ L("ak_mseye", "caster", ["aim", "tell", "state_go"], { lift: 60 }), L("ak_gaze", "caster", ["tell"], { ground: true, rotate: true }), L("ak_tsuki", "target", ["state_go", "recover"]) ], { hitPop: "TSUKUYOMI", seal: 0.2, lock: 0.3, cooldown: 11, dodge: { phase: "tell", side: 8 } }),
  mv(V.ita, 2, "itachi-amaterasu", [{ mech: "blast", aim: 0.5, tell: 0.35, radius: 2.6, hit: { dmg: 14, status: "burn", statusT: 6 }, after: 1.2, hitKind: "Amaterasu" }],
    [ L("ak_mseye", "caster", ["aim", "tell"], { lift: 60 }), aimRing("ak_focus", ["aim", "tell"]), L("ak_amat", "blast", ["blast_go"]) ], { hitPop: "SCHWARZE FLAMMEN", seal: 0.3, lock: 0.3, cooldown: 10 }),
  mv(V.ita, 3, "itachi-totsuka", [{ mech: "line", aim: 0.4, tell: 0.4, from: 2.5, len: 22, speed: 70, width: 2, hold: 0.5, fade: 0.4, hit: { dmg: 26, status: "seal", statusT: 10 }, hitKind: "Totsuka no Tsurugi" }],
    [ L("ak_susarm", "caster", ["seal", "aim", "tell", "line_go", "retract"], { views: true }), floorTell("ak_tlane"), L("ak_totsuka", "line", ["line_go"], { rotate: true, seg: 2.4, lift: 50 }), L("ak_jar", "target", ["retract"], { lift: 60 }) ], { hitPop: "VERSIEGELT", seal: 0.6, lock: 0.6, cooldown: 12, range: 24 }),
  mv(V.ita, 4, "itachi-yata", [{ mech: "guard", mode: "block", arc: 85, radius: 5, dur: 3, hitKind: "Yata no Kagami" }],
    [ L("ak_mirror", "caster", ["guard_go"], { views: true }), L("ak_ripple", "block", ["guard_go"], { play: "once", lift: 34 }) ], { seal: 0.3, lock: 0.3, cooldown: 10 }),
  mv(V.obi, 1, "obito-kamui-phase", [{ mech: "guard", mode: "phase", radius: 3, dur: 3, hitKind: "Kamui" }],
    [ atCaster("ak_swirl", ["guard_go"]), L("ak_passthru", "block", ["guard_go"], { play: "once", lift: 30 }) ], { seal: 0.15, lock: 0.15, cooldown: 9 }),
  mv(V.obi, 2, "obito-kamui-warp", [{ mech: "blink", aim: 0.3, tell: 0.3, to: "behind", behind: 2.6, vanish: 0.4, strike: 3.2, hit: { dmg: 18, kb: 8 }, impact: 0.4, hitKind: "Kamui-Sprung" }],
    [ atCaster("ak_suck", ["blink_go"], { play: "once" }), L("ak_suck", "aim", ["blink_go"], { play: "once" }), impact("ak_strike", { lift: 30 }) ], { cooldown: 8, dodge: { phase: "tell", side: 8 } }),
  mv(V.obi, 3, "obito-sashiki", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 1.8, count: 6, spread: 22, gap: 0.04, speed: 50, radius: 1.6, reach: 30, hit: { dmg: 6, kb: 2 }, impact: 0.3, hitKind: "Mokuton: Sashiki" }],
    [ hand("ak_woodarm", ["seal", "aim", "tell", "shot_go"]), L("ak_wfan", "caster", ["tell"], { ground: true, rotate: true }), proj("ak_stake", { lift: 30 }), impact("ak_splinter", { lift: 30 }) ], { dodge: { phase: "tell", side: 14 } }),
  mv(V.obi, 4, "obito-bakufuu-ranbu", [{ mech: "line", aim: 0.35, tell: 0.4, from: 2, len: 28, speed: 30, width: 4, hold: 0.5, fade: 0.4, dot: 24, hit: { status: "burn", statusT: 3, kb: 4 }, hitKind: "Katon: Bakufū Ranbu" }],
    [ hand("ak_mouthfire", ["seal", "aim", "tell"], { lift: 50, handF: 0.9 }), floorTell("ak_flane"), L("ak_storm", "line", ["line_go"], { rotate: true, seg: 3.2, lift: 26 }) ], { seal: 0.5, lock: 0.5, cooldown: 9, dodge: { phase: "tell", side: 9 } }),
  mv(V.kis, 1, "kisame-shark-dance", [{ mech: "zone", at: "self", noAim: true, radius: 10, dur: 4, dot: 5, status: "slow", hitKind: "Suirō Sameodori" }],
    [ L("ak_wdome", "zone", ["zone_go"]), L("ak_wfloor", "zone", ["zone_go"], { ground: true }), L("ak_sharks", "zone", ["zone_go"], { lift: 20 }) ], { seal: 0.6, lock: 0.6, cooldown: 12, start: null, dodge: { phase: "seal", back: 12 } }),
  mv(V.kis, 2, "kisame-daikoudan", [{ mech: "shot", aim: 0.35, tell: 0.4, from: 3, speed: 28, radius: 3, reach: 34, burst: 5.5, hit: { dmg: 14, kb: 6 }, burstHit: { dmg: 18, kb: 14 }, impact: 0.6, hitKind: "Daikōdan" }],
    [ hand("ak_wseal", ["seal", "aim", "tell"], { lift: 34 }), floorTell("ak_klane"), L("ak_bigshark", "proj", null, { views: true, lift: 30 }), impact("ak_wburst") ], { seal: 0.6, lock: 0.6, cooldown: 10, shake: 1.6 }),
  mv(V.kis, 3, "kisame-goshokuzame", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 2, count: 5, spread: 60, gap: 0.08, speed: 26, homing: 1.6, radius: 1.8, reach: 40, hit: { dmg: 8, kb: 3 }, impact: 0.4, hitKind: "Goshokuzame" }],
    [ hand("ak_wseal", ["seal", "aim", "tell"], { lift: 34 }), L("ak_shark", "proj", null, { views: true, lift: 14 }), impact("ak_bite", { lift: 26 }) ], { seal: 0.5, lock: 0.5, cooldown: 9, dodge: { phase: "tell", back: 20 } }),
  mv(V.kon, 1, "konan-paper-sea", [
    { mech: "zone", aim: 0.4, tell: 0.45, radius: 9, dur: 1.4, dot: 0, status: "slow", hitKind: "Shikigami no Mai" },
    { mech: "blast", skipAim: true, at: "zone", radius: 9, waves: 3, gap: 0.3, hit: { dmg: 11, kb: 4 }, after: 0.6, hitKind: "Sechshundert Milliarden Kibaku Fuda" },
  ], [ atCaster("ak_paperwings", ["seal", "aim", "tell", "zone_go", "blast_go"]), aimRing("ak_pring", ["tell"]), L("ak_papersea", "zone", ["zone_go", "blast_go"], { ground: true }), L("ak_tagsboom", "zone", ["blast_go"]) ], { seal: 0.6, lock: 0.6, cooldown: 14, dodge: { phase: "tell", back: 16 } }),
  mv(V.kon, 2, "konan-shikigami-dance", [{ mech: "bind", aim: 0.3, tell: 0.3, speed: 30, steer: 2.5, radius: 2.2, reachMax: 30, hold: 2.2, dot: 6, crush: { dmg: 6 }, back: 34, hitKind: "Shikigami no Mai" }],
    [ atCaster("ak_paperwings", ["seal", "aim", "tell", "bind_go", "hold"]), L("ak_paperstream", "link", ["bind_go", "hold", "retract"], { rotate: true, seg: 2, lift: 30 }), L("ak_paperwrap", "grab", ["hold"]) ], { dodge: { phase: "tell", back: 14 } }),
  mv(V.kon, 3, "konan-paper-chakram", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 1.8, count: 3, spread: 18, gap: 0.06, speed: 44, radius: 1.8, reach: 32, hit: { dmg: 10, kb: 4 }, impact: 0.3, hitKind: "Kami Shuriken" }],
    [ hand("ak_paperhand", ["seal", "aim", "tell"]), floorTell("ak_plane"), proj("ak_chakram", { rotate: false, lift: 30 }), impact("ak_papercut", { lift: 30 }) ], { dodge: { phase: "tell", side: 12 } }),
  mv(V.dei, 1, "deidara-c4", [{ mech: "zone", aim: 0.5, tell: 0.5, radius: 8, dur: 3, dot: 9, hitKind: "C4 Karura" }],
    [ L("ak_c4", "aim", ["aim", "tell"], { lift: 0 }), aimRing("ak_c4ring", ["tell"]), L("ak_motes", "zone", ["zone_go"], { lift: 10 }), L("ak_eat", "target", ["zone_go"]) ], { seal: 0.7, lock: 0.7, cooldown: 14, dodge: { phase: "tell", back: 16 } }),
  mv(V.dei, 2, "deidara-c3", [{ mech: "blast", aim: 0.35, tell: 0.7, radius: 9, delay: 0.5, hit: { dmg: 34, kb: 16, kbT: 0.4 }, after: 0.9, hitKind: "C3" }],
    [ hand("ak_clay", ["seal", "aim", "tell"]), aimRing("ak_c3ring", ["tell"]), L("ak_c3drop", "aim", ["tell", "blast_go"], { lift: 0 }), L("ak_c3boom", "blast", ["blast_go"], { play: "once" }), L("ak_c3crater", "blast", ["blast_go"], { ground: true }) ], { seal: 0.5, lock: 0.5, cooldown: 12, shake: 2.6, dodge: { phase: "tell", back: 14 } }),
  mv(V.dei, 3, "deidara-c2", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 3, count: 3, spread: 50, gap: 0.2, speed: 30, homing: 2, radius: 1.8, reach: 40, burst: 3.2, hit: { dmg: 8 }, burstHit: { dmg: 10, kb: 8 }, impact: 0.4, hitKind: "C2 Dragon" }],
    [ hand("ak_clay", ["seal", "aim", "tell"]), L("ak_missile", "proj", null, { views: true, lift: 34 }), impact("ak_clayboom", { lift: 10 }) ], { seal: 0.5, lock: 0.5, cooldown: 10, dodge: { phase: "tell", back: 20 } }),
  mv(V.sas, 1, "sasori-hundred-puppets", [{ mech: "shot", aim: 0.35, tell: 0.4, from: 2, count: 10, spread: 64, gap: 0.03, speed: 30, radius: 1.8, reach: 32, hit: { dmg: 6, kb: 3 }, impact: 0.4, hitKind: "Akahigi: Hyakki no Sōen" }],
    [ hand("ak_strings", ["seal", "aim", "tell", "shot_go"], { lift: 34 }), L("ak_pfan", "caster", ["tell"], { ground: true, rotate: true }), proj("ak_puppet", { rotate: false, lift: 30 }), impact("ak_cut", { lift: 30 }) ], { seal: 0.6, lock: 0.6, cooldown: 12, dodge: { phase: "tell", back: 14 } }),
  mv(V.sas, 2, "sasori-iron-sand", [{ mech: "blast", aim: 0.4, tell: 0.45, radius: 6.5, waves: 2, gap: 0.4, hit: { dmg: 12, kb: 4 }, after: 0.7, hitKind: "Satetsu Kaihō" }],
    [ hand("ak_strings", ["seal", "aim", "tell"], { lift: 34 }), aimRing("ak_iring", ["tell"]), L("ak_ironspikes", "blast", ["blast_go"], { play: "once" }), L("ak_ironfloor", "blast", ["blast_go"], { ground: true }) ], { seal: 0.5, lock: 0.5, cooldown: 10, dodge: { phase: "tell", back: 12 } }),
  mv(V.sas, 3, "sasori-flamethrower", [{ mech: "line", aim: 0.3, tell: 0.3, from: 2, len: 24, speed: 40, width: 2.6, hold: 0.6, fade: 0.3, dot: 26, hit: { status: "burn", statusT: 2.5, kb: 3 }, hitKind: "Kaenhōsha" }],
    [ hand("ak_nozzle", ["seal", "aim", "tell"]), floorTell("ak_flane2"), L("ak_jet", "line", ["line_go"], { rotate: true, seg: 2.6, lift: 30 }) ], { range: 26 }),
  mv(V.kak, 1, "kakuzu-domu", [{ mech: "guard", mode: "full", radius: 3.4, dur: 3, hitKind: "Doton: Domu" }],
    [ atCaster("ak_stone", ["guard_go"]), L("ak_clink", "block", ["guard_go"], { play: "once", lift: 30 }) ], { seal: 0.2, lock: 0.2, cooldown: 9 }),
  mv(V.kak, 2, "kakuzu-searing-migraine", [{ mech: "line", aim: 0.4, tell: 0.45, from: 2.5, len: 30, speed: 32, width: 5, hold: 0.5, fade: 0.4, dot: 30, hit: { status: "burn", statusT: 3, kb: 8 }, hitKind: "Katon: Zukokku + Fūton: Atsugai" }],
    [ atCaster("ak_masks", ["seal", "aim", "tell", "line_go"]), floorTell("ak_mlane"), L("ak_firewind", "line", ["line_go"], { rotate: true, seg: 3.4, lift: 22 }) ], { seal: 0.6, lock: 0.6, cooldown: 11, dodge: { phase: "tell", side: 10 } }),
  mv(V.kak, 3, "kakuzu-gian", [{ mech: "line", aim: 0.3, tell: 0.35, from: 2, len: 34, speed: 140, width: 1.6, hold: 0.3, fade: 0.2, hit: { dmg: 26, kb: 6, status: "stun", statusT: 1.5 }, hitKind: "Raiton: Gian" }],
    [ atCaster("ak_masks", ["seal", "aim", "tell"]), floorTell("ak_llane"), L("ak_gian", "line", ["line_go"], { rotate: true, seg: 2, lift: 34 }), impact("ak_zap", { lift: 30 }) ], { seal: 0.5, lock: 0.5 }),
  mv(V.hid, 1, "hidan-shiji-hyouketsu", [
    { mech: "rush", aim: 0.3, tell: 0.3, speed: 44, reach: 3.4, stand: 3, reachMax: 32, hits: 1, hit: { dmg: 6, kb: 2 }, impact: 0.2, hitKind: "Blutritual" },
    { mech: "state", skipAim: true, needHit: true, reach: 60, sight: 180, single: true, status: "stun", statusT: 1.5, dmg: 30, dur: 1.4, hitKind: "Jujutsu: Shiji Hyōketsu" },
  ], [ floorTell("ak_lane"), L("ak_ritual", "caster", ["state_go", "recover"], { ground: true }), L("ak_curse", "caster", ["state_go"]), L("ak_bleed", "target", ["state_go", "recover"], { lift: 30 }) ], { hitPop: "FLUCH", cooldown: 12 }),
  mv(V.hid, 2, "hidan-scythe-throw", [{ mech: "shot", aim: 0.3, tell: 0.3, from: 2, speed: 40, radius: 2, reach: 30, hit: { dmg: 22, kb: 6 }, impact: 0.4, hitKind: "Sansenkama" }],
    [ floorTell("ak_lane"), proj("ak_scythe", { rotate: false, lift: 30 }), L("ak_cable", "caster", ["shot_go"], { rotate: true, lift: 30 }), impact("ak_cut", { lift: 30 }) ]),
];

// a shark: side (swimming +x), front (coming), back (going)
function shark(p, u, view, s = 1) {
  const c1 = H("#e8f4ff"), c2 = H("#5a8ac8"), c3 = H("#2a4a8a"), K = s;
  if (view === "side") { blendEllipse(p, 0, 0, 20 * K, 7 * K, c2, 0.9); blendEllipse(p, 0, 2 * K, 16 * K, 4 * K, c1, 0.7); p.poly([[-2 * K, -6 * K], [4 * K, -6 * K], [0, -14 * K]], c3); p.poly([[-18 * K, 0], [-28 * K, -7 * K + Math.sin(u * 6.28) * 3], [-28 * K, 7 * K + Math.sin(u * 6.28) * 3]], c3); p.rect(12 * K, -2 * K, 2, 2, H("#ffffff")); for (let x = 14 * K; x < 20 * K; x += 2) p.dot(x, 3 * K, H("#ffffff")); }
  else { blendDisc(p, 0, 0, 9 * K, c2, 0.9); blendEllipse(p, 0, 3 * K, 6 * K, 2.5 * K, view === "front" ? H("#1a2a4a") : c1, 0.9); p.poly([[-3 * K, -7 * K], [3 * K, -7 * K], [0, -16 * K]], c3); if (view === "front") for (const sg of [1, -1]) p.rect(sg * 5 * K - 1, -3 * K, 2, 2, H("#ffffff")); }
}
export const FX = {
  // Shinra Tensei: the push (a sphere of force running out, once), its ring on the floor, a kunai flicked away
  push: { cw: 200, ch: 160, ox: 100, oy: 120, frames: 10, fps: 18, draw(p, u) { const r = 90 * (1 - (1 - u) ** 3), a = 1 - u; for (let t = 0; t < 6.28; t += 0.01) { p.blend(Math.cos(t) * r, -40 + Math.sin(t) * r * 0.7, H("#ffffff"), a * 0.9); p.blend(Math.cos(t) * (r - 3), -40 + Math.sin(t) * (r - 3) * 0.7, H("#c8d0e8"), a * 0.5); } blendDisc(p, 0, -40, r * 0.6, H("#e8ecf8"), 0.15 * a); } },
  pushring: shock({ R: Math.round(px(11)), c: "#e8ecf8", edge: "#4a5070", w: 5 }),
  flick: spark({ R: 12, c: ["#ffffff", "#c8d0e8"] }),
  // Chibaku Tensei: the black core in his raised hand, the ring, rocks drawn up round the catch, the dark core above
  core: orb({ r: 8, c: ["#3a3a4a", "#14101c", "#000000"], streaks: 3, glow: false }),
  cring: ring({ R: Math.round(px(6)), c: "#8a8aa0", dark: "#14101c" }),
  rocks: { cw: 160, ch: 140, ox: 80, oy: 100, frames: 8, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 30; k++) { const a = rnd(k) * 6.28 + u * 2, r = 60 * (0.3 + 0.7 * rnd(k + 2)) * (1 - 0.3 * ((u + rnd(k)) % 1)), x = Math.cos(a) * r, y = -20 + Math.sin(a) * r * 0.5 - 30 * ((u + rnd(k + 5)) % 1); p.rect(x - 3, y - 3, 6 + rnd(k) * 4, 5, H(k % 3 ? "#7a6a5a" : "#4a3a30")); } } },
  dark: orb({ r: 14, c: ["#5a5a6a", "#1c1828", "#000000"], streaks: 4, glow: false }),
  crater: cracks({ R: Math.round(px(6)), c: "#1c1418", n: 18 }),
  // Banshō Ten'in: his palm, the pull (pieces of bent air toward him), the blow
  palm: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 12, loop: true, draw(p, u) { p.ring(0, 0, 6 + 3 * u, 1, H("#c8d0e8"), 0.8); } },
  pull: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 14, loop: true, draw(p, u) { for (let t = -1; t <= 1; t += 0.04) p.blend(-6 + u * -6 + Math.abs(t) * 6, t * 12, H("#c8d0e8"), 0.6); } },
  strike: burst({ R: 26, c: ["#ffffff", "#c8d0e8", "#5a6080"], smoke: "#5a6080", rays: 6, frames: 8 }),
  // Tsukuyomi: the Mangekyō (Itachi's pattern) at his eye, the gaze (tell), the red-and-black world on the target
  mseye: mark({ kind: "seal", c: ["#ff4040", "#1a0a0a"], R: 6 }),
  gaze: coneMark({ len: px(24), half: 18, c: "#c02020", dark: "#2a0808" }),
  tsuki: { cw: 80, ch: 110, ox: 40, oy: 100, frames: 6, fps: 8, loop: true, draw(p, u) { blendEllipse(p, 0, -50, 34, 50, H("#a01010"), 0.35); blendDisc(p, 0, -96, 9, H("#000000"), 0.8); for (let k = 0; k < 6; k++) { const y = -10 - k * 14; p.line(-20, y, 20, y + 6 * Math.sin(u * 6.28 + k), H("#000000"), 0.5); } } },
  focus: ring({ R: Math.round(px(2.6)), c: "#a01010", dark: "#1c0808" }),
  amat: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 6, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 18; k++) { const ph = (u + rnd(k)) % 1, x = (rnd(k + 1) - 0.5) * 30 * (1 - ph * 0.5); blendEllipse(p, x, -ph * 76, 5 * (1 - ph) + 2, 9 * (1 - ph) + 3, H(k % 3 ? "#0c0810" : "#3a1a1a"), 0.95); } } },
  // Totsuka: the red Susanoo's arm with the gourd and the blade (views), the line, the blade of sake spirit, the jar
  susarm: { views: true, cw: 110, ch: 110, ox: 55, oy: 100, frames: 6, fps: 10, loop: true, draw(p, u, i, view) { const c = H("#e85a4a"), d = H("#8a1a10"); for (let k = 0; k < 14; k++) { const ph = (u + rnd(k)) % 1; blendDisc(p, (rnd(k + 2) - 0.5) * 60, -10 - ph * 90, 3 + 2 * (1 - ph), c, 0.45 * (1 - ph)); } for (let k = 0; k < 5; k++) blendEllipse(p, 0, -50 + k * 8, 24 - k, 4, c, 0.3); if (view === "side") { for (let x = 0; x < 30; x++) p.blend(10 + x, -50 + x * 0.2, d, 0.8); blendEllipse(p, -14, -44, 7, 10, H("#c8a060"), 0.8); } else blendEllipse(p, view === "front" ? 20 : -20, -44, 7, 10, H("#c8a060"), 0.8); } },
  tlane: lane({ len: px(22), w: 6, c: "#ffb0a0", dark: "#5a1010" }),
  totsuka: band({ len: 18, w: 4, c: ["#fff0e0", "#ff8a70", "#c02a1a"], a: 0.85 }),
  jar: { cw: 40, ch: 50, ox: 20, oy: 40, frames: 4, fps: 8, loop: true, draw(p, u) { blendEllipse(p, 0, -14, 10, 14, H("#c8a060"), 0.9); p.rect(-3, -32, 6, 6, H("#8a6030")); for (let k = 0; k < 5; k++) { const ph = (u + k / 5) % 1; p.blend((rnd(k) - 0.5) * 14, -28 - ph * 10, H("#ff8a70"), 1 - ph); } } },
  // Yata: the mirror alone (round, with its magatama rim), in front (views), a ripple where an attack ends
  mirror: { views: true, cw: 90, ch: 100, ox: 45, oy: 94, frames: 4, fps: 8, loop: true, draw(p, u, i, view) { const x0 = view === "side" ? 24 : 0, rx = view === "side" ? 5 : 22; blendEllipse(p, x0, -44, rx + 3, 26, H("#c86a3a"), view === "back" ? 0.5 : 0.85); blendEllipse(p, x0, -44, rx, 22, H("#f0e8c0"), view === "front" ? 0.4 : 0.75); if (view !== "side") for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28 + u; blendDisc(p, x0 + Math.cos(a) * (rx + 2), -44 + Math.sin(a) * 25, 2, H("#e85a4a"), 0.9); } } },
  ripple: { cw: 50, ch: 50, ox: 25, oy: 25, frames: 7, fps: 16, draw(p, u) { p.ring(0, 0, 4 + 16 * u, 1, H("#7ac8f0"), 1 - u); p.ring(0, 0, 2 + 10 * u, 1, H("#ffffff"), 1 - u); } },
  // Kamui (Obito): the swirl round him (loop), a kunai going through (once); the vortex that takes him in
  swirl: { cw: 80, ch: 110, ox: 40, oy: 100, frames: 6, fps: 12, loop: true, draw(p, u) { for (let t = 0; t < 14; t += 0.05) { const r = t * 2.4, a = t * 1.3 - u * 6.28; p.blend(Math.cos(a) * r, -50 + Math.sin(a) * r * 1.4, H(t > 10 ? "#5a4a6a" : "#1c1428"), 0.18); } } },
  passthru: { cw: 60, ch: 30, ox: 30, oy: 15, frames: 6, fps: 16, draw(p, u) { for (let x = -24; x <= 24; x += 2) p.blend(x, 0, H("#5a4a6a"), 0.4 * (1 - Math.abs(x - (u * 48 - 24)) / 24)); } },
  suck: { cw: 80, ch: 110, ox: 40, oy: 100, frames: 8, fps: 16, draw(p, u) { for (let t = 0; t < 16; t += 0.05) { const r = t * 2.2 * (1 - u * 0.6), a = t * 1.6 + u * 12; p.blend(Math.cos(a) * r, -50 + Math.sin(a) * r * 1.3, H(t > 11 ? "#5a4a6a" : "#0c0810"), 0.7 * (1 - u * 0.5)); } } },
  // Cutting Sprigs: the arm turning to wood, the fan, a stake, splinters
  woodarm: { cw: 30, ch: 20, ox: 6, oy: 10, frames: 2, fps: 6, loop: true, draw(p, u) { for (let x = 0; x < 18; x++) p.rect(x, -2, 1, 4, H(x % 3 ? "#9a7048" : "#5a3a20")); } },
  wfan: { ground: true, cw: Math.ceil(px(30)) + 8, ch: Math.ceil(px(30) * 0.8) + 10, ox: 2, oy: Math.ceil(px(30) * 0.4) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = -3; k <= 3; k++) { const a = k * 0.064; for (let x = 6; x <= px(30); x += 3) if (((x / 12 - u) % 1 + 1) % 1 < 0.35) p.blend(Math.cos(a) * x, Math.sin(a) * x, H("#c8a878"), 0.75); } } },
  stake: { cw: 40, ch: 10, ox: 20, oy: 5, frames: 1, fps: 1, draw(p) { for (let x = -16; x <= 14; x++) { const w = x > 8 ? 1 : 2; p.rect(x, -w, 1, 2 * w, H(x % 4 ? "#9a7048" : "#5a3a20")); } } },
  splinter: spark({ R: 12, c: ["#e8d0a0", "#9a7048"] }),
  mouthfire: fireball({ r: 7 }),
  flane: lane({ len: px(28), w: Math.round(px(4)), c: "#ffd080", dark: "#6a2a10" }),
  storm: { cw: 40, ch: 60, ox: 20, oy: 40, frames: 6, fps: 16, loop: true, draw(p, u) { for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28 + u * 6.28; blendDisc(p, Math.cos(a) * 12, -10 + Math.sin(a) * 18, 7, H(FIRE[k % 3]), 0.75); } } },
  // Kisame: the dome of water (loop), the water on the floor, sharks circling in it (loop)
  wdome: dome({ R: Math.round(px(10)), c: W, a: 0.25, h: 0.7 }),
  wfloor: pool({ R: Math.round(px(10)), c: [W[1], W[2]], bubbles: W[0], a: 0.4 }),
  sharks: { cw: Math.ceil(px(10) * 2.2), ch: 80, ox: Math.ceil(px(10) * 1.1), oy: 40, frames: 8, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + u * 6.28, x = Math.cos(a) * px(7), y = Math.sin(a) * 14; p.place(x + Math.ceil(px(10) * 1.1), y + 40, Math.cos(a + 1.57) < 0); shark(p, u, "side", 0.8); p.place(Math.ceil(px(10) * 1.1), 40, false); } } },
  wseal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H(W[1]), 1 - ph); } } },
  klane: lane({ len: px(34), w: Math.round(px(3)), c: W[1], dark: W[2] }),
  bigshark: { views: true, cw: 120, ch: 80, ox: 60, oy: 40, frames: 4, fps: 12, loop: true, draw(p, u, i, view) { shark(p, u, view, 2.2); } },
  wburst: burst({ R: 46, c: W, smoke: "#c8d8e8", frames: 10 }),
  shark: { views: true, cw: 70, ch: 40, ox: 35, oy: 20, frames: 4, fps: 12, loop: true, draw(p, u, i, view) { shark(p, u, view, 1); } },
  bite: { cw: 40, ch: 40, ox: 20, oy: 20, frames: 5, fps: 18, draw(p, u) { for (const s of [1, -1]) for (let k = 0; k < 3; k++) p.line(-6 + k * 6, s * 10 * (1 - u), -4 + k * 6, s * 2, H("#ffffff"), 1 - u); } },
  // Konan: paper wings (loop), the ring, the sea of tags on the floor, the tags going off, paper stream and wrap, a chakram
  paperwings: { cw: 110, ch: 100, ox: 55, oy: 94, frames: 6, fps: 10, loop: true, draw(p, u) { for (const s of [1, -1]) for (let k = 0; k < 10; k++) { const t = k / 9, x = s * (8 + t * 40), y = -60 + Math.sin(t * 3) * 14 - 6 * Math.sin(u * 6.28) * t; p.rect(x - 3, y - 4, 6, 8, H(PAPER[k % 3])); } } },
  pring: ring({ R: Math.round(px(9)), c: "#f0f0f8", dark: "#5a5070" }),
  papersea: { ground: true, cw: Math.ceil(px(9) * 2) + 8, ch: Math.ceil(px(9) * 2) + 8, ox: Math.ceil(px(9)) + 4, oy: Math.ceil(px(9)) + 4, frames: 4, fps: 6, loop: true, draw(p, u, i) { const R = px(9); for (let k = 0; k < 160; k++) { const a = rnd(k) * 6.28, r = R * Math.sqrt(rnd(k + 3)); p.rect(Math.cos(a) * r - 2, Math.sin(a) * r - 3, 4, 6, H(k % 4 ? "#f4f0e8" : "#e8d8a0")); if (k % 4 === 0) p.dot(Math.cos(a) * r, Math.sin(a) * r, H("#c83a2a")); } } },
  tagsboom: burst({ R: Math.round(px(7)), c: ["#fff8d0", "#ffb030", "#e0401a"], smoke: "#4a3a34", rays: 8, frames: 10 }),
  paperstream: { cw: 24, ch: 16, ox: 12, oy: 8, frames: 4, fps: 14, loop: true, draw(p, u, i) { for (let k = 0; k < 5; k++) p.rect((rnd(k + i) - 0.5) * 20, (rnd(k + i + 4) - 0.5) * 10, 4, 5, H(PAPER[k % 3])); } },
  paperwrap: wrap({ c: PAPER, h: 76, w: 16, rings: 6, a: 0.95 }),
  paperhand: { cw: 24, ch: 24, ox: 12, oy: 12, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + u * 3; p.rect(Math.cos(a) * 6 - 2, Math.sin(a) * 6 - 2, 4, 4, H(PAPER[0])); } } },
  plane: lane({ len: px(32), w: 6, c: "#f0f0f8", dark: "#5a5070" }),
  chakram: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 18, loop: true, draw(p, u) { for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + u * 1.57; p.tri(Math.cos(a) * 11, Math.sin(a) * 11, Math.cos(a + 0.5) * 3, Math.sin(a + 0.5) * 3, Math.cos(a - 0.5) * 3, Math.sin(a - 0.5) * 3, H(PAPER[k % 2])); } p.circle(0, 0, 2, H("#9a90b0")); } },
  papercut: spark({ R: 12, c: ["#ffffff", "#e8e4f0"] }),
  // Deidara: C4 (the clay giant over the place, falling apart into motes), the ring, the motes, bodies eaten away
  c4: { cw: 120, ch: 200, ox: 60, oy: 190, frames: 6, fps: 8, loop: true, draw(p, u) { blendEllipse(p, 0, -100, 30, 90, H(CLAY[1]), 0.5); blendDisc(p, 0, -170, 18, H(CLAY[1]), 0.55); for (let k = 0; k < 30; k++) { const ph = (u + rnd(k)) % 1; p.dot((rnd(k + 1) - 0.5) * 80, -190 + ph * 180, H(CLAY[2])); } } },
  c4ring: ring({ R: Math.round(px(8)), c: "#e8dcc8", dark: "#5a4a30" }),
  motes: { cw: Math.ceil(px(8) * 2.2), ch: 100, ox: Math.ceil(px(8) * 1.1), oy: 90, frames: 6, fps: 10, loop: true, draw(p, u, i) { for (let k = 0; k < 120; k++) { const x = (rnd(k + i) - 0.5) * px(8) * 2, y = -80 * rnd(k + i + 3); p.dot(x, y, H(k % 3 ? "#e8dcc8" : "#ffffff")); } } },
  eat: { cw: 50, ch: 90, ox: 25, oy: 84, frames: 6, fps: 12, loop: true, draw(p, u, i) { for (let k = 0; k < 20; k++) blendDisc(p, (rnd(k + i) - 0.5) * 24, -80 * rnd(k + i + 2), 1.5, H("#fff0c0"), 0.9); } },
  clay: { cw: 24, ch: 24, ox: 12, oy: 12, frames: 4, fps: 10, loop: true, draw(p, u) { blendDisc(p, 0, 0, 5 + Math.sin(u * 6.28), H(CLAY[1]), 1); p.dot(-1, -1, H(CLAY[0])); } },
  c3ring: ring({ R: Math.round(px(9)), c: "#e8dcc8", dark: "#5a4a30" }),
  c3drop: { cw: 100, ch: 260, ox: 50, oy: 250, frames: 8, fps: 8, draw(p, u) { const y = -240 + 200 * u * u; blendEllipse(p, 0, y, 26, 34, H(CLAY[1]), 0.95); blendDisc(p, 0, y - 36, 14, H(CLAY[1]), 0.95); p.rect(-6, y - 40, 3, 3, H("#1a1a1a")); p.rect(3, y - 40, 3, 3, H("#1a1a1a")); } },
  c3boom: burst({ R: Math.round(px(9)), c: ["#fff8d0", "#ffd060", "#e06020"], smoke: "#6a5a4a", rays: 12, frames: 12 }),
  c3crater: cracks({ R: Math.round(px(9)), c: "#2a2018", n: 22 }),
  missile: { views: true, cw: 50, ch: 30, ox: 25, oy: 15, frames: 2, fps: 10, loop: true, draw(p, u, i, view) { if (view === "side") { blendEllipse(p, 0, 0, 12, 5, H(CLAY[1]), 1); p.poly([[-10, 0], [-16, -6], [-16, 6]], H(CLAY[2])); p.dot(8, -1, H("#1a1a1a")); for (let k = 0; k < 3; k++) p.blend(-18 - k * 3, (rnd(k + i) - 0.5) * 4, H("#c8c0b0"), 0.6); } else { blendDisc(p, 0, 0, 6, H(CLAY[1]), 1); p.dot(-2, -1, H("#1a1a1a")); p.dot(2, -1, H("#1a1a1a")); } } },
  clayboom: burst({ R: 24, c: ["#fff8d0", "#ffd060", "#e06020"], smoke: "#6a5a4a", rays: 6, frames: 9 }),
  // Sasori: the chakra strings from his fingers, the fan, a puppet (with blades), the iron sand, the flame jet
  strings: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 5; k++) p.line(-4 + k * 2, 0, -2 + k * 3, -12 - 2 * Math.sin(u * 6.28 + k), H("#8ac8ff"), 0.7); } },
  pfan: { ground: true, cw: Math.ceil(px(32)) + 8, ch: Math.ceil(px(32) * 1.3) + 10, ox: 2, oy: Math.ceil(px(32) * 0.65) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = -5; k <= 5; k++) { const a = k * 0.11; for (let x = 6; x <= px(32); x += 3) if (((x / 12 - u) % 1 + 1) % 1 < 0.35) p.blend(Math.cos(a) * x, Math.sin(a) * x, H("#8ac8ff"), 0.6); } } },
  puppet: { cw: 40, ch: 50, ox: 20, oy: 30, frames: 4, fps: 12, loop: true, draw(p, u) { blendEllipse(p, 0, 0, 7, 12, H("#7a5a3a"), 1); blendDisc(p, 0, -16, 6, H("#c8b8a0"), 1); for (const s of [1, -1]) p.line(s * 6, -4, s * 16, -8 + 6 * Math.sin(u * 6.28 + s), H("#c8ccd8")); p.line(0, -22, 0, -30, H("#8ac8ff"), 0.6); } },
  cut: spark({ R: 12, c: ["#ffffff", "#c8ccd8"] }),
  iring: ring({ R: Math.round(px(6.5)), c: "#5a5a6a", dark: "#14141c" }),
  ironspikes: spikes({ R: Math.round(px(6.5)), n: 12, h: 46, c: ["#5a5a6a", "#2a2a34", "#14141c"], frames: 9 }),
  ironfloor: pool({ R: Math.round(px(6.5)), c: ["#2a2a34", "#14141c"], bubbles: "#5a5a6a", a: 0.45 }),
  nozzle: fireball({ r: 5 }),
  flane2: lane({ len: px(24), w: Math.round(px(2.6)), c: "#ffd080", dark: "#6a2a10" }),
  jet: band({ len: 22, w: 10, c: FIRE, a: 0.85 }),
  // Kakuzu: the skin turned to stone (loop), a clink; his masks' faces, the firewind, the lightning spear
  stone: aura({ c: ["#a8a098", "#6a645c", "#3a3630"], h: 74, w: 20, a: 0.4 }),
  clink: spark({ R: 10, c: ["#ffffff", "#a8a098"] }),
  masks: { cw: 90, ch: 90, ox: 45, oy: 84, frames: 4, fps: 8, loop: true, draw(p, u) { const c = [["#c83a2a", -26], ["#3a8ad0", 26], ["#e8c040", 0]]; for (const [col, x] of c) { blendDisc(p, x, -60 - (x === 0 ? 14 : 0) + Math.sin(u * 6.28 + x) * 2, 8, H(col), 0.9); p.rect(x - 4, -62 - (x === 0 ? 14 : 0), 2, 2, H("#ffffff")); p.rect(x + 2, -62 - (x === 0 ? 14 : 0), 2, 2, H("#ffffff")); } } },
  mlane: lane({ len: px(30), w: Math.round(px(5)), c: "#ffd080", dark: "#6a2a10" }),
  firewind: { cw: 50, ch: 80, ox: 25, oy: 60, frames: 6, fps: 16, loop: true, draw(p, u) { for (let k = 0; k < 14; k++) { const a = (k / 14) * 6.28 + u * 8; blendDisc(p, Math.cos(a) * 18, -20 + Math.sin(a) * 26, 8, H(FIRE[k % 3]), 0.75); } } },
  llane: lane({ len: px(34), w: 5, c: LT[1], dark: "#203050" }),
  gian: { cw: 20, ch: 16, ox: 10, oy: 8, frames: 3, fps: 18, loop: true, draw(p, u, i) { p.rect(-10, -1, 20, 3, H("#ffffff")); for (let k = 0; k < 2; k++) p.line(-10, (rnd(k + i) - 0.5) * 10, 10, (rnd(k + i + 3) - 0.5) * 10, H(LT[1]), 0.8); } },
  zap: crackle({ R: 24, c: LT, bolts: 8, core: 6 }),
  // Hidan: the line, the ritual circle (his blood on the floor), the curse (his body black and white), the wound
  lane: lane({ len: px(32), w: 8, c: "#f0d0d0", dark: "#5a1a1a" }),
  ritual: { ground: true, cw: 90, ch: 90, ox: 45, oy: 45, frames: 1, fps: 1, draw(p) { p.ring(0, 0, 36, 2, H("#a01010"), 0.95); for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.28 - 1.57, b = ((k + 1) / 3) * 6.28 - 1.57; p.line(Math.cos(a) * 34, Math.sin(a) * 34, Math.cos(b) * 34, Math.sin(b) * 34, H("#a01010"), 0.95); } } },
  curse: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 4, fps: 8, loop: true, draw(p, u) { for (let y = -78; y < 0; y += 4) p.line(-12, y, 12, y + 2, H(y % 8 === 0 ? "#1a1a1a" : "#f0f0f0"), 0.5); } },
  bleed: { cw: 40, ch: 40, ox: 20, oy: 20, frames: 6, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; blendDisc(p, (rnd(k) - 0.5) * 16, -6 + ph * 20, 2, H("#c01010"), 1 - ph); } } },
  scythe: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 4, fps: 16, loop: true, draw(p, u) { for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.28 + u * 6.28; for (let t = 0; t < 1; t += 0.04) p.blend(Math.cos(a + t) * (8 + 14 * t), Math.sin(a + t) * (8 + 14 * t), H("#e04040"), 1); } p.circle(0, 0, 4, H("#5a5a64")); } },
  cable: { cw: 120, ch: 10, ox: 0, oy: 5, frames: 1, fps: 1, draw(p) { for (let x = 0; x < 110; x += 2) p.dot(x, Math.sin(x * 0.1) * 2, H("#5a5a64")); } },
};
export const PREFIX = "ak_";

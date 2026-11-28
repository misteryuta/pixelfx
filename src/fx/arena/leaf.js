// More fighters on the 2.5D stage (2026-11-27): Kimimaro, Kabuto, Haku, Kurenai, Temari, Kankurō, Shino, Kiba,
// Tenten, Iruka. (Kurenai's Shippuden slot stays open: the duplicate rule, no documented replacement.)
// Kimimaro (Cursed Seal Stage 2): slot 1 "Dance of the Seedling Fern" (Sawarabi no Mai, Manga 216): a forest of bones
//   pierces up out of the ground. blast (waves of bone spikes at the aimed place); slot 2 "Dance of the Clematis:
//   Flower" (Tessenka no Mai: Hana, Manga 215): a bone drill on his arm. rush; slot 3 "Dance of the Larch" (Karamatsu no
//   Mai, Manga 213): bones stab out of his whole body. blast (round him)
// Kabuto (Chūnin Exams): slot 1 "Chakra Scalpel" (Chakra no Mesu, Manga 79): scalpels of chakra that cut muscles
//   under the skin. rush -> slowed; slot 2 "Temple of Nirvana" (Nehan Shōja no Jutsu, Manga 94): feathers falling,
//   whoever sees them falls asleep. state (stun, wide)
// Kabuto (Snake Cloak): slot 1 "Chakra Draining Seal" (snake-sage chakra drawn out of the target by touch): rush
//   (the touch, the target slowed) -> heal (what was drawn out)
// Haku: slot 1 "Secret Technique: Crystal Ice Mirrors" (Makyō Hyōshō, Manga 22): mirrors of ice close round the
//   target; he moves between them, needles from every side. bind (the mirrors close, needles) ; slot 2 "Thousand
//   Flying Water Needles of Death" (Sensatsu Suishō, Manga 21): needles of water from every side at once. blast
// Kurenai (Jōnin): slot 1 "Demonic Illusion: Tree Binding Death" (Magen: Jubaku Satsu, Manga 142): the target sees
//   itself bound by a tree; she comes out of the trunk behind it. state (stun) -> blink (behind, a stab); slot 2
//   "Genjutsu Petal Escape" (the caster scattering into petals): guard (swap: the kunai hit petals, she is elsewhere)
// Temari: classic slot 2 "Wind Scythe Jutsu" (Kamaitachi no Jutsu, Manga 108): one swing of the fan, a blade of wind.
//   line; shippuden slot 1 "Wind Style: Great Cast Net" (the wide wind; translation unclear, see the slot note): a wide
//   cone of cutting wind. blast (cone)
// Kankurō: classic slot 1 "Black Secret Technique: Machine One Shot" (Kuroari + Karasu, Manga 117 / 275): Black Ant
//   shuts the target inside, Crow's blades go through. bind (strings, held in the puppet) -> crush; shippuden slot 1
//   "Red Secret Technique: Machinery Triangles" (three puppets set as a triangle round the target, Manga 464): blast
// Shino: classic slot 1 "Parasitic Destruction Insect Swarm" (Kikaichū, Manga 66): a swarm crawls to the target and
//   eats its chakra. bind (the swarm, draining); shippuden slot 1 "Secret Technique: Insect Sphere" (Hijutsu: Mushidama,
//   Manga 249): a ball of insects round the target. zone (inside: blind, drained)
// Kiba: classic slot 1 "Fang Over Fang" (Gatsūga, Manga 72): Kiba and Akamaru as two spinning drills. rush (combo);
//   shippuden slot 1 "Two-Headed Wolf: Fang Passing Fang" (Sōtōrō: Garōga, Manga 279): the two as one giant wolf, one
//   huge drill. rush (bigger)
// Tenten: classic slot 1 "Rising Twin Dragons" (Sōshōryū, Manga 101): two scrolls spiral up, a rain of weapons comes
//   down. blast (waves); shippuden slot 1 "Manipulated Tools: Heavenly Chain of Destruction" (chains from a scroll bind
//   the target). bind (a chain)
// Iruka: classic slot 1 "Shurikenjutsu: Paper Bomb Trap" (tags set and blown): blast (a delay, the tags flare);
//   shippuden slot 1 "String Light Formation (Barrier Seal)" (a barrier of light round him): guard (full)
import { lane, spark, burst, shock, comet, orb, band, needle, pool, wrap, aura, mark, ring, dome, crescent, crackle, mist, poof, spikes, shuriken, kunai, coneMark, chain, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const V = {
  kim: "classic/kimimaro-cursed-seal-stage-2", kab: "classic/kabuto-yakushi-chunin-exams", kabS: "shippuden/kabuto-yakushi-snake-cloak", haku: "classic/haku-hunter-nin",
  kur: "classic/kurenai-yuhi-jonin", temC: "classic/temari-genin", temS: "shippuden/temari-wind-scythe-jonin", kanC: "classic/kankuro-genin", kanS: "shippuden/kankuro-kage-summit-jonin",
  shiC: "classic/shino-aburame-genin", shiS: "shippuden/shino-aburame-destruction-insects", kibC: "classic/kiba-inuzuka-genin", kibS: "shippuden/kiba-and-akamaru-chunin",
  tenC: "classic/tenten-genin", tenS: "shippuden/tenten-scroll-summoning-chunin", iruC: "classic/iruka-umino-academy-instructor", iruS: "shippuden/iruka-umino-chunin-instructor",
};
const BONE = ["#ffffff", "#e8e0d0", "#a89a88"], ICE = ["#ffffff", "#c8f0ff", "#6ab0d8"], WIND = ["#ffffff", "#d8f4ec", "#8ac8b0"], BUG = ["#3a3a2a", "#1c1c14", "#5a5a40"];
const mv = (variant, slot, id, stages, look, extra = {}) => ({ id, kind: "arena", variant, slot, seal: 0.4, recover: 0.4, range: 34, cone: 50, cooldown: 8, lock: 0.4, dodge: { phase: "tell", side: 7 },
  sfx: { rush_go: "whoosh", combo: "bite", impact: "burst", line_go: "whoosh", shot_go: "whoosh", blast_go: "burst", bind_go: "whoosh", hold: "bite", guard_go: "rumble", buff_go: "rumble", zone_go: "rumble", state_go: "cast", blink_go: "whoosh", heal_go: "cast" }, stages, look, ...extra });
const rush = (o) => ({ mech: "rush", aim: 0.3, tell: 0.3, speed: 50, reach: 2.4, reachMax: 32, impact: 0.35, ...o });
export const MOVES = [
  mv(V.kim, 1, "kimimaro-sawarabi", [{ mech: "blast", aim: 0.4, tell: 0.45, radius: 7, waves: 3, gap: 0.3, hit: { dmg: 9, kb: 3 }, after: 0.8, hitKind: "Sawarabi no Mai" }],
    [ aimRing("lf_bring"), L("lf_bones", "blast", ["blast_go"], { play: "once" }), L("lf_bcrack", "blast", ["blast_go"], { ground: true }) ], { dodge: { phase: "tell", back: 12 }, cooldown: 10 }),
  mv(V.kim, 2, "kimimaro-tessenka", [rush({ speed: 52, hits: 1, hit: { dmg: 28, kb: 10 }, hitKind: "Tessenka no Mai: Hana" })],
    [ hand("lf_drill", ["seal", "aim", "tell", "rush_go"], { lift: 30 }), floorTell("lf_lane"), impact("lf_bonehit", { lift: 30 }) ]),
  mv(V.kim, 3, "kimimaro-karamatsu", [{ mech: "blast", at: "self", noAim: true, radius: 4.2, hit: { dmg: 18, kb: 9 }, after: 0.6, hitKind: "Karamatsu no Mai" }],
    [ L("lf_larch", "blast", ["blast_go"], { play: "once" }) ], { seal: 0.25, lock: 0.25, dodge: { phase: "seal", back: 6 } }),
  mv(V.kab, 1, "kabuto-chakra-scalpel", [rush({ speed: 46, hits: 2, combo: 0.35, hit: { dmg: 6 }, finish: { dmg: 8, kb: 6, status: "slow", statusT: 4 }, hitKind: "Chakra no Mesu" })],
    [ hand("lf_scalpel", ["seal", "aim", "tell", "rush_go", "combo"]), floorTell("lf_lane"), impact("lf_cut", { lift: 34 }) ], { hitPop: "MUSKELN DURCHTRENNT" }),
  mv(V.kab, 2, "kabuto-nehan-shouja", [{ mech: "state", aim: 0.4, tell: 0.45, reach: 28, sight: 55, status: "stun", statusT: 3, dur: 1.2, hitKind: "Nehan Shōja" }],
    [ hand("lf_kseal", ["seal", "aim", "tell"], { lift: 34 }), L("lf_fcone", "caster", ["tell"], { ground: true, rotate: true }), L("lf_feathers", "target", ["state_go", "recover"]), L("lf_sleep", "target", ["state_go", "recover"], { lift: 76 }) ],
    { hitPop: "SCHLÄFT", dodge: { phase: "tell", back: 12 }, cooldown: 10 }),
  mv(V.kabS, 1, "kabuto-chakra-drain", [
    rush({ speed: 44, hits: 1, hit: { dmg: 8, kb: 3, status: "slow", statusT: 4 }, impact: 0.1, hitKind: "Chakra-Entzug" }),
    { mech: "heal", self: true, rate: 20, dur: 0.8, hitKind: "Chakra-Entzug" },
  ], [ atCaster("lf_snakecloak", ["seal", "aim", "tell", "rush_go", "heal_go"]), floorTell("lf_lane"), L("lf_drain", "caster", ["heal_go"]) ]),
  mv(V.haku, 1, "haku-makyou-hyoushou", [{ mech: "bind", aim: 0.35, tell: 0.35, speed: 60, follow: false, radius: 2.4, reachMax: 30, hold: 2.6, dot: 9, crush: { dmg: 6, status: "slow", statusT: 2 }, back: 60, hitKind: "Makyō Hyōshō" }],
    [ hand("lf_iceseal", ["seal", "aim", "tell"], { lift: 34 }), floorTell("lf_ilane"), L("lf_mirrors", "grab", ["hold"]), L("lf_needlesin", "grab", ["hold"], { lift: 30 }) ], { seal: 0.5, lock: 0.5, cooldown: 10 }),
  mv(V.haku, 2, "haku-sensatsu-suishou", [{ mech: "blast", aim: 0.35, tell: 0.35, radius: 4, delay: 0.3, hit: { dmg: 18, status: "slow", statusT: 1.5 }, after: 0.5, hitKind: "Sensatsu Suishō" }],
    [ hand("lf_iceseal", ["seal", "aim", "tell"], { lift: 34 }), aimRing("lf_nring"), L("lf_converge", "blast", ["blast_go"], { play: "once" }) ]),
  mv(V.kur, 1, "kurenai-jubaku-satsu", [
    { mech: "state", aim: 0.35, tell: 0.4, reach: 28, sight: 18, single: true, status: "stun", statusT: 3, dur: 0.8, hitKind: "Jubaku Satsu" },
    { mech: "blink", skipAim: true, needHit: true, to: "target", behind: 1.6, vanish: 0.2, strike: 2.8, hit: { dmg: 22, kb: 6 }, impact: 0.4, hitKind: "Jubaku Satsu" },
  ], [ hand("lf_gseal", ["seal", "aim", "tell"], { lift: 34 }), L("lf_gcone", "caster", ["tell"], { ground: true, rotate: true }), L("lf_tree", "target", ["state_go", "blink_go", "impact"], { play: "hold" }), L("lf_petals", "caster", ["blink_go"], { play: "once" }), impact("lf_stab", { lift: 36 }) ],
    { hitPop: "IM BAUM GEFANGEN", dodge: { phase: "tell", side: 10 }, cooldown: 10 }),
  mv(V.kur, 2, "kurenai-petal-escape", [{ mech: "guard", mode: "swap", radius: 3, swap: 7, dur: 3.5, hitKind: "Blütenflucht" }],
    [ atCaster("lf_petalaura", ["guard_go"]), L("lf_petalburst", "swap", ["guard_go"], { play: "once" }) ], { cooldown: 10 }),
  mv(V.temC, 2, "temari-kamaitachi", [{ mech: "line", aim: 0.3, tell: 0.35, from: 2, len: 30, speed: 50, width: 4, hold: 0.3, fade: 0.3, hit: { dmg: 16, kb: 12, kbT: 0.35 }, hitKind: "Kamaitachi" }],
    [ hand("lf_fan", ["seal", "aim", "tell"], { lift: 34 }), floorTell("lf_wlane"), L("lf_scythe", "line", ["line_go"], { rotate: true, seg: 4, lift: 26 }), L("lf_dustline", "line", ["line_go", "retract"], { ground: true, rotate: true, seg: 4 }) ], { dodge: { phase: "tell", side: 9 } }),
  mv(V.temS, 1, "temari-great-cast-net", [{ mech: "blast", at: "self", aim: 0.35, tell: 0.45, radius: 26, coneHalf: 32, hit: { dmg: 14, kb: 12, status: "slow", statusT: 2 }, after: 0.6, hitKind: "Fūton: Großes Wurfnetz" }],
    [ hand("lf_fan", ["seal", "aim", "tell"], { lift: 34 }), L("lf_wcone", "caster", ["tell"], { ground: true, rotate: true }), L("lf_net", "blast", ["blast_go"], { views: true, play: "once" }) ], { dodge: { phase: "tell", side: 16 }, cooldown: 9 }),
  mv(V.kanC, 1, "kankuro-kuroari-karasu", [{ mech: "bind", aim: 0.35, tell: 0.35, speed: 26, steer: 2, radius: 2.2, reachMax: 30, hold: 1.3, crush: { dmg: 26, kb: 4 }, crushKind: "Kugutsu no Jutsu: Karasu", back: 30, hitKind: "Kuroari" }],
    [ hand("lf_strings", ["seal", "aim", "tell", "bind_go", "hold"], { lift: 34 }), L("lf_string", "link", ["bind_go", "hold", "retract"], { rotate: true, seg: 2, lift: 34 }), L("lf_ant", "tip", ["bind_go"]), L("lf_antshut", "grab", ["hold"], { play: "hold" }), impact("lf_blades", { lift: 30 }) ], { cooldown: 10, dodge: { phase: "tell", back: 14 } }),
  mv(V.kanS, 1, "kankuro-triangles", [{ mech: "blast", aim: 0.4, tell: 0.5, radius: 4.5, delay: 0.35, hit: { dmg: 22, status: "stun", statusT: 1.5 }, after: 0.6, hitKind: "Akahigi: Kikai Sankaku" }],
    [ hand("lf_strings", ["seal", "aim", "tell"], { lift: 34 }), aimRing("lf_triring"), L("lf_puppets", "aim", ["tell", "blast_go"]), L("lf_snap", "blast", ["blast_go"], { play: "once" }) ], { dodge: { phase: "tell", side: 9 }, cooldown: 10 }),
  mv(V.shiC, 1, "shino-kikaichuu", [{ mech: "bind", aim: 0.35, tell: 0.35, speed: 16, steer: 3, radius: 2, reachMax: 30, hold: 2.6, dot: 6, crush: { dmg: 2, status: "slow", statusT: 3 }, back: 20, hitKind: "Kikaichū" }],
    [ hand("lf_bugs", ["seal", "aim", "tell", "bind_go", "hold"], { lift: 34 }), L("lf_swarmtrail", "link", ["bind_go", "hold", "retract"], { ground: true, rotate: true, seg: 2.4 }), L("lf_swarm", "tip", ["bind_go"]), L("lf_cover", "grab", ["hold"]) ], { dodge: { phase: "tell", back: 14 } }),
  mv(V.shiS, 1, "shino-mushidama", [{ mech: "zone", aim: 0.35, tell: 0.45, radius: 5, dur: 3, dot: 6, status: "blind", hitKind: "Mushidama" }],
    [ hand("lf_bugs", ["seal", "aim", "tell"], { lift: 34 }), aimRing("lf_bring"), L("lf_sphere", "zone", ["zone_go"]), L("lf_bugfloor", "zone", ["zone_go"], { ground: true }) ], { dodge: { phase: "tell", back: 10 }, cooldown: 10 }),
  mv(V.kibC, 1, "kiba-gatsuuga", [rush({ speed: 58, hits: 3, combo: 0.5, hit: { dmg: 7, kb: 2 }, finish: { dmg: 10, kb: 12 }, hitKind: "Gatsūga" })],
    [ floorTell("lf_lane"), L("lf_drills", "caster", ["rush_go", "combo"], { views: true }), impact("cm_landing") ]),
  mv(V.kibS, 1, "kiba-garouga", [rush({ speed: 54, reach: 3.4, hits: 4, combo: 0.7, hit: { dmg: 7, kb: 2 }, finish: { dmg: 16, kb: 16 }, hitKind: "Garōga" })],
    [ L("lf_wolf", "caster", ["seal", "aim", "tell"], { views: true }), floorTell("lf_lane"), L("lf_bigdrill", "caster", ["rush_go", "combo"], { views: true }), impact("cm_landing"), impact("lf_crater") ], { seal: 0.55, lock: 0.55, shake: 1.8 }),
  mv(V.tenC, 1, "tenten-soushouryuu", [{ mech: "blast", aim: 0.4, tell: 0.45, radius: 5, waves: 3, gap: 0.3, delay: 0.3, hit: { dmg: 8, kb: 2 }, after: 0.6, hitKind: "Sōshōryū" }],
    [ atCaster("lf_scrolls", ["seal", "aim", "tell", "blast_go"]), aimRing("lf_wring"), L("lf_rain", "blast", ["blast_go"]), L("lf_stuck", "blast", ["blast_go"], { ground: true }) ], { dodge: { phase: "tell", back: 10 } }),
  mv(V.tenS, 1, "tenten-heavenly-chain", [{ mech: "bind", aim: 0.3, tell: 0.3, speed: 44, follow: false, radius: 2, reachMax: 30, hold: 2.2, dot: 4, crush: { dmg: 8, status: "stun", statusT: 1 }, back: 50, hitKind: "Kusari" }],
    [ hand("lf_scroll", ["seal", "aim", "tell"], { lift: 34 }), floorTell("lf_clane"), L("lf_chain", "link", ["bind_go", "hold", "retract"], { rotate: true, seg: 1.6, lift: 30 }), L("lf_chainwrap", "grab", ["hold"]) ]),
  mv(V.iruC, 1, "iruka-paper-bomb", [{ mech: "blast", aim: 0.3, tell: 0.4, radius: 5, delay: 0.7, hit: { dmg: 22, kb: 12 }, after: 0.6, hitKind: "Kibaku Fuda" }],
    [ aimRing("lf_tagring"), L("lf_tags", "aim", ["tell", "blast_go"], { ground: true }), L("cm_explo", "blast", ["blast_go"], { play: "once" }) ], { dodge: { phase: "tell", back: 10 } }),
  mv(V.iruS, 1, "iruka-barrier", [{ mech: "guard", mode: "full", radius: 4.4, dur: 4, hitKind: "Kekkai" }],
    [ atCaster("lf_barrier", ["guard_go"]), atCaster("lf_bfloor", ["guard_go"], { ground: true }), L("lf_bspark", "block", ["guard_go"], { play: "once", lift: 30 }) ], { cooldown: 10 }),
];

// two drills (Kiba and Akamaru) / one big one: seen from the side (spinning along +x), front, back (loop)
function drill(p, u, view, big) {
  const R = big ? 26 : 14, n = big ? 1 : 2, c1 = H("#e8e0d0"), c2 = H("#8a7a6a"), c3 = H("#4a3a30");
  for (let k = 0; k < n; k++) {
    const oy = big ? -34 : -26 - k * 4, ox = big ? 0 : (view === "side" ? (k ? -12 : 10) : (k ? -16 : 16));
    if (view === "side") { for (let x = -R * 1.4; x <= R * 0.8; x++) { const w = R * (1 - Math.abs(x) / (R * 1.5)); for (let y = -w; y <= w; y++) p.blend(ox + x, oy + y, ((Math.floor(x * 0.4 + y * 0.6 + u * 12)) % 3 === 0) ? c1 : c2, 0.85); } }
    else { for (let t = 0; t < 6.28; t += 0.02) for (let r = 2; r < R; r += 2) p.blend(ox + Math.cos(t + u * 6.28 + r * 0.2) * r, oy + Math.sin(t + u * 6.28 + r * 0.2) * r * 0.9, r > R - 3 ? c3 : ((r + Math.floor(t * 3)) % 2 ? c1 : c2), 0.8); }
  }
}
export const FX = {
  bring: ring({ R: Math.round(px(7)), c: "#f0e8d8", dark: "#5a4a3a" }),
  bones: spikes({ R: Math.round(px(7)), n: 11, h: 54, c: BONE, frames: 9 }),
  bcrack: pool({ R: Math.round(px(7)), c: ["#5a4a3a", "#3a2a20"], bubbles: "#8a7a6a", a: 0.3 }),
  drill: { cw: 40, ch: 30, ox: 6, oy: 15, frames: 4, fps: 16, loop: true, draw(p, u) { for (let x = 0; x <= 26; x++) { const w = 6 * (1 - x / 28); for (let y = -w; y <= w; y++) p.blend(x, y, H(((Math.floor(x * 0.5 + y + u * 10)) % 3 === 0) ? BONE[2] : BONE[1]), 0.95); } } },
  lane: lane({ len: px(32), w: 8, c: "#f0f0e8", dark: "#4a4a3a" }),
  bonehit: burst({ R: 26, c: BONE, smoke: "#a89a88", rays: 6, frames: 8 }),
  larch: { cw: 120, ch: 100, ox: 60, oy: 80, frames: 8, fps: 16, draw(p, u) { const k = Math.min(1, u * 3), a = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1; for (let s = 0; s < 14; s++) { const ang = (s / 14) * 6.28, L0 = (26 + 14 * rnd(s)) * k; p.line(Math.cos(ang) * 8, -36 + Math.sin(ang) * 14, Math.cos(ang) * L0, -36 + Math.sin(ang) * L0 * 0.7, H(BONE[1]), a); p.line(Math.cos(ang) * 8 + 1, -36 + Math.sin(ang) * 14, Math.cos(ang) * L0 + 1, -36 + Math.sin(ang) * L0 * 0.7, H(BONE[2]), a * 0.7); } } },
  scalpel: { cw: 30, ch: 20, ox: 8, oy: 10, frames: 4, fps: 12, loop: true, draw(p, u) { for (let x = 0; x < 16; x++) p.blend(x, 0, H("#a0f0c0"), 0.8 + 0.2 * Math.sin(u * 6.28)); blendEllipse(p, 8, 0, 9, 3, H("#60c890"), 0.35); } },
  cut: spark({ R: 14, c: ["#ffffff", "#a0f0c0"] }),
  kseal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H("#e8e0f0"), 1 - ph); } } },
  fcone: coneMark({ len: px(28), half: 55, c: "#f0f0f8", dark: "#4a4a5a" }),
  feathers: { cw: 80, ch: 110, ox: 40, oy: 100, frames: 8, fps: 8, loop: true, draw(p, u) { for (let k = 0; k < 12; k++) { const ph = (u + rnd(k)) % 1, x = (rnd(k + 1) - 0.5) * 60 + Math.sin(ph * 8 + k) * 6, y = -100 + ph * 96; blendEllipse(p, x, y, 3, 1.5, H("#ffffff"), 1 - ph * 0.5); p.dot(x - 2, y, H("#c8c8d8")); } } },
  sleep: mark({ kind: "stars", c: ["#ffffff", "#c8c8ff"], R: 10 }),
  snakecloak: aura({ c: ["#e8e0f0", "#9a8ab0", "#4a3a5a"], h: 76, w: 24, a: 0.35 }),
  drain: { cw: 70, ch: 90, ox: 35, oy: 84, frames: 6, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 10; k++) { const ph = (u + rnd(k)) % 1; blendDisc(p, (rnd(k + 1) - 0.5) * 40 * (1 - ph), -40 + (rnd(k + 2) - 0.5) * 40 * (1 - ph), 3, H("#a0f0c0"), 1 - ph); } } },
  iceseal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H(ICE[1]), 1 - ph); } } },
  ilane: lane({ len: px(30), w: 6, c: ICE[1], dark: ICE[2] }),
  mirrors: { cw: 110, ch: 110, ox: 55, oy: 100, frames: 6, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28 + u * 0.4, x = Math.cos(a) * 40, y = Math.sin(a) * 12; if (Math.sin(a) < -0.3) continue; for (let yy = -70; yy <= 0; yy++) for (let xx = -7; xx <= 7; xx++) p.blend(x + xx, y + yy, H(Math.abs(xx) > 5 || yy < -68 ? ICE[2] : (xx + yy * 0.5) % 9 === 0 ? ICE[0] : ICE[1]), 0.55); } } },
  needlesin: { cw: 90, ch: 60, ox: 45, oy: 30, frames: 4, fps: 16, loop: true, draw(p, u, i) { for (let k = 0; k < 8; k++) { const a = rnd(k + i * 3) * 6.28, d = 36 * (1 - ((u + rnd(k)) % 1)); p.line(Math.cos(a) * d, Math.sin(a) * d * 0.6, Math.cos(a) * (d + 8), Math.sin(a) * (d + 8) * 0.6, H(ICE[0]), 0.9); } } },
  nring: ring({ R: Math.round(px(4)), c: ICE[1], dark: ICE[2] }),
  converge: { cw: 110, ch: 110, ox: 55, oy: 80, frames: 8, fps: 16, draw(p, u) { const a = u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1; for (let k = 0; k < 24; k++) { const ang = (k / 24) * 6.28, d = 50 * (1 - Math.min(1, u * 1.4)) + 4; p.line(Math.cos(ang) * d, -30 + Math.sin(ang) * d * 0.7, Math.cos(ang) * (d + 10), -30 + Math.sin(ang) * (d + 10) * 0.7, H(k % 2 ? ICE[0] : ICE[1]), a); } } },
  gseal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H("#e86a8a"), 1 - ph); } } },
  gcone: coneMark({ len: px(28), half: 25, c: "#f0a0c0", dark: "#5a1a3a" }),
  tree: { cw: 80, ch: 130, ox: 40, oy: 122, frames: 6, fps: 10, draw(p, u) { const k = Math.min(1, u * 2); for (let y = 0; y >= -110 * k; y--) { const w = 9 - y * 0.02; for (let x = -w; x <= w; x++) p.blend(x + Math.sin(y * 0.05) * 4, y, H(Math.abs(x) > w - 2 ? "#3a2a1a" : "#6a4a2a"), 0.9); } for (let b = 0; b < 4; b++) { const by = -30 - b * 18; for (let t = 0; t < 1; t += 0.05) { const x = (b % 2 ? 1 : -1) * 22 * t, y = by + Math.sin(t * 3) * 6; blendDisc(p, x, y, 2.5, H("#5a3a1a"), 0.9 * k); } } } },
  petals: { cw: 70, ch: 90, ox: 35, oy: 80, frames: 8, fps: 14, draw(p, u) { for (let k = 0; k < 18; k++) { const a = rnd(k) * 6.28, d = 30 * u * (0.5 + rnd(k + 1)); blendEllipse(p, Math.cos(a) * d, -40 + Math.sin(a) * d - 20 * u, 2.5, 1.5, H(k % 2 ? "#f0a0c0" : "#e85a8a"), 1 - u); } } },
  stab: spark({ R: 16, c: ["#ffffff", "#f0c0d0"] }),
  petalaura: mark({ kind: "petals", c: ["#f0a0c0", "#e85a8a"], R: 22 }),
  petalburst: { cw: 80, ch: 100, ox: 40, oy: 90, frames: 9, fps: 14, draw(p, u) { for (let k = 0; k < 24; k++) { const a = rnd(k) * 6.28, d = 36 * u * (0.4 + rnd(k + 1)); blendEllipse(p, Math.cos(a) * d, -46 + Math.sin(a) * d * 0.8 + 20 * u * u, 2.5, 1.5, H(k % 2 ? "#f0a0c0" : "#e85a8a"), 1 - u * 0.8); } } },
  fan: { cw: 40, ch: 40, ox: 20, oy: 30, frames: 4, fps: 10, loop: true, draw(p, u) { for (let t = -0.8; t <= 0.8; t += 0.05) p.line(0, 0, Math.cos(t - 1.57 + u * 0.4) * 24, Math.sin(t - 1.57 + u * 0.4) * 24, H(t > 0.4 ? "#c83a2a" : "#e8e0d0"), 0.9); } },
  wlane: lane({ len: px(30), w: Math.round(px(4)), c: WIND[1], dark: "#3a6a5a" }),
  scythe: crescent({ R: 22, c: WIND }),
  dustline: band({ len: 30, w: 10, c: ["#e8dcc8", "#c8b898", "#8a7a5a"], a: 0.25 }),
  wcone: coneMark({ len: px(26), half: 32, c: WIND[1], dark: "#3a6a5a" }),
  net: { views: true, cw: 260, ch: 140, ox: 20, oy: 100, frames: 8, fps: 14, draw(p, u, i, view) { const a = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1, k = Math.min(1, u * 2); for (let s = 0; s < 14; s++) { const ang = (s / 13 - 0.5) * 1.1; const L0 = 230 * k * (0.7 + 0.3 * rnd(s)); if (view === "side") { for (let t = 0; t < L0; t += 3) p.blend(t, -40 + Math.sin(ang) * t * 0.3 + Math.sin(t * 0.1 + s) * 3, H(s % 3 ? WIND[1] : WIND[0]), 0.7 * a); } else { const sx = Math.sin(ang) * 230 * k, top = view === "front" ? 1 : -1; p.line(110 + sx * 0.5 - 90, -40, 110 + sx - 90, -40 + top * 30 * k, H(s % 3 ? WIND[1] : WIND[0]), 0.7 * a); } } } },
  strings: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 5; k++) p.line(-4 + k * 2, 0, -2 + k * 3, -12 - 2 * Math.sin(u * 6.28 + k), H("#8ac8ff"), 0.7); } },
  string: { cw: 20, ch: 8, ox: 10, oy: 4, frames: 1, fps: 1, draw(p) { p.line(-10, 0, 10, 0, H("#8ac8ff"), 0.7); p.line(-10, 2, 10, 2, H("#8ac8ff"), 0.4); } },
  ant: { cw: 50, ch: 60, ox: 25, oy: 54, frames: 4, fps: 10, loop: true, draw(p, u) { blendEllipse(p, 0, -24, 16, 22, H("#2a2a30"), 0.95); for (let k = 0; k < 3; k++) p.line(-14, -20 + k * 8, -22, -14 + k * 8 + 2 * Math.sin(u * 6.28 + k), H("#2a2a30")); p.rect(-4, -40, 8, 3, H("#c8c8d0")); } },
  antshut: { cw: 60, ch: 100, ox: 30, oy: 94, frames: 6, fps: 10, draw(p, u) { const k = Math.min(1, u * 2); blendEllipse(p, 0, -44, 20, 40 * (0.5 + 0.5 * k), H("#2a2a30"), 0.95); p.line(0, -84, 0, -4, H("#5a5a64"), 0.9 * k); for (let s = 0; s < 4; s++) p.rect(-10 + s * 6, -50, 2, 6, H("#c8c8d0")); } },
  blades: { cw: 80, ch: 100, ox: 40, oy: 70, frames: 7, fps: 18, draw(p, u) { const a = 1 - u; for (let k = 0; k < 6; k++) { const ang = (k / 6) * 6.28; p.line(Math.cos(ang) * 40 * (1 - u), Math.sin(ang) * 30 * (1 - u), Math.cos(ang) * 8, Math.sin(ang) * 6, H("#c8ccd8"), a); } } },
  triring: ring({ R: Math.round(px(4.5)), c: "#8ac8ff", dark: "#2a3a5a" }),
  puppets: { cw: 160, ch: 100, ox: 80, oy: 90, frames: 4, fps: 8, loop: true, draw(p, u) { for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.28 - 1.57, x = Math.cos(a) * 60, y = Math.sin(a) * 20; blendEllipse(p, x, y - 26, 10, 24, H(["#5a3a2a", "#2a2a30", "#3a4a5a"][k]), 0.95); blendDisc(p, x, y - 54, 8, H("#c8b8a0"), 0.95); } for (let k = 0; k < 3; k++) { const a0 = (k / 3) * 6.28 - 1.57, a1 = ((k + 1) / 3) * 6.28 - 1.57; p.line(Math.cos(a0) * 60, Math.sin(a0) * 20 - 30, Math.cos(a1) * 60, Math.sin(a1) * 20 - 30, H("#8ac8ff"), 0.6); } } },
  snap: burst({ R: 32, c: ["#ffffff", "#c8ccd8", "#5a5a64"], smoke: "#5a5a64", rays: 8 }),
  bugs: { cw: 40, ch: 40, ox: 20, oy: 20, frames: 4, fps: 14, loop: true, draw(p, u, i) { for (let k = 0; k < 14; k++) { const a = rnd(k + i) * 6.28, r = 4 + 10 * rnd(k + 2); p.dot(Math.cos(a) * r, Math.sin(a) * r, H(BUG[k % 3])); } } },
  swarmtrail: { ground: true, cw: 24, ch: 20, ox: 12, oy: 10, frames: 4, fps: 14, loop: true, draw(p, u, i) { for (let k = 0; k < 20; k++) p.dot((rnd(k + i * 3) - 0.5) * 22, (rnd(k + i * 3 + 9) - 0.5) * 14, H(BUG[k % 3])); } },
  swarm: { cw: 50, ch: 50, ox: 25, oy: 40, frames: 4, fps: 14, loop: true, draw(p, u, i) { for (let k = 0; k < 40; k++) { const a = rnd(k + i) * 6.28, r = 16 * rnd(k + 5); p.dot(Math.cos(a) * r, -14 + Math.sin(a) * r * 0.7, H(BUG[k % 3])); } } },
  cover: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 4, fps: 14, loop: true, draw(p, u, i) { for (let k = 0; k < 90; k++) { const y = -80 * rnd(k + i * 7), x = (rnd(k + i * 7 + 3) - 0.5) * 30; p.dot(x, y, H(BUG[k % 3])); } } },
  sphere: { cw: 90, ch: 100, ox: 45, oy: 92, frames: 4, fps: 14, loop: true, draw(p, u, i) { for (let k = 0; k < 260; k++) { const a = rnd(k + i * 11) * 6.28, b = rnd(k + i * 11 + 4) * 3.14, r = 34; p.dot(Math.cos(a) * Math.sin(b) * r, -40 + Math.cos(b) * r, H(BUG[k % 3])); } } },
  bugfloor: pool({ R: Math.round(px(5)), c: ["#2a2a1c", "#14140c"], bubbles: "#5a5a40", a: 0.5 }),
  drills: { views: true, cw: 80, ch: 70, ox: 40, oy: 64, frames: 4, fps: 16, loop: true, draw(p, u, i, view) { drill(p, u, view, false); } },
  bigdrill: { views: true, cw: 100, ch: 90, ox: 50, oy: 84, frames: 4, fps: 16, loop: true, draw(p, u, i, view) { drill(p, u, view, true); } },
  wolf: { views: true, cw: 100, ch: 100, ox: 50, oy: 94, frames: 4, fps: 8, loop: true, draw(p, u, i, view) { blendEllipse(p, 0, -40, view === "side" ? 40 : 26, 30, H("#e8e4dc"), 0.45); for (const s of [1, -1]) blendDisc(p, view === "side" ? 30 : s * 14, -66, 8, H("#e8e4dc"), 0.5); } },
  dust: burst({ R: 26, c: ["#e8dcc8", "#b8a888", "#8a7a5a"], smoke: "#8a7a5a", frames: 9 }),
  crater: pool({ R: 36, c: ["#5a4a3a", "#3a2a20"], bubbles: "#8a7a6a", a: 0.4 }),
  scrolls: { cw: 80, ch: 130, ox: 40, oy: 124, frames: 6, fps: 10, loop: true, draw(p, u) { for (const s of [1, -1]) for (let t = 0; t < 1; t += 0.02) { const y = -t * 110, x = s * (10 + Math.sin(t * 12 + u * 6.28 * s) * 12); blendDisc(p, x, y, 3, H(t > 0.5 ? "#e8e0d0" : "#c83a2a"), 0.9); } } },
  wring: ring({ R: Math.round(px(5)), c: "#c8ccd8", dark: "#3a3a48" }),
  rain: { cw: 90, ch: 140, ox: 45, oy: 130, frames: 6, fps: 16, loop: true, draw(p, u, i) { for (let k = 0; k < 12; k++) { const ph = (u + rnd(k + i)) % 1, x = (rnd(k + 3) - 0.5) * 70, y = -130 + ph * 128; p.line(x, y, x + 2, y + 10, H(k % 2 ? "#c8ccd8" : "#8a92a0")); } } },
  stuck: { ground: true, cw: 80, ch: 80, ox: 40, oy: 40, frames: 1, fps: 1, draw(p) { for (let k = 0; k < 14; k++) { const a = rnd(k) * 6.28, r = 30 * Math.sqrt(rnd(k + 2)); p.rect(Math.cos(a) * r - 1, Math.sin(a) * r - 1, 3, 2, H("#5a5a64")); } } },
  scroll: { cw: 30, ch: 20, ox: 15, oy: 10, frames: 1, fps: 1, draw(p) { p.rect(-10, -3, 20, 6, H("#e8e0d0")); p.rect(-12, -4, 3, 8, H("#c83a2a")); p.rect(9, -4, 3, 8, H("#c83a2a")); } },
  clane: lane({ len: px(30), w: 4, c: "#c8ccd8", dark: "#3a3a48" }),
  chain: chain({ len: 12 }),
  chainwrap: wrap({ c: ["#c8ccd8", "#8a92a0", "#3a3a48"], h: 60, w: 15, rings: 4, a: 0.95 }),
  tagring: ring({ R: Math.round(px(5)), c: "#f0e8c0", dark: "#5a4a10" }),
  tags: { ground: true, cw: 80, ch: 80, ox: 40, oy: 40, frames: 2, fps: 6, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28, r = 22; p.rect(Math.cos(a) * r - 3, Math.sin(a) * r - 5, 6, 10, H(u > 0.5 ? "#fff0a0" : "#f0e8c0")); p.rect(Math.cos(a) * r - 1, Math.sin(a) * r - 3, 2, 6, H("#c83a2a")); } } },
  boom: burst({ R: 44, c: ["#fff8d0", "#ffb030", "#e0401a"], smoke: "#4a3a34", rays: 6, frames: 11 }),
  barrier: dome({ R: Math.round(px(4.4)), c: ["#fffff0", "#f0f0a0", "#c8c050"], a: 0.3, h: 1 }),
  bfloor: { ground: true, cw: Math.ceil(px(4.4) * 2) + 6, ch: Math.ceil(px(4.4) * 2) + 6, ox: Math.ceil(px(4.4)) + 3, oy: Math.ceil(px(4.4)) + 3, frames: 4, fps: 8, loop: true, draw(p, u) { const R = px(4.4); p.ring(0, 0, R, 2, H("#c8c050"), 0.8); for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + u * 1.57; p.rect(Math.cos(a) * R - 3, Math.sin(a) * R - 3, 6, 6, H("#fff0a0")); } } },
  bspark: spark({ R: 12, c: ["#ffffff", "#f0f0a0"] }),
};
export const PREFIX = "lf_";

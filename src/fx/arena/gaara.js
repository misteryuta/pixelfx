// Gaara on the 2.5D stage (2026-11-27).
// Classic (Chūnin Exams / Shukaku):
//   slot 1 "Sand Coffin & Sand Burial" (Sabaku Kyū + Sabaku Sōsō, Manga 66 / Anime 32, against Lee; Narutopedia): the
//     sand runs over the ground to the target and closes round it completely; the closed shape holds a moment; Gaara
//     clenches his hand and the sand crushes it (the main hit, with a dull sound), then the sand runs back down.
//     one move, two phases: bind (the sand closing, held) -> crush (at the end of the hold) -> retract
//   slot 2 "Playing Possum (Mini-Shukaku)" (Tanuki Neiri no Jutsu, Manga 133 / Anime 75): Gaara falls asleep and
//     Shukaku takes over; from the sand body comes the Wind Style: Air Bullet (Renkūdan).
//     buff (asleep: the sand rises round him, more damage) -> shot (a big air bullet that bursts)
//   slot 3 "Sand Shield" (Suna no Tate, Manga 66): the sand in the gourd moves by itself to stop every attack.
//     guard (full: from any side), the sand rising where a kunai comes in
// Shippuden (Fifth Kazekage):
//   slot 1 "Sand Tsunami" (Ryūsa Bakuryū, Quicksand Waterfall Flow, Manga 247 / Anime Shippuden 3): a mass of sand
//     rises and rolls over the ground in a wide wave. line (wide, rolling)
//   slot 2 "Grand Sand Mausoleum Seal" (Sabaku Taisō Fūin, Manga 255 / Anime Shippuden 8, against Deidara's arm): the
//     sand wraps the target and seals it inside a pyramid of sand. bind -> crush (sealed)
//   slot 3 "Absolute Sand Shield" (Zettai Bōgyo: Shukaku no Tate, Manga 257 / Anime Shippuden 5): a sphere of sand
//     shaped like Shukaku round him, holding against everything. guard (full, longer)
import { pool, wrap, burst, dome, band, lane, ring, poof, fireball, comet, shock, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const S = ["#f0dcb0", "#c8a870", "#8a6a40"];
const V = "classic/gaara-chunin-exams-shukaku", K = "shippuden/gaara-fifth-kazekage";
export const MOVES = [
  { id: "gaara-sabaku-sousou", kind: "arena", variant: V, slot: 1,
    seal: 0.35, recover: 0.5, range: 34, cone: 50, cooldown: 8, lock: 0.35, shake: 1.4, hitPop: "UMSCHLOSSEN",
    stages: [{ mech: "bind", aim: 0.35, tell: 0.4, speed: 22, steer: 2.2, radius: 1.8, reachMax: 30, hold: 1.4, dot: 0, crush: { dmg: 30, kb: 2 }, crushKind: "Sabaku Sōsō", back: 26, hitKind: "Sabaku Kyū" }],
    dodge: { phase: "tell", back: 14 },
    sfx: { bind_go: "rumble", hold: "bite", retract: "burst" },
    look: [
      hand("ga_hand", ["aim", "tell", "bind_go", "hold"], { lift: 34 }),
      L("ga_flow", "link", ["bind_go", "hold", "retract"], { ground: true, rotate: true, seg: 2.4 }),
      L("ga_head", "tip", ["bind_go"]),
      L("ga_coffin", "grab", ["hold"], { play: "hold" }),
      impact("ga_crush"),
      impact("ga_trickle"),
    ] },
  { id: "gaara-tanuki-neiri", kind: "arena", variant: V, slot: 2,
    seal: 0.35, recover: 0.4, range: 36, cone: 50, cooldown: 10, lock: 0.35, shake: 1.2,
    stages: [
      { mech: "buff", dur: 6, dmgMult: 1.3, show: 0.9, buffName: "Shukaku", hitKind: "Tanuki Neiri" },
      { mech: "shot", aim: 0.3, tell: 0.3, from: 2.5, speed: 30, radius: 2.4, burst: 5, hit: { dmg: 24, kb: 12 }, impact: 0.5, hitKind: "Renkūdan" },
    ],
    dodge: { phase: "tell", side: 7 },
    sfx: { buff_go: "rumble", shot_go: "whoosh", impact: "burst" },
    look: [
      atCaster("ga_sleep", ["buff_go", "aim", "tell", "shot_go"]),
      floorTell("ga_alane"),
      proj("ga_bullet", { lift: 34 }),
      impact("ga_airburst"),
    ] },
  { id: "gaara-suna-no-tate", kind: "arena", variant: V, slot: 3,
    seal: 0.2, recover: 0.3, range: 30, cone: 180, cooldown: 8, lock: 0.2,
    stages: [{ mech: "guard", mode: "full", radius: 3.6, dur: 3.5, hitKind: "Sandschild" }],
    sfx: { guard_go: "rumble" },
    look: [
      atCaster("ga_ring", ["guard_go"], { ground: true }),
      L("ga_wall", "block", ["guard_go"], { play: "once" }),
    ] },
  { id: "gaara-ryuusa-bakuryuu", kind: "arena", variant: K, slot: 1,
    seal: 0.5, recover: 0.4, range: 34, cone: 60, cooldown: 9, lock: 0.5, shake: 1.6,
    stages: [{ mech: "line", aim: 0.3, tell: 0.45, from: 2, len: 30, speed: 24, width: 4.5, hold: 0.4, fade: 0.4, hit: { dmg: 22, kb: 14, kbT: 0.4 }, hitKind: "Sandtsunami" }],
    dodge: { phase: "tell", side: 8 },
    sfx: { line_go: "rumble", retract: "burst" },
    look: [
      hand("ga_hand", ["seal", "aim", "tell"], { lift: 34 }),
      floorTell("ga_tlane"),
      L("ga_wave", "line", ["line_go"], { rotate: true, seg: 3.2, lift: 0 }),
      L("ga_sandbed", "line", ["line_go", "retract"], { ground: true, rotate: true, seg: 3.2 }),
      L("ga_crest", "line", ["line_go"], { head: true, lift: 0 }),
    ] },
  { id: "gaara-sabaku-taisou-fuuin", kind: "arena", variant: K, slot: 2,
    seal: 0.5, recover: 0.5, range: 32, cone: 50, cooldown: 10, lock: 0.5, shake: 1.4, hitPop: "VERSIEGELT",
    stages: [{ mech: "bind", aim: 0.35, tell: 0.4, speed: 24, steer: 2, radius: 1.8, reachMax: 30, hold: 1.6, crush: { dmg: 16, status: "seal", statusT: 8 }, crushKind: "Sabaku Taisō Fūin", back: 30, hitKind: "Sabaku Kyū" }],
    dodge: { phase: "tell", back: 14 },
    sfx: { bind_go: "rumble", hold: "bite", retract: "rumble" },
    look: [
      hand("ga_hand", ["aim", "tell", "bind_go", "hold"], { lift: 34 }),
      L("ga_flow", "link", ["bind_go", "hold", "retract"], { ground: true, rotate: true, seg: 2.4 }),
      L("ga_head", "tip", ["bind_go"]),
      L("ga_coffin", "grab", ["hold"], { play: "hold" }),
      impact("ga_pyramid", { play: "hold" }),
    ] },
  { id: "gaara-shukaku-shield", kind: "arena", variant: K, slot: 3,
    seal: 0.3, recover: 0.4, range: 30, cone: 180, cooldown: 12, lock: 0.3,
    stages: [{ mech: "guard", mode: "full", radius: 4.2, dur: 5, hitKind: "Absoluter Sandschild" }],
    sfx: { guard_go: "rumble" },
    look: [
      atCaster("ga_sphere", ["guard_go"]),
      L("ga_wall", "block", ["guard_go"], { play: "once" }),
    ] },
];

export const FX = {
  // his hand out, the sand gathering under it (loop)
  hand: { cw: 34, ch: 34, ox: 17, oy: 17, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28 + u * 6.28; p.blend(Math.cos(a) * (8 + 2 * Math.sin(k)), Math.sin(a) * 4 + 6, H(S[k % 3]), 0.9); } } },
  // the sand running over the floor (a piece, pointing +x), its rounded head
  flow: { ground: true, cw: 26, ch: 22, ox: 13, oy: 11, frames: 4, fps: 12, loop: true, draw(p, u) { for (let x = -12; x <= 12; x++) { const w = 8 + 1.5 * Math.sin((x / 12 + u) * 6.28); for (let y = -w; y <= w; y++) p.blend(x, y, H(Math.abs(y) > w - 2 ? S[2] : (x + y * 3 + Math.floor(u * 8)) % 5 === 0 ? S[0] : S[1]), 0.88); } } },
  head: { cw: 40, ch: 34, ox: 20, oy: 30, frames: 4, fps: 12, loop: true, draw(p, u) { blendEllipse(p, 0, -6, 14, 8 + 2 * Math.sin(u * 6.28), H(S[1]), 0.9); for (let k = 0; k < 8; k++) p.blend((rnd(k) - 0.5) * 24, -10 - ((u + rnd(k + 2)) % 1) * 18, H(S[0]), 0.9); } },
  // the coffin: the sand climbs and closes over the whole figure, then holds (once, held at the end)
  coffin: { cw: 60, ch: 100, ox: 30, oy: 94, frames: 8, fps: 10, draw(p, u) {
    const top = -88 * Math.min(1, u * 1.4);
    for (let y = 0; y >= top; y--) { const q = y / -88, w = 15 + 3 * Math.sin(q * 9) - (q > 0.85 ? (q - 0.85) * 60 : 0); for (let x = -w; x <= w; x++) p.blend(x, y, H(Math.abs(x) > w - 2 ? S[2] : (Math.floor(x + y * 0.7 + u * 10) % 6 === 0) ? S[0] : S[1]), 0.96); }
  } },
  // the crush: sand bursting out of the coffin, with dust (once)
  crush: burst({ R: 34, c: [S[0], S[1], S[2]], smoke: "#b89a70", frames: 9, fps: 16 }),
  // after: the sand runs down to the ground and away (once)
  trickle: { cw: 80, ch: 100, ox: 40, oy: 94, frames: 10, fps: 12, draw(p, u) { for (let k = 0; k < 24; k++) { const x = (rnd(k) - 0.5) * 34, y0 = -90 * rnd(k + 5); const y = Math.min(0, y0 + 120 * u * u); p.blend(x + (rnd(k + 9) - 0.5) * 30 * u, y, H(S[k % 3]), 1 - u * 0.6); } blendEllipse(p, 0, -2, 22 + 14 * u, 5, H(S[1]), 0.6 * (1 - u)); } },
  // Playing Possum: asleep, sand rising round him in a swirl, Shukaku's eye mark glowing (loop)
  sleep: wrap({ c: [S[0], S[1], "#5a3a2a"], h: 84, w: 22, rings: 5, a: 0.8 }),
  alane: lane({ len: px(30), w: 12, c: "#e8f0ff", dark: "#405060" }),
  bullet: comet({ len: 46, r: 12, c: ["#ffffff", "#e0eef8", "#a8bccc"], kind: "water" }),
  airburst: burst({ R: 40, c: ["#ffffff", "#e8f0f8", "#b0c4d4"], smoke: "#c8b890", rays: 10 }),
  // Sand Shield: the sand stirred on the floor round him (loop), the wall that rises where a kunai comes (once)
  ring: pool({ R: Math.round(px(3.6)), c: [S[1], S[2]], bubbles: S[0], a: 0.35 }),
  wall: { cw: 50, ch: 90, ox: 25, oy: 84, frames: 8, fps: 16, draw(p, u) { const k = Math.min(1, u * 3), a = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1; for (let y = 0; y >= -76 * k; y--) { const w = 14 - Math.abs(y + 38) * 0.12; for (let x = -w; x <= w; x++) p.blend(x, y, H(Math.abs(x) > w - 2 ? S[2] : ((x * 3 + y) % 7 === 0) ? S[0] : S[1]), a * 0.95); } } },
  // Sand Tsunami: the line (tell), the rolling wall of sand (a piece), the sand bed it leaves, its crest at the front
  tlane: lane({ len: px(30), w: Math.round(px(4.5)), c: S[0], dark: S[2] }),
  wave: { cw: 40, ch: 70, ox: 20, oy: 64, frames: 4, fps: 10, loop: true, draw(p, u) { for (let x = -18; x <= 18; x++) { const h = 40 + 14 * Math.sin((x / 18 + u) * 6.28) + 8 * Math.sin(x * 0.7); for (let y = 0; y >= -h; y--) p.blend(x, y, H(y < -h + 3 ? S[0] : ((x + y + Math.floor(u * 8)) % 5 === 0) ? S[0] : S[1]), 0.92); } } },
  sandbed: band({ len: 26, w: Math.round(px(4.5)), c: S, a: 0.6 }),
  crest: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 4, fps: 10, loop: true, draw(p, u) { for (let x = -26; x <= 26; x++) { const h = 60 + 18 * Math.cos(x / 26 * 1.6) + 6 * Math.sin(u * 6.28 + x); for (let y = 0; y >= -h; y--) p.blend(x, y, H(y < -h + 4 ? S[0] : S[1]), 0.92); } for (let k = 0; k < 10; k++) p.blend((rnd(k) - 0.5) * 50, -70 - ((u + rnd(k)) % 1) * 20, H(S[0]), 0.9); } },
  // Grand Sand Mausoleum Seal: the pyramid that stays over the sealed one (once, held)
  pyramid: { cw: 110, ch: 100, ox: 55, oy: 94, frames: 8, fps: 10, draw(p, u) { const k = Math.min(1, u * 1.5); const h = 84 * k; for (let y = 0; y >= -h; y--) { const w = 50 * (1 + y / 84); for (let x = -w; x <= w; x++) p.blend(x, y, H(x > w - 3 || x < -w + 3 ? S[2] : x > 0 ? S[1] : S[0]), 0.96); } for (let k2 = 0; k2 < 5; k2++) p.line(-20 + k2 * 10, -30, -18 + k2 * 10, -10, H("#5a3a20"), 0.8 * k); } },
  // Absolute Sand Shield: a sphere of sand round him (loop)
  sphere: dome({ R: Math.round(px(4.2)), c: [S[0], S[1], S[2]], a: 0.55, h: 1 }),
};
export const PREFIX = "ga_";

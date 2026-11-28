// Kakashi Hatake on the 2.5D stage (2026-11-27).
// Classic (Team 7 Sensei):
//   slot 1 "Lightning Blade (Raikiri)" (Manga 15 / Anime 8 as Chidori; Raikiri vs Haku/Zabuza, Narutopedia): lightning
//     chakra gathered in one hand, so dense it can be heard chirping; a straight thrust at great speed. The moment:
//     the crackling hand held low, then the dash and the thrust. seal -> aim -> tell (the line he will run shows) ->
//     rush_go (the dash, a trail of lightning) -> impact (the thrust)
//   slot 2 "Sharingan Copy: Water Dragon" (Suiton: Suiryūdan, copied from Zabuza mid-seal, Manga 13 / Anime 7): a dragon
//     of water rises and rushes along the line at the target. seal (the long seal chain) -> aim -> tell -> line_go (the
//     dragon's body grows along the line, its head at the front) -> retract (it collapses into spray)
//   slot 4 "Hidden Mist Jutsu" (Kirigakure, used by Kakashi with the Sharingan in the Land of Waves): a thick mist
//     round him; whoever is inside cannot see to aim (the dummies' kunai go wide).
import { crackle, lane, speed, spark, band, ring, mist, pool, burst, mark, lib, PALS, H, px, rnd, blendDisc, blendEllipse } from "./_fx.js";

const W1 = "#f0faff", W2 = "#7ac8f0", W3 = "#2a6ab0";
export const MOVES = [
  { id: "kakashi-raikiri", kind: "arena", variant: "classic/kakashi-hatake-team-7-sensei", slot: 1,
    seal: 0.45, recover: 0.4, range: 36, cone: 45, cooldown: 7, lock: 0.45, shake: 1.6,
    stages: [{ mech: "rush", aim: 0.35, tell: 0.3, speed: 70, reach: 2.4, reachMax: 32, hits: 1, hit: { dmg: 30, kb: 10, kbT: 0.3 }, impact: 0.35, hitKind: "Raikiri" }],
    dodge: { phase: "tell", side: 6 },
    sfx: { seal: "cast", rush_go: "whoosh", impact: "burst" },
    look: [
      { book: "kk_chirp", at: "hand", lift: 26, handF: 1.4, phases: ["seal", "aim", "tell", "rush_go"] },
      { book: "kk_lane", at: "caster", ground: true, rotate: true, phases: ["tell"] },
      { book: "kk_trail", at: "caster", rotate: true, lift: 10, phases: ["rush_go"] },
      { book: "cm_zap", at: "impact", lift: 32, play: "once" },
    ] },
  { id: "kakashi-copy-water-dragon", kind: "arena", variant: "classic/kakashi-hatake-team-7-sensei", slot: 2,
    seal: 0.8, recover: 0.3, range: 36, cone: 50, cooldown: 8, lock: 0.8,
    stages: [{ mech: "line", aim: 0.35, tell: 0.35, from: 2, len: 32, speed: 40, width: 2.6, hold: 0.35, fade: 0.35, hit: { dmg: 22, kb: 9, kbT: 0.3 }, hitKind: "Wasserdrache" }],
    dodge: { phase: "tell", side: 6 },
    sfx: { seal: "cast", line_go: "whoosh", retract: "burst" },
    look: [
      { book: "kk_seal", at: "hand", lift: 32, handF: 0.8, phases: ["seal", "aim"] },
      { book: "kk_wlane", at: "caster", ground: true, rotate: true, phases: ["tell"] },
      { book: "kk_wpool", at: "caster", ground: true, phases: ["tell", "line_go"] },
      { book: "kk_body", at: "line", rotate: true, seg: 2.6, lift: 26, phases: ["line_go"] },
      { book: "kk_head", at: "line", head: true, views: true, lift: 30, phases: ["line_go"] },
      { book: "kk_spray", at: "line", seg: 5, lift: 10, phases: ["retract"], play: "once" },
      { book: "cm_splash", at: "impact", lift: 20, play: "once" },
    ] },
  { id: "kakashi-hidden-mist", kind: "arena", variant: "classic/kakashi-hatake-team-7-sensei", slot: 4,
    seal: 0.5, recover: 0.4, range: 30, cone: 180, cooldown: 10, lock: 0.5,
    stages: [{ mech: "zone", at: "self", noAim: true, radius: 12, dur: 5, dot: 0, status: "blind", hitKind: "Nebel" }],
    dodge: { phase: "seal", back: 16 },
    sfx: { zone_go: "poof" }, hitPop: "IM NEBEL",
    look: [
      { book: "kk_fog", at: "zone", ground: true, phases: ["zone_go"] },
      { book: "kk_mist", at: "zone", lift: 0, phases: ["zone_go"] },
    ] },
  // Mangekyō Sharingan (Shippuden):
  //   slot 1 "Kamui Snipe" (Kamui at range, Manga 429 against Deva Path / Deidara Manga 274): his left eye fixed on
  //     a distant point, the space there twists into a spiral and is torn away. The focus moves from his eye to the
  //     target, where the space warps. blast (small, at the aimed place, a long tell)
  //   slot 2 "Lightning Release: Shadow Clone" (Raiton Kage Bunshin, Manga 420 against Kakuzu... Pain): a clone of
  //     lightning; whoever touches it is shocked and paralysed. clones (one, electric)
  //   slot 3 "Lightning Beast Tracking Fang" (Raijū Tsuiga, Manga 474 against Sasuke): a hound of lightning that hunts
  //     the target. shot (homing)
  { id: "kakashi-kamui-snipe", kind: "arena", variant: "shippuden/kakashi-hatake-mangekyo-sharingan", slot: 1,
    seal: 0.3, recover: 0.5, range: 40, cone: 45, cooldown: 11, lock: 0.3, hitPop: "KAMUI",
    stages: [{ mech: "blast", aim: 0.7, tell: 0.55, radius: 2.6, hit: { dmg: 34, kb: 0, status: "stun", statusT: 1 }, after: 0.8, hitKind: "Kamui" }],
    dodge: { phase: "tell", side: 6 },
    sfx: { aim: "cast", tell: "rumble", blast_go: "burst" },
    look: [
      { book: "kk_mseye", at: "caster", lift: 60, phases: ["aim", "tell", "blast_go"] },
      { book: "kk_focus", at: "aim", lift: 30, phases: ["aim", "tell"] },
      { book: "kk_twist", at: "blast", lift: 30, phases: ["blast_go"], play: "once" },
    ] },
  { id: "kakashi-raiton-kage-bunshin", kind: "arena", variant: "shippuden/kakashi-hatake-mangekyo-sharingan", slot: 2,
    seal: 0.4, recover: 0.4, range: 32, cone: 50, cooldown: 9, lock: 0.4, cloneTint: [150, 205, 255], cloneAlpha: 0.15,
    stages: [{ mech: "clones", aim: 0.25, tell: 0.25, count: 1, fan: 0, speed: 30, reach: 2.4, range: 32, hit: { dmg: 12, kb: 2, status: "stun", statusT: 2.2 }, hitKind: "Raiton Kage Bunshin" }],
    dodge: { phase: "tell", back: 16 },
    sfx: { seal: "cast", clones_go: "poof" },
    look: [
      { book: "kk_chirp", at: "hand", lift: 26, handF: 1.4, phases: ["seal", "aim", "tell"] },
      { book: "kk_cloneaura", at: "clone", phases: ["clones_go"] },
      { book: "cm_zap", at: "impact", lift: 32, play: "once" },
    ] },
  { id: "kakashi-raijuu-tsuiga", kind: "arena", variant: "shippuden/kakashi-hatake-mangekyo-sharingan", slot: 3,
    seal: 0.5, recover: 0.4, range: 40, cone: 50, cooldown: 9, lock: 0.5,
    stages: [{ mech: "shot", aim: 0.3, tell: 0.3, from: 2, speed: 34, homing: 2.6, radius: 2, reach: 30, hit: { dmg: 24, kb: 8, status: "stun", statusT: 1.2 }, impact: 0.4, hitKind: "Raijū Tsuiga" }],
    dodge: { phase: "tell", back: 26 },
    sfx: { seal: "cast", shot_go: "whoosh", impact: "burst" },
    look: [
      { book: "kk_chirp", at: "hand", lift: 26, handF: 1.4, phases: ["seal", "aim", "tell"] },
      { book: "kk_hound", at: "proj", lift: 20, views: true },
      { book: "cm_zap", at: "impact", lift: 26, play: "once" },
    ] },
];

// the water dragon's head, seen from the side (facing +x), the front (coming at the camera) and the back
function dragonHead(p, u, view) {
  const c1 = H(W1), c2 = H(W2), c3 = H(W3), jaw = 3 + 3 * Math.sin(u * 6.28);
  if (view === "side") {
    blendEllipse(p, -4, 0, 16, 11, c3, 0.85); blendEllipse(p, -3, -1, 13, 8, c2, 0.9);
    for (let x = 6; x <= 22; x++) { p.blend(x, -5 + (x - 6) * 0.15, c2, 0.95); p.blend(x, -4 + (x - 6) * 0.15, c1, 0.7); p.blend(x, 3 + (x - 6) * 0.25 + jaw * (x - 6) / 16, c2, 0.95); }
    p.rect(2, -6, 3, 2, H("#ffffff")); p.dot(3, -6, H("#1a3050"));
    for (let k = 0; k < 4; k++) p.line(-10 - k * 3, -8, -20 - k * 4, -16 - k * 2, c1, 0.8);
  } else if (view === "front") {
    blendDisc(p, 0, 0, 15, c3, 0.85); blendDisc(p, 0, -1, 12, c2, 0.9);
    blendEllipse(p, 0, 4, 7, 3 + jaw * 0.7, H("#103050"), 0.9);
    for (const s of [1, -1]) { p.rect(s * 6 - 1, -6, 3, 2, H("#ffffff")); p.line(s * 8, 2, s * 22, 0, c1, 0.8); p.line(s * 6, -10, s * 12, -20, c1, 0.85); }
  } else {
    blendDisc(p, 0, 0, 14, c3, 0.85); blendDisc(p, 0, 1, 11, c2, 0.9);
    for (const s of [1, -1]) p.line(s * 5, -8, s * 11, -20, c1, 0.85);
    for (let k = 0; k < 5; k++) p.line((k - 2) * 3, -12, (k - 2) * 4, -22 - (k % 2) * 3, c1, 0.7);
  }
}

export const FX = {
  // Raikiri: the hand's lightning (loop), the line he will run, the trail behind him, the thrust's burst
  chirp: crackle({ R: 16, bolts: 7, core: 5 }),
  lane: lane({ len: px(32), w: 8, c: "#c8e8ff", dark: "#203050" }),
  trail: { cw: 140, ch: 70, ox: 130, oy: 60, frames: 4, fps: 20, loop: true, draw(p, u, i) {
    speed({ len: 110, h: 54, c: "#d8ecff", n: 10 }).draw(p, u);
    let x = 0, y = -30;
    for (let s = 0; s < 6; s++) { const nx = -s * 20 - 18, ny = -30 + (rnd(s + i * 7) - 0.5) * 18; p.line(x, y, nx, ny, H("#ffffff")); p.line(x, y + 1, nx, ny + 1, H("#5a90f0"), 0.8); x = nx; y = ny; }
  } },
  // Water Dragon: the seal's chakra (loop), the line (tell), water gathering under him, the body, the head, spray
  seal: { cw: 30, ch: 30, ox: 15, oy: 15, frames: 4, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28 + u * 6.28; p.blend(Math.cos(a) * 9, Math.sin(a) * 6, H(W2), 0.9); } blendDisc(p, 0, 0, 3, H(W1), 0.9); } },
  wlane: lane({ len: px(32), w: Math.round(px(2.6)), c: W2, dark: W3 }),
  wpool: pool({ R: 30, c: [W2, W3], bubbles: W1, a: 0.45 }),
  body: band({ len: 24, w: 12, c: [W1, W2, W3], a: 0.82 }),
  head: { views: true, cw: 60, ch: 50, ox: 30, oy: 25, frames: 4, fps: 12, loop: true, draw(p, u, i, view) { dragonHead(p, u, view); } },
  spray: { cw: 60, ch: 60, ox: 30, oy: 50, frames: 7, fps: 16, draw(p, u) { for (let k = 0; k < 12; k++) { const a = -Math.PI * (0.1 + 0.8 * rnd(k)), d = 30 * u * (0.5 + 0.5 * rnd(k + 2)); blendDisc(p, Math.cos(a) * d, Math.sin(a) * d * 0.9 + 25 * u * u, 2 + 2 * rnd(k + 4), H(k % 2 ? W1 : W2), 1 - u); } } },
  // Hidden Mist: the floor fogged (loop), banks of mist standing round (loop)
  // Kamui: the Mangekyō at his eye (loop), the focus on the target (a faint spiral, loop), the space twisting and torn
  mseye: mark({ kind: "spiral", c: ["#ff6060", "#2a0a0a"], R: 6 }),
  focus: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 6, fps: 10, loop: true, draw(p, u) { for (let t = 0; t < 12; t += 0.06) { const r = t * 2.2, a = t * 1.4 - u * 6.28; p.blend(Math.cos(a) * r, Math.sin(a) * r * 0.8, H("#1c1428"), 0.35 + 0.03 * t); } } },
  twist: { cw: 110, ch: 110, ox: 55, oy: 55, frames: 10, fps: 16, draw(p, u) { const k = Math.sin(Math.min(1, u * 1.2) * Math.PI), a = 1 - Math.max(0, (u - 0.7) / 0.3); for (let t = 0; t < 18; t += 0.04) { const r = t * 2.6 * (0.4 + k), ang = t * (1 + 2 * u) - u * 12; p.blend(Math.cos(ang) * r, Math.sin(ang) * r * 0.8, H(t > 12 ? "#5a4a6a" : "#0c0810"), a * 0.85); } blendDisc(p, 0, 0, 10 * k, H("#000000"), a); } },
  // Lightning Shadow Clone: the crackle round the clone (loop); Lightning Beast: the hound (views)
  cloneaura: crackle({ R: 30, bolts: 6, core: 0 }),
  hound: { views: true, cw: 80, ch: 50, ox: 40, oy: 30, frames: 4, fps: 16, loop: true, draw(p, u, i, view) { const c1 = H("#ffffff"), c2 = H("#9ad8ff"); if (view === "side") { blendEllipse(p, -4, 0, 18, 8, c2, 0.8); blendEllipse(p, 14, -4, 9, 7, c2, 0.85); p.line(20, -2, 30, 0, c1); p.line(18, -10, 14, -18, c1); p.line(-22, -2, -34, -8 + Math.sin(u * 6.28) * 4, c1); for (let k = 0; k < 4; k++) p.line(-10 + k * 6, 6, -14 + k * 6 + (k % 2 ? 4 : -4) * Math.sin(u * 6.28), 16, c2); } else { blendDisc(p, 0, -2, 12, c2, 0.8); blendDisc(p, 0, -6, 7, c1, 0.7); for (const sg of [1, -1]) p.line(sg * 6, -12, sg * 10, -22, c1); } crackle({ R: 22, bolts: 4, core: 0 }).draw(p, u, i); } },
  fog: pool({ R: Math.round(px(12)), c: ["#d8e0e8", "#b8c4d0"], bubbles: "#f0f4f8", a: 0.35 }),
  mist: mist({ R: Math.round(px(12)), a: 0.5, n: 22 }),
};
export const PREFIX = "kk_";

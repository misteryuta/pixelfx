// Zabuza Momochi (Demon of the Hidden Mist, Classic) on the 2.5D stage (2026-11-27).
// slot 1 "Hidden Mist Jutsu" (Kirigakure no Jutsu with Silent Killing, Manga 11-13 / Anime 6-7): a thick mist rises
//   round him (in it no one can see to aim), he vanishes into it and comes out behind the target with his sword.
//   stage 1 zone (the mist, the dummies inside blinded) -> stage 2 blink (behind the target) and a cut
// slot 2 "Water Prison Jutsu" (Suirō no Jutsu, Manga 11 / Anime 6, against Kakashi): he closes in, water rises round
//   the target and closes into a sphere; his arm stays in the water (if he lets go, it falls apart). The moment: the
//   water closing round the target, then his arm and the held one together, the link between them kept; on release the
//   water collapses and lets the target go.
//   stage 1 rush (he closes the distance) -> stage 2 bind (the water closes; held, the arm's water link; released)
// slot 3 "Water Style: Water Dragon Jutsu" (Suiton: Suiryūdan, Manga 13 / Anime 7): a dragon of water from the lake
//   rushes along the line.
import { mist, pool, slash, poof, band, dome, burst, lane, ring, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, impact } from "./_look.js";

const W = ["#f0faff", "#7ac8f0", "#2a6ab0"];
export const MOVES = [
  { id: "zabuza-kirigakure", kind: "arena", variant: "classic/zabuza-momochi-demon-of-the-hidden-mist", slot: 1,
    seal: 0.5, recover: 0.4, range: 34, cone: 60, cooldown: 9, lock: 0.5, hitPop: "LAUTLOS",
    stages: [
      { mech: "zone", at: "self", noAim: true, radius: 12, dur: 1.4, dot: 0, status: "blind", hitKind: "Nebel" },
      { mech: "blink", aim: 0.2, tell: 0.1, to: "behind", behind: 2.8, vanish: 0.25, strike: 3.2, hit: { dmg: 26, kb: 9 }, impact: 0.4, hitKind: "Lautloses Töten" },
    ],
    dodge: { phase: "tell", side: 7 },
    sfx: { zone_go: "poof", blink_go: "whoosh", impact: "bite" },
    look: [
      hand("zb_seal", ["seal"], { lift: 34 }),
      L("zb_fog", "zone", ["zone_go", "aim", "tell", "blink_go", "impact"], { ground: true }),
      L("zb_mist", "zone", ["zone_go", "aim", "tell", "blink_go", "impact"]),
      L("zb_poof", "caster", ["blink_go"], { play: "once" }),
      impact("zb_cut", { lift: 34 }),
    ] },
  { id: "zabuza-suirou", kind: "arena", variant: "classic/zabuza-momochi-demon-of-the-hidden-mist", slot: 2,
    seal: 0.45, recover: 0.4, range: 30, cone: 50, cooldown: 9, lock: 0.45, hitPop: "GEFANGEN",
    stages: [
      { mech: "rush", aim: 0.3, tell: 0.3, speed: 34, reach: 4, stand: 3.4, reachMax: 32, hits: 1, hit: { dmg: 0 }, impact: 0.05, hitKind: "Wassergefängnis" },
      { mech: "bind", skipAim: true, from: 1.2, speed: 30, follow: true, radius: 2.4, reachMax: 6, hold: 3, dot: 3, crush: { dmg: 4, kb: 4 }, back: 30, hitKind: "Wassergefängnis" },
    ],
    dodge: { phase: "tell", side: 7 },
    sfx: { rush_go: "whoosh", bind_go: "burst", hold: "bite", retract: "burst" },
    look: [
      hand("zb_seal", ["seal", "aim"], { lift: 34 }),
      floorTell("zb_lane"),
      L("zb_rise", "tip", ["bind_go"]),
      L("zb_arm", "link", ["hold"], { rotate: true, seg: 1.6, lift: 30, toGrab: true }),
      L("zb_prison", "grab", ["hold"], { lift: 0 }),
      L("zb_wet", "grab", ["hold"], { ground: true }),
      impact("zb_collapse", { lift: 0 }),
    ] },
  { id: "zabuza-suiryuudan", kind: "arena", variant: "classic/zabuza-momochi-demon-of-the-hidden-mist", slot: 3,
    seal: 0.9, recover: 0.3, range: 36, cone: 50, cooldown: 8, lock: 0.9,
    stages: [{ mech: "line", aim: 0.35, tell: 0.35, from: 2, len: 34, speed: 38, width: 3, hold: 0.35, fade: 0.35, hit: { dmg: 24, kb: 10, kbT: 0.3 }, hitKind: "Wasserdrache" }],
    dodge: { phase: "tell", side: 7 },
    sfx: { seal: "cast", line_go: "whoosh", retract: "burst" },
    look: [
      hand("zb_seal", ["seal", "aim"], { lift: 34 }),
      floorTell("zb_wlane"),
      L("kk_wpool", "caster", ["tell", "line_go"], { ground: true }),
      L("zb_body", "line", ["line_go"], { rotate: true, seg: 2.8, lift: 28 }),
      L("kk_head", "line", ["line_go"], { head: true, views: true, lift: 32 }),
      L("kk_spray", "line", ["retract"], { seg: 5, lift: 10, play: "once" }),
      impact("cm_splash", { lift: 20 }),
    ] },
];

export const FX = {
  // the seal (Ram / Tiger): chakra rising off the hands (loop)
  seal: { cw: 30, ch: 34, ox: 15, oy: 26, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = 0; k < 6; k++) { const ph = (u + k / 6) % 1; p.blend((rnd(k) - 0.5) * 12, -ph * 22, H(W[1]), 1 - ph); } } },
  fog: pool({ R: Math.round(px(12)), c: ["#d8e0e8", "#b8c4d0"], bubbles: "#f0f4f8", a: 0.4 }),
  mist: mist({ R: Math.round(px(12)), a: 0.55, n: 24 }),
  poof: poof({ R: 22, c: ["#eef2f6", "#c8d4e0", "#98a8b8"] }),
  // the silent cut from behind: a wide arc of the big blade
  cut: slash({ R: 34, w: 7, c: ["#ffffff", "#b8c8d8"], a0: -2.2, a1: 0.8 }),
  // Water Prison: the line he runs (tell), water rising off the ground round the target, the sphere, his arm's water
  lane: lane({ len: px(26), w: 8, c: W[1], dark: W[2] }),
  rise: { cw: 70, ch: 80, ox: 35, oy: 74, frames: 6, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28 + u * 3, r = 18, x = Math.cos(a) * r, y = Math.sin(a) * r * 0.35; for (let h = 0; h < 30 + 20 * Math.sin(u * 6.28 + k); h++) p.blend(x * (1 - h / 120), y - h, H(h > 30 ? W[0] : W[1]), 0.75); } } },
  prison: dome({ R: 26, c: W, a: 0.42, h: 1.05 }),
  arm: band({ len: 14, w: 4, c: W, a: 0.75 }),
  wet: pool({ R: 26, c: [W[1], W[2]], bubbles: W[0], a: 0.35 }),
  collapse: { cw: 90, ch: 90, ox: 45, oy: 84, frames: 8, fps: 16, draw(p, u) { const a = 1 - u; for (let k = 0; k < 18; k++) { const x = (rnd(k) - 0.5) * 60, y0 = -70 * rnd(k + 3) * (1 - u) - 4; blendDisc(p, x * (1 + u * 0.5), y0 + 60 * u * u, 2 + 3 * rnd(k + 6), H(k % 2 ? W[0] : W[1]), a); } blendEllipse(p, 0, -2, 30 * (0.5 + u), 6, H(W[1]), 0.4 * a); } },
  // Water Dragon: his own (bigger than Kakashi's copy)
  wlane: lane({ len: px(34), w: Math.round(px(3)), c: W[1], dark: W[2] }),
  body: band({ len: 26, w: 14, c: W, a: 0.82 }),
};
export const PREFIX = "zb_";

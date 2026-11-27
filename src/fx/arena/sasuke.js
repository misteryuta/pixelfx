// Sasuke Uchiha on the 2.5D stage (2026-11-27).
// Classic (Final Valley):
//   slot 1 "Cursed Seal Stage 2: Onyx Chidori" (the black Chidori in Stage 2 against Naruto, Manga 229 / Anime 133):
//     the cursed seal's marks spread, the Chidori turns black, a charge. rush
//   slot 2 "Lion's Barrage" (Shishi Rendan, Manga 58 / Anime 31 against Yoroi... and Yoroi's... at the Valley as Stage 1
//     variant): a kick up, blows in the air, the heel down. rush (combo, the last blow knocks down)
//   slot 3 "Fire Style: Phoenix Flower Jutsu" (Katon: Hōsenka no Jutsu, Manga 25 / Anime 14): several small fireballs
//     breathed out in a fan, each on its own course. shot (a fan)
// Shippuden (Mangekyō Sharingan, Kage Summit):
//   slot 1 "Susanoo Arrow" (his Susanoo's bow, Kage Summit, Manga 478): the ribcage and the arm form round him, the bow
//     is drawn, the arrow flies. shot (fast, one arrow); his only Susanoo move here, not at an ultimate's size
//   slot 2 "Inferno Style: Flame Control" (Enton: Kagutsuchi no Tsurugi / shaping Amaterasu, Manga 469-472): he shapes
//     the black flames: first into a shield round him, then into spears he sends out. guard (the flames as a wall) ->
//     shot (the flames reshaped into spears)
//   slot 3 "Kirin" (Manga 391 / Anime Shippuden 120): lightning taken from the storm clouds above, shaped like a
//     dragon-beast, striking the target from the sky. blast (at the aimed place, from above, a long tell)
//   slot 4 "Amaterasu" (his left eye, Manga 469 against Raikage): black flames start where he looks. blast (small, at
//     the target, it burns)
import { crackle, lane, speed, burst, shock, comet, fireball, aura, ring, pool, mark, spark, px, rnd, blendDisc, blendEllipse, H } from "./_fx.js";
import { L, hand, atCaster, floorTell, aimRing, impact, proj } from "./_look.js";

const FV = "classic/sasuke-uchiha-final-valley", KS = "shippuden/sasuke-uchiha-mangekyo-sharingan-kage-summit";
const DK = ["#c8b8ff", "#5a3aa0", "#14101c"], PU = ["#f0e0ff", "#a070e0", "#4a2a8a"], BF = ["#3a2a4a", "#14101c", "#000000"];
export const MOVES = [
  { id: "sasuke-onyx-chidori", kind: "arena", variant: FV, slot: 1,
    seal: 0.5, recover: 0.4, range: 34, cone: 45, cooldown: 7, lock: 0.5, shake: 1.6,
    stages: [{ mech: "rush", aim: 0.3, tell: 0.3, speed: 66, reach: 2.4, reachMax: 30, hits: 1, hit: { dmg: 34, kb: 12, kbT: 0.3 }, impact: 0.35, hitKind: "Schwarzes Chidori" }],
    dodge: { phase: "tell", side: 6 },
    sfx: { seal: "cast", rush_go: "whoosh", impact: "burst" },
    look: [
      atCaster("sa_curse", ["seal", "aim", "tell", "rush_go", "impact"]),
      hand("sa_black", ["seal", "aim", "tell", "rush_go"], { lift: 26 }),
      floorTell("sa_lane"),
      L("sa_trail", "caster", ["rush_go"], { rotate: true, lift: 8 }),
      impact("sa_blackhit", { lift: 32 }),
    ] },
  { id: "sasuke-shishi-rendan", kind: "arena", variant: FV, slot: 2,
    seal: 0.25, recover: 0.4, range: 28, cone: 45, cooldown: 6, lock: 0.25, shake: 1.4,
    stages: [{ mech: "rush", aim: 0.25, tell: 0.25, speed: 48, reach: 2.4, reachMax: 32, hits: 4, combo: 0.8, hit: { dmg: 6 }, finish: { dmg: 18, kb: 12, kbT: 0.3 }, impact: 0.35, hitKind: "Shishi Rendan" }],
    dodge: { phase: "tell", side: 6 },
    sfx: { rush_go: "whoosh", combo: "bite", impact: "burst" },
    look: [
      floorTell("sa_lane"),
      L("sa_blows", "grab", ["combo"], { lift: 40 }),
      impact("sa_slam"),
      impact("sa_dust"),
    ] },
  { id: "sasuke-housenka", kind: "arena", variant: FV, slot: 3,
    seal: 0.5, recover: 0.4, range: 34, cone: 50, cooldown: 7, lock: 0.5,
    stages: [{ mech: "shot", aim: 0.3, tell: 0.3, from: 1.6, count: 5, spread: 36, gap: 0.06, speed: 32, radius: 1.5, reach: 30, burst: 2, hit: { dmg: 8, status: "burn", statusT: 1.5 }, impact: 0.4, hitKind: "Hōsenka" }],
    dodge: { phase: "tell", side: 15 },
    sfx: { seal: "cast", shot_go: "whoosh", impact: "burst" },
    look: [
      hand("sa_mouth", ["seal", "aim", "tell", "shot_go"], { lift: 50, handF: 0.9 }),
      floorTell("sa_fan"),
      proj("sa_flower", { lift: 44 }),
      impact("sa_pop", { lift: 10 }),
    ] },
  { id: "sasuke-susanoo-arrow", kind: "arena", variant: KS, slot: 1,
    seal: 0.6, recover: 0.5, range: 42, cone: 40, cooldown: 9, lock: 0.6, shake: 1.8,
    stages: [{ mech: "shot", aim: 0.45, tell: 0.4, from: 2.5, speed: 75, radius: 1.8, reach: 42, burst: 3.5, hit: { dmg: 30, kb: 16, kbT: 0.35 }, impact: 0.5, hitKind: "Susanoo-Pfeil" }],
    dodge: { phase: "tell", side: 7 },
    sfx: { seal: "cast", tell: "rumble", shot_go: "whoosh", impact: "burst" },
    look: [
      L("sa_ribs", "caster", ["seal", "aim", "tell", "shot_go", "impact"], { views: true }),
      floorTell("sa_alane"),
      proj("sa_arrow", { lift: 46 }),
      impact("sa_purpleburst", { lift: 20 }),
    ] },
  { id: "sasuke-flame-control", kind: "arena", variant: KS, slot: 2,
    seal: 0.4, recover: 0.4, range: 34, cone: 50, cooldown: 10, lock: 0.4,
    stages: [
      { mech: "guard", mode: "full", radius: 3.6, dur: 1.8, pulse: 3.6, pulseHit: { dmg: 6, status: "burn", statusT: 2 }, hitKind: "Enton-Schild" },
      { mech: "shot", aim: 0.3, tell: 0.3, from: 2.6, count: 3, spread: 16, gap: 0.08, speed: 40, radius: 1.6, reach: 32, hit: { dmg: 12, kb: 6, status: "burn", statusT: 3 }, impact: 0.4, hitKind: "Enton-Speere" },
    ],
    dodge: { phase: "tell", side: 7 },
    sfx: { guard_go: "rumble", shot_go: "whoosh" },
    look: [
      atCaster("sa_shield", ["guard_go"]),
      L("sa_shape", "caster", ["aim", "tell"], { views: true }),
      floorTell("sa_slane"),
      proj("sa_spear", { lift: 34 }),
      impact("sa_blackflame"),
    ] },
  { id: "sasuke-kirin", kind: "arena", variant: KS, slot: 3,
    seal: 0.6, recover: 0.6, range: 40, cone: 50, cooldown: 12, lock: 0.6, shake: 2.6,
    stages: [{ mech: "blast", aim: 0.6, tell: 0.7, radius: 6, delay: 0.25, hit: { dmg: 40, kb: 10, status: "stun", statusT: 1 }, after: 0.7, hitKind: "Kirin" }],
    dodge: { phase: "tell", side: 10 },
    sfx: { aim: "rumble", blast_go: "burst" },
    look: [
      hand("sa_raise", ["seal", "aim", "tell"], { lift: 60, handF: 0.4 }),
      L("sa_clouds", "aim", ["aim", "tell", "blast_go"], { lift: 230 }),
      aimRing("sa_kring", ["aim", "tell"]),
      L("sa_kirin", "blast", ["blast_go"], { play: "once" }),
      L("sa_scorch", "blast", ["blast_go"], { ground: true }),
    ] },
  { id: "sasuke-amaterasu", kind: "arena", variant: KS, slot: 4,
    seal: 0.35, recover: 0.6, range: 34, cone: 45, cooldown: 10, lock: 0.35, hitPop: "SCHWARZE FLAMMEN",
    stages: [{ mech: "blast", aim: 0.5, tell: 0.35, radius: 2.6, hit: { dmg: 14, status: "burn", statusT: 5 }, after: 1.2, hitKind: "Amaterasu" }],
    dodge: { phase: "tell", side: 6 },
    sfx: { tell: "cast", blast_go: "burst" },
    look: [
      L("sa_eye", "caster", ["aim", "tell"], { lift: 60 }),
      aimRing("sa_focus", ["aim", "tell"]),
      L("sa_amat", "blast", ["blast_go"], { play: "loop" }),
    ] },
];

// Susanoo's ribcage and arm drawing the bow round him (purple), seen from the side, front and back (loop)
function ribs(p, u, view) {
  const c1 = H(PU[0]), c2 = H(PU[1]), c3 = H(PU[2]);
  for (let k = 0; k < 5; k++) { const y = -50 + k * 8; blendEllipse(p, 0, y, 26 - k, 4, c2, 0.35); }
  for (let y = -84; y <= -10; y++) { p.blend(view === "side" ? -6 : 0, y, c3, 0.7); }
  for (let k = 0; k < 14; k++) { const ph = (u + rnd(k)) % 1; blendDisc(p, (rnd(k + 2) - 0.5) * 64, -10 - ph * 90, 3 + 2 * (1 - ph), c2, 0.5 * (1 - ph)); }
  if (view === "side") { for (let t = -1.1; t <= 1.1; t += 0.02) p.blend(28 + Math.cos(t) * 10, -46 + Math.sin(t) * 34, c1, 0.95); p.line(28, -80, 14, -46, c1, 0.7); p.line(28, -12, 14, -46, c1, 0.7); }
  else { for (let t = 0; t < 6.28; t += 0.03) p.blend(Math.cos(t) * 30, -46 + Math.sin(t) * 6, c1, view === "front" ? 0.9 : 0.5); }
}
export const FX = {
  // Onyx Chidori: the spreading black marks (a dark aura), the black lightning in hand, the line, the trail, the hit
  curse: aura({ c: ["#8a7aa0", "#3a2a4a", "#14101c"], h: 74, w: 22, a: 0.45 }),
  black: crackle({ R: 18, c: DK, bolts: 7, core: 5 }),
  lane: lane({ len: px(30), w: 8, c: "#c8b8ff", dark: "#1c1428" }),
  trail: { cw: 140, ch: 70, ox: 130, oy: 60, frames: 4, fps: 20, loop: true, draw(p, u, i) { speed({ len: 110, h: 54, c: "#a898c8", n: 10 }).draw(p, u); let x = 0, y = -30; for (let s = 0; s < 6; s++) { const nx = -s * 20 - 18, ny = -30 + (rnd(s + i * 7) - 0.5) * 18; p.line(x, y, nx, ny, H("#1c1428")); p.line(x, y + 1, nx, ny + 1, H("#8a6ae0"), 0.8); x = nx; y = ny; } } },
  blackhit: { cw: 100, ch: 100, ox: 50, oy: 50, frames: 7, fps: 18, draw(p, u, i) { crackle({ R: 36, c: DK, bolts: 9, core: 8 * (1 - u) }).draw(p, u, i); } },
  // Lion's Barrage: blows in the air over the target, the slam's ring and dust
  blows: { cw: 60, ch: 60, ox: 30, oy: 30, frames: 4, fps: 16, loop: true, draw(p, u, i) { for (let k = 0; k < 3; k++) { const a = rnd(k + i * 3) * 6.28; p.line(Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(a) * 20, Math.sin(a) * 20, H("#ffffff"), 0.9); } blendDisc(p, 0, 0, 5, H("#fff0c0"), 0.8); } },
  slam: shock({ R: 40, c: "#e8dcc8", edge: "#5a4a3a" }),
  dust: burst({ R: 28, c: ["#e8dcc8", "#b8a888", "#8a7a5a"], smoke: "#8a7a5a", frames: 9 }),
  // Phoenix Flower: fire at the mouth, the fan (tell), the small fireballs, a pop where each ends
  mouth: fireball({ r: 6 }),
  fan: { ground: true, cw: Math.ceil(px(30)) + 8, ch: Math.ceil(px(30) * 0.66) + 10, ox: 2, oy: Math.ceil(px(30) * 0.33) + 5, frames: 4, fps: 10, loop: true, draw(p, u) { for (let k = -2; k <= 2; k++) { const a = k * 0.157; for (let x = 6; x <= px(30); x += 2) if (((x / 14 - u) % 1 + 1) % 1 < 0.5) p.blend(Math.cos(a) * x, Math.sin(a) * x, H("#ffb040"), 0.8); } } },
  flower: comet({ len: 26, r: 6, c: ["#fff6c0", "#ffb030", "#e0401a"] }),
  pop: burst({ R: 14, c: ["#fff6c0", "#ffb030", "#e0401a"], smoke: "#5a4a44", frames: 7 }),
  // Susanoo Arrow: the ribcage and bow round him (views), the line, the arrow, the purple burst
  ribs: { views: true, cw: 110, ch: 110, ox: 55, oy: 100, frames: 6, fps: 10, loop: true, draw(p, u, i, view) { ribs(p, u, view); } },
  alane: lane({ len: px(42), w: 8, c: PU[0], dark: PU[2] }),
  arrow: comet({ len: 60, r: 5, c: PU, tail: 0.9, kind: "fire" }),
  purpleburst: burst({ R: 36, c: PU, smoke: "#4a3a5a", rays: 10 }),
  // Flame Control: the black flames as a shield round him, then reshaped (views) into spears; where a spear hits, the
  // black flames keep burning
  shield: { cw: 90, ch: 100, ox: 45, oy: 92, frames: 6, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 26; k++) { const a = (k / 26) * 6.28 + u * 2, x = Math.cos(a) * 30, ph = (u * 2 + rnd(k)) % 1, y = -6 - ph * 70; blendEllipse(p, x * (1 - ph * 0.2), y + Math.sin(a) * 6, 5, 9, H(k % 2 ? BF[0] : BF[1]), 0.9 * (1 - ph * 0.5)); } } },
  shape: { views: true, cw: 80, ch: 80, ox: 40, oy: 70, frames: 4, fps: 12, loop: true, draw(p, u, i, view) { const dx = view === "side" ? 1 : 0; for (let k = 0; k < 3; k++) { const y = -30 - k * 8; for (let x = 0; x < 30; x++) p.blend(dx * x + (1 - dx) * (k - 1) * 10, y - (1 - dx) * x * 0.6, H(x > 24 ? "#5a3a7a" : BF[1]), 0.9); } } },
  slane: lane({ len: px(32), w: 10, c: "#8a6aa0", dark: "#0c0810" }),
  spear: comet({ len: 40, r: 5, c: ["#5a3a7a", "#1c1428", "#000000"] }),
  blackflame: { cw: 50, ch: 70, ox: 25, oy: 64, frames: 6, fps: 12, draw(p, u) { const a = 1 - u * 0.6; for (let k = 0; k < 12; k++) { const ph = (u * 2 + rnd(k)) % 1; blendEllipse(p, (rnd(k + 1) - 0.5) * 24, -ph * 50, 4, 7, H(k % 2 ? BF[0] : BF[1]), a * (1 - ph)); } } },
  // Kirin: his arm raised, the storm clouds gathering over the target, the ring, the lightning beast striking down
  raise: crackle({ R: 12, c: ["#ffffff", "#9ad8ff", "#3a70e8"], bolts: 4, core: 3 }),
  clouds: { cw: 220, ch: 90, ox: 110, oy: 45, frames: 6, fps: 6, loop: true, draw(p, u) { for (let k = 0; k < 16; k++) { const x = (rnd(k) - 0.5) * 190 + Math.sin(u * 6.28 + k) * 4, y = (rnd(k + 3) - 0.5) * 50; blendDisc(p, x, y, 18 + 10 * rnd(k + 5), H(k % 3 ? "#3a3a4a" : "#5a5a6a"), 0.8); } if (u > 0.5) p.line(-30, 10, -20, 30, H("#c8e8ff"), 0.8); } },
  kring: ring({ R: Math.round(px(6)), c: "#9ad8ff", dark: "#203050" }),
  kirin: { cw: 120, ch: 280, ox: 60, oy: 270, frames: 10, fps: 16, draw(p, u, i) {
    const k = Math.min(1, u * 3), a = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1, top = -260, bot = top + 260 * k;
    for (let y = top; y <= bot; y += 2) { const w = 10 + 8 * Math.sin(y * 0.05 + u * 10); for (let x = -w; x <= w; x++) p.blend(x + Math.sin(y * 0.03) * 12, y, H(Math.abs(x) < w * 0.3 ? "#ffffff" : "#7ac0ff"), 0.85 * a); }
    if (k >= 1) { blendDisc(p, 0, -10, 46 * Math.min(1, (u - 0.33) * 3), H("#c8e8ff"), 0.6 * a); for (let s = 0; s < 10; s++) { const ang = rnd(s + i) * 6.28; p.line(0, -10, Math.cos(ang) * 50, -10 + Math.sin(ang) * 30, H("#ffffff"), a); } }
    for (let s = 0; s < 3; s++) { const hx = Math.sin(top * 0.03) * 12; p.line(hx - 14, top + 10 * k + 20, hx - 22, top + 10 * k - 4, H("#ffffff"), a); }
  } },
  scorch: pool({ R: Math.round(px(6)), c: ["#2a2430", "#141018"], bubbles: "#9ad8ff", a: 0.45 }),
  // Amaterasu: the Mangekyō's flash at his eye, the focus at the target, the black flames burning there
  eye: mark({ kind: "seal", c: ["#ff4040", "#8a0a0a"], R: 6 }),
  focus: ring({ R: Math.round(px(2.6)), c: "#a01010", dark: "#1c0808" }),
  amat: { cw: 60, ch: 90, ox: 30, oy: 84, frames: 6, fps: 12, loop: true, draw(p, u) { for (let k = 0; k < 18; k++) { const ph = (u + rnd(k)) % 1, x = (rnd(k + 1) - 0.5) * 30 * (1 - ph * 0.5); blendEllipse(p, x, -ph * 76, 5 * (1 - ph) + 2, 9 * (1 - ph) + 3, H(k % 3 ? "#0c0810" : "#3a1a3a"), 0.95); } } },
};
export const PREFIX = "sa_";

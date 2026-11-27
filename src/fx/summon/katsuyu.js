// SUMMON: Tsunade (Fifth Hokage, Shippuden), two separate actions with Katsuyu:
// slot 1 "Katsuyu: Immense Network Healing" (Katsuyu: Moryojika, Manga 424 / Anime Shippuden 159, Pain's assault):
//   Katsuyu divides her body into smaller clones, each attaches itself to a person, and the summoner's medical chakra
//   runs through Katsuyu into the wounded (Narutopedia, Fourth Databook p. 238).
//   seal    Tsunade's hand seal (Ram)
//   appear  smoke in front of her, Katsuyu reared up
//   divide  a wave runs up her body, lumps rise along it: the pieces about to come off
//   travel  one piece per ally in reach crawls to it, following it if it moves; one whose ally is gone turns to the
//           nearest other ally, or crawls back and merges with her
//   heal    the piece lies on the ally, glowing green; the ally's health rises while it is attached
// slot 3 "Katsuyu Acid Slime" (Tongue Tooth Sticky Acid, Zesshi Nensan, Manga 170 / Anime 96, against Manda): an
//   acidic paste from the mouth, spread over a wide area, strong enough to melt stone (Narutopedia, To no Sho p. 241).
//   appear  smoke behind Tsunade (beside her for a cast up or down the screen)
//   rear    she rears up and draws her head back, turned to the target, which she follows: the tell; the place the
//           acid will land is marked on the floor
//   spit    the head snaps forward, the mouth opens: a glob of acid flies in an arc to that place
//   splash  where it lands it bursts (hit, thrown back) and leaves a pool that keeps eating at whoever stands in it
// and Tsunade (Fifth Hokage, Classic) slot 4 "Summoning: Katsuyu" with Slug Great Division (Katsuyu Daibunretsu,
// Manga 170 / Anime 96, against Manda): when she is physically attacked she divides into countless small slugs, each a
// whole Katsuyu, so the attack comes to nothing; they combine again when they wish and she can do it over and over
// until the attacker gives up (Narutopedia: Slug Great Division, To no Sho p. 204):
//   appear  smoke in front of Tsunade, Katsuyu reared up high between her and the enemy
//   guard   she slides round Tsunade to stay between her and the nearest enemy, turning to face it (she has to come
//           round: an attack from a side she has not reached yet gets through)
//   split   a blow or a thrown weapon reaches her: she bursts into small slugs that scatter off its line; it falls
//           to the ground in the swarm, no damage
//   merge   the small slugs crawl back together and she is whole again (and can divide again)
//   leave   the guard's time is up: smoke
// The slug is a 3D rig (src/fx/summon/_slug.js) in side / front / back.
import { KATSUYU, MINI, drawSlug, Canvas } from "./_slug.js";
import { hex, mix } from "../../core/index.js";

const SPP = 10.7 / 72;
const BIT = { ...MINI, name: "Katsuyu (klein)", k: 0.11 };
const ease = (u) => 1 - (1 - u) ** 3;
const lerp = (a, b, u) => a + (b - a) * u;

const BIG = {
  idle: { frames: 6, fps: 6, loop: true, pose: (u) => ({ rear: 0.85, phase: u, wave: 0.5 }) },
  divide: { frames: 6, fps: 9, pose: (u) => ({ rear: 0.85, phase: u * 2, wave: 1.4, divide: Math.sin(u * Math.PI) }) },
  rear: { frames: 4, fps: 10, pose: (u) => ({ rear: lerp(0.85, 1, ease(u)), nod: -0.5 * ease(u), phase: 0, wave: 0.3 }) },
  spit: { frames: 3, fps: 12, pose: (u) => ({ rear: lerp(1, 0.95, u), nod: lerp(-0.5, 0.6, ease(u)), mouth: lerp(0.3, 1, u), wave: 0.2 }) },
  after: { frames: 4, fps: 8, pose: (u) => ({ rear: lerp(0.95, 0.85, u), nod: lerp(0.6, 0, u), mouth: 1 - u, wave: 0.4, phase: u }) },
  // the guard: reared up high, swaying a little (loop); whole again after a division (lumps sinking back)
  guard: { frames: 6, fps: 6, loop: true, pose: (u) => ({ rear: 1, nod: -0.15, phase: u, wave: 0.6 }) },
  reform: { frames: 4, fps: 12, pose: (u) => ({ rear: lerp(0.7, 1, ease(u)), nod: -0.15, phase: u, wave: 1.2, divide: 1 - u }) },
};
const PIECE = {
  crawl: { frames: 6, fps: 12, loop: true, pose: (u) => ({ rear: 0.12, phase: u, wave: 1 }) },
  pop: { frames: 4, fps: 12, pose: (u) => ({ rear: lerp(0.6, 0.12, u), phase: u, wave: 1, flat: lerp(0.8, 1, u) }) },
  heal: { frames: 4, fps: 6, loop: true, pose: (u) => ({ rear: 0, flat: 0.75, glow: 0.6 + 0.4 * Math.sin(u * Math.PI * 2), phase: u, wave: 0.4 }) },
};
export const ANIMS = BIG; // (per rig below)
export const VIEWS = ["side", "front", "back"];
export const RIGS = [
  { book: "slug_katsuyu", S: KATSUYU, draw: drawSlug, pitch: 0.36, anims: BIG },
  { book: "slug_piece", S: MINI, draw: drawSlug, pitch: 0.36, anims: PIECE },
  // the division: many small ones (countless, so much smaller than the pieces that lie on an ally)
  { book: "slug_bit", S: BIT, draw: drawSlug, pitch: 0.36, anims: { crawl: PIECE.crawl, pop: PIECE.pop } },
];

// where the mouth is when she spits (from the rig: the acid leaves from there)
const probe = new Canvas(4, 4, 2, 2, "side", 0.36);
const m = drawSlug(probe, KATSUYU, BIG.spit.pose(1)).mouth;
const r3 = (v) => Math.round(v * 1000) / 1000;

export const MOVES = [
  { id: "tsunade-katsuyu-network", kind: "network",
    variant: "shippuden/tsunade-fifth-hokage", slot: 1,
    seal: 0.35, appear: 0.55, divide: 0.66,
    spawnFront: 8,            // she appears in front of Tsunade
    range: 44, cone: 80,      // allies in reach (from Tsunade, in the cast direction)
    maxPieces: 4,
    speed: 15, attach: 1.4,   // a piece crawls this fast and lies on its ally within this
    heal: 2.6, rate: 14,      // seconds attached, health per second
    maxTravel: 3.6,
    missLook: 1.0,            // no ally: she looks round, then leaves
    cooldown: 8, lock: 0.35 },
  { id: "tsunade-katsuyu-acid", kind: "spit",
    variant: "shippuden/tsunade-fifth-hokage", slot: 3,
    seal: 0.35, appear: 0.55, rear: 0.45, spit: 0.25, after: 0.8,
    spawnBack: 9, spawnSide: 13,
    range: 55, cone: 55, missRange: 32,
    mouthF: r3(m[0] * SPP), mouthH: r3(m[1] * SPP),
    speed: 46, arcH: 6,       // the glob's flight (studs/s) and the height its arc adds
    splashR: 5.5, dmg: 12, kb: 5, kbT: 0.25,
    poolR: 5.5, pool: 2.2, dot: 7,
    dodge: { phase: "spit", side: 9 },
    cooldown: 7, lock: 0.35 },
  { id: "tsunade-katsuyu-division", kind: "guard",
    variant: "classic/tsunade-fifth-hokage", slot: 4,
    seal: 0.35, appear: 0.55, guard: 5.5, leave: 0.5,
    spawnFront: 8,            // her foot this far in front of Tsunade, on the side she guards
    turn: 1.1,                // how fast she comes round Tsunade (rad/s)
    range: 42,                // she turns to the nearest enemy within this of Tsunade
    tail: 5.4, reach: 9.2,    // her body behind / in front of her foot at kunai height (the rig reared up: the column rises at 9)
    bodyR: 5.0, tailR: 2.0,   // half her girth where she rears up / at the tail tip: an attack crossing this is on her
    split: 0.45, merge: 0.9, pieces: 26, scatter: 6,
    cooldown: 9, lock: 0.35 },
];

// ---- effects (billboards, and floor decals with ground: true: image x = forward, y = right, 1 px = 1 SPP)
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blendDisc = (p, cx, cy, r, c, a) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) p.blend(cx + x, cy + y, c, a); };
const blendEllipse = (p, cx, cy, rx, ry, c, a) => { for (let y = -Math.ceil(ry); y <= ry; y++) for (let x = -Math.ceil(rx); x <= rx; x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) p.blend(cx + x, cy + y, c, a); };
const SM1 = hex("#f4f2f6"), SM2 = hex("#cfcbd8"), SM3 = hex("#9e98ac");
const AC1 = hex("#f6e04a"), AC2 = hex("#e8a82c"), AC3 = hex("#b8d040"), ACD = hex("#7a6a18");
const GR1 = hex("#8cf0c0"), GR2 = hex("#3cc890"), GRW = hex("#e8fff4");
export const FX = {
  // her division: a burst of slime where the blow lands, pale droplets flying off (the small slugs scatter from it)
  split: { cw: 220, ch: 200, ox: 110, oy: 150, frames: 8, fps: 18, draw(p, u) {
    const a = 1 - u * u;
    blendEllipse(p, 0, -40, 40 * (0.5 + u), 34 * (0.5 + u), SM1, 0.45 * a);
    for (let c = 0; c < 20; c++) {
      const ang = rnd(c) * Math.PI * 2, d = (30 + 60 * rnd(c + 3)) * ease(u);
      const x = Math.cos(ang) * d, y = -40 + Math.sin(ang) * d * 0.7 + 50 * u * u;
      blendDisc(p, x, y, 2.5 + 2.5 * rnd(c + 6), c % 3 ? SM1 : hex("#bfe8dc"), a);
      if (c % 4 === 0) p.blend(x - 1, y - 1, hex("#ffffff"), a);
    }
  } },
  // a thrown kunai, point toward +x (the game turns the card to its flight); pivot at its middle
  kunai: { cw: 40, ch: 12, ox: 20, oy: 6, frames: 1, fps: 1, draw(p) {
    const ink = hex("#1c1a24"), steel = hex("#9aa2b0"), hi = hex("#e4e8f0"), grip = hex("#2c2838"), wrap = hex("#5a5068");
    for (let x = 2; x <= 16; x++) { const w = Math.round((16 - x) * 0.32) + 1; p.rect(x, -w, 1, 2 * w + 1, ink); if (w > 1) p.rect(x, -w + 1, 1, 2 * w - 1, steel); p.blend(x, -1, hi, 1); }
    p.rect(17, -1, 2, 3, ink);
    p.rect(-10, -1, 12, 3, ink); for (let x = -9; x <= 1; x++) p.rect(x, 0, 1, 1, x % 2 ? grip : wrap);
    p.ring(-14, 0, 3, 1, ink); p.ring(-14, 0, 2, 1, steel);
  } },
  // the summoning cloud (also when she leaves)
  bigsmoke: { cw: 380, ch: 300, ox: 190, oy: 250, frames: 12, fps: 18, draw(p, u) {
    const a = 1 - Math.max(0, (u - 0.55) / 0.45);
    for (let c = 0; c < 16; c++) {
      const ang = rnd(c) * Math.PI * 2, rr = (40 + 100 * rnd(c + 5)) * (0.35 + 0.65 * ease(Math.min(1, u * 1.6)));
      const x = Math.cos(ang) * rr * 1.2, y = -60 + Math.sin(ang) * rr * 0.5 - 60 * u * rnd(c + 9);
      const s = (22 + 26 * rnd(c + 2)) * (0.5 + 0.5 * Math.min(1, u * 2.2));
      if (a >= 0.99) { p.circle(x, y + 3, s + 2, SM3); p.circle(x, y, s, SM2); p.circle(x - s * 0.25, y - s * 0.25, s * 0.7, SM1); }
      else { blendDisc(p, x, y + 3, s + 2, SM3, a * 0.9); blendDisc(p, x, y, s, SM2, a); blendDisc(p, x - s * 0.25, y - s * 0.25, s * 0.7, SM1, a); }
    }
  } },
  // a small puff (a piece leaving, merging back)
  puff: { cw: 80, ch: 70, ox: 40, oy: 56, frames: 8, fps: 18, draw(p, u) {
    for (let c = 0; c < 6; c++) {
      const a = (c / 6) * Math.PI * 2, r = 3 + 12 * ease(u), s = 5 + 4 * Math.sin(Math.min(1, u * 1.5) * Math.PI * 0.8);
      blendDisc(p, Math.cos(a) * r, -8 + Math.sin(a) * r * 0.6 - 8 * u, s, SM2, 1 - u * u);
      blendDisc(p, Math.cos(a) * r - 1, -9 + Math.sin(a) * r * 0.6 - 8 * u, s * 0.7, SM1, 1 - u * u);
    }
  } },
  // the healing glow over an ally a piece lies on: green chakra rising, a soft aura
  heal: { cw: 90, ch: 110, ox: 45, oy: 96, frames: 8, fps: 10, loop: true, draw(p, u) {
    blendEllipse(p, 0, -34, 22, 36, GR2, 0.18);
    blendEllipse(p, 0, -34, 15, 28, GR1, 0.16);
    for (let c = 0; c < 9; c++) {
      const ph = (u + rnd(c)) % 1, x = (rnd(c + 3) - 0.5) * 34, y = -6 - ph * 70;
      const col = c % 3 ? GR1 : GRW;
      p.blend(x, y, col, 1 - ph); p.blend(x + 1, y, col, (1 - ph) * 0.7); p.blend(x, y - 1, col, (1 - ph) * 0.7);
      if (c % 3 === 0) { p.blend(x - 1, y, col, (1 - ph) * 0.6); p.blend(x, y + 1, col, (1 - ph) * 0.6); }
    }
  } },
  // the acid glob in flight: a yellow blob with a few drips (loop)
  glob: { cw: 100, ch: 90, ox: 50, oy: 45, frames: 4, fps: 16, loop: true, draw(p, u) {
    const w = 1 + 0.12 * Math.sin(u * Math.PI * 2);
    blendEllipse(p, 0, 0, 24 * w, 19 / w, AC1, 0.35);
    p.ellipse(0, 0, 16 * w, 13 / w, AC2); p.ellipse(-2, -2, 12 * w, 10 / w, AC1); p.rect(-8, -7, 5, 3, hex("#fff8c0"));
    for (let c = 0; c < 7; c++) { const a = (c / 7) * Math.PI * 2 + u * 3, r = 20 + 4 * Math.sin(u * 6 + c); p.circle(Math.cos(a) * r, Math.sin(a) * r * 0.85, 2 + (c % 2), c % 2 ? AC3 : AC1); }
  } },
  // the burst where it lands: a fan of yellow spray and droplets (like the anime's splash on Manda)
  splash: { cw: 260, ch: 200, ox: 130, oy: 150, frames: 9, fps: 20, draw(p, u) {
    const a = 1 - u * u;
    for (let c = 0; c < 22; c++) {
      const ang = -Math.PI * (0.05 + 0.9 * rnd(c)), v = 60 + 70 * rnd(c + 4), d = v * ease(u);
      const x = Math.cos(ang) * d, y = Math.sin(ang) * d * 0.8 + 60 * u * u;
      const L = 8 + 10 * rnd(c + 8);
      p.line(x * 0.6, y * 0.6, x, y, c % 2 ? AC1 : AC2, a);
      blendDisc(p, x, y, 2 + 2 * rnd(c + 2), c % 3 ? AC1 : AC3, a);
      if (L > 14) p.rect(x, y, 2, 2, hex("#fff8c0"), a);
    }
    blendEllipse(p, 0, -6, 30 * (0.4 + u), 16 * (0.4 + u), AC1, 0.5 * a);
  } },
  // fumes over the pool (loop)
  steam: { cw: 120, ch: 100, ox: 60, oy: 86, frames: 6, fps: 8, loop: true, draw(p, u) {
    for (let c = 0; c < 7; c++) {
      const ph = (u + rnd(c)) % 1, x = (rnd(c + 1) - 0.5) * 60 + Math.sin(ph * 6 + c) * 3, y = -4 - ph * 60;
      blendDisc(p, x, y, 4 + 6 * ph, mix(hex("#d8e070"), hex("#c8c8b8"), ph), 0.35 * (1 - ph));
    }
  } },
  // ---- on the floor
  // her shadow (long, under the body)
  shadow: { ground: true, cw: 300, ch: 140, ox: 150, oy: 70, frames: 1, fps: 1, draw(p) { blendEllipse(p, -20, 0, 120, 50, hex("#16101c"), 0.38); } },
  // a piece's slime trail (one dab; the game lays them down and fades them)
  slime: { ground: true, cw: 24, ch: 16, ox: 12, oy: 8, frames: 1, fps: 1, draw(p) { blendEllipse(p, 0, 0, 9, 4, hex("#e8f4f0"), 0.45); p.rect(-3, -1, 2, 1, hex("#ffffff")); } },
  // where the acid will land: a yellow ring the size of the splash, pulsing, a cross in it
  aim: { ground: true, cw: 110, ch: 110, ox: 55, oy: 55, frames: 6, fps: 12, loop: true, draw(p, u) {
    const R = 5.5 / SPP, k = 0.92 + 0.08 * Math.sin(u * Math.PI * 2);
    p.ring(0, 0, R * k, 3, ACD, 0.9);
    p.ring(0, 0, R * k - 3, 1, AC1, 0.8);
    p.line(-8, 0, 8, 0, AC1, 0.8); p.line(0, -8, 0, 8, AC1, 0.8);
  } },
  // the pool of acid eating into the ground: bubbling (loop); the game fades it out at the end
  pool: { ground: true, cw: 110, ch: 110, ox: 55, oy: 55, frames: 6, fps: 8, loop: true, draw(p, u) {
    const R = 5.5 / SPP;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y) / R + 0.05 * Math.sin(Math.atan2(y, x) * 7 + 1.3) + 0.03 * Math.sin(Math.atan2(y, x) * 3);
      if (d > 1) continue;
      p.blend(x, y, d > 0.86 ? ACD : d > 0.6 ? AC3 : AC1, d > 0.86 ? 0.8 : 0.62);
    }
    for (let c = 0; c < 10; c++) {
      const ph = (u + rnd(c)) % 1, a = rnd(c + 4) * Math.PI * 2, r = Math.sqrt(rnd(c + 7)) * R * 0.8;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (ph < 0.7) p.ring(x, y, 1 + ph * 3, 1, hex("#fff8c0"), 0.8 * (1 - ph));
    }
  } },
};
export const PREFIX = "ky_";
export { KATSUYU, MINI };

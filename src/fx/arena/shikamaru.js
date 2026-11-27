// Shikamaru Nara on the 2.5D stage (2026-11-27).
// Classic (Genin) slot 1 "Shadow Possession Jutsu" (Kagemane no Jutsu, Manga 108 / Anime 58, Narutopedia): his shadow
//   stretches over the ground to the target's shadow; once joined, the target is bound and copies his movements. The
//   shadow has a limit (the area of shadow he has), so the counter is distance. The moment to see: the dark strip
//   running over the floor and closing on the target's feet; then the two figures joined by it.
//   seal (Rat seal) -> aim -> tell (the shadow pools under him) -> bind_go (the strip runs, following the target) ->
//   hold (joined: bound) -> retract
// Shippuden (Jōnin) slot 1 "Shadow Stitching Jutsu" (Kage Nui, Manga 330 / Anime Shippuden 81, Narutopedia): the shadow
//   divides into thin strands that rise out of the ground and pierce the target. The moment: the strands lifting off
//   the floor round the target. A faster, straight strand (no following) that hurts and pins for a moment.
import { shadow, pool, wrap, mark, px, rnd, blendDisc, H } from "./_fx.js";

const SH = "#120c18";
export const MOVES = [
  { id: "shikamaru-kagemane", kind: "arena", variant: "classic/shikamaru-nara-genin", slot: 1,
    seal: 0.4, recover: 0.4, range: 34, cone: 50, cooldown: 7, lock: 0.4,
    stages: [{ mech: "bind", aim: 0.35, tell: 0.45, speed: 18, steer: 2.5, radius: 1.6, reachMax: 30, hold: 2.4, hit: { dmg: 0 }, hitKind: "Schattenbesitz" }],
    dodge: { phase: "tell", back: 12 }, hitPop: "GEBUNDEN",
    sfx: { bind_go: "whoosh", hold: "bite" },
    look: [
      { book: "sk_pool", at: "caster", ground: true, phases: [ "aim", "tell", "bind_go", "hold", "retract" ] },
      { book: "sk_strip", at: "link", ground: true, rotate: true, seg: 2.2, phases: [ "bind_go", "hold", "retract" ] },
      { book: "sk_tip", at: "tip", ground: true, phases: [ "bind_go", "retract" ] },
      { book: "sk_pool", at: "grab", ground: true, phases: [ "hold" ] },
      { book: "sk_bound", at: "grab", phases: [ "hold" ] },
    ] },
  { id: "shikamaru-kagenui", kind: "arena", variant: "shippuden/shikamaru-nara-jonin", slot: 1,
    seal: 0.35, recover: 0.4, range: 34, cone: 45, cooldown: 7, lock: 0.35,
    stages: [{ mech: "bind", aim: 0.3, tell: 0.35, speed: 46, follow: false, radius: 2, reachMax: 30, hold: 1.2, hit: { dmg: 18, status: "stun", statusT: 1.6 }, hitKind: "Schattennähen" }],
    dodge: { phase: "tell", side: 6 }, hitPop: "DURCHBOHRT",
    sfx: { bind_go: "whoosh", hold: "bite" },
    look: [
      { book: "sk_pool", at: "caster", ground: true, phases: [ "aim", "tell", "bind_go", "hold" ] },
      { book: "sk_lane", at: "caster", ground: true, rotate: true, phases: [ "tell" ] },
      { book: "sk_thread", at: "link", ground: true, rotate: true, seg: 2.2, phases: [ "bind_go", "hold", "retract" ] },
      { book: "sk_strands", at: "grab", phases: [ "hold" ], play: "hold" },
      { book: "sk_strands", at: "tip", phases: [ "bind_go" ] },
    ] },
];

export const FX = {
  // the shadow pooled under a figure (a dark ellipse with a soft edge)
  pool: pool({ R: 22, c: [SH, "#241c30"], bubbles: "#3a2a4a", a: 0.7 }),
  // a piece of the strip running over the floor
  strip: shadow({ len: 18, w: 6, c: SH }),
  // its head: a rounded end, a little wider
  tip: { ground: true, cw: 26, ch: 22, ox: 13, oy: 11, frames: 4, fps: 10, loop: true, draw(p, u) { for (let y = -9; y <= 9; y++) for (let x = -11; x <= 11; x++) { const d = (x / 11) ** 2 + (y / (8 + Math.sin(u * 6.28) * 1)) ** 2; if (d <= 1) p.blend(x, y, H(SH), d > 0.75 ? 0.6 : 0.88); } } },
  // bound: dark wisps curling up his legs, a spiral over the head (he copies the caster)
  bound: wrap({ c: [SH, "#3a2a4a", SH], h: 40, w: 14, rings: 3, a: 0.7 }),
  // Shadow Stitching: the thread (thinner), the line it will run (the tell), the strands rising through the target
  thread: shadow({ len: 16, w: 3, c: SH }),
  lane: { ground: true, cw: Math.ceil(px(30)) + 8, ch: 14, ox: 2, oy: 7, frames: 4, fps: 10, loop: true, draw(p, u) { for (let x = 0; x <= px(30); x++) if (((x / 10 - u) % 1 + 1) % 1 < 0.5) p.blend(x, 0, H(SH), 0.55); } },
  strands: { cw: 70, ch: 110, ox: 35, oy: 100, frames: 6, fps: 16, draw(p, u) {
    const k = Math.min(1, u * 2.2);
    for (let s = 0; s < 9; s++) {
      const x0 = (rnd(s) - 0.5) * 40, top = -20 - 70 * k * (0.6 + 0.4 * rnd(s + 3)), lean = (rnd(s + 5) - 0.5) * 20;
      for (let y = 0; y >= top; y--) { const q = y / top; p.blend(x0 + lean * q, y, H(SH), 0.95); if (q < 0.8) p.blend(x0 + lean * q + 1, y, H("#3a2a4a"), 0.8); }
    }
    blendDisc(p, 0, 0, 18, H(SH), 0.4);
  } },
};
export const PREFIX = "sk_";

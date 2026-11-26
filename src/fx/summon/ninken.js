// SUMMON: Kakashi Hatake (Team 7 Sensei, Classic), slot 3 "Summoning: Ninken Fanged Pursuit"
// (Kuchiyose: Doton: Tsuiga no Jutsu). Narutopedia: when the user cannot find a target, the pack is summoned
// UNDERGROUND; the ninken track the target by smell, converge on it, then all together burst from the ground and take
// hold with their fangs; the summoner can then finish the captured target (Manga 29 / Anime 17, Land of Waves, against
// Zabuza: Kakashi wipes his blood on the scroll and slams it to the ground).
// Behaviour here, readable before any name appears:
//   seal    Kakashi slams the scroll; the seal script runs out over the ground in the cast direction
//   track   eight mounds of earth run under the ground from the scroll toward the target, bending after it (scent)
//   lock    the mounds close in round the target and the ground bulges (the warning: step out now)
//   burst   snouts first, then heads and forelegs: each dog leaps out of its own hole, jaws open, at the target
//   hold    on a hit the pack bites and holds (bind); on a miss they snap at air, land, put their noses down and turn
//           about to pick the scent up again, then vanish in summoning smoke
// The animals are 3D rigs (src/fx/summon/_quad.js) drawn in side / front / back; the game picks the view from each
// dog's own heading on the ground (toward the camera = front, away = back, sideways = profile, mirrored for left).
import { NINKEN } from "./_quad.js";
import { hex, mix } from "../../core/index.js";

export const DOGS = ["bull", "pakkun", "uhei", "shiba", "bisuke", "akino", "guruko", "urushi"];
// the dogs' rig animations, baked per dog x view: frames over 0..1, pose(u) for drawDog
const ease = (u) => 1 - (1 - u) ** 3;
export const ANIMS = {
  // out of the ground: under (sink) -> nose, head, forelegs -> a leap with the jaws open, pitched up at the target
  burst: { frames: 7, fps: 20, pose: (u, S) => {
    const full = (S.legH + S.bodyR * 2 + S.headR * 2.6) * S.size * 1.35;
    const rise = Math.min(1, u / 0.6) ** 0.8;
    return { sink: full * (1 - rise), lift: u > 0.6 ? Math.sin(((u - 0.6) / 0.4) * Math.PI * 0.5) * S.legH * 0.55 : 0, pitch: 0.55 - 0.25 * u, headPitch: 0.15, jaw: Math.min(1, u * 1.6), run: 0.6, phase: 0.25, tail: 0.2 };
  } },
  // biting and holding on: reared a little at the target, jaws shut on it, the head tugging side to side
  bite: { frames: 4, fps: 8, loop: true, pose: (u, S) => ({ lift: S.legH * 0.18, pitch: 0.32, headPitch: 0.25, jaw: 0.22, headYaw: Math.sin(u * Math.PI * 2) * 0.28, rear: 0.35, tail: 0.9, wag: 1, phase: u }) },
  // a bite at nothing: the jaws snap shut, the dog drops back to the ground
  snap: { frames: 4, fps: 16, pose: (u, S) => ({ lift: S.legH * 0.5 * (1 - u), pitch: 0.4 * (1 - u), headPitch: 0.2 * (1 - u), jaw: 1 - Math.min(1, u * 2.2), run: 0.4, phase: 0.25 + u * 0.2, tail: 0.5 }) },
  // nose down to the ground, swinging the head to find the scent; tail going
  sniff: { frames: 8, fps: 8, loop: true, pose: (u, S) => ({ headPitch: -0.75 + 0.12 * Math.sin(u * Math.PI * 4), headYaw: Math.sin(u * Math.PI * 2) * 0.55, pitch: -0.12, crouch: 0.3, tail: 0.9, wag: 1, phase: u }) },
  // a trot (after the miss, turning about)
  run: { frames: 6, fps: 14, loop: true, pose: (u) => ({ run: 1, phase: u, tail: 0.7 }) },
};
export const VIEWS = ["side", "front", "back"];

// ---- the move's numbers (studs and seconds of the game; shared by the server's simulation and the client)
export const MOVE = {
  id: "kakashi-ninken-tsuiga",
  variant: "classic/kakashi-hatake-team-7-sensei", slot: 3,
  seal: 0.55,          // scroll on the ground; the pack goes under
  speed: 30,           // studs/s under the ground
  turn: 2.4,           // rad/s: how fast the line bends after the scent
  range: 70,           // how far the scent is picked up (in the cast direction, +-60 deg)
  cone: 60,
  maxTrack: 2.8,       // s under the ground at most
  close: 7,            // pack centre this near the target: lock
  warn: 0.38,          // ground bulges this long before the burst (the tell)
  radius: 3.4,         // the burst ring catches the target within this of its centre
  ring: [3.2, 4.4],    // the dogs' holes round the burst point
  hold: 2.6,           // bind time on a hit
  missLook: 1.5,       // nose-down search after a miss
  dmg: 6,
  cooldown: 4,
  lock: 0.55,          // the summoner can't move while he seals
  missRange: 26,       // no target in the cone: the pack runs out this far and comes up empty
};

// ---- ground effects, drawn with the pixelfx painter (feet / origin at 0,0; the ground is squashed by GROUND for the
// stage camera's tilt). Each: { frames, fps, loop, draw(p, u, i) }
const GROUND = 0.7;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const DIRT = hex("#7a5a3a"), DIRTD = hex("#54402c"), DIRTL = hex("#a07c52"), CRACK = hex("#2a2018");
export const FX = {
  // the scroll slammed flat on the ground, Kakashi's blood smear on it, seal script running out ahead (+x)
  seal: { frames: 10, fps: 18, draw(p, u) {
    const paper = hex("#ece2c6"), ink = hex("#2a1e22"), blood = hex("#a82430");
    const open = Math.min(1, u * 2.5), w = 4 + 18 * open;
    p.rect(-3, -3, 6, 6, hex("#6a4a30"));
    p.rect(-1, -2 * GROUND, w, 4 * GROUND + 1, paper);
    for (let i = 0; i < Math.floor(w / 3); i++) p.line(2 + i * 3, -1, 2 + i * 3, 1, ink);
    if (open > 0.3) p.rect(3, -1, 3, 2, blood);
    // the script: lines of characters out along the ground, fanning a little
    const reach = Math.max(0, u - 0.25) / 0.75 * 46;
    for (let k = -1; k <= 1; k++) for (let s = 0; s < reach; s += 4) {
      const x = w + 2 + s, y = k * (2 + s * 0.18) * GROUND;
      p.rect(x, y - 1, 2, 2, ink, 1 - s / 60);
    }
  } },
  // the same seal running toward the camera (down the screen; the game flips it for 'up'): the script lines spread
  // apart as they come nearer
  sealv: { frames: 10, fps: 18, draw(p, u) {
    const paper = hex("#ece2c6"), ink = hex("#2a1e22"), blood = hex("#a82430");
    const open = Math.min(1, u * 2.5), h = 3 + 12 * open;
    p.rect(-3, -3, 6, 6, hex("#6a4a30"));
    p.rect(-3, -1, 6, h * GROUND, paper);
    for (let i = 0; i < Math.floor(h / 3); i++) p.line(-2, 1 + i * 3 * GROUND, 2, 1 + i * 3 * GROUND, ink);
    if (open > 0.3) p.rect(-1, 2, 2, 2, blood);
    const reach = Math.max(0, u - 0.25) / 0.75 * 30;
    for (let k = -1; k <= 1; k++) for (let s2 = 0; s2 < reach; s2 += 3) {
      const y = h * GROUND + 2 + s2, x = k * (3 + s2 * 0.3);
      p.rect(x - 1, y, 2 + s2 / 20, 1 + s2 / 20, ink, 1 - s2 / 40);
    }
  } },
  // a mound of earth moving under the ground: a hump, cracks, flying crumbs (loop)
  mound: { frames: 6, fps: 14, loop: true, draw(p, u, i) {
    const bob = Math.sin(u * Math.PI * 2) * 0.8;
    p.ellipse(0, 0, 11, 5 * GROUND + 1, CRACK);
    p.ellipse(0, -1 - bob, 9.5, 4.4, DIRTD);
    p.ellipse(-1, -2.5 - bob, 7, 3, DIRT);
    p.ellipse(-2.5, -3.5 - bob, 3.5, 1.4, DIRTL);
    for (let c = 0; c < 6; c++) { const a = rnd(c + i * 7) * Math.PI * 2; p.line(Math.cos(a) * 4, Math.sin(a) * 1.6 - 1, Math.cos(a) * 11, Math.sin(a) * 4.4, CRACK); }
    for (let c = 0; c < 5; c++) { const x = (rnd(c * 3 + i) - 0.5) * 18, y = -4 - rnd(c + i * 5) * 8; p.rect(x, y, c % 2 + 1, c % 2 + 1, c % 2 ? DIRTL : DIRTD); }
  } },
  // the furrow a mound leaves behind it (fades out on the client)
  trail: { frames: 1, fps: 1, draw(p) {
    p.ellipse(0, 0, 6, 2.2, DIRTD);
    p.line(-6, 0, 6, 0, CRACK);
    p.rect(-3, -1, 1, 1, DIRTL); p.rect(3, 1, 1, 1, DIRTL);
  } },
  // the burst zone: a ring of cracks the size of the catch (MOVE.radius), pulsing: the place to step out of
  zone: { frames: 6, fps: 12, loop: true, draw(p, u) {
    const R = 3.4 / (10.7 / 72), k = 0.92 + 0.08 * Math.sin(u * Math.PI * 2);
    for (let a = 0; a < 48; a++) {
      const t = (a / 48) * Math.PI * 2, x = Math.cos(t) * R * k, y = Math.sin(t) * R * k * GROUND;
      if (a % 4 !== 3) p.rect(x - 1, y - 1, 2, 2, a % 2 ? CRACK : DIRTD);
    }
    for (let c = 0; c < 8; c++) { const t = (c / 8) * Math.PI * 2 + 0.2; p.line(Math.cos(t) * R * 0.5, Math.sin(t) * R * 0.5 * GROUND, Math.cos(t) * R * k, Math.sin(t) * R * k * GROUND, CRACK, 0.8); }
  } },
  // the ground bulging before the burst: a widening ring of cracks
  bulge: { frames: 6, fps: 16, draw(p, u, i) {
    const r = 3 + 6 * u;
    p.ellipse(0, 0, r + 1, (r + 1) * GROUND * 0.6, DIRTD);
    p.ellipse(0, -1, r, r * GROUND * 0.5, DIRT);
    for (let c = 0; c < 6; c++) { const a = (c / 6) * Math.PI * 2 + rnd(c) * 0.5; p.line(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.25, Math.cos(a) * (r + 2), Math.sin(a) * (r + 2) * GROUND * 0.6, CRACK); }
  } },
  // earth thrown up as a dog comes out: clods arcing out, dust
  dirt: { frames: 9, fps: 20, draw(p, u) {
    p.ellipse(0, 0, 6, 2.5, CRACK, 1 - u * 0.5);
    for (let c = 0; c < 12; c++) {
      const a = Math.PI * (0.15 + 0.7 * rnd(c)), v = 18 + 16 * rnd(c + 9), x = Math.cos(a) * v * u * (rnd(c + 3) > 0.5 ? 1 : -1), y = -Math.sin(a) * v * u + 40 * u * u;
      if (y > 1) continue;
      p.rect(x, y, c % 3 === 0 ? 2 : 1, c % 3 === 0 ? 2 : 1, c % 2 ? DIRT : DIRTD);
    }
    for (let c = 0; c < 5; c++) p.circle((rnd(c + 20) - 0.5) * 14 * (0.4 + u), -2 - 5 * u * rnd(c + 30), 2 + 3 * u, mix(DIRTL, hex("#c8b8a0"), u), 0.7 * (1 - u));
  } },
  // the summoning smoke the pack leaves in
  smoke: { frames: 9, fps: 18, draw(p, u) {
    const W1 = hex("#f2f0f4"), W2 = hex("#c8c6d4");
    for (let c = 0; c < 7; c++) {
      const a = (c / 7) * Math.PI * 2, r = 3 + 8 * u, x = Math.cos(a) * r, y = -6 + Math.sin(a) * r * 0.6 - 6 * u;
      const s = 4 + 4 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.8);
      p.circle(x, y, s + 1, W2, 1 - u * u);
      p.circle(x - 0.5, y - 0.5, s, W1, 1 - u * u);
    }
  } },
  // a hold mark over the bound target: teeth marks / a small "caught" burst at the bite height
  hold: { frames: 4, fps: 10, loop: true, draw(p, u) {
    const a = 1 - u;
    for (let c = 0; c < 4; c++) { const ang = c * Math.PI / 2 + u; p.line(Math.cos(ang) * 3, Math.sin(ang) * 3, Math.cos(ang) * 6, Math.sin(ang) * 6, hex("#ffffff"), a); }
  } },
};
export { NINKEN };

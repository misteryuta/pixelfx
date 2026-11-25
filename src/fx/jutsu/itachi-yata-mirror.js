// Susanoo: Yata no Kagami (Yata Mirror, Itachi). Narutopedia (Yata Mirror; debut manga ch. 392 / anime ep. 138):
// an ethereal shield with no set form, held in the left hand of Itachi's Susanoo; it can change any of its attributes,
// is "endowed with all nature transformations" and changes its nature to nullify every incoming attack, spiritual or
// physical. With the Sword of Totsuka (right hand) it made his Susanoo invincible (ch. 393).
// The moment: an attack lands square on the mirror and simply ends there, while the mirror's sheen turns to the nature
// that answers it. Shown in game colours (an interpretation, not from the source): fire is answered by water (blue,
// the fireball dies in steam), lightning by wind (pale green, the bolt frays into harmless sparks).
// Here: Itachi (the user's turnaround) calls the Susanoo, ribs to hooded armour in quick stages; the left arm brings
// the mirror up in front of him; a great fireball comes in from the far side and breaks on it; then a bolt of
// lightning; both end on the glass; the arm lowers, the Susanoo fades.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, noise2, WHITE, TAU } from "../../core/index.js";
import { play } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";
import { drawSusanoo, susanooPuppet, rigOf, keyTrack } from "./_susanoo.js";
import { cineCam } from "./_cinema.js";
import { drawItachi } from "./_itachi.js";
import { modelPoint } from "./_models.js";

const EYE = 0.05, OPEN = 0.5, RIBS = 0.55, BONES = 0.8, FLESH = 1.05, ARMOUR = 1.35, RAISE = 1.75;
const FIRE0 = 1.95, HIT1 = 2.4, BOLT0 = 2.95, HIT2 = 3.1, LOWER = 3.75, GONE = 4.3, END = 4.9, TX = 170, FROM = 330;
const FIRE = ["#7a1a0c", "#e8461a", "#ff8a2a", "#ffc23d", "#fff3a6"].map(hex), BOLTC = ["#3a4aa0", "#9ab8ff", "#e8f0ff"].map(hex);
const WATERN = hex("#4aa0ff"), WINDN = hex("#a8f0c0"), MIR = ["#4a0a0a", "#a01818", "#e03a2a", "#ff8a6a"].map(hex);

export const meta = {
  name: "Yata mirror",
  desc: "Itachi calls his Susanoo, ribs to hooded armour; its left arm brings the Yata Mirror up in front of him; a great fireball breaks on it and dies in steam as the glass turns to water, then a bolt of lightning frays into sparks as it turns to wind; the arm lowers and the Susanoo fades.",
  tags: ["jutsu", "itachi", "susanoo", "mangekyou", "defense", "shield", "one-shot"],
  size: [330, 250],
  origin: [90, 208],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#3a0806", "#8a1a10", "#d8461c", "#ff8a3a", "#ffd8a0"], seed: 43 },
};

// the Susanoo's arms (angle from the torso: 0 toward the target, + down; reach): the far (left) arm with the mirror
const GUARD = { lean: 0, twist: 0, head: 0, near: [1.35, 0.55], far: [0.85, 0.45], low: [1.95, 0.58], blade: -1.2 };
const UP = { ...GUARD, far: [-0.05, 0.92], lean: 0.05, twist: 0.15, head: 0.08 };
const pose = keyTrack([
  [0, GUARD],
  [RAISE - 0.2, GUARD],
  [RAISE + 0.15, UP],
  [HIT1, { ...UP, lean: -0.06 }],
  [HIT1 + 0.25, UP],
  [HIT2, { ...UP, lean: -0.05 }],
  [LOWER, UP],
  [LOWER + 0.4, GUARD],
  [END, GUARD],
]);
const REST0 = rigOf({ ...GUARD, y: -6 });
const rigAt = (t) => rigOf({ ...pose(t), y: -6 + Math.sin(t * 2.4) * 0.8 });
// the model's own mirror (the user's Susanoo carries it on its left arm) is carried round in front of Itachi to face
// the far side, and back
const upK = (t) => ease.inOutCubic(smooth(RAISE - 0.25, RAISE + 0.15, t)) * (1 - ease.inOutCubic(smooth(LOWER, LOWER + 0.4, t)));
const mirPose = (t) => { const k = upK(t); return { blade: { a: 0 }, mirror: { rot: -0.08 * k, st: 1, dx: 50 * k, dy: -6 * k } }; };
const puppetAt = (t) => susanooPuppet(t, rigAt(t), "itachi", { rest: REST0, pose: mirPose(t) });
const stageAt = (t) => ({
  ribs: smooth(RIBS, RIBS + 0.2, t) * (1 - smooth(GONE + 0.3, GONE + 0.5, t)),
  bones: smooth(BONES, BONES + 0.2, t) * (1 - smooth(GONE + 0.15, GONE + 0.35, t)),
  flesh: smooth(FLESH, FLESH + 0.3, t) * (1 - smooth(GONE, GONE + 0.25, t)),
  armour: smooth(ARMOUR, ARMOUR + 0.35, t) * (1 - smooth(LOWER + 0.3, GONE, t)),
});
// the mirror's face on screen: just in front of the far hand
const faceAt = (t) => { const P = puppetAt(t); return modelPoint(P.M.name, P.M.view, P.x, P.y, P.o, "mirror", [22, 92]); };
// the incoming: where the fireball / the bolt's head is
const fireX = (t) => FROM + (faceAt(HIT1)[0] - FROM) * ease.inQuad(clamp((t - FIRE0) / (HIT1 - FIRE0)));

// the stock figure is hidden; Itachi is drawn in its place
export const actorAlpha = () => 0;
const CALM = { ...READY, crouch: 2, lean: -1, fx: 4, fy: -17, bx: -2, by: -17, ffx: 6, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [RAISE, { ...CALM, crouch: 3, fx: 8, fy: -26 }, "out"],
    [LOWER + 0.4, CALM],
    [END, CALM],
  ],
  // all on him: the Susanoo up, the two blows that end on the mirror
  hits: [
    { t: RIBS, stop: 0.05, shake: 0.12, amp: 1, target: false, sfx: "cast" },
    { t: HIT1, stop: 0.1, shake: 0.35, amp: 2, target: false, sfx: "block" },
    { t: HIT2, stop: 0.08, shake: 0.3, amp: 2, target: false, sfx: "parry" },
    { t: LOWER, target: false, sfx: "whoosh" },
  ],
};

// the camera: on him as the Susanoo forms; out so the mirror and the far side are both in the shot as the fireball
// comes; a hair in on the mirror for each blow; out as it fades
export const camera = cineCam([
  [0, { z: 1.5, x: 10, y: -46 }],
  [ARMOUR, { z: 1.1, x: 30, y: -84 }],
  [FIRE0, { z: 1.1, x: 90, y: -80 }],
  [HIT1, { z: 1.3, x: 70, y: -74, shake: 0.5 }],
  [HIT1 + 0.3, { z: 1.2, x: 80, y: -76 }],
  [HIT2, { z: 1.32, x: 70, y: -74, r: -2, shake: 0.5 }],
  [HIT2 + 0.35, { z: 1.2, x: 70, y: -74, r: 0 }],
  [END, { z: 1.2, x: 40, y: -56 }],
]);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let b1 = false, b2 = false;
  // the nature the glass shows, and how strongly (0..1), at t
  const nature = (t) => (t >= HIT2 - 0.02 ? [WINDN, 1 - smooth(HIT2 + 0.3, LOWER, t)] : t >= HIT1 - 0.02 ? [WATERN, 1 - smooth(HIT1 + 0.3, BOLT0, t)] : [MIR[3], 0]);
  return {
    update(t, dt) {
      // the fireball sheds flame on its way
      if (t > FIRE0 && t < HIT1 && R.chance(70 * dt)) ps.spawn(P.FIRE, fireX(t) + 6, -60 + R.range(-6, 6), R.range(20, 60), -R.range(5, 25), R.range(0.15, 0.3), 0, R.range(2, 3));
      const M = faceAt(t);
      if (!b1 && t >= HIT1) {
        b1 = true;
        lights.add(M[0], M[1], 70, WATERN, 0.8, 0.3);
        // the fire dies on the glass: steam rolling back off it, no flame past it
        for (let i = 0; i < 26; i++) ps.spawn(P.SMOKE, M[0] + R.range(0, 8), M[1] + R.range(-14, 14), R.range(20, 70), R.range(-30, 10), R.range(0.6, 1.2), hex("#d8e4ec"), 1.6);
      }
      if (!b2 && t >= HIT2) {
        b2 = true;
        lights.add(M[0], M[1], 70, WINDN, 0.8, 0.25);
        // the bolt frays into sparks that drop away harmless
        for (let i = 0; i < 22; i++) ps.spawn(P.MOTE, M[0] + 4, M[1] + R.range(-10, 10), R.range(10, 120), R.range(-60, 60), R.range(0.2, 0.4), R.chance(0.5) ? BOLTC[2] : WINDN);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const Rg = rigAt(t), st = stageAt(t), P = puppetAt(t);
      drawSusanoo(p, t, Rg, { kind: "itachi", st, rest: REST0, pose: mirPose(t), mid: (pp) => st.armour > 0 && p.glow(P.far[0], P.far[1], 34, MIR[3], 0.3 * st.armour) });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const Rg = rigAt(t), st = stageAt(t);
      const I = drawItachi(p, t, act.poses), eye = [Math.round(I.eye[0]), Math.round(I.eye[1])];
      drawSusanoo(p, t, Rg, { kind: "itachi", st, layer: "front", rest: REST0, pose: mirPose(t) });
      drawBadge(p, t, { kind: "itachi", t0: EYE, t1: OPEN, label: "YATA", head: [I.crown[0] + 2, I.crown[1] + 18] });
      drawGlint(p, t, "itachi", OPEN + 0.05, END - 0.3, [eye[0] - 2, eye[1] + 0.5]);
      const M = faceAt(t), [nc, nk] = nature(t);
      // the glass: a sheen over the mirror's face that turns to the answering nature as a blow lands, rippling
      if (st.armour > 0.3) {
        const k = st.armour;
        p.ellipse(M[0], M[1], 9, 19, MIR[2], 0.3 * k);
        if (nk > 0) {
          p.ellipse(M[0], M[1], 10, 20, nc, 0.6 * nk * k);
          const rip = (t - (nc === WATERN ? HIT1 : HIT2)) * 50;
          if (rip > 0 && rip < 22) p.arc(M[0], M[1], rip * 0.7, 1, 0, TAU, WHITE, 0.6 * (1 - rip / 22));
        }
      }
      // the fireball: a big ball rolling in from the far side, ending flat on the glass
      if (t > FIRE0 && t < HIT1 + 0.04) {
        const x = fireX(t), r = 11 + 2 * Math.sin(t * 30);
        p.glow(x, -60, r * 2.4, FIRE[2], 0.5);
        p.shade(x - r - 2, -60 - r - 2, x + r + 2, -60 + r + 2, (px, py) => {
          const d = Math.hypot(px - x, py + 60) / r, n = noise2(px * 0.3 + t * 9, py * 0.3, 21);
          if (d > 1 + 0.15 * n) return;
          return d < 0.35 ? FIRE[4] : d < 0.6 ? FIRE[3] : d < 0.85 ? FIRE[2] : FIRE[1];
        });
      }
      // the bolt: a jagged line from the far side, its head driving into the glass, then gone
      if (t > BOLT0 && t < HIT2 + 0.06) {
        const u = clamp((t - BOLT0) / (HIT2 - BOLT0)), x1 = FROM + (M[0] - FROM) * u;
        let px = FROM, py = -70;
        for (let i = 1; i <= 12; i++) {
          const nx = FROM + (x1 - FROM) * (i / 12), ny = -70 + (M[1] + 70) * (i / 12) * u + noise2(i, Math.floor(t * 30), 33) * 6;
          p.beam(px, py, nx, ny, 2, BOLTC[1]);
          p.line(px, py, nx, ny, BOLTC[2]);
          (px = nx), (py = ny);
        }
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

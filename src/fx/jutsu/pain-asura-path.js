// Asura Path (one of Pain's six). Narutopedia: augments the body with mechanised armour and weapons: up to four extra
// arms and two extra faces, a serrated blade sash round the waist; it fires its forearms as projectiles, or pulls them
// off to fire clusters of segmented missiles; blades, drills and tendrils from its arms. Here: the Rinnegan; its back
// splits and four mechanical arms unfold with a whine, two more faces turn out of the sides of its head; one arm locks
// onto the target and its forearm fires on a chain of smoke; then it pulls the hand off the other arm and a cluster of
// missiles streaks out of the stump, curving, smoke trails, and they hit in a rippling chain of blasts.
// New: the extra arms (jointed, plated), the faces, the rocket forearm, the missile cluster with curving trails.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, blast } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, UNFOLD = 0.45, ARMED = 1.0, FIST = 1.2, FHIT = 1.45, POP = 1.8, SALVO = 2.0, END = 4.0, TX = 190;
const MET = ["#2a2a34", "#4a4a5a", "#7a7a8e", "#b8b8c8"].map(hex), FIRE = ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"].map(hex), SMK = hex("#8a8494");
const NM = 10;

export const meta = {
  name: "Asura Path",
  desc: "Pain's Asura Path: four mechanical arms unfold out of its back and two more faces turn out of its head; a forearm fires on a chain of smoke, then a hand pulls off and a cluster of curving missiles streaks out of the stump into a rippling chain of blasts.",
  tags: ["jutsu", "pain", "akatsuki", "rinnegan", "missiles", "projectile", "aoe", "one-shot"],
  size: [320, 210],
  origin: [56, 178],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a2a34", "#4a4a5a", "#7a7a8e", "#b8b8c8"], seed: 149 },
};

const AIM = { ...READY, crouch: 6, lean: 6, fx: 22, fy: -28, bx: 18, by: -26, ffx: 11, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [UNFOLD, { ...READY, crouch: 5, lean: 10, fx: 4, fy: -16, bx: -4, by: -16 }, "out"],
    [ARMED, AIM, "out"],
    [FIST, { ...AIM, lean: -4 }, "snap"],
    [POP, AIM, "out"],
    [SALVO, { ...AIM, lean: -6 }, "snap"],
    [END, READY],
  ],
  hits: [
    { t: UNFOLD, stop: 0.05, shake: 0.3, amp: 1, target: false, sfx: "clash" },
    { t: FIST, target: false, sfx: "whoosh" },
    { t: FHIT, stop: 0.12, shake: 0.4, amp: 3, push: 4, straw: 20, sfx: "heavy" },
    { t: SALVO, target: false, sfx: "whoosh" },
    ...Array.from({ length: 5 }, (_, i) => ({ t: SALVO + 0.4 + i * 0.07, stop: 0.03, shake: 0.3, amp: 2, push: 2, straw: 12, skin: "char", sfx: "explosion" })),
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the missiles: each curves on its own arc from the stump to a point on and round the target
  const MS = Array.from({ length: NM }, (_, i) => ({ t0: SALVO + i * 0.035, dur: 0.38 + rand(i, 1) * 0.12, tx: TX + (rand(i, 2) - 0.5) * 50, ty: -rand(i, 3) * 12, bend: (rand(i, 4) - 0.5) * 120 }));
  const mAt = (m, u, S) => { const x = S[0] + (m.tx - S[0]) * u, y = S[1] + (m.ty - S[1]) * u + Math.sin(u * Math.PI) * m.bend * 0.4 - Math.sin(u * Math.PI) * 30; return [x, y]; };
  return {
    update(t, dt) {
      MS.forEach((m, i) => { if (t >= m.t0 + m.dur && !m.hit) { m.hit = 1; lights.add(m.tx, m.ty, 40, FIRE[4], 0.3, 0.2); } if (t > m.t0 && t < m.t0 + m.dur && R.chance(60 * dt)) { const b = bodyAt(act.poses, t), [x, y] = mAt(m, (t - m.t0) / m.dur, b.handF); ps.spawn(P.SMOKE, x, y, R.range(-6, 6), -R.range(4, 12), R.range(0.4, 0.8), SMK, 1.2); } void i; });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t), k = ease.outBack(smooth(UNFOLD, UNFOLD + 0.4, t), 1.4), [cx, cy] = b.chest;
      // the four extra arms out of the back: jointed, plated, their hands open like mechanical claws
      for (let i = 0; i < 4; i++) {
        const a0 = -2.75 + i * 0.62 + Math.sin(t * 2 + i) * 0.05, L = 16 * k, sx = cx - 4, sy = cy - 6 + i * 2;
        const ex = sx + Math.cos(a0) * L, ey = sy + Math.sin(a0) * L, a1 = a0 + (i < 2 ? -0.7 : 0.7), hx = ex + Math.cos(a1) * L, hy = ey + Math.sin(a1) * L;
        if (k <= 0.05) continue;
        p.beam(sx, sy, ex, ey, 3, MET[1]); p.beam(ex, ey, hx, hy, 2.6, MET[2]); p.circle(ex, ey, 1.8, MET[3]);
        for (let j = 0; j < 3; j++) p.line(hx, hy, hx + Math.cos(a1 + (j - 1) * 0.5) * 4, hy + Math.sin(a1 + (j - 1) * 0.5) * 4, MET[3]);
      }
      // the serrated blade sash round the waist
      if (k > 0.1) for (let i = 0; i < 6; i++) p.tri(cx - 10 + i * 4, cy + 10, cx - 8 + i * 4, cy + 10, cx - 9 + i * 4, cy + 14, MET[3]);
      for (const m of MS) if (t > m.t0 + m.dur) blast(p, t - m.t0 - m.dur, { x: m.tx, y: 0, R: 8, C: FIRE, seed: 3 + Math.floor(m.tx), layer: "back" });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), [hx, hy] = b.head;
      drawBadge(p, t, { kind: "rinnegan", t0: EYE, t1: UNFOLD - 0.05, label: "SHURADOU", head: b.head });
      drawGlint(p, t, "rinnegan", UNFOLD, END - 0.3, b.head);
      // the two extra faces turned out of the sides of the head
      if (t > UNFOLD + 0.2) { const k = smooth(UNFOLD + 0.2, UNFOLD + 0.5, t); p.circle(hx - 4, hy, 2.5, MET[2], k); p.circle(hx - 2, hy - 4, 2.5, MET[2], k); p.px(hx - 5, hy, hex("#c03040"), k); p.px(hx - 3, hy - 5, hex("#c03040"), k); }
      // the rocket forearm: off its elbow, out on a chain, into the target, back
      if (t > FIST - 0.02 && t < POP) {
        const [ex, ey] = b.handN, u = t < FHIT ? ease.inQuad((t - FIST) / (FHIT - FIST)) : 1 - ease.inOutQuad(clamp((t - FHIT) / (POP - FHIT - 0.05))), x = ex + (TX - 6 - ex) * Math.max(0, u), y = ey + (-30 - ey) * Math.max(0, u);
        for (let i = 0; i < 10; i++) p.px(ex + (x - ex) * (i / 10), ey + (y - ey) * (i / 10), MET[3]);
        p.beam(x - 6, y, x, y, 4, MET[2]); p.circle(x + 1, y, 3, MET[3]);
        if (t < FHIT) p.circle(x - 8, y, 2, FIRE[4]);
        if (t > FHIT && t < FHIT + 0.15) p.circle(TX - 4, -30, 6, WHITE, 1 - (t - FHIT) / 0.15);
      }
      // the far hand pulled off: the stump, and the missiles streaking out of it on curving smoke trails
      if (t > POP) { const [fx, fy] = b.handF; p.circle(fx, fy, 2.4, MET[3]); for (let i = 0; i < 3; i++) p.px(fx + 2, fy - 1 + i, MET[0]); }
      for (const m of MS) {
        const u = (t - m.t0) / m.dur;
        if (u < 0 || u > 1) continue;
        const [x, y] = mAt(m, u, b.handF), [px, py] = mAt(m, Math.max(0, u - 0.05), b.handF), a = Math.atan2(y - py, x - px);
        p.beam(x - Math.cos(a) * 5, y - Math.sin(a) * 5, x, y, 2, MET[3]);
        p.px(x - Math.cos(a) * 6, y - Math.sin(a) * 6, FIRE[4]);
      }
      for (const m of MS) if (t > m.t0 + m.dur) blast(p, t - m.t0 - m.dur, { x: m.tx, y: 0, R: 8, C: FIRE, seed: 3 + Math.floor(m.tx) });
      void noise2; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

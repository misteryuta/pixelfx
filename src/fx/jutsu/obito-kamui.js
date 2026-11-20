// Kamui, long range (Obito). Narutopedia: with his right Mangekyou Obito opens a spiralling void at a target and pulls it
// into Kamui's own dimension, a bleak world of endless block-shaped pillars; he can follow it in himself, and whatever
// is in there is at his mercy until he lets it out. Here: his Mangekyou, a hand raised to the eye, a spiral opening on
// the target that wrings and swallows it; then he swirls himself into his own eye and the world turns into the dimension:
// pale sky, block pillars going off forever. The target drops onto a pillar, Obito spirals in on the one facing it and
// soaks up the place's chakra (a dark aura, ATK and SPD up). Then both are swirled out again: back in the real world the
// void spits the target out, dazed, and Obito steps out of his own spiral, still burning.
// New: the trip (Obito's own warp in and out, actorAlpha), the dimension as the whole scene, the target taken, dropped,
// taken again and spat out (targetState). From _lib: warp, drawOutline.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, warp, drawOutline } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const EYE = 0.05, OPEN = 0.6, AIM = OPEN + 0.15, SPIRAL = AIM + 0.15, SUCK = SPIRAL + 0.3, TAKEN = SUCK + 0.7;
const SELF = TAKEN + 0.15, GONE = SELF + 0.45, DIM = GONE - 0.1, DROP = DIM + 0.3, LAND = DROP + 0.32, ARRIVE = DIM + 0.55, HERE = ARRIVE + 0.35;
const BUFF = HERE + 0.25, LEAVE = BUFF + 1.35, OUT = LEAVE + 0.4, SHUT = LEAVE + 0.75, BACK = SHUT + 0.1, END = BACK + 1.25, TX = 150;
const SP = ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"].map(hex), AURA = ["#2a1840", "#5a3a8a", "#9a78d0", "#e0d0ff"].map(hex);
// the dimension: a pale sky, pillars in three depths (far to near), the near pillar tops they stand on
const DSKY = ["#f0eef8", "#dcdaea", "#c4c2d8"].map(hex), DPIL = [["#b8b6cc", "#a8a6bc"], ["#9896b0", "#82809c"], ["#6e6c88", "#55536e"]].map((a) => a.map(hex));
const TOP = ["#4a4862", "#5e5c78", "#8a88a4", "#c8c6dc"].map(hex);
const VY = -28, CX = 76, CY = -46;

export const meta = {
  name: "Kamui (Obito)",
  desc: "Obito: a spiral swallows the target, then he swirls himself in after it: in Kamui's dimension of pillars he soaks up its chakra (ATK and SPD up), then both are spat back out into the real world.",
  tags: ["jutsu", "obito", "kamui", "mangekyou", "space-time", "buff", "one-shot"],
  size: [264, 162],
  origin: [56, 126],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a0a12", "#1a1a2a", "#3a3850", "#7a7898", "#d8d8f0"], seed: 43 },
};

const CALM = { ...READY, crouch: 2, fx: 6, fy: -18, bx: -2, by: -18, ffx: 6, fbx: -6 };
const EYEH = { ...CALM, crouch: 3, lean: 2, fx: 9, fy: -33, bx: -2, by: -20 };
const POWER = { ...READY, crouch: 7, lean: -3, fx: 12, fy: -22, bx: -10, by: -22, ffx: 10, fbx: -10 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [OPEN, CALM, "out"],
    [AIM, EYEH, "out"],
    [TAKEN, { ...EYEH, lean: 4 }],
    [GONE, EYEH],
    [HERE, { ...CALM, crouch: 4 }, "snap"],
    [BUFF, POWER, "out"],
    [LEAVE - 0.2, { ...POWER, crouch: 5 }],
    [LEAVE, EYEH, "out"],
    [BACK + 0.1, { ...EYEH, fx: 14, fy: -26 }, "snap"],
    [END, CALM],
  ],
  hits: [
    { t: SUCK, stop: 0.04, flash: 0, push: 0, straw: 6, shiver: 0.8 },
    { t: TAKEN, stop: 0.08, shake: 0.3, amp: 2, target: false },
    { t: LAND, stop: 0.06, shake: 0.2, amp: 2, push: 1.4, straw: 10, shiver: 0.5 },
    { t: BUFF, stop: 0.1, shake: 0.35, amp: 2, target: false },
    { t: BACK, stop: 0.12, shake: 0.35, amp: 3, push: -4, straw: 30, skin: "shadow" },
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: BACK + 0.12, x: 0, n: 12 }],
};

// Obito himself: swirled into his own eye, out of sight while the world changes, swirled in on his pillar, and out again
export const actorAlpha = (t) => {
  if (t < SELF) return 1;
  if (t < GONE) return 1 - smooth(SELF, GONE, t);
  if (t < ARRIVE) return 0;
  if (t < HERE) return smooth(ARRIVE, HERE, t);
  if (t < LEAVE + 0.05) return 1;
  if (t < OUT) return 1 - smooth(LEAVE + 0.05, OUT, t);
  if (t < BACK) return 0;
  return smooth(BACK, BACK + 0.25, t);
};

// the target: wrung into the void; dropped into the dimension onto its pillar; wrung away again; spat back out
export const targetState = (t) => {
  if (t < SUCK) return null;
  if (t < TAKEN) {
    const u = ease.inCubic(smooth(SUCK, TAKEN, t));
    return { rot: 14 * u * u, s: 1 - u, dy: (VY + 26) * u, tint: [SP[3], 0.5 * u] };
  }
  if (t < DROP) return { a: 0 };
  if (t < LAND) {
    const u = (t - DROP) / (LAND - DROP);
    return { dy: -96 * (1 - u * u), rot: 3 * (1 - u), s: Math.min(1, 0.3 + u * 1.4) };
  }
  if (t < LEAVE) return null;
  if (t < OUT) {
    const u = ease.inCubic(smooth(LEAVE, OUT, t));
    return { rot: -12 * u * u, s: 1 - u, dy: (VY + 26) * u, tint: [SP[3], 0.5 * u] };
  }
  if (t < BACK) return { a: 0 };
  const u = ease.outBack(clamp((t - BACK) / 0.25), 2);
  return u >= 1 ? null : { rot: -6 * (1 - u), s: Math.max(0.05, u), dy: (VY + 26) * (1 - u) };
};

// a spiral of void: arms turning round a black eye, r its size
function vortex(p, x, y, r, t, k, eye = true) {
  if (k <= 0) return;
  if (eye) p.circle(x, y, Math.max(1, r * 0.25 * k), SP[0]);
  for (let i = 0; i < 3; i++)
    for (let s = 0; s < 3; s++) {
      const a0 = t * 14 + (i * TAU) / 3 + s * 0.6, rr = (r - s * r * 0.25) * k;
      if (rr > 1.5) p.arc(x, y, rr, 1, a0, a0 + 1.7, s ? SP[3] : SP[4], 0.7 + 0.3 * k);
    }
}

// how far the world has turned into the dimension: it spirals open from between them and spirals shut again
const dimK = (t) => smooth(DIM, DIM + 0.45, t) * (1 - smooth(LEAVE + 0.2, SHUT, t));

/** The dimension as the scene: a spiral-edged window grown to cover everything, pillars in three depths, the two tops. */
function dimension(p, t, k) {
  if (k <= 0) return;
  const RMAX = 260;
  p.shade(-60, -130, 212, 40, (x, y, out) => {
    const dx = x - CX, dy = (y - CY) * 1.25, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    // the edge: a spiral, so it reads as Kamui opening, not a box
    const edge = RMAX * k * (1 + 0.12 * Math.sin(ang * 3 + d * 0.05 - t * 8));
    if (d > edge) return;
    if (d > edge - 3) return SP[3];
    // the soft vignette at the frame's own edges: the sheet is transparent around it
    const e = Math.min(x + 60, 212 - x, y + 130, 40 - y);
    if (e < 10) out.a = e / 10;
    // pillars, far to near: each depth its own width, spacing and drift
    const lay = [
      { w: 9, gap: 21, top: -78, drift: 2, off: 5 },
      { w: 14, gap: 33, top: -56, drift: 4, off: 17 },
      { w: 22, gap: 58, top: -30, drift: 7, off: 40 },
    ];
    for (let L = 2; L >= 0; L--) {
      const l = lay[L], u = ((x + l.off + t * l.drift) % l.gap + l.gap) % l.gap, h = l.top - 10 * rand(Math.floor((x + l.off + t * l.drift) / l.gap), L + 3);
      if (u < l.w && y > h) {
        if (y < h + 1) return DSKY[0];
        return u < l.w * 0.55 ? DPIL[L][0] : DPIL[L][1];
      }
    }
    return y < -90 ? DSKY[0] : y < -40 ? DSKY[1] : DSKY[2];
  });
  if (k < 0.6) return;
  // the pillar tops they stand on
  const a = smooth(0.6, 0.9, k);
  for (const [x, w] of [[0, 34], [TX, 38]]) {
    p.rect(x - w / 2, 0, w, 40, TOP[0], a);
    p.rect(x - w / 2, 0, w * 0.45, 40, TOP[1], a);
    p.rect(x - w / 2, -1, w, 1, TOP[3], a);
    p.rect(x - w / 2, 0, w, 1, TOP[2], a);
  }
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  let spat = false, buffed = false;
  return {
    update(t, dt) {
      const b = bodyAt(act.poses, t);
      // the dimension's chakra drawn into him from every pillar while he stands there
      if (t > HERE && t < BUFF + 0.3 && R.chance(160 * dt)) {
        const T = R.range(0.25, 0.4), x0 = R.range(-50, 200), y0 = R.range(-110, -20);
        ps.spawn(P.STREAK, x0, y0, (b.chest[0] - x0) / T, (b.chest[1] - y0) / T, T, R.chance(0.5) ? AURA[3] : AURA[2]);
      }
      // the aura: dark motes spiralling up off him while the buff lasts
      if (t > BUFF && t < END - 0.4 && R.chance(40 * dt) && actorAlpha(t) > 0.5) ps.spawn(P.EMBER, R.range(-10, 10), -R.range(0, 40), R.range(-12, 12), -R.range(20, 50), R.range(0.4, 0.8), AURA[R.int(1, 3)]);
      if (!buffed && t >= BUFF) {
        buffed = true;
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * TAU;
          ps.spawn(P.STREAK, Math.cos(a) * 8, -20 + Math.sin(a) * 8, Math.cos(a) * 140, Math.sin(a) * 140, 0.2, i % 2 ? AURA[3] : WHITE);
        }
      }
      if (!spat && t >= BACK) {
        spat = true;
        for (let i = 0; i < 18; i++) {
          const a = R.range(0, TAU), s = R.range(60, 180);
          ps.spawn(P.STREAK, TX, VY, Math.cos(a) * s, Math.sin(a) * s, 0.15, i % 2 ? WHITE : SP[3]);
        }
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      const b = bodyAt(act.poses, t);
      dimension(p, t, dimK(t));
      // the buff: a dark aura burning round his outline, a spiral turning on the floor under him
      const seen = actorAlpha(t);
      if (t > BUFF && t < END - 0.2 && seen > 0) {
        const k = smooth(BUFF, BUFF + 0.2, t) * (1 - smooth(BACK + 0.4, END - 0.2, t)) * seen;
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, AURA[2], { w: 1, a: k, flick: t * 16 });
        drawOutline(p, b.q, b.q.x ?? 0, b.q.y ?? 0, AURA[1], { w: 3, a: 0.7 * k, flick: t * 11 + 2 });
        for (let i = 0; i < 3; i++) {
          const a0 = t * 5 + (i * TAU) / 3;
          p.arc(0, -1, 16, 1, a0, a0 + 1.5, AURA[2], 0.6 * k);
        }
        p.glow(0, -22, 40, AURA[1], 0.5 * k);
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), head = b.head;
      drawBadge(p, t, { kind: "obito", t0: EYE, t1: OPEN, label: "KAMUI", head });
      if (actorAlpha(t) > 0.3) drawGlint(p, t, "obito", OPEN + 0.05, END - 0.3, head);
      // the spiral on the target, the target wrung into it
      if (t > SPIRAL && t < TAKEN + 0.25) {
        const open = smooth(SPIRAL, SUCK, t), shut = smooth(TAKEN - 0.05, TAKEN + 0.25, t);
        if (t > SUCK && t < TAKEN) {
          const u = smooth(SUCK, TAKEN, t);
          warp(p, TX, VY, 32, 7 * u * u, 0.6 * u);
        }
        vortex(p, TX, VY, 26, t, open * (1 - shut));
      }
      // Obito swirled into his own eye, and later out of it: his body wrung about the eye
      const swirlIn = (t0, t1, dir) => {
        if (t < t0 || t > t1) return;
        const u = smooth(t0, t1, t), k = dir > 0 ? u : 1 - u;
        warp(p, head[0], head[1] + 8, 30, dir * 8 * k * k, 0.5 * k);
        vortex(p, head[0] + 1, head[1] - 1, 18, t * dir, Math.sin(Math.PI * u));
      };
      swirlIn(SELF, GONE + 0.05, 1);
      swirlIn(ARRIVE - 0.05, HERE, -1);
      swirlIn(LEAVE, OUT + 0.05, 1);
      swirlIn(BACK - 0.1, BACK + 0.3, -1);
      // in the dimension: the target arrives out of a spiral overhead, and leaves into one
      if (t > DROP - 0.15 && t < DROP + 0.25) vortex(p, TX, -96, 18, -t, Math.sin(Math.PI * smooth(DROP - 0.15, DROP + 0.25, t)));
      if (t > LEAVE && t < OUT + 0.15) {
        const u = smooth(LEAVE, OUT, t);
        warp(p, TX, VY, 32, -7 * u * u, 0.6 * u);
        vortex(p, TX, VY, 26, -t, Math.sin(Math.PI * smooth(LEAVE, OUT + 0.15, t)));
      }
      // the spit: the void opens again in the real world and throws it back
      if (t > BACK - 0.25 && t < BACK + 0.25) {
        const k = t < BACK ? smooth(BACK - 0.25, BACK, t) : 1 - smooth(BACK, BACK + 0.25, t);
        vortex(p, TX, VY, 24, -t, k);
      }
      // the buff marks: rising arrows and the words, over his head
      if (t > BUFF && t < END - 0.3 && actorAlpha(t) > 0.5) {
        const a = t - BUFF, k = smooth(0, 0.15, a) * (1 - smooth(LEAVE - 0.3, LEAVE, t) + smooth(BACK + 0.2, BACK + 0.4, t) * (1 - smooth(END - 0.7, END - 0.3, t))), y = head[1] - 24 - Math.min(6, a * 20);
        p.text("ATK+  SPD+", head[0], y - 12, AURA[3], { font: "mini", align: "center", outline: SP[0], a: Math.min(1, k) });
        for (let i = 0; i < 3; i++) {
          const ay = head[1] - 8 - ((a * 30 + i * 8) % 22), ax = head[0] - 14 + i * 14;
          p.tri(ax, ay - 3, ax - 3, ay + 1, ax + 3, ay + 1, AURA[3], Math.min(1, k));
        }
      }
      ps.draw(p, "front");
    },
  };
});

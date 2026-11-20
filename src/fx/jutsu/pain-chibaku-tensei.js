// Chibaku Tensei (Planetary Devastation, Pain / Deva Path). Narutopedia: hands clapped, the user forms a small black
// sphere between them and throws it into the sky; once active it pulls everything round it in until a great satellite of
// earth and rock is made, its size the user's to choose. Here: the Rinnegan, the clap, a black sphere swelling between
// his hands, thrown straight up; it hangs and starts to pull: slabs and stones tear out of the floor and fly up to it,
// the target is dragged and lifted toward it, and the rock packs round the sphere into a rough moon.
// New: the sphere (a black core with a violet rim), the rocks pulled into orbit and packing into a body round it.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt, warp } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const SEALS = sealRun(0.05, ["gassho"], 0.12, { hold: 0.55 });
const FORM = SEALS.end - 0.3, THROW = SEALS.end + 0.05, RISE = 0.45, PULL = THROW + RISE + 0.15, PACKED = PULL + 1.8, TX = 140, SX = 90, SY = -120;
const RG = ["#08040e", "#1c1030", "#3c2070", "#7a4ad0", "#c8b0ff"].map(hex), ROCK = ["#2a2230", "#463a4a", "#6a5a66", "#8a7880"].map(hex);
const N = 60;

export const meta = {
  name: "Planetary devastation",
  desc: "Pain: the Rinnegan, hands clapped round a black sphere thrown into the sky, which pulls slabs and stones out of the floor and the target up toward it until the rock packs round it into a rough moon.",
  tags: ["jutsu", "pain", "nagato", "rinnegan", "pull", "aoe", "one-shot"],
  size: [280, 230],
  origin: [56, 190],
  duration: PACKED + 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#08040e", "#1c1030", "#3c2070", "#7a4ad0", "#c8b0ff"], seed: 48 },
};

const UPTHROW = { ...READY, crouch: 3, lean: -6, fx: 10, fy: -46, bx: 6, by: -44, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    ...SEALS.keys,
    [THROW, UPTHROW, "snap"],
    [PULL, { ...UPTHROW, fx: 8, fy: -40, bx: 2, by: -38 }],
    [PACKED, { ...READY, crouch: 3, lean: -4, fx: 8, fy: -38, bx: 4, by: -30 }],
    [meta.duration, READY],
  ],
  hits: [
    { t: PULL, stop: 0.08, shake: 0.3, amp: 2, push: -1, straw: 10, flash: 0 },
    ...[0.3, 0.6, 0.9, 1.2, 1.5].map((d) => ({ t: PULL + d, stop: 0.02, flash: 0, push: -1.4, straw: 10, shiver: 0.5 })),
    { t: PACKED, stop: 0.12, shake: 0.4, amp: 3, target: false },
  ],
};

// the rocks: where each is torn from (x on the floor), when, its size, where in the moon it ends up (angle, depth)
const rocks = Array.from({ length: N }, (_, i) => ({ x: -10 + rand(i, 1) * 230, t0: PULL + rand(i, 2) * 1.2, s: 3 + rand(i, 3) * 5, a: rand(i, 4) * TAU, d: 0.35 + rand(i, 5) * 0.65, sp: 0.4 + rand(i, 6) * 0.3 }));
const MOON = 42;

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const sphere = (t, b) => {
    if (t < THROW) return [b.handN[0] + 1, b.handN[1] - 3];
    const u = ease.outCubic(clamp((t - THROW) / RISE));
    return [12 + (SX - 12) * u, -40 + (SY + 40) * u];
  };
  return {
    update(t, dt) {
      for (const r of rocks) if (!r.out && t >= r.t0) {
        r.out = true;
        for (let j = 0; j < 4; j++) ps.spawn(P.DUST, r.x, -2, R.range(-30, 30), -R.range(10, 40), R.range(0.4, 0.8), hex("#a08c7a"), R.range(2, 4), 0, 0);
      }
      ps.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
      // the pits the rocks are torn from
      for (const r of rocks) if (t >= r.t0) p.ellipse(r.x, 0.5, r.s, 1.2, hex("#120c18"), 0.8 * (1 - smooth(meta.duration - 0.7, meta.duration - 0.1, t)));
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, RG.slice(1));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "rinnegan", t0: 0.05, t1: SEALS.end, label: "RINNEGAN", head: b.head });
      drawGlint(p, t, "rinnegan", SEALS.end + 0.05, meta.duration - 0.4, b.head);
      const pf = p.fade;
      p.fade = pf * (1 - smooth(meta.duration - 0.7, meta.duration - 0.1, t));
      const [sx, sy] = sphere(t, b), sr = t < FORM ? 0 : 2 + 2 * smooth(FORM, THROW, t);
      // the rock packing round it: each stone flies up along a curve and settles into place in the moon
      const packed = smooth(PULL + 0.4, PACKED, t);
      if (packed > 0) {
        const MR = MOON * packed;
        p.shade(SX - MR - 2, SY - MR - 2, SX + MR + 2, SY + MR + 2, (x, y) => {
          const dx = x - SX, dy = y - SY, a = Math.atan2(dy, dx), edge = MR * (0.85 + 0.15 * noise2(Math.cos(a) * 2 + 4, Math.sin(a) * 2, 2));
          const d = Math.hypot(dx, dy);
          if (d > edge) return;
          const lit = (-dx - dy) / MR + noise2(dx * 0.2, dy * 0.2, 6) * 0.6;
          return d > edge - 1.2 ? ROCK[0] : lit > 0.6 ? ROCK[3] : lit > 0.1 ? ROCK[2] : lit > -0.4 ? ROCK[1] : ROCK[0];
        });
      }
      for (const r of rocks) {
        const a = t - r.t0;
        if (a < 0) continue;
        const u = ease.inOutQuad(clamp(a / r.sp)), ex = SX + Math.cos(r.a) * MOON * r.d * Math.max(0.3, packed), ey = SY + Math.sin(r.a) * MOON * r.d * Math.max(0.3, packed);
        if (u >= 1 && packed > r.d) continue;
        const x = r.x + (ex - r.x) * u + Math.sin(u * Math.PI) * 20 * (r.x < SX ? -1 : 1), y = -r.s + (ey + r.s) * u;
        p.rect(x - r.s / 2, y - r.s / 2, r.s, r.s, ROCK[1]);
        p.rect(x - r.s / 2, y - r.s / 2, r.s - 1, 1, ROCK[3]);
      }
      // the sphere: black, rimmed in violet, bending the air round it once it pulls
      if (sr > 0) {
        if (t > PULL && packed < 0.4) warp(p, sx, sy, 22, 0.6 * Math.sin(t * 6), 0.2 * (1 - packed * 2.5));
        p.glow(sx, sy, 24, RG[3], 0.6 * (1 - packed));
        p.circle(sx, sy, sr + 1.5, RG[3]);
        p.circle(sx, sy, sr, RG[0]);
        p.px(sx - 1, sy - 1, RG[4]);
        if (t > PULL && t < PACKED) for (let i = 0; i < 2; i++) p.ring(sx, sy, 30 - ((t * 40 + i * 15) % 30), 1, RG[3], 0.5);
      }
      p.fade = pf;
      ps.draw(p, "front");
    },
  };
});

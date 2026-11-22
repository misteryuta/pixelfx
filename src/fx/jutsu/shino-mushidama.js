// Hijutsu: Mushidama (Secret Technique: Insect Sphere, Shino Aburame). Narutopedia: Shino releases a vast swarm of
// his kikaichuu (chakra-eating beetles) that surrounds the target from every side in a living sphere; trapped inside,
// the target's chakra is devoured. Here: Shino raises an arm, his coat sleeve open; the beetles pour out in a black
// rustling stream, a second from the collar; the two streams wheel out in wide arcs and close round the target into a
// sphere of churning dots; the sphere tightens, the target's chakra drawn out as faint light sucked into it; the
// swarm loosens and streams back into him.
// New: the swarm (each beetle a dot with a flicker of wings, following a stream path, then orbiting on the sphere).
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const RAISE = 0.35, POUR = 0.55, CLOSE = 1.4, TIGHT = 1.8, DRAIN = 2.0, LOOSEN = 3.0, HOME = 3.6, END = 4.2, TX = 160;
const BUG = ["#06080a", "#141a1c", "#2e3a3c", "#6a8a80"].map(hex), CHAK = hex("#8fe0c0");
const N = 260;

export const meta = {
  name: "Insect sphere",
  desc: "Shino: two black streams of beetles pour from his sleeve and collar, wheel out in wide arcs and close round the target into a churning sphere that devours its chakra, then stream back into him.",
  tags: ["jutsu", "shino", "aburame", "insects", "bind", "drain", "one-shot"],
  size: [260, 180],
  origin: [56, 150],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#06080a", "#141a1c", "#2e3a3c", "#6a8a80"], seed: 180 },
};

const ARM = { ...READY, crouch: 3, lean: -2, fx: 18, fy: -34, bx: -2, by: -20, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RAISE, ARM, "out"],
    [HOME, ARM],
    [END, READY],
  ],
  hits: [
    { t: POUR, target: false, sfx: "whoosh" },
    { t: CLOSE, stop: 0.06, shake: 0.2, amp: 1, push: 0, straw: 8, flash: 0, sfx: "block" },
    ...[0, 0.3, 0.6, 0.9].map((d) => ({ t: DRAIN + d, stop: 0.02, flash: 0, push: 0, straw: 4, skin: "shadow", shiver: 0.4 })),
    { t: LOOSEN, flash: 0, push: 0, straw: 0, skin: null, sfx: "whoosh" },
  ],
};
export const targetState = (t) => (t > TIGHT && t < LOOSEN ? { s: 1 - 0.06 * smooth(TIGHT, DRAIN + 0.6, t) } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // each beetle: which stream it leaves by, its delay, its slot on the sphere (two angles)
  const BU = Array.from({ length: N }, (_, i) => ({ st: i % 2, d: rand(i, 1) * 0.5, th: rand(i, 2) * TAU, ph: rand(i, 3) * Math.PI, sp: 2 + rand(i, 4) * 2 }));
  const sphere = (u, t) => { const r = 34 - 8 * smooth(TIGHT, DRAIN + 0.4, t) + 10 * smooth(LOOSEN - 0.1, LOOSEN + 0.2, t), a = u.th + t * u.sp, el = Math.sin(u.ph + t * 1.3); return [TX + Math.cos(a) * r * Math.cos(el), -28 + Math.sin(el) * r * 0.9, Math.sin(a)]; };
  return {
    update(t, dt) {
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "aburame", t0: 0.04, t1: RAISE, label: "MUSHIDAMA", head: b.head });
      const src = [b.handN, [b.chest[0] + 2, b.chest[1] - 8]];
      // the beetles behind the sphere first, then the ones in front (depth from the orbit)
      for (const pass of [0, 1]) for (const u of BU) {
        const t0 = POUR + u.d, back = HOME - u.d * 0.6;
        if (t < t0 || t > back + 0.4) continue;
        let x, y, z = 1;
        const S = src[u.st];
        if (t < CLOSE + u.d * 0.4) {
          // the stream: out in a wide arc (over the top for the sleeve, under for the collar) to the sphere
          const v = ease.inOutQuad(clamp((t - t0) / (CLOSE + u.d * 0.4 - t0))), [ex, ey] = sphere(u, t), bow = u.st ? 30 : -50;
          x = S[0] + (ex - S[0]) * v; y = S[1] + (ey - S[1]) * v + Math.sin(v * Math.PI) * bow;
        } else if (t < back) { [x, y, z] = sphere(u, t); }
        else { const v = ease.inQuad(clamp((t - back) / 0.4)), [sx, sy] = sphere(u, back); x = sx + (S[0] - sx) * v; y = sy + (S[1] - sy) * v - Math.sin(v * Math.PI) * 20; }
        if ((z < 0) !== (pass === 0)) continue;
        const wing = Math.floor(t * 30 + u.th * 10) % 2;
        p.rect(x, y, 2, 2, z < 0 ? BUG[1] : BUG[0]);
        p.px(x + 1, y, z < 0 ? BUG[2] : BUG[1]);
        if (wing) p.px(x, y - 1, BUG[3]);
      }
      // the chakra drawn out of the target into the swarm
      if (t > DRAIN && t < LOOSEN) for (let i = 0; i < 6; i++) { const ph = (t * 1.5 + i / 6) % 1, a = rand(i, 7) * TAU; p.px(TX + Math.cos(a) * 30 * ph, -28 + Math.sin(a) * 30 * ph, CHAK, 1 - ph); }
      void noise2; void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

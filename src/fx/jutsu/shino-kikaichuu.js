// Hijutsu: Kikaichuu (Parasitic Destruction Insects, Shino). Narutopedia: thousands of insects live in an Aburame's
// body, feeding on their chakra and obeying every command; in battle they pour out in swarms that cover a target and eat
// its chakra. Here: Shino's hands raised, a dark stream of beetles boiling out of his sleeves, swirling up into a cloud
// that rolls across to the target, swarms all over it, feeding, its chakra drawn off in motes, then streams back to him.
// New: the swarm (hundreds of tiny beetles on noisy orbits round a moving centre, each a dark dot with flickering
// wings), the feeding, the return.
import { Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const RAISE = 0.5, POUR = RAISE + 0.15, CLOUD = POUR + 0.4, GO = CLOUD + 0.3, ARRIVE = GO + 0.55, FEED = ARRIVE + 1.1, HOME = FEED + 0.5, END = HOME + 0.6, TX = 150, N = 260;
const BUG = [hex("#0a0e0a"), hex("#1e2a18"), hex("#3d4a28")], WING = hex("#8a9a7a"), CH = hex("#7ad0ff");

export const meta = {
  name: "Parasitic insects",
  desc: "Shino: a stream of beetles boils out of his sleeves into a swirling cloud that rolls across to the target, swarms all over it eating its chakra, then streams back to him.",
  tags: ["jutsu", "shino", "aburame", "insects", "dot", "drain", "one-shot"],
  size: [260, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#0a0e0a", "#1e2a18", "#3d4a28", "#6f8a3a", "#c8e08a"], seed: 63 },
};

const ARMS = { ...READY, crouch: 3, lean: -2, fx: 16, fy: -30, bx: -10, by: -28, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RAISE, ARMS, "out"],
    [GO, { ...ARMS, fx: 20, fy: -26 }, "out"],
    [HOME + 0.3, { ...READY, crouch: 2, fx: 6, fy: -18, bx: -2, by: -18 }],
    [END, { ...READY, crouch: 2, fx: 6, fy: -18, bx: -2, by: -18 }],
  ],
  hits: [
    { t: ARRIVE, stop: 0.06, flash: 0, push: 0.8, straw: 8, skin: "poison", shiver: 0.6 },
    ...[0.3, 0.6, 0.9].map((d) => ({ t: ARRIVE + d, stop: 0.02, flash: 0, push: 0.3, straw: 4, shiver: 0.5 })),
    { t: END - 0.2, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// the swarm's centre and spread over time
const centre = (t) => {
  if (t < GO) return [14, -34, 12 + 10 * smooth(POUR, CLOUD, t)];
  if (t < ARRIVE) {
    const u = ease.inOutQuad((t - GO) / (ARRIVE - GO));
    return [14 + (TX - 14) * u, -34 + 10 * u - Math.sin(Math.PI * u) * 12, 22 - 4 * u];
  }
  if (t < FEED) return [TX, -26, 16];
  const u = ease.inOutQuad(clamp((t - FEED) / (HOME - FEED)));
  return [TX + (6 - TX) * u, -26 - 6 * u, 16 - 10 * u];
};

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 });
  const bugs = Array.from({ length: N }, (_, i) => ({ d: rand(i, 1) * 0.35, ph: rand(i, 2) * TAU, sp: 2 + rand(i, 3) * 4, r: 0.3 + rand(i, 4) * 0.9, tilt: 0.4 + rand(i, 5) * 0.6, hand: rand(i, 6) > 0.5 }));
  return {
    update(t, dt) {
      if (t > ARRIVE && t < FEED && R.chance(40 * dt)) ps.spawn(P.EMBER, TX + R.range(-10, 10), -R.range(6, 46), R.range(-20, 20), -R.range(20, 50), R.range(0.3, 0.6), CH);
      ps.update(dt);
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "aburame", t0: 0.05, t1: RAISE, label: "KIKAICHUU", head: b.head });
      if (t < POUR || t > END - 0.1) {
        ps.draw(p, "front");
        return;
      }
      const [cx, cy, spread] = centre(t), f = Math.floor(t * 30), back = t > FEED ? smooth(FEED, HOME, t) : 0;
      for (const [i, q] of bugs.entries()) {
        const out = clamp((t - POUR - q.d) / 0.3);
        if (out <= 0) continue;
        if (t > HOME - 0.1 && rand(i, 9) < smooth(HOME - 0.1, END - 0.1, t)) continue;
        // each beetle: on its own wobbling orbit round the centre; out of the sleeve first, onto the target's body when feeding
        const a = q.ph + t * q.sp, nx = noise2(i * 0.3, t * 2, 1) - 0.5, ny = noise2(i * 0.3, t * 2, 2) - 0.5;
        let x = cx + Math.cos(a) * spread * q.r + nx * 10, y = cy + Math.sin(a) * spread * q.r * q.tilt + ny * 10;
        if (t > ARRIVE && t < FEED + 0.1) {
          // feeding: clinging over the target's body
          x = TX + (rand(i, 11) - 0.5) * 22 + nx * 3;
          y = -4 - rand(i, 12) * 46 + ny * 3;
        }
        const h = q.hand ? b.handN : b.handF;
        if (out < 1) (x = h[0] + (x - h[0]) * out), (y = h[1] + (y - h[1]) * out);
        p.px(x, y, BUG[i % 3]);
        if ((f + i) & 1) p.px(x, y - 1, WING);
      }
      ps.draw(p, "front");
    },
  };
});

// Ryuusa Bakuryuu into Sabaku Taisou (Quicksand Waterfall Flow into Desert Imperial Funeral, Gaara). Narutopedia:
// Quicksand Waterfall Flow: Gaara grinds the earth below into sand and lets it surge out as a huge tidal wave of sand
// that buries everything; Desert Imperial Funeral: a far larger version of the Sand Burial (Sabaku Sousou) that brings
// a crushing mass of sand down from above onto everything under it. Here: his gourd's cork pops and sand trickles out;
// he crouches with both palms on the ground; the ground in front of him churns, then surges up into a great wave of
// sand that rolls forward and breaks over the target, burying it to the chest; Gaara rises, raises a hand high,
// and a vast slab of compressed sand gathers in the sky over the target, its edges streaming; he closes his fist and it
// falls: the slab slams down with a pressure ring and a cloud of sand, and settles into a dune.
// New: the wave (a rolling front with a curling lip and spray), the slab (a block of sand with streaming edges), the
// dune left behind.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const CORK = 0.25, PALMS = 0.55, CHURN = 0.75, WAVE = 1.0, BREAK = 1.6, RISE = 2.0, GATHER = 2.2, FIST = 3.0, SLAM = 3.25, END = 5.0, TX = 170;
const SAND = ["#4a3418", "#7a5a2a", "#a8844a", "#d0ac6a", "#f0d8a0"].map(hex);

export const meta = {
  name: "Desert imperial funeral",
  desc: "Gaara: palms on the ground, the earth churns and a great wave of sand rolls forward and buries the target; then a vast slab of compressed sand gathers over it, he closes his fist, and it slams down into a dune.",
  tags: ["jutsu", "gaara", "sand", "aoe", "bind", "crush", "one-shot"],
  size: [300, 220],
  origin: [56, 188],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#4a3418", "#7a5a2a", "#a8844a", "#d0ac6a", "#f0d8a0"], seed: 154 },
};

const KNEEL = { ...READY, crouch: 15, lean: 18, fx: 12, fy: -1, bx: 6, by: -1, ffx: 10, fbx: -10 };
const RAISE = { ...READY, crouch: 3, lean: -4, fx: 10, fy: -46, bx: -4, by: -20, ffx: 8, fbx: -8 };
const CLOSE = { ...RAISE, crouch: 7, lean: 6, fx: 16, fy: -34 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CORK, { ...READY, crouch: 4, armsFront: true, fx: 8, fy: -24, bx: 8, by: -24 }, "out"],
    [PALMS, KNEEL, "in"],
    [RISE, KNEEL],
    [GATHER, RAISE, "out"],
    [FIST - 0.05, { ...RAISE, fy: -48 }],
    [FIST, CLOSE, "snap"],
    [END - 0.5, CLOSE],
    [END, READY],
  ],
  hits: [
    { t: PALMS, stop: 0.05, shake: 0.3, amp: 1, target: false, sfx: "step" },
    { t: WAVE, shake: 1.2, amp: 2, target: false, sfx: "rumble" },
    { t: BREAK, stop: 0.1, shake: 0.6, amp: 3, push: 2, straw: 20, flash: 0, skin: "char", sfx: "heavy" },
    { t: FIST, stop: 0.08, target: false, sfx: "clash" },
    { t: SLAM, stop: 0.25, shake: 1.2, amp: 7, push: 0, straw: 50, flash: 0.08, sfx: "explosion" },
    { t: SLAM + 1.0, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: SLAM, x: TX - 40, n: 24, dir: -1 }, { t: SLAM, x: TX + 40, n: 24, dir: 1 }],
};
// buried in the wave to the chest, then under the slab and the dune
export const targetState = (t) => (t > BREAK && t < SLAM + 1.2 ? { a: t > SLAM ? 0 : 1, tint: [SAND[2], 0.3 * smooth(BREAK, BREAK + 0.3, t)] } : null);

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  // the wave's front: x of the crest over time, and its height
  const front = (t) => 14 + (TX + 34 - 14) * ease.inOutQuad(clamp((t - WAVE) / (BREAK + 0.25 - WAVE)));
  const waveH = (t) => 44 * smooth(WAVE, WAVE + 0.3, t) * (1 - 0.6 * smooth(BREAK, BREAK + 0.5, t));
  // the slab: above the target, gathering, then falling
  const slabY = (t) => (t < FIST ? -150 : -150 + 140 * ease.inCubic(clamp((t - FIST) / (SLAM - FIST))));
  return {
    update(t, dt) {
      if (t > CORK && t < PALMS && R.chance(30 * dt)) ps.spawn(P.DUST, -6, -24, R.range(-10, 10), R.range(10, 40), R.range(0.3, 0.6), SAND[3]);
      if (t > WAVE && t < BREAK + 0.3 && R.chance(70 * dt)) { const x = front(t); ps.spawn(P.GRIT, x, -waveH(t), R.range(20, 100), -R.range(20, 100), R.range(0.3, 0.7), SAND[R.int(2, 4)]); }
      if (t > GATHER && t < FIST && R.chance(60 * dt)) ps.spawn(P.DUST, TX + R.range(-80, 80), -R.range(0, 60), 0, -R.range(80, 160), R.range(0.4, 0.8), SAND[R.int(2, 3)]);
      if (t >= SLAM && !this.s) { this.s = 1; lights.add(TX, -10, 130, SAND[4], 0.5, 0.4); for (let i = 0; i < 60; i++) ps.spawn(P.DUST, TX + R.range(-60, 60), -R.range(0, 10), R.range(-160, 160), -R.range(10, 90), R.range(0.6, 1.4), SAND[R.int(1, 4)], 1.5); }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      // the churning ground before the wave
      if (t > CHURN && t < WAVE + 0.2) p.shade(10, -4, 60, 1, (x, y, out) => { if (y < -2 - 2 * noise2(x * 0.2, t * 6, 2)) return; out.a = smooth(CHURN, WAVE, t) * (1 - smooth(WAVE, WAVE + 0.2, t)); return noise2(x * 0.4 + t * 9, y, 2) > 0 ? SAND[2] : SAND[1]; });
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "gaara", t0: 0.04, t1: CORK, label: "SABAKU TAISOU", head: b.head });
      drawGlint(p, t, "gaara", CORK, END - 0.3, b.head);
      // the wave: the sand body behind the front, rising to a curling lip at the crest, then collapsing into a bank that
      // stays over the target's lower body
      if (t > WAVE) {
        const fx = front(t), H = waveH(t), k = 1 - smooth(SLAM - 0.1, SLAM + 0.2, t);
        p.shade(10, -H - 30, fx + 50, 1, (x, y, out) => {
          const v = (x - 10) / Math.max(1, fx - 10);
          const bank = (xx) => 17.6 * smooth(BREAK, BREAK + 0.5, t) * Math.exp(-Math.pow((xx - TX) / 30, 2)), L = 12 + 30 * smooth(BREAK, BREAK + 0.5, t);
          const h = v <= 1 ? H * (0.25 + 0.75 * Math.pow(v, 2.2)) + bank(x) : (H + bank(fx)) * Math.max(0, 1 - (x - fx) / L);
          const n = noise2(x * 0.1 - t * 4, y * 0.12, 3);
          if (-y > h + 3 * n) return;
          out.a = k;
          const tex = noise2(x * 0.35 + t * 3, y * 0.35, 2);
          if (-y > h - 2) return SAND[4];
          return tex > 0.3 ? SAND[3] : tex > -0.3 ? SAND[2] : SAND[1];
        });
        // the curling lip at the crest
        if (t < BREAK + 0.15) { const cx = front(t) + 4, cy = -waveH(t); p.arc(cx, cy + 6, 7, 3, -2.4, 0.4, SAND[3], k); p.arc(cx, cy + 6, 7, 1, -2.4, 0.4, SAND[4], k); }
      }
      // the slab: a block of compressed sand gathering in the sky, edges streaming, then falling onto the target
      if (t > GATHER && t < SLAM + 0.05) {
        const g = ease.outCubic(smooth(GATHER, FIST - 0.2, t)), W = 66 * g, H = 36 * g, y = slabY(t);
        p.shade(TX - W - 8, y - H / 2 - 8, TX + W + 8, y + H / 2 + 14, (x, yy, out) => {
          const dx = Math.abs(x - TX) / W, dy = (yy - y) / (H / 2), n = noise2(x * 0.08, yy * 0.08 + t * 3, 3);
          if (dx > 1 + 0.08 * n || Math.abs(dy) > 1 + 0.15 * n) return;
          const tex = noise2(x * 0.3, yy * 0.3, 2);
          return dy < -0.75 ? SAND[4] : dy > 0.7 ? SAND[1] : tex > 0.25 ? SAND[3] : SAND[2];
        });
        // streams of sand falling off its underside as it gathers
        if (t < FIST) for (let i = 0; i < 10; i++) { const x = TX - W + (i + 0.5) * (2 * W / 10), L = 8 + rand(i, 1) * 20; for (let j = 0; j < L; j += 2) p.px(x + Math.sin(j + t * 4) * 0.5, y + H / 2 + j + ((t * 60) % 2), SAND[2]); }
        if (t > FIST) p.ellipse(TX, -1, W * (0.5 + 0.5 * smooth(FIST, SLAM, t)), 3, hex("#0a0808"), 0.4);
      }
      // the slam: a pressure ring along the floor, and the dune left over the target
      if (t > SLAM) {
        const v = clamp((t - SLAM) / 0.4);
        p.ellipse(TX, 0, 30 + 120 * v, 4 + 6 * v, (d) => (d > 0.85 ? SAND[4] : 0), 1 - v);
        const dh = 26 * (1 - 0.3 * smooth(SLAM, SLAM + 0.5, t)) * (1 - smooth(END - 0.5, END, t));
        p.shade(TX - 80, -dh - 2, TX + 80, 1, (x, y, out) => { const h = dh * Math.exp(-Math.pow((x - TX) / 46, 2)); if (-y > h) return; return -y > h - 2 ? SAND[4] : noise2(x * 0.3, y * 0.3, 2) > 0 ? SAND[3] : SAND[2]; });
      }
      void WHITE;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

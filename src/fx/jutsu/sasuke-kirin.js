// Kirin (Sasuke). Narutopedia: Sasuke doesn't make this lightning, he takes it: natural lightning drawn from storm
// clouds (made beforehand with fire), shaped by chakra into a beast and guided down onto the target in a thousandth of a
// second; it uses the clouds up, so it can only be done once. Here (after the reference: the hand raised into a sky
// full of light, the dragon of lightning coiled in the clouds with one eye showing, then the white-out, then the dome
// of lightning on the ground): the Sharingan, a hand raised; thunderheads boil in, churning and lit from inside; the
// dragon is glimpsed coiling through them, then its head pushes down out of the cloud and roars; the hand comes down
// and the whole dragon dives, head first, body pouring after it, onto the target: the world goes white, two impact
// frames, a dome of crackling lightning, the ground cracks and glows, rock flies, arcs linger, and the sky clears.
// New: the storm (noise-shaded cloud deck lit from within), the dragon (a body that follows its path, head with jaws,
// horns and whiskers), the dome. From _lib: bolt, veil, impactFrame, drawChunk.
import { Lights, Particles, P, Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, bolt, drawChidori, veil, impactFrame, drawChunk } from "./_lib.js";
import { drawBadge, drawGlint } from "./_badge.js";

const RAISE = 0.35, CLOUD = 0.5, COIL = CLOUD + 0.7, EMERGE = COIL + 0.9, ROAR = EMERGE + 0.35, DROP = ROAR + 0.35, FALL = 0.16, HIT = DROP + FALL, CLEAR = HIT + 1.2, END = CLEAR + 1.2, TX = 170;
const LT = ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#9adaff", "#e8f8ff"];
const CL = ["#08080f", "#11111e", "#1c1b2e", "#2c2a44", "#46446a", "#8a96c8"].map(hex);
const DECK = -150; // the underside of the clouds

export const meta = {
  name: "Kirin",
  desc: "Sasuke: a hand raised into a sky that boils with thunderheads; a dragon of lightning coils through them, pushes its head out and roars, then dives onto the target: white-out, impact frames, a dome of lightning, cracked glowing ground.",
  tags: ["jutsu", "sasuke", "lightning", "raiton", "sharingan", "aoe", "one-shot"],
  size: [340, 274],
  origin: [70, 238],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: LT, seed: 31 },
};

const UP = { ...READY, crouch: 2, lean: -4, fx: 5, fy: -47, bx: 8, by: -22, ffx: 8, fbx: -8 };
const DOWN = { ...READY, crouch: 7, lean: 8, fx: 20, fy: -16, bx: -6, by: -22, ffx: 10, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [RAISE, UP, "out"],
    [DROP - 0.05, { ...UP, crouch: 3, fy: -49 }],
    [DROP + 0.05, DOWN, "snap"],
    [CLEAR, { ...DOWN, crouch: 4, lean: 3 }],
    [END, READY],
  ],
  hits: [
    { t: ROAR, stop: 0.05, shake: 0.25, amp: 2, target: false },
    { t: HIT, stop: 0.28, shake: 0.9, amp: 7, push: 6, straw: 56, skin: "char", sfx: "thunder" },
    { t: HIT + 0.3, stop: 0.03, flash: 0, push: 1, straw: 10, shiver: 0.8, skin: "shock" },
    { t: END - 0.5, flash: 0, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: DROP, x: 4, n: 6 }, { t: HIT + 0.05, x: TX - 30, n: 18, dir: -1 }, { t: HIT + 0.05, x: TX + 30, n: 18, dir: 1 }],
};

// ---- the dragon's path: coiled along inside the cloud, down out of it at the right, then an S down onto the target
const CTRL = [[-60, -200], [10, -192], [80, -204], [150, -186], [205, -168], [196, -140], [140, -118], [110, -88], [150, -56], [TX, -18]];
const PTS = (() => {
  const out = [];
  for (let i = 0; i < CTRL.length - 1; i++) {
    const p0 = CTRL[Math.max(0, i - 1)], p1 = CTRL[i], p2 = CTRL[i + 1], p3 = CTRL[Math.min(CTRL.length - 1, i + 2)];
    for (let k = 0; k < 12; k++) {
      const u = k / 12, u2 = u * u, u3 = u2 * u;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(CTRL[CTRL.length - 1]);
  let L = 0;
  return out.map((p, i) => {
    if (i) L += Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]);
    return [p[0], p[1], L];
  });
})();
const LEN = PTS[PTS.length - 1][2], BODY = 230;
const at = (s) => {
  s = clamp(s, 0, LEN);
  let i = 1;
  while (i < PTS.length - 1 && PTS[i][2] < s) i++;
  const a = PTS[i - 1], b = PTS[i], u = (s - a[2]) / (b[2] - a[2] || 1);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])];
};
// where the head is along the path: drifting through the cloud, nosing out, then the dive
const S_OUT = PTS[CTRL.length > 5 ? 5 * 12 : 0][2];
const headS = (t) => {
  if (t < COIL) return 0;
  if (t < EMERGE) return (S_OUT - 30) * ease.inOutSine((t - COIL) / (EMERGE - COIL));
  if (t < DROP) return S_OUT - 30 + 30 * ease.outCubic((t - EMERGE) / (ROAR - EMERGE + 0.001)) * (t < ROAR ? 1 : 1) + (t > ROAR ? 6 * Math.sin((t - ROAR) * 30) * 0 : 0);
  return S_OUT + (LEN - S_OUT) * ease.inQuad(clamp((t - DROP) / FALL));
};
// the cloud deck's underside at x (lumpy, churning)
const deckY = (x, t) => DECK + 10 * noise2(x * 0.03, t * 0.4, 21) + 6 * noise2(x * 0.08, t * 0.7, 22);

export const create = play([], (o) => {
  const C = fit(o.palette, 5).map((c) => (typeof c === "number" ? c : hex(c))), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let hit = false;
  return {
    update(t, dt) {
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(TX, -30, 220, C[3], 1, 0.8);
        for (let i = 0; i < 40; i++) ps.spawn(P.GRIT, TX + R.range(-20, 20), -1, R.range(-200, 200), -R.range(100, 320), R.range(0.6, 1.3), hex(["#3a3048", "#5a4c66"][i % 2]), R.chance(0.4) ? 2 : 1);
        for (let i = 0; i < 30; i++) {
          const a = R.range(-Math.PI, 0), s = R.range(120, 360);
          ps.spawn(P.STREAK, TX, -20, Math.cos(a) * s, Math.sin(a) * s, R.range(0.12, 0.3), R.chance(0.5) ? WHITE : C[3]);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      const gather = smooth(CLOUD, COIL + 0.3, t), clear = smooth(HIT + 0.3, CLEAR + 0.5, t), f = Math.floor(t * 24);
      if (gather <= 0 || clear >= 1) return ps.draw(p, "back");
      veil(p, -70, -238, 270, 0, CL[0], 0.45 * gather * (1 - clear));
      // where the lightning inside is flaring right now (it lights the cloud from within)
      const flash = t < HIT && rand(f, 77) > 0.7 ? [rand(f, 78) * 300 - 50, -195 + rand(f, 79) * 30] : null;
      const hs = headS(t), inside = t > COIL && t < DROP;
      p.shade(-70, -238, 270, -110, (x, y, out) => {
        const base = deckY(x, t), grow = gather * (1 - clear);
        // thick at the top, the underside a lumpy ragged edge that comes down as it gathers and lifts as it clears
        const edge = -238 + (base + 238) * grow + 14 * clear * noise2(x * 0.05, 3, 4);
        const dens = fbm(x * 0.022 + t * 0.12, y * 0.03 - t * 0.05);
        if (y > edge + 10 * (dens - 0.5)) return;
        const depth = clamp((edge - y) / 70);
        out.a = Math.min(1, grow * 1.5) * (depth < 0.08 ? 0.6 : 1);
        // lit from inside: the flare, and the dragon's own glow showing through where it coils
        let lit = 0;
        if (flash) lit = Math.max(lit, 1 - Math.hypot(x - flash[0], (y - flash[1]) * 1.6) / 90);
        if (inside)
          for (let s = Math.max(0, hs - BODY); s <= hs; s += 10) {
            const [dx, dy] = at(s);
            lit = Math.max(lit, 0.7 * (1 - Math.hypot(x - dx, y - dy) / 30));
          }
        const v = dens * 0.9 + (1 - depth) * 0.35 + lit * 1.2;
        out.k = lit > 0.3 ? lit * 0.4 : 0;
        out.l = C[3];
        return v > 1.25 ? CL[5] : v > 0.95 ? CL[4] : v > 0.72 ? CL[3] : v > 0.5 ? CL[2] : CL[1];
      });
      // lightning crawling along the underside
      if (gather > 0.6 && t < HIT && rand(f, 5) > 0.5) {
        const x0 = -30 + rand(f, 6) * 260;
        bolt(p, x0, deckY(x0, t) - 6, x0 + (rand(f, 8) - 0.5) * 70, deckY(x0, t) + 4 + rand(f, 9) * 14, f, C, { jag: 0.3, glow: 0.4 });
      }
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 30);
      drawBadge(p, t, { kind: "sharingan", t0: 0.05, t1: RAISE + 0.25, label: "SHARINGAN", head: b.head });
      drawGlint(p, t, "sharingan", RAISE + 0.3, END - 0.5, b.head);
      // the raised hand calls the storm: sparks running up off it, a thread of lightning up into the cloud
      if (t > RAISE && t < DROP + 0.05) {
        drawChidori(p, b.handN[0], b.handN[1], t, C, 0.5 * smooth(RAISE, RAISE + 0.3, t), 3);
        if (t > ROAR && rand(f, 3) > 0.3) bolt(p, b.handN[0], b.handN[1] - 3, b.handN[0] + 20, deckY(20, t), f, C, { jag: 0.25, glow: 0.3 });
      }
      // the dragon
      if (t > COIL && t < HIT + 0.35) {
        const hs = headS(t), fade = 1 - smooth(HIT + 0.05, HIT + 0.35, t), seen = (x, y) => (y < deckY(x, t) - 4 && t < DROP ? 0.28 : 1);
        if (fade > 0.02) {
          // the body: a thick glowing coil, tapering to the tail, lightning crackling along its sides
          const tail = Math.max(0, hs - BODY), step = 5;
          for (let s = tail; s < hs - 6; s += step) {
            const [x0, y0] = at(s), [x1, y1, a] = at(s + step), u = (s - tail) / Math.max(1, hs - tail), w = 2 + 8 * Math.pow(u, 0.7), k = seen(x0, y0) * fade;
            p.glowLine(x0, y0, x1, y1, w * 2.4, C[2], 0.25 * k);
            p.beam(x0, y0, x1, y1, w + 2, C[2], k);
            p.beam(x0, y0, x1, y1, w, C[3], k);
            p.beam(x0, y0, x1, y1, Math.max(1, w * 0.4), WHITE, k);
            // the scales: notches of light along the back; the fins: little bolts off it
            const nx = -Math.sin(a), ny = Math.cos(a);
            if (Math.floor(s / step) % 3 === 0 && k > 0.5) bolt(p, x0 - nx * w * 0.6, y0 - ny * w * 0.6, x0 - nx * (w + 6 + rand(f, s) * 6), y0 - ny * (w + 6) - 3, f + s, C, { jag: 0.5, glow: 0 });
          }
          // the head: big, at the tip, along the path: jaws (wide open on the roar and the dive), horns, whiskers, eye
          const [hx, hy, a] = at(hs), c = Math.cos(a), sn = Math.sin(a), K = 2.1, k = seen(hx, hy) * fade;
          const T = (u, v) => [hx + (c * u - sn * v) * K, hy + (sn * u + c * v) * K];
          const open = t > EMERGE + 0.1 ? 0.5 + 0.5 * smooth(EMERGE + 0.1, ROAR, t) : 0.2;
          const jaw = (pts, col) => p.poly(pts, col, k);
          p.glow(hx, hy, 50, C[3], 0.7 * k);
          // horns swept back
          jaw([T(-6, -5), T(-22, -14), T(-26, -16), T(-10, -3)], C[3]);
          jaw([T(-4, -3), T(-18, -18), T(-20, -21), T(-8, -2)], WHITE);
          // the upper jaw and snout
          jaw([T(-10, -7), T(6, -7), T(16, -5 - open * 3), T(18, -2 - open * 4), T(4, -1 - open), T(-10, 1)], C[3]);
          jaw([T(-8, -6), T(6, -6), T(14, -4 - open * 3), T(4, -3 - open), T(-8, -2)], WHITE);
          // the lower jaw
          jaw([T(-8, 2), T(4, 2 + open * 2), T(16, 4 + open * 7), T(14, 6 + open * 7), T(-6, 6)], C[3]);
          jaw([T(-6, 3), T(4, 3 + open * 2), T(13, 4.5 + open * 6.5), T(-4, 4.5)], C[4]);
          // teeth, the eye, the whiskers trailing back as bolts
          if (open > 0.3) for (let i = 0; i < 4; i++) p.px(...T(6 + i * 2.6, -2 - open * (1.5 + i * 0.5)), WHITE);
          p.circle(...T(-3, -4), 2.2, C[1], k);
          p.circle(...T(-3, -4), 1.2, WHITE, k);
          for (const v of [-1, 5]) {
            const [x0, y0] = T(12, v), [x1, y1] = T(-24, v * 3 + (v > 0 ? 10 : -8));
            bolt(p, x0, y0, x1 + Math.sin(t * 20) * 4, y1, f + v, C, { jag: 0.3, glow: 0 });
          }
          // the roar: rings of sound rippling off the open jaws
          if (t > ROAR - 0.1 && t < DROP) for (let i = 0; i < 3; i++) {
            const age = ((t - ROAR + 0.1) * 2 + i / 3) % 1;
            p.ring(...T(18, 2), 6 + age * 30, 1, C[4], (1 - age) * 0.8);
          }
        }
      }
      // the strike: the world goes white, two impact frames, then the dome of lightning and the cracked glowing ground
      const age = t - HIT;
      if (age >= 0 && age < 0.06) veil(p, -70, -238, 270, 36, WHITE, 1, 0);
      else if (age >= 0.06 && age < 0.11) impactFrame(p, -70, -238, 270, 36, TX, -20, true, 21, { style: "bolts", ink: hex("#04101e"), paper: hex("#e0f6ff"), lines: 34 });
      else if (age >= 0.11 && age < 0.16) impactFrame(p, -70, -238, 270, 36, TX, -20, false, 22, { style: "bolts", ink: hex("#04101e"), paper: hex("#e0f6ff"), lines: 34 });
      if (age >= 0.06 && age < 1.4) {
        const R0 = 62 * ease.outCubic(clamp((age - 0.06) / 0.25)), fade = 1 - smooth(0.6, 1.4, age);
        p.glow(TX, -R0 * 0.4, R0 * 2, C[3], 0.7 * fade);
        p.shade(TX - R0, -R0, TX + R0, 0, (x, y, out) => {
          const d = Math.hypot(x - TX, y) / R0;
          if (d > 1) return;
          out.a = fade * (0.35 + 0.6 * d * d);
          if (d > 0.93) {
            out.k = 0.5;
            return WHITE;
          }
          return d > 0.75 ? C[3] : C[2];
        });
        // bolts crackling across the dome
        for (let i = 0; i < 7; i++) {
          const a0 = -Math.PI * rand(i, f), a1 = a0 + (rand(i + 9, f) - 0.5) * 1.6;
          bolt(p, TX + Math.cos(a0) * R0 * 0.95, Math.sin(a0) * R0 * 0.95, TX + Math.cos(a1) * R0 * 0.9, Math.sin(a1) * R0 * 0.9, f + i, C, { jag: 0.3, glow: 0 });
        }
        // the ring racing out along the ground
        p.ellipse(TX, 0, 30 + age * 260, 4 + age * 20, (d) => (d > 0.85 ? C[4] : 0), Math.max(0, 1 - age * 2));
      }
      // the crater: cracks glowing out from where it struck, rock thrown up
      if (age > 0) {
        const k = 1 - smooth(0.6, 2.2, age);
        p.ellipse(TX, 0.5, 34, 3.5, hex("#120c18"), 0.9 * k);
        for (let i = 0; i < 8; i++) {
          const dir = i % 2 ? 1 : -1, L = 18 + rand(i, 4) * 40;
          let x = TX, y = 0;
          for (let s = 0; s < 4; s++) {
            const nx = x + dir * L / 4, ny = (rand(i, s) - 0.5) * 3;
            p.line(x, y, nx, ny, C[3], k);
            (x = nx), (y = ny);
          }
        }
        for (let i = 0; i < 12; i++) {
          const a = -Math.PI * (0.15 + 0.7 * rand(i, 31)), v = 120 + 180 * rand(i, 32), x = TX + Math.cos(a) * v * age, y = Math.sin(a) * v * age + 160 * age * age;
          if (y < 0 && age < 1.6) drawChunk(p, x, y, 2 + 2 * rand(i, 33), age * 8, ["#1e1a26", "#3a3448", "#5a5068", "#8a80a0"].map(hex));
        }
        // arcs lingering over the crater
        if (age > 0.3 && age < 1.8 && rand(f, 44) > 0.5) bolt(p, TX - 20 + rand(f, 45) * 40, -2, TX - 20 + rand(f, 46) * 40, -8 - rand(f, 47) * 20, f, C, { jag: 0.4, glow: 0.2 });
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

function fbm(x, y) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) {
    v += a * (noise2(x * f, y * f, 30 + i) * 0.5 + 0.5);
    f *= 2.1;
    a *= 0.5;
  }
  return v;
}

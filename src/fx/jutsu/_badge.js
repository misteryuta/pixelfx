// The badge every signature jutsu shows: a small medallion that pops up over the user's head with what powers the move
// (the eye for a dojutsu: Itachi's, Sasuke's, Obito's, Kakashi's or Madara's Mangekyou, the Rinnegan, the Byakugan, the
// sage's toad eyes, Kurama's slit; for everyone else their mark: the Uzumaki spiral, the Akatsuki cloud, Sakura's
// Byakugou diamond, Kiba's fang tattoos, Haku's hunter mask...). It pops with an overshoot, its pattern turns once, then it
// shrinks into the user's eyes and leaves them glowing in its color for the rest of the move.
import { hex, mix, clamp, ease, smooth, WHITE, TAU } from "../../core/index.js";

const H = (s) => hex(s);
const INK = H("#120c18"), BLACK = H("#0c0608");
const RED = [H("#5c0710"), H("#a10d18"), H("#d4161f"), H("#ff4a43")];
const SKIN = H("#f1c7a3"), SKIND = H("#d39c7c");
const wrap = (a) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

// ---- the eyes: (u, v) in the iris, -1..1, r = distance, a = angle; return a color
function redIris(u, v, r) {
  if (r > 0.9) return RED[0];
  if (u < -0.15 && v < -0.15 && r > 0.42 && r < 0.72) return RED[3];
  return r > 0.7 ? RED[1] : RED[2];
}
// the three-tomoe Sharingan
function sharingan(u, v, r, a, rot) {
  if (r < 0.2) return BLACK;
  for (let k = 0; k < 3; k++) {
    const ang = rot + (k * TAU) / 3, hx = 0.56 * Math.cos(ang), hy = 0.56 * Math.sin(ang);
    if (Math.hypot(u - hx, v - hy) < 0.21) return BLACK;
    const d = wrap(a - ang);
    if (d > 0 && d < 0.62 && Math.abs(r - 0.56 - 0.12 * (d / 0.62)) < 0.13 * (1 - d / 0.62)) return BLACK;
  }
  if (Math.abs(r - 0.56) < 0.05) return RED[0];
  return redIris(u, v, r);
}
// Itachi (after the reference): a red pupil in a black ring, three broad black blades curving out from it to the rim,
// a darker band of red round the outside
function itachi(u, v, r, a, rot) {
  if (r < 0.1) return RED[2];
  if (r < 0.2) return BLACK;
  if (r > 0.93) return BLACK;
  const th = a - 1.7 * (r - 0.2) - rot;
  for (let k = 0; k < 3; k++) {
    const d = wrap(th - (k * TAU) / 3);
    // each blade: wide near the centre, sweeping back into a thin hook at the rim
    if (d > -0.1 && d < 0.95 * (1 - (r - 0.2) / 0.78) + 0.08) return BLACK;
  }
  return r > 0.78 ? RED[0] : redIris(u, v, r);
}
// Kakashi's and Obito's (after the reference): a red pupil in a black ring, three straight black arms out to the black
// rim, and from each arm a black sickle curving round the middle of the iris, thinning to a point
function obito(u, v, r, a, rot) {
  if (r < 0.11) return RED[2];
  if (r < 0.23 || r > 0.9) return BLACK;
  for (let k = 0; k < 3; k++) {
    const arm = -Math.PI / 2 + (k * TAU) / 3 + rot, d = wrap(a - arm);
    if (Math.abs(d) * r < 0.1) return BLACK;
    if (d > 0 && d < 1.8 && Math.abs(r - 0.56) < 0.13 * (1 - d / 1.8) + 0.015) return BLACK;
  }
  return r > 0.8 ? RED[0] : redIris(u, v, r);
}
// Sasuke's Mangekyou: a black ring with three curved points thrown outward
// Sasuke's eternal Mangekyou (after the reference): a black iris with a red six-pointed star of curved points, his own
// three-bladed shape in black over it, a thin red ring through the middle and a red pupil
function sasuke(u, v, r, a, rot, eternal) {
  if (!eternal) {
    if (r < 0.1) return BLACK;
    if (r > 0.28 && r < 0.43) return BLACK;
    if (r >= 0.43 && r < 0.95) {
      const th = a - 1.1 * (r - 0.43) - rot;
      for (let k = 0; k < 3; k++) if (Math.abs(wrap(th - (k * TAU) / 3)) < 0.5 * ((0.95 - r) / 0.52)) return BLACK;
    }
    return redIris(u, v, r);
  }
  if (r < 0.08) return RED[2];
  if (r < 0.18) return BLACK;
  // his three blades: thin curved spokes from the centre ring, black over the star
  for (let k = 0; k < 3; k++) {
    const d = wrap(a - rot - Math.PI / 2 - (k * TAU) / 3 - 0.9 * (r - 0.18));
    if (r < 0.58 && Math.abs(d) < 0.26 * (1 - (r - 0.18) / 0.4) + 0.02) return BLACK;
  }
  if (Math.abs(r - 0.5) < 0.03) return RED[2];
  // the star: six points, edges bowed inward
  const sector = Math.PI / 3, d6 = Math.abs(wrap(a - rot - Math.PI / 2 + sector / 2) % sector);
  const off = Math.min(d6, sector - d6) / (sector / 2), rs = 0.3 + 0.58 * Math.pow(1 - off, 2.4);
  if (r < rs && r < 0.88) return r > rs - 0.07 ? RED[1] : RED[2];
  return BLACK;
}
// Madara's eternal Mangekyou: three rounded black petals, a red ring of Izuna's pattern through them
function madara(u, v, r, a, rot) {
  if (r < 0.1) return BLACK;
  if (Math.abs(r - 0.36) < 0.035) return RED[3];
  if (r > 0.93) return BLACK;
  if (r < 0.84) for (let k = 0; k < 3; k++) if (Math.abs(wrap(a - rot - (k * TAU) / 3)) < 0.62 * Math.sin(Math.PI * Math.min(1, r / 0.84)) + 0.05) return BLACK;
  return redIris(u, v, r);
}
function rinnegan(u, v, r) {
  if (r < 0.08) return H("#2a2048");
  if (r > 0.18 && ((r - 0.18) * 3.4) % 1 < 0.22) return H("#3c2f63");
  return u < -0.2 && v < -0.2 && r < 0.7 ? H("#d9cbf5") : r > 0.88 ? H("#7c66b4") : H("#b9a3e3");
}
function byakugan(u, v, r) {
  if (Math.abs(r - 0.62) < 0.05) return H("#c3bdd8");
  return r < 0.62 ? (u < -0.15 && v < -0.2 ? WHITE : H("#e7e2f3")) : H("#f6f4fb");
}
function sage(u, v, r) {
  if (Math.abs(v) < 0.14 && Math.abs(u) < 0.5) return BLACK;
  return r > 0.86 ? H("#b0741a") : u < -0.2 && v < -0.25 ? H("#fff1a0") : H("#f2cb3e");
}
function kurama(u, v, r) {
  if (Math.abs(u) < 0.13 * (1 - (v / 0.85) ** 2) && Math.abs(v) < 0.85) return BLACK;
  return r > 0.86 ? H("#b23a08") : r < 0.45 ? H("#ffd36a") : H("#ff8f1c");
}
function gate(u, v, r, a) {
  if (r > 0.92) return H("#c9b8a6");
  if (r > 0.35 && Math.abs(wrap(a * 5 + r * 4)) < 0.12) return H("#d23a3a");
  return H("#f6f0e8");
}
function snake(u, v, r) {
  if (Math.abs(u) < 0.09 * (1 - (v / 0.9) ** 2) + 0.01 && Math.abs(v) < 0.9) return BLACK;
  return r > 0.86 ? H("#8a6a12") : u < -0.2 && v < -0.2 ? H("#fff08a") : H("#e3c232");
}
function gaara(u, v, r) {
  if (r < 0.09) return BLACK;
  return r > 0.88 ? H("#3d6f67") : u < -0.2 && v < -0.2 ? H("#d5f5ec") : H("#9ad7c7");
}

// eye kinds: [iris function, medallion bg, rim color, glint color left in the user's eyes]
const EYES = {
  sharingan: [sharingan, SKIN, H("#c8141e"), H("#ff2a2a")],
  kakashi: [sharingan, SKIN, H("#c8141e"), H("#ff2a2a")],
  itachi: [itachi, SKIN, H("#c8141e"), H("#ff2a2a")],
  obito: [obito, SKIN, H("#c8141e"), H("#ff2a2a")],
  kamui: [obito, SKIN, H("#c8141e"), H("#ff2a2a")],
  sasukeMS: [(u, v, r, a, rot) => sasuke(u, v, r, a, rot, false), SKIN, H("#c8141e"), H("#ff2a2a")],
  sasukeEMS: [(u, v, r, a, rot) => sasuke(u, v, r, a, rot, true), SKIN, H("#c8141e"), H("#ff2a2a")],
  madara: [madara, SKIN, H("#c8141e"), H("#ff2a2a")],
  rinnegan: [rinnegan, SKIN, H("#9a7fd6"), H("#c9b3ff")],
  byakugan: [byakugan, SKIN, H("#cfc6ea"), H("#ffffff")],
  sage: [sage, SKIN, H("#e2662b"), H("#ffd040")],
  kurama: [kurama, H("#ffb030"), H("#ff7a10"), H("#ffb020")],
  gate: [gate, SKIN, H("#3fbf5a"), H("#ffffff")],
  snake: [snake, H("#6a3c8c"), H("#8a52b0"), H("#ffe040")],
  gaara: [gaara, SKIN, H("#3d6f67"), H("#9ad7c7")],
};

// ---- the marks: drawn with shapes inside the medallion (cx, cy, radius R), t for anything that moves
const MARKS = {
  uzumaki: { bg: H("#ff8a1c"), rim: H("#c3202a"), draw(p, x, y, R) {
    p.shade(x - R, y - R, x + R, y + R, (u, v) => {
      const dx = (u - x) / R, dy = (v - y) / R, r = Math.hypot(dx, dy);
      if (r > 0.8) return;
      if (r < 0.14) return H("#c3202a");
      return ((Math.atan2(dy, dx) / TAU + r * 1.55) % 1 + 1) % 1 < 0.38 ? H("#c3202a") : 0;
    });
  } },
  akatsuki: { bg: H("#141018"), rim: H("#c8202a"), draw(p, x, y, R) {
    const k = R / 10, puffs = [[-3.2, 1, 2.6], [0, -1.2, 3.4], [3.4, 0.6, 2.8], [1, 2.2, 2.6], [-1.6, 2.3, 2.4]];
    for (const [a, b, r] of puffs) p.circle(x + a * k, y + b * k, (r + 1) * k, WHITE);
    for (const [a, b, r] of puffs) p.circle(x + a * k, y + b * k, r * k, H("#c8202a"));
    p.px(x - 1 * k, y - 1.5 * k, H("#ff5a5a"));
  } },
  byakugou: { bg: SKIN, rim: H("#8a3fb8"), draw(p, x, y, R) {
    const k = R / 10;
    p.poly([[x, y - 5 * k], [x + 4 * k, y], [x, y + 5 * k], [x - 4 * k, y]], H("#5c2384"));
    p.poly([[x, y - 3.6 * k], [x + 2.6 * k, y], [x, y + 3.6 * k], [x - 2.6 * k, y]], H("#9b4fd0"));
    p.px(x - 1, y - 1, H("#d9a5ff"));
  } },
  hiraishin: { bg: H("#f5c742"), rim: H("#1d2a4a"), draw(p, x, y, R) {
    const k = R / 10, S = H("#e8edf6"), D = H("#68748f"), G = H("#2a2230");
    // the three-pronged kunai, point up, with the formula tag wound round the grip
    p.poly([[x, y - 7 * k], [x + 1.6 * k, y - 1 * k], [x - 1.6 * k, y - 1 * k]], S);
    p.poly([[x - 1.2 * k, y - 2 * k], [x - 5 * k, y - 4.5 * k], [x - 2 * k, y + 0.2 * k]], D);
    p.poly([[x + 1.2 * k, y - 2 * k], [x + 5 * k, y - 4.5 * k], [x + 2 * k, y + 0.2 * k]], D);
    p.rect(x - 0.8 * k, y, 1.8 * k, 5 * k, G);
    p.ring(x, y + 6.2 * k, 1.3 * k, 1, S);
    p.line(x + 0.5, y + 0.5 * k, x + 3.5 * k, y + 3.5 * k, H("#fff3c8"));
  } },
  summon: { bg: H("#e9dcb8"), rim: H("#7a4a20"), draw(p, x, y, R, t) {
    const k = R / 10;
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8 + t * 0.6;
      p.line(x + Math.cos(a) * 3 * k, y + Math.sin(a) * 3 * k, x + Math.cos(a) * 8 * k, y + Math.sin(a) * 8 * k, INK);
    }
    p.ring(x, y, 3 * k, 1, INK);
    p.circle(x, y, 1.2 * k, INK);
  } },
  youth: { bg: SKIN, rim: H("#2f9a44"), draw(p, x, y, R) {
    const k = R / 10;
    p.rect(x - 9 * k, y - 9 * k, 18 * k, 5 * k, BLACK); // the bowl cut
    p.rect(x - 6 * k, y - 2.5 * k, 12 * k, 2.4 * k, BLACK); // the eyebrows
    p.circle(x - 3 * k, y + 2.5 * k, 2.2 * k, WHITE);
    p.circle(x + 3 * k, y + 2.5 * k, 2.2 * k, WHITE);
    p.circle(x - 3 * k, y + 2.5 * k, 1 * k, BLACK);
    p.circle(x + 3 * k, y + 2.5 * k, 1 * k, BLACK);
  } },
  nara: { bg: H("#c9c2b0"), rim: H("#3a3448"), draw(p, x, y, R, t) {
    const k = R / 10;
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 + 0.3, l = (6 + 2 * Math.sin(t * 6 + i)) * k;
      p.beam(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, 1.6 * k, H("#1a1622"));
    }
    p.circle(x, y, 3.4 * k, H("#1a1622"));
  } },
  yamanaka: { bg: H("#3a2e5c"), rim: H("#e88cc8"), draw(p, x, y, R) {
    const k = R / 10;
    for (let i = 0; i < 5; i++) {
      const a = (i * TAU) / 5 - Math.PI / 2;
      p.circle(x + Math.cos(a) * 3.6 * k, y + Math.sin(a) * 3.6 * k, 2.8 * k, H("#b45fa0"));
      p.circle(x + Math.cos(a) * 3.6 * k, y + Math.sin(a) * 3.6 * k, 2 * k, H("#e88cc8"));
    }
    p.circle(x, y, 1.8 * k, H("#ffd84a"));
  } },
  akimichi: { bg: H("#2a1a2e"), rim: H("#ff8a3a"), draw(p, x, y, R, t) {
    const k = R / 10, f = 0.75 + 0.25 * Math.abs(Math.sin(t * 9));
    for (const s of [-1, 1]) {
      p.ellipse(x + s * 3.6 * k * f, y - 1.6 * k, 3.4 * k * f, 3.2 * k, H("#ff6a2a"));
      p.ellipse(x + s * 2.6 * k * f, y + 2.8 * k, 2.2 * k * f, 2 * k, H("#ffb040"));
      p.px(x + s * 3.6 * k * f, y - 2 * k, H("#fff0a0"));
    }
    p.rect(x - 0.6 * k, y - 4 * k, 1.4 * k, 8 * k, H("#3a1408"));
  } },
  inuzuka: { bg: SKIN, rim: H("#7a4a2a"), draw(p, x, y, R) {
    const k = R / 10;
    p.circle(x - 4 * k, y - 3.5 * k, 1.1 * k, BLACK);
    p.circle(x + 4 * k, y - 3.5 * k, 1.1 * k, BLACK);
    for (const s of [-1, 1]) p.tri(x + s * 2.6 * k, y - 1.5 * k, x + s * 6.4 * k, y - 1.5 * k, x + s * 4.5 * k, y + 5 * k, H("#c3202a"));
  } },
  aburame: { bg: H("#1e2a22"), rim: H("#6f8a3a"), draw(p, x, y, R, t) {
    const k = R / 10;
    for (let i = -1; i <= 1; i++) for (const s of [-1, 1]) p.line(x + s * 2 * k, y + i * 2.2 * k, x + s * (5.5 + Math.sin(t * 20 + i) * 0.6) * k, y + i * 3 * k + 1, H("#0a0e0a"));
    p.ellipse(x, y + 0.8 * k, 3.2 * k, 4.4 * k, H("#2d3a1c"));
    p.line(x, y - 3 * k, x, y + 5 * k, H("#0a0e0a"));
    p.circle(x, y - 4.4 * k, 1.8 * k, H("#3d4a28"));
    p.px(x - 1.5 * k, y - 1.5 * k, H("#9ab860"));
  } },
  kimimaro: { bg: H("#efe3dc"), rim: H("#6a5a78"), draw(p, x, y, R) {
    const k = R / 10;
    p.circle(x - 2.4 * k, y - 4.2 * k, 1.2 * k, H("#c8202a"));
    p.circle(x + 2.4 * k, y - 4.2 * k, 1.2 * k, H("#c8202a"));
    // the earth curse mark spreading up from below
    for (let i = 0; i < 9; i++) p.circle(x + ((i * 37) % 13 - 6) * k * 0.9, y + 1 * k + ((i * 23) % 7) * k, 0.9 * k, H("#1a1420"));
  } },
  haku: { bg: H("#22314a"), rim: H("#9fd8ff"), draw(p, x, y, R) {
    const k = R / 10;
    p.ellipse(x, y, 6.2 * k, 8 * k, WHITE);
    p.line(x - 4 * k, y - 0.5 * k, x - 1.5 * k, y - 0.5 * k, BLACK);
    p.line(x + 1.5 * k, y - 0.5 * k, x + 4 * k, y - 0.5 * k, BLACK);
    p.arc(x - 3.5 * k, y + 3.5 * k, 1.6 * k, 1, 0, Math.PI * 1.5, H("#c8202a"));
    p.arc(x + 3.5 * k, y + 3.5 * k, 1.6 * k, 1, Math.PI, Math.PI * 2.5, H("#c8202a"));
    // the Mist village's mark on the brow
    for (let i = 0; i < 4; i++) p.px(x - 3 * k + i * 2 * k, y - 5.5 * k + (i % 2), H("#5a6a8a"));
  } },
  scroll: { bg: H("#3a2a3e"), rim: H("#e05a7a"), draw(p, x, y, R) {
    const k = R / 10;
    p.rect(x - 6 * k, y - 3 * k, 12 * k, 6 * k, H("#f1e3c0"));
    p.rect(x - 7.5 * k, y - 4 * k, 2.5 * k, 8 * k, H("#b03050"));
    p.rect(x + 5 * k, y - 4 * k, 2.5 * k, 8 * k, H("#b03050"));
    p.line(x - 4 * k, y, x + 4 * k, y, H("#3a2a20"));
    p.line(x - 3 * k, y - 1.5 * k, x + 2 * k, y - 1.5 * k, H("#3a2a20"));
  } },
  temari: { bg: H("#5a3a2a"), rim: H("#e8c890"), draw(p, x, y, R) {
    const k = R / 10;
    p.shade(x - R, y - R, x + R, y + R, (u, v) => {
      const dx = (u - x) / k, dy = (v - y - 5 * k) / k, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (r > 9 || a > -0.15 || a < -Math.PI + 0.15) return;
      return Math.floor((a + Math.PI) * 4) % 2 ? H("#e8dcc0") : H("#cfbf98");
    });
    // the three moons
    for (const [a, b] of [[-4, -1], [0, -4.5], [4, -1]]) {
      p.circle(x + a * k, y + b * k, 1.6 * k, H("#6a2a8a"));
    }
  } },
  konan: { bg: H("#1c2236"), rim: H("#9fb8ff"), draw(p, x, y, R, t) {
    const k = R / 10;
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 + t * 0.4;
      p.tri(x, y, x + Math.cos(a - 0.4) * 7 * k, y + Math.sin(a - 0.4) * 7 * k, x + Math.cos(a + 0.4) * 7 * k, y + Math.sin(a + 0.4) * 7 * k, i % 2 ? H("#dfe6ff") : H("#9fb8ff"));
    }
    p.circle(x, y, 2 * k, WHITE);
  } },
  kisame: { bg: H("#4a7aa8"), rim: H("#1e3a5c"), draw(p, x, y, R) {
    const k = R / 10;
    for (let i = 0; i < 3; i++) p.line(x - 6 * k + i * 1.6 * k, y - 4 * k, x - 6.5 * k + i * 1.6 * k, y - 0.5 * k, H("#1e3a5c"));
    p.rect(x - 2 * k, y + 1 * k, 9 * k, 3.6 * k, H("#3a0a14"));
    for (let i = 0; i < 4; i++) {
      p.tri(x - 1.6 * k + i * 2.2 * k, y + 1 * k, x + 0.6 * k + i * 2.2 * k, y + 1 * k, x - 0.5 * k + i * 2.2 * k, y + 2.8 * k, WHITE);
      p.tri(x - 0.5 * k + i * 2.2 * k, y + 4.6 * k, x + 1.7 * k + i * 2.2 * k, y + 4.6 * k, x + 0.6 * k + i * 2.2 * k, y + 2.8 * k, WHITE);
    }
    p.circle(x + 2 * k, y - 4 * k, 1.4 * k, WHITE);
    p.px(x + 2 * k, y - 4 * k, BLACK);
  } },
  deidara: { bg: SKIN, rim: H("#e0c040"), draw(p, x, y, R, t) {
    const k = R / 10, o = 0.6 + 0.4 * Math.abs(Math.sin(t * 7));
    p.ellipse(x, y + 1 * k, 5.5 * k, 3.6 * k * o + 0.5, H("#5a1420"));
    p.ellipse(x + 0.5 * k, y + 2.2 * k, 3 * k, 1.4 * k * o, H("#e86a8a"));
    p.line(x - 5.5 * k, y + 1 * k, x + 5.5 * k, y + 1 * k, H("#3a0a10"));
    for (let i = -2; i <= 2; i++) p.px(x + i * 2 * k, y + 1 * k - 3.6 * k * o + 1, WHITE);
    // the palm's lines
    p.line(x - 6 * k, y - 4 * k, x + 4 * k, y - 6 * k, SKIND);
  } },
  wood: { bg: H("#5a3820"), rim: H("#8fbf4a"), draw(p, x, y, R) {
    const k = R / 10;
    p.circle(x, y, 7.2 * k, H("#c89a5a"));
    for (const r of [5.4, 3.6, 1.8]) p.ring(x + 0.4 * k, y - 0.3 * k, r * k, 1, H("#8a5a32"));
    p.px(x, y, H("#5a3820"));
  } },
  // the villages: Iwa's mountain peaks, Kiri's four strokes of mist, Kumo's cloud, Suna's hourglass
  iwa: { bg: H("#b9a585"), rim: H("#5a4630"), draw(p, x, y, R) {
    const k = R / 10, D = H("#3a2c1c");
    p.poly([[x - 7 * k, y + 4 * k], [x - 2.5 * k, y - 5 * k], [x + 1.5 * k, y + 4 * k]], D);
    p.poly([[x - 1 * k, y + 4 * k], [x + 3 * k, y - 2.5 * k], [x + 7 * k, y + 4 * k]], D);
    p.rect(x - 7 * k, y + 4 * k, 14 * k, 1.4 * k, D);
  } },
  kiri: { bg: H("#9fc3d8"), rim: H("#2a4a66"), draw(p, x, y, R) {
    const k = R / 10, D = H("#1a3248");
    for (const dy of [-4.5, -1.5, 1.5, 4.5]) p.beam(x - 6 * k, y + dy * k, x + 6 * k, y + (dy - 1) * k, 1.4 * k, D);
  } },
  kumo: { bg: H("#e8eef8"), rim: H("#3a5a9a"), draw(p, x, y, R) {
    const k = R / 10, D = H("#2a3a6a");
    for (const [a, b, r] of [[-3.5, 1.5, 3], [0, -1, 3.8], [3.6, 1.2, 3], [0.2, 2.6, 3]]) p.ring(x + a * k, y + b * k, r * k, 1, D);
    p.rect(x - 6 * k, y + 4.6 * k, 12 * k, 1, D);
  } },
  suna: { bg: H("#e6c88a"), rim: H("#8a5a2a"), draw(p, x, y, R) {
    const k = R / 10, D = H("#5a3a1a");
    p.poly([[x - 5 * k, y - 6 * k], [x + 5 * k, y - 6 * k], [x + 0.8 * k, y], [x + 5 * k, y + 6 * k], [x - 5 * k, y + 6 * k], [x - 0.8 * k, y]], D);
    p.poly([[x - 3 * k, y + 4.8 * k], [x + 3 * k, y + 4.8 * k], [x, y + 1.5 * k]], H("#f0d8a0"));
  } },
  // Sai's ink: a brush stroke and a drop
  ink: { bg: H("#f2eee4"), rim: H("#1a1a22"), draw(p, x, y, R) {
    const k = R / 10, D = H("#14141c");
    for (let i = 0; i <= 10; i++) { const u = i / 10; p.circle(x - 6 * k + u * 11 * k, y + 3 * k - Math.sin(u * 3) * 5 * k, (2.2 - 1.6 * u) * k, D); }
    p.circle(x + 3 * k, y + 5 * k, 1.4 * k, D);
  } },
  // Kurenai's genjutsu: a red eye in a petal of thorns
  genjutsu: { bg: H("#2a0e18"), rim: H("#d02a4a"), draw(p, x, y, R, t) {
    const k = R / 10;
    for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6 + t * 0.4; p.tri(x + Math.cos(a) * 3 * k, y + Math.sin(a) * 3 * k, x + Math.cos(a + 0.4) * 8 * k, y + Math.sin(a + 0.4) * 8 * k, x + Math.cos(a - 0.2) * 6 * k, y + Math.sin(a - 0.2) * 6 * k, H("#7a1a2a")); }
    p.ellipse(x, y, 4 * k, 2.6 * k, H("#ff3a5a"));
    p.ellipse(x, y, 1.2 * k, 2.2 * k, BLACK);
  } },
  // Asuma's trench knives with wind chakra on the blades
  hien: { bg: H("#cfe8dc"), rim: H("#2a6a4a"), draw(p, x, y, R) {
    const k = R / 10, S = H("#5a6a78");
    for (const s of [-1, 1]) {
      p.beam(x + s * 1.5 * k, y + 4 * k, x + s * 5 * k, y - 6 * k, 1.6 * k, S);
      p.beam(x + s * 2.6 * k, y + 4 * k, x + s * 6.4 * k, y - 5 * k, 0.8 * k, H("#a8f0d0"));
    }
    p.ring(x, y + 4 * k, 2.4 * k, 1, H("#2a2a30"));
  } },
};

export const BADGE_KINDS = [...Object.keys(EYES), ...Object.keys(MARKS)];

/** The color a badge leaves glowing in the user's eyes (null for marks that aren't eyes). */
export const glintOf = (kind) => (EYES[kind] ? EYES[kind][3] : null);

/**
 * Draw the medallion itself, fully open, at (x, y) with radius R. kind: an eye or a mark. rot turns its pattern.
 */
export function medallion(p, kind, x, y, R, { rot = 0, t = 0, flash = 0, a = 1 } = {}) {
  const eye = EYES[kind], mark = MARKS[kind];
  const bg = eye ? eye[1] : mark.bg, rim = eye ? eye[2] : mark.rim;
  // the drop shadow, the ink outline, the colored rim, the face
  p.circle(x + 1, y + 1, R + 1, INK, 0.6 * a);
  p.circle(x, y, R + 1, INK, a);
  p.circle(x, y, R, rim, a);
  p.circle(x, y, R - 1.4, bg, a);
  if (eye) {
    // an almond of white round the iris for the eye kinds that show their lids; the rest fill the face with the iris
    const IR = R - 2.6, fn = eye[0];
    p.shade(x - IR, y - IR, x + IR, y + IR, (u, v, out) => {
      const du = (u - x) / IR, dv = (v - y) / IR, r = Math.hypot(du, dv);
      if (r > 1) return;
      out.a = a;
      return fn(du, dv, r, Math.atan2(dv, du), rot);
    });
    if (kind === "kakashi" || kind === "kamui") p.line(x - 1, y - R + 1.5, x + 1, y + R - 1.5, H("#b05a5a"), a); // Kakashi's scar
    if (kind === "byakugan")
      for (let i = 0; i < 8; i++) {
        const an = (i * TAU) / 8 + 0.2;
        p.line(x + Math.cos(an) * (IR + 0.5), y + Math.sin(an) * (IR + 0.5), x + Math.cos(an + 0.25) * (R - 1.5), y + Math.sin(an + 0.25) * (R - 1.5), H("#b97a8e"), a);
      }
    if (kind === "sage") p.ring(x, y, IR + 0.8, 1.2, H("#e2662b"), a);
    if (kind === "gaara") p.ring(x, y, IR + 0.8, 1.4, H("#1a1416"), a);
    // the wet catch-light every eye gets
    p.px(x - IR * 0.45, y - IR * 0.5, WHITE);
  } else mark.draw(p, x, y, R - 1.4, t);
  if (flash > 0) p.circle(x, y, R + 1, WHITE, flash);
}

/**
 * The badge over a move: pops in at t0 over the head (hx, hy is the head), holds, and at t1 shrinks into the eyes.
 * label: a word set beside it (MANGEKYOU, RINNEGAN, 6TH GATE...). Returns how open it is (0..1).
 */
export function drawBadge(p, t, { kind, t0, t1, label = "", head = [0, -34], R = EYES[kind] ? 13 : 11, dx = -2, dy = -26, spin = 1 }) {
  const a = t - t0;
  if (a < 0 || t > t1 + 0.2) return 0;
  const pop = ease.outBack(clamp(a / 0.16), 3), leave = smooth(t1, t1 + 0.2, t);
  const [hx, hy] = head, cx = hx + dx * (1 - leave), cy = hy + dy * (1 - leave) + 1.5 * (1 - leave);
  const r = Math.max(1, R * pop * (1 - leave * 0.85));
  const rim = EYES[kind] ? EYES[kind][2] : MARKS[kind].rim;
  // the burst it pops out of: a ring and four rays, gone in a few frames
  if (a < 0.25) {
    const k = a / 0.25;
    p.ring(cx, cy, R + 2 + 8 * k, 1, rim, 1 - k);
    for (let i = 0; i < 4; i++) {
      const an = (i * TAU) / 4 + Math.PI / 4;
      p.line(cx + Math.cos(an) * (R + 3 + 6 * k), cy + Math.sin(an) * (R + 3 + 6 * k), cx + Math.cos(an) * (R + 6 + 9 * k), cy + Math.sin(an) * (R + 6 + 9 * k), WHITE, 1 - k);
    }
  }
  const rot = -spin * TAU * 0.5 * ease.outCubic(clamp(a / 0.7)) + t * 0.3 * spin;
  medallion(p, kind, cx, cy, r, { rot, t, flash: a < 0.05 ? 0.8 : 0 });
  if (leave > 0) p.glow(cx, cy, 10, rim, 0.6 * leave);
  else p.glow(cx, cy, R * 2, rim, 0.25);
  if (label && leave < 0.5) {
    const k = clamp((a - 0.08) / 0.12) * (1 - leave * 2);
    if (k > 0) p.text(label, cx + R + 3, cy - 3, a < 0.14 ? WHITE : mix(rim, WHITE, 0.45), { font: "mini", outline: INK, a: k });
  }
  return pop * (1 - leave);
}

/** The user's eyes glowing in the badge's color from when the badge lands until `until`. head: [x, y] of the head. */
export function drawGlint(p, t, kind, from, until, head) {
  const c = glintOf(kind);
  if (!c || t < from || t > until) return;
  const k = 1 - smooth(until - 0.25, until, t), [hx, hy] = head, flick = t - from < 0.1;
  p.px(hx + 2, hy - 0.5, flick ? WHITE : c);
  p.glow(hx + 2, hy - 0.5, flick ? 9 : 5, c, (flick ? 0.9 : 0.5) * k);
}

/** An eye kind's iris: fn(u, v, r, a, rot) -> colour, with (u, v) in the iris (-1..1); null for marks. */
export const irisOf = (kind) => (EYES[kind] ? EYES[kind][0] : null);

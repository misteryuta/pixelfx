// Jutsu clashes (helper, not an effect): two shinobi cast at the same moment and their techniques meet in the middle.
// Narutopedia's nature cycle decides it: fire beats wind, wind beats lightning, lightning beats earth, earth beats water,
// water beats fire. Both hold their casting pose the whole time; the streams meet, churn into each other (each side's
// colours mixed in a boiling knot at the contact, sparks, rings of force; fire and water raise steam), the contact
// shoves back and forth, then the stronger one swallows the other and drives on into its caster: impact frames, a
// blast in the winner's colours, the loser thrown back.
// buildClash({ left, right, winner, ... }) returns { meta, act, create } for an effect file. The left caster is the act's
// own character; the right one is the rival from _taijutsu.js.
import { Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU, mix } from "../../core/index.js";
import { play, bodyAt, sealRun, drawSeals, bolt, blast, impactFrame, drawChunk, MOUTH } from "./_lib.js";
import { rival, drawRival, FLY, LAND, RECOIL, shots } from "./_taijutsu.js";

const RAMPS = {
  fire: ["#1a0804", "#5a1406", "#b0300a", "#ff6a10", "#ffb030", "#ffe880", "#fffbe0"],
  water: ["#04122a", "#0a2a5a", "#1450a0", "#2a80d8", "#6ac0ff", "#c8ecff", "#ffffff"],
  wind: ["#0a2420", "#1a4a40", "#3a8070", "#7ac8b0", "#b8f0dc", "#e8fff4", "#ffffff"],
  lightning: ["#0a1a3a", "#1a4a9a", "#3a8ae8", "#6ab8ff", "#9adaff", "#e8f8ff", "#ffffff"],
  earth: ["#1e1610", "#3a2c1e", "#5a4430", "#7e6248", "#a88a68", "#d0b890", "#f0e0c0"],
};
for (const k in RAMPS) RAMPS[k] = RAMPS[k].map(hex);
const BX = 214, SEAL0 = 0.05, CAST = 0.62, MEET = CAST + 0.26, BREAK = MEET + 1.45, HIT = BREAK + 0.32, END = HIT + 1.9;

const POSE = {
  mouth: { ...READY, crouch: 4, lean: 4, fx: 8, fy: -30, bx: 10, by: -29, ffx: 9, fbx: -9 },
  hands: { ...READY, crouch: 6, lean: 7, fx: 20, fy: -26, bx: 21, by: -25, ffx: 11, fbx: -10 },
  ground: { ...READY, crouch: 14, lean: 18, fx: 14, fy: -2, bx: 9, by: -1, ffx: 6, fbx: -10 },
};
const SRC = { mouth: [MOUTH[0] + 3, MOUTH[1]], hands: [24, -25], ground: [16, 0] };

export function buildClash({ name, desc, left, right, winner = "left", seed = 90, tags = [] }) {
  const L = { ...left, C: RAMPS[left.kind], pose: POSE[left.from], src: SRC[left.from] }, Rr = { ...right, C: RAMPS[right.kind], pose: POSE[right.from], src: SRC[right.from] };
  const W = winner === "left" ? L : Rr, lose = winner === "left" ? Rr : L;
  const seals = sealRun(SEAL0, left.seals ?? ["mi", "hitsuji", "tora"], 0.15, { hold: CAST - SEAL0 - 0.3, kind: left.aura ?? null });
  const meta = {
    name,
    desc,
    tags: ["jutsu", "clash", left.kind, right.kind, ...tags, "one-shot"],
    size: [320, 170],
    origin: [52, 136],
    duration: END,
    loop: false,
    fps: 30,
    bg: "ground",
    actor: 2,
    options: { palette: left.palette ?? ["#1a0804", "#5a1406", "#b0300a", "#ff6a10", "#ffe880"], seed },
  };
  // the struggle: the contact's place between them (0 at the left caster's source .. 1 at the right one's)
  const contactAt = (t) => {
    if (t < MEET) return 0.5;
    if (t < BREAK) {
      const u = (t - MEET) / (BREAK - MEET), dir = winner === "left" ? 1 : -1;
      return 0.5 + 0.09 * Math.sin(u * 13) * (1 - u * 0.3) - dir * 0.07 * Math.sin(u * Math.PI) + 0.06 * noise2(t * 3, 1, seed) + dir * 0.05 * u * u;
    }
    const v = ease.inCubic(clamp((t - BREAK) / (HIT - BREAK))), x0 = contactAt(BREAK - 1e-3);
    return winner === "left" ? x0 + (1 - x0) * v : x0 * (1 - v);
  };
  const pulses = [0, 0.3, 0.62, 0.9, 1.2].map((d) => MEET + d);
  const flyL = winner === "right", flyR = winner === "left";
  const act = {
    poses: [
      [-0.25, READY],
      ...seals.keys,
      [CAST, { ...L.pose }, "snap"],
      ...pulses.map((p, i) => [p + 0.05, { ...L.pose, lean: L.pose.lean + (i % 2 ? 2 : -3), x: i % 2 ? 0 : -2 }]),
      [BREAK, { ...L.pose, lean: L.pose.lean + (flyL ? -4 : 6), x: flyL ? -4 : 2 }],
      ...(flyL
        ? [[HIT, { ...FLY, x: -8, y: -6 }, "snap"], [HIT + 0.3, { ...FLY, x: -26, y: -14 }], [HIT + 0.6, { ...LAND, x: -36, y: 0 }, "in"], [END - 0.3, { ...READY, x: -36 }]]
        : [[HIT + 0.4, { ...L.pose, lean: 4 }], [END - 0.3, READY]]),
      [END, flyL ? { ...READY, x: -36 } : READY],
    ],
    hits: [
      { t: CAST, target: false, sfx: "cast" },
      { t: MEET, stop: 0.16, shake: 0.4, amp: 3, target: false, sfx: "clash" },
      ...pulses.slice(1).map((t) => ({ t, stop: 0.03, shake: 0.2, amp: 2, target: false, sfx: "rumble" })),
      { t: BREAK, stop: 0.1, shake: 0.3, amp: 3, target: false, sfx: "whoosh" },
      { t: HIT, stop: 0.22, shake: 0.7, amp: 5, target: false, sfx: "explosion" },
    ],
    dust: [{ t: MEET, x: BX / 2, n: 14 }, ...(flyL ? [{ t: HIT + 0.6, x: -36, n: 10, dir: -1 }] : [])],
  };
  const R = rival([
    [-0.25, READY],
    ...(right.seals ?? ["tora", "mi", "inu"]).map((n, i) => [SEAL0 + 0.04 + i * 0.15, { ...seals.keys[0][1], ...sealPose(n) }, i ? "snap" : "out"]),
    [CAST, { ...Rr.pose }, "snap"],
    ...pulses.map((p, i) => [p + 0.05, { ...Rr.pose, lean: Rr.pose.lean + (i % 2 ? -3 : 2), x: i % 2 ? -2 : 0 }]),
    [BREAK, { ...Rr.pose, lean: Rr.pose.lean + (flyR ? -4 : 6) }],
    ...(flyR
      ? [[HIT, { ...FLY, x: -8, y: -6 }, "snap"], [HIT + 0.3, { ...FLY, x: -28, y: -16 }], [HIT + 0.6, { ...LAND, x: -38, y: 0 }, "in"], [END - 0.3, { ...READY, x: -38 }]]
      : [[HIT + 0.4, { ...Rr.pose, lean: 4 }], [END - 0.3, READY]]),
  ], BX);
  // where each side's technique leaves from, and where the contact is
  const srcL = (t) => {
    const b = bodyAt(act.poses, Math.min(t, BREAK));
    return L.from === "ground" ? [b.q.x + 16, 0] : L.from === "mouth" ? [b.head[0] + 5, b.head[1] + 3] : [b.handN[0] + 3, b.handN[1]];
  };
  const srcR = (t) => {
    const s = R(Math.min(t, BREAK));
    return Rr.from === "ground" ? [s.x - 16, 0] : [s.x - Rr.src[0], s.y + Rr.src[1]];
  };
  const contact = (t) => {
    const a = srcL(t), b = srcR(t), u = contactAt(t);
    const y = L.from === "ground" && Rr.from === "ground" ? -6 : a[1] + (b[1] - a[1]) * u - (L.from === "ground" || Rr.from === "ground" ? 8 : 0);
    return [a[0] + (b[0] - a[0]) * u, y];
  };

  const create = play([], (o) => {
    const Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0 });
    let broke = false, hit = false;
    return {
      update(t, dt) {
        // the knot of the contact throws sparks of both colours, and steam where fire meets water
        if (t > MEET && t < HIT) {
          const [cx, cy] = contact(t);
          for (let n = 0; n < 3; n++) if (Rg.chance(70 * dt)) {
            const a = Rg.range(0, TAU), s = Rg.range(60, 180), side = Rg.chance(0.5) ? L : Rr;
            ps.spawn(P.STREAK, cx, cy, Math.cos(a) * s, Math.sin(a) * s - 30, Rg.range(0.1, 0.25), side.C[Rg.int(4, 6)]);
          }
          if ((L.kind === "fire" && Rr.kind === "water") || (L.kind === "water" && Rr.kind === "fire"))
            if (Rg.chance(40 * dt)) ps.spawn(P.SMOKE, cx + Rg.range(-8, 8), cy - 4, Rg.range(-30, 30), -Rg.range(30, 70), Rg.range(0.8, 1.4), hex("#e8eef4"), Rg.range(5, 9));
        }
        if (!broke && t >= BREAK) {
          broke = true;
          const [cx, cy] = contact(t);
          for (let i = 0; i < 24; i++) {
            const a = Rg.range(0, TAU), s = Rg.range(100, 260);
            ps.spawn(P.STREAK, cx, cy, Math.cos(a) * s, Math.sin(a) * s, Rg.range(0.12, 0.3), lose.C[Rg.int(3, 6)]);
          }
        }
        if (!hit && t >= HIT) hit = true;
        ps.update(dt);
      },
      drawBack(p, t) {
        drawRival(p, R, t);
        blast(p, t - HIT, { x: winner === "left" ? BX - 6 : 6, y: 0, R: 34, C: W.C, seed: seed + 5, layer: "back" });
        ps.draw(p, "back");
      },
      draw(p, t) {
        drawSeals(p, t, seals, L.C.slice(2));
        const b = bodyAt(act.poses, t), s = R(t);
        // the names, over each caster as they cast
        const nk = smooth(CAST - 0.35, CAST - 0.2, t) * (1 - smooth(MEET + 0.4, MEET + 0.7, t));
        if (nk > 0) {
          p.text(left.label, b.head[0] + 6, b.head[1] - 22, L.C[5], { font: "mini", align: "center", outline: hex("#0a0810"), a: nk });
          p.text(right.label, s.x - 6, -62, Rr.C[5], { font: "mini", align: "center", outline: hex("#0a0810"), a: nk });
        }
        blast(p, t - HIT, { x: winner === "left" ? BX - 6 : 6, y: 0, R: 34, C: W.C, seed: seed + 5 });
        if (t < CAST || t > HIT + 0.35) return ps.draw(p, "front");
        const a = srcL(t), bsrc = srcR(t), c = contact(t), fadeOut = 1 - smooth(HIT, HIT + 0.35, t);
        // how far each stream has got: out from its caster to the meeting point, then held at the contact
        const reach = clamp((t - CAST) / (MEET - CAST));
        const endL = t < MEET ? [a[0] + (c[0] - a[0]) * reach, a[1] + (c[1] - a[1]) * reach] : c;
        const endR = t < MEET ? [bsrc[0] + (c[0] - bsrc[0]) * reach, bsrc[1] + (c[1] - bsrc[1]) * reach] : c;
        const growW = t > BREAK ? 1 + 0.6 * smooth(BREAK, HIT, t) : 1;
        const loserGone = t > BREAK ? smooth(BREAK, HIT, t) : 0;
        // the loser's stream thins as it's swallowed; the winner's swells
        stream(p, t, L, a, endL, (winner === "left" ? growW : 1 - 0.6 * loserGone) * fadeOut, seed);
        stream(p, t, Rr, bsrc, endR, (winner === "right" ? growW : 1 - 0.6 * loserGone) * fadeOut, seed + 1);
        if (t > MEET && t < HIT + 0.05) knot(p, t, c, L, Rr, winner, smooth(BREAK, HIT, t));
        // the moment it breaks: a flash of the winner's colour; the hit: impact frames
        if (t >= BREAK && t < BREAK + 0.05) p.circle(c[0], c[1], 22, W.C[6]);
        if (t >= HIT && t < HIT + 0.05) p.circle(...(winner === "left" ? [BX - 6, -26] : [6, -26]), 30, W.C[6]);
        ps.draw(p, "front");
      },
    };
  });
  // the camera: wide on both casters, a cut in close on the meeting point, riding the struggle back and forth (rolling a
  // little with each shove), pulling back as it breaks, a cut to the loser being hit, then out
  const loser = winner === "left" ? [BX - 10, -26] : [10, -26];
  const base = shots([
    [0, { z: 1.0, x: BX / 2, y: -34, r: 0 }],
    [CAST, { z: 1.15, x: BX / 2, y: -32 }],
    [MEET, { z: 2.3, x: BX / 2, y: -28, r: 0 }, "cut"],
    [BREAK - 0.05, { z: 2.0, x: BX / 2, y: -28 }],
    [BREAK, { z: 1.5, x: BX / 2, y: -30 }, "cut"],
    [HIT, { z: 2.4, x: loser[0], y: loser[1], r: winner === "left" ? 3 : -3 }, "cut"],
    [HIT + 0.25, { z: 2.2, x: loser[0], y: loser[1], r: winner === "left" ? 2 : -2 }],
    [HIT + 0.32, { z: 1.2, x: BX / 2, y: -30, r: 0 }, "cut"],
    [END, { z: 1.05, x: BX / 2, y: -32 }],
  ]);
  const camera = (t) => {
    const c = base(t);
    if (t >= MEET && t < BREAK) {
      const [cx, cy] = contact(t);
      return { ...c, x: cx, y: cy, r: 2 * Math.sin((t - MEET) * 9) };
    }
    return c;
  };
  return { meta, act, create, contact, camera };
}

function sealPose(n) {
  const S = {
    tora: { fx: 10, fy: -27, bx: 11, by: -27 }, mi: { fx: 10, fy: -24, bx: 10, by: -23 }, inu: { fx: 9, fy: -21, bx: 12, by: -21 },
    hitsuji: { fx: 9, fy: -25, bx: 11, by: -24 }, u: { fx: 9, fy: -22, bx: 12, by: -25 }, tatsu: { fx: 11, fy: -26, bx: 9, by: -24 }, i: { fx: 10, fy: -23, bx: 11, by: -25 },
  };
  return { crouch: 3, armsFront: true, ffx: 7, fbx: -7, ...(S[n] ?? S.tora) };
}

// ---- the streams, element by element, from a to b; k: how strong (1 normal, more when it wins, less as it loses)
function stream(p, t, side, a, b, k, seed) {
  if (k <= 0.02) return;
  const C = side.C, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  if (side.kind === "fire") {
    p.glowLine(a[0], a[1], b[0], b[1], 26 * k, C[4], 0.5);
    for (let s = 0; s < len; s += 3) {
      const u = s / len, r = (3 + 9 * Math.sqrt(u)) * k * (0.85 + 0.3 * noise2(s * 0.08 - t * 6, 1, seed)), x = a[0] + ux * s + nx * Math.sin(s * 0.1 - t * 14) * 2 * u, y = a[1] + uy * s + ny * Math.sin(s * 0.1 - t * 14) * 2 * u;
      p.disc(x, y - r * 0.2, r, (d) => {
        const v = 1 - d + 0.3 * noise2(x * 0.2 + d * 3, y * 0.2 - t * 8, seed);
        return v > 0.9 ? C[6] : v > 0.65 ? C[5] : v > 0.4 ? C[4] : v > 0.2 ? C[3] : C[2];
      }, 1);
    }
  } else if (side.kind === "water") {
    p.glowLine(a[0], a[1], b[0], b[1], 18 * k, C[4], 0.35);
    for (let s = 0; s < len; s += 1.5) {
      const u = s / len, w = (3 + 7 * Math.sqrt(u)) * k, wob = Math.sin(s * 0.15 - t * 18) * 1.5, x = a[0] + ux * s, y = a[1] + uy * s;
      for (let v = -w; v <= w; v += 1) {
        const e = Math.abs(v + wob) / w;
        if (e > 1) continue;
        const foam = e > 0.8 && noise2(s * 0.3 - t * 10, v, seed) > 0.1;
        p.px(x + nx * (v + wob), y + ny * (v + wob), foam ? C[6] : e > 0.55 ? C[4] : e > 0.2 ? C[3] : C[2]);
      }
    }
    // spray thrown off its surface
    for (let i = 0; i < 10; i++) {
      const u = (rand(i, seed) + t * 2) % 1, s = u * len, off = (6 + 8 * u) * k * (i % 2 ? 1 : -1) * (1 + rand(i, 3));
      p.px(a[0] + ux * s + nx * off, a[1] + uy * s + ny * off - 2, C[5]);
    }
  } else if (side.kind === "wind") {
    // a corkscrew of pale air: several strands winding round the line, crescents racing along it
    for (let st = 0; st < 4; st++)
      for (let s = 0; s < len; s += 1) {
        const u = s / len, r = (3 + 8 * u) * k, ph = s * 0.22 - t * 30 + (st * TAU) / 4, o = Math.sin(ph) * r, near = Math.cos(ph) > 0;
        p.dot(a[0] + ux * s + nx * o, a[1] + uy * s + ny * o, near ? C[5] : C[3], near ? 0.9 : 0.5);
      }
    for (let i = 0; i < 4; i++) {
      const s = ((t * 260 + i * 60) % len), x = a[0] + ux * s, y = a[1] + uy * s, r = (4 + 10 * (s / len)) * k;
      p.arc(x - ux * r * 0.5, y, r, 1.5, -1.1, 1.1, C[6], 0.8);
    }
  } else if (side.kind === "lightning") {
    const f = Math.floor(t * 30);
    p.glowLine(a[0], a[1], b[0], b[1], 20 * k, C[3], 0.6);
    p.beam(a[0], a[1], b[0], b[1], 3 * k, C[4]);
    p.line(a[0], a[1], b[0], b[1], WHITE);
    for (let i = 0; i < 3; i++) bolt(p, a[0], a[1], b[0], b[1], f + i * 7, C, { jag: 0.12, seed: seed + i, glow: 0 });
  } else if (side.kind === "earth") {
    // rock spears bursting up out of the floor one after another along the line, the newest at the front
    const n = Math.max(1, Math.floor(len / 9));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, x = a[0] + dx * u, h = (10 + 18 * u + 6 * rand(i, seed)) * Math.min(1, k * 1.2), lean = (dx > 0 ? 1 : -1) * (0.3 + 0.2 * rand(i, 2));
      const tip = [x + lean * h, -h], w = 3 + 4 * u;
      p.poly([[x - w, 1], [x + w, 1], tip], C[2]);
      p.poly([[x - w, 1], [x - w * 0.1, 1], tip], C[4]);
      p.line(x - w, 0, tip[0], tip[1], C[1]);
    }
  }
}

// the knot where they meet: both colours boiling into each other, the winner's taking over as it breaks
function knot(p, t, c, L, R, winner, take) {
  const r = 11 + 2 * Math.sin(t * 30) + 6 * take, [cx, cy] = c;
  p.glow(cx, cy, r * 3.5, mix(L.C[4], R.C[4], 0.5), 0.8);
  p.shade(cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3, (x, y, out) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) / r, ang = Math.atan2(dy, dx);
    const lump = 1 + 0.25 * noise2(Math.cos(ang) * 2 + t * 4, Math.sin(ang) * 2 - t * 3, 7);
    if (d > lump) return;
    const n = noise2(dx * 0.25 + t * 6, dy * 0.25 - t * 5, 11) + (winner === "left" ? -1 : 1) * 0.0 + (winner === "left" ? 1 : -1) * take * 1.2;
    const side = n > 0 ? L : R, heat = 1 - d / lump;
    out.k = heat > 0.6 ? 0.4 : 0;
    return heat > 0.75 ? WHITE : side.C[heat > 0.45 ? 5 : heat > 0.2 ? 4 : 3];
  });
  // rings of force pulsing off it
  for (let i = 0; i < 2; i++) {
    const u = (t * 2.2 + i * 0.5) % 1;
    p.ring(cx, cy, r + u * 26, 1, WHITE, 0.7 * (1 - u));
  }
}

// Shared by the jutsu moves (files starting with _ are helpers, not effects): the hand-seal poses every jutsu
// starts with, the mouth and palm the elements leave from, and a cue player like core chain() that can also
// steer a cue's angle over time (a projectile that tilts along its arc) and keep custom drawing in the same frame.
import { createFx, READY, WHITE, TAU, clamp, ease, hex, mix, rand, smooth } from "../../core/index.js";

// Where the stock character's mouth sits, in px from the feet, facing right.
export const MOUTH = [6, -31];

// ---- hand seals (in, 印): the twelve signs of the zodiac. Every sign is its own hand shape, so a run of seals reads
// as the hands really changing: where the two hands meet, how high, which one is on top, how the body sits.
// (Narutopedia: Tiger is the sign of most fire jutsu, Snake of earth and water, Hare of lightning.)
const S = { ...READY, crouch: 3, lean: 1, armsFront: true, ffx: 7, fbx: -7 };
export const SIGNS = {
  ne: { name: "NE", pose: { ...S, fx: 9, fy: -24, bx: 11, by: -22 } }, // rat: one fist wrapped round two fingers
  ushi: { name: "USHI", pose: { ...S, fx: 8, fy: -23, bx: 12, by: -23, crouch: 4 } }, // ox: hands stacked flat, crosswise
  tora: { name: "TORA", pose: { ...S, fx: 10, fy: -27, bx: 11, by: -27 } }, // tiger: fingers up, pressed together
  u: { name: "U", pose: { ...S, fx: 9, fy: -22, bx: 12, by: -25, lean: 2 } }, // hare: one hand over the other's fist
  tatsu: { name: "TATSU", pose: { ...S, fx: 11, fy: -26, bx: 9, by: -24 } }, // dragon: thumbs out, palms together
  mi: { name: "MI", pose: { ...S, fx: 10, fy: -24, bx: 10, by: -23, crouch: 4 } }, // snake: fingers laced
  uma: { name: "UMA", pose: { ...S, fx: 10, fy: -21, bx: 11, by: -22, lean: 2 } }, // horse: fingers pointing down
  hitsuji: { name: "HITSUJI", pose: { ...S, fx: 9, fy: -25, bx: 11, by: -24 } }, // ram: half tiger
  saru: { name: "SARU", pose: { ...S, fx: 8, fy: -26, bx: 12, by: -25 } }, // monkey
  tori: { name: "TORI", pose: { ...S, fx: 11, fy: -25, bx: 8, by: -26, crouch: 4 } }, // bird
  inu: { name: "INU", pose: { ...S, fx: 9, fy: -21, bx: 12, by: -21, crouch: 4 } }, // dog: one flat hand on the other fist
  i: { name: "I", pose: { ...S, fx: 10, fy: -23, bx: 11, by: -25, crouch: 5, lean: 3 } }, // boar
  // the seal of confrontation (Tairitsu no In): one hand, two fingers raised before the face; Shunshin, Kirigakure
  tairitsu: { name: "TAIRITSU", pose: { ...READY, crouch: 3, fx: 9, fy: -30, bx: -4, by: -20, ffx: 7, fbx: -7 } },
};
// where the hands meet for a sign, for the chakra flash
const handsOf = (pose) => [(pose.fx + pose.bx) / 2, (pose.fy + pose.by) / 2];

/**
 * A run of seals: pose keys snapped on one after another every dt from t0, the last one held until `hold`.
 * at: overrides for where the last (held) sign sits, e.g. Tiger raised to the mouth for fire.
 * Returns { keys, list: [{ t, sign, x, y }], end } for drawSeals().
 */
export function sealRun(t0, names, dt, { hold = 0, last = {}, kind = null } = {}) {
  const keys = [], list = [];
  names.forEach((n, i) => {
    const sign = SIGNS[n], fin = i === names.length - 1, pose = fin ? { ...sign.pose, ...last } : sign.pose, t = t0 + i * dt;
    keys.push([t, pose, i ? "snap" : "out"]);
    list.push({ t, sign, xy: handsOf(pose), fin });
  });
  const end = t0 + (names.length - 1) * dt + Math.max(dt, hold);
  return { keys, list, end, dt, kind };
}

/**
 * Draw what a seal run looks like: on each new sign a pulse of chakra flashes between the hands in the element's
 * color, and the sign's name pops up over the head (the last one held and glowing). C: the element ramp, dark to bright.
 */
export function drawSeals(p, t, run, C) {
  const n = C.length, OUT = hex("#120c18");
  aura(p, t, run, C);
  for (const s of run.list) {
    const a = t - s.t, life = s.fin ? run.end - s.t + 0.15 : run.dt;
    if (a < 0 || a > life) continue;
    const [hx, hy] = s.xy;
    // the flash between the hands: hot for two frames, then a ring that opens and fades
    const k = 1 - clamp(a / Math.min(life, 0.3));
    if (a < 0.07) {
      p.circle(hx, hy, 2.2, C[n - 2]);
      p.px(hx, hy, WHITE);
    }
    if (k > 0) {
      p.ring(hx, hy, 2 + 6 * (1 - k), 1, C[n - 3], k);
      p.glow(hx, hy, 12, C[n - 3], 0.5 * k);
    }
    if (s.fin && a > 0.07) p.glow(hx, hy, 9, C[n - 2], 0.35 + 0.15 * Math.sin(t * 30));
    // the sign's name: pops up with a little overshoot, white for a frame, then in the element's light color
    const up = ease.outBack(clamp(a / 0.08), 2.5), fade = s.fin ? 1 - clamp((a - life + 0.15) / 0.15) : 1 - clamp((a - life * 0.75) / (life * 0.25));
    if (fade <= 0) continue;
    const y = -44 - 3 * up;
    p.text(s.sign.name, 6, y, a < 0.04 ? WHITE : C[n - 2], { font: "mini", align: "center", outline: OUT, a: fade });
  }
  // the count of signs so far: little dots under the name
  const done = run.list.filter((s) => t >= s.t).length;
  if (!done || t >= run.end + 0.15) return;
  if (run.list.length > 12) p.text(`${done}/${run.list.length}`, 6, -39, C[n - 3], { font: "mini", align: "center", outline: OUT });
  else run.list.forEach((s, i) => p.px(6 - (run.list.length - 1) + i * 2, -38, i < done ? C[n - 2] : mix(OUT, C[1], 0.5)));
}

/**
 * create(o) for cues like chain(): { fx, t, until, x, y, angle (numbers or functions of the move's time), flip,
 * ...that effect's options }, plus custom: { update(t, dt), drawBack(p, t), draw(p, t) } drawn in the move's own
 * frame (behind and in front of the cues).
 */
export function play(cues, custom = () => ({})) {
  return (o) => {
    const list = cues.map(({ fx, t, until, x, y, angle, flip, ...opts }, i) => ({ fx, t: t ?? 0, until: until ?? Infinity, x: x ?? 0, y: y ?? 0, angle: angle ?? 0, flip: !!flip, opts: { ...opts, seed: opts.seed ?? (o.seed ?? 1) + i }, inst: null, over: false }));
    const own = custom(o);
    let t = 0;
    const at = (v) => (typeof v === "function" ? v(t) : v);
    const each = (p, layer) => {
      const { tx, ty, fx: sign, cs, sn, fade, lightK } = p;
      for (const c of list) {
        if (!c.inst || c.over) continue;
        c.inst.options.x = tx + sign * at(c.x);
        c.inst.options.y = ty + at(c.y);
        c.inst.options.flip = sign < 0 !== c.flip;
        c.inst.options.angle = sign * at(c.angle);
        c.inst.draw(p.frame, layer);
      }
      Object.assign(p, { tx, ty, fx: sign, cs, sn, fade, lightK });
    };
    return {
      update(dt) {
        t += dt;
        for (const c of list) {
          if (c.over || t < c.t) continue;
          if (!c.inst) c.inst = createFx(c.fx, c.opts);
          else c.inst.update(dt);
          if (t >= c.until || (c.inst.done() && !c.fx.meta?.loop)) c.over = true;
        }
        own.update?.(t, dt);
      },
      drawBack(p) {
        own.drawBack?.(p, t);
        each(p, "back");
      },
      draw(p) {
        each(p, "front");
        own.draw?.(p, t);
      },
    };
  };
}

/** A thrown arc from (x0, y0) to (x1, y1) over T seconds peaking h px above the higher end: position and heading at u = 0..1. */
export function arcPath(x0, y0, x1, y1, h) {
  const top = Math.min(y0, y1) - h;
  // a parabola through both ends with its apex at top: y = a u^2 + b u + c
  const c = y0, d = y1 - y0, m = top - y0;
  // a + b = d and the apex value c - b^2 / 4a = top give b^2 - 4mb + 4dm = 0; the root that starts upward
  const b = 2 * (m - Math.sqrt(Math.max(0, m * m - m * d)));
  const a = d - b;
  return (u) => {
    const x = x0 + (x1 - x0) * u, y = a * u * u + b * u + c;
    return { x, y, ang: Math.atan2(2 * a * u + b, x1 - x0) };
  };
}

/**
 * The chakra each element stirs up while its seals are made, so every jutsu opens in its own way: embers rising
 * off the hands for fire, beads of water circling them, sparks jumping over the body for lightning, rings of wind
 * turning round it, pebbles lifting off the ground for earth. Builds with each seal, fades once the last is held.
 */
function aura(p, t, run, C) {
  if (!run.kind) return;
  const t0 = run.list[0].t, cur = [...run.list].reverse().find((s) => t >= s.t);
  if (!cur || t > run.end + 0.35) return;
  const done = run.list.indexOf(cur) + 1, k = Math.min(1, 0.35 + done / run.list.length) * (1 - smooth(run.end, run.end + 0.35, t));
  const [hx, hy] = cur.xy, n = C.length, a = t - t0;
  if (run.kind === "fire")
    for (let i = 0; i < 10; i++) {
      const per = 0.5 + 0.4 * rand(i, 1), u = (a / per + rand(i, 2)) % 1, x = hx + (rand(i, 3) - 0.5) * 14 + Math.sin(u * 6 + i) * 1.5, y = hy + 2 - u * 24;
      if (u * k > 0.9) continue;
      p.px(x, y, u < 0.3 ? C[n - 1] : u < 0.65 ? C[n - 3] : C[Math.max(0, n - 6)]);
      p.glow(x, y, 4, C[n - 3], 0.25 * k * (1 - u));
    }
  else if (run.kind === "water")
    for (let i = 0; i < 7; i++) {
      const th = a * 4.5 + (i * TAU) / 7, r = 8 + 2 * Math.sin(a * 3 + i), x = hx + Math.cos(th) * r, y = hy + Math.sin(th) * r * 0.45 - 1, near = Math.sin(th) > 0;
      p.circle(x, y, near ? 1.2 : 0.8, near ? C[n - 2] : C[n - 4], k);
      if (near) p.px(x - 0.5, y - 0.5, WHITE);
    }
  else if (run.kind === "lightning") {
    const f = Math.floor(t * 24);
    for (let i = 0; i < 3; i++) {
      if (rand(f, i + 9) > 0.35 + 0.5 * k) continue;
      let x = 2 + (rand(f, i) - 0.5) * 18, y = -6 - rand(f, i + 3) * 30;
      for (let s2 = 0; s2 < 3; s2++) {
        const nx = x + (rand(f, i * 7 + s2) - 0.5) * 7, ny = y + (rand(f, i * 5 + s2 + 1) - 0.5) * 7;
        p.line(x, y, nx, ny, s2 === 1 ? WHITE : C[n - 2]);
        (x = nx), (y = ny);
      }
      p.glow(x, y, 8, C[n - 3], 0.4 * k);
    }
  } else if (run.kind === "wind")
    for (let ring = 0; ring < 2; ring++) {
      const cy = -12 - ring * 14, rx = 13 - ring * 2, ry = 3.5, sp = 7 + ring * 2;
      for (let j = 0; j < 14; j++) {
        const th = a * sp + ring * 2 + j * 0.16, x = 2 + Math.cos(th) * rx, y = cy + Math.sin(th) * ry;
        p.px(x, y, Math.sin(th) > 0 ? C[n - 2] : C[n - 4]);
      }
    }
  else if (run.kind === "earth")
    for (let i = 0; i < 8; i++) {
      const per = 0.9 + 0.5 * rand(i, 4), u = (a / per + rand(i, 5)) % 1, x = (rand(i, 6) - 0.5) * 26, lift = Math.sin(Math.PI * u) * (6 + 8 * rand(i, 7)) * k;
      if (lift < 0.6) continue;
      p.rect(x, -lift - 1, 2, 2, C[Math.min(n - 1, 2)]);
      p.px(x, -lift - 1, C[n - 1]);
    }
}

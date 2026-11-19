// Shared by the jutsu moves (files starting with _ are helpers, not effects): the hand-seal poses every jutsu
// starts with, the mouth and palm the elements leave from, and a cue player like core chain() that can also
// steer a cue's angle over time (a projectile that tilts along its arc) and keep custom drawing in the same frame.
import { createFx, READY } from "../../core/index.js";

// Where the stock character's mouth and palm sit, in px from the feet, facing right.
export const MOUTH = [6, -31];

// Seals: both hands pressed together in front of the chest, the fingers up. Two shapes so a quick run of seals
// reads as the hands changing sign, not as a still pose.
export const SEAL_A = { ...READY, crouch: 3, lean: 1, fx: 9, fy: -25, bx: 11, by: -25, armsFront: true, ffx: 7, fbx: -7 };
export const SEAL_B = { ...SEAL_A, crouch: 4, fx: 10, fy: -27, bx: 12, by: -24 };
export const SEAL_C = { ...SEAL_A, crouch: 3, lean: 2, fx: 8, fy: -23, bx: 12, by: -26 };

/** Pose keys for n seals from t0, one every dt seconds, each one snapped on so the hands click into place. */
export function seals(t0, n, dt) {
  const keys = [];
  for (let i = 0; i < n; i++) keys.push([t0 + i * dt, [SEAL_A, SEAL_B, SEAL_C][i % 3], i ? "snap" : "out"]);
  return keys;
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

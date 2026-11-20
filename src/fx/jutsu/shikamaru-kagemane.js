// Kagemane no Jutsu (Shadow Imitation, Shikamaru). Narutopedia: the Nara clan's signature; seal Rat; the user stretches
// their shadow over the ground until it joins the target's, and from then the target has to copy every move the user
// makes; the shadow can only stretch as far as its area allows. Here: Shikamaru's crouch with his fingers joined, the
// Rat seal, his shadow pouring out across the floor in a wavering black band, meeting the target's, "success", then
// hands of shadow climbing up the target's body to its neck (Kage Kubishibari) as he moves and it is wrenched along.
// New: the stretching shadow (a black band with a crawling edge), the joined shadows, the shadow hands climbing.
import { Rng, READY, fit, clamp, smooth, ease, hex, rand, noise2, WHITE, TAU } from "../../core/index.js";
import { play, sealRun, drawSeals, bodyAt } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const THINK = 0.05, SEALS = sealRun(0.65, ["ne"], 0.12, { hold: 0.3 }), STRETCH = SEALS.end, REACH = STRETCH + 0.6, BIND = REACH + 0.35, CLIMB = BIND + 0.15, PULL = CLIMB + 0.6, END = PULL + 1.3, TX = 160;
const SH = ["#06040a", "#140e1e", "#2a2236", "#4a4058"].map(hex);

export const meta = {
  name: "Shadow imitation",
  desc: "Shikamaru: his thinking crouch, the Rat seal, his shadow pouring over the floor to join the target's, SUCCESS, then hands of shadow climbing the target to its neck while it's forced to copy his moves.",
  tags: ["jutsu", "shikamaru", "nara", "shadow", "control", "stun", "one-shot"],
  size: [260, 150],
  origin: [50, 118],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#06040a", "#140e1e", "#2a2236", "#4a4058", "#8a80a0"], seed: 59 },
};

// his thinking pose: crouched, the fingertips of both hands touching in a ring
const THINKP = { ...READY, crouch: 12, lean: 6, fx: 9, fy: -14, bx: 10, by: -14, armsFront: true, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [THINK + 0.15, THINKP, "out"],
    [SEALS.list[0].t - 0.05, { ...THINKP, crouch: 10 }],
    ...SEALS.keys,
    [CLIMB, { ...SEALS.keys[0][1], crouch: 6 }],
    [PULL, { ...READY, crouch: 4, lean: -10, fx: -2, fy: -30, bx: -6, by: -26 }, "out"],
    [END, { ...READY, crouch: 4, lean: -10, fx: -2, fy: -30, bx: -6, by: -26 }],
  ],
  hits: [
    { t: BIND, stop: 0.12, shake: 0.1, amp: 1, push: 0, straw: 0, flash: 0, skin: "shadow" },
    { t: PULL - 0.2, stop: 0.03, flash: 0, push: -1.5, straw: 6, shiver: 0.8 },
    { t: END - 0.3, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

export const create = play([], (o) => {
  const C = fit(o.palette, 5);
  return {
    drawBack(p, t) {
      // the shadow: from under his feet out over the floor to the target's, a band with a crawling edge
      if (t > STRETCH) {
        const pf = p.fade;
        p.fade = pf * (1 - smooth(END - 0.7, END - 0.1, t));
        const u = ease.inOutCubic(clamp((t - STRETCH) / (REACH - STRETCH))), x1 = 6 + (TX - 6 + 4) * u;
        p.shade(-10, -3, x1 + 4, 5, (x, y) => {
          const w = 2.6 + 1.4 * noise2(x * 0.2 - t * 6, 0, 2), tip = x > x1 - 8 ? (x1 - x) / 8 : 1;
          if (x > x1 || Math.abs(y - 0.5) > w * Math.max(0.2, tip)) return;
          return SH[0];
        });
        // the target's own shadow under it, joined once the band arrives
        if (u >= 1) p.ellipse(TX, 0.5, 14, 2.5, SH[0]);
        p.fade = pf;
      }
    },
    draw(p, t) {
      drawSeals(p, t, SEALS, C.slice(1).concat([hex("#c8c0e0")]));
      const b = bodyAt(act.poses, t);
      drawBadge(p, t, { kind: "nara", t0: THINK, t1: SEALS.end, label: "KAGEMANE", head: b.head });
      // a click of the link: SUCCESS over the target
      const a = t - BIND;
      if (a > 0 && a < 0.9) p.text("SUCCESS", TX, -70 - 4 * smooth(0, 0.1, a), a < 0.05 ? WHITE : C[4], { font: "big", align: "center", outline: SH[0] });
      // the shadow hands: tendrils climbing up the target's body, ending in hands at its neck
      if (t > CLIMB) {
        const u = ease.outCubic(clamp((t - CLIMB) / 0.5)), k = 1 - smooth(END - 0.6, END - 0.2, t);
        for (let i = 0; i < 4; i++) {
          const side = i % 2 ? 1 : -1, x0 = TX + side * (4 + i * 2), top = -46 * u + i * 2, f = Math.floor(t * 12);
          let px = x0, py = 0;
          for (let y = 0; y > top; y -= 2) {
            const nx = x0 + Math.sin(y * 0.25 + i + t * 4) * 2.5 * (1 - y / -60), ny = y - 2;
            p.line(px, py, nx, ny, SH[0], k);
            p.line(px + 1, py, nx + 1, ny, SH[1], k);
            (px = nx), (py = ny);
          }
          if (u > 0.9) {
            p.circle(px, py, 2.2, SH[0], k);
            for (let fgr = 0; fgr < 3; fgr++) p.line(px, py, px + side * (2 + fgr), py - 2 - fgr, SH[0], k);
          }
        }
      }
    },
  };
});

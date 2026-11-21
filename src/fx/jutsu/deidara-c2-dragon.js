// C2 Dragon (Deidara of the Akatsuki). Narutopedia: the mouths on his palms chew explosive clay into shapes; the C2 is a
// great clay dragon that spits smaller clay bombs from its mouth, which fly at the foe and explode when he says "Katsu!".
// Here: his hand opens, the mouth on the palm chews; he tosses a lump of clay up and it swells with a poof into a white
// dragon, long-necked and winged, hanging in the air over him; it rears and spits three clay missiles one after another,
// each a little dragon-headed shell trailing a thin line, curving down onto the target; he makes the seal: "KATSU!",
// and they go off in a chain, the last biggest; bits of white clay and smoke; the big dragon bursts into smoke too.
// New: the palm mouth, the dragon (segmented neck, wings that beat), the homing missiles, the chain blast.
import { Lights, Particles, P, Rng, READY, clamp, smooth, ease, hex, rand, WHITE, TAU } from "../../core/index.js";
import { play, bodyAt, blast, drawPoof } from "./_lib.js";
import { drawBadge } from "./_badge.js";

const TX = 190, CHEW = 0.3, TOSS = 0.7, SWELL = 0.85, FORMED = 1.25, SPITS = [1.45, 1.65, 1.85], LANDS = [1.95, 2.15, 2.35], KATSU = 2.45, END = 4.6;
const CLAY = ["#7a7468", "#b8b2a4", "#e8e4d8", "#ffffff"].map(hex), FIRE = ["#2a0806", "#7a1a0a", "#d8461c", "#ff8a2a", "#ffd060", "#fff4c0"].map(hex);
const DX = 40, DY = -84;

export const meta = {
  name: "C2 dragon",
  desc: "Deidara: the mouth on his palm chews clay; a tossed lump swells into a white clay dragon over him that spits three dragon-headed bombs onto the target; KATSU! and they go off in a chain, the dragon bursting into smoke too.",
  tags: ["jutsu", "deidara", "akatsuki", "clay", "explosion", "projectile", "aoe", "one-shot"],
  size: [340, 230],
  origin: [56, 198],
  duration: END,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#7a7468", "#b8b2a4", "#e8e4d8", "#ffffff"], seed: 81 },
};

const PALM = { ...READY, crouch: 3, fx: 14, fy: -26, bx: -4, by: -20, ffx: 8, fbx: -8 };
const SEALP = { ...READY, crouch: 4, fx: 6, fy: -32, bx: 2, by: -22, ffx: 8, fbx: -8 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.25, READY],
    [CHEW, PALM, "out"],
    [TOSS - 0.08, { ...PALM, fx: 6, fy: -18 }, "out"],
    [TOSS, { ...PALM, fx: 12, fy: -40 }, "snap"],
    [KATSU - 0.1, SEALP, "out"],
    [KATSU, { ...SEALP, fy: -36, lean: -3 }, "snap"],
    [END - 0.4, SEALP],
    [END, READY],
  ],
  hits: [
    { t: CHEW, target: false, sfx: "step" },
    { t: SWELL, stop: 0.04, shake: 0.2, amp: 1, target: false, sfx: "cast" },
    ...SPITS.map((t) => ({ t, target: false, sfx: "whoosh" })),
    { t: KATSU, stop: 0.08, target: false, sfx: "clash" },
    ...[0, 0.1, 0.22].map((d, i) => ({ t: KATSU + 0.06 + d, stop: i === 2 ? 0.2 : 0.05, shake: 0.4 + i * 0.3, amp: 3 + i * 2, push: 3 + i * 2, straw: 20 + i * 20, skin: "char", sfx: "explosion" })),
    { t: END - 0.4, flash: 0, push: 0, straw: 0, skin: null },
  ],
};

// the clay dragon: a coiled body, a long neck of segments to a horned head, wings that beat; s how swelled (0..1)
function dragon(p, x, y, s, t, rear) {
  if (s <= 0) return;
  const beat = Math.sin(t * 9) * 8;
  // wings
  for (const side of [-1, 1]) {
    const wx = x - 4, wy = y - 4;
    p.poly([[wx, wy], [wx - 26 * s, wy - (18 + beat) * s * (side > 0 ? 1 : 0.7)], [wx - 8 * s, wy + 4 * s]], CLAY[side > 0 ? 2 : 1]);
    p.line(wx, wy, wx - 26 * s, wy - (18 + beat) * s * (side > 0 ? 1 : 0.7), CLAY[0]);
  }
  // body and tail
  p.ellipse(x, y, 16 * s, 9 * s, CLAY[0]);
  p.ellipse(x, y - 1, 15 * s, 8 * s, CLAY[2]);
  for (let i = 0; i < 6; i++) p.circle(x - 16 * s - i * 4 * s, y + 3 * s + Math.sin(t * 4 + i) * 2, (4 - i * 0.5) * s, CLAY[1]);
  // the neck: segments curving up and forward to the head
  let hx = x + 10 * s, hy = y - 4 * s;
  for (let i = 0; i < 6; i++) { hx += 3.5 * s; hy -= (3 - i * 0.3 + rear * 1.2) * s; p.circle(hx, hy, (4.5 - i * 0.3) * s, CLAY[i % 2 ? 1 : 2]); }
  // the head: a long snout, horns, a dark eye, the mouth open when it spits
  p.ellipse(hx + 5 * s, hy, 7 * s, 4 * s, CLAY[2]);
  p.line(hx, hy - 3 * s, hx - 6 * s, hy - 9 * s, CLAY[1]);
  p.px(hx + 3 * s, hy - 1.5 * s, hex("#1a1420"));
  if (rear > 0.3) p.tri(hx + 6 * s, hy + 1, hx + 12 * s, hy + 1, hx + 12 * s, hy + 3 * s, hex("#3a3030"));
}

export const create = play([], (o) => {
  const R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const head = (t) => { const s = 1, rear = 0; void s; void rear; return [DX + 10 + 21 + 5, DY - 4 - 14 - 7]; };
  return {
    update(t, dt) {
      [0, 0.1, 0.22].forEach((d, i) => { if (t >= KATSU + 0.06 + d && !this["b" + i]) { this["b" + i] = 1; lights.add(TX - 10 + i * 10, -20, 160 + i * 60, FIRE[4], 1, 0.4); } });
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p, t) {
      [0, 0.1, 0.22].forEach((d, i) => blast(p, t - KATSU - 0.06 - d, { x: TX - 14 + i * 12, y: 0, R: 26 + i * 12, C: FIRE, seed: 3 + i, layer: "back" }));
      ps.draw(p, "back");
    },
    draw(p, t) {
      const b = bodyAt(act.poses, t), f = Math.floor(t * 16);
      drawBadge(p, t, { kind: "deidara", t0: 0.04, t1: CHEW, label: "C2", head: b.head });
      // the palm's mouth chewing
      if (t > CHEW && t < TOSS) { const [hx, hy] = b.handN, o2 = (f % 2) * 1.5; p.ellipse(hx + 1, hy, 2, 0.6 + o2, hex("#3a1418")); p.px(hx + 1, hy - 1, WHITE); }
      // the lump tossed up, then the swell into the dragon with a poof
      if (t > TOSS && t < SWELL) { const u = (t - TOSS) / (SWELL - TOSS); p.circle(b.handN[0] + (DX - b.handN[0]) * u, b.handN[1] + (DY - b.handN[1]) * u - Math.sin(u * Math.PI) * 10, 2, CLAY[2]); }
      drawPoof(p, DX, DY, t - SWELL, 2.2, 6);
      const s = ease.outBack(smooth(SWELL, FORMED, t), 1.4) * (1 - smooth(KATSU + 0.3, KATSU + 0.4, t));
      const rear = SPITS.reduce((m, st) => Math.max(m, Math.exp(-Math.max(0, t - st) * 8) * (t > st - 0.1 ? 1 : 0)), 0);
      dragon(p, DX, DY + Math.sin(t * 3) * 2, s, t, rear);
      if (t > KATSU + 0.3) drawPoof(p, DX, DY, t - KATSU - 0.3, 2.4, 9);
      // the missiles: little shells curving down onto the target, trailing a thin line
      const H = head(t);
      SPITS.forEach((st, i) => {
        if (t < st || t > KATSU + 0.06 + [0, 0.1, 0.22][i]) return;
        const u = clamp((t - st) / (LANDS[i] - st)), tx = TX - 14 + i * 12, ty = -10;
        const x = H[0] + (tx - H[0]) * u, y = H[1] + (ty - H[1]) * u * u - Math.sin(u * Math.PI) * 24, ang = Math.atan2(ty - H[1] + 48 * (u - 0.5), tx - H[0]);
        p.line(H[0], H[1], x, y, CLAY[1], 0.25);
        p.ellipse(x, y, 4, 2.5, CLAY[2]);
        p.px(x + Math.cos(ang) * 4, y + Math.sin(ang) * 4, CLAY[3]);
        p.px(x + 1, y - 1, hex("#1a1420"));
        if (u >= 1) p.glow(x, y, 6, FIRE[3], 0.3 + 0.3 * (f % 2));
      });
      // KATSU!: the word over him, and the chain of blasts
      if (t > KATSU - 0.02 && t < KATSU + 0.6) p.text("KATSU!", b.head[0] - 4, b.head[1] - 16, t < KATSU + 0.06 ? WHITE : FIRE[4], { font: "mini", align: "center", outline: hex("#120c18"), a: 1 - smooth(KATSU + 0.4, KATSU + 0.6, t) });
      [0, 0.1, 0.22].forEach((d, i) => blast(p, t - KATSU - 0.06 - d, { x: TX - 14 + i * 12, y: 0, R: 26 + i * 12, C: FIRE, seed: 3 + i }));
      void rand; void TAU;
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
});

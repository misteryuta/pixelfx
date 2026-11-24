// ULTIMATE: Perfect Susanoo (Madara Uchiha). Narutopedia: Madara's Complete Body Susanoo is dark blue, with a long
// tengu nose, horns, wings and armour, and wields a katana that cut through several mountains with one stroke; he
// called up the Wood Dragon (Mokuton: Mokuryuu) and opened the Rinnegan before it took shape.
// A 20 s cutscene built from the user's ten storyboard panels, in the storyboard's order, each split into layers
// that move (blender/madara_px/shots3.py, shots2.py, engine.py), cut together with the reference video's transitions
// redrawn in pixels: fade in on the face, dissolve to the dragon rising, the dragon lunges into the lens, cut to the
// Rinnegan, its glow dissolves into a violet orb on falling streaks, the orb fades into the forming Susanoo, cut to
// the chest flare and a dive into the blue, the low angle, the arm drawing and whipping the blade out of frame, the
// slow descent of the blade and a fall into the burst, the blast flooding cyan, the valley from above with the slash,
// the ring, the crater and smoke, and a last blast of the cut mountain into white. One 1-pixel grid, 480x270, 24 fps.
import { READY, hex } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { ultBanner, frameOf } from "./_ultimate.js";
import { shotOf, drawShot } from "./_cine3d.js";

const MV = "madara-ult-perfect-susanoo", FPS3D = 24, N = 480, DUR = N / FPS3D;
const at = (f) => (f - 1) / FPS3D;

export const meta = {
  name: "Perfect Susanoo",
  desc: "ULTIMATE. Madara opens his Rinnegan in the fog and the wood dragon tears up out of the dust; the light of his eye swells and the blue Perfect Susanoo forms out of it, its eyes ignite and chakra bursts at its chest; it rises over the enemy, draws its blade and sweeps it down over the mountains: the land explodes, rocks fly, and in the valley the cut mountain top slides away while shock rings roll out round Madara's Susanoo.",
  tags: ["jutsu", "ultimate", "madara", "susanoo", "complete-body", "rinnegan", "wood", "cutscene", "one-shot"],
  size: [480, 270],
  origin: [240, 236],
  duration: DUR,
  loop: false,
  fps: 24,
  bg: "none",
  actor: 2,
  options: { palette: ["#0a0e3a", "#1a44a8", "#3a74e0", "#86bcff", "#e6f2ff"], seed: 480 },
};

export const act = {
  target: { x: 120 },
  poses: [[-0.25, READY], [DUR, READY]],
  hits: [
    { t: at(27), target: false, sfx: "rumble" },
    { t: at(37), stop: 0, target: false, sfx: "explosion" },
    { t: at(55), target: false, sfx: "heavy" },
    { t: at(83), target: false, sfx: "whoosh" },
    { t: at(97), target: false, sfx: "heavy" },
    { t: at(113), target: false, sfx: "cast" },
    { t: at(125), target: false, sfx: "rumble" },
    { t: at(149), target: false, sfx: "heavy" },
    { t: at(183), target: false, sfx: "thunder" },
    { t: at(203), target: false, sfx: "explosion" },
    { t: at(224), target: false, sfx: "whoosh" },
    { t: at(231), target: false, sfx: "rumble" },
    { t: at(249), target: false, sfx: "thunder" },
    { t: at(285), target: false, sfx: "whoosh" },
    { t: at(296), target: false, sfx: "parry" },
    { t: at(318), target: false, sfx: "whoosh" },
    { t: at(343), target: false, sfx: "explosion" },
    { t: at(363), target: false, sfx: "rumble" },
    { t: at(373), target: false, sfx: "explosion" },
    { t: at(399), target: false, sfx: "heavy" },
    { t: at(404), target: false, sfx: "rumble" },
    { t: at(430), target: false, sfx: "land" },
    { t: at(467), target: false, sfx: "explosion" },
  ],
};
// the cutscene draws everyone itself: the rig figure and the dummy stay hidden
export const actorAlpha = () => 0;
export const targetState = () => ({ a: 0 });

export const create = play([], () => {
  const box = frameOf(meta);
  return {
    update() {},
    drawBack() {},
    draw(p, t) {
      const s = shotOf(MV, "full");
      if (s) {
        const i = Math.max(0, Math.min(N - 1, Math.round(t * FPS3D)));
        drawShot(p, box, s.frames[i]);
      } else {
        // the frames aren't there (a browser): a dark frame with the name, so the move still reads
        p.rect(box[0], box[1], box[2] - box[0], box[3] - box[1], hex("#0a0e1e"));
      }
      ultBanner(p, t, box, { t0: 0.05, name: "PERFECT SUSANOO", hold: 1.0, color: "#86bcff" });
      void bodyAt;
    },
  };
});

// ULTIMATE: Perfect Susanoo (Madara Uchiha). Narutopedia: Madara's Complete Body Susanoo is dark blue, with a long
// tengu nose, horns, wings and armour, and wields a katana that cut through several mountains with one stroke; he
// called up the Wood Dragon (Mokuton: Mokuryuu) and opened the Rinnegan before it took shape.
// A 20 s cutscene built from the user's ten storyboard panels, in the storyboard's order (top-left, top-right, next
// row left, right, ...), each panel animated as its own shot on one 1-pixel grid (blender/madara_px/shots.py):
//   1 Madara's face in the fog, the Rinnegan glows        6 from below the Susanoo towers over the enemy
//   2 the wood dragon tears out of the ground              7 its hand closes on the grip, the blade slides out
//   3 the Rinnegan close up, its light fills the frame     8 the blade sweeps down and hits the land
//   4 the Perfect Susanoo forms out of that light          9 the land explodes, rocks fly
//   5 chakra bursts at its chest                           10 the valley afterwards, shock rings, Madara alone
// The frames (480x270, 24 fps) are played here 1:1; the viewer shows them as they are.
import { READY, hex } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { ultBanner, frameOf } from "./_ultimate.js";
import { shotOf, drawShot } from "./_cine3d.js";

const MV = "madara-ult-perfect-susanoo", FPS3D = 24, N = 480, DUR = N / FPS3D;
const at = (f) => (f - 1) / FPS3D;

export const meta = {
  name: "Perfect Susanoo",
  desc: "ULTIMATE. Madara's Rinnegan glows in the fog and the wood dragon tears out of the ground; the light of his eye swells and the blue Perfect Susanoo forms out of it, its eyes ignite and chakra bursts at its chest; towering over the enemy it closes its hand on the grip, draws the blade and sweeps it down over the mountains: the land explodes, and in the valley afterwards the shock rings roll out round Madara's Susanoo.",
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
    { t: at(28), target: false, sfx: "rumble" },
    { t: at(37), stop: 0, target: false, sfx: "explosion" },
    { t: at(52), target: false, sfx: "heavy" },
    { t: at(103), target: false, sfx: "cast" },
    { t: at(121), target: false, sfx: "rumble" },
    { t: at(151), target: false, sfx: "heavy" },
    { t: at(173), target: false, sfx: "thunder" },
    { t: at(193), target: false, sfx: "explosion" },
    { t: at(223), target: false, sfx: "rumble" },
    { t: at(243), target: false, sfx: "thunder" },
    { t: at(282), target: false, sfx: "whoosh" },
    { t: at(293), target: false, sfx: "parry" },
    { t: at(319), target: false, sfx: "whoosh" },
    { t: at(329), target: false, sfx: "explosion" },
    { t: at(340), target: false, sfx: "rumble" },
    { t: at(367), target: false, sfx: "explosion" },
    { t: at(397), target: false, sfx: "rumble" },
    { t: at(420), target: false, sfx: "land" },
    { t: at(440), target: false, sfx: "land" },
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

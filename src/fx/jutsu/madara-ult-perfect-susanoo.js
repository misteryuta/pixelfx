// ULTIMATE: Perfect Susanoo (Madara Uchiha). Narutopedia: Madara's Complete Body Susanoo is dark blue, with a long
// tengu nose, horns, wings and armour, and wields a katana that cut through several mountains with one stroke; he
// called up the Wood Dragon (Mokuton: Mokuryuu) and opened the Rinnegan before it took shape.
// A 20 s cutscene made in Blender (blender/cine_madara.py + cine_madara_shots.py) after the user's storyboard and
// turnaround: Madara (a cut-out rig from the user's turnaround) calls the wooden dragon out of the ground; an insert of
// his Rinnegan opening; the blue Perfect Susanoo (the user's sprite, rigged) builds up round him, helmet, chest,
// shoulders; the energy gathers; seen from below, towering over the enemy; its hand closes on the grip and draws the
// blade; it winds up and cuts; the blade meets the land, the land bursts, the shock front races out over the valley;
// the dust settles and Madara stands alone. Ten inserts (the user's panels, each split into layers and animated) cut
// into the 3D action. The frames (480x270, 24 fps) are played here; the viewer shows them as they are.
import { READY, hex } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { ultBanner, frameOf } from "./_ultimate.js";
import { shotOf, drawShot } from "./_cine3d.js";

const MV = "madara-ult-perfect-susanoo", FPS3D = 24, N = 480, DUR = N / FPS3D;
const at = (f) => (f - 1) / FPS3D;

export const meta = {
  name: "Perfect Susanoo",
  desc: "ULTIMATE. Madara calls the wooden dragon out of the earth, opens his Rinnegan, and his blue Perfect Susanoo builds up round him, helmet, chest and shoulders; towering over the enemy it draws its blade, winds up and cuts the land in two: the ground bursts and a shock front races out over the valley, and Madara stands alone in the dust.",
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
    { t: at(30), target: false, sfx: "rumble" },
    { t: at(52), stop: 0, target: false, sfx: "explosion" },
    { t: at(72), target: false, sfx: "heavy" },
    { t: at(84), target: false, sfx: "cast" },
    { t: at(105), target: false, sfx: "rumble" },
    { t: at(119), target: false, sfx: "heavy" },
    { t: at(154), target: false, sfx: "thunder" },
    { t: at(182), target: false, sfx: "rumble" },
    { t: at(236), target: false, sfx: "parry" },
    { t: at(244), target: false, sfx: "thunder" },
    { t: at(262), target: false, sfx: "whoosh" },
    { t: at(285), target: false, sfx: "heavy" },
    { t: at(307), target: false, sfx: "explosion" },
    { t: at(321), target: false, sfx: "explosion" },
    { t: at(371), target: false, sfx: "rumble" },
    { t: at(418), target: false, sfx: "land" },
    { t: at(436), target: false, sfx: "land" },
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

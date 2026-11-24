// ULTIMATE: Perfect Susanoo (Madara Uchiha). Narutopedia: Madara's Complete Body Susanoo is dark blue, with a long
// tengu nose, horns, wings and armour, and wields a katana that cut through several mountains with one stroke; he
// called up the Wood Dragon (Mokuton: Mokuryuu) and opened the Rinnegan before it took shape.
// A 20 s cutscene built from the user's ten storyboard panels (and the user's orb image), in the storyboard's order,
// each split into layers that move (blender/madara_px/shots7.py on shots6/5/4/3/2 and engine.py; the wood dragon is a rig of five body segments, head and jaw), cut together with the
// reference video's transitions redrawn in pixels: fade in on the face as the eye opens, dissolve to the dragon rising
// out of the dust, rearing back, snapping up the enemy and flying into the lens, cut to the Rinnegan, its glow dissolving into the orb on
// falling streaks, the orb into the forming Susanoo, the chest with Madara in the crystal, a red glint and the flare erupting from it, the low angle, the arm
// whipping the blade out of frame, the pointed blade's slow descent with chakra wisps, a second of grinding along the ground, the big blue blast and a fall into it, the
// blast flooding cyan, the valley from above (slash, ring, crater, the cut mountain tops springing up in smoke), and a
// close blast of rock and smoke into white. One 1-pixel grid, 480x270, 24 fps.
import { READY, hex } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { ultBanner, frameOf } from "./_ultimate.js";
import { shotOf, drawShot } from "./_cine3d.js";

const MV = "madara-ult-perfect-susanoo", FPS3D = 24, N = 480, DUR = N / FPS3D;
const at = (f) => (f - 1) / FPS3D;

export const meta = {
  name: "Perfect Susanoo",
  desc: "ULTIMATE. Madara opens his Rinnegan; the wood dragon rises out of the dust and snaps up the enemy; the light of his eye becomes a violet orb and the blue Perfect Susanoo forms round it, its eyes ignite and chakra flares at its chest; it rises over the battlefield, draws its pointed blade and brings it down over the mountains: the land explodes, the cut mountain tops spring up in smoke, and a last blast of rock whites everything out.",
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
    { t: at(67), target: false, sfx: "rumble" },
    { t: at(77), target: false, sfx: "whoosh" },
    { t: at(84), target: false, sfx: "explosion" },
    { t: at(91), target: false, sfx: "whoosh" },
    { t: at(102), target: false, sfx: "whoosh" },
    { t: at(109), target: false, sfx: "heavy" },
    { t: at(117), target: false, sfx: "cast" },
    { t: at(133), target: false, sfx: "rumble" },
    { t: at(155), target: false, sfx: "heavy" },
    { t: at(189), target: false, sfx: "thunder" },
    { t: at(201), target: false, sfx: "rumble" },
    { t: at(204), target: false, sfx: "cast" },
    { t: at(210), target: false, sfx: "explosion" },
    { t: at(227), target: false, sfx: "rumble" },
    { t: at(245), target: false, sfx: "thunder" },
    { t: at(267), target: false, sfx: "heavy" },
    { t: at(271), target: false, sfx: "whoosh" },
    { t: at(282), target: false, sfx: "parry" },
    { t: at(285), target: false, sfx: "whoosh" },
    { t: at(301), target: false, sfx: "whoosh" },
    { t: at(307), target: false, sfx: "whoosh" },
    { t: at(323), target: false, sfx: "clash" },
    { t: at(330), target: false, sfx: "rumble" },
    { t: at(347), target: false, sfx: "explosion" },
    { t: at(363), target: false, sfx: "rumble" },
    { t: at(371), target: false, sfx: "explosion" },
    { t: at(395), target: false, sfx: "heavy" },
    { t: at(399), target: false, sfx: "rumble" },
    { t: at(421), target: false, sfx: "heavy" },
    { t: at(425), target: false, sfx: "heavy" },
    { t: at(429), target: false, sfx: "heavy" },
    { t: at(433), target: false, sfx: "explosion" },
    { t: at(445), target: false, sfx: "explosion" },
    { t: at(459), target: false, sfx: "rumble" },
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

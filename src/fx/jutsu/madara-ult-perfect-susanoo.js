// ULTIMATE: Perfect Susanoo (Madara Uchiha). Narutopedia: Madara's Complete Body Susanoo is dark blue, with a long
// tengu nose, horns, wings and armour, and wields a katana that cut through several mountains with one stroke; he
// called up the Wood Dragon (Mokuton: Mokuryuu) and opened the Rinnegan before it took shape.
// A 20 s cutscene built from the user's ten storyboard panels (and the user's orb image), in the storyboard's order,
// each split into layers that move (blender/madara_px/shots8.py on shots7/6/5/4/3/2 and engine.py; the wood dragon is a rig of five body segments, head and jaw), cut together with the
// reference video's transitions redrawn in pixels: fade in on the face as the eye opens, dissolve to the dragon bursting up
// out of the dust and flying straight into the lens, cut to the Rinnegan, its glow dissolving into the orb on
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
    { t: at(49), target: false, sfx: "rumble" },
    { t: at(51), target: false, sfx: "whoosh" },
    { t: at(78), target: false, sfx: "whoosh" },
    { t: at(85), target: false, sfx: "heavy" },
    { t: at(93), target: false, sfx: "cast" },
    { t: at(109), target: false, sfx: "rumble" },
    { t: at(131), target: false, sfx: "heavy" },
    { t: at(165), target: false, sfx: "thunder" },
    { t: at(177), target: false, sfx: "rumble" },
    { t: at(180), target: false, sfx: "cast" },
    { t: at(186), target: false, sfx: "explosion" },
    { t: at(203), target: false, sfx: "rumble" },
    { t: at(221), target: false, sfx: "thunder" },
    { t: at(243), target: false, sfx: "heavy" },
    { t: at(247), target: false, sfx: "whoosh" },
    { t: at(258), target: false, sfx: "parry" },
    { t: at(263), target: false, sfx: "whoosh" },
    { t: at(285), target: false, sfx: "whoosh" },
    { t: at(291), target: false, sfx: "whoosh" },
    { t: at(309), target: false, sfx: "clash" },
    { t: at(316), target: false, sfx: "rumble" },
    { t: at(335), target: false, sfx: "explosion" },
    { t: at(355), target: false, sfx: "rumble" },
    { t: at(365), target: false, sfx: "explosion" },
    { t: at(389), target: false, sfx: "heavy" },
    { t: at(393), target: false, sfx: "rumble" },
    { t: at(415), target: false, sfx: "heavy" },
    { t: at(419), target: false, sfx: "heavy" },
    { t: at(423), target: false, sfx: "heavy" },
    { t: at(427), target: false, sfx: "explosion" },
    { t: at(443), target: false, sfx: "explosion" },
    { t: at(457), target: false, sfx: "rumble" },
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

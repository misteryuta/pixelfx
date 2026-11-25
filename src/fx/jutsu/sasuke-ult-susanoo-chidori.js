// ULTIMATE: Susanoo Chidori (Sasuke Uchiha, Rinnegan and Eternal Mangekyou). Against Kaguya and her sphere: his
// eyes, the seal and black flames, Kaguya above the field, the Chidori in his hand, the winged Susanoo carrying it into
// the sphere, the hand driving through its wall, light bursting out, the sphere blowing apart.
// A 20 s cutscene after the user's shot script, on the user's storyboard panels (blender/sasuke_px/sshots7.py on sshots6/5.py; figures move against their backgrounds; the Amaterasu spears pierce Madara): his
// eyes held calm for a breath (Mangekyou right, Rinnegan left), the seal closing on a still camera, dark chakra spikes
// rising through the opponent (a swappable target), Sasuke in the air with the rope belt swinging and the Chidori
// igniting in his left hand, violet chakra closing round him and parting on the winged Susanoo, the wide shot of the
// Susanoo small before the vast sphere with its charged hand the brightest point, his face and the shout, the open
// hand hitting the sphere side on - the first shake - the crackle cutting off and only the palm glowing, then violet
// light out of the sphere, the shockwave over the ground and debris against the white final flash.
// The frames (800x450, 24 fps, one panel pixel per screen pixel) are played here 1:1. Replaces Chidori Planet Splitter as Sasuke's ultimate.
import { READY, hex } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { ultBanner, frameOf } from "./_ultimate.js";
import { shotOf, drawShot } from "./_cine3d.js";

const MV = "sasuke-ult-susanoo-chidori", FPS3D = 24, N = 480, DUR = N / FPS3D;
const at = (f) => (f - 1) / FPS3D;

export const meta = {
  name: "Susanoo Chidori",
  desc: "ULTIMATE. Sasuke holds his gaze, Mangekyou and Rinnegan, and closes the seal; purple Amaterasu spikes burst out of the ground and impale the opponent; in the air the Chidori ignites in his hand and his winged Susanoo flies at the vast sphere; he shouts, the open hand hits the sphere side on, the crackle cuts off, violet light breaks out and the shockwave throws debris against the white final flash.",
  tags: ["jutsu", "ultimate", "sasuke", "susanoo", "chidori", "rinnegan", "amaterasu", "cutscene", "one-shot"],
  size: [800, 450],
  origin: [400, 393],
  duration: DUR,
  loop: false,
  fps: 24,
  bg: "none",
  actor: 2,
  options: { palette: ["#1a1028", "#5a2a78", "#b04ce8", "#ffc8fa", "#5ce6ff"], seed: 481 },
};

export const act = {
  target: { x: 120 },
  poses: [[-0.25, READY], [DUR, READY]],
  hits: [
    { t: at(60), target: false, sfx: "cast" },
    { t: at(66), target: false, sfx: "rumble" },
    { t: at(74), stop: 0, target: false, sfx: "heavy" },
    { t: at(123), target: false, sfx: "thunder" },
    { t: at(141), target: false, sfx: "thunder" },
    { t: at(161), target: false, sfx: "rumble" },
    { t: at(196), target: false, sfx: "thunder" },
    { t: at(255), target: false, sfx: "whoosh" },
    { t: at(279), target: false, sfx: "explosion" },
    { t: at(293), target: false, sfx: "explosion" },
    { t: at(337), target: false, sfx: "rumble" },
    { t: at(409), target: false, sfx: "explosion" },
    { t: at(430), target: false, sfx: "rumble" },
    { t: at(455), target: false, sfx: "rumble" },
  ],
};
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
        p.rect(box[0], box[1], box[2] - box[0], box[3] - box[1], hex("#1a1028"));
      }
      ultBanner(p, t, box, { t0: 0.05, name: "SUSANOO CHIDORI", hold: 1.0, color: "#e2a8ff" });
      void bodyAt;
    },
  };
});

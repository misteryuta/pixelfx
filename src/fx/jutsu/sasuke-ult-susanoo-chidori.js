// ULTIMATE: Susanoo Chidori (Sasuke Uchiha, Rinnegan and Eternal Mangekyou). Against Kaguya and her sphere: his
// eyes, the seal and black flames, Kaguya above the field, the Chidori in his hand, the winged Susanoo carrying it into
// the sphere, the hand driving through its wall, light bursting out, the sphere blowing apart.
// A 20 s cutscene from the user's ten storyboard panels (assets/cine/sasuke-ult/ref) on one 1-pixel grid, built
// after the reference's beats (blender/sasuke_px/sshots3.py: no figure is cut out, the panels' own effects are animated in place): his still eyes and a glint, the seal with a white flash
// and black flame spikes bursting out, black spears striking into Kaguya and Amaterasu tearing out of her as she
// tumbles into dark smoke, the Chidori forming in his hand and a violet flash, the Susanoo and a climb to its burning
// eyes, the winged Susanoo shooting at the sphere, a black flame core folding into the Chidori, the scream as the frame
// flushes red, the wall cracking and the light breaking through, Kaguya in the dark as white floods in, a cross of
// light at the sphere's heart and its beams breaking out as it glows, and the burst into white.
// The frames (480x270, 24 fps) are played here 1:1. Replaces Chidori Planet Splitter as Sasuke's ultimate.
import { READY, hex } from "../../core/index.js";
import { play, bodyAt } from "./_lib.js";
import { ultBanner, frameOf } from "./_ultimate.js";
import { shotOf, drawShot } from "./_cine3d.js";

const MV = "sasuke-ult-susanoo-chidori", FPS3D = 24, N = 480, DUR = N / FPS3D;
const at = (f) => (f - 1) / FPS3D;

export const meta = {
  name: "Susanoo Chidori",
  desc: "ULTIMATE. Sasuke's Sharingan turns and black flames swallow the field; Kaguya looms above; the Chidori crackles in his hand and his winged Susanoo carries it into her sphere, drives its hand through the wall, and the sphere throbs, splits with light and blows apart.",
  tags: ["jutsu", "ultimate", "sasuke", "susanoo", "chidori", "rinnegan", "amaterasu", "cutscene", "one-shot"],
  size: [480, 270],
  origin: [240, 236],
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
    { t: at(22), target: false, sfx: "cast" },
    { t: at(31), stop: 0, target: false, sfx: "clash" },
    { t: at(33), target: false, sfx: "rumble" },
    { t: at(66), target: false, sfx: "whoosh" },
    { t: at(73), target: false, sfx: "heavy" },
    { t: at(90), target: false, sfx: "rumble" },
    { t: at(119), target: false, sfx: "thunder" },
    { t: at(138), target: false, sfx: "thunder" },
    { t: at(155), target: false, sfx: "explosion" },
    { t: at(159), target: false, sfx: "whoosh" },
    { t: at(185), target: false, sfx: "cast" },
    { t: at(199), target: false, sfx: "whoosh" },
    { t: at(205), target: false, sfx: "whoosh" },
    { t: at(233), target: false, sfx: "explosion" },
    { t: at(237), target: false, sfx: "thunder" },
    { t: at(253), target: false, sfx: "rumble" },
    { t: at(280), target: false, sfx: "whoosh" },
    { t: at(285), target: false, sfx: "heavy" },
    { t: at(309), target: false, sfx: "explosion" },
    { t: at(313), target: false, sfx: "clash" },
    { t: at(330), target: false, sfx: "rumble" },
    { t: at(350), target: false, sfx: "explosion" },
    { t: at(357), target: false, sfx: "rumble" },
    { t: at(373), target: false, sfx: "cast" },
    { t: at(387), target: false, sfx: "thunder" },
    { t: at(410), target: false, sfx: "rumble" },
    { t: at(427), target: false, sfx: "explosion" },
    { t: at(440), target: false, sfx: "rumble" },
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

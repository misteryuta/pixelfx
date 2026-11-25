// Itachi as himself (2026-11-25): the user's turnaround (src/fx/jutsu/_chardata.js, side view 23x72) drawn as a cut-out
// puppet in place of the stock figure. The moves keep their pose tracks (act.poses); this reads the stock pose at t and
// carries it over: where he stands and which way he faces, his crouch (a little squash), his lean (the head tips, the
// body leans a hair), and his near hand (the sleeve turns at the shoulder so the hand goes where the stock hand goes,
// scaled to his longer arm). It returns the points the effects anchor to: his right eye (the Mangekyou, Amaterasu),
// the head, the chest, the hand.
// Use: export const actorAlpha = () => 0 in the move (the stock figure is hidden), then const I = drawItachi(p, t,
// act.poses) at the start of draw(); anchors in I.eye, I.head, I.hand, I.chest.
import { bodyAt } from "./_lib.js";
import { drawModel, modelPoint, reachPose } from "./_models.js";

const NAME = "itachi", VIEW = "right";
// in the side view: the shoulder (arm pivot), the eye (the visible one is his right eye when he faces right), the
// middle of the head, the chest
const UV = { shoulder: [10, 30], eye: [18.5, 17], head: [14, 14], chest: [11, 34], crown: [12, 1] };
const ARM = 1.45; // his arm is this much longer than the stock figure's

/** Where Itachi is and how he stands at t, from a stock pose track: { o (drawModel options), x, face, b (stock body) }. */
export function itachiPose(poses, t, extra = {}) {
  const b = bodyAt(poses, t), q = b.q, x = q.x ?? 0, y = q.y ?? 0;
  const face = Math.cos(q.yaw ?? 0) < 0 ? -1 : 1;
  const crouch = Math.max(0, (q.crouch ?? 3) - 3), lean = q.lean ?? 0;
  const o = { flip: face < 0, sy: 1 - crouch * 0.007, rot: lean * 0.004 * face, pose: { head: { rot: lean * 0.012 * face + (extra.headRot ?? 0) } } };
  // the near hand: the stock hand's offset from the stock chest, scaled to his arm, from his shoulder
  const sh = modelPoint(NAME, VIEW, x, y, o, null, UV.shoulder);
  const target = [sh[0] + (b.handN[0] - b.chest[0]) * ARM, sh[1] + (b.handN[1] - b.chest[1] + 4) * ARM];
  o.pose.arm = { ...reachPose(NAME, VIEW, x, y, o, "arm", target, 0.85, 1.2), ...(extra.arm ?? {}) };
  return { o, x, y, face, b };
}

/** Draw him; returns his anchors on screen: { eye, head, crown, chest, hand, face, x }. */
export function drawItachi(p, t, poses, extra = {}) {
  const P = itachiPose(poses, t, extra), { o, x, y } = P;
  drawModel(p, NAME, VIEW, x, y, { ...o, alpha: extra.alpha ?? 1, tint: extra.tint, tintK: extra.tintK });
  return itachiPoints(P);
}
/** His anchors without drawing (for drawBack, cameras, particles). */
export function itachiAt(poses, t, extra = {}) { return itachiPoints(itachiPose(poses, t, extra)); }

function itachiPoints({ o, x, y, face }) {
  return {
    face, x,
    eye: modelPoint(NAME, VIEW, x, y, o, "head", UV.eye),
    head: modelPoint(NAME, VIEW, x, y, o, "head", UV.head),
    crown: modelPoint(NAME, VIEW, x, y, o, "head", UV.crown),
    chest: modelPoint(NAME, VIEW, x, y, o, null, UV.chest),
    hand: modelPoint(NAME, VIEW, x, y, o, "arm", [11, 48]),
  };
}

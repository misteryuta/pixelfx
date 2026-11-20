// Outfits for the rig (rig.js): the same skeleton and animation, dressed. An outfit gives each body part a ramp of tones,
// a paint(frame, local) that lays the costume's details onto the body in each bone's own space (so a zipper stays on the
// chest and a bandage on the thigh however the limb turns), and, separately, a head: pixel sprites for the views the rig
// can show (side right, side left, front, back), each with its pivot, stamped at the rig's head joint into the same depth
// buffer as the body, so a near arm or the collar in front still covers it. Body and head are separate layers: swap the
// head and nothing else changes.
//
// Naruto, after the four-view reference sheet: black upper jacket and sleeves with a white zipper and the Leaf swirl
// patch on the left shoulder, orange lower jacket, a black waistband, orange trousers with the white-and-black bandage
// and holster on the right thigh, bare ankles, black sandals with the toes showing; the big spiky yellow hair, the Leaf
// headband (steel plate, dark cloth, the two long tails), blue eyes, whisker marks.
import { hex } from "./color.js";

const H = (v) => hex(v) >>> 0;
const ramp = (...c) => c.map(H);
// flat like the sheet: two tones per material, a third only in the deepest shadow
const ORANGE = ramp("#ff8c2c", "#ff8c2c", "#e2680e", "#a84a0a");
const BLACK = ramp("#3c3c48", "#3c3c48", "#2a2a33", "#1c1c22");
const SKIN = ramp("#f9d3b4", "#f9d3b4", "#e6a888", "#b87a60");
const SANDAL = ramp("#3c3c48", "#3c3c48", "#2a2a33", "#1c1c22");
const C = { white: H("#f4f4f8"), grey: H("#a8a8b0"), dark: H("#1c1c22"), ink: H("#16121a"), skin: H("#f9d3b4"), skinS: H("#e6a888"), patch: H("#d8d8dc"), patchR: H("#8a5a3a"), holster: H("#2a2a33") };

// part numbers, as in rig.js
const P = { pelvis: 1, waist: 2, chest: 3, neck: 4, head: 5, face: 6, upperN: 7, elbowN: 8, foreN: 9, handN: 10, upperF: 11, elbowF: 12, foreF: 13, handF: 14, thighN: 15, kneeN: 16, shinN: 17, footN: 18, thighF: 19, kneeF: 20, shinF: 21, footF: 22 };

const NARUTO_BODY = {
  [P.pelvis]: ORANGE, [P.waist]: ORANGE, [P.chest]: BLACK, [P.neck]: BLACK,
  [P.upperN]: BLACK, [P.elbowN]: BLACK, [P.foreN]: BLACK, [P.handN]: SKIN,
  [P.upperF]: BLACK, [P.elbowF]: BLACK, [P.foreF]: BLACK, [P.handF]: SKIN,
  [P.thighN]: ORANGE, [P.kneeN]: ORANGE, [P.shinN]: ORANGE, [P.footN]: SANDAL,
  [P.thighF]: ORANGE, [P.kneeF]: ORANGE, [P.shinF]: ORANGE, [P.footF]: SANDAL,
};
// the details, by bone and position in that bone's frame (x forward or along the bone, y up or across, z toward us)
function narutoPaint(frame, l, tone, part) {
  const [x, y, z] = l;
  if (frame === "chest") {
    // the zipper down the front; below the ribs the jacket turns orange
    if (x > 2.2 && Math.abs(z) < 0.55) return y < -1.2 ? C.white : C.grey;
    if (y < -1.4) return tone >= 2 ? ORANGE[2] : ORANGE[0];
    return null;
  }
  if (frame === "waist") {
    if (x > 1.8 && Math.abs(z) < 0.55) return C.white;
    return null;
  }
  if (frame === "pelvis") {
    // the black waistband at the jacket's hem
    if (y > 0.4) return tone >= 2 ? BLACK[2] : BLACK[0];
    return null;
  }
  if (frame === "upperF") {
    // the Leaf swirl patch on the left shoulder
    const d = Math.hypot(x - 1.6, y);
    if (d < 1.0) return C.grey;
    if (d < 1.7) return x < 1.2 ? C.patchR : C.patch;
    return null;
  }
  if (frame === "thighN") {
    // the bandage: white with two black stripes, the holster strapped behind it
    if (x > 3.6 && x < 6.4) {
      if (z < -1.2) return C.holster;
      const k = Math.floor((x - 3.6) / 0.7);
      return k === 1 || k === 3 ? C.dark : C.white;
    }
    return null;
  }
  if (frame === "shinN" || frame === "shinF") {
    // the trousers end above the ankle: bare skin, then the sandal straps
    if (x > 6.4) return tone >= 2 ? C.dark : BLACK[0];
    return null;
  }
  if (frame === "footN" || frame === "footF") {
    // the toes peeking out of the sandal's front
    if (x > 3.2 && y < -0.2) return C.skin;
    return null;
  }
  return null;
}

// ---- heads: rows of characters, "." empty; pivot [col, row] sits on the head joint
const NARUTO_HEAD_PAL = {
  k: "#16121a", Y: "#fdd73a", y: "#f1ae22", o: "#c4801a", s: "#f9d3b4", S: "#e6a888", m: "#d2d2d8", M: "#8c8c96",
  d: "#3c3c48", D: "#26262e", w: "#ffffff", b: "#2f6fd0", r: "#c86a5a", n: "#6a4a3a", x: "#d99a80",
};
const NARUTO_HEAD = {
  sideR: {
    pivot: [11, 15],
    rows: [
      "........kk.........",
      "........kYk...k....",
      "....k...kYYkkkYk...",
      "...kYk.kyYYYYYYk...",
      "..kYYYkYYYyYYYYYkkk",
      "...kyYYYYYYYYYyYYk.",
      ".kkkYYYYYYYYYYYYYk.",
      ".kYYYYYYYYYyYYYYYYk",
      "..kYyYYyYYYYyYYkkk.",
      "..kYYyYYYYYYkkkkmmk",
      ".kYYyYyYYYkkdddkmMk",
      "..kdkkkkkdddddddkMk",
      ".kddkkkYYYYkkkkkkk.",
      "kdddk.kYYkssksssbk.",
      "kkk...kYYkssksssssk",
      "..kdk.kyYksssxxssk.",
      ".kdk..koYkSsssssrk.",
      ".kk....kkkSsssssk..",
      "..........kkkkkk...",
    ],
  },
  front: {
    pivot: [10,16],
    rows: [
      "........k....k......",
      "...k...kYk..kYk..k..",
      "...kYk.kYYkkYYk.kYk.",
      ".k.kYYkYYYYYYYYkYYk.",
      ".kYkYYYYYYYYYYYYYYk.",
      "kYYYYYYyYYYYYyYYYYYk",
      ".kYYYyYYYYYYYYYYyYYk",
      "kYYYkkkkkkkkkkkkYYYk",
      ".kYYkmmmmmmmmmmkYYYk",
      ".kYykmMmmkkmmMmkyYk.",
      "..kYkMMMMMMMMMMkYk..",
      ".kdkddddddddddddk...",
      "kddkYYsYssssYsYk....",
      ".kdkkkkksssskkkk....",
      "kdk.ksbwsssswbsk....",
      ".kk.kssssssssssk....",
      ".k..kxxssssssxxk....",
      ".....ksssrrsssk.....",
      "......kksssssskk....",
      "........kkkk........",
    ],
  },
  back: {
    pivot: [10, 16],
    rows: [
      ".........kk............",
      "...k....kYYk...k.......",
      "...kYk.kYYYk..kYk......",
      ".k.kYYkYYYYYkkYYk.k....",
      ".kYkYYYYYYYYYYYYkYk....",
      "kYYYYYYYYyYYYYYYYYk....",
      ".kYYyYYYYYYYYYyYYYYk...",
      "kYYYYYYYYYYYYYYYYYk....",
      ".kYYYYyYYYYYyYYYYYYk...",
      "kYYyYYYYYYYYYYYyYYk....",
      ".kyYYyYYoYYYYoYYyyk....",
      ".kddddddddddddddddk....",
      ".kddddddddddkDDkddddk..",
      "..kYyYYYyYYYkDDkdddddk.",
      ".kskYyYYYYYYYYYksk.kddk",
      "...kYoYYyYYYYoYk....kdk",
      "....kyYoYYyYYoYk.....kk",
      ".....kkyYYYyYkk........",
      ".......kkkkkk..........",
    ],
  },
};
// a second face on the same body, to prove the swap: dark swept hair, paler skin, dark eyes
const SECOND_HEAD_PAL = { ...NARUTO_HEAD_PAL, Y: "#3a3a5c", y: "#26263e", o: "#1a1a2a", s: "#f8dcc0", S: "#dcb498", b: "#1a1a24", n: "#f8dcc0" };

function compile(head, pal) {
  const Cc = Object.fromEntries(Object.entries(pal).map(([k, v]) => [k, H(v)]));
  const out = {};
  for (const [view, h] of Object.entries(head)) {
    const px = [];
    h.rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== "." && Cc[ch]) px.push([c - h.pivot[0], h.pivot[1] - r, Cc[ch]]); }));
    out[view] = px;
  }
  // the rig asks for "side" (facing right) by default
  out.side = out.sideR;
  return out;
}

export const OUTFITS = {
  naruto: { name: "naruto", parts: NARUTO_BODY, paint: narutoPaint, head: compile(NARUTO_HEAD, NARUTO_HEAD_PAL) },
  // the same outfit and animation, another face
  "naruto-face2": { name: "naruto-face2", parts: NARUTO_BODY, paint: narutoPaint, head: compile(NARUTO_HEAD, SECOND_HEAD_PAL) },
};

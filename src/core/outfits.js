// Outfits for the rig (rig.js): the same skeleton and animation, dressed. An outfit gives each body part a ramp of four
// tones (lit to dark) and, separately, a head: small pixel sprites for the views the rig can show (side, front, back),
// each with its pivot, stamped at the rig's head joint into the same depth buffer as the body, so a near arm or the collar
// in front still covers it. The body and the head are separate layers: swap the head and nothing else changes.
// Naruto's outfit after the four-view reference sheet: black upper jacket and sleeves, orange lower jacket and trousers,
// black sandals; spiky yellow hair, the Leaf headband (metal plate, dark cloth), blue eyes, whisker marks.
import { hex } from "./color.js";

const ramp = (...c) => c.map((v) => hex(v) >>> 0);
const ORANGE = ramp("#ffb24a", "#f7861c", "#cf620e", "#8c3a08");
const BLACK = ramp("#5a5a6a", "#3c3c4a", "#2a2a36", "#1a1a22");
const SKIN = ramp("#ffe2c4", "#f3c49d", "#d79e78", "#a46a4e");
const SANDAL = ramp("#4c4c5c", "#34343f", "#25252e", "#17171d");

// part numbers, as in rig.js
const P = { pelvis: 1, waist: 2, chest: 3, neck: 4, head: 5, face: 6, upperN: 7, elbowN: 8, foreN: 9, handN: 10, upperF: 11, elbowF: 12, foreF: 13, handF: 14, thighN: 15, kneeN: 16, shinN: 17, footN: 18, thighF: 19, kneeF: 20, shinF: 21, footF: 22 };

const NARUTO_BODY = {
  [P.pelvis]: ORANGE, [P.waist]: ORANGE, [P.chest]: BLACK, [P.neck]: BLACK,
  [P.upperN]: BLACK, [P.elbowN]: BLACK, [P.foreN]: BLACK, [P.handN]: SKIN,
  [P.upperF]: BLACK, [P.elbowF]: BLACK, [P.foreF]: BLACK, [P.handF]: SKIN,
  [P.thighN]: ORANGE, [P.kneeN]: ORANGE, [P.shinN]: ORANGE, [P.footN]: SANDAL,
  [P.thighF]: ORANGE, [P.kneeF]: ORANGE, [P.shinF]: ORANGE, [P.footF]: SANDAL,
};

// ---- heads: rows of characters, "." empty; pivot [col, row] sits on the head joint; side views face right
const NARUTO_HEAD_PAL = {
  k: "#1a1018", Y: "#ffd83a", y: "#e6a91a", o: "#b87a10", s: "#f6c9a0", S: "#d89c74", m: "#d2d6e2", M: "#8a8ea0",
  d: "#2a2a3c", D: "#1c1c28", b: "#2a6ad8", w: "#8a5640", r: "#a84848", W: "#ffffff",
};
const NARUTO_HEAD = {
  side: {
    pivot: [6, 8],
    rows: [
      ".....k..k.....",
      "..k.kYk.kYk...",
      ".kYkYYYkYYYk..",
      "kYYYYYYYYYYYk.",
      ".kYYYYYYYYYYYk",
      "kYYyYYYYYYYYk.",
      ".kyYYYYYYYYYYk",
      "kDdkyYmmmmmmmk",
      "kddkdMMMMMMMk.",
      ".kdkYysssssWk.",
      "..kkYyssssbsk.",
      "...kysssssssk.",
      "....ksswwsSk..",
      ".....ksssrk...",
      "......kkkk....",
    ],
  },
  front: {
    pivot: [6, 8],
    rows: [
      "...k.k.k.k...",
      "..kYkYkYkYk..",
      ".kYYYYYYYYYk.",
      "kYYYYYYYYYYYk",
      "kYYYYYYYYYYYk",
      "kYyYYYYYYYyYk",
      "kyddmmmmmmddk",
      "kddMMMkMMMddk",
      ".kYssssssssk.",
      ".kYsbWsWbsYk.",
      ".kysssssssyk.",
      "..kwssssswk..",
      "...ksrrrsk...",
      "....kkkkk....",
    ],
  },
  back: {
    pivot: [6, 8],
    rows: [
      "...k.k.k.k...",
      "..kYkYkYkYk..",
      ".kYYYYYYYYYk.",
      "kYYYYYYYYYYYk",
      "kYYYyYYYyYYYk",
      "kYYYYYYYYYYYk",
      "kyYYYYYYYYYyk",
      "kdddddDddddDk",
      "kyYYYYDYYYYyk",
      ".kYyYYYYYyYk.",
      ".kyYYyYyYYyk.",
      "..kyYYyYYyk..",
      "...kkkkkkk...",
    ],
  },
};
// a second face on the same body, to prove the swap: dark swept hair, paler skin, dark eyes
const SECOND_HEAD_PAL = { ...NARUTO_HEAD_PAL, Y: "#3a3a5c", y: "#26263e", o: "#1a1a2a", s: "#f8dcc0", S: "#dcb498", b: "#1a1a24", w: "#f8dcc0" };

function compile(head, pal) {
  const C = Object.fromEntries(Object.entries(pal).map(([k, v]) => [k, hex(v) >>> 0]));
  const out = {};
  for (const [view, h] of Object.entries(head)) {
    const px = [];
    h.rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== "." && C[ch]) px.push([c - h.pivot[0], h.pivot[1] - r, C[ch]]); }));
    out[view] = px;
  }
  return out;
}

export const OUTFITS = {
  naruto: { name: "naruto", parts: NARUTO_BODY, head: compile(NARUTO_HEAD, NARUTO_HEAD_PAL) },
  // the same outfit and animation, another face
  "naruto-face2": { name: "naruto-face2", parts: NARUTO_BODY, head: compile(NARUTO_HEAD, SECOND_HEAD_PAL) },
};

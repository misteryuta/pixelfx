// Jutsu clash: Raiton against Doton. Lightning beats earth: the rival drives a line of rock spears up out of the
// ground at the hero, the hero answers with a spear of lightning; it splits the rock at the front, holds, then shatters
// the whole line and runs on into the rival. From _clash.js.
import { buildClash } from "./_clash.js";

const C = buildClash({
  name: "Clash: Raiton vs Doton",
  desc: "A line of rock spears tears up toward the hero, his lightning spear meets it, splits it, then shatters the whole line and strikes the rival.",
  left: { kind: "lightning", from: "hands", label: "RAITON: RAIKOU", seals: ["u", "i", "tora"], aura: "lightning" },
  right: { kind: "earth", from: "ground", label: "DOTON: DORYUUSOU", seals: ["tora", "u", "inu"] },
  winner: "left",
  seed: 93,
  tags: ["lightning", "earth"],
});
export const meta = C.meta, act = C.act, create = C.create;

// Jutsu clash: Katon against Fuuton. Fire beats wind (Narutopedia: wind feeds a flame and makes it stronger): the hero's
// great fireball stream meets the rival's great breakthrough gale, the gale shoves the fire back a moment, then the fire
// drinks the wind in, swells, and rolls over the rival. From _clash.js.
import { buildClash } from "./_clash.js";

const C = buildClash({
  name: "Clash: Katon vs Fuuton",
  desc: "The hero's fire stream meets the rival's gale; the wind shoves it back, then feeds it, and the swollen fire rolls over the rival.",
  left: { kind: "fire", from: "mouth", label: "KATON: GOUKAKYUU", seals: ["mi", "hitsuji", "tora"], aura: "fire" },
  right: { kind: "wind", from: "hands", label: "FUUTON: DAITOPPA", seals: ["tora", "u", "inu"] },
  winner: "left",
  seed: 91,
  tags: ["fire", "wind"],
});
export const meta = C.meta, act = C.act, create = C.create;

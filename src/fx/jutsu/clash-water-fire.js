// Jutsu clash: Katon against Suiton. Water beats fire: the hero's fire stream meets the rival's torrent, the two boil
// into a wall of steam, the water drowns the flame and comes on through it to knock the hero off his feet. From _clash.js.
import { buildClash } from "./_clash.js";

const C = buildClash({
  name: "Clash: Katon vs Suiton",
  desc: "The hero's fire stream meets the rival's torrent in a boil of steam; the water drowns the fire and crashes through onto the hero.",
  left: { kind: "fire", from: "mouth", label: "KATON: GOUKAKYUU", seals: ["mi", "hitsuji", "tora"], aura: "fire" },
  right: { kind: "water", from: "hands", label: "SUITON: TEPPOUDAMA", seals: ["u", "mi", "tatsu"] },
  winner: "right",
  seed: 92,
  tags: ["fire", "water"],
});
export const meta = C.meta, act = C.act, create = C.create, camera = C.camera;

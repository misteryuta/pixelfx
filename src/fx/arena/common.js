// Shared impacts for the arena moves (2026-11-27): pixelfx library effects as the library draws them (palette-banded
// shading, particles, light), baked once and named cm_* so every move can use them. They are round or upward effects
// (a contact, a burst, a slam), so they read the same in all four directions; effects composed sideways (a breath, a
// jet) are rebuilt per move in its own frame instead.
import { lib, PALS } from "./_fx.js";
import { VOLT } from "../lightning/_lib.js";

export const MOVES = [];
export const FX = {
  zap: lib("lightning/zap-hit", { t: 0.8, fps: 18, options: { palette: VOLT } }),
  zapdark: lib("lightning/zap-hit", { t: 0.8, fps: 18, options: { palette: PALS.dark } }),
  splash: lib("water/splash", { t: 1.2, options: { palette: PALS.water, stone: false } }),
  spark: lib("impacts/hit-spark", { t: 0.5, fps: 20 }),
  sparkc: lib("impacts/hit-spark", { t: 0.5, fps: 20, options: { palette: ["#1a3a7a", "#2a5ab0", "#3a8ae0", "#6ab0f0", "#a8e0ff", "#d8f4ff", "#ffffff"] } }),
  blunt: lib("impacts/blunt-hit", { t: 0.7, fps: 18 }),
  explo: lib("explosions/small-explosion", { t: 1.4, fps: 10 }),
  explobig: lib("explosions/big-explosion", { t: 1.5, fps: 8 }),
  slam: lib("impacts/ground-slam", { t: 1.2, fps: 10 }),
  landing: lib("impacts/heavy-landing", { t: 1.0, fps: 15 }),
  geyser: lib("water/geyser", { t: 1.4, fps: 15, options: { palette: PALS.water } }),
};
export const PREFIX = "cm_";

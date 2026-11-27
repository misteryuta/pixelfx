// Small builders for the arena moves' look layers (see roster/summon/studio/PixelArenaMovesView.lua for the fields).
export const L = (book, at, phases, extra = {}) => ({ book, at, phases, ...extra });
// common phase groups
export const PRE = ["seal", "aim", "tell"];
export const AIMING = ["aim", "tell"];
export const hand = (book, phases = PRE, extra = {}) => L(book, "hand", phases, { lift: 30, handF: 1.4, ...extra });
export const atCaster = (book, phases, extra = {}) => L(book, "caster", phases, extra);
export const floorTell = (book, phases = ["tell"], extra = {}) => L(book, "caster", phases, { ground: true, rotate: true, ...extra });
export const aimRing = (book, phases = ["tell"], extra = {}) => L(book, "aim", phases, { ground: true, ...extra });
export const impact = (book, extra = {}) => L(book, "impact", null, { play: "once", lift: 0, ...extra });
export const proj = (book, extra = {}) => L(book, "proj", null, { rotate: true, lift: 30, ...extra });

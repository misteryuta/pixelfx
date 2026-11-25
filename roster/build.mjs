// Builds the game roster from the roster markdown + slots.mjs:
//   roster.json          the data (81 variants, 195 slots, factions, contact times)
//   ShinobiRoster.lua    ReplicatedStorage.ShinobiRoster (ModuleScript source)
//   titlesRoster.json    the viewer list (data4.mjs input), grouped by era + variant
//   STATUS.md            target/actual table
// node roster/build.mjs <roster.md>
import { readFileSync, writeFileSync } from "node:fs";
import { SLOTS } from "./slots.mjs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const MD = process.argv[2] ?? "C:/Users/yanni/Downloads/naruto_classic_and_shippuden_complete_roster.md";
const { loadEffect } = await import("file:///" + ROOT + "tools/lib/fxlib.mjs");
const { createAct } = await import("file:///" + ROOT + "src/core/index.js");
const manifest = JSON.parse(readFileSync(ROOT + "records/roblox4/manifest.json", "utf8"));

// ── parse the markdown ──────────────────────────────────────────────
const lines = readFileSync(MD, "utf8").split(/\r?\n/);
const strip = (s) => s.replace(/\*\*/g, "").trim();
const cells = (l) => l.split("|").slice(1, -1).map(strip);
let era = null, section = null, rarity = null;
const variants = [], ladders = { classic: [], shippuden: [] };
for (const l of lines) {
  if (/^# 1\./.test(l)) era = "classic";
  if (/^# 2\./.test(l)) era = "shippuden";
  if (/^# 3\./.test(l)) era = null;
  const h = l.match(/^## (.+)$/);
  if (h) {
    section = h[1];
    const r = section.match(/^(Legendary|Epic|Rare|Common \/ Classic|Classic \/ Common) Tier/);
    rarity = r ? (r[1].includes("Common") ? "Common" : r[1]) : null;
    continue;
  }
  if (!era || !l.startsWith("|") || /^\|\s*:?-/.test(l)) continue;
  const c = cells(l);
  if (section?.includes("Faction Ladder")) {
    if (c[0] === "Tier Rank") continue;
    const pool = c[2].split(/,\s*(?![^()]*\))/).map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = s.match(/^(.*)\((\d+)\)$/);
      return { label: m[1].trim(), ovr: +m[2] };
    });
    ladders[era].push({ tier: c[0], faction: c[1], pool });
  } else if (rarity) {
    if (c[0] === "Character") continue;
    variants.push({ era, rarity, cell: c[0], ovr: +c[1], moves: c.slice(2).filter(Boolean) });
  }
}

// ── factions: ladder entry "Name (form) (OVR)" ↔ variant by era + first word + OVR ─────
const first = (s) => s.split(/[\s(]/)[0];
for (const [e, ls] of Object.entries(ladders)) for (const [ti, L] of ls.entries()) for (const p of L.pool) {
  const hit = variants.filter((v) => v.era === e && v.ovr === p.ovr && first(v.cell) === first(p.label));
  if (hit.length !== 1) throw new Error(`ladder ${e} ${p.label} (${p.ovr}): ${hit.length} matches`);
  if (hit[0].faction) throw new Error("two factions for " + hit[0].cell);
  Object.assign(hit[0], { faction: L.faction, factionTier: ti + 1, tierName: L.tier });
}
for (const v of variants) if (!v.faction) throw new Error("no faction: " + v.cell);

// ── contact times from the clips: the baked frame on which each target hit lands ─────
const FPS = 20, timing = {};
// clips reworked after their last upload: the place plays the old version until the next upload round
// (2026-11-25: zabuza-suirou, kakashi-kamui, gaara-sabaku-sousou uploaded in round upload28; none open)
const REWORKED = []; // upload29 (2026-11-25): the Itachi reworks are in the place
async function clipTiming(key) {
  if (timing[key]) return timing[key];
  // the wall's element clips (RS.JutsuShowcaseData, 12 fps, own pipeline) have no roblox4 manifest entry
  const WALL = ["fire-phoenix-flower", "fire-great-fireball", "water-dragon", "water-hidden-mist", "fire-ash-burn", "lightning-hound", "lightning-chidori"];
  const fx = await loadEffect("jutsu/" + key);
  // not baked yet: timed as a 20 fps bake would be (duration + lead-in + hold)
  const e = manifest[key] ?? (WALL.includes(key) ? { fps: 12, frames: 0, wall: true } : { fps: FPS, frames: Math.round((fx.meta.duration + 0.25 + 0.4) * FPS), local: true });
  let hits = (fx.mod.act?.hits ?? []).filter((h) => h.target !== false && (h.stop || h.push || h.straw || h.flash));
  // self techniques (phasing, buffs) touch no target: their moments are the hits on the user
  if (!hits.length) hits = (fx.mod.act?.hits ?? []).filter((h) => h.stop || h.shake);
  const act = createAct(fx.mod, { x: 0, y: 0 });
  const ts = [act.t];
  if (e.wall) { while (!act.done() && ts.length < 400) { act.update(1 / 12); ts.push(act.t); } e.frames = ts.length + 4; }
  else for (let i = 0; i < e.frames - 1; i++) { act.update(1 / (e.fps ?? FPS)); ts.push(act.t); }
  const at = (t) => { const i = ts.findIndex((x) => x >= t - 1e-6); return (i < 0 ? ts.length - 1 : i) / (e.fps ?? FPS); };
  const contacts = hits.map((h) => +at(h.t).toFixed(3));
  const main = hits.length ? hits.reduce((a, b) => ((b.stop ?? 0) >= (a.stop ?? 0) ? b : a)) : null;
  return (timing[key] = { inPlace: !e.local, len: +(e.frames / (e.fps ?? FPS)).toFixed(3), contacts, main: main ? +at(main.t).toFixed(3) : +(e.frames / (e.fps ?? FPS) * 0.6).toFixed(3) });
}

// ── merge ──────────────────────────────────────────────────────────
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const seen = new Set();
for (const v of variants) {
  const k = v.era + "|" + v.cell, s = SLOTS[k];
  if (!s) throw new Error("no slots for " + k);
  seen.add(k);
  if (s.moves.length !== v.moves.length) throw new Error(`${k}: ${v.moves.length} moves in the file, ${s.moves.length} mapped`);
  const m = v.cell.match(/^(.*?)\s*\((.*)\)$/);
  Object.assign(v, { id: v.era + "/" + slug(v.cell), name: m ? m[1] : v.cell, form: m ? m[2] : "", desc: s.desc });
  v.slots = [];
  for (const [i, name] of v.moves.entries()) {
    const [clip, kind, status, note, params] = s.moves[i];
    const t = clip ? await clipTiming(clip) : null;
    const { inPlace, ...tt } = t ?? {};
    // a clip built but not in the place yet can't play there: the slot waits for the upload
    v.slots.push({ slot: i + 1, name, clip: clip && inPlace ? clip : null, pendingClip: clip && !inPlace ? clip : null, reworked: REWORKED.includes(clip), kind, status, note: note ?? "", params: params ?? null, ...tt });
  }
  delete v.moves;
}
for (const k of Object.keys(SLOTS)) if (!seen.has(k)) throw new Error("mapped but not in the file: " + k);

const count = (f) => variants.filter(f).length;
const slotsOf = (e) => variants.filter((v) => !e || v.era === e).flatMap((v) => v.slots);
const sum = { classic: count((v) => v.era === "classic"), shippuden: count((v) => v.era === "shippuden"), slotsClassic: slotsOf("classic").length, slotsShippuden: slotsOf("shippuden").length };
const byStatus = {};
for (const s of slotsOf()) byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
console.log(sum, byStatus);
if (sum.classic !== 26 || sum.shippuden !== 55 || sum.slotsClassic !== 65 || sum.slotsShippuden !== 130) throw new Error("counts differ from the file");

const factions = Object.fromEntries(Object.entries(ladders).map(([e, ls]) => [e, ls.map((L, i) => ({ tier: i + 1, tierName: L.tier, name: L.faction }))]));
writeFileSync(ROOT + "roster/roster.json", JSON.stringify({ source: MD.split(/[\\/]/).pop(), factions, variants }, null, 1));

// ── Lua module ─────────────────────────────────────────────────────
const q = (s) => JSON.stringify(s ?? "");
let lua = `-- GENERATED by pixelfx/roster/build.mjs from ${MD.split(/[\\/]/).pop()} — do not edit by hand.\n`;
lua += `-- Identity = era + full variant. slots: { slot, name, clip, kind, status, note, len, main, contacts }\n`;
lua += `-- status: ok = the clip shows this technique by this variant; actor = right technique, other/generic actor in the clip;\n-- partial = related clip only; new = no clip yet. Only "ok" counts as implemented.\nlocal R = { factions = {}, variants = {}, byId = {} }\n`;
for (const [e, fs] of Object.entries(factions)) lua += `R.factions.${e} = {${fs.map((f) => `{ tier = ${f.tier}, tierName = ${q(f.tierName)}, name = ${q(f.name)} }`).join(", ")}}\n`;
lua += `local function V(t) table.insert(R.variants, t); R.byId[t.id] = t end\n`;
for (const v of variants) {
  lua += `V({ id = ${q(v.id)}, era = ${q(v.era)}, cell = ${q(v.cell)}, name = ${q(v.name)}, form = ${q(v.form)}, ovr = ${v.ovr}, rarity = ${q(v.rarity)}, faction = ${q(v.faction)}, factionTier = ${v.factionTier}, desc = ${q(v.desc)}, slots = {\n`;
  for (const s of v.slots) lua += `\t{ slot = ${s.slot}, name = ${q(s.name)}, clip = ${s.clip ? q(s.clip) : "nil"}, pending = ${s.pendingClip ? q(s.pendingClip) : "nil"}, kind = ${q(s.kind)}, params = ${s.params ? "{ " + Object.entries(s.params).map(([k, v]) => k + " = " + JSON.stringify(v)).join(", ") + " }" : "nil"}, status = ${q(s.status)}, note = ${q(s.note)}, len = ${s.len ?? "nil"}, main = ${s.main ?? "nil"}, contacts = {${(s.contacts ?? []).join(", ")}} },\n`;
  lua += `} })\n`;
}
lua += "return R\n";
writeFileSync(ROOT + "roster/ShinobiRoster.lua", lua);

// ── viewer list: every slot that has a clip, grouped by era + variant ───────────
const RAR = { Legendary: [255, 205, 80], Epic: [200, 140, 255], Rare: [110, 180, 255], Common: [190, 200, 210] };
const titles = [];
for (const v of variants) for (const s of v.slots) if (s.clip) {
  const tag = s.status === "ok" ? "" : s.status === "actor" ? "  [ANWENDER OFFEN]" : "  [NUR VERWANDT]";
  titles.push([s.clip, `${v.era === "classic" ? "CLASSIC" : "SHIPPUDEN"} · ${v.cell.toUpperCase()}`, `${s.slot}. ${s.name.toUpperCase()}${tag}`, RAR[v.rarity]]);
}
writeFileSync(ROOT + "roster/titlesRoster.json", JSON.stringify(titles));

// ── status table ───────────────────────────────────────────────────
const LAB = { ok: "umgesetzt", actor: "Clip da, Anwender offen", partial: "nur verwandter Clip", new: "fehlt" };
let md = `# Roster-Abgleich (generiert)\n\nQuelle: \`${MD.split(/[\\/]/).pop()}\`\n\n`;
md += `| Bereich | Varianten | Slots | umgesetzt | Clip da, Anwender offen | nur verwandt | fehlt |\n|---|---:|---:|---:|---:|---:|---:|\n`;
for (const e of ["classic", "shippuden", null]) {
  const ss = slotsOf(e), c = (st) => ss.filter((s) => s.status === st).length;
  md += `| ${e ? (e === "classic" ? "Naruto Classic" : "Naruto Shippūden") : "**Gesamt**"} | ${e ? count((v) => v.era === e) : variants.length} | ${ss.length} | ${c("ok")} | ${c("actor")} | ${c("partial")} | ${c("new")} |\n`;
}
for (const e of ["classic", "shippuden"]) {
  md += `\n## ${e === "classic" ? "Classic" : "Shippūden"}\n\n| Variante | OVR | Rarität | Fraktion | Slot | Move | Clip | Stand | Notiz |\n|---|---:|---|---|---:|---|---|---|---|\n`;
  for (const v of variants.filter((x) => x.era === e)) for (const s of v.slots)
    md += `| ${s.slot === 1 ? v.cell : ""} | ${s.slot === 1 ? v.ovr : ""} | ${s.slot === 1 ? v.rarity : ""} | ${s.slot === 1 ? v.faction : ""} | ${s.slot} | ${s.name} | ${s.clip ? "`" + s.clip + "`" : s.pendingClip ? "`" + s.pendingClip + "` (gebaut, Upload offen)" : "–"}${s.reworked ? " (überarbeitet, Upload offen)" : ""} | ${LAB[s.status]} | ${s.note} |\n`;
}
writeFileSync(ROOT + "roster/STATUS.md", md);
console.log("viewer entries", titles.length);

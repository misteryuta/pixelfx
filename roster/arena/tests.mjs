// The arena moves' automatic playtest -> roster/summon/TESTS.md (between the ARENA markers) and the acceptance count.
// Input: roster/arena/results.txt, one line per move as the in-game runner exports it:
//   id=<rechts hit>,<rechts miss>,<links hit>,<links miss>,<unten hit>,<unten miss>,<oben hit>,<oben miss>|<turn>|<retarget>|<abort>
//   each entry: O<name> (as expected; name = who was hit), F<result> (not as expected), - (no such case)
// node roster/arena/tests.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const ROOT = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/";
const info = {};
for (const file of readdirSync(ROOT + "src/fx/arena").filter((x) => x.endsWith(".js") && !x.startsWith("_"))) {
  const A = await import("file:///" + ROOT + "src/fx/arena/" + file);
  for (const mv of A.MOVES ?? []) info[mv.id] = { variant: mv.variant, slot: mv.slot, mech: (mv.stages ?? [mv]).map((s) => s.mech).join(" → ") };
}
const roster = JSON.parse(readFileSync(ROOT + "roster/roster.json", "utf8"));
const V = (id) => roster.variants.find((x) => x.id === id);
const lines = readFileSync(ROOT + "roster/arena/results.txt", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"));
const show = (e, kind) => (!e || e === "-" ? "–" : e[0] === "O" ? (kind === "hit" ? "✓ " + (e.slice(1) || "") : "✓") : "**✗** " + e.slice(1));
let all4 = 0, open = [], runs = 0, okRuns = 0;
const rows = lines.map((l) => {
  const [id, rest] = l.split("=");
  const [dirs, turn, retarget, abort] = rest.split("|");
  const e = dirs.split(",");
  const I = info[id] ?? {}, v = V(I.variant);
  const names = ["rechts", "rechts", "links", "links", "unten", "unten", "oben", "oben"];
  e.forEach((x, i) => { if (x !== "-") { runs++; if (x[0] === "O") okRuns++; else open.push(`${v?.cell ?? I.variant} | ${v?.slots[I.slot - 1]?.name ?? id} | ${names[i]} | ${i % 2 ? "Fehlschlag-Fall" : "Treffer-Fall"}: Ergebnis „${x.slice(1) || "nichts"}“`); } });
  for (const [x, what] of [[turn, "Drehen vor dem Cast"], [retarget, "Zielwechsel in der Vorbereitung"], [abort, "Abbruch"]]) if (x && x !== "-") { runs++; if (x[0] === "O") okRuns++; else open.push(`${v?.cell ?? I.variant} | ${v?.slots[I.slot - 1]?.name ?? id} | rechts | ${what}: ${x.slice(1)}`); }
  if (e.every((x) => x === "-" || x[0] === "O")) all4++;
  return `| ${v?.cell ?? I.variant} | ${I.slot} | ${v?.slots[I.slot - 1]?.name ?? id} | ${I.mech} | ${[0, 2, 4, 6].map((i) => show(e[i], "hit") + " / " + show(e[i + 1], "miss")).join(" | ")} | ${show(abort, "x")} |`;
});
const section = `<!-- ARENA:BEGIN -->
## Eigene Fähigkeiten aller Varianten in vier Richtungen (automatischer Server-Playtest)

Bestand: Pixel BAS hat außer dem Training (PixelArena: Registry \`Defs\`/\`Roster\`, Slot-Eingabe 1–4 im Panel, Server-Cast-Handler \`PixelArenaServer\`) kein eigenes Kampfsystem. Der Shop führt die Signature-Moves je Variante nur als Namen (\`SignatureMoveData\`). Maßgeblich sind daher die 195 Roster-Slots: 181 als eigene Moves, 13 als Beschwörungen, offen ist 1 (Kurenai, Shippūden: Doppelungsregel, kein belegter Ersatz).

Jede Fähigkeit wird über ihren Slot ausgelöst, der Server entscheidet Treffer, Schaden und Zustände. Geprüft werden je Richtung (rechts, links, unten, oben) ein Treffer und ein Fehlschlag. Beim Fehlschlag weicht das Ziel beim Signal aus. Bei Abwehr-Moves wirft im Treffer-Fall die Puppe Kunai auf den Anwender, im Fehlschlag-Fall greift niemand an. Ein Buff oder eine Selbstheilung allein hat keinen Fehlschlag-Fall.

Zusätzlich prüft der Lauf zwei Sonderfälle an je einem Vertreter pro Mechanik: Drehen direkt vor dem Cast und einen Zielwechsel während der Vorbereitung. Bei jedem Move läuft außerdem ein Abbruch mitten in der Aktion. Danach dürfen kein Cast, kein festgehaltenes Ziel und keine Client-Ansicht übrig bleiben.

**Abnahme (Pixel BAS, ${new Date().toISOString().slice(0, 10)}):** ${all4} von ${lines.length} Fähigkeiten bestehen in allen vier Richtungen, ${okRuns} von ${runs} Läufen verhalten sich wie erwartet.

| Variante | Slot | Move | Ablauf (Server) | rechts | links | unten | oben | Abbruch |
|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}

Offene Fälle (Figur | Move | Richtung | beobachteter Fehler):
${open.length ? open.map((o) => "- " + o).join("\n") : "- keine"}

**Bildtests noch offen:** Pixel BAS zeigt im Spielmodus kein 3D-Bild, die Karte bleibt schwarz. Die Konsole meldet dazu „experience doesn't have access permission to use asset id …“, also fehlende Asset-Freigaben. vfx test erlaubt kein EditableImage (Game Settings > Security), deshalb zeigt es nur die Server-Logik und die DEBUG-Ansicht. Geprüft sind die gebackenen Blätter (\`records/summon/<figur>_sheet.png\`).
<!-- ARENA:END -->
`;
const f = ROOT + "roster/summon/TESTS.md";
let t = readFileSync(f, "utf8");
t = t.includes("<!-- ARENA:BEGIN -->") ? t.replace(/<!-- ARENA:BEGIN -->[\s\S]*<!-- ARENA:END -->\n?/, section) : t.replace("Weitere Prüfungen:", section + "\nWeitere Prüfungen:");
writeFileSync(f, t);
console.log("moves", lines.length, "all four", all4, "runs", runs, "ok", okRuns, "open", open.length);

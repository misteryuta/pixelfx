// Wraps the Pixel BAS test-ability module (TestAbilities + LiveData + the embedded pixel Packs) into PixelBAS.rbxmx in
// the running Studio's content folder; Studio loads it with game:GetObjects("rbxasset://models/_shinobi_tmp/PixelBAS.rbxmx").
// Packs come from roster/pixelbas/embed.mjs (roster/pixelbas/packs/<id>.json), split into StringValues P001, P002 ...
// node roster/pixelbas/push.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
const R = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/roster/";
const VER = process.argv[2] ?? "C:/Users/yanni/AppData/Local/Roblox/Versions/version-8d7a1009c17e4ff8";
const CHUNK = 190000;
const src = (p) => { const s = readFileSync(p, "utf8").replace(/\r\n/g, "\n"); if (s.includes("]]>")) throw new Error(p + " contains ]]>"); return s; };
let ref = 0;
const item = (cls, name, inner = "", props = "") => `<Item class="${cls}" referent="RBX${ref++}">\n<Properties>\n<string name="Name">${name}</string>\n${props}</Properties>\n${inner}</Item>\n`;
let packs = "";
for (const f of readdirSync(R + "pixelbas/packs").filter((x) => x.endsWith(".json"))) {
  const id = f.replace(/\.json$/, ""), j = JSON.parse(readFileSync(R + "pixelbas/packs/" + f, "utf8"));
  let books = "";
  for (const [book, p] of Object.entries(j)) {
    let parts = "";
    for (let i = 0, k = 1; i < p.b64.length; i += CHUNK, k++) parts += item("StringValue", "P" + String(k).padStart(3, "0"), "", `<string name="Value">${p.b64.slice(i, i + CHUNK)}</string>\n`);
    books += item("Folder", book, parts);
  }
  packs += item("Folder", id, books);
}
const xml = `<roblox version="4">\n` + item("ModuleScript", "TestAbilities",
  item("ModuleScript", "LiveData", "", `<ProtectedString name="Source"><![CDATA[${src(R + "studio/ShinobiLive.lua")}]]></ProtectedString>\n`) + item("Folder", "Packs", packs),
  `<ProtectedString name="Source"><![CDATA[${src(R + "pixelbas/TestAbilities.lua")}]]></ProtectedString>\n`) + `</roblox>\n`;
const dir = VER + "/content/models/_shinobi_tmp";
mkdirSync(dir, { recursive: true });
writeFileSync(dir + "/PixelBAS.rbxmx", xml);
console.log("written", xml.length);

// Wraps the roster game scripts into one rbxmx inside the running Studio's content folder, so Studio can load them with
// game:GetObjects("rbxasset://models/_shinobi_tmp/Roster.rbxmx") (no pasting big sources through tool calls).
// node roster/push.mjs [studioVersionDir]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const R = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/roster/";
const VER = process.argv[2] ?? "C:/Users/yanni/AppData/Local/Roblox/Versions/version-8d7a1009c17e4ff8";
const files = [
  ["ModuleScript", "ShinobiRoster", R + "ShinobiRoster.lua"],
  ["ModuleScript", "ShinobiRules", R + "studio/ShinobiRules.lua"],
  ["ModuleScript", "ShinobiSprites", R + "studio/ShinobiSprites.lua"],
  ["ModuleScript", "ShinobiBattleClient", R + "studio/ShinobiBattleClient.lua"],
  ["Script", "ShinobiBattleServer", R + "studio/ShinobiBattleServer.lua"],
  ["ModuleScript", "JutsuViewerData", R + "out/JutsuViewerData.lua"],
  ["LocalScript", "JutsuViewer", R + "studio/viewer.luau"],
];
let xml = `<roblox version="4">\n<Item class="Folder" referent="RBX0">\n<Properties>\n<string name="Name">Roster</string>\n</Properties>\n`;
files.forEach(([cls, name, path], i) => {
  const src = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  if (src.includes("]]>")) throw new Error(name + " contains ]]>");
  xml += `<Item class="${cls}" referent="RBX${i + 1}">\n<Properties>\n<string name="Name">${name}</string>\n<ProtectedString name="Source"><![CDATA[${src}]]></ProtectedString>\n</Properties>\n</Item>\n`;
});
xml += `</Item>\n</roblox>\n`;
const dir = VER + "/content/models/_shinobi_tmp";
mkdirSync(dir, { recursive: true });
writeFileSync(dir + "/Roster.rbxmx", xml);
console.log("written", xml.length, dir + "/Roster.rbxmx");

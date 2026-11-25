// Merge the partial bake in roblox29 into roblox4: manifest entries replaced, PNGs copied over.
import { readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
const R = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/records/";
const a = JSON.parse(readFileSync(R + "roblox4/manifest.json", "utf8")), b = JSON.parse(readFileSync(R + "roblox29/manifest.json", "utf8"));
for (const [k, v] of Object.entries(b)) a[k] = v;
writeFileSync(R + "roblox4/manifest.json", JSON.stringify(a, null, 1));
let n = 0;
for (const f of readdirSync(R + "roblox29")) if (f.endsWith(".png")) { copyFileSync(R + "roblox29/" + f, R + "roblox4/" + f); n++; }
console.log("merged", Object.keys(b).length, "entries,", n, "pngs; sheets to upload:", Object.values(b).reduce((s, e) => s + e.sheets.length, 0));

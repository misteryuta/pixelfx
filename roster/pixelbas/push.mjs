// Wraps the Pixel BAS test-ability modules into PixelBAS.rbxmx in the running Studio's content folder; Studio loads it
// with game:GetObjects("rbxasset://models/_shinobi_tmp/PixelBAS.rbxmx"). node roster/pixelbas/push.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const R = "C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/roster/";
const VER = process.argv[2] ?? "C:/Users/yanni/AppData/Local/Roblox/Versions/version-8d7a1009c17e4ff8";
const src = (p) => { const s = readFileSync(p, "utf8").replace(/\r\n/g, "\n"); if (s.includes("]]>")) throw new Error(p + " contains ]]>"); return s; };
const xml = `<roblox version="4">
<Item class="ModuleScript" referent="RBX0">
<Properties>
<string name="Name">TestAbilities</string>
<ProtectedString name="Source"><![CDATA[${src(R + "pixelbas/TestAbilities.lua")}]]></ProtectedString>
</Properties>
<Item class="ModuleScript" referent="RBX1">
<Properties>
<string name="Name">LiveData</string>
<ProtectedString name="Source"><![CDATA[${src(R + "studio/ShinobiLive.lua")}]]></ProtectedString>
</Properties>
</Item>
</Item>
</roblox>
`;
const dir = VER + "/content/models/_shinobi_tmp";
mkdirSync(dir, { recursive: true });
writeFileSync(dir + "/PixelBAS.rbxmx", xml);
console.log("written", xml.length);

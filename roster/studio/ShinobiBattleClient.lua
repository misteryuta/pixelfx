-- Roster battle, client side: choose era -> faction -> variant, see its loadout, fight a rival.
-- The server (ShinobiBattleServer) decides everything; this shows it: the techniques play as their baked clips on the
-- viewer's stage (mirrored when the rival casts), the HUD shows HP, chakra, cooldowns and every state, and short words
-- pop on the contact frames the server reports.
-- Battle.mount(stage, deps) -> api; deps: { playClip(key, done, {flip}), stopClip(), playSfx(tag), onOpen(open) }
local RS = game:GetService("ReplicatedStorage")
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local Roster = require(RS:WaitForChild("ShinobiRoster"))
local Rules = require(RS:WaitForChild("ShinobiRules"))
local remotes = RS:WaitForChild("ShinobiRemotes")
-- the variants' own fight sprites (atlases cut from the user's turnarounds); the rest use the arena's stock fighter
local SPRITES = RS:FindFirstChild("ShinobiSprites") and require(RS.ShinobiSprites) or {}
local LIVE = RS:FindFirstChild("ShinobiLive") and require(RS.ShinobiLive) or {}
local ContentProvider = game:GetService("ContentProvider")
local Fn, Ev = remotes:WaitForChild("Battle"), remotes:WaitForChild("Event")

local Battle = {}
local ATLAS = "rbxassetid://104168316280258"
local CW, CH, FX, FY, FPS = 76, 60, 26, 55, 15
local ROWS = { idle = { 0, 8, true }, walk = { 1, 6, true }, jab = { 3, 5 }, block = { 6, 2 }, hit = { 8, 5 }, down = { 9, 12 }, cast = { 10, 6 }, win = { 11, 7 } }
local RAR = { Legendary = Color3.fromRGB(255, 205, 80), Epic = Color3.fromRGB(200, 140, 255), Rare = Color3.fromRGB(110, 180, 255), Common = Color3.fromRGB(190, 200, 210) }
local STATUS = { ok = { "BEREIT", Color3.fromHex("#5ad07a") }, actor = { "ANWENDER OFFEN", Color3.fromHex("#e0b050") }, partial = { "NUR VERWANDT", Color3.fromHex("#e08a50") }, new = { "FEHLT", Color3.fromHex("#8a8eb0") } }
local WHY = { NO_CLIP = "NOCH KEINE ANIMATION", BUSY = "WIRKT NOCH", STAGE_BUSY = "WARTE", BOUND = "GEFESSELT", IN_GENJUTSU = "IM GENJUTSU  [B] KAI", SEALED = "VERSIEGELT", COOLDOWN = "ABKLINGZEIT", CHAKRA = "ZU WENIG CHAKRA", OUT_OF_RANGE = "ZU WEIT WEG", OVER = "KAMPF VORBEI", CANT_MOVE = "KANN SICH NICHT BEWEGEN", NO_KAI = "TSUKUYOMI LAESST SICH NICHT LOESEN", NO_GENJUTSU = "KEIN GENJUTSU" }
local RES = { phased = "DURCHDRUNGEN", blocked = "GEBLOCKT", absorbed = "ABGEFANGEN", healed = "GEHEILT" }
local C = { bg = Color3.fromHex("#0d0e1a"), panel = Color3.fromHex("#151729"), panel2 = Color3.fromHex("#1d2038"), line = Color3.fromHex("#2c3054"), text = Color3.fromHex("#e8e8f4"), dim = Color3.fromHex("#8a8eb0") }

local function new(class, props, parent)
	local o = Instance.new(class)
	for k, v in pairs(props) do o[k] = v end
	o.Parent = parent
	return o
end
local function corner(o, r) new("UICorner", { CornerRadius = UDim.new(0, r or 6) }, o) end
local function label(parent, props)
	local t = new("TextLabel", { BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, TextColor3 = C.text, TextXAlignment = Enum.TextXAlignment.Left, TextSize = 14 }, parent)
	for k, v in pairs(props) do t[k] = v end
	return t
end
local function button(parent, text, props)
	local b = new("TextButton", { BackgroundColor3 = C.panel2, AutoButtonColor = true, Font = Enum.Font.GothamBold, Text = text, TextColor3 = C.text, TextSize = 14, BorderSizePixel = 0 }, parent)
	corner(b, 6)
	for k, v in pairs(props or {}) do b[k] = v end
	return b
end
local function okCount(v)
	local n = 0
	for _, s in ipairs(v.slots) do if s.status == "ok" then n += 1 end end
	return n
end

function Battle.mount(stage, deps)
	local api = {}
	local era, faction, pick, rival, rivalMode = "classic", 1, nil, nil, false
	local battle = nil -- { me = variant, foe = variant, state = snap }
	local inputs = {}

	-- ── the selection screen ──────────────────────────────────────────
	-- the training ground fills the screen (deps.screen); the stage is only used for the old clip moves
	local holder = deps.screen or stage
	local root = new("Frame", { Name = "RosterBattle", Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.bg, BorderSizePixel = 0, ZIndex = 20, Visible = false, ClipsDescendants = true }, holder)
	corner(root, 10)
	local sel = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 21 }, root)
	label(sel, { Text = "ROSTER", Font = Enum.Font.Arcade, TextSize = 30, Size = UDim2.fromOffset(160, 34), Position = UDim2.fromOffset(14, 8), ZIndex = 22 })
	local tabs = {}
	for i, e in ipairs({ { "classic", "NARUTO CLASSIC" }, { "shippuden", "NARUTO SHIPPUDEN" } }) do
		local n = 0
		for _, v in ipairs(Roster.variants) do if v.era == e[1] then n += 1 end end
		tabs[e[1]] = button(sel, e[2] .. "  (" .. n .. ")", { Size = UDim2.fromOffset(200, 30), Position = UDim2.fromOffset(170 + (i - 1) * 208, 10), ZIndex = 22 })
	end
	local closeB = button(sel, "X", { Size = UDim2.fromOffset(30, 30), Position = UDim2.new(1, -40, 0, 10), ZIndex = 22 })
	local facCol = new("Frame", { Size = UDim2.new(0, 200, 1, -58), Position = UDim2.fromOffset(10, 50), BackgroundColor3 = C.panel, BorderSizePixel = 0, ZIndex = 21 }, sel)
	corner(facCol, 8)
	new("UIListLayout", { Padding = UDim.new(0, 4), SortOrder = Enum.SortOrder.LayoutOrder }, facCol)
	new("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingLeft = UDim.new(0, 6), PaddingRight = UDim.new(0, 6) }, facCol)
	local grid = new("ScrollingFrame", { Size = UDim2.new(1, -540, 1, -58), Position = UDim2.fromOffset(218, 50), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 6, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new(), ZIndex = 21 }, sel)
	new("UIGridLayout", { CellSize = UDim2.fromOffset(156, 96), CellPadding = UDim2.fromOffset(8, 8), SortOrder = Enum.SortOrder.LayoutOrder }, grid)
	local info = new("ScrollingFrame", { Size = UDim2.new(0, 310, 1, -58), Position = UDim2.new(1, -318, 0, 50), BackgroundColor3 = C.panel, BorderSizePixel = 0, ScrollBarThickness = 5, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new(), ZIndex = 21 }, sel)
	corner(info, 8)
	new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, info)
	new("UIPadding", { PaddingTop = UDim.new(0, 10), PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12) }, info)

	local function variantsOf(e, fi)
		local f = Roster.factions[e][fi]
		local out = {}
		for _, v in ipairs(Roster.variants) do if v.era == e and v.faction == f.name then table.insert(out, v) end end
		table.sort(out, function(a, b) return a.ovr > b.ovr end)
		return out
	end
	local renderInfo
	local function renderGrid()
		for e, b in pairs(tabs) do b.BackgroundColor3 = e == era and Color3.fromHex("#3a2a6a") or C.panel2 end
		for _, c in ipairs(facCol:GetChildren()) do if c:IsA("GuiButton") then c:Destroy() end end
		for i, f in ipairs(Roster.factions[era]) do
			local n = #variantsOf(era, i)
			local b = button(facCol, "", { Size = UDim2.new(1, 0, 0, 44), LayoutOrder = i, BackgroundColor3 = i == faction and Color3.fromHex("#2a2a50") or C.panel2, ZIndex = 22 })
			label(b, { Text = "TIER " .. f.tier .. "  ·  " .. f.tierName:gsub("^Tier %d+ ", ""), TextSize = 11, TextColor3 = C.dim, Size = UDim2.new(1, -12, 0, 16), Position = UDim2.fromOffset(8, 4), ZIndex = 23 })
			label(b, { Text = f.name .. "  (" .. n .. ")", Font = Enum.Font.GothamBold, TextSize = 14, Size = UDim2.new(1, -12, 0, 20), Position = UDim2.fromOffset(8, 20), ZIndex = 23 })
			b.MouseButton1Click:Connect(function() faction = i; renderGrid() end)
		end
		for _, c in ipairs(grid:GetChildren()) do if c:IsA("GuiButton") then c:Destroy() end end
		for i, v in ipairs(variantsOf(era, faction)) do
			local on = pick == v or (rival == v)
			local card = button(grid, "", { LayoutOrder = i, BackgroundColor3 = on and Color3.fromHex("#2c2a52") or C.panel2, ZIndex = 22, Name = v.id })
			new("Frame", { Size = UDim2.new(0, 4, 1, -12), Position = UDim2.fromOffset(6, 6), BackgroundColor3 = RAR[v.rarity], BorderSizePixel = 0, ZIndex = 23 }, card)
			label(card, { Text = tostring(v.ovr), Font = Enum.Font.Arcade, TextSize = 30, TextColor3 = RAR[v.rarity], Size = UDim2.fromOffset(50, 30), Position = UDim2.fromOffset(16, 4), ZIndex = 23 })
			label(card, { Text = v.rarity:upper(), TextSize = 10, TextColor3 = C.dim, Size = UDim2.fromOffset(80, 12), Position = UDim2.fromOffset(68, 10), ZIndex = 23 })
			label(card, { Text = v.name, Font = Enum.Font.GothamBold, TextSize = 13, TextTruncate = Enum.TextTruncate.AtEnd, Size = UDim2.new(1, -22, 0, 16), Position = UDim2.fromOffset(16, 38), ZIndex = 23 })
			label(card, { Text = v.form, TextSize = 10, TextColor3 = C.dim, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Size = UDim2.new(1, -22, 0, 24), Position = UDim2.fromOffset(16, 55), ZIndex = 23 })
			label(card, { Text = okCount(v) .. "/" .. #v.slots .. " Moves fertig", TextSize = 10, TextColor3 = okCount(v) == #v.slots and STATUS.ok[2] or C.dim, Size = UDim2.new(1, -22, 0, 12), Position = UDim2.new(0, 16, 1, -16), ZIndex = 23 })
			if rival == v then label(card, { Text = "GEGNER", Font = Enum.Font.GothamBlack, TextSize = 10, TextColor3 = Color3.fromHex("#ff8a4a"), Size = UDim2.fromOffset(60, 12), Position = UDim2.new(1, -62, 0, 8), ZIndex = 23 }) end
			card.MouseButton1Click:Connect(function()
				if rivalMode then rival, rivalMode = v, false else pick = v end
				renderGrid()
				renderInfo()
			end)
		end
	end
	renderInfo = function()
		for _, c in ipairs(info:GetChildren()) do if c:IsA("GuiObject") then c:Destroy() end end
		local v = pick
		if not v then
			label(info, { Text = "Waehle eine Figur.", TextColor3 = C.dim, Size = UDim2.new(1, 0, 0, 20), ZIndex = 22 })
			return
		end
		local o = 0
		local function L(props) o += 1; props.LayoutOrder = o; props.ZIndex = 22; props.TextWrapped = true; props.AutomaticSize = Enum.AutomaticSize.Y; props.Size = props.Size or UDim2.new(1, 0, 0, 0); return label(info, props) end
		L({ Text = (v.era == "classic" and "NARUTO CLASSIC" or "NARUTO SHIPPUDEN") .. "  ·  " .. v.faction, TextSize = 11, TextColor3 = C.dim })
		L({ Text = v.name, Font = Enum.Font.GothamBlack, TextSize = 20 })
		L({ Text = v.form, TextSize = 13, TextColor3 = C.dim })
		L({ Text = "OVR " .. v.ovr .. "   ·   " .. v.rarity .. "   ·   " .. #v.slots .. " Signature Moves", Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = RAR[v.rarity] })
		if v.desc ~= "" then L({ Text = v.desc, TextSize = 12, TextColor3 = C.dim }) end
		for _, s in ipairs(v.slots) do
			o += 1
			local st = STATUS[s.status]
			local box = new("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundColor3 = C.panel2, BorderSizePixel = 0, LayoutOrder = o, ZIndex = 22 }, info)
			corner(box, 6)
			new("UIListLayout", { Padding = UDim.new(0, 2), SortOrder = Enum.SortOrder.LayoutOrder }, box)
			new("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6), PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8) }, box)
			label(box, { Text = s.slot .. ".  " .. s.name, Font = Enum.Font.GothamBold, TextSize = 13, TextWrapped = true, AutomaticSize = Enum.AutomaticSize.Y, Size = UDim2.new(1, 0, 0, 0), LayoutOrder = 1, ZIndex = 23 })
			label(box, { Text = Rules.KINDS[s.kind].label .. "  ·  " .. Rules.KINDS[s.kind].cost .. " Chakra  ·  " .. st[1], TextSize = 11, TextColor3 = st[2], Size = UDim2.new(1, 0, 0, 14), LayoutOrder = 2, ZIndex = 23 })
			if s.note ~= "" then label(box, { Text = s.note, TextSize = 11, TextColor3 = C.dim, TextWrapped = true, AutomaticSize = Enum.AutomaticSize.Y, Size = UDim2.new(1, 0, 0, 0), LayoutOrder = 3, ZIndex = 23 }) end
		end
		o += 1
		local rb = button(info, rivalMode and "GEGNER: KARTE ANKLICKEN ..." or ("GEGNER: " .. (rival and (rival.name .. " (" .. rival.ovr .. ")") or "ZUFALL")), { Size = UDim2.new(1, 0, 0, 32), LayoutOrder = o, ZIndex = 22 })
		rb.MouseButton1Click:Connect(function()
			if rival and not rivalMode then rival = nil else rivalMode = not rivalMode end
			renderInfo(); renderGrid()
		end)
		o += 1
		local fb = button(info, "KAMPF  >", { Size = UDim2.new(1, 0, 0, 40), LayoutOrder = o, ZIndex = 22, BackgroundColor3 = Color3.fromHex("#4a2a18"), TextColor3 = Color3.fromHex("#ffd8a0"), TextSize = 16 })
		fb.MouseButton1Click:Connect(function() api.select(v.id, rival and rival.id or nil) end)
	end
	for e, b in pairs(tabs) do b.MouseButton1Click:Connect(function() era, faction, rivalMode = e, 1, false; if pick and pick.era ~= e then pick = nil end; if rival and rival.era ~= e then rival = nil end; renderGrid(); renderInfo() end) end

	-- ── the fight: the idle scene, the HUD ───────────────────────────
	local scene = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 21, Visible = false }, root)
	new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromHex("#2a2148"), Color3.fromHex("#0c0c18")) }, root)
	local floorL = new("Frame", { BackgroundColor3 = Color3.fromHex("#3a3460"), BorderSizePixel = 0, ZIndex = 21 }, scene)
	local hud = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 40, Visible = false }, holder)
	local function sideBar(alignRight)
		local f = new("Frame", { Size = UDim2.new(0.42, 0, 0, 74), Position = alignRight and UDim2.new(1, -12, 0, 10) or UDim2.fromOffset(12, 10), AnchorPoint = Vector2.new(alignRight and 1 or 0, 0), BackgroundTransparency = 1, ZIndex = 41 }, hud)
		local xa = alignRight and Enum.TextXAlignment.Right or Enum.TextXAlignment.Left
		local name = label(f, { Text = "", Font = Enum.Font.GothamBlack, TextSize = 15, TextXAlignment = xa, TextStrokeTransparency = 0.5, Size = UDim2.new(1, 0, 0, 18), ZIndex = 42 })
		local hpB = new("Frame", { Size = UDim2.new(1, 0, 0, 14), Position = UDim2.fromOffset(0, 20), BackgroundColor3 = Color3.fromHex("#1a1a2a"), BorderSizePixel = 0, ZIndex = 41 }, f)
		corner(hpB, 4)
		local hp = new("Frame", { Size = UDim2.fromScale(1, 1), AnchorPoint = Vector2.new(alignRight and 1 or 0, 0), Position = UDim2.fromScale(alignRight and 1 or 0, 0), BackgroundColor3 = alignRight and Color3.fromHex("#ff8a4a") or Color3.fromHex("#7ae07a"), BorderSizePixel = 0, ZIndex = 42 }, hpB)
		corner(hp, 4)
		local hpT = label(hpB, { Text = "", Font = Enum.Font.Code, TextSize = 11, TextXAlignment = Enum.TextXAlignment.Center, Size = UDim2.fromScale(1, 1), ZIndex = 43, TextStrokeTransparency = 0.3 })
		local ckB = new("Frame", { Size = UDim2.new(0.6, 0, 0, 6), Position = UDim2.new(alignRight and 0.4 or 0, 0, 0, 37), BackgroundColor3 = Color3.fromHex("#1a1a2a"), BorderSizePixel = 0, ZIndex = 41 }, f)
		local ck = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromHex("#5ab0ff"), BorderSizePixel = 0, ZIndex = 42 }, ckB)
		local chips = label(f, { Text = "", Font = Enum.Font.GothamBlack, TextSize = 11, TextColor3 = Color3.fromHex("#ffd040"), TextXAlignment = xa, TextStrokeTransparency = 0.4, Size = UDim2.new(1, 0, 0, 14), Position = UDim2.fromOffset(0, 48), ZIndex = 42 })
		return { name = name, hp = hp, hpT = hpT, ck = ck, chips = chips }
	end
	local barMe, barFoe = sideBar(false), sideBar(true)
	local msg = label(hud, { Text = "", Font = Enum.Font.Arcade, TextSize = 28, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.3, Size = UDim2.new(1, 0, 0, 34), Position = UDim2.fromScale(0, 0.2), ZIndex = 45 })
	local msgT = 0
	local slotRow = new("Frame", { Size = UDim2.new(1, -24, 0, 56), Position = UDim2.new(0, 12, 1, -64), BackgroundTransparency = 1, ZIndex = 41 }, hud)
	new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }, slotRow)
	label(hud, { Text = "1-4 Jutsu   J Schlag   A/D Schritt   B Kai (Genjutsu loesen, 25 Chakra)   ESC Aufgeben", TextSize = 11, TextColor3 = C.dim, TextStrokeTransparency = 0.6, TextXAlignment = Enum.TextXAlignment.Center, Size = UDim2.new(1, 0, 0, 14), Position = UDim2.new(0, 0, 1, -80), ZIndex = 41 })
	local slotBtns = {}
	local pops = {}

	local function say(text, color, t)
		msg.Text, msg.TextColor3, msgT = text, color or Color3.new(1, 1, 1), t or 1.1
	end
	local function popAt(side, text, color)
		local x = side == "me" and 0.3 or 0.7
		local l = label(hud, { Text = text, Font = Enum.Font.Arcade, TextSize = 24, TextColor3 = color or Color3.new(1, 1, 1), TextStrokeTransparency = 0.2, TextXAlignment = Enum.TextXAlignment.Center, Size = UDim2.fromOffset(260, 28), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(x, 0.45), ZIndex = 46 })
		table.insert(pops, { l = l, t = 0, x = x })
	end

	-- the two fighters of the idle scene (the arena's sprite atlas; the rival mirrored and tinted)
	local STOCK = { image = ATLAS, cw = CW, ch = CH, fx = FX, fy = FY, rows = ROWS }
	local function sprite(rival)
		local img = new("ImageLabel", { BackgroundTransparency = 1, Image = ATLAS, ImageRectSize = Vector2.new(CW, CH), ResampleMode = Enum.ResamplerMode.Pixelated, ZIndex = rival and 23 or 24 }, scene)
		local tag = label(scene, { Text = "", Font = Enum.Font.GothamBold, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.4, Size = UDim2.fromOffset(200, 14), AnchorPoint = Vector2.new(0.5, 1), ZIndex = 25 })
		local aura = new("Frame", { BackgroundTransparency = 0.6, BorderSizePixel = 0, ZIndex = 22, Visible = false }, scene)
		corner(aura, 999)
		return { img = img, tag = tag, aura = aura, state = "idle", t = 0, cfg = STOCK, rival = rival }
	end
	-- a variant's own sprite if it has one; the stock fighter (the rival tinted) otherwise
	local function dress(sp, v)
		sp.cfg = SPRITES[v.id] or STOCK
		sp.img.Image = sp.cfg.image
		sp.img.ImageColor3 = (sp.cfg == STOCK and sp.rival) and Color3.fromRGB(255, 170, 120) or Color3.new(1, 1, 1)
	end
	local spMe, spFoe = sprite(false), sprite(true)
	-- the game camera: one side view, whole-pixel scale, following the middle of the two fighters smoothly; no cuts,
	-- no zoom. Tall enough for a Complete Body Susanoo (about 300 px) over the floor.
	local S, GY, camX = 3, 200, 220
	local function toScreen(x, y) return root.AbsoluteSize.X / 2 + (x - camX) * S, GY + y * S end
	local function layoutScene()
		local W, H = root.AbsoluteSize.X, root.AbsoluteSize.Y
		S = math.max(2, math.min(math.floor(H / 330), math.floor(W / 300)))
		GY = math.floor(H * 0.82)
		floorL.Size = UDim2.new(1, 0, 0, 2)
		floorL.Position = UDim2.fromOffset(0, GY)
		for _, sp in ipairs({ spMe, spFoe }) do sp.img.Size = UDim2.fromOffset(sp.cfg.cw * S, sp.cfg.ch * S) end
	end
	root:GetPropertyChangedSignal("AbsoluteSize"):Connect(layoutScene)
	local AURA = { bound = Color3.fromHex("#3a6aff"), illusion = Color3.fromHex("#c040ff"), sealed = Color3.fromHex("#ffcc40"), shield = Color3.fromHex("#80e0ff"), intangible = Color3.fromHex("#e0e0ff"), transformed = Color3.fromHex("#ff6030"), buff = Color3.fromHex("#ff9a40"), summon = Color3.fromHex("#a0ff80") }
	local function drawFighter(sp, f)
		if not f then return end
		local c = sp.cfg
		local row = c.rows[sp.state] or c.rows.idle
		local n = math.floor(sp.t * FPS)
		if row[3] then n = n % row[2] else n = math.min(n, row[2] - 1) end
		local flip = f.face < 0
		sp.img.ImageRectOffset = Vector2.new(n * c.cw + (flip and c.cw or 0), row[1] * c.ch)
		sp.img.ImageRectSize = Vector2.new(flip and -c.cw or c.cw, c.ch)
		local sx = toScreen(f.x, 0)
		sp.img.Position = UDim2.fromOffset(math.floor(sx - (flip and (c.cw - c.fx) or c.fx) * S), GY - c.fy * S)
		sp.img.ImageTransparency = f.st.intangible and 0.55 or 0
		-- hidden while his live move draws him (the actor layer has him in it)
		sp.img.Visible = not sp.hidden
		sp.tag.Position = UDim2.fromOffset(sx, GY - 80 * S)
		local aura = nil
		for k, c in pairs(AURA) do if f.st[k] then aura = c end end
		sp.aura.Visible = aura ~= nil
		if aura then
			sp.aura.BackgroundColor3 = aura
			sp.aura.Size = UDim2.fromOffset(30 * S, 46 * S)
			sp.aura.Position = UDim2.fromOffset(math.floor(sx - 15 * S), GY - 46 * S)
		end
	end
	local function setAnim(sp, s) if sp.state ~= s then sp.state, sp.t = s, 0 end end

	local function chipText(st)
		local out = {}
		for k, left in pairs(st) do if Rules.STATES[k] then table.insert(out, Rules.STATES[k] .. " " .. string.format("%.1f", left)) end end
		table.sort(out)
		return table.concat(out, "  ")
	end
	local function renderHud()
		if not battle or not battle.state then return end
		local s = battle.state
		for _, pair in ipairs({ { barMe, s.me, battle.me }, { barFoe, s.foe, battle.foe } }) do
			local b, f, v = pair[1], pair[2], pair[3]
			b.name.Text = v.name .. "  ·  " .. v.form .. "  ·  " .. v.ovr
			b.hp.Size = UDim2.fromScale(math.clamp(f.hp / f.maxHp, 0, 1), 1)
			b.hpT.Text = f.hp .. " / " .. f.maxHp
			b.ck.Size = UDim2.fromScale(math.clamp(f.ck / Rules.CK_MAX, 0, 1), 1)
			b.chips.Text = chipText(f.st)
		end
		for i, sb in ipairs(slotBtns) do
			local sl = battle.me.slots[i]
			local cd = s.me.cd[i]
			local k = Rules.KINDS[sl.kind]
			local can = (sl.clip ~= nil or (sl.params ~= nil and sl.params.live ~= nil and LIVE[sl.params.live] ~= nil)) and not cd and s.me.ck >= k.cost and not s.stageBusy and not s.me.st.bound and not s.me.st.sealed and not s.me.st.illusion
			sb.b.BackgroundColor3 = can and C.panel2 or Color3.fromHex("#121322")
			sb.cd.Text = cd and string.format("%.1f", cd) or ""
		end
		spMe.tag.Text, spFoe.tag.Text = battle.me.name, battle.foe.name
	end
	local function buildSlots()
		for _, c in ipairs(slotRow:GetChildren()) do if c:IsA("GuiObject") then c:Destroy() end end
		slotBtns = {}
		for i, s in ipairs(battle.me.slots) do
			local st = STATUS[s.status]
			local b = button(slotRow, "", { Size = UDim2.new(0.25, -6, 1, 0), ZIndex = 42 })
			label(b, { Text = i .. "  " .. s.name, Font = Enum.Font.GothamBold, TextSize = 12, TextTruncate = Enum.TextTruncate.AtEnd, Size = UDim2.new(1, -12, 0, 18), Position = UDim2.fromOffset(8, 6), ZIndex = 43 })
			label(b, { Text = Rules.KINDS[s.kind].label .. " · " .. Rules.KINDS[s.kind].cost .. " CK" .. (s.status ~= "ok" and ("  ·  " .. st[1]) or ""), TextSize = 10, TextColor3 = s.status == "ok" and C.dim or st[2], Size = UDim2.new(1, -12, 0, 14), Position = UDim2.fromOffset(8, 28), ZIndex = 43 })
			local cd = label(b, { Text = "", Font = Enum.Font.Arcade, TextSize = 20, TextXAlignment = Enum.TextXAlignment.Right, Size = UDim2.new(1, -8, 1, 0), ZIndex = 44, TextColor3 = Color3.fromHex("#ffd040") })
			b.MouseButton1Click:Connect(function() api.cast(i) end)
			slotBtns[i] = { b = b, cd = cd }
		end
	end

	-- ── live moves on the training ground ─────────────────────────────
	-- A live move is drawn here as it happens: the actor layer (the user and his Susanoo) frame by frame from its
	-- atlas at the caster's spot, runtime flipbooks at anchors or at the contact the server reports, projectiles flying
	-- on their own, the guard's reaction where a blocked hit meets it. Its clock starts when its sheets are loaded
	-- ("go"), the server's clock with it.
	local lives, books, projs = {}, {}, {}
	local ANSWER = { ["sasuke-susanoo-arrow-summit"] = Color3.fromHex("#a8f0c0"), ["madara-perfect-susanoo"] = Color3.fromHex("#4aa0ff") }
	local function liveIdOf(def) for k, d in pairs(LIVE) do if d == def then return k end end return nil end
	local function bookImg(z) return new("ImageLabel", { BackgroundTransparency = 1, ResampleMode = Enum.ResamplerMode.Pixelated, ZIndex = z }, scene) end
	local function placeBook(img, book, frame, x, y, face)
		local idx = frame - 1
		for _, sh in ipairs(book.sheets) do
			if idx < sh.n then img.Image = sh.id; break end
			idx -= sh.n
		end
		local col, row, flip = idx % book.cols, math.floor(idx / book.cols), face < 0
		img.ImageRectOffset = Vector2.new(col * book.cw + (flip and book.cw or 0), row * book.ch)
		img.ImageRectSize = Vector2.new(flip and -book.cw or book.cw, book.ch)
		img.Size = UDim2.fromOffset(book.cw * S, book.ch * S)
		local sx, sy = toScreen(x, y)
		img.Position = UDim2.fromOffset(math.floor(sx - (flip and (book.cw - book.pivot[1]) or book.pivot[1]) * S), math.floor(sy - book.pivot[2] * S))
	end
	local function preloadDef(def)
		local list = {}
		for _, sh in ipairs(def.actor.sheets) do local l = Instance.new("ImageLabel"); l.Image = sh.id; table.insert(list, l) end
		for _, b in pairs(def.fx) do for _, sh in ipairs(b.sheets) do local l = Instance.new("ImageLabel"); l.Image = sh.id; table.insert(list, l) end end
		ContentProvider:PreloadAsync(list)
	end
	local function spawnBook(book, x, y, face, opts)
		local img = bookImg(opts and opts.z or 27)
		if opts and opts.tint then img.ImageColor3 = opts.tint end
		local b = { book = book, img = img, t = 0, x = x, y = y, face = face, vx = opts and opts.vx or 0, life = opts and opts.life }
		placeBook(img, book, 1, x, y, face)
		table.insert(books, b)
		return b
	end
	local function anchorOf(L, name)
		if not L or not L.t0 then return nil end
		local fr = math.clamp(math.floor((os.clock() - L.t0) * L.def.fps) + 1, 1, #L.def.actor.anchors)
		local a = L.def.actor.anchors[fr][name]
		return a and { L.x0 + L.face * a[1], a[2] } or nil
	end
	-- the guard of whoever was struck reacts where the blow met it (Yata: a ripple in the answering nature's colour)
	local function guardReact(tgtSide, attackerId)
		for _, L in pairs(lives) do
			if L.by == tgtSide and L.def.onBlock then
				local at = anchorOf(L, L.def.onBlock.at)
				if at then spawnBook(L.def.fx[L.def.onBlock.fx], at[1], at[2], L.face, { z = 29, tint = ANSWER[attackerId or ""] or Color3.fromHex("#4aa0ff") }) end
			end
		end
	end
	local function startLive(info)
		local def = LIVE[info.live]
		if not def then return end
		local sp = info.by == "me" and spMe or spFoe
		local L = { def = def, id = info.live, by = info.by, x0 = info.x0, face = info.face, seq = info.seq, img = bookImg(24), done = {}, sfx = {} }
		L.img.Visible = false
		lives[info.seq] = L
		task.spawn(function()
			preloadDef(def)
			if lives[info.seq] ~= L then return end
			pcall(function() Fn:InvokeServer("go", { seq = info.seq }) end)
			L.t0 = os.clock()
			L.img.Visible = true
			sp.hidden = true
		end)
	end
	local function endLive(seq)
		local L = lives[seq]
		if not L then return end
		L.img:Destroy()
		lives[seq] = nil
		local sp = L.by == "me" and spMe or spFoe
		sp.hidden = false
	end
	local function clearLive()
		for seq in pairs(lives) do endLive(seq) end
		for _, b in ipairs(books) do b.img:Destroy() end
		for _, p in pairs(projs) do p.img:Destroy() end
		books, projs = {}, {}
	end
	local function stepLive(dt)
		for seq, L in pairs(lives) do
			if L.t0 then
				local age = os.clock() - L.t0
				local fr = math.min(L.def.actor.frames, math.floor(age * L.def.fps) + 1)
				placeBook(L.img, L.def.actor, fr, L.x0, 0, L.face)
				for i, e in ipairs(L.def.sfx) do if not L.sfx[i] and age >= e[1] then L.sfx[i] = true; deps.playSfx(e[2]) end end
				for i, sp in ipairs(L.def.spawns) do
					if not L.done[i] and age >= sp.t and not sp.projectile then
						if string.sub(sp.at, 1, 7) == "contact" then
							if L.contact then
								L.done[i] = true
								local ground = string.find(sp.at, "ground") ~= nil
								spawnBook(L.def.fx[sp.fx], L.contact, ground and 0 or -26, L.face, { vx = sp.vx, life = sp.life, z = 28 })
							end
						else
							L.done[i] = true
							local at = anchorOf(L, sp.anchor or "")
							if at then spawnBook(L.def.fx[sp.fx], at[1], at[2], L.face, { vx = sp.vx, life = sp.life, z = 28 }) end
						end
					end
				end
				if age > L.def.len + 0.1 then endLive(seq) end
			end
		end
		for i = #books, 1, -1 do
			local b = books[i]
			b.t += dt
			b.x += b.vx * b.face * dt
			local n = math.floor(b.t * 20)
			local over = (b.life and b.t > b.life) or (not b.book.loop and n >= b.book.frames)
			if over then b.img:Destroy(); table.remove(books, i)
			else placeBook(b.img, b.book, b.book.loop and (n % b.book.frames) + 1 or n + 1, b.x, b.y, b.face) end
		end
		for _, p in pairs(projs) do
			p.t += dt
			p.x += p.vx * dt
			placeBook(p.img, p.book, (math.floor(p.t * 20) % p.book.frames) + 1, p.x, p.y, p.vx >= 0 and 1 or -1)
		end
	end

	-- ── server traffic ───────────────────────────────────────────────
	local playing = nil -- the clip on stage: { seq, by }
	local queue = {}
	local function showScene(on)
		root.Visible = on or not battle
		scene.Visible = battle ~= nil
		sel.Visible = battle == nil
	end
	local function playNext()
		if playing or #queue == 0 then return end
		local info = table.remove(queue, 1)
		playing = info
		showScene(false)
		deps.playClip(info.clip, function()
			if playing == info then playing = nil end
			if battle then showScene(true) end
			playNext()
		end, { flip = info.by == "foe", onStart = function() pcall(function() Fn:InvokeServer("go", { seq = info.seq }) end) end })
	end
	local function onEvent(ev, state)
		if ev.type == "reset" then
			api.close(true)
			return
		end
		if not battle then return end
		if state then battle.state = state end
		if ev.type == "cast" and ev.info.live then
			startLive(ev.info)
		elseif ev.type == "cast" then
			table.insert(queue, ev.info)
			if ev.info.by == "me" then setAnim(spMe, "cast") else setAnim(spFoe, "cast") end
			playNext()
		elseif ev.type == "impact" then
			local tgt = ev.by == "me" and "foe" or "me"
			if ev.state == "healed" then popAt(ev.by, "GEHEILT", Color3.fromHex("#7ae07a"))
			elseif ev.state == "released" then popAt(tgt, "FREI", Color3.fromHex("#a8e0ff"))
			elseif ev.state and Rules.STATES[ev.state == "intangible" and "intangible" or ev.state] then
				local selfState = ev.state == "shield" or ev.state == "intangible" or ev.state == "transformed" or ev.state == "buff" or ev.state == "summon"
				popAt(selfState and ev.by or tgt, Rules.STATES[ev.state], AURA[ev.state])
			elseif ev.state == "teleported" then popAt(ev.by, "TELEPORT", Color3.fromHex("#ffe080"))
			end
			if RES[ev.result] then popAt(tgt, RES[ev.result], Color3.fromHex("#e0e0ff"))
			elseif ev.dmg and ev.dmg > 0 then popAt(tgt, "-" .. ev.dmg, Color3.fromHex("#ff6a5a")) end
			if ev.kind == "taijutsu" then
				local sp = tgt == "me" and spMe or spFoe
				setAnim(sp, ev.result == "hit" and "hit" or "block")
				deps.playSfx(ev.result == "hit" and "punch" or "block")
			end
		elseif ev.type == "liveHit" or ev.type == "liveMiss" then
			local L = lives[ev.seq]
			if L and not L.contact then L.contact = ev.x end
			local tgt = ev.by == "me" and "foe" or "me"
			if ev.type == "liveMiss" then popAt(tgt, "VERFEHLT", Color3.fromHex("#c0c4e0"))
			else
				if ev.result == "blocked" then guardReact(tgt, L and L.id) end
				if RES[ev.result] then popAt(tgt, RES[ev.result], Color3.fromHex("#e0e0ff")) elseif (ev.dmg or 0) > 0 then popAt(tgt, "-" .. ev.dmg, Color3.fromHex("#ff6a5a")) end
				if ev.result == "hit" then setAnim(tgt == "me" and spMe or spFoe, "hit") end
			end
		elseif ev.type == "proj" then
			local L = lives[ev.seq]
			local def = L and L.def
			if def and def.fx[ev.name] then projs[ev.seq] = { img = bookImg(28), book = def.fx[ev.name], x = ev.x, y = ev.y, vx = ev.vx, t = 0, def = def, id = L.id } end
		elseif ev.type == "projEnd" then
			local p = projs[ev.seq]
			local tgt = ev.by == "me" and "foe" or "me"
			if p then
				p.img:Destroy()
				projs[ev.seq] = nil
				if ev.result ~= "expired" and p.def.onHit then spawnBook(p.def.fx[p.def.onHit.fx], ev.x, p.y, 1, { z = 29 }) end
				if ev.result == "blocked" then guardReact(tgt, p.id) end
			end
			if ev.result == "expired" then popAt(tgt, "VERFEHLT", Color3.fromHex("#c0c4e0"))
			elseif RES[ev.result] then popAt(tgt, RES[ev.result], Color3.fromHex("#e0e0ff"))
			elseif (ev.dmg or 0) > 0 then popAt(tgt, "-" .. ev.dmg, Color3.fromHex("#ff6a5a")); setAnim(tgt == "me" and spMe or spFoe, "hit") end
		elseif ev.type == "move" then
			setAnim(ev.by == "me" and spMe or spFoe, "walk")
		elseif ev.type == "strike" then
			setAnim(ev.by == "me" and spMe or spFoe, "jab")
			deps.playSfx("whoosh")
		elseif ev.type == "break" then
			popAt(ev.by, "KAI!", Color3.fromHex("#ffffff"))
		elseif ev.type == "ko" then
			setAnim(ev.loser == "me" and spMe or spFoe, "down")
			setAnim(ev.loser == "me" and spFoe or spMe, "win")
			say(ev.loser == "me" and "VERLOREN" or "K.O.!", ev.loser == "me" and Color3.fromHex("#ff6a5a") or Color3.fromHex("#ffd040"), 99)
		end
		renderHud()
	end
	table.insert(inputs, Ev.OnClientEvent:Connect(onEvent))

	local function call(action, arg)
		local ok, res = pcall(function() return Fn:InvokeServer(action, arg) end)
		if not ok then return { ok = false, why = "NET" } end
		if battle and res and res.state then battle.state = res.state; renderHud() end
		return res
	end

	-- ── api ──────────────────────────────────────────────────────────
	function api.isOpen() return root.Visible or hud.Visible end
	function api.open()
		battle, playing, queue = nil, nil, {}
		hud.Visible = false
		showScene(true)
		root.Visible = true
		layoutScene()
		renderGrid()
		renderInfo()
		if deps.onOpen then deps.onOpen(true) end
	end
	function api.select(vid, rid, passive)
		local res = call("select", { variant = vid, rival = rid, passive = passive })
		if not res.ok then say(WHY[res.why] or res.why, Color3.fromHex("#ff6a5a")); return res end
		battle = { me = Roster.byId[res.me], foe = Roster.byId[res.foe], state = res.state }
		playing, queue = nil, {}
		buildSlots()
		dress(spMe, battle.me)
		dress(spFoe, battle.foe)
		hud.Visible = true
		showScene(true)
		layoutScene()
		setAnim(spMe, "idle"); setAnim(spFoe, "idle")
		say(battle.me.name .. "  VS  " .. battle.foe.name, Color3.fromHex("#ffd040"), 1.6)
		clearLive()
		spMe.hidden, spFoe.hidden = false, false
		camX = (res.state.me.x + res.state.foe.x) / 2
		for _, v in ipairs({ battle.me, battle.foe }) do for _, sl in ipairs(v.slots) do local d = sl.params and sl.params.live and LIVE[sl.params.live]; if d then task.spawn(preloadDef, d) end end end
		renderHud()
		return res
	end
	function api.cast(i)
		if not battle then return { ok = false, why = "NO_BATTLE" } end
		local res = call("cast", { slot = i })
		if not res.ok then say(WHY[res.why] or res.why, Color3.fromHex("#ff9a6a"), 0.9) end
		return res
	end
	function api.call(action, arg) return call(action, arg) end
	function api.close(fromServer)
		if battle and not fromServer then call("leave") end
		battle, playing, queue = nil, nil, {}
		if deps.stopClip then deps.stopClip() end
		clearLive()
		hud.Visible = false
		root.Visible = false
		msg.Text = ""
		for _, p in ipairs(pops) do p.l:Destroy() end
		pops = {}
		if deps.onOpen then deps.onOpen(false) end
	end
	function api.snapshot()
		return { open = api.isOpen(), battle = battle and { me = battle.me.id, foe = battle.foe.id, state = battle.state } or nil, playing = playing and { clip = playing.clip, by = playing.by, seq = playing.seq } or nil, queue = #queue, hudMe = barMe.chips.Text, hudFoe = barFoe.chips.Text, msg = msg.Text, sceneVisible = scene.Visible and root.Visible, lives = (function() local o = {} for seq, L in pairs(lives) do o[#o + 1] = { seq = seq, by = L.by, age = L.t0 and (os.clock() - L.t0) or -1, contact = L.contact } end return o end)(), books = #books, projs = (function() local n = 0 for _ in pairs(projs) do n += 1 end return n end)(), camX = camX, S = S }
	end

	table.insert(inputs, RunService.RenderStepped:Connect(function(dt)
		if msgT > 0 then msgT -= dt; if msgT <= 0 then msg.Text = "" end end
		for i = #pops, 1, -1 do
			local p = pops[i]
			p.t += dt
			p.l.Position = UDim2.fromScale(p.x, 0.45 - p.t * 0.08)
			p.l.TextTransparency = math.clamp((p.t - 0.7) / 0.4, 0, 1)
			if p.t > 1.1 then p.l:Destroy(); table.remove(pops, i) end
		end
		if battle and battle.state then
			local target = (battle.state.me.x + battle.state.foe.x) / 2
			camX += (target - camX) * math.min(1, dt * 2.5)
			stepLive(dt)
		end
		if battle and battle.state and scene.Visible then
			for _, pair in ipairs({ { spMe, battle.state.me }, { spFoe, battle.state.foe } }) do
				local sp, f = pair[1], pair[2]
				sp.t += dt
				local row = sp.cfg.rows[sp.state]
				if row and not row[3] and sp.t * FPS >= row[2] + 2 and sp.state ~= "down" and sp.state ~= "win" then setAnim(sp, "idle") end
				drawFighter(sp, f)
			end
		end
	end))
	table.insert(inputs, UIS.InputBegan:Connect(function(input, processed)
		if processed or not battle or UIS:GetFocusedTextBox() then return end
		local k = input.KeyCode
		local n = ({ [Enum.KeyCode.One] = 1, [Enum.KeyCode.Two] = 2, [Enum.KeyCode.Three] = 3, [Enum.KeyCode.Four] = 4 })[k]
		if n and battle.me.slots[n] then api.cast(n)
		elseif k == Enum.KeyCode.J then call("strike")
		elseif k == Enum.KeyCode.A then call("move", { dir = -1 })
		elseif k == Enum.KeyCode.D then call("move", { dir = 1 })
		elseif k == Enum.KeyCode.B then local r = call("break"); if not r.ok then say(WHY[r.why] or r.why, nil, 0.7) end
		elseif k == Enum.KeyCode.Escape then api.close(); api.open()
		end
	end))
	closeB.MouseButton1Click:Connect(function() api.close() end)
	return api
end

return Battle

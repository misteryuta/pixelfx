-- Jutsu viewer: look at every baked jutsu on its own, big and pixel-sharp.
-- Left: the list, grouped by character. Middle: the stage. Bottom: play/pause, speed, frame stepping, scrubbing, auto-advance.
-- Keys: Left/Right = previous/next jutsu, Space = pause, Up/Down = speed, , and . = one frame back/forward, A = auto, V = show/hide.
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local ContentProvider = game:GetService("ContentProvider")
local player = Players.LocalPlayer

-- the list: the 50 signature jutsus, then the 15 element jutsus from the wall
local LIST = {}
for _, j in ipairs(require(RS:WaitForChild("JutsuViewerData"))) do table.insert(LIST, j) end
local wall = RS:FindFirstChild("JutsuShowcaseData")
local HEAD = { "KATON", "SUITON", "RAITON", "FUUTON", "DOTON" }
local HEADI = { KATON = 1, SUITON = 2, RAITON = 3, FUUTON = 4, DOTON = 5 }
local els = {}
-- element moves baked with the signatures (char "ELEMENTE/KATON" etc.) join the element groups, after the wall ones
for i = #LIST, 1, -1 do
	local j = LIST[i]
	local g = j.char:match("^ELEMENTE/(%u+)$")
	if g then
		table.remove(LIST, i)
		j.char = "ELEMENTE"
		j.group2 = g
		j.order = (HEADI[g] or 6) * 10 + 9
		table.insert(els, j)
	end
end
if wall then
	for _, j in ipairs(require(wall)) do
		local title = j.title:gsub("^%u+ %- ", "")
		table.insert(els, { key = j.key, char = "ELEMENTE", group2 = HEAD[j.col], title = title, name = HEAD[j.col], desc = "", color = j.color, fps = j.fps or 12, fw = j.fw, fh = j.fh, cols = j.cols, feet = j.feet, sheets = j.sheets, order = j.col * 10 + j.row })
	end
end
table.sort(els, function(a, b) return a.order < b.order end)
for _, j in ipairs(els) do table.insert(LIST, j) end

-- Sound: every tagged beat of a jutsu (taijutsu blows, clashes, big blasts) plays on its impact frame, the frame the
-- hit-stop freezes on, so picture and sound land together. After Nintendo's way with simple actions (Sakurai on hit-stop
-- and hit feedback, Miyamoto/Kondo on "sound effects you can feel"): the sound is synced to the contact frame exactly;
-- a swing is heard before the blow (whoosh), the blow itself is short and dry; weight comes from layering a low thump
-- under the heavy hits rather than from volume; light blows are higher and quieter than finishers; repeated blows rotate
-- through variants and wobble in pitch a few percent so a flurry never sounds like a loop.
-- Sounds: Pro Sound Effects library on the Roblox Creator Store (free, licensed for Roblox experiences).
local SoundService = game:GetService("SoundService")
local arena = nil
local SFX = {
	punch = { { ids = { 9114457006, 9113569832 }, vol = 0.8, pitch = 1.05, vary = 0.06 } },
	parry = { { ids = { 9114457006 }, vol = 0.5, pitch = 1.28, vary = 0.06 } },
	block = { { ids = { 9113483651 }, vol = 0.75, pitch = 0.95, vary = 0.05 }, { ids = { 9114457006 }, vol = 0.3, pitch = 0.8, vary = 0.04 } },
	kick = { { ids = { 9113522776 }, vol = 0.85, pitch = 0.95, vary = 0.05 } },
	heavy = { { ids = { 9113569832 }, vol = 1, pitch = 0.85, vary = 0.03 }, { ids = { 9113524242 }, vol = 0.7, pitch = 0.9, vary = 0.03 } },
	whoosh = { { ids = { 9120972444, 9120972321 }, vol = 0.45, pitch = 1.12, vary = 0.08 } },
	step = { { ids = { 9120972444 }, vol = 0.3, pitch = 0.7, vary = 0.05 } },
	land = { { ids = { 9113524242 }, vol = 0.6, pitch = 1, vary = 0.05 } },
	clash = { { ids = { 9113569832 }, vol = 1, pitch = 0.78, vary = 0.02 }, { ids = { 9114502756 }, vol = 0.8, pitch = 1, vary = 0.02 } },
	rumble = { { ids = { 9114502756 }, vol = 0.35, pitch = 1.25, vary = 0.1, cut = 0.8 } },
	cast = { { ids = { 9120972321 }, vol = 0.5, pitch = 0.75, vary = 0.05 } },
	explosion = { { ids = { 9114362918 }, vol = 0.95, pitch = 1, vary = 0.04 }, { ids = { 9113524242 }, vol = 0.6, pitch = 0.7, vary = 0.03 } },
	thunder = { { ids = { 9120018050 }, vol = 1, pitch = 1.1, vary = 0.03 }, { ids = { 9113524242 }, vol = 0.5, pitch = 0.65, vary = 0.03 } },
}
local soundOn, rr = true, {}
local templates = {}
for tag, layers in pairs(SFX) do
	for li, l in ipairs(layers) do
		for _, id in ipairs(l.ids) do
			local key = "rbxassetid://" .. id
			if not templates[key] then
				local s = Instance.new("Sound")
				s.SoundId = key
				s.Name = "JV_" .. id
				s.Parent = SoundService
				templates[key] = s
			end
		end
	end
end
task.spawn(function()
	local list = {}
	for _, s in pairs(templates) do table.insert(list, s) end
	ContentProvider:PreloadAsync(list)
end)
local function playSfx(tag, speed)
	if not soundOn then return end
	local layers = SFX[tag]
	if not layers then return end
	for li, l in ipairs(layers) do
		-- round-robin through the variants, a little pitch wobble on every play
		local k = tag .. li
		rr[k] = ((rr[k] or 0) % #l.ids) + 1
		local t = templates["rbxassetid://" .. l.ids[rr[k]]]
		if t then
			local s = t:Clone()
			s.Volume = l.vol
			s.PlaybackSpeed = l.pitch * (1 + (math.random() * 2 - 1) * l.vary) * (speed >= 1 and 1 or (0.7 + 0.3 * speed))
			s.Parent = SoundService
			s:Play()
			local life = l.cut or math.max(0.5, (s.TimeLength > 0 and s.TimeLength or 2) / s.PlaybackSpeed)
			task.delay(life, function()
				if l.cut then
					for i = 1, 6 do s.Volume = l.vol * (1 - i / 6); task.wait(0.03) end
				end
				s:Destroy()
			end)
		end
	end
end

local C = {
	bg = Color3.fromHex("#0d0e1a"), panel = Color3.fromHex("#151729"), panel2 = Color3.fromHex("#1d2038"),
	line = Color3.fromHex("#2c3054"), text = Color3.fromHex("#e8e8f4"), dim = Color3.fromHex("#8a8eb0"),
}
local function new(class, props, parent)
	local o = Instance.new(class)
	for k, v in pairs(props) do o[k] = v end
	o.Parent = parent
	return o
end
local function corner(o, r) new("UICorner", { CornerRadius = UDim.new(0, r or 6) }, o) end
local function label(parent, props)
	local t = new("TextLabel", { BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, TextColor3 = C.text, TextXAlignment = Enum.TextXAlignment.Left, TextScaled = false }, parent)
	for k, v in pairs(props) do t[k] = v end
	return t
end
local function button(parent, text, props)
	local b = new("TextButton", { BackgroundColor3 = C.panel2, AutoButtonColor = true, Font = Enum.Font.GothamBold, Text = text, TextColor3 = C.text, TextSize = 16, BorderSizePixel = 0 }, parent)
	corner(b, 6)
	for k, v in pairs(props or {}) do b[k] = v end
	return b
end

local gui = new("ScreenGui", { Name = "JutsuViewer", ResetOnSpawn = false, IgnoreGuiInset = true, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, DisplayOrder = 10 }, player:WaitForChild("PlayerGui"))
local root = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.bg, BorderSizePixel = 0 }, gui)
local openBtn = button(gui, "JUTSU VIEWER  [V]", { Size = UDim2.fromOffset(190, 40), Position = UDim2.new(0, 16, 1, -56), Visible = false, BackgroundColor3 = Color3.fromHex("#2a1f4a") })

-- the list on the left
local side = new("Frame", { Size = UDim2.new(0, 300, 1, 0), BackgroundColor3 = C.panel, BorderSizePixel = 0 }, root)
label(side, { Text = "JUTSU VIEWER", Font = Enum.Font.Arcade, TextSize = 28, Size = UDim2.new(1, -24, 0, 40), Position = UDim2.fromOffset(16, 14) })
label(side, { Text = #LIST .. " Jutsus  -  Klick zum Ansehen", TextSize = 13, TextColor3 = C.dim, Size = UDim2.new(1, -24, 0, 18), Position = UDim2.fromOffset(16, 52) })
local battleBtn = button(side, "KAMPF: ROSTER  (81 Figuren)", { Size = UDim2.new(1, -28, 0, 38), Position = UDim2.fromOffset(14, 78), BackgroundColor3 = Color3.fromHex("#3a2a6a"), TextSize = 14, TextColor3 = Color3.fromHex("#e8d8ff") })
local playBtnA = button(side, "PLAYTEST: ARENA  (Taijutsu + Clash)", { Size = UDim2.new(1, -28, 0, 30), Position = UDim2.fromOffset(14, 120), BackgroundColor3 = Color3.fromHex("#4a2a18"), TextSize = 14, TextColor3 = Color3.fromHex("#ffd8a0") })
local scroll = new("ScrollingFrame", { Size = UDim2.new(1, -8, 1, -162), Position = UDim2.fromOffset(4, 158), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 6, ScrollBarImageColor3 = C.line, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new() }, side)
new("UIListLayout", { Padding = UDim.new(0, 2), SortOrder = Enum.SortOrder.LayoutOrder }, scroll)
new("UIPadding", { PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 10), PaddingBottom = UDim.new(0, 20) }, scroll)

-- the stage
local main = new("Frame", { Size = UDim2.new(1, -300, 1, 0), Position = UDim2.fromOffset(300, 0), BackgroundTransparency = 1 }, root)
local head = new("Frame", { Size = UDim2.new(1, -48, 0, 96), Position = UDim2.fromOffset(24, 14), BackgroundTransparency = 1 }, main)
local charL = label(head, { Text = "", Font = Enum.Font.GothamBlack, TextSize = 16, Size = UDim2.new(1, -140, 0, 20), Position = UDim2.fromOffset(0, 4) })
local titleL = label(head, { Text = "", Font = Enum.Font.Arcade, TextSize = 46, Size = UDim2.new(1, -140, 0, 48), Position = UDim2.fromOffset(0, 24) })
local nameL = label(head, { Text = "", TextSize = 15, TextColor3 = C.dim, Size = UDim2.new(1, -140, 0, 20), Position = UDim2.fromOffset(0, 74) })
local countL = label(head, { Text = "", Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = C.dim, TextXAlignment = Enum.TextXAlignment.Right, Size = UDim2.fromOffset(90, 20), Position = UDim2.new(1, -140, 0, 6) })
local closeBtn = button(head, "X", { Size = UDim2.fromOffset(36, 36), Position = UDim2.new(1, -36, 0, 0), TextSize = 18 })

local stage = new("Frame", { Size = UDim2.new(1, -48, 1, -270), Position = UDim2.fromOffset(24, 118), BackgroundColor3 = Color3.fromHex("#141628"), BorderSizePixel = 0, ClipsDescendants = true }, main)
corner(stage, 10)
new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromHex("#1e2140"), Color3.fromHex("#0f101e")) }, stage)
local ground = new("Frame", { BackgroundColor3 = Color3.fromHex("#262a4c"), BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 2), ZIndex = 1 }, stage)
local floor = new("Frame", { BackgroundColor3 = Color3.fromHex("#0a0b16"), BackgroundTransparency = 0.3, BorderSizePixel = 0, ZIndex = 1 }, stage)
local holder = new("Frame", { BackgroundTransparency = 1, ZIndex = 2 }, stage)
local loadL = label(stage, { Text = "LADE ...", Font = Enum.Font.Arcade, TextSize = 28, TextColor3 = C.dim, TextXAlignment = Enum.TextXAlignment.Center, Size = UDim2.fromScale(1, 1), ZIndex = 5, Visible = false })

-- the controls
local bar = new("Frame", { Size = UDim2.new(1, -48, 0, 140), Position = UDim2.new(0, 24, 1, -146), BackgroundTransparency = 1 }, main)
local track = new("TextButton", { Text = "", AutoButtonColor = false, BackgroundColor3 = C.panel2, BorderSizePixel = 0, Size = UDim2.new(1, -110, 0, 10), Position = UDim2.fromOffset(0, 8) }, bar)
corner(track, 5)
local fill = new("Frame", { BackgroundColor3 = C.text, BorderSizePixel = 0, Size = UDim2.fromScale(0, 1) }, track)
corner(fill, 5)
local frameL = label(bar, { Text = "", Font = Enum.Font.Code, TextSize = 14, TextColor3 = C.dim, TextXAlignment = Enum.TextXAlignment.Right, Size = UDim2.fromOffset(100, 20), Position = UDim2.new(1, -100, 0, 3) })
local row = new("Frame", { Size = UDim2.new(1, 0, 0, 40), Position = UDim2.fromOffset(0, 30), BackgroundTransparency = 1 }, bar)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), VerticalAlignment = Enum.VerticalAlignment.Center }, row)
local prevBtn = button(row, "<  ZURUECK", { Size = UDim2.fromOffset(120, 38) })
local stepB = button(row, "|<", { Size = UDim2.fromOffset(44, 38) })
local playBtn = button(row, "PAUSE", { Size = UDim2.fromOffset(100, 38) })
local stepF = button(row, ">|", { Size = UDim2.fromOffset(44, 38) })
local nextBtn = button(row, "WEITER  >", { Size = UDim2.fromOffset(120, 38) })
local speedBtn = button(row, "TEMPO 1x", { Size = UDim2.fromOffset(110, 38) })
local autoBtn = button(row, "AUTO: AUS", { Size = UDim2.fromOffset(110, 38) })
local soundBtn = button(row, "TON: AN", { Size = UDim2.fromOffset(100, 38), BackgroundColor3 = Color3.fromHex("#2a3a4a") })
local descL = label(bar, { Text = "", TextSize = 14, TextColor3 = C.dim, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Size = UDim2.new(1, 0, 0, 52), Position = UDim2.fromOffset(0, 80) })
label(bar, { Text = "Pfeile: Jutsu wechseln   Leertaste: Pause   , / . : Einzelbild   Hoch/Runter: Tempo   A: Auto   M: Ton   V: Viewer an/aus", TextSize = 12, TextColor3 = Color3.fromHex("#5a5e80"), Size = UDim2.new(1, 0, 0, 16), Position = UDim2.new(0, 0, 1, -10) })

-- the list entries
local items, lastChar = {}, nil
for i, j in ipairs(LIST) do
	local group = j.group2 and (j.char .. " - " .. j.group2) or j.char
	if group ~= lastChar then
		lastChar = group
		local h = label(scroll, { Text = group, Font = Enum.Font.GothamBlack, TextSize = 13, TextColor3 = j.color, Size = UDim2.new(1, 0, 0, 30), TextYAlignment = Enum.TextYAlignment.Bottom, LayoutOrder = i * 2 - 1 })
		new("UIPadding", { PaddingBottom = UDim.new(0, 4), PaddingLeft = UDim.new(0, 4) }, h)
	end
	local b = new("TextButton", { Text = "", AutoButtonColor = true, BackgroundColor3 = C.panel, BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 30), LayoutOrder = i * 2 }, scroll)
	corner(b, 5)
	local mark = new("Frame", { BackgroundColor3 = j.color, BorderSizePixel = 0, Size = UDim2.new(0, 3, 1, -10), Position = UDim2.fromOffset(4, 5), Visible = false }, b)
	label(b, { Text = string.format("%02d", i), Font = Enum.Font.Code, TextSize = 13, TextColor3 = C.dim, Size = UDim2.fromOffset(26, 30), Position = UDim2.fromOffset(12, 0) })
	local t = label(b, { Text = j.title, Font = Enum.Font.GothamMedium, TextSize = 14, Size = UDim2.new(1, -44, 1, 0), Position = UDim2.fromOffset(40, 0), TextTruncate = Enum.TextTruncate.AtEnd })
	items[i] = { b = b, mark = mark, t = t }
end

-- playback state
local GHOST = 0.996 -- inactive sheets stay a hair visible so the textures stay resident and swapping never blinks
local HOLD = 0.8
local SPEEDS = { 1, 0.5, 0.25, 0.1 }
local cur, layers, frames, total = 0, {}, {}, 0
local clock, frameNow, paused, speedI, auto, ready, holdT = 0, 0, false, 1, false, false, 0
local token = 0
local clipDone = nil
local battle = nil
-- a clip can play mirrored (the rival casting from the right in a roster fight)
local flipX, flipNext = false, false
local startCb = nil -- called once the chosen clip is loaded and on frame 1 (the roster fight starts its server clock there)

-- the cinema bars, shown for anything with a camera of its own (the fights and the clashes)
local barTop = new("Frame", { BackgroundColor3 = Color3.new(0, 0, 0), BorderSizePixel = 0, Size = UDim2.new(1, 0, 0.09, 0), ZIndex = 6, Visible = false }, stage)
local barBot = new("Frame", { BackgroundColor3 = Color3.new(0, 0, 0), BorderSizePixel = 0, Size = UDim2.new(1, 0, 0.09, 0), Position = UDim2.fromScale(0, 0.91), ZIndex = 6, Visible = false }, stage)
local base = nil
-- where the frame sits for frame n: as laid out, or through the effect's camera (zoom about the point it frames, that
-- point drawn toward the middle as it zooms in, a roll)
local function applyCam(n)
	local j = LIST[cur]
	if not j or not base then return end
	local c = j.cam and j.cam[n]
	if c and flipX then c = { c[1], j.fw - c[2], c[3], -c[4] } end
	local z, x, y, r = 1, base.x, base.y, 0
	if c then
		z, r = c[1], c[4]
		local sx0, sy0 = base.x + c[2] * base.s, base.y + c[3] * base.s
		local k = math.clamp((z - 1) / 1.2, 0, 1)
		local tx, ty = sx0 + (base.W / 2 - sx0) * k, sy0 + (base.H * 0.55 - sy0) * k
		x, y = tx - c[2] * base.s * z, ty - c[3] * base.s * z
	end
	holder.Size = UDim2.fromOffset(base.w * z, base.h * z)
	holder.Position = UDim2.fromOffset(math.floor(x), math.floor(y))
	holder.Rotation = r
	local gy = math.floor(y + j.feet[2] * base.s * z)
	ground.Position = UDim2.fromOffset(0, gy)
	ground.Rotation = r
	floor.Position = UDim2.fromOffset(0, gy + 2)
	floor.Size = UDim2.new(1, 0, 0, math.max(0, base.H - gy))
	barTop.Visible = j.cam ~= nil
	barBot.Visible = j.cam ~= nil
end
local function layout()
	local j = LIST[cur]
	if not j then return end
	local W, H = stage.AbsoluteSize.X, stage.AbsoluteSize.Y
	-- as big as fits, whole-pixel scale where possible; the frame sits a little low so the floor reads as floor
	local s = math.min((W - 40) / j.fw, (H - 24) / j.fh)
	if s >= 2 then s = math.floor(s) elseif s >= 1 then s = math.floor(s * 2) / 2 end
	local w, h = j.fw * s, j.fh * s
	local top = math.floor((H - h) * 0.62)
	base = { s = s, w = w, h = h, x = math.floor((W - w) / 2), y = top, W = W, H = H }
	applyCam(math.max(1, frameNow))
end
stage:GetPropertyChangedSignal("AbsoluteSize"):Connect(layout)

local function show(n)
	local f = frames[n]
	if not f then return end
	for k, l in ipairs(layers) do
		local want = (k == f[1]) and 0 or GHOST
		if l.ImageTransparency ~= want then l.ImageTransparency = want end
	end
	layers[f[1]].ImageRectOffset = flipX and (f[2] + Vector2.new(LIST[cur].fw, 0)) or f[2]
	applyCam(n)
	fill.Size = UDim2.fromScale((n - 1) / math.max(1, total - 1), 1)
	frameL.Text = string.format("%d / %d", n, total)
end

local function preloadIds(j)
	-- image assets only preload through instances (plain id strings report Failure)
	local ids = {}
	for _, s in ipairs(j.sheets) do
		local l = Instance.new("ImageLabel")
		l.Image = s.id
		table.insert(ids, l)
	end
	return ids
end

local function choose(i)
	if arena and not clipDone then arena.close() end
	i = ((i - 1) % #LIST) + 1
	cur = i
	token += 1
	local my = token
	local j = LIST[i]
	for k, it in ipairs(items) do
		local on = k == i
		it.mark.Visible = on
		it.b.BackgroundColor3 = on and C.panel2 or C.panel
		it.t.TextColor3 = on and j.color or C.text
	end
	-- keep the selected entry in view
	local b = items[i].b
	local y = b.AbsolutePosition.Y - scroll.AbsolutePosition.Y + scroll.CanvasPosition.Y
	if y < scroll.CanvasPosition.Y + 30 or y > scroll.CanvasPosition.Y + scroll.AbsoluteSize.Y - 60 then
		scroll.CanvasPosition = Vector2.new(0, math.max(0, y - scroll.AbsoluteSize.Y / 2))
	end
	charL.Text = j.group2 and (j.char .. "  /  " .. j.group2) or j.char
	charL.TextColor3 = j.color
	titleL.Text = j.title
	nameL.Text = j.name or ""
	descL.Text = j.desc or ""
	countL.Text = string.format("%d / %d", i, #LIST)
	flipX, flipNext = flipNext, false
	for _, l in ipairs(layers) do l:Destroy() end
	layers, frames = {}, {}
	for k, s in ipairs(j.sheets) do
		layers[k] = new("ImageLabel", { BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Image = s.id, ImageRectSize = Vector2.new(flipNext and -j.fw or j.fw, j.fh), ResampleMode = Enum.ResamplerMode.Pixelated, ImageTransparency = GHOST, ZIndex = 2 }, holder)
		for f = 0, s.n - 1 do
			table.insert(frames, { k, Vector2.new((f % j.cols) * j.fw, math.floor(f / j.cols) * j.fh) })
		end
	end
	total = #frames
	clock, frameNow, holdT, ready = 0, 1, 0, false
	layout()
	loadL.Visible = true
	holder.Visible = false
	task.spawn(function()
		ContentProvider:PreloadAsync(layers)
		if my ~= token then return end
		ready = true
		loadL.Visible = false
		holder.Visible = true
		show(1)
		if startCb then local cb = startCb; startCb = nil; task.spawn(cb) end
		-- warm the next one up in the background
		local nj = LIST[(i % #LIST) + 1]
		if nj then ContentProvider:PreloadAsync(preloadIds(nj)) end
	end)
end

local function setPaused(p)
	paused = p
	playBtn.Text = p and "PLAY" or "PAUSE"
end
local function step(d)
	if not ready then return end
	setPaused(true)
	frameNow = math.clamp(frameNow + d, 1, total)
	clock = (frameNow - 1) / LIST[cur].fps
	show(frameNow)
end
local function setSpeed(i)
	speedI = math.clamp(i, 1, #SPEEDS)
	speedBtn.Text = "TEMPO " .. tostring(SPEEDS[speedI]):gsub("^0", "") .. "x"
end
local function setAuto(a)
	auto = a
	autoBtn.Text = a and "AUTO: AN" or "AUTO: AUS"
	autoBtn.BackgroundColor3 = a and Color3.fromHex("#2f3f2a") or C.panel2
end
local function setOpen(o)
	root.Visible = o
	openBtn.Visible = not o
end

RunService.RenderStepped:Connect(function(dt)
	if not root.Visible or not ready or paused then return end
	local j = LIST[cur]
	if holdT > 0 then
		holdT -= dt
		if holdT <= 0 then
			if auto then choose(cur + 1) return end
			clock, frameNow = 0, 1
			show(1)
		end
		return
	end
	clock += dt * SPEEDS[speedI]
	local n = math.floor(clock * j.fps) + 1
	if n > total and clipDone then
		show(total)
		local cb = clipDone
		clipDone = nil
		setPaused(true)
		task.delay(0.35, cb)
		return
	end
	if n > total then
		show(total)
		holdT = HOLD
		return
	end
	if n ~= frameNow then
		-- the sound cues passed since the last frame shown, on their impact frames
		if j.sfx and n > frameNow then
			for _, e in ipairs(j.sfx) do
				if e[1] > frameNow and e[1] <= n then playSfx(e[2], SPEEDS[speedI]) end
			end
		end
		frameNow = n
		show(n)
	end
end)

-- scrubbing: click or drag along the bar
local scrubbing = false
local function scrubTo(x)
	if not ready then return end
	local u = math.clamp((x - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1)
	setPaused(true)
	frameNow = math.clamp(math.floor(u * (total - 1) + 0.5) + 1, 1, total)
	clock = (frameNow - 1) / LIST[cur].fps
	holdT = 0
	show(frameNow)
end
track.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
		scrubbing = true
		scrubTo(input.Position.X)
	end
end)
UIS.InputChanged:Connect(function(input)
	if scrubbing and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then scrubTo(input.Position.X) end
end)
UIS.InputEnded:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then scrubbing = false end
end)

local function fightOn() return battle ~= nil and battle.isOpen() end
for i, it in ipairs(items) do it.b.MouseButton1Click:Connect(function() if fightOn() then return end choose(i); setPaused(false) end) end
prevBtn.MouseButton1Click:Connect(function() if fightOn() then return end choose(cur - 1); setPaused(false) end)
nextBtn.MouseButton1Click:Connect(function() if fightOn() then return end choose(cur + 1); setPaused(false) end)
playBtn.MouseButton1Click:Connect(function() if fightOn() then return end setPaused(not paused) end)
stepB.MouseButton1Click:Connect(function() if fightOn() then return end step(-1) end)
stepF.MouseButton1Click:Connect(function() if fightOn() then return end step(1) end)
speedBtn.MouseButton1Click:Connect(function() if fightOn() then return end setSpeed(speedI % #SPEEDS + 1) end)
autoBtn.MouseButton1Click:Connect(function() setAuto(not auto) end)
local function setSound(on)
	soundOn = on
	soundBtn.Text = on and "TON: AN" or "TON: AUS"
	soundBtn.BackgroundColor3 = on and Color3.fromHex("#2a3a4a") or C.panel2
end
soundBtn.MouseButton1Click:Connect(function() setSound(not soundOn) end)
closeBtn.MouseButton1Click:Connect(function() setOpen(false) end)
openBtn.MouseButton1Click:Connect(function() setOpen(true) end)

UIS.InputBegan:Connect(function(input, processed)
	if processed or UIS:GetFocusedTextBox() then return end
	local k = input.KeyCode
	if k == Enum.KeyCode.V then setOpen(not root.Visible) return end
	if arena and arena.isOpen() then return end
	if battle and battle.isOpen() then return end
	if not root.Visible then return end
	if k == Enum.KeyCode.Right then choose(cur + 1); setPaused(false)
	elseif k == Enum.KeyCode.Left then choose(cur - 1); setPaused(false)
	elseif k == Enum.KeyCode.Space then setPaused(not paused)
	elseif k == Enum.KeyCode.Period then step(1)
	elseif k == Enum.KeyCode.Comma then step(-1)
	elseif k == Enum.KeyCode.Up then setSpeed(speedI - 1)
	elseif k == Enum.KeyCode.Down then setSpeed(speedI + 1)
	elseif k == Enum.KeyCode.A then setAuto(not auto)
	elseif k == Enum.KeyCode.M then setSound(not soundOn)
	end
end)

-- while the viewer is open, the character stands still (arrow keys and space belong to the viewer)
local function freeze()
	local ch = player.Character
	local hum = ch and ch:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.WalkSpeed = root.Visible and 0 or 16
		hum.JumpPower = root.Visible and 0 or 50
		hum.UseJumpPower = true
	end
end
root:GetPropertyChangedSignal("Visible"):Connect(freeze)
player.CharacterAdded:Connect(function() task.wait(0.2); freeze() end)
task.defer(freeze)

-- jump to an entry from outside (gui:SetAttribute("Select", n)), handy for tests and links
gui:GetAttributeChangedSignal("Select"):Connect(function()
	local n = gui:GetAttribute("Select")
	if typeof(n) == "number" then choose(n); setPaused(false) end
end)
gui:GetAttributeChangedSignal("Frame"):Connect(function()
	local n = gui:GetAttribute("Frame")
	if typeof(n) == "number" and ready then setPaused(true); frameNow = math.clamp(n, 1, total); clock = (frameNow - 1) / LIST[cur].fps; holdT = 0; show(frameNow) end
end)

setSpeed(1)
setAuto(false)
choose(1)

-- the playtest arena: you against the rival, hand to hand; its clashes play the cinematic clash scenes from the list
arena = require(RS:WaitForChild("JutsuArena")).mount(stage, {
	playSfx = function(tag) playSfx(tag, 1) end,
	playClip = function(key, done)
		for i, j in ipairs(LIST) do
			if j.key == key then
				setAuto(false)
				choose(i)
				setPaused(false)
				clipDone = done
				return
			end
		end
		done()
	end,
})
playBtnA.MouseButton1Click:Connect(function()
	setPaused(true)
	arena.open()
end)

-- the roster fight: choose era, faction and variant, then fight; its techniques play here as their clips
local function playClipFor(key, done, opts)
	for i, j in ipairs(LIST) do
		if j.key == key then
			setAuto(false)
			flipNext = opts and opts.flip == true
			startCb = opts and opts.onStart or nil
			setSpeed(1)
			choose(i)
			setPaused(false)
			clipDone = done
			return true
		end
	end
	if opts and opts.onStart then task.spawn(opts.onStart) end
	task.defer(done)
	return false
end
battle = require(RS:WaitForChild("ShinobiBattleClient")).mount(stage, {
	playSfx = function(tag) playSfx(tag, 1) end,
	playClip = playClipFor,
	stopClip = function() clipDone = nil; setPaused(true) end,
})
battleBtn.MouseButton1Click:Connect(function()
	setPaused(true)
	if arena and arena.isOpen() then arena.close() end
	battle.open()
end)
-- test hook for Studio checks (execute_luau in the Client): gui.BattleTest:Invoke(cmd, ...)
local hook = Instance.new("BindableFunction")
hook.Name = "BattleTest"
hook.Parent = gui
hook.OnInvoke = function(cmd, a, b, c)
	if cmd == "open" then setOpen(true); battle.open(); return true
	elseif cmd == "select" then return battle.select(a, b, c)
	elseif cmd == "cast" then return battle.cast(a)
	elseif cmd == "call" then return battle.call(a, b)
	elseif cmd == "close" then battle.close(); return true
	elseif cmd == "snap" then
		local s = battle.snapshot()
		s.viewer = { key = LIST[cur] and LIST[cur].key, frame = frameNow, total = total, flip = flipX, paused = paused, ready = ready, rootVisible = root.Visible }
		return s
	elseif cmd == "pause" then setPaused(a == true); return paused
	elseif cmd == "speed" then setSpeed(a); return SPEEDS[speedI]
	elseif cmd == "step" then step(a); return frameNow
	end
end

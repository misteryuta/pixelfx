-- ReplicatedStorage.PixelArena (2026-11-26): the client side of the summon moves on a 2.5D stage (Pixel BAS level 1,
-- and the same module on vfx test's 2.5D training stage). It draws what the server's simulation decided
-- (ReplicatedStorage.PixelArenaState: targets and casts as attributes) and sends the player's slot presses.
-- No hit is decided here.
--   mount(ctx) -> cleanup. ctx: folder, origin (Vector3 of map 0,0), start (Vector2: the stage's 0,0 in map coords),
--   ground(Vector2 map) -> height, pitch (camera pitch, rad), pos() -> Vector2 map, facing() -> 0 down 1 up 2 left
--   3 right, lock(bool), say(text|nil), shake(a, t), liveCast(liveId) -> bool (optional: the clip-free live moves)
-- The animals: one card per dog; each frame the dog's heading on the floor picks the view (toward the camera =
-- front, away = back, sideways = profile, mirrored for left) and the animation its phase.
local RS = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Input = game:GetService("UserInputService")
local AssetService = game:GetService("AssetService")
local EncodingService = game:GetService("EncodingService")
local SoundService = game:GetService("SoundService")
local Players = game:GetService("Players")

local Defs = require(script:WaitForChild("Defs"))
local Roster = require(script:WaitForChild("Roster"))
local PACKS = script:WaitForChild("Packs")
local A = {}

local SPP = 10.7 / 72 -- studs per pixel: the sprites are drawn for 72 px fighters, ~10.7 studs on the stage
local SFX = { cast = 9120972321, rumble = 9114502756, burst = 9113524242, bite = 9114457006, whoosh = 9120972444, poof = 9120972321, miss = 9120972444 }

-- packs: "LIVE", u16 count, then per frame u16 x, y, w, h (in its cell) and the RGBA bytes
local cache = {}
local function loadPack(name)
	if cache[name] then return cache[name] end
	local folder = PACKS:FindFirstChild(name)
	if not folder then return nil end
	local parts, i = {}, 1
	while folder:FindFirstChild(("P%03d"):format(i)) do parts[i] = folder[("P%03d"):format(i)].Value; i += 1 end
	local raw = EncodingService:DecompressBuffer(EncodingService:Base64Decode(buffer.fromstring(table.concat(parts))), Enum.CompressionAlgorithm.Zstd)
	assert(buffer.readstring(raw, 0, 4) == "LIVE", "pack format")
	local n, o, frames = buffer.readu16(raw, 4), 6, {}
	for k = 1, n do
		local x, y, w, h = buffer.readu16(raw, o), buffer.readu16(raw, o + 2), buffer.readu16(raw, o + 4), buffer.readu16(raw, o + 6)
		o += 8
		frames[k] = { x = x, y = y, w = w, h = h, off = o }
		o += w * h * 4
	end
	cache[name] = { raw = raw, frames = frames, meta = Defs.books[name], name = name }
	return cache[name]
end
A.loadPack = loadPack

-- the straw dummy (drawn pixel by pixel; no upload)
function A.dummyImage(thrower, ally)
	local W, H = 26, 54
	local img = AssetService:CreateEditableImage({ Size = Vector2.new(W, H) })
	local px = buffer.create(W * H * 4)
	local function put(x, y, c)
		if x < 0 or y < 0 or x >= W or y >= H then return end
		local k = (y * W + x) * 4
		buffer.writeu8(px, k, c[1]); buffer.writeu8(px, k + 1, c[2]); buffer.writeu8(px, k + 2, c[3]); buffer.writeu8(px, k + 3, 255)
	end
	local function rect(x0, y0, x1, y1, c) for y = y0, y1 do for x = x0, x1 do put(x, y, c) end end end
	local wood, woodD, straw, strawD, sack, ink, red = { 128, 84, 48 }, { 84, 52, 30 }, { 222, 184, 96 }, { 168, 128, 58 }, { 210, 190, 150 }, { 30, 24, 28 }, { 200, 40, 40 }
	rect(12, 30, 14, 53, wood); rect(14, 30, 14, 53, woodD)
	rect(1, 22, 24, 25, wood); rect(1, 25, 24, 25, woodD)
	if ally then
		-- a friend: blue cloth over the straw, a green medic's cross
		local cloth, clothD, green = { 92, 140, 210 }, { 60, 98, 164 }, { 60, 200, 120 }
		rect(5, 16, 20, 40, cloth); rect(5, 16, 6, 40, clothD); rect(19, 16, 20, 40, clothD)
		rect(12, 23, 14, 33, green); rect(8, 27, 18, 29, green)
	else
		rect(5, 16, 20, 40, straw); rect(5, 16, 6, 40, strawD); rect(19, 16, 20, 40, strawD)
		for y = 18, 40, 3 do put(8, y, strawD); put(16, y + 1, strawD) end
		for a = 0, 35 do local t = a / 36 * math.pi * 2; put(13 + math.round(math.cos(t) * 4), 28 + math.round(math.sin(t) * 4), red) end
		put(13, 28, red)
	end
	rect(7, 2, 18, 15, sack); rect(7, 2, 8, 15, strawD)
	for i = 0, 2 do put(9 + i, 6 + i, ink); put(11 - i, 6 + i, ink); put(14 + i, 6 + i, ink); put(16 - i, 6 + i, ink) end
	rect(10, 12, 15, 12, ink)
	if thrower then rect(5, 34, 20, 36, { 60, 90, 200 }); rect(22, 18, 25, 19, { 200, 205, 215 }) end
	local out = buffer.create(W * H * 4)
	buffer.copy(out, 0, px)
	for y = 0, H - 1 do for x = 0, W - 1 do
		local k = (y * W + x) * 4
		if buffer.readu8(px, k + 3) == 0 then
			for _, d in ipairs({ { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } }) do
				local nx, ny = x + d[1], y + d[2]
				if nx >= 0 and ny >= 0 and nx < W and ny < H and buffer.readu8(px, (ny * W + nx) * 4 + 3) > 0 then
					buffer.writeu8(out, k, 18); buffer.writeu8(out, k + 1, 15); buffer.writeu8(out, k + 2, 28); buffer.writeu8(out, k + 3, 255)
					break
				end
			end
		end
	end end
	img:WritePixelsBuffer(Vector2.zero, Vector2.new(W, H), out)
	return img, W, H
end

function A.mount(ctx)
	local O, folder, START = ctx.origin, ctx.folder, ctx.start
	local COS = math.cos(ctx.pitch)
	local state = RS:WaitForChild("PixelArenaState", 10)
	local remote = RS:WaitForChild("PixelArenaRemote", 10)
	assert(state and remote, "PixelArenaServer is not running")
	local conns, alive = {}, true
	local player = Players.LocalPlayer

	local function sfx(tag, vol)
		local id = SFX[tag]
		if not id then return end
		local s = Instance.new("Sound")
		s.SoundId = "rbxassetid://" .. id
		s.Volume = vol or 0.5
		s.Parent = SoundService
		s:Play()
		task.delay(2, function() s:Destroy() end)
	end
	local function toMap(x, z) return START + Vector2.new(x, z) end
	local function groundAt(m) return ctx.ground(m) end

	---------------------------------------------------------------- cards (camera-facing, feet at a floor point)
	local function newCard(z)
		local anchor = Instance.new("Part")
		anchor.Anchored, anchor.CanCollide, anchor.CanQuery, anchor.CanTouch, anchor.CastShadow = true, false, false, false, false
		anchor.Transparency, anchor.Size = 1, Vector3.one
		anchor.Parent = folder
		local bb = Instance.new("BillboardGui")
		bb.Adornee, bb.LightInfluence, bb.MaxDistance = anchor, 0, 1e5
		bb.Parent = anchor
		local img = Instance.new("ImageLabel")
		img.BackgroundTransparency, img.Size, img.ResampleMode = 1, UDim2.fromScale(1, 1), Enum.ResamplerMode.Pixelated
		img.ZIndex = z or 1
		img.Parent = bb
		return { anchor = anchor, bb = bb, img = img }
	end
	-- depth: Roblox orders the cards by where their centre is, so a tall card (Bull) would come in front of a short one
	-- standing nearer the camera. Each card is moved along the camera ray (same place on screen, size kept) so that
	-- it sorts by its feet on the floor, as if its centre were at a fighter's mid height (like the player's sprite)
	local SORT_H = 5.35
	local function settle(card, feet, ox, oy, w, h, nudge)
		local cam = workspace.CurrentCamera
		local cp, look = cam.CFrame.Position, cam.CFrame.LookVector
		local centre = feet + Vector3.new(ox, oy, 0)
		local dc = (centre - cp):Dot(look)
		local dk = (feet + Vector3.new(0, SORT_H, nudge or 0) - cp):Dot(look)
		local k = (dc > 1 and dk > 1) and dk / dc or 1
		card.anchor.Position = cp + (centre - cp) * k
		card.bb.StudsOffsetWorldSpace = Vector3.zero
		card.bb.Size = UDim2.fromScale(w * k, h * k)
	end
	local function kill(card)
		if not card then return end
		if card.ei then card.ei:Destroy(); card.ei = nil end
		if card.anchor then card.anchor:Destroy(); card.anchor = nil end
	end
	-- frame k of a pack into the card; face -1 mirrors; flipY turns it upside down (the seal toward the back);
	-- m: the floor point in map coords; lift in px; depth nudges the card toward the camera (+) for sorting
	local function show(card, pack, k, m, face, lift, flipY, depth)
		local meta = pack.meta
		if card.pack ~= pack then
			if card.ei then card.ei:Destroy() end
			card.ei = AssetService:CreateEditableImage({ Size = Vector2.new(meta.cw, meta.ch) })
			card.buf = buffer.create(meta.cw * meta.ch * 4)
			card.img.ImageContent = Content.fromObject(card.ei)
			card.pack, card.k = pack, nil
		end
		if card.k ~= k then
			local f = pack.frames[math.clamp(k, 1, #pack.frames)]
			buffer.fill(card.buf, 0, 0)
			local row = f.w * 4
			for yy = 0, f.h - 1 do buffer.copy(card.buf, ((f.y + yy) * meta.cw + f.x) * 4, pack.raw, f.off + yy * row, row) end
			card.ei:WritePixelsBuffer(Vector2.zero, Vector2.new(meta.cw, meta.ch), card.buf)
			card.k = k
		end
		local fx, fy = face < 0, flipY == true
		card.img.ImageRectOffset = Vector2.new(fx and meta.cw or 0, fy and meta.ch or 0)
		card.img.ImageRectSize = Vector2.new(fx and -meta.cw or meta.cw, fy and -meta.ch or meta.ch)
		local piv = meta.pivot
		local px = (fx and (meta.cw - piv[1]) or piv[1])
		local py = (fy and (meta.ch - piv[2]) or piv[2])
		settle(card, O + Vector3.new(m.X, groundAt(m), m.Y), (meta.cw / 2 - px) * SPP, ((py - meta.ch / 2) * SPP + (lift or 0) * SPP) / COS, meta.cw * SPP, meta.ch * SPP, depth)
		card.bb.Enabled = true
	end

	-- floor decals: a flat part with the frame on its top face, 1 px = 1 SPP on the floor, turned to a heading.
	-- Image x = forward, image y = right (the bake's convention); mirror = right is the other side.
	local function newFloor()
		local part = Instance.new("Part")
		part.Anchored, part.CanCollide, part.CanQuery, part.CanTouch, part.CastShadow = true, false, false, false, false
		part.Transparency, part.Size = 1, Vector3.new(1, 0.05, 1)
		part.Parent = folder
		local sg = Instance.new("SurfaceGui")
		sg.Face, sg.SizingMode, sg.PixelsPerStud, sg.LightInfluence, sg.AlwaysOnTop = Enum.NormalId.Top, Enum.SurfaceGuiSizingMode.PixelsPerStud, 1 / SPP, 0, false
		sg.Adornee = part
		sg.Parent = part
		local img = Instance.new("ImageLabel")
		img.BackgroundTransparency, img.Size, img.ResampleMode = 1, UDim2.fromScale(1, 1), Enum.ResamplerMode.Pixelated
		img.Parent = sg
		return { anchor = part, sg = sg, img = img, floor = true }
	end
	local function paint(card, pack, k)
		local meta = pack.meta
		if card.pack ~= pack then
			if card.ei then card.ei:Destroy() end
			card.ei = AssetService:CreateEditableImage({ Size = Vector2.new(meta.cw, meta.ch) })
			card.buf = buffer.create(meta.cw * meta.ch * 4)
			card.img.ImageContent = Content.fromObject(card.ei)
			card.pack, card.k = pack, nil
		end
		if card.k ~= k then
			local f = pack.frames[math.clamp(k, 1, #pack.frames)]
			buffer.fill(card.buf, 0, 0)
			local row = f.w * 4
			for yy = 0, f.h - 1 do buffer.copy(card.buf, ((f.y + yy) * meta.cw + f.x) * 4, pack.raw, f.off + yy * row, row) end
			card.ei:WritePixelsBuffer(Vector2.zero, Vector2.new(meta.cw, meta.ch), card.buf)
			card.k = k
		end
	end
	-- checked in Studio (marker image): on a Top-face SurfaceGui the image's x runs along the part's -Z and its y
	-- along the part's +X. So the part's X is his right, its -Z his forward; the image is flipped when 'right' is the
	-- mirrored side.
	local function showFloor(card, pack, k, m, heading, mirror, alpha)
		paint(card, pack, k)
		local meta = pack.meta
		local fw = Vector3.new(math.cos(heading), 0, math.sin(heading))
		local rt = Vector3.new(-math.sin(heading), 0, math.cos(heading))
		if mirror then rt = -rt end
		local rt0 = fw:Cross(Vector3.yAxis) -- right-handed: rt0 x up = -fw
		local flipY = rt0:Dot(rt) < 0
		card.img.ImageRectOffset = Vector2.new(0, flipY and meta.ch or 0)
		card.img.ImageRectSize = Vector2.new(meta.cw, flipY and -meta.ch or meta.ch)
		local px, py = meta.pivot[1], meta.pivot[2]
		local centre = O + Vector3.new(m.X, groundAt(m) + 0.07, m.Y) + fw * ((meta.cw / 2 - px) * SPP) + rt * ((meta.ch / 2 - py) * SPP)
		card.anchor.Size = Vector3.new(meta.ch * SPP, 0.05, meta.cw * SPP)
		card.anchor.CFrame = CFrame.fromMatrix(centre, rt0, Vector3.yAxis)
		card.img.ImageTransparency = alpha or 0
		card.sg.Enabled = true
	end

	---------------------------------------------------------------- targets
	local targets = {} -- name -> { p (map), card, image, shake, f }
	local pops = {}
	local function pop(m, text, color)
		local card = newCard(5)
		card.img:Destroy()
		local l = Instance.new("TextLabel")
		l.BackgroundTransparency, l.Size, l.Font, l.TextScaled = 1, UDim2.fromScale(1, 1), Enum.Font.Arcade, true
		l.Text, l.TextColor3, l.TextStrokeTransparency = text, color or Color3.new(1, 1, 1), 0.2
		l.Parent = card.bb
		card.bb.Size = UDim2.fromScale(14, 3)
		card.anchor.Position = O + Vector3.new(m.X, groundAt(m), m.Y)
		table.insert(pops, { card = card, l = l, t = 0 })
	end
	A.pop = pop
	local function syncTarget(f)
		local t = targets[f.Name]
		local thrower = (f:GetAttribute("Mode") or ""):sub(1, 5) == "throw"
		if t and t.thrower ~= thrower then
			local image = A.dummyImage(thrower, t.ally)
			t.card.img.ImageContent = Content.fromObject(image)
			t.image:Destroy()
			t.image, t.thrower = image, thrower
		end
		if not t then
			local ally = f:GetAttribute("Ally") == true
			local image, W, H = A.dummyImage(thrower, ally)
			local card = newCard(1)
			card.img.ImageContent = Content.fromObject(image)
			local s = SPP * 1.25
			-- health: a bar over the head (green for friends, red for targets)
			local bg = Instance.new("Frame")
			bg.BackgroundColor3, bg.BorderSizePixel, bg.Position, bg.Size = Color3.fromRGB(20, 18, 30), 0, UDim2.fromScale(0.08, 0), UDim2.fromScale(0.84, 0.045)
			bg.Parent = card.bb
			local fill = Instance.new("Frame")
			fill.BackgroundColor3, fill.BorderSizePixel, fill.Size = ally and Color3.fromRGB(80, 220, 130) or Color3.fromRGB(230, 70, 60), 0, UDim2.fromScale(1, 1)
			fill.Parent = bg
			t = { name = f.Name, card = card, image = image, shake = 0, f = f, W = W * s, H = H * s, oy = (H / 2 - 1) * s / COS, ally = ally, bar = fill, thrower = thrower }
			targets[f.Name] = t
		end
		t.bar.Size = UDim2.fromScale(math.clamp((f:GetAttribute("Hp") or 100) / 100, 0, 1), 1)
		t.p = toMap(f:GetAttribute("X") or 0, f:GetAttribute("Z") or 0)
		t.alive = f:GetAttribute("Alive") ~= false
		t.held = f:GetAttribute("Held") == true
		t.card.bb.Enabled = t.alive and f:GetAttribute("Hidden") ~= true
		settle(t.card, O + Vector3.new(t.p.X, groundAt(t.p), t.p.Y), 0, t.oy, t.W, t.H, 0)
	end
	-- the targets as other test abilities see them (same objects: a hit there shakes the same dummy)
	function A.targets()
		local list = {}
		for _, t in pairs(targets) do if t.alive and not t.ally then table.insert(list, t) end end
		return list
	end
	ctx.arenaTargets = A.targets

	---------------------------------------------------------------- casts
	local views = {} -- cast folder -> view
	local logLines = {}
	local panel -- set below
	local function addLog(line)
		table.insert(logLines, 1, line)
		while #logLines > 7 do table.remove(logLines) end
		if panel then panel.log.Text = table.concat(logLines, "\n") end
		print("[PixelArena] " .. line)
	end
	local function viewOf(h)
		local cx, cz = math.cos(h), math.sin(h)
		if math.abs(cz) > math.abs(cx) * 0.9 then return (cz > 0) and "front" or "back", 1 end
		return "side", (cx >= 0) and 1 or -1
	end
	local dirName = function(dx, dz)
		if math.abs(dz) > math.abs(dx) then return dz > 0 and "unten" or "oben" end
		return dx > 0 and "rechts" or "links"
	end
	local function newView(f)
		local v = { f = f, seal = newCard(1), dogs = {}, dirt = {}, smoke = {}, mark = newCard(4), zone = newCard(1), lastPhase = nil, said = {}, trails = {} }
		for i, id in ipairs(Defs.dogs) do
			v.dogs[i] = { id = id, card = newCard(2), mound = newCard(1), pack = loadPack("dog_" .. id), trail = nil }
			v.dirt[i] = newCard(3)
			v.smoke[i] = newCard(4)
		end
		views[f] = v
		return v
	end
	local function killView(v)
		kill(v.seal); kill(v.mark); kill(v.zone)
		for _, tr in ipairs(v.trails) do kill(tr.card) end
		for i, d in ipairs(v.dogs) do kill(d.card); kill(d.mound); kill(v.dirt[i]); kill(v.smoke[i]) end
	end
	local function frameOf(pack, anim, view, u)
		local ix = pack.meta.index[anim]
		local n = ix.n
		local k = math.floor(u * ix.fps)
		k = ix.loop and (k % n) or math.min(n - 1, k)
		return ix[view] + k
	end
	local function hide(card) if card and card.bb then card.bb.Enabled = false end; if card and card.sg then card.sg.Enabled = false end end
	local function stepView(v)
		local f = v.f
		local T, phase = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal"
		local M = Defs.moves[f:GetAttribute("Move")]
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local caster = toMap(cx, cz)
		-- the seal: the scroll at his feet, the script running out in the cast direction
		if T < M.seal + 0.6 then
			local vert = math.abs(dz) > math.abs(dx)
			local pk = loadPack(vert and "fx_sealv" or "fx_seal")
			local n = pk.meta.frames
			-- the scroll lies a step in front of him (in the cast direction)
			show(v.seal, pk, math.min(n, math.floor(T * pk.meta.fps) + 1), caster + Vector2.new(dx, dz) * 2.2, vert and 1 or (dx >= 0 and 1 or -1), 0, vert and dz < 0, -0.3)
			v.seal.img.ImageTransparency = math.clamp((T - M.seal - 0.3) / 0.3, 0, 1)
		else hide(v.seal) end
		local burstT, endT = f:GetAttribute("BurstT"), f:GetAttribute("EndT")
		local result = f:GetAttribute("Result") or ""
		local moundPk, bulgePk = loadPack("fx_mound"), loadPack("fx_bulge")
		for i, d in ipairs(v.dogs) do
			local m = toMap(f:GetAttribute("D" .. i .. "X") or cx, f:GetAttribute("D" .. i .. "Z") or cz)
			local h = f:GetAttribute("D" .. i .. "H") or 0
			-- under the ground: a moving mound; while the ground bulges, the bulge at its hole
			if phase == "track" then
				-- a furrow left behind every ~2 studs, fading
				if not d.trail or (m - d.trail).Magnitude > 2.2 then
					d.trail = m
					local tr = { card = newCard(1), born = T, m = m }
					show(tr.card, loadPack("fx_trail"), 1, m, 1, 0, false, -0.2)
					-- along the dog's line on the floor (the floor is foreshortened by the camera's tilt)
					tr.card.img.Rotation = math.deg(math.atan2(math.sin(h) * math.sin(ctx.pitch), math.cos(h)))
					table.insert(v.trails, tr)
				end
				show(d.mound, moundPk, (math.floor(T * moundPk.meta.fps) + i) % moundPk.meta.frames + 1, m, 1, 0, false, 0)
				hide(d.card)
			elseif phase == "warn" then
				local u = T - (f:GetAttribute("LockT") or T)
				show(d.mound, bulgePk, math.min(bulgePk.meta.frames, math.floor(u * bulgePk.meta.fps) + 1), m, 1, 0, false, 0)
				hide(d.card)
			else hide(d.mound) end
			-- out of the ground
			if burstT and (phase == "hold" or phase == "miss" or ((phase == "done" or phase == "abort") and T - (endT or T) < 0.15)) then
				local u = T - burstT
				local view, face = viewOf(h)
				local anim, au = "burst", u
				local bIx = d.pack.meta.index.burst
				local burstLen = bIx.n / bIx.fps
				if u >= burstLen then
					if result == "hit" then anim, au = "bite", u - burstLen
					else
						local sIx = d.pack.meta.index.snap
						local snapLen = sIx.n / sIx.fps
						if u < burstLen + snapLen then anim, au = "snap", u - burstLen else anim, au = "sniff", u - burstLen - snapLen end
					end
				end
				-- hold: up on the target a little (the bite height of the dummy's legs and arms); dogs on the far
				-- side of the target are behind it, near ones in front (the card's floor point decides)
				local BITE = { pakkun = 2, bisuke = 3, guruko = 5, akino = 5, urushi = 5, shiba = 6, uhei = 7, bull = 9 }
				local lift = (anim == "bite") and (BITE[d.id] or 4) or 0
				show(d.card, d.pack, frameOf(d.pack, anim, view, au), m, face, lift, false, 0.05)
				-- earth thrown up at the hole
				local dp = loadPack("fx_dirt")
				if u < dp.meta.frames / dp.meta.fps then show(v.dirt[i], dp, math.floor(u * dp.meta.fps) + 1, m, (i % 2 == 0) and 1 or -1, 0, false, 0.1) else hide(v.dirt[i]) end
			else
				hide(d.card); hide(v.dirt[i])
			end
			-- gone: summoning smoke where each dog was
			if (phase == "done" or phase == "abort") and endT then
				local sp = loadPack("fx_smoke")
				local u = T - endT
				if u < sp.meta.frames / sp.meta.fps then show(v.smoke[i], sp, math.floor(u * sp.meta.fps) + 1, m, 1, 4, false, 0.2) else hide(v.smoke[i]) end
				hide(d.mound)
			end
		end
		-- the furrows fade; the burst zone shows while the ground bulges
		for k = #v.trails, 1, -1 do
			local tr = v.trails[k]
			local a = math.clamp((T - tr.born) / 1.2, 0, 1)
			tr.card.img.ImageTransparency = a
			if a >= 1 then kill(tr.card); table.remove(v.trails, k) end
		end
		if phase == "warn" and f:GetAttribute("BX") then
			local zp = loadPack("fx_zone")
			show(v.zone, zp, math.floor(T * zp.meta.fps) % zp.meta.frames + 1, toMap(f:GetAttribute("BX"), f:GetAttribute("BZ")), 1, 0, false, -0.4)
		else hide(v.zone) end
		-- the hold mark on the caught target
		local tgt = targets[f:GetAttribute("Target") or ""]
		if phase == "hold" and tgt then
			local hp = loadPack("fx_hold")
			show(v.mark, hp, math.floor(T * hp.meta.fps) % hp.meta.frames + 1, tgt.p, 1, 30, false, 0.3)
		else hide(v.mark) end
		-- sounds and words on the phase changes (once each)
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "track" then sfx("rumble", 0.35)
			elseif phase == "warn" then sfx("rumble", 0.6)
			elseif phase == "hold" then
				sfx("burst", 0.7); sfx("bite", 0.6)
				if tgt then pop(tgt.p, "GEFANGEN", Color3.fromRGB(255, 196, 90)); tgt.shake = 0.35; ctx.shake(1.4, 0.3) end
			elseif phase == "miss" then
				sfx("burst", 0.6)
				local b = toMap(f:GetAttribute("BX") or cx, f:GetAttribute("BZ") or cz)
				pop(b, "VERFEHLT", Color3.fromRGB(192, 196, 224))
			elseif phase == "done" or phase == "abort" then sfx("poof", 0.4) end
			if (phase == "hold" or phase == "miss") and f:GetAttribute("Owner") == player.UserId then
				local d = dirName(dx, dz)
				addLog(("%s | %s | %s | %s"):format(v.who or "?", d, phase == "hold" and "TREFFER" or "VERFEHLT", f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target")) or "kein Ziel im Kegel"))
			end
			if phase == "abort" and f:GetAttribute("Owner") == player.UserId then addLog("abgebrochen (" .. tostring(was) .. ")") end
		end
		-- the caster can move again once the scroll is down
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- Gamabunta (kind "leap")
	local function newToad(f)
		local v = { f = f, kind = "leap", toad = newCard(2), smoke = newCard(4), dust = newCard(3), hit = newCard(5),
			fseal = newFloor(), shadow = newFloor(), zone = newFloor(), crack = newFloor(), arc = newFloor(), said = {} }
		views[f] = v
		return v
	end
	local function killToad(v)
		for _, k in ipairs({ "toad", "smoke", "dust", "hit", "fseal", "shadow", "zone", "crack", "arc" }) do
			local c = v[k]
			if c then if c.ei then c.ei:Destroy() end; if c.anchor then c.anchor:Destroy() end end
		end
	end
	local function byProg(pack, anim, view, prog)
		local ix = pack.meta.index[anim]
		return ix[view] + math.clamp(math.floor(prog * ix.n), 0, ix.n - 1)
	end
	local function stepToad(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local P = M.prefix or "gb_"
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local caster = toMap(cx, cz)
		local pos = toMap(f:GetAttribute("TX") or cx, f:GetAttribute("TZ") or cz)
		local h, ty = f:GetAttribute("TH") or 0, f:GetAttribute("TY") or 0
		local view, face = viewOf(h)
		local mirror = view == "side" and face < 0
		local pk = loadPack("toad_gamabunta")
		-- phase changes seen here (client times for the dust and the cracks)
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "appear" then sfx("poof", 0.6)
			elseif phase == "air" then v.takeoffT = T; sfx("whoosh", 0.6)
			elseif phase == "land" then
				v.landT = T; sfx("burst", 0.8); ctx.shake(2.4, 0.35)
			elseif phase == "slash" then sfx("whoosh", 0.8)
			elseif phase == "follow" then
				local res = f:GetAttribute("Result")
				local tgt = targets[f:GetAttribute("Target") or ""]
				if res == "miss" then pop(toMap(f:GetAttribute("LX") or cx, f:GetAttribute("LZ") or cz) + Vector2.new(math.cos(h), math.sin(h)) * M.standOff, "VERFEHLT", Color3.fromRGB(192, 196, 224)) end
				if f:GetAttribute("Owner") == player.UserId then
					addLog(("%s | %s | %s | %s"):format(v.who or "?", dirName(dx, dz), res == "hit" and ("TREFFER (" .. (f:GetAttribute("HitKind") or "") .. ")") or "VERFEHLT",
						res == "hit" and ("Ziel " .. tostring(f:GetAttribute("HitName"))) or (f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target") .. " nicht erreicht") or "kein Ziel im Kegel")))
				end
			elseif phase == "done" or phase == "abort" then
				sfx("poof", 0.5)
				if phase == "abort" and f:GetAttribute("Owner") == player.UserId then addLog("abgebrochen (" .. tostring(was) .. ")") end
			end
		end
		-- a hit: flash on the target, words, shake (once)
		local hitT = f:GetAttribute("HitT")
		v.hitShown = v.hitShown or {}
		for _, name in ipairs(string.split(f:GetAttribute("HitName") or "", "+")) do
			local t = targets[name]
			if t and not v.hitShown[name] then
				v.hitShown[name] = true
				t.shake = 0.35; pop(t.p, "GETROFFEN", Color3.fromRGB(255, 196, 90)); v.hitAt = t.p
				sfx("bite", 0.7); ctx.shake(1.6, 0.25)
			end
		end
		if v.hitAt and hitT and T - hitT < 0.3 then
			local hp = loadPack(P .. "hit")
			show(v.hit, hp, math.floor((T - hitT) * hp.meta.fps) + 1, v.hitAt, 1, 0, false, 0.5)
		else hide(v.hit) end
		-- the summoning formula under Naruto's palm
		if phase == "seal" or (phase == "appear" and u < 0.4) then
			local sp = loadPack(P .. "fseal")
			showFloor(v.fseal, sp, math.min(sp.meta.frames, math.floor(T * sp.meta.fps) + 1), caster + Vector2.new(dx, dz) * 1.5, math.atan2(dz, dx), false, phase == "appear" and u / 0.4 or 0)
		else hide(v.fseal) end
		-- the toad
		local ending = phase == "done" or phase == "abort"
		local anim, k
		if phase == "appear" then
			if u >= 0.12 then anim = "sit"; k = frameOf(pk, "sit", view, u) end
		elseif phase == "crouch" then anim = "crouch"; k = byProg(pk, "crouch", view, u / M.crouch)
		elseif phase == "air" then
			local q = u / M.air
			if q < 0.3 then k = byProg(pk, "leap", view, q / 0.3) elseif q < 0.72 then k = frameOf(pk, "air", view, u) else k = byProg(pk, "fall", view, (q - 0.72) / 0.28) end
		elseif phase == "land" then k = byProg(pk, "land", view, u / M.land)
		elseif phase == "draw" then k = byProg(pk, "draw", view, u / M.draw)
		elseif phase == "slash" or phase == "follow" then
			local ba = f:GetAttribute("BA") or M.sword.from
			local sp = math.clamp((M.sword.from - ba) / (M.sword.from - M.sword.to), 0, 1)
			local ix = pk.meta.index.slash
			v.slashFrame = math.clamp(math.round(sp * (ix.n - 1)), 0, ix.n - 1)
			k = ix[view] + v.slashFrame
		elseif phase == "look" then k = frameOf(pk, "look", view, u)
		elseif ending and v.lastK and u < 0.12 then k = v.lastK end
		if k then
			v.lastK = k
			show(v.toad, pk, k, pos, face, ty / SPP, false, 0)
			-- seen from behind he stands between the camera and his target: let it show through him
			v.toad.img.ImageTransparency = (view == "back") and 0.35 or 0
		else hide(v.toad) end
		-- smoke: arriving (behind Naruto) and leaving (where he is, at his height)
		local bs = loadPack(P .. "bigsmoke")
		local bsLen = bs.meta.frames / bs.meta.fps
		if phase == "appear" and u < bsLen then
			show(v.smoke, bs, math.floor(u * bs.meta.fps) + 1, toMap(f:GetAttribute("SX") or cx, f:GetAttribute("SZ") or cz), 1, 0, false, 0.4)
		elseif ending and u < bsLen then
			show(v.smoke, bs, math.floor(u * bs.meta.fps) + 1, pos, 1, ty / SPP, false, 0.4)
		else hide(v.smoke) end
		-- his shadow on the floor (smaller the higher he is): the ground contact during the leap
		if (phase ~= "seal" and not ending and (phase ~= "appear" or u >= 0.12)) or (ending and u < 0.12) then
			local sh = loadPack(P .. "shadow")
			showFloor(v.shadow, sh, 1 + math.clamp(math.floor(ty / M.jumpH * sh.meta.frames), 0, sh.meta.frames - 1), pos, h, mirror)
		else hide(v.shadow) end
		-- where he comes down (crush ring), during the crouch's end and the leap
		local lx, lz = f:GetAttribute("LX"), f:GetAttribute("LZ")
		if phase == "air" and lx then
			local zp = loadPack(P .. "zone")
			showFloor(v.zone, zp, math.floor(T * zp.meta.fps) % zp.meta.frames + 1, toMap(lx, lz), 0, false)
		else hide(v.zone) end
		-- dust at the take-off and the landing
		local dp = loadPack(P .. "dust")
		local dLen = dp.meta.frames / dp.meta.fps
		if v.landT and T - v.landT < dLen and lx then show(v.dust, dp, math.floor((T - v.landT) * dp.meta.fps) + 1, toMap(lx, lz), 1, 0, false, 0.6)
		elseif v.takeoffT and T - v.takeoffT < dLen then show(v.dust, dp, math.floor((T - v.takeoffT) * dp.meta.fps) + 1, toMap(f:GetAttribute("FX") or cx, f:GetAttribute("FZ") or cz), 1, 0, false, 0.6)
		else hide(v.dust) end
		-- cracks where he landed, fading
		if v.landT and lx then
			local a = math.clamp((T - v.landT - 1.2) / 0.8, 0, 1)
			if a < 1 then showFloor(v.crack, loadPack(P .. "crack"), 1, toMap(lx, lz), 0, false, a) else hide(v.crack) end
		else hide(v.crack) end
		-- the sword's sweep on the floor = the hit zone: outlined while he draws, then frame by frame with the blade
		local ap = loadPack(P .. "arc")
		if phase == "draw" then showFloor(v.arc, ap, 1, pos, h, mirror, 0.2)
		elseif phase == "slash" then showFloor(v.arc, ap, 2 + (v.slashFrame or 0), pos, h, mirror)
		elseif phase == "follow" then showFloor(v.arc, ap, ap.meta.frames, pos, h, mirror, math.clamp(u / M.follow, 0, 1))
		else hide(v.arc) end
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- Katsuyu (kinds "network" and "spit")
	local function newSlug(f)
		local v = { f = f, kind = f:GetAttribute("Kind"), slug = newCard(2), smoke = newCard(4), shadow = newFloor(), pieces = {}, slime = {},
			aim = newFloor(), pool = newFloor(), glob = newCard(3), splash = newCard(4), steam = newCard(3), said = {}, popped = {} }
		views[f] = v
		return v
	end
	local function killSlug(v)
		for _, k in ipairs({ "slug", "smoke", "shadow", "aim", "pool", "glob", "splash", "steam" }) do
			local c = v[k]
			if c then if c.ei then c.ei:Destroy() end; if c.anchor then c.anchor:Destroy() end end
		end
		for _, pc in pairs(v.pieces) do for _, c in ipairs({ pc.card, pc.glow, pc.puff }) do if c.ei then c.ei:Destroy() end; if c.anchor then c.anchor:Destroy() end end end
		for _, sl in ipairs(v.slime) do if sl.card.ei then sl.card.ei:Destroy() end; sl.card.anchor:Destroy() end
	end
	local function stepSlug(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local pos = toMap(f:GetAttribute("KX") or cx, f:GetAttribute("KZ") or cz)
		local h = f:GetAttribute("KH") or 0
		local view, face = viewOf(h)
		local mirror = view == "side" and face < 0
		local pk = loadPack("slug_katsuyu")
		local ending = phase == "done" or phase == "abort"
		local mine = f:GetAttribute("Owner") == player.UserId
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "appear" then sfx("poof", 0.6)
			elseif phase == "spit" then sfx("whoosh", 0.7)
			elseif phase == "pool" then sfx("burst", 0.6); ctx.shake(1.2, 0.2)
			elseif ending then
				sfx("poof", 0.5)
				if mine then
					if phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")")
					elseif v.kind == "network" then
						local healed = f:GetAttribute("Healed") or ""
						addLog(("%s | %s | %s"):format(v.who or "?", dirName(dx, dz), healed ~= "" and ("GEHEILT " .. healed) or (f:GetAttribute("Target") == "" and "kein Verbuendeter in Reichweite" or "niemand erreicht")))
					else
						local res = f:GetAttribute("Result")
						addLog(("%s | %s | %s | %s"):format(v.who or "?", dirName(dx, dz), res == "hit" and ("TREFFER (" .. (f:GetAttribute("HitKind") or "") .. ")") or "VERFEHLT",
							res == "hit" and ("Ziel " .. tostring(f:GetAttribute("HitName"))) or (f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target") .. " nicht erreicht") or "kein Ziel im Kegel")))
					end
				end
			end
		end
		-- her own animation
		local k
		local leaveT = nil -- (spit) she leaves once the glob has landed
		if phase == "appear" then if u >= 0.12 then k = frameOf(pk, "idle", view, u) end
		elseif phase == "divide" then k = byProg(pk, "divide", view, u / M.divide)
		elseif phase == "travel" or phase == "look" then k = frameOf(pk, "idle", view, T)
		elseif phase == "rear" then k = byProg(pk, "rear", view, u / M.rear)
		elseif phase == "spit" then k = byProg(pk, "spit", view, u / M.spit)
		elseif phase == "fly" then k = byProg(pk, "after", view, u / M.after)
		elseif phase == "pool" then
			local since = T - (f:GetAttribute("GlobT") or T) - M.spit
			if since < M.after then k = byProg(pk, "after", view, since / M.after) elseif u < 0.35 then k = frameOf(pk, "idle", view, T) else leaveT = PT + 0.35 end
		elseif ending and v.lastK and u < 0.12 then k = v.lastK end
		if k then v.lastK = k; show(v.slug, pk, k, pos, face, 0, false, 0); v.slug.img.ImageTransparency = (view == "back") and 0.3 or 0
		else hide(v.slug) end
		-- smoke: arriving, leaving (at the end of the healing; for the acid once it has landed)
		local bs = loadPack("ky_bigsmoke")
		local bsLen = bs.meta.frames / bs.meta.fps
		local goneAt = leaveT or (ending and PT) or v.goneAt
		if leaveT and not v.goneAt then v.goneAt = leaveT; sfx("poof", 0.4) end
		if phase == "appear" and u < bsLen then show(v.smoke, bs, math.floor(u * bs.meta.fps) + 1, pos, 1, 0, false, 0.4)
		elseif goneAt and T - goneAt < bsLen and T >= goneAt then show(v.smoke, bs, math.floor((T - goneAt) * bs.meta.fps) + 1, pos, 1, 0, false, 0.4)
		else hide(v.smoke) end
		if k then showFloor(v.shadow, loadPack("ky_shadow"), 1, pos, h, mirror) else hide(v.shadow) end

		if v.kind == "network" then
			-- the pieces: crawling to their allies (view from each one's heading), lying on them glowing, puffing away
			local pp, pc0 = loadPack("slug_piece"), nil
			local popLen = pp.meta.index.pop.n / pp.meta.index.pop.fps
			for i = 1, f:GetAttribute("NP") or 0 do
				local pc = v.pieces[i]
				if not pc then pc = { card = newCard(3), glow = newCard(4), puff = newCard(5), born = T }; v.pieces[i] = pc end
				local m = toMap(f:GetAttribute("P" .. i .. "X") or 0, f:GetAttribute("P" .. i .. "Z") or 0)
				local ph = f:GetAttribute("P" .. i .. "H") or 0
				local st = f:GetAttribute("P" .. i .. "S") or "crawl"
				local pv, pf = viewOf(ph)
				if pc.st ~= st then
					if (st == "done" or st == "merged") and not pc.goneT then pc.goneT = T; pc.goneAt = m; sfx("poof", 0.25)
						local tg = targets[f:GetAttribute("P" .. i .. "G") or ""]
						if st == "done" and tg then pop(tg.p, "GEHEILT", Color3.fromRGB(120, 240, 170)) end
					end
					pc.st = st
				end
				if ending and not pc.goneT then pc.goneT = T; pc.goneAt = m end
				if pc.goneT then
					hide(pc.card); hide(pc.glow)
					local pf2 = loadPack("ky_puff")
					local q = T - pc.goneT
					if q < pf2.meta.frames / pf2.meta.fps then show(pc.puff, pf2, math.floor(q * pf2.meta.fps) + 1, pc.goneAt, 1, st == "done" and 18 or 0, false, 0.3) else hide(pc.puff) end
				elseif st == "heal" then
					-- on the ally: over its body, in front of it, glowing
					local tg = targets[f:GetAttribute("P" .. i .. "G") or ""]
					local at = tg and tg.p or m
					show(pc.card, pp, frameOf(pp, "heal", "side", T + i * 0.2), at, (i % 2 == 0) and 1 or -1, 22, false, 0.15)
					local hg = loadPack("ky_heal")
					show(pc.glow, hg, math.floor(T * hg.meta.fps + i) % hg.meta.frames + 1, at, 1, 0, false, 0.2)
				else
					local q = T - pc.born
					local kk = q < popLen and byProg(pp, "pop", pv, q / popLen) or frameOf(pp, "crawl", pv, T + i * 0.13)
					show(pc.card, pp, kk, m, pf, 0, false, 0.05)
					hide(pc.glow)
					-- a slime trail behind it
					if not pc.trail or (m - pc.trail).Magnitude > 1.6 then
						pc.trail = m
						local sl = { card = newFloor(), born = T }
						showFloor(sl.card, loadPack("ky_slime"), 1, m, ph, false)
						table.insert(v.slime, sl)
					end
				end
			end
			for j = #v.slime, 1, -1 do
				local sl = v.slime[j]
				local a = math.clamp((T - sl.born - 0.6) / 1.2, 0, 1)
				sl.card.img.ImageTransparency = a
				if a >= 1 then if sl.card.ei then sl.card.ei:Destroy() end; sl.card.anchor:Destroy(); table.remove(v.slime, j) end
			end
		else
			-- the acid: the landing spot marked while she rears and while the glob flies; the glob's arc; the burst; the pool
			local aimM = toMap(f:GetAttribute("AX") or cx, f:GetAttribute("AZ") or cz)
			local ap = loadPack("ky_aim")
			if phase == "rear" or phase == "spit" or phase == "fly" then showFloor(v.aim, ap, math.floor(T * ap.meta.fps) % ap.meta.frames + 1, aimM, 0, false) else hide(v.aim) end
			local gT, fT = f:GetAttribute("GlobT"), f:GetAttribute("FlyT")
			if gT and fT and (phase == "spit" or phase == "fly") then
				local q = math.clamp((T - gT) / fT, 0, 1)
				local from = toMap(f:GetAttribute("FX"), f:GetAttribute("FZ"))
				local gm = from:Lerp(aimM, q)
				local gh = M.mouthH * (1 - q) + 4 * M.arcH * q * (1 - q)
				local gp = loadPack("ky_glob")
				show(v.glob, gp, math.floor(T * gp.meta.fps) % gp.meta.frames + 1, gm, 1, gh / SPP, false, 0.5)
			else hide(v.glob) end
			local sT = f:GetAttribute("SplashT")
			local sp = loadPack("ky_splash")
			if sT and T - sT < sp.meta.frames / sp.meta.fps then show(v.splash, sp, math.floor((T - sT) * sp.meta.fps) + 1, aimM, 1, 0, false, 0.5) else hide(v.splash) end
			if sT and (phase == "pool" or (ending and u < 0.4)) then
				local left = phase == "pool" and (M.pool - u) or -u
				local pl = loadPack("ky_pool")
				showFloor(v.pool, pl, math.floor(T * pl.meta.fps) % pl.meta.frames + 1, aimM, 0, false, math.clamp(1 - (left + 0.4) / 0.6, 0, 1))
				local stp = loadPack("ky_steam")
				show(v.steam, stp, math.floor(T * stp.meta.fps) % stp.meta.frames + 1, aimM, 1, 0, false, 0.2)
				v.steam.img.ImageTransparency = math.clamp(1 - (left + 0.4) / 0.6, 0, 1)
			else hide(v.pool); hide(v.steam) end
			-- hits: words and a shake per target, once
			for _, name in ipairs(string.split(f:GetAttribute("HitName") or "", "+")) do
				local t = targets[name]
				if t and not v.popped[name] then
					v.popped[name] = true
					t.shake = 0.35
					pop(t.p, (f:GetAttribute("HitKind") == "Pfuetze") and "VERAETZT" or "GETROFFEN", Color3.fromRGB(240, 220, 80))
					ctx.shake(1.2, 0.2)
				end
			end
			if phase == "pool" and f:GetAttribute("Result") ~= "hit" and not v.missPop and u > M.pool - 0.1 then v.missPop = true; pop(aimM, "VERFEHLT", Color3.fromRGB(192, 196, 224)) end
		end
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- Enma (kind "staff")
	local function newStaff(f)
		local v = { f = f, kind = "staff", monkey = newCard(2), smoke = newCard(4), puff = newCard(5), hit = newCard(5),
			grip = newCard(3), tip = newCard(3), shafts = {}, cageB = newCard(1), cageF = newCard(3), popped = {} }
		views[f] = v
		return v
	end
	local function killStaff(v)
		for _, k in ipairs({ "monkey", "smoke", "puff", "hit", "grip", "tip", "cageB", "cageF" }) do kill(v[k]) end
		for _, c in ipairs(v.shafts) do kill(c) end
	end
	local function stepStaff(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == player.UserId
		local ending = phase == "done" or phase == "abort"
		local base = toMap(f:GetAttribute("BX") or cx, f:GetAttribute("BZ") or cz)
		local sd = Vector2.new(f:GetAttribute("SDX") or dx, f:GetAttribute("SDZ") or dz)
		local L = f:GetAttribute("L") or 0
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "appear" then sfx("poof", 0.5)
			elseif phase == "aim" then sfx("poof", 0.4); v.hengeT = T
			elseif phase == "extend" then sfx("whoosh", 0.8)
			elseif phase == "cage" then sfx("burst", 0.6); ctx.shake(1.2, 0.2)
			elseif phase == "release" then sfx("poof", 0.4); v.releaseT = T
			end
			-- results: once the thrust is held out, or the cage is shut
			if mine and (phase == "hold" or phase == "bound" or phase == "empty") then
				local res = f:GetAttribute("Result")
				addLog(("%s | %s | %s | %s"):format(v.who or "?", dirName(dx, dz), res == "hit" and ("TREFFER (" .. (f:GetAttribute("HitKind") or "") .. ")") or "VERFEHLT",
					res == "hit" and ("Ziel " .. tostring(f:GetAttribute("HitName"))) or (f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target") .. " nicht erreicht") or "kein Ziel im Kegel")))
				if res ~= "hit" then pop(base + sd * L, "VERFEHLT", Color3.fromRGB(192, 196, 224)) end
			end
			if mine and phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")") end
			if ending then sfx("poof", 0.3) end
		end
		-- Enma in monkey form beside Hiruzen, then his jump into Hiruzen's hands
		local mk = loadPack("monkey_enma")
		local em = toMap(f:GetAttribute("EX") or cx, f:GetAttribute("EZ") or cz)
		local h = math.atan2(dz, dx)
		local view, face = viewOf(h)
		local sm = loadPack("en_smoke")
		if phase == "appear" then
			if u >= 0.1 then show(v.monkey, mk, frameOf(mk, "idle", view, u), em, face, 0, false, 0) else hide(v.monkey) end
			if u < sm.meta.frames / sm.meta.fps then show(v.smoke, sm, math.floor(u * sm.meta.fps) + 1, em, 1, 0, false, 0.3) else hide(v.smoke) end
		elseif phase == "henge" then
			-- along the way from his place to the grip
			local q = math.clamp(u / M.henge, 0, 1)
			show(v.monkey, mk, byProg(mk, "hop", view, q), em:Lerp(base, q), face, 0, false, 0)
			hide(v.smoke)
		else hide(v.monkey); hide(v.smoke) end
		-- puffs: turning into the staff (at the grip), turning back at the end
		local pf = loadPack("en_puff")
		local pLen = pf.meta.frames / pf.meta.fps
		local puffT = (v.releaseT and T - v.releaseT < pLen and v.releaseT) or (v.hengeT and T - v.hengeT < pLen and v.hengeT) or nil
		if puffT then show(v.puff, pf, math.floor((T - puffT) * pf.meta.fps) + 1, base + sd * 1.5, 1, M.handPx, false, 0.4) else hide(v.puff) end
		-- the staff: pieces along its line at Hiruzen's hand height, each turned to the line's angle on screen
		local showStaff = phase == "aim" or phase == "extend" or phase == "hold" or phase == "retract" or phase == "cage" or phase == "bound" or phase == "empty" or (phase == "release" and u < 0.1)
		if showStaff and L > 0 then
			local rot = math.deg(math.atan2(sd.Y * math.sin(ctx.pitch), sd.X))
			show(v.grip, loadPack("en_grip"), 1, base + sd * 1.1, 1, M.handPx, false, 0.1); v.grip.img.Rotation = rot
			local tipP = base + sd * L
			show(v.tip, loadPack("en_tip"), 1, tipP - sd * 1.0, 1, M.handPx, false, 0.12); v.tip.img.Rotation = rot
			local sp = loadPack("en_shaft")
			local n = math.max(0, math.ceil((L - 4.2) / 3.4))
			for i = 1, math.max(n, #v.shafts) do
				local c = v.shafts[i]
				if i <= n then
					if not c then c = newCard(3); v.shafts[i] = c end
					local along = math.min(L - 2.6, 3.4 + (i - 0.5) * 3.4)
					show(c, sp, 1, base + sd * along, 1, M.handPx, false, 0.1); c.img.Rotation = rot
				elseif c then hide(c) end
			end
		else
			hide(v.grip); hide(v.tip)
			for _, c in ipairs(v.shafts) do hide(c) end
		end
		-- the tip striking
		local hitT = f:GetAttribute("HitT")
		local hp = loadPack("en_hit")
		if hitT and T - hitT < hp.meta.frames / hp.meta.fps and f:GetAttribute("HitKind") == "Spitze" then
			show(v.hit, hp, math.floor((T - hitT) * hp.meta.fps) + 1, base + sd * L, 1, M.handPx, false, 0.5)
		else hide(v.hit) end
		for _, name in ipairs(string.split(f:GetAttribute("HitName") or "", "+")) do
			local t = targets[name]
			if t and not v.popped[name] then
				v.popped[name] = true
				t.shake = 0.35
				pop(t.p, f:GetAttribute("HitKind") == "Kaefig" and "GEFANGEN" or "GETROFFEN", Color3.fromRGB(255, 196, 90))
				ctx.shake(1.4, 0.25); sfx("bite", 0.6)
			end
		end
		-- the cage: the far half behind the prisoner, the near half in front
		local cX, cZ = f:GetAttribute("CX"), f:GetAttribute("CZ")
		if cX and (phase == "cage" or phase == "bound" or phase == "empty" or (phase == "release" and u < 0.12)) then
			local cm = toMap(cX, cZ)
			local bp, fp = loadPack("cage_back"), loadPack("cage_front")
			local k1 = phase == "cage" and byProg(bp, "form", "side", u / M.form) or bp.meta.index.hold.side
			show(v.cageB, bp, k1, cm, 1, 0, false, -M.cageH)
			show(v.cageF, fp, k1, cm, 1, 0, false, M.cageH + 0.4)
		else hide(v.cageB); hide(v.cageF) end
		-- Hiruzen holds the staff the whole time: free again once Enma is gone
		if v.locked and (phase == "release" or ending) then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- Kamatari (kind "dash")
	local GHOSTS = 4
	local function newDash(f)
		local v = { f = f, kind = "dash", body = newCard(2), ghosts = {}, gust = newCard(4), sickles = newCard(3), streak = newCard(4),
			smoke = newCard(4), path = newFloor(), scar = newFloor(), cuts = {}, popped = {} }
		for i = 1, GHOSTS do v.ghosts[i] = newCard(2) end
		views[f] = v
		return v
	end
	local function killDash(v)
		for _, k in ipairs({ "body", "gust", "sickles", "streak", "smoke", "path", "scar" }) do kill(v[k]) end
		for _, c in ipairs(v.ghosts) do kill(c) end
		for _, c in pairs(v.cuts) do kill(c.card); kill(c.debris) end
	end
	local function stepDash(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == player.UserId
		local ending = phase == "done" or phase == "abort"
		local start = toMap(f:GetAttribute("SX") or cx, f:GetAttribute("SZ") or cz)
		local pd = Vector2.new(f:GetAttribute("PDX") or dx, f:GetAttribute("PDZ") or dz)
		local pos = toMap(f:GetAttribute("KX") or cx, f:GetAttribute("KZ") or cz)
		local S, V = f:GetAttribute("S") or 0, f:GetAttribute("V") or 0
		local h = math.atan2(pd.Y, pd.X)
		local view, face = viewOf(h)
		local pk = loadPack("weasel_kamatari")
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "seal" or phase == "appear" then sfx("whoosh", 0.6)
			elseif phase == "dash" then sfx("whoosh", 0.9)
			elseif phase == "stop" then
				v.stopT = T
				if mine then
					local res = f:GetAttribute("Result")
					addLog(("%s | %s | %s | %s"):format(v.who or "?", dirName(dx, dz), res == "hit" and ("TREFFER (" .. (f:GetAttribute("HitKind") or "") .. ")") or "VERFEHLT",
						res == "hit" and ("Ziel " .. tostring(f:GetAttribute("HitName"))) or (f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target") .. " nicht erreicht") or "kein Ziel im Kegel")))
					if res ~= "hit" then pop(pos, "VERFEHLT", Color3.fromRGB(192, 196, 224)) end
				end
			elseif ending then
				sfx("poof", 0.4)
				if mine and phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")") end
			end
		end
		-- the fan's gust at Temari
		local gp = loadPack("km_gust")
		if phase == "seal" or (phase == "appear" and u < 0.15) then
			local q = T
			show(v.gust, gp, math.min(gp.meta.frames, math.floor(q * gp.meta.fps) + 1), toMap(cx, cz) + Vector2.new(dx, dz) * 1.5, 1, 0, false, 0.4)
		else hide(v.gust) end
		-- Kamatari himself: crouched in the wind, winding up, then the dash (fainter the faster he goes), the stop
		local k, alpha = nil, 0
		if phase == "appear" then if u > 0.05 then k = frameOf(pk, "idle", view, u) end
		elseif phase == "windup" then k = byProg(pk, "windup", view, u / M.windup)
		elseif phase == "dash" then k = frameOf(pk, "dash", view, u); alpha = math.clamp((V - 40) / 90, 0, 0.75)
		elseif phase == "stop" then k = byProg(pk, "stop", view, u / M.stop)
		elseif ending and u < 0.1 and v.lastK then k = v.lastK end
		if k then v.lastK = k; show(v.body, pk, k, pos, face, 0, false, 0); v.body.img.ImageTransparency = alpha else hide(v.body) end
		-- his trail in the dash: afterimages behind him, longer as he speeds up
		for i, g in ipairs(v.ghosts) do
			if phase == "dash" and k then
				local back = i * math.clamp(V / 30, 0.6, 4)
				local gs = S - back
				if gs > 0 then
					show(g, pk, frameOf(pk, "dash", view, u - i * 0.03), start + pd * gs, face, 0, false, -0.05 * i)
					g.img.ImageTransparency = math.clamp(0.45 + i * 0.12 + alpha * 0.3, 0, 0.95)
				else hide(g) end
			else hide(g) end
		end
		-- the small sickles and the lantern while he waits
		local sk = loadPack("km_sickles")
		if phase == "appear" or phase == "windup" then show(v.sickles, sk, math.floor(T * sk.meta.fps) % sk.meta.frames + 1, pos, 1, 0, false, -0.1)
		else hide(v.sickles) end
		-- speed lines round him, turned to his line on screen
		local sp = loadPack("km_streak")
		if phase == "dash" and V > 35 then
			show(v.streak, sp, math.floor(T * sp.meta.fps) % sp.meta.frames + 1, pos, 1, 0, false, 0.2)
			v.streak.img.Rotation = math.deg(math.atan2(pd.Y * math.sin(ctx.pitch), pd.X))
			v.streak.img.ImageTransparency = 1 - math.clamp((V - 35) / 60, 0, 1) * 0.9
		else hide(v.streak) end
		-- the corridor on the floor while he winds up and runs; the cuts it leaves, fading
		if phase == "windup" or phase == "dash" then
			local pp = loadPack("km_path")
			showFloor(v.path, pp, math.floor(T * pp.meta.fps) % pp.meta.frames + 1, start, h, false, phase == "dash" and 0.35 or 0)
		else hide(v.path) end
		if v.stopT or phase == "dash" then
			local fade = v.stopT and math.clamp((T - v.stopT - 0.6) / 1.0, 0, 1) or 0
			if fade < 1 and (v.stopT or S > 6) then showFloor(v.scar, loadPack("km_scar"), 1, start, h, false, fade) else hide(v.scar) end
		else hide(v.scar) end
		-- the cuts: a flash and debris at each target, words, a shake
		for _, name in ipairs(string.split(f:GetAttribute("HitName") or "", "+")) do
			local t = targets[name]
			if t and not v.popped[name] then
				v.popped[name] = { t0 = T, at = t.p, card = newCard(5), debris = newCard(4) }
				v.cuts[name] = v.popped[name]
				t.shake = 0.35
				pop(t.p, "GETROFFEN", Color3.fromRGB(255, 196, 90)); ctx.shake(1.3, 0.2); sfx("bite", 0.6)
			end
		end
		for _, c in pairs(v.cuts) do
			local q = T - c.t0
			local cp, dp = loadPack("km_cut"), loadPack("km_debris")
			if q < cp.meta.frames / cp.meta.fps then show(c.card, cp, math.floor(q * cp.meta.fps) + 1, c.at, 1, 0, false, 0.5) else hide(c.card) end
			if q < dp.meta.frames / dp.meta.fps then show(c.debris, dp, math.floor(q * dp.meta.fps) + 1, c.at, 1, 0, false, 0.3) else hide(c.debris) end
		end
		-- gone in smoke at the end of the path
		local sm = loadPack("km_smoke")
		if ending and u < sm.meta.frames / sm.meta.fps then show(v.smoke, sm, math.floor(u * sm.meta.fps) + 1, pos, 1, 0, false, 0.3) else hide(v.smoke) end
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- the Gedo Statue (kind "dragon")
	---------------------------------------------------------------- Katsuyu's Slug Great Division (kind "guard")
	local function newGuard(f)
		local v = { f = f, kind = "guard", slug = newCard(2), smoke = newCard(4), shadow = newFloor(), burst = newCard(4), pieces = {}, popped = {} }
		views[f] = v
		return v
	end
	local function killGuard(v)
		for _, n in ipairs({ "slug", "smoke", "shadow", "burst" }) do kill(v[n]) end
		for _, c in ipairs(v.pieces) do kill(c) end
	end
	local function hashR(i) local x = math.sin(i * 127.1 + 311.7) * 43758.5453; return x - math.floor(x) end
	local function stepGuard(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == player.UserId
		local ending = phase == "done" or phase == "abort"
		local pos = toMap(f:GetAttribute("KX") or cx, f:GetAttribute("KZ") or cz)
		local h = f:GetAttribute("KH") or 0
		local fw = Vector2.new(math.cos(h), math.sin(h))
		local view, face = viewOf(h)
		local mirror = view == "side" and face < 0
		local pk = loadPack("slug_katsuyu")
		local splitT = f:GetAttribute("SplitT")
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "appear" then sfx("poof", 0.6)
			elseif phase == "split" then
				sfx("burst", 0.6)
				pop(toMap(f:GetAttribute("SX") or cx, f:GetAttribute("SZ") or cz), "TEILUNG", Color3.fromRGB(190, 240, 222))
			elseif phase == "leave" then sfx("poof", 0.5)
			elseif ending and mine then
				if phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")")
				else
					local nb, nt = f:GetAttribute("Blocked") or 0, f:GetAttribute("Through") or 0
					addLog(("%s | %s | %s%s"):format(v.who or "?", dirName(dx, dz),
						nb > 0 and ("ABGEWEHRT %d (Teilung) von %s"):format(nb, tostring(f:GetAttribute("HitName"))) or "nichts abgewehrt",
						nt > 0 and (" | DURCHGEKOMMEN %d"):format(nt) or ""))
				end
			end
		end
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
		-- whole: reared up between the summoner and the enemy; after a division the lumps sink back
		local whole = phase == "appear" or phase == "guard" or phase == "leave"
		local k
		if phase == "appear" then if u >= 0.12 then k = frameOf(pk, "guard", view, u) end
		elseif phase == "guard" or (phase == "leave" and u < 0.3) then
			local rT = f:GetAttribute("ReformT")
			local rl = pk.meta.index.reform.n / pk.meta.index.reform.fps
			if rT and T - rT < rl then k = byProg(pk, "reform", view, (T - rT) / rl) else k = frameOf(pk, "guard", view, T) end
		elseif ending and v.lastK and u < 0.1 and v.wasWhole then k = v.lastK end
		v.wasWhole = whole
		if k then
			v.lastK = k
			show(v.slug, pk, k, pos, face, 0, false, 0)
			-- seen from the front or the back she stands between the camera and the summoner (or hides her): see-through
			v.slug.img.ImageTransparency = (view ~= "side") and 0.35 or 0
			showFloor(v.shadow, loadPack("ky_shadow"), 1, pos, h, mirror)
		else hide(v.slug); hide(v.shadow) end
		-- smoke: arriving, leaving
		local bs = loadPack("ky_bigsmoke")
		local bsLen = bs.meta.frames / bs.meta.fps
		if phase == "appear" and u < bsLen then show(v.smoke, bs, math.floor(u * bs.meta.fps) + 1, pos, 1, 0, false, 0.4)
		elseif phase == "leave" and u < bsLen then show(v.smoke, bs, math.floor(u * bs.meta.fps) + 1, pos, 1, 0, false, 0.4)
		else hide(v.smoke) end
		if phase == "leave" and u >= 0.3 then hide(v.slug); hide(v.shadow) end
		-- the burst where the blow landed
		local sp = loadPack("ky_split")
		if splitT and T - splitT < sp.meta.frames / sp.meta.fps and T >= splitT then
			show(v.burst, sp, math.floor((T - splitT) * sp.meta.fps) + 1, toMap(f:GetAttribute("SX"), f:GetAttribute("SZ")), 1, 0, false, 0.5)
		else hide(v.burst) end
		-- the small slugs: off her body, scattering away from the blow's line, then crawling back together
		local inPieces = phase == "split" or phase == "merge"
		local n = M.pieces
		if inPieces then
			local pp = loadPack("slug_bit")
			local popLen = pp.meta.index.pop.n / pp.meta.index.pop.fps
			local tail, front = pos - fw * M.tail, pos + fw * M.reach
			local side = Vector2.new(-fw.Y, fw.X)
			local at = toMap(f:GetAttribute("SX") or cx, f:GetAttribute("SZ") or cz)
			local sd = Vector2.new(f:GetAttribute("SDX") or 1, f:GetAttribute("SDZ") or 0)
			local perp = Vector2.new(-sd.Y, sd.X)
			for i = 1, n do
				local c = v.pieces[i]
				if not c then c = newCard(3); v.pieces[i] = c end
				local o = tail:Lerp(front, (i - 0.5) / n) + side * ((hashR(i) - 0.5) * 1.6 * M.bodyR)
				local sgn = (o - at):Dot(perp) >= 0 and 1 or -1
				local away = (perp * sgn + sd * ((hashR(i + 40) - 0.5) * 0.8)).Unit
				local sc = o + away * M.scatter * (0.6 + 0.7 * hashR(i + 9))
				local m, hd, kk
				if phase == "split" then
					local q = math.clamp(u / M.split, 0, 1)
					m = o:Lerp(sc, 1 - (1 - q) ^ 3)
					hd = math.atan2(away.Y, away.X)
					local pv = viewOf(hd)
					kk = u < popLen and byProg(pp, "pop", pv, u / popLen) or frameOf(pp, "crawl", pv, T + i * 0.13)
				else
					local q = math.clamp(u / M.merge, 0, 1)
					local home = pos + (o - pos) * 0.35
					m = sc:Lerp(home, q * q * (3 - 2 * q))
					local to = home - sc
					hd = math.atan2(to.Y, to.X)
					kk = frameOf(pp, "crawl", (viewOf(hd)), T + i * 0.13)
				end
				local _, pf = viewOf(hd)
				show(c, pp, kk, m, pf, 0, false, 0.05)
			end
		else
			for _, c in ipairs(v.pieces) do hide(c) end
		end
	end

	-- the dummies' thrown kunai (Threats): flying, falling in the swarm when she divides, or reaching the summoner
	local threatViews = {}
	local function stepThreat(tf)
		local k = threatViews[tf]
		if not k then k = { card = newCard(3) }; threatViews[tf] = k end
		local st = tf:GetAttribute("State") or "fly"
		local m = toMap(tf:GetAttribute("X") or 0, tf:GetAttribute("Z") or 0)
		local d = Vector2.new(tf:GetAttribute("DX") or 1, tf:GetAttribute("DZ") or 0)
		local T = state:GetAttribute("SimT") or 0
		local rot = math.deg(math.atan2(d.Y * math.sin(ctx.pitch), d.X))
		local kp = loadPack("ky_kunai")
		if k.st ~= st then
			k.st = st
			if st == "fly" then sfx("whoosh", 0.35)
			elseif st == "through" then
				sfx("bite", 0.6); ctx.shake(1, 0.15)
				pop(m, "GETROFFEN", Color3.fromRGB(255, 96, 80))
				addLog(("Kunai von %s trifft den Beschwoerer"):format(tostring(tf:GetAttribute("From"))))
			end
		end
		if st == "fly" then
			show(k.card, kp, 1, m, 1, 34, false, 0.4); k.card.img.Rotation = rot; k.card.img.ImageTransparency = 0
		elseif st == "blocked" then
			-- falls among the small slugs and lies there
			local q = math.clamp((T - (tf:GetAttribute("EndT") or T)) / 0.25, 0, 1)
			show(k.card, kp, 1, m, 1, 34 * (1 - q * q), false, 0.4); k.card.img.Rotation = rot + 70 * q
			k.card.img.ImageTransparency = math.clamp((T - (tf:GetAttribute("EndT") or T) - 0.8) / 0.4, 0, 1)
		else hide(k.card) end
	end

	local function newDragon(f)
		local v = { f = f, kind = "dragon", body = newCard(2), dust = newCard(4), smoke = newCard(4), headC = newCard(3), segs = {}, recv = {},
			coil = newCard(4), lane = newFloor(), cracks = newFloor(), popped = {} }
		views[f] = v
		return v
	end
	local function killDragon(v)
		for _, n in ipairs({ "body", "dust", "smoke", "headC", "coil", "lane", "cracks" }) do kill(v[n]) end
		for _, c in ipairs(v.segs) do kill(c) end
		for _, c in ipairs(v.recv) do kill(c) end
	end
	local function stepDragon(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == player.UserId
		local ending = phase == "done" or phase == "abort"
		local caster = toMap(cx, cz)
		local pos = toMap(f:GetAttribute("KX") or cx, f:GetAttribute("KZ") or cz)
		local h = f:GetAttribute("KH") or 0
		local fw = Vector2.new(math.cos(h), math.sin(h))
		local view, face = viewOf(h)
		local mouth = toMap(f:GetAttribute("MX") or cx, f:GetAttribute("MZ") or cz)
		local ld = Vector2.new(f:GetAttribute("LDX") or dx, f:GetAttribute("LDZ") or dz)
		local L = f:GetAttribute("L") or 0
		local pk = loadPack("statue_gedo")
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "rise" then sfx("rumble", 0.9); ctx.shake(2, 0.6); v.riseT = T
			elseif phase == "lock" then sfx("rumble", 0.6)
			elseif phase == "fly" then sfx("whoosh", 0.8)
			elseif phase == "coil" then sfx("bite", 0.6)
			elseif phase == "back" and f:GetAttribute("Result") ~= "hit" then
				if mine then addLog(("%s | %s | VERFEHLT | %s"):format(v.who or "?", dirName(dx, dz), f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target") .. " nicht erreicht") or "kein Ziel im Kegel")) end
				pop(mouth + ld * L, "VERFEHLT", Color3.fromRGB(192, 196, 224))
			elseif phase == "sink" then sfx("rumble", 0.6); v.sinkT = T
			elseif ending then
				sfx("poof", 0.4)
				if mine and phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")") end
			end
			if phase == "coil" and mine then addLog(("%s | %s | TREFFER (Drache) | Ziel %s"):format(v.who or "?", dirName(dx, dz), tostring(f:GetAttribute("HitName")))) end
		end
		-- the statue
		local k
		if phase == "rise" then k = byProg(pk, "rise", view, u / M.rise)
		elseif phase == "track" then k = frameOf(pk, "idle", view, u)
		elseif phase == "lock" then k = byProg(pk, "open", view, u / M.lock)
		elseif phase == "fly" or phase == "coil" or phase == "back" then k = frameOf(pk, "roar", view, T)
		elseif phase == "sink" then k = byProg(pk, "sink", view, u / M.sink)
		elseif ending and v.lastK and u < 0.1 then k = v.lastK end
		if k then v.lastK = k; show(v.body, pk, k, pos, face, 0, false, 0); v.body.img.ImageTransparency = (view == "back") and 0.35 or 0 else hide(v.body) end
		-- the ground breaking as it rises, the cracks staying while it stands
		local rp = loadPack("gd_rise")
		if v.riseT and T - v.riseT < rp.meta.frames / rp.meta.fps then show(v.dust, rp, math.floor((T - v.riseT) * rp.meta.fps) + 1, pos, 1, 0, false, 0.3)
		elseif v.sinkT and T - v.sinkT < rp.meta.frames / rp.meta.fps then show(v.dust, rp, math.floor((T - v.sinkT) * rp.meta.fps) + 1, pos, 1, 0, false, 0.3)
		else hide(v.dust) end
		if k then showFloor(v.cracks, loadPack("gd_cracks"), 1, pos, h, view == "side" and face < 0) else hide(v.cracks) end
		-- the black receivers from its belly into Pain's back (its price), while it stands
		local showRecv = phase == "rise" or phase == "track"
		local from = pos + fw * M.chestF
		local span = caster - from
		local n = showRecv and math.max(1, math.floor(span.Magnitude / 3)) or 0
		local rot = math.deg(math.atan2(span.Unit.Y * math.sin(ctx.pitch), span.Unit.X))
		for i = 1, math.max(n, #v.recv) do
			local c = v.recv[i]
			if i <= n then
				if not c then c = newCard(1); v.recv[i] = c end
				local q = (i - 0.5) / n
				show(c, loadPack("gd_receiver"), 1, from + span * q, 1, M.chestPx * (1 - q) + 40 * q, false, (view == "front") and -3 or -0.2); c.img.Rotation = rot
			elseif c then hide(c) end
		end
		-- the dragon's path once fixed (the tell), the dragon snaking out along it, its head
		if phase == "lock" then showFloor(v.lane, loadPack("gd_lane"), math.floor(T * 10) % 4 + 1, mouth, math.atan2(ld.Y, ld.X), false, 0) else hide(v.lane) end
		if (phase == "fly" or phase == "coil" or phase == "back") and L > 0.5 then
			local side = Vector2.new(-ld.Y, ld.X)
			local rotD = math.deg(math.atan2(ld.Y * math.sin(ctx.pitch), ld.X))
			local bp = loadPack("gd_body")
			local m = math.max(0, math.floor((L - 1.5) / 2.6))
			for i = 1, math.max(m, #v.segs) do
				local c = v.segs[i]
				if i <= m then
					if not c then c = newCard(3); v.segs[i] = c end
					local a = (i - 0.5) * 2.6
					local wig = math.sin(a * 0.45 - T * 7) * 1.1
					show(c, bp, math.floor(T * 12 + i) % 4 + 1, mouth + ld * a + side * wig, 1, M.mouthPx * (1 - math.min(1, a / 10)) + 30 * math.min(1, a / 10), false, 0.1); c.img.Rotation = rotD
				elseif c then hide(c) end
			end
			local hp2 = loadPack("gd_head")
			local tipH = M.mouthPx * (1 - math.min(1, L / 10)) + 30 * math.min(1, L / 10)
			show(v.headC, hp2, math.floor(T * 12) % 4 + 1, mouth + ld * L, 1, tipH, false, 0.15); v.headC.img.Rotation = rotD
		else
			hide(v.headC)
			for _, c in ipairs(v.segs) do hide(c) end
		end
		local grab = targets[f:GetAttribute("Grab") or ""]
		if phase == "coil" and grab then local cp = loadPack("gd_coil"); show(v.coil, cp, math.floor(T * cp.meta.fps) % cp.meta.frames + 1, grab.p, 1, 0, false, 0.3) else hide(v.coil) end
		for _, name in ipairs(string.split(f:GetAttribute("HitName") or "", "+")) do
			local t = targets[name]
			if t and not v.popped[name] then v.popped[name] = true; t.shake = 0.35; pop(t.p, "CHAKRA ENTZOGEN", Color3.fromRGB(190, 160, 255)) end
		end
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- Kurama (kind "beast")
	local function newBeast(f)
		local v = { f = f, kind = "beast", body = newCard(2), smoke = newCard(4), eyes = newCard(5), charge = newCard(4), ball = newCard(4),
			blast = newCard(5), shadow = newFloor(), zone = newFloor(), crater = newFloor(), popped = {} }
		views[f] = v
		return v
	end
	local function killBeast(v)
		for _, n in ipairs({ "body", "smoke", "eyes", "charge", "ball", "blast", "shadow", "zone", "crater" }) do kill(v[n]) end
	end
	local function stepBeast(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == player.UserId
		local ending = phase == "done" or phase == "abort"
		local pos = toMap(f:GetAttribute("KX") or cx, f:GetAttribute("KZ") or cz)
		local h = f:GetAttribute("KH") or 0
		local fw = Vector2.new(math.cos(h), math.sin(h))
		local view, face = viewOf(h)
		local mirror = view == "side" and face < 0
		local pk = loadPack("fox_kurama")
		local aimM = toMap(f:GetAttribute("AX") or cx, f:GetAttribute("AZ") or cz)
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "appear" then sfx("poof", 0.8); v.eyeT = T + 0.3
			elseif phase == "charge" then sfx("rumble", 0.7)
			elseif phase == "lock" then sfx("rumble", 0.9)
			elseif phase == "fire" then sfx("whoosh", 1); ctx.shake(1.5, 0.25)
			elseif phase == "blast" then
				sfx("burst", 1); ctx.shake(3, 0.5)
				if mine then
					local res = f:GetAttribute("Result")
					addLog(("%s | %s | %s | %s"):format(v.who or "?", dirName(dx, dz), res == "hit" and "TREFFER (Bijuudama)" or "VERFEHLT", res == "hit" and ("Ziel " .. tostring(f:GetAttribute("HitName"))) or (f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target") .. " nicht erreicht") or "kein Ziel im Kegel")))
					if res ~= "hit" then pop(aimM, "VERFEHLT", Color3.fromRGB(192, 196, 224)) end
				end
			elseif ending then
				sfx("poof", 0.6)
				if mine and phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")") end
			end
		end
		local k
		if phase == "appear" then if u > 0.15 then k = frameOf(pk, "idle", view, u) end
		elseif phase == "charge" or phase == "lock" then k = frameOf(pk, "charge", view, T)
		elseif phase == "swallow" then k = byProg(pk, "swallow", view, u / M.swallow)
		elseif phase == "fire" then k = byProg(pk, "fire", view, math.min(1, u / 0.3))
		elseif phase == "blast" then k = byProg(pk, "recover", view, u / M.after)
		elseif ending and u < 0.12 and v.lastK then k = v.lastK end
		if k then v.lastK = k; show(v.body, pk, k, pos, face, 0, false, 0); v.body.img.ImageTransparency = (view == "back") and 0.35 or 0 else hide(v.body) end
		if k then showFloor(v.shadow, loadPack("kr_shadow"), 1, pos, h, mirror) else hide(v.shadow) end
		local bs = loadPack("kr_bigsmoke")
		local bLen = bs.meta.frames / bs.meta.fps
		if (phase == "appear" or ending) and u < bLen then show(v.smoke, bs, math.floor(u * bs.meta.fps) + 1, pos, 1, 0, false, 0.4) else hide(v.smoke) end
		-- the Sharingan taking hold of its eyes
		local ep = loadPack("kr_eyes")
		if v.eyeT and T >= v.eyeT and T - v.eyeT < ep.meta.frames / ep.meta.fps then show(v.eyes, ep, math.floor((T - v.eyeT) * ep.meta.fps) + 1, pos + fw * M.headF, 1, M.headPx, false, 0.6) else hide(v.eyes) end
		-- the ball gathering before its mouth
		local mouthM = pos + fw * M.mouthF
		if phase == "charge" or phase == "lock" then
			local cp = loadPack("kr_charge")
			show(v.charge, cp, math.floor(T * cp.meta.fps) % cp.meta.frames + 1, mouthM + fw * 1.5, 1, M.mouthPx, false, 0.5)
		else hide(v.charge) end
		-- where it will land (fixed: the tell)
		if phase == "lock" or phase == "swallow" or phase == "fire" then
			local zp = loadPack("kr_zone")
			showFloor(v.zone, zp, math.floor(T * zp.meta.fps) % zp.meta.frames + 1, aimM, 0, false)
		elseif phase == "charge" then
			local zp = loadPack("kr_zone")
			showFloor(v.zone, zp, math.floor(T * zp.meta.fps) % zp.meta.frames + 1, aimM, 0, false, 0.65)
		else hide(v.zone) end
		-- the ball in flight: from the mouth (at its height) down to the ring
		local gT, fT = f:GetAttribute("GlobT"), f:GetAttribute("FlyT")
		if phase == "fire" and gT and fT then
			local q = math.clamp((T - gT) / fT, 0, 1)
			local from = toMap(f:GetAttribute("FX"), f:GetAttribute("FZ"))
			local bp = loadPack("kr_ball")
			show(v.ball, bp, math.floor(T * bp.meta.fps) % bp.meta.frames + 1, from:Lerp(aimM, q), 1, M.mouthPx * (1 - q) + 6, false, 0.5)
		else hide(v.ball) end
		local bT = f:GetAttribute("BlastT")
		local bl = loadPack("kr_blast")
		if bT and T - bT < bl.meta.frames / bl.meta.fps then show(v.blast, bl, math.floor((T - bT) * bl.meta.fps) + 1, aimM, 1, 0, false, 0.8) else hide(v.blast) end
		if bT then
			local fade = math.clamp((T - bT - 0.6) / 1.2, 0, 1)
			if fade < 1 then showFloor(v.crater, loadPack("kr_crater"), 1, aimM, 0, false, fade) else hide(v.crater) end
		else hide(v.crater) end
		for _, name in ipairs(string.split(f:GetAttribute("HitName") or "", "+")) do
			local t = targets[name]
			if t and not v.popped[name] then v.popped[name] = true; t.shake = 0.4; pop(t.p, "GETROFFEN", Color3.fromRGB(255, 120, 90)) end
		end
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- the Sage Toads' song (kind "song")
	local function newSong(f)
		local v = { f = f, kind = "song", fuka = newCard(3), shima = newCard(3), puff = newCard(4), notes = newCard(4), reach = newFloor(), prisons = {}, popped = {} }
		views[f] = v
		return v
	end
	local function killSong(v)
		for _, n in ipairs({ "fuka", "shima", "puff", "notes", "reach" }) do kill(v[n]) end
		for _, pr in pairs(v.prisons) do for _, c in ipairs({ pr.sb, pr.sf, pr.wb, pr.wf }) do kill(c) end end
	end
	local function stepSong(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == player.UserId
		local ending = phase == "done" or phase == "abort"
		local caster = toMap(cx, cz)
		local h = math.atan2(dz, dx)
		local view, face = viewOf(h)
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "appear" then sfx("poof", 0.5); v.puffT = T
			elseif phase == "prep" then sfx("rumble", 0.4)
			elseif phase == "sing" then
				sfx("burst", 0.6); ctx.shake(1, 0.25)
				if mine then
					local res = f:GetAttribute("Result")
					addLog(("%s | %s | %s | %s"):format(v.who or "?", dirName(dx, dz), res == "hit" and "TREFFER (Genjutsu)" or "VERFEHLT", res == "hit" and ("Ziel " .. tostring(f:GetAttribute("HitName"))) or "niemand in Hoerweite"))
				end
			elseif ending then
				sfx("poof", 0.4); v.puffT = T
				if mine and phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")") end
			end
		end
		-- the two toads on Jiraiya's shoulders, facing his way: idle, singing, coughing at the end
		local anim, au = "idle", T
		if phase == "prep" or phase == "sing" or phase == "hold" then anim = "sing" elseif phase == "release" then anim = "cough"; au = u end
		local showToads = (phase ~= "seal" and not ending and (phase ~= "appear" or u > 0.1)) or (ending and u < 0.1)
		for i, who in ipairs({ "fuka", "shima" }) do
			local pk = loadPack(i == 1 and "sage_fukasaku" or "sage_shima")
			if showToads then
				local kk = anim == "cough" and byProg(pk, "cough", view, au / M.release) or frameOf(pk, anim, view, au + i * 0.3)
				-- Fukasaku on the screen-left shoulder, Shima on the right (seen from behind: the other way round)
				local sx = ((i == 1) and -1 or 1) * M.shoulderX * ((view == "back") and -1 or 1)
				show(v[who], pk, kk, caster + Vector2.new(sx, 0), face, M.shoulderPx, false, 0.25)
			else hide(v[who]) end
		end
		local pf = loadPack("sg_puff")
		if v.puffT and T - v.puffT < pf.meta.frames / pf.meta.fps then show(v.puff, pf, math.floor((T - v.puffT) * pf.meta.fps) + 1, caster, 1, M.shoulderPx - 10, false, 0.3) else hide(v.puff) end
		if phase == "prep" or phase == "sing" or phase == "hold" then local np = loadPack("sg_notes"); show(v.notes, np, math.floor(T * np.meta.fps) % np.meta.frames + 1, caster, 1, M.shoulderPx, false, 0.3) else hide(v.notes) end
		-- the song's reach on the floor while they search the harmony (stronger as they get close), flashing as they sing
		local center = toMap(f:GetAttribute("CX") or cx, f:GetAttribute("CZ") or cz)
		if phase == "prep" or phase == "sing" then
			local rp = loadPack("sg_reach")
			showFloor(v.reach, rp, math.floor(T * rp.meta.fps) % rp.meta.frames + 1, center, 0, false, phase == "prep" and math.clamp(0.6 - u / M.prep * 0.6, 0, 0.6) or 0)
		else hide(v.reach) end
		-- each one caught: a cube of water, four toad samurai round it (the far half behind, the near half in front)
		local caught = {}
		for _, n in ipairs(string.split(f:GetAttribute("Caught") or "", "+")) do if n ~= "" then caught[n] = true end end
		for name in pairs(caught) do
			local t = targets[name]
			if t and not v.prisons[name] then v.prisons[name] = { sb = newCard(1), sf = newCard(3), wb = newCard(1), wf = newCard(3) }; t.shake = 0.35; pop(t.p, "GENJUTSU", Color3.fromRGB(200, 150, 255)) end
		end
		for name, pr in pairs(v.prisons) do
			local t = targets[name]
			if caught[name] and t then
				local wb, wf = loadPack("sg_waterBack"), loadPack("sg_waterFront")
				local k3 = math.floor(T * wb.meta.fps) % wb.meta.frames + 1
				show(pr.wb, wb, k3, t.p, 1, 0, false, -1.2); show(pr.wf, wf, k3, t.p, 1, 0, false, 1.2)
				show(pr.sb, loadPack("sg_samuraiBack"), 1, t.p, 1, 0, false, -2.5); show(pr.sf, loadPack("sg_samuraiFront"), 1, t.p, 1, 0, false, 2.5)
			else for _, c in ipairs({ pr.sb, pr.sf, pr.wb, pr.wf }) do hide(c) end end
		end
		if v.locked and (phase == "release" or ending) then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- the Gourd Toad (kind "tongue")
	local function newTongue(f)
		local v = { f = f, kind = "tongue", body = newCard(2), puff = newCard(4), tip = newCard(3), segs = {}, wrap = newCard(4),
			bubbles = newCard(4), splash = newCard(4), lane = newFloor(), popped = {} }
		views[f] = v
		return v
	end
	local function killTongue(v)
		for _, n in ipairs({ "body", "puff", "tip", "wrap", "bubbles", "splash", "lane" }) do kill(v[n]) end
		for _, c in ipairs(v.segs) do kill(c) end
	end
	local function stepTongue(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == player.UserId
		local ending = phase == "done" or phase == "abort"
		local pos = toMap(f:GetAttribute("KX") or cx, f:GetAttribute("KZ") or cz)
		local mouth = toMap(f:GetAttribute("MX") or cx, f:GetAttribute("MZ") or cz)
		local td = Vector2.new(f:GetAttribute("TDX") or dx, f:GetAttribute("TDZ") or dz)
		local L = f:GetAttribute("L") or 0
		local h = math.atan2(td.Y, td.X)
		local view, face = viewOf(h)
		local pk = loadPack("gourd_toad")
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "appear" then sfx("poof", 0.5); v.puffT = T
			elseif phase == "tongue" then sfx("whoosh", 0.7)
			elseif phase == "pull" then sfx("bite", 0.6)
			elseif phase == "swallow" then sfx("burst", 0.5); ctx.shake(1, 0.2)
			elseif phase == "spit" then sfx("burst", 0.5); v.spitT = T
			elseif phase == "retract" then
				if mine then addLog(("%s | %s | VERFEHLT | %s"):format(v.who or "?", dirName(dx, dz), f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target") .. " nicht erreicht") or "kein Ziel im Kegel")) end
				pop(mouth + td * L, "VERFEHLT", Color3.fromRGB(192, 196, 224))
			elseif ending then
				sfx("poof", 0.4); v.puffT = T
				if mine and phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")") end
			end
			if phase == "pull" and mine then addLog(("%s | %s | TREFFER (Zunge) | Ziel %s"):format(v.who or "?", dirName(dx, dz), tostring(f:GetAttribute("HitName")))) end
		end
		-- the toad
		local k
		if phase == "appear" then if u > 0.1 then k = frameOf(pk, "idle", view, u) end
		elseif phase == "open" then k = byProg(pk, "open", view, u / M.open)
		elseif phase == "aim" or phase == "tongue" or phase == "pull" or phase == "retract" then k = byProg(pk, "shoot", view, 0)
		elseif phase == "swallow" then k = byProg(pk, "swallow", view, u / M.swallow)
		elseif phase == "inside" then k = frameOf(pk, "full", view, u)
		elseif phase == "spit" then k = byProg(pk, "spit", view, u / M.spit)
		elseif phase == "close" then k = byProg(pk, "open", view, 1 - u / M.close)
		elseif ending and u < 0.1 and v.lastK then k = v.lastK end
		if k then v.lastK = k; show(v.body, pk, k, pos, face, 0, false, 0) else hide(v.body) end
		local pf = loadPack("gg_puff")
		if v.puffT and T - v.puffT < pf.meta.frames / pf.meta.fps then show(v.puff, pf, math.floor((T - v.puffT) * pf.meta.fps) + 1, pos, 1, 0, false, 0.3) else hide(v.puff) end
		-- the tongue's line on the floor while it takes aim (the tell)
		if phase == "open" or phase == "aim" then showFloor(v.lane, loadPack("gg_lane"), math.floor(T * 12) % 4 + 1, mouth, h, false, phase == "open" and 0.55 or 0) else hide(v.lane) end
		-- the tongue: pieces along the line at the mouth's height, the tip at its end
		if (phase == "tongue" or phase == "pull" or phase == "retract") and L > 0.3 then
			local rot = math.deg(math.atan2(td.Y * math.sin(ctx.pitch), td.X))
			show(v.tip, loadPack("gg_tip"), 1, mouth + td * L, 1, M.mouthPx, false, 0.12); v.tip.img.Rotation = rot
			local sp = loadPack("gg_tongue")
			local n = math.max(0, math.floor((L - 0.8) / 3.2))
			for i = 1, math.max(n, #v.segs) do
				local c = v.segs[i]
				if i <= n then
					if not c then c = newCard(3); v.segs[i] = c end
					show(c, sp, 1, mouth + td * math.min(L - 1.2, (i - 0.5) * 3.2), 1, M.mouthPx, false, 0.1); c.img.Rotation = rot
				elseif c then hide(c) end
			end
		else
			hide(v.tip)
			for _, c in ipairs(v.segs) do hide(c) end
		end
		-- the catch wrapped in the tongue while it is reeled in
		local grab = targets[f:GetAttribute("Grab") or ""]
		if phase == "pull" and grab then
			local wp = loadPack("gg_wrap")
			show(v.wrap, wp, math.floor(T * wp.meta.fps) % wp.meta.frames + 1, grab.p, 1, 0, false, 0.2)
		else hide(v.wrap) end
		-- inside: acid bubbling off the full toad
		if phase == "inside" then local bp = loadPack("gg_bubbles"); show(v.bubbles, bp, math.floor(T * bp.meta.fps) % bp.meta.frames + 1, pos, 1, 34, false, 0.3) else hide(v.bubbles) end
		local sp2 = loadPack("gg_splash")
		if v.spitT and T - v.spitT < sp2.meta.frames / sp2.meta.fps then show(v.splash, sp2, math.floor((T - v.spitT) * sp2.meta.fps) + 1, mouth + td * 2, 1, 0, false, 0.4) else hide(v.splash) end
		for _, name in ipairs(string.split(f:GetAttribute("HitName") or "", "+")) do
			local t = targets[name]
			if t and not v.popped[name] then v.popped[name] = true; t.shake = 0.35; pop(t.p, "GEPACKT", Color3.fromRGB(255, 196, 90)) end
		end
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- the Baku (kind "suck")
	local function newSuck(f)
		local v = { f = f, kind = "suck", body = newCard(2), smoke = newCard(4), plume = newCard(4), debris = newCard(4),
			cone = newFloor(), claws = newFloor(), shadow = newFloor(), popped = {} }
		views[f] = v
		return v
	end
	local function killSuck(v)
		for _, n in ipairs({ "body", "smoke", "plume", "debris", "cone", "claws", "shadow" }) do kill(v[n]) end
	end
	local function stepSuck(v)
		local f = v.f
		local M = Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == player.UserId
		local ending = phase == "done" or phase == "abort"
		local pos = toMap(f:GetAttribute("KX") or cx, f:GetAttribute("KZ") or cz)
		local h = f:GetAttribute("KH") or 0
		local fw = Vector2.new(math.cos(h), math.sin(h))
		local view, face = viewOf(h)
		local mirror = view == "side" and face < 0
		local pk = loadPack("baku")
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			if phase == "appear" then sfx("poof", 0.7)
			elseif phase == "brace" then sfx("rumble", 0.6); ctx.shake(1.2, 0.3)
			elseif phase == "draw" then sfx("rumble", 0.8)
			elseif phase == "suck" then sfx("whoosh", 0.9)
			elseif phase == "release" then
				if mine then
					local res = f:GetAttribute("Result")
					addLog(("%s | %s | %s | %s"):format(v.who or "?", dirName(dx, dz), res == "hit" and ("TREFFER (" .. (f:GetAttribute("HitKind") or "") .. ")") or "VERFEHLT",
						res == "hit" and ("Ziel " .. tostring(f:GetAttribute("HitName"))) or (f:GetAttribute("Target") ~= "" and ("Ziel " .. f:GetAttribute("Target") .. " nicht erreicht") or "kein Ziel im Kegel")))
					if res ~= "hit" then pop(pos + fw * (M.mouthF + 10), "VERFEHLT", Color3.fromRGB(192, 196, 224)) end
				end
			elseif ending then
				sfx("poof", 0.5)
				if mine and phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")") end
			end
		end
		local k2
		if phase == "appear" then if u >= 0.15 then k2 = frameOf(pk, "idle", view, u) end
		elseif phase == "brace" then k2 = byProg(pk, "brace", view, u / M.brace)
		elseif phase == "draw" then k2 = byProg(pk, "brace", view, 1)
		elseif phase == "suck" then k2 = frameOf(pk, "suck", view, u)
		elseif phase == "release" then k2 = byProg(pk, "release", view, u / M.release)
		elseif ending and u < 0.12 and v.lastK then k2 = v.lastK end
		if k2 then v.lastK = k2; show(v.body, pk, k2, pos, face, 0, false, 0); v.body.img.ImageTransparency = (view == "back") and 0.35 or 0 else hide(v.body) end
		if k2 then showFloor(v.shadow, loadPack("bk_shadow"), 1, pos, h, mirror) else hide(v.shadow) end
		local bs = loadPack("bk_bigsmoke")
		local bLen = bs.meta.frames / bs.meta.fps
		if phase == "appear" and u < bLen then show(v.smoke, bs, math.floor(u * bs.meta.fps) + 1, pos, 1, 0, false, 0.4)
		elseif ending and u < bLen then show(v.smoke, bs, math.floor(u * bs.meta.fps) + 1, pos, 1, 0, false, 0.4)
		else hide(v.smoke) end
		-- the cone: dust already streaming in while it braces (the tell), the catch zone while it inhales
		local mouthM = pos + fw * M.mouthF
		if phase == "brace" or phase == "draw" or phase == "suck" then
			local cp = loadPack("bk_cone")
			showFloor(v.cone, cp, math.floor(T * cp.meta.fps) % cp.meta.frames + 1, mouthM, h, false, phase == "brace" and 0.6 or phase == "draw" and 0.15 or 0)
		else hide(v.cone) end
		-- the claws dug in (from the brace on)
		if phase == "brace" or phase == "draw" or phase == "suck" or phase == "release" then showFloor(v.claws, loadPack("bk_claws"), 1, pos, h, mirror) else hide(v.claws) end
		-- the trunk blowing, the grit whirling into the mouth
		if phase == "suck" then
			local pp, dp = loadPack("bk_plume"), loadPack("bk_debris")
			show(v.plume, pp, math.floor(T * pp.meta.fps) % pp.meta.frames + 1, pos + fw * M.tipF, 1, M.tipPx, false, 0.3)
			show(v.debris, dp, math.floor(T * dp.meta.fps) % dp.meta.frames + 1, mouthM + fw * 2, 1, 0, false, 0.6)
		else hide(v.plume); hide(v.debris) end
		for _, name in ipairs(string.split(f:GetAttribute("HitName") or "", "+")) do
			local t = targets[name]
			if t and not v.popped[name] then
				v.popped[name] = true
				t.shake = 0.35
				pop(t.p, "GEZOGEN", Color3.fromRGB(255, 196, 90)); sfx("bite", 0.5)
			end
		end
		if v.locked and phase ~= "seal" then v.locked = false; ctx.lock(false) end
	end

	---------------------------------------------------------------- slots, directions, the training panel
	local variantIdx = 1
	for i, v in ipairs(Roster.list) do if v.id == "classic/kakashi-hatake-team-7-sensei" then variantIdx = i end end
	local onlyLive = true
	local dirMode = "blick" -- blick (the player's facing), unten, oben, rechts, links
	local last = nil -- the last cast: { slot, pos, dir }
	local pendingWho = nil
	local function variant() return Roster.list[variantIdx] end
	local function isLive(v) for _, s in ipairs(v.slots) do if s.live or s.summon then return true end end return false end
	local function dirVec()
		if dirMode == "unten" then return Vector2.new(0, 1) elseif dirMode == "oben" then return Vector2.new(0, -1)
		elseif dirMode == "rechts" then return Vector2.new(1, 0) elseif dirMode == "links" then return Vector2.new(-1, 0) end
		local fc = ctx.facing()
		if fc == 0 then return Vector2.new(0, 1) elseif fc == 1 then return Vector2.new(0, -1) elseif fc == 2 then return Vector2.new(-1, 0) end
		return Vector2.new(1, 0)
	end
	local function castSlot(slot, pos, dir)
		local v = variant()
		local s = v.slots[slot]
		if not s then return end
		if s.summon then
			local p = pos or ctx.pos()
			local d = dir or dirVec()
			last = { slot = slot, pos = p, dir = d }
			pendingWho = ("%s %s | %s"):format(v.name, v.era == "classic" and "Classic" or "Shippuden", s.name)
			remote:FireServer("cast", v.id, slot, p - START, d)
		elseif s.live and ctx.liveCast then
			ctx.liveCast(s.live)
		else
			ctx.say(("%s: %s - noch nicht live"):format(v.name, s.name))
			task.delay(1.6, function() if alive then ctx.say(nil) end end)
		end
	end
	table.insert(conns, remote.OnClientEvent:Connect(function(op, a, b)
		if op == "cast" then
			local f = state.Casts:WaitForChild("C" .. a, 2)
			if f then
				local kind = f:GetAttribute("Kind")
				local v = views[f] or (kind == "leap" and newToad(f)) or ((kind == "network" or kind == "spit") and newSlug(f)) or (kind == "staff" and newStaff(f)) or (kind == "dash" and newDash(f)) or (kind == "suck" and newSuck(f)) or (kind == "tongue" and newTongue(f)) or (kind == "song" and newSong(f)) or (kind == "beast" and newBeast(f)) or (kind == "dragon" and newDragon(f)) or (kind == "guard" and newGuard(f)) or newView(f)
				v.who = pendingWho
				v.locked = true
				ctx.lock(true)
			end
		elseif op == "refused" then
			ctx.say("Nicht möglich: " .. tostring(a))
			task.delay(1.4, function() if alive then ctx.say(nil) end end)
		end
	end))

	-- the panel (bottom right): variant, slots, direction, time, target tests
	local gui = Instance.new("ScreenGui")
	gui.Name, gui.ResetOnSpawn, gui.DisplayOrder = "PixelArenaPanel", false, 60
	local frame = Instance.new("Frame")
	frame.Size, frame.Position, frame.AnchorPoint = UDim2.fromOffset(520, 300), UDim2.new(0, 16, 0, 92), Vector2.new(0, 0)
	frame.BackgroundColor3, frame.BackgroundTransparency, frame.BorderSizePixel = Color3.fromRGB(16, 18, 38), 0.12, 0
	frame.Parent = gui
	local function label(text, x, y, w, h, size)
		local l = Instance.new("TextLabel")
		l.BackgroundTransparency, l.Position, l.Size = 1, UDim2.fromOffset(x, y), UDim2.fromOffset(w, h)
		l.Font, l.TextSize, l.TextColor3, l.TextXAlignment, l.TextYAlignment = Enum.Font.Arcade, size or 14, Color3.fromRGB(240, 238, 228), Enum.TextXAlignment.Left, Enum.TextYAlignment.Top
		l.TextWrapped, l.Text = true, text
		l.Parent = frame
		return l
	end
	local buttons = {}
	local function button(name, text, x, y, w, fn)
		local b = Instance.new("TextButton")
		b.Name, b.Position, b.Size = name, UDim2.fromOffset(x, y), UDim2.fromOffset(w, 22)
		b.BackgroundColor3, b.BorderSizePixel, b.AutoButtonColor = Color3.fromRGB(46, 52, 96), 0, true
		b.Font, b.TextSize, b.TextColor3, b.Text = Enum.Font.Arcade, 13, Color3.fromRGB(240, 238, 228), text
		b.Parent = frame
		b.Activated:Connect(fn)
		buttons[name] = b
		return b
	end
	local title = label("", 10, 6, 450, 34, 15)
	local slotsL = label("", 10, 40, 450, 70, 13)
	local logL = label("", 10, 196, 450, 100, 12)
	logL.TextColor3 = Color3.fromRGB(196, 206, 255)
	panel = { log = logL }
	local function refresh()
		local v = variant()
		title.Text = ("[ ] VARIANTE: %s (%s)"):format(v.cell, v.era == "classic" and "Classic" or "Shippuden")
		local lines = {}
		for i, s in ipairs(v.slots) do lines[i] = ("%d  %s%s"):format(i, s.name, s.summon and "  [BESCHWOERUNG LIVE]" or s.live and "  [LIVE]" or "") end
		slotsL.Text = table.concat(lines, "\n")
		for _, k in ipairs({ "blick", "unten", "oben", "rechts", "links" }) do buttons["d_" .. k].BackgroundColor3 = (dirMode == k) and Color3.fromRGB(120, 70, 40) or Color3.fromRGB(46, 52, 96) end
	end
	local function cycle(dv)
		for _ = 1, #Roster.list do
			variantIdx = (variantIdx - 1 + dv) % #Roster.list + 1
			if not onlyLive or isLive(variant()) then break end
		end
		refresh()
	end
	button("prev", "<", 10, 112, 26, function() cycle(-1) end)
	button("next", ">", 40, 112, 26, function() cycle(1) end)
	local dx0 = 74
	for i, k in ipairs({ "blick", "unten", "oben", "rechts", "links" }) do
		button("d_" .. k, k:upper(), dx0 + (i - 1) * 78, 112, 74, function() dirMode = k; refresh() end)
	end
	local timeScale = 1
	button("repeat", "R WIEDERH.", 10, 140, 88, function() if last then castSlot(last.slot, last.pos, last.dir) end end)
	button("pause", "P PAUSE", 102, 140, 70, function() remote:FireServer("pause", not state:GetAttribute("Paused")) end)
	button("slow", "T ZEITLUPE", 176, 140, 84, function() timeScale = (timeScale == 1) and 0.25 or 1; remote:FireServer("time", timeScale) end)
	button("frame", "F BILD", 264, 140, 62, function() remote:FireServer("frame") end)
	button("abort", "Q ABBRUCH", 330, 140, 84, function() remote:FireServer("abort") end)
	button("t_throw", "WIRFT", 418, 140, 92, function() remote:FireServer("targets", nil, "throw") end)
	button("t_walk", "ZIEL LAEUFT", 10, 168, 96, function() remote:FireServer("targets", nil, "walk") end)
	button("t_dodge", "WEICHT AUS", 110, 168, 92, function() remote:FireServer("targets", nil, "dodge") end)
	button("t_stand", "STEHT", 206, 168, 58, function() remote:FireServer("targets", nil, "stand") end)
	button("t_remove", "ENTFERNEN", 268, 168, 84, function() remote:FireServer("targets", "T1", "remove") end)
	button("t_reset", "RESET+RESPAWN", 356, 168, 104, function() remote:FireServer("respawn"); remote:FireServer("targets", nil, "reset"); remote:FireServer("cooldowns") end)
	gui.Parent = player:WaitForChild("PlayerGui")
	refresh()
	-- the test hook (Studio): same calls as the buttons, for scripted playtests
	local hook = Instance.new("BindableFunction")
	hook.Name = "ArenaTest"
	hook.Parent = gui
	hook.OnInvoke = function(op, a, b, c)
		if op == "variant" then for i, v in ipairs(Roster.list) do if v.id == a then variantIdx = i end end; refresh(); return variant().id
		elseif op == "dir" then dirMode = a; refresh(); return dirMode
		elseif op == "slot" then castSlot(a, b, c); return true
		elseif op == "button" then buttons[a]:Activate(); return true
		elseif op == "log" then return logLines
		elseif op == "server" then remote:FireServer(a, b, c); return true
		elseif op == "place" and ctx.place then ctx.place(START + a, b); return true
		elseif op == "pos" then return ctx.pos() - START
		elseif op == "views" then local n = 0; for _ in pairs(views) do n += 1 end; return n end
	end

	local keys = { [Enum.KeyCode.One] = 1, [Enum.KeyCode.Two] = 2, [Enum.KeyCode.Three] = 3, [Enum.KeyCode.Four] = 4 }
	table.insert(conns, Input.InputBegan:Connect(function(input, processed)
		if processed or Input:GetFocusedTextBox() then return end
		local k = input.KeyCode
		if keys[k] then castSlot(keys[k])
		elseif k == Enum.KeyCode.R then if last then castSlot(last.slot, last.pos, last.dir) end
		elseif k == Enum.KeyCode.Q then remote:FireServer("abort")
		elseif k == Enum.KeyCode.P then remote:FireServer("pause", not state:GetAttribute("Paused"))
		elseif k == Enum.KeyCode.F then remote:FireServer("frame")
		elseif k == Enum.KeyCode.T then timeScale = (timeScale == 1) and 0.25 or 1; remote:FireServer("time", timeScale)
		elseif k == Enum.KeyCode.LeftBracket then cycle(-1) elseif k == Enum.KeyCode.RightBracket then cycle(1) end
	end))

	-- warm the packs (decode once) so the first cast's first frame is ready
	task.spawn(function() for name in pairs(Defs.books) do loadPack(name); task.wait() end end)

	table.insert(conns, RunService.RenderStepped:Connect(function(dt)
		if not alive then return end
		for _, f in ipairs(state.Targets:GetChildren()) do syncTarget(f) end
		for _, t in pairs(targets) do
			if t.held then t.card.img.ImageColor3 = Color3.fromRGB(255, 214, 160) elseif t.shake <= 0 then t.card.img.ImageColor3 = Color3.new(1, 1, 1) end
			if t.shake > 0 then
				t.shake -= dt
				t.card.img.Rotation = math.sin(t.shake * 60) * 6 * t.shake / 0.35
				if t.shake <= 0 then t.card.img.Rotation = 0 end
			elseif t.held then t.card.img.Rotation = math.sin(os.clock() * 30) * 1.5 end
		end
		for _, f in ipairs(state.Casts:GetChildren()) do
			local kind = f:GetAttribute("Kind")
			if kind == "leap" then stepToad(views[f] or newToad(f))
			elseif kind == "network" or kind == "spit" then stepSlug(views[f] or newSlug(f))
			elseif kind == "staff" then stepStaff(views[f] or newStaff(f))
			elseif kind == "dash" then stepDash(views[f] or newDash(f))
			elseif kind == "suck" then stepSuck(views[f] or newSuck(f))
			elseif kind == "tongue" then stepTongue(views[f] or newTongue(f))
			elseif kind == "song" then stepSong(views[f] or newSong(f))
			elseif kind == "beast" then stepBeast(views[f] or newBeast(f))
			elseif kind == "dragon" then stepDragon(views[f] or newDragon(f))
			elseif kind == "guard" then stepGuard(views[f] or newGuard(f))
			else stepView(views[f] or newView(f)) end
		end
		local threats = state:FindFirstChild("Threats")
		if threats then for _, tf in ipairs(threats:GetChildren()) do stepThreat(tf) end end
		for tf, k in pairs(threatViews) do if not tf.Parent then kill(k.card); threatViews[tf] = nil end end
		for f, v in pairs(views) do
			if not f.Parent then
				if v.locked then ctx.lock(false) end
				if v.kind == "leap" then killToad(v) elseif v.kind == "network" or v.kind == "spit" then killSlug(v) elseif v.kind == "staff" then killStaff(v) elseif v.kind == "dash" then killDash(v) elseif v.kind == "suck" then killSuck(v) elseif v.kind == "tongue" then killTongue(v) elseif v.kind == "song" then killSong(v) elseif v.kind == "beast" then killBeast(v) elseif v.kind == "dragon" then killDragon(v) elseif v.kind == "guard" then killGuard(v) else killView(v) end
				views[f] = nil
			end
		end
		for i = #pops, 1, -1 do
			local q = pops[i]
			q.t += dt
			q.card.bb.StudsOffsetWorldSpace = Vector3.new(0, (12 + q.t * 3) / COS, 0)
			q.l.TextTransparency = math.clamp((q.t - 0.6) / 0.4, 0, 1)
			if q.t > 1 then kill(q.card); table.remove(pops, i) end
		end
	end))

	return function()
		alive = false
		for _, c in ipairs(conns) do c:Disconnect() end
		remote:FireServer("respawn")
		for _, v in pairs(views) do if v.kind == "leap" then killToad(v) elseif v.kind == "network" or v.kind == "spit" then killSlug(v) elseif v.kind == "staff" then killStaff(v) elseif v.kind == "dash" then killDash(v) elseif v.kind == "suck" then killSuck(v) elseif v.kind == "tongue" then killTongue(v) elseif v.kind == "song" then killSong(v) elseif v.kind == "beast" then killBeast(v) elseif v.kind == "dragon" then killDragon(v) elseif v.kind == "guard" then killGuard(v) else killView(v) end end
		for _, t in pairs(targets) do kill(t.card); t.image:Destroy() end
		for _, k in pairs(threatViews) do kill(k.card) end
		for _, q in ipairs(pops) do kill(q.card) end
		gui:Destroy()
		ctx.lock(false)
		ctx.arenaTargets = nil
	end
end

return A

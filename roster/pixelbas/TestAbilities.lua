-- PixelBellTest.TestAbilities (TEST, 2026-11-26): three live abilities in the first level of Pixel BAS, to try them in
-- the real game. Keys 1/2/3 on the Bell Test map:
--   1  Madara (Flashback) - Perfect Susanoo: grip at the scabbard, the point leaving it, a side cut, a floor wave
--   2  Sasuke (Kage Summit) - Susanoo Arrow: nock, draw, aim, loose; the arrow flies on its own
--   3  Itachi - Yata Mirror Defense: a full guard; the kunai of the throwing post end on the mirror's face
-- The moves are the live moves of the roster (pixelfx/src/fx/live, LiveData for timing, anchors and hits); here they
-- play as camera-facing cards in the stage's 2.5D view, facing left or right with the player, and their hits are
-- checked against where the straw targets stand on the map at that moment (a target out of the cut's band is missed).
-- The pixels are embedded in the place (Packs: zstd + base64 in StringValues, like PixelBASItachiAnimations) and
-- written into an EditableImage per card, frame by frame: no image upload, no asset ownership across accounts.
-- Everything is local (the stage runs on the client). mount(ctx) -> cleanup().
local RunService = game:GetService("RunService")
local Input = game:GetService("UserInputService")
local SoundService = game:GetService("SoundService")
local AssetService = game:GetService("AssetService")
local EncodingService = game:GetService("EncodingService")
local Players = game:GetService("Players")

local LIVE = require(script:WaitForChild("LiveData"))
local PACKS = script:WaitForChild("Packs")
local T = {}

-- one book's frames: "LIVE", u16 count, then per frame u16 x, y, w, h (in its cell) and w*h*4 RGBA bytes
local packCache = {}
local function loadPack(folder)
	if packCache[folder] then return packCache[folder] end
	local parts, i = {}, 1
	while folder:FindFirstChild(("P%03d"):format(i)) do parts[i] = folder[("P%03d"):format(i)].Value; i += 1 end
	local raw = EncodingService:DecompressBuffer(EncodingService:Base64Decode(buffer.fromstring(table.concat(parts))), Enum.CompressionAlgorithm.Zstd)
	assert(buffer.readstring(raw, 0, 4) == "LIVE", "live pack format")
	local n, o, frames = buffer.readu16(raw, 4), 6, {}
	for k = 1, n do
		local x, y, w, h = buffer.readu16(raw, o), buffer.readu16(raw, o + 2), buffer.readu16(raw, o + 4), buffer.readu16(raw, o + 6)
		o += 8
		frames[k] = { x = x, y = y, w = w, h = h, off = o }
		o += w * h * 4
	end
	local pack = { raw = raw, frames = frames }
	packCache[folder] = pack
	return pack
end
-- attach each book of the live data to its pack
for id, def in pairs(LIVE) do
	local f = PACKS:FindFirstChild(id)
	if f then
		def.actor.packFolder = f:FindFirstChild("actor")
		for k, b in pairs(def.fx) do b.packFolder = f:FindFirstChild("fx_" .. k) end
	end
end

-- the live moves are drawn for 72 px tall fighters; Itachi on this map is ~10.7 studs tall
local SPP = 10.7 / 72
local MOVES = {
	{ key = Enum.KeyCode.One, id = "madara-perfect-susanoo", who = "MADARA", name = "PERFECT SUSANOO", zoom = 1.55, lift = 18 },
	{ key = Enum.KeyCode.Two, id = "sasuke-susanoo-arrow-summit", who = "SASUKE", name = "SUSANOO-PFEIL", zoom = 1.15, lift = 6 },
	{ key = Enum.KeyCode.Three, id = "itachi-yata-mirror", who = "ITACHI", name = "YATA-SPIEGEL", zoom = 1.15, lift = 6 },
}
local SFX = {
	punch = 9114457006, parry = 9114457006, block = 9113483651, kick = 9113522776, heavy = 9113569832, whoosh = 9120972444,
	step = 9120972444, land = 9113524242, clash = 9113569832, rumble = 9114502756, cast = 9120972321, explosion = 9114362918,
}

function T.mount(ctx)
	local O, Config, folder = ctx.origin, ctx.config, ctx.folder
	local COS = math.cos(Config.CAM_PITCH)
	local conns, alive = {}, true
	local cast = nil -- the ability playing now
	local lastFace = 1
	local books, projs, kunais, pops = {}, {}, {}, {}

	local function sfx(tag)
		local id = SFX[tag]
		if not id then return end
		local s = Instance.new("Sound")
		s.SoundId = "rbxassetid://" .. id
		s.Volume = 0.6
		s.Parent = SoundService
		s:Play()
		task.delay(2, function() s:Destroy() end)
	end
	local function ground(p) return ctx.map.HeightAt(p.X, p.Y) end

	-- a camera-facing card standing at a point of the map: feet (or the book's pivot) at x, z; lift (px) raises it
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
	-- the frame's pixels into the card's own EditableImage (made at the book's cell size on first use), then mirrored
	-- by the image rect when facing left
	local function placeBook(card, book, frame, x, z, face, lift)
		if card.book ~= book then
			if card.ei then card.ei:Destroy() end
			card.ei = AssetService:CreateEditableImage({ Size = Vector2.new(book.cw, book.ch) })
			card.buf = buffer.create(book.cw * book.ch * 4)
			card.img.ImageContent = Content.fromObject(card.ei)
			card.book, card.frame = book, nil
		end
		if card.frame ~= frame and book.packFolder then
			local pack = loadPack(book.packFolder)
			local f = pack.frames[math.clamp(frame, 1, #pack.frames)]
			buffer.fill(card.buf, 0, 0)
			local row = f.w * 4
			for yy = 0, f.h - 1 do buffer.copy(card.buf, ((f.y + yy) * book.cw + f.x) * 4, pack.raw, f.off + yy * row, row) end
			card.ei:WritePixelsBuffer(Vector2.zero, Vector2.new(book.cw, book.ch), card.buf)
			card.frame = frame
		end
		local flip = face < 0
		card.img.ImageRectOffset = Vector2.new(flip and book.cw or 0, 0)
		card.img.ImageRectSize = Vector2.new(flip and -book.cw or book.cw, book.ch)
		card.bb.Size = UDim2.fromScale(book.cw * SPP, book.ch * SPP)
		-- the card is screen-aligned: its centre sits (pivot -> centre) away from the feet; up on screen is world up / cos
		local cx = face * (book.cw / 2 - book.pivot[1]) * SPP
		local cy = ((book.pivot[2] - book.ch / 2) * SPP + (lift or 0) * SPP) / COS
		card.bb.StudsOffsetWorldSpace = Vector3.new(cx, cy, 0)
		local p = Vector2.new(x, z)
		card.anchor.Position = O + Vector3.new(x, ground(p), z)
	end
	local function kill(card)
		if not card then return end
		if card.ei then card.ei:Destroy(); card.ei = nil end
		if card.anchor then card.anchor:Destroy() end
	end
	-- warm the packs up in the background (the decompress takes a moment the first time)
	task.spawn(function()
		for _, def in pairs(LIVE) do
			if def.actor.packFolder then loadPack(def.actor.packFolder); task.wait() end
			for _, b in pairs(def.fx) do if b.packFolder then loadPack(b.packFolder) end end
		end
	end)

	---------------------------------------------------------------- the straw targets and the throwing post
	-- drawn here pixel by pixel (no upload): a post, a straw body with a red target ring, a sack head with crossed eyes
	local function dummyImage(thrower)
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
		rect(5, 16, 20, 40, straw); rect(5, 16, 6, 40, strawD); rect(19, 16, 20, 40, strawD)
		for y = 18, 40, 3 do put(8, y, strawD); put(16, y + 1, strawD) end
		for a = 0, 35 do local t = a / 36 * math.pi * 2; put(13 + math.round(math.cos(t) * 4), 28 + math.round(math.sin(t) * 4), red) end
		put(13, 28, red)
		rect(7, 2, 18, 15, sack); rect(7, 2, 8, 15, strawD)
		for i = 0, 2 do put(9 + i, 6 + i, ink); put(11 - i, 6 + i, ink); put(14 + i, 6 + i, ink); put(16 - i, 6 + i, ink) end
		rect(10, 12, 15, 12, ink)
		if thrower then rect(5, 34, 20, 36, { 60, 90, 200 }); rect(22, 18, 25, 19, { 200, 205, 215 }) end
		-- outline
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
	local start = ctx.map.Start
	local targets = {}
	local function addTarget(dx, dz, thrower)
		local image, W, H = dummyImage(thrower)
		local card = newCard(1)
		card.img.ImageContent = Content.fromObject(image)
		local s = 10.7 / 72 * 1.25
		card.bb.Size = UDim2.fromScale(W * s, H * s)
		card.bb.StudsOffsetWorldSpace = Vector3.new(0, (H / 2 - 1) * s / COS, 0)
		local p = start + Vector2.new(dx, dz)
		card.anchor.Position = O + Vector3.new(p.X, ground(p), p.Y)
		local t = { p = p, card = card, image = image, thrower = thrower, hp = 0, shake = 0, next = os.clock() + 3 }
		table.insert(targets, t)
		return t
	end
	addTarget(96, 0, true)
	-- the straw targets themselves belong to the arena (server-side, PixelArena): the same dummies the summons hit
	local actx = nil
	local function each()
		local list = {}
		if actx and actx.arenaTargets then for _, t in ipairs(actx.arenaTargets()) do table.insert(list, t) end end
		for _, t in ipairs(targets) do table.insert(list, t) end
		return list
	end

	-- a word over a target (or over the player) for a moment
	local function pop(x, z, text, color)
		local card = newCard(5)
		card.img:Destroy()
		local l = Instance.new("TextLabel")
		l.BackgroundTransparency, l.Size, l.Font, l.TextScaled = 1, UDim2.fromScale(1, 1), Enum.Font.Arcade, true
		l.Text, l.TextColor3, l.TextStrokeTransparency = text, color or Color3.new(1, 1, 1), 0.2
		l.Parent = card.bb
		card.bb.Size = UDim2.fromScale(14, 3)
		card.anchor.Position = O + Vector3.new(x, ground(Vector2.new(x, z)), z)
		table.insert(pops, { card = card, l = l, t = 0 })
	end
	local function struck(t, dmg, how)
		t.shake = 0.35
		t.card.img.ImageColor3 = Color3.new(1, 0.6, 0.6)
		pop(t.p.X, t.p.Y, how or ("-" .. dmg), Color3.fromRGB(255, 106, 90))
		ctx.shake(1.2, 0.25)
	end

	---------------------------------------------------------------- playing an ability
	local function anchorOf(c, name)
		local fr = math.clamp(math.floor((os.clock() - c.t0) * c.def.fps) + 1, 1, #c.def.actor.anchors)
		local a = c.def.actor.anchors[fr][name]
		if not a then return nil end
		return c.x0 + c.face * a[1] * SPP, -a[2]
	end
	local function spawnBook(book, x, z, face, lift, opts)
		local card = newCard(3)
		if opts and opts.tint then card.img.ImageColor3 = opts.tint end
		local b = { book = book, card = card, t = 0, x = x, z = z, face = face, lift = lift or 0, vx = opts and opts.vx or 0, life = opts and opts.life }
		placeBook(card, book, 1, x, z, face, b.lift)
		table.insert(books, b)
		return b
	end
	local function hitBox(c, h)
		local best, contact = nil, nil
		for _, t in ipairs(each()) do
			local rel = (t.p.X - c.x0) * c.face
			if rel >= h.x0 * SPP and rel <= h.x1 * SPP and math.abs(t.p.Y - c.z) < 9 then best = t; break end
		end
		if best then
			struck(best, 26)
			contact = best.p.X
		else
			local tx = anchorOf(c, h.contact or "tip")
			contact = tx or (c.x0 + c.face * h.x1 * SPP)
			pop(contact, c.z, "VERFEHLT", Color3.fromRGB(192, 196, 224))
		end
		c.contact = contact
		c.boxHit = best
	end
	local function runWave(c, h)
		local wx, t1, done = c.contact or c.x0, os.clock() + h.life, { [c.boxHit or 0] = true }
		task.spawn(function()
			local last = os.clock()
			while alive and os.clock() < t1 do
				task.wait()
				local dt = os.clock() - last
				last = os.clock()
				wx += c.face * h.vx * SPP * dt
				for _, t in ipairs(each()) do
					if not done[t] and math.abs(t.p.Y - c.z) < 6 and math.abs(wx - t.p.X) < h.w * SPP then done[t] = true; struck(t, 9) end
				end
			end
		end)
	end
	local function runArrow(c, h)
		local book = c.def.fx[h.name]
		local ap = h.anchorPos or { 30, -50 }
		local P = { x = c.x0 + c.face * ap[1] * SPP, lift = -ap[2], vx = c.face * h.vx * SPP, t = 0, life = h.life, card = newCard(4), book = book, c = c }
		placeBook(P.card, book, 1, P.x, c.z + 0.4, c.face, P.lift)
		table.insert(projs, P)
	end
	local function startCast(m)
		if cast or not alive then return end
		local def = LIVE[m.id]
		if not def then return end
		local facing = ctx.facing()
		if facing == 2 then lastFace = -1 elseif facing == 3 then lastFace = 1 end
		local p = ctx.pos()
		local c = { m = m, def = def, x0 = p.X, z = p.Y, face = lastFace, done = {}, sfx = {}, hitsDone = {}, card = newCard(2) }
		c.card.bb.Enabled = false
		cast = c
		ctx.lock(true)
		ctx.say(m.who .. ": " .. m.name)
		-- a big manifestation: the camera eases back (no cut) so the whole Susanoo and the target are in the frame
		if ctx.camera then ctx.camera(m.zoom, m.lift) end
		task.spawn(function()
			-- the pixels are in the place: decode them (once) before the clock starts, so frame 1 is really on screen
			if def.actor.packFolder then loadPack(def.actor.packFolder) end
			for _, b in pairs(def.fx) do if b.packFolder then loadPack(b.packFolder) end end
			if cast ~= c then return end
			c.t0 = os.clock()
			c.card.bb.Enabled = true
			ctx.hidePlayer(true)
		end)
	end
	local function endCast()
		local c = cast
		if not c then return end
		kill(c.card)
		cast = nil
		ctx.hidePlayer(false)
		ctx.lock(false)
		ctx.say(nil)
		if ctx.camera then ctx.camera(nil) end
	end
	local function guardUp()
		if not cast or not cast.t0 then return nil end
		for _, h in ipairs(cast.def.hits) do
			if h.shape == "self" then
				local age = os.clock() - cast.t0
				if age >= h.t and age <= (h["until"] or cast.def.len) then return h end
			end
		end
		return nil
	end

	local function step(dt)
		if cast and cast.t0 then
			local c, age = cast, os.clock() - cast.t0
			placeBook(c.card, c.def.actor, math.min(c.def.actor.frames, math.floor(age * c.def.fps) + 1), c.x0, c.z, c.face, 0)
			for i, e in ipairs(c.def.sfx) do if not c.sfx[i] and age >= e[1] then c.sfx[i] = true; sfx(e[2]) end end
			for i, h in ipairs(c.def.hits) do
				if not c.hitsDone[i] and age >= h.t then
					c.hitsDone[i] = true
					if h.shape == "box" then hitBox(c, h)
					elseif h.shape == "wave" then runWave(c, h)
					elseif h.shape == "projectile" then runArrow(c, h) end
				end
			end
			for i, sp in ipairs(c.def.spawns) do
				if not c.done[i] and age >= sp.t and not sp.projectile and string.sub(sp.at, 1, 7) == "contact" and c.contact then
					c.done[i] = true
					local groundFx = string.find(sp.at, "ground") ~= nil
					spawnBook(c.def.fx[sp.fx], c.contact, c.z + 0.5, c.face, groundFx and 0 or 26, { vx = sp.vx and sp.vx * SPP, life = sp.life })
				end
			end
			if age > c.def.len + 0.05 then endCast() end
		end
		for i = #books, 1, -1 do
			local b = books[i]
			b.t += dt
			b.x += b.vx * b.face * dt
			local n = math.floor(b.t * 20)
			if (b.life and b.t > b.life) or (not b.book.loop and n >= b.book.frames) then kill(b.card); table.remove(books, i)
			else placeBook(b.card, b.book, b.book.loop and (n % b.book.frames) + 1 or n + 1, b.x, b.z, b.face, b.lift) end
		end
		-- the arrow: flies on, ends in the first target in its lane
		for i = #projs, 1, -1 do
			local P = projs[i]
			P.t += dt
			P.x += P.vx * dt
			local hit = nil
			for _, t in ipairs(each()) do if math.abs(t.p.Y - P.c.z) < 5 and (t.p.X - P.x) * (P.vx >= 0 and 1 or -1) <= 0.6 and (t.p.X - (P.x - P.vx * dt)) * (P.vx >= 0 and 1 or -1) > -0.6 then hit = t end end
			if hit or P.t > P.life then
				kill(P.card)
				table.remove(projs, i)
				if hit then
					struck(hit, 18)
					local hb = P.c.def.onHit and P.c.def.fx[P.c.def.onHit.fx]
					if hb then spawnBook(hb, P.x, P.c.z + 0.6, 1, P.lift) end
				else pop(P.x, P.c.z, "VERFEHLT", Color3.fromRGB(192, 196, 224)) end
			else
				placeBook(P.card, P.book, (math.floor(P.t * 20) % P.book.frames) + 1, P.x, P.c.z + 0.4, P.vx >= 0 and 1 or -1, P.lift)
			end
		end
		-- the throwing post: a kunai at the player when he stands in its lane; the Yata guard stops it at the mirror
		local me = ctx.pos()
		for _, t in ipairs(targets) do
			if t.shake > 0 then
				t.shake -= dt
				t.card.img.Rotation = math.sin(t.shake * 60) * 6 * t.shake / 0.35
				if t.shake <= 0 then t.card.img.Rotation = 0; t.card.img.ImageColor3 = Color3.new(1, 1, 1) end
			end
			if t.thrower and os.clock() > t.next and math.abs(me.Y - t.p.Y) < 10 and math.abs(me.X - t.p.X) < 130 and math.abs(me.X - t.p.X) > 8 then
				t.next = os.clock() + 2.4
				local dir = me.X < t.p.X and -1 or 1
				local card = newCard(4)
				local W, H = 14, 5
				local ki = AssetService:CreateEditableImage({ Size = Vector2.new(W, H) })
				local b = buffer.create(W * H * 4)
				local function put(x, y, c) local k = (y * W + x) * 4; buffer.writeu8(b, k, c[1]); buffer.writeu8(b, k + 1, c[2]); buffer.writeu8(b, k + 2, c[3]); buffer.writeu8(b, k + 3, 255) end
				for x = 0, 8 do put(x, 2, { 210, 214, 228 }) end
				for x = 2, 7 do put(x, 1, { 150, 156, 176 }); put(x, 3, { 150, 156, 176 }) end
				for x = 9, 12 do put(x, 2, { 70, 40, 30 }) end
				put(13, 1, { 200, 190, 80 }); put(13, 3, { 200, 190, 80 }); put(13, 2, { 200, 190, 80 })
				ki:WritePixelsBuffer(Vector2.zero, Vector2.new(W, H), b)
				card.img.ImageContent = Content.fromObject(ki)
				card.img.ImageRectSize = Vector2.new(dir > 0 and -W or W, H)
				card.img.ImageRectOffset = Vector2.new(dir > 0 and W or 0, 0)
				card.bb.Size = UDim2.fromScale(W * SPP * 1.6, H * SPP * 1.6)
				card.bb.StudsOffsetWorldSpace = Vector3.new(0, 6 / COS, 0)
				table.insert(kunais, { card = card, image = ki, x = t.p.X + dir * 2, z = t.p.Y + 0.3, vx = dir * 70, t = 0 })
				sfx("whoosh")
			end
		end
		for i = #kunais, 1, -1 do
			local k = kunais[i]
			k.t += dt
			k.x += k.vx * dt
			k.card.anchor.Position = O + Vector3.new(k.x, ground(Vector2.new(k.x, k.z)), k.z)
			local dirToMe = (me.X - k.x) * (k.vx >= 0 and 1 or -1)
			local guard = guardUp()
			local ended = nil
			if guard and cast and math.abs(cast.z - k.z) < 10 then
				-- the mirror's face: reach px in front of the caster, toward the kunai
				local faceX = cast.x0 + cast.face * (guard.reach or 26) * SPP
				if (faceX - k.x) * (k.vx >= 0 and 1 or -1) <= 0 then
					ended = "blocked"
					local mx, lift = anchorOf(cast, "mirror")
					local fx = cast.def.onBlock and cast.def.fx[cast.def.onBlock.fx]
					if fx then spawnBook(fx, mx or faceX, cast.z + 0.6, cast.face, lift or 60, { tint = Color3.fromHex("#c8d4ff") }) end
					pop(faceX, cast.z, "GEBLOCKT", Color3.fromRGB(224, 224, 255))
					sfx("block")
				end
			end
			if not ended and math.abs(me.Y - k.z) < 6 and dirToMe <= 0 then
				ended = "hit"
				pop(me.X, me.Y, "TREFFER", Color3.fromRGB(255, 106, 90))
				ctx.shake(1.5, 0.25)
				sfx("punch")
			end
			if ended or k.t > 3 then kill(k.card); k.image:Destroy(); table.remove(kunais, i) end
		end
		for i = #pops, 1, -1 do
			local q = pops[i]
			q.t += dt
			-- just over a head (a figure here is ~11 studs tall), rising a little
			q.card.bb.StudsOffsetWorldSpace = Vector3.new(0, (12 + q.t * 3) / COS, 0)
			q.l.TextTransparency = math.clamp((q.t - 0.6) / 0.4, 0, 1)
			if q.t > 1 then kill(q.card); table.remove(pops, i) end
		end
	end
	table.insert(conns, RunService.Heartbeat:Connect(function(dt) if alive then step(dt) end end))
	-- the live moves are started from a variant's slot (PixelArena's panel: keys 1-4 of the chosen variant)
	local function liveCast(id)
		for _, m in ipairs(MOVES) do if m.id == id then startCast(m); return true end end
		return false
	end
	local arenaCleanup = nil
	local ArenaModule = game:GetService("ReplicatedStorage"):FindFirstChild("PixelArena")
	if ArenaModule then
		actx = { folder = folder, origin = O, start = ctx.map.Start, pitch = Config.CAM_PITCH,
			ground = function(m) return ctx.map.HeightAt(m.X, m.Y) end, pos = ctx.pos, facing = ctx.facing,
			lock = ctx.lock, say = ctx.say, shake = ctx.shake, liveCast = liveCast, place = ctx.place }
		local ok, err = pcall(function() arenaCleanup = require(ArenaModule).mount(actx) end)
		if not ok then warn("PixelArena: " .. tostring(err)) end
	else
		table.insert(conns, Input.InputBegan:Connect(function(input, processed)
			if processed or Input:GetFocusedTextBox() then return end
			for _, m in ipairs(MOVES) do if input.KeyCode == m.key then startCast(m) end end
		end))
	end

	-- the key hint, bottom left
	local hint = Instance.new("ScreenGui")
	hint.Name, hint.ResetOnSpawn, hint.DisplayOrder = "PixelTestAbilities", false, 50
	local box = Instance.new("TextLabel")
	box.Size, box.Position, box.AnchorPoint = UDim2.fromOffset(560, 64), UDim2.new(0, 16, 1, -96), Vector2.new(0, 1)
	box.BackgroundColor3, box.BackgroundTransparency, box.BorderSizePixel = Color3.fromRGB(16, 18, 38), 0.15, 0
	box.Font, box.TextSize, box.TextColor3, box.TextXAlignment = Enum.Font.Arcade, 18, Color3.fromRGB(240, 238, 228), Enum.TextXAlignment.Left
	box.Text = ArenaModule and "  TRAINING: VARIANTE MIT [ ] WAEHLEN, SLOTS 1-4\n  R WIEDERH.  Q ABBRUCH  P PAUSE  T ZEITLUPE  F EINZELBILD\n  ZIELE RECHTS VOM START (SERVER)" or "  TEST-FAEHIGKEITEN\n  1 PERFECT SUSANOO (MADARA)   2 SUSANOO-PFEIL (SASUKE)\n  3 YATA-SPIEGEL (ITACHI)  -  ZIELE RECHTS VOM START"
	box.Parent = hint
	hint.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")

	return function()
		alive = false
		for _, c in ipairs(conns) do c:Disconnect() end
		if cast then kill(cast.card) end
		cast = nil
		for _, b in ipairs(books) do kill(b.card) end
		for _, P in ipairs(projs) do kill(P.card) end
		for _, k in ipairs(kunais) do kill(k.card); k.image:Destroy() end
		for _, q in ipairs(pops) do kill(q.card) end
		for _, t in ipairs(targets) do kill(t.card); t.image:Destroy() end
		hint:Destroy()
		if arenaCleanup then pcall(arenaCleanup) end
		ctx.hidePlayer(false)
		ctx.lock(false)
		if ctx.camera then ctx.camera(nil) end
	end
end

return T

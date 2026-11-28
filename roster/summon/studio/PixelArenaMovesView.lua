-- PixelArena.MovesView (2026-11-27): draws the roster's own techniques (kind "arena") from the server's attributes.
-- A move's look (Defs.moves[id].look) is a list of layers; each layer is one effect book shown at one place while the
-- move is in some phases:
--   at       caster | hand | aim | blast | proj | impact | tip | grab | zone | line | link | clone | block | swap | heal |
--            target (the acquired target) | land
--   book     the pack's name; views = true: the book has _side/_front/_back drawings and the one matching the move's
--            direction is shown (the side one mirrored for a move to the left)
--   ground   a floor decal (turned to the move's direction when rotate = true)
--   rotate   (billboard) the picture is turned along the direction on screen
--   phases   { ... } shown only then (default: always while the stage runs); stage = n: only in that stage
--   play     "loop" (default for looping books), "once" (from the phase / event start), "hold" (once, then its last frame)
--   lift     px above the floor (the sprites' scale: 72 px is a fighter); seg = studs between pieces along a line / link
--   alpha    transparency
-- The caster's own sprite comes from the game: the move turns it to the cast direction, moves it for rushes, blinks and
-- leaps (and lifts it for a leap), and copies it for clones.
return function(H)
	local A = {}
	local show, showFloor, newCard, newFloor, kill, hide = H.show, H.showFloor, H.newCard, H.newFloor, H.kill, H.hide
	local loadPack, viewOf, toMap, pop, sfx, addLog, dirName, ctx = H.loadPack, H.viewOf, H.toMap, H.pop, H.sfx, H.addLog, H.dirName, H.ctx
	local SPP = H.SPP

	-- the game's player sprite (for leaps and clones): found once
	local playerGui
	local function findPlayerGui()
		if playerGui and playerGui.Parent then return playerGui end
		for _, d in ipairs(workspace:GetDescendants()) do
			if d:IsA("BillboardGui") and d.Name == "ItachiSprite" then playerGui = d; return d end
		end
		return nil
	end
	local function facingIndex(d)
		if math.abs(d.Y) > math.abs(d.X) then return d.Y > 0 and 0 or 1 end
		return d.X < 0 and 2 or 3
	end

	local function attrV(f, a, b) local x, z = f:GetAttribute(a), f:GetAttribute(b); if x and z then return Vector2.new(x, z) end; return nil end

	function A.new(f)
		local v = { f = f, kind = "arena", pools = {}, said = {}, popped = {}, clones = {} }
		return v
	end
	-------------------------------------------------------------- debug view (panel DEBUG / ArenaTest "debug")
	local DBG = { origin = Color3.fromRGB(80, 255, 120), aim = Color3.fromRGB(255, 70, 70), zone = Color3.fromRGB(255, 220, 60), line = Color3.fromRGB(120, 200, 255) }
	local function dpart(v, i)
		v.dbg = v.dbg or {}
		local p = v.dbg[i]
		if not p then
			p = Instance.new("Part")
			p.Anchored, p.CanCollide, p.CanQuery, p.CanTouch, p.CastShadow, p.Material = true, false, false, false, false, Enum.Material.Neon
			p.Parent = H.folder
			v.dbg[i] = p
		end
		p.Transparency = 0.55
		return p
	end
	local function floorY(m) return (H.groundAt and H.groundAt(m) or 0) + 0.15 end
	-- a disc of radius r (studs) at a map point
	local function disc(v, i, m, r, color)
		local p = dpart(v, i)
		p.Shape = Enum.PartType.Cylinder
		p.Size = Vector3.new(0.08, r * 2, r * 2)
		p.CFrame = CFrame.new(H.origin + Vector3.new(m.X, floorY(m), m.Y)) * CFrame.Angles(0, 0, math.pi / 2)
		p.Color = color
	end
	-- a band from map point a along d, length len, half width w
	local function bandPart(v, i, a, d, len, w, color)
		local p = dpart(v, i)
		p.Shape = Enum.PartType.Block
		local mid = a + d * (len / 2)
		p.Size = Vector3.new(math.max(0.1, w * 2), 0.08, math.max(0.1, len))
		p.CFrame = CFrame.lookAt(H.origin + Vector3.new(mid.X, floorY(mid), mid.Y), H.origin + Vector3.new(mid.X + d.X, floorY(mid), mid.Y + d.Y))
		p.Color = color
	end
	function A.debug(v, f, M, st, phase, cpos, adir, aim, ending)
		local n = 0
		if H.debug and H.debug() and not ending then
			local function nx() n += 1; return n end
			local c, a = toMap(cpos.X, cpos.Y), toMap(aim.X, aim.Y)
			disc(v, nx(), c, 0.6, DBG.origin)
			disc(v, nx(), a, 0.5, DBG.aim)
			local d = (a - c)
			if d.Magnitude > 0.3 then bandPart(v, nx(), c, d.Unit, d.Magnitude, 0.08, DBG.line) end
			local m = st.mech
			local function attr(x, z) local X, Z = f:GetAttribute(x), f:GetAttribute(z); return X and toMap(X, Z) end
			if m == "shot" then
				for i = 1, f:GetAttribute("NP") or 0 do if f:GetAttribute("P" .. i .. "S") == "fly" then disc(v, nx(), attr("P" .. i .. "X", "P" .. i .. "Z"), st.radius or 1.6, DBG.zone) end end
				if phase == "tell" then bandPart(v, nx(), c, adir, st.reach or st.range or 30, st.radius or 1.6, DBG.zone) end
			elseif m == "line" and f:GetAttribute("L") then
				local o = attr("LX", "LZ"); local ld = Vector2.new(f:GetAttribute("LDX"), f:GetAttribute("LDZ"))
				bandPart(v, nx(), o, ld, math.max(0.2, f:GetAttribute("L")), st.width or 2, DBG.zone)
			elseif m == "line" and phase == "tell" then bandPart(v, nx(), c, adir, st.len or 30, st.width or 2, DBG.zone)
			elseif m == "blast" then local b = attr("BX", "BZ") or (st.at == "self" and c or a); disc(v, nx(), b, st.radius or 5, DBG.zone)
			elseif m == "rush" then
				if st.leap then disc(v, nx(), attr("LandX", "LandZ") or a, st.radius or 5, DBG.zone) else disc(v, nx(), c, st.reach or 2.4, DBG.zone) end
			elseif m == "bind" then local t = attr("TX", "TZ"); if t then disc(v, nx(), t, st.radius or 1.6, DBG.zone) end
			elseif m == "zone" then local z = attr("ZX", "ZZ") or (st.at == "self" and c or a); disc(v, nx(), z, st.radius or 6, DBG.zone)
			elseif m == "guard" or (m == "heal" and st.self) or m == "buff" then disc(v, nx(), c, st.radius or st.pulse or 3, DBG.zone)
			elseif m == "state" then
				local R, half = st.reach or 26, math.rad(st.sight or 25)
				for _, s in ipairs({ -1, 1 }) do local e = Vector2.new(adir.X * math.cos(half * s) - adir.Y * math.sin(half * s), adir.X * math.sin(half * s) + adir.Y * math.cos(half * s)); bandPart(v, nx(), c, e, R, 0.1, DBG.zone) end
			elseif m == "clones" then for i = 1, f:GetAttribute("NC") or 0 do local k = attr("K" .. i .. "X", "K" .. i .. "Z"); if k then disc(v, nx(), k, st.reach or 2.2, DBG.zone) end end
			elseif m == "blink" then disc(v, nx(), c, st.strike or 3, DBG.zone) end
		end
		if v.dbg then for i = n + 1, #v.dbg do v.dbg[i].Transparency = 1 end end
	end

	function A.kill(v)
		if v.dbg then for _, p in ipairs(v.dbg) do p:Destroy() end end
		for _, pool in pairs(v.pools) do for _, c in ipairs(pool) do kill(c) end end
		for _, k in pairs(v.clones) do if k.anchor then k.anchor:Destroy() end end
		if v.lifted then local g = findPlayerGui(); if g then g.StudsOffsetWorldSpace = v.lifted end end
	end
	local function card(v, li, i, floor)
		local pool = v.pools[li]
		if not pool then pool = {}; v.pools[li] = pool end
		local c = pool[i]
		if not c then c = floor and newFloor() or newCard(3); pool[i] = c end
		return c
	end
	local function hideFrom(v, li, from)
		local pool = v.pools[li]
		if pool then for i = from, #pool do hide(pool[i]) end end
	end
	local function frameAt(pack, L, t)
		local m = pack.meta
		if (L.play == "once" or L.play == "hold") then
			local k = math.floor(t * m.fps) + 1
			if k > m.frames then return L.play == "hold" and m.frames or nil end
			return math.max(1, k)
		end
		return math.floor(t * m.fps) % m.frames + 1
	end
	local function inPhase(L, phase, stage)
		if L.stage and L.stage ~= stage then return false end
		if not L.phases then return true end
		for _, p in ipairs(L.phases) do if p == phase then return true end end
		return false
	end
	local function screenRot(d) return math.deg(math.atan2(d.Y * math.sin(ctx.pitch), d.X)) end
	-- the book for a direction (views = true: the matching drawing, mirrored for the left)
	local function bookFor(L, d)
		if not L.views then return loadPack(L.book), 1 end
		local view, face = viewOf(math.atan2(d.Y, d.X))
		if view == "side" and face < 0 then local left = loadPack(L.book .. "_left"); if left then return left, 1 end end
		return loadPack(L.book .. "_" .. view), face
	end
	local function put(v, li, i, L, m, d, t)
		local pack, face = bookFor(L, d)
		if not pack then return false end
		local k = frameAt(pack, L, t)
		if not k then return false end
		if L.ground then
			local c = card(v, li, i, true)
			local h = L.rotate and math.atan2(d.Y, d.X) or 0
			showFloor(c, pack, k, m, h, L.rotate and d.X < 0 and math.abs(d.Y) < math.abs(d.X) and false or false, L.alpha or 0)
		else
			local c = card(v, li, i, false)
			show(c, pack, k, m, face, L.lift or 0, false, L.depth or 0.2)
			c.img.Rotation = L.rotate and screenRot(d) or 0
			c.img.ImageTransparency = L.alpha or 0
		end
		return true
	end

	function A.step(v)
		local f = v.f
		local M = H.Defs.moves[f:GetAttribute("Move")]
		local T, phase, PT = f:GetAttribute("T") or 0, f:GetAttribute("Phase") or "seal", f:GetAttribute("PT") or 0
		local stage = f:GetAttribute("Stage") or 1
		local u = T - PT
		local cx, cz, dx, dz = f:GetAttribute("X"), f:GetAttribute("Z"), f:GetAttribute("DX"), f:GetAttribute("DZ")
		local mine = f:GetAttribute("Owner") == H.player.UserId
		local ending = phase == "done" or phase == "abort"
		local cpos = attrV(f, "CX", "CZ") or Vector2.new(cx, cz)
		local adir = attrV(f, "ADX", "ADZ") or Vector2.new(dx, dz)
		local aim = attrV(f, "AX", "AZ") or cpos
		local st = (M.stages and M.stages[stage]) or M

		-- the caster: turned to the move, carried along a rush / blink / leap
		if mine then
			if not v.signed then v.signed = true; if ctx.sign and M.sign ~= false then ctx.sign() end end
			local fi = facingIndex(adir)
			local pre = phase == "seal" or phase == "aim" or phase == "tell"
			local moved = v.lastC and (v.lastC - cpos).Magnitude > 0.05
			if not ending and ctx.place and (v.lastC == nil or moved or (pre and v.lastFacing ~= fi)) then
				ctx.place(toMap(cpos.X, cpos.Y), fi)
				v.lastFacing = fi
			end
			v.lastC = cpos
			local cy = f:GetAttribute("CY") or 0
			local g = findPlayerGui()
			if g then
				if cy > 0.05 and not ending then
					v.lifted = v.lifted or g.StudsOffsetWorldSpace
					g.StudsOffsetWorldSpace = v.lifted + Vector3.new(0, cy, 0)
				elseif v.lifted then g.StudsOffsetWorldSpace = v.lifted; v.lifted = nil end
			end
		end

		-- sounds and messages at phase changes
		if v.lastPhase ~= phase then
			local was = v.lastPhase
			v.lastPhase = phase
			local tag = M.sfx and M.sfx[phase]
			if tag then sfx(tag, 0.6) end
			if phase == "impact" and M.shake then ctx.shake(M.shake, 0.25) end
			if ending and mine then
				if phase == "abort" then addLog("abgebrochen (" .. tostring(was) .. ")")
				else
					local res = f:GetAttribute("Result")
					local extra = ""
					if (f:GetAttribute("Blocked") or 0) > 0 then extra = (" | ABGEWEHRT %d"):format(f:GetAttribute("Blocked")) end
					if (f:GetAttribute("Healed") or 0) > 0 then extra = extra .. (" | GEHEILT %s +%d"):format(f:GetAttribute("Heal") == "self" and "selbst" or f:GetAttribute("Heal"), f:GetAttribute("Healed")) end
					addLog(("%s | %s | %s%s"):format(v.who or "?", dirName(dx, dz),
						res == "hit" and ("TREFFER (" .. tostring(f:GetAttribute("HitKind")) .. ") " .. tostring(f:GetAttribute("HitName") or "")) or "VERFEHLT", extra))
				end
			end
		end
		local hitT = f:GetAttribute("HitT")
		if hitT and v.hitShown ~= hitT then
			v.hitShown = hitT
			local tg = H.targets[(tostring(f:GetAttribute("HitName") or "")):match("([^+]+)$") or ""]
			if tg and not v.popped[hitT] then v.popped[hitT] = true; pop(tg.p, M.hitPop or "TREFFER", Color3.fromRGB(255, 226, 120)); tg.shake = 0.3 end
		end
		if ending and f:GetAttribute("Result") == "miss" and not v.missPop then v.missPop = true; pop(toMap(aim.X, aim.Y), "VERFEHLT", Color3.fromRGB(192, 196, 224)) end

		-- the layers
		for li, L in ipairs(M.look or {}) do
			local n = 0
			local on = not ending and inPhase(L, phase, stage)
			if L.after and ending then on = u < L.after end
			if on then
				local at = L.at or "caster"
				local t0 = (L.play == "once" or L.play == "hold") and PT or 0
				if at == "caster" or at == "hand" then
					local m = cpos + (at == "hand" and adir * (L.handF or 1.6) or Vector2.zero)
					if put(v, li, 1, L, toMap(m.X, m.Y), adir, T - t0) then n = 1 end
				elseif at == "aim" then
					if put(v, li, 1, L, toMap(aim.X, aim.Y), adir, T - t0) then n = 1 end
				elseif at == "blast" or at == "zone" or at == "tip" or at == "land" or at == "swap" then
					local key = ({ blast = { "BX", "BZ" }, zone = { "ZX", "ZZ" }, tip = { "TX", "TZ" }, land = { "LandX", "LandZ" }, swap = { "SwX", "SwZ" } })[at]
					local m = attrV(f, key[1], key[2])
					local tt = T - t0
					if at == "blast" and L.play ~= "loop" then tt = T - (f:GetAttribute("WaveT") or T) end
					if m and put(v, li, 1, L, toMap(m.X, m.Y), adir, tt) then n = 1 end
				elseif at == "target" or at == "grab" or at == "heal" then
					local name = at == "target" and f:GetAttribute("Target") or at == "grab" and f:GetAttribute("Grab") or f:GetAttribute("Heal")
					local tg = name and H.targets[name]
					if at == "heal" and name == "self" then tg = { p = toMap(cpos.X, cpos.Y) } end
					if tg and put(v, li, 1, L, tg.p, adir, T - t0) then n = 1 end
				elseif at == "proj" then
					for i = 1, f:GetAttribute("NP") or 0 do
						if f:GetAttribute("P" .. i .. "S") == "fly" then
							local m = attrV(f, "P" .. i .. "X", "P" .. i .. "Z")
							local d = attrV(f, "P" .. i .. "DX", "P" .. i .. "DZ") or adir
							local lift = L.lift
							if st.arcH then local s = f:GetAttribute("P" .. i .. "D") or 0; local R = st.reach or st.range or 30; local q = math.clamp(s / R, 0, 1); L = table.clone(L); L.lift = (L.lift or 0) + st.arcH / SPP * 4 * q * (1 - q) end
							n += 1
							if not put(v, li, n, L, toMap(m.X, m.Y), d, T) then n -= 1 end
							L.lift = lift
						end
					end
				elseif at == "impact" or at == "block" then
					if at == "impact" then
						for i = 1, f:GetAttribute("NI") or 0 do
							local it = f:GetAttribute("I" .. i .. "T") or 0
							local m = attrV(f, "I" .. i .. "X", "I" .. i .. "Z")
							n += 1
							if not (m and put(v, li, n, L, toMap(m.X, m.Y), adir, T - it)) then n -= 1 end
						end
					else
						local bt, m = f:GetAttribute("BlkT"), attrV(f, "BlkX", "BlkZ")
						if bt and m and put(v, li, 1, L, toMap(m.X, m.Y), adir, T - bt) then n = 1 end
					end
				elseif at == "line" or at == "link" then
					local a, d, len
					if at == "line" then
						a = attrV(f, "LX", "LZ"); d = attrV(f, "LDX", "LDZ"); len = f:GetAttribute("L") or 0
					else
						a = cpos
						local tip = attrV(f, "TX", "TZ")
						if L.toGrab then local g = H.targets[f:GetAttribute("Grab") or ""]; tip = g and (g.p - H.START) or nil end
						if tip then d = (tip - a); len = d.Magnitude; d = len > 0.01 and d.Unit or adir end
					end
					if a and d and len and len > 0.2 then
						if L.head then
							-- one picture at the end (a dragon's head, the beam's tip)
							local m = a + d * len
							n = 1
							if not put(v, li, 1, L, toMap(m.X, m.Y), d, T) then n = 0 end
						else
							local seg = L.seg or 2
							local cnt = math.max(1, math.floor(len / seg))
							for i = 1, cnt do
								local m = a + d * ((i - 0.5) * len / cnt)
								n += 1
								if not put(v, li, n, L, toMap(m.X, m.Y), d, T + i * 0.07) then n -= 1 end
							end
						end
					end
				elseif at == "clone" then
					for i = 1, f:GetAttribute("NC") or 0 do
						local s = f:GetAttribute("K" .. i .. "S")
						if s ~= "wait" then
							local m = attrV(f, "K" .. i .. "X", "K" .. i .. "Z")
							n += 1
							if not (m and put(v, li, n, L, toMap(m.X, m.Y), adir, T)) then n -= 1 end
						end
					end
				end
			end
			hideFrom(v, li, n + 1)
		end

		-- clones: copies of the game's own sprite of the caster (shadow clones, afterimages)
		if M.cloneLook ~= false and (f:GetAttribute("NC") or 0) > 0 then
			local g = findPlayerGui()
			for i = 1, f:GetAttribute("NC") do
				local s = f:GetAttribute("K" .. i .. "S")
				local k = v.clones[i]
				if s == "run" or s == "strike" then
					if not k and g then
						local anchor = Instance.new("Part")
						anchor.Anchored, anchor.CanCollide, anchor.CanQuery, anchor.CanTouch, anchor.Transparency, anchor.Size = true, false, false, false, 1, Vector3.one
						anchor.Parent = H.folder
						local copy = g:Clone()
						copy.Adornee, copy.Parent = anchor, anchor
						-- a tinted copy (afterimages, a clone of lightning): cloneTint = { r, g, b }
						for _, d in ipairs(copy:GetDescendants()) do if d:IsA("ImageLabel") and M.cloneTint then d.ImageColor3 = Color3.fromRGB(M.cloneTint[1], M.cloneTint[2], M.cloneTint[3]); d.ImageTransparency = M.cloneAlpha or 0 end end
						k = { anchor = anchor, gui = copy }
						v.clones[i] = k
						sfx("poof", 0.3)
					end
					if k then
						local m = toMap(f:GetAttribute("K" .. i .. "X"), f:GetAttribute("K" .. i .. "Z"))
						local ref = g and g.Adornee
						local y = ref and ref:IsA("BasePart") and ref.Position.Y or 0
						k.anchor.Position = H.origin + Vector3.new(m.X, 0, m.Y) + Vector3.new(0, y - H.origin.Y, 0)
					end
				elseif k then k.anchor:Destroy(); v.clones[i] = nil end
			end
		end
		if v.locked and phase ~= "seal" and phase ~= "aim" and phase ~= "tell" then v.locked = false; ctx.lock(false) end
		A.debug(v, f, M, st, phase, cpos, adir, aim, ending)
	end
	return A
end

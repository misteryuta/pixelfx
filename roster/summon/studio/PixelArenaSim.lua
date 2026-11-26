-- PixelArena.Sim (2026-11-26): the authoritative simulation of the summon moves on a 2.5D stage, run by the server
-- (ServerScriptService.PixelArenaServer). Positions are studs on the stage floor relative to the map's start point:
-- x to the right, z toward the camera (screen down). Time is simulation time (the training panel can pause, slow
-- down or single-step it), so a frozen frame shows exactly what the server has decided at that moment.
-- State is written as attributes under ReplicatedStorage.PixelArenaState (Targets/*, Casts/*); the clients only draw.
local Sim = {}
Sim.__index = Sim

local function v2(x, z) return Vector2.new(x, z) end
local function angleOf(v) return math.atan2(v.Y, v.X) end

-- targets: straw dummies on the stage (the same places the Bell Test map shows them)
local HOLES = { bull = { -90, 4.6 }, uhei = { -140, 4.3 }, shiba = { -40, 4.3 }, akino = { 180, 4.1 }, urushi = { 0, 4.1 },
	guruko = { 140, 3.7 }, bisuke = { 40, 3.5 }, pakkun = { 90, 3.1 } }
local HOMES = { T1 = v2(30, 0), T2 = v2(52, 7), T3 = v2(30, 26) }

function Sim.new(state, defs)
	local self = setmetatable({ state = state, defs = defs, casts = {}, nextId = 1, targets = {} }, Sim)
	self.targetsFolder = state:FindFirstChild("Targets") or Instance.new("Folder")
	self.targetsFolder.Name = "Targets"
	self.targetsFolder.Parent = state
	self.castsFolder = state:FindFirstChild("Casts") or Instance.new("Folder")
	self.castsFolder.Name = "Casts"
	self.castsFolder.Parent = state
	state:SetAttribute("TimeScale", 1)
	state:SetAttribute("Paused", false)
	state:SetAttribute("SimT", 0)
	self.t = 0
	self:resetTargets()
	return self
end

function Sim:resetTargets()
	for name, home in pairs(HOMES) do
		local t = self.targets[name]
		if not t then
			local f = Instance.new("Configuration")
			f.Name = name
			f.Parent = self.targetsFolder
			t = { name = name, f = f }
			self.targets[name] = t
		end
		t.home, t.p, t.alive, t.held, t.hp, t.mode, t.phase = home, home, true, false, 100, "stand", 0
		self:writeTarget(t)
	end
end
function Sim:writeTarget(t)
	t.f:SetAttribute("X", t.p.X); t.f:SetAttribute("Z", t.p.Y)
	t.f:SetAttribute("Alive", t.alive); t.f:SetAttribute("Held", t.held); t.f:SetAttribute("Hp", t.hp); t.f:SetAttribute("Mode", t.mode)
end
-- test behaviours: stand, walk (back and forth across the cast lines), dodge (steps aside when the ground bulges
-- under it), removed (gone mid-cast)
function Sim:setTargetMode(name, mode)
	for n, t in pairs(self.targets) do
		if name == nil or n == name then
			if mode == "remove" then t.alive = false
			elseif mode == "reset" then t.alive, t.p, t.held, t.hp, t.mode, t.kbLeft, t.dodgeTo = true, t.home, false, 100, "stand", 0, nil
			else t.mode, t.alive, t.phase = mode, true, 0 end
			self:writeTarget(t)
		end
	end
end

-- test: put a target somewhere (walks into a landing, stands in a sweep)
function Sim:placeTarget(name, p)
	local t = self.targets[name]
	if t and typeof(p) == "Vector2" then t.p, t.dodgeTo, t.kbLeft = p, nil, 0; self:writeTarget(t) end
end

-- the first live target inside the cone in front of p, nearest first
function Sim:acquire(p, dir, range, coneDeg)
	local best, bd = nil, math.huge
	for _, t in pairs(self.targets) do
		if t.alive then
			local rel = t.p - p
			local d = rel.Magnitude
			if d > 0.5 and d <= range then
				local cosA = rel.Unit:Dot(dir)
				if cosA >= math.cos(math.rad(coneDeg)) and d < bd then best, bd = t, d end
			end
		end
	end
	return best
end

-- a cast of the Ninken Fanged Pursuit (Doton: Tsuiga no Jutsu)
function Sim:castNinken(owner, p, dir)
	local M = self.defs.moves["kakashi-ninken-tsuiga"]
	local id = self.nextId
	self.nextId += 1
	local f = Instance.new("Configuration")
	f.Name = "C" .. id
	local tgt = self:acquire(p, dir, M.range, M.cone)
	local c = { id = id, f = f, move = M.id, M = M, owner = owner, p = p, dir = dir, t = 0, phase = "seal", target = tgt,
		goal = tgt and tgt.p or (p + dir * M.missRange), dogs = {}, result = "" }
	-- eight dogs: each with its hole on a ring round the burst point (spread so they come from all sides)
	local n = #self.defs.dogs
	for i = 1, n do
		-- holes by size, fixed to the stage (z+ = toward the camera): Bull and the tall dogs behind the target, the
		-- small ones in front, so the caught target stays in sight between them
		local hole = HOLES[self.defs.dogs[i]] or { (i - 1) / n * 360, 4 }
		local a, r = math.rad(hole[1]), hole[2]
		-- they go under in a fan in front of him and spread out as they run (each its own line)
		local side = Vector2.new(-dir.Y, dir.X)
		c.dogs[i] = { a = a, r = r, pos = p + dir * 2.5 + side * (i - (n + 1) / 2) * 0.9, head = angleOf(dir) + (i - (n + 1) / 2) * 0.16 }
	end
	f:SetAttribute("Owner", owner); f:SetAttribute("Move", M.id)
	f:SetAttribute("X", p.X); f:SetAttribute("Z", p.Y); f:SetAttribute("DX", dir.X); f:SetAttribute("DZ", dir.Y)
	f:SetAttribute("Target", tgt and tgt.name or "")
	self.casts[id] = c
	self:writeCast(c)
	f.Parent = self.castsFolder
	return c
end

-- any summon move by its id (the kind decides the behaviour)
function Sim:cast(owner, moveId, p, dir)
	local M = self.defs.moves[moveId]
	if M.kind == "leap" then return self:castLeap(owner, M, p, dir) end
	return self:castNinken(owner, p, dir)
end

-- Gamabunta's Toad Sword Beheading (Gamadosuzan): appear behind the summoner, crouch and turn to the target, leap,
-- land (crush), draw, one sweep of the dosu from his left to his right (the blade's sweep is the hit zone)
local function snap4(a)
	return math.round(a / (math.pi / 2)) * (math.pi / 2)
end
-- his forward and his right on the floor for a heading (snapped to the four ways the sprites are drawn). Facing left
-- the profile is the mirrored right-facing one, so 'his right' is the side toward the camera, as on screen.
local function frame(h)
	local f = Vector2.new(math.cos(h), math.sin(h))
	local r = Vector2.new(-math.sin(h), math.cos(h))
	if math.abs(f.Y) < 0.5 and f.X < 0 then r = -r end
	return f, r
end
Sim.toadFrame = frame
function Sim:castLeap(owner, M, p, dir)
	local id = self.nextId
	self.nextId += 1
	local f = Instance.new("Configuration")
	f.Name = "C" .. id
	local tgt = self:acquire(p, dir, M.range, M.cone)
	local c = { id = id, f = f, kind = "leap", move = M.id, M = M, owner = owner, p = p, dir = dir, t = 0, phase = "seal", pt = 0,
		target = tgt, aim = tgt and tgt.p or (p + dir * M.missRange), result = "", hitKind = "", hits = {}, dogs = {} }
	-- behind Naruto for a sideways cast; for a cast up or down the screen beside him (behind would put a toad this
	-- size off the top of the screen), a step back
	if math.abs(dir.Y) > math.abs(dir.X) then c.pos = p - dir * 4 + Vector2.new(-M.spawnSide, 0)
	else c.pos = p - dir * M.spawnBack end
	c.h, c.head, c.ba = 0, snap4(math.atan2(dir.Y, dir.X)), M.sword.from
	c.goal = c.aim
	f:SetAttribute("Owner", owner); f:SetAttribute("Move", M.id); f:SetAttribute("Kind", "leap")
	f:SetAttribute("X", p.X); f:SetAttribute("Z", p.Y); f:SetAttribute("DX", dir.X); f:SetAttribute("DZ", dir.Y)
	f:SetAttribute("SX", c.pos.X); f:SetAttribute("SZ", c.pos.Y)
	f:SetAttribute("Target", tgt and tgt.name or "")
	self.casts[id] = c
	self:writeCast(c)
	f.Parent = self.castsFolder
	return c
end
local function enter(c, phase) c.phase, c.pt = phase, c.t end
-- knock a target away from a point (the knockback follows the direction it was hit from)
function Sim:knock(t, from, M)
	local d = t.p - from
	if d.Magnitude < 0.1 then d = Vector2.new(1, 0) end
	t.kb, t.kbLeft = d.Unit * (M.kb / M.kbT), M.kbT
end
function Sim:hitTarget(c, t, dmg, kind, from)
	if c.hits[t] then return end
	c.hits[t] = true
	t.hp -= dmg
	self:knock(t, from, c.M)
	-- one sweep can cut several: every name is kept ("T1+T3"), the kind of the first hit
	c.result, c.hitT = "hit", c.t
	c.hitKind = c.hitKind ~= "" and c.hitKind or kind
	c.hitName = c.hitName and (c.hitName .. "+" .. t.name) or t.name
	self:writeTarget(t)
end
-- the blade at angle a: a target is cut when it lies in the blade's band (from the hand to the tip, give or take the
-- blade's and the dummy's width) and the blade passes over its angle about the sword's pivot during this step
function Sim:bladeSweep(c, a0, a1)
	local W, M = c.M.sword, c.M
	local fw, rt = frame(c.head)
	local pivot = c.pos + fw * W.cf + rt * W.cr
	for _, t in pairs(self.targets) do
		if t.alive and not c.hits[t] then
			local rel = t.p - pivot
			local lf, lr = rel:Dot(fw), rel:Dot(rt)
			local rho = rel.Magnitude
			local ang = math.atan2(-lr, lf) -- left positive, like the blade angle
			local tol = M.hitW / math.max(rho, 1)
			if rho >= W.bIn - M.hitW and rho <= W.bOut + M.hitW and ang <= math.max(a0, a1) + tol and ang >= math.min(a0, a1) - tol then
				self:hitTarget(c, t, M.dmg, "Klinge", c.pos)
			end
		end
	end
end
function Sim:stepLeap(c, dt)
	local M = c.M
	c.t += dt
	local u = c.t - c.pt
	local tg = c.target
	if c.phase == "seal" then
		if u >= M.seal then enter(c, "appear") end
	elseif c.phase == "appear" then
		if u >= M.appear then enter(c, "crouch") end
	elseif c.phase == "crouch" then
		-- he follows the target while he crouches; one that is gone is aimed at where it was last seen
		if tg and tg.alive then c.aim = tg.p end
		local to = c.aim - c.pos
		if to.Magnitude > 0.5 then c.head = snap4(math.atan2(to.Y, to.X)) end
		if u >= M.crouch then
			local fw = frame(c.head)
			local land = c.aim - fw * M.standOff
			-- never backwards past where he sits: at least a hop forward
			local along = (land - c.pos):Dot(fw)
			if along < M.minHop then land += fw * (M.minHop - along) end
			c.from, c.land = c.pos, land
			enter(c, "air")
		end
	elseif c.phase == "air" then
		local k = math.min(1, u / M.air)
		c.pos = c.from:Lerp(c.land, k)
		c.h = 4 * M.jumpH * k * (1 - k)
		if k >= 1 then
			c.pos, c.h = c.land, 0
			enter(c, "land")
			for _, t in pairs(self.targets) do
				if t.alive and (t.p - c.pos).Magnitude <= M.crushR then self:hitTarget(c, t, M.crushDmg, "Landung", c.pos) end
			end
		end
	elseif c.phase == "land" then
		if u >= M.land then enter(c, "draw") end
	elseif c.phase == "draw" then
		if u >= M.draw then enter(c, "slash"); c.ba = M.sword.from end
	elseif c.phase == "slash" then
		local k = math.min(1, u / M.slash)
		local a = M.sword.from + (M.sword.to - M.sword.from) * k
		self:bladeSweep(c, c.ba, a)
		c.ba = a
		if k >= 1 then
			enter(c, "follow")
			if c.result == "" then c.result = "miss" end
		end
	elseif c.phase == "follow" then
		if u >= M.follow then
			if c.result == "hit" then enter(c, "done"); c.endT = c.t else enter(c, "look") end
		end
	elseif c.phase == "look" then
		-- missed: he turns to find the target (if it is still there), then leaves
		if tg and tg.alive then local to = tg.p - c.pos; if to.Magnitude > 0.5 then c.head = snap4(math.atan2(to.Y, to.X)) end end
		if u >= M.look then enter(c, "done"); c.endT = c.t end
	end
	if (c.phase == "done" or c.phase == "abort") and c.t >= (c.endT or c.t) + 0.8 then
		c.f:Destroy()
		self.casts[c.id] = nil
		return
	end
	self:writeCast(c)
end

function Sim:writeCast(c)
	local f = c.f
	f:SetAttribute("T", c.t); f:SetAttribute("Phase", c.phase); f:SetAttribute("Result", c.result)
	f:SetAttribute("GX", c.goal.X); f:SetAttribute("GZ", c.goal.Y)
	if c.burst then f:SetAttribute("BX", c.burst.X); f:SetAttribute("BZ", c.burst.Y); f:SetAttribute("BurstT", c.burstT) end
	if c.lockT then f:SetAttribute("LockT", c.lockT) end
	if c.endT then f:SetAttribute("EndT", c.endT) end
	if c.kind == "leap" then
		f:SetAttribute("PT", c.pt); f:SetAttribute("TX", c.pos.X); f:SetAttribute("TZ", c.pos.Y); f:SetAttribute("TY", c.h)
		f:SetAttribute("TH", c.head); f:SetAttribute("BA", c.ba); f:SetAttribute("HitKind", c.hitKind)
		if c.land then f:SetAttribute("LX", c.land.X); f:SetAttribute("LZ", c.land.Y); f:SetAttribute("FX", c.from.X); f:SetAttribute("FZ", c.from.Y) end
		if c.hitT then f:SetAttribute("HitT", c.hitT); f:SetAttribute("HitName", c.hitName) end
	end
	for i, d in ipairs(c.dogs) do
		f:SetAttribute("D" .. i .. "X", d.pos.X); f:SetAttribute("D" .. i .. "Z", d.pos.Y); f:SetAttribute("D" .. i .. "H", d.head)
	end
end

function Sim:abort(owner)
	for _, c in pairs(self.casts) do
		if (owner == nil or c.owner == owner) and c.phase ~= "done" and c.phase ~= "abort" then
			c.phase, c.endT = "abort", c.t
			c.pt = c.t
			if c.target and c.held then c.target.held = false; self:writeTarget(c.target) end
			self:writeCast(c)
		end
	end
end
function Sim:busy(owner)
	for _, c in pairs(self.casts) do if c.owner == owner and c.phase ~= "done" and c.phase ~= "abort" then return true end end
	return false
end

local function turnToward(cur, want, maxStep)
	local d = (want - cur + math.pi) % (math.pi * 2) - math.pi
	return cur + math.clamp(d, -maxStep, maxStep)
end

function Sim:stepCast(c, dt)
	if c.kind == "leap" then return self:stepLeap(c, dt) end
	local M = c.M
	c.t += dt
	local tg = c.target
	if c.phase == "seal" then
		if c.t >= M.seal then c.phase = "track" end
	elseif c.phase == "track" or c.phase == "warn" then
		-- the scent: a live target's position now; a removed target leaves the last place it was smelt
		if tg and tg.alive and c.phase == "track" then c.goal = tg.p end
		local centre = Vector2.zero
		for i, d in ipairs(c.dogs) do
			local hole = (c.burst or c.goal) + Vector2.new(math.cos(d.a), math.sin(d.a)) * d.r
			local to = hole - d.pos
			if to.Magnitude > 0.05 then
				local speed = c.phase == "warn" and M.speed * 1.4 or M.speed
				-- far away they run toward the target itself; near it each fans out to its own hole
				local aimAt = (to.Magnitude > 10) and ((c.goal - d.pos)) or to
				d.head = turnToward(d.head, angleOf(aimAt), M.turn * dt * (c.phase == "warn" and 3 or 1))
				local stepLen = math.min(to.Magnitude, speed * dt)
				d.pos += Vector2.new(math.cos(d.head), math.sin(d.head)) * stepLen
			end
			centre += d.pos
		end
		centre /= #c.dogs
		if c.phase == "track" and ((centre - c.goal).Magnitude <= M.close or c.t - M.seal >= M.maxTrack) then
			-- lock: the holes are set round where the target is now; the ground bulges (the tell)
			c.phase, c.burst, c.lockT, c.burstT = "warn", c.goal, c.t, c.t + M.warn
		end
		if c.phase == "warn" and c.t >= c.burstT then
			for _, d in ipairs(c.dogs) do d.pos = c.burst + Vector2.new(math.cos(d.a), math.sin(d.a)) * d.r; d.head = angleOf(c.burst - d.pos) end
			local caught = tg and tg.alive and (tg.p - c.burst).Magnitude <= M.radius
			if caught then
				c.phase, c.result, c.endT = "hold", "hit", c.t + M.hold
				tg.held, tg.hp = true, tg.hp - M.dmg
				c.held = true
				self:writeTarget(tg)
			else
				c.phase, c.result, c.endT = "miss", "miss", c.t + 0.35 + M.missLook
			end
		end
	elseif c.phase == "hold" then
		-- held fast: the target is pinned where it was caught
		if tg and not tg.alive then c.phase, c.endT = "done", c.t end
		if c.t >= c.endT then
			c.phase = "done"
			if tg then tg.held = false; self:writeTarget(tg) end
			c.held = false
		end
	elseif c.phase == "miss" then
		-- noses down: each dog turns about, slowly, searching (the heading the clients draw the view from)
		local u = c.t - (c.burstT or c.t)
		for i, d in ipairs(c.dogs) do
			if u > 0.35 then d.head += dt * (1.6 + (i % 3) * 0.5) * ((i % 2 == 0) and 1 or -1) end
		end
		if c.t >= c.endT then c.phase, c.endT = "done", c.t end
	end
	if (c.phase == "done" or c.phase == "abort") and c.t >= (c.endT or c.t) + 0.6 then
		c.f:Destroy()
		self.casts[c.id] = nil
		return
	end
	self:writeCast(c)
end

function Sim:stepTargets(dt)
	for _, t in pairs(self.targets) do
		if t.kbLeft and t.kbLeft > 0 then
			local k = math.min(dt, t.kbLeft)
			t.p += t.kb * k
			t.kbLeft -= k
		end
		if t.alive and not t.held and not (t.kbLeft and t.kbLeft > 0) then
			if t.mode == "walk" then
				t.phase += dt
				t.p = t.home + Vector2.new(0, math.sin(t.phase * 0.9) * 11)
			elseif t.mode == "dodge" then
				-- reads the bulging ground under it and steps out
				for _, c in pairs(self.casts) do
					local cue = (c.M.dodge and c.M.dodge.phase) or "warn"
					if c.target == t and c.phase == cue and not c.dodged then
						c.dodged = true
						if c.M.dodge and c.M.dodge.back then
							-- runs away from what is coming (on along the cast direction)
							t.dodgeTo = t.p + c.dir * c.M.dodge.back
						else
							local side = Vector2.new(-c.dir.Y, c.dir.X)
							if side.Magnitude < 0.5 then side = Vector2.new(1, 0) end
							t.dodgeTo = t.p + side * 8
						end
					end
				end
				if t.dodgeTo then
					local to = t.dodgeTo - t.p
					-- arrived (also exactly: the unit of a zero vector is NaN)
					if to.Magnitude < 0.05 then t.p, t.dodgeTo = t.dodgeTo, nil
					else t.p += to.Unit * math.min(to.Magnitude, 30 * dt) end
				end
			end
		end
		self:writeTarget(t)
	end
end

-- advance by real dt (scaled by the panel's time scale; 0 while paused) or by an explicit step
function Sim:step(realDt, forced)
	local scale = self.state:GetAttribute("TimeScale") or 1
	local dt = forced or ((self.state:GetAttribute("Paused") and 0) or realDt * scale)
	if dt <= 0 then return end
	self.t += dt
	self.state:SetAttribute("SimT", self.t)
	self:stepTargets(dt)
	for _, c in pairs(self.casts) do self:stepCast(c, dt) end
end

return Sim

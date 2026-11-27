-- PixelArena.Moves (2026-11-27): the roster's own techniques on the 2.5D stage, decided by the server like the summons.
-- A move is data (Defs.moves[id], baked from pixelfx/src/fx/arena/*.js) and runs through one or more STAGES, each a
-- mechanic with its own phases. Every move opens with seal (the sign) and, when it aims, aim (the move follows the
-- target) and tell (the aim is fixed and shown: the moment to dodge), so a fan can read what is coming and from where.
--   shot    projectiles from the hand / mouth (one, a fan, a volley, homing, lobbed); they burst on contact or at the end
--   line    a beam or a stream that grows along the aimed line and hits what is in its band
--   blast   an area at the aimed point or round the caster (circle or cone), in one or more waves
--   rush    the caster runs (or leaps) at the target and strikes on contact, a combo of several hits, a launch
--   bind    something crawls / flies to the target (a shadow, chains, sand, water) and holds it; damage over the hold,
--           a crush at the end; a link stays visible between the caster and the held target
--   zone    an area that stays (mist, poison, ash, lava): damage over time and a status while inside
--   guard   the caster defends against the dummies' thrown kunai (block in front, full, reflect, phase through, swap)
--   buff    the caster's state for a while (more damage, regeneration), an aura
--   heal    the caster or the nearest ally regains health
--   blink   the caster vanishes and appears elsewhere (behind the target, at the aimed point, at a thrown marker)
--   state   a genjutsu / seal on the target (stun, seal, blind, confuse, slow, burn), when it is in the caster's sight
--   clones  copies of the caster (shadow clones, afterimages) that run at the target and strike
-- The caster has health here too (Owners/U<id>): the dummies' kunai hurt it, heals restore it.
return function(Sim)
	local function v2(x, z) return Vector2.new(x, z) end
	local function enter(c, phase) c.phase, c.pt = phase, c.t end
	local function rot(v, a) return Vector2.new(v.X * math.cos(a) - v.Y * math.sin(a), v.X * math.sin(a) + v.Y * math.cos(a)) end
	local function segDist(q, a, b)
		local ab = b - a
		local l2 = ab:Dot(ab)
		local u = l2 > 0 and math.clamp((q - a):Dot(ab) / l2, 0, 1) or 0
		return (q - (a + ab * u)).Magnitude, u
	end
	Sim.STATUS_KINDS = { stun = true, seal = true, blind = true, confuse = true, slow = true, burn = true }

	------------------------------------------------------------------ the caster's own state
	function Sim:owner(id)
		self.owners = self.owners or {}
		local o = self.owners[id]
		if not o then
			local folder = self.state:FindFirstChild("Owners") or Instance.new("Folder")
			folder.Name = "Owners"
			folder.Parent = self.state
			local f = Instance.new("Configuration")
			f.Name = "U" .. tostring(id)
			f.Parent = folder
			o = { id = id, f = f, hp = 100, buff = nil, guards = {}, intangible = 0 }
			self.owners[id] = o
		end
		return o
	end
	function Sim:writeOwner(o)
		o.f:SetAttribute("Hp", math.floor(o.hp + 0.5))
		o.f:SetAttribute("Buff", o.buff and o.buff.name or "")
		o.f:SetAttribute("BuffEnd", o.buff and o.buff.untilT or 0)
	end
	function Sim:resetOwner(id) local o = self:owner(id); o.hp, o.buff, o.guards = 100, nil, {}; self:writeOwner(o) end
	-- damage dealt by the caster's moves (a buff raises it)
	function Sim:dmgOf(c, base)
		local o = self.owners and self.owners[c.owner]
		local k = (o and o.buff and o.buff.untilT > self.t and o.buff.dmg) or 1
		return base * k
	end

	------------------------------------------------------------------ statuses on the dummies
	function Sim:setStatus(t, kind, dur, src)
		t.status = { kind = kind, untilT = self.t + dur, src = src }
		t.f:SetAttribute("Status", kind)
		t.f:SetAttribute("StatusEnd", t.status.untilT)
	end
	function Sim:statusOf(t)
		if t.status and t.status.untilT > self.t then return t.status.kind end
		if t.status then t.status = nil; t.f:SetAttribute("Status", ""); end
		return nil
	end

	------------------------------------------------------------------ a hit
	function Sim:arenaHit(c, t, H, from, label)
		H = H or {}
		local dmg = self:dmgOf(c, H.dmg or 0)
		if dmg > 0 then t.hp -= dmg end
		if H.kb and H.kb > 0 then
			local d = t.p - (from or c.p)
			if d.Magnitude < 0.1 then d = c.dir end
			t.kb, t.kbLeft = d.Unit * (H.kb / (H.kbT or 0.25)), H.kbT or 0.25
		end
		if H.status then self:setStatus(t, H.status, H.statusT or 2, c.id) end
		c.result, c.hitT = "hit", c.t
		c.hitKind = (c.hitKind ~= "" and c.hitKind) or label or c.M.hitKind or "Treffer"
		if not c.hitNames[t.name] then
			c.hitNames[t.name] = true
			c.hitName = c.hitName and (c.hitName .. "+" .. t.name) or t.name
		end
		c.hitCount = (c.hitCount or 0) + 1
		self:writeTarget(t)
	end
	-- every live dummy (not an ally) for which test(t) is true
	function Sim:foes(test)
		local list = {}
		for _, t in pairs(self.targets) do if t.alive and not t.ally and (not test or test(t)) then table.insert(list, t) end end
		return list
	end

	------------------------------------------------------------------ a cast
	function Sim:castArena(owner, M, p, dir)
		local id = self.nextId
		self.nextId += 1
		local f = Instance.new("Configuration")
		f.Name = "C" .. id
		local tgt = self:acquire(p, dir, M.range or 40, M.cone or 50)
		local c = { id = id, f = f, kind = "arena", move = M.id, M = M, owner = owner, p = p, dir = dir, t = 0, phase = "seal", pt = 0,
			target = tgt, result = "", hitKind = "", hits = {}, hitNames = {}, dogs = {}, goal = p, cpos = p, cy = 0,
			stage = 1, projs = {}, impacts = {}, clones = {} }
		c.aim = tgt and tgt.p or (p + dir * (M.missRange or 24))
		c.adir = (c.aim - p).Magnitude > 0.5 and (c.aim - p).Unit or dir
		self:owner(owner)
		f:SetAttribute("Owner", owner); f:SetAttribute("Move", M.id); f:SetAttribute("Kind", "arena")
		f:SetAttribute("X", p.X); f:SetAttribute("Z", p.Y); f:SetAttribute("DX", dir.X); f:SetAttribute("DZ", dir.Y)
		f:SetAttribute("Target", tgt and tgt.name or "")
		self.casts[id] = c
		self:writeArena(c)
		f.Parent = self.castsFolder
		return c
	end
	-- stages that do not aim at anyone: they start right away
	function Sim:noAim(st) return st.noAim or st.skipAim or st.mech == "guard" or st.mech == "buff" or (st.mech == "heal" and st.self) or (st.mech == "blink" and st.to == "marker") end
	function Sim:stageOf(c) local S = c.M.stages; return S and S[c.stage] or c.M end

	-- the next stage, or the end
	function Sim:nextStage(c)
		local S = c.M.stages
		-- a stage that only follows a success (the genjutsu took: she comes out of the tree)
		if S and c.stage < #S and S[c.stage + 1].needHit and c.result ~= "hit" then enter(c, "recover"); return end
		if S and c.stage < #S then
			c.stage += 1
			local st = S[c.stage]
			c.projs, c.L, c.tip, c.grab, c.zone, c.blast = {}, nil, nil, nil, nil, nil
			c.hits, c.tickAcc = {}, nil
			c.stageT = c.t
			-- a later stage aims again when it has its own aim; else it keeps the line
			if st.reaim then
				local tgt = self:acquire(c.cpos, c.adir, st.range or c.M.range or 40, st.cone or 180)
				if tgt then c.target = tgt; c.aim = tgt.p; c.adir = (tgt.p - c.cpos).Magnitude > 0.5 and (tgt.p - c.cpos).Unit or c.adir end
			end
			if self:noAim(st) then enter(c, st.mech .. "_go"); self:startAction(c, st) else enter(c, "aim") end
		else
			enter(c, "recover")
		end
	end

	-- the aim follows the target (its place now; a removed target leaves its last place)
	function Sim:trackAim(c, st)
		local tg = c.target
		if tg and tg.alive and st.track ~= false then
			local to = tg.p - c.cpos
			local R = st.range or c.M.range or 40
			c.aim = to.Magnitude > R and (c.cpos + to.Unit * R) or tg.p
		end
		local d = c.aim - c.cpos
		if d.Magnitude > 0.5 then c.adir = d.Unit end
	end

	function Sim:stepArena(c, dt)
		local M = c.M
		c.t += dt
		local u = c.t - c.pt
		local st = self:stageOf(c)
		if c.phase == "seal" then
			if u >= (M.seal or 0.3) then
				if self:noAim(st) then enter(c, st.mech .. "_go"); self:startAction(c, st)
				else enter(c, "aim") end
			end
		elseif c.phase == "aim" then
			self:trackAim(c, st)
			if u >= (st.aim or 0.35) then enter(c, "tell"); c.lockT = c.t end
		elseif c.phase == "tell" then
			if u >= (st.tell or 0.35) then enter(c, st.mech .. "_go"); self:startAction(c, st) end
		elseif c.phase:sub(-3) == "_go" or c.phase == "hold" or c.phase == "combo" or c.phase == "retract" or c.phase == "impact" then
			self:stepAction(c, st, dt, u)
		elseif c.phase == "recover" then
			if u >= (M.recover or 0.35) then
				if c.result == "" then c.result = "miss" end
				c.phase, c.pt, c.endT = "done", c.t, c.t
			end
		end
		if (c.phase == "done" or c.phase == "abort") and c.t >= (c.endT or c.t) + 0.6 then
			self:releaseArena(c)
			c.f:Destroy()
			self.casts[c.id] = nil
			return
		end
		self:writeArena(c)
	end

	------------------------------------------------------------------ the mechanics
	function Sim:startAction(c, st)
		local m = st.mech
		c.actT = c.t
		if m == "shot" then
			local n = st.count or 1
			for i = 1, n do
				local a = n > 1 and ((i - 1) / (n - 1) - 0.5) * math.rad(st.spread or 30) or 0
				local d = rot(c.adir, a)
				table.insert(c.projs, { i = i, pos = c.cpos + c.adir * (st.from or 2), d = d, s = 0, state = "wait", t0 = c.t + (i - 1) * (st.gap or 0), hit = {} })
			end
		elseif m == "line" then
			c.L, c.lorg, c.ldir = 0, c.cpos + c.adir * (st.from or 1.5), c.adir
		elseif m == "blast" then
			c.blast = st.at == "self" and c.cpos or c.aim
			c.wave, c.waveT = 0, c.t
		elseif m == "rush" then
			c.rstart, c.rdir, c.rs = c.cpos, c.adir, 0
			if st.leap then c.land = c.aim end
		elseif m == "bind" then
			c.tip, c.tdir, c.reach = c.cpos + c.adir * (st.from or 1), c.adir, 0
		elseif m == "zone" then
			c.zone = st.at == "self" and c.cpos or c.aim
			c.tickT = c.t
		elseif m == "guard" then
			local o = self:owner(c.owner)
			o.guards[c.id] = c
			c.guardFace = c.adir
			if st.pulse then
				for _, t in ipairs(self:foes(function(t) return (t.p - c.cpos).Magnitude <= st.pulse end)) do self:arenaHit(c, t, st.pulseHit or { dmg = 6, kb = 8 }, c.cpos, st.hitKind) end
			end
		elseif m == "buff" then
			local o = self:owner(c.owner)
			-- (on the simulation clock: other casts read it)
			o.buff = { name = st.buffName or c.M.id, dmg = st.dmgMult or 1, regen = st.regen or 0, untilT = self.t + (st.dur or 5) }
			self:writeOwner(o)
			if not c.M.stages or c.stage == #c.M.stages then c.result, c.hitKind, c.hitName, c.hitT = "hit", st.hitKind or "Buff", "selbst", c.t end
			if st.pulse then
				for _, t in ipairs(self:foes(function(t) return (t.p - c.cpos).Magnitude <= st.pulse end)) do self:arenaHit(c, t, st.pulseHit or { dmg = 4, kb = 6 }, c.cpos, st.hitKind) end
			end
		elseif m == "heal" then
			if st.self then c.healWho = "self"
			else
				local best, bd = nil, st.range or 30
				for _, t in pairs(self.targets) do
					if t.ally and t.alive then local d = (t.p - c.cpos).Magnitude; if d < bd then best, bd = t, d end end
				end
				c.healT, c.healWho = best, best and best.name or ""
			end
			c.healed = 0
		elseif m == "blink" then
			c.from = c.cpos
		elseif m == "state" then
			-- the moment it takes: who is in the caster's sight (cone, range) now
			local R, cone = st.reach or 26, math.cos(math.rad(st.sight or 25))
			for _, t in ipairs(self:foes(function(t) local d = t.p - c.cpos; return d.Magnitude <= R and d.Magnitude > 0.3 and d.Unit:Dot(c.adir) >= cone end)) do
				if not st.single or not c.hitName then
					self:arenaHit(c, t, { dmg = st.dmg or 0, status = st.status, statusT = st.statusT or 3 }, c.cpos, st.hitKind)
					c.stateOn = c.stateOn or t
				end
			end
		elseif m == "clones" then
			local n = st.count or 3
			for i = 1, n do
				local a = ((i - 0.5) / n - 0.5) * math.rad(st.fan or 120)
				table.insert(c.clones, { i = i, pos = c.cpos + rot(c.adir, a + math.pi / 2 * (i % 2 == 0 and 1 or -1)) * 2.5, state = "run", t0 = c.t + (i - 1) * (st.gap or 0.08), struck = false })
			end
		end
	end

	function Sim:stepAction(c, st, dt, u)
		local m = st.mech
		local now = c.t
		if m == "shot" then
			local live = false
			for _, pr in ipairs(c.projs) do
				if pr.state == "wait" and now >= pr.t0 then pr.state = "fly"; pr.pos = c.cpos + pr.d * (st.from or 2) end
				if pr.state == "fly" then
					live = true
					if st.homing and c.target and c.target.alive then
						local want = (c.target.p - pr.pos)
						if want.Magnitude > 0.5 then
							local a0, a1 = math.atan2(pr.d.Y, pr.d.X), math.atan2(want.Y, want.X)
							local da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
							pr.d = rot(pr.d, math.clamp(da, -st.homing * dt, st.homing * dt))
						end
					end
					local stepLen = (st.speed or 30) * dt
					local p0 = pr.pos
					pr.pos = p0 + pr.d * stepLen
					pr.s += stepLen
					local R = st.radius or 1.6
					for _, t in ipairs(self:foes()) do
						if not pr.hit[t] and segDist(t.p, p0, pr.pos) <= R then
							pr.hit[t] = true
							self:arenaHit(c, t, st.hit, pr.pos, st.hitKind)
							if not st.pierce then pr.state = "hit"; pr.endT = now; break end
						end
					end
					if pr.state == "fly" and pr.s >= (st.reach or st.range or c.M.range or 40) then pr.state = "end"; pr.endT = now end
					if pr.state ~= "fly" and st.burst then
						table.insert(c.impacts, { pos = pr.pos, t = now })
						for _, t in ipairs(self:foes(function(t) return (t.p - pr.pos).Magnitude <= st.burst end)) do
							-- the burst catches everyone round it, the one it struck too
							pr.burstHit = pr.burstHit or {}
							if not pr.burstHit[t] then pr.burstHit[t] = true; self:arenaHit(c, t, st.burstHit or st.hit, pr.pos, st.hitKind) end
						end
					elseif pr.state == "hit" then table.insert(c.impacts, { pos = pr.pos, t = now }) end
				elseif pr.state == "wait" then live = true end
			end
			if not live then
				local lastP = c.projs[#c.projs]
				if lastP then c.marker = lastP.pos end
				if c.phase ~= "impact" then enter(c, "impact") elseif u >= (st.impact or 0.4) then self:nextStage(c) end
			end
		elseif m == "line" then
			local L0 = c.L
			local Lmax = st.len or 30
			if c.phase == "line_go" then
				c.L = st.speed and math.min(Lmax, c.L + st.speed * dt) or Lmax
				local side = Vector2.new(-c.ldir.Y, c.ldir.X)
				for _, t in ipairs(self:foes()) do
					local rel = t.p - c.lorg
					local along, lat = rel:Dot(c.ldir), math.abs(rel:Dot(side))
					if lat <= (st.width or 2) and along >= -0.5 and along <= c.L + 0.5 then
						if st.dot then
							c.tickAcc = c.tickAcc or {}
							c.tickAcc[t] = (c.tickAcc[t] or 0) + dt
							if c.tickAcc[t] >= 0.25 then c.tickAcc[t] -= 0.25; self:arenaHit(c, t, { dmg = st.dot * 0.25, kb = st.hit and st.hit.kb and st.hit.kb * 0.25 or 0, kbT = 0.1, status = st.hit and st.hit.status, statusT = st.hit and st.hit.statusT }, c.lorg, st.hitKind) end
						elseif not c.hits[t] then
							c.hits[t] = true
							self:arenaHit(c, t, st.hit, c.lorg, st.hitKind)
						end
					end
				end
				if c.L >= Lmax and u >= (st.hold or 0.4) + (st.speed and Lmax / st.speed or 0) then enter(c, "retract") end
			elseif c.phase == "retract" then
				if u >= (st.fade or 0.25) then self:nextStage(c) end
			end
		elseif m == "blast" then
			local waves = st.waves or 1
			local gap = st.gap or 0.35
			if c.wave < waves and now >= c.actT + (st.delay or 0) + c.wave * gap then
				c.wave += 1
				c.waveT = now
				local R = st.radius or 5
				local cone = st.coneHalf and math.cos(math.rad(st.coneHalf))
				for _, t in ipairs(self:foes(function(t)
					local d = t.p - c.blast
					if d.Magnitude > R then return false end
					if cone and d.Magnitude > 0.3 and d.Unit:Dot(c.adir) < cone then return false end
					return true
				end)) do self:arenaHit(c, t, st.hit, c.blast, st.hitKind) end
				table.insert(c.impacts, { pos = c.blast, t = now })
			end
			if c.wave >= waves and now >= c.waveT + (st.after or 0.5) then self:nextStage(c) end
		elseif m == "rush" then
			if c.phase == "rush_go" then
				if st.leap then
					-- a leap: an arc to the aimed point, the landing hits round it
					local T = st.air or 0.6
					local q = math.clamp(u / T, 0, 1)
					c.cpos = c.rstart:Lerp(c.land, q)
					c.cy = (st.height or 8) * 4 * q * (1 - q)
					if q >= 1 then
						c.cy = 0
						for _, t in ipairs(self:foes(function(t) return (t.p - c.cpos).Magnitude <= (st.radius or 5) end)) do self:arenaHit(c, t, st.hit, c.cpos, st.hitKind) end
						table.insert(c.impacts, { pos = c.cpos, t = now })
						enter(c, "impact")
					end
				else
					local stepLen = (st.speed or 40) * dt
					c.rs += stepLen
					c.cpos = c.rstart + c.rdir * c.rs
					-- contact: the first dummy in reach in front
					for _, t in ipairs(self:foes()) do
						local rel = t.p - c.cpos
						if rel.Magnitude <= (st.reach or 2.4) and rel:Dot(c.rdir) > -0.8 then
							c.struck = t
							c.cpos = t.p - c.rdir * (st.stand or 1.8)
							t.held, t.dodgeTo = st.combo ~= nil, nil
							self:writeTarget(t)
							c.comboN = 0
							enter(c, "combo")
							break
						end
					end
					if c.phase == "rush_go" and c.rs >= (st.reachMax or st.range or c.M.range or 30) then enter(c, "impact") end
				end
			elseif c.phase == "combo" then
				local hits = st.hits or 1
				local gap = (st.combo or 0) / math.max(1, hits)
				while c.comboN < hits and u >= c.comboN * gap do
					c.comboN += 1
					local last = c.comboN == hits
					local H = last and (st.finish or st.hit) or (st.hit or {})
					if not last and H.kb then H = { dmg = H.dmg, status = H.status, statusT = H.statusT } end
					if c.struck and c.struck.alive then self:arenaHit(c, c.struck, H, c.cpos, st.hitKind) end
				end
				if c.comboN >= hits and u >= (st.combo or 0) + 0.15 then
					if c.struck then c.struck.held = false; self:writeTarget(c.struck) end
					table.insert(c.impacts, { pos = c.struck and c.struck.p or c.cpos, t = now })
					enter(c, "impact")
				end
			elseif c.phase == "impact" then
				if u >= (st.impact or 0.35) then self:nextStage(c) end
			end
		elseif m == "bind" then
			if c.phase == "bind_go" then
				local tg = c.target
				if st.follow ~= false and tg and tg.alive and (tg.p - c.tip).Magnitude > 0.5 then
					local want = (tg.p - c.tip).Unit
					c.tdir = (c.tdir + want * (st.steer or 3) * dt).Unit
				end
				local stepLen = (st.speed or 24) * dt
				local t0 = c.tip
				c.tip += c.tdir * stepLen
				c.reach += stepLen
				for _, t in ipairs(self:foes()) do
					if segDist(t.p, t0, c.tip) <= (st.radius or 1.6) then
						c.grab = t
						t.held, t.dodgeTo, t.kbLeft = true, nil, 0
						c.tip = t.p
						self:arenaHit(c, t, st.hit or { dmg = 0 }, c.cpos, st.hitKind)
						enter(c, "hold")
						break
					end
				end
				if c.phase == "bind_go" and c.reach >= (st.reachMax or st.range or c.M.range or 30) then enter(c, "retract") end
			elseif c.phase == "hold" then
				local g = c.grab
				if g and g.alive then
					if st.dot then g.hp -= self:dmgOf(c, st.dot) * dt; self:writeTarget(g) end
					-- pulled to the caster (Bansho Ten'in)
					if st.pull then local d = c.cpos - g.p; if d.Magnitude > (st.pullTo or 2.4) then g.p += d.Unit * math.min(d.Magnitude - (st.pullTo or 2.4), st.pull * dt); self:writeTarget(g) end end
					c.tip = g.p
				end
				if u >= (st.hold or 2) or not (g and g.alive) then
					if g and g.alive and st.crush then self:arenaHit(c, g, st.crush, c.cpos, st.crushKind or st.hitKind); table.insert(c.impacts, { pos = g.p, t = now }) end
					if g then g.held = false; self:writeTarget(g) end
					c.grab = nil
					enter(c, "retract")
				end
			elseif c.phase == "retract" then
				local back = (c.cpos - c.tip)
				local stepLen = (st.back or 40) * dt
				if back.Magnitude <= stepLen then c.tip = c.cpos; self:nextStage(c) else c.tip += back.Unit * stepLen end
			end
		elseif m == "zone" then
			local R = st.radius or 6
			-- a pull toward the middle (Chibaku Tensei): everything near is drawn in
			if st.pull then
				for _, t in ipairs(self:foes(function(t) return (t.p - c.zone).Magnitude <= R * 1.8 and not t.held end)) do
					local d = c.zone - t.p
					if d.Magnitude > 0.6 then t.p += d.Unit * math.min(d.Magnitude, st.pull * dt); t.dodgeTo = nil; self:writeTarget(t) end
				end
			end
			if now - c.tickT >= 0.5 then
				c.tickT = now
				for _, t in ipairs(self:foes(function(t) return (t.p - c.zone).Magnitude <= R end)) do
					self:arenaHit(c, t, { dmg = (st.dot or 0) * 0.5, status = st.status, statusT = 0.8 }, c.zone, st.hitKind)
				end
			end
			if u >= (st.dur or 4) then self:nextStage(c) end
		elseif m == "guard" then
			if u >= (st.dur or 3) then
				local o = self:owner(c.owner)
				o.guards[c.id] = nil
				self:nextStage(c)
			end
		elseif m == "buff" then
			if u >= (st.show or 1.2) then self:nextStage(c) end
		elseif m == "heal" then
			local rate = st.rate or 12
			if c.healWho == "self" then
				local o = self:owner(c.owner)
				local add = math.min(rate * dt, 100 - o.hp)
				o.hp += add; c.healed += add; self:writeOwner(o)
			elseif c.healT and c.healT.alive and (c.healT.p - c.cpos).Magnitude <= (st.range or 30) + 4 then
				local add = math.min(rate * dt, 100 - c.healT.hp)
				c.healT.hp += add; c.healed += add; self:writeTarget(c.healT)
			end
			if c.healed > 0 then c.result = "hit"; c.hitKind = st.hitKind or "Heilung"; c.hitName = c.healWho end
			if u >= (st.dur or 2) then self:nextStage(c) end
		elseif m == "blink" then
			if c.phase == "blink_go" then
				if u >= (st.vanish or 0.15) then
					local to
					-- behind where the target was when the aim was fixed (stepping away in time makes it miss)
					if st.to == "behind" then to = c.aim + c.adir * (st.behind or 2.5); c.adir = -c.adir
					-- to the target wherever it is now (a seal on it: the Flying Thunder God)
					elseif st.to == "target" and c.target and c.target.alive then local d = c.target.p - c.cpos; if d.Magnitude > 0.5 then c.adir = d.Unit end; to = c.target.p - c.adir * (st.behind or 1.8)
					elseif st.to == "marker" and c.marker then to = c.marker
					else to = c.aim end
					c.cpos = to
					if st.strike then
						for _, t in ipairs(self:foes(function(t) return (t.p - c.cpos).Magnitude <= (st.strike or 3) end)) do self:arenaHit(c, t, st.hit, c.cpos, st.hitKind) end
						table.insert(c.impacts, { pos = c.cpos, t = now })
					end
					enter(c, "impact")
				end
			elseif c.phase == "impact" then
				if u >= (st.impact or 0.3) then self:nextStage(c) end
			end
		elseif m == "state" then
			if u >= (st.dur or 1) then self:nextStage(c) end
		elseif m == "clones" then
			local live = false
			for _, k in ipairs(c.clones) do
				if now >= k.t0 and k.state == "run" then
					live = true
					local tg = c.target
					local goal = (tg and tg.alive) and tg.p or c.aim
					local to = goal - k.pos
					if to.Magnitude <= (st.reach or 2.2) and tg and tg.alive then
						k.state, k.endT = "strike", now
						self:arenaHit(c, tg, st.hit, k.pos, st.hitKind)
					elseif (k.pos - c.cpos).Magnitude > (st.range or c.M.range or 30) then
						k.state, k.endT = "poof", now
					else
						k.pos += to.Unit * (st.speed or 34) * dt
					end
				elseif k.state == "run" then live = true
				elseif k.state == "strike" and now - k.endT > 0.35 then k.state = "poof"
				elseif k.state == "strike" then live = true end
			end
			if not live and u >= 0.6 then self:nextStage(c) end
		end
	end

	function Sim:releaseArena(c)
		if c.grab then c.grab.held = false; self:writeTarget(c.grab); c.grab = nil end
		if c.struck then c.struck.held = false; self:writeTarget(c.struck); c.struck = nil end
		local o = self.owners and self.owners[c.owner]
		if o then o.guards[c.id] = nil end
	end

	-- a thrown kunai reaching the caster: a guard may stop it (true = it is dealt with)
	function Sim:guardThreat(k, q)
		for _, o in pairs(self.owners or {}) do
			for id, c in pairs(o.guards) do
				local st = self:stageOf(c)
				local R = st.radius or 3.2
				if c.phase == "guard_go" and (q - c.cpos).Magnitude <= R then
					local mode = st.mode or "block"
					local from = -k.dir
					if mode == "block" and from:Dot(c.guardFace) < math.cos(math.rad(st.arc or 70)) then continue end
					c.blocked = (c.blocked or 0) + 1
					c.result, c.hitKind = "hit", st.hitKind or "Abgewehrt"
					if not c.hitNames[k.from] then c.hitNames[k.from] = true; c.hitName = c.hitName and (c.hitName .. "+" .. k.from) or k.from end
					c.hitT = c.t
					c.lastBlock = { pos = q, t = self.t }
					table.insert(c.impacts, { pos = q, t = self.t })
					if mode == "reflect" then
						-- back along its line to the thrower
						k.dir, k.state, k.reflected = -k.dir, "fly", true
						k.at = self.targets[k.from] and self.targets[k.from].p or (k.p - k.dir * 30)
						k.flown = 0
						return "reflect"
					elseif mode == "phase" then
						k.phased = true
						return "phase"
					elseif mode == "swap" then
						-- the log takes it; the caster is a few steps aside
						local side = Vector2.new(-k.dir.Y, k.dir.X)
						c.swapFrom = c.cpos
						c.cpos = c.cpos + side * (st.swap or 6)
						return "swap"
					end
					return "block"
				end
			end
		end
		return nil
	end

	------------------------------------------------------------------ attributes for the clients
	function Sim:writeArena(c)
		local f = c.f
		f:SetAttribute("T", c.t); f:SetAttribute("Phase", c.phase); f:SetAttribute("PT", c.pt); f:SetAttribute("Result", c.result)
		f:SetAttribute("Stage", c.stage)
		f:SetAttribute("CX", c.cpos.X); f:SetAttribute("CZ", c.cpos.Y); f:SetAttribute("CY", c.cy or 0)
		f:SetAttribute("AX", c.aim.X); f:SetAttribute("AZ", c.aim.Y); f:SetAttribute("ADX", c.adir.X); f:SetAttribute("ADZ", c.adir.Y)
		f:SetAttribute("HitKind", c.hitKind)
		if c.hitT then f:SetAttribute("HitT", c.hitT); f:SetAttribute("HitName", c.hitName) end
		if c.lockT then f:SetAttribute("LockT", c.lockT) end
		if c.actT then f:SetAttribute("ActT", c.actT) end
		f:SetAttribute("NP", #c.projs)
		for i, pr in ipairs(c.projs) do
			f:SetAttribute("P" .. i .. "X", pr.pos.X); f:SetAttribute("P" .. i .. "Z", pr.pos.Y); f:SetAttribute("P" .. i .. "S", pr.state)
			f:SetAttribute("P" .. i .. "DX", pr.d.X); f:SetAttribute("P" .. i .. "DZ", pr.d.Y); f:SetAttribute("P" .. i .. "D", pr.s)
		end
		f:SetAttribute("NI", #c.impacts)
		for i, im in ipairs(c.impacts) do f:SetAttribute("I" .. i .. "X", im.pos.X); f:SetAttribute("I" .. i .. "Z", im.pos.Y); f:SetAttribute("I" .. i .. "T", im.t) end
		if c.L then f:SetAttribute("L", c.L); f:SetAttribute("LX", c.lorg.X); f:SetAttribute("LZ", c.lorg.Y); f:SetAttribute("LDX", c.ldir.X); f:SetAttribute("LDZ", c.ldir.Y) end
		if c.blast then f:SetAttribute("BX", c.blast.X); f:SetAttribute("BZ", c.blast.Y); f:SetAttribute("Wave", c.wave or 0); f:SetAttribute("WaveT", c.waveT or 0) end
		if c.tip then f:SetAttribute("TX", c.tip.X); f:SetAttribute("TZ", c.tip.Y) end
		f:SetAttribute("Grab", c.grab and c.grab.name or (c.struck and c.struck.name) or "")
		if c.zone then f:SetAttribute("ZX", c.zone.X); f:SetAttribute("ZZ", c.zone.Y) end
		if c.land then f:SetAttribute("LandX", c.land.X); f:SetAttribute("LandZ", c.land.Y) end
		if c.from then f:SetAttribute("FX", c.from.X); f:SetAttribute("FZ", c.from.Y) end
		if c.swapFrom then f:SetAttribute("SwX", c.swapFrom.X); f:SetAttribute("SwZ", c.swapFrom.Y) end
		f:SetAttribute("Blocked", c.blocked or 0)
		if c.lastBlock then f:SetAttribute("BlkX", c.lastBlock.pos.X); f:SetAttribute("BlkZ", c.lastBlock.pos.Y); f:SetAttribute("BlkT", c.lastBlock.t) end
		f:SetAttribute("Heal", c.healWho or ""); f:SetAttribute("Healed", c.healed and math.floor(c.healed + 0.5) or 0)
		f:SetAttribute("NC", #c.clones)
		for i, k in ipairs(c.clones) do f:SetAttribute("K" .. i .. "X", k.pos.X); f:SetAttribute("K" .. i .. "Z", k.pos.Y); f:SetAttribute("K" .. i .. "S", (c.t >= k.t0) and k.state or "wait") end
	end
end

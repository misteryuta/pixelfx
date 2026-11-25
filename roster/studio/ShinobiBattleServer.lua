-- Roster battle, server side. The server owns the fight: which variant you play, its slots, HP, chakra, cooldowns,
-- positions and every state a technique leaves (bound, genjutsu, sealed, shield, phasing, transformed ...).
-- A cast is checked here (variant owns the slot, a clip exists, not bound/sealed/in genjutsu, off cooldown, chakra,
-- target in range, stage free), then the effect lands on the clip's own contact times (ShinobiRoster slot.contacts,
-- measured from the baked frames), so the hit the server reports is the frame the player sees.
-- One clip plays at a time ("the stage"): while one fighter's technique runs, the other waits.
local RS = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Roster = require(RS:WaitForChild("ShinobiRoster"))
local Rules = require(RS:WaitForChild("ShinobiRules"))
local K = Rules.KINDS

local folder = RS:FindFirstChild("ShinobiRemotes") or Instance.new("Folder")
folder.Name = "ShinobiRemotes"
folder.Parent = RS
local function remote(class, name)
	local r = folder:FindFirstChild(name) or Instance.new(class)
	r.Name = name
	r.Parent = folder
	return r
end
local Fn = remote("RemoteFunction", "Battle")
local Ev = remote("RemoteEvent", "Event")

local now = os.clock
local READY_WAIT = 4
local battles = {}

local function fighter(v, x, face)
	local hp = Rules.hp(v.ovr)
	return { id = v.id, v = v, hp = hp, maxHp = hp, ck = Rules.CK_MAX, x = x, face = face, st = {}, cd = {}, casting = nil, nextStrike = 0 }
end
local function has(f, s)
	local e = f.st[s]
	return e ~= nil and e.untilT > now()
end
local function setState(f, s, dur, extra)
	local e = extra or {}
	e.untilT = math.max(now() + dur, f.st[s] and f.st[s].untilT or 0)
	f.st[s] = e
end
local function snapF(f)
	local st = {}
	for k, e in pairs(f.st) do
		local left = e.untilT - now()
		if left > 0 then st[k] = math.floor(left * 10 + 0.5) / 10 end
	end
	local cd = {}
	for k, t in pairs(f.cd) do
		local left = t - now()
		if left > 0 then cd[k] = math.floor(left * 10 + 0.5) / 10 end
	end
	return { id = f.id, hp = math.max(0, math.floor(f.hp + 0.5)), maxHp = f.maxHp, ck = math.floor(f.ck), x = f.x, face = f.face, st = st, cd = cd, casting = f.casting and f.casting.slot or nil }
end
local function snap(b)
	return { me = snapF(b.me), foe = snapF(b.foe), over = b.over, winner = b.winner, stageBusy = b.stageUntil > now() }
end
local function send(b, ev)
	if b.player.Parent then Ev:FireClient(b.player, ev, snap(b)) end
end

-- ── effects ──────────────────────────────────────────────────────────
local function ko(b)
	for _, side in ipairs({ "me", "foe" }) do
		if b[side].hp <= 0 and not b.over then
			b[side].hp = 0
			b.over, b.winner = true, side == "me" and "foe" or "me"
			send(b, { type = "ko", loser = side })
		end
	end
end
-- damage onto `d`; phasing lets it through, a shield takes most of it, a summon takes one hit
local function hurt(b, a, d, dmg)
	if has(d, "intangible") then return "phased", 0 end
	if has(d, "summon") and not d.st.summon.used then d.st.summon.used = true; return "absorbed", 0 end
	local res = "hit"
	-- a shield takes most of a blow; a full guard (the Yata Mirror nullifies any attack) takes all of it
	if has(d, "shield") then dmg *= d.st.shield.full and 0 or 0.15; res = "blocked" end
	if has(d, "transformed") then dmg *= K.transform.guard end
	if has(a, "transformed") then dmg *= K.transform.mult end
	if has(a, "buff") then dmg *= K.buff.mult end
	d.hp -= dmg
	-- a hit on someone holding a bind breaks their hold
	if dmg >= 5 and has(d, "channel") then
		local tgt = d.st.channel.target
		d.st.channel = nil
		if tgt and tgt.st.bound then tgt.st.bound = nil end
		res = res .. "+released"
	end
	return res, dmg
end

local function apply(b, a, d, s, i, n, castSeq, cs)
	if b.over or not a.casting or a.casting.seq ~= castSeq then return end
	local k, sc = K[s.kind], Rules.scale(a.v.ovr)
	local ev = { type = "impact", by = a == b.me and "me" or "foe", slot = s.slot, kind = s.kind, i = i, n = n }
	local first = i == 1
	local function damage(total, split)
		local res, dealt = hurt(b, a, d, total * sc / (split and n or 1))
		ev.result, ev.dmg = res, math.floor(dealt + 0.5)
	end
	if s.kind == "strike" or s.kind == "projectile" or s.kind == "aoe" then
		damage(k.dmg, true)
	elseif s.kind == "bind" then
		if first then
			damage(k.dmg, false)
			if ev.result ~= "phased" then
				-- held from the first contact to the clip's release (its last contact), or past the clip if it shows none
				local rel = (n > 1 and cs[n] or (s.len + k.hold)) - cs[1]
				setState(d, "bound", rel, { by = a })
				setState(a, "channel", rel, { target = d })
				ev.state = "bound"
			end
		elseif i == n and n > 1 then
			-- the release frame: the hold ends here
			d.st.bound, a.st.channel = nil, nil
			damage(k.dmg * 0.6, false)
			ev.state = "released"
		else
			-- blows on the held target (a crush, a clone's cut) while the hold lasts
			damage(k.dmg * 0.5, false)
			ev.state = has(d, "bound") and "bound" or nil
		end
	elseif s.kind == "illusion" or s.kind == "seal" then
		if first then
			damage(k.dmg, false)
			if ev.result ~= "phased" then
				local st = s.kind == "illusion" and "illusion" or "sealed"
				-- Tsukuyomi (params.noKai): normal genjutsu release does not work on it (Narutopedia)
				setState(d, st, (s.len - cs[1]) + k.dur, { noKai = s.params and s.params.noKai or nil })
				ev.state = st
				if d.casting then d.casting = nil end
			end
		end
	elseif s.kind == "drain" then
		damage(k.dmg, true)
		if ev.result == "hit" then
			local take = math.min(d.ck, k.drain / n)
			d.ck -= take
			a.ck = math.min(Rules.CK_MAX, a.ck + take / 2)
		end
	elseif s.kind == "teleport" then
		if first then
			-- appear behind the target, then strike
			local side = (a.x < d.x) and 1 or -1
			a.x = math.clamp(d.x + side * Rules.MIN_GAP * 1.2, Rules.MIN_X, Rules.MAX_X)
			a.face = -side
			ev.state = "teleported"
		end
		damage(k.dmg, true)
	elseif s.kind == "summon" then
		damage(k.dmg, true)
		if first then setState(a, "summon", (s.len - cs[1]) + k.after); ev.state = "summon" end
	elseif s.kind == "heal" then
		if first then
			a.hp = math.min(a.maxHp, a.hp + k.heal * sc)
			ev.state, ev.result = "healed", "healed"
		end
	elseif s.kind == "defense" then
		if first then setState(a, "shield", (s.len - cs[1]) + k.after); ev.state = "shield" end
	elseif s.kind == "barrier" then
		if first then setState(a, "shield", (s.len - cs[1]) + k.after); ev.state = "shield" end
		if not first or n == 1 then
			local res, dealt = hurt(b, a, d, k.dmg * sc / math.max(1, n - 1))
			ev.result, ev.dmg = res, math.floor(dealt + 0.5)
		end
	elseif s.kind == "intangible" then
		if first then setState(a, "intangible", (s.len - cs[1]) + k.after); ev.state = "intangible" end
	elseif s.kind == "transform" or s.kind == "buff" then
		if first then
			local st = s.kind == "transform" and "transformed" or "buff"
			setState(a, st, (s.len - cs[1]) + k.after)
			ev.state = st
		end
	end
	send(b, ev)
	ko(b)
end

-- start a cast for fighter `a` against `d`; returns ok, why / info
-- ── LIVE moves: played on the training ground itself (no clip, no camera, no stage lock). Their hit windows,
-- floor waves and projectiles are checked against where the target is at that moment, so they can miss.
local Live = RS:FindFirstChild("ShinobiLive") and require(RS.ShinobiLive) or {}
local function liveOf(s) return s.params and s.params.live and Live[s.params.live] or nil end
local function frameAt(L, t) return math.clamp(math.floor(t * L.fps + 0.5) + 1, 1, #L.actor.anchors) end
local function castLive(b, a, d, slot, s, L)
	if a.casting then return false, "BUSY" end
	if b.stageUntil > now() then return false, "STAGE_BUSY" end
	if has(a, "bound") then return false, "BOUND" end
	if has(a, "illusion") then return false, "IN_GENJUTSU" end
	if has(a, "sealed") then return false, "SEALED" end
	local k = K[s.kind]
	if (a.cd[slot] or 0) > now() then return false, "COOLDOWN" end
	if a.ck < k.cost then return false, "CHAKRA" end
	a.ck -= k.cost
	a.cd[slot] = now() + k.cd + L.len
	b.seq += 1
	local seq, by = b.seq, a == b.me and "me" or "foe"
	-- he turns to the target as he starts and stays rooted where he stands until it is over
	local face = (d.x >= a.x) and 1 or -1
	a.face = face
	local x0 = a.x
	a.casting = { slot = slot, seq = seq, t0 = nil, live = true }
	local boxHit = false
	local function alive() return battles[b.player] == b and not b.over and a.casting ~= nil and a.casting.seq == seq end
	local function dmgOf(h) return k.dmg * Rules.scale(a.v.ovr) * (h.dmg or 1) end
	local function run(h)
		if h.shape == "box" then
			local rel = (d.x - x0) * face
			if rel >= h.x0 and rel <= h.x1 then
				boxHit = true
				local res, dealt = hurt(b, a, d, dmgOf(h))
				b.contact[seq] = d.x
				send(b, { type = "liveHit", by = by, name = h.name, result = res, dmg = math.floor(dealt + 0.5), x = d.x, seq = seq })
			else
				-- a miss: the contact is where the named anchor (the blade's tip) is on that frame
				local an = L.actor.anchors[frameAt(L, h.t)][h.contact or "tip"]
				b.contact[seq] = x0 + face * (an and an[1] or h.x1)
				send(b, { type = "liveMiss", by = by, name = h.name, x = b.contact[seq], seq = seq })
			end
			ko(b)
		elseif h.shape == "wave" then
			-- runs on along the floor from the contact; it can catch someone who stepped just out of the cut
			local wx, t1, done = b.contact[seq] or (x0 + face * 40), now() + h.life, boxHit
			task.spawn(function()
				local last = now()
				while now() < t1 and battles[b.player] == b and not b.over do
					task.wait()
					local dt = now() - last
					last = now()
					wx += face * h.vx * dt
					if not done and math.abs(wx - d.x) < h.w then
						done = true
						local res, dealt = hurt(b, a, d, dmgOf(h))
						send(b, { type = "liveHit", by = by, name = h.name, result = res, dmg = math.floor(dealt + 0.5), x = d.x, seq = seq })
						ko(b)
					end
				end
			end)
		elseif h.shape == "projectile" then
			-- flies on its own from where it left the bow; a raised guard in its path stops it at the guard's face
			local px, py = x0 + face * (h.anchorPos and h.anchorPos[1] or 30), h.anchorPos and h.anchorPos[2] or -50
			send(b, { type = "proj", by = by, name = h.name, x = px, y = py, vx = face * h.vx, life = h.life, seq = seq })
			local t1 = now() + h.life
			task.spawn(function()
				local last = now()
				while now() < t1 and battles[b.player] == b and not b.over do
					task.wait()
					local dt = now() - last
					last = now()
					px += face * h.vx * dt
					local ahead = (d.x - px) * face
					if has(d, "shield") and ahead <= 26 then
						local res, dealt = hurt(b, a, d, dmgOf(h))
						send(b, { type = "projEnd", by = by, name = h.name, result = res, dmg = math.floor(dealt + 0.5), x = px, seq = seq })
						ko(b)
						return
					elseif ahead <= h.w * 0.5 then
						local res, dealt = hurt(b, a, d, dmgOf(h))
						send(b, { type = "projEnd", by = by, name = h.name, result = res, dmg = math.floor(dealt + 0.5), x = px, seq = seq })
						ko(b)
						return
					end
				end
				if battles[b.player] == b then send(b, { type = "projEnd", by = by, name = h.name, result = "expired", x = px, seq = seq }) end
			end)
		elseif h.shape == "self" then
			setState(a, h.state, (h["until"] or L.len) - h.t + 0.1, { full = h.full == true or nil })
			send(b, { type = "liveState", by = by, state = h.state, seq = seq })
		end
	end
	local function start()
		if a.casting == nil or a.casting.seq ~= seq or a.casting.t0 then return end
		a.casting.t0 = now()
		for _, h in ipairs(L.hits) do
			task.delay(h.t, function() if alive() or (h.shape ~= "box" and h.shape ~= "self" and battles[b.player] == b) then run(h) end end)
		end
		-- the rival sees it coming: a chance to step back out of a cut or an arrow's reach
		if by == "me" and not b.passive and not has(d, "bound") then
			for _, h in ipairs(L.hits) do
				if (h.shape == "box" or h.shape == "projectile") and math.random() < 0.5 then
					b.dodge = { t = now() + math.max(0.15, h.t - 0.55), dir = face, steps = 3 }
					break
				end
			end
		end
		task.delay(L.len, function()
			if a.casting and a.casting.seq == seq then a.casting = nil end
			if battles[b.player] == b then send(b, { type = "castEnd", by = by, slot = slot, seq = seq }) end
		end)
	end
	b.starts[seq] = start
	task.delay(READY_WAIT, start)
	local info = { seq = seq, slot = slot, live = s.params.live, len = L.len, kind = s.kind, by = by, x0 = x0, face = face }
	send(b, { type = "cast", info = info })
	return true, info
end

local function cast(b, a, d, slot)
	if b.over then return false, "OVER" end
	local s = a.v.slots[slot]
	if not s then return false, "NO_SLOT" end
	local L = liveOf(s)
	if L then return castLive(b, a, d, slot, s, L) end
	if not s.clip then return false, "NO_CLIP" end
	if a.casting then return false, "BUSY" end
	if b.stageUntil > now() then return false, "STAGE_BUSY" end
	if has(a, "bound") then return false, "BOUND" end
	if has(a, "illusion") then return false, "IN_GENJUTSU" end
	if has(a, "sealed") then return false, "SEALED" end
	local k = K[s.kind]
	if (a.cd[slot] or 0) > now() then return false, "COOLDOWN" end
	if a.ck < k.cost then return false, "CHAKRA" end
	if not k.self and math.abs(a.x - d.x) > k.range then return false, "OUT_OF_RANGE" end
	a.ck -= k.cost
	a.cd[slot] = now() + k.cd + s.len
	b.seq += 1
	local seq = b.seq
	local contacts = (#s.contacts > 0) and s.contacts or { s.main }
	-- the clip's clock starts when the client has it loaded and shows frame 1 ("go"), so the contact the server
	-- reports is the frame on screen; without an answer it starts anyway after READY_WAIT
	a.casting = { slot = slot, seq = seq, t0 = nil }
	b.stageUntil = now() + READY_WAIT + s.len
	local function start()
		if a.casting == nil or a.casting.seq ~= seq or a.casting.t0 then return end
		a.casting.t0 = now()
		b.stageUntil = now() + s.len
		for i, c in ipairs(contacts) do
			task.delay(c, function() if battles[b.player] == b then apply(b, a, d, s, i, #contacts, seq, contacts) end end)
		end
		task.delay(s.len, function()
			if a.casting and a.casting.seq == seq then a.casting = nil end
			if battles[b.player] == b then send(b, { type = "castEnd", by = a == b.me and "me" or "foe", slot = slot, seq = seq }) end
		end)
	end
	b.starts[seq] = start
	task.delay(READY_WAIT, start)
	local info = { seq = seq, slot = slot, clip = s.clip, len = s.len, contacts = contacts, kind = s.kind, by = a == b.me and "me" or "foe" }
	send(b, { type = "cast", info = info })
	return true, info
end

-- a plain blow (no clip): the idle scene shows it; also what breaks a hold
local function strike(b, a, d)
	if b.over or a.casting or b.stageUntil > now() then return false, "BUSY" end
	if has(a, "bound") then return false, "BOUND" end
	if a.nextStrike > now() then return false, "COOLDOWN" end
	if math.abs(a.x - d.x) > Rules.STRIKE.range then return false, "OUT_OF_RANGE" end
	a.nextStrike = now() + Rules.STRIKE.cd
	local by = a == b.me and "me" or "foe"
	send(b, { type = "strike", by = by })
	task.delay(Rules.STRIKE.contact, function()
		if battles[b.player] ~= b or b.over then return end
		local res, dealt = hurt(b, a, d, Rules.STRIKE.dmg * Rules.scale(a.v.ovr))
		send(b, { type = "impact", by = by, kind = "taijutsu", i = 1, n = 1, result = res, dmg = math.floor(dealt + 0.5) })
		ko(b)
	end)
	return true
end

local function newBattle(plr, vid, rid)
	local v = Roster.byId[vid]
	if not v then return nil, "UNKNOWN_VARIANT" end
	local r = rid and Roster.byId[rid]
	if not r then
		local pool = {}
		for _, o in ipairs(Roster.variants) do
			if o.era == v.era and o.id ~= v.id then
				for _, s in ipairs(o.slots) do if s.clip or liveOf(s) then table.insert(pool, o); break end end
			end
		end
		r = pool[math.random(1, #pool)]
	end
	local b = { player = plr, me = fighter(v, 150, 1), foe = fighter(r, 290, -1), seq = 0, starts = {}, contact = {}, stageUntil = 0, over = false, passive = false, think = now() + 3 }
	battles[plr] = b
	return b
end

-- the rival: waits while the stage is busy, can't act bound or in genjutsu (tries to break it), casts its slots in
-- range, steps in, throws plain blows
local function think(b)
	local f, me = b.foe, b.me
	if b.over or b.passive or now() < b.think or f.casting or b.stageUntil > now() then return end
	b.think = now() + 1.2 + math.random() * 1.6
	if has(f, "bound") then return end
	if has(f, "illusion") then
		if not f.st.illusion.noKai and f.ck >= Rules.BREAK_COST and math.random() < 0.35 then f.ck -= Rules.BREAK_COST; f.st.illusion = nil; send(b, { type = "break", by = "foe" }) end
		return
	end
	local dist = math.abs(f.x - me.x)
	if not has(f, "sealed") and math.random() < 0.55 then
		local opts = {}
		for i, s in ipairs(f.v.slots) do
			local k = K[s.kind]
			if (s.clip or liveOf(s)) and (f.cd[i] or 0) <= now() and f.ck >= k.cost and (k.self or dist <= k.range) then table.insert(opts, i) end
		end
		if #opts > 0 then cast(b, f, me, opts[math.random(1, #opts)]); return end
	end
	if dist > Rules.STRIKE.range then
		f.x = math.clamp(f.x + (me.x > f.x and 1 or -1) * Rules.STEP, Rules.MIN_X, Rules.MAX_X)
		send(b, { type = "move", by = "foe" })
	else
		strike(b, f, me)
	end
end

local last = now()
RunService.Heartbeat:Connect(function()
	local t = now()
	local dt = t - last
	last = t
	for _, b in pairs(battles) do
		if not b.over then
			for _, f in ipairs({ b.me, b.foe }) do f.ck = math.min(Rules.CK_MAX, f.ck + Rules.CK_REGEN * dt) end
			-- the rival stepping back out of a live attack it saw coming, one step every 0.12 s
			if b.dodge and t >= b.dodge.t and not b.foe.casting and not has(b.foe, "bound") then
				b.foe.x = math.clamp(b.foe.x + b.dodge.dir * Rules.STEP, Rules.MIN_X, Rules.MAX_X)
				send(b, { type = "move", by = "foe", dodge = true })
				b.dodge.steps -= 1
				b.dodge.t = t + 0.12
				if b.dodge.steps <= 0 then b.dodge = nil end
			end
			think(b)
		end
	end
end)
-- push a state tick a few times a second so timers and states on screen stay true
task.spawn(function()
	while true do
		task.wait(0.25)
		for _, b in pairs(battles) do send(b, { type = "tick" }) end
	end
end)

Fn.OnServerInvoke = function(plr, action, arg)
	arg = typeof(arg) == "table" and arg or {}
	local b = battles[plr]
	if action == "select" then
		if typeof(arg.variant) ~= "string" then return { ok = false, why = "BAD_ARG" } end
		local nb, why = newBattle(plr, arg.variant, typeof(arg.rival) == "string" and arg.rival or nil)
		if not nb then return { ok = false, why = why } end
		if RunService:IsStudio() and arg.passive == true then nb.passive = true end
		return { ok = true, me = nb.me.id, foe = nb.foe.id, state = snap(nb) }
	end
	if not b then return { ok = false, why = "NO_BATTLE" } end
	if action == "cast" then
		if typeof(arg.slot) ~= "number" then return { ok = false, why = "BAD_ARG" } end
		local ok, info = cast(b, b.me, b.foe, math.floor(arg.slot))
		if not ok then return { ok = false, why = info, state = snap(b) } end
		return { ok = true, info = info, state = snap(b) }
	elseif action == "strike" then
		local ok, why = strike(b, b.me, b.foe)
		return { ok = ok, why = why, state = snap(b) }
	elseif action == "move" then
		local dir = arg.dir == -1 and -1 or 1
		if has(b.me, "bound") or b.me.casting or b.stageUntil > now() then return { ok = false, why = "CANT_MOVE", state = snap(b) } end
		local nx = math.clamp(b.me.x + dir * Rules.STEP, Rules.MIN_X, Rules.MAX_X)
		-- no walking through the rival
		if (nx - b.foe.x) * (b.me.x - b.foe.x) <= 0 or math.abs(nx - b.foe.x) < Rules.MIN_GAP then nx = b.me.x end
		b.me.x = nx
		b.me.face = b.foe.x > b.me.x and 1 or -1
		return { ok = true, state = snap(b) }
	elseif action == "break" then
		if not has(b.me, "illusion") then return { ok = false, why = "NO_GENJUTSU", state = snap(b) } end
		if b.me.st.illusion.noKai then return { ok = false, why = "NO_KAI", state = snap(b) } end
		if b.me.ck < Rules.BREAK_COST then return { ok = false, why = "CHAKRA", state = snap(b) } end
		b.me.ck -= Rules.BREAK_COST
		b.me.st.illusion = nil
		send(b, { type = "break", by = "me" })
		return { ok = true, state = snap(b) }
	elseif action == "go" then
		local f = typeof(arg.seq) == "number" and b.starts[arg.seq]
		if f then b.starts[arg.seq] = nil; f() end
		return { ok = f ~= nil and f ~= false }
	elseif action == "state" then
		return { ok = true, state = snap(b) }
	elseif action == "leave" then
		battles[plr] = nil
		return { ok = true }
	elseif action == "test" and RunService:IsStudio() then
		-- Studio-only test switches: refill, clear cooldowns, rival passive, put the rival in range, apply a state
		if arg.refill then b.me.ck, b.foe.ck = Rules.CK_MAX, Rules.CK_MAX; b.me.cd = {}; b.foe.cd = {} end
		if arg.passive ~= nil then b.passive = arg.passive == true end
		if arg.dodgeNow then b.dodge = { t = now(), dir = (b.foe.x >= b.me.x) and 1 or -1, steps = arg.dodgeNow } end
		if typeof(arg.foeX) == "number" then b.foe.x = math.clamp(arg.foeX, Rules.MIN_X, Rules.MAX_X) end
		if typeof(arg.meX) == "number" then b.me.x = math.clamp(arg.meX, Rules.MIN_X, Rules.MAX_X) end
		if arg.heal then b.me.hp, b.foe.hp = b.me.maxHp, b.foe.maxHp; b.over = false; b.winner = nil end
		if typeof(arg.gap) == "number" then b.foe.x = math.clamp(b.me.x + arg.gap, Rules.MIN_X, Rules.MAX_X) end
		if typeof(arg.state) == "string" and typeof(arg.dur) == "number" then setState(arg.who == "foe" and b.foe or b.me, arg.state, arg.dur) end
		if arg.foeCast then local ok, why = cast(b, b.foe, b.me, arg.foeCast); return { ok = ok, why = why, state = snap(b) } end
		if arg.foeStrike then local ok, why = strike(b, b.foe, b.me); return { ok = ok, why = why, state = snap(b) } end
		return { ok = true, state = snap(b) }
	end
	return { ok = false, why = "BAD_ACTION" }
end

-- leaving, dying or respawning ends the fight; the client resets camera, controls and its own states on "reset"
local function reset(plr, why)
	if battles[plr] then
		battles[plr] = nil
		if plr.Parent then Ev:FireClient(plr, { type = "reset", why = why }, nil) end
	end
end
Players.PlayerRemoving:Connect(function(plr) battles[plr] = nil end)
Players.PlayerAdded:Connect(function(plr)
	plr.CharacterAdded:Connect(function() reset(plr, "respawn") end)
end)
for _, plr in ipairs(Players:GetPlayers()) do plr.CharacterAdded:Connect(function() reset(plr, "respawn") end) end
